<!-- impeccable:product-schema 1 -->

# Domus Tua Immobiliare — Product Context

## Platform

web

## Users

Famiglie della provincia di Varese (Tradate e comuni limitrofi) che devono vendere o comprare
casa — spesso per la prima volta o dopo molti anni. Arrivano dal passaparola, da Google (4,9/5 su
542 recensioni, letti dal widget Trustindex l'11 settembre 2026) e dai social video-driven del
brand. Cercano rassicurazione, chiarezza sui passaggi e una persona di fiducia, non un portale.
Età mista, molti su mobile.

## Product Purpose

Sito vetrina + lead generation dell'agenzia: raccontare il Metodo Domus Tua, dare prova sociale
(recensioni, video, Open Domus), mostrare gli immobili dal feed RealSmart e convertire in contatti
(form lead, WhatsApp, telefono).

## Positioning

"Vendere casa, senza stress. Acquistare casa, con sicurezza." Agenzia indipendente founder-led
(Raffaela Rizza, dal 2007), tra le più recensite della provincia di Varese. Differenzianti
proprietari: Metodo Domus Tua, Open Domus (format di visita), Domus D.O.C. (protocollo documenti),
racconto video ("ci vedi prima ancora di conoscerci"). Persone prima degli immobili.

## Operating Context

Next.js 16 App Router + React 19 + Tailwind v4, hosting Vercel, pagine editoriali statiche + ISR
RealSmart (12 min). i18n client-side 5 lingue (it default, SEO solo IT). Motion layer GSAP 3.15 +
ScrollTrigger + Lenis, ridotto dal redesign «rivista bianca» del 2026-09-10 a quattro primitive —
`Reveal`, `TextLines`, `Parallax`, `HorizontalRail` — più il monogramma rotante, il preloader e i
due set piece pilotati dallo scroll riportati l'11 settembre: i pannelli orizzontali di «Perché
Domus Tua» (`HorizonStory` + `HorizonScroller`) e il film delle cinque stelle (`StarReviews`).
Widget terzi isolati (Trustindex, IG, YouTube facade al click).

## Capabilities and Constraints

- Performance: LCP < 2.5s mobile, CLS 0; una sola immagine priority per pagina; animare solo
  transform/opacity/clip-path; reduced-motion = sito completo e statico; nessuna nuova libreria di
  animazione oltre GSAP+Lenis (OGL ~30kB ammessa come progressive enhancement, Fase WebGL).
- SEO: testo sempre nell'HTML iniziale; stati nascosti solo via JS; metadata, JSON-LD e canonical
  intoccabili.
- Non toccare: API routes, lib/realsmart, form lead (window.open sincrono), i18n, logica
  BeforeAfter/PropertyCard/Reviews.

## Brand Commitments

Gli impegni vengono da tre voci, e ognuno porta un richiamo breve a quella giusta: **la cliente**
(Raffaela Rizza, con parole riportate da Alberto), **Alberto** (lo sviluppatore, con giudizi e
scelte sue) o una **decisione di lavoro** (presa costruendo). Una decisione di lavoro si rimette in
discussione con un argomento migliore; una direttiva si cambia solo chiedendo a chi l'ha data.
Parole esatte, date, commit e stato nel codice stanno in un registro solo, la §11 della spec
(`docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md`); i valori visivi precisi
stanno in `DESIGN.md`.

### Identità e voce

- Nome: Domus Tua Immobiliare (mai genericizzare Open Domus, Domus D.O.C., Metodo Domus Tua, il
  Segno Domus).
- Voce: empatica, raffinata, entusiasta, tecnologica, sicura — mai gergo legale, promesse
  indimostrabili, freddezza corporate o hard-selling. Nessun riferimento ad AI nei testi.
- Logo ufficiale PNG: non ridisegnare, non animare con morph/draw. Il logo nuovo (la cliente,
  10 set.) non è stato consegnato: si costruisce col logo attuale, `Logo.tsx` e i file
  `logo-domustua-*` (Alberto, 10 set.).
- Logo senza sfondo bianco (la cliente, 6 ago.). Nel preloader il badge poggia ancora su un disco
  carta (decisione di lavoro): domanda aperta.
- Tutte le scritte «Domus Tua» nel font del logo (la cliente, 10 set.). Passano dal token
  `--font-brand`, oggi Plus Jakarta Sans come segnaposto (Alberto, 10 set.: «Aspetto il logo
  nuovo»); quando il font arriva si cambia una riga. Il lockup dell'hero la rispetta, quello del
  preloader è ancora in Playfair: domanda aperta.

### Colore

- Palette: rosso #d20a0a (un accento per vista) + neutri caldi carta #fdf1ec, avorio #f6d9d0,
  avorio profondo #f2cfc5 + inchiostro #46423d (uguale alla grafite), pietra #625d56, filo #e9c9c0.
  Il rosso cupo #a30707 è lo stato hover/focus dei bottoni rossi e, a riposo, il colore dei testi
  rossi che devono reggere sull'avorio (errori e conferme dei form, chip dei filtri, contatore
  della mappa; dal 22 set., A51, sulla carta rosa pesca anche occhielli, etichette e numeri piccoli, link
  e il bottone a testo rosso: il rosso vivo #d20a0a lì fa 4,2:1).
- Niente nero (la cliente, 10 set.: «niente colore nero», «eliminare nero ovunque»): un solo fondo
  avorio, nessuna sezione scura. Restano scuri il pannello espresso #1c1512 del preloader
  (decisione di lavoro, 10 set., che nessuno ha approvato esplicitamente: domanda aperta) e
  l'immagine Open Graph, che usa ancora #1a1816.
- NIENTE SCRITTE BLACK (Alberto, 11 set.): testo in grafite #46423d, e la gerarchia la fanno peso e
  misura. Il riferimento scrive titoli e corpo in #1f1f1f, ed è probabilmente per questo che la
  pagina legge slavata: un inchiostro più scuro per i soli titoli (proposta #2e2a26) va chiesto ad
  Alberto, non deciso qui.
- DIVIETI: niente oro (con l'eccezione non confermata delle stelle), niente blu, niente nero,
  niente estetica SaaS, niente gradienti viola-blu, niente dark-tech, niente Inter.
- Oggi l'oro sta solo sulle stelle della valutazione Google: #d9a441, con gold-deep #a9812a,
  gold-light #eed07a e gold-spec #fff6d4 nei gradienti delle cinque stelle (tonalità: decisione di
  lavoro, 11 set.). È lo stato del codice, non un impegno: se il divieto dell'oro vada riscritto
  come «oro solo sulle stelle» è una domanda aperta.

### Forma

- NIENTE curve, NIENTE card, NIENTE transizioni di pagina curve (la cliente, 10 set.). Raggi e
  ombre dei token a zero, `PageTransition` ridotto a stub. Le poche curve rimaste hanno
  l'inventario unico in `DESIGN.md`, sezione Shapes.
- NIENTE fiori (la cliente, 10 set.): nessun fiore nel sito. Supera le direttive di agosto su fiori
  e cupole.
- NIENTE vignettature né veli sulle foto (la cliente, 10 set.). Dove una scritta bianca sta su
  un'immagine la regge un'ombra attaccata alle lettere (decisione di lavoro), nel Congedo e sulla
  copertina delle cinque stelle; nel preloader un alone scuro stacca la firma Pinyon. A riposo
  sopra la foto non si vede nessun rettangolo: lo strato del lampo delle cinque stelle resta a
  opacità 0 e si accende solo nel lampo.
- Il taglio fra le sezioni non si deve percepire (la cliente, 6 ago.): un solo fondo in tutti i
  capitoli, nessun cambio di tono.

### Tipografia

- Nessuna scritta piccola (la cliente, 10 set.): il testo delle pagine sta a 16 px o più (UI 1rem,
  corpo 19 px). Non la rispettano ancora il preloader (domanda aperta) e la mappa
  della ricerca: l'inventario completo è in DESIGN.md, «La regola dei 16 px».
- Grandezze come il riferimento (la cliente, 10 set.): scala in vw/vh, titoli h1–h4 maiuscoli,
  paragrafi grandi e leggeri in colonna di 38ch. Interlinee, colonna e scala sotto i 1024 px sono
  state corrette l'11 settembre (decisioni di lavoro); i numeri sono in `DESIGN.md`.
- Font: Playfair Display per titoli e capitoli (Fraunces ritirato, ago 2026), Plus Jakarta Sans per
  corpo e UI, Pinyon Script per il corsivo rosso (una parola-ornamento per capitolo e la firma
  «Raffaela Rizza» nell'hero). Le scritte «Domus Tua» passano da `--font-brand`.

### Motion

- Via tante animazioni e transizioni (la cliente, 10 set.): niente transizioni di pagina, niente
  cursore custom, niente WOW layer. Il sito deve restare bello ANCHE FERMO.
- Restano le animazioni che non erano curve (Alberto, 11 set.: «mantenendo quelle animazioni che
  non erano curve»): i pannelli orizzontali di «Perché Domus Tua» e il film delle cinque stelle,
  rifatti nel design nuovo.
- In tutto girano tre gesti (righe che salgono, fade-in, parallasse leggera), il monogramma che
  ruota in senso orario (la cliente, 10 set.), il preloader e TRE nastri pilotati dallo scroll,
  solo da 1024 px e con motion ok, tutti sticky su un corridoio e senza pin di GSAP: «Perché Domus
  Tua», le cinque stelle e la rotaia del team (la cliente, 10 set.: un carosello o uno scroll
  orizzontale con le foto grandi; meccanica scelta da Alberto lo stesso giorno). Nessun'altra
  sezione è pinnata: «Le voci» è un carosello nativo.
- La lama (Alberto, 19-20 set., A36: «per le foto non a schermo intero … vorrei questi effetti del sito di era-residence, tipo una slide transition di entrata»): le sette fotografie nei moduli che non hanno già il gesto del capitolo entrano col ritaglio a parallelogramma di era-residence e uno scivolo ≤ 10 %, senza scala (A27), come ruolo comune dei media; con reduced-motion ferme. Supera in parte C03 (sette foto in più che si muovono) e per 1,2 s C01 (bordo inclinato ma dritto): alla cliente nella domanda 27, dopo la piega del Congedo. Numeri e deroghe in `DESIGN.md` → «La lama» e `docs/direttive-foto-entrata.md`.
- Preloader più veloce (la cliente, 10 set.), nel modo scelto da Alberto: «Stesso film di oggi ma
  dimezzato», 4,63 s, una volta per sessione, mai con reduced-motion. L'ingresso l'ha rivoluto «come
  prima» (Alberto, 11 set.) ed è stato ripristinato lasciando la durata: se «come prima»
  comprendesse anche la durata è una domanda aperta.

### Primo schermo e testata

- Hero: la foto alta di Raffaela davanti alla villa con piscina è la pagina (A49, Alberto, 22 set.:
  «non c'è né l'immagine alta che fa da sfondo pagina a schermo intero, né l'effetto dello scroll
  dentro l'immagine»; A71: «sì, fallo, anche il voto e i due link … e falla no-bg così è più bella»):
  la piscina di A55 estesa a 2:3 con Higgsfield e col cielo trasparente, in flusso come le teste,
  senza corridoio, tuffo, zoom né lift. A riposo il primo schermo è cielo-carta e villa (la foto sale
  sotto la testata finché la piega non cade dove comincia il blocco: decisione di lavoro, da
  mostrare); scorrendo dentro la foto, il blocco (sovratitolo, H1, «Richiedi la valutazione», «Vendi
  casa» e «Cerco casa», il voto) in bianco senza ombra (A70) a destra di Raffaela, sulla banda scura
  del portico, e il lockup «Domus Tua» con la firma sull'acqua in basso a destra (A55); alla fine la
  foto si chiude nella cartolina (A53). Sul telefono la striscia 9:16 della stessa foto, il lockup
  sull'acqua e il blocco dopo la foto in inchiostro (decisione di lavoro). La maschera del preloader
  resta quella vecchia in pizzo (Alberto: «la preferisco, e poi all'entrata ci sarà la foto nuova, la
  maschera se ne va via con l'entrata ad arco sulla hero»). Niente subcopy né riga del founder (la
  cliente, 10 set.). Il «box vendi casa più a destra» della cliente era stato ribaltato da Alberto
  l'11 settembre; da lg il blocco ora sta a destra per la foto: se dirglielo è una domanda aperta.
- Testata su una riga (Alberto, 11 set.: il «menu sopra» fra le cose formattate male): logo, sei
  voci primarie e lingua, nessuna CTA desktop, il monogramma solo da xl. Le altre tre voci vivono
  nel menu del telefono e nel footer; la testata è sticky solo sotto lg e da lg scorre via come nel
  riferimento (decisioni di lavoro).
- Le teste delle pagine interne posano sulla carta (Alberto, 21 set., sera, A46: «su eraresidence
  questa foto che usa come background alta ha il cielo mascherato, è no bg: ecco perché sembra un
  tutt'uno il cielo con il colore dello sfondo del sito. Dobbiamo fare la stessa cosa nel nostro
  sito, dove ci sono le immagini così alte»): il cielo delle sette foto alte con cielo è
  trasparente (WebP con alpha), la villa posa sull'avorio, e le scritte — che con A38/A40 (20 set.)
  stavano bianche e nude dentro la foto — tornano nell'inchiostro della rivista, sopra il soggetto e
  mai sopra la foto; la testata sopra di loro è quella del resto del sito, in inchiostro. La deroga
  di Alberto a WCAG 1.4.3 per le scritte bianche sulla foto è chiusa per il blocco della testa; con
  A48 e A54 (22 set.: «portare le sezioni più sopra in modo che la foto sia semplicemente lo sfondo
  della pagina», «dobbiamo riempire più spazi possibili nelle foto alte a schermo intero», «metti
  una lieve ombra se non si legge, o fai le scritte più grandi») i tre punti e le sezioni che la
  pagina posa sulla foto partono subito sotto il blocco e la riempiono, nel grigio del lockup e senza ombra (A56, 22 set.: «le scritte bianche sopra le immagini, mettile di colore grigio, come quello della hero della scritta "domus"»; fino ad A56 in bianco con l'ombra)
  attaccata alle lettere (il valore unico del sito, decisione di lavoro D80) e coi corpi di testo
  alla misura del lead; su /acquista la ricerca intelligente sta lì, sulla foto, dopo la scritta
  della testa (A52), e a fine foto la foto si chiude nella cornice della cartolina (A53). Per quelle
  scritte la deroga resta. Stessa cosa per la finestra di
  Open Domus in home: il titolo «Open Domus» sta in inchiostro sul cielo, che è il fondo pagina, e dal
  22 set. (A47: «deve continuare, abbiamo fatto le immagini alte apposta per poterci scrollare a schermo
  intero senza uscire dalla foto»; «questa sezione va sopra l'immagine di open domus») la foto è la
  facciata 9:16 intera, che continua sotto la piega dopo le tende, col capitolo di Open Domus posato
  sulla sua metà bassa nel grigio del lockup (A56). Su /chi-siamo i valori posano sulla foto della testa (A54).
- CTA corte (decisione di lavoro, 11 set.): «Richiedi la valutazione» e le sue traduzioni corte su
  tutte le superfici, perché quella lunga sul telefono andava a capo. Resta l'heroPrimary tedesco
  di `ServiziContent.tsx`.

### Media e contenuti

- Tre moduli media, e la scatola segue il sorgente, non la griglia (decisione di lavoro, 11 set., in
  risposta alla «posizione delle foto e dei video» indicata da Alberto): nessuna foto viene
  ingrandita per riempire una cornice sbagliata.
- Una foto vera, in un posto solo (decisione di lavoro, 10 set.): una fotografia compare una volta
  per pagina.
- Niente render di riempimento (decisione di lavoro, 11 set.): una riga senza scatto vero si
  racconta col suo numero. `EditorialRows` lo fa da sé (foto solo se ogni riga ne ha una in
  `reali/`); immagini di repertorio restano nelle righe di `Services` in home, nella testa di nove
  pagine interne su undici e nel `BeforeAfter` di /vendi e /servizi, da sostituire con scatti veri.
- Ogni capitolo in un posto solo (decisione di lavoro, 11 set.): le recensioni (`Reviews`) vivono
  solo su /recensioni, i nove passi del Metodo solo su /metodo. In home ci sono le cinque stelle e
  «Le voci», rifatta al posto del muro delle voci (la cliente, 10 set.) come carosello di video più
  il widget Trustindex.
- Il pannello del territorio di «Perché Domus Tua» mostra una foto aerea (decisione di lavoro,
  11 set.), contro «togliere foto dopo ricerca» (la cliente, 10 set.): domanda aperta. Di quale
  villa si tratti e di chi siano i diritti del file è una domanda bloccante per la cliente
  (`docs/da-chiedere-alla-cliente.md` §2.2).

### Riferimenti

- **Riferimento visivo: https://www.immobiliaregoldengoal.it/** (la cliente, 10 set., che l'ha
  mostrato «tante volte»: «molto pulito, clean, profesionale, scritte grandi, font azzeccato,
  niente card, foto e video grandi, spazi gestiti bene»). Se ne misurano le conseguenze: fondo
  unico, nessuna card, raggi a 0, media grandi. Dossier `reverse-engineering/goldengoal/`
  (gitignorato), chiesto da Alberto il 10 settembre.
- **Riferimento di tecnica: era-residence.com** (Alberto, 11 e 13 set.: «anche era residence va
  dentro il desing come reference , non toglierlo»). È la fonte delle tecniche di tipografia,
  movimento e struttura che il codice usa: la tipografia dei titoli, cioè Playfair come didone e
  la scala in vw (dossier §2), il preloader con la maschera ad arco, la timeline d'ingresso e le
  sue ease (§4), il logo rotante (§5), i testi che salgono per righe (§7), lo scroller
  orizzontale pilotato dallo scroll con le parallasse interne (§11.1-11.2). Ne restano esclusi, per le
  direttive della cliente del 10 settembre, le cupole curve (§11.4), i fiori (§11.3) e le
  transizioni di pagina (§8). Dossier `reverse-engineering/era-residence/README.md` (gitignorato).
- Anti-riferimenti: template SaaS, gradienti viola-blu, dark-tech, Inter ovunque, e il vecchio
  stile curvo e smussato a card, con cupole e fiori.

### Domande aperte

Nessuna si risolve qui: il testo completo, con chi deve rispondere, è nella spec, §11.3.

1. Colore del testo: un inchiostro più scuro per i soli titoli? (Alberto)
2. La foto aerea dopo la ricerca: si toglie, o il divieto era solo sul fondale?
3. Il ritorno dei set piece: Alberto riferiva una richiesta della cliente?
4. «Menu sopra» e «posizione delle foto»: giudizio della cliente o di Alberto?
5. Preloader «come prima»: comprendeva anche la durata?
6. Didascalie del preloader sotto i 16 px: a 16 px o eccezione dichiarata?
7. Pannello espresso del preloader: resta?
8. Disco carta sotto il badge del preloader: resta?
9. Lockup del preloader in Playfair: si allinea a `--font-brand` ora o col logo nuovo?
10. «Box vendi casa più a destra», ribaltata: va detto alla cliente?
11. Oro: il divieto va riscritto come «oro solo sulle stelle»?

## Evidence on Hand

- Numeri reali: 4,9/5 su 542 recensioni Google, letti dal widget Trustindex vivo l'11 settembre 2026
  (`site.rating` e `site.reviewsCount` in `app/lib/site.ts`). Il numero è vivo: si rilegge dal
  widget ogni volta che si tocca quella riga (decisione di lavoro, 11 set.). Nel JSON-LD non c'è
  `aggregateRating`.
- In attività dal 2007. Nessuna metrica senza fonte in pagina: il conteggio video ("440+") e le
  stat numeriche della home sono stati rimossi perché non verificabili.
- Foto reali in `public/images/reali/` (founder, team, Open Domus, immobili, premi). Demo e
  rendering stanno in `public/images/`, da sostituire con scatti veri o col feed (vedi *Niente
  render di riempimento*).
- Video YouTube reali cablati in `app/lib/site.ts`; widget Trustindex reale. Le copertine dei video
  sono copertine YouTube con titolo, stelline e logo cotti dentro; `.dt-still-trim` le rifila in
  `Voci` e `FeaturedTestimonial`. È una correzione dichiarata, non un effetto, e sparisce il giorno
  in cui arrivano fotogrammi puliti (decisione di lavoro, 11 set.).
- Dati societari verificati in `app/lib/site.ts` (P.IVA, REA, sede, orari).
- NON fabbricare: premi, numeri di vendite, recensioni, loghi partner, citazioni di clienti, firme.
  `FeaturedTestimonial` non rende più citazione, autore e contesto, perché erano inventati;
  `Reviews` mostra il banner «Esempi dimostrativi» quando le card sono demo; l'hero scrive il nome
  in Pinyon Script, non una firma finta.

### In attesa dalla cliente

Dettagli in spec §11.4 e in `docs/da-chiedere-alla-cliente.md`.

1. **Logo nuovo e il suo font**; intanto `--font-brand` punta a Jakarta.
2. **Fotogrammi puliti dei video**, a 1920×1080, dai file sorgente; intanto `.dt-still-trim`.
3. **Cinque ritratti singoli del team** (Paloma Cavalcante, Eleonora D’Agati, Viola Benatti,
   Tiziana Galeone, Katya Fedrigo); intanto la rotaia usa `team-red.jpg` e `team-group.jpg`.
4. **Firma autografa reale**: `brand.signature` è vuota.
5. **Parole vere dei clienti** per le citazioni di `FeaturedTestimonial` e `Reviews`.

## Product Principles

1. Fiducia prima dello spettacolo: ogni animazione ha una ragione narrativa.
2. Un solo momento firma per schermata; il resto è disciplina.
3. Il movimento è un di più: tutto funziona e resta bello anche fermo.
4. Warm editorial, non SaaS: carta, serif, rosso usato col contagocce.
5. Mobile è metà del pubblico: niente scroll-hijack, versioni semplificate (i tre nastri pilotati
   dallo scroll esistono solo da 1024 px).

## Accessibility & Inclusion

prefers-reduced-motion rispettato ovunque (contenuto completo, statico); focus visibile brand; focus
trap nel menu; slider BeforeAfter con tastiera e ARIA; testo mai nascosto senza JS (fallback
scripting:none); tap target generosi su mobile. L'unica superficie scura è il pannello del
preloader (lockup avorio, didascalie `cream/60` e `cream/70`, sotto i 16 px: domanda aperta). Il
testo bianco sopra le immagini (copertina delle cinque stelle, firma del preloader) si regge su
un'ombra attaccata alle lettere, non su un velo; le teste delle pagine interne non hanno più testo
bianco (A46, 21 set.): le scritte stanno sull'avorio e reggono 4,5:1.
