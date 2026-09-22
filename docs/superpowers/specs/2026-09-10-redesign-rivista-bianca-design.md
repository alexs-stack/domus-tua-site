# Redesign "la rivista bianca" — specifica di design

Data: 2026-09-10 · Origine: chiamata con la cliente (note di Alberto) · Riferimento visivo pinnato dalla
cliente: https://www.immobiliaregoldengoal.it/ · Dossier tecnico del riferimento (misure, sorgenti,
screenshot): `reverse-engineering/goldengoal/README.md` (cartella di studio, gitignorata) ·
Riferimento di tecnica (Alberto, 11 e 13 settembre): era-residence.com, dossier
`reverse-engineering/era-residence/README.md` (gitignorato), col perimetro scritto in §11, A15 e A17.

Aggiornata il 2026-09-13. Il corpo (§1-§10) registra la chiamata del 10 settembre e le decisioni di
quel giorno. Dove una di queste è stata ribaltata o corretta, una nota in corsivo *(→ §11 …)* lo dice
accanto alla decisione originale, che resta com'era: è la storia del progetto, non un errore da
nascondere. Dove il testo affermava un fatto falso (un numero, una funzione che non esiste più,
un'attribuzione) è corretto sul posto. **§11 è il registro delle direttive**: tutte, con chi le ha
date, quando, le parole esatte, la fonte e lo stato nel codice; §11.3 elenca le domande aperte, §11.4
quel che la cliente deve ancora consegnare. Dove un documento e il codice non coincidono, fa fede il
codice.

## 1. Il brief, in una riga

La cliente boccia lo stile attuale — curvo, smussato, a card, con transizioni di pagina curve — e
vuole quello del riferimento: pulito, professionale, **scritte grandi, niente scritte piccole,
niente nero, niente curve**, foto e video grandi, spazi gestiti bene, molte meno animazioni.

Le regole generali della chiamata, che la tabella qui sotto non numera, stanno in §11 con le parole
esatte: C01 (niente curvo, niente card, niente transizioni di pagina curve), C02 (il riferimento),
C03 (eliminare tante animazioni e transizioni), C04 (nessuna scritta piccola). Oggi, in breve:

- **Niente curvo** è applicata nei token (raggi a 0px, ombre a none) e con `PageTransition` ridotto a
  stub. Le curve che restano hanno il loro inventario unico in `DESIGN.md`, sezione Shapes; §3.3
  ammetteva già `rounded-*` sui soli icon-button rotondi.
- **Il riferimento** non è una regola che si verifichi leggendo il codice; le conseguenze misurabili
  ci sono (un solo fondo `bg-cream`, nessuna card, raggi a 0, media a tutta larghezza o a 42vw).
- **Meno animazioni**: restano tolte le transizioni di pagina, il cursore custom e il resto del vecchio
  livello di effetti. L'11 settembre Alberto ha fatto tornare due set piece pilotati dallo scroll
  (A12), che superano in parte C03.
- **Nessuna scritta piccola** è rispettata nel testo delle pagine (`--text-ui` 16 px, `.eyebrow`
  16 px, sovratitolo dell'hero a `text-ui`), non ovunque: restano sotto i 16 px il preloader e la mappa
  della ricerca, con l'inventario completo in `DESIGN.md` («La regola dei 16 px»). Per il preloader è
  la domanda aperta 6 (§11.3).

Le direttive del 2026-08-06 (fiori SVG negli angoli, cupole, horizontal scroll pinnato ovunque,
"tante animazioni") sono **superate** da questa chiamata. Restano valide: nessun taglio percepibile
fra sezioni (C20, che ora si ottiene con un solo fondo), scritte e immagini grandi, logo reale
ovunque. *(Resta viva anche «metti il logo senza sfondo bianco» (C19), che il disco carta sotto il
badge del preloader non rispetta: domanda aperta, §11.3. era-residence.com, il riferimento delle
direttive di agosto, era stato dato per superato col passaggio a goldengoal del 10 settembre; l'11
Alberto l'ha rimesso fra i riferimenti, come riferimento di tecnica: A15, A17.)*

Lista puntuale della chiamata e dove si risolve:

| # | Richiesta | Risoluzione | § | Oggi (registro in §11) |
|---|---|---|---|---|
| 1 | Preloader più veloce | stesso film, `TEMPO` 2 → 1 (9,26 s → 4,63 s) | 6 | Applicata: 4,63 s (C05, A02). L'ingresso «come prima» chiesto l'11 settembre non ha cambiato la durata (A16). |
| 2 | Cuore che ruota in senso orario | `RotatingMark` e badge del preloader: monogramma +360° (`spinMarkBadge`, nominato qui il 10 settembre, è stato tolto in 6b11620: lo usava solo il sipario) | 6 | Applicata (C06): orario in testata e nel preloader, a velocità diverse. |
| 3 | Firma più in basso nella hero | script staccato sotto il lockup (≈ 1 em in più) | 4.1 | Applicata in un'altra forma: la firma sta a cavallo del bordo basso della banda fotografica (C07). |
| 4 | Eliminare "Valutazione professionale… RR Con Raffaela Rizza e il team" | via `subcopy` e riga founder dall'hero | 4.1 | Applicata (C08). |
| 5 | Via "Guarda il video", mettere "Vendi casa" | terzo bottone → `/vendi` | 4.1 | Applicata (C09). |
| 6 | Togliere foto dopo ricerca | via il fondale aereo di HorizonStory (sezione rifatta) | 4.4 | **Domanda aperta** (C10, D07): il fondale non c'è più, la foto aerea sì, nel pannello del territorio. |
| 7 | Box vendi casa più a destra | blocco CTA allineato a destra, sotto il video | 4.1 | **Superata** la sera stessa da Alberto, «rimettilo centrale» (C11, A04). Leggere «box» come il blocco CTA dell'hero è un'interpretazione di questa specifica. |
| 8 | Eliminare tutti i fiori | `Fioritura` e gli 8 consumatori rimossi | 7 | Applicata (C12). |
| 9 | Rifare "Il muro delle voci" | capitolo "Le voci": carosello video + 4,9/542 (da `site.ts`) + Trustindex | 4.5 | Applicata, poi corretta: il titolo col voto l'ha tolto una decisione di lavoro (C13). Il 10 settembre qui c'era scritto 531: il dato è 542 (D12). |
| 10 | Vignettatura no | via `.bg-ink` radiali, veli su foto, grana, PageTransition | 7 | Applicata (C14), con un'eccezione costruita: un'ombra attaccata alle lettere bianche sopra le immagini (Congedo, copertina delle cinque stelle) e un alone dietro la firma Pinyon del preloader. |
| 11 | Gestire le grandezze font come il riferimento | scala in vw/vh, uppercase, paragrafi grandi e leggeri | 3.2 | Applicata (C15); interlinee, colonna del lead e scala sotto i 1024 sono cambiate l'11 settembre: nota sotto §3.2. |
| 12 | Team: carosello o scroll orizzontale con foto grandi | rotaia orizzontale pilotata dallo scroll (`HorizontalRail`) | 4.13 | Applicata (C16); la meccanica l'ha scelta Alberto (A03). |
| 13 | Eliminare nero ovunque | nessuna superficie scura: hero, PageHero, footer, Paths, Manifesto, testimonianza | 3.1 | Applicata nelle pagine (C17), e dall'11 settembre nessun testo nero (A11). Restano scuri il pannello del preloader (D05, domanda aperta) e l'immagine Open Graph. |
| 14 | Logo nuovo + font del logo su tutte le scritte "Domus Tua" | logo attuale finché non arriva il file; token `--font-brand` per le scritte | 9 | **In attesa della cliente** per il logo (C18, A05, A06). **Non rispettata** la seconda metà: il lockup del preloader è in Playfair (domanda aperta). |

## 2. Decisioni prese con Alberto (2026-09-10)

*(Sono le risposte di Alberto alle quattro domande delle 18:16Z; le parole esatte dell'opzione scelta
e lo stato nel codice sono in §11: A05, A06, A02, A03.)*

1. **Font del corpo**: si decide quando arriva il logo nuovo. Nel frattempo resta Plus Jakarta Sans;
   le scritte "Domus Tua" usano un token unico `--font-brand` (oggi Jakarta 800, grafite + rosso
   come il logo) da ripuntare in un solo posto.
2. **Logo**: non c'è ancora il file nuovo → si costruisce con `public/logo-domustua-original.png`.
3. **Preloader**: stesso film (lockup, sagoma, porta ad arco, tuffo), a tempo dimezzato.
4. **Team**: scroll orizzontale pilotato dallo scroll verticale, foto grandi.

## 3. Il mondo visivo

### 3.0 Contratto di direzione (va nel commento di apertura di `app/page.tsx`)

- **THESIS**: una rivista immobiliare bianca. Titoli maiuscoli enormi, paragrafi grandi e leggeri,
  media squadrati a tutta larghezza, vuoto generoso. Rifiuta la home "a card" e la home
  "cinematografica scura": il contenuto è il colore.
- **OWN-WORLD**: un solo fondo avorio (#f9f5ef); Playfair Display maiuscolo per i titoli; corsivo
  Pinyon **rosso** come parola-ornamento di capitolo; rosso #d20a0a solo per accento e CTA; grafite
  per il testo; nessun raggio, nessuna ombra, nessun velo. Riconoscibile anche senza testi: titolo
  serif maiuscolo a 10vh, riga corsiva rossa, quadrato fotografico.
- **STORY**: chi deve vendere capisce in un colpo cosa fa l'agenzia, vede le persone e le case
  vere, legge le voci dei clienti, e trova una sola azione: chiedere la valutazione.
- **FIRST VIEWPORT**: header chiaro con logo grande a sinistra e nav maiuscola a destra; lockup
  "Domus Tua" (font del logo) a 13vw con firma calligrafica staccata sotto; H1 "Vendi casa a
  Tradate · al prezzo giusto, nei tempi giusti"; video a tutta larghezza che risale sotto il titolo;
  blocco CTA a destra sotto il video (Valutazione · Vendi casa · Cerco casa).
  *(→ §11, A04, A08, A09 e A10: composizione ribaltata da Alberto la sera stessa e l'11 settembre. Oggi la foto
  della stanza è una banda alta 60svh a tutta larghezza, senza velo, con sopra solo il lockup
  «Domus / Tua» su due righe centrato e la firma sul bordo basso; sotto, sull'avorio, sovratitolo,
  H1 a d3 (`max-w-[28ch]`), CTA e voto, tutti centrati. Nessun video sotto il titolo, nessun blocco
  a destra.)*
- **FORM**: canone del riferimento pinnato dalla cliente, eseguito fedelmente nella nostra palette
  (rosso al posto dell'oro, fondo chiaro al posto della banda nera). Nessun concept tournament.

### 3.1 Colore — strategia "Restrained"

| Token | Prima | Dopo | Uso |
|---|---|---|---|
| `--background` / `--color-cream` | #fffdfa / #f2ebda | **#f9f5ef** | l'unico fondo del sito |
| `--color-cream-deep` | #efe7d6 | #f4ece2 | header pieno, campi, fasce leggerissime |
| `--color-paper` | #fffdf8 | #fffdf8 | sfondo dei campi |
| `--color-line` | #e3d9c6 | #e4dccf | hairline dei campi e del footer |
| `--color-ink` / graphite / stone | invariati | invariati il 10 settembre; dall'11 `--color-ink` = `--color-graphite` = `--foreground` = **#46423d** (prima ink #1a1816: «NIENTE SCRITTE BLACK», Alberto, 09aff4b); stone #6b665f | testo; ink solo come colore di testo |
| `--color-red` | invariato | invariato (#d20a0a) | accento, CTA piene, corsivo di capitolo |
| `--color-espresso` / `wine` | superfici | **solo il pannello del preloader** (#1c1512 / #2a100f) | nessuna sezione scura. *(Eccezione messa scrivendo questa specifica, senza una parola esplicita della cliente né di Alberto: domanda aperta, §11.3.)* |
| oro | stelle | stelle; l'11 settembre più caldo: `--color-gold` #d9a441, gold-deep #a9812a, gold-light #eed07a, gold-spec #fff6d4 (decisione di lavoro, aff9b0e: «l'oro delle stelle leggeva mostarda sull'avorio») | invariato (unica eccezione, già sancita) |

Regola: **nessuna superficie scura** (`bg-ink`, `bg-espresso`, `bg-wine`, `bg-graphite`,
gradienti `from-ink/*`) fuori dal preloader. Testo bianco solo sulla banda video finale, senza velo.
*(Oggi è bianco su foto anche il titolo della copertina di StarReviews, e sulla
foto dell'hero stanno lockup e firma in grafite e rosso (§11: A10, D01, A12). Il bianco lo regge un'ombra
attaccata alle lettere, non un velo: §1 n. 10. Il riferimento scrive titoli e corpo in #1f1f1f, più
scuro del nostro ink: domanda aperta, §11.3.)*

### 3.2 Tipografia — la scala che risponde a "scritte grandi"

Regola del riferimento: i titoli scalano col viewport (vw in hero, vh nei capitoli), sono
maiuscoli, e i paragrafi sono grandi e leggeri in colonne strette (≤ 800 px).

| Token | Valore | Peso · interlinea | Ruolo |
|---|---|---|---|
| `--text-hero` | `clamp(3.1rem, 13vw, 13rem)` | 800 · 0.9 | lockup "Domus Tua" (font-brand) |
| `--text-d1` | `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)` | 500 · **0.98** (0.92 fino all'11 settembre) | titolo di capitolo, uppercase, UNO per sezione |
| `--text-d2` | `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)` | 500 · **1** (0.95 fino all'11 settembre) | sotto-capitolo, uppercase |
| `--text-d3` | `clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem)` | **500** sui titoli h1-h3 (qui c'era 400: vedi nota) · 1.05 | titoli di riga, uppercase |
| `--text-d4` | `clamp(1.45rem, 1.8vw, 1.75rem)` | 300 dove l'elemento ha `font-light` (le etichette del footer, di Open Domus, dei Contatti e del D.O.C.), altrimenti il peso dell'elemento · 1.2 | etichette grandi (footer, "Contattaci"), uppercase |
| `--text-lead` | `clamp(1.35rem, 1.72vw, 1.55rem)` | 300 · 1.4 | paragrafo editoriale; `.lead` in colonna da 38ch |
| `--text-body` | 1.1875rem (19 px) | 400 · 1.5 | corpo |
| `--text-ui` | 1rem (16 px) | uppercase, con peso e tracking diversi per ruolo: bottoni `.dt-btn` 600 e 0.08em (0.05em sotto 39.99rem, fb6a22c); `.eyebrow` 500 e 0.12em (dall'11 settembre, aff9b0e); voci della testata 400, perché non hanno classe di peso, e 0.1em (6e6559b). Qui c'era «500-600 · tracking 0.08em» per tutti | nav, eyebrow, bottoni, didascalie |
| `--text-script` | `clamp(2.6rem, 7vw, 7rem)` | Pinyon 400 · `.script-word` interlinea 0.8, rientro `var(--script-tuck, -0.2em)` | parola-ornamento rossa, una per capitolo |

*(→ §11, D11: decisioni di lavoro dell'11 settembre, aff9b0e e 3411a55. Interlinea 0.98 e 1 perché a
0.92 accenti e code entravano nella riga sopra; `.lead` a 38ch e non 50, perché con Jakarta 300 i
50ch facevano 82 caratteri per riga; il rientro della calligrafia passa da -0.42em a -0.2em. Sotto
63.99rem la scala cresce con la larghezza: d1 `clamp(2.55rem, 9.5vw, 7.5rem)`, d2
`clamp(2.15rem, 7.4vw, 4.5rem)`, d3 `clamp(1.5rem, 4.8vw, 2.6rem)`, script `clamp(3rem, 11vw, 7rem)`,
lead `clamp(1.3rem, 3.1vw, 1.55rem)` (blocco `@media (max-width: 63.99rem)` di `globals.css`). I pesi non stanno nei token ma
nell'elemento: dal 2026-09-10 sera (02d19d3, decisione di lavoro presa dopo i primi screenshot,
«senza questa regola il preflight di Tailwind li fa ereditare 400/700 a caso») h1, h2 e h3 sono a 500
e h4 a 400 (regola `h1, h2, h3 { font-weight: 500 }` di `globals.css`). Per questo un d3 su h3 pesa 500 e non 400 come prevedeva la
tabella, e il 300 di un d4 c'è solo dove l'elemento porta `font-light`.)*

Vincoli: **nessun testo sotto 16 px** (`.eyebrow` passa da 11 a 16 px; `text-xs/sm` vietati nel
contenuto); `h1, h2, h3, h4` uppercase per regola globale; `blockquote` e corsivi in tondo/basso.
I token `--text-d1…d4` esistenti vengono **ridefiniti** (non rinominati), così i consumatori
attuali ereditano la scala nuova.
*(Il vincolo dei 16 px oggi non vale nel preloader, domanda aperta 6 di §11.3, né nella mappa della
ricerca, che nessuna direttiva ha deciso (C04): l'inventario completo è in `DESIGN.md`, «La regola
dei 16 px».)*

### 3.3 Spazio, griglia, media

- Righe a tutta larghezza con padding laterale **8vw** (5vw sotto 768: qui era scritto 4vw, il
  costruito è 5vw); colonne di testo ≤ 800 px;
  asimmetrie con padding percentuali (es. sinistra 4vw, destra 18vw), non griglie complesse.
- Ritmo verticale: `clamp(6rem, 14vh, 11rem)` fra capitoli (`clamp(3rem, 8vh, 5rem)` sotto 768); più
  spazio sopra un titolo che sotto.
- Media: video 16:9 a tutta larghezza, foto **quadrate** (1:1) o 4:5, sempre `border-radius: 0`,
  nessun gradiente sopra, nessuna didascalia sopra la foto. Il play è un cerchio rosso 96 px (le
  icone tonde sono l'unica curva ammessa: play, frecce, WhatsApp).
  *(→ §11, D03 e D04: dall'11 settembre una foto sta in uno di tre moduli — `.dt-media-full` 16:9 a tutta
  larghezza, `.dt-media-half` 1:1, `.dt-media-column` 4:5, o 9:16 con `--tall`; da 64rem mezza e
  colonna valgono 42vw, max 640 px, tutti su `bg-cream-deep` — e il rapporto della scatola segue il
  sorgente, non la griglia: gli atti del Metodo sono `half` in 16:9, il video in evidenza è una
  colonna 9:16. I `sizes` dichiarano i pixel chiesti, non la larghezza della scatola (01a1f20). Il
  play scende a 56 px sotto lg nel carosello delle voci (360c76b). L'inventario delle curve
  rimaste, dentro e fuori questa eccezione, è in `DESIGN.md`, sezione Shapes.)*
- Raggi: `--radius-card`, `--radius-card-lg`, `--radius-field` → **0**. `rounded-*` ammesso solo
  su icon-button rotondi.

### 3.4 CTA e link

- `cta-solid` → rettangolo rosso pieno, etichetta 16 px uppercase tracciata, hover: rosso scuro.
- `cta`/`ghost` → link testuale uppercase con sottolineatura (come "CONTATTACI" del riferimento).
- Via il morph anello→pill, il riempimento circolare, l'aeroplanino, le facce scorrevoli. Le
  primitive `Cta`/`CtaButton`/`SendCta` restano con la stessa API; cambia solo il CSS.

### 3.5 Movimento — tre gesti e basta

Restano: `Reveal` (fade-up 0.9 s), `TextLines` (righe che salgono da una maschera, stagger 80 ms),
`Parallax` (±4 % sulle foto), Lenis. Tutto riproduce lo stesso ease lento del riferimento
(`cubic-bezier(.2,.65,.3,1)`). Nessuna sezione pinnata tranne la rotaia del team. *(Aggiornamento 2026-09-11, → §11, A12: su richiesta di Alberto tornano, rifatti senza curve, veli, scuro né testo sotto 16 px, i pannelli orizzontali di «Perché Domus Tua» — `HorizonStory` + `HorizonScroller`, con la tecnica dello scroller di era-residence (A17) — e il film delle cinque stelle — `StarReviews`; via cupola, fondale aereo, fiori, velo di vino, widget duplicato. Da 1024 px e con motion ok i nastri pilotati dallo scroll sono quindi tre, tutti a sticky + runway e nessuno col pin di GSAP: `HorizonScroller` (#storia), `StarReviews` (#recensioni, 360svh) e la rotaia del team (runway 120). «Le voci» resta un carosello nativo, non pinnato. Il fondale aereo non c'è più, ma la stessa foto è tornata nel pannello del territorio: §1 n. 6.)*
Reduced-motion: tutto fermo e visibile (regola già in vigore).

## 4. Home, sezione per sezione

| # | Oggi (file) | Domani |
|---|---|---|
| 4.1 | `HeroCinematic.tsx` (1008): foto a tutto schermo, velo espresso, lockup + script + H1 + subcopy + RR + 3 CTA + chip | **Hero chiaro** su fondo avorio: lockup `Domus Tua` in `--font-brand` a 13vw, script rosso "Raffaela Rizza" staccato sotto; H1 a `d2`; video `public/media/domus-hero.mp4` 16:9 a tutta larghezza (poster = foto attuale) che risale di ~10vh sotto il titolo; **blocco CTA a destra** sotto il video: `Richiedi la valutazione` (solid) · `Vendi casa` → /vendi · `Cerco casa` → #cerca; riga fiducia (stelle oro + 4,9/5 · 542 recensioni, da `site.ts`) in 16 px. Via subcopy, RR, chip premio in piccolo, scroll cue, velo, cornice Segno. Resta il rito intro→hero (`data-hero-*`) solo per far entrare le lettere. *(→ §11, A04 e A10: ribaltato da Alberto la sera stessa e l'11 settembre. Oggi la foto è una banda di 60svh dietro lockup e firma, senza velo; H1 a d3, CTA e voto centrati sull'avorio; il `<video>` si monta nella banda solo se abilitato, con motion ok e da 768 px.)* |
| 4.2 | `Posizionamento.tsx` | resta: eyebrow 16 px + titolo `d2` uppercase + lead 300 in colonna 700 px, allineato a sinistra con la foto quadrata reale a fianco (griglia 5/7). |
| 4.3 | `HomeSearchGateway.tsx`: due card (bianca + rossa) | **modulo a filo**: campi con solo bordo inferiore, etichette 16 px uppercase, bottone rosso rettangolare; la scorciatoia "vendi" diventa una riga di testo con link sottolineato. Nessuna card, nessun raggio. |
| 4.4 | `HorizonStory` + `HorizonScroller` (fondale aereo, cupola, pannelli orizzontali, fiori) | **"Come lavoriamo"** (nuovo `ComeLavoriamo.tsx`): titolo `d1` su due righe a sinistra + script rosso "Come lavoriamo" + lead 300 in colonna 660 px + **video in pagina** (featured, `LazyYouTubeEmbed`/`VideoLightbox` esistente) 16:9 a tutta larghezza con play rosso. Sotto, la riga territorio: foto quadrata + "Tra la Pineta e Milano" + testo. *(→ §11, A12 e D07: la sostituzione è stata ribaltata. `ComeLavoriamo.tsx` non esiste più: il suo copy è confluito in `HorizonStory`, tornata coi pannelli orizzontali, senza cupola né textPath. Il video in evidenza è verticale e sta in una colonna `.dt-media-column--tall` 9:16, non in una banda 16:9: a tutta larghezza sotto lg, e da lg larga al massimo 420 px (`lg:!max-w-[420px]` in `HorizonStory.tsx`) invece dei 42vw del modulo, perché il fotogramma sorgente ha 1280 px e a 605 px di colonna i visi si impastano; il pannello del territorio ha la foto aerea `/media/hero-aerial.jpg` in `.dt-media-full`, che contraddice §1 n. 6: domanda aperta.)* |
| 4.5 | `ReviewsWall` (muro sticky 520vh) + `StarReviews` (stelle 360svh) | **"Le voci"** (nuovo `Voci.tsx`): eyebrow "Cosa dicono di noi" + titolo `d1` che È il numero: `4,9 / 5 · 542 recensioni Google` (da `site.ts`, mai scritto a mano); **carosello** a scorrimento nativo con frecce (scroll-snap) dei 6 video reali di `wallVideos`, tessere 16:9 squadrate larghe 60vw (90vw mobile), titolo sotto in 19 px; poi `TrustindexEmbed` (intoccabile) e link "Leggi tutte le recensioni". Nessun morph, nessun pin. *(→ §11: `StarReviews` non è sparito, è tornato come capitolo #recensioni subito prima delle voci (A12). Il titolo-numero l'ha tolto una decisione di lavoro l'11 settembre (360c76b): oggi titolo d2 «Le storie in video» e conteggio a 16 px. Le tessere sono larghe 32vw da lg, 46vw da md e tutta la larghezza sul telefono; il video in evidenza è escluso dal carosello, perché sta già in `HorizonStory`; copertine rifilate con `dt-still-trim`.)* |
| 4.6 | `Paths.tsx` (pannelli scuri pinnati 520vh) | **"Due percorsi"**: due righe editoriali piane, Vendere / Acquistare, foto quadrata + titolo `d2` + lead + link sottolineato. Chiaro. |
| 4.7 | `Method.tsx` (3 atti con maschere circolari, fiori) | titolo `d1` su tre righe **allineato a destra** ("Un percorso chiaro / dalla prima stima / alla firma"), poi 3 atti come righe: script rosso a sinistra (Ascolto · Racconto · Firma) + lead a destra + foto quadrata; i 9 passi come lista numerata **01.-09.** (numeri a `d1` peso 300, titolo `d3`, testo 19 px). *(→ §11, D10: dall'11 settembre la home monta `<Method compact />`: testa e tre atti, con le foto in `.dt-media-half` 16:9, più un link ghost a /metodo. I nove passi stanno solo su /metodo (0fa94bc).)* |
| 4.8 | `OpenDomus.tsx` (card, coni di luce) | foto grande 4:5 + titolo `d2` + due colonne di benefici (venditore/acquirente) con titoli `d4`. |
| 4.9 | `DomusDocProtocol.tsx` (card 2.2rem, sigillo con lampo) | riga piana: titolo `d2`, intro lead, checklist in due colonne; sigillo SVG fermo a fianco del titolo. |
| 4.10 | `Services.tsx` (rotaia di card 4:5, HoverDistort) | titolo `d1` + griglia 3 colonne (1 su mobile) foto quadrata + titolo `d3` + testo 19 px; feature rendering come riga 6/6 con foto. Nessuna rotaia. |
| 4.11 | `CostiChiari.tsx` (card) | statement: titolo `d2` + script rosso "Nessun anticipo" + lead. |
| 4.12 | `FeaturedTestimonial.tsx` (bg-ink) | chiaro: foto quadrata a sinistra, citazione in Playfair `d3` tondo (non uppercase) a destra, nome 19 px, link video sottolineato. |
| 4.13 | `Social.tsx` + `Team.tsx` + `TeamTrail.tsx` | Social: piatto, chip senza raggio. **Team**: intro founder (foto 4:5 + citazione) poi **rotaia orizzontale** con `HorizontalRail runway` — ritratti 4:5 alti 70vh, nome `d2` uppercase, ruolo 19 px; ritratti mancanti = monogramma su campitura cream-deep (fino a consegna foto). Mobile: scorrimento nativo con snap (già supportato da `HorizontalRail`). `TeamTrail` rimosso. *(→ §11, A03, C16 e D03: dopo c122bf4 e 360c76b nessun monogramma né tessera vuota. L'intro founder è in `.dt-media-half`; la rotaia ha tre tessere `.dt-media-column` 4:5 — il ritratto di Raffaela, `team-red.jpg`, `team-group.jpg` — con didascalia di una riga, e sotto la rotaia i sei nomi a d3 col ruolo.)* |
| 4.14 | `Contact.tsx` (card, arch-frame, fiori) | form a filo come 4.3, foto quadrata (via arch-frame), recapiti in `d4`. |
| 4.15 | `KineticStrip` | rimosso. Al suo posto **banda video finale** (nuovo `Congedo.tsx`): `domus-hero.mp4` a tutta larghezza, titolo bianco `d1` "Vendere casa, senza stress." + link "Contattaci" sottolineato bianco. Senza velo. *(→ §11, C14 e D15: dall'11 settembre il bianco ha un'ombra attaccata alle lettere, `INK_ON_VIDEO`, perché il volo del drone gli porta sotto tende e pavimento chiari; il poster è `piscina-lusso.jpg` a `object-[16%_50%]` scale 1.14 (8b21627, 4a0d96e). Nessun rettangolo sopra il video.)* |
| 4.16 | `Footer.tsx` (bg-graphite, fiori, wordmark gigante) | **chiaro**: hairline in alto, logo 200 px, tre colonne (Domus Tua + payoff · Recapiti · Dove siamo) con titoli `d4`, testo 19 px; riga legale 16 px. Via l'uncover fisso. |
| — | `ThreadNav`, `ToneShift` ×3, `SectionDivider` ×2, `SurfaceVeil`, `SurfaceFlow`, `Cursor`, `PageTransition` | rimossi dalla home e dal layout. |

Header (`Header.tsx`): chiaro e trasparente sul fondo avorio, logo 200 px a sinistra, nav 16 px
uppercase tracciata a destra + CTA testuale "Vendi casa"; a scroll diventa `cream-deep` pieno con
hairline. Menu mobile: pannello pieno avorio, voci a `d2`. Via il pill scuro e il gradiente.
`RotatingMark` resta nell'header (monogramma orario).
*(→ §11, A13, D02 e D14: rifatta. Una riga sola alta `--dt-head-h`, logo `w-[clamp(150px,13vw,210px)]`,
`RotatingMark` a 56 px solo da xl; da lg sei voci primarie — Vendi, Acquista, Metodo Domus, Open
Domus, Chi siamo, Contatti — a `text-ui` maiuscolo tracking 0.1em, più il selettore lingua, e
**nessuna CTA** in testata (7d2d1d8, 6e6559b). Servizi, Recensioni e Lavora con noi restano nel
pannello del telefono e nel footer. Sotto lg la testata è sticky e dopo lo scroll diventa
`cream-deep` con hairline; da lg è in flusso, trasparente, e scorre via.)*

## 5. Pagine interne

- `PageHero.tsx` (scuro, min-h 82vh, scrim) → **hero chiaro**: titolo `clamp(3rem, 8vw, 9rem)`
  uppercase + script rosso di pagina (es. "Vendere", "Chi siamo") + sottotitolo `d4` centrato; foto
  grande sotto, squadrata. Stesso componente, tutte le rotte lo ereditano.
  *(→ §11, D15: rifatto l'11 settembre, 8b21627. Da lg la testa sta su due colonne `[1.1fr_1fr]`: a
  sinistra il titolo, `clamp(3rem, 8vw, 9rem)` interlinea 0.92 che da lg scende a
  `clamp(2.75rem, 4.8vw, 5.25rem)` e non usa il token d1; a destra lead e CTA. La foto è una banda
  `.dt-media-full` 4:5 sul telefono e 16:9 da md, a filo con i margini, che risale sotto il titolo.
  Usato su 11 pagine.)*
- `/metodo`: `ManifestoPin` (banda espresso pinnata) → statement chiaro `d1` non pinnato.
- `/vendi`, `/acquista`, `/open-domus`, `/servizi`, `/recensioni`, `/chi-siamo`, `/lavora-con-noi`,
  `/domande-frequenti`, `/case-vendute`, `/valutazione`: ereditano le sezioni rifatte; ogni
  `rounded-[…]` e `bg-ink`/`from-ink` residuo viene tolto (inventario: 17 raggi in open-domus, 5
  superfici scure). `EditorialRows`, `Highlights`, `BeforeAfter`, `FaqList`, `PropertyCard`:
  solo raggi e ombre a zero, layout invariato.
  *(→ §11, D10: dall'11 settembre `EditorialRows` mostra le foto solo se ogni riga ne ha una vera in
  `/reali/` (183acdd): oggi i quattro chiamanti — Acquista, Open Domus,
  Servizi, Vendi — rendono tutti la lista numerata. Il capitolo recensioni vive solo su /recensioni
  (ea1b584).)*
- `/case/[slug]`: fuori scope visivo tranne raggi/ombre a zero (logica intoccabile per PRODUCT.md).

## 6. Sistemi globali

- **Preloader**: `TEMPO = 1` in `app/lib/motion/intro-constants.ts`; ogni durata/ritardo delle
  keyframe in `globals.css` (righe 1716-2082 e 2236-2422 del file di quel giorno, che ne contava
  3283) dimezzata di conseguenza; `intro-clocks.test.ts` deve tornare verde senza modifiche alle
  asserzioni (è lui il metro).
  *(Quei numeri di riga valevano a 67afc9e; dopo le cancellazioni il file è molto più corto.)*
  *(→ §11, A16 e D06: l'11 settembre Alberto ha chiesto l'ingresso «come prima», ripristinato col patto
  della porta: `[data-pre-figure]` ha `top: calc(var(--dt-head-h) + 1px)` e
  `height: var(--dt-band-h)`, così la sagoma nel sipario e la banda dell'hero sono lo stesso scatto
  nella stessa scatola, e `intro-clocks` ha asserzioni nuove che lo presidiano. Restano quattro punti
  aperti sul preloader (§11.3): il pannello espresso, le didascalie sotto i 16 px, il disco carta sotto
  il badge e il lockup in Playfair a 11vh.)*
- **Cuore orario**: il tween di `RotatingMark` (`[data-rot-mark]` → `+360`) e, nel preloader,
  `dt-pre-spin` senza `reverse` su anello e monogramma (c1ba870). `spinMarkBadge`, previsto qui, è
  stato rimosso in 6b11620: lo usava solo il sipario di `PageTransition`.
- **PageTransition**: rimosso da `ChromeMount`; `transitionTo()` resta come funzione che fa un
  `router.push` puro (la usa `HomeSearchGateway`). `isTransitionCovering()` → sempre `false`.
- **SurfaceFlow / data-tone**: rimossi; il fondo è `--background` sul `body`.
- **Grana**: `<div className="grain"/>` rimosso dal layout.
- **Footer uncover**: rimosso (`html.dt-footer-reveal`); il footer torna in flusso.
- **Cursor**: rimosso.
- **globals.css**: via i blocchi HorizonStory, ReviewsWall, Cinque stelle, godray, sigillo,
  Social rail, CharFlip, ToneShift, ThreadNav, Due percorsi, PageTransition, Cursor, Trail/TeamTrail,
  Footer reveal, kinetic; via `.bg-ink` (radiali), `.arch-frame`, `.grain`. Restano: design
  system, Lenis, campi iOS, typography helpers, reveal, word reveal, CTA (riscritto), preloader,
  hero-rest, display-tight, `dt-railway`.
  *(→ §11, A12: i blocchi dei pannelli orizzontali e delle cinque stelle sono tornati l'11 settembre,
  senza `.dt-dome`.)*

## 7. Cosa viene cancellato (file)

*Aggiornamento 2026-09-11: `HorizonScroller`, `HorizonStory`, `StarReviews` e `lib/star-shape.ts` sono stati ripristinati e spogliati (vedi §3.5); `ComeLavoriamo.tsx` è confluito in `HorizonStory`. Non sono stati cancellati nemmeno `RailProgress`, che serve a `HorizontalRail`, e `Stats`, che usano /chi-siamo e /recensioni.*

`motion/`: Fioritura, HorizonScroller, ThreadNav, ToneShift, SurfaceVeil, SurfaceFlow, Cursor,
PageTransition (sostituito da un modulo di 20 righe con `transitionTo`), KineticStrip, CharFlip,
Atmosphere, HoverDistort, LiquidReveal, Magnetic, ManifestoPin, CameraIn, ScrubWords,
VelocityMarquee, DrawOnScroll, Odometer, RailProgress, MaskReveal. `HorizontalRail` **resta**.
`components/`: HorizonStory, ReviewsWall, StarReviews, TeamTrail, SectionDivider, BrandMotif
(resta solo `SegnoDomus` se usato dal sigillo), Stats. `lib/star-shape.ts`.
Ogni cancellazione passa da `npm run typecheck` e `npm run lint`: chi importa un modulo cancellato
viene sistemato nello stesso commit.

## 8. Test

- Unit: `intro-clocks.test.ts` (verde con TEMPO 1 e CSS dimezzato), `content-integrity.test.ts`
  (cammina i .tsx: verificare dopo le cancellazioni), `analytics.test.ts` (legge Contact,
  MobileActionBar, WhatsAppFloat, PropertyDetail: le loro sonde restano).
- e2e (`npm run test:e2e`, porta 3177): `mobile-effects.spec.ts` e `mobile-motion.spec.ts` testano
  l'arco (resta), la clip della hero media (via), la Fioritura (via), i pannelli di Paths (via),
  la transizione di pagina (via): i test delle cose rimosse vengono **rimossi**, quelli dell'arco
  aggiornati ai tempi nuovi. `a11y.spec.ts` (contrasto, un solo h1) e `pages.spec.ts` (title)
  devono restare verdi senza modifiche.
- Verifica visiva: `node reverse-engineering/goldengoal/capture.mjs ours` (desktop 1440 + iPhone
  13) prima e dopo; un solo giro di correzioni, un giro di conferma.

## 9. Aperto / fuori scope

- **Logo nuovo e font del logo**: quando arriva il file, si deposita in `public/` con i nomi di
  `docs/logo-assets.md` e si ripunta `--font-brand` (una riga in `globals.css`) + il `next/font`
  corrispondente in `layout.tsx`. Fino ad allora: logo attuale, `--font-brand` = Jakarta 800.
  *(Il lockup del preloader non usa ancora `--font-brand`: ripuntare il token non basterà, §1 n. 14.)*
- **Foto del team**: 5 ritratti mancanti (solo Raffaela ha la foto). La rotaia nasce con i
  monogrammi e si riempie da `app/lib/team.ts`.
  *(Non è andata così: dal 2026-09-10 sera (c122bf4) la rotaia usa foto di gruppo vere e nessun
  monogramma. I cinque ritratti sono ancora da consegnare: §11.4.)*
- **Firma reale**: `brand.signature` resta vuoto; la firma nella hero è il nome in Pinyon, come
  oggi (non una firma finta).
- Non si toccano: API, `lib/realsmart`, form lead, i18n, BeforeAfter/PropertyCard/Reviews (logica),
  metadata/JSON-LD/canonical, il Trustindex.
- **Non** si reintroducono stat numeriche senza fonte (PRODUCT.md).

## 10. Ordine di lavoro (per il piano)

1. Fondazioni: token (colori, raggi 0, scala), regole globali (uppercase, lead, eyebrow 16 px),
   CTA piatte, layout senza grana/SurfaceFlow/PageTransition/Cursor/uncover, TEMPO 1 + CSS dimezzato,
   cuore orario, Header e Footer chiari. → typecheck, unit, screenshot.
2. Home: hero → posizionamento/ricerca → Come lavoriamo → Le voci → Due percorsi → Metodo → Open
   Domus/D.O.C. → Servizi/Costi/Testimonianza → Social/Team/Contatti → Congedo. Un commit per
   capitolo, screenshot a fine fase.
3. Pagine interne: PageHero chiaro, ManifestoPin via, raggi/scure residue a zero.
4. Cancellazioni e pulizia di globals.css; test e2e aggiornati; `npm run check`.
5. Verifica finale desktop+mobile, revisione contro il contratto §3.0, DESIGN.md riscritto dal
   costruito, PRODUCT.md aggiornato (brand commitments: niente curve, niente fiori, niente scuro).

## 11. Registro delle direttive

Qui stanno tutte le direttive del progetto dal 10 settembre, più le cinque di agosto ancora vive (C19-C23): chi le
ha date, quando, le parole esatte (refusi compresi), la fonte, lo stato e come sono applicate nel
codice al 2026-09-13. È l'unico registro: `DESIGN.md` e `PRODUCT.md` riportano le regole con un
richiamo breve all'origine e rimandano qui. Le voci sono tre e restano separate:

- **la cliente** (C): Raffaela Rizza, con parole riportate da Alberto;
- **Alberto** (A): lo sviluppatore, con giudizi e scelte sue;
- **decisione di lavoro** (D): presa costruendo, con la ragione scritta nel commit, senza che nessuno
  l'abbia chiesta. Q01 è una domanda sospesa nata costruendo.

Il motivo è pratico: a una direttiva della cliente si risponde alla cliente, a una decisione di lavoro
no, e confonderle fa difendere con la cliente cose che non ha chiesto. Le fonti sono i transcript di
questa macchina (orari UTC), i messaggi di commit e il codice. Alcuni commit dell'11 settembre
(6e6559b, 5304dfd) e alcuni commenti del codice hanno dato al cliente frasi di Alberto: per sapere chi
ha chiesto cosa vale questa sezione. Stati: *applicata*; *superata* (si dice da cosa); *domanda
aperta* (§11.3, col numero); *in attesa della cliente* (§11.4); *da costruire* (decisa e non ancora costruita, scritta alla lettera «decisa il 13 set., da costruire (piano 2026-09-13)»: chi la costruisce e la verifica, di regola la chiusura del piano, riscrive la cella di una voce nuova con lo stato del costruito e l'hash del commit nell'ultima colonna, e in una nota mette al posto del segno «**Applicata** (commit <hash>)»). Fino al 13 settembre il registro stava
anche in `DESIGN.md` e `PRODUCT.md`, in copie che si contraddicevano; da allora sta solo qui.

### 11.1 La cliente e Alberto

#### La cliente (riferita da Alberto)

Le voci del 2026-09-10 vengono tutte dal messaggio in cui Alberto ha riportato la chiamata (17:44Z);
C19 e C20 dalle direttive del 2026-08-06, registrate nella memoria di progetto
(`domus-direttive-cliente-scroll.md`). C21, C22 e C23 (3, 4 e 26 agosto) sono entrate nel registro il 13
settembre: le parole vengono dai commenti del codice e dai commit che le hanno applicate.

| ID | Data | Parole esatte | Stato e applicazione | Commit |
|---|---|---|---|---|
| C01 | 2026-09-10 | «lo stile del nostro sito curvo e smuussato , con card ,e transizioni di pagina curve non piace per niente !» · «nessuna scritta piccola , niente colore nero , e niente curvo» | **Applicata, con eccezioni costruite.** `--radius-card`, `--radius-card-lg` e `--radius-field` valgono 0px; `--shadow-card`, `--shadow-card-hover` e `--shadow-float` valgono none; `PageTransition` è ridotto a stub. Le curve rimaste sono inventariate in `DESIGN.md`, sezione Shapes. | b9e6b7f, 178c6b5, ab5cf6d |
| C02 | 2026-09-10 | «mi ha mostrato tante volte questo sito : https://www.immobiliaregoldengoal.it/ . è molto pulito , clean , profesionale , scritte grandi , font azzeccato , niente card , foto e video grandi , spazi gestiti bene» | **Applicata, come riferimento visivo.** Il codice ne porta le conseguenze misurabili (un solo fondo `bg-cream`, nessuna card, raggi a 0, media a tutta larghezza o a 42vw); il giudizio d'insieme, «pulito, professionale», dal codice non si ricava. Accanto c'è il riferimento di tecnica, era-residence (A15, A17). | b9e6b7f |
| C03 | 2026-09-10 | «dobbiamo rifare tante cose , e eliminare tante animazioni e transizioni» | **Superata in parte da A12**; da A18-A20 (Alberto, 13 set.) decisa il 13 set., da costruire (piano 2026-09-13), da mostrare alla cliente: domanda aperta 12. Restano tolte le transizioni di pagina, `Cursor`, `Magnetic`, `data-cursor` e il resto del WOW layer. Oggi, da 1024 px con motion ok, girano tre nastri pilotati dallo scroll, tutti sticky su un corridoio e nessuno col pin di GSAP: `HorizonScroller` (#storia), `StarReviews` (#recensioni, 360svh) e la rotaia del team (runway 120). «Le voci» è un carosello nativo, non pinnato. | 178c6b5, 3cee992, 6b11620 |
| C04 | 2026-09-10 | «nessuna scritta piccola , niente colore nero , e niente curvo» (la seconda frase di C01: qui conta la prima parte) | **Domanda aperta (6).** Rispettata nel testo delle pagine: `--text-ui` 1rem, `--text-body` 1.1875rem, `.eyebrow` 16 px, sovratitolo dell'hero a `text-ui`. Non rispettata nelle didascalie del preloader («Immobiliare», «dal 2007», `text-[0.68rem]`) e nel suo payoff (`text-[0.82rem]`, `PreloaderShell.tsx`), né nelle cifre dei segnaposto della mappa della ricerca, calcolate da 11 a 16 px (nei cluster da 14 a 22 px, `PropertyMap.tsx`), che nessuna direttiva ha deciso. | b9e6b7f, ab5cf6d |
| C05 | 2026-09-10 | «preloader piu veloce» | **Applicata** come ha scelto Alberto (A02): `TEMPO = 1` in `intro-constants.ts`, `INTRO_MS` 4630; il CSS è allineato (porta 1.1 s a 2.25 s, tuffo 1.5 s a 3.13 s). Prima era `TEMPO = 2`, 9,26 s, scelta della cliente del 2026-08-18. Dal 13 settembre (A18, A20, D31) decisa il 13 set., da costruire (piano 2026-09-13): il film intero da 4,63 s suona solo alla prima apertura della home, gli altri caricamenti completi avranno la porta corta da 2,38 s su avorio profondo. | 456026a |
| C06 | 2026-09-10 | «cuore che ruota in senso orario» | **Applicata.** `RotatingMark` (in testata da xl, 56 px) gira in GSAP in senso orario a 30°/s, cioè 12 s a giro; con lo scroll sale a 30 più 10 volte la velocità dello scroll e non si inverte mai. Nel preloader anello e monogramma usano `dt-pre-spin`, 6 s a giro: le due velocità sono diverse. Supera la direttiva del 2026-08-05, «la rotazione del logo dev essere opposta a quella del cerchio attorno». Dal 13 settembre (A21, D34) decisa il 13 set., da costruire (piano 2026-09-13): il monogramma resta a schermo da 1024 px, con velocità `30 + 10·min(\|v\|, VMAX)`, sempre oraria; oggi `RotatingMark.tsx:73` non ha il tetto `VMAX`. | 456026a, c1ba870 |
| C07 | 2026-09-10 | «firma piu in basso nella hero» | **Applicata in un'altra forma.** Da quando la foto sta dietro il lockup (A10) la firma «Raffaela Rizza» sta a cavallo del bordo basso della banda: `translate-y-[26%]`, `--script-tuck: 0`, `clamp(2.2rem, 6vw, 5.5rem)` (`HeroCinematic.tsx`). | deb1291, aff9b0e, fd07a63 |
| C08 | 2026-09-10 | «eliminare : Valutazione professionale, documenti verificati prima di andare sul mercato, marketing curato e Open Domus. Un unico metodo, dalla prima stima alla firma dal notaio. RR Con Raffaela Rizza e il team» | **Applicata:** via subcopy e riga founder dall'hero. Parole simili restano nella meta description della home, che in pagina non si vede. | deb1291 |
| C09 | 2026-09-10 | «togliere guarda video bottone : mettere bottone vendi casa -» | **Applicata:** `cta-solid` «Richiedi la valutazione» → /valutazione-immobile-tradate, ghost «Vendi casa» → /vendi, ghost «Cerco casa» → #cerca; nessun bottone video. | deb1291 |
| C10 | 2026-09-10 | «togliere foto dopo ricerca .» | **Domanda aperta (2).** Il fondale aereo di `HorizonStory` non c'è più, ma lo stesso file `/media/hero-aerial.jpg` illustra il pannello del territorio in `.dt-media-full` (D07), nel primo capitolo dopo `HomeSearchGateway`. Rispettata alla lettera, non nella sostanza. | 024d354, 360c76b |
| C11 | 2026-09-10 | «box vendi casa piu a destra» | **Superata da A04** la sera stessa: sovratitolo, H1 e CTA sono centrati. Leggere «box» come il blocco CTA dell'hero è un'interpretazione di questa specifica (domanda aperta 10). | deb1291; ribaltata in e6e34bd |
| C12 | 2026-09-10 | «ELIMINARE tutti i  FIORI» | **Applicata:** `Fioritura.tsx` non esiste e nessun fiore viene disegnato; la parola resta solo in qualche commento. Supera le direttive di agosto su fiori e cupole. | 3cee992 |
| C13 | 2026-09-10 | «RIFARE SEZIONE IL MURO DELLE VOCI» | **Applicata:** `Voci.tsx` (#voci), carosello nativo con snap più il widget Trustindex; `ReviewsWall` è rimosso. Il titolo d1 col voto l'ha tolto il giorno dopo una decisione di lavoro (360c76b: lo stesso numero stava già nell'hero e nelle cinque stelle): oggi il titolo è «Le storie in video» a d2 e il conteggio una riga a 16 px. Copertine rifilate (D13). | 44d3a6c, 360c76b, 39cedc3 |
| C14 | 2026-09-10 | «VIGNETTATURA NO !» | **Applicata, con un'eccezione costruita.** Nessun velo né vignettatura su hero, cinque stelle e Congedo. Dove una scritta bianca sta su un'immagine la regge un'ombra attaccata alle lettere: `INK_ON_VIDEO` nel Congedo, `0 1px 2px rgb(0 0 0/.25)` sulla copertina delle cinque stelle; nel preloader un alone scuro (`0 2px 28px`) stacca la firma Pinyon rossa, non il lockup. A riposo sopra le foto non si vede nessun rettangolo: lo strato del lampo di `StarReviews`, `.dt-starrev_flash`, resta a opacità 0 e si accende solo nel lampo. | 178c6b5, 09aff4b, 8b21627, 4a0d96e |
| C15 | 2026-09-10 | «PENSARE A COME  GESTIRE GRANDEZZE FONT PER RENDERLO COME IL SITO DI RIFERIMENTO» | **Applicata:** scala in vw/vh (§3.2) e titoli h1-h4 maiuscoli; interlinee, colonna del lead e scala sotto i 1024 px corrette l'11 settembre da decisioni di lavoro (D11). I valori sono nel frontmatter di `DESIGN.md`. | b9e6b7f, aff9b0e |
| C16 | 2026-09-10 | «cambiare sezione team , preferisce un carosello o uno scroll orizzontale con le foto grandi , piuttosto che quello che c'è attualmente del delpth fade» | **Applicata** con la meccanica scelta da Alberto (A03): `HorizontalRail runway={120} snapMobile`, tre tessere `.dt-media-column` 4:5 (il ritratto di Raffaela, `team-red.jpg`, `team-group.jpg`) e sotto la rotaia i sei nomi a d3. `TeamTrail` e il depth fade sono rimossi. | cf9fe39, c122bf4, 360c76b |
| C17 | 2026-09-10 | «eliminare nero ovunque» | **Applicata nelle pagine:** fondo unico `bg-cream`, `themeColor` #f9f5ef, nessuna sezione scura, e dall'11 settembre nessun testo nero (A11). Restano scuri il pannello del preloader (`bg-espresso` #1c1512 con `.dt-pre-fondo`: D05, domanda aperta 7) e l'immagine Open Graph (`app/opengraph-image.tsx`, #1a1816 come colore e come fondo). `--color-espresso` e `--color-wine` sono ancora definiti. | b9e6b7f, ab5cf6d, 09aff4b |
| C18 | 2026-09-10 | «mettere logo nuovo , e usare stesso font del logo in tutte le scritte Domus Tua» | **In attesa della cliente** per il logo (§11.4): `--font-brand` vale `var(--font-jakarta)` come segnaposto (A05, A06). **Non rispettata** la seconda metà: `font-brand` lo usa solo il lockup dell'hero, mentre il lockup «Domus Tua» del preloader è `font-hero`, Playfair, a 11vh (domanda aperta 9). | b9e6b7f, deb1291 |
| C19 | 2026-08-06 | «metti il logo senza sfondo bianco» | **Domanda aperta (8).** Nel preloader il badge poggia su un disco `rounded-full bg-paper p-2`, tenuto per scelta di lavoro in c1ba870. Nessun documento dice che la regola sia stata allentata; «logo reale ovunque» non la sostituisce. | 9048a62, c1ba870 |
| C20 | 2026-08-06 | «il taglio non si deve percepire» | **Applicata:** un solo fondo `bg-cream` in tutti i capitoli, nessun cambio di tono; non misurata col ΔRGB. | b9e6b7f |
| C21 | 2026-08-03 | parole non conservate; il codice le riporta come «niente video nell'hero, resta la foto» e «Ritmo disteso» | **Applicata** per il video: `heroCinematic.enabled: false` (`media.ts:16-18`), gate spento (`HeroCinematic.tsx:343-346`). Per il ritmo superata da A20 (Alberto, 13 set.): decisa il 13 set., da costruire (piano 2026-09-13), le lettere dell'hero passeranno da `dur.hero` 1,4 s e stagger larghi (`HeroCinematic.tsx:272-273`) ai tempi di Era, 1,2 s (spec 13 set. §2.2). Il video resta spento anche col tuffo. | fbbd0cb |
| C22 | 2026-08-04 | parole non conservate; il codice le riporta come «Replay a ogni passaggio» e «RIGIOCA a ogni passaggio, in entrambe le direzioni» | **Applicata:** i reveal rigiocano (`Reveal.tsx:31-39`, `TextLines.tsx:4-6`); oggi i blocchi di `Reveal` si spengono anche uscendo dall'alto e rigiocano rientrando, i titoli di `TextLines` escono solo risalendo sotto «top 86%» (`TextLines.tsx:114-115`). **Rafforzata da A18** («entrate e uscite speculari»), decisa il 13 set., da costruire (piano 2026-09-13): col motore nuovo l'uscita si vedrà sopra la linea dell'85 % (spec 13 set. §1.2 e §2.4). Per questo punto A18 supera C03, che chiedeva meno animazioni. | 545a2b2 |
| C23 | 2026-08-26 | «il logo dev'essere quello grigio e rosso, non dobbiamo cambiare il colore rendendolo bianco e rosso» | **Applicata e presidiata:** `logo-colore.test.ts:1-14` pretende i due colori depositati del vettoriale e vieta di rendere le negative raster; `MarkDomus.tsx:27-37` ha tolto la variante chiara e tiene #595a58 e #e30716; `MarkBadge.tsx:67-72` lo ripete. Il cambio di tema del monogramma (spec 13 set. §6.1), decisa il 13 set., da costruire (piano 2026-09-13), tingerà solo le tacche dell'anello. | 9048a62 |

#### Alberto

| ID | Data | Parole esatte | Stato e applicazione | Fonte |
|---|---|---|---|---|
| A01 | 2026-09-10, 17:44Z, nel messaggio della chiamata | «fai un reverse engineering del sito in questione per avere tutto il codice sorgente di come è fatto» | **Applicata, fuori dal codice del sito:** il dossier `reverse-engineering/goldengoal/` esiste, gitignorato, e alla riga 86 del suo README registra il colore del testo del riferimento, #1f1f1f (Q01). | transcript |
| A02 | 2026-09-10, 18:16Z, domanda «Preloader» | «Stesso film di oggi ma dimezzato» | **Applicata:** `TEMPO = 1`, lo stesso film ad arco in 4,63 s. | 456026a |
| A03 | 2026-09-10, 18:16Z, domanda «Sezione team» | «Scroll orizzontale pilotato dallo scroll verticale» | **Applicata** da 1024 px con motion ok: `.dt-railway[data-on]` è alto `calc(rail-len + 120svh)` e la rotaia dentro è sticky. Sotto 1024 px è uno scroll orizzontale nativo con snap e `RailProgress`. | cf9fe39 |
| A04 | 2026-09-10, 20:54Z, dopo la revisione | «nella hero hai cambiato le posizioni non mi piace , rimettilo centrale» | **Applicata; ribalta C11.** Il lockup «Domus / Tua» su due righe è centrato nella banda; sovratitolo, H1 (d3, `max-w-[28ch]`), CTA e voto sono centrati sull'avorio. | e6e34bd |
| A05 | 2026-09-10, 18:16Z, domanda «Font» | «Aspetto il logo nuovo» | **In attesa della cliente:** `--font-sans` e `--font-brand` puntano entrambi a Plus Jakarta Sans; quando arriva il logo si cambiano una riga in `globals.css` e il `next/font` in `layout.tsx` (§9). | b9e6b7f |
| A06 | 2026-09-10, 18:16Z, domanda «Logo nuovo» | «Non ce l'ho ancora: costruisci col logo attuale (Recommended)» | **Applicata:** `Logo.tsx` coi file attuali `logo-domustua-*`; in testata `w-[clamp(150px,13vw,210px)]`. | transcript |
| A07 | 2026-09-10, 20:54Z | «inoltre non vedo piu il preloader» | **Nessun cambio al codice:** il film suona solo alla prima visita della sessione (`dt-intro-seen`), con motion ok e senza ancora nell'URL, e si salta con un tocco o un tasto. | transcript |
| A08 | 2026-09-10, 20:55Z, messaggio in coda | «hai cambiato tutto , la hero rimettila con la foto sotto la scritta» | **Superata da A10:** la foto non sta più sotto il testo, è la banda alta dietro il lockup. | e6e34bd |
| A09 | 2026-09-10, 20:56Z, messaggio in coda | «lascia il nuovo font pero , non rimetterlo esattamente come prima , intendo solo le posizioni» | **Applicata:** il lockup resta `font-brand` (Jakarta) `text-hero` extrabold, tracking -0.02em, maiuscole e minuscole, «Domus» grafite e «Tua» rossa; l'H1 resta Playfair. «Nuovo font» vuol dire la tipografia della rivista bianca, non un font consegnato: l'oggetto di e6e34bd («col font nuovo») si presta all'equivoco. | e6e34bd |
| A10 | 2026-09-11, citato in 09aff4b (sessione da portatile, nessun transcript su questa macchina) | «la foto nella hero va messa dietro la scritta Domus Tua, non più avanti, come era prima del cambiamento» | **Applicata:** banda `h-[var(--dt-band-h)]` = 60svh a tutta larghezza su `bg-cream-deep`; `next/image` con `preload`, quality 78, `object-cover`, `objectPosition` «10% 0%», nessun velo; il `<video>` si monta solo se abilitato, con motion ok e da 768 px. Che sulla foto stiano solo lockup e firma è D01. | 09aff4b |
| A11 | 2026-09-11, citato in 09aff4b | «NIENTE SCRITTE BLACK» | **Applicata:** `--color-ink` = `--color-graphite` = `--foreground` = #46423d (prima l'ink era #1a1816). Il riferimento scrive in #1f1f1f: Q01. | 09aff4b |
| A12 | 2026-09-11, 024d354 la introduce con «Alberto, 2026-09-11:» | «dovevamo fare un redesign, ma mantenendo quelle animazioni che non erano curve, tipo quella del 5 stelle, lo scroll orizzontale nella sezione perché domus tua … come prima ma con il nuovo design, niente curvo» | **Applicata; supera in parte C03.** `page.tsx` monta `HorizonStory` (#storia, senza cupola né textPath; pannello statement 100vw, territorio 126vw) e `StarReviews` (#recensioni, corsa 360svh, scrub 0.6; sotto 1024 px un film a tempo, `FILM_MS` 3000, in un riquadro alto al massimo 62svh). Da 1024 px entrambi solo con motion ok. Se Alberto riferisse la cliente è la domanda aperta 3. | 024d354 |
| A13 | 2026-09-11, 13:46Z | «ok , ora dobbiamo rendere ancora piu bello però , perchè con questo redesign , sono emersi un sacco di cose brutte e formattate male , a livello  layout , e di scelta . come il menu sopra» | **Applicata:** testata su una riga alta `--dt-head-h`, logo a `w-[clamp(150px,13vw,210px)]`, `RotatingMark` a 56 px solo da xl; da lg sei voci primarie (D02) a `text-ui` maiuscolo, tracking 0.1em, più il selettore lingua; nessuna CTA in testata. Il messaggio di 6e6559b la dà al cliente: domanda aperta 4. | 6e6559b |
| A14 | 2026-09-11, 13:46Z, nello stesso messaggio | «la posizione delle foto e dei video etc.» | **Applicata** con i tre moduli media (D03). Il messaggio di 5304dfd la dà al cliente («che il cliente sente sbagliata»): domanda aperta 4. | 5304dfd |
| A15 | 2026-09-11, 13:46Z | «utilizza anche come riferimento il sito vecchio al quale avevamo preso spunto : eraresidence» | **Applicata:** era-residence.com è il riferimento di tecnica del sistema, accanto al riferimento visivo di C02, col perimetro di A17. Il dossier `reverse-engineering/era-residence/README.md` (gitignorato) è la fonte citata dai commenti di `Preloader`, `RotatingMark`, `HorizonScroller` e `TextLines`, ed è servito a ripristinare l'ingresso del preloader (A16). Era il riferimento delle direttive del 6 agosto; col passaggio a goldengoal del 10 settembre la memoria di progetto lo dava per superato, e questa direttiva lo rimette fra i riferimenti. | transcript |
| A16 | 2026-09-11, 13:46Z | «inoltre vedo che c'è un problema sul preloader , non è piu come prima . lo rivoglio come prima , l'animazione di entrata» | **Applicata** col patto della porta (D06): prima si vedevano per 750 ms due Raffaela di misura diversa. La durata è rimasta 4,63 s: se «come prima» comprendesse anche i 9,26 s di `TEMPO = 2` è la domanda aperta 5. | 6e6559b |
| A17 | 2026-09-13, nella sessione di consolidamento dei documenti | «anche era residence va dentro il desing come reference , non toglierlo» | **Applicata il 2026-09-13 nei documenti.** I riferimenti del sistema sono due: immobiliaregoldengoal.it per l'aspetto (C02) ed era-residence.com per le tecniche di tipografia, movimento e struttura che il codice usa davvero — dossier §2 (tipografia dei titoli: Playfair come didone display, alternativa libera alla sua Ambroise François, e la scala in vw dentro un `clamp`), §4 (preloader con maschera ad arco, timeline d'ingresso ed ease), §5 (logo rotante), §7 (testi che salgono per righe), §11.1-11.2 (scroller orizzontale pilotato dallo scroll, con parallasse interne). Restano esclusi dalle direttive della cliente del 10 settembre le cupole curve (§11.4 del dossier; C01), i fiori (§11.3; C12) e le transizioni di pagina (§8; C01). `DESIGN.md`, `.impeccable/design.json`, `PRODUCT.md` e il README lo nominano con questo perimetro. Il §2 e le ease sono entrati nel perimetro dichiarato il 2026-09-13, dopo la verifica sul codice: li citano `layout.tsx`, `globals.css` e `gsap.ts`, e sono in uso da agosto. | transcript |
| A18 | 2026-09-13, risposta alla domanda sul budget di movimento (fra «disciplina + 3 momenti», «solo disciplina», «coreografia piena») | «Coreografia piena» | decisa il 13 set., da costruire (piano 2026-09-13). Da mostrare alla cliente perché supera C03 (domanda aperta 12). Ogni capitolo della home con un comportamento suo legato allo scroll; entrate e uscite speculari; monogramma sempre visibile con cambio di tema sopra le foto; porta corta del preloader alle ricariche. Supera anche il Don't di `DESIGN.md:587` sui tre nastri. Design in `docs/superpowers/specs/2026-09-13-coreografia-era-residence-design.md` (spec 13 set.) §0 e §3. | transcript 2026-09-13; memoria `domus-coreografia-era.md:13` |
| A19 | 2026-09-13, risposta alla domanda sui corridoi (fra «nessun corridoio nuovo», «solo l'hero», «dove serve») | «Sticky dove serve» | decisa il 13 set., da costruire (piano 2026-09-13). Da mostrare alla cliente perché supera C03 (domanda aperta 12). Sei corridoi in home: `HorizonStory` (#storia), `StarReviews` (#recensioni), rotaia del team, più il tuffo dell'hero, la finestra di Open Domus e la cartolina del Congedo; tutti `position: sticky` su un corridoio, mai il pin di GSAP, da 1024 px e 640 px d'altezza con motion ok (spec 13 set. §4). Oggi i corridoi sono i tre di C03. | transcript 2026-09-13; memoria `domus-coreografia-era.md:14` |
| A20 | 2026-09-13, risposta alla domanda sull'impianto (fra «un gesto per capitolo», «per atti», «fedeltà letterale») | «Fedeltà letterale» | decisa il 13 set., da costruire (piano 2026-09-13). Da mostrare alla cliente perché supera C03 (domanda aperta 12). In home un gesto per capitolo e nessuna coppia di capitoli con la stessa ease, lo stesso tempo o lo stesso innesco (spec 13 set. §3.1); tuffo sticky sulle 11 PageHero; flip per lettera su tutti i titoli; porta corta su ogni rotta. Alberto ha scelto l'opzione che diceva «rischio: LCP e H1 nascosti su 14 pagine»: il rischio è accettato e si ingegnerizza (spec 13 set. §2.5). | transcript 2026-09-13; memoria `domus-coreografia-era.md:16` |
| A21 | 2026-09-13, domanda di forma 1 (monogramma) | «Si stacca da 1024» | decisa il 13 set., da costruire (piano 2026-09-13); D34, spec 13 set. §6.1: da 1024 px il cuore lascia la testata e resta nel margine a 4vw; sopra le foto virano solo le tacche dell'anello (T1); sotto 1024 il logo nella testata sticky. | transcript 2026-09-13 |
| A22 | 2026-09-13, domanda di forma 2 (flip) | «Piatto come Era» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §2.2: nessuna `transformPerspective`; la firma dell'hero entra col ruolo `accent`. | transcript 2026-09-13 |
| A23 | 2026-09-13, domanda di forma 3 (foto dell'hero) | «Salita all'80%, chiedo l'originale» | decisa il 13 set., da costruire (piano 2026-09-13); D24, spec 13 set. §3.2: la foto sale fino a `0,80 · tImg`, la scala 2 va sotto la risoluzione del file solo in corsa; lo scatto originale si chiede alla cliente (domanda aperta 14). | transcript 2026-09-13 |
| A24 | 2026-09-13, domanda di forma 5 (villa in home) | «Territorio col drone sul quartiere» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §7.4: il pannello del territorio prende `territorio-quartiere.jpg`; la riga 1 di Services `villa-sala-tour.jpg`. Pubblicazione dopo la licenza (domanda aperta 13). | transcript 2026-09-13 |
| A25 | 2026-09-13, domanda di forma 4 (Seguici) | «Esce crescendo e sfumando» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §3.15: uscendo, il blocco del titolo di Seguici cresce del 12 % e sfuma. | transcript 2026-09-13 |
| A26 | 2026-09-13, domanda di forma 6 (/case/[slug]) | «Nessun sipario» | decisa il 13 set., da costruire (piano 2026-09-13); D32, spec 13 set. §5.4 e §6.2: su `/case/*` né film né porta corta. Chiude la domanda sulle schede immobile (spec 13 set. §1.4, punto 15). | transcript 2026-09-13 |
| A46 | 2026-09-21, sera, guardando era-residence (la foto alta di «Architecture» e la piscina) | «ho scoperto una cosa, su eraresidence questa foto che usa come background alta, ha il cielo mascherato, è no bg. ecco perchè sembra un tutt uno il cielo con il colore dello sfondo del sito! . dobbiamo fare la stessa cosa nel nostro sito, dove ci sono le immagini cosi alte» | **Applicata** (commit c65e44f, 22 set. 2026; revisione avversaria di tre lenti e un giro di correzione nel commit successivo): il cielo delle sette foto alte con cielo e della facciata della finestra di Open Domus è trasparente (`scripts/media/cielo.mjs` → `<nome>-cielo.webp`, `tinte.json` con `cielo: { file, linea, cima }`); il riquadro della testa è la carta e la villa vi posa sopra; le scritte, che con A38/A40 stavano bianche nel cielo, tornano nell'inchiostro della rivista sopra la cima del soggetto (la foto sale sotto il blocco di `cielo.cima`, `PageHero.tsx`, globals.css «La testa di era»); la testata torna in inchiostro (D82 morta; D186 resta: nessuna regola CSS su `header`, sono classi); il titolo «Open Domus» della finestra in inchiostro; la deroga a WCAG 1.4.3 di A38/A40 è chiusa (`e2e/a11y.spec.ts`). A27-A45 sono registrate in `DESIGN.md` e nelle spec del 13 e del 20 settembre; questa riga segue A26 perché il registro si è fermato lì. | transcript 2026-09-21 |
| A47 | 2026-09-22, screenshot della finestra di Open Domus a fine corridoio; la sera, due screenshot della finestra e della sezione «Il nostro format esclusivo» | «qua perchè hai tagliato l'immagine, deve continuare, abbiamo fatto le immagini alte apposta per poterci scrollare a schermo intero senza uscire dalla foto»; poi «questa immagine è tagliata? se si mettila completa e scrivici sopra come hai fatto con le altre pagine» e «questa sezione va sopra l'immagine di open domus» | **Applicata** (commit e3d7627 del 22 set.): la finestra monta la facciata che SALE (`villa-facciata-sale-alta-cielo.webp`, 9:16 2160×3870, cielo mascherato da cielo.mjs; misure in `finestra.json` da `scripts/media/finestra.mjs`) INTERA: la cornice è alta quanto la foto; nel corridoio lo schermo agganciato ne mostra il primo schermo (cielo, titolo in inchiostro, la terrazza alta) mentre le tende si aprono, poi lo stage scorre via e la facciata continua sotto la piega («Architecture» di era). Il capitolo di Open Domus (occhiello, claim, intro, video, liste, rilancio) posa sulla foto dal 55 % della sua altezza, in bianco con l'ombra (A54); sotto lg segue la foto in inchiostro. I marcatori del segno stanno sulle travi delle pergole (bande di finestra.json). La 3:2 col glicine resta scena di riserva senza WebP; P02 è chiuso. Da mostrare: la quota del 55 % e il bianco sui muri chiari. | transcript 2026-09-22 |
| A48 | 2026-09-22, tre screenshot di /acquista; poi la risposta alla domanda 3 | «questo vale anche per /vendi /acquista /metodo domus e /opendomus, dove in queste l'immagine non è tagliata, ma comunque scrollo solo l'immagine e le scritte delle sezioni successive al posto di metterle durante l'immagine, le hai messe dopo … la ricerca intelligente dovrebbe essere piu in alto, sopra l'immagine»; «si le scritte in bianco, ma non vanno dopo la foto "in fondo" … ma sopra la foto proprio … non devi aspettare che finisca la foto, ma portare le sezioni piu sopra in modo che la foto sia semplicemente lo sfondo della pagina (fino ai limiti della grandezza)» | **Applicata** (commit 8f417a0 «feat(teste): lo spazio sopra la foto (A48)», 22 set. 2026) sulle teste: `.dt-testa_sopra` dentro lo strato porta in flusso i tre punti e le sezioni che la pagina posa sulla foto (prop `sopra` di PageHero), da lg in bianco nudo dalla BANDA SCURA della foto (`sopra` di tinte.json, misurata da tinte.mjs per terzi della colonna del testo: la piscina oltre il bordo su /vendi, il prato su /acquista, la scrivania su /lavora-con-noi; /recensioni non ha banda — il muro bianco a sinistra corre per tutta la foto — e i suoi punti restano sulla carta anche da lg, `data-sopra="carta"`; al fondo del blocco il bianco posava sul cielo trasparente e sui muri bianchi), sotto lg dopo la foto in inchiostro; /vendi posa «Costi chiari», /acquista la testa della ricerca intelligente (RicercaProvider + SearchHead, i filtri e i risultati restano in #case). /metodo e /open-domus non hanno punti né sezioni posate: nulla da portare su finché la pagina non lo decide (foglio delle decisioni, voce 27). DESIGN.md «la testa di era», PRODUCT.md, globals.css «La testa di era». | transcript 2026-09-22 |
| A49 | 2026-09-22, screenshot dell'hero | «ma sopratutto la hero e il preloader, stesso discorso di prima ma qua ancora peggio. non c'è ne l'immagine alta che fa da sfondo pagina a schermo intero, ne l'effetto dello scroll dentro l'immagine perchè lhai tagliata a metà e bloccato lo scroll della pagina per l'effetto zoom» | **Da costruire** dopo la risposta alla domanda 2 del 22 set. (foto alta dell'hero: reframe con Higgsfield o la H1 2:3 dal CDN): via il corridoio dello zoom, foto alta a schermo intero in flusso, lockup e firma sopra, il blocco posato sulla foto come sulle teste (spec 22 set.). | transcript 2026-09-22 |
| A50 | 2026-09-22, nello stesso messaggio | «inoltre il preloader è buggato e non funziona l'animazione dell'arco come era prima» | **Aperta**: sul build (`next build` + `next start`, pellicole a 1440 e 1920, CPU ×1) l'arco sale e si apre fra 3,0 e 3,8 s, non riprodotto; domanda 1 del 22 set.: su quale server e browser lo vede. | transcript 2026-09-22 |
| A51 | 2026-09-22 | «inoltre il colore di sfondo della pagina che dovrebbe essere avorio, è ancora troppo chiaro, rendilo lievemente sul rosso rosa, tipo tramonto ma opaco e piu chiaro di un tramonto» | **Da costruire** (spec 22 set.): la famiglia cream / cream-deep / paper / line si scalda (prima proposta #f8ece5), tinte.mjs si rilancia, i test dei token si allineano; da mostrare. | transcript 2026-09-22 |
| A52 | 2026-09-22, sera, due screenshot di /acquista dal dev server | «la ricerca non è leggibile, inoltre l'hai spezzata in due. cambiamo il design della ricerca per renderlo consono al resto del sito, attualmente è orribile, poco professionale. e rendiamola leggibile sopra la foto» | **Applicata** (commit A52-A54 del 22 set., sera): la ricerca è un blocco solo sulla foto (`.dt-ricerca` in PropertySearch.tsx: campo alla misura d4 con la riga sotto, stato, cinque tendine nella forma dei campi del modulo); gli affinamenti (caratteristiche, venduti) sono chip di testo sulla carta sopra i risultati; i rettangoli con bordo sono morti. La leggibilità viene da A54 (ombra, scritte più grandi), non da una banda scura: la misura per terzi della colonna del testo (costruita e poi tolta nella stessa sera) diceva che sulle foto della villa il bianco nudo regge solo su prato e piscina. | transcript 2026-09-22 |
| A53 | 2026-09-22, sera, screenshot della cartolina del Congedo | «inoltre vorrei che quando arriviamo alla fine della foto (dove c'è l'erba) la foto con un animazione si chiude, come qui» | **Applicata** (stesso commit): `ChiusuraFoto.tsx`, montato da PageHeroTesta dopo lo spazio sopra: la scatola della foto si ritira nella cornice della cartolina (8/22 da lg, 4/14 e 4/10 sotto) mentre sale, con lo scrub e l'ease dtCartolina, come la banda del Congedo sotto la soglia; nessuno sticky, nessun pin; si arma solo con una coda libera di almeno un quarto di viewport (su /vendi la piscina è tutta occupata dalle sezioni: la foto finisce dritta); niente con reduced-motion e senza JS. e2e a28 «la foto si chiude». | transcript 2026-09-22 |
| A54 | 2026-09-22, sera | «ti ho detto che dobbiamo riempire piu spazi possibili nelle foto alte a schermo intero! … questo vale per tutte le pagine. home, vendi, acquista eccetera» e «metti una lieve ombra se non si legge, o fai le scritte piu grandi» | **Applicata** sulle teste (stesso commit): lo spazio sopra comincia subito sotto il blocco e le sezioni riempiono la foto; da lg scritte bianche con l'ombra attaccata alle lettere (il valore unico di ink-media.ts: A54 supera A40 per le sezioni sulla foto, il blocco resta sull'avorio senza ombra) e corpi di testo alla misura del lead; posano: /vendi punti + «Costi chiari» + tre leve, /acquista punti + ricerca, /metodo le tre leve, /open-domus il claim, /recensioni e /lavora-con-noi i punti; dal pomeriggio del 22 (commit dopo e3d7627) /chi-siamo i valori (Highlights, come /metodo). Restano coi soli punti /servizi e /domande-frequenti: il capitolo Servizi intero sfora la foto oltre il 15 % (a28.spec: la coda scalerebbe foto e cielo) e le FAQ sono 3-5 volte la foto; serve una sezione corta da posare o si accetta la coda (voce 30 del foglio). La home è A49. | transcript 2026-09-22 |
| A55 | 2026-09-22, pomeriggio, screenshot della riga «Acquista casa con più risposte e meno dubbi» di Paths (la foto vera della piscina); poi, a lavoro in corso, sulla maschera del preloader | «vorrei invertire le posizioni di questa immagine con quella della hero»; poi «e se usassimo la maschera del preloader vecchia di Raffaela? La preferisco, e poi all'entrata ci sarà la foto nuova, la maschera se ne va via con l'entrata ad arco sulla hero» | **Applicata** (commit af757aa del 22 set.): l'hero della home è la foto vera di Raffaela davanti alla villa con piscina (`hero-raffaela-piscina.jpg`, 3:2 1920×1280, e la striscia 9:16 `-m.jpg` 720×1280 da x 660, scritte da `scripts/media/hero-piscina.mjs` da `villa-pool.jpg` senza metadati); la riga «Acquista» di Paths mostra la scena generata di A44/A45 (`hero-raffaela-villa.jpg`, ancorata in basso); `--dt-hero-ar` 720/1280 e 1920/1280. Raffaela sta al centro della foto, dove stava il lockup: «Domus Tua» è sceso in basso, a destra da lg, sull'acqua, e da lg le lettere passano da 13vw a 10,5vw (`--text-hero-lg`, solo l'hero) perché a 13vw la «D» le copriva le gambe (scelta di qualità: nessuna lettera la copre, A27; da mostrare). La sagoma del preloader resta quella in pizzo di A44 e non coincide più con la foto: il patto della porta è la scatola (intro-clocks.test). Il 9:16 generato è uscito dal repo; un ritaglio dalla piscina (Higgsfield, 1 credito) era stato fatto e scartato. | transcript 2026-09-22 |
| — | 2026-09-13, approvazione del design | — | 2026-09-13, approvazione del design | «Approvato, scrivi la spec» | **Approvato:** spec `docs/superpowers/specs/2026-09-13-coreografia-era-residence-design.md` e handoff `docs/superpowers/handoff/2026-09-13-coreografia-era-residence.md` (50c2008); la costruzione segue `docs/superpowers/plans/2026-09-13-coreografia-era-residence.md`. | transcript 2026-09-13 |

### 11.2 Decisioni di lavoro

Nessuno le ha chieste: si rimettono in discussione con un argomento migliore, senza chiedere alla
cliente. Le parole sono quelle del commit o del documento che le ha introdotte.

| ID | Data | Parole esatte | Stato e applicazione | Commit |
|---|---|---|---|---|
| D01 | 2026-09-11 | «Senza velo, a 38 px l'H1 sopra un divano non si legge; a 13vw il lockup si legge su qualunque stanza.» | **Applicata:** sulla foto dell'hero stanno solo lockup e firma; H1, CTA e voto stanno sotto, sull'avorio. È una scelta di leggibilità, non una parola di Alberto. | 09aff4b |
| D02 | 2026-09-11 | «Sei voci primarie (le altre tre restano nel menu del telefono e nel footer)» | **Applicata:** flag `primary` in `nav` di `site.ts`: Vendi, Acquista, Metodo Domus, Open Domus, Chi siamo, Contatti; Servizi, Recensioni e Lavora con noi nel pannello del telefono e nel footer. | 6e6559b |
| D03 | 2026-09-11 | «Il rapporto della scatola segue il SORGENTE, non la griglia.» | **Applicata:** `.dt-media-full` 16:9, `.dt-media-half` 1:1, `.dt-media-column` 4:5 (`--tall` 9:16); da 64rem half e column valgono 42vw, max 640 px, tutti su `bg-cream-deep`. Il test `moduli-media` li presidia. Fuori modulo resta il ramo con le foto di `EditorialRows` (4:3), oggi non reso. Nello stesso commit (5304dfd) nasce il template unico a due colonne da lg (`lg:grid-cols-2`, gutter e rientro 6vw), al posto delle proporzioni inventate sezione per sezione. | 5304dfd, aff9b0e, 90672e3, 360c76b |
| D04 | 2026-09-11 | «i `sizes` dichiarano i pixel chiesti, non la larghezza della scatola» | **Applicata;** i valori sono in `DESIGN.md`, Components. Il conto non è stato rifatto immagine per immagine. | 01a1f20 |
| D05 | 2026-09-10 | «--color-espresso / wine \| superfici \| solo il pannello del preloader \| nessuna sezione scura» (riga della tabella di §3.1) | **Domanda aperta (7).** Il pannello del preloader è `bg-espresso` #1c1512 con i gradienti radiali di `.dt-pre-fondo`. Contraddice alla lettera C17 e non ha un consenso esplicito né della cliente né di Alberto; c'è solo quello implicito in A02. Dal 13 settembre, decisa il 13 set., da costruire (piano 2026-09-13): l'espresso resta solo nel film intero della home e la porta corta usa l'avorio profondo (D31). | 67afc9e |
| D06 | 2026-09-11 | «--dt-head-h / --dt-band-h: la sagoma dentro il sipario e la banda fotografica in cima alla home sono lo STESSO scatto nella STESSA scatola» | **Applicata:** `--dt-head-h` `clamp(4.5rem, 10vh, 6.5rem)`, `--dt-band-h` 60svh; `[data-pre-figure]` ha `top: calc(var(--dt-head-h) + 1px)` e `height: var(--dt-band-h)` a ogni larghezza; sagoma e foto dell'hero con `objectPosition` «10% 0%». Il test `intro-clocks` lo presidia. La regola `.dt-mob-band` è orfana. | 6e6559b |
| D07 | 2026-09-11 | «Il territorio si illustra col territorio: la ripresa col drone» | **Domanda aperta (2):** `/media/hero-aerial.jpg` in `.dt-media-full` nel pannello del territorio (`sizes` «(min-width: 1024px) 55vw, 100vw») contraddice C10. Il 13 settembre il testo alternativo è stato corretto: la ripresa è quasi a picco su una villa privata con piscina, non su «i tetti e il verde attorno a Tradate». Di quale immobile si tratti, con quale autorizzazione del proprietario e con quali diritti sul file è una domanda bloccante per la cliente (`docs/da-chiedere-alla-cliente.md` §2.2). | 360c76b, c2949a3 |
| D08 | 2026-09-11 | «l'oro delle stelle leggeva mostarda sull'avorio: piu' caldo» | **Applicata:** `--color-gold` #d9a441, gold-deep #a9812a, gold-light #eed07a, gold-spec #fff6d4 (prima #c9a227), solo sulle stelle. Se il divieto dell'oro degli impegni di marca vada riscritto come «oro solo sulle stelle» è la domanda aperta 11. | aff9b0e |
| D09 | 2026-09-11 | «L'etichetta lunga sparisce da tutte le superfici: resta la forma corta» | **Applicata:** it «Richiedi la valutazione», en «Request a valuation», fr «Demander l’estimation», de «Bewertung anfordern», es «Solicita la valoración». Unica eccezione: l'heroPrimary tedesco di `ServiziContent.tsx`, «Fordern Sie die Bewertung Ihrer Immobilie an». | fb6a22c |
| D10 | 2026-09-11 | «i nove passi stanno su /metodo, non anche in home · il capitolo recensioni vive solo su /recensioni · EditorialRows mostra ora le fotografie solo se OGNI riga ne ha una vera (`reali/`)» | **Applicata:** in home `<Method compact />` (tre atti e un ghost verso /metodo); `<Reviews />` solo su /recensioni; i quattro chiamanti di `EditorialRows` (Acquista, Open Domus, Servizi, Vendi) rendono tutti la lista numerata. | 0fa94bc, ea1b584, 183acdd |
| D11 | 2026-09-11 | «Il rientro passa da -0.42em a -0.2em» | **Applicata:** `.script-word` con `margin-top: var(--script-tuck, -0.2em)`; nella firma dell'hero `--script-tuck` vale 0. Nello stesso giro di decisioni: interlinee d1 0.98 e d2 1 (erano 0.92 e 0.95), `.lead` a 38ch (era 50ch), eyebrow a 500 e 0.12em, h1-h3 a 500 e h4 a 400. | 3411a55, aff9b0e, 02d19d3 |
| D12 | 2026-09-11 | «Il numero e' vivo: la nota accanto alla costante dice di rileggerlo dal widget ogni volta che si tocca quella riga.» | **Applicata:** `site.rating` "4.9" e `site.reviewsCount` "542", letti dal widget Trustindex l'11 settembre; si vedono nell'hero, in Voci, Reviews, Stats, sul titolo di /recensioni e nelle meta. Nessun `aggregateRating` nel JSON-LD. | 98b8709 |
| D13 | 2026-09-11 | «Non e' un effetto: e' una correzione dichiarata, e sparisce il giorno in cui i fotogrammi arrivano puliti.» | **In attesa della cliente** (§11.4): `.dt-still-trim` scale 1.43 con origine 100% 100%, variante `--top` scale 1.32 con origine 50% 100%, in `Voci` e `FeaturedTestimonial`. | c0d841f, 39cedc3 |
| D14 | 2026-09-10 | «Header in flusso: sticky solo sul telefono, da lg scorre via come nel riferimento» | **Applicata:** sticky sotto lg (avorio profondo con hairline dopo lo scroll), `lg:relative` e trasparente da lg. Eccezione del 13 settembre, decisa il 13 set., da costruire (piano 2026-09-13): il segno fisso da 1024 px (D34). | 7d2d1d8 |
| D15 | 2026-09-11 | «la testa su due colonne e il titolo dove la foto e' scura» | **Applicata:** `PageHero` da lg su `[1.1fr_1fr]`, h1 `clamp(3rem, 8vw, 9rem)` a interlinea 0.92 (da lg `clamp(2.75rem, 4.8vw, 5.25rem)`, non il token d1), banda `.dt-media-full` 4:5 sotto md e 16:9 da md; 11 pagine. Nello stesso giro il Congedo prende `INK_ON_VIDEO` e il poster `piscina-lusso.jpg` a `object-[16%_50%]`, scala 1.14. Dal 13 settembre, decisa il 13 set., da costruire (piano 2026-09-13): PageHero con corridoio (A20); sulle foto della villa la calligrafia legge meno nel terzo basso (misura in `docs/superpowers/specs/2026-09-13-coreografia-era-residence/design/lane-globali.md` §1.9). | 8b21627, 4a0d96e |
| D16 | 2026-09-10 | «Le lettere dell'hero entrano salendo, senza flip» | **Superata da A20.** decisa il 13 set., da costruire (piano 2026-09-13): flip per lettera su tutti i titoli, hero compreso (spec 13 set. §2.2). Oggi le lettere dell'hero entrano salendo. | 7d2d1d8 |
| D17 | 2026-09-13 | «un solo lessico dei tempi: `--dur-dt-*` ↔ `durDt`, `--ease-dt-*` ↔ `dt*`; i token di transitions.dev col prefisso `--td-`, senza blur, senza bounce, senza `--ease-in-out` ed `--ease-out`» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §2.6. | 50c2008 |
| D18 | 2026-09-13 | «il testo si muove uguale in tutti i capitoli; A20 si verifica sulla firma di capitolo in `chapters.ts`: ease a distanza ≥ 0,045 fra le curve, scrub e durate a distanza ≥ 0,1 s, innesco diverso; `none` è firma di un capitolo solo e resta libero nei tratti interni; le battute interne del film delle stelle restano come sono» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §3.1. | 50c2008 |
| D19 | 2026-09-13 | «tetti del testo: stagger per carattere al massimo 1,2 s in ingresso e 0,4 s in uscita; ritardo indicizzato per ruolo dentro il gruppo, con i ≤ 5» | decisa il 13 set., da costruire (piano 2026-09-13); da far vedere ad Alberto con una pellicola di un d1 lungo. | 50c2008 |
| D20 | 2026-09-13 | «crenatura dei caratteri spezzati da una tabella misurata nel DOM, non `font-kerning: none`» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §2.3. | 50c2008 |
| D21 | 2026-09-13 | «reveal a IntersectionObserver: ingresso a filo del bordo, uscita alla linea dell'85 %, nulla dall'alto; un blocco con link o campi entra solo in opacità» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §2.4. | 50c2008 |
| D22 | 2026-09-13 | «una soglia per i sei corridoi e il tuffo: ≥ 1024 px, altezza ≥ 640 px, motion ok; il layout dei corridoi sta in CSS prima del paint; alla ricarica lo scroll torna al capitolo» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §4. | 50c2008 |
| D23 | 2026-09-13 | «via la deriva di `Parallax` da Posizionamento, Paths, Method, Services, intro del Team e PageHero» | decisa il 13 set., da costruire (piano 2026-09-13); `Parallax` resta su FeaturedTestimonial fuori dalla home. | 50c2008 |
| D24 | 2026-09-13 | «tuffo dell'hero: la foto sale fino a 0,80·tImg, così il segno a quattro punte resta fuori campo; la scala 2 va sotto la risoluzione del file solo durante la corsa» | Confermata da Alberto (A23). decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §3.2. | 50c2008 |
| D25 | 2026-09-13 | «Costi chiari: l'acqua sale a tempo con IntersectionObserver, non in scrub; banda larga quanto la riga» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §3.13. | 50c2008 |
| D26 | 2026-09-13 | «D.O.C.: righe e spina restano disegnate anche a pagina ferma» | decisa il 13 set., da costruire (piano 2026-09-13); da far vedere ad Alberto. | 50c2008 |
| D27 | 2026-09-13 | «Services: niente parallasse yPercent del §7 di Era; riga 1 col fotogramma 4K della sala del tour» | decisa il 13 set., da costruire (piano 2026-09-13); alt da verificare (spec 13 set. §7.4). | 50c2008 |
| D28 | 2026-09-13 | «gesti di FeaturedTestimonial e Contact solo in home (`gesture`); finestra (`finestra`) e acqua (`acqua`) solo in home» | decisa il 13 set., da costruire (piano 2026-09-13). | 50c2008 |
| D29 | 2026-09-13 | «testimonianza: `.dt-still-trim--top` da 1,32 a 1,30 con overscan 10 %; cartolina sotto 1024 a `inset(4% 14%)` e `inset(4% 10%)` al posto di 4 %/32 %» | decisa il 13 set., da costruire (piano 2026-09-13). | 50c2008 |
| D30 | 2026-09-13 | «Contatti: il modulo resta indietro, −3,5 → +3,5 %» | decisa il 13 set., da costruire (piano 2026-09-13). | 50c2008 |
| D31 | 2026-09-13 | «porta corta: niente skip; pannello avorio profondo senza `.dt-pre-fondo`; sagoma solo su «/»; niente corta con ancora, back/forward, scheda nascosta o prerender (vale anche per il film della home), ricarica a più di 50vh» | decisa il 13 set., da costruire (piano 2026-09-13). | 50c2008 |
| D32 | 2026-09-13 | «/case/[slug] ferma: `MotionFreeze`, chrome dell'interfaccia fermo via `:has`, nessun sipario» | decisa il 13 set., da costruire (piano 2026-09-13); nessun sipario su `/case/*` (A26). | 50c2008 |
| D33 | 2026-09-13 | «tuffo delle PageHero: base `100vw` per l'LCP, strato `200vw` dopo l'LCP e solo a DPR 1; `sizes` sotto 768 a 200vw» | decisa il 13 set., da costruire (piano 2026-09-13); misura di spec 13 set. §9.3. | 50c2008 |
| D34 | 2026-09-13 | «monogramma: il cuore si stacca dalla testata da 1024 px (M1); le tacche virano sopra `data-bg="foto"` (T1)» | Confermata da Alberto (A21). decisa il 13 set., da costruire (piano 2026-09-13). | 50c2008 |
| D35 | 2026-09-13 | «foto della villa nelle teste di otto pagine interne; file senza metadati e con nomi neutri» | decisa il 13 set., da costruire (piano 2026-09-13); i file si preparano, la pubblicazione aspetta i punti 2.2 e 2.13 del documento per la cliente (domanda aperta 13; il punto 2.13 lo aggiunge la chiusura). | 50c2008 |
| D37 | 2026-09-13 | «PageHero sotto la soglia del corridoio: con motion ok lo strato interno della banda cresce fino a 1,08 da 768 px di larghezza, anche da 1024 px con altezza sotto 640 (1440×600, 1280×600); sotto 768 fino a 1,06» | decisa il 13 set., da costruire (piano 2026-09-13); spec 13 set. §5.1 fissa 1,08 solo fra 768 e 1023, la fascia da 1024 con altezza sotto 640 segue `MQ.desktop` in `PageHeroDive` (misura in `misure/risultati.md`, sezione «18 · il tuffo sotto soglia»); l'ID D36 è del commit 5 (tetto di `kern-table.json`, spec 13 set. §1.3). | — |
| Q01 | 2026-09-11 | «va chiesto a lui, non cambiato» | **Domanda aperta (1).** Il riferimento scrive titoli e corpo in #1f1f1f (dossier goldengoal, riga 86), la pagina accanto a lui legge slavata, e A11 tiene l'ink a #46423d. La proposta di un inchiostro più scuro per i soli titoli (#2e2a26) non è applicata. | memoria di progetto, 09aff4b |

Una regola di impaginazione non ha un ID suo: «una fotografia compare una volta per pagina», che
`PRODUCT.md` e la rotaia del team di `DESIGN.md` riportano, viene da c122bf4 (2026-09-10, «Nessuna
foto compare due volte in home») ed è una decisione di lavoro come quelle di questa tabella.

### 11.3 Domande aperte

Nessuna si risolve senza chi deve rispondere; finché restano aperte, il codice resta com'è. Fanno eccezione tre domande del 13 settembre. La 12: la spec approvata da Alberto («Approvato, scrivi la spec») costruisce la coreografia prima della risposta della cliente, che la vedrà costruita. La 14: il tuffo si costruisce con la salita all'80 % (A23) mentre si chiede lo scatto. La 13: i file della villa si preparano, ma nessuna pagina li pubblica prima della licenza (punto 2.13) e dell'autorizzazione del proprietario (punti 2.2 e 6.2).

1. **Colore del testo** (Q01, A11). Il riferimento scrive titoli e corpo in #1f1f1f
   (`reverse-engineering/goldengoal/README.md:86`), Alberto ha chiesto «NIENTE SCRITTE BLACK» e l'ink
   è #46423d. Da chiedere ad Alberto: accetta un inchiostro più scuro per i soli titoli (proposta
   #2e2a26, non applicata)?
2. **Foto dopo la ricerca** (C10, D07). La foto aerea è di nuovo nel primo capitolo dopo la ricerca,
   nel pannello del territorio. Si toglie, o si chiede alla cliente se il divieto del punto 6 valeva
   solo per il fondale? Se resta, servono l'immobile, l'autorizzazione del proprietario e i diritti
   del file.
3. **Chi ha chiesto i set piece** (A12). L'unica fonte primaria (024d354) cita Alberto; il commento in
   testa ad `app/page.tsx` li dava al cliente. Se Alberto riferiva la cliente va scritto in A12.
4. **«Menu sopra» e «posizione delle foto»** (A13, A14). Li ha scritti Alberto; i messaggi di 6e6559b e
   5304dfd, e i commenti scritti con loro (`Header.tsx`, `site.ts`, `moduli-media.test.ts`), li davano
   al cliente. Riportava un giudizio della cliente o era suo?
5. **Preloader «come prima»** (A16). Comprendeva anche la durata di 9,26 s (`TEMPO = 2`) o solo
   l'ingresso? Oggi `TEMPO = 1`, coerente con A02.
6. **Testo sotto 16 px nel preloader** (C04): didascalie a 0.68rem, payoff a 0.82rem. Si porta a
   16 px o si registra un'eccezione dichiarata?
7. **Pannello espresso del preloader** (D05). Contraddice «eliminare nero ovunque» e non ha un consenso
   esplicito né della cliente né di Alberto: l'ha messo questa specifica (§3.1), e il consenso è solo
   implicito in «Stesso film di oggi ma dimezzato». Resta?
8. **Disco carta sotto il badge del preloader** (C19): `bg-paper rounded-full`. Contraddice «metti il
   logo senza sfondo bianco» (la cliente, 2026-08-06), che nessuno ha revocato. Resta?
9. **Lockup del preloader in Playfair** (C18), contro «stesso font del logo in tutte le scritte Domus
   Tua». Si allinea ora a `--font-brand` o si aspetta il logo nuovo?
10. **«Box vendi casa più a destra»** (C11). Ribaltata da Alberto (A04), e «box» = blocco CTA è
    un'interpretazione di questa specifica. Va detto alla cliente?
11. **Oro** (D08). Gli impegni di marca vietano l'oro, con un'eccezione non confermata per le stelle;
    il codice ha l'oro solo sulle stelle (#d9a441). Il divieto si riscrive come «oro solo sulle stelle»?
12. **A18-A20 contro C03** (cliente). La cliente vede la coreografia e decide se tenerla, ridurla o
    tornare a poche animazioni. Il testo della domanda è in spec 13 set. §12.2 (domanda a voce 27, da
    aggiungere a `docs/da-chiedere-alla-cliente.md` nella chiusura).
13. **La villa del video tour** (cliente, D35, A24). Autorizzazione del proprietario (punti 2.2 e 6.2
    del documento per la cliente), licenza delle foto firmate da Davide Salerno (punto 2.13, da
    aggiungere), una casa sola in apertura di otto pagine (domanda a voce 28, da aggiungere).
14. **Scatto originale della foto dell'hero** (cliente, A23). `hero-raffaela.jpg` è 2000×1415 e ha un
    segno chiaro a quattro punte a x ≈ 93 %, y ≈ 86 %; a scala 2 la foto va sotto la sua risoluzione.

### 11.4 In attesa della cliente

- **Logo nuovo e il suo font** (C18, A05): non consegnati. `public/` contiene solo i `logo-domustua-*`
  datati dal 2026-07-28 al 2026-08-06; `--font-brand` = `var(--font-jakarta)` come segnaposto.
  Procedura in §9 e `docs/logo-assets.md` §5.
- **Fotogrammi puliti dei video** (D13), uno per video a 1920x1080 (`ffmpeg -ss`): servono i file
  sorgente, che non sono nel repo. Intanto la correzione `.dt-still-trim`.
- **Cinque ritratti singoli del team**: Paloma Cavalcante, Eleonora D’Agati, Viola Benatti, Tiziana
  Galeone, Katya Fedrigo. In `app/lib/team.ts` solo Raffaela ha `image`; la rotaia usa per ora
  `team-red.jpg` e `team-group.jpg`.
- **Firma autografa reale**: `brand.signature` è vuota (`app/lib/brand.ts`). L'hero usa il nome in
  Pinyon Script, non una firma finta.
- **Parole vere dei clienti per le citazioni**: `FeaturedTestimonial.tsx` non rende più quote, autore
  e contesto, perché erano inventati; `Reviews.tsx` mostra il banner «Esempi dimostrativi» quando le
  card sono demo.
