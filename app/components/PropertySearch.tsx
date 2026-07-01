"use client";

import { useMemo, useState } from "react";
import Reveal from "./Reveal";
import PropertyCard from "./PropertyCard";
import { ArrowRight } from "./Icons";
import type { Property } from "../lib/properties";

// Filtri MVP client-side. Pronto per collegarsi ai dati live RealSmart:
// vedi app/lib/realsmart/ e docs/realsmart-integration-notes.md.
export type PropertyFilters = {
  contract: "Tutte" | "Vendita" | "Affitto";
  type: "Tutte" | Property["type"];
  comune: string;
  maxBudget: number; // 0 = nessun limite
  minRooms: number; // 0 = qualsiasi
  features: string[];
};

const featureOptions = [
  { label: "Giardino", match: ["giardino"] },
  { label: "Box / posto auto", match: ["box", "posto auto"] },
  { label: "Terrazzo", match: ["terrazz"] },
  { label: "Doppi servizi", match: ["2 bagni", "doppi servizi"] },
];

const budgetOptions = [
  { label: "Nessun limite", value: 0 },
  { label: "Fino a 250.000 €", value: 250000 },
  { label: "Fino a 350.000 €", value: 350000 },
  { label: "Fino a 500.000 €", value: 500000 },
  { label: "Fino a 750.000 €", value: 750000 },
];

const roomOptions = [
  { label: "Qualsiasi", value: 0 },
  { label: "1+", value: 1 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
];

const types: PropertyFilters["type"][] = ["Tutte", "Appartamento", "Attico", "Villa"];

function roomsNum(p: Property) {
  return parseInt(p.rooms, 10) || 0;
}
function haystack(p: Property) {
  return `${p.features.join(" ")} ${p.excerpt} ${p.badges.join(" ")}`.toLowerCase();
}

export default function PropertySearch({ properties }: { properties: Property[] }) {
  const [nl, setNl] = useState("");
  const [f, setF] = useState<PropertyFilters>({
    contract: "Tutte",
    type: "Tutte",
    comune: "Tutti",
    maxBudget: 0,
    minRooms: 0,
    features: [],
  });

  const comuni = useMemo(
    () => ["Tutti", ...Array.from(new Set(properties.map((p) => p.zone.split(",")[0].trim())))],
    [properties]
  );

  const shown = useMemo(() => {
    return properties.filter((p) => {
      if (f.contract !== "Tutte" && p.status !== f.contract) return false;
      if (f.type !== "Tutte" && p.type !== f.type) return false;
      if (f.comune !== "Tutti" && p.zone.split(",")[0].trim() !== f.comune) return false;
      if (f.maxBudget && p.priceValue > f.maxBudget) return false;
      if (f.minRooms && roomsNum(p) < f.minRooms) return false;
      if (f.features.length) {
        const hay = haystack(p);
        const ok = f.features.every((label) => {
          const opt = featureOptions.find((o) => o.label === label);
          return opt ? opt.match.some((m) => hay.includes(m)) : true;
        });
        if (!ok) return false;
      }
      return true;
    });
  }, [f, properties]);

  const toggleFeature = (label: string) =>
    setF((s) => ({
      ...s,
      features: s.features.includes(label)
        ? s.features.filter((x) => x !== label)
        : [...s.features, label],
    }));

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
      active
        ? "border-red bg-red text-white"
        : "border-line bg-paper text-graphite hover:border-red/40 hover:text-ink"
    }`;

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        {/* Ricerca in linguaggio naturale (teaser AI) */}
        <Reveal>
          <div className="rounded-[2rem] border border-line bg-paper p-2 shadow-[0_40px_90px_-60px_rgba(26,24,22,0.5)]">
            <div className="flex flex-col gap-3 rounded-[calc(2rem-0.5rem)] bg-cream p-5 sm:flex-row sm:items-center sm:p-6">
              <input
                value={nl}
                onChange={(e) => setNl(e.target.value)}
                placeholder="Es. trilocale con giardino a Tradate sotto 300.000 €"
                className="w-full flex-1 rounded-lg bg-transparent text-base text-ink placeholder:text-stone/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red"
                aria-label="Descrivi la casa che cerchi"
              />
              <span className="flex shrink-0 items-center gap-2 self-start rounded-full bg-red-soft px-3.5 py-2 text-[0.72rem] font-semibold uppercase tracking-wide text-red-dark sm:self-auto">
                Ricerca intelligente in arrivo
              </span>
            </div>
          </div>
          <p className="mt-3 pl-2 text-[0.82rem] text-stone">
            Presto potrai cercare casa scrivendo come parleresti a noi. Intanto usa i filtri qui
            sotto.
          </p>
        </Reveal>

        {/* Filtri */}
        <Reveal delay={80} className="mt-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.78rem] font-semibold uppercase tracking-wide text-stone">
              Contratto
            </span>
            {(["Tutte", "Vendita", "Affitto"] as const).map((c) => (
              <button key={c} onClick={() => setF((s) => ({ ...s, contract: c }))} className={pill(f.contract === c)}>
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.78rem] font-semibold uppercase tracking-wide text-stone">
              Tipologia
            </span>
            {types.map((t) => (
              <button key={t} onClick={() => setF((s) => ({ ...s, type: t }))} className={pill(f.type === t)}>
                {t}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-stone">Zona</span>
              <select
                value={f.comune}
                onChange={(e) => setF((s) => ({ ...s, comune: e.target.value }))}
                className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink transition-colors focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                {comuni.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-stone">Budget</span>
              <select
                value={f.maxBudget}
                onChange={(e) => setF((s) => ({ ...s, maxBudget: Number(e.target.value) }))}
                className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink transition-colors focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                {budgetOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-stone">Locali</span>
              <select
                value={f.minRooms}
                onChange={(e) => setF((s) => ({ ...s, minRooms: Number(e.target.value) }))}
                className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink transition-colors focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                {roomOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.78rem] font-semibold uppercase tracking-wide text-stone">
              Caratteristiche
            </span>
            {featureOptions.map((o) => (
              <button key={o.label} onClick={() => toggleFeature(o.label)} className={pill(f.features.includes(o.label))}>
                {o.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Risultati */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="text-sm text-stone">
            <span className="font-semibold text-ink">{shown.length}</span>{" "}
            {shown.length === 1 ? "immobile trovato" : "immobili trovati"}
          </p>
          <a
            href="#contatti"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-red hover:text-red-dark"
          >
            Non trovi la casa giusta? Dillo a noi
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        {shown.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 90}>
                <PropertyCard p={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.75rem] border border-line bg-paper p-10 text-center">
            <p className="font-display text-2xl font-medium text-ink">Nessun immobile con questi filtri.</p>
            <p className="mt-2 text-stone">
              Raccontaci cosa cerchi: molte case non sono ancora online, le troviamo noi per te.
            </p>
            <a
              href="#contatti"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-dark"
            >
              Cerco casa con Domus Tua
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
