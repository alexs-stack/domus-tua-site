"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { SegnoDomusBadge } from "./BrandMotif";
import { Cta } from "./primitives/Cta";
import Parallax from "./motion/Parallax";
import TextLines from "./motion/TextLines";
import { gsap, useGSAP, MQ, dur } from "../lib/motion/gsap";

type CTA = { label: string; href: string };

export default function PageHero({
  id,
  eyebrow,
  title,
  subcopy,
  image,
  alt,
  primary,
  secondary,
  trust,
  scrim = "default",
}: {
  /** Ancora della sezione (es. "top" per il nodo di risalita di ThreadNav). */
  id?: string;
  eyebrow: string;
  title: ReactNode;
  subcopy: string;
  image: string;
  alt: string;
  primary: CTA;
  secondary?: CTA;
  trust?: string[];
  /**
   * Intensità dei gradienti di leggibilità.
   *
   * `default` va bene sulle foto scure o comunque scure dietro al testo. Su una
   * foto CHIARA e affollata (interni luminosi, finestre) il titolo crema perde
   * contrasto: lì serve `strong`, la stessa scelta già fatta sull'hero della home
   * quando è passato a una foto luminosa. Non è un vezzo grafico: sotto il titolo
   * deve restare leggibile, non "suggestivo".
   */
  scrim?: "default" | "strong";
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Entrata standard delle pagine interne (atterraggio delle page transition):
  // badge → subcopy → CTA → trust in coda alle righe del titolo (TextLines si
  // coreografa da sé). Il blocco contiene link: opacity + reti di sicurezza.
  // Uscita: leggera deriva verso l'alto in scrub (solo desktop).
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();

      mm.add(MQ.motionOk, () => {
        const els = gsap.utils.toArray<HTMLElement>("[data-ph-el]", root);
        if (!els.length) return;
        const tween = gsap.fromTo(
          els,
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: dur.short, ease: "domus", stagger: 0.09, delay: 0.25, clearProps: "all" }
        );
        const reveal = () => tween.progress(1);
        root.addEventListener("focusin", reveal, { once: true });
        const safety = window.setTimeout(reveal, 2500);
        return () => {
          root.removeEventListener("focusin", reveal);
          window.clearTimeout(safety);
        };
      });

      mm.add(`${MQ.motionOk} and ${MQ.desktop}`, () => {
        gsap.to(contentRef.current, {
          yPercent: -8,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <section ref={rootRef} id={id} className="relative flex min-h-[82vh] w-full items-end overflow-hidden">
      {/* Media in un layer parallax: allo scroll l'immagine resta "indietro" (profondità).
          I gradienti di leggibilità restano fissi sopra il layer. */}
      <Parallax
        className="absolute inset-0"
        innerClassName="absolute inset-0"
        speed={0.22}
        scale={1.08}
        mobile
      >
        {/* preload (non priority, deprecata in Next 16): è la LCP della pagina. */}
        <Image
          src={image}
          alt={alt}
          fill
          preload
          sizes="100vw"
          // Foto di sfondo sotto due velature scure e in movimento (ken-burns): è l'LCP della
          // pagina e su rete lenta il download è il collo di bottiglia. A qualità 60 il file
          // dimezza e la differenza, sotto quelle velature, non si vede — la foto non è il
          // soggetto, è l'atmosfera.
          quality={60}
          className="ken-burns object-cover"
        />
      </Parallax>
      <div
        className={`absolute inset-0 bg-gradient-to-t ${
          scrim === "strong" ? "from-ink/90 via-ink/55" : "from-ink/78 via-ink/28"
        } to-transparent`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-r ${
          scrim === "strong" ? "from-ink/70 via-ink/25" : "from-ink/45"
        } to-transparent`}
      />

      <div ref={contentRef} className="relative mx-auto w-full max-w-[1240px] px-5 pb-14 pt-36 sm:px-8 sm:pb-20">
        <div className="max-w-3xl">
          <span data-ph-el className="inline-flex">
            <SegnoDomusBadge light className="bg-ink/40 backdrop-blur-md">
              {eyebrow}
            </SegnoDomusBadge>
          </span>

          <TextLines
            as="h1"
            className="mt-6 font-display text-[2.6rem] font-medium leading-[1.03] tracking-[-0.02em] text-cream balance sm:text-6xl lg:text-[4.4rem]"
          >
            {title}
          </TextLines>

          <p data-ph-el className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-cream/85 sm:text-lg">
            {subcopy}
          </p>

          <div data-ph-el className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Cta href={primary.href} variant="cta-solid" size="lg">
              {primary.label}
            </Cta>
            {secondary && (
              <Cta href={secondary.href} variant="ghost-dark" size="lg">
                {secondary.label}
              </Cta>
            )}
          </div>

          {trust && trust.length > 0 && (
            <div data-ph-el className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-cream/15 pt-6">
              {trust.map((t) => (
                <span key={t} className="text-[0.8rem] font-medium text-cream/75">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
