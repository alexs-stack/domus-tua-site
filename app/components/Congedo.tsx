"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { heroCinematic } from "../lib/media";

/* Congedo — la banda video finale (spec 4.15, rif. immobiliaregoldengoal.it):
   il clip drone a tutta larghezza, titolo bianco d1 in basso a sinistra e il
   link "Contattaci" sottolineato. Nessun velo: il video è il fondo. Niente GSAP. */

// Still del clip drone: è il poster (lazy e ridimensionato da next/image) e
// l'unica immagine dove il video non parte. Non `heroCinematic.poster`: quel
// ritratto è chiaro e il bianco senza velo non ci si legge.
const POSTER = "/media/hero-aerial.jpg";

const copy = {
  it: { title: "Vendere casa, senza stress.", cta: "Contattaci" },
  en: { title: "Selling your home, without stress.", cta: "Contact us" },
  fr: { title: "Vendre votre bien, sans stress.", cta: "Contactez-nous" },
  de: { title: "Verkaufen ohne Stress.", cta: "Kontakt" },
  es: { title: "Vender casa, sin estrés.", cta: "Contáctanos" },
} as const;

export default function Congedo() {
  const { locale } = useLocale();
  const c = copy[locale];
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Il video parte solo con motion ok, da 768 in su (le soglie di MQ in
  // lib/motion/gsap.ts, non importate per non tirarsi dietro GSAP) e quando la
  // banda è vicina allo schermo. Niente autoPlay e preload="none": sotto 768 e
  // con reduced-motion il mp4 (5,4 MB) non viene mai richiesto, resta la foto.
  useEffect(() => {
    const v = videoRef.current;
    const host = sectionRef.current;
    if (!v || !host) return;
    const mqs = [
      matchMedia("(prefers-reduced-motion: no-preference)"),
      matchMedia("(min-width: 768px)"),
    ];
    let near = false;
    const sync = () => {
      if (near && mqs.every((m) => m.matches)) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        sync();
      },
      { rootMargin: "40% 0px" }
    );
    io.observe(host);
    mqs.forEach((m) => m.addEventListener("change", sync));
    return () => {
      io.disconnect();
      mqs.forEach((m) => m.removeEventListener("change", sync));
      v.pause();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="congedo-title"
      className="relative aspect-video min-h-[70svh] w-full overflow-hidden bg-cream-deep"
    >
      {/* 20%: dove la banda non è 16:9 (telefono, tablet verticale) il taglio
          tiene gli alberi a sinistra, sotto il titolo bianco; a 16:9 non taglia. */}
      <Image src={POSTER} alt="" fill sizes="100vw" className="object-cover object-[20%_50%]" />
      {/* Senza poster: finché non ha un frame è trasparente e sotto resta la foto. */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-[20%_50%]"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
      >
        {heroCinematic.webm && <source src={heroCinematic.webm} type="video/webm" />}
        <source src={heroCinematic.mp4} type="video/mp4" />
      </video>

      <div className="dt-row absolute inset-x-0 bottom-[12vh]">
        <h2
          id="congedo-title"
          className="max-w-[12ch] text-balance font-display text-d1 text-white [text-shadow:0_2px_14px_rgb(0_0_0/0.35)]"
        >
          {c.title}
        </h2>
        {/* Le regole .dt-btn sono unlayered: per la taglia d4 leggera serve `!`. */}
        <Cta href="#contatti" variant="ghost-dark" arrow={false} className="mt-8 !text-d4 !font-light">
          {c.cta}
        </Cta>
      </div>
    </section>
  );
}
