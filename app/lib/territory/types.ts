// Modello di dominio dell'arricchimento territoriale + validazione runtime (Zod v4).
//
// Due mondi, come per RealSmart:
//  • PRIVATO  → record completo lato server: può contenere la coordinata sorgente del POI e i
//               metadati del provider. Non finisce MAI nel bundle del browser.
//  • PUBBLICO → vista sicura e deterministica: nome, categoria, distanza in linea d'aria,
//               provider e attribuzione. Nessuna coordinata, nessun payload grezzo, nessun ID
//               interno inutile alla UI.
//
// Gli schemi Zod sono la fonte di verità: i tipi TypeScript sono inferiti da essi, così validazione
// a runtime e tipi a compile-time non possono divergere. Tutti gli oggetti sono `.strict()`:
// un campo inatteso (es. una coordinata che trapela nel pubblico) è un errore, non un dettaglio.

import { z } from "zod";
import { TERRITORY_POI_CATEGORIES } from "./categories";

// ─────────────────────────────────────────────────────────────
// Valori base
// ─────────────────────────────────────────────────────────────

/** Provider di dati POI. `fake` è deterministico (test/dry-run); `osm-overpass` è quello reale. */
export const TerritoryProviderSchema = z.enum(["fake", "osm-overpass"]);
export type TerritoryProvider = z.infer<typeof TerritoryProviderSchema>;

/**
 * Metodo di distanza. È VOLUTAMENTE un solo valore: rendere "a piedi"/"in auto" inesprimibili a
 * livello di tipo è la garanzia più forte contro un'etichetta di percorribilità (constraint 8).
 */
export const TerritoryDistanceMethodSchema = z.literal("straight-line");
export type TerritoryDistanceMethod = z.infer<typeof TerritoryDistanceMethodSchema>;

export const TerritoryCategorySchema = z.enum(TERRITORY_POI_CATEGORIES);

/** Coordinata: dominio geografico valido imposto dallo schema (rifiuta lat/lng impossibili). */
export const GeoCoordSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .strict();

/** Origine della coordinata usata per il calcolo distanze. */
export const CoordSourceSchema = z.enum(["municipality-centroid", "property"]);
export type CoordSource = z.infer<typeof CoordSourceSchema>;

// ─────────────────────────────────────────────────────────────
// Provenienza e approvazione (constraint 13: provider + data + metodo)
// ─────────────────────────────────────────────────────────────

/** Provenienza di un fatto esterno: chi, quando, con quale attribuzione e link (se permesso). */
export const TerritorySourceSchema = z
  .object({
    provider: TerritoryProviderSchema,
    /** Timestamp ISO 8601 (UTC) del recupero. */
    retrievedAt: z.iso.datetime(),
    /** Testo di attribuzione obbligatorio (es. "© OpenStreetMap contributors"). */
    attribution: z.string().min(1),
    /** URL pubblico della fonte, solo se permesso e sicuro. */
    sourceUrl: z.url().optional(),
  })
  .strict();
export type TerritorySource = z.infer<typeof TerritorySourceSchema>;

/** Stato di approvazione del SINGOLO POI (l'editor approva/rifiuta i luoghi uno per uno). */
export const PoiApprovalStateSchema = z.enum(["draft", "approved", "rejected"]);
export type PoiApprovalState = z.infer<typeof PoiApprovalStateSchema>;

export const PoiApprovalSchema = z
  .object({
    state: PoiApprovalStateSchema,
    approvedBy: z.string().min(1).optional(),
    approvedAt: z.iso.datetime().optional(),
    note: z.string().optional(),
  })
  .strict();
export type PoiApproval = z.infer<typeof PoiApprovalSchema>;

// ─────────────────────────────────────────────────────────────
// POI privato
// ─────────────────────────────────────────────────────────────

/**
 * Un luogo vicino, forma PRIVATA (lato server).
 * `distanceMeters` non negativo, `coord` opzionale e solo server-side per ricalcolare la distanza.
 */
export const TerritoryPoiSchema = z
  .object({
    /** ID stabile del provider (es. "node/123456" per OSM). */
    providerId: z.string().min(1),
    category: TerritoryCategorySchema,
    /** Nome ufficiale/fornito dal provider. */
    name: z.string().min(1),
    /** Distanza approssimata in metri, in linea d'aria (>= 0). */
    distanceMeters: z.number().nonnegative(),
    distanceMethod: TerritoryDistanceMethodSchema,
    source: TerritorySourceSchema,
    /** Scadenza opzionale del dato. */
    expiresAt: z.iso.datetime().optional(),
    approval: PoiApprovalSchema,
    /** Coordinata del POI: SOLO lato server, mai proiettata nel pubblico. */
    coord: GeoCoordSchema.optional(),
  })
  .strict();
export type TerritoryPoi = z.infer<typeof TerritoryPoiSchema>;

// ─────────────────────────────────────────────────────────────
// Stato del record, fallimento, fingerprint
// ─────────────────────────────────────────────────────────────

/** Stato di un record di arricchimento (a livello di record, non del singolo POI). */
export const EnrichmentStatusSchema = z.enum([
  "draft",
  "approved",
  "stale",
  "failed",
  "disabled",
]);
export type EnrichmentStatus = z.infer<typeof EnrichmentStatusSchema>;

export const EnrichmentFailureKindSchema = z.enum([
  "timeout",
  "rate-limit",
  "network",
  "invalid-response",
  "disabled",
  "unknown",
]);
export type EnrichmentFailureKind = z.infer<typeof EnrichmentFailureKindSchema>;

/** Fallimento SANIFICATO: messaggio senza segreti né coordinate esatte (constraint 12, 13). */
export const EnrichmentFailureSchema = z
  .object({
    at: z.iso.datetime(),
    kind: EnrichmentFailureKindSchema,
    reason: z.string().min(1),
    provider: TerritoryProviderSchema.optional(),
    category: TerritoryCategorySchema.optional(),
  })
  .strict();
export type EnrichmentFailure = z.infer<typeof EnrichmentFailureSchema>;

/** Impronta che decide se ri-arricchire: comune + coordinata arrotondata + UltimaModifica + schema. */
export const EnrichmentFingerprintSchema = z
  .object({
    municipality: z.string(),
    /** Coordinata arrotondata serializzata, es. "45.708,8.906". */
    coordKey: z.string(),
    ultimaModifica: z.string(),
    schemaVersion: z.number().int().nonnegative(),
    /** Hash stabile e corto degli ingressi qui sopra. */
    hash: z.string().min(1),
  })
  .strict();
export type EnrichmentFingerprint = z.infer<typeof EnrichmentFingerprintSchema>;

/** Approvazione a livello di record: chi, quando, nota opzionale (constraint: audit). */
export const RecordApprovalSchema = z
  .object({
    approvedBy: z.string().min(1),
    approvedAt: z.iso.datetime(),
    note: z.string().optional(),
  })
  .strict();
export type RecordApproval = z.infer<typeof RecordApprovalSchema>;

// ─────────────────────────────────────────────────────────────
// Vista PUBBLICA (nessuna coordinata, nessun metadato interno)
// ─────────────────────────────────────────────────────────────

/**
 * POI pubblico. `.strict()` impedisce strutturalmente di trascinare `coord`, `providerId` o
 * qualunque campo interno: la conversione pubblica non può, per costruzione, esporre coordinate.
 */
export const PublicTerritoryPoiSchema = z
  .object({
    category: TerritoryCategorySchema,
    name: z.string().min(1),
    distanceMeters: z.number().nonnegative(),
    distanceMethod: TerritoryDistanceMethodSchema,
    provider: TerritoryProviderSchema,
    attribution: z.string().min(1),
    sourceUrl: z.url().optional(),
  })
  .strict();
export type PublicTerritoryPoi = z.infer<typeof PublicTerritoryPoiSchema>;

/** Vista pubblica per un immobile: ciò che leggono la sezione "Vivere in zona" e il chatbot. */
export const PublicListingTerritorySchema = z
  .object({
    realSmartCode: z.string().min(1),
    municipality: z.string().min(1),
    /** Metodo complessivo, sempre "straight-line". */
    method: TerritoryDistanceMethodSchema,
    /** Data del dato ("Dati aggiornati al …"). */
    retrievedAt: z.iso.datetime(),
    pois: z.array(PublicTerritoryPoiSchema),
  })
  .strict();
export type PublicListingTerritory = z.infer<typeof PublicListingTerritorySchema>;

// ─────────────────────────────────────────────────────────────
// Record PRIVATI (fonte di verità lato server)
// ─────────────────────────────────────────────────────────────

/** Profilo territoriale a livello di comune: lo strato di dedup/cache per origine (centroide). */
export const MunicipalityTerritoryProfileSchema = z
  .object({
    schemaVersion: z.number().int().nonnegative(),
    municipality: z.string().min(1),
    /** Origine del calcolo (centroide comune nel pilota). Server-only. */
    origin: GeoCoordSchema,
    coordSource: CoordSourceSchema,
    fingerprint: EnrichmentFingerprintSchema,
    status: EnrichmentStatusSchema,
    pois: z.array(TerritoryPoiSchema),
    retrievedAt: z.iso.datetime(),
    expiresAt: z.iso.datetime().optional(),
    failure: EnrichmentFailureSchema.optional(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export type MunicipalityTerritoryProfile = z.infer<typeof MunicipalityTerritoryProfileSchema>;

/**
 * Arricchimento PRIVATO di un immobile, chiave = codice RealSmart.
 * `lastApprovedPublic` conserva l'ultima vista pubblica approvata: se un refresh fallisce, il
 * sito continua a mostrare quella (constraint 12), mai il draft nuovo non approvato.
 */
export const ListingTerritoryEnrichmentSchema = z
  .object({
    schemaVersion: z.number().int().nonnegative(),
    realSmartCode: z.string().min(1),
    municipality: z.string().min(1),
    coordSource: CoordSourceSchema,
    /** Origine del calcolo distanze. Server-only, mai nel pubblico. */
    origin: GeoCoordSchema,
    fingerprint: EnrichmentFingerprintSchema,
    status: EnrichmentStatusSchema,
    pois: z.array(TerritoryPoiSchema),
    retrievedAt: z.iso.datetime(),
    expiresAt: z.iso.datetime().optional(),
    failure: EnrichmentFailureSchema.optional(),
    approval: RecordApprovalSchema.optional(),
    lastApprovedPublic: PublicListingTerritorySchema.optional(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export type ListingTerritoryEnrichment = z.infer<typeof ListingTerritoryEnrichmentSchema>;

// ─────────────────────────────────────────────────────────────
// Helper di validazione (safeParse: nessun throw ai confini non fidati)
// ─────────────────────────────────────────────────────────────

export function parseTerritoryPoi(value: unknown) {
  return TerritoryPoiSchema.safeParse(value);
}

export function parseListingEnrichment(value: unknown) {
  return ListingTerritoryEnrichmentSchema.safeParse(value);
}

export function parseMunicipalityProfile(value: unknown) {
  return MunicipalityTerritoryProfileSchema.safeParse(value);
}

export function parsePublicListingTerritory(value: unknown) {
  return PublicListingTerritorySchema.safeParse(value);
}
