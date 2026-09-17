"use client";

// useAmbientVideo: gate unico dei video d'ambiente, voluti con la coreografia
// piena (A18-A20 di Alberto, spec 2026-09-13 §2.7). Chi lo usa oggi: l'acqua di
// Costi chiari in home (D25, D28) e il drone del Congedo (soglia dei 768 px di
// DESIGN.md:401).
// Com'è fatto: il video suona solo con motion ok, da `minWidth`, senza
// risparmio dati e con la scheda visibile. Un IntersectionObserver largo
// (`warm`, 50 % di default) sceglie la sorgente la prima volta che l'host si
// avvicina e mette `preload="auto"`; uno a filo dello schermo fa `play()` in
// vista e `pause()` fuori. La sorgente si sceglie all'avvicinamento e non al
// primo play come scrive §2.7, perché senza sorgente il precarico non avrebbe
// nulla da caricare: scelta del commit 15, fissata da e2e/ambient-video.spec.ts
// e da confermare ad Alberto (handoff).
// Il tempo del video non si scrive mai: riprende da dove si era fermato, come
// Era. Senza JS e fuori dal gate nessun byte di video.
// Non importa GSAP (MQ arriva da mq.ts): il Congedo resta senza GSAP.
// Lo stato sta sull'host in `data-ambient="playing|paused|off"`, per i test.
import { useEffect, type RefObject } from "react";
import { MQ } from "../../lib/motion/mq";
import { pickAmbientSource, type AmbientSources } from "../../lib/motion/ambient";

export type AmbientVideoOptions = {
  /** rootMargin del precarico (default "50% 0px"). */
  warm?: string;
  /** Media query di larghezza (default MQ.desktop, 768 px). */
  minWidth?: string;
  /** Sorgenti scelte al primo avvicinamento; senza, valgono le <source> del markup. */
  sources?: AmbientSources;
};

type ConSaveData = Navigator & { connection?: { saveData?: boolean } };

// I due parametri finiscono in `Ref` di proposito: la regola react-hooks/immutability
// riconosce i ref dal nome, e senza il suffisso `v.pause()` le sembra la modifica di un
// argomento del hook.
export function useAmbientVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  hostRef: RefObject<HTMLElement | null>,
  o: AmbientVideoOptions = {},
): void {
  const warm = o.warm ?? "50% 0px";
  const minWidth = o.minWidth ?? MQ.desktop;
  // Stringhe e non l'oggetto: i chiamanti passano un letterale nuovo a ogni render.
  const hdWebm = o.sources?.hd.webm;
  const hdMp4 = o.sources?.hd.mp4;
  const sdWebm = o.sources?.sd?.webm;
  const sdMp4 = o.sources?.sd?.mp4;

  useEffect(() => {
    const v = videoRef.current;
    const h = hostRef.current;
    if (!v || !h) return;
    const sources: AmbientSources | undefined =
      hdWebm && hdMp4
        ? { hd: { webm: hdWebm, mp4: hdMp4 }, sd: sdWebm && sdMp4 ? { webm: sdWebm, mp4: sdMp4 } : undefined }
        : undefined;
    if (process.env.NODE_ENV !== "production" && (!v.muted || !v.playsInline)) {
      console.warn("useAmbientVideo: il <video> vuole muted e playsInline");
    }

    const motion = matchMedia(MQ.motionOk);
    const wide = matchMedia(minWidth);
    const allowed = () =>
      motion.matches &&
      wide.matches &&
      (navigator as ConSaveData).connection?.saveData !== true &&
      document.visibilityState === "visible";
    let near = false;
    let inView = false;
    let chosen = !sources;
    const mark = (s: "playing" | "paused" | "off") => h.setAttribute("data-ambient", s);
    const markStill = () => {
      if (v.paused) mark(allowed() ? "paused" : "off");
    };

    const sync = () => {
      if (!allowed()) {
        v.pause();
        markStill();
        return;
      }
      if (near || inView) {
        if (!chosen && sources) {
          const r = h.getBoundingClientRect();
          v.src = pickAmbientSource(sources, {
            w: r.width,
            h: r.height,
            dpr: window.devicePixelRatio || 1,
            webm: v.canPlayType('video/webm; codecs="vp9"') === "probably",
          });
          chosen = true;
        }
        v.preload = "auto";
      }
      if (inView) {
        v.play().catch(markStill);
      } else {
        v.pause();
        markStill();
      }
    };

    const onPlaying = () => mark("playing");
    const ioWarm = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        sync();
      },
      { rootMargin: warm },
    );
    const ioView = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        sync();
      },
      { rootMargin: "0px" },
    );
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", markStill);
    motion.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    ioWarm.observe(h);
    ioView.observe(h);
    sync();

    return () => {
      ioWarm.disconnect();
      ioView.disconnect();
      motion.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", markStill);
      v.pause();
    };
  }, [videoRef, hostRef, warm, minWidth, hdWebm, hdMp4, sdWebm, sdMp4]);
}
