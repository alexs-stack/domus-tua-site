// Parsing della frase in linguaggio naturale -> filtri strutturati (ParsedSearch).
//
// Due percorsi:
//  - AI (Claude Haiku) se ANTHROPIC_API_KEY è presente: comprende sinonimi, dialetto, "vibe".
//  - Locale (euristica deterministica) come fallback: nessuna chiave, funziona sempre.
// Entrambi sono difensivi: mai throw verso il chiamante (la route decide il fallback).

import { ANTHROPIC_API_KEY, AI_SEARCH_MODEL, aiParseEnabled } from "./config";
import type { FeatureLabel, ParsedSearch, SearchFacets } from "./types";

const TYPES = ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"] as const;
type PropType = (typeof TYPES)[number];

// Sinonimi multilingua (IT primario + EN/FR/DE/ES) per il parser locale.
// Uso i confini di parola (\b) per evitare falsi positivi (es. "local" dentro "locali",
// "como" dentro "comodo"). Prima corrispondenza vince.
const CONTRACT_PATTERNS: [RegExp, "Vendita" | "Affitto"][] = [
  [/\b(affitt\w*|locazion\w*|for rent|to rent|(?:à )?louer|location|mieten?|miete|alquiler|arrendar)\b/i, "Affitto"],
  [/\b(vend\w*|acquist\w*|compr\w*|for sale|to buy|(?:à )?vendre|vente|kauf\w*|verkauf\w*|venta|comprar)\b/i, "Vendita"],
];

const TYPE_PATTERNS: [RegExp, PropType][] = [
  [/\b(attic[oi]|penthouse|mansard[ae]|dachwohnung|[aá]tico)\b/i, "Attico"],
  [/\b(terren[oi]|edificabil[ei]|lotto|land|plot|terrain|grundst[uü]ck)\b/i, "Terreno"],
  [/\b(negozi[oi]|uffici[oi]|capannon[ei]|commerciale|laboratori[oi]|magazzino|showroom|shop|store|office|warehouse|bureau|gewerbe)\b/i, "Commerciale"],
  [/\b(appartament[oi]|apartment|appartement|wohnung|apartamento|flat|bilocal[ei]|trilocal[ei]|quadrilocal[ei]|monolocal[ei]|loft|duplex)\b/i, "Appartamento"],
  // NB: niente "casa" generico qui (mapparlo a Villa escluderebbe gli appartamenti da "cerco casa").
  [/\b(villa|villett[ae]|ville|house|maison|haus|casale|cascina|rustico|schiera|porzione|bifamiliar[ei]|trifamiliar[ei]|terratetto)\b/i, "Villa"],
];

// Mappa parola chiave -> caratteristica (per il parser locale).
const FEATURE_KEYWORDS: Record<FeatureLabel, string[]> = {
  Giardino: ["giardin", "garden", "jardin", "jardín", "garten"],
  "Box / posto auto": ["box", "posto auto", "posto macchina", "garage", "autorimessa", "parcheggio", "parking", "stellplatz", "cochera"],
  Terrazzo: ["terrazz", "terrace", "terrasse", "terraza"],
  "Doppi servizi": ["doppi servizi", "due bagni", "2 bagni", "secondo bagno", "two bathrooms", "2 bathrooms"],
};

// Parole composte che indicano un numero minimo di locali.
const ROOM_WORDS: Record<string, number> = {
  monolocale: 1,
  bilocale: 2,
  trilocale: 3,
  quadrilocale: 4,
};
const WORD_NUM: Record<string, number> = {
  uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
};

// Rumore da escludere dalle keyword di ranking (non discriminante).
const STOPWORDS = new Set([
  "cerco", "cerca", "cercasi", "cerchiamo", "vorrei", "voglio", "casa", "immobile", "immobili",
  "zona", "con", "per", "una", "uno", "che", "del", "della", "dei", "delle", "nel", "nella",
  "sono", "vicino", "near", "looking", "want", "with", "the", "and", "for", "suche", "busco", "cherche",
]);

// Qualificatori di direzione del prezzo (multilingua IT/EN/FR/DE/ES).
const PRICE_MIN_RE = /\b(sopra|oltre|almeno|minimo|pi[uù]\s+di|a\s+partire\s+da|over|above|at\s+least|from|plus\s+de|[àa]\s+partir\s+de|desde|m[aá]s\s+de|ab|mindestens)\b/i;
const PRICE_MAX_RE = /\b(sotto|fino\s+a|entro|max(?:imo|imum)?|massimo|meno\s+di|non\s+pi[uù]\s+di|under|up\s+to|less\s+than|jusqu.?\s*[àa]|bis(?:\s+zu)?|hasta|menos\s+de)\b/i;
const PRICE_RANGE_RE = /\b(tra|fra|between|entre|zwischen)\b/i;

/** Tutti gli importi "prezzo" (>= 10.000 €) nella frase, in ordine di comparsa. */
function extractAmounts(s: string): number[] {
  // Normalizza i separatori delle migliaia (250.000 / 250 000 -> 250000), preserva i decimali per k/mil.
  const norm = s.replace(/(\d)[.  ](?=\d{3}\b)/g, "$1");
  const out: number[] = [];
  // "mila"/"k" PRIMA delle forme milione (altrimenti "mila" verrebbe letto come "mil" = milione).
  const re = /(\d+(?:[.,]\d+)?)\s*(mila|k|milioni|milione|mln|millions?|mil)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm)) !== null) {
    let n = parseFloat(m[1].replace(",", "."));
    const unit = (m[2] || "").toLowerCase();
    if (unit === "mila" || unit === "k") n *= 1000;
    else if (unit) n *= 1_000_000; // qualsiasi forma di "milione"
    if (n >= 10000) out.push(Math.round(n));
  }
  return out;
}

/**
 * Interpreta il prezzo con la DIREZIONE: "sotto/fino a X" -> max, "sopra/oltre/almeno X" -> min,
 * "tra X e Y" -> intervallo. Un singolo numero senza qualificatore è, di norma, un tetto di spesa.
 * Gestisce anche "mezzo milione", "250k", "1,2 milioni", "250.000".
 */
function parseBudget(q: string): { min?: number; max?: number } {
  const s = q.toLowerCase();
  const amounts = extractAmounts(s);
  if (/mezzo\s+milione/.test(s)) amounts.unshift(500000);
  if (!amounts.length) return {};
  if (PRICE_RANGE_RE.test(s) && amounts.length >= 2) {
    return { min: Math.min(amounts[0], amounts[1]), max: Math.max(amounts[0], amounts[1]) };
  }
  const amount = amounts[0];
  if (PRICE_MIN_RE.test(s) && !PRICE_MAX_RE.test(s)) return { min: amount };
  return { max: amount };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Parser locale deterministico: nessuna chiave richiesta. Copre IT + EN/FR/DE/ES di base. */
export function parseQueryLocal(query: string, facets: SearchFacets): ParsedSearch {
  const q = query.toLowerCase();
  const out: ParsedSearch = {};

  // Contratto
  for (const [re, contract] of CONTRACT_PATTERNS) {
    if (re.test(q)) {
      out.contract = contract;
      break;
    }
  }

  // Tipologia (prima corrispondenza, per confine di parola)
  for (const [re, type] of TYPE_PATTERNS) {
    if (re.test(q)) {
      out.type = type;
      break;
    }
  }

  // Comune: confine di parola, preferendo il nome più lungo (es. "Venegono Inferiore").
  const comune = facets.comuni
    .filter((c) => c !== "Tutti")
    .filter((c) => new RegExp(`\\b${escapeRe(c.toLowerCase())}\\b`, "i").test(q))
    .sort((a, b) => b.length - a.length)[0];
  if (comune) out.comune = comune;

  // Budget (con direzione: "sotto/fino a" -> tetto, "sopra/oltre/almeno" -> minimo, "tra X e Y" -> intervallo)
  const budget = parseBudget(q);
  if (budget.max) out.maxBudget = budget.max;
  if (budget.min) out.minBudget = budget.min;

  // Locali: parole composte (bilocale...) poi "N locali/vani/stanze/camere" (numero o parola).
  for (const [word, n] of Object.entries(ROOM_WORDS)) {
    if (q.includes(word)) {
      out.minRooms = n;
      break;
    }
  }
  const rooms = q.match(
    /(\d+|uno|una|due|tre|quattro|cinque|sei|one|two|three|four|five|six)\s*\+?\s*(?:local[ei]|van[oi]|stanz[ae]|camer[ae]|bedrooms?|rooms?|zimmer|pi[eè]ces?|habitaci[oó]n(?:es)?)/,
  );
  if (rooms) {
    const n = parseInt(rooms[1], 10) || WORD_NUM[rooms[1]];
    if (n) out.minRooms = n;
  }

  // Caratteristiche
  const features = (Object.keys(FEATURE_KEYWORDS) as FeatureLabel[]).filter((label) =>
    FEATURE_KEYWORDS[label].some((kw) => q.includes(kw)),
  );
  if (features.length) out.features = features;

  // La frase intera resta come query semantica; token >3 lettere (senza stopword) come keyword.
  out.semanticQuery = query.trim();
  out.keywords = Array.from(
    new Set(q.split(/[^a-zàèéìòùáíóúäöüñç]+/i).filter((w) => w.length > 3 && !STOPWORDS.has(w))),
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
      maxBudget: { type: "number", description: "Tetto di prezzo in euro, per 'sotto/fino a/entro X'. 0 se non indicato." },
      minBudget: { type: "number", description: "Prezzo MINIMO in euro, per 'sopra/oltre/almeno/più di X'. Per 'tra X e Y' usa minBudget=X e maxBudget=Y. 0 se non indicato." },
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
    "Prezzo: 'sotto/fino a/entro X' -> maxBudget; 'sopra/oltre/almeno/più di X' -> minBudget; 'tra X e Y' -> minBudget=X, maxBudget=Y.",
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
  if (typeof raw.minBudget === "number" && raw.minBudget > 0) out.minBudget = Math.round(raw.minBudget);
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
