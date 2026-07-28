"use client";

// Atmosphere — vita per gli sfondi "vuoti" delle sezioni: parole-fantasma
// editoriali che derivano in scrub + bagliori caldi che respirano lentamente
// anche a scroll fermo. Pura decorazione (aria-hidden, pointer-events-none).
// Regola i18n: come parola sono ammessi SOLO nomi propri del brand o numeri
// ("Domus", "Open Domus", "Tradate", "4.9"...), identici in tutte le lingue.
// Il genitore deve essere position:relative; Atmosphere va messo come primo
// figlio della sezione così resta dietro al contenuto.
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  /** Parola fantasma (solo nomi propri/numeri, mai copy traducibile). */
  word?: string;
  /** Posizione + corpo della parola (default: alto a sinistra, 16vw). */
  wordClassName?: string;
  /** Direzione della deriva orizzontale in scrub. */
  drift?: 1 | -1;
  /** Bagliori caldi che respirano (loop lento, in pausa fuori viewport). */
  glow?: boolean;
  /** Colore della parola: ink su fondi chiari, cream su fondi scuri. */
  tone?: "ink" | "cream";
  className?: string;
};

export default function Atmosphere({
  word,
  wordClassName,
  drift = 1,
  glow = false,
  tone = "ink",
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const wordEl = root.querySelector<HTMLElement>("[data-atmo-word]");
        const glows = gsap.utils.toArray<HTMLElement>("[data-atmo-glow]", root);

        if (wordEl) {
          gsap.fromTo(
            wordEl,
            { xPercent: 5 * drift },
            {
              xPercent: -5 * drift,
              ease: "none",
              scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        }

        // Respiro dei bagliori: loop lentissimi, MA solo quando la sezione è
        // in viewport (i loop infiniti fuori schermo sono ticker sprecato).
        const loops = glows.map((g, i) =>
          gsap.to(g, {
            x: i % 2 ? -70 : 70,
            y: i % 2 ? 50 : -40,
            scale: 1.12,
            duration: 13 + i * 4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            paused: true,
          })
        );
        let gate: ScrollTrigger | null = null;
        if (loops.length) {
          gate = ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onToggle(self) {
              loops.forEach((l) => (self.isActive ? l.play() : l.pause()));
            },
          });
        }

        return () => {
          gate?.kill();
          loops.forEach((l) => l.kill());
        };
      });
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {glow && (
        <>
          <div
            data-atmo-glow
            className="absolute -left-[12%] top-[-18%] h-[52vmax] w-[52vmax] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(210, 10, 10, 0.05), transparent 62%)",
            }}
          />
          <div
            data-atmo-glow
            className="absolute -right-[14%] bottom-[-22%] h-[44vmax] w-[44vmax] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255, 252, 244, 0.8), transparent 60%)",
            }}
          />
        </>
      )}
      {word && (
        <span
          data-atmo-word
          className={`absolute select-none whitespace-nowrap font-display font-medium italic leading-none ${
            tone === "cream" ? "text-cream/[0.05]" : "text-ink/[0.04]"
          } ${wordClassName ?? "left-[3%] top-[5%] text-[15vw]"}`}
        >
          {word}
        </span>
      )}
    </div>
  );
}
