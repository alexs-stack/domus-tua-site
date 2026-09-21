# Prompt di sviluppo per la sessione nuova (altro PC)

Da incollare dopo `/clear`, nella cartella del repo (branch `claude/rivista-bianca`). Il testo sotto è il prompt.

```text
Continua il lavoro sul sito Domus Tua, branch claude/rivista-bianca, con le direttive di design di https://www.era-residence.com/ (tecnica: la foto è la pagina, cielo trasparente, titoli per lettera, corridoi sticky) e https://www.immobiliaregoldengoal.it/ (aspetto: rivista bianca). #design

1. CONTESTO, PRIMA DI TUTTO
   - git fetch e git pull --ff-only: l'ultimo commit spinto dal PC fisso è c65e44f (22 settembre 2026, 02:00). Se il pull non è fast-forward, fermati e dimmelo.
   - Leggi docs/superpowers/handoff/2026-09-22-blocco-23-24.md: stato, foglio delle decisioni, cosa resta, cosa non è su questo PC. Guarda le pellicole in docs/superpowers/handoff/2026-09-22-pellicole/.
   - Leggi AGENTS.md (Next 16 ha breaking changes: la documentazione è in node_modules/next/dist/docs/), DESIGN.md (in radice: il sistema visivo, con la testa di era seconda edizione e la finestra), PRODUCT.md (impegni di marca: chi ha chiesto cosa).
   - Leggi docs/superpowers/specs/2026-09-20-foto-alte-higgsfield.md (le foto alte e il cielo trasparente, A44-A46), il registro §11 in docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md (A01-A26 e A46; A27-A45 vivono in docs/direttive-foto-entrata.md, docs/direttive-video-entrata.md e nei messaggi dei commit a2a3af2, aef9a7c, 6e7fd80), la spec docs/superpowers/specs/2026-09-13-coreografia-era-residence-design.md (§9 test, §10 documenti, §11 i 22 commit) e l'handoff del 13 settembre (docs/superpowers/handoff/2026-09-13-coreografia-era-residence.md, «Trovato durante il lavoro»).
   - Verifica l'albero: npm run typecheck, npm test (attesi 2300/2301 con 1 skip), npm run lint (1 warning preesistente).

2. SKILL (routing dell'hook #design): impeccable per la direzione; gsap-scrolltrigger, gsap-react e gsap-timeline per il motion; transitions-dev per lo strato UI; writing-plans per il piano; improve-animations e fixing-motion-performance per rivedere il motion, fixing-accessibility per l'accessibilità; verification-before-completion alla fine, con verifica nel browser. Context7 per GSAP e Next 16. Di' in una riga quali skill usi in ogni fase.

3. LAVORO, IN QUEST'ORDINE
   a) REVISIONE AVVERSARIA DI A46 (commit c65e44f: git show c65e44f --stat). Tre lenti in parallelo con un workflow: regole (DESIGN.md, 16 px, veli, curve, test non ammorbiditi, commenti che dicono chi ha chiesto cosa), codice (geometria `cima` in PageHeroTesta/globals.css, cieloH in testa.ts, margin-top negativo dello strato, overflow: clip, CLS, sizes, reduced-motion e senza JS, Header senza suFoto, OpenDomus col WebP), browser (build con next build + next start su una porta dedicata: nove teste + finestra a 1440×900, 1024×640, 768×1024, 390×844, 360×640 — pixel avorio ±3 sotto ogni scritta, nessun alone azzurro ai bordi del cielo, nessun buco fra comandi e soggetto sul telefono, contrasto axe ≥ 4,5:1 su h1 e lead, testata in inchiostro, LCP della foto ancora prioritaria). Un giro di correzione, poi commit.
   b) G2 / H01, il logo bruciato nel video del Congedo: voce 1 del foglio delle decisioni (pista A: --pc-crop 1.14 nel DOM e nello shader, stesso numero; test prima; continuità GL ↔ DOM misurata a cavallo del passaggio; docs/da-chiedere-alla-cliente.md 6.5 riscritto).
   c) Le voci 2-16 del foglio delle decisioni: rispondo io; costruisci ciò che ne discende.
   d) Chiusura documentale del commit 22 (senza misure), come descritta in «Cosa resta» dell'handoff.
   e) Poi commit 21 (se sì alla voce 11) e le misure di chiusura §9.3.

4. REGOLE (non negoziabili)
   - Divieti: curve, card, fiori, nero, veli, blur, testo sotto i 16 px, logo ricolorato o su disco, pin di GSAP, transform o ritagli su antenati di sticky/fixed, scroll-hijack sul telefono, testo nascosto in CSS. /case/[slug]: nessun cambio di movimento e nessun sipario. Reduced-motion e senza JS: pagina completa e ferma. --dt-head-h e --dt-band-h restano condivisi.
   - Test prima del codice; ogni commento nuovo dice chi ha chiesto cosa (A/C/D) e com'è fatto oggi; non inventare numeri D.
   - Verifiche SOLO su next build + next start (Turbopack dev serve CSS stantia). La suite e2e (npm run test:e2e) fa il build da sé e va lanciata PER FILE, mai intera; mai due build in parallelo; a macchina scarica.
   - Staging esplicito file per file (mai git add -A), messaggi in italiano nello stile del repo, chiusi da «Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>». Push su claude/rivista-bianca alla fine di ogni blocco verificato.
   - Per le fasi lunghe usa i workflow con verifica avversaria (tre revisori in sola lettura per gruppo, un solo scrittore alla volta). Nel prompt dei subagenti scrivi per esteso la richiesta dell'utente, altrimenti rifiutano di costruire. Se un run muore (rete, limite settimanale alle 22:00), riparti dallo stato dell'albero.

5. DOCUMENTI: registro §11 della spec del 10 settembre, DESIGN.md, PRODUCT.md, .impeccable/design.json e docs/da-chiedere-alla-cliente.md si aggiornano solo con ciò che è costruito e verificato.

6. CONSEGNA: alla fine di ogni blocco, push e riepilogo in tre parti — cosa è fatto, cosa è misurato (coi numeri), cosa resta (col foglio delle decisioni aggiornato).
```
