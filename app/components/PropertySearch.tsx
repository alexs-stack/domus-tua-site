"use client";

import { useEffect, useMemo, useState } from "react";
import Reveal from "./Reveal";
import PropertyCard from "./PropertyCard";
import { ArrowRight } from "./Icons";
import { SegnoDomusBadge } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";
import { buildWhatsAppUrl } from "../lib/forms/whatsapp";
import type { Property } from "../lib/properties";
import type { ParsedSearch, SearchResponse } from "../lib/ai/types";

// Dizionario UI inline. Le VALUE dei filtri (contract/type/feature) restano in italiano
// perché confrontate con i dati (p.status, p.type, featureOptions.match); qui traduciamo
// solo le LABEL che l'utente vede.
const copy = {
  it: {
    nlPlaceholder: "Es. trilocale con giardino a Tradate sotto 300.000 €",
    nlAria: "Descrivi la casa che cerchi",
    smartBadge: "Ricerca intelligente",
    teaser: "Scrivi come parleresti a noi e premi Invio: pensiamo noi a trovare le case giuste.",
    searchAria: "Avvia la ricerca",
    searching: "Cerco…",
    aiResultPrefix: "Hai cercato",
    aiClear: "Annulla",
    aiError: "Non sono riuscito a interpretarla bene: puoi usare i filtri qui sotto.",
    contract: "Contratto",
    type: "Tipologia",
    zone: "Zona",
    budget: "Budget",
    rooms: "Locali",
    features: "Caratteristiche",
    manualReset: "Azzera filtri",
    budgetUpTo: "Fino a",
    priceFrom: "da",
    priceRemove: "Rimuovi il prezzo minimo",
    availabilityLabel: "Disponibilità",
    availAvailable: "Disponibili",
    availSold: "Venduti",
    remove: "Rimuovi",
    contractLabels: { Tutte: "Tutte", Vendita: "Vendita", Affitto: "Affitto" },
    typeLabels: { Tutte: "Tutte", Appartamento: "Appartamento", Attico: "Attico", Villa: "Villa", Commerciale: "Commerciale", Terreno: "Terreno" },
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
      "Fino a 1.000.000 €": "Fino a 1.000.000 €",
      "Fino a 1.500.000 €": "Fino a 1.500.000 €",
    } as Record<string, string>,
    roomsAny: "Qualsiasi",
    resultsOne: "immobile trovato",
    resultsMany: "immobili trovati",
    notFound: "Non trovi la casa giusta? Dillo a noi",
    emptyTitle: "Non c’è online? Potrebbe arrivare.",
    emptyBody: "Raccontaci cosa cerchi: molte richieste vengono seguite prima ancora che l’immobile arrivi online.",
    emptyCta: "Lasciaci la tua richiesta",
    showMore: "Mostra altre case",
    showingHint: "Mostrando {n} di {tot}",
  },
  en: {
    nlPlaceholder: "E.g. two-bed with garden in Tradate under €300,000",
    nlAria: "Describe the home you’re looking for",
    smartBadge: "Smart search",
    teaser: "Write it as you’d tell us and press Enter: we’ll find the right homes.",
    searchAria: "Start the search",
    searching: "Searching…",
    aiResultPrefix: "You searched",
    aiClear: "Clear",
    aiError: "I couldn’t quite read that: use the filters below.",
    contract: "Contract",
    type: "Type",
    zone: "Area",
    budget: "Budget",
    rooms: "Rooms",
    features: "Features",
    manualReset: "Reset filters",
    budgetUpTo: "Up to",
    priceFrom: "from",
    priceRemove: "Remove minimum price",
    availabilityLabel: "Availability",
    availAvailable: "Available",
    availSold: "Sold",
    remove: "Remove",
    contractLabels: { Tutte: "All", Vendita: "For sale", Affitto: "To rent" },
    typeLabels: { Tutte: "All", Appartamento: "Apartment", Attico: "Penthouse", Villa: "Villa", Commerciale: "Commercial", Terreno: "Land" },
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
      "Fino a 1.000.000 €": "Up to €1,000,000",
      "Fino a 1.500.000 €": "Up to €1,500,000",
    } as Record<string, string>,
    roomsAny: "Any",
    resultsOne: "home found",
    resultsMany: "homes found",
    notFound: "Can’t find the right home? Tell us",
    emptyTitle: "Not online yet? It might be soon.",
    emptyBody: "Tell us what you’re after: many requests are handled before the home even goes online.",
    emptyCta: "Send us your request",
    showMore: "Show more homes",
    showingHint: "Showing {n} of {tot}",
  },
  fr: {
    nlPlaceholder: "Ex. trois-pièces avec jardin à Tradate sous 300 000 €",
    nlAria: "Décrivez la maison que vous cherchez",
    smartBadge: "Recherche intelligente",
    teaser: "Écrivez comme vous nous le diriez, puis appuyez sur Entrée : nous trouvons les bons biens.",
    searchAria: "Lancer la recherche",
    searching: "Recherche…",
    aiResultPrefix: "Vous avez cherché",
    aiClear: "Effacer",
    aiError: "Je n’ai pas bien compris : utilisez les filtres ci-dessous.",
    contract: "Contrat",
    type: "Type",
    zone: "Secteur",
    budget: "Budget",
    rooms: "Pièces",
    features: "Caractéristiques",
    manualReset: "Réinitialiser",
    budgetUpTo: "Jusqu’à",
    priceFrom: "à partir de",
    priceRemove: "Retirer le prix minimum",
    availabilityLabel: "Disponibilité",
    availAvailable: "Disponibles",
    availSold: "Vendus",
    remove: "Retirer",
    contractLabels: { Tutte: "Tous", Vendita: "À vendre", Affitto: "À louer" },
    typeLabels: { Tutte: "Tous", Appartamento: "Appartement", Attico: "Attique", Villa: "Villa", Commerciale: "Commercial", Terreno: "Terrain" },
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
      "Fino a 1.000.000 €": "Jusqu’à 1 000 000 €",
      "Fino a 1.500.000 €": "Jusqu’à 1 500 000 €",
    } as Record<string, string>,
    roomsAny: "Indifférent",
    resultsOne: "bien trouvé",
    resultsMany: "biens trouvés",
    notFound: "Vous ne trouvez pas le bon bien ? Dites-le-nous",
    emptyTitle: "Pas encore en ligne ? Cela peut arriver.",
    emptyBody: "Dites-nous ce que vous cherchez : de nombreuses demandes sont suivies avant même que le bien n’arrive en ligne.",
    emptyCta: "Envoyez-nous votre demande",
    showMore: "Voir plus de biens",
    showingHint: "Affichage de {n} sur {tot}",
  },
  de: {
    nlPlaceholder: "Z. B. Dreizimmerwohnung mit Garten in Tradate unter 300.000 €",
    nlAria: "Beschreiben Sie das Zuhause, das Sie suchen",
    smartBadge: "Intelligente Suche",
    teaser: "Schreiben Sie es, wie Sie es uns sagen würden, und drücken Sie Enter: wir finden die passenden Objekte.",
    searchAria: "Suche starten",
    searching: "Suche…",
    aiResultPrefix: "Ihre Suche",
    aiClear: "Zurücksetzen",
    aiError: "Das habe ich nicht ganz verstanden: nutzen Sie die Filter unten.",
    contract: "Vertrag",
    type: "Objektart",
    zone: "Gebiet",
    budget: "Budget",
    rooms: "Zimmer",
    features: "Ausstattung",
    manualReset: "Filter zurücksetzen",
    budgetUpTo: "Bis",
    priceFrom: "ab",
    priceRemove: "Mindestpreis entfernen",
    availabilityLabel: "Verfügbarkeit",
    availAvailable: "Verfügbar",
    availSold: "Verkauft",
    remove: "Entfernen",
    contractLabels: { Tutte: "Alle", Vendita: "Zum Kauf", Affitto: "Zur Miete" },
    typeLabels: { Tutte: "Alle", Appartamento: "Wohnung", Attico: "Penthouse", Villa: "Villa", Commerciale: "Gewerbe", Terreno: "Grundstück" },
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
      "Fino a 1.000.000 €": "Bis 1.000.000 €",
      "Fino a 1.500.000 €": "Bis 1.500.000 €",
    } as Record<string, string>,
    roomsAny: "Beliebig",
    resultsOne: "Objekt gefunden",
    resultsMany: "Objekte gefunden",
    notFound: "Nicht das richtige Zuhause dabei? Sagen Sie es uns",
    emptyTitle: "Kein Objekt passt zu diesen Filtern.",
    emptyBody: "Mit diesen Filtern gibt es gerade nichts. Sagen Sie uns, was Sie suchen: Wir betreuen auch maßgeschneiderte Anfragen und diskrete Verhandlungen und melden uns, sobald etwas hereinkommt.",
    emptyCta: "Zuhause finden mit Domus Tua",
    showMore: "Mehr Immobilien anzeigen",
    showingHint: "{n} von {tot} werden angezeigt",
  },
  es: {
    nlPlaceholder: "P. ej. piso de tres ambientes con jardín en Tradate por menos de 300.000 €",
    nlAria: "Describe la casa que buscas",
    smartBadge: "Búsqueda inteligente",
    teaser: "Escríbelo como nos lo contarías y pulsa Intro: encontramos las casas adecuadas.",
    searchAria: "Iniciar la búsqueda",
    searching: "Buscando…",
    aiResultPrefix: "Has buscado",
    aiClear: "Borrar",
    aiError: "No lo he interpretado bien: usa los filtros de abajo.",
    contract: "Contrato",
    type: "Tipología",
    zone: "Zona",
    budget: "Presupuesto",
    rooms: "Habitaciones",
    features: "Características",
    manualReset: "Restablecer filtros",
    budgetUpTo: "Hasta",
    priceFrom: "desde",
    priceRemove: "Quitar el precio mínimo",
    availabilityLabel: "Disponibilidad",
    availAvailable: "Disponibles",
    availSold: "Vendidos",
    remove: "Quitar",
    contractLabels: { Tutte: "Todos", Vendita: "En venta", Affitto: "En alquiler" },
    typeLabels: { Tutte: "Todos", Appartamento: "Piso", Attico: "Ático", Villa: "Villa", Commerciale: "Comercial", Terreno: "Terreno" },
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
      "Fino a 1.000.000 €": "Hasta 1.000.000 €",
      "Fino a 1.500.000 €": "Hasta 1.500.000 €",
    } as Record<string, string>,
    roomsAny: "Cualquiera",
    resultsOne: "inmueble encontrado",
    resultsMany: "inmuebles encontrados",
    notFound: "¿No encuentras la casa adecuada? Cuéntanoslo",
    emptyTitle: "¿Todavía no está online? Puede que llegue.",
    emptyBody: "Cuéntanos qué buscas: muchas peticiones las seguimos antes incluso de que el inmueble llegue a estar online.",
    emptyCta: "Envíanos tu solicitud",
    showMore: "Ver más casas",
    showingHint: "Mostrando {n} de {tot}",
  },
} as const;

// Filtri MVP client-side. Pronto per collegarsi ai dati live RealSmart:
// vedi app/lib/realsmart/ e docs/realsmart-integration-notes.md.
export type PropertyFilters = {
  contract: "Tutte" | "Vendita" | "Affitto";
  type: "Tutte" | Property["type"];
  comune: string;
  maxBudget: number; // 0 = nessun limite
  minBudget: number; // 0 = nessun minimo
  minRooms: number; // 0 = qualsiasi
  minSqm: number; // 0 = qualsiasi (m²)
  maxSqm: number; // 0 = qualsiasi (m²)
  features: string[];
  availability: "available" | "sold"; // "available" = solo disponibili (default, nasconde i venduti)
};

// Formattazione prezzo per lingua (raggruppamento migliaia coerente col locale).
const LOCALE_TAG: Record<string, string> = { it: "it-IT", en: "en-GB", fr: "fr-FR", de: "de-DE", es: "es-ES" };

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
  { label: "Fino a 1.000.000 €", value: 1000000 },
  { label: "Fino a 1.500.000 €", value: 1500000 },
];

const roomOptions = [
  { label: "Qualsiasi", value: 0 },
  { label: "1+", value: 1 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
];

const types: PropertyFilters["type"][] = ["Tutte", "Appartamento", "Attico", "Villa", "Commerciale", "Terreno"];

/** Mappa i filtri estratti dall'AI (ParsedSearch) sullo shape dei filtri del client, con clamp. */
function toFilters(parsed: ParsedSearch): PropertyFilters {
  const type = parsed.type && (types as string[]).includes(parsed.type) ? parsed.type : "Tutte";
  const contract =
    parsed.contract === "Vendita" || parsed.contract === "Affitto" ? parsed.contract : "Tutte";
  return {
    contract,
    type: type as PropertyFilters["type"],
    comune: parsed.comune || "Tutti",
    maxBudget: parsed.maxBudget && parsed.maxBudget > 0 ? parsed.maxBudget : 0,
    minBudget: parsed.minBudget && parsed.minBudget > 0 ? parsed.minBudget : 0,
    minRooms: parsed.minRooms && parsed.minRooms > 0 ? parsed.minRooms : 0,
    minSqm: parsed.minSqm && parsed.minSqm > 0 ? parsed.minSqm : 0,
    maxSqm: parsed.maxSqm && parsed.maxSqm > 0 ? parsed.maxSqm : 0,
    features: (parsed.features || []).filter((x) => featureOptions.some((o) => o.label === x)),
    availability: "available", // la ricerca AI mostra solo disponibili (i venduti sono esclusi a monte)
  };
}

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
    minBudget: 0,
    minRooms: 0,
    minSqm: 0,
    maxSqm: 0,
    features: [],
    availability: "available",
  });
  const money = (v: number) => new Intl.NumberFormat(LOCALE_TAG[locale] ?? "it-IT").format(v);
  const [visible, setVisible] = useState(24);
  const [searching, setSearching] = useState(false);
  const [aiError, setAiError] = useState(false);
  // Risultato della ricerca AI: query mostrata + slug ordinati per rilevanza + firma dei filtri
  // applicati (per capire quando l'utente modifica un filtro a mano e uscire dalla modalità AI).
  const [ai, setAi] = useState<{ query: string; slugs: string[]; key: string } | null>(null);

  const bySlug = useMemo(() => new Map(properties.map((p) => [p.slug, p])), [properties]);

  async function runSearch(query?: string) {
    const q = (query ?? nl).trim();
    if (!q || searching) return;
    setSearching(true);
    setAiError(false);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const data = (await res.json()) as SearchResponse;
      if (data.ok && data.filters) {
        const mapped = toFilters(data.filters);
        setF(mapped);
        setAi({ query: q, slugs: data.rankedSlugs ?? [], key: JSON.stringify(mapped) });
      } else {
        setAiError(true);
      }
    } catch {
      setAiError(true);
    } finally {
      setSearching(false);
    }
  }

  const clearAi = () => {
    setAi(null);
    setAiError(false);
    setNl("");
    // "Annulla" = torna a sfogliare tutto: azzera anche i filtri impostati dalla ricerca.
    setF({ contract: "Tutte", type: "Tutte", comune: "Tutti", maxBudget: 0, minBudget: 0, minRooms: 0, minSqm: 0, maxSqm: 0, features: [], availability: "available" });
  };

  // Vero quando un qualsiasi filtro manuale differisce dai default (abilita "Azzera filtri").
  const filtersActive =
    f.contract !== "Tutte" ||
    f.type !== "Tutte" ||
    f.comune !== "Tutti" ||
    f.maxBudget !== 0 ||
    f.minBudget !== 0 ||
    f.minRooms !== 0 ||
    f.minSqm !== 0 ||
    f.maxSqm !== 0 ||
    f.availability !== "available" ||
    f.features.length > 0;

  const resetFilters = () =>
    setF({ contract: "Tutte", type: "Tutte", comune: "Tutti", maxBudget: 0, minBudget: 0, minRooms: 0, minSqm: 0, maxSqm: 0, features: [], availability: "available" });

  // Pre-imposta i filtri dai query param passati da HomeSearchGateway (/case?q=&comune=&type=&budget=&rooms=).
  // setState post-mount è voluto: i query param vanno letti solo lato client (evita mismatch di hydration).
  // Se arriva ?q= dalla ricerca in home, avvia la ricerca AI una sola volta (auto-run alla conversione).
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
      minBudget: sp.get("minBudget") ? Number(sp.get("minBudget")) || 0 : s.minBudget,
      minRooms: rooms ? Number(rooms) || 0 : s.minRooms,
      comune: comune || s.comune,
    }));
    /* eslint-enable react-hooks/set-state-in-effect */
    // La query esplicita è passata a runSearch: lo stato nl non è ancora aggiornato in questo tick.
    if (q?.trim()) void runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambio filtri (o risultato AI) riparti dalle prime 24 case.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setVisible(24);
  }, [f, ai]);

  // Se l'utente modifica un filtro a mano, esci dalla modalità AI (torna al filtro client).
  // La ricerca AI imposta f = mapped e ai.key = JSON(mapped): finché combaciano, resta attiva.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    if (ai && JSON.stringify(f) !== ai.key) setAi(null);
  }, [f, ai]);

  const comuni = useMemo(() => {
    const derived = Array.from(new Set(properties.map((p) => p.zone.split(",")[0].trim()))).sort((a, b) =>
      a.localeCompare(b, "it"),
    );
    const base = ["Tutti", ...derived]; // "Tutti" resta fisso in cima, il resto ordinato alfabeticamente.
    // Include il comune cercato anche se nessun immobile combacia (mostra il blocco "nessun risultato").
    return base.includes(f.comune) ? base : [...base, f.comune];
  }, [properties, f.comune]);

  const shown = useMemo(() => {
    // Modalità AI: mostra gli immobili nell'ordine di rilevanza deciso dal server.
    if (ai) {
      return ai.slugs.map((s) => bySlug.get(s)).filter((p): p is Property => !!p);
    }
    return properties.filter((p) => {
      // Disponibilità: di default nascondi i venduti; "Venduti" mostra solo quelli.
      if (f.availability === "available" && p.sold) return false;
      if (f.availability === "sold" && !p.sold) return false;
      if (f.contract !== "Tutte" && p.status !== f.contract) return false;
      if (f.type !== "Tutte" && p.type !== f.type) return false;
      if (f.comune !== "Tutti" && p.zone.split(",")[0].trim() !== f.comune) return false;
      if (f.maxBudget && (p.priceValue <= 0 || p.priceValue > f.maxBudget)) return false;
      if (f.minBudget && (p.priceValue <= 0 || p.priceValue < f.minBudget)) return false;
      if (f.minRooms && roomsNum(p) < f.minRooms) return false;
      if (f.minSqm || f.maxSqm) {
        const sq = parseInt(p.sqm, 10) || 0;
        if (f.minSqm && (sq <= 0 || sq < f.minSqm)) return false;
        if (f.maxSqm && (sq <= 0 || sq > f.maxSqm)) return false;
      }
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
  }, [f, properties, ai, bySlug]);

  const toggleFeature = (label: string) =>
    setF((s) => ({
      ...s,
      features: s.features.includes(label)
        ? s.features.filter((x) => x !== label)
        : [...s.features, label],
    }));

  // Opzioni budget localizzate + eventuale valore fuori-bucket (es. "sotto 300.000") dalla ricerca.
  const budgetChoices = budgetOptions.map((b) => ({ value: b.value, label: c.budgetLabels[b.label] ?? b.label }));
  if (f.maxBudget > 0 && !budgetOptions.some((b) => b.value === f.maxBudget)) {
    budgetChoices.push({ value: f.maxBudget, label: `${c.budgetUpTo} ${money(f.maxBudget)} €` });
  }

  const pill = (active: boolean) =>
    `inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
      active
        ? "border-red bg-red text-white hover:bg-red-dark"
        : "border-line bg-paper text-graphite hover:border-red/40 hover:text-ink"
    }`;

  // Empty-state / "non trovi la casa giusta": WhatsApp buyer precompilato con la frase cercata =
  // massima conversione anche a zero risultati (canale immediato, intento acquirente esplicito).
  // TODO(analytics): tracciare l'evento "search_no_results" (query + n. filtri attivi) quando
  // shown.length === 0, per misurare la domanda insoddisfatta e alimentare gli acquisti su misura.
  const buyerQuery = (ai?.query || nl).trim();
  const buyerWaUrl = buildWhatsAppUrl(
    site.whatsapp.href,
    `Ciao Domus Tua, sto cercando casa${buyerQuery ? ` — ho cercato: "${buyerQuery}"` : ""}. Non l'ho ancora trovata sul sito, potete aiutarmi?`,
  );

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        {/* Ricerca in linguaggio naturale (AI) */}
        <Reveal>
          <div className="rounded-[2rem] border border-line bg-paper p-2 shadow-[0_40px_90px_-60px_rgba(26,24,22,0.5)]">
            <div className="flex flex-col gap-3 rounded-[calc(2rem-0.5rem)] bg-cream p-5 sm:flex-row sm:items-center sm:p-4 sm:pl-6">
              <SegnoDomusBadge className="shrink-0 self-start border-red/25 bg-red-soft text-red-dark sm:self-auto">
                {c.smartBadge}
              </SegnoDomusBadge>
              <input
                value={nl}
                onChange={(e) => setNl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void runSearch();
                  }
                }}
                placeholder={c.nlPlaceholder}
                className="w-full flex-1 rounded-lg bg-transparent text-base text-ink placeholder:text-stone/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red"
                aria-label={c.nlAria}
              />
              <button
                type="button"
                onClick={() => void runSearch()}
                disabled={searching || !nl.trim()}
                aria-label={c.searchAria}
                className="grid h-11 w-11 shrink-0 place-items-center self-start rounded-full bg-red text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
              >
                {searching ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          {ai ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 pl-2 text-[0.82rem] text-stone">
              <span>
                {c.aiResultPrefix}: <span className="font-semibold text-ink">“{ai.query}”</span>
              </span>
              <button
                type="button"
                onClick={clearAi}
                className="underline underline-offset-2 hover:text-ink"
              >
                {c.aiClear}
              </button>
            </p>
          ) : aiError ? (
            <p className="mt-3 pl-2 text-[0.82rem] text-red-dark">{c.aiError}</p>
          ) : (
            <p className="mt-3 pl-2 text-[0.82rem] text-stone">{c.teaser}</p>
          )}
        </Reveal>

        {/* Filtri */}
        <Reveal delay={80} className="mt-8 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.78rem] font-semibold uppercase tracking-wide text-stone">
              {c.contract}
            </span>
            {(["Tutte", "Vendita", "Affitto"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={f.contract === v}
                onClick={() => setF((s) => ({ ...s, contract: v }))}
                className={pill(f.contract === v)}
              >
                {c.contractLabels[v]}
              </button>
            ))}
          </div>

          {/* Disponibilità: appare solo se c'è almeno un immobile venduto (default: nasconde i venduti). */}
          {properties.some((p) => p.sold) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[0.78rem] font-semibold uppercase tracking-wide text-stone">
                {c.availabilityLabel}
              </span>
              {(["available", "sold"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={f.availability === v}
                  onClick={() => setF((s) => ({ ...s, availability: v }))}
                  className={pill(f.availability === v)}
                >
                  {v === "available" ? c.availAvailable : c.availSold}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.78rem] font-semibold uppercase tracking-wide text-stone">
              {c.type}
            </span>
            {types.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={f.type === t}
                onClick={() => setF((s) => ({ ...s, type: t }))}
                className={pill(f.type === t)}
              >
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
                className={`rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink transition-colors duration-300 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                  f.comune !== "Tutti" ? "border-red/45 font-medium" : ""
                }`}
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
                className={`rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink transition-colors duration-300 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                  f.maxBudget !== 0 ? "border-red/45 font-medium" : ""
                }`}
              >
                {budgetChoices.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-stone">{c.rooms}</span>
              <select
                value={f.minRooms}
                onChange={(e) => setF((s) => ({ ...s, minRooms: Number(e.target.value) }))}
                className={`rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink transition-colors duration-300 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                  f.minRooms !== 0 ? "border-red/45 font-medium" : ""
                }`}
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
              <button
                key={o.label}
                type="button"
                aria-pressed={f.features.includes(o.label)}
                onClick={() => toggleFeature(o.label)}
                className={pill(f.features.includes(o.label))}
              >
                {c.featureLabels[o.label] ?? o.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Risultati */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm text-stone">
              <span className="font-semibold text-ink">{shown.length}</span>{" "}
              {shown.length === 1 ? c.resultsOne : c.resultsMany}
            </p>
            {f.minBudget > 0 && (
              <button
                type="button"
                onClick={() => setF((s) => ({ ...s, minBudget: 0 }))}
                aria-label={c.priceRemove}
                className="inline-flex items-center gap-1.5 rounded-full border border-red/30 bg-red-soft px-3 py-1 text-[0.8rem] font-medium text-red-dark transition-colors duration-300 hover:border-red hover:text-red"
              >
                {c.priceFrom} {money(f.minBudget)} €<span aria-hidden>×</span>
              </button>
            )}
            {f.minSqm > 0 && (
              <button
                type="button"
                onClick={() => setF((s) => ({ ...s, minSqm: 0 }))}
                aria-label={`${c.remove}: ${c.priceFrom} ${f.minSqm} m²`}
                className="inline-flex items-center gap-1.5 rounded-full border border-red/30 bg-red-soft px-3 py-1 text-[0.8rem] font-medium text-red-dark transition-colors duration-300 hover:border-red hover:text-red"
              >
                {c.priceFrom} {f.minSqm} m²<span aria-hidden>×</span>
              </button>
            )}
            {f.maxSqm > 0 && (
              <button
                type="button"
                onClick={() => setF((s) => ({ ...s, maxSqm: 0 }))}
                aria-label={`${c.remove}: ${c.budgetUpTo} ${f.maxSqm} m²`}
                className="inline-flex items-center gap-1.5 rounded-full border border-red/30 bg-red-soft px-3 py-1 text-[0.8rem] font-medium text-red-dark transition-colors duration-300 hover:border-red hover:text-red"
              >
                {c.budgetUpTo} {f.maxSqm} m²<span aria-hidden>×</span>
              </button>
            )}
            {!ai && filtersActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm text-stone underline underline-offset-2 transition-colors duration-300 hover:text-ink"
              >
                {c.manualReset}
              </button>
            )}
          </div>
          <a
            href="#contatti"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-red hover:text-red-dark"
          >
            {c.notFound}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>

        {shown.length > 0 ? (
          <>
            <div
              aria-busy={searching}
              className={`mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${
                searching ? "opacity-50 transition-opacity duration-300" : "transition-opacity duration-300"
              }`}
            >
              {shown.slice(0, visible).map((p, i) => (
                <Reveal key={p.slug} delay={(i % 3) * 90}>
                  <PropertyCard p={p} />
                </Reveal>
              ))}
            </div>
            {visible < shown.length && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <button
                  onClick={() => setVisible((v) => v + 24)}
                  className="rounded-full border border-line bg-paper px-7 py-3 text-sm font-semibold text-ink transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-red active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  {c.showMore}
                </button>
                <p className="text-[0.82rem] text-stone">
                  {c.showingHint
                    .replace("{n}", String(Math.min(visible, shown.length)))
                    .replace("{tot}", String(shown.length))}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 rounded-[1.75rem] border border-line bg-paper p-10 text-center">
            <p className="font-display text-2xl font-medium text-ink">{c.emptyTitle}</p>
            <p className="mx-auto mt-2 max-w-xl text-stone">{c.emptyBody}</p>
            {/* CTA a intento acquirente su WhatsApp, precompilato con la frase cercata. */}
            <a
              href={buyerWaUrl}
              target="_blank"
              rel="noopener noreferrer"
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
