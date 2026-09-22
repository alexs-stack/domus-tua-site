# Handoff: la coreografia di era-residence dentro la rivista bianca

2026-09-13 · branch `claude/rivista-bianca` · PR #79 aperta, non mergiata.

Il design è approvato da Alberto e nessun codice è scritto. Il prossimo passo è il piano (`writing-plans`) e poi la costruzione in commit piccoli. Il prompt da incollare nella sessione nuova è in `2026-09-13-prompt-sviluppo.md`, accanto a questo file.

## Cosa ha deciso Alberto il 13 settembre

Parole esatte (le opzioni che ha scelto). Nella spec stanno nel registro, §1.

| ID | Domanda | Risposta | Cosa vuol dire |
|---|---|---|---|
| A18 | budget di movimento | «Coreografia piena» | ogni capitolo della home con un comportamento suo legato allo scroll; entrate e uscite speculari; monogramma sempre visibile con cambio di tema sopra le foto; porta corta del preloader alle ricariche |
| A19 | corridoi sticky | «Sticky dove serve» | sei corridoi in home: i tre di oggi più il tuffo dell'hero, la finestra di Open Domus, la cartolina del Congedo |
| A20 | impianto | «Fedeltà letterale» | un gesto per capitolo senza doppioni; tuffo sticky sulle 11 PageHero; flip per lettera su tutti i titoli; porta corta su ogni rotta |
| A21 | monogramma | «Si stacca da 1024» | da 1024 px il cuore lascia la testata e resta nel margine a 4vw; sopra le foto virano solo le tacche dell'anello |
| A22 | flip | «Piatto come Era» | nessuna prospettiva; la firma dell'hero entra con la rotazione dell'accento |
| A23 | foto dell'hero | «Salita all'80%, chiedo l'originale» | la foto sale fino all'80 % e il segno chiaro resta fuori campo; scala 2 sotto risoluzione solo in corsa |
| A24 | villa in home | «Territorio col drone sul quartiere» | il territorio passa al fermo del drone sul quartiere; riga 1 di Services col fotogramma 4K della sala |
| A25 | Seguici | «Esce crescendo e sfumando» | il blocco del titolo cresce del 12 % e sfuma uscendo |
| A26 | /case/[slug] | «Nessun sipario» | niente film né porta corta sulle schede immobile |
| — | approvazione | «Approvato, scrivi la spec» | |

A18-A20 superano C03 della cliente («eliminare tante animazioni e transizioni»): vanno mostrate a lei (domande a voce 27 e 28, spec §12.2). Non si attribuiscono alla cliente e non si rimettono in discussione con Alberto.

## Dove sta tutto

- **Spec:** `docs/superpowers/specs/2026-09-13-coreografia-era-residence-design.md`. Registro §1, sistema §2, capitoli della home §3, corridoi §4, pagine interne §5, monogramma e preloader §6, media §7, esclusioni §8, test §9, documenti da aggiornare §10, ordine di lavoro in 22 commit §11, domande §12.
- **Allegati:** `docs/superpowers/specs/2026-09-13-coreografia-era-residence/`.
  - `design/lane-*.md`: il dettaglio di ogni corsia, con i poligoni esatti della finestra, i comandi ffmpeg, i `sizes`, la macchina a stati del preloader e la tabella «transitions refine». La spec ci rimanda per sezione.
  - `map/era-catalog.md`: il catalogo delle coreografie di era-residence, sezione per sezione, con le righe di `main.pretty.js`.
  - `map/index.md`, `map/critic.md`, `map/idea-*.md`: la mappatura del codice fatta PRIMA delle decisioni. I fatti di codice restano validi; i verdetti «needs-alberto» e le esclusioni per C03 sono superati da A18-A26.
  - `map/media-nuovi.md`: i media consegnati, con la mappa delle scene e una correzione in fondo.
  - `ease-dist.cjs`, `measure-home.mjs`, `measure-lcp.mjs`, `loader-ease.mjs`, `lin.js`: gli script delle misure citate nella spec (distanze fra le curve, altezze della home, LCP di base, linea di carica).
- **Memoria di progetto:** `domus-coreografia-era.md` (decisioni e media), `domus-redesign-rivista-bianca.md`, `domus-motion-architecture.md`, `domus-wow-layer.md` (trappole).
- **Dossier di era-residence:** `reverse-engineering/era-residence/` (gitignorato: esiste solo sul PC).

## I media non sono nel repo

- Sorgenti sul PC in `C:\Users\alber\Downloads\`:
  - `_DSC2014.jpg`, `_DSC2016.jpg`, `_DSC2022.jpg`, `_DSC2024.jpg`, `_DSC2025.jpg`: 5977×3985, Sony A7 III, EXIF `Artist: davide salerno`. `_DSC2014 (1).jpg` è lo stesso file di `_DSC2014.jpg`.
  - `Tradate Via Cima rossa.mov`: 4K, 25 fps, 2'25", 707 MB, logo Domus Tua bruciato in alto a sinistra. È il sorgente di `public/media/domus-hero.mp4` e di `public/media/hero-aerial.jpg`.
- Dal portatile vanno copiati prima, con gli stessi nomi.
- La catena è in spec §7 e in `design/lane-homeC.md` §8. Taglia per indice di fotogramma (`-ss` davanti a `-i` non è preciso su questo file) e parte da un mezzanino lossless. Le codifiche di prova della sessione di design non sono state tenute.
- Nel sito vanno nomi neutri, senza l'indirizzo della villa, e nessun metadato nei JPEG.

## Da sapere prima di toccare il codice

- **Prima di tutto** `git fetch` e confronto con `origin/claude/rivista-bianca`: Alberto spinge dal portatile.
- **Build.** Durante la progettazione un agente ha lanciato `next build`, quindi `.next` è quello del build. Nessun server è acceso.
- **Hook GateGuard.** La prima Write o Edit di un file chiede quattro fatti: chi lo usa, doppioni, dati, istruzione dell'utente alla lettera. Si rispondono e si ripete la stessa operazione.
- **Rilevatore di Impeccable.** Funziona attraverso la junction `.claude/skills/impeccable` → `.agents/skills/impeccable`, che Glob non segue. `settings.local.json` non si tocca.
- **CSS vecchia.** Turbopack dev serve `globals.css` con un'edizione di ritardo: misure e verifiche si fanno su `next build` + `next start`.
- **e2e del sito:** `npm run test:e2e` (`playwright.site.config.ts`, porta 3177). Gira con motion attivo, salvo `motion.spec`, `a11y.spec` e `mobile-motion.spec`, che lo forzano.
- **Staging esplicito per file,** mai `git add -A` mentre lavorano dei subagent.
- **Radice del repo.** C'è un `bash.exe.stackdump` non tracciato, un dump di Git Bash: non si committa.

## Trovato durante il lavoro, da dire

- **Foto dell'hero.** `public/media/hero-raffaela.jpg` porta la stellina di Gemini in basso a destra (x ≈ 93 %, y ≈ 86 %), e Raffaela sembra scontornata sulla stanza. Serve lo scatto originale (spec, domanda aperta 14 e punto 2.14 nuovo per la cliente).
- **Licenze e autorizzazioni.** Serve la licenza delle foto di Davide Salerno (punto 2.13 nuovo). Resta da avere l'autorizzazione del proprietario della villa (punti 2.2 e 6.2). Il video è di Domus Tua.
- **Altezza.** A 1440 la home passa da 29.692 a circa 34.845 px, cioè 5,7 schermi in più (spec §4): va detto alla cliente.
- **Direttive di agosto.** Tre direttive della cliente vivono nel codice ma mancano dal registro: C21 (3 agosto, niente video nell'hero), C22 (4 agosto, replay nei due versi), C23 (26 agosto, logo grigio e rosso). La spec le registra.
- **Tooltip dei social su /case/[slug].** Dal commit 4 la regola `:root:has([data-motion-freeze]) :is(.t-panel-slide, .t-dropdown, .dt-social__tip) { transition: none !important; }` di spec §5.4 (A26 «Nessun sipario», D32) toglie la dissolvenza del tooltip dei social nel footer della scheda immobile; altrove il tooltip tiene `translate 0.3s ease, opacity 0.25s ease` (`globals.css`, `.dt-social__tip`). È l'unico movimento che il commit 4 cambia su quella pagina e lo vuole la spec («chrome dell'interfaccia fermo di default»). Da dire ad Alberto: se il tooltip deve sfumare anche lì, si toglie `.dt-social__tip` dalla lista e si allineano `case-guard.test.ts` («globals.css tiene il blocco congelato») e `pages.spec.ts` («la scheda immobile resta ferma sotto MotionFreeze»).
- **D.O.C. rigato (D26), da far vedere ad Alberto.** Righe e spina restano disegnate anche a pagina ferma, su `/`, `/vendi`, `/metodo` e `/acquista`. Pellicole a metà ingresso e a gesto finito, a 1440 e 390: `docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/14-doc-*.png` (commit 14).
- **Alt della sala di Services (D27), in attesa della cliente.** La riga 1 di Services dice «Soggiorno con tavolo, sedie gialle, lampada ad arco e libreria»; l'home staging torna nell'alt solo se la cliente conferma l'allestimento (spec §7.5).
- **Stessa foto due volte su /servizi.** `ServiziContent.tsx:210` rende `home_staging_01_sala_reale_sedie_gialle.jpg`, che è anche la riga 1 di Services: sulla stessa pagina lo stesso file esce due volte, e la stessa sala si vede sia su `/` sia su `/servizi`. Spec §7.4 conta due apparizioni della villa su /servizi (banda e sala). Il fotogramma della sala del video tour, che avrebbe cambiato la riga 1, è escluso per R2 (targa a muro con una frase leggibile) e non è stato prodotto: serve un'altra foto, oppure cambia la riga di `ServiziContent`. Da decidere con Alberto (D60). Sulla stessa pagina, dopo il commit 18, il tuffo della testata e lo zoom di Services sono due scale di verso opposto in fila (spec §5.3): vanno dichiarate in `DESIGN.md` con i documenti di spec §10 (commit 22).
- **Sigillo D.O.C. circolare (C01), commit fuori dal piano, decide Alberto.** `DomusDocProtocol.tsx` disegna un `<circle r="46">`, e `LazyYouTubeEmbed.tsx:86-87` dice che il play è «l'unica curva ammessa». Spec §3.11 chiede il confronto con C01 «in un commit a parte»: quel commit non sta nel piano 2026-09-13 (spec §11 elenca 22 commit e non lo contiene) e nessuno dei 22 lo tocca. Decide Alberto se e quando aprirlo; se sigillo o play cambiano forma, la modifica va mostrata alla cliente, perché C01 è sua. Il commit 14 non lo tocca; il riepilogo di chiusura del commit 22 («Cosa resta», Step 22.18) deve riprendere questa voce dall'handoff, così il piano dice dove finisce quel lavoro.
- **Video d'ambiente: sorgente scritta al warm, prima del primo play (commit 15), da confermare ad Alberto.** Spec §2.7 dice due cose che non stanno insieme: `sources` «scritte al primo play», e IO `warm` → `preload="auto"`. Con la sorgente scritta al play il precarico non avrebbe nulla da caricare. `useAmbientVideo` scrive quindi `src` la prima volta che l'host entra nel margine `warm` (50 %), con la stessa regola dei 1.408 px resi; il play resta solo in vista. Lo fissa il test «la sorgente si scrive al warm, prima del primo play» di `e2e/ambient-video.spec.ts`. Domanda per Alberto: sorgente al warm, o la lettera di §2.7? Con un sì il commit 22 riscrive §2.7 («scritte al primo play» → «scritte al warm»); con un no la scelta passa nel ramo `inView` di `useAmbientVideo`, il precarico sparisce e quel test si riscrive sul primo play.

## Prossimi passi

1. `writing-plans` sulla spec → `docs/superpowers/plans/2026-09-13-coreografia-era-residence.md`, nell'ordine di spec §11.
2. Costruzione passo per passo (`subagent-driven-development` o `executing-plans`). Ogni commit passa `tsc`, lint, `npm test` e la parte di e2e che tocca, sul build.
3. Chiusura:
   - axe con motion attivo;
   - traboccamento in de e fr;
   - misure di spec §9.3;
   - documenti di spec §10;
   - domande 27 e 28 in `docs/da-chiedere-alla-cliente.md`;
   - `verification-before-completion` con verifica nel browser.
