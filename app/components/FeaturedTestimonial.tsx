"use client";

// La testimonianza in evidenza — sul chiaro (rivista bianca, 2026-09-10):
// foto quadrata a sinistra, a destra eyebrow, citazione in Playfair d3
// (tondo: blockquote resta in minuscolo per regola globale), nome e
// contesto a 19 px, link sottolineato al video. Via la lastra `bg-ink`,
// il sipario, il velo scuro, il tralcio, le stelle e la parallasse da
// puntatore. I testi e le props sono gli stessi.
import Image from "next/image";
import Reveal from "./Reveal";
import Parallax from "./motion/Parallax";
import { Cta } from "./primitives/Cta";
import { testimonialVideo, youtubeWatch } from "../lib/videos";
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
    image: "/images/reali/consulenza.jpg",
    alt: c.alt,
    videoHref: youtubeWatch(testimonialVideo.id),
  };

  const { quote, author, context, image, alt, videoHref } = { ...defaults, ...props };

  return (
    <section className="dt-chapter bg-cream">
      <div className="dt-row grid gap-[6vw] lg:grid-cols-[1fr_1.2fr] lg:items-center">
        {/* La foto, quadrata e senza velo: deriva ±4 % allo scroll. */}
        <Parallax speed={-0.04}>
          <div className="relative aspect-square">
            <Image
              src={image}
              alt={alt}
              fill
              sizes="(max-width:1024px) 100vw, 45vw"
              // Niente `priority`: l'unica immagine prioritaria del sito è l'hero.
              quality={75}
              className="object-cover"
            />
          </div>
        </Parallax>

        <div>
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          {/* Il cuore della sezione: citazione display, in tondo. */}
          <Reveal delay={80}>
            <blockquote className="mt-6 font-display text-d3 text-ink">{quote}</blockquote>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 text-body text-graphite">
              {author} · {context}
            </p>
          </Reveal>
          <Reveal delay={200}>
            <Cta
              href={videoHref}
              variant="ghost"
              className="mt-8"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={c.watchVideoAria}
            >
              {c.watchVideo}
            </Cta>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
