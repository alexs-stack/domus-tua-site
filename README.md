# Domus Tua Immobiliare — Sito

Sito premium per Domus Tua Immobiliare (Tradate, VA). Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript.

## Avvio

```bash
npm run dev        # sviluppo → http://localhost:3000
npm run build      # build di produzione
npm start          # serve la build
npm run typecheck  # tsc --noEmit
npm run check      # lint + typecheck + build (usato anche in CI)
```

Variabili d'ambiente: copia `.env.example` in `.env.local` e compila. Chiavi principali:
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_USE_REALSMART`, `NEXT_PUBLIC_PREVIEW_BADGE`,
`NEXT_PUBLIC_ENABLE_I18N`, `REALSMART_*` (server-only), `CONTACT_*`. Vedi
[docs/env-and-deploy.md](docs/env-and-deploy.md).

## Design system

- **Palette brand:** rosso `#d20a0a`, grigio caldo (ink/graphite/stone), bianco caldo (cream/paper). No oro, no blu.
- **Tipografia:** Fraunces (display serif) + Plus Jakarta Sans (UI), via `next/font`.
- **Token & utility:** definiti in `app/globals.css` (`@theme` + classi `.eyebrow`, `.reveal`, `.grain`, `.marquee-track`).
- **Animazioni:** scroll-reveal via `IntersectionObserver` (`components/Reveal.tsx`), easing custom `cubic-bezier`.

## Struttura

Homepage composta in `app/page.tsx`. Sezioni in `app/components/`:

| Componente | Sezione |
|---|---|
| `Header` | Nav fluid-island + menu mobile |
| `Hero` | Headline + doppia CTA + trust |
| `Stats` | Numeri + marquee valori |
| `Paths` | Vendi / Acquista |
| `Method` | Metodo Domus Tua (8 step) |
| `OpenDomus` | Asset proprietario |
| `Services` | Bento servizi + Protocollo D.O.C. |
| `BeforeAfter` | Slider prima/dopo interattivo |
| `Listings` | Immobili in evidenza |
| `Reviews` | Recensioni filtrabili |
| `Team` | Chi siamo / Persone |
| `Contact` | Form valutazione + contatti |
| `Footer` · `WhatsAppFloat` | — |

Costanti contatto/nav: `app/lib/site.ts`. Immagini: `public/images/` (sorgenti in `_assets_raw/`).

### Pagine

| Rotta | File | Note |
|---|---|---|
| `/` | `app/page.tsx` | Homepage |
| `/vendi` | `app/vendi/page.tsx` | Per chi vende |
| `/acquista` | `app/acquista/page.tsx` | Per chi acquista |
| `/metodo` | `app/metodo/page.tsx` | Manifesto del Metodo Domus Tua |
| `/open-domus` | `app/open-domus/page.tsx` | Pagina prodotto Open Domus |
| `/servizi` | `app/servizi/page.tsx` | Hub servizi |
| `/case` | `app/case/page.tsx` | Listing immobili (filtro per tipologia) |
| `/case/[slug]` | `app/case/[slug]/page.tsx` | Scheda immobile (SSG da `lib/properties.ts`) |
| `/recensioni` | `app/recensioni/page.tsx` | Recensioni |
| `/chi-siamo` | `app/chi-siamo/page.tsx` | Storia, valori, team |
| `/contatti` | `app/contatti/page.tsx` | Mappa, orari, form |

Componenti condivisi: `PageHero`, `EditorialRows` (righe immagine+testo alternate), `Highlights` (griglia 3 card), `PropertyCard`, `PropertyGallery`, `CaseExplorer` (filtro client), oltre a `BeforeAfter`, `Reviews`, `Listings`, `Stats`, `Team`, `Method`, `OpenDomus`, `Services`, `Contact`. La nav (`lib/site.ts`) usa href assoluti verso le pagine dedicate.

Dati immobili demo in `app/lib/properties.ts` (6 immobili fittizi → sostituire con quelli reali). La mappa contatti usa un embed Google Maps (non carica nel sandbox di preview, funziona in produzione) con link di fallback "Apri in Google Maps".

## ⚠️ Dati DEMO da sostituire con quelli reali del cliente

- **Immobili** (`Listings.tsx`): titoli, zone, prezzi, metrature inventati.
- **Recensioni** (`Reviews.tsx`): testi rappresentativi → sostituire con recensioni Google/Trustindex reali (o embed).
- **Foto team** (`Team.tsx`): servono foto reali; ora slot editoriali.
- **Numeri** stat: verificare con il cliente (4.9/5 e 500+ recensioni indicati come reali nel brief).
- **Form contatti**: ora apre WhatsApp precompilato (nessun backend). Da collegare a email/CRM.
- **Orari** in footer: placeholder plausibili, da confermare.

## Documentazione

**Brand & identità**
- [docs/logo-assets.md](docs/logo-assets.md) — **Logo ufficiale** (original-first): file richiesti, dimensioni, sfondo trasparente, varianti, favicon. *Non ridisegnare il logo in MVP.*
- [docs/segno-domus.md](docs/segno-domus.md) — sistema visivo differenziante Segno Domus (componenti, uso web/brochure/video, overuse)
- [docs/brand-direction.md](docs/brand-direction.md) · [docs/brand-motif.md](docs/brand-motif.md) · [docs/DESIGN.md](docs/DESIGN.md)

**Media**
- [docs/hero-video.md](docs/hero-video.md) — hero cinematico: file video/poster, compressione, mobile
- [docs/media-optimization.md](docs/media-optimization.md) — immagini, video, YouTube lazy, naming

**Contenuti & integrazioni**
- [docs/realsmart-integration-notes.md](docs/realsmart-integration-notes.md) · [docs/realsmart-client-questions.md](docs/realsmart-client-questions.md) · [docs/realsmart-security.md](docs/realsmart-security.md) — feed immobili RealSmart
- [docs/reviews-integration.md](docs/reviews-integration.md) — recensioni Google/Trustindex
- [docs/form-backend-next-step.md](docs/form-backend-next-step.md) · [docs/forms-crm-notes.md](docs/forms-crm-notes.md) — lead capture → email/CRM
- [docs/i18n.md](docs/i18n.md) — multilingua IT/EN/FR/DE/ES (flag `NEXT_PUBLIC_ENABLE_I18N`)

**Delivery & operatività**
- [docs/env-and-deploy.md](docs/env-and-deploy.md) — variabili d'ambiente, Vercel, preview vs produzione
- [docs/production-readiness.md](docs/production-readiness.md) — checklist di lancio
- [docs/client-assets-needed.md](docs/client-assets-needed.md) — **asset da chiedere al cliente** (3 priorità)
- [docs/client-review-script.md](docs/client-review-script.md) — talk-track per la call di presentazione
- [docs/phase-plan.md](docs/phase-plan.md) — Fase 1 (sito) vs Fase 2 (AI/CRM)
- [docs/questions-for-client.md](docs/questions-for-client.md) — domande aperte per il cliente

## Prossimi passi (dal brief)

Pagine MVP successive: Vendi, Acquista, Metodo, Open Domus, Servizi, Listing/Scheda immobile, Recensioni, Chi siamo, Contatti. I componenti sono pensati per essere riusati su queste pagine.
