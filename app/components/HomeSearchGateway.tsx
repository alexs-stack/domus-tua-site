"use client";

// Ricerca a filo (rivista bianca, 2026-09-10): titolo grande, campi con il solo
// bordo inferiore, bottone rosso pieno, la scorciatoia "vendi" come riga di testo.
// Niente card. Al submit naviga a /acquista con query params (q, comune, budget,
// type, rooms) che PropertySearch legge e pre-imposta. La ricerca in linguaggio
// naturale resta un teaser (nessuna finta AI).
import { useState, useRef } from "react";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import { Cta, CtaButton } from "./primitives/Cta";
import { useDict, useLocale } from "./i18n/LocaleProvider";
import { transitionTo } from "./motion/PageTransition";

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

// Etichetta 16 px maiuscola e campo con il solo bordo inferiore (canone del riferimento).
// `border-ink!`: il `* { border-color: line }` di globals.css è unlayered e batte le utility.
const labelCls = "block text-ui font-semibold uppercase tracking-[0.08em] text-stone";
const fieldCls =
  "block w-full border-0 border-b border-ink! bg-transparent py-3 text-body text-ink placeholder:text-stone focus:border-red! focus:outline-none";

// La freccia della tendina: `appearance-none` toglie quella del browser.
function Caret() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
    >
      <path d="M3 6l5 5 5-5" />
    </svg>
  );
}

export default function HomeSearchGateway() {
  const d = useDict();
  const { locale } = useLocale();
  const c = local[locale];

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
    // Micro-transizione coreografata verso i risultati (fallback: push pulito
    // con reduced-motion, gestito dentro PageTransition).
    transitionTo(qs ? `/acquista?${qs}` : "/acquista");
  }

  return (
    <section id="cerca" className="dt-chapter bg-cream">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{d.search.nlTeaser}</span>
        </Reveal>
        <TextLines as="h2" className="mt-6 max-w-[18ch] font-display text-d2">
          {d.search.title}
        </TextLines>

        <Reveal delay={120}>
          <form onSubmit={submit} className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-4">
            {/* Linguaggio naturale: primo campo, a tutta larghezza (alimenta q). */}
            <div className="md:col-span-4">
              <label className={labelCls}>
                {d.search.nlHint}
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={d.search.nlPlaceholder}
                  aria-label={d.search.title}
                  className={`mt-3 ${fieldCls}`}
                />
              </label>

              {/* Esempi: cliccando si compila il campo (nessun auto-invio: l'utente
                  può ritoccare la frase prima di cercare). */}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="text-body text-stone">{c.chipsLabel}</span>
                {c.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setQ(chip);
                      inputRef.current?.focus();
                    }}
                    className="dt-btn dt-btn--ghost dt-btn--sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtri classici */}
            <label className={labelCls}>
              {c.zona}
              <input
                value={comune}
                onChange={(e) => setComune(e.target.value)}
                placeholder={c.zonaPh}
                className={`mt-3 ${fieldCls}`}
              />
            </label>
            <label className={labelCls}>
              {c.tipologia}
              <span className="relative mt-3 block">
                <select value={type} onChange={(e) => setType(e.target.value)} className={`${fieldCls} appearance-none pr-8`}>
                  <option value="">{c.anyType}</option>
                  {typeValues.map((v, i) => (
                    <option key={v} value={v}>{c.types[i]}</option>
                  ))}
                </select>
                <Caret />
              </span>
            </label>
            <label className={labelCls}>
              {c.budget}
              <span className="relative mt-3 block">
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className={`${fieldCls} appearance-none pr-8`}>
                  {budgetValues.map((b) => (
                    <option key={b.v} value={b.v}>{b.v === 0 ? c.anyBudget : `${(b.v / 1000).toLocaleString()}k €`}</option>
                  ))}
                </select>
                <Caret />
              </span>
            </label>
            <label className={labelCls}>
              {c.locali}
              <span className="relative mt-3 block">
                <select value={rooms} onChange={(e) => setRooms(e.target.value)} className={`${fieldCls} appearance-none pr-8`}>
                  {roomValues.map((r) => (
                    <option key={r} value={r}>{r === 0 ? c.anyRooms : `${r}+`}</option>
                  ))}
                </select>
                <Caret />
              </span>
            </label>

            <div className="flex justify-end md:col-span-4">
              <CtaButton type="submit" variant="cta-solid" size="lg">
                {c.search}
              </CtaButton>
            </div>
          </form>
        </Reveal>

        {/* Scorciatoia per chi vende: una riga di testo, non una card. §9 — la
            RAGIONE fra la domanda e il pulsante (prepariamo, verifichiamo, fino al rogito). */}
        <Reveal delay={100}>
          <div className="mt-[10vh] max-w-[60ch]">
            <h3 className="font-display text-d3">{d.search.sellerTitle}</h3>
            <p className="lead mt-4">{d.search.sellerCopy}</p>
            <Cta href="/vendi" variant="ghost" className="mt-6">
              {d.search.sellerCta}
            </Cta>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
