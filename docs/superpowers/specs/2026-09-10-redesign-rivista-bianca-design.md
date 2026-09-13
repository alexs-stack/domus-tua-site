# Redesign "la rivista bianca" — specifica di design

Data: 2026-09-10 · Origine: chiamata con la cliente (note di Alberto) · Riferimento pinnato dalla
cliente: https://www.immobiliaregoldengoal.it/ · Dossier tecnico del riferimento (misure, sorgenti,
screenshot): `reverse-engineering/goldengoal/README.md` (cartella di studio, gitignorata).

Aggiornata il 2026-09-13 (codice a c2949a3). Questa specifica registra la chiamata del 10 settembre e
le decisioni di quel giorno; quello che è arrivato dopo sta in **§11**, con chi l'ha detto, quando,
le parole esatte e il commit. Nel corpo, dove una decisione di qui è stata ribaltata o corretta, una
nota in corsivo *(→ §11 …)* lo dice accanto alla decisione originale, che resta com'era: è la storia
del progetto, non un errore da nascondere. Dove invece il testo affermava un fatto falso (un numero,
una funzione che non esiste più, un'attribuzione) è corretto sul posto.
Il dossier del riferimento l'ha chiesto **Alberto**, nello stesso messaggio in cui riportava la
chiamata (2026-09-10, 17:44Z): «fai un reverse engineering del sito in questione per avere tutto il
codice sorgente di come è fatto». Esiste, gitignorato, e alla riga 86 registra il colore del testo
del riferimento: #1f1f1f.

## 1. Il brief, in una riga

La cliente boccia lo stile attuale — curvo, smussato, a card, con transizioni di pagina curve — e
vuole quello del riferimento: pulito, professionale, **scritte grandi, niente scritte piccole,
niente nero, niente curve**, foto e video grandi, spazi gestiti bene, molte meno animazioni.

Le parole della cliente, come Alberto le ha riportate il 2026-09-10 (17:44Z), per le regole generali
che la tabella qui sotto non numera:

- «lo stile del nostro sito curvo e smuussato , con card ,e transizioni di pagina curve non piace per
  niente !» e «nessuna scritta piccola , niente colore nero , e niente curvo». **Niente curvo** è
  applicata con eccezioni costruite: `--radius-card`, `--radius-card-lg` e `--radius-field` valgono
  0px, `--shadow-card`, `--shadow-card-hover` e `--shadow-float` valgono none (`globals.css:170-180`,
  b9e6b7f), `PageTransition` è ridotto a stub (178c6b5). Le curve rimaste non stanno tutte sullo
  stesso piano. **Eccezione dichiarata** da questa stessa specifica (§3.3: «`rounded-*` ammesso solo
  su icon-button rotondi»): i bottoni che contengono solo un'icona, cioè i link social
  `.dt-social__link` (cerchi da 2.75rem, `border-radius: 9999px`, `globals.css:1590-1607`), il
  WhatsApp `rounded-full` da 44 px della barra mobile (`MobileActionBar.tsx:115`) e quello flottante
  da 56 px (`WhatsAppFloat.tsx:39`). **Curva tenuta dal film**: la porta ad arco del preloader, che
  fa parte del film che Alberto ha chiesto uguale, «Stesso film di oggi ma dimezzato» (§2 punto 3,
  §11 n. 3). **Residui veri**, che nessuna regola copre:
  l'ombra dei link social all'hover, `box-shadow: 0 12px 24px -12px rgb(163 7 7 / 0.55)` con una
  salita di 3 px (`globals.css:1608-1615`), contro «nessuna ombra» del §3.0; e il disco
  `rounded-full bg-paper p-2` sotto il badge del preloader (`PreloaderShell.tsx:175`), che non è un
  bottone e contraddice anche «metti il logo senza sfondo bianco» (domanda aperta, §11.3).
- «mi ha mostrato tante volte questo sito : https://www.immobiliaregoldengoal.it/ . è molto pulito ,
  clean , profesionale , scritte grandi , font azzeccato , niente card , foto e video grandi , spazi
  gestiti bene». È un riferimento, non una regola che si verifichi leggendo il codice: le conseguenze
  misurabili ci sono (un solo fondo `bg-cream`, nessuna card, raggi a 0, media a tutta larghezza o a
  42vw); il giudizio d'insieme, «pulito, professionale», dal codice non si ricava.
- «dobbiamo rifare tante cose , e eliminare tante animazioni e transizioni». **Superata in parte**
  l'11 settembre da Alberto (§11 n. 9): tornano i due set piece pilotati dallo scroll; restano tolte
  le transizioni di pagina, il cursore custom e il resto del vecchio livello di effetti.
- «nessuna scritta piccola»: rispettata nel sito (`--text-ui` 16 px, `.eyebrow` 16 px, sovratitolo
  dell'hero a `text-ui`), **non** nel preloader, dove `PreloaderShell.tsx:96` tiene le didascalie
  («Immobiliare», «dal 2007») a `text-[0.68rem]` e `:216` il payoff a `text-[0.82rem]`. Domanda aperta
  (§11.3).

Le direttive del 2026-08-06 (fiori SVG negli angoli, cupole, horizontal scroll pinnato ovunque,
"tante animazioni") sono **superate** da questa chiamata. Restano valide: nessun taglio percepibile
fra sezioni (che ora si ottiene con un solo fondo), scritte e immagini grandi, logo reale ovunque.
*(Le due direttive di agosto ancora vive, parole della cliente riportate da Alberto il 2026-08-06:
«il taglio non si deve percepire», applicata col fondo unico `bg-cream` e nessun cambio di tono fra i
capitoli, non misurata in ΔRGB; e «metti il logo senza sfondo bianco», che il preloader **non**
rispetta: il badge poggia su un disco chiaro `rounded-full bg-paper p-2` (`PreloaderShell.tsx:175`),
tenuto per scelta di lavoro in c1ba870. Nessun documento dice che quella regola è stata allentata, e
«logo reale ovunque» non la sostituisce: domanda aperta, §11.3. L'11 settembre Alberto ha anche
riportato due nastri pilotati dallo scroll e rimesso era-residence fra i riferimenti: §11 n. 9-10.)*

Lista puntuale della chiamata e dove si risolve:

| # | Richiesta | Risoluzione | § | Oggi nel codice (2026-09-13) |
|---|---|---|---|---|
| 1 | Preloader più veloce | stesso film, `TEMPO` 2 → 1 (9,26 s → 4,63 s) | 6 | Applicata (456026a): `TEMPO = 1` (`intro-constants.ts:66`), `INTRO_MS` 4630; il CSS è allineato (porta 1.1 s a 2.25 s, tuffo 1.5 s a 3.13 s). Alcuni commenti di `globals.css` (:1058-1061, :1071-1072, :1106, :1151) citano ancora i numeri di `TEMPO = 2`. L'11 settembre Alberto ha chiesto l'ingresso «come prima» (§11 n. 11): la durata è rimasta questa. |
| 2 | Cuore che ruota in senso orario | `RotatingMark` e badge del preloader: monogramma +360° (`spinMarkBadge`, nominato qui il 10 settembre, è stato tolto in 6b11620: lo usava solo il sipario) | 6 | Applicata (456026a, c1ba870). `RotatingMark` sta in testata solo da xl (1280 px) a 56 px (`h-14`), gira in GSAP a 30°/s (12 s a giro), sotto lo scroll sale a 30 più 10 volte la velocità dello scroll in valore assoluto, e non si inverte mai; nel preloader anello e monogramma usano la stessa `dt-pre-spin`, 6 s a giro: le due velocità sono diverse. È della cliente (punto 2 della chiamata; così anche 10be847 e c1ba870) e supera la direttiva del 2026-08-05, «la rotazione del logo dev essere opposta a quella del cerchio attorno». |
| 3 | Firma più in basso nella hero | script staccato sotto il lockup (≈ 1 em in più) | 4.1 | Applicata in un'altra forma. Da quando la foto sta dietro il lockup (§11 n. 8) la firma sta a cavallo del bordo basso della banda fotografica: `absolute inset-x-0 bottom-0 translate-y-[26%]`, `--script-tuck: 0`, `clamp(2.2rem,6vw,5.5rem)` (`HeroCinematic.tsx:476-483`; aff9b0e, fd07a63). |
| 4 | Eliminare "Valutazione professionale… RR Con Raffaela Rizza e il team" | via `subcopy` e riga founder dall'hero | 4.1 | Applicata (deb1291). Parole simili restano nella meta description della home (`app/page.tsx:33`), che in pagina non si vede. |
| 5 | Via "Guarda il video", mettere "Vendi casa" | terzo bottone → `/vendi` | 4.1 | Applicata (deb1291): `cta-solid` «Richiedi la valutazione» → /valutazione-immobile-tradate, ghost «Vendi casa» → /vendi, ghost «Cerco casa» → #cerca (`HeroCinematic.tsx:503-514`). Nessun bottone video. |
| 6 | Togliere foto dopo ricerca | via il fondale aereo di HorizonStory (sezione rifatta) | 4.4 | **Domanda aperta.** Il fondale non c'è più, la foto sì: `HorizonStory` è tornata (§11 n. 9) come primo capitolo dopo `HomeSearchGateway` (`page.tsx:70-71`), e lo stesso file `/media/hero-aerial.jpg` illustra il pannello del territorio in `.dt-media-full` (`HorizonStory.tsx:303-311`; decisione di lavoro, §11 n. 13). Alla lettera rispettata, nella sostanza no. |
| 7 | Box vendi casa più a destra | blocco CTA allineato a destra, sotto il video | 4.1 | **Superata** la sera stessa da Alberto, «rimettilo centrale» (e6e34bd, §11 n. 5): sovratitolo, H1 e CTA sono centrati (`HeroCinematic.tsx:492-514`) e sotto il titolo non c'è nessun video. Leggere «box» come il blocco CTA dell'hero è un'interpretazione di questa specifica, non parola della cliente; se il ribaltamento vada detto alla cliente è aperto (§11.3). |
| 8 | Eliminare tutti i fiori | `Fioritura` e gli 8 consumatori rimossi | 7 | Applicata (3cee992): `Fioritura.tsx` non esiste e nessun fiore viene disegnato; «fior» resta solo nei commenti di Method, Team, Footer, Paths, HorizonStory e HorizonScroller. |
| 9 | Rifare "Il muro delle voci" | capitolo "Le voci": carosello video + 4,9/542 (da `site.ts`) + Trustindex | 4.5 | Applicata (44d3a6c), poi corretta. `Voci.tsx` (#voci) è un carosello nativo con snap più il widget Trustindex; `ReviewsWall` è rimosso. Il titolo d1 col voto l'ha tolto l'11 settembre una decisione di lavoro (360c76b: lo stesso numero stava già nell'hero e nelle cinque stelle): oggi il titolo è «Le storie in video» a d2 e il conteggio una riga a 16 px. Copertine rifilate con `dt-still-trim` (`Voci.tsx:225`; c0d841f, 39cedc3). Il 10 settembre qui c'era scritto 531: il dato è 542 (98b8709, §11 n. 12). |
| 10 | Vignettatura no | via `.bg-ink` radiali, veli su foto, grana, PageTransition | 7 | Applicata (178c6b5, 09aff4b): nessun velo sull'hero né sul Congedo. Eccezione costruita, non chiesta: un'ombra attaccata alle lettere bianche sopra le immagini — `INK_ON_VIDEO` nel Congedo, «0 1px 2px rgb(0 0 0 / 0.35), 0 0 28px rgb(0 0 0 / 0.45)» (8b21627, 4a0d96e), «0 1px 2px rgb(0 0 0/.25)» sulla copertina di StarReviews (`StarReviews.tsx:687`), un text-shadow sul lockup del preloader (`PreloaderShell.tsx:189`). Nel DOM resta lo strato `.dt-starrev_flash` (`globals.css:2001`, a riposo `opacity: 0`), che il suo commento chiama «velo». |
| 11 | Gestire le grandezze font come il riferimento | scala in vw/vh, uppercase, paragrafi grandi e leggeri | 3.2 | Applicata; interlinee, colonna del lead e scala sotto i 1024 sono cambiate l'11 settembre (aff9b0e): nota sotto §3.2. |
| 12 | Team: carosello o scroll orizzontale con foto grandi | rotaia orizzontale pilotata dallo scroll (`HorizontalRail`) | 4.13 | Applicata (cf9fe39, c122bf4, 360c76b): `HorizontalRail runway={120} snapMobile` (`Team.tsx:219-224`), pilotata dallo scroll solo da 1024 px con motion ok; sotto, scroll nativo con snap e `RailProgress`. Tre tessere `.dt-media-column` 4:5 — Raffaela (`raffaela-specchio-sorriso.jpg`), `team-red.jpg`, `team-group.jpg` — e sotto la rotaia i sei nomi a d3. `TeamTrail` e il depth fade sono rimossi. La meccanica l'ha scelta Alberto (§11 n. 4). |
| 13 | Eliminare nero ovunque | nessuna superficie scura: hero, PageHero, footer, Paths, Manifesto, testimonianza | 3.1 | Applicata nelle pagine: fondo unico `bg-cream`, `themeColor` #f9f5ef, nessuna sezione scura; e dall'11 settembre nessun testo nero («NIENTE SCRITTE BLACK», Alberto, 09aff4b). Restano scuri il pannello del preloader (`bg-espresso` #1c1512 con `.dt-pre-fondo`, `PreloaderShell.tsx:101`: eccezione messa da questa specifica in §3.1, domanda aperta) e l'immagine Open Graph (`app/opengraph-image.tsx:65` e `:82`, #1a1816). I token `--color-espresso` e `--color-wine` sono ancora definiti. |
| 14 | Logo nuovo + font del logo su tutte le scritte "Domus Tua" | logo attuale finché non arriva il file; token `--font-brand` per le scritte | 9 | **In attesa del cliente** per il logo: in `public/` ci sono solo i `logo-domustua-*` datati dal 2026-07-28 al 2026-08-06, e `--font-brand` vale `var(--font-jakarta)` come segnaposto (`globals.css:86`). **Non rispettata** la seconda metà: `font-brand` lo usa solo il lockup dell'hero (`HeroCinematic.tsx:459`), mentre il lockup «Domus Tua» del preloader è `font-hero`, Playfair, a 11vh (`PreloaderShell.tsx:185`). Domanda aperta (§11.3). |

## 2. Decisioni prese con Alberto (2026-09-10)

*(Sono le risposte di Alberto alle quattro domande delle 18:16Z; le parole esatte dell'opzione scelta
e lo stato nel codice sono in §11 n. 1-4.)*

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
  *(→ §11 n. 5-8: composizione ribaltata da Alberto la sera stessa e l'11 settembre. Oggi la foto
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
*(Oggi è bianco su foto anche il titolo della copertina di StarReviews (`StarReviews.tsx:687`), e sulla
foto dell'hero stanno lockup e firma in grafite e rosso (§11 n. 8-9). Il bianco lo regge un'ombra
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

*(→ §11.2: decisioni di lavoro dell'11 settembre, aff9b0e e 3411a55. Interlinea 0.98 e 1 perché a
0.92 accenti e code entravano nella riga sopra; `.lead` a 38ch e non 50, perché con Jakarta 300 i
50ch facevano 82 caratteri per riga; il rientro della calligrafia passa da -0.42em a -0.2em. Sotto
63.99rem la scala cresce con la larghezza: d1 `clamp(2.55rem, 9.5vw, 7.5rem)`, d2
`clamp(2.15rem, 7.4vw, 4.5rem)`, d3 `clamp(1.5rem, 4.8vw, 2.6rem)`, script `clamp(3rem, 11vw, 7rem)`,
lead `clamp(1.3rem, 3.1vw, 1.55rem)` (`globals.css:284-292`). I pesi non stanno nei token ma
nell'elemento: dal 2026-09-10 sera (02d19d3, decisione di lavoro presa dopo i primi screenshot,
«senza questa regola il preflight di Tailwind li fa ereditare 400/700 a caso») h1, h2 e h3 sono a 500
e h4 a 400 (`globals.css:309-318`). Per questo un d3 su h3 pesa 500 e non 400 come prevedeva la
tabella, e il 300 di un d4 c'è solo dove l'elemento porta `font-light`.)*

Vincoli: **nessun testo sotto 16 px** (`.eyebrow` passa da 11 a 16 px; `text-xs/sm` vietati nel
contenuto); `h1, h2, h3, h4` uppercase per regola globale; `blockquote` e corsivi in tondo/basso.
I token `--text-d1…d4` esistenti vengono **ridefiniti** (non rinominati), così i consumatori
attuali ereditano la scala nuova.
*(Il vincolo dei 16 px non vale oggi nel preloader: didascalie a `text-[0.68rem]` e payoff a
`text-[0.82rem]`, `PreloaderShell.tsx:96` e `:216`. Portarle a 16 px o dichiarare l'eccezione è una
domanda aperta, §11.3.)*

### 3.3 Spazio, griglia, media

- Righe a tutta larghezza con padding laterale **8vw** (5vw sotto 768: qui era scritto 4vw, il
  costruito è 5vw); colonne di testo ≤ 800 px;
  asimmetrie con padding percentuali (es. sinistra 4vw, destra 18vw), non griglie complesse.
- Ritmo verticale: `clamp(6rem, 14vh, 11rem)` fra capitoli (`clamp(3rem, 8vh, 5rem)` sotto 768); più
  spazio sopra un titolo che sotto.
- Media: video 16:9 a tutta larghezza, foto **quadrate** (1:1) o 4:5, sempre `border-radius: 0`,
  nessun gradiente sopra, nessuna didascalia sopra la foto. Il play è un cerchio rosso 96 px (le
  icone tonde sono l'unica curva ammessa: play, frecce, WhatsApp).
  *(→ §11.2: dall'11 settembre una foto sta in uno di tre moduli — `.dt-media-full` 16:9 a tutta
  larghezza, `.dt-media-half` 1:1, `.dt-media-column` 4:5, o 9:16 con `--tall`; da 64rem mezza e
  colonna valgono 42vw, max 640 px, tutti su `bg-cream-deep` — e il rapporto della scatola segue il
  sorgente, non la griglia: gli atti del Metodo sono `half` in 16:9, il video in evidenza è una
  colonna 9:16. I `sizes` dichiarano i pixel chiesti, non la larghezza della scatola (01a1f20). Il
  play scende a 56 px sotto lg nel carosello delle voci (360c76b). Quali curve rientrano in questa
  eccezione dei bottoni-icona e quali sono residui veri (l'ombra all'hover dei link social, il disco
  sotto il badge del preloader) è detto in §1.)*
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
(`cubic-bezier(.2,.65,.3,1)`). Nessuna sezione pinnata tranne la rotaia del team. *(Aggiornamento 2026-09-11, → §11 n. 9: su richiesta di **Alberto** — l'unica fonte primaria, 024d354, cita lui; se riferisse un desiderio della cliente è una domanda aperta, §11.3 — tornano, rifatti senza curve, veli, scuro né testo sotto 16 px, i pannelli orizzontali di «Perché Domus Tua» — `HorizonStory` + `HorizonScroller` — e il film delle cinque stelle — `StarReviews`; via cupola, fondale aereo, fiori, velo di vino, widget duplicato. Da 1024 px e con motion ok i nastri pilotati dallo scroll sono quindi tre, tutti a sticky + runway e nessuno col pin di GSAP: `HorizonScroller` (#storia), `StarReviews` (#recensioni, 360svh) e la rotaia del team (runway 120). «Le voci» resta un carosello nativo, non pinnato. Il fondale aereo non c'è più, ma la stessa foto è tornata nel pannello del territorio: §1 n. 6.)*
Reduced-motion: tutto fermo e visibile (regola già in vigore).

## 4. Home, sezione per sezione

| # | Oggi (file) | Domani |
|---|---|---|
| 4.1 | `HeroCinematic.tsx` (1008): foto a tutto schermo, velo espresso, lockup + script + H1 + subcopy + RR + 3 CTA + chip | **Hero chiaro** su fondo avorio: lockup `Domus Tua` in `--font-brand` a 13vw, script rosso "Raffaela Rizza" staccato sotto; H1 a `d2`; video `public/media/domus-hero.mp4` 16:9 a tutta larghezza (poster = foto attuale) che risale di ~10vh sotto il titolo; **blocco CTA a destra** sotto il video: `Richiedi la valutazione` (solid) · `Vendi casa` → /vendi · `Cerco casa` → #cerca; riga fiducia (stelle oro + 4,9/5 · 542 recensioni, da `site.ts`) in 16 px. Via subcopy, RR, chip premio in piccolo, scroll cue, velo, cornice Segno. Resta il rito intro→hero (`data-hero-*`) solo per far entrare le lettere. *(→ §11 n. 5-8: ribaltato da Alberto la sera stessa e l'11 settembre. Oggi la foto è una banda di 60svh dietro lockup e firma, senza velo; H1 a d3, CTA e voto centrati sull'avorio; il `<video>` si monta nella banda solo se abilitato, con motion ok e da 768 px.)* |
| 4.2 | `Posizionamento.tsx` | resta: eyebrow 16 px + titolo `d2` uppercase + lead 300 in colonna 700 px, allineato a sinistra con la foto quadrata reale a fianco (griglia 5/7). |
| 4.3 | `HomeSearchGateway.tsx`: due card (bianca + rossa) | **modulo a filo**: campi con solo bordo inferiore, etichette 16 px uppercase, bottone rosso rettangolare; la scorciatoia "vendi" diventa una riga di testo con link sottolineato. Nessuna card, nessun raggio. |
| 4.4 | `HorizonStory` + `HorizonScroller` (fondale aereo, cupola, pannelli orizzontali, fiori) | **"Come lavoriamo"** (nuovo `ComeLavoriamo.tsx`): titolo `d1` su due righe a sinistra + script rosso "Come lavoriamo" + lead 300 in colonna 660 px + **video in pagina** (featured, `LazyYouTubeEmbed`/`VideoLightbox` esistente) 16:9 a tutta larghezza con play rosso. Sotto, la riga territorio: foto quadrata + "Tra la Pineta e Milano" + testo. *(→ §11 n. 9 e 13: la sostituzione è stata ribaltata. `ComeLavoriamo.tsx` non esiste più: il suo copy è confluito in `HorizonStory`, tornata coi pannelli orizzontali, senza cupola né textPath. Il video in evidenza è verticale e sta in una colonna `.dt-media-column--tall` 9:16, non in una banda 16:9: a tutta larghezza sotto lg, e da lg larga al massimo 420 px (`HorizonStory.tsx:204`, `lg:!max-w-[420px]`) invece dei 42vw del modulo, perché il fotogramma sorgente ha 1280 px e a 605 px di colonna i visi si impastano; il pannello del territorio ha la foto aerea `/media/hero-aerial.jpg` in `.dt-media-full`, che contraddice §1 n. 6: domanda aperta.)* |
| 4.5 | `ReviewsWall` (muro sticky 520vh) + `StarReviews` (stelle 360svh) | **"Le voci"** (nuovo `Voci.tsx`): eyebrow "Cosa dicono di noi" + titolo `d1` che È il numero: `4,9 / 5 · 542 recensioni Google` (da `site.ts`, mai scritto a mano); **carosello** a scorrimento nativo con frecce (scroll-snap) dei 6 video reali di `wallVideos`, tessere 16:9 squadrate larghe 60vw (90vw mobile), titolo sotto in 19 px; poi `TrustindexEmbed` (intoccabile) e link "Leggi tutte le recensioni". Nessun morph, nessun pin. *(→ §11: `StarReviews` non è sparito, è tornato come capitolo #recensioni subito prima delle voci (n. 9). Il titolo-numero l'ha tolto una decisione di lavoro l'11 settembre (360c76b): oggi titolo d2 «Le storie in video» e conteggio a 16 px. Le tessere sono larghe 32vw da lg, 46vw da md e tutta la larghezza sul telefono; il video in evidenza è escluso dal carosello, perché sta già in `HorizonStory`; copertine rifilate con `dt-still-trim`.)* |
| 4.6 | `Paths.tsx` (pannelli scuri pinnati 520vh) | **"Due percorsi"**: due righe editoriali piane, Vendere / Acquistare, foto quadrata + titolo `d2` + lead + link sottolineato. Chiaro. |
| 4.7 | `Method.tsx` (3 atti con maschere circolari, fiori) | titolo `d1` su tre righe **allineato a destra** ("Un percorso chiaro / dalla prima stima / alla firma"), poi 3 atti come righe: script rosso a sinistra (Ascolto · Racconto · Firma) + lead a destra + foto quadrata; i 9 passi come lista numerata **01.-09.** (numeri a `d1` peso 300, titolo `d3`, testo 19 px). *(→ §11.2: dall'11 settembre la home monta `<Method compact />` (`page.tsx:75`): testa e tre atti, con le foto in `.dt-media-half` 16:9, più un link ghost a /metodo. I nove passi stanno solo su /metodo (0fa94bc).)* |
| 4.8 | `OpenDomus.tsx` (card, coni di luce) | foto grande 4:5 + titolo `d2` + due colonne di benefici (venditore/acquirente) con titoli `d4`. |
| 4.9 | `DomusDocProtocol.tsx` (card 2.2rem, sigillo con lampo) | riga piana: titolo `d2`, intro lead, checklist in due colonne; sigillo SVG fermo a fianco del titolo. |
| 4.10 | `Services.tsx` (rotaia di card 4:5, HoverDistort) | titolo `d1` + griglia 3 colonne (1 su mobile) foto quadrata + titolo `d3` + testo 19 px; feature rendering come riga 6/6 con foto. Nessuna rotaia. |
| 4.11 | `CostiChiari.tsx` (card) | statement: titolo `d2` + script rosso "Nessun anticipo" + lead. |
| 4.12 | `FeaturedTestimonial.tsx` (bg-ink) | chiaro: foto quadrata a sinistra, citazione in Playfair `d3` tondo (non uppercase) a destra, nome 19 px, link video sottolineato. |
| 4.13 | `Social.tsx` + `Team.tsx` + `TeamTrail.tsx` | Social: piatto, chip senza raggio. **Team**: intro founder (foto 4:5 + citazione) poi **rotaia orizzontale** con `HorizontalRail runway` — ritratti 4:5 alti 70vh, nome `d2` uppercase, ruolo 19 px; ritratti mancanti = monogramma su campitura cream-deep (fino a consegna foto). Mobile: scorrimento nativo con snap (già supportato da `HorizontalRail`). `TeamTrail` rimosso. *(→ §11 n. 4 e §11.2: dopo c122bf4 e 360c76b nessun monogramma né tessera vuota. L'intro founder è in `.dt-media-half`; la rotaia ha tre tessere `.dt-media-column` 4:5 — il ritratto di Raffaela, `team-red.jpg`, `team-group.jpg` — con didascalia di una riga, e sotto la rotaia i sei nomi a d3 col ruolo.)* |
| 4.14 | `Contact.tsx` (card, arch-frame, fiori) | form a filo come 4.3, foto quadrata (via arch-frame), recapiti in `d4`. |
| 4.15 | `KineticStrip` | rimosso. Al suo posto **banda video finale** (nuovo `Congedo.tsx`): `domus-hero.mp4` a tutta larghezza, titolo bianco `d1` "Vendere casa, senza stress." + link "Contattaci" sottolineato bianco. Senza velo. *(→ §11.2: dall'11 settembre il bianco ha un'ombra attaccata alle lettere, `INK_ON_VIDEO`, perché il volo del drone gli porta sotto tende e pavimento chiari; il poster è `piscina-lusso.jpg` a `object-[16%_50%]` scale 1.14 (8b21627, 4a0d96e). Nessun rettangolo sopra il video: §1 n. 10.)* |
| 4.16 | `Footer.tsx` (bg-graphite, fiori, wordmark gigante) | **chiaro**: hairline in alto, logo 200 px, tre colonne (Domus Tua + payoff · Recapiti · Dove siamo) con titoli `d4`, testo 19 px; riga legale 16 px. Via l'uncover fisso. |
| — | `ThreadNav`, `ToneShift` ×3, `SectionDivider` ×2, `SurfaceVeil`, `SurfaceFlow`, `Cursor`, `PageTransition` | rimossi dalla home e dal layout. |

Header (`Header.tsx`): chiaro e trasparente sul fondo avorio, logo 200 px a sinistra, nav 16 px
uppercase tracciata a destra + CTA testuale "Vendi casa"; a scroll diventa `cream-deep` pieno con
hairline. Menu mobile: pannello pieno avorio, voci a `d2`. Via il pill scuro e il gradiente.
`RotatingMark` resta nell'header (monogramma orario).
*(→ §11.2: rifatta. Una riga sola alta `--dt-head-h`, logo `w-[clamp(150px,13vw,210px)]`,
`RotatingMark` a 56 px solo da xl; da lg sei voci primarie — Vendi, Acquista, Metodo Domus, Open
Domus, Chi siamo, Contatti — a `text-ui` maiuscolo tracking 0.1em, più il selettore lingua, e
**nessuna CTA** in testata (7d2d1d8, 6e6559b). Servizi, Recensioni e Lavora con noi restano nel
pannello del telefono e nel footer. Sotto lg la testata è sticky e dopo lo scroll diventa
`cream-deep` con hairline; da lg è in flusso, trasparente, e scorre via.)*

## 5. Pagine interne

- `PageHero.tsx` (scuro, min-h 82vh, scrim) → **hero chiaro**: titolo `clamp(3rem, 8vw, 9rem)`
  uppercase + script rosso di pagina (es. "Vendere", "Chi siamo") + sottotitolo `d4` centrato; foto
  grande sotto, squadrata. Stesso componente, tutte le rotte lo ereditano.
  *(→ §11.2: rifatto l'11 settembre, 8b21627. Da lg la testa sta su due colonne `[1.1fr_1fr]`: a
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
  *(→ §11.2: dall'11 settembre `EditorialRows` mostra le foto solo se ogni riga ne ha una vera in
  `/reali/` (`EditorialRows.tsx:43`, 183acdd): oggi i quattro chiamanti — Acquista, Open Domus,
  Servizi, Vendi — rendono tutti la lista numerata. Il capitolo recensioni vive solo su /recensioni
  (ea1b584).)*
- `/case/[slug]`: fuori scope visivo tranne raggi/ombre a zero (logica intoccabile per PRODUCT.md).

## 6. Sistemi globali

- **Preloader**: `TEMPO = 1` in `app/lib/motion/intro-constants.ts`; ogni durata/ritardo delle
  keyframe in `globals.css` (righe 1716-2082 e 2236-2422 del file di quel giorno, che ne contava
  3283) dimezzata di conseguenza; `intro-clocks.test.ts` deve tornare verde senza modifiche alle
  asserzioni (è lui il metro).
  *(Quei numeri di riga valevano a 67afc9e. Dopo le cancellazioni `globals.css` conta 2117 righe, e
  gli stessi due blocchi stanno oggi a `globals.css:763-1144` (il film, con le keyframe `dt-pre-*` a
  `:892-1052`) e `:1299-1424` (le geometrie del telefono).)*
  *(→ §11 n. 11: l'11 settembre Alberto ha chiesto l'ingresso «come prima», ripristinato col patto
  della porta: `[data-pre-figure]` ha `top: calc(var(--dt-head-h) + 1px)` e
  `height: var(--dt-band-h)`, così la sagoma nel sipario e la banda dell'hero sono lo stesso scatto
  nella stessa scatola, e `intro-clocks` ha asserzioni nuove che lo presidiano. Restano tre punti
  aperti sul preloader: pannello espresso, lockup in Playfair a 11vh, didascalie sotto i 16 px, §11.3.)*
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
  *(→ §11 n. 9: i blocchi dei pannelli orizzontali e delle cinque stelle sono tornati l'11 settembre,
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

## 11. Direttive arrivate dopo la costruzione

La chiamata del 10 settembre è in §1. Qui c'è quello che è arrivato dopo, mentre si costruiva o a
costruito finito. Fonti: i transcript di questa macchina (orari UTC), i messaggi di commit e il codice
com'è il 2026-09-13 (c2949a3). La colonna «chi» tiene separate tre voci che nei documenti si erano
mescolate: **la cliente** (riportata da Alberto), **Alberto** (un giudizio o una scelta sua),
**decisione di lavoro** (presa costruendo, con la ragione scritta nel commit, senza che nessuno
l'abbia chiesta). Il motivo è pratico: a una direttiva della cliente si risponde alla cliente, a una
decisione di lavoro no, e confonderle fa difendere con la cliente cose che non ha chiesto.

Le righe 1-4 non sono arrivate dopo la costruzione: sono le risposte di Alberto alle quattro domande
del 10 settembre, già riassunte in §2, e stanno qui con le parole esatte dell'opzione scelta.

### 11.1 Le direttive

| n | Data | Chi | Parole esatte | Come è applicata (file) | Commit |
|---|---|---|---|---|---|
| 1 | 2026-09-10, 18:16Z | Alberto, risposta alla domanda «Font» | «Aspetto il logo nuovo» | **In attesa del cliente.** `--font-sans` e `--font-brand` puntano entrambi a Plus Jakarta Sans (`layout.tsx`, `globals.css:79-86`); quando arriva il logo si cambia una riga (§9). | b9e6b7f (token) |
| 2 | 2026-09-10, 18:16Z | Alberto, risposta alla domanda «Logo nuovo» | «Non ce l'ho ancora: costruisci col logo attuale (Recommended)» | Applicata: `Logo.tsx` coi file attuali `logo-domustua-*`; in testata `w-[clamp(150px,13vw,210px)]`. | — |
| 3 | 2026-09-10, 18:16Z | Alberto, risposta alla domanda «Preloader» | «Stesso film di oggi ma dimezzato» | Applicata: `TEMPO = 1` (`intro-constants.ts:66`), lo stesso film ad arco in 4,63 s. La memoria `domus-redesign-rivista-bianca.md` data questa risposta all'11 settembre sera: è del 10. | 456026a |
| 4 | 2026-09-10, 18:16Z | Alberto, risposta alla domanda «Sezione team» | «Scroll orizzontale pilotato dallo scroll verticale» | Applicata da 1024 px con motion ok: `.dt-railway[data-on]` è alto `calc(rail-len + 120svh)` e la rotaia dentro è sticky (`Team.tsx:219-224`, `globals.css:2068-2074`). Sotto 1024 px è uno scroll orizzontale nativo con snap. | cf9fe39 |
| 5 | 2026-09-10, 20:54Z | Alberto, dopo la revisione | «nella hero hai cambiato le posizioni non mi piace , rimettilo centrale» | Applicata; **ribalta §1 n. 7** della cliente, e fino a questo aggiornamento nessun documento lo diceva. Il lockup «Domus / Tua» su due righe è centrato nella banda; sovratitolo, H1 (d3, `max-w-[28ch]`), CTA e voto sono centrati sull'avorio (`HeroCinematic.tsx:447-528`). Il commento `HeroCinematic.tsx:399-401` dice ancora «in ALTO nella banda», ma il codice centra. | e6e34bd |
| 6 | 2026-09-10, 20:55Z | Alberto (messaggio in coda) | «hai cambiato tutto , la hero rimettila con la foto sotto la scritta» | **Superata** dalla n. 8 (Alberto, 2026-09-11): la foto non sta più sotto il testo, è la banda alta dietro il lockup. | e6e34bd |
| 7 | 2026-09-10, 20:56Z | Alberto (messaggio in coda) | «lascia il nuovo font pero , non rimetterlo esattamente come prima , intendo solo le posizioni» | Applicata: il lockup resta `font-brand` (Jakarta) `text-hero` extrabold, tracking -0.02em, maiuscole e minuscole, «Domus» grafite e «Tua» rossa; l'H1 resta Playfair. «Nuovo font» qui vuol dire la tipografia della rivista bianca, non un font consegnato: l'oggetto di e6e34bd («col font nuovo») si presta all'equivoco, e il logo nuovo non è arrivato (n. 1). | e6e34bd |
| 8 | 2026-09-11 | Alberto (citato in 09aff4b; sessione da portatile, nessun transcript su questa macchina) | «la foto nella hero va messa dietro la scritta Domus Tua, non più avanti, come era prima del cambiamento» | Applicata: banda `h-[var(--dt-band-h)]` = 60svh a tutta larghezza su `bg-cream-deep`; `next/image` di `heroCinematic.base` con `preload`, quality 78, `object-cover`, `objectPosition` «10% 0%», nessun velo; il `<video>` si monta solo se abilitato, con motion ok e da 768 px (`HeroCinematic.tsx:393-483`). Sulla foto stanno **solo** lockup e firma: questo lo ha deciso il lavoro, nello stesso commit («Senza velo, a 38 px l'H1 sopra un divano non si legge; a 13vw il lockup si legge su qualunque stanza»), non Alberto. | 09aff4b |
| 9 | 2026-09-11 | Alberto (024d354 la introduce con «Alberto, 2026-09-11:») | «dovevamo fare un redesign, ma mantenendo quelle animazioni che non erano curve, tipo quella del 5 stelle, lo scroll orizzontale nella sezione perché domus tua … come prima ma con il nuovo design, niente curvo» | Applicata: `page.tsx:71-72` monta `HorizonStory` (#storia, senza cupola né textPath; pannello statement 100vw, territorio 126vw) e `StarReviews` (#recensioni, corsa 360svh, scrub 0.6; sotto 1024 px un film a tempo, `FILM_MS` 3000, in un riquadro alto al massimo 62svh). Da 1024 px entrambi solo con motion ok. **Supera in parte** «eliminare tante animazioni e transizioni» della cliente (§1): tornano i due set piece, restano tolte transizioni di pagina, cursore custom e il resto del vecchio livello di effetti. §3.5 scriveva «su richiesta del cliente», ed è corretto qui; DESIGN.md, PRODUCT.md, il commento `app/page.tsx:61-63` e la memoria lo dicono ancora (domanda aperta 3). Anche la citazione era stata alterata altrove in «mantenere le animazioni». | 024d354 |
| 10 | 2026-09-11, 13:46Z | Alberto | «utilizza anche come riferimento il sito vecchio al quale avevamo preso spunto : eraresidence» | Applicata come riferimento secondario: il dossier `reverse-engineering/era-residence/` (§4.3, §5, §11) è citato in `HorizonScroller.tsx:4`, `Preloader.tsx:7`, `RotatingMark.tsx:3-4` e `TextLines.tsx:28`, ed è servito a ripristinare l'ingresso del preloader (n. 11). Non era registrata in nessun documento di progetto; la memoria dà ancora era-residence per superato. | — |
| 11 | 2026-09-11, 13:46Z | Alberto | «inoltre vedo che c'è un problema sul preloader , non è piu come prima . lo rivoglio come prima , l'animazione di entrata» | Applicata col patto della porta (decisione di lavoro): `--dt-head-h` `clamp(4.5rem, 10vh, 6.5rem)` e `--dt-band-h` 60svh (`globals.css:155-156`) ancorano la sagoma `raffaela-sagoma(-m).webp` alla banda dell'hero con lo stesso `objectPosition` «10% 0%», così quando l'arco si apre dentro e fuori c'è la stessa immagine. Prima si vedevano due Raffaela di misura diversa per 750 ms. La durata è rimasta 4,63 s (`TEMPO = 1`): se «come prima» comprendesse anche i 9,26 s di `TEMPO = 2` è aperto. | 6e6559b |
| 12 | 2026-09-11 | decisione di lavoro | «Il numero e' vivo: la nota accanto alla costante dice di rileggerlo dal widget ogni volta che si tocca quella riga.» | Applicata: `site.rating` "4.9" e `site.reviewsCount` "542", letti dal widget Trustindex l'11 settembre (`site.ts:2-6`, `:45-46`); si vedono nell'hero («4,9/5 · 542 recensioni Google»), in Voci, Reviews, Stats, sul titolo di /recensioni e nelle meta. Nessun `aggregateRating` nel JSON-LD. Il 531 di §1 n. 9, §4.1 e §4.5 è corretto sul posto; resta nel commento `StarReviews.tsx:39`. | 98b8709 |
| 13 | 2026-09-11 | decisione di lavoro | «Il territorio si illustra col territorio: la ripresa col drone» | **Domanda aperta.** `/media/hero-aerial.jpg` in `.dt-media-full` nel pannello territorio (`HorizonStory.tsx:303-311`, `sizes` «(min-width: 1024px) 55vw, 100vw»), nel primo capitolo dopo la ricerca: contraddice §1 n. 6 della cliente. Il 2026-09-13 c2949a3 ha corretto il testo alternativo: la ripresa è quasi a picco su una villa privata con piscina, non su «i tetti e il verde attorno a Tradate». Immobile, autorizzazione del proprietario e diritti del file sono fra le domande bloccanti di `docs/da-chiedere-alla-cliente.md` §2.2. | 360c76b, c2949a3 |

### 11.2 Correzioni che toccano il corpo di questa specifica

Non hanno una riga sopra perché riguardano il sistema più che questa specifica; stanno qui perché le
note nel corpo le richiamano. I valori sono letti dal codice a c2949a3 e bastano da soli: non
rimandano a DESIGN.md, che a c2949a3 per questi punti è rimasto indietro. Lì l'oro è ancora #c9a227
(`DESIGN.md:15`, `:224`, `:242`), il d1 ha interlinea 0.92 (`:29`, `:254`), il lead sta a 50ch
(`:208`, `:258`, `:269`), la testata ha nove voci su una seconda riga col monogramma da 44 px da lg
(`:333`, `:350`) e il «menu sopra» è dato al cliente (`:284`). Lo stesso vale per
`.impeccable/design.json`: ink #1a1816, oro #c9a227, `.ds-lead` a 50ch, `.ds-nav` a tracking 0.08em.
Dove un documento e il codice non coincidono, fa fede il codice.

- **Testo in grafite.** Alberto, 2026-09-11, «NIENTE SCRITTE BLACK» (09aff4b): `--color-ink` =
  `--color-graphite` = `--foreground` = #46423d. → §3.1.
- **Testata a una riga.** Il «menu sopra» da rifare l'ha detto Alberto (transcript 2026-09-11,
  13:46Z, nello stesso messaggio della «posizione delle foto e dei video etc.»); le sei voci
  primarie sono una decisione di lavoro (6e6559b), come la testata in flusso, sticky solo sotto lg
  (7d2d1d8, 2026-09-10). Oggi: una riga alta `--dt-head-h`, `clamp(4.5rem, 10vh, 6.5rem)`; logo a
  `w-[clamp(150px,13vw,210px)]`; `RotatingMark` a 56 px (`h-14`) solo da xl (1280 px); da lg sei voci
  a `text-ui` maiuscolo, peso 400 e tracking 0.1em, più il selettore lingua; nessuna CTA in testata.
  6e6559b, 5304dfd e il commento `site.ts:320-322` attribuiscono le due frasi di Alberto al cliente
  (domanda aperta 4). → §4, Header.
- **Scala tipografica** (02d19d3, aff9b0e, 3411a55; decisioni di lavoro): interlinee d1 0.98 e d2 1,
  `.lead` a 38ch, occhiello a 500 e 0.12em, pesi dati dall'elemento (h1-h3 a 500, h4 a 400), scala in
  vw sotto 63.99rem, calligrafia a -0.2em. → §3.2.
- **Oro delle stelle** (aff9b0e; decisione di lavoro): #d9a441, gold-deep #a9812a, gold-light
  #eed07a, gold-spec #fff6d4. → §3.1.
- **Tre moduli media** (5304dfd, aff9b0e, 90672e3, 360c76b; decisione di lavoro che risponde alla
  «posizione delle foto» di Alberto): «Il rapporto della scatola segue il SORGENTE, non la griglia.»
  I `sizes` dichiarano i pixel chiesti (01a1f20). → §3.3, §4.7, §4.13.
- **Ogni contenuto una volta sola** (0fa94bc, ea1b584, 183acdd; decisioni di lavoro): i nove passi
  solo su /metodo, il capitolo recensioni solo su /recensioni, `EditorialRows` con le foto solo se
  sono tutte vere. → §4.7, §5.
- **PageHero su due colonne e ombra del Congedo** (8b21627, 4a0d96e; decisioni di lavoro). → §4.15,
  §5.
- **Copertine rifilate** (c0d841f, 39cedc3; decisione di lavoro, dichiarata provvisoria):
  `.dt-still-trim` scale 1.43 con origine 100% 100%, variante `--top` scale 1.32, in `Voci.tsx:225` e
  `FeaturedTestimonial.tsx:141`; sparisce quando arrivano i fotogrammi puliti (§11.4). → §4.5.

### 11.3 Domande aperte

Nessuna si risolve senza chi deve rispondere; finché restano aperte, il codice resta com'è.

1. **Colore del testo.** Il riferimento scrive titoli e corpo in #1f1f1f
   (`reverse-engineering/goldengoal/README.md:86`), Alberto ha chiesto «NIENTE SCRITTE BLACK» e l'ink
   è #46423d. Da chiedere ad Alberto: accetta un inchiostro più scuro per i soli titoli (proposta
   #2e2a26, non applicata)?
2. **Foto dopo la ricerca.** La foto aerea è di nuovo nel primo capitolo dopo la ricerca (n. 13).
   Si toglie, o si chiede alla cliente se il divieto del punto 6 valeva solo per il fondale?
3. **Chi ha chiesto i set piece.** L'unica fonte primaria (024d354) cita Alberto; DESIGN.md,
   PRODUCT.md, `page.tsx:61-63` e la memoria dicono cliente. Se Alberto riferiva la cliente va
   scritto, altrimenti quei documenti vanno corretti.
4. **«Menu sopra» e «posizione delle foto».** Li ha scritti Alberto; 6e6559b, 5304dfd,
   `site.ts:320-322` e DESIGN.md li danno al cliente. Riportava un giudizio della cliente o era suo?
5. **Preloader «come prima».** Comprendeva anche la durata di 9,26 s (`TEMPO = 2`) o solo l'ingresso?
   Oggi `TEMPO = 1`, coerente con la risposta del 10 settembre (n. 3).
6. **Testo sotto 16 px nel preloader** (`PreloaderShell.tsx:96` a 0.68rem, `:216` a 0.82rem). Si
   porta a 16 px o si registra un'eccezione dichiarata? Oggi §3.2 dice il falso.
7. **Pannello espresso del preloader.** Contraddice «eliminare nero ovunque» e non ha un consenso
   esplicito né della cliente né di Alberto: l'ha messo questa specifica (§3.1), e il consenso è solo
   implicito in «Stesso film di oggi ma dimezzato». Resta?
8. **Disco carta sotto il badge del preloader** (`bg-paper rounded-full`). Contraddice «metti il logo
   senza sfondo bianco» (cliente, 2026-08-06), che nessuno ha revocato. Resta?
9. **Lockup del preloader in Playfair**, contro «stesso font del logo in tutte le scritte Domus Tua».
   Si allinea ora a `--font-brand` o si aspetta il logo nuovo?
10. **«Box vendi casa più a destra».** Ribaltata da Alberto (n. 5), e «box» = blocco CTA è
    un'interpretazione di questa specifica. Va detto alla cliente?
11. **Oro.** PRODUCT.md dice «DIVIETI: niente oro», il codice ha l'oro sulle stelle (#d9a441). Si
    riscrive come «oro solo sulle stelle»?

### 11.4 In attesa del cliente

- **Logo nuovo e il suo font**: non consegnati. `public/` contiene solo i `logo-domustua-*` datati dal
  2026-07-28 al 2026-08-06; `--font-brand` = `var(--font-jakarta)` come segnaposto (`globals.css:86`).
  Procedura in §9 e `docs/logo-assets.md` §5.
- **Fotogrammi puliti dei video**, uno per video a 1920x1080 (`ffmpeg -ss`): servono i file sorgente,
  che non sono nel repo. Intanto la correzione `.dt-still-trim` (§11.2).
- **Cinque ritratti singoli del team**: Paloma Cavalcante, Eleonora D’Agati, Viola Benatti, Tiziana
  Galeone, Katya Fedrigo. In `app/lib/team.ts` solo Raffaela ha `image`; la rotaia usa per ora
  `team-red.jpg` e `team-group.jpg`.
- **Firma autografa reale**: `brand.signature = ""` (`app/lib/brand.ts:34`). L'hero usa il nome in
  Pinyon Script, non una firma finta.
- **Parole vere dei clienti per le citazioni**: `FeaturedTestimonial.tsx` non rende più quote, autore
  e contesto, perché erano inventati; `Reviews.tsx` mostra il banner «Esempi dimostrativi» quando le
  card sono demo.
- **La foto aerea del territorio**: di quale immobile si tratta, l'autorizzazione del proprietario e i
  diritti del file, oppure una vera foto aerea di Tradate (`docs/da-chiedere-alla-cliente.md` §2.2,
  segnata bloccante). Decide anche la domanda aperta 2.
