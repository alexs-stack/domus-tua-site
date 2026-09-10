# La rivista bianca — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Portare il sito Domus Tua allo stile del riferimento pinnato dalla cliente (immobiliaregoldengoal.it): un solo fondo avorio, titoli maiuscoli enormi in vw/vh, paragrafi grandi e leggeri, media squadrati, niente card/curve/nero/fiori, tre gesti di movimento — eseguendo punto per punto la lista della chiamata del 2026-09-10.

**Architecture:** Si cambia prima il SISTEMA (token, regole globali, CTA, layout, header, footer, preloader), così ogni sezione eredita subito fondo/scala/raggi nuovi; poi si riscrive la home un capitolo per volta (un commit per capitolo, screenshot a fine fase); poi le pagine interne; infine si cancellano i sistemi del vecchio WOW layer e si aggiornano i test. Spec: `docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md`. Misure del riferimento: `reverse-engineering/goldengoal/README.md`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (`@theme inline` in `app/globals.css`), GSAP 3.15 + Lenis (solo `Reveal`, `TextLines`, `Parallax`, `HorizontalRail`), Playwright headless per gli screenshot (`reverse-engineering/goldengoal/capture.mjs`).

## Global Constraints

- Branch di lavoro `claude/rivista-bianca`; un commit per task, messaggio in italiano nello stile del repo (`feat(hero): …`), chiuso da `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Prima di scrivere codice Next: leggere `node_modules/next/dist/docs/` se si tocca un'API del framework (AGENTS.md).
- **Nessuna superficie scura** fuori dal preloader: vietati `bg-ink`, `bg-espresso`, `bg-wine`, `bg-graphite`, `from-ink/*`, `via-ink/*`, `text-cream` su fondo scuro.
- **Nessun raggio** tranne icon-button rotondi (play, frecce, WhatsApp): vietato `rounded-*` su figure, card, campi, bottoni; i token `--radius-*` valgono 0.
- **Nessuna ombra**, nessun gradiente sopra le foto, nessuna grana, nessuna vignettatura.
- **Nessun testo sotto 16 px** nel contenuto: vietati `text-xs`, `text-sm`, `text-[0.6…0.9rem]`. Corpo 19 px (`text-body`), paragrafo editoriale `lead`, UI 16 px (`text-ui`).
- Titoli `h1-h4` maiuscoli (regola globale), in `font-display`; il corsivo Pinyon (`script-word`) è rosso e compare **una volta per capitolo**.
- Movimento ammesso: `Reveal`, `TextLines`, `Parallax` (±4 %), `HorizontalRail` (solo team). Vietati tutti gli altri primitivi di `app/components/motion/`. Reduced-motion: tutto fermo e visibile.
- Non toccare: `app/api/*`, `app/lib/realsmart/*`, la logica dei form lead (`window.open` sincrono), i18n (`LocaleProvider`, dizionari), `BeforeAfter`/`PropertyCard`/`Reviews`/`TrustindexEmbed` (logica), metadata/JSON-LD/canonical.
- Ogni `copy` record per lingua (it/en/fr/de/es) esistente nei componenti si CONSERVA: si cambia il markup, non i testi, salvo le rimozioni chieste dalla cliente (hero).
- Conservare ogni `id=` di sezione (`top`, `cerca`, `chi-siamo`, `metodo`, `open-domus`, `servizi`, `contatti`, `recensioni`): li usano nav, hero e link interni.
- Verifica dopo ogni fase: `npm run typecheck && npm run lint && npm test`, poi `node reverse-engineering/goldengoal/capture.mjs ours` con il dev server su :3000 e lettura degli screenshot in `reverse-engineering/goldengoal/shots-ours/`.

---

## FASE 1 — Fondazioni

### Task 1: Token del sistema (colori, scala, raggi, ombre, font-brand)

**Files:**
- Modify: `app/globals.css:34-135` (blocco `@theme inline`) e `:137-140` (`:root`)
- Modify: `app/layout.tsx` (`viewport.themeColor`, classe del `<body>`)
- Test: `app/lib/__tests__/intro-clocks.test.ts` (deve restare verde: non tocca questi token)

**Interfaces:**
- Produces: utility Tailwind `text-hero`, `text-d1…d4` (ridefinite), `text-lead`, `text-body`, `text-ui`, `text-script`, `font-brand`, `bg-cream` (= fondo del sito), `rounded-card` = 0.

- [x] **Step 1: Sostituire i valori dei token**

Nel blocco `@theme inline` di `app/globals.css`:

```css
  --color-line: #e4dccf;
  --color-cream: #f9f5ef;
  --color-cream-deep: #f4ece2;
  --color-paper: #fffdf8;

  /* Font di marca per le scritte "Domus Tua" (decisione 2026-09-10: resta
     Jakarta finché non arriva il logo nuovo; si ripunta SOLO qui). */
  --font-brand: var(--font-jakarta);

  /* SCALA "RIVISTA BIANCA" (2026-09-10, rif. immobiliaregoldengoal.it):
     i titoli scalano col viewport — vw nell'hero, vh nei capitoli — e sono
     maiuscoli; il minimo tiene in piedi il telefono (50/38 px del rif.). */
  --text-hero: clamp(3.1rem, 13vw, 13rem);
  --text-hero--line-height: 0.9;
  --text-d1: clamp(2.4rem, min(10vh, 6.5vw), 7.5rem);
  --text-d1--line-height: 0.92;
  --text-d2: clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem);
  --text-d2--line-height: 0.95;
  --text-d3: clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem);
  --text-d3--line-height: 1.05;
  --text-d4: clamp(1.45rem, 1.8vw, 1.75rem);
  --text-d4--line-height: 1.2;
  --text-lead: clamp(1.35rem, 1.72vw, 1.55rem);
  --text-lead--line-height: 1.4;
  --text-body: 1.1875rem;
  --text-body--line-height: 1.5;
  --text-ui: 1rem;
  --text-ui--line-height: 1.3;
  --text-script: clamp(2.6rem, 7vw, 7rem);
  --text-script--line-height: 1;

  /* Niente curve (direttiva cliente 2026-09-10) */
  --radius-card: 0px;
  --radius-card-lg: 0px;
  --radius-field: 0px;

  /* Niente ombre */
  --shadow-card: none;
  --shadow-card-hover: none;
  --shadow-float: none;
```

Rimuovere le vecchie righe `--text-d1…d4` e i vecchi valori di line, cream, cream-deep, paper, radius, shadow (sostituiti sopra). In `:root`: `--background: #f9f5ef;`.

- [x] **Step 2: Layout**

In `app/layout.tsx`: `themeColor: "#f9f5ef"`; `<body className="flex min-h-dvh flex-col bg-cream text-ink">`.

- [x] **Step 3: Verificare**

Run: `npm run typecheck && npm test`
Expected: verde. Aprire http://localhost:3000 (dev server) e controllare che il fondo sia avorio e le card senza raggio (i consumatori di `rounded-card`).

- [x] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat(token): un solo fondo avorio, scala in vw/vh, raggi e ombre a zero"
```

### Task 2: Regole globali di tipografia e ritmo; via grana, vignetta, arco

**Files:**
- Modify: `app/globals.css` — blocco "Typography helpers" (`:226-265`), "Film grain" (`:266-292`), `.bg-ink` (`:680-688`), `.arch-frame` (`:785-800`), `.display-tight` (`:3129-3146`)
- Modify: `app/layout.tsx` (rimuovere `<div className="grain" aria-hidden />`)

**Interfaces:**
- Produces: classi `.lead`, `.script-word`, `.dt-row`, `.dt-chapter`, `.eyebrow` (16 px); regola `h1,h2,h3,h4 { text-transform: uppercase }`.

- [x] **Step 1: Aggiungere le regole dopo `.font-display`**

```css
/* I titoli sono maiuscoli per regola, come nel riferimento (body h1..h6
   {text-transform:uppercase}). Le citazioni no: blockquote resta in tondo. */
h1, h2, h3, h4 {
  text-transform: uppercase;
}
blockquote, blockquote * {
  text-transform: none;
}

/* Paragrafo editoriale: grande e leggero, colonna stretta (≤ 50ch). */
.lead {
  font-size: var(--text-lead);
  line-height: var(--text-lead--line-height);
  font-weight: 300;
  color: var(--color-graphite);
  max-width: 50ch;
}

/* La parola-ornamento di capitolo: il corsivo rosso al posto dell'SVG oro
   del riferimento. Una per capitolo. */
.script-word {
  font-family: var(--font-script), cursive;
  font-size: var(--text-script);
  line-height: 1;
  color: var(--color-red);
  text-transform: none;
  font-weight: 400;
}

/* Riga e capitolo: il vuoto del riferimento. */
.dt-row {
  padding-inline: 8vw;
}
.dt-chapter {
  padding-block: clamp(6rem, 14vh, 11rem);
}
@media (max-width: 767px) {
  .dt-row {
    padding-inline: 5vw;
  }
  .dt-chapter {
    padding-block: clamp(4rem, 10vh, 6rem);
  }
}
```

- [x] **Step 2: Eyebrow a 16 px**

Sostituire `font-size: 0.6875rem; ... letter-spacing: 0.22em;` in `.eyebrow` con `font-size: var(--text-ui); letter-spacing: 0.08em;`. Il trattino `::before` resta.

- [x] **Step 3: Rimuovere grana, vignetta, arco**

Cancellare il blocco `.grain { … }` e il commento "Film grain"; cancellare la regola `.bg-ink { background-color: var(--color-espresso); background-image: radial-gradient(...) }` e il commento sopra (righe 680-688); cancellare `.arch-frame` e le sue regole (`border-bottom-*-radius`, 785-800). In `app/layout.tsx` rimuovere `<div className="grain" aria-hidden />`. `.display-tight`: `line-height: 0.92; letter-spacing: 0;` (il maiuscolo non vuole tracking negativo).

- [x] **Step 4: Verificare e committare**

Run: `npm run typecheck && npm run lint`
Expected: verde (nessun file .tsx usa la classe `grain` oltre a `PreloaderShell.tsx:106` — lì lasciarla: la regola non esiste più e non fa nulla; si toglie nel Task 4).

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat(tipografia): titoli maiuscoli, paragrafo editoriale, eyebrow a 16px; via grana, vignetta e arco"
```

### Task 3: CTA piatte

**Files:**
- Modify: `app/globals.css` — blocco "CTA SYSTEM" (`:2566-2966`): sostituire per intero
- Modify: `app/components/primitives/Cta.tsx` (mappa varianti e `CtaInner`)
- Modify: `app/components/primitives/SocialLinks.tsx` (solo se usa classi rimosse)

**Interfaces:**
- Consumes: varianti `cta | cta-solid | reveal | reveal-cream | ghost | ghost-dark`, taglie `sm | md | lg`, prop `arrow` — **API invariata**.
- Produces: `.dt-btn` rettangolare; `reveal*` ≡ `cta-solid`; `ghost*` = link testuale sottolineato.

- [x] **Step 1: Riscrivere il CSS del blocco CTA**

Sostituire tutto il blocco da `/* ==== CTA SYSTEM` fino alla riga prima di `/* ---------- Trail del team` con:

```css
/* ============================================================
   CTA — rettangoli e link sottolineati (rivista bianca, 2026-09-10).
   Due gesti soli, come nel riferimento: il bottone rosso pieno per la
   conversione e il link maiuscolo sottolineato per tutto il resto.
   Le varianti storiche restano come classi (API di Cta.tsx invariata):
   reveal ≡ cta-solid, ghost ≡ link.
   ============================================================ */
.dt-btn {
  --btn-py: 1.05rem;
  --btn-px: 2rem;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border-radius: 0;
  font-size: var(--text-ui);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.2;
  cursor: pointer;
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}
.dt-btn--sm { --btn-py: 0.8rem; --btn-px: 1.4rem; }
.dt-btn--lg { --btn-py: 1.2rem; --btn-px: 2.4rem; }
@media (pointer: coarse) { .dt-btn { min-height: 2.75rem; } }
.dt-btn__label { display: inline-flex; align-items: center; gap: 0.6rem; }
.dt-btn__arr { display: grid; place-items: center; width: 1.2em; height: 1.2em; }
.dt-btn__arr svg { width: 1.1em; height: 1.1em; }
.dt-btn__arr svg + svg { display: none; }
.dt-btn__fill { display: none; }

/* cta: contorno rosso → pieno */
.dt-btn--cta {
  padding: var(--btn-py) var(--btn-px);
  color: var(--color-red);
  background: transparent;
  border: 1.5px solid var(--color-red);
}
.dt-btn--cta:hover, .dt-btn--cta:focus-visible { color: #fff; background: var(--color-red); }
/* cta-solid / reveal: pieno rosso */
.dt-btn--cta-solid, .dt-btn--reveal {
  padding: var(--btn-py) var(--btn-px);
  color: #fff;
  background: var(--color-red);
  border: 1.5px solid var(--color-red);
}
.dt-btn--cta-solid:hover, .dt-btn--cta-solid:focus-visible,
.dt-btn--reveal:hover, .dt-btn--reveal:focus-visible {
  background: var(--color-red-dark);
  border-color: var(--color-red-dark);
  color: #fff;
}
/* ghost: link maiuscolo sottolineato, nessuna scatola */
.dt-btn--ghost {
  padding: 0.4rem 0;
  color: var(--color-ink);
  background: transparent;
  border: 0;
  text-decoration: underline;
  text-underline-offset: 0.35em;
  text-decoration-thickness: 1.5px;
}
.dt-btn--ghost:hover, .dt-btn--ghost:focus-visible { color: var(--color-red); }
.dt-btn--ghost-dark { color: #fff; }
.dt-btn--ghost-dark:hover, .dt-btn--ghost-dark:focus-visible { color: var(--color-cream); }
/* send: submit dei form lead (SendCta) — pieno rosso, spinner al posto dell'etichetta */
.dt-btn--send {
  padding: var(--btn-py) var(--btn-px);
  background: var(--color-red);
  color: #fff;
  border: 1.5px solid var(--color-red);
}
.dt-btn--send:hover, .dt-btn--send:focus-visible { background: var(--color-red-dark); border-color: var(--color-red-dark); }
.dt-btn--send:disabled { opacity: 0.6; cursor: wait; }
.dt-btn--send .dt-btn__plane { display: none; }
.dt-btn--send .dt-btn__spinner { width: 1em; height: 1em; border: 2px solid rgb(255 255 255 / 0.4); border-top-color: #fff; border-radius: 50%; animation: dt-spin 0.8s linear infinite; }
@keyframes dt-spin { to { transform: rotate(360deg); } }
```

Conservare intatto il blocco `dt-social` (icone rotonde: ammesse) ma togliere la regola del tooltip elastico se usa `cubic-bezier(0.68,-0.55,0.265,1.55)` → `ease`. Verificare in `Cta.tsx` quali classi usa `SendCta` (spinner/plane) e adattare i nomi sopra a quelli reali.

- [x] **Step 2: Cta.tsx**

In `variantClass`: `reveal: "dt-btn dt-btn--cta dt-btn--cta-solid"`, `"reveal-cream": "dt-btn dt-btn--cta dt-btn--cta-solid"`. In `CtaInner` eliminare il ramo `reveal` (facce a/b): tutte le varianti rendono `dt-btn__label` + freccia. Rimuovere `dt-btn__fill`.

- [x] **Step 3: Verificare**

Run: `npm run typecheck && npm run lint && grep -rn "dt-btn__face\|dt-btn__fill" app --include=*.tsx`
Expected: verde, nessuna occorrenza (se `CookieConsent`/`ReviewsWall` usano classi dt-btn direttamente sul nodo, le classi restano valide).

- [x] **Step 4: Commit** — `feat(cta): bottoni rettangolari e link sottolineati, via anelli, facce e aeroplanino`

### Task 4: Preloader a tempo dimezzato (TEMPO 1) e cuore orario

**Files:**
- Modify: `app/lib/motion/intro-constants.ts:75` (`TEMPO = 1`)
- Modify: `app/globals.css` — blocchi Preloader (`:1716-2082`), Hero rest (`:2083-2121`), telefono (`:2236-2422`); rimuovere `<div className="grain !absolute !z-0"/>` da `app/components/motion/PreloaderShell.tsx:106`
- Modify: `app/components/motion/RotatingMark.tsx` (`spinMarkBadge` e il ticker dell'header)
- Test: `app/lib/__tests__/intro-clocks.test.ts` (immutato: è il metro)

- [x] **Step 1: Far fallire il test**

`export const TEMPO = 1;` poi `npm test`. Expected: FAIL su "globals.css: i numeri rimasti in CSS combaciano" — la lista dei mismatch guida lo step 2.

- [x] **Step 2: Dimezzare i numeri del CSS (tutti i numeri sotto sono i valori NUOVI)**

| Selettore / keyframe | Prima | Dopo |
|---|---|---|
| `[data-pre-figure]` `dt-pre-in-fade` | `1.8s … 0.3s` | `0.9s … 0.15s` |
| `[data-pre-char]` `dt-pre-char` | `2.6s … calc(0.24s + var(--i, 0) * 0.15s)` | `1.3s … calc(0.12s + var(--i, 0) * 0.075s)` |
| `[data-pre-schar]` `dt-pre-schar` | `2.6s … calc(1.2s + … * 0.13s)` | `1.3s … calc(0.6s + … * 0.065s)` |
| `[data-pre-cap]` `dt-pre-cap` | `1.7s … calc(0.8s + … * 0.22s)` | `0.85s … calc(0.4s + … * 0.11s)` |
| `[data-pre-word]` `dt-pre-word` | `2.5s … calc(1.3s + … * 0.28s)` | `1.25s … calc(0.65s + … * 0.14s)` |
| `[data-pre-progress]` | `0.5s … 1.1s` | `0.25s … 0.55s` |
| `[data-pre-track]` `dt-pre-track` | `3.1s … 1.2s` | `1.55s … 0.6s` |
| `.dt-preloader` porta+tuffo | `dt-pre-door 2.2s … 4.5s both, dt-pre-dive 3s … 6.26s forwards` | `dt-pre-door 1.1s … 2.25s both, dt-pre-dive 1.5s … 3.13s forwards` |
| `dt-pre-autohide` (2 occorrenze) | `0.5s ease 9.36s` | `0.5s ease 4.73s` |
| `[data-pre-content]` `dt-pre-exit` | `1.1s … 4.7s` | `0.55s … 2.35s` |
| `[data-pre-panel]` `dt-pre-curtain` | `1.8s … 5.2s` | `0.9s … 2.6s` |
| skip `.dt-preloader` animation-delay | `-2.2s, var(--pre-skip, 0s), calc(var(--pre-skip, 0s) + 3.1s)` | `-1.1s, var(--pre-skip, 0s), calc(var(--pre-skip, 0s) + 1.6s)` |
| skip `[data-pre-track]` | `-3.1s` | `-1.55s` |
| skip `[data-pre-content]` | `-1.1s` | `-0.55s` |
| `dt-rest-failsafe` con intro (2 occorrenze) | `0.5s ease 6.66s` | `0.5s ease 3.33s` |
| `dt-rest-failsafe` a caldo (2 occorrenze) | `6s` | invariato |

Le ease (`cubic-bezier`) NON cambiano. Cercare eventuali altri delay del film nel blocco telefono (2236-2422) con `grep -nE "[0-9.]+s" app/globals.css | sed -n '/2236/,/2422/p'` e dimezzarli solo se sono tempi dell'intro (non le geometrie in vw/vh).

- [x] **Step 3: Cuore orario**

In `RotatingMark.tsx`: `spinMarkBadge` → `tl.fromTo(mark, { rotation: 0 }, { rotation: 360, ...common }, 0)`. Nel ticker dell'header (dopo `const state = { speed: 30 }`), la scrittura della rotazione del monogramma usa il segno opposto all'anello: renderla dello stesso segno (entrambi orari a riposo; il cambio di direzione con lo scroll resta uguale per entrambi). Aggiornare il commento di testa: "il monogramma gira in senso orario (richiesta cliente 2026-09-10)".

- [x] **Step 4: Verificare**

Run: `npm test` → verde. Poi con dev server: Browser pane → `javascript_tool`: `sessionStorage.clear(); location.reload()` e dopo 6 s `document.documentElement.hasAttribute('data-preloader')` → `false`.

- [x] **Step 5: Commit** — `feat(preloader): lo stesso film a tempo dimezzato, e il cuore gira in senso orario`

### Task 5: Layout senza grana, superficie mobile, transizione e cursore

**Files:**
- Modify: `app/layout.tsx` (rimuovere `SurfaceFlow`, `ChromeMount`; skip-link)
- Replace: `app/components/motion/PageTransition.tsx` → modulo minimo
- Delete: `app/components/motion/ChromeMount.tsx`, `app/components/motion/Cursor.tsx`, `app/components/motion/SurfaceFlow.tsx`
- Modify: `app/globals.css` — blocchi SURFACEFLOW (`:694-869`: tenere SOLO le regole non legate a `--dt-surface` se ce ne sono; altrimenti cancellare), PageTransition (`:2423-2549`), Cursor (`:2550-2565`)
- Modify: chi importa `isTransitionCovering`/`transitionTo` da PageTransition: `Header.tsx`, `HomeSearchGateway.tsx`, `CaseQuickLook.tsx`, `VideoLightbox.tsx`, `ReviewsWall.tsx`, `StarReviews.tsx` (grep `from "./motion/PageTransition"`)

**Interfaces:**
- Produces: `export function transitionTo(href: string): void` (naviga subito, senza sipario) e `export function isTransitionCovering(): boolean` (sempre `false`), stesso modulo `app/components/motion/PageTransition.tsx`.

- [x] **Step 1: PageTransition minimo**

Leggere come `transitionTo` naviga oggi (righe 107-116) e conservare SOLO quella chiamata:

```tsx
// PageTransition — dal 2026-09-10 non c'è più nessun sipario fra le pagine
// (direttiva cliente: via le transizioni curve). Restano le due funzioni che
// il resto del sito importa, ridotte all'osso: navigare subito, e rispondere
// «no» a chi chiede se un sipario copre lo schermo.
export function isTransitionCovering(): boolean {
  return false;
}
export function transitionTo(href: string) {
  /* stessa chiamata di navigazione di prima, senza timeline */
}
export default function PageTransition() {
  return null;
}
```

- [x] **Step 2: Layout** — rimuovere gli import e i nodi `<SurfaceFlow />` e `<ChromeMount />`; skip-link: `className="sr-only bg-red px-5 py-3 font-semibold uppercase tracking-[0.08em] text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"`. Rimuovere `data-tone`/`data-surface` dagli usi in `app/page.tsx` solo quando le sezioni vengono riscritte (Fase 2); qui basta che `SurfaceFlow` non esista più.

- [x] **Step 3: CSS** — cancellare i tre blocchi indicati; se il blocco SURFACEFLOW contiene `.dt-surface` usato da `main`/`body`, sostituire con niente: il fondo è `bg-cream` sul body.

- [x] **Step 4: Verificare** — `npm run typecheck && npm run lint && npm test` verde; `grep -rn "data-cursor" app --include=*.tsx` → attributi innocui, si tolgono in Fase 2.

- [x] **Step 5: Commit** — `feat(layout): via sipario fra le pagine, cursore, grana e superficie mobile`

### Task 6: Header chiaro

**Files:**
- Modify: `app/components/Header.tsx` (riscrittura del markup; conservare: `nav` da `lib/site`, `useDict` e le chiavi `d.header.*`, `LanguageSwitcher`, `RotatingMark`, `setOverlay("menu")`, focus trap e `Escape` del menu, `aria-expanded`/`aria-controls`, `usePathname`/`isActive`)
- Modify: `app/globals.css` se esistono regole `.dt-header*`
- Test: `e2e/home.spec.ts` (`@layout` header per larghezza) — deve restare verde

- [x] **Step 1: Leggere `Header.tsx` per intero** e annotare: chiavi del dizionario usate, ref e effetti (GSAP dello scroll, warmup), struttura del menu mobile.

- [x] **Step 2: Markup nuovo**

```tsx
<header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled ? "bg-cream-deep border-b border-line" : "bg-transparent"}`}>
  <div className="dt-row flex h-[clamp(5rem,12vh,7.5rem)] items-center justify-between">
    <Link href="/" className="flex items-center gap-4" aria-label="Domus Tua, home">
      <RotatingMark className="hidden h-11 w-11 lg:block" />
      <Logo className="h-auto w-[clamp(150px,14vw,220px)]" />
    </Link>
    <nav aria-label={d.header.navLabel} className="hidden items-center gap-8 lg:flex">
      {nav.map((item) => (
        <Link key={item.key} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}
          className="text-ui font-medium uppercase tracking-[0.08em] text-ink underline-offset-[0.4em] hover:underline aria-[current=page]:underline">
          {d.nav[item.key]}
        </Link>
      ))}
      <LanguageSwitcher />
      <Cta href="/valutazione-immobile-tradate" variant="cta-solid" size="sm" arrow={false}>{d.header.cta}</Cta>
    </nav>
    <button ref={toggleRef} type="button" className="lg:hidden text-ui font-semibold uppercase tracking-[0.08em]" aria-expanded={open} aria-controls="dt-menu" onClick={() => setOpen(!open)}>
      {open ? d.header.close : d.header.menu}
    </button>
  </div>
  {/* Menu mobile: pannello pieno avorio, voci a d2 */}
  <div id="dt-menu" ref={menuRef} hidden={!open} className="fixed inset-0 top-[clamp(5rem,12vh,7.5rem)] z-40 overflow-y-auto bg-cream lg:hidden">
    <ul className="dt-row flex flex-col gap-6 py-10">
      {nav.map((item) => (
        <li key={item.key}><Link href={item.href} onClick={() => setOpen(false)} className="font-display text-d2 uppercase text-ink">{d.nav[item.key]}</Link></li>
      ))}
      <li className="pt-6"><LanguageSwitcher /></li>
      <li><a href={site.whatsapp.href} className="dt-btn dt-btn--ghost"><Whatsapp className="h-5 w-5 text-red" /> {d.header.whatsapp}</a></li>
    </ul>
  </div>
</header>
```

Usare i nomi reali delle chiavi trovati allo step 1 (es. se non esiste `d.header.cta`, usare la chiave della CTA già presente). Via il pill (`pillRef`), il gradiente `from-ink/60`, `backdrop-blur`, `text-cream`, `bg-ink/20`. `scrolled` resta calcolato come oggi (scroll > 24 px). Con l'hero chiaro (Task 10) l'hero porta `pt-[clamp(7rem,16vh,10rem)]` per l'header fisso.

- [x] **Step 3: Verificare** — typecheck/lint; Browser pane a 1440 e 390: nav visibile, menu apre/chiude con tastiera (Tab, Escape), `aria-current` sulla voce attiva.

- [x] **Step 4: Commit** — `feat(header): chiaro e trasparente sul fondo avorio, logo grande, nav maiuscola`

### Task 7: Footer chiaro, in flusso

**Files:**
- Modify: `app/components/Footer.tsx` (riscrittura; conservare `d.footer.*`, `reopenConsent`, `site.*`, `nav`, `SocialLinks`, `Logo`)
- Modify: `app/globals.css` — cancellare "Footer reveal" (`:3045-3117`) e ogni regola `html.dt-footer-reveal`, `--dt-footer-h`, `.dt-footer-reveal-target`, `.topo-ambient`
- Modify: chi imposta `html.dt-footer-reveal` (grep `dt-footer-reveal`)
- Test: `e2e/a11y.spec.ts` deve restare verde (contrasto su chiaro)

- [x] **Step 1: Markup**

```tsx
<footer className="dt-row border-t border-line bg-cream pt-[clamp(4rem,10vh,7rem)] pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-ink">
  <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
    <div>
      <Logo className="h-auto w-[200px]" />
      <p className="lead mt-6">{d.footer.payoff}</p>
    </div>
    <div>
      <h2 className="font-display text-d4 font-light">{d.footer.contacts}</h2>
      <ul className="mt-5 space-y-3 text-body">
        <li><a href={site.phone.href} className="underline-offset-4 hover:underline">{site.phone.label}</a></li>
        <li><a href={site.whatsapp.href} className="underline-offset-4 hover:underline">{d.footer.whatsapp}</a></li>
        <li><a href={site.email.href} className="underline-offset-4 hover:underline">{site.email.label}</a></li>
      </ul>
    </div>
    <div>
      <h2 className="font-display text-d4 font-light">{d.footer.where}</h2>
      <address className="mt-5 not-italic text-body">{indirizzo da site}</address>
      <p className="mt-3 text-body">{orari da site}</p>
    </div>
    <div>
      <h2 className="font-display text-d4 font-light">{d.footer.explore}</h2>
      <ul className="mt-5 space-y-3 text-body">{nav.map((item) => <li key={item.key}><Link href={item.href}>{d.nav[item.key]}</Link></li>)}</ul>
      <SocialLinks tone="light" className="mt-6" />
    </div>
  </div>
  <div className="mt-16 flex flex-col gap-3 border-t border-line pt-6 text-ui text-stone md:flex-row md:justify-between">
    <p>© {year} {site.legalName} · P.IVA {site.vat}</p>
    <ul className="flex gap-6"><li><Link href="/privacy">…</Link></li><li><Link href="/cookie">…</Link></li><li><button type="button" onClick={reopenConsent}>…</button></li></ul>
  </div>
</footer>
```

Usare i campi reali di `site` e le chiavi reali di `d.footer` (leggere `app/lib/site.ts` e il dizionario). Via: `Fioritura`, `useGSAP`/`ScrollTrigger`, `wordmarkRef` gigante, `bg-graphite`, chip `bg-paper` dietro al logo, `rounded-*`. Il footer torna nel flusso normale: nessun `fixed`, nessuna `--dt-footer-h`.

- [x] **Step 2: Verificare** — typecheck/lint/test; Browser pane: footer chiaro, tutti i link raggiungibili; nessuna regola residua `dt-footer-reveal` (`grep -rn "footer-reveal\|--dt-footer-h" app`).

- [x] **Step 3: Commit** — `feat(footer): chiaro, a tre colonne, in flusso; via fiori, uncover e wordmark gigante`

### Task 8: Verifica di fase e screenshot

**Files:**
- Modify: `reverse-engineering/goldengoal/capture.mjs` (`out` → `path.join(dirname, which === 'ours' ? 'shots-ours' : 'shots')`)

- [x] **Step 1**: `npm run typecheck && npm run lint && npm test` → verde.
- [x] **Step 2**: dev server su :3000 (Browser pane `preview_start domustua-dev`); `node reverse-engineering/goldengoal/capture.mjs ours`; leggere `shots-ours/dt-home-desk-00.png`, `-01`, `dt-home-mob-00.png`: header chiaro, fondo avorio, footer chiaro. Le sezioni della home sono ancora quelle vecchie: è atteso.
- [x] **Step 3**: lo script sta in una cartella gitignorata: nessun commit.

---

## FASE 2 — Home, un capitolo per commit

Regole comuni a ogni task di questa fase: la sezione è `<section id=… className="dt-chapter">` con dentro `div.dt-row`; nessun `data-tone`/`data-surface`; titolo in `font-display text-d1|d2` (uppercase per regola); paragrafo in `lead`; foto `<Image fill className="object-cover" sizes=…>` dentro `div.relative.aspect-square` (o `aspect-[4/5]`, `aspect-video`) SENZA `rounded`; movimento solo `Reveal`/`TextLines`/`Parallax`. Dopo ogni task: `npm run typecheck && npm run lint`, screenshot della sezione (`capture.mjs ours` e lettura della slice giusta), commit.

### Task 9: `app/page.tsx` — ordine nuovo e contratto

**Files:**
- Modify: `app/page.tsx`

- [x] **Step 1**: sostituire il corpo di `Home()` con:

```tsx
/* CONTRATTO DI DIREZIONE (spec §3.0) — THESIS: una rivista immobiliare bianca:
   titoli maiuscoli enormi, paragrafi grandi e leggeri, media squadrati, vuoto.
   OWN-WORLD: un solo fondo avorio, Playfair maiuscolo, corsivo Pinyon rosso
   una volta per capitolo, rosso solo per accento e CTA, zero raggi/ombre/veli.
   STORY: chi vende capisce cosa facciamo, vede persone e case vere, legge le
   voci, e chiede la valutazione. FIRST VIEWPORT: header chiaro, lockup
   "Domus Tua" 13vw con firma sotto, H1, video a tutta larghezza, CTA a destra.
   FORM: il canone del riferimento pinnato dalla cliente, nella nostra palette. */
<>
  <Header />
  <main className="flex-1">
    <HeroCinematic />
    <Posizionamento />
    <HomeSearchGateway />
    <ComeLavoriamo />
    <Voci />
    <Paths />
    <Method />
    <OpenDomus />
    <DomusDocProtocol />
    <Services />
    <CostiChiari />
    <FeaturedTestimonial />
    <Social />
    <Team />
    <Contact />
    <Congedo />
  </main>
  <Footer />
  <WhatsAppFloat />
</>
```

Gli import di `ComeLavoriamo`, `Voci`, `Congedo` puntano a file creati nei Task 12, 13, 20: finché non esistono, lasciare al loro posto un commento e aggiungerli nel task relativo. Togliere gli import di `HorizonStory`, `StarReviews`, `SectionDivider`, `KineticStrip`, `ThreadNav`, `ToneShift`, e le prop `surface`/`tone`. Commit: `feat(home): l'ordine nuovo dei capitoli e il contratto di direzione`.

### Task 10: Hero chiaro (punti 3, 4, 5, 7 della chiamata)

**Files:**
- Modify: `app/components/HeroCinematic.tsx` (riscrittura del render; conservare: `copy` per lingua meno `subcopy`/`founder`, `Chars` e il rito `data-hero-char/tchar/schar` + `data-hero-rest`, `INTRO_EVENT`/`HERO_REST_MS`, il mount ritardato del `<video>` dopo l'LCP; `VideoLightbox` NON serve più: via)
- Modify: `app/globals.css` — blocco "Hero rest" resta; cancellare `.dt-hero-cue*`
- Test: `e2e/mobile-effects.spec.ts` (`[data-hero-media]` clip/scale e `[data-hero-cue]`: quei test si RIMUOVONO nel Task 25); `e2e/a11y.spec.ts` (un solo h1)

- [x] **Step 1: Copy** — in ogni lingua togliere `subcopy` e `founder`; sostituire `ctaVideo` con `ctaVendi` (it "Vendi casa", en "Sell your home", fr "Vendre", de "Verkaufen", es "Vender casa").

- [x] **Step 2: Render**

```tsx
<section id="top" className="relative bg-cream pt-[clamp(7rem,16vh,10rem)]">
  <div className="dt-row">
    {/* Lockup: font del logo (--font-brand), colori del logo */}
    <div className="relative">
      <div className="font-brand text-hero font-extrabold uppercase tracking-[-0.02em]">
        <span className="sr-only">Domus Tua</span>
        <Chars text="Domus" className="block text-graphite" />
        <Chars text="Tua" className="block text-red" />
      </div>
      {/* Firma: PIÙ IN BASSO (richiesta cliente): un em intero sotto il lockup */}
      <span data-hero-script aria-hidden className="script-word mt-[0.25em] block pl-[8vw] text-[clamp(2.2rem,6vw,5.5rem)]">
        <Chars text="Raffaela Rizza" variant="script" />
      </span>
    </div>
    <p className="mt-10 text-ui font-semibold uppercase tracking-[0.08em] text-stone">{c.badge}</p>
    <h1 className="mt-3 max-w-[22ch] font-display text-d2">
      <span className="sr-only">{`${c.title1} ${c.title2}`}</span>
      <Chars variant="tagline" text={c.title1} />{" "}
      <Chars variant="tagline" text={c.title2} className="text-red" />
    </h1>
  </div>
  {/* Video a tutta larghezza che risale sotto il titolo (rif.: top_margin_-26pct) */}
  <div data-hero-media className="relative mt-[clamp(2rem,6vh,4rem)] aspect-video w-full overflow-hidden">
    <Image src={heroPoster} alt={c.imageAlt} fill priority sizes="100vw" className="object-cover" />
    {videoReady && <video … className="absolute inset-0 h-full w-full object-cover" />}
  </div>
  {/* Box CTA A DESTRA (richiesta cliente) */}
  <div className="dt-row mt-[clamp(2rem,6vh,4rem)] flex justify-end">
    <div data-hero-seq className="dt-hero-rest flex w-full max-w-[520px] flex-col items-start gap-4">
      <Cta href="/valutazione-immobile-tradate" variant="cta-solid" size="lg">{c.ctaValuta}</Cta>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <Cta href="/vendi" variant="ghost" arrow={false}>{c.ctaVendi}</Cta>
        <Cta href="#cerca" variant="ghost" arrow={false}>{c.ctaCerco}</Cta>
      </div>
      <a href="#recensioni" className="mt-2 flex items-center gap-3 text-ui text-ink">
        <span className="flex gap-0.5">{cinque <Star className="h-4 w-4 text-gold" />}</span>
        <span className="font-semibold">{ratingDisplay}/5 · {c.reviews}</span>
      </a>
    </div>
  </div>
</section>
```

Via: velo `from-espresso`, `SegnoDomusVideoFrame`, `Magnetic`, chip premio (il sigillo Wikicasa torna in `Voci`), scroll cue, `mediaRef` parallasse puntatore, `data-hero-photo`/`.dt-mob-band` (la fascia mobile non serve: il video 16:9 è già una fascia), `VideoLightbox`, `youtubeWatch`. Il `<video>` resta montato dopo il primo paint come oggi (LCP = poster). La classe `dt-hero-rest` sul box CTA conserva il rito «appare dopo il primo scroll» — se con l'hero chiaro il box sta sotto la piega a 1440×900, TOGLIERE `dt-hero-rest` e `data-hero-seq` (la ragione del rito era l'hero a schermo intero).

- [x] **Step 3: Verificare** — typecheck/lint; `npm test` (content-integrity); screenshot desktop+mobile della hero (slice 00): lockup a 13vw, firma staccata, video a tutta larghezza, CTA a destra, nessun testo sotto 16 px. `e2e`: rimandato al Task 25.

- [x] **Step 4: Commit** — `feat(hero): chiara, lockup nel font del logo, firma più in basso, video a tutta larghezza, CTA a destra`

### Task 11: Posizionamento + ricerca a filo

**Files:**
- Modify: `app/components/Posizionamento.tsx`, `app/components/HomeSearchGateway.tsx`

- [x] **Step 1: Posizionamento** — griglia `lg:grid-cols-[5fr_7fr] gap-[6vw]`: colonna sinistra foto quadrata reale (una foto di `public/images/reali/` con il team o la sede: verificare i file), colonna destra `eyebrow` + `TextLines as="h2" className="font-display text-d2"` + `p.lead` + i tre `steps` come lista `text-body` con trattino rosso. Via `text-center`, `max-w-3xl`, `data-tone`.
- [x] **Step 2: Ricerca** — `section#cerca.dt-chapter` > `div.dt-row`: `h2.font-display.text-d2` (usare la chiave titolo già presente in `d`/`local`), poi `<form className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-4">` dove ogni campo è `label.text-ui.uppercase.tracking-[0.08em].text-stone` + `input/select` con `className="mt-2 w-full border-0 border-b border-ink bg-transparent py-3 text-body focus:border-red focus:outline-none"`; il bottone `CtaButton variant="cta-solid" size="lg"`. La riga "vendi": `<p className="lead mt-12">{testo} <Cta href="/vendi" variant="ghost" arrow={false}>{cta}</Cta></p>`. Via le due card, `rounded-*`, `shadow`, `segno-ambient`, chips `rounded-full` → chips come link testuali sottolineati (`dt-btn dt-btn--ghost dt-btn--sm`). Conservare `submit()`, `transitionTo`, i `useState`.
- [x] **Step 3**: `e2e/search.spec.ts` usa selettori? leggere e mantenere `name`/`aria-label` dei campi identici. Verificare: typecheck/lint, screenshot. Commit: `feat(ricerca): modulo a filo senza card, posizionamento su due colonne`.

### Task 12: "Come lavoriamo" (sostituisce HorizonStory) — punto 6

**Files:**
- Create: `app/components/ComeLavoriamo.tsx`
- Modify: `app/page.tsx` (import)
- Reuse: `copy` di `HorizonStory.tsx` (`eyebrow`, `statement`, `lead`, `stairs`, `subtitle`, `territory`, `cta`, `imageAlt`) copiato nel file nuovo; `site.videos.featured`, `LazyYouTubeEmbed`

- [x] **Step 1: Componente**

```tsx
"use client";
import Image from "next/image";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import Parallax from "./motion/Parallax";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";
const copy = { /* it/en/fr/de/es copiati da HorizonStory.copy + scriptWord: "Come lavoriamo" / "How we work" / "Notre méthode" / "So arbeiten wir" / "Cómo trabajamos" */ };
export default function ComeLavoriamo() {
  const { locale } = useLocale(); const c = copy[locale];
  return (
    <section className="dt-chapter bg-cream">
      <div className="dt-row">
        <Reveal><span className="eyebrow">{c.eyebrow}</span></Reveal>
        <TextLines as="h2" className="mt-6 max-w-[14ch] font-display text-d1">{c.statement}</TextLines>
        <Reveal delay={120}><span aria-hidden className="script-word -mt-[0.35em] block pl-[14vw]">{c.scriptWord}</span></Reveal>
        <Reveal delay={200}><p className="lead mt-10 ml-auto lg:mr-[10vw]">{c.lead}</p></Reveal>
      </div>
      <div className="mt-[clamp(3rem,8vh,6rem)] aspect-video w-full">
        <LazyYouTubeEmbed id={site.videos.featured.id} title={site.videos.featured.title} />
      </div>
      <div className="dt-row mt-[clamp(4rem,10vh,8rem)] grid gap-[6vw] lg:grid-cols-2 lg:items-center">
        <Parallax speed={-0.04}><div className="relative aspect-square"><Image src="/images/reali/… (la foto del territorio/attico già usata da HorizonStory)" alt={c.imageAlt} fill sizes="(max-width:1024px) 100vw, 45vw" className="object-cover" /></div></Parallax>
        <div>
          <TextLines as="h3" className="font-display text-d2">{c.stairs.join(" ")}</TextLines>
          <Reveal><p className="lead mt-6">{c.territory}</p></Reveal>
          <Reveal delay={100}><Cta href="/acquista" variant="ghost" className="mt-8">{c.cta}</Cta></Reveal>
        </div>
      </div>
    </section>
  );
}
```

`LazyYouTubeEmbed` ha `rounded-[1.5rem] bg-ink` (inventario): aggiornargli le classi a `bg-cream-deep` senza raggio (modifica nel componente stesso: la modifica è globale ed è voluta). Il `statement` di HorizonStory è JSX con `<br/>`: se `TextLines` accetta solo stringhe, unire in una stringa.

- [x] **Step 2**: page.tsx import; typecheck/lint; screenshot. Commit: `feat(come-lavoriamo): titolo, corsivo, video in pagina e territorio al posto della cupola`.

### Task 13: "Le voci" (punto 9)

**Files:**
- Create: `app/components/Voci.tsx`
- Modify: `app/page.tsx`
- Reuse: `wallVideos`, `youtubeWatch` da `lib/videos`; `site.reviewsCount`, `ratingLabel`; `TrustindexEmbed`; `YoutubeThumb`; `VideoLightbox` (apre il video in pagina: già usato da ReviewsWall — conservare il contratto overlay `setOverlay`); il sigillo Wikicasa (`public/badges/`, `site.awards`)

- [x] **Step 1: Componente**

```tsx
<section id="recensioni" className="dt-chapter bg-cream">
  <div className="dt-row">
    <Reveal><span className="eyebrow">{c.eyebrow /* "Cosa dicono di noi" */}</span></Reveal>
    <TextLines as="h2" className="mt-6 font-display text-d1 tnum">{`${ratingLabel(locale)}/5 · ${site.reviewsCount} ${c.google}`}</TextLines>
    <Reveal><p className="lead mt-8">{c.lead /* la descrizione di ReviewsWall.copy */}</p></Reveal>
  </div>
  {/* Carosello nativo con frecce */}
  <div className="relative mt-[clamp(3rem,8vh,6rem)]">
    <ul ref={railRef} className="flex snap-x snap-mandatory gap-[3vw] overflow-x-auto px-[8vw] pb-4 [scrollbar-width:none]" aria-label={c.listLabel}>
      {wallVideos.map((v) => (
        <li key={v.id} className="w-[86vw] shrink-0 snap-start lg:w-[58vw]">
          <button type="button" onClick={() => setOpen(v)} className="group block w-full text-left">
            <span className="relative block aspect-video overflow-hidden bg-cream-deep">
              <YoutubeThumb id={v.id} … className="object-cover" />
              <span className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red text-white"><Play className="h-7 w-7" /></span>
            </span>
            <span className="mt-4 block text-body">{v.title}</span>
          </button>
        </li>
      ))}
    </ul>
    <div className="dt-row mt-6 flex gap-3">
      <button type="button" aria-label={c.prev} onClick={() => scrollBy(-1)} className="flex h-14 w-14 items-center justify-center rounded-full border border-ink text-ink hover:bg-ink hover:text-cream"><ArrowLeft /></button>
      <button type="button" aria-label={c.next} onClick={() => scrollBy(1)} className="flex h-14 w-14 items-center justify-center rounded-full border border-ink text-ink hover:bg-ink hover:text-cream"><ArrowRight /></button>
    </div>
  </div>
  <div className="dt-row mt-[clamp(4rem,10vh,8rem)]">
    <TrustindexEmbed />
    <Cta href="/recensioni" variant="ghost" className="mt-8">{c.all}</Cta>
  </div>
  <VideoLightbox video={open} onClose={() => setOpen(null)} />
</section>
```

`scrollBy(dir)`: `railRef.current?.scrollBy({ left: dir * railRef.current.clientWidth * 0.6, behavior: "smooth" })`. Frecce con icone reali (`Icons.tsx` ha `ArrowRight`; se manca `ArrowLeft`, aggiungerla lì). Copy in 5 lingue (riusare `ReviewsWall.copy` + chiavi nuove `google`, `listLabel`, `prev`, `next`, `all`).

- [x] **Step 2**: `e2e/consent-reviews.spec.ts` (Trustindex solo dopo consenso) deve restare verde: `TrustindexEmbed` invariato. typecheck/lint; screenshot. Commit: `feat(voci): il muro delle voci rifatto — numero grande, carosello dei video, recensioni`.

### Task 14: Due percorsi piani

**Files:** Modify `app/components/Paths.tsx` (riscrittura render; conservare copy e i due link /vendi /acquista)

- [x] **Step 1**: `section.dt-chapter` > `div.dt-row`: `eyebrow` + `h2.text-d1` (max-w 16ch); poi due righe `grid lg:grid-cols-2 gap-[6vw] items-center`, la seconda con la foto a destra (`lg:order-2`): foto `aspect-square` (le stesse immagini reali già usate nei pannelli), `h3.font-display.text-d2`, `p.lead`, `Cta variant="ghost"`. Via: runway, sticky, SplitText, clip-path, scrim, `Fioritura`, `SurfaceVeil`, CSS `.dt-paths*` (cancellare il blocco `:1641-1693`).
- [x] **Step 2**: typecheck/lint; screenshot; commit `feat(percorsi): due righe editoriali piane al posto dei pannelli scuri`.

### Task 15: Metodo — atti e passi numerati

**Files:** Modify `app/components/Method.tsx` (conservare `copy`: titolo, 3 atti con titolo/testo/foto, 9 passi)

- [x] **Step 1**: `section#metodo.dt-chapter` > `div.dt-row`: `eyebrow` allineata a destra + `TextLines as="h2" className="ml-auto max-w-[14ch] text-right font-display text-d1"` (tre righe); poi per ogni atto `div.mt-[10vh].grid.lg:grid-cols-[1fr_1.2fr].gap-[6vw].items-start`: sinistra `span.script-word` (parola dell'atto: it "Ascolto" / "Racconto" / "Firma" — derivare dalle 3 chiavi di copy esistenti) + foto `aspect-square` sotto; destra `h3.text-d2` + `p.lead`; poi la lista dei 9 passi: `ol.mt-[10vh].grid.md:grid-cols-3.gap-x-[4vw].gap-y-16` con `li`: `span.font-display.text-d1.font-light` numero `01.`…`09.`, `h4.mt-4.font-display.text-d3`, `p.mt-3.text-body.text-graphite`. Via: SVG mask/feTurbulence, `Atmosphere`, `CharFlip`, `Fioritura`, monogramma finale, `overflow-hidden`.
- [x] **Step 2**: typecheck/lint; screenshot; commit `feat(metodo): tre atti e nove passi numerati, senza maschere né fiori`.

### Task 16: Open Domus e D.O.C.

**Files:** Modify `app/components/OpenDomus.tsx`, `app/components/DomusDocProtocol.tsx`; `app/globals.css` cancellare "Open Domus: i coni d'ombra" (`:1077-1129`) e "Sigillo D.O.C." (`:1130-1216`)

- [x] **Step 1 Open Domus**: `section#open-domus.dt-chapter` > `grid lg:grid-cols-[1.1fr_1fr] gap-[6vw]`: foto `aspect-[4/5]` (la foto reale già usata) a sinistra; destra `eyebrow`, `h2.text-d2`, `p.lead`, poi `div.mt-10.grid.sm:grid-cols-2.gap-8` con le due liste (`h3.text-d4.font-light` + `ul.text-body` con trattino rosso). Via `LiquidReveal`, `CharFlip`, gradienti, card, `dt-godray`.
- [x] **Step 2 D.O.C.**: `section.dt-chapter` > `div.dt-row`: `div.flex.items-start.gap-8`: sigillo SVG (già nel componente) 96 px fermo + `div`: `eyebrow`, `h2.text-d2`, `p.lead`; poi checklist `ul.mt-10.grid.md:grid-cols-2.gap-x-[4vw].gap-y-6.text-body`. Via card, `shadow`, lampo, `Fioritura`, `Parallax` sul sigillo. La prop `tone` resta nella firma (la usano le pagine interne) ma non rende più `bg-*`.
- [x] **Step 3**: typecheck/lint (`grep -rn "dt-godray\|dt-docseal" app` → 0); screenshot; commit `feat(open-domus, doc): righe piane con foto grande e checklist`.

### Task 17: Servizi, Costi, Testimonianza

**Files:** Modify `app/components/Services.tsx`, `CostiChiari.tsx`, `FeaturedTestimonial.tsx` (`.dt-railway`/`.dt-rail` in globals restano: li usa `HorizontalRail` per il team)

- [x] **Step 1 Servizi**: `section#servizi.dt-chapter`: `eyebrow` + `h2.text-d1.max-w-[18ch]`; `ul.mt-[8vh].grid.md:grid-cols-2.lg:grid-cols-3.gap-x-[3vw].gap-y-16`: `li` = foto `aspect-square` + `h3.mt-5.text-d3` + `p.mt-3.text-body`; la feature rendering come riga `grid lg:grid-cols-2` sotto (foto 4:5 + titolo `d2` + lead + `Cta ghost`). Via `HorizontalRail`, `HoverDistort`, `MaskReveal`, `Atmosphere`, `CharFlip`, gradienti, card grafite.
- [x] **Step 2 Costi**: `section.dt-chapter` > `div.dt-row.max-w-[900px]`: `eyebrow`, `h2.text-d2`, `span.script-word` ("Nessun anticipo" / "No upfront cost" / "Aucune avance" / "Keine Vorauszahlung" / "Sin anticipos"), `p.lead`. Via card. Prop `surface` resta ma inerte.
- [x] **Step 3 Testimonianza**: `section.dt-chapter` > `grid lg:grid-cols-[1fr_1.2fr] gap-[6vw] items-center`: foto quadrata a sinistra (senza gradiente); destra `eyebrow`, `blockquote.font-display.text-d3` (tondo), `p.mt-6.text-body` nome/contesto, `Cta ghost` al video. Via `bg-ink`, `MaskReveal`, `Fioritura`.
- [x] **Step 4**: typecheck/lint; screenshot; commit `feat(servizi, costi, testimonianza): griglia piana, statement col corsivo, citazione su chiaro`.

### Task 18: Social e Team con rotaia orizzontale (punto 12)

**Files:** Modify `app/components/Social.tsx`, `app/components/Team.tsx`; Delete `app/components/TeamTrail.tsx`; `app/globals.css`: cancellare "Trail del team" + "TeamTrail corridoio" (`:2967-3043`) e "Social rail" (`:1217-1283`) se non usati da `HorizontalRail`

- [x] **Step 1 Social**: `section.dt-chapter`: `eyebrow` + `h2.text-d2`; il feed IG (`IframeWidget`, consent-gated) in `div.mt-10.aspect-[4/3].lg:aspect-[21/9]`; `SocialLinks` sotto. Via `RailProgress`, `CharFlip`, chip `rounded-full`.
- [x] **Step 2 Team**: `section#chi-siamo.dt-chapter`: intro `grid lg:grid-cols-[1fr_1.1fr] gap-[6vw]`: foto founder `aspect-[4/5]` a sinistra; destra `eyebrow`, `h2.text-d1` ("Persone prima degli immobili."), `p.lead`, `blockquote.mt-8.font-display.text-d3` + nome/ruolo `text-body`, `Cta ghost`. Poi la rotaia:

```tsx
<div className="mt-[10vh]">
  <p className="dt-row eyebrow">{c.rosterTitle}</p>
  <HorizontalRail runway={120} snapMobile cursor="" className="mt-8">
    {team.map((m) => (
      <figure key={m.name} className="w-[78vw] shrink-0 snap-start sm:w-[52vw] lg:w-[34vw]">
        <div className="relative aspect-[4/5] bg-cream-deep">
          {m.image ? <Image src={m.image} alt={m.name} fill sizes="34vw" className="object-cover" style={{ objectPosition: m.imagePos }} /> :
            <span className="absolute inset-0 flex items-center justify-center font-display text-d1 text-stone">{teamInitials(m)}</span>}
        </div>
        <figcaption className="mt-5"><span className="block font-display text-d3">{m.name}</span><span className="mt-1 block text-body text-stone">{teamRoleLabels[locale][m.role]}</span></figcaption>
      </figure>
    ))}
  </HorizontalRail>
</div>
```

Leggere `HorizontalRail.tsx` per la firma esatta (children = tessere del track? richiede `data-depth`/`.dt-rail_pan`?) e adeguare. Via `Fioritura`, `Atmosphere`, `CharFlip`, `MaskReveal`, `TeamTrail`, card `rounded`.

- [x] **Step 3**: typecheck/lint (`grep -rn TeamTrail app` → 0); screenshot desktop (rotaia pinnata: slice dove il team è a schermo) e mobile (scorrimento nativo); commit `feat(team): rotaia orizzontale con ritratti grandi; social piatto`.

### Task 19: Contatti a filo

**Files:** Modify `app/components/Contact.tsx` (SOLO markup/classi: la logica del form, gli `intent`, `window.open`, la validazione e gli `id`/`name` dei campi restano IDENTICI — `e2e/contact.spec.ts` e `analytics.test.ts` li leggono)

- [x] **Step 1**: `section#contatti.dt-chapter` > `grid lg:grid-cols-[1fr_1.1fr] gap-[6vw]`: sinistra `eyebrow`, `h2.text-d1` (max-w 12ch), `p.lead`, recapiti come `h3.text-d4.font-light` + `a.text-body`, foto quadrata sotto (via `arch-frame`); destra il `<form>` con i campi come nel Task 11 (bordo inferiore, etichette 16 px uppercase), `SendCta`. Via card, `shadow`, `CameraIn`, `Atmosphere`, `Fioritura`, `CharFlip`, `rounded-*`.
- [x] **Step 2**: `npm test` (analytics) e `npx playwright test e2e/contact.spec.ts --config=playwright.site.config.ts` verdi; screenshot; commit `feat(contatti): modulo a filo e recapiti grandi, senza card né arco`.

### Task 20: Congedo (banda video) e via KineticStrip

**Files:** Create `app/components/Congedo.tsx`; Delete `app/components/motion/KineticStrip.tsx`; `app/globals.css` cancellare `.dt-kinetic_line` (`:3118-3128`)

- [x] **Step 1**:

```tsx
export default function Congedo() {
  const { locale } = useLocale(); const c = copy[locale]; // title: il payoff "Vendere casa, senza stress." (riusare la chiave del payoff se esiste nel dizionario) · cta: "Contattaci"
  return (
    <section className="relative aspect-video min-h-[70svh] w-full overflow-hidden">
      <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline preload="metadata" poster="/images/reali/… (poster dell'hero)" aria-hidden><source src="/media/domus-hero.mp4" type="video/mp4" /></video>
      <div className="dt-row absolute inset-x-0 bottom-[12vh]">
        <h2 className="max-w-[12ch] font-display text-d1 text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]">{c.title}</h2>
        <Cta href="#contatti" variant="ghost-dark" className="mt-8 text-d4" arrow={false}>{c.cta}</Cta>
      </div>
    </section>
  );
}
```

Sotto 768 e con reduced-motion il `<video>` non parte (`matchMedia` nel client): mostrare il poster. Testo bianco senza velo (rif.); la text-shadow leggerissima è ammessa (non è una vignetta).

- [x] **Step 2**: typecheck/lint; screenshot; commit `feat(congedo): banda video finale con titolo bianco al posto del nastro cinetico`.

### Task 21: Verifica di fase 2

- [x] `npm run typecheck && npm run lint && npm test` verdi; `capture.mjs ours`; leggere TUTTE le slice desktop e mobile della home; annotare i difetti in una lista; correggerli in un solo giro; ricatturare e confermare. Misura attesa: home ≤ 14.000 px a 1440 (era 44.589). Commit `fix(home): il giro di correzioni dopo gli screenshot di fase 2`.

---

## FASE 3 — Pagine interne

### Task 22: PageHero chiaro

**Files:** Modify `app/components/PageHero.tsx` (prop invariate: leggere la firma; aggiungere `scriptWord?: string`)

- [x] **Step 1**: `section.bg-cream.pt-[clamp(7rem,16vh,10rem)]` > `div.dt-row`: `eyebrow` (se c'è), `h1.font-display.text-[clamp(3rem,8vw,9rem)].leading-[0.92]`, `span.script-word` sovrapposto (`-mt-[0.4em] pl-[10vw]`), `p.lead` allineato a sinistra `max-w-[50ch]`; foto sotto `div.mt-[6vh].aspect-[16/9].w-full` (`Image fill`). Via `bg-ink`, `min-h-[82vh]`, scrim, badge `backdrop-blur`, `text-cream`.
- [x] **Step 2**: ogni chiamante (`VendiContent`, `AcquistaContent`, `ChiSiamoContent`, `MetodoContent`, `OpenDomusPageContent`, `ServiziContent`, `RecensioniContent`, `LavoraConNoiContent`, `FaqContent`) passa `scriptWord` in 5 lingue (es. vendi: "Vendere"/"Selling"/"Vendre"/"Verkaufen"/"Vender"). typecheck; `e2e/pages.spec.ts` (title) verde; screenshot di `/vendi` e `/chi-siamo`; commit `feat(page-hero): l'hero delle pagine interne diventa chiaro, con titolo a 8vw`.

### Task 23: /metodo senza ManifestoPin; residui scuri e raggi nelle interne

**Files:** Modify `app/metodo/MetodoContent.tsx` (statement in `section.dt-chapter` con `h2.text-d1` e `p.lead`, via `ManifestoPin`); Delete `app/components/motion/ManifestoPin.tsx`; Modify `app/open-domus/OpenDomusPageContent.tsx`, `app/vendi/VendiContent.tsx`, `app/lavora-con-noi/LavoraConNoiContent.tsx`, `app/case-vendute/CaseVenduteContent.tsx`, `app/components/EditorialRows.tsx`, `Highlights.tsx`, `FaqList.tsx`, `FaqTeaser.tsx`, `PropertyCard.tsx`, `PropertyGallery.tsx`, `LazyYouTubeEmbed.tsx`, `CareerApplication.tsx`, `CaseQuickLook.tsx`, `Reviews.tsx`, `Stats.tsx`

- [x] **Step 1**: `grep -rnE "bg-(ink|espresso|wine|graphite)|from-ink|via-ink|text-cream" app --include=*.tsx` e `grep -rnE "rounded-(\[|2xl|xl|lg|card|t|b)" app --include=*.tsx | grep -v "rounded-full"`: per ogni occorrenza fuori dal preloader: superfici scure → `bg-cream-deep`/testo `text-ink`; raggi → togliere; `shadow-[…]` → togliere; `text-xs|text-sm|text-\[0\.[6-9]` → `text-ui`/`text-body`. `Stats.tsx`: se usato solo da /chi-siamo e /recensioni con `CountUp`, sostituire con una riga `text-d1` del solo 4,9/531 (numeri con fonte) e cancellare `CountUp`.
- [x] **Step 2**: typecheck/lint/test; screenshot di `/open-domus`, `/servizi`, `/lavora-con-noi`, `/case/<slug>` (una scheda); commit `feat(interne): niente scuro, niente raggi, niente scritte piccole nelle pagine interne`.

---

## FASE 4 — Cancellazioni e test

### Task 24: Cancellare i sistemi del vecchio WOW layer

**Files:**
- Delete: `app/components/motion/{Fioritura,HorizonScroller,ThreadNav,ToneShift,SurfaceVeil,CharFlip,Atmosphere,HoverDistort,LiquidReveal,Magnetic,CameraIn,ScrubWords,VelocityMarquee,DrawOnScroll,Odometer,MaskReveal}.tsx`, `app/components/{HorizonStory,ReviewsWall,StarReviews,SectionDivider,Stats,CountUp}.tsx`, `app/lib/star-shape.ts`, `app/components/BrandMotif.tsx` (se `SegnoDomus` non è più importato; altrimenti ridurlo a quel solo export)
- Modify: `app/globals.css` — cancellare i blocchi: PROFONDITÀ & ATMOSFERA (`:652-693` salvo `.bg-cream-deep` se serve), HorizonStory, ReviewsWall, Cinque stelle, CharFlip, ToneShift + filo, ThreadNav, stelle ORO (tenere SOLO il colore delle stelle usato in hero/voci), Due percorsi, Cursor, Trail/TeamTrail, Footer reveal, kinetic; `.reveal`/`.word-reveal` restano; `.marquee-track`, `.ken-burns`, `dt-float` via; `dt-gallery-rail` resta (PropertyGallery)
- Modify: `app/lib/motion/gsap.ts` (togliere i plugin non più usati: `Flip` se `CaseQuickLook` non lo usa più; `SplitText` resta per `TextLines`), `app/lib/motion/warmup.ts` (se nessuno lo chiama più: cancellare)
- Modify: `docs/effetti-reference.md`, `docs/wow-layer-plan.md`: aggiungere in testa una riga «superato dal 2026-09-10, vedi spec rivista bianca»

- [x] **Step 1**: cancellare i file; `npm run typecheck` elenca ogni import rotto: sistemarli uno a uno (mai reintrodurre il primitivo: togliere l'uso).
- [x] **Step 2**: pulire `globals.css` blocco per blocco; dopo ogni blocco `npm run lint` (Tailwind rifiuta CSS invalido); `grep -c "" app/globals.css` atteso < 1.800 righe.
- [x] **Step 3**: `npm test` verde (content-integrity cammina i .tsx); commit `chore(wow-layer): via i sistemi che il redesign ha sostituito`.

### Task 25: Test e2e aggiornati

**Files:** Modify `e2e/mobile-effects.spec.ts`, `e2e/mobile-motion.spec.ts`, `e2e/motion.spec.ts`, `e2e/home.spec.ts`; `app/lib/__tests__/intro-clocks.test.ts` legge `e2e/mobile-motion.spec.ts` (verificare quale asserzione: conservarla)

- [ ] **Step 1**: rimuovere i `test()` che provano cose cancellate: `[data-hero-media]` clip-path/scale/yPercent, `[data-hero-cue]`, il censimento Fioritura, `[data-paths-panel]`, la transizione di pagina (`--arch-w/--arch-y` FUORI dal preloader), TeamTrail, ReviewsWall, StarReviews. Conservare: preloader (`#dt-preloader`, `--arch-*` registrati, handoff/skip/cookie), `[data-hero-char]`, reduced-motion, header per larghezza.
- [ ] **Step 2**: `npm run test:e2e` (build di produzione su :3177: ~10 min). Ogni fallimento residuo si legge: se prova un comportamento rimosso → si toglie il test; se prova un comportamento che deve restare (a11y, contrasto, un solo h1, title, form, ricerca, consenso) → si corregge il CODICE.
- [ ] **Step 3**: commit `test(e2e): via le prove dei sistemi rimossi; verdi le prove di ciò che resta`.

### Task 26: `npm run check`

- [ ] `npm run check` (lint + typecheck + test + build) verde. Se `next build` segnala classi/asset mancanti, correggere. Commit se serve.

---

## FASE 5 — Verifica finale e documentazione

### Task 27: Screenshot finali e revisione contro il contratto

- [ ] **Step 1**: `capture.mjs ours` su home; aggiungere allo script `/vendi`, `/chi-siamo`, `/contatti` (desktop) e leggere tutte le slice. Confrontare con `shots/gg-*`: fondo unico, titoli a 10vh, lead grandi, media squadrati, un corsivo per capitolo, nessun testo < 16 px (Browser pane `javascript_tool`: `[...document.querySelectorAll('main *')].filter(e=>e.innerText&&parseFloat(getComputedStyle(e).fontSize)<16).length` → 0), nessun `border-radius` > 0 su elementi > 40 px larghi tranne icon-button (stesso metodo delle metriche del dossier: `radii`), nessun colore di fondo scuro fuori dal preloader.
- [ ] **Step 2**: un giro di correzioni, una ricattura di conferma. Commit `fix(rivista): il giro di correzioni finale`.
- [ ] **Step 3**: spawn del reviewer di finitura Impeccable (`impeccable-finish-reviewer`) con richiesta originale, risposte, `app/page.tsx`, gli screenshot, il contratto §3.0; applicare le correzioni materiali.

### Task 28: DESIGN.md, PRODUCT.md, piano del progetto, memoria

**Files:** Create `DESIGN.md` (radice, via documenter Impeccable) e aggiornare `docs/DESIGN.md` con un rimando; Modify `PRODUCT.md` (Brand Commitments: «niente curve, niente card, niente fiori, niente superfici scure, nessun testo sotto 16 px; movimento: Reveal/TextLines/Parallax; riferimento: immobiliaregoldengoal.it»; Operating Context: via «livello awwwards»); Modify `docs/piano-documento-finale.md` (una sezione «2026-09-10: redesign rivista bianca» con lo stato); Modify `docs/logo-assets.md` (§ «logo nuovo: dove cambiare `--font-brand`»)

- [ ] **Step 1**: spawn `impeccable-documenter` con root, `app/page.tsx`, contratto, PRODUCT.md, `document.md` → scrive `DESIGN.md` dal costruito.
- [ ] **Step 2**: PRODUCT.md e docs come sopra; commit `docs(design): il sistema della rivista bianca, registrato dal costruito`.
- [ ] **Step 3**: aprire la PR verso `main` con `gh pr create` (titolo: «La rivista bianca: il redesign chiesto dalla cliente il 10 settembre»; corpo: lista della chiamata con ✔ per voce, screenshot prima/dopo, cosa resta aperto: logo nuovo, foto team).
