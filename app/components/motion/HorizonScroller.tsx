"use client";

// HorizonScroller — pannelli cuciti in orizzontale mentre la pagina scorre in
// verticale (tecnica del riferimento era-residence, §11 del dossier in
// reverse-engineering/): screen sticky + track flex, l'altezza della sezione È
// la larghezza del track così la velocità del gesto resta 1:1. Il track scorre
// con la curva "dtHorScroll" (scrub 0.25) e fa da containerAnimation per i
// reveal interni.
//
// Contratto coi contenuti (attributi sui discendenti):
//   data-horizon-reveal="enter"  reveal verticale (pannello già in vista al pin)
//   data-horizon-reveal="track"  reveal agganciato al movimento orizzontale
//   data-horizon-reveal="chars"  reveal per-carattere (animatore "h" del
//                                riferimento: yPercent 50→0 + rotateY 90→0)
//   data-horizon-stair           righe del titolo a gradini (parallasse contraria)
//   data-horizon-slide           media col reveal a sipario (clip-path)
//   data-horizon-slide-img       il media dentro lo slide (scale 1.15 → 1)
//   data-horizon-flower="drift-x" | "drift-y"  decorazioni in deriva lenta
//
// Il set piece ORIZZONTALE vive SOLO da lg in su + motion ok: l'attributo
// [data-on] che accende il layout a track viene messo esclusivamente via JS,
// quindi con reduced-motion o senza JS i pannelli restano in colonna, statici
// e completi — nessuno stato nascosto o clippato.
//
// Sotto lg la stessa storia si racconta in VERTICALE. Non è una versione
// ridotta: è lo stesso film senza il pin (verdetto 15 dell'onda «parità mobile
// 2», PORT-SENZA-PIN). Gli attributi del contratto qui sopra non nominano un
// asse, quindi il ramo mobile li riusa TUTTI — chars, sipario, gradini, fiori —
// e sposta solo il punto da cui si guarda: dove il desktop innesca sul pin
// della sezione, qui innesca ogni pezzo quando entra davvero in campo.
// L'onda precedente aveva tradotto tre di questi in «fermo» o «reveal a
// blocco»: le note che lo giustificavano sono riscritte una per una là dove
// stava il taglio, perché due di quelle misure rispondevano a un'altra domanda.
// Quello che il ramo mobile non fa, mai: mettere [data-on] (tutto il layout a
// track in globals.css gli pende sotto), scrivere un'altezza sulla radice,
// pinnare o chiedere un refresh. La colonna resta la colonna.
import { useRef, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger } from "../../lib/motion/gsap";

// SplitText serve solo qui e in TextLines: registrazione locale, mai nel
// chunk del layout (gsap.ts è importato da SmoothScroll).
gsap.registerPlugin(SplitText);

// Le due misure di questo set piece che il vocabolario di gsap.ts non ha.
// Stanno qui, a livello di modulo, perché i due rami (nastro orizzontale e
// colonna) devono leggere lo stesso simbolo: erano numeri scritti a mano in
// tre punti e nulla teneva insieme il ramo che li ha copiati.
/** La corsa d'ingresso dei blocchi di testo. Volutamente più corta di
 *  dist.rise (48): questi blocchi sono paragrafo + CTA, e da 48px non
 *  "entrano", cadono. */
const REVEAL_Y = 28;
/** Il sipario del media: dura più di un reveal perché il clip-path deve
 *  attraversare tutta la larghezza dell'immagine con la scala interna che
 *  cammina insieme a lui. Vale a OGNI larghezza. Qui c'era scritto che sul
 *  telefono «la finestra utile è più corta» e il ramo mobile correva in
 *  dur.reveal: la finestra era corta perché l'innesco stava a "top 90%", cioè
 *  il sipario si apriva su un'immagine ancora fuori campo. Quel difetto è già
 *  stato curato spostando l'innesco a "top 70%" (la misura sta nel ramo);
 *  accorciare anche la durata era curare due volte lo stesso sintomo, e
 *  toglieva al telefono il momento di firma del capitolo. */
const CURTAIN_DUR = 1.6;

export default function HorizonScroller({
  children,
  className = "",
  id,
  refreshKey,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Cambia (es. locale) → l'intero context viene revertito e ricreato:
      gli split per-carattere vanno rifatti sul testo nuovo. */
  refreshKey?: string;
}) {
  const rootRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      // Il track vuole la larghezza piena: MQ.lg, stessa ragione del rail di
      // ThreadNav.
      mm.add({ desktop: MQ.lg, motionOk: MQ.motionOk }, (ctx) => {
        const c = ctx.conditions as { desktop: boolean; motionOk: boolean };
        if (!c.motionOk) return;

        // ── Ramo mobile/tablet: stessa storia, asse verticale ───────────────
        // Il gesto del desktop è "attraversare quattro capitoli di lato". Col
        // dito quel gesto non esiste, e un carosello a snap sarebbe un
        // ridisegno travestito da porting (le ragioni stanno in
        // docs/mobile-parity.md §3.1). Qui resta la colonna e si sposta l'ASSE
        // dei trigger: ogni capitolo si apre quando lo si raggiunge, invece di
        // arrivare tutto insieme. Gli ATTI però sono gli stessi del desktop —
        // chars, sipario, gradini, fiori — perché senza il pin si perde il
        // nastro, non la coreografia.
        if (!c.desktop) {
          const undo: Array<() => void> = [];

          // ── I blocchi che entrano ─────────────────────────────────────────
          // Sull'orizzontale "enter" (già in scena al pin) e "track"
          // (agganciato al containerAnimation) vogliono dire due cose diverse.
          // In colonna quella distinzione non esiste più: ogni blocco ha
          // davanti il proprio pezzo di pagina, quindi collassano in un reveal
          // solo. Il terzo valore, "chars", NON collassa qui: ha una sua
          // trasformazione ed è trattato più sotto, col suo split.
          //
          // `opacity` + `pointerEvents` e NON `autoAlpha`: dentro questi
          // blocchi ci sono le tre CTA del capitolo (/acquista, /recensioni, il
          // canale YouTube) e `visibility: hidden` le toglierebbe dall'ordine
          // di tabulazione — con le CTA fuori dal Tab la rete `focusin` non
          // potrebbe scattare mai. Il ramo desktop qui sotto aveva quel difetto
          // (audit di docs/mobile-parity.md, punto 5) e questo commento si
          // limitava a dichiararlo: adesso `revealOf` è corretto e i due rami
          // nascondono allo stesso modo. `pointerEvents: "none"` tiene il
          // blocco irraggiungibile al dito finché è invisibile, raggiungibile
          // alla tastiera: è ciò che rende vera la rete.
          //
          // La quota d'ingresso, scritta una volta sola: la leggono il trigger
          // e la sua rete, e devono dire lo stesso numero.
          const startPct = 85;
          // L'h2 del manifesto è escluso: il suo reveal è per-carattere, sotto.
          const blockSel = '[data-horizon-reveal]:not([data-horizon-reveal="chars"])';
          gsap.utils.toArray<HTMLElement>(blockSel, root).forEach((el) => {
            gsap.set(el, { opacity: 0, pointerEvents: "none", y: REVEAL_Y });
            const tw = gsap.to(el, {
              opacity: 1,
              pointerEvents: "auto",
              y: 0,
              duration: dur.reveal,
              ease: "domus",
              paused: true,
            });
            // Stessa forma del desktop: restart a ogni ingresso, reverse
            // risalendo oltre l'inizio.
            ScrollTrigger.create({
              trigger: el,
              start: `top ${startPct}%`,
              onEnter: () => tw.restart(),
              onLeaveBack: () => tw.reverse(),
            });
            // Reti di sicurezza, lo stesso patto di Footer e Method: la
            // tastiera che entra, oppure 2,5 s senza che il trigger sia
            // scattato, e il blocco è comunque lì.
            //
            // Il timeout è GUARDATO, e non era: la forma secca accendeva tutto
            // a pagina ferma. Misurato a 3,2 s con scrollY ancora 0, i quattro
            // blocchi erano già a opacity 1 da cinque a tredici schermate sotto
            // il bordo — la stessa svista di StarReviews e del muro delle voci.
            // Adesso la rete interviene solo se il tween è fermo E il blocco ha
            // davvero passato la quota: cioè solo se il trigger ha mancato il
            // colpo.
            const reveal = () => tw.progress(1);
            el.addEventListener("focusin", reveal);
            const safety = window.setTimeout(() => {
              if (tw.progress() > 0) return;
              if (el.getBoundingClientRect().top < (window.innerHeight * startPct) / 100) reveal();
            }, 2500);
            undo.push(() => {
              el.removeEventListener("focusin", reveal);
              window.clearTimeout(safety);
            });
          });

          // ── Il manifesto, lettera per lettera ─────────────────────────────
          // Stesso split e stessa tween del desktop (`words,chars`, rotateY 90
          // e yPercent 50 → 0, 1,2 s, stagger .03, `dtOut`): è la
          // trasformazione che il capitolo promette, e un reveal a blocco al
          // suo posto è esattamente il fade che questa onda rifiuta di
          // chiamare parità.
          //
          // Qui c'era scritto «niente SplitText: sarebbero ~68 span, e l'idioma
          // di casa per le righe (TextLines) è ungated in larghezza, quindi
          // avvolgere l'h2 significherebbe due split sullo stesso testo appena
          // si torna sopra i 1024». Verificato: TextLines è davvero ungated
          // (`TextLines.tsx:66`, solo MQ.motionOk) — ma l'h2 del manifesto NON
          // è avvolto in TextLines (`HorizonStory.tsx:264-270`), quindi quel
          // rischio non è mai esistito su questo nodo. Lo split lo fa questo
          // componente, dentro `matchMedia`, che di rami ne tiene vivo uno solo
          // alla volta: uno split, non due. E i ~68 span sono l'alleggerimento
          // di questo verdetto, non il suo costo — un h2 solo, `will-change`
          // mai (`globals.css`, blocco .dt-hchar), split revertito nel cleanup.
          //
          // Cambia solo il punto da cui si guarda, come per tutto il ramo: il
          // desktop innesca sul pin della sezione ("top 55%" della radice,
          // perché il pannello arriva di lato), qui l'h2 è il proprio trigger
          // alla stessa quota del sipario — "top 70%", cioè quando è in campo.
          const charsPct = 70;
          const charEls = gsap.utils.toArray<HTMLElement>(
            '[data-horizon-reveal="chars"]',
            root
          );
          let charsCancelled = false;
          if (charEls.length) {
            // Split a font caricati (altrimenti si misura la fallback e le
            // lettere ballano al swap): quindi async, e tutto ciò che nasce
            // qui dentro va disfatto a mano nel cleanup.
            document.fonts.ready.then(() => {
              if (charsCancelled) return;
              charEls.forEach((el) => {
                const split = SplitText.create(el, {
                  type: "words,chars",
                  tag: "span",
                  wordsClass: "dt-hword",
                  charsClass: "dt-hchar",
                  smartWrap: true,
                  aria: "none",
                });
                gsap.set(split.chars, {
                  autoAlpha: 0,
                  yPercent: 50,
                  rotateY: 90,
                  transformOrigin: "50% 100%",
                  transformPerspective: 800,
                });
                // Split VIVO fino al cleanup (un revert al complete
                // cancellerebbe i char per il restart) e tween in closure:
                // stessa forma del desktop, restart all'ingresso, reverse
                // risalendo oltre l'inizio.
                let charTween: gsap.core.Tween | null = null;
                const play = () => {
                  if (!charTween) {
                    charTween = gsap.to(split.chars, {
                      autoAlpha: 1,
                      yPercent: 0,
                      rotateY: 0,
                      duration: 1.2,
                      ease: "dtOut",
                      stagger: stagger.chars / 2,
                      paused: true,
                    });
                  }
                  charTween.restart();
                };
                const st = ScrollTrigger.create({
                  trigger: el,
                  start: `top ${charsPct}%`,
                  onEnter: play,
                  onLeaveBack: () => charTween?.reverse(),
                });
                // La stessa rete guardata dei blocchi, e qui serve di più: le
                // lettere partono da `autoAlpha: 0`, quindi un trigger che
                // manca il colpo lascerebbe il manifesto invisibile. Interviene
                // solo se il tween è fermo E l'h2 ha davvero passato la quota.
                const safety = window.setTimeout(() => {
                  if (charTween && charTween.progress() > 0) return;
                  if (
                    el.getBoundingClientRect().top <
                    (window.innerHeight * charsPct) / 100
                  ) {
                    play();
                    charTween?.progress(1);
                  }
                }, 2500);
                undo.push(() => {
                  window.clearTimeout(safety);
                  st.kill();
                  charTween?.kill();
                  split.revert();
                });
              });
            });
          }

          // ── Titolo a gradini: le righe scivolano, in pixel clampati ───────
          // Il desktop fa uno scrub ORIZZONTALE (`xPercent` wrap([-5,25,-15]) →
          // wrap([5,-25,25])) e questo ramo teneva le righe ferme. La misura
          // che lo giustificava rispondeva però a un'altra domanda: parlava di
          // uno scrub VERTICALE — a 390px il titolo sta a 41,6px con leading
          // .95, fra l'inchiostro di due righe maiuscole restano ~10px e
          // direzioni alternate le avrebbero fatte toccare già a ±12px. È vero,
          // e vale sull'asse Y. Sull'asse X due righe `display:block` una sotto
          // l'altra non si toccano mai, qualunque cosa facciano.
          //
          // Rimisurato sull'asse giusto (audit §4.3): a 390 ogni riga è larga
          // 350px in un contenitore che parte a left 20 — 20px di margine per
          // lato. Coi valori desktop in PERCENTUALE la terza riga partirebbe a
          // 20 − 52 = −32px: testo tagliato e documento che sborda. Quindi la
          // stessa corsa, in PIXEL clampati a ±16 (dentro i 20 di margine):
          // è il 64% delle ampiezze desktop, cioè lo stesso rapporto fra corsa
          // e aria disponibile su un contenitore sette volte più stretto.
          // Le direzioni e i rapporti fra le tre righe restano quelli.
          //
          // Alleggerimento nominato: `x` è transform (composited, zero layout,
          // niente `will-change` permanente), il trigger è il titolo stesso —
          // nessuna altezza scritta, nessun pin, nessun refresh — e la sezione
          // prende `overflow-x: clip` (globals.css, blocco dt-horizon) come
          // rete contro lo sbordo a ogni larghezza.
          const stairs = gsap.utils.toArray<HTMLElement>("[data-horizon-stair]", root);
          const stairsHead = stairs[0]?.parentElement;
          if (stairs.length && stairsHead) {
            gsap.fromTo(
              stairs,
              { x: gsap.utils.wrap([-3, 16, -10]) },
              {
                x: gsap.utils.wrap([3, -16, 16]),
                ease: "none",
                scrollTrigger: {
                  // La traversata del titolo, non della sezione: senza pin la
                  // finestra utile è quella in cui il titolo si vede. Il
                  // titolo può fare da trigger a ciò che contiene perché le
                  // righe si muovono in x: il suo rettangolo cambia in
                  // orizzontale, e start/end leggono solo top e bottom.
                  trigger: stairsHead,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.25,
                },
              }
            );
          }

          // ── Media a sipario: il momento di firma, ed è senza asse ─────────
          // clip-path da inset(0% 100% 0% 0%) a inset(0) più la scala interna
          // 1.15 → 1: si apre da sinistra a destra e su un telefono legge
          // identico al desktop. Qui era scritto che per questo restavano
          // anche l'innesco e la durata del desktop — «è lo stesso momento, non
          // una versione ridotta». Misurato, il risultato era il contrario di
          // quell'intenzione: su un viewport da 664px, con "top 90%", il
          // sipario del territorio era aperto all'88% prima che l'immagine
          // fosse tutta in campo, e quello delle recensioni finiva prima di
          // essere visibile. Il momento c'era e si vedeva a metà. Quindi il
          // telefono entra più tardi: a "top 70%" l'immagine è in campo.
          //
          // La cura si fermava lì per metà: insieme all'innesco era stata
          // accorciata anche la DURATA (dur.reveal, 0,9 s), e le due cose non
          // avevano la stessa ragione. Spostato l'innesco, la finestra utile
          // c'è tutta: il sipario torna a CURTAIN_DUR — 1,6 s, gli stessi del
          // desktop. Stesso gesto, stessa curva, stesso tempo: cambia solo
          // dove capita.
          gsap.utils.toArray<HTMLElement>("[data-horizon-slide]", root).forEach((el) => {
            // La polaroid del pannello video è `hidden lg:block`: qui non ha
            // box, e un trigger su un nodo non renderizzato è un trigger speso
            // a vuoto.
            if (!el.getClientRects().length) return;
            const img = el.querySelector<HTMLElement>("[data-horizon-slide-img]");
            gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)" });
            if (img) gsap.set(img, { scale: 1.15 });
            let stl: gsap.core.Timeline | null = null;
            ScrollTrigger.create({
              trigger: el,
              start: "top 70%",
              onEnter: () => {
                if (!stl) {
                  stl = gsap.timeline({ paused: true });
                  stl.to(
                    el,
                    { clipPath: "inset(0% 0% 0% 0%)", duration: CURTAIN_DUR, ease: "dtOut" },
                    0
                  );
                  if (img) stl.to(img, { scale: 1, duration: CURTAIN_DUR, ease: "dtOut" }, 0);
                }
                stl.restart();
              },
              onLeaveBack: () => stl?.reverse(),
            });
          });

          // ── I fiori derivano anche qui ────────────────────────────────────
          // Qui c'era scritto «i fiori restano spenti: in HorizonStory sono
          // tutti `hidden lg:block`, non c'è niente da far derivare». Era vero
          // e non lo è più: dalla Fase 2 il tralcio del manifesto
          // ([data-horizon-flower="drift-y"], `HorizonStory.tsx:250-256`) è la
          // Fioritura che resta accesa a 390 — «una per sezione» — e senza
          // questa deriva sarebbe l'unica cosa immobile del capitolo, cioè
          // proprio il contrario di ciò per cui è stata accesa.
          //
          // Stessa deriva del desktop: yPercent −10 → 10, `ease: "none"`,
          // scrub 0.25. Cambia il trigger, che qui è il PANNELLO che ospita il
          // fiore invece della radice pinnata: senza pin la corsa è la
          // traversata del capitolo. E il trigger non è il fiore stesso, che
          // pure sarebbe stato la scelta ovvia: la sua tween è su yPercent,
          // quindi il suo rettangolo si muove in verticale mentre ScrollTrigger
          // lo misura — start ed end inseguirebbero ciò che animano.
          // Alleggerimento: nessun canvas nuovo (il tralcio c'è già), e il
          // gemello "drift-x" — la scritta in fiori del territorio — non entra
          // proprio nel selettore, perché sotto lg resta `hidden lg:block`:
          // niente canvas, niente trigger. La guardia sul rettangolo qui sotto
          // vale per il tralcio, il giorno che anche lui venisse gatato in
          // larghezza: un trigger su un nodo senza box è un trigger sprecato.
          gsap.utils
            .toArray<HTMLElement>('[data-horizon-flower="drift-y"]', root)
            .forEach((el) => {
              if (!el.getClientRects().length) return;
              gsap.fromTo(
                el,
                { yPercent: -10 },
                {
                  yPercent: 10,
                  ease: "none",
                  scrollTrigger: {
                    trigger: el.parentElement ?? el,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.25,
                  },
                }
              );
            });

          return () => {
            charsCancelled = true;
            undo.forEach((off) => off());
          };
        }

        const screen = root.querySelector<HTMLElement>(".dt-horizon_screen");
        const track = root.querySelector<HTMLElement>(".dt-horizon_track");
        if (!screen || !track) return;

        // Layout orizzontale SOLO da qui in poi (CSS su [data-on] in globals).
        root.setAttribute("data-on", "");

        // Altezza sezione = larghezza track: la distanza verticale da percorrere
        // coincide con quella orizzontale. Rimisurata a ogni refresh (trappola
        // nota: altezze dinamiche + ScrollTrigger, vedi dossier WOW layer).
        const size = () => {
          root.style.height = `${track.scrollWidth}px`;
        };
        size();
        ScrollTrigger.addEventListener("refreshInit", size);

        const tween = gsap.to(track, {
          x: () => -(track.scrollWidth - screen.clientWidth),
          ease: "dtHorScroll",
          scrollTrigger: {
            trigger: root,
            start: "2.5% top",
            end: "97.5% bottom",
            scrub: 0.25,
            invalidateOnRefresh: true,
          },
        });

        // ── Reveal ──────────────────────────────────────────────────────────
        // Stato nascosto SOLO via JS; safety focus: se la tastiera entra in un
        // blocco non ancora rivelato (il CTA), il reveal si completa subito.
        const undoFocus: Array<() => void> = [];
        const revealOf = (el: HTMLElement) => {
          // `opacity` + `pointerEvents`, MAI `autoAlpha`. Qui c'era
          // `autoAlpha: 0`, cioè `visibility: hidden`, su sottoalberi che
          // contengono le tre CTA del capitolo (/acquista, /recensioni, il
          // canale YouTube): finché il blocco non era rivelato quelle CTA erano
          // fuori dall'ordine di tabulazione, il Tab le saltava e la rete
          // `focusin` due righe sotto non poteva scattare mai — era il punto 5
          // dell'audit in docs/mobile-parity.md, e riguardava il DESKTOP.
          // Spegnendo in opacity il blocco resta focalizzabile, e
          // `pointerEvents: "none"` gli impedisce di raccogliere click mentre è
          // invisibile: la rete torna a essere una rete.
          gsap.set(el, { opacity: 0, pointerEvents: "none", y: REVEAL_Y });
          // Replay a ogni passaggio: il tween resta in closure — restart a
          // ogni ingresso, reverse risalendo oltre l'inizio.
          let tw: gsap.core.Tween | null = null;
          const play = () => {
            if (!tw) {
              tw = gsap.to(el, {
                opacity: 1,
                pointerEvents: "auto",
                y: 0,
                duration: dur.reveal,
                ease: "domus",
                paused: true,
              });
            }
            tw.restart();
          };
          const back = () => tw?.reverse();
          const onFocus = () => {
            // Rete di sicurezza: tastiera dentro = reveal completo subito.
            play();
            tw?.progress(1);
          };
          el.addEventListener("focusin", onFocus);
          undoFocus.push(() => el.removeEventListener("focusin", onFocus));
          return { play, back };
        };

        gsap.utils
          .toArray<HTMLElement>('[data-horizon-reveal="enter"]', track)
          .forEach((el, i) => {
            const r = revealOf(el);
            ScrollTrigger.create({
              trigger: root,
              start: "top 70%",
              onEnter: () => gsap.delayedCall(i * 0.12, r.play),
              onLeaveBack: () => r.back(),
            });
          });

        gsap.utils
          .toArray<HTMLElement>('[data-horizon-reveal="track"]', track)
          .forEach((el) => {
            const r = revealOf(el);
            ScrollTrigger.create({
              trigger: el,
              containerAnimation: tween,
              start: "left 85%",
              onEnter: () => r.play(),
              onLeaveBack: () => r.back(),
            });
          });

        // ── Reveal per-carattere (animatore "h" del riferimento, §7 del
        // dossier): split a font caricati, stato nascosto SOLO via JS, innesco
        // quando il pannello è davvero in scena. Creato in async → trigger e
        // split vanno revertiti a mano nel cleanup.
        const charEls = gsap.utils.toArray<HTMLElement>('[data-horizon-reveal="chars"]', track);
        let charsCancelled = false;
        const charKills: Array<() => void> = [];
        if (charEls.length) {
          document.fonts.ready.then(() => {
            if (charsCancelled) return;
            charEls.forEach((el) => {
              const split = SplitText.create(el, {
                type: "words,chars",
                tag: "span",
                wordsClass: "dt-hword",
                charsClass: "dt-hchar",
                smartWrap: true,
                aria: "none",
              });
              gsap.set(split.chars, {
                autoAlpha: 0,
                yPercent: 50,
                rotateY: 90,
                transformOrigin: "50% 100%",
                transformPerspective: 800,
              });
              // Replay a ogni passaggio: tween persistente in closure e split
              // che resta VIVO (niente revert al complete — cancellerebbe i
              // char per il restart); il revert avviene solo nel cleanup.
              let charTween: gsap.core.Tween | null = null;
              const play = () => {
                if (!charTween) {
                  charTween = gsap.to(split.chars, {
                    autoAlpha: 1,
                    yPercent: 0,
                    rotateY: 0,
                    duration: 1.2,
                    ease: "dtOut",
                    stagger: stagger.chars / 2,
                    paused: true,
                  });
                }
                charTween.restart();
              };
              const st = ScrollTrigger.create({
                trigger: root,
                start: "top 55%",
                onEnter: play,
                onLeaveBack: () => charTween?.reverse(),
              });
              charKills.push(() => {
                st.kill();
                charTween?.kill();
                split.revert();
              });
            });
          });
        }

        // ── Titolo a gradini: le righe scivolano in direzioni alternate ────
        const stairs = gsap.utils.toArray<HTMLElement>("[data-horizon-stair]", track);
        if (stairs.length) {
          gsap.fromTo(
            stairs,
            { xPercent: gsap.utils.wrap([-5, 25, -15]) },
            {
              xPercent: gsap.utils.wrap([5, -25, 25]),
              ease: "none",
              scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.25 },
            }
          );
        }

        // ── Media a sipario: clip-path + scale interna ─────────────────────
        gsap.utils.toArray<HTMLElement>("[data-horizon-slide]", track).forEach((el) => {
          const img = el.querySelector<HTMLElement>("[data-horizon-slide-img]");
          gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)" });
          if (img) gsap.set(img, { scale: 1.15 });
          // Replay a ogni passaggio: timeline persistente in closure —
          // restart all'ingresso, reverse risalendo oltre l'inizio.
          let stl: gsap.core.Timeline | null = null;
          ScrollTrigger.create({
            trigger: el,
            containerAnimation: tween,
            start: "left 90%",
            onEnter: () => {
              if (!stl) {
                stl = gsap.timeline({ paused: true });
                stl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: CURTAIN_DUR, ease: "dtOut" }, 0);
                if (img) stl.to(img, { scale: 1, duration: CURTAIN_DUR, ease: "dtOut" }, 0);
              }
              stl.restart();
            },
            onLeaveBack: () => stl?.reverse(),
          });
        });

        // ── Decorazioni in deriva (slot fiori: possono non esserci) ────────
        gsap.utils
          .toArray<HTMLElement>('[data-horizon-flower="drift-x"]', root)
          .forEach((el) =>
            gsap.fromTo(
              el,
              { xPercent: 0 },
              {
                xPercent: -25,
                ease: "none",
                scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.25 },
              }
            )
          );
        gsap.utils
          .toArray<HTMLElement>('[data-horizon-flower="drift-y"]', root)
          .forEach((el) =>
            gsap.fromTo(
              el,
              { yPercent: -10 },
              {
                yPercent: 10,
                ease: "none",
                scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.25 },
              }
            )
          );

        return () => {
          ScrollTrigger.removeEventListener("refreshInit", size);
          undoFocus.forEach((off) => off());
          charsCancelled = true;
          charKills.forEach((kill) => kill());
          root.removeAttribute("data-on");
          root.style.height = "";
        };
      });
    },
    { scope: rootRef, dependencies: [refreshKey], revertOnUpdate: true }
  );

  return (
    <section ref={rootRef} id={id} className={`dt-horizon ${className}`}>
      <div className="dt-horizon_screen">
        <div className="dt-horizon_track">{children}</div>
      </div>
    </section>
  );
}
