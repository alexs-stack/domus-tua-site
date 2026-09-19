**Rapporto di completezza sulle proposte era-residence per Domus Tua (lane type, timing, parallax, media, feedback, preloader)**

**A. Premesse non allineate fra le lane**

1. **Tre lane non hanno letto la scelta di Alberto del 13 settembre.**
   - memory/domus-coreografia-era.md:13-14 registra «Coreografia piena» e «Sticky dove serve». Dentro ci sono: un comportamento per capitolo, entrate e uscite speculari, monogramma sempre visibile «con cambio di tema sopra le foto», preloader corto alle ricariche, sei corridoi (tuffo, persiane 1,84, cartolina).
   - La stessa nota, a :22, dice di non rimettere in discussione il budget di movimento.
   - Le lane type, timing e feedback lo fanno lo stesso:
     - type esclude l'«uscita specchiata» per C03 e tratta T4 come «quarto gesto»;
     - timing P4/P5 chiedono se il replay è vivo, ed escludono «nessuna sezione condivide»;
     - feedback P2 chiede se Alberto vuole il monogramma fisso.
   - Anche parallax P2/P3/P4 nascono come «due momenti non sticky»; la correzione arriva solo nei verdetti.
   - Le domande ad Alberto vanno riscritte come domande di forma (quale capitolo, quale geometria, quale colore), non di budget.
   - Causa probabile: MEMORY.md non indicizza domus-coreografia-era.md, anche se il file è nella cartella memory/.

2. **La numerazione del registro entra in collisione.**
   - Oggi il registro si ferma ad A17 (spec:406), D15 (:429) e alla domanda 11 (:466). La memoria riserva A18 = Coreografia piena e A19 = Sticky dove serve (:16).
   - Le proposte però assegnano gli stessi numeri a cose diverse:
     - D16 è il flip tolto in 7d2d1d8 per T6, e il lessico dei tempi per timing P6;
     - media P4 chiede una sua «A18 (e A19)» per le aperture;
     - feedback P4 chiede una D nuova («niente barra di avanzamento») e una C nuova per il 26 agosto;
     - timing P6 apre la domanda 12 sul replay.
   - Serve un'allocazione unica:
     - A18 e A19;
     - D16 per il flip, già applicato;
     - D17 per il lessico e D18 per la barra, solo dopo i commit che le applicano;
     - C21 per il logo del 26 agosto;
     - domanda 12 per il replay;
     - domanda 13 per A18/A19 da mostrare alla cliente.

3. **Tre direttive cliente di agosto sono vive nel codice ma assenti dal registro.** La spec:337 dichiara «le due di agosto ancora vive» (C19, C20), ma ce ne sono altre tre:
   - 2026-08-03, niente video nell'hero: media.ts:16, HeroCinematic.tsx:272.
   - 2026-08-04, replay nei due versi: Reveal.tsx:31, TextLines.tsx:6, StarReviews.tsx:403 e :417.
   - 2026-08-26, logo grigio e rosso: logo-colore.test.ts:3, MarkDomus.tsx:31, MarkBadge.tsx:70.

   Ogni lana ne ha trovata una, nessuna le ha messe insieme. Con A18 («uscite speculari») il replay del 4 agosto è superato o rafforzato, e va scritto.

4. **Nessuno somma il budget di gesti.**
   - Gesti nuovi sparsi fra le lane:
     - T4 (lettere della parola Pinyon);
     - T5 (flip delle lettere dell'hero);
     - la spinta di P2 oppure il corridoio del tuffo;
     - la finestra di P3 oppure la cartolina;
     - il corridoio delle persiane;
     - media P4 (tre geometrie);
     - la sentinella di feedback P2;
     - la corta del preloader (7b);
     - le uscite di timing P4/P5;
     - le parole che si allontanano.
   - Riscritture concorrenti di DESIGN.md:573 e PRODUCT.md:132:
     - «quattro gesti» (media P5);
     - «tre nastri più due momenti» (parallax P4, già respinta);
     - PRODUCT.md:139 riscritta da 7b;
     - DESIGN.md:400 da feedback P2.
   - Manca una lista chiusa, capitolo per capitolo, per A18.

**B. Punti dell'articolo scoperti o letti male**

5. **Punto 1, serif e sans.** Nessuna lana registra la coppia come già presente: Playfair didone più Plus Jakarta (spec:406 A17 §2, spec:394 A05, spec:398 A09). Nessuno nota neppure che l'articolo si contraddice: la tipografia è «identica in tutte le 26 sezioni», ma «nessuna sezione condivide un'animazione». È esattamente la linea di frattura fra A18 e la cellula di DESIGN.md:496. Va dichiarata una regola: testo identico ovunque, movimento di sezione unico per capitolo.

6. **Punto 2, il cambio di tema.**
   - Alberto ha detto «cambio di tema sopra le foto» (memoria :13). Feedback P3 lo trasforma in «il cuore si nasconde» senza dichiarare che si allontana dalle sue parole.
   - C'è un'alternativa che nessuno ha valutato: le tacche dell'anello sono in currentColor (MarkBadge.tsx:12-13) e potrebbero virare in crema senza ricolorare il marchio, che logo-colore.test protegge.
   - Resta aperto se «sempre visibile» valga anche sotto i 1280 px: A13 dice «RotatingMark 56 px solo da xl» (spec:402).

7. **Punto 3, coreografia per capitolo.**
   - Il capitolo delle persiane (memoria :14) non ha né un capitolo assegnato né un colore né tempi.
   - Sotto «coreografia piena» sette capitoli della home non hanno nessuna proposta: HomeSearchGateway, Voci, OpenDomus, DomusDocProtocol, CostiChiari, Social, Contact (page.tsx:78-91).
   - FeaturedTestimonial perde l'unico movimento che ha (parallax P1).
   - Location di lato e righe del titolo in deriva contraria esistono già (gradini di HorizonScroller.tsx:566-577), ma nessuna lana lo mette fra le cose presenti.

8. **Punti 5 e «what makes it work», una sola lingua dei tempi.** In gsap.ts competono tre schemi:
   - T1: `text.{dur, hide, stagger, after}`;
   - timing P1: `dur.{exit, long, curtain}` più `--ease-dt-out` e `--ease-dt-in`;
   - media P3: `media.curtain` (o `curtain`).

   T1 e timing P1 aggiungono entrambe `--ease-dt-out`. Il verdetto di timing P1 chiede di lasciare CURTAIN_DUR locale (HorizonScroller.tsx:45-62), media P3 lo sposta. Feedback P1 aggiunge `MQ.xl`, che oggi non esiste (gsap.ts:131-138).

9. **Punto 7, il film intero parte su qualunque rotta.** Il boot script non controlla la rotta: `pre=!deep&&m&&!sessionStorage...` (layout.tsx:102). Chi entra da Google su /case/[slug] o su /vendi vede 4,63 s di film con la sagoma dell'hero della home, e il patto della porta vale solo per la home (intro-clocks.test.ts:405-431). 7b limita a «/» solo la versione corta, e `?intro` riaccende il film su ogni rotta. Nessuna proposta decide.

**C. Conflitti fra proposte**

10. **TextLines.tsx:109-165 viene riscritto in quattro modi.**
    - T2: innesco a IntersectionObserver.
    - T3: `progress(1)` per gli H1 sopra la piega.
    - Timing P4: un solo ramo ScrollTrigger con `exit` di default.
    - T6: toglie la prop `exit` (:39, :52, :191). È l'opposto di P4.

    Sui valori, T1 porta le righe a 1,2 s dtOut e il suo verdetto vieta di allungarle, mentre timing P2 le porta a 1,2 s. Type esclude l'uscita specchiata, timing P4 la mette su tutti i titoli. Serve una specifica unica: innesco, regola d'uscita sotto A18, regola degli H1, valori.

11. **`.reveal` in globals.css:508-538 è toccata da cinque proposte.**
    - T1 e timing P2: la curva di :511.
    - Timing P1: 0,9 s diventa `var(--dur-reveal)`.
    - Timing P3: due transition e via il will-change di :515-517.
    - Media P5: via i `filter: none` di :530 e :538.

    T6 e media P5 correggono entrambe lo stesso commento di Reveal.tsx:15. Serve un ordine di merge.

12. **Tre regole d'uscita incompatibili.**
    - Timing P3 e P6: uscita più corta, 0,4 s con curva In, sola opacità per i blocchi.
    - Media P4: reverse a durata piena, come il sipario.
    - Sullo stesso sipario (HorizonScroller.tsx:358 e :599) media P3 congela il reverse, timing P5 lo sostituisce con una chiusura verso destra a 0,9 s.

13. **Le foto di Posizionamento, Paths e Method ricevono due o tre comportamenti.**
    - Parallax P1: scala 1,09 più ±4 % a forbice. Media P4: clip più contro-scala 1,06 sull'img.
    - Insieme fanno circa 1,155×, oltre DESIGN.md:397 (~1,05×) e D04.
    - Media P4 mette il clip «dentro l'inner di Parallax», ma P1 sposta `.dt-media-half` sul nodo esterno: le due strutture non combaciano.
    - Il ritratto da 763 px (Method.tsx:173) non regge né l'una né l'altra.
    - Ogni riga di Method ne accumula quattro: TextLines h3 (T1, T2, P4), T4, otturatore, forbice. A18 dice «un comportamento per capitolo».

14. **Sul Congedo ci sono quattro piani incompatibili.**
    - Parallax P3: finestra che si apre.
    - Cartolina: la scelta di Alberto (memoria :14).
    - Media: esclude sipario e otturatore sul Congedo per C03 e D15.
    - In più media P1 riscrive il gate video e feedback P3 aggiunge data-bg.
    - Fatto mancato da tutti i verdetti: in P3 il wrapper passa da 0,75 a 1 sopra la scala 1.14, e 1.14 esiste per mangiare il logo bruciato nella clip (Congedo.tsx:110-113, «da 1.14 in su il taglio superiore lo mangia»). Durante l'apertura la scala effettiva è 0,855, quindi il logo può rientrare nella finestra. Da misurare.

15. **Sull'hero quattro proposte interagiscono.**
    - La spinta di P2 contro il tuffo sticky scelto da Alberto.
    - Il flip di T5 sulle stesse lettere.
    - Con 7b, alle ricariche il sipario non mostra le lettere: l'argomento di continuità di T5 vale solo alla prima visita.
    - Feedback P3 mette `data-bg` proprio su `[data-hero-media]` (HeroCinematic.tsx:408), mentre P2 prescrive attributi solo sull'inner. La regex `{0,200}` di intro-clocks.test.ts:424 oggi passa, ma le indicazioni si contraddicono.
    - Il contratto del primo schermo (page.tsx:55-59) resta non deciso.

16. **Sul monogramma due tempi di rientro per lo stesso segno.** Feedback P1 tiene 1,1 s «domus» e aggiunge il gate xl, timing P2 lo porta a 1,2 s dtOut. Timing P1 tocca le stesse righe (RotatingMark.tsx:74). La sentinella di P2 misura 48 px a 4vw, il cuore in testata 56 px a 8vw: non è il «sempre visibile» detto da Alberto.

17. **Preloader: quattro proposte sulla stessa chiave di sessione, senza una macchina a stati unica.**
    - 7b, 7-budget-scheda-nascosta, la chiave scritta all'avvio e `?intro` toccano tutti `dt-intro-seen`: `fine` in layout.tsx:102, `finish` in Preloader.tsx:263-272, la fixture in e2e/helpers.ts:120-130.
    - Con la home più lunga di 3-4 schermi (memoria :14), il ritorno in cima di 7b alla ricarica (Preloader.tsx:322-325) costa di più.

**D. Pagine interne**

18. **Method.tsx è condiviso con /metodo.** `compact` cambia solo la coda (Method.tsx:189, :284). Le righe degli atti (:205-262) si rendono anche su /metodo (MetodoContent.tsx:226). Media P4 dichiara «esclusi: pagine interne» e parallax P1 elenca solo la home, ma entrambe cambiano /metodo, presidiato da motion.spec.ts:45-56.

19. **Gli H1 in TextLines sopra la piega stanno su 14 pagine, non 12.** Oltre a PageHero.tsx:84 (11 pagine) e ContattiContent.tsx:138 ci sono CaseVenduteContent.tsx:211 e ValutazioneContent.tsx:352: T3 li dimentica.

20. **/case/[slug] ha già del movimento e le proposte lo raggiungono.**
    - La testata c'è (case/[slug]/page.tsx:251), quindi la sentinella di feedback P2 comparirebbe anche lì.
    - Le foto di PropertyGallery non hanno data-bg.
    - Movimento già presente: PropertyDetail.tsx:317-360 (ScrollTrigger sui valori) e ListingCopy.tsx:131 e :151 (Reveal). Timing P1 e P3 lo cambiano.
    - La pulizia per gli snapshot nasconde solo header, cookie e wa.me (property-detail.spec.ts:51-57); la sentinella montata fuori dall'header ci finirebbe dentro.
    - Manca una regola esplicita, con una guardia: «nessun cambio su /case/[slug]».

21. **Nessuna lana dice se A18 vale fuori dalla home.** La memoria parla di «capitoli della home». Intanto T1, T2, timing P3 e P4 cambiano i 32 TextLines e i 146 Reveal di tutto il sito.

**E. Test**

22. **Premessa sbagliata nei verdetti T1 e T2.** Dicono che la suite giri con reduced motion (playwright.config.ts:36), ma quel file esegue solo property-detail.spec.ts (:20). La suite del sito, playwright.site.config.ts, non ha reducedMotion globale: lo forzano solo motion.spec.ts:6, a11y.spec.ts:11 e mobile-motion.spec.ts:1143. Quindi home.spec, pages.spec, search.spec ed errors.spec girano con motion ok, e possono rompersi:
    - con i cambi a TextLines, Reveal e card (search.spec.ts:35);
    - sui clic ai link della testata (home.spec.ts:318-327).

23. **Due test citati nel brief non esistono.**
    - Nessuno spec «mobile-effects»; l'unico consolidation.test.ts sta in app/lib/territory/area/ e non riguarda il movimento.
    - content-integrity.test.ts presidia copy e id di site.videos (:226-268), non il movimento: non si rompe.

24. **Le reti anti-traboccamento non sono citate da nessuna delle proposte a rischio.** Riguarda T4 (x 6vw), P2 (lockup −12vh), le parole che si allontanano e la sentinella. Le reti sono:
    - mobile-motion.spec.ts:27-53 (8 rotte, /metodo compresa);
    - home.spec.ts:152, :213, :222;
    - pages.spec.ts:143;
    - errors.spec.ts:32.

25. **I corridoi nuovi (tuffo, persiane, cartolina) non hanno le guardie dei tre nastri:** motion.spec.ts:58-91 (data-on nullo con reduced motion) e home.spec.ts:134, :161-165, :190. Nessun test fissa il numero di corridoi: da 3 a 6 senza presidio.

26. **Nessun controllo axe con motion ok.** a11y.spec.ts gira con reduced motion, quindi ScriptChars, MediaReveal e MarkSentinel non verrebbero mai controllati da axe con motion ok. Serve una passata su / e su /metodo.

27. **intro-clocks, riepilogo dei punti toccati.**
    - 7b: :130-143, :158-164, :273.
    - Timing P1: :49, :73, :282.
    - T5: legge :319-321.
    - Attributi sulla banda: :424.
    - Tuffo sticky: la classe della banda deve restare entro 200 caratteri, e il ritaglio «10% 0%» a :428-430 non va toccato.

**F. Documenti**

28. **Superfici da aggiornare per A18/A19 che nessuna lana elenca per intero.**
    - .impeccable/design.json: :358, :387, :392, :402-403, :408, :545, :550, :613, :622, :627, :628.
    - DESIGN.md: :320, :345, :401, :490, :529, :532, :535, :545, :573, :582, :587.
    - PRODUCT.md: :35 (le primitive nuove), :132-141, :154-155, :193.
    - Spec: §3.5 :188-192 («tre gesti e basta», «nessuna sezione pinnata»), gli stati di C03 (:367) e C06 (:370), 4.15 :213.
    - Codice: il commento di contratto in page.tsx:67-72, gsap.ts:7-18, Congedo.tsx:9-11.

29. **Manca la domanda alla cliente.** docs/da-chiedere-alla-cliente.md ha solo le domande 22-25 sul preloader (:411-414), nessuna su C03 contro A18/A19. La memoria (:16, :22) chiede di mostrare il risultato alla cliente, ma nessuna lana propone la voce.

30. **Indice della memoria.** Aggiungere domus-coreografia-era.md a MEMORY.md, altrimenti le prossime sessioni ripetono il punto 1.