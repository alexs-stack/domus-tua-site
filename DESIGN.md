---
name: Domus Tua — la rivista bianca
description: "Una rivista immobiliare stampata su un'unica carta avorio: titoli Playfair maiuscoli in vw/vh, paragrafi grandi e leggeri, media squadrati in tre moduli, inchiostro grafite e mai nero, rosso solo per accento e conversione."
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
  gold: "#d9a441"
  gold-deep: "#a9812a"
  gold-light: "#eed07a"
  gold-spec: "#fff6d4"
  espresso: "#1c1512"
typography:
  hero:
    # --font-brand: oggi Plus Jakarta Sans come segnaposto; si ripunta quando la cliente consegna il logo nuovo.
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(3.1rem, 13vw, 13rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  d1:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "normal"
  d1-below-lg:
    # Sotto i 1024 px (@media max-width 63.99rem) la scala torna a crescere con la larghezza.
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.55rem, 9.5vw, 7.5rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "normal"
  d2:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "normal"
  d2-below-lg:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.15rem, 7.4vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "normal"
  d3:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "normal"
  d3-below-lg:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.5rem, 4.8vw, 2.6rem)"
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
  lead-below-lg:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1.3rem, 3.1vw, 1.55rem)"
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
  eyebrow:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.12em"
  nav:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.1em"
  script:
    # Il token --text-script porta interlinea 1; .script-word, l'unico uso, la stringe a 0.8.
    fontFamily: "Pinyon Script, cursive"
    fontSize: "clamp(2.6rem, 7vw, 7rem)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "normal"
  script-below-lg:
    fontFamily: "Pinyon Script, cursive"
    fontSize: "clamp(3rem, 11vw, 7rem)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "normal"
  script-page-hero-lg:
    # La calligrafia di PageHero (11 pagine interne) da lg: il corpo scende con la colonna del titolo.
    fontFamily: "Pinyon Script, cursive"
    fontSize: "clamp(2.6rem, 5.6vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.8
    letterSpacing: "normal"
rounded:
  none: "0px"
  circle: "9999px"
spacing:
  row: "8vw"
  row-mobile: "5vw"
  chapter: "clamp(6rem, 14vh, 11rem)"
  chapter-mobile: "clamp(3rem, 8vh, 5rem)"
  gutter: "6vw"
  stack-sm: "1.5rem"
  stack-md: "2rem"
  block: "clamp(3rem, 8vh, 6rem)"
  block-lg: "clamp(4rem, 10vh, 8rem)"
  media: "clamp(1.5rem, 4vh, 3rem)"
  page-top: "clamp(2rem, 6vh, 4rem)"
  head-h: "clamp(4.5rem, 10vh, 6.5rem)"
  band-h: "60svh"
  media-side: "42vw"
  media-side-max: "640px"
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
  button-primary-sm:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.8rem 1.4rem"
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
  button-ghost-dark-hover:
    textColor: "{colors.cream}"
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
  chip-filter:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1rem"
    height: "44px"
  chip-filter-selected:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
  chip-filter-applied:
    backgroundColor: "transparent"
    textColor: "{colors.red-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.25rem 0.75rem"
    height: "44px"
  chip-filter-applied-hover:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.nav}"
  eyebrow:
    textColor: "{colors.red}"
    typography: "{typography.eyebrow}"
  icon-button-play:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    rounded: "{rounded.circle}"
    size: "96px"
  icon-button-play-compact:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    rounded: "{rounded.circle}"
    size: "56px"
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
  icon-button-whatsapp-bar:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    rounded: "{rounded.circle}"
    size: "44px"
  icon-button-social:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.circle}"
    size: "44px"
  icon-button-social-hover:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
  icon-button-photo:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: "44px"
  icon-button-photo-hover:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
---

# Design System: Domus Tua — la rivista bianca

Scritto dal costruito il 2026-09-10, dopo il redesign «rivista bianca» (ramo `claude/rivista-bianca`), e riallineato al codice il 2026-09-13 (a `c2949a3`). In questa revisione ogni token del frontmatter è stato riletto in `app/globals.css`, e ogni regola dice chi l'ha chiesta: **la cliente** (Raffaela Rizza, riferita da Alberto), **Alberto** (lo sviluppatore, con parole sue) o una **decisione di lavoro** presa costruendo, senza una parola né dell'una né dell'altro. Accanto ci sono la data e quel che il codice fa oggi. Il registro completo, con le citazioni testuali, le domande aperte e i materiali che la cliente deve ancora consegnare, sta in fondo in **Registro delle direttive**. Le domande aperte vanno fatte a chi deve deciderle: questo file non le risolve.

La sorgente dei token è `app/globals.css` (`@theme inline`), i font arrivano da `app/layout.tsx` (next/font), le regole di composizione dai componenti in `app/components/`. Il sistema precedente (card, raggi, ombre, Fraunces) è archiviato in `docs/DESIGN.md` e non vale più.

## Overview

**Creative North Star: "La rivista bianca"**

Domus Tua è impaginata come una rivista immobiliare stampata su un'unica carta avorio: un solo fondo (#f9f5ef) dalla testata al piè di pagina, titoli Playfair Display maiuscoli che scalano col viewport (vw nell'hero, vh nei capitoli), paragrafi grandi e leggeri in colonna stretta, fotografie e video squadrati in tre soli moduli, e vuoto generoso tra un capitolo e l'altro. La ricchezza viene dalla misura della tipografia e dei media, non dalla decorazione. Il riferimento è il sito che la cliente ha mostrato più volte, immobiliaregoldengoal.it (2026-09-10: pulito, scritte grandi, niente card, foto e video grandi, spazi gestiti bene). Dall'11 settembre Alberto ci ha rimesso accanto, come riferimento secondario, era-residence, il sito da cui il progetto era partito: il codice ne cita il dossier per il badge rotante, l'ingresso del preloader, lo scroller orizzontale e le righe dei titoli.

Il rosso Domus è un accento contato: l'eyebrow, al più una parola in corsivo Pinyon per capitolo, il «Tua» del lockup, i bottoni di conversione e i pulsanti tondi. Il testo è grafite su avorio, col secondario in pietra, e dall'11 settembre nel sito non c'è una scritta nera. Nessun raggio, nessuna card, nessuna ombra sulle superfici, nessun velo sulle foto, nessuna superficie scura fuori dal sipario d'ingresso (che è a sua volta una domanda aperta). Il sito lascia alle spalle la home a card, curva e smussata, e le sezioni scure che l'hanno preceduta. La cliente l'ha detto il 2026-09-10 con parole che non lasciano margine: «lo stile del nostro sito curvo e smuussato , con card ,e transizioni di pagina curve non piace per niente !» e «nessuna scritta piccola , niente colore nero , e niente curvo».

Il movimento è disciplina: tre gesti (righe che salgono da una maschera, fade-up, una deriva di parallasse quasi impercettibile), il monogramma che ruota in senso orario, il film d'apertura di 4,63 s e tre nastri pilotati dallo scroll da 1024 px in su, cioè i pannelli orizzontali di «Perché Domus Tua», il film delle cinque stelle e la rotaia del team. Tutti e tre sono sticky su un corridoio, nessuno usa il pin di GSAP. La cliente aveva chiesto di eliminare tante animazioni e transizioni, e restano tolte le transizioni di pagina, il cursore custom e il resto del WOW layer; i primi due nastri li ha fatti tornare Alberto l'11 settembre. Tutto è progressive enhancement: con reduced-motion o senza JavaScript la pagina è completa, ferma, e bella lo stesso.

**Key Characteristics:**
- Un solo fondo avorio (#f9f5ef) su tutto il sito; l'unica superficie scura è il pannello espresso del preloader, un'eccezione di lavoro ancora aperta.
- Titoli Playfair Display maiuscoli per foglio di stile, misurati in vw/vh e ricalibrati sotto i 1024 px; paragrafi Plus Jakarta Sans a 300 in colonna ≤ 38ch.
- Nessuna scritta nera: il testo è grafite #46423d, il secondario pietra #6b665f; il rosso resta agli accenti e agli errori, il bianco sta solo sul rosso o sopra le immagini.
- Rosso #d20a0a solo come accento: eyebrow, corsivo di capitolo, «Tua» del lockup, CTA, pulsanti tondi, focus, selezione.
- Raggi a zero e nessuna card. Le curve rimaste sono dichiarate: i bottoni-icona tondi, il disco rosso della legenda della mappa, gli indicatori di stato (la pista della rotaia, lo spinner) e, nel preloader, la porta ad arco e il disco sotto il badge.
- Media in tre moduli (16:9, 1:1, 4:5), `object-cover`, senza velo né vignettatura; le lettere stanno sopra un'immagine solo in quattro punti dichiarati.
- Nessun testo delle pagine sotto i 16 px: l'UI sta a 1rem, il corpo a 19 px (il preloader e le cifre dei segnaposto della mappa non la rispettano ancora; per il preloader è una domanda aperta).
- Tre gesti di motion, il monogramma rotante, il preloader e tre nastri pilotati dallo scroll; niente transizioni di pagina, niente cursore custom, niente fiori.

## Colors

Una tavolozza di carta e inchiostro caldo con un solo accento rosso, e due eccezioni circoscritte: l'oro sulle stelle e l'espresso nel sipario.

### Primary
- **Rosso Domus** (#d20a0a): l'unico accento. Eyebrow, parola-ornamento in corsivo, il «Tua» del lockup, i bottoni pieni e a contorno, i pulsanti tondi (play e WhatsApp a riposo; frecce, social e controlli sulle foto all'hover), il sottolineato dei link all'hover, l'anello di focus, il fondo della selezione del testo (con le lettere in avorio), la riga del chip selezionato, il fondo del filtro attivo, la riga del campo a fuoco. Mai come riempimento di superfici, mai come colore di un paragrafo.
- **Rosso cupo** (#a30707): lo stato hover e focus dei bottoni pieni e dei pulsanti tondi rossi. A riposo colora i testi rossi che stanno sull'avorio e devono reggere come testo, fra cui i messaggi d'errore e di conferma dei form, i chip dei filtri applicati nella ricerca, il contatore della mappa e il link di `Reviews`.

### Tertiary
- **Oro delle stelle**, quattro token: corpo (#d9a441), ombra (#a9812a), luce (#eed07a), speculare (#fff6d4). Esclusivamente le stelle della valutazione Google: le cinque da 16 px dell'hero, in `text-gold`, e il metallo della fila di StarReviews, dove i quattro token fanno le bande del gradiente e il riflesso che le percorre. Due valori, lì dentro, non passano dai token: il gradiente del corpo (`.dt-starrev_gold`) chiude al 100 % con un quinto oro scritto a mano, #bb9430, e l'alone (`.dt-starrev_halo`) sfuma verso `rgba(201, 162, 39, 0)`, cioè il vecchio #c9a227 a opacità zero. Dall'11 settembre il corpo è più caldo e più chiaro (decisione di lavoro, `aff9b0e`), perché sull'avorio il #c9a227 di prima leggeva mostarda. L'oro è il materiale della valutazione, non del marchio: mai su testo, bordi, CTA o superfici.
- **Espresso** (#1c1512): il fondo del solo pannello del preloader, con due gradienti radiali caldi (`rgba(150,26,24,.32)` in alto a sinistra, `rgba(24,12,12,.9)` in basso a destra) perché non sia un nero piatto. Sopra ci stanno la sagoma di Raffaela, il lockup in avorio, la firma in rosso e le didascalie in avorio al 60 e al 70 %. È un'eccezione di lavoro (spec, 2026-09-10) che contraddice alla lettera «eliminare nero ovunque» della cliente, e non ha un consenso esplicito né suo né di Alberto: c'è solo quello implicito nel «stesso film di oggi ma dimezzato». Domanda aperta. Il token `--color-wine` (#2a100f) resta definito in `globals.css`, ma nessun componente lo usa.

### Neutral
- **Avorio** (#f9f5ef): il fondo di tutto: `--background`, `themeColor`, body, testata, footer, menu mobile, barra azioni mobile. Non cambia mai fra le sezioni.
- **Avorio profondo** (#f4ece2): la testata del telefono quando scorre (con hairline sotto), la banda dell'hero e il rettangolo sotto ogni foto e video mentre carica. Non è un secondo fondo di sezione.
- **Carta** (#fffdf8): il fondo a riposo delle icone social, del banner cookie e dei controlli tondi appoggiati sulle foto (chiudi, frecce di galleria), e il disco sotto il badge del preloader.
- **Inchiostro** (#46423d): il testo di base (`--foreground`), i titoli, le voci della nav, la riga sotto i campi, il bordo del banner cookie e delle frecce del carosello. Dal 2026-09-11 è la stessa grafite del lockup: «NIENTE SCRITTE BLACK» (Alberto, dopo il «niente colore nero» della cliente). Il quasi-nero #1a1816 non è più l'inchiostro e non compare in nessuna pagina; resta soltanto nell'immagine Open Graph (`app/opengraph-image.tsx:65` come colore e `:82` come fondo), che quindi non segue ancora la regola. Mai #000.
- **Grafite** (#46423d): i paragrafi editoriali (`.lead`), il corpo di testo dei capitoli, il «Domus» del lockup, le icone social a riposo, i filtri della ricerca a riposo. Vale lo stesso colore dell'inchiostro: il primo nome dice «il testo di base», il secondo «il paragrafo editoriale», e la gerarchia la fanno peso e misura.
- **Pietra** (#6b665f): il testo secondario, cioè etichette dei campi e dei filtri, chip non selezionati, sovratitolo dell'hero, voci secondarie del menu del telefono, ruoli sotto i nomi, riga legale, orari, placeholder.
- **Filo** (#e4dccf): il colore di bordo di default (`* { border-color }`): hairline della testata scorsa, del footer, delle voci del menu mobile, dei separatori; bordo delle icone social e dei filtri a riposo.
- **Bianco** (#ffffff): l'inchiostro delle superfici rosse (bottoni pieni, pulsanti tondi, tooltip, filtro attivo) e delle lettere che stanno sopra un'immagine senza velo: il titolo-copertina delle cinque stelle, il titolo d1 e il link della banda di congedo. Mai su avorio.

### Named Rules
**La regola dell'unico fondo.** Tutto il sito sta su un solo avorio (#f9f5ef): nessuna sezione cambia fondo, nessuna banda di tono, nessuna card. Viene da una direttiva della cliente del 2026-08-06, «il taglio non si deve percepire», che resta valida (non è stata misurata col ΔRGB). L'unica superficie scura è il pannello del preloader, che sparisce dopo 4,63 s e non torna nella sessione.

**La regola del rosso contato.** Il rosso è un accento puntuale, non un colore di riempimento: eyebrow, un corsivo per capitolo, «Tua» nel lockup, CTA e pulsanti tondi. Se in una schermata il rosso occupa più di un bottone e una parola, è troppo.

**La regola dell'oro sulle stelle.** L'oro (#d9a441 e la sua rampa) esiste solo sulle stelle della valutazione. Se serve calore altrove, la strada è avorio profondo o carta, mai l'oro. Fra i DIVIETI di PRODUCT.md oggi si legge «niente oro (con l'eccezione non confermata delle stelle)»: l'eccezione è scritta, ma nessuno l'ha confermata, e se riscrivere il divieto in «oro solo sulle stelle» è una domanda aperta.

**La regola dell'inchiostro grafite.** Nessuna scritta è nera: `ink`, `graphite` e `--foreground` valgono #46423d (Alberto, 2026-09-11). Il riferimento scrive titoli e corpo in #1f1f1f, quasi nero (dossier `reverse-engineering/goldengoal/README.md:86`), ed è probabilmente per questo che la pagina può leggere slavata accanto a lui. Esiste una proposta di inchiostro più scuro per i soli titoli (#2e2a26), non applicata: va chiesta ad Alberto, non cambiata. Finché non risponde, tutto resta #46423d.

## Typography

**Display Font:** Playfair Display (con Georgia, serif): `--font-display` e `--font-hero`, tondo e corsivo vero
**Body Font:** Plus Jakarta Sans (con system-ui, sans-serif): `--font-sans`, variabile, `font-feature-settings: "ss01", "cv01"`
**Brand Font:** `--font-brand`, oggi `var(--font-jakarta)`, cioè Plus Jakarta Sans 800, come segnaposto finché la cliente non consegna il logo nuovo; quando arriva si ripunta solo in `globals.css` e in `layout.tsx`
**Script Font:** Pinyon Script 400 (con cursive): `--font-script`, il corsivo rosso

**Character:** Una didone maiuscola enorme che fa da titolo di rivista, accompagnata da una sans umanista tenuta leggera (300) nei paragrafi e sicura (600, maiuscola, spaziata) nei bottoni e nelle etichette; al più una parola calligrafica rossa per capitolo fa da ornamento.

### Hierarchy
- **Hero / lockup** (800, `clamp(3.1rem, 13vw, 13rem)`, 0.9, tracking −0.02em, `--font-brand`): il solo wordmark «Domus Tua» delle pagine, nella banda del primo schermo della home. Sta su due righe centrate, «Domus» in grafite e «Tua» in rosso, in maiuscole e minuscole come il logo. Non è un h1: è un `div`, ed è per questo che sfugge al maiuscolo. La tipografia l'ha tenuta Alberto quando ha fatto rimettere le posizioni di prima (2026-09-10: lascia il nuovo font, intendo solo le posizioni). «Nuovo font» lì vuol dire la tipografia della rivista bianca, non un font consegnato. Il lockup del preloader invece è in Playfair 500 a 11vh (`font-hero`), e contraddice «stesso font del logo in tutte le scritte Domus Tua» (la cliente, 2026-09-10): se allinearlo già ora a `--font-brand` o aspettare il logo nuovo è una domanda aperta.
- **d1** (500, `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)`, 0.98; sotto i 1024 px `clamp(2.55rem, 9.5vw, 7.5rem)`): la testa di capitolo che possiede tutta la larghezza. In home sono la testa sopra i pannelli di «Perché Domus Tua», il Metodo (allineato a destra) e la banda di congedo; nelle pagine interne è la testa di ogni capitolo a tutta larghezza (/open-domus, /vendi, /acquista, /chi-siamo, le righe editoriali, le FAQ), più il titolo della scheda immobile. A 300 in pietra o grafite fa anche i numeri delle righe numerate e delle statistiche, e su /recensioni il voto 4,9/5. Non vale più «uno per pagina»: quella regola del 2026-08-06 è ancora scritta in un commento di `globals.css` (riga 105, `fb5af77`), ma /open-domus apre cinque capitoli con un d1. L'h1 delle pagine interne non è d1: PageHero ha una misura sua (vedi Layout).
- **d2** (500, `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)`, 1; sotto i 1024 px `clamp(2.15rem, 7.4vw, 4.5rem)`): la testa in mezza colonna accanto a una foto (l'intro del Team), la testa del capitolo che apre un carosello (Voci, ≤ 16ch), il manifesto di «Perché Domus Tua».
- **d3** (500, `clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem)`, 1.05; sotto i 1024 px `clamp(1.5rem, 4.8vw, 2.6rem)`): l'H1 dell'hero (sotto la banda, ≤ 28ch), la citazione della fondatrice (in tondo), i sei nomi sotto la rotaia del team, i titoli dei servizi, i titoli in mezza colonna.
- **d4** (300, `clamp(1.45rem, 1.8vw, 1.75rem)`, 1.2): i titoli di colonna del footer e delle liste (Open Domus, D.O.C.), il sottotitolo in pietra sotto una testa di capitolo, il link della banda di congedo. Un h4 nudo resta a 400 per regola globale.
- **Lead** (300, `clamp(1.35rem, 1.72vw, 1.55rem)`, 1.4; sotto i 1024 px `clamp(1.3rem, 3.1vw, 1.55rem)`; grafite; massimo 38ch): il paragrafo editoriale, uno o due per capitolo subito dopo il titolo, ed è la classe più usata del sito. Il limite è 38ch e non 50 perché con Jakarta 300 a 25 px il `ch` è largo: 50ch risolvevano a 895 px, cioè 82 caratteri per riga, mentre il riferimento tiene le sue colonne fra 403 e 807 px.
- **Body** (400, 1.1875rem = 19 px, 1.5): il testo corrente, le liste del footer, i campi, i titoli dei video; colonna ≤ 60ch.
- **UI** (400, 1rem, 1.3): il minimo del sito, cioè riga legale, testo del banner cookie, consenso, voto e conteggio recensioni, voci secondarie del menu del telefono.
- **Label** (600, 1rem, tracking 0.08em, MAIUSCOLO): bottoni (interlinea 1.2; sotto i 640 px tracking 0.05em), etichette dei campi e dei filtri (pietra), chip, sovratitolo dell'hero, didascalie della rotaia del team.
- **Eyebrow** (500, 1rem, tracking 0.12em, MAIUSCOLO, rosso, preceduto da un trattino di 1.75rem × 1 px al 60 %): l'occhiello di capitolo. È più leggero e più aperto della label apposta: occhiello, bottone ed etichetta di un campo erano la stessa riga maiuscola, e a fare la gerarchia restava solo il rettangolo rosso.
- **Nav** (400, 1rem, tracking 0.1em, MAIUSCOLO, inchiostro): le sei voci della testata e, in pietra, le tre secondarie del menu del telefono. Il toggle «Menu/Chiudi» sale a 600.
- **Script** (400, `clamp(2.6rem, 7vw, 7rem)`, interlinea 0.8 in `.script-word`; sotto i 1024 px `clamp(3rem, 11vw, 7rem)`; rosso; Pinyon): la parola-ornamento, `aria-hidden`, con rientro 14vw sopra i pannelli di «Perché Domus Tua», 24vw sul telefono e 6vw da lg nelle pagine interne, nessun rientro nel Metodo. In PageHero, da lg, scende con la colonna anche il corpo, a `clamp(2.6rem, 5.6vw, 6rem)` (`PageHero.tsx:98`): alla misura piena una calligrafia lunga come «Domande frequenti» usciva dalla colonna e finiva addosso al lead. Nell'hero è la firma «Raffaela Rizza» a `clamp(2.2rem, 6vw, 5.5rem)`: la firma autografa reale non esiste ancora, e il sito non ne finge una.

### Named Rules
**La regola del maiuscolo.** h1–h4 sono maiuscoli per foglio di stile (`text-transform: uppercase`), a 500 (h1–h3) e 400 (h4); le citazioni no. Chi ha bisogno di un titolo in tondo minuscolo usa un elemento non-heading, come fa il lockup.

**La regola dei 16 px.** Nessun testo delle pagine sotto 1rem: l'eyebrow sta a 16 px, la riga legale a 16 px, il sovratitolo dell'hero a `text-ui`, e sotto i 768 px i campi sono forzati a 16 px (`!important`) perché iOS non zoomi. La regola viene dalla cliente («nessuna scritta piccola», 2026-09-10) ed è rispettata nel testo delle pagine, con due eccezioni. La prima è la mappa della ricerca: le cifre dei segnaposto hanno un corpo in linea calcolato dal numero di immobili, da 11 a 16 px (nei cluster da 14 a 22 px, `PropertyMap.tsx:81` e `:110`), e nessuna direttiva l'ha deciso. La seconda è il preloader: le didascalie «Immobiliare» e «dal 2007» stanno a 0.68rem e il payoff a 0.82rem (`PreloaderShell.tsx:96` e `:216`), senza override. Se portarle a 16 px o dichiarare un'eccezione è una domanda aperta; fino ad allora, per il preloader, questa regola non descrive il costruito.

**La regola della colonna.** La taglia segue la colonna, non la gerarchia: il d1 va solo sulle teste che possiedono tutta la larghezza; in mezza colonna, accanto a una foto, la testa è d2 o d3 e il lead resta ≤ 38ch. Un titolo grande in colonna stretta non legge come editoriale, legge come un errore di impaginazione.

**La regola del corsivo unico.** Al più una parola Pinyon rossa per capitolo, mai come titolo semantico. La grammatica è una sola (decisione di lavoro, 2026-09-11, `3411a55`): la calligrafia segue il titolo senza margini propri e ne attraversa l'ultima riga con un rientro di −0.2em (`--script-tuck`). Così passa la linea di base con le sole aste alte e il corpo resta sull'avorio; a −0.42em il rosso e la maiuscola grafite si intrecciavano a metà altezza e nessuno dei due si leggeva. Può scavalcare il bordo di una banda fotografica (la firma dell'hero con `--script-tuck: 0` e mezza lettera sulla foto; la calligrafia delle pagine interne, che ne attraversa il bordo alto per un terzo), ma non sta mai dentro una foto.

## Layout

Il modello spaziale è quello di una rivista a pagina unica: un margine laterale in percentuale, capitoli separati da vuoto misurato in altezza di viewport, un solo template a due colonne e media in tre moduli.

- **Riga** (`.dt-row`): padding laterale 8vw (5vw sotto i 768 px). Nessun `max-width` generale: il contenuto si ferma per misura di riga (lead 38ch, body 60ch, titoli 16–28ch), non per contenitore. I pochi tetti stanno dentro i set piece (il palco delle cinque stelle a 1240 px, il manifesto a 1000 px, il territorio a 1600 px), sotto l'hero, dove CTA e voto stanno in 640 px, e sullo Short in evidenza di «Perché Domus Tua», tenuto a 420 px da lg (vedi Components → La regola dei `sizes`).
- **Capitolo** (`.dt-chapter`): padding verticale `clamp(6rem, 14vh, 11rem)` (sotto i 768 px `clamp(3rem, 8vh, 5rem)`). Ogni sezione della home è `dt-chapter` su avorio; nessuna banda cambia fondo.
- **Griglia**: un solo template a due colonne da lg (1024 px), `grid gap-[6vw] lg:grid-cols-2 lg:items-center`, col media da un lato e il testo dall'altro rientrato con `lg:pl-[6vw]` (o `lg:pr-[6vw]` sulla riga specchiata, che porta anche `lg:order-2` sul media). Prima dell'11 settembre c'erano sette proporzioni su misura (`5fr 7fr`, `1.2fr 1fr`, `1fr 1.1fr`, `1.25fr 1fr`, `2fr 3fr`, `1fr 1.2fr`): facevano cominciare la colonna di testo a x 670, 712, 736, 763, 790 o 826, e scorrendo l'occhio non ritrovava mai la stessa linea verticale. Sono state tolte (`5304dfd`). Una riga rompe la griglia solo con un offset dichiarato e ripetuto (`lg:-mt-[8vh]` per risalire nel padding del capitolo), mai con una larghezza unica. Le liste vanno a 2 (md) e 3 (lg) colonne; il footer a `1.4fr 1fr 1fr 1fr` con gap 3rem.
- **Ritmo verticale dentro il capitolo**: eyebrow → titolo 1.5rem; titolo → lead 2rem; lead → CTA 2rem; blocco → blocco `clamp(3rem, 8vh, 6rem)` o `clamp(4rem, 10vh, 8rem)`; titolo → media `clamp(1.5rem, 4vh, 3rem)`; sopra il primo schermo delle pagine interne `clamp(2rem, 6vh, 4rem)`.
- **Primo schermo della home.** Si apre con la testata chiara. Sotto c'è la banda fotografica a tutta larghezza, alta `--dt-band-h` (60svh) su avorio profondo, con la foto reale dietro il lettering (`next/image` in `preload`, qualità 78, `object-cover`, `objectPosition: "10% 0%"`, nessun velo). Il `<video>` si monta solo se è abilitato in `media.ts`, con motion ok e da 768 px. Sulla foto stanno solo due cose: il lockup «Domus Tua» su due righe, centrato in orizzontale e in verticale nella banda, e a cavallo del bordo basso la firma Pinyon rossa. La firma sporge del 26 % (`--script-tuck: 0`), e per questo il blocco sotto le lascia l'aria per le discendenti. Sull'avorio seguono, centrati e ancora nel primo schermo, il sovratitolo (`text-ui` 600 maiuscolo, pietra), l'H1 d3 ≤ 28ch, «Richiedi la valutazione» piena in taglia `lg`, i due link «Vendi casa» → /vendi e «Cerco casa» → #cerca, e il voto «4,9/5 · 542 recensioni Google» con cinque stelle d'oro da 16 px. La banda è la stessa scatola della sagoma del preloader: vedi **Il patto della porta**.
  - *Chi ha deciso cosa, in ordine.* La cliente, il 2026-09-10, ha chiesto quattro cose: la firma più in basso; via la subcopy («Valutazione professionale…») e la riga «RR Con Raffaela Rizza e il team»; via il bottone del video, sostituito da «Vendi casa»; e «box vendi casa più a destra». La stessa sera Alberto ha chiesto di rimettere il blocco centrale, poi la foto sotto la scritta, e ha precisato di lasciare il nuovo font e cambiare solo le posizioni (`e6e34bd`). Il blocco è tornato centrato, e con questo il punto della cliente sul box più a destra è stato ribaltato; che «box» fosse il blocco CTA dell'hero lo dice solo la spec. Se dirlo alla cliente è una domanda aperta. Il giorno dopo, 2026-09-11, Alberto ha chiesto la foto dietro la scritta «Domus Tua», «come era prima del cambiamento» (`09aff4b`), e la foto sotto il testo della sera prima non c'è più. Sempre l'11 è arrivata una decisione di lavoro (`09aff4b`): sulla foto solo lockup e firma, perché senza velo un H1 a 38 px sopra un divano non si legge, mentre a 13vw il lockup si legge su qualunque stanza.
- **Primo schermo delle pagine interne** (`PageHero`, decisione di lavoro del 2026-09-11, `8b21627`; lo usano 11 pagine). La testa sta su due colonne da lg (`1.1fr 1fr`): occhiello, h1 e calligrafia a sinistra, lead e CTA allineati in basso a destra. La banda occupa entrambe le colonne nella riga sotto e risale sotto la colonna del titolo, così che la calligrafia ne attraversi il bordo alto per un terzo. L'h1 ha una misura sua, `clamp(3rem, 8vw, 9rem)` con interlinea 0.92, che da lg scende a `clamp(2.75rem, 4.8vw, 5.25rem)`, e non usa il token d1: a 115 px una parola come «VALORIZZARE,» sfonderebbe la colonna. La banda è `.dt-media-full`, forzata a 4:5 sotto md e a 16:9 da md, a filo dei margini (i margini negativi annullano il padding della riga). Il blocco di testo sopra la fotografia sta in ~460 px; quando era in colonna unica ne occupava 940, e su /servizi della foto non si vedeva un pixel. Sul telefono l'ordine è occhiello, titolo, calligrafia, foto, lead, CTA: la fotografia arriva prima del paragrafo, in colonna 4:5 e non in una feritoia 16:9 da 219 px.
- **Media: tre moduli, non dodici.** `.dt-media-full` (tutta larghezza, 16:9), `.dt-media-half` (1:1) e `.dt-media-column` (4:5; col modificatore `--tall` 9:16). Da 64rem la metà e la colonna valgono 42vw, con un massimo di 640 px. Sono scatole: dentro ci va `<Image fill className="object-cover">` sopra avorio profondo. La metà e la colonna sono 3vw più larghe della loro traccia di griglia (42vw contro 39vw) e sconfinano nel gutter, così il loro bordo interno cade sulla mezzeria della pagina (x = 720 a 1440), la linea verticale che si vuole ritrovare scorrendo. Nella riga specchiata serve `lg:justify-self-end`, altrimenti la scatola sborda dal margine.
  - *Dove.* L'intro del Team usa la metà; le tessere del Team la colonna; lo Short in evidenza di «Perché Domus Tua» la colonna verticale (`dt-media-column--tall`, 9:16), che da lg risale di 10vw sotto il titolo e ha un tetto di 420 px (`HorizonStory.tsx:204`), ed è l'unico uso vivo del modificatore; gli atti del Metodo la metà forzata a 16:9 (`!aspect-video`); PageHero la banda forzata a 4:5 / 16:9; il territorio di HorizonStory e le copertine di Voci la banda. Fuori modulo resta il ramo con le foto di `EditorialRows`, a `aspect-[4/3]`, che oggi nessuna pagina rende.
  - *Perché.* Alberto l'11 settembre ha segnalato «la posizione delle foto e dei video» insieme al menu. `5304dfd` e il commento di `moduli-media.test.ts` la attribuiscono al cliente, ma la frase è di Alberto: se riportava un giudizio della cliente è una domanda aperta. La risposta è una decisione di lavoro dello stesso giorno (`5304dfd`, `aff9b0e`, `90672e3`, `360c76b`): **la scatola segue il sorgente, non la griglia.** Un fotogramma 2,5:1 dentro un quadrato ne butta il 60 % e lo ingrandisce, cioè taglia i volti e insieme li sgrana: le riprese larghe vanno in 16:9, i ritratti in 4:5, i quadrati solo a sorgenti quadrate, mai oltre ~1,05× di ingrandimento. Prima di allora, a HEAD, la home mostrava dodici larghezze di media diverse (374, 420, 468, 490, 511, 535, 562, 589, 624, 816, 835, 1440) e tredici righe «foto | testo» di fila. Il test `moduli-media` presidia i quattro rapporti e i 42vw / 640 px.
- **Testata**: una riga alta `--dt-head-h` = `clamp(4.5rem, 10vh, 6.5rem)`, col logo ufficiale a sinistra e sei voci più la lingua a destra (dettagli in Components → Navigation). L'ha chiesta Alberto l'11 settembre, vedi il registro.
- **Dove vivono i contenuti** (decisioni di lavoro del 2026-09-11: `0fa94bc`, `ea1b584`, `183acdd`). L'ordine della home è: hero, posizionamento, ricerca, «Perché Domus Tua» (`#storia`), cinque stelle (`#recensioni`), Voci, percorsi, Metodo compatto, Open Domus, D.O.C., servizi, costi, testimonianza, social, team, contatti, congedo. In home il Metodo è `compact` (tre atti e un link ghost verso /metodo): i nove passi stanno solo su /metodo. Il capitolo recensioni (`<Reviews />`) vive solo su /recensioni, e il test lo pretende. `EditorialRows` mostra le fotografie solo se ogni riga ne ha una vera in `reali/`; oggi i suoi quattro chiamanti (Acquista, Open Domus, Servizi, Vendi) rendono tutti la lista numerata.
- **Elementi fissi**: WhatsApp tondo da 56 px in basso a destra da sm (640 px) in su. Sotto sm c'è la barra azioni (hairline sopra, avorio, CTA piena `sm` senza freccia + WhatsApp tondo da 44 px), e il footer riserva in fondo 7rem più la safe-area. Il banner cookie è fisso, centrato, largo al massimo 42rem.
- **Breakpoint**: quelli di Tailwind, cioè sm 640, md 768, lg 1024, xl 1280, 2xl 1536. Il motion ha due soglie proprie: 768 per gli effetti di sezione (parallasse a corsa piena, video del congedo) e 1024 per i set piece (nastri pilotati dallo scroll). Il monogramma della testata compare da xl.

## Elevation & Depth

Il sistema è piatto per scelta: i tre token ombra (`--shadow-card`, `--shadow-card-hover`, `--shadow-float`) valgono `none` e nessuna superficie si stacca dalla carta. La profondità la danno la misura (titoli enormi, media grandi), l'hairline in filo (#e4dccf) come unico separatore, il rettangolo avorio profondo che precede ogni foto, e il movimento a due piani: la rotaia del team scorre mentre le foto panano in senso contrario, e le foto di capitolo derivano di pochi pixel. Non ci sono vetro né sfocature, e le foto non hanno velo né vignettatura («VIGNETTATURA NO !», la cliente, 2026-09-10): l'hero, le cinque stelle e il congedo sono foto nude. I gradienti esistono solo nel pannello del preloader e nel metallo delle stelle.

Dove le lettere bianche stanno sopra un'immagine, la leggibilità la regge un'ombra attaccata alle lettere. È un'eccezione costruita (`09aff4b`, `8b21627`, `4a0d96e`), e non è un velo: sopra la foto non c'è nessun rettangolo. Restano due residui che la regola non ammette e che nessuna direttiva ha deciso. Il primo è il filtro cromatico `.photo-warm` (saturazione, contrasto, seppia e luminosità appena mossi) sui poster di `LazyYouTubeEmbed` e sulle foto di `PropertyGallery`. Il secondo è lo strato `.dt-starrev_flash` di StarReviews: a riposo ha opacità 0, durante il film fa un lampo di luce calda in sola opacità, e il suo stesso commento lo chiama «velo». Quel commento (`StarReviews.tsx:678`) e `globals.css:1998` parlano ancora di un «velo di vino» che non esiste più.

### Shadow Vocabulary
- **Alone social all'hover** (`box-shadow: 0 12px 24px -12px rgb(163 7 7 / 0.55)`): l'unica ombra di scatola delle pagine, sotto un'icona social che sale di 3 px e diventa rossa. È una risposta allo stato, non un'elevazione a riposo.
- **Ombra sulle lettere del congedo** (`text-shadow: 0 1px 2px rgb(0 0 0 / 0.35), 0 0 28px rgb(0 0 0 / 0.45)`, `INK_ON_VIDEO` in `Congedo.tsx`): sul titolo d1 e sul link della banda finale. Due raggi: 2 px staccano il bordo, 28 px reggono i fotogrammi in cui il drone porta sotto il titolo le tende bianche.
- **Ombra sulla copertina delle cinque stelle** (`text-shadow: 0 1px 2px rgb(0 0 0 / 0.25)`, `StarReviews.tsx:687`): sul titolo-copertina bianco che esce per carattere.
- **Alone della firma nel preloader** (`text-shadow: 0 2px 28px rgba(28, 21, 18, 0.55)`, `PreloaderShell.tsx:189`): stacca il Pinyon rosso dalla sagoma e dall'espresso.
- **Filo degli anelli eco del preloader** (`box-shadow: inset 0 0 0 1px rgba(242, 235, 218, 0.22)`): il profilo di luce dei due archi che seguono la porta. Vive solo nel sipario.

### Named Rules
**La regola del piatto.** Nessuna ombra di scatola a riposo, nessun blur, nessun velo né vignettatura sulle foto. Se due cose vanno separate, le separa un'hairline di 1 px in filo o il vuoto. Un'ombra è ammessa solo attaccata alle lettere bianche che stanno su un'immagine, o come risposta allo stato (l'alone social).

## Shapes

Il linguaggio è squadrato. «Niente curvo» (la cliente, 2026-09-10) è applicato nei token, dove `--radius-card`, `--radius-card-lg` e `--radius-field` valgono 0, e a mano: i bottoni hanno `border-radius: 0`, il tooltip social è un rettangolo con la punta, l'anello di focus è squadrato. Foto e video sono rettangoli a filo con `object-cover`, senza raggio, senza cornice, senza vignettatura. La transizione di pagina curva non esiste più: `PageTransition` è ridotto a uno stub (`178c6b5`).

Le curve rimaste sono eccezioni costruite (decisioni di lavoro), non direttive. Nelle pagine sono di tre tipi. Il primo è il cerchio dei bottoni-icona:
- play da 96 px da desktop, 56 px sotto lg (Voci, testimonianza) o sotto md (le facciate `LazyYouTubeEmbed`), e 64 px sulla foto del video di /open-domus;
- frecce del carosello da 56 px (contorno inchiostro 1 px, pieno rosso all'hover);
- WhatsApp flottante da 56 px e WhatsApp della barra mobile da 44 px (rossi pieni);
- pulsante di ricerca da 56 px;
- icone social da 44 px (carta con bordo filo, poi rosso pieno, con l'alone all'hover);
- controlli sulle foto e maniglia del prima/dopo da 44 px.

Il secondo è il disco rosso da 28 px con una cifra bianca a 600 nella legenda della mappa (`PropertyMap.tsx:158`), l'unico cerchio che contiene un carattere. Mostra come dovrebbero apparire i segnaposto, ma i segnaposto che Leaflet disegna (`.dt-marker__badge`, da 24 a 38 px secondo il numero di immobili; i cluster da 34 a 52 px) non hanno una regola CSS in nessun foglio del repo, né oggi né da quando la mappa è arrivata (`4897ac9`, 2026-07-31). Nel codice sono una cifra senza fondo e senza raggio, e la legenda promette un disco che la mappa non disegna; non è stato verificato a schermo. Il terzo sono gli indicatori di stato: la pista della rotaia sotto i 1024 px (2 px × 4rem, `rounded-full`, col cursore rosso anch'esso arrotondato, `RailProgress.tsx:165` e `:173`) e lo spinner tondo che prende il posto dell'icona nei bottoni d'invio (`Cta.tsx:139`) e nel pulsante di ricerca. L'assistente in chat avrebbe un lanciatore tondo da 56 px, ma oggi è spento (`NEXT_PUBLIC_ENABLE_ASSISTANT`).

Nel preloader le curve sono tre: la porta ad arco, i due anelli eco che la seguono (bordo alto arrotondato) e il disco carta sotto il badge. L'arco fa parte del film che Alberto ha chiesto di tenere uguale e dimezzato, quindi il consenso è implicito. Il disco contraddice anche «metti il logo senza sfondo bianco» (la cliente, 2026-08-06): domanda aperta. Le stelle di StarReviews sono poligoni a dieci vertici, senza curve.

I bordi sono sottili e pochi:
- hairline di 1 px in filo per separare (testata scorsa, footer, voci del menu mobile, riga legale);
- 1.5 px rosso per il bottone a contorno;
- 1 px inchiostro sotto i campi, rosso a fuoco;
- 2 px rosso sotto il chip selezionato;
- 1 px filo attorno ai filtri della ricerca, rosso all'hover;
- 1 px rosso attorno ai chip dei filtri applicati;
- 1 px inchiostro attorno al banner cookie e alle frecce del carosello.

Il focus è `outline: 2px solid` rosso con offset globale di 3 px; molti controlli lo stringono a 2 px.

### Named Rules
**La regola del cerchio.** Nelle pagine il cerchio serve a tre cose sole: il bottone-icona tondo, il disco numerato della mappa (una cifra, mai una parola) e gli indicatori di stato (la pista della rotaia, lo spinner). Una parola, una foto o un blocco di testo stanno sempre in un rettangolo a spigolo vivo.

## Components

I componenti sono pochi e sono tipografia: un bottone rosso, un link maiuscolo sottolineato, un campo con la sola riga sotto, e il cerchio per le icone. Tutte le regole `.dt-*` stanno fuori dai layer Tailwind: battono le utility, e per sovrascriverle serve il prefisso `!`.

### Buttons
Rettangoli maiuscoli, senza raggio, con il rosso come unica tinta. La base `.dt-btn` è inline-flex con gap 0.6rem, etichetta a 1rem 600 maiuscola con tracking 0.08em, interlinea 1.2 e transizione di 0.25 s su fondo, colore e bordo; su puntatore grosso l'altezza minima è 2.75rem. Sotto i 640 px il padding laterale scende a 1.25rem e il tracking a 0.05em: a 390 px la colonna del bottone è larga 302 px, e 32 px per lato più 0.08em ne costavano ~90, cioè la ragione per cui tutte le CTA lunghe andavano a capo (il test `moduli-media` presidia i due numeri). La freccia (ArrowUpRight, 1.1em) segue l'etichetta di default; hero, barra mobile e menu la tolgono.
- **Shape:** spigolo vivo (`border-radius: 0`).
- **Primary (`cta-solid`):** fondo rosso, testo bianco, bordo di 1.5 px rosso; padding 1.05rem 2rem (md), 0.8rem 1.4rem (sm, la barra mobile), 1.2rem 2.4rem (lg, hero e pagine interne). È «Richiedi la valutazione» → /valutazione-immobile-tradate, una per schermata.
- **Etichetta:** la forma corta ovunque (decisione di lavoro, 2026-09-11, `fb6a22c`): it «Richiedi la valutazione», en «Request a valuation», fr «Demander l'estimation», de «Bewertung anfordern», es «Solicita la valoración». Il test `moduli-media` vieta il ritorno dell'etichetta lunga. L'unica eccezione rimasta è `ServiziContent.tsx:132`, l'heroPrimary tedesco «Fordern Sie die Bewertung Ihrer Immobilie an».
- **Hover / Focus:** fondo e bordo rosso cupo (#a30707); focus visibile con outline di 2 px rosso.
- **Secondary / Ghost / Tertiary:**
  - *Outline* (`cta`): fondo trasparente, testo e bordo di 1.5 px rossi; all'hover si riempie di rosso con testo bianco, stesso padding.
  - *Ghost*, il link maiuscolo: nessuna scatola, padding 0.4rem 0, testo inchiostro sottolineato (1.5 px, offset 0.35em), rosso all'hover. È «tutto il resto»: i rilanci di capitolo, le CTA del footer, «Vendi casa / Cerco casa» sotto l'hero, WhatsApp nel menu del telefono.
  - *Ghost-dark*: la variante bianca (hover avorio), vive solo sulla banda di congedo, a d4 300 con l'ombra sulle lettere.
  - *Send*: il submit dei form lead, identico al primary; da `disabled` va a opacità 0.6, con cursore d'attesa e uno spinner al posto dell'icona.
- **Nota:** il commento in testa a `Cta.tsx` (righe 5-11) descrive ancora le varianti «anello», «morph» e «lift», che non esistono più: `reveal` e `reveal-cream` sono alias di `cta-solid`.

### Chips
- **Style:** testo, non pillole. Il selettore d'intento del form («Voglio vendere», «Cerco casa»…) è una fila di etichette maiuscole a 1rem 600 con tracking 0.08em, in pietra, alte almeno 2.75rem, con sotto una riga di 2 px trasparente.
- **State:** selezionato vuol dire riga sotto rossa e testo inchiostro (`aria-pressed`); all'hover il testo diventa inchiostro. Nella ricerca immobili i filtri sono rettangoli con bordo di 1 px in filo, padding 0.5rem 1rem, altezza minima 44 px, etichetta 600 maiuscola in grafite. All'hover il bordo diventa rosso e il testo inchiostro; attivi si riempiono di rosso col testo bianco, e all'hover passano al rosso cupo.
- **Filtri applicati:** sopra i risultati, ogni filtro numerico in uso (prezzo minimo, superficie minima, superficie massima) diventa un chip che si toglie col clic, «da … m²» con una × in coda (`PropertySearch.tsx:924`, `:934`, `:944`). È un rettangolo con bordo di 1 px rosso, padding 0.25rem 0.75rem, altezza minima 44 px, etichetta 600 maiuscola con tracking 0.08em in rosso cupo; all'hover si riempie di rosso col testo bianco. Il bordo rosso lo separa dai filtri in filo: quelli si scelgono, questo è già in uso.

### Cards / Containers
Non esistono card: nessuna superficie rialzata, nessuna cornice attorno a foto o testo, nessun fondo di riquadro. Un «blocco» è titolo + testo + hairline. I soli pannelli del sito sono due, entrambi senza raggio. Il banner cookie ha fondo carta, bordo di 1 px inchiostro, padding di 1–1.25rem, larghezza massima 42rem, ed è fisso. Il pannello del menu mobile è avorio pieno.

### Inputs / Fields
- **Style:** nessuna scatola, solo la riga sotto: 1 px inchiostro, fondo trasparente, padding verticale 0.75rem, testo body (19 px) in inchiostro, placeholder in pietra. L'etichetta sta sopra, a 1rem 600 maiuscola con tracking 0.08em, in pietra. La tendina toglie la freccia nativa (`appearance-none`) e ne disegna una a tratto; la textarea si ridimensiona in verticale; il checkbox è da 20 px con `accent-color` rosso.
- **Focus:** la riga sotto diventa rossa, senza outline (i campi sono l'eccezione all'anello globale).
- **Error / Disabled:** la riga sotto è rossa già a riposo e il messaggio sta sotto, in rosso; sotto i 768 px ogni campo è forzato a 16 px.

### Navigation
- **Testata.** È una riga sola, alta `--dt-head-h`, col logo ufficiale a `clamp(150px, 13vw, 210px)`; il monogramma rotante da 56 px lo accompagna solo da xl (1280 px).
  - *Da lg.* Le sei voci primarie (Vendi, Acquista, Metodo Domus, Open Domus, Chi siamo, Contatti) stanno a 1rem 400, maiuscole, con tracking 0.1em, in inchiostro, a 2rem l'una dall'altra, con la lingua sulla stessa riga. Nessuna CTA in testata: l'azione sta nell'hero e nelle pagine. Hover, focus e pagina corrente sono un sottolineato di 1 px con offset 0.45em.
  - *Comportamento* (decisione di lavoro, 2026-09-10, `7d2d1d8`). Sotto lg la testata è sticky: trasparente a riposo, e dopo 24 px di scroll (o col menu aperto) passa ad avorio profondo con hairline in filo, con una transizione di colore di 0.3 s. Da lg è `relative`, trasparente, e scorre via come nel riferimento.
  - *Menu del telefono.* Il toggle è la parola «Menu/Chiudi», a 600, sottolineata. Il pannello, fisso sotto la testata e avorio pieno, contiene le sei voci in Playfair 500 maiuscolo a `clamp(1.75rem, 7.5vw, 2.3rem)` separate da hairline (la corrente in rosso), poi le tre secondarie (Servizi, Recensioni, Lavora con noi) su una riga a 1rem in pietra, poi la CTA piena senza freccia, WhatsApp come link ghost e la lingua.
  - *Chi l'ha deciso.* Alberto, l'11 settembre: «come il menu sopra», una delle «cose brutte e formattate male». Le sei voci sono una decisione di lavoro dello stesso giorno (`6e6559b`): `nav` in `app/lib/site.ts` resta la fonte unica e il flag `primary` sceglie le sei; le altre tre vivono nel menu del telefono e nel footer. `6e6559b`, `site.ts:320-322` e il commento di `Header.tsx:34-35` attribuiscono il «menu sopra» al cliente: la frase è di Alberto, e se riportava un giudizio della cliente è una domanda aperta.
  - *Prima* (2026-09-10, storia). Erano due righe: logo, lingua e CTA sopra, nove voci a tracking 0.08em su una seconda riga allineata a destra, monogramma da 44 px già da lg. I commenti `Header.tsx:22-27` (due righe), `:214-215` («solo da lg», mentre la classe è `xl`) e `:232` («lingua e CTA piena») descrivono ancora quello.
- **Footer:** chiaro, in flusso, con hairline sopra. Da lg ha quattro colonne a `1.4fr 1fr 1fr 1fr` con gap 3rem (marca e payoff, contatti, dove e orari, naviga), titoli d4 a 300 e liste in body; link nudi sottolineati all'hover (offset 4 px), icone social tonde, e la riga legale a 1rem in pietra sopra un'altra hairline. In fondo riserva 7rem più la safe-area per la barra mobile.
- **Barra azioni mobile** (sotto 640 px): fissa in basso, avorio con hairline sopra, CTA piena `sm` senza freccia a tutta larghezza più WhatsApp tondo da 44 px.

### Testa di capitolo
La cellula che apre ogni sezione: eyebrow rosso con trattino → titolo Playfair d1 o d2 maiuscolo → eventuale parola Pinyon rossa che ne attraversa l'ultima riga → lead in grafite ≤ 38ch → link ghost. Il Metodo la allinea a destra, tutte le altre a sinistra. Il motion: eyebrow, lead e link entrano con `Reveal` (opacità da 0 a 1 e salita di 2.5rem, 0.9 s, ease-out-expo, ritardi a scalare di 80–200 ms, reversibile all'uscita); il titolo entra con `TextLines` (SplitText per righe con maschera, da 112 % a 0, 1.05 s expo.out, stagger 0.09 s, trigger all'86 % del viewport, reversibile).

### La regola dei `sizes`
`sizes` descrive i pixel chiesti, non la larghezza della scatola (decisione di lavoro, 2026-09-11, `01a1f20`). Con `object-cover` una fotografia più larga della cornice viene resa più larga della cornice, e la parte in più esce dal taglio: in una scatola 4:5 una sorgente 3:2 è resa larga una volta e mezza l'altezza, cioè quasi il doppio della larghezza. Il conto è `larghezzaResa = altezzaScatola × rapportoSorgente` quando la sorgente è più larga della scatola, `larghezzaScatola` altrimenti. Scritto con la larghezza della scatola, il loader manda 719 px dove ne servono 1.134 e la foto è molle. I valori oggi:
- tessere del Team: `(max-width: 640px) 146vw, (max-width: 1024px) 98vw, 79vw`;
- intro del Team: `(max-width: 1024px) 150vw, 63vw`;
- copertine di Voci: `(max-width: 768px) 143vw, (max-width: 1024px) 66vw, 46vw`;
- poster del congedo: `(max-width: 767px) 200vw, 100vw`;
- copertina dello Short in evidenza (`posterSizes` in `HorizonStory.tsx`): `(max-width: 1024px) 284vw, 1328px`.

Il conto non è stato rifatto immagine per immagine. Il caso estremo è proprio lo Short: la copertina arriva da YouTube in 16:9 e dentro una scatola 9:16 è resa larga 3,16 volte la scatola. Per questo quella colonna ha un tetto di 420 px da lg: lì servono 1.328 px di sorgente e ce ne sono 1.280, mentre a 605 px ne servirebbero 1.911. Il tetto si toglie quando arriva un fotogramma vero 1080×1920.

### Media a tutta larghezza
Foto o video nei tre moduli, `object-cover`, sopra avorio profondo. I video sono facciate: un poster reale e un cerchio rosso con triangolo bianco che scala a 1.05 all'hover (0.3 s). Il cerchio è da 96 px da desktop e da 56 px sul telefono, perché su una tessera larga uno schermo quello da 96 copriva i volti; l'iframe arriva al click. Le foto di capitolo derivano con `Parallax speed={-0.04}`: la primitiva moltiplica per 14, quindi ±0,56 % dell'altezza propria (pochi pixel), con scrub lineare lungo tutta la traversata e corsa dimezzata sotto i 768 px; l'hero delle pagine interne la spegne sul telefono.

### Copertine video rifilate
Ogni fotogramma video del sito è una copertina YouTube con la grafica cotta dentro (titolo bianco in alto, ritratto in cerchio con le stelline in basso a sinistra, logo), e sopra ci andava il nostro play: due titoli, due loghi, due play. Finché non arrivano fotogrammi puliti, la grafica si toglie col ritaglio.
- `.dt-still-trim` (`scale(1.43)`, origine 100 % 100 %) toglie la banda in alto e il badge in basso a sinistra.
- `.dt-still-trim--top` (`scale(1.32)`, origine 50 % 100 %) toglie la sola banda.

Il limite è 1,43: togliere tutta la banda col nome del canale vorrebbe dire 1,79, e lì i volti si tagliano. Ne resta un cuneo in basso a sinistra. Oggi il ritaglio si usa in Voci (`Voci.tsx:225`) e nella testimonianza in evidenza (`FeaturedTestimonial.tsx:141`). È una decisione di lavoro (2026-09-11, `c0d841f`, `39cedc3`): non è un effetto ma una correzione dichiarata, e sparisce il giorno in cui arrivano un fotogramma pulito per video a 1920×1080 (`ffmpeg -ss`) e i file sorgente dalla cliente.

### Voci
«Rifare sezione il muro delle voci» (la cliente, 2026-09-10). `ReviewsWall` non esiste più e `#voci` è un carosello nativo (overflow e scroll-snap, frecce tonde da 56 px che fanno `scrollBy`, nessun pin) con le video-recensioni del canale, seguito dal widget Trustindex dietro il consenso. La testa è eyebrow, h2 d2 ≤ 16ch («Le storie in video»), e sotto una riga a 16 px con voto e conteggio letti da `site.ts` (4,9/5 · 542 recensioni Google). Il titolo d1 col voto (`44d3a6c`) è stato tolto il giorno dopo per scelta di lavoro (`360c76b`): lo stesso numero stava già nell'hero e nelle cinque stelle, due volte enorme. Le tessere sono `.dt-media-full` a tutta larghezza sul telefono, 46vw da md e 32vw da lg (tre per schermata), con la copertina rifilata e il play rosso.

### Rotaia del team
L'ha chiesta la cliente (2026-09-10): un carosello o uno scroll orizzontale con le foto grandi, al posto del depth fade. La meccanica l'ha scelta Alberto lo stesso giorno: «Scroll orizzontale pilotato dallo scroll verticale».
- *Meccanica.* `HorizontalRail` con `runway={120}` e `snapMobile`. Da 1024 px in su, con motion ok, il nastro si parcheggia, sticky su un corridoio alto quanto il nastro più 120svh (mai il pin di GSAP), e trasla di tutta la sua eccedenza nel tempo di quello scroll (scrub 0.6); dentro ogni tessera la foto pana in senso contrario di ±4 %. Sotto i 1024 px è scroll orizzontale nativo con snap al centro, la stessa parallasse via CSS (`--rail-p`) e un indicatore da 2 px × 4rem a estremità tonde (traccia inchiostro al 15 %, cursore rosso largo un terzo, `RailProgress.tsx:165`). TeamTrail e il depth fade non esistono più.
- *Tessere.* Sono tutte `.dt-media-column`: 4:5, 42vw con massimo 640 px da lg (605×756 a 1440), 78vw sul telefono e 52vw da sm. È una decisione di lavoro del 2026-09-11: tre cornici diverse davano al nastro un bordo basso frastagliato, e l'altezza la dettava la tessera più alta. Il gap è 3vw, il rientro 5vw (8vw da md).
- *Oggi.* Le tessere sono tre: Raffaela (`raffaela-specchio-sorriso.jpg`), `team-red.jpg` e `team-group.jpg`, perché in `app/lib/team.ts` solo Raffaela ha un ritratto; gli altri cinque li deve consegnare la cliente. La didascalia è un'etichetta di una riga, 16 px maiuscola: il ruolo sotto il ritratto, il nome del gruppo sotto le foto di gruppo. Sotto la rotaia ci sono i sei nomi in d3, col ruolo in pietra.
- *Divieto.* Nel nastro non entrano fotografie su fondale scuro né immagini già usate altrove nella pagina.

### Monogramma rotante
`RotatingMark`: un anello di 60 tacche e il monogramma ufficiale vettoriale girano insieme in senso orario a 30°/s, un giro ogni 12 s. Con lo scroll la velocità sale a 30 + 10·|v| in 0.3 s (ease domus), torna a riposo in 1.1 s, e il verso non si inverte mai. Sta nella testata accanto al logo solo da xl (1280 px), a 56 px: sotto, il badge e il cuore del logo a sedici pixel di distanza sembravano un errore di montaggio. Nel preloader lo stesso badge gira in CSS a 6 s a giro, quindi le due velocità non coincidono. Il verso l'ha chiesto la cliente (2026-09-10, «cuore che ruota in senso orario»), e supera la controrotazione di agosto (2026-08-05: rotazione del logo opposta a quella del cerchio attorno).

### I due set piece riportati (2026-09-11)
Li ha fatti tornare Alberto l'11 settembre (`024d354`): «dovevamo fare un redesign, ma mantenendo quelle animazioni che non erano curve, tipo quella del 5 stelle, lo scroll orizzontale nella sezione perché domus tua … come prima ma con il nuovo design, niente curvo». Fino a questa revisione il file diceva «il cliente ha chiesto», e con parole diverse; l'unica fonte primaria cita Alberto, come i commenti di `HorizonStory.tsx`, `StarReviews.tsx` e `globals.css`. Se Alberto riferiva la cliente va detto esplicitamente: domanda aperta. Superano in parte «eliminare tante animazioni e transizioni» della cliente: tornano i due gesti pilotati dallo scroll, e restano tolte le transizioni di pagina, il cursore custom e il resto del WOW layer.

**«Perché Domus Tua»** (`HorizonStory` + `HorizonScroller`, `#storia`) è il primo capitolo dopo la ricerca.
- *Meccanica.* Da 1024 px in su con motion ok lo schermo è sticky (100svh) e due pannelli scorrono in orizzontale mentre la pagina scende. Il manifesto è largo 100vw, col d2 che entra per carattere. Il territorio è largo 126vw, di cui 26vw di pista a sinistra, coi gradini del titolo in parallasse contraria e la foto che si apre a sipario. Sotto i 1024 px, senza JS o con reduced-motion, sono due blocchi in colonna. Niente cupola (un bordo curvo), niente fiori, niente veli.
- *La foto del territorio.* È `/media/hero-aerial.jpg` in `.dt-media-full` (`sizes="(min-width: 1024px) 55vw, 100vw"`): lo stesso file che era il fondale aereo, rimesso come foto del pannello da una decisione di lavoro (2026-09-11, `360c76b`: il territorio si illustra col territorio). «Niente fondale aereo» è vero solo alla lettera: non c'è più come fondale, ma dopo la ricerca la foto aerea c'è ancora, e la cliente aveva chiesto «togliere foto dopo ricerca» (2026-09-10). Toglierla, o chiedere alla cliente se il divieto riguardava solo il fondale, è una domanda aperta. Dal 2026-09-13 (`c2949a3`) il testo alternativo dice quel che si vede, «Ripresa col drone di una villa con giardino e piscina», e non più i tetti attorno a Tradate: di quale immobile si tratti, con quale autorizzazione del proprietario e di chi siano i diritti del file è una domanda bloccante per la cliente (`docs/da-chiedere-alla-cliente.md` §2.2).

**Le cinque stelle** (`StarReviews`, `#recensioni`) corrono su 360svh con scrub 0.6.
- *Il film.* La foto del premio Top Agency compare piccola ritagliata a stella, si apre a tutto schermo con un lampo e il titolo per carattere, poi si richiude nella stella centrale di una fila di cinque che si accende d'oro dal centro, percorsa da un riflesso. Sotto i 1024 px lo stesso film suona a tempo (3 s) in un box alto al massimo 62svh, ancorato alla fila.
- *Sulla foto.* Nessun velo: il titolo-copertina è bianco con l'ombra di testo più leggera del sito. Le stelle sono poligoni a dieci vertici, senza curve.

### Preloader «Arco Domus»
L'unico pannello scuro. Su un fondo espresso con due gradienti radiali caldi (`.dt-pre-fondo`) stanno la sagoma di Raffaela, il lockup Playfair 500 a 11vh in avorio con la firma Pinyon a 5.2vh in rosso, le didascalie «Immobiliare / dal 2007», il payoff nella lingua salvata e una linea di carica avorio. Poi una porta ad arco (maschera; 24vw → 36vw → 125vw sul desktop, 40 → 58 → 165vw sotto i 768 px) si apre sulla pagina.
- *Tempi.* Il film dura 4,63 s, tutto in CSS (`TEMPO = 1`): sagoma da 0.15 s, lettere da 0.12 s (stagger 0.075), firma da 0.60 s, linea da 0.60 a 2.15 s, porta da 2.25 a 3.35 s, congedo del lockup a 2.35 s, tuffo da 3.13 a 4.63 s. L'autohide scatta a 4.73 s, il failsafe a 5.23 s, e le lettere dell'hero si accendono a 3.33 s.
- *Quando suona.* Solo alla prima visita della sessione (`dt-intro-seen`), con motion ok e senza un'ancora nell'URL. Si salta con un tocco o un tasto fino al tuffo.
- *Chi l'ha deciso.* La cliente, il 2026-09-10, ha chiesto un «preloader più veloce». Alberto lo stesso giorno ha risposto «Stesso film di oggi ma dimezzato», e `TEMPO` è passato da 2 a 1: da 9,26 s, la scelta della cliente del 2026-08-18 («lento come prima»), a 4,63 s. Più tardi quella sera Alberto ha scritto che non vedeva più il preloader: al codice non è cambiato nulla, perché il film suona solo alle condizioni scritte sopra. L'11 settembre ha chiesto di riavere l'animazione di entrata «come prima»: l'ingresso è stato ripristinato col patto della porta (`6e6559b`), ma la durata è rimasta 4,63 s. Se «come prima» comprendesse anche i 9,26 s è una domanda aperta.
- *Il badge.* In alto il badge di marca (anello di tacche e monogramma, 56 px) gira in CSS in senso orario, 6 s a giro, anello e monogramma nello stesso verso. Posa su un disco carta (`rounded-full bg-paper`, padding 0.5rem, nessuna ombra), una scelta di lavoro confermata in `c1ba870`, perché sull'espresso il monogramma depositato resti grigio e rosso.

Tre cose del preloader contraddicono direttive che valgono per il resto del sito, e restano domande aperte:
- il pannello espresso contro «eliminare nero ovunque»;
- le didascalie sotto i 16 px contro «nessuna scritta piccola»;
- il disco carta contro «niente curvo» e «metti il logo senza sfondo bianco», più il lockup in Playfair contro «stesso font del logo in tutte le scritte Domus Tua».

Il preloader non è un pattern da riusare: è il solo caso in cui il sito è scuro. Alcuni commenti di `globals.css` (righe 1058-1061, 1071-1072, 1106, 1151) citano ancora i numeri di `TEMPO = 2`, cioè 9,36 s e 6,46 s.

**Il patto della porta.** La sagoma dentro il sipario e la banda fotografica in cima alla home sono lo stesso scatto nella stessa scatola: `top: calc(var(--dt-head-h) + 1px)` (il pixel in più è il bordo basso della testata), `height: var(--dt-band-h)`, `left` e `right` a 0, e `objectPosition: "10% 0%"` da tutt'e due le parti. La regola `[data-pre-figure]` vale a ogni larghezza, e sotto i 768 px la sagoma usa `raffaela-sagoma-m.webp`, che ha lo stesso rapporto. Quando l'arco si apre, dentro il buco c'è già la stanza che sta sotto: nessun doppio, nessun taglio. Il patto si era rotto quando l'hero è diventato una banda mentre la sagoma era rimasta a tutto schermo: per 750 ms si vedevano due Raffaela, poi uno stacco. È stato ripristinato l'11 settembre (decisione di lavoro, `6e6559b`) in risposta alla richiesta di Alberto di riavere l'ingresso di prima. I due numeri sono token condivisi in `globals.css`, e servono anche all'altezza della testata, al `top` del pannello mobile e allo `scroll-margin-top` delle ancore (`calc(var(--dt-head-h) + 0.5rem)` sotto lg, 1rem da lg). Il test `intro-clocks` li presidia: non si cambia l'uno senza l'altro. La vecchia regola `.dt-mob-band` (≤ 767.98 px) è rimasta in `globals.css` ma nessun componente la usa.

### Banda video di congedo
L'ultima sezione della home: un video 16:9 a tutta larghezza (almeno 70svh, scala 1.14 dall'angolo in basso a destra), col titolo d1 bianco (≤ 12ch) e un link `ghost-dark` a d4 300 in basso a sinistra, a 12vh dal fondo. La scala serve a mangiare il logo bruciato nell'angolo alto a sinistra della clip, non è un effetto. Il video parte solo con motion ok, da 768 px e quando la banda è vicina; altrove resta il poster `/images/reali/piscina-lusso.jpg` (`object-[16%_50%]`, stessa scala 1.14), che non è una fotografia già usata altrove nella pagina: `hero-aerial.jpg` è il territorio. Le lettere bianche sul video non hanno velo, e sul video desktop `object-position` non ha alcun effetto (16:9 dentro 16:9): nessun taglio può evitare le tende bianche del bordo piscina. La leggibilità la regge l'ombra attaccata alle lettere (vedi Elevation & Depth), la stessa grammatica della copertina delle cinque stelle, e sopra il video non c'è nessun rettangolo.

## Do's and Don'ts

### Do:
- **Do** tenere un solo fondo, #f9f5ef, dalla testata al footer; le sezioni si distinguono per vuoto (`clamp(6rem, 14vh, 11rem)`) e hairline, non per colore.
- **Do** misurare i titoli col viewport: d1 `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)` con interlinea 0.98, d2 `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)` con interlinea 1, sempre Playfair, sempre maiuscoli; sotto i 1024 px vale la scala dedicata.
- **Do** aprire ogni capitolo con la stessa cellula: eyebrow rosso → titolo → (una parola Pinyon rossa che ne attraversa l'ultima riga) → lead a 300 in grafite ≤ 38ch → link ghost.
- **Do** scrivere il testo in grafite #46423d e il secondario in pietra #6b665f, mai in nero; un inchiostro più scuro sui titoli si chiede prima ad Alberto.
- **Do** tenere le etichette delle CTA entro 26 caratteri: a 390 px la colonna del bottone è 302 px e una maiuscola spaziata ne tiene 26. «Richiedi la valutazione», non «Richiedi la valutazione del tuo immobile».
- **Do** usare il rosso solo per accento e conversione: una CTA piena per schermata, il resto sono link maiuscoli sottolineati.
- **Do** mettere ogni foto in uno dei tre moduli, scelto dal rapporto del sorgente, su avorio profondo e senza velo; `sizes` dichiara i pixel resi, non la scatola.
- **Do** tenere tutto il testo delle pagine a 16 px o più: UI a 1rem, corpo a 19 px, campi forzati a 16 px sul telefono.
- **Do** limitare il movimento ai tre gesti (righe che salgono, fade-up di 2.5rem, deriva di parallasse), ai tre nastri pilotati dallo scroll (sticky su un corridoio, da 1024 px con motion ok), al monogramma e al preloader; ogni animazione dentro `prefers-reduced-motion: no-preference`, stati nascosti solo via JS.
- **Do** separare con hairline di 1 px in filo (#e4dccf) e con vuoto; il focus è sempre `outline: 2px` rosso.
- **Do** cambiare `--dt-head-h` e `--dt-band-h` solo insieme alla sagoma del preloader: il test `intro-clocks` presidia il patto della porta.

### Don't:
- **Don't** usare raggi su superfici, campi, bottoni o media: i token raggio valgono 0 e il cerchio è riservato ai bottoni-icona, al disco numerato della mappa e agli indicatori di stato.
- **Don't** usare ombre di scatola, blur, veli o vignettature sulle foto; sulle immagini l'unico trattamento ammesso è l'ombra attaccata alle lettere bianche, e l'unica ombra di scatola è l'alone rosso sotto un'icona social all'hover.
- **Don't** creare card, riquadri o pastiglie: un blocco è titolo + testo + hairline.
- **Don't** usare superfici scure: l'espresso del preloader è una domanda aperta, non un permesso da estendere.
- **Don't** mettere lettere sopra un'immagine fuori dai quattro punti dichiarati: lockup e firma dell'hero, calligrafia che scavalca la banda delle pagine interne, copertina delle cinque stelle, banda di congedo.
- **Don't** usare l'oro fuori dalle stelle della valutazione; niente blu, niente nero (né #000 né #1a1816), niente Inter, niente gradienti viola-blu.
- **Don't** scendere sotto i 16 px, nemmeno per didascalie, eyebrow o riga legale.
- **Don't** mettere più di una parola Pinyon per capitolo; il corsivo è ornamento `aria-hidden`, mai un heading, e non vive dentro una foto.
- **Don't** aggiungere sezioni sticky oltre i tre nastri registrati, né usare il pin di GSAP, né transizioni di pagina, cursori custom, fiori o ornamenti disegnati: il sito deve restare bello anche fermo.
- **Don't** mettere un d1 in mezza colonna: accanto a una foto la testa è d2 o d3 e il paragrafo ≤ 38ch.
- **Don't** inventare una larghezza di media per sezione: esistono tre moduli (`.dt-media-full`, `.dt-media-half`, `.dt-media-column`) e la scatola segue il rapporto del sorgente.
- **Don't** riempire con un render di repertorio: una riga senza scatto vero si racconta col suo numero (`EditorialRows` lo fa da sé, e mostra le foto solo se ogni riga ne ha una in `reali/`).
- **Don't** ripetere un capitolo intero su più pagine: i nove passi stanno su /metodo, le recensioni solo su /recensioni, e la prova su ogni pagina è il sigillo Wikicasa del footer.
- **Don't** ingrandire una copertina oltre 1,43 per rifilarla, né lasciare `.dt-still-trim` su un fotogramma che arriva pulito.

## Registro delle direttive

Come si legge. **La cliente** è Raffaela Rizza, riferita da Alberto; **Alberto** è lo sviluppatore, con parole sue; **decisione di lavoro** è una scelta presa costruendo, senza una parola della cliente o di Alberto. Le citazioni sono testuali, refusi compresi. Lo stato è quello del codice al 2026-09-13 (`c2949a3`). Gli ID (C la cliente, A Alberto, D decisione di lavoro, Q domanda sospesa) valgono dentro questo file: PRODUCT.md e la spec raccontano le stesse direttive senza numerarle. Quando la citazione è un pezzo di una frase più lunga, lo si dice.

### La cliente (riferita da Alberto)
- **C01** · 2026-09-10 · «lo stile del nostro sito curvo e smuussato , con card ,e transizioni di pagina curve non piace per niente !» · «nessuna scritta piccola , niente colore nero , e niente curvo». **Applicata, con eccezioni costruite.** I token raggio valgono 0 e quelli ombra `none`; `PageTransition` è uno stub. Restano i bottoni-icona tondi (fra cui l'icona social con l'alone all'hover e il WhatsApp della barra mobile) e, nel preloader, la porta ad arco e il disco carta. Vedi Shapes.
- **C02** · 2026-09-10 · «mi ha mostrato tante volte questo sito : https://www.immobiliaregoldengoal.it/ . è molto pulito , clean , profesionale , scritte grandi , font azzeccato , niente card , foto e video grandi , spazi gestiti bene». **Applicata, come riferimento.** Il codice non può dire se la pagina è «pulita», ma ne porta le conseguenze misurabili: un solo fondo avorio, nessuna card, raggi a 0, media a tutta larghezza o a 42vw.
- **C03** · 2026-09-10 · «dobbiamo rifare tante cose , e eliminare tante animazioni e transizioni». **Superata in parte da A12.** Sono tolte le transizioni di pagina, `Cursor.tsx` e `Magnetic.tsx` (con `data-cursor`) e il resto del WOW layer. Da 1024 px girano tre nastri pilotati dallo scroll, tutti sticky su un corridoio; Voci è un carosello nativo, non pinnato.
- **C04** · 2026-09-10 · «nessuna scritta piccola» (pezzo della seconda frase di C01). **Domanda aperta.** Rispettata nel testo delle pagine (UI 16 px, corpo 19 px, eyebrow 16 px), non nel preloader (0.68rem e 0.82rem) e nemmeno nelle cifre dei segnaposto della mappa, che scendono fino a 11 px.
- **C05** · 2026-09-10 · «preloader piu veloce». **Applicata:** `TEMPO = 1`, 4,63 s.
- **C06** · 2026-09-10 · «cuore che ruota in senso orario». **Applicata:** in testata 30°/s (12 s a giro, mai invertito), nel preloader 6 s a giro in CSS. Supera la controrotazione del 2026-08-05.
- **C07** · 2026-09-10 · «firma piu in basso nella hero». **Applicata:** la firma sta a cavallo del bordo basso della banda (`translate-y-[26%]`, `clamp(2.2rem, 6vw, 5.5rem)`).
- **C08** · 2026-09-10 · «eliminare : Valutazione professionale, documenti verificati prima di andare sul mercato, marketing curato e Open Domus. Un unico metodo, dalla prima stima alla firma dal notaio. RR Con Raffaela Rizza e il team». **Applicata** (`deb1291`): nell'hero non ci sono più la subcopy né la riga «RR». Parole simili restano nella meta description di `app/page.tsx`, che in pagina non si vede.
- **C09** · 2026-09-10 · «togliere guarda video bottone : mettere bottone vendi casa -». **Applicata:** «Richiedi la valutazione» piena, «Vendi casa» e «Cerco casa» ghost, nessun bottone video.
- **C10** · 2026-09-10 · «togliere foto dopo ricerca .». **Domanda aperta, non rispettata nella sostanza:** `/media/hero-aerial.jpg` è tornata come foto del pannello territorio, nel primo capitolo dopo la ricerca (D07).
- **C11** · 2026-09-10 · «box vendi casa piu a destra». **Superata da A04** la sera stessa: il blocco è centrato. L'interpretazione «blocco CTA dell'hero» viene solo dalla spec.
- **C12** · 2026-09-10 · «ELIMINARE tutti i  FIORI». **Applicata:** `Fioritura.tsx` non esiste e nessun fiore viene reso; la parola resta solo in qualche commento. Supera le direttive di agosto su fiori e cupole.
- **C13** · 2026-09-10 · «RIFARE SEZIONE IL MURO DELLE VOCI». **Applicata:** Voci, carosello nativo + Trustindex. Vedi Components → Voci.
- **C14** · 2026-09-10 · «VIGNETTATURA NO !». **Applicata:** nessun velo né vignettatura su hero, cinque stelle e congedo. L'ombra attaccata alle lettere bianche è un'eccezione costruita. Nel DOM resta lo strato `.dt-starrev_flash` (opacità 0 a riposo).
- **C15** · 2026-09-10 · «PENSARE A COME  GESTIRE GRANDEZZE FONT PER RENDERLO COME IL SITO DI RIFERIMENTO». **Applicata:** la scala in vw/vh del frontmatter, con la sua versione sotto i 1024 px.
- **C16** · 2026-09-10 · «cambiare sezione team , preferisce un carosello o uno scroll orizzontale con le foto grandi , piuttosto che quello che c'è attualmente del delpth fade». **Applicata:** la rotaia del team (con A03).
- **C17** · 2026-09-10 · «eliminare nero ovunque». **Applicata nelle pagine:** fondo unico, nessuna sezione scura, inchiostro grafite. Restano il pannello espresso del preloader (D05, domanda aperta) e l'immagine Open Graph, che usa #1a1816 come colore e come fondo; `--color-espresso` e `--color-wine` sono ancora definiti.
- **C18** · 2026-09-10 · «mettere logo nuovo , e usare stesso font del logo in tutte le scritte Domus Tua». **In attesa della cliente** per il logo: `--font-brand` punta a Jakarta come segnaposto. **Non rispettata** la seconda metà: `font-brand` lo usa solo il lockup dell'hero, il lockup del preloader è in Playfair. Domanda aperta.
- **C19** · 2026-08-06 · «metti il logo senza sfondo bianco». **Domanda aperta, non rispettata nel preloader:** il badge posa su un disco `bg-paper`. Nessun documento dice che la regola sia stata allentata.
- **C20** · 2026-08-06 · «il taglio non si deve percepire». **Applicata:** un solo fondo avorio, nessun cambio di tono fra i capitoli (non misurato col ΔRGB).

### Alberto
- **A01** · 2026-09-10 · «fai un reverse engineering del sito in questione per avere tutto il codice sorgente di come è fatto». **Applicata, fuori dal codice del sito:** il dossier `reverse-engineering/goldengoal/` esiste (è gitignorato), e alla riga 86 del suo README registra il colore del testo del riferimento, #1f1f1f (vedi Q01).
- **A02** · 2026-09-10 · «Stesso film di oggi ma dimezzato» (risposta delle 18:16Z). **Applicata:** `TEMPO = 1`, 4,63 s.
- **A03** · 2026-09-10 · «Scroll orizzontale pilotato dallo scroll verticale» (per il team). **Applicata** da 1024 px con motion ok; sotto, scroll orizzontale nativo.
- **A04** · 2026-09-10 · «nella hero hai cambiato le posizioni non mi piace , rimettilo centrale». **Applicata** (`e6e34bd`): lockup, sovratitolo, H1, CTA e voto centrati.
- **A05** · 2026-09-10 · «Aspetto il logo nuovo» (per il font). **In attesa della cliente:** `--font-sans` e `--font-brand` puntano entrambi a Plus Jakarta Sans; quando arriva il logo si cambia una riga.
- **A06** · 2026-09-10 · «Non ce l'ho ancora: costruisci col logo attuale (Recommended)» (l'opzione scelta alla domanda «Logo nuovo»). **Applicata:** `Logo.tsx` e i file `logo-domustua-*`.
- **A07** · 2026-09-10 · «inoltre non vedo piu il preloader». **Nessun cambio al codice:** il film suona solo alla prima visita della sessione, con motion ok e senza hash.
- **A08** · 2026-09-10 · «hai cambiato tutto , la hero rimettila con la foto sotto la scritta». **Superata da A10.**
- **A09** · 2026-09-10 · «lascia il nuovo font pero , non rimetterlo esattamente come prima , intendo solo le posizioni». **Applicata:** il lockup resta in `font-brand` 800. «Font nuovo» è la tipografia della rivista bianca, non un font consegnato; l'oggetto di `e6e34bd` («col font nuovo») si presta all'equivoco.
- **A10** · 2026-09-11 · «la foto nella hero va messa dietro la scritta Domus Tua, non più avanti, come era prima del cambiamento». **Applicata** (`09aff4b`): banda di 60svh con la foto dietro il lockup.
- **A11** · 2026-09-11 · «NIENTE SCRITTE BLACK». **Applicata:** `ink` = `graphite` = `--foreground` = #46423d. Per il #1f1f1f del riferimento vedi Q01.
- **A12** · 2026-09-11 · «dovevamo fare un redesign, ma mantenendo quelle animazioni che non erano curve, tipo quella del 5 stelle, lo scroll orizzontale nella sezione perché domus tua … come prima ma con il nuovo design, niente curvo». **Applicata** (`024d354`). PRODUCT.md, la spec, il commento di `app/page.tsx:61-63` e, fino a questa revisione, anche questo file la attribuivano al cliente, ma la fonte primaria cita Alberto. Domanda aperta: riferiva la cliente?
- **A13** · 2026-09-11 · «ok , ora dobbiamo rendere ancora piu bello però , perchè con questo redesign , sono emersi un sacco di cose brutte e formattate male , a livello  layout , e di scelta . come il menu sopra». **Applicata** (`6e6559b`): testata su una riga, sei voci. `6e6559b`, `site.ts:320-322` e i commenti di `Header.tsx` la danno al cliente. Domanda aperta.
- **A14** · 2026-09-11 · «la posizione delle foto e dei video etc.». **Applicata** con D03. `5304dfd` e il commento di `moduli-media.test.ts` la danno al cliente; la domanda aperta è la stessa di A13.
- **A15** · 2026-09-11 · «utilizza anche come riferimento il sito vecchio al quale avevamo preso spunto : eraresidence». **Applicata:** il dossier `reverse-engineering/era-residence/` è citato da HorizonScroller, Preloader, RotatingMark e TextLines, ed è servito a ripristinare l'ingresso del preloader. Supera il divieto di agosto su era-residence.
- **A16** · 2026-09-11 · «inoltre vedo che c'è un problema sul preloader , non è piu come prima . lo rivoglio come prima , l'animazione di entrata». **Applicata** col patto della porta (D06); la durata è rimasta 4,63 s. Domanda aperta sulla durata.

### Decisioni di lavoro
- **D01** · 2026-09-11 · sulla foto dell'hero solo lockup e firma, perché un H1 a 38 px sopra un divano non si legge. **Applicata.** È una scelta di leggibilità, non una parola di Alberto.
- **D02** · 2026-09-11 · sei voci primarie in testata; le altre tre nel menu del telefono e nel footer. **Applicata** (flag `primary` in `site.ts`).
- **D03** · 2026-09-11 · «Il rapporto della scatola segue il SORGENTE, non la griglia.» **Applicata:** i tre moduli media.
- **D04** · 2026-09-11 · «i `sizes` dichiarano i pixel chiesti, non la larghezza della scatola». **Applicata** (`01a1f20`); il conto non è verificato per ogni immagine.
- **D05** · 2026-09-10 · l'espresso solo per il pannello del preloader, nessuna sezione scura (spec §3.1, riga `--color-espresso` / `wine` della tabella dei colori, scritta in `67afc9e`). **Domanda aperta:** contraddice C17 e non ha un consenso esplicito.
- **D06** · 2026-09-11 · il patto della porta: sagoma e banda sono lo stesso scatto nella stessa scatola. **Applicata**; la regola `.dt-mob-band` è orfana.
- **D07** · 2026-09-11 · «Il territorio si illustra col territorio: la ripresa col drone». **Domanda aperta:** contraddice C10.
- **D08** · 2026-09-11 · «l'oro delle stelle leggeva mostarda sull'avorio: piu' caldo». **Applicata:** #d9a441 e la sua rampa. Fra i DIVIETI di PRODUCT.md c'è «niente oro (con l'eccezione non confermata delle stelle)»: domanda aperta.
- **D09** · 2026-09-11 · «L'etichetta lunga sparisce da tutte le superfici: resta la forma corta». **Applicata;** l'eccezione rimasta è `ServiziContent.tsx:132` (de).
- **D10** · 2026-09-11 · i nove passi solo su /metodo, le recensioni solo su /recensioni, le foto delle righe editoriali solo se sono tutte vere. **Applicata.**
- **D11** · 2026-09-11 · «Il rientro passa da -0.42em a -0.2em». **Applicata.**
- **D12** · 2026-09-11 · il numero delle recensioni è vivo: si rilegge dal widget ogni volta che si tocca. **Applicata:** `site.rating` "4.9", `site.reviewsCount` "542".
- **D13** · 2026-09-11 · le copertine rifilate come correzione dichiarata. **In attesa della cliente** (i fotogrammi puliti).
- **D14** · 2026-09-10 · testata in flusso: sticky solo sul telefono, da lg scorre via. **Applicata.**
- **D15** · 2026-09-11 · la testa delle pagine interne su due colonne, e il titolo dove la foto è scura. **Applicata.**
- **Q01** · 2026-09-11 · un inchiostro più scuro per i titoli «va chiesto a lui, non cambiato». **Domanda aperta.**

### Domande aperte
Nessuna è risolta qui.
1. **Colore del testo.** Il riferimento scrive titoli e corpo in #1f1f1f, Alberto ha ordinato «NIENTE SCRITTE BLACK» e l'inchiostro è #46423d. Accetta un inchiostro più scuro per i soli titoli (proposta #2e2a26)? Va chiesto ad Alberto.
2. **La foto dopo la ricerca.** `/media/hero-aerial.jpg` è di nuovo nel primo capitolo dopo la ricerca (pannello territorio, `360c76b`). Si toglie, o si chiede alla cliente se il divieto riguardava solo il fondale?
3. **Chi ha chiesto il ritorno dei set piece?** L'unica fonte primaria (`024d354`) cita Alberto. Se riferiva la cliente va detto; altrimenti i documenti che dicono «cliente» vanno corretti.
4. **«Menu sopra» e «posizione delle foto».** Li ha scritti Alberto l'11 settembre, ma `6e6559b`, `5304dfd`, `site.ts:320-322` e `moduli-media.test.ts` li danno al cliente. Alberto riportava un giudizio della cliente, o era un giudizio suo?
5. **Il preloader «come prima».** Comprendeva anche la durata di 9,26 s (`TEMPO = 2`) o solo l'ingresso? Oggi dura 4,63 s, coerente con la risposta del 2026-09-10.
6. **Il testo sotto i 16 px del preloader** (0.68rem e 0.82rem): si porta a 16 px o si registra un'eccezione dichiarata?
7. **Il pannello espresso del preloader** contraddice «eliminare nero ovunque» e non ha un consenso esplicito né della cliente né di Alberto. Resta?
8. **Il disco carta sotto il badge del preloader** contraddice «metti il logo senza sfondo bianco» (la cliente, 2026-08-06). Resta?
9. **Il lockup del preloader in Playfair**, mentre quello dell'hero è in `font-brand`. Si allinea già ora a `--font-brand` o si aspetta il logo nuovo?
10. **«Box vendi casa più a destra».** Alberto l'ha ribaltata («rimettilo centrale»): va detto alla cliente?
11. **L'oro.** I DIVIETI di PRODUCT.md dicono «niente oro (con l'eccezione non confermata delle stelle)», il codice ha l'oro sulle stelle (#d9a441): il divieto va riscritto «oro solo sulle stelle»?

### In attesa della cliente
- **Logo nuovo e il suo font.** Non consegnati: in `public/` ci sono solo i `logo-domustua-*`, datati dal 2026-07-28 al 2026-08-06. Nel frattempo `--font-brand` = `var(--font-jakarta)`.
- **Fotogrammi puliti dei video**, a 1920×1080 (`ffmpeg -ss`): servono i file sorgente, che non sono nel repo. Nel frattempo `.dt-still-trim` in Voci e nella testimonianza in evidenza.
- **Ritratti singoli del team:** ne mancano cinque (Paloma Cavalcante, Eleonora D'Agati, Viola Benatti, Tiziana Galeone, Katya Fedrigo). In `app/lib/team.ts` solo Raffaela ha l'immagine; la rotaia usa per ora `team-red.jpg` e `team-group.jpg`.
- **Firma autografa reale:** `brand.signature` è vuota (`app/lib/brand.ts:34`); l'hero usa il nome in Pinyon Script, non una firma finta.
- **Parole vere dei clienti per le citazioni:** `FeaturedTestimonial.tsx` non rende più citazione, autore e contesto, perché erano inventati; `Reviews.tsx` mostra il banner «Esempi dimostrativi» quando le card sono demo.

### Commenti del codice rimasti indietro
Nessuno cambia il comportamento, ma chi li legge si fa un'idea sbagliata.
- `globals.css:30-33` («Playfair, la stessa dell'hero»): l'hero è in `font-brand`.
- `globals.css:105` («UN SOLO d1 per pagina»): la regola è del 2026-08-06 (`fb5af77`) e non vale più, /open-domus apre cinque capitoli con un d1.
- `globals.css:324` («≤ 50ch»): la classe vale 38ch.
- `globals.css:1677-1680`: il commento di `.display-tight` dice 0.96, il valore è 0.92.
- `globals.css:1058-1061`, `:1071-1072`, `:1106`, `:1151`: numeri di `TEMPO = 2`.
- `globals.css:1998` e `StarReviews.tsx:678`: il «velo di vino» non esiste più.
- `StarReviews.tsx:39`: «4,9/531», oggi 542.
- `HeroCinematic.tsx:399-401` e `:449-450`: il lockup «in alto» nella banda, mentre il codice lo centra.
- `Cta.tsx:5-11`: le varianti anello, morph e lift non esistono più.
- `Method.tsx:159-165`: le tre foto degli atti «stanno in `dt-media-full`» e la scatola è «larga 39vw»; il codice le mette in `dt-media-half !aspect-video` (`:225`), lo stesso 16:9 nella metà da 42vw.
- `Header.tsx:22-27`, `:214-215`, `:232`: la testata a due righe.
