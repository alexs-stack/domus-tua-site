# Design System — Domus Tua

Sintesi operativa del sistema attuale, letta da `app/globals.css`.
Concept: **Editorial Luxury × fiducia locale**. Palette rosso / grigio / bianco caldo.
Serif Fraunces (display) + Plus Jakarta Sans (UI). Serve a far lavorare un collega
senza dover reverse-engineerare il CSS.

---

## 1. Palette

Definita come token `@theme inline` (usabili come `bg-*`, `text-*`, `border-*`).

### Brand

| Token | Hex | Uso |
| --- | --- | --- |
| `--color-red` | `#d20a0a` | Accento primario: CTA, "Tua", eyebrow, stelle, `::selection`. |
| `--color-red-dark` | `#a30707` | Stato hover del rosso, estremo del gradiente barra scroll. |
| `--color-red-soft` | `#fbeaea` | Rosso tenue: sfondi soft, focus ring su superfici scure, eyebrow light. |

### Neutri — caldi

| Token | Hex | Uso |
| --- | --- | --- |
| `--color-ink` | `#1a1816` | Testo principale, sezioni scure (`bg-ink`). Non è nero pieno. |
| `--color-graphite` | `#46423d` | "Domus" nel wordmark, tratti del logo, testo forte. |
| `--color-stone` | `#6b665f` | Testo secondario, didascalie, payoff. |
| `--color-line` | `#e7e2da` | Bordi hairline, `border-color` di default globale. |
| `--color-cream` | `#faf7f1` | Sfondo sezioni (es. Hero). |
| `--color-cream-deep` | `#f3eee5` | Sfondo alternativo più caldo, testo su fondo scuro. |
| `--color-paper` | `#fffdfa` | Sfondo base (`--background`), superficie card. |

`--background: #fffdfa` · `--foreground: #1a1816`.

**Regole brand cromatiche:** niente oro, niente blu, mai nero pieno (`#000`), niente
estetica SaaS. Il rosso è accento puntuale, non colore di riempimento diffuso.

---

## 2. Tipografia

Font caricati via `next/font` sul `<body>` ed esposti come token:

- `--font-display: var(--font-fraunces)` → serif editoriale. Helper: `.font-display`
  (`font-optical-sizing: auto`, fallback `Georgia, serif`). Per titoli, wordmark, cifre display.
- `--font-sans: var(--font-jakarta)` → **Plus Jakarta Sans**, UI/corpo. Default su `body`
  con `font-feature-settings: "ss01", "cv01"`.

### Helper tipografici

- **`.eyebrow`** — micro-label sopra i titoli: `0.6875rem`, `font-weight 600`,
  `letter-spacing 0.22em`, uppercase, colore rosso, con trattino `::before` (1.75rem × 1px,
  opacità 0.6). Varianti: `.eyebrow--center` (nasconde il trattino), `.eyebrow-light`
  (`--color-red-soft`, per sezioni scure).
- **`.balance`** — `text-wrap: balance` per titoli su più righe equilibrati.
- **`.tnum`** — cifre tabellari (`tabular-nums lining-nums`, `"tnum" 1`) per prezzi, statistiche, rating.
- **`.word-reveal .w`** — parole in animazione d'ingresso (vedi Motion).

### Scala titoli (dall'uso reale, es. Hero)

Titoli display fluidi impostati inline con Tailwind, non come classi di scala fissa:
`text-[2.7rem]` → `sm:text-6xl` → `lg:text-[4.3rem]`, con `leading-[1.02]`,
`tracking-[-0.02em]`, `font-medium`. Corpo: `text-[1.02rem]`/`sm:text-lg`,
`leading-relaxed`, colore `text-stone`.

---

## 3. Spaziatura & ritmo

- **Ritmo verticale delle sezioni:** padding generoso, tipicamente `py-24` / `py-32`
  (nello Hero: `pt-32` → `lg:pt-36`, `pb-20` → `lg:pb-28`). Mantenere questo respiro.
- **Larghezza contenuto:** container centrato con `max-w-[1240px]` (Hero) o simile,
  padding orizzontale `px-5` → `sm:px-8`.
- **Ancore/anchor scroll:** `:where([id])` ha `scroll-margin-top: 6.5rem` per non finire
  sotto l'header sticky. `html` ha `scroll-behavior: smooth`.
- **No scroll orizzontale:** `overflow-x: clip` su `html` e `body`.

---

## 4. Radius, superfici, ombre

- **Radius:** pattern morbido su superfici grandi, `rounded-[2rem]` / `rounded-[2.2rem]`
  per card e cornici immagine; radius interni calcolati (`rounded-[calc(2.2rem-0.5rem)]`)
  quando c'è un padding di cornice. Pill (`rounded-full`) per bottoni e chip. Focus ring
  con `border-radius: 2px`.
- **Ombre soft, mai dure.** Ombre lunghe, molto diffuse, a bassa opacità di `ink`, sempre
  verso il basso. Esempi dallo Hero:
  - `shadow-[0_50px_100px_-60px_rgba(26,24,22,0.6)]` (cornice grande)
  - `shadow-[0_24px_50px_-30px_rgba(26,24,22,0.55)]` (tag)
  - `shadow-[0_18px_40px_-24px_rgba(26,24,22,0.5)]` (chip)
- **Hairline:** `.hairline` = linea 1px con gradiente che sfuma ai bordi
  (`transparent → --color-line → transparent`). Usata come divider leggero.
- **Grana:** `.grain` — texture noise SVG fixed, `opacity 0.035`, `mix-blend-mode: multiply`,
  `pointer-events: none`. Dà calore materico senza rumore visivo.

---

## 5. Motion

- **Easing token:** `--ease-soft` `cubic-bezier(0.32, 0.72, 0, 1)` (transizioni UI, bottoni)
  e `--ease-out-expo` `cubic-bezier(0.16, 1, 0.3, 1)` (reveal, ingressi).
- **`.reveal`** — ingresso allo scroll: da `opacity 0` + `translateY(2.5rem)` + `blur(6px)`
  a stato pieno quando riceve `.is-in`. Durata 0.9s, `ease-out-expo`.
- **`.word-reveal`** — titoli editoriali parola-per-parola: ogni `.w` sale da `translateY(0.5em)`
  con opacità, 0.85s. Supporta `startDelay` (vedi Hero).
- **Scroll-driven (progressive enhancement)** sotto `@supports (animation-timeline: scroll())`:
  - `.scroll-progress` — barra in alto, gradiente `red-dark → red`, `scaleX` legato allo scroll root.
  - `.hero-parallax` — leggera risalita/attenuazione dell'hero (`animation-range: 0 100vh`).
- **Continue:** `.marquee-track` (loop 38s lineare), `.ken-burns` (zoom cinematografico 18s
  sull'hero image), `dt-float`, `dt-scrollcue`.
- **`prefers-reduced-motion: reduce`** — gestito con cura: `.reveal` e `.word-reveal` diventano
  statici e visibili, si fermano marquee/ken-burns/scroll-progress/hero-parallax, e tutte le
  animazioni/transizioni sono ridotte a `~0.001ms`. **Ogni nuova animazione deve rispettare
  questa media query.**

---

## 6. Accessibilità

- **Focus visibile coerente col brand:** `:focus-visible` con `outline: 2px solid --color-red`,
  `outline-offset: 3px`. Su superfici scure (`.bg-ink`, `.text-cream`) l'anello passa a
  `--color-red-soft` per contrasto.
- **Rendering testo:** `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`.
- **Selezione:** `::selection` rosso su bianco.

---

## 7. Regole brand (riassunto)

- Palette **rosso / grigio / bianco caldo**. "Domus" grigio + "Tua" rosso.
- **NIENTE oro, NIENTE blu, niente nero pieno, niente estetica SaaS.**
- Rosso = accento puntuale (CTA, un dettaglio), non riempimento.
- Tono visivo: umano, empatico, raffinato, editoriale italiano. Ombre soft, radius ampi,
  grana leggera, tipografia serif per l'emozione + sans per la chiarezza.
- Vedi anche `docs/brand-motif.md` per "Il Segno Domus", il motif derivato dal logo.

---

## 8. Da fare — primitive da estrarre

Oggi molti pattern vivono inline nei componenti (es. `Hero.tsx`). Per scalare, andrebbero
estratti in primitive riutilizzabili, senza cambiare l'aspetto:

- **`Button`** — dalle CTA dello Hero: variante primaria (`bg-red`, pill, `hover:bg-red-dark`,
  `active:scale-[0.98]`, icona in cerchio `bg-white/15`), secondaria (`border-ink/15 bg-paper`,
  `hover:border-red hover:text-red`), testuale/link (`text-stone → hover:text-ink`, freccia che
  scorre). Easing `--ease-soft`, durate ~300ms.
- **`Card`** — superficie `bg-paper`, `border-line`, `rounded-[2rem]`+, ombra soft; slot per
  immagine con cornice interna e radius calcolato; eventuali tag/chip flottanti.
- **`Badge` / `Chip`** — pill `bg-paper border-line` con ombra piccola, per rating e prove di fiducia
  (usa `.tnum` per le cifre).
- **`Section`** — wrapper con ritmo verticale standard (`py-24`/`py-32`), container `max-w`,
  padding orizzontale responsive, e supporto opzionale a `.eyebrow` + titolo `.balance`.

Nota: non introdurre dipendenze nuove; queste primitive vanno costruite con Tailwind v4 e i token
già definiti in `globals.css`.

## Primitive implementate (`app/components/primitives/`)

Disponibili e pronte all'uso (codificano i pattern esistenti, nessun cambio visivo all'adozione):

- **`Container`** — `mx-auto max-w-[1240px] px-5 sm:px-8`.
- **`Section`** — `<section>` + `Container`; props `tone` (`paper`/`cream`/`cream-deep`/`ink`),
  `spacing` (`normal` = `py-24 sm:py-32`, `compact` = `py-16 sm:py-20`), `id`.
- **`Button`** — props `variant` (`primary`/`outline`/`dark`), `size` (`sm`/`md`), `icon`
  (cerchietto button-in-button); rende `<a>` se c'è `href`, altrimenti `<button>`.
- **`Card`** — superficie `rounded-[2rem] border-line`, `tone`, `padded`.
- **`Badge`** — pill `variant` (`onImage`/`soft`/`outline`).

Adozione di riferimento: `PropertyCard` usa `Badge variant="onImage"`. La migrazione dei restanti
componenti (Paths, Contact, Services, ecc.) va fatta in modo incrementale con QA visivo, per evitare
regressioni sull'UI già rifinita.

## Il Segno Domus (elemento differenziante)

Vedi `docs/brand-motif.md`. Implementato in `app/components/BrandMotif.tsx` (`SegnoDomus`,
`MotifCorner`) e `SectionDivider.tsx`. Presente nel footer e nei divisori di sezione della home.
