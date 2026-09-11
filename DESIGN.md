---
name: Domus Tua — la rivista bianca
description: Una rivista immobiliare stampata su un'unica carta avorio; titoli Playfair maiuscoli in vw/vh, paragrafi grandi e leggeri, media squadrati a tutta larghezza, rosso solo per accento e conversione.
colors:
  red: "#d20a0a"
  red-dark: "#a30707"
  ink: "#46423d"
  graphite: "#46423d"
  stone: "#6b665f"
  line: "#e4dccf"
  cream: "#f9f5ef"
  cream-deep: "#f4ece2"
  paper: "#fffdf8"
  white: "#ffffff"
  gold: "#c9a227"
  espresso: "#1c1512"
typography:
  hero:
    # --font-brand: oggi Plus Jakarta Sans; da ripuntare quando arriva il logo nuovo.
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(3.1rem, 13vw, 13rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  d1:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)"
    fontWeight: 500
    lineHeight: 0.92
    letterSpacing: "normal"
  d2:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)"
    fontWeight: 500
    lineHeight: 0.95
    letterSpacing: "normal"
  d3:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "normal"
  d4:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.45rem, 1.8vw, 1.75rem)"
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: "normal"
  lead:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 1.72vw, 1.55rem)"
    fontWeight: 300
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontFeature: "\"ss01\", \"cv01\""
  ui:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
  script:
    fontFamily: "Pinyon Script, cursive"
    fontSize: "clamp(2.6rem, 7vw, 7rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  none: "0px"
  circle: "9999px"
spacing:
  row: "8vw"
  row-mobile: "5vw"
  chapter: "clamp(6rem, 14vh, 11rem)"
  chapter-mobile: "clamp(4rem, 10vh, 6rem)"
  gutter: "6vw"
  stack-sm: "1.5rem"
  stack-md: "2rem"
  block: "clamp(3rem, 8vh, 6rem)"
  block-lg: "clamp(4rem, 10vh, 8rem)"
  media: "clamp(1.5rem, 4vh, 3rem)"
  page-top: "clamp(2rem, 6vh, 4rem)"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "1.05rem 2rem"
  button-primary-hover:
    backgroundColor: "{colors.red-dark}"
    textColor: "{colors.white}"
  button-primary-lg:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "1.2rem 2.4rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.red}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "1.05rem 2rem"
  button-outline-hover:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.4rem 0"
  button-ghost-hover:
    textColor: "{colors.red}"
  button-ghost-dark:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    padding: "0.4rem 0"
  button-send:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "1.05rem 2rem"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0.75rem 0"
  input-label:
    textColor: "{colors.stone}"
    typography: "{typography.label}"
  chip-tab:
    backgroundColor: "transparent"
    textColor: "{colors.stone}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "2.75rem"
  chip-tab-selected:
    textColor: "{colors.ink}"
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  eyebrow:
    textColor: "{colors.red}"
    typography: "{typography.label}"
  icon-button-play:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    rounded: "{rounded.circle}"
    size: "96px"
  icon-button-arrow:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: "56px"
  icon-button-arrow-hover:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
  icon-button-whatsapp:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    rounded: "{rounded.circle}"
    size: "56px"
  icon-button-whatsapp-hover:
    backgroundColor: "{colors.red-dark}"
  icon-button-social:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.circle}"
    size: "44px"
  icon-button-social-hover:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
---

# Design System: Domus Tua — la rivista bianca

Scritto dal costruito il 2026-09-10, dopo il redesign «rivista bianca» (ramo `claude/rivista-bianca`). La sorgente dei token è `app/globals.css` (`@theme inline`), i font arrivano da `app/layout.tsx` (next/font), le regole di composizione dai componenti in `app/components/`. Il sistema precedente (card, raggi, ombre, Fraunces) è archiviato in `docs/DESIGN.md` e non vale più.

## Overview

**Creative North Star: "La rivista bianca"**

Domus Tua è impaginata come una rivista immobiliare stampata su un'unica carta avorio: un solo fondo (#f9f5ef) da testata a piè di pagina, titoli Playfair Display maiuscoli che scalano col viewport (vw nell'hero, vh nei capitoli), paragrafi grandi e leggeri in colonna stretta, fotografie e video squadrati a tutta larghezza, e vuoto generoso tra un capitolo e l'altro. La ricchezza viene dalla misura della tipografia e dei media, non dalla decorazione.

Il rosso Domus è un accento contato: l'eyebrow, una parola in corsivo Pinyon per capitolo, il «Tua» del lockup, i bottoni di conversione e i pulsanti tondi. Tutto il resto è grafite e inchiostro caldo su avorio. Nessun raggio, nessuna ombra, nessun velo sulle foto, nessuna card, nessuna superficie scura fuori dal sipario d'ingresso. Il sito rifiuta esplicitamente la home «a card» e la home «cinematografica scura» che l'hanno preceduto.

Il movimento è disciplina: tre gesti (righe che salgono da una maschera, fade-up, una deriva di parallasse quasi impercettibile) più quattro firme — i pannelli orizzontali di «Perché Domus Tua», il film delle cinque stelle, la rotaia orizzontale del team e il monogramma che ruota in senso orario nella testata — e il film d'apertura di 4,63 s. Tutto è progressive enhancement: con reduced-motion o senza JavaScript la pagina è completa, ferma, e bella lo stesso.

**Key Characteristics:**
- Un solo fondo avorio (#f9f5ef) su tutto il sito; l'unica superficie scura è il pannello espresso del preloader.
- Titoli Playfair Display maiuscoli per foglio di stile, misurati in vw/vh; paragrafi Plus Jakarta Sans a 300 in colonna ≤ 50ch.
- Rosso #d20a0a solo come accento: eyebrow, corsivo di capitolo, CTA, pulsanti tondi, focus, selezione.
- Raggi a zero e nessuna ombra: gli unici cerchi sono i bottoni-icona (play, frecce, WhatsApp, social).
- Media squadrati a tutta larghezza, `object-cover`, senza velo né vignettatura; il testo non sta mai sopra una foto, tranne nella banda video finale.
- Nessun testo sotto i 16 px: l'UI sta a 1rem, il corpo a 19 px.
- Tre gesti di motion + rotaia del team + monogramma rotante + preloader, più i due set piece riportati l'11 settembre su richiesta del cliente (i pannelli orizzontali di «Perché Domus Tua» e il film delle cinque stelle); niente transizioni di pagina, niente cursore custom.

## Colors

Una tavolozza di carta e inchiostro caldo con un solo accento rosso, e due eccezioni circoscritte: l'oro sulle stelle e l'espresso nel sipario.

### Primary
- **Rosso Domus** (#d20a0a): l'unico accento. Eyebrow, parola-ornamento in corsivo (una per capitolo), il «Tua» del lockup, i bottoni pieni e a contorno, i pulsanti tondi (play, WhatsApp; frecce e social all'hover), il sottolineato dei link all'hover, l'anello di focus (2px, offset 3px), la selezione del testo (rosso su avorio), la riga del chip selezionato, la riga del campo a fuoco. Mai come riempimento di superfici, mai come colore di un paragrafo.
- **Rosso cupo** (#a30707): lo stato hover/focus dei bottoni pieni e dei pulsanti tondi rossi. Non compare a riposo.

### Tertiary
- **Oro delle stelle** (#c9a227): esclusivamente le cinque stelle della valutazione Google (hero e capitolo recensioni). È il materiale della valutazione, non del marchio: mai su testo, bordi, CTA o superfici.
- **Espresso** (#1c1512): il fondo del solo pannello del preloader, con due gradienti radiali caldi (`rgba(150,26,24,.32)` in alto a sinistra, `rgba(24,12,12,.9)` in basso a destra) perché non sia un nero piatto; sopra ci stanno il lockup in avorio e la firma in rosso. Nessun'altra superficie del sito è scura.

### Neutral
- **Avorio** (#f9f5ef): il fondo di tutto — `--background`, `themeColor`, body, testata, footer, menu mobile, barra azioni mobile. Non cambia mai fra le sezioni.
- **Avorio profondo** (#f4ece2): la testata quando scorre (con hairline sotto) e il rettangolo sotto ogni foto e video mentre carica. Non è un secondo fondo di sezione.
- **Carta** (#fffdf8): il fondo a riposo delle icone social, del banner cookie e dei controlli tondi appoggiati sulle foto (chiudi, frecce di galleria).
- **Inchiostro** (#46423d): il testo di base (`--foreground`), i titoli, le voci della nav, la riga sotto i campi, il bordo del banner cookie. Dal 2026-09-11 è la stessa grafite del lockup: «niente scritte nere» (Alberto, dopo il «niente nero» della cliente) — il quasi-nero #1a1816 non esiste più nel sito. Mai #000.
- **Grafite** (#46423d): i paragrafi editoriali (`.lead`), il corpo di testo dei capitoli, il «Domus» del lockup, le icone social a riposo.
- **Pietra** (#6b665f): il testo secondario — etichette dei campi, chip non selezionati, sovratitolo dell'hero, riga legale, orari, placeholder.
- **Filo** (#e4dccf): il colore di bordo di default (`* { border-color }`): hairline della testata scorsa, del footer, delle voci del menu mobile, dei separatori; bordo delle icone social a riposo.
- **Bianco** (#ffffff): l'inchiostro delle superfici rosse (bottoni pieni, pulsanti tondi, tooltip) e della sola banda video di congedo (titolo d1 e link). Mai su avorio.

### Named Rules
**La regola dell'unico fondo.** Tutto il sito sta su un solo avorio (#f9f5ef): nessuna sezione cambia fondo, nessuna banda di tono, nessuna card. L'unica superficie scura è il pannello del preloader, che sparisce dopo 4,63 s e non torna nella sessione.

**La regola del rosso contato.** Il rosso è un accento puntuale, non un colore di riempimento: eyebrow, un corsivo per capitolo, «Tua» nel lockup, CTA e pulsanti tondi. Se in una schermata il rosso occupa più di un bottone e una parola, è troppo.

**La regola dell'oro sulle stelle.** L'oro (#c9a227) esiste solo sulle stelle della valutazione. Se serve calore altrove, la strada è avorio profondo o carta, mai l'oro.

## Typography

**Display Font:** Playfair Display (con Georgia, serif) — `--font-display` e `--font-hero`, tondo e corsivo vero
**Body Font:** Plus Jakarta Sans (con system-ui, sans-serif) — `--font-sans`, variabile, `font-feature-settings: "ss01", "cv01"`
**Label/Mono Font:** Pinyon Script 400 (con cursive) — `--font-script`, il corsivo rosso; `--font-brand` per le scritte «Domus Tua» punta oggi a Plus Jakarta Sans 800 e verrà ripuntato al font del logo nuovo

**Character:** Una didone maiuscola enorme che fa da titolo di rivista, accompagnata da una sans umanista tenuta leggera (300) nei paragrafi e sicura (600, maiuscola, spaziata 0.08em) nelle etichette; una sola parola calligrafica rossa per capitolo fa da ornamento.

### Hierarchy
- **Hero / lockup** (800, `clamp(3.1rem, 13vw, 13rem)`, 0.9, tracking −0.02em, `--font-brand`): il solo wordmark «Domus Tua» nel primo schermo della home — «Domus» in grafite, «Tua» in rosso, minuscolo come il logo. Non è un h1 ed è un uso per sito.
- **d1** (500, `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)`, 0.92): il titolo di pagina (h1 delle pagine interne) e le teste dei capitoli che possiedono tutta la larghezza (Come lavoriamo, Metodo, Voci, la banda di congedo, il voto 4,9/5). Uno per pagina.
- **d2** (500, `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)`, 0.95): la testa di capitolo standard, i sottotitoli grandi accanto a una foto, le voci del menu mobile.
- **d3** (500, `clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem)`, 1.05): l'H1 dell'hero (in grafite, sotto il lockup), i titoli dei servizi, la citazione della fondatrice, i titoli in mezza colonna.
- **d4** (300, `clamp(1.45rem, 1.8vw, 1.75rem)`, 1.2): i titoli di colonna del footer e delle liste (Open Domus, D.O.C.), il sottotitolo in pietra sotto una testa di capitolo, il link della banda finale. Un h4 nudo resta a 400 per regola globale.
- **Lead** (300, `clamp(1.35rem, 1.72vw, 1.55rem)`, 1.4, grafite, max 50ch): il paragrafo editoriale — uno o due per capitolo, subito dopo il titolo. È la classe più usata del sito.
- **Body** (400, 1.1875rem = 19 px, 1.5): il testo corrente, le liste del footer, i campi, i titoli dei video; colonna ≤ 60ch.
- **UI** (400, 1rem, 1.3): il minimo del sito — riga legale, testo del banner cookie, consenso, voto e conteggio recensioni.
- **Label** (600, 1rem, 1.3, tracking 0.08em, MAIUSCOLO): eyebrow (rosso, con trattino di 1.75rem × 1px prima), etichette dei campi (pietra), bottoni, chip, sovratitolo dell'hero; le voci della nav sono la stessa a 500.
- **Script** (400, `clamp(2.6rem, 7vw, 7rem)`, 1, rosso, Pinyon): la parola-ornamento del capitolo, rientrata a sinistra (14–24vw) sotto il titolo, `aria-hidden`; nell'hero e nelle pagine interne è la firma «Raffaela Rizza» in misura ridotta.

### Named Rules
**La regola del maiuscolo.** h1–h4 sono maiuscoli per foglio di stile (`text-transform: uppercase`), a 500 (h1–h3) e 400 (h4); le citazioni no. Chi ha bisogno di un titolo in tondo minuscolo usa un elemento non-heading, come fa il lockup.

**La regola dei 16 px.** Nessun testo sotto 1rem: l'eyebrow sta a 16 px, la riga legale a 16 px, e sotto i 768 px i campi sono forzati a 16 px (`!important`) perché iOS non zoomi.

**La regola della colonna.** La taglia segue la colonna, non la gerarchia: d1 e d2 solo su teste che possiedono tutta la larghezza; in mezza colonna, accanto a una foto, la testa è d2 o d3 e il lead resta ≤ 50ch. Un titolo grande in colonna stretta non legge come editoriale, legge come un errore di impaginazione.

**La regola del corsivo unico.** Una sola parola Pinyon rossa per capitolo, mai sopra una foto, mai come titolo semantico.

## Layout

Il modello spaziale è quello di una rivista a pagina unica: un margine laterale in percentuale, capitoli separati da vuoto misurato in altezza di viewport, griglie a due colonne asimmetriche e media che rompono il margine a tutta larghezza.

- **Riga** (`.dt-row`): padding laterale 8vw (5vw sotto i 768 px). Nessun `max-width` generale: il contenuto si ferma per misura di riga (lead 38ch, body 60ch, titoli 16–28ch), non per contenitore. Il solo capitolo con un tetto è Costi (960 px).
- **Capitolo** (`.dt-chapter`): padding verticale `clamp(6rem, 14vh, 11rem)` (mobile `clamp(3rem, 8vh, 5rem)`). Ogni sezione della home è `dt-chapter` su avorio; nessuna banda cambia fondo.
- **Griglia**: UN solo template a due colonne da lg (1024 px) — `grid gap-[6vw] lg:grid-cols-2 lg:items-center`, media da un lato e testo dall'altro con rientro `lg:pl-[6vw]` (o `lg:pr-[6vw]` sulla riga specchiata, che porta anche `lg:order-2` sul media). Le sette proporzioni su misura che c'erano prima — `5fr 7fr`, `1.2fr 1fr`, `1fr 1.1fr`, `1.25fr 1fr`, `2fr 3fr`, `1fr 1.2fr` — sono state tolte: facevano cominciare la colonna di testo a x 670, 712, 736, 763, 790 o 826, e scorrendo l'occhio non ritrovava mai la stessa linea verticale. Una riga rompe la griglia solo con un offset DICHIARATO e ripetuto (`lg:-mt-[8vh]` per risalire nel padding del capitolo), mai con una larghezza unica. Le liste vanno a 2 (md) e 3 (lg) colonne con gutter 3vw e 4rem verticali; il footer a `1.4fr 1fr 1fr 1fr` con gap 3rem.
- **Ritmo verticale dentro il capitolo**: eyebrow → titolo 1.5rem; titolo → lead 2rem; lead → CTA 2rem; blocco → blocco `clamp(3rem, 8vh, 6rem)` o `clamp(4rem, 10vh, 8rem)`; titolo → media `clamp(1.5rem, 4vh, 3rem)`; sopra il primo schermo `clamp(2rem, 6vh, 4rem)`.
- **Primo schermo della home**: testata chiara; lockup a 13vw con la firma staccata sotto (rientro 8vw); griglia `1.2fr 1fr` con sovratitolo + H1 (d3, ≤ 28ch) a sinistra e il blocco CTA (max 520 px, allineato a destra e in basso) a destra; sotto, il video 16:9 a tutta larghezza (poster = LCP: una sola immagine prioritaria per pagina).
- **Media — tre moduli, non dodici**: `.dt-media-full` (tutta larghezza, 16:9), `.dt-media-half` (42vw, max 640 px, 1:1) e `.dt-media-column` (42vw, 4:5; col modificatore `--tall` 9:16). Sono scatole: dentro ci va `<Image fill className="object-cover">` sopra avorio profondo. La metà e la colonna sono 3vw più larghe della loro traccia di griglia (42vw contro 39vw) e sconfinano nel gutter: **il loro bordo interno cade sulla mezzeria della pagina** (x = 720 a 1440), che è la linea verticale che si vuole ritrovare scorrendo. Nella riga specchiata serve `lg:justify-self-end`, o la scatola sborda dal margine. A HEAD la home mostrava DODICI larghezze di media diverse (374, 420, 468, 490, 511, 535, 562, 589, 624, 816, 835, 1440) e tredici righe «foto | testo» di fila. **La scatola segue il sorgente, non la griglia**: un fotogramma 2,5:1 dentro un quadrato ne butta il 60% e lo ingrandisce, cioe' taglia i volti E li sgrana; le riprese larghe vanno in 16:9, i ritratti in 4:5, i quadrati solo a sorgenti quadrate. Mai oltre ~1,05x di ingrandimento. le tessere della rotaia del team sono tutte `.dt-media-column` (4:5): tre cornici diverse davano al nastro un bordo basso frastagliato, e l'altezza la dettava la tessera più alta.
- **Testata**: UNA riga alta `--dt-head-h` = `clamp(4.5rem, 10vh, 6.5rem)`, col logo ufficiale a `clamp(150px, 13vw, 210px)` a sinistra, SEI voci maiuscole e la lingua a destra sulla stessa riga; il monogramma rotante accompagna il logo solo da xl, dove c'e' spazio perche' due cuori non sembrino un errore di montaggio. Le due righe di prima — logo sopra, nastro di nove parole sotto — sono il «menu sopra» bocciato dal cliente l'11 settembre; le tre voci che avanzano (Servizi, Recensioni, Lavora con noi) vivono nel menu del telefono e nel footer, e `nav` in `app/lib/site.ts` resta la fonte unica con il flag `primary`. Sticky solo sotto lg (serve al bottone Menu). Le ancore hanno `scroll-margin-top: calc(var(--dt-head-h) + 0.5rem)`, e 1rem da lg in su dove la testata scorre via.
- **Elementi fissi**: WhatsApp tondo in basso a destra da sm (640 px) in su; sotto sm la barra azioni (hairline sopra, avorio, CTA piena `sm` senza freccia + WhatsApp 44 px); il footer riserva 7rem + safe-area in fondo. Il banner cookie è fisso, centrato, max 42rem.
- **Breakpoint**: quelli di Tailwind — sm 640, md 768, lg 1024, 2xl 1536. Il motion ha due soglie proprie: 768 per gli effetti di sezione (parallasse a corsa piena) e 1024 per i set piece (rotaia pilotata dallo scroll).

## Elevation & Depth

Il sistema è piatto per scelta: i tre token ombra (`--shadow-card`, `--shadow-card-hover`, `--shadow-float`) valgono `none` e nessuna superficie si stacca dalla carta. La profondità è data dalla misura (titoli enormi, media grandi), dall'hairline in filo (#e4dccf) come unico separatore, dal rettangolo avorio profondo che precede ogni foto, e dal movimento a due piani: la rotaia del team scorre mentre le foto panano in senso contrario, le foto di capitolo derivano di pochi pixel. Non c'è vetro, sfocatura, gradiente o velo sulle foto; il testo non sta mai sopra un'immagine, salvo nella banda video finale, bianco su video senza velo.

### Shadow Vocabulary
- **Alone social all'hover** (`box-shadow: 0 12px 24px -12px rgb(163 7 7 / 0.55)`): l'unica ombra del sito, sotto un'icona social che sale di 3 px e diventa rossa. È una risposta allo stato, non un'elevazione a riposo.

### Named Rules
**La regola del piatto.** Nessuna ombra, nessun blur, nessun gradiente su superfici e foto. Se due cose vanno separate, le separa un'hairline di 1 px in filo o il vuoto.

## Shapes

Il linguaggio è squadrato: i tre token raggio (`--radius-card`, `--radius-card-lg`, `--radius-field`) valgono 0, i bottoni hanno `border-radius: 0`, il tooltip social è un rettangolo con la punta, l'anello di focus è squadrato. Foto e video sono rettangoli a filo con `object-cover`, senza raggio, senza cornice, senza vignettatura.

L'unica curva del sito è il cerchio dei bottoni-icona: play 96 px (rosso pieno, al centro dei video), frecce del carosello 56 px (contorno inchiostro 1 px → rosso pieno all'hover), WhatsApp flottante 56 px e WhatsApp della barra mobile 52 px (rossi pieni), pulsante di ricerca 56 px, icone social 44 px (carta con bordo filo → rosso pieno), controlli sulle foto 44 px (carta → rosso), «+» delle FAQ 32 px. Sono tondi perché contengono solo un'icona (tratto 1.4, angoli arrotondati): una parola non sta mai in un cerchio.

I bordi sono sottili e pochi: hairline 1 px filo per separare (testata scorsa, footer, voci del menu mobile, riga legale, il voto); 1.5 px rosso per il bottone a contorno; 1 px inchiostro sotto i campi (rosso a fuoco); 2 px rosso sotto il chip selezionato; 1 px inchiostro attorno al banner cookie. Il focus è `outline: 2px solid` rosso con offset 3 px, su qualunque elemento.

### Named Rules
**La regola del cerchio.** L'unica forma curva è il bottone-icona tondo (play, frecce, WhatsApp, social, controlli sulle foto). Tutto ciò che contiene testo o immagine è un rettangolo a spigolo vivo.

## Components

I componenti sono pochi e sono tipografia: un bottone rosso, un link maiuscolo sottolineato, un campo con la sola riga sotto, e il cerchio per le icone. Tutte le regole `.dt-*` stanno fuori dai layer Tailwind: battono le utility, e per sovrascriverle serve il prefisso `!`.

### Buttons
Rettangoli maiuscoli, senza raggio, con il rosso come unica tinta. Base `.dt-btn`: inline-flex, gap 0.6rem, etichetta a 1rem 600 maiuscola tracking 0.08em, line-height 1.2, transizione 0.25 s di fondo/colore/bordo; su puntatore grosso altezza minima 2.75rem. La freccia (ArrowUpRight, 1.1em) segue l'etichetta di default.
- **Shape:** spigolo vivo (`border-radius: 0`).
- **Primary — `cta-solid`:** fondo rosso, testo bianco, bordo 1.5 px rosso; padding 1.05rem 2rem (md), 0.8rem 1.4rem (sm), 1.2rem 2.4rem (lg, la CTA dell'hero). È «Richiedi la valutazione», l'unica azione della home: una per schermata (hero, menu mobile, barra mobile, ricerca).
- **Hover / Focus:** fondo e bordo rosso cupo (#a30707); focus visibile con outline 2 px rosso offset 3 px.
- **Secondary / Ghost / Tertiary:** *outline* (`cta`): fondo trasparente, testo e bordo 1.5 px rossi, all'hover si riempie di rosso con testo bianco, stesso padding. *Ghost* (link maiuscolo): nessuna scatola, padding 0.4rem 0, testo inchiostro sottolineato (1.5 px, offset 0.35em), all'hover rosso — è «tutto il resto»: i rilanci di capitolo, le CTA del footer, «Vendi casa / Cerco casa» sotto l'hero; la variante `ghost-dark` è bianca (hover avorio) e vive solo sulla banda video di congedo. *Send*: il submit dei form lead, identico al primary; `disabled` a opacità 0.6 con cursore d'attesa e uno spinner al posto dell'icona.

### Chips
- **Style:** testo, non pillole. Il selettore d'intento del form («Voglio vendere», «Cerco casa»…) è una fila di etichette maiuscole a 1rem 600 tracking 0.08em in pietra, altezza minima 2.75rem, con una riga sotto di 2 px trasparente.
- **State:** selezionato = riga sotto rossa e testo inchiostro (`aria-pressed`); hover = testo inchiostro. Nella ricerca immobili i filtri sono rettangoli con bordo 1 px rosso, padding 0.25rem 0.75rem, che si riempiono di rosso (testo bianco) quando attivi.

### Cards / Containers
Non esistono card: nessuna superficie rialzata, nessuna cornice attorno a foto o testo, nessun fondo di riquadro. Un «blocco» è titolo + testo + hairline. I soli pannelli del sito sono due, entrambi senza raggio: il banner cookie (carta, bordo 1 px inchiostro, padding 1–1.25rem, max 42rem, fisso) e il pannello del menu mobile (avorio pieno, voci d2 separate da hairline).

### Inputs / Fields
- **Style:** nessuna scatola — solo la riga sotto, 1 px inchiostro, fondo trasparente, padding verticale 0.75rem, testo body (19 px) inchiostro, placeholder pietra; etichetta sopra a 1rem 600 maiuscola in pietra; la tendina toglie la freccia nativa (`appearance-none`) e ne disegna una a tratto; textarea ridimensionabile in verticale; checkbox 20 px con `accent-color` rosso.
- **Focus:** la riga sotto diventa rossa, senza outline (i campi sono l'eccezione all'anello globale).
- **Error / Disabled:** la riga sotto è rossa già a riposo e il messaggio sta sotto in rosso; sotto i 768 px ogni campo è forzato a 16 px.

### Navigation
- **Testata:** trasparente sull'avorio; dopo 24 px di scroll (o col menu aperto) fondo avorio profondo e hairline filo, con una transizione di colore di 0.3 s che è il suo unico movimento. Voci a 1rem 500 maiuscole tracking 0.08em in inchiostro, senza scatola; hover, focus e pagina corrente = sottolineato con offset 0.4em. Da lg le nove voci stanno su una seconda riga allineata a destra; sotto lg il toggle è la parola «Menu/Chiudi» sottolineata e il pannello è a tutto schermo con voci Playfair d2 maiuscole separate da hairline (corrente in rosso), poi CTA piena, WhatsApp come link e lingua. Il monogramma rotante (44 px) compare accanto al logo solo da lg.
- **Footer:** chiaro, in flusso, hairline sopra; quattro colonne (marca + payoff in lead, contatti, dove e orari, naviga) con titoli d4 a 300 maiuscoli e liste body; link nudi sottolineati all'hover (offset 4 px); icone social tonde; riga legale a 1rem in pietra sopra un'altra hairline.
- **Barra azioni mobile** (sotto 640 px): fissa in basso, avorio con hairline sopra, CTA piena a tutta larghezza + WhatsApp tondo 52 px.

### Testa di capitolo
La cellula che apre ogni sezione: eyebrow rosso con trattino → titolo Playfair d1/d2 maiuscolo → eventuale parola Pinyon rossa rientrata → lead in grafite ≤ 38ch → link ghost. Il Metodo la allinea a destra, tutte le altre a sinistra. Motion: l'eyebrow, il lead e il link entrano con `Reveal` (opacità 0 → 1 e salita di 2.5rem, 0.9 s, ease-out-expo, ritardi a scalare 80–200 ms; reversibile all'uscita); il titolo con `TextLines` (SplitText per righe con maschera, da 112 % a 0, 1.05 s expo.out, stagger 0.09 s, trigger all'86 % del viewport, reversibile).

### La regola dei `sizes`
`sizes` descrive i **pixel chiesti**, non la larghezza della scatola. Con `object-cover` una fotografia più larga della cornice viene RESA più larga della cornice, e la parte in più esce dal taglio: in una scatola 4:5 una sorgente 3:2 è resa larga una volta e mezza l'ALTEZZA, cioè quasi il doppio della larghezza. Il conto è `larghezzaResa = altezzaScatola × rapportoSorgente` quando la sorgente è più larga della scatola, `larghezzaScatola` altrimenti. Scritto con la larghezza della scatola, il loader manda 719 px dove ne servono 1.134 e la foto è molle. Il caso estremo è la copertina di uno Short (16:9) dentro una scatola 9:16: resa larga 3,16 volte la scatola, quindi il modulo verticale ha un tetto dichiarato finché non arriva un fotogramma 1080×1920.

### Media a tutta larghezza
Foto o video 16:9 / 1:1 / 4:5 senza cornice, `object-cover`, sopra avorio profondo. I video sono facciate: poster reale + cerchio rosso 96 px con triangolo bianco che scala a 1.05 all'hover (0.3 s); l'iframe arriva al click. Le foto di capitolo derivano con `Parallax speed={-0.04}`: la primitiva moltiplica per 14, quindi ±0,56 % dell'altezza propria (pochi pixel), scrub lineare lungo tutta la traversata, corsa dimezzata sotto i 768 px; l'hero delle pagine interne la spegne sul telefono.

### Rotaia del team
`HorizontalRail` con `runway={120}`: da 1024 px in su, con motion ok, il nastro si parcheggia al centro dello schermo (sticky su un corridoio alto quanto il nastro + 120svh) e trasla di tutta la sua eccedenza nel tempo di quello scroll (scrub 0.6); dentro ogni tessera la foto pana in senso contrario di ±4 %. Sotto i 1024 px è scroll orizzontale nativo con snap, la stessa parallasse via CSS (`--rail-p`) e un indicatore di 2 px × 4rem (traccia inchiostro al 15 %, cursore rosso). Tessere tutte `.dt-media-column` (4:5, 605×756 a 1440), didascalia in una riga di maiuscole a 16 px — il nome, non una frase. Gap `clamp(0.75rem, 1.6vw, 1.75rem)`, aria a sinistra `clamp(1.25rem, 5vw, 5rem)`. Nel nastro non entrano fotografie su fondale scuro (il contratto le vieta fuori dal preloader) né immagini già usate altrove nella pagina.

### Monogramma rotante
`RotatingMark`: anello di 60 tacche + monogramma ufficiale vettoriale che girano insieme in senso orario a 30°/s (un giro ogni 12 s); con lo scroll la velocità sale a 30 + 10·|v| in 0.3 s (ease domus) e torna a riposo in 1.1 s. Sta nella testata da lg (44 px) e nel preloader.

### I due set piece riportati (2026-09-11)
Il cliente ha chiesto di tenere «le animazioni che non erano curve»: tornano quindi, nella grammatica della rivista, i due gesti pilotati dallo scroll che il redesign aveva tolto. **«Perché Domus Tua»** (`HorizonStory` + `HorizonScroller`): da lg in su con motion ok lo schermo è sticky e due pannelli — il manifesto, che entra per carattere, e il territorio, coi gradini del titolo in parallasse contraria e la foto che si apre a sipario — scorrono in orizzontale mentre la pagina scende; sotto lg, senza JS o con reduced-motion sono due blocchi in colonna. Niente cupola, niente fondale aereo, niente fiori. **Le cinque stelle** (`StarReviews`, `#recensioni`): su una corsa di 360svh la foto del premio Top Agency compare piccola ritagliata a stella, si apre a tutto schermo con un lampo e il titolo per carattere, poi si richiude nella stella centrale di una fila di cinque che si accende d'oro dal centro, percorsa da un riflesso; sul telefono lo stesso film suona a tempo in un box ancorato alla fila. Sulla foto nessun velo: il titolo-cover è bianco con un'ombra di testo leggerissima, come sulla banda video di congedo. Le stelle sono l'unica forma non rettangolare del sito oltre ai bottoni-icona: poligoni a dieci vertici, nessuna curva.

### Preloader «Arco Domus»
L'unico pannello scuro: espresso con due gradienti radiali caldi, lockup Playfair a 11vh in avorio con la firma Pinyon a 5.2vh in rosso, una linea di carica avorio, poi una porta ad arco (maschera, 24vw → 36vw → 125vw) che si apre sulla pagina. Film di 4,63 s tutto in CSS (`TEMPO = 1`): sagoma da 0.15 s, lettere da 0.12 s (stagger 0.075), firma da 0.60 s, linea 0.60 → 2.15 s, arco 2.25 → 3.35 s, congedo 2.35 s, tuffo 3.13 → 4.63 s; autohide a 4.73 s, failsafe a 5.23 s. Suona una volta per sessione, mai con reduced-motion, mai con un'ancora nell'URL; si salta con un tocco o un tasto. In alto il badge di marca (anello di tacche + monogramma) gira in CSS in senso orario, 6 s a giro, anello e monogramma nello stesso verso come nella testata; sull'espresso posa su un disco carta (`bg-paper`, padding 0.5rem, nessuna ombra) perché il monogramma resti grigio e rosso — insieme ai bottoni-icona, l'unico cerchio del sito che contiene qualcosa. Non è un pattern da riusare: è il solo caso in cui il sito è scuro.

**Il patto della porta.** La sagoma dentro il sipario e la banda fotografica in cima alla home sono lo STESSO scatto nella STESSA scatola: `top: calc(var(--dt-head-h) + 1px)` (il pixel è il bordo basso della testata), `height: var(--dt-band-h)`, `objectPosition: "10% 0%"` da tutt'e due le parti. Quando l'arco si apre, dentro il buco c'è già la stanza che sta sotto: nessun doppio, nessun taglio. Il patto si era rotto quando l'hero è diventato una banda e la sagoma era rimasta a tutto schermo — per 750 ms si vedevano due Raffaela, poi uno stacco. I due numeri sono token condivisi in `globals.css` e il test `intro-clocks` li presidia: non si cambia l'uno senza l'altro.

### Banda video di congedo
L'ultima sezione: video 16:9 a tutta larghezza (min 70svh, scala 1.14 per il taglio) con il titolo d1 bianco (≤ 12ch) e un link `ghost-dark` a d4 300 in basso a sinistra, a 12vh dal fondo. Bianco su video senza velo: l'unica volta in cui il testo sta sopra un'immagine.

## Do's and Don'ts

### Do:
- **Do** tenere un solo fondo, #f9f5ef, dalla testata al footer; le sezioni si distinguono per vuoto (`clamp(6rem, 14vh, 11rem)`) e hairline, non per colore.
- **Do** misurare i titoli col viewport: d1 `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)`, d2 `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)`, sempre Playfair, sempre maiuscoli, interlinea 0.92–0.95.
- **Do** aprire ogni capitolo con la stessa cellula: eyebrow rosso → titolo → (una parola Pinyon rossa) → lead a 300 in grafite ≤ 38ch → link ghost.
- **Do** tenere le etichette delle CTA entro 22 caratteri: a 390 px la colonna del bottone e' 302 px e una maiuscola spaziata ne tiene 26. «Richiedi la valutazione», non «Richiedi la valutazione del tuo immobile».
- **Do** usare il rosso solo per accento e conversione: una CTA piena per schermata, il resto sono link maiuscoli sottolineati.
- **Do** mettere i media a tutta larghezza, squadrati, `object-cover`, su avorio profondo, senza velo; il play è un cerchio rosso di 96 px.
- **Do** tenere tutto il testo a 16 px o più: UI a 1rem, corpo a 19 px, campi forzati a 16 px sul telefono.
- **Do** limitare il movimento ai tre gesti (righe che salgono, fade-up di 2.5rem, deriva di parallasse) più i tre nastri pilotati dallo scroll (pannelli di «Perché Domus Tua», cinque stelle, rotaia del team) e il monogramma; ogni animazione dentro `prefers-reduced-motion: no-preference`, stati nascosti solo via JS.
- **Do** separare con hairline di 1 px in filo (#e4dccf) e con vuoto; il focus è sempre `outline: 2px` rosso offset 3 px.

### Don't:
- **Don't** usare raggi su superfici, campi, bottoni o media: i token raggio valgono 0 e il cerchio è riservato ai bottoni-icona.
- **Don't** usare ombre, blur, gradienti o veli e vignettature sulle foto; l'unica ombra è l'alone rosso sotto un'icona social all'hover.
- **Don't** creare card, riquadri o pastiglie: un blocco è titolo + testo + hairline.
- **Don't** usare superfici scure fuori dal preloader, né testo bianco fuori dai bottoni rossi e dalla banda video finale.
- **Don't** usare l'oro fuori dalle stelle della valutazione; niente blu, niente nero pieno, niente Inter, niente gradienti viola-blu.
- **Don't** scendere sotto i 16 px, nemmeno per didascalie, eyebrow o riga legale.
- **Don't** mettere più di una parola Pinyon per capitolo, né sopra una foto; il corsivo è ornamento `aria-hidden`, mai un heading.
- **Don't** aggiungere altre sezioni pinnate oltre le tre registrate, né transizioni di pagina, cursori custom, fiori o ornamenti disegnati: il sito deve restare bello anche fermo.
- **Don't** mettere titoli d1 o d2 in mezza colonna: accanto a una foto la testa è d2 o d3 e il paragrafo ≤ 38ch.
- **Don't** inventare una larghezza di media per sezione: esistono tre moduli (`.dt-media-full`, `.dt-media-half`, `.dt-media-column`) e la scatola segue il rapporto del sorgente.
- **Don't** riempire con un render di repertorio: una riga senza scatto vero si racconta col suo numero (`EditorialRows` lo fa da sé: mostra le foto solo se OGNI riga ne ha una in `reali/`).
- **Don't** ripetere un capitolo intero su più pagine: le recensioni vivono solo su `/recensioni`, la prova su ogni pagina è il sigillo Wikicasa del footer.
