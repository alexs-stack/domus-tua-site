# timing
## currentState
A. IL VOCABOLARIO DICHIARATO E QUANTO REGGE
- gsap.ts:7-18 promette «Tutta la coreografia usa SOLO questo vocabolario».
  - Durate: dur micro 0.3, short 0.6, reveal 0.9, hero 1.4, transition 1.1 (gsap.ts:85-91).
  - Stagger: chars 0.06, words 0.1, lines 0.11, cards 0.12 (94-99).
  - Distanze: rise 48, parallax 0.13, skew 5 (102-109).
  - CustomEase: "domus" C0.22,0.9 0.36,1 (66); "domus.inOut" C0.66,0 0.22,1 (67); "dtDiveIn" 0.6,0,0,1 (72); "dtOut" 0.25,1,0.5,1 (73); "dtHorScroll" 0.25,0,0.75,1 (78); "dtLoader" a più segmenti (79-82).
- globals.css:165-174, dentro @theme inline (42-189): --ease-soft (0.32,0.72,0,1), --ease-out-expo (0.16,1,0.3,1), --ease-domus (0.22,0.9,0.36,1), --dur-micro…--dur-transition.
- Token morti:
  - stagger.words, stagger.lines, dist.rise, dist.parallax e dist.skew non hanno consumatori: compaiono solo nei commenti di gsap.ts:15-18 e HorizonScroller.tsx:50.
  - dur.transition è documentato come «page transition» (gsap.ts:11), ma le transizioni di pagina non esistono più; oggi fa solo il decadimento del monogramma (RotatingMark.tsx:80).
  - In CSS --dur-short, --dur-reveal, --dur-hero e --dur-transition non vengono mai letti: l'unico var(--dur-) è globals.css:609.
  - gsap.ts:5 annuncia una CustomEase equivalente a --ease-soft che non esiste.
  - dtOut, domus.inOut e dtDiveIn non hanno una custom property CSS. Il preloader le scrive letterali (globals.css:874-884, 1074-1075, 1115, 1120) e intro-clocks.test.ts:72-77, 186-187 e 303-314 pretende che coincidano con gsap.ts.

B. INVENTARIO DELLE EASE: circa 24 curve distinte, contro le 7 con nome di Era
- CustomEase GSAP: 6 (elencate sopra).
- Ease di serie GSAP:
  - expo.out (TextLines.tsx:104)
  - power2.in (TextLines.tsx:144; StarReviews.tsx:458,469; CaseQuickLook.tsx:79,92)
  - power2.out (StarReviews.tsx:459,489,497,504; BeforeAfter.tsx:299)
  - power2.inOut (StarReviews.tsx:447,498; CareerApplication.tsx:389)
  - power3.out (StarReviews.tsx:463; BeforeAfter.tsx:235)
  - power3.inOut (BeforeAfter.tsx:189)
  - power4.inOut (StarReviews.tsx:444,479)
  - power1.inOut (StarReviews.tsx:574)
  - sine.inOut (StarReviews.tsx:587)
  - none (Parallax.tsx:99; HorizontalRail.tsx:132,141; HorizonScroller.tsx:300,393,428 escluso, 573,612,625; StarReviews.tsx:410)
  - power1.out implicito, perché manca l'ease (PropertySearch.tsx:614)
- CSS:
  - --ease-out-expo: .reveal (globals.css:511), link-underline (653), badge del preloader (871). In più tre copie arbitrarie ease-[cubic-bezier(0.16,1,0.3,1)] (LazyYouTubeEmbed.tsx:59, OpenDomusPageContent.tsx:826, PropertyCard.tsx:131).
  - --ease-soft: utility ease-soft in CaseVenduteContent.tsx:291 e PropertyGallery.tsx:325. In più sette copie ease-[cubic-bezier(0.32,0.72,0,1)] (Assistant.tsx:437,686; FaqContent.tsx:265; OpenDomusPageContent.tsx:936; MobileActionBar.tsx:88; WhatsAppFloat.tsx:26; PropertyGallery.tsx:42).
  - --ease-domus: globals.css:609, 685, 1613.
  - Parola chiave `ease` (0.25,0.1,0.25,1, cioè "Ease" di Era): .dt-btn (1457-1460), .dt-social (1608-1612, 1639), autohide e reti (1070, 1170-1183).
  - ease-in-out (592); linear (868, 893, 897, 1089); sweep cubic-bezier(0.5,0,0.5,1) (1915).
  - Ripiego del loader: cubic-bezier(0.2,0.45,0,0.25) più linear() (1092-1111).
  - Default di Tailwind v4, cubic-bezier(0.4,0,0.2,1) (node_modules/tailwindcss/theme.css:493), su ogni transition-* senza ease: Header.tsx:202,240; Voci.tsx:126,229.
- Curva documentata ma assente: la spec §3.5 dice «cubic-bezier(.2,.65,.3,1)» (spec:191) e nel codice non compare da nessuna parte.

C. INVENTARIO DELLE DURATE: circa 30 valori
- Ingressi:
  - 0.3 (PropertyDetail.tsx:342)
  - 0.6 (ListingsGrid.tsx:41; PropertySearch.tsx:603,656; ContattiContent.tsx:105)
  - 0.9 (letterale nel CSS, globals.css:511; HorizonScroller.tsx:133,463)
  - 1.05 letterale (TextLines.tsx:103)
  - 1.2 letterale (HorizonScroller.tsx:230,542)
  - 1.4 (HeroCinematic.tsx:284,295,306)
  - 1.6 (CURTAIN_DUR, HorizonScroller.tsx:62)
  - 1.8 (BeforeAfter.tsx:187)
- Hover e UI:
  - 150ms, il default di Tailwind (theme.css:492), dove manca duration-* (ContattiContent.tsx:172)
  - 200ms (Header.tsx:240; Assistant.tsx:488)
  - 0.25 (globals.css:1458, 1609, 1639)
  - 0.3 (609, 653, 1612 e tutti i duration-300)
  - 0.35 (685); 0.4 (653)
  - 500ms (MobileActionBar.tsx:88; RailProgress.tsx:165; FaqContent.tsx:265)
  - 700ms (CaseVenduteContent.tsx:291); 1200ms (LazyYouTubeEmbed.tsx:59); 1600ms (PropertyCard.tsx:131)
- Uscite:
  - 0.25 (PropertySearch.tsx:614)
  - 0.4 (EXIT_DUR, TextLines.tsx:43, mai usato)
  - 0.6 (ListingsGrid.tsx:50; PropertySearch.tsx:665)
  - tutto il resto è il reverse della durata d'ingresso.
- Set piece:
  - scrub true (Parallax.tsx:104), 0.6 (HorizontalRail.tsx:118,125; StarReviews.tsx:420), 0.25 (HorizonScroller.tsx:310,398,433,574,613,626)
  - StarReviews in unità di timeline da 0.06 a 0.5 (439-501), shimmer 1.25 con repeatDelay 2.8 (573-577), respiro 2.6 (586)
  - sweep CSS 5.4s (globals.css:1915)
- Monogramma: rampa 0.3 letterale (RotatingMark.tsx:74) e decadimento 1.1 (80).
- Lenis: lerp 0.1 (SmoothScroll.tsx:109).
- Preloader: gli orologi di INTRO_T (intro-constants.ts:76-105) più lo spin a 6s (globals.css:893). Hanno un orologio proprio, presidiato dal test.
- Stagger:
  - TextLines 0.09 (TextLines.tsx:51; la spec:190 dice 80ms; stagger.lines 0.11 non è usato)
  - caratteri dell'orizzonte 0.03 (HorizonScroller.tsx:232)
  - hero 0.08, 0.07 e 0.032 (HeroCinematic.tsx:285,296,307)
  - 0.07 (ContattiContent.tsx:107); 0.12 (ListingsGrid.tsx:43); 0.06 (PropertySearch.tsx:658; PropertyDetail.tsx:344)
  - ritardi di Reveal scritti a mano da 80 a 280ms in circa 60 chiamanti (es. FaqContent.tsx:285 a 280; Voci.tsx:168,173 a 80 e 140).

D. DOVE DIVERGONO
1. La famiglia «ingresso» ha quattro curve e quattro tempi diversi:
   - Reveal: out-expo, 0.9s
   - TextLines: expo.out, 1.05s
   - caratteri, sipario e hero: dtOut, 1.2, 1.6 e 1.4s
   - blocchi, card e righe: domus, 0.6-0.9s
2. I documenti si contraddicono tra loro e col codice:
   - DESIGN.md:306 dice che i testi salgono per righe «con la curva `dtOut`»;
   - DESIGN.md:496 e TextLines.tsx:103-104 dicono expo.out, 1.05s;
   - la spec:190-191 dice stagger 80ms e una bezier che nel codice non c'è.
3. Duplicati: out-expo copiato 3 volte in forma arbitraria, soft 7 volte; 0.9s letterale dove esiste var(--dur-reveal); 0.3 letterale in RotatingMark.

E. REVERSIBILITÀ OGGI
- Reveal (Reveal.tsx:34-44, 56; globals.css:508-521).
  - Un IntersectionObserver (threshold 0.12, rootMargin -8% in basso) fa setShown(entry.isIntersecting), quindi accende e spegne su entrambi i bordi.
  - La transition è una sola, sullo stato base. L'uscita è dunque identica all'ingresso: 0.9s con ease-out-expo, che parte secca invece di accelerare come una In. Il blocco scivola indietro di 2.5rem verso il basso (specchio, non verso opposto) e aspetta lo stesso transitionDelay inline di 80-280ms (Reveal.tsx:56).
  - Esce anche dal bordo alto, fuori campo, e rientrando dall'alto rifà il fade-up dal basso.
  - Difetto 1, il failsafe non è guardato: setTimeout(() => setShown(true), 2500) (Reveal.tsx:44).
    - A 2,5 s accende fuori campo ogni Reveal sotto la piega.
    - L'observer aveva già consegnato isIntersecting=false, e al primo arrivo nel viewport notifica true su uno stato già true.
    - Chi raggiunge il blocco dopo 2,5 s non vede il primo ingresso. È la stessa svista misurata e corretta in HorizonScroller.tsx:149-161.
  - Difetto 2: `.reveal:not(.is-in){will-change}` (globals.css:515-517). Col replay ripromuove ogni blocco uscito, circa 146 aperture di <Reveal in 35 file, contro la misura di globals.css:1784-1789.
- TextLines, ramo di default (TextLines.tsx:109-118); ci passano tutti i 32 chiamanti.
  - toggleActions "restart none none reverse", start "top 86%".
  - onLeaveBack fa il reverse della stessa tween: 1.05s più lo stagger rovesciato (l'ultima riga esce per prima), con expo.out percorsa all'indietro (lenta, poi precipita).
  - Le righe RISCENDONO a yPercent 112: specchio. Scatta quando il blocco è nel 14% basso dello schermo.
- TextLines, modalità exit (TextLines.tsx:27-39, 42-44, 121-165).
  - L'uscita di Era c'è già: 0.4s, yPercent -110, power2.in, stagger/2, restart() e mai play(), rete `if (st.isActive) enter()`.
  - Nessun chiamante passa `exit`: nei .tsx la parola compare solo in TextLines.tsx.
  - onEnterBack:enter (156) riarmerebbe da 112 un titolo già fermo in vista.
- HorizonScroller.
  - Blocchi: tw.reverse() (143, 470), cioè 0.9s domus all'indietro con y 28 verso il basso.
  - Caratteri: charTween.reverse() (242, 554), 1.2s dtOut.
  - Sipario: stl.reverse() (358, 599), 1.6s, si richiude verso sinistra.
  - Le reti sono guardate (158-161, 248-257).
- Card: ListingsGrid.tsx:47-53 e PropertySearch.tsx:662-668. In onLeaveBack solo opacity 0, a 0.6 domus, identico all'ingresso; rete guardata (ListingsGrid.tsx:69-71).
- Reverse simmetrici anche in ContattiContent.tsx:113, PropertyDetail.tsx:351 e BeforeAfter.tsx:190.
- Precedente di uscita asimmetrica già nel sito: CaseQuickLook, montato in PropertySearch.tsx:1063, chiude a dur.micro con power2.in (CaseQuickLook.tsx:79,92) e apre a dur.short con domus (133).
- Reduced-motion:
  - .reveal è forzato visibile (globals.css:534-540) e c'è il kill globale transition-duration 0.001ms (554-560);
  - TextLines e HorizonScroller girano solo dentro MQ.motionOk;
  - e2e/motion.spec.ts:22-43 lo presidia.
- Il replay «a ogni passaggio» è citato come richiesta della cliente del 2026-08-04 (Reveal.tsx:31-33, TextLines.tsx:5-6, ListingsGrid.tsx:30; memoria domus-wow-layer.md:49), ma non ha una voce nel registro §11 della spec.
## eraExact
TOKEN
- CSS: reverse-engineering/era-residence/css/inline/03-root-durations-eases.css:3-11.
  - Durate: --dur-s 0.4s, --dur-m 0.8s, --dur-l 1.2s.
  - Ease: --ease-in-out (0.76,0,0.24,1), --ease-out (0.25,1,0.5,1), --ease-in (0.5,0,0.75,0), --ease (0.25,0.1,0.25,1), --ease-write (0.333,0,0.667,1).
  - Riportati nel README §3, righe 73-97.
- JS: js/main.pretty.js:2858-2863.
  - durS .4, durM .8, durL 1.2, stagger .1, delayReveal .3.
  - CustomEase: "InOut" 0.75,0,0.25,1 (nota: diversa dal CSS 0.76/0.24), "Out" 0.25,1,0.5,1, "In" 0.5,0,0.75,0, "Ease" 0.25,0.1,0.25,1, "Write" 0.333,0,0.667,1, "diveIn" 0.6,0,0,1, "horScroll" 0.25,0,0.75,1.
  - Domus ha già Out (=dtOut), diveIn (=dtDiveIn) e horScroll (=dtHorScroll). Mancano In, InOut, Ease e Write.
- Anche gli hover passano dai tre tempi (css/inline/04-components-hover.css):
  - bottone durM + InOut (8-9)
  - nav durM + Out (45-46)
  - card durL + Out (80-81)
  - transition opacity durM Out (144)

ANIMATORI DI TESTO (main.pretty.js:401-672)
Regole comuni:
- reveal: sempre durL con "Out", delay (r ?? 0.3) + indice×0.1, overwrite:true;
- hide: sempre durS con "In", delay r ?? 0 (quindi senza ritardo), stagger dimezzato, overwrite:true.

Per animatore:
- a (401-452), split chars
  - reveal: opacity 0, rotateX 90, x 10rem, origin center bottom, stagger .1
  - hide: rotateX -90, x -10rem, origin center top, stagger .05
- h (454-503), split words,chars
  - reveal: opacity 0, yPercent 50, rotateY 90, stagger .05
  - hide: yPercent -50, rotateY -90, stagger .025
- p (505-548), split lines,words con mask lines
  - reveal: yPercent 110→0, stagger .1
  - hide: yPercent 0→-110, stagger .05. Le righe escono dall'ALTO e proseguono il moto; «lines that sink back down» nell'articolo è sbagliato.
- ctn (550-586)
  - reveal: opacity 0, y 3.333rem da 992 px, 11.54rem sotto
  - hide: opacity 0, y 0, cioè sfuma sul posto; durS, stagger .05
- line (588-618)
  - reveal: clip inset(0 0 100% 0)→inset(0)
  - hide: →inset(100% 0 0 0)
- slide (620-672), l'unica eccezione: nasconde a durata piena, durL InOut, col poligono che si chiude verso sinistra e l'interno a scale 1.5, xPercent -25.

QUANDO SCATTA hide
- I reveal generici allo scroll sono once:true, start "top bottom" (main.pretty.js:908-917; README §7 riga 335): risalendo NON escono.
- hide si chiama solo:
  - al leave di Barba (154);
  - nei controller di tab e slider (1490, 1535, 1579, 2000);
  - alla chiusura del menu (2225);
  - in tre trigger di sezione con onEnter→reveal e onLeaveBack→hide: loc-info, start "top 30%", reveal con delay .1 e hide con 0 (2574-2585); la sezione a 2770-2778, start "30% top"; il footer, start "top 30%" (2798-2809).
- Quindi «ogni ingresso ha un'uscita allo scroll» vale in Era solo per capitoli scelti. La regola vera è: uscita più veloce (durS contro durL), curva In, nessun ritardo, stagger dimezzato, verso opposto (sfumata sul posto per ctn).

ALTRO
- Logo (README §5, righe 248-256): rampa 0.3 con "Out", poi decadimento 1.2 con "Out" 100ms dopo lo scroll.
- Lenis (README §3, righe 116-121): duration 1.2 con easing esponenziale.
### P1 — Lessico dei tempi: stessi nomi in CSS e GSAP, fase 1 senza cambi visibili [adopt-with-conditions]
kind=tokens-or-infra sticky=False files=app/lib/motion/gsap.ts, app/globals.css, app/components/motion/HorizonScroller.tsx, app/components/motion/RotatingMark.tsx, app/components/motion/TextLines.tsx, app/components/Assistant.tsx, app/domande-frequenti/FaqContent.tsx, app/open-domus/OpenDomusPageContent.tsx, app/components/MobileActionBar.tsx, app/components/WhatsAppFloat.tsx, app/components/PropertyGallery.tsx, app/components/LazyYouTubeEmbed.tsx, app/components/PropertyCard.tsx, app/lib/__tests__/motion-tokens.test.ts dir=A15,A17,DESIGN.md Do (motion, riga 573)
ADATTAMENTO: DOVE: app/lib/motion/gsap.ts e il blocco @theme inline di app/globals.css (165-174).

DURATE (7), con gemello --dur-*:
- dur.micro 0.3: hover/UI, rampa del monogramma.
- dur.exit 0.4: NUOVO, = durS di Era; tutte le uscite.
- dur.short 0.6: card e righe dati.
- dur.reveal 0.9: Reveal e blocchi.
- dur.long 1.2: NUOVO, = durL; caratteri del manifesto, oggi 1.2 letterale in HorizonScroller.tsx:230,542.
- dur.hero 1.4.
- dur.curtain 1.6: sposta CURTAIN_DUR da HorizonScroller.tsx:62 nel lessico.
- dur.transition 1.1 resta finché non passa P2, poi alias di long.

EASE (regola dei nomi: CSS --ease-<kebab> ↔ GSAP "<camelCase>"):
- --ease-domus ↔ "domus": invariata.
- --ease-dt-out ↔ "dtOut" (0.25,1,0.5,1): la custom property CSS è NUOVA.
- --ease-dt-in ↔ "dtIn" (0.5,0,0.75,0): NUOVA su entrambi i lati, = "In" di Era.
- --ease-domus-in-out ↔ "domus.inOut" (0.66,0,0.22,1).
- --ease-dt-dive-in ↔ "dtDiveIn".
- --ease-soft ↔ "soft" e --ease-out-expo ↔ "outExpo": gemelli GSAP NUOVI, così gsap.ts:5 dice il vero.
- dtHorScroll e dtLoader restano a uso unico; "none" per gli scrub.
Il nome "domus.inOut" resta com'è per compatibilità, ma niente nuovi nomi col punto: la doc di CustomEase (Context7) mostra id stringa semplici, e i nomi col punto si confondono con le ease di serie GSAP (power2.inOut).

Le CustomEase restano scritte una per riga come CustomEase.create("dtIn", "0.5,0,0.75,0"): la regex di intro-clocks.test.ts:73 legge proprio quella forma, quindi niente tabella generata in un ciclo.

SOSTITUZIONI A VALORE IDENTICO:
- globals.css:511: 0.9s → var(--dur-reveal).
- Sette ease-[cubic-bezier(0.32,0.72,0,1)] → ease-soft (Assistant.tsx:437,686; FaqContent.tsx:265; OpenDomusPageContent.tsx:936; MobileActionBar.tsx:88; WhatsAppFloat.tsx:26; PropertyGallery.tsx:42).
- Tre ease-[cubic-bezier(0.16,1,0.3,1)] → ease-out-expo (LazyYouTubeEmbed.tsx:59; OpenDomusPageContent.tsx:826; PropertyCard.tsx:131).
- RotatingMark.tsx:74: 0.3 → dur.micro.
- TextLines.tsx:43: EXIT_DUR → dur.exit.
- HorizonScroller.tsx:230,542: 1.2 → dur.long; CURTAIN_DUR → dur.curtain.

PULIZIA:
- Togliere stagger.words, stagger.lines e dist.* (nessun consumatore).
- Riscrivere il commento di gsap.ts:7-18.

IL PRELOADER RESTA FUORI: le bezier letterali di globals.css:868-1120 non passano a var(). intro-clocks.test.ts:49, 282 e 309-314 pretende un «cubic-bezier(» letterale, e ne presidia già l'uguaglianza con gsap.ts.

TEST NUOVO: app/lib/__tests__/motion-tokens.test.ts, sullo stile di intro-clocks. Rilegge gsap.ts e globals.css e pretende che:
- ogni coppia --ease-x / CustomEase abbia le stesse quattro cifre;
- --dur-* = dur.*;
- nei .tsx non ricompaia nessun ease-[cubic-bezier(.

Nessun effetto su breakpoint o reduced-motion: sono token, non gesti.
RISCHI: intro-clocks.test.ts legge le CustomEase con una regex (riga 73): una tabella generata o un nome cambiato su domus.inOut, dtOut o dtDiveIn fa fallire npm test. / Turbopack serve la CSS di Tailwind con un'edizione di ritardo: le utility ease-soft ed ease-out-expo vanno verificate toccando globals.css e ricaricando (memoria domus-redesign-rivista-bianca). / ease-soft esiste solo perché --ease-soft sta in @theme inline: spostare i token fuori da @theme rompe le utility.
TEST: app/lib/__tests__/intro-clocks.test.ts / app/lib/__tests__/motion-tokens.test.ts (nuovo)
VERDETTO: Fase a valore identico, senza cambi visibili, tutta dentro l'inventario dichiarato. Le misure citate reggono quasi tutte. Il vocabolario dichiarato (gsap.ts:7-18) mente: stagger.words, stagger.lines e dist.* non hanno consumatori (compaiono solo nei commenti di gsap.ts:15-18 e HorizonScroller.tsx:50). L'unico var(--dur-) letto è globals.css:609. gsap.ts:5 annuncia una CustomEase per --ease-soft che non esiste. dur.transition serve solo a RotatingMark.tsx:80. Il vincolo del preloader è letto bene: la regex di animationOf (intro-clocks.test.ts:49) su un var(--ease-x) catturerebbe l'intero var(...) e l'assert di riga 282 fallirebbe. La regex di gsapEase (riga 73) vuole CustomEase.create("nome", "...") su una riga. Nessuna direttiva colpita: sono token, non gesti, e nessuna sezione sticky. I difetti sono di completezza e coerenza, non di envelope. L'inventario delle copie arbitrarie è incompleto, e il test nuovo proposto fallirebbe subito. La proposta crea poi token nuovi senza consumatori ("dtIn", "soft", "outExpo"), cioè lo stesso problema che vuole pulire.
CONDIZIONI: Sostituire anche la copia ease-[cubic-bezier(0.32,0.72,0,1)] in app/components/PropertySearch.tsx:754: sono otto, non sette. Senza, il test motion-tokens.test.ts che vieta ease-[cubic-bezier( nei .tsx è rosso al primo giro. / Non creare CustomEase né custom property senza un consumatore nello stesso commit. "dtIn"/--ease-dt-in entrano solo con P3, P4 o P5; "soft" e "outExpo" lato GSAP solo se un tween li usa. Altrimenti si ricreano i token morti che si stanno togliendo. Basta correggere il commento di gsap.ts:5. / Tenere le CustomEase una per riga nella forma CustomEase.create("nome", "a,b,c,d"), senza tabelle generate. Non rinominare domus.inOut, dtOut e dtDiveIn (intro-clocks.test.ts:73, 187-188, 219, 224, 304). / Il preloader (globals.css:862-1125) resta con le bezier letterali. / Valutare di lasciare CURTAIN_DUR locale. HorizonScroller.tsx:45-48 dichiara di proposito che è una misura del set piece «che il vocabolario di gsap.ts non ha»; spostarlo in gsap.ts va motivato nel commit. / Dopo il cambio globals.css:511 → var(--dur-reveal), verificare sul server di build (non su Turbopack dev, che serve la CSS con un'edizione di ritardo) che getComputedStyle(.reveal).transitionDuration valga ancora 0.9s. Stessa verifica per le utility ease-soft ed ease-out-expo nei file toccati. / Prefisso dt- obbligatorio sulle ease nuove (--ease-dt-in, non --ease-in): Tailwind 4.3.1 ha già --ease-in, --ease-out e --ease-in-out di default, e un nome uguale li sovrascriverebbe in tutto il sito.
EVIDENZE: app/lib/motion/gsap.ts:5 annuncia «--ease-soft ≈ CustomEase equivalente», ma nelle righe 66-82 non ce n'è nessuna / Grep in app: stagger.words, stagger.lines e dist.(rise|parallax|skew) compaiono solo in gsap.ts:15-18 (commento) e HorizonScroller.tsx:50 (commento) / Grep var\(--dur-: l'unica occorrenza è app/globals.css:609 / app/lib/__tests__/intro-clocks.test.ts:49 (regex dell'ease [^\s]+ …), :282 (assert.match a.ease /^cubic-bezier\(/), :73 (regex di CustomEase.create su una riga) / Grep ease-\[cubic-bezier in app: 11 occorrenze, cioè 8 con (0.32,0.72,0,1), PropertySearch.tsx:754 compresa, e 3 con (0.16,1,0.3,1) / app/components/motion/HorizonScroller.tsx:45-62 (REVEAL_Y e CURTAIN_DUR dichiarati volutamente fuori dal vocabolario) / node_modules/tailwindcss/package.json: 4.3.1; theme.css:492-493 default 150ms e cubic-bezier(0.4,0,0.2,1)
ERRORI DI FATTO: «Sette copie ease-[cubic-bezier(0.32,0.72,0,1)]»: sono otto. Manca app/components/PropertySearch.tsx:754 (bottone tondo rosso, transition-all duration-300). / «circa 146 aperture di <Reveal in 35 file»: le aperture sono 146, ma in 34 file (grep su app, nessuna fuori da app). / «ritardi di Reveal scritti a mano da 80 a 280ms»: FaqList.tsx:28 calcola delay={startDelay + i * 45}, quindi nelle liste lunghe il ritardo supera 280 ms.
### P2 — Una curva per gesto: fondere i quattro «out» (fase 2, piccolo cambio visibile) [needs-alberto]
kind=refine-existing sticky=False files=app/components/motion/TextLines.tsx, app/globals.css, app/components/motion/RotatingMark.tsx, app/case-vendute/CaseVenduteContent.tsx, app/components/LazyYouTubeEmbed.tsx, app/components/PropertyCard.tsx, DESIGN.md, docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md, .impeccable/design.json dir=C06 (solo i tempi, il verso resta),A17,DESIGN.md:306/496/529,spec §3.5
ADATTAMENTO: DECISIONE DI LAVORO (D) da proporre ad Alberto, dopo P1.

1. Ingressi di testo.
   - TextLines.tsx:103-104: 1.05 expo.out → dur.long 1.2 "dtOut" (= animatore p di Era: durL, Out).
   - DESIGN.md:306 lo dice già; va corretto DESIGN.md:496.
   - Lo stagger resta 0.09, o 0.1 = Era.
2. Reveal.
   - globals.css:511: --ease-out-expo → --ease-dt-out, durata sempre --dur-reveal 0.9.
   - Non 1.2: rallenterebbe circa 146 blocchi.
   - out-expo e dtOut hanno la stessa coda; dtOut parte un filo meno secca.
3. Hover e UI.
   - 0.2, 0.25, 0.35 e 0.4 → --dur-micro 0.3 con --ease-domus: .dt-btn (1457-1460), .dt-social (1608-1613), tooltip (1639), link-draw (685), link-underline (653).
   - Gli zoom al passaggio 700, 1200 e 1600ms → --dur-long 1.2 con --ease-out-expo (CaseVenduteContent.tsx:291, LazyYouTubeEmbed.tsx:59, PropertyCard.tsx:131).
   - Le transizioni di solo colore restano col default di Tailwind.
4. Monogramma.
   - RotatingMark.tsx:74: rampa 0.3 "domus" → dur.micro "dtOut".
   - RotatingMark.tsx:80: decadimento 1.1 "domus" → dur.long "dtOut" (Era README §5: 0.3 Out, 1.2 Out).
   - Il verso orario resta intatto (C06); si allineano DESIGN.md:529 e C06 nel registro (1.1 s → 1.2 s).
5. Cosa resta com'è.
   - StarReviews: timeline scrubbata in unità proprie, film a sé (A12).
   - BeforeAfter: stato di un cursore.
   - Preloader: orologio presidiato.
6. Documenti.
   - spec:190-191: «stagger 80 ms» e «cubic-bezier(.2,.65,.3,1)» → i valori veri.
   - .impeccable/design.json:334-380.

Reduced-motion invariato: il kill globale in globals.css:554-560 e i rami MQ.motionOk.
RISCHI: Il cambio si vede: titoli un po' più lunghi (+0,15 s), zoom delle card più corti (1,6 → 1,2 s), monogramma che torna a riposo in 1,2 s. Va misurato con Playwright headless (pellicola di un titolo prima e dopo), l'unico metodo affidabile per il motion secondo la memoria. / Nessun e2e misura i tempi: la regressione sarebbe solo percettiva. / È una D che cambia la sensazione di tutto il sito: mostrarla ad Alberto prima del merge.
TEST: app/lib/__tests__/motion-tokens.test.ts / e2e/motion.spec.ts (deve restare verde)
VERDETTO: È un cambio visibile della sensazione di tutto il sito. Titoli da 1.05 s expo.out a 1.2 s dtOut su 32 chiamanti, curva di 146 Reveal, zoom delle card da 1.6 a 1.2 s, curva di CaseVendute da soft a out-expo, monogramma a 1.2 s dtOut. La proposta stessa dice di mostrarlo ad Alberto. Nessuna direttiva C lo vieta: il verso orario di C06 resta, e A17 mette le ease di era-residence nel perimetro di tecnica. Però tocca il feel di gesti che Alberto ha rivisto l'11 settembre, e i documenti si contraddicono proprio su quale sia la curva «vera» dei titoli: DESIGN.md:306 dice dtOut, DESIGN.md:496 e .impeccable/design.json dicono expo.out, il codice fa expo.out. Scegliere quale dei due diventa la verità è una decisione da prendere con lui, non un allineamento. La proposta ha anche un'incoerenza interna e un'attribuzione sbagliata.

Da chiedere ad Alberto, con due pellicole Playwright (prima e dopo) di un titolo, un Reveal e il monogramma su /vendi a 1440 e 390: «I titoli devono entrare con la curva del riferimento (1,2 s, Out 0.25,1,0.5,1) o restare come oggi (1,05 s expo.out)? Il monogramma deve tornare a riposo in 1,2 s come era-residence o in 1,1 s? Gli zoom al passaggio sulle card da 1,6 s a 1,2 s vanno bene?» Le sole correzioni documentali della spec §3.5 (stagger 80 ms e la bezier inesistente) non richiedono la risposta: vanno in P6, allineate al codice di oggi.
CONDIZIONI: Se Alberto dice sì: correggere il blocco hover prima di implementare. .dt-btn (globals.css:1457-1460) e il colore dei link di Header.tsx:240 sono transizioni di SOLO colore, e la proposta dice che quelle «restano col default»: vanno tolte dalla lista, oppure la regola va riscritta. / Non attribuire a C06 i tempi del decadimento: il registro §11.1 C06 non cita 1.1 s. Si aggiorna solo DESIGN.md:529. / Misurare con Playwright headless la pellicola di un titolo, di un Reveal e del monogramma prima e dopo, come da memoria. Nessun e2e misura i tempi. / StarReviews, BeforeAfter e il preloader restano fuori, come dichiarato.
EVIDENZE: DESIGN.md:306 («i testi che salgono per righe con la curva `dtOut` (§7)») contro DESIGN.md:496 («1.05 s expo.out, stagger 0.09 s») / app/components/motion/TextLines.tsx:103-104 (duration 1.05, ease "expo.out") / .impeccable/design.json:356-359 (expo.out per TextLines) e 351-354 (dtOut solo per preloader e hero) / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:370 (C06: nessuna menzione di 1.1 s) / app/globals.css:1457-1460 (.dt-btn: background-color, color e border-color 0.25s ease, cioè solo colore) / app/components/motion/RotatingMark.tsx:72-80 (0.3 "domus", dur.transition "domus") / reverse-engineering/era-residence/js/main.pretty.js:2858-2863 (durL 1.2, "Out" 0.25,1,0.5,1)
ERRORI DI FATTO: «si allineano DESIGN.md:529 e C06 nel registro (1.1 s → 1.2 s)»: la riga C06 del registro (spec:370) non contiene il tempo di decadimento. Solo DESIGN.md:529 e .impeccable/design.json (dur-transition) lo citano. / La lista hover mette .dt-btn (1457-1460) fra le transizioni da portare a --dur-micro/--ease-domus, ma quelle di .dt-btn sono di solo colore, che la stessa proposta dice di lasciare al default.
### P3 — Reveal: uscita rapida sul posto (animatore ctn di Era) e rete guardata [adopt-with-conditions]
kind=refine-existing sticky=False files=app/components/Reveal.tsx, app/globals.css dir=replay «richiesta cliente 2026-08-04» (Reveal.tsx:31; non è nel registro §11: resta rispettato, rigioca nei due versi),C03 (nessun gesto nuovo),DESIGN.md:496 («reversibile all'uscita»),DESIGN.md:573
ADATTAMENTO: DOVE: app/globals.css:508-540 e app/components/Reveal.tsx.

1. Due transition, una per stato. In CSS vince la transition dello stato d'ARRIVO.
   - Stato base .reveal, cioè l'uscita quando si toglie .is-in:
     transition: opacity var(--dur-exit) var(--ease-dt-in), transform 0s linear var(--dur-exit);
     Il blocco sfuma in 0.4s con curva In SENZA muoversi, come ctn in Era (y→0). Solo a opacità 0, dopo 0.4s, torna di scatto a translateY(2.5rem), pronto per il prossimo fade-up.
   - .reveal.is-in, cioè l'ingresso, identico a oggi:
     transition: opacity var(--dur-reveal) var(--ease-out-expo) var(--reveal-delay,0ms), transform var(--dur-reveal) var(--ease-out-expo) var(--reveal-delay,0ms);
2. Il ritardo vale solo in ingresso.
   - Reveal.tsx:56: style={{transitionDelay}} → style={{'--reveal-delay': `${delay}ms`}}.
   - Come in Era, dove hide ha delay 0.
3. Verso.
   - Durante l'uscita si muove solo l'opacità. Rispetta la regola «cliccabili: solo opacity»: Reveal avvolge link ghost e CTA (Voci.tsx:168-175, PageHero.tsx:127-131).
   - Opzione b2: quando l'IO spegne con entry.boundingClientRect.top < 0 (uscita dal bordo alto), scrivere data-from="top", e in CSS .reveal[data-from="top"]:not(.is-in){transform:translateY(-2.5rem)}.
   - Rientrando dall'alto il blocco SCENDE al suo posto invece di salire. Lo scatto resta invisibile e il replay nei due versi resta.
4. Rete guardata (Reveal.tsx:44).
   - Un ref seen, messo a true quando isIntersecting.
   - Timeout a 2,5 s: if (!seen.current && el.getBoundingClientRect().top < window.innerHeight) setShown(true). Stesso patto di HorizonScroller.tsx:156-161.
   - Oggi il primo ingresso sotto la piega non si vede per chi arriva dopo 2,5 s.
5. will-change.
   - Togliere globals.css:515-517, oppure limitarlo a .reveal:not(.is-in):not([data-seen]).
   - Con il replay oggi ripromuove ogni blocco uscito; il browser promuove comunque i livelli durante la transition di transform/opacity.
6. Reduced-motion.
   - In globals.css:534-540 aggiungere .reveal, .reveal.is-in {transition:none}: la regola .reveal.is-in nuova ha specificità 0,2,0 e batterebbe .reveal.
   - @media (scripting:none) resta invariato.

Breakpoint: tutti, senza soglie, come oggi. H1 e foto dell'hero non sono in Reveal.
RISCHI: Rientrando entro 0,4 s .is-in torna a metà sfumata: il transform è ancora 0 (lo scatto è ritardato), quindi l'opacità risale senza salti. Da verificare scorrendo avanti e indietro velocemente con Playwright. / La rete guardata cambia il comportamento visibile: i primi ingressi sotto la piega, che oggi non si vedono, torneranno a vedersi. / Turbopack e CSS stale: toccare globals.css e ricaricare prima di misurare. / La variante b2 aggiunge un attributo scritto dall'IO a ogni uscita: niente scroll listener, ma un re-render in più.
TEST: e2e/motion.spec.ts (righe 22-56, devono restare verdi) / nuovo e2e con motion ok: un .reveal a cinque schermate sotto resta a opacity 0 a 3 s con scrollY 0, e arrivandoci anima
VERDETTO: Il cuore della proposta è una correzione, e la diagnosi è esatta. Reveal.tsx:44 fa setShown(true) a 2,5 s senza guardia. L'observer ha già notificato isIntersecting=false, quindi a 2,5 s ogni Reveal sotto la piega passa a .is-in fuori campo, e al primo arrivo nel viewport la notifica true non cambia lo stato: il primo fade-up non si vede. È la regola (3) della memoria («i failsafe temporizzati vanno guardati o uccidono il replay dopo 2,5 s»), già applicata in HorizonScroller.tsx:149-161. Anche la meccanica CSS regge: vince la transition dello stato d'arrivo. Una transition di transform a 0 s con ritardo 0,4 s viene annullata se .is-in torna prima dello scatto, perché il valore corrente è ancora 0, quindi nessun salto. L'uscita a sola opacità, più corta e senza ritardo, rispetta la regola «cliccabili: solo opacity» e riduce il movimento invece di aggiungerlo. Nessuna sezione sticky, nessun gesto nuovo, reduced-motion coperto.

La variante b2 invece aggiunge un verso d'ingresso nuovo: dall'alto il blocco scende. È una variazione che né era-residence (ctn entra sempre dal basso, main.pretty.js:550-586) né goldengoal hanno, quindi va tolta. Due effetti collaterali vanno gestiti. La rete guardata eseguita una volta sola perde i blocchi che non raggiungono mai il rapporto 0.12. E la correzione rende di nuovo visibili i primi ingressi di tutti i blocchi sotto la piega: è il comportamento documentato (DESIGN.md:496), ma visivamente è più movimento di oggi e va detto.
CONDIZIONI: Togliere la variante b2 (data-from="top" e translateY(-2.5rem)): è un verso d'ingresso nuovo che il riferimento non ha. / La rete guardata non deve perdere i blocchi che non arrivano mai a intersectionRatio 0.12 (alti più di circa 7,7 viewport con rootMargin −8%), per esempio con threshold [0, 0.12] e accensione quando isIntersecting e intersectionRect.height ≥ 0.12 × rootBounds.height. Oppure con un controllo al primo isIntersecting, non solo al timeout di 2,5 s. / La regola nuova .reveal.is-in con transition (specificità 0,2,0) va neutralizzata nel blocco reduced-motion (globals.css:534-540) con `.reveal, .reveal.is-in { transition: none }`. e2e/motion.spec.ts:22-56 deve restare verde. / In Reveal.tsx la custom property inline va tipizzata (style={{ ['--reveal-delay' as string]: `${delay}ms` } as React.CSSProperties}), e senza delay non va scritto nessuno style. / will-change: togliere .reveal:not(.is-in) (globals.css:515-517), coerente con la lezione di globals.css:1782-1789. Misurare i livelli promossi sulla home prima e dopo. / Verificare con Playwright headless (motion ok) tre casi: (a) un .reveal a cinque schermate sotto resta a opacity 0 dopo 3 s con scrollY 0 e anima quando lo si raggiunge; (b) su-giù rapido entro 0,4 s non dà salti di transform; (c) FaqList (delay = startDelay + i×45) non accumula ritardi in uscita. Toccare globals.css e ricaricare prima di misurare (Turbopack). / Se in futuro si aggiungesse --dur-exit, farlo insieme a P1 con il consumatore in questo commit. Altrimenti restano valori letterali 0.4s e cubic-bezier(0.5,0,0.75,0) con il commento che cita main.pretty.js:568-577.
EVIDENZE: app/components/Reveal.tsx:34-44 (IO senza unobserve; setTimeout(() => setShown(true), 2500) non guardato) / app/components/motion/HorizonScroller.tsx:149-161 (la stessa svista misurata e corretta con la guardia) / memoria domus-wow-layer.md, voce «Replay bidirezionale globale», regola (3) sui failsafe temporizzati / app/globals.css:508-521 (una sola transition sullo stato base) e 534-562 (reduced-motion e kill globale) / reverse-engineering/era-residence/js/main.pretty.js:550-586 (animateCtn: reveal y 3.333rem, hide opacity 0 con y 0rem, durS, In, delay 0) / app/components/PageHero.tsx:131-135 (Reveal delay 200 attorno a Cta, un blocco cliccabile) / e2e/motion.spec.ts:22-43 (accetta transform none o matrix identità)
ERRORI DI FATTO: «Reveal avvolge link ghost e CTA (Voci.tsx:168-175, …)»: in Voci.tsx:168-175 i due Reveal avvolgono due <p> (voto e lead), non link né CTA. Il caso vero è PageHero.tsx:131-135.
### P4 — TextLines: l'uscita di Era diventa il comportamento di tutti i titoli [needs-alberto]
kind=refine-existing sticky=False files=app/components/motion/TextLines.tsx, app/lib/motion/gsap.ts, DESIGN.md dir=replay «richiesta cliente 2026-08-04» (TextLines.tsx:5-6),A15,A17 (dossier §7),DESIGN.md:496
ADATTAMENTO: DOVE: app/components/motion/TextLines.tsx.

1. Un solo ramo.
   - Togliere il ramo toggleActions "restart none none reverse" (109-118) e usare per tutti il ramo a trigger separato (121-165). exit diventa il default, oppure si toglie la prop.
   - Oggi nessuno dei 32 chiamanti la passa.
2. Uscita = animatore p di Era (main.pretty.js:532-541):
   gsap.to(self.lines, { yPercent: -110, duration: dur.exit (0.4), ease: "dtIn" (0.5,0,0.75,0, al posto di power2.in), stagger: stagger/2 (0.045), delay: 0, overwrite: true })
   - Le righe escono dall'alto della maschera, verso opposto all'arrivo: 112→0→-110.
   - Lo scatto -110→112 al restart succede dentro la maschera (mask:"lines"), quindi non si vede.
3. Ingresso invariato.
   - Oggi 1.05 expo.out, oppure dur.long dtOut se passa P2.
   - Sempre reveal.restart(), mai play().
4. Inneschi.
   - onEnter → enter; onLeaveBack → leave; start "top 86%".
   - onEnterBack (156) guardato: () => { if (reveal.progress() < 1) enter(); }. Oggi ripartirebbe da 112 su un titolo già fermo in vista in alto.
5. Reti.
   - Oltre a if (st.isActive) enter() (164): else if (st.progress === 1) reveal.progress(1).
   - Il fromTo con paused ha immediateRender e nasconde le righe allo split: un titolo già scavalcato (ancora nell'URL, split tardivo dopo fonts.ready, ri-split al resize) non deve restare a 112 quando si risale.
   - Il comportamento delle callback alla creazione con scroll già oltre la fine va misurato: la doc Context7 non lo specifica.
6. Pulizia.
   - out e st vengono già uccisi in onSplit (95-98) e nel cleanup (172-183); revertOnUpdate resta.

Reduced-motion: tutto resta dentro mm.add(MQ.motionOk) (66), testo statico. Nessuna soglia di larghezza, come oggi: sul telefono la stessa uscita, senza scroll-hijack.

H1 di PageHero (PageHero.tsx:84): in cima alla pagina onLeaveBack non può scattare, quindi nessuna uscita. Resta il problema preesistente dell'H1 interno nascosto dallo split, da trattare a parte (regola «H1 mai nascosto»).
RISCHI: Cambiano insieme 32 titoli: verificare la pellicola su home, /vendi e /metodo. / ScrollTrigger è poco affidabile in fondo alla home sotto runway lunghe (memoria domus-motion-architecture). TextLines vive anche in StarReviews.tsx, Voci.tsx:165 e Team.tsx: il cambio non peggiora, ma una rete a IntersectionObserver come Reveal andrebbe valutata. / PageHero.tsx:84 mette l'H1 interno dentro TextLines: rischio LCP preesistente, da non allargare. / autoSplit al resize ricrea le righe mentre un'uscita può essere in corso: out.kill() in onSplit c'è già e va mantenuto.
TEST: e2e/motion.spec.ts (reduced-motion, deve restare verde) / nuovo e2e con motion ok: risalendo, un h2 in TextLines porta le .tl-line a transform con yPercent negativo entro 0,6 s
VERDETTO: Tecnicamente la proposta, così com'è scritta, rompe i titoli. Chiede `overwrite: true` sulla tween d'uscita, «= animatore p di Era». In GSAP 3.15.0 un tween creato con overwrite:true chiama _globalTimeline.killTweensOf(targets) (gsap-core.js:2405-2408), e getTweensOf senza onlyActive include anche i tween in pausa (1820). Tween.kill(targets,"all") con target coincidenti azzera _pt e fa _interrupt (2592-2594). restart() rimette il tween nella timeline (1204) ma non lo reinizializza: il reveal persistente in pausa diventa un tween vuoto. Dopo la prima uscita le righe restano a yPercent −110, dentro la maschera, cioè invisibili, per sempre. In Era overwrite:true è innocuo perché ogni reveal crea un fromTo NUOVO (main.pretty.js:527-541). Il ramo `exit` di oggi (TextLines.tsx:141-146) non usa overwrite ed è corretto.

Nel merito cambia in modo visibile il comportamento di tutti i 32 titoli. Con start "top 86%" l'uscita scatta quando il titolo è ancora sullo schermo, nel 14% basso, e le righe volano verso l'alto invece di riscendere. Il default «reverse» è stato tenuto di proposito quando è nata la prop (TextLines.tsx:36-37). Soprattutto, la base del replay è la «richiesta cliente 2026-08-04», che sta solo nei commenti e nella memoria. Il registro §11 dichiara di contenere tutte le direttive vive («più le due di agosto ancora vive»: C19 e C20) e il replay non c'è. Era stessa non esce allo scroll nei reveal generici (once:true, main.pretty.js:908-917; README §7 riga 335): l'uscita esiste solo in tre capitoli scelti. Estenderla a tutti i titoli va oltre il riferimento di tecnica.

Da chiedere ad Alberto: «Il replay a ogni passaggio nei due versi (2026-08-04, oggi solo nei commenti) è ancora una direttiva viva? Se sì, risalendo i titoli devono uscire verso l'alto in 0,4 s come nei capitoli scelti di era-residence, o riscendere come oggi? Se no, i titoli entrano una volta sola come nel riferimento (once)?»
CONDIZIONI: In ogni caso NIENTE overwrite:true sulla tween d'uscita se il reveal resta un tween persistente riavviato con restart(): ucciderebbe il reveal (gsap-core.js:2405-2408, 2592-2594). Tenere lo schema attuale out?.kill() + reveal.pause(), oppure ricreare il fromTo d'ingresso a ogni enter come fa Era. / Guardia su onEnterBack (enter solo se reveal.progress() < 1) e rete di creazione per un trigger già oltre la fine (st.progress === 1 → reveal.progress(1)), misurata con Playwright caricando la pagina con un'ancora sotto un titolo e risalendo. ScrollTrigger non lancia callback durante il refresh (ScrollTrigger.js:1100, stateChanged && !_refreshing). / Escludere dall'uscita, o verificare a 1440, il TextLines dentro lo schermo sticky di StarReviews (StarReviews.tsx:707): un trigger su un figlio di una sticky in una runway da 360svh può scattare a metà film. Per la memoria ScrollTrigger in fondo alla home è inaffidabile: aggiungere una rete a IntersectionObserver o a timeout guardato, perché oggi un titolo che non riceve il trigger resta a 112. / L'H1 di PageHero.tsx:84-86 resta nascosto dallo split fino al trigger: violazione preesistente della regola «H1 mai nascosto», da non allargare e da trattare a parte. / Pellicola prima e dopo su home, /vendi e /metodo, a 1440 e 390.
EVIDENZE: node_modules/gsap/src/gsap-core.js:2405-2408 (overwrite === true → _globalTimeline.killTweensOf(parsedTargets)) / node_modules/gsap/src/gsap-core.js:1820 (getTweensOf: `!onlyActive || child.isActive()`, include i tween in pausa) / node_modules/gsap/src/gsap-core.js:2576-2594 (kill: _arraysMatch → this._pt = 0; _interrupt) / node_modules/gsap/src/gsap-core.js:1204 e 1359-1363 (restart riaggiunge al _dp, nessuna reinizializzazione) / app/components/motion/TextLines.tsx:130-146 (reveal fromTo paused + leave senza overwrite) e 36-37 (default volutamente storico) / reverse-engineering/era-residence/js/main.pretty.js:908-917 (reveal allo scroll once:true, start "top bottom") e 2574-2585, 2770-2778, 2798-2809 (hide solo in tre trigger) / reverse-engineering/era-residence/README.md:335 / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:337 («più le due di agosto ancora vive») e 363-384 (nessuna voce sul replay) / app/components/StarReviews.tsx:704-712 (TextLines dentro [data-sr-el] nello schermo sticky)
ERRORI DI FATTO: Uscita «= animatore p di Era (main.pretty.js:532-541) … overwrite: true» come riproduzione sicura: in Era ogni reveal crea un tween nuovo, qui si riavvia un tween persistente. Con overwrite:true il reveal viene svuotato (_pt = 0) e i titoli non rientrano più. / «Reveal usa IntersectionObserver… una rete a IntersectionObserver come Reveal andrebbe valutata» è presentata come rischio che «non peggiora»: TextLines non ha oggi alcuna rete, quindi un titolo che non riceve il trigger in fondo alla home resta nascosto già oggi, e il ramo unico lo eredita.
### P5 — Uscite asimmetriche nei reveal GSAP con replay (HorizonScroller, card, righe dati) [needs-alberto]
kind=refine-existing sticky=False files=app/components/motion/HorizonScroller.tsx, app/components/ListingsGrid.tsx, app/components/PropertySearch.tsx, app/contatti/ContattiContent.tsx, app/case/[slug]/PropertyDetail.tsx dir=A12 (set piece rivoluto da Alberto: cambiarne l'uscita va detto a lui),regola di lavoro 2026-08-04 «card cliccabili: solo opacity» (memoria domus-wow-layer.md:49; ListingsGrid.tsx:30-33),replay «richiesta cliente 2026-08-04»
ADATTAMENTO: 1. HorizonScroller, blocchi.
   - Ramo sotto 1024: 129-144. Ramo lg: 453-470.
   - back non fa più tw.reverse() ma:
     out = gsap.to(el, { opacity: 0, duration: dur.exit, ease: "dtIn", overwrite: true, onComplete: () => gsap.set(el, { y: REVEAL_Y, pointerEvents: "none" }) })
   - Sfuma sul posto (ctn di Era). pointerEvents va a none solo a fine uscita, quindi le tre CTA del capitolo non si spostano sotto il dito.
   - play e la rete focusin fanno out?.kill() prima di tw.restart() o tw.progress(1).
2. HorizonScroller, caratteri del manifesto (242 e 554).
   - Uscita = animatore h di Era (main.pretty.js:483-493):
     gsap.to(split.chars, { autoAlpha: 0, yPercent: -50, rotateY: -90, duration: dur.exit, ease: "dtIn", stagger: stagger.chars/4 (0.015), overwrite: true })
   - Il restart della tween d'ingresso riparte dagli stati registrati (yPercent 50, rotateY 90).
   - Solo dentro il set piece (A12): nessun carattere ruotato altrove.
3. HorizonScroller, sipario (358, 599). Era slide nasconde a durata piena.
   - Uscita: clipPath inset(0% 0% 0% 100%), che si chiude verso destra proseguendo la corsa, con img scale 1→1.15, dur.reveal 0.9, ease "domus.inOut" (≈ InOut di Era).
   - A clip chiusa, gsap.set a inset(0% 100% 0% 0%) per il prossimo ingresso.
   - Variante prudente: lasciare il reverse.
4. Card.
   - ListingsGrid.tsx:47-53 e PropertySearch.tsx:662-668: onLeaveBack da dur.short/"domus" a dur.exit/"dtIn", sempre solo opacity, senza stagger.
   - La rete guardata c'è già (ListingsGrid.tsx:69-71).
   - PropertySearch.tsx:614 (onLeave del Flip, senza ease): ease "dtIn", dur.micro.
5. Righe dati.
   - ContattiContent.tsx:99-115 (reverse di 0.6 con y 10) e PropertyDetail.tsx:331-351 (reverse di 0.3 con y 8): trigger separato con uscita a sola opacity, dur.exit o dur.micro con dtIn.
   - PropertyDetail era dichiarato senza motion (memoria): valutare di non toccarlo.
6. BeforeAfter.tsx:190 resta reverse: è lo stato del divisore, non un testo.

Breakpoint: i due rami di HorizonScroller (MQ.lg e sotto) ricevono la stessa uscita. Nessuna sticky nuova: #storia resta uno dei tre nastri. Reduced-motion invariato, tutto sotto motionOk.
RISCHI: Uscita e restart sugli stessi target nello stesso tick: uccidere sempre out prima di restart(), altrimenti due tween si contendono opacity/yPercent (stesso problema risolto in TextLines.tsx:121-129). / Sul desktop i trigger dei blocchi "track" usano containerAnimation: onLeaveBack scatta quando il blocco torna oltre left 85%. Verificare che lo stato finale del sipario non resti chiuso a fine nastro. / autoAlpha sui caratteri va bene (niente link nell'h2); sui blocchi con CTA mai autoAlpha (HorizonScroller.tsx:443-452). / Le reti focusin devono completare anche con un'uscita in corso.
TEST: e2e/motion.spec.ts (colonna completa con reduced-motion) / e2e del filtro della ricerca (regressione «filtro comune» sulle card)
VERDETTO: Due ragioni separate.

(1) Il codice proposto ha lo stesso difetto di P4, qui più grave. `out = gsap.to(el, {opacity: 0, …, overwrite: true})` ha lo stesso target del tween d'ingresso persistente `tw` (HorizonScroller.tsx:129-136, 459-466). `gsap.to(split.chars, {autoAlpha: 0, …, overwrite: true})` ha gli stessi target di `charTween` (226-234, 538-546). L'overwrite svuota quei tween (gsap-core.js:2405-2408, 2592-2594). Dopo la prima risalita i blocchi restano a opacity 0 con pointerEvents none, quindi le tre CTA del capitolo (/acquista, /recensioni, YouTube) sono invisibili e non cliccabili. Il manifesto resta ad autoAlpha 0. Le reti non salvano niente: focusin fa tw.progress(1) su un tween vuoto, e il timeout mobile esce perché progress() > 0.

(2) Nel merito cambia l'uscita di un set piece voluto da Alberto (A12): caratteri che escono ruotando a −90, sipario che si chiude verso destra con zoom a 1.15. La proposta stesso lo dice («cambiarne l'uscita va detto a lui»). Il sipario, che «prosegue la corsa», è una geometria d'uscita nuova. Il ritocco al Flip dei filtri (PropertySearch.tsx:614) non è un'uscita allo scroll: allunga l'uscita dei filtri da 0.25 a 0.3 s senza motivo legato all'idea e tocca il percorso dell'e2e «filtro comune» (e2e/search.spec.ts:35). Le card (ListingsGrid, PropertySearch) creano già un tween nuovo a ogni passaggio con overwrite:true, quindi lì il cambio a dur 0.4 con In sarebbe tecnicamente sicuro.

Da chiedere ad Alberto: «Nei pannelli di Perché Domus Tua, risalendo, i blocchi e il manifesto devono uscire rapidi come in era-residence (0,4 s, lettere che ruotano via, sipario che si chiude proseguendo) o riavvolgersi come oggi? E il replay del 2026-08-04 è ancora vivo?»
CONDIZIONI: Mai overwrite:true sulle uscite che condividono i target con un tween d'ingresso persistente (tw, charTween, stl). Uccidere l'uscita con out?.kill() prima di restart(), oppure ricreare l'ingresso a ogni passaggio. / Togliere dalla proposta PropertySearch.tsx:614 (onLeave del Flip dei filtri): non è un'uscita allo scroll e tocca e2e/search.spec.ts:35. / Lasciare PropertyDetail e BeforeAfter come sono. / Se Alberto approva solo le card: onLeaveBack a 0.4 s con curva In, sola opacità, senza stagger, in ListingsGrid.tsx:47-53 e PropertySearch.tsx:662-668. È sicuro perché ogni passaggio crea un tween nuovo. / Sipario e caratteri: verificare a 1440 con containerAnimation che a fine nastro, e dopo una risalita oltre left 85%/90%, lo stato finale non resti chiuso. Verificare anche il ramo sotto i 1024 con la rete focusin durante un'uscita in corso.
EVIDENZE: app/components/motion/HorizonScroller.tsx:129-144 e 453-479 (tw persistente, restart/reverse, rete focusin tw.progress(1)) / app/components/motion/HorizonScroller.tsx:223-243 e 535-555 (charTween persistente) / app/components/motion/HorizonScroller.tsx:158-161 e 248-257 (reti con progress() > 0 → return) / node_modules/gsap/src/gsap-core.js:2405-2408, 1820, 2592-2594 / app/components/ListingsGrid.tsx:35-53 (tween nuovo con overwrite:true a ogni onEnter/onLeaveBack) / app/components/PropertySearch.tsx:599-615 (onLeave appartiene a Flip.from dei filtri) / e2e/search.spec.ts:35 («il filtro comune restringe davvero l'elenco») / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:401 (A12)
ERRORI DI FATTO: «Il restart della tween d'ingresso riparte dagli stati registrati»: vale solo se l'uscita non svuota quel tween. Con overwrite:true sulla tween d'uscita (gli stessi split.chars) il charTween perde le PropTween e restart() non rende più nulla. / «PropertySearch.tsx:614 (onLeave del Flip, senza ease)» è trattato come un'uscita replay allo scroll, ma è l'uscita delle card nel FLIP dei filtri.
### P6 — Documenti allineati al lessico e alla regola d'uscita [adopt-with-conditions]
kind=docs-only sticky=False files=DESIGN.md, docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md, .impeccable/design.json, app/lib/motion/gsap.ts dir=A17,C03,spec §11.2
ADATTAMENTO: 1. DESIGN.md, sezione Motion. Una tabella dei token con, per ognuno, nome CSS, nome GSAP, valore, ruolo e sorgente Era: durS/durL, Out/In/InOut, righe 2858-2863 di main.pretty.js.
2. La regola d'uscita: più corta dell'ingresso (0.4 contro 0.9/1.2), curva In, nessun ritardo, stagger dimezzato; verso opposto per le righe in maschera, sfumata sul posto per blocchi e card.
3. Correggere le contraddizioni:
   - DESIGN.md:306 contro :496 (dtOut contro expo.out);
   - DESIGN.md:529 (decadimento 1.1 s);
   - spec §3.5, righe 190-191 (stagger 80 ms e una bezier che non esiste);
   - il commento di gsap.ts:7-18;
   - .impeccable/design.json:334-380.
4. Aggiungere al registro §11.2 una voce D16 («lessico dei tempi e uscita asimmetrica, tecnica di era-residence §7»).
5. Annotare che il replay nei due versi del 2026-08-04, citato nel codice come richiesta della cliente, non ha una voce nel registro: va aggiunto con la fonte, o chiesto.
RISCHI: Le attribuzioni vanno controllate sul registro §11 prima di scrivere «la cliente ha chiesto»: il replay del 2026-08-04 viene da commenti e memoria, non dal registro.
VERDETTO: Allineare i documenti al codice è la convenzione del repo: commit 161cff8 e 30b5600, «i commenti dicono com'è fatto oggi». Le contraddizioni elencate sono vere: DESIGN.md:306 contro :496, spec:190-191 con stagger 80 ms e una bezier (.2,.65,.3,1) che non compare nel codice (grep vuoto), il commento di gsap.ts:7-18. È vero anche che il replay del 2026-08-04 non ha una voce nel registro: grep di «08-04» in spec, DESIGN.md e PRODUCT.md vuoto, mentre la spec:337 dice che il registro contiene «tutte le direttive … più le due di agosto ancora vive». Portare la domanda in §11.3 è la mossa giusta, e da quella risposta dipendono P3, P4 e P5. Due punti però scriverebbero nei documenti cose che il codice non fa: la regola d'uscita e la voce D16. Il registro D registra decisioni prese costruendo, con la ragione nel commit.
CONDIZIONI: Correggere i documenti al codice di OGGI, non al codice proposto. DESIGN.md:306 dice expo.out, 1.05 s (TextLines.tsx:103-104), a meno che P2 non sia già stato approvato da Alberto e mergiato. Spec:190-191: stagger 0.09 s e curve reali (expo.out per TextLines, --ease-out-expo 0.9 s per Reveal), togliendo cubic-bezier(.2,.65,.3,1). / Tabella dei token e «regola d'uscita» in DESIGN.md solo per ciò che è mergiato. Nessuna regola d'uscita prima che P3, P4 o P5 esistano nel codice. / D16 nel registro §11.2 solo dopo il commit che la applica, con le parole del commit e il suo hash, secondo il formato delle altre voci. / Il replay del 2026-08-04 va in §11.3 come domanda aperta (numero 12). Per ora nessuna voce C: la fonte è la memoria di progetto (domus-wow-layer.md, «Replay bidirezionale globale … direttiva cliente») e i commenti, non un transcript citato. Chiedere ad Alberto se è ancora vivo dopo C03. / Non ripetere in DESIGN.md le parole della cliente: il registro sta solo nella spec (spec:352-353).
EVIDENZE: DESIGN.md:306 e DESIGN.md:496 / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:190-192, 337-353, 413-430 (D01-D15 con commit) / Grep «0\.2, *0\.65|\.2, *\.65» in app: nessuna occorrenza / Grep «08-04|replay|rigioc» in spec, DESIGN.md e PRODUCT.md: nessuna occorrenza / app/components/Reveal.tsx:31-33, TextLines.tsx:5-6, ListingsGrid.tsx:30 (il replay attribuito alla cliente solo nei commenti) / .impeccable/design.json:334-380 (motion)
ERRORI DI FATTO: 
ESCLUSO: Transizioni di pagina SPA costruite con le primitive d'uscita (hide di tutto il visibile, poi fade durM In; Barba, main.pretty.js:150-219) — Le transizioni di pagina sono vietate: PageTransition è uno stub, e il dossier §8 è escluso esplicitamente dal perimetro di era-residence (registro A17, DESIGN.md:306). (C01)
ESCLUSO: Uscite ruotate per carattere su titoli e corsivi di tutto il sito (a: rotateX -90, x -10rem; h: rotateY -90, yPercent -50) — Aggiungerebbe un quarto gesto oltre ai tre ammessi (DESIGN.md:573) e riporterebbe le lettere a flip tolte nel giro della rivista bianca. La rotazione resta ammessa solo dentro il manifesto di HorizonScroller (set piece A12), dove P5 ne rispecchia l'uscita. (C03)
ESCLUSO: Un'apertura e un'uscita diverse per ogni immagine (sipario, poligono slide con scale 1.5 e xPercent 25, zoom), una geometria per sezione — Sono gesti nuovi: la spec §3.5 e DESIGN.md:573 limitano il movimento a Reveal/TextLines/Parallax e ai tre nastri. Il sipario esiste solo nel pannello del territorio. (C03)
ESCLUSO: «Nessuna sezione condivide la stessa animazione» (easing, durata e trigger diversi per capitolo) — È l'opposto del contratto della spec §3.0/§3.5 (spec:188-193): una sola cellula di capitolo con gli stessi gesti ovunque, e un riferimento visivo con poche animazioni. Il lessico condiviso (P1) si prende dall'articolo; la varietà per capitolo no. (C03)
ESCLUSO: Uscite con traslazione su card cliccabili e blocchi con CTA (ctn con y, card che scivolano via) — Una card che trasla mentre l'utente clicca fa mancare il bersaglio: regressione e2e «filtro comune» (memoria domus-wow-layer.md:49; ListingsGrid.tsx:30-33; PropertySearch.tsx:644-648). Le uscite di P3 e P5 sono a sola opacità. (D (regola di lavoro 2026-08-04: card e blocchi cliccabili solo opacity))
ESCLUSO: Stato iniziale nascosto via CSS prima dello split (data-prevent-flicker con visibility:hidden, dossier §6.2) — Gli stati nascosti si mettono solo via JS: il testo deve stare visibile nell'HTML iniziale per SEO, no-JS e LCP (DESIGN.md:573; PRODUCT.md:43). (DESIGN.md Do: stati nascosti solo via JS)
ESCLUSO: Monogramma che inverte il verso quando si scorre all'indietro (dir = segno di velocity, README §5) — Il cuore gira sempre in senso orario e non si inverte mai (RotatingMark.tsx:63-64; registro C06). Dal riferimento si prendono solo i tempi (rampa 0.3, decadimento 1.2 Out, in P2). (C06)
ESCLUSO: Riportare il film del preloader sui token durS/durM/durL del lessico — La durata è una scelta di prodotto già presa: «stesso film di oggi ma dimezzato», TEMPO=1, 4,63 s, con la domanda aperta 5 su «come prima». In più intro-clocks.test.ts presidia ogni orologio e ogni bezier letterale. (A02)
