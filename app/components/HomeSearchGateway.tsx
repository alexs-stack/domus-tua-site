"use client";

// Dock di ricerca compatto a DUE modalità (Prompt 10): "Cerco casa" e "Voglio vendere".
// Non interrompe l'apertura emotiva: input essenziale in vista, filtri a scomparsa.
//  • Cerco casa: input in linguaggio naturale (nessuna finta AI: parser locale deterministico
//    lato /case) + tasto Cerca; "Filtri" espande comune/tipologia/budget/locali; chip di esempio
//    più quiete. Al submit naviga a /case con query param (q, comune, type, budget, rooms).
//  • Voglio vendere: promessa breve + comune + "Richiedi una valutazione" (→ contatti, nessuna
//    finta valutazione istantanea).
// Tracciamento (mode, submit, valutazione) consent-aware: vedi app/lib/analytics.ts.
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowUpRight, ArrowRight, Search } from "./Icons";
import { track } from "../lib/analytics";
import { useDict, useLocale } from "./i18n/LocaleProvider";

const local = {
  it: {
    modeBuy: "Cerco casa", modeSell: "Voglio vendere",
    zona: "Comune o zona", zonaPh: "Es. Tradate", tipologia: "Tipologia", budget: "Budget max", locali: "Locali",
    anyType: "Tutte", anyBudget: "Nessun limite", anyRooms: "Qualsiasi", search: "Cerca casa",
    types: ["Appartamento", "Attico", "Villa"],
    filters: "Filtri", filtersHide: "Nascondi filtri",
    chipsLabel: "Prova:",
    chips: ["Trilocale con giardino", "Villa a Tradate", "Attico con terrazzo", "Casa sotto 300.000 €"],
    sellComune: "Comune della tua casa", sellComunePh: "Es. Tradate",
    sellPromise: "Scopri quanto può valere, con una valutazione seria e senza impegno.",
  },
  en: {
    modeBuy: "I'm buying", modeSell: "I'm selling",
    zona: "Town or area", zonaPh: "E.g. Tradate", tipologia: "Type", budget: "Max budget", locali: "Rooms",
    anyType: "All", anyBudget: "No limit", anyRooms: "Any", search: "Search homes",
    types: ["Apartment", "Penthouse", "Villa"],
    filters: "Filters", filtersHide: "Hide filters",
    chipsLabel: "Try:",
    chips: ["Two-bed with garden", "Villa in Tradate", "Penthouse with terrace", "Home under €300,000"],
    sellComune: "Where your home is", sellComunePh: "E.g. Tradate",
    sellPromise: "Find out what it could be worth, with a serious, no-obligation valuation.",
  },
  fr: {
    modeBuy: "Je cherche", modeSell: "Je vends",
    zona: "Commune ou secteur", zonaPh: "Ex. Tradate", tipologia: "Type", budget: "Budget max", locali: "Pièces",
    anyType: "Tous", anyBudget: "Sans limite", anyRooms: "Indifférent", search: "Chercher un bien",
    types: ["Appartement", "Attique", "Villa"],
    filters: "Filtres", filtersHide: "Masquer les filtres",
    chipsLabel: "Essayez :",
    chips: ["Trois-pièces avec jardin", "Villa à Tradate", "Attique avec terrasse", "Maison sous 300 000 €"],
    sellComune: "Commune de votre bien", sellComunePh: "Ex. Tradate",
    sellPromise: "Découvrez sa valeur possible, avec une estimation sérieuse et sans engagement.",
  },
  de: {
    modeBuy: "Ich kaufe", modeSell: "Ich verkaufe",
    zona: "Ort oder Gegend", zonaPh: "Z. B. Tradate", tipologia: "Typ", budget: "Max. Budget", locali: "Zimmer",
    anyType: "Alle", anyBudget: "Kein Limit", anyRooms: "Beliebig", search: "Immobilien suchen",
    types: ["Wohnung", "Penthouse", "Villa"],
    filters: "Filter", filtersHide: "Filter ausblenden",
    chipsLabel: "Beispiele:",
    chips: ["Dreizimmer mit Garten", "Villa in Tradate", "Penthouse mit Terrasse", "Haus unter 300.000 €"],
    sellComune: "Ort Ihrer Immobilie", sellComunePh: "Z. B. Tradate",
    sellPromise: "Erfahren Sie den möglichen Wert – mit einer fundierten, unverbindlichen Bewertung.",
  },
  es: {
    modeBuy: "Busco casa", modeSell: "Quiero vender",
    zona: "Municipio o zona", zonaPh: "Ej. Tradate", tipologia: "Tipo", budget: "Presupuesto máx.", locali: "Estancias",
    anyType: "Todas", anyBudget: "Sin límite", anyRooms: "Cualquiera", search: "Buscar casa",
    types: ["Piso", "Ático", "Villa"],
    filters: "Filtros", filtersHide: "Ocultar filtros",
    chipsLabel: "Prueba:",
    chips: ["Piso de 3 ambientes con jardín", "Villa en Tradate", "Ático con terraza", "Casa por menos de 300.000 €"],
    sellComune: "Municipio de tu casa", sellComunePh: "Ej. Tradate",
    sellPromise: "Descubre cuánto puede valer, con una tasación seria y sin compromiso.",
  },
};

// I valori inviati come query param restano canonici (italiano = valori dati), le etichette sono tradotte.
const typeValues = ["Appartamento", "Attico", "Villa"];
const budgetValues = [0, 250000, 350000, 500000, 750000];
const roomValues = [0, 2, 3, 4];

export default function HomeSearchGateway() {
  const d = useDict();
  const { locale } = useLocale();
  const c = local[locale];
  const router = useRouter();

  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [comune, setComune] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("0");
  const [rooms, setRooms] = useState("0");
  const filtersId = useId();

  function chooseMode(m: "buy" | "sell") {
    setMode(m);
    track("search_mode", { mode: m });
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (comune.trim()) params.set("comune", comune.trim());
    if (type) params.set("type", type);
    if (budget && budget !== "0") params.set("budget", budget);
    if (rooms && rooms !== "0") params.set("rooms", rooms);
    const qs = params.toString();
    track("search_submit", { mode: "buy", q: q.trim(), comune: comune.trim(), type, budget, rooms });
    router.push(qs ? `/case?${qs}` : "/case");
  }

  const fieldCls =
    "min-h-[44px] rounded-xl border border-line bg-cream px-3.5 py-3 text-sm text-ink transition-colors focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";

  const tabCls = (active: boolean) =>
    `flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
      active ? "bg-red text-white shadow-[0_10px_24px_-14px_rgba(150,30,26,0.6)]" : "bg-cream text-graphite hover:text-ink"
    }`;

  return (
    <section id="cerca" className="bg-cream-deep segno-ambient">
      <div className="mx-auto max-w-[840px] px-5 py-14 sm:px-8 sm:py-16">
        <Reveal>
          <div className="rounded-[2rem] border border-line bg-paper p-4 shadow-[0_40px_90px_-60px_rgba(26,24,22,0.5)] sm:p-6">
            {/* Selettore modalità — due tasti ampi (min 48px), niente tab strette su mobile */}
            <div role="group" aria-label={d.search.title} className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-cream p-1.5">
              <button aria-pressed={mode === "buy"} type="button" onClick={() => chooseMode("buy")} className={tabCls(mode === "buy")}>
                <Search className="h-4 w-4" /> {c.modeBuy}
              </button>
              <button aria-pressed={mode === "sell"} type="button" onClick={() => chooseMode("sell")} className={tabCls(mode === "sell")}>
                {c.modeSell}
              </button>
            </div>

            {mode === "buy" ? (
              <form onSubmit={submit} className="mt-4">
                {/* Riga essenziale: input in linguaggio naturale + Cerca */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-cream px-3">
                    <Search className="h-5 w-5 shrink-0 text-stone" />
                    <input
                      ref={inputRef}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={d.search.nlPlaceholder}
                      aria-label={d.search.title}
                      className="min-h-[48px] w-full flex-1 bg-transparent text-[0.98rem] text-ink placeholder:text-stone/60 focus-visible:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red px-6 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
                  >
                    {c.search}
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>
                {/* Nota onestà su AI vs parser locale (nessuna finta AI) */}
                <p className="mt-2 pl-1 text-[0.8rem] text-stone">{d.search.nlHint}</p>

                {/* Chip di esempio, più quiete */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-1">
                  <span className="text-[0.72rem] font-medium text-stone">{c.chipsLabel}</span>
                  {c.chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setQ(chip);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex min-h-[36px] items-center rounded-full border border-line px-3 py-1.5 text-[0.78rem] text-stone transition-colors duration-300 hover:border-red/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Filtri a scomparsa: nessun campo extra prima che l'utente lo voglia */}
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  aria-expanded={showFilters}
                  aria-controls={filtersId}
                  className="mt-4 inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-red transition-colors hover:text-red-dark"
                >
                  {showFilters ? c.filtersHide : c.filters}
                  <ArrowRight className={`h-3.5 w-3.5 transition-transform duration-300 ${showFilters ? "rotate-90" : ""}`} />
                </button>

                {showFilters && (
                  <div id={filtersId} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                        {budgetValues.map((v) => (
                          <option key={v} value={v}>{v === 0 ? c.anyBudget : `${(v / 1000).toLocaleString()}k €`}</option>
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
                )}
              </form>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <h2 className="font-display text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[1.7rem]">
                    {d.search.sellerTitle}
                  </h2>
                  <p className="mt-2 max-w-lg text-[0.95rem] leading-relaxed text-stone">{c.sellPromise}</p>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="pl-1 text-[0.72rem] font-semibold uppercase tracking-wide text-stone">{c.sellComune}</span>
                  <input
                    value={comune}
                    onChange={(e) => setComune(e.target.value)}
                    placeholder={c.sellComunePh}
                    className={`${fieldCls} max-w-sm`}
                  />
                </label>
                <Link
                  href={comune.trim() ? `/#contatti?intent=seller&comune=${encodeURIComponent(comune.trim())}` : "/#contatti?intent=seller"}
                  onClick={() => track("valuation_cta", { comune: comune.trim() })}
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 self-start rounded-full bg-red px-6 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
                >
                  {d.search.sellerCta}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
