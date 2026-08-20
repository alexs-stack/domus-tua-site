// Override manuali degli immobili — schema, validazione e applicazione.
//
// PERCHÉ ESISTE
// RealSmart resta la fonte principale. Quando l'agenzia ci comunica un dato che il gestionale
// non contiene (o che contiene sbagliato), lo registriamo QUI: una sola fonte, versionata in
// git, senza database paralleli, senza CMS, senza pannello amministrativo.
//
// PRIORITÀ
//   override manuale  >  campo RealSmart  >  estrazione deterministica dalla descrizione
//
// REGOLE
//   • l'indice è il CODICE stabile RealSmart (<Codice>), mai il titolo: i titoli cambiano;
//   • ogni override dichiara MOTIVO, FONTE, DATA e AUTORE: senza tracciabilità non si pubblica;
//   • un override non valido fa fallire la build (meglio rompere in CI che pubblicare un dato
//     sbagliato in produzione);
//   • nessuna chiave sconosciuta: un refuso è un errore, non un campo ignorato in silenzio;
//   • il file dati non viene mai importato lato client (vedi la guardia in ./overrides.data.ts).
//
// COME SI AGGIUNGE UNA MODIFICA: docs/realsmart-overrides.md

import { FACT_CATALOG, FACT_GROUPS, type FactGroup, type PropertyFact } from "./facts";

/** Un fatto imposto a mano. Le chiavi del catalogo ereditano gruppo ed etichetta. */
export interface OverrideFact {
  /** Chiave del catalogo (es. "classeEnergetica", "terrazzi") oppure una nuova chiave. */
  key: string;
  /** Valore mostrato accanto all'etichetta. Assente = dotazione booleana (chip/check). */
  value?: string;
  /** Obbligatori SOLO per una chiave fuori catalogo (es. un punto di forza specifico). */
  group?: FactGroup;
  label?: string;
}

export interface ListingOverride {
  /** <Codice> RealSmart: chiave stabile dell'immobile. */
  codice: string;
  /** Perché stiamo intervenendo a mano. */
  motivo: string;
  /** Da dove arriva l'informazione (es. "email Raffaela", "APE del 12/03/2026"). */
  fonte: string;
  /** Data della verifica, formato ISO YYYY-MM-DD. */
  data: string;
  /** Chi ha verificato e approvato. */
  autore: string;
  /** Fatti da aggiungere o correggere: vincono su gestionale e descrizione. */
  fatti?: OverrideFact[];
  /** Chiavi da NON pubblicare (caratteristica errata o dato non pubblicabile). */
  rimuovi?: string[];
  /** Paragrafi approvati dal cliente: sostituiscono integralmente la descrizione. */
  descrizione?: string[];
  /** Pubblicare l'indirizzo civico? Default: no (privacy). */
  mostraIndirizzo?: boolean;
  /**
   * EVIDENZA esplicita che il protocollo Domus D.O.C. è stato applicato a QUESTO immobile
   * (documenti, conformità e trasparenza verificati). Default: no. Solo qui — MAI dedotta dal
   * testo di marketing o dalle caratteristiche — abilita l'affermazione sul singolo immobile
   * (blocco D.O.C. "verificato" e badge "Documenti verificati"). `fonte`/`data`/`autore`
   * dell'override tracciano chi e quando l'ha attestato.
   */
  docVerified?: boolean;
}

/** Campi ammessi in un override: qualunque altra chiave è un errore. */
const OVERRIDE_KEYS = new Set([
  "codice",
  "motivo",
  "fonte",
  "data",
  "autore",
  "fatti",
  "rimuovi",
  "descrizione",
  "mostraIndirizzo",
  "docVerified",
]);

const OVERRIDE_FACT_KEYS = new Set(["key", "value", "group", "label"]);

const REQUIRED_TEXT: readonly (keyof ListingOverride)[] = [
  "codice",
  "motivo",
  "fonte",
  "data",
  "autore",
];

// ── Validazione ─────────────────────────────────────────────────────────────

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/**
 * Valida l'elenco degli override e restituisce gli errori trovati (elenco vuoto = tutto ok).
 * Nessuna eccezione qui: chi chiama decide se fallire (build) o solo segnalare (audit).
 */
export function validateOverrides(raw: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(raw)) return ["l'elenco degli override deve essere un array"];

  const seen = new Set<string>();
  raw.forEach((entry, index) => {
    const at = `override #${index + 1}`;
    if (!isRecord(entry)) {
      errors.push(`${at}: deve essere un oggetto`);
      return;
    }

    for (const key of Object.keys(entry)) {
      if (!OVERRIDE_KEYS.has(key)) errors.push(`${at}: chiave sconosciuta "${key}"`);
    }
    for (const key of REQUIRED_TEXT) {
      const value = entry[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        errors.push(`${at}: "${key}" è obbligatorio e deve essere una stringa non vuota`);
      }
    }

    const codice = typeof entry.codice === "string" ? entry.codice.trim() : "";
    if (codice) {
      if (seen.has(codice)) errors.push(`${at}: codice duplicato "${codice}"`);
      seen.add(codice);
    }

    if (typeof entry.data === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(entry.data)) {
      errors.push(`${at}: "data" deve essere in formato YYYY-MM-DD (trovato "${entry.data}")`);
    }

    if (entry.fatti !== undefined) {
      if (!Array.isArray(entry.fatti)) {
        errors.push(`${at}: "fatti" deve essere un array`);
      } else {
        entry.fatti.forEach((f, i) => errors.push(...validateFact(f, `${at}, fatto #${i + 1}`)));
      }
    }

    if (entry.rimuovi !== undefined) {
      if (!Array.isArray(entry.rimuovi) || entry.rimuovi.some((k) => typeof k !== "string")) {
        errors.push(`${at}: "rimuovi" deve essere un array di stringhe`);
      }
    }

    if (entry.descrizione !== undefined) {
      const ok =
        Array.isArray(entry.descrizione) &&
        entry.descrizione.length > 0 &&
        entry.descrizione.every((p) => typeof p === "string" && p.trim().length > 0);
      if (!ok) {
        errors.push(`${at}: "descrizione" deve essere un array di paragrafi non vuoti`);
      }
    }

    if (entry.mostraIndirizzo !== undefined && typeof entry.mostraIndirizzo !== "boolean") {
      errors.push(`${at}: "mostraIndirizzo" deve essere true o false`);
    }
    if (entry.docVerified !== undefined && typeof entry.docVerified !== "boolean") {
      errors.push(`${at}: "docVerified" deve essere true o false`);
    }
  });

  return errors;
}

function validateFact(raw: unknown, at: string): string[] {
  const errors: string[] = [];
  if (!isRecord(raw)) return [`${at}: deve essere un oggetto`];

  for (const key of Object.keys(raw)) {
    if (!OVERRIDE_FACT_KEYS.has(key)) errors.push(`${at}: chiave sconosciuta "${key}"`);
  }

  const key = typeof raw.key === "string" ? raw.key.trim() : "";
  if (!key) {
    errors.push(`${at}: "key" è obbligatoria`);
    return errors;
  }

  const known = FACT_CATALOG.get(key);
  if (!known) {
    // Chiave nuova (es. un punto di forza specifico dell'immobile): serve dichiarare dove vive
    // e come si chiama, altrimenti non è pubblicabile.
    if (typeof raw.label !== "string" || raw.label.trim().length === 0) {
      errors.push(`${at}: la chiave "${key}" non è nel catalogo, serve "label"`);
    }
    if (typeof raw.group !== "string" || !FACT_GROUPS.includes(raw.group as FactGroup)) {
      errors.push(
        `${at}: la chiave "${key}" non è nel catalogo, serve "group" tra ${FACT_GROUPS.join(", ")}`,
      );
    }
  } else if (raw.group !== undefined && raw.group !== known.group) {
    errors.push(`${at}: "${key}" vive nel gruppo "${known.group}", non in "${String(raw.group)}"`);
  }

  if (raw.value !== undefined && (typeof raw.value !== "string" || raw.value.trim().length === 0)) {
    errors.push(`${at}: "value" deve essere una stringa non vuota (ometterla per una dotazione)`);
  }

  return errors;
}

/**
 * Valida e indicizza gli override per codice. LANCIA se qualcosa non torna: viene chiamata a
 * import-time dal modulo dati, quindi un override sbagliato fa fallire lint/typecheck/build.
 */
export function indexOverrides(raw: unknown): ReadonlyMap<string, ListingOverride> {
  const errors = validateOverrides(raw);
  if (errors.length > 0) {
    throw new Error(
      `[realsmart/overrides] ${errors.length} override non valid${errors.length === 1 ? "o" : "i"}:\n` +
        errors.map((e) => `  • ${e}`).join("\n"),
    );
  }
  const list = raw as ListingOverride[];
  return new Map(list.map((o) => [o.codice.trim(), o]));
}

// ── Applicazione ────────────────────────────────────────────────────────────

/** Fatti imposti a mano, pronti per mergeFacts() (priorità massima). */
export function overrideFacts(override: ListingOverride | undefined): PropertyFact[] {
  if (!override?.fatti) return [];
  return override.fatti.map((f) => {
    const meta = FACT_CATALOG.get(f.key);
    return {
      key: f.key,
      group: (f.group ?? meta?.group) as FactGroup,
      label: f.label ?? meta?.label ?? f.key,
      value: f.value,
      source: "override" as const,
      confidence: "alta" as const,
      evidence: `${override.fonte} — ${override.data} (${override.autore})`,
    };
  });
}

/** Rimuove le chiavi che l'override dichiara non pubblicabili. */
export function applyRemovals(
  facts: readonly PropertyFact[],
  override: ListingOverride | undefined,
): PropertyFact[] {
  if (!override?.rimuovi?.length) return [...facts];
  const drop = new Set(override.rimuovi);
  return facts.filter((f) => !drop.has(f.key));
}

// ── Report ──────────────────────────────────────────────────────────────────

export interface OverridesReport {
  /** Override effettivamente agganciati a un immobile del feed. */
  applicati: { codice: string; motivo: string; fonte: string; data: string; autore: string; modifiche: string[] }[];
  /** Override che puntano a un immobile inesistente: vanno rimossi o corretti. */
  orfani: string[];
}

/** Elenco leggibile delle modifiche di un override (per il report, non per la UI). */
function changesOf(o: ListingOverride): string[] {
  const changes: string[] = [];
  for (const f of o.fatti ?? []) changes.push(`imposta ${f.key}${f.value ? ` = ${f.value}` : ""}`);
  for (const k of o.rimuovi ?? []) changes.push(`rimuove ${k}`);
  if (o.descrizione) changes.push(`sostituisce la descrizione (${o.descrizione.length} paragrafi)`);
  if (o.mostraIndirizzo !== undefined) {
    changes.push(o.mostraIndirizzo ? "pubblica l'indirizzo" : "nasconde l'indirizzo");
  }
  return changes;
}

/**
 * Confronta gli override con i codici realmente presenti nel feed.
 * Un override ORFANO non è un errore di build (il gestionale può aver ritirato l'immobile) ma
 * deve essere sempre segnalato: altrimenti resta lì per anni senza che nessuno se ne accorga.
 */
export function buildOverridesReport(
  overrides: ReadonlyMap<string, ListingOverride>,
  liveCodes: readonly string[],
): OverridesReport {
  const live = new Set(liveCodes);
  const applicati: OverridesReport["applicati"] = [];
  const orfani: string[] = [];

  for (const [codice, o] of overrides) {
    if (!live.has(codice)) {
      orfani.push(codice);
      continue;
    }
    applicati.push({
      codice,
      motivo: o.motivo,
      fonte: o.fonte,
      data: o.data,
      autore: o.autore,
      modifiche: changesOf(o),
    });
  }

  return { applicati, orfani };
}
