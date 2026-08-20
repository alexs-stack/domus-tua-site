// Conoscenza di ZONA — dataset CURATO e separato dai fatti dell'immobile.
//
// Mandato: "Treat area/city information as a separate curated dataset with source URLs, retrieval
// date, geographic scope, and approved facts. Do not scrape or perform live web research in a user
// request." E: il chatbot può combinare fatti immobile + fatti di zona, ma deve distinguere
// "su questo immobile" da "sulla zona".
//
// Qui c'è SOLO la struttura tipizzata + la validazione. Il dataset è VUOTO: nessun fatto di zona
// inventato. Il cliente (o un curatore) lo popola con fatti approvati e la loro fonte. La copy
// generata (generate.ts) NON usa questi fatti: la zona non è nell'incarico della riscrizione.

export type AreaScope = "comune" | "quartiere" | "provincia";

export interface AreaFact {
  /** Comune/zona a cui il fatto si riferisce (chiave di lookup). */
  comune: string;
  scope: AreaScope;
  /** Il fatto approvato, in italiano. Es. "La stazione di Tradate è sulla linea Milano–Varese." */
  fact: string;
  /** Da dove viene il fatto: URL della fonte (obbligatorio). */
  sourceUrl: string;
  /** Data di recupero della fonte (ISO YYYY-MM-DD): la conoscenza di zona invecchia. */
  retrievedAt: string;
  /** Chi ha approvato il fatto (audit). */
  approvedBy: string;
}

/**
 * Dataset di zona APPROVATO. VUOTO di proposito: nessun fatto sulla città è inventato dal sito.
 * Popolare con fatti verificati e la loro fonte prima di attivarlo nell'assistente.
 */
export const AREA_FACTS: readonly AreaFact[] = [];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^https?:\/\/.+/i;

/** Ogni fatto di zona deve avere testo, fonte (URL), data di recupero e approvatore. */
export function validateAreaFacts(facts: readonly AreaFact[]): string[] {
  const errors: string[] = [];
  facts.forEach((f, i) => {
    const at = `areaFacts[${i}]`;
    if (!f.comune?.trim()) errors.push(`${at}: comune mancante`);
    if (!f.fact?.trim()) errors.push(`${at}: fact mancante`);
    if (!URL_RE.test(f.sourceUrl ?? "")) errors.push(`${at}: sourceUrl non è un URL`);
    if (!ISO_DATE.test(f.retrievedAt ?? "")) errors.push(`${at}: retrievedAt non è una data ISO`);
    if (!f.approvedBy?.trim()) errors.push(`${at}: approvedBy mancante`);
  });
  return errors;
}

/** Fatti di zona approvati per un comune (case-insensitive). Vuoto se non curato. */
export function areaFactsFor(comune: string, facts: readonly AreaFact[] = AREA_FACTS): AreaFact[] {
  const c = comune.trim().toLowerCase();
  return facts.filter((f) => f.comune.trim().toLowerCase() === c);
}
