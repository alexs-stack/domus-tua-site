// Lettura PUBBLICA e cacheata del territorio per la pagina immobile (Prompt 15) — SERVER-ONLY.
//
// Obiettivi di prestazione:
//   • dato letto SERVER-SIDE dallo store APPROVATO, mai un provider al render (constraint 1/9);
//   • proiezione al payload pubblico PIÙ PICCOLO possibile: niente coordinate, niente storico di
//     approvazione, niente categorie inutili, niente record privato (constraint 2);
//   • cache con TAG mirati (constraint 7): un'approvazione invalida SOLO le pagine toccate;
//   • a feature spenta ritorna null → costo client effettivamente ZERO (constraint acceptance).

import { unstable_cache } from "next/cache";
import { toPublicListingTerritory } from "./public";
import { getPublicAreaProfile } from "./area/data";
import { createTerritoryRepository } from "./store/config";
import { readEnrichmentConfig } from "./config";
import { isPublicSectionEnabled } from "./flags";
import { normalizeMunicipality } from "./geo";
import { sinkFromEnv } from "./observe";
import type { PublicListingTerritory } from "./types";
import type { PublicAreaProfile } from "./area/types";
import type { KnowledgeLocale } from "./area/types";

/** Tag di cache per un immobile e per il profilo del suo comune. Puro e testabile. */
export function territoryCacheTags(realSmartCode: string, municipality?: string): string[] {
  const tags = ["territory", `territory:listing:${realSmartCode}`];
  if (municipality) tags.push(`territory:profile:${normalizeMunicipality(municipality)}`);
  return tags;
}

/**
 * Legge (senza cache) il territorio pubblico di un immobile dallo store approvato. Ritorna il payload
 * minimo o null (non approvato/stale/assente/feature spenta). Nessuna chiamata a provider.
 */
async function readPublicTerritory(slug: string): Promise<PublicListingTerritory | null> {
  const repo = createTerritoryRepository();
  const record = await repo.getListingEnrichment(slug);
  if (!record) return null;
  const config = readEnrichmentConfig();
  // toPublicListingTerritory applica: approvato + fresco + POI approvati + ≤2/categoria + NIENTE coord.
  return toPublicListingTerritory(record, { now: new Date(), freshnessDays: config.freshnessDays, maxPerCategory: config.maxPerCategory });
}

/**
 * Versione CACHEATA con tag mirati. La chiave include lo slug; i tag includono lo slug e il comune,
 * così `revalidateTag("territory:listing:<slug>")` invalida SOLO quella pagina (e
 * `territory:profile:<comune>` invalida le pagine di quel comune). La revalidazione a livello di
 * comune serve quando cambia il profilo condiviso; quella per immobile per un'approvazione singola.
 *
 * NB: i tag di comune non si conoscono prima di leggere il record, quindi la voce di cache porta il
 * tag generico "territory" e quello per-immobile; l'invalidazione per comune passa da "territory"
 * oppure dal tag immobile. Per un'invalidazione mirata per comune si usa la mappa comune→slug del
 * chiamante (o si invalida "territory").
 */
export async function getPublicListingTerritory(slug: string): Promise<PublicListingTerritory | null> {
  // Feature spenta: nessuna lettura, nessun payload → zero costo lato client.
  if (!isPublicSectionEnabled()) return null;

  const cached = unstable_cache(
    async (s: string) => readPublicTerritory(s),
    ["territory-public-listing", slug],
    { tags: territoryCacheTags(slug), revalidate: 3600 },
  );
  const result = await cached(slug);
  // Impression della sezione pubblica: emessa SOLO quando c'è davvero qualcosa da mostrare. Solo il
  // comune "grosso" (già pubblico), nessun identificativo utente, nessuna coordinata.
  if (result) sinkFromEnv().emit({ kind: "public-impression", municipality: result.municipality });
  return result;
}

/**
 * DESCRIZIONI d'area pubbliche del comune (fatti verificati), lette server-side e cacheate con il tag
 * del profilo del comune. Null a feature spenta o senza fatti approvati. Nessuna coordinata.
 */
export async function getPublicAreaProfileFor(
  municipality: string,
  locale: KnowledgeLocale = "it",
): Promise<PublicAreaProfile | null> {
  if (!isPublicSectionEnabled()) return null;
  const slug = normalizeMunicipality(municipality);
  const cached = unstable_cache(
    async (m: string) => getPublicAreaProfile(m, { now: new Date(), locale }),
    ["territory-public-area", slug, locale],
    { tags: ["territory", `territory:profile:${slug}`], revalidate: 3600 },
  );
  return cached(slug);
}
