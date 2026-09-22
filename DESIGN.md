---
name: Domus Tua — la rivista bianca
description: "Una rivista immobiliare stampata su un'unica carta avorio: titoli Playfair maiuscoli in vw/vh, paragrafi grandi e leggeri, media squadrati in tre moduli, inchiostro grafite e mai nero, rosso solo per accento e conversione."
colors:
  red: "#d20a0a"
  red-dark: "#a30707"
  ink: "#46423d"
  graphite: "#46423d"
  stone: "#625d56"
  line: "#e9c9c0"
  cream: "#f6d9d0"
  cream-deep: "#f2cfc5"
  paper: "#fdf1ec"
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
  chapter: "clamp(4.5rem, 10vh, 8rem)"
  chapter-mobile: "clamp(2.5rem, 6vh, 4rem)"
  gutter: "6vw"
  stack-sm: "1.5rem"
  stack-md: "2rem"
  block: "clamp(3rem, 8vh, 6rem)"
  block-lg: "clamp(4rem, 10vh, 8rem)"
  media: "clamp(1.5rem, 4vh, 3rem)"
  page-top: "clamp(2rem, 6vh, 4rem)"
  head-h: "clamp(4.5rem, 10vh, 6.5rem)"
  band-h: "calc(100svh - var(--dt-head-h) - 1px)"
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

Scritto dal costruito il 2026-09-10, dopo il redesign «rivista bianca», e riallineato al codice il 2026-09-13. La sorgente dei token è `app/globals.css` (`@theme inline`), i font arrivano da `app/layout.tsx` (next/font), le regole di composizione dai componenti in `app/components/`: dove questo file e il codice non coincidono vale il codice. Le regole che vengono da una direttiva portano accanto un richiamo breve all'origine, per esempio «(la cliente, 10 set.)», «(Alberto, 11 set.)» o «(decisione di lavoro)»; parole esatte, fonti e domande aperte stanno nella spec, §11 (vedi **Da dove vengono le regole** in fondo). Il sistema precedente (card, raggi, ombre, Fraunces) è archiviato in `docs/DESIGN.md` e non vale più.

## Overview

**Creative North Star: "La rivista bianca"**

Domus Tua è impaginata come una rivista immobiliare stampata su un'unica carta avorio: un solo fondo (#f6d9d0) dalla testata al piè di pagina, titoli Playfair Display maiuscoli che scalano col viewport (vw nell'hero, vh nei capitoli), paragrafi grandi e leggeri in colonna stretta, fotografie e video squadrati in tre soli moduli, e vuoto generoso tra un capitolo e l'altro. La ricchezza viene dalla misura della tipografia e dei media, non dalla decorazione.

**Riferimenti.** Il sistema ne ha due, con compiti diversi, e restano tutti e due. **immobiliaregoldengoal.it** è il riferimento visivo (la cliente, 10 set.): pulito, scritte grandi, niente card, foto e video grandi, spazi gestiti bene; le sue misure sono nel dossier `reverse-engineering/goldengoal/README.md`. **era-residence.com** è il riferimento per le tecniche di tipografia, movimento e struttura che il codice usa davvero (Alberto, 11 e 13 set.), dal dossier `reverse-engineering/era-residence/README.md`: la tipografia dei titoli (§2: Playfair come alternativa libera alla sua didone, la scala in vw dentro un `clamp`, interlinea e tracking stretti), il preloader con la maschera ad arco, la sua timeline d'ingresso e le sue ease (§4), il logo rotante (§5), i testi che salgono per righe con la curva `dtOut` (§7), lo scroller orizzontale pilotato dallo scroll con le parallasse interne (§11.1-11.2). Di era-residence restano fuori, per le direttive della cliente del 10 settembre, le cupole curve (§11.4), i fiori (§11.3) e le transizioni di pagina (§8). I due dossier sono gitignorati.

Il rosso Domus è un accento contato: l'eyebrow, al più una parola in corsivo Pinyon per capitolo, il «Tua» del lockup, i bottoni di conversione e i pulsanti tondi. Il testo è grafite su avorio, col secondario in pietra, e nel sito non c'è una scritta nera (Alberto, 11 set.). Nessun raggio, nessuna card, nessuna transizione di pagina curva (la cliente, 10 set.), nessuna ombra sulle superfici, nessun velo sulle foto (la cliente, 10 set.), nessuna superficie scura fuori dal sipario d'ingresso, che è a sua volta una domanda aperta. Il sito lascia alle spalle la home a card, curva e smussata, e le sezioni scure che l'hanno preceduta.

Il movimento è disciplina: tre gesti (righe che salgono da una maschera, fade-up, una deriva di parallasse quasi impercettibile), il monogramma che ruota in senso orario, il film d'apertura di 4,63 s e tre nastri pilotati dallo scroll da 1024 px in su: i pannelli orizzontali di «Perché Domus Tua» e il film delle cinque stelle (Alberto, 11 set.), la rotaia del team (la cliente, 10 set.). Tutti e tre sono sticky su un corridoio, nessuno usa il pin di GSAP. Delle «tante animazioni e transizioni» da eliminare (la cliente, 10 set.) restano tolte le transizioni di pagina, il cursore custom e il resto del WOW layer. Tutto è progressive enhancement: con reduced-motion o senza JavaScript la pagina è completa, ferma, e bella lo stesso.

**Key Characteristics:**
- Un solo fondo avorio (#f6d9d0) su tutto il sito; l'unica superficie scura è il pannello espresso del preloader, un'eccezione di lavoro ancora aperta.
- Titoli Playfair Display maiuscoli per foglio di stile, misurati in vw/vh e ricalibrati sotto i 1024 px; paragrafi Plus Jakarta Sans a 300 in colonna ≤ 38ch.
- Nessuna scritta nera: il testo è grafite #46423d, il secondario pietra #625d56; il rosso resta agli accenti e agli errori, il bianco sta solo sul rosso o sopra le immagini.
- Rosso #d20a0a solo come accento: eyebrow, corsivo di capitolo, «Tua» del lockup, CTA, pulsanti tondi, focus, selezione.
- Raggi a zero e nessuna card. Le poche curve rimaste sono inventariate in Shapes, e solo lì.
- Media in tre moduli (16:9, 1:1, 4:5), `object-cover`, senza velo né vignettatura; le lettere stanno sopra un'immagine solo in quattro punti dichiarati.
- Nessun testo delle pagine sotto i 16 px: l'UI sta a 1rem, il corpo a 19 px. Non la rispettano ancora il preloader e la mappa della ricerca: l'inventario è in «La regola dei 16 px».
- Tre gesti di motion, il monogramma rotante, il preloader e tre nastri pilotati dallo scroll; niente transizioni di pagina, niente cursore custom, niente fiori.

## Colors

Una tavolozza di carta e inchiostro caldo con un solo accento rosso, e due eccezioni circoscritte: l'oro sulle stelle e l'espresso nel sipario.

### Primary
- **Rosso Domus** (#d20a0a): l'unico accento. Eyebrow, parola-ornamento in corsivo, il «Tua» del lockup, i bottoni pieni e a contorno, i pulsanti tondi (play e WhatsApp a riposo; frecce, social e controlli sulle foto all'hover), il sottolineato dei link all'hover, l'anello di focus, il fondo della selezione del testo (con le lettere in avorio), la riga del chip selezionato, il fondo del filtro attivo, la riga del campo a fuoco. Mai come riempimento di superfici, mai come colore di un paragrafo.
- **Rosso cupo** (#a30707): lo stato hover e focus dei bottoni pieni e dei pulsanti tondi rossi. A riposo colora i testi rossi che stanno sull'avorio e devono reggere come testo, fra cui i messaggi d'errore e di conferma dei form, i chip dei filtri applicati nella ricerca, il contatore della mappa e il link di `Reviews`.

### Tertiary
- **Oro delle stelle**, quattro token: corpo (#d9a441), ombra (#a9812a), luce (#eed07a), speculare (#fff6d4). Esclusivamente le stelle della valutazione Google: le cinque da 16 px dell'hero, in `text-gold`, e il metallo della fila di StarReviews, dove i quattro token fanno le bande del gradiente e il riflesso che le percorre. Due valori, lì dentro, non passano dai token: il gradiente del corpo (`.dt-starrev_gold`) chiude al 100 % con un quinto oro scritto a mano, #bb9430, e l'alone (`.dt-starrev_halo`) sfuma verso `rgba(201, 162, 39, 0)`, il vecchio oro #c9a227 a opacità zero. La tonalità di oggi è più calda e più chiara di quella, che sull'avorio leggeva mostarda (decisione di lavoro, 11 set.). L'oro è il materiale della valutazione, non del marchio: mai su testo, bordi, CTA o superfici.
- **Espresso** (#1c1512): il fondo del solo pannello del preloader, con due gradienti radiali caldi (`rgba(150,26,24,.32)` in alto a sinistra, `rgba(24,12,12,.9)` in basso a destra) perché non sia un nero piatto. Sopra ci stanno la sagoma di Raffaela, il lockup in avorio, la firma in rosso e le didascalie in avorio al 60 e al 70 %. È un'eccezione (decisione di lavoro, 10 set.) che contraddice «eliminare nero ovunque» (la cliente, 10 set.): domanda aperta. Il token `--color-wine` (#2a100f) resta definito in `globals.css`, ma nessun componente lo usa.

### Neutral
- **Avorio** (#f6d9d0 — dal 22 set. 2026, A51 di Alberto: «il colore di sfondo della pagina che dovrebbe essere avorio, è ancora troppo chiaro, rendilo lievemente sul rosso rosa, tipo tramonto ma opaco e piu chiaro di un tramonto»; era #f9f5ef, e con lui la famiglia: avorio profondo #f2cfc5, carta chiara #fdf1ec, filo #e9c9c0; tinte.json rigenerato; inchiostro 7,3:1, rosso cupo degli occhielli 6,1:1 e pietra 5:1 sul nuovo fondo): il fondo di tutto: `--background`, `themeColor`, body, testata, footer, menu mobile, barra azioni mobile. Non cambia mai fra le sezioni.
- **Avorio profondo** (#f2cfc5): la testata del telefono quando scorre (con hairline sotto), la banda dell'hero e il rettangolo sotto ogni foto e video mentre carica. Non è un secondo fondo di sezione.
- **Carta** (#fdf1ec): il fondo a riposo delle icone social, del banner cookie e dei controlli tondi appoggiati sulle foto (chiudi, frecce di galleria), e il disco sotto il badge del preloader.
- **Inchiostro** (#46423d): il testo di base (`--foreground`), i titoli, le voci della nav, la riga sotto i campi, il bordo del banner cookie e delle frecce del carosello. È la stessa grafite del lockup (Alberto, 11 set.: «NIENTE SCRITTE BLACK»). Il quasi-nero #1a1816 non è più l'inchiostro e in pagina non compare; resta nell'immagine Open Graph (`app/opengraph-image.tsx`), che non segue ancora la regola. Mai #000.
- **Grafite** (#46423d): i paragrafi editoriali (`.lead`), il corpo di testo dei capitoli, il «Domus» del lockup, le icone social a riposo, i filtri della ricerca a riposo. Vale lo stesso colore dell'inchiostro: il primo nome dice «il testo di base», il secondo «il paragrafo editoriale», e la gerarchia la fanno peso e misura.
- **Pietra** (#625d56): il testo secondario, cioè etichette dei campi e dei filtri, chip non selezionati, sovratitolo dell'hero, voci secondarie del menu del telefono, ruoli sotto i nomi, riga legale, orari, placeholder.
- **Filo** (#e9c9c0): il colore di bordo di default (`* { border-color }`): hairline della testata scorsa, del footer, delle voci del menu mobile, dei separatori; bordo delle icone social e dei filtri a riposo.
- **Bianco** (#ffffff): l'inchiostro delle superfici rosse (bottoni pieni, pulsanti tondi, tooltip, filtro attivo) e delle lettere che stanno sopra un'immagine senza velo: il titolo-copertina delle cinque stelle, il titolo d1 e il link della banda di congedo. Mai su avorio.

### Named Rules
**La regola dell'unico fondo.** Tutto il sito sta su un solo avorio (#f6d9d0): nessuna sezione cambia fondo, nessuna banda di tono, nessuna card. Il taglio fra le sezioni non si deve percepire (la cliente, 6 ago.). L'unica superficie scura è il pannello del preloader, che sparisce dopo 4,63 s e non torna nella sessione.

**La regola del rosso contato.** Il rosso è un accento puntuale, non un colore di riempimento: eyebrow, un corsivo per capitolo, «Tua» nel lockup, CTA e pulsanti tondi. Se in una schermata il rosso occupa più di un bottone e una parola, è troppo.

**La regola dell'oro sulle stelle.** Oggi l'oro (#d9a441 e la sua rampa) sta solo sulle stelle della valutazione. La tonalità è una decisione di lavoro (11 set.); se il divieto dell'oro vada riscritto come «oro solo sulle stelle» è una domanda aperta. Se serve calore altrove, la strada è avorio profondo o carta, mai l'oro.

**La regola dell'inchiostro grafite.** Nessuna scritta è nera: `ink`, `graphite` e `--foreground` valgono #46423d (Alberto, 11 set.). Il riferimento scrive titoli e corpo in #1f1f1f, quasi nero, ed è probabilmente per questo che la pagina può leggere slavata accanto a lui. Un inchiostro più scuro per i soli titoli (proposta #2e2a26) va chiesto ad Alberto, non applicato: è una domanda aperta, e finché non risponde tutto resta #46423d.

## Typography

**Display Font:** Playfair Display (con Georgia, serif): `--font-display` e `--font-hero`, tondo e corsivo vero
**Body Font:** Plus Jakarta Sans (con system-ui, sans-serif): `--font-sans`, variabile, `font-feature-settings: "ss01", "cv01"`
**Brand Font:** `--font-brand`, oggi `var(--font-jakarta)`, cioè Plus Jakarta Sans 800, come segnaposto finché la cliente non consegna il logo nuovo (Alberto, 10 set.: «Aspetto il logo nuovo»); quando arriva si ripunta solo in `globals.css` e in `layout.tsx`. Tutte le scritte «Domus Tua» vanno nel font del logo (la cliente, 10 set.)
**Script Font:** Pinyon Script 400 (con cursive): `--font-script`, il corsivo rosso

**Character:** Una didone maiuscola enorme che fa da titolo di rivista, accompagnata da una sans umanista tenuta leggera (300) nei paragrafi e sicura (600, maiuscola, spaziata) nei bottoni e nelle etichette; al più una parola calligrafica rossa per capitolo fa da ornamento.

### Hierarchy
- **Hero / lockup** (800, `clamp(3.1rem, 13vw, 13rem)`, 0.9, tracking −0.02em, `--font-brand`): il solo wordmark «Domus Tua» delle pagine, nella banda del primo schermo della home. Sta su due righe centrate, «Domus» in grafite e «Tua» in rosso, in maiuscole e minuscole come il logo. Non è un h1: è un `div`, ed è per questo che sfugge al maiuscolo. La tipografia del lockup è rimasta quando le posizioni sono tornate quelle di prima (Alberto, 10 set.: «lascia il nuovo font pero … intendo solo le posizioni», dove il font nuovo è la tipografia della rivista bianca, non un font consegnato). Il lockup del preloader invece è in Playfair 500 a 11vh (`font-hero`): se allinearlo già ora a `--font-brand` o aspettare il logo nuovo è una domanda aperta.
- **d1** (500, `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)`, 0.98; sotto i 1024 px `clamp(2.55rem, 9.5vw, 7.5rem)`): la testa di capitolo che possiede tutta la larghezza. In home sono la testa sopra i pannelli di «Perché Domus Tua», il Metodo (allineato a destra) e la banda di congedo; nelle pagine interne è la testa di ogni capitolo a tutta larghezza (/open-domus, /vendi, /acquista, /chi-siamo, le righe editoriali, le FAQ), più il titolo della scheda immobile. A 300 in pietra o grafite fa anche i numeri delle righe numerate e delle statistiche, e su /recensioni il voto 4,9/5. Non vale più «uno per pagina»: /open-domus apre cinque capitoli con un d1. L'h1 delle pagine interne non è d1: PageHero ha una misura sua (vedi Layout).
- **d2** (500, `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)`, 1; sotto i 1024 px `clamp(2.15rem, 7.4vw, 4.5rem)`): la testa in mezza colonna accanto a una foto (l'intro del Team), la testa del capitolo che apre un carosello (Voci, ≤ 16ch), il manifesto di «Perché Domus Tua».
- **d3** (500, `clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem)`, 1.05; sotto i 1024 px `clamp(1.5rem, 4.8vw, 2.6rem)`): l'H1 dell'hero (sotto la banda, ≤ 28ch), la citazione della fondatrice (in tondo), i sei nomi sotto la rotaia del team, i titoli dei servizi, i titoli in mezza colonna.
- **d4** (300, `clamp(1.45rem, 1.8vw, 1.75rem)`, 1.2): i titoli di colonna del footer e delle liste (Open Domus, D.O.C.), il sottotitolo in pietra sotto una testa di capitolo, il link della banda di congedo. Un h4 nudo resta a 400 per regola globale.
- **Lead** (300, `clamp(1.35rem, 1.72vw, 1.55rem)`, 1.4; sotto i 1024 px `clamp(1.3rem, 3.1vw, 1.55rem)`; grafite; massimo 38ch): il paragrafo editoriale, uno o due per capitolo subito dopo il titolo, ed è la classe più usata del sito. Il limite è 38ch e non 50 (decisione di lavoro, 11 set.) perché con Jakarta 300 a 25 px il `ch` è largo: 50ch risolvevano a 895 px, cioè 82 caratteri per riga, mentre il riferimento tiene le sue colonne fra 403 e 807 px.
- **Body** (400, 1.1875rem = 19 px, 1.5): il testo corrente, le liste del footer, i campi, i titoli dei video; colonna ≤ 60ch.
- **UI** (400, 1rem, 1.3): il minimo del sito, cioè riga legale, testo del banner cookie, consenso, voto e conteggio recensioni, voci secondarie del menu del telefono.
- **Label** (600, 1rem, tracking 0.08em, MAIUSCOLO): bottoni (interlinea 1.2; sotto i 640 px tracking 0.05em), etichette dei campi e dei filtri (pietra), chip, sovratitolo dell'hero, didascalie della rotaia del team.
- **Eyebrow** (500, 1rem, tracking 0.12em, MAIUSCOLO, rosso, preceduto da un trattino di 1.75rem × 1 px al 60 %): l'occhiello di capitolo. È più leggero e più aperto della label apposta (decisione di lavoro, 11 set.): occhiello, bottone ed etichetta di un campo erano la stessa riga maiuscola, e a fare la gerarchia restava solo il rettangolo rosso.
- **Nav** (400, 1rem, tracking 0.1em, MAIUSCOLO, inchiostro): le sei voci della testata e, in pietra, le tre secondarie del menu del telefono. Il toggle «Menu/Chiudi» sale a 600.
- **Script** (400, `clamp(2.6rem, 7vw, 7rem)`, interlinea 0.8 in `.script-word`; sotto i 1024 px `clamp(3rem, 11vw, 7rem)`; rosso; Pinyon): la parola-ornamento, `aria-hidden`, con rientro 14vw sopra i pannelli di «Perché Domus Tua», 24vw sul telefono e 6vw da lg nelle pagine interne, nessun rientro nel Metodo. In PageHero, da lg, scende con la colonna anche il corpo, a `clamp(2.6rem, 5.6vw, 6rem)`: alla misura piena una calligrafia lunga come «Domande frequenti» usciva dalla colonna e finiva addosso al lead. Nell'hero è la firma «Raffaela Rizza» a `clamp(2.2rem, 6vw, 5.5rem)`: la firma autografa reale non esiste ancora, e il sito non ne finge una.

### Named Rules
**La regola del maiuscolo.** h1–h4 sono maiuscoli per foglio di stile (`text-transform: uppercase`), a 500 (h1–h3) e 400 (h4); le citazioni no. Chi ha bisogno di un titolo in tondo minuscolo usa un elemento non-heading, come fa il lockup.

**La regola dei 16 px.** Nessun testo delle pagine sotto 1rem (la cliente, 10 set.: «nessuna scritta piccola»): l'eyebrow sta a 16 px, la riga legale a 16 px, il sovratitolo dell'hero a `text-ui`, e sotto i 768 px i campi sono forzati a 16 px (`!important`) perché iOS non zoomi. Oggi non la rispettano due posti, e questo è l'inventario completo a cui rimandano gli altri documenti. **Il preloader**: le didascalie «Immobiliare» e «dal 2007» a 0.68rem (circa 11 px) e il payoff a 0.82rem (circa 13 px, `PreloaderShell.tsx`); se portarle a 16 px o dichiarare un'eccezione è la domanda aperta 6 della spec, §11.3. **La mappa della ricerca** (`PropertyMap.tsx`), che nessuna direttiva ha deciso: le cifre dei segnaposto hanno un corpo in linea calcolato dalla loro misura, da 11 a 16 px; quelle dei cluster vanno da 14 a 23 px e restano sotto i 16 solo nei cluster più piccoli (14-15 px); il tooltip all'hover (`dt-tip`) e la riga di attribuzione non hanno una regola del sito ed ereditano 0.75rem, cioè 12 px, da `.leaflet-container` (`leaflet.css`).

**La regola della colonna.** La taglia segue la colonna, non la gerarchia: il d1 va solo sulle teste che possiedono tutta la larghezza; in mezza colonna, accanto a una foto, la testa è d2 o d3 e il lead resta ≤ 38ch. Un titolo grande in colonna stretta non legge come editoriale, legge come un errore di impaginazione.

**La regola del corsivo unico.** Al più una parola Pinyon rossa per capitolo, mai come titolo semantico. La calligrafia segue il titolo senza margini propri e ne attraversa l'ultima riga con un rientro di −0.2em (`--script-tuck`; decisione di lavoro, 11 set.). Così passa la linea di base con le sole aste alte e il corpo resta sull'avorio; a −0.42em il rosso e la maiuscola grafite si intrecciavano a metà altezza e nessuno dei due si leggeva. Può scavalcare il bordo di una banda fotografica (la firma dell'hero con `--script-tuck: 0` e mezza lettera sulla foto; la calligrafia delle pagine interne, che ne attraversa il bordo alto per un terzo), ma non sta mai dentro una foto.

## Layout

Il modello spaziale è quello di una rivista a pagina unica: un margine laterale in percentuale, capitoli separati da vuoto misurato in altezza di viewport, un solo template a due colonne e media in tre moduli.

- **Riga** (`.dt-row`): padding laterale 8vw (5vw sotto i 768 px). Nessun `max-width` generale: il contenuto si ferma per misura di riga (lead 38ch, body 60ch, titoli 16–28ch), non per contenitore. I pochi tetti stanno dentro i set piece (il palco delle cinque stelle a 1240 px, il territorio a 1600 px), sotto l'hero, dove CTA e voto stanno in 640 px, e sullo Short in evidenza di «Perché Domus Tua», tenuto a 420 px da lg (vedi Components → La regola dei `sizes`).
- **Capitolo** (`.dt-chapter`): padding verticale `clamp(4.5rem, 10vh, 8rem)` (sotto i 768 px `clamp(2.5rem, 6vh, 4rem)`); la banda di Open Domus (`.dt-od_band`) apre col medesimo passo. Era 14vh come nel riferimento, che però ha sei capitoli: sui diciassette della home sommava 3.800 px di avorio vuoto a 1440×900 (Alberto, 20 set.: «la home è troppo lunga … riducendo la distanza tra una sezione e l'altra»). Ogni sezione della home è `dt-chapter` su avorio; nessuna banda cambia fondo.
- **Passo dei blocchi in home** (Alberto, 20 set.): fra la testa di capitolo e la prima riga, e fra una riga foto+testo e la successiva, il passo è `clamp(2.5rem, 6vh, 4.5rem)` (Paths, Metodo, Voci) o `6vh` (Servizi, rotaia del team); `clamp(4rem, 10vh, 8rem)` resta ai blocchi che chiudono un capitolo. Le riprese larghe (3:2, 16:9) di Paths e Servizi stanno nella metà forzata a 16:9 come gli atti del Metodo, non nel quadrato che ne buttava un terzo.
- **Griglia** (decisione di lavoro, 11 set.): un solo template a due colonne da lg (1024 px), `grid gap-[6vw] lg:grid-cols-2 lg:items-center`, col media da un lato e il testo dall'altro rientrato con `lg:pl-[6vw]` (o `lg:pr-[6vw]` sulla riga specchiata, che porta anche `lg:order-2` sul media). Le sette proporzioni su misura di prima facevano cominciare la colonna di testo in sei punti diversi, e scorrendo l'occhio non ritrovava mai la stessa linea verticale. Una riga rompe la griglia solo con un offset dichiarato e ripetuto (`lg:-mt-[8vh]` per risalire nel padding del capitolo), mai con una larghezza unica. Le liste vanno a 2 (md) e 3 (lg) colonne; il footer a `1.4fr 1fr 1fr 1fr` con gap 3rem.
- **Ritmo verticale dentro il capitolo**: eyebrow → titolo 1.5rem; titolo → lead 2rem; lead → CTA 2rem; blocco → blocco `clamp(3rem, 8vh, 6rem)` o `clamp(4rem, 10vh, 8rem)`; titolo → media `clamp(1.5rem, 4vh, 3rem)`; sopra il primo schermo delle pagine interne `clamp(2rem, 6vh, 4rem)`.
- **Primo schermo della home.** Si apre con la testata chiara. Sotto c'è la banda fotografica a tutta larghezza, alta `--dt-band-h` — **dal 20 set. (A44 di Alberto) lo schermo intero meno la testata**, `calc(100svh − testata − 1px)`, come su era-residence («la foto è il background stesso»); era 60svh e la foto restava col mento di Raffaela sul bordo — su avorio profondo, con la foto dietro il lettering: **dal 22 set. (A55 di Alberto: «vorrei invertire le posizioni di questa immagine con quella della hero») la foto VERA di Raffaela davanti alla villa con piscina**, lo scatto `villa-pool.jpg` che stava nella riga «Acquista» di Paths, ricodificato senza metadati da `scripts/media/hero-piscina.mjs`: `hero-raffaela-piscina.jpg` è 3:2, 1920×1280, la villa tutta in campo e Raffaela in piedi al centro sul bordo della piscina, intera (A27); 9:16 sul telefono (`hero-raffaela-piscina-m.jpg`, 720×1280, la striscia da x 660 con lei al 39-53 % della larghezza e la palma alla sua sinistra). La scena AMPIA generata con Higgsfield di A44/A45 (`hero-raffaela-villa.jpg`, il salotto a doppia altezza col ritaglio vero di Raffaela in basso a sinistra, `foto-alte.mjs`; il piano in `docs/superpowers/specs/2026-09-20-foto-alte-higgsfield.md`) è andata al posto della piscina in Paths, ancorata in basso; il suo 9:16 è uscito dal repo. Art direction a 768 con `getImageProps` e `<picture>`, `preload`, qualità 78, `object-cover`, `objectPosition: "10% 100%"`, riquadro dello zoom **ancorato in basso** col rapporto della sorgente (`--dt-hero-ar`: 1920/1280 da 768, 720/1280 sotto): a riposo la banda 16:9 mostra il piede del 3:2 con Raffaela intera, il cielo sopra il tetto serve agli schermi più alti che larghi. Il tuffo (A23) non fa più salire la foto — scoprirebbe il fondo — e resta il solo zoom a 2. Nessun velo. Il `<video>` si monta solo se è abilitato in `media.ts`, con motion ok e da 768 px. Sulla foto stanno solo due cose (decisione di lavoro, 11 set.: senza velo un H1 a 38 px sopra un divano non si legge, un lockup a 13vw si legge su qualunque stanza): il lockup «Domus Tua» su due righe — stava al centro della banda; **dal 22 set. (A55) sta in basso, centrato sul telefono e a destra da lg (`justify-end lg:items-end lg:text-right`), sull'acqua della piscina, e da lg le lettere scendono da 13vw a 10,5vw (`--text-hero-lg`, solo l'hero)**, perché Raffaela è al centro della foto e nessuna lettera deve coprirla: a 13vw la «D» le copriva le gambe a 1440 e a 1024 (scelta di qualità, da mostrare ad Alberto) — e a cavallo del bordo basso la firma Pinyon rossa (la cliente, 10 set.: «firma più in basso»). La firma sporge del 26 % (`--script-tuck: 0`), e per questo il blocco sotto le lascia l'aria per le discendenti. Sull'avorio seguono, centrati (Alberto, 10 set.: «rimettilo centrale») e ancora nel primo schermo, il sovratitolo (`text-ui` 600 maiuscolo, pietra), l'H1 d3 ≤ 28ch, «Richiedi la valutazione» piena in taglia `lg`, i due link «Vendi casa» → /vendi, al posto del bottone del video (la cliente, 10 set.), e «Cerco casa» → #cerca, e il voto «4,9/5 · 542 recensioni Google» con cinque stelle d'oro da 16 px. Niente subcopy, niente riga del founder. La banda è la stessa scatola della sagoma del preloader: vedi **Il patto della porta**.
- **Primo schermo delle pagine interne: «la testa di era»** (`PageHero` + `PageHeroTesta`; A38, A41, A45 e A46 di Alberto, 20-21 set.; lo usano 11 pagine, 9 con la foto della villa e 2 legali). **Il cielo delle foto alte è trasparente e la villa posa sulla carta** (A46 di Alberto, 21 set., sera: «su eraresidence questa foto che usa come background alta ha il cielo mascherato, è no bg: ecco perché sembra un tutt'uno il cielo con il colore dello sfondo del sito. Dobbiamo fare la stessa cosa nel nostro sito, dove ci sono le immagini così alte»): le sette teste col cielo montano `<nome>-cielo.webp` (alpha, stessa risoluzione, `scripts/media/cielo.mjs`; `tinte.json` porta per rotta `cielo: { file, linea, cima }`), i due attici restano interni. Le scritte, che con A38/A40 stavano «nel cielo» in bianco nudo, **tornano nell'inchiostro della rivista e stanno SOPRA il soggetto, mai sopra la foto**: occhiello rosso, h1 `--color-ink`, lead grafite, calligrafia rossa, bottone rosso pieno, link fantasma inchiostro (`ghost`), nessuna ombra, nessun `!`. Regola unica per le undici teste: dove la foto non ha cielo (attici, legali, la tenda di /open-domus) il blocco sta comunque sull'avorio e la foto comincia sotto i comandi. **La geometria** (globals.css «La testa di era»): il riquadro `.dt-testa_riquadro` è la CARTA, in flusso, `position: relative`, fondo `--color-cream`, `overflow: clip`, senza altezza propria (A45: la foto è la pagina, e scorre 1:1 — nessuno sticky, nessun pan, nessuno zoom, nessun pin); dentro, primo nel DOM, il blocco `.dt-testa_blocco`, in flusso, alto quanto il contenuto e da lg almeno 100svh, griglia a tre righe centrate come «Perfect sea views» (lead in alto sotto la testata, occhiello + h1 + calligrafia al centro, i due comandi in basso); poi lo strato `.dt-testa_strato`, IN FLUSSO, alto quanto la foto resa (`aspect-ratio: var(--dt-testa-ar)`, il rapporto del sorgente scritto da `PageHero`: 2146 px a 1440), portato SU fino alla CIMA del soggetto con `margin-top: calc(-100% * var(--dt-cielo-h))` — `--dt-cielo-h` è `cielo.cima` (la prima riga in cui almeno il 5 % dei pixel è opaco; sopra c'è solo cielo, cioè carta) in frazione della larghezza, `cieloH()` di `testa.ts` — così il soggetto comincia esattamente al fondo del blocco su ogni fascia (misurato il 21 set.: /vendi 470 px sotto la cima a 1440, i cipressi al fondo del primo schermo e il tetto a 1130; /acquista 863; interni e /open-domus 0, la foto tutta sotto il blocco). Non la `linea` (dove il soggetto riempie la larghezza): con lei l'h1 di /vendi posava sui cipressi e il bottone sul tetto. Sul telefono il blocco è alto quanto il contenuto e la foto 2:3 segue a larghezza piena (585 px a 390) con la cima subito sotto i comandi, senza buco d'avorio. I marcatori `.dt-testa_soggetto` (uno per banda `segno` di `tinte.json`: le corse in cui la striscia del segno, 2-6 % della larghezza, è opaca e scura, misurate da `scripts/media/tinte.mjs`; assoluti nella scatola della foto `.dt-testa_foto`, dentro lo strato, `data-bg="foto"`) danno al segno la sola villa scura: sul cielo, che è la carta, e sui muri bianchi il segno resta grafite (revisione del 22 set., C01/G02). Il placeholder prima del decode (D125, la tinta alta) sta sulla scatola della foto (`.dt-testa_foto`: da lg riempie lo strato, sotto lg è alta quanto la foto resa, così la tinta non colora mai lo spazio sotto la foto) e sulle sette teste col cielo è la carta stessa. L'h1 ha una misura sua, `clamp(3rem, 9vw, 9rem)` con interlinea 0.92, da lg `clamp(3.5rem, 7vw, 8rem)`, in colonna ≤ 18ch. **Lo spazio sopra la foto** (A48 di Alberto, 22 set.: «questo vale anche per /vendi /acquista /metodo domus e /opendomus … scrollo solo l'immagine e le scritte delle sezioni successive al posto di metterle durante l'immagine, le hai messe dopo … la ricerca intelligente dovrebbe essere più in alto, sopra l'immagine»; la sera, A54: «dobbiamo riempire più spazi possibili nelle foto alte a schermo intero … questo vale per tutte le pagine. home, vendi, acquista eccetera» e «metti una lieve ombra se non si legge, o fai le scritte più grandi»). Dentro lo strato, dopo la scatola della foto, `.dt-testa_sopra` porta IN FLUSSO i tre punti di prova e le sezioni che la pagina posa sulla foto (prop `sopra` di `PageHero`), e comincia subito sotto il blocco (`padding-top` = il cielo trasparente, `--dt-cielo-h`), così le sezioni riempiono la foto verso il basso. Da lg le scritte sono nel grigio del lockup, senza ombra (A56, 22 set. pomeriggio: «le scritte bianche sopra le immagini, mettile di colore grigio, come quello della hero della scritta "domus"»; fino ad A56 bianche con l'ombra attaccata alle lettere, il valore unico del sito, ink-media.ts, lo stesso delle cinque stelle; `ink-media.test` lo pinna carattere per carattere) e i corpi di testo salgono alla misura del lead; le utility di colore e di fondo dentro le sezioni cedono al bianco e al trasparente (regole unlayered sotto il cancello `data-sopra="foto"`, che PageHero mette sulle nove teste con la foto della villa; i due legali hanno `carta`). Sotto lg la foto 2:3 è alta 585 px a 390 e non regge una sezione: lo spazio sopra segue la foto, in inchiostro sull'avorio. Le sezioni sono atomiche (o tutta sulla foto o tutta sulla carta) e lo strato è alto max(foto, cielo + contenuto): la e2e a28 ferma una coda oltre il 5 % della foto. Cosa posa oggi: /vendi i tre punti, «Costi chiari» e le tre leve; /acquista i tre punti e la ricerca intelligente intera (campo e cinque tendine; filtri di affinamento e risultati sulla carta in `#case`); /metodo le tre leve; /open-domus il claim di prodotto; /recensioni e /lavora-con-noi i tre punti. Il bianco nudo di A40 resta per il blocco della testa (che sta sull'avorio); per le sezioni sulla foto A54 lo supera perché, misurato il 22 set. per terzi della colonna del testo, sulle foto della villa il bianco nudo reggeva solo su prato e piscina (su /acquista il 52-77 % della foto, su /recensioni nessuna riga) e Alberto vuole le sezioni su tutta la foto. **La chiusura della foto** (A53, la sera del 22: «quando arriviamo alla fine della foto (dove c'è l'erba) la foto con un animazione si chiude, come qui», la cartolina del Congedo): `ChiusuraFoto.tsx`, montato da PageHeroTesta dopo lo spazio sopra. Quando il fondo dello spazio sopra passa la cima del viewport (da lg) la scatola della foto si ritira nella cornice della cartolina — 8 % sopra e sotto, 22 % ai lati; 4/14 su tablet e 4/10 sul telefono, dove parte quando il fondo della foto arriva al fondo del viewport — mentre sale, con lo scrub e l'ease dtCartolina, fino al 10 % (30 % sotto lg) del viewport: la meccanica della banda del Congedo sotto la soglia, senza sticky né pin, col clip sulla scatola della foto e mai su un antenato. Si arma solo se la coda libera sotto le scritte è almeno un quarto di viewport (su /vendi le sezioni arrivano al fondo della piscina e la foto finisce dritta); con reduced-motion e senza JS non succede niente. L'inquadratura (`objectPosition`) resta in `tinte.json` (`lg` / `sotto`, D180) e con lo strato al rapporto della foto non ritaglia nulla. Il layout è tutto in CSS prima del paint: con reduced-motion e senza JS la pagina è identica; CLS 0. **La deroga di Alberto a WCAG 1.4.3 (A38 + A40, «bianco nudo») è chiusa con A46**: h1 e lead reggono 4,5:1 sulla carta, misurato sui pixel resi da `e2e/a11y.spec.ts` (il numero di `qualita/a38/inquadrature.md` — otto rotte su nove sotto 3:1 — descrive lo stato di A40, superato). La testata sopra la testa è quella del resto del sito: nessun `data-su-foto`, nessuna voce bianca, la barra sticky sotto lg cream-deep come ovunque (D82 morta).
- **Media: tre moduli, non dodici.** `.dt-media-full` (tutta larghezza, 16:9), `.dt-media-half` (1:1) e `.dt-media-column` (4:5; col modificatore `--tall` 9:16). Da 64rem la metà e la colonna valgono 42vw, con un massimo di 640 px. Sono scatole: dentro ci va `<Image fill className="object-cover">` sopra avorio profondo. La metà e la colonna sono 3vw più larghe della loro traccia di griglia (42vw contro 39vw) e sconfinano nel gutter, così il loro bordo interno cade sulla mezzeria della pagina (x = 720 a 1440), la linea verticale che si vuole ritrovare scorrendo. Nella riga specchiata serve `lg:justify-self-end`, altrimenti la scatola sborda dal margine.
  - *Dove.* L'intro del Team usa la metà; le tessere del Team la colonna; lo Short in evidenza di «Perché Domus Tua» la colonna verticale (`dt-media-column--tall`, 9:16), che da lg risale di 10vw sotto il titolo e ha un tetto di 420 px, ed è l'unico uso vivo del modificatore; gli atti del Metodo la metà forzata a 16:9 (`!aspect-video`); PageHero la banda forzata a 4:5 / 16:9; il territorio di HorizonStory e le copertine di Voci la banda. Fuori modulo resta il ramo con le foto di `EditorialRows`, a `aspect-[4/3]`, che oggi nessuna pagina rende.
  - *Il quarto formato: lo slot del Congedo e lo schermo intero* (A35 e A42 di Alberto, 19-20 set.; `qualita/a35/direttive-video-entrata.md`). Da 1024×640 con motion ok la testa del Congedo è la riga a due colonne del sito: a sinistra il titolo (d1, una parola per riga) e il comando, a destra uno **slot 16:9 largo come la metà** (`min(42vw, 640px)`, a filo del margine) dove il video parte come miniatura; scorrendo, il foglio cresce fino allo **schermo intero** sticky 100vw × 100svh — lo stesso video a pieno schermo di prima — e poi la cartolina. Le due scatole si leggono dal DOM in viewport (`rettDi`, `useLastra.ts`): lo slot è un elemento vuoto che esiste solo con l'entrata. Sotto la soglia la banda è la 16:9 di sempre in flusso, alta almeno 70svh sul telefono, la testa a una colonna. Sulla fotografia nessuna lettera. **Il suono** (A44 di Alberto, 20 set. sera; già A30): le clip portano la voce di Raffaela (`scripts/media/congedo.mjs`: AAC/Opus, fade di 0,6 s ai due capi del loop, limiter a −1 dBFS, picco misurato −0,8 dB), e il suono parte **da solo** (A44: «automatico con l'audio attivo, senza che l'utente debba cliccare»; nessun interruttore): in vista `useAmbientVideo` con `audio: true` prova il play non muto; se il browser lo nega — Chrome e Safari lo fanno finché la pagina non ha ricevuto un clic, un tocco o un tasto, e lo scroll non conta — il loop parte muto e la voce si accende da sola al primo gesto ovunque nella pagina, ripartendo da 02:00 (l'unica scrittura di `currentTime` nel sito, nel hook). Chi ha già premuto il banner dei cookie o un bottone lo sente al primo passaggio. **Deroga dichiarata a WCAG 1.4.2** (audio che parte da solo oltre 3 s senza un comando proprio nella pagina): scelta di Alberto; fuori vista il video si ferma.
  - *Perché.* La posizione delle foto e dei video era fra le cose da rifare (Alberto, 11 set.); la risposta è una decisione di lavoro dello stesso giorno: **la scatola segue il sorgente, non la griglia.** Un fotogramma 2,5:1 dentro un quadrato ne butta il 60 % e lo ingrandisce, cioè taglia i volti e insieme li sgrana: le riprese larghe vanno in 16:9, i ritratti in 4:5, i quadrati solo a sorgenti quadrate, mai oltre ~1,05× di ingrandimento. Prima la home mostrava dodici larghezze di media diverse e tredici righe «foto | testo» di fila. Il test `moduli-media` presidia i quattro rapporti e i 42vw / 640 px.
- **Testata**: una riga alta `--dt-head-h` = `clamp(4.5rem, 10vh, 6.5rem)`, col logo ufficiale a sinistra e sei voci più la lingua a destra (Alberto, 11 set.: il «menu sopra» era fra le cose formattate male; dettagli in Components → Navigation).
- **Dove vivono i contenuti** (decisione di lavoro, 11 set.). L'ordine della home è: hero, posizionamento, ricerca, «Perché Domus Tua» (`#storia`), cinque stelle (`#recensioni`), Voci, percorsi, Metodo compatto, Open Domus, D.O.C., servizi, costi, testimonianza, social, team, contatti, congedo. In home il Metodo è `compact` (tre atti e un link ghost verso /metodo): i nove passi stanno solo su /metodo. Il capitolo recensioni (`<Reviews />`) vive solo su /recensioni, e il test lo pretende. `EditorialRows` mostra le fotografie solo se ogni riga ne ha una vera in `reali/`; oggi i suoi quattro chiamanti (Acquista, Open Domus, Servizi, Vendi) rendono tutti la lista numerata.
- **Elementi fissi**: WhatsApp tondo da 56 px in basso a destra da sm (640 px) in su. Sotto sm c'è la barra azioni (hairline sopra, avorio, CTA piena `sm` senza freccia + WhatsApp tondo da 44 px), e il footer riserva in fondo 7rem più la safe-area. Il banner cookie è fisso, centrato, largo al massimo 42rem.
- **Breakpoint**: quelli di Tailwind, cioè sm 640, md 768, lg 1024, xl 1280, 2xl 1536. Il motion ha due soglie proprie: 768 per gli effetti di sezione (parallasse a corsa piena, video del congedo) e 1024 per i set piece (nastri pilotati dallo scroll). Il monogramma della testata compare da xl.

## Elevation & Depth

Il sistema è piatto per scelta: i tre token ombra (`--shadow-card`, `--shadow-card-hover`, `--shadow-float`) valgono `none` e nessuna superficie si stacca dalla carta. La profondità la danno la misura (titoli enormi, media grandi), l'hairline in filo (#e9c9c0) come unico separatore, il rettangolo avorio profondo che precede ogni foto, e il movimento a due piani: la rotaia del team scorre mentre le foto panano in senso contrario, e le foto di capitolo derivano di pochi pixel. Nelle pagine non ci sono vetro né sfocature, e le foto non hanno velo né vignettatura (la cliente, 10 set.: «VIGNETTATURA NO !»): l'hero, le cinque stelle e il congedo sono foto nude. I gradienti esistono solo nel pannello del preloader e nel metallo delle stelle.

Dove le lettere bianche stanno sopra un'immagine, la leggibilità la regge un'ombra attaccata alle lettere (decisione di lavoro, 11 set.). A riposo sopra la foto non si vede nessun rettangolo: lo strato del lampo di StarReviews, `.dt-starrev_flash`, copre la foto ma resta a opacità 0 e si accende, in sola opacità, solo durante il lampo del film. Un residuo non l'ha deciso nessuna direttiva: il filtro cromatico `.photo-warm` (saturazione, contrasto, seppia e luminosità appena mossi) sui poster di `LazyYouTubeEmbed` e sulle foto di `PropertyGallery`.

### Shadow Vocabulary
- **Alone social all'hover** (`box-shadow: 0 12px 24px -12px rgb(163 7 7 / 0.55)`): l'unica ombra di scatola delle pagine (il badge di anteprima ne ha di sue, ed è fuori dal sistema: vedi Shapes), sotto un'icona social che sale di 3 px e diventa rossa. È una risposta allo stato, non un'elevazione a riposo.
- **L'ombra attaccata alle lettere sui media** (`text-shadow: 0 1px 2px rgb(0 0 0 / 0.35), 0 0 28px rgb(0 0 0 / 0.45)`, un valore solo: `INK_ON_MEDIA` in `app/lib/ink-media.ts` e l'utility `.dt-ink-media`, D80). Nata sul titolo del congedo — due raggi: 2 px staccano il bordo, 28 px reggono i fotogrammi chiari — oggi vive solo sulla copertina delle cinque stelle e sulla firma del preloader: dal 20 set. (A35) il Congedo non ha più lettere sul video, la testa sta in flusso sopra e il comando nella fascia sotto; e sulle teste delle pagine interne non c'è più bianco: dal 21 set. (A46) le scritte stanno sull'avorio, nell'inchiostro, sopra il soggetto della foto col cielo trasparente.
- **Ombra sulla copertina delle cinque stelle** (`text-shadow: 0 1px 2px rgb(0 0 0 / 0.25)`, in `StarReviews.tsx`): sul titolo-copertina bianco che esce per carattere.
- **Alone della firma nel preloader** (`text-shadow: 0 2px 28px rgba(28, 21, 18, 0.55)`, in `PreloaderShell.tsx`): sulla firma Pinyon rossa, non sul lockup; la stacca dalla sagoma e dall'espresso.
- **Filo degli anelli eco del preloader** (`box-shadow: inset 0 0 0 1px rgba(242, 235, 218, 0.22)`): il profilo di luce dei due archi che seguono la porta. Vive solo nel sipario.

### Named Rules
**La regola del piatto.** Nessuna ombra di scatola a riposo, nessun blur, nessun velo né vignettatura sulle foto. Se due cose vanno separate, le separa un'hairline di 1 px in filo o il vuoto. Un'ombra è ammessa solo attaccata alle lettere bianche che stanno su un'immagine, o come risposta allo stato (l'alone social).

## Shapes

Il linguaggio è squadrato (la cliente, 10 set.: «niente curvo»). È applicato nei token, dove `--radius-card`, `--radius-card-lg` e `--radius-field` valgono 0, e a mano: i bottoni hanno `border-radius: 0`, il tooltip social è un rettangolo con la punta, l'anello di focus è squadrato. Foto e video sono rettangoli a filo con `object-cover`, senza raggio, senza cornice, senza vignettatura. La transizione di pagina curva non esiste più: `PageTransition` è ridotto a uno stub.

**La finestra di Open Domus è la sezione «Architecture» di era-residence (A45 di Alberto, 21 set.: «non hai fatto quello che ti ho chiesto per la sezione rifatta di era residence di architecture»; A46, 21 set., sera: il cielo mascherato).** In home la foto che si apre a schermo intero (le tende, lo stage .75 → 1: spec 2026-09-13 §3.10) porta il TITOLO del capitolo, «Open Domus», in Playfair alla misura di «ARCHITECTURE», `clamp(2.6rem, 12vw, 13rem)` con interlinea 0,85, centrato e appoggiato al bordo alto della foto (`.dt-od_titolo`, assoluto nella `.dt-od_cornice`, 0,05em dentro), sopra la foto nello stacking e sotto lo schermo avorio: compare quando il buco delle tende arriva in cima, cioè quando la foto riempie lo schermo, e scala con lo stage. **Dal 21 set. (A46) il titolo è in INCHIOSTRO (`--color-ink`), scuro sul cielo che è il fondo pagina, come «ARCHITECTURE» negli screenshot di Alberto**; il bianco nudo di A40 valeva per il cielo fotografato. **Dal 22 set. (A47 di Alberto: «qua perchè hai tagliato l'immagine, deve continuare, abbiamo fatto le immagini alte apposta per poterci scrollare a schermo intero senza uscire dalla foto»; «questa sezione va sopra l'immagine di open domus») la foto è la facciata che SALE, `villa-facciata-sale-alta-cielo.webp` (il corridoio 9:16 di Higgsfield, 2160×3870, col cielo trasparente da `scripts/media/cielo.mjs`; misure in `app/lib/motion/finestra.json` da `scripts/media/finestra.mjs`: cima 0,246, bande del segno sulle travi), INTERA a ogni larghezza**: la scatola `.dt-od_window` ha il rapporto della sorgente (`--dt-od-ar`) e da lg riempie la cornice, che ha lo stesso rapporto; il cover non ritaglia nulla (`objectPosition: "50% 0%"`, `sizes` 100vw). Nel corridoio lo schermo agganciato mostra il primo schermo della foto (cielo, titolo, la terrazza alta) mentre le tende si aprono; dopo la pista di 200svh lo stage scorre via e la facciata prosegue sotto la piega, la sezione «Architecture» di era. **Il capitolo di Open Domus sta DENTRO la cornice, dopo la foto, ed è lo spazio sopra la foto delle teste (A48/A54)**: da lg comincia al 55 % dell'altezza della foto (`FINESTRA.sopra`, nel CSS `--dt-od-sopra` = 0,55 × h / w), nel grigio del lockup, senza ombra (A56, 22 set. pomeriggio; fino ad A56 in bianco con l'ombra di ink-media.ts) e coi corpi alla misura del lead; se il capitolo è più alto della foto la cornice cresce e la foto copre dalla cima; sotto lg il capitolo segue la foto in inchiostro. La finestra posa sulla carta (`--color-cream`) e a schermo intero gli angoli alti mostrano l'avorio della pagina. I marcatori del segno: `.dt-od_mark--f` è `foto-chiara` da +150svh fino al fondo dell'area (cielo, muri bianchi, travertino: grafite) e le travi scure delle pergole hanno i loro `.dt-od_soggetto` con `data-bg="foto"` (bande di finestra.json, come `.dt-testa_soggetto`). A fine coda la facciata si ritira nella cornice della cartolina (ChiusuraFoto, A53: Alberto, 22 set. pomeriggio, «deve rimpicciolirsi alla fine»), se sotto il capitolo resta almeno un quarto di viewport di foto. Il corpo del capitolo non ripete l'h2 (su /metodo e /open-domus, senza finestra, l'h2 sta nel corpo come prima). Sul telefono lo stesso titolo a 46,8 px su una riga in cima alla foto 9:16, sull'avorio del cielo, e l'otturatore di spec §3.10 apre la foto intera. La 3:2 col glicine (`villa-terrazze-glicine.jpg`) resta scena di riserva, senza WebP.

**La piega del video del Congedo (A35 di Alberto, 19-20 set.; deroga a C01 «niente curvo», come A18-A20 verso C03).** Il video finale della home parte piccolo, sul margine del testo, e cresce mentre si scorre; per il solo tempo dello scorrimento la fotografia si piega come un foglio — bordi curvi fino a 39 px su 1440×900, rotazione in piano fino a 5,5°, l'angolo alto-destro parte per primo (il vertex shader di lusion.co, `lastra.ts`) — e appena ci si ferma, in meno di un secondo, si distende da sola nella misura che ha. A riposo non c'è mai una curva, né bordi tondi, né cornici, né tinte; il video suona anche durante la piega (Alberto, 20 set.) e a foglio disteso è piatto e intero. Senza GPU, sotto 1024×640 e con moto ridotto il foglio non esiste: la miniatura cresce piatta o la banda è piena e ferma. Da mostrare alla cliente con la domanda 27 (`docs/da-chiedere-alla-cliente.md`).

Questo è l'inventario unico delle curve rimaste: gli altri documenti rimandano qui. Sono eccezioni costruite (decisioni di lavoro), non direttive. Nelle pagine sono di tre tipi. Il primo è il cerchio dei bottoni-icona:
- play da 96 px da desktop, 56 px sotto lg (Voci, testimonianza) o sotto md (le facciate `LazyYouTubeEmbed`), e 64 px sulla foto del video di /open-domus;
- frecce del carosello di Voci da 56 px (contorno inchiostro 1 px, pieno rosso all'hover);
- WhatsApp flottante da 56 px e WhatsApp della barra mobile da 44 px (rossi pieni);
- pulsante di ricerca da 56 px;
- icone social da 44 px (carta con bordo filo, poi rosso pieno, con l'alone all'hover);
- controlli sulle foto e maniglia del prima/dopo da 44 px;
- il segno + delle domande a fisarmonica (`FaqList`, /lavora-con-noi, /open-domus), in un cerchio da 32 px senza fondo né bordo: il raggio c'è ma non si vede;
- nell'assistente in chat, oggi spento (`NEXT_PUBLIC_ENABLE_ASSISTANT`), il lanciatore da 56 px, il bottone d'invio e i due controlli della testata da 44 px; accanto al titolo c'è anche un disco rosso da 40 px con l'icona della chat, l'unico cerchio che non è un controllo.

Il secondo è il disco rosso da 28 px con una cifra bianca a 600 nella legenda della mappa (`PropertyMap.tsx`), l'unico cerchio che contiene un carattere. Mostra come dovrebbero apparire i segnaposto, ma i segnaposto che Leaflet disegna (`.dt-marker__badge`, da 24 a 38 px secondo il numero di immobili; i cluster da 34 a 52 px) non hanno una regola CSS in nessun foglio del repo: nel codice sono una cifra senza fondo e senza raggio, e la legenda promette un disco che la mappa non disegna (non verificato a schermo). Il terzo sono gli indicatori di stato: la pista della rotaia sotto i 1024 px (2 px × 4rem, `rounded-full`, col cursore rosso anch'esso arrotondato, `RailProgress.tsx`), lo spinner tondo che prende il posto dell'icona nei bottoni d'invio (`Cta.tsx`) e nel pulsante di ricerca, e i tre puntini da 8 px con cui l'assistente dice che sta scrivendo.

Nel preloader le curve sono tre: la porta ad arco, i due anelli eco che la seguono (bordo alto arrotondato) e il disco carta sotto il badge. L'arco fa parte del film che Alberto ha voluto uguale e dimezzato (10 set.) e di cui ha rivoluto l'ingresso (11 set.). Il disco carta contraddice «niente curvo» (la cliente, 10 set.) e «metti il logo senza sfondo bianco» (la cliente, 6 ago.): domanda aperta. Le stelle di StarReviews sono poligoni a dieci vertici, senza curve.

Fuori dal sistema delle pagine restano il cromo di anteprima e di sviluppo e le immagini generate, che non sono un modello da riusare:
- il badge di anteprima (`PreviewBadge`, montato nel layout ma visibile solo con `NEXT_PUBLIC_PREVIEW_BADGE=true`): una pastiglia tonda e un pannello `rounded-2xl`, con ombre di scatola, sfondo sfocato ed etichette a 0.68rem;
- il segnaposto del logo mancante (`LogoMissing` in `Logo.tsx`, solo in sviluppo o in anteprima e solo se manca il file): un riquadro `rounded-lg` tratteggiato con la scritta a 0.62rem;
- la redazione d'area (`/area-review`, 404 se non è configurata): uno strumento interno, con raggi e scritte piccole di proposito;
- l'icona del sito (`app/icon.tsx`, raggio 56 su 256 px) e l'immagine Open Graph (un disco e una pastiglia).

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
**La regola del cerchio.** Nelle pagine il cerchio serve a tre cose sole: il bottone-icona tondo, il disco numerato della mappa (una cifra, mai una parola) e gli indicatori di stato (la pista della rotaia, lo spinner, i puntini dell'assistente); fa eccezione il disco con l'icona accanto al titolo dell'assistente, oggi spento. Una parola, una foto o un blocco di testo stanno sempre in un rettangolo a spigolo vivo.

## Components

I componenti sono pochi e sono tipografia: un bottone rosso, un link maiuscolo sottolineato, un campo con la sola riga sotto, e il cerchio per le icone. Tutte le regole `.dt-*` stanno fuori dai layer Tailwind: battono le utility, e per sovrascriverle serve il prefisso `!`.

### Buttons
Rettangoli maiuscoli, senza raggio, con il rosso come unica tinta. La base `.dt-btn` è inline-flex con gap 0.6rem, etichetta a 1rem 600 maiuscola con tracking 0.08em, interlinea 1.2 e transizione di 0.25 s su fondo, colore e bordo; su puntatore grosso l'altezza minima è 2.75rem. Sotto i 640 px il padding laterale scende a 1.25rem e il tracking a 0.05em: a 390 px la colonna del bottone è larga 302 px, e 32 px per lato più 0.08em ne costavano ~90, cioè la ragione per cui tutte le CTA lunghe andavano a capo (il test `moduli-media` presidia i due numeri). La freccia (ArrowUpRight, 1.1em) segue l'etichetta di default; hero, barra mobile e menu la tolgono.
- **Shape:** spigolo vivo (`border-radius: 0`).
- **Primary (`cta-solid`):** fondo rosso, testo bianco, bordo di 1.5 px rosso; padding 1.05rem 2rem (md), 0.8rem 1.4rem (sm, la barra mobile), 1.2rem 2.4rem (lg, hero e pagine interne). È «Richiedi la valutazione» → /valutazione-immobile-tradate, una per schermata.
- **Etichetta:** la forma corta ovunque (decisione di lavoro, 11 set.): it «Richiedi la valutazione», en «Request a valuation», fr «Demander l'estimation», de «Bewertung anfordern», es «Solicita la valoración». Il test `moduli-media` vieta il ritorno dell'etichetta lunga. L'unica eccezione rimasta è l'heroPrimary tedesco di `ServiziContent.tsx`, «Fordern Sie die Bewertung Ihrer Immobilie an».
- **Hover / Focus:** fondo e bordo rosso cupo (#a30707); focus visibile con outline di 2 px rosso.
- **Secondary / Ghost / Tertiary:**
  - *Outline* (`cta`): fondo trasparente, testo e bordo di 1.5 px rossi; all'hover si riempie di rosso con testo bianco, stesso padding.
  - *Ghost*, il link maiuscolo: nessuna scatola, padding 0.4rem 0, testo inchiostro sottolineato (1.5 px, offset 0.35em), rosso all'hover. È «tutto il resto»: i rilanci di capitolo, le CTA del footer, «Vendi casa / Cerco casa» sotto l'hero, WhatsApp nel menu del telefono.
  - *Ghost-dark*: la variante bianca (hover avorio), vive solo sulla banda di congedo, a d4 300 con l'ombra sulle lettere.
  - *Send*: il submit dei form lead, identico al primary; da `disabled` va a opacità 0.6, con cursore d'attesa e uno spinner al posto dell'icona.
  - `reveal` e `reveal-cream` sono alias di `cta-solid`.

### Chips
- **Style:** testo, non pillole. Il selettore d'intento del form («Voglio vendere», «Cerco casa»…) è una fila di etichette maiuscole a 1rem 600 con tracking 0.08em, in pietra, alte almeno 2.75rem, con sotto una riga di 2 px trasparente.
- **State:** selezionato vuol dire riga sotto rossa e testo inchiostro (`aria-pressed`); all'hover il testo diventa inchiostro. Nella ricerca immobili (A52 di Alberto, 22 set. sera: «cambiamo il design della ricerca per renderlo consono al resto del sito, attualmente è orribile, poco professionale») i rettangoli con bordo sono morti: zona, budget, locali, tipologia e contratto sono cinque TENDINE nella forma dei campi del modulo, in una riga, sotto il campo in linguaggio naturale (alla misura d4) e la sua riga di stato, tutto in un blocco solo (`.dt-ricerca`) sulla foto della testa di /acquista; gli affinamenti (caratteristiche, venduti) stanno sulla carta sopra i risultati come i chip del modulo: testo maiuscolo 1rem 600, riga sotto di 2 px rossa quando selezionato, inchiostro all'hover.
- **Filtri applicati:** sopra i risultati, ogni filtro numerico in uso (prezzo minimo, superficie minima, superficie massima) diventa un chip che si toglie col clic, «da … m²» con una × in coda (`PropertySearch.tsx`). È un rettangolo con bordo di 1 px rosso, padding 0.25rem 0.75rem, altezza minima 44 px, etichetta 600 maiuscola con tracking 0.08em in rosso cupo; all'hover si riempie di rosso col testo bianco. Il bordo rosso lo separa dai filtri in filo: quelli si scelgono, questo è già in uso.

### Cards / Containers
Non esistono card: nessuna superficie rialzata, nessuna cornice attorno a foto o testo, nessun fondo di riquadro. Un «blocco» è titolo + testo + hairline. I soli pannelli del sito sono due, entrambi senza raggio. Il banner cookie ha fondo carta, bordo di 1 px inchiostro, padding di 1–1.25rem, larghezza massima 42rem, ed è fisso. Il pannello del menu mobile è avorio pieno.

### Inputs / Fields
- **Style:** nessuna scatola, solo la riga sotto: 1 px inchiostro, fondo trasparente, padding verticale 0.75rem, testo body (19 px) in inchiostro, placeholder in pietra. L'etichetta sta sopra, a 1rem 600 maiuscola con tracking 0.08em, in pietra. La tendina toglie la freccia nativa (`appearance-none`) e ne disegna una a tratto; la textarea si ridimensiona in verticale; il checkbox è da 20 px con `accent-color` rosso.
- **Focus:** la riga sotto diventa rossa, senza outline (i campi sono l'eccezione all'anello globale).
- **Error / Disabled:** la riga sotto è rossa già a riposo e il messaggio sta sotto, in rosso; sotto i 768 px ogni campo è forzato a 16 px.

### Navigation
- **Testata** (Alberto, 11 set.: il «menu sopra» fra le cose «formattate male»). È una riga sola, alta `--dt-head-h`, col logo ufficiale a `clamp(150px, 13vw, 210px)`; il monogramma rotante da 56 px lo accompagna solo da xl (1280 px).
  - *Da lg.* Le sei voci primarie (decisione di lavoro, 11 set.: Vendi, Acquista, Metodo Domus, Open Domus, Chi siamo, Contatti) stanno a 1rem 400, maiuscole, con tracking 0.1em, in inchiostro, a 2rem l'una dall'altra, con la lingua sulla stessa riga. `nav` in `app/lib/site.ts` resta la fonte unica e il flag `primary` sceglie le sei; Servizi, Recensioni e Lavora con noi vivono nel menu del telefono e nel footer. Nessuna CTA in testata: l'azione sta nell'hero e nelle pagine. Hover, focus e pagina corrente sono un sottolineato di 1 px con offset 0.45em.
  - *Comportamento* (decisione di lavoro, 10 set.). Sotto lg la testata è sticky: trasparente a riposo, e dopo 24 px di scroll (o col menu aperto) passa ad avorio profondo con hairline in filo, con una transizione di colore di 0.3 s. Da lg è `relative`, trasparente, e scorre via come nel riferimento.
  - *Menu del telefono.* Il toggle è la parola «Menu/Chiudi», a 600, sottolineata. Il pannello, fisso sotto la testata e avorio pieno, contiene le sei voci in Playfair 500 maiuscolo a `clamp(1.75rem, 7.5vw, 2.3rem)` separate da hairline (la corrente in rosso), poi le tre secondarie su una riga a 1rem in pietra, poi la CTA piena senza freccia, WhatsApp come link ghost e la lingua.
- **Footer:** chiaro, in flusso, con hairline sopra. Da lg ha quattro colonne a `1.4fr 1fr 1fr 1fr` con gap 3rem (marca e payoff, contatti, dove e orari, naviga), titoli d4 a 300 e liste in body; link nudi sottolineati all'hover (offset 4 px), icone social tonde, e la riga legale a 1rem in pietra sopra un'altra hairline. In fondo riserva 7rem più la safe-area per la barra mobile.
- **Barra azioni mobile** (sotto 640 px): fissa in basso, avorio con hairline sopra, CTA piena `sm` senza freccia a tutta larghezza più WhatsApp tondo da 44 px.

### Testa di capitolo
La cellula che apre ogni sezione: eyebrow rosso con trattino → titolo Playfair d1 o d2 maiuscolo → eventuale parola Pinyon rossa che ne attraversa l'ultima riga → lead in grafite ≤ 38ch → link ghost. Il Metodo la allinea a destra, tutte le altre a sinistra. Il motion: eyebrow, lead e link entrano con `Reveal` (opacità da 0 a 1 e salita di 2.5rem, 0.9 s, ease-out-expo, ritardi a scalare di 80–200 ms, reversibile all'uscita); il titolo entra con `TextLines` (SplitText per righe con maschera, da 112 % a 0, 1.05 s expo.out, stagger 0.09 s, trigger all'86 % del viewport, reversibile), la tecnica dei testi per righe di era-residence (dossier §7).

### La regola dei `sizes`
`sizes` descrive i pixel chiesti, non la larghezza della scatola (decisione di lavoro, 11 set.). Con `object-cover` una fotografia più larga della cornice viene resa più larga della cornice, e la parte in più esce dal taglio: in una scatola 4:5 una sorgente 3:2 è resa larga una volta e mezza l'altezza, cioè quasi il doppio della larghezza. Il conto è `larghezzaResa = altezzaScatola × rapportoSorgente` quando la sorgente è più larga della scatola, `larghezzaScatola` altrimenti. Scritto con la larghezza della scatola, il loader manda 719 px dove ne servono 1.134 e la foto è molle. I valori oggi:
- la foto delle teste: `100vw` su ogni fascia (`SIZES_TESTA`): lo strato è largo il 100 % col rapporto della foto e il cover non ritaglia (A45); il conto per fold di D183 (151vw sotto lg per un 2:3) chiedeva il bucket 1920 a 390 @3 dove basta il 1280, +45…+72 KB sull'immagine LCP (revisione del 22 set., C02/P01/G03);
- tessere del Team: `(max-width: 640px) 146vw, (max-width: 1024px) 98vw, 79vw`;
- intro del Team: `(max-width: 1024px) 150vw, 63vw`;
- copertine di Voci: `(max-width: 768px) 143vw, (max-width: 1024px) 66vw, 46vw`;
- poster del congedo: `(max-width: 767px) 200vw, 100vw`;
- copertina dello Short in evidenza (`posterSizes` in `HorizonStory.tsx`): `(max-width: 1024px) 284vw, 1328px`.

Il conto non è stato rifatto immagine per immagine. Il caso estremo è proprio lo Short: la copertina arriva da YouTube in 16:9 e dentro una scatola 9:16 è resa larga 3,16 volte la scatola. Per questo quella colonna ha un tetto di 420 px da lg: lì servono 1.328 px di sorgente e ce ne sono 1.280, mentre a 605 px ne servirebbero 1.911. Il tetto si toglie quando arriva un fotogramma vero 1080×1920.

### La lama: il ruolo `media` (A36 di Alberto, 19-20 set.; D200-D219)
Ogni fotografia non a schermo intero dentro uno dei tre moduli, che non sia in vista al carico e non porti già il gesto del suo capitolo, entra come su era-residence: il modulo (`LamaMedia`, `[data-lama]`) apre un ritaglio a parallelogramma dal bordo, con un lato inclinato del 25 % che si raddrizza mentre corre, e nello stesso tempo la foto dentro (`[data-lama-inner]`) scivola di X % e si assesta. 1,2 s `dtInOut` con ritardo 0,3 s (0,1 in più per ogni membro di un `[data-lama-group]`), uscita risalendo sotto l'85 % in 0,4 s `dtIn` con la foto ferma; a metà entrata la corsa torna indietro. È un ruolo comune come quelli del testo, uguale ovunque: due IntersectionObserver propri, niente ScrollTrigger, `will-change` solo in corsa; con reduced-motion e senza JS nessuno stile, foto intera. Differenze dichiarate dal riferimento: scala 1 sempre (A27: nessuna foto tagliata in nessuno stato, era usa 1,5 → 1), scivolo ≤ 10 % e meno dove la persona non lascia margine (X = min(10, ⌊100·m⌋) sul margine libero dei corpi, sotto 3 vale 0), verso da destra salvo dove il corpo tocca il bordo destro (da sinistra) e la regola della fila in home (mai due capitoli di fila con lo stesso ritaglio: Voci apre da destra, Paths da sinistra). I numeri stanno in `app/lib/motion/lama.ts` (`LAMA_FOR`: sede da sinistra 10, Paths 3 e 10 da sinistra, Chi siamo da destra 10, le chiavi da destra 4, la testimonianza con la copertina cotta col solo bordo, con `consulenza.jpg` da sinistra 10). Le sette foto: la sede di Posizionamento (rincorniciata a `100% 50%`, D201), le due di Paths, la storia di /chi-siamo, le chiavi di Contact fuori dalla home (D206: D28 superata; in home ferme, su /case il fade-up di oggi), la testimonianza fuori dalla home (D207: via la deriva di `Parallax`; il link avvolge il modulo e il play sta dentro il ritaglio, D208). Non la prendono le teste di era, il Congedo, la facciata YouTube di Open Domus, Team, Method, Services, Costi chiari, HorizonStory, Voci (che ha lo stesso parallelogramma coi numeri del capitolo 6) né `/case/[slug]`. Deroga a C01 per 1,2 s (bordo inclinato ma dritto, mai curvo) e a C03 (sette foto in più che si muovono): alla cliente nella domanda 27, dopo la piega del Congedo.

### Media a tutta larghezza
Foto o video nei tre moduli, `object-cover`, sopra avorio profondo. I video sono facciate: un poster reale e un cerchio rosso con triangolo bianco che scala a 1.05 all'hover (0.3 s). Il cerchio è da 96 px da desktop e da 56 px sul telefono, perché su una tessera larga uno schermo quello da 96 copriva i volti; l'iframe arriva al click. La deriva di `Parallax speed={-0.04}` (±0,56 % dell'altezza propria, pochi pixel, scrub lineare lungo la traversata) resta solo dove nessun altro ruolo la sostituisce (`EditorialRows`, /lavora-con-noi): dal 20 set. (A36, D207) le foto della testimonianza fuori dalla home entrano con la lama e la deriva non c'è più, e la testa delle pagine interne è ferma (A41).

### Copertine video rifilate
Ogni fotogramma video del sito è una copertina YouTube con la grafica cotta dentro (titolo bianco in alto, ritratto in cerchio con le stelline in basso a sinistra, logo), e sopra ci andava il nostro play: due titoli, due loghi, due play. Finché non arrivano fotogrammi puliti, la grafica si toglie col ritaglio (decisione di lavoro, 11 set.).
- `.dt-still-trim` (`scale(1.43)`, origine 100 % 100 %) toglie la banda in alto e il badge in basso a sinistra.
- `.dt-still-trim--top` (`scale(1.32)`, origine 50 % 100 %) toglie la sola banda.

Il limite è 1,43: togliere tutta la banda col nome del canale vorrebbe dire 1,79, e lì i volti si tagliano. Ne resta un cuneo in basso a sinistra. Oggi il ritaglio si usa in Voci e nella testimonianza in evidenza. Non è un effetto ma una correzione dichiarata, e sparisce il giorno in cui la cliente consegna i file sorgente e arriva un fotogramma pulito per video a 1920×1080 (`ffmpeg -ss`).

### Voci
Rifatta al posto del muro delle voci (la cliente, 10 set.). `ReviewsWall` non esiste più e `#voci` è un carosello nativo (overflow e scroll-snap, frecce tonde da 56 px che fanno `scrollBy`, nessun pin) con le video-recensioni del canale, seguito dal widget Trustindex dietro il consenso. La testa è eyebrow, h2 d2 ≤ 16ch («Le storie in video»), e sotto una riga a 16 px con voto e conteggio letti da `site.ts` (4,9/5 · 542 recensioni Google). Niente titolo col voto (decisione di lavoro, 11 set.): lo stesso numero sta già nell'hero e nelle cinque stelle, e due volte enorme era troppo. Le tessere sono `.dt-media-full` a tutta larghezza sul telefono, 46vw da md e 32vw da lg (tre per schermata), con la copertina rifilata e il play rosso.

### Rotaia del team
La forma l'ha chiesta la cliente (10 set.): un carosello o uno scroll orizzontale con le foto grandi, al posto del depth fade. La meccanica l'ha scelta Alberto lo stesso giorno: scroll orizzontale pilotato dallo scroll verticale.
- *Meccanica.* `HorizontalRail` con `runway={80}` e `snapMobile` (era 120: Alberto, 20 set., «la home è troppo lunga»; il nastro eccede il viewport di ~700 px a 1440 e li percorre quasi uno a uno). Da 1024 px in su, con motion ok, il nastro si parcheggia, sticky su un corridoio alto quanto il nastro più 80svh (mai il pin di GSAP), e trasla di tutta la sua eccedenza nel tempo di quello scroll (scrub 0.6); dentro ogni tessera la foto pana in senso contrario di ±4 %. Sotto i 1024 px è scroll orizzontale nativo con snap al centro, la stessa parallasse via CSS (`--rail-p`) e un indicatore da 2 px × 4rem a estremità tonde (traccia inchiostro al 15 %, cursore rosso largo un terzo). TeamTrail e il depth fade non esistono più.
- *Tessere.* Sono tutte `.dt-media-column` (decisione di lavoro, 11 set.): 4:5, 42vw con massimo 640 px da lg (605×756 a 1440), 78vw sul telefono e 52vw da sm. Tre cornici diverse davano al nastro un bordo basso frastagliato, e l'altezza la dettava la tessera più alta. Il gap è 3vw, il rientro 5vw (8vw da md).
- *Oggi.* Le tessere sono tre: Raffaela (`raffaela-specchio-sorriso.jpg`), `team-red.jpg` e `team-group.jpg`, perché in `app/lib/team.ts` solo Raffaela ha un ritratto; gli altri cinque li deve consegnare la cliente. La didascalia è un'etichetta di una riga, 16 px maiuscola: il ruolo sotto il ritratto, il nome del gruppo sotto le foto di gruppo. Sotto la rotaia ci sono i sei nomi in d3, col ruolo in pietra.
- *Divieto.* Nel nastro non entrano fotografie su fondale scuro né immagini già usate altrove nella pagina.

### Monogramma rotante
`RotatingMark`: un anello di 60 tacche e il monogramma ufficiale vettoriale girano insieme in senso orario (la cliente, 10 set.) a 30°/s, un giro ogni 12 s. Con lo scroll la velocità sale a 30 + 10·|v| in 0.3 s (ease domus), torna a riposo in 1.1 s, e il verso non si inverte mai: supera la controrotazione di agosto. Sta nella testata accanto al logo solo da xl (1280 px), a 56 px: sotto, il badge e il cuore del logo a sedici pixel di distanza sembravano un errore di montaggio. Nel preloader lo stesso badge gira in CSS a 6 s a giro, quindi le due velocità non coincidono. Il badge di marca in alto a sinistra viene dal logo rotante di era-residence (dossier §5).

### I due set piece pilotati dallo scroll
Tornati l'11 settembre, rifatti senza curve, veli, scuro né testo sotto i 16 px (Alberto, 11 set.). Superano in parte «eliminare tante animazioni e transizioni» (la cliente, 10 set.): tornano i due gesti pilotati dallo scroll, e restano tolte le transizioni di pagina, il cursore custom e il resto del WOW layer.

**«Perché Domus Tua»** (`HorizonStory` + `HorizonScroller`, `#storia`) è il primo capitolo dopo la ricerca. La tecnica è lo scroller orizzontale di era-residence con le sue parallasse interne (dossier §11.1-11.2), senza la cupola.
- *Meccanica.* Da 1024 px in su con motion ok lo schermo è sticky (100svh) e due pannelli scorrono in orizzontale mentre la pagina scende. Il manifesto è largo 100vw ed è la riga a due colonne del sito: a sinistra le tre frasi in d2 che entrano per carattere, a destra una fotografia nella metà forzata a 16:9 (`villa-salotto-ombrellone.jpg`, sorgente 16:9, zona foto del monogramma e sipario del nastro); il lead sotto le frasi non c'è più perché ripeteva Posizionamento (Alberto, 20 set.: «uno spazio enorme vuoto nello scroll orizzontale» — la colonna centrata a 1000 px lasciava 292 px per lato e 761 px di nulla nel passaggio al territorio). Il territorio è largo 108vw, di cui 8vw di pista a sinistra (era 26vw), coi gradini del titolo in parallasse contraria e la foto che si apre a sipario. Sotto i 1024 px, senza JS o con reduced-motion, sono due blocchi in colonna. Niente cupola (un bordo curvo), niente fiori, niente veli.
- *La foto del territorio.* È `/media/hero-aerial.jpg` in `.dt-media-full` (`sizes="(min-width: 1024px) 55vw, 100vw"`): lo stesso file che era il fondale aereo, rimesso come foto del pannello (decisione di lavoro, 11 set.: il territorio si illustra col territorio). Contraddice «togliere foto dopo ricerca» (la cliente, 10 set.): non c'è più come fondale, ma dopo la ricerca la foto aerea c'è ancora, ed è una domanda aperta. Il testo alternativo dice quel che si vede, «Ripresa col drone di una villa con giardino e piscina»; immobile, autorizzazione del proprietario e diritti del file sono una domanda bloccante per la cliente (`docs/da-chiedere-alla-cliente.md` §2.2).

**Le cinque stelle** (`StarReviews`, `#recensioni`) corrono su 360svh con scrub 0.6.
- *Il film.* La foto del premio Top Agency compare piccola ritagliata a stella, si apre a tutto schermo con un lampo e il titolo per carattere, poi si richiude nella stella centrale di una fila di cinque che si accende d'oro dal centro, percorsa da un riflesso. Sotto i 1024 px lo stesso film suona a tempo (3 s) in un box alto al massimo 62svh, ancorato alla fila.
- *Sulla foto.* Nessun velo: il titolo-copertina è bianco con l'ombra di testo più leggera del sito. Le stelle sono poligoni a dieci vertici, senza curve.

### Preloader «Arco Domus»
L'unico pannello scuro. Su un fondo espresso con due gradienti radiali caldi (`.dt-pre-fondo`) stanno la sagoma di Raffaela, il lockup Playfair 500 a 11vh in avorio con la firma Pinyon a 5.2vh in rosso, le didascalie «Immobiliare / dal 2007», il payoff nella lingua salvata e una linea di carica avorio. Poi una porta ad arco (maschera; 24vw → 36vw → 125vw sul desktop, 40 → 58 → 165vw sotto i 768 px) si apre sulla pagina. Maschera ad arco e timeline d'ingresso vengono dal preloader di era-residence (dossier §4).
- *Tempi.* Il film dura 4,63 s, tutto in CSS (`TEMPO = 1`): sagoma da 0.15 s, lettere da 0.12 s (stagger 0.075), firma da 0.60 s, linea da 0.60 a 2.15 s, porta da 2.25 a 3.35 s, congedo del lockup a 2.35 s, tuffo da 3.13 a 4.63 s. L'autohide scatta a 4.73 s, il failsafe a 5.23 s, e le lettere dell'hero si accendono a 3.33 s. È la metà dei 9,26 s di prima: la cliente l'ha voluto più veloce (10 set.) e Alberto ha scelto come, «stesso film di oggi ma dimezzato» (10 set.).
- *Quando suona.* Solo alla prima visita della sessione (`dt-intro-seen`), con motion ok e senza un'ancora nell'URL. Si salta con un tocco o un tasto fino al tuffo. Per questo può sembrare sparito: la sera del 10 settembre Alberto non lo vedeva più, e non c'era nulla da correggere.
- *L'ingresso.* Rivoluto «come prima» (Alberto, 11 set.) e ripristinato col patto della porta. La durata è rimasta 4,63 s: se «come prima» comprendesse anche i 9,26 s è una domanda aperta.
- *Il badge.* In alto il badge di marca (anello di tacche e monogramma, 56 px) gira in CSS in senso orario, 6 s a giro, anello e monogramma nello stesso verso. Posa su un disco carta (`rounded-full bg-paper`, padding 0.5rem, nessuna ombra; decisione di lavoro), perché sull'espresso il monogramma depositato resti grigio e rosso.

Quattro cose del preloader contraddicono direttive che valgono per il resto del sito, e restano domande aperte:
- il pannello espresso, contro «eliminare nero ovunque» (la cliente, 10 set.);
- le didascalie e il payoff sotto i 16 px, contro «nessuna scritta piccola» (la cliente, 10 set.);
- il disco carta sotto il badge, contro «niente curvo» (la cliente, 10 set.) e «metti il logo senza sfondo bianco» (la cliente, 6 ago.);
- il lockup «Domus Tua» in Playfair, contro «stesso font del logo in tutte le scritte Domus Tua» (la cliente, 10 set.).

Il preloader non è un pattern da riusare: è il solo caso in cui il sito è scuro.

**Il patto della porta.** La sagoma dentro il sipario e la banda fotografica in cima alla home stanno nella stessa scatola (decisione di lavoro, 11 set.), e fino al 22 set. erano lo stesso scatto — **dal 22 set. (A55) non più**: la foto sotto è quella vera della piscina con Raffaela al centro, e la sagoma resta la maschera in pizzo di A44 per scelta di Alberto («e se usassimo la maschera del preloader vecchia di Raffaela? La preferisco, e poi all'entrata ci sarà la foto nuova, la maschera se ne va via con l'entrata ad arco sulla hero»): la sagoma è la figura del preloader, e l'arco la porta via. Il patto che resta è la scatola: `top: calc(var(--dt-head-h) + 1px)` (il pixel in più è il bordo basso della testata), `height: var(--dt-band-h)` (dal 20 set., A44, lo schermo intero meno la testata), `left` e `right` a 0, lo stesso rapporto del riquadro (`--dt-hero-ar`) e `objectPosition: "10% 100%"` da tutt'e due le parti. La regola `[data-pre-figure]` vale a ogni larghezza; dal 20 set. la sagoma è quella della villa (`raffaela-sagoma-villa.webp`, il ritaglio di Raffaela posato sul canvas 3:2 da `foto-alte.mjs`), e sotto i 768 px `raffaela-sagoma-villa-m.webp`, 9:16 come la foto del telefono. Quando l'arco si apre, dentro il buco c'è già la stanza che sta sotto: nessun doppio, nessun taglio. Il patto si era rotto quando l'hero è diventato una banda mentre la sagoma era rimasta a tutto schermo: per 750 ms si vedevano due Raffaela, poi uno stacco. I due numeri sono token condivisi in `globals.css`, e servono anche all'altezza della testata, al `top` del pannello mobile e allo `scroll-margin-top` delle ancore (`calc(var(--dt-head-h) + 0.5rem)` sotto lg, 1rem da lg). Il test `intro-clocks` li presidia: non si cambia l'uno senza l'altro. La vecchia regola `.dt-mob-band` (≤ 767.98 px) è rimasta in `globals.css` ma nessun componente la usa.

### Banda video di congedo
*(Superato il 20 set. da A35/A42, vedi «Il quarto formato» sopra: slot a destra del titolo, schermo intero sticky, la voce che parte da sola. Il paragrafo resta come storia.)* L'ultima sezione della home: un video 16:9 a tutta larghezza (almeno 70svh, scala 1.14 dall'angolo in basso a destra), col titolo d1 bianco (≤ 12ch) e un link `ghost-dark` a d4 300 in basso a sinistra, a 12vh dal fondo. La scala serve a mangiare il logo bruciato nell'angolo alto a sinistra della clip, non è un effetto. Il video parte solo con motion ok, da 768 px e quando la banda è vicina; altrove resta il poster `/images/reali/piscina-lusso.jpg` (`object-[16%_50%]`, stessa scala 1.14), che non è una fotografia già usata altrove nella pagina: `hero-aerial.jpg` è il territorio. Le lettere bianche sul video non hanno velo, e sul video desktop `object-position` non ha alcun effetto (16:9 dentro 16:9): nessun taglio può evitare le tende bianche del bordo piscina. La leggibilità la regge l'ombra attaccata alle lettere (vedi Elevation & Depth), la stessa grammatica della copertina delle cinque stelle, e sopra il video non c'è nessun rettangolo.

## Do's and Don'ts

### Do:
- **Do** tenere un solo fondo, #f6d9d0, dalla testata al footer; le sezioni si distinguono per vuoto (`clamp(4.5rem, 10vh, 8rem)`) e hairline, non per colore.
- **Do** misurare i titoli col viewport: d1 `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)` con interlinea 0.98, d2 `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)` con interlinea 1, sempre Playfair, sempre maiuscoli; sotto i 1024 px vale la scala dedicata.
- **Do** aprire ogni capitolo con la stessa cellula: eyebrow rosso → titolo → (una parola Pinyon rossa che ne attraversa l'ultima riga) → lead a 300 in grafite ≤ 38ch → link ghost.
- **Do** scrivere il testo in grafite #46423d e il secondario in pietra #625d56, mai in nero; un inchiostro più scuro sui titoli si chiede prima ad Alberto.
- **Do** tenere le etichette delle CTA entro 26 caratteri: a 390 px la colonna del bottone è 302 px e una maiuscola spaziata ne tiene 26. «Richiedi la valutazione», non «Richiedi la valutazione del tuo immobile».
- **Do** usare il rosso solo per accento e conversione: una CTA piena per schermata, il resto sono link maiuscoli sottolineati.
- **Do** mettere ogni foto in uno dei tre moduli, scelto dal rapporto del sorgente, su avorio profondo e senza velo; `sizes` dichiara i pixel resi, non la scatola.
- **Do** tenere tutto il testo delle pagine a 16 px o più: UI a 1rem, corpo a 19 px, campi forzati a 16 px sul telefono.
- **Do** limitare il movimento ai tre gesti (righe che salgono, fade-up di 2.5rem, deriva di parallasse), al ruolo `media` della lama (A36) sulle foto non a schermo intero, ai tre nastri pilotati dallo scroll (sticky su un corridoio, da 1024 px con motion ok), al monogramma e al preloader; ogni animazione dentro `prefers-reduced-motion: no-preference`, stati nascosti solo via JS.
- **Do** separare con hairline di 1 px in filo (#e9c9c0) e con vuoto; il focus è sempre `outline: 2px` rosso.
- **Do** cambiare `--dt-head-h` e `--dt-band-h` solo insieme alla sagoma del preloader: il test `intro-clocks` presidia il patto della porta.
- **Do** cercare l'aspetto nel dossier di immobiliaregoldengoal.it e le tecniche di tipografia, movimento e struttura nel dossier di era-residence.com (§2 tipografia dei titoli, §4 preloader ad arco, §5 logo rotante, §7 testi per righe, §11.1-11.2 scroller orizzontale): sono i due riferimenti del sistema.

### Don't:
- **Don't** usare raggi su superfici, campi, bottoni o media: i token raggio valgono 0 e il cerchio è riservato ai bottoni-icona, al disco numerato della mappa e agli indicatori di stato.
- **Don't** usare ombre di scatola, blur, veli o vignettature sulle foto; sulle immagini l'unico trattamento ammesso è l'ombra attaccata alle lettere bianche, e l'unica ombra di scatola delle pagine è l'alone rosso sotto un'icona social all'hover.
- **Don't** creare card, riquadri o pastiglie: un blocco è titolo + testo + hairline.
- **Don't** usare superfici scure: l'espresso del preloader è una domanda aperta, non un permesso da estendere.
- **Don't** mettere lettere sopra un'immagine fuori dai punti dichiarati: lockup e firma dell'hero, copertina delle cinque stelle. Le teste delle pagine interne NON stanno più sopra la foto: dal 21 set. (A46) le scritte posano sull'avorio, sopra il soggetto della foto col cielo trasparente, e il titolo «Open Domus» della finestra sta in inchiostro sul cielo che è la carta (A45, A46). Sul video del Congedo nessuna lettera, nessun tasto, nessuna tinta né angolo (A35, D108, D111): la testa sta sopra, il comando nella fascia sotto.
- **Don't** aggiungere una seconda entrata come quella del Congedo in home (A28.10), né tinte, angoli o testo sul foglio. Il loop parte in vista come ogni video d'ambiente, anche durante l'entrata: il foglio piega il video che suona, come Lusion (Alberto, 20 set.: «andava bene prima quando partiva il video prima dell'effetto»).
- **Don't** usare l'oro fuori dalle stelle della valutazione; niente blu, niente nero (né #000 né #1a1816), niente Inter, niente gradienti viola-blu.
- **Don't** scendere sotto i 16 px, nemmeno per didascalie, eyebrow o riga legale.
- **Don't** mettere più di una parola Pinyon per capitolo; il corsivo è ornamento `aria-hidden`, mai un heading, e non vive dentro una foto.
- **Don't** aggiungere sezioni sticky oltre i tre nastri registrati, né usare il pin di GSAP, né transizioni di pagina, cursori custom, fiori o ornamenti disegnati: il sito deve restare bello anche fermo.
- **Don't** prendere da era-residence le cupole curve, i fiori o le transizioni di pagina: sono le sole parti escluse di quel riferimento.
- **Don't** mettere un d1 in mezza colonna: accanto a una foto la testa è d2 o d3 e il paragrafo ≤ 38ch.
- **Don't** inventare una larghezza di media per sezione: esistono tre moduli (`.dt-media-full`, `.dt-media-half`, `.dt-media-column`) e la scatola segue il rapporto del sorgente.
- **Don't** riempire con un render di repertorio: una riga senza scatto vero si racconta col suo numero (`EditorialRows` lo fa da sé, e mostra le foto solo se ogni riga ne ha una in `reali/`).
- **Don't** ripetere un capitolo intero su più pagine: i nove passi stanno su /metodo, le recensioni solo su /recensioni, e la prova su ogni pagina è il sigillo Wikicasa del footer.
- **Don't** ingrandire una copertina oltre 1,43 per rifilarla, né lasciare `.dt-still-trim` su un fotogramma che arriva pulito.

## Da dove vengono le regole

Le regole di questo file vengono da tre voci, e il richiamo accanto a ciascuna dice quale: **la cliente** (Raffaela Rizza, con parole riportate da Alberto), **Alberto** (lo sviluppatore, con giudizi e scelte sue) e le **decisioni di lavoro**, prese costruendo con la ragione scritta nel commit. La differenza pesa: una decisione di lavoro si rimette in discussione con un argomento migliore, una direttiva si cambia solo chiedendo a chi l'ha data. Il registro sta in un posto solo, la §11 della spec `docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md`: le parole esatte con data, fonte e stato nel codice (§11.1-11.2), le domande aperte (§11.3) e quel che la cliente deve ancora consegnare (§11.4). Qui una domanda aperta si segnala, non si risolve.
