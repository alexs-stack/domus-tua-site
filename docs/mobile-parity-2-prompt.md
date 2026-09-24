# Prompt — Onda «Stessi effetti su mobile» (parità mobile 2)

> Uso: apri una nuova sessione Claude Code nella root del repo e incolla tutto
> ciò che sta sotto la riga — oppure scrivi: `esegui @docs/mobile-parity-2-prompt.md`.
> Con Ultracode acceso. Il piano è in fasi con un punto di stop dopo la Fase 0.
>
> Da dove viene: reverse engineering di https://lusion.co/ e
> https://www.era-residence.com/ (2026-08-17, dossier locali in
> `reverse-engineering/`, gitignored — vedi Appendice A) + inventario riga per
> riga di ciò che Domus Tua fa oggi di diverso sotto 768/1024 px. Ogni fatto
> citato qui è stato letto nel sorgente e passato da due contro-verifiche
> adversariali (30 + 4 agenti; le imprecisioni trovate sono già corrette nel testo).

---

## RUOLO

Sei il senior motion + front-end engineer che ha in carico il sito Domus Tua
(`domus-tua-site`, Next 16 App Router, GSAP + ScrollTrigger + Lenis). La
richiesta del cliente è nuova e ribalta la dottrina dell'onda precedente:

> «Nei due siti di riferimento la versione mobile **tiene gli stessi effetti,
> preloader compreso**. Dobbiamo fare la stessa cosa.»

L'onda precedente (`docs/mobile-parity-prompt.md`, eseguita e chiusa in
`docs/mobile-parity.md`) ha lavorato per «parità di **intento**, non di
implementazione»: sul telefono l'intro ha *meno atti* (1,75 s contro 4,63 s),
dodici set piece sono stati **tradotti** in reveal più semplici, undici Fioriture
d'angolo, nove parallassi su dodici e il frame-in dell'hero sono **spenti**.
Il risultato è un sito che sul telefono è composto e veloce, ma che un cliente
con in mano ERA e Lusion legge come *un altro sito, più povero*.

La tua missione è **parità di effetto**: lo stesso effetto, con **parametri
adattati** al telefono (larghezze, distanze, dimensioni degli asset), non un
effetto diverso e non un effetto in meno. È il modello che ERA usa per il
preloader (stessa timeline da 10,15 s su mobile, cambiano tre costanti) e che
Lusion usa per la scena WebGL (stesso motore, asset a definizione più bassa).

Ultracode è acceso: usa il tool `Workflow` (agenti in parallelo per fase, e una
verifica adversariale finale sul diff). Non si spedisce da una passata sola.

---

## 1. LEGGI PRIMA (obbligatorio, prima di scrivere una riga)

1. `AGENTS.md` — **questo non è il Next.js che conosci.** Leggi la guida
   pertinente in `node_modules/next/dist/docs/` prima di toccare qualunque cosa
   di Next. Rispetta le deprecazioni.
2. `app/lib/motion/gsap.ts` — il **vocabolario del motion**: `dur`, `stagger`,
   `dist`, le CustomEase `domus`/`domus.inOut`/`dtDiveIn`/`dtOut`/`dtHorScroll`/
   `dtLoader`, e `MQ` (`desktop` 768 / `lg` 1024 con i gemelli `belowDesktop`
   767.98 / `belowLg` 1023.98, `finePointer`, `coarse`). Non lo aggiri: lo usi.
   Il commento a `gsap.ts:105-107` che dice `belowDesktop` e `coarse` «senza
   chiamanti» è vecchio: `belowDesktop` ne ha tre (HeroCinematic:230,
   CameraIn:61, Preloader:197); `coarse` zero. Correggilo di passaggio.
3. `docs/mobile-parity-prompt.md` e `docs/mobile-parity.md` — **la storia**: cosa
   è stato deciso, misurato e perché. Non la rifai: la superi con cognizione.
   In particolare §5 (l'intro e i «sette orologi»), §6 (difetti latenti — vedi
   §7.3 qui), §9.1 (il cancello dell'LCP: prima il banner cookie), §11-12 (le
   misure e l'imputato vero del TBT). Alcuni verdetti lì scritti non sono più
   nel codice (§3.6 qui sotto).
4. `docs/effetti-reference.md` (un effetto va in una sezione sola — riga 14),
   `docs/wow-layer-plan.md` (inventario dei fixed, regole di stacking, la
   trappola del `refresh()` alla riga 33), `docs/performance.md` +
   `lighthouserc.js` (il budget — `docs/performance.md` è superato: numeri veri
   in `docs/mobile-parity.md` §11-12), `docs/e2e.md` + `playwright.site.config.ts`
   (i cinque viewport, il tag `@layout`).
5. I dossier di reverse engineering (locali, gitignored — Appendice A):
   `reverse-engineering/lusion/README.md`, `reverse-engineering/era-residence/README.md`
   e **`reverse-engineering/era-residence/MOBILE.md`** (tabella tween per tween
   del preloader ERA mobile vs desktop), `reverse-engineering/domus-tua-gap-mobile.md`
   (l'inventario di Domus Tua, con file:riga). Se la cartella non c'è,
   ripristinala come da Appendice A. Se un dossier contraddice il codice, vince
   il codice.
6. Memoria di progetto: `era-residence-reverse-engineering`, `mvp-scope-client-brief`,
   `launch-readiness-audit`.

Non riassumermeli. Leggili e lascia che vincolino il lavoro.

---

## 2. COSA FANNO DAVVERO I DUE RIFERIMENTI SU MOBILE

Verificato nel sorgente (bundle prettificati, CSS, HTML servito con UA iPhone) e
dal vivo a 375×812. Questa è la **norma** contro cui misurare Domus Tua.

### 2.1 Il preloader

| | **lusion.co** | **era-residence.com** |
|---|---|---|
| Stesso DOM su mobile | sì (`#preloader` + 3 cifre rotanti; unica regola CSS mobile: `font-size: clamp(7em,8vw,20em)` → `13vw` sotto 812) | sì (`.preloader` completo: logo, progress, **mask a 4 layer** su `[data-preloader]` — 3 gradienti + `preloader_arch-l.svg`, `mask-composite:add` — e `preloader_bg_arch` con 2 archi di contorno `_is-1/_is-2`) |
| Stessa timeline/durate | sì, nessun branch mobile nella classe `Preloader` (min. ≈3 s + attesa font: carico ≥1 s con compile shader ≥0,25 s in parallelo → barra→«L» 1 s → uscita 1 s; in pratica domina il compile) | sì: **intro ≈10,15 s** su entrambi (prima visita), **short ≈3,75 s** su entrambi (visite successive, `sessionStorage.hasVisited`) |
| Cosa cambia | solo la dimensione delle cifre e `pixelWidth = min(42, vw/30)` | **tre costanti JS**: `--arch-w` 40→50→125 vw (desktop 24→36→125), hero scale iniziale **1,15→1** (desktop 0,75→1: direzione opposta); in CSS ≤991: «Costa/del Sol» `display:none`, progress fill 23,08 vw (= 90 px @390; desktop 6 vw = 115 px), tipografia via `scale-ratio 4.16` |
| Progresso | **reale**: quick-loader, peso per asset, 70 % rete + 30 % compile; nessun timeout, nessun failsafe, nessuna logica di seconda visita | finto (4 s `loaderEase`), `hasVisited` per la versione corta |
| Skip | no (solo `?SKIP_ANIMATION=1`) | no (nessun listener touch/click sul preloader) |
| Scroll durante | scroll virtuale sempre (wheel/gesture `preventDefault` globali) | `lenis.stop()` + `overflow:hidden`; con Lenis fermo il `touchmove` è `preventDefault`-ato → la pagina non scorre neanche a dito |
| Reduced-motion | **0 occorrenze** in CSS e JS | **0 occorrenze** |

### 2.2 Il resto della pagina

| | **lusion.co** | **era-residence.com** |
|---|---|---|
| Rilevamento | UA (`browser.isMobile`) per asset/feature; **larghezza ≤812** (`useMobileLayout`, al resize) per layout; `IS_SMALL_SCREEN` (min lato ≤820) per i LOD 3D. Nessun `pointer:coarse`. `html.is-mobile` messa ma non usata dal CSS. Confronti hardcoded misti (`>812`, `>=812`, `<=812`) | **una sola soglia: 992** (`breakPoint`, `innerWidth`/`gsap.matchMedia`) + un unico test `pointer:coarse and hover:none` per il landscape cover. Nessun UA per il layout |
| Scena/effetto principale | **stessa scena WebGL2** su tutti: `DPR = min(1,5, dpr)`, tetto **2560×1440 px** con downscale proporzionale, SMAA, `dt` clampato a 1/20 — identici su mobile e desktop | hero: **stesso zoom 1→2 in scrub**; sotto 992 spariscono i due tween di parallasse y (testo e sfondo) e lo scale va in coda (`">"`) invece che sovrapposto |
| Asset a definizione più bassa su mobile | **sì, sistematici**: `cross_ld.buf` 124 KB vs 283 KB (2 156 vs 4 940 vertici), `matcap_ld.exr` 172 KB vs 603 KB, `stickers_low.png`, `reel/mobile.mp4` 2,3 MB vs 5,0 MB (soglia ≤560), `/mobile_video/`, `/mobile_image/`, particelle 128×128 vs 128×192, rocce 48 vs 64, 22 palloncini vs 24, bloom 5 iterazioni invece che FFT | **no**: HTML byte-identico (223 KB), hero senza variante mobile (probabile 1600w = 379 KB su 390 px), **tutto il JS** scaricato (≈699 KB raw / ≈219 KB gz; Lottie 305 KB + JSON 772 KB per un hover nei crediti), fiori `.mov` HEVC 8-10 MB l'uno su iOS |
| Cursore custom | 2 follower locali `display:none` sotto 812 | nessuno |
| Hover | 17+2 blocchi dentro `(hover:hover)`, un solo hover fuori gate (`.footer-socials-line-wrapper:hover`, + reset `a:hover`); **nessuna alternativa touch** (`:active` solo nel reset, `:focus-visible` = 0); JS non registra `mouseenter` in `useMobileLayout` solo per item progetto ed end-section, gli altri listener sono registrati ovunque e restano inerti al tocco | hover CSS dei componenti principali (btn, nav, card, social, tab) gated `≥992`; 6 blocchi minori non gated; magnetic e floating tips solo desktop |
| Split testo | SplitType **revertito solo in 4 sezioni** (featured, goal, projects, end) su 25 `new SplitType`; titolo hero della home, footer e about-client **restano splittati e animati per parola** a ogni larghezza | SplitText **attivo** su mobile (chars/words/lines, stessi reveal) |
| Pin / orizzontale | scroll virtuale su canvas (0 `position:sticky`); l'about orizzontale (350 vw) sotto 812 **resta pinnato per 11,25 vh** (`padding-bottom: 1125vh`) con le tre sottosezioni `position:absolute` sovrapposte in **crossfade** (pan X → 0) | scroller orizzontale concept/location → **colonna** (`flex-flow:column`, `position:static`); cupola arch → statica; snap sezioni, scrollbar custom, magnetic, floating tips → **tolti**. Restano: parallassi (`data-parallax`, salvo 2 `data-mob="off"`), zoom amenities, textPath benefits, Barba, logo rotante |
| Logo rotante | — | **gira anche su mobile**, stesso ticker 30°/s e stessa modulazione dalla velocità di scroll (che Lenis emette anche in modalità nativa touch); SVG `b-mob` viewBox 80 al posto di `b-desk` viewBox 120 |
| Scroll | custom ovunque (`translate3d` su `#page-container`; drag-scroll touch con attrito) — **ruba lo scroll nativo** anche su mobile | Lenis montato ma **touch nativo** (`syncTouch` default `false`; `touchMultiplier:2` inerte) |
| Unità viewport | `--vh` = `innerHeight × 0,01` scritta al resize; `dvh/svh` = 0; `safe-area-inset` = 0; `user-scalable=no` | `--_100svh` = `innerHeight` **fissato al load** (mai aggiornato); `--arch-y` in `vh` puri; `dvh/svh` = 0 |
| Chrome nascosto su mobile | bottone audio, testo Menu/Close, croci decorative, «PLAY REEL», `scroll-nav-cross-line` | tab day/night dell'hero, pin hotspot, `.b-desk` (35 nodi), scrollbar custom |
| Aggiunto solo su mobile | «Swipe to change», bottone chiudi video, CTA reel sempre visibile | **landscape cover** che blocca l'uso in orizzontale sui telefoni; nav `f-mob` |
| Font | identici (Aeonik, IBM Plex Mono; `font-display:block`, nessun preload) | identici (Adobe Fonts kit) |

### 2.3 Le tre lezioni (e le due che NON copiamo)

1. **Il preloader è lo stesso oggetto** su mobile: stesso DOM, stessa timeline,
   stessi ease. Cambiano *parametri* (larghezza dell'arco, dimensione della
   progress, direzione dello scale dell'hero). ERA tiene **10,15 s** su un
   telefono. Nessuno dei due taglia atti.
2. **Il costo si governa con gli asset, non togliendo effetti.** Lusion tiene
   identico il motore e serve modelli/texture/video a definizione più bassa
   (`_ld`, `_low`, `mobile.mp4`), con DPR a 1,5 e un tetto di pixel. È il modello
   giusto per la sagoma webp del preloader, per l'hero e per ogni immagine grande.
3. **Ciò che davvero non ha equivalente touch resta spento — ma è pochissimo:**
   cursore custom, magnetic, hover. Sui **pin orizzontali** i due riferimenti
   divergono: ERA porta lo scroller in colonna; Lusion **tiene il pin** (11,25 vh)
   e trasforma il pan orizzontale in crossfade sotto pin. Il pin lungo noi non lo
   copiamo per la **legge 4** (scelta nostra, non «perché lo tolgono entrambi»):
   si porta la *timeline* che il pin guidava, agganciata allo scroll verticale.

Le due cose che i riferimenti fanno e noi **non copiamo**: (a) ignorare
`prefers-reduced-motion` (0 occorrenze in entrambi) — noi lo rispettiamo, è un
vantaggio non un difetto; (b) rubare lo scroll nativo (Lusion) o bloccare il
landscape (ERA) — la nostra regola «mai rubare lo scroll» resta.

---

## 3. DOVE SIAMO — cosa Domus Tua fa oggi di diverso sul telefono

Verificato contro il codice al `c4bccf8` (2026-08-17). **Riverifica ogni riga
prima di agire**; se una riga è vecchia, dillo e correggila.

### 3.1 Il preloader — stesso gesto, meno atti

Boot: `app/layout.tsx:61` mette `data-preloader` a **ogni larghezza** (la soglia
768 è caduta il 2026-08-11); failsafe 1 800 ms sotto 767.98, 2 500 sopra.
**`PreloaderMount` sta nel root layout senza check di rotta: l'intro suona su
qualunque URL d'ingresso** (senza hash), non solo sulla home.

| Atto | Desktop (`Preloader.tsx`) | Telefono oggi | ERA mobile (per confronto) |
|---|---|---|---|
| I · lockup (titolo, script, caps, payoff) | GSAP **per lettera**: chars `yPercent 50 / rotateY 90`, 1,3 s, stagger .075, `dtOut` (:431-443); script `rotateX 90`, stagger .065 (:444-462); caps stagger .11 (:463-468); payoff `yPercent 110` (:469-474) | **CSS per riga** sui contenitori `[data-pre-line]`/`[data-pre-sline]`/`[data-pre-word]` (`globals.css:1767-1844`: `dt-pre-in-line` 0,55/0,5 s, `dt-pre-in-side`, ultimo keyframe a 0,77 s); nessun tween per lettera; caps `hidden md:flex` (:705) → **non esistono** | SplitText chars/words/lines identici a desktop |
| II · linea di carica | **verticale**, 1 px × 64 px, riempita con `yPercent -100→0`, `dtLoader` 1,55 s (:481-488, markup :726-727) | **assente** (`display:none` `globals.css:1822-1824` + `if(!mobile)`) | progress fill 90 px @390 (23,08 vw; desktop 115 px) |
| III · porta ad arco | `domus.inOut`, 24→36 vw / 15 vh, 1,1 s da t=2,25 | stessa ease, 40→58 vw / 16 vh, **0,7 s da t=0,25** | 1,5 s identici, 40→50 vw |
| IV · tuffo | `dtDiveIn`, →125 vw / −100 vh, 1,5 s da t=3,13 | stessa ease, →165 vw, **0,8 s da t=0,95** | 2,4 s identici |
| anelli eco | presenti: due div `absolute` con `width/height/top` in `calc()` di `--arch-w/--arch-y` (`globals.css:1722-1743`), fanno layout per frame — «debito noto» :1826-1831 | `display:none` (:1832-1834) | — |
| MarkBadge | `spinMarkBadge(root, 6)` GSAP repeat −1 (:311) | **uguale** | — |
| Warmup | `warmAllImages` + `runWarmup(4500)` — richiesta cliente «caricare tutto prima di entrare» (:318-321) | `warmFirstFold(1400)` (:338-345) + registro via `scheduleIdleWarmup()` **dopo** l'handoff, in `finish()` (:230) | — |
| `will-change` lettere | `html[data-preloader] .dt-pre-char { will-change: transform }` ≥768 (`globals.css:270-274`): dura tutta l'intro | assente | — |
| **Totale** | **4,63 s** (ripiego clip-path 3,50) | **1,75 s** (ripiego 1,30); e2e asserisce <1 900 ms (`e2e/mobile-motion.spec.ts:421`) | **10,15 s** |
| Skip | click/tasto → `tl.seek("dive")` (suona il tuffo) | **primo tocco**, stesso `seek("dive")` | nessuno |
| Sessione | una volta (`dt-intro-seen`) | uguale | `hasVisited` + versione corta sempre |

### 3.2 I set piece — dodici tradotti (≥1024 desktop, altro gesto sotto)

`HorizonScroller` (colonna con reveal a blocco, stairs fermi per misura :161-170,
niente chars split — :89-222), `StarReviews` (sola accensione tiles/aloni once,
sweep in pausa — :234-353; il morph desktop rimisura `getBoundingClientRect` e
riserializza il clip-path a ogni frame :384-386), `ReviewsWall` (batch per
tessera y24/opacity — :100-186), `Paths` (clip-path dall'alto + punti x±48,
niente SplitText; lo scale mobile 1,06→1 tolto il 2026-08-11 :288-294; il
desktop ha 1,35→1,18), `TeamTrail` (scia scrub per pannello; niente corridoio 3D
— che è un pin: `.dt-tt[data-on]` `len×140vh+100svh`, schermo sticky, unità
`absolute inset:0` in un mondo `preserve-3d`, `globals.css:2437-2465` — né
canvas atmosfera — :146-184), `ThreadNav` (riga in alto `scaleX`, nodi
`aria-hidden` — :208/:299; `watchSurfaceTone` spento perché scrive `data-tone`,
:266-277), `ManifestoPin` (scrub senza pin :69), `LiquidReveal` (clip-path al
posto del filtro SVG :49/:66), `Footer` (colonne y26/opacity al posto
dell'uncover :67/:69 — l'uncover ha una guardia propria: `footer.offsetHeight >
innerHeight → columnsEnter()` :69-73), `CameraIn` (y24/opacity once al posto di
scale .96→1 in scrub :41/:61), `HeroCinematic` frame-in (sotto 768 sola deriva
`yPercent 6.5` :230-253; il commento :178-184 dice che «non torna sul telefono»),
`PageTransition` (solo l'**uscita** accorciata: arco 0,5 vs 0,65 s :286/:292;
l'entrata è identica).

### 3.3 Spento sul telefono

`Cursor`/`Magnetic`/`HoverDistort`/parallasse puntatore di `FeaturedTestimonial`
(tutti `finePointer` — **corretto**, i riferimenti fanno lo stesso; ma il chunk di
`Cursor` viene scaricato lo stesso: `ChromeMount.tsx:16,27` lo monta
incondizionatamente); **Fioritura d'angolo ×11** (`hidden lg:block` ai call-site;
la 12ª, `Team.tsx:138` `variant="center"`, gira; cap particelle 1 500 fisso per
le d'angolo, 2 200/3 500 solo per la variante `word` sotto una soglia **locale**
640 — `Fioritura.tsx:291-292`; canvas a `min(dpr, 2)` :350); **`Parallax` su
9/12 call-site** (default `mobile=false`; passano `PageHero:121`,
`FeaturedTestimonial:225`, `OpenDomus:222`; non passano Authority:222,
EditorialRows:70/:95, DomusDocProtocol:307, OpenDomus:271, Services:433,
Team:238, Reviews:221, LavoraConNoiContent:1007); scroll cue dell'hero (`hidden
md:block` :822); footer uncover; **`<video>` dell'hero** (`HeroCinematic.tsx:567`
solo `MQ.desktop`; oggi `heroCinematic.enabled=false` in `media.ts:18`, quindi
il gate non decide nulla — ma il video hero è core dell'MVP); anelli eco, linea
di carica e caps del preloader; canvas atmosfera di TeamTrail;
`watchSurfaceTone` di ThreadNav.

Nota `WordReveal`: il default `mobile=false` è spento (gate CSS
`[data-wr-mobile]`), ma l'unico chiamante — `CareerApplication:491` — lo passa:
oggi nessun titolo WordReveal è fermo sul telefono. Il lavoro è togliere l'opt-in
(default `true`), non accendere qualcosa.

### 3.4 Già identico a ogni larghezza (non toccare)

`MaskReveal`, `TextLines`, `CharFlip`, `ToneShift` ×3, `SurfaceFlow`,
`SurfaceVeil`, `Atmosphere`, `KineticStrip`, `VelocityMarquee`, `Odometer`,
`ScrubWords`, `DrawOnScroll`, `SectionDivider`, `RotatingMark` (si arma anche su
`touchmove` :159), `Reveal`, Social pill, ingresso di `FeaturedTestimonial`,
`PageHero`, `Header`, ingresso lettere di `HeroCinematic` (dur.hero 1,4, stagger
.08/.07/.032), entrata di `PageTransition` (0,9 s `dtDiveIn`), Lenis (touch
nativo, `syncTouch` mai — **resta così**), input 16 px sotto 768, `tap-target`
44 px, `MobileActionBar`, `dvh/svh`. **Le rotte con solo `MQ.motionOk`** —
`/case/[slug]`, `ListingsGrid`, `PropertySearch`, `CaseQuickLook`,
`HomeSearchGateway`, `ContattiContent` — sono già identiche: nessun lavoro.

### 3.5 Il budget, e la verità sul TBT

`lighthouserc.js`: form factor mobile 390×844, Slow-4G, CPU ×4, `/` e `/acquista`,
cookie `dt_consent=accepted`; asserzioni **error**: perf ≥0,90, a11y ≥0,95, SEO
≥0,95, CLS ≤0,1, **LCP ≤2 500 ms, TBT ≤300 ms**. Il commento :61-63 («il cookie
salta il preloader») è falso: il preloader dipende da `sessionStorage`, Lighthouse
suona **sempre** l'intro — anche su `/acquista`.

Le misure più recenti (`docs/mobile-parity.md` §11-12): home perf **0,50**, LCP
9 812 ms, TBT 1 045 ms in Lighthouse simulato; con throttling **applicato** (sonda
CDP) LCP a freddo 1 724 ms; **TBT proxy a freddo 3 561 ms vs a caldo 3 908 ms →
l'intro non aggiunge TBT** (§12.1); dopo il gate su Trustindex 2 898 ms (§12.3);
**imputato: l'idratazione di react-dom (~2 s)** per ~15 componenti client di
motion e ~1 774 nodi (§12.2/12.4). Lusion (Astro + canvas) ed ERA (Webflow +
jQuery) **non hanno questo costo**: è strutturale nostro, e non è di questa onda
(§7.1). Il gate CI della home è rosso oggi, prima di te. **La sonda CDP di §12.1
non è mai stata committata** (in `scripts/` non c'è nulla con throttling CDP):
la scrivi tu in Fase 0 (§8).

### 3.6 Doc e commenti già disallineati dal codice (da correggere in Fase 0)

`docs/mobile-parity.md` §3 verdetti 1, 3, 4, 5, 10 e §5.2/§5.4; `docs/performance.md`
(80 / 5,4 s / 80 ms; intro «~2,2 s»); `lighthouserc.js:61-63`;
`SmoothScroll.tsx:67-70` (dice ancora che sotto 768 l'attributo non c'è);
`Parallax.tsx:33-36` («lo passano sei»); `gsap.ts:105-107`; `e2e/mobile-motion.spec.ts:428`
(righe CSS 1583-1591 → oggi 1590-1598); i commenti di `layout.tsx` («1,7 s contro
4,63 s», «sul telefono è 1,8 s») e di `Preloader.tsx` («BUDGET DEI DUE MONTAGGI»)
diventeranno falsi con la Fase 1. Elenco completo in
`reverse-engineering/domus-tua-gap-mobile.md` §9.

---

## 4. DOTTRINA — «stesso effetto, parametri adattati»

Sette leggi, in ordine di priorità. Le prime tre **ribaltano** l'onda precedente;
le altre quattro la confermano.

1. **PORT è il verdetto di default.** Stesso timeline, stessi ease, stessi atti,
   sul telefono; cambiano *solo* i numeri che dipendono dalla geometria (vw/vh,
   distanze, durate legate alla distanza, dimensioni degli asset). Come ERA col
   preloader. «Tradurre il gesto» (legge 1 dell'onda precedente) diventa
   l'**eccezione**, ammessa solo per la legge 4 o per un costo di *paint* che
   nessun asset può togliere (criterio §5).
2. **Il costo si paga con gli asset, mai con gli atti.** Prima di togliere un
   effetto per motivi di peso: asset più leggero (variante mobile della sagoma,
   `<source media>`, `_ld` come Lusion), DPR di ciò che si disegna a 1,5,
   `will-change` solo per la durata del tween, misure per frame fatte una volta
   su `refresh`. Un effetto che «costa troppo» è un effetto con l'asset sbagliato.
3. **Il tempo dell'intro è lo stesso.** ERA tiene 10,15 s sul telefono; noi
   teniamo i **4,63 s** del desktop, con gli stessi atti. Non «≤1,8 s». Se una
   misura obbliga a scendere, si scala il `timeScale` dell'intera timeline
   (tutti gli atti proporzionalmente), non si tagliano atti — con **una sola
   eccezione**: la variante corta di §6.3-b, decisa da condizioni di *device*,
   mai di larghezza.
4. **Mai rubare lo scroll.** Confermata: pin sul telefono ≤1,2 viewport e sempre
   uscibile continuando a scorrere; niente `syncTouch`; Lenis resta touch-nativo;
   niente scroll virtuale (Lusion), niente landscape bloccato (ERA).
5. **Il dito non ha hover.** Cursor, Magnetic, HoverDistort, parallasse
   puntatore restano spenti — è quello che fanno i riferimenti. Non si inventano
   equivalenti touch. `MQ.coarse` decide *solo* ciò che riguarda il puntatore
   (questi quattro, il chunk di Cursor non scaricato, lo skip al tocco).
6. **Reduced-motion e no-JS restano completi.** I riferimenti non lo fanno; noi
   sì. Stati nascosti solo da JS, mai in SSR/CSS base (regola di casa).
7. **Una regola sola per la larghezza.** `MQ` di `gsap.ts` è l'unico posto in
   cui si decide «telefono/tablet/desktop»; niente costanti locali (la soglia
   640 di `Fioritura.tsx:291` diventa `MQ.sm`/`belowSm`), niente UA sniffing. I
   rami di larghezza sono keyed **solo su larghezza**: `MQ.desktop`/`belowDesktop`
   per gli effetti di sezione, `MQ.lg`/`belowLg` per i set piece — come ERA con
   la sua unica soglia. **La fascia 768-1023 (tablet)** riceve: preloader con
   parametri desktop, frame-in hero/CameraIn/Parallax/video come desktop, set
   piece in PORT-SENZA-PIN, Fioritura con cap 3 500 e box mobile. Un iPad in
   landscape a 1024 riceve i pin desktop come oggi: fuori scope. Ogni riga di
   §5.1 dichiara la propria soglia.

Regola Chanel invariata: per ogni effetto che accendi sul telefono, **nomina cosa
alleggerisci** (un asset, un `will-change`, una misura per frame, un nodo) nel
corpo del commit.

---

## 5. I VERDETTI — uno per effetto, col criterio nuovo

Lavora la tabella riga per riga. Per ciascuna: cosa fa il desktop, cosa costa,
quale parametro cambia sul telefono, cosa dicono i riferimenti, **dove vive**
(quali rotte). Poi **uno** di:

- **PORT** — stesso timeline, parametri adattati (default).
- **PORT-SENZA-PIN** — stessi tween, agganciati allo scroll verticale senza pin
  (o con pin ≤1,2 vh). Per i set piece orizzontali/pinnati.
- **KEEP OFF** — solo per la legge 5 (puntatore). Serve la riga di motivazione.
- **TRANSLATE** — solo se PORT/PORT-SENZA-PIN è impossibile e la ragione è
  scritta e non è «costa». Non è più il default.

**Criterio del paint** (per non contraddirsi fra righe): `transform`/`opacity`
sono composited; `clip-path`/`mask` per frame sono *paint* ammesso dalla regola
di casa, a patto di nominare l'alleggerimento (misura una volta, `will-change`
scoped); un **filtro SVG rasterizzato** (`feTurbulence` & co.) per frame è paint
che nessun asset alleggerisce → TRANSLATE. Questo è il motivo per cui
`LiquidReveal` resta tradotto e `StarReviews`/`HeroCinematic` no.

Scrivi verdetto, soglia, rotte e motivazione in `docs/mobile-parity-2.md` man mano.

### 5.1 Verdetti raccomandati (li confermi o li ribalti con prove)

| Effetto · soglia · dove vive | Oggi sotto la soglia | Verdetto | Parametri / vincoli |
|---|---|---|---|
| **Preloader** · 768 · tutte le rotte | atti tagliati, 1,75 s | **PORT** | §6: stessi 4 atti, 4,63 s, `will-change` a tempo, sagoma in variante mobile, anelli eco su transform |
| **HeroCinematic frame-in** · 768 · `/` | sola deriva | **PORT** | `yPercent 6` + `scale 1,05` sono transform; il `clip-path inset(… round 2.5rem)` è paint per frame: alleggerimento nominato = `will-change: clip-path` scoped allo scrub **oppure** cornice via `border-radius` + `scale` su un wrapper `overflow:hidden` (solo transform). Il verdetto **ribalta esplicitamente** il commento `HeroCinematic.tsx:178-184`, da riscrivere. Cornice `SegnoDomusVideoFrame`: resta |
| **HeroCinematic «resto»** al primo gesto · 768 · `/` | touchmove: reveal `dur.micro`/`stagger.chars` senza stop | **PORT già in essere** | stessa trasformazione (opacity + y); il **tempo** è il parametro adattato, misurato in `:493-502` (sul dito la pagina non si ferma, legge 4). Non riportare `dur.short/.08` senza il fermo |
| **HeroCinematic `<video>`** · 768 · `/` | solo poster | **PORT con asset mobile** o **KEEP OFF motivato** — deciso in Fase 0 | se esiste/può esistere `hero-mobile.mp4` ≤ 3 MB (`preload="none"`, `muted playsInline`, montato dopo `dt:intro:done` e dopo il paint del poster), PORT con `<source media>`; altrimenti KEEP OFF «manca l'asset». Il poster resta candidato LCP; niente video con `saveData`/2g. Lusion serve `reel/mobile.mp4` |
| **CameraIn** · 768 · Contact (`/`, `/contatti`), Stats (`/chi-siamo`, `/recensioni`), `/lavora-con-noi` | y24/opacity once | **PORT** | scale .96→1 + y30 in scrub; il commento :54-60 («legge come un'oscillazione») va **rimisurato** con distanze dimezzate prima di dargli ragione |
| **Fioritura d'angolo ×11** · 1024 · Contact, DomusDocProtocol, FeaturedTestimonial, Footer, HorizonStory (×4), Method, Paths, Services, Team, TeamTrail | `hidden lg:block` | **PORT** | soglia 640 → `MQ.sm` (legge 7); canvas `min(dpr, 1.5)` sotto `lg` (alleggerimento nominato); cap dedicato alle d'angolo sotto `sm` (oggi 1 500 fisso); **al massimo una Fioritura per sezione** a 390 (regola effetti-reference:14) — in HorizonStory una sola delle quattro, dichiara quale |
| **Parallax 9/12** · 768 · PageHero (12 rotte), Authority, EditorialRows, Reviews, Services, Team, OpenDomus, FaqContent, LavoraConNoi | default `mobile=false` | **PORT** | default `mobile=true` con `speed` dimezzato; ERA tiene le parallassi salvo 2 `data-mob="off"` — chi resta spento lo dichiara con `mobile={false}` esplicito + commento «mob off (motivo)», niente attributi nuovi |
| **WordReveal** · 768 · Contact, CareerApplication | opt-in già passato | **PORT** | default `mobile=true`, togliere l'opt-in (nessun titolo è fermo oggi) |
| **Scroll cue hero** · 768 · `/` | `hidden md:block` | **PORT** | visibile, dimensione ridotta, sopra `MobileActionBar` (`env(safe-area-inset-bottom)`) |
| **PageTransition uscita** · 768 · tutte | 0,5 / 0,32 s | **PORT** | 0,65 / 0,45 s come desktop (l'entrata è già identica) |
| **Footer uncover** · 1024 · tutte | colonne y/opacity | **PORT condizionato** | la guardia propria `footer.offsetHeight > innerHeight → columnsEnter()` (:69-73) va misurata a 390 in Fase 0: se il footer supera 100 svh (probabile: colonna singola + `pb-28`) → uncover **parziale** (fixed solo l'ultimo blocco ≤100 svh, colonne sopra in flusso) o TRANSLATE motivato. Variabile `--dt-footer-h`. Conflitto con `MobileActionBar` = seconda condizione: se al termine del settle parte del footer resta sotto la barra o il `pb-28` copre la CTA (`elementFromPoint` sui link) → TRANSLATE |
| **ManifestoPin** · 1024 · `/metodo` | scrub senza pin | **PORT-SENZA-PIN** (pin ≤1,2 vh) | il pin da +160 % è oltre la legge 4 → pin corto o scrub. Decidi con misura |
| **LiquidReveal** · 1024 | clip-path | **TRANSLATE confermato** | filtro SVG rasterizzato per frame (criterio del paint) |
| **ThreadNav** · 1024 · `/`, `/acquista`, `/vendi`, `/metodo`, `/open-domus` | riga in alto, nodi inerti | **PORT dei nodi** | i nodi tornano bottoni: tacche sulla linea con `::before` 44×44 (`.tap-target`), ≥8 px fra loro, `z` fra Header e main, `aria-label`, niente menu a comparsa; `watchSurfaceTone` **solo dopo** aver disaccoppiato l'attributo (§7.3 trappola 1) |
| **HorizonScroller** · 1024 · `/` | colonna con reveal | **PORT-SENZA-PIN** | stessi tween (chars `rotateY`, slide 1,6 s, fiori drift) sullo scroll verticale, track non pinnato; **stairs `xPercent` da rimisurare** a 390 con i valori desktop (±5/25/15 %) — `:161-170` documenta perché sono ferme (righe che si toccano): se si toccano, stairs ferme = TRANSLATE motivato, il resto resta PORT-SENZA-PIN. Niente carosello (mobile-parity §3.1 resta valido) |
| **StarReviews** · 1024 · `/` | accensione once | **PORT-SENZA-PIN** | morph + zoom + flash come **timeline `once` a tempo** (l'idioma dell'accensione di oggi), NON in scrub su runway ≤1,2 vh (con schermo sticky 100 svh restano 0,2 vh: spazio insufficiente); alleggerimento nominato: rect dello schermo misurato una volta su `refresh` (oggi per frame, `:384-386`) e `will-change: clip-path` solo durante il morph; le chars stirate sì; il sweep CSS resta |
| **ReviewsWall** · 1024 · `/`, `/recensioni` | batch per tessera | **PORT-SENZA-PIN** | parallasse dei wrapper in scrub e griglia 2 col; niente runway 520 vh |
| **Paths** · 1024 · `/` | clip-path + punti | **PORT-SENZA-PIN** | scala foto in scrub **con i valori desktop 1,35→1,18** (sul mobile c'era 1,06→1, tolta il 2026-08-11), SplitText righe, veli; il difetto §9.4 (`test.fixme` Paths `:108-111`, vale su tutti i progetti <1024) **si chiude qui** |
| **TeamTrail** · 1024 · `/chi-siamo` (o dove monta) | scia per pannello | **PORT-SENZA-PIN definito** | il corridoio desktop *è* un pin (mondo `preserve-3d` sovrapposto): senza pin i pannelli restano in flusso e non si sovrappongono in Z. Due forme ammesse: (a) ogni pannello (100 svh in flusso) fa il proprio avvicinamento (`translateZ` −X→0 + scale) entrando; (b) pin per pannello ≤1,2 vh con il successivo che arriva dalla profondità. Se nessuna legge come corridoio → TRANSLATE motivato. Senza canvas atmosfera (alleggerimento) |
| **HorizontalRail / Social rail** · 1024 · Services, Social | scroll-x nativo + snap | **PORT** | è già il gesto nativo (legge 4); aggiungi il pan `xPercent ±depth` legato al progresso nativo: `--rail-p` oggi è scritta sull'host di `RailProgress` (fratello, non antenato: `RailProgress.tsx:98`) → scriverla (anche) sul wrapper del rail e applicare `translateX(calc(var(--rail-p) * …))` ai `.dt-rail_pan` in CSS |
| **Cursor / Magnetic / HoverDistort / parallasse puntatore** · `coarse` | off | **KEEP OFF** | legge 5; il chunk di `Cursor` **non si scarica** su `coarse`: stato post-mount (`useEffect` + `matchMedia(MQ.finePointer)`) attorno a `<Cursor/>` in `ChromeMount.tsx` |
| **Landscape cover** (ERA) | — | **KEEP OFF** | un immobiliare non blocca l'orientamento |
| **Scroll virtuale** (Lusion) | — | **KEEP OFF** | legge 4 |

---

## 6. IL PRELOADER — lo stesso oggetto, sul telefono

### 6.1 La coreografia

Sul telefono suonano **gli stessi quattro atti del desktop, con le stesse durate
e gli stessi ease** (I lockup per lettera 1,3 s `dtOut`; II linea di carica
`dtLoader` 1,55 s; III porta `domus.inOut` 1,1 s; IV tuffo `dtDiveIn` 1,5 s; totale
4,63 s), con questi **parametri** mobile:

- `--arch-w` 40→58→165 vw (già così);
- **`--arch-y`**: partenza `104lvh` (o `vh`, che su mobile è il viewport grande:
  l'arco deve stare sotto il bordo *anche a barra URL nascosta* — con `104svh`
  spunterebbe già di ~60 px a t=0, caso reale per il sipario di `PageTransition`
  che condivide la maschera e parte a metà scroll, `PageTransition.tsx:35-36`),
  quota di riposo `16svh` (visibile sopra la barra), tuffo `-100lvh`. Nota GSAP:
  dentro un singolo tween tenere la stessa unità o verificare la conversione
  (CSSPlugin converte le unità di una custom property misurandole). ERA usa `vh`
  puri anche per la quota di riposo (dato su device non verificato, MOBILE.md:82);
- **linea di carica presente**, stessa meccanica (`yPercent -100→0`, `dtLoader`
  1,55 s); parametri mobile: altezza `min(64px, 10svh)`, spessore 2 px (oggi
  1 × 64) — la si rende *leggibile*, non più larga;
- caps «Immobiliare / dal 2007» presenti (`md:flex` → `flex`), tipografia dal
  vocabolario mobile;
- **anelli eco presenti, su transform**: oggi `width/height/top` in `calc()`
  (`globals.css:1722-1743`) fanno layout per frame; poiché `--arch-h = --arch-w×10`,
  uno `scale()` uniforme conserva la forma, ma `calc()` non sa dividere una
  lunghezza per ottenere un fattore adimensionale → GSAP scrive **anche** una
  var unitless (`--arch-s`) o tweena direttamente `scale`/`y` degli anelli;
  l'`inset box-shadow 1px` scala con l'anello (~4× a 165 vw: accettato o
  compensato). Questo è l'alleggerimento nominato del preloader;
- `will-change` sulle lettere **solo per la finestra dell'atto I** (set prima,
  `clearProps` dopo ~2 s), non per tutta l'intro come oggi ≥768
  (`globals.css:270-274`, legato a `html[data-preloader]`);
- MarkBadge come oggi.

**Il primo fotogramma.** Prima dell'idratazione esiste **solo** il fondo SSR
`.dt-preloader-boot` (`layout.tsx:191-207`): nessun testo, nessuna richiesta.
**Decisione: resta così** — non si porta il lockup nel layout server
(duplicherebbe il DOM e dipende da `dt_locale`). Il criterio e2e «primo fotogramma
dipinto prima dell'idratazione» si asserisce su `.dt-preloader-boot` visibile con
`html[data-preloader]` e senza `data-pre-live`. L'atto I in CSS di oggi parte al
mount del chunk (lo stesso commit in cui `useGSAP` prende il timone) — è un
vantaggio che i riferimenti non hanno (Lusion aspetta il font, ERA aspetta
jQuery) e **non lo togli**. Ma per essere *lo stesso film* del desktop deve
animare **gli stessi nodi con la stessa trasformazione**: oggi la CSS mobile
anima i contenitori `[data-pre-line]`/`[data-pre-sline]`/`[data-pre-word]`
(riga intera), il desktop GSAP anima i figli `[data-pre-char]`/`[data-pre-schar]`
(`fromTo` per lettera). Un `fromTo` GSAP dopo che la riga è già salita in CSS
azzererebbe le lettere e le farebbe rientrare → salto visibile. Due strade,
scegli in Fase 1 con la sequenza a 250 ms alla mano e scrivi quale:

- **(A) atto I in CSS a ogni larghezza, sui chars**: keyframe su
  `[data-pre-char]` con `opacity 0→1, translateY 50%→0, rotateY 90→0` sotto
  `perspective 800px`, ritardo per lettera via `--i` (stagger .075),
  `animation-timing-function: cubic-bezier(0.25,1,0.5,1)` (= `dtOut`, già una
  bezier a 4 numeri in `gsap.ts:46`), stesso per script/caps/payoff; GSAP **non
  rifà** l'atto I: la timeline parte dall'atto II con offset = tempo trascorso
  dal mount (`performance.now()`), sui nodi dell'atto I nessun `fromTo`. Il
  desktop adotta lo stesso idioma (−21 tween, stesso film) — è la strada
  raccomandata;
- **(B) passaggio di consegne**: al primo tick della timeline si legge lo stato
  corrente con `getComputedStyle`, si mette `animation: none` sui nodi CSS, si
  fa `gsap.set` con i valori letti e la timeline per lettera prosegue con i suoi
  tempi. Più fragile (l'animazione CSS vince sullo stile inline finché è attiva).

Verifica: nella sequenza a 250 ms non deve esserci un fotogramma in cui il
lockup torna indietro.

### 6.2 Contratti che non si rompono

- `INTRO_EVENT` (`dt:intro:done`) verso `HeroCinematic` e `CookieConsent`;
  `fireIntro()` una volta sola per documento, da ogni percorso.
- Lenis: `stop()` finché c'è `data-preloader`, `start()` + `lagSmoothing(0)` in
  `finish()`; il `MutationObserver` di `SmoothScroll.tsx:87-99`. Un telefono che
  esce dall'intro con Lenis fermo è una pagina morta — coperto da e2e, non da
  lettura.
- Una volta per sessione (`dt-intro-seen`), **skip al primo tocco** = resta
  `tl.seek("dive")`: al tocco si salta al tuffo e suonano gli ultimi 1,5 s (un
  taglio secco lascerebbe l'arco a metà). Test: da tocco a `dt:intro:done`
  ≤ 1 700 ms.
- **Tutti gli orologi derivati dalla durata dell'intro si ri-derivano insieme,
  in un solo commit, da un'unica costante** (`INTRO_MS`, esportata da
  `Preloader.tsx` o `gsap.ts`, col gemello nel boot script inline) — la lezione
  dei «sette orologi» di mobile-parity §5.2: (1) `layout.tsx:61` boot failsafe
  `1800` → 2 500 a ogni larghezza; (2) `Preloader.tsx:624` riarmo negli abort
  `1800` → 2 500; (3) `globals.css` blocco ≤767.98 `animation-delay: 2.3s`
  (autohide) → si toglie, resta il solo `3s` di `:1653` (= 2,5 + 0,5 di margine);
  (4) stesso blocco, `html[data-hero-rest] .dt-hero-rest` e
  `[data-hero-char|tchar|schar]` `animation-delay: 4s` → 6 s come desktop
  (altrimenti le lettere dell'hero si accendono a t=4 s con l'arco aperto dal
  3,13); (5) `warmFirstFold(1400)` → scadenza ≤ intro − tuffo (≈3 s); (6)
  `e2e/mobile-motion.spec.ts:421` budget `1900` → 4 800 a ogni larghezza; (7)
  `HeroCinematic.tsx:381` e `CookieConsent.tsx:121` reti a 6 000 ms: restano
  ≥ intro + 1 s (verificare); (8) i commenti di `layout.tsx` e `Preloader.tsx`.
- Attributi/chiavi che sono contratto e vanno nominati nel doc: `data-preloader`,
  `data-pre-live`, `data-hero-rest`, `data-hero-intro`, `data-consent`,
  `html.lenis-stopped`, `.dt-preloader-boot`, classi `is-arch`/`dt-arch-mask`,
  `sessionStorage['dt-intro-seen']`, cookie `dt_consent`, `dt_locale`, evento
  `dt:intro:done`, `window.__dtPreArmed`/`__dtPreFailsafe`.
- **L'intro non è della home**: ogni prima visita su qualunque URL senza hash la
  suona. Quindi (a) il budget «`/acquista` non regredisce» si misura a freddo
  **con** l'intro da 4,63 s, stesso delta ammesso della home; (b) e2e a 390
  anche su `/acquista` (rotta senza HeroCinematic): quattro atti, `dt:intro:done`
  emesso, banner cookie all'handoff, Lenis rilasciato, `PageHero` con
  `[data-ph-el]` a opacità 1 dopo la caduta — se il suo ingresso risulta
  «consumato» sotto il sipario, si aggancia a `INTRO_EVENT` come HeroCinematic:
  decidilo in Fase 1 e scrivilo; (c) la sequenza a intervalli si fa anche su una
  rotta secondaria a 390.
- L'hash profondo salta l'intro; reduced-motion non la stampa mai.

### 6.3 Il costo, e come si tiene giù (legge 2, prima della legge 3)

Nell'ordine, **tutti**, prima di toccare il tempo:

1. **Sagoma webp in variante mobile** (Lusion `_ld`): oggi
   `public/media/raffaela-sagoma.webp` 79 000 B a ogni larghezza; il markup è
   già `<picture><source type=webp><img png>` (`Preloader.tsx:661-669`) → una
   riga `<source media="(max-width: 767.98px)" srcset="…-m.webp" type="image/webp">`
   con un file ≤ 30 KB. Nota: `aria-hidden` **non** tiene un'immagine fuori dalla
   candidatura LCP — la tengono fuori dimensione e tempo di paint rispetto alla
   foto hero `priority`: misuralo, non presumerlo.
2. **Chunk del preloader** (22,5 KB): il ramo desktop e il mobile condividono il
   codice, non duplicarlo; se scegli (A) in §6.1 il chunk cala.
3. **Warmup mobile**: `warmFirstFold(≈3000)` (scadenza ≤ intro − tuffo, ricavata
   dalla nuova durata) + `scheduleIdleWarmup()` dopo l'handoff. **Il desktop
   resta** `warmAllImages` + `runWarmup(4500)`: è una richiesta del cliente
   (`Preloader.tsx:318-321`), non si tocca.
4. **`will-change` a tempo**, anelli eco su transform (§6.1).
5. **Niente layer contentful nell'overlay**: fondo pieno + testo di taglia
   modesta; sagoma piccola.

Poi si misura (§9). **Se e solo se** LCP/TBT a freddo peggiorano oltre soglia
rispetto al baseline **della stessa build** (sonda CDP, non Lighthouse assoluto),
la scala è: (a) `timeScale` dell'intera intro 1,0 → 1,25 (3,7 s) → 1,5 (3,1 s),
mai sotto; (b) **variante corta** in stile ERA `short` — **con i nostri atti**:
porta 1,1 s + tuffo 1,5 s dopo un pre-roll di 0,25 s ≈ 2,85 s, senza atto I per
lettera e senza linea di carica (ERA short = 3,75 s) — **solo** su condizioni di
*device*, non di larghezza: `navigator.connection.saveData`, `effectiveType`
`2g|slow-2g`, `deviceMemory < 4`, `hardwareConcurrency < 4` (la lista di
`HoverDistort.tsx:102-104` + `effectiveType`, da aggiungere anche lì così la
lista resta una). La condizione si legge nel **boot script inline prima del
paint** e si scrive come `html[data-pre-short]`, così CSS (autohide, atto I) e
`Preloader.tsx` leggono lo stesso verdetto; il registro sessione resta
`dt-intro-seen`. «Meno atti sotto 768» **non è più un gradino**. Se dopo (b) il
budget non regge, ti fermi e mi porti i numeri con la tua lettura su cosa deve
cedere; non spedisci una regressione in silenzio e non allenti `lighthouserc.js`
per far tornare il verde.

---

## 7. BUDGET E GUARDRAIL

### 7.1 Budget

- `lighthouserc.js` resta scritto com'è. **Ma** la home è rossa oggi per
  l'idratazione (§3.5), quindi il criterio operativo di questa onda è il
  **delta a parità di build** misurato con la sonda CDP (§8, Fase 0), a freddo
  (intro) e a caldo (`dt-intro-seen`), su `/` **e** `/acquista`:
  - **per fase**: LCP a freddo ≤ +150 ms, TBT proxy ≤ +100 ms rispetto al
    proprio baseline;
  - **tetto cumulativo** rispetto alla baseline di Fase 0, stessa macchina: LCP
    a freddo ≤ +250 ms, TBT proxy a freddo e a caldo ≤ +150 ms, jank ≤ +5 punti
    (§9.4);
  - **rumore**: in Fase 0 la sonda gira **due volte** sulla stessa build per
    stimare σ; un delta sotto σ non è un delta;
  - a11y ≥0,95, CLS ≤0,1 e SEO restano gate assoluti;
  - superato un tetto la fase si ferma, si percorre la scala §6.3 (asset →
    `timeScale` → variante corta), e se non basta ci si ferma con i numeri: non
    si passa alla fase successiva con un rosso in sospeso.
- **Il go/no-go sull'idratazione** (differire i componenti sotto la piega) è
  una decisione a parte: la scrivi in una riga nel report finale, non la fai.
- **Nessuna dipendenza nuova.** GSAP + ScrollTrigger + Lenis (+ `ogl` solo dov'è).
  Niente three.js, niente canvas nuovi.
- Direttiva cliente, assoluta: niente glass/liquid/plasma/water/frost/ripple,
  nemmeno rinominati; niente tagli percepiti tra sezioni; testi grandi, immagini
  grandi, logo vero, fiori SVG. Riferimento: era-residence.com.

### 7.2 Guardrail tecnici

- Ogni ScrollTrigger dentro `gsap.matchMedia()` con `MQ`, revertibile;
  `ScrollTrigger.refresh()` sulle sezioni ad altezza dinamica
  (`docs/wow-layer-plan.md:33`).
- **`ScrollTrigger.config({ ignoreMobileResize: true })`** è il **primo commit
  della Fase 1** (dopo la baseline), in `app/lib/motion/gsap.ts` subito dopo
  `gsap.registerPlugin(ScrollTrigger)` (riga 36), a livello di modulo, prima che
  qualunque trigger nasca — oggi in `app/` non c'è nessun `ScrollTrigger.config`.
  Ignora solo i resize di sola altezza su touch (barra URL); la rotazione
  continua a fare refresh (voluto). Nel report: refresh per un ciclo 844→744→844
  prima/dopo.
- Mai un `transform` su un antenato di un `fixed`/`sticky` (Header, menu,
  `WhatsAppFloat`, `MobileActionBar`).
- Unità: mai `vh` nudo per altezze di **layout** (`svh`/`dvh`); `lvh` (o `vh`)
  solo per ciò che deve stare *fuori* dal viewport anche a barra nascosta
  (§6.1); `env(safe-area-inset-*)` su tutto ciò che è fisso a un bordo.
- Su `coarse`: il chunk di `Cursor` non si scarica.

### 7.3 Trappole ereditate (da mobile-parity §2.3/§6 — leggile prima delle fasi che le toccano)

1. **ThreadNav PORT**: prima di riattivare `watchSurfaceTone` su nodi visibili,
   `app/lib/ui/surface.ts:71-72` deve smettere di scrivere `data-tone` (usa un
   attributo suo, es. `data-surface`), altrimenti SurfaceFlow e
   `globals.css:615-618`/`676-679` lo leggono come tappa (§6.13).
2. SurfaceFlow legge `[data-tone]` **una volta al mount** (`SurfaceFlow.tsx:83`,
   §2.3): nessun ramo mobile può aggiungere/togliere sezioni `data-tone` dopo
   l'idratazione.
3. Ogni `fromTo` portato sul telefono con `toggleActions` reversibile e rete
   `once` va provato con un **resize/rotazione** dopo il passaggio (§6.15) — sul
   telefono il resize è quotidiano.
4. `MobileActionBar` `getElementById("contatti")` in `useEffect([])` (§6.12): se
   Footer uncover o scroll cue dipendono dalla barra, prima si corregge.
5. Menu con reduced-motion (§6.16) resta da coprire in e2e.

---

## 8. PIANO DI LAVORO

**Fase 0 — Strumenti, audit e baseline.**
1. Scrivi (nel repo, non gitignorati) i due strumenti che il piano usa e che non
   esistono: `scripts/mobile-cdp-probe.ts` — Playwright + CDP
   `Emulation.setCPUThrottlingRate(4)` + `Network.emulateNetworkConditions`
   1,6 Mbps / 150 ms RTT, viewport 390×844, cookie `dt_consent=accepted`,
   sessione fredda; variante «a caldo» con `sessionStorage['dt-intro-seen']='1'`
   via `addInitScript`; emette per rotta FCP, LCP **con il nome dell'elemento**
   (`PerformanceObserver` su `largest-contentful-paint`), TBT proxy (blocking dei
   long task fra FCP e FCP+8 s), conteggio `ScrollTrigger.getAll().length` e nodi
   con `will-change ≠ auto`, jank di scroll (§9.4); mediana su 3 run; `--out
   <file>` JSON così il prima/dopo è un diff. E `scripts/intro-filmstrip.ts` —
   sessione fredda, stessa throttling, uno screenshot ogni 250 ms da
   `data-pre-live` fino a 5 s, a 390×844 e 1440×900, su `/` e una rotta
   secondaria, in `docs/shots/intro-<larghezza>-<fase>/` (già gitignorato).
   Aggiorna `ROTTE` in `e2e/mobile-motion.spec.ts` e `ROUTES` in
   `scripts/mobile-shots.ts` con `/case-vendute` e `/valutazione-immobile-tradate`
   (sono in `app/sitemap.ts` e in `a11y.spec.ts`).
2. Verifica §3 contro il codice; scrivi `docs/mobile-parity-2.md`: tabella dei
   verdetti (§5.1 confermata o ribaltata, con prova, soglia, rotte),
   l'alleggerimento nominato per ogni PORT, la scaletta dell'intro (§6, con la
   scelta A/B se già evidente), i verdetti aperti da chiudere con misura
   (Footer a 390, video hero, stairs, CameraIn), il piano di misura.
3. Baseline **prima di toccare qualunque cosa**: sonda CDP a freddo/caldo su `/`
   e `/acquista` (due volte, per σ), `npm run lighthouse`, `npm run perf:report`,
   screenshot a 390 di ogni rotta di `sitemap.ts` + un `/case/[slug]` di fixture,
   filmstrip dell'intro a 390 e 1440.
4. Correggi i commenti/doc di §3.6.

**Mostrami il documento e fermati per l'approvazione prima della Fase 1.**

**Fase 1 — Il preloader** (§6). Primo commit: `ScrollTrigger.config`. Poi PORT
completo, primo fotogramma come deciso, variante mobile della sagoma,
`will-change` a tempo, anelli eco su transform, `INTRO_MS` e tutti gli orologi
derivati in un commit, e2e aggiornato (`<4 800 ms` a ogni larghezza; intro su
`/acquista`). Misura a freddo/caldo su `/` e `/acquista`, filmstrip confrontate.

**Fase 2 — Hero e cromo.** `HeroCinematic` frame-in (+ decisione video),
`CameraIn`, `PageTransition` uscita, `Fioritura` d'angolo (con `MQ.sm` e dpr
1,5), `Parallax` default mobile, `WordReveal`, scroll cue, `Footer`. Un commit
per famiglia.

**Fase 3 — I set piece** (PORT-SENZA-PIN), impatto per primo: capitolo
`HorizonStory`+`StarReviews`, poi `Paths` (chiudendo §9.4), `TeamTrail`,
`ReviewsWall`, `ThreadNav` (con la trappola 1 risolta prima), `ManifestoPin`,
`HorizontalRail` pan.

**Fase 4 — Asset e peso** (legge 2, trasversale): `<source media>`/`sizes` per
ogni immagine ≥ 50 KB servita a 390 (hero, sagoma, foto Paths/TeamTrail),
`will-change` residui (~68 span dell'hero permanenti `HeroCinematic:150` → a
tempo), chunk `Cursor` non scaricato su `coarse`, `ToneShift`/`SurfaceFlow` per
frame misurati (se >2 ms/frame su CPU ×4 → passo di aggiornamento ridotto, non
spenti).

**Fase 5 — Verifica** (§9), checklist iPhone (§9.6) e revisione adversariale
finale sul diff completo.

Commit per fase, messaggi in italiano, stile di casa (prefisso convenzionale
minuscolo, poi una frase che dice cosa è cambiato in termini umani). Non fare
push né aprire PR senza che te lo chieda.

---

## 9. VERIFICA — prove, non aggettivi

Sei su Windows: verifica il motion **solo con Playwright headless**; la suite
di snapshot visivi è darwin-only, non inseguirla.

Richiesto, con output reale nel report:

1. `npm run check` (lint + typecheck + unit + build) verde.
2. `npm run test:e2e` (`playwright.site.config.ts`, porta 3177, build di
   produzione): `mobile-390` suite intera, `mobile-360`/`tablet-768`/`desktop-1366`
   solo `@layout`, `desktop-1440` intera. Ogni test nuovo dipendente dalla
   larghezza porta `@layout`; il progetto `tablet-768` deve vedere i parametri
   della fascia 768-1023 (legge 7).
3. Nuova copertura, minimo:
   - a 390, su `/` **e** `/acquista`: l'intro suona con **i quattro atti**
     (asserisci la presenza dei tween per lettera, della linea di carica, della
     porta, del tuffo — non solo che il nodo esiste), dura ≤4 800 ms, è saltabile
     al primo tocco (tocco → `dt:intro:done` ≤1 700 ms), rilascia Lenis,
     `data-preloader` sparisce, non si ripete alla seconda navigazione;
     `.dt-preloader-boot` è visibile prima di `data-pre-live`;
   - per ogni famiglia PORT/PORT-SENZA-PIN: a 390 si osserva **lo stesso tipo di
     trasformazione** del desktop (es. `rotateY` sui chars, `scale` sulla foto),
     non un fade — e **almeno un test su una rotta non-home** per famiglia
     (ThreadNav su `/acquista`, CameraIn su `/contatti`, ManifestoPin su
     `/metodo`, Parallax su `/vendi`);
   - **rotazione a metà pagina**: a 390×844, dopo aver scorso oltre HorizonStory
     e Social, `setViewportSize(844×390)` e ritorno: nessun contenuto resta a
     `opacity 0`/`visibility hidden`, nessun trigger pinnato bloccato,
     `html.lenis-stopped` assente, refresh per rotazione registrati;
   - **barra URL**: resize di sola altezza 844→744→844: zero refresh con
     `ignoreMobileResize:true` (hook `ScrollTrigger.addEventListener("refresh")`
     iniettato dal test);
   - nessun overflow orizzontale del documento a 360 su **tutte** le rotte di
     `sitemap.ts` + un `/case/[slug]`;
   - `prefers-reduced-motion: reduce` a 390 → pagina completa e composta (menu
     compreso, trappola 5);
   - JS spento → pagina completa.
4. **Misure per frame e per byte**, prima e dopo ogni fase: (a) jank di scroll
   con CPU ×4 — scroll programmato della home a 390 (un viewport ogni 400 ms
   fino al fondo), campionando i frame con rAF: p95 del tempo di frame e % di
   frame >50 ms; nessuna fase peggiora la % di frame lunghi di più di 5 punti;
   (b) `ScrollTrigger.getAll().length` e nodi `will-change ≠ auto` a fine
   caricamento e dopo lo scroll; (c) `npm run perf:report` (390): byte
   immagini/JS/media per `/`, `/acquista`, `/vendi`, `/metodo`, `/contatti` —
   sagoma mobile ≤30 KB, chunk `Cursor` a 0 su `coarse`.
5. Sonda CDP a freddo/caldo su `/` e `/acquista` **prima e dopo ogni fase**,
   accanto al baseline di Fase 0; `npm run lighthouse` finale (informativo).
   Screenshot a 390 di ogni rotta prima/dopo; le filmstrip dell'intro (390 e
   1440, `/` e una secondaria) affiancate: devono leggersi come lo stesso film.
6. **Ciò che Chromium su Windows non può provare** va elencato nel report come
   *da verificare su iPhone reale* (Safari iOS) e su un Android di fascia media:
   porta ad arco con `-webkit-mask-composite`, ripiego clip-path, tuffo su
   `svh`/`lvh`, memoria con le Fioriture accese, skip al tocco, momentum touch
   dopo l'intro, video hero se PORT. Consegna: una checklist di 6-8 righe da
   spuntare a mano prima di chiudere l'onda; niente «fatto» su Safari senza quel
   giro.

Una fase non è finita perché il codice sembra giusto. È finita quando l'output
qui sopra dice che lo è.

---

## 10. SKILL — da invocare prima di scrivere codice

**Installate in questo repo/utente (verificato 2026-08-17: `.claude/skills/`,
`~/.claude/skills/`, plugin).** Usa queste, e di' quale ti ha guidato dove.

- `impeccable` — esegui `context.mjs` una volta; playbook **`adapt`** (mobile
  web) per la scelta dei *parametri* — attenzione alla tensione: `adapt` dice
  «adattare è ripensare, non scalare pixel», la legge 1 dice «cambiano solo i
  numeri»: qui vince la legge 1 per il *verdetto*, `adapt` guida *quali* numeri
  (thumb zone, densità, distanze) —, **`animate`** (tesi del motion: momento
  focale = l'intro; continuità; budget) e **`optimize`** (misura prima/dopo).
  Carica `craft-floor.md` **subito prima** di toccare UI.
- `awwwards-animations` — `references/performance.md` (solo transform/opacity,
  `will-change` a tempo, `ScrollTrigger.config`, rilevamento low-end per la
  variante corta §6.3-b), `references/gsap-react.md`, `references/lenis-react.md`.
- `gsap-scrolltrigger`, `gsap-timeline`, `gsap-plugins` (SplitText, CustomEase)
  — le fonti ufficiali per PORT-SENZA-PIN, `matchMedia`, `timeScale`, refresh.
- `svg-animations` — per la maschera ad arco e MarkBadge (transform-only).
- `lighthouse` — per leggere `lighthouserc.js` e i report; ricorda che
  l'assoluto locale è rumoroso, il delta CDP no.
- `vercel:nextjs` e `vercel:react-best-practices` — con `AGENTS.md` che vince
  su ogni conflitto; agente `vercel:performance-optimizer` per la Fase 4.
- `engineering:testing-strategy` per la copertura e2e di §9.3;
  `code-review` (o `/code-review`) e `simplify` sul diff di ogni fase.
- `ui-ux-pro-max` solo se serve una tavolozza di alternative per la linea di
  carica o lo scroll cue mobile.

**Non installate** (l'onda precedente le citava; oggi non esistono nella
sessione — non fingere di averle usate): `mobile-design`, `scroll-experience`,
`fixing-motion-performance`, `web-performance-optimization`, `ui-a11y`,
`wcag-audit-patterns`, `nextjs-best-practices`, `frontend-dev-guidelines`,
`web-design-guidelines`, `baseline-ui`. `npx find-skills` risponde 404 qui.
Per l'API di Next 16 / Tailwind v4 / GSAP / Lenis usa i doc in `node_modules`
(AGENTS.md) — non la memoria.

---

## 11. ANTI-PATTERN — rifiuto automatico

- Tradurre in un fade quello che sul desktop è una trasformazione, e chiamarlo parità.
- Tagliare un atto dell'intro per far tornare un numero (§6.3: prima gli asset, poi il `timeScale`; l'unica variante con meno atti è la corta di §6.3-b, decisa dal device).
- «Meno atti sotto 768» come gradino della scala di concessioni.
- `syncTouch`, scroll virtuale, pin > 1,2 vh sul telefono, landscape bloccato.
- Equivalenti touch inventati per hover/cursore.
- Costanti di larghezza fuori da `MQ`; UA sniffing.
- `will-change` permanente; `filter`/`width`/`height`/`top`/`left` per frame; `100vh` di layout.
- Stati nascosti in SSR/CSS base.
- Aggiungere un effetto senza nominare l'alleggerimento (regola Chanel).
- Un orologio dell'intro cambiato da solo (§6.2: tutti insieme, da `INTRO_MS`).
- Allentare `lighthouserc.js`, o riportare «fatto» senza le prove di §9.
- Qualunque dipendenza nuova in `package.json`.

---

## 12. DEFINITION OF DONE

1. `docs/mobile-parity-2.md` esiste: ogni effetto ha verdetto, soglia, rotte,
   prova, parametri mobile e l'alleggerimento nominato; §3.6 corretto nel
   codice/doc; `scripts/mobile-cdp-probe.ts` e `scripts/intro-filmstrip.ts` nel
   repo.
2. **L'intro a 390 è lo stesso film del desktop**: quattro atti, 4,63 s (o il
   `timeScale` dichiarato, con la misura che lo ha imposto), primo fotogramma
   `.dt-preloader-boot` pre-idratazione, skip al primo tocco (`seek("dive")`),
   Lenis rilasciato, una volta per sessione, su `/` e su `/acquista` — filmstrip
   affiancate nel report.
3. Nessun `mm.add(MQ.lg|MQ.desktop, …)` senza il ramo gemello che fa **lo stesso
   tipo di trasformazione** o un commento `KEEP OFF (legge 5)` / `TRANSLATE
   (motivo)`.
4. Un visitatore a 390 vede i capitoli della home **come sul desktop**: chars
   che ruotano, foto che scalano, stella che si forma, pannelli del team che si
   avvicinano dalla profondità — non una lista di blocchi in dissolvenza.
5. Delta CDP a freddo/caldo entro soglia per fase e cumulativo, a11y/CLS/SEO
   verdi, `/acquista` non regredito, jank ≤ +5 punti; il go/no-go
   sull'idratazione scritto in una riga.
6. `npm run check` e `npm run test:e2e` verdi con le nuove spec `@layout` e
   mobile-motion (rotazione, barra URL, rotte non-home comprese).
7. Reduced-motion e no-JS a 390: pagina completa e composta.
8. Checklist iPhone/Android consegnata (§9.6).

Comincia dalla Fase 0. Mostrami l'audit e aspetta l'approvazione prima di
implementare qualunque cosa.

---

## Appendice A — I dossier di reverse engineering (locali)

`reverse-engineering/` è **gitignored** (materiale di studio, mai nel repo). Se
manca:

- `era-residence/` (README 506 righe, `js/main.pretty.js` 2 866 righe, CSS,
  HTML, asset) si ripristina dalla storia:
  `git archive 9a55e70^ reverse-engineering | tar -x -C .`
  Poi **`era-residence/MOBILE.md`** (2026-08-17: rilevamento `breakPoint=992`,
  tabella tween per tween intro/short mobile vs desktop, hero, logo, Lenis su
  touch, pin/CSS ≤991, asset e byte serviti con UA iPhone, verdetto) e
  `raw-mobile/` sono solo locali: se mancano vanno rigenerati.
- `lusion/` (README §1-4 JS + §5-8 CSS/HTML, `js/01…12_*.js` estratti,
  `css/*.css`, `raw/hoisted.pretty.js` 50 715 righe con i riferimenti `r.NNNN`)
  è **solo locale**: se manca, rigeneralo — bundle `https://lusion.co/_astro/hoisted.CUO_IjfL.js`
  (1,25 MB; three.js r158 + quick-loader 0.1.17 + motore proprio; niente
  gsap/lenis), CSS `about.CNa9RfUh.css`, HTML servito uguale per tutti.
- `domus-tua-gap-mobile.md`: l'inventario di Domus Tua con file:riga al
  `c4bccf8`; §9 elenca i doc disallineati.

I fatti essenziali dei tre dossier sono già in §2 e §3 di questo prompt: il piano
è autosufficiente anche senza la cartella.

## Appendice B — Numeri chiave dei riferimenti, per i parametri

- ERA preloader mobile: `--arch-w` 40 vw (156 px @390) → 50 vw (195 px) → 125 vw
  (488 px); `--arch-y` 104 vh → 15 vh → −100 vh; hero scale 1,15 → 1
  (`center top`); progress 4 s `loaderEase`, fill 90 px @390 (23,08 vw); intro
  10,15 s = 1,2 + 1,2 + 4 + 1,35 + 2,4; short 3,75 s = 1,35 + 2,4;
  `--_100svh` = `innerHeight` al load.
- ERA logo: 30°/s, `speed = dir·(30 + 10·|velocity|)`, tween 0,3 s Out, ritorno
  in 1,2 s dopo 100 ms; `viewBox 80` mobile / `120` desktop; 19,23 vw @390.
- Lusion scena: `DPR = min(1,5, dpr)`, tetto 2560×1440, SMAA, `dt ≤ 1/20`;
  cifre preloader `13vw` ≤812; unità `min(42, vw/30)` px; uscita 1 s `expoInOut`
  (foro che scala e ruota).
- Lusion asset mobile: mesh −56 % vertici, texture EXR −71 %, video −54 %,
  soglie 812 (layout) / 560 (video) / UA (asset); about pinnato 11,25 vh con
  crossfade sotto 812.
