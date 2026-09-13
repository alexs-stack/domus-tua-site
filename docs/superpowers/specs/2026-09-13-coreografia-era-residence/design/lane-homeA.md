# Home, capitoli 1-6: la coreografia di era-residence (corsia homeA)

2026-09-13. Direttive: A18 «Coreografia piena», A19 «Sticky dove serve», A20 «Fedeltà letterale» (Alberto, 13 set.). Superano C03 e DESIGN.md:573 e :587: vanno registrate come A e girate alla cliente come domanda.
Fonti dei valori: `map/era-catalog.md` §2, §3, §6, §6a, §6b, §6c, §C5; `reverse-engineering/era-residence/js/main.pretty.js:2507-2568` (hero e cupola) e `:620-672` (animateSlide), letti direttamente.
Nomi di attributi e primitive: indicativi. Se la corsia «sistema» li chiama in un altro modo, vale il suo nome.

---

## 0. Cosa chiedo alle primitive della corsia «sistema»

### 0.1 Lessico dei tempi (`app/lib/motion/gsap.ts`)
CustomEase nuove, una per riga, ognuna con un consumatore in questa corsia (condizione di timing P1):

| Nome | Definizione | Origine | Consumatore |
|---|---|---|---|
| `dtEase` | `"0.25,0.1,0.25,1"` | Ease di Era (JS:2863) | hero, salita |
| `dtIn` | `"0.5,0,0.75,0"` | In di Era | hero, zoom |
| `dtInOut` | `"0.75,0,0.25,1"` | InOut di Era | Voci |
| `dtDock` | `"0.33,1,0.68,1"` | cubica in uscita, non di Era (scheda 3) | ricerca |

Riusate: `dtHorScroll` e `dtOut` (gsap.ts:73-78). Media query già presenti: `MQ.motionOk`, `MQ.desktop` (768), `MQ.lg` (1024) (gsap.ts:131-141).

### 0.2 `useCorridor`
Mi serve questa forma (la usa l'hero; persiane e cartolina la useranno uguale):

```ts
const corridor = useCorridor({
  root,               // il wrapper-corridoio: nessuno stile, nessun transform
  screen,             // il figlio sticky
  name: "hero",       // → data-corridor="hero"
  run: "200svh",      // altezza dello spaziatore [data-corridor-run]
  stick: "bottom",    // schermo più alto del viewport: si aggancia col bordo basso
  focusTo: "start",   // focusin nello schermo con progress > 0 → scroll a st.start
  when: `${MQ.lg} and ${MQ.motionOk}`,
});
// → { start: () => string, end: "bottom bottom", stickTop: () => number }
```

Deve:
- mettere `data-on` sul root solo dentro `gsap.matchMedia`, prima di creare i trigger;
- misurare `screen.offsetHeight` a ogni `refreshInit` e scrivere `--corridor-stick` = `min(0, innerHeight − H)` px sul root;
- non scrivere altezze in JS: lo spaziatore esiste in SSR con classe `hidden` e si accende in CSS sotto `[data-on]`;
- rete `focusin`: `getLenis()?.scrollTo(t, { immediate: true })`, altrimenti `window.scrollTo({ top: t, behavior: "instant" })` (schema di StarReviews.tsx:542-550);
- nel cleanup togliere `data-on` e la custom property; mai `pin`; mai stile su root o antenati.

CSS generico (in globals.css, blocco nuovo dopo `.dt-horizon_stairs`, :1795-1799):

```css
[data-corridor][data-on] > [data-corridor-screen] {
  position: sticky;
  top: var(--corridor-stick, 0px);
  isolation: isolate; /* lockup z-10 e firma z-20 restano sotto il foglio di Posizionamento */
}
[data-corridor][data-on] > [data-corridor-run] {
  display: block;               /* batte `.hidden`: regola unlayered-beats-utilities */
  height: var(--corridor-run);
}
[data-corridor="hero"] { --corridor-run: 200svh; }
```

### 0.3 `SplitReveal`
1. `type: "lines,words,chars"` con `autoSplit: true` e `onSplit(self)`. Le parole stanno annidate nelle righe, quindi il raggruppamento per riga si legge da `line.querySelectorAll(wordsClass)` (API verificata su context7: `self.lines`, `self.words`, `self.chars`; con autoSplit le animazioni nascono in `onSplit`). Rifatto al cambio lingua (key + `revertOnUpdate`, come TextLines.tsx:191-196).
2. Modo esterno: nessun ScrollTrigger proprio, una timeline in pausa che il capitolo colloca. Serve a StarReviews (beat 0,94 del film) e al manifesto di HorizonScroller.
3. Nessuno stato nascosto in CSS; sopra la piega nessun passaggio visibile → nascosto → visibile (A20).

### 0.4 Monogramma e cambio di tema
`data-bg="foto"` va sul div di ritaglio della banda (HeroCinematic.tsx:414), mai su `[data-hero-media]`: la regex di intro-clocks.test.ts:424 tollera 200 caratteri fra l'attributo e `h-[var(--dt-band-h)]`.

---

## 1. I sei gesti a confronto

| Cap. | Gesto | Catalogo | Ease | Tempo | Range | Sticky |
|---|---|---|---|---|---|---|
| 1 HeroCinematic | tuffo: testo sale, foto sale e scala 1→2 | §2 | `dtEase` + `dtIn` | scrub `true`, corsa 200svh | wrapper `top <stickTop>px` → `bottom bottom` | sì, da 1024 |
| 2 Posizionamento | foglio a bordo dritto sopra lo sticky + parole che si allontanano | §3 | `none` | scrub 0.8 | h2 `top bottom` → `center top` | no (copre uno sticky) |
| 3 HomeSearchGateway | aggancio del pannello, opacità 0,02→1 e scala 0,75→1 | §6a | `dtDock` | scrub 0.5 | form `top bottom` → `top 55%` | no |
| 4 HorizonStory | nastro orizzontale + gradini in controfase + sipario | §6, §6b, §6c | `dtHorScroll` / `none` / `dtOut` | scrub 0.25; sipario 1,6 s | root `2.5% top` → `97.5% bottom` | sì (esistente) |
| 5 StarReviews | film delle cinque stelle | A12 | `none`, `power4.inOut` | scrub 0.6 → **0.7** | runway `top 55%` → `bottom bottom`, 360svh | sì (esistente) |
| 6 Voci | carosello da destra, tessere a parallelogramma | §C5 slide | `dtInOut` | 1,2 s a tempo, stagger 0,1, ritardo 0,3 | IntersectionObserver all'80 % | no |

**Collisioni fuori dalla corsia (da risolvere prima del codice, A20):**
- **Social (cap. 14)**, «righe in controfase orizzontale (xPercent wrap)»: sono i gradini di HorizonStory (HorizonScroller.tsx:565-577, `wrap([-5,25,-15])` → `wrap([5,-25,25])`, scrub 0.25).
- **Method (cap. 8)**, «tendine `inset(0 100% 0 0)` → `inset(0)`, Out»: è il sipario del territorio (HorizonScroller.tsx:579-601: stessa clip e stessa curva, perché `dtOut` = Out di Era, gsap.ts:73; durata 1,6 s contro 2,4 s). Il §6c di Era è già in pagina.
- **Rotaia del team (cap. 15)**: scrub 0.6 (HorizontalRail.tsx:118, :125), uguale a StarReviews (StarReviews.tsx:420). Proposta nella scheda 5.

---

## Scheda 1 · HeroCinematic: il tuffo

### Stato attuale
- `section#top` `relative bg-cream` (HeroCinematic.tsx:393).
- Banda `[data-hero-media]` `h-[var(--dt-band-h)]` (:407-410) con ritaglio `absolute inset-0 overflow-hidden` (:414).
- Dentro il ritaglio: Image con `preload`, quality 78, `sizes="100vw"`, `objectPosition: "10% 0%"` (:415-429); `<video>` montato solo se abilitato (:430-445), oggi spento (`enabled: false`, media.ts:18; gate a HeroCinematic.tsx:361).
- Lockup z-10 (:457-467); firma Pinyon `translate-y-[26%]` z-20 a cavallo del bordo (:477-484); blocco con sovratitolo, H1, CTA e voto (:493-529).
- Ingresso delle lettere in `useGSAP` (:217-341), stato dipinto a opacity 0,02 (:253). Nessun movimento allo scroll.
- Testata: sticky z-50 sotto lg, `relative` da lg (Header.tsx:202).
- Foto `/media/hero-raffaela.jpg`: **2000×1415** (rapporto 1,413, letto dall'header JPEG). Raffaela a sinistra (x 5-45 %), divano verde al centro, tappeto e pavimento nella metà bassa. A 1440×900 la banda è 1440×540 e la foto resa 1440×1019: a riposo si vede il 53 % alto, 479 px restano sotto il ritaglio (`objectPosition` 0 % in verticale).

### Il gesto (catalogo §2, JS:2507-2551)
Era: corridoio `4·100vh + 50rem + 100vh`, timeline scrub `true` da `top top` a `bottom bottom`:
- 0→0,6: `.hero-s` y → `−(1.25·t − innerHeight)`, Ease;
- 0→0,6: `.hero-w_bg` y → `−(t − innerHeight)`, Ease;
- 0,4→1,0: `.hero-w_bg` scale 1→2, origin `50% 75%`, In.

Domus, da 1024 px con motion ok. La «t» di Era diventa l'altezza resa della foto dentro la banda: `tImg = max(bandH, bandW / ratio)`, con `ratio` letto da `img.naturalWidth / naturalHeight` (ripiego 2000/1415). La foto sale dentro il suo ritaglio fino a mostrarne il fondo, come il render di Era sale dentro il viewport.

Timeline (durata 1,0; `scrub: true`; `defaults: { immediateRender: false }`):

| Posizione | Bersaglio | Da → a | Ease |
|---|---|---|---|
| 0 → 0,6 | `[data-hero-zoom]` | y 0 → `−(tImg − bandH)` | `dtEase` |
| 0 → 0,6 | `[data-hero-lift]` (lockup e firma) | y 0 → `−L` | `dtEase` |
| 0 → 0,6 | `[data-hero-block-lift]` | y 0 → `−L` | `dtEase` |
| 0,4 → 1,0 | `[data-hero-zoom]` | scale 1 → 2, `transformOrigin: "50% 75%"` | `dtIn` |

- `L = max(1.25·tImg − bandH, 1.05·B)`. B è il fondo del contenuto del blocco (bordo basso del link del voto) + 24 px, misurato dal bordo alto del blocco. La base 1,25 è di Era. Il pavimento 1,05·B garantisce che il blocco sia uscito prima di p = 0,48 (`dtEase` vale ≈ 0,96 a 0,8 della sua durata), cioè prima che arrivi il foglio di Posizionamento.
- **Il testo d'inchiostro non passa mai sopra la foto.** `[data-hero-block]` prende `overflow: clip` solo con `data-on`; il suo bordo alto è il bordo basso della banda. Il contenuto sale e sparisce sotto il bordo della foto. Lockup e firma salgono sopra la foto e ne escono dall'alto: sono due dei quattro punti dichiarati (DESIGN.md:583), nessun punto nuovo.
- **Origine 50 % 75 %:** sul box della foto (1440×1019) cade a y 764 px, sul tappeto davanti al divano. Con la foto già salita di 479 px sta a 285 px dalla cima della banda. A scala 2 Raffaela scivola verso il bordo sinistro: scala e traslazione, nessuna distorsione.
- Trigger: `start: () => \`top ${stickTop()}px\``, `end: "bottom bottom"`, `invalidateOnRefresh: true`; `onToggle` scrive `will-change: transform` su `[data-hero-zoom]` solo mentre è attivo (schema di Parallax.tsx:114-117). Valori funzione per `tImg`, `bandH`, `L`.
- Due tween sullo stesso nodo (y e scale), come in Era: GSAP compone i due componenti dal proprio cache.
- Posizionamento risale di −100svh (scheda 2). Il foglio entra dal basso a p = 0,5 e arriva in cima a p = 1.

**Numeri a 1440×900** (blocco ≈ 400 px: da misurare): headH 90; banda 540; H ≈ 940; stickTop −40; aggancio a scrollY 130, sgancio a 1930; tImg 1019; foto −479; L = 734; blocco uscito a p ≈ 0,2; foglio sul bordo della banda a p ≈ 0,72 con scala 1,09; foglio a metà banda a p ≈ 0,87 con scala 1,38; con un quarto di banda in vista la scala è 1,68. La scala 2 cade sotto il foglio.
**A 1024×768:** headH 76,8; banda 461; tImg 725; foto −264; H ≈ 880; stickTop −112; L = 445 (pavimento ≈ 410); blocco uscito a p ≈ 0,37.
**A 1920×1080:** headH 104; banda 648; tImg 1358; foto −710; L = 1050.

### Pixel resi e D04
- A riposo nulla cambia: `sizes`, `preload` e quality restano.
- In movimento a 1440 DPR 1 next/image serve 1536w (`deviceSizes`, next.config:149): 1,07 px di sorgente per px CSS; alla scala visibile 1,38 si scende a 0,77. A DPR 2 il file ha 2000 px: 0,69 a riposo, 0,50 a 1,38.
- È un'eccezione a D04 e a «mai oltre ~1,05×» (DESIGN.md:397) limitata alla corsa: va scritta accanto alla regola dei `sizes` (DESIGN.md:499). Il rimedio vero è lo scatto non compresso (HeroCinematic.tsx:422-424 lo dà per «foto WhatsApp»), da chiedere alla cliente. `sizes` non si alza: costo LCP.
- **Da guardare prima del codice:** nell'angolo in basso a destra del file c'è un segno chiaro a quattro punte (x ≈ 94 %, y ≈ 86 %). A riposo sta fuori dal ritaglio; con la salita di 479 px entra in campo.

### DOM e attributi
```tsx
<section ref={sectionRef} id="top" data-corridor="hero" className="relative bg-cream">
  <div data-corridor-screen>                                  {/* sticky solo con data-on */}
    <div data-hero-media className="relative flex h-[var(--dt-band-h)] w-full flex-col bg-cream-deep">
      {/* nessun attributo nuovo fra data-hero-media e la classe: regex :424 */}
      <div data-bg="foto" className="absolute inset-0 overflow-hidden">
        <div data-hero-zoom className="absolute inset-0">      {/* NUOVO: y + scale */}
          <Image … style={{ objectPosition: "10% 0%" }} />       {/* invariata */}
          {playVideo && <video … />}                              {/* stesso wrapper */}
        </div>
      </div>
      <div data-hero-lift className="dt-row relative z-10 …">{/* lockup */}</div>
      <span data-hero-script data-hero-lift …>{/* firma */}</span>
    </div>
    <div data-hero-block>                                        {/* bordo della maschera */}
      <div data-hero-block-lift className="dt-row flex flex-col items-center pb-[…] pt-[…] text-center">
        {/* contenuto di :494-528 invariato */}
      </div>
    </div>
  </div>
  <div data-corridor-run aria-hidden className="hidden" />
</section>
```
CSS specifico: `[data-corridor="hero"][data-on] [data-hero-block] { overflow: clip; }`.
La firma usa `translate-y-[26%]`, che in Tailwind v4 scrive la proprietà `translate`, non `transform`: la `y` di GSAP si somma. Da verificare nel CSS generato.

### Sotto 1024
**768-1023** (testata sticky, niente corridoio). ScrollTrigger sulla banda con `start: 0` (a scrollY 0 progress 0), `end: () => \`bottom ${headH}px\`` (banda passata sotto la testata), `scrub: true`:
- `[data-hero-zoom]` scale 1 → 1,12, origin `50% 75%`, `dtIn`; y 0 → `−0.5·(tImg − bandH)`, `dtEase`. A 768×1024 verticale tImg = bandH e la y resta 0; a 1023×768 vale −131 px.
- `[data-hero-lift]` y 0 → −12svh, `dtEase`: lockup e firma scivolano sotto la testata, opaca dopo 24 px (DESIGN.md:490).
- Blocco fermo, nessuna maschera, spaziatore spento, Posizionamento senza margine.
- Pixel: a 768 verticale la foto è resa 868×614 CSS; a DPR 2 chiede 1736 px e il loader ne manda 1536 (1,13× sotto già a riposo); a 1,12 si arriva a 1,27×, solo durante la corsa.

**390** (sotto 768): solo `[data-hero-lift]` y 0 → −8svh, stesso trigger. Foto ferma: a 390 DPR 3 la resa è 562 px CSS, cioè 1686 px chiesti contro 1280 serviti (1,32× sotto a riposo). Ogni scala peggiora.

### Reduced-motion e senza JS
Nessun `data-on`, nessuno stile inline, spaziatore `display: none`, Posizionamento in flusso. In più ci sono due div senza stile: la pagina è identica a oggi.

### Focus e tastiera
- `focusin` in `[data-corridor-screen]` con `st.progress > 0` → scroll immediato a `st.start`. A progress 0 H1 e CTA sono in vista e senza transform.
- Copre anche Shift+Tab da `#cerca`: il browser porta in vista il link del voto dentro la corsa, la rete riporta all'inizio.
- Nessun `autoAlpha`: il blocco esce per maschera e i link restano nell'ordine di tabulazione.
- «Cerco casa» → `#cerca`: con `anchors: true` (SmoothScroll.tsx:112) Lenis legge le posizioni col margine negativo già applicato.

### LCP e CLS
- **LCP:** src, `sizes`, `preload` e quality invariati; il primo transform arriva dopo scrollY 130; `will-change` solo con il trigger attivo.
- **Patto della porta:** a scrollY 0 progress vale 0 e con `immediateRender: false` nessun tween scrive stile. Tornando indietro GSAP scrive l'identità (translate 0, scale 1): il test accetta `none` o la matrice identità.
- **CLS:** `data-on` aggiunge 200svh di spaziatore e ne toglie 100 a Posizionamento, cioè +100svh sotto la piega. Lo spostamento si vede solo dove Posizionamento compare a scrollY 0 (headH + H < 100svh): a 2560×1440 è una striscia di ≈ 32 px di padding avorio, CLS ≈ 0,02. Da misurare con `perf:report` a 1440×900, 1920×1080 e 2560×1440.
- **Refresh:** `data-on` e `--corridor-stick` prima dei trigger. L'hero è il primo figlio di `main` (page.tsx:76), quindi i trigger successivi misurano già il layout lungo. Da provare il ritorno con scroll ripristinato a metà home: il browser ripristina prima dell'idratazione.

### Test
**Nuovi**
- `app/lib/__tests__/hero-dive.test.ts` (regex sul sorgente, come intro-clocks):
  - `[data-hero-zoom]` contiene Image e video;
  - nessun `data-` fra `data-hero-media` e `h-[var(--dt-band-h)]`;
  - nessuno `style` sulla banda;
  - sticky, maschera, spaziatore e margine di copertura esistono solo sotto `[data-on]`;
  - nessun `pin:` nel componente.
- `e2e/hero-dive.spec.ts`, motion ok, fixture `goto`:
  - @1440 e @1024: `#top` ha `data-on`; a scrollY 0 `[data-hero-zoom]` e `[data-hero-block-lift]` hanno transform `none` o identità; H1 e CTA in viewport;
  - a metà corsa: scala di `[data-hero-zoom]` > 1,05 e m42 di `[data-hero-block-lift]` < −100;
  - a fine corsa (bordo basso del wrapper − innerHeight): `[data-hero-cover]` top in [−1, 1];
  - tastiera: a metà corsa, focus sulla CTA «Richiedi la valutazione» → entro 500 ms scrollY ≤ start + 2 e CTA in viewport;
  - @768 e @390: nessun `data-on`; spaziatore `display: none`; altezza di `#top` = banda + blocco (± 1 px); a scrollY 0 `[data-hero-lift]` identità; a 390 `[data-hero-zoom]` sempre identità.
- `motion.spec.ts` (reduced): `#top` senza `data-on`, `[data-hero-zoom]` senza `style`, `margin-top` di `[data-hero-cover]` = 0px.
- `home.spec.ts`: a 1440 il numero di corridoi accesi (`[data-on]` con figlio sticky) vale 6, quando ci saranno tutti (critic §25).

**A rischio**
- intro-clocks.test.ts:405-436: :424 (regex dei 200 caratteri), :428-430 (`objectPosition` sul nodo Image), :411 (token).
- mobile-motion.spec.ts:212, :519-524, :1084, :1185-1192: lettere dell'hero, H1 in viewport con reduced. Le lettere non cambiano, i lift stanno sui wrapper.
- home.spec.ts:14, :34, :42-47 (H1 visibile): a scrollY 0 invariato.
- mobile-motion.spec.ts:39-54 e home.spec.ts:219-227 (nessun traboccamento): la foto scala dentro il suo ritaglio.
- scripts/mobile-cdp-probe.ts:331 conta `[data-on]`: +1 solo da 1024, la sonda mobile non cambia.

### Perché è distinto
Unico capitolo con due ease sovrapposte (`dtEase` e `dtIn`), unico con scrub `true` su una corsa di 200svh, unico range che parte da `top <stickTop>px`. Unico che scala una foto oltre 1,15 e fa salire due strati a velocità diverse dentro uno schermo fermo.

---

## Scheda 2 · Posizionamento: il foglio e le parole

### Stato attuale
- `section` `dt-chapter bg-cream` (Posizionamento.tsx:75), griglia a due colonne da lg (:76).
- Foto consulenza.jpg (1920×1625) in `dt-media-half` dentro `<Parallax speed={-0.04}>` (:83-98), `sizes` a :93.
- Testo: Reveal sull'eyebrow (:101-103), TextLines h2 d2 (:104-106), lead (:107-109), elenco (:112-121). Nessun elemento focusabile.
- Segue l'hero in flusso, senza sovrapposizione.

### Il gesto (catalogo §3, JS:2552-2568)
Era: `.benefits-intro-w` con `margin-top: −(50rem + 100vh)` scorre sopra lo sticky dell'hero; `wordSpacing` 0rem → 10rem (10vw), ease `none`, scrub `true`, trigger wrapper `top bottom` → `bottom top`.

**a) Il foglio.** Da 1024 con motion ok la section sale di −100svh (`[data-corridor="hero"][data-on] + [data-hero-cover] { position: relative; z-index: 1; margin-top: -100svh; }`) e usa il suo `bg-cream`. Senza cupola i 50rem non servono: resta il solo 100svh, allineato alla fine della corsa dell'hero. Bordo dritto: nessun raggio, nessuna ombra, nessuna hairline.
Perché non si percepisce un taglio (C20):
- il foglio entra a p = 0,5 sopra la zona del blocco già vuota: avorio su avorio, nessun bordo visibile;
- quando raggiunge la banda il suo bordo coincide con la linea foto/avorio di riposo, poi sale sopra la foto;
- un solo fondo, nessun cambio di tono;
- il foglio è fratello del corridoio, non suo antenato: nessun antenato di sticky trasformato o ritagliato.

**b) Le parole che si allontanano, solo transform.** `wordSpacing` rifarebbe l'impaginato a ogni frame e manderebbe a capo le righe. L'equivalente:
- split in righe e parole con SplitReveal (`onSplit`);
- sulla riga r con n parole, la parola k (da 0) va da x 0 a `k·g_r`, con `g_r = min(10vw, slack_r / (n − 1))`;
- `slack_r` = bordo destro del box dell'h2 − bordo destro dell'ultima parola della riga, misurato a riposo;
- righe di una parola ferme.
A fine corsa ogni riga di più parole tocca il margine destro della colonna: il titolo diventa giustificato. Nessuna parola esce dal box dell'h2, quindi nessun traboccamento a nessuna larghezza.
Tween: un `fromTo` per parola, valori funzione, `invalidateOnRefresh`, ease `none`, **scrub 0.8**, trigger h2, `start: "top bottom"`, `end: "center top"`. Misure rifatte in `onSplit` (autoSplit al resize, remount al cambio lingua).

**c) Via la Parallax della foto** (Posizionamento.tsx:83, :98): ±0,56 % dell'altezza (DESIGN.md:509) non si vede ed è un secondo gesto nel capitolo (A20). `sizes` resta.

### Larghezze
- **1440:** foglio e parole. Colonna di testo da 59vw a 92vw (≈ 475 px), d2 = 57,6 px, tetto 144 px per spazio.
- **1024-1279:** uguale; d2 ≈ 43 px.
- **768-1023:** niente foglio (niente corridoio), parole sì.
- **390:** niente foglio, parole sì; d2 34,4 px su 351 px di colonna.

### Reduced-motion e senza JS
Nessuno split, nessun margine: h2 statico e completo.

### Focus e tastiera
Nessun focusabile nel capitolo. Il foglio copre i link dell'hero solo a corsa finita, e la rete dell'hero li riporta in vista.

### LCP e CLS
Solo transform sulle parole. Il margine negativo entra all'idratazione sotto la piega (conto CLS nella scheda 1).

### Test
**Nuovi** (e2e, motion ok)
- @1440: a fine corsa dell'hero `[data-hero-cover]` top in [−1, 1] e `margin-top` calcolato = −innerHeight px.
- @1440 e @390, in `it` e `de` (la lingua più lunga): con l'h2 al centro del viewport almeno una parola con k ≥ 1 ha m41 > 1; per ogni parola `right ≤ right dell'h2 + 1`, anche a fine corsa.
- @768: `margin-top` 0px.
- Reduced: `margin-top` 0px, nessuno span di parola con transform.

**A rischio:** mobile-motion.spec.ts:39-54, home.spec.ts:219-227 (traboccamento); motion.spec.ts:22-43 (testi fermi con reduced su /vendi: stessa primitiva di split).

### Perché è distinto
Unico capitolo che muove un titolo per parole in x e unico che scorre sopra un corridoio. Ease `none`, scrub 0.8, range h2 `top bottom` → `center top`.

---

## Scheda 3 · HomeSearchGateway: l'aggancio

### Stato attuale
- `section#cerca` `dt-chapter` (HomeSearchGateway.tsx:110); eyebrow in Reveal (:112-114); TextLines h2 (:115-117).
- Form dentro Reveal con delay 120 (:119-206). Le label avvolgono i controlli (:123-133, :156-198). I chip riempiono il campo e gli danno il focus (:139-151). Submit (:200-204) → `transitionTo` (:106).
- Blocco venditore in Reveal (:210-218).
- `.reveal` nasconde in CSS con opacity 0 (globals.css:508-512), con rete `@media (scripting: none)` (:526-532).

### Il gesto (catalogo §6a, JS:2569-2595 e :857-874)
Era: trigger `.loc-info-w` `top 30%` → `bottom bottom`, scrub .5; `.loc-info-s` opacity 0→1 e scale .75→1, ease `none`; `onEnter` reveal di p e ctn con delay .1, `onLeaveBack` hide.

Domus:
- `[data-dock]` sostituisce la Reveal intorno al form (:119 e :206).
- `fromTo` da `{ opacity: 0.02, scale: 0.75, transformOrigin: "50% 0%" }` a `{ opacity: 1, scale: 1 }`, ease `dtDock`, **scrub 0.5**, trigger `[data-dock]`, `start: "top bottom"`, `end: "top 55%"`, `immediateRender: false`.
- **Perché non `top 30%` → `bottom bottom`:** la sezione è alta ≈ 1230 px a 1440; con il range di Era il form al centro del viewport starebbe a scala 0,92 e opacità 0,69, inutilizzabile a riposo. Con `top 55%` il pannello è pieno quando il suo bordo alto supera il 55 % del viewport, cioè quando il form è tutto in vista.
- **Perché `dtDock` e non `none`:** a metà range `none` dà scala 0,875 e opacità 0,51; `dtDock` dà 0,97 e 0,88. Il pannello si aggancia presto e fa il resto della corsa quasi fermo.
- Opacità minima 0,02, mai 0 né `visibility`: i campi restano nel tab order e cliccabili.
- **Il reveal dei testi all'`onEnter` di Era non entra nel pannello:** le label avvolgono input e select, e nasconderle nasconderebbe i controlli. Eyebrow, h2 e blocco venditore restano sulle primitive di testo.
- Uscita speculare: lo scrub torna indietro da solo.

### Larghezze
Stesso gesto a ogni larghezza, senza sticky.
- **1440:** corsa 405 px.
- **1024-1279:** form a 4 colonne (`md:grid-cols-4`); corsa 345 px a 768 di altezza.
- **768-1023:** 4 colonne da md.
- **390:** una colonna, form alto ≈ 700 px, corsa 380 px su 844. Scala .75 con origine in alto al centro: nessun traboccamento.

### Reduced-motion e senza JS
Nessun tween, nessuno stile: form visibile e fermo. Il div nuovo non ha la classe `reveal`, quindi è visibile anche senza la regola `scripting: none`.

### Focus e tastiera
- `focusin` in `[data-dock]` con progress < 1 → `st.disable(false)` + `gsap.set(dock, { opacity: 1, scale: 1 })`. Con `false` non ripristina e mette in pausa lo scrub (firma verificata su context7).
- `focusout` con `relatedTarget` fuori dal pannello → `st.enable(false)` + `ScrollTrigger.update()`: lo scrub riprende dallo scroll corrente.
- Il pannello non sbiadisce mentre si scrive; i chip che danno il focus all'input (:143-146) lo portano pieno.
- Un tap su un campo quasi invisibile in fondo al viewport: il focus arriva col mousedown e il pannello va a 1.

### LCP e CLS
Solo opacity e transform. Con l'ancora `#cerca` già in vista all'idratazione, `immediateRender: false` evita il fotogramma a 0,02: il primo aggiornamento di ScrollTrigger scrive progress 1 (A20, nessun lampo).

### Test
**Nuovi** (e2e motion ok, @1440 e @390)
- Bordo alto di `[data-dock]` al 40 % del viewport: opacity ≥ 0,99 e matrice identità (± 0,01).
- Bordo alto al 95 %: opacity < 0,5; focus sul primo input → opacity 1 entro 100 ms; la digitazione funziona; blur e scroll di 200 px → l'opacità torna a cambiare.
- `goto("/#cerca")`: campionamento con rAF per 600 ms, nessun fotogramma con opacity < 0,99.
- Reduced: nessuno `style` inline su `[data-dock]`.

**A rischio:** home.spec.ts:19 (`#cerca` attached), home.spec.ts:105-124 (navigazione). a11y.spec gira con reduced: invariato. Nella suite non ho trovato test sul submit della home.

### Perché è distinto
Unico capitolo che anima un pannello interattivo (scala e opacità), unico con `dtDock`. Scrub 0.5, range sul form `top bottom` → `top 55%`.

---

## Scheda 4 · HorizonStory: il nastro, ripulito

### Stato attuale
- `section#perche-domus-tua` `dt-chapter` (HorizonStory.tsx:170).
- Testa: eyebrow, TextLines h2 d1 (:177-179), `script-word` (:180-184). Riga col video 9:16 (:195-228).
- `HorizonScroller id="storia"` (:237-318): manifesto h3 per caratteri (:251), gradini (:270-284), blocco del territorio (:286-292, h4 a :287), foto a sipario (:306-315).
- HorizonScroller:
  - `data-on` e altezza = `scrollWidth` (HorizonScroller.tsx:415-423);
  - track `x` con `dtHorScroll`, scrub 0.25, `2.5% top` → `97.5% bottom` (:426-436);
  - reveal `enter` e `track` con opacity + pointerEvents e rete focusin (:442-504);
  - caratteri rotateY 90, yPercent 50, 1,2 s `dtOut`, stagger 0,03, trigger root `top 55%` (:506-563);
  - gradini `xPercent wrap([-5,25,-15])` → `wrap([5,-25,25])`, scrub 0.25 (:565-577);
  - sipario `inset(0% 100% 0% 0%)` → `inset(0)`, 1,6 s `dtOut`, scala interna 1,15 → 1 (:579-601).
- CSS: globals.css:1744-1799.
- **Selettori morti:** `data-horizon-flower` documentato a HorizonScroller.tsx:18, tween mobile a :362-402, tween desktop a :603-629. HorizonStory non ha più nodi con quell'attributo. I commenti :28-30 e :97-99 elencano ancora «fiori»; :175-185 cita HorizonStory.tsx:264-270 e :362-369 cita :250-256, righe che non corrispondono più.

### Il gesto (catalogo §6, §6b, §6c)
Resta com'è: il track è il §6, i gradini il §6b, il sipario il §6c. Valori invariati.

### Cosa cambia
1. Via i selettori morti (HorizonScroller.tsx:18, :362-402, :603-629) e «fiori» dai commenti :28-30 e :97-99; riscritti i rimandi di riga a :175-185 e :362-369. Commit a sé con gli e2e dei nastri verdi (idea-parallax P4).
2. Il manifesto per caratteri (mobile :168-266, desktop :506-563) passa a SplitReveal in modo esterno: stessa tween, un solo split nel sito (A20). Il trigger resta del nastro (root `top 55%` da lg, h3 `top 70%` sotto). `autoAlpha` (:213, :526) diventa opacity, per coerenza con gsap.ts:20-25, anche se l'h3 non contiene link.
3. Titolo d1 (:177) e h4 (:287) sulle primitive di testo.
4. Nessun cambio di valori: il capitolo tiene per sé `dtHorScroll`, scrub 0.25 e `2.5% top` → `97.5% bottom`.

### Larghezze
- **1440 e 1024-1279:** nastro sticky (DESIGN.md:535).
- **768-1023 e 390:** colonna con gli stessi atti (HorizonScroller.tsx:100-408): gradini in px ±16, sipario e caratteri a `top 70%`.

### Reduced-motion, senza JS, focus, LCP/CLS
Invariati. `data-on` solo via JS (motion.spec.ts:74-84). CTA in opacity con rete focusin. Nessuna immagine LCP. La home più lunga sposta `#storia` di +100svh: i trigger lo misurano dopo l'hero.

### Test
**A rischio:** home.spec.ts:126-156, motion.spec.ts:74-84, mobile-motion.spec.ts:39-54.
**Nuovo:** test unitario che vieta `data-horizon-flower` in `app/`, con regex sul sorgente senza commenti (schema `soloCodice` di logo-colore.test.ts:44-46).

### Perché è distinto, e cosa gli copiano
Unico nastro orizzontale della home. Due capitoli di altre corsie ne ripetono i pezzi: Social (14) i gradini, Method (8) il sipario (sezione 1). Proposta: gradini e sipario restano qui; Social e Method scelgono un altro asse o un'altra geometria.

---

## Scheda 5 · StarReviews: il film resta

### Stato attuale
- `section#recensioni` (StarReviews.tsx:643); runway 360svh e schermo sticky (globals.css:1958-1978); `data-on` o `data-sr-mob` solo via JS (StarReviews.tsx:279).
- Timeline scrub 0.6 da runway `top 55%` a `bottom bottom` (:409-436), atti A-E (:437-501), testo col beat a 0,94 (:504).
- Sotto lg: film a tempo, `FILM_MS` 3000, `once` (:91, :424-433, :506-538). Riflesso e respiro (:564-613). `focusin` → fine runway (:539-551).
- TextLines dentro lo schermo sticky (:706-713): il suo trigger `top 86%` scatta a metà film (idea-type T2, timing P4).
- Commenti stantii: «superficie curva di HorizonStory» (:640-642); «il muro consegna lo sfondo pulito» (:35-37, :402-408). Il muro non esiste più (Voci.tsx:3-4) e il capitolo prima è HorizonStory.

### Il gesto
Resta il film (A12), con i valori di oggi tranne lo scrub.

### Cosa cambia
1. **Scrub 0.6 → 0.7** (:420). La rotaia del team usa 0.6 (HorizontalRail.tsx:118, :125) e A20 vieta la stessa durata di inseguimento. Se la corsia del Team sposta la rotaia, StarReviews resta a 0.6. Si percepisce solo 0,1 s di inseguimento in più; nessun atto cambia.
2. Il titolo (:707) passa a SplitReveal esterno: da lg entra nella timeline a 0,94, dove oggi si accende il wrapper `[data-sr-el]`; sotto lg alla fine del film a tempo. Nessun trigger proprio dentro lo sticky.
3. Commenti :35-37, :402-408, :640-642 riscritti.
4. `data-bg="nastro"` sulla runway (:651) per il monogramma (corsia feedback).

### Larghezze, reduced-motion, senza JS, focus, LCP/CLS
Invariati (DESIGN.md:538-540; motion.spec.ts:86-98). Nessuna foto LCP.

### Test
**A rischio:** home.spec.ts:158-177 (`data-on`, `data-lit`), motion.spec.ts:86-98.
**Nuovo:** e2e @1440 motion ok: a fine runway tutte le lettere dell'h2 a opacity 1 e transform identità (oggi nessun test lo guarda).

### Perché è distinto
Unico capitolo con morph di clip-path a stella, lampo e runway 360svh: `top 55%` → `bottom bottom`, scrub 0.7.

---

## Scheda 6 · Voci: il carosello arriva da destra

### Stato attuale
- `section#voci` (Voci.tsx:151); testa (:152-176).
- Carosello nativo: wrapper `relative` (:182); `ul` con `overflow-x-auto`, snap e padding 8vw (:183-187); `li` larghi 100 %, 46vw o 32vw (:194-196).
- Link con l'href di YouTube che apre in pagina (:200-211); scatola `dt-media-full` (:220); YoutubeThumb con `dt-still-trim` e `sizes` (:221-226); play rosso in assoluto (:229-231); didascalia (:235).
- Frecce `scrollBy` (:144-148, :240-247); sigillo (:250-273); Trustindex (:277-308).
- `.dt-still-trim` = `scale(1.43)` con origine 100 % 100 % sull'img (globals.css:391-394); tetto 1,43 (DESIGN.md:516, :593).
- Nessun movimento di sezione: solo Reveal e TextLines sulla testa.

### Il gesto (catalogo §C5 slide, JS:620-672)
Era:
- reveal: clip `polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)` → `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`, durL 1,2 s, InOut, delay .3; figlio scale 1.5 → 1 e xPercent 25 → 0;
- hide: `polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)` → `polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)`, figlio scale 1.5 e xPercent −25, durL, InOut.

Domus, **entrata** (ogni volta che la rotaia entra dal basso):
- solo alla prima entrata per montaggio: `ul` xPercent 25 → 0, 1,2 s, `dtInOut`, delay 0,3;
- tessere visibili (rettangolo dentro il `clientWidth` della rotaia): `[data-voci-slide]` con la clip di Era, 1,2 s, `dtInOut`, delay `0.3 + i·0.1`; `[data-voci-slide-inner]` xPercent 25 → 0 negli stessi tempi;
- tessere fuori dal `clientWidth`: nessuna animazione, restano aperte;
- a fine tween `clearProps: "clipPath,transform"`.

**Uscita** (la rotaia torna sotto la soglia risalendo): clip `polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)` → `polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)`, inner xPercent 0 → −25, 1,2 s, `dtInOut`, senza stagger. La `ul` non si muove.

**La scala 1,5 di Era non entra.** A 1440 la tessera è 32vw = 461 px; l'img resa a 1,43 è 659 px (`sizes` 46vw = 662, Voci.tsx:224); la copertina maxres è 1280 px. A DPR 1 restano 1,94× di margine; a DPR 2 la resa chiede 1318 px su 1280 (già al limite). Con 1,5 × 1,43 = 2,15 si chiederebbero 1978 px su 1280. La contro-scala si somma a 1,43 e il margine è zero: resta la sola traslazione.

**La traslazione non scopre bordi né la grafica rifilata.** A progresso e, il lato sinistro visibile del parallelogramma sta a `100(1−e) %` in alto e `125(1−e) %` in basso; l'immagine è spostata di `25(1−e) %`. Il punto più a sinistra che si vede corrisponde alla posizione `100(1−e) % ≥ 0` del fotogramma a riposo: il cuneo del badge (DESIGN.md:516) non rientra mai.

**Altri punti**
- Il play resta fuori dall'inner: si apre con la clip ma non si sposta.
- **Innesco con IntersectionObserver, non ScrollTrigger:** Voci sta subito dopo i 360svh delle stelle, dove ScrollTrigger è inaffidabile (trappola di progetto). Osservatore sulla `ul` con `rootMargin: "0px 0px -20% 0px"`, `threshold: 0`. Entrata: `isIntersecting`. Uscita: `!isIntersecting` e `boundingClientRect.top ≥ rootBounds.bottom`. Uscendo dall'alto non succede nulla (stessa semantica di TextLines.tsx:115: replay solo dal basso).
- Stato chiuso scritto solo via JS e solo se al montaggio la rotaia è sotto la piega (`rect.top > innerHeight`); altrimenti resta aperta.
- Rete: `focusin` sulla `ul` → `progress(1)`; timeout di 2500 ms solo se `rect.top < 0.8·innerHeight` e la timeline è ferma a 0.

### Card cliccabili nei replay
La regola «nei replay solo opacity» (ListingsGrid.tsx:30-33) esiste perché un bersaglio che si sposta sotto il puntatore fa mancare il clic. Qui:
- il link (:200) non riceve mai transform né clip;
- la `ul` trasla solo alla prima entrata, quando la rotaia sta sul bordo basso del viewport;
- nei replay si muovono solo clip e inner dentro il link, e il box del link resta cliccabile (un clic sulla parte ritagliata cade sul link).
Va scritto nel commento del componente come eccezione motivata.

### DOM
```tsx
<div className="relative mt-[clamp(3rem,8vh,6rem)] overflow-x-clip">  {/* :182, rete contro i 25vw */}
  <ul ref={railRef} data-voci-track …>
    <li …>
      <a …>
        <span data-voci-slide className="dt-media-full block">
          <span data-voci-slide-inner className="absolute inset-0 block">
            <YoutubeThumb … className="dt-still-trim object-cover" />
          </span>
          <span className="…play…" />
        </span>
        …didascalia…
```
`overflow-x: clip` non crea un contenitore di scorrimento, lascia `overflow-y` visibile e qui non c'è nessuno sticky.

### Larghezze
- **1440 e 1024-1279:** tre tessere per schermata, stagger su tre.
- **768-1023:** due tessere (46vw).
- **390:** una tessera a tutta larghezza; la `ul` trasla di 97,5 px; la clip parte dall'unica tessera in vista.

### Reduced-motion e senza JS
Nessun observer, nessuno stile: carosello nativo come oggi.

### Focus e tastiera
Tab su una tessera con la rotaia chiusa: il browser la porta in vista, l'observer apre, la rete `focusin` porta subito a progress 1. L'outline del link (:210) resta intatto: la clip sta sul figlio.

### LCP e CLS
Nessuna foto LCP; solo clip-path e transform. `overflow-x-clip` in SSR non cambia l'impaginato: la `ul` scorre già in orizzontale per conto suo.

### Test
**Nuovi** (e2e motion ok, @1440 e @390)
- `#voci` in vista, attesa 1,8 s: `[data-voci-slide]` senza clip-path inline, `[data-voci-slide-inner]` e `ul` senza transform.
- Campionamento durante l'entrata: `documentElement.scrollWidth − clientWidth ≤ 0`.
- Reduced: nessuno `style` su `[data-voci-slide]`.
- Unitario: `dt-still-trim` resta sull'img e non su `[data-voci-slide-inner]`; nessuno `scale` nel codice del gesto.

**A rischio:** home.spec.ts:235 e seguenti (didascalie con box ≥ 60×10 px: la clip non tocca la didascalia); home.spec.ts:219-227 e mobile-motion.spec.ts:39-54 (traboccamento durante la traslazione: lo regge il wrapper); VideoLightbox aperta durante l'entrata (invariata).

### Perché è distinto
Unico gesto a tempo della corsia (non scrub), unico parallelogramma, unico con `dtInOut`: 1,2 s, stagger 0,1, innesco a IntersectionObserver all'80 %.

---

## 7. Altezza aggiunta alla home a 1440

- **Corridoio del tuffo:** spaziatore 200svh meno la copertura di Posizionamento (100svh) = **+100svh**, cioè 900 px a 1440×900 e 810 px a 1440×810. Il tratto agganciato è lungo 200svh (1800 px a 1440×900).
- Posizionamento, ricerca e Voci: +0.
- HorizonStory e StarReviews: invariati (altezza = `scrollWidth` del track; runway 360svh).
- Confronto: in Era la corsa dell'hero è `4·100vh + 50vw` (4,9 schermi a 1920×1080) più la cupola. Qui è di 2 schermi, per restare nei «3-4 schermi» dei tre corridoi nuovi (domus-coreografia-era.md:14). Le proporzioni interne restano quelle di Era: il foglio entra a p = 0,5 (in Era la cupola a p ≈ 0,57) e il testo sale a ≈ 0,4 px per px scorso (in Era 0,34).

## 8. Documenti da allineare per questa corsia
- page.tsx:67-72: il contratto dice «tre nastri … nessun'altra sezione pinnata» → sei corridoi, A19.
- DESIGN.md: :573 e :587 (tre nastri); :499 (eccezione di corsa per la scala dell'hero); :509 (Posizionamento senza Parallax); :519 (Voci col parallelogramma); :538 (scrub 0.7).
- Spec §11: A18-A20 con le parole di Alberto; C03 «superata da A18-A20, da mostrare alla cliente».
- docs/da-chiedere-alla-cliente.md: sorgente non compressa di hero-raffaela.jpg; il segno in basso a destra del file.

## 9. Punti aperti
1. **Scala 2 contro D04 e DESIGN.md:397.** Valori visibili misurati sopra (1,09 → 1,38 → 1,68). Serve che Alberto confermi l'eccezione di corsa; il valore del catalogo resta 2.
2. **Il segno a quattro punte** nell'angolo basso destro della foto dell'hero, che la salita porta in campo.
3. **Collisioni** con Social (14), Method (8) e rotaia del team (15), sezione 1.
4. **CLS ≈ 0,02** sui viewport dove l'hero è più basso dello schermo (2560×1440), da misurare.
5. **Scroll ripristinato** a metà home dopo l'accensione di `data-on`, da provare.
