// Filtro server-side + ranking dei risultati.
//  - applyFilters: rispecchia la logica di PropertySearch (fonte unica del comportamento).
//  - ranking: semantico (embeddings) se disponibile, altrimenti per parole chiave.
// I vettori degli immobili sono calcolati una volta e messi in cache (unstable_cache).

import { unstable_cache } from "next/cache";
import { getVisibleListings } from "../listings";
import { matchesComune } from "../comune";
import { isAvailable } from "../availability";
import type { GridProperty, Property } from "../properties";
import { embed, cosine } from "./embeddings";
import { semanticEnabled } from "./config";
import type { ParsedSearch } from "./types";

// Stesse regole di match delle caratteristiche usate dal client (PropertySearch featureOptions).
const FEATURE_MATCH: Record<string, string[]> = {
  Giardino: ["giardino"],
  "Box / posto auto": ["box", "posto auto"],
  Terrazzo: ["terrazz"],
  "Doppi servizi": ["2 bagni", "doppi servizi"],
  // Presenti nel feed RealSmart ma non tra i chip visibili del sito: le usa l'assistente.
  Ascensore: ["ascensore"],
  "Aria condizionata": ["aria condizionata", "climatizz"],
};

function roomsNum(p: Pick<Property, "rooms">) {
  return parseInt(p.rooms, 10) || 0;
}
function sqmNum(p: Pick<Property, "sqm">) {
  return parseInt(p.sqm, 10) || 0; // "120 m²" -> 120; "—" -> 0
}
function haystack(p: Pick<Property, "features" | "excerpt" | "badges">) {
  return `${p.features.join(" ")} ${p.excerpt} ${p.badges.join(" ")}`.toLowerCase();
}

/** Applica i filtri strutturati agli immobili (stessa semantica del client). */
// Generico sui campi: accetta sia l'immobile completo sia la proiezione da griglia
// (app/lib/properties.ts → GridProperty), senza duplicare la logica dei filtri.
export function applyFilters<T extends GridProperty>(properties: T[], f: ParsedSearch): T[] {
  return properties.filter((p) => {
    if (!isAvailable(p)) return false; // la ricerca (anche AI) mostra solo immobili disponibili
    if (f.contract && f.contract !== "Tutte" && p.status !== f.contract) return false;
    if (f.type && f.type !== "Tutte" && p.type !== f.type) return false;
    if (f.comune && f.comune !== "Tutti" && !matchesComune(p.zone, f.comune)) return false;
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
function listingText(p: Pick<Property, "title" | "type" | "zone" | "excerpt" | "features">): string {
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
function rankByKeywords(
  candidates: Pick<Property, "slug" | "title" | "type" | "zone" | "excerpt" | "features">[],
  keywords: string[],
): string[] {
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
 *
 * Il percorso semantico è avvolto in un try/catch, e non è prudenza generica: `embed` è già
 * difensiva e ritorna null sui suoi errori, ma `getListingVectors` è avvolta in
 * `unstable_cache`, che LANCIA fuori da un contesto di richiesta Next ("Invariant:
 * incrementalCache missing"). Finché non c'era un provider di embeddings il ramo non veniva
 * mai eseguito e la cosa non si vedeva; da quando gli embeddings esistono (2026-08-06, via
 * Gemini) qualunque chiamata fuori da una request — uno script, un eval, un job — faceva
 * fallire l'INTERA ricerca, non solo il ranking.
 *
 * L'ordinamento semantico è un miglioramento dell'ordine, mai un prerequisito per avere dei
 * risultati: se salta, si ordina per parole chiave e l'utente vede comunque le sue case.
 */
export async function rankResults(
  candidates: Pick<Property, "slug" | "title" | "type" | "zone" | "excerpt" | "features">[],
  parsed: ParsedSearch,
): Promise<{ slugs: string[]; semantic: boolean }> {
  const query = (parsed.semanticQuery || parsed.keywords?.join(" ") || "").trim();

  if (semanticEnabled && query && candidates.length > 1) {
    try {
      const [vectors, queryVec] = await Promise.all([getListingVectors(), embed([query], "query")]);
      if (vectors && queryVec && queryVec[0]) {
        const q = queryVec[0];
        const scored = candidates
          .map((p, i) => ({ slug: p.slug, i, score: vectors[p.slug] ? cosine(q, vectors[p.slug]) : -1 }))
          .sort((a, b) => (b.score - a.score) || (a.i - b.i));
        return { slugs: scored.map((s) => s.slug), semantic: true };
      }
    } catch (err) {
      console.error(
        "[search] ranking semantico non disponibile, si prosegue per parole chiave:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { slugs: rankByKeywords(candidates, parsed.keywords || []), semantic: false };
}
