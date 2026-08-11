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
// Il set piece orizzontale vive SOLO da lg in su + motion ok: l'attributo
// [data-on] che accende il layout a track viene messo esclusivamente via JS,
// quindi con reduced-motion o senza JS i pannelli restano in colonna, statici
// e completi — nessuno stato nascosto o clippato. Sotto lg oggi vale lo stesso,
// ma per mancanza e non per scelta: la Fase 2 della parità mobile porterà qui
// una coreografia verticale sua (il track orizzontale resta comunque da 1024).
import { useRef, type ReactNode } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger } from "../../lib/motion/gsap";

// SplitText serve solo qui e in TextLines: registrazione locale, mai nel
// chunk del layout (gsap.ts è importato da SmoothScroll).
gsap.registerPlugin(SplitText);

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

        if (!c.desktop) {
          // Ramo mobile/tablet: per ora silenzio voluto — niente [data-on],
          // pannelli in colonna e completi. La coreografia verticale (reveal
          // dei pannelli, chars, sipario) arriva con la Fase 2.
          return;
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
          gsap.set(el, { autoAlpha: 0, y: 28 });
          // Replay a ogni passaggio: il tween resta in closure — restart a
          // ogni ingresso, reverse risalendo oltre l'inizio.
          let tw: gsap.core.Tween | null = null;
          const play = () => {
            if (!tw) {
              tw = gsap.to(el, { autoAlpha: 1, y: 0, duration: dur.reveal, ease: "domus", paused: true });
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
                stl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "dtOut" }, 0);
                if (img) stl.to(img, { scale: 1, duration: 1.6, ease: "dtOut" }, 0);
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
