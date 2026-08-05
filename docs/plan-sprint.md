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

**Commit:** _(da compilare)_

---

## Tappa 3 — Navbar "Lavora con noi" + motion della pagina

**Skill scelte:** _(da compilare)_

### Sottotask

- [ ] `nav` in `app/lib/site.ts` + chiave `lavora` nei dizionari (5 lingue)
- [ ] Header desktop: verificare che 8 voci non rompano la pill a 1024–1280px
- [ ] Menu mobile: voce presente e animata con la coreografia esistente
- [ ] Studiare `HorizonStory.tsx` come grammatica di riferimento
- [ ] Portare `/lavora-con-noi` allo standard: ingresso, scroll, transizioni
- [ ] Verifica motion con Playwright headless (screenshot a 3 profondità di scroll)

### Criteri di accettazione

- Nessun overflow orizzontale della pill header a nessun breakpoint
- Voce attiva evidenziata correttamente (`aria-current`)
- Motion coerente con `HorizonStory`, primitive esistenti riusate
- Reduced-motion: pagina completa e statica

### Evidenza di verifica

_(da compilare)_

**Commit:** _(da compilare)_

---

## Tappa 4 — FAQ

**Skill scelte:** _(da compilare)_

### Collocazione scelta e motivazione

_(da compilare — decisione argomentata)_

### Sottotask

- [ ] Raccogliere le domande vere dalle pagine esistenti (`/vendi`, `/acquista`,
      `/metodo`, `/open-domus`, `/contatti`) — nessuna affermazione commerciale inventata
- [ ] Contenuti in italiano, poi en/fr/de/es
- [ ] Componente FAQ nel linguaggio visivo Domus Tua
- [ ] Motion di casa (Reveal/TextLines, ease `domus`)
- [ ] JSON-LD `FAQPage` (aggiunta, non modifica dei metadata esistenti)
- [ ] `/lavora-con-noi/faq.ts` resta separato e intatto

### Criteri di accettazione

- Ogni risposta tracciabile a contenuto già presente sul sito
- Schema `FAQPage` valido, `mainEntity` allineato al testo visibile
- Accessibile: `<details>`/ARIA corretti, tastiera, focus visibile
- Reduced-motion: tutte le risposte raggiungibili e leggibili

### Evidenza di verifica

_(da compilare)_

**Commit:** _(da compilare)_

---

## Tappa 5 — Contro-rotazione del logo

**Skill scelte:** _(da compilare)_

### Sottotask

- [ ] Isolare monogramma e anello in `RotatingMark.tsx` (oggi ruotano insieme come
      gruppo `data-rot-core`)
- [ ] Applicare rotazione opposta al monogramma, stesse velocità
- [ ] Coerenza nel sipario di `PageTransition` (usa `MarkBadge`)
- [ ] Reduced-motion e stati hover invariati

### Criteri di accettazione

- Anello e monogramma girano in direzioni opposte, sempre
- Velocità a riposo 30°/s e modulazione da scroll Lenis invariate
- Con reduced-motion: entrambi fermi
- Nessun mismatch di idratazione

### Evidenza di verifica

_(da compilare)_

**Commit:** _(da compilare)_
