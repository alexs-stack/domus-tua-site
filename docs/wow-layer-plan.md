# WOW Layer — piano di coreografia (2026-07)

Piano operativo del layer "spettacolare" richiesto dal cliente (livello Awwwards),
costruito sull'infrastruttura GSAP+Lenis esistente. Principio guida: **un solo
signature moment per viewport**; tutto il resto è disciplina (reveal sobri,
timing coerenti). Prima di chiudere ogni fase: rileggere la sezione e togliere
un effetto (regola Chanel).

## Vocabolario (già implementato in `app/lib/motion/gsap.ts`)

- Durate `dur.micro .3 / short .6 / reveal .9 / hero 1.4 / transition 1.1`
- Ease firma `"domus"` (out morbido, coda lunga) + `"domus.inOut"` (transizioni);
  `expo.out` resta per reveal secchi. Specchio CSS: `--ease-domus`, `--dur-*`.
- Stagger `chars .06 / words .10 / lines .11 / cards .12`
- Distanze: reveal 40–60px (`dist.rise` 48), parallax max 13%, skew max 5°.

## Invarianti non negoziabili (dalla mappa del codice)

1. Ogni animazione dentro `gsap.matchMedia(MQ.motionOk)`; reduced-motion = sito
   completo e statico. Stati nascosti SOLO via JS (mai SSR/CSS).
2. `Header`, overlay menu, `WhatsAppFloat`, `MobileActionBar` sono `fixed`:
   **mai transform/filter su body/main/antenati comuni** (esclude footer-reveal
   a transform e transizioni che wrappano la pagina in un nodo trasformato).
3. Sticky esistenti: colonna intro `Method` (desktop), aside `PropertyDetail`.
   Niente transform sugli antenati; il pin desktop di Method SOSTITUISCE lo sticky.
4. LCP: immagine hero home (`priority`) e `PageHero`/prima foto gallery. Mai
   opacity/clip iniziale su di esse o antenati prima del paint. Nota Next 16:
   `priority` è deprecata → migrare a `preload` quando si tocca il componente.
5. Chi apre overlay: `getLenis()?.stop()/start()` + `data-lenis-prevent`
   (contratto già usato da Header/Assistant). Preloader e transizioni lo riusano.
6. Non toccare: `handleSubmit`/honeypot/GDPR di Contact (window.open sincrono),
   `handleShare` PropertyCard, rami PREVIEW/produzione di Reviews, iframe
   (Trustindex/Maps/IG: mai animarli; `ScrollTrigger.refresh()` se cambia altezza),
   logica BeforeAfter (pointer capture, clamp, slider a11y), Logo probe, API/i18n.
7. Reveal legacy riscrive `className`: mai `toggleClass` sul suo nodo. Dove si
   ricoreografa, sostituirlo (via il blur paint-heavy) con pattern fromTo+once.
8. Next 16: navigazioni via `onNavigate` (Link) + `router.push`; niente router
   events. `<html data-scroll-behavior="smooth">` per evitare smooth-scroll
   durante le transizioni SPA. View Transitions = sperimentali, solo per lo
   shared element `/case → /case/[slug]` (Fase 4, dietro flag).
9. Plugin pesanti registrati nel componente che li usa (come SplitText in
   TextLines): Flip, Draggable+Inertia, ScrambleText. CustomEase è nel hub.

## Fase 1 — Sistemi globali

1. **Preloader "Segno Domus"** (`motion/Preloader.tsx`, mount nel layout):
   overlay espresso/wine + grain, Segno che si disegna (dash runtime, tecnica
   DrawOnScroll), contatore 0→100 Fraunces tabulare, wordmark in maschera.
   Una volta per sessione (`sessionStorage`), max ~2.2s, skip su click/tasto,
   assente con reduced-motion. Anti-flash: inline script che marca `<html
   data-preloader>` prima del paint (pattern doc Next "preventing flash").
   L'immagine hero continua fetch/decode sotto l'overlay. Exit = sipario che
   apre in handoff diretto con la timeline hero (evento/callback condiviso).
2. **Page transitions** (`motion/TransitionProvider.tsx` + `TransitionLink`):
   `onNavigate` → preventDefault → exit (sipario espresso + Segno ridisegnato,
   0.9s, "domus.inOut") → `router.push` → entrance al cambio pathname +
   `ScrollTrigger.refresh()` + focus su `#main`. Overlay `fixed` z-[95]
   fratello di body-children (nessun wrapper attorno alla pagina). Back/forward
   popstate: nessuna transizione. Mobile: 0.6s. Reduced-motion: nav diretta.
   Swap dei `Link` interni a `TransitionLink` in Header/Footer/card.
3. **Cursor custom** (`motion/Cursor.tsx`, gate finePointer+motionOk): dot 8px
   rosso + ring follower (quickTo), morph contestuali via `data-cursor`
   (scopri/play/trascina), fusione coi Magnetic, `mix-blend-difference` sulle
   foto, cursor nativo su input/form. Mount nel layout, zero SSR.
4. **Footer reveal** senza transform: wrapper con `footer` sticky bottom dietro
   al main (che ha già sfondi opachi) + ombra di contatto; dentro il footer il
   wordmark gigante "Domus Tua" entra a righe mascherate; `KineticStrip` resta
   il preludio. CSS-only per il meccanismo (reduced-motion safe).
5. **Menu mobile**: timeline GSAP (clip-path dal bottone, stagger nav y+rotate,
   contatti in coda, chiusura inversa rapida) al posto delle transition CSS,
   preservando inert/focus-trap/Lenis stop-start.

## Fase 2 — Signature moments

Riferimenti studiati: `OnScrollFilter` (mask SVG circle→r finale con
feTurbulence+feDisplacementMap statico, scrub del solo raggio) e
`r3f-image-reveal-effect` (fragment perlin3D + gradiente radiale su uProgress —
port OGL in Fase 5).

1. **HeroCinematic**: timeline master di ingresso al handoff preloader —
   clip-path `inset` che si apre + scale 1.15→1 (`dur.hero`, wrapper, mai
   sull'IMG LCP), H1 in caratteri SplitText `yPercent:110` da maschera con
   micro-rotazione (stati nascosti applicati solo dietro overlay preloader),
   eyebrow/badge/CTA in coda, Segno che si disegna. Visite successive (niente
   preloader): entrata breve da stati quasi-finali (mai testo nascosto).
   Uscita scroll: pin leggero, immagine → 1.06 + darken, testo in deriva
   multi-velocità (già impostato: si raffina con i token). Ken-burns CSS
   assorbito dalla timeline GSAP (un solo owner del transform).
2. **Method scrollytelling** (il pezzo da giuria): desktop = sezione pinnata
   con i 9 passi in scrub orizzontale, linea di progresso che si disegna,
   contatore gigante 01→09 a rullo, titoli in maschera per passo
   (`containerAnimation` per i trigger interni; lo sticky attuale rimosso a
   favore del pin su desktop). Mobile: verticale attuale potenziato (spina +
   rullo contatore + titoli mascherati). Anchor `#metodo` verificata con pin.

## Fase 3 — Home, sezione per sezione (un'idea forte ciascuna)

- **HomeSearchGateway**: handoff dall'hero (card che risale in controtempo sul
  frame-in), focus theatre (glow crema + chips in stagger + esempi a rotazione
  con ScrambleText discreto), submit → micro-transizione.
- **Stats**: odometro a rullo (cifre in maschera) sul dato eroe al posto dello
  snap; SSR resta il valore finale (garanzia CountUp). Skew di velocità sul
  marquee (aggancio al proxy timeScale di VelocityMarquee).
- **Authority**: timeline unica count-up 4.9 → pop stelle → mini-stat; scala
  scrub del numero dentro la card (già in Parallax, niente sticky).
- **SocialVideoWall**: Flip sul cambio filtro (registrato localmente), entrata
  griglia con batch 2D, hover con play che nasce dal cursore.
- **Paths**: card che entrano da direzioni opposte, mouse-parallax interno
  2–3%, benefit line-by-line, CTA magnetica (tutto senza intercettare l'<a>).
- **OpenDomus**: reveal "liquido" della foto founder (port OnScrollFilter:
  baseFrequency bassa, filtro statico, solo il raggio anima — max 1–2 istanze
  per pagina) + card flottante e cascata benefit sequenziate.
- **DomusDocProtocol**: sigillo D.O.C. che si disegna come timbro + cascata
  pilastri + numeri mask-rise; stack sticky dei 5 pilastri solo desktop e
  scopato al ref (componente multi-istanza).
- **Services**: lista 01–05 con immagine flottante che segue il cursore e
  crossfade tra voci (desktop); mobile: thumbnail statiche. Copy invariato.
- **BeforeAfter**: Draggable+Inertia sull'handle (registrati localmente),
  cursore "◂ Trascina ▸", etichette Prima/Dopo in contro-movimento, pill tab
  che slitta (Flip), clipPath mutato via gsap.set (via i ~100 re-render).
- **Listings**: wrapper client `ListingsGrid` con `ScrollTrigger.batch`
  (il file resta server); hook `data-card-*` su PropertyCard per il reveal.
- **FeaturedTestimonial**: timeline unica virgoletta→righe→stelle→firma;
  MaskReveal sulla foto.
- **Reviews**: carousel draggable con inerzia SOLO nel ramo demo/PREVIEW (in
  produzione c'è l'iframe Trustindex: si coreografa solo il riepilogo).
- **Social**: mosaico con stagger 2D dal centro + badge "Segui" magnetico.
- **Team**: hover righe roster con riempimento brand + iniziali in scala;
  MaskReveal coordinati in una sola timeline.
- **Contact**: bordo che si disegna sul focus, shake sull'errore (accompagna il
  focus esistente), submit idle→loading→check disegnato; niente rework dei
  campi (form funzionale, window.open sincrono intoccabile).
- **SectionDivider**: apertura legata allo scrub.

## Fase 4 — Pagine interne

- **PageHero**: timeline standard badge→H1 righe→subcopy→CTA→trust + exit
  scrub; unificare ken-burns/Parallax (un owner); `priority`→`preload`.
- **/case**: filtri con Flip (solo decorativo, stato PropertySearch intatto).
- **/case/[slug]**: shared element card→hero gallery con View Transitions
  sperimentali (`experimental.viewTransition` + `<ViewTransition name>`);
  la transizione GSAP salta il sipario su quel percorso. Pagina conversione:
  solo nodi foglia (related in stagger, corner D.O.C. draw, dati che contano).
- **/metodo**: ScrubWords sul manifesto + scrollytelling esteso; slot ponte
  D.O.C. coreografato. **/chi-siamo**: MaskReveal trio squadra, TextLines,
  fix anchor `#chi-siamo`. **/recensioni, /contatti**: vocabolario (h1 di
  contatti fuori dal Reveal CSS → pattern JS-only; cornice mappa in maschera,
  righe orari in stagger; iframe intoccato).

## Fase 5 — WebGL (OGL, opzionale)

Dynamic import, gate `finePointer + motionOk + !saveData`, mount in
requestIdleCallback. Max 3 effetti: reveal perlin+radial dell'hero al handoff
(port GLSL del repo r3f), hover displacement su Listings/Paths, micro-distorsione
hero da cursore (2–3%). Fallback CSS sempre completo. Se LCP/INP peggiora si
taglia la fase senza rimpianti.

## Fase 6 — Polish

Regola Chanel su ogni viewport; inventario micro-interazioni (§8 brief):
underline unificate ai token, bottoni con fill direzionale, WhatsAppFloat pulse
~8s + magnetismo, scroll indicator; QA: screenshot 1440/390, reduced-motion
completo, Lighthouse mobile ≥90 / CLS 0, `npm run check` verde.

## Processo

Ogni fase: commit atomico + `npm run check` verde + verifica browser
(desktop 1440 / mobile 390) + passata `/critique`-`/polish` (Impeccable,
contesto in `PRODUCT.md`). Nessuna nuova lib di animazione oltre a GSAP/Lenis
(+ OGL in Fase 5, ~30kB, già autorizzata dal brief).
