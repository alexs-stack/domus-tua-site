// Contesto condiviso dai tool di un singolo turno.
//
// I tool non leggono variabili globali: ricevono tutto da qui. Questo li rende
// completamente testabili con fixture, senza rete e senza feed RealSmart.

import type { AssistantListings } from "../listings";
import type { AssistantEvent } from "../types";
import type { AssistantTerritory } from "../../territory/assistant";

export interface ToolContext {
  /** Fotografia degli immobili per questo turno (già priva di venduti e di mock). */
  listings: AssistantListings;
  /**
   * Risolutore dei dati territoriali VERIFICATI per un codice RealSmart. Opzionale: se assente
   * (o se ritorna null) l'assistente non ha dati territoriali e lo dichiara. Non chiama mai un
   * provider esterno né riceve coordinate: legge solo dato approvato locale.
   */
  territory?: (realSmartCode: string) => Promise<AssistantTerritory | null>;
  /**
   * Invia un evento alla UI mentre il turno è in corso.
   * È il canale con cui le card immobili e i pulsanti di contatto compaiono in chat
   * nell'istante in cui il tool produce il risultato, non a fine risposta.
   */
  emit: (event: AssistantEvent) => void;
  /** Pagina da cui l'utente sta scrivendo (percorso relativo), se nota. */
  pagePath?: string;
}
