// Parsing della frase in linguaggio naturale -> filtri strutturati (ParsedSearch).
//
// Due percorsi:
//  - AI (Claude Haiku) se ANTHROPIC_API_KEY è presente: comprende sinonimi, dialetto, "vibe".
//  - Locale (euristica deterministica) come fallback: nessuna chiave, funziona sempre.
// Entrambi sono difensivi: mai throw verso il chiamante (la route decide il fallback).

import { ANTHROPIC_API_KEY, AI_SEARCH_MODEL, aiParseEnabled } from "./config";
import type { FeatureLabel, ParsedSearch, SearchFacets } from "./types";

const TYPES = ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"] as const;

// Mappa parola chiave -> caratteristica (per il parser locale).
const FEATURE_KEYWORDS: Record<FeatureLabel, string[]> = {
  Giardino: ["giardino", "giardin"],
  "Box / posto auto": ["box", "posto auto", "garage", "autorimessa"],
  Terrazzo: ["terrazzo", "terrazza", "terrazz"],
  "Doppi servizi": ["doppi servizi", "due bagni", "2 bagni", "secondo bagno"],
};

// Parole -> tipologia (parser locale).
const TYPE_KEYWORDS: Record<string, (typeof TYPES)[number]> = {
  attico: "Attico",
  mansarda: "Attico",
  villa: "Villa",
  villetta: "Villa",
  schiera: "Villa",
  rustico: "Villa",
  casa: "Villa",
  terreno: "Terreno",
  terreni: "Terreno",
  negozio: "Commerciale",
  ufficio: "Commerciale",
  capannone: "Commerciale",
  commerciale: "Commerciale",
  laboratorio: "Commerciale",
  appartamento: "Appartamento",
  bilocale: "Appartamento",
  trilocale: "Appartamento",
  quadrilocale: "Appartamento",
  monolocale: "Appartamento",
};

const ROOM_WORDS: Record<string, number> = {
  monolocale: 1,
  bilocale: 2,
  trilocale: 3,
  quadrilocale: 4,
  cinque: 5,
};

/** Estrae un tetto di prezzo da testo tipo "250mila", "250.000", "250k", "fino a 300 mila €". */
function parseBudget(q: string): number | undefined {
  const s = q.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  // "250 mila" / "250mila" / "250k"
  const mila = s.match(/(\d{1,4})\s*(mila|k)\b/);
  if (mila) return parseInt(mila[1], 10) * 1000;
  // numero "grande" esplicito (>= 10.000)
  const big = s.match(/(\d{5,7})\s*(?:€|euro)?/);
  if (big) {
    const n = parseInt(big[1], 10);
    if (n >= 10000) return n;
  }
  return undefined;
}

/** Parser locale deterministico: nessuna chiave richiesta. */
export function parseQueryLocal(query: string, facets: SearchFacets): ParsedSearch {
  const q = query.toLowerCase();
  const out: ParsedSearch = {};

  // Contratto
  if (/\baffitt|\blocazion|\bin affitto\b/.test(q)) out.contract = "Affitto";
  else if (/\bvend|\bacquist|\bcompr/.test(q)) out.contract = "Vendita";

  // Tipologia (prima corrispondenza)
  for (const [word, type] of Object.entries(TYPE_KEYWORDS)) {
    if (q.includes(word)) {
      out.type = type;
      break;
    }
  }

  // Comune: cerca il nome di un comune disponibile dentro la frase
  const comune = facets.comuni.find((c) => c !== "Tutti" && q.includes(c.toLowerCase()));
  if (comune) out.comune = comune;

  // Budget
  const budget = parseBudget(q);
  if (budget) out.maxBudget = budget;

  // Locali: parole (bilocale...) o "N locali"
  for (const [word, n] of Object.entries(ROOM_WORDS)) {
    if (q.includes(word)) {
      out.minRooms = n;
      break;
    }
  }
  const nLocali = q.match(/(\d)\s*locali/);
  if (nLocali) out.minRooms = parseInt(nLocali[1], 10);

  // Caratteristiche
  const features = (Object.keys(FEATURE_KEYWORDS) as FeatureLabel[]).filter((label) =>
    FEATURE_KEYWORDS[label].some((kw) => q.includes(kw)),
  );
  if (features.length) out.features = features;

  // La frase intera resta come query semantica; parole >3 lettere come keyword.
  out.semanticQuery = query.trim();
  out.keywords = Array.from(
    new Set(q.split(/[^a-zàèéìòù]+/i).filter((w) => w.length > 3)),
  ).slice(0, 12);

  return out;
}

// ── Percorso AI (Claude Haiku via fetch, structured output con tool use) ──────

const SET_FILTERS_TOOL = {
  name: "set_filters",
  description: "Imposta i filtri di ricerca immobiliare estratti dalla richiesta dell'utente.",
  input_schema: {
    type: "object" as const,
    properties: {
      contract: { type: "string", enum: ["Tutte", "Vendita", "Affitto"] },
      type: { type: "string", enum: ["Tutte", ...TYPES] },
      comune: { type: "string", description: "Uno dei comuni disponibili forniti, oppure ometti." },
      maxBudget: { type: "number", description: "Tetto di prezzo in euro, 0 se non indicato." },
      minRooms: { type: "number", description: "Numero minimo di locali, 0 se non indicato." },
      features: { type: "array", items: { type: "string", enum: ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"] } },
      keywords: { type: "array", items: { type: "string" }, description: "Termini concreti utili al match testuale." },
      semanticQuery: { type: "string", description: "La parte descrittiva/di sensazione della richiesta (es. 'luminoso e tranquillo con vista')." },
    },
    required: [],
  },
};

function buildSystemPrompt(facets: SearchFacets): string {
  return [
    "Sei l'assistente di ricerca di un'agenzia immobiliare italiana (zona Tradate/Varese).",
    "Trasforma la richiesta dell'utente in filtri, chiamando lo strumento set_filters.",
    "Valorizza SOLO i campi di cui sei ragionevolmente sicuro; ometti gli altri.",
    "Metti i vincoli concreti nei filtri (tipo, comune, prezzo, locali, caratteristiche) e",
    "la parte descrittiva/di gusto in semanticQuery (es. 'luminoso, tranquillo, vista aperta').",
    `Comuni disponibili: ${facets.comuni.filter((c) => c !== "Tutti").join(", ")}.`,
    "Scegli comune SOLO se combacia con uno di questi; altrimenti omettilo.",
    "Tipologie: Appartamento, Attico, Villa, Commerciale, Terreno.",
    "Interpreta bilocale=2 locali, trilocale=3, quadrilocale=4.",
  ].join(" ");
}

type ToolUseBlock = { type: string; name?: string; input?: unknown };

/** Chiama Claude e ritorna i filtri, oppure null in caso di errore/timeout (il chiamante fa fallback). */
async function parseQueryAI(query: string, facets: SearchFacets): Promise<ParsedSearch | null> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: AI_SEARCH_MODEL,
        max_tokens: 512,
        system: buildSystemPrompt(facets),
        tools: [SET_FILTERS_TOOL],
        tool_choice: { type: "tool", name: "set_filters" },
        messages: [{ role: "user", content: query }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: ToolUseBlock[] };
    const block = data.content?.find((b) => b.type === "tool_use" && b.name === "set_filters");
    if (!block || typeof block.input !== "object" || block.input === null) return null;
    return sanitize(block.input as Record<string, unknown>, facets, query);
  } catch {
    return null;
  }
}

/** Ripulisce/valida l'output del modello (difensivo: mai fidarsi ciecamente). */
function sanitize(raw: Record<string, unknown>, facets: SearchFacets, query: string): ParsedSearch {
  const out: ParsedSearch = {};
  const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");

  const contract = str(raw.contract);
  if (contract === "Vendita" || contract === "Affitto" || contract === "Tutte") out.contract = contract;

  const type = str(raw.type);
  if (type === "Tutte" || (TYPES as readonly string[]).includes(type)) out.type = type as ParsedSearch["type"];

  const comune = str(raw.comune);
  if (comune && facets.comuni.some((c) => c.toLowerCase() === comune.toLowerCase())) {
    out.comune = facets.comuni.find((c) => c.toLowerCase() === comune.toLowerCase());
  }

  if (typeof raw.maxBudget === "number" && raw.maxBudget > 0) out.maxBudget = Math.round(raw.maxBudget);
  if (typeof raw.minRooms === "number" && raw.minRooms > 0) out.minRooms = Math.round(raw.minRooms);

  if (Array.isArray(raw.features)) {
    const valid = raw.features.filter((f): f is FeatureLabel =>
      facets.featureLabels.includes(f as FeatureLabel),
    );
    if (valid.length) out.features = valid;
  }

  if (Array.isArray(raw.keywords)) {
    out.keywords = raw.keywords.filter((k): k is string => typeof k === "string" && k.length > 1).slice(0, 12);
  }

  const sem = str(raw.semanticQuery);
  out.semanticQuery = sem || query.trim();
  return out;
}

/** Punto d'ingresso: AI se configurata (con fallback locale su errore), altrimenti locale. */
export async function parseQuery(
  query: string,
  facets: SearchFacets,
): Promise<{ filters: ParsedSearch; source: "ai" | "local" }> {
  if (aiParseEnabled) {
    const ai = await parseQueryAI(query, facets);
    if (ai) return { filters: ai, source: "ai" };
  }
  return { filters: parseQueryLocal(query, facets), source: "local" };
}
