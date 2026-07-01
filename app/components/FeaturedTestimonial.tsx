"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { Star, Play, Quote } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

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

  const defaults = {
    quote: c.quote,
    author: c.author,
    context: c.context,
    image: "/images/reali/recensione-clienti.jpg",
    alt: c.alt,
    videoHref: "https://www.youtube.com/watch?v=BEmbT6WbZ-c",
  };

  const { quote, author, context, image, alt, videoHref } = { ...defaults, ...props };

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal>
          <div className="grid items-stretch gap-6 overflow-hidden rounded-[2rem] border border-line bg-cream lg:grid-cols-[1.05fr_0.95fr]">
            {/* Citazione */}
            <div className="flex flex-col justify-between p-8 sm:p-12">
              <div>
                <span className="eyebrow">{c.eyebrow}</span>
                <Quote className="mt-6 h-10 w-10 text-red/25" />
                <blockquote className="mt-4 font-display text-2xl font-medium leading-[1.25] tracking-tight text-ink sm:text-[2rem]">
                  “{quote}”
                </blockquote>
                <span className="mt-6 flex gap-1">
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

            {/* Immagine */}
            <div className="relative min-h-[280px] lg:min-h-full">
              <Image
                src={image}
                alt={alt}
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover object-center"
              />
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
