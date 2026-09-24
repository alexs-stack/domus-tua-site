// Provider FAKE: deterministico, senza rete. Serve ai test e al dry-run dei CLI.
//
// Due modalità:
//  • con `places` esplicite → restituisce quelle entro il raggio e nelle categorie richieste;
//  • senza → genera POI sintetici stabili attorno all'origine (offset fissi per categoria).
// Ha knob per SIMULARE i fallimenti (rate-limit, errore) così il motore (Prompt 5) può testare i
// percorsi d'errore senza toccare la rete. Nessun dato reale di immobili/utenti: solo sintetico.

import { haversineMeters, type GeoCoord } from "../geo";
import { TERRITORY_POI_CATEGORIES, type TerritoryPoiCategory } from "../categories";
import {
  ProviderDisabledError,
  ProviderRateLimitError,
  dedupePlaces,
  filterWithinRadius,
  sortByDistance,
  type ProviderPlace,
  type SearchNearbyInput,
  type TerritoryPlacesProvider,
} from "./provider";

const FAKE_RETRIEVED_AT = "2026-08-13T00:00:00.000Z";
const FAKE_ATTRIBUTION = "© Dati sintetici di test";

/** Un luogo sintetico assoluto (coordinata reale), indipendente da un'origine. */
export interface FakePlace {
  providerId: string;
  category: TerritoryPoiCategory;
  name: string;
  coord: GeoCoord;
  sourceUrl?: string;
  /** Evidenza di classificazione (opzionale): se assente, se ne genera una sintetica stabile. */
  evidence?: { key: string; value: string };
}

export interface FakeProviderOptions {
  /** Dataset esplicito. Se assente, si generano POI sintetici attorno a ogni origine. */
  places?: FakePlace[];
  /** Simula HTTP 429. */
  rateLimited?: boolean;
  /** Simula un errore arbitrario (es. risposta malformata). */
  failWith?: Error;
  /** Categorie da NON restituire (simula copertura parziale del provider). */
  omitCategories?: TerritoryPoiCategory[];
  enabled?: boolean;
  /** Orologio fisso per il retrievedAt (determinismo). */
  retrievedAt?: string;
}

/** Offset deterministici (gradi) per categoria: ~50–350 m dall'origine, stabili tra i run. */
const OFFSETS: Record<TerritoryPoiCategory, Array<{ dLat: number; dLng: number; name: string }>> = {
  "railway-station": [{ dLat: 0.0028, dLng: 0.0009, name: "Stazione di Prova" }],
  pharmacy: [
    { dLat: 0.0007, dLng: 0.0006, name: "Farmacia Alfa" },
    { dLat: 0.0015, dLng: -0.0004, name: "Farmacia Beta" },
  ],
  supermarket: [
    { dLat: -0.0009, dLng: 0.0012, name: "Supermercato Centro" },
    { dLat: 0.002, dLng: 0.0018, name: "Supermercato Nord" },
  ],
  school: [{ dLat: -0.0012, dLng: -0.001, name: "Scuola Primaria di Prova" }],
  park: [
    { dLat: 0.0005, dLng: -0.0016, name: "Parco Comunale" },
    { dLat: -0.0022, dLng: 0.0005, name: "Parco delle Rimembranze" },
  ],
};

/** Genera POI sintetici stabili attorno a un'origine, per le categorie richieste. */
function syntheticPlaces(origin: GeoCoord, categories: TerritoryPoiCategory[]): FakePlace[] {
  const out: FakePlace[] = [];
  for (const category of TERRITORY_POI_CATEGORIES) {
    if (!categories.includes(category)) continue;
    OFFSETS[category].forEach((o, i) => {
      out.push({
        providerId: `fake/${category}/${i}`,
        category,
        name: o.name,
        coord: { lat: origin.lat + o.dLat, lng: origin.lng + o.dLng },
      });
    });
  }
  return out;
}

export class FakePlacesProvider implements TerritoryPlacesProvider {
  readonly name = "fake" as const;
  readonly attribution = FAKE_ATTRIBUTION;
  readonly enabled: boolean;

  constructor(private readonly options: FakeProviderOptions = {}) {
    this.enabled = options.enabled ?? true;
  }

  async searchNearby(input: SearchNearbyInput): Promise<ProviderPlace[]> {
    if (!this.enabled) throw new ProviderDisabledError("fake");
    if (this.options.rateLimited) throw new ProviderRateLimitError("fake");
    if (this.options.failWith) throw this.options.failWith;

    input.signal?.throwIfAborted();

    const retrievedAt = this.options.retrievedAt ?? FAKE_RETRIEVED_AT;
    const omit = new Set(this.options.omitCategories ?? []);
    const requested = input.categories.filter((c) => !omit.has(c));

    const source = this.options.places ?? syntheticPlaces(input.origin, requested);

    const mapped: ProviderPlace[] = source
      .filter((p) => requested.includes(p.category))
      .map((p) => ({
        providerId: p.providerId,
        category: p.category,
        name: p.name,
        coord: p.coord,
        provider: "fake" as const,
        evidence: p.evidence ?? { key: "fake", value: p.category },
        retrievedAt,
        ...(p.sourceUrl ? { sourceUrl: p.sourceUrl } : {}),
      }));

    const withinRadius = filterWithinRadius(mapped, input.origin, input.radiusMeters);
    const deduped = sortByDistance(dedupePlaces(withinRadius), input.origin);
    return typeof input.limit === "number" ? deduped.slice(0, input.limit) : deduped;
  }
}

/** Distanza sintetica utile ai test (in metri) tra origine e un FakePlace. */
export function fakeDistance(origin: GeoCoord, place: FakePlace): number {
  return haversineMeters(origin, place.coord);
}
