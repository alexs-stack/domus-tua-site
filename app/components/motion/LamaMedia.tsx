"use client";
// LamaMedia — la lama, il ruolo comune `media` (A36 di Alberto, 19 settembre
// 2026; brief D200-D219 in .superpowers/sdd/…/qualita/a36/). Ogni fotografia non
// a schermo intero dentro un modulo entra come su era-residence: il modulo
// `[data-lama]` apre un ritaglio a parallelogramma dal bordo (clipSlantFrom,
// lama.ts) mentre l'interno `[data-lama-inner]` scivola di X % e si assesta; 1,2 s
// dtInOut, ritardo 0,3 + i × 0,1 s; uscita 0,4 s dtIn con l'immagine ferma.
// Nessuna scala (A27), nessuno ScrollTrigger: due IntersectionObserver propri
// (D214), l'entrata a 0 px e l'uscita alla linea dell'85 % (D21).
//
// La macchina a stati (D209): riposo → (primo callback, sotto la piega) armato →
// (entry o exitLine che interseca, foto caricata) entrata → aperto → (exitLine
// che smette di intersecare dal basso) uscita → armato → … Il modulo già in vista
// al primo callback è aperto senza stili e non lampeggia (D211); entry che
// smette di intersecare dal basso riporta ad armato in un `set`; un rientro
// dall'alto dopo un salto apre all'istante. Uscita a metà entrata: la corsa torna
// indietro sulla stessa famiglia affine (D213). `focusin` apre all'istante.
// `data-bg`, dove il modulo è una zona del monogramma, dice avorio da chiusa e
// foto dall'onStart (D210). `will-change` solo in corsa (D215).
//
// Sotto `useMotionFrozen()` (/case/[slug], A26/D32, D205) rende il fade-up di
// oggi, `<Reveal delay={frozenDelay}>` attorno al modulo nudo. Con reduced-motion
// o senza JS: nessuno stile, foto intera.
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";
import { LAMA, LAMA_FOR, clipSlantFrom, clipSlantOut, delayFor, type LamaId } from "../../lib/motion/lama";
import Reveal from "../Reveal";
import { useMotionFrozen } from "./MotionFreeze";

type Stato = "riposo" | "armato" | "entrata" | "aperto" | "uscita";

type LamaMediaProps = {
  /** La foto, nella tabella LAMA_FOR: decide verso e scivolo (D201-D203). */
  id: LamaId;
  /** Le classi del modulo (`dt-media-half`, `dt-media-column`, …). */
  className?: string;
  /** L'`<Image fill>`: sta nell'interno che scivola. */
  children: ReactNode;
  /** Quel che sta sopra la foto dentro il ritaglio (il cerchio del play): dopo l'interno, fermo (D208). */
  sopra?: ReactNode;
  /** L'indice nel gruppo `[data-lama-group]`; senza, si legge dall'ordine DOM (D204). */
  index?: number;
  /** Il ritardo del fade-up su /case/[slug] (D205). */
  frozenDelay?: number;
  /** Zona del monogramma (A21): "foto" a riposo; la primitiva la porta ad avorio da chiusa (D210). */
  "data-bg"?: "foto";
  "data-sink-frame"?: string;
};

export default function LamaMedia({
  id,
  className = "",
  children,
  sopra,
  index,
  frozenDelay = 0,
  "data-bg": dataBg,
  "data-sink-frame": dataSinkFrame,
}: LamaMediaProps) {
  const frozen = useMotionFrozen();
  const ref = useRef<HTMLDivElement | null>(null);
  const { from, x } = LAMA_FOR[id];
  const xChiuso = from === "right" ? x : -x;

  useGSAP(
    () => {
      const box = ref.current;
      if (!box || frozen) return;
      const inner = box.querySelector<HTMLElement>("[data-lama-inner]");
      if (!inner) return;
      const img = inner.querySelector("img");
      const zona = box.hasAttribute("data-bg");
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        let stato: Stato = "riposo";
        let tl: gsap.core.Timeline | null = null;
        let primoEntry = true;
        let primoExit = true;
        let attesaLoad: (() => void) | null = null;

        const gruppo = box.closest("[data-lama-group]");
        const i =
          index ??
          (gruppo ? Array.from(gruppo.querySelectorAll("[data-lama]")).indexOf(box) : 0);
        const ritardo = delayFor(Math.max(0, i));

        const promuovi = () => {
          box.style.willChange = "clip-path";
          inner.style.willChange = "transform";
        };
        const smetti = () => {
          box.style.willChange = "";
          inner.style.willChange = "";
        };
        const bg = (v: "foto" | "avorio") => {
          if (zona) box.setAttribute("data-bg", v);
        };
        const disarma = () => {
          if (attesaLoad && img) img.removeEventListener("load", attesaLoad);
          attesaLoad = null;
        };

        /** Lo stato chiuso, in un `set`: da qui parte ogni entrata (D209). */
        const chiudi = () => {
          tl?.kill();
          tl = null;
          smetti();
          gsap.set(box, { clipPath: clipSlantFrom(0, from) });
          gsap.set(inner, { xPercent: xChiuso });
          bg("avorio");
          stato = "armato";
          // La decodifica parte all'armamento (D215): il primo fotogramma non ridecodifica.
          void img?.decode?.().catch(() => {});
        };

        /** Aperto senza corsa: nessuno stile (rientro dall'alto, fuoco, fine corsa). */
        const apri = () => {
          tl?.kill();
          tl = null;
          disarma();
          smetti();
          box.style.removeProperty("clip-path");
          gsap.set(inner, { clearProps: "transform" });
          bg("foto");
          stato = "aperto";
        };

        const entra = () => {
          if (stato !== "armato") return;
          // L'entrata parte al più tardo fra il trigger e il `load` della foto (D215).
          if (img && !(img.complete && img.naturalWidth > 0)) {
            if (!attesaLoad) {
              attesaLoad = () => {
                attesaLoad = null;
                entra();
              };
              img.addEventListener("load", attesaLoad, { once: true });
            }
            return;
          }
          stato = "entrata";
          tl = gsap.timeline({
            delay: ritardo,
            onStart: () => {
              promuovi();
              bg("foto");
            },
            onComplete: apri,
          });
          tl.fromTo(
            box,
            { clipPath: clipSlantFrom(0, from) },
            { clipPath: clipSlantFrom(1, from), duration: LAMA.dur, ease: LAMA.ease, overwrite: true },
            0,
          );
          tl.fromTo(
            inner,
            { xPercent: xChiuso },
            { xPercent: 0, duration: LAMA.dur, ease: LAMA.ease, overwrite: true },
            0,
          );
        };

        const esci = () => {
          if (stato === "aperto") {
            stato = "uscita";
            promuovi();
            tl = gsap.timeline({ onComplete: chiudi });
            tl.fromTo(
              box,
              { clipPath: clipSlantOut(0, from) },
              { clipPath: clipSlantOut(1, from), duration: LAMA.outDur, ease: LAMA.outEase, overwrite: true },
              0,
            );
          } else if (stato === "entrata") {
            // A metà entrata la corsa torna indietro sulla stessa famiglia (D213):
            // dal valore inline a clipSlantFrom(0), l'interno a ∓X, stessa curva.
            tl?.kill();
            stato = "uscita";
            promuovi();
            tl = gsap.timeline({ onComplete: chiudi });
            tl.to(box, { clipPath: clipSlantFrom(0, from), duration: LAMA.outDur, ease: LAMA.outEase, overwrite: true }, 0);
            tl.to(inner, { xPercent: xChiuso, duration: LAMA.outDur, ease: LAMA.outEase, overwrite: true }, 0);
          }
        };

        const entry = new IntersectionObserver(
          ([e]) => {
            if (!e) return;
            if (primoEntry) {
              primoEntry = false;
              if (e.boundingClientRect.top >= window.innerHeight) chiudi();
              else stato = "aperto";
              return;
            }
            if (e.isIntersecting) {
              if (stato !== "armato") return;
              // Rientro dall'alto dopo un salto: aperto all'istante, senza corsa.
              if (e.boundingClientRect.top < 0) apri();
              else entra();
            } else if (e.boundingClientRect.top >= window.innerHeight && stato !== "riposo") {
              // Uscito dal basso: nessuno lo vede, si riarma in un `set`.
              disarma();
              chiudi();
            }
          },
          { rootMargin: LAMA.entryMargin, threshold: 0 },
        );
        const exitLine = new IntersectionObserver(
          ([e]) => {
            if (!e) return;
            if (primoExit) {
              primoExit = false;
              return;
            }
            if (e.isIntersecting) {
              // Dopo un'uscita `entry` sta ancora intersecando e non notifica più:
              // l'entrata riparte da qui (D209).
              if (stato === "armato") entra();
            } else if (e.rootBounds && e.boundingClientRect.top >= e.rootBounds.bottom) {
              esci();
            }
          },
          { rootMargin: LAMA.exitMargin, threshold: 0 },
        );
        entry.observe(box);
        exitLine.observe(box);

        // Tastiera (spec §2.4): il fuoco dentro il modulo o sul link che lo avvolge apre subito.
        const onFocus = () => {
          if (stato !== "aperto") apri();
        };
        const host = box.closest("a") ?? box;
        host.addEventListener("focusin", onFocus);

        return () => {
          entry.disconnect();
          exitLine.disconnect();
          host.removeEventListener("focusin", onFocus);
          disarma();
          tl?.kill();
          smetti();
          box.style.removeProperty("clip-path");
          gsap.set(inner, { clearProps: "transform" });
          bg("foto");
        };
      });
    },
    { scope: ref, dependencies: [id, index, frozen], revertOnUpdate: true },
  );

  if (frozen) {
    // Il DOM di /case resta quello di oggi: il Reveal AVVOLGE il modulo nudo (D205).
    return (
      <Reveal delay={frozenDelay}>
        <div className={className}>
          <div className="absolute inset-0">{children}</div>
          {sopra}
        </div>
      </Reveal>
    );
  }

  return (
    <div
      ref={ref}
      data-lama
      data-from={from}
      data-bg={dataBg}
      data-sink-frame={dataSinkFrame}
      className={className}
    >
      <div data-lama-inner className="absolute inset-0">
        {children}
      </div>
      {sopra}
    </div>
  );
}
