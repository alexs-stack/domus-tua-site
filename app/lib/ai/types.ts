// Tipi condivisi della ricerca AI.

import type { Property } from "../properties";

/**
 * Etichette caratteristiche cercabili.
 *
 * Corrispondono ESATTAMENTE all'insieme chiuso che il feed RealSmart espone (verificato sul
 * feed live: 193 immobili, sei sole caratteristiche). Cercare qualcosa che il gestionale non
 * fornisce produrrebbe risposte negative false — "no, non ha l'ascensore" quando il dato
 * semplicemente non esiste.
 *
 * Le prime quattro sono anche chip visibili in PropertySearch. Le ultime due no: il client
 * scarta in sicurezza le etichette che non conosce (`featureOptions.some(...)`), quindi
 * aggiungerle qui è additivo. Il sito potrebbe esporle in futuro — i dati le reggono
 * (ascensore su 50 immobili, aria condizionata su 68).
 */
export type FeatureLabel =
  | "Giardino"
  | "Box / posto auto"
  | "Terrazzo"
  | "Doppi servizi"
  | "Ascensore"
  | "Aria condizionata";

/**
 * Filtri estratti dalla frase in linguaggio naturale. Tutti opzionali: il modello
 * (o il parser locale) valorizza solo ciò di cui è ragionevolmente sicuro.
 * Lo shape rispecchia i filtri di PropertySearch, così il client li applica direttamente.
 */
export type ParsedSearch = {
  contract?: "Tutte" | "Vendita" | "Affitto";
  type?: "Tutte" | Property["type"];
  /** Deve combaciare con un comune disponibile; altrimenti ignorato dal client. */
  comune?: string;
  /** Tetto di prezzo in euro (per "sotto/fino a X"). 0 = nessun limite. */
  maxBudget?: number;
  /** Prezzo minimo in euro (per "sopra/oltre/almeno X"). 0 = nessun minimo. */
  minBudget?: number;
  /** Locali minimi. 0 = qualsiasi. */
  minRooms?: number;
  /** Superficie minima in m². 0 = qualsiasi. */
  minSqm?: number;
  /** Superficie massima in m². 0 = qualsiasi. */
  maxSqm?: number;
  /** Sottoinsieme delle etichette caratteristiche. */
  features?: FeatureLabel[];
  /** Termini liberi per il match testuale/ranking (es. "luminoso", "vista", "ristrutturato"). */
  keywords?: string[];
  /** Parte "descrittiva/di sensazione" della richiesta, usata per il ranking semantico. */
  semanticQuery?: string;
};

/** Facet disponibili passati al parser (derivati dagli immobili live, lato server). */
export type SearchFacets = {
  comuni: string[];
  types: string[];
  featureLabels: FeatureLabel[];
};

/** Risposta di /api/search. */
export type SearchResponse = {
  ok: boolean;
  reason?: string;
  filters?: ParsedSearch;
  /** Slug ordinati per rilevanza (semantica o per parole chiave). Assente = ordine di default. */
  rankedSlugs?: string[];
  /** Da dove arriva il parsing: "ai" (Claude) o "local" (euristica). */
  source?: "ai" | "local";
  /** true se il ranking usa gli embeddings; false = parole chiave; assente = nessun ranking. */
  semantic?: boolean;
};
