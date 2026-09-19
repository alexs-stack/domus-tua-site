# Coreografie di scroll di era-residence.com (home): catalogo completo

Ho letto per intero `main.pretty.js` (righe 1-2867), il markup della home e tutte le regole CSS che la riguardano. Ogni valore qui sotto è citato a file:riga; quelli calcolati hanno la formula accanto.

**Riferimenti.** Cartella base: `C:\Users\alber\domus-tua-site\reverse-engineering\era-residence\`
- `JS:n` = `js/main.pretty.js`
- `HTML:n` = `html/index.full.html` (minificato, quindi la riga indica l'inizio della sezione)
- `WF` = `css/webflow.full.min.css` (una sola riga, lo cito per selettore)
- `inline/…` = `css/inline/*.css`

**Unità.** `html{font-size:1vw}`, quindi 1rem = 1vw. Su desktop `--Npx` vale N/16 vw: margine laterale 3vw, gap 1vw, cella orizzontale 8.5vw, cella verticale 6vw, contenuto 94vw. Sotto i 992px il rapporto è 4.16: margine 5.77vw, gap 3.85vw, celle 19.23vw, e `--_special-units---100vh` diventa `--_100svh`, fissato in px una sola volta al load (JS:2863).

## Cosa correggere rispetto all'articolo e al README

- **Sezioni:** la home ha **14 `<section>`**, non 26 (HTML:1120-1243). Contando i 3 pannelli dello scroller orizzontale e il preloader si arriva a 18 unità coreografiche.
- **Nessun pin:** in tutto il JS non c'è un solo `pin:`. Ogni corridoio è `position:sticky` più l'altezza di un wrapper.
- **Footer:** a restringersi non è il body. È il `.container[data-footer-clip]` della sezione CTA (HTML:1238); il footer gli sale sopra di 16vw.
- **Ordine di creazione:** `initAllParallax` parte al load (JS:6). Tutte le altre coreografie (`initScripts`, JS:221-222) nascono solo quando parte `initPageTransitions`, cioè al 25% del dive del preloader (JS:78-80, 140-142).

---

## A. Indice delle funzioni che animano

| Funzione | Righe JS | Selettore | Dove in home (HTML) |
|---|---|---|---|
| `animatePreloaederIntro` / `Short` | 12-86 / 88-148 | `[data-preloader]`, `.hero-w_bg_master_img` | overlay, hero 1120 |
| `initPageTransitions` (Barba) | 150-219 | container Barba | `main` 1049 |
| `initLenis` / `initLocalLenis` | 225-234 / 236-250 | window / `[data-lenis-scroll]` | modale 1255 |
| `initThemeChange` | 280-309 | `[data-theme]` × `[data-bg]` | vedi C1 |
| `initSnapSections` | 311-332 | `[data-snap]` | 1170, 1198 |
| `initPlayPauseVideoScroll` | 384-399 | `[data-video-playpause]` | 1176, 1202, 1216, 1225, 1230 |
| `animateTextA/H/P`, `animateCtn/Line/Slide` | 401-672 | `data-scroll-reveal` / `data-part` / `data-slider` / `data-tab` | ovunque |
| `initOther` | 712-740 | `.loc-path-s_path` (mobile), video su Safari | 1190 |
| `fitText` | 751-761 | `[data-fit-text]` | titolo "Architecture" 1225 |
| `initScrollRevealFirst` | 807-819 | `[data-reveal-first]` | slider 1170, 1198, 1211, 1216 |
| `initAllParallax` | 821-906 | `data-parallax=img / img-out / img-in / ctn-down / ctn-up` | vedi C4 |
| `initScrollElementsReveal` | 908-1027 | `[data-scroll-reveal]` | ovunque |
| `initPins` | 1319-1360 | `[data-pin]` | hero |
| `initLogo` / `initScrollBar` | 1362-1406 / 1408-1441 | `.header-logo` / `[data-s-bar]` | globali |
| `initAccordion` | 1500-1548 | `[data-accordion-card]` | 1230 |
| `initSlider` | 1550-1661 | `[data-slider]` | 1170, 1198, 1216 (gallery) |
| `initTabs` / `initTabsHilight` / `initTabsHero` | 1962-2013 / 2061-2088 / 2015-2059 | `[data-tabs]` / `[data-tabs-hilight]` / `[data-tabs-hero]` | amenities 1211 / hero |
| `initModalCta` / `Menu` / `Tip` / `initFloatingTips` | 2090-2352 | modali e tooltip | hero, globali |
| **`initTranistionFlow`** | **2507-2851** | hero 2508 · cupola 2552 · concept 2569 · scroller orizzontale 2596 · mappa percorso 2653 · master plan 2671 · amenities 2686 · architecture 2709 · footer 2790 · `.lot-w` 2836 | |

**Assenti in home**, cioè nessun selettore nel markup: `initBenefitCards` (763), `initCardParts` (1483), `initCarousel` (1663), `initLightbox` (1708), `initImageZoom` (1789), filtri e ordinamento (2354-2505), `.lot-w` (2836), `[data-scroll-trigger=refresh]` (722).

---

## B. Catalogo in ordine di pagina

### 1. Preloader e ingresso dell'hero (al load, non allo scroll)
- **Selettore:** `[data-preloader]`
- **Righe:** JS:12-148 · CSS `inline/05-masks-arch.css:39-58`
- **Meccanica:** overlay fisso; `lockScroll` blocca lo scroll e ferma Lenis (JS:692-695).
- **Tween dell'intro (JS:32-84), in sequenza:**
  1. set `--arch-w` 24vw (mobile 40vw), `--arch-y` 104vh
  2. reveal dei testi
  3. pausa di durL
  4. `.preloader_bg_a` opacity 0→.05, durL, Out; in parallelo (`"<"`) il decor 0→1
  5. progress: `yPercent` −100→0, 4s, `loaderEase`
  6. arco: `--arch-y` →15vh, `--arch-w` →36vw (mobile 50vw), 1.25·durL = 1.5s, InOut
  7. a `"<90%"`: `--arch-y` −100vh, `--arch-w` "125" (senza unità), 2·durL = 2.4s, diveIn
  8. a `"<"`: immagine hero scale .75 (mobile 1.15) → 1, 1.5s, InOut, origin center top
  9. a `"<25%"`: `initPageTransitions`
  10. sblocco dello scroll e `display:none`
- **Variante breve:** JS:88-148, usata dalla seconda visita (`sessionStorage`).
- **Mobile:** i valori tra parentesi, letti una volta da `innerWidth`.
- **Contenuto visivo:** fondo prugna, logo, "Costa | Era Residence / Estepona | del Sol", barra di progresso di 1px, porta ad arco.
- **Per Domus:** maschera ad arco (curva), fondo scuro e Barba sono vietati. Riutilizzabili la timeline di lettura, la progress bar e l'hero che scala .75→1.

### 2. Hero sticky: parallasse e tuffo a scale 2
- **Selettore:** `section#hero.section.clip.theme_on-color` > `.hero-scroll-area` > `.hero-w`
- **Righe:** JS:2507-2551 · HTML:1120 · WF `.hero-scroll-area`, `.hero-w`, `.hero-w_bg`
- **Meccanica:** `.hero-w` sticky top 0, alto 100vh.
  - Corridoio: 4·100vh + 50rem + 100vh = **5·100vh + 50vw**; sotto i 767px, 3·100vh + 50vw.
  - Trigger `.hero-scroll-area`, `"top top"` → `"bottom bottom"`, scrub true.
  - Corsa: 4·100vh + 50vw (5280px su uno schermo 1920×1080).
- **Timeline** (durata totale 1.0; costruita solo a immagine caricata, JS:2548-2550; `t = .hero-w_bg.offsetHeight`):

| Posizione | Target | Da → a | Ease |
|---|---|---|---|
| 0→0.6 | `.hero-s` | y 0 → −(1.25·t − innerHeight) | Ease (solo desktop) |
| 0→0.6 | `.hero-w_bg` | y 0 → −(t − innerHeight) | Ease (solo desktop) |
| 0.4→1.0 (`"-=0.2"`) | `.hero-w_bg` | scale 1→2, translateZ 10, origin "50% 75%" | In |

  - Il render è 1600×1440, quindi t ≈ 90vw. Su 1920×1080: t = 1728px, il testo sale di −1080px, l'immagine di −648px.
- **Mobile:** `g = innerWidth < 992` è letto una volta, non è un matchMedia. Resta solo lo zoom, posizionato a `">"`, che occupa tutta la corsa.
- **Altro nella sezione:**
  - tab giorno/notte: crossfade opacity durM InOut (JS:2015-2059)
  - pin con pulse infinito: dimensione a→1.6a, opacity 1→0, durL In, stagger .2 (JS:1319-1360)
  - tooltip desktop (JS:2319) e bottom-sheet mobile (JS:2258)
- **Temi:** `.hero_themes` va da top 0 a bottom 100vh: `color` flex 1, poi `light` sugli ultimi 35rem.
- **Contenuto visivo:** h1 "Era Residence", "Estepona" in script ruotato di −12°, render a tutta larghezza giorno/notte, pin, bottone circolare.
- **Per Domus:** tema prugna e script da togliere. Parallasse 1.25× e zoom 2 sono rettilinei e riutilizzabili.

### 3. Cupola "Costa del Sol" con word-spacing
- **Selettore:** `section.section.arch.clip.theme_on-brand` > `.benefits-intro-w` > `[data-circle-text]`
- **Righe:** JS:2552-2568 · HTML:1146 (isolata in `html/arch-intro.html`) · CSS `css/arch-dome.css:1-32, 103-109`
- **Meccanica:** nessuno sticky proprio.
  - La forma è `border-top-*-radius: 50rem` (50vw) con z-index 1.
  - `.benefits-intro-w` ha `margin-top: −(50rem + 100vh)`. Poiché `overflow:clip` non crea un contesto di formattazione, il margine collassa sulla section: la cupola parte 50vw + 100vh prima della fine della hero-scroll-area e scorre sopra `.hero-w` mentre è ancora sticky.
  - Il blocco `.benefits-intro-s` è alto 50rem, con i contenuti in basso (flex-end).
- **Tween:** trigger `.benefits-intro-w`, `"top bottom"` → `"bottom top"`, scrub true. `wordSpacing` "0rem" → "10rem" (10vw), ease none, su tutta la corsa.
  - Corsa: 100vh + 50vw.
  - Su desktop va dallo scroll 300vh a 400vh + 50vw, cioè finisce esattamente con la timeline dell'hero.
- **Geometria del testo:** viewBox 1600, cerchio di raggio 676 → r = 42.25vw. L'apice cade 124/1600 = 7.75vw sotto il bordo; `startOffset 25%` è l'apice, `text-anchor:middle` (`arch-intro.html:48-55`). Su mobile viewBox 416 e r=160.
- **Altri reveal:** p ("Costa", "del Sol", "A place to live — to return year after year"), ctn (logo), line (divider alto 13vw).
- **Mobile:** il word-spacing gira anche su mobile; il blocco ha altezza auto.
- **Contenuto visivo:** cupola azzurro polvere (#b5cedb), senza foto né video.
- **Per Domus:** cupola e testo circolare sono curve vietate. Trasferibile: pannello a bordo dritto che scorre sopra uno sticky con lo stesso margine negativo, più `wordSpacing` 0→10vw in scrub su una riga dritta a grande corpo.

### 4. Slider "benefits" (con snap)
- **Selettore:** `section[data-bg=light][data-snap].section.z-2.theme_on-brand` > `.benefits-s_cms[data-slider]`
- **Righe:** JS:1550-1661 (slider), 311-332 (snap) · HTML:1170 · WF `.benefits-s` alto 100vh, `.benefits-cms_list_item` absolute
- **Meccanica:** nessuno sticky; sezione alta 100vh con z-index 2, che copre l'ultimo viewport dell'hero sticky. Snap su desktop (C2).
- **Cambio slide (JS:1564-1588):**
  - Autoplay con `setInterval` ogni 6s (JS:1637), attivo solo se l'IntersectionObserver vede almeno il 20% (JS:1649-1654).
  - Progress: width 0→100% in 6s, lineare (JS:1600-1607).
  - Istante 0, slide uscente: hide di h, p, ctn e immagine (`animateSlide` hide, durL InOut).
  - Istante 0, slide entrante: clip `polygon(100% 0%,100% 0%,101% 100%,125% 100%)` → `polygon(0% 0%,100% 0%,100% 100%,0% 100%)`, durL InOut; immagine interna scale 1.5→1, xPercent 25→0.
  - +durM: reveal di h, p, e ctn con delay durS.
  - +durS: la slide uscente va a `display:none`.
- **Primo ingresso:** la prima slide si rivela a scroll; le altre perdono `data-scroll-reveal` (JS:807-819).
- **Mobile:** niente snap; h2 al posto di h1.
- **Contenuto visivo:** 3 slide ("Real-Life Location", "Built to stay", "Boutique concept") con h1, foto e paragrafi.
- **Per Domus:** nessun vincolo. Il clip a parallelogramma è una diagonale, non una curva.

### 5. Citazione su render scontornato
- **Selettore:** `section.section.z-2.theme_on-brand` > `.quote-w`
- **Righe:** JS:839-856 · HTML:1174 · WF `.quote-s` (absolute in basso, theme_on-color, solo desktop), `.w_themes*`
- **Tween (`img-out`):** `img.quote-w_bg_img` yPercent 0→20, translateZ 10, ease none. Trigger `.quote-w_bg`, `"bottom bottom"` → `"bottom top"`, scrub .5: l'immagine affonda mentre la sezione esce.
- **Temi divisi in orizzontale:** prima riga metà `color` e metà `light`, seconda riga `color` alta 30rem. Il logo a sinistra diventa bianco sulla foto, la nav a destra resta scura.
- **Mobile:** sfondo quadrato; parallasse attiva.
- **Contenuto visivo:** render dell'edificio con cielo trasparente su fondo azzurro; citazione h5 con linea rossa.
- **Per Domus:** nessun vincolo.

### 6. Scroller orizzontale (il contenitore)
- **Selettore:** `section[data-bg=light][data-slow-scroll].section.clip` > `.loc-scroll-area[data-scroll-horizontal][data-video-playpause]` > `_screen` (sticky) > `_track`
- **Righe:** JS:2596-2652 (matchMedia ≥992) · HTML:1176-1190 · WF `.loc-scroll-area_screen` sticky
- **Meccanica:** sticky più `area.style.height = track.scrollWidth + "px"` e poi `ScrollTrigger.refresh()`.
  - Larghezze dei pannelli: 94vw + 122.5vw + 94vw = scrollWidth ≈ 310.5vw.
  - `offsetWidth` = 97vw (solo padding-left).
- **Tween:** track `x: −(scrollWidth − offsetWidth)` ≈ −213.5vw, ease `horScroll`, trigger area `"2.5% top"` → `"97.5% bottom"`, scrub .25.
  - Corsa = 0.95·H − 100vh: su 1920×1080 H = 5962px e la corsa è 4583px; lo sticky dura 4882px.
  - Il tween è salvato in `area._horizontalTween` (JS:2611) e fa da containerAnimation (JS:913, 2665).
- **`data-slow-scroll`:** non è mai usato nel JS.
- **Video:** play/pause sull'area intera (C3).
- **Mobile:** schermo static, track in colonna; i reveal ricadono su `"top bottom"`.

#### 6a. Pannello "The concept": aggancio con scale .75→1
- **Selettore:** `.loc-info-w` > `.loc-info-s`
- **Righe:** JS:2569-2595 e 857-874
- **Tween A** (attivo anche su mobile): trigger `.loc-info-w`, `"top 30%"` → `"bottom bottom"`, scrub .5. `.loc-info-s` opacity 0→1 e scale .75→1, ease none.
  - `onEnter`: reveal di `[data-part=p]` e `[data-part=ctn]` con delay .1. `onLeaveBack`: hide.
  - Corsa desktop: 30vh.
- **Tween B** (`img-in`), sullo stesso elemento: yPercent −20→0, `"top bottom"` → `"bottom bottom"`, scrub true.
- **Fiore:** `.flower.loc-info` in `ctn-down` (C4).
- **Contenuto visivo:** "The concept", testo h4, simbolo del logo, video di fiori 01.

#### 6b. Pannello "New Golden Mile": righe del titolo in controfase
- **Righe:** JS:2612-2638
- **Tween:** le tre righe `.loc-intro-s_title_line` vanno da xPercent `wrap[−5,25,−15]` a `wrap[5,−25,25]`, ease none, trigger area `"top top"` → `"bottom bottom"`, scrub .25.
- **Fiore:** `.flower.loc-intro` xPercent 0→−25, stesso trigger.
- **Reveal** via containerAnimation (`"left bottom"`, once): "Spain", h1 su tre righe, foto terrazza, testi, bottone.
- **CSS:** rientro della seconda riga pari a mezza cella (4.25vw), della terza pari a una cella più il gap (9.5vw).
- **Per Domus:** via il fiore; la controfase delle righe va bene.

#### 6c. Pannello del percorso: la mappa si disegna
- **Righe:** JS:2653-2670 e 2639-2651
- **Tween:** `.img.loc-path` clip `inset(0% 100% 0% 0%)` → `inset(0%)`, durata 2·durL = 2.4s, Out, delay durM, via containerAnimation `"left bottom"`, once (non scrub).
- **Fiore:** `.flower.loc-path` yPercent 0→25 da `"bottom bottom"` a `"bottom top"` dell'area.
- **Titolo:** "The coast you wanted / *yours* (script) / this year".
- **Mobile:** il percorso diventa scrollabile in orizzontale e parte centrato (JS:732-735).
- **Per Domus:** via lo script (unico display Playfair) e il fiore.

### 7. Master plan: zoom d'ingresso e nuvole
- **Selettore:** `section[data-bg=color].section.clip.theme_on-color` > `.loc-w[data-parallax=w]`
- **Righe:** JS:2671-2685 e 821-838 · HTML:1190-1198 · CSS `inline/04-components-hover.css:328-343`, `inline/08-loc-decor.css:2-4`
- **Tween:**
  - `gsap.from(.loc-w_bg_img, {scale 1.15, origin "center bottom", ease Ease})`, trigger `.loc-w`, `"top bottom"` → `"bottom bottom"`, scrub .25.
  - Sul genitore `.loc-w_bg` (`img`): yPercent −15→15, scrub .5. I due movimenti si sommano.
- **Solo CSS:**
  - tre file di nuvole in marquee, 32s lineare infinito all'indietro (translateX −50%→0), elementi pari specchiati
  - gradiente in alto da crema a trasparente, alto 20vw
  - decoro a trapezio alto 3vw in fondo, color azzurro: `polygon(offset-l 0, 100%−offset-r 0, 100% 101%, 0 101%)`
- **Mobile:** immagine larga 200%, trascinabile ("Drag to see more").
- **Contenuto visivo:** vista aerea del complesso, didascalia "New Golden Mile, Estepona".
- **Per Domus:** cambiare il tema dell'header (qui prugna).

### 8. Slider delle tipologie (con snap)
- **Selettore:** `section[data-bg=light][data-snap].section.theme_on-brand` > `.apart-type-s_cms[data-slider]`
- **Righe:** HTML:1198 · WF `.apart-type-slide_img` (3/4, larga 27.5vw, centrata in absolute)
- **Meccanica e tween:** identici al punto 4.
- **Mobile:** altezza auto, contenuti impilati.
- **Contenuto visivo:** 3 slide "Ground floor + basement / Ground Floor / Penthouse duplex", con numero di camere, m² e bottoni.

### 9. Apart-info: testo fermo
- **Selettore:** `.apart-info-w[data-video-playpause]`
- **Righe:** HTML:1202
- **Meccanica:** nessuna timeline. Solo reveal (line, 3 p, ctn) e un fiore (video 04) in `ctn-down`.
- **Per Domus:** senza il fiore restano solo i reveal.

### 10. Amenities: sticky con zoom 2 e dissolvenza, coperte dalla seconda cupola
- **Selettore:** `.amen-scroll-area` > `.scroll-area_screen` (sticky) > `section.theme_on-color` > `.amen-w` > `.amen-cms`
- **Righe:** JS:2686-2708 · HTML:1211 · WF `.amen-scroll-area`, `.scroll-area_screen`
- **Meccanica:** corridoio di 2.5·100vh + 50vw; corsa scrub di 1.5·100vh + 50vw (2580px su 1920×1080).
- **Tween:** trigger area `"top top"` → `"bottom bottom"`, scrub true. `.amen-cms` scale 1→2, ease In; `.amen-w` opacity 1→0, ease In, in parallelo. Entrambi coprono tutta la corsa.
- **La cupola successiva (punto 11):** entra dal basso dopo 0.5·100vh di sticky e copre per 100vh + 50vw.
- **Tab (5 voci):** timeline come lo slider (JS:1983-2009). La barra evidenziata scorre in y/altezza, durM InOut. Opacità tab .4→1 via CSS.
- **Immagini:** ogni `img.img-p` (alta 140%) è in `img-in`: yPercent −20→0, scrub true.
- **Mobile:** la timeline gira anche su mobile.
- **Per Domus:** tema prugna e cupola vietati. Zoom e dissolvenza in sticky sono riutilizzabili con un pannello dritto al posto della cupola.

### 11. Interior: seconda cupola e colonne in controfase
- **Selettore:** `section.section.arch.clip` > `.interior-w` (`margin-top −(50rem+100vh)`)
- **Righe:** HTML:1216
- **Meccanica:** stesso scorrimento a cupola del punto 3, ma senza timeline propria; tema di default (crema).
- **Tween:**
  - `.interior-s_l` in `ctn-down` (−10→10) e `.interior-s_r` in `ctn-up` (10→−10), entrambe con `data-mob="off"` (solo desktop), scrub .5.
  - `.flower.interior` in `ctn-up`, anche su mobile.
- **Reveal:** titolo h, script a, 6 immagini slide, p ×3, ctn ×2.
- **Gallery:** 16/10, 4 slide, autoplay 6s.
- **Temi:** partono 50rem sotto il bordo: `light` 25rem, poi riga divisa `dark` a sinistra (sul riquadro prugna) e `light` a destra (52.5rem), poi `light`.
- **Per Domus:** cupola, riquadro prugna, fiore e script vietati. Colonne ±10% e gallery riutilizzabili.

### 12. Architecture: tende a otturatore, scale 1.84, fiori spinti fuori
- **Selettore:** `section.section.clip` > `.arch-scroll-area[data-video-playpause]` > `.arch-intro-s.b-desk` (tende `_bg_l` / `_bg_r`, fiori `arch-intro-l` / `-r`) + `.arch-w.theme_on-color`
- **Righe:** JS:2709-2789 (matchMedia ≥992) · HTML:1225 · CSS `css/arch-dome.css:34-72, 111-124`, `inline/05-masks-arch.css:6-9`
- **Meccanica:** due sticky.
  - `.arch-intro-s`: sticky top 0, z-index 1, alto 100vh con `margin-bottom −100vh` (altezza netta zero).
  - Tende: sinistra `inset(−1% calc(50% − 1px) 0 0)`, destra `inset(−1% 0 0 50%)`, colore `--base-0--primary`. Il CSS iniziale `clip-path: inset(50% 50% 50% 500%)` le tiene invisibili finché non parte il JS.
  - `.arch-w`: sticky, con `.arch-s` in proporzione 144/168, alto circa 109.7vw.
  - Corridoio: 109.7vw + 2·100vh (due spaziatori `._100vh`), circa 4266px; `.arch-w` resta agganciato per 200vh.
- **Timeline:** trigger `.arch-intro-s`, `"top bottom"` → `"200% top"`, scrub true, durata totale 1.0:

| Posizione | Target | Clip / valori | Ease |
|---|---|---|---|
| 0→0.5 | `_bg_l` | `polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 36.111%, 98.889% 36.111%, 98.889% 99.074%, 44.444% 99.074%, 1.111% 100%, 100% 100%, 100% 0%)` → stesso con 36.111→18.519 e 99.074→81.481 | none |
| 0→0.5 (`"<"`) | `_bg_r` | `polygon(0% 0%, 0% 100%, 1.111% 100%, 1.111% 0.926%, 55.556% 0.926%, 55.556% 63.889%, 1.111% 63.889%, 1.111% 100%, 100% 100%, 100% 0%)` → 0.926→18.519 e 63.889→81.481 | none |
| 0.5→0.6 | `_bg_l` | lato interno del foro 98.889% → 100% | none |
| 0.5→0.6 | `_bg_r` | lato interno del foro 1.111% → 0% | none |
| 0.6→1.0 | `.arch-intro-s` | scale 1→1.84 (origin 50% 50%) | InOut |
| 0.6→1.0 | fiore sinistro / destro | scale →1.84, xPercent →−50 / →+50 | InOut |
| 0.6→1.0 | `.arch-w` | scale .75→1, origin "center top" | InOut |

- **Come leggere i poligoni:** ogni tenda è un rettangolo pieno con un foro rettangolare, disegnato con una fessura larga zero.
  - Frazioni esatte: 4/9, 5/9, 89/90, 1/90, 5/27, 22/27, 13/36, 107/108, 1/108, 23/36.
  - In viewport la finestra va da 22.2vw a 77.8vw, quindi è larga 5/9 dello schermo (55.6vw), alta 17/27·101vh ≈ 63.6vh, con il bordo alto a 17.7vh.
  - All'inizio la metà sinistra del foro è spostata in basso e la destra in alto, sfalsate del 35.2%. Si allineano (effetto otturatore), poi spariscono i due montanti centrali da 1/90.
- **Da dove viene 1.84:** per riempire la larghezza serve 1/(5/9) = 1.8. 1.84 è 1.8 × 1.022, cioè un 2% di margine: la finestra arriva a circa 102vw e 117vh.
- **Scansione dello scroll** (s = 0 quando il top dell'area tocca il top del viewport; corsa 300vh):

| Scroll s | Stato |
|---|---|
| −100vh | inizio |
| 0 | 33% |
| +50vh | otturatore chiuso |
| +80vh | montanti spariti |
| +200vh | scale finito, `.arch-w` si sgancia |

  - Attenzione: il trigger è un elemento sticky, quindi la posizione viene misurata al refresh con scroll a 0. Un `refresh(true)` da resize a metà pagina può spostare lo start.
- **Testi (JS:2770-2778):** h1 con `fitText` (font-size = fs × larghezza del genitore / larghezza del testo) e paragrafo. Reveal quando l'area arriva a `"30% top"` (circa s = +118vh su 16:9, durante lo scale), hide su `onLeaveBack`.
- **Foto (JS:2779-2788):** yPercent 0→25, da `"55% top"` a `"bottom top"`, scrub true.
- **Nota:** citazione e bottone in basso usano `data-part`, che nessuno scroll anima: restano fermi.
- **Temi:** `light` per 1.5·100vh (solo desktop), poi `color`.
- **Mobile:** nessuna timeline; tende nascoste; testi visibili; la foto usa `img` con `data-desk=off`, quindi solo su mobile: yPercent −15→15.
- **Per Domus:** le tende rettangolari sono consentite. Togliere la spinta dei fiori, portare `.arch-w` su un tema chiaro, colorare le tende come il fondo della sezione precedente, e usare come trigger il wrapper non sticky.

### 13. Other: accordion
- **Righe:** JS:1500-1548 · HTML:1230
- **Tween:** al click, altezza 0→auto, durL Out, poi `ScrollTrigger.refresh()`. Icona 0→−45 in apertura e →−90 in chiusura, durM InOut. Reveal di p e ctn. Un solo pannello aperto alla volta.
- **Fiore:** in `ctn-down`.
- **Contenuto visivo:** 4 righe (Developer, Sales & Marketing, License obtained, 2026).
- **Per Domus:** via il fiore.

### 14. CTA "Perfect sea views"
- **Selettore:** `section[data-bg=color].theme_on-color` > `.container[data-footer-clip]` > `.cta-w`
- **Righe:** HTML:1238 · WF `.cta-s` in proporzione 144/168 (mobile 2/6), `.img-p` alta 140%
- **Tween:** `.img-p` in `img`: yPercent −15→15, scrub .5. Reveal di p, h ×2, ctn.
- **Per Domus:** tema prugna da cambiare.

### 15. Footer: la CTA si ritira in una cornice e il footer cresce
- **Selettore:** `section[data-bg=dark].theme_on-dark` > `.footer-w` > `.footer-s`; bersaglio `[data-footer-clip]`
- **Righe:** JS:2790-2835 · HTML:1243-1255 · WF `.footer-w`, `.footer-w_bg`
- **Meccanica:** nessuno sticky.
  - `.footer-w` risale sulla CTA con `margin-top −(offset-l + 2·cella verticale + gap)` = −16vw (mobile circa −48.1vw).
  - `.footer-s` ha z-index 1 ed è alto 100vh.
  - `.footer-w_bg` è absolute, z-index −1, `bottom:100%`, alto 2·100vh, color prugna.
- **Timeline:** trigger `.footer-w`, `"top 30%"` → `"bottom bottom"`, scrub .5, tutto a posizione 0:
  - `[data-footer-clip]` clip `inset(0%)` → `inset(8% 22% 8% 22%)`; su mobile `inset(4% 32% 4% 32%)`, scelto una volta da `innerWidth`. Ease none.
  - `.footer-s` opacity 0→1 e scale .75→1, ease none.
  - Callback: reveal di `[data-text=h/p/ctn]` con delay .1; hide su `onLeaveBack`.
- **Corsa:** il footer è l'ultimo blocco e alto 100vh, quindi la corsa è **circa 30vh**.
  - Sulla scatola CTA (circa 109.7vw) l'8% vale ~8.8vw sopra e sotto; la cornice finale è larga 56vw.
- **Freccia `.s-down`:** opacity →0, InOut, da `"top bottom"` a `"center bottom"` (JS:2824-2834).
- **Per Domus:** il ritaglio rettangolare è consentito, il fondo prugna no. Il gesto è molto corto: valutare un `end` più lungo.

---

## C. Primitive trasversali

**C1. Cambio tema dell'header (JS:280-309)**
- **Elementi con `[data-theme]`:** `.header-logo` (HTML:1049), `.header-nav` (1108), `.s-bar-w` e `.s-down` (1118).
- **Meccanica:** per ogni coppia marker `[data-bg]` × elemento il cui centro x cade nel marker (misurato una volta; i marker nascosti vengono saltati) viene creato un ScrollTrigger:
  - trigger il marker, `start: top top+=centroY`, `end: bottom top+=centroY`
  - `onEnter` / `onEnterBack` aggiungono `theme_on-<bg>` e tolgono gli altri due
  - nessun `onLeave`: il tema resta finché subentra un altro marker
- **Transizione CSS:** colore e sfondo in durS ease-out (`inline/04-components-hover.css:448-461`).
- **Palette:**
  - `color`: testo bianco su prugna
  - `light`: navy #17233b su crema #f3f3ec
  - `dark`: crema su prugna
  - `brand`: navy su azzurro; è solo una classe statica di sezione, il JS non la scambia
- **Menu aperto:** forza `theme_on-dark` (JS:2168).

**C2. Snap (JS:311-332, solo desktop)**
- Dopo 40ms di scroll fermo, per ogni `[data-snap]` calcola `(min(bottom,vh) − max(top,0)) / min(offsetHeight,vh)`.
- La sezione migliore sopra 0.5 viene agganciata con `lenis.scrollTo(el, {duration: durL, easing: "Ease"})`.
- Nella home sono snap le sezioni 1170 e 1198.

**C3. Video play/pause (JS:384-399)**
- All'avvio `load()` e `currentTime = 0`; ScrollTrigger `"top bottom"` → `"bottom top"`: play su enter/enterBack, pause su leave/leaveBack.
- Wrapper in home: 1176 (fiori 01-03), 1202 (04), 1216 (06), 1225 (05 e 07), 1230 (07).
- **Safari (JS:737-739):** toglie le sorgenti webm e avvia tutti i video fuori da `.hero-w` e `.cta-w`, quindi il gating di fatto salta.
- In home tutti i video sono fiori.

**C4. Parallassi (JS:821-906)** — ease none per tutte; i flag `data-mob` / `data-desk` sono letti una volta da `innerWidth`.

| Tipo | Trigger | Da → a | Start → end | Scrub | Usi in home |
|---|---|---|---|---|---|
| `img` | wrapper `[data-parallax=w]` più vicino | yPercent −15→15, translateZ 10 | top bottom → (bottom top) | .5 | master plan 1198, foto arch 1230 (solo mobile), CTA 1243 |
| `img-out` | wrapper | 0→20 | bottom bottom → bottom top | .5 | citazione 1176 |
| `img-in` | wrapper | −20→0 | top bottom → bottom bottom | true | concept 1176, amenities ×5 1211 |
| `ctn-down` | l'elemento stesso | −10→10 | top 125% → bottom −25% | .5 | fiori 1185, 1211, 1238; colonna sinistra interior 1216 |
| `ctn-up` | l'elemento stesso | 10→−10 | uguale | .5 | fiore interior e colonna destra 1216 |

**C5. Reveal (JS:401-672, trigger 908-1027)**
- **Trigger:** raggruppamento per `[data-scroll-reveal="w"]`, ScrollTrigger `"top bottom"` (`"left bottom"` dentro lo scroller orizzontale), once, delay .3.

| Tipo | Reveal | Hide |
|---|---|---|
| `a` | per carattere: opacity 0→1, rotateX 90→0, x 10rem→0, origin center bottom, durL, stagger .1, Out | rotateX −90, x −10rem, durS, stagger .05, In |
| `h` | per carattere: opacity, yPercent 50→0, rotateY 90→0, durL, stagger .05, Out | yPercent −50, rotateY −90, durS, stagger .025 |
| `p` | righe mascherate: yPercent 110→0, durL, stagger .1 | yPercent −110, durS |
| `ctn` | opacity e y 3.333rem (mobile 11.54rem) → 0, durL | opacity 0, durS |
| `line` | clip `inset(0 0 100% 0)` → `inset(0)`, durL | `inset(100% 0 0 0)`, durS |
| `slide` | poligono come al punto 4, immagine interna scale 1.5→1 e xPercent 25→0, durL InOut | poligono verso sinistra, immagine scale 1.5 e xPercent −25, durL |

**Globali, non legati a una sezione:**
- **Lenis (JS:225-234):** duration 1.2, easing `min(1, 1.001 − 2^(−10t))`, `lagSmoothing(0)`.
- **Scrollbar (JS:1408-1441):** trascinamento con `scrollTo` di 3.2s.
- **Logo (JS:1362-1406):** 30°/s più 10 × velocità.
- **Bottone magnetico:** power4.out 1.6s, rientro `elastic.out(1, 0.3)`.
- **Bootstrap:** resize con debounce 40ms e poi `refresh(true)`.
- **Barba (JS:150-219):** transizioni di pagina, vietate su Domus.

---

## D. CustomEase e costanti

| Nome | Definizione | Righe JS |
|---|---|---|
| InOut | `"0.75,0,0.25,1"` (in CSS è `cubic-bezier(0.76,0,0.24,1)`, `inline/03-root-durations-eases.css:7`) | 2863 |
| Out | `"0.25,1,0.5,1"` | 2863 |
| In | `"0.5,0,0.75,0"` | 2863 |
| Ease | `"0.25,0.1,0.25,1"` | 2863 |
| Write | `"0.333,0,0.667,1"` — definito ma mai usato | 2863 |
| diveIn | `"0.6,0,0,1"` | 2863 (usato a 69 e 131) |
| horScroll | `"0.25,0,0.75,1"` | 2863 (usato a 2603) |
| loaderEase | `"M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1"` | 24 |
| Ease GSAP standard | `none`; `power3` (2344); `power4.out` (1060); `elastic.out(1, 0.3)` (1039) | |

| Costante | Valore | Righe |
|---|---|---|
| durS / durM / durL | .4 / .8 / 1.2 s | JS:2858-2860 |
| stagger / delayReveal | .1 / .3 | JS:2861-2862 |
| Derivate | 1.25·durL = 1.5s · 2·durL = 2.4s · .5·stagger = .05 · .25·stagger = .025 · progress preloader 4s | |
| breakPoint | 992 | JS:2855 |
| Scrub usati | `true`, `.25`, `.5` | |
| Debounce resize / snap | 40ms / 40ms | JS:2863-2866 / 317 |
| Autoplay slider / soglia visibilità | 6s / .2 | JS:1637 / 1652 |
| Lenis globale / locale | 1.2 / .6 | JS:228 / 240 |