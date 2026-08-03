# Sticky Grid Scroll — riferimento per il "muro delle voci"

Clone di studio di https://github.com/theoplawinski/codrops-sticky-grid-scroll
(Théo Plawinski, licenza **MIT** — vedi `LICENSE`). Rimossi `.git`, le foto
demo di `public/` (solo per il demo Codrops) e il lockfile: resta il codice.

## La meccanica (src/scripts/index.js + src/styles/index.css)

- **Geometria**: `.block--main` alto **425vh**; `.block__wrapper` è
  `position: sticky; top: 0; overflow: hidden`. Il contenuto (`.content`,
  100vh flex centrato, z-1) sta SOPRA la galleria; `.gallery` è assoluta,
  centrata (`top/left 50%` + translate −50%), larga 736/1440 ≈ 51vw; griglia
  3 colonne di quadrati (`aspect-ratio: 1`).
- **Uncover**: `gsap.from(wrapper, { yPercent: -100 })`, scrub su
  `top bottom → top top` — il wrapper viene "scoperto" mentre la sezione entra.
- **Titolo**: centrato otticamente da solo (`yPercent` = offset in % del
  contenitore, misurato a runtime); fade-in `opacity 0→1, 0.7s power1.out` a
  `top 57%`, `toggleActions: play none none reset`.
- **Timeline master** (scrub, `top 25% → bottom bottom`), tre atti:
  1. *reveal*: per colonna (item bucketizzati `index % 3`), `from y = ±dy`
     con `dy = wh − (wh − gridHeight)/2` (parte oltre il viewport), colonne
     pari dall'alto (`stagger from "end"`), dispari dal basso (`from
     "start"`), `each: 0.06`, ease `power1.inOut` — tutte in sync sul label.
  2. *zoom* (`-=0.6`): `grid → scale 2.05` (`power3.inOut`, dur 1), colonna
     sinistra `xPercent −40`, destra `+40` (in `"<"`); la centrale si
     divarica: item sopra la metà `yPercent −40`, sotto `+40` (dur 0.5,
     `power1.inOut`, `-=0.5`).
  3. *toggle contenuto* (`-=0.32`): callback NON in scrub, direzionale
     (`scrollTrigger.direction === 1`): titolo `yPercent → 0` (0.7s
     `power2.inOut`), descrizione+bottone `opacity` e `pointerEvents`
     (0.4s, overlap `-=90%` in apertura).
- **Lenis**: `lerp 0.08, wheelMultiplier 1.4` nel ticker GSAP,
  `lagSmoothing(0)`; init dopo `preloadImages()` (misure corrette).

## Porting Domus (`app/components/ReviewsWall.tsx`)

Stessa matematica e stessi valori; differenze deliberate: layout del
riferimento acceso solo via JS `[data-on]` (mobile/reduced-motion = colonna
statica), item = link ai video reali del canale (quindi
`.dt-wall_content { pointer-events: none }` col solo bottone cliccabile),
misure a `document.fonts.ready`, focus-safety su bottone e card, cleanup
manuale dei trigger creati in async. Lenis resta quello globale del sito.
