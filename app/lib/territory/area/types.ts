// Base di conoscenza dei FATTI D'AREA (comune/zona) — Territory V2, Prompt 9.
//
// SEPARATA dai fatti dell'IMMOBILE e dalle distanze POI: qui vivono affermazioni FATTUALI e
// VERIFICATE sul territorio (trasporti, servizi comunali, parchi, scuole come istituzioni, sanità
// come strutture, mercati/eventi ufficiali, connessioni regionali). Ogni fatto è tracciabile a una
// FONTE PRIMARIA corrente, è una PARAFRASI senza virgolette, ha una data di revisione e uno stato
// di approvazione. NIENTE giudizi soggettivi (sicurezza/prestigio/"migliore"/demografia): li blocca
// il guard deterministico (./subjective.ts). Gli schemi Zod sono la fonte di verità.

import { z } from "zod";

/** Categorie FATTUALI ammesse. Volutamente prive di categorie soggettive/valutative. */
export const AreaFactCategorySchema = z.enum([
  "transport", // stazioni, linee ufficiali
  "municipal-service", // servizi comunali (anagrafe, biblioteca…)
  "park-facility", // parchi e strutture pubbliche
  "school", // scuole come ISTITUZIONI (nessuna classifica di qualità)
  "healthcare", // strutture sanitarie (accesso fattuale, nessun giudizio)
  "market-event", // mercati/eventi ufficiali ricorrenti VERIFICATI
  "regional-connection", // collegamenti e infrastrutture regionali
]);
export type AreaFactCategory = z.infer<typeof AreaFactCategorySchema>;

export const AreaScopeSchema = z.enum(["municipality", "zone", "region"]);
export type AreaScope = z.infer<typeof AreaScopeSchema>;

export const AreaFactStatusSchema = z.enum(["draft", "approved", "rejected"]);
export type AreaFactStatus = z.infer<typeof AreaFactStatusSchema>;

export const KnowledgeLocaleSchema = z.enum(["it", "en", "fr", "de", "es"]);
export type KnowledgeLocale = z.infer<typeof KnowledgeLocaleSchema>;

/** Fonte PRIMARIA obbligatoria: URL, proprietario, data di recupero. */
export const AreaFactSourceSchema = z
  .object({
    url: z.url(),
    /** Proprietario/ente della fonte (es. "Comune di Tradate", "Trenord", "Regione Lombardia"). */
    owner: z.string().min(1),
    /** ISO 8601 del recupero. */
    retrievedAt: z.iso.datetime(),
  })
  .strict();
export type AreaFactSource = z.infer<typeof AreaFactSourceSchema>;

/**
 * Traduzione rivista. L'italiano è la copia CANONICA (sul fatto); le altre lingue sono DRAFT finché
 * un revisore non le approva: una traduzione automatica non pubblica finché `approved` è false.
 */
export const AreaFactTranslationSchema = z
  .object({
    locale: KnowledgeLocaleSchema,
    text: z.string().min(1),
    approved: z.boolean(),
  })
  .strict();
export type AreaFactTranslation = z.infer<typeof AreaFactTranslationSchema>;

/** Fonte in CONFLITTO: un'alternativa che richiede una decisione editoriale (mai scelta in automatico). */
export const AreaFactConflictSchema = z
  .object({
    source: AreaFactSourceSchema,
    note: z.string().min(1),
  })
  .strict();
export type AreaFactConflict = z.infer<typeof AreaFactConflictSchema>;

/** Un FATTO d'area verificato. La copia canonica `text` è in italiano, parafrasata (niente citazioni). */
export const AreaFactSchema = z
  .object({
    id: z.string().min(1),
    municipality: z.string().min(1),
    /** Sotto-area opzionale (zona/quartiere). */
    zone: z.string().min(1).optional(),
    category: AreaFactCategorySchema,
    scope: AreaScopeSchema,
    /** Parafrasi CANONICA in italiano, senza virgolette dalla fonte. */
    text: z.string().min(1),
    translations: z.array(AreaFactTranslationSchema).default([]),
    source: AreaFactSourceSchema,
    /** Data ISO entro cui rivedere/ricontrollare il fatto. Oltre → stale, non pubblica. */
    reviewBy: z.iso.datetime(),
    status: AreaFactStatusSchema,
    approvedBy: z.string().min(1).optional(),
    approvedAt: z.iso.datetime().optional(),
    /** Fonti in conflitto NON risolte: finché ce ne sono, il fatto non è pubblicabile. */
    conflicts: z.array(AreaFactConflictSchema).default([]),
  })
  .strict();
export type AreaFact = z.infer<typeof AreaFactSchema>;

// ── Vista PUBBLICA (assistente + eventuale sezione) ──────────────────────────

/** Fatto pubblico: testo localizzato + attribuzione. Nessun campo interno/di revisione. */
export const PublicAreaFactSchema = z
  .object({
    category: AreaFactCategorySchema,
    scope: AreaScopeSchema,
    text: z.string().min(1),
    sourceOwner: z.string().min(1),
    sourceUrl: z.url(),
    reviewedAt: z.iso.datetime(),
  })
  .strict();
export type PublicAreaFact = z.infer<typeof PublicAreaFactSchema>;

/** Profilo pubblico d'area per un comune: ciò che l'assistente può citare. */
export const PublicAreaProfileSchema = z
  .object({
    municipality: z.string().min(1),
    facts: z.array(PublicAreaFactSchema),
  })
  .strict();
export type PublicAreaProfile = z.infer<typeof PublicAreaProfileSchema>;

export function parseAreaFact(value: unknown) {
  return AreaFactSchema.safeParse(value);
}
