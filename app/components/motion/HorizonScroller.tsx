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
// Sotto lg la stessa storia si racconta in VERTICALE (Fase 2 della parità
// mobile): gli attributi del contratto qui sopra non nominano un asse, quindi
// il ramo mobile li riusa quasi tutti tali e quali e sposta solo il punto da
// cui si guarda. L'eccezione è [data-horizon-stair], che sul telefono resta
// fermo — il perché, misurato, sta nel ramo. Quello che il ramo mobile non fa,
// mai: mettere [data-on] (tutto il layout a track in globals.css gli pende
// sotto), scrivere un'altezza sulla radice, pinnare o chiedere un refresh.
// La colonna resta la colonna.
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
 *  cammina insieme a lui. È la durata del DESKTOP — sul telefono la finestra
 *  utile è più corta e il ramo mobile usa dur.reveal (la misura è lì). */
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
        // arrivare tutto insieme.
        if (!c.desktop) {
          const undo: Array<() => void> = [];

          // ── I blocchi che entrano ─────────────────────────────────────────
          // Sull'orizzontale i tre valori di [data-horizon-reveal] vogliono
          // dire tre cose diverse ("enter" = già in scena al pin, "track" =
          // agganciato al containerAnimation, "chars" = per-carattere). In
          // colonna quella distinzione non esiste più: ogni blocco ha davanti
          // il proprio pezzo di pagina, quindi collassano in un reveal solo.
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
          // Sul per-carattere: niente SplitText. Sarebbero ~68 span sul
          // manifesto per un testo che al telefono nessuno legge lettera per
          // lettera, e l'idioma di casa per le righe (TextLines) non è
          // utilizzabile qui — è ungated in larghezza, quindi avvolgere l'h2
          // significherebbe due split sullo stesso testo appena si torna sopra
          // i 1024. L'h2 prende lo stesso reveal a blocco degli altri: non
          // resta fermo in mezzo a tre fratelli che si muovono.
          //
          // La quota d'ingresso, scritta una volta sola: la leggono il trigger
          // e la sua rete, e devono dire lo stesso numero.
          const startPct = 85;
          gsap.utils.toArray<HTMLElement>("[data-horizon-reveal]", root).forEach((el) => {
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

          // ── Titolo a gradini: sul telefono NON si muove ───────────────────
          // Qui c'era uno scrub verticale, e lo si toglie. La ragione per cui
          // era fatto così resta scritta perché è la ragione per cui non
          // poteva funzionare: a 390px il titolo sta a 41,6px (il min del
          // clamp) con leading .95, fra l'inchiostro di due righe maiuscole
          // restano ~10px e direzioni alternate le avrebbero fatte toccare già
          // a ±12px. Da lì la stessa direzione a tre velocità (1 / 0,7 / 0,45
          // su una corsa di dist.rise/2) — che però lascia fra due righe
          // adiacenti uno scarto di 6-7px: sotto la soglia di ciò che un occhio
          // nota mentre scorre. È la stessa firma invisibile che questa wave ha
          // già tolto alla cupola.
          //
          // E costava dove costa di più. Sul pannello territorio lo scrub è
          // vivo mentre il blocco di testo entra (scrollY 3.369) e mentre il
          // sipario si apre (3.582): 213px l'uno dall'altro, dentro una sola
          // spinta del dito, tre animazioni nella stessa schermata. La legge
          // dice un momento di firma per altezza di viewport: qui il momento è
          // il sipario. I gradini stanno fermi e lo lasciano essere il momento.

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
          // telefono entra più tardi (a "top 70%" l'immagine è in campo) e
          // corre in dur.reveal, che in quella finestra ci sta tutta. Stesso
          // gesto, stessa curva: cambia solo dove capita.
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
                  stl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: dur.reveal, ease: "dtOut" }, 0);
                  if (img) stl.to(img, { scale: 1, duration: dur.reveal, ease: "dtOut" }, 0);
                }
                stl.restart();
              },
              onLeaveBack: () => stl?.reverse(),
            });
          });

          // I fiori d'angolo ([data-horizon-flower]) restano spenti: in
          // HorizonStory sono tutti `hidden lg:block`, non c'è niente da far
          // derivare.
          return () => undo.forEach((off) => off());
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
