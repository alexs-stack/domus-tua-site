// Suite di CONFORMITÀ dei provider (Prompt 11): il contratto di verità/provenienza che OGNI provider
// deve rispettare, ora e in futuro. Non è un test: è una libreria di verifiche riusabile dai test dei
// singoli provider (fake, osm, …). Un nuovo provider è «conforme» solo se `runConformance` non
// restituisce violazioni sullo scenario standard.
//
// Il contratto (perché il territorio resti veritiero):
//  1. ogni luogo ha un providerId stabile e non vuoto;
//  2. la categoria è tra quelle richieste (nessuna categoria «di troppo»);
//  3. il nome è SICURO (supera normalizeProviderName: niente controlli/HTML/injection);
//  4. c'è EVIDENZA di classificazione (tag chiave/valore) — nessun POI senza provenienza;
//  5. il provider dichiarato coincide con quello atteso;
//  6. retrievedAt è un timestamp ISO valido;
//  7. la coordinata è valida ed ENTRO il raggio richiesto;
//  8. nessun providerId duplicato (deduplica applicata);
//  9. i risultati sono ordinati per distanza crescente (deterministico);
// 10. il limite, se richiesto, è rispettato.

import { assertValidCoord, haversineMeters, type GeoCoord } from "../geo";
import { TERRITORY_POI_CATEGORIES, type TerritoryPoiCategory } from "../categories";
import {
  ProviderDisabledError,
  normalizeProviderName,
  type ProviderPlace,
  type SearchNearbyInput,
  type TerritoryPlacesProvider,
} from "./provider";

export interface ConformanceScenario {
  origin: GeoCoord;
  radiusMeters: number;
  categories: TerritoryPoiCategory[];
  limit?: number;
}

/** Scenario standard attorno a un'origine: tutte le categorie, raggio tipico. */
export function standardScenario(origin: GeoCoord, radiusMeters = 1500): ConformanceScenario {
  return { origin, radiusMeters, categories: [...TERRITORY_POI_CATEGORIES] };
}

/** Verifiche PURE sul risultato di una ricerca. Ritorna l'elenco delle violazioni (vuoto = conforme). */
export function checkPlacesContract(
  places: ProviderPlace[],
  input: Pick<SearchNearbyInput, "origin" | "radiusMeters" | "categories">,
  expectedProvider: TerritoryPlacesProvider["name"],
): string[] {
  const v: string[] = [];
  const requested = new Set(input.categories);
  const seenIds = new Set<string>();
  let prevDistance = -1;

  for (const [i, p] of places.entries()) {
    const at = `#${i} (${p.providerId})`;
    if (!p.providerId || p.providerId.trim().length === 0) v.push(`${at}: providerId vuoto`);
    if (!TERRITORY_POI_CATEGORIES.includes(p.category)) v.push(`${at}: categoria non valida ${p.category}`);
    if (!requested.has(p.category)) v.push(`${at}: categoria ${p.category} non richiesta`);
    if (normalizeProviderName(p.name) !== p.name) v.push(`${at}: nome non sicuro/normalizzato "${p.name}"`);
    if (!p.evidence || !p.evidence.key || !p.evidence.value) v.push(`${at}: evidenza di classificazione assente`);
    if (p.provider !== expectedProvider) v.push(`${at}: provider ${p.provider} ≠ ${expectedProvider}`);
    if (Number.isNaN(Date.parse(p.retrievedAt))) v.push(`${at}: retrievedAt non ISO "${p.retrievedAt}"`);

    try {
      assertValidCoord(p.coord);
      const d = haversineMeters(input.origin, p.coord);
      if (d > input.radiusMeters + 1) v.push(`${at}: fuori raggio (${Math.round(d)} m > ${input.radiusMeters} m)`);
      if (d < prevDistance - 1) v.push(`${at}: ordine per distanza violato (${Math.round(d)} m dopo ${Math.round(prevDistance)} m)`);
      prevDistance = d;
    } catch {
      v.push(`${at}: coordinata non valida`);
    }

    if (seenIds.has(p.providerId)) v.push(`${at}: providerId duplicato`);
    seenIds.add(p.providerId);
  }
  return v;
}

/**
 * Esegue lo scenario standard su un provider ABILITATO e verifica il contratto. Il provider è
 * responsabile di restituire dati già filtrati/deduplicati/ordinati.
 */
export async function runConformance(
  provider: TerritoryPlacesProvider,
  scenario: ConformanceScenario,
): Promise<string[]> {
  const places = await provider.searchNearby({
    origin: scenario.origin,
    radiusMeters: scenario.radiusMeters,
    categories: scenario.categories,
    ...(scenario.limit !== undefined ? { limit: scenario.limit } : {}),
  });
  const violations = checkPlacesContract(places, scenario, provider.name);
  if (scenario.limit !== undefined && places.length > scenario.limit) {
    violations.push(`limite non rispettato: ${places.length} > ${scenario.limit}`);
  }
  if (!provider.attribution || provider.attribution.trim().length === 0) {
    violations.push("attribuzione mancante: obbligatoria e visibile");
  }
  return violations;
}

/**
 * Verifica che un provider DISABILITATO non chiami la rete e sollevi ProviderDisabledError.
 * `makeDisabled` costruisce l'istanza disabilitata (con la stessa `fetch` iniettata che conta le
 * chiamate). Ritorna le violazioni.
 */
export async function checkDisabledMakesNoCall(
  makeDisabled: () => TerritoryPlacesProvider,
  scenario: ConformanceScenario,
  callCount: () => number,
): Promise<string[]> {
  const v: string[] = [];
  const provider = makeDisabled();
  if (provider.enabled) v.push("il provider disabilitato risulta enabled=true");
  const before = callCount();
  let threw = false;
  try {
    await provider.searchNearby({ origin: scenario.origin, radiusMeters: scenario.radiusMeters, categories: scenario.categories });
  } catch (err) {
    threw = true;
    if (!(err instanceof ProviderDisabledError)) v.push(`errore atteso ProviderDisabledError, ricevuto ${(err as Error).name}`);
  }
  if (!threw) v.push("un provider disabilitato deve sollevare un errore, non restituire dati");
  if (callCount() !== before) v.push("un provider disabilitato NON deve toccare la rete");
  return v;
}
