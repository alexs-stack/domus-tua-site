// UNICA FONTE dei fatti d'area VERIFICATI (Prompt 9). SERVER-ONLY.
//
// VUOTO di proposito: nessun fatto d'area si pubblica finché un ricercatore non lo aggiunge (con
// fonte primaria, parafrasi neutra, data di revisione) e un revisore non lo approva. La ricerca
// avviene in job editoriali controllati, MAI durante una chat o il render di pagina. Le voci sono
// validate a import-time (in build): una voce non valida rompe la build, non la pagina.

import { AREA_SCHEMA_VERSION, AreaFactSchema, type AreaFact, type KnowledgeLocale } from "./types";
import { toPublicAreaProfile } from "./public";
import { approvalBlockers } from "./validate";

if (typeof window !== "undefined") {
  throw new Error("[territory/area] fatti d'area: modulo server-only.");
}

/**
 * Fatti d'area di produzione.
 *
 * Le sei voci di Tradate NON sono pubblicate: sono `status: "draft"`, quindi `isPublishable` le
 * scarta e la sezione «Vivere in zona» resta fuori dal DOM. Sono qui perché è qui che devono
 * stare per essere riviste, non perché siano pronte.
 *
 * DA DOVE VENGONO. Le ha scritte Alessandro Serratt il 2026-08-14 (commit 8c9917a) nella fixture
 * di `app/territory-preview/page.tsx`, che è dev-only e non è mai stata una fonte di produzione.
 * Sono conoscenza locale di chi lavora su quel territorio, non un'estrazione automatica: per
 * questo vale la pena promuoverle qui invece di riscriverle da zero. Il testo è quello originale,
 * parola per parola.
 *
 * COSA MANCA PER APPROVARLE — due cose, entrambe da fare aprendo la pagina:
 *
 *  1. `source.url` punta alla HOME dell'ente, non alla pagina che afferma il fatto. È la
 *     differenza fra «lo dice Trenord da qualche parte» e «lo dice questa pagina»: la seconda si
 *     può ricontrollare fra un anno, la prima no. Vanno sostituite con gli URL puntuali.
 *
 *  2. `af_tradate_parco` dichiara «circa 4.800 ettari». Cercando quel dato il 2026-08-23 sono
 *     usciti due valori diversi da questo e incompatibili fra loro (83.433 e 8.343,3), quindi la
 *     cifra va letta sulla pagina del Parco o di Regione Lombardia prima di uscire in pubblico.
 *     Se la pagina non la dichiara, si toglie il numero: una superficie non si stima.
 *
 * Per approvarne una: `status: "approved"` più `approvedBy` e `approvedAt`. Senza quei due campi
 * il guard rifiuta lo stato — non esiste auto-approve, nemmeno scrivendo a mano nel file.
 */
const AREA_FACTS: AreaFact[] = [
  {
    id: "af_tradate_stazione_s40",
    municipality: "tradate",
    category: "transport",
    scope: "municipality",
    text:
      "La stazione di Tradate è servita dalla linea suburbana S40 di Trenord, con collegamenti " +
      "diretti verso Milano Cadorna e Como San Giovanni.",
    source: { url: "https://www.trenord.it/", owner: "Trenord", retrievedAt: "2026-08-10T00:00:00.000Z" },
    reviewBy: "2027-08-10T00:00:00.000Z",
    status: "draft",
    translations: [],
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
  },
  {
    id: "af_tradate_ss233",
    municipality: "tradate",
    category: "regional-connection",
    scope: "municipality",
    text:
      "Il territorio comunale è attraversato dalla ex strada statale 233 Varesina, direttrice " +
      "storica tra Varese e Milano.",
    source: { url: "https://www.comune.tradate.va.it/", owner: "Comune di Tradate", retrievedAt: "2026-08-10T00:00:00.000Z" },
    reviewBy: "2027-08-10T00:00:00.000Z",
    status: "draft",
    translations: [],
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
  },
  {
    id: "af_tradate_servizi_centro",
    municipality: "tradate",
    category: "municipal-service",
    scope: "municipality",
    text: "Nel centro cittadino hanno sede la biblioteca civica e gli sportelli anagrafici del Comune.",
    source: { url: "https://www.comune.tradate.va.it/", owner: "Comune di Tradate", retrievedAt: "2026-08-10T00:00:00.000Z" },
    reviewBy: "2027-08-10T00:00:00.000Z",
    status: "draft",
    translations: [],
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
  },
  {
    id: "af_tradate_ospedale",
    municipality: "tradate",
    category: "healthcare",
    scope: "municipality",
    text: "L'ospedale «Galmarini» di Tradate fa parte dell'ASST dei Sette Laghi.",
    source: { url: "https://www.asst-settelaghi.it/", owner: "ASST Sette Laghi", retrievedAt: "2026-08-10T00:00:00.000Z" },
    reviewBy: "2027-08-10T00:00:00.000Z",
    status: "draft",
    translations: [],
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
  },
  {
    id: "af_tradate_scuole",
    municipality: "tradate",
    category: "school",
    scope: "municipality",
    text: "A Tradate sono presenti scuole di ogni grado, dall'infanzia alla secondaria di secondo grado.",
    source: { url: "https://www.comune.tradate.va.it/", owner: "Comune di Tradate", retrievedAt: "2026-08-10T00:00:00.000Z" },
    reviewBy: "2027-08-10T00:00:00.000Z",
    status: "draft",
    translations: [],
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
  },
  {
    id: "af_tradate_parco",
    municipality: "tradate",
    category: "park-facility",
    scope: "municipality",
    // ⚠️ La superficie è il dato da ricontrollare per primo: vedi il punto 2 qui sopra.
    text:
      "Il Parco Pineta di Appiano Gentile e Tradate è un'area naturale protetta regionale estesa " +
      "su circa 4.800 ettari.",
    source: { url: "https://www.parcopineta.org/", owner: "Parco Pineta / Regione Lombardia", retrievedAt: "2026-08-10T00:00:00.000Z" },
    reviewBy: "2027-08-10T00:00:00.000Z",
    status: "draft",
    translations: [],
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
  },
];

// Validazione a import-time: schema + niente fatto "approved" con blocker (soggettivo/conflitto).
for (const fact of AREA_FACTS) {
  const parsed = AreaFactSchema.safeParse(fact);
  if (!parsed.success) throw new Error(`[area] fatto non valido (${fact?.id ?? "?"}): ${parsed.error.message}`);
  if (fact.status === "approved") {
    const blockers = approvalBlockers(fact);
    if (blockers.length > 0) {
      throw new Error(`[area] fatto approvato ma con blocker (${fact.id}): ${blockers.join("; ")}`);
    }
  }
}

/** Tutti i fatti d'area (server-only). L'assistente NON legge questo: usa getPublicAreaProfile. */
export function allAreaFacts(): readonly AreaFact[] {
  return AREA_FACTS;
}

/**
 * Percorso di LETTURA dell'assistente (Prompt 13): profilo pubblico d'area per un comune, solo
 * fatti approvati/freschi/senza conflitti, localizzati. `null` se non c'è nulla di pubblicabile —
 * così l'assistente lo dice e non inventa.
 */
export function getPublicAreaProfile(
  municipality: string,
  options: { now: Date; locale: KnowledgeLocale; label?: string },
): ReturnType<typeof toPublicAreaProfile> {
  // `narrative` non è ancora passata: le narrative approvate vivranno nello store durevole
  // (supabase/migrations/0002_area_schema.sql, non ancora applicato). Finché non c'è, la sezione
  // mostra i soli fatti verificati con la loro fonte — che è l'esito corretto, non un ripiego:
  // meglio un elenco sobrio e tracciabile che una prosa che nessuno ha approvato.
  return toPublicAreaProfile(AREA_FACTS, { ...options, municipality });
}
