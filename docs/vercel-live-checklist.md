# Vercel — checklist ambiente live + self-check `/api/health`

> Documento **interno sersan**. Da eseguire **prima di ogni call cliente** e **dopo ogni
> deploy** che tocca l'ambiente. Obiettivo: verificare in 2 minuti che lo stato runtime del
> sito corrisponda a quello che diremo al cliente. Vedi anche `docs/env-and-deploy.md`.

---

## 0. ⚠️ Azioni bloccanti prima del go-live (dashboard/DNS — non risolvibili da codice)

Audit del 2026-07-21: il deploy Vercel **funziona** (`https://domus-tua-ten.vercel.app` →
`/api/health` risponde `production`, `useRealSmart:true`, `trustindexLive:true`). Restano due
gap di configurazione che **nessun commit può chiudere**:

1. **Il dominio non è ancora dirottato.** `https://www.domustua.com` serve ancora il **vecchio
   sito WordPress** (nginx, 404 WP). Chi visita il dominio del brand vede il sito vecchio.
   → In Vercel: **Project → Settings → Domains → aggiungi `www.domustua.com` (+ apex)** e
   aggiorna il DNS come indicato da Vercel. Prima di farlo, coordinare la dismissione del WP.
2. **`NEXT_PUBLIC_SITE_URL` non è impostata su Vercel** (`/api/health` → `env.siteUrl: null`).
   Di conseguenza canonical, OpenGraph, `sitemap.xml` e `robots.txt` puntano al fallback
   `https://www.domustua.com` — cioè al **sito vecchio**: SEO che indicizza la destinazione
   sbagliata. → In Vercel: imposta `NEXT_PUBLIC_SITE_URL=https://www.domustua.com` (Production)
   e l'URL di anteprima per Preview, poi ridployare.

Dopo entrambe: `npm run verify-deploy -- https://www.domustua.com` deve chiudere tutti i check
in verde (incluso `siteUrl configurato`).

---

## 1. Variabili d'ambiente su Vercel

Vercel → **Project → Settings → Environment Variables**. Imposta per l'ambiente giusto
(**Production** = dominio finale, **Preview** = URL di anteprima). Template completo e
commentato: `.env.example`.

### Pubbliche (`NEXT_PUBLIC_*` — finiscono nel bundle client, nessun segreto qui)

| Variabile | A cosa serve | Valore tipico prod | Valore tipico preview |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `metadataBase`, canonical/OG, sitemap/robots | `https://www.domustua.com` | URL Vercel dell'anteprima |
| `NEXT_PUBLIC_USE_REALSMART` | `false` = mock demo; altro/assente = feed RealSmart live | *(assente)* → live | `true` se il feed è stabile |
| `NEXT_PUBLIC_PREVIEW_BADGE` | badge "Preview — contenuti in verifica" + checklist | `false` | `true` |
| `NEXT_PUBLIC_ENABLE_I18N` | selettore lingua (it/en/fr/de/es) | `false` (prima presentazione IT-only) | `false` |

### Server-only (mai `NEXT_PUBLIC_` — **non** devono finire nel client)

| Variabile | A cosa serve | Se vuota |
|---|---|---|
| `SHEETS_WEBHOOK_URL` | inoltro lead al Google Sheet (Apps Script) | lead non salvati → resta solo WhatsApp |
| `TRUSTINDEX_WIDGET_URL` | override widget recensioni Trustindex | usa il loader ufficiale già in `site.ts` |
| `INSTAGRAM_WIDGET_URL` | embed feed Instagram | sezione IG con fallback statico |
| `ANTHROPIC_API_KEY` | parsing frase→filtri (ricerca AI) | parser locale deterministico (funziona comunque) |
| `VOYAGE_API_KEY` | ranking semantico (embeddings) | ranking per parole chiave |

> ⚠️ **Non esporre i segreti RealSmart/API.** Le credenziali `REALSMART_*`, le API key e gli
> URL di webhook sono **server-only**. Non vanno mai prefissate `NEXT_PUBLIC_`, mai committate,
> mai mostrate in schermata durante la demo. Il feed XML pubblico RealSmart (`REALSMART_FEED_URL`)
> è un URL pubblico, non un segreto: ha un default nel codice (`app/lib/realsmart/env.ts`).

---

## 2. Self-check runtime — `GET /api/health`

Dopo il deploy, da terminale:

```bash
curl -s https://<dominio-o-preview>/api/health | jq
```

Risposta (esempio — **nessun valore segreto**, solo booleani/enum):

```json
{
  "ok": true,
  "timestamp": "2026-07-07T09:00:00.000Z",
  "deploy": {
    "commit": "c4b2f0eaef1846bf9c5e36c8ff4d7c80fe87d819",
    "commitRef": "main",
    "vercelEnv": "production",
    "deploymentId": "dpl_xxx",
    "buildTime": "2026-07-07T08:59:12.000Z"
  },
  "env": {
    "siteUrl": "https://www.domustua.com",
    "nodeEnv": "production",
    "previewBadge": false,
    "i18nEnabled": false
  },
  "integrations": {
    "useRealSmart": true,
    "listingsMode": "realsmart",
    "listingsFeedConfigured": true,
    "listingsFallbackPossible": true,
    "leadWebhookConfigured": true,
    "leadBackend": "sheets",
    "trustindexLive": true,
    "heroVideoLive": false,
    "searchAiConfigured": false,
    "semanticRankingConfigured": false,
    "soldMapAvailable": true
  },
  "soldMap": {
    "available": true,
    "generatedAt": "2026-07-21T13:15:10.069Z",
    "itemCount": 193,
    "counts": { "total": 193, "sold": 165, "reserved": 1 }
  }
}
```

> **`deploy.*`** e **`soldMap.*`** sono stati aggiunti per rendere il deploy *verificabile*:
> `deploy.commit` è lo SHA effettivamente in produzione (confrontalo con `git rev-parse origin/main`),
> `deploy.buildTime` dice quando è stato buildato, `soldMap` conferma che la mappa "venduto"
> (OCR copertine) è presente e da quando. Le `deploy.commit/commitRef/vercelEnv/deploymentId`
> sono `null` in locale (le inietta Vercel): questo è normale in `npm run dev`.

### Come leggerlo prima di una call

- **`env.previewBadge`** → in **produzione** deve essere `false`. In **preview** `true`.
- **`env.i18nEnabled`** → `false` per la prima presentazione (IT-only). Vedi `docs/client-demo-mode.md`.
- **`integrations.listingsMode`** → `realsmart` in produzione. Se dice `mock` in prod, gli
  immobili NON sono quelli reali: correggere `NEXT_PUBLIC_USE_REALSMART` o indagare il feed.
- **`leadWebhookConfigured`** → `true` se i lead vengono salvati sul Google Sheet. Se `false`,
  i lead arrivano solo via WhatsApp (accettabile, ma da sapere).
- **`trustindexLive`** → `true` se le recensioni Google sono servite dal widget reale.
- **`heroVideoLive`** → `false` finché non consegnano la clip (oggi hero = poster reale).
- **`searchAiConfigured` / `semanticRankingConfigured`** → `false` è OK: la ricerca funziona
  comunque col parser locale + ranking per parole chiave. `true` = chiavi AI configurate.

> `/api/health` non è in cache (`no-store`) e non richiede autenticazione: espone solo stato,
> mai segreti. Se un domani si volesse proteggerlo, aggiungere un token via header — ma finché
> non espone dati sensibili non è necessario.

### Verifica DETERMINISTICA post-deploy — `npm run verify-deploy`

Invece di leggere il JSON a occhio, lo script `scripts/verify-deploy.mjs` interroga `/api/health`
e **fallisce con exit code 1** se il deploy non è allineato. Zero dipendenze (solo `fetch` di Node 20+).

```bash
# confronta lo SHA in produzione con HEAD locale (default)
npm run verify-deploy -- https://domus-tua-ten.vercel.app

# oppure confronta con uno SHA esplicito (es. in CI: il commit che ha innescato il deploy)
npm run verify-deploy -- https://domus-tua-ten.vercel.app "$(git rev-parse origin/main)"
```

Check effettuati (tutti devono essere ✓):

- **commit SHA == atteso** — `deploy.commit` uguale allo SHA passato/HEAD → *deployed == main*.
- **RealSmart live** — `integrations.useRealSmart === true`.
- **mappa venduto disponibile** — `integrations.soldMapAvailable === true`.
- **preview badge spento** (solo se `EXPECT_ENV=production`, default) — `env.previewBadge === false`.
- **siteUrl configurato** — `env.siteUrl` non nullo (canonical/OG puntano al dominio giusto).

> Nota: contro il deploy *attuale* lo script fallisce finché non è stato ri-deployato con questa
> versione del codice (il vecchio `/api/health` non aveva `deploy`/`soldMap`). È atteso: serve a
> confermare che il **nuovo** deploy sia andato a buon fine.

---

## 3. Checklist rapida pre-call

- [ ] `curl /api/health` risponde `ok: true`.
- [ ] In **produzione**: `previewBadge=false`, `i18nEnabled=false`, `listingsMode=realsmart`.
- [ ] In **preview**: `previewBadge=true` (il badge/checklist è visibile).
- [ ] `NEXT_PUBLIC_SITE_URL` = dominio giusto (non l'URL Vercel se è la call "finale").
- [ ] Nessun segreto `REALSMART_*`/API visibile nella dashboard condivisa a schermo.
- [ ] Homepage, `/case`, una scheda `/case/[slug]`, `/vendi`, `/acquista` caricano senza errori.

---

## 4. SEO — prima dell'indicizzazione (verifica il dominio finale!)

L'indicizzazione è **gated sull'ambiente** (`app/robots.ts`):

- **Preview/staging** (`VERCEL_ENV=preview`, o badge anteprima attivo) → `robots.txt` = `Disallow: /`.
  Gli URL Vercel di anteprima **non** finiscono su Google.
- **Produzione** (`VERCEL_ENV=production`) → `Allow: /` + `sitemap.xml`.

Checklist da spuntare **sul dominio di produzione finale**:

- [ ] `curl https://www.domustua.com/robots.txt` → contiene `Allow: /` e il link al sitemap
      (NON `Disallow: /`). Se vedi `Disallow: /` in produzione, l'ambiente non è `production`.
- [ ] `NEXT_PUBLIC_SITE_URL` = **dominio finale** (`https://www.domustua.com`), così canonical,
      OpenGraph e `sitemap.xml` puntano al dominio giusto (non all'URL Vercel).
- [ ] `sitemap.xml` elenca le pagine reali + le schede `/case/*` col dominio finale.
- [ ] `/privacy` e `/cookie` restano `noindex` finché il testo legale non è validato (e quindi
      **fuori** dal sitemap — vedi `app/sitemap.ts`).
- [ ] Dati strutturati `RealEstateAgent` validi (Rich Results Test): niente `aggregateRating`
      finché non è pienamente conforme e verificato.
- [ ] Solo **dopo** questi check: invia il sitemap in Google Search Console.

