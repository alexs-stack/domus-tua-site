# Sicurezza & abuso — superfici pubbliche

> Documento **interno sersan**. Riassume le difese in essere sulle superfici pubbliche del sito
> e cosa NON deve mai finire lato client o online. Livello adeguato a un lancio/preview MVP; le
> note "produzione" indicano dove alzare l'asticella con più traffico.

---

## 1. Endpoint pubblici

Quattro API pubbliche `POST`, tutte difensive e tutte dietro lo **stesso** rate limiter condiviso:

- **`/api/assistant`** — turno di chat dell'assistente (streaming SSE).
- **`/api/assistant/lead`** — richiesta scritta dell'assistente → email all'agenzia.
- **`/api/lead`** — cattura lead dal form contatti → email (Resend) e/o Google Sheet.
- **`/api/search`** — frase in linguaggio naturale → filtri → ranking. Non scrive nulla.

Un quinto endpoint, **`/api/health`** (`GET`), espone solo booleani/enum di stato — **mai segreti**
(vedi `docs/vercel-live-checklist.md`) — e non è rate-limited.

---

## 2. Honeypot (anti-bot form)

Il form contatti include un campo nascosto **`company`** che un umano non vede né compila.
Se arriva valorizzato, `/api/lead` **finge successo** (`ok:true`) e **non scrive** sul foglio:
il bot crede di aver inviato, il foglio resta pulito. Zero frizione per gli utenti reali,
nessun CAPTCHA. (`app/api/lead/route.ts`.)

---

## 3. Rate limiting

`app/lib/security/rateLimit.ts` — limitatore **in-memory per IP**, sliding-window:

| Endpoint | Limite | Finestra |
|---|---|---|
| Endpoint | Limite | Finestra | Chiave |
|---|---|---|---|
| `/api/assistant` | 30 turni (env `ASSISTANT_RATE_LIMIT`) | 10 min | `assistant:<hash IP>` |
| `/api/assistant/lead` | 5 invii | 10 min | `assistant-lead:<hash IP>` |
| `/api/lead` | 8 invii | 10 min | `lead:<hash IP>` |
| `/api/search` | 20 richieste | 10 min | `search:<hash IP>` |

**Un solo argine condiviso.** Tutte le route pubbliche passano da `rateLimitShared()`
(`app/lib/security/rateLimit.ts`), che usa un contatore **condiviso tra le istanze** su Redis REST
(Upstash/Vercel KV) quando `RATE_LIMIT_REDIS_URL` + `RATE_LIMIT_REDIS_TOKEN` sono impostate. Prima
lead e search usavano il contatore in-memory: su serverless ogni lambda aveva la sua Map, quindi
il limite reale era un multiplo imprevedibile. Ora è un limite unico e globale.

- **Chiave privacy-conscious:** `clientKey(req, prefix)` — l'IP è **hashato** (SHA-256 troncato),
  non finisce in chiaro nello store, e la chiave scade con la finestra (TTL Redis). Il `prefix`
  **isola gli endpoint**: un flood sulla ricerca non consuma la quota dei lead.
- **IP** letto da `x-forwarded-for` (primo valore = client su Vercel), poi `x-real-ip`, fallback
  `"unknown"` (un solo bucket). L'IP non è un'identità: NAT/reti mobili lo condividono e chi vuole
  può cambiarlo — è un argine contro flood/scraping, non contro un attaccante determinato.
- Oltre il limite → **`429`** con `{ ok:false, reason:"rate-limited" }` e header `Retry-After`.

**Comportamento in caso di outage dello store (fail-open):** se Redis non è configurato, è in
errore o è lento (timeout 1,5s), `rateLimitShared` **ripiega sul contatore in-memory** per-istanza
e logga il fatto. Scelta deliberata e uguale per tutti gli endpoint: un limite più debole è
preferibile a un sito che smette di rispondere perché Redis ha singhiozzato. Nessun endpoint
fallisce **chiuso** (nessuno restituisce 429/500 quando il limiter è giù): lead e search hanno
comunque un fallback client (WhatsApp; filtri manuali), l'assistente degrada a fallback testuale.

**Health e build non consumano quota:** `/api/health` (`GET`) **non** è rate-limited; le route
pubbliche non vengono chiamate durante `next build` (SSG legge il feed, non le API).

**Test:** `app/lib/security/__tests__/rateLimit.test.ts` (parsing IP, chiave hashata/deterministica,
isolamento per endpoint, finestra, fail-open sul locale) + `app/lib/assistant/__tests__/security.test.ts`.

**Env richieste (produzione):** `RATE_LIMIT_REDIS_URL`, `RATE_LIMIT_REDIS_TOKEN` (Upstash REST o
compatibile). Vuote = fallback in-memory (ok per preview, sconsigliato in produzione ad alto traffico).

---

## 4. Validazione lead

`app/lib/forms/validateLead.ts` — prima di persistere:

- **Whitelist campi:** solo campi noti (`intent`, `name`, `contact`, `place`, `propertyType`,
  `budget`, `features`, `message`, `consent`) + metadata ammessi (`sourcePage`, `propertySlug`,
  `locale`). Tutto il resto è **scartato** (niente injection di colonne nel foglio).
- **Cap di lunghezza** per ogni campo (es. `name` 120, `message` 1200): payload abnormi vengono
  troncati, non causano errore.
- **Obbligatori:** intento tra i quattro ammessi, `name`, `contact`. **Consenso:** se presente
  deve essere `true`.
- Errori "safe" e stabili: `bad-payload`, `invalid-intent`, `missing-name`, `missing-contact`,
  `missing-consent` — nessun dettaglio interno esposto.

---

## 5. Segreti & dati privati — regole ferree

- **Nessun segreto lato client.** Le uniche env `NEXT_PUBLIC_*` sono flag non sensibili
  (`SITE_URL`, `USE_REALSMART`, `PREVIEW_BADGE`, `ENABLE_I18N`). Chiavi/URL webhook/credenziali
  sono **server-only** (nessun prefisso `NEXT_PUBLIC_`) e non finiscono nel bundle del browser.
- **Nessun dato RealSmart privato.** Il sito consuma solo il **feed XML pubblico** degli annunci
  attivi. Campi gestionali/riservati (dati catastali, note interne, anagrafiche proprietari,
  provvigioni) **non** vanno mai esposti né mappati nelle schede pubbliche. Vedi
  `docs/realsmart-security.md` e `docs/realsmart-live-validation.md`.
- **Nessun dato Google Drive privato.** Foto/documenti sensibili su Drive del cliente non vanno
  linkati/incorporati direttamente: sul sito vanno solo asset pubblici approvati.
- **PII nei log:** `/api/lead` **non logga** nome/contatto in produzione quando il webhook manca
  (solo un riassunto non identificante con l'intento). Gli errori di rete loggano il messaggio,
  mai il contenuto del lead.

---

## 6. Da rivedere prima di scalare (produzione ad alto traffico)

- [x] Store rate-limit condiviso (Upstash/Vercel KV) al posto dell'in-memory — fatto: tutte le
      route usano `rateLimitShared`. Resta da IMPOSTARE `RATE_LIMIT_REDIS_URL`/`_TOKEN` in produzione
      (senza, fallback in-memory).
- [ ] Eventuale token/header su `/api/health` se un domani esponesse dati più sensibili.
- [ ] Monitoraggio dei `429` e degli errori webhook (log drain / alerting).
- [ ] Valutare un CAPTCHA invisibile solo se l'honeypot non bastasse contro spam mirato.
