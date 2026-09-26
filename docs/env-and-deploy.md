# Env & Deploy — Domus Tua

Guida operativa alle **variabili d'ambiente** e al **deploy su Vercel**.
Stack: Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript strict.

Documenti correlati: `docs/deployment-notes.md` (dettaglio dominio/`metadataBase`/`remotePatterns`),
`docs/realsmart-integration-notes.md`, `docs/forms-crm-notes.md`, `docs/reviews-integration.md`,
`docs/production-readiness.md` (checklist go-live).

---

## 1. Regola d'oro: nessun secret nel repo

- I valori reali vivono **solo** in `.env.local` (dev) e nelle **Environment Variables di Vercel** (deploy).
- `.env.local` e `.env*` sono già in `.gitignore`. **Non committare mai** valori reali.
- Il repo contiene solo `.env.example` con **placeholder / default sicuri**.
- Le variabili con prefisso `NEXT_PUBLIC_` finiscono nel **bundle client** (visibili a chiunque):
  usarle solo per valori non sensibili. Tutto il resto è **server-only**.

Setup locale:

```bash
cp .env.example .env.local
# poi valorizza .env.local con i dati reali (mai committarlo)
```

---

## 2. Variabili richieste

Legenda ambiti: **Prod** = Production, **Prev** = Preview, **Dev** = locale.

### Pubbliche (`NEXT_PUBLIC_*` — nel bundle client, NON sensibili)

| Variabile | Default | Ambiti | Scopo |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | _(vuoto)_ | Prod, Prev | URL canonico del sito. Alimenta `metadataBase`, OG/canonical, `sitemap.ts`, `robots.ts`. Prod = dominio finale (`https://www.domustua.com`); Prev = URL Vercel. |
| `NEXT_PUBLIC_USE_REALSMART` | `false` | Prod, Prev | `true` = feed RealSmart live; `false` = mock/demo (`app/lib/realsmart/mocks.ts`). Letto in `app/lib/listings.ts`. |
| `NEXT_PUBLIC_PREVIEW_BADGE` | `true` | Prev | Mostra il badge "anteprima/demo". Letto in `app/lib/brand.ts`. In produzione finale impostare `false`. |
| `NEXT_PUBLIC_ENABLE_I18N` | `true` | Prod, Prev | Abilita selettore lingua + `LocaleProvider` (it/en/fr/de/es). |

### Server-only (secret — MAI con prefisso `NEXT_PUBLIC_`)

| Variabile | Default | Ambiti | Secret? | Scopo |
|---|---|---|---|---|
| `REALSMART_FEED_URL` | _(vuoto)_ | Prod (+Prev se si testa) | Sì | Endpoint del feed immobili. Letto da `fetchRawListings()` in `app/lib/realsmart/client.ts`. |
| `REALSMART_API_KEY` | _(vuoto)_ | Prod | Sì | Chiave/token per autenticare feed o API RealSmart. |
| `REALSMART_API_BASE` | _(vuoto)_ | Prod | Sì | Base URL delle API REST RealSmart (scenario API). |
| `REALSMART_FTP_HOST` | _(vuoto)_ | Prod | Sì | Host FTP/SFTP se il feed è consegnato via file. |
| `REALSMART_FTP_USER` | _(vuoto)_ | Prod | Sì | Utente FTP/SFTP. |
| `REALSMART_FTP_PASS` | _(vuoto)_ | Prod | Sì | Password FTP/SFTP. |
| `REALSMART_FTP_PATH` | _(vuoto)_ | Prod | Sì (percorso riservato) | Percorso remoto del file feed. |
| `REALSMART_WEBHOOK_SECRET` | _(vuoto)_ | Prod | Sì | Segreto per verificare la firma dei webhook RealSmart (rivalidazione on-demand). |
| `CONTACT_FORM_MODE` | `whatsapp` | Prod, Prev | No | Destinazione form contatti: `whatsapp` \| `email` (vedi `docs/forms-crm-notes.md`). |
| `CONTACT_EMAIL_TO` | _(vuoto)_ | Prod | No (ma privato) | Destinatario lead quando `CONTACT_FORM_MODE=email`. |
| `TRUSTINDEX_WIDGET_URL` | _(vuoto)_ | Prod, Prev | No | URL/script del widget recensioni Trustindex (`docs/reviews-integration.md`). |
| `INSTAGRAM_WIDGET_URL` | _(vuoto)_ | Prod, Prev | No | URL/embed del feed Instagram. |

> Finché le `REALSMART_*` sono vuote (o `NEXT_PUBLIC_USE_REALSMART=false`), il sito gira sui **mock**:
> nessuna pagina vuota, nessun errore. Vedi `app/lib/listings.ts` e `app/lib/realsmart/`.

---

## 3. Gestione secret RealSmart (server-only)

- Le credenziali RealSmart (feed URL, API key, FTP, webhook secret) sono **strettamente server-only**:
  vengono lette solo in Server Components / route handler, **mai** nel client.
- **Non** anteporre `NEXT_PUBLIC_` a nessuna `REALSMART_*`: aggiungerlo esporrebbe il secret nel bundle
  JavaScript scaricato dal browser.
- Su Vercel impostarle come **Environment Variables** dell'ambiente giusto (di norma solo Production;
  Preview solo se serve testare il feed reale) e trattarle come **secret** (non loggarle, non stamparle).
- In caso di compromissione: **ruotare** la chiave/segreto lato RealSmart e aggiornare Vercel.
- Se il dominio media RealSmart è esterno, ricordare `remotePatterns` in `next.config.ts`
  (vedi `docs/deployment-notes.md`, §4) — è configurazione, non un secret.

---

## 4. Deploy su Vercel

| Voce | Valore |
|---|---|
| Progetto | `domus-tua` (`.vercel/project.json`) |
| Dominio di preview | `domus-tua-ten.vercel.app` |
| Repo | `github.com/alexs-stack/domus-tua-site` |
| Branch di produzione | `main` (deploy automatico a ogni push) |
| Framework preset | Next.js (auto-rilevato) |
| Build command | `next build` (default) |

Passi:
1. **Vercel → Project `domus-tua` → Settings → Environment Variables**: inserire le chiavi di `.env.example`
   con i valori reali, scegliendo per ciascuna gli ambienti corretti (§2).
2. Marcare come **secret** le `REALSMART_*` e i valori privati.
3. Push su `main` → deploy di Production. Ogni branch/PR → deploy di **Preview**.
4. Verificare `next build` verde (vedi anche `npm run check` in `package.json`).

---

## 5. Preview vs Production

| Aspetto | Preview | Production |
|---|---|---|
| Trigger | PR / branch non-`main` | push su `main` |
| `NEXT_PUBLIC_SITE_URL` | URL Vercel (`https://domus-tua-ten.vercel.app`) | dominio finale (`https://www.domustua.com`) |
| `NEXT_PUBLIC_PREVIEW_BADGE` | `true` (badge visibile) | `false` (badge nascosto al go-live) |
| `NEXT_PUBLIC_USE_REALSMART` | `false` (mock) salvo test | `true` quando il feed è pronto |
| `REALSMART_*` | opzionali (solo se si testa il feed) | reali, come secret |
| Scopo | far vedere le modifiche al cliente prima del live | sito pubblico |

Le Preview servono a mostrare in sicurezza le modifiche al cliente: badge attivo, mock, URL Vercel.
Al go-live si passa ai valori Production (dominio reale, badge off, feed reale).

---

## File / percorsi rilevanti

- `.env.example` — elenco delle variabili attese (root).
- `app/layout.tsx` — `metadata` + `metadataBase` (legge `NEXT_PUBLIC_SITE_URL`).
- `app/robots.ts`, `app/sitemap.ts` — leggono `NEXT_PUBLIC_SITE_URL`.
- `app/lib/listings.ts` — flag `NEXT_PUBLIC_USE_REALSMART` (mock vs live).
- `app/lib/brand.ts` — flag `NEXT_PUBLIC_PREVIEW_BADGE`.
- `app/lib/realsmart/client.ts` — lettura `REALSMART_*` (server-only).
- `.vercel/project.json` — riferimento progetto Vercel.
