"use client";

// Cursor custom — punto rosso 8px + anello follower con lerp.
// Solo pointer fine + motion ok (gsap.matchMedia): su touch non esiste e
// niente lo presuppone. Il cursore nativo resta su input/textarea/select/
// iframe (regole in globals.css, classe html.dt-cursor-active).
// Morph contestuali via attributi sui componenti:
//   data-cursor="scopri|trascina|play" (+ data-cursor-label per testo custom)
//   data-magnetic → l'anello si fonde col bottone (gestito da Magnetic).
import { useRef } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

const LABELS: Record<string, string> = {
  scopri: "Scopri",
  trascina: "◂ Trascina ▸",
  play: "",
};

export default function Cursor() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const dot = root.querySelector<HTMLElement>("[data-cur-dot]");
      const ring = root.querySelector<HTMLElement>("[data-cur-ring]");
      const fill = root.querySelector<HTMLElement>("[data-cur-fill]");
      const label = root.querySelector<HTMLElement>("[data-cur-label]");
      const play = root.querySelector<HTMLElement>("[data-cur-play]");
      if (!dot || !ring || !fill || !label || !play) return;

      const mm = gsap.matchMedia();
      mm.add(`${MQ.motionOk} and ${MQ.finePointer}`, () => {
        const html = document.documentElement;
        html.classList.add("dt-cursor-active");

        gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
        gsap.set([fill, play], { scale: 0, autoAlpha: 0 });

        const dotX = gsap.quickTo(dot, "x", { duration: 0.14, ease: "power3.out" });
        const dotY = gsap.quickTo(dot, "y", { duration: 0.14, ease: "power3.out" });
        const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
        const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

        let visible = false;
        let hiddenState = false;
        const show = () => {
          // Mai riapparire mentre lo stato è "hidden" (input/iframe sotto il
          // puntatore): onMove continua a scattare anche lì.
          if (visible || hiddenState) return;
          visible = true;
          gsap.to([dot, ring], { autoAlpha: 1, duration: 0.25, ease: "none" });
        };
        const hide = () => {
          visible = false;
          gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2, ease: "none" });
        };

        const onMove = (e: PointerEvent) => {
          dotX(e.clientX);
          dotY(e.clientY);
          ringX(e.clientX);
          ringY(e.clientY);
          show();
        };

        // Stati contestuali. Un solo owner delle transizioni dell'anello
        // (overwrite: "auto" su ogni tween) + dedup: pointerover scatta a ogni
        // attraversamento di confine elemento, ma i tween partono solo quando
        // (stato, testo) cambiano davvero — niente churn sul percorso caldo.
        let current = "";
        const setState = (state: "default" | "link" | "label" | "magnetic" | "hidden", text = "") => {
          const key = `${state}:${text}`;
          if (key === current) return;
          current = key;
          hiddenState = state === "hidden";
          if (state === "hidden") {
            hide();
            return;
          }
          show();
          const isLabel = state === "label";
          const isPlay = isLabel && text === "";
          label.textContent = isPlay ? "" : text;
          // Con l'etichetta l'anello passa a blend normale: il difference del
          // parent invertirebbe anche il riempimento rosso dei figli.
          gsap.set(ring, { mixBlendMode: isLabel ? "normal" : "difference" });
          gsap.to(ring, {
            scale: state === "magnetic" ? 0.35 : isLabel ? 2.4 : state === "link" ? 1.5 : 1,
            duration: 0.35,
            ease: "domus",
            overwrite: "auto",
          });
          gsap.to(dot, {
            scale: state === "magnetic" ? 1.8 : state === "link" ? 0.5 : isLabel ? 0 : 1,
            duration: 0.3,
            ease: "domus",
            overwrite: "auto",
          });
          gsap.to(fill, {
            scale: isLabel ? 1 : 0,
            autoAlpha: isLabel ? 1 : 0,
            duration: 0.32,
            ease: "domus",
            overwrite: "auto",
          });
          gsap.to(label, {
            autoAlpha: isLabel && !isPlay ? 1 : 0,
            duration: 0.25,
            ease: "none",
            overwrite: "auto",
          });
          gsap.to(play, {
            scale: isPlay ? 1 : 0,
            autoAlpha: isPlay ? 1 : 0,
            duration: 0.3,
            ease: "domus",
            overwrite: "auto",
          });
        };

        const resolve = (target: Element | null) => {
          if (!target) return setState("default");
          const el = target as HTMLElement;
          if (el.closest("input, textarea, select, [contenteditable='true'], iframe"))
            return setState("hidden");
          const tagged = el.closest<HTMLElement>("[data-cursor]");
          if (tagged) {
            const kind = tagged.dataset.cursor || "scopri";
            const text = tagged.dataset.cursorLabel ?? LABELS[kind] ?? LABELS.scopri;
            return setState("label", kind === "play" ? "" : text);
          }
          if (el.closest("[data-magnetic]")) return setState("magnetic");
          if (el.closest("a, button, [role='button'], label, summary")) return setState("link");
          setState("default");
        };

        const onOver = (e: PointerEvent) => resolve(e.target as Element);
        const onDown = () => gsap.to(dot, { scale: 0.65, duration: 0.15, ease: "power2.out" });
        const onUp = (e: PointerEvent) => resolve(e.target as Element);
        const onLeaveDoc = () => hide();
        const onEnterDoc = () => show();

        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerover", onOver, { passive: true });
        window.addEventListener("pointerdown", onDown, { passive: true });
        window.addEventListener("pointerup", onUp, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeaveDoc);
        document.documentElement.addEventListener("pointerenter", onEnterDoc);

        return () => {
          html.classList.remove("dt-cursor-active");
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerover", onOver);
          window.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointerup", onUp);
          document.documentElement.removeEventListener("pointerleave", onLeaveDoc);
          document.documentElement.removeEventListener("pointerenter", onEnterDoc);
        };
      });
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[120]">
      {/* Anello follower: in difference sopra le foto resta sempre leggibile. */}
      <div
        data-cur-ring
        className="fixed left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/90 opacity-0 mix-blend-difference"
      >
        {/* Riempimento rosso per gli stati con etichetta (blend normale). */}
        <div
          data-cur-fill
          className="absolute inset-0 rounded-full bg-red opacity-0 mix-blend-normal"
        />
        <span
          data-cur-label
          className="relative whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.14em] text-white opacity-0 mix-blend-normal"
        />
        <svg
          data-cur-play
          viewBox="0 0 24 24"
          className="relative h-3.5 w-3.5 text-white opacity-0 mix-blend-normal"
          fill="currentColor"
        >
          <path d="M8 5.5v13l11-6.5-11-6.5Z" />
        </svg>
      </div>
      <div data-cur-dot className="fixed left-0 top-0 h-2 w-2 rounded-full bg-red opacity-0" />
    </div>
  );
}
