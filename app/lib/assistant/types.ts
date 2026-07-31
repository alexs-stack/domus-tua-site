// Contratti condivisi tra server e client dell'assistente.
// Questo file è importato ANCHE dal bundle client: non deve contenere segreti né logica.

/** Riepilogo immobile mostrato come card nella chat. Tutti i campi sono già pubblici. */
export interface ListingCard {
  slug: string;
  title: string;
  /** Comune (+ provincia se nota). */
  zone: string;
  /** Prezzo già formattato, es. "€ 245.000" o "Prezzo su richiesta". */
  price: string;
  type: string;
  /** Percorso relativo della scheda sul sito. */
  url: string;
  cover: string;
}

/** Passaggio a un canale umano. L'assistente PREPARA, non invia mai nulla da solo. */
export type Handoff =
  | { kind: "whatsapp"; url: string; message: string; label: string }
  | { kind: "email"; to: string; subject: string; body: string; listingSlug?: string; label: string }
  | { kind: "phone"; url: string; label: string };

/**
 * Eventi inviati al client via SSE, uno per riga `data:`.
 * Protocollo minimale scritto a mano: la UI resta custom e il bundle browser non
 * cresce (nessun @ai-sdk/react).
 */
export type AssistantEvent =
  /** Frammento di testo da appendere alla risposta in corso. */
  | { type: "text"; value: string }
  /** Immobili trovati da un tool in QUESTO turno. Mai riproposti da turni precedenti. */
  | { type: "listings"; value: ListingCard[] }
  /** Canale di contatto pronto per l'utente. */
  | { type: "handoff"; value: Handoff }
  /**
   * La risposta si è interrotta prima di essere completa.
   * `length` = raggiunto il tetto di token; `error` = lo stream è caduto a metà.
   * In entrambi i casi il testo già mostrato è valido: manca solo il seguito, e l'utente
   * deve saperlo invece di leggere una frase troncata come se fosse la risposta.
   */
  | { type: "incomplete"; value: { reason: "length" | "error" } }
  /** Errore già sanificato: `code` è un'etichetta, mai un messaggio interno. */
  | { type: "error"; value: { code: AssistantErrorCode } }
  /** Fine del turno. Sempre inviato, anche dopo un errore. */
  | { type: "done" };

/** Codici d'errore esposti al client. Nessun dettaglio tecnico, nessuno stack, nessun PII. */
export type AssistantErrorCode =
  /** Provider AI non configurato o irraggiungibile. */
  | "provider-unavailable"
  /** Il turno ha superato il tempo massimo. */
  | "timeout"
  /** Troppe richieste dallo stesso IP. */
  | "rate-limited"
  /** Richiesta malformata. */
  | "bad-request"
  /** Qualsiasi altro problema. */
  | "error";

/** Un messaggio della conversazione così come lo invia il client. */
export interface ClientMessage {
  role: "user" | "assistant";
  content: string;
  /**
   * Slug degli immobili mostrati insieme a questo messaggio dell'assistente.
   * Serve a rispondere a "la seconda ha il garage?" senza rifare la ricerca.
   * ⚠️ Dato che arriva dal client è NON attendibile: il server lo valida contro il feed
   * live e scarta gli slug inesistenti (difesa contro l'iniezione di immobili falsi).
   */
  listingSlugs?: string[];
}
