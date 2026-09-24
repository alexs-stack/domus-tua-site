# Prompt — Onda creativa 4 (da incollare in una nuova sessione)

> Uso: apri una nuova sessione di Claude Code nella root del repo e incolla tutto ciò
> che segue (oppure scrivi: "esegui @docs/onda-4-prompt.md").

---

Continua il WOW layer di Domus Tua (domus-tua-site) con l'**onda creativa 4**.
Obiettivo: livello "top site of the year" — professionale e innovativo, niente
pattern visti e rivisti. Ultracode attivo: usa il tool Workflow (agenti in
parallelo + verifica avversaria finale sul diff).

## Contesto (già fatto, NON rifare)

- Onde 1–3 in main (commit chiave: `132b70a` filo rosso Method, `0744219` onda 2
  atmosfere/camera/H2, `4852c43` onda 3 ThreadNav/sipario parlante/liquido/camera hero).
- Leggi PRIMA: la memoria di progetto (domus-wow-layer, domus-motion-architecture),
  `docs/wow-layer-plan.md`, `app/lib/motion/gsap.ts` (token dur/stagger/dist,
  CustomEase "domus"), e `AGENTS.md` (Next 16 ≠ training data: consulta
  `node_modules/next/dist/docs/` prima di scrivere codice Next).
- Primitive esistenti in `app/components/motion/`: Reveal, TextLines, MaskReveal,
  Parallax, Atmosphere, CameraIn, ThreadNav, KineticStrip, VelocityMarquee,
  HoverDistort (OGL), Preloader, PageTransition (sipario 3 lame + nome destinazione),
  Cursor (etichette da dizionario), Magnetic, Odometer, DrawOnScroll.

## Candidati onda 4 (in ordine di priorità)

1. **Manifesto pinnato su /metodo** — un momento firma per la pagina metodo:
   statement a tutto viewport pinnato (ScrollTrigger pin + scrub), le parole si
   accendono una a una mentre scorri e il filo rosso sottolinea la parola chiave
   (coerente col linguaggio "filo rosso" di Method/ThreadNav). Reduced-motion:
   testo statico completo. Mobile: niente pin, cascata semplice.
2. **Filo rosso sulle pagine interne** — estendere ThreadNav (parametrico: lista
   capitoli via prop) a /vendi, /acquista, /metodo, /open-domus; dove la pagina è
   corta, in alternativa una "cucitura" SVG che attraversa i confini di sezione
   (upgrade di SectionDivider col tratteggio che si disegna in scrub).
3. **Flip card immobile → dettaglio** — GSAP Flip dalla card di /case all'hero di
   /case/[slug]. ATTENZIONE: verifica prima la fattibilità con App Router
   (l'elemento deve sopravvivere alla navigazione; View Transitions NON esiste in
   questo React — già verificato). Se non fattibile in modo pulito, fallback:
   Flip interno a /case (card → anteprima espansa in overlay, stesso documento).
4. (Se resta budget) **QA finale**: Lighthouse mobile/desktop, craft floor di
   impeccable su tutte le pagine interne, pass di micro-interazioni mancanti.

Regola Chanel: per ogni effetto nuovo che entra, valuta cosa togliere o
semplificare. Un solo momento firma per viewport.

## Skills — OBBLIGATORIO

Prima di scrivere codice, invoca le skill pertinenti già installate:

- `impeccable` (esegui il suo `context.mjs`, carica craft-floor prima di editare UI;
  per spinte creative usa i playbook bolder/overdrive/delight/polish)
- `scroll-experience`, `awwwards-animations`
- Skill ufficiali GreenSock: `gsap-scrolltrigger`, `gsap-timeline`, `gsap-plugins`
  (per il Flip leggi gsap-plugins PRIMA di progettare il candidato 3)

E cerca skill NUOVE con `npx skills find <tema>` (installa con `npx skills add -y`)
per i temi dell'onda: "flip animation", "page transition", "pinned scroll",
"lighthouse performance", "svg animation". Se una skill non copre il task, dillo
esplicitamente e procedi.

## Vincoli non negoziabili (ereditati, già validati dal cliente)

- Reduced-motion = sito COMPLETO e statico; niente scroll-hijack su touch.
- Animare SOLO transform / opacity / clip-path. Testo SEO sempre nell'HTML iniziale.
- LCP protetto (trappole note in memoria: opacity:0 esclude dai candidati,
  aggregazione per containing block, immagini full-viewport escluse).
- MAI effetti di distorsione su foto con persone (feedback cliente vincolante).
- i18n 5 lingue: nuove stringhe visibili SOLO se aggiunte al dizionario in tutte
  e 5 le lingue; testo decorativo solo nomi propri brand o numeri.
- NON toccare: API routes, lib/realsmart, form lead, logica i18n, JSON-LD,
  struttura contenuti.
- Niente nuove librerie motion oltre GSAP+Lenis (+OGL già ammessa).

## Metodo di lavoro

- Commit atomici per fase, `set -o pipefail; npm run check` verde prima di ogni commit.
- Trappola Turbopack (Windows): modifiche a `globals.css` richiedono kill del
  server + `rm -rf .next` + riavvio. I .tsx hot-reloadano normalmente.
- QA visiva OBBLIGATORIA nel browser (dev server: `npx next dev --turbopack -p 3100`);
  l'intro si salta con sessionStorage `dt-intro-seen` o Maiusc/Invio.
- Workflow multi-agente su file disgiunti + agente verificatore avversario sul
  diff completo (proprietà animate, gate reduced-motion, i18n, doppi owner del
  transform, cleanup, exports PageTransition intatti).
- Aggiorna la memoria di progetto (domus-wow-layer) a fine onda.
