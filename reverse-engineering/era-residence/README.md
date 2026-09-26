# Reverse engineering — era-residence.com

Analisi completa del sito https://www.era-residence.com/ (hero, preloader, logo rotante, font, sistema di animazione). Tutti i file sorgente recuperati sono in questa cartella.

> **Nota legale**: qui replichiamo la *tecnica* di animazione (codice, timing, struttura), che non è protetta da copyright. Le **immagini**, i **testi** e il **file Lottie del logo** sono asset proprietari di ERA/TFTL: sono inclusi solo come riferimento di studio e NON vanno pubblicati sul sito Domus Tua. I font richiedono licenza (vedi §2).

---

## 0. Stack tecnico del sito

| Libreria | Versione | Uso |
|---|---|---|
| Webflow | — | CMS/markup/CSS di base |
| jQuery | 3.5.1 | richiesto da Webflow (non usato dalle animazioni custom) |
| **GSAP** | **3.15** | tutte le animazioni |
| GSAP ScrollTrigger | 3.15 | animazioni legate allo scroll |
| GSAP SplitText | 3.15 | reveal dei testi (chars/words/lines) |
| GSAP CustomEase | 3.15 | curve di easing custom (`diveIn`, `loaderEase`, …) |
| **Lenis** | 1.3.21 | smooth scroll (integrato nel ticker GSAP) |
| Barba.js | @barba/core | transizioni tra pagine (SPA-like) |
| Lottie-web | 5.12.2 | logo animato TFTL nel footer (crediti) |
| Adobe Typekit | kit `pig8glj` | font display + accent |
| Slater.app | progetto 20164 | hosting del JS custom (file `js/main.pretty.js`) |

Il codice custom NON è nel HTML: viene caricato da Slater (`assets.slater.app/slater/20164/60900.js`). L'ho scaricato e de-minificato → **`js/main.pretty.js`** (2.866 righe, leggibile). L'originale minificato è `js/main.original.min.js`.

**Il nostro progetto ha già lo stesso stack**: `gsap@3.15`, `@gsap/react`, `lenis@1.3.25` sono in package.json. Da GSAP 3.13 SplitText e CustomEase sono inclusi gratis nel pacchetto npm `gsap` (import da `gsap/SplitText`, `gsap/CustomEase`). Barba.js non serve: in Next.js le transizioni si fanno con il router.

---

## 1. Sistema di scala: tutto è in `vw`

```css
html { font-size: 1vw; }              /* 1rem = 1vw ovunque */
--_special-units---scale-ratio: 16;   /* desktop */
--_special-units---scale-ratio: 4.16; /* mobile */
```

Ogni dimensione è `calc(Xrem / scale-ratio)` → il sito scala perfettamente con la larghezza viewport. Es.: h1 desktop = `192rem/16` = 12vw. Breakpoint JS: `breakPoint = 992`.

`--_100svh` viene fissato via JS a `window.innerHeight` in px (evita il salto della barra URL mobile).

---

## 2. Font (3 famiglie)

| Ruolo | Font | Dove | File |
|---|---|---|---|
| **Display** (titoli, "Era Residence") | **Ambroise François Std** (didone di Typofonderie) | Adobe Fonts, kit Typekit `pig8glj` | `js/typekit-kit-pig8glj.js` |
| **Accent** (corsivo "Estepona", classi `.a1/.a2`) | **Sloop Script Three** | Adobe Fonts, stesso kit | idem |
| **Body** (paragrafi, label `.l1/.l2/.c1`) | **Maison Neue Extended** Book 400 / Bold 700 (Milieu Grotesque) | self-hosted woff2 su CDN Webflow | `fonts/MaisonNeueExt-Book.woff2`, `fonts/MaisonNeueExt-Bold.woff2` |

```css
--_fonts---font-display: ambroise-francois-std, sans-serif;
--_fonts---font-accent:  sloop-script-three, sans-serif;
--_fonts---font-body:    "Maison Neue Extended", Arial, sans-serif;
```

**Licenze — importante per il cliente:**
- *Ambroise François Std* e *Sloop Script Three* si attivano con un abbonamento **Adobe Fonts** (inclusi in Creative Cloud) creando un proprio kit su fonts.adobe.com. Non si possono copiare i woff2 di ERA.
- *Maison Neue* è un font commerciale di **Milieu Grotesque** (milieugrotesque.com): serve una licenza web propria. I woff2 in `fonts/` sono solo riferimento di studio.
- Alternative gratuite se il cliente non vuole licenze: didone → *Playfair Display* / *Fraunces*; script → *Pinyon Script* / *Monsieur La Doulaise*; grotesque estesa → *Archivo Expanded* / *Space Grotesk*.

Tipografia chiave (desktop, `scale-ratio: 16`):
- `h1`: 192rem/16 = 12vw, line-height 87.5%, letter-spacing −0.024em
- `h3` (logo preloader): 96rem/16 = 6vw
- `a2` (script accent): 120rem/16 = 7.5vw, peso 400
- `c1` (caps piccole "Costa / del Sol"): 19–25rem/ratio, letter-spacing 0.8em
- Le classi `.a1/.a2` hanno correzione ottica: `margin-top:.175em; margin-bottom:-.175em`

---

## 3. Design token

```css
:root {
  --dur-s: 0.4s;  --dur-m: 0.8s;  --dur-l: 1.2s;
  --ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-out:    cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in:     cubic-bezier(0.5, 0, 0.75, 0);
  --ease:        cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-write:  cubic-bezier(0.333, 0, 0.667, 1);
}
```

Lato JS (fondo di `main.pretty.js`, righe 2853-2866):

```js
durS=.4, durM=.8, durL=1.2, stagger=.1, delayReveal=.3, breakPoint=992
CustomEase.create("InOut","0.75,0,0.25,1")
CustomEase.create("Out","0.25,1,0.5,1")
CustomEase.create("In","0.5,0,0.75,0")
CustomEase.create("Ease","0.25,0.1,0.25,1")
CustomEase.create("Write","0.333,0,0.667,1")
CustomEase.create("diveIn","0.6,0,0,1")        // ← usato per "tuffarsi" nell'arco
CustomEase.create("horScroll","0.25,0,0.75,1")
```

Colori:

```css
/* nomi reali nel CSS: --_global-colors---base-0--100 ecc., con varianti alpha --0/--5/--10/--30/--60 */
--_global-colors---base-0--100:   #f3f3ec; /* crema (bg chiaro / testo su scuro) */
--_global-colors---base-1000--100:#17233b; /* navy profondo (testo / bg scuro)   */
--_global-colors---brand-500--powder-sky: #b5cedb; /* azzurro — bg tema theme_on-brand */
--_global-colors---brand-500--velvet-plum:#340c24; /* prugna — bg temi theme_on-dark/theme_on-color (fondo del preloader) */
--_global-colors---brand-500--blush-bloom:#f8bbcb; /* rosa */
```

`--_colors---other--bg` cambia con il tema (`theme_on-dark`, `theme_on-brand`, ecc.) → è il colore di fondo del preloader. NB: "day"/"night" NON sono temi ma solo gli id dei tab hero (crossfade immagini, §6.4); i temi veri sono le classi `theme_on-*`.

**Bootstrap globale (righe 2853-2866)** — dettagli che il porting deve replicare: `history.scrollRestoration = "manual"` + `scrollToTop` ritardato di 100ms dentro il preloader (la timeline presuppone pagina in cima); listener resize con debounce 40ms che fa solo `ScrollTrigger.refresh(true)`; `--_100svh` fissato a `window.innerHeight` **solo al load** (mai aggiornato al resize, per evitare salti con la barra URL mobile).

Smooth scroll (riga 225-234):

```js
lenis = new Lenis({ wrapper: window, duration: 1.2, smoothWheel: true,
  touchMultiplier: 2, easing: e => Math.min(1, 1.001 - Math.pow(2, -10*e)) })
lenis.on("scroll", ScrollTrigger.update)
gsap.ticker.add(t => lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0)
```

---

## 4. PRELOADER — il pezzo forte

Sorgenti: JS `js/main.pretty.js` righe 1-148 · markup `html/preloader.html` · CSS `css/inline/05-masks-arch.css` + regole `.preloader*` in `css/webflow.full.min.css` · SVG `assets/preloader_arch-l.svg`, `assets/preloader_bg.svg`.

### 4.1 Architettura

- `[data-master-preloader]` — pannello fisso `z-index:999999` colore bg, montato subito (previene flash); viene rimosso appena parte la timeline.
- `[data-preloader]` — overlay fisso `z-index:11000`, alto `100vh + 100svh` (si estende oltre il fondo). Contiene:
  - `.preloader_ctn` — contenuto: logo simbolo (in alto), "Costa | Era Residence / *Estepona* | del Sol" (centro), progress bar + payoff (basso)
  - `.preloader_bg_arch` — due semi-archi decorativi (`is-1`, `is-2`) con `border-top-radius: var(--arch-w)` e outline 1px, posizionati su `--arch-y` (le "echo lines" attorno all'arco)
  - `.preloader_bg` — fondo pieno + `preloader_bg.svg` in opacità 0.05 + cornice decorativa a linee
- Primo load vs visite successive: `sessionStorage.hasVisited` → `animatePreloaederIntro()` (completa, ~10s) oppure `animatePreloaederShort()` (senza testi, ~3,7s).

### 4.2 La maschera ad arco (il segreto dell'effetto)

L'intero `[data-preloader]` ha una **mask CSS composta da 4 layer** (additiva). L'area NON coperta dai layer = buco trasparente attraverso cui si vede l'hero sottostante:

```css
[data-preloader] {
  --arch-w: 36vw;                                /* larghezza arco */
  --arch-h: calc(var(--arch-w) / (560 / 2592));  /* proporzione SVG 560×2592 */
  --arch-y: 100vh;                               /* posizione verticale arco */

  mask-image:
    linear-gradient(white, white),               /* 1. colonna sinistra  */
    linear-gradient(white, white),               /* 2. colonna centrale (sopra l'arco) */
    linear-gradient(white, white),               /* 3. colonna destra    */
    url('assets/preloader_arch-l.svg');          /* 4. cornice dell'arco */
  mask-size:
    calc(50% - (var(--arch-w)/2) + 2px) 100%,
    calc(var(--arch-w) + 4px) calc(var(--arch-y) + 2px),
    calc(50% - (var(--arch-w)/2) + 2px) 100%,
    var(--arch-w) var(--arch-h);
  mask-position: left top, center top, right top, center var(--arch-y);
  mask-repeat: no-repeat;
  mask-composite: add;
}
```

`preloader_arch-l.svg` è una **cornice ad arco** (rettangolo 560×2592 con l'interno dell'arco ritagliato, bordo 16 unità) ed è l'**unico** SVG arco del sito: nessuna variante `-r` o mobile (mobile usa lo stesso file con `--arch-w: 40vw`; la sezione Architecture usa `border-top-radius` CSS, non SVG). Risultato: sotto `--arch-y`, dentro la sagoma dell'arco, il preloader è bucato → **una "porta" ad arco che sale dal fondo e attraverso cui si vede l'hero**. Animando `--arch-y` verso l'alto e `--arch-w` in larghezza si ottiene l'effetto "dive-in" (la porta ti inghiotte).

### 4.3 Timeline intro (prima visita) — valori esatti

```js
// setup
archW = desktop ? "24vw" : "40vw"     // larghezza iniziale arco
archWMid = desktop ? "36vw" : "50vw"  // larghezza a metà
heroScale = desktop ? 0.75 : 1.15     // scala iniziale immagine hero
CustomEase.create("loaderEase", "M0,0,C0,0,0.13,0.34,0.238,0.442,...")
// easing "a scatti" della progress bar (curva SVG completa nel sorgente riga 24)

lockScroll(); gsap.set(heroImg, { scale: heroScale, transformOrigin: "center top" })

gsap.timeline()
  .set(preloader, { "--arch-w": archW, "--arch-y": "104vh" })   // arco fuori schermo
  .add(() => { /* reveal testi: vedi §7 */
    animateTextA(a,"reveal"); animateTextH(h,"reveal");
    animateTextP(p,"reveal"); animateCtn(ctn,"reveal",0.4); animateLine(line,"reveal") })
  .to({}, { duration: 1.2 })                                    // pausa lettura
  .fromTo(bgSvg,   { opacity:0 }, { opacity:.05, duration:1.2, ease:"Out" })
  .fromTo(bgDecor, { opacity:0 }, { opacity:1,   duration:1.2, ease:"Out" }, "<")
  .fromTo(progressTrack, { yPercent:-100 }, { yPercent:0, duration:4, ease:"loaderEase" })
  .fromTo(preloader, { "--arch-w": archW,   "--arch-y":"104vh" },
                     { "--arch-w": archWMid,"--arch-y":"15vh",
                       duration: 1.5, ease: "InOut" })          // l'arco sale
  .to(preloader,     { "--arch-w":"125", "--arch-y":"-100vh",
                       duration: 2.4, ease: "diveIn" }, "<90%") // dive-in!
  .add(() => gsap.fromTo(heroImg, { scale:heroScale },
        { scale:1, duration:1.5, ease:"InOut" }), "<")          // hero scala a 1
  .add(() => initPageTransitions(), "<25%")
  .add(() => { unlockScroll(); gsap.set(preloader, { display:"none" }) })
```

Punti chiave del feel:
- la progress bar dura **4s** con l'ease custom `loaderEase` (avanza a scatti irregolari, sembra un vero caricamento);
- il dive-in parte al **90%** della salita (`"<90%"`) → le due fasi si fondono in un unico gesto;
- l'immagine hero parte a **scale 0.75, origin center top** e arriva a 1 *mentre* l'arco si apre → effetto "zoom attraverso la porta";
- gli pseudo-archi `is-1`/`is-2` (leggermente più larghi: ×1.02 e ×1.1) seguono `--arch-y` via CSS e fanno da scia.

La variante `animatePreloaederShort()` (righe 88-148) è identica ma nasconde `.preloader_ctn` e salta testi + progress (parte subito dalla salita dell'arco).

### 4.4 Progress bar

```css
.preloader_progress_fill  { width:1px; height:u-96; background:line; overflow:clip }
.preloader_progress_track { width:100%; height:100%; background:primary }
```

Linea verticale 1px: il track parte a `yPercent:-100` e scende a 0 → si "riempie" dall'alto.

---

## 5. LOGO ROTANTE (header, in alto a sinistra)

Sorgenti: JS `js/main.pretty.js` righe 1362-1406 (`initLogo`) · markup `html/header-logo.html`.

Struttura: `.header-logo` (fisso top-left, dimensione 1 cella griglia, `z-index:1200`) con dentro:
- `.header-logo_bg` — **rosone ornamentale SVG** (due varianti: `b-desk` e `b-mob`) — è QUESTO che ruota
- il simbolo centrale resta fermo sopra (`z-index` maggiore)

Logica (de-minificata):

```js
function initLogo() {
  const logo = document.querySelector(".header-logo");
  const bg = [...logo.querySelectorAll(".header-logo_bg")]
    .find(el => getComputedStyle(el).display !== "none"); // desk o mob
  const state = { speed: 30 };          // gradi/secondo a riposo
  let dir = 1, rotation = 0, interacted = false, idleTimer;

  // la modulazione da scroll si attiva solo dopo la prima interazione
  // (la rotazione base a 30°/s parte subito)
  window.addEventListener("wheel",     () => interacted = true, { once:true });
  window.addEventListener("touchmove", () => interacted = true, { once:true });

  // rotazione continua, frame-rate independent
  gsap.ticker.add((time, deltaMS) => {
    const dt = Math.min(deltaMS, 100);
    rotation += state.speed * (dt / 1000);
    gsap.set(bg, { rotation, transformOrigin: "center center" });
  });

  // lo scroll accelera la rotazione (e ne inverte il verso)
  lenis.on("scroll", ({ velocity }) => {
    if (!interacted) return;
    if (velocity !== 0) dir = velocity > 0 ? 1 : -1;
    gsap.to(state, { speed: dir * (30 + 10 * Math.abs(velocity)),
                     duration: 0.3, ease: "Out", overwrite: true });
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() =>
      gsap.to(state, { speed: 30 * dir, duration: 1.2, ease: "Out" }), 100);
  });
}
```

Comportamento: ruota **sempre** a 30°/s; scrollando accelera proporzionalmente alla velocità di Lenis (`30 + 10·|v|`), scrollando all'indietro inverte il senso; 100ms dopo la fine dello scroll torna dolcemente a 30°/s. Per Domus Tua basta sostituire l'SVG del rosone con una versione "ornamentale" del nostro logo (elemento che ruota) + il monogramma fisso al centro.

**Colore del logo per sezione**: `.header-logo` ha `data-theme`; `initThemeChange` (righe 280-309) crea uno ScrollTrigger per ogni sezione `[data-bg="light|dark|color"]` e scambia le classi tema sugli elementi `[data-theme]` (logo, nav, scrollbar) quando la sezione entra in viewport → il logo cambia colore passando su sfondi chiari/scuri. Il logo è anche un link `#hero` con `data-modal-close="menu"`.

---

## 6. HERO

Sorgenti: markup `html/hero.html` · JS: `initTranistionFlow` righe 2507-2551 (scroll), `initTabsHero` righe 2015-2059 (day/night), `initScrollRevealFirst` righe 807-819.

### 6.1 Struttura

Altezze in `var(--_special-units---100vh)`: = `100vh` puro su desktop, = `--_100svh` (fissato via JS) sotto i 992px.

```
.hero-scroll-area            ← alto (4 × 100vh) + 50rem + 100vh su desktop;
                               su mobile (≤767px) scende a (2 × 100vh) + 50rem + 100vh
└─ .hero-w  (sticky top, h:100svh)  [data-tabs-hero]
   ├─ .hero-s (contenuto, pointer-events:none)
   │  ├─ h1 "Era Residence"  [data-scroll-reveal="h"]  (font display)
   │  ├─ h2 "Estepona"       [data-scroll-reveal="a"]  (font script, sovrapposto)
   │  ├─ h3 "A place [tabs day/night] to return to"
   │  └─ bottone circolare + descrizione
   └─ .hero-w_bg (assoluto, full-bleed)
      └─ .hero-w_bg_master_img
         ├─ [data-tab-content="day"]  → hero_day.webp   (render giorno)
         ├─ [data-tab-content="night"]→ hero_night.webp (render notte)
         ├─ pins CMS (hotspot con pulse)
         └─ gradient overlay top/bottom
```

L'immagine è un render 1920px (copie in `assets/hero_day_1600.webp`, `assets/hero_night_1600.webp`).

### 6.2 Reveal iniziale (dopo il preloader)

I testi hero hanno `data-scroll-reveal` + `data-prevent-flicker` (CSS: `visibility:hidden` finché il JS non li splitta). Il reveal usa il sistema di §7 innescato da ScrollTrigger `once:true`; l'immagine arriva a scale 1 dalla timeline del preloader (§4.3).

### 6.3 Choreografia allo scroll (righe 2515-2547)

```js
const t = bg.offsetHeight;
gsap.timeline({ scrollTrigger: { trigger: ".hero-scroll-area",
                                 start: "top top", end: "bottom bottom", scrub: true }})
  // desktop only:
  .fromTo(heroContent, { y:0 }, { y:-(1.25*t - innerHeight), ease:"Ease", duration:.6 })
  .fromTo(bg,          { y:0 }, { y:-(t     - innerHeight), ease:"Ease", duration:.6 }, "<")
  // tutte le viewport (su mobile position ">" perché le tween sopra sono saltate):
  .fromTo(bg, { scale:1, translateZ:10, transformOrigin:"50% 75%" },
              { scale:2, translateZ:10, ease:"In", duration:.6 },
              isMobile ? ">" : "-=0.2")
```

Il testo sale più veloce dell'immagine (parallasse 1.25×), poi l'immagine **zooma a scale 2** (origin 50% 75%) → si "entra" nel render e si passa alla sezione successiva. Due dettagli critici per il porting: la timeline è costruita **solo a immagine caricata** (`img.complete ? build() : img.addEventListener("load", build, {once:true})`, righe 2548-2550) perché i valori `y` dipendono da `bg.offsetHeight`; `translateZ:10` forza il layer GPU.

### 6.4 Tab day/night (righe 2015-2059)

Crossfade: il nuovo layer va `position:relative, z-index:1`, il vecchio `absolute z-index:0`, fade-in `opacity 0→1, durM, InOut`, poi il vecchio viene nascosto. Il divider `.hero-s_tabs_divider` è un gradiente `background-position` animato in CSS (classi `is-day`/`is-night`).

---

## 7. Sistema di reveal dei testi (usato ovunque)

Sorgenti: righe 401-690. Sei animatori richiamabili con `reveal | hide | initial`:

| data-part / data-scroll-reveal | Split | Effetto reveal |
|---|---|---|
| `a` (script/accent) | chars | opacity 0→1, **rotateX 90→0**, x 10rem→0, ease Out, durL, stagger 0.1 |
| `h` (titoli) | words+chars | opacity 0→1, yPercent 50→0, **rotateY 90→0**, stagger 0.05 |
| `p` (paragrafi) | lines+words (mask sulle lines) | yPercent 110→0 dalla maschera, stagger 0.1; i `<br>` singoli vengono raddoppiati via JS per preservare le righe vuote |
| `ctn` (blocchi) | — | opacity 0→1 + y 3.333rem→0 (desktop) |
| `line` (linee/divider) | — | `clip-path: inset(0 0 100% 0)` → `inset(0 0 0 0)` |
| `slide` (immagini) | — | clip-path a parallelogramma + inner scale 1.5→1, xPercent 25→0 |

Costanti: `delayReveal=0.3`, `stagger=0.1`, durata `durL=1.2`. Lo `hide` è più rapido (durS) per `a/h/p/ctn/line`; `slide` invece nasconde a piena durata (durL). Direzione opposta per `a/h/p/line`; `ctn` in hide sfuma sul posto (`y→0`). Le classi `.split-char/.split-word/.split-line` hanno `display:inline-block; will-change:transform` (`css/inline/06-initials-split.css`); `.a1/.a2` hanno padding negativo-compensato per non tagliare le grazie dello script.

Trigger a scroll (righe 908+): ScrollTrigger `start:"top bottom", once:true` per elemento (negli scroller orizzontali `[data-scroll-horizontal]` usa `containerAnimation` con `start:"left bottom"`); `initScrollRevealFirst` deduplica gli elementi `[data-reveal-first]` fratelli.

---

## 8. Transizioni di pagina (Barba.js, righe 150-219)

- leave: `animateVisibleElements(container,"hide")` (nasconde ciò che è in viewport con i 6 animatori) → fade-out `opacity 0, durM, In`
- enter: kill di tutti gli ScrollTrigger + Lenis locali, re-init script, fade-in `opacity 1, durM, InOut`
- In Next.js: equivalente con un template/PageTransition sul route change (abbiamo già `app/components/motion/PageTransition.tsx`).

---

## 9. Altri dettagli riusabili

- **Bottone circolare hero**: 2 archi SVG ruotati (−150°/30°) + cerchio traccia; effetto magnetico via `data-magnetic-btn` (`initMagneticEffect`, righe 1029+).
- **Scrollbar custom** (righe 1408-1441): thumb trascinabile che pilota `lenis.scrollTo`, progress via `--progress`.
- **Pin pulsanti** sull'immagine hero: `.pin_bg_pulse` ×2 + hover che espande il dot (`[hover-pin]`, CSS in `04-components-hover.css`).
- **Blocco anti-flicker**: `[data-prevent-flicker]{visibility:hidden}` + master preloader coprente → nessun FOUC.
- **Snap sections** (righe 311-332): sezioni `[data-snap]`, solo desktop; dopo 40ms di scroll idle la sezione che copre >50% del viewport viene agganciata con `lenis.scrollTo` (durata 1.2s, ease "Ease"). Nella home sono 2 sezioni — cambia parecchio il feel dello scroll.
- **Header completo**: nav hover → `initNavItemHover` (riga 1082); menu modal hamburger → `initModalMenu` (riga 2163).
- **Landscape cover**: overlay che blocca l'uso in landscape su mobile (`assets/landscape-cover.svg`).
- **Logo Lottie TFTL** (crediti footer, righe 1443-1481): 99 frame pilotati da un tween GSAP su hover (`assets/tftl-logo_white.lottie.json` — asset proprietario dello studio TFTL, solo riferimento).

---

## 10. Mappa dei file

```
js/main.pretty.js          ← TUTTO il codice custom, de-minificato (partire da qui)
js/main.original.min.js    ← originale scaricato da Slater
js/slater-loader.js        ← loader Slater (solo import del file sopra)
js/typekit-kit-pig8glj.js  ← kit Adobe Fonts (nomi famiglie/varianti)
css/webflow.full.min.css   ← CSS completo Webflow (classi .preloader*, .hero*, token)
css/inline/*.css           ← gli 11 blocchi <style> inline della home, rinominati:
    00-reset  01-flicker-preloader-display  02-selection  03-root-durations-eases
    04-components-hover  05-masks-arch (★ maschera arco)  06-initials-split
    07-pins-positions (coordinate pin hero)  08-loc-decor
html/index.full.html       ← home completa
html/preloader.html        ← markup preloader isolato (incluso master-preloader anti-flash)
html/hero.html             ← markup hero isolato
html/header-logo.html      ← markup logo rotante isolato (SVG rosone desk+mob)
assets/preloader_arch-l.svg← SVG cornice arco della maschera (★)
assets/preloader_bg.svg    ← texture decorativa fondo preloader
assets/hero_day_1600.webp  ← render hero giorno (riferimento)
assets/hero_night_1600.webp← render hero notte (riferimento)
assets/landscape-cover.svg ← illustrazione overlay landscape
assets/tftl-logo_white.lottie.json ← Lottie crediti TFTL (riferimento)
assets/all-asset-urls.txt  ← elenco completo di TUTTI gli URL asset del sito
fonts/MaisonNeueExt-*.woff2← body font (riferimento — serve licenza)
```

Non recuperati di proposito: `webflow.a0aa6ca1.*.js` (runtime Webflow) e jQuery — servono solo al markup Webflow originale e a `initResetWebflow` nelle transizioni Barba (§8), irrilevanti per il porting Next.js.

## 11. Piano di porting su Domus Tua (Next.js)

1. **Preloader** → riscrivere `app/components/motion/Preloader.tsx` con la maschera ad arco (§4.2) + timeline (§4.3). L'SVG arco va ridisegnato con la proporzione che preferiamo (o riusato: è un semplice path, non un'opera grafica). Testi: "Domus Tua" + payoff, progress identica.
2. **Logo rotante** → nuovo componente header: rosone SVG derivato dal nostro brand che ruota con la logica §5 (ticker GSAP + velocità Lenis). Lenis è già montato in `app/components/motion/SmoothScroll.tsx`.
3. **Hero** → `app/components/HeroCinematic.tsx`: sticky + scroll-area 4×100svh, scale 0.75→1 all'uscita del preloader, zoom a 2 sullo scroll (§6.3). Le tab day/night sono opzionali (servono due render della stessa scena).
4. **Font** → decidere con il cliente: licenza Adobe Fonts + Milieu Grotesque, oppure alternative gratuite (§2).
5. **Testi** → replicare gli animatori §7 come utility condivisa (SplitText è già disponibile in gsap@3.15).
