"use client";

import { useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import { Star, Google, Play, ArrowUpRight } from "./Icons";
import { site } from "../lib/site";
import { ScriptWidget } from "./WidgetEmbeds";

// Video reali dal canale YouTube di Domus Tua (thumbnail e link autentici).
const videos = [
  {
    name: "Venduto al primo Open Domus",
    thumb: "/images/reali/recensione-clienti.jpg",
    href: "https://www.youtube.com/watch?v=BEmbT6WbZ-c",
  },
  {
    name: "La storia di Teresa, venduta al primo Open Domus",
    thumb: "/images/reali/open-domus-teresa.jpg",
    href: "https://www.youtube.com/watch?v=gYePYQHNTUM",
  },
  {
    name: "Villa Mozart, Tradate",
    thumb: "/images/reali/video-villa-mozart.jpg",
    href: "https://www.youtube.com/watch?v=X8dRz1629F0",
  },
];

type Cat = "Venditori" | "Acquirenti" | "Open Domus" | "Documenti";

// ⚠️ Recensioni rappresentative (DEMO) — da sostituire con recensioni reali Google/Trustindex.
const reviews: { name: string; place: string; cat: Cat; text: string }[] = [
  {
    name: "Marco B.",
    place: "Tradate",
    cat: "Venditori",
    text: "Casa venduta in poche settimane e a un prezzo che non pensavo possibile. Ogni passaggio spiegato con chiarezza: zero stress.",
  },
  {
    name: "Giulia R.",
    place: "Venegono",
    cat: "Acquirenti",
    text: "Cercavamo la prima casa e avevamo mille dubbi. Ci hanno seguito con pazienza fino al rogito, sempre disponibili.",
  },
  {
    name: "Famiglia Conti",
    place: "Castiglione Olona",
    cat: "Open Domus",
    text: "L'Open Domus è stata un'esperienza diversa da tutte le altre visite: tutto preparato, ordinato e professionale.",
  },
  {
    name: "Stefano M.",
    place: "Tradate",
    cat: "Documenti",
    text: "La parte burocratica mi spaventava. Hanno verificato tutto prima, e siamo arrivati alla firma senza una sorpresa.",
  },
  {
    name: "Antonella P.",
    place: "Lonate Ceppino",
    cat: "Venditori",
    text: "Foto, rendering e home staging hanno fatto la differenza. L'immobile sembrava un'altra casa, in senso bellissimo.",
  },
  {
    name: "Davide e Sara",
    place: "Gornate",
    cat: "Acquirenti",
    text: "Ci siamo sentiti accompagnati, non spinti. Trasparenza totale su ogni aspetto: consigliatissimi.",
  },
  {
    name: "Luca F.",
    place: "Tradate",
    cat: "Open Domus",
    text: "Tante persone interessate nello stesso giorno, ben gestite. Abbiamo ricevuto una proposta concreta quasi subito.",
  },
  {
    name: "Rita V.",
    place: "Abbiate Guazzone",
    cat: "Documenti",
    text: "Professionalità e umanità insieme. Mi hanno chiarito ogni documento con calma, facendomi sentire al sicuro.",
  },
];

const filters: ("Tutte" | Cat)[] = ["Tutte", "Venditori", "Acquirenti", "Open Domus", "Documenti"];

export default function Reviews() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Tutte");
  const shown = filter === "Tutte" ? reviews : reviews.filter((r) => r.cat === filter);

  return (
    <section id="recensioni" className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <Reveal>
            <span className="eyebrow">Recensioni</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              Lo raccontano le persone che hanno scelto Domus Tua.
            </h2>
            <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-stone">
              Ogni recensione è una storia di fiducia, cura e accompagnamento. Oltre 500 famiglie
              hanno vissuto un modo diverso di affrontare la vendita e l'acquisto.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-[1.75rem] border border-line bg-cream p-6">
              <div className="flex items-center gap-5">
                <span className="tnum font-display text-6xl font-medium text-ink">
                  {site.rating}
                </span>
                <div>
                  <span className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-red" />
                    ))}
                  </span>
                  <p className="mt-1.5 text-sm font-medium text-graphite">
                    Media su oltre 500 recensioni
                  </p>
                  <p className="flex items-center gap-1.5 text-[0.8rem] text-stone">
                    <Google className="h-3.5 w-3.5" /> Google · Trustindex · clienti verificati
                  </p>
                </div>
              </div>
              <a
                href={site.googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 inline-flex items-center gap-2 rounded-full bg-red py-2.5 pl-5 pr-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-dark active:scale-[0.98]"
              >
                Vedi tutte su Google
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </a>
            </div>
          </Reveal>
        </div>

        {/* Video recensioni */}
        <Reveal className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <h3 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              Guarda Domus Tua in video
            </h3>
            <a
              href={site.social.youtube.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-red hover:text-red-dark sm:flex"
            >
              Tutte su YouTube <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {videos.map((v) => (
              <a
                key={v.name}
                href={v.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-video overflow-hidden rounded-[1.5rem]"
              >
                <Image
                  src={v.thumb}
                  alt={`Video recensione: ${v.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 380px"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-5 w-5" />
                </span>
                <span className="absolute bottom-4 left-4 right-4 text-sm font-semibold text-white">
                  {v.name}
                </span>
              </a>
            ))}
          </div>
        </Reveal>

        {site.embeds.trustindexSrc ? (
          <Reveal className="mt-12">
            <h3 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              Le recensioni reali dei nostri clienti
            </h3>
            <div className="mt-6 rounded-[1.75rem] border border-line bg-cream p-4 sm:p-6">
              <ScriptWidget src={site.embeds.trustindexSrc} />
            </div>
          </Reveal>
        ) : (
          <>
        {/* Filters */}
        <Reveal className="mt-12">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  filter === f
                    ? "border-red bg-red text-white"
                    : "border-line bg-paper text-graphite hover:border-red/40 hover:text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r, i) => (
            <Reveal key={r.name + i} delay={(i % 3) * 80}>
              <figure className="flex h-full flex-col rounded-[1.75rem] border border-line bg-cream p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-red/30">
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-3.5 w-3.5 text-red" />
                  ))}
                </span>
                <blockquote className="mt-4 flex-1 text-[0.96rem] leading-relaxed text-graphite">
                  “{r.text}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-soft font-display text-base font-semibold text-red">
                    {r.name.charAt(0)}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold text-ink">{r.name}</span>
                    <span className="block text-[0.8rem] text-stone">
                      {r.place} · {r.cat}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
          </>
        )}
      </div>
    </section>
  );
}
