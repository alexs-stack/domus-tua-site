"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { Star, Google, ArrowUpRight, Check } from "./Icons";
import { site } from "../lib/site";
import { ScriptWidget } from "./WidgetEmbeds";
import { reviews, reviewSummary, type ReviewCategory } from "../lib/reviews";

const filters: ("Tutte" | ReviewCategory)[] = [
  "Tutte",
  "Venditori",
  "Acquirenti",
  "Open Domus",
  "Esperienza",
];

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
}

export default function Reviews() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Tutte");
  const shown = filter === "Tutte" ? reviews : reviews.filter((r) => r.category === filter);

  return (
    <section id="recensioni" className="bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
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
                  {reviewSummary.rating}
                </span>
                <div>
                  <span className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-red" />
                    ))}
                  </span>
                  <p className="mt-1.5 text-sm font-medium text-graphite">
                    Media su oltre {reviewSummary.count} recensioni
                  </p>
                  <p className="flex items-center gap-1.5 text-[0.8rem] text-stone">
                    <Google className="h-3.5 w-3.5" /> Google · Trustindex · {reviewSummary.label}
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
            {/* Filtri categoria */}
            <Reveal className="mt-12">
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
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

            {/* Griglia recensioni */}
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((r, i) => (
                <Reveal key={r.id} delay={(i % 3) * 80} className={i === 0 ? "lg:col-span-2" : ""}>
                  <figure
                    className={`flex h-full flex-col rounded-[1.75rem] border border-line p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:border-red/30 hover:shadow-[0_30px_60px_-30px_rgba(26,24,22,0.35)] ${
                      i === 0 ? "bg-cream-deep sm:p-8" : "bg-cream"
                    }`}
                  >
                    {/* header: fonte + rating */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-graphite">
                        <Google className="h-4 w-4" /> {r.source}
                      </span>
                      <span className="flex gap-0.5" aria-label={`${r.rating} su 5`}>
                        {Array.from({ length: r.rating }).map((_, k) => (
                          <Star key={k} className="h-3.5 w-3.5 text-red" />
                        ))}
                      </span>
                    </div>

                    <blockquote
                      className={`mt-4 flex-1 leading-relaxed text-graphite ${
                        i === 0 ? "font-display text-xl sm:text-2xl" : "text-[0.96rem]"
                      }`}
                    >
                      “{r.text}”
                    </blockquote>

                    <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-soft font-display text-base font-semibold text-red-dark">
                        {r.name.charAt(0)}
                      </span>
                      <span className="flex-1 leading-tight">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                          {r.name}
                          {r.verified && (
                            <span
                              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red text-white"
                              title="Recensione verificata"
                            >
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </span>
                        <span className="block text-[0.8rem] text-stone">
                          {r.place} · {formatDate(r.date)}
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
