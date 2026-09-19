"use client";

// LA BANDA DELLA TESTA: LA FOTO BASE E LO STRATO NITIDO.
//
// D33 (decisione di lavoro per A20 di Alberto, spec §5.1): la foto base resta il
// candidato LCP, con `preload` e i `sizes` di BAND_SIZES (100vw da 1024, così i
// byte dell'LCP non cambiano). Nel tuffo la foto arriva a scala 2: solo nel ramo
// del corridoio (MQ.corridor), solo a DPR 1 e solo se il file è più largo di
// 1920 px si monta una seconda Image a 200vw, trasparente finché non è
// decodificata. Arriva dopo l'LCP: si aspetta la voce largest-contentful-paint
// della foto base, poi requestIdleCallback (al massimo 2,5 s). Se quella voce non
// arriva (browser senza l'API, o un LCP che non è la foto) la rete parte 2,5 s
// dopo il load della foto base. Il cue a 0,4 di PageHeroDive la accende e la
// spegne con `data-dive-deep`. A DPR 2 sarebbe una texture di circa 5.760×3.240:
// non si monta. `data-bg="foto"` sta sulla scatola che scala (correzione
// bloccante 6 della corsia globali, spec §5.1): il suo rettangolo comprende lo
// zoom. `data-dive-inner` è lo strato che cresce dentro la cornice sotto soglia.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MQ } from "../../lib/motion/mq";
import { BAND_SIZES, DIVE, SHARP_SIZES } from "../../lib/motion/page-dive";

/** Accende lo strato nitido se è decodificato e la scatola porta `data-dive-deep`; altrimenti lo spegne. */
export function syncSharp(zoom: HTMLElement): void {
  const sharp = zoom.querySelector<HTMLImageElement>("img[data-dive-sharp]");
  if (!sharp || sharp.dataset.ready !== "1") return;
  sharp.style.opacity = zoom.hasAttribute("data-dive-deep") ? "1" : "0";
}

export default function PageHeroBand({
  src,
  alt,
  objectPosition,
  srcWidth,
}: {
  src: string;
  alt: string;
  objectPosition: string;
  srcWidth: number;
}) {
  const zoomRef = useRef<HTMLDivElement | null>(null);
  const [sharp, setSharp] = useState(false);

  useEffect(() => {
    if (srcWidth <= DIVE.sharpMinSrc) return;
    const zoom = zoomRef.current;
    const base = zoom?.querySelector<HTMLImageElement>("img[data-dive-base]");
    if (!zoom || !base) return;
    const mq = window.matchMedia(MQ.corridor);
    let idle = 0;
    let timer = 0;
    let rete = 0;
    let avviato = false;
    let osservatore: PerformanceObserver | null = null;
    const monta = () => setSharp(true);
    const avviaIdle = () => {
      if (avviato) return;
      avviato = true;
      osservatore?.disconnect();
      if (rete) window.clearTimeout(rete);
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(monta, { timeout: DIVE.sharpIdleMs });
      } else {
        timer = window.setTimeout(monta, DIVE.sharpIdleMs);
      }
    };
    const dopoIlLoad = () => {
      rete = window.setTimeout(avviaIdle, DIVE.sharpIdleMs);
    };
    const annulla = () => {
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
      if (rete) window.clearTimeout(rete);
      osservatore?.disconnect();
      base.removeEventListener("load", dopoIlLoad);
      idle = 0;
      timer = 0;
      rete = 0;
      avviato = false;
      osservatore = null;
    };
    const programma = () => {
      if (!mq.matches || window.devicePixelRatio !== 1) return;
      if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes.includes("largest-contentful-paint")) {
        osservatore = new PerformanceObserver((lista) => {
          for (const voce of lista.getEntries() as Array<PerformanceEntry & { element?: Element | null }>) {
            if (voce.element === base) avviaIdle();
          }
        });
        osservatore.observe({ type: "largest-contentful-paint", buffered: true });
      }
      if (base.complete && base.naturalWidth > 0) dopoIlLoad();
      else base.addEventListener("load", dopoIlLoad, { once: true });
    };
    const onChange = () => {
      annulla();
      setSharp(false);
      zoom.removeAttribute("data-dive-deep");
      programma();
    };
    programma();
    mq.addEventListener("change", onChange);
    return () => {
      annulla();
      mq.removeEventListener("change", onChange);
    };
  }, [srcWidth]);

  return (
    <div ref={zoomRef} data-dive-zoom data-bg="foto" className="dt-media-full !aspect-[4/5] md:!aspect-video">
      <div data-dive-inner className="absolute inset-0">
        {/* preload (non priority, deprecata in Next 16): è l'LCP della pagina. */}
        <Image
          data-dive-base
          src={src}
          alt={alt}
          fill
          preload
          sizes={BAND_SIZES}
          quality={60}
          className="object-cover"
          style={{ objectPosition }}
        />
        {sharp && (
          <Image
            data-dive-sharp
            src={src}
            alt=""
            aria-hidden
            fill
            sizes={SHARP_SIZES}
            quality={60}
            fetchPriority="low"
            className="object-cover"
            style={{ objectPosition, opacity: 0 }}
            onLoad={(e) => {
              const img = e.currentTarget;
              img
                .decode()
                .catch(() => undefined)
                .then(() => {
                  img.dataset.ready = "1";
                  if (zoomRef.current) syncSharp(zoomRef.current);
                });
            }}
          />
        )}
      </div>
    </div>
  );
}
