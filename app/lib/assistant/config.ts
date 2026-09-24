// Configurazione dell'assistente conversazionale. SERVER-ONLY per tutto ciò che è segreto.
//
// I dati di contatto NON si duplicano qui: arrivano da app/lib/site.ts, che è la fonte unica
// (un test di integrità dei contenuti lo verifica).
//
// Nessun valore sensibile esce da qui: la route espone al client solo booleani derivati.
// Tutti i limiti sono espliciti e testabili — sono la prima linea di difesa su costi e abuso.

import { site, siteUrl } from "../site";
import { AI_PROVIDER, ANTHROPIC_API_KEY, GEMINI_API_KEY, aiEnabled, byProvider } from "../ai/provider";

/**
 * Provider e chiavi. La scelta sta in app/lib/ai/provider.ts, unica per assistente e
 * ricerca: due feature sullo stesso modello non devono poter divergere per distrazione.
 * Chiavi vuote = assistente in modalità fallback onesto (nessuna chiamata AI).
 */
export { AI_PROVIDER, ANTHROPIC_API_KEY, GEMINI_API_KEY };

/**
 * Modello dell'assistente, per provider.
 *
 * Su Google è gemini-3.6-flash, non 2.5 Flash, e la differenza non è un dettaglio: misurata
 * con `npm run eval` (100 casi reali, stesso prompt e stessi tool) la scelta dello strumento
 * passa dal 67-84% al 100%, e i casi superati da 71-84 a 98. Il ragionamento va però tenuto
 * al minimo, altrimenti il primo token arriva dopo 6 secondi: vedi agent.ts.
 * Su Anthropic resta Haiku 4.5, stessa classe di costo e latenza.
 * Entrambi gli ID stanno nelle union tipizzate dei rispettivi provider (verificato in
 * node_modules/@ai-sdk/google e node_modules/@ai-sdk/anthropic).
 */
export const ASSISTANT_MODEL =
  process.env.AI_ASSISTANT_MODEL ||
  byProvider({ google: "gemini-3.6-flash", anthropic: "claude-haiku-4-5-20251001" });

/** true se il provider AI è configurato. Se false l'assistente risponde in fallback. */
export const assistantAiEnabled = aiEnabled;

// ── Limiti di richiesta (validazione lato route) ────────────────────────────

/** Byte massimi accettati nel body della richiesta. */
export const MAX_BODY_BYTES = 32 * 1024;
/** Numero massimo di messaggi accettati nella cronologia inviata dal client. */
export const MAX_MESSAGES = 24;
/** Caratteri massimi per singolo messaggio. */
export const MAX_MESSAGE_LEN = 1000;
/** Turni di cronologia effettivamente inoltrati al modello (costo/latenza). */
export const HISTORY_WINDOW = 12;
/** Slug di immobili "già mostrati" accettati dal client (validati contro il feed live). */
export const MAX_SHOWN_SLUGS = 12;

/**
 * Immobili elencati nel prompt di sistema come "già mostrati".
 *
 * Quanti servono davvero: gli ordinali ("la seconda", "le prime due") si riferiscono
 * all'ultima ricerca, che ne mostra al massimo quattro. Otto coprono anche un riferimento
 * al giro precedente.
 *
 * Perché serve un tetto: il numero di slug lo decide il CLIENT. Senza limite, una
 * conversazione lunga — o un client ostile — fa crescere il prompt di sistema a ogni
 * richiesta, e il costo con lui. È controllo dei costi, non ottimizzazione.
 */
export const MAX_SHOWN_IN_PROMPT = 8;

// ── Limiti del loop agente ──────────────────────────────────────────────────

/**
 * Passi massimi dell'agente. Un passo = una generazione (testo oppure tool call).
 * 6 lascia spazio a: ricerca → dettaglio → risposta, oppure knowledge → handoff → risposta.
 */
export const MAX_STEPS = 6;
/** Token massimi generati per turno: tiene le risposte brevi e il costo prevedibile. */
export const MAX_OUTPUT_TOKENS = 700;
/** Timeout complessivo del turno (abort dell'intero stream). */
export const TURN_TIMEOUT_MS = 25_000;
/** Timeout della singola esecuzione di un tool. */
export const TOOL_TIMEOUT_MS = 8_000;
/** Immobili restituiti al modello per ricerca (la UI ne mostra al massimo 4). */
export const RESULTS_PER_SEARCH = 4;

// ── Rate limiting (finestra di 10 minuti, allineata agli altri endpoint) ─────

const TEN_MIN = 10 * 60 * 1000;
/**
 * Turni di conversazione per IP. Più generoso di /api/lead (una conversazione reale fa
 * più turni) ma sufficiente a fermare flood e scraping del modello.
 * Override via env per poter stringere in produzione senza deploy di codice.
 */
export const ASSISTANT_LIMIT = {
  limit: Number(process.env.ASSISTANT_RATE_LIMIT) > 0 ? Number(process.env.ASSISTANT_RATE_LIMIT) : 30,
  windowMs: TEN_MIN,
};

// ── Contatti usati dai tool di handoff ──────────────────────────────────────

/**
 * Destinatario delle richieste generate dall'assistente.
 * ⚠️ Diverso dalla casella pubblica del sito (info@domustua.com): da confermare col cliente
 * se le due caselle coesistono. Vedi docs/assistant-architecture.md §9.
 */
export const LEAD_EMAIL_TO = process.env.ASSISTANT_LEAD_EMAIL_TO || "immobiliare@domustua.it";

/** Numero WhatsApp dell'agenzia in formato internazionale, ricavato dalla fonte unica. */
export const WHATSAPP_NUMBER = site.whatsapp.href.replace(/^.*wa\.me\/(\d+).*$/, "$1");

/**
 * Chiave del provider email (Resend). SERVER-ONLY.
 * Vuota = canale email non configurato: l'assistente NON deve fingere di aver inviato nulla,
 * ma WhatsApp e telefono restano attivi.
 */
export const EMAIL_API_KEY = process.env.ASSISTANT_EMAIL_API_KEY || "";

/**
 * Mittente delle richieste. Deve appartenere a un dominio verificato presso il provider,
 * altrimenti l'invio viene rifiutato. NON è l'indirizzo del cliente: quello finisce in reply-to.
 */
export const EMAIL_FROM = process.env.ASSISTANT_EMAIL_FROM || "assistente@domustua.it";

/** true se il canale email è configurato e può davvero inviare. */
export const emailEnabled = EMAIL_API_KEY.length > 0;

/**
 * Richieste email dell'ASSISTENTE per IP nella finestra di 10 minuti. Più stretto della chat:
 * qui si scrive a una persona. Nome distinto da LEAD_LIMIT del form contatti (rateLimit.ts, 8):
 * sono endpoint diversi con limiti diversi, e due costanti omonime confondevano.
 */
export const ASSISTANT_LEAD_LIMIT = { limit: 5, windowMs: TEN_MIN };

/**
 * URL canonico del sito, per i link assoluti nei messaggi di handoff.
 * Derivato da `siteUrl` di app/lib/site.ts: fonte unica, come impone il test di integrità
 * dei contenuti. Qui togliamo solo l'eventuale barra finale.
 */
export const SITE_URL = siteUrl.replace(/\/+$/, "");
