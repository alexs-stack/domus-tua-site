// Vista degli immobili riservata all'assistente conversazionale.
//
// REGOLA NON NEGOZIABILE: l'assistente non cita MAI immobili mock.
// Il resto del sito, se il feed RealSmart cade, ripiega sulle fixture demo per non mostrare
// una pagina vuota. Per l'assistente quel comportamento sarebbe un'invenzione: direbbe a un
// utente reale che esiste una villa che non esiste. Qui, se la sorgente non è il gestionale,
// lo snapshot risulta NON disponibile e i tool rispondono onestamente ("non riesco a
// consultare gli immobili in questo momento") proponendo WhatsApp/telefono.
//
// Conseguenza per lo sviluppo locale: con NEXT_PUBLIC_USE_REALSMART="false" l'assistente non
// trova immobili. Il feed è un URL pubblico, quindi in locale basta lasciare il default (live).
// I test non dipendono dalla rete: usano fixture iniettate direttamente nei tool.

import { getLiveListingsSnapshot, type ListingsSource } from "../realsmart/client";
import { comuneOf } from "../comune";
import { normalizedToProperty } from "../realsmart/toProperty";
import type { NormalizedProperty } from "../realsmart/types";
import type { Property } from "../properties";

/**
 * Fotografia degli immobili per un turno di conversazione.
 *
 * Le due viste descrivono gli STESSI immobili nello stesso ordine:
 *  - `properties`   → forma usata dai filtri e dal ranking già esistenti (app/lib/ai/rank.ts);
 *  - `normalizedBySlug` → forma numerica ricca (mq/locali/bagni a 0 quando il dato manca),
 *    necessaria per distinguere "non presente" da "informazione non disponibile".
 */
export interface AssistantListings {
  /** false = feed non consultabile (o modalità mock): nessun immobile va citato. */
  available: boolean;
  /** Immobili disponibili all'acquisto/affitto (i venduti sono già esclusi). */
  properties: Property[];
  normalizedBySlug: Map<string, NormalizedProperty>;
  /**
   * Nomi dei comuni del catalogo disponibile ("Tradate").
   *
   * La forma è quella canonica di `app/lib/comune.ts`, condivisa con /api/search, i filtri
   * del client e la mappa: una sola definizione di "comune" per tutto il sito.
   */
  comuni: string[];
}

const EMPTY: AssistantListings = {
  available: false,
  properties: [],
  normalizedBySlug: new Map(),
  comuni: [],
};

/**
 * Costruisce la vista dell'assistente da uno snapshot RealSmart.
 * Funzione PURA: nessuna rete, nessuna cache. È il punto d'ingresso usato dai test.
 */
export function buildAssistantListings(
  listings: NormalizedProperty[],
  source: ListingsSource,
): AssistantListings {
  // Sorgente non reale = nessun immobile citabile. Vedi la nota in testa al file.
  if (source !== "live") return EMPTY;

  const normalizedBySlug = new Map<string, NormalizedProperty>();
  const properties: Property[] = [];
  const comuniSet = new Set<string>();

  for (const n of listings) {
    const property = normalizedToProperty(n);
    // I venduti/affittati restano fuori: `sold` copre anche i casi che il feed non dichiara
    // (badge bruciato sulla copertina, rilevato via OCR — vedi realsmart/soldOverrides.ts).
    if (property.sold) continue;
    normalizedBySlug.set(property.slug, n);
    properties.push(property);

    // Stessa derivazione usata da /api/search e dalla tendina del client.
    const comune = comuneOf(property.zone);
    if (comune) comuniSet.add(comune);
  }

  const comuni = Array.from(comuniSet).sort((a, b) => a.localeCompare(b, "it"));

  return { available: properties.length > 0, properties, normalizedBySlug, comuni };
}

/**
 * Immobili consultabili dall'assistente in questo istante.
 *
 * Difensiva: qualsiasi errore diventa uno snapshot non disponibile, mai un throw verso
 * l'agente (che altrimenti interromperebbe lo streaming a metà risposta).
 */
export async function getAssistantListings(): Promise<AssistantListings> {
  try {
    const snapshot = await getLiveListingsSnapshot();
    return buildAssistantListings(snapshot.listings, snapshot.source);
  } catch (err) {
    console.error(
      "[assistant] snapshot immobili non disponibile:",
      err instanceof Error ? err.message : err,
    );
    return EMPTY;
  }
}
