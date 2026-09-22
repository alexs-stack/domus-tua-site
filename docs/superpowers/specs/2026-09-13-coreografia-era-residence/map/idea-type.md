# type
## currentState
1) TITOLI = TextLines (app/components/motion/TextLines.tsx).
- Split: SplitText `type:"lines"`, `mask:"lines"`, `linesClass:"tl-line"`, `aria:"none"`, `autoSplit:true` con `onSplit` (78-90). Lo split parte solo dopo `document.fonts.ready` (76).
- Animazione: da `yPercent 112` a 0, `duration 1.05`, `ease "expo.out"`, `stagger` di default 0.09 (51, 100-107).
- Innesco: ScrollTrigger `start "top 86%"`, `toggleActions "restart none none reverse"` (110-117).
- Gate: solo `MQ.motionOk` (66), nessun limite di larghezza.
- Cambio lingua: `key={locale}` sul tag (195) più `dependencies [delay, stagger, exit, locale]` con `revertOnUpdate` (191). Cleanup esplicito perché tutto nasce in async (170-183).
- Modalità `exit` (39-44, 121-165): scritta coi valori dell'hide di Era (0.4 s, yPercent -110, power2.in, stagger/2), nata in fb5af77 il 6 agosto. Nessun chiamante la usa: la grep multilinea `<TextLines … exit` non trova niente.
- La rete di sicurezza (`st.isActive`, 164) esiste solo nel ramo exit; il ramo di default non ne ha.
- Circa 30 call site, sempre col titolo fuori dal Reveal. Esempi: Posizionamento.tsx:104, HorizonStory.tsx:177, StarReviews.tsx:707, Voci.tsx:165, Paths.tsx:219 e h3 d3 :249, Method.tsx:200 e h3 d2 :239, Services.tsx:268, Team.tsx:183/187, Contact.tsx:715, PageHero.tsx:84 (h1), ContattiContent.tsx:138 (h1).

2) PARAGRAFI ED EYEBROW = Reveal (app/components/Reveal.tsx).
- IntersectionObserver `threshold 0.12`, `rootMargin "0px 0px -8% 0px"`, che accende e spegne a ogni passaggio (34-39); rete a 2500 ms (44).
- CSS in globals.css:508-521: opacity 0 più translateY(2.5rem), transition 0.9 s `var(--ease-out-expo)`. Forzato a riposo con `scripting:none` (526-532) e con reduced-motion (534-539).
- Il commento a Reveal.tsx:15 dice ancora «de-blur», ma la sfocatura è stata tolta in 7d2d1d8.
- La cellula (DESIGN.md:496): eyebrow in Reveal, titolo in TextLines, `p.lead` in Reveal con delay 120. Esempi: Posizionamento.tsx:101-109, PageHero.tsx:76-86 e 127-129.
- Stili: `.eyebrow` a globals.css:456-468 (16 px, peso 500, 0.12em, rosso); `.lead` a globals.css:332-341 (`--text-lead` clamp(1.35rem,1.72vw,1.55rem) definito a :144, peso 300, 38ch); scala d1/d2/d3 a globals.css:136-141, varianti mobile a :293-295.

3) ACCENTO = `.script-word` (globals.css:351-368: Pinyon rosso, `--text-script` clamp(2.6rem,7vw,7rem) a :150, rientro -0.2em, sempre aria-hidden). Quattro usi, tre comportamenti:
- hero: lettere rese dal server (Chars, HeroCinematic.tsx:169-200) che entrano con `opacity 0, x "6vw"` → 0, 1.4 s `dtOut`, stagger 0.07, a 0.85 s (267-271, 290-300);
- HorizonStory.tsx:180-184 e Method.tsx:251-252: fade-up di Reveal;
- PageHero.tsx:95-102: ferma.

4) HERO DELLA HOME.
- Lockup e H1 spezzati in lettere nel server; stato a opacity 0.02 dipinto (CSS globals.css:1178-1184, JS :253).
- Lockup: `yPercent 50` → 0, 1.4 s dtOut, stagger 0.08 (263-289). H1: stagger 0.032 a 0.7 s (301-311). Testo leggibile nello sr-only (499-503).
- Candidato LCP: la foto della banda con `preload` (415-429).

5) DOVE IL FLIP PER LETTERA SOPRAVVIVE OGGI.
- Sipario, in CSS: `dt-pre-char` perspective(800px) translateY(50%) rotateY(90deg) e `dt-pre-schar` translateX(6vw) rotateX(90deg) (globals.css:907-923), presidiati da intro-clocks.test.ts:319-321.
- Manifesto (h3 d2 `data-horizon-reveal="chars"`, HorizonStory.tsx:251): SplitText `words,chars`, `autoAlpha 0, yPercent 50, rotateY 90, transformPerspective 800` → 1.2 s `dtOut`, stagger 0.03. Innesco `top 55%` sul desktop e `top 70%` sul telefono, reverse risalendo (HorizonScroller.tsx:517-555 e 204-243). Classi `.dt-hword`/`.dt-hchar` a globals.css:1778-1792.
- Nel film delle stelle i caratteri del titolo entrano stirati, scaleY 8 (StarReviews.tsx:337, 462-471).

6) gsap.ts.
- Token: dur (85-91), stagger lines 0.11 e chars 0.06 (94-99), `dtOut` 0.25,1,0.5,1 (73). SplitText è registrato fuori dal modulo comune (32-35); MQ a 131-141.
- La lingua dei tempi del testo non è una sola: TextLines usa expo.out 1.05 con stagger 0.09, Reveal ease-out-expo a 0.9 s, hero e manifesto dtOut a 1.2-1.4 s.
- Anche i documenti si contraddicono: DESIGN.md:306 dice che le righe salgono «con la curva dtOut»; DESIGN.md:496 ed .impeccable/design.json:358 dicono expo.out 1.05; la spec :190-191 dice stagger 80 ms e cubic-bezier(.2,.65,.3,1).

7) CHI HA TOLTO IL FLIP.
- CharFlip nacque in 89919f0 (6 agosto: «NESSUNA SCRITTA ERA ANIMATA», porting dell'animatore «h» di Era con prospettiva) e fu cancellato col redesign (spec:273, 285).
- Le lettere dell'hero hanno perso rotateY/rotateX, e il reveal la sfocatura, in 7d2d1d8 (10 settembre, 22:09, «le correzioni del reviewer di finitura»: «Le lettere dell'hero entrano salendo, senza flip; il reveal perde la sfocatura»). Il reviewer è quello di Impeccable lanciato dal piano (docs/superpowers/plans/2026-09-10-rivista-bianca.md:864). Il commento nel codice dice «niente flip: tre gesti soli, come il riferimento» (HeroCinematic.tsx:228). Quel riferimento è goldengoal: split heading dal basso, fadeInUp sui paragrafi, parallasse (reverse-engineering/goldengoal/README.md:126-129).
- Non è una direttiva C né A: nel registro §11 non c'è nessuna riga su flip o lettere. È quindi una decisione di lavoro (D) non registrata, presa prima di A15 (11 settembre), A16 (preloader «come prima», che ruota ancora le lettere) e A17 (13 settembre).
- La sfocatura resta vietata anche da C14 e DESIGN.md:417.

8) TRAPPOLE APERTE.
- TextLines usa ScrollTrigger anche sotto la corsa di 360svh delle stelle: page.tsx:80-91 monta lì Voci, Paths, Method, OpenDomus, DomusDocProtocol, Services, CostiChiari, FeaturedTestimonial, Social, Team e Contact, tutti con TextLines. La memoria di progetto dice che laggiù i trigger arrivano sfasati, ed è per questo che Reveal usa un IntersectionObserver.
- Nessun test e2e verifica le righe con motion attivo: in e2e c'è solo il commento a motion.spec.ts:26, e il test 22-43 gira con reduced motion.
- Gli H1 di PageHero (PageHero.tsx:84, 11 pagine) e di /contatti (ContattiContent.tsx:136-140) sono TextLines: dipinti dall'HTML, poi nascosti a yPercent 112 dopo fonts.ready e rivelati. È un lampo visibile→nascosto→visibile sopra la piega, in tensione con «H1 mai nascosto». Su /contatti non c'è un'immagine prima dell'H1 (131-143): probabile candidato LCP, da misurare.
## eraExact
Fonti: reverse-engineering/era-residence/README.md §7 (:320-335) e js/main.pretty.js:401-690.

COSTANTI (README.md:89-92): durS 0.4, durM 0.8, durL 1.2, stagger 0.1, delayReveal 0.3. Ease: Out 0.25,1,0.5,1 (è il nostro dtOut), In 0.5,0,0.75,0, InOut 0.75,0,0.25,1. html{font-size:1vw} (README.md:34), quindi `x:"10rem"` in JS vale 10vw.

«a» = ACCENTO CALLIGRAFICO (animateTextA, main.pretty.js:401-452)
- Split: `type:"chars"`, `smartWrap:true`.
- Reveal: fromTo `opacity 0, rotateX 90, x "10rem", transformOrigin "center bottom"` → `opacity 1, rotateX 0, x "0rem"`, `duration 1.2`, `delay (r ?? 0.3) + i*0.1`, `stagger 0.1`, `ease "Out"`, `overwrite:true` (414-428).
- Hide: `opacity 0, rotateX -90, x "-10rem"`, origin "center top", 0.4 s, stagger 0.05, "In" (431-441). Lo stato initial coincide con l'hide (443-449).
- Nel markup html/ «a» compare 8 volte, solo sulle calligrafie `.a1/.a2` («Estepona», «yours», «Live in», «The»).

«h» = TITOLI (animateTextH, 454-503)
- Split: `type:"words,chars"`, smartWrap.
- Reveal: `opacity 0, yPercent 50, rotateY 90` → 0, 1.2 s, stagger 0.05, "Out" (468-481).
- Hide: `yPercent -50, rotateY -90`, 0.4 s, stagger 0.025, "In" (484-493).
- 43 occorrenze, su h1-h4 e sulle caps c1.

«p» = PARAGRAFI E ETICHETTE (animateTextP, 505-548)
- Split: `type:"lines,words"`, `mask:"lines"`; i `<br>` singoli vengono raddoppiati (515-517).
- Reveal: `yPercent 110` → 0, 1.2 s, stagger 0.1, "Out" (521-530).
- Hide: `yPercent -110`, 0.4 s, stagger 0.05, "In" (533-541).
- 77 occorrenze, anche su etichette `.l1` e `.h5`, non solo sul corpo.

«ctn» = BLOCCHI (550-586): `opacity 0, y 3.333rem` sul desktop / `11.54rem` sul mobile → 0; in hide sfuma sul posto.

CSS (css/inline/06-initials-split.css)
- `.split-line/.split-word/.split-char { display:inline-block; will-change:transform }` (16-21).
- I char di `.a1/.a2` hanno padding con margine negativo compensato, per non tagliare le grazie dello script (42-54).
- In tutta css/ non c'è nessuna `perspective` (grep): le rotazioni di Era sono piatte, uno schiacciamento. Noi usiamo transformPerspective 800 (HorizonScroller.tsx:530, globals.css:910).

INNESCO
- ScrollTrigger per elemento con `start:"top bottom", once:true`; negli scroller orizzontali `containerAnimation` con `start:"left bottom"` (README.md:335).
- Allo scroll, quindi, Era NON fa uscire i testi risalendo: `hide` serve all'uscita delle transizioni di pagina Barba (`animateVisibleElements(container,"hide")`, main.pretty.js:674-690; README.md:341) e ai cambi di slide/tab (`data-slider`, `data-tab`).
- Anti-flicker: `[data-prevent-flicker]{visibility:hidden}` sui testi dell'hero (README.md:295, 352).

CORREZIONE ALL'ARTICOLO: il «ruotano da 90° con 10rem di offset orizzontale» che attribuisce ai titoli è l'animatore «a», la calligrafia. I titoli («h») ruotano su Y con yPercent 50 e nessun offset orizzontale.
### T1-lingua-dei-tempi — Una sola lingua dei tempi per i tre ruoli del testo [adopt-with-conditions]
kind=tokens-or-infra sticky=False files=app/lib/motion/gsap.ts, app/components/motion/TextLines.tsx, app/globals.css, DESIGN.md, .impeccable/design.json, docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md dir=C03,A15,A17,D (DESIGN.md:496, tempi di TextLines)
ADATTAMENTO: DOVE
- app/lib/motion/gsap.ts: aggiungere un blocco `text` accanto a `dur` e `stagger`, senza cambiare i token esistenti usati altrove: `text.dur = 1.2` (durL di Era), `text.hide = 0.4`, `text.stagger = 0.1`, `text.after = 0.3` (delayReveal, per i blocchi dopo il titolo). Ease unica `dtOut` (già a gsap.ts:73).
- TextLines.tsx: `duration 1.05 → text.dur`, `ease "expo.out" → "dtOut"`, `yPercent 112 → 110` (valore di Era «p»), stagger di default `0.09 → 0.1`. `start "top 86%"` invariato.
- globals.css: nuovo token `--ease-dt-out: cubic-bezier(0.25,1,0.5,1)` usato da `.reveal` (:511) al posto di `--ease-out-expo`. Durata 0.9 s invariata: il blocco resta più corto delle righe.
- Hero: già dtOut a 1.4 s, non si tocca.

COSA NON CAMBIA: nessun gesto nuovo, nessuna geometria nuova. Cambia solo la curva, che diventa quella che DESIGN.md:306 dichiara già.

REDUCED-MOTION: nessun effetto. TextLines non parte e `.reveal` è forzato a riposo (globals.css:534-539). Mobile: stessi valori.

DOCUMENTI: allineare DESIGN.md:306 e :496, .impeccable/design.json:358 e spec §3.5 (:190-191) al numero scelto.
RISCHI: 1.2 s contro 1.05 allunga ogni titolo di 150 ms: su 16 capitoli la pagina può sembrare più lenta, e la cliente ha chiesto meno animazioni (C03). Misurare prima e dopo con Playwright headless. / Cambiare la curva di `.reveal` tocca tutte le pagine. Gli screenshot e2e sono darwin-only e non si verificano su Windows. / Turbopack serve la CSS con un'edizione di ritardo (memoria): toccare globals.css, aspettare e ricaricare prima di giudicare.
TEST: e2e/motion.spec.ts:22-43 (reduced motion, atteso invariato) / e2e/__screenshots__ (darwin)
VERDETTO: Lo stato attuale descritto è corretto. TextLines anima da yPercent 112 a 0 in 1.05 s con expo.out, stagger 0.09, trigger top 86% e toggleActions restart/reverse (TextLines.tsx:51, 100-117). `.reveal` dura 0.9 s con --ease-out-expo (globals.css:508-521; il token è a :167). Anche la contraddizione fra documenti è vera: DESIGN.md:306 dice dtOut, DESIGN.md:496 e design.json:358 dicono expo.out 1.05, la spec :190-191 dice cubic-bezier(.2,.65,.3,1) e stagger 80 ms.

Non aggiunge gesti né sticky. Cambia però un valore D (DESIGN.md:496) visibile su ogni titolo e su ogni Reveal del sito.

Il cambio non è «solo la curva». Allunga ogni riga di 150 ms. In più dtOut (0.25,1,0.5,1) arriva a riposo più tardi di expo.out (0.16,1,0.3,1): la pagina si sente più lenta, contro lo spirito di C03.

La curva di spec §3.5 è quella di goldengoal (C02): scegliere dtOut è una scelta A17 e va dichiarata come tale. Nessun test si rompe, perché la suite gira con reducedMotion reduce (playwright.config.ts:36).
CONDIZIONI: Primo commit: si allineano i documenti al codice di oggi (DESIGN.md:306 e :496, design.json:358, spec :190-191). Il cambio di valori viene dopo e a parte. / Nessun allungamento: TextLines resta a 1.05 s o meno anche con dtOut, `.reveal` resta a 0.9 s. Portare le righe a 1.2 s rallenta la pagina: va chiesto ad Alberto (C03). / Niente token `text.after = 0.3` in gsap.ts: Reveal ritarda in ms via CSS (Reveal.tsx:56) e un token GSAP non lo pilota. / In spec §3.5 va scritto, con la data, che per i testi la curva di goldengoal è superata dalla tecnica di A17. Non si corregge in silenzio. / Filmino prima/dopo con Playwright headless, motion attivo e fixture goto (salta il sipario, e2e/helpers.ts:120-130), su un titolo della home e su /vendi. Dopo ogni modifica a globals.css, ricaricare (Turbopack serve CSS vecchia).
EVIDENZE: app/components/motion/TextLines.tsx:51,100-117 / app/globals.css:167,508-521 / app/lib/motion/gsap.ts:73,85-99 / DESIGN.md:306,496,573 / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:190-191 / playwright.config.ts:36 / reverse-engineering/goldengoal/README.md:127-129
ERRORI DI FATTO: «Cambia solo la curva»: la proposta cambia anche la durata (1.05→1.2), yPercent (112→110) e lo stagger (0.09→0.1). / `text.after = 0.3` «per i blocchi dopo il titolo»: quei blocchi sono Reveal CSS con ritardi in ms (Reveal.tsx:56), che un token di gsap.ts non tocca.
### T2-textlines-io — TextLines innescato da IntersectionObserver, con rete di sicurezza e un test a motion attivo [adopt-with-conditions]
kind=tokens-or-infra sticky=False files=app/components/motion/TextLines.tsx, e2e/motion.spec.ts dir=Regola «ScrollTrigger inaffidabile in fondo alla home» (memoria domus-motion-architecture),C03 (invariata)
ADATTAMENTO: DOVE: TextLines.tsx, ramo di default (110-118).

TECNICA
- Via `scrollTrigger:{start:"top 86%", toggleActions:"restart none none reverse"}`; al suo posto un IntersectionObserver sull'elemento, stesso schema di Reveal.tsx:34-44.
- Tween creato in `onSplit` con `paused:true` e restituito, così autoSplit continua a ripulirlo e risincronizzarlo.
- IO con `threshold 0` e `rootMargin "0px 0px -14% 0px"` (equivale a top 86%).
- `isIntersecting` → `tween.restart()`. Uscita dal basso (`entry.boundingClientRect.top > entry.rootBounds.bottom`) → `tween.reverse()`. Uscita dall'alto → niente. È il comportamento di oggi, senza ScrollTrigger.
- Rete guardata a 2500 ms: se `tween.progress() === 0` e il blocco ha già passato la quota, `restart()`.
- L'IO nasce dentro `mm.add(MQ.motionOk)` e si disconnette nel cleanup (172-183) e a ogni ri-split.
- Il ramo `exit`, inutilizzato, resta su ScrollTrigger o si toglie (T6).

TEST: nuovo e2e a motion attivo (suite del sito, porta 3177), con sessione `dt-intro-seen` per saltare il sipario. Scorrere oltre la corsa delle stelle fino a `#servizi h2` e `#contatti h2` e aspettarsi che ogni `.tl-line` abbia transform identità entro 2 s.

Nessun gesto nuovo, nessuno sticky. Reduced-motion invariato.
RISCHI: Il rootMargin percentuale segue il viewport: sul telefono la barra URL sposta l'innesco di qualche pixel (ScrollTrigger aveva `ignoreMobileResize`, gsap.ts:46). Accettabile per un reveal. / Un TextLines dentro il track orizzontale (containerAnimation) non passerebbe dall'IO. Oggi non ce n'è (il manifesto ha il suo split, HorizonStory.tsx:251): da ricontrollare a ogni nuovo uso. / Il test a motion attivo deve neutralizzare il preloader, altrimenti misura la porta.
TEST: e2e/motion.spec.ts (nuovo test a motion attivo) / e2e/mobile-motion.spec.ts (nessuna asserzione sul numero di trigger: `__dtST` non è letto da e2e né da scripts)
VERDETTO: I fatti reggono. Tutti i capitoli montati sotto StarReviews (page.tsx:80-91) usano TextLines con ScrollTrigger, e la memoria (domus-motion-architecture.md:26) segnala trigger sfasati sotto le corse lunghe. Nessun e2e verifica le righe a motion attivo (playwright.config.ts:36 imposta reduce ovunque). `__dtST` e `tl-line` non compaiono in e2e né in scripts. autoSplit ripulisce e ricrea la tween ritornata da onSplit (doc GSAP SplitText, context7).

Però il trap non è riprodotto nella pagina di oggi. La memoria cita Paths a 520vh, che con la rivista bianca non esiste più. La rotaia del team, sotto le stelle, usa ScrollTrigger e funziona, ricalcolando su refreshInit (HorizontalRail.tsx:93-106).

La migrazione descritta NON è «il comportamento di oggi». Con threshold 0, `isIntersecting` torna vero anche quando il blocco rientra dall'alto. `restart()` rifarebbe allora il reveal risalendo, mentre oggi onEnterBack è `none` (TextLines.tsx:115): più movimento, contro C03.

C'è anche il titolo delle stelle (StarReviews.tsx:704-712), dentro un wrapper `data-sr-el` pilotato dallo scrub dentro lo schermo sticky. Con un IO le righe salirebbero appena lo schermo entra, a wrapper ancora spento, e mancherebbero il beat.
CONDIZIONI: Prima il test, poi la migrazione. Nuovo e2e con `reducedMotion: no-preference` e fixture goto, a 1440 e a 390. Si scorre oltre #recensioni fino a `#servizi h2` e `#contatti h2`, e ogni `.tl-line` deve avere transform identità entro 2 s. Si migra solo se il test fallisce con ScrollTrigger. / Semantica di oggi rispettata: restart solo entrando dal basso (bordo alto sotto la quota, oppure tween.progress() === 0), reverse solo uscendo dal basso, nulla entrando o uscendo dall'alto. / Il TextLines di StarReviews.tsx:707 va controllato a mano sul desktop: deve arrivare col beat finale dello scrub. Se l'IO lo anticipa, quel call site resta su ScrollTrigger o riceve un'opzione dedicata. / L'IO nasce dentro mm.add(MQ.motionOk) e si disconnette nel cleanup. La rete a 2500 ms interviene solo se il blocco ha passato la quota e la tween è ferma a 0. / Nessun TextLines dentro il track di HorizonScroller: oggi è così (HorizonStory.tsx:177 sta fuori dal track), e va scritto nel commento del componente.
EVIDENZE: app/components/motion/TextLines.tsx:109-118 / app/components/Reveal.tsx:34-44 / app/page.tsx:80-91 / app/components/StarReviews.tsx:704-712 / app/components/motion/HorizontalRail.tsx:93-106 / playwright.config.ts:36 / e2e/helpers.ts:120-130 / C:/Users/alber/.claude/projects/C--Users-alber-domus-tua-site/memory/domus-motion-architecture.md:26 / https://gsap.com/docs/v3/Plugins/SplitText (autoSplit, onSplit che ritorna l'animazione)
ERRORI DI FATTO: «È il comportamento di oggi, senza ScrollTrigger»: con `isIntersecting → restart()` il reveal si rifà anche rientrando dall'alto, mentre oggi toggleActions ha onEnterBack `none` (TextLines.tsx:115). / Il rischio sul track orizzontale è mal posto. L'IO misura la geometria resa con i transform, quindi un elemento traslato nel track verrebbe osservato; il problema vero è il rootMargin verticale, non il fatto che l'IO «non passi».
### T3-h1-sopra-la-piega — Gli H1 sopra la piega non passano mai per lo stato nascosto [adopt-with-conditions]
kind=refine-existing sticky=False files=app/components/motion/TextLines.tsx dir=Regola «hero image + H1 mai nascosti» (memoria domus-motion-architecture),C03,D15 (PageHero)
ADATTAMENTO: DOVE: TextLines.tsx, dentro `onSplit`, dopo fonts.ready. Riguarda di fatto PageHero.tsx:84 (11 pagine interne) e ContattiContent.tsx:138. L'hero della home non usa TextLines e tiene il suo rito.

TECNICA
- Se al momento dello split l'elemento è già nel viewport (`el.getBoundingClientRect().top < innerHeight`) e non è mai stato rivelato: `tween.progress(1)`, invece di partire da yPercent 110.
- Niente lampo visibile→nascosto→visibile. Ai passaggi successivi il replay torna normale: uscita dal basso = reverse, rientro = restart.
- Variante da decidere con Alberto: prop `still` per `as="h1"` che salta del tutto lo split.

EFFETTI
- Reduced-motion e no-JS erano già statici.
- Toglie un'animazione, non ne aggiunge (in linea con C03).
- SEO: il testo resta nell'HTML.
- LCP: l'H1 di /contatti, probabile candidato, non viene più nascosto dopo il primo paint. Misurare con Lighthouse mobile prima e dopo.
RISCHI: Le pagine interne perdono l'ingresso del titolo al primo caricamento: se per Alberto fa parte del «come prima», va chiesto. / Con un'ancora nell'URL o Lenis che ripristina lo scroll, la pagina può aprirsi già scrollata: il controllo va fatto sulla posizione reale al momento dello split, non al mount.
TEST: e2e/motion.spec.ts / e2e/pages.spec.ts (H1 visibile) / nuovo controllo a motion attivo: `/contatti h1 .tl-line` senza transform al caricamento
VERDETTO: Il problema è reale nel codice. Gli H1 di PageHero (PageHero.tsx:84, 11 pagine) e di /contatti (ContattiContent.tsx:138) arrivano dipinti dall'HTML. Dopo l'idratazione e fonts.ready vengono portati a yPercent 112 dentro la maschera, cioè nascosti, e poi risalgono. È in tensione con la regola «Hero image + H1 mai nascosti» (domus-motion-architecture.md:19). Su /contatti prima dell'H1 non c'è un'immagine (ContattiContent.tsx:131-143). La home evita il lampo con lo stato 0.02 messo prima del paint (globals.css:1176-1184).

Toglie un movimento, quindi va nella direzione di C03, e non tocca sticky né porta. È comunque un cambio visibile della cellula D (DESIGN.md:496) e del replay chiesto dalla cliente il 2026-08-04, citato in TextLines.tsx:5-6 ma non registrato in §11.

La tecnica scritta non funziona da sola. Un ScrollTrigger creato quando lo scroll è già oltre `top 86%` diventa attivo alla creazione e la toggleAction `restart` riporta le righe a 112: `tween.progress(1)` in onSplit viene sovrascritto. Il flag «mai rivelato», se vive dentro onSplit, si perde a ogni ri-split di autoSplit.
CONDIZIONI: Prima misurare: filmino con Playwright headless, CPU rallentata 4x, /vendi e /contatti a 390 e 1440, motion attivo. Si procede solo se il frame visibile→nascosto esiste. Sul telefono misurare anche l'LCP di /contatti. / Implementazione che non passa dalla toggleAction iniziale: tween in pausa senza scrollTrigger quando l'H1 è già in viewport, oppure il ramo IO di T2 con un flag. Il flag vive fuori da onSplit, così sopravvive al ri-split. / Controllo sulla posizione reale al momento dello split, non al mount: ancora nell'URL o scroll ripristinato. / Ai passaggi successivi il replay resta quello di oggi: reverse uscendo dal basso, restart rientrando. / Si comunica ad Alberto nel riepilogo. Se per lui l'ingresso dei titoli interni fa parte del look, l'alternativa è lo stato dipinto prima del paint della home (0.02 via script inline), non uno stato nascosto in CSS. / Nuovo controllo e2e a motion attivo: `/contatti h1 .tl-line` senza transform subito dopo lo split.
EVIDENZE: app/components/PageHero.tsx:81-88 / app/contatti/ContattiContent.tsx:131-143 / app/components/motion/TextLines.tsx:5-6,76,109-118 / app/globals.css:1176-1184 / C:/Users/alber/.claude/projects/C--Users-alber-domus-tua-site/memory/domus-motion-architecture.md:19 / DESIGN.md:496 / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:162 (D15)
ERRORI DI FATTO: La tecnica proposta (`tween.progress(1)` dentro onSplit) viene annullata dalla toggleAction `restart` di ScrollTrigger (TextLines.tsx:112-116), che scatta alla creazione se lo scroll ha già passato lo start. Da sola non toglie il lampo.
### T4-accento-per-lettere — La parola Pinyon dei capitoli entra per lettere, come la firma dell'hero (Era «a», senza flip) [needs-alberto]
kind=new-gesture sticky=False files=app/components/motion/ScriptChars.tsx (nuovo) oppure app/components/motion/TextLines.tsx, app/components/HorizonStory.tsx, app/components/Method.tsx, app/globals.css, DESIGN.md dir=C03,DESIGN.md:573 (tre gesti),D 7d2d1d8 (senza flip),C12 (è testo, non un ornamento disegnato),A15,A17
ADATTAMENTO: DOVE: solo `.script-word` di HorizonStory.tsx:180-184 e Method.tsx:251-252 (i tre atti, in home con `compact` e su /metodo). PageHero.tsx:95-102 resta ferma: è sopra la piega, stessa logica di T3.

TECNICA
- Primitiva `ScriptChars` in app/components/motion/, oppure prop `role="accent"` di TextLines.
- Split dopo fonts.ready: `SplitText.create(el,{type:"chars", smartWrap:true, tag:"span", charsClass:"dt-schar", aria:"hidden"})`. Lo span è già aria-hidden.
- Animazione: fromTo `opacity 0, x "6vw"` → `opacity 1, x 0`, `duration 1.4` (dur.hero), `ease "dtOut"`, `stagger 0.07`. Sono i valori della firma dell'hero (HeroCinematic.tsx:267-300), non i 10rem / 1.2 / 0.1 di Era.
- Sotto 768 px (`MQ.belowDesktop`) x = 3vw, perché la parola ha `pl-[14vw]`.
- Niente rotateX (decisione 7d2d1d8).
- Niente maschera: la calligrafia attraversa la linea di base del titolo (`--script-tuck`, globals.css:361-366) e una maschera le taglierebbe le aste. Era deve compensare con padding negativi (06-initials-split.css:42-54).
- Innesco: IntersectionObserver come Reveal (Method sta sotto la corsa delle stelle), `delay 0.3` dopo l'ingresso del titolo (delayReveal di Era), reverse risalendo come TextLines.
- CSS: `.dt-schar { display:inline-block }`, senza will-change permanente (lezione di globals.css:1782-1789).
- Solo `MQ.motionOk`: con reduced-motion o senza JS nessuno split, la parola resta intera e ferma.
- Lingua: `key={locale}` più deps `[locale]` con `revertOnUpdate`, come TextLines (191-195).

BUDGET: resta un accento per capitolo, rosso, mai sopra una foto. I punti animati non aumentano (queste parole fanno già fade-up); cambia la geometria. Rispetto ai «tre gesti» di DESIGN.md:573 è l'estensione ai capitoli di un gesto che oggi vive solo nel rito dell'hero: va scritto in DESIGN.md e approvato da Alberto prima di costruirlo.
RISCHI: Pinyon Script è un corsivo legato: negli span inline-block perde crenatura e attacchi. La firma dell'hero lo accetta già (HeroCinematic.tsx:483), ma le parole dei capitoli nelle 5 lingue vanno guardate a occhio, con e senza split. / È un gesto in più rispetto ai «tre gesti», e la cliente ha chiesto meno animazioni (C03): senza il sì di Alberto non si costruisce. / Uno scivolamento orizzontale su una parola con rientro grande può sbordare a destra nelle larghezze intermedie: misurare a 768, 1024 e 1440.
TEST: e2e/a11y.spec.ts (span aria-hidden) / e2e/motion.spec.ts:29-31 (la parola esce da un `.reveal`) / nuovo test reduced-motion: parola intera e ferma
VERDETTO: È un gesto nuovo per i capitoli: la geometria per lettere oggi vive solo nel rito dell'hero (HeroCinematic.tsx:267-300). DESIGN.md:573 limita il movimento a tre gesti più nastri, monogramma e preloader, e C03 chiede meno animazioni. Nessuna direttiva lo vieta: la parola Pinyon è testo aria-hidden (DESIGN.md Don't), non un ornamento disegnato (C12). Allo stesso tempo nessuna direttiva lo concede, e rispetto alla rivista bianca è un'estensione visibile del movimento.

In Era l'accento «a» esiste (main.pretty.js:401-452, 8 occorrenze), ma con rotateX, che 7d2d1d8 ha tolto dall'hero.

Problemi tecnici. Oggi le due parole stanno dentro Reveal (HorizonStory.tsx:180-184, Method.tsx:251-252). La memoria vieta una primitiva animata dentro Reveal perché nasconde due volte (domus-wow-layer.md:28): il Reveal va tolto, non annidato. Il «delay 0.3 dopo l'ingresso del titolo» non si sincronizza: TextLines e un IO sono innescati in modo indipendente. Il corsivo legato spezzato in inline-block perde gli attacchi.

Domanda per Alberto: «Vuoi che la parola in corsivo rosso dei capitoli (quella di Perché Domus Tua e le tre parole d'atto del Metodo, in home e su /metodo) entri lettera per lettera scivolando da destra come la firma Raffaela Rizza dell'hero, senza rotazione, al posto del fade-up di oggi? Sarebbe un quarto gesto oltre ai tre di DESIGN.md.»
CONDIZIONI: Solo col sì esplicito di Alberto, poi scritto in DESIGN.md:573 e nel registro §11 come A. / Il Reveal intorno a `.script-word` va sostituito dalla primitiva, non tenuto attorno. / Innesco coerente con T2: IO, niente ScrollTrigger sotto la corsa delle stelle. Nessuna promessa di sincronia col titolo. / Controllo a occhio nelle 5 lingue a 768, 1024 e 1440, con e senza split (attacchi del Pinyon, sbordo a destra con pl-[14vw]). / Reduced motion e no-JS: nessuno split, parola intera e ferma.
EVIDENZE: app/components/HorizonStory.tsx:180-184 / app/components/Method.tsx:251-254 / app/metodo/MetodoContent.tsx:226 / app/components/HeroCinematic.tsx:267-300,483 / DESIGN.md:573 / reverse-engineering/era-residence/js/main.pretty.js:401-452 / C:/Users/alber/.claude/projects/C--Users-alber-domus-tua-site/memory/domus-wow-layer.md:28 / e2e/a11y.spec.ts:11
ERRORI DI FATTO: «Sotto 768 px x = 3vw perché la parola ha pl-[14vw]»: ce l'ha solo HorizonStory (:181), la parola del Metodo no (Method.tsx:252). / testsAffected «e2e/motion.spec.ts:29-31 (la parola esce da un .reveal)»: quel test gira su /vendi, dove la parola Pinyon è di PageHero e non sta in un Reveal. T4 non la tocca e il test non cambia. / testsAffected «e2e/a11y.spec.ts»: quel file gira con reduced motion (a11y.spec.ts:11), dove la primitiva non fa split, quindi non è toccato.
### T5-hero-continuita-sipario — Opzionale: le lettere dell'hero riprendono la geometria del sipario [needs-alberto]
kind=refine-existing sticky=False files=app/components/HeroCinematic.tsx, docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md dir=D 7d2d1d8 (reviewer di finitura),A16,A12,A15,A17,C03
ADATTAMENTO: CONDIZIONE: solo con il sì di Alberto.

DOVE: HeroCinematic.tsx:263-311.

TECNICA
- Lettere del lockup: rimettere `rotateY 90 → 0` con `transformPerspective 800`, insieme allo `yPercent 50 → 0` che c'è già.
- Firma: `rotateX 90 → 0`, `transformOrigin "center bottom"`, insieme a `x 6vw → 0`.
- Sono gli stessi stati di partenza delle keyframe del sipario (globals.css:907-923). Durate e stagger invariati: 1.4 s dtOut; 0.08 / 0.07 / 0.032.

L'ARGOMENTO MIGLIORE, perché 7d2d1d8 è una decisione di lavoro rivedibile
- Dopo di lei A16 ha rivoluto «come prima» l'ingresso del preloader, che ruota ancora le lettere (intro-clocks.test.ts:319-321).
- A12 ha riportato il manifesto, che le ruota (HorizonScroller.tsx:525-531).
- A15 e A17 hanno rimesso era-residence come riferimento di tecnica.
- Risultato oggi: il sipario gira le lettere e l'hero che le riceve alla porta no.

PERIMETRO: nessun gesto nuovo nel conteggio (è il rito d'ingresso esistente), nessuno sticky, nessun titolo di capitolo toccato.

REDUCED-MOTION: invariato. Il rito non parte e le lettere restano a opacità 1 (mobile-motion.spec.ts:1185).
RISCHI: Il reviewer di finitura l'aveva tolto leggendo goldengoal (C02) come «tre gesti soli»: riaprirlo senza Alberto sarebbe ribaltare una correzione. / Il lockup dell'hero è in `font-brand` extrabold (HeroCinematic.tsx:460), quello del sipario in Playfair (C18, domanda aperta 9): la stessa rotazione su due famiglie diverse può non leggersi come continuità. / transformPerspective su circa 40 span per 1.4 s nel primo schermo: controllare jank e INP sul telefono.
TEST: e2e/mobile-motion.spec.ts:212 e :1185 (opacità delle lettere dell'hero) / app/lib/__tests__/intro-clocks.test.ts (non toccato, ma il patto della porta va riverificato)
VERDETTO: I fatti reggono. 7d2d1d8 ha tolto rotateY/rotateX e transformPerspective dalle lettere dell'hero (diff su HeroCinematic.tsx; commento a :228). Il sipario ruota ancora le lettere, presidiato da intro-clocks.test.ts:319-321. Il manifesto le ruota (HorizonScroller.tsx:525-531). La correzione del flip non ha una riga in §11: il commit è citato solo per l'header (D14).

Rimettere il flip cambia però in modo visibile il primo schermo, e ribalta una correzione del reviewer di finitura. Quella correzione ha una base nel riferimento visivo C02: goldengoal fa entrare lettere e righe dal basso senza rotazione (goldengoal README.md:126). È un D rivedibile, ma sul primo schermo e contro C02 va deciso da Alberto. Il patto della porta non si tocca: i transform stanno sui char, non su antenati sticky.

Domanda per Alberto: «Nel sipario le lettere di Domus Tua e della firma entrano ruotando; quando la porta si apre, le stesse lettere dell'hero entrano solo salendo (lockup e H1) o scivolando (firma), senza rotazione, per la correzione del 10 settembre. Vuoi che l'hero riprenda la rotazione del sipario, per continuità, o resta senza flip come il riferimento visivo?»
CONDIZIONI: Solo col sì di Alberto, poi registrato in §11 (riga D della correzione più riga A della decisione). / Dire esplicitamente se anche le lettere dell'H1 (data-hero-tchar, stagger 0.032) tornano a ruotare: la proposta dà lo stagger ma non la rotazione. / Controllo del jank sul telefono su tutti gli span animati: lockup, firma e H1 sono ben più di 40. / Riverificare intro-clocks e mobile-motion.spec.ts:212 e :1185 (opacità delle lettere) senza toccare le asserzioni.
EVIDENZE: app/components/HeroCinematic.tsx:228,258-311,460-465,483 / app/globals.css:907-923 / app/lib/__tests__/intro-clocks.test.ts:319-321 / app/components/motion/HorizonScroller.tsx:525-531 / reverse-engineering/goldengoal/README.md:126 / docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:161 (D14 cita 7d2d1d8 solo per l'header) / e2e/mobile-motion.spec.ts:212,1185
ERRORI DI FATTO: «transformPerspective su circa 40 span»: lockup (8 lettere) più firma (13) fanno 21 span. Con le lettere dell'H1 si va ben oltre 40. Il numero non corrisponde a nessuna delle due letture.
### T6-registro-e-documenti — Registrare chi ha tolto il flip e allineare documenti e commenti al codice [adopt-with-conditions]
kind=docs-only sticky=False files=docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md, DESIGN.md, .impeccable/design.json, app/components/Reveal.tsx, app/components/motion/TextLines.tsx dir=Registro §11 (nuova riga D),A17
ADATTAMENTO: 1) REGISTRO: aggiungere in spec §11 una riga D datata 10 settembre per 7d2d1d8, con le sue parole («Le lettere dell'hero entrano salendo, senza flip; il reveal perde la sfocatura»). Fonte: il reviewer di finitura Impeccable (plan :864). Stato: Applicata. Nota: il flip sopravvive nel sipario (A16) e nel manifesto (A12).

2) TEMPI DEI TESTI: DESIGN.md:306 (dtOut), DESIGN.md:496 ed .impeccable/design.json:358 (expo.out 1.05, stagger 0.09) e spec :190-191 (80 ms, cubic-bezier(.2,.65,.3,1)) devono dire lo stesso numero, con T1 o senza.

3) COMMENTI: Reveal.tsx:15 dice «de-blur» (la sfocatura non esiste più); TextLines.tsx:28 cita «dossier §2.4», che nel README non esiste (il riferimento giusto è §7).

4) PROP `exit` di TextLines (39-44, 121-165): nessun chiamante dal 6 agosto (fb5af77). O si toglie, o si documenta perché resta spenta: allo scroll Era è `once:true` (README.md:335).

Nessun cambio visibile.
RISCHI: Alberto aggiorna spec e DESIGN.md dal portatile: prima `git fetch` e confronto con origin/claude/rivista-bianca (memoria). / Togliere `exit` rompe solo un eventuale uso in un branch non ancora mergiato.
VERDETTO: È utile e non cambia niente di visibile. La correzione del flip e della sfocatura in 7d2d1d8 non ha una riga in §11: il commit compare solo in D14, per l'header. I tempi dei testi sono in contraddizione fra DESIGN.md:306, DESIGN.md:496, design.json:358 e spec :190-191. Reveal.tsx:15 dice ancora «de-blur». La prop `exit` di TextLines non ha chiamanti: nessun `exit` entro 4 righe dai 32 `<TextLines`. È nata in fb5af77.

Non è però solo documentazione. I punti 3 e 4 toccano codice: commenti e, se si toglie `exit`, l'API di un componente. Nella nuova riga la sfocatura non va attribuita a C14: le parole esatte di C14 sono «VIGNETTATURA NO !». Il divieto del blur viene dalla regola del piatto di DESIGN.md (:417), che è una regola di lavoro.
CONDIZIONI: La riga nuova in §11.2 è una D (prossimo numero libero, D16), con le parole esatte del commit, fonte «reviewer di finitura Impeccable (piano :864)» e stato Applicata. Niente formula che la faccia sembrare chiesta dalla cliente o da Alberto. / Nella riga nessun richiamo a C14 per la sfocatura: il rimando è a DESIGN.md:417. / Rimozione di `exit` in un commit di codice separato, con typecheck e lint. In alternativa si tiene, con un commento che dica che allo scroll Era è once:true (README.md:335). / TextLines.tsx:28: si toglie solo «§2.4», che non esiste; «§7» c'è già. / Prima di toccare spec e DESIGN.md: git fetch e confronto con origin/claude/rivista-bianca, perché Alberto li aggiorna dal portatile.
EVIDENZE: docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md:161 (D14) / DESIGN.md:306,417,496 / /.impeccable/design.json:358 / app/components/Reveal.tsx:15 / app/components/motion/TextLines.tsx:28,39-44,121-165 / docs/superpowers/plans/2026-09-10-rivista-bianca.md:864 / reverse-engineering/era-residence/README.md:335
ERRORI DI FATTO: kind «docs-only» e «Nessun cambio visibile al codice»: i punti 3 e 4 modificano commenti e, eventualmente, l'API di TextLines. / «TextLines.tsx:28 cita dossier §2.4 ... il riferimento giusto è §7»: il commento dice già «§2.4 / §7», è sbagliato solo §2.4. / «7d2d1d8 non registrata»: il commit è già in §11.2 come D14 per l'header; manca solo la parte lettere senza flip e reveal senza sfocatura.
ESCLUSO: Flip per lettera su tutti i titoli d1/d2/d3 (animatore «h» di Era: words+chars, rotateY 90, yPercent 50, stagger 0.05) — - Sono circa 30 call site e la cliente ha chiesto meno animazioni.
- Il riferimento visivo anima i titoli per righe e lettere che salgono dal basso, non ruotando (goldengoal README.md:126).
- Il reviewer di finitura ha tolto il flip dall'hero (7d2d1d8).
- Costo: centinaia di span per pagina (il solo manifesto ne fa circa 68, HorizonScroller.tsx:175-185; misurati 252 livelli promossi e 432 MB sulla home, globals.css:1786-1787), e con `aria:"none"` si rischia la lettura lettera per lettera.
- Il flip resta una firma unica: il manifesto e il sipario. (C03; C02; D 7d2d1d8 (non registrata, vedi T6))
ESCLUSO: Titoli che ruotano di 90° con 10rem di spostamento orizzontale, come lo scrive l'articolo — - Nel sorgente è l'animatore «a», cioè la calligrafia (main.pretty.js:414-428), non i titoli.
- Sui titoli vale l'esclusione precedente.
- Sulla parola Pinyon sopravvive solo lo scivolamento, a 6vw (T4); la rotazione no. (C03; D 7d2d1d8 (senza flip))
ESCLUSO: Paragrafi .lead a righe dalla maschera (animatore «p» di Era: lines+words, yPercent 110, stagger 0.1) — - Il riferimento visivo anima i paragrafi con fadeInUp (goldengoal README.md:127) e la cellula di DESIGN.md:496 li affida a Reveal.
- I tre ruoli restano già distinti coi gesti esistenti: lettere per l'accento, righe per il titolo, blocco per il paragrafo.
- Un secondo split per capitolo su colonne da 38ch in 5 lingue moltiplica i ri-split di autoSplit.
- Aggiungerebbe altri ScrollTrigger proprio dove la memoria di progetto li dice inaffidabili. (C02; DESIGN.md:496 (decisione di lavoro sulla cellula); regola «ScrollTrigger in fondo alla home»)
ESCLUSO: Uscita specchiata di ogni testo risalendo, identica in tutte le sezioni — - Aggiunge movimento a ogni scroll all'indietro.
- Il dossier smentisce l'articolo: allo scroll Era rivela con `once:true` (README.md:335); `hide` serve alle transizioni di pagina e ai tab/slider (main.pretty.js:674-690, README.md:341).
- TextLines ha già `exit` coi valori di Era e nessuno lo usa. Oggi le righe ridiscendono sotto la maschera (reverse), e basta. (C03)
ESCLUSO: Riusare gli animatori di uscita per le transizioni fra pagine (SPA) — PageTransition è uno stub e le transizioni di pagina sono uno dei tre pezzi di era-residence esclusi esplicitamente. (C01; perimetro di A17 (dossier §8 escluso))
ESCLUSO: Nascondere i testi dell'hero in CSS prima dello split (`[data-prevent-flicker]{visibility:hidden}`, README.md:295, 352) — - Il testo deve restare leggibile nell'HTML iniziale, e gli stati nascosti si mettono solo via JS.
- L'hero della home tiene apposta le lettere a opacità 0.02, dipinte, con una rete a 3.33 s / 6 s (globals.css:1175-1184).
- visibility:hidden toglierebbe anche il testo al candidato LCP e ai lettori di schermo. (DESIGN.md:573 (stati nascosti solo via JS); regola LCP/SEO «H1 mai nascosto»)
### reinstate:Paragrafi .lead a righe dalla maschera (animatore «p» di Era) [needs-alberto]: L'esclusione cita C02, DESIGN.md:496 e la trappola di ScrollTrigger. Nessuna delle tre uccide l'idea. C02 è un riferimento visivo («pulito, scritte grandi...»), non una direttiva sul movimento. DESIGN.md:496 è una decisione di lavoro. La trappola si evita con un innesco IO (T2).

A17 mette esplicitamente nel perimetro il §7 del dossier di Era, «testi che salgono per righe», e in Era l'animatore «p» è proprio questo: lines+words, maschera, yPercent 110, 77 occorrenze (main.pretty.js:505-548). Righe che salgono è già uno dei tre gesti di DESIGN.md:573, quindi non nasce un gesto nuovo: cambia il gesto assegnato ai paragrafi.

Il cambio però è visibile su ogni paragrafo del sito. Moltiplica gli split (colonne da 38ch in 5 lingue, ri-split di autoSplit) e aggiunge movimento percepito (C03). Non si decide da soli.

Consiglio: resta fuori finché Alberto non lo chiede. Domanda per Alberto: «Vuoi che i paragrafi grandi (.lead) entrino a righe dalla maschera come i titoli, secondo la tecnica di Era, invece che a blocco col fade-up del riferimento visivo? Oggi i tre ruoli sono già distinti: lettere per l'hero, righe per i titoli, blocco per i paragrafi.» | Solo col sì di Alberto. / Innesco IO come Reveal (T2), mai ScrollTrigger sotto la corsa delle stelle. / aria none con testo leggibile nelle righe e revert al cambio lingua (key più deps con revertOnUpdate, come TextLines:191-195). / Mai annidato in Reveal: il Reveal del lead viene sostituito. / Misurare il numero di split e ri-split per pagina e il CLS su /vendi e sulla home.
