"use client";

// RotatingMark: il badge di marca, anello di tacche e monogramma, rif.
// era-residence.com (reverse-engineering/era-residence/README.md §5).
//
// Senso ORARIO, anello e monogramma nello stesso verso: richiesta della
// cliente del 2026-09-10 («il cuore deve ruotare in senso orario», C06). A
// riposo MARK_REST_DEG_S gradi al secondo; con lo scroll di Lenis
// MARK_REST_DEG_S + MARK_GAIN·min(|v|, MARK_VMAX), mai invertito. Il tetto è
// della spec del 13 settembre 2026 (§6.1, D34): un End nativo dava una velocità
// pari all'intero salto. La modulazione si arma alla prima interazione vera:
// rotella, dito, o un tasto di scorrimento premuto fuori dai campi.
//
// `paused` ferma il ticker. Lo usa la testata da 1280 px quando il segno fisso
// di MarkSegno ha preso il posto del badge (Alberto, «Si stacca da 1024», A21).
// Il ticker è fermo anche sotto il sipario del preloader, dove non si vede.
//
// Il logo NON viene ridisegnato né deformato (divieto del brand book su morph e
// draw): è il monogramma depositato, ruotato attorno al proprio centro.
//
// Con reduced-motion o senza JS nulla si muove e il badge resta com'è
// nell'HTML: il monogramma è centrato con flexbox, non con un transform,
// perché GSAP possa scrivere `transform` senza portarsi via il centraggio.
import { useEffect, useRef } from "react";
import { gsap, useGSAP, dur } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";
import { MARK_GAIN, MARK_REST_DEG_S, MARK_VMAX } from "../../lib/motion/mark";
import { getLenis } from "./SmoothScroll";
// Il badge statico (anello + monogramma) vive in MarkBadge.tsx, SENZA
// "use client": lo rende anche la shell del preloader dal server
// (PreloaderShell.tsx). Qui si aggiunge solo il moto da GSAP.
import { MarkBadge } from "./MarkBadge";

/** I tasti che scorrono la pagina e armano la modulazione. */
const TASTI_SCROLL = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", " ", "Home", "End"]);

export default function RotatingMark({
  className = "h-12 w-12",
  paused = false,
}: {
  className?: string;
  paused?: boolean;
}) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useGSAP(
    () => {
      const ring = rootRef.current?.querySelector<HTMLElement>("[data-rot-ring]");
      const mark = rootRef.current?.querySelector<HTMLElement>("[data-rot-mark]");
      if (!ring || !mark) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const html = document.documentElement;
        const state = { speed: MARK_REST_DEG_S };
        let rotation = 0;
        let armed = false;
        let idleTimer = 0;

        const arm = () => {
          armed = true;
        };
        const onKey = (e: KeyboardEvent) => {
          if (!TASTI_SCROLL.has(e.key)) return;
          const t = e.target;
          if (t instanceof HTMLElement && (t.isContentEditable || t.closest("input, textarea, select"))) return;
          armed = true;
          window.removeEventListener("keydown", onKey);
        };
        window.addEventListener("wheel", arm, { once: true, passive: true });
        window.addEventListener("touchmove", arm, { once: true, passive: true });
        window.addEventListener("keydown", onKey);

        // Rotazione continua, indipendente dal frame rate (delta limitato: una
        // scheda in background non deve produrre salti di mezzo giro).
        const tick = (_t: number, deltaMS: number) => {
          if (pausedRef.current || html.hasAttribute("data-preloader")) return;
          const dt = Math.min(deltaMS, 100);
          rotation += state.speed * (dt / 1000);
          gsap.set(ring, { rotation, transformOrigin: "center center" });
          gsap.set(mark, { rotation, transformOrigin: "center center" });
        };
        gsap.ticker.add(tick);

        const onScroll = ({ velocity }: { velocity: number }) => {
          if (!armed) return;
          gsap.to(state, {
            speed: MARK_REST_DEG_S + MARK_GAIN * Math.min(Math.abs(velocity), MARK_VMAX),
            duration: 0.3,
            ease: "domus",
            overwrite: true,
          });
          window.clearTimeout(idleTimer);
          idleTimer = window.setTimeout(() => {
            gsap.to(state, { speed: MARK_REST_DEG_S, duration: dur.transition, ease: "domus" });
          }, 100);
        };
        // Lenis può montare dopo di noi: aggancio pigro al primo tick utile.
        let lenis = getLenis();
        lenis?.on("scroll", onScroll);
        const lateAttach = !lenis
          ? window.setInterval(() => {
              lenis = getLenis();
              if (lenis) {
                lenis.on("scroll", onScroll);
                window.clearInterval(lateAttach);
              }
            }, 250)
          : 0;

        return () => {
          gsap.ticker.remove(tick);
          window.removeEventListener("wheel", arm);
          window.removeEventListener("touchmove", arm);
          window.removeEventListener("keydown", onKey);
          window.clearTimeout(idleTimer);
          if (lateAttach) window.clearInterval(lateAttach);
          lenis?.off("scroll", onScroll);
        };
      });
    },
    { scope: rootRef }
  );

  return (
    <span ref={rootRef} className="contents">
      <MarkBadge className={className} />
    </span>
  );
}
