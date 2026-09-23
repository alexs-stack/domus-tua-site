"use client";

import dynamic from "next/dynamic";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Dispatch, MutableRefObject, ReactNode, SetStateAction } from "react";
import { Flip } from "gsap/Flip";
import Reveal from "./Reveal";
import PropertyCard from "./PropertyCard";
// Leaflet, i cluster e i loro CSS pesano quanto tutto il resto della pagina, e servono solo a
// chi passa alla vista mappa: si caricano al momento del passaggio, non prima.
const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse bg-cream-deep" aria-hidden />,
});
import CaseQuickLook from "./CaseQuickLook";
import RigaScritta from "./motion/RigaScritta";
import { ArrowRight } from "./Icons";
import { Cta, CtaButton } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";
import { buildWhatsAppUrl } from "../lib/forms/whatsapp";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger } from "../lib/motion/gsap";
import { groupAvailableByTown } from "../lib/geo/comuni";
import { canonicalComune, comuniFacet, matchesComune } from "../lib/comune";
import { isAvailable, isSold } from "../lib/availability";
import type { GridProperty } from "../lib/properties";
import type { ParsedSearch, SearchResponse } from "../lib/ai/types";

// Flip serve solo al riordino dei risultati al cambio filtri (PropertySearch
// invariato, spec §5.3): registrato localmente, come SplitText in Lead (A20 di
// Alberto), per non finire nel chunk del layout via gsap.ts.
gsap.registerPlugin(Flip);

// Dizionario UI inline. Le VALUE dei filtri (contract/type/feature) restano in italiano
// perché confrontate con i dati (p.status, p.type, featureOptions.match); qui traduciamo
// solo le LABEL che l'utente vede.
const copy = {
  it: {
    nlPlaceholder: "Es. trilocale con giardino a Tradate sotto 300.000 €",
    // Sotto lg il campo è largo quanto il telefono: l'esempio intero finiva tagliato (A80).
    nlPlaceholderBreve: "Es. trilocale con giardino",
    nlAria: "Descrivi la casa che cerchi",
    resultsHeading: "Immobili trovati",
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
    viewList: "Lista",
    viewMap: "Mappa",
    emptyTitle: "Non c’è online? Potrebbe arrivare.",
    emptyBody: "Raccontaci cosa cerchi: molte richieste vengono seguite prima ancora che l’immobile arrivi online.",
    emptyCta: "Lasciaci la tua richiesta",
    showMore: "Mostra altre case",
    showingHint: "Mostrando {n} di {tot}",
  },
  en: {
    nlPlaceholder: "E.g. two-bed with garden in Tradate under €300,000",
    nlPlaceholderBreve: "E.g. two-bed with garden",
    nlAria: "Describe the home you’re looking for",
    resultsHeading: "Homes found",
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
    viewList: "List",
    viewMap: "Map",
    emptyTitle: "Not online yet? It might be soon.",
    emptyBody: "Tell us what you’re after: many requests are handled before the home even goes online.",
    emptyCta: "Send us your request",
    showMore: "Show more homes",
    showingHint: "Showing {n} of {tot}",
  },
  fr: {
    nlPlaceholder: "Ex. trois-pièces avec jardin à Tradate sous 300 000 €",
    nlPlaceholderBreve: "Ex. trois-pièces avec jardin",
    nlAria: "Décrivez la maison que vous cherchez",
    resultsHeading: "Biens trouvés",
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
    viewList: "Liste",
    viewMap: "Carte",
    emptyTitle: "Pas encore en ligne ? Cela peut arriver.",
    emptyBody: "Dites-nous ce que vous cherchez : de nombreuses demandes sont suivies avant même que le bien n’arrive en ligne.",
    emptyCta: "Envoyez-nous votre demande",
    showMore: "Voir plus de biens",
    showingHint: "Affichage de {n} sur {tot}",
  },
  de: {
    nlPlaceholder: "Z. B. Dreizimmerwohnung mit Garten in Tradate unter 300.000 €",
    nlPlaceholderBreve: "Z. B. 3 Zimmer mit Garten",
    nlAria: "Beschreiben Sie das Zuhause, das Sie suchen",
    resultsHeading: "Gefundene Objekte",
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
    viewList: "Liste",
    viewMap: "Karte",
    // Le altre quattro lingue non dicono «nessun risultato»: dicono che l’immobile
    // potrebbe ancora arrivare, e invitano a lasciare una richiesta. Il tedesco diceva
    // un’altra cosa — e il pulsante invitava a NAVIGARE mentre apre WhatsApp precompilato
    // con la frase cercata. Ora promette quello che fa, come le altre quattro.
    emptyTitle: "Nicht online? Es kann noch kommen.",
    emptyBody: "Sagen Sie uns, was Sie suchen: viele Anfragen betreuen wir, noch bevor die Immobilie überhaupt online geht.",
    emptyCta: "Hinterlassen Sie uns Ihre Anfrage",
    showMore: "Mehr Immobilien anzeigen",
    showingHint: "{n} von {tot} werden angezeigt",
  },
  es: {
    // A80: 74 segni uscivano dal campo a ogni larghezza da lg e l'ellissi tagliava il prezzo.
    nlPlaceholder: "P. ej. piso de 3 ambientes con jardín en Tradate hasta 300.000 €",
    nlPlaceholderBreve: "P. ej. piso con jardín",
    nlAria: "Describe la casa que buscas",
    resultsHeading: "Inmuebles encontrados",
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
    viewList: "Lista",
    viewMap: "Mapa",
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
  type: "Tutte" | GridProperty["type"];
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

function roomsNum(p: GridProperty) {
  return parseInt(p.rooms, 10) || 0;
}
function haystack(p: GridProperty) {
  return `${p.features.join(" ")} ${p.excerpt} ${p.badges.join(" ")}`.toLowerCase();
}

// ── Lo stato della ricerca (A48, Alberto 22 set. 2026) ──────────────────────
// «la ricerca intelligente va più su, in modo che appaia sopra la foto e dopo la scritta hero»:
// la TESTA della ricerca (occhiello, campo, stato) posa sulla foto della testa di /acquista
// (PageHero `sopra`, in bianco da lg; sotto lg segue la foto in inchiostro), i filtri e i
// risultati restano sulla carta (#case). Le due parti vivono in due punti dell'albero: lo stato
// che condividono (la frase, i filtri, il risultato AI, il FLIP della griglia) sta in
// RicercaProvider, che AcquistaContent monta attorno a entrambe. Senza provider PropertySearch
// se lo monta da solo e rende la testa in sezione, com'era prima (nessun altro chiamante oggi).
type Ai = { query: string; slugs: string[]; key: string } | null;
type Ricerca = {
  properties: GridProperty[];
  nl: string;
  setNl: (v: string) => void;
  f: PropertyFilters;
  setF: Dispatch<SetStateAction<PropertyFilters>>;
  /** Identico a setF, in più cattura il layout corrente per animare il riordino (FLIP). */
  setFilters: Dispatch<SetStateAction<PropertyFilters>>;
  searching: boolean;
  aiError: boolean;
  ai: Ai;
  runSearch: (query?: string) => Promise<void>;
  clearAi: () => void;
  resetFilters: () => void;
  filtersActive: boolean;
  gridRef: MutableRefObject<HTMLDivElement | null>;
  flipStateRef: MutableRefObject<ReturnType<typeof Flip.getState> | null>;
  /** I comuni della tendina (comuniFacet + quello cercato), le scelte di budget localizzate, la valuta. */
  comuni: string[];
  budgetChoices: Array<{ value: number; label: string }>;
  money: (v: number) => string;
};

const RicercaContext = createContext<Ricerca | null>(null);

function useRicerca(properties: GridProperty[]): Ricerca {
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
  const [searching, setSearching] = useState(false);
  const [aiError, setAiError] = useState(false);
  // Risultato della ricerca AI: query mostrata + slug ordinati per rilevanza + firma dei filtri
  // applicati (per capire quando l'utente modifica un filtro a mano e uscire dalla modalità AI).
  const [ai, setAi] = useState<Ai>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);
  // Layout della griglia catturato PRIMA del cambio di stato (punto di partenza del FLIP).
  const flipStateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const { locale } = useLocale();
  const money = (v: number) => new Intl.NumberFormat(LOCALE_TAG[locale] ?? "it-IT").format(v);
  // La tendina della zona (nella ricerca, A52) legge la stessa lista, con le stesse chiavi, della facet passata al
  // parser lato server: comuniFacet è la fonte unica, così tendina e filtro non possono divergere; "Tutti" resta
  // fisso in cima e il comune cercato entra anche se nessun immobile combacia (mostra «nessun risultato»).
  const comuni = useMemo(() => {
    const base = comuniFacet(properties);
    return base.includes(f.comune) ? base : [...base, f.comune];
  }, [properties, f.comune]);
  // Le scelte di budget della tendina (A52), localizzate, più l'eventuale valore fuori scaglione (es. «sotto
  // 300.000») che arriva dalla ricerca in linguaggio naturale.
  const budgetChoices = useMemo(() => {
    const c = copy[locale];
    const list = budgetOptions.map((b) => ({ value: b.value, label: c.budgetLabels[b.label] ?? b.label }));
    if (f.maxBudget > 0 && !budgetOptions.some((b) => b.value === f.maxBudget)) {
      list.push({ value: f.maxBudget, label: `${c.budgetUpTo} ${new Intl.NumberFormat(LOCALE_TAG[locale] ?? "it-IT").format(f.maxBudget)} €` });
    }
    return list;
  }, [locale, f.maxBudget]);

  // Il FLIP è evento-driven (non vive in matchMedia().add): check runtime, così con
  // reduced-motion il riordino resta istantaneo. Solo decorativo: mai ritardare lo stato.
  const snapFlip = () => {
    if (gridRef.current && window.matchMedia(MQ.motionOk).matches) {
      flipStateRef.current = Flip.getState(gridRef.current.children);
    }
  };

  /** Identico a setF, in più cattura il layout corrente per animare il riordino. */
  const setFilters: typeof setF = (next) => {
    snapFlip();
    setF(next);
  };

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
        snapFlip();
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
    snapFlip();
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
    setFilters({ contract: "Tutte", type: "Tutte", comune: "Tutti", maxBudget: 0, minBudget: 0, minRooms: 0, minSqm: 0, maxSqm: 0, features: [], availability: "available" });

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
      // Il comune arriva come testo libero dalla home: riportalo alla chiave esatta della
      // tendina quando combacia ("tradate" / "Tradate (VA)" -> "Tradate").
      comune: comune ? canonicalComune(comuniFacet(properties), comune) ?? comune : s.comune,
    }));
    /* eslint-enable react-hooks/set-state-in-effect */
    // La query esplicita è passata a runSearch: lo stato nl non è ancora aggiornato in questo tick.
    if (q?.trim()) void runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Se l'utente modifica un filtro a mano, esci dalla modalità AI (torna al filtro client).
  // La ricerca AI imposta f = mapped e ai.key = JSON(mapped): finché combaciano, resta attiva.
  useEffect(() => {
    if (ai && JSON.stringify(f) !== ai.key) {
      // Il DOM mostra ancora l'ordine AI: è il layout di partenza del FLIP
      // (snapshot inline, non snapFlip: identità stabile per le deps dell'effetto).
      if (gridRef.current && window.matchMedia(MQ.motionOk).matches) {
        flipStateRef.current = Flip.getState(gridRef.current.children);
      }
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setAi(null);
    }
  }, [f, ai]);

  return { properties, nl, setNl, f, setF, setFilters, searching, aiError, ai, runSearch, clearAi, resetFilters, filtersActive, gridRef, flipStateRef, comuni, budgetChoices, money };
}

/** Lo stato condiviso fra la testa della ricerca (sulla foto) e i risultati (sulla carta). */
export function RicercaProvider({ properties, children }: { properties: GridProperty[]; children: ReactNode }) {
  const value = useRicerca(properties);
  return <RicercaContext.Provider value={value}>{children}</RicercaContext.Provider>;
}

/* LA RICERCA (A52 di Alberto, 22 set. 2026, sera: «la ricerca non è leggibile, inoltre l'hai spezzata in
   due. cambiamo il design della ricerca per renderlo consono al resto del sito, attualmente è orribile,
   poco professionale. e rendiamola leggibile sopra la foto»). Un blocco solo, come una riga della
   rivista: l'occhiello, il campo in linguaggio naturale alla misura d4 con la sola riga sotto e il
   pulsante rosso, lo stato (teaser → risultato/errore), e sotto le CINQUE tendine in una riga (zona,
   budget, locali, tipologia, contratto), nella forma dei campi del modulo (DESIGN.md «Inputs / Fields»:
   nessuna scatola, la riga sotto, etichetta 1rem 600 maiuscola). I rettangoli con bordo dei filtri sono
   morti: i chip restano solo per gli affinamenti (caratteristiche, venduti) sopra i risultati, nella
   forma del modulo (testo con la riga sotto rossa quando selezionato).
   LA DOMANDA (A80 di Alberto, 23 set. 2026: «la ricerca intelligente non si vede … ingegnati e stupiscimi
   cambiando il design dell'input della ricerca, con qualcosa di figo e bello e consono al design del sito»).
   Sulla foto il bianco cadeva per metà sul cielo trasparente (la carta) e per metà sull'ulivo e sul muro
   bianco: la testa ora sta NEL CIELO della foto (PageHero `cielo`), sulla carta, in inchiostro, e la villa le
   sale sotto. Il campo è una seconda testata in cui si scrive: una riga in Playfair (il segnaposto in corsivo
   pietra, il testo scritto in tondo inchiostro), centrata sull'asse del titolo da lg; l'esempio si scrive da
   solo una volta dietro un cursore rosso (RigaScritta); al fuoco una riga rossa di 2 px si disegna sulla riga
   d'inchiostro; il pulsante tondo sta sulla riga come il punto fermo della frase: anello d'inchiostro a vuoto,
   disco rosso quando c'è una frase. Tutto su carta piatta: inchiostro 7,5:1, pietra 4,9:1, rosso cupo 6,1:1. */
type Opzione = { value: string; label: string };

// Il segnaposto per fascia: l'esempio intero da lg, quello corto sul telefono e sul tablet, dove il campo
// è stretto e l'intero finiva tagliato. Il server e il primo render del client usano quello corto (nessun
// mismatch d'idratazione); da lg cambia dopo l'idratazione, e cambiare un segnaposto non sposta nessuna
// scatola (da lg la ricerca sta sempre sotto la piega: il blocco è alto almeno 100svh).
const iscriviLg = (cb: () => void) => {
  const m = window.matchMedia(MQ.lg);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
function useDaLg() {
  return useSyncExternalStore(iscriviLg, () => window.matchMedia(MQ.lg).matches, () => false);
}

// La freccia della tendina: `appearance-none` toglie quella del browser (come nel modulo, Contact.tsx).
function Caret() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-stone">
      <path d="M3 6l5 5 5-5" />
    </svg>
  );
}

function Tendina({ label, value, onChange, options, attivo }: { label: string; value: string; onChange: (v: string) => void; options: Opzione[]; attivo: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-ui font-semibold uppercase tracking-[0.08em] text-stone">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`block w-full appearance-none truncate border-0 border-b border-ink! bg-transparent py-3 pr-8 text-body text-ink transition-colors focus:border-red! focus:outline-none ${attivo ? "font-medium" : ""}`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Caret />
      </span>
    </label>
  );
}

function TestaRicerca({ r }: { r: Ricerca }) {
  const { locale } = useLocale();
  const c = copy[locale];
  const { nl, setNl, runSearch, searching, ai, clearAi, aiError, f, setFilters, comuni, budgetChoices } = r;
  const daLg = useDaLg();
  const esempio = daLg ? c.nlPlaceholder : c.nlPlaceholderBreve;
  // La riga di stato: centrata sotto la domanda da lg, a sinistra sotto.
  const stato = "mt-[clamp(2rem,3.4vh,2.25rem)] text-body lg:mx-auto lg:max-w-[48rem] lg:text-center lg:text-balance";
  return (
    <div className="dt-ricerca mx-auto max-w-[84rem]">
      {/* La domanda (A80): nessuna utility sul campo e sul pulsante — le `!` di Tailwind batterebbero le regole
          .dt-ricerca_* di globals.css e coprirebbero la riga rossa disegnata. */}
      <Reveal>
        <div className="dt-ricerca_testa">
          <span className="eyebrow">{c.smartBadge}</span>
          <div className="dt-ricerca_riga mt-[clamp(0.5rem,1.6vh,1rem)]">
            <span className="dt-ricerca_campo">
              <input
                className="dt-ricerca_domanda"
                value={nl}
                onChange={(e) => setNl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void runSearch();
                  }
                }}
                placeholder={esempio}
                aria-label={c.nlAria}
                enterKeyHint="search"
                autoComplete="off"
              />
              <RigaScritta testo={esempio} fermo={!!nl} />
            </span>
            <button
              type="button"
              className="dt-ricerca_punto"
              // Il disco resta pieno anche mentre cerca: lo spinner è bianco, sull'anello vuoto sparirebbe.
              data-pieno={nl.trim() || searching ? "" : undefined}
              onClick={() => void runSearch()}
              disabled={searching || !nl.trim()}
              aria-label={c.searchAria}
            >
              {searching ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </button>
          </div>
          {/* Regione live: annuncia a screen reader il passaggio teaser → risultato/errore. */}
          <div role="status" aria-live="polite">
            {ai ? (
              <p className={`${stato} flex flex-wrap items-center gap-x-2 text-graphite lg:justify-center`}>
                <span>
                  {c.aiResultPrefix}: <span className="font-display text-[1.3125rem] italic text-ink">“{ai.query}”</span>
                </span>
                <button type="button" onClick={clearAi} className="inline-flex min-h-11 items-center text-ink underline underline-offset-2 hover:text-red-dark">
                  {c.aiClear}
                </button>
              </p>
            ) : aiError ? (
              <p className={`${stato} text-red-dark`}>{c.aiError}</p>
            ) : (
              <p className={`${stato} text-graphite`}>{c.teaser}</p>
            )}
          </div>
        </div>
      </Reveal>
      {/* Le cinque tendine in una riga: la zona per prima (è quella che restringe davvero, e2e search.spec). */}
      <Reveal delay={80} className="mt-[clamp(2rem,5vh,3.25rem)] grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-5 xl:gap-x-8">
        <Tendina label={c.zone} value={f.comune} onChange={(v) => setFilters((s) => ({ ...s, comune: v }))} options={comuni.map((z) => ({ value: z, label: z === "Tutti" ? c.zoneAll : z }))} attivo={f.comune !== "Tutti"} />
        <Tendina label={c.budget} value={String(f.maxBudget)} onChange={(v) => setFilters((s) => ({ ...s, maxBudget: Number(v) }))} options={budgetChoices.map((b) => ({ value: String(b.value), label: b.label }))} attivo={f.maxBudget !== 0} />
        <Tendina label={c.rooms} value={String(f.minRooms)} onChange={(v) => setFilters((s) => ({ ...s, minRooms: Number(v) }))} options={roomOptions.map((o) => ({ value: String(o.value), label: o.value === 0 ? c.roomsAny : o.label }))} attivo={f.minRooms !== 0} />
        <Tendina label={c.type} value={f.type} onChange={(v) => setFilters((s) => ({ ...s, type: v as PropertyFilters["type"] }))} options={types.map((t) => ({ value: t, label: (c.typeLabels as Record<string, string>)[t] ?? t }))} attivo={f.type !== "Tutte"} />
        <Tendina label={c.contract} value={f.contract} onChange={(v) => setFilters((s) => ({ ...s, contract: v as PropertyFilters["contract"] }))} options={(["Tutte", "Vendita", "Affitto"] as const).map((v) => ({ value: v, label: c.contractLabels[v] }))} attivo={f.contract !== "Tutte"} />
      </Reveal>
    </div>
  );
}

/**
 * La testa della ricerca da posare nel cielo della testa di /acquista (PageHero `cielo`, A80): dentro
 * RicercaProvider. Riga `dt-row` come la sezione; da lg un passo più corto in alto, perché la segue subito il
 * blocco dei comandi, e più lungo in basso, prima che la villa salga.
 */
export function SearchHead() {
  const r = useContext(RicercaContext);
  if (!r) throw new Error("SearchHead va montata dentro RicercaProvider (A48)");
  return (
    <div className="dt-row pt-[clamp(1.75rem,4vh,2.5rem)] pb-[clamp(1.5rem,4vh,2.5rem)] lg:pt-[clamp(0.5rem,2.5vh,1.75rem)] lg:pb-[clamp(1.5rem,4.5vh,3.25rem)]">
      <TestaRicerca r={r} />
    </div>
  );
}

export default function PropertySearch({ properties }: { properties: GridProperty[] }) {
  const ctx = useContext(RicercaContext);
  if (ctx) return <Risultati properties={properties} r={ctx} conTesta={false} />;
  return (
    <RicercaProvider properties={properties}>
      <DaSolo properties={properties} />
    </RicercaProvider>
  );
}

function DaSolo({ properties }: { properties: GridProperty[] }) {
  const r = useContext(RicercaContext);
  if (!r) return null;
  return <Risultati properties={properties} r={r} conTesta />;
}

/** I filtri e i risultati (sulla carta); con `conTesta` anche la testa della ricerca in sezione. */
function Risultati({ properties, r, conTesta }: { properties: GridProperty[]; r: Ricerca; conTesta: boolean }) {
  const { locale } = useLocale();
  const c = copy[locale];
  const { nl, f, setFilters, searching, ai, resetFilters, filtersActive, gridRef, flipStateRef, money } = r;
  const [visible, setVisible] = useState(24);
  // Vista risultati: elenco card oppure mappa dei comuni con immobili disponibili.
  const [view, setView] = useState<"list" | "map">("list");
  // Anteprima (CaseQuickLook): stato UI indipendente dalla ricerca.
  const [preview, setPreview] = useState<GridProperty | null>(null);

  const bySlug = useMemo(() => new Map(properties.map((p) => [p.slug, p])), [properties]);

  // Al cambio filtri (o risultato AI) riparti dalle prime 24 case.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setVisible(24);
  }, [f, ai]);

  // Aggregazione per comune usata dalla mappa: indipendente dai filtri attivi, così la
  // mappa resta una panoramica di tutto il disponibile anche mentre l'elenco è filtrato.
  const townGroups = useMemo(() => groupAvailableByTown(properties), [properties]);

  const shown = useMemo(() => {
    // Modalità AI: mostra gli immobili nell'ordine di rilevanza deciso dal server.
    if (ai) {
      return ai.slugs.map((s) => bySlug.get(s)).filter((p): p is GridProperty => !!p);
    }
    return properties.filter((p) => {
      // Disponibilità: di default nascondi i venduti; "Venduti" mostra solo quelli.
      // Predicato unico condiviso con la home, la mappa e la ricerca server (lib/availability).
      if (f.availability === "available" && !isAvailable(p)) return false;
      if (f.availability === "sold" && !isSold(p)) return false;
      if (f.contract !== "Tutte" && p.status !== f.contract) return false;
      if (f.type !== "Tutte" && p.type !== f.type) return false;
      if (f.comune !== "Tutti" && !matchesComune(p.zone, f.comune)) return false;
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

  // Card renderizzate (paginazione inclusa) + firma stabile: il FLIP parte solo
  // quando la lista visibile cambia davvero.
  const listed = shown.slice(0, visible);
  const listedKey = listed.map((p) => p.slug).join("|");

  // FLIP post-render: dal layout catturato al nuovo ordine (key stabili = slug →
  // i nodi persistenti restano gli stessi e Flip li abbina per identità).
  useLayoutEffect(() => {
    const state = flipStateRef.current;
    flipStateRef.current = null;
    const grid = gridRef.current;
    // La lista cambia l'altezza della pagina: gli ScrollTrigger globali (tarati
    // su maxScroll) vanno ricalibrati a layout assestato — mai a metà Flip (absolute:true = card fuori flusso).
    const refresh = () => requestAnimationFrame(() => ScrollTrigger.refresh());
    if (!state || !grid) {
      refresh();
      return;
    }
    const tl = Flip.from(state, {
      // targets espliciti: le card appena montate non sono nello stato catturato
      // e senza questo onEnter non le vedrebbe.
      targets: grid.children,
      duration: dur.short,
      ease: "domus",
      stagger: 0.02,
      absolute: true,
      onComplete: refresh,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, scale: 0.94 },
          { opacity: 1, scale: 1, duration: dur.short, ease: "domus" }
        ),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.25 }),
    });
    return () => {
      // Interruzione (nuovo filtro mid-flight): completare prima di uccidere
      // ripulisce i transform/position:absolute di Flip, altrimenti il flip
      // successivo misurerebbe un layout "congelato" a metà.
      if (tl.isActive()) tl.progress(1);
      tl.kill();
    };
    // I due ref vengono dal provider (A48): identità stabili, stanno nelle dipendenze per la regola.
  }, [listedKey, flipStateRef, gridRef]);

  // Lista ⇄ mappa cambia l'altezza della pagina in un colpo solo: senza refresh i
  // ScrollTrigger globali (tarati su maxScroll) restano tarati sul layout vecchio.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [view]);

  // Ingresso per-card della griglia. Sostituisce i <Reveal> per card: il loro
  // transition CSS (.reveal) combatterebbe i transform inline del FLIP.
  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const cards = gsap.utils.toArray<HTMLElement>(grid.children);
        if (!cards.length) return;
        // Nascoste solo post-idratazione: HTML iniziale completo (SEO/no-JS).
        gsap.set(cards, { opacity: 0 });
        // Replay a ogni passaggio (richiesta cliente) ma SOLO opacity: le card
        // sono link cliccabili e un transform che le sposta durante lo scroll
        // fa mancare il click (regressione e2e "filtro comune"); il movimento
        // qui lo fa già il FLIP dei filtri. overwrite: gli scroll rapidi
        // su/giù non accavallano i tween.
        let entered = false;
        const triggers = ScrollTrigger.batch(cards, {
          start: "top 85%",
          onEnter: (els) => {
            entered = true;
            gsap.to(els, {
              opacity: 1,
              duration: dur.short,
              ease: "domus",
              stagger: stagger.cards / 2,
              overwrite: true,
            });
          },
          onLeaveBack: (els) =>
            gsap.to(els, {
              opacity: 0,
              duration: dur.short,
              ease: "domus",
              overwrite: true,
            }),
        });
        // Le card contengono link: reti di sicurezza come Reveal. Il focus da
        // tastiera rivela subito tutto; il timeout interviene solo se il batch
        // non è mai scattato (con il replay le card possono tornare nascoste
        // di proposito).
        let done = false;
        const showAll = () => {
          if (done) return;
          done = true;
          triggers.forEach((t) => t.kill());
          // Non toccare card già in tween (entrance o Flip in corso): arrivano
          // da sole allo stato finale. Le altre vengono rivelate subito.
          gsap.set(cards.filter((el) => !gsap.isTweening(el)), { clearProps: "opacity,transform" });
        };
        grid.addEventListener("focusin", showAll);
        const safety = window.setTimeout(() => {
          if (!entered) showAll();
        }, 2500);
        return () => {
          grid.removeEventListener("focusin", showAll);
          window.clearTimeout(safety);
        };
      });
    },
    { scope: gridRef }
  );

  const toggleFeature = (label: string) =>
    setFilters((s) => ({
      ...s,
      features: s.features.includes(label)
        ? s.features.filter((x) => x !== label)
        : [...s.features, label],
    }));

  // Gli affinamenti sopra i risultati (A52): chip di testo come quelli del modulo (DESIGN.md «Chips»):
  // etichetta maiuscola 1rem 600, riga sotto di 2 px rossa quando selezionato, inchiostro all'hover.
  const tab = (active: boolean) =>
    `inline-flex min-h-11 items-center border-b-2 pb-0.5 text-ui font-semibold uppercase tracking-[0.08em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
      active ? "border-red text-ink" : "border-transparent text-stone hover:text-ink"
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
      <div className="dt-row py-16 sm:py-20">
        {conTesta && <TestaRicerca r={r} />}

        {/* Affinamenti (A52): le caratteristiche e i venduti restano sulla carta, sopra i risultati. */}
        <Reveal delay={80} className={`${conTesta ? "mt-12 " : ""}flex flex-wrap items-center gap-x-10 gap-y-4`}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="mr-1 text-ui font-semibold uppercase tracking-[0.08em] text-stone">{c.features}</span>
            {featureOptions.map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={f.features.includes(o.label)}
                onClick={() => toggleFeature(o.label)}
                className={tab(f.features.includes(o.label))}
              >
                {c.featureLabels[o.label] ?? o.label}
              </button>
            ))}
          </div>
          {/* Disponibilità: appare solo se c'è almeno un immobile venduto (default: nasconde i venduti). */}
          {properties.some(isSold) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="mr-1 text-ui font-semibold uppercase tracking-[0.08em] text-stone">{c.availabilityLabel}</span>
              {(["available", "sold"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={f.availability === v}
                  onClick={() => setFilters((s) => ({ ...s, availability: v }))}
                  className={tab(f.availability === v)}
                >
                  {v === "available" ? c.availAvailable : c.availSold}
                </button>
              ))}
            </div>
          )}
        </Reveal>

        {/* Risultati */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-body text-graphite">
              <span className="font-semibold text-ink">{shown.length}</span>{" "}
              {shown.length === 1 ? c.resultsOne : c.resultsMany}
            </p>
            {f.minBudget > 0 && (
              <button
                type="button"
                onClick={() => setFilters((s) => ({ ...s, minBudget: 0 }))}
                aria-label={c.priceRemove}
                className="inline-flex min-h-11 items-center gap-1.5 border border-red px-3 py-1 text-ui font-semibold uppercase tracking-[0.08em] text-red-dark transition-colors duration-300 hover:bg-red hover:text-white"
              >
                {c.priceFrom} {money(f.minBudget)} €<span aria-hidden>×</span>
              </button>
            )}
            {f.minSqm > 0 && (
              <button
                type="button"
                onClick={() => setFilters((s) => ({ ...s, minSqm: 0 }))}
                aria-label={`${c.remove}: ${c.priceFrom} ${f.minSqm} m²`}
                className="inline-flex min-h-11 items-center gap-1.5 border border-red px-3 py-1 text-ui font-semibold uppercase tracking-[0.08em] text-red-dark transition-colors duration-300 hover:bg-red hover:text-white"
              >
                {c.priceFrom} {f.minSqm} m²<span aria-hidden>×</span>
              </button>
            )}
            {f.maxSqm > 0 && (
              <button
                type="button"
                onClick={() => setFilters((s) => ({ ...s, maxSqm: 0 }))}
                aria-label={`${c.remove}: ${c.budgetUpTo} ${f.maxSqm} m²`}
                className="inline-flex min-h-11 items-center gap-1.5 border border-red px-3 py-1 text-ui font-semibold uppercase tracking-[0.08em] text-red-dark transition-colors duration-300 hover:bg-red hover:text-white"
              >
                {c.budgetUpTo} {f.maxSqm} m²<span aria-hidden>×</span>
              </button>
            )}
            {!ai && filtersActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-ui font-semibold uppercase tracking-[0.08em] text-stone underline underline-offset-4 transition-colors duration-300 hover:text-ink"
              >
                {c.manualReset}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle Lista / Mappa */}
            <div
              role="group"
              aria-label={`${c.viewList} / ${c.viewMap}`}
              className="flex border border-line"
            >
              {(["list", "map"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  // min-h-11 = 44px: la soglia di tocco. Senza, il toggle era alto 31px —
                  // il comando più piccolo della pagina, e quello che si usa di più.
                  className={`inline-flex min-h-11 items-center justify-center px-4 text-ui font-semibold uppercase tracking-[0.08em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                    view === v ? "bg-red text-white" : "text-graphite hover:text-ink"
                  }`}
                >
                  {v === "list" ? c.viewList : c.viewMap}
                </button>
              ))}
            </div>
            <a
              href="#contatti"
              className="group hidden items-center gap-1.5 text-ui font-semibold uppercase tracking-[0.08em] text-red underline underline-offset-4 hover:text-red-dark sm:inline-flex"
            >
              {c.notFound}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {view === "map" ? (
          <div className="mt-6">
            <PropertyMap
              groups={townGroups}
              activeKey={f.comune !== "Tutti" ? f.comune : undefined}
              onSelect={(key) => {
                setFilters((s) => ({ ...s, comune: key }));
                setView("list");
              }}
            />
          </div>
        ) : shown.length > 0 ? (
          <>
            {/* Titolo della griglia per chi naviga a salti fra le intestazioni: senza, i titoli
                delle schede (h3) seguono l'h1 della pagina e la gerarchia salta un livello. */}
            <h2 className="sr-only">{c.resultsHeading}</h2>
            <div
              ref={gridRef}
              aria-busy={searching}
              className={`mt-10 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3 ${
                searching ? "opacity-50 transition-opacity duration-300" : "transition-opacity duration-300"
              }`}
            >
              {listed.map((p) => (
                // Wrapper neutro con key stabile (slug): FLIP ed entrance animano
                // questo div, mai la card (il suo transition-all per l'hover
                // combatterebbe i transform inline di GSAP).
                <div key={p.slug}>
                  <PropertyCard p={p} onQuickLook={() => setPreview(p)} />
                </div>
              ))}
            </div>
            {visible < shown.length && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <CtaButton
                  type="button"
                  variant="ghost"
                  size="md"
                  arrow={false}
                  onClick={() => setVisible((v) => v + 24)}
                >
                  {c.showMore}
                </CtaButton>
                <p className="text-ui text-graphite">
                  {c.showingHint
                    .replace("{n}", String(Math.min(visible, shown.length)))
                    .replace("{tot}", String(shown.length))}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="mt-10 border-t border-line pt-10">
            <p className="max-w-[20ch] font-display text-d2 uppercase text-ink">{c.emptyTitle}</p>
            <p className="lead mt-6">{c.emptyBody}</p>
            {/* CTA a intento acquirente su WhatsApp, precompilato con la frase cercata. */}
            <Cta
              href={buyerWaUrl}
              variant="cta"
              size="md"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6"
            >
              {c.emptyCta}
            </Cta>
          </div>
        )}
      </div>

      {/* Anteprima espansa: la foto della card vola nel foglio (GSAP Flip). */}
      <CaseQuickLook property={preview} onClose={() => setPreview(null)} />
    </section>
  );
}
