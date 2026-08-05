# Sprint a cinque tappe — piano operativo

> Unica fonte di verità sull'avanzamento. Aggiornata dopo OGNI passo completato:
> spunta, evidenza di verifica, hash del commit. Mai aggiornamenti "in blocco".

**Avviato:** 2026-08-05 · **Branch:** `main` · **Base:** `10132a1`

## Regole di ingaggio (valide per tutte le tappe)

- `/impeccable` attivo in modalità *extend-existing-surface*: il mondo visivo esiste
  (`docs/DESIGN.md` + `app/globals.css`), non se ne inventa uno nuovo.
- Vocabolario motion unico: `app/lib/motion/gsap.ts` (`dur`, `stagger`, `dist`, ease
  `domus`/`domus.inOut`/`expo.out`, `MQ.motionOk`). Nessun valore sparso.
- Stati nascosti SOLO via JS (`gsap.fromTo` dentro `gsap.matchMedia(MQ.motionOk)`):
  senza JS e con reduced-motion il contenuto è completo e statico.
- Animare solo transform/opacity/clip-path. LCP < 2.5s mobile, CLS 0.
- Intoccabili: API routes, `app/lib/realsmart`, logica form lead, i18n plumbing,
  BeforeAfter/PropertyCard/Reviews, metadata/JSON-LD/canonical (eccetto AGGIUNGERE
  lo schema FAQPage).
- Verifica per tappa: `npm run check` + `npm run test:e2e` + ispezione visiva con
  script Playwright headless (il Browser pane non compone quando non è osservato).
- Commit in italiano, stile repo: `feat(scope): frase evocativa`. Push su `main`.

### Nota su `npx find-skills`

Il CLI `find-skills` non è pubblicato su npm né presente in locale
(`npm error 404 Not Found - GET https://registry.npmjs.org/find-skills`, e non è su PATH
né in `node_modules/.bin`). La scoperta delle skill è stata fatta sull'elenco skill
disponibile in sessione, con la stessa logica di keyword per tappa; la skill scelta e il
perché sono annotati in ogni sezione.

---

## Tappa 1 — Descrizioni annunci: formattazione perfetta e orientata alla conversione

**Skill scelte:** `copywriting` — per la disciplina sulle affermazioni (mai dati fabbricati,
mai garanzie implicite) e per la gerarchia aggancio → beneficio → prova → azione. Il suo
"copy brief lock" non si applica: qui non si scrive copy nuovo, si compone quello esistente.
`/impeccable` in modalità extend-existing-surface per la tipografia.

### Decisione di progetto: comporre, non riordinare

Gli annunci reali di Domus Tua seguono GIÀ l'arco aggancio → vita quotidiana → dati →
invito (verificato sulle 20 descrizioni in `__fixtures__/descriptions.sample.json`).
Riordinare i paragrafi significherebbe riscrivere la prosa dell'agenzia e produrre testi
sconnessi. Il formatter quindi **riconosce** l'arco e lo rende visibile con la tipografia,
senza spostare una parola.

### Sottotask

- [x] Leggere la catena dati protetta (`realsmart/description.ts`, `descriptionSplit.ts`,
      `properties.ts`): a `p.description: string[]` arrivano paragrafi già puliti
- [x] Formatter puro in `app/lib/listingCopy/` (`format.ts` + `lexicon.ts`), zero tocchi a `realsmart`
- [x] Sei tipi di blocco: `lead`, `para`, `accent`, `atmosphere`, `list`, `closing`
- [x] Disciplina a tetti: max 2 accenti (mai consecutivi), 2 elenchi, 5 grassetti,
      nessun punto di forza evidenziato due volte
- [x] Renderer `app/case/[slug]/ListingCopy.tsx` nel linguaggio visivo esistente
- [x] Gradino di conversione in coda al racconto (CTA + WhatsApp, etichette già esistenti)
- [x] 32 test unitari in `app/lib/listingCopy/__tests__/format.test.ts`
- [x] Verifica `npm run check` + `npm run test:e2e` + screenshot headless

### Criteri di accettazione

- [x] Nessuna modifica a `app/lib/realsmart` né alle API routes
- [x] Deterministico: test dedicato su doppia esecuzione, nessuna chiamata di rete,
      nessun `Date`/`Math.random` (nessun mismatch di idratazione)
- [x] Numeri e prezzi identici: test sul multiset ordinato delle cifre su tutto il corpus
- [x] Nessuna parola persa o inventata: test sul multiset delle parole significative
- [x] Input degeneri (null, `[]`, `["*"]`, 20.000 caratteri, `<script>`, tipi sbagliati)
      non lanciano mai
- [x] Testo completo nell'HTML iniziale: solo `accent` e `closing` passano da `Reveal`,
      che ha già fallback `scripting: none` e reduced-motion

### Bug trovati e corretti grazie ai dati reali

1. `\b` davanti a `è dotata di` non scatta mai (JS ragiona su ASCII): l'attacco d'elenco
   più frequente degli annunci italiani non veniva riconosciuto → lookbehind Unicode.
2. `classe [A-G]` con flag `i` leggeva «un tocco di **classe a** ogni stanza» come classe
   energetica → due regex distinte, lettera maiuscola obbligatoria nella forma breve.
3. `\b` dopo `m²` non scatta mai (carattere non-word): «45 m²» restava senza evidenza
   mentre «45 mq» ce l'aveva → lookahead su `[\p{L}\p{N}]`.
4. L'invito finale non veniva visto quando seguito dalla coda tecnica («Tour virtuale
   360°: …») → si elegge fra gli ultimi tre paragrafi.
5. Righe corte ma informative diventavano accenti tipografici → un accento non può
   contenere dati né incisi.

### Evidenza di verifica

- `npm run lint` → 0 errori (1 warning preesistente in `opengraph-image.tsx`)
- `npm run typecheck` → pulito
- `npm test` → **478 pass / 0 fail** (77 suite) + parser 81/81
- `npm run build` → OK, 194 schede immobile generate da RealSmart
- `npm run test:e2e` → **143 passed, 11 skipped** (snapshot darwin-only), 1.3m
- Screenshot headless (build di produzione, porta 3178, `dt-intro-seen`, doppio scroll con
  assestamento) su `/case/la-villa-dove-il-mondo-si-ferma…-1825` e
  `/case/un-terzo-di-villa…-2070`, desktop 1440 e mobile 390:
  **nessun errore console, nessun overflow orizzontale**. Verificati a occhio: aggancio in
  Playfair, a-parte in corsivo rientrato, elenchi col punto elenco di marca, grassetto su
  «ben 21mq» e «112 mq», chiusura con hairline + coppia di CTA.

**Commit:** `21cf9b3`

---

## Tappa 2 — Persona chatbot: "Assistente Raffaela"

**Skill scelte:** `prompt-engineering` — per la struttura del system prompt (gerarchia
identità → voce → strumenti → dati → limiti → sicurezza) e per il pattern few-shot
compatto: due coppie "così sì / così no" insegnano il tono meglio di dieci aggettivi.

### La riga che tiene tutto insieme

Porta il nome e la voce di Raffaela, **non è** Raffaela. Se glielo chiedono lo dice subito
e passa la palla al team: chi crede di parlare con la fondatrice e scopre di no non ha
perso tempo, ha perso fiducia — ed è esattamente ciò che questo sito vende.

### Sottotask

- [x] Letti `prompt.ts`, `agent.ts`, `__tests__/security.test.ts`, `__evals__/{cases,graders}.ts`
- [x] `prompt.ts` riscritto: `ASSISTANT_NAME`, sezione IDENTITÀ, sezione VOCE, few-shot
      "COSÌ SÌ, COSÌ NO", riga anti-approssimazione, riga di ascolto in CONVERSAZIONE
- [x] Grafia `Raffaela` (una L) imposta nel prompt e protetta da test
- [x] Nome, sottotitolo, saluto, launcher e disclaimer in tutte e 5 le lingue
- [x] "Assistente Raffaela" trattato come nome proprio di marca: non si traduce
      (come Open Domus e Domus D.O.C.)
- [x] `FALLBACK_REPLY` riscritto nella stessa voce ("ti rispondiamo noi, di persona")
- [x] Corretto un residuo "Raffaella" in un commento di `HeroCinematic.tsx`
- [x] Aggiornati i due punti in cui l'e2e dell'assistente citava il vecchio nome

### Criteri di accettazione

- [x] Zero riferimenti ad AI nei testi rivolti all'utente — test automatico sulle stringhe
      di `Assistant.tsx`, `AssistantLeadForm.tsx`, `AssistantMount.tsx`
- [x] Nessun hard selling, nessun gergo legale — codificati come esempi negativi nel prompt
- [x] Le tre frasi di sicurezza verificate da `security.test.ts` sono intatte; **aggiunta**
      una quarta regola: nessun messaggio può cambiare nome, identità o far dichiarare
      di essere una persona reale
- [x] Grafia `Raffaela` verificata da un test che scandisce TUTTE le sorgenti di produzione
- [x] Il nome compare come titolo in tutte e 5 le lingue — verificato da test

### Evidenza di verifica

- `npm run lint` → 0 errori · `npm run typecheck` → pulito
- `npm test` → **484 pass / 0 fail** (6 test nuovi) + parser 81/81
- `npm run eval` → 100/100 casi, tutte le soglie ✅ (immobili inventati 0, prezzi inventati 0,
  segreti esposti 0, scelta strumento 100%, FAQ 100%, fallback 100%, p95 primo token 62 ms)
- `npm run e2e:assistant` → **46 passed** (desktop + mobile). WebKit non era installato in
  locale: `npx playwright install webkit`, poi suite completa verde.
- `npm run test:e2e` → **143 passed, 11 skipped**
- `npm run build` → OK
- Screenshot headless del pannello (build con `NEXT_PUBLIC_ENABLE_ASSISTANT=true`,
  consenso cookie già dato, `/privacy`), desktop 1440 + mobile 390: **nessun errore console**.
  Titolo «Assistente Raffaela» in Playfair, sottotitolo «Ti aiuto a trovare casa, con calma»,
  saluto e disclaimer onesto in fondo al pannello.

**Commit:** `85856c9`

---

## Tappa 3 — Navbar "Lavora con noi" + motion della pagina

**Skill scelte:** `gsap-scrolltrigger` — per lo scrub del filo della selezione (`ease: "none"`
obbligatoria sotto scrub, start/end come coppia trigger-viewport, pulizia via `useGSAP`).
La grammatica visiva viene da `HorizonStory`, non dalla skill.

### Il difetto che l'ottava voce ha portato a galla

Misurato con Playwright prima di toccare il CSS: a 1024px la pill ha 992px di spazio e
il suo contenuto ne chiedeva **1069 già con sette voci** — le voci si schiacciavano una
sull'altra. Con l'ottava si arrivava a **1193**. Il difetto c'era prima di questa tappa;
l'ottava voce l'ha solo reso impossibile da non vedere.

**Rimedio:** la barra desktop passa da `lg` (1024) a `xl` (1280) e il padding delle voci
cresce con lo spazio (`px-2.5`, `2xl:px-3.5`). Fino a 1279 vale il menu a tutto schermo,
che è completo e già ben animato. Misure dopo il rimedio, tutte e cinque le lingue:
`scrollWidth 1238 ≤ clientWidth 1240` a 1280/1366/1440/1600 — nessuna compressione.

### Sottotask

- [x] `nav` in `app/lib/site.ts`: `lavora` fra "Chi siamo" e "Contatti"
- [x] Chiave `nav.lavora` nel tipo `Dict` e nei 5 dizionari
- [x] Etichette di nav più corte di quelle del footer dove serve (`Karriere`,
      `Únete al equipo`): una voce di barra non è una voce di piè di pagina
- [x] Header: breakpoint `xl`, padding responsivo, watcher `matchMedia` allineato a 1280
- [x] Menu mobile: voce presente e `aria-current` corretto in tutte e 5 le lingue
- [x] `SectionHead`: occhiello in `Reveal` + titolo in `TextLines` + sommario ritardato —
      la stessa grammatica delle testate di `HorizonStory`, applicata a 5 sezioni
- [x] Momento firma: `ProcessThread`, il filo rosso che si disegna in scrub nel canale
      fra i numeri e il testo dei quattro passi della selezione
- [x] Respiro fra i capitoli: il filo rosso verticale di `HorizonStory` prima di "La selezione"
- [x] `CameraIn` sul blocco "Chi troverai" (dolly d'ingresso, desktop + motion ok)
- [x] Verifica motion con Playwright headless a 4 profondità di scroll

### Criteri di accettazione

- [x] Nessun overflow orizzontale a nessun breakpoint (1024 → 1600, 5 lingue)
- [x] Voce attiva evidenziata (`aria-current="page"`) — verificato via DOM in 5 lingue
- [x] Motion coerente con `HorizonStory`: nessuna primitiva nuova, solo `TextLines`,
      `CameraIn`, `Reveal`, `MaskReveal`, `Parallax`, `DrawOnScroll`, `Atmosphere`
- [x] Il filo è `aria-hidden` e vive solo da `sm` in su: su mobile il canale non esiste
- [x] Reduced-motion e senza JS: 7 e 6 `h2` tutti visibili, 0 righe `.tl-line` traslate,
      testo completo (6.296 / 6.137 caratteri)

### Evidenza di verifica

- `npm run lint` → 0 errori · `npm run typecheck` → pulito
- `npm test` → **484 pass / 0 fail** + parser 81/81 · `npm run build` → OK
- `npm run test:e2e` → **143 passed, 11 skipped** · `npm run e2e:assistant` → **46 passed**
- Misure header (Playwright, 6 larghezze × 5 lingue): nessuna compressione — vedi sopra
- Screenshot headless `/lavora-con-noi` a 0.12 / 0.34 / 0.44 / 0.52 / 0.70 desktop 1440 e
  mobile 390: **nessun errore console, nessun overflow**. Verificati a occhio: il filo che
  si disegna scendendo fra i numeri, il respiro rosso fra i capitoli, la voce di nav attiva
  in rosso tenue, le testate che si scoprono riga per riga.

**Commit:** `5960c62`

---

## Tappa 4 — FAQ

**Skill scelte:** nessuna skill esterna. Le due candidate della lista (`schema-markup`,
`seo-schema`) coprono la generazione di JSON-LD da zero; qui il repo ha già il proprio
pattern collaudato — `jsonLdScript` con escape di `</script>` e U+2028/2029, e il precedente
FAQPage di `/lavora-con-noi`. Seguire quello vale più di una ricetta generica: annotato qui
per trasparenza, come chiede la regola 3 dello sprint.

### Collocazione scelta e motivazione

**Pagina dedicata `/domande-frequenti` + blocchi compatti in coda a `/vendi` e `/acquista`**
(opzione confermata dal cliente).

- **Perché una pagina.** Lo schema `FAQPage` deve avere UNA casa: dichiararlo su tre pagine
  per lo stesso contenuto significa dichiarare tre FAQ in conflitto, che le linee guida di
  Google trattano come markup ingannevole. E una pagina ha un indirizzo: si manda per
  WhatsApp, si linka da un post, si cita al telefono.
- **Perché anche i blocchi.** Chi ha appena letto come si vende non va a cercare una pagina
  di domande: la domanda ce l'ha *adesso*. I quattro blocchi mostrano lo **stesso identico
  testo** della pagina (un sottoinsieme di `faq.ts`) e rimandano lì. Nessun markup proprio.
- **Perché non in navbar.** La barra è appena arrivata a otto voci (tappa 3). La FAQ vive
  nel footer, nei due blocchi contestuali e nell'indice della pagina stessa.
- **Separazione delle competenze.** `/lavora-con-noi/faq.ts` (candidature) e la FAQ di
  `/open-domus` (dettaglio del format) restano intatte. La voce "Che cos'è un Open Domus?"
  qui è di **riepilogo** e rimanda a quella pagina: nessuna risposta duplicata.

### Sottotask

- [x] Domande ricavate leggendo `/vendi`, `/acquista`, `/open-domus`, `/metodo`,
      `app/lib/site.ts` e `PropertyDetail` — provenienza annotata in `faq.ts`
- [x] 14 domande in 3 gruppi (Vendere · Acquistare · Domus Tua), 5 lingue
- [x] `app/domande-frequenti/faq.ts` — fonte unica per pagina, blocchi e JSON-LD
- [x] `FaqList` estratto (ora ha tre call-site) e `FaqTeaser` per le pagine
- [x] Pagina `/domande-frequenti` con indice appiccicato, rimandi a Open Domus e Metodo,
      e la via d'uscita "Non hai trovato la risposta?"
- [x] Motion di casa: occhiello in `Reveal`, titoli in `TextLines`, elenchi in stagger
- [x] `FAQPage` + `BreadcrumbList` JSON-LD (solo aggiunta; metadata esistenti intatti)
- [x] Footer: la voce ridondante "Lavora con noi" (ora in `nav`) sostituita dalla FAQ
- [x] `sitemap.ts`: rotta aggiunta
- [x] 10 test unitari + 2 test e2e

### Criteri di accettazione

- [x] Ogni risposta tracciabile a contenuto già presente sul sito
- [x] Nessuna promessa indimostrabile: test che vieta 6 forme ("garantiamo la vendita",
      "vendiamo in N giorni", "senza rischi", "al 100%"…) e che pretende che la voce sui
      tempi dica esplicitamente «non lo promettiamo»
- [x] Parità i18n: stessi gruppi e stesse domande, stesso ordine, in tutte e 5 le lingue
- [x] `mainEntity` allineato al testo visibile — verificato in e2e sull'HTML servito
- [x] Un solo `FAQPage` per queste domande: e2e verifica che `/vendi` e `/acquista`
      non ne dichiarino uno
- [x] Accessibile: `<details>`/`<summary>` nativi, apribili da tastiera e senza JS

### Il test che ha trovato un difetto in sé stesso

La prima versione del controllo e2e leggeva le risposte con `allInnerTexts()` ed è fallita:
un `<details>` **chiuso** non ha testo *reso*. Il testo però è nel DOM ed è quello che
leggono i crawler — quindi il controllo giusto è `allTextContents()`. La correzione sta nel
test, non nella pagina: la pagina era già corretta.

### Evidenza di verifica

- `npm run lint` → 0 errori · `npm run typecheck` → pulito
- `npm test` → **494 pass / 0 fail** (10 test nuovi) + parser 81/81
- `npm run build` → OK, `/domande-frequenti` prerenderizzata statica
- `npm run test:e2e` → **149 passed, 11 skipped** (6 test nuovi: la pagina in `PAGES`,
  i due controlli sullo schema, la larghezza)
- Screenshot headless a 0.18 / 0.42 / 0.62 desktop 1440 e mobile 390, più il blocco in
  coda a `/vendi`: **nessun errore console, nessun overflow orizzontale**

**Commit:** `dc516f5`

---

## Tappa 5 — Contro-rotazione del logo

**Skill scelte:** nessuna. È un intervento di venti righe su un componente già scritto nel
vocabolario del sito: il valore sta nel non rompere il centraggio del monogramma, non in
una tecnica da imparare. Annotato per trasparenza.

### La trappola vera: il centraggio

Il monogramma era centrato con `-translate-x-1/2 -translate-y-1/2`. GSAP scrive `transform`
sull'elemento: al primo frame di rotazione si sarebbe portato via il centraggio e il logo
sarebbe schizzato in basso a destra. Il centraggio è quindi passato a **flexbox** su un
contenitore `inset-0` — nessun transform da difendere, `h-[52%]` continua a misurarsi
sull'altezza del badge, e senza JS il logo è al suo posto comunque.

### Sottotask

- [x] Sciolto il gruppo `data-rot-core`: due agganci distinti, `[data-rot-ring]` e
      `[data-rot-mark]`, perché ora girano in versi opposti
- [x] Centraggio del monogramma da transform a flexbox
- [x] Un solo angolo, due segni: `rotation` all'anello, `-rotation` al monogramma —
      così il verso opposto è invariante rispetto ad accelerazione e inversione
- [x] `spinMarkBadge()` estratto e usato da `Preloader` e `PageTransition`, che avevano
      ciascuno il proprio tween sul vecchio gruppo: il gesto del badge è uno solo
- [x] `spinRef` di `PageTransition` da `Tween` a `Timeline` (l'helper ne restituisce una)

### Criteri di accettazione — misurati, non a occhio

- [x] **Versi opposti:** in 1 s l'anello fa **+30,5°** e il monogramma **−30,5°**
- [x] **Velocità invariata:** 30°/s a riposo, come prima
- [x] **Invariante sotto scroll:** 12 campioni durante accelerazione e inversione,
      somma dei due angoli sempre ≈ 0 (`|ring + mark| < 1,5°`)
- [x] **Centraggio:** scarto del centro del monogramma dal centro del badge = `(0, 0)`
      in tutte le condizioni provate
- [x] **Reduced-motion e senza JS:** entrambi a 0,0° e fermi anche dopo 1,2 s
- [x] **Nessun mismatch di idratazione:** nessun errore di pagina né in console
- [x] Il logo non è ridisegnato né deformato: è lo stesso PNG depositato, ruotato

### Evidenza di verifica

- `npm run lint` → 0 errori · `npm run typecheck` → pulito
- `npm test` → **494 pass / 0 fail** + parser 81/81 · `npm run build` → OK
- `npm run test:e2e` → **149 passed, 11 skipped**
- `npm run e2e:assistant` → **46 passed**
- `npm run eval` → tutte le soglie ✅
- Misure di rotazione via `DOMMatrixReadOnly` su `getComputedStyle().transform`
  (vedi tabella sopra) e due screenshot del badge a 4× a 1,8 s di distanza: le tacche
  dell'anello e il monogramma sono chiaramente su angoli opposti.

**Commit:** `adfab7e`

---

## Rifinitura finale — revisione `/impeccable` e coerenza

Passata dopo le cinque tappe, su mandato «fixa e migliora tutto».

### 1. I puntini dell'assistente rimbalzavano

Il rilevatore ha segnalato `animate-bounce` sull'indicatore di scrittura. Non era un
falso positivo: il saltello verticale era **l'unico gesto del sito a muoversi a scatti**,
su una superficie che altrove si muove sempre per attenuazione.

Sostituito con `dt-typing` (`app/globals.css`): i tre punti **respirano** — opacità e
scala insieme, sfalsati di 0.15s. `ease-in-out` e non un'ease firma, perché il ciclo è
simmetrico e non finisce mai. Misurato: opacità 0.30 → 0.99, scala 0.70 → 0.99,
traslazione verticale **sempre 0**.

### 2. Un falso positivo, riconosciuto come tale

`broken-image` su `Preloader.tsx:397`: l'`<img>` vive dentro un `<picture>` e ha `src`
reale (`/media/raffaela-sagoma.png`, 791 KB, presente). Il rilevatore non risolve
l'attributo scritto su più righe. Registrata un'eccezione **stretta** — solo quella regola,
solo quel file — in `.impeccable/config.json`, con la motivazione. Dopo: **rilevatore
pulito su tutto `app/`**.

Nota di metodo: la prima correzione del punto 1 continuava a essere segnalata perché il
mio commento *citava* il nome della vecchia utility. Il rilevatore legge anche i commenti.
Riscritto il commento invece di silenziare la regola.

### 3. L'incoerenza che la tappa 4 aveva introdotto

Con la FAQ pubblicata, il sito rispondeva a domande che **l'assistente non sapeva**.
La tentazione era travasare le risposte nella knowledge base. Non si è fatto, e la ragione
conta più della decisione:

`knowledge/entries.ts` ha un **cancello di approvazione esplicito** («solo le voci
`verified` finiscono nelle risposte… un contenuto scritto da noi diventerebbe
indistinguibile da uno approvato») e `knowledge.test.ts` pretende ancora, per iscritto, un
«non lo so» su Domus D.O.C., Open Domus, vendita e valutazione — in attesa dei testi
ufficiali dell'agenzia. Le mie risposte sono derivate dal copy del sito, non approvate una
per una: promuoverle avrebbe scavalcato in silenzio una decisione presa da altri.

Aggiunta quindi **una sola** voce verificata, `faq-pagina`, che dice *dove* sono le risposte
senza recitarle — un fatto verificabile: la pagina esiste. Più:
- un test che impedisce alle sue keyword di allargarsi fino a intercettare i temi ancora
  chiusi (il cancello non deve poter essere aggirato per distrazione);
- la nota della voce `faq-generali` aggiornata con **cosa fare quando Raffaela approva**:
  una voce per ogni `FaqEntry` (gli id sono già stabili) e i casi da rivedere nel test.

### 4. L'indice della FAQ non diceva dove sei

Su una pagina lunga con un indice appiccicato, la voce corrente è informazione. Ora si
accende in rosso con il trattino dell'occhiello che cresce, e porta `aria-current` — chi
naviga a schermo letto ha lo stesso diritto di sapere dov'è. Attivo solo da `lg` (sotto,
l'indice scorre via) e **non** condizionato al motion: togliere un'etichetta a chi ha
reduced-motion sarebbe togliergli un'informazione, non un'animazione.

Verificato: scendendo, tutti e tre i gruppi si accendono a turno, nessun momento senza
voce attiva.

### Evidenza di verifica

- `node .agents/skills/impeccable/scripts/detect.mjs app` → **0 anti-pattern**
- `npm run lint` → 0 errori · `npm run typecheck` → pulito
- `npm test` → **495 pass / 0 fail** + parser 81/81 · `npm run build` → OK
- `npm run test:e2e` → **149 passed, 11 skipped** · `npm run e2e:assistant` → **46 passed**
- `npm run eval` → tutte le soglie ✅
- Misure headless: puntini (5 campioni), indice FAQ (16 profondità di scroll)

**Commit:** `600c49f`

---

## Prestazioni — il lag del corridoio e dei fiori

Segnalazione del cliente: «il sito lagga, l'animazione depth gallery è a scatti, lagga
anche quando vengono renderizzati i fiori e quando scorro all'indietro».

### La diagnosi, per misura e non per sospetto

Profilo CPU durante l'attraversamento del corridoio: **il 92% del tempo è fuori dal
JavaScript** (`(program)` = layout, paint, compositing). Le prime ipotesi — canvas troppo
pesante, otto copie del ritratto, filtro CSS, scie del nome — sono state provate una per
una **togliendole a runtime**: nessuna spostava l'ago. Non era il contenuto.

Poi la traccia di rete ha detto la cosa giusta:

```
+2.9s  image  13 kB  /_next/image?url=/images/reali/raffaela-specchio-sorriso.jpg
```

La foto del ritratto del corridoio veniva chiesta **a 2,9 secondi dal caricamento, cioè a
scroll già in corso**. Stesso schema per i fiori: `Fioritura` campiona la scritta pixel per
pixel e ne ricava migliaia di particelle **dentro il callback dell'IntersectionObserver**,
cioè nel frame esatto in cui la sezione entra in viewport.

**Non era una scena troppo pesante: era lavoro rimandato al frame sbagliato.** Ed è
esattamente la diagnosi del cliente («non viene caricato tutto nel preloader»).

### Cosa è stato fatto

1. **`app/lib/motion/warmup.ts`** — un registro di lavori da scaldare. Chi ha un costo di
   primo avvio lo dichiara; il preloader li esegue **mentre l'intro è ancora a schermo**,
   tempo che l'utente sta già aspettando. Con scadenza dura (2,2 s): su rete lenta si
   rinuncia e si entra comunque — un sito che si apre in ritardo è peggio di uno che
   singhiozza a metà pagina. Chi salta l'intro entra subito: il precarico prosegue da solo.
2. **`Fioritura`** campiona dietro il sipario. Marcatore osservabile `data-fiorita` +
   test e2e che tiene ferma la garanzia.
3. **Sprite memoizzati**: erano ridisegnati da ogni istanza (sei tralci in home + il
   corridoio). Sono immutabili: ora si fanno una volta e si condividono.
4. **Corridoio, foto**: `loading="eager"` invece di lazy (non `priority`, che ruberebbe
   banda all'LCP dell'hero). Le otto copie condividono la URL: resta una richiesta.
   Più `decode()` nel precarico, perché `eager` mette in rete ma non decodifica.
5. **Corridoio, `getBoundingClientRect()` a ogni frame** → sostituita da un booleano che
   ScrollTrigger aggiorna solo quando la scena entra o esce. Era una misura sincrona del
   layout sessanta volte al secondo per sapere una cosa già nota.
6. **Fondale a metà risoluzione** (`BG_SCALE = 0.5`). Contiene solo sfocature — due blob e
   fiori fuori fuoco: a risoluzione piena si rasterizzavano due gradienti su 1,3 milioni di
   pixel per frame, per un'immagine senza un solo bordo netto. L'area scende a un quarto.
7. **`photo-warm`** (un `filter` CSS) spostato dalle otto copie al contenitore: era una
   rasterizzazione filtrata per livello, otto volte la stessa foto.

### Misure — stesso metodo, prima e dopo

| | prima | dopo |
| --- | --- | --- |
| Frame nel corridoio (CPU ×4) | **49,9 ms** · 20 fps | **18,6 ms** · 54 fps |
| Home, scansione intera (CPU ×1) | 26,6 ms · 37,6 fps | **20,6 ms** · 48,5 fps |
| Layout forzati durante lo scroll | uno per frame | **0** |
| Foto del corridoio | a +2,9 s, durante lo scroll | nel caricamento iniziale |
| Immagini lazy su `/chi-siamo` | 15 | 7 |

### Limite dichiarato di queste misure

Il browser headless usa **SwiftShader** (rasterizzazione software, nessuna GPU): i valori
assoluti non rappresentano l'hardware reale. Valgono come **confronto prima/dopo a parità
di condizioni**, non come promessa di fps. Le prove hardware-indipendenti — layout forzati
azzerati, richiesta di rete anticipata, area di rasterizzazione a un quarto, campionamento
dei fiori anticipato — sono quelle su cui poggia davvero la correzione.

### Cosa resta fuori, di proposito

Tre immagini di contenuto (`raffaela-founder`, `raffaela-keys`, `team-group`) continuano ad
arrivare durante lo scroll. Sono dentro blocchi `Reveal`: un arrivo tardivo lì è una
dissolvenza, non uno scatto. Renderle tutte `eager` significherebbe 71 immagini in gara con
l'LCP dell'hero e violerebbe il vincolo di PRODUCT.md («una sola immagine priority per
pagina», LCP < 2,5 s mobile). Se il cliente preferisce comunque l'attesa totale in ingresso,
è una riga: si aggiunge un lavoro di precarico che le forza.

**Commit:** _(da compilare)_
