// Strumenti dell'assistente — definizioni tipizzate + esecuzione deterministica.
//
// Ogni strumento è la SOLA via con cui l'assistente può ottenere un dato: prezzi, immobili,
// contenuti sull'agenzia, canali di contatto. Il modello non ha altra fonte, quindi ciò che
// non passa da qui non può finire in una risposta.
//
// Tre garanzie, verificate dai test:
//  1. **Nessun venduto tra i disponibili.** La ricerca passa da applyFilters, che filtra sulla
//     disponibilità (app/lib/availability.ts), e i dettagli rifiutano un immobile non
//     disponibile invece di descriverlo.
//  2. **Input validati a mano, prima dell'esecuzione.** Il modello può produrre qualsiasi
//     JSON: ogni strumento controlla forma, tipi e limiti e, se non torna, risponde con un
//     errore leggibile invece di eseguire su valori arbitrari.
//  3. **Nessun invio.** Gli strumenti di contatto PREPARANO un collegamento (link WhatsApp,
//     indirizzo email, URL del form). Non spediscono niente: il consenso privacy si dà nel
//     form, non in chat.

import type Anthropic from "@anthropic-ai/sdk";
import { getVisibleListings } from "../listings";
import { comuniFacet } from "../comune";
import { isAvailable, isSold } from "../availability";
import { site, siteUrl } from "../site";
import { buyerSearchWhatsAppUrl, listingWhatsAppUrl } from "../forms/whatsapp";
import { retrieveVerifiedKnowledge } from "./knowledge";
import { parseQuery } from "./parseQuery";
import { applyFilters, rankResults } from "./rank";
import type { FeatureLabel, SearchFacets } from "./types";
import type { Property } from "../properties";

/** Massimo di immobili mostrati in una risposta: oltre, la chat diventa un listino. */
export const MAX_RESULTS = 4;

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

/** Esito di uno strumento: testo per il modello + eventuali card per l'interfaccia. */
export type ToolOutcome = {
  /** Contenuto del tool_result. Sempre una stringa: nessun oggetto opaco al modello. */
  content: string;
  /** Card da mostrare sotto la risposta. Solo la ricerca e i dettagli le producono. */
  listings?: ListingCard[];
  isError?: boolean;
};

const FEATURE_LABELS: FeatureLabel[] = ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"];

// ── Definizioni passate al modello ──────────────────────────────────────────────────────

export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_listings",
    description:
      "Cerca gli immobili DISPONIBILI dell'agenzia da una richiesta in linguaggio naturale. Usalo ogni volta che si parla di case da comprare o affittare. Restituisce solo immobili realmente in vendita: i venduti sono esclusi.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "La richiesta in linguaggio naturale, es. 'trilocale con giardino a Tradate sotto 250000 euro'.",
        },
        max_results: {
          type: "integer",
          description: `Quanti immobili restituire, da 1 a ${MAX_RESULTS}. Default ${MAX_RESULTS}.`,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_listing_details",
    description:
      "Dettagli di un immobile già trovato con search_listings. Usa lo slug esatto restituito dalla ricerca. Serve per rispondere su metratura, locali, bagni, piano, classe energetica, dotazioni.",
    input_schema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Lo slug dell'immobile, come restituito dalla ricerca." },
      },
      required: ["slug"],
    },
  },
  {
    name: "retrieve_verified_knowledge",
    description:
      "Contenuti VERIFICATI su Domus Tua: agenzia, contatti, orari, recensioni, Domus D.O.C., servizi, Open Domus, metodo di vendita, valutazione. Usalo per ogni domanda sull'agenzia. Se il tema non è nel materiale verificato lo dice: in quel caso ammettilo, non rispondere a memoria.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "Il tema da cercare, es. 'domus-doc', 'open-domus', 'orari', 'valutazione', 'metodo-vendita'.",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "prepare_whatsapp_handoff",
    description:
      "Prepara il collegamento WhatsApp verso l'agenzia, con il messaggio già scritto. NON invia nulla: restituisce il link, che apre la persona. Usalo quando qualcuno vuole parlare con il team, prenotare una visita o chiedere informazioni su un immobile.",
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: ["cerco-casa", "vendere", "visita", "informazioni"],
          description: "Il motivo del contatto.",
        },
        listing_slug: {
          type: "string",
          description: "Slug dell'immobile, se il contatto riguarda un annuncio preciso.",
        },
      },
      required: ["reason"],
    },
  },
  {
    name: "prepare_email_handoff",
    description:
      "Prepara il contatto via email o form. NON invia nulla: la richiesta la manda la persona dal form del sito, dove dà il consenso privacy. Usalo per valutazioni, richieste di vendita e domande che richiedono una risposta scritta.",
    input_schema: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          enum: ["seller", "buyer", "question", "open-domus"],
          description: "Il tipo di richiesta.",
        },
        listing_slug: {
          type: "string",
          description: "Slug dell'immobile, se la richiesta riguarda un annuncio preciso.",
        },
      },
      required: ["intent"],
    },
  },
];

export const TOOL_NAMES = ASSISTANT_TOOLS.map((t) => t.name);

// ── Validazione degli input ─────────────────────────────────────────────────────────────
// Il modello può produrre qualunque JSON. Validiamo forma, tipi e limiti PRIMA di eseguire.

type Valid<T> = { ok: true; value: T } | { ok: false; error: string };

function readString(input: unknown, key: string, maxLen: number): Valid<string> {
  if (!input || typeof input !== "object") return { ok: false, error: "input non valido" };
  const raw = (input as Record<string, unknown>)[key];
  if (typeof raw !== "string") return { ok: false, error: `"${key}" mancante o non testuale` };
  const value = raw.trim().slice(0, maxLen);
  if (!value) return { ok: false, error: `"${key}" vuoto` };
  return { ok: true, value };
}

function readEnum<T extends string>(input: unknown, key: string, allowed: readonly T[]): Valid<T> {
  const s = readString(input, key, 40);
  if (!s.ok) return s;
  const found = allowed.find((a) => a === s.value);
  if (!found) return { ok: false, error: `"${key}" deve essere uno di: ${allowed.join(", ")}` };
  return { ok: true, value: found };
}

function readOptionalString(input: unknown, key: string, maxLen: number): string | undefined {
  const s = readString(input, key, maxLen);
  return s.ok ? s.value : undefined;
}

// ── Esecuzione ──────────────────────────────────────────────────────────────────────────

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

/** Contesto condiviso da tutti gli strumenti in un turno: gli immobili si caricano una volta. */
export type ToolContext = {
  listings: Property[];
  bySlug: Map<string, Property>;
  facets: SearchFacets;
};

export async function buildToolContext(): Promise<ToolContext> {
  const listings = await getVisibleListings();
  return {
    listings,
    bySlug: new Map(listings.map((p) => [p.slug, p])),
    facets: {
      comuni: comuniFacet(listings), // nomi puliti, senza "(VA)": vedi app/lib/comune.ts
      types: ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"],
      featureLabels: FEATURE_LABELS,
    },
  };
}

async function searchListings(input: unknown, ctx: ToolContext): Promise<ToolOutcome> {
  const query = readString(input, "query", 300);
  if (!query.ok) return { content: `Errore: ${query.error}.`, isError: true };

  const rawMax = (input as Record<string, unknown>)?.max_results;
  const max =
    typeof rawMax === "number" && Number.isFinite(rawMax)
      ? Math.min(Math.max(Math.trunc(rawMax), 1), MAX_RESULTS)
      : MAX_RESULTS;

  const { filters } = await parseQuery(query.value, ctx.facets);
  // applyFilters esclude i venduti (app/lib/ai/rank.ts → isAvailable).
  const candidates = applyFilters(ctx.listings, filters);
  const { slugs } = await rankResults(candidates, filters);
  const cards = slugs
    .slice(0, max)
    .map((s) => ctx.bySlug.get(s))
    .filter((p): p is Property => !!p && isAvailable(p))
    .map(toCard);

  if (cards.length === 0) {
    return {
      content:
        "Nessun immobile disponibile corrisponde alla richiesta. Non inventare alternative: " +
        "spiega che al momento non c'è nulla, proponi UN allargamento sensato (un comune vicino " +
        "o un budget leggermente più alto) e offri il contatto con il team.",
      listings: [],
    };
  }

  return {
    content: JSON.stringify(
      cards.map((c) => ({ slug: c.slug, title: c.title, zone: c.zone, price: c.price, type: c.type })),
    ),
    listings: cards,
  };
}

function getListingDetails(input: unknown, ctx: ToolContext): ToolOutcome {
  const slug = readString(input, "slug", 160);
  if (!slug.ok) return { content: `Errore: ${slug.error}.`, isError: true };

  const p = ctx.bySlug.get(slug.value);
  if (!p) {
    return {
      content:
        "Nessun immobile con questo slug. Usa solo gli slug restituiti da search_listings; " +
        "non descrivere immobili che non hai trovato.",
      isError: true,
    };
  }
  if (isSold(p)) {
    return {
      content:
        "Questo immobile risulta VENDUTO: non presentarlo come disponibile. Puoi dire che è " +
        "stato venduto e proporre una nuova ricerca su immobili simili.",
      isError: true,
    };
  }

  const amenityLabel = (v: boolean | undefined) =>
    v === true ? "sì" : v === false ? "no" : "informazione non disponibile";

  return {
    content: JSON.stringify({
      slug: p.slug,
      titolo: p.title,
      zona: p.zone,
      prezzo: p.price,
      contratto: p.status,
      tipologia: p.type,
      superficie: p.sqm,
      locali: p.rooms,
      camere: p.beds,
      bagni: p.baths,
      piano: p.floor ?? "informazione non disponibile",
      stato: p.condition ?? "informazione non disponibile",
      classeEnergetica: p.energyClass ?? p.energyClassStatus ?? "informazione non disponibile",
      ascensore: amenityLabel(p.amenities?.elevator),
      giardino: amenityLabel(p.amenities?.garden),
      terrazzo: amenityLabel(p.amenities?.terrace),
      boxPostoAuto: amenityLabel(p.amenities?.parking),
      caratteristiche: p.features,
      riferimento: p.ref ?? "informazione non disponibile",
    }),
    listings: [toCard(p)],
  };
}

function knowledgeTool(input: unknown): ToolOutcome {
  const topic = readString(input, "topic", 120);
  if (!topic.ok) return { content: `Errore: ${topic.error}.`, isError: true };

  const hit = retrieveVerifiedKnowledge(topic.value);
  if (!hit.found) {
    return {
      content: JSON.stringify({
        found: false,
        message:
          "Nessun contenuto verificato su questo tema. Dillo con onestà e proponi di parlare " +
          "col team: non rispondere con conoscenza generica.",
        temiDisponibili: hit.available,
      }),
    };
  }
  return {
    content: JSON.stringify({ found: true, topic: hit.topic, testo: hit.text, fonte: hit.source }),
  };
}

const WHATSAPP_REASONS = ["cerco-casa", "vendere", "visita", "informazioni"] as const;

function whatsappHandoff(input: unknown, ctx: ToolContext): ToolOutcome {
  const reason = readEnum(input, "reason", WHATSAPP_REASONS);
  if (!reason.ok) return { content: `Errore: ${reason.error}.`, isError: true };

  const slug = readOptionalString(input, "listing_slug", 160);
  const listing = slug ? ctx.bySlug.get(slug) : undefined;

  // Il link a un immobile lo produciamo solo se l'immobile esiste ed è disponibile.
  const url =
    listing && isAvailable(listing)
      ? listingWhatsAppUrl({ slug: listing.slug, title: listing.title, ref: listing.ref })
      : buyerSearchWhatsAppUrl(reason.value === "cerco-casa" ? undefined : reason.value);

  return {
    content: JSON.stringify({
      canale: "whatsapp",
      numero: site.whatsapp.label,
      url,
      inviato: false,
      nota:
        "Il messaggio NON è stato inviato: questo è solo il collegamento, lo apre la persona. " +
        "Dille che può scrivere su WhatsApp, senza affermare che il messaggio è partito.",
    }),
  };
}

const EMAIL_INTENTS = ["seller", "buyer", "question", "open-domus"] as const;

function emailHandoff(input: unknown, ctx: ToolContext): ToolOutcome {
  const intent = readEnum(input, "intent", EMAIL_INTENTS);
  if (!intent.ok) return { content: `Errore: ${intent.error}.`, isError: true };

  const slug = readOptionalString(input, "listing_slug", 160);
  const listing = slug ? ctx.bySlug.get(slug) : undefined;

  return {
    content: JSON.stringify({
      canale: "email",
      email: site.email.label,
      telefono: site.phone.label,
      // Dalla scheda immobile il form parte già col contesto giusto; altrimenti /contatti.
      form:
        listing && isAvailable(listing)
          ? `${siteUrl}/case/${listing.slug}#contatti`
          : `${siteUrl}/contatti`,
      intent: intent.value,
      inviato: false,
      nota:
        "Nessuna email è stata inviata. La richiesta la manda la persona dal form del sito, " +
        "dove dà il consenso privacy. Invitala a compilarlo, oppure a scrivere o telefonare.",
    }),
  };
}

/**
 * Esegue uno strumento. Non lancia mai: un errore diventa un tool_result leggibile, così il
 * modello può correggersi invece di far cadere il turno.
 */
export async function runTool(
  name: string,
  input: unknown,
  ctx: ToolContext,
): Promise<ToolOutcome> {
  try {
    switch (name) {
      case "search_listings":
        return await searchListings(input, ctx);
      case "get_listing_details":
        return getListingDetails(input, ctx);
      case "retrieve_verified_knowledge":
        return knowledgeTool(input);
      case "prepare_whatsapp_handoff":
        return whatsappHandoff(input, ctx);
      case "prepare_email_handoff":
        return emailHandoff(input, ctx);
      default:
        return { content: `Strumento sconosciuto: ${name}.`, isError: true };
    }
  } catch (err) {
    // Il motivo tecnico resta nei log del server, mai nel tool_result.
    console.error(`[assistant] strumento ${name} fallito:`, err instanceof Error ? err.message : err);
    return {
      content: "Lo strumento non è disponibile in questo momento. Proponi il contatto umano.",
      isError: true,
    };
  }
}
