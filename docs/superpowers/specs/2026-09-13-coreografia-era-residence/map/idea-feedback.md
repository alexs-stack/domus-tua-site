# feedback
## currentState
IL MONOGRAMMA ROTANTE OGGI

Dove si vede
- Solo da xl (1280 px): lo span `hidden xl:contents` avvolge `<RotatingMark className="h-14 w-14" />` (Header.tsx:221-223; DESIGN.md:401, 488, 529). Sotto i 1280 px non c'è.
- Il motivo è in Header.tsx:215-220: accanto al cuore del logo sembrava «un errore di montaggio».
- Nel preloader lo stesso MarkBadge gira in CSS a ogni larghezza: `dt-pre-spin` 6 s, orario (globals.css:886-898), su disco carta (DESIGN.md:547).

Resta a schermo scrollando? No
- La testata è `sticky top-0 z-50 ... lg:relative` (Header.tsx:202; D14 in spec:428). È sticky proprio sotto lg, dove il monogramma non esiste. Da lg scorre via, e da xl, dove il monogramma esiste, scorre via con lui.
- La riga è alta `--dt-head-h` = clamp(4.5rem, 10vh, 6.5rem) (globals.css:162; Header.tsx:31, 208). A 1440×900 sono circa 90 px: dopo circa 90 px di scroll il cuore è fuori campo.
- Conseguenza: la risposta alla velocità è quasi invisibile. Il colpo di rotella che lo accelera lo porta anche fuori schermo. Si vede solo nei primi ~90 px, o tornando in cima durante il rientro di 1,1 s.

La risposta alla velocità (RotatingMark.tsx)
- Il gate è solo `MQ.motionOk` (44), senza soglia di larghezza.
- Riposo a 30°/s (45).
- La modulazione si arma solo al primo `wheel` o `touchmove` once (52-56). Tastiera e trascinamento della scrollbar non la armano mai.
- Ticker: `dt = min(deltaMS, 100)`, e lo stesso angolo scritto su anello e monogramma, stesso verso (60-68).
- Su `lenis.on('scroll')` la velocità va a `30 + 10·|v|` con durata 0.3, ease «domus» e `overwrite: true` (70-77). Mai negativa: C06, spec:370.
- Dopo 100 ms di quiete torna a 30 in `dur.transition` = 1.1 s con ease «domus» (78-81; gsap.ts:66 «domus» = M0,0 C0.22,0.9 0.36,1 1,1; gsap.ts:85-91).
- Aggancio tardivo a Lenis con polling ogni 250 ms (83-94).
- Il ticker gira e scrive transform a ogni frame anche sotto xl, dove il nodo è display:none, e da xl anche con la testata fuori schermo (44, 60-68 con Header.tsx:221).
- Commenti scaduti: RotatingMark.tsx:9-15 descrive ancora i «versi opposti»; 63-64 è confuso.

Velocità di Lenis
- Config Domus: `lerp: 0.1, smoothWheel: true`, touch nativo (SmoothScroll.tsx:6, 108-114). Era usa invece `duration: 1.2` con easing esponenziale (README:117-118), quindi la stessa formula dà picchi diversi. Non misurato.
- Rotella (ramo smooth): `velocity = value - animatedScroll`, px per frame (lenis.mjs:822-826).
- Nativo (touch e tastiera): delta per evento, azzerato dopo 400 ms (lenis.mjs:649-671).

Il badge
- `[data-rot-ring]`: 60 tacche in `currentColor`, cioè l'ink della testata.
- `[data-rot-mark]`: il monogramma depositato, che non si tinge (MarkBadge.tsx:10-13, 41-83).
- MarkDomus ha solo #595a58 e #e30716, nessuna variante chiara (MarkDomus.tsx:27-37).
- Lo presidia logo-colore.test.ts: 55-67 i due colori, 74-80 nessuna prop dark/variant, 82-89 nessun invert/brightness/grayscale.
- Brand book: niente morph o draw, sì fade/scale/maschere sul contenitore (MarkDomus.tsx:10-12; PRODUCT.md:66). Logo senza sfondo bianco: C19, spec:383, PRODUCT.md:69-70.

TEMA E DATA-BG
- Nel codice attivo non esiste nessun `data-bg` o `data-theme`.
- Un tono del chrome era già stato costruito e tolto: `watchSurfaceTone` di ThreadNav (git 6a33f85 «il filo legge la superficie che ha sotto»; piano T1 in docs/effetti-reference.md:49 e 440-456), rimosso col redesign (spec:215; git 3cee992).
- Il sito ha un solo fondo avorio, senza sezioni scure (DESIGN.md:335, 345; layout.tsx:241).

ELEMENTI FIXED E STICKY
Fixed:
- Testata sticky sotto lg, avorio profondo opaco dopo 24 px (Header.tsx:63, 192, 204).
- Pannello del menu mobile, `fixed z-40 bg-cream` (Header.tsx:282).
- MobileActionBar sotto sm: `fixed bottom z-40 bg-cream`, dopo 520 px, nascosta su #contatti e con overlay aperti (MobileActionBar.tsx:29, 38-47, 73-77, 88).
- WhatsAppFloat da sm: `fixed right-5 z-50`, cerchio `bg-red`, dopo 600 px (WhatsAppFloat.tsx:13, 25-27, 39), su 16 pagine.
- Launcher dell'assistente: `fixed right-5 z-50` rosso, montato solo con ENABLED; in produzione è spento (Assistant.tsx:421, 435-442). Il suo pannello è `z-[60]` (Assistant.tsx:458).
- Banner cookie `fixed z-[60] bg-paper` (CookieConsent.tsx:197; globals.css:763-768).
- PreviewBadge `fixed left-5 z-40` in basso (PreviewBadge.tsx:35-36).
- Skip link (layout.tsx:257).
- VideoLightbox e CaseQuickLook `fixed inset-0 z-[70]` (VideoLightbox.tsx:103; CaseQuickLook.tsx:158).
- Sipario del preloader.

Sticky (i tre nastri, più una colonna d'indice):
- Schermo di HorizonStory, 100svh (globals.css:1751-1757).
- Schermo di StarReviews, 100svh su 360svh (globals.css:1958-1968).
- Rotaia `.dt-railway` del team (globals.css:2078-2085).
- Colonna d'indice `lg:sticky lg:top-32` delle FAQ (FaqContent.tsx:236).

DOVE UN SEGNO FISSO IN ALTO A SINISTRA FINIREBBE SU FOTO O VIDEO
Il margine `.dt-row` è 8vw, 5vw sotto i 768 px (globals.css:440-448): il rischio c'è solo coi media a vivo.
- Banda dell'hero: `h-[var(--dt-band-h)]` 60svh, a tutta larghezza sotto la testata (HeroCinematic.tsx:407-429).
- Fullscreen di StarReviews: `.dt-starrev_intro absolute inset-0` z-5 nello schermo sticky (StarReviews.tsx:651-682; globals.css:1975-1978), col titolo bianco (688).
- Tessere del team: 4:5, 42vw (DESIGN.md:524), parcheggiate a `(innerHeight − rail.offsetHeight)/2` (HorizontalRail.tsx:99), traslano attraverso il margine (Team.tsx:223). Sovrapposizione probabile, da misurare.
- Foto del territorio di HorizonStory: dopo `padding-left: 26vw` (globals.css:1769-1775; HorizonStory.tsx:306-313). Per geometria non entra nel margine; stima.
- Tessere di Voci: nel margine solo dopo uno scroll orizzontale (Voci.tsx:186, 196, 220).
- Video del Congedo: `aspect-video min-h-[70svh] w-full` (Congedo.tsx:82-124), play/pause a IntersectionObserver (52-79).
- Banda di PageHero sulle pagine interne: a vivo con `-mx-[5vw] md:-mx-[8vw]`, 16:9 da md (PageHero.tsx:113-121).
Il cuore della testata a scroll 0 non tocca mai una foto: la banda e la sagoma del preloader cominciano sotto `--dt-head-h` (HeroCinematic.tsx:407; globals.css:858-866).

ROSSO NELLA PICCOLA UI, OGGI
- Cursore di RailProgress `bg-red`, solo sotto 1024 (`lg:invisible`) e solo nella rotaia del team (RailProgress.tsx:165, 173; HorizontalRail.tsx:183).
- Voce attiva del menu del telefono `aria-[current=page]:text-red` (Header.tsx:294, 306).
- Voce attiva della nav desktop: sottolineatura in ink, non rossa (Header.tsx:240).
- Anello di focus e selezione rossi (globals.css:199-204, 257-259).
- Cerchi WhatsApp rossi (WhatsAppFloat.tsx:39; MobileActionBar.tsx:115).
- DESIGN.md:327 elenca i rossi ammessi, ma non nomina il cursore di RailProgress né la voce attiva del menu del telefono. Regola del rosso contato: DESIGN.md:347.

STORIA DEL PROGRESSO DI PAGINA
- `.scroll-progress` rimossa nel 2026-07 (docs/DESIGN.md:114-116; memoria domus-wow-layer.md:30).
- ThreadNav (filo rosso fisso con riempimento in scrub) rimosso col redesign (spec:215, git 3cee992).
- Un altro indicatore di avanzamento sarebbe il terzo tentativo di un sistema già tolto due volte.
## eraExact
initLogo (main.pretty.js:1362-1406; README §5 righe 217-260)
- Bersaglio: il solo rosone `.header-logo_bg`, variante desk o mob visibile (1365). Il simbolo centrale resta fermo sopra (README:222-223). Markup in html/header-logo.html: simbolo viewBox 40 alla riga 1, rosone di lettere desk viewBox 120 alla riga 10, mob viewBox 80 alla riga 35.
- Stato `{speed: 30}` (1367-1369).
- Modulazione armata al primo `wheel` o `touchmove`, `{once: true}` (1373-1380).
- Ticker: `o = min(deltaMS, 100)`, `n += speed·o/1000`, `gsap.set(rosone, {rotation: n, transformOrigin: 'center center'})` (1381-1386).
- `lenis.on('scroll', ({velocity}))`: se non armato esce. Se `velocity ≠ 0`, `dir = sign(velocity)` (1391). `gsap.to(state, {speed: dir·(30 + 10·|v|), duration: .3, ease: 'Out', overwrite: true})` (1392-1397).
- Quiete: `clearTimeout`, poi `setTimeout(100)` → `gsap.to(state, {speed: 30·dir, duration: durL, ease: 'Out'})` (1398-1404).
- `durL = 1.2`; `Out = CustomEase '0.25,1,0.5,1'` (README:90-92). Da noi esiste identica come «dtOut» (gsap.ts:73).
- Lenis di Era: `duration 1.2`, `easing min(1, 1.001 − 2^(−10e))`, `touchMultiplier 2` (README:117-118).
- `.header-logo`: fisso in alto a sinistra, grande una cella di griglia, `z-index: 1200`, link `#hero` «Back to top» con attributo `data-theme` (README:221, 262; header-logo.html:1).

initThemeChange (main.pretty.js:280-309)
- Elementi: `[data-theme]`, cioè logo, nav e scrollbar (301; README:262).
- Per ogni sezione `[data-bg='color' | 'light' | 'dark']` (302-308):
  - salta l'elemento se è `display:none` (282);
  - legge il rettangolo della sezione e il centro x dell'elemento, e procede solo se il centro cade dentro la sezione in orizzontale (283-287);
  - crea `ScrollTrigger({trigger: sezione, start: () => 'top top+=' + (elTop + elH/2), end: () => 'bottom top+=' + (elTop + elH/2)})` (288-290);
  - `onEnter` e `onEnterBack` aggiungono `theme_on-{light|dark|color}` e tolgono le altre due (292-297). Nessun onLeave: comanda la sezione successiva.
- La soglia è la mezzeria del singolo elemento fisso, non il bordo del viewport. Il resto è una transizione CSS del colore, `.52s ease` secondo l'analisi in docs/effetti-reference.md:440.

initScrollBar (main.pretty.js:1408-1441)
- Solo da 992 px.
- Uno ScrollTrigger su tutta la pagina scrive `--progress` in % e un'etichetta `padStart(2, '0')` (1414-1421).
- Thumb trascinabile che chiama `lenis.scrollTo(frazione·maxScroll, {duration: 3.2})` (1423-1439).
- Nel README: §9 riga 350 e §11.5 righe 484-490.
### P1-mark-velocita-orologio — RotatingMark: un orologio condiviso, gate xl, armamento da tastiera e picco misurato [adopt-with-conditions]
kind=refine-existing sticky=False files=app/components/motion/RotatingMark.tsx, app/lib/motion/markClock.ts (nuovo), app/lib/motion/gsap.ts, app/components/__tests__/mark-orario.test.ts (nuovo), DESIGN.md dir=C06,A15,A17,vocabolario motion unico di gsap.ts,reduced-motion = pagina statica completa
ADATTAMENTO: Rifinisce il gesto che c'è, senza aggiungerne uno. Serve a tutte e tre le proposte ed è utile anche da solo.

(1) Gate di larghezza
- In gsap.ts nuova chiave `MQ.xl: '(min-width: 1280px)'` (oggi MQ si ferma a lg, gsap.ts:131-141).
- RotatingMark passa da `mm.add(MQ.motionOk)` (RotatingMark.tsx:44) a `mm.add(`${MQ.motionOk} and ${MQ.xl}`)`: sotto i 1280 px il ticker non scrive più transform su un nodo display:none (Header.tsx:221).

(2) Orologio condiviso
- Estrarre ticker, `state.speed` e `rotation` (RotatingMark.tsx:45-68) in un singleton di modulo, `app/lib/motion/markClock.ts`.
- Un solo `gsap.ticker.add` e un Set di coppie [ring, mark] registrate.
- Ogni istanza ha un flag `visible` alimentato da un IntersectionObserver sul badge: fuori viewport la `gsap.set` si salta, l'angolo continua ad avanzare.
- Il ticker si stacca quando il Set è vuoto, e Lenis si aggancia una volta sola (oggi c'è un polling a 250 ms per istanza, 83-94).
- Così il cuore della testata e quello di P2 hanno lo stesso angolo.

(3) Armamento
- Oltre a wheel/touchmove once (55-56), un `keydown` once su ArrowUp/Down, PageUp/Down, Space, Home, End.
- Oggi chi scorre da tastiera non ha mai la risposta; lo scroll nativo emette comunque la velocità (lenis.mjs:649-671).

(4) Formula
- Resta `30 + 10·|v|`, mai negativa (C06).
- Prima misurare con Playwright a 1440 il picco di `getLenis().velocity` su un colpo di rotella e su Fine/Home: con `lerp 0.1` (SmoothScroll.tsx:109) la scala non è quella di Era.
- Se il picco supera 60 px/frame: `30 + 10·min(|v|, 60)`, cioè al massimo 630°/s. Fine/Home in un solo evento nativo farebbero altrimenti un salto enorme.

(5) Ease
- Accelerazione 0.3 s (`dur.micro`) con «dtOut», la stessa «Out» di Era (gsap.ts:73), al posto di «domus».
- Rientro dopo 100 ms di quiete in `dur.transition` 1.1 s con «dtOut»: il vocabolario non ha 1.2 (gsap.ts:85-91) e resta 1.1.
- Punto di gusto: se Alberto preferisce «domus» resta com'è.

(6) Pulizia
- Riscrivere i commenti RotatingMark.tsx:9-15 (ancora i versi opposti) e 63-64.
- Aggiornare DESIGN.md:529 (ease, armamento da tastiera, gate xl).

Reduced-motion: invariato. Niente si muove e il badge resta com'è nell'HTML (RotatingMark.tsx:20-22).
Test nuovo `app/components/__tests__/mark-orario.test.ts`: il sorgente di markClock/RotatingMark usa `Math.abs(velocity)` e non contiene `Math.sign(` né una `dir` moltiplicata per speed. È il gemello GSAP della guardia CSS di intro-clocks.test.ts:343-360.
RISCHI: Il tetto a 60 px/frame è un'ipotesi: va fissato dopo la misura, non a occhio. / Passare da «domus» a «dtOut» cambia la sensazione: decisione di gusto di Alberto, non tecnica. / L'IO sul badge della testata va ricreato al cambio di lingua se useGSAP rimonta (trappola revertOnUpdate, memoria domus-wow-layer.md:40).
TEST: app/lib/__tests__/intro-clocks.test.ts (invariato: guarda solo il CSS del preloader) / app/components/__tests__/logo-colore.test.ts (deve restare verde: nessuna prop dark/variant) / nuovo mark-orario.test.ts
VERDETTO: È una rifinitura del gesto che c'è già e non aggiunge né un gesto né una sezione sticky. Il monogramma è ammesso da C06 (spec:370) e da DESIGN.md:573. Quasi tutto il currentState regge alla rilettura del codice: gate solo motionOk (RotatingMark.tsx:44); armamento solo con wheel/touchmove once (55-56); `Math.abs` (73); rientro in dur.transition con «domus» (80); polling ogni 250 ms (86-94); commenti scaduti ai versi opposti (9-15); ticker che scrive transform anche su un nodo display:none sotto xl (Header.tsx:221). Anche la lettura della velocità di Lenis è giusta: ramo smooth a lenis.mjs:822-826, nativo a 649-671. Ci sono però quattro punti deboli. (a) Il tetto alla velocità non può restare condizionato alla misura. Già oggi, una volta armato dalla rotella, un Fine/Home nativo emette `velocity` pari all'intero salto (lenis.mjs: `velocity = animatedScroll - lastScroll`), cioè decine di migliaia di px, e la velocità schizza a centinaia di migliaia di °/s per 100 ms più 1,1 s. È un difetto presente, non un rischio introdotto dall'armamento da tastiera. (b) Il cambio di ease da «domus» a «dtOut» è un cambio di sensazione visibile rispetto a quanto scritto in DESIGN.md:529. Non tocca una direttiva, ma resta una scelta di gusto e il default deve restare «domus». (c) Il singleton markClock ha un solo consumatore: RotatingMark è importato solo da Header.tsx:7. Senza P2 è astrazione senza uso. (d) Il rischio revertOnUpdate citato non si applica: il useGSAP di RotatingMark non ha dependencies (RotatingMark.tsx:105-107), quindi non rigira al cambio di lingua. La soglia xl è coerente con `hidden xl:contents` (Header.tsx:221) e con DESIGN.md:401 («il monogramma della testata compare da xl»). Reduced-motion resta invariato.
CONDIZIONI: Tetto alla velocità incondizionato: `speed = 30 + 10·min(|v|, VMAX)`. VMAX si fissa dopo una misura Playwright headless a 1440×900 su tre casi: colpo di rotella, End/Home e click di un'ancora con `anchors: true` (SmoothScroll.tsx:112). Si scrive col numero misurato, non a occhio. / Ease invariata («domus», RotatingMark.tsx:76 e 80, come in DESIGN.md:529). «dtOut» solo con un sì esplicito di Alberto, registrato come D in spec §11.2. / markClock.ts (singleton, IntersectionObserver per istanza) solo se P2 viene approvato. Da solo P1 consegna: gate xl, armamento da tastiera, tetto, pulizia dei commenti, dentro RotatingMark.tsx. / `MQ.xl: '(min-width: 1280px)'` in gsap.ts va documentata nel commento «DUE SOGLIE» (gsap.ts:114-121) come soglia di chrome, distinta da 768/1024. Il gate è `${MQ.motionOk} and ${MQ.xl}`, sulla forma già usata da HorizontalRail.tsx:90. / Armamento `keydown` once e passive, solo per ArrowUp/Down, PageUp/Down, Space, Home, End. Si ignora se `event.target` è input, textarea, select o contenteditable (Space in un campo del form non scorre). / Non rinominare né spostare `[data-rot-ring]`/`[data-rot-mark]`: li leggono globals.css:886-893 (spin del preloader) e intro-clocks.test.ts:354-355. / Il nuovo mark-orario.test.ts toglie i commenti prima di cercare, come soloCodice in logo-colore.test.ts:44-46: RotatingMark.tsx:14 nomina ancora il «cambio di direzione». Asserisce `Math.abs(velocity)` e l'assenza di `Math.sign(` e di `direction` moltiplicati per speed. / Aggiornare DESIGN.md:529 e la riga C06 della spec (spec:370): gate xl nel codice, armamento da tastiera, tetto.
EVIDENZE: app/components/motion/RotatingMark.tsx:44 — mm.add(MQ.motionOk) senza soglia di larghezza / app/components/motion/RotatingMark.tsx:55-56 — armamento solo wheel/touchmove once / app/components/motion/RotatingMark.tsx:72-81 — 30+10·|v|, 0.3 s domus, overwrite; rientro dur.transition domus dopo 100 ms / app/components/motion/RotatingMark.tsx:9-15 — commento ancora sui versi opposti; 63-64 confuso / app/components/motion/RotatingMark.tsx:105-107 — useGSAP senza dependencies (nessun revertOnUpdate in gioco) / app/components/Header.tsx:7 — unico import di RotatingMark nel sito / app/components/Header.tsx:221-223 — `hidden xl:contents` attorno a RotatingMark h-14 / node_modules/lenis/dist/lenis.mjs onNativeScroll — `velocity = animatedScroll - lastScroll` per evento nativo, azzerata dopo 400 ms (salto di End = velocità enorme) / node_modules/lenis/dist/lenis.mjs onUpdate (ramo smooth) — `velocity = value - animatedScroll` / app/components/motion/SmoothScroll.tsx:108-114 — lerp 0.1, smoothWheel, anchors true / app/lib/motion/gsap.ts:66, 73, 85-91, 131-141 — domus, dtOut, dur, MQ fino a lg / DESIGN.md:529 — ease domus e 1.1 s documentati; DESIGN.md:401 — il monogramma compare da xl / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:370 — C06, mai invertire / app/lib/__tests__/intro-clocks.test.ts:344-360 — guardia del verso sul CSS del preloader / reverse-engineering/era-residence/js/main.pretty.js:1373-1404 — initLogo con dir = sign(velocity)
ERRORI DI FATTO: Nel rischio «L'IO sul badge della testata va ricreato al cambio di lingua se useGSAP rimonta (trappola revertOnUpdate)»: il useGSAP di RotatingMark non ha dependencies (RotatingMark.tsx:105-107) e non rigira al cambio di lingua. Il rischio non esiste nella forma descritta. / «Lenis si aggancia una volta sola (oggi c'è un polling a 250 ms per istanza)»: oggi l'istanza è una sola (Header.tsx:7 è l'unico import). Il vantaggio del singleton esiste solo con P2. / Il punto (4) presenta il salto di Fine/Home come conseguenza dell'armamento da tastiera («farebbero altrimenti un salto enorme»). Il picco esiste già oggi: dopo il primo wheel l'armamento è permanente e un End nativo passa da onNativeScroll con velocity uguale all'intero salto. Il tetto va messo comunque, non «se il picco supera 60».
### P2-cuore-sentinella — Il cuore sentinella: il monogramma che resta a schermo da xl quando la testata scorre via [needs-alberto]
kind=new-gesture sticky=False files=app/components/motion/MarkSentinel.tsx (nuovo), app/components/Header.tsx, app/components/motion/RotatingMark.tsx, app/lib/motion/markClock.ts (da P1), app/lib/motion/gsap.ts, DESIGN.md, PRODUCT.md, docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md dir=C06,C19,C03,C02,D14,A13,A15,A17,DESIGN.md Don't :587 (bello anche fermo; niente WOW layer),memoria: un segno forte e un accento rosso animato per vista (domus-motion-architecture.md:22)
ADATTAMENTO: Cosa aggiunge: un gesto nuovo, piccolo. Il RotatingMark esistente acquista una seconda presenza fissa, con ingresso e uscita in dissolvenza. Non è una sezione sticky né un pin: è un segno di chrome `position: fixed`.

Componente
- `app/components/motion/MarkSentinel.tsx` ("use client"), montato dentro Header.tsx subito dopo la riga. `<header>` non ha transform, solo transition-colors (Header.tsx:202), e fino a body non c'è nessun antenato trasformato (layout.tsx:241, 297): il fixed resta ancorato al viewport.
- Markup: `<div aria-hidden hidden className='pointer-events-none fixed z-40 left-[calc(4vw-1.5rem)] top-[calc(var(--dt-head-h)/2-1.5rem)]'>` con dentro `<MarkBadge className='h-12 w-12' />`, 48 px, la taglia di default di RotatingMark.tsx:34.

Posizione
- Sta nel margine sinistro di `.dt-row` (8vw, globals.css:440-442), non sopra i titoli che cominciano a 8vw:
  - 1280 → x 27-75 su un margine di 102 px;
  - 1440 → x 34-82 su 115;
  - 1920 → x 53-101 su 154.
- Stessa linea di mezzeria del cuore della testata: la riga è alta `--dt-head-h` (Header.tsx:31, 208), che resta il numero condiviso del patto della porta.

Quando esiste
- Solo in `mm.add(`${MQ.motionOk} and ${MQ.xl}`)`, lo stesso gate del cuore in testata (Header.tsx:221). Lì il JS toglie `hidden`; il revert lo rimette.
- Senza JS, con reduced-motion o sotto i 1280 px non c'è: resta il cuore in testata, fermo con reduced-motion.
- È decorativo e senza contenuto: partire `hidden` non tocca SEO né LCP. Essendo fixed, CLS 0.

Ingresso e uscita
- Un IntersectionObserver (threshold 0) sull'elemento `<header>`.
- Quando esce (isIntersecting false e bottom ≤ 0): `gsap.fromTo(el, {opacity: 0, scale: 0.8}, {opacity: 1, scale: 1, duration: dur.short 0.6, ease: 'domus', overwrite: true})`, transformOrigin center.
- Quando rientra, uscita speculare più rapida: `gsap.to(el, {opacity: 0, scale: 0.8, duration: dur.micro 0.3, ease: 'domus', overwrite: true})`.
- Solo opacity e transform, sul wrapper. La rotazione resta sui nodi interni `[data-rot-*]`, centrati in flexbox (MarkBadge.tsx:61-66): nessun conflitto di transform.
- Con l'orologio condiviso di P1 il segno compare già allo stesso angolo del cuore appena uscito: si legge come lo stesso cuore che si stacca, non come un secondo logo.

Feedback e visibilità
- Stessa risposta `30 + 10·|v|` di P1: qui finalmente si vede per tutta la pagina. È il feedback globale e costante dell'articolo.
- Visibilità composta: testata uscita && non sopra una zona `data-bg` (P3) && `!hasOverlay()` (overlays.ts:28-37, `subscribeOverlays`) && `!html[data-preloader]`.
- Non è un link: nessun focus da gestire (regola opacity/autoAlpha di gsap.ts:21-25).
- z-40: sotto banner cookie z-60 (CookieConsent.tsx:197) e dialoghi z-70 (VideoLightbox.tsx:103, CaseQuickLook.tsx:158). Non tocca PreviewBadge, che sta in basso a sinistra (PreviewBadge.tsx:35-36).

Decisione
- Rimette in discussione D14 («da lg nessuna barra fissa», Header.tsx:199-201; spec:428), che è una decisione di lavoro: l'argomento è che si fissa un segno da 48 px, non la barra.
- Tocca però C03 (la cliente: meno animazioni), e il riferimento visivo goldengoal (C02) non ha nulla di fisso. Serve un sì esplicito di Alberto: A15/A17 fanno di era-residence, che il logo fisso ce l'ha (README:221), il riferimento di tecnica.
- Da registrare in spec §11 come D nuova, in DESIGN.md (Monogramma rotante :529, Navigation :488-490) e in PRODUCT.md:132.
RISCHI: Va contro lo spirito di C03 e di D14: senza il consenso di Alberto non si costruisce. / Collisioni nel margine da misurare con Playwright a 1280/1440/1920 su tutte le rotte con WhatsAppFloat: a 1280 lo stage di StarReviews comincia a ~52 px (max-w 1240 + px-8, StarReviews.tsx:698, qui coperto da P3), e le tessere di Voci entrano nel margine dopo uno scroll orizzontale (Voci.tsx:186). / Due MarkBadge nel DOM da xl: i selettori `[data-rot-ring]`/`[data-rot-mark]` di sonde ed e2e vanno delimitati. / Il rosso del cuore sempre presente pesa sulla regola del rosso contato (DESIGN.md:347): per questo P3 lo toglie dove la pagina già si muove. / Senza P3 il segno siederebbe sulla banda dell'hero appena la testata esce: P2 non va consegnato senza P3.
TEST: e2e/home.spec.ts:51-119 (l'header porta alle sezioni: il segno pointer-events-none non deve intercettare) / e2e/home.spec.ts:318-327 (clic al centro dei link dell'header) / app/components/__tests__/logo-colore.test.ts:74-89 (nessuna prop di colore, nessun filtro sul marchio) / e2e nuova: 1440, scroll 1200 px → sentinella opacity 1; reduced-motion → attributo hidden; 1279 px → hidden
VERDETTO: Non è una rifinitura: aggiunge al sito un elemento di chrome `position: fixed` nuovo e persistente, con un suo ingresso e una sua uscita animati (opacity/scale 0.6 s e 0.3 s). Oggi l'inventario degli elementi fissi di DESIGN.md:400 conta solo WhatsApp, la barra azioni e il banner cookie. Contraddice lo spirito dichiarato della testata: «nessuna barra fissa su ogni schermata, la pagina è tutta contenuto» (Header.tsx:199-201), «da lg scorre via come nel riferimento» (PRODUCT.md:153-155, D14 a spec:428). D14 è una decisione di lavoro rivedibile, ma la stessa scelta tocca l'applicazione di A13 (spec:402, «RotatingMark a 56 px solo da xl»). Allarga il motion oltre il perimetro di C03/A12: A12 ha rimesso solo i due set piece (spec:367 e 401), mentre qui un gesto diventa presente su ogni schermata. Pesa sul rosso: il cuore porta #e30716 (MarkDomus.tsx:37) su ogni vista, contro la regola del rosso contato (DESIGN.md:347) e la regola di progetto «un accento rosso animato per vista» (memoria domus-motion-architecture.md:22). L'anello è un «rosone tecnico-ornamentale» (MarkBadge.tsx:16): renderlo sempre presente spinge contro «ornamenti disegnati» di DESIGN.md:587, anche se in testata c'è già. La regola di memoria («prima di aggiungere un'animazione chiedersi se il riferimento ce l'ha») dà due risposte opposte: goldengoal (C02) no, era-residence sì (README:221, logo fisso z-1200). A17 mette «§5 logo rotante» nel perimetro di tecnica, ma non autorizza un cambio visibile dell'impaginato. Nessuna direttiva lo uccide in modo esplicito, quindi non va escluso. Serve però un sì di Alberto, e lui deve dire se va chiesto alla cliente per C03. Sul piano tecnico regge: header senza transform (Header.tsx:202), body senza transform (layout.tsx:241), niente testo, niente LCP, CLS 0. Alcune affermazioni sono sbagliate: vedi factualErrors. Domanda da fare ad Alberto: «Da 1280 px, con motion ok, vuoi che il monogramma rotante (48 px, nel margine sinistro di 8vw, alla quota della testata) resti fisso per tutta la pagina quando la testata esce, con comparsa in 0.6 s e uscita in 0.3 s, nascosto sopra le foto a vivo e sui tre nastri? È un elemento fisso nuovo (oggi solo WhatsApp, barra mobile e cookie), mette il cuore rosso che gira su ogni schermata e riapre D14. La cliente aveva chiesto di eliminare tante animazioni (C03): lo decidi tu o lo porti a lei?»
CONDIZIONI: Solo dopo un sì esplicito di Alberto, registrato in spec §11 come A nuova (o D con il suo consenso), con eccezione dichiarata a D14. Da aggiornare anche DESIGN.md:400 (Elementi fissi), :488-490 e :529, e PRODUCT.md:153-155. / Si consegna solo insieme a P3 (senza P3 dopo ~90 px siede sulla banda dell'hero, HeroCinematic.tsx:407-409) e con l'orologio condiviso di P1. / Montarlo fuori da `<header>`, per esempio come fratello subito dopo, oppure in portal su body. Dentro l'header `lg:relative z-50` (Header.tsx:202) il suo z-40 vale solo nello stacking context della testata. / Stato iniziale: `gsap.set(el, {opacity: 0, scale: 0.8})` PRIMA di togliere `hidden`, così non c'è un frame visibile al mount. Il revert di matchMedia rimette `hidden`. Con reduced-motion, sotto 1280 px o senza JS l'attributo resta. / Accettare che con il banner cookie aperto (overlays.ts:13, `cookie-consent` conta come overlay) la sentinella resti nascosta fino alla scelta, come MobileActionBar.tsx:73-77. / e2e headless a 1280, 1440 e 1920 su home e /vendi: opacity 1 dopo 1200 px, 0 sopra le zone di P3, `hidden` con reduced-motion e a 1279 px. Più un controllo con elementFromPoint che il segno non copra titoli o controlli nel margine (a 1280 lo stage di StarReviews parte a ~52 px: StarReviews.tsx:698 max-w-[1240px] px-8). / Nessuna prop di colore, nessun filtro, nessun disco sotto: logo-colore.test.ts:74-89 deve restare verde.
EVIDENZE: app/components/Header.tsx:199-202 — «da lg in su SCORRE VIA ... nessuna barra fissa su ogni schermata»; `sticky top-0 z-50 ... lg:relative` / app/components/Header.tsx:208, 221-223 — il badge in testata sta nella `.dt-row` (x da 8vw), h-14 = 56 px / app/globals.css:440-442 — `.dt-row` padding-inline 8vw / DESIGN.md:400 — inventario degli elementi fissi (WhatsApp, barra azioni, cookie) / DESIGN.md:347 — regola del rosso contato; DESIGN.md:573 e 587 — perimetro del motion e divieto di ornamenti disegnati / PRODUCT.md:125-135, 153-155 — motion ammesso; testata sticky solo sotto lg, da lg scorre via / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:367 (C03), 401 (A12), 402 (A13), 404-406 (A15, A17), 428 (D14) / app/components/MarkDomus.tsx:36-37 — il rosso #e30716 dentro il monogramma / app/components/motion/MarkBadge.tsx:16-17 — anello «rosone tecnico-ornamentale» / app/components/motion/PreloaderShell.tsx:176 — un secondo MarkBadge esiste già nel DOM / app/lib/ui/overlays.ts:13, 28-37 — cookie-consent è un overlay / reverse-engineering/era-residence/README.md:221 — `.header-logo` fisso top-left z-1200 / memoria domus-motion-architecture.md:22 — un accento rosso animato per vista; domus-redesign-rivista-bianca.md:22 — chiedersi se il riferimento ha l'animazione / grep di data-rot-ring/data-rot-mark in e2e/, scripts/, tests/: nessun risultato
ERRORI DI FATTO: «Stessa linea di mezzeria del cuore della testata» e «si legge come lo stesso cuore che si stacca»: coincide solo la quota y. Il badge in testata comincia al padding della `.dt-row`, cioè 8vw (Header.tsx:208, 221; globals.css:440-442), col centro a 8vw + 28 px (≈143 px a 1440), ed è 56 px (h-14). La sentinella è centrata a 4vw (≈58 px) ed è 48 px. Compare ~85 px più a sinistra e più piccola, dopo che l'originale è già uscito: non si legge come lo stesso cuore. / «z-40: sotto banner cookie z-60 e dialoghi z-70»: montata dentro `<header>`, che da lg è `relative z-50` (Header.tsx:202) e quindi crea uno stacking context, la sentinella dipinge al livello 50 della radice, non al 40. Resta sotto 60 e 70, ma il livello dichiarato non è quello effettivo. / Rischio «Due MarkBadge nel DOM da xl: i selettori di sonde ed e2e vanno delimitati»: già oggi i MarkBadge nel DOM sono due (PreloaderShell.tsx:176 più la testata), con la sentinella diventerebbero tre. Nessuna e2e, sonda o test usa `[data-rot-ring]`/`[data-rot-mark]` (grep vuoto). Le sole regole CSS sono delimitate da `.dt-preloader` (globals.css:886-893).
### P3-data-bg-foto — data-bg senza ricolore: il cuore si toglie di mezzo sopra le foto a vivo e sui tre nastri [needs-alberto]
kind=tokens-or-infra sticky=False files=app/components/HeroCinematic.tsx, app/components/PageHero.tsx, app/components/Congedo.tsx, app/components/StarReviews.tsx, app/components/HorizonStory.tsx, app/components/motion/HorizonScroller.tsx, app/components/motion/HorizontalRail.tsx, app/components/motion/MarkSentinel.tsx, app/components/__tests__/data-bg.test.ts (nuovo), DESIGN.md dir=C19,C14,C17,A11,C06,C20,PRODUCT.md:66-70 (logo non ridisegnato né animato con morph/draw, senza sfondo bianco),DESIGN.md:342 (bianco mai su avorio),DESIGN.md:345 (regola dell'unico fondo)
ADATTAMENTO: La tecnica di initThemeChange di Era, con una sola differenza: invece di cambiare classe di colore, il segno si nasconde. Il logo resta grigio #595a58 e rosso #e30716 (MarkDomus.tsx:36-37), l'anello resta in currentColor ink (MarkBadge.tsx:12-13, 54). Niente disco carta (C19), ombre o blend (C14, DESIGN.md:580), filtri (logo-colore.test.ts:82-89).

Attributi, statici nel markup
`data-bg='foto'` sulle superfici fotografiche a vivo:
- banda dell'hero `[data-hero-media]` (HeroCinematic.tsx:407-409);
- involucro della banda di PageHero (PageHero.tsx:113-121, sul contenitore esterno di Parallax, che trasla solo l'interno);
- `<section>` del Congedo (Congedo.tsx:82-86).
`data-bg='nastro'` sui tre corridoi pilotati dallo scroll:
- runway di StarReviews (StarReviews.tsx:651): il fullscreen `inset-0` z-5 copre l'angolo (globals.css:1975-1978);
- host `.dt-horizon` di HorizonStory/HorizonScroller (globals.css:1748-1757);
- wrap `.dt-railway` di HorizontalRail (HorizontalRail.tsx:104): le tessere 4:5 da ~605×756 a 1440 (DESIGN.md:524), parcheggiate a (innerHeight − rail)/2 (HorizontalRail.tsx:99), attraversano il margine.
Perché anche i nastri: lì la pagina è già essa stessa il feedback dello scroll, e resta un moto sola per vista. La sentinella esiste solo da 1280 con motion ok, dove i tre nastri sono sempre [data-on] (da 1024 con motion ok): gli attributi possono stare fissi senza MutationObserver. Un solo valore per tipo, perché il fondo è unico (DESIGN.md:345; C20).

Rilevamento
- Non ScrollTrigger: in fondo alla home, sotto le runway lunghe, calcola posizioni sfasate (memoria domus-motion-architecture.md:26; per questo Reveal usa IO).
- Un solo IntersectionObserver con la radice ridotta alla linea di mezzeria della sentinella: `cy = rect.top + rect.height/2`, `rootMargin: -${cy}px 0px -${innerHeight − cy − 1}px 0px`, threshold 0, osservando tutti i `[data-bg]`.
- Un Set delle zone intersecate; sopra una zona = `set.size > 0`.
- È la soglia di Era, `top top+=centro` → `bottom top+=centro` (main.pretty.js:288-290). Il Set gestisce da sé ingresso, rientro e uscita, dove Era ha solo onEnter/onEnterBack.
- Observer ricreato su resize, con debounce di 150 ms: cy dipende da `--dt-head-h` in vh.

Scambio
- Nasconde: `gsap.to(el, {opacity: 0, scale: 0.8, duration: 0.3 (dur.micro), ease: 'domus', overwrite: true})`.
- Mostra: `fromTo` a opacity 1 e scale 1 in 0.6 s (dur.short). Solo opacity e transform.

Effetto sulla home a 1440×900 (stima, da misurare)
- La testata esce a ~90 px, ma la banda dell'hero resta sotto l'angolo fino a ~585 px (head-h + 60svh − mezzeria).
- Il cuore entra quando la foto se ne va: prima apparizione sull'avorio di Posizionamento.
- Nascosto su #storia, #recensioni (360svh), rotaia del team e Congedo.
- Visibile su Voci, Paths, Method, OpenDomus, DomusDoc, Services, CostiChiari, FeaturedTestimonial, Social, Contact e Footer.
- Pagine interne: nascosto sopra la banda di PageHero (16:9 da md, PageHero.tsx:117), visibile dopo.

Reduced-motion, sotto xl, senza JS: gli attributi sono markup inerte, niente cambia.
RISCHI: Ogni media a vivo aggiunto in futuro deve portare l'attributo: il test unitario lo presidia (le Image con sizes='100vw' e le zone note devono avere un antenato data-bg). / La rootMargin in px va ricalcolata al resize: un observer vecchio lascia il cuore visibile sopra una foto. / Stima dei 585 px e dell'assenza di sovrapposizione col territorio di HorizonStory da verificare con Playwright headless (memoria: verifica motion solo headless). / Se P2 non viene approvato, P3 non ha consumatori: resta un attributo morto e non va fatto.
TEST: nuovo app/components/__tests__/data-bg.test.ts / e2e nuova: 1440, scroll a #recensioni + 150svh → opacity 0; a #voci → 1; /vendi a scroll 200 px → 0 sopra la banda / e2e/home.spec.ts (nessuna asserzione esistente sul DOM di HeroCinematic/Congedo cambia: si aggiunge solo un attributo)
VERDETTO: Non ha consumatori propri: esiste solo per la sentinella di P2, e il testo stesso lo dice («Se P2 non viene approvato ... non va fatto»). Segue quindi la risposta di Alberto su P2. Come tecnica è la variante più pulita che sopravvive al prompt negativo: nasconde invece di ricolorare. Rispetta logo-colore.test.ts:55-89 e la direttiva cliente del 2026-08-26 citata in MarkDomus.tsx:27-35, e non usa dischi, ombre o blend (DESIGN.md:580-581). Evita ScrollTrigger in fondo alla home, come fa Reveal.tsx:16 e 34 con IntersectionObserver. L'inventario delle zone a vivo regge: le sezioni della home fra Voci e Contact stanno tutte in `.dt-row` (FeaturedTestimonial.tsx:115, Posizionamento.tsx:76, Services.tsx:283, Social.tsx:68, Paths.tsx:231); gli unici margini negativi a tutta pagina sono PageHero.tsx:116; Congedo è `w-full` (Congedo.tsx:82-86). Il mapped result cita però 6a33f85 come «storia» senza dire la cosa decisiva. Il messaggio di quel commit racconta che la stessa idea (osservare le superfici con la viewport schiacciata a una banda di altezza zero) era già stata provata e ripristinata, perché misura la sovrapposizione e non la visibilità, e si era passati a elementFromPoint. La causa di allora, il footer uncover, non esiste più (spec §4.16 «Via l'uncover fisso»), quindi oggi l'IO può funzionare. Va però verificato, non dato per equivalente alla soglia di Era. C'è anche un errore nella lettura di initThemeChange (vedi factualErrors). Il test proposto su `sizes='100vw'` mancherebbe metà delle zone.
CONDIZIONI: Si costruisce solo se P2 è approvato da Alberto, e nello stesso lavoro. / Attributi statici: `data-bg='foto'` su `[data-hero-media]` (HeroCinematic.tsx:407-409), sull'esterno di Parallax in PageHero (PageHero.tsx:113-117) e sulla section di Congedo (Congedo.tsx:82-86). `data-bg='nastro'` sulla runway di StarReviews (StarReviews.tsx:651), sull'host `.dt-horizon` e sul wrap `.dt-railway`. Per HorizontalRail passa da una prop (`bg`), non cablato nel componente generico, che è riusabile. / Nel commento del rilevatore e nel commit va citato il precedente di 6a33f85: IO su banda schiacciata = sovrapposizione, non visibilità. Headless a 1440 va verificato che nessuna superficie coperta (fixed, sticky fuori campo, strati `hidden`) risulti intersecata. Se ricompare un uncover o una superficie coperta si torna a elementFromPoint. / Il test data-bg.test.ts non si appoggia al solo `sizes="100vw"`, che prende solo HeroCinematic.tsx:426 e PageHero.tsx:120. Usa un elenco esplicito delle zone (hero, PageHero, Congedo, StarReviews, HorizonStory, rotaia del team) più una regola sui margini negativi `-mx-[5vw]`/`-mx-[8vw]` e sulle section `w-full` con Image/video. / Observer ricreato su resize con debounce e al cambio di `--dt-head-h` (clamp in vh, globals.css:162). Lo scambio usa solo opacity/transform sul wrapper della sentinella, mai sui nodi `[data-rot-*]`. / e2e headless: 1440, scroll a metà runway di #recensioni → opacity 0; su #voci → 1; /vendi a 200 px → 0 sopra la banda; con reduced-motion gli attributi restano inerti.
EVIDENZE: reverse-engineering/era-residence/js/main.pretty.js:280-309 — initThemeChange: `function e(e, r, a)` con e = sezione; display:none controllato sulla sezione (282) / git show 6a33f85 (messaggio) — «PERCHÉ UN INTERSECTIONOBSERVER NON BASTA ... Serve un test di VISIBILITÀ, non di sovrapposizione. `elementFromPoint`...» / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md §4.16 — «Via l'uncover fisso» / app/components/Reveal.tsx:16, 34 — IntersectionObserver per i reveal / app/components/HeroCinematic.tsx:407-409, 426 — banda a vivo, sizes 100vw / app/components/PageHero.tsx:113-120 — Parallax con -mx-[5vw] md:-mx-[8vw], Image sizes 100vw / app/components/motion/Parallax.tsx:129-134 — contenitore esterno e interno separati / app/components/Congedo.tsx:82-86, 94 — section w-full; sizes "(max-width: 767px) 200vw, 100vw" / app/components/StarReviews.tsx:651-653, 666 — runway, intro inset-0, sizes "(max-width: 1023.98px) 55vw, 100vw" / app/globals.css:1975-1978 — `.dt-starrev_intro` z-index 5 / app/components/motion/HorizontalRail.tsx:103-104, 168-172 — data-on sul wrap solo con runway>0; il wrap `.dt-railway` / app/components/Team.tsx:220 — runway={120} / app/components/FeaturedTestimonial.tsx:115; Posizionamento.tsx:76; Services.tsx:283; Social.tsx:68; Paths.tsx:231 — media dentro `.dt-row`, non nel margine / app/components/__tests__/logo-colore.test.ts:82-89 — il filtro cercato è solo invert|brightness-0|grayscale
ERRORI DI FATTO: eraExact, initThemeChange: «salta l'elemento se è display:none (282)». A main.pretty.js:281-282 il parametro `e` è la SEZIONE `[data-bg]` (la funzione è chiamata con ogni sezione a 302-307): a essere saltata con display:none è la sezione, non l'elemento fisso. / Nel paragrafo «Rilevamento» l'IO con radice ridotta a una linea è presentato come trasposizione diretta della soglia di Era. 6a33f85, citato nel currentState solo come storia, documenta nel suo messaggio proprio il fallimento di quell'approccio (sovrapposizione ≠ visibilità) e il passaggio a elementFromPoint. / Lista excluded, voce «Ombra, alone, mix-blend-mode difference o filtri»: «Blend difference e invert ... il test li vieta esplicitamente (logo-colore.test.ts:82-89)». La regex del test copre solo `invert|brightness-0|grayscale` sulla stessa riga del nome del componente: mix-blend-mode non è vietato dal test. L'esclusione resta valida per DESIGN.md:580 e per la direttiva cliente del 2026-08-26 (MarkDomus.tsx:27-35). / Citazione «wrap `.dt-railway` di HorizontalRail (HorizontalRail.tsx:104)»: la riga 104 è `wrap.setAttribute("data-on", "")`; il div `.dt-railway` sta a HorizontalRail.tsx:168-172.
### P4-rosso-piccola-ui-registro — Inventario del rosso nella piccola UI e divieto scritto del progresso di pagina [adopt-with-conditions]
kind=docs-only sticky=False files=DESIGN.md, docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md, PRODUCT.md dir=C03,C04,DESIGN.md:327,DESIGN.md:347,D14
ADATTAMENTO: Nessun cambio al codice. L'idea «accento nei piccoli momenti di UI» c'è già; manca scriverla dove si decide.

(1) DESIGN.md, Colors → Primary (DESIGN.md:327)
Aggiungere i due rossi che ci sono e non sono elencati:
- il cursore di RailProgress, 2 px × un terzo di 4rem, solo sotto 1024 (RailProgress.tsx:165, 173); oggi citato solo nella Rotaia del team, DESIGN.md:523;
- la voce attiva del menu del telefono, `aria-[current=page]:text-red` (Header.tsx:294, 306).
Annotare che la voce attiva della nav desktop resta sottolineata in ink (Header.tsx:240), per la regola del rosso contato (DESIGN.md:347): nel primo schermo della home il rosso c'è già nel cuore del logo, nel «Tua», nella firma e nella CTA (HeroCinematic.tsx:465, 477-484, 505).

(2) DESIGN.md, Don't (accanto a :587)
«Niente barra di avanzamento della pagina, niente scrollbar custom né numero percentuale».
Storia: `.scroll-progress` tolta nel 2026-07 (docs/DESIGN.md:114-116), ThreadNav col suo filo in scrub e il tono del chrome tolti col redesign (spec:215; git 3cee992, 6a33f85). Se P2 passa, il feedback globale dello scroll è il cuore sentinella.

(3) spec §11
Se P1-P3 vengono approvati, voci D nuove col chi e il quando (ease, gate xl, sentinella, data-bg), e l'eccezione a D14 dichiarata.
RISCHI: Nessun rischio di codice; il registro deve dire chi ha deciso (spec §11 avverte sulle attribuzioni sbagliate).
VERDETTO: Solo documenti, nessun codice e nessun motion: resta dentro l'involucro. L'inventario del rosso è utile, perché DESIGN.md:327 non nomina il cursore di RailProgress (RailProgress.tsx:173, `bg-red`, visibile solo sotto lg per `lg:invisible` a 165) né la voce attiva del menu del telefono (Header.tsx:294, 306). Non è vero però che i due rossi «non sono elencati»: stanno già in DESIGN.md:491 («la corrente in rosso») e :523 (la rotaia). Vanno richiamati nella lista Primary, non duplicati. Il nuovo Don't sulla barra di avanzamento è coerente con DESIGN.md:573 e con la storia (docs/DESIGN.md:114-116; spec:215). Ma è una regola nuova: per il registro unico (spec:335-352) va registrata come decisione di lavoro con data e ragione, non scritta come se venisse da una direttiva. La rimozione di `.scroll-progress` nel 2026-07 fu una scelta del WOW layer (memoria domus-wow-layer.md:30), non della cliente. In più, rileggendo il registro è emerso un buco. La direttiva cliente del 2026-08-26 «il logo dev'essere quello grigio e rosso», che P3 e la lista excluded usano come fondamento, sta nel codice (logo-colore.test.ts:1-4, MarkDomus.tsx:27-35) ma non in spec §11: nessuna occorrenza di «08-26» o «grigio e rosso». Eppure §11 dichiara di contenere «le due di agosto ancora vive». Va proposta ad Alberto come voce C da aggiungere.
CONDIZIONI: Il Don't «Niente barra di avanzamento della pagina, niente scrollbar custom né numero percentuale» va registrato in spec §11.2 come D nuova (data, ragione, commit), e in DESIGN.md con il richiamo breve a quella D. Non va attribuito a C03 alla lettera. / In DESIGN.md:327 i due rossi entrano come richiamo a :491 (voce corrente del menu del telefono) e :523 (cursore della rotaia sotto 1024), senza riscriverne i valori. Resta annotato che la nav desktop sottolinea in ink (Header.tsx:240). / Nessuna frase su «il feedback globale dello scroll è il cuore sentinella» in DESIGN.md o PRODUCT.md prima del sì di Alberto su P2. / Proporre ad Alberto l'inserimento in spec §11.1 della direttiva cliente del 2026-08-26 sul logo grigio e rosso, con le parole esatte di logo-colore.test.ts:3-4 e il commit 9048a62 citato in memoria. Oggi la presidia un test ma manca nel registro canonico.
EVIDENZE: DESIGN.md:327 — lista dei rossi Primary, senza RailProgress né la voce del menu del telefono / DESIGN.md:491 — «separate da hairline (la corrente in rosso)» / DESIGN.md:523 — rotaia del team (cursore di RailProgress) / DESIGN.md:347 — regola del rosso contato; DESIGN.md:573, 587 — perimetro del motion / app/components/motion/RailProgress.tsx:165, 173 — `lg:invisible`, cursore `bg-red` / app/components/Header.tsx:240, 294, 306 — nav desktop sottolineata in ink; voci del telefono `aria-[current=page]:text-red` / docs/DESIGN.md:114-116 — `.scroll-progress` rimossa (2026-07) / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:215 — ThreadNav rimosso; :335-352 — registro unico e regola delle attribuzioni / app/components/__tests__/logo-colore.test.ts:1-4 — direttiva cliente 2026-08-26 / app/components/MarkDomus.tsx:27-35 — variante crema tolta per la direttiva del 2026-08-26 / grep «08-26|grigio e rosso» nella spec: nessun risultato / memoria domus-wow-layer.md:30 — barra `.scroll-progress` rimossa nel WOW layer
ERRORI DI FATTO: «Aggiungere i due rossi che ci sono e non sono elencati»: sono già scritti in DESIGN.md, la voce attiva del menu del telefono a :491 («la corrente in rosso») e il cursore della rotaia a :523. Mancano solo dalla lista Primary di :327. / «ThreadNav col suo filo in scrub e il tono del chrome tolti col redesign (spec:215; git 3cee992, 6a33f85)»: 6a33f85 è il commit che ha INTRODOTTO il tono del chrome («feat(chrome): il filo legge la superficie che ha sotto»), non quello che lo ha tolto. La rimozione è 3cee992.
ESCLUSO: Scambio di classi tema che ricolora logo e voci di nav (theme_on-light/dark/color di Era) — Il marchio non cambia colore: la cliente il 2026-08-26, «il logo dev'essere quello grigio e rosso», presidiato da logo-colore.test.ts:1-4 e 55-67; MarkDomus.tsx:27-37 ha tolto la variante chiara. Inoltre non esistono sezioni scure verso cui virare (fondo unico, DESIGN.md:345). Le voci di nav da lg sono in flusso e non passano mai sopra una foto (Header.tsx:202); sotto lg la testata diventa opaca dopo 24 px (Header.tsx:63, 204). Il bianco su avorio è vietato (DESIGN.md:342). (C19 · direttiva cliente 2026-08-26 sul logo grigio e rosso · C17/C20 · D14 · PRODUCT.md:66)
ESCLUSO: Disco o pastiglia chiara sotto il cuore per leggerlo sopra le foto — È la «pastiglia chiara» suggerita dal commento MarkDomus.tsx:32-34, ma contraddice «metti il logo senza sfondo bianco»: già nel preloader è una domanda aperta (spec:383, domanda 8). Un disco è anche una curva di superficie. (C19 · C01)
ESCLUSO: Ombra, alone, mix-blend-mode difference o filtri per staccare il cuore dalla foto — Niente ombre di scatola, blur o veli (DESIGN.md:580). L'ombra di testo è ammessa solo sulle lettere dei quattro punti dichiarati (DESIGN.md:583). Blend difference e invert ricolorano il marchio, e il test li vieta esplicitamente (logo-colore.test.ts:82-89). (C14 · C19 · logo-colore.test.ts)
ESCLUSO: Il verso della rotazione che si inverte scorrendo all'indietro — Era calcola `dir = sign(velocity)` e moltiplica la velocità per dir (main.pretty.js:1391-1392, 1402). La cliente ha chiesto il cuore sempre orario, e il codice oggi usa solo `Math.abs` (RotatingMark.tsx:73). (C06)
ESCLUSO: Scrollbar custom o barra di avanzamento con riempimento rosso, numero percentuale e thumb trascinabile (initScrollBar) — Il progresso di pagina è stato costruito e tolto due volte: `.scroll-progress` nel 2026-07 (docs/DESIGN.md:114-116; memoria domus-wow-layer.md:30) e ThreadNav col redesign (spec:215; git 3cee992). È WOW layer contro «eliminare tante animazioni». Il thumb che pilota `lenis.scrollTo` in 3.2 s (main.pretty.js:1434-1436) dirotta lo scroll. L'etichetta numerica rischia di scendere sotto i 16 px. Il rosso contato non regge un altro riempimento su ogni schermata (DESIGN.md:347). (C03 · C04 · DESIGN.md:347 · DESIGN.md Don't :587)
ESCLUSO: Tacche dell'anello che si accendono di rosso con l'avanzamento della pagina — È un indicatore di progresso travestito, ricade nel caso sopra, e dà all'anello ornamentale (MarkBadge.tsx:16-17) un ruolo nuovo di ornamento disegnato animato. (C12 · C03 · DESIGN.md:347)
ESCLUSO: Testata fissa da lg per tenere il logo sempre a schermo come il .header-logo fixed z-1200 di Era — La barra fissa è proprio ciò che D14 e il giudizio di Alberto sul «menu sopra» hanno tolto: «nessuna barra fissa su ogni schermata» (Header.tsx:199-201; DESIGN.md:488-490; spec:402, 428). Il riferimento visivo goldengoal scorre via. Al più si fissa il solo segno (P2), non la testata. (D14 · A13 · C02)
ESCLUSO: Cuore rotante sempre visibile sotto i 1280 px (telefono e tablet, nella testata sticky) — Sotto xl il badge accanto al cuore del logo leggeva come «un errore di montaggio» (Header.tsx:215-220; DESIGN.md:529). Sotto lg la testata sticky ha già il suo feedback (fondo avorio profondo e hairline dopo 24 px, Header.tsx:63, 204). Il touch non è lisciato da Lenis (SmoothScroll.tsx:6): la velocità arriva per eventi nativi e si azzera a 400 ms (lenis.mjs:649-671), quindi la rotazione andrebbe a scatti. (A13 · DESIGN.md:488 e :529)
ESCLUSO: Scambio di tono per WhatsAppFloat, MobileActionBar e banner cookie — Non serve, e ricolorerebbe CTA rosse. Il cerchio rosso pieno (WhatsAppFloat.tsx:39) e la barra avorio opaca con hairline (MobileActionBar.tsx:88) si leggono su qualunque foto. Il banner è `bg-paper` con bordo ink (CookieConsent.tsx:197). (DESIGN.md:342 e :347 · A11)
