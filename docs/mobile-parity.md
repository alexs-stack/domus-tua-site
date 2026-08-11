# Parità mobile — audit di partenza (Fase 0)

> Wave "parità mobile", 2026-08-11. Questo documento è la **Fase 0**: l'inventario
> verificato contro il codice, la misura di partenza, un verdetto per ogni effetto
> chiuso fuori dal telefono, e la decisione sull'intro con il suo piano di misura.
> Nessuna riga di prodotto è stata toccata. Le sole aggiunte sono tre strumenti di
> misura in `scripts/` (§7).
>
> **Il mandato è parità d'intento, non parità d'implementazione.** Ogni momento di
> firma deve arrivare su uno schermo da 390px, detto nella lingua gestuale che quello
> schermo ha davvero, a un costo che quel telefono può pagare.

---

## 0. Le tre cose da sapere prima di leggere il resto

1. **Il budget Lighthouse è già rosso oggi, prima di qualunque lavoro.** Home:
   performance 0.64, LCP 5.668 s, TBT 572 ms — contro soglie 0.90 / 2500 ms / 300 ms.
   Non è una conseguenza della wave: è il punto di partenza (§1).
2. **L'elemento LCP della home non è l'hero: è il banner cookie.** Misurato:
   `p#cookie-consent-desc`. E l'intro, montando il banner più tardi, lo peggiora
   meccanicamente. È questa la decisione che sblocca o blocca l'intro mobile (§5).
3. **Il telefono paga già l'intro che non vede.** 79.000 byte di
   `raffaela-sagoma.webp` scaricati a ogni prima visita e 119 nodi montati a
   `display:none`. Portare l'intro su mobile non aggiunge quel costo: lo mette
   finalmente a frutto (§5.1).

---

## 1. La misura di partenza

Build di produzione, `npm run lighthouse` (mobile 390×844 DPR 2.625, Slow 4G
simulato, CPU ×4, 1 run per rotta), 2026-08-11.

| Rotta | perf | a11y | SEO | best-pract. | LCP | CLS | TBT | FCP | Speed Index |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| `/` | **0,64** | 0,97 | 1,00 | 1,00 | **5.668 ms** | 0 | **572 ms** | 1.356 ms | 3.031 ms |
| `/acquista` | **0,79** | 1,00 | 1,00 | 1,00 | **5.135 ms** | 0 | 152 ms | 1.504 ms | 2.461 ms |

Asserzioni fallite oggi (8, di cui 4 di livello `error`):

- `/` → `categories:performance` 0,64 · `largest-contentful-paint` 5.668 ms · `total-blocking-time` 572 ms
- `/acquista` → `categories:performance` 0,79 · `largest-contentful-paint` 5.135 ms
- avvisi: `unused-javascript` 0 su entrambe, `uses-responsive-images` 0,5 su `/acquista`

**Elemento LCP misurato**: home = `p#cookie-consent-desc` (il paragrafo del banner
cookie); `/acquista` = `img.ken-burns` dell'hero.

### 1.1 `docs/performance.md` è disallineato, e il TBT è regredito

Quel documento registra home 80 / LCP 5,3 s / TBT 80 ms. Oggi la stessa misura dà
**64 / 5,67 s / 572 ms**. Il punteggio è sceso di 16 punti e il **TBT è sette volte
più alto**, già sopra il budget di 272 ms. È una regressione preesistente, non
attribuibile a questa wave, e va detta prima di aggiungere qualunque cosa al thread
principale.

### 1.2 Il cookie in `lighthouserc.js` non fa quello che il commento dice

`lighthouserc.js:61` manda `extraHeaders: { Cookie: "dt_consent=accepted" }` e il
commento sopra (`:59-60`) afferma che così «il preloader … lo si salta come farebbe
chi torna sul sito». Verificato in laboratorio, entrambe le affermazioni sono false:

```
— header Cookie (come Lighthouse) —
  document.cookie  = ""
  banner nel DOM   = 1        ← il banner compare comunque
  data-preloader   = false    ← e l'intro era già esclusa dalla larghezza, non dal cookie
```

Un cookie inviato come **header di richiesta** non popola `document.cookie`, e
`readConsent()` (`app/lib/consent.ts:29`) legge esattamente quello. Il banner appare
quindi in ogni misura di laboratorio ed **è l'elemento LCP della home**. Il preloader,
dal canto suo, è escluso da `sessionStorage` + larghezza, mai da un cookie.

Conseguenza pratica: il numero 5.668 ms non misura la home, misura la home *più il
banner*. Va sistemato prima di usare Lighthouse come giudice della wave (§5.4).

### 1.3 Accessibilità: 0,97 sulla home, con due audit rossi

Passa la soglia (≥0,95) ma con un solo margine. I due audit rossi:

- `color-contrast` — quattro nodi, tutti testo decorativo su crema: le filigrane
  `span.absolute` in `#metodo` e `#chi-siamo` (contrasto 1,07) e il titolo/copy di
  una card in overlay su foto (1,03 / 1,02, dove axe non può vedere la foto sotto).
- `label-content-name-mismatch` — `a.dt-starrev_award` (badge Wikicasa).

Nota di metodo: `e2e/a11y.spec.ts` gira con reduced-motion attivo e passa pulito;
Lighthouse no. Non si contraddicono — misurano due stati diversi della pagina.

### 1.4 Ergonomia touch: già sana dove conta

`scripts/mobile-ergonomics.ts` su 14 rotte × 360 / 390 / 768px:

- **Nessun traboccamento orizzontale. Su nessuna rotta, a nessuna delle tre
  larghezze.** Il test e2e richiesto dalla specifica passerà dal primo giorno, ed è
  giusto scriverlo lo stesso come rete.
- **`.tap-target` funziona**: i link che lo portano misurano `43×44` e `38×44` — il
  `::before` fa il suo lavoro, l'altezza è quella giusta e la larghezza corta è
  ininfluente su un link di testo in colonna.
- I bersagli **veri** sotto soglia, per frequenza:

  | Elemento | Misura | Occorrenze | Verdetto |
  |---|---|--:|---|
  | `<summary>` degli accordion | 350×32 (390px), 704×32 (768px) | 8–27 | **Da correggere** — 12px sotto soglia, su tutte le FAQ del sito |
  | `input` del modulo | 176×24 | 12 | **Da guardare** — 20px sotto soglia |
  | Voci dell'indice `/domande-frequenti` | 350×20 e 207×20 | 3–5 | **Da correggere** |
  | `button` dei filtri (solo 768) | 144×42 | 24 | 2px: da allineare, non urgente |
  | `a` 40×24 (skip-link) | — | 14 | **Falso positivo**: si raggiunge da tastiera, non col dito |
  | `a` 114×16 (link dentro un paragrafo) | — | 11 | **Falso positivo**: WCAG 2.5.8 esenta i link inline |

  *La prima passata di questa misura era sbagliata e va detto*: sommava `top` e
  `bottom` del `::before` invece di leggerne l'altezza, mentre la regola vera
  (`globals.css:797-803`) è `top: 50%; height: 44px; transform: translateY(-50%)`.
  Con la formula rotta, `.tap-target` risultava fuori norma quando invece è a norma.
  I numeri qui sopra vengono dalla versione corretta.
- Nessun `100vh` di layout in tutto `app/` — le due sole occorrenze
  (`Preloader.tsx:313`, `PageTransition.tsx:36`) sono geometria di maschera, non
  altezza di box. La regola «mai `100vh` su un telefono» è già rispettata.

### 1.5 Tre cose che si vedono solo misurando

`scripts/mobile-probe.ts`, 390×664, sessione calda.

**a. Il primo gesto sulla home congela la pagina per un secondo.** Non è un difetto
scoperto per caso: è voluto (`HeroCinematic.tsx:377-387`, «il primo gesto rivela e la
pagina resta ferma sull'immagine piena — richiesta cliente»). Ma va messo agli atti,
perché nessun documento lo dice e perché sfiora la legge 4 della dottrina.

```
html.lenis-stopped presente fino a ~991 ms (7/16 campioni)
campioni (ms:scrollY):  157:0*  297:0*  435:0*  574:0*  714:0*  852:0*  991:0*  1130:21  1271:60 …
```

Nota di metodo, perché la prima misura diceva il contrario: `window.scrollBy()` è
programmatico e in Chromium scorre **anche** con `overflow: hidden` sul viewport (a
impedirlo è `clip`, non `hidden`). Con un gesto vero il blocco c'è, ed è totale.

Il che conferma anche il resto della catena: `getLenis()?.stop()` mette
`lenis-stopped` su `<html>`, che `globals.css:164-166` traduce in `overflow: hidden`.
**Su un telefono `lenis.stop()` è un blocco duro del viewport**, non un no-op. È la
ragione per cui §5.3 è una questione seria e non teorica.

**b. `env(safe-area-inset-*)` vale zero, ovunque.**

```
meta viewport: width=device-width, initial-scale=1
env(safe-area-inset-bottom) = 0px · top = 0px
```

`app/layout.tsx:25-29` non dichiara `viewportFit: "cover"`. Senza, ogni
`env(safe-area-inset-*)` risolve a 0: `MobileActionBar.tsx:53`, `Assistant.tsx:437` e
`globals.css:769-773` stanno facendo aritmetica sullo zero. La regola «rispettare
`env(safe-area-inset-*)`» **non è soddisfabile** finché non si aggiunge — e
aggiungerlo sposta tutti gli elementi ancorati al fondo nello stesso momento. Va
fatto in Fase 4, insieme, non di sfuggita.

**c. 366 elementi con `will-change` diverso da `auto`** dopo una passata di scroll
sulla home. Non è un verdetto — è il numero contro cui misurare ogni layer che la
wave aggiunge.

### 1.6 Le fotografie di riferimento

- `docs/shots/baseline-390/` — pagina intera, 15 rotte (86 MB, **gitignorato**: è
  materiale di confronto locale, non un artefatto del repo).
- **Attenzione a come si leggono.** Uno screenshot `fullPage` rende gli elementi
  `sticky` una volta sola: tutti i corridoi del sito mostrano la loro altezza
  *vuota*. Alla prima lettura la home mobile sembrava avere tredici schermate di
  nulla. Non è vero — è un artefatto della cattura. Per questo esiste
  `scripts/mobile-filmstrip.ts`, che fotografa una schermata alla volta.
- Stessa correzione su un secondo falso allarme: nella pellicola i cognomi del
  roster sembravano tagliati dalla barra azioni. Misurato, non lo sono: i pannelli
  `TeamTrail` sono alti 664px e il contenuto ne occupa 433, il cognome finisce a
  quota 493. Era il passo della pellicola che cadeva a metà pannello.

### 1.7 Quanto è lunga la home su un telefono

30.997 px = **46,7 schermate** da 664px. Di queste:

| Capitolo | altezza | schermate |
|---|--:|--:|
| `.dt-dome` (HorizonStory + ReviewsWall + StarReviews) | 5.652 px | 8,5 |
| `#chi-siamo` (Team + TeamTrail) | 5.926 px | 8,9 |
| `#metodo` | 4.006 px | 6,0 |
| `#contatti` | 2.190 px | 3,3 |
| il resto | ~13.200 px | ~20 |

Due capitoli su tredici valgono **il 37% della pagina**. Sono anche i due che
perdono più coreografia. Non è una coincidenza: sono corridoi progettati per essere
attraversati con un gesto che sul telefono non esiste.

---

## 2. L'inventario, verificato riga per riga

La lista di partenza è stata controllata contro il codice da nove letture parallele
indipendenti. **Cinque righe su dodici erano sbagliate o incomplete, e mancavano
cinque voci.** Qui sotto le correzioni; i verdetti sono in §3.

### 2.1 Correzioni alla lista di partenza

| Riga | Verdetto sulla riga | Cosa dice davvero il codice |
|---|---|---|
| `TeamTrail.tsx:125` — «≥1024, nessun trail su mobile» | **SBAGLIATA** | Ha già un ramo mobile (`:130-168`): la stessa scia a stagger negativo, scrubbata per pannello. Il gate withholds il corridoio 3D, non il gesto. È uno dei due template da copiare, non una lacuna |
| `HorizontalRail.tsx:72` — «riga statica; `snapMobile`/`data-snap` dichiarati e morti» | **SBAGLIATA** | `snapMobile` è passato a `Services.tsx:339`; `data-snap` è vivo in `globals.css:2304-2308` (`scroll-snap-type: x mandatory` + `scroll-snap-align: center`). Il default mobile **è già** uno scroll orizzontale nativo con snap. Il port è fatto |
| `PageHero.tsx:76` — «nessuna ricomposizione dell'hero» | **INCOMPLETA** | Solo la deriva d'uscita è chiusa. L'ingresso (`:59`, `mm.add(MQ.motionOk)`) gira già su mobile, e `PageHero` è l'**unico** dei 12 call-site di `Parallax` che passa `mobile` |
| `FaqContent.tsx:183` — «nessuna camera, nessuna ricomposizione» | **SBAGLIATA** | Non è un gate di movimento: pilota `aria-current` sull'indice delle FAQ. Ed è a 768 mentre lo sticky è a `lg` (1024) — fra 768 e 1023 i trigger scrivono su una nav già uscita di scena; sotto 768 l'indice resta congelato sulla voce 01 per tutta la pagina |
| `HoverDistort.tsx:90` — elencato fra le lacune | **CATEGORIA SBAGLIATA** | È fine-pointer: il chunk `ogl` non viene nemmeno richiesto su mobile. Metterlo nella lista significherebbe proporre una canvas WebGL su un telefono per un'interazione che non esiste |
| `Preloader` — «non gira e non monta mai la sua timeline» | **PARZIALE** | La coreografia no. Ma il chunk si scarica, 119 nodi si montano a `display:none`, e i 79.000 byte della sagoma si scaricano lo stesso (§5.1) |

### 2.2 Le cinque voci che mancavano

| Componente | Gate | Perché conta |
|---|---|---|
| **`motion/Parallax.tsx:37/49`** | prop `mobile` con default `false` → `MQ.desktop` | **11 dei 12 call-site sono inerti sotto i 768px.** Undici tween scrubbati, puro transform, zero paint. È la leva singola più grande dell'intera wave, e non era nella lista |
| **`globals.css:346`** (`WordReveal`) | `min-width: 768px` in CSS | L'IntersectionObserver gira e mette `.is-in`; semplicemente non c'è nulla da animare. Il primitivo gemello `.reveal` non è gated: l'incoerenza è dentro la stessa famiglia |
| **`Social.tsx:133`** | `matchMedia("(min-width: 1024px)")` dentro `mm.add(MQ.motionOk)` | Stessa forma di `HorizontalRail`: sotto lg resta drag nativo, deliberatamente (commento a `:130-132`) |
| **`HeroCinematic.tsx:444`** | `matchMedia("(min-width: 768px)")` in un `useEffect` | Un **secondo** gate, indipendente da quello a `:154`: sopprime del tutto il `<video>` dell'hero. `HeroCinematic` sono tre gate, non uno |
| **`app/layout.tsx:23`** | `matchMedia("(min-width: 768px)")` nello script inline | Il gate dell'intro. Invisibile a qualunque grep di `app/components/`, e a cascata decide anche il ramo dell'hero e se Lenis nasce fermo |

Inoltre: **quattro gate vivono fuori da `gsap.matchMedia`** (`layout.tsx:23`,
`HeroCinematic.tsx:444`, `Social.tsx:133`, `FeaturedTestimonial.tsx:136`). Leggono
`.matches` una volta e buttano via la `MediaQueryList`: un tablet ruotato da 900 a
1200px non ottiene il rail finché non si ricarica, e la rotazione inversa lascia
geometrie stantie. `Header.tsx:138-143` è l'unico posto che lo fa bene, con
`addEventListener("change", …)`.

### 2.3 Quello che gira già su mobile e nessuno aveva contato

L'inventario guardava i gate. Ma il conto di un telefono si fa sul totale, e alcune
delle cose più costose non hanno alcun gate:

| Componente | Costo mobile oggi |
|---|---|
| **`ToneShift`** (`:62`, `mm.add(MQ.motionOk)`, nessun gate di larghezza) | Tre istanze in home (`page.tsx:83/91/96`), **due ScrollTrigger ciascuna** = 6 trigger, uno dei quali scrive `--tsp` a ogni frame. E la geometria degenera: `border-top-*-radius: 50% var(--ts-depth)` dà 195px di raggio orizzontale a 390px contro 143–202 di verticale — l'arco ribassato del desktop (≈3,6:1) diventa **una cupola ≈1:1**. Il filo rosso (`height: var(--ts-depth)`, fino a 202px) è più alto della sua stessa finestra (`--ts-h` ≈160px con `overflow: hidden`) |
| **`SurfaceFlow`** (nessun `matchMedia`, deliberato) | Uno ScrollTrigger `start:0 / end:"max"` con `paint()` a ogni frame, più un layer fisso a pieno viewport con due gradienti radiali. **Trappola per la wave**: la NodeList `marks` è catturata una volta sola al mount (`:83`) e mai riletta — qualunque ramo mobile che aggiunga, tolga o riordini una sezione `data-tone` dopo l'idratazione è invisibile al flusso di colore |
| **`Fioritura`** su `Team.tsx:138` | **Nessun `hidden lg:block`**, ed è in home. Tetto di 2200 particelle sotto i 640px, canvas a `min(dpr, 2)`, e `Fioritura.tsx:569` fa campionamento e costruzione a `document.fonts.ready`, fuori sia dal warmup sia dall'IntersectionObserver. Due letture indipendenti avevano concluso «su mobile non costa nulla»: valeva per i loro call-site `hidden lg:block`, non per questo |
| **`PageTransition`** | Monta **già** la stessa maschera ad arco a 4 layer del preloader su mobile (`:160-161`), animata a `:284-288` e `:421`. L'unica concessione è la durata. **Conseguenza utile: il costo per frame dell'arco su un telefono si può misurare oggi, senza scrivere una riga** |
| **`Cursor`** | Il chunk si scarica su mobile e monta quattro nodi `fixed` a `z-[120]`, per un comportamento interamente dietro `finePointer` |

E una cosa che **non** esiste da nessuna parte: nessun
`ScrollTrigger.config({ ignoreMobileResize: true })`, nessun `autoRefreshEvents`,
nessuna configurazione globale. Con `min-h-dvh` sul body e `min-h-[100dvh]`
sull'hero, ogni comparsa e scomparsa della barra URL cambia l'altezza del documento,
spara `resize` e provoca un refresh completo a metà scroll. Ogni trigger che la wave
aggiunge moltiplica il costo di quel refresh — e i tre `refreshInit` che **scrivono**
layout (`HorizonScroller:75`, `HorizontalRail:88`, `TeamTrail:188`) oggi sono
desktop-only. Un ramo mobile li metterebbe dentro quel percorso.

### 2.4 Il vocabolario ha un buco, ed è la causa di metà del disordine

`MQ` (`app/lib/motion/gsap.ts:82-86`) definisce `desktop: "(min-width: 768px)"`.
**Ma il breakpoint vero del sito è 1024**, e nove gate se lo riscrivono a mano — di
cui quattro dietro costanti private con commenti quasi identici: `RAIL_MQ`,
`HORIZON_MQ`, `WALL_MQ`, `PIN_MQ`, più stringhe inline in `Paths`, `StarReviews`,
`TeamTrail`, `HorizontalRail`, `HoverDistort`, `LiquidReveal`, `Footer`, `Social`.

Il confine `1023.98px` (non `1023px`) è già l'idioma stabilito in `LiquidReveal` e
`Footer`: va conservato.

### 2.5 Due idiomi di ramo mobile esistono già e funzionano

1. **Query accoppiate**: `LiquidReveal.tsx:49`+`:66`, `Footer.tsx:66`+`:68`.
2. **`ctx.conditions` con ramo else**: `ManifestoPin.tsx:71/84/111`,
   `TeamTrail.tsx:125/130`.

Dettaglio critico per il secondo: i componenti chiusi usano
`if (!cond.desktop || !cond.motionOk) return;`. Convertirli significa **prima**
cambiarlo in `if (!cond.motionOk) return;` — esattamente ciò che fa
`TeamTrail.tsx:127` — altrimenti il ramo mobile è irraggiungibile.

---

## 3. I verdetti

Regola Chanel applicata riga per riga: **per ogni effetto che entra, si nomina ciò
che esce.** Dove non esce niente, lo dico invece di inventare un sacrificio.

| # | Effetto | Verdetto | Cosa entra sul telefono | Cosa esce |
|---|---|---|---|---|
| 1 | `HorizonScroller` / `HorizonStory` | **TRANSLATE** | Gli stessi attributi-contratto (`data-horizon-slide`, `…-reveal="track"`, `…-stair`) su trigger **verticali**. Il sipario `clip-path inset(0 100% 0 0) → inset(0)` è indipendente dall'asse e legge identico | Lo scrub del `word-spacing` sulla cupola, che oggi gira su mobile su un arco da **21px** che nessuno può leggere. E il reveal per-carattere: righe mascherate (`TextLines`), non 68 span |
| 2 | `StarReviews` | **REPLACE** | Solo l'**accensione**: le cinque stelle si illuminano dal centro verso fuori (`stagger .015 from:"center"`, il beat 0.90 del desktop) più i due tempi dell'alone | Lo shimmer CSS, che oggi gira **all'infinito** senza IntersectionObserver e senza gate `will-change`. Diventa intermittente: è una rimozione e una batteria risparmiata |
| 3 | `ReviewsWall` | **TRANSLATE** | Uno ScrollTrigger, stagger su `[data-wall-tile]` in ordine DOM (su due colonne legge come una diagonale), `y/opacity`, `once`. Nessun runway, nessuno sticky, nessun `refresh()`, nessun `fonts.ready` | Niente esce: oggi la sezione ha **zero** movimento e l'aggiunta è un trigger solo. Esce però un difetto: `h2` ha `max-w-[16ch]` senza `mx-auto`, quindi su mobile il titolo è sfalsato ~20px a sinistra dell'asse |
| 4 | `ThreadNav` | **TRANSLATE** | Filo orizzontale sotto l'header: stessi dati, stessi trigger, `scaleX` invece di `scaleY`, `place()` scrive `left`. Sei punti di geometria, zero logica nuova | `watchSurfaceTone`, che oggi su mobile attacca listener di scroll e resize e un rAF **per un elemento che non è renderizzato** |
| 5 | `Paths` | **TRANSLATE** | La *salita*, senza il corridoio: sipario dal basso per articolo, foto `scale 1.06 → 1`, i tre punti che entrano da lati opposti — è quello a restituire la lettura «due strade», che a 390px il mirroring `justify-start`/`justify-end` perde del tutto | Lo `SplitText` sui due titoli non arriva su mobile: `TextLines` esiste già ed è ungated. Mai due split sullo stesso testo |
| 6 | `TeamTrail` | **PORT** (già fatto) + **taglio** | Nulla di nuovo sul movimento: il ramo mobile esiste ed è corretto | **Quattro schermate.** Cinque persone su sei non hanno foto (`app/lib/team.ts`), quindi cinque pannelli `min-h-[100svh]` sono un arco vuoto con due iniziali. Finché le foto non arrivano, i pannelli senza foto scendono ad altezza naturale |
| 7 | `HorizontalRail` / rail di `Social` | **NESSUN LAVORO** + un'affordance | Il port è già in produzione (drag nativo + snap). Manca solo che il telefono *sappia* che c'è altro fuori campo: indicatore di posizione pilotato dall'evento `scroll` nativo | Niente, ed è corretto così: un indicatore statico non entra nel budget di movimento. Non invento un sacrificio |
| 8 | `HoverDistort` | **KEEP OFF** | — | L'effetto *è* il puntatore. Su touch non c'è equivalente che non sia un vezzo, il chunk `ogl` non viene nemmeno richiesto, e il reveal sotto continua a suonare. Il telefono non perde niente |
| 9 | `CameraIn` (4 siti) | **TRANSLATE** | Salita piana `y 24 → 0` + opacità. Nessuno dei quattro siti tocca un candidato LCP | La *scala*. Un dolly su una colonna da 390px non legge come camera, legge come oscillazione |
| 10 | `HeroCinematic` frame-in | **KEEP OFF** — ma con un port accanto | Il frame-in resta fuori: `clip-path` per frame sul layer LCP a pieno viewport è precisamente ciò che la legge 5 vieta, e il commento a `:152-153` lo dice già. **Ma** la foto dell'hero oggi è immobile a ogni quota di scroll: entra una deriva d'uscita `yPercent`, solo transform, zero paint | I marchi d'angolo `SegnoDomusVideoFrame`, che su mobile restano accesi per tutto l'hero perché a spegnerli è il ramo desktop. Si spengono con la nuova deriva |
| 11 | `PageHero` deriva d'uscita | **PORT** | `gsap.to` scrubbato, transform + opacità, nessuno stato iniziale scritto al caricamento: neutro rispetto all'LCP. Si apre a tutte le larghezze | Niente esce, ma si **corregge** l'asimmetria: è il ramo *già attivo* su mobile (`:59`) a scrivere `opacity: 0` su `[data-ph-el]` all'idratazione — badge, subcopy e CTA lampeggiano. Il gate non c'entra |
| 12 | `FaqContent` | **REPLACE** (è un gate di orientamento, non di moto) | Il gate va a 1024 per combaciare con lo sticky; sotto, l'indice smette di dichiarare `aria-current` invece di dichiararlo sbagliato per sempre | La finta indicazione «voce 01» congelata su tutta la pagina |
| 13 | **`Parallax`** (mancava) | **PORT, selettivo** | Si accende `mobile` caso per caso, non a tappeto: dove sta su una fotografia aggiunge profondità, dove sta su un blocco di testo no | Undici tween morti. Rimozione e aggiunta coincidono |
| 14 | **`WordReveal`** (mancava) | **PORT, condizionato alla misura** | Il gate CSS scende, ma **solo dove l'elemento non è candidato LCP**: la QA del wow-layer ha già registrato che le parole `inline-block` frammentavano l'H1. Se non si riesce a renderlo sicuro, diventa KEEP OFF con la ragione scritta | Da decidere alla misura |
| 15 | **I quattro gate fuori da `mm.add`** (mancava) | **PORT strutturale** | Entrano in `mm.add`, così GSAP gestisce teardown e ricostruzione | La rottura silenziosa alla rotazione del tablet |
| 16 | **L'intro** | **TRANSLATE** | §5 | §5 |

### 3.1 Perché *non* un carosello orizzontale per HorizonStory

È l'idea ovvia e va scartata con una ragione, non con un'opinione. La scatola
reggerebbe: `screen > track > panel × 4` è già la forma di un carosello. Il
**contenuto** no:

- non esiste un layout mobile dei pannelli — ogni regola che risparmia spazio è
  `lg:` (`lg:grid`, `lg:h-[72vh]`, `lg:py-0`, `lg:gap-16`, `lg:aspect-auto`), e sotto
  `lg` ogni pannello è una colonna alta **2-3 schermate**. Un carosello di slide alte
  tre schermate non è un carosello;
- `--territory` è largo 126vw con `padding-left: 26vw`, che è pista di parallasse, non
  contenuto: con lo snap la slide 2 non si centrerebbe mai;
- `.dt-horizon_stairs { margin-right: -11vw }` serve a far cavalcare il titolo sulla
  foto nell'orizzontale; in un carosello tirerebbe l'immagine sotto il testo;
- tutta la decorazione è `hidden lg:block` — quattro angoli `Fioritura` e la polaroid.

Sarebbe un ridisegno travestito da porting. La traduzione onesta tiene la colonna e
sposta l'asse dei trigger.

### 3.2 Una nota sul capitolo recensioni

Nell'ordine attuale la home dice «recensioni» quattro volte di fila: pannello 3
(«Lo specchio del nostro lavoro»), pannello 4 («Le voci, in prima persona»),
`ReviewsWall` («Il muro delle voci»), `StarReviews` («Cinque stelle, una alla
volta»). Su desktop il movimento orizzontale li separa in quattro momenti distinti.
Su un telefono diventano quattro blocchi verticali consecutivi sullo stesso
argomento. **Questa è una questione di montaggio, non di motion**, ed è fuori dal
mandato di questa wave — ma è il motivo per cui quel tratto di home legge lungo su
un telefono, e va detto.

---

## 4. Cosa è già giusto su mobile — da non toccare

Verificato, non assunto:

- `SmoothScroll.tsx:27-33` — Lenis con `smoothWheel: true` e touch **nativo**.
  `syncTouch` non c'è e non deve arrivarci.
- `globals.css:199` — input a 16px sotto i 768 (niente zoom di focus su iOS).
- `globals.css:788` — `@media (pointer: coarse)`: `.tap-target` con bersaglio da 44px
  via `::before` (il riquadro visibile non si muove), `.tap-list` con `row-gap: 1.5rem`.
  *Portata limitata però*: `.tap-target`/`.tap-list` compaiono in tre soli componenti
  (`Footer`, `HeroCinematic`, `HorizonStory`).
- `MobileActionBar` — compare dopo `scrollY > 520`, `bottom: calc(0.75rem + env(safe-area-inset-bottom))`,
  CTA ≈46px e cerchio WhatsApp 52×52. Si spegne quando `#contatti` è nel 65% alto del
  viewport.
  *Correzione all'inventario*: i `pb-28` del footer (`Footer.tsx:181`) sono una
  utility incondizionata **senza** `env()`; la regola con `:has()` + `env()`
  (`globals.css:769-773`) è un'altra cosa, riservata al launcher della chat, che oggi
  in produzione è spento.
- `Footer.tsx:66/68` e `LiquidReveal.tsx:49/66` — due rami veri, uno per classe di
  larghezza. È il modello.
- `ManifestoPin.tsx:71` — un solo blocco di condizioni con ramo else, non due
  `mm.add`. Cascata scrubbata sotto 1024 più un secondo trigger per la sottolineatura.
- `Reveal.tsx` — IntersectionObserver + CSS, funziona a ogni larghezza, con rete di
  sicurezza a 2500 ms e stato finale forzato sotto reduced-motion e `scripting: none`.
- `Cursor.tsx`, `Magnetic.tsx`, `FeaturedTestimonial` parallasse da puntatore —
  fine-pointer. **Restano spenti.**
- `PageTransition` gira già su mobile, con durate accorciate (`:198`, `:286`, `:292`).

---

## 5. L'intro: la decisione è presa, il conto è diverso da come sembrava

La decisione del cliente non si rilitiga: **l'Arco Domus va sul telefono.** La
domanda è a che prezzo. La misura cambia la forma della domanda.

### 5.1 Il telefono paga già l'intro che non vede

Verificato in laboratorio a 390px, sessione fredda:

```
sagoma scaricata: [{"u":"raffaela-sagoma.webp","len":79000,"status":200}]
sottoalbero .dt-preloader nel DOM: {"nodi":119,"display":"none"}
```

`app/layout.tsx:23` non stampa mai `data-preloader` sotto i 768px, ma
`<PreloaderMount/>` è renderizzato incondizionatamente: il chunk dinamico (22.567
byte) si scarica, 119 nodi si montano, e `<img>` dentro un antenato `display:none`
**viene comunque scaricato dal browser**. Sono 79 KB di banda spesi a ogni prima
visita mobile per un'immagine che nessuno vedrà mai.

Portare l'intro su mobile non introduce quel costo. Lo mette a frutto. Quello che
aggiunge davvero è **tempo di thread principale** e il **trattenimento della pagina**
sotto il sipario.

### 5.2 I numeri veri della timeline (i commenti nel file sono vecchi)

| | valore reale | cosa dicono i commenti |
|---|--:|---|
| Durata timeline (con `mask-composite`) | **4,63 s** | «~5s» (`Preloader.tsx:10`), «~2,2 s» (`docs/performance.md:69`) |
| Durata timeline (fallback senza maschera) | 3,50 s | non documentata |
| `INTRO_EVENT` | t = 3,13 s | — |
| Tetto del precarico | **5,7 s** (1200 ms di corsa font + 4500 di scadenza) | «l'attesa è coperta dal sipario» (`:200-201`) |
| Failsafe script di boot | 2.500 ms | «(8s)» (`Preloader.tsx:141`) |
| Failsafe CSS `dt-pre-autohide` | 3 s + 0,5 | «Allineata al failsafe JS (2,5s)» (`globals.css:1522`) |
| Failsafe riarmato in abort | 8.000 ms | — |

Tre failsafe con tre tempi diversi, ciascuno che si dichiara allineato agli altri,
più quattro reti di sicurezza a valle a 6 s (`HeroCinematic:305`,
`CookieConsent:78`, `dt-rest-failsafe` in CSS). **Sette numeri**, non uno.

Altre due correzioni: **non c'è nessun contatore di progresso** — è una linea
verticale alta 64px e larga 1px, slegata da qualunque caricamento reale; e **non
esiste più nessuno `scale 0.75 → 1`** sull'hero, il commento a `HeroCinematic:192-194`
descrive codice che non c'è più (`:224-232` dice l'opposto).

**Il buco da 1,1 s.** Fra t=4,63 s e t≈5,7 s l'arco è già completamente aperto — la
pagina *sembra* pronta — ma `data-preloader` è ancora su `<html>`, quindi
`html{overflow:hidden}` e `lenis.stop()` sono ancora in vigore. L'utente vede una
pagina finita che non scorre. È un difetto a qualunque larghezza, e va chiuso prima
di portarlo su un telefono.

### 5.3 Un difetto latente che diventa grave appena l'intro arriva su mobile

`SmoothScroll.tsx:42` ferma Lenis se `data-preloader` è presente. A rimetterlo in
moto è solo `finish()` dentro `Preloader.tsx`. Ma:

- il failsafe dello script di boot **rimuove l'attributo e basta** — non riavvia Lenis;
- se il chunk (`ssr: false`) arriva *dopo* che il failsafe è scattato, `useGSAP`
  esce subito (`:86`, l'attributo non c'è più) e `finish()` non viene mai chiamato.

In entrambi i casi **la pagina resta con Lenis fermo: non scorre più.** Oggi il
telefono è immune solo perché non stampa mai l'attributo. Aprendo l'intro su mobile
— rete lenta, chunk in ritardo — questo diventa il modo più probabile di rompere il
sito. Va corretto **prima** della Fase 3, e coperto da un test e2e, non da una
rilettura.

### 5.4 Il taglio mobile

Si tiene ciò che fa *il* momento: **l'arco che sale e il tuffo**. Il resto è preambolo.

- Bersaglio **≤ 1,8 s**, contro i 4,63 di oggi. L'arco conserva `dtDiveIn` e la sua
  forma: si tagliano durata e atti, mai il gesto.
- **Fuori l'atto II** (la linea di carica): 1px su 390px non guadagna nulla e non
  misura nulla.
- **Fuori `PreChars`**: 21 livelli promossi con `will-change` per testo illeggibile a
  quella velocità. Le righe entrano da sotto la maschera con l'idioma `TextLines`.
- **Dentro `MarkBadge` / `spinMarkBadge`**: SVG di soli transform, è il marchio, costa
  quasi nulla.
- **Primo fotogramma in CSS.** L'overlay è già montato dallo script inline prima
  dell'idratazione; l'atto 1 diventa uno stato CSS puro, così l'intro sembra viva
  anche se il chunk non è ancora atterrato. GSAP prende il timone solo per il tuffo.
- **Disciplina di precarico**: `warmAllImages()` non gira durante un'intro mobile. Si
  scalda l'hero e la prima piega; il resto passa da `scheduleIdleWarmup()` **dopo**
  `INTRO_EVENT`.
- **Si tiene il fallback dell'arco** (sipario `clip-path` senza `mask-composite`).
- I sette failsafe si riderivano insieme, non solo il primo.

**Skip al primo tocco: già c'è.** Il listener è `pointerdown` (`:376`), che copre il
touch. La specifica chiede una modifica che non serve — va solo verificata con un
test. Nota però che lo skip fa `tl.seek("dive")`, quindi suonano comunque ~1,5 s.

### 5.5 Come si misura, e perché la scala di concessioni non basta

Vanno riportate due misure: **a freddo** (l'intro suona) e **a caldo**
(`dt-intro-seen` preimpostata). Oggi sono la stessa cosa su mobile, perché l'intro
non esiste: la riga «`/` 0,64 · 5.668 ms» in §1 **è** la misura a caldo.

Qui va detta una cosa scomoda, ed è il punto che va deciso prima della Fase 3.

> La scala di concessioni di §5.4 della specifica presuppone che l'intro sia ciò che
> fa sforare il budget. **Non lo è.** Il budget è già sforato di 3,2 s sull'LCP e
> 272 ms sul TBT *senza* intro. Nessun gradino della scala — nemmeno il sesto, che
> spegne l'intro su rete lenta — riporta l'LCP sotto i 2.500 ms, perché a fissarlo è
> il banner cookie montato all'idratazione e il ~1 MB di risorse di cui 291 kB di font.

Le due strade per chiudere quel divario sono già scritte in `docs/performance.md:89-97`
(tipografia; caricamento differito del layer motion) e sono entrambe dichiarate
**fuori mandato**. E lo stesso documento (`:99-101`) dichiara il job Lighthouse
**informativo**, non bloccante — il che contraddice direttamente §6 della specifica,
che lo tratta come un cancello. Questa contraddizione va risolta da te, non da me.

**Le tre opzioni, in ordine di onestà:**

1. **Togliere il banner cookie dai candidati LCP** (differirlo, o ridurre il blocco di
   testo). È l'unico intervento che agisce sull'elemento LCP *misurato*, sta dentro il
   mandato, e va fatto comunque perché è anche ciò che rende sensata la misura di
   laboratorio. Non basterà da solo a portare 0,64 → 0,90, ma è il primo gradino vero.
2. **Ridefinire il cancello** come «nessuna regressione rispetto alla baseline di
   Fase 0», tenendo le soglie assolute scritte come bersaglio. È ciò che
   `docs/performance.md` già fa di fatto.
3. **Aprire una delle due strade fuori mandato.** Decisione tua e del cliente.

Quello che **non** farò: rilassare in silenzio un'asserzione in `lighthouserc.js` per
far diventare verde la corsa.

---

## 6. Difetti trovati lungo la strada, non richiesti

Nessuno di questi è nel mandato. Li elenco perché sono veri e perché toccano
esattamente i file che la wave apre.

1. **Copertura e2e dell'intro sostanzialmente nulla.** Tre difetti in
   `e2e/home.spec.ts`: `:36` asserisce `overflow` su `body` mentre il lock è su
   `html` (asserzione vuota); `:34/:42/:47` usano `toBeVisible()`, che ignora
   `opacity` — l'h1 sta a `opacity:0.02` sotto un overlay `z-index:96` ed è
   "visibile" dal primo fotogramma; `:33` preme Invio subito dopo
   `domcontentloaded`, quasi certamente prima che il chunk `ssr:false` abbia
   attaccato il listener. **I due test dell'intro passano che l'intro suoni, finisca
   o stia ancora coprendo la pagina.**
2. **Nessun vocabolario di asserzione sul movimento.** `e2e/helpers.ts` non ha
   helper di motion. L'unica asserzione di transform del repo
   (`home.spec.ts:111-113`) è esplicitamente desktop-only. A 390px la suite prova che
   i nodi esistono, che non si trabocca e che axe è pulito — **non prova un solo
   tween**.
3. **`.ken-burns` è markup morto.** Nessuna regola CSS lo definisce più, ma la classe
   è ancora sull'`<Image>` di `PageHero` e `docs/DESIGN.md:110` lo documenta come
   «zoom cinematografico 18s».
4. **`/case` è un redirect permanente a `/acquista`** — quindi `case.png` nella
   baseline è un duplicato di `acquista.png`.
5. **La rete di sicurezza `focusin` di `HorizonScroller` (`:105-111`) non può
   scattare**: `autoAlpha:0` significa `visibility:hidden`, e un sottoalbero nascosto
   non è focalizzabile. Su desktop le tre CTA sono saltate dal Tab finché il trigger
   non le rivela.
6. **`ReviewsWall`, la centratura ottica non fa quello che il commento dice**: la
   percentuale è calcolata sull'altezza del *contenuto* ma applicata come `yPercent`,
   che GSAP risolve sull'altezza del *titolo* — ~71px invece dei ~308 previsti. Il
   risultato sembra giusto per caso.
7. **`SegnoDomus embrace={false}`** (`ThreadNav.tsx:181`) è una prop morta:
   `BrandMotif.tsx:31` destruttura solo `{ className, variant }`.
8. **Il doppio `group`** di `ThreadNav` (radice `:168` + ogni bottone `:191`) fa sì che
   l'hover in un punto qualsiasi della colonna riveli **tutte** le etichette insieme.
9. **`aria-current="true"`** (`ThreadNav.tsx:112`) invece di `"location"`/`"page"`,
   incoerente con `Header.tsx:325`.
10. **Commenti scaduti** da non credere durante l'implementazione: `Preloader.tsx:10`,
    `:141`, `:200-201`; `HeroCinematic.tsx:192-194`; `globals.css:262` («un centinaio
    di livelli» → sono 21) e `:1522`; `ReviewsWall.tsx:5` (425vh → 520vh);
    `docs/performance.md:69`.
11. **Il banner cookie occupa lo stesso identico rettangolo della barra azioni.**
    `CookieConsent.tsx:146` è `fixed inset-x-3 bottom-3 z-[60]`, `MobileActionBar.tsx:50`
    è `fixed inset-x-3` con `bottom: calc(0.75rem + …)` a `z-40`. Il banner vince e
    copre la CTA. Inoltre porta `role="dialog" aria-modal="true"` **senza** blocco
    dello scroll e **senza** `inert` sul resto della pagina, e sposta il focus su
    «Accetta» all'idratazione — che su mobile avviene subito, perché `isIntroRunning()`
    è falso quando non c'è preloader.
    *(`WhatsAppFloat` e `MobileActionBar` invece **non** collidono: sono mutuamente
    esclusivi per breakpoint, `sm:block` contro `sm:hidden`. La specifica li elenca
    come collisione da verificare: non lo sono.)*
12. **L'osservatore di `MobileActionBar` guarda un nodo staccato dopo una
    navigazione.** `MobileActionBar.tsx:35-44` fa `getElementById("contatti")` dentro
    un `useEffect(…, [])`, e il componente è montato dal layout persistente senza
    `key`. Si lascia la home con la sezione contatti in vista e la barra non torna
    più sulla rotta nuova finché non si ricarica.
13. **La collisione di attributo `data-tone`.** `app/lib/ui/surface.ts:71-72` scrive
    `data-tone="dark"` — lo **stesso** attributo che `SurfaceFlow` usa come marcatore
    di tappa e che `globals.css:615-618` usa per togliere gli sfondi. Oggi è innocuo
    perché l'unico chiamante è `ThreadNav` su una nav `display:none`. Diventa un bug
    il giorno in cui il filo mobile riusa `watchSurfaceTone` su un elemento visibile
    della home — cioè esattamente ciò che propone il verdetto 4.
14. **Il blocco dello scroll del menu mobile dipende da Lenis, non da `body`.**
    `Header.tsx:112/116` scrive `document.body.style.overflow`, ma con
    `html { overflow-x: clip }` (`globals.css:147`) l'overflow del body non si
    propaga al viewport. A bloccare davvero è `getLenis()?.stop()` (`:119`). Sotto
    `prefers-reduced-motion: reduce` Lenis è distrutto e `getLenis()` è `null`
    (`SmoothScroll.tsx:52-54`): **un telefono con reduced-motion potrebbe non avere
    alcun blocco dello scroll con il menu aperto.** Da verificare in Fase 4 con un
    test, non con una rilettura.

---

## 7. Gli strumenti aggiunti in Fase 0


Quattro script, nessuna dipendenza nuova (`@playwright/test` e `sharp` sono già
devDependencies), nessuno agganciato alla CI:

| Script | Cosa fa |
|---|---|
| `scripts/mobile-shots.ts` | Una schermata a pagina intera per rotta, a 390px. Il *prima* e il *dopo* |
| `scripts/mobile-filmstrip.ts` | Una rotta, una schermata alla volta, affiancate + inventario delle sezioni con la loro altezza. Serve perché `fullPage` mente sugli elementi `sticky` (§1.6) |
| `scripts/mobile-ergonomics.ts` | Traboccamento orizzontale, bersagli sotto i 44px, testo tagliato, collisioni con la barra azioni — per rotta e per larghezza. Esce 1 sul traboccamento |
| `scripts/mobile-probe.ts` | Il fermo-immagine del primo gesto, la realtà del blocco Lenis, `env(safe-area-inset-*)`, il peso morto scaricato e mai dipinto |

Due note di manutenzione, entrambe pagate a caro prezzo in questa fase:

- `tsx` inietta l'helper `__name` di esbuild dentro le funzioni annidate, che nel
  contesto della pagina non esiste. Nei corpi di `page.evaluate` non ci sono funzioni
  annidate: è deliberato, non stile.
- **Non misurare uno scroll bloccato con `window.scrollBy()`.** È programmatico e in
  Chromium passa attraverso `overflow: hidden`; a fermarlo sarebbe `clip`. Serve un
  gesto vero (`page.mouse.wheel`, `page.touchscreen`). La prima misura di §1.5a
  diceva l'esatto contrario del vero per questo motivo.

### 7.1 Cosa resta da misurare prima di impegnarsi

Non sono dubbi retorici: sono le affermazioni su cui la wave poggia e che oggi sono
letture del codice, non numeri.

1. **Quale elemento è LCP a 390px con l'intro accesa.** Il lockup è `text-[11vh]` non
   limitato, e la sagoma è un webp 2000×1415 a pieno viewport. L'assunzione del
   repository («Chromium esclude le immagini full-viewport») è *documentata, non
   misurata* — e la soglia vera di Chromium è l'entropia (~0,05 bit/pixel): la sagoma
   sta a ~1,9 bpp, lontanissima. Serve una traccia che **nomini** l'elemento.
2. **Il costo per frame della maschera ad arco a 4 layer su un Android di fascia
   media.** Misurabile **oggi, a codice invariato**, perché `PageTransition` già la
   monta su mobile. Da fare prima di decidere la forma dell'intro.
3. **Quando risolve `document.fonts.ready` su Slow-4G** con tre famiglie e quattro
   tagli. Fa da cancello a `TextLines`, `HorizonScroller`, `ReviewsWall`, `Fioritura`
   e alla catena di warmup: è lui a decidere quando parte il layer motion del telefono.
4. **Se il lotto di `scheduleIdleWarmup` cade prima o dopo l'LCP** e quanto TBT porta.
   Su mobile il registro ha **quattro** iscritti, non due: `Header.tsx:79` (scarica
   entrambe le varianti del wordmark), `CharFlip.tsx:164` (uno `SplitText` per ogni
   titolo della pagina), `Fioritura.tsx:567`, `TeamTrail.tsx:94`.
5. **Se il menu mobile blocca davvero lo scroll con reduced-motion attivo** (§6.14).
6. **Se le tre cuciture `ToneShift` reggono ancora la direttiva «nessun taglio
   percepito» a 390px**, dove il rapporto dei raggi collassa a ≈1:1 (§2.3).
7. **Il conteggio vero degli ScrollTrigger sulla home a 390px.** Ogni budget di questo
   piano è un delta contro una linea di base che nessuno ha misurato: GSAP non è
   esposto su `window` in build di produzione, quindi serve un hook temporaneo.

### 7.2 La fascia 768 è lo stato meno coperto del sito

Merita una riga per sé. A 768px: **il preloader parte** (`min-width: 768px`), **tutti
i gate `MQ.desktop` si aprono** (`CameraIn`, il frame-in dell'hero, il `<video>`,
la deriva di `PageHero`, il default di `Parallax`), `FaqContent` comincia a scrivere
`aria-current` su una nav che diventa sticky solo a `lg`, e **nessuno dei nove set
piece a 1024 gira**. Non è coperta da nessuna URL di Lighthouse e il progetto
`tablet-768` esegue solo i test `@layout`. È il posto dove la wave romperà qualcosa
senza accorgersene.

---

## 8. Il piano, e cosa lo dichiara finito

| Fase | Contenuto | Prova richiesta |
|---|---|---|
| **1 — Fondamenta** | `MQ` guadagna `lg: "(min-width: 1024px)"`, `belowLg: "(max-width: 1023.98px)"` e `coarse`. Le nove costanti private convergono. I quattro gate fuori da `mm.add` entrano. Ogni `mm.add(desktop, …)` guadagna il fratello, anche quando il fratello è un no-op con scritto perché | `npm run check` verde. Nessun `mm.add` desktop senza fratello o senza commento |
| **2 — I set piece** | I verdetti 1-15, nell'ordine: capitolo `HorizonStory`/`ReviewsWall`/`StarReviews`, poi `ThreadNav`, `Paths`, `Parallax`, `CameraIn`, `WordReveal`, gli hero | Un test per set piece che asserisce un **transform** o un progresso di ScrollTrigger a 390px, non l'esistenza di un nodo |
| **3 — L'intro** | §5, preceduta dalla correzione del difetto Lenis (§5.3) e dalla chiusura del buco da 1,1 s | Test e2e: suona a freddo, si salta al primo tocco, `data-preloader` sparisce, **`getLenis()` scorre di nuovo**, non si ripete alla seconda navigazione. Lighthouse a freddo *e* a caldo accanto alla baseline di §1 |
| **4 — Ergonomia** | Le tre famiglie di bersagli sotto 44px (§1.4), i due audit a11y rossi (§1.3), le quattro schermate del roster (§3 riga 6), lo scroll-lock del menu, le collisioni fra barra azioni / WhatsApp / banner | `scripts/mobile-ergonomics.ts` a 360/390/768 verde sul traboccamento e senza bersagli veri sotto i 44px |
| **5 — Verifica** | `npm run check`, `npm run test:e2e` (tutti e cinque i viewport), Lighthouse, screenshot prima/dopo, e una passata avversariale sul diff completo | Output reale, non aggettivi |

**Due avvertenze operative sui test**, dalla lettura della suite:

- un test marcato `@layout` gira su **cinque** progetti, non tre: i tre con `grep`
  più `mobile-390` e `desktop-1440`, che non ne hanno. Un test non marcato ne gira 2.
- `isMobile` è incoerente fra i due progetti stretti: `mobile-390` usa
  `devices["iPhone 13"]` (`isMobile: true`), `mobile-360` usa `Desktop Chrome` +
  `hasTouch` (`isMobile: false`). Per dire «a forma di telefono» si usa
  `page.viewportSize()?.width`, come già fa `home.spec.ts:112`.

---

## 9. Le decisioni prese

Fase 0 approvata il 2026-08-11. Due decisioni chiuse, tre assunzioni che restano
tali finché nessuno dice il contrario.

### 9.1 Il cancello dell'LCP: **prima il banner cookie**

Il banner smette di essere il candidato LCP della home *prima* che la Fase 3 misuri
l'intro. È l'unico intervento che agisce sull'elemento effettivamente misurato
(`p#cookie-consent-desc`, §1.2), sta dentro il mandato, e senza di esso la misura di
laboratorio non dice la verità su nulla — né sull'intro né sul resto.

Conseguenze operative:

- diventa **il primo commit della Fase 2**, non un accessorio della Fase 3: tutto
  ciò che si misura dopo va confrontato con una baseline pulita;
- va rimisurato subito dopo, isolato, così si sa quanto valeva davvero il banner;
- **non basterà** a portare 0,64 → 0,90. Il resto del divario resta dov'è
  (291 kB di font, ~550 kB di layer motion) e resta fuori mandato. Se dopo la Fase 3
  il budget è ancora rosso, torno con i numeri: non rilasso l'asserzione.

### 9.2 Il fermo-immagine dell'hero: **via su touch, resta su rotella**

`HeroCinematic.tsx:377-387` registra lo stesso handler su `wheel` e su `touchmove`.
Si separano: con un mouse il fermo-immagine è una finezza, con un dito è una pagina
che non risponde per un secondo.

- `wheel` → invariato (`getLenis()?.stop()` + `release` a 950 ms);
- `touchmove` → `reveal()` e basta, nessuno stop, nessun timer.

Nota d'implementazione: `onFirstKey` fa già esattamente questo (rivela senza
bloccare), quindi il ramo touch riusa quella forma. E va coperto da un test —
misurato con un **gesto vero**, mai con `window.scrollBy` (§7, note di manutenzione).

### 9.3 Le tre assunzioni che restano aperte

1. Le foto del team: assumo che restino mancanti e taglio l'altezza dei pannelli
   senza foto. Se arrivano durante la wave, il taglio si annulla con una classe.
2. `WordReveal` su mobile: assumo PORT, e se la misura dice che frammenta il
   candidato LCP diventa KEEP OFF con la ragione scritta a verbale.
3. Il montaggio del capitolo recensioni (§3.2): assumo di **non** toccarlo. È
   contenuto, non movimento.

E una che non è più un'assunzione ma una consegna di Fase 4: `viewportFit: "cover"`
(§1.5b) si aggiunge riallineando **nello stesso commit** tutti gli elementi ancorati
al fondo, perché li sposta tutti insieme.

---

## 10. Metodo

L'inventario è stato verificato da nove letture parallele indipendenti del codice,
seguite da una passata avversariale il cui unico compito era trovare ciò che le nove
avevano mancato. È servita: ha trovato sei contraddizioni fra le letture, e in tre
casi la lettura di maggioranza era quella sbagliata (il costo di `Fioritura` su
mobile, chi si iscrive al registro di warmup, e se `lenis.stop()` blocca davvero un
telefono).

Due affermazioni di questo documento nascono da un errore di misura mio, corretto e
lasciato a verbale invece che cancellato: il vuoto apparente della home (§1.6) e lo
scroll che sembrava passare attraverso il blocco (§1.5a). Le lascio scritte perché
sono le due trappole in cui ricadrà chiunque misuri questa cosa dopo di me.
