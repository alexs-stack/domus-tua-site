# Sicurezza & abuso — superfici pubbliche

> Documento **interno sersan**. Riassume le difese in essere sulle superfici pubbliche del sito
> e cosa NON deve mai finire lato client o online. Livello adeguato a un lancio/preview MVP; le
> note "produzione" indicano dove alzare l'asticella con più traffico.

---

## 1. Endpoint pubblici

Due sole API pubbliche, entrambe `POST`, entrambe difensive:

- **`/api/search`** — frase in linguaggio naturale → filtri → ranking. Non scrive nulla.
- **`/api/lead`** — cattura lead dal form contatti; inoltra al Google Sheet se configurato.

Un terzo endpoint, **`/api/health`** (`GET`), espone solo booleani/enum di stato — **mai segreti**
(vedi `docs/vercel-live-checklist.md`).

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
| `/api/search` | 20 richieste | 10 minuti |
| `/api/lead` | 8 invii | 10 minuti |

- IP letto da `x-forwarded-for` (primo valore), poi `x-real-ip`, fallback `"unknown"`.
- Oltre il limite → **`429`** con body `{ ok:false, reason:"rate-limited" }` e header `Retry-After`.
- Il client fa comunque fallback: la ricerca ripiega sui filtri manuali, il lead sul WhatsApp.

> **Limite noto (MVP):** la memoria è **per-istanza** serverless — il limite è best-effort,
> non globale, e si azzera a freddo. Sufficiente per preview/lancio. In **produzione** ad alto
> traffico spostare lo store su **Upstash Redis** o **Vercel KV** (stessa firma `rateLimit()`,
> cambia solo l'implementazione dello store).

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

- [ ] Store rate-limit condiviso (Upstash/Vercel KV) al posto dell'in-memory.
- [ ] Eventuale token/header su `/api/health` se un domani esponesse dati più sensibili.
- [ ] Monitoraggio dei `429` e degli errori webhook (log drain / alerting).
- [ ] Valutare un CAPTCHA invisibile solo se l'honeypot non bastasse contro spam mirato.
