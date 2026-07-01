# Domus Tua Immobiliare — Sito

Sito premium per Domus Tua Immobiliare (Tradate, VA). Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript.

## Avvio

```bash
npm run dev      # sviluppo → http://localhost:3000
npm run build    # build di produzione
npm start        # serve la build
```

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

## Prossimi passi (dal brief)

Pagine MVP successive: Vendi, Acquista, Metodo, Open Domus, Servizi, Listing/Scheda immobile, Recensioni, Chi siamo, Contatti. I componenti sono pensati per essere riusati su queste pagine.
