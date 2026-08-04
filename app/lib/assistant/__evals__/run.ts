// Esecuzione dell'eval: prende un caso, esegue il turno, raccoglie i segnali, applica i grader.
//
// Il modello è iniettabile. Due modalità:
//  • REALE — con un provider configurato (Gemini o Claude): misura il comportamento vero
//    e la latenza vera.
//  • SIMULATA — con MockLanguageModelV4: verifica che l'harness e i grader funzionino, e
//    copre per intero il gruppo "errore". Serve a sapere che l'eval è affidabile PRIMA di
//    spendere in chiamate reali: un grader che non sa riconoscere un immobile inventato darebbe
//    un 100% rassicurante e falso.

import type { LanguageModel } from "ai";
import { runAssistantTurn } from "../agent";
import { buildAssistantListings, type AssistantListings } from "../listings";
import { normalizedToProperty } from "../../realsmart/toProperty";
import type { NormalizedProperty } from "../../realsmart/types";
import type { ClientMessage } from "../types";
import type { EvalCase } from "./cases";
import { CRITERI_BLOCCANTI, grade, type EvalSignals, type Verdict } from "./graders";

export interface EvalResult {
  caso: EvalCase;
  segnali: EvalSignals;
  verdetti: Verdict[];
  /** true se nessun criterio è fallito. */
  superato: boolean;
  /** true se è fallito un criterio a tolleranza zero. */
  bloccante: boolean;
}

/** Costruisce la cronologia: i turni utente alternati a risposte segnaposto. */
function cronologia(turni: string[], slugPrecedenti: string[]): ClientMessage[] {
  const messaggi: ClientMessage[] = [];
  turni.forEach((turno, i) => {
    if (i > 0) {
      // Turno precedente dell'assistente. Gli slug sono quelli davvero mostrati prima:
      // è così che il modello può rispondere a "la seconda".
      messaggi.push({
        role: "assistant",
        content: "Ecco cosa ho trovato.",
        ...(slugPrecedenti.length ? { listingSlugs: slugPrecedenti } : {}),
      });
    }
    messaggi.push({ role: "user", content: turno });
  });
  return messaggi;
}

export interface RunOptions {
  /**
   * Fabbrica del modello, invocata UNA VOLTA PER TURNO.
   *
   * Non un'istanza sola: un modello simulato che tiene il conto dei passi arriverebbe al
   * secondo turno già "esaurito" e salterebbe la chiamata allo strumento, facendo sembrare
   * un difetto dell'assistente quello che è un difetto del banco di prova.
   * Assente = modello di produzione (richiede un provider configurato).
   */
  makeModel?: () => LanguageModel;
  /** Catalogo immobili. */
  listings: AssistantListings;
  /** Slug non disponibili (venduti), che non devono mai comparire. */
  slugNonDisponibili: string[];
}

/**
 * Esegue un caso e lo giudica.
 *
 * I casi multi-turno vengono eseguiti davvero più volte: il primo turno produce gli slug che
 * il secondo userà come contesto. Simularlo con slug inventati falserebbe proprio ciò che
 * questi casi devono misurare.
 */
export async function runCase(caso: EvalCase, options: RunOptions): Promise<EvalResult> {
  const listings = caso.guasto === "feed-giu"
    ? buildAssistantListings([], "mock")
    : options.listings;

  let slugPrecedenti: string[] = [];

  // Turni intermedi: servono solo a produrre il contesto per l'ultimo.
  for (let i = 1; i < caso.turni.length; i++) {
    const parziale = await eseguiTurno(
      cronologia(caso.turni.slice(0, i), slugPrecedenti),
      { ...options, listings },
      caso,
    );
    if (parziale.slugMostrati.length) slugPrecedenti = parziale.slugMostrati;
  }

  const segnali = await eseguiTurno(
    cronologia(caso.turni, slugPrecedenti),
    { ...options, listings },
    caso,
  );

  const verdetti = grade({
    caso,
    segnali,
    listings: options.listings,
    slugNonDisponibili: options.slugNonDisponibili,
  });

  const falliti = verdetti.filter((v) => !v.ok);
  return {
    caso,
    segnali,
    verdetti,
    superato: falliti.length === 0,
    bloccante: falliti.some((v) => CRITERI_BLOCCANTI.includes(v.criterio)),
  };
}

/** Esegue un singolo turno e raccoglie i segnali osservabili. */
async function eseguiTurno(
  messaggi: ClientMessage[],
  options: RunOptions,
  caso: EvalCase,
): Promise<EvalSignals> {
  const inizio = Date.now();
  let msPrimoToken: number | null = null;
  let testo = "";
  const slugMostrati: string[] = [];
  let handoff = false;
  let completato = false;

  // Gli strumenti invocati non compaiono negli eventi verso la UI (volutamente minimali):
  // l'agente li segnala a parte, server-side, tramite `onToolCall`.
  const toolUsati: string[] = [];

  for await (const evento of runAssistantTurn({
    messages: messaggi,
    model: options.makeModel?.(),
    listings: options.listings,
    onToolCall: (name) => toolUsati.push(name),
  })) {
    if (evento.type === "text") {
      if (msPrimoToken === null) msPrimoToken = Date.now() - inizio;
      testo += evento.value;
    } else if (evento.type === "listings") {
      slugMostrati.push(...evento.value.map((c) => c.slug));
    } else if (evento.type === "handoff") {
      handoff = true;
    } else if (evento.type === "done") {
      completato = true;
    }
  }

  void caso;
  return { testo, toolUsati, slugMostrati, handoff, msPrimoToken, completato };
}

/** Immobili non disponibili del catalogo: quelli che `buildAssistantListings` scarta. */
export function slugNonDisponibili(tutti: NormalizedProperty[]): string[] {
  return tutti.map(normalizedToProperty).filter((p) => p.sold).map((p) => p.slug);
}
