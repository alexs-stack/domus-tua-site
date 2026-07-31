// Fatti strutturati di un immobile: il modello dati che alimenta i box della scheda.
//
// PRINCIPIO
// Nessun LLM a runtime, nessuna caratteristica inventata. Un fatto esiste solo se una fonte
// lo afferma in modo esplicito. Ogni fatto porta con sé PROVENIENZA e CONFIDENZA, così che
// l'audit possa sempre rispondere a "da dove viene questo dato?".
//
// GERARCHIA DELLE FONTI (una fonte inferiore non sovrascrive una superiore)
//   1. override manuale approvato        → ./overrides.ts
//   2. campo esplicito RealSmart         → factsFromFields()
//   3. informazione esplicita e non ambigua nella descrizione → factsFromDescription()
//   4. dato assente                      → nessun fatto (mai "—", mai "No")
//
// UNICA ECCEZIONE (arricchimento, non sovrascrittura): se la fonte superiore afferma solo la
// PRESENZA ("Terrazzo: Sì") e quella inferiore aggiunge una MISURA coerente ("Terrazzi: 2"),
// vince il valore più preciso. Le due fonti non si contraddicono: una conta, l'altra conferma.

/** Gruppi in cui i fatti vengono presentati nella scheda. L'ordine è quello di rendering. */
export const FACT_GROUPS = ["principali", "esterni", "comfort", "spazi", "forza"] as const;
export type FactGroup = (typeof FACT_GROUPS)[number];

/** Da dove arriva il dato. */
export type FactSource = "override" | "realsmart" | "descrizione";

/** Quanto è sicura l'affermazione. Solo "alta" viene pubblicata. */
export type FactConfidence = "alta" | "bassa";

export interface PropertyFact {
  /** Chiave stabile e UNICA: un dato vive in un solo gruppo e compare una sola volta. */
  key: string;
  group: FactGroup;
  /** Etichetta italiana (i dati sorgente sono in italiano). */
  label: string;
  /**
   * Valore da mostrare accanto all'etichetta ("2", "a pavimento", "Monte Rosa").
   * Assente = dotazione booleana, da rendere come check/chip con la sola etichetta.
   */
  value?: string;
  source: FactSource;
  confidence: FactConfidence;
  /** Frammento che ha generato il fatto: serve al report di revisione, non alla UI. */
  evidence?: string;
}

/** Voce del report di revisione: non pubblicata, da controllare a mano. */
export interface FactReviewItem {
  key: string;
  /** Perché non è pubblicabile così com'è. */
  reason: "ambiguo" | "contraddittorio" | "confidenza-bassa";
  detail: string;
  evidence: string;
}

export interface FactsResult {
  /** Fatti pubblicabili (confidenza alta), deduplicati e ordinati per gruppo. */
  facts: PropertyFact[];
  /** Fatti scartati o incerti: alimentano l'audit, mai la pagina. */
  review: FactReviewItem[];
}

// ── Utilità di testo ────────────────────────────────────────────────────────

/** Numerali a parole usati negli annunci italiani (inclusi "doppio", "triplo"). */
const NUMBER_WORDS: Readonly<Record<string, number>> = {
  un: 1,
  uno: 1,
  una: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  doppio: 2,
  doppia: 2,
  doppi: 2,
  doppie: 2,
  triplo: 3,
  tripla: 3,
  tripli: 3,
  triple: 3,
  quadruplo: 4,
  quadrupla: 4,
};

/** Frammento regex che cattura una quantità (cifra o parola). */
const QTY = "\\d{1,2}|un|uno|una|due|tre|quattro|cinque|sei|doppi[oaie]|tripl[oaie]|quadrupl[oa]";

/**
 * Un conteggio non deve mai agganciare una MISURA: in "con 11 mq di balconi" l'11 è una
 * superficie, non il numero di balconi. Questo lookahead scarta il numero seguito da un'unità.
 */
const NOT_A_UNIT = "(?!\\s*(?:mq|m²|metri|mt|cm|euro|€|anni|%))";

/** Converte una quantità (cifra o parola) nel numero corrispondente; undefined se ignota. */
function toCount(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const token = raw.trim().toLowerCase();
  if (/^\d{1,2}$/.test(token)) {
    const n = Number.parseInt(token, 10);
    return n > 0 && n <= 20 ? n : undefined;
  }
  return NUMBER_WORDS[token];
}

/** Normalizza una metratura scritta come "circa 176 mq" → "circa 176 m²". */
function toSurface(amount: string, approx: boolean): string {
  const clean = amount.replace(",", ".").replace(/\.0+$/, "");
  return `${approx ? "circa " : ""}${clean} m²`;
}

/**
 * NEGAZIONI — se compaiono poco prima del match, il fatto NON esiste.
 * Finestra corta (≈35 caratteri) per non agganciare negazioni di un'altra proposizione.
 */
const NEGATION = /\b(senza|priv[oaie]\s+di|non\s+dispone\s+di|non\s+è\s+dotat[oa]\s+di|assenza\s+di|non\s+presenta|nessun[ao]?)\b[^.;!?]{0,35}$/i;

/**
 * POTENZIALITÀ / PROSSIMITÀ — la caratteristica NON è nell'immobile: è possibile, prevista,
 * oppure si trova nelle vicinanze. Finestra più ampia perché queste formule sono più lunghe.
 */
const POTENTIAL = /\b(possibilit[àa]\s+di|predisposizione\s+(?:per|a|all)|predispost[oai]\s+(?:per|a|all)|ideale\s+per\s+(?:realizzare|ricavare|creare|ospitare)|si\s+pu[òo]\s+(?:ricavare|realizzare|creare)|eventuale|opzionale|da\s+realizzare|nelle\s+vicinanze|nei\s+pressi|poco\s+distante|in\s+zona|nel\s+quartiere|del\s+condominio|condominiale)\b[^.;!?]{0,45}$|\bcome[\s\w']{0,3}$/i;

/**
 * POTENZIALITÀ che SEGUE il termine ("un sottotetto da realizzare", "taverna in progetto"):
 * l'ambiente non esiste ancora. Diverso da "da ristrutturare", che presuppone che esista.
 */
const POTENTIAL_AFTER = /^\s*(?:è\s+|sono\s+)?(?:tutt[oi]\s+)?(?:da\s+(?:realizzare|ricavare|costruire|edificare|creare)|in\s+progetto|da\s+progetto)\b/i;

/**
 * IPOTESI / EVOCAZIONE — il copy immobiliare invita a immaginare. Se il marcatore PRECEDE il
 * fatto ("immagina di ammirare il giardino"), non è un'affermazione sull'immobile: finisce in
 * revisione, non in pagina. Se lo segue ("un box di 18 mq, di cui potresti aver bisogno") il
 * fatto è affermato e resta valido.
 */
const HYPOTHETICAL = /\b(immagina\w*|immaginate|potrebbe|potresti|potrete|potrai|sogna\w*|se\s+desideri|pensa\s+a)\b/i;

/** Spezza il testo nei segmenti su cui si valuta il contesto (frase o riga tecnica). */
function toSegments(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+|\n+|\s+[·•|]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ── Regole di estrazione dalla descrizione ──────────────────────────────────

interface DescriptionRule {
  key: string;
  group: FactGroup;
  label: string;
  /** Pattern cercato in ogni segmento. Il gruppo 1, se presente, alimenta `value`. */
  match: RegExp;
  /** Costruisce il valore da mostrare. Assente → dotazione booleana. */
  value?: (m: RegExpMatchArray) => string | undefined;
  /** True se il valore è un CONTEGGIO: conteggi diversi sullo stesso key = contraddizione. */
  counted?: boolean;
}

/**
 * Le regole sono volutamente strette: meglio non estrarre che estrarre a sproposito.
 * Ogni pattern richiede il termine tecnico esplicito, non una parafrasi.
 */
const DESCRIPTION_RULES: readonly DescriptionRule[] = [
  // ── ESTERNI E PERTINENZE ────────────────────────────────────────────────
  {
    key: "terrazzi",
    group: "esterni",
    label: "Terrazzi",
    counted: true,
    match: new RegExp(`\\b(${QTY})${NOT_A_UNIT}\\s+(?:\\w+\\s+){0,2}?terrazz[aeio]\\w*`, "i"),
    value: (m) => {
      const n = toCount(m[1]);
      return n && n > 1 ? String(n) : undefined;
    },
  },
  {
    key: "balconi",
    group: "esterni",
    label: "Balconi",
    counted: true,
    match: new RegExp(`\\b(${QTY})${NOT_A_UNIT}\\s+(?:\\w+\\s+){0,2}?balcon[ei]\\w*`, "i"),
    value: (m) => {
      const n = toCount(m[1]);
      return n && n > 1 ? String(n) : undefined;
    },
  },
  {
    key: "autorimesse",
    group: "esterni",
    label: "Autorimesse",
    counted: true,
    // Sinonimi deduplicati sulla stessa chiave: autorimessa / box / garage.
    match: new RegExp(`\\b(${QTY})${NOT_A_UNIT}\\s+(?:\\w+\\s+){0,2}?(?:autorimess[ae]|box(?:\\s+auto)?|garage)\\b`, "i"),
    value: (m) => {
      const n = toCount(m[1]);
      return n && n > 1 ? String(n) : undefined;
    },
  },
  {
    key: "postiAuto",
    group: "esterni",
    label: "Posti auto",
    counted: true,
    match: new RegExp(`\\b(?:n\\.\\s*)?(${QTY})${NOT_A_UNIT}\\s+post[oi]\\s+auto\\b`, "i"),
    value: (m) => {
      const n = toCount(m[1]);
      return n && n > 1 ? String(n) : undefined;
    },
  },
  {
    key: "giardino",
    group: "esterni",
    label: "Giardino",
    match: /\bgiardino(?:\s+(privato|condominiale|esclusivo|pensile))?\b/i,
    value: (m) => m[1]?.toLowerCase(),
  },
  { key: "cantina", group: "esterni", label: "Cantina", match: /\bcantin[ae]\b/i },
  { key: "ripostiglio", group: "esterni", label: "Ripostiglio", match: /\bripostigli[oa]\b/i },
  { key: "sottotetto", group: "esterni", label: "Sottotetto", match: /\bsottotetto\b/i },
  { key: "taverna", group: "esterni", label: "Taverna", match: /\btavern[ae]\b/i },

  // ── COMFORT E IMPIANTI ──────────────────────────────────────────────────
  { key: "ascensore", group: "comfort", label: "Ascensore", match: /\bascensore\b/i },
  {
    key: "riscaldamento",
    group: "comfort",
    label: "Riscaldamento",
    match: /\briscaldamento\s+(a\s+pavimento|radiante\s+a\s+pavimento)\b/i,
    value: () => "a pavimento",
  },
  { key: "cappottoTermico", group: "comfort", label: "Cappotto termico", match: /\bcappotto\s+(?:termico|esterno)?\b/i },
  {
    key: "ariaCondizionata",
    group: "comfort",
    label: "Aria condizionata",
    match: /\b(?:aria\s+condizionata|climatizzazione|climatizzator[ei])\b/i,
  },
  { key: "fotovoltaico", group: "comfort", label: "Fotovoltaico", match: /\b(?:fotovoltaic[oi]|pannelli\s+solari)\b/i },
  {
    key: "infissi",
    group: "comfort",
    label: "Infissi",
    match: /\b(?:infissi|serrament[ei])\s+in\s+(pvc|legno|alluminio|legno\s+e\s+alluminio|alluminio\s+e\s+legno)\b/i,
    value: (m) => `in ${m[1].toLowerCase()}`,
  },
  {
    key: "vetri",
    group: "comfort",
    label: "Vetri",
    match: /\b(dopp[ie]|tripl[ie])\s+vetr[oi]\b/i,
    value: (m) => (/^tripl/i.test(m[1]) ? "tripli" : "doppi"),
  },
  {
    key: "pavimenti",
    group: "comfort",
    label: "Pavimenti",
    match: /\b(?:pavimenti?\s+in\s+)?parquet\b/i,
    value: () => "parquet",
  },
  { key: "camino", group: "comfort", label: "Camino", match: /\b(?:camino|caminetto)\b/i },
  { key: "domotica", group: "comfort", label: "Domotica", match: /\bdomotic[ao]\b/i },
  { key: "portaBlindata", group: "comfort", label: "Porta blindata", match: /\b(?:porta|portoncino)\s+blindat[oa]\b/i },
  { key: "allarme", group: "comfort", label: "Allarme", match: /\b(?:impianto\s+di\s+)?(?:allarme|antifurto)\b/i },

  // ── SPAZI ───────────────────────────────────────────────────────────────
  { key: "cucinaAbitabile", group: "spazi", label: "Cucina abitabile", match: /\bcucina\s+abitabile\b/i },
  {
    key: "soggiorno",
    group: "spazi",
    label: "Soggiorno",
    match: /\bsoggiorno\s+(?:\w+\s+){0,2}?di\s+(?:ben\s+)?(circa\s+)?(\d{1,3}(?:[.,]\d)?)\s*(?:mq|m²|metri\s+quadri)/i,
    value: (m) => toSurface(m[2], Boolean(m[1])),
  },
  {
    key: "studio",
    group: "spazi",
    label: "Studio",
    // Serve un determinante da AMBIENTE ("uno studio", "un ampio studio"): così restano fuori
    // sia gli usi solo suggeriti ("funzionale anche come studio", "locale lettura, studio")
    // sia gli studi PROFESSIONALI citati nel copy ("progettata dallo studio dell'architetto").
    match: /\b(?:un[o']?|lo|il|ampio|comodo|piccolo|grande|luminoso|proprio)\s+studio\b(?!\s+(?:[A-Z]|tecnico|notarile|legale|dell|degli|di\s+progettazione))/,
  },
  { key: "lavanderia", group: "spazi", label: "Lavanderia", match: /\blavanderia\b/i },
  {
    key: "cameraMatrimoniale",
    group: "spazi",
    label: "Camera matrimoniale",
    match: /\bcamera\s+(?:da\s+letto\s+)?matrimoniale(?:\s+con\s+(?:ulteriore\s+)?(terrazzo|balcone|cabina\s+armadio|bagno))?/i,
    value: (m) => (m[1] ? `con ${m[1].toLowerCase()}` : undefined),
  },
  { key: "openSpace", group: "spazi", label: "Open space", match: /\bopen\s?space\b/i },

  // ── PUNTI DI FORZA ──────────────────────────────────────────────────────
  {
    key: "vista",
    group: "forza",
    label: "Vista",
    match: /\bvista\s+(monte\s+rosa|lago|panoramica|aperta|sulle\s+alpi|sul\s+lago|sulle\s+montagne)\b/i,
    value: (m) => {
      const raw = m[1].toLowerCase();
      if (raw.includes("monte rosa")) return "Monte Rosa";
      if (raw.includes("lago")) return "lago";
      if (raw.includes("alpi")) return "Alpi";
      if (raw.includes("montagne")) return "montagne";
      return raw;
    },
  },
  {
    key: "esposizione",
    group: "forza",
    label: "Esposizione",
    match: /\b(dopp[ia]|tripl[ia])\s+esposizione\b/i,
    value: (m) => (/^tripl/i.test(m[1]) ? "tripla" : "doppia"),
  },
  { key: "ultimoPiano", group: "forza", label: "Ultimo piano", match: /\b(?:all'|posto\s+all'|situat[oa]\s+all')ultimo\s+piano\b/i },
  { key: "duplex", group: "forza", label: "Duplex", match: /\bduplex\b/i },
  {
    key: "indipendente",
    group: "forza",
    label: "Indipendente",
    match: /\b(?:ingresso\s+indipendente|(?:completamente|totalmente)\s+indipendente|indipendente\s+su\s+(?:quattro|4)\s+lati)\b/i,
  },

  // ── DATI PRINCIPALI (solo se il campo RealSmart manca) ──────────────────
  {
    key: "classeEnergetica",
    group: "principali",
    label: "Classe energetica",
    // Solo l'espressione INEQUIVOCABILE: "Classe B" da sola non basta (potrebbe essere la
    // classe dell'immobile — signorile/civile/economica — non quella energetica).
    match: /\bclasse\s+energetica\s+([A-G][1-4]?\+{0,2})\b/i,
    value: (m) => m[1].toUpperCase(),
  },
  {
    key: "superficie",
    group: "principali",
    label: "Superficie",
    // Il soggetto deve essere l'IMMOBILE: senza questo vincolo "un soggiorno di 24 mq"
    // diventerebbe la superficie dell'intera casa.
    match: /\b(?:appartamento|attico|villa|villetta|immobile|abitazione|monolocale|bilocale|trilocale|quadrilocale|soluzione|propriet[àa]|casa|terreno|negozio|ufficio|capannone)\b[^.;!?]{0,60}?\bdi\s+(circa\s+)?(\d{2,4})\s*(?:mq|m²|metri\s+quadri)\s*(?:commerciali|calpestabili)?/i,
    value: (m) => toSurface(m[2], Boolean(m[1])),
  },
];

// ── Estrazione dalla descrizione ────────────────────────────────────────────

/** Traccia interna dei conteggi visti, per rilevare le contraddizioni. */
interface Candidate {
  fact: PropertyFact;
  counted: boolean;
}

/**
 * Estrae fatti dalla descrizione già normalizzata (vedi ./description.ts).
 *
 * Regole:
 *  • una caratteristica NEGATA ("senza ascensore") non produce alcun fatto;
 *  • una caratteristica POTENZIALE o VICINA ("possibilità di box", "garage nelle vicinanze")
 *    non produce alcun fatto;
 *  • una caratteristica in frase IPOTETICA ("immagina un terrazzo") finisce in revisione;
 *  • due conteggi diversi sullo stesso dato ("due box" e "tre box") = contraddizione: nessun
 *    fatto pubblicato, la voce va in revisione.
 */
export function factsFromDescription(paragraphs: readonly string[]): FactsResult {
  const candidates = new Map<string, Candidate>();
  const review: FactReviewItem[] = [];
  const conflicting = new Set<string>();

  for (const segment of toSegments(paragraphs.join("\n"))) {
    for (const rule of DESCRIPTION_RULES) {
      const m = segment.match(rule.match);
      if (!m || m.index === undefined) continue;

      const before = segment.slice(0, m.index);
      const after = segment.slice(m.index + m[0].length);
      // Negato, solo potenziale, oppure ancora da realizzare → nessun fatto.
      if (NEGATION.test(before) || POTENTIAL.test(before) || POTENTIAL_AFTER.test(after)) continue;

      const value = rule.value?.(m);
      // Evidenza centrata sul match: è ciò che serve a chi rivede il report.
      const from = Math.max(0, m.index - 70);
      const to = Math.min(segment.length, m.index + m[0].length + 70);
      const evidence =
        (from > 0 ? "…" : "") + segment.slice(from, to).trim() + (to < segment.length ? "…" : "");

      if (HYPOTHETICAL.test(before)) {
        review.push({
          key: rule.key,
          reason: "ambiguo",
          detail: `"${rule.label}" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile.`,
          evidence,
        });
        continue;
      }

      const fact: PropertyFact = {
        key: rule.key,
        group: rule.group,
        label: rule.label,
        value,
        source: "descrizione",
        confidence: "alta",
        evidence,
      };

      const existing = candidates.get(rule.key);
      if (!existing) {
        candidates.set(rule.key, { fact, counted: Boolean(rule.counted) });
        continue;
      }
      // Conteggi discordanti sullo stesso dato → contraddizione, niente pubblicazione.
      if (rule.counted && value !== undefined && existing.fact.value !== undefined && existing.fact.value !== value) {
        conflicting.add(rule.key);
        review.push({
          key: rule.key,
          reason: "contraddittorio",
          detail: `"${rule.label}" vale sia ${existing.fact.value} sia ${value} nella stessa descrizione.`,
          evidence,
        });
        continue;
      }
      // Prima occorrenza senza valore, seconda con valore → si tiene la più precisa.
      if (existing.fact.value === undefined && value !== undefined) {
        candidates.set(rule.key, { fact, counted: Boolean(rule.counted) });
      }
    }
  }

  const facts = [...candidates.values()]
    .filter((c) => !conflicting.has(c.fact.key))
    .map((c) => c.fact);

  return { facts, review };
}

// ── Merge secondo la gerarchia delle fonti ──────────────────────────────────

/**
 * Unisce più elenchi di fatti in ordine di PRIORITÀ DECRESCENTE (il primo vince).
 *
 * Arricchimento: se il fatto prioritario afferma solo la presenza (nessun valore) e uno
 * successivo porta un valore, si tiene il valore — le due fonti non si contraddicono, la
 * seconda è semplicemente più precisa. La provenienza registrata è quella del valore.
 */
export function mergeFacts(...sourcesByPriority: readonly (readonly PropertyFact[])[]): PropertyFact[] {
  const merged = new Map<string, PropertyFact>();

  for (const source of sourcesByPriority) {
    for (const fact of source) {
      const existing = merged.get(fact.key);
      if (!existing) {
        merged.set(fact.key, fact);
        continue;
      }
      if (existing.value === undefined && fact.value !== undefined) {
        merged.set(fact.key, { ...fact, confidence: existing.confidence });
      }
    }
  }

  const order = new Map(FACT_GROUPS.map((g, i) => [g, i]));
  return [...merged.values()].sort(
    (a, b) => (order.get(a.group) ?? 0) - (order.get(b.group) ?? 0),
  );
}

/** Raggruppa i fatti pubblicabili per gruppo, saltando i gruppi vuoti. */
export function groupFacts(facts: readonly PropertyFact[]): { group: FactGroup; facts: PropertyFact[] }[] {
  return FACT_GROUPS.map((group) => ({
    group,
    facts: facts.filter((f) => f.group === group && f.confidence === "alta"),
  })).filter((entry) => entry.facts.length > 0);
}

// ── Fonte #2: campi espliciti RealSmart ─────────────────────────────────────

/**
 * Normalizza il piano del gestionale in un'etichetta leggibile.
 * Valori reali del feed: "T", "t", "1", "2", "T/1", "T/1/2", "1-2", "s1".
 */
function floorLabel(raw: string | undefined): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  const parts = value.split(/[/\-–]/).map((p) => p.trim()).filter(Boolean);
  const labels = parts.map((part) => {
    if (/^t$/i.test(part)) return "terra";
    if (/^r$/i.test(part)) return "rialzato";
    if (/^s\d?$/i.test(part)) return "seminterrato";
    if (/^\d{1,2}$/.test(part)) return `${part}°`;
    return part;
  });
  if (labels.length === 0) return undefined;
  const joined = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

/** Anagrafica di un fatto: chiave stabile, gruppo di appartenenza, etichetta. */
export interface FactMeta {
  key: string;
  group: FactGroup;
  label: string;
}

/** Fatti che nascono da un campo esplicito del gestionale (non da una regola di testo). */
const FIELD_FACT_META: readonly FactMeta[] = [
  { key: "tipologia", group: "principali", label: "Tipologia" },
  { key: "contratto", group: "principali", label: "Contratto" },
  { key: "superficie", group: "principali", label: "Superficie" },
  { key: "locali", group: "principali", label: "Locali" },
  { key: "camere", group: "principali", label: "Camere" },
  { key: "bagni", group: "principali", label: "Bagni" },
  { key: "piano", group: "principali", label: "Piano" },
  { key: "classeEnergetica", group: "principali", label: "Classe energetica" },
  { key: "mqTerrazzo", group: "esterni", label: "Superficie terrazzi" },
  { key: "mqGiardino", group: "esterni", label: "Superficie giardino" },
  { key: "impiantoTermico", group: "comfort", label: "Impianto termico" },
];

/**
 * CATALOGO delle chiavi conosciute: unione dei fatti da campo e delle regole sulla descrizione.
 * È la lista che gli override manuali possono indirizzare senza dichiarare gruppo ed etichetta.
 */
export const FACT_CATALOG: ReadonlyMap<string, FactMeta> = new Map(
  [
    ...FIELD_FACT_META,
    ...DESCRIPTION_RULES.map((r) => ({ key: r.key, group: r.group, label: r.label })),
  ].map((meta) => [meta.key, meta]),
);

/** Costruttore conciso di un fatto proveniente da un campo del gestionale. */
function fieldFact(key: string, value?: string): PropertyFact {
  const meta = FACT_CATALOG.get(key);
  if (!meta) throw new Error(`[facts] chiave sconosciuta nel catalogo: "${key}"`);
  return { key, group: meta.group, label: meta.label, value, source: "realsmart", confidence: "alta" };
}

/** Ambienti del gestionale → PRESENZA di uno spazio (mai un conteggio: vedi RealSmartRoom). */
const ROOM_TO_FACT: readonly { match: RegExp; key: string }[] = [
  { match: /cucina\s+abitabile/i, key: "cucinaAbitabile" },
  { match: /lavanderia/i, key: "lavanderia" },
  { match: /matrimoniale/i, key: "cameraMatrimoniale" },
  { match: /^studio$/i, key: "studio" },
  { match: /taverna/i, key: "taverna" },
  { match: /cantina/i, key: "cantina" },
  { match: /ripostiglio/i, key: "ripostiglio" },
  { match: /sottotetto|mansarda/i, key: "sottotetto" },
  { match: /^balcon[ei]$/i, key: "balconi" },
];

/** Input minimo per i fatti da campo: solo ciò che serve, così la funzione resta testabile. */
export interface FieldFactsInput {
  tipologia?: string;
  contratto?: string;
  mq?: number;
  locali?: number;
  camere?: number;
  bagni?: number;
  piano?: string;
  classeEnergetica?: string;
  statoAttestatoEnergetico?: string;
  dettagli?: {
    riscaldamento?: string;
    ariaCondizionata?: boolean;
    ascensore?: boolean;
    terrazzo?: boolean;
    mqTerrazzo?: number;
    giardino?: boolean;
    tipoGiardino?: string;
    mqGiardino?: number;
    box?: boolean;
    postoAuto?: boolean;
    ambienti?: { descrizione: string; qta: number }[];
  };
}

/**
 * Fatti dai CAMPI espliciti del gestionale (fonte #2).
 *
 * Regole non negoziabili:
 *  • le camere arrivano solo da <Camere>: mai calcolate come "locali - 1";
 *  • un campo assente non produce alcun fatto (niente "—", niente "No");
 *  • un flag esplicito "No" non produce un fatto negativo: semplicemente non c'è il fatto;
 *  • nessun conteggio viene dedotto: i campi dicono la PRESENZA, i numeri arrivano dalla
 *    descrizione (o da un override).
 */
export function factsFromFields(input: FieldFactsInput): PropertyFact[] {
  const facts: PropertyFact[] = [];
  const d = input.dettagli ?? {};

  // ── DATI PRINCIPALI ──
  if (input.tipologia) facts.push(fieldFact("tipologia", input.tipologia));
  if (input.contratto) {
    const c = input.contratto.toLowerCase() === "affitto" ? "Affitto" : "Vendita";
    facts.push(fieldFact("contratto", c));
  }
  if (input.mq && input.mq > 0) facts.push(fieldFact("superficie", `${input.mq} m²`));
  if (input.locali && input.locali > 0) facts.push(fieldFact("locali", String(input.locali)));
  if (input.camere && input.camere > 0) facts.push(fieldFact("camere", String(input.camere)));
  if (input.bagni && input.bagni > 0) facts.push(fieldFact("bagni", String(input.bagni)));
  const floor = floorLabel(input.piano);
  if (floor) facts.push(fieldFact("piano", floor));
  if (input.classeEnergetica) {
    facts.push(fieldFact("classeEnergetica", input.classeEnergetica));
  } else if (input.statoAttestatoEnergetico) {
    // L'APE non ancora emesso è un'informazione onesta e legalmente rilevante: si dichiara.
    facts.push(fieldFact("classeEnergetica", input.statoAttestatoEnergetico));
  }

  // ── ESTERNI E PERTINENZE ──
  if (d.terrazzo) facts.push(fieldFact("terrazzi"));
  if (d.mqTerrazzo && d.mqTerrazzo > 0) {
    facts.push(fieldFact("mqTerrazzo", `${d.mqTerrazzo} m²`));
  }
  if (d.giardino) {
    facts.push(fieldFact("giardino", d.tipoGiardino?.toLowerCase()));
  }
  if (d.mqGiardino && d.mqGiardino > 0) {
    facts.push(fieldFact("mqGiardino", `${d.mqGiardino} m²`));
  }
  if (d.box) facts.push(fieldFact("autorimesse"));
  if (d.postoAuto) facts.push(fieldFact("postiAuto"));

  // ── COMFORT E IMPIANTI ──
  if (d.ascensore) facts.push(fieldFact("ascensore"));
  if (d.ariaCondizionata) facts.push(fieldFact("ariaCondizionata"));
  if (d.riscaldamento) {
    // Asse diverso da "riscaldamento a pavimento" (che descrive la DISTRIBUZIONE): qui c'è la
    // gestione dell'impianto. I due fatti convivono senza duplicarsi.
    facts.push(fieldFact("impiantoTermico", d.riscaldamento.toLowerCase()));
  }

  // ── SPAZI / PERTINENZE dagli ambienti censiti ──
  for (const room of d.ambienti ?? []) {
    const rule = ROOM_TO_FACT.find((r) => r.match.test(room.descrizione.trim()));
    if (rule && !facts.some((f) => f.key === rule.key)) {
      facts.push(fieldFact(rule.key));
    }
  }

  return facts;
}
