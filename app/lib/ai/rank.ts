// Filtro server-side + ranking dei risultati.
//  - applyFilters: rispecchia la logica di PropertySearch (fonte unica del comportamento).
//  - ranking: semantico (embeddings) se disponibile, altrimenti per parole chiave.
// I vettori degli immobili sono calcolati una volta e messi in cache (unstable_cache).

import { unstable_cache } from "next/cache";
import { getVisibleListings } from "../listings";
import type { Property } from "../properties";
import { embed, cosine } from "./embeddings";
import { semanticEnabled } from "./config";
import type { ParsedSearch } from "./types";

// Stesse regole di match delle caratteristiche usate dal client (PropertySearch featureOptions).
const FEATURE_MATCH: Record<string, string[]> = {
  Giardino: ["giardino"],
  "Box / posto auto": ["box", "posto auto"],
  Terrazzo: ["terrazz"],
  "Doppi servizi": ["2 bagni", "doppi servizi"],
};

function roomsNum(p: Property) {
  return parseInt(p.rooms, 10) || 0;
}
function sqmNum(p: Property) {
  return parseInt(p.sqm, 10) || 0; // "120 m²" -> 120; "—" -> 0
}
function haystack(p: Property) {
  return `${p.features.join(" ")} ${p.excerpt} ${p.badges.join(" ")}`.toLowerCase();
}

/** Applica i filtri strutturati agli immobili (stessa semantica del client). */
export function applyFilters(properties: Property[], f: ParsedSearch): Property[] {
  return properties.filter((p) => {
    if (f.contract && f.contract !== "Tutte" && p.status !== f.contract) return false;
    if (f.type && f.type !== "Tutte" && p.type !== f.type) return false;
    if (f.comune && f.comune !== "Tutti" && p.zone.split(",")[0].trim() !== f.comune) return false;
    if (f.maxBudget && (p.priceValue <= 0 || p.priceValue > f.maxBudget)) return false;
    if (f.minBudget && (p.priceValue <= 0 || p.priceValue < f.minBudget)) return false;
    if (f.minRooms && roomsNum(p) < f.minRooms) return false;
    if (f.minSqm && (sqmNum(p) <= 0 || sqmNum(p) < f.minSqm)) return false;
    if (f.maxSqm && (sqmNum(p) <= 0 || sqmNum(p) > f.maxSqm)) return false;
    if (f.features && f.features.length) {
      const hay = haystack(p);
      const ok = f.features.every((label) => {
        const match = FEATURE_MATCH[label];
        return match ? match.some((m) => hay.includes(m)) : true;
      });
      if (!ok) return false;
    }
    return true;
  });
}

/** Testo rappresentativo di un immobile per l'embedding. */
function listingText(p: Property): string {
  return `${p.title}. ${p.type} a ${p.zone}. ${p.excerpt} ${p.features.join(", ")}`.trim();
}

/**
 * Vettori di TUTTI gli immobili visibili, calcolati una volta e messi in cache.
 * Ritorna una mappa slug -> vettore, oppure null se gli embeddings non sono disponibili.
 * Rivalidazione allineata alla finestra dei listing (12 min): un vettore può essere
 * leggermente stantìo tra un aggiornamento e l'altro, ininfluente per il ranking.
 */
const loadListingVectors = async (): Promise<Record<string, number[]> | null> => {
  const listings = await getVisibleListings();
  const texts = listings.map(listingText);
  const vectors = await embed(texts, "document");
  if (!vectors) return null;
  const map: Record<string, number[]> = {};
  listings.forEach((p, i) => {
    if (vectors[i]) map[p.slug] = vectors[i];
  });
  return map;
};

export const getListingVectors = unstable_cache(loadListingVectors, ["listing-vectors-v1"], {
  revalidate: 12 * 60,
  tags: ["realsmart-listings"],
});

/** Ranking per parole chiave: quante keyword compaiono nel testo dell'immobile. Stabile. */
function rankByKeywords(candidates: Property[], keywords: string[]): string[] {
  const kws = keywords.map((k) => k.toLowerCase()).filter((k) => k.length > 2);
  if (!kws.length) return candidates.map((p) => p.slug);
  const scored = candidates.map((p, i) => {
    const hay = `${p.title} ${listingText(p)}`.toLowerCase();
    const score = kws.reduce((s, k) => (hay.includes(k) ? s + 1 : s), 0);
    return { slug: p.slug, score, i };
  });
  // Ordina per punteggio decrescente, poi per ordine originale (stabile).
  scored.sort((a, b) => (b.score - a.score) || (a.i - b.i));
  return scored.map((s) => s.slug);
}

/**
 * Ordina i candidati per rilevanza rispetto alla query.
 * Prova il ranking semantico (embeddings); se non disponibile, usa le parole chiave.
 */
export async function rankResults(
  candidates: Property[],
  parsed: ParsedSearch,
): Promise<{ slugs: string[]; semantic: boolean }> {
  const query = (parsed.semanticQuery || parsed.keywords?.join(" ") || "").trim();

  if (semanticEnabled && query && candidates.length > 1) {
    const [vectors, queryVec] = await Promise.all([getListingVectors(), embed([query], "query")]);
    if (vectors && queryVec && queryVec[0]) {
      const q = queryVec[0];
      const scored = candidates
        .map((p, i) => ({ slug: p.slug, i, score: vectors[p.slug] ? cosine(q, vectors[p.slug]) : -1 }))
        .sort((a, b) => (b.score - a.score) || (a.i - b.i));
      return { slugs: scored.map((s) => s.slug), semantic: true };
    }
  }

  return { slugs: rankByKeywords(candidates, parsed.keywords || []), semantic: false };
}
