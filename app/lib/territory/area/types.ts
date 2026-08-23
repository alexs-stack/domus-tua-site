// Base di conoscenza dei FATTI D'AREA (comune/zona) — Territory V2, Prompt 9.
//
// SEPARATA dai fatti dell'IMMOBILE e dalle distanze POI: qui vivono affermazioni FATTUALI e
// VERIFICATE sul territorio (trasporti, servizi comunali, parchi, scuole come istituzioni, sanità
// come strutture, mercati/eventi ufficiali, connessioni regionali). Ogni fatto è tracciabile a una
// FONTE PRIMARIA corrente, è una PARAFRASI senza virgolette, ha una data di revisione e uno stato
// di approvazione. NIENTE giudizi soggettivi (sicurezza/prestigio/"migliore"/demografia): li blocca
// il guard deterministico (./subjective.ts). Gli schemi Zod sono la fonte di verità.

import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Versioni — l'unica coppia di numeri che decide "va rifatto?"
// ─────────────────────────────────────────────────────────────

/**
 * Versione dello SCHEMA del dominio d'area. Si alza quando cambia la FORMA dei record (campi
 * nuovi obbligatori, semantica diversa di un campo esistente), non quando cambiano i dati.
 * Entra in tutte le impronte: alzarla invalida in blocco ciò che è stato prodotto con la vecchia.
 */
export const AREA_SCHEMA_VERSION = 1;

/**
 * Versione del PROMPT con cui si scrive la narrativa d'area. Si alza quando cambiano istruzioni,
 * voce o vincoli editoriali. È separata dallo schema di proposito: correggere una regola di stile
 * deve poter rigenerare i testi SENZA toccare i fatti, che sono stati approvati a parte e non
 * c'entrano nulla con come li si racconta.
 */
export const AREA_PROMPT_VERSION = "area-writer-1";

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
    /** Versione di schema con cui il record è stato scritto. Default per i record già esistenti. */
    schemaVersion: z.number().int().positive().default(AREA_SCHEMA_VERSION),
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

// ─────────────────────────────────────────────────────────────
// PROFILO d'area — l'anagrafica dell'area, non i suoi contenuti
// ─────────────────────────────────────────────────────────────

export const AreaProfileStatusSchema = z.enum([
  "draft", // esiste, nessuno l'ha ancora guardata
  "researching", // ricerca fonti in corso (job editoriale)
  "approved", // fatti sufficienti e approvati: pubblicabile
  "insufficient-evidence", // guardata, e le fonti non bastano. È uno stato LEGITTIMO e finale.
]);
export type AreaProfileStatus = z.infer<typeof AreaProfileStatusSchema>;

/**
 * Un'area del territorio: l'identità e lo stato del lavoro su di essa.
 *
 * NON contiene fatti né testi — solo l'anagrafica. È la separazione che tiene insieme il resto:
 * i fatti (evidenza) e le narrative (racconto) puntano qui, e possono essere sostituiti senza
 * che l'area perda identità o storia.
 *
 * `areaKey` è la chiave canonica a cinque segmenti (app/lib/territory/area/identity.ts): mai
 * un'etichetta. `label` è ciò che si mostra.
 */
export const AreaProfileSchema = z
  .object({
    /** `paese|regione|provincia|comune|quartiere`. Chiave primaria dell'area. */
    areaKey: z.string().min(1),
    /** Etichetta pubblica ("Tradate", "Abbiate Guazzone"). */
    label: z.string().min(1),
    /** Chiave del solo comune: le frazioni condividono i fatti a scala comunale. */
    municipalityAreaKey: z.string().min(1),
    scope: AreaScopeSchema,
    status: AreaProfileStatusSchema,
    /** Data ISO entro cui rivedere il profilo nel suo insieme. */
    reviewBy: z.iso.datetime().optional(),
    approvedBy: z.string().min(1).optional(),
    approvedAt: z.iso.datetime().optional(),
    schemaVersion: z.number().int().positive().default(AREA_SCHEMA_VERSION),
  })
  .strict();
export type AreaProfile = z.infer<typeof AreaProfileSchema>;

// ─────────────────────────────────────────────────────────────
// NARRATIVA d'area — il racconto, tenuto separato dall'evidenza
// ─────────────────────────────────────────────────────────────

/**
 * Una sezione della narrativa. `factIds` NON è decorazione: è il vincolo. Una sezione senza
 * fatti a sostegno non è una sezione più debole — è una sezione che non si pubblica.
 */
export const AreaNarrativeSectionSchema = z
  .object({
    category: AreaFactCategorySchema,
    heading: z.string().min(1),
    body: z.string().min(1),
    factIds: z.array(z.string().min(1)).min(1),
  })
  .strict();
export type AreaNarrativeSection = z.infer<typeof AreaNarrativeSectionSchema>;

/** Una affermazione del testo e i fatti che la reggono. È ciò che rende verificabile la prosa. */
export const AreaClaimSchema = z
  .object({
    claim: z.string().min(1),
    factIds: z.array(z.string().min(1)).min(1),
  })
  .strict();
export type AreaClaim = z.infer<typeof AreaClaimSchema>;

export const AreaNarrativeStatusSchema = z.enum(["draft", "approved", "rejected", "superseded"]);
export type AreaNarrativeStatus = z.infer<typeof AreaNarrativeStatusSchema>;

/**
 * Il testo d'area GENERATO. Vive separato dai fatti, e la separazione è il punto:
 *
 *   • i fatti sono EVIDENZA — hanno una fonte, una data di recupero, un'approvazione a sé;
 *   • la narrativa è un MODO DI RACCONTARLI — si può rigenerare, rifiutare e sostituire senza
 *     toccare l'evidenza, e senza rifare le approvazioni dei fatti.
 *
 * `factsHash` è l'impronta dei fatti da cui è nata (./hash.ts): quando i fatti approvati
 * cambiano, l'impronta non combacia più e la narrativa si sa obsoleta senza doverla rigenerare
 * per scoprirlo. `promptVersion` fa lo stesso per le regole editoriali.
 *
 * Nessun auto-approve: una narrativa nasce sempre `draft`.
 */
export const AreaNarrativeSchema = z
  .object({
    areaKey: z.string().min(1),
    locale: KnowledgeLocaleSchema,
    title: z.string().min(1),
    intro: z.string().min(1),
    sections: z.array(AreaNarrativeSectionSchema).min(1),
    /** Ogni affermazione fattuale del testo, con i fatti che la reggono. */
    claimMap: z.array(AreaClaimSchema),
    /** Le fonti effettivamente usate, per l'attribuzione in pagina. */
    sourceIdsUsed: z.array(z.string().min(1)),
    /** Impronta dei fatti approvati da cui nasce: cambia → il testo è obsoleto. */
    factsHash: z.string().min(1),
    promptVersion: z.string().min(1),
    /** Modello che l'ha scritta (tracciabilità, non un vanto). */
    modelId: z.string().min(1).optional(),
    generatedAt: z.iso.datetime(),
    status: AreaNarrativeStatusSchema,
    approvedBy: z.string().min(1).optional(),
    approvedAt: z.iso.datetime().optional(),
    schemaVersion: z.number().int().positive().default(AREA_SCHEMA_VERSION),
  })
  .strict();
export type AreaNarrative = z.infer<typeof AreaNarrativeSchema>;

// ─────────────────────────────────────────────────────────────
// EVENTI di revisione — storia in sola aggiunta
// ─────────────────────────────────────────────────────────────

export const AreaReviewActionSchema = z.enum([
  "generate",
  "validate",
  "approve",
  "reject",
  "publish",
  "unpublish",
  "manual-edit",
  "source-expired",
  "location-changed",
]);
export type AreaReviewAction = z.infer<typeof AreaReviewActionSchema>;

/**
 * Un evento di revisione. SOLA AGGIUNTA: non si modifica e non si cancella.
 *
 * `beforeHash`/`afterHash` rendono l'evento verificabile invece che dichiarativo — dicono su
 * quale contenuto ESATTO è stata presa la decisione, così un'approvazione non può essere
 * riferita a un testo che nel frattempo è cambiato.
 *
 * `areaKey` è registrato COM'ERA al momento dell'evento, e non si ricalcola: se domani il
 * registro dei comuni si amplia e la chiave dell'area guadagna provincia e regione, la storia
 * deve continuare a dire dove eravamo allora.
 */
export const AreaReviewEventSchema = z
  .object({
    id: z.string().min(1),
    areaKey: z.string().min(1),
    /** Su cosa: il fatto, la narrativa o la fonte toccata. */
    subject: z.enum(["fact", "narrative", "source", "profile"]),
    subjectId: z.string().min(1),
    action: AreaReviewActionSchema,
    /** Chi. Mai "system" per approvazioni e pubblicazioni: quelle hanno sempre un umano. */
    actor: z.string().min(1),
    at: z.iso.datetime(),
    /** Perché. Obbligatoria su publish/unpublish/reject: una decisione senza motivo non è auditabile. */
    reason: z.string().min(1).optional(),
    beforeHash: z.string().min(1).optional(),
    afterHash: z.string().min(1).optional(),
    schemaVersion: z.number().int().positive().default(AREA_SCHEMA_VERSION),
  })
  .strict()
  .refine(
    (e) => !["publish", "unpublish", "reject"].includes(e.action) || !!e.reason?.trim(),
    { message: "publish/unpublish/reject richiedono una motivazione esplicita" },
  );
export type AreaReviewEvent = z.infer<typeof AreaReviewEventSchema>;

// ─────────────────────────────────────────────────────────────
// Parser
// ─────────────────────────────────────────────────────────────

export function parseAreaFact(value: unknown) {
  return AreaFactSchema.safeParse(value);
}

export function parseAreaProfile(value: unknown) {
  return AreaProfileSchema.safeParse(value);
}

export function parseAreaNarrative(value: unknown) {
  return AreaNarrativeSchema.safeParse(value);
}

export function parseAreaReviewEvent(value: unknown) {
  return AreaReviewEventSchema.safeParse(value);
}
