# Vercel — verifica del deploy e azioni manuali rimaste

Questo documento risponde a una domanda sola: **cosa manca perché questo deploy possa stare
davanti a delle persone?** Non è una lista teorica — la produce il codice.

```bash
npm run verify:deploy -- https://domus-tua-ten.vercel.app --preview
npm run verify:deploy -- https://www.domustua.com --commit $(git rev-parse --short HEAD)
```

Lo script interroga `/api/health` dell'ambiente **in esecuzione** (non il codice locale) ed esce
con codice 1 se una verifica obbligatoria fallisce. Le verifiche che falliscono sono, alla
lettera, la lista di cose da fare in Vercel.

> **Il dominio non si tocca.** Niente DNS, niente cutover di domustua.com: qui si prepara un
> deploy verificabile, non si pubblica.

---

## 1. Cosa verifica

| Verifica | Fallisce quando | Obbligatoria |
|---|---|:--:|
| commit deployato | l'ambiente serve un commit diverso da quello atteso | sì |
| ambiente dichiarato | `VERCEL_ENV` non arriva | sì |
| `NEXT_PUBLIC_SITE_URL` | manca — il sito si dichiara non indicizzabile | sì |
| badge di anteprima | è acceso **in produzione** | sì |
| RealSmart live | il feed non è attivo o non è configurato | sì (avviso in anteprima) |
| mappa dei venduti | è vuota — un venduto può comparire fra i disponibili | sì |
| lead del form | nessuna destinazione configurata | sì (avviso in anteprima) |
| WhatsApp | il numero non c'è (problema di codice, non di Vercel) | sì |
| chatbot | è **visibile senza provider** | sì |
| Trustindex | il widget recensioni non è collegato | sì (avviso in anteprima) |
| ranking semantico | manca `VOYAGE_API_KEY` | no |
| hero video | non è ancora stato caricato | no |

`--preview` non abbassa le soglie: trasforma in avvisi le verifiche che dipendono da variabili
che *volutamente* non si impostano in anteprima. Serve a distinguere «non è ancora configurato»
da «è configurato male», che sono due problemi diversi.

---

## 2. Esito sull'anteprima attuale

Su `https://domus-tua-ten.vercel.app`:

```
✗ Il deploy espone una versione precedente di /api/health (manca il blocco "deploy").
  La verifica non è applicabile finché l'ambiente non viene ridistribuito con questo codice.
```

È l'esito corretto: l'anteprima pubblicata è **anteriore** a queste PR. Dopo il redeploy la
verifica diventa applicabile.

Sulla stessa build in locale, con `NEXT_PUBLIC_SITE_URL` impostata:

```
– commit deployato                     fuori da Vercel: non applicabile
– ambiente dichiarato                  fuori da Vercel: non applicabile
✓ NEXT_PUBLIC_SITE_URL impostato       https://www.domustua.com
✓ badge di anteprima                   acceso (consentito fuori dalla produzione)
✗ RealSmart live                       live: false, feed configurato: true
✓ mappa dei venduti presente           193 da OCR + 3 manuali
✓ lead del form: destinazione configurata  destinazione: sheets
✓ WhatsApp configurato                 true
✓ chatbot: acceso solo con un provider visibile: false, provider: false
✓ recensioni Trustindex collegate      true
! ranking semantico                    false
! hero video                           false
```

I due `✗` sono esattamente le due variabili che in locale non esistono: è quello che lo script
deve dire.

---

## 3. Le azioni manuali rimaste

Niente di tutto questo può farlo il codice: sono valori che vivono nella dashboard.

### Anteprima (Preview) — per far girare la verifica

| # | Variabile | Valore | Perché |
|---|---|---|---|
| 1 | `NEXT_PUBLIC_SITE_URL` | l'URL Vercel dell'anteprima | metadata, OG, sitemap; senza, il sito resta non indicizzabile |
| 2 | `GEMINI_API_KEY` | la chiave | ricerca in linguaggio naturale + assistente (alternativa: `ANTHROPIC_API_KEY`) |
| 3 | `TRUSTINDEX_WIDGET_URL` | URL del widget | recensioni (si caricano comunque solo dopo il consenso) |

Poi **Redeploy** dell'anteprima e `npm run verify:deploy -- <url-anteprima> --preview`.

### Produzione — prima della pubblicazione

| # | Variabile | Valore | Perché |
|---|---|---|---|
| 4 | `NEXT_PUBLIC_SITE_URL` | `https://www.domustua.com` | canonical, OG, sitemap, robots |
| 5 | `NEXT_PUBLIC_USE_REALSMART` | `true` | senza, il sito mostra le fixture demo |
| 6 | `REALSMART_*` | credenziali del feed | immobili reali |
| 7 | `SHEETS_WEBHOOK_URL` | URL della Web App Apps Script | senza, i lead non vengono archiviati: resta il solo WhatsApp |
| 10 | `TRUSTINDEX_WIDGET_URL` | URL del widget | recensioni |
| 11 | **`NEXT_PUBLIC_PREVIEW_BADGE`** | **da NON impostare** | il badge "contenuti in verifica" non deve comparire ai clienti |
| 12 | **`NEXT_PUBLIC_ENABLE_ASSISTANT`** | **da NON impostare** | la chat si accende solo dopo gli eval con soglie verdi ([assistant-rollout.md](assistant-rollout.md)) |

Facoltative: `VOYAGE_API_KEY` (ranking semantico; senza, la ricerca usa le parole chiave),
`AI_SEARCH_MODEL` / `AI_ASSISTANT_MODEL` (override dei modelli), `INSTAGRAM_WIDGET_URL`.

### Fuori da Vercel

| # | Azione | Dove |
|---|---|---|
| 14 | Caricare il video dell'hero, se e quando si vuole | repository, [hero-video.md](hero-video.md) |
| 15 | Rigenerare la mappa dei venduti quando l'agenzia cambia le copertine (`npm run detect-sold`) | repository |

### Non ancora, e di proposito

**Il DNS di domustua.com non si tocca.** Il cutover è una decisione separata, da prendere quando
la verifica in produzione passa e il cliente ha visto il sito.

---

## 4. `/api/health`

Espone **solo** booleani, enum e metadati pubblici: commit del deploy (già visibile su GitHub),
ambiente, `NEXT_PUBLIC_SITE_URL` (già nel bundle client), il nome del modello dell'assistente.
Mai chiavi, mai URL con credenziali. C'è un test che lo verifica per costruzione
(`app/lib/__tests__/health.test.ts`): elenca le stringhe ammesse e fallisce su qualunque altra.

```bash
curl -s https://<dominio>/api/health | jq
```

```jsonc
{
  "ok": true,
  "timestamp": "2026-08-01T09:00:00.000Z",
  "deploy": {
    "commit": "8de5e2c",          // commit in esecuzione: è così che si scopre un deploy vecchio
    "environment": "production",
    "siteUrl": "https://www.domustua.com",
    "nodeEnv": "production",
    "previewBadge": false,
    "i18nEnabled": false
  },
  "integrations": {
    "realsmart":  { "live": true, "feedConfigured": true, "fallbackPossible": true },
    "soldMap":    { "present": true, "detected": 193, "manual": 3 },
    "leadBackend": "sheets",
    "emailLead":  { "configured": true },
    "whatsappConfigured": true,
    "trustindexLive": true,
    "heroVideoLive": false,
    "searchAiConfigured": true,
    "semanticRankingConfigured": false,
    "assistant":  { "enabled": false, "providerConfigured": true, "provider": "google", "model": "gemini-3.6-flash" }
  }
}
```

---

## 5. Due canali di contatto, due destinazioni diverse

Non sono la stessa cosa e la checklist li tiene distinti:

- **Form contatti** → `POST /api/lead` → `SHEETS_WEBHOOK_URL` (Google Sheet via Apps Script).
  Senza la variabile il form risponde comunque, ma il lead non viene archiviato: resta WhatsApp.
- **Assistente** → invia una email a `immobiliare@domustua.it` (`ASSISTANT_EMAIL_API_KEY`).
  È il campo `integrations.emailLead` in `/api/health`, e riguarda la chat, non il form.

---

## 6. Prima di una call col cliente

1. `npm run verify:deploy -- <url> --preview` — due minuti, e sai cosa dire.
2. Se il badge di anteprima è acceso, dillo prima che lo chiedano: significa "contenuti in
   verifica", ed è lì apposta.
3. Quello che la verifica segna `!` (ranking semantico, hero video) non è rotto: è facoltativo e
   il sito funziona senza. Vale la pena spiegarlo così, invece di lasciarlo scoprire.
