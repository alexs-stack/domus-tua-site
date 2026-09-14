# La coreografia di era-residence dentro la rivista bianca

Bozza unica del design, 2026-09-13, branch `claude/rivista-bianca`. Destinazione: `docs/superpowers/specs/2026-09-13-coreografia-era-residence-design.md`.

Fonti:
- le cinque corsie `docs/superpowers/specs/2026-09-13-coreografia-era-residence/design/lane-sistema.md`, `lane-homeA.md`, `lane-homeB.md`, `lane-homeC.md`, `lane-globali.md` e i cinque verdetti dei revisori (tutte le correzioni bloccanti sono applicate qui, e ogni scelta fra corsie in conflitto è scritta col suo perché);
- `docs/superpowers/specs/2026-09-13-coreografia-era-residence/map/era-catalog.md` (CAT §n) e `reverse-engineering/era-residence/js/main.pretty.js` (ERA:n);
- tre misure nuove fatte per questa bozza sul build del branch (`next build` e `next start` del 13 set., Playwright headless): altezze della home (`docs/superpowers/specs/2026-09-13-coreografia-era-residence/measure-home.mjs`), LCP e CLS di base (`docs/superpowers/specs/2026-09-13-coreografia-era-residence/measure-lcp.mjs`), distanza fra le curve di easing con `gsap.parseEase` (`docs/superpowers/specs/2026-09-13-coreografia-era-residence/ease-dist.cjs`).

Approvata da Alberto il 13 settembre 2026 («Approvato, scrivi la spec»), con le sei domande di forma del §12.1 risolte (A21-A26). Nessun codice è scritto: piano e costruzione partono dall'handoff `docs/superpowers/handoff/2026-09-13-coreografia-era-residence.md`.

---

## 0. In una riga

Alberto ha scelto il 13 settembre «Coreografia piena» (A18), «Sticky dove serve» (A19) e «Fedeltà letterale» (A20): ogni capitolo della home prende un gesto suo, legato allo scroll e speculare, con sei corridoi sticky in home, il tuffo su tutte le 11 PageHero, i titoli per lettera e la porta corta del preloader su ogni rotta. Queste scelte superano C03 della cliente e vanno mostrate a lei.

---

## 1. Registro (spec del 10 settembre, §11)

### 1.1 Alberto, dopo A17

| ID | Data | Parole esatte | Stato e applicazione | Fonte |
|---|---|---|---|---|
| A18 | 2026-09-13, risposta alla domanda sul budget di movimento (fra «disciplina + 3 momenti», «solo disciplina», «coreografia piena») | «Coreografia piena» | **Applicata, da mostrare alla cliente perché supera C03** (domanda aperta 12). Ogni capitolo della home ha un comportamento suo legato allo scroll; entrate e uscite speculari; monogramma sempre visibile con cambio di tema sopra le foto; porta corta del preloader alle ricariche. Supera anche il Don't di `DESIGN.md:587` sui tre nastri. | transcript 2026-09-13; memoria `domus-coreografia-era.md:13` |
| A19 | 2026-09-13, risposta alla domanda sui corridoi (fra «nessun corridoio nuovo», «solo l'hero», «dove serve») | «Sticky dove serve» | **Applicata, da mostrare alla cliente perché supera C03** (domanda 12). Sei corridoi in home: `HorizonStory` (#storia), `StarReviews` (#recensioni), rotaia del team, più il tuffo dell'hero, la finestra di Open Domus e la cartolina del Congedo. Tutti `position: sticky` su un corridoio, mai il pin di GSAP; da 1024 px con motion ok (§4). | come sopra, `:14` |
| A20 | 2026-09-13, risposta alla domanda sull'impianto (fra «un gesto per capitolo», «per atti», «fedeltà letterale») | «Fedeltà letterale» | **Applicata, da mostrare alla cliente perché supera C03** (domanda 12). In home un gesto per capitolo e nessuna coppia di capitoli con la stessa ease, lo stesso tempo o lo stesso innesco (§3.1); tuffo sticky sulle 11 PageHero; flip per lettera su tutti i titoli; porta corta su ogni rotta. Alberto ha scelto l'opzione che diceva «rischio: LCP e H1 nascosti su 14 pagine»: il rischio è accettato e si ingegnerizza (§2.5). | come sopra, `:16` |
| A21 | 2026-09-13, domanda di forma 1 (monogramma) | «Si stacca da 1024» | **Applicata nel design** (D34, §6.1): da 1024 px il cuore lascia la testata e resta nel margine a 4vw; sopra le foto virano solo le tacche dell'anello (T1); sotto 1024 il logo nella testata sticky. | transcript 2026-09-13 |
| A22 | 2026-09-13, domanda di forma 2 (flip) | «Piatto come Era» | **Applicata nel design** (§2.2): nessuna `transformPerspective`; la firma dell'hero entra col ruolo `accent`. | transcript 2026-09-13 |
| A23 | 2026-09-13, domanda di forma 3 (foto dell'hero) | «Salita all'80%, chiedo l'originale» | **Applicata nel design** (D24, §3.2): `t′ = 0,80 · tImg`, la scala 2 va sotto la risoluzione solo in corsa; lo scatto originale si chiede alla cliente (domanda aperta 14). | transcript 2026-09-13 |
| A24 | 2026-09-13, domanda di forma 5 (villa in home) | «Territorio col drone sul quartiere» | **Applicata nel design** (§7.4): il territorio prende `territorio-quartiere.jpg`; la riga 1 di Services `villa-sala-tour.jpg`. | transcript 2026-09-13 |
| A25 | 2026-09-13, domanda di forma 4 (Seguici) | «Esce crescendo e sfumando» | **Applicata nel design** (§3.15). | transcript 2026-09-13 |
| A26 | 2026-09-13, domanda di forma 6 (/case/[slug]) | «Nessun sipario» | **Applicata nel design** (D32, §5.4, §6.2): su `/case/*` né film né porta corta. | transcript 2026-09-13 |
| — | 2026-09-13, approvazione del design | «Approvato, scrivi la spec» | Design approvato; piano e costruzione partono dall'handoff `docs/superpowers/handoff/2026-09-13-coreografia-era-residence.md`. | transcript 2026-09-13 |

Stati da riscrivere:
- **C03** (spec:367): «**Superata da A12 e da A18-A20** (Alberto, 13 set.), da mostrare alla cliente: domanda aperta 12. Restano tolte le transizioni di pagina, `Cursor`, `Magnetic`, `data-cursor` e il resto del WOW layer.»
- **C05** (spec:369): aggiungere «Dal 13 settembre il film intero da 4,63 s suona alla prima apertura della home; gli altri caricamenti completi hanno la porta corta da 2,38 s su avorio profondo (A18, A20, D31).»
- **C06** (spec:370): aggiungere «Il monogramma resta a schermo da 1024 px (D34); velocità `30 + 10·min(|v|, VMAX)`, sempre oraria.»

### 1.2 La cliente, direttive di agosto vive nel codice

Il paragrafo di apertura di §11 (spec:337) dice «le due di agosto ancora vive» (C19, C20). Il codice ne rispetta altre tre.

| ID | Data | Parole esatte | Stato e applicazione | Fonte |
|---|---|---|---|---|
| C21 | 2026-08-03 | parole non conservate; il codice le riporta come «niente video nell'hero, resta la foto» e «Ritmo disteso» | **Applicata** per il video: `heroCinematic.enabled: false` (`media.ts:16-18`), gate spento (`HeroCinematic.tsx:345`). **Superata da A20** per il ritmo: le lettere dell'hero passano da `dur.hero` 1,4 s e stagger larghi (`HeroCinematic.tsx:272`) ai tempi di Era (1,2 s, §2.2). Il video resta spento anche col tuffo. | `media.ts:16`, `HeroCinematic.tsx:272`, `:345` |
| C22 | 2026-08-04 | parole non conservate; il codice le riporta come «Replay a ogni passaggio» e «RIGIOCA a ogni passaggio, in entrambe le direzioni» | **Applicata e rafforzata da A18** («entrate e uscite speculari»). Oggi il replay c'è (`Reveal.tsx:31`, `TextLines.tsx:4-6`, `StarReviews.tsx:403`, `:417`); dal motore nuovo l'uscita si vede sopra la linea dell'85 % (§2.4). Supera per questo punto C03, che chiedeva meno animazioni. | `Reveal.tsx:31`, `TextLines.tsx:4-6`, `StarReviews.tsx:403`, `:417` |
| C23 | 2026-08-26 | «il logo dev'essere quello grigio e rosso, non dobbiamo cambiare il colore rendendolo bianco e rosso» | **Applicata e presidiata:** `logo-colore.test.ts` vieta varianti e filtri; `MarkDomus.tsx:28-31` ha tolto la variante chiara. Il cambio di tema del monogramma (§6.1) tinge solo le tacche dell'anello e lascia il marchio #595a58 e #e30716. | `logo-colore.test.ts:1-4`, `MarkDomus.tsx:28-31`, `MarkBadge.tsx:70` |

### 1.3 Decisioni di lavoro

| ID | Parole | Stato |
|---|---|---|
| D16 | 2026-09-10, 7d2d1d8: «Le lettere dell'hero entrano salendo, senza flip» | **Superata da A20:** flip per lettera su tutti i titoli, hero compreso (§2.2). |
| D17 | «un solo lessico dei tempi: `--dur-dt-*` ↔ `durDt`, `--ease-dt-*` ↔ `dt*`; i token di transitions.dev col prefisso `--td-`, senza blur, senza bounce, senza `--ease-in-out` ed `--ease-out`» | da applicare (§2.6) |
| D18 | «il testo si muove uguale in tutti i capitoli; A20 si verifica sulla firma di capitolo in `chapters.ts`: ease a distanza ≥ 0,045 fra le curve, scrub e durate a distanza ≥ 0,1 s, innesco diverso; `none` è firma di un capitolo solo e resta libero nei tratti interni; le battute interne del film delle stelle restano come sono» | da applicare (§3.1) |
| D19 | «tetti del testo: stagger per carattere al massimo 1,2 s in ingresso e 0,4 s in uscita; ritardo indicizzato per ruolo dentro il gruppo, con i ≤ 5» | da far vedere ad Alberto con una pellicola di un d1 lungo |
| D20 | «crenatura dei caratteri spezzati da una tabella misurata nel DOM, non `font-kerning: none`» | da applicare |
| D21 | «reveal a IntersectionObserver: ingresso a filo del bordo, uscita alla linea dell'85 %, nulla dall'alto; un blocco con link o campi entra solo in opacità» | da applicare |
| D22 | «una soglia per i sei corridoi e il tuffo: ≥ 1024 px, altezza ≥ 640 px, motion ok; il layout dei corridoi sta in CSS prima del paint; alla ricarica lo scroll torna al capitolo» | da applicare (§4) |
| D23 | «via la deriva di `Parallax` da Posizionamento, Paths, Method, Services, intro del Team e PageHero» | da applicare; resta su FeaturedTestimonial fuori dalla home |
| D24 | «tuffo dell'hero: la foto sale fino a 0,80·tImg, così il segno a quattro punte resta fuori campo; la scala 2 va sotto la risoluzione del file solo durante la corsa» | confermata da Alberto: A23 |
| D25 | «Costi chiari: l'acqua sale a tempo con IntersectionObserver, non in scrub; banda larga quanto la riga» | da applicare (§3.13) |
| D26 | «D.O.C.: righe e spina restano disegnate anche a pagina ferma» | da far vedere ad Alberto |
| D27 | «Services: niente parallasse yPercent del §7 di Era; riga 1 col fotogramma 4K della sala del tour» | da applicare; alt da verificare (§7.4) |
| D28 | «gesti di FeaturedTestimonial e Contact solo in home (`gesture`); finestra (`finestra`) e acqua (`acqua`) solo in home» | da applicare |
| D29 | «testimonianza: `.dt-still-trim--top` da 1,32 a 1,30 con overscan 10 %; cartolina sotto 1024 a `inset(4% 14%)` e `inset(4% 10%)` al posto di 4 %/32 %» | da applicare |
| D30 | «Contatti: il modulo resta indietro, −3,5 → +3,5 %» | da applicare |
| D31 | «porta corta: niente skip; pannello avorio profondo senza `.dt-pre-fondo`; sagoma solo su «/»; niente corta con ancora, back/forward, scheda nascosta o prerender (vale anche per il film della home), ricarica a più di 50vh» | da applicare |
| D32 | «/case/[slug] ferma: `MotionFreeze`, chrome dell'interfaccia fermo via `:has`, nessun sipario» | da applicare; nessun sipario su `/case/*` (A26) |
| D33 | «tuffo delle PageHero: base `100vw` per l'LCP, strato `200vw` dopo l'LCP e solo a DPR 1; `sizes` sotto 768 a 200vw» | da applicare; misura di §9.3 |
| D34 | «monogramma: il cuore si stacca dalla testata da 1024 px (M1); le tacche virano sopra `data-bg="foto"` (T1)» | confermata da Alberto: A21 |
| D35 | «foto della villa nelle teste di otto pagine interne; file senza metadati e con nomi neutri» | condizionata a §2.2 e §2.13 del documento per la cliente |

Note alle voci esistenti:
- D05 (spec:419): «dal 13 settembre l'espresso resta solo nel film intero della home; la porta corta usa l'avorio profondo (D31)».
- D14 (spec:428): «eccezione: il segno fisso da 1024 px (D34)».
- D15 (spec:429): «PageHero con corridoio (A20); sulle foto della villa la calligrafia legge meno nel terzo basso (misura in `lane-globali.md` §1.9)».

### 1.4 Domande aperte nuove

12. **A18-A20 contro C03** (cliente). La cliente vede la coreografia e decide se tenerla, ridurla o tornare a poche animazioni. Testo in §12.2.
13. **La villa del video tour** (cliente). Autorizzazione del proprietario (§2.2 e §6.2 del documento per la cliente), licenza delle foto firmate da Davide Salerno (§2.13 nuovo), una casa sola in apertura di otto pagine (domanda a voce 28).
14. **Scatto originale della foto dell'hero** (cliente). `hero-raffaela.jpg` è 2000×1415 e ha un segno chiaro a quattro punte a x ≈ 93 %, y ≈ 86 %; a scala 2 la foto va sotto la sua risoluzione.
15. **/case/[slug] e il film** (Alberto, D32). Chiusa il 13 settembre da A26: nessun sipario sulle schede immobile.

---

## 2. Il sistema

### 2.1 La regola che tiene insieme A20 e la tipografia

Il testo si muove uguale in tutti i capitoli. Il gesto di sezione è unico per capitolo. A20 si verifica sul gesto (§3.1), i ruoli del testo sono fuori dal confronto. È la regola che risolve la contraddizione dell'articolo (critic.md punto 5): tipografia identica ovunque, nessuna sezione con la stessa animazione.

Due conseguenze dai verdetti:
- `line` e `curtain` escono dai ruoli comuni. Diventano i gesti del capitolo 10 (D.O.C.) e del capitolo 8 (Method). `Hairline` e `ClipMedia` prendono una prop obbligatoria `chapter` e leggono valori e innesco da `chapters.ts`. Nessun'altra hairline o foto della home ha un reveal a clip.
- Le ease del testo (`dtOut` in ingresso, `dtIn` in uscita) compaiono anche in due gesti di capitolo: `dtIn` nello zoom dell'hero, `dtOut` nel sipario del territorio. È dichiarato: sono le Out e In di Era (ERA:2863) e il test di §3.1 le conta come ease di quei due capitoli.

### 2.2 I ruoli del testo

Valori di Era (ERA:401-618, costanti :2858-2863, CAT §C5). In Era `html{font-size:1vw}`, quindi `10rem` vale 10vw.

| Ruolo | Dove | Split | Ingresso | Uscita |
|---|---|---|---|---|
| `title` | h1-h4 display, titoli semplici, lockup e H1 della home, titolo del Congedo | parole e caratteri, nel server (`SplitChars`) | `opacity 0, yPercent 50, rotateY 90` → 0; 1,2 s, stagger 0,05 col tetto, `dtOut` | `opacity 0, yPercent −50, rotateY −90`; 0,4 s, stagger 0,025, `dtIn` |
| `accent` | la parola Pinyon, una per capitolo, `aria-hidden`; la firma dell'hero | caratteri, nel server | `opacity 0, rotateX 90, x 10vw`, origine `50% 100%` → 0; 1,2 s, stagger 0,1, `dtOut` | `opacity 0, rotateX −90, x −10vw`, origine `50% 0%`; 0,4 s, stagger 0,05, `dtIn` |
| `lead` | `p.lead` | righe con maschera, SplitText nel client | `yPercent 110` → 0; 1,2 s, stagger 0,1, `dtOut` | `yPercent −110`; 0,4 s, stagger 0,05, `dtIn` |
| `ctn` | eyebrow, paragrafi, numeri | nessuno | `opacity 0, y var(--dt-ctn-y)` → 0; 1,2 s, `dtOut` | `opacity 0` sul posto; 0,4 s, `dtIn` |
| `still` | card, tessere e ogni blocco con link, bottoni, summary o campi | nessuno | solo opacità; 1,2 s, `dtOut` | solo opacità; 0,4 s, `dtIn` |

- `--dt-ctn-y`: 3,333vw da 1024 px, 11,54vw sotto (48 px a 1440, 45 px a 390).
- **Declassamento** (verdetto sistema, bloccante 7). Alla registrazione il motore declassa `ctn` a `still` quando il gruppo contiene `a[href], button, summary, input, select, textarea, [tabindex]:not([tabindex="-1"])`, con un avviso in sviluppo. Vale per la riga CTA di `PageHero.tsx:131-142`, per le domande di `FaqList.tsx:28-39`, per i blocchi CTA delle teste di capitolo. È la regola del 2026-08-04 sui bersagli nei replay (memoria `domus-wow-layer.md:49`).
- **Lettere piatte.** Nessuna `transformPerspective`: gli animatori di Era non ne hanno (l'unica è `transformPerspective 1e3` di un modale, ERA:2150). La corsia sistema proponeva 800 come il sipario; Alberto ha scelto le lettere piatte (A22).
- **Ritardo nel gruppo.** `0,3 + i × 0,1` con `i` = posizione fra gli elementi **dello stesso ruolo** nel gruppo, come Era (ERA:411, :465, :518; raggruppamento per tipo :917-1027). Tetto i = 5 (D19). In uscita `i × 0,05`.
- **Stagger per carattere.** `each = min(stagger, tetto / max(1, n − 1))`, tetto 1,2 s in ingresso e 0,4 s in uscita (D19). Fino a 25 caratteri resta lo 0,05 di Era.
- **Tween nuovo a ogni passaggio**, `fromTo` con `overwrite: true`; mai `restart()` su un tween fermo, mai `clearProps` su un gruppo che rigioca.
- **Solo transform, opacity, clip-path.** Nessun `will-change` in CSS su caratteri o blocchi (misura di `globals.css:1782-1789`: 252 livelli, 432 MB). Via `.reveal:not(.is-in){will-change}` (`globals.css:515-517`).
- **Traboccamento.** `html` e `body` hanno già `overflow-x: clip` (`globals.css:211-217`, `:249-255`). La regola `#main { overflow-x: clip }` della corsia sistema non entra: non serve e ritaglierebbe un antenato di tutti gli schermi sticky.

### 2.3 Chi spezza il testo

**Titoli e accenti: `SplitChars`, nel server.** Ogni parola è `span.dt-w` `inline-block; white-space: nowrap`, ogni carattere `span.dt-c`, spazi veri fra le parole. Lo split esiste al primo paint, identico con JS, senza JS e con reduced-motion. SplitText esce da titoli e manifesto e resta solo in `Lead`.

- **Crenatura (D20).** `scripts/kern-table.ts` apre il build e misura le coppie **nel DOM**: due span con la stessa `font` calcolata del titolo, `font-feature-settings: "ss01", "cv01"` compresi (`globals.css:253`), `kern = w("ab") − w("a") − w("b")` con `Range.getBoundingClientRect`. Output `app/lib/motion/kern-table.json`, chiavi `display-400`, `display-500`, `brand-800`, `script-400`, valori |k| ≥ 0,002 em. `SplitChars` scrive `--k` sul carattere di sinistra; `.dt-c { margin-inline-end: var(--k, 0em) }`. La canvas della corsia sistema ignorava le feature del body e misurava glifi diversi.
- **Accessibilità.** Heading: `aria-label` calcolato dai figli React (stringhe unite, `<br/>` → spazio, spazi compressi) e split in uno span `aria-hidden`. Tag non heading: `sr-only` più split `aria-hidden` (axe vieta `aria-label` su `p`, `TextLines.tsx:82-85`). Nessun elemento interattivo dentro un title: errore in sviluppo. Test: sugli 11 H1 di PageHero × 5 lingue il nome accessibile coincide con `innerText` normalizzato. Oggi tutti gli 11 chiamanti passano JSX con `<br/>` (verdetto globali; per esempio `RecensioniContent.tsx:15-21`), e `aria: "auto"` di SplitText li avrebbe fusi in «Lo raccontanole persone.».
- **Cambio lingua.** `LocaleProvider.tsx:24-29` rende `it` nel server e passa alla lingua del cookie in un effetto passivo. `SplitChars` riusa gli span per indice e gli stili inline di GSAP restano sui nodi riusati. `RevealGroup` riallinea lo stato nel suo layout effect con `dependencies: [locale]` e `revertOnUpdate: true`; `LocaleProvider` chiama `requestRefresh()` dopo il cambio. Test anche al primo caricamento con cookie `dt_locale=de` e `fr`.
- **Trova nella pagina.** Da provare a mano su Chromium, Safari e Firefox con una parola spezzata in caratteri inline-block prima di dichiararlo.
- **Titoli semplici** (verdetto homeB): passano a `SplitTitle` anche `Services.tsx:318` (h3 ×6), `DomusDocProtocol.tsx:276` (h3 ×5), `OpenDomus.tsx:198` (h3 ×2), `Method.tsx:298` (h4 ×9 su /metodo).

**Lead: SplitText nel client** (`type: "lines"`, `mask: "lines"`, `aria: "none"`, `autoSplit: true`), split dopo `Promise.race([document.fonts.ready, 3000 ms])`, `onSplit` riporta le righe nuove allo stato del gruppo senza animare.

**Budget di nodi.** Un titolo di n caratteri e w parole aggiunge n + w + 1 elementi. In home una ventina di titoli, meno di 1.500 nodi; nei capitoli 7-12 circa 600 caratteri in italiano, di più in tedesco. Il primo run di `text-motion.spec.ts` fissa il numero di `[data-c]` a 1440 e fallisce oltre +20 %.

### 2.4 Inneschi: un motore solo

`app/lib/motion/reveal-engine.ts`. ScrollTrigger resta ai soli scrub (corridoi, nastri, gesti scrubbati); nessun reveal di testo lo usa, perché in fondo alla home sotto le corse lunghe sfasava (memoria `domus-motion-architecture.md:26`).

**Due IntersectionObserver condivisi** (verdetto sistema, bloccante 1):
- `entry`: `threshold: 0`, `rootMargin: "0px"`. È l'innesco «top bottom» di Era (ERA:908-917), primo ingresso letterale.
- `exitLine`: `threshold: 0`, `rootMargin: "0px 0px -15% 0px"`; dentro il nastro orizzontale `"0px -15% 0px 0px"`.

```ts
export function decide(e: Hit, x: Hit, root: Box, s: GroupState): "in" | "out" | null {
  const below = e.top >= root.bottom * 0.85 || e.left >= root.right * 0.85; // sotto o a destra della linea d'uscita
  if (s === "hidden" || s === "hiding") return e.hit || x.hit ? "in" : null;
  if ((s === "shown" || s === "revealing") && !x.hit && below) return "out";
  return null; // uscito dall'alto o da sinistra: resta shown
}
```

- Entra dal basso: ingresso. Risalendo, il gruppo che scende sotto l'85 % del viewport esce, e l'uscita si vede.
- Esce dall'alto: niente. Rientra dall'alto: è già shown.
- **Armamento** (layout effect): gruppo già passato → shown senza animare (ancore, scroll ripristinato); in viewport → §2.5; sotto → hidden. Lo stato nascosto dell'armamento si scrive senza transizione: `data-reveal-instant` per un fotogramma, reflow, poi via (verdetto sistema: altrimenti un gruppo sopra la piega sfuma senza salire).
- **Reti:** a 2.500 ms dall'armamento un gruppo hidden con `top < innerHeight && bottom > 0` entra; `sweep()` su `refresh` di ScrollTrigger, resize (150 ms), `visibilitychange`; `focusin` in un gruppo non shown → shown.
- **Gruppi manuali** (verdetto sistema, bloccante 2). Un gruppo `trigger="manual"` resta manuale solo finché ha un antenato `[data-corridor][data-on]` o `[data-set-on]` (il film delle stelle, il nastro). Il motore controlla l'antenato all'armamento e a ogni `sweep()`; senza antenato il gruppo passa all'IO. La rete dei 2.500 ms vale anche per i manuali: hidden e intersecante per 2.500 ms di fila → in. Sotto 1024 px e sotto 640 px d'altezza i testi dei corridoi entrano quindi con l'IO.
- **Gruppi in attesa.** `data-reveal-hold` sospende l'IO di un gruppo finché il corridoio non lo libera con un cue (contenuto di Open Domus dentro lo stage scalato, §3.10).
- **Reduced-motion a pagina aperta:** il `matchMedia` del motore toglie gli stili inline, `data-reveal-armed` e `data-hero-intro` da `<html>` nello stesso passo, così la regola dello 0,02 non riparte.
- **/case/[slug]:** il motore salta i gruppi sotto `[data-motion-freeze]`.

**HorizonScroller.** I reveal `enter` e `track` (`HorizonScroller.tsx:481-504`) diventano gruppi del motore; `enter` è manuale con cue a «top 70%» della radice. Il manifesto (`HorizonStory.tsx:251`) diventa `SplitTitle`. `autoAlpha` diventa `opacity` in quattro punti: `:213`, `:227`, `:526`, `:539`.

**StarReviews.** Il titolo è un gruppo manuale sotto `[data-set-on]` della runway. Un cue a 0,94 del film chiama `play("in")`, il ritorno sotto 0,94 chiama `play("out")`. La timeline scrubbata resta di 1,3 unità (`StarReviews.tsx:496-511`): nessun `tl.add` di una timeline di testo, quindi gli atti A-E non si comprimono (verdetto homeA, bloccante 5). Il wrapper `[data-sr-el]` a 0,94 (`:504`) resta. Sotto lg, senza `[data-set-on]`, il titolo entra con l'IO.

### 2.5 H1 sopra la piega, stato dipinto, LCP

**Dove:** 11 PageHero (`PageHero.tsx:83-89`), `/contatti` (`ContattiContent.tsx:138`), `/case-vendute` (`CaseVenduteContent.tsx:210`), `/valutazione-immobile-tradate` (`ValutazioneContent.tsx:351`), e la home.

**Prima del paint.** Il boot script (`layout.tsx:102`) scrive `data-hero-intro` quando c'è motion ok, su ogni rotta tranne `/case/*` dove resta come oggi. Regola:

```css
:root[data-hero-intro] [data-reveal]:not([data-reveal-armed]):not([data-motion-freeze] *) {
  opacity: var(--dt-painted); /* 0.02 */
  animation: dt-reveal-failsafe 0.5s ease 6s forwards;
}
:root[data-hero-intro="intro"] [data-reveal]:not([data-reveal-armed]) { animation-delay: 3.33s; }
:root[data-hero-intro="short"] [data-reveal]:not([data-reveal-armed]) { animation-delay: 1.08s; }
@keyframes dt-reveal-failsafe { to { opacity: 1; } }
```

- 0,02 e non 0: a opacità 0 Chromium toglie l'elemento dai candidati LCP (memoria `domus-wow-layer.md:23`).
- `:root[…]` e keyframe nuova: `intro-clocks.test.ts:264-270` cerca la prima `html[data-hero-intro="intro"]`, `:251-252` conta quattro `dt-rest-failsafe`.
- 6 s = `HERO_REST_WARM_MS`, 3,33 s = `HERO_REST_MS`, 1,08 s = `HERO_REST_SHORT_MS` (§6.2). La rete a caldo resta 6 s: una rete più corta ripete l'errore del 2026-08-18, scatta prima di un'idratazione lenta e salta l'ingresso (verdetto globali, bloccante 4).
- `data-dt-paint`, `dt-paint-net` e `PAINT_NET_MS` della corsia globali non entrano: un meccanismo solo.

**All'armamento**, nello stesso task: caratteri a opacity 0, contenitore con `opacity: 1; animation: none` inline e `data-reveal-armed`. **Partenza:** con il sipario all'handoff `INTRO_EVENT`; senza sipario 150 ms dopo l'armamento. **Rete già scattata:** `foldNetFired(el)` legge `currentTime` di `dt-reveal-failsafe` (tecnica di `HeroCinematic.tsx:136-156`, spostata in `app/lib/motion/fold.ts`); il gruppo nasce shown.

**La home** (verdetto sistema, bloccante 3, strada «a»). Lockup, firma e H1 **non** portano `data-reveal`. La timeline di `HeroCinematic` applica i valori dei ruoli ai caratteri (`title` su lockup e H1, `accent` sulla firma) e resta valida la regola di `globals.css:1178-1184` con `data-hero-char/tchar/schar`. Ritardi per ruolo: lockup 0,3 s, H1 0,4 s, firma 0,3 s. Oggi 0,2 / 0,7 / 0,85 s con 1,4 s (`HeroCinematic.tsx:279-311`). Test: a scroll 0 senza sipario, il prodotto contenitore × carattere del primo `[data-hero-char]` supera 0,9 entro 0,15 + 0,4 + 1,2 + 1,2 s.

**LCP** (verdetto sistema, bloccante 4). Un H1 spezzato in caratteri inline-block esce dai candidati LCP a qualunque opacità. Misura di base di oggi, build del branch, senza consenso, sipario saltato, rete non frenata (mediana di 3):

| Rotta | 1440×900 | 390×664 | CLS 1440 / 390 |
|---|---|---|---|
| `/` | IMG `hero-raffaela.jpg` 104 ms | IMG 124 ms | 0 / 0,0002 |
| `/vendi` | IMG `premium_02` 76 ms | IMG 72 ms | 0 / 0,0002 |
| `/contatti` | **H1** 80 ms | **H1** 104 ms | 0 / 0,0002 |
| `/case-vendute` | **H1** 112 ms | **H1** 116 ms | 0 / 0,0002 |
| `/valutazione-immobile-tradate` | **H1** 116 ms | **H1** 116 ms | 0 / 0,0002 |

Sulle tre pagine senza foto oggi l'LCP è l'H1 intero, spezzato da TextLines solo dopo `fonts.ready`. Col nuovo split l'LCP passerebbe al lead o al banner cookie. Regola: su quelle tre pagine il lead resta un `<p>` intero a 0,02 fino alla prima voce `largest-contentful-paint` (o fino a `fonts.ready` se arriva dopo), poi SplitText lo spezza e il gruppo si arma. Test 6 (§9.2): base = questo build, stesse rotte, senza `setConsent`, stessa macchina, soglia base + 100 ms; la misura con CPU ×4 e Slow 4G si scrive in §9.3.

### 2.6 Il lessico dei tempi

Una tabella, un nome per parte. CSS `--dur-dt-<k>` ↔ GSAP `durDt.<k>`; CSS `--ease-dt-<kebab>` ↔ GSAP `"dt<Pascal>"`.

| Era | CSS | GSAP | Valore |
|---|---|---|---|
| durS / durM / durL | `--dur-dt-s/m/l` | `durDt.s/m/l` | 0,4 / 0,8 / 1,2 s |
| stagger | `--stagger-dt` | `staggerDt` | 0,1 s |
| delayReveal | `--delay-dt-reveal` | `delayDt.reveal` | 0,3 s |
| Out | `--ease-dt-out` | `dtOut` (c'è, `gsap.ts:73`) | 0.25,1,0.5,1 |
| In | `--ease-dt-in` | `dtIn` (nuova) | 0.5,0,0.75,0 |
| InOut | `--ease-dt-in-out` | `dtInOut` (nuova) | 0.75,0,0.25,1 |
| Ease | `--ease-dt-ease` | `dtEase` (nuova) | 0.25,0.1,0.25,1 |
| diveIn, horScroll, loaderEase | invariati | `dtDiveIn`, `dtHorScroll`, `dtLoader` | `gsap.ts:72-82` |
| stato dipinto | `--dt-painted` | `painted` | 0,02 |
| corsa ctn | `--dt-ctn-y` | `ctnY()` | 3,333vw ≥ 1024, 11,54vw sotto |

Ease di capitolo nuove (§3.1): `dtSosta`, `dtAffonda`, `dtRail`, `dtCartolina`. `dtDock` (homeA) non entra: la curva coincide con `power2.out` (distanza 0,003). `dtWrite` (homeB) e `dtLento` (homeC) non entrano: distano 0,010 fra loro e 0,026 e 0,018 da `dtHorScroll`. `dtIncastro` (homeC) diventa `dtSosta` e passa a Paths.

- Ogni `CustomEase.create("nome", "a,b,c,d")` una per riga, forma letta da `intro-clocks.test.ts:73`, nello stesso commit del suo consumatore. Una corsia sola le scrive in `gsap.ts`.
- Non si rinominano `domus`, `domus.inOut`, `dtOut`, `dtDiveIn`.
- Via i token morti: `dur.hero` con la migrazione dell'hero, `stagger.words/lines/chars`, `dist.*`; CSS `--dur-short/reveal/hero/transition` (`globals.css:171-174`). `dur.reveal` 0,9 resta al blocco congelato di /case/[slug].
- `--ease-dt-*` in `@theme` (utility `ease-dt-out`); gli altri in un `:root` fuori da `@theme`.
- **Media query senza GSAP.** `MQ` si sposta in `app/lib/motion/mq.ts`, importato da `gsap.ts` e da `useAmbientVideo` (verdetto homeB: `Congedo.tsx:48-50` evita di proposito l'import di GSAP). `MQ.corridor = "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 640px)"`, `MQ.xl = "(min-width: 1280px)"`.

**transitions.dev, strato UI** (D17). Prefisso `--td-` perché `_root.css:19-20` definisce `--ease-out` ed `--ease-in-out`, che Tailwind 4 ha già (`theme.css:434-436`). Si installano, con i consumatori: `--td-duration-micro` 80ms, `-quick` 150ms, `-fast` 250ms, `-medium` 350ms, `-slow` 400ms; `--td-ease-smooth-out: cubic-bezier(0.22, 1, 0.36, 1)`; `--td-distance-medium` 12px; `--td-scale-small` .98, `-medium` .97, `-tiny` .99. Non si installano `--blur-*`, `--ease-bounce*`, `--ease-in-out`, `--ease-out`, e nessun `filter` degli snippet.

Snippet adattati senza blur, col blocco reduced-motion di ognuno (valori di `lane-sistema.md` §4.4, nomi col prefisso):
1. **Tooltip dei social** (17) su `.dt-social__tip` (`globals.css:1623-1656`): ingresso 150 ms dopo 80 ms, uscita 50 ms, scala .98; quadrato rosso, raggio 0, nessuna ombra.
2. **Menu del telefono** (07) su `#mobile-menu` (`Header.tsx:277-283`): apertura 400 ms, chiusura 350 ms, 12 px, `--td-ease-smooth-out`; lo stato chiuso resta `hidden`.
3. **Lingua** (05) su `LanguageSwitcher.tsx:56-61`: 250 ms / 150 ms, scale .97 / .99; `visibility: hidden` sulla lista chiusa (UI chiusa, non un reveal).
4. **Accordion** (21) su `FaqList.tsx:29-51`, `LavoraConNoiContent.tsx:976-980`, `OpenDomusPageContent.tsx:911-940`: `<details>` resta; al mount `data-open="false"` su ogni details chiuso (verdetto sistema: altrimenti il primo click apre il pannello già pieno); 250 / 150 ms; `requestRefresh()` a `transitionend`.

Utility `transition-ui` (colori, `--td-duration-fast`, `--ease-dt-ease`) e la tabella «transitions refine» di `lane-sistema.md` §4.5, con due correzioni: i token prendono `--td-`; restano fermi i campi dei form lead e tutto ciò che è reso in /case/[slug] (PropertyCard, PropertyGallery).

### 2.7 Le primitive, con una API sola

| File | Tipo | Contenuto |
|---|---|---|
| `app/lib/motion/mq.ts` | nuovo | `MQ` senza GSAP |
| `app/lib/motion/gsap.ts` | modifica | `durDt`, `staggerDt`, `delayDt`, `painted`, `ctnY()`, CustomEase nuove coi consumatori, `requestRefresh()` |
| `app/lib/motion/text-roles.ts` | nuovo | `ROLES` di §2.2, `staggerEach()`, `groupDelay(role, i)`, `demote()` |
| `app/lib/motion/reveal-engine.ts` | nuovo | due IO, `decide()`, armamento, reti, `sweep()`, `play()`, hold |
| `app/lib/motion/fold.ts` | nuovo | `curtainPending()`, `afterCurtain()`, `foldNetFired()` |
| `app/lib/motion/chapters.ts` | nuovo | registro delle firme (§3.1) |
| `app/lib/motion/clip.ts` | nuovo | `clipOpen`, `clipClosed(side)`, `clipFrame(v, h)`, `clipSlant(p)`, `assertStraight()` |
| `app/lib/motion/kern.ts` + `kern-table.json` | nuovo | lettura della tabella |
| `app/components/motion/RevealGroup.tsx`, `Reveal.tsx` | nuovo, riscritto | gruppo; ruoli `ctn` / `still` |
| `app/components/motion/SplitChars.tsx`, `SplitTitle.tsx`, `ScriptWord.tsx`, `Lead.tsx` | nuovi | ruoli del testo |
| `app/components/motion/Hairline.tsx`, `ClipMedia.tsx` | nuovi | gesti dei capitoli 10 e 8, prop `chapter` obbligatoria |
| `app/components/motion/useCorridor.ts` | nuovo | corridoi sticky |
| `app/components/motion/useAmbientVideo.ts` | nuovo | video d'ambiente |
| `app/components/motion/MotionFreeze.tsx` | nuovo | guardia di /case/[slug] |
| `TextLines.tsx` | rimosso | alias di `SplitTitle` per un commit, poi via |

`SplitReveal` (homeA, homeB) e `onLines` (homeC) non esistono: il nome è `SplitTitle` e le righe di un titolo si ricavano raggruppando `.dt-w` per `offsetTop`.

```tsx
type RevealGroupProps = { as?: ElementType; className?: string; id?: string; children: ReactNode;
  trigger?: "io" | "manual"; hold?: boolean;
  onReady?: (api: { play(dir: "in" | "out", o?: { instant?: boolean }): void; release(): void }) => void };
type RevealProps = { role?: "ctn" | "still"; as?: ElementType; className?: string; children: ReactNode };
type SplitTitleProps = { as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "blockquote"; className?: string; id?: string;
  style?: CSSProperties; font?: "display-400" | "display-500" | "brand-800"; children: ReactNode };
type ScriptWordProps = { className?: string; style?: CSSProperties; children: string };
type LeadProps = { className?: string; children: string };
type HairlineProps = { chapter: "doc"; axis?: "x" | "y"; className?: string };
type ClipMediaProps = { chapter: "method"; from: "left" | "right"; className?: string; children: ReactNode };
```

**`useCorridor`** (unifica le cinque versioni; verdetti homeA, homeB, homeC, globali):

```ts
export type Cue = { at: number; forward: () => void; backward?: () => void };
export type CorridorOptions = {
  id: "hero" | "finestra" | "cartolina" | "page-dive"; // chiave in chapters.ts: ease, scrub, innesco
  stick?: "top" | "bottom";      // bottom: schermo più alto del viewport, top = min(0, innerHeight − H)
  start?: string | (() => string); // default "top top" (stick top) o `top ${stickTop}px` (stick bottom)
  end?: string | (() => string);   // default "bottom bottom"
  endTrigger?: RefObject<Element | null>; // cartolina: il footer
  build: (tl: gsap.core.Timeline, q: (sel: string) => HTMLElement[]) => void; // durata 1
  cues?: Cue[];
  focus?: (el: Element, st: ScrollTrigger) => number | null; // scroll che rende visibile el; default st.start
  phone?: (q: (sel: string) => HTMLElement[]) => void | (() => void); // < MQ.corridor, motion ok, mai sticky
  deps?: unknown[];              // [locale]
};
export function useCorridor(ref: RefObject<HTMLElement | null>, o: CorridorOptions): void;
```

- **Layout in CSS prima del paint** (D22). Altezze e sticky non aspettano il JS:
  ```css
  @media (min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference) {
    :root[data-hero-intro] [data-corridor] > [data-corridor-screen] { position: sticky; top: var(--corridor-stick, 0px); }
    :root[data-hero-intro] [data-corridor][data-stick="top"] > [data-corridor-screen] { height: 100svh; overflow: clip; }
    :root[data-hero-intro] [data-corridor] > [data-corridor-run] { display: block; height: var(--corridor-run); }
  }
  ```
  Il valore `--corridor-run` sta in CSS per ogni `id` (hero 200svh, cartolina 80svh, page-dive 120svh). Il JS scrive `--corridor-stick` al montaggio e a ogni `refreshInit`, mette `data-on` quando la timeline esiste (i test lo contano), chiama `requestRefresh()` dopo il montaggio e dopo ogni cambio di lingua. Lo spaziatore `[data-corridor-run]` esiste in SSR con classe `hidden`. `overflow: clip` e non `hidden` sullo schermo: `hidden` crea un contenitore di scroll programmatico, e un `focus()` sposterebbe lo `scrollTop` dello schermo (verdetto globali).
- **Timeline:** `gsap.timeline({ defaults: { ease: "none", immediateRender: false }, scrollTrigger: { trigger, start, end, endTrigger, scrub: chapters[id].scrub, invalidateOnRefresh: true } })`. Nessun `refreshPriority`: senza pin nessuno aggiunge spazio.
- **Misure** con `offsetTop` e `offsetHeight`, che i transform non toccano, come Era (`.hero-w_bg.offsetHeight`, CAT §2).
- **Cue:** `last < at ≤ p` → `forward`; `p < at ≤ last` → `backward`; a un refresh oltre un cue i `forward` mancanti scattano una volta.
- **Rete di fine documento** (verdetto sistema, bloccante 2): dopo un refresh, se `scrollY + innerHeight >= scrollHeight − 2` oppure `wrapper.getBoundingClientRect().bottom <= innerHeight + 1`, e `tl.progress() < 1`: `tl.progress(1)` e i cue mancanti. Copre il Congedo, ultimo prima del Footer.
- **Fuoco:** `focusin` nello schermo → `y = focus(el, st)`; `getLenis()?.scrollTo(y, { immediate: true })` o `window.scrollTo`. Il default cerca per bisezione il progresso in cui il rettangolo dell'elemento sta dentro [0, innerHeight] (a 1280×720 `st.start` non basta).
- **Regole scritte nel commento del hook:** transform solo sui discendenti dello schermo; eccezione dichiarata il footer della cartolina, che non è antenato di nulla di sticky; nessun antenato con `overflow: hidden`; i **testi** dello schermo stanno dentro 100svh nella lingua più lunga (le foto possono uscire e salire dentro); un corridoio per componente client.
- **Ripristino alla ricarica** (D22). Safari non ha lo scroll anchoring e due altezze restano misurate da JS (nastro `HorizonScroller.tsx:415-423`, rotaia `--rail-len`). Al `pagehide` `Preloader.tsx` salva in `LAST_Y_KEY` `{ p, y, id, dy }` (id del capitolo in vista e scarto dentro di lui). Alla ricarica, dopo il primo refresh dei corridoi, il motore porta lo scroll a `top(id) + dy`. Test: ricarica a metà di `#servizi` a 1440, bordo alto del titolo entro ±2 px.

**`useAmbientVideo`** (una firma; verdetto homeC, bloccante 1):

```ts
export function useAmbientVideo(video: RefObject<HTMLVideoElement | null>, host: RefObject<HTMLElement | null>, o?: {
  warm?: string;     // rootMargin del precarico, default "50% 0px"
  minWidth?: string; // default MQ.desktop (768)
  sources?: { hd: { webm: string; mp4: string }; sd?: { webm: string; mp4: string } }; // scritte al primo play
}): void;
```

- Gate: `MQ.motionOk`, `minWidth`, `navigator.connection?.saveData !== true`, scheda visibile. IO `warm` → `preload="auto"`; IO `rootMargin "0px"` → `play().catch(() => {})` in vista, `pause()` fuori (Era C3, ERA:384-399). Mai `currentTime` scritto.
- Con `sources`: al primo play larghezza resa = `max(boxW, boxH × 16/9) × devicePixelRatio`; ≤ 1.408 px → `sd`, altrimenti `hd`; WebM se `canPlayType('video/webm; codecs="vp9"') === "probably"`. Senza `sources` valgono le `<source>` del markup. Senza JS non si scarica nulla.
- Markup: `<video muted loop playsInline preload="none" disablePictureInPicture disableRemotePlayback aria-hidden tabIndex={-1}>` con poster `next/image` sotto.
- `data-ambient="playing|paused|off"` sull'host, per i test.
- Consumatori: Congedo (`sd` + `hd`, sostituisce `Congedo.tsx:52-79`) e CostiChiari (`hd`).

**`MotionFreeze`** (§5.4).

---

## 3. La home capitolo per capitolo

### 3.1 Tabella di controllo di A20

Schema del registro (verdetto sistema, bloccante 6):

```ts
type Signature = { ease: string; time: { scrub: number | true } | { dur: number; delay: number; stagger?: number };
                   trigger: { st: [start: string, end: string]; el: string } | { io: { rootMargin: string; threshold: number } } };
type Chapter = { id: string; gesture: string; signature: Signature; secondary?: Array<{ ease: string; note: string }>; frozen?: string[] };
```

Regole di `chapters.test.ts` (D18):
- **ease:** nomi diversi fra le firme; distanza massima fra le curve ≥ 0,045 (100 campioni con `gsap.parseEase`); un tratto secondario con ease non lineare deve distare ≥ 0,045 dalle firme degli altri capitoli; `none` è firma di un capitolo solo; le ease ammesse sono le CustomEase registrate in `gsap.ts` con un consumatore, lette dal file, più le famiglie di serie di GSAP;
- **tempo:** scrub numerici distanti ≥ 0,1 fra loro, `true` in un capitolo solo; durate a tempo distanti ≥ 0,1 s;
- **innesco:** coppia start/end diversa; `rootMargin` diverso;
- **componenti:** `<ClipMedia` solo in `Method.tsx`, `<Hairline` solo in `DomusDocProtocol.tsx`; nessun altro componente della home scrive `clipPath` con `inset(` in un tween a tempo, salvo `HorizonScroller.tsx` (sipario esistente, dichiarato) e `CostiChiari.tsx` (firma).

| # | Capitolo | Gesto | CAT | Sticky | Firma: ease (curva) | Tempo | Innesco | Tratti interni |
|---|---|---|---|---|---|---|---|---|
| 1 | HeroCinematic | tuffo: testo e foto salgono a due velocità, foto 1→2 | §2 | sì, 200svh | `dtIn` (0.5,0,0.75,0) | scrub `true` | `#top` `top ${stickTop}px` → `bottom bottom` | salita `dtEase` (0.25,0.1,0.25,1) |
| 2 | Posizionamento | foglio a bordo dritto sopra lo sticky, parole che si allontanano in x | §3 | no | `none` | scrub 0,8 | h2 `top bottom` → `center top` | margine −100svh in CSS |
| 3 | HomeSearchGateway | aggancio del pannello: opacità .02→1, scala .75→1, origine 50 % 50 % | §6a | no | `circ.out` | scrub 0,35 | `[data-dock]` `top 95%` → `top 55%` | nessuno |
| 4 | HorizonStory | nastro orizzontale (invariato) | §6, §6b, §6c | sì, esistente | `dtHorScroll` (0.25,0,0.75,1) | scrub 0,25 | area `2.5% top` → `97.5% bottom` | gradini `none` scrub 0,25; sipario `dtOut` 1,6 s con scala 1,15→1 |
| 5 | StarReviews | film delle cinque stelle (invariato) | A12 | sì, esistente, 360svh | `power4.inOut` | scrub 0,6 | runway `top 55%` → `bottom bottom` | battute congelate: `none`, `power2.inOut/in/out`, `power3.out`, `power1.inOut`, `sine.inOut` |
| 6 | Voci | carosello da destra, tessere a parallelogramma | §4, §C5 slide | no | `domus.inOut` (0.66,0,0.22,1) | 1,0 s, ritardo 0, stagger 0,15 | IO `ul`, `0px 0px -30% 0px` | uscita 0,6 s stessa ease; `ul` xPercent 25→0 1,0 s al primo ingresso |
| 7 | Paths | colonne in controfase ±10 % con sosta al centro | §11, C4 | no | `dtSosta` (M0,0 C0.25,0.45 0.3,0.5 0.5,0.5 C0.7,0.5 0.75,0.55 1,1) | scrub 0,5 | riga `top 125%` → `bottom -25%` | nessuno |
| 8 | Method | tendina a verso alternato sulle foto degli atti | §6c | no | `power4.out` | 2,4 s, ritardo 0,8 | IO scatola, `0px 0px -10% 0px` | uscita `power4.in` 0,4 s |
| 9 | OpenDomus | finestra: otturatore, montanti, scala 1,84, stage .75→1 | §12 | sì, 300svh | `dtInOut` (0.75,0,0.25,1) | scrub 0,15 | `.dt-od_area` `top bottom` → `+=300%` | otturatore e montanti `none`; sotto 1024 otturatore a tempo 1,3 s `dtInOut` + 0,2 s `none` |
| 10 | DomusDocProtocol | righe che si tirano, poi la spina | §C5 line | no | `power1.out` | 0,8 s, ritardo 0,2, stagger 0,08 | IO `ul`, `0px 0px -40% 0px` | spina 1,12 s `power1.out`; uscita 0,5 s `circ.in` |
| 11 | Services | zoom d'ingresso 1,15→1, origine 50 % 100 % | §7 | no | `sine.out` | scrub 1,0 | scatola `top bottom` → `bottom bottom` | nessuno |
| 12 | CostiChiari | l'acqua sale: clip dal basso e loop in vista | C3 | no | `expo.out` | 1,8 s, ritardo 0 | IO banda, `0px 0px -20% 0px` | uscita 0,7 s `sine.in` |
| 13 | FeaturedTestimonial | la foto affonda dentro la cornice ferma | §5 img-out | no | `dtAffonda` (0.5,0,0.8,0.45) | scrub 1,2 | cornice `bottom bottom` → `bottom top` | nessuno |
| 14 | Social | il titolo si congeda: scala 1→1,12 e opacità 1→0, origine 0 % 100 % | §10 | no | `expo.in` | scrub 1,3 | blocco `center center` → `bottom top` | nessuno |
| 15 | Team | rotaia orizzontale e pan | A03 | sì, esistente | `dtRail` (0.5,0,0.5,1) | scrub 0,7 | corridoio `top ${top}px` → `bottom ${top + rail.offsetHeight}px` (`HorizontalRail.tsx:116-117`) | pan ±4 % stessa ease |
| 16 | Contact | la colonna del modulo resta indietro | C4 ctn-down | no | `power1.in` | scrub 1,1 | griglia `top 70%` → `bottom 30%` | nessuno |
| 17 | Congedo e footer | cartolina: la banda si ritira in `inset(8% 22%)`, il footer sale e cresce | §15 | sì, 180svh | `dtCartolina` (0.45,0,0.15,1) | scrub 0,9 | section `top top` → footer `clamp(top 40%)` | footer `scale .75→1`, `opacity 0→1`, origine 50 % 0 % |

**Misure della tabella** (`docs/superpowers/specs/2026-09-13-coreografia-era-residence/ease-dist.cjs`, distanza massima fra le curve su 100 campioni):
- coppie di firme più vicine: `power4.inOut`/`dtInOut` 0,051; `power1.out`/`sine.out` 0,056; `none`/`dtHorScroll` 0,072; `dtHorScroll`/`dtRail` 0,081; `power4.out`/`expo.out` 0,089. Tutte le altre sopra 0,09.
- secondari contro firme: `power1.in`/`sine.in` 0,056; `dtIn`/`power4.in` 0,076; `dtOut`/`power4.out` 0,076; `expo.in`/`power4.in` 0,089; `dtEase`/`power1.out` 0,097.
- scrub: 0,15 · 0,25 · 0,35 · 0,5 · 0,6 · 0,7 · 0,8 · 0,9 · 1,0 · 1,1 · 1,2 · 1,3, più `true`. Durate a tempo: 0,8 · 1,0 · 1,8 · 2,4 s.

**Collisioni dei verdetti e scelta fatta:**

| Collisione | Scelta | Perché |
|---|---|---|
| Voci e finestra con `dtInOut` | Voci passa a `domus.inOut`; la finestra tiene `dtInOut` | CAT §12 dà InOut alla scala 1,84: A20 chiede la lettera. La correzione del revisore homeB (`power3.inOut`) dista 0,024 da `dtInOut`: sarebbe lo stesso movimento con un altro nome. `domus.inOut` dista più di 0,1. |
| Voci e D.O.C. con 1,2 s, stagger 0,1, ritardo 0,3, IO all'80 % | Voci 1,0 s, stagger 0,15, IO −30 %; D.O.C. 0,8 s, stagger 0,08, ritardo 0,2, IO −40 % | I due revisori portavano entrambi l'IO a −35 % e le durate a 1,0 e 0,96 s: nuova collisione. |
| Services `dtEase` = salita dell'hero | Services `sine.out` | correzione homeB. |
| uscita di Method `dtIn` = zoom dell'hero | `power4.in` | correzione homeB; dista 0,076 da `dtIn`. |
| uscita di D.O.C. `power3.in` | `circ.in` | `power3.in` dista 0,005 da `dtIn`. |
| ricerca `dtDock` e Costi `power2.out` | ricerca `circ.out`; Costi `expo.out` | `dtDock` = `power2.out` (0,003); `power2.out` è anche una battuta del film delle stelle. |
| D.O.C. `dtWrite` | `power1.out` | `dtWrite` dista 0,026 da `dtHorScroll` e 0,010 da `sine.inOut`. |
| Contact `dtLento` | `power1.in` | `dtLento` dista 0,018 da `dtHorScroll`. |
| Team `dtRail` (0.12,0,0.88,1) | `dtRail` = 0.5,0,0.5,1 | la curva di homeC dista 0,035 da `none` e 0,039 da `dtHorScroll`. |
| scrub 0,5 ricerca e Paths; 0,25 Services e nastro; `true` hero e finestra; 0,6 stelle e rotaia | tabella sopra | StarReviews resta a 0,6 (A12 invariato); cambia la rotaia; scarto minimo 0,1 (verdetto homeC). |
| range `top 125%` → `bottom -25%` di Paths e ctn-up di Contact | Paths tiene il range di Era; Contact `top 70%` → `bottom 30%` | Paths è l'uso a due colonne del §11; Contact aveva anche lo start di Costi. |
| `none` in Posizionamento, gradini, film, otturatore | firma solo di Posizionamento (wordSpacing di Era, CAT §3); tratto interno negli altri | D18: `none` è la mappa lineare dello scroll, ERA la usa in tutte le parallassi. |
| Social con righe in controfase = gradini di HorizonStory e parole di Posizionamento | nuovo gesto: il titolo si congeda (CAT §10) | verdetto homeC, bloccante 2. Scelto da Alberto (A25). |
| Method con verso che «segue il lato» | verso alternato per atto, non per lato | tutte e tre le foto stanno a destra (`Method.tsx:224`). |
| Costi in scrub sotto cinque corridoi | a tempo con IO | verdetto homeB, bloccante 5: lo stato chiuso lo scioglieva solo ScrollTrigger nella zona inaffidabile. L'IO lo scioglie sempre e libera uno slot di scrub. |

**Componenti ripetuti, dichiarati.** Scala .75→1: capitoli 3, 9, 17, come in Era (§6a, §12, §15); origine e opacità diverse (3: centro, con opacità; 9: in alto, senza opacità; 17: in alto, con opacità). Traslazione x di un track in uno sticky: 4 e 15, due set piece esistenti (A12, A03). yPercent su colonne: 7 (due colonne ±10 %) e 16 (una colonna ±3,5 %). Clip `inset` a tempo su una foto: 4 (sipario da sinistra con scala) e 8 (verso alternato, senza scala). Scala interna 1,15→1: 4 (a tempo) e 11 (in scrub).

### 3.2 HeroCinematic: il tuffo

**Oggi.** `section#top` (`HeroCinematic.tsx:393`); banda `[data-hero-media]` `h-[var(--dt-band-h)]` (`:407-410`); ritaglio `absolute inset-0 overflow-hidden` (`:414`); Image `preload`, quality 78, `sizes="100vw"`, `objectPosition "10% 0%"` (`:415-429`); lockup z-10 (`:457-467`); firma `translate-y-[26%]` z-20 (`:477-484`); blocco con sovratitolo, H1, CTA e voto (`:493-529`). Misurato: `#top` alto 984 px a 1440×900, 854 a 1024×768, 790 a 390×664. File 2000×1415.

**Gesto** (da `MQ.corridor`; `useCorridor({ id: "hero", stick: "bottom" })`):

| Posizione | Bersaglio | Da → a | Ease |
|---|---|---|---|
| 0 → 0,6 | `[data-hero-zoom]` | y 0 → `−(t′ − bandH)` | `dtEase` |
| 0 → 0,6 | `[data-hero-lift]`, `[data-hero-block-lift]` | y 0 → `−L` | `dtEase` |
| 0,4 → 1 | `[data-hero-zoom]` | scale 1 → 2, origine `50% 75%` | `dtIn` |

- `tImg = max(bandH, bandW / ratio)`; `t′ = 0,80 · tImg` (D24, A23); `L = max(1,25 · t′ − bandH, 1,05 · B)`, B = fondo del contenuto del blocco + 24 px.
- **Correzione bloccante 1 (homeA).** `[data-hero-zoom]` ha l'altezza resa della foto già in SSR: `absolute inset-x-0 top-0 min-h-full aspect-[2000/1415]`. Image e video restano dentro invariati. A riposo il ritaglio di `:414` mostra gli stessi 540 px: il patto della porta regge (`intro-clocks.test.ts:424`, `:428-430`).
- **Correzione bloccante 2 (homeA).** `data-hero-lift` sta su un wrapper nuovo `absolute inset-x-0 bottom-0 z-20` che contiene la firma; lo span tiene `translate-y-[26%]` e diventa `relative block`. GSAP 3.15 riscrive la proprietà CSS `translate` dentro `transform` e toglierebbe il 26 %. Regola nel commento: nessun tween su un nodo con utility `translate-*`.
- **Correzione bloccante 4 (homeA).** Nessun `data-bg` dentro lo schermo sticky. Marcatore fratello dello schermo in `#top`: `<span aria-hidden data-bg="foto" className="pointer-events-none absolute left-0 top-0 w-px h-[var(--dt-band-h)]" />`; sotto `MQ.corridor` prende `height: auto; bottom: 100svh`, cioè copre fino alla cima di Posizionamento.
- Il blocco prende `overflow: clip` sotto il gate: H1 e CTA escono sotto il bordo della foto, nessun testo d'inchiostro passa sopra la foto. Lockup e firma escono dall'alto sopra la foto: sono due dei quattro punti dichiarati (`DESIGN.md:583`).
- **Numeri a 1440×900:** H 984, `stickTop` −84, aggancio a scrollY 174, sgancio a 1.974; tImg 1.019, t′ 815, salita della foto −275 px (il segno a y 86 % resta sotto il ritaglio), L 479; il foglio entra a p 0,5, tocca il bordo della banda a p 0,75, raggiunge il monogramma a p 0,97.
- Lettere: ruoli `title` e `accent` (§2.5). Il flip e i lift stanno su nodi diversi.

**768-1023:** niente corridoio. ScrollTrigger sulla banda, `start: 0`, `end: () => \`bottom ${headH}px\``, scrub `true`: `[data-hero-zoom]` scala 1→1,12 `dtIn` e y 0 → `−0,5·(t′ − bandH)` `dtEase`; `[data-hero-lift]` −12svh. **390:** solo `[data-hero-lift]` −8svh; foto ferma (a DPR 3 è già 1,32× sotto la risoluzione).

**Reduced-motion e senza JS:** nessun `data-hero-intro`, spaziatore `display: none`, due div senza stile: pagina identica a oggi.

**Fuoco:** rete del hook; a p 0 H1 e CTA sono in vista.

**Pixel.** A riposo nulla cambia. In corsa a 1440 DPR 1 next/image serve 1536w; alla scala visibile 1,38 si scende a 0,77 px di sorgente per px CSS, a DPR 2 a 0,50. Eccezione di corsa da scrivere accanto a `DESIGN.md:499` (D24); `sizes` non si alza (costo LCP).

**Test:** `hero-dive.test.ts` (regex sul sorgente: `[data-hero-zoom]` contiene Image e video con la classe aspect uguale al rapporto del file; nessun `data-` fra `data-hero-media` e `h-[var(--dt-band-h)]`; nessuno `style` sulla banda; nessun `pin:`); `e2e/hero-dive.spec.ts` (@1440 e @1024: identità a scrollY 0; bordo basso di `[data-hero-zoom]` ≥ bordo basso di `[data-hero-media]` − 1 px a p 0,3, 0,6, 1; firma −26 % della sua altezza ± 1 px a scrollY 0 dopo andata e ritorno; a p 0,5 scala > 1,05; tastiera sulla CTA; @1023 lo stesso controllo del ramo non sticky; @390 zoom sempre identità; a scrollY 1.000 il monogramma ha tema foto, anche dopo `ScrollTrigger.refresh()` lanciato lì).

### 3.3 Posizionamento: il foglio e le parole

**Oggi.** `Posizionamento.tsx:75-121`; foto in `<Parallax speed={-0.04}>` (`:83-98`). Misurato 891 px a 1440.

- **Foglio.** Sotto il gate: `[data-corridor="hero"] + [data-hero-cover] { position: relative; z-index: 1; margin-top: -100svh; }`, in CSS prima del paint. Bordo dritto, nessun raggio, nessuna ombra.
- **Parole.** Righe = `.dt-w` raggruppate per `offsetTop`; sulla riga r con n parole la parola k va da x 0 a `k · min(10vw, slack_r / (n − 1))`; righe di una parola ferme. Il titolo diventa giustificato e nessuna parola esce dal box. `fromTo` per parola, valori funzione, `invalidateOnRefresh`, `dependencies: [locale]` con `revertOnUpdate`.
- Via la Parallax (D23).
- **Sotto 1024:** niente foglio, parole sì. **Reduced-motion:** nessun margine, nessun transform.
- **Test:** @1440 a fine corsa dell'hero `[data-hero-cover]` top in [−1, 1]; @1440 e @390 in `it` e `de`, per ogni parola `right ≤ right dell'h2 + 1`; @768 e reduce `margin-top` 0 px.

### 3.4 HomeSearchGateway: l'aggancio

**Oggi.** `section#cerca` (`HomeSearchGateway.tsx:110`); form dentro Reveal con delay 120 (`:119-206`); label che avvolgono i controlli. Misurato 1.102 px a 1440.

- `[data-dock]` sostituisce la Reveal del form. `fromTo({ opacity: 0.02, scale: 0.75, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1 })`, `circ.out`, scrub 0,35, `top 95%` → `top 55%`, `immediateRender: false`. Origine al centro come Era §6a (verdetto homeC), la cima resta alla cartolina.
- Il range di Era (`top 30%` → `bottom bottom`) lascerebbe il form a opacità 0,69 al centro del viewport: resta `top 55%`.
- **Fuoco** (verdetto homeA): al primo `focusin` `st.kill()` e `gsap.set(dock, { opacity: 1, scale: 1 })` per il resto del montaggio. Nessun ritorno a 0,3 al blur.
- Eyebrow, h2 e blocco venditore restano ai ruoli del testo; il form non ha reveal di testo.
- Opacità minima 0,02, mai `visibility`.
- **Test:** @1440 e @390 bordo alto al 40 % → opacity ≥ 0,99 e identità; al 95 % → opacity < 0,5, focus sul primo input → 1 entro 100 ms, blur e scroll di 200 px → resta 1; `/#cerca` senza fotogrammi sotto 0,99; reduce senza `style`.

### 3.5 HorizonStory: il nastro, ripulito

Valori invariati (`HorizonScroller.tsx:426-436`, `:565-577`, `:579-601`). Cambi:
1. via i selettori morti dei fiori (`HorizonScroller.tsx:18`, `:362-402`, `:603-629`) e «fiori» dai commenti `:28-30`, `:97-99`; rimandi di riga riscritti a `:175-185`, `:362-369`; commit a sé con gli e2e dei nastri verdi;
2. manifesto e h4 a `SplitTitle`; `enter` e `track` al motore (§2.4); `autoAlpha` → `opacity` a `:213`, `:227`, `:526`, `:539`;
3. gate a `MQ.corridor` (D22).
Test nuovo: unitario che vieta `data-horizon-flower` in `app/` (schema `soloCodice` di `logo-colore.test.ts:44-46`).

### 3.6 StarReviews: il film resta

Valori invariati, scrub 0,6 compreso (la rotaia cambia al suo posto). Cambi: titolo a cue (§2.4); commenti stantii `:35-37`, `:402-408`, `:640-642` riscritti; `data-bg="foto"` su `.dt-starrev_intro` acceso da `onUpdate` nel tratto in cui la copertina copre l'angolo (contratto di §6.1; la `data-bg="nastro"` sulla runway di homeA non entra); gate a `MQ.corridor`. Test nuovo: a fine runway lettere dell'h2 a 1 e identità; `tl.duration()` resta 1,3.

### 3.7 Voci: il carosello arriva da destra

**Oggi.** `Voci.tsx:151-308`; `ul` con scroll nativo e snap (`:183-187`); `dt-still-trim` 1,43 sull'img (`globals.css:391-394`).

- Entrata: al primo ingresso per montaggio `ul` xPercent 25→0, 1,0 s, `domus.inOut`; tessere visibili (calcolate con `offsetLeft − scrollLeft`, non col rettangolo già traslato) `[data-voci-slide]` da `polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)` a pieno, `[data-voci-slide-inner]` xPercent 25→0; 1,0 s, stagger 0,15, ritardo 0. Fine: `clearProps: "clipPath,transform"`.
- Uscita: `polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)` → `polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)`, inner xPercent −25, 0,6 s, `domus.inOut`.
- IO sulla `ul`, `rootMargin "0px 0px -30% 0px"`: entrata con `isIntersecting`, uscita con `boundingClientRect.top > rootBounds.bottom`. Stato chiuso scritto solo se al montaggio la rotaia è sotto la piega.
- Niente scala 1,5 di Era: sopra 1,43 non c'è margine di pixel (a DPR 2 la copertina rifilata chiede già 1.318 px su 1.280).
- Il link non riceve transform né clip; il play resta fuori dall'inner. Eccezione motivata alla regola dei bersagli, scritta nel commento.
- Wrapper `overflow-x-clip` (`:182`).
- **Test:** @1440 e @390 dopo 1,6 s niente clip-path inline; durante l'entrata `scrollWidth − clientWidth ≤ 0`; reduce senza `style`; unitario: `dt-still-trim` sull'img e nessuno `scale` nel gesto.

### 3.8 Paths: le colonne in controfase

**Oggi.** `Paths.tsx:214-267`, foto in Parallax (`:236-247`). Misurato 1.868 px a 1440.

- Colonna visiva a sinistra `yPercent −10 → 10`, a destra `10 → −10`; `dtSosta`, scrub 0,5; trigger la **riga** (`[data-paths-row]`, che non si muove), `top 125%` → `bottom -25%`. Con `dtSosta` le colonne restano allineate per un tratto quando la riga passa al centro.
- **768-1023:** colonne impilate, spostamento in px `±(floor(gap/2) − 1)`: 22 px a 768. **390:** 10 px (correzione homeB: non 11).
- Via la Parallax. `dependencies: [locale]` con `revertOnUpdate`.
- **Test:** @1440 m42 delle due colonne cambia di ≥ 40 px fra riga al 90 % e al 10 %, con segni opposti; @390 |m42| ≤ 11; reduce `none`.

### 3.9 Method: la tendina a verso alternato

**Oggi.** Tre atti, foto tutte a destra (`Method.tsx:224`), in Parallax (`:225-236`). Condiviso con /metodo (`MetodoContent.tsx:226`): il gesto vale anche lì.

- `ClipMedia chapter="method" from={i % 2 ? "right" : "left"}`: atti 1 e 3 `inset(0% 100% 0% 0%)` → `inset(0%)`, atto 2 `inset(0% 0% 0% 100%)` → `inset(0%)`; 2,4 s, ritardo 0,8, `power4.out`.
- IO sulla scatola, `rootMargin "0px 0px -10% 0px"`: l'uscita parte quando la scatola scende sotto il 90 % e si vede. Uscita `power4.in` 0,4 s, la tendina prosegue nel suo verso. `out?.kill()` prima di ogni ingresso.
- Stato chiuso solo al primo callback e solo se la scatola è sotto il viewport. `will-change: clip-path` solo durante il tween.
- Via la Parallax.
- **Test:** `motion.spec.ts:45-56` verde; reduce `clip-path` none su /metodo; motion ok @1440 e @390 su `/` e `/metodo`: scatola al centro, dopo 3,4 s `inset(0%)`; risalita e ridiscesa → si riapre.

### 3.10 OpenDomus: la finestra

**Oggi.** `OpenDomus.tsx:154-220`, facciata YouTube in `.dt-media-half`. Misurato 930 px a 1440. Condiviso con /metodo e /open-domus: la finestra vale solo con `<OpenDomus finestra />` in home (D28).

**Struttura** (Era ERA:2709-2789, arch-dome.css:34-72; correzione bloccante 5 di homeB):

```tsx
<section id="open-domus" className="dt-od bg-cream" data-corridor="finestra" data-od>
  <div className="dt-od_area">
    <span aria-hidden data-bg="avorio" className="dt-od_mark dt-od_mark--a" /> {/* top 0, 150svh */}
    <span aria-hidden data-bg="foto" className="dt-od_mark dt-od_mark--f" />   {/* top 150svh, 150svh */}
    <div className="dt-od_shutterzone" aria-hidden>                          {/* absolute, top 0, 300svh, pointer-events none */}
      <div className="dt-od_screen" data-corridor-screen>                    {/* sticky, 100svh, overflow clip, nessun margine negativo */}
        <div className="dt-od_shutters"><div className="dt-od_shutter dt-od_shutter--l" /><div className="dt-od_shutter dt-od_shutter--r" /></div>
      </div>
    </div>
    <div className="dt-od_stage">                                             {/* sticky, origine 50% 0% */}
      <div className="dt-od_window dt-media-full"><Image src="/images/reali/villa-fronte-acqua.jpg" … /></div>
      <RevealGroup hold className="dt-od_content dt-chapter">…contenuto di oggi…</RevealGroup>
    </div>
    <div className="dt-od_run" aria-hidden />                                 {/* 200svh */}
  </div>
</section>
```

- La zona delle tende è absolute e non occupa flusso: lo schermo si sgancia con lo stage a +200vh senza dipendere da `onLeave` (in Era regge `section.clip`, qui vietato). `visibility: hidden` a `onLeave` resta come ottimizzazione.
- La scala 1,84 sta su `.dt-od_shutters`, figlio dello schermo che ritaglia sé stesso. Nessun antenato trasformato o ritagliato.
- Tende `var(--color-cream)` #f9f5ef, il fondo del capitolo prima (CAT §12: «colorare le tende come il fondo della sezione precedente»).
- Poligoni di Era esatti (`lane-homeB.md` §9, frazioni 4/9, 5/9, 89/90, 1/90, 5/27, 22/27, 13/36, 107/108, 1/108, 23/36).
- **Timeline:** trigger `.dt-od_area`, `top bottom` → `+=` 3·innerHeight, scrub 0,15; otturatore 0→0,5 `none`, montanti 0,5→0,6 `none`, scala 1,84 e stage .75→1 0,6→1 `dtInOut` (lo stage con `immediateRender: true` di proposito: a .75 già durante l'otturatore, ERA:2763).
- **Marcatori del tema** (correzione bloccante 4 di homeB): avorio da s 0 a +150svh, foto da +150svh a +300svh. E2E a 1440: tema diverso da «foto» a s = +100vh, «foto» a s = +220vh.
- **Contenuto:** 22svh di vuoto sopra (l'eyebrow non si vede nel foro). Gruppo in `hold`; cue a p 1 → `release()` e `sweep()`; ritorno sotto 1 → `play("out")` e hold. Rete di fuoco: `focus` porta a `st.start + 4·innerHeight + offsetNelContenuto − 0,25·innerHeight`.
- **Pixel:** la foto sta sullo stage e non subisce la 1,84: resa 100vw a 1440×900 (variante 1536 a DPR 1). `SIZES_FINESTRA` di `lane-homeB.md` §9. File `villa-fronte-acqua.jpg` 2560×1707, lazy.
- **Sotto 1024** (motion ok, nessun `data-on`): la foto in `.dt-media-half` in testa al capitolo; otturatore a due rettangoli sfalsati (M0 → M1 1,3 s `dtInOut`, M1 → M2 0,2 s `none`), IO threshold 0,35, uscita `tl.timeScale(2).reverse()`, rientro `tl.timeScale(1).restart()`. Contenuto senza scala.
- **Stato fermo** (reduce, senza JS): da lg banda `.dt-media-full` 16:9 in testa; sotto lg `.dt-media-half`. Nessuna scatola a mano. La banda 100vw × 100svh del corridoio è un quarto formato, dichiarato in `DESIGN.md` accanto alla banda del Congedo.
- **Altezza:** +2.772 px a 1440×900 (pista 1.800, banda 900, padding 72).
- **Test:** home.spec «la finestra si apre» (a s 0 ordinata della tenda sinistra fra 18,519 e 36,111; a +200vh `a` delle tende 1,84 ± 0,01 e dello stage 1 ± 0,005; traboccamento ≤ 1 px); reduce `display: none` di zona e pista; @390 clip finale M2 dopo 1,6 s; a 1440×600 e 390×844 i testi di Open Domus arrivano a opacity 1; tastiera da «Vedi i nove passi» (`Method.tsx:286`) alla facciata in viewport.

### 3.11 DomusDocProtocol: le righe che si tirano

**Oggi.** `DomusDocProtocol.tsx:237-301`; lista `ul grid md:grid-cols-2` (`:271`). Condiviso con /vendi, /metodo, /acquista: il gesto vale lì.

- `Hairline chapter="doc"`: una riga `h-px bg-line` in cima a ogni pilastro; clip `inset(0% 100% 0% 0%)` → `inset(0%)`, 0,8 s, stagger 0,08, ritardo 0,2, `power1.out`. Spina verticale su un `div` che avvolge la `ul` (non figlia della `ul`, verdetto homeB): `inset(0% 0% 100% 0%)` → `inset(0%)`, 1,12 s, stessa ease, da md.
- IO sulla `ul`, `rootMargin "0px 0px -40% 0px"`; stato chiuso solo se `boundingClientRect.top > innerHeight`. Uscita: righe verso `inset(0% 0% 0% 100%)`, spina verso `inset(100% 0% 0% 0%)`, 0,5 s, `circ.in`, stagger 0,05 dall'ultima.
- Righe e spina visibili anche ferme (D26). Colore `--color-line` #e4dccf.
- **Segnalazione:** il sigillo è un cerchio (`DomusDocProtocol.tsx:245-246`) e `LazyYouTubeEmbed.tsx:86-87` dichiara il play «l'unica curva ammessa». Da confrontare con C01 in un commit a parte.
- **Test:** @1440 a scroll 0 `inset(0% 100%…`; con la lista al 50 % dopo 1,8 s `inset(0%)`; reduce `clip-path` none, riga alta 1 px rgb(228, 220, 207).

### 3.12 Services: lo zoom d'ingresso

**Oggi.** `Services.tsx:262-336`; foto in `Parallax speed={-0.04} scale={1.03}` (`:285-298`); `SHOT_SIZES` (`:247`). Condiviso con /servizi.

- Interno `[data-zoom]`: `scale 1.15 → 1`, origine `50% 100%`, `sine.out`, scrub 1,0, scatola `top bottom` → `bottom bottom`.
- Niente parallasse yPercent di Era (D27): con i bordi coperti servirebbe un interno alto 130 % e la resa salirebbe a 2,24×.
- `zoomSizes(ratio, 1.15)` di `lane-homeB.md` §11 con il rapporto vero di ogni foto.
- Riga 1: fotogramma 4K della sala del tour (§7.3) al posto di `home_staging_01` (1024 px); righe 2 e 3 invariate.
- **Test:** @1440 prima scatola con top al 95 % → `a > 1,1`; bordo basso sul fondo → `a` = 1 ± 0,01; @390 `a > 1,08`; reduce `none`.

### 3.13 CostiChiari: l'acqua che sale

**Oggi.** Riga-dichiarazione (`CostiChiari.tsx:23-29`, `:117-143`), misurata 257 px a 1440. Condiviso con /vendi: l'acqua vale solo con `<CostiChiari acqua />` in home.

- Banda `.dt-media-full` 16:9 dentro `div.dt-row mt-[clamp(2.5rem,7vh,5rem)]`, larga quanto la riga (D25).
- Clip sulla banda (poster e video): `inset(100% 0% 0% 0%)` → `inset(0%)`, 1,8 s, `expo.out`; IO `rootMargin "0px 0px -20% 0px"`; uscita 0,7 s `sine.in` verso `inset(100% 0% 0% 0%)` quando la banda torna sotto l'80 %. Stato chiuso solo se al montaggio la banda è sotto il viewport; rete a 2.500 ms se in vista e chiusa.
- Video: `useAmbientVideo(videoRef, bandRef, { sources: { hd: acqua } })` da 768 px; poster `acqua-poster.jpg` con `sizes="(max-width: 767px) 90vw, 84vw"`. A 390 e con reduce resta il poster, 0 byte di video.
- `data-bg="foto"` sulla banda. Nessuna scritta sopra.
- Commento `:23-29` riscritto: una riga seguita da una banda.
- **Altezza:** +743 px a 1440 (banda 680, margine 63).
- **Test:** @1440 rotella fino a `#costi` attraversando i corridoi: con la banda all'80 % dopo 2 s `inset(0%)`; `paused === false` e `currentTime` che cresce su due campioni a 300 ms; in cima `paused === true`; @390 e reduce nessuna richiesta `acqua-*.mp4|webm`.

### 3.14 FeaturedTestimonial: la foto affonda

**Oggi.** `FeaturedTestimonial.tsx:114-178`; link `dt-media-half !aspect-video` dentro `<Parallax>` (`:120-128`); `recensione-clienti.jpg` 1280×720 col titolo cotto fino al 19,9 %; `.dt-still-trim--top` 1,32 (`globals.css:395-398`). Vive anche su /vendi, /acquista, /recensioni.

- Solo con `gesture` (home, D28). Il link non si muove; dentro, `[data-sink]` `absolute inset-x-0 bottom-0 top-[-10%]` scende di `yPercent 9.0909` (10 % della cornice), `dtAffonda`, scrub 1,2, cornice `bottom bottom` → `bottom top`.
- Trim 1,30 × overscan 1,10 = 1,43, tetto di `DESIGN.md:593`; parte nascosta a fine corsa 23,1 % > 19,9 % (D29).
- `sizes` con gesto `"(max-width:1024px) 132vw, 61vw"`.
- Senza `gesture` resta la `Parallax` di oggi (/vendi, /acquista, /recensioni invariate). `gesture` nelle dipendenze di `useGSAP` con `revertOnUpdate`.
- **Test:** @1440 e @390 m42 di `[data-sink]` in (0, 0,10·altezza + 1]; il rettangolo del link coincide col layout; reduce `none`; `still-trim.test.ts` (prodotto ≤ 1,43, `(s−1)/s ≥ 0,21`).

### 3.15 Social: il titolo si congeda

**Oggi.** `Social.tsx:67-107`, riga con titolo d2 16ch, lead, icone. Misurata 338 px a 1440.

- Bersaglio: il blocco eyebrow + titolo (nessun focusabile). `fromTo({ scale: 1, opacity: 1 }, { scale: 1.12, opacity: 0 })`, origine `0% 100%`, `expo.in`, scrub 1,3, `center center` → `bottom top`. Rientrando dall'alto torna pieno: speculare per scrub. Opacità finale 0, non 0,02: axe salta lo 0 e misurerebbe lo 0,02.
- Da CAT §10 (zoom e dissolvenza delle amenities), senza sticky. Nessun asse già usato dai capitoli 2 e 4.
- Section `overflow-x-clip` (nessuno sticky dentro).
- **Test:** @1440 e @390 al centro del viewport scala 1 e opacity 1; a metà uscita scala > 1,05 e opacity < 0,7; `scrollWidth − clientWidth ≤ 1`; reduce `none`.

### 3.16 Team: la rotaia

- `HorizontalRail` prende `scrub?: number = 0.6` ed `ease?: string = "none"`; Team passa `scrub={0.7} ease="dtRail"`; il pan usa la stessa ease. Vale anche su /chi-siamo (`Team compact`, `ChiSiamoContent.tsx:359`).
- Via la Parallax dell'intro (`Team.tsx:159`), anche su /chi-siamo (D23).
- `data-bg="foto"` sulle cornici `.dt-media-column` e sulla foto dell'intro.
- **Difetto di tastiera esistente:** `focusin` su una tessera → `rail.scrollLeft = 0`; progresso p trovato per bisezione con `gsap.parseEase("dtRail")(p) = offsetLeft / eccedenza`; `y = st.start + p·(st.end − st.start)`; `getLenis()?.scrollTo(y, { immediate: true })`; `st.getTween()?.progress(1)`.
- Gate a `MQ.corridor`.
- **Test:** `home.spec.ts:182-215` verde; Tab fino alla terza tessera a 1440 → tessera nel viewport orizzontale e `scrollLeft === 0`.

### 3.17 Contact: il modulo resta indietro

**Oggi.** `Contact.tsx:704-959`; foto `raffaela-keys.jpg` in `<Reveal delay={120}>` (`:758-771`). Reso da 12 rotte, `/case/[slug]` compresa (`PropertyDetail.tsx:646`).

- Solo con `gesture` (home) e da 1024: wrapper `[data-lag-col]` intorno al `<form>` (il form e `handleSubmit` non cambiano), `yPercent −3.5 → 3.5`, `power1.in`, scrub 1,1, griglia `top 70%` → `bottom 30%`. ±36 px su ~1.040 px di modulo.
- La brief diceva «sale più lenta» citando ctn-up, che in Era sale più veloce (CAT C4). Il ritardo tiene il bottone più a lungo sotto gli occhi (D30).
- **Correzione bloccante 4 di homeC:** `{gesture ? foto : <Reveal delay={120}>{foto}</Reveal>}`. La foto sta ferma solo in home.
- `requestRefresh()` su `sent`, `delivery` e al cambio d'intento (`Contact.tsx:561-564`).
- **Test:** @1440 m42 ∈ [−40, 40] con la griglia al centro e crescente di 400 px in 400 px; @390 e reduce `none`; su `/case/<slug>` `[data-lag-col]` assente e la cella della foto ha un antenato `.reveal`; unitario: il ramo senza `gesture` contiene `Reveal delay={120}`.

### 3.18 Congedo e footer: la cartolina

**Oggi.** `Congedo.tsx:82-143`: section `aspect-video min-h-[70svh] overflow-hidden`, 810 px a 1440; clip e poster scalati 1,14 per mangiare il logo (`:99-124`); titolo d1 bianco con `INK_ON_VIDEO`. Footer in flusso (`Footer.tsx:12-38`), 882 px a 1440.

- `useCorridor(sectionRef, { id: "cartolina", stick: "top", endTrigger: footerRef, end: "clamp(top 40%)", build, phone })`: `data-corridor="cartolina"` sulla section, `data-corridor-screen` sullo schermo, `--corridor-run: 80svh`. Via `overflow-hidden` dalla section.
- Il ritaglio sta su un figlio dello schermo: `inset(b)` 0→8 % in 0→0,54; `t`, `r`, `l` 0→8 %, 22 %, 22 % in 0→0,85; `dtCartolina`. Il bordo basso chiude prima: il footer non copre mai il video.
- Footer: `<Footer postcard />` scrive `data-postcard-foot`; sotto il gate `:root[data-hero-intro] main:has([data-corridor="cartolina"]) + footer[data-postcard-foot] { position: relative; z-index: 1; margin-top: -8svh; }`. Tween `scale .75→1`, `opacity 0→1`, origine `50% 0%`, da 0,545 a 1, `immediateRender: false`. Il tween nasce solo se al montaggio `footer.getBoundingClientRect().top > innerHeight`; altrimenti si arma a `onLeaveBack` (nessun visibile → meno visibile). Stato armato fuori schermo: opacity 0.
- **Rete di tastiera** (correzione bloccante 3 di homeC): prima del calcolo `if (!(e.target as Element).matches(":focus-visible")) return;`. Un clic del mouse su telefono, WhatsApp o e-mail del footer non fa saltare la pagina.
- Titolo `SplitTitle` con `INK_ON_VIDEO` sui caratteri; blocco posizionato in percentuale dentro la finestra finale (`.dt-postcard_copy`, `lane-homeC.md` §7.4-7.5). `--pc-focus` da misurare a 1024, 1440, 1920 e sotto 1024 con la luminanza sotto il titolo sui fotogrammi 0, metà e ultimo del loop.
- Video: `useAmbientVideo(videoRef, clipRef, { sources: { hd: congedoHd, sd: congedoSd } })`, niente più `scale-[1.14]`.
- **Sotto 1024** (`phone`, non sticky): trigger banda `bottom bottom` → `clamp(bottom 30%)`, clip → `inset(4% 14%)` da 768, `inset(4% 10%)` sotto (D29); footer .75→1 senza margine negativo. Video da 768.
- **Reduced-motion e senza JS:** banda piena, testo dentro il rettangolo della futura finestra, footer in flusso.
- **Costo di paint:** pannello Performance a 1440, CPU ×4, meno di 4 ms per fotogramma nello sticky. Se sfora, prima prova la sorgente `sd` forzata durante lo sticky.
- **Altezza:** +738 px a 1440×900.
- **Test:** home.spec a 1440 (schermo a top 0 a metà corsa; `inset(8% 22% 8% 22%)` ± 0,2 col footer al 40 %; footer opacity 1 e scala 1; CTA raggiungibile con `elementFromPoint` a 0, metà, fine; titolo dentro la finestra nelle 5 lingue a 1024, 1440, 1920 con `page.setViewportSize`); antenati da section a `html` con transform `none` e overflow-y non `hidden|auto|scroll`; `page.mouse.click` sul link del telefono col footer al 60 % → `scrollY` invariato e `click` ricevuto; Tab al primo link del footer → opacity 1 entro 1 s; mobile-390 (viewport 390×664) non sticky, `inset(4% 10% 4% 10%)`; reduce; `congedo-cartolina.test.ts`.

---

## 4. I sei corridoi sticky

| Corridoio | Meccanica | Corsa sticky | Altezza a 1440×900 | Sotto 1024 |
|---|---|---|---|---|
| Tuffo dell'hero | `useCorridor` stick bottom | 200svh (1.800 px) | #top 984 + spaziatore 1.800, −900 di copertura = **+900** | zoom 1,12 in scrub (768-1023), solo lift (sotto 768) |
| HorizonStory #storia | esistente, altezza da JS | `scrollWidth` | section 4.719 (invariata) | colonna |
| StarReviews #recensioni | esistente, CSS 360svh | 360svh | 3.240 (invariata) | film a tempo 3 s |
| Finestra di Open Domus | `.dt-od_area`, due strati sticky | 200svh di pista | 930 → 3.702 = **+2.772** | otturatore a tempo sul quadrato |
| Rotaia del team | esistente, `rail-len + 120svh` | rotaia + 120svh | section 3.512 (invariata) | scroll nativo con snap |
| Cartolina del Congedo | `useCorridor` stick top | 80svh | 810 → 1.620, footer −72 = **+738** | clip non sticky |

Più la banda di Costi chiari (+743 px), che non è un corridoio.

**Altezza della home** (misura del 13 set. sul build del branch; «dopo» è la somma delle aggiunte):

| Viewport | Oggi | Dopo | Aggiunta |
|---|---|---|---|
| 1440×900 | 29.692 px (33,0 schermi) | ≈ 34.845 px (38,7 schermi) | +5.153 px, 5,7 schermi |
| 1024×768 | 25.740 px | ≈ 30.156 px | +4.416 px (hero 768, finestra 2.365, Costi 538, Congedo 745) |
| 390×664 | 27.332 px | ≈ 27.960 px | +628 px (quadrato della finestra e banda di Costi) |

La memoria stimava 3-4 schermi per i tre corridoi nuovi (`domus-coreografia-era.md:14`). Con la fedeltà letterale sono 5,7 a 1440. Alberto non rimette in discussione il budget: il numero va detto a lui e alla cliente.

**Regole comuni:** gate `MQ.corridor` per tutti e sei e per il tuffo delle PageHero (D22); a 1280×600 oggi si accendono tre nastri, dopo nessuno. Layout in CSS prima del paint per tuffo, finestra, cartolina, stelle e page-dive; nastro e rotaia restano misurati da JS col ripristino al capitolo. Nessun `pin:` nel codice (`no-pin.test.ts`). Nessun antenato trasformato o ritagliato. Sotto 1024 nessuno scroll-hijack: il touch resta nativo (`SmoothScroll.tsx:6`). Reduced-motion: nessun corridoio, pagina completa e ferma. Senza JS: nessun `data-hero-intro`, nessun corridoio, tutto visibile.

**Guardia sul numero:** e2e a 1440 motion ok su `/` conta gli host accesi e pretende la lista `hero`, `storia`, `recensioni`, `finestra`, `team`, `cartolina`; a 390 e con reduce zero; su /vendi a 1440 uno solo, `page-dive`. Il conteggio delle regole CSS proposto da homeB non entra: oggi fa 3 (`globals.css:1752`, `:1964`, `:2083`) e arriverebbe a 6 per caso.

---

## 5. Pagine interne

### 5.1 Il tuffo sulle 11 PageHero

`PageHero` resta server (`PageHero.tsx:29`) e monta `PageHeroDive` e `PageHeroBand`, client. Il `Parallax` esce (`PageHero.tsx:113-121`).

- `useCorridor(ref, { id: "page-dive", stick: "top", build, phone, focus })`, `--corridor-run: 120svh`; schermo `height: 100svh; overflow: clip`.
- Timeline (trigger la section, `top top` → `bottom bottom`, scrub `true`): `[data-dive-content]` y 0 → −Δt, `[data-dive-band]` y 0 → +(Δt − Δb), 0→0,6 `dtEase`; `[data-dive-zoom]` scale 1→2, origine 50 % 75 %, 0,4→1 `dtIn`. `Δb = max(0, bandBottom − vh)`, `Δt = max(1,25·Δb, textBottom + 24)`, misure con `offsetTop`/`offsetHeight`. A20 vieta i doppioni solo fra capitoli della home: il tuffo delle pagine interne ripete la coppia dell'hero, ed è dichiarato.
- Nessun testo sulla foto: a 1440 il testo esce a p ≈ 0,48 con 106 px di margine (`lane-globali.md` §1.4). La calligrafia resta l'eccezione dichiarata e lascia la foto nei primi 180 px del corridoio.
- **Sotto 1024:** `scale` 1→1,08 (768-1023) o 1→1,06 (sotto 768) su uno strato interno a `.dt-media-full`, che ha già `overflow: hidden` (`globals.css:413`), non sulla scatola; `none`, scrub `true`, section `top top` → banda `bottom top`.
- **`data-bg="foto"` su `[data-dive-zoom]`** (correzione bloccante 6 di globali): il suo rettangolo comprende la scala. Test a 1024×768 e 1440×900 su /vendi: tema foto a p 0,8, grafite a scroll 200.
- **H1:** `SplitTitle as="h1"` dentro un `RevealGroup`, stato dipinto di §2.5 con la corta a 1,08 s. L'H1 sta nello schermo sticky: nessun trigger proprio, la sua uscita è il tuffo. Oggi nessuno degli 11 H1 di PageHero è animato: tutti passano JSX e cadono nell'`<h1>` fermo di `PageHero.tsx:88`.
- **LCP:** la foto con `preload` resta il candidato. Base `100vw`; lo strato nitido `sizes="200vw"` arriva dopo `requestIdleCallback` (timeout 2.500), decodificato a opacità 0, acceso sopra p 0,4, solo a DPR 1 (a DPR 2 diventerebbe una texture di circa 5.760×3.240) (D33). Sotto 768 `sizes` passa a 200vw: oggi `100vw` manda metà dei pixel. Condizione: LCP mediano a 390 DPR 3 Slow 4G ≤ base + 150 ms; se sfora, 133vw dichiarato come deroga a D04.
- **Fuoco:** default del hook (progresso con la CTA dentro il viewport); test a 1280×720.
- **Altezza aggiunta:** ≈ +740 px a 1440, +690 a 1024, +700 a 1920 (stime da misurare).
- **Test** `e2e/page-hero-dive.spec.ts`: identità a scroll 0 sulle 11 rotte; a metà corridoio `data-on` e scala > 1; 21 quote senza intersezione fra testo e foto (1024, 1440, 1920; /vendi e /domande-frequenti); CTA in viewport dopo il fuoco; `/vendi#contatti` senza salto; a 390 e 768 niente sticky, scala ≤ 1,06 e ≤ 1,08; nomi accessibili degli H1 in 5 lingue. `motion.spec.ts:108-173` (parallasse di PageHero) si sostituisce; `motion.spec.ts:123` cerca `img[sizes='100vw']` e va riscritto. I test con quote di scroll fisse sulle pagine interne si rivedono: il corridoio allunga le pagine di circa 700 px anche con la fixture `"q"`.

### 5.2 Gli H1 sopra la piega: 14 pagine e la home

11 PageHero, `/contatti`, `/case-vendute`, `/valutazione-immobile-tradate`, più lockup e H1 della home. Regola di §2.5. Sulle tre pagine senza foto il lead resta intero fino all'LCP. Le tessere di `/case-vendute` (`CaseVenduteContent.tsx:283-292`) sono cliccabili: nei replay solo opacità.

### 5.3 Le sezioni delle pagine interne

Nessun gesto di sezione nuovo. Cambiano i titoli (per lettera), i blocchi `.reveal` (uscita del motore) e i componenti condivisi che portano il loro gesto se non è un corridoio e non è riservato alla home.

| Rotta | Movimento |
|---|---|
| /metodo | Method con la tendina; D.O.C. con le righe; OpenDomus senza finestra; Contact come oggi |
| /vendi | D.O.C. con le righe; FeaturedTestimonial con la Parallax di oggi; CostiChiari riga senza acqua; Contact come oggi |
| /acquista | D.O.C. con le righe; FeaturedTestimonial come oggi; PropertySearch invariato (`search.spec.ts:35`); Contact come oggi |
| /servizi | Services con lo zoom subito dopo il tuffo: due scale di verso opposto in fila, dichiarate |
| /open-domus | OpenDomus senza finestra; testo e uscite |
| /recensioni | FeaturedTestimonial come oggi; Reviews e Stats solo testo |
| /chi-siamo | rotaia del team con `dtRail` e scrub 0,7; intro senza Parallax |
| /lavora-con-noi, /domande-frequenti, /privacy, /cookie | solo testo; nessun transform sugli antenati dell'indice sticky delle FAQ (`FaqContent.tsx:233-236`) |

### 5.4 /case/[slug]: nessun cambio di movimento

Dichiarazione: su `/case/[slug]` (PropertyDetail, PropertyGallery) il movimento della pagina non cambia (D32).

- `MotionFreeze`: `<div data-motion-freeze>` intorno al contenuto di `app/case/[slug]/page.tsx`. Dentro, `Reveal` usa l'implementazione e la CSS di oggi (`Reveal.tsx:18-61`, `globals.css:508-521` sotto `[data-motion-freeze] .reveal`). `ListingCopy.tsx:131`, `:151` restano su quella.
- `page.tsx:251`, `:253` rendono Header e Footer dentro la pagina: il motore salta i gruppi sotto `[data-motion-freeze]`, la regola dello 0,02 li esclude, gli h2 d4 del Footer (`Footer.tsx:84`, `:112`, `:141`) restano come oggi.
- Chrome dell'interfaccia fermo di default: `:root:has([data-motion-freeze]) :is(.t-panel-slide, .t-dropdown, .dt-social__tip) { transition: none !important; }`.
- Il boot script esclude `/case/*` (A26): `pre=gate&&home&&k!=="${INTRO_FILM}"`, `gate` con `!caso`. Su `/case/*` non suona nulla, né film né corta: il ramo `(caso&&m&&!deep&&!k)` di oggi esce dal boot script.
- Il segno fisso non si monta su `/case/*`; `RotatingMark` resta in testata da xl.
- Contact senza `gesture`; ScrollTrigger dei valori (`PropertyDetail.tsx:324-359`) intatto.
- Commento in testa a `PropertyDetail.tsx`: «Pagina di conversione: fuori dalla coreografia A18-A20 (spec §11). Guardia: app/lib/__tests__/case-guard.test.ts.»
- **Guardie:** `case-guard.test.ts` (nessun import di `RevealGroup`, `SplitTitle`, `ScriptWord`, `Lead`, `Hairline`, `ClipMedia`, `useCorridor`, `useAmbientVideo`, `reveal-engine`, `text-roles`, `PageHeroDive`, `MarkSegno` in `app/case/[slug]/**`, `PropertyDetail.tsx`, `PropertyGallery.tsx`; nessun `data-reveal=`, `data-corridor`, `data-bg`, `data-dive`; classi `duration-*`, `ease-*`, `transition*` congelate per file; `<Contact` senza `gesture`; nessun sipario su `/case/*` nel boot script (A26)); e2e su una scheda dei mock (`[data-motion-freeze] .reveal` con `0.9s`; nessun `[data-reveal-armed]`, `[data-segno]`, `.dt-dive`, `[data-lag-col]`, `[data-sink]`).

---

## 6. Globali

### 6.1 Monogramma sempre visibile e cambio di tema

**Variante raccomandata: M1 «il cuore che si stacca» con T1 «le tacche virano»** (D34, A21).

- **Da 1280:** a scroll 0 il segno fisso sta sopra lo slot della testata (segnaposto da 56 px in `Header.tsx:221-223`); nei primi `--dt-head-h` px, in scrub, scivola da `8vw + 28px` a 4vw e scende a `clamp(40px, 3.75vw, 56px)`. Il badge della testata va a opacità 0 nello stesso fotogramma e riceve `paused` (l'attributo `inert` non ferma il ticker di `RotatingMark.tsx:60-68`).
- **Da 1024 a 1279:** fra 0,5·headH e headH compare nel margine, opacità 0→1, scala 0,8→1.
- **Sotto 1024:** il logo col cuore resta nella testata sticky (`Header.tsx:202`).
- `app/components/motion/MarkSegno.tsx`, fratello di `<header>`, `aria-hidden`, `pointer-events-none`, `hidden` in SSR, z-40 (sotto cookie z-60 e dialoghi z-70).
- **T1.** Le tacche prendono `color` #46423d sull'avorio e #f9f5ef quando il centro del segno sta su una zona `[data-bg="foto"]`; `data-bg="avorio"` e `"foto-chiara"` tengono la grafite. Il monogramma resta #595a58 e #e30716 (C23). `.dt-segno { transition: color var(--td-duration-fast) var(--td-ease-smooth-out) }`.
- **Rilevatore** (misura viva, non i trigger fissi di Era C1): a ogni frame di scroll di Lenis, allo scroll dei contenitori orizzontali che hanno zone `[data-bg]` (Voci), al resize e al `refresh`: (a) zone `[data-bg]`; (b) candidate che contengono il centro; (c) `elementFromPoint(cx, cy)`; (d) vince la candidata la cui `section` (o `[data-bg-scope]`) contiene l'elemento in cima; (e) `data-tema`. Lezione di 6a33f85: sovrapposizione non vuol dire visibilità.
- **Contratto:** il `data-bg` sta sull'elemento che coincide con la foto visibile. Zone: marcatore dell'hero (§3.2), `[data-dive-zoom]` delle PageHero, foto del territorio, `.dt-starrev_intro`, tessere di Voci, marcatori della finestra, banda di Costi, `[data-sink-frame]`, cornici e intro del Team, marcatore della cartolina (`inset` aggiornato a ogni frame).
- **Velocità:** `30 + 10·Math.min(Math.abs(velocity), VMAX)`, sempre oraria; VMAX misurato a 1440 su rotella, End/Home e ancora (provvisorio 60 px/frame). Armamento su `wheel`, `touchmove`, `keydown` (frecce, PageUp/Down, Space, Home, End) con listener normale tolto al primo tasto valido fuori dai campi.
- **Stati:** reduced-motion, senza JS, sotto 1024 e su `/case/*` → nessun segno fisso, testata come oggi.
- **Punto nuovo da dichiarare** in `DESIGN.md:583`: le tacche avorio sopra le foto (non lettere, nessuna ombra).
- **Alternative:** M2 «compare nel margine solo da xl», a tempo (si legge come un secondo logo, niente fra 1024 e 1279); M3 «fisso a 8vw» esclusa (sta sopra titoli e occhielli). T2 «il segno sparisce sopra le foto» (non è sempre visibile); T3 «nessun cambio» (le tacche grafite spariscono sulle foto scure). Esclusi: monogramma ricolorato, disco sotto il segno, ombre, `mix-blend-mode`, verso invertito.
- **Test:** `segno.spec.ts` (1440 scroll 0 sullo slot ±1 px e badge a 0; scroll 1.200 centro a 4vw; /vendi p 0,8 del tuffo tema foto e scroll 200 grafite; 1279 e 1023; reduce `hidden`; nessuna intersezione con h1-h3, `a`, `button` a 1024, 1280, 1440 su /, /vendi, /metodo; a 1440 su `/`, a passi di 450 px, quando `elementFromPoint` al centro del segno è `img` o `video` il tema è foto); `mark-orario.test.ts`; `data-bg.test.ts`.

### 6.2 Il preloader corto su ogni rotta

**Forma:** alla prima entrata in home il film intero da 4,63 s con la sagoma; ogni altro caricamento completo la porta corta da 2,38 s. La sagoma compare nella corta solo su «/» (patto della porta); sulle pagine interne la corta non ha sagoma (la banda di PageHero comincia a una quota che cambia con lingua e larghezza).

**Macchina a stati.** Chiave `dt-intro-seen`, quattro valori: assente, `"1"` (`INTRO_FILM`, scritto all'armamento del film), `"c"` (`INTRO_SHORT`), `"q"` (`INTRO_QUIET`, fixture e2e).

| # | Caso | Chiave prima | Rotta | Esito | Chiave dopo |
|---|---|---|---|---|---|
| 1 | prima entrata | assente | / | film intero con sagoma | `"1"` |
| 2 | prima entrata | assente | interna | corta senza sagoma | `"c"` |
| 3 | ricarica o nuova entrata | `"1"` | / | corta con sagoma | `"1"` |
| 4 | prima volta in home dopo una corta | `"c"` | / | film intero | `"1"` |
| 5 | entrata successiva | `"1"` o `"c"` | interna | corta senza sagoma | invariata |
| 6 | navigazione client | qualsiasi | qualsiasi | niente | invariata |
| 7 | back/forward | qualsiasi | qualsiasi | niente | invariata |
| 8 | ancora nell'URL | qualsiasi | qualsiasi | niente | `"1"` solo su «/» |
| 9 | reduced-motion | qualsiasi | qualsiasi | niente | invariata |
| 10 | scheda nascosta o prerender | qualsiasi | qualsiasi | niente, la sessione non si consuma | invariata |
| 11 | ricarica a più di 50vh dalla cima | qualsiasi | qualsiasi | niente | invariata |
| 12 | `/case/*` | assente | /case/* | niente, nessun sipario (A26) | invariata |
| 13 | `/case/*` | presente | /case/* | niente | invariata |
| 14 | senza `@property` o `mask-composite` | presente | qualsiasi | niente corta | invariata |
| 15 | `?intro` | tolta | / o interna | come 1 o 2 | come 1 o 2 |

Le righe 7, 10 e 11 cambiano anche il film della home di oggi (`Preloader.tsx:759-762`, `:773-775`): decisione di lavoro D31.

**Boot script** (`layout.tsx:102`), costanti interpolate:

```js
var gate=m&&!deep&&vis&&!caso&&k!=="${INTRO_QUIET}"&&nav!=="back_forward";
var pre=gate&&home&&k!=="${INTRO_FILM}"; // A26: su /case/* nessun sipario
var short=gate&&!pre&&cssOk&&!(ly>innerHeight*${RELOAD_KEEP_Y});
if(m){var v=pre?"intro":short?"short":"";h.setAttribute("data-hero-rest",v);h.setAttribute("data-hero-intro",v)}
```
Il resto del blocco segue `lane-globali.md` §4.3 senza `data-dt-paint`.

**La corta:** porta 0→1,10 s `cubic-bezier(0.66, 0, 0.22, 1)`; tuffo 0,88→2,38 s `cubic-bezier(0.6, 0, 0, 1)`, `--arch-k` 0,972 invariato (0,88/1,10 = 0,8); sagoma su «/» `dt-pre-in-fade 0.3s`; handoff `INTRO_EVENT` a 0,88 s; autohide 2,48 s; failsafe 2,98 s. Salta `[data-pre-content]` (badge sul disco, lockup, didascalie, linea di carica, payoff).

**Pannello della corta su avorio profondo** (correzione bloccante 2 di globali): `html[data-preloader^="short"] .dt-preloader [data-pre-panel] { background-color: var(--color-cream-deep); }` e `html[data-preloader^="short"] .dt-pre-fondo { display: none; }`. L'espresso resta solo nel film intero della home; `DESIGN.md:582` non si riscrive; la domanda aperta 7 resta com'è.

**Costanti** (`intro-constants.ts`): `INTRO_FILM`, `INTRO_SHORT`, `INTRO_QUIET`, `LAST_Y_KEY`, `RELOAD_KEEP_Y = 0.5`, `SHORT_T`, `SHORT_MS = 2380`, `PRE_SHORT_AUTOHIDE_MS = 2480`, `PRE_SHORT_FAILSAFE_MS = 2980`, `HERO_REST_SHORT_MS = 1080`.

**CSS** dopo `globals.css:1077`: `[data-pre-content]` spento nella corta; sagoma nella corta di «/»; sagoma spenta in `short-page`; delay `0s, 0.88s, 2.48s`; reti `dt-rest-failsafe` a 1,08 s per `data-hero-rest="short"` e per le lettere dell'hero.

**Skip:** nella corta niente skip (la finestra utile è 0,88 s e lo skip farebbe scattare l'arco); restano le chiusure per scheda nascosta e reduced-motion. Il film intero tiene il suo skip.

**Linea di carica del film:** 17 punti su ancoraggi e punti di errore massimo (`lane-globali.md` §4.7).

**Test:** `intro-clocks.test.ts` secondo `lane-globali.md` §4.10 (failsafe, stati, `gate` con `back_forward`, `/case/`, `visibilityState`, `prerendering`; `0,45 ≤ SHORT_MS / INTRO_MS ≤ 0,55`; reti `dt-rest-failsafe` da quattro a sei; pannello `^="short"` con `--color-cream-deep`; nessun `data-preloader` su `/case/*`, A26); `mobile-motion.spec.ts:386` film solo su «/» e /acquista come corta; `:804-815`, `:1027-1093`, `:1142-1168` ribaltate come in §4.10; `home.spec.ts:40-49`; fixture `goto` a `"q"` (`helpers.ts:120-130`); nuovi: back senza sipario, `/?intro`, ricarica a 2 schermi senza corta, colore di sfondo del pannello della corta su /acquista diverso da rgb(28, 21, 18); `scripts/probe-intro-reload.mjs` con LCP e CLS alla ricarica (/, /vendi, /contatti; 390 CPU ×4 Slow 4G e 1440).

---

## 7. Media

### 7.1 Fatti misurati (`lane-homeC.md` §8.1)

- Master `C:\Users\alber\Downloads\Tradate Via Cima rossa.mov`: H.264 3840×2160, 25 fps, 3.639 fotogrammi. Tagli di scena ai fotogrammi 228, 315, 460, 600, 731, 809, 889, 1005, 1056.
- `-ss` davanti a `-i` non è preciso su questo file: tutti i comandi tagliano per indice di fotogramma.
- Nessun loop si raccorda da solo (SSIM primo/ultimo: drone 0,170, uliveto 0,128, acqua 0,468): serve la dissolvenza. Sul drone il raccordo arriva al 94 % del passo normale.
- Il fotogramma 1.130 (45,2 s) mostra una donna sul lettino: `media-nuovi.md:53` sbaglia. Senza persone: 770, 850, 1.185, 2.115 (84,6 s, sala).
- Le cinque foto (5977×3985) portano nei metadati `Artist: davide salerno` e l'e-mail del fotografo: serve la licenza e i metadati non si pubblicano.
- `hero-aerial.jpg` è la stessa villa dello stesso volo del loop del Congedo.

### 7.2 Catena

Mezzanino lossless 1920×1080 già tagliato, senza logo (`crop=iw*0.90:ih*0.90:iw*0.10:ih*0.10`) e raccordato; tutte le codifiche partono da lì. Comandi completi in `lane-homeC.md` §8.2-8.5 (Git Bash, `WORK` fuori dal repo):

```bash
loop_mezz congedo-drone 0   227 25   # 202 fotogrammi, 8,08 s, dissolvenza 1,0 s
loop_mezz acqua         890 1004 20  # 94 fotogrammi, 3,76 s, dissolvenza 0,8 s
enc congedo-drone   # 1080 e 720, MP4 (x264 CRF 23/24, maxrate 6M/3M, faststart, -map_metadata -1, -an) e WebM (VP9 CRF 34/36)
enc acqua           # solo 1080; obiettivo ≤ 2,5 MB per formato
check congedo-drone; check acqua   # solo video, moov prima di mdat, raccordo ≥ 0,9 × passo, nessuna lettera del logo, 6 s di giro guardati due volte
still villa-salotto-ombrellone 770; still villa-facciata-lettini 850; still villa-vetrata-lanterne 1185
still villa-sala-tour 2115; still territorio-quartiere 1950   # da guardare a piena risoluzione prima di usarli
rm "$OUT/domus-hero.mp4"
```

Foto e fermi con `node scripts/media/villa-foto.mjs` (sharp): `rotate()`, 2560 px di lato lungo, JPEG mozjpeg q82, nessun metadato. Poster 1920×1080 q80. Dopo ogni sostituzione: server fermo e `rm -rf .next`.

Il `-crf 26-27` e i nomi `acqua-piscina.*` di homeB non entrano: vale la catena per indice di fotogramma.

### 7.3 File e nomi, una tabella sola

| Sorgente | File nel sito |
|---|---|
| `_DSC2014.jpg` | `public/images/reali/villa-portico-tenda.jpg` |
| `_DSC2016.jpg` | `villa-piscina-facciata.jpg` |
| `_DSC2022.jpg` | `villa-fronte-acqua.jpg` (solo finestra di Open Domus in home) |
| `_DSC2024.jpg` | `villa-angolo-piscina.jpg` |
| `_DSC2025.jpg` | `villa-lettini.jpg` |
| fotogrammi 770, 850, 1.185, 2.115, 1.950, 660 | `villa-salotto-ombrellone.jpg`, `villa-facciata-lettini.jpg`, `villa-vetrata-lanterne.jpg`, `villa-sala-tour.jpg`, `territorio-quartiere.jpg`, `villa-uliveto.jpg` (da guardare) |
| drone 0-227 | `public/media/congedo-drone-{1080,720}.{mp4,webm}`, `congedo-drone-poster.jpg` |
| acqua 890-1004 | `public/media/acqua-1080.{mp4,webm}`, `acqua-poster.jpg` |

`_DSC2014 (1).jpg` è un doppione e non si converte. `media.ts`: nuovo `ambient = { congedo, acqua }`; `heroCinematic.mp4` e `.webm` puntano a `congedo-drone-1080.*` con `enabled: false` (C21).

### 7.4 Allocazione

**Home** (nessun file due volte):

| Cap. | Media dopo |
|---|---|
| 1 Hero | `hero-raffaela.jpg` (invariato: patto della porta) |
| 2 Posizionamento | `consulenza.jpg` |
| 4 HorizonStory | `territorio-quartiere.jpg` al posto di `hero-aerial.jpg` (A24) |
| 5 StarReviews | `premio-team.jpg` |
| 6 Voci | copertine YouTube |
| 7 Paths | `raffaela-specchio-profilo.jpg`, `villa-pool.jpg` (altra casa) |
| 8 Method | `raffaela-ritratto.jpg`, `video-villa-mozart.jpg`, `handshake.jpg` |
| 9 OpenDomus | `villa-fronte-acqua.jpg` (finestra), `open-domus-teresa.jpg` |
| 11 Services | `villa-sala-tour.jpg` (riga 1), `villa-tramonto.jpg`, `rendering_01` |
| 12 CostiChiari | loop `acqua-*` |
| 13 FeaturedTestimonial | `recensione-clienti.jpg` |
| 15 Team | `raffaela-founder.jpg`, `team-red.jpg`, `team-group.jpg` |
| 16 Contact | `raffaela-keys.jpg` |
| 17 Congedo | loop `congedo-drone-*` |

La villa si riconosce due volte dall'esterno (finestra, drone), una volta dentro (sala), più la superficie dell'acqua.

**Bande di PageHero** (una foto della villa per pagina; `_DSC2022` solo in home, correzione bloccante 1 di globali):

| Rotta | Oggi | Dopo | objectPosition |
|---|---|---|---|
| /vendi | `premium_02` (`VendiContent.tsx:912`) | `villa-piscina-facciata.jpg` | 50% 55% |
| /acquista | `hero_04` (`AcquistaContent.tsx:527`) | `villa-lettini.jpg` | 50% 50% |
| /open-domus | `premium_05` (`OpenDomusPageContent.tsx:726`) | `villa-portico-tenda.jpg` | 50% 60% |
| /servizi | `premium_03` (`ServiziContent.tsx:228`) | `villa-angolo-piscina.jpg` | 50% 60% |
| /metodo | `hero_01` (`MetodoContent.tsx:198`) | `villa-vetrata-lanterne.jpg` | da misurare |
| /recensioni | `premium_01` (`RecensioniContent.tsx:105`) | `villa-salotto-ombrellone.jpg` | da misurare |
| /privacy | `hero_01` (`PrivacyContent.tsx:412`) | `villa-facciata-lettini.jpg` | da misurare |
| /cookie | `hero_01` (`CookieContent.tsx:418`) | `villa-uliveto.jpg` se passa il controllo, altrimenti invariato | da misurare |
| /chi-siamo | `hero_01` | invariato, serve uno scatto della sede o del team ≥ 2560 px | |
| /domande-frequenti, /lavora-con-noi | `consulenza.jpg` | invariato | |
| /case/[slug] | nessuna PageHero | nessun cambio | |

Su /servizi la villa compare due volte con due scatti diversi (banda e sala in Services): la regola del sito vieta la stessa foto, non la stessa casa; dichiarato. `sizes` di §5.1 (non `100vw` fisso). La calligrafia sulle foto della villa legge meno nel terzo basso (misura in `lane-globali.md` §1.9): se una parola non si legge a occhio, lì `lg:pb-[5.5vw]`.

`media-file.test.ts`: nessun `exif`, `xmp`, `iptc` in `villa-*.jpg` e `*-poster.jpg`; nessun nome con «cima» o «tradate-via»; ogni percorso di `media.ts` esiste; `alt` non vuoto.

### 7.5 Alt text (italiano; le altre lingue nei `copy`)

| File | alt |
|---|---|
| `villa-fronte-acqua.jpg` | Facciata di una villa contemporanea vista dal bordo della piscina, con l'acqua in primo piano |
| `villa-piscina-facciata.jpg` | Villa contemporanea con rivestimento color rame, piscina e lettini bianchi, alberi alti sulla destra |
| `villa-portico-tenda.jpg` | Portico con tenda da sole aperta e poltrone da esterno, una statua scura in primo piano e la piscina sullo sfondo |
| `villa-angolo-piscina.jpg` | Angolo della piscina con la facciata della villa a sinistra e una siepe alta con alberi a destra |
| `villa-lettini.jpg` | Due lettini bianchi sul bordo della piscina, dietro la villa con la tenda da sole |
| `villa-vetrata-lanterne.jpg` | Vetrata del soggiorno aperta sul portico, con due lanterne bianche sul muretto in pietra |
| `villa-salotto-ombrellone.jpg` | Divani bianchi da esterno sotto un ombrellone, fra un muro in pietra e la siepe |
| `villa-facciata-lettini.jpg` | Facciata della villa con il portico, i lettini bianchi e la piscina in primo piano |
| `villa-sala-tour.jpg` | Soggiorno con tavolo, sedie gialle, lampada ad arco e libreria (l'alt di oggi, «Salone valorizzato dall'home staging», `Services.tsx:40`, resta solo se la cliente conferma l'allestimento) |
| `territorio-quartiere.jpg` | da scrivere dopo averlo guardato: descrive quel che si vede |
| poster e `<video>` | `alt=""` e `aria-hidden` |

### 7.6 Note per `docs/da-chiedere-alla-cliente.md`

Testi completi in `lane-homeC.md` §8.10, con due aggiunte:
- **2.2** (foto aerea): il video tour è di Domus Tua; resta l'autorizzazione del proprietario.
- **6.2** (clip di chiusura): conferma scritta su chi l'ha girata.
- **6.5** chiusa il 13 settembre: il logo si toglie col ritaglio del 10 %.
- **2.13 nuovo** (licenza delle foto di Davide Salerno, ritagli e animazioni ammessi, citazione dell'autore, metadati).
- **2.14 nuovo**: lo scatto originale non compresso di `hero-raffaela.jpg`, senza il segno chiaro in basso a destra.
- **2.15 nuovo**: uno scatto della sede o del team per /chi-siamo, orizzontale, ≥ 2560 px.
- **Domanda a voce 24** (disco carta): aggiungere che nella corta il disco non c'è.
- **Domande a voce 27 e 28:** §12.2.

---

## 8. Cosa resta escluso

| Direttiva | Escluso | Dove si vede nel design |
|---|---|---|
| C01 curve e card | raggi, archi, testo su cerchio, card; unico arco la porta del preloader; `clip.ts` rifiuta `round`, `circle(`, `ellipse(`, `path(`, `url(` | tende rettangolari, cartolina `inset`, parallelogramma di Voci |
| C01 transizioni di pagina | nessuna; Barba di Era fuori (CAT §15, ERA:150-219) | navigazione client senza sipario |
| C12 fiori, ornamenti, texture | fiori di Era (CAT §6a, §6b, §6c, §12) e selettori morti di `HorizonScroller` | righe del D.O.C. sono struttura (D26) |
| C17, A11 nero | superfici e testi scuri, prugna; la corta su avorio profondo | l'espresso resta solo nel film intero (domanda 7) |
| C14 veli, blur | nessun velo, blur, ombra di scatola; transitions.dev senza `--blur-*` e senza `filter` | punti di lettere su foto: i quattro di `DESIGN.md:583` più le tacche avorio del segno |
| C04 testo < 16 px | nessun testo nuovo sotto 16 px | la corta toglie didascalie e payoff piccoli |
| Oro, blu, Inter | oro solo sulle stelle; nessun blu d'interfaccia; nessuna Inter | |
| C19, C23 logo | nessun logo ridisegnato, ricolorato, morphato o su disco bianco | T1 tinge solo le tacche |
| Persone reali | nessuna distorsione; zoom e traslazioni uniformi; nessun fermo dai tratti con persone | origine 50 % 75 % da guardare sui volti di `consulenza.jpg` |
| Pin di GSAP | nessun `pin`, `pinSpacing`, `anticipatePin` | `no-pin.test.ts` |
| Antenati di sticky e fixed | nessun transform o ritaglio | scala 1,84 su un figlio dello schermo; zona delle tende absolute |
| Telefono | nessuno scroll-hijack; corridoi solo con `MQ.corridor` | equivalenti non sticky capitolo per capitolo |
| Reduced-motion, no-JS | pagina completa e ferma; testo sempre nell'HTML | nessun `data-hero-intro` |
| /case/[slug] | nessun cambio di movimento | `MotionFreeze`, `case-guard.test.ts` |
| API, `lib/realsmart`, form lead, i18n, metadata, JSON-LD, Trustindex | non si toccano; il form di Contact è avvolto, non cambiato; `window.open` sincrono intatto; ogni split si rifà al cambio lingua | `[data-lag-col]` |
| Scala di Era sulle copertine rifilate | nessuna scala sopra 1,43 | Voci senza scala 1,5 |
| Parallasse del §7 di Era, drift ±15 % di `img` | non portata in Services (D27) | |
| Snap di Era (C2), scrollbar trascinabile, bottone magnetico, marquee di nuvole | fuori da A18-A20 e da C03 | |

---

## 9. Accessibilità, prestazioni, test

### 9.1 Unit (`npm test`)

| File | Pretende |
|---|---|
| `motion-tokens.test.ts` | `--ease-dt-*` = cifre delle CustomEase `dt*`; durate uguali fra CSS e GSAP; nessuna definizione di `--ease-in`, `--ease-out`, `--ease-in-out`; nessun `--blur-`, `*-blur:`, `blur\(`, `backdrop-filter` in `globals.css` e `app/**/*.tsx`; token transitions.dev solo col prefisso `--td-`; CustomEase una per riga |
| `text-roles.test.ts` | `ROLES` di §2.2; `staggerEach(0.05, 25, 1.2) === 0.05`; `groupDelay` per ruolo con tetto 5; declassamento `ctn` → `still` con link, bottoni, summary, campi |
| `reveal-engine.test.ts` | matrice di `decide()` con le due linee; manuali senza antenato → IO; rete dei manuali; `dt-reveal-failsafe` a 6 s, 3,33 s, 1,08 s; nessun `html[data-hero-intro="intro"] [data-reveal]`; esclusione di `[data-motion-freeze]`; nessun `will-change` su `.reveal` |
| `chapters.test.ts` | regole di §3.1 sulle 17 voci, distanze calcolate con `gsap.parseEase`; `<ClipMedia` solo in `Method.tsx`, `<Hairline` solo in `DomusDocProtocol.tsx` |
| `clip.test.ts`, `no-pin.test.ts` | forme dritte; nessun pin (con `soloCodice`) |
| `kern-table.test.ts` | quattro chiavi; valori entro ±0,2 em |
| `case-guard.test.ts` | §5.4 |
| `hero-dive.test.ts`, `still-trim.test.ts`, `congedo-cartolina.test.ts`, `media-file.test.ts`, `data-bg.test.ts`, `mark-orario.test.ts`, `horizon-flowers.test.ts` | §3.2, §3.14, §3.18, §7.4, §6.1, §3.5 |
| `intro-clocks.test.ts` | aggiornato solo dal commit del preloader (§6.2); il patto della porta invariato |
| `moduli-media.test.ts`, `logo-colore.test.ts` | invariati; CSS nuova dopo `globals.css:436` |

### 9.2 E2E (`playwright.site.config.ts`, build di produzione, motion ok salvo dove forzato)

- `text-motion.spec.ts`: (1) ingresso in fondo alla home a 1440 e 390 entro 3,5 s; (2) **uscita visibile:** con il bordo alto del titolo fra 85 % e 100 % di `innerHeight`, i caratteri scendono sotto opacity 0,1 entro 1,3 s; (3) nulla dall'alto; (4) ancora `/#contatti`; (5) **nessun lampo:** su /vendi, /contatti, /case-vendute, /valutazione e /, a ogni frame da DOMContentLoaded, il **prodotto** delle opacità del primo `[data-c]` e di tutti gli antenati fino a `#main` non passa mai da ≥ 0,9 a ≤ 0,1; varianti senza sipario, col sipario, con cookie `dt_locale=de` e `fr` al primo caricamento; (6) **LCP** contro la base di §2.5, senza `setConsent`, soglia base + 100 ms; (7) cambio lingua su /metodo; (8) budget nodi; (9) token emessi.
- `corridors.spec.ts`: lista dei sei a 1440; zero a 390 e con reduce; uno su /vendi; testi dello schermo dentro lo schermo (bordo basso dell'ultimo discendente testuale ≤ bordo basso dello schermo) a 1024×768 e 1440×900 in it e de; antenati senza transform e senza overflow che crei contenitori; a 1440×600 e 390×844 i testi di Open Domus e del Congedo arrivano a 1; ricarica a metà `#servizi` ±2 px.
- `hero-dive.spec.ts`, `page-hero-dive.spec.ts`, `segno.spec.ts`, `ui-transitions.spec.ts`, `ambient-video.spec.ts` (`paused === false` e `currentTime` crescente su due campioni ravvicinati; nessuna richiesta video a 390 e con reduce).
- `home.spec.ts`: un test per capitolo (§3.2-3.18).
- `motion.spec.ts` (reduce): nessun `[data-corridor][data-on]`, nessun `[data-reveal-armed]`, `[data-c]` a 1 e `none`, `clip-path` none su righe, tendine, acqua, cartolina; footer `none`.
- `a11y.spec.ts`: nuovo describe con `reducedMotion: "no-preference"` su `/` e `/metodo`, passata a gradini, attesa 3,5 s, `a11yViolations` = [].
- Traboccamento: la rete di `mobile-motion.spec.ts:27-55` gira anche con `dt_locale=de` e `fr` su `/`, `/vendi`, `/metodo`; `home.spec.ts:219-227` verde.
- `pages.spec.ts`: guardia di /case/[slug].
- Viewport fuori dai progetti (1024, 1280, 1920, 1440×600): `page.setViewportSize` dentro il test. Il progetto mobile-390 è 390×664.

### 9.3 Misure prima del merge

- LCP e CLS: base di §2.5; poi a 390 CPU ×4 Slow 4G e 1440 senza freno, HEAD contro ramo, 5 giri, soglie: LCP mediano ≤ base + 100 ms (≤ 2,5 s a 390 Slow 4G), CLS 0. Viewport per il CLS: 1440×900, 1920×1080, 2560×1440, iPad Pro 1024×1366.
- Tempo al primo testo leggibile su /vendi e /contatti a CPU ×4 Slow 4G, prima e dopo.
- Livelli composti e long task in una passata della home a 1440, CPU ×4; paint della cartolina < 4 ms; memoria GPU dello strato nitido delle PageHero.
- Nodi `[data-c]` dopo una passata intera.
- Controllo a occhio: crenatura del Pinyon e dei maiuscoli nelle 5 lingue a 768, 1024, 1440; «trova nella pagina» su tre browser; pellicole prima e dopo di hero, manifesto e d1 lungo per Alberto.

Ogni misura su `next start`, mai su Turbopack dev (serve `globals.css` con un'edizione di ritardo).

---

## 10. Documenti da aggiornare

Prima di toccarli: `git fetch` e confronto con `origin/claude/rivista-bianca` (Alberto li aggiorna dal portatile).

- **Spec del 10 settembre:** §11 come in §1 di questa bozza; §3.5 (spec:188-193) «tre gesti e basta» con il rimando ad A18-A20; §4 (4.15 a spec:213, Congedo con GSAP); §5 PageHero col tuffo; §6 preloader con la macchina a stati.
- **`DESIGN.md`:** `:310`, `:320`, `:573`, `:587` (i sei corridoi e il tuffo, A18-A20); `:345` (film e corta, avorio profondo); `:393` (primo schermo col tuffo, firma nel wrapper); `:394` (testa delle pagine interne); `:397` e `:499` (eccezione di corsa per la scala dell'hero e delle PageHero, D24, D33); `:400-401` (segno fisso da 1024, `MQ.corridor`); `:405` (teste che si ingrandiscono, senza velo); `:488`, `:529` (monogramma M1, T1); `:490` (0,25 s), `:491` (menu che si apre); `:496` (cellula: ruoli e tempi di Era); `:503` (sizes del poster); `:508-509` (Parallax tolta da Posizionamento, Paths, Method, Services, Team intro, PageHero); `:513-516` (1,30 e overscan); `:519` (Voci col parallelogramma); `:538` (stelle invariate, rotaia 0,7); `:542-557` (preloader); `:559-560` (video d'ambiente: acqua e cartolina, niente scala 1,14); `:571` (quarto formato 100vw×100svh della finestra); `:583` (tacche avorio del segno); `:591` (repertorio: resta /chi-siamo).
- **`PRODUCT.md`:** `:35` (primitive nuove); `:127-141` (via «tre gesti», «TRE nastri», «nessun'altra sezione pinnata»; preloader film e corta; «Alberto, 13 set.; da mostrare alla cliente»); `:153-156` (segno fisso); `:166-171` (repertorio sostituito nelle bande); `:193`.
- **`.impeccable/design.json`:** `:358`, `:381-383` (parallax), `:387`, `:392`, `:401-403` (rotating-mark), `:406-408` (preloader), `:545`, `:550`, `:613`, `:622`, `:627`, `:628`; voci nuove `page-hero-dive`, `segno`, `preloader-short`, `corridor`, `chapters`.
- **`docs/da-chiedere-alla-cliente.md`:** §7.6 e §12.2.
- **`docs/hero-video.md`:** banner coi file nuovi, la catena di §7.2 e le misure.
- **Commento di contratto in `app/page.tsx:60-73`**, da «La tecnica dei movimenti che restano» in poi:

> La tecnica dei movimenti viene dall'altro riferimento, era-residence.com (dossier reverse-engineering/era-residence), senza le sue cupole, i suoi fiori e le sue transizioni di pagina. Dal 13 settembre Alberto ha scelto la coreografia piena (A18-A20 in spec §11, da mostrare alla cliente perché supera C03): ogni capitolo ha un gesto suo legato allo scroll, con entrate e uscite speculari, e due capitoli non condividono ease, tempo o innesco (app/lib/motion/chapters.ts). Sei corridoi da 1024 px e 640 px d'altezza con motion ok, tutti position: sticky su un corridoio e nessuno col pin di GSAP: il tuffo dell'hero, «Perché Domus Tua», le cinque stelle, la finestra di Open Domus, la rotaia del team e la cartolina del congedo. Sotto quella soglia e con reduced-motion nessun corridoio e la pagina completa. A scroll 0 il primo schermo è quello descritto sopra (patto della porta). Il monogramma resta a schermo e sopra le foto le sue tacche virano; il logo non cambia colore. Il film intero suona alla prima apertura della home, la porta corta su avorio a ogni altro caricamento completo. Nessun cambio di tono fra i capitoli, perché il fondo è uno.

- **Commenti del codice:** `gsap.ts:3-25`, `:111-121`; `Reveal.tsx:14-17`, `:31`; `Header.tsx:199-201`, `:210-220`, `:264-268`; `RotatingMark.tsx:3-15`; `MarkBadge.tsx:67-76`; `PageHero.tsx:20-29`, `:81-82`, `:106-121`; `Parallax.tsx:33-36`; `Congedo.tsx:9-20`, `:87-98`, `:110-114`; `Paths.tsx:8-9`; `Method.tsx:3-7`; `OpenDomus.tsx:154-156`; `DomusDocProtocol.tsx:234-235`; `CostiChiari.tsx:23-29`; `Services.tsx:285`; `StarReviews.tsx:35-37`, `:402-408`, `:640-642`; `HorizonScroller.tsx:28-30`, `:97-99`, `:175-185`, `:362-369`; `layout.tsx:19-21`, `:76-92`, `:243-253`; `intro-constants.ts:20`; `Preloader.tsx:3-4`, `:52`; `motion.spec.ts:108-117`. Ogni commento dice chi ha chiesto cosa (A18-A20 di Alberto) e com'è fatto oggi.
- **Memoria:** `domus-coreografia-era.md` è già indicizzata in `MEMORY.md` (13 settembre).

---

## 11. Ordine di lavoro

Ogni commit: `tsc`, lint, `npm test`, la parte di e2e che tocca sul build di produzione. Dopo i media: server fermo e `rm -rf .next`.

1. **Registro:** spec §11 (A18-A26 e l'approvazione, C21-C23, D16-D35, domande 12-14; la 15 è chiusa da A26), stati di C03, C05, C06.
2. **Test sul comportamento di oggi:** `text-motion` 1-3 contro TextLines; `scripts/probe-lcp-base.mjs` con i valori di §2.5.
3. **Lessico:** `mq.ts`, `durDt`, token CSS e `--td-`, `text-roles.ts`, `motion-tokens.test.ts`, `text-roles.test.ts`.
4. **Motore:** `reveal-engine.ts`, `RevealGroup`, `Reveal` riscritto, CSS di `ctn` e `still`, `MotionFreeze`, `case-guard.test.ts`, `reveal-engine.test.ts`.
5. **Titoli:** `SplitChars`, `kern-table`, `SplitTitle`, `ScriptWord`; migrazione dei 32 TextLines e dei titoli semplici; TextLines alias, poi via.
6. **Lead e H1:** `Lead`, `fold.ts`, regola dello 0,02, lead intero sulle tre pagine senza foto; test 5 e 6.
7. **Corridoi:** `useCorridor`, CSS prima del paint, `chapters.ts` con le 17 voci, `chapters.test.ts`, `no-pin.test.ts`, `clip.ts`, ripristino al capitolo, `MQ.corridor` sui tre nastri; `corridors.spec.ts`.
8. **Hero e Posizionamento** (A22, A23).
9. **Ricerca e Voci.**
10. **HorizonStory ripulito e titolo delle stelle a cue.**
11. **Paths e Method** (con /metodo).
12. **Media:** `villa-foto.mjs`, mezzanini, codifiche, controlli, `media.ts`, `media-file.test.ts` (A24; pubblicazione dopo la licenza 2.13).
13. **Finestra di Open Domus.**
14. **D.O.C. e Services.**
15. **`useAmbientVideo`, Costi chiari con l'acqua, gate del Congedo migrato.**
16. **FeaturedTestimonial, Social (A25), Team, Contact.**
17. **Cartolina del Congedo e footer.**
18. **Tuffo delle 11 PageHero** e bande nuove.
19. **Preloader corto e macchina a stati;** `intro-clocks.test.ts` rosso prima, poi verde (A26).
20. **Monogramma** M1/T1, rilevatore, `data-bg`, `segno.spec.ts` (A21).
21. **Strato transitions.dev** e tabella refine; `ui-transitions.spec.ts`.
22. **Chiusura:** axe con motion ok, traboccamento in de e fr, misure di §9.3, documenti di §10, domande 27 e 28 alla cliente.

---

## 12. Domande

### 12.1 Domande di forma per Alberto

**Risposte del 13 settembre, tutte sull'opzione raccomandata:** 1 (a) → A21 · 2 (a) → A22 · 3 (a) → A23 · 4 (a) → A25 · 5 (a) → A24 · 6 (a) → A26. Le domande restano sotto come storia della scelta.

1. **Il monogramma sempre visibile.**
   - (a) **Raccomandata:** da 1024 px il cuore si stacca dalla testata e resta nel margine a 4vw; sopra le foto le tacche dell'anello diventano avorio, il monogramma resta grigio e rosso. Sotto 1024 basta il logo nella testata sticky.
   - (b) Come (a), più il badge rotante accanto al logo anche sotto 1024.
   - (c) Compare nel margine solo da 1280, a tempo, e sopra le foto sparisce.
2. **Il flip delle lettere.**
   - (a) **Raccomandata:** piatto come Era, la lettera gira di taglio; la firma «Raffaela Rizza» entra con la rotazione dell'accento di Era.
   - (b) In rilievo con una prospettiva di 800 px, la stessa del sipario del preloader.
   - (c) Piatto sui titoli; la firma entra come oggi, da 6vw senza rotazione.
3. **La foto dell'hero nel tuffo.**
   - (a) **Raccomandata:** la foto sale fino all'80 % e il segno chiaro in basso a destra resta fuori campo; la scala 2 va sotto la risoluzione del file solo durante la corsa; chiediamo alla cliente lo scatto originale.
   - (b) Il tuffo parte solo quando arriva lo scatto originale; fino ad allora l'hero resta fermo.
   - (c) Salita piena di Era con scala massima 1,6.
4. **Seguici.**
   - (a) **Raccomandata:** il blocco del titolo si congeda uscendo, cresce del 12 % e sfuma.
   - (b) Il titolo si allarga fino a riempire la colonna mentre la riga passa.
5. **La villa in home.**
   - (a) **Raccomandata:** il pannello del territorio passa al fermo del drone largo sul quartiere; Services riga 1 prende il fotogramma 4K della sala del tour.
   - (b) Territorio con la foto aerea di oggi (stesso volo del Congedo) e Services col render di oggi.
   - (c) Territorio col fermo del quartiere; Services col render finché arrivano scatti veri di home staging.
6. **/case/[slug] e il film d'apertura.**
   - (a) **Raccomandata:** nessun sipario sulle schede immobile, né film né porta corta (pagina di conversione, niente sagoma di Raffaela sopra una casa in vendita).
   - (b) Come oggi: film intero alla prima atterrata della sessione, mai la corta.

### 12.2 La domanda per la cliente (`docs/da-chiedere-alla-cliente.md`, domanda a voce 27)

> 27. **Più movimento di quello che avevate chiesto: va bene?** Nella chiamata del 10 settembre avete chiesto di «eliminare tante animazioni e transizioni». Il 13 settembre Alberto ha scelto la strada opposta, col sito di Era Residence come modello. Ogni capitolo della home si muove con lo scroll in un modo suo. In sei punti della home, e in apertura di ogni pagina interna, la pagina si ferma mentre scorrete e la foto si apre fino a riempire lo schermo. I titoli entrano lettera per lettera. Il simbolo del logo resta sempre visibile a sinistra, e sopra le foto il suo cerchio di tacche diventa chiaro. A ogni apertura di pagina torna per 2,4 secondi la porta dell'animazione d'apertura, su fondo chiaro; quella intera, 4,6 secondi, resta alla prima apertura della home. La home diventa lunga circa un sesto in più. Restano fuori le cose che avevate escluso: niente curve, niente fiori, niente nero nelle pagine, niente veli sulle foto. Ve lo facciamo vedere in chiamata: tenete questa versione, la riduciamo, o torniamo a poche animazioni?

Accanto, la 28:

> 28. **Le foto della villa in apertura di otto pagine.** Useremmo le foto professionali e alcuni fotogrammi del video tour della villa in apertura di Vendi, Acquista, Open Domus, Servizi, Metodo, Recensioni, Privacy e Cookie, al posto delle immagini di repertorio. Il proprietario ha autorizzato l'uso sul sito (punti 2.2 e 6.2), e la licenza del fotografo lo permette (punto 2.13)? Vi va bene che una casa sola illustri tante pagine?
