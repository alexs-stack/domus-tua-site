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
  [/\b(appartament[oi]|apartment|appartement|wohnung|apartamento|piso|flat|studio|bilocal[ei]|trilocal[ei]|quadrilocal[ei]|monolocal[ei]|loft|duplex)\b/i, "Appartamento"],
  // NB: "casa" GENERICO non forza Villa (escluderebbe gli appartamenti da "cerco casa");
  // ma "casa indipendente/singola/unifamiliare" sì.
  [/\b(villa|villett[ae]|ville|house|maison|haus|casale|cascina|rustico|schiera|porzione|bifamiliar[ei]|trifamiliar[ei]|terratetto|casa\s+(?:indipendente|singola|unifamiliar[ei]))\b/i, "Villa"],
];

// Mappa parola chiave -> caratteristica (per il parser locale).
const FEATURE_KEYWORDS: Record<FeatureLabel, string[]> = {
  Giardino: ["giardin", "garden", "jardin", "jardín", "garten"],
  "Box / posto auto": ["box", "posto auto", "posto macchina", "garage", "garaje", "autorimessa", "parcheggio", "parking", "stellplatz", "cochera"],
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
  uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, // it
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, // en
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, // fr
  dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, // es
  ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, "fünf": 5, funf: 5, sechs: 6, // de
};
// Unità "locali" (totale vani) vs "camere" (camere da letto): due segnali distinti.
const ROOMS_RE_SRC = `(\\d+|${Object.keys(WORD_NUM).sort((a, b) => b.length - a.length).join("|")})\\s*\\+?\\s*(local[ei]|van[oi]|stanz[ae]|camer[ae]|bedrooms?|rooms?|zimmer|pi[eè]ces?|habitaci[oó]n(?:es)?|chambres?|schlafzimmer)`;
const BEDROOM_UNIT_RE = /camer|bedroom|habitaci|chambre|schlafzimmer/i;

// Rumore da escludere dalle keyword di ranking (non discriminante).
const STOPWORDS = new Set([
  "cerco", "cerca", "cercasi", "cerchiamo", "vorrei", "voglio", "casa", "immobile", "immobili",
  "zona", "con", "per", "una", "uno", "che", "del", "della", "dei", "delle", "nel", "nella",
  "sono", "vicino", "near", "looking", "want", "with", "the", "and", "for", "suche", "busco", "cherche",
]);

// Qualificatori di direzione (min/max), condivisi da prezzo e superficie (multilingua IT/EN/FR/DE/ES).
// NB: testare su stringa DE-ACCENTATA (i confini di parola \b non funzionano prima di "à").
const MIN_QUAL_RE = /\b(sopra|oltre|almeno|minimo|pi[uù]\s+di|a\s+partire\s+da|in\s+su|in\s+poi|over|above|at\s+least|from|plus\s+de|[àa]\s+partir\s+de|desde|m[aá]s\s+de|ab|mindestens)\b/i;
// "non oltre / non più di" sono MASSIMI (hanno la precedenza su "oltre/più di" come minimo).
const MAX_QUAL_RE = /\b(sotto|fino\s+a|entro|max(?:imo|imum)?|massimo|meno\s+di|non\s+(?:oltre|pi[uù]\s+di)|under|up\s+to|less\s+than|jusqu.?\s*[àa]|bis(?:\s+zu)?|hasta|menos\s+de)\b/i;

/** Vero se la frase esprime un INTERVALLO ("tra X e Y", "da X a Y", "from X to Y", "von X bis Y"). */
function hasRange(s: string): boolean {
  return (
    /\b(tra|fra|between|entre|zwischen)\b/i.test(s) ||
    (/\bda\b/i.test(s) && /\ba\b/i.test(s)) ||
    (/\bfrom\b/i.test(s) && /\bto\b/i.test(s)) ||
    (/\bvon\b/i.test(s) && /\bbis\b/i.test(s))
  );
}

/**
 * Intervallo di PREZZO robusto: "300.000 - 400.000", "da 200 a 300 mila", "tra 300 e 500 mila",
 * "von 200000 bis 300000". L'unità finale (mila/k/milioni) vale anche per il primo numero se manca.
 * Ritorna null se non è un intervallo di prezzo plausibile (entrambi i valori >= 1000).
 */
function rangeBudget(sd: string): { min: number; max: number } | null {
  const m = sd.match(
    /(\d+(?:[.,]\d+)?)\s*(mila|k|milioni?|mln|millions?)?\s*(?:-|–|—|\bto\b|\ba\b|\be\b|\by\b|\bund\b|\bbis\b)\s*(\d+(?:[.,]\d+)?)\s*(mila|k|milioni?|mln|millions?)?/,
  );
  if (!m) return null;
  const mul = (u?: string) => (!u ? 0 : /mila|k/.test(u) ? 1000 : 1_000_000);
  let m1 = mul(m[2]);
  let m2 = mul(m[4]);
  if (!m1 && m2) m1 = m2; // unità condivisa
  if (!m2 && m1) m2 = m1;
  if (!m1) m1 = 1;
  if (!m2) m2 = 1;
  const a = Math.round(parseFloat(m[1].replace(",", ".")) * m1);
  const b = Math.round(parseFloat(m[3].replace(",", ".")) * m2);
  if (a < 1000 || b < 1000) return null; // non è un intervallo di prezzo (es. "tra 80 e 110 mq")
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

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
  // De-accentata + separatori delle migliaia rimossi ("300.000" -> "300000") per l'intera analisi.
  const sd = deaccent(q.toLowerCase()).replace(/(\d)[.  ](?=\d{3}\b)/g, "$1");
  const rb = rangeBudget(sd);
  if (rb) return rb;
  const amounts = extractAmounts(sd);
  if (/mezzo\s+milione/.test(sd)) amounts.unshift(500000);
  if (!amounts.length) return {};
  if (amounts.length >= 2 && hasRange(sd)) {
    return { min: Math.min(amounts[0], amounts[1]), max: Math.max(amounts[0], amounts[1]) };
  }
  const amount = amounts[0];
  if (MIN_QUAL_RE.test(sd) && !MAX_QUAL_RE.test(sd)) return { min: amount };
  return { max: amount };
}

// Unità di superficie (m²). Numeri 10..5000 (mq plausibili), separati dai prezzi (>= 10.000).
const SQM_UNIT_RE = /(\d{2,4})\s*(?:m2|m²|mq|metri\s*quadr\w*|sq\s?m|sqm|square\s*met\w*|qm|m[eè]tres?\s*carr\w*|metros?\s*cuadrados?)/gi;

/**
 * Superficie in m²: "almeno 100 mq" -> min, "fino a 120 mq" -> max, "tra 80 e 110 mq" -> intervallo.
 * Un valore senza qualificatore è, di norma, un MINIMO ("100 mq" = almeno 100).
 */
function parseSqm(q: string): { min?: number; max?: number } {
  const s = deaccent(q.toLowerCase());
  const withUnit: { v: number; idx: number }[] = [];
  let m: RegExpExecArray | null;
  SQM_UNIT_RE.lastIndex = 0;
  while ((m = SQM_UNIT_RE.exec(s)) !== null) {
    const v = parseInt(m[1], 10);
    if (v >= 10 && v <= 5000) withUnit.push({ v, idx: m.index });
  }
  if (!withUnit.length) return {};
  const first = withUnit[0];
  // Intervallo "tra 80 e 110 mq" / "da 80 a 110 mq": due numeri (2-4 cifre) prima dell'unità.
  if (hasRange(s)) {
    const seg = s.slice(0, first.idx + String(first.v).length + 6);
    const nums = (seg.match(/\b\d{2,4}\b/g) || []).map(Number).filter((n) => n >= 10 && n <= 5000);
    if (nums.length >= 2) {
      const a = nums[nums.length - 2];
      const b = nums[nums.length - 1];
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }
  const before = s.slice(Math.max(0, first.idx - 18), first.idx);
  if (MAX_QUAL_RE.test(before)) return { max: first.v };
  if (MIN_QUAL_RE.test(before)) return { min: first.v };
  return { min: first.v };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Rimuove i segni diacritici per un match robusto (comuni, ecc.). */
function deaccent(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Negazione di una caratteristica ("senza giardino", "no box", "without garden", "senza X né Y né Z").
const NEG_START_RE = /\b(senza|no|niente|without|sans|ohne|sin)\b/gi;
// L'ambito della negazione finisce a un connettore POSITIVO (ma/con/with...) o a fine frase.
// NB: "e/né/and" NON interrompono (continuano la negazione: "senza giardino né box" nega entrambi).
const NEG_STOP_RE = /[.;,]|\b(?:ma|per[oò]|but|con|with|avec|mit)\b/i;

/** Intervalli [start,end) di testo negato: dalla parola di negazione al primo stop. */
function negatedRanges(q: string): [number, number][] {
  const ranges: [number, number][] = [];
  NEG_START_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NEG_START_RE.exec(q)) !== null) {
    const from = m.index + m[0].length;
    const stop = q.slice(from).search(NEG_STOP_RE);
    ranges.push([m.index, stop === -1 ? q.length : from + stop]);
  }
  return ranges;
}

/** Negazione posticipata: la feature è seguita a breve da "no" ("box no", "giardino no").
 *  `\w*` consuma il resto della parola, dato che le keyword sono radici ("giardin" -> "giardino"). */
function postNegated(q: string, after: number): boolean {
  return /^\w*\s*,?\s*no\b/i.test(q.slice(after, after + 12));
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

  // Comune: confine di parola, accent-insensitive, preferendo il nome più lungo (es. "Venegono Inferiore").
  const qd = deaccent(q);
  const comune = facets.comuni
    .filter((c) => c !== "Tutti")
    .filter((c) => new RegExp(`\\b${escapeRe(deaccent(c.toLowerCase()))}\\b`, "i").test(qd))
    .sort((a, b) => b.length - a.length)[0];
  if (comune) out.comune = comune;

  // Budget (con direzione: "sotto/fino a" -> tetto, "sopra/oltre/almeno" -> minimo, "tra X e Y" -> intervallo)
  const budget = parseBudget(q);
  if (budget.max) out.maxBudget = budget.max;
  if (budget.min) out.minBudget = budget.min;

  // Superficie in m² ("almeno 100 mq" -> min, "fino a 120 mq" -> max, "tra 80 e 110 mq" -> intervallo)
  const sqm = parseSqm(q);
  if (sqm.min) out.minSqm = sqm.min;
  if (sqm.max) out.maxSqm = sqm.max;

  // Locali: composite (mono/bi/tri/quadri) + "N locali/vani/stanze" (LOCALI) vs "N camere" (CAMERE).
  // I segnali "locali" hanno la precedenza; "camere" (camere da letto) vale solo se non c'è un
  // segnale locali (così "quadrilocale con 3 camere" resta 4, non scende a 3).
  let composite: number | null = null;
  for (const [word, n] of Object.entries(ROOM_WORDS)) {
    if (q.includes(word)) composite = composite === null ? n : Math.min(composite, n);
  }
  let localiNum: number | null = null;
  let bedNum: number | null = null;
  const roomsRe = new RegExp(ROOMS_RE_SRC, "gi");
  let rm: RegExpExecArray | null;
  while ((rm = roomsRe.exec(q)) !== null) {
    const n = parseInt(rm[1], 10) || WORD_NUM[rm[1].toLowerCase()];
    if (!n) continue;
    if (BEDROOM_UNIT_RE.test(rm[2])) bedNum = bedNum === null ? n : Math.min(bedNum, n);
    else localiNum = localiNum === null ? n : Math.min(localiNum, n);
  }
  const localiSignals = [composite, localiNum].filter((x): x is number => x !== null);
  if (localiSignals.length) out.minRooms = Math.min(...localiSignals);
  else if (bedNum !== null) out.minRooms = bedNum;

  // Caratteristiche con NEGAZIONE ("senza giardino", "no box", "box no"): una feature entra
  // solo se ha un'occorrenza NON dentro un intervallo negato e non seguita da "no".
  const negRanges = negatedRanges(q);
  const inNeg = (idx: number) => negRanges.some(([a, b]) => idx >= a && idx < b);
  const features = (Object.keys(FEATURE_KEYWORDS) as FeatureLabel[]).filter((label) =>
    FEATURE_KEYWORDS[label].some((kw) => {
      let idx = q.indexOf(kw);
      while (idx !== -1) {
        if (!inNeg(idx) && !postNegated(q, idx + kw.length)) return true;
        idx = q.indexOf(kw, idx + 1);
      }
      return false;
    }),
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
      minSqm: { type: "number", description: "Superficie MINIMA in m² (per 'almeno/da X mq'). 0 se non indicato." },
      maxSqm: { type: "number", description: "Superficie MASSIMA in m² (per 'fino a/sotto X mq'). 0 se non indicato." },
      features: { type: "array", items: { type: "string", enum: ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"] }, description: "Solo caratteristiche RICHIESTE. Se l'utente le esclude ('senza giardino'), NON includerle." },
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
    "Superficie in m² (mq): 'almeno/da X mq' -> minSqm; 'fino a X mq' -> maxSqm; 'tra X e Y mq' -> minSqm=X, maxSqm=Y. Non confondere i mq col prezzo.",
    "Caratteristiche NEGATE ('senza giardino', 'no box') NON vanno incluse in features.",
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
  if (typeof raw.minSqm === "number" && raw.minSqm > 0) out.minSqm = Math.round(raw.minSqm);
  if (typeof raw.maxSqm === "number" && raw.maxSqm > 0) out.maxSqm = Math.round(raw.maxSqm);

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
