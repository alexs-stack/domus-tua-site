"use client";

import { useEffect, useMemo, useState } from "react";
import Reveal from "./Reveal";
import PropertyCard from "./PropertyCard";
import { ArrowRight } from "./Icons";
import { SegnoDomusBadge } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import type { Property } from "../lib/properties";

// Dizionario UI inline. Le VALUE dei filtri (contract/type/feature) restano in italiano
// perché confrontate con i dati (p.status, p.type, featureOptions.match); qui traduciamo
// solo le LABEL che l'utente vede.
const copy = {
  it: {
    nlPlaceholder: "Es. trilocale con giardino a Tradate sotto 300.000 €",
    nlAria: "Descrivi la casa che cerchi",
    smartBadge: "Ricerca intelligente in arrivo",
    teaser: "Presto potrai cercare casa scrivendo come parleresti a noi. Intanto usa i filtri qui sotto.",
    contract: "Contratto",
    type: "Tipologia",
    zone: "Zona",
    budget: "Budget",
    rooms: "Locali",
    features: "Caratteristiche",
    contractLabels: { Tutte: "Tutte", Vendita: "Vendita", Affitto: "Affitto" },
    typeLabels: { Tutte: "Tutte", Appartamento: "Appartamento", Attico: "Attico", Villa: "Villa" },
    zoneAll: "Tutti",
    featureLabels: {
      Giardino: "Giardino",
      "Box / posto auto": "Box / posto auto",
      Terrazzo: "Terrazzo",
      "Doppi servizi": "Doppi servizi",
    } as Record<string, string>,
    budgetLabels: {
      "Nessun limite": "Nessun limite",
      "Fino a 250.000 €": "Fino a 250.000 €",
      "Fino a 350.000 €": "Fino a 350.000 €",
      "Fino a 500.000 €": "Fino a 500.000 €",
      "Fino a 750.000 €": "Fino a 750.000 €",
    } as Record<string, string>,
    roomsAny: "Qualsiasi",
    resultsOne: "immobile trovato",
    resultsMany: "immobili trovati",
    notFound: "Non trovi la casa giusta? Dillo a noi",
    emptyTitle: "Nessun immobile con questi filtri.",
    emptyBody: "Raccontaci cosa cerchi: molte case non sono ancora online, le troviamo noi per te.",
    emptyCta: "Cerco casa con Domus Tua",
  },
  en: {
    nlPlaceholder: "E.g. two-bed with garden in Tradate under €300,000",
    nlAria: "Describe the home you’re looking for",
    smartBadge: "Smart search coming soon",
    teaser: "Soon you’ll be able to search for a home just as you’d describe it to us. For now, use the filters below.",
    contract: "Contract",
    type: "Type",
    zone: "Area",
    budget: "Budget",
    rooms: "Rooms",
    features: "Features",
    contractLabels: { Tutte: "All", Vendita: "For sale", Affitto: "To rent" },
    typeLabels: { Tutte: "All", Appartamento: "Apartment", Attico: "Penthouse", Villa: "Villa" },
    zoneAll: "All",
    featureLabels: {
      Giardino: "Garden",
      "Box / posto auto": "Garage / parking",
      Terrazzo: "Terrace",
      "Doppi servizi": "Two bathrooms",
    } as Record<string, string>,
    budgetLabels: {
      "Nessun limite": "No limit",
      "Fino a 250.000 €": "Up to €250,000",
      "Fino a 350.000 €": "Up to €350,000",
      "Fino a 500.000 €": "Up to €500,000",
      "Fino a 750.000 €": "Up to €750,000",
    } as Record<string, string>,
    roomsAny: "Any",
    resultsOne: "home found",
    resultsMany: "homes found",
    notFound: "Can’t find the right home? Tell us",
    emptyTitle: "No homes match these filters.",
    emptyBody: "Tell us what you’re looking for: many homes aren’t online yet, and we’ll find them for you.",
    emptyCta: "Find my home with Domus Tua",
  },
  fr: {
    nlPlaceholder: "Ex. trois-pièces avec jardin à Tradate sous 300 000 €",
    nlAria: "Décrivez la maison que vous cherchez",
    smartBadge: "Recherche intelligente à venir",
    teaser: "Bientôt, vous pourrez chercher un bien en l’écrivant comme vous nous le diriez. En attendant, utilisez les filtres ci-dessous.",
    contract: "Contrat",
    type: "Type",
    zone: "Secteur",
    budget: "Budget",
    rooms: "Pièces",
    features: "Caractéristiques",
    contractLabels: { Tutte: "Tous", Vendita: "À vendre", Affitto: "À louer" },
    typeLabels: { Tutte: "Tous", Appartamento: "Appartement", Attico: "Attique", Villa: "Villa" },
    zoneAll: "Tous",
    featureLabels: {
      Giardino: "Jardin",
      "Box / posto auto": "Garage / stationnement",
      Terrazzo: "Terrasse",
      "Doppi servizi": "Deux salles de bain",
    } as Record<string, string>,
    budgetLabels: {
      "Nessun limite": "Sans limite",
      "Fino a 250.000 €": "Jusqu’à 250 000 €",
      "Fino a 350.000 €": "Jusqu’à 350 000 €",
      "Fino a 500.000 €": "Jusqu’à 500 000 €",
      "Fino a 750.000 €": "Jusqu’à 750 000 €",
    } as Record<string, string>,
    roomsAny: "Indifférent",
    resultsOne: "bien trouvé",
    resultsMany: "biens trouvés",
    notFound: "Vous ne trouvez pas le bon bien ? Dites-le-nous",
    emptyTitle: "Aucun bien ne correspond à ces filtres.",
    emptyBody: "Dites-nous ce que vous cherchez : beaucoup de biens ne sont pas encore en ligne, nous les trouvons pour vous.",
    emptyCta: "Je cherche avec Domus Tua",
  },
  de: {
    nlPlaceholder: "Z. B. Dreizimmerwohnung mit Garten in Tradate unter 300.000 €",
    nlAria: "Beschreiben Sie das Zuhause, das Sie suchen",
    smartBadge: "Intelligente Suche kommt bald",
    teaser: "Bald können Sie ein Zuhause suchen, indem Sie es einfach so beschreiben, wie Sie es uns sagen würden. Nutzen Sie bis dahin die Filter unten.",
    contract: "Vertrag",
    type: "Objektart",
    zone: "Gebiet",
    budget: "Budget",
    rooms: "Zimmer",
    features: "Ausstattung",
    contractLabels: { Tutte: "Alle", Vendita: "Zum Kauf", Affitto: "Zur Miete" },
    typeLabels: { Tutte: "Alle", Appartamento: "Wohnung", Attico: "Penthouse", Villa: "Villa" },
    zoneAll: "Alle",
    featureLabels: {
      Giardino: "Garten",
      "Box / posto auto": "Garage / Stellplatz",
      Terrazzo: "Terrasse",
      "Doppi servizi": "Zwei Bäder",
    } as Record<string, string>,
    budgetLabels: {
      "Nessun limite": "Ohne Limit",
      "Fino a 250.000 €": "Bis 250.000 €",
      "Fino a 350.000 €": "Bis 350.000 €",
      "Fino a 500.000 €": "Bis 500.000 €",
      "Fino a 750.000 €": "Bis 750.000 €",
    } as Record<string, string>,
    roomsAny: "Beliebig",
    resultsOne: "Objekt gefunden",
    resultsMany: "Objekte gefunden",
    notFound: "Nicht das richtige Zuhause dabei? Sagen Sie es uns",
    emptyTitle: "Kein Objekt passt zu diesen Filtern.",
    emptyBody: "Sagen Sie uns, was Sie suchen: Viele Objekte sind noch nicht online – wir finden sie für Sie.",
    emptyCta: "Zuhause finden mit Domus Tua",
  },
  es: {
    nlPlaceholder: "P. ej. piso de tres ambientes con jardín en Tradate por menos de 300.000 €",
    nlAria: "Describe la casa que buscas",
    smartBadge: "Búsqueda inteligente en camino",
    teaser: "Pronto podrás buscar casa escribiéndolo como nos lo contarías. Mientras tanto, usa los filtros de abajo.",
    contract: "Contrato",
    type: "Tipología",
    zone: "Zona",
    budget: "Presupuesto",
    rooms: "Habitaciones",
    features: "Características",
    contractLabels: { Tutte: "Todos", Vendita: "En venta", Affitto: "En alquiler" },
    typeLabels: { Tutte: "Todos", Appartamento: "Piso", Attico: "Ático", Villa: "Villa" },
    zoneAll: "Todas",
    featureLabels: {
      Giardino: "Jardín",
      "Box / posto auto": "Garaje / aparcamiento",
      Terrazzo: "Terraza",
      "Doppi servizi": "Dos baños",
    } as Record<string, string>,
    budgetLabels: {
      "Nessun limite": "Sin límite",
      "Fino a 250.000 €": "Hasta 250.000 €",
      "Fino a 350.000 €": "Hasta 350.000 €",
      "Fino a 500.000 €": "Hasta 500.000 €",
      "Fino a 750.000 €": "Hasta 750.000 €",
    } as Record<string, string>,
    roomsAny: "Cualquiera",
    resultsOne: "inmueble encontrado",
    resultsMany: "inmuebles encontrados",
    notFound: "¿No encuentras la casa adecuada? Cuéntanoslo",
    emptyTitle: "Ningún inmueble con estos filtros.",
    emptyBody: "Cuéntanos qué buscas: muchas casas aún no están online, las encontramos nosotros por ti.",
    emptyCta: "Busco casa con Domus Tua",
  },
} as const;

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

const types: PropertyFilters["type"][] = ["Tutte", "Appartamento", "Attico", "Villa", "Commerciale", "Terreno"];

function roomsNum(p: Property) {
  return parseInt(p.rooms, 10) || 0;
}
function haystack(p: Property) {
  return `${p.features.join(" ")} ${p.excerpt} ${p.badges.join(" ")}`.toLowerCase();
}

export default function PropertySearch({ properties }: { properties: Property[] }) {
  const { locale } = useLocale();
  const c = copy[locale];
  const [nl, setNl] = useState("");
  const [f, setF] = useState<PropertyFilters>({
    contract: "Tutte",
    type: "Tutte",
    comune: "Tutti",
    maxBudget: 0,
    minRooms: 0,
    features: [],
  });

  // Pre-imposta i filtri dai query param passati da HomeSearchGateway (/case?q=&comune=&type=&budget=&rooms=).
  // setState post-mount è voluto: i query param vanno letti solo lato client (evita mismatch di hydration).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q");
    const type = sp.get("type");
    const budget = sp.get("budget");
    const rooms = sp.get("rooms");
    const comune = sp.get("comune");
    /* eslint-disable react-hooks/set-state-in-effect */
    if (q) setNl(q);
    setF((s) => ({
      ...s,
      type: type && (types as string[]).includes(type) ? (type as PropertyFilters["type"]) : s.type,
      maxBudget: budget ? Number(budget) || 0 : s.maxBudget,
      minRooms: rooms ? Number(rooms) || 0 : s.minRooms,
      comune: comune || s.comune,
    }));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const comuni = useMemo(() => {
    const base = ["Tutti", ...Array.from(new Set(properties.map((p) => p.zone.split(",")[0].trim())))];
    // Include il comune cercato anche se nessun immobile combacia (mostra il blocco "nessun risultato").
    return base.includes(f.comune) ? base : [...base, f.comune];
  }, [properties, f.comune]);

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
    `rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
      active
        ? "border-red bg-red text-white hover:bg-red-dark"
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
                placeholder={c.nlPlaceholder}
                className="w-full flex-1 rounded-lg bg-transparent text-base text-ink placeholder:text-stone/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red"
                aria-label={c.nlAria}
              />
              <SegnoDomusBadge className="shrink-0 self-start border-red/25 bg-red-soft text-red-dark sm:self-auto">
                {c.smartBadge}
              </SegnoDomusBadge>
            </div>
          </div>
          <p className="mt-3 pl-2 text-[0.82rem] text-stone">{c.teaser}</p>
        </Reveal>

        {/* Filtri */}
        <Reveal delay={80} className="mt-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.78rem] font-semibold uppercase tracking-wide text-stone">
              {c.contract}
            </span>
            {(["Tutte", "Vendita", "Affitto"] as const).map((v) => (
              <button key={v} onClick={() => setF((s) => ({ ...s, contract: v }))} className={pill(f.contract === v)}>
                {c.contractLabels[v]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.78rem] font-semibold uppercase tracking-wide text-stone">
              {c.type}
            </span>
            {types.map((t) => (
              <button key={t} onClick={() => setF((s) => ({ ...s, type: t }))} className={pill(f.type === t)}>
                {(c.typeLabels as Record<string, string>)[t] ?? t}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-stone">{c.zone}</span>
              <select
                value={f.comune}
                onChange={(e) => setF((s) => ({ ...s, comune: e.target.value }))}
                className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink transition-colors duration-300 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                {comuni.map((z) => (
                  <option key={z} value={z}>
                    {z === "Tutti" ? c.zoneAll : z}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-stone">{c.budget}</span>
              <select
                value={f.maxBudget}
                onChange={(e) => setF((s) => ({ ...s, maxBudget: Number(e.target.value) }))}
                className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink transition-colors duration-300 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                {budgetOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {c.budgetLabels[b.label] ?? b.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-stone">{c.rooms}</span>
              <select
                value={f.minRooms}
                onChange={(e) => setF((s) => ({ ...s, minRooms: Number(e.target.value) }))}
                className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink transition-colors duration-300 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                {roomOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.value === 0 ? c.roomsAny : r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.78rem] font-semibold uppercase tracking-wide text-stone">
              {c.features}
            </span>
            {featureOptions.map((o) => (
              <button key={o.label} onClick={() => toggleFeature(o.label)} className={pill(f.features.includes(o.label))}>
                {c.featureLabels[o.label] ?? o.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Risultati */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="text-sm text-stone">
            <span className="font-semibold text-ink">{shown.length}</span>{" "}
            {shown.length === 1 ? c.resultsOne : c.resultsMany}
          </p>
          <a
            href="#contatti"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-red hover:text-red-dark"
          >
            {c.notFound}
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
            <p className="font-display text-2xl font-medium text-ink">{c.emptyTitle}</p>
            <p className="mt-2 text-stone">{c.emptyBody}</p>
            <a
              href="#contatti"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-red px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-red-dark"
            >
              {c.emptyCta}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
