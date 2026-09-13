<!-- impeccable:product-schema 1 -->

# Domus Tua Immobiliare — Product Context

## Platform

web

## Users

Famiglie della provincia di Varese (Tradate e comuni limitrofi) che devono
vendere o comprare casa — spesso per la prima volta o dopo molti anni.
Arrivano dal passaparola, da Google (4,9/5 su 542 recensioni, letti dal widget
Trustindex l'11 settembre 2026) e dai social video-driven del brand. Cercano
rassicurazione, chiarezza sui passaggi e una persona di fiducia, non un
portale. Età mista, molti su mobile.

## Product Purpose

Sito vetrina + lead generation dell'agenzia: raccontare il Metodo Domus Tua,
dare prova sociale (recensioni, video, Open Domus), mostrare gli immobili dal
feed RealSmart e convertire in contatti (form lead, WhatsApp, telefono).

## Positioning

"Vendere casa, senza stress. Acquistare casa, con sicurezza." Agenzia
indipendente founder-led (Raffaela Rizza, dal 2007), tra le più recensite
della provincia di Varese. Differenzianti proprietari: Metodo Domus Tua,
Open Domus (format di visita), Domus D.O.C. (protocollo documenti), racconto
video ("ci vedi prima ancora di conoscerci"). Persone prima degli immobili.

## Operating Context

Next.js 16 App Router + React 19 + Tailwind v4, hosting Vercel, pagine
editoriali statiche + ISR RealSmart (12 min). i18n client-side 5 lingue
(it default, SEO solo IT). Motion layer GSAP 3.15 + ScrollTrigger + Lenis,
ridotto dal redesign «rivista bianca» del 2026-09-10 (riferimento indicato
dalla cliente: immobiliaregoldengoal.it) a quattro primitive — `Reveal`,
`TextLines`, `Parallax`, `HorizontalRail` — più il monogramma rotante, il
preloader e due set piece riportati l'11 settembre 2026 perché li ha chiesti
Alberto (commit 024d354): i pannelli orizzontali di «Perché Domus Tua»
(`HorizonStory` + `HorizonScroller`) e il film delle cinque stelle
(`StarReviews`). Widget terzi isolati (Trustindex, IG, YouTube facade al
click).

## Capabilities and Constraints

- Performance: LCP < 2.5s mobile, CLS 0; una sola immagine priority per
  pagina; animare solo transform/opacity/clip-path; reduced-motion = sito
  completo e statico; nessuna nuova libreria di animazione oltre GSAP+Lenis
  (OGL ~30kB ammessa come progressive enhancement, Fase WebGL).
- SEO: testo sempre nell'HTML iniziale; stati nascosti solo via JS; metadata,
  JSON-LD e canonical intoccabili.
- Non toccare: API routes, lib/realsmart, form lead (window.open sincrono),
  i18n, logica BeforeAfter/PropertyCard/Reviews.

## Brand Commitments

Fra il 10 e l'11 settembre 2026 le direttive sono arrivate da tre voci, e
confonderle ha già prodotto attribuzioni sbagliate in commit, commenti e in
questo stesso file. Ogni impegno qui sotto dice quindi **chi** l'ha chiesto e
**quando**:

- **la cliente**: Raffaela Rizza, riferita da Alberto (la chiamata del
  2026-09-10, più due direttive di agosto ancora valide);
- **Alberto**: lo sviluppatore, con giudizi e scelte sue;
- **decisione di lavoro**: presa costruendo, con la ragione scritta nel
  commit citato.

La differenza pesa. Una decisione di lavoro si può rimettere in discussione
con un argomento migliore. Una direttiva invece si cambia solo chiedendo a chi
l'ha data. Lo stato del codice descritto è quello del 2026-09-13 (c2949a3).

### Identità e voce

- Nome: Domus Tua Immobiliare (mai genericizzare Open Domus, Domus D.O.C.,
  Metodo Domus Tua, il Segno Domus).
- Voce: empatica, raffinata, entusiasta, tecnologica, sicura — mai gergo
  legale, promesse indimostrabili, freddezza corporate o hard-selling.
  Nessun riferimento ad AI nei testi.
- Logo ufficiale PNG: non ridisegnare, non animare con morph/draw. Il logo
  nuovo (la cliente, 2026-09-10: «mettere logo nuovo») non è stato
  consegnato; Alberto ha scelto lo stesso giorno di costruire col logo
  attuale, quindi il sito usa `Logo.tsx` e i file `logo-domustua-*`.
- Logo senza sfondo bianco (la cliente, 2026-08-06: «metti il logo senza
  sfondo bianco»). Nel preloader NON è rispettata: il badge poggia su un disco
  carta (`rounded-full bg-paper`, `PreloaderShell.tsx`), una scelta di lavoro
  confermata in c1ba870 senza che nessuno abbia allentato la regola. Domanda
  aperta.
- Scritte «Domus Tua» nel font del logo (la cliente, 2026-09-10: «usare stesso
  font del logo in tutte le scritte Domus Tua»). Passano dal token
  `--font-brand`, che oggi vale `var(--font-jakarta)` come segnaposto: Alberto,
  2026-09-10, «Aspetto il logo nuovo». Quando il font arriva si cambia una
  riga. Oggi la direttiva è applicata solo a metà: il lockup dell'hero è in
  `font-brand` (extrabold), quello del preloader è ancora Playfair
  (`font-hero`, 11vh). Domanda aperta.

### Colore

- Palette: rosso #d20a0a (un accento per vista) + neutri caldi carta
  #fffdf8, avorio #f9f5ef, avorio profondo #f4ece2 + inchiostro #46423d
  (uguale alla grafite), pietra #6b665f, filo #e4dccf. Il rosso cupo #a30707
  è lo stato hover/focus dei bottoni rossi, ma non solo: a riposo colora i
  testi rossi che stanno sull'avorio. Fra questi i messaggi d'errore e le
  conferme dei form (`Contact`, `CareerApplication`, `AssistantLeadForm`), il
  titolo «venduto» della scheda immobile, i chip a contorno della ricerca,
  l'errore della ricerca AI, il contatore della mappa e il link di `Reviews`.

  Due eccezioni, circoscritte, e nessuna delle due confermata da chi ha dato
  le regole:
  - **l'oro sulle stelle** della valutazione Google, e soltanto lì: #d9a441,
    con gold-deep #a9812a, gold-light #eed07a e gold-spec #fff6d4 nei
    gradienti di `StarReviews`. La tonalità è una decisione di lavoro del
    2026-09-11 (aff9b0e), perché il vecchio #c9a227 sull'avorio leggeva
    mostarda. Il divieto «niente oro» che questo file scrive dal 2026-07-28
    (072af22) non prevede le stelle: se vada riscritto come «oro solo sulle
    stelle» è la domanda aperta 11;
  - **l'espresso #1c1512 nel pannello del preloader** (decisione di lavoro,
    2026-09-10: la spec lo scrive in 67afc9e, «solo il pannello del
    preloader», «nessuna sezione scura»). Il token `--color-wine` (#2a100f) è
    ancora definito in `globals.css`.

  DIVIETI: niente oro (con l'eccezione non confermata delle stelle), niente
  blu, niente nero (vedi sotto), niente estetica SaaS, niente gradienti
  viola-blu, niente dark-tech, niente Inter.
- Niente nero (la cliente, 2026-09-10: «niente colore nero», «eliminare nero
  ovunque»). Nelle pagine è applicata: un solo fondo avorio, `themeColor`
  #f9f5ef, nessuna sezione scura. Restano due punti.
  - Il pannello espresso del preloader, con il gradiente `.dt-pre-fondo`.
    È una decisione di lavoro del 2026-09-10 (67afc9e) che nessuno ha
    approvato esplicitamente, né la cliente né Alberto; c'è solo il consenso
    implicito di «Stesso film di oggi ma dimezzato». Domanda aperta.
  - L'immagine Open Graph (`app/opengraph-image.tsx`), che usa ancora #1a1816
    come colore del testo e come fondo.
- NIENTE SCRITTE BLACK (Alberto, 2026-09-11, 09aff4b). `--color-ink`,
  `--color-graphite` e `--foreground` valgono tutti #46423d, la grafite del
  «Domus» nel lockup: la gerarchia la fanno peso e misura, non il nero. Il
  vecchio inchiostro #1a1816 non è più il colore del testo del sito; resta
  solo nell'immagine OG. Tensione aperta: il riferimento scrive titoli e corpo
  in #1f1f1f (`reverse-engineering/goldengoal/README.md:86`, «quasi nero, mai
  #000»), ed è la ragione probabile per cui la pagina legge slavata.
  Un inchiostro più scuro per i soli titoli (proposta #2e2a26) non è
  applicato: va chiesto ad Alberto, non deciso qui.

### Forma

- NIENTE curve, NIENTE card, NIENTE transizioni di pagina curve (la cliente,
  2026-09-10: «lo stile del nostro sito curvo e smuussato, con card, e
  transizioni di pagina curve non piace per niente!», «niente curvo»). È
  applicata così:
  - `--radius-card`, `--radius-card-lg` e `--radius-field` valgono 0px;
  - `--shadow-card`, `--shadow-card-hover` e `--shadow-float` valgono none;
  - `PageTransition` è ridotto a uno stub.

  Restano curve costruite, in due famiglie.
  - I bottoni-icona tondi, tenuti tondi perché contengono solo un'icona:
    - le icone social (`.dt-social__link`, raggio pieno; all'hover salgono di
      3 px con un'ombra rossa);
    - il WhatsApp della barra mobile e quello flottante (`WhatsAppFloat`),
      montato sulla home e su quasi tutte le pagine;
    - i play rossi sui video e le frecce del carosello di «Le voci»;
    - i controlli tondi sopra foto e video (card e galleria degli immobili,
      anteprima rapida, lightbox dei video) e la maniglia del `BeforeAfter`;
    - il bottone della ricerca AI (`PropertySearch`) e il contatore della
      mappa;
    - quando l'assistente è abilitato (`NEXT_PUBLIC_ENABLE_ASSISTANT`), il
      suo bottone flottante e il bottone d'invio.
  - Il preloader, che non è fatto di bottoni:
    - la porta è un arco, con due anelli eco arrotondati in cima
      (`[data-pre-arch-echo]`);
    - il badge poggia su un disco carta.

  I bottoni-icona sono un'eccezione con una ragione. L'arco è il film che
  Alberto ha scelto di tenere il 2026-09-10 («Stesso film di oggi ma
  dimezzato»), e di cui l'11 settembre ha chiesto l'ingresso «come prima».
  Il disco carta non ha né l'una né l'altra cosa, ed è una domanda aperta.
- NIENTE fiori (la cliente, 2026-09-10: «ELIMINARE tutti i FIORI»).
  Applicata: `Fioritura` non esiste più e nessun fiore viene renderizzato.
  Supera le direttive di agosto su fiori e cupole.
- NIENTE vignettature né veli sulle foto (la cliente, 2026-09-10:
  «VIGNETTATURA NO!»). Applicata: l'hero e la banda di congedo non hanno velo.
  Eccezione costruita, dichiarata perché non sembri una svista: dove una
  scritta bianca sta sopra un'immagine, la leggibilità la regge un'ombra
  attaccata alle lettere, non un rettangolo sopra la foto.
  - Congedo: `0 1px 2px rgb(0 0 0 / 0.35), 0 0 28px rgb(0 0 0 / 0.45)`.
  - Copertina delle cinque stelle: `0 1px 2px rgb(0 0 0/.25)`.
  - Un text-shadow sul lockup del preloader.

  Nel DOM di `StarReviews` resta lo strato del lampo (`.dt-starrev_flash`), a
  riposo con opacità 0.
- Il taglio fra le sezioni non si deve percepire (la cliente, 2026-08-06, ancora
  valida). Applicata con un solo fondo `bg-cream` in tutti i capitoli e
  nessun cambio di tono; non misurata.

### Tipografia

- Nessuna scritta piccola (la cliente, 2026-09-10: «nessuna scritta
  piccola»). Nel sito è applicata: UI a 1rem (16 px), corpo a 1.1875rem
  (19 px), eyebrow a 16 px, sovratitolo dell'hero a `text-ui`. NON è
  applicata nel preloader: le didascalie «Immobiliare» e «dal 2007» stanno a
  0.68rem e il payoff a 0.82rem (`PreloaderShell.tsx`). Questo file diceva
  «nessun testo sotto i 16 px» senza eccezioni, e per il preloader era falso.
  Se portarle a 16 px o dichiarare l'eccezione è una domanda aperta.
- Grandezze come il riferimento (la cliente, 2026-09-10: «pensare a come
  gestire grandezze font per renderlo come il sito di riferimento»).
  Applicata con una scala in vw/vh, con titoli h1–h4 maiuscoli e paragrafi
  grandi e leggeri. La fonte dei numeri è `globals.css`:
  - lockup dell'hero `clamp(3.1rem, 13vw, 13rem)`, interlinea 0.9;
  - d1 `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)` a 0.98 e d2
    `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)` a 1. Erano 0.92 e 0.95, ma
    accenti e code entravano nella riga sopra (decisione di lavoro,
    2026-09-11, aff9b0e). Sotto i 1024 px crescono con la larghezza:
    `clamp(2.55rem, 9.5vw, 7.5rem)` e `clamp(2.15rem, 7.4vw, 4.5rem)`;
  - d3 `clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem)` a 1.05;
  - lead `clamp(1.35rem, 1.72vw, 1.55rem)` a 1.4, peso 300, in una colonna di
    38ch. Era 50ch, il doppio di quel che si legge senza perdere la riga
    (stesso commit);
  - corpo 1.1875rem, UI 1rem;
  - eyebrow a 16 px, peso 500, tracking 0.12em; voci della testata 0.1em;
    bottoni 0.08em (0.05em sotto i 640 px).

  Fino a c2949a3 (2026-09-13) i due documenti di sistema davano ancora i
  valori di prima. DESIGN.md scriveva interlinee 0.92 e 0.95, lead ≤ 50ch ed
  etichette a 0.08em; `.impeccable/design.json` il lead a 50ch, il titolo di
  capitolo a 0.95 e l'eyebrow a 0.08em. Dove i documenti non concordano
  vince il codice.
- Font: Playfair Display è la display di titoli e capitoli (`--font-display`,
  `--font-hero`; Fraunces ritirato, ago 2026). Plus Jakarta Sans è il corpo e
  la UI (`--font-sans`). Pinyon Script è il corsivo rosso: una parola-ornamento
  per capitolo e la firma «Raffaela Rizza» nell'hero. Le scritte «Domus Tua»
  non appartengono a questa coppia: passano da `--font-brand` (vedi
  *Identità e voce*). Resta l'eccezione del preloader, in Playfair.

### Motion

- Via tante animazioni e transizioni (la cliente, 2026-09-10: «dobbiamo rifare
  tante cose, e eliminare tante animazioni e transizioni»). Applicata per le
  transizioni di pagina (stub), il cursore custom e il magnetico (rimossi) e
  il resto del WOW layer.
- Superata in parte da Alberto, 2026-09-11 (024d354): «dovevamo fare un
  redesign, ma mantenendo quelle animazioni che non erano curve, tipo quella
  del 5 stelle, lo scroll orizzontale nella sezione perché domus tua … come
  prima ma con il nuovo design, niente curvo». Questo file la dava come
  «richiesta cliente»; l'unica fonte primaria cita Alberto. Se riferisse la
  cliente è una domanda aperta.
- Cosa gira oggi:
  - tre gesti: righe che salgono da una maschera, fade-in, parallasse
    leggera;
  - il monogramma che ruota in senso orario (la cliente, 2026-09-10: «cuore
    che ruota in senso orario»). In testata solo da xl (1280 px), a 30°/s;
    nel preloader gira in CSS, 6 s a giro;
  - il preloader;
  - TRE nastri pilotati dallo scroll, solo da 1024 px e con motion ok.

  I tre nastri usano tutti sticky + corridoio, nessun pin di GSAP:
  - i pannelli di «Perché Domus Tua» (`#storia`);
  - il film delle cinque stelle (`#recensioni`), su una corsa di 360svh.
    Sotto 1024 px suona a tempo in 3 s dentro un box di al massimo 62svh;
  - la rotaia del team, con corridoio di 120svh. Sotto 1024 px diventa scroll
    orizzontale nativo con snap. La cliente, 2026-09-10, l'ha voluta «un
    carosello o uno scroll orizzontale con le foto grandi»; Alberto, lo
    stesso giorno, ha scelto «Scroll orizzontale pilotato dallo scroll
    verticale».

  Non ci sono altre sezioni pinnate: «Le voci» è un carosello nativo. La frase
  «niente sezioni pinnate», che questo file scriveva subito dopo aver elencato
  i tre nastri, era contraddetta dal codice ed è stata tolta. Niente
  transizioni fra le pagine, niente cursore custom. Il sito deve restare bello
  ANCHE FERMO.
- Preloader più veloce (la cliente, 2026-09-10: «preloader piu veloce»).
  Alberto ha scelto come, lo stesso giorno: «Stesso film di oggi ma
  dimezzato». Oggi è un film ad arco di 4,63 s (`TEMPO = 1`, prima 9,26 s) e
  suona una volta per sessione, mai con reduced-motion. L'11 settembre Alberto
  ha chiesto di nuovo l'ingresso «come prima» («lo rivoglio come prima,
  l'animazione di entrata»): è stato ripristinato col patto della porta
  (6e6559b) lasciando la durata a 4,63 s. Se «come prima» comprendesse anche
  la durata è una domanda aperta.

### Primo schermo e testata

- Hero, composizione di oggi. La foto della stanza è una banda alta 60svh
  (`--dt-band-h`) a tutta larghezza, senza velo. Sopra ci stanno SOLO il
  lockup «Domus Tua» (due righe centrate, «Domus» grafite e «Tua» rossa) e la
  firma, che sta a cavallo del bordo basso della banda. Sotto, sull'avorio e
  centrati, vengono il sovratitolo, l'H1 (d3, ≤ 28ch), la CTA piena
  «Richiedi la valutazione», i link «Vendi casa» e «Cerco casa», e il voto.
  Come ci si è arrivati, in ordine:
  - la cliente, 2026-09-10:
    - via la subcopy («Valutazione professionale, documenti verificati prima
      di andare sul mercato…») e la riga founder «RR Con Raffaela Rizza e il
      team»;
    - «togliere guarda video bottone: mettere bottone vendi casa»;
    - «firma piu in basso nella hero».
  - la cliente, 2026-09-10: «box vendi casa piu a destra». Che «box» voglia
    dire il blocco CTA dell'hero lo dice solo la spec. **Superata** la sera
    stessa da Alberto, «nella hero hai cambiato le posizioni non mi piace,
    rimettilo centrale» (e6e34bd), con la precisazione «lascia il nuovo font
    pero, non rimetterlo esattamente come prima, intendo solo le posizioni».
    Qui «font nuovo» vuol dire la tipografia della rivista bianca, non un font
    consegnato. Nessun documento registrava che la direttiva della cliente
    fosse stata ribaltata; se dirglielo è una domanda aperta.
  - Alberto, 2026-09-10 sera: «la hero rimettila con la foto sotto la
    scritta». **Superata** da Alberto stesso il 2026-09-11 (09aff4b): «la foto
    nella hero va messa dietro la scritta Domus Tua, non più avanti, come era
    prima del cambiamento».
  - decisione di lavoro, 2026-09-11 (09aff4b): sulla foto solo lockup e firma.
    Senza velo, un H1 a 38 px sopra un divano non si legge; un lockup a 13vw si
    legge su qualunque stanza.
- Testata (Alberto, 2026-09-11: «sono emersi un sacco di cose brutte e
  formattate male, a livello layout, e di scelta. come il menu sopra»).
  Applicata in 6e6559b:
  - una sola riga alta `--dt-head-h`, col logo a sinistra;
  - sei voci primarie maiuscole (Vendi, Acquista, Metodo Domus, Open Domus,
    Chi siamo, Contatti) e la lingua a destra, nessuna CTA desktop;
  - il monogramma rotante solo da xl.

  Due decisioni di lavoro completano la testata. Servizi, Recensioni e
  Lavora con noi vivono nel menu del telefono e nel footer (6e6559b). La
  testata è sticky solo sotto lg e da lg scorre via come nel riferimento
  (2026-09-10, 7d2d1d8). Il commit, il commento in `site.ts` e DESIGN.md
  dicono che quel menu l'ha bocciato il cliente; nel transcript lo dice
  Alberto. Se riferiva un giudizio della cliente è una domanda aperta.
- CTA corte (decisione di lavoro, 2026-09-11, fb6a22c). L'etichetta della
  valutazione è la forma corta su tutte le superfici: «Richiedi la
  valutazione», «Request a valuation», «Demander l’estimation», «Bewertung
  anfordern», «Solicita la valoración». Quella lunga, quaranta caratteri, sul
  telefono andava a capo con la freccia appesa. Resta un'eccezione non
  allineata: l'heroPrimary tedesco di `ServiziContent.tsx`, «Fordern Sie die
  Bewertung Ihrer Immobilie an».

### Media e contenuti

- Posizione di foto e video (Alberto, 2026-09-11: «la posizione delle foto e
  dei video etc.»). Risolta con decisioni di lavoro (aff9b0e, 5304dfd,
  360c76b):
  - tre moduli media: `.dt-media-full` 16:9, `.dt-media-half` 1:1 e
    `.dt-media-column` 4:5 (`--tall` 9:16); da 64rem la metà e la colonna
    stanno a 42vw, max 640 px;
  - la regola «la scatola segue il sorgente, non la griglia», così nessuna
    foto viene ingrandita per riempire una cornice sbagliata.

  Anche 5304dfd la attribuisce al cliente («che il cliente sente sbagliata»);
  l'ha detta Alberto. È la stessa domanda aperta della testata.
- Una foto vera, in un posto solo (decisione di lavoro, 2026-09-11, 360c76b e
  fb6a22c). Una fotografia compare una volta per pagina:
  - il premio, che era l'unico file ripetuto nella home, resta solo alle
    cinque stelle;
  - su /chi-siamo c'è una foto sola dove erano tre;
  - la rotaia del team e il poster del congedo non usano immagini già viste
    nella pagina.
- Niente render di riempimento (decisione di lavoro, 2026-09-11, 183acdd).
  Una riga senza scatto vero si racconta col suo numero, perché un render non
  dice nulla del passo che accompagna. `EditorialRows` mostra le foto solo se
  OGNI riga ne ha una in `reali/`: oggi i quattro chiamanti (Acquista, Open
  Domus, Servizi, Vendi) rendono tutti l'elenco numerato, e sedici render di
  repertorio sono usciti dal sito. La regola però è automatica solo lì.
  Immagini fuori da `reali/` restano:
  - nelle righe di `Services` in home (`home_staging_01`, `rendering_01`);
  - nella testa (`PageHero`) di nove pagine interne su undici: /chi-siamo,
    /metodo, /privacy e /cookie (`hero_01`), /acquista (`hero_04`),
    /open-domus (`premium_05`), /recensioni (`premium_01`), /servizi
    (`premium_03`) e /vendi (`premium_02`). Solo /domande-frequenti e
    /lavora-con-noi hanno uno scatto vero (`reali/consulenza.jpg`);
  - nel `BeforeAfter` di /vendi e /servizi.

  Gli immobili demo di `app/lib/properties.ts` riusano le stesse immagini, ma
  non sono in questo elenco: la facciata `listings.ts` li serve solo nella
  modalità offline esplicita fuori produzione, mai sul sito vero.
- Dove vivono le recensioni (decisione di lavoro, 2026-09-11, ea1b584). Il
  capitolo `Reviews` (testa, filtri, widget) non si ripete più in coda alle
  pagine interne: vive solo su /recensioni. Altrove la prova indipendente è il
  sigillo Wikicasa del footer.
  - In home ci sono le cinque stelle (`#recensioni`) e subito dopo «Le voci»
    (`#voci`). «Le voci» è stata rifatta su richiesta della cliente
    (2026-09-10: «RIFARE SEZIONE IL MURO DELLE VOCI») come carosello nativo
    di video più il widget Trustindex.
  - Allo stesso modo i nove passi del Metodo stanno solo su /metodo: in home
    `<Method compact />` mostra tre atti e un link (0fa94bc).

### Riferimenti

- Riferimento principale (la cliente, 2026-09-10, che l'ha mostrato «tante
  volte»): https://www.immobiliaregoldengoal.it/ — «molto pulito, clean,
  profesionale, scritte grandi, font azzeccato, niente card, foto e video
  grandi, spazi gestiti bene». È un riferimento, non una regola verificabile
  leggendo il codice. Le conseguenze misurabili sono il fondo unico, nessuna
  card, raggi a 0 e media a tutta larghezza o a 42vw. Per studiarlo Alberto
  ha chiesto un reverse engineering (2026-09-10): il dossier sta in
  `reverse-engineering/goldengoal/` (gitignorato).
- Riferimento secondario (Alberto, 2026-09-11: «utilizza anche come
  riferimento il sito vecchio al quale avevamo preso spunto: eraresidence»).
  Il dossier `reverse-engineering/era-residence/` è la fonte citata da
  `HorizonScroller`, `Preloader`, `RotatingMark` e `TextLines`. È servito
  anche a ripristinare l'ingresso del preloader. Le sue cupole e i suoi fiori
  restano vietati dalle direttive della cliente del 2026-09-10.
- Anti-riferimenti: template SaaS, gradienti viola-blu, dark-tech, Inter
  ovunque, e il vecchio stile curvo/smussato a card con cupole e fiori.

### Domande aperte (al 2026-09-13)

Nessuna è risolta in questo file: ognuna aspetta chi ha titolo a rispondere.

1. **Colore del testo.** Il riferimento scrive titoli e corpo in #1f1f1f,
   mentre Alberto ha ordinato «NIENTE SCRITTE BLACK» e l'inchiostro è
   #46423d. Accetta un inchiostro più scuro per i soli titoli (proposta
   #2e2a26)? Va chiesto ad Alberto.
2. **Foto dopo la ricerca.** La cliente ha chiesto «togliere foto dopo
   ricerca» (2026-09-10, punto 6 della chiamata). La foto aerea
   `/media/hero-aerial.jpg` è però di nuovo nel primo capitolo dopo la
   ricerca, come immagine del pannello territorio di `HorizonStory`
   (decisione di lavoro, 2026-09-11, 360c76b: «il territorio si illustra col
   territorio»). Non c'è più come fondale, quindi la direttiva è rispettata
   solo alla lettera. Dal 2026-09-13 (c2949a3) il testo alternativo dice
   quello che si vede, «Ripresa col drone di una villa con giardino e
   piscina», e non più «i tetti e il verde attorno a Tradate». Non si sa di
   quale villa si tratti né di chi siano i diritti del file, e
   `docs/da-chiedere-alla-cliente.md` §2.2 lo segna come bloccante. Si toglie,
   o si chiede alla cliente se il divieto era solo sul fondale?
3. **Chi ha chiesto il ritorno dei set piece?** L'unica fonte primaria
   (024d354) cita Alberto; DESIGN.md, la spec, il commento di `app/page.tsx` e
   la memoria dicono cliente. Se Alberto riferiva la cliente va detto
   esplicitamente, altrimenti quei documenti vanno corretti.
4. **«Menu sopra» e «posizione delle foto».** Li ha detti Alberto
   (2026-09-11), ma 6e6559b, 5304dfd, `site.ts` e DESIGN.md li danno al
   cliente. Riportava un giudizio della cliente o era un giudizio suo?
5. **Preloader «come prima».** Comprendeva anche la durata (9,26 s con
   `TEMPO = 2`) o solo l'ingresso? Oggi è 4,63 s, coerente con la risposta del
   2026-09-10.
6. **Testo sotto i 16 px nel preloader** (0.68rem e 0.82rem). Si porta a
   16 px o si registra un'eccezione dichiarata?
7. **Pannello espresso del preloader.** È una decisione di lavoro del
   2026-09-10 (67afc9e). Contraddice «eliminare nero ovunque» e non ha un
   consenso esplicito né della cliente né di Alberto. Resta?
8. **Disco carta sotto il badge del preloader.** Contraddice «metti il logo
   senza sfondo bianco» (cliente, 2026-08-06). Resta?
9. **Lockup «Domus Tua» del preloader in Playfair**, contro «stesso font del
   logo in tutte le scritte Domus Tua». Si allinea già ora a `--font-brand` o
   si aspetta il logo nuovo?
10. **«Box vendi casa più a destra».** È stata ribaltata da Alberto
    («rimettilo centrale»), e l'interpretazione «blocco CTA dell'hero» viene
    solo dalla spec. Va detto alla cliente?
11. **Oro.** Dal 2026-07-28 (072af22) questo file dice «niente oro», ma il
    codice l'oro lo usa sulle stelle (la tonalità di oggi è di aff9b0e). Il
    divieto va riscritto come «oro solo sulle stelle»? Finché nessuno
    risponde, qui resta scritto com'era, con le stelle segnate come eccezione
    non confermata.

## Evidence on Hand

- Numeri reali: 4,9/5 su 542 recensioni Google, letti dal widget Trustindex
  vivo l'11 settembre 2026 (98b8709; `site.rating` e `site.reviewsCount` in
  `app/lib/site.ts`). Il numero è vivo: la nota accanto alla costante dice di
  rileggerlo dal widget ogni volta che si tocca quella riga. Nel JSON-LD non
  c'è `aggregateRating`. Il vecchio 531 non si vede più in pagina, ma
  sopravvive in commenti e documenti:
  - il commento `StarReviews.tsx:39` («voto 4,9/531»);
  - il piano `docs/superpowers/plans/2026-09-10-rivista-bianca.md`, che in
    uno step chiede ancora «una riga `text-d1` del solo 4,9/531»;
  - `docs/da-chiedere-alla-cliente.md` («4,9 su 531 recensioni») e
    `docs/reviews-integration.md` («~531»);
  - i documenti di lavoro più vecchi (`retainer-plan.md`,
    `piano-documento-finale.md`, `assistant-architecture.md`,
    `consolidamento-post-pr.md`).
- In attività dal 2007. Nessuna metrica senza fonte in pagina: il conteggio
  video ("440+") e le stat numeriche della home sono stati rimossi perché non
  verificabili.
- Foto reali in `public/images/reali/` (founder, team, Open Domus, immobili,
  premi). Demo e rendering stanno in `public/images/`, da sostituire con scatti
  veri o col feed (vedi *Niente render di riempimento*).
- Video YouTube reali cablati in `app/lib/site.ts`; widget Trustindex reale.
  Le copertine dei video sono copertine YouTube con titolo, stelline e logo
  cotti dentro. `.dt-still-trim` le rifila (scale 1.43, oppure 1.32 con
  `--top`) in `Voci` e `FeaturedTestimonial`. È una correzione dichiarata, non
  un effetto, e sparisce il giorno in cui arrivano fotogrammi puliti
  (decisione di lavoro, 2026-09-11, c0d841f e 39cedc3).
- Dati societari verificati in `app/lib/site.ts` (P.IVA, REA, sede, orari).
- NON fabbricare: premi, numeri di vendite, recensioni, loghi partner,
  citazioni di clienti, firme.
  - `FeaturedTestimonial` non rende più citazione, autore e contesto, perché
    erano inventati.
  - `Reviews` mostra il banner «Esempi dimostrativi» quando le card sono demo.
  - L'hero scrive il nome in Pinyon Script, non una firma finta.

### In attesa dalla cliente

1. **Logo nuovo e il suo font.** In `public/` ci sono solo i
   `logo-domustua-*`, datati dal 2026-07-28 al 2026-08-06; `--font-brand` punta
   a Jakarta come segnaposto.
2. **Fotogrammi puliti dei video**, a 1920×1080 (`ffmpeg -ss`). Servono i file
   sorgente, che non sono nel repo; intanto c'è `.dt-still-trim`.
3. **Ritratti singoli del team.** Ne mancano 5: Paloma Cavalcante, Eleonora
   D’Agati, Viola Benatti, Tiziana Galeone, Katya Fedrigo. In
   `app/lib/team.ts` solo Raffaela ha l'immagine; la rotaia usa per ora
   `team-red.jpg` e `team-group.jpg`.
4. **Firma autografa reale**: `brand.signature` è vuoto (`app/lib/brand.ts`).
5. **Parole vere dei clienti** per le citazioni di `FeaturedTestimonial` e
   `Reviews`.

## Product Principles

1. Fiducia prima dello spettacolo: ogni animazione ha una ragione narrativa.
2. Un solo momento firma per schermata; il resto è disciplina.
3. Il movimento è un di più: tutto funziona e resta bello anche fermo.
4. Warm editorial, non SaaS: carta, serif, rosso usato col contagocce.
5. Mobile è metà del pubblico: niente scroll-hijack, versioni semplificate
   (i tre nastri pilotati dallo scroll esistono solo da 1024 px).

## Accessibility & Inclusion

prefers-reduced-motion rispettato ovunque (contenuto completo, statico);
focus visibile brand; focus trap nel menu; slider BeforeAfter con tastiera e
ARIA; testo mai nascosto senza JS (fallback scripting:none); tap target
generosi su mobile. L'unica superficie scura è il pannello del preloader
(lockup avorio, didascalie `cream/60` e `cream/70`, sotto i 16 px: domanda
aperta). Il testo bianco sopra le immagini (congedo, copertina delle cinque
stelle) si regge su un'ombra attaccata alle lettere, non su un velo.
