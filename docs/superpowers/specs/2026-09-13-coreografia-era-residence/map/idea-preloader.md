# preloader
## currentState
IN BREVE: la linea di carica usa già la curva di Era, e oggi alla seconda visita della sessione il sipario non c'è.

COM'È FATTA. La shell dell'intro è markup reso dal server, nel layout radice, subito dopo il boot script (layout.tsx:242, 254; PreloaderShell.tsx:98-237). Il film è tutto @keyframes CSS, che partono al primo paint sotto `html[data-preloader]` (globals.css:794-1150). Preloader.tsx rende null. Legge l'orologio CSS (`timeline.currentTime − startTime`, Preloader.tsx:143-170), mette i timer di handoff e di chiusura, gestisce skip e chiusure, e guida con GSAP solo in ripiego, sui browser senza @property (Preloader.tsx:445-449, 577-704).

TIMELINE, con TEMPO = 1 (intro-constants.ts:74-108). Secondi dal primo paint.
- Badge: compare in dissolvenza a 0,10 s in 0,8 s (globals.css:870-872) e gira in senso orario, 6 s a giro, senza fine (891-898).
- Sagoma: 0,15 s, 0,9 s, lineare (867-869).
- Lettere del titolo: 0,12 + i×0,075, 1,3 s. rotateY 90°→0 e translateY 50%→0 con perspective 800px, cubic-bezier(0.25, 1, 0.5, 1) = dtOut (873-875, 907-916).
- Firma: 0,60 + i×0,065, 1,3 s, rotateX 90° + translateX 6vw (876-879).
- Caps: 0,40 + i×0,11, 0,85 s (880-882).
- Payoff: 0,65 + i×0,14, 1,25 s (883-885). act1End 2,70.
- Atto II: la scatola della linea si accende a 0,55 in 0,25 s (1088-1090); la barra corre da 0,60 a 2,15 (1091-1111).
- Atto III: porta 2,25→3,35 con cubic-bezier(0.66, 0, 0.22, 1) = domus.inOut, `--arch-y` 104vh→15vh, `--arch-w` 24→36vw (1072-1077, 991-1002, 1261-1267). Congedo del lockup 2,35→2,90, −28px (1114-1116).
- Atto IV: tuffo 3,13→4,63 con cubic-bezier(0.6, 0, 0, 1) = dtDiveIn, da `--arch-k` 0,972 fino a −100vh e 125vw (1003-1014).
- Sotto i 768px: arco 40→58→165vw, riposo 16vh, congedo −20px, stessi tempi (1313-1330).
- Handoff INTRO_EVENT a 3,13, all'animationstart del tuffo con un timer di rete (Preloader.tsx:497-551). Fine a 4,63, all'animationend con un timer di rete (512-522, 546-549).
- Autohide 4,73 (globals.css:1069-1077). Failsafe 5,23 (intro-constants.ts:129). Rete delle lettere dell'hero 3,33 (intro-constants.ts:139; globals.css:1172-1184).
- Senza mask-composite: sipario clip-path 2,60→3,50 (1118-1122).
- Precarico dietro il sipario: su desktop tutte le immagini entro 4,5 s di film, sul telefono il primo schermo entro 3 s (Preloader.tsx:398-405).

EASE DELLA LINEA. Non è lineare, ed è già quella di Era. La CustomEase `dtLoader` (gsap.ts:79-81) è, carattere per carattere, la stringa di `loaderEase` (main.pretty.js:24). La CSS la porta come `linear()` a 17 punti presi ogni 1/16 (globals.css:1093-1111). Per i browser senza `linear()` resta `cubic-bezier(0.2, 0.45, 0, 0.25)` (1092). Il ramo GSAP usa la CustomEase vera (Preloader.tsx:620-625). Il test vuole da 12 a 20 punti (intro-clocks.test.ts:197-212).

Ho campionato il path per controllare i punti. Sono esatti entro ±0,0012. L'errore massimo della spezzata però è 0,0087, a x=0,533: sono 0,56px su una linea da 64px. Il ripiego cubic-bezier sbaglia al massimo di 0,062.

QUANDO SUONA. Il boot script inline decide prima del paint: `pre = !deep && m && !sessionStorage.getItem("dt-intro-seen")` (layout.tsx:102; INTRO_KEY in intro-constants.ts:21). La chiave si scrive in quattro casi:
- a intro vista o saltata, in `finish(true)` (Preloader.tsx:263-272);
- dal failsafe `fine`, se il JS non arriva (layout.tsx:102);
- subito, se l'URL ha un'ancora (layout.tsx:102);
- alla chiusura per scheda nascosta, anche se la scheda è nascosta già al mount (Preloader.tsx:745-762, 775). Chi apre la home in background consuma l'intro senza vederla.

Negli abort di StrictMode e HMR non si scrive (Preloader.tsx:255-257, 777-803). Non c'è nessun controllo sulla rotta: il film intero suona sulla prima rotta caricata nella sessione. Il patto sagoma/foto però è scritto e testato solo contro la banda di HeroCinematic (intro-clocks.test.ts:405-436).

RELOAD O SECONDA VISITA NELLA SESSIONE. Del sipario non resta niente. Non c'è l'attributo, quindi `.dt-preloader{display:none}` (globals.css:794-802). Nessuna keyframe parte. La sagoma lazy non si scarica e i preload non vengono aggiunti (PreloaderShell.tsx:125-133; layout.tsx:84-92). L'e2e lo pretende (mobile-motion.spec.ts:1027-1093; home.spec.ts:40-49).

Un ingresso però c'è a ogni caricamento. Le lettere dell'hero, tenute a opacity 0,02 da `data-hero-intro` (globals.css:1178-1181), rientrano 150ms dopo l'idratazione (HeroCinematic.tsx:208-214, 334-337), con la rete CSS a 6 s (HERO_REST_WARM_MS, intro-constants.ts:150).

Un reload durante l'intro rifà il film intero, perché la chiave non c'è ancora. Le navigazioni client di Next non rieseguono il boot script. Una versione corta per le visite successive non è mai esistita: 42 commit nominano il preloader e nessun messaggio né identificatore la cita. L'unico montaggio corto della storia era quello del telefono, 1,7 s, tolto il 2026-08-17 (layout.tsx:22-25).

SKIP. Il primo tocco o tasto lo serve il boot script finché t < 3,13 s: pointerdown o keydown in cattura, cioè Invio, spazio, Esc o un carattere, senza modificatori. Lo script scrive `--pre-skip` e `data-pre-skip` e riarma il failsafe a SKIP_TAIL_MS = 1850ms (layout.tsx:93-102). La CSS manda porta, linea e congedo alla fine con delay negativi, fa partire il tuffo da `--pre-skip` e sposta l'autohide a +1,6 s (globals.css:1124-1150). Preloader.tsx prende atto di uno skip già avvenuto e si riallinea (492-522), poi comanda lui (566-576, 706-738, con la guardia prima di preventDefault). Lo skip taglia il preambolo, non la porta: il tuffo suona intero, 1,5 s, e non aspetta il precarico (710-720). In e2e, dal tocco all'handoff al massimo 1700ms (mobile-motion.spec.ts:885-920).

REDUCED MOTION. Il boot script non mette mai l'attributo né `data-hero-*` (layout.tsx:102, condizione `m`). Se la preferenza cambia fra paint e idratazione chiude subito (Preloader.tsx:290-297); se cambia a film in corso chiude senza tuffo (750-753). E2e: mobile-motion.spec.ts:1142-1168.

ANCORE. Con `location.hash` l'intro non parte e la chiave si segna spesa prima del paint (layout.tsx:76-83, 102). Preloader.tsx:299-310 ripete la guardia.

SCROLL. `html[data-preloader]{overflow:hidden}` (globals.css:803-805). Lenis fermo e `scrollTo(0,0)` (Preloader.tsx:322-325), `lagSmoothing(500, 33)` per la durata dell'intro (332). SmoothScroll si rilascia da solo quando cade l'attributo (SmoothScroll.tsx:92-104).

DOCUMENTI. PRODUCT.md:138-141 dice «una volta per sessione, mai con reduced-motion». DESIGN.md:345 dice che il pannello «sparisce dopo 4,63 s e non torna nella sessione», e DESIGN.md:545 spiega quando suona. Registro: C05 (spec:369), A02 (391), A07 (396), A16 (405), domanda aperta 5 (453-454).
## eraExact
Fonti: js/main.pretty.js:1-148 e 2855-2863; README.md §4.1-4.4 (righe 125-213); css/inline/03-root-durations-eases.css; css/inline/01-flicker-preloader-display.css.

TOKEN. breakPoint 992, durS 0,4, durM 0,8, durL 1,2 (main.pretty.js:2855-2860). Ease (main.pretty.js:2863): InOut "0.75,0,0.25,1", Out "0.25,1,0.5,1", In "0.5,0,0.75,0", Ease "0.25,0.1,0.25,1", Write "0.333,0,0.667,1", diveIn "0.6,0,0,1", horScroll "0.25,0,0.75,1". Nel CSS lo stesso InOut è cubic-bezier(0.76, 0, 0.24, 1) (03-root-durations-eases.css:7).

QUANDO SUONA. initPreloader legge `sessionStorage.hasVisited`. Se c'è chiama `animatePreloaederShort()`, altrimenti `animatePreloaederIntro()`, e scrive hasVisited="true" subito, all'avvio del film e non alla fine (main.pretty.js:1-10). Nelle righe 1-148 non ci sono listener di skip né controlli di reduced-motion. C'è `lockScroll()` con `scrollToTop` a 100ms (28, 98). Il pannello anti-flash `[data-master-preloader]` si rimuove all'avvio della timeline (85, 147; 01-flicker-preloader-display.css:6-9).

loaderEase (main.pretty.js:24), path completo: "M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1".
- Cinque segmenti cubici, con ancoraggi (0,238; 0,442), (0,396; 0,54), (0,522; 0,584), (0,714; 0,826), (1; 1).
- Slancio: al 23,8% del tempo la linea è al 44,2%.
- Esitazione: fra il 39,6% e il 52,2% del tempo guadagna solo 4,4 punti.
- Secondo slancio: 82,6% al 71,4% del tempo. Poi l'assestamento.
- In Era la barra dura 4 s, quindi l'esitazione tiene 0,50 s.
- Campionata sugli ancoraggi più i punti di errore massimo, in 17 punti: linear(0 0%, 0.154 6.5%, 0.283 12.9%, 0.378 18.6%, 0.414 21.2%, 0.442 23.8%, 0.482 28.2%, 0.504 31.3%, 0.54 39.6%, 0.584 52.2%, 0.595 53.9%, 0.615 55.8%, 0.75 65%, 0.826 71.4%, 0.866 76%, 0.91 82.6%, 1 100%). Errore massimo 0,0032, medio 0,00137.

INTRO (main.pretty.js:12-86), in secondi:
- 0: `--arch-w` 24vw (≥ 992) o 40vw, `--arch-y` 104vh; hero img a scale 0,75 o 1,15, origine center top (25-31).
- 0: reveal dei testi con animateTextA/H/P, animateCtn a durS, animateLine (36).
- 0→1,2: pausa (37-39).
- 1,2→2,4: fondo SVG 0→0,05 e decor 0→1, ease Out (39-50).
- 2,4→6,4: barra yPercent −100→0 in 4 s, loaderEase (51-56).
- 6,4→7,9: arco a 36vw (50vw sul telefono) e 15vh, 1,5 s, InOut (57-64).
- 7,75→10,15: tuffo a `--arch-w` "125" (senza unità nel sorgente) e −100vh, 2,4 s, diveIn, posizione "<90%" (65-69).
- 7,75→9,25: hero img a scale 1, InOut (70-77).
- initPageTransitions a "<25%" (78-80).
- 10,15: unlockScroll e display:none (81-84).
- Totale 10,15 s.

CORTA (main.pretty.js:88-148). Stesse geometrie.
- `.preloader_ctn` a display:none (105-107): via logo, testi, barra e payoff (README.md:133).
- 0→1,2: fondo e decor in dissolvenza (107-118).
- 0→1,5: arco, InOut, posizione "<" (119-126).
- 1,35→3,75: tuffo, diveIn, "<90%" (127-131).
- 1,35→2,85: hero a scale 1 (132-139).
- 3,75: unlockScroll (142-146).
- Salta i reveal dei testi, la pausa da 1,2 s e la barra da 4 s. Totale 3,75 s, il 37% dell'intro (README.md:136, 204).

DIFFERENZE CON DOMUS.
- Identici: dtLoader = loaderEase (gsap.ts:79-81), dtDiveIn = diveIn (gsap.ts:72), dtOut = Out (gsap.ts:73).
- La porta usa domus.inOut 0.66,0,0.22,1 (gsap.ts:67) invece di InOut 0.75,0,0.25,1.
- Il tuffo parte all'80% di una porta da 1,1 s (`--arch-k` 0,972; globals.css:980-990, 1267) invece che al 90% di una porta da 1,5 s.
- La foto dell'hero non scala, per il patto della porta (Preloader.tsx:10-11).
- Durata: Era 10,15 s, Domus 4,63 s (intro-constants.ts:62-63).

La porta con l'InOut di Era non la propongo: cambierebbe `--arch-k` e l'asserzione di intro-clocks.test.ts:187, per un guadagno che non si vede.
### 7a-linear-ginocchia — Linea di carica: la stessa curva di Era, campionata sui punti d'angolo invece che a passo fisso [adopt-with-conditions]
kind=refine-existing sticky=False files=app/globals.css dir=A15/A17 (era-residence come riferimento di tecnica, dossier §4),C05/A02 (durata invariata, 4,63 s)
ADATTAMENTO: RIFINISCE un gesto che esiste già. Nessuna sezione sticky, nessun pin.

LO STATO. La curva è già quella di Era: `dtLoader` (gsap.ts:79-81) è la stringa di `loaderEase` (main.pretty.js:24). La CSS la porta come linear() a 17 punti presi ogni 1/16 (globals.css:1093-1111). I punti sono esatti, ma il passo fisso taglia i quattro angoli della curva: errore massimo 0,0087 a x=0,533, subito dopo la fine dell'esitazione (0,522).

LA MODIFICA. Nella regola `html[data-preloader]:not([data-pre-gsap]) .dt-preloader [data-pre-track]` si sostituisce solo la longhand `animation-timing-function` con 17 punti. Dentro ci sono i cinque ancoraggi del path (23,8% / 39,6% / 52,2% / 71,4% / 100%) più i punti di errore massimo:
`linear(0 0%, 0.154 6.5%, 0.283 12.9%, 0.378 18.6%, 0.414 21.2%, 0.442 23.8%, 0.482 28.2%, 0.504 31.3%, 0.54 39.6%, 0.584 52.2%, 0.595 53.9%, 0.615 55.8%, 0.75 65%, 0.826 71.4%, 0.866 76%, 0.91 82.6%, 1 100%)`
Errore massimo 0,0032 (−63%), medio 0,00137 (oggi 0,00168).

COSA SI VEDE, a 1,55 s partendo da 0,60 s: slancio fino a 0,97 s (44% della linea), esitazione fra 1,21 e 1,41 s (dal 54% al 58%), secondo slancio fino a 1,71 s (83%), assestamento fino a 2,15 s.

COSA NON CAMBIA:
- `animation: dt-pre-track 1.55s cubic-bezier(0.2, 0.45, 0, 0.25) 0.6s both`, cioè il ripiego per Safari < 17.2 e Firefox < 112;
- INTRO_T.track e trackDur (intro-constants.ts:94-95);
- il delay dello skip, -1.55s (globals.css:1140-1142);
- INTRO_MS 4630;
- il ramo GSAP, che usa già la CustomEase (Preloader.tsx:620-625);
- la linea del telefono, 2px e min(64px, 10svh) (globals.css:1336-1339).
Il commento di globals.css:1078-1087 passa da «ogni 1/16» a «ancoraggi del path più i punti di errore massimo».

IL GUADAGNO. Sulla linea desktop da 64px lo scarto scende da 0,56px a 0,2px: è fedeltà al riferimento, non una differenza visibile. Quello che davvero separa la nostra linea da quella di Era è la durata. A 4 s l'esitazione dura 0,50 s, a 1,55 s ne dura 0,195. Allungare la barra a 1,75 s, fino a 2,35 insieme al congedo, porterebbe l'esitazione a 0,22 s: 25ms in più, che non valgono un numero nuovo. Tornare a 4 s vuol dire toccare TEMPO: lo escludo più sotto.

REDUCED MOTION: invariato, la linea non esiste.
RISCHI: Il guadagno sta sotto il pixel: se il criterio è «si vede?», non vale la pena. / La regex di intro-clocks.test.ts:206 cerca in modo lazy la prima occorrenza di «1 100%»: nessun punto intermedio deve finire così (i 17 proposti non lo fanno). / Turbopack serve la CSS con un'edizione di ritardo (memoria di progetto): per vedere il cambio bisogna toccare globals.css due volte e ricaricare. / Il ripiego cubic-bezier resta a errore massimo 0,062 sui browser senza linear(): invariato, e accettato.
TEST: app/lib/__tests__/intro-clocks.test.ts, «atto II: linea di carica … linear() campionata da dtLoader»: 17 punti, dentro il campo 12-20, resta verde senza modifiche / e2e/mobile-motion.spec.ts:661, presenza dell'animazione dt-pre-track: invariato
VERDETTO: Ho rifatto il campionamento con uno script. La curva dtLoader (gsap.ts:79-81) è identica, carattere per carattere, a loaderEase (main.pretty.js:24). La linear() di oggi (globals.css:1093-1111) ha i punti esatti entro 0,0012; l'errore massimo è 0,0087 a x=0,533, il medio 0,00168. I 17 punti proposti portano l'errore massimo a 0,0032 (a x=0,159) e il medio a 0,00137. Il ripiego cubic-bezier resta a 0,062.
Sono confermati tutti i numeri della proposta, anche i tempi che si vedono: slancio fino a 0,97 s, esitazione fra 1,21 e 1,41 s, secondo slancio fino a 1,71 s.
Cambia solo la longhand animation-timing-function. Restano come sono durata, delay, skip (globals.css:1140-1142), ramo GSAP (Preloader.tsx:620-625) e test. intro-clocks.test.ts:206-209 conta i punti: 17, dentro il campo 12-20. L'e2e (mobile-motion.spec.ts:659-672) controlla solo il nome dell'animazione e che la trasformata cambi.
Nessuna direttiva toccata, nessun gesto né sticky nuovo, reduced-motion invariato. Il guadagno però sta sotto il pixel: sulla linea da 64px lo scarto passa da 0,56px a 0,2px. È fedeltà al riferimento, non una differenza visibile.
CONDIZIONI: Aggiornare il commento di globals.css:1078-1087: «ogni 1/16» diventa «ancoraggi del path più i punti di errore massimo», con errore massimo e medio. / Tenere la shorthand con cubic-bezier(0.2, 0.45, 0, 0.25) di globals.css:1092 come ripiego per i browser senza linear(). / Far girare intro-clocks.test.ts e l'e2e dell'atto II. In dev toccare globals.css due volte prima di guardare (trappola di Turbopack registrata in memoria). / Presentarla come fedeltà a Era, non come miglioramento visibile. Ha priorità bassa.
EVIDENZE: app/lib/motion/gsap.ts:79-81 e reverse-engineering/era-residence/js/main.pretty.js:24: stessa stringa del path / app/globals.css:1091-1112: shorthand con la bezier di ripiego e linear() a 17 punti presi ogni 1/16 / script di verifica: oggi errore massimo 0,0087 a 0,533 e medio 0,00168; proposta 0,0032 e 0,00137; errore massimo sui punti 0,0005; ripiego bezier 0,0622 / app/lib/__tests__/intro-clocks.test.ts:206-209: la regex conta i punti fra «0 0%» e «1 100%)», campo 12-20 / e2e/mobile-motion.spec.ts:659-672: l'atto II controlla il nome dt-pre-track e almeno due trasformate diverse
ERRORI DI FATTO: Il rischio sulla regex è descritto male. intro-clocks.test.ts:206 non si ferma al primo «1 100%» qualsiasi: vuole «1 100%» seguito da spazi e parentesi chiusa. Un punto intermedio, che è sempre seguito da una virgola, non può combaciare in nessun caso.
### 7b-corta-espresso — Versione corta alle visite successive della home, fedele a animatePreloaederShort: solo porta e tuffo, 2,38 s. DECISIONE PER ALBERTO (aggiunge attesa) [needs-alberto]
kind=new-gesture sticky=False files=app/layout.tsx, app/lib/motion/intro-constants.ts, app/globals.css, app/components/motion/Preloader.tsx, app/lib/__tests__/intro-clocks.test.ts, e2e/helpers.ts, e2e/home.spec.ts, e2e/mobile-motion.spec.ts, DESIGN.md, PRODUCT.md, docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md dir=C03 (cliente: eliminare tante animazioni),C05 (cliente: preloader più veloce),A02 (stesso film dimezzato),A07 (non vedo più il preloader),A16 (come prima) e domanda aperta 5,A15/A17 (Era come riferimento di tecnica),D05/C17 (il pannello espresso torna a ogni ricarica),D06 (patto della porta),C01 (l'arco),PRODUCT.md:138-141 «una volta per sessione»,DESIGN.md:345 e :545,reduced-motion = pagina statica completa,LCP < 2,5 s, CLS 0,niente scroll-hijack sul telefono
ADATTAMENTO: AGGIUNGE un'animazione dove oggi non c'è, cioè al caricamento di ritorno. Non entra nessun gesto nuovo nel vocabolario: riusa le keyframe dt-pre-door e dt-pre-dive che esistono già. Nessuna sezione sticky, nessun pin.

COSA SUONA (orologio CSS, t=0 al primo paint):
- pannello espresso e `.dt-pre-fondo` subito;
- sagoma `[data-pre-figure]` in dissolvenza in 0,30 s da 0 (`dt-pre-in-fade 0.3s linear 0s both`), finita prima che la porta arrivi alla banda, verso 0,45 s;
- porta 0→1,10 con cubic-bezier(0.66, 0, 0.22, 1): 104vh→15vh (16vh sul telefono), 24→36vw (40→58vw sotto i 768);
- tuffo 0,88→2,38 con cubic-bezier(0.6, 0, 0, 1), dal valore che la porta ha a progresso 0,8. È lo stesso `--arch-k: 0.972` di oggi, perché il rapporto fra porta e tuffo non cambia (globals.css:1267);
- anelli eco come oggi;
- handoff INTRO_EVENT a 0,88, all'animationstart del tuffo (Preloader.tsx:539-551); chiusura 2,38, autohide 2,48, failsafe 2,98.
Totale 2,38 s, il 51% del film intero. In Era la corta è il 37% dell'intro (3,75 su 10,15).

COSA SALTA. Tutto `[data-pre-content]`, come `.preloader_ctn{display:none}` di Era (main.pretty.js:105-107): badge sul disco carta, lockup e firma, caps, linea di carica, payoff. Quindi niente atto I, niente atto II, niente congedo. Nella corta spariscono anche tre delle quattro contraddizioni aperte del preloader: didascalie sotto i 16px (C04), disco carta (C19), lockup in Playfair (C18) (DESIGN.md:549-553). Restano il pannello espresso (D05) e l'arco.

CSS (globals.css, dopo la riga 1077 e prima del blocco dello skip):
- `html[data-preloader="short"] .dt-preloader [data-pre-content]{display:none}`. È una regola unlayered, quindi batte il `flex` di Tailwind.
- `html[data-preloader="short"] .dt-preloader [data-pre-figure]{animation:dt-pre-in-fade 0.3s linear 0s both}`. Stessa specificità della regola alla riga 867; vince perché viene dopo.
- `html[data-preloader="short"]:not([data-pre-gsap]) .dt-preloader{animation-delay:0s, 0.88s, 2.48s}`. Durate e bezier restano quelle della lista 1073-1076.
I selettori `html[data-preloader]` e i test `hasAttribute` (Preloader.tsx; HeroCinematic.tsx:222; SmoothScroll.tsx:19) continuano a combaciare anche col valore "short".

COSTANTI (intro-constants.ts), derivate e mai scritte a mano:
- `SHORT_T = { dive: 0.8 * INTRO_T.archDur, archDur: INTRO_T.archDur, diveDur: INTRO_T.diveDur, figureDur: 0.3 * TEMPO }`;
- `SHORT_MS` = round((dive + diveDur) × 1000) = 2380;
- `PRE_SHORT_AUTOHIDE_MS = SHORT_MS + 100`;
- `PRE_SHORT_FAILSAFE_MS = SHORT_MS + 600`.

QUANDO (boot script, layout.tsx:102): `short = !deep && m && sessionStorage.getItem(KEY) === "1" && location.pathname === "/" && navType !== "back_forward" && "registerProperty" in CSS && CSS.supports("mask-composite","add")`.
- Solo la home, perché il patto della porta vale solo contro la banda di HeroCinematic.
- Niente ripiego GSAP né sipario clip-path: dove mancano @property o mask-composite resta com'è oggi, cioè niente intro.
- Se `short`: attributo `data-preloader="short"`, `__dtPreArmed`, `__dtPreT0`, preload della sagoma (già in cache dalla prima visita), failsafe a PRE_SHORT_FAILSAFE_MS.
- `data-hero-rest` e `data-hero-intro` valgono "intro": la rete delle lettere scatta a 3,33 s, dopo la fine della corta, e riusa le quattro regole dt-rest-failsafe che esistono già.
- `data-consent` diventa `!(pre || short)`.
- Suona a ogni caricamento completo della home nella stessa scheda, come `hasVisited` di Era. Le navigazioni client di Next non la ripetono.
- Da decidere: includere il `reload`, che è il caso di A07, oppure solo `navigate`. Con il reload, chi ricarica a metà home viene riportato in cima da `scrollTo(0,0)` (Preloader.tsx:322-325).

PRELOADER.TSX:
- `const short = html.getAttribute("data-preloader") === "short"`;
- diveAt ed endAt da SHORT_T e SHORT_MS (oggi righe 432-434);
- `unwill()` subito;
- niente precarico dietro la corta, `scaldata = Promise.resolve()`: `scheduleIdleWarmup` parte comunque in finish (287);
- in sicurezza, `if (short && !cssDrives) { fireIntro(); finish(true); return; }`;
- nella corta non attacca pointerdown e keydown (763-764). Restano visibilitychange e il cambio di reduced-motion (739-775).
La chiave resta "1".

SKIP. Disarmato, anche nel boot script. La finestra utile è al massimo 0,88 s, e `data-pre-skip` porterebbe la porta di scatto da circa 95vh a 15vh (globals.css:1134-1136). La chiusura resta garantita a 2,38, 2,48 o 2,98 s.

REDUCED MOTION: mai, per la condizione `m`; pagina statica completa. ANCORE: mai. PATTO DELLA PORTA: invariato, `--dt-head-h` e `--dt-band-h` non si toccano.

LCP E CLS. La foto dell'hero è in preload e in cache. L'overlay è un layer fixed e non ritarda il paint (Preloader.tsx:54-55). Le lettere restano dipinte a 0,02 (globals.css:1175-1184). LCP invariato, CLS 0. Il costo è un altro: 2,38 s in più prima di poter scorrere, e un primo fotogramma espresso a ogni ricarica della home, dove oggi c'è subito l'avorio.

DIRETTIVE:
- C05, «preloader più veloce» (cliente): il film intero resta 4,63 s, ma dove oggi l'attesa è zero ne arrivano 2,38 s.
- C03, «eliminare tante animazioni» (cliente): è un'animazione in più.
- A02: il film intero non cambia.
- A07, «non vedo più il preloader»: la corta risponde, perché a ogni ricarica della home si vede la porta.
- A16, «come prima»: nessuna versione di Domus ha mai avuto una corta, quindi non è «come prima». Viene da Era, dentro il perimetro di A15/A17.
- Va riscritto «una volta per sessione» (PRODUCT.md:138-141), insieme a DESIGN.md:345 e DESIGN.md:545.

AGGIUNGE ATTESA: DECISIONE PER ALBERTO. Toccando C03 e C05, che sono della cliente, sta ad Alberto anche decidere se chiederle.
RISCHI: 2,38 s di scroll bloccato a ogni caricamento completo della home, anche sul telefono: overflow:hidden più Lenis fermo (globals.css:803-805; Preloader.tsx:322). / Il fondo espresso torna a ogni ricarica: smentisce DESIGN.md:345 e allarga D05 (domanda aperta 7). / Riscrive un impegno scritto: PRODUCT.md:139, «una volta per sessione». / Se si include il reload, chi ricarica a metà home viene riportato in cima. / La fixture e2e `goto` scrive "1" (helpers.ts:120-130): senza un valore dedicato ogni test della home pagherebbe 2,4 s e diventerebbe instabile. / Tre orologi nuovi: la lezione dei «sette orologi» (intro-constants.ts:1-7) chiede che nascano derivati e presidiati da intro-clocks. / La regola dello skip ha specificità 0,4,1 e batte quella della corta (0,3,1): se un giorno si armasse lo skip anche nella corta, la porta scatterebbe. / Testata e H1 restano coperti per circa 1,5 s a ogni ricarica: è l'eccezione del film intero, estesa.
TEST: app/lib/__tests__/intro-clocks.test.ts:130-143, «il failsafe è ${PRE_FAILSAFE_MS}»: la regex `setTimeout\(fine,\$\{PRE_FAILSAFE_MS\}\)` va estesa al ternario con PRE_SHORT_FAILSAFE_MS / intro-clocks.test.ts:158-164, autohide: restano due occorrenze perché la corta cambia solo animation-delay; si aggiunge l'asserzione 2.48s = PRE_SHORT_AUTOHIDE_MS / intro-clocks.test.ts:250-275, hero-rest: le quattro reti restano invariate / intro-clocks: asserzioni nuove, SHORT_T.dive = 0,8 × archDur (quindi --arch-k invariato) e i delay della regola short = 0s / SHORT_T.dive / PRE_SHORT_AUTOHIDE_MS / e2e/mobile-motion.spec.ts:1027-1093, «nella stessa sessione non si rivede alla seconda navigazione»: diventa «alla seconda navigazione della home suona la corta» (visto true, [data-pre-content] display none, durata ≤ SHORT_MS + 170), più un caso su una rotta interna che resta muta / e2e/home.spec.ts:40-49, «l'intro non si ripresenta nella stessa sessione» / e2e/helpers.ts:120-130, fixture goto: scrive un valore diverso da "1" per spegnere la corta nel resto della suite / e2e/mobile-motion.spec.ts:1142-1168, reduced motion: si aggiunge la visita di ritorno
VERDETTO: L'analisi tecnica regge.
- La corta dura 0,88 + 1,5 = 2,38 s e riusa dt-pre-door e dt-pre-dive.
- 0,88/1,1 = 0,8 e ease(0,8) = 0,9719: --arch-k resta 0,972 (globals.css:1267).
- Il selettore [data-preloader=«short»] ha la stessa specificità (0,3,1) delle regole alle righe 867 e 1072, quindi vince solo se sta dopo. Lo skip (0,4,1) la batterebbe.
- Tutti i lettori usano hasAttribute: Preloader.tsx:84, 205, 235; HeroCinematic.tsx:222; SmoothScroll.tsx:97. Il valore «short» non rompe niente.
- La sagoma finisce la dissolvenza a 0,30 s, con la porta ancora a 95,6vh; la porta arriva al fondo della banda (70vh) a circa 0,46 s. Confermato.
- Senza scaldata = Promise.resolve(), su desktop finish aspetterebbe runWarmup fino a 4,5 s (Preloader.tsx:403-404, 417-420). La proposta lo prevede.

La direzione non va più richiesta. La memoria di questa stessa sessione (domus-coreografia-era.md:13) registra la scelta di Alberto del 2026-09-13, «coreografia piena», che comprende la «versione corta del preloader alle ricariche nella stessa sessione». La stessa nota dice di non rimettere in discussione con lui il budget di movimento. Ne segue che il reload è incluso: il «Da decidere» della proposta è già deciso.

Come è scritta, però, la proposta contraddice tre testi in vigore:
- DESIGN.md:582, Don't: «l'espresso del preloader è una domanda aperta, non un permesso da estendere»;
- DESIGN.md:345: il pannello «non torna nella sessione»;
- PRODUCT.md:139: «una volta per sessione».
Inoltre allarga l'esposizione a C17 della cliente (domanda aperta 7, D05) e il registro §11 non ha ancora la voce A18.

La scelta di Alberto non risolve due punti. Il primo è se il fondo scuro possa tornare a ogni ricarica. Il secondo è il costo sul telefono: 2,38 s di scroll bloccato senza skip, e il ritorno in cima con scrollTo(0,0) (Preloader.tsx:325) per chi ricarica a metà home.

DA CHIEDERE AD ALBERTO, senza tornare sul budget: «La corta alle ricariche della home tiene il pannello espresso di oggi a ogni ricarica, anche sul telefono, con 2,38 s di scroll fermo, senza skip, e il ritorno in cima per chi ricarica a metà pagina? E la facciamo vedere alla cliente insieme a C03 e C05, visto che lei ha chiesto un preloader più veloce e meno animazioni?»
CONDIZIONI: Se Alberto dice sì: prima del codice, registrare A18 nella spec §11 con le sue parole (domus-coreografia-era.md:13) e segnarla come da mostrare alla cliente, perché supera C03 e tocca C05. / Riscrivere nello stesso commit PRODUCT.md:138-141, DESIGN.md:345, DESIGN.md:545 e DESIGN.md:582 (l'eccezione espresso si estende alla corta), più la domanda aperta 7 della spec. / Il reload è incluso («alle ricariche»). Escludere back_forward, le ancore, reduced-motion e i browser senza @property o mask-composite. Solo pathname «/» (l'unica rotta con HeroCinematic: app/page.tsx). / Nella corta niente skip, né nel boot script né in Preloader.tsx. Restano le chiusure per scheda nascosta e per reduced-motion attivato in corsa. / Aggiornare intro-clocks.test.ts:273: la regex cerca alla lettera pre?«intro»:«» nel boot script e si rompe con (pre||short). La proposta dà quel blocco per invariato. / Costanti SHORT_T, SHORT_MS, PRE_SHORT_AUTOHIDE_MS e PRE_SHORT_FAILSAFE_MS derivate da INTRO_T, con asserzioni in intro-clocks. La fixture goto di e2e/helpers.ts:120-130 scrive un valore dedicato. / Misurare LCP e CLS sulla ricarica della home con CPU ×4 e Slow-4G, prima e dopo: oggi il ritorno ha zero overlay.
EVIDENZE: C:/Users/alber/.claude/projects/C--Users-alber-domus-tua-site/memory/domus-coreografia-era.md:13 e :16-22 (scelta di Alberto, 2026-09-13; da registrare come A18; supera C03) / DESIGN.md:345 «non torna nella sessione»; DESIGN.md:545; DESIGN.md:582 (espresso non da estendere) / PRODUCT.md:138-141 «4,63 s, una volta per sessione, mai con reduced-motion» / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:367 (C03), :369 (C05), :396 (A07), :419 e :457-459 (D05, domanda aperta 7) / app/layout.tsx:102: pre = !deep && m && !sessionStorage.getItem, nessun controllo sulla rotta / app/globals.css:867, 1072-1077, 1134-1136: specificità (0,3,1) contro (0,4,1) / app/components/motion/Preloader.tsx:322-325 (Lenis fermo e scrollTo(0,0)), :398-405 e :417-420 (finish aspetta scaldata) / app/lib/__tests__/intro-clocks.test.ts:273: la regex letterale su data-hero-rest / script: ease domus.inOut(0,8) = 0,9719; porta a 95,6vh a 0,3 s e a 70vh a 0,464 s
ERRORI DI FATTO: testsAffected dice che intro-clocks.test.ts:250-275 resta invariato. Non è così: la riga 273 cerca alla lettera h.setAttribute(«data-hero-rest»,pre?«intro»:«») nel boot script, e la corta deve cambiarla. / Il reload è dato come «Da decidere», ma Alberto l'ha già deciso: la sua scelta del 2026-09-13 dice «alle ricariche nella stessa sessione» (domus-coreografia-era.md:13). / In currentState, il tetto e2e di 1700 ms è a mobile-motion.spec.ts:922-925, non a 885-920 (piccolo slittamento della citazione).
### 7b-corta-avorio — Variante della corta senza superficie scura: una porta ad arco su un foglio avorio. DECISIONE PER ALBERTO, in alternativa a 7b [exclude]
kind=new-gesture sticky=False files=app/layout.tsx, app/lib/motion/intro-constants.ts, app/globals.css, app/components/motion/Preloader.tsx, app/lib/__tests__/intro-clocks.test.ts, e2e/helpers.ts, e2e/home.spec.ts, e2e/mobile-motion.spec.ts, DESIGN.md, PRODUCT.md, docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md dir=C01 (arco visibile sull'avorio),C03,C05,A07,C17/A11 (rispettate),PRODUCT.md:138-141 «una volta per sessione»,regola della memoria: il riferimento ce l'ha?,hero e H1 mai nascosti
ADATTAMENTO: AGGIUNGE un'animazione al caricamento di ritorno; nessuna sezione sticky. È in alternativa a 7b, non in aggiunta.

COSA RESTA COME IN 7B: orologi (porta 0→1,10 con domus.inOut; tuffo 0,88→2,38 con dtDiveIn da --arch-k 0,972; autohide 2,48; failsafe 2,98), costanti SHORT_T/SHORT_MS, condizione del boot script (solo "/", motion ok, niente ancora, niente back_forward, @property e mask-composite presenti), skip disarmato, handoff a 0,88 s, rete delle lettere su "intro".

COSA CAMBIA, in CSS:
- `html[data-preloader="short"] .dt-preloader [data-pre-panel]{background-color:var(--color-cream)}`;
- `html[data-preloader="short"] .dt-preloader :is(.dt-pre-fondo,[data-pre-figure],[data-pre-arch-echo],[data-pre-content]){display:none}`.
Niente sagoma, quindi nessun patto da tenere e nessun preload.

COME SI VEDE. Avorio su avorio non si distingue. Al primo fotogramma la pagina sembra vuota, e anche la testata è coperta: l'overlay è fixed, a z-index 96, su tutto lo schermo (globals.css:794-799). Verso 0,45 s la porta arriva alla banda e la foto dell'hero si scopre dentro un arco a 15vh e 36vw (58vw sotto i 768). Il tuffo allarga il buco fino a 125vw (165vw) e scopre testata, H1 e CTA.

PRO. Rispetta C17 e A11: nessun fondo scuro. DESIGN.md:345 resta vero per l'espresso.

CONTRO:
- Non è la corta di Era, che tiene il fondo del sipario, né un'immagine del riferimento visivo: goldengoal non ha preloader (intro-constants.ts:69-70). La regola della memoria, «prima di aggiungere un'animazione chiedersi se il riferimento ce l'ha», la regge solo a metà.
- L'arco, cioè una curva, si vede sull'avorio della rivista invece che dentro il sipario scuro. È un'esposizione a C01 più forte di quella che A02 e A16 hanno accettato.

REDUCED MOTION: mai. ANCORE: mai. LCP E CLS: come 7b, con LCP invariato e CLS 0. Aggiunge 2,38 s di attesa a ogni caricamento completo della home: DECISIONE PER ALBERTO.
RISCHI: Il primo fotogramma è una pagina avorio vuota, senza testata, per circa 0,45 s, e il logo resta coperto fino al tuffo: può sembrare un caricamento rotto più che un'intro. / La curva dell'arco compare sulla rivista bianca: la cliente ha detto «niente curvo» (C01), e l'eccezione del sipario scuro non la copre esplicitamente. / Stesse conseguenze di 7b su impegni scritti, fixture e2e e reload a metà pagina. / È un'invenzione di adattamento, non una tecnica del dossier: più probabile che vada rifatta dopo averla vista.
TEST: Gli stessi di 7b / intro-clocks: un'asserzione che nella corta non ci siano nodi scuri visibili (panel cream; fondo, sagoma ed eco a display none)
VERDETTO: Le affermazioni tecniche sono corrette:
- l'overlay è fixed a z-index 96 su tutto lo schermo (globals.css:794-799);
- una regola unlayered su [data-pre-panel] batte bg-espresso di Tailwind (globals.css non ha @layer);
- --color-cream esiste (globals.css:59).

L'effetto però cade sotto direttive precise.
- C01, della cliente, «niente curvo». Il bordo curvo della maschera taglierebbe la foto dell'hero e poi la testata sull'avorio della rivista, fuori dal sipario scuro. L'unica eccezione accettata è l'arco «dentro il film» voluto uguale e dimezzato (A02, A16; DESIGN.md:435), non un arco sulla pagina. La memoria della coreografia piena lascia fuori anche così «curve e cupole» (domus-coreografia-era.md:18).
- Hero e H1 non si nascondono mai: a ogni ricarica testata, logo e H1 starebbero sotto un foglio avorio vuoto, e il primo fotogramma sembrerebbe un caricamento rotto.
- La regola della memoria chiede se il riferimento ce l'ha. Nessuno dei due ce l'ha: la corta di Era tiene il fondo del sipario (main.pretty.js:107-126) e goldengoal non ha preloader (intro-constants.ts:68-70).

È un'invenzione di adattamento che espone una curva nuova sulla rivista bianca.
CONDIZIONI: 
EVIDENZE: docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:365 (C01 «niente curvo») / DESIGN.md:435 (l'arco accettato solo come parte del film del preloader) / C:/Users/alber/.claude/projects/C--Users-alber-domus-tua-site/memory/domus-coreografia-era.md:18 (restano esclusi curve e cupole) / reverse-engineering/era-residence/js/main.pretty.js:107-126 (la corta di Era tiene il fondo e il decoro del sipario) / app/lib/motion/intro-constants.ts:68-70 (goldengoal non ha preloader) / app/globals.css:794-799 (overlay fixed, inset 0, z-index 96)
ERRORI DI FATTO: 
### 7-replay-su-richiesta — Rivedere il film intero su richiesta, con /?intro, senza far aspettare nessun altro [adopt-with-conditions]
kind=tokens-or-infra sticky=False files=app/layout.tsx, app/lib/__tests__/intro-clocks.test.ts, DESIGN.md dir=A07,C05/A02 (invariati),PRODUCT.md:138-141 (invariato)
ADATTAMENTO: Nessun gesto nuovo e nessuna sticky: è infrastruttura di verifica.

IL PROBLEMA. A07 non era un difetto: il film suona una volta per sessione (spec:396; DESIGN.md:545).

LA MODIFICA. Nel boot script (layout.tsx:102), dopo il ramo `deep` e prima di `var pre=`:
`if(/[?&]intro(&|=|$)/.test(location.search)){try{sessionStorage.removeItem("${INTRO_KEY}")}catch(e){}}`
Con /?intro il film intero da 4,63 s riparte a ogni caricamento, con tutte le guardie di oggi: motion ok, niente ancora, skip al tocco, failsafe 5,23 s, chiave riscritta a fine film.

PER I VISITATORI non cambia nulla: nessuna attesa in più, PRODUCT.md:138-141 resta vero.

REDUCED MOTION: la condizione `m` resta, quindi /?intro con reduced-motion non suona, ed è giusto.

Documentare in DESIGN.md:545, accanto a «può sembrare sparito». Se lo scopo di 7b è solo far rivedere il film ad Alberto e alla cliente, questa è l'alternativa gratuita.
RISCHI: La query non deve entrare nella canonical della home né nella sitemap: verificare `metadata.alternates` prima di far girare il link. / L'URL non viene riscritto: un reload con ?intro rifà il film, che è voluto, ma resta nella cronologia. / intro-clocks.test.ts:137 vieta numeri sparsi nel boot script: la regex proposta non ne aggiunge.
TEST: app/lib/__tests__/intro-clocks.test.ts, «layout.tsx: il boot script interpola le costanti»: nuova asserzione sul ramo ?intro, che resta dentro la condizione m / eventuale e2e: /?intro con la chiave già scritta mostra data-preloader
VERDETTO: È infrastruttura di verifica, invisibile ai visitatori. Nessun gesto nuovo, nessuna sticky, e PRODUCT.md:139 resta vero.

Il rischio SEO indicato è già coperto: la home dichiara alternates.canonical «/» (app/page.tsx:34), quindi /?intro si consolida sulla home. La query non entra nella sitemap.

La proposta regge perché la chiave viene tolta prima del calcolo di pre (layout.tsx:102), e le altre guardie non cambiano:
- m, cioè reduced-motion;
- deep, cioè l'ancora;
- skip;
- failsafe;
- la chiave riscritta da finish(true) a Preloader.tsx:263-272.

C'è un difetto di collocazione. Messa «dopo il ramo deep», con /?intro#contatti il ramo deep segna la chiave spesa e subito dopo il ramo ?intro la toglie: l'intro non suona perché c'è l'ancora, ma alla navigazione completa successiva senza ancora ripartirebbe. Serve la guardia !deep.

Il test a intro-clocks.test.ts:137 vieta numeri sparsi nel boot script: la regex proposta non ne aggiunge.
CONDIZIONI: Mettere la rimozione dentro !deep, cioè if(!deep && regex su location.search), prima di var pre=. / La regex nella template string del boot script non deve usare interpolazioni: niente dollaro seguito da graffa aperta. / Aggiungere a intro-clocks un'asserzione sul ramo ?intro e controllare che pre resti legato a m. / Documentarlo in DESIGN.md:545 come strumento di verifica per Alberto e la cliente, senza linkarlo in pagina.
EVIDENZE: app/page.tsx:34: alternates canonical «/» / app/layout.tsx:102: ordine del boot script (deep, poi pre) / app/components/motion/Preloader.tsx:263-272: finish(true) riscrive la chiave / app/lib/__tests__/intro-clocks.test.ts:130-148: asserzioni sul boot script (niente numeri sparsi, chiave interpolata) / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:396 (A07, nessun cambio al codice)
ERRORI DI FATTO: Il rischio «verificare metadata.alternates prima di far girare il link» è già risolto: app/page.tsx:34 dichiara la canonical «/».
### 7-budget-scheda-nascosta — Chi apre il sito in una scheda in background non consuma l'intro della sessione [adopt-with-conditions]
kind=refine-existing sticky=False files=app/components/motion/Preloader.tsx, app/layout.tsx, app/lib/__tests__/intro-clocks.test.ts dir=A07,PRODUCT.md:139 (lo rafforza),C05/A02 (invariati)
ADATTAMENTO: RIFINISCE il meccanismo che decide quando l'intro suona. Nessuna animazione aggiunta, nessuna sticky.

OGGI. Una home aperta in background, per esempio con un clic centrale da Google, chiude subito il sipario e scrive `dt-intro-seen`. Il percorso è `if (document.hidden) onVisibility()` → `closeImmediately` → `closeNow` → `finish(true)` (Preloader.tsx:472, 745-762, 775, 263-272). Se il JS non idrata, la chiave la scrive il failsafe `fine` (layout.tsx:102). Il visitatore non ha visto niente e alla ricarica continua a non vedere niente: è un'altra strada verso A07.

LA PROPOSTA:
- la chiusura per visibilità chiama `finish(false)`. Nel ramo CSS `closeNow` riceve il flag; nel ramo GSAP una variabile `spendi` letta da `onFilmEnd`;
- se reduced-motion si attiva a film in corso resta `finish(true)`;
- nel boot script `fine` scrive la chiave solo se `!document.hidden`.

EFFETTO. L'intro intera suona una volta, al primo caricamento visibile della sessione, come dice PRODUCT.md:139. Reduced motion, ancore e skip restano invariati. Chi l'ha già vista non aspetta niente in più.
RISCHI: In e2e con Chromium headless le pagine risultano sempre visibili: si prova in unit, con regex sul sorgente, o con page.evaluate che ridefinisce document.hidden. / Una scheda nascosta a metà film chiude comunque il sipario, come oggi; senza chiave il film intero riparte al reload successivo. / Il flag deve restare distinto da `completed`, che negli abort StrictMode/HMR già non scrive la chiave (Preloader.tsx:255-257).
TEST: app/lib/__tests__/intro-clocks.test.ts:134: la regex su `var fine=function(){…h.removeAttribute("data-preloader")}` resta verde se il corpo finisce con removeAttribute; si aggiunge l'asserzione sulla guardia `!document.hidden` / nuova asserzione sorgente: closeImmediately per visibilità → finish(false)
VERDETTO: La diagnosi è corretta. Nel ramo CSS closeNow resta finish(true) (Preloader.tsx:472), e il percorso è document.hidden al mount → onVisibility → closeImmediately → finish(true) (Preloader.tsx:745-762, 775, 263-272). Il failsafe fine del boot script scrive la chiave senza guardare la visibilità (layout.tsx:102). Chi apre la home in background consuma l'intro senza vederla. La regex di intro-clocks.test.ts:134 resta verde se il corpo di fine finisce con removeAttribute.

La rifinitura riporta il codice a quello che dice PRODUCT.md:139 e non aggiunge gesti. Come è scritta, però, la proposta passa a finish(false) anche per la scheda nascosta a metà film. Così chi ha visto quasi tutta l'intro (per esempio fino a 4 s) se la ritroverebbe intera alla ricarica successiva: è movimento in più non richiesto, contro C05 «più veloce».

Va limitata al caso «mai visibile». C'è anche il prerender dei risultati Google (document.prerendering, visibilityState hidden), che oggi scrive la chiave.
CONDIZIONI: finish(false) solo se la scheda era nascosta al mount (Preloader.tsx:775) o se la chiusura cade prima di INTRO_T.dive sull'orologio del film. Negli altri casi di visibilità resta finish(true). / Il cambio di reduced-motion in corsa (Preloader.tsx:750-753) resta finish(true), e così i rami di Preloader.tsx:293-297 e 306-310. / Nel boot script, fine scrive la chiave solo con !document.hidden. Il riarmo negli abort (Preloader.tsx:798-801) non scrive già oggi. / Coordinarla con 7b (la corta si attiva solo con la chiave) e con la voce reinstate: la marcatura all'avvio non deve consumare la sessione di chi è in background. / Test a regex sul sorgente (e2e headless ha sempre document.hidden false). Opzionale: un e2e con page.evaluate che forza visibilityState a hidden prima dell'idratazione.
EVIDENZE: app/components/motion/Preloader.tsx:472 (closeNow = finish(true) nel ramo CSS) / app/components/motion/Preloader.tsx:745-762 e :775 (chiusura per visibilità, anche al mount) / app/components/motion/Preloader.tsx:263-272 (finish(completed) scrive INTRO_KEY) / app/layout.tsx:102 (var fine scrive la chiave senza controllare la visibilità) / app/lib/__tests__/intro-clocks.test.ts:134 (regex sul corpo di fine) / PRODUCT.md:138-141 (una volta per sessione)
ERRORI DI FATTO: 
ESCLUSO: Le durate di Era: barra da 4 s, pausa di lettura da 1,2 s, film da 10,15 s, oppure il ritorno a TEMPO = 2 — Il 10 settembre la cliente ha chiesto il preloader più veloce e Alberto ha scelto «Stesso film di oggi ma dimezzato»: TEMPO = 1, INTRO_MS 4630 (intro-constants.ts:67-74; spec §11 C05 riga 369, A02 riga 391). Se «come prima» (A16) comprendesse anche i 9,26 s è la domanda aperta 5 (spec:453-454), e una proposta di tecnica non basta a chiuderla. (C05 (cliente); A02 e domanda aperta 5 su A16 (Alberto))
ESCLUSO: Lo zoom dell'immagine hero durante il tuffo (scale 0,75 desktop / 1,15 mobile → 1, origine center top, 1,5 s InOut; main.pretty.js:25-31, 70-77, 97-101, 132-139) — Romperebbe il patto della porta. La sagoma nel sipario e la banda dell'hero sono lo stesso scatto nella stessa scatola, e coincidono pixel su pixel quando l'arco le attraversa; per questo la foto dell'hero resta a scale 1 (Preloader.tsx:10-11; globals.css:854-866; DESIGN.md:557). Un'hero che scala sotto una sagoma ferma riporterebbe le «due Raffaela» corrette l'11 settembre. (D06, il patto della porta presidiato da intro-clocks.test.ts:405-436; A16)
ESCLUSO: Transizioni di pagina agganciate al preloader (initPageTransitions dentro la timeline, main.pretty.js:78-80, 140-142) e la stessa porta ad arco usata fra una pagina e l'altra — Le transizioni di pagina non esistono più (PageTransition è uno stub) e il §8 del dossier è fuori perimetro. Un arco fuori dal sipario sarebbe una curva nelle pagine. (C01 (cliente); A17 (perimetro di Era, §8 escluso))
ESCLUSO: Texture SVG del fondo e cornice decorativa a linee in dissolvenza (preloader_bg_a a opacità 0,05, preloader_bg_decor 0→1 in 1,2 s; main.pretty.js:39-50, 107-118; README.md:135) — Sono ornamenti disegnati, quindi la corta non li recupera. Il fondo resta `.dt-pre-fondo` (globals.css:810-813). (C12 (cliente: niente fiori né ornamenti disegnati))
ESCLUSO: Scroll bloccato senza via d'uscita fino alla fine del film: Era non ha listener di skip né controllo di reduced-motion nelle righe 1-148 — In Domus il film si salta con un tocco o un tasto fino al tuffo, e il boot script lo serve prima del JS (layout.tsx:93-102; Preloader.tsx:706-738; DESIGN.md:545). Con reduced-motion l'intro non esiste (layout.tsx:102; e2e mobile-motion.spec.ts:1142-1168). La corta di 7b spegne lo skip solo perché la finestra utile è 0,88 s, e tiene la chiusura su scheda nascosta o reduced-motion attivato in corsa. (reduced-motion = pagina statica completa; skip documentato in DESIGN.md:545 e presidiato dall'e2e «skip al tocco»; niente scroll-hijack sul telefono)
ESCLUSO: Il fondo prugna del tema on-dark di Era (#340c24, README.md:106) come colore del sipario — Niente nero e niente superfici scure. L'espresso del preloader è già una domanda aperta, non un permesso da estendere (DESIGN.md:582). (C17 (cliente), A11 (Alberto), D05 / domanda aperta 7)
ESCLUSO: Chiave di sessione scritta all'avvio del film, come hasVisited in main.pretty.js:7-9, per cui un reload a metà intro darebbe la corta — In Domus la chiave si scrive solo quando l'intro è stata vista o saltata (Preloader.tsx:255-272). Scriverla all'avvio la consumerebbe negli abort di StrictMode/HMR e a chi ricarica durante il film: sarebbe di nuovo «non vedo più il preloader». (A07 (Alberto); decisione di lavoro scritta in Preloader.tsx:255-257)
### reinstate:Chiave di sessione scritta all'avvio del film (hasVisited di Era) [adopt-with-conditions]: L'esclusione cita A07 e Preloader.tsx:255-257. A07 però è solo «non vedo più il preloader», risolta senza cambiare codice (spec:396): non vieta dove si scrive la chiave. Il commento di Preloader.tsx:255-257 riguarda gli abort di StrictMode e HMR del componente. Una marcatura scritta dal boot script, che gira una volta per documento (layout.tsx:102), non ne risente.

L'argomento «sarebbe di nuovo non vedo più il preloader» vale solo senza versione corta. Con 7b, chi ricarica a metà della prima intro vedrebbe la corta, come fa Era (main.pretty.js:4-9), non il nulla. È una decisione di lavoro, non una direttiva: si rivede con un argomento migliore.

Ha senso solo insieme a 7b e va coordinata con 7-budget-scheda-nascosta. | Solo se 7b viene approvata da Alberto. / Scriverla dal boot script con un valore distinto (per esempio «0» = intro iniziata), non «1». «1» resta per intro vista o saltata (finish(true)). La corta si attiva con «0» o «1». / Non scriverla se document.hidden al boot, per non contraddire 7-budget-scheda-nascosta. / Aggiornare e2e/helpers.ts:120-130 e i test di sessione (mobile-motion.spec.ts:1027-1093, home.spec.ts:40-49) sui due valori.
