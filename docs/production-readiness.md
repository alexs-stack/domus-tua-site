# Production Readiness — Domus Tua

Checklist di lancio per portare il sito da **demo** a **produzione**.
Spuntare tutto prima del go-live. Documenti di supporto indicati in ogni sezione.

Riferimenti: `docs/env-and-deploy.md`, `docs/deployment-notes.md`,
`docs/realsmart-integration-notes.md`, `docs/realsmart-field-mapping.md`,
`docs/forms-crm-notes.md`, `docs/reviews-integration.md`,
`docs/client-assets-needed.md`, `docs/content-replacement-checklist.md`,
`docs/performance-notes.md`.

---

## 1. Asset reali (oggi DEMO)

- [ ] Foto/volti reali al posto dei placeholder (vedi `docs/client-assets-needed.md` e MEMORY: banner YouTube = Raffaela, recensioni video).
- [ ] Immobili reali dal feed RealSmart al posto del demo `app/lib/properties.ts`.
- [ ] Logo/favicon definitivi (`app/favicon.ico`, `docs/logo-assets.md`).
- [ ] Video hero finale e poster (vedi `docs/hero-video.md`); niente asset di lavoro nel repo.
- [ ] Testi reali secondo `docs/content-replacement-checklist.md` (niente lorem/placeholder residui).

## 2. Environment variables

- [ ] Tutte le chiavi di `.env.example` impostate su Vercel negli ambienti corretti (`docs/env-and-deploy.md`, §2).
- [ ] `NEXT_PUBLIC_SITE_URL` corretto in Production (dominio finale) e Preview (URL Vercel).
- [ ] `NEXT_PUBLIC_PREVIEW_BADGE=false` in Production (badge demo nascosto).
- [ ] `REALSMART_*` impostate come **secret**, mai con prefisso `NEXT_PUBLIC_` (§3 di env-and-deploy).
- [ ] Nessun secret committato: `.env.local` e `.env*` restano fuori dal repo (`.gitignore`).

## 3. Legale

- [ ] Pagine `privacy` e `cookie` allineate al trattamento dati reale (feed immobili, indirizzi, foto, lead).
- [ ] Consenso + link a `/privacy` sul form contatti prima di qualunque salvataggio server (`docs/forms-crm-notes.md`).
- [ ] Cookie/consent per gli embed di terze parti (Trustindex, Instagram, mappa) verificato.
- [ ] Indirizzo civico immobili: deciso cosa è pubblicabile (civico vs solo comune/zona).
- [ ] Dati agenzia corretti (P.IVA, sede Tradate/Varese, contatti) in `app/lib/site.ts`.

## 4. SEO / Open Graph

- [ ] `metadataBase` allineato a `NEXT_PUBLIC_SITE_URL` (non hardcoded) — `docs/deployment-notes.md`, §3.
- [ ] Title/description per pagina coerenti; `canonical` per-pagina impostati.
- [ ] Immagine OG di default presente e risolta come URL assoluto; anteprima verificata (WhatsApp/Facebook/X).
- [ ] `app/robots.ts` e `app/sitemap.ts` corretti (`/robots.txt`, `/sitemap.xml` raggiungibili, host giusto).
- [ ] Lingua/hreflang coerenti con l'i18n (it/en/fr/de/es) se rilevante per l'indicizzazione.

## 5. Form / destinazione lead

- [ ] `CONTACT_FORM_MODE` deciso (`whatsapp` o `email`) e coerente col flusso reale.
- [ ] Se `email`: `CONTACT_EMAIL_TO` impostato e ricezione testata end-to-end.
- [ ] Numero WhatsApp e recapiti corretti in `app/lib/site.ts`; `wa.me` testato su mobile (fallback popup).
- [ ] Segmentazione lead (tipo, pagina sorgente, immobile) come da `docs/forms-crm-notes.md`.

## 6. RealSmart feed

- [ ] Scenario di integrazione scelto (feed / API / FTP) — `docs/realsmart-integration-notes.md`.
- [ ] `NEXT_PUBLIC_USE_REALSMART=true` solo quando il feed è pronto e mappato.
- [ ] Mappatura campi verificata (`docs/realsmart-field-mapping.md`); `normalizeStatus()` sugli stati reali.
- [ ] `remotePatterns` in `next.config.ts` col dominio media reale prima di usare foto esterne.
- [ ] Fallback ai mock verificato (feed irraggiungibile ⇒ nessuna pagina vuota).
- [ ] ISR/rivalidazione: `REVALIDATE_SECONDS` confermato; eventuale webhook + `REALSMART_WEBHOOK_SECRET`.

## 7. Performance

- [ ] `next build` verde in locale e su Vercel; `npm run check` (lint + typecheck + build) pulito.
- [ ] Immagini ottimizzate (`next/image`, `formats` avif/webp, `sizes` corretti) — `docs/performance-notes.md`.
- [ ] Lighthouse sulla Preview: LCP, CLS, TBT nella norma; niente layout shift sull'hero.
- [ ] Font caricati senza FOIT/FOUT vistosi; video hero con `poster` e non bloccante.
- [ ] Nessun payload inutile (asset di lavoro esclusi dal repo/bundle).

## 8. Accessibilità (a11y)

- [ ] Contrasto conforme sulla palette rosso/grigio/bianco (testo su rosso `#d20a0a` incluso).
- [ ] Tutte le immagini con `alt` sensato; icone decorative marcate come tali.
- [ ] Navigazione da tastiera e focus visibile su link, bottoni, form, selettore lingua.
- [ ] Landmark/heading in ordine; label sui campi form; stati errore leggibili.
- [ ] Video/embed con controlli accessibili; `prefers-reduced-motion` rispettato dove c'è motion.

## 9. Analytics

- [ ] Strumento di analytics deciso (es. Vercel Analytics) e attivato solo dopo consenso cookie.
- [ ] Eventi chiave tracciati (invio form, click WhatsApp, apertura scheda immobile) se richiesto.
- [ ] Nessun tracker attivo prima del consenso; documentato nella pagina cookie.
- [ ] Verifica finale in Production che gli eventi arrivino correttamente.

---

## Sign-off

- [ ] Dominio di produzione collegato su Vercel (apex vs `www`, redirect impostato).
- [ ] Ultimo deploy Preview approvato dal cliente.
- [ ] Deploy di Production verificato (pagine chiave, form, immobili, recensioni, i18n).
