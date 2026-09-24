# Modalità demo / presentazione cliente

> Documento **interno sersan**. Come configurare il sito per una presentazione cliente onesta e
> senza distrazioni. Vedi anche `docs/client-review-script.md` (talk-track) e
> `docs/vercel-live-checklist.md` (verifica ambiente).

## Configurazione consigliata per la PRIMA presentazione

Su Vercel (o in `.env.local` per la demo locale):

```
NEXT_PUBLIC_PREVIEW_BADGE=true    # badge "Preview — contenuti in verifica" + checklist onesta
NEXT_PUBLIC_ENABLE_I18N=false     # ← italiano-only (vedi sotto)
NEXT_PUBLIC_USE_REALSMART=true    # immobili reali dal feed (o assente = live). "false" solo per demo offline
```

Il badge di anteprima (in basso a sinistra) apre una checklist che dice cosa è live e cosa è
demo: usala per inquadrare i contenuti con onestà.

## Perché italiano-only alla prima presentazione

**Per la prima presentazione consigliamo italiano-only** (`NEXT_PUBLIC_ENABLE_I18N=false`).

Motivo: il **chrome** (menu, hero, ricerca) è tradotto in it/en/fr/de/es, ma il **corpo di alcune
pagine** e i **contenuti legali** (privacy/cookie) non sono ancora tutti localizzati e validati.
Mostrare un selettore lingua che porta a pagine parzialmente tradotte **distrae** e toglie forza
all'esperienza. Meglio presentare un sito **coerente al 100% in italiano** e attivare le lingue
solo quando sono complete e approvate.

L'i18n è **opt-in**: con la env assente o `false` il selettore lingua **non viene renderizzato**
(`app/components/i18n/LanguageSwitcher.tsx` → `if (!I18N_ENABLED) return null`). La produzione può
**abilitare le lingue in futuro** semplicemente impostando `NEXT_PUBLIC_ENABLE_I18N=true`, **senza
alcun refactor**.

## QA checklist — prima di abilitare le lingue (`=true`)

Non attivare `NEXT_PUBLIC_ENABLE_I18N=true` finché non è tutto spuntato:

- [ ] **Tutte le pagine tradotte** — non solo chrome/hero/ricerca, ma anche il corpo di
      `/vendi`, `/acquista`, `/metodo`, `/open-domus`, `/chi-siamo`, `/servizi`, `/recensioni`,
      schede immobile.
- [ ] **Nessun overflow di layout** — testi più lunghi (DE) non rompono bottoni, card, nav.
- [ ] **CTA verificate** in ogni lingua (label chiare, non troncate).
- [ ] **Termini immobiliari** corretti per mercato (es. "rogito", "APE", "locali" → equivalenti
      sensati, non traduzioni letterali).
- [ ] **Legale/privacy NON tradotti automaticamente** senza approvazione: privacy e cookie devono
      restare validi legalmente in ogni lingua pubblicata.
- [ ] **Prezzi e date** formattati per locale (già gestito: `Intl.NumberFormat` / `toLocaleDateString`).
- [ ] Ricontrollo del selettore su mobile (tap target, menu a tendina).

Finché anche una sola voce non è verificata: **restare italiano-only**.
