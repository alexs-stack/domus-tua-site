import Image from "next/image";
import Reveal from "./Reveal";
import { Star, Play, Quote } from "./Icons";

type Props = {
  quote?: string;
  author?: string;
  context?: string;
  image?: string;
  alt?: string;
  videoHref?: string;
};

const defaults = {
  quote:
    "Ci hanno ascoltato prima ancora di parlare di prezzo. L’appartamento è stato venduto al primo Open Domus, e noi sereni dall’inizio alla fine.",
  author: "Cliente Domus Tua",
  context: "Venduto al primo Open Domus, Tradate",
  image: "/images/reali/recensione-clienti.jpg",
  alt: "Raffaela Rizza con una cliente nella video recensione Domus Tua",
  videoHref: "https://www.youtube.com/watch?v=BEmbT6WbZ-c",
};

export default function FeaturedTestimonial(props: Props) {
  const { quote, author, context, image, alt, videoHref } = { ...defaults, ...props };

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <div className="grid items-stretch gap-6 overflow-hidden rounded-[2rem] border border-line bg-cream lg:grid-cols-[1.05fr_0.95fr]">
            {/* Citazione */}
            <div className="flex flex-col justify-between p-8 sm:p-12">
              <div>
                <span className="eyebrow">Una storia, tra centinaia</span>
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
                  Guarda la video recensione
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
                aria-label="Guarda la video recensione su YouTube"
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
