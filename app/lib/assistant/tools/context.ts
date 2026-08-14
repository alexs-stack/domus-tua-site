// Contesto condiviso dai tool di un singolo turno.
//
// I tool non leggono variabili globali: ricevono tutto da qui. Questo li rende
// completamente testabili con fixture, senza rete e senza feed RealSmart.

import type { AssistantListings } from "../listings";
import type { AssistantEvent } from "../types";
import type { AssistantTerritoryReader } from "./territory";
import type { ObservabilitySink } from "../../territory/observe";

export interface ToolContext {
  /** Fotografia degli immobili per questo turno (già priva di venduti e di mock). */
  listings: AssistantListings;
  /**
   * Lettore territoriale (Prompt 13): SOLO se la feature è attiva. Assente = territorio disabilitato,
   * comportamento invariato (get_area_profile non registrato, get_listing_details senza territorio).
   */
  territory?: AssistantTerritoryReader;
  /**
   * Osservabilità (Prompt 14, cablata qui): uso degli strumenti territoriali e fallback quando il
   * dato manca/è datato. Solo enum e booleani — nessun contenuto della conversazione.
   */
  sink?: ObservabilitySink;
  /** ID di correlazione del turno. NON legato all'identità dell'utente. */
  turnId?: string;
  /**
   * Invia un evento alla UI mentre il turno è in corso.
   * È il canale con cui le card immobili e i pulsanti di contatto compaiono in chat
   * nell'istante in cui il tool produce il risultato, non a fine risposta.
   */
  emit: (event: AssistantEvent) => void;
  /** Pagina da cui l'utente sta scrivendo (percorso relativo), se nota. */
  pagePath?: string;
}
