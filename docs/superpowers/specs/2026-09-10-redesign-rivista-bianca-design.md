# Redesign "la rivista bianca" — specifica di design

Data: 2026-09-10 · Origine: chiamata con la cliente (note di Alberto) · Riferimento pinnato dalla
cliente: https://www.immobiliaregoldengoal.it/ · Dossier tecnico del riferimento (misure, sorgenti,
screenshot): `reverse-engineering/goldengoal/README.md` (cartella di studio, gitignorata).

## 1. Il brief, in una riga

La cliente boccia lo stile attuale — curvo, smussato, a card, con transizioni di pagina curve — e
vuole quello del riferimento: pulito, professionale, **scritte grandi, niente scritte piccole,
niente nero, niente curve**, foto e video grandi, spazi gestiti bene, molte meno animazioni.

Le direttive del 2026-08-06 (fiori SVG negli angoli, cupole, horizontal scroll pinnato ovunque,
"tante animazioni") sono **superate** da questa chiamata. Restano valide: nessun taglio percepibile
fra sezioni (che ora si ottiene con un solo fondo), scritte e immagini grandi, logo reale ovunque.

Lista puntuale della chiamata e dove si risolve:

| # | Richiesta | Risoluzione | § |
|---|---|---|---|
| 1 | Preloader più veloce | stesso film, `TEMPO` 2 → 1 (9,26 s → 4,63 s) | 6 |
| 2 | Cuore che ruota in senso orario | `RotatingMark`/`spinMarkBadge`: monogramma +360° | 6 |
| 3 | Firma più in basso nella hero | script staccato sotto il lockup (≈ 1 em in più) | 4.1 |
| 4 | Eliminare "Valutazione professionale… RR Con Raffaela Rizza e il team" | via `subcopy` e riga founder dall'hero | 4.1 |
| 5 | Via "Guarda il video", mettere "Vendi casa" | terzo bottone → `/vendi` | 4.1 |
| 6 | Togliere foto dopo ricerca | via il fondale aereo di HorizonStory (sezione rifatta) | 4.4 |
| 7 | Box vendi casa più a destra | blocco CTA allineato a destra, sotto il video | 4.1 |
| 8 | Eliminare tutti i fiori | `Fioritura` e gli 8 consumatori rimossi | 7 |
| 9 | Rifare "Il muro delle voci" | capitolo "Le voci": carosello video + 4,9/531 + Trustindex | 4.5 |
| 10 | Vignettatura no | via `.bg-ink` radiali, veli su foto, grana, PageTransition | 7 |
| 11 | Gestire le grandezze font come il riferimento | scala in vw/vh, uppercase, paragrafi grandi e leggeri | 3.2 |
| 12 | Team: carosello o scroll orizzontale con foto grandi | rotaia orizzontale pilotata dallo scroll (`HorizontalRail`) | 4.13 |
| 13 | Eliminare nero ovunque | nessuna superficie scura: hero, PageHero, footer, Paths, Manifesto, testimonianza | 3.1 |
| 14 | Logo nuovo + font del logo su tutte le scritte "Domus Tua" | logo attuale finché non arriva il file; token `--font-brand` per le scritte | 9 |

## 2. Decisioni prese con Alberto (2026-09-10)

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
- **FORM**: canone del riferimento pinnato dalla cliente, eseguito fedelmente nella nostra palette
  (rosso al posto dell'oro, fondo chiaro al posto della banda nera). Nessun concept tournament.

### 3.1 Colore — strategia "Restrained"

| Token | Prima | Dopo | Uso |
|---|---|---|---|
| `--background` / `--color-cream` | #fffdfa / #f2ebda | **#f9f5ef** | l'unico fondo del sito |
| `--color-cream-deep` | #efe7d6 | #f4ece2 | header pieno, campi, fasce leggerissime |
| `--color-paper` | #fffdf8 | #fffdf8 | sfondo dei campi |
| `--color-line` | #e3d9c6 | #e4dccf | hairline dei campi e del footer |
| `--color-ink` / graphite / stone | invariati | invariati | testo; ink solo come colore di testo |
| `--color-red` | invariato | invariato | accento, CTA piene, corsivo di capitolo |
| `--color-espresso` / `wine` | superfici | **solo il pannello del preloader** | nessuna sezione scura |
| oro | stelle | stelle | invariato (unica eccezione, già sancita) |

Regola: **nessuna superficie scura** (`bg-ink`, `bg-espresso`, `bg-wine`, `bg-graphite`,
gradienti `from-ink/*`) fuori dal preloader. Testo bianco solo sulla banda video finale, senza velo.

### 3.2 Tipografia — la scala che risponde a "scritte grandi"

Regola del riferimento: i titoli scalano col viewport (vw in hero, vh nei capitoli), sono
maiuscoli, e i paragrafi sono grandi e leggeri in colonne strette (≤ 800 px).

| Token | Valore | Peso · interlinea | Ruolo |
|---|---|---|---|
| `--text-hero` | `clamp(3.1rem, 13vw, 13rem)` | 800 · 0.9 | lockup "Domus Tua" (font-brand) |
| `--text-d1` | `clamp(2.4rem, min(10vh, 6.5vw), 7.5rem)` | 500 · 0.92 | titolo di capitolo, uppercase, UNO per sezione |
| `--text-d2` | `clamp(2.3rem, min(6.4vh, 4.2vw), 4.5rem)` | 500 · 0.95 | sotto-capitolo, uppercase |
| `--text-d3` | `clamp(1.5rem, min(4.5vh, 2.8vw), 2.6rem)` | 400 · 1.05 | titoli di riga, uppercase |
| `--text-d4` | `clamp(1.45rem, 1.8vw, 1.75rem)` | 300 · 1.2 | etichette grandi (footer, "Contattaci"), uppercase |
| `--text-lead` | `clamp(1.35rem, 1.72vw, 1.55rem)` | 300 · 1.4 | paragrafo editoriale |
| `--text-body` | 1.1875rem (19 px) | 400 · 1.5 | corpo |
| `--text-ui` | 1rem (16 px) | 500-600 · uppercase · tracking 0.08em | nav, eyebrow, bottoni, didascalie |
| `--text-script` | `clamp(2.6rem, 7vw, 7rem)` | Pinyon 400 | parola-ornamento rossa, una per capitolo |

Vincoli: **nessun testo sotto 16 px** (`.eyebrow` passa da 11 a 16 px; `text-xs/sm` vietati nel
contenuto); `h1, h2, h3, h4` uppercase per regola globale; `blockquote` e corsivi in tondo/basso.
I token `--text-d1…d4` esistenti vengono **ridefiniti** (non rinominati), così i consumatori
attuali ereditano la scala nuova.

### 3.3 Spazio, griglia, media

- Righe a tutta larghezza con padding laterale **8vw** (4vw sotto 768); colonne di testo ≤ 800 px;
  asimmetrie con padding percentuali (es. sinistra 4vw, destra 18vw), non griglie complesse.
- Ritmo verticale: `clamp(6rem, 14vh, 11rem)` fra capitoli; più spazio sopra un titolo che sotto.
- Media: video 16:9 a tutta larghezza, foto **quadrate** (1:1) o 4:5, sempre `border-radius: 0`,
  nessun gradiente sopra, nessuna didascalia sopra la foto. Il play è un cerchio rosso 96 px (le
  icone tonde sono l'unica curva ammessa: play, frecce, WhatsApp).
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
(`cubic-bezier(.2,.65,.3,1)`). Nessuna sezione pinnata tranne la rotaia del team. *(Aggiornamento 2026-09-11: su richiesta del cliente tornano, rifatti senza curve, veli, scuro né testo sotto 16 px, i pannelli orizzontali di «Perché Domus Tua» — `HorizonStory` + `HorizonScroller` — e il film delle cinque stelle — `StarReviews`; via cupola, fondale aereo, fiori, velo di vino, widget duplicato.)*
Reduced-motion: tutto fermo e visibile (regola già in vigore).

## 4. Home, sezione per sezione

| # | Oggi (file) | Domani |
|---|---|---|
| 4.1 | `HeroCinematic.tsx` (1008): foto a tutto schermo, velo espresso, lockup + script + H1 + subcopy + RR + 3 CTA + chip | **Hero chiaro** su fondo avorio: lockup `Domus Tua` in `--font-brand` a 13vw, script rosso "Raffaela Rizza" staccato sotto; H1 a `d2`; video `public/media/domus-hero.mp4` 16:9 a tutta larghezza (poster = foto attuale) che risale di ~10vh sotto il titolo; **blocco CTA a destra** sotto il video: `Richiedi la valutazione` (solid) · `Vendi casa` → /vendi · `Cerco casa` → #cerca; riga fiducia (stelle oro + 4,9/5 · 531 recensioni) in 16 px. Via subcopy, RR, chip premio in piccolo, scroll cue, velo, cornice Segno. Resta il rito intro→hero (`data-hero-*`) solo per far entrare le lettere. |
| 4.2 | `Posizionamento.tsx` | resta: eyebrow 16 px + titolo `d2` uppercase + lead 300 in colonna 700 px, allineato a sinistra con la foto quadrata reale a fianco (griglia 5/7). |
| 4.3 | `HomeSearchGateway.tsx`: due card (bianca + rossa) | **modulo a filo**: campi con solo bordo inferiore, etichette 16 px uppercase, bottone rosso rettangolare; la scorciatoia "vendi" diventa una riga di testo con link sottolineato. Nessuna card, nessun raggio. |
| 4.4 | `HorizonStory` + `HorizonScroller` (fondale aereo, cupola, pannelli orizzontali, fiori) | **"Come lavoriamo"** (nuovo `ComeLavoriamo.tsx`): titolo `d1` su due righe a sinistra + script rosso "Come lavoriamo" + lead 300 in colonna 660 px + **video in pagina** (featured, `LazyYouTubeEmbed`/`VideoLightbox` esistente) 16:9 a tutta larghezza con play rosso. Sotto, la riga territorio: foto quadrata + "Tra la Pineta e Milano" + testo. |
| 4.5 | `ReviewsWall` (muro sticky 520vh) + `StarReviews` (stelle 360svh) | **"Le voci"** (nuovo `Voci.tsx`): eyebrow "Cosa dicono di noi" + titolo `d1` che È il numero: `4,9 / 5 · 531 recensioni Google` (da `site.ts`, mai scritto a mano); **carosello** a scorrimento nativo con frecce (scroll-snap) dei 6 video reali di `wallVideos`, tessere 16:9 squadrate larghe 60vw (90vw mobile), titolo sotto in 19 px; poi `TrustindexEmbed` (intoccabile) e link "Leggi tutte le recensioni". Nessun morph, nessun pin. |
| 4.6 | `Paths.tsx` (pannelli scuri pinnati 520vh) | **"Due percorsi"**: due righe editoriali piane, Vendere / Acquistare, foto quadrata + titolo `d2` + lead + link sottolineato. Chiaro. |
| 4.7 | `Method.tsx` (3 atti con maschere circolari, fiori) | titolo `d1` su tre righe **allineato a destra** ("Un percorso chiaro / dalla prima stima / alla firma"), poi 3 atti come righe: script rosso a sinistra (Ascolto · Racconto · Firma) + lead a destra + foto quadrata; i 9 passi come lista numerata **01.-09.** (numeri a `d1` peso 300, titolo `d3`, testo 19 px). |
| 4.8 | `OpenDomus.tsx` (card, coni di luce) | foto grande 4:5 + titolo `d2` + due colonne di benefici (venditore/acquirente) con titoli `d4`. |
| 4.9 | `DomusDocProtocol.tsx` (card 2.2rem, sigillo con lampo) | riga piana: titolo `d2`, intro lead, checklist in due colonne; sigillo SVG fermo a fianco del titolo. |
| 4.10 | `Services.tsx` (rotaia di card 4:5, HoverDistort) | titolo `d1` + griglia 3 colonne (1 su mobile) foto quadrata + titolo `d3` + testo 19 px; feature rendering come riga 6/6 con foto. Nessuna rotaia. |
| 4.11 | `CostiChiari.tsx` (card) | statement: titolo `d2` + script rosso "Nessun anticipo" + lead. |
| 4.12 | `FeaturedTestimonial.tsx` (bg-ink) | chiaro: foto quadrata a sinistra, citazione in Playfair `d3` tondo (non uppercase) a destra, nome 19 px, link video sottolineato. |
| 4.13 | `Social.tsx` + `Team.tsx` + `TeamTrail.tsx` | Social: piatto, chip senza raggio. **Team**: intro founder (foto 4:5 + citazione) poi **rotaia orizzontale** con `HorizontalRail runway` — ritratti 4:5 alti 70vh, nome `d2` uppercase, ruolo 19 px; ritratti mancanti = monogramma su campitura cream-deep (fino a consegna foto). Mobile: scorrimento nativo con snap (già supportato da `HorizontalRail`). `TeamTrail` rimosso. |
| 4.14 | `Contact.tsx` (card, arch-frame, fiori) | form a filo come 4.3, foto quadrata (via arch-frame), recapiti in `d4`. |
| 4.15 | `KineticStrip` | rimosso. Al suo posto **banda video finale** (nuovo `Congedo.tsx`): `domus-hero.mp4` a tutta larghezza, titolo bianco `d1` "Vendere casa, senza stress." + link "Contattaci" sottolineato bianco. Senza velo. |
| 4.16 | `Footer.tsx` (bg-graphite, fiori, wordmark gigante) | **chiaro**: hairline in alto, logo 200 px, tre colonne (Domus Tua + payoff · Recapiti · Dove siamo) con titoli `d4`, testo 19 px; riga legale 16 px. Via l'uncover fisso. |
| — | `ThreadNav`, `ToneShift` ×3, `SectionDivider` ×2, `SurfaceVeil`, `SurfaceFlow`, `Cursor`, `PageTransition` | rimossi dalla home e dal layout. |

Header (`Header.tsx`): chiaro e trasparente sul fondo avorio, logo 200 px a sinistra, nav 16 px
uppercase tracciata a destra + CTA testuale "Vendi casa"; a scroll diventa `cream-deep` pieno con
hairline. Menu mobile: pannello pieno avorio, voci a `d2`. Via il pill scuro e il gradiente.
`RotatingMark` resta nell'header (monogramma orario).

## 5. Pagine interne

- `PageHero.tsx` (scuro, min-h 82vh, scrim) → **hero chiaro**: titolo `clamp(3rem, 8vw, 9rem)`
  uppercase + script rosso di pagina (es. "Vendere", "Chi siamo") + sottotitolo `d4` centrato; foto
  grande sotto, squadrata. Stesso componente, tutte le rotte lo ereditano.
- `/metodo`: `ManifestoPin` (banda espresso pinnata) → statement chiaro `d1` non pinnato.
- `/vendi`, `/acquista`, `/open-domus`, `/servizi`, `/recensioni`, `/chi-siamo`, `/lavora-con-noi`,
  `/domande-frequenti`, `/case-vendute`, `/valutazione`: ereditano le sezioni rifatte; ogni
  `rounded-[…]` e `bg-ink`/`from-ink` residuo viene tolto (inventario: 17 raggi in open-domus, 5
  superfici scure). `EditorialRows`, `Highlights`, `BeforeAfter`, `FaqList`, `PropertyCard`:
  solo raggi e ombre a zero, layout invariato.
- `/case/[slug]`: fuori scope visivo tranne raggi/ombre a zero (logica intoccabile per PRODUCT.md).

## 6. Sistemi globali

- **Preloader**: `TEMPO = 1` in `app/lib/motion/intro-constants.ts`; ogni durata/ritardo delle
  keyframe in `globals.css` (righe 1716-2082 e 2236-2422) dimezzata di conseguenza; `intro-clocks
  .test.ts` deve tornare verde senza modifiche alle asserzioni (è lui il metro).
- **Cuore orario**: `spinMarkBadge` e il tween di `RotatingMark`: `[data-rot-mark]` → `+360`.
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

## 7. Cosa viene cancellato (file)

*Aggiornamento 2026-09-11: `HorizonScroller`, `HorizonStory`, `StarReviews` e `lib/star-shape.ts` sono stati ripristinati e spogliati (vedi §3.5); `ComeLavoriamo.tsx` è confluito in `HorizonStory`.*

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
- **Foto del team**: 5 ritratti mancanti (solo Raffaela ha la foto). La rotaia nasce con i
  monogrammi e si riempie da `app/lib/team.ts`.
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
