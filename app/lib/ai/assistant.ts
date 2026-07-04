// Assistente conversazionale: loop con lo strumento search_listings (Claude).
// Difensivo: mai throw verso la route. Senza ANTHROPIC_API_KEY ritorna un messaggio di cortesia.

import { ANTHROPIC_API_KEY, aiParseEnabled } from "./config";
import { getVisibleListings } from "../listings";
import type { Property } from "../properties";
import { parseQuery } from "./parseQuery";
import { applyFilters, rankResults } from "./rank";
import { buildAssistantSystem } from "./knowledge";
import type { FeatureLabel, SearchFacets } from "./types";
import type { Locale } from "../i18n/dictionaries";

const ASSISTANT_MODEL = process.env.AI_ASSISTANT_MODEL || "claude-haiku-4-5-20251001";
const MAX_TOOL_ROUNDS = 3;
const RESULTS_PER_SEARCH = 6;

/** Riepilogo immobile mostrato all'utente (card) e passato al modello come tool_result. */
export type ListingCard = {
  slug: string;
  title: string;
  zone: string;
  price: string;
  type: string;
  url: string;
  cover: string;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AssistantReply = { reply: string; listings: ListingCard[] };

const FEATURE_LABELS: FeatureLabel[] = ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"];

const SEARCH_TOOL = {
  name: "search_listings",
  description:
    "Cerca gli immobili in vendita/affitto dell'agenzia a partire da una richiesta in linguaggio naturale. Usalo ogni volta che l'utente cerca casa o chiede immobili con certe caratteristiche.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description:
          "La richiesta in linguaggio naturale, es. 'trilocale con giardino a Tradate sotto 250000 euro' oppure 'villa luminosa con piscina'.",
      },
    },
    required: ["query"],
  },
};

function toCard(p: Property): ListingCard {
  return {
    slug: p.slug,
    title: p.title,
    zone: p.zone,
    price: p.price,
    type: p.type,
    url: `/case/${p.slug}`,
    cover: p.cover,
  };
}

type Block = { type: string; text?: string; id?: string; name?: string; input?: unknown };

/** Una chiamata al modello. Ritorna i blocchi di contenuto, o null su errore. */
async function callClaude(
  system: string,
  messages: unknown[],
): Promise<{ content: Block[]; stop_reason?: string } | null> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        max_tokens: 1024,
        system,
        tools: [SEARCH_TOOL],
        messages,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    return (await res.json()) as { content: Block[]; stop_reason?: string };
  } catch {
    return null;
  }
}

const FALLBACK: Record<string, string> = {
  it: "Al momento l'assistente non è attivo. Puoi usare i filtri di ricerca qui sopra, scriverci su WhatsApp o chiamarci: siamo felici di aiutarti.",
  en: "The assistant is not active right now. You can use the search filters above, message us on WhatsApp or call us: we’re happy to help.",
  fr: "L’assistant n’est pas actif pour le moment. Utilisez les filtres ci-dessus, écrivez-nous sur WhatsApp ou appelez-nous : nous serons ravis de vous aider.",
  de: "Der Assistent ist derzeit nicht aktiv. Nutzen Sie die Filter oben, schreiben Sie uns auf WhatsApp oder rufen Sie an: Wir helfen gerne.",
  es: "El asistente no está activo por ahora. Usa los filtros de arriba, escríbenos por WhatsApp o llámanos: estaremos encantados de ayudarte.",
};

/**
 * Esegue una risposta dell'assistente sulla base della cronologia.
 * Gestisce il loop degli strumenti (search_listings) fino a MAX_TOOL_ROUNDS.
 */
export async function runAssistant(history: ChatMessage[], locale: Locale): Promise<AssistantReply> {
  if (!aiParseEnabled) {
    return { reply: FALLBACK[locale] || FALLBACK.it, listings: [] };
  }

  const listings = await getVisibleListings();
  const bySlug = new Map(listings.map((p) => [p.slug, p]));
  const comuni = [
    "Tutti",
    ...Array.from(new Set(listings.map((p) => p.zone.split(",")[0].trim())))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "it")),
  ];
  const facets: SearchFacets = {
    comuni,
    types: ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"],
    featureLabels: FEATURE_LABELS,
  };

  const system = buildAssistantSystem(locale);
  // Cronologia limitata (ultimi 12 turni) per contenere costo/latenza.
  const messages: unknown[] = history.slice(-12).map((m) => ({ role: m.role, content: m.content }));

  let lastListings: ListingCard[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await callClaude(system, messages);
    if (!res) return { reply: FALLBACK[locale] || FALLBACK.it, listings: lastListings };

    const toolUses = res.content.filter((b) => b.type === "tool_use");
    if (toolUses.length === 0) {
      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => b.text || "")
        .join("\n")
        .trim();
      return { reply: text, listings: lastListings };
    }

    // Turno assistant con i blocchi tool_use, seguito dai tool_result.
    messages.push({ role: "assistant", content: res.content });
    const toolResults: unknown[] = [];
    for (const tu of toolUses) {
      let cards: ListingCard[] = [];
      if (tu.name === "search_listings") {
        const q = typeof (tu.input as { query?: unknown })?.query === "string"
          ? (tu.input as { query: string }).query
          : "";
        if (q) {
          const { filters } = await parseQuery(q, facets);
          const candidates = applyFilters(listings, filters);
          const { slugs } = await rankResults(candidates, filters);
          cards = slugs
            .slice(0, RESULTS_PER_SEARCH)
            .map((s) => bySlug.get(s))
            .filter((p): p is Property => !!p)
            .map(toCard);
        }
      }
      if (cards.length) lastListings = cards;
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(
          cards.map((c) => ({ title: c.title, zone: c.zone, price: c.price, type: c.type })),
        ),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  // Superati i round: chiedi una risposta finale senza strumenti.
  const finalRes = await callClaude(system, messages);
  const text = finalRes?.content
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("\n")
    .trim();
  return { reply: text || (FALLBACK[locale] || FALLBACK.it), listings: lastListings };
}
