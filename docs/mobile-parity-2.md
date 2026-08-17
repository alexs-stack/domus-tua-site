# Parità mobile 2 — «stessi effetti sul telefono»: audit di Fase 0

> Onda «parità mobile 2», 2026-08-17, mandato in `docs/mobile-parity-2-prompt.md`.
> Questo documento è la Fase 0 punto 2 (§8 del prompt): la verifica di §3 contro
> il codice al `c4bccf8`, la tabella dei verdetti, la scaletta del preloader, i
> verdetti che si chiudono solo misurando, e il piano di misura con la baseline
> vuota. Nessuna riga di prodotto è toccata da questo documento. Le fasi
> successive lo aggiornano invece di scriverne un altro.
>
> Convenzione: ogni numero porta `file:riga`. Sei file sono già in modifica
> dall'agente che corregge §3.6 (`Parallax.tsx`, `SmoothScroll.tsx`, `gsap.ts`,
> `docs/performance.md`, `e2e/mobile-motion.spec.ts`, `lighthouserc.js`): per
> quei sei le righe citate sono di `HEAD` (`c4bccf8`) e possono scivolare di
> qualche unità. Alla contro-verifica (stesso giorno) risultano in modifica
> anche `docs/mobile-parity.md` (+36 righe in testa: ogni `:riga` di quel file
> citata qui è di `HEAD` e nel working tree scivola di +36), `package.json` e
> `scripts/mobile-shots.ts` (`ROUTES` già allineato, v. §5.1). «Da verificare»
> = non l'ho letto o misurato io.

---

## 0. Le tre cose da sapere prima di leggere il resto

1. **La dottrina è ribaltata, e il codice di oggi è scritto per quella vecchia.**
   L'onda precedente ha *tradotto*: il telefono ha un'intro con meno atti
   (1,75 s contro 4,63 s: `Preloader.tsx:376-406`), dodici set piece resi come
   reveal più semplici, undici Fioriture e nove parallassi spente. Ogni ramo
   `belowDesktop`/`belowLg` che si legge nel repo porta un commento che difende
   quella scelta con una misura. Non sono commenti sbagliati: sono commenti di
   un'altra dottrina. Vanno riscritti dove il verdetto cambia, non cancellati.
2. **Il TBT della home è rosso per l'idratazione di react-dom, non per il motion.**
   Misura diretta (`docs/mobile-parity.md` §12.1): TBT proxy a freddo **3 561 ms**
   con l'intro, **3 908 ms** a caldo senza — l'intro non aggiunge TBT netto. Dopo
   il gate Trustindex 2 898 ms (§12.3); il long task dominante resta react-dom
   (~2 s, §12.2/12.4). `lighthouserc.js` chiede TBT ≤ 300 ms e LCP ≤ 2 500 ms
   (`HEAD:75-76`; nel working tree `:83-84`): la home è rossa oggi, prima di quest'onda. Il criterio operativo
   è quindi il **delta CDP a parità di build** (§5 qui sotto), non l'assoluto.
3. **L'intro suona su ogni rotta d'ingresso, non solo sulla home.** `PreloaderMount`
   sta nel root layout senza check di rotta (`app/layout.tsx:221`) e lo script
   di boot decide con `!deep && m && !sessionStorage.getItem("dt-intro-seen")`
   (`layout.tsx:61`): nessun confronto sul path. Prima visita su `/acquista`,
   `/vendi`, `/case/[slug]` → stesso sipario. Ogni budget, e2e e filmstrip
   di quest'onda va fatto **anche** su una rotta secondaria. Oggi la suite
   e2e prova l'intro solo su `/` (`e2e/mobile-motion.spec.ts:374,445,513,565`).
4. **(dalla baseline, §5.3) In laboratorio l'intro non suona affatto**, a nessuna
   larghezza: il chunk del preloader arriva dopo il failsafe, il sipario cade
   muto a 1,8 s e l'LCP della home in Lighthouse (9,9 s) è il banner cookie che
   aspetta quel chunk. Prima di rendere l'intro «uguale al desktop» bisogna
   farla esistere sul telefono lento: è la decisione (opzione C in §3.2) che
   chiede l'approvazione.

---

## 1. Verifica di §3 del prompt, riga per riga

### 1.1 Il preloader (§3.1)

| Affermazione | Esito | Prova |
|---|---|---|
| `layout.tsx:61` mette `data-preloader` a ogni larghezza; failsafe 1 800 sotto 767.98, 2 500 sopra | **confermato** | `layout.tsx:61`: `matchMedia("(max-width: 767.98px)").matches?1800:2500` |
| `PreloaderMount` nel root layout senza check di rotta | **confermato** | `layout.tsx:221`; il boot script non legge `location.pathname`, solo `location.hash` |
| Atto I desktop per lettera: chars `yPercent 50 / rotateY 90`, 1,3 s, stagger .075, `dtOut` | **confermato** | `Preloader.tsx:431-443` |
| script `rotateX 90`, stagger .065; caps stagger .11; payoff `yPercent 110` | **confermato** | `:444-462`, `:463-468`, `:469-474` |
| Atto I telefono: CSS per riga su `[data-pre-line]`/`[data-pre-sline]`/`[data-pre-word]`, `dt-pre-in-line` 0,55/0,5 s, ultimo keyframe a 0,77 s | **confermato** | `globals.css:1801-1816` (0,02+0,55; 0,09+0,55; 0,16+0,5; 0,2+0,5; **0,27+0,5 = 0,77**) |
| caps `hidden md:flex` → non esistono sotto 768 | **confermato** | `Preloader.tsx:705` |
| Atto II: verticale 1 px × 64 px, `yPercent -100→0`, `dtLoader` 1,55 s | **confermato** | tween `:481-488`, markup `h-16 w-px` `:726-727` |
| Atto II assente sul telefono (`display:none` + `if(!mobile)`) | **confermato** | `globals.css:1822-1824`; `Preloader.tsx:418` chiude anche l'atto II dentro `if (!mobile)` |
| Atto III desktop 24→36 vw / 15 vh, 1,1 s da t=2,25; telefono 40→58 vw / 16 vh, 0,7 s da t=0,25 | **confermato** | `T` a `:376-406`; tween `:500-506` |
| Atto IV desktop →125 vw / −100 vh, 1,5 s da t=3,13; telefono →165 vw, 0,8 s da t=0,95 | **confermato** | `:401-403`, `:386-388`, `:509-513` |
| Anelli eco: `width/height/top` in `calc()`; layout per frame; `display:none` sotto 768 | **confermato** | `globals.css:1732-1743`; `:1832-1834`; «debito noto» `:1826-1831` |
| `spinMarkBadge(root, 6)` uguale a ogni larghezza | **confermato** | `Preloader.tsx:311` |
| Warmup: desktop `warmAllImages` + `runWarmup(4500)`; telefono `warmFirstFold(1400)` + `scheduleIdleWarmup()` in `finish()` | **confermato** | `:343-344`; `:341`; `:230` |
| `will-change` lettere solo ≥768, per tutta l'intro | **confermato** | `globals.css:270-274` (`html[data-preloader] .dt-pre-char`) |
| Totale 4,63 s (ripiego 3,50) / 1,75 s (ripiego 1,30); e2e < 1 900 ms | **confermato** | 3,13+1,5; 2,6+0,9; 0,95+0,8; 0,55+0,75; `e2e/mobile-motion.spec.ts:421` |
| Skip: click/tasto/primo tocco → `tl.seek("dive")` | **confermato** | `pointerdown` `:587`, `seek` `:543` |
| Sessione: `dt-intro-seen` | **confermato** | `:52`, `:215` |
| Primo fotogramma server = solo fondo `.dt-preloader-boot` | **confermato** | `layout.tsx:205`; `globals.css:1616-1625` |

Una precisazione che il prompt non fa: sul telefono l'atto I CSS **non è
condizionato** al ramo GSAP — parte al mount del chunk (`globals.css:1790-1816`),
e in `Preloader.tsx:418` GSAP salta *tutto* l'atto I e II con un solo `if
(!mobile)`. Quindi oggi ci sono già due «primi atti» in due linguaggi: è
esattamente ciò che §6.1 chiede di unificare (vedi §3.2 qui sotto).

### 1.2 I set piece tradotti (§3.2)

| Componente | Esito | Righe attuali |
|---|---|---|
| `HorizonScroller` colonna, stairs ferme, niente chars split | **confermato** | ramo `:89-222`; stairs `:162-179`; niente SplitText `:110-116`; slide mobile `dur.reveal`/`top 70%` `:194-216` |
| `StarReviews` accensione once, sweep in pausa; morph rimisura per frame | **confermato** | ramo `:234-353`; `applyClip` `:384-387` (`getBoundingClientRect` a ogni `onUpdate` `:437,:464`) |
| `ReviewsWall` batch per tessera y24/opacity | **confermato** | `:100-186`; `y: dist.rise/2` = 24 `:135` |
| `Paths` clip-path dall'alto + punti x±48; scale 1,06→1 tolto; desktop 1,35→1,18 | **confermato** | `:314-319`; `x: ±dist.rise` `:341`; nota `:288-294`; desktop `:413,:439,:450` |
| `TeamTrail` scia scrub per pannello; corridoio = pin `len×140vh+100svh` | **confermato** | `:146-184`; `globals.css:2437-2465`. **Nota**: il ramo mobile ha già `scale 45/53→1` e `rotateY 160→0` (`:158-169`): non è un fade, è già una trasformazione dello stesso *tipo* |
| `ThreadNav` riga in alto `scaleX`, nodi `aria-hidden`; `watchSurfaceTone` spento | **confermato** | `:208` desktop, `:299` mobile, `aria-hidden` `:310`, `watchSurfaceTone` `:278` solo desktop, motivo `:266-277` |
| `ManifestoPin` scrub senza pin | **confermato** | `:69`; ramo `:109-131`. **Nota**: la trasformazione mobile è già la stessa del desktop (opacity per parola 0,15→1 in scrub) — manca solo il pin |
| `LiquidReveal` clip-path al posto del filtro | **confermato** | `:49` / `:66`; filtro `feTurbulence` `:104,:115` |
| `Footer` colonne y26/opacity; uncover con guardia `offsetHeight > innerHeight` | **confermato** | `:67`, `:69-73`. `pb-28` è diventato `pb-[calc(7rem+env(safe-area-inset-bottom))]` `:182` (stessa misura + inset) |
| `CameraIn` y24/opacity once vs scale .96→1 in scrub | **confermato** | `:41` / `:61`; commento «oscillazione» `:54-60` |
| `HeroCinematic` frame-in solo deriva `yPercent 6.5`; commento «non torna sul telefono» | **confermato** | `:230-253` (`dist.parallax*50` = 6,5); `:178-184` |
| `PageTransition` uscita 0,5 vs 0,65 (arco), 0,32 vs 0,45 (clip); entrata identica | **confermato** | `:198`, `:286`, `:292`; entrata `:421` 0,9 s `dtDiveIn`, `:178` 0,85 s. **Nota**: il ramo mobile è un `matchMedia().matches` fuori da `mm.add` (`:198`) |

### 1.3 Spento sul telefono (§3.3)

| Affermazione | Esito | Prova / correzione |
|---|---|---|
| Cursor/Magnetic/HoverDistort/parallasse puntatore `finePointer` | **confermato** | `Cursor.tsx:42`, `Magnetic.tsx:25`, `HoverDistort.tsx:93`, `FeaturedTestimonial.tsx:151` |
| chunk `Cursor` scaricato comunque (`ChromeMount.tsx:16,27`) | **confermato** | `dynamic()` `:16`, `<Cursor/>` `:27` senza condizione |
| Fioritura d'angolo ×11 `hidden lg:block`; 12ª `Team.tsx:138` `variant="center"` gira | **confermato nel totale, corretto nella composizione** | 11 d'angolo = Contact:559, DomusDocProtocol:325, Footer:174, FeaturedTestimonial:262, **HorizonStory:248 e :338 (due, non quattro: i due pannelli recensioni sono stati tolti, `HorizonStory.tsx:342-357`)**, Method:552, Services:492, **Paths:561 e :609 (due)**, Team:130. **TeamTrail non ha nessuna Fioritura**: importa solo `makeFlowerSprite`/`makeLeafSprite` (`TeamTrail.tsx:38`) per il canvas atmosfera |
| cap 1 500 fisso d'angolo, 2 200/3 500 `word` sotto soglia locale 640; canvas `min(dpr, 2)` | **confermato** | `Fioritura.tsx:291-292`, `:350` |
| `Parallax` 9/12 senza `mobile` | **confermato nel conteggio, con un'aggiunta** | passano: PageHero:121(:126), FeaturedTestimonial:225, OpenDomus:222. Non passano: Authority:222, EditorialRows:70/:95, DomusDocProtocol:307, OpenDomus:271, Services:433, Team:238, Reviews:221, LavoraConNoiContent:1007. **`Authority` non è montato da nessuna rotta** (nessun `import Authority`/`<Authority` in `app/`): quel call-site è codice morto — sono 8 tween vivi su 11, non 9 su 12. **FaqContent non ha nessun `Parallax`** (`FaqContent.tsx:240` lo dice esplicitamente): il §5.1 lo elenca per errore |
| Scroll cue `hidden md:block` | **confermato** | `HeroCinematic.tsx:822` |
| `<video>` hero solo `MQ.desktop`; `enabled=false` | **confermato** | `HeroCinematic.tsx:567`; `media.ts:18`. Asset: `public/media/domus-hero.mp4` **5 404 642 B**, 1920×1080 (tkhd), **4,000 s** (mvhd: timescale 1000, duration 4000 — riletto dall'header alla contro-verifica; ffprobe assente), nessun webm, nessuna variante mobile |
| `WordReveal`: default `mobile=false`, unico chiamante `CareerApplication:491` lo passa | **confermato** | `WordReveal.tsx:45`, `CareerApplication.tsx:491-493`. **Contact non usa più WordReveal** (`Contact.tsx:573`: «era WordReveal»): il §5.1 lo elenca per errore |

### 1.4 Già identico (§3.4)

Confermato a campione: `RotatingMark` si arma su `touchmove` (`:159`);
`HeroCinematic` lettere `dur.hero` con stagger .08/.07/.032 (`:344,:357,:368`);
`PageTransition` entrata `:421`; Lenis senza `syncTouch` (`SmoothScroll.tsx:103-109`).
**Una correzione**: «le rotte con solo `MQ.motionOk` — `/case/[slug]` … — sono
già identiche» vale per `PropertyDetail.tsx` (`:327`), ma quella rotta monta
`<Contact>` (`PropertyDetail.tsx:688`), che porta `CameraIn` (`MQ.desktop`) e una
Fioritura d'angolo: `/case/[slug]` **riceve** il lavoro di CameraIn e Fioritura
attraverso Contact.

### 1.5 Budget e TBT (§3.5)

| Affermazione | Esito | Prova |
|---|---|---|
| form factor 390×844, Slow-4G, CPU ×4, `/` e `/acquista`, `dt_consent=accepted`; error perf ≥0,90, a11y ≥0,95, SEO ≥0,95, CLS ≤0,1, LCP ≤2 500, TBT ≤300 | **confermato** | `HEAD:lighthouserc.js:20-21, :44-60, :63, :70-76` (working tree: cookie `:71`, asserzioni `:78-84`) |
| il commento :61-63 («il cookie salta il preloader») è falso | **confermato al `HEAD`, già corretto nel working tree** | `HEAD:lighthouserc.js:61-62`; il file in modifica dice ora «Questo cookie NON salta il preloader» |
| home 0,50 / LCP 9 812 / TBT 1 045 (Lighthouse); CDP a freddo LCP 1 724; TBT proxy 3 561 vs 3 908; 2 898 dopo Trustindex; imputato react-dom ~2 s | **confermato** | `docs/mobile-parity.md:857, :873-874, :932-935, :971-974, :946-949` |
| la sonda CDP non è mai stata committata | **confermato** | nessun `Emulation`/`emulateNetworkConditions`/`CDPSession` in `scripts/*.ts` (grep) |

---

## 2. La tabella dei verdetti

Regola Chanel: per ogni effetto che entra, si nomina cosa esce. Le rotte sono
verificate sui call-site (§1.3), non copiate dal prompt. Soglia = `MQ` di
`gsap.ts` (`desktop` 768, `lg` 1024, `coarse`).

### 2.1 Riepilogo

| # | Effetto | Soglia | Dove vive (verificato) | Verdetto | Alleggerimento nominato |
|---|---|---|---|---|---|
| 1 | Preloader | 768 | ogni rotta d'ingresso senza hash | **PORT** | sagoma in variante mobile; `will-change` a tempo; anelli eco su transform; −21 tween con la strada A anche su desktop |
| 2 | HeroCinematic frame-in | 768 | `/` | **PORT** (ribalta `HeroCinematic.tsx:178-184`) | `will-change: clip-path` solo nello scrub (`onToggle`) — o cornice a solo transform |
| 3 | HeroCinematic «resto» al primo gesto | 768 | `/` | **PORT già in essere** | nessuno: il tempo è già il parametro |
| 4 | HeroCinematic `<video>` | 768 | `/` | **KEEP OFF motivato** (oggi) | — |
| 5 | CameraIn | 768 | Contact (`/`, `/acquista`, `/vendi`, `/metodo`, `/open-domus`, `/chi-siamo`, `/contatti`, `/domande-frequenti`, `/recensioni`, `/servizi`, `/valutazione-immobile-tradate`, `/case/[slug]`), Stats (`/chi-siamo`, `/recensioni`), `/lavora-con-noi` ×2 | **PORT** | via il trio once+focusin+timeout del ramo mobile (nulla resta nascosto in uno scrub di sola scala) |
| 6 | Fioritura d'angolo ×11 | 1024 | Contact, DomusDocProtocol, Footer, FeaturedTestimonial, HorizonStory ×2, Method, Services, Paths ×2, Team | **PORT** (una per sezione a 390) | canvas `min(dpr, 1.5)` sotto `lg`; cap d'angolo sotto `sm`; soglia 640 → `MQ.sm` |
| 7 | Parallax | 768 | PageHero (**11** rotte, non 12: `/acquista`, `/vendi`, `/metodo`, `/open-domus`, `/servizi`, `/recensioni`, `/chi-siamo`, `/lavora-con-noi`, `/domande-frequenti`, `/privacy`, `/cookie`), EditorialRows, Reviews, Services, Team, OpenDomus, DomusDocProtocol, LavoraConNoi; **Authority = morto** | **PORT** | `will-change` solo mentre il trigger è attivo (oggi vive dal mount al revert) |
| 8 | WordReveal | 768 | CareerApplication (`/lavora-con-noi`) | **PORT** | −1 prop opt-in; nessun titolo cambia stato |
| 9 | Scroll cue | 768 | `/` | **PORT** | pulse `dt-scrollcue` in pausa quando il cue è spento |
| 10 | PageTransition uscita | 768 | tutte | **PORT** | −1 `matchMedia` fuori da `mm.add` (`:198`) |
| 11 | Footer uncover | 1024 | tutte | **PORT condizionato** alla misura §4.1 | nessun `ResizeObserver`/refresh nuovo: la variante parziale riusa `--dt-footer-h` |
| 12 | ManifestoPin | 1024 | `/metodo` | **PORT-SENZA-PIN** (già in sostanza) | l'ago (`:125-130`) entra nella stessa timeline: −1 ScrollTrigger |
| 13 | LiquidReveal | 1024 | `/`, `/metodo`, `/open-domus` (OpenDomus:248) | **TRANSLATE confermato** | — |
| 14 | ThreadNav nodi | 1024 | `/`, `/acquista`, `/vendi`, `/metodo`, `/open-domus` | **PORT dei nodi** | `watchSurfaceTone` solo dopo la trappola 1; nessun menu a comparsa |
| 15 | HorizonScroller | 1024 | `/` | **PORT-SENZA-PIN** | nessun `[data-on]`, nessuna altezza scritta, nessun refresh; SplitText solo sull'h2 manifesto |
| 16 | StarReviews | 1024 | `/` | **PORT-SENZA-PIN** (timeline once a tempo) | rect dello schermo misurato una volta; `will-change: clip-path` solo nel morph; **flash senza `filter`** |
| 17 | ReviewsWall | 1024 | `/` (**non** `/recensioni`: `RecensioniContent` non lo importa) | **PORT-SENZA-PIN** | `will-change` sui due wrapper solo in `onToggle` |
| 18 | Paths | 1024 | `/` | **PORT-SENZA-PIN** (chiude §9.4) | nessun runway; SplitText solo `lines` (≈6 span) |
| 19 | TeamTrail | 1024 | `/`, `/chi-siamo` (Team:331) | **PORT-SENZA-PIN definito** (forma a) | senza canvas atmosfera; niente pin |
| 20 | HorizontalRail / Social rail | 1024 | Services (`/`, `/servizi`), Social (`/`) | **PORT** | nessun ScrollTrigger: pan via `--rail-p` già scritta a ogni `scroll` |
| 21 | Cursor / Magnetic / HoverDistort / parallasse puntatore | `coarse` | — | **KEEP OFF** (legge 5) | chunk `Cursor` non scaricato su `coarse` |
| 22 | Landscape cover (ERA) | — | — | **KEEP OFF** | — |
| 23 | Scroll virtuale (Lusion) | — | — | **KEEP OFF** | — |

### 2.2 Le schede

Ogni scheda: **oggi** (file:riga) · **verdetto e prova** · **parametri mobile** ·
**rischio/trappola** (§7.3 del prompt) · **come si prova** (asserzione e2e a 390).

**1 · Preloader** — vedi §3, che è tutto suo. In breve: oggi due montaggi
(`Preloader.tsx:376-406`, `globals.css:1767-1844`); verdetto PORT, 4 atti, 4,63 s;
prova e2e su `/` **e** `/acquista`: transform `matrix3d` in movimento su
`[data-pre-char]` a t≈0,5 s, `[data-pre-track]` con `translate` che cambia fra
t=0,8 e 2,1, `--arch-w` letto via `getComputedStyle` diverso da `40vw` a t=2,5,
`--arch-w`=`165vw` a caduta, durata < 4 800, tocco → `dt:intro:done` ≤ 1 700.

**2 · HeroCinematic frame-in** — Oggi: desktop `clipPath inset(0…) → inset(6% 4%
10% 4% round 2.5rem)` + `yPercent 6` + `scale 1.05`, contenuto `yPercent -14 /
opacity .2`, cornice `opacity 0` (`:194-209`); telefono sola deriva `yPercent
6.5` (`:230-238`). Verdetto **PORT**, che ribalta esplicitamente `:178-184`
(«il clip-path per frame … costerebbe un repaint … non torna sul telefono»):
per il criterio del paint (§5 del prompt) `clip-path` per frame è ammesso se
si nomina l'alleggerimento. **Parametri**: stessi numeri; l'unico legato alla
geometria è il raggio, `round 2.5rem` → `round 1.5rem` sotto 768 (40 px su 390
mangiano il 10 % della larghezza dell'inset). **Alleggerimento**: `will-change:
clip-path` scritto in `onToggle` dello ScrollTrigger e tolto quando esce (oggi
`willChange: transform` per tutta la vita del trigger, `:193`/`:233`); in
alternativa la cornice a solo transform (wrapper `overflow:hidden` +
`border-radius` che scala a .92 con la foto che contro-scala) — cambia anche
il desktop, si decide in Fase 2 sulla misura per frame (§4.5). **Trappola**:
il commento `:239-248` teme «due padroni» sulla cornice (`frameWrapRef`) — ma
il desktop *ha già* i due padroni (`:209` in scrub, `:373` nella timeline
d'ingresso) e non litigano perché durante l'intro Lenis è fermo e lo scrub sta
a progress 0: portare il ramo desktop tale e quale porta anche quella
convivenza, non la crea. **Prova**: a 390 su `/`, dopo `scrollBy(0, 0.4×vh)`
via rotella vera, `getComputedStyle(mediaRef).clipPath` ≠ `inset(0% …)` e
`transform` contiene una scala > 1.

**3 · HeroCinematic «resto»** — Oggi: `touchmove → reveal(true)` con `dur.micro`
+ `stagger.chars`, senza `lenis.stop()` (`:503-506`, tempi motivati `:493-502`).
**PORT già in essere**: la trasformazione (opacity + y 28) è la stessa, il tempo
è il parametro; non riportare `dur.short/.08` sul dito. Prova esistente:
`e2e/mobile-motion.spec.ts:47`.

**4 · HeroCinematic `<video>`** — Oggi: `heroCinematic.enabled=false` (`media.ts:18`,
scelta cliente 2026-08-03), gate `MQ.desktop` (`:567`) che non decide nulla,
asset `domus-hero.mp4` 5 404 642 B 1920×1080, senza webm né variante mobile.
**Verdetto di Fase 0: KEEP OFF motivato — «manca l'asset mobile, e il video è
spento a ogni larghezza per scelta del cliente»**. La ricetta PORT resta
pronta per quando il video torna (è core dell'MVP, memoria di progetto):
`hero-mobile.mp4` ≤ 3 MB (720p, ~1,5 Mbps, stesso taglio, `poster` = la foto),
`<source media="(max-width: 767.98px)">` prima del sorgente 1080p,
`preload="none"`, `muted playsInline`, montato dopo `dt:intro:done` **e** dopo
il paint del poster (l'`useEffect` `:564-590` va spostato sotto `INTRO_EVENT`),
niente video con `saveData`/`effectiveType 2g` (stessa lista della variante
corta, §3.6). Prova: `perf:report` a 390 senza richieste `.mp4`.

**5 · CameraIn** — Oggi: desktop `scale .96→1 + y 30` in scrub `top 94% → top 42%`
(`:41-52`); telefono `y 24 / opacity 0→1` once + focusin + timeout, con la
guardia «già in campo → non nasconderti» (`:87-88`). Verdetto **PORT**:
scrub di sola trasformazione a ogni larghezza. **Parametri**: `from` dimezzato
nella distanza — `.98` (= 1 − 0,04/2) — e `y 15`; `transformOrigin` uguale;
stessa finestra `94% → 42%`. Il commento `:54-60` («legge come un'oscillazione»)
va **rimisurato** con questi numeri prima di dargli ragione (§4.4).
**Alleggerimento**: escono il tween once, il listener focusin e il timeout
(`:90-132`): in uno scrub di sola scala niente è mai nascosto, quindi non serve
nessuna rete; esce anche `opacity`, che sotto un form era un compromesso
dichiarato (`:62-70`). **Trappola**: `transform` su un wrapper che contiene
form (`Contact`, `CareerApplication`) — il file dichiara verificato che dentro
non ci sono sticky/fixed (`:9-13`); da rivedere se un giorno il form montasse
un `position: sticky`. Testo a scala frazionaria: il «tremolio» del commento è
l'oggetto della misura. **Prova**: su `/contatti` a 390, con la sezione al 70 %
del viewport, `transform` del wrapper (oggi senza attributo: il test gli dà un
`data-camera-in`) è una matrice con scala ∈ (0,98; 1) e cambia con lo scroll;
a fine corsa è identità.

**6 · Fioritura d'angolo ×11** — Oggi: tutte `hidden lg:block` ai call-site
(`Contact.tsx:561`, `DomusDocProtocol.tsx:327`, `Footer.tsx:177`,
`FeaturedTestimonial.tsx:265`, `HorizonStory.tsx:246,:336` (sul wrapper),
`Method.tsx:555`, `Services.tsx:492`, `Paths.tsx:564,:612`, `Team.tsx:132`);
`Team.tsx:138` `variant="center"` gira; cap 1 500 fisso per le d'angolo,
2 200/3 500 per `word` sotto una soglia **locale** 640 (`Fioritura.tsx:291-292`);
canvas `min(dpr, 2)` (`:350`); già iscritta al warmup (`:567`). Verdetto
**PORT** con la regola «una Fioritura per sezione a 390» (`docs/effetti-reference.md:14`):
- HorizonStory: resta accesa **`:248` (corner-tl del manifesto, drift-y)**; la
  scritta «Tradate» `:338` (`word` + `typing`, cap 2 200, la più cara) resta
  `hidden lg:block` con il motivo scritto accanto;
- Paths: resta `:561` (corner-tr della sezione), `:609` (dentro il pannello)
  resta `lg`;
- Team: ha già la `center` (`:138`) → la corner-tr `:130` resta `lg` (una per sezione);
- le altre **sei** (Contact, DomusDocProtocol, Footer, FeaturedTestimonial,
  Method, Services — 11 d'angolo meno le 2 di HorizonStory, le 2 di Paths e
  la corner di Team) si accendono con box mobile (`h-[18vh] w-[28vw]` circa, da
  provare in filmstrip) e — in HorizonScroller — il ramo mobile aggiunge lo
  stesso scrub `drift-y` del desktop (`:431-441`) sul wrapper `:243-249`,
  oggi escluso «perché sono tutte hidden» (`:218-221`).
**Parametri**: soglia 640 → `MQ.sm` (nuovo `sm: "(min-width: 640px)"` /
`belowSm: "(max-width: 639.98px)"` in `gsap.ts`, legge 7); canvas
`min(dpr, 1.5)` sotto `lg`; cap d'angolo sotto `sm` 900 (oggi 1 500 fisso). La
fascia 768-1023 riceve cap 3 500 per `word` e box mobile. **Alleggerimento**:
dpr 1,5 (−44 % pixel per canvas), cap; il registro warmup non cambia.
**Trappola**: memoria dei canvas su iOS con **9** istanze sulla home (le 6
qui sopra + HorizonStory `:248` + Paths `:561` d'angolo, più la `center` di
Team `:138`; `Method:552` è nel pannello `i === 1`, quindi c'è) (checklist
iPhone); la scritta `word` **non** si accende sotto `sm` (resta come oggi).
**Prova**: a 390 su `/metodo` il `<canvas>` di Method ha `width > 0`,
`getContext("2d")` mostra pixel non trasparenti dopo l'ingresso; su `/` ogni
`section` ha ≤ 1 canvas Fioritura visibile.

**7 · Parallax** — Oggi: default `mobile=false` (`Parallax.tsx:53`), gate
`MQ.desktop` (`:65`), `willChange: transform` scritto al mount del ramo (`:70`).
Verdetto **PORT**: default `mobile=true`; sotto 768 `speed` dimezzato dentro
al componente (`amp = speed*14*0.5`, `range` idem: `range 26` di
`EditorialRows:95` → 13 px), con il ramo di larghezza dentro `mm.add`
(condizioni `{desktop, motionOk}`), non due `matchMedia` a mano. Chi resta
spento lo dichiara con `mobile={false}` + «mob off (motivo)»: candidati le tre
fotografie che l'onda precedente ha acceso e rispento dopo la misura — la
misura sta **ai call-site**, non in `Parallax.tsx` `HEAD` (il cui commento
`:33-40` dice ancora «adesso lo passano sei»): `Services.tsx:427-430` 6,4 px,
`Team.tsx:233-234` 6,4 px, `EditorialRows.tsx:64` 7,8 px di corsa totale a
390 (il working tree di `Parallax.tsx:35-39` la riassume in «6-8 px») — con
`speed` dimezzato sarebbero 3-4 px: chi le lascia spente lo scrive lì. `Authority:222`
è codice morto: non conta. **Alleggerimento**: `will-change` solo mentre lo
ScrollTrigger è attivo (`onToggle`), non dal mount al revert; è l'unica cosa da
togliere, e sulla home — 6 call-site (OpenDomus ×2, DomusDocProtocol, Services,
Team, FeaturedTestimonial), 2 già accesi sul telefono e 4 in più col default —
sono 6 layer promossi in meno fuori scena. **Trappola**: `range` in px non scala con la colonna
(`:19-24`); PageHero passa già `mobile` e resta candidato LCP (lo scale di
overscan è pre-applicato in SSR da `Parallax.tsx` stesso, `HEAD:96` /
working tree `:104-110` — non da PageHero: nessun pop). **Prova**: su `/vendi` a 390
(EditorialRows) due letture di `transform` del wrapper interno a scroll
diversi differiscono; PageHero invariato.

**8 · WordReveal** — Oggi: default `mobile=false` (`WordReveal.tsx:45`), gate
`[data-wr-mobile]` (`:82`), unico chiamante passa `mobile`
(`CareerApplication.tsx:493`). Verdetto **PORT**: default `true`, l'opt-in cade;
resta il veto `immediate` (`:76`, il candidato LCP). Nessun titolo cambia stato
oggi. **Prova**: `npx tsc --noEmit`; e2e su `/lavora-con-noi` a 390: gli
span `.w` di `#candidatura h2` passano a `is-in` all'ingresso.

**9 · Scroll cue** — Oggi `hidden md:block` (`HeroCinematic.tsx:822`), fade allo
scroll solo nel ramo desktop (`:211-215`). Verdetto **PORT**: visibile, `h-6`
invece di `h-8`, `bottom: calc(1.5rem + env(safe-area-inset-bottom))`, il fade
`top-=1 → top-=140` portato nel ramo mobile. `MobileActionBar` compare solo a
`scrollY > 520` (`MobileActionBar.tsx:29`) e il cue è già spento a 140:
non si sovrappongono nel tempo. **Alleggerimento**: `animation-play-state:
paused` sul pulse quando il wrapper è a `autoAlpha 0` (una regola CSS su
`[data-cue-off]`, o semplicemente il `visibility:hidden` di autoAlpha, che in
Chromium sospende il paint ma non l'animazione — la regola esplicita è più
onesta). **Trappola 4** (§7.3): il cue non dipende dalla barra, quindi
`MobileActionBar` non va corretto prima. **Prova**: a 390 su `/` il cue è
visibile a `scrollY 0` e a `opacity 0` dopo 200 px.

**10 · PageTransition uscita** — Oggi `mobile ? 0.5 : 0.65` / `0.32 : 0.45`
(`:286`, `:292`), `mobile` letto fuori da `mm.add` (`:198`). Verdetto **PORT**:
0,65 / 0,45 a ogni larghezza; la costante `mobile` sparisce. **Alleggerimento**:
−1 `matchMedia` per navigazione, −1 ramo (era uno dei «gate fuori da mm.add»
di `docs/mobile-parity.md` §3 v15). **Prova**: a 390, dal click su un link
interno al `router.push` passano ≥ 600 ms e la porta arriva a `--arch-y: 104vh`
non prima di 600 ms.

**11 · Footer uncover** — Oggi colonne `y 26 / opacity` sotto `lg` (`:42-65,:67`);
uncover ≥ `lg` con guardia `footer.offsetHeight > innerHeight → columnsEnter()`
(`:73`) e `ResizeObserver` (`:129-147`). Verdetto **PORT condizionato** alla
misura §4.1: se a 390 il footer supera 100 svh (colonna singola +
`pb-[calc(7rem+env())]` `:182`: probabile) → **uncover parziale**: `fixed`
solo l'ultimo blocco (wordmark + riga legale ≤ 100 svh), colonne sopra in
flusso con il loro ingresso; `--dt-footer-h` = altezza del blocco fisso.
Seconda condizione: al termine del settle nessun link del footer sotto la
`MobileActionBar` (`elementFromPoint` sui link → non la barra) — se sì,
TRANSLATE motivato. **Alleggerimento**: nessun observer nuovo; il blocco fisso
è più basso quindi `--dt-footer-h` più piccolo. **Trappola**: `MobileActionBar`
`getElementById("contatti")` in `useEffect([])` (`MobileActionBar.tsx:38-46`,
§6.12 dell'audit precedente): non è una dipendenza dell'uncover, non blocca.
**Prova**: `html.dt-footer-reveal` presente solo se il blocco fisso ≤
`innerHeight`; a fondo pagina `elementFromPoint` sul link privacy ≠ barra.

**12 · ManifestoPin** — Oggi: desktop pin `+=160%` con parole 0,15→1 nei primi
4/5 e ago nell'ultimo quinto (`:82-108`); mobile parole 0,15→1 in scrub `top
80% → top 35%` (~45 vh) + ago in toggle separato (`:109-131`); sezione
`min-h-[70svh]` (`:156`). Verdetto **PORT-SENZA-PIN**: è già la stessa
trasformazione; ciò che manca è la *forma* della timeline (parole 4/5, ago
1/5) e una corsa più lunga. **Parametri**: una sola timeline in scrub `top 85%
→ top 15%` (~70 vh a 844, cioè la sezione stessa: nessun pin), parole con lo
stesso `stagger 0.55/(n−1)` e ago a 0,8. Un pin ≤ 1,2 vh resta possibile ma
non serve: la sezione è già alta 70 svh. **Alleggerimento**: −1 ScrollTrigger
(l'ago entra nella timeline). **Prova**: su `/metodo` a 390 a metà sezione
l'`opacity` della prima parola > dell'ultima; a fine corsa tutte 1 e ago
`clip-path` = `UNDERLINE_SHOWN`.

**13 · LiquidReveal** — `feTurbulence`+`feDisplacementMap` per frame
(`:101-115`) è paint che nessun asset alleggerisce: **TRANSLATE confermato**
(criterio del paint). Rotte reali: `/`, `/metodo`, `/open-domus`.

**14 · ThreadNav** — Oggi sotto `lg`: riga alta 2 px in cima (`:439,:453`),
`scaleX` (`:326,:354`), nodi `aria-hidden` + `tabIndex -1` (`:310`), etichette
`hidden lg:block` (`:495`), `watchSurfaceTone` solo desktop (`:278`, motivo
`:266-277`). Verdetto **PORT dei nodi**: i 5 nodi tornano bottoni sulla linea
(a 390: 5 tacche ≥ 78 px l'una dall'altra ≥ 8 px), bersaglio `::before` 44×44
(`.tap-target`), `aria-label` = titolo del capitolo, `aria-current` come sopra
(`:175-176`), niente etichette a comparsa. **Trappola 1** (§7.3): prima di
riaccendere `watchSurfaceTone` sul filo mobile, `app/lib/ui/surface.ts:71-72`
deve scrivere un attributo suo — **non `data-surface`** (già usato dalle
sezioni per dichiararsi, `surface.ts:22,:40`) — es. `data-rail-tone`; e le
utility `group-data-[tone=dark]` di `ThreadNav.tsx:453,:486,:495` cambiano insieme.
`SurfaceFlow` legge `[data-tone]` una volta al mount (`SurfaceFlow.tsx:83`;
CSS `globals.css:676`): il rename è l'unica via. **Trappola nuova**: la riga
sta a `top-0 z-30` sotto l'`Header` `fixed top-0 z-50` (`Header.tsx:304`):
i bersagli 44×44 dei nodi si sovrappongono alla pill del menu — serve
`elementFromPoint` sul centro di ogni nodo. **Alleggerimento**: niente etichette
(−5 nodi con `transition`), `watchSurfaceTone` a rAF coalescente com'è.
**Prova**: su `/acquista` a 390 ogni nodo è `button` focalizzabile, `hit`
con `elementFromPoint` = il nodo, `aria-current="page"` segue lo scroll.

**15 · HorizonScroller** — Oggi mobile: reveal a blocco (`:121-160`), stairs
ferme (`:162-179`), sipario `dur.reveal` da `top 70%` (`:194-216`), niente
chars, niente fiori. Desktop: chars `rotateY 90 / yPercent 50 → 0` 1,2 s stagger
.03 (`:339-363`), stairs `xPercent wrap([-5,25,-15]) → wrap([5,-25,25])`
(`:382-390`), sipario 1,6 s (`:53`, `:408-409`), fiori drift (`:418-441`).
Verdetto **PORT-SENZA-PIN**: track mai pinnato (nessun `[data-on]`), stessi
tween sull'asse verticale:
- **chars**: SplitText `words,chars` sull'h2 manifesto anche sotto `lg`, stessa
  tween, trigger `top 70%` sull'h2 (l'obiezione `:110-116` era «TextLines è
  ungated → due split»: l'h2 **non** è avvolto in TextLines, quindi è uno split
  solo);
- **slide**: `CURTAIN_DUR` 1,6 s anche sul telefono; l'ingresso resta `top 70%`
  (misura già fatta, `:186-193`);
- **stairs**: da rimisurare (§4.3): la nota `:162-179` giustifica il *no* a uno
  scrub **verticale**; il desktop fa uno scrub **orizzontale** (`xPercent`), e a
  390 la domanda è l'**overflow laterale**, non le righe che si toccano;
- **fiori**: `drift-y` sul wrapper `:243-249` una volta accesa la Fioritura (v. 6).
**Alleggerimento**: nessuna altezza scritta, nessun refresh, SplitText solo su
un h2 (~68 span, senza `will-change`). **Trappola 3**: `restart/reverse` +
resize (§6.15 dell'audit): i trigger `onLeaveBack → reverse` esistono già nel
ramo mobile; la rotazione va provata. **Prova**: a 390 su `/` i `.dt-hchar`
esistono e a metà ingresso hanno `transform` con `rotateY` ≠ 0; il sipario
impiega ≥ 1,4 s da `inset(0 100% 0 0)` a `inset(0)`.

**16 · StarReviews** — Oggi mobile: accensione once (`:265-300`), sweep gated
`[data-lit]` (`:333-342`); desktop: morph in scrub con `applyClip` per frame
(`:384-387`), zoom, flash con **`filter: brightness() saturate()`**
(`:442-443`), chars stirati (`:445-455`), accensione a 0,9 (`:471-479`).
Verdetto **PORT-SENZA-PIN come timeline `once` a tempo** (l'idioma
dell'accensione di oggi), ~3 s totali, trigger `top 85%` dello stage, non in
scrub (runway ≤ 1,2 vh con schermo sticky 100 svh lascerebbe 0,2 vh). Il layer
intro va reso presente sotto `lg` con un box mobile (oggi `display:none`,
commento `:245`). **Alleggerimento nominato**: (a) `screen.getBoundingClientRect()`
letto **una volta** all'avvio della timeline e su `refresh` (oggi a ogni
`onUpdate`); (b) `will-change: clip-path` solo fra A e D; (c) **il flash non usa
`filter`**: un velo bianco in `opacity` sopra la foto (transform/opacity),
a ogni larghezza — `filter` per frame è nell'elenco anti-pattern del prompt e
oggi il desktop lo tweena due volte. **Prova**: a 390 su `/` dopo l'ingresso
`intro.style.clipPath` inizia con `polygon(` e cambia per ≥ 1 s; tessere a
`opacity 1` a fine timeline; nessun `filter` inline sull'immagine.

**17 · ReviewsWall** — Oggi mobile: batch per tessera `y 24 / opacity` once
(`:135-150`); desktop: colonne che volano da ±viewport, zoom `scale 2.05`,
apertura `xPercent ∓40` (commento `:11-16`), runway 520 vh. Verdetto
**PORT-SENZA-PIN**: griglia 2 colonne, **parallasse dei due wrapper di colonna in
scrub** (`yPercent ∓dist.parallax·100/2` in direzioni opposte mentre la
sezione attraversa il viewport), tessere con l'ingresso di oggi; niente
runway, niente sticky. **Alleggerimento**: `will-change` sui due wrapper solo in
`onToggle`. **Trappola**: `h2 max-w-[16ch]` senza `mx-auto` (audit v3);
`document.fonts.ready` resta affare del solo desktop. **Prova**: a 390 a metà
sezione le due colonne hanno `translateY` di segno opposto.

**18 · Paths** — Oggi mobile: sipario `inset(0 0 100% 0) → inset(0)`
`dur.transition` (`:314-319`), punti `x ±48` (`:339-355`), niente scala, niente
righe; desktop: `scale 1.35 → 1.18` + `yPercent 8 → 0` (`:413,:439`), righe
SplitText `lines` `yPercent 120 / rotate 2` (`:472-488`), extras, runway 520 vh.
Verdetto **PORT-SENZA-PIN**: sipario com'è; **foto `scale 1.35 → 1.18` +
`yPercent 8 → 0` in scrub** sull'attraversamento del pannello (`top 90% →
bottom 60%`), righe SplitText `lines` con la stessa tween a `top 60%`,
extras `opacity/y 18`. Il difetto §9.4 (`start "top 90%"` su pannelli
`min-h-[92svh]` più alti del viewport, `test.fixme` in `e2e/mobile-motion.spec.ts:108`)
si chiude qui: innesco `top bottom` + `invalidateOnRefresh` (il refresh a
`fonts.ready` c'è già, `:259-267`), o sentinella in cima al pannello.
**Alleggerimento**: SplitText solo `lines` (≈ 3 righe × 2 titoli), `will-change`
sull'`img` solo in `onToggle`. **Prova**: a 390 su `/` `transform` dell'`img` del
pannello 1 ha scala ∈ (1,18; 1,35) a metà corsa; le `.dt-paths_line` esistono
e salgono; il `fixme` di `:108` diventa `test`.

**19 · TeamTrail** — Oggi mobile: per pannello, in scrub `top 78% → center 45%`:
foto `y 55vh→0 / scale 45/53→1`, testa `y −14vh / rotateY 160→0`, piede `y
18vh`, ruolo `autoAlpha` (`:147-182`); desktop: mondo `preserve-3d`, unità
`z: -i×GAP`, pin `len×140vh+100svh` (`:186-209`, `globals.css:2437-2465`).
Verdetto **PORT-SENZA-PIN definito, forma (a)**: ogni pannello (in flusso) fa il
proprio avvicinamento entrando — `perspective` sul pannello, contenuto da
`z: −0.5·GAP → 0` (o la scala equivalente, che il ramo ha già) più il `rotateY`
della testa: è la trasformazione del desktop senza la sovrapposizione in Z,
che in flusso non esiste. Se la filmstrip non lo legge come corridoio →
TRANSLATE motivato (che è, in sostanza, il ramo di oggi). Forma (b) (pin per
pannello ≤ 1,2 vh) scartata: 6 pin da 1,2 vh sono 7 schermate rubate.
**Alleggerimento**: senza canvas atmosfera (`atmo`, `:121`), niente pin, i
pannelli senza foto restano corti (audit v6). **Prova**: a 390 su `/chi-siamo`
la testa del pannello ha `rotateY` ≠ 0 a metà ingresso e la foto una scala < 1.

**20 · HorizontalRail / Social rail** — Oggi: scroll-x nativo + snap sotto `lg`
(`HorizontalRail.tsx:32-35`), pan `xPercent ±depth` solo desktop (`:127-133`);
`RailProgress` scrive `--rail-p` sull'host, fratello del rail (`RailProgress.tsx:98`).
Verdetto **PORT**: `RailProgress` scrive `--rail-p` **anche** sullo scroller
(`el`, che ha già in mano) e una regola CSS `≤ 1023.98` applica ai `.dt-rail_pan`
`translateX(calc((var(--rail-p) − .5) × −2 × var(--depth) × 1%))` (il `data-depth`
diventa anche `--depth`), gated `:not([data-on])`. **Alleggerimento**: nessun
ScrollTrigger, nessun `will-change`; una scrittura di stile per evento `scroll`
già in atto. **Trappola**: `.dt-rail[data-on]` (desktop) possiede il pan via
GSAP — la regola CSS non deve applicarsi lì. **Prova**: su `/servizi` a 390,
dopo `scrollLeft += 200`, il primo e l'ultimo `.dt-rail_pan` hanno `transform`
diversi.

**21 · Cursor / Magnetic / HoverDistort / parallasse puntatore** — Oggi
`finePointer` (§1.3); il chunk `Cursor` scaricato comunque (`ChromeMount.tsx:16,27`).
Verdetto **KEEP OFF (legge 5)**; il chunk non si scarica su `coarse`: stato
post-mount (`useEffect` + `matchMedia(MQ.finePointer).matches`) attorno a
`<Cursor/>` — è il primo chiamante di `MQ.coarse`/`finePointer` fuori da GSAP.
**Prova**: nessuna richiesta del chunk di `Cursor` a 390 — ma **con un
contesto `coarse` vero**, e oggi ce n'è uno solo: il progetto `mobile-390` di
`playwright.site.config.ts:67` (`devices["iPhone 13"]` su Chromium →
`isMobile`/`hasTouch`, `pointer: coarse`). Il `mobile-390` omonimo di
`playwright.config.ts:44` è `Desktop Chrome` a 390×844 (`pointer: fine`,
`reducedMotion: reduce`), e `scripts/perf-report.ts:39` apre un contesto nudo
`viewport 390×844` senza descrittore (→ `pointer: fine`): `perf:report` così
com'è **non** distingue il gate e va emesso con `...devices["iPhone 13"]`
prima di usarlo come prova (verificato alla contro-verifica: la riga «da
verificare» di §7 si chiude così).

**22-23 · Landscape cover, scroll virtuale** — KEEP OFF, senza discussione
(legge 4; un immobiliare non blocca l'orientamento).

---

## 3. Il preloader

### 3.1 La scaletta, atto per atto

| Atto | Desktop oggi (`Preloader.tsx`) | Telefono oggi | **Telefono, verdetto** |
|---|---|---|---|
| 0 · primo fotogramma | `.dt-preloader-boot` (fondo SSR) → overlay al mount del chunk | uguale | **uguale** (decisione §6.1 del prompt: resta il solo fondo, niente lockup nel layout server) |
| I · lockup | GSAP: `content` 0→1 0,25 s; chars `yPercent 50 / rotateY 90 → 0` 1,3 s stagger .075 `dtOut` da 0,12; script `rotateX 90 / x 6vw` 1,3 s stagger .065 da 0,6; caps `y 14` 0,85 s stagger .11 da 0,4; payoff `yPercent 110` 1,25 s stagger .14 da 0,65; sagoma 0,15→1,05 (`:421-474`) | CSS per riga 0–0,77 s (`globals.css:1790-1816`), caps assenti | **stessi tween, stessi nodi, stessi tempi**; caps `md:flex → flex` (`:705`); strada **A** (§3.2): keyframe CSS sui chars a ogni larghezza |
| II · linea di carica | `progress` 0→1 0,25 s da 0,55; `track` `yPercent −100→0` `dtLoader` 1,55 s da 0,6 (`:481-488`) | assente | **presente**, stessa meccanica; `h-16 w-px` → altezza `min(64px, 10svh)`, spessore **2 px** sotto 768 (leggibile, non più larga) |
| III · porta | `content` `y −28 / autoAlpha 0` 0,55 s da 2,35; `--arch-w 24→36vw`, `--arch-y 104vh→15vh` 1,1 s `domus.inOut` da **2,25** (`:495-506`) | 40→58 vw / 16 vh, 0,7 s da 0,25 | **da 2,25, 1,1 s**; `40→58 vw` (già così, `globals.css:1772-1774`), `16vh` (v. unità sotto); congedo `y −20` da 2,35 |
| IV · tuffo | `fireIntro` a **3,13**; `--arch-w →125vw`, `--arch-y →−100vh` 1,5 s `dtDiveIn` (`:507-513`) | 165 vw, 0,8 s da 0,95 | **da 3,13, 1,5 s, →165 vw** |
| ripiego (no `mask-composite`) | `panel` `clipPath inset(0 0 100% 0)` 0,9 s da 2,6 → 3,50 s | 0,75 s da 0,55 → 1,30 s | **0,9 s da 2,6 → 3,50 s** |
| anelli eco | presenti, layout per frame (`globals.css:1732-1743`) | `display:none` (`:1832-1834`) | **presenti, su transform** (v. sotto) |
| MarkBadge | `spinMarkBadge(root, 6)` (`:311`) | uguale | uguale |
| warmup | `warmAllImages` + `runWarmup(4500)` (`:343-344`) — resta, richiesta cliente | `warmFirstFold(1400)` (`:341`) | `warmFirstFold(≈3000)` (≤ intro − tuffo = 3,13 s) + `scheduleIdleWarmup()` in `finish()` |
| `will-change` lettere | tutta l'intro (`globals.css:270-274`) | assente | **a tempo**: solo la finestra dell'atto I, a ogni larghezza |
| **totale** | **4,63 s** | 1,75 s | **4,63 s** (o `timeScale` dichiarato) |
| skip | `pointerdown`/tasto → `seek("dive")` (`:534-544`) | uguale | uguale; tocco → `dt:intro:done` ≤ 1 700 ms |

**Le unità di `--arch-y`.** Oggi `104vh → 15|16vh → −100vh` (`:503-511`), tutte
`vh`. Sui browser mobili `vh` **è** il viewport grande (`lvh`): `104vh` a
390×844 = 878 px, sotto il bordo anche con la barra URL nascosta; `16vh` =
135 px dalla cima dell'overlay `fixed inset:0`, visibile in entrambi gli stati
della barra; `−100vh` = fuori. Quindi **non serve cambiare unità né mescolarle
in un tween** (il rischio nominato in §6.1 del prompt): si tiene `vh` come oggi
e come ERA (`--arch-y` in `vh` puri, MOBILE.md:82). Un `svh` in `--arch-y`
sarebbe l'errore, non la correzione. La stessa maschera la usa il sipario di
`PageTransition` con `104vh`/`−100vh` (`PageTransition.tsx:35-36`): invariato.

**Anelli eco su transform.** `--arch-h = --arch-w × 10` (`globals.css:1689`),
quindi la forma è omotetica e uno `scale()` uniforme la conserva; ma `calc()`
non divide due lunghezze in un fattore. Via: GSAP scrive **anche** una var
adimensionale `--arch-s` (= `w/w0`) e gli anelli diventano `width/height` fissi
al valore iniziale con `transform: translateX(-50%) translateY(var(--arch-dy))
scale(var(--arch-s))`, dove `--arch-dy` è la sola quota da tweenare in `vh`
(già lo è: `--arch-y`). Il `box-shadow inset 1px` scala con l'anello (~4× a
165 vw): accettato — è un filo di luce, non un bordo. Alternativa più semplice:
tweenare direttamente `scale`/`y` dei due div con la stessa ease dell'arco
nella stessa timeline (+2 tween, −2 `calc()` per frame). Entrambe transform-only.

### 3.2 Il primo fotogramma: la scelta A/B, dalla lettura del codice

> **Aggiornamento dopo la baseline (§5.3):** in laboratorio (CPU ×4, Slow-4G)
> il chunk `ssr:false` di `Preloader` arriva **dopo** il failsafe (1,8 s / 2,5 s
> dallo script inline): `data-pre-live` non compare mai, il sipario cade muto e
> l'intro non suona — né a 390 né a 1440. Quindi A e B, che partono entrambe «al
> mount del chunk», non bastano da sole: serve che l'atto I esista **prima** del
> chunk (opzione **C**: atto I in CSS reso dal server nel layout, chunk in
> `modulepreload`/import statico, failsafe misurato dall'arrivo del chunk o
> allungato perché il sipario non è più vuoto). A resta la forma dell'atto I
> (CSS sui chars, stessa a ogni larghezza); C decide *dove nasce* il markup.
> Decisione da prendere all'approvazione della Fase 0.

**Scelta: A** (per la forma dell'atto I) — atto I in CSS a ogni larghezza, **sui
chars**, e GSAP parte dall'atto II. È evidente dal codice, per tre ragioni:

1. **I nodi ci sono già a ogni larghezza** (`PreChars`, `Preloader.tsx:100-138`;
   la frase «le lettere restano nel markup a TUTTE le larghezze» è a `:100`), con
   `data-pre-char`/`data-pre-schar` e la classe `dt-pre-char`; la maschera
   `overflow-hidden` per il titolo c'è (`:132`), lo script no (`:127`, ruota su
   X e non va tagliato) — esattamente le condizioni dei tween desktop.
2. **Manca solo l'indice per lo stagger.** Oggi l'unico indice è `data-pre-line={step}`
   (0/1) sulle righe (`:133`); i chars **non hanno `--i`**. Il desktop fa un solo
   `fromTo` su *tutti* i `[data-pre-char]` (`:431-443`): «Tua» parte 5×0,075 s
   dopo «Domus». Serve un `style={{ "--i": n }}` per lettera con un contatore
   **globale** fra le due chiamate (`offset` prop a `PreChars`: «Tua» riparte da
   5), stesso per script (13), caps (2, `--i` sui `[data-pre-cap]`) e payoff (2).
   È SSR, deterministico, nessun rischio di idratazione. L'alternativa
   `:nth-child` in CSS funziona (gli spazi sono nodi di testo, non contano) ma
   costringe a scrivere il ritardo di «Tua» a mano: `--i` è più onesto.
3. **Il keyframe è la stessa curva.** `dtOut` = `cubic-bezier(0.25, 1, 0.5, 1)`
   (`gsap.ts:46`), quindi `animation-timing-function` identico; `transformPerspective:
   800` diventa `transform: perspective(800px) translateY(50%) rotateY(90deg)` nel
   `from` (GSAP antepone `perspective()` alla stringa transform: stesso ordine).
   `animation-fill-mode: both` lascia le lettere a `opacity 1 / transform none`,
   e l'unico nodo che GSAP tocca dopo è il **genitore** `[data-pre-content]`
   (`:495-499`): nessun conflitto animazione-CSS-vs-inline (il motivo per cui la
   B è fragile, `:1783-1786`).

Cosa cambia con A: `globals.css:1790-1816` (le animazioni **per riga**) escono a
ogni larghezza; le keyframe per lettera entrano **fuori** dalla media query;
`[data-pre-content] { opacity: 1 }` (`:1787-1789`) diventa la regola base;
in `Preloader.tsx` il blocco `:418-489` perde i quattro `fromTo` dell'atto I e
il `to(content, autoAlpha 1)` a ogni larghezza (−21 tween **per lettera** —
8 titolo + 13 script, il conto di `globals.css:1756-1757` — più caps 2, payoff
2 e content 1: 26 in tutto; il chunk cala) e l'atto II resta GSAP a ogni larghezza (**esce da `if (!mobile)`**).
Offset: mount del chunk e primo tick di `useGSAP` sono lo stesso commit; la
timeline parte a `t=0` con l'atto II a 0,55 (`:482`) e non ha bisogno di
rincorrere il CSS. Se si vuole la cintura, `performance.now()` alla nascita del
componente e `tl.time(elapsed)` prima di `play()`. **`will-change` a tempo**:
`html[data-preloader]:not([data-pre-act2]) .dt-pre-char { will-change:
transform }` con `data-pre-act2` messo da GSAP a **t≈2,7 s**, non 2,0: la
classe `.dt-pre-char` sta su **entrambi** i set di lettere (`Preloader.tsx:120`,
titolo e script), e la finestra va chiusa dopo l'ultimo char in moto — il
titolo finisce a 0,12 + 1,3 + 7×0,075 ≈ 1,95, ma lo script (13 lettere)
finisce a 0,6 + 1,3 + 12×0,065 ≈ 2,68. Verifica: nella filmstrip a 250 ms
nessun fotogramma in cui il lockup torna indietro.

**B** (passaggio di consegne con `getComputedStyle` + `animation: none` +
`gsap.set`) resta come piano di riserva se A trova un caso in cui il CSS parte
*prima* del paint dell'overlay vero (Safari con `data-pre-live` in ritardo): lì
si vedrebbe la sequenza. Da decidere in Fase 1 con la filmstrip, non qui.

### 3.3 Gli otto orologi (righe attuali)

Tutti da un'unica costante `INTRO_MS = 4630` (esportata da `Preloader.tsx`, gemello
numerico nel boot script), un solo commit:

| # | Orologio | Oggi | Riga | Diventa |
|---|---|---|---|---|
| 1 | failsafe boot | `…matches?1800:2500` | `layout.tsx:61` | 2 500 a ogni larghezza (= «quanto teniamo un sipario muto») |
| 2 | riarmo negli abort | `mobile ? 1800 : 2500` | `Preloader.tsx:624` | 2 500 |
| 3 | autohide CSS ≤767.98 | `animation-delay: 2.3s` | `globals.css:1777-1780` | **si toglie**; resta il solo `3s` di `:1653` (= 2,5 + 0,5) |
| 4 | rete hero ≤767.98 | `animation-delay: 4s` su `.dt-hero-rest` e chars | `globals.css:1840-1843` | **si toglie**; restano i `6s` di `:1663`/`:1670` (altrimenti le lettere dell'hero si accendono a t=4 con l'arco aperto da 3,13) |
| 5 | warmup telefono | `warmFirstFold(1400)` | `Preloader.tsx:341` | ≈ 3 000 (≤ `INTRO_MS` − tuffo 1 500) |
| 6 | budget e2e | `width < 768 ? 1900 : 4800` | `e2e/mobile-motion.spec.ts:421` | 4 800 a ogni larghezza; + tocco → `dt:intro:done` ≤ 1 700 |
| 7 | reti a valle | 6 000 | `HeroCinematic.tsx:381`, `CookieConsent.tsx:121` | restano (≥ 4,63 + 1 s) — verificato |
| 8 | commenti | «1,7 s contro 4,63», «sul telefono è 1,8 s», «BUDGET DEI DUE MONTAGGI», «0,25 la porta sale…» | `layout.tsx:20-40`; `Preloader.tsx:21-38, :259-262, :340, :368-375, :408-411, :476-480, :528-533`; `globals.css:259-269, :1745-1766, :1776, :1836-1839`; `warmup.ts:32-38` | riscritti nello stesso commit |

Nono, di fatto: l'oggetto `T` mobile (`Preloader.tsx:376-391`) sparisce — resta
un solo `T`, e `mobile` decide solo i parametri di geometria (`w0/w1/w2/y1`).

### 3.4 Attributi e chiavi che sono contratto

`data-preloader` (boot script → `finish()`), `data-pre-live` (`Preloader.tsx:203`,
toglie `.dt-preloader-boot`), `data-hero-rest`, `data-hero-intro` (`layout.tsx:61`),
`data-consent` (boot + `CookieConsent.tsx:116`), `html.lenis-stopped`
(`SmoothScroll` ↔ `globals.css` overflow), `.dt-preloader-boot` (`layout.tsx:205`),
`is-arch`/`dt-arch-mask` (`Preloader.tsx:298`, `PageTransition.tsx:161`),
`sessionStorage['dt-intro-seen']`, cookie `dt_consent`, cookie `dt_locale`
(`Preloader.tsx:65-68`), evento `dt:intro:done` (`INTRO_EVENT`, `fireIntro()` una
volta per documento `:82-87`), `window.__dtPreArmed`/`__dtPreFailsafe`
(`layout.tsx:61`, `Preloader.tsx:179,:264,:619`), il `MutationObserver` di
`SmoothScroll.tsx:87-99` (rilascio Lenis alla caduta dell'attributo, da
qualunque mano). **Nuovi** con questa onda: `data-pre-short` (variante corta,
§3.6), `data-pre-act2` (finestra `will-change`), la custom property `--i` sui
chars, `INTRO_MS`.

### 3.5 La sagoma

`public/media/raffaela-sagoma.webp`: **79 000 B**, RIFF/WEBP `VP8X` con alpha,
**2000×1415** (canvas dichiarato 1999+1 × 1414+1); `raffaela-sagoma.png`
**809 484 B**, 2000×1415 (fallback). Markup: `<picture><source type=webp><img
png>` (`Preloader.tsx:661-669`), `object-cover`, `object-position: 50% 70%` —
la stessa geometria della foto hero (`HeroCinematic.tsx:618-630`, `next/image
sizes=100vw`), che è ciò che fa coincidere sagoma e foto pixel su pixel.

Variante mobile (legge 2, Lusion `_ld`): una riga `<source media="(max-width:
767.98px)" srcset="/media/raffaela-sagoma-m.webp" type="image/webp">` prima
della sorgente piena. **Come si ricava il file, e la trappola**: sul telefono
in verticale `object-cover` mostra una striscia centrale (a 390×844 ≈ 654 px
di sorgente su 2000): il risparmio sta nel **ritaglio orizzontale**, non nel
ricampionamento (la sorgente è già sotto-campionata rispetto ai 1 170 px di
display a DPR 3). Ma il ritaglio deve conservare l'allineamento con la foto
hero (che resta a 2000): con `object-cover` e stesso `object-position` il
ritaglio simmetrico attorno a `x=50%` mantiene la coincidenza **finché il
rapporto del box (w/h) è minore del rapporto del file**. Un file 1000×1415
(0,707) copre ogni telefono in verticale (390/844 = 0,46; 430/932 = 0,46) ma
non un 767×844 (0,91): la `media` va scritta di conseguenza — `(max-width:
767.98px) and (max-aspect-ratio: 7/10)` per il ritaglio a 1000, sorgente piena
altrove. Peso atteso: **da verificare con l'encode** (a parità di qualità un
ritaglio al 50 % della larghezza sta intorno ai 40 KB; il ≤ 30 KB del prompt
può chiedere qualità 75). `aria-hidden` non toglie l'immagine dalla candidatura
LCP: lo dice la misura (§5), non l'attributo.

### 3.6 La variante corta e il boot script

Solo su condizioni di **device**, mai di larghezza: `navigator.connection.saveData`,
`effectiveType` ∈ {`2g`, `slow-2g`}, `deviceMemory < 4`, `hardwareConcurrency < 4`
— la lista di `HoverDistort.tsx:102-104` più `effectiveType`, da aggiungere
anche lì così la lista resta una. Letta **nel boot script prima del paint** e
scritta come `html[data-pre-short]`: CSS (niente keyframe dell'atto I, atto II
`display:none`) e `Preloader.tsx` (`T` corto: pre-roll 0,25 + porta 1,1 + tuffo
1,5 ≈ 2,85 s; ERA short = 3,75 s) leggono lo stesso verdetto; il registro
sessione resta `dt-intro-seen`; il failsafe resta 2 500.

Il boot script oggi (`layout.tsx:61`) fa, in ordine: reduced-motion → hash
profondo (segna la sessione) → `pre` → `data-preloader` + `__dtPreArmed` +
`__dtPreFailsafe` (1 800/2 500) → `data-hero-rest`/`data-hero-intro` → `data-consent`
se `!pre` e senza cookie. Diventa: stesso ordine, failsafe **2 500 piatto**,
più `data-pre-short` calcolato dal device **prima** di `pre` (così vale anche
per il CSS del primo fotogramma). L'hash profondo continua a saltare l'intro;
reduced-motion non la stampa mai (`e2e/mobile-motion.spec.ts:619`).

---

## 4. Verdetti aperti — si chiudono con una misura (Fase 0.3)

| # | Cosa | Come | Chiude |
|---|---|---|---|
| 4.1 | **Footer a 390**: `footer.offsetHeight` vs `100svh` (`Footer.tsx:73`); altezza del blocco «wordmark + legale» da solo | Playwright 390×844 su `/` e `/acquista`, `getBoundingClientRect` del footer, del `gridRef` e dell'ultimo blocco; `elementFromPoint` sui link legali con `MobileActionBar` visibile a fondo pagina | verdetto 11: uncover parziale vs TRANSLATE |
| 4.2 | **Video hero**: esiste? peso, dimensioni, durata | fatto per lettura: `domus-hero.mp4` 5 404 642 B, 1920×1080, 4,000 s (mvhd timescale 1000 / duration 4000, riletto dall'header; ffprobe assente su questa macchina), nessuna variante; `enabled=false` | verdetto 4: KEEP OFF motivato; PORT solo se arriva `hero-mobile.mp4` ≤ 3 MB e il cliente riaccende il video |
| 4.3 | **Stairs a 390** (`HorizonScroller.tsx:382-390`): larghezza di ogni riga `[data-horizon-stair]` a 390 (font `clamp(2.6rem,7vw,6.5rem)` = 41,6 px) e larghezza + 25 % vs 390; interlinea fra le righe (la nota `:162-179` parla di uno scrub *verticale*, non di questo) | Playwright 390: `getBoundingClientRect().width` delle tre righe; se `w×1.25 > 390` per una riga → ampiezze dimezzate (±2,5/12,5/7,5) o `whitespace-nowrap` + `overflow:clip` della sezione (che c'è già, `HorizonStory.tsx:287-292`) | verdetto 15: stairs in PORT-SENZA-PIN o ferme (TRANSLATE motivato) |
| 4.4 | **CameraIn a distanze dimezzate**: `scale .98→1 + y 15` legge come camera o come oscillazione (`:54-60`)? | filmstrip a 390 su `/contatti` con lo scrub applicato via `gsap.set(el, {scale, y})` a 5 quote (0/25/50/75/100 %) — o un ramo temporaneo dietro `?camera=1`; si guarda il bordo del testo a 2× | verdetto 5: PORT o TRANSLATE con la ragione scritta |
| 4.5 | **Per-frame di ToneShift ×3 e SurfaceFlow**: `ToneShift.tsx:75-77` (`onUpdate → setProperty("--tsp")` in scrub 0,5), `SurfaceFlow.tsx:145` (`onUpdate → paint`, `setProperty("--dt-surface")` `:127`) | CPU profile con CPU ×4 durante lo scroll programmato della home a 390: self-time per callback; soglia 2 ms/frame (§8 Fase 4 del prompt) | Fase 4: passo di aggiornamento ridotto, non spenti |
| 4.6 | **Frame-in per frame** (verdetto 2): costo del `clip-path` con `round` su layer full-viewport a 390 con CPU ×4 | stesso profilo di 4.5 sui primi 100 vh di scroll; confronto con la cornice a solo transform | verdetto 2: quale delle due forme |
| 4.7 | **Elemento LCP a 390 con l'intro**: sagoma vs foto hero vs banner (`docs/mobile-parity.md` §7.1 punto 1, mai chiuso) | la sonda CDP nomina l'elemento (`largest-contentful-paint` entry `.element`) a freddo e a caldo | budget §5 |
| 4.8 | **Refresh per barra URL** (`ScrollTrigger.config({ignoreMobileResize:true})` è il primo commit di Fase 1) | conteggio di `refresh` su un ciclo 844→744→844 prima/dopo | guardrail §7.2 |

---

## 5. Piano di misura

### 5.1 Cosa misura la baseline (Fase 0.3), sulla build corrente, prima di toccare qualunque cosa

1. **Sonda CDP** (`scripts/mobile-cdp-probe.ts`, Fase 0.1): CPU ×4, 1,6 Mbps /
   RTT 150 ms, 390×844, `dt_consent=accepted`; a **freddo** (intro) e a **caldo**
   (`sessionStorage['dt-intro-seen']='1'` via `addInitScript`); su `/` **e**
   `/acquista`; mediana su 3 run; **due volte** per stimare σ (un delta sotto σ
   non è un delta). Emette per rotta: FCP, LCP **con il nome dell'elemento**,
   TBT proxy (blocking dei long task fra FCP e FCP+8 s), `ScrollTrigger.getAll().length`
   e nodi con `will-change ≠ auto` a fine caricamento e dopo lo scroll, jank di
   scroll (scroll programmato un viewport ogni 400 ms fino al fondo, rAF: p95
   del tempo di frame e % frame > 50 ms). `--out` JSON.
2. `npm run lighthouse` (informativo: l'assoluto simulato non vede il delta,
   `docs/mobile-parity.md` §9.1.1/§11.1).
3. `npm run perf:report` (390): byte immagini/JS/media per `/`, `/acquista`,
   `/vendi`, `/metodo`, `/contatti`; oggi sagoma 79 000 B, chunk `Cursor` presente
   su `coarse` (nota: `perf-report.ts:39` apre un contesto `Desktop Chrome`
   390×844, cioè `pointer: fine` — per la riga del chunk `Cursor` serve
   `...devices["iPhone 13"]`, v. scheda 21).
4. Screenshot a 390 di **ogni** rotta di `app/sitemap.ts` (`/`, `/vendi`,
   `/valutazione-immobile-tradate`, `/acquista`, `/case-vendute`, `/metodo`,
   `/open-domus`, `/servizi`, `/recensioni`, `/chi-siamo`, `/contatti`,
   `/lavora-con-noi`, `/domande-frequenti`) + `/privacy`, `/cookie` + un
   `/case/[slug]` di fixture (`scripts/mobile-shots.ts`, `ROUTES` da allineare
   al `HEAD`: mancavano `/case-vendute` e `/valutazione-immobile-tradate` e
   c'era `/case`, che è un redirect 301 a `/acquista` (`next.config.ts:67`) —
   già allineato nel working tree dalla Fase 0.1).
5. Filmstrip dell'intro (`scripts/intro-filmstrip.ts`): sessione fredda, stessa
   throttling, uno scatto ogni 250 ms da `data-pre-live` a 5 s, a 390×844 e
   1440×900, su `/` e `/acquista`, in `docs/shots/intro-<larghezza>-<fase>/`
   (gitignored, `.gitignore:81`).
6. Le misure di §4 (4.1, 4.3, 4.7, 4.8; 4.4-4.6 quando c'è il ramo da profilare).

### 5.2 Le soglie (§7.1 del prompt)

- per fase: LCP a freddo ≤ +150 ms, TBT proxy ≤ +100 ms rispetto al proprio baseline;
- cumulativo rispetto alla baseline di Fase 0, stessa macchina: LCP a freddo
  ≤ +250 ms, TBT proxy (freddo e caldo) ≤ +150 ms, jank ≤ +5 punti di % frame > 50 ms;
- a11y ≥ 0,95, CLS ≤ 0,1, SEO ≥ 0,95: gate assoluti (Lighthouse);
- `/acquista` a freddo si misura **con** l'intro da 4,63 s, stesso delta ammesso;
- superata una soglia: asset → `timeScale` (1,25 → 1,5, mai sotto) → variante
  corta (device) → stop coi numeri. `lighthouserc.js` non si tocca.

### 5.3 Baseline (Fase 0) — misurata il 2026-08-17

Build: `c4bccf8` (`main`, `next build` + `next start --port 3181`) · macchina di
sviluppo Windows, sola (nessun altro carico) · sonda `scripts/mobile-cdp-probe.ts`
CPU ×4, 1 638 kbps / 150 ms RTT, 390×844 iPhone 13, `dt_consent=accepted`,
mediana di 3 run, **due corse** (A: 14:44, B: 14:52) · JSON in
`docs/shots/baseline-fase0/probe-{a,b}.json` (gitignored).

| Rotta | Modo | corsa | FCP | LCP (elemento) | TBT proxy | long. task max | `[data-on]`/pin-spacer | will-change (post-scroll) | jank p95 | % frame >50 |
|---|---|---|--:|---|--:|--:|--:|--:|--:|--:|
| `/` | freddo | A | 3 084 | 3 084 · `span.will-change-transform «f»` (lettera dell'hero, 14 250 px²) | 4 306 | 2 720 | 3 / 0 | 358 (390) | 250 | 61 % |
| `/` | freddo | B | 2 764 | 2 764 · idem | 1 244 | 897 | 3 / 0 | 103 (387) | 517 | 83 % |
| `/` | caldo | A | 2 456 | 2 456 · idem | 1 201 | 680 | 3 / 0 | 103 (386) | 600 | 90 % |
| `/` | caldo | B | 4 076 | 4 076 · idem | 1 184 | 1 063 | 3 / 0 | 103 (387) | 450 | 81 % |
| `/acquista` | freddo | A | 2 048 | 2 652 · `img.ken-burns` (hero, 292 896 px²) | 4 075 | 2 082 | 0 / 0 | 29 (92) | 183 | 57 % |
| `/acquista` | freddo | B | 1 768 | 2 144 · idem | 3 528 | 1 926 | 0 / 0 | 29 (92) | 150 | 49 % |
| `/acquista` | caldo | A | 2 072 | 2 460 · idem | 3 656 | 1 997 | 0 / 0 | 29 (92) | 167 | 55 % |
| `/acquista` | caldo | B | 1 532 | 2 188 · idem | 3 589 | 1 883 | 0 / 0 | 29 (92) | 150 | 44 % |

**Rumore (σ fra le due corse, stessa build):** su `/` il TBT proxy oscilla fra
1 244 e 4 306 ms a freddo (i run singoli: 933 / 5 228 / 1 244 in B, 4 306 / 4 403
/ 3 703 in A) — la finestra FCP→FCP+8 s **cattura o manca il long task di
react-dom (~2-2,7 s)** a seconda di quando idrata: **σ(TBT, `/`) ≈ 3 000 ms**,
σ(LCP, `/`) ≈ 300-1 600 ms. Su `/acquista` è più stabile: σ(TBT) ≈ 500 ms,
σ(LCP) ≈ 500 ms. **Conseguenza per §5.2: le soglie per fase «+100 ms TBT / +150 ms
LCP» sono sotto il rumore sulla home** — lì valgono solo il tetto cumulativo
letto su ≥ 2 corse, l'elemento LCP e il jank; su `/acquista` le soglie reggono.
Un delta sulla home va dichiarato solo se supera 2σ o cambia l'elemento LCP.

**Il fatto che nessuno aveva misurato — l'intro NON suona, in laboratorio, a
nessuna larghezza.** Filmstrip (`docs/shots/intro-390-fase0/*.jpg`,
`intro-1440-fase0/*.jpg`, stessa throttling, sessione fredda): `html[data-pre-live]`
**non compare mai entro 3 s** dal commit su nessuna delle quattro pellicole;
`data-preloader` cade per il **failsafe** del boot script a 3,1-3,9 s (pagina; sonda:
`preloaderFall` 3 122 / 3 328 su `/`, 3 969 / 3 695 su `/acquista`) — cioè 1,8 s
dopo l'esecuzione dello script inline, prima che il chunk `ssr:false` di
`Preloader` sia arrivato; il chunk atterra e spara `dt:intro:done` a **9,3-10,3 s**
(sonda: `introDone` 9 312 / 9 727 su `/acquista` cold; filmstrip: 9,5 s a 390,
14 s a 1440). Nelle pellicole si vede: fondo pieno per ~1,8 s, poi la foto hero
già scoperta, poi le lettere dell'hero che si accendono a t≈4 s per la rete CSS
`data-hero-rest` (`globals.css`, `animation-delay: 4s`), poi il banner cookie
quando arriva il chunk. **Nessuna porta ad arco, nessun tuffo, nessun lockup**:
sotto CPU ×4 + Slow-4G l'intro di oggi è un sipario muto di 1,8 s. Vale sul
telefono e sul desktop (1440: cade a 4,7 s, chunk a 14 s). Tre conseguenze:
1. il «cold vs warm» di `docs/mobile-parity.md` §12.1 (e questa baseline) **non ha
   mai misurato l'intro**: ha misurato un overlay pieno che cade da solo;
2. **l'elemento LCP di Lighthouse sulla home è il paragrafo del banner cookie**
   (`#cookie-consent-desc`, 9 933 ms, 3/3 run) — il banner aspetta `dt:intro:done`
   (`CookieConsent`), che aspetta il chunk: l'LCP a 9,9 s della home è **il ritardo
   del chunk**, non il peso della pagina (FCP 1 375 ms); su `/acquista` l'LCP è la
   foto hero (4 600 ms) e non dipende dall'intro;
3. la Fase 1 deve prima di tutto **far arrivare l'atto I prima del failsafe**, o non
   c'è niente da rendere «uguale al desktop»: la scelta A/B di §3.2 va riletta con
   una **terza opzione (C)**: l'atto I in CSS **reso dal server** nel layout (oggi il
   server rende solo il fondo `.dt-preloader-boot`, `layout.tsx:205`), con il chunk in
   `modulepreload`/import statico e il failsafe misurato dall'arrivo del chunk o
   allungato (con un atto I vivo il sipario non è più «vuoto», la rete può essere
   più lunga). Costo di C: il lockup nel layout server (payoff da `dt_locale` via
   `cookies()`), un DOM in più (~40 nodi) a ogni visita — decisione da prendere
   all'approvazione, non in silenzio. Senza C (o equivalente), sul telefono di
   fascia media l'intro «uguale al desktop» resterebbe teoria.

**Lighthouse** (`npm run lighthouse`, lhci, mediana di 3, `.lighthouseci/`):
`/` perf **0,40** (0,40/0,40/0,40) · FCP 1 375 · **LCP 9 933** (el. `#cookie-consent-desc`)
· **TBT 2 359** (2 359/2 528/2 359) · SI 6 573 · CLS 0,000 · a11y 0,97 · SEO 1,00 · BP 1,00 ·
`unused-javascript` 0 (warning); `/acquista` perf **0,57** (0,51/0,57/0,69) · FCP 1 361 ·
**LCP 4 652** (el. `img` hero) · **TBT 923** (1 042/923/523) · CLS 0,000 · a11y 1,00 ·
SEO 1,00 · `uses-responsive-images` 0,5 (warning). Contro `docs/mobile-parity.md`
§11 (0,50 / 9 812 / 1 045; 0,82 / 4 540 / 125): la home è peggiorata di TBT
(1 045 → 2 359), `/acquista` di perf (0,82 → 0,57) e TBT (125 → 923) fra il
2026-08-13 e il `c4bccf8` — regressione **precedente** a quest'onda (PR #50-#53), da
non attribuire a nessuna fase.

**`perf:report`** (390, contesto Desktop-Chrome — cfr. scheda 21):
`/` HTML 607 730 · JS 1 057 643 · CSS 147 438 · img 466 235 · font 132 692 · media 0 ·
tot 2 411 738 B · 34 req · 2 007 nodi DOM; `/acquista` 525 355 / 1 016 537 / img 64 050 /
tot 1 886 072 · 2 125 nodi; `/vendi` tot 1 516 539 · 1 102 nodi; `/metodo` tot 1 855 754
(img 427 880); `/contatti` **JS 1 879 419** · 99 req · tot 2 398 674 (la mappa: fuori
scope, ma va nel report). Sagoma 79 000 B a ogni larghezza; il chunk Cursor su
`coarse` non è distinguibile con questo contesto (`pointer: fine`): misura da rifare
con `iPhone 13` in Fase 4.

**Screenshot 390** di tutte le rotte + `/case/2079` in `docs/shots/baseline-fase0/shots-390/`.

**Misure §4:**
- **4.1 Footer a 390**: `footer.offsetHeight` = **1 393 px** su `/` e `/acquista`
  (griglia 949 = 371 + 301 + 181; blocco finale «wordmark + legale» 102 px) contro
  100 svh = 844: **la guardia `Footer.tsx:73` esclude l'uncover** com'è. `MobileActionBar`
  in fondo pagina è nascosta (`#contatti` in vista): nessun link legale coperto
  (`elementFromPoint` = 0). → verdetto 11: **uncover parziale** (fixed solo l'ultimo
  blocco ≤ 100 svh) o TRANSLATE motivato; il conflitto con la barra non esiste lì.
- **4.3 Stairs a 390**: le tre righe `[data-horizon-stair]` sono `display:block` larghe
  **350 px** (contenitore, `left` 20), font 41,6 px, interlinea 39,5 px, sezione
  `overflow: visible`. Con i valori desktop `xPercent −5/+25/−15` la terza riga parte
  a `20 − 52 = −32 px` (testo tagliato a sinistra e overflow del documento), la seconda
  arriva a `20 + 87 + larghezza testo`. → verdetto 15: stairs **in px clampati**
  (max ±16 px, dentro i 20 px di margine) oppure ferme (TRANSLATE motivato) —
  decisione in Fase 3, con `overflow-x: clip` sulla sezione in ogni caso.
- **4.7 Elemento LCP a freddo**: sonda → lettera dell'hero (`span «f»`) su `/`, foto
  hero su `/acquista`; Lighthouse → **banner cookie** su `/` (vedi sopra: dipende dal
  chunk in ritardo).
- **4.8 refresh 844→744→844**: **non misurabile** senza un hook su `ScrollTrigger`
  (GSAP non è sul `window` in produzione; la sonda usa `[data-on]`/`.pin-spacer` come
  proxy). L'hook (`window.__dtST`) entra col primo commit di Fase 1 insieme a
  `ScrollTrigger.config`.
- 4.4 / 4.5 / 4.6: richiedono i rami da profilare → Fase 2/4.

---

## 6. Doc e commenti disallineati (§3.6) — chi li corregge

Un altro agente sta correggendo questi file nel working tree (li vedo modificati:
`Parallax.tsx`, `SmoothScroll.tsx`, `gsap.ts`, `docs/performance.md`,
`e2e/mobile-motion.spec.ts`, `lighthouserc.js`). Qui l'elenco con lo stato al
`HEAD` e cosa deve dire; non ricontrollo i suoi diff.

| Dove (`HEAD`) | Diceva | Deve dire | Stato |
|---|---|---|---|
| `gsap.ts:105-107` | `belowDesktop` e `coarse` senza chiamanti | `belowDesktop` ×3 (`HeroCinematic:230`, `CameraIn:61`, `Preloader:197`); `coarse` 0, resta per la legge 5 | in mano all'agente §3.6 |
| `Parallax.tsx:33-36` | «adesso lo passano sei» | ne passano **tre** (PageHero:126, FeaturedTestimonial:225, OpenDomus:222); 9 no; Authority morto | in mano all'agente §3.6 |
| `SmoothScroll.tsx:67-70` | «sotto i 768px l'attributo non viene mai stampato» | stampato a ogni larghezza dal 2026-08-11 (`layout.tsx:61`) | in mano all'agente §3.6 |
| `lighthouserc.js:61-62` | il cookie «salta il preloader» | il preloader vive di `sessionStorage`; Lighthouse suona sempre l'intro, anche su `/acquista` | in mano all'agente §3.6 |
| `e2e/mobile-motion.spec.ts:428` | `globals.css:1583-1591` | `1590-1598` | in mano all'agente §3.6 |
| `docs/performance.md` | 80 / 5,4 s / 80 ms; intro «~2,2 s»; failsafe 2,5 s; font Fraunces | numeri di `mobile-parity.md` §11-12; intro 4,63 / 1,75 (poi 4,63 a ogni larghezza); Playfair | in mano all'agente §3.6 |
| `docs/mobile-parity.md` §3 v1 (:283) | HorizonStory mobile con TextLines; esce il word-spacing | h2 a reveal di blocco (`HorizonScroller.tsx:110-116`); word-spacing tolto a ogni larghezza (`HorizonStory.tsx:188-203`) | **da fare** (nota di superamento in testa a §3, non riscrittura: quel doc è storia) |
| §3 v3 (:285) | «uno ScrollTrigger» | batch per tessera (`ReviewsWall.tsx:136-150`) | da fare |
| §3 v4 (:286) | nodi che «saltano al capitolo» | nodi inerti `aria-hidden` (`ThreadNav.tsx:310`) | da fare |
| §3 v5 (:287) | foto `scale 1.06→1` | tolta (`Paths.tsx:288-294`) | da fare |
| §3 v10 (:292) | i marchi d'angolo «si spengono con la deriva» | non fatto, motivato (`HeroCinematic.tsx:239-248`) | da fare |
| §5.2 (:410-418) | riarmo abort 8 000 ms; commenti vecchi | 1 800/2 500 (`Preloader.tsx:619-625`); durate ora giuste in `:21-24` | da fare |
| §5.4 (:462-464) | «l'overlay è già montato dallo script inline» | solo l'attributo; il fondo SSR è `.dt-preloader-boot` (`layout.tsx:191-205`) | da fare |
| `layout.tsx:20-40` («1,7 s contro 4,63 s», «sul telefono è 1,8 s») | — | diventano falsi in Fase 1: si riscrivono lì, con `INTRO_MS` | Fase 1 (orologio 8) |
| `Preloader.tsx:21-38, :368-375` («BUDGET DEI DUE MONTAGGI») e i commenti dell'atto I/II | — | idem | Fase 1 |
| `HeroCinematic.tsx:178-184` | «il frame-in NON torna sul telefono, nemmeno in Fase 2» | ribaltato dal verdetto 2 | Fase 2 |
| `HeroCinematic.tsx:5` | «video-ready: quando … `enabled=true`, parte (desktop, no reduced-motion)» | è esatto (`enabled=false` in `media.ts:18` è la condizione che il commento nomina): il dossier locale lo elenca come discrepanza, **non lo è** — nessuna correzione | nessuna |
| `MobileActionBar.tsx` / audit §6.12 «:35-44» | — | oggi `:38-46` | solo riferimento |

Elenco esteso in `reverse-engineering/domus-tua-gap-mobile.md` §9 (locale).

---

## 7. Cosa questo documento NON ha fatto

Nessuna misura runtime: niente build, server, e2e o sonde (una build di
produzione girava in parallelo). Tutti i numeri sono letture del codice al
`c4bccf8` o citazioni di `docs/mobile-parity.md` §11-12. Le righe «da
verificare» sono: il peso della sagoma mobile (encode non fatto) e tutta la
§5.3. Chiuse alla contro-verifica: la durata del mp4 (mvhd riletto: 4,000 s
esatti, tkhd 1920×1080) e `pointer: coarse` — è `coarse` solo il `mobile-390`
di `playwright.site.config.ts:67` (`iPhone 13`), non quello di
`playwright.config.ts:44` né il contesto di `scripts/perf-report.ts:39`
(entrambi `Desktop Chrome`).
