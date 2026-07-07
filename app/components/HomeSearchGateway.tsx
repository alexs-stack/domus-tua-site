"use client";

// Ricerca "sopra la piega": mini-ricerca funzionale per chi compra + scorciatoia per chi vende.
// Al submit naviga a /case con query params (q, comune, budget, type, rooms) che PropertySearch
// legge e pre-imposta. La ricerca in linguaggio naturale resta un teaser (nessuna finta AI).
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowUpRight, ArrowRight, Search } from "./Icons";
import { useDict, useLocale } from "./i18n/LocaleProvider";

const local = {
  it: {
    zona: "Comune o zona", zonaPh: "Es. Tradate", tipologia: "Tipologia", budget: "Budget max", locali: "Locali",
    anyType: "Tutte", anyBudget: "Nessun limite", anyRooms: "Qualsiasi", search: "Cerca casa",
    types: ["Appartamento", "Attico", "Villa"],
    chipsLabel: "Prova:",
    chips: ["Trilocale con giardino", "Villa a Tradate", "Attico con terrazzo", "Casa sotto 300.000 €"],
  },
  en: {
    zona: "Town or area", zonaPh: "E.g. Tradate", tipologia: "Type", budget: "Max budget", locali: "Rooms",
    anyType: "All", anyBudget: "No limit", anyRooms: "Any", search: "Search homes",
    types: ["Apartment", "Penthouse", "Villa"],
    chipsLabel: "Try:",
    chips: ["Two-bed with garden", "Villa in Tradate", "Penthouse with terrace", "Home under €300,000"],
  },
  fr: {
    zona: "Commune ou secteur", zonaPh: "Ex. Tradate", tipologia: "Type", budget: "Budget max", locali: "Pièces",
    anyType: "Tous", anyBudget: "Sans limite", anyRooms: "Indifférent", search: "Chercher un bien",
    types: ["Appartement", "Attique", "Villa"],
    chipsLabel: "Essayez :",
    chips: ["Trois-pièces avec jardin", "Villa à Tradate", "Attique avec terrasse", "Maison sous 300 000 €"],
  },
  de: {
    zona: "Ort oder Gegend", zonaPh: "Z. B. Tradate", tipologia: "Typ", budget: "Max. Budget", locali: "Zimmer",
    anyType: "Alle", anyBudget: "Kein Limit", anyRooms: "Beliebig", search: "Immobilien suchen",
    types: ["Wohnung", "Penthouse", "Villa"],
    chipsLabel: "Beispiele:",
    chips: ["Dreizimmer mit Garten", "Villa in Tradate", "Penthouse mit Terrasse", "Haus unter 300.000 €"],
  },
  es: {
    zona: "Municipio o zona", zonaPh: "Ej. Tradate", tipologia: "Tipo", budget: "Presupuesto máx.", locali: "Estancias",
    anyType: "Todas", anyBudget: "Sin límite", anyRooms: "Cualquiera", search: "Buscar casa",
    types: ["Piso", "Ático", "Villa"],
    chipsLabel: "Prueba:",
    chips: ["Piso de 3 ambientes con jardín", "Villa en Tradate", "Ático con terraza", "Casa por menos de 300.000 €"],
  },
};

// I valori inviati come query param restano canonici (italiano = valori dati), le etichette sono tradotte.
const typeValues = ["Appartamento", "Attico", "Villa"];
const budgetValues = [
  { v: 0 }, { v: 250000 }, { v: 350000 }, { v: 500000 }, { v: 750000 },
];
const roomValues = [0, 2, 3, 4];

export default function HomeSearchGateway() {
  const d = useDict();
  const { locale } = useLocale();
  const c = local[locale];
  const router = useRouter();

  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [comune, setComune] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("0");
  const [rooms, setRooms] = useState("0");

  function submit(e?: React.FormEvent, presetType?: string) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (comune.trim()) params.set("comune", comune.trim());
    const t = presetType ?? type;
    if (t) params.set("type", t);
    if (budget && budget !== "0") params.set("budget", budget);
    if (rooms && rooms !== "0") params.set("rooms", rooms);
    const qs = params.toString();
    router.push(qs ? `/case?${qs}` : "/case");
  }

  const fieldCls =
    "rounded-xl border border-line bg-cream px-3.5 py-3 text-sm text-ink transition-colors focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";

  return (
    <section id="cerca" className="bg-cream-deep">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          {/* Buyer search */}
          <Reveal>
            <form
              onSubmit={submit}
              className="flex h-full flex-col rounded-[2rem] border border-line bg-paper p-6 shadow-[0_40px_90px_-60px_rgba(26,24,22,0.5)] sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                  {d.search.title}
                </h2>
                <span className="shrink-0 rounded-full bg-red-soft px-3.5 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-red-dark">
                  {d.search.nlTeaser}
                </span>
              </div>

              {/* input linguaggio naturale (teaser: alimenta q) */}
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-line bg-cream p-3">
                <Search className="ml-1 h-5 w-5 shrink-0 text-stone" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={d.search.nlPlaceholder}
                  aria-label={d.search.title}
                  className="w-full flex-1 rounded-lg bg-transparent px-1 text-[0.98rem] text-ink placeholder:text-stone/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                />
              </div>
              <p className="mt-2 pl-1 text-[0.8rem] text-stone">{d.search.nlHint}</p>

              {/* Chip di esempio: cliccando si compila l'input in linguaggio naturale (nessun
                  auto-invio: l'utente può ritoccare la frase prima di cercare). */}
              <div className="mt-3 flex flex-wrap items-center gap-2 pl-1">
                <span className="text-[0.72rem] font-medium text-stone">{c.chipsLabel}</span>
                {c.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setQ(chip);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex min-h-[40px] items-center rounded-full border border-line bg-cream px-3.5 py-2 text-[0.8rem] text-graphite transition-colors duration-300 hover:border-red/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* filtri classici */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1.5">
                  <span className="pl-1 text-[0.72rem] font-semibold uppercase tracking-wide text-stone">{c.zona}</span>
                  <input value={comune} onChange={(e) => setComune(e.target.value)} placeholder={c.zonaPh} className={fieldCls} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="pl-1 text-[0.72rem] font-semibold uppercase tracking-wide text-stone">{c.tipologia}</span>
                  <select value={type} onChange={(e) => setType(e.target.value)} className={fieldCls}>
                    <option value="">{c.anyType}</option>
                    {typeValues.map((v, i) => (
                      <option key={v} value={v}>{c.types[i]}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="pl-1 text-[0.72rem] font-semibold uppercase tracking-wide text-stone">{c.budget}</span>
                  <select value={budget} onChange={(e) => setBudget(e.target.value)} className={fieldCls}>
                    {budgetValues.map((b) => (
                      <option key={b.v} value={b.v}>{b.v === 0 ? c.anyBudget : `${(b.v / 1000).toLocaleString()}k €`}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="pl-1 text-[0.72rem] font-semibold uppercase tracking-wide text-stone">{c.locali}</span>
                  <select value={rooms} onChange={(e) => setRooms(e.target.value)} className={fieldCls}>
                    {roomValues.map((r) => (
                      <option key={r} value={r}>{r === 0 ? c.anyRooms : `${r}+`}</option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="group mt-6 inline-flex items-center justify-center gap-2 self-start rounded-full bg-red py-3.5 pl-6 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                {c.search}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </button>
            </form>
          </Reveal>

          {/* Seller shortcut */}
          <Reveal delay={100}>
            <div className="flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border border-red bg-red p-6 text-white sm:p-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">
                  {d.nav.vendi}
                </span>
                <h3 className="mt-5 font-display text-2xl font-medium leading-tight tracking-tight sm:text-[1.8rem]">
                  {d.search.sellerTitle}
                </h3>
              </div>
              <Link
                href="/#contatti"
                className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white py-3.5 pl-6 pr-3 text-sm font-semibold text-red transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-cream active:scale-[0.98]"
              >
                {d.search.sellerCta}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red/10 transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
