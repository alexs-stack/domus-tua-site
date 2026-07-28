"use client";

import Image from "next/image";
import { useRef } from "react";
import Reveal from "./Reveal";
import MaskReveal from "./motion/MaskReveal";
import Parallax from "./motion/Parallax";
import TextLines from "./motion/TextLines";
import { Star, Play } from "./Icons";
import { site } from "../lib/site";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";

type Props = {
  quote?: string;
  author?: string;
  context?: string;
  image?: string;
  alt?: string;
  videoHref?: string;
};

const copy = {
  it: {
    eyebrow: "Una storia, tra centinaia",
    quote:
      "Ci hanno ascoltato prima ancora di parlare di prezzo. L’appartamento è stato venduto al primo Open Domus, e noi sereni dall’inizio alla fine.",
    author: "Cliente Domus Tua",
    context: "Venduto al primo Open Domus, Tradate",
    alt: "Raffaela Rizza con una cliente nella video recensione Domus Tua",
    watchVideo: "Guarda la video recensione",
    watchVideoAria: "Guarda la video recensione su YouTube",
  },
  en: {
    eyebrow: "One story, among hundreds",
    quote:
      "They listened to us before we even talked about price. The apartment sold at the very first Open Domus, and we felt at ease from start to finish.",
    author: "Domus Tua client",
    context: "Sold at the first Open Domus, Tradate",
    alt: "Raffaela Rizza with a client in the Domus Tua video testimonial",
    watchVideo: "Watch the video testimonial",
    watchVideoAria: "Watch the video testimonial on YouTube",
  },
  fr: {
    eyebrow: "Une histoire, parmi des centaines",
    quote:
      "Ils nous ont écoutés avant même de parler de prix. L’appartement a été vendu dès le premier Open Domus, et nous avons été sereins du début à la fin.",
    author: "Client Domus Tua",
    context: "Vendu au premier Open Domus, Tradate",
    alt: "Raffaela Rizza avec une cliente dans le témoignage vidéo Domus Tua",
    watchVideo: "Voir le témoignage vidéo",
    watchVideoAria: "Voir le témoignage vidéo sur YouTube",
  },
  de: {
    eyebrow: "Eine Geschichte, unter Hunderten",
    quote:
      "Sie haben uns zugehört, noch bevor über den Preis gesprochen wurde. Die Wohnung wurde schon beim ersten Open Domus verkauft, und wir waren von Anfang bis Ende entspannt.",
    author: "Domus Tua Kundin",
    context: "Beim ersten Open Domus verkauft, Tradate",
    alt: "Raffaela Rizza mit einer Kundin im Domus Tua Video-Testimonial",
    watchVideo: "Video-Testimonial ansehen",
    watchVideoAria: "Video-Testimonial auf YouTube ansehen",
  },
  es: {
    eyebrow: "Una historia, entre cientos",
    quote:
      "Nos escucharon antes incluso de hablar de precio. El piso se vendió en el primer Open Domus, y estuvimos tranquilos de principio a fin.",
    author: "Cliente de Domus Tua",
    context: "Vendido en el primer Open Domus, Tradate",
    alt: "Raffaela Rizza con una clienta en el testimonio en vídeo de Domus Tua",
    watchVideo: "Ver el testimonio en vídeo",
    watchVideoAria: "Ver el testimonio en vídeo en YouTube",
  },
};

export default function FeaturedTestimonial(props: Props) {
  const { locale } = useLocale();
  const c = copy[locale];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glyphRef = useRef<HTMLSpanElement | null>(null);
  const starsRef = useRef<HTMLSpanElement | null>(null);

  // Un'unica timeline all'ingresso della card: la virgoletta si "posa"
  // (scala + rotazione), poi le stelle sbocciano in sequenza. Solo transform.
  // TextLines resta autonomo: ha la sua maschera per righe.
  useGSAP(
    () => {
      const card = cardRef.current;
      if (!card) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: card, start: "top 82%", once: true },
        });
        if (glyphRef.current) {
          tl.fromTo(
            glyphRef.current,
            { scale: 0.7, rotate: -6 },
            {
              scale: 1,
              rotate: 0,
              duration: 1,
              ease: "expo.out",
              clearProps: "transform",
            },
            0
          );
        }
        if (starsRef.current) {
          tl.fromTo(
            starsRef.current.children,
            { scale: 0.6, transformOrigin: "50% 50%" },
            {
              scale: 1,
              duration: 0.6,
              ease: "back.out(1.6)",
              stagger: 0.06,
              clearProps: "scale",
            },
            0.55
          );
        }
      });
    },
    { scope: cardRef }
  );

  const defaults = {
    quote: c.quote,
    author: c.author,
    context: c.context,
    image: "/images/reali/consulenza.jpg",
    alt: c.alt,
    videoHref: `https://www.youtube.com/watch?v=${site.videos.testimonial.id}`,
  };

  const { quote, author, context, image, alt, videoHref } = { ...defaults, ...props };

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <div
            ref={cardRef}
            className="grid items-stretch gap-6 overflow-hidden rounded-[2rem] border border-line bg-cream lg:grid-cols-[1.05fr_0.95fr]"
          >
            {/* Citazione */}
            <div className="flex flex-col justify-between p-8 sm:p-12">
              <div>
                <span className="eyebrow">{c.eyebrow}</span>
                {/* Segno tipografico editoriale: virgoletta rossa fuori scala. */}
                <span
                  ref={glyphRef}
                  aria-hidden
                  className="mt-2 block font-display text-[5.5rem] italic leading-[0.5] text-red/20"
                >
                  “
                </span>
                {/* Il momento tipografico della pagina: le righe salgono dalla maschera. */}
                <TextLines
                  as="blockquote"
                  stagger={0.1}
                  className="mt-4 font-display text-2xl font-medium leading-[1.25] tracking-tight text-ink sm:text-[2rem]"
                >
                  {quote}
                </TextLines>
                <span ref={starsRef} className="mt-6 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-red" />
                  ))}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <div className="leading-tight">
                  <span className="block text-sm font-semibold text-ink">{author}</span>
                  <span className="block text-[0.8rem] text-stone">{context}</span>
                </div>
                <a
                  href={videoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-paper py-2.5 pl-2.5 pr-5 text-sm font-semibold text-ink transition-all duration-300 hover:border-red hover:text-red"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 group-hover:scale-110">
                    <Play className="h-3.5 w-3.5" />
                  </span>
                  {c.watchVideo}
                </a>
              </div>
            </div>

            {/* Immagine — sipario da destra sulla cornice (MaskReveal fuori,
                Parallax dentro): dentro la maschera la foto sovradimensionata
                scorre più lenta. Gradiente e play restano fissi, fuori. */}
            <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
              <MaskReveal from="right" zoom={1.1} className="absolute inset-0" innerClassName="absolute inset-0">
                <Parallax speed={0.12} scale={1.12} className="absolute inset-0" innerClassName="absolute inset-0">
                  <Image
                    src={image}
                    alt={alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="photo-warm object-cover object-center"
                  />
                </Parallax>
              </MaskReveal>
              <span className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent lg:bg-gradient-to-l" />
              <a
                href={videoHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={c.watchVideoAria}
                className="group absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 hover:scale-110"
              >
                <Play className="h-6 w-6" />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
