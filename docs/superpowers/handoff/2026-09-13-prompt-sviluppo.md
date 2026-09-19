# Prompt di sviluppo per la sessione nuova

Da incollare dopo `/clear`, nella cartella `C:\Users\alber\domus-tua-site`. Il testo sotto è il prompt.

```text
Continua il lavoro «la coreografia di era-residence dentro la rivista bianca» sul sito Domus Tua, branch claude/rivista-bianca. Il design è approvato da Alberto (13 settembre 2026) e nessun codice è ancora scritto. #design

1. CONTESTO, PRIMA DI TUTTO
   - git fetch e confronto con origin/claude/rivista-bianca: Alberto spinge dal portatile.
   - Leggi docs/superpowers/handoff/2026-09-13-coreografia-era-residence.md.
   - Leggi per intero la spec docs/superpowers/specs/2026-09-13-coreografia-era-residence-design.md. Apri gli allegati in docs/superpowers/specs/2026-09-13-coreografia-era-residence/ quando una sezione ci rimanda (design/lane-*.md, map/era-catalog.md).
   - Leggi AGENTS.md: Next 16 ha breaking changes, la documentazione è in node_modules/next/dist/docs/.
   - Leggi DESIGN.md, PRODUCT.md e la memoria di progetto domus-coreografia-era.md.

2. SKILL (routing dell'hook #design)
   - impeccable per la direzione.
   - gsap-scrolltrigger, gsap-react e gsap-timeline per la tecnica.
   - transitions-dev per lo strato UI, senza blur.
   - writing-plans per il piano; subagent-driven-development o executing-plans per costruire.
   - improve-animations e fixing-motion-performance per rivedere il motion, fixing-accessibility per l'accessibilità.
   - verification-before-completion alla fine, con verifica nel browser.
   - Context7 per GSAP (SplitText, ScrollTrigger, CustomEase) e per Next 16.
   Di' in una riga quali skill usi in ogni fase.

3. PRIMO COMPITO: IL PIANO
   - Controlla che esistano i media sorgente: C:\Users\alber\Downloads\_DSC2014.jpg, _DSC2016.jpg, _DSC2022.jpg, _DSC2024.jpg, _DSC2025.jpg e «Tradate Via Cima rossa.mov». Se mancano, metti in coda i passi dei media e dimmelo.
   - Scrivi il piano con writing-plans in docs/superpowers/plans/2026-09-13-coreografia-era-residence.md, seguendo l'ordine di lavoro della spec §11 (22 commit).
   - Per ogni passo: file toccati, test da scrivere prima, comandi di verifica, criterio di fine.
   - Mostrami il piano prima di costruire.

4. POI COSTRUISCI, PASSO PER PASSO
   - Le decisioni A18-A26 sono di Alberto e non si rimettono in discussione. Le vede la cliente dopo (domande 27 e 28 della spec §12.2).
   - Restano vietati: curve, card, fiori, nero, veli, blur, testo sotto i 16 px, logo ricolorato o su disco, pin di GSAP, transform o ritagli su antenati di sticky e fixed, scroll-hijack sul telefono, testo nascosto in CSS.
   - /case/[slug]: nessun cambio di movimento e nessun sipario (MotionFreeze e case-guard.test.ts).
   - Reduced-motion e senza JS: la pagina è completa e ferma.
   - Il patto della porta non si rompe: --dt-head-h e --dt-band-h restano condivisi e intro-clocks.test.ts li presidia.
   - Ogni commit passa tsc, lint, npm test e la parte di e2e che tocca, su next build + next start: Turbopack dev serve la CSS con un'edizione di ritardo.
   - Staging esplicito per file. Messaggio di commit in italiano, con la riga Co-Authored-By.
   - Ogni commento nuovo nel codice dice chi ha chiesto cosa (A18-A26 di Alberto, oppure la D della decisione di lavoro) e com'è fatto oggi.
   - Misura, non indovinare: Playwright headless con motion attivo per ogni gesto, alle larghezze della spec.
   - Per le fasi lunghe (migrazione dei titoli, capitoli, pagine interne) usa i workflow con verifica avversaria.

5. DOCUMENTI
   Aggiorna il registro §11 della spec del 10 settembre, DESIGN.md, PRODUCT.md e .impeccable/design.json come dice la spec §10, e solo con ciò che è costruito e verificato.

6. CONSEGNA
   Pusha su claude/rivista-bianca alla fine di ogni blocco di commit verificati. Scrivimi un riepilogo in tre parti: cosa è fatto, cosa è misurato (con i numeri), cosa resta.
```
