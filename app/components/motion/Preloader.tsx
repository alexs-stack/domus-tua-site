"use client";

// Preloader "Segno Domus" — prima visita della sessione.
// L'attributo <html data-preloader> è messo da un inline script nel layout
// PRIMA del primo paint (vedi app/layout.tsx): qui si coreografa e si smonta.
// - Una volta per sessione (sessionStorage), max ~2.2s, skip con click/tasto.
// - Assente con reduced-motion e senza JS (l'attributo non viene mai messo).
// - Non blocca l'LCP: l'hero sotto continua fetch/decode; l'overlay è solo
//   un layer fixed sopra (nessun ritardo di mount del contenuto).
// - L'uscita È l'inizio dell'hero: a "exit" parte l'evento INTRO_EVENT che
//   HeroCinematic usa come handoff per la propria timeline.
import { useRef } from "react";
import { gsap, useGSAP, dur } from "../../lib/motion/gsap";
import { SegnoDomus } from "../BrandMotif";
import { getLenis } from "./SmoothScroll";

export const INTRO_EVENT = "dt:intro:done";
export const INTRO_KEY = "dt-intro-seen";

/** True se il preloader è attivo in questo istante (per l'handoff dell'hero). */
export function isIntroRunning(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-preloader");
}

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const html = document.documentElement;
      if (!root || !html.hasAttribute("data-preloader")) return;

      const finish = () => {
        try {
          sessionStorage.setItem(INTRO_KEY, "1");
        } catch {
          /* storage pieno/bloccato: pazienza, si rivedrà */
        }
        html.removeAttribute("data-preloader");
        // Ripristina il contratto Lenis↔ScrollTrigger (vedi sotto).
        gsap.ticker.lagSmoothing(0);
        getLenis()?.start();
      };

      // Cintura e bretelle: l'inline script già esclude reduced-motion,
      // ma se l'utente lo attiva tra paint e idratazione chiudiamo subito.
      if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
        window.dispatchEvent(new Event(INTRO_EVENT));
        finish();
        return;
      }

      getLenis()?.stop();

      // Il jank di avvio (idratazione, decode immagini) con lagSmoothing(0)
      // farebbe saltare la timeline in avanti di secondi al primo tick.
      // Durante l'intro lo scroll è bloccato, quindi lo smoothing è sicuro;
      // finish() lo riporta a 0 (contratto SmoothScroll/Lenis).
      gsap.ticker.lagSmoothing(500, 33);

      const panel = root.querySelector<HTMLElement>("[data-pre-panel]");
      const content = root.querySelector<HTMLElement>("[data-pre-content]");
      const words = root.querySelectorAll<HTMLElement>("[data-pre-word]");
      const count = root.querySelector<HTMLElement>("[data-pre-count]");
      const paths = root.querySelectorAll<SVGPathElement>("svg path");
      if (!panel || !content) {
        window.dispatchEvent(new Event(INTRO_EVENT));
        finish();
        return;
      }

      // Il Segno si disegna a runtime (stessa tecnica di DrawOnScroll).
      paths.forEach((p) => {
        const len = p.getTotalLength() + 2;
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      });

      const counter = { v: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "domus" },
        onComplete: finish,
      });

      tl.to(content, { autoAlpha: 1, duration: 0.3, ease: "none" }, 0)
        .to(
          paths,
          { strokeDashoffset: 0, duration: 1.05, ease: "power2.inOut", stagger: 0.16 },
          0.1
        )
        .fromTo(
          words,
          { yPercent: 120 },
          { yPercent: 0, duration: dur.reveal, stagger: 0.09 },
          0.28
        )
        .to(
          counter,
          {
            v: 100,
            duration: 1.35,
            ease: "power2.inOut",
            onUpdate() {
              if (count) count.textContent = String(Math.round(counter.v));
            },
          },
          0.1
        )
        .add("exit", 1.5)
        // L'handoff parte QUI: il sipario si apre mentre l'hero entra sotto.
        .call(() => window.dispatchEvent(new Event(INTRO_EVENT)), [], "exit")
        .to(content, { yPercent: -12, autoAlpha: 0, duration: 0.45, ease: "domus.inOut" }, "exit")
        .to(
          panel,
          { clipPath: "inset(0% 0% 100% 0%)", duration: 0.7, ease: "domus.inOut" },
          "exit+=0.08"
        );

      // Skip: al primo click/tasto si salta dritti all'uscita (mai bloccare).
      const skip = () => {
        if (tl.time() < tl.labels.exit) tl.seek("exit");
      };
      window.addEventListener("pointerdown", skip);
      window.addEventListener("keydown", skip);

      return () => {
        window.removeEventListener("pointerdown", skip);
        window.removeEventListener("keydown", skip);
        // Se il componente muore a metà intro (HMR, nav): mai lasciare la
        // pagina bloccata sotto l'overlay.
        if (html.hasAttribute("data-preloader")) finish();
      };
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} aria-hidden className="dt-preloader">
      <div data-pre-panel className="absolute inset-0 overflow-hidden bg-espresso">
        {/* Profondità calda, mai nero piatto (stesse regole di .bg-ink). */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(95% 130% at 12% -10%, rgba(150, 26, 24, 0.32), transparent 55%), radial-gradient(90% 120% at 102% 112%, rgba(24, 12, 12, 0.9), transparent 60%)",
          }}
        />
        <div className="grain !absolute !z-0" aria-hidden />

        <div data-pre-content className="relative flex h-full flex-col items-center justify-center">
          <SegnoDomus className="h-12 w-28" />
          <div className="mt-5 overflow-hidden">
            <span
              data-pre-word
              className="block font-display text-3xl font-medium italic tracking-tight text-cream sm:text-4xl"
            >
              Domus Tua
            </span>
          </div>
          <div className="mt-1 overflow-hidden">
            <span
              data-pre-word
              className="block text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-cream/55"
            >
              Tradate · dal 2007
            </span>
          </div>

          <div className="absolute bottom-7 right-7 sm:bottom-10 sm:right-12">
            <span data-pre-count className="tnum font-display text-6xl font-medium text-cream/85 sm:text-7xl">
              0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
