import Image from "next/image";
import Reveal from "./Reveal";
import { Play, ArrowUpRight, Instagram, Star } from "./Icons";
import { site } from "../lib/site";

type Vid = {
  title: string;
  thumb: string;
  href: string;
  kind: "Video recensione" | "Tour immobiliare" | "Dietro le quinte";
};

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// Video reali dal canale YouTube di Domus Tua.
const featured: Vid = {
  title: "La storia di Teresa: venduta al primo Open Domus",
  thumb: "/images/reali/video/recensione-teresa.jpg",
  href: yt("gYePYQHNTUM"),
  kind: "Video recensione",
};

const wall: Vid[] = [
  { title: "Venduto al primo Open Domus", thumb: "/images/reali/video/recensione-opendomus.jpg", href: yt("BEmbT6WbZ-c"), kind: "Video recensione" },
  { title: "Domus Tua al cinema, su Prime Video", thumb: "/images/reali/video/team-cinema.jpg", href: yt("PRB3exiOa3I"), kind: "Dietro le quinte" },
  { title: "Villa Mozart, Tradate", thumb: "/images/reali/video/mozart.jpg", href: yt("X8dRz1629F0"), kind: "Tour immobiliare" },
  { title: "Villa con domotica e fotovoltaico", thumb: "/images/reali/video/domotica.jpg", href: yt("E70G5l_CTWg"), kind: "Tour immobiliare" },
  { title: "Terra-tetto con veranda, Vedano Olona", thumb: "/images/reali/video/veranda-vedano.jpg", href: yt("qXYpUw3QC2E"), kind: "Tour immobiliare" },
  { title: "Quadrilocale con giardino di 870 mq", thumb: "/images/reali/video/quadrilocale-giardino.jpg", href: yt("rARkECgXUbU"), kind: "Tour immobiliare" },
];

const chips = ["Emotional video real estate", "Open Domus", "Centinaia di video", "Social preview"];

function PlayBadge({ small }: { small?: boolean }) {
  return (
    <span
      className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110 ${
        small ? "h-11 w-11" : "h-16 w-16"
      }`}
    >
      <Play className={small ? "h-4 w-4" : "h-6 w-6"} />
    </span>
  );
}

function VideoCard({ v, small }: { v: Vid; small?: boolean }) {
  return (
    <a
      href={v.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block h-full overflow-hidden rounded-[1.5rem] border border-line bg-ink"
    >
      <div className={`relative ${small ? "aspect-video" : "h-full min-h-[260px]"}`}>
        <Image
          src={v.thumb}
          alt={v.title}
          fill
          sizes={small ? "(max-width:1024px) 50vw, 300px" : "(max-width:1024px) 100vw, 640px"}
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
        <PlayBadge small={small} />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-red">
          {v.kind}
        </span>
        <p className={`absolute inset-x-4 bottom-4 font-medium text-white ${small ? "text-sm" : "text-lg sm:text-xl"}`}>
          {v.title}
        </p>
      </div>
    </a>
  );
}

export default function SocialVideoWall() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">La nostra energia</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            Ci vedi prima ancora di conoscerci.
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-stone sm:text-lg">
            Video emozionali, Open Domus, social e contenuti raccontano ogni casa con la cura che
            merita. È così che i nostri clienti si fidano di noi ancora prima della prima visita.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[0.8rem] font-medium text-graphite"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red" />
                {c}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Muro video asimmetrico */}
        <Reveal delay={100} className="mt-12">
          <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            <div className="lg:col-span-2 lg:row-span-2">
              <VideoCard v={featured} />
            </div>
            <VideoCard v={wall[0]} small />
            <VideoCard v={wall[1]} small />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {wall.slice(2).map((v) => (
              <VideoCard key={v.href} v={v} small />
            ))}
          </div>
        </Reveal>

        {/* Proof + CTA */}
        <Reveal delay={150} className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-line pt-8 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2.5">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-red" />
              ))}
            </span>
            <span className="text-sm text-graphite">
              <span className="font-semibold text-ink">{site.rating}/5</span> · oltre 500 recensioni ·
              raccontate anche in video
            </span>
          </span>

          <div className="flex flex-wrap gap-3">
            <a
              href={site.social.youtube.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-dark active:scale-[0.98]"
            >
              Guarda le video recensioni
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            <a
              href={site.social.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:border-red hover:text-red"
            >
              <Instagram className="h-4 w-4" /> Seguici su Instagram
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
