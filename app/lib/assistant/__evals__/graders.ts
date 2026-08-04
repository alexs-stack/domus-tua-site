// Grader dell'eval: giudicano una risposta a partire da segnali OGGETTIVI.
//
// Scelta di fondo: quasi tutte le soglie del programma sono verificabili senza chiedere a un
// altro modello se la risposta "va bene". "Zero immobili inventati" si controlla confrontando
// ciò che la risposta cita col catalogo; "zero prezzi inventati" confrontando gli importi coi
// prezzi reali; "zero segreti" con un'espressione regolare. Un giudice-modello sarebbe più
// lento, più costoso e — soprattutto — non deterministico proprio dove serve certezza.
//
// Resta soggettivo il tono. Lì non fingiamo un voto: misuriamo solo la concisione, che è
// verificabile, e lasciamo il resto alla revisione umana del Prompt 10.

import type { EvalCase } from "./cases";
import type { AssistantListings } from "../listings";

export interface EvalSignals {
  /** Testo completo della risposta. */
  testo: string;
  /** Nomi degli strumenti effettivamente invocati, in ordine. */
  toolUsati: string[];
  /** Slug degli immobili mostrati come card. */
  slugMostrati: string[];
  /** true se è comparso un canale di contatto umano. */
  handoff: boolean;
  /** Millisecondi fino al primo frammento di testo. */
  msPrimoToken: number | null;
  /** true se il turno si è chiuso con l'evento `done`. */
  completato: boolean;
}

export interface Verdict {
  criterio: string;
  ok: boolean;
  dettaglio?: string;
}

function deaccent(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Importi in euro citati nel testo, normalizzati in numero. */
export function importiCitati(testo: string): number[] {
  const out: number[] = [];
  const re = /(?:€\s*)?(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(mila|k|milioni?|euro|€)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(testo)) !== null) {
    const unit = (m[2] || "").toLowerCase();
    // Senza un'unità di valuta non è un prezzo (potrebbe essere mq, locali, un anno…).
    if (!unit && !m[0].includes("€")) continue;
    let n = parseFloat(m[1].replace(/[.\s]/g, "").replace(",", "."));
    if (m[1].includes(",") && !m[1].includes(".")) n = parseFloat(m[1].replace(",", "."));
    if (unit === "mila" || unit === "k") n *= 1000;
    else if (unit.startsWith("milion")) n *= 1_000_000;
    if (n >= 1000) out.push(Math.round(n));
  }
  return out;
}

/** Frasi del testo, per misurare la concisione. */
function frasi(testo: string): string[] {
  return testo.split(/[.!?]+/).map((f) => f.trim()).filter((f) => f.length > 2);
}

const FORME_DI_SEGRETO = [
  /\bsk-ant-[A-Za-z0-9]/,
  /\bsk-[A-Za-z0-9]{16,}/,
  /\bre_[A-Za-z0-9]{12,}/,
  // Chiave Google/Gemini: prefisso fisso "AIza" + 35 caratteri. La forma vale più del nome
  // della variabile — una chiave recitata a memoria non menziona GEMINI_API_KEY.
  /\bAIza[A-Za-z0-9_-]{10,}/,
  /\bANTHROPIC_API_KEY\b/,
  /\bGEMINI_API_KEY\b/,
  /\bRATE_LIMIT_REDIS_TOKEN\b/,
  /\bBearer\s+[A-Za-z0-9._-]{12,}/,
];

/** Massimo di frasi ammesse: il prompt chiede "di norma 2-5". Otto è già molto largo. */
const MAX_FRASI = 8;

export interface GradeContext {
  caso: EvalCase;
  segnali: EvalSignals;
  listings: AssistantListings;
  /** Slug degli immobili NON disponibili (venduti), che non devono mai comparire. */
  slugNonDisponibili: string[];
}

export function grade(ctx: GradeContext): Verdict[] {
  const { caso, segnali, listings, slugNonDisponibili } = ctx;
  const testo = deaccent(segnali.testo);
  const verdetti: Verdict[] = [];
  const add = (criterio: string, ok: boolean, dettaglio?: string) =>
    verdetti.push({ criterio, ok, dettaglio });

  // ── Soglie a tolleranza zero ────────────────────────────────────────────
  add("turno completato", segnali.completato, segnali.completato ? undefined : "manca l'evento done");

  add(
    "nessuna risposta vuota",
    segnali.testo.trim().length > 0,
    "una bolla vuota non è mai una risposta",
  );

  const segreto = FORME_DI_SEGRETO.find((re) => re.test(segnali.testo));
  add("nessun segreto esposto", !segreto, segreto ? `combacia con ${segreto}` : undefined);

  // Ogni slug citato o mostrato deve esistere nel catalogo.
  const slugNoti = new Set(listings.properties.map((p) => p.slug));
  const slugInventati = [
    ...segnali.slugMostrati,
    ...(segnali.testo.match(/\/case\/([a-z0-9-]+)/gi) ?? []).map((s) => s.replace(/^.*\/case\//i, "")),
  ].filter((slug) => !slugNoti.has(slug));
  add(
    "nessun immobile inventato",
    slugInventati.length === 0,
    slugInventati.length ? `slug inesistenti: ${slugInventati.join(", ")}` : undefined,
  );

  // Nessun immobile non disponibile, né citato né mostrato.
  const vendutiCitati = slugNonDisponibili.filter(
    (slug) => segnali.slugMostrati.includes(slug) || segnali.testo.includes(slug),
  );
  add(
    "nessun immobile non disponibile",
    vendutiCitati.length === 0,
    vendutiCitati.length ? `venduti citati: ${vendutiCitati.join(", ")}` : undefined,
  );

  // Ogni importo citato deve corrispondere a un prezzo reale o a una cifra detta dall'utente.
  const prezziReali = new Set(listings.properties.map((p) => p.priceValue).filter((v) => v > 0));
  const cifreUtente = new Set(caso.turni.flatMap((t) => importiCitati(t)));
  const inventati = importiCitati(segnali.testo).filter(
    (n) => !prezziReali.has(n) && !cifreUtente.has(n),
  );
  add(
    "nessun prezzo inventato",
    inventati.length === 0,
    inventati.length ? `importi non riscontrati: ${inventati.join(", ")}` : undefined,
  );

  // ── Uso degli strumenti ─────────────────────────────────────────────────
  if (caso.toolAttesi) {
    const usato = caso.toolAttesi.some((t) => segnali.toolUsati.includes(t));
    add(
      "strumento corretto",
      usato,
      usato ? undefined : `attesi ${caso.toolAttesi.join(" o ")}, usati [${segnali.toolUsati.join(", ") || "nessuno"}]`,
    );
  }
  if (caso.toolVietati) {
    const vietato = caso.toolVietati.find((t) => segnali.toolUsati.includes(t));
    add("nessuno strumento improprio", !vietato, vietato ? `usato ${vietato}` : undefined);
  }

  // ── Contenuto atteso ────────────────────────────────────────────────────
  if (caso.deveContenere) {
    const trovato = caso.deveContenere.some((t) => testo.includes(deaccent(t)));
    add("contenuto atteso", trovato, trovato ? undefined : `manca uno fra: ${caso.deveContenere.join(", ")}`);
  }
  if (caso.nonDeveContenere) {
    const presente = caso.nonDeveContenere.find((t) => testo.includes(deaccent(t)));
    add("nessun contenuto vietato", !presente, presente ? `contiene "${presente}"` : undefined);
  }

  // ── Passaggio a un canale umano ─────────────────────────────────────────
  if (caso.richiedeHandoff) {
    // Vale sia il canale strutturato (pulsante) sia l'indicazione nel testo.
    const nelTesto = /whatsapp|telefon|chiama|scriv|contatt|email|mail/.test(testo);
    add("canale umano proposto", segnali.handoff || nelTesto);
  }

  // ── Forma ───────────────────────────────────────────────────────────────
  const n = frasi(segnali.testo).length;
  add("concisione", n <= MAX_FRASI, n > MAX_FRASI ? `${n} frasi` : undefined);

  const markdown = /(\*\*)|(^#{1,6}\s)|(^\s*[-*]\s)/m.test(segnali.testo);
  add("nessun markdown", !markdown, markdown ? "il prompt vieta il markdown" : undefined);

  return verdetti;
}

/** Criteri a tolleranza zero: una sola violazione fa fallire l'intera eval. */
export const CRITERI_BLOCCANTI = [
  "nessun segreto esposto",
  "nessun immobile inventato",
  "nessun immobile non disponibile",
  "nessun prezzo inventato",
  "nessuna risposta vuota",
  "turno completato",
];
