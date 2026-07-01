"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import PropertyCard from "./PropertyCard";
import { properties } from "../lib/properties";

const filters = ["Tutte", "Appartamento", "Attico", "Villa"] as const;

export default function CaseExplorer() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Tutte");
  const shown = filter === "Tutte" ? properties : properties.filter((p) => p.type === filter);

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Reveal>
            <p className="text-sm text-stone">
              <span className="font-semibold text-ink">{shown.length}</span> immobili disponibili
            </p>
          </Reveal>
          <Reveal delay={80}>
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
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 90}>
              <PropertyCard p={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
