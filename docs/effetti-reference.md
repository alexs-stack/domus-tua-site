> Dossier degli effetti studiati dalle reference repo (2026-08-06).
> Le repo stanno in `_refs/` e in `reverse-engineering/`: sono materiale di
> studio, gitignorate, mai importate. Questo documento è la parte che resta —
> quale effetto va in quale sezione, con la tecnica esatta e il piano di
> adattamento diviso fra "cosa cambia" e "cosa NON deve cambiare".

# DOSSIERS — cosa entra nel sito, da dove viene, e a quali condizioni

Sintesi decisionale delle dieci reference lette una per una. Regole applicate senza sconti:

- **niente three.js, niente WebGPU, niente canvas WebGL.** Lo stack è GSAP + ScrollTrigger + useGSAP + Lenis. `ogl` è in `package.json` ma inutilizzato e resta inutilizzato.
- **niente glass / plasma / water / frost / ripple**, per direttiva del cliente. Il confine è netto: se l'effetto si chiama `FluidSim`, o se il suo nome commerciale contiene "liquid", non entra, nemmeno travestito.
- **un effetto sopravvive solo se sopravvive intero.** Se l'unica versione portabile è un'approssimazione povera dell'originale, viene scartato e detto perché — non venduto come "variante".
- **un effetto va in una sezione sola.** Dove due reference proponevano la stessa legge sullo stesso elemento (per esempio due leggi di stagger sulla griglia di Services, o due animazioni sullo stesso titolo), il conflitto è stato risolto qui, non lasciato all'implementazione.

Contesto che cambia tutte le risposte, e che va letto prima della tabella: **la transizione di colore fra sezioni è già in produzione.** `app/components/motion/ToneShift.tsx` (commit `c0d4b34`, "i cambi di colore diventano porte, non bordi") copre tutti i confini della home con la maschera ad arco. `app/components/motion/HorizonScroller.tsx` copre già la meccanica dello scroll orizzontale (usata da `HorizonStory`). `LiquidReveal`, `HoverDistort`, `MaskReveal`, `Parallax`, `TextLines`, `Atmosphere`, `Magnetic`, `Preloader` esistono. Quindi la domanda utile non è "cosa è riproducibile" — quasi tutto lo è, perché sei reference su dieci non hanno una riga di 3D — ma **cosa manca davvero**.

---

## 1. Tabella di assegnazione

### 1.1 Le cinque sezioni bersaglio

| # | Sezione | Effetto assegnato | Reference | Costo | Perché lì |
|---|---|---|---|---|---|
| 1 | **OpenDomus.tsx** | Titolo a sipario in due metà, `calc()` puro sul bus `--progress` | telescope-zoom | Nullo (CSS + 1 `setProperty`/frame) | Il titolo si apre e scopre il poster video già presente in sezione. Registro editoriale con Playfair, reduced-motion gratis: se `--progress` non viene mai scritta il titolo resta composto |
| 2 | **OpenDomus.tsx** | Godray = coni d'**ombra** in `linear-gradient` | aurelia | Nullo (2-3 div, nessun canvas) | `bg-paper` è la campitura più piatta della home. La scoperta della reference è che i suoi "raggi" sono neri: volumi d'ombra, non fasci additivi. In CSS è un gradiente inclinato |
| 3 | **DomusDocProtocol.tsx** | Titolo otticamente centrato misurato a runtime, che poi sale e fa entrare il resto | codrops-sticky-grid-scroll | Basso (2 tween a tempo) | È la sezione più istituzionale: il gesto giusto è "mi presento, poi mi apro". La misura in percentuale sopravvive a ogni resize senza un handler di resize |
| 4 | **DomusDocProtocol.tsx** | Impulso a **lampo** `pow(sin, 10)` sul sigillo D.O.C. | aurelia | Nullo (1 custom property) | Il sigillo ha già l'animazione di `stroke-dashoffset`. Un lampo con duty cycle ~20% legge come "la luce lo prende", non come una notifica che pulsa |
| 5 | **Services.tsx** | Reveal per colonna a direzioni alternate, con stagger direzionato | codrops-sticky-grid-scroll | Basso (1 timeline) | La griglia smette di "apparire" e comincia a **comporsi**. Due finezze che nessuno implementa spontaneamente: colonne alternate sopra/sotto e `from: "end"/"start"` |
| 6 | **Services.tsx** | Bottone circolare a due archi (`stroke-dasharray`) sulle frecce delle card | era-residence | Nullo (SVG + 1 proprietà) | Le card hanno già una freccia dentro un cerchio statico. Sostituire il bordo con i due archi che si chiudono alza tutta la griglia con un delta di poche righe |
| 7 | **FeaturedTestimonial.tsx** | Maschera radiale sfrangiata (112% / 16%) al posto del clip-path rigido | r3f-image-reveal-effect | Medio (1 filtro SVG, **una istanza per pagina**) | Oggi il pannello foto apre con `MaskReveal from="right"`, bordo netto. La dissolvenza granulosa da camera oscura è coerente con carta/crema, e la vignettatura finale è voluta sulla card `rounded-[2rem]` |
| 8 | **FeaturedTestimonial.tsx** | Parallasse da puntatore a lente lunga, smorzamento critico + autopilota su touch | three-skull | Basso (`quickTo`, desktop) | Momento singolo e statico: due o tre piani che traslano di 5%/3% con bersaglio fisso danno profondità senza spostare nulla di leggibile. **Traslazione, mai tilt** |
| 9 | **Social.tsx** | Rail sticky + track orizzontale con gesto 1:1 (`HorizonScroller`) | era-residence | Alto (struttura) | È il parallax horizontal scroll richiesto. La macchina esiste già ed è collaudata: qui si scrive il contenuto, non il motore |
| 10 | **Social.tsx** | Guadagno di parallasse **monotono** per indice (`1 + i·0.05`) + gate sull'opacità | codrops-depth-gallery | Nullo (transform) | Il mosaico oggi alterna `speed={i % 2 ? 1 : -1}`: legge come zig-zag decorativo. Il guadagno monotono legge come profondità, che è ciò che impedisce al rail di sembrare un carrello |
| 11 | **Social.tsx** | Contro-zoom incrociato: entrante `1.10 → 1.00`, uscente `1.00 → 0.90` | Liquid Morphology Slideshow | Nullo (transform) | Quarto e ultimo strato del rail, sui due tile ai bordi del viewport. Da implementare **dopo** aver visto il rail con il punto 10: se legge già come profondità, si chiude la porta |
| 12 | **Social.tsx** | Eco tipografico statico a tre strati sul titolo "Seguici", aperto in scrub | IntroTrailEffect | Nullo (3 `<span>`) | Un'eco lungo l'asse del movimento, dentro la sezione che si muove in orizzontale: è l'unico posto dove quella firma ha un significato e non è un vezzo |

Nessun effetto compare due volte. I conflitti risolti in tabella: il titolo di OpenDomus prende il sipario (#1) e **non** l'eco a tre strati; la griglia di Services prende il reveal per colonna (#5) e **non** lo stagger quadratico di aurelia; il titolo di Social prende l'eco (#12) e **non** lo `stair` di `HorizonScroller` (due leggi sulle stesse righe si annullano a vicenda).

### 1.2 Trasversali (non consumano nessuna delle cinque sezioni)

Vivono sui **confini** fra le cinque, o sopra di esse. Li elenco separatamente perché non appartengono a una sezione e non vanno contati nel budget di ciascuna.

| # | Effetto | Reference | Dove | Perché |
|---|---|---|---|---|
| T1 | Flip del tono del chrome sulla **mezzeria del singolo elemento fisso** | era-residence | Header, logo, ThreadNav, Cursor, MobileActionBar | **È il buco vero.** ToneShift risolve il taglio nel contenuto; nulla oggi risolve il taglio nel chrome sovrapposto, che è la parte di schermo sempre ferma e sempre visibile |
| T2 | Grana statica anti-banding al 3.5-4% | aurelia (confermata da codrops-depth-gallery) | Overlay unico a livello di layout | paper `#fffdf8` → cream `#f2ebda` → cream-deep `#efe7d6` distano 3-13 valori per canale: un crossfade a schermo intero su un pannello 8 bit fa banding. È l'unica cosa che fa leggere il passaggio come materia |
| T3 | Anticipo del colore rispetto al contenuto + crossfade **senza ease** + gate anti-flicker | codrops-depth-gallery | Taratura di `ToneShift`, non componente nuovo | La reference è l'unica il cui tema è letteralmente il brief. Tre osservazioni da verificare a schermo su ToneShift, zero righe nuove |
| T4 | Sonda `100lvh/100lvw` per misurare il viewport | three-skull | `HorizonScroller`, `ManifestoPin`, ogni pin futuro | `window.innerHeight` oscilla quando la barra URL mobile entra ed esce: è la causa classica del salto nei pin. Otto righe, copia-incolla |

---

## 2. Scheda per reference

### 2.1 telescope-zoom — "Building a Layered Zoom Scroll Effect with GSAP" (Joffrey Sanchez / Codrops, 2025-10-29)

**Cartella**: `_refs/telescope-zoom/`
**Licenza**: nessun file `LICENSE` nella cartella. README e demo Codrops (i tutorial Codrops sono normalmente MIT, cfr. le altre cartelle). **Da noi non si copia un file**: si portano formule, quindi il punto è accademico — ma se un giorno si volesse copiare del codice testuale, va verificato l'upstream.

**Effetto in una riga**: sei copie della stessa foto ritagliate sulla silhouette del soggetto convergono tutte a `scale: 1` dentro una sezione pinnata, e la stratificazione svanisce.

**Tecnica esatta**
- Il "telescopio" è puro CSS: scale iniziali `1 / 0.85 / 0.6 / 0.45 / 0.3 / 0.15`, tween di convergenza `to(fronts, { scale: 1, duration: 1, ease: "power1.inOut", delay: .1 }, 0.6)` su una timeline lunga 2.2 → finestra 31.8% → 77.3% dello scroll pinnato.
- **Il pezzo che ci interessa** è il bus a custom property: `onUpdate: (self) => root.style.setProperty("--progress", gsap.parseEase("power1.inOut")(self.progress))` — una sola scrittura di stile per frame, N trasformazioni derivate in `calc()`. `power1.inOut` = `p<0.5 ? 2p² : 1-2(1-p)²`, applicata al progresso **grezzo** di ScrollTrigger.
- Il sipario del titolo, senza un solo tween: `.left { transform: translate3d(calc(var(--progress) * (-66vw + 100%) - 0.5vw), 0, 0) }` e `.right { transform: translate3d(calc(var(--progress) * (66vw - 100%)), 0, 0) }`. Il `100%` dentro il `calc` è la larghezza propria dello span.
- Sezione `height: 100vh; overflow: hidden`, `start: "top top"`, `end: "bottom top"`, `scrub: true`, `pin: true`.

**Sezione assegnata**: OpenDomus.tsx (effetti #1 e, come infrastruttura, il bus `--progress`).
**Perché**: il sipario apre su qualcosa, e OpenDomus ha già un poster video dietro il titolo. È anche l'unico modo di avere un reveal di titolo che non richiede SplitText (registrato localmente solo in `HorizonScroller` e `TextLines`, e va tenuto fuori dal chunk del layout).

**Piano di adattamento — cosa cambia**
- Corsa da `±66vw` a `±46vw`: le nostre sezioni sono incassate in `max-w-[1240px]`, non full-bleed. Su mobile il riferimento sale a `100vw`, noi restiamo a `60vw`.
- Colori e tipografia: Playfair a 3rem, ink `#1a1816` su paper `#fffdf8`.
- Dietro il sipario va il poster video, non la foto del granchio.
- La sezione **non** va pinnata: il bus si aggancia a uno ScrollTrigger scrubbato normale, senza `pin`.

**Piano di adattamento — cosa NON deve cambiare**
- Il `100%` dentro il `calc()`: è ciò che rende la formula indipendente dalla lunghezza della parola. Il sito è multilingua (`app/components/i18n/`), togliendolo si rompe alla prima traduzione lunga.
- L'ease `power1.inOut` applicata **al progresso grezzo**, non come `ease` del tween: è la curva che tiene il gesto morbido agli estremi.
- Il fatto che sia `calc()` puro: reduced-motion è gratis, basta non scrivere mai `--progress`.
- Una sola `setProperty` per frame. Se si finisce a scrivere due o tre variabili per frame, l'economia del pattern è persa e tanto vale usare tween normali.

**Esplicitamente scartato**: la transizione di colore attraverso il Segno Domus (sei pannelli mascherati concentrici). Era la resa più alta della reference, ma **ToneShift l'ha già fatta con l'arco** — e l'arco è il segno del sito (preloader, PageTransition). Un secondo linguaggio di cucitura sui medesimi confini non aggiunge vocabolario, aggiunge repaint. Scartato anche il fly-past a 10 miniature (registro da demo, non da agenzia immobiliare) e il focus pull su sei layer full-bleed sfocati **e** scalati insieme, che è un costo di compositing reale dopo due sprint sulle prestazioni.

---

### 2.2 Liquid Morphology Slideshow

**Cartella**: `_refs/Liquid-Morphology-Slideshow/` (due demo: `Liquid Morphology Slideshow/index.html` = morph fra slide; `index.html` alla radice = "WebGL Portfolio Grid").
**Licenza**: **nessuna.** Nessun `LICENSE`, nessun `README`, nessun `package.json`: solo due HTML con three.js r128 da CDN. Provenienza non dichiarata. Conseguenza operativa: **non si copia una riga**, si porta una coppia di coefficienti.

**Effetto in una riga**: crossfade fra due immagini a schermo intero, con le UV deformate da un rumore la cui ampiezza segue una campana.

**Tecnica esatta**
- Inviluppo: `dispIntensity = sin(progress * PI) * 0.2` — vale **esattamente 0** a `p=0` e `p=1`, massimo 0.2 a metà. È la ragione per cui il reset brutale `progress 1 → 0` non produce pop.
- **Il pezzo che ci interessa**, il contro-zoom incrociato: uscente `(uv - 0.5) * (1.0 - progress * 0.1) + 0.5`, entrante `(uv - 0.5) * (1.0 + (1.0 - progress) * 0.1) + 0.5`. L'uscente appare ingrandito di `1/0.9 = +11.1%`, l'entrante parte da un campo più largo (`-9.1%` apparente) e si assesta a neutro. Coefficiente identico `0.1`, direzioni opposte.
- Tween unico: `gsap.to(uniforms.progress, { value: 1, duration: 1.5, ease: "power2.inOut" })`.

**Sezione assegnata**: Social.tsx (effetto #11), agganciato come `containerAnimation` al rail.
**Perché**: due elementi che si scambiano il posto con scale opposte leggono come "uno se ne va in profondità, uno arriva" invece che come "due riquadri che scorrono". È esattamente ciò che serve perché lo scorrimento orizzontale non sembri un carrello. Non ha casa come *crossfade*: nessuna delle cinque sezioni fa uno swap A→B, e inventare un carosello per FeaturedTestimonial significherebbe inventare contenuto che la sezione non ha.

**Piano di adattamento — cosa cambia**
- `p` non è più il progresso di un morph ma il progresso orizzontale del rail.
- Non c'è nessuna UV: sono `scale` CSS su due tile, transform puro, GPU-safe.
- Le soglie di "entrante" e "uscente" diventano posizioni rispetto ai bordi del viewport, non indici di slide.

**Piano di adattamento — cosa NON deve cambiare**
- I due coefficienti: `0.1` in direzioni opposte, cioè `1.10 → 1.00` e `1.00 → 0.90`. Alzarli a 0.2 trasforma la profondità in un effetto.
- La simmetria: se una sola delle due metà si muove, la lettura crolla e resta un banale hover-zoom.

**Esplicitamente scartato**: tutto il resto, e non per limiti di stack. Il fragment shader contiene due calcoli morti (`strength`, `mixFactor`), un commento di lavoro lasciato nel sorgente, un aspect ratio hardcoded a `vec2(1920, 1080)`, un `setPixelRatio(devicePixelRatio)` non clampato e un vero bug di campionamento (`+ distortedPosition * 0.5`, che manda le UV a 1.5× con clamp-smear). Il gemello aggiunge un `updateProjectionMatrix()` mai chiamato, un lerp di smooth scroll dichiarato e mai usato e un ripple nel vertex shader che vale 0.15 px. Il warp a value-noise sull'immagine **il sito ce l'ha già in versione migliore** (`HoverDistort.tsx`: hash 2D invece dell'hash 1D che collide sulle diagonali, cover sulle dimensioni vere, dpr clampato, ticker che si ferma, `webglcontextlost` gestito). L'RGB shift è escluso per marca (frange ciano/rosse contro una palette dichiaratamente calda) e il `mix-blend-mode: difference` per contrasto: funziona su `#050505`, su cream distrugge la leggibilità e con essa i test axe in CI.

---

### 2.3 r3f-image-reveal-effect (Colin Demange / Codrops)

**Cartella**: `_refs/r3f-image-reveal-effect/`
**Licenza**: **MIT** — `Copyright (c) 2009 - 2024 Codrops`.

**Effetto in una riga**: un'immagine si rivela dietro una soglia radiale il cui bordo è sfrangiato da rumore di Perlin.

**Tecnica esatta**
Tutto l'effetto è **una** formula di alpha, e si risolve analiticamente in due numeri:

```
alpha = (1 - clamp(rumore + 12.5·d - 7·p, 0, 1)) · smoothstep(0, 0.7, p)
```

con `d = distance(vUv, 0.5)`, `p = uProgress`, rumore ≈ `[-1, 1]`.

- Il guadagno **12.5** fissa da solo la morbidezza del bordo: feather = `1/12.5 = 0.08 UV`. In un `radial-gradient(farthest-side ...)`, `d = 0.5` è il 100%, quindi la percentuale CSS è `200·d` → feather = **16%**.
- L'offset **7.0** fissa la velocità di crescita: `0.56 UV` per unità di progresso → **112%**.
- L'ampiezza del rumore ≈ ±1 fissa lo sfrangiamento: `±0.08 UV` → **±16%**.
- Il fade globale `smoothstep(0, 0.7, p)` satura al 70% della timeline: serve a impedire che grani isolati lampeggino a progresso basso.
- Ease della reference: `duration: 1.5`, `ease: "easeInOut"` di motion = `cubic-bezier(0.42, 0, 0.58, 1)`.

Traduzione CSS, 1:1:

```css
mask-image: radial-gradient(farthest-side ellipse at 50% 50%,
  #000 calc(var(--p) * 112%),
  transparent calc(var(--p) * 112% + 16%));
```

**Sezione assegnata**: FeaturedTestimonial.tsx (effetto #7).
**Perché**: oggi il pannello foto apre con `MaskReveal from="right"`, cioè un clip-path a bordo rigido, dentro un `Parallax speed={0.12} scale={1.12}`. Sostituire il bordo rigido con la dissolvenza radiale rumorosa dà il look della reference su una foto grande, con **una sola istanza per pagina** — che è il vincolo che `LiquidReveal.tsx` si è già dato. La maschera non deve sapere nulla dei colori, quindi non si rompe se il tono della card cambia.

**Piano di adattamento — cosa cambia**
- Il driver: la reference ha tre bottoni e un rAF sempre acceso; da noi è uno ScrollTrigger scrubbato che scrive `--p`. Nessun nostro ticker.
- Lo sfrangiamento riusa il filtro **già in casa** (`LiquidReveal.tsx`: `feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7"` + `feDisplacementMap scale="70"`), alzando `scale` verso ~140 e `baseFrequency` verso ~0.03 per avvicinarsi al ±16% dell'originale. Solo desktop: il repaint del filtro a ogni tick costa, ed è una nota che il repo si è già scritta da solo.
- Vignettatura: a `p = 1` il raggio opaco arriva a 0.48–0.64 UV mentre gli angoli stanno a 0.7071 — **la foto non si rivela mai intera**, lo stato finale è un ovale. Sulla card `rounded-[2rem]` con il suo `bg-gradient-to-l from-ink/30` è voluto. Se il cliente si aspetta il rettangolo pieno, l'offset va da 7.0 a ~9.5 (cioè 112% → 152%).
- Reduced-motion: `--p: 1` fisso, filtro spento.

**Piano di adattamento — cosa NON deve cambiare**
- Il **rapporto** fra i due numeri: 112% di crescita contro 16% di feather. È quello a fare la differenza fra "dissolvenza da camera oscura" e "cerchio sfumato".
- Il fade globale che satura al 70%: senza, a progresso basso si vedono grani isolati accendersi.
- Il fatto che sia **maschera** e non velo colorato. Su una card `bg-cream` dentro una sezione `bg-paper`, il velo colorato è la soluzione sbagliata (dovresti indovinare quale dei due colori usare).

**Esplicitamente scartato**: l'onda 3D del vertex shader (deformazione per-vertice su griglia 32×32; il surrogato 2D sarebbe `filter: url(#displace)` con `scale` animata a ogni tick, che il progetto ha già accertato essere troppo). È anche il pezzo che **nella reference si vede meno**: l'inviluppo `(1 - uProgress)` la spegne proprio mentre `smoothstep(0, 0.7, p)` accende l'opacità — l'onda è al massimo quando l'immagine è quasi invisibile. Scartato `CoverUV`: sono 14 righe di GLSL che replicano `object-fit: cover`, già fatto ovunque da `next/image`.

---

### 2.4 threjs-metaballs-carousel (Anton Bobrov)

**Cartella**: `_refs/threjs-metaballs-carousel/`
**Licenza**: **nessuna.** Nessun `LICENSE`, `package.json` senza campo `license`.

Vedi **§3. Senza casa**.

---

### 2.5 three-skull — "Skeleton Fluid Reveal" (Cullen Webber / Codrops)

**Cartella**: `_refs/three-skull/`
**Licenza**: il README dichiara `MIT (LICENSE)` ma **il file `LICENSE` non è presente nella cartella**. Da noi si portano tre costanti e otto righe di misura, non codice.

**Effetto in una riga**: due scene (corpo e scheletro) renderizzate separatamente e mixate in screen-space da una maschera fluida pilotata dal mouse — una radiografia.

**Tecnica esatta (della parte che entra)**
- `CameraRig`: la camera orbita attorno a un punto **fisso** (`camera.lookAt(this.lookAt)` a ogni frame), quindi è pura traslazione, non rotazione dello sguardo.
  `targetPos.x = lookAt.x + (basePos.x - lookAt.x)·zoom + pointerX·0.125`, `targetPos.y = … + pointerY·0.075`, con `basePos = (1.5, 1.5, 0.55)` e `lookAt = (-0.52, 0.45, -0.45)` → distanza di dolly ≈ **2.48**. Le ampiezze sono quindi **5% e 3%** della profondità della scena.
- Smorzamento: `easing.damp3` di maath, cioè la SmoothDamp di Unity — molla in smorzamento critico, nessun overshoot, ma inerzia vera. `smoothTime = 0.25` → `omega = 2/0.25 = 8`; `t = 1/(1 + x + 0.48x² + 0.235x³)` con `x = omega·delta`. A 60 fps `x = 0.1333`, `t ≈ 0.8829` (≈11.7% della distanza residua per frame), ma il termine cubico garantisce lo stesso tempo di assestamento a 30 e a 120 Hz.
- `fov 17°`: un teleobiettivo che comprime la prospettiva. È **la** ragione per cui un offset del 5% legge come parallasse ampia.
- Autopilota quando il puntatore non esiste (`matchMedia("(pointer: coarse)").matches || "ontouchstart" in window`): `t += delta·0.5; px = sin(t); py = sin(0.7t)·0.5`. Periodi reali: X **12.57 s**, Y **17.9 s** — il rapporto 0.7 fa sì che la curva non si richiuda in modo percepibile, quindi non legge come loop.
- Sonda del viewport: un `div` `position:absolute; visibility:hidden; height:100lvh; width:100lvw`, si leggono `offsetWidth`/`offsetHeight`, si rimuove. Misura il *large viewport* delegando al motore CSS, quindi non oscilla con la barra URL mobile.

**Sezione assegnata**: FeaturedTestimonial.tsx (effetto #8) + trasversale T4.
**Perché**: è l'unico momento singolo e statico della home — un ritratto e una citazione. Due o tre piani (fondo, ritratto, decorazione) che traslano con coefficienti diversi aggiungono profondità senza spostare nulla di leggibile e senza ScrollTrigger aggiuntivi. Su sezioni con griglie (Services, Social) farebbe ballare troppi elementi.

**Piano di adattamento — cosa cambia**
- Niente camera, niente `perspective`, niente `rotate`: solo `x`/`y` su due o tre layer. Fondo `x: px·-14, y: py·-8`; ritratto `x: px·6, y: py·3`; **la citazione resta ferma**.
- `gsap.quickTo(el, "x", { duration: 0.25, ease: "power3" })` copre il 90% del caso. Per parità esatta con la SmoothDamp si implementa la formula in un `gsap.ticker.add`.
- Gate: `mm.add(MQ.motionOk, ...)` e solo desktop. `Magnetic.tsx` esiste già come precedente di smorzamento su puntatore: la primitiva nuova è "parallasse di sezione", non "follow del cursore".

**Piano di adattamento — cosa NON deve cambiare**
- **Nessun tilt.** Il bersaglio dello sguardo è fisso nell'originale, e su una testimonianza una foto che si inclina sotto il mouse perde autorevolezza. Traslazione e basta.
- Le ampiezze microscopiche: 5% e 3%, non 15% e 10%. È la lente lunga a fare il lavoro, e senza la lente resta solo la nausea.
- `smoothTime 0.25` e il rapporto Y/X = 0.7 dell'autopilota, con Y dimezzata. Sono tarature di qualcuno che ci ha lavorato: 12.6 s di periodo è abbastanza lento da non essere notato come animazione.
- Sotto reduced-motion la deriva va **spenta**, non rallentata.

**Esplicitamente scartato**: il reveal a radiografia, cioè il 70% di ciò che si vede nella demo. Quattro ragioni che si sommano: (1) il modulo si chiama `FluidSim.js` ed è una propagazione a inchiostro pilotata dal mouse — è **precisamente** la famiglia esclusa dal cliente; (2) il compositing x-ray mixa due render completi della stessa scena da un'unica camera: senza three.js resterebbe un crossfade fra due JPG allineati a mano, cioè un'approssimazione povera; (3) due render pass interi + bloom + uno step FBO a 5 tap per pixel a DPR 2, in diretta contraddizione col lavoro sulle prestazioni degli ultimi commit; (4) **la reference non parla di scroll**: zero occorrenze di `scroll`, `wheel`, `IntersectionObserver`, GSAP o Lenis in tutto `src/`. Scartate anche le scan lines (199 righe fisse su un immobiliare in crema e Playfair è una contraddizione di registro) e la grana all'1.5% (invisibile su `#f2ebda`; alzarla significherebbe sporcare le foto degli immobili). **Da non copiare insieme al resto**: i buchi nel resize della reference — la canvas di `MouseTrail` non viene mai ridimensionata, `aspectVec` è congelato al costruttore, `isMobile`/`isTouch` non sono mai rivalutati.

---

### 2.6 aurelia (holtsetio) — medusa procedurale WebGPU

**Cartella**: `_refs/aurelia/`
**Licenza**: **MIT** — `Copyright (c) 2025 Holtsetio`.

**Effetto in una riga**: dieci meduse procedurali che nuotano in un volume d'acqua con godray, plancton, caustiche e bloom selettivo, tutto generato in shader.

**Tecnica esatta (delle parti che entrano)**

*Godray (effetto #2).* La scoperta utile: il materiale è `MeshBasicNodeMaterial({ color: 0x000000, opacity: 0.05, transparent: true, depthWrite: false })` — **sono coni d'ombra, non fasci luminosi**, disegnati con `renderOrder = -1` prima di tutto. L'opacità fa tutto il lavoro:

```
normalFactor = |sin(azimuth)|²
offsetFactor = (1 - offset) · smoothstep(0.00, 0.04, offset)
opacity      = normalFactor · offsetFactor · fog · 0.33
```

Cioè: nulla al bordo, **picco al 4%**, decadimento lineare fino a zero, più un fade laterale quadratico. Estrusione 20 unità lungo `lightDir = (0,-1,0)`, silhouette allargata del 50% su xz.

*Lampo (effetto #4).* `emissiveness = red · (1 - value.y) · pow(sin(phase + positionLocal.y) · 0.5 + 0.5, 10) · 2`, più una base `0.105`. L'**esponente 10** produce un duty cycle ~20%: buio per l'80% del ciclo, poi un colpo netto. Il `+ positionLocal.y` dentro il seno fa **viaggiare** il lampo lungo l'oggetto. Ciclo di 5 s (`time · 0.2 mod 1`).

*Dither (trasversale T2).* `dither = hash23(screenUV) - 0.5, × 1/255` sommato prima dell'uscita, con `hash23` classico (`12.9898 / 78.233 / 43758.5453`). Nella reference esiste per un solo motivo: un gradiente enorme e scurissimo su schermo a 8 bit farebbe bande orizzontali visibilissime.

**Sezioni assegnate**: OpenDomus.tsx (#2), DomusDocProtocol.tsx (#4), trasversale T2.

**Piano di adattamento — cosa cambia**
- *Godray*: il colore si ribalta. Su paper `#fffdf8` sono velature d'ombra espresso a bassissima alpha: `linear-gradient(to bottom, transparent 0%, rgba(28,21,18,0.055) 4%, rgba(28,21,18,0.033) 55%, transparent 100%)`, `rotate(-8deg) skewX(6deg)`, `mix-blend-mode: multiply`, più un `mask-image` orizzontale per il fade laterale. Il moltiplicatore finale scende da **0.33 a ~0.055**: la reference lavora su fondo nero. Due o tre fasci, non N.
- *Lampo*: `filter: brightness(calc(1 + var(--flash) * 0.35))` invece del guadagno ×2. `--flash` scritta in un `onUpdate` lineare: `Math.pow(Math.sin(t * Math.PI * 2) * 0.5 + 0.5, 10)`. In pausa fuori viewport, spento in reduced-motion.
- *Dither*: overlay `fixed inset-0 pointer-events-none`, `opacity: 0.035`, `mix-blend-mode: overlay`, background = data-URI SVG `feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1"` + `feColorMatrix saturate 0`, `background-size: 180px`. Una volta a livello di layout, mai per sezione.

**Piano di adattamento — cosa NON deve cambiare**
- *Godray*: il profilo degli stop. Il picco al **4%** e il decadimento lineare non sono estetica, sono `(1-o)·smoothstep(0, 0.04, o)`. Un gradiente a stop equispaziati dà un bordo visibile. E resta un'**ombra**: se diventa un fascio additivo, è un altro effetto.
- *Lampo*: l'esponente **10**. Con 4 o 6 il lampo diventa un respiro e l'effetto muore. Ciclo 5 s, base 0.105, e l'offset di fase proporzionale alla Y — è quello a far viaggiare la luce invece di farla lampeggiare tutta insieme.
- *Dither*: **statico**. Nel fragment della reference il seed non contiene `uTime`, quindi la grana non sfarfalla. Un tile fisso costa zero per frame; animarlo costerebbe un repaint a schermo intero per niente.

**Esplicitamente scartato**
- *Caustiche procedurali*: doppiamente fuori. Richiedono un environment node PBR, e ricadono nella famiglia water/ripple esclusa per direttiva.
- *Fisica verlet* di campana, tentacoli e bracci orali: ~25.000 vertici e decine di migliaia di molle integrati **360 volte al secondo** su compute shader. In JS singolo thread sono 3-4 ordini di grandezza di troppo, e ridotta a una catenella di 30 punti comunicherebbe "un tentacolo che ondeggia", che su un sito immobiliare non significa nulla. Il sito ha già `ThreadNav` e `DrawOnScroll` per il moto vivo su un filo.
- *Campo di plancton in Canvas2D*: **portabile davvero** (la profondità è finta: posizione da hash puro dell'indice più due `smoothstep` di fog) e sarebbe finito su FeaturedTestimonial come pulviscolo nella luce. Scartato lo stesso: quella sezione prende già la maschera radiale con filtro SVG e la parallasse da puntatore; aggiungere un canvas con rAF e 100+ particelle è il conto sbagliato subito dopo due sprint di prestazioni. Se un giorno rientra, va con densità legata all'**area** e non al volume e DPR clampato a 2 — l'originale non lo clampa, ed è il suo unico difetto serio.
- *Stagger a ritardo quadratico* (`modifiedPhase -= zenith² · 0.95`): idea eccellente — il ritardo che cresce col quadrato della distanza legge come un'onda che attraversa la materia invece che come una lista che si accende. Scartata **per conflitto**: la griglia di Services prende il reveal per colonna (§2.7), e due leggi di stagger sullo stesso elemento si annullano.
- *Bloom selettivo via MRT*, *wrap toroidale* (incompatibile con un rail a lunghezza finita, dove l'altezza della sezione **è** la larghezza del track), *accumulatore "charge"* (`Magnetic.tsx` copre già la nicchia del puntatore).

---

### 2.7 codrops-sticky-grid-scroll (Théo Plawinski / Codrops)

**Cartella**: `reverse-engineering/codrops-sticky-grid-scroll/`
**Licenza**: **MIT** — `Copyright (c) 2025 Théo Plawinski` + `Copyright (c) 2009 - 2025 Codrops`.

**Effetto in una riga**: una griglia di 12 immagini vola dentro da fuori schermo, poi zooma e si apre a sipario su un titolo.

**Tecnica esatta (delle parti che entrano)**

*Centratura ottica misurata a runtime (effetto #3).*
```js
const dy = (content.offsetHeight - title.offsetHeight) / 2;
const titleOffsetY = (dy / content.offsetHeight) * 100;
gsap.set(title, { yPercent: titleOffsetY });
```
Il titolo vive in un flex column che contiene anche descrizione e bottone: da solo **non** è al centro ottico. L'offset non è hardcodato, è misurato e convertito in **percentuale dell'altezza del contenitore** — per questo resta valido a ogni resize senza un solo handler di resize (l'intera reference non ne ha).

Poi il toggle, che è la parte concettualmente più interessante: dentro una timeline **scrubbata** viene inserito un callback che legge la direzione e lancia una timeline **a tempo**:
```js
.add(() => this.toggleContent(timeline.scrollTrigger.direction === 1), "-=0.32")
```
```js
gsap.timeline({ defaults: { overwrite: true } })
  .to(title, { yPercent: isVisible ? 0 : titleOffsetY, duration: 0.7, ease: "power2.inOut" })
  .to([description, button], {
      opacity: isVisible ? 1 : 0, duration: 0.4,
      ease: `power1.${isVisible ? "inOut" : "out"}`,
      pointerEvents: isVisible ? "all" : "none" },
      isVisible ? "-=90%" : "<");
```

*Reveal per colonna (effetto #5).*
```js
this.columns[index % 3].push(item);          // il DOM è row-major, quindi i%3 = colonna visiva
const fromTop = colIndex % 2 === 0;
timeline.from(column, {
  y: dy * (fromTop ? -1 : 1),
  stagger: { each: 0.06, from: fromTop ? "end" : "start" },
  ease: "power1.inOut"
}, "grid-reveal");                            // tutte e tre sullo stesso label
```
con `dy = wh - (wh - grid.offsetHeight)/2` = la distanza minima esatta per portare una colonna completamente fuori viewport partendo dal centro (1048 px a 1080/1016).

**Sezioni assegnate**: DomusDocProtocol.tsx (#3), Services.tsx (#5).
**Perché**: il protocollo è la sezione più istituzionale della home e il gesto giusto è quello di una sezione che si presenta e poi si apre. La griglia dei servizi è l'unica griglia vera fra le cinque, e le due finezze del reveal (colonne alternate + `from: "end"/"start"`) sono ciò che distingue una griglia che *appare* da una che si *compone*.

**Piano di adattamento — cosa cambia**
- Le misure vanno prese **dopo `document.fonts.ready`**: il titolo è Playfair. È la stessa cosa che `ReviewsWall.tsx` ha già dovuto fare.
- `dy` va ridotto: la corsa piena (fuori viewport) è giusta per un set piece a schermo intero, per una griglia di card in flusso va a ~1.5× l'altezza card, altrimenti le card arrivano da troppo lontano e il gesto diventa lento.
- Contenuti, colori, numero di colonne.

**Piano di adattamento — cosa NON deve cambiare**
- La **percentuale** invece dei px in `yPercent`: è la ragione per cui non serve un resize handler.
- L'alternanza sopra/sotto per colonna e lo stagger direzionato `from: "end"` per chi scende, `"start"` per chi sale — l'item che ha meno strada parte per primo, così l'onda arriva ordinata invece che a caso.
- `each: 0.06`, e **tutte le colonne sullo stesso label**: partono in sincrono, non a cascata. Metterle a cascata trasforma un fronte intrecciato in tre code.
- L'asimmetria entrata/uscita del toggle: `"-=90%"` (relativo alla durata del tween precedente) e `power1.inOut` aprendo, `"<"` e `power1.out` chiudendo. Uscire deve essere più secco che entrare — è quello a far sembrare il gesto scritto a mano.
- `overwrite: true`. Non è opzionale: lo scrub può riattraversare il punto in entrambi i sensi e senza quello i tween si accavallano.

**Esplicitamente scartato**: lo zoom `scale: 2.05` con apertura a sipario a tre vie. Non per limiti tecnici — **vive già in `ReviewsWall.tsx`**, che è il porting integrale di questa reference (verificato valore per valore: `dy`, stagger 0.06, scale 2.05, `xPercent ±40`, `yPercent ±40`, overlap `-0.6` e `-0.32`, toggle direzionale, `start "top 25%"`/`"top 57%"`, uncover `yPercent -100`). È il momento più alto della home e ripeterlo su una seconda sezione non raddoppierebbe l'effetto: lo dimezzerebbe. Scartato anche l'**uncover parallax** del wrapper sticky (`yPercent: -100`, scrub, `top bottom → top top`): sarebbe stato *il* prestito per i confini di colore, ma ToneShift è in produzione e cinque nuovi wrapper sticky significano cinque nuovi contesti di stacking e cinque possibili rimisure sbagliate a valle (`ThreadNav` compreso). Scartato il fake progress: la reference *non* contiene scroll orizzontale, e chi cercasse qui la macchina per Social troverebbe la cosa sbagliata — l'unico movimento su X è un'apertura a sipario di ±40%.

---

### 2.8 codrops-depth-gallery — "Atmospheric Depth Gallery" (Houmahani Kane / Codrops)

**Cartelle**: `reverse-engineering/codrops-depth-gallery/` (sorgente) e `reverse-engineering/DepthGallery/` (build di distribuzione dello stesso commit — stesso progetto, due copie).
**Licenza**: **MIT** — `Copyright (c) 2009 - 2025 Codrops` (nel sorgente; la cartella `DepthGallery` è solo la build, senza file di licenza).

**Effetto in una riga**: cinque quad con una foto disposti in profondità, attraversati da una camera che si muove **solo** in Z, con il colore di fondo che fa crossfade fra cinque "mood".

**Tecnica esatta**
Il 3D qui non fa quasi nulla: `MeshBasicMaterial`, nessuna luce, nessun postprocessing, nessuna rotazione. Ciò che conta è la legge dei confini.

*Crossfade a due soli stati.*
```js
a = clamp((firstPlaneZ - sampledCameraZ) / planeGap, 0, lastIndex);
current = Math.floor(a); next = min(current + 1, last); blend = a - current;
// opacità: (i === current) ? 1 - blend : 0 ; poi max con blend se i === next
opacity = lerp(opacityCorrente, target, 0.14);
```
Rampa triangolare `1-b / b` su due soli elementi, **nessun easing**, più uno smorzamento che toglie ogni spigolo al cambio di indice.

*Anticipo del colore (T3).* `getMoodBlendData` è la **stessa** matematica campionata su un punto diverso: `moodSampleZ = cameraZ - planeGap · moodSampleOffset` con `moodSampleOffset = 1`. Il fondo prende i colori del piano successivo **un gap intero prima** che l'immagine arrivi. È il trucco anti-taglio: l'occhio legge il nuovo colore prima del nuovo contenuto.

*Gate anti-flicker (T3).*
```js
distanceFromBlendCenter = |blend - 0.5| · 2;
transitionStability = smoothstep(distanceFromBlendCenter, 0.35, 1);
stabilizedVelocityIntensity = velocityIntensity · transitionStability;
```
Quando `blend` è vicino a 0.5 — esattamente in mezzo a un incrocio — ogni reattività alla velocità viene azzerata. È l'unica riga della reference che esiste solo per **non** far vedere qualcosa.

*Guadagno di profondità (effetto #10).* `depthInfluence = 1 + index · 0.05`; `parallaxInfluence = opacity · depthInfluence`; ampiezze `0.16` su X e `0.08` su Y, pointer inseguito a `0.08`. Il gate sull'opacità è il dettaglio che conta: **un elemento invisibile non si muove**, quindi durante una dissolvenza non si vedono mai fantasmi che scivolano.

**Sezioni assegnate**: Social.tsx (#10) + trasversale T3.
**Perché**: il mosaico oggi alterna `speed={i % 2 === 1 ? 1 : -1}` con `range={12}`, che legge come zig-zag decorativo. La legge monotona legge come profondità — ed è esattamente ciò che serve al rail per non sembrare un carrello. E T3 è la sola cosa in tutte e dieci le reference che parla direttamente della taratura di ToneShift.

**Piano di adattamento — cosa cambia**
- L'asse: da Y (parallasse verticale attuale) a X aggiuntivo, contrapposto al movimento del track, agganciato con `containerAnimation`.
- Il numero di piani: sei tile invece di cinque quad.
- Per T3: nessun componente nuovo. Si verifica su ToneShift (oggi `start: "top 96%"`, `end: "bottom 45%"`, `scrub: 0.4`, due atti 0.62 / 0.38) che il colore in arrivo sia già a schermo **prima** che l'occhio raggiunga il contenuto nuovo, e si valuta a schermo se il gate anti-flicker serve dove `VelocityMarquee` attraversa un confine.

**Piano di adattamento — cosa NON deve cambiare**
- La **monotonia**: mai alternanza. `1 + i·0.05` in una sola direzione, sempre.
- Il **gate sull'opacità** sulla parallasse. È la differenza fra un crossfade pulito e due fantasmi che scivolano uno sull'altro.
- Per T3: il crossfade resta **lineare, senza ease**. L'istinto è metterci un `power2.inOut`: sarebbe l'errore, è proprio l'assenza di curva a togliere il taglio percepito. Il tempo lo deve dare il gesto.
- Per T3: l'anticipo è di **un'unità intera** di transizione, non di un pelo.

**Due trappole da mettere nel piano prima di scrivere codice**
1. **Interpolare i colori in OKLCH, non in sRGB.** three.js lerpava in linear-sRGB apposta; `gsap.utils.interpolate` su hex fa sRGB, e cream `#f2ebda` → espresso `#1c1512` diventa un marrone fangoso a metà strada.
2. Tutti i coefficienti di smoothing della reference (`0.08`, `0.12`, `0.14`, `0.10`, `0.05`) sono **per-frame senza delta**: su 120 Hz vanno al doppio della velocità. Conversione a durate GSAP (τ = −1/(60·ln(1−k))): `0.14 → 0.11 s`, `0.12 → 0.13 s`, `0.10 → 0.16 s`, `0.08 → 0.20 s`, `0.05 → 0.33 s`. Curiosità: three esporta `MathUtils.damp` che fa esattamente la correzione, e la demo non lo usa.

**Esplicitamente scartato**: il trail serpentino 3D con particelle sulla testa (tubo tapered ricostruito da zero a ogni frame — fino a 220 punti × 9 vertici per anello, `computeVertexNormals` a ogni `addPoint`, additive blending). L'unica cosa recuperabile sarebbe il **percorso**, che è un Lissajous (`x = sin(p·2π·1.85)·W`, `y = sin(p·2π·2.1)·A`) riproducibile come `<path>` SVG con `stroke-dashoffset` scrubbato — ma il sito ha già il filo rosso (`ThreadNav`, `DrawOnScroll`) e un secondo filo è rumore. Scartata la pila di piani in Z con CSS 3D: `preserve-3d` dentro `position: fixed` ci ha già morso sullo stacking `main`/footer-uncover, e `scale`+`opacity` su due elementi danno il 95% della lettura col 5% del rischio. **Da non copiare**: `setPixelRatio(min(dPR, 2))` chiamato solo nel costruttore e mai in `resize()`, e il resize senza debounce.

---

### 2.9 IntroTrailEffect — "Intro Image Trail Animation" (Codrops)

**Cartella**: `reverse-engineering/IntroTrailEffect/`
**Licenza**: **MIT** — `Copyright (c) 2009 - 2021 Codrops` (confermata anche da `"license": "MIT"` in `package.json`).

**Effetto in una riga**: un'immagine e due titoli volano dal bordo al centro lasciandosi dietro una scia, che non è una scia ma N cloni impilati con stagger negativo.

**Tecnica esatta**
Niente 3D, niente canvas: verificato sui bundle buildati (`getContext`, `WebGLRenderer`, `gl_FragColor`, `devicePixelRatio` = 0 occorrenze; l'unico `requestAnimationFrame` è il ticker di GSAP).

- La sovrapposizione è CSS grid pura: `.trail { display: grid; place-items: center }` e `.trail__img, .trail__text { grid-area: 1 / 1 / 2 / 2 }` — tutti i figli nella stessa cella, senza `position: absolute`, quindi si auto-allineano e si auto-dimensionano.
- La scia nasce **solo** dallo stagger negativo (`-0.03` sul Flip dell'immagine, `-0.1` e `-0.08` sui titoli): con `each` negativo GSAP ribalta la distribuzione e inverte l'ease, quindi l'ultimo figlio (opacity 1) parte per primo e i fantasmi restano indietro lungo il percorso.
- Opacità immagini, formula secca: `i === total-1 ? 1 : 0.8`. Opacità testi, graduata: `1/total · i + 1/total`.
- **Il pezzo che entra** è il logo, cioè la stessa idea congelata e in CSS puro: tre `<span>` con lo stesso glifo nella stessa cella, i primi due `aria-hidden="true"`. Con `.show`: `opacity 0.1 / 0.3 / 1` e `translateX 0 / 50% / 100%`, `transition: all ease-out 0.5s`. Gli offset sono **percentuali della larghezza del glifo**, quindi si auto-scalano col font-size.

**Sezione assegnata**: Social.tsx (effetto #12).
**Perché**: un'eco lungo l'asse del movimento, dentro l'unica sezione che si muove in orizzontale. È il miglior rapporto resa/rischio della reference: tre `<span>`, nessuna immagine, nessun layer promosso, nessun impatto su LCP.

**Piano di adattamento — cosa cambia**
- Il trigger: non una classe con `transition`, ma uno ScrollTrigger scrubbato (o `containerAnimation` sul rail) che apre l'offset man mano che il pannello scorre.
- L'ampiezza: **20-30% invece di 100%**. Il demo è un portfolio urlato, noi vendiamo case.
- Colori: wine `#2a100f` / espresso `#1c1512` su cream, Playfair.

**Piano di adattamento — cosa NON deve cambiare**
- L'offset in **percentuale**, non in px: si auto-scala col `font-size` e regge il clamp responsive senza ricalcoli.
- `aria-hidden="true"` sui due strati fantasma: lo screen reader deve leggere il titolo **una volta sola**. Il riferimento lo fa correttamente ed è un dettaglio da non perdere.
- La scala di opacità 0.1 / 0.3 / 1: non lineare, ed è quella a dare la sensazione di eco che si spegne.

**Esplicitamente scartato — la scia a cloni di immagini.** È l'effetto principale della reference e va detto perché non entra, visto che *sarebbe* portabile. Primo, la traduzione obbligatoria: lo stagger negativo è un ritardo **temporale** che esiste solo dentro una timeline a durata fissa; in scrub il tempo lo detta lo scroll, quindi lo stagger non produce alcun ritardo e chi lo copia com'è ottiene tre immagini perfettamente sovrapposte e nessuna scia. Andrebbe riscritto come ritardo **persistente** (fantasmi che inseguono la stessa `x` con lerp a coefficienti decrescenti, `0.14 / 0.09 / 0.055`). Secondo, il conto: la reference si permette 8 cloni perché anima un elemento **una volta sola** e poi li **distrugge** in `reset()`; su un rail scrubbato con sei tile la stessa generosità significa fino a 18 layer compositor promossi in permanenza, e servirebbe un teardown legato alla velocità. Su una sezione che ha già rail + guadagno di profondità + contro-zoom, è il quarto strato di troppo. Scartati anche: tutta la coreografia intro → Enter → content (presuppone `html, body { overflow: hidden }`, cioè l'opposto dello scroll continuo); il fake progress `steps(14)`, che è **deliberatamente finto e slegato dal caricamento reale** e reintrodurrebbe 2.2 s di attesa fabbricata subito dopo due commit spesi a toglierla; il `rotateY: 160` sui titoli, perché su Playfair grande e fondo cream la rasterizzazione obliqua si vede — e l'autore stesso non ci credeva (al titolo basso la `perspective` non l'ha nemmeno passata, e sull'immagine ha lasciato `//rotateY: 360` commentato).

---

### 2.10 era-residence (era-residence.com)

**Cartella**: `reverse-engineering/era-residence/`
**Licenza**: **nessuna** — è un sito live scaricato. Il README della cartella mette già il paletto giusto: si replica la **tecnica** (codice, timing, struttura), che non è protetta da copyright; **immagini, testi, file Lottie del logo e font sono asset proprietari ERA/TFTL** e non vanno pubblicati. Nessun asset di questa cartella entra nel sito.

**Effetto in una riga**: uno scroll continuo dove ogni confine è un evento — una cupola che sale, un tuffo, un rail orizzontale — e nessuna sezione "comincia".

**Tecnica esatta (delle parti che entrano)**

*Rail orizzontale (effetto #9).*
```js
const t = track.scrollWidth - area.offsetWidth;
area.style.height = `${track.scrollWidth}px`;   // corsa VERTICALE = larghezza del track
const r = gsap.to(track, { x: -t, ease: "horScroll",
  scrollTrigger: { trigger: area, start: "2.5% top", end: "97.5% bottom", scrub: .25 } });
area._horizontalTween = r;                      // riusato come containerAnimation
```
Tre dettagli: (a) l'altezza in px pari alla larghezza del track tiene il gesto **1:1** col contenuto; (b) le soglie 2.5%/97.5% sono 5% di zona morta — il pannello resta immobile un battito prima di partire, senza cui il pin si legge come uno scatto; (c) `ease: "horScroll"` = `CustomEase("0.25,0,0.75,1")`, la traslazione **non** è lineare rispetto allo scroll. Reveal interni: `clipPath: inset(0% 100% 0% 0%) → inset(0)`, `duration: 2·1.2 = 2.4 s`, `delay: 0.8 s`, `ease: "Out" (0.25,1,0.5,1)`, `once: true`, `start: "left bottom"` via `containerAnimation`.

*Bottone a due archi (effetto #6).*
```js
const C = 2 * Math.PI * 103.5;                  // 650.336
gsap.set(arcs, { strokeDasharray: `${0.0417 * C} ${C}` });   // 27.119 650.336
const tl = gsap.timeline({ paused: true })
  .to(arcs, { strokeDasharray: `${C / 2} ${C}`, duration: 0.8, ease: "InOut" });
```
Due `<circle>` a 180° l'uno dall'altro (`rotate(-150 104 104)` e `rotate(30 104 104)`): ciascuno cresce dal 4.17% al 50% della circonferenza, insieme chiudono il cerchio.

*Flip del tono del chrome (T1).*
```js
const n = chrome.getBoundingClientRect();
if (n.left + n.width/2 < sez.left || n.left + n.width/2 > sez.right) return;  // filtro a colonne
ScrollTrigger.create({
  trigger: sezione,
  start: () => `top top+=${n.top + n.height / 2}`,
  end:   () => `bottom top+=${n.top + n.height / 2}`,
  onEnter: apply, onEnterBack: apply,
});
```
Non uno ScrollTrigger per sezione, ma uno per **ogni coppia** (sezione × elemento di chrome). E la soglia non è il bordo del viewport: è la **mezzeria di quello specifico elemento**. Il logo cambia colore quando il confine gli passa per il centro, non un pixel prima. Con tre elementi fissi a tre altezze si ottengono tre soglie sfalsate. Il resto è CSS: `transition: color .52s ease`.

**Sezioni assegnate**: Social.tsx (#9), Services.tsx (#6), trasversale T1.
**Perché Social**: la macchina esiste già (`HorizonScroller.tsx` è il porting fedele: stessa ease `dtHorScroll`, stesse soglie, stesso `scrub: 0.25`, `containerAnimation` esposto). Social ha già contenuto a griglia — sei immagini più CTA — che in verticale è una griglia qualunque e in orizzontale diventa un passaggio.
**Perché T1**: è il buco vero. ToneShift risolve il taglio **nel** contenuto; nulla risolve il taglio **nel** chrome sovrapposto, che è la parte di schermo sempre ferma e sempre visibile. Con l'arco che porta il colore nuovo dal basso e l'header che resta della tinta vecchia finché non lo si nota, il taglio che il cliente vuole eliminare sopravvive lì.

**Piano di adattamento — cosa cambia**
- *Rail*: tre pannelli (pitch + canali / mosaico / feed + CTA), `refreshKey={locale}`, `padding-right: 0` sul container desktop così il track esce davvero dal bordo, etichetta italiana al posto di "Drag to see more". Fallback sotto 1024px e reduced-motion: la griglia attuale, statica e completa.
- *Bottone*: raggio riscalato sul nostro (il dash va ricalcolato come `0.0417 · 2πr`, non copiato in valore assoluto), `currentColor` sugli archi vivi e `--color-line` sul cerchio morto — così eredita il tono della sezione e si integra con T1. **Va aggiunto `focus`/`blur` accanto a `mouseenter`/`mouseleave`**: il riferimento non lo fa, ed è un buco di accessibilità da non importare.
- *T1*: `data-bg` derivato dalla classe che le sezioni hanno già (`bg-paper` → `paper`, `bg-cream-deep`, `bg-cream`), `data-tone-target` su header, logo, ThreadNav, Cursor, MobileActionBar.

**Piano di adattamento — cosa NON deve cambiare**
- *Rail*: altezza = `track.scrollWidth`. È quello a tenere il gesto 1:1; qualunque multiplo arbitrario di `100vh` rompe il rapporto col dito.
- *Rail*: la zona morta 2.5%/97.5% e la ease non lineare `0.25,0,0.75,1`. Senza la prima il pin scatta, senza la seconda il rail è un carrello.
- *Rail*: i reveal interni restano **a durata fissa** (2.4 s + 0.8 s di delay, `once`), non scrubbati. Il moto segue il dito, i contenuti no — ed è il ritardo a far leggere il sipario come deliberato invece che come un caricamento.
- *Bottone*: due archi a 180°, `gap` sempre pari a `C`, e **timeline `paused` + `play`/`reverse`**, mai due tween separati: l'uscita deve riavvolgere da dove è arrivata.
- *T1*: `start`/`end` come **funzioni**, così si rivalutano al refresh (trappola già annotata in memoria di progetto). La soglia sulla **mezzeria dell'elemento**, non sul bordo del viewport — è tutta lì la finezza. Il guard `if (isDark === dark) return`, senza cui si scrive una classe per frame. I 520 ms: abbastanza lenti da non essere un evento, abbastanza veloci da non lasciare testo illeggibile.

**Esplicitamente scartato**
- *Cupola strutturale* (`border-top-radius: 50rem` + margin collapsing attraverso `overflow: clip`). Portabile al 100% perché è solo CSS — quattro dichiarazioni e zero JavaScript per l'effetto più costoso di quella pagina, e vale la pena saperlo anche solo per non riprodurlo con un tween. Scartata comunque: pretende che la sezione precedente diventi una scroll-area con screen sticky, e con l'arco già presente nel preloader, in `PageTransition` e in sette passaggi di `ToneShift`, una cupola in più smette di essere un momento e diventa un tic. Se un giorno rientra: **una volta sola**, e con il margine sul proprio box invece del gioco di collasso, che è elegante ma si rompe in silenzio al primo `padding-top` di troppo su un antenato.
- *Snap alle sezioni* (`lenis.on("scroll")` con debounce 40 ms, ratio > 0.5, `scrollTo` 1.2 s). Funziona, si porta in un pomeriggio, e contraddice il brief: "scroll continuo" e "la pagina si muove da sola quando smetto di scorrere" sono richieste opposte. Il riferimento stesso lo mette su 2 sezioni su 14. Sulle cinque bersaglio, che sono ad altezza di contenuto e non schermate intere, non c'è nemmeno niente a cui attraccare. È anche un rischio di accessibilità: sottrae il controllo a chi usa tastiera o dispositivi assistivi.
- *Maschera ad arco del preloader, hero con zoom, dive-in, logo rotante, magnetico, testo curvato su `textPath`*: già in casa (`globals.css .dt-arch-mask`, `Preloader.tsx`, `ToneShift.tsx`, `HeroCinematic.tsx`, `RotatingMark.tsx`, `Magnetic.tsx`, `HorizonStory.tsx`). Reimportarli sarebbe duplicazione.
- *Le due metà che si aprono + tuffo* (clip-path a 10 vertici, `scale 1 → 1.84`): secondo set piece firmato, ma la home ha già il suo climax in `ReviewsWall` e un secondo momento monumentale li svaluta entrambi.

---

## 3. Senza casa

### 3.1 Reference intere

**threjs-metaballs-carousel (Anton Bobrov)** — `_refs/threjs-metaballs-carousel/`, **nessuna licenza** (nessun `LICENSE`, `package.json` senza campo `license`).

L'effetto firma è una maschera goo che rivela un layer sotto un altro, e la sua leggibilità dipende **interamente** dal contrasto fra i due layer. Nella reference sono tre fotografie a tutto schermo: contrasto enorme, il goo è protagonista. Da noi i toni sono tutti della famiglia crema — paper `#fffdf8`, cream `#f2ebda`, cream-deep `#efe7d6`, delta di luminanza ~3%. Fra due tinte così vicine **la forma della maschera non esiste**: che salga un arco, una tenda o dodici blob gocciolanti, l'occhio vede solo "il colore è cambiato". Costruire un canvas sfocato ridipinto a ogni tick di scrub per una silhouette invisibile è lavoro buttato, e le cuciture bersaglio sono tutte di quel tipo.

Tre motivi in più, ciascuno sufficiente da solo:
1. Il sito ha già **tre** linguaggi di reveal mascherato (`LiquidReveal`, `MaskReveal`, `ToneShift`). Un quarto non aggiunge vocabolario, aggiunge repaint.
2. "Blob che colano" è imparentato abbastanza da vicino con la famiglia fluido esclusa dal cliente da rendere la conversazione scivolosa. Non è water né ripple, ma la distanza è troppo poca.
3. Il costo: 121 punti valutati **per frammento**, cioè ~1.00 G distanze per frame a 1920×1080 DPR 2, più i `#define` mutati e `needsUpdate = true` a **ogni** frame (ricompilazione GLSL vera a ogni cambio slide finché le permutazioni non sono in cache), più `setPixelRatio` senza tetto.

L'unica cosa salvabile era l'algebra dello stagger (`spreadScope(n, shift)`: `duration = 1/(n - shift·(n-1))`, `start_i = duration·(1-shift)·i`, più lo shuffle delle finestre) — matematica pura, venti righe, zero dipendenze. Scartata anche quella **per conflitto**: sarebbe stata la quarta legge di distribuzione sugli stessi sei tile di Social, dopo il rail, il guadagno monotono e il contro-zoom, e `gsap.stagger` dentro `containerAnimation` copre già il caso reale. Resta agli atti un dato di taratura, se un giorno si volesse togliere la linearità da una cucitura: il loro wipe è fortemente **back-loaded** — nulla fino al 30% del progresso, tutto fra 0.30 e 0.72, nulla dopo (misurato simulando il campo, non dedotto).

### 3.2 Effetti principali senza casa, da reference che invece un posto ce l'hanno

Elencati perché sono la maggior parte di ciò che si vede nelle demo, e per non far rifare a nessuno il giro:

| Effetto | Reference | Motivo del rifiuto |
|---|---|---|
| Reveal a radiografia con maschera fluida | three-skull | Famiglia esclusa per direttiva (`FluidSim.js`), richiede WebGPU senza fallback, due render pass + bloom + FBO a 5 tap, e la reference non contiene una riga di scroll |
| Caustiche d'acqua procedurali | aurelia | Doppiamente fuori: environment node PBR + famiglia water esclusa |
| Fisica verlet (campana, tentacoli, bracci) | aurelia | ~25.000 vertici e decine di migliaia di molle a 360 step/s su compute shader: 3-4 ordini di grandezza fuori portata, e ridotta a una catenella non comunica nulla di immobiliare |
| Telescopio droste a 6 copie mascherate della foto | telescope-zoom | Dipende da una silhouette ritagliata a mano per soggetto (124 KB di PNG alpha ciascuna): insostenibile su un catalogo immobiliare. Il meccanismo astratto è già ToneShift |
| Fly-past prospettico a 10 miniature | telescope-zoom | Registro da demo Codrops, non da agenzia che vende fiducia. E il riferimento ha un bug: `z: '100vh'` risolto una volta sola, manca `invalidateOnRefresh` |
| Trail 3D serpentino + particelle sulla testa | codrops-depth-gallery | Geometria ricostruita ogni frame; l'unica parte portabile (il Lissajous come `<path>` SVG) duplicherebbe il filo rosso già in scena |
| Scia a cloni di immagini sul rail | IntroTrailEffect | Fino a 18 layer compositor promossi in permanenza su sei tile, con teardown obbligatorio legato alla velocità. Quarto strato di troppo su Social |
| Fake progress `steps(14)` + gate a click "Enter" | IntroTrailEffect | Progresso deliberatamente finto e slegato dal caricamento vero: 2.2 s di attesa fabbricata contro due commit spesi a toglierla. `Preloader.tsx` è già migliore |
| Zoom `2.05` + apertura a sipario a tre vie | codrops-sticky-grid-scroll | Vive già in `ReviewsWall.tsx`: un colpo di scena che accade due volte non è più un colpo di scena |
| Uncover parallax del wrapper sticky | codrops-sticky-grid-scroll | Sarebbe stato *il* prestito per i confini, ma ToneShift è in produzione: cinque nuovi wrapper sticky = cinque contesti di stacking e cinque rimisure a rischio |
| Cupola strutturale + snap alle sezioni | era-residence | La prima diventa un tic accanto a sette archi già in scena; il secondo contraddice il brief e sottrae il controllo dello scroll |
| Warp a value-noise, cover UV, RGB shift, `mix-blend-mode: difference` | Liquid Morphology | I primi due il sito li fa già meglio (`HoverDistort`, `next/image`); gli ultimi due sono effetti nati su fondo `#050505` e la palette qui è calda e chiara |
| Scan lines CRT, grana animata all'1.5% | three-skull | Contraddizione di registro (un immobiliare in crema e Playfair non è un tubo catodico) e invisibilità su `#f2ebda` senza sporcare le foto degli immobili |
| Campo di plancton in Canvas2D | aurelia | Portabile davvero, ma FeaturedTestimonial prende già maschera + filtro SVG + parallasse: un canvas con rAF è il conto sbagliato ora |

---

## 4. Note di chiusura

**Cartelle presenti senza scheda in questo dossier**: `reverse-engineering/WebGL-typing-tutorial/` (MIT, Codrops 2009-2021) e `reverse-engineering/FullscreenClipEffect/` (MIT, Codrops 2009-2023). Sono materiale di sprint precedenti, già lavorato; non sono state rilette in questo giro e non concorrono alle assegnazioni.

**Ordine di implementazione suggerito**, per rischio crescente:
1. T1 (flip del tono del chrome) e T2 (grana anti-banding) — trenta righe e un overlay, rischio nullo, e chiudono il problema che il brief pone davvero.
2. Gli effetti a costo nullo: #1, #2, #4, #6, #12.
3. Gli effetti a timeline: #3, #5.
4. #7 e #8 su FeaturedTestimonial — una istanza di filtro SVG per pagina, misurare prima di aggiungere.
5. Social per ultima: #9 (struttura), poi #10, e solo **dopo averlo visto a schermo** #11.
6. T3 e T4 come rifinitura: taratura di ToneShift e sonda del viewport, da verificare con Playwright headless (regola di progetto: il moto non si valida a occhio su Windows).