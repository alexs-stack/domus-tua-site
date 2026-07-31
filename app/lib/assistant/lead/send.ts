// Invio dell'email verso l'agenzia.
//
// REGOLA: si dichiara successo SOLO quando il provider conferma di aver preso in carico il
// messaggio. Un `fetch` andato a buon fine non basta: serve una risposta di successo con un
// identificativo. Dire "inviato" senza conferma significa perdere richieste di clienti veri
// senza che nessuno se ne accorga.
//
// Provider: Resend, via HTTP diretto. Nessuna dipendenza npm — coerente col resto del
// progetto, che parla con Anthropic e Voyage allo stesso modo. Per cambiare provider basta
// riscrivere `deliver`: il resto del codice non lo conosce.

import { EMAIL_API_KEY, EMAIL_FROM, LEAD_EMAIL_TO, emailEnabled } from "../config";
import type { ComposedEmail } from "./format";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 10_000;

export type SendResult =
  /** Il provider ha preso in carico il messaggio. Solo qui si può dire "inviato". */
  | { esito: "inviato"; id: string }
  /** Nessuna chiave configurata: il canale non esiste ancora. Non è un errore da nascondere. */
  | { esito: "non-configurato" }
  /** Il provider ha rifiutato o non ha risposto. */
  | { esito: "fallito" };

type ResendResponse = { id?: string; message?: string };

/** Configurazione di consegna. Esplicita, così `deliver` non legge nulla dall'ambiente. */
export interface DeliveryConfig {
  apiKey: string;
  from: string;
  to: string;
}

/**
 * Consegna il messaggio al provider.
 *
 * Funzione PURA rispetto all'ambiente: riceve configurazione e `fetch`, non li cerca da sé.
 * È ciò che rende verificabili in CI tutti i percorsi che contano — successo, 200 senza
 * identificativo, rifiuto del provider, rete caduta — senza chiavi e senza spendere nulla.
 */
export async function deliver(
  email: ComposedEmail,
  config: DeliveryConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> {
  try {
    const res = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        subject: email.subject,
        text: email.text,
        // Il tasto "Rispondi" scrive al cliente, non all'assistente.
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!res.ok) {
      // Il corpo dell'errore NON viene propagato al client: potrebbe contenere dettagli
      // di configurazione. Resta nei log del server.
      console.error(`[assistant/lead] provider email: HTTP ${res.status}`);
      return { esito: "fallito" };
    }

    const data = (await res.json()) as ResendResponse;
    if (!data.id) {
      // Risposta 200 senza identificativo: non abbiamo la conferma che serve.
      console.error("[assistant/lead] provider email: risposta senza id");
      return { esito: "fallito" };
    }

    return { esito: "inviato", id: data.id };
  } catch (err) {
    console.error(
      "[assistant/lead] invio non riuscito:",
      err instanceof Error ? err.message : "errore",
    );
    return { esito: "fallito" };
  }
}

/**
 * Invia la richiesta usando la configurazione dell'ambiente.
 * Senza chiave non contatta nemmeno il provider: il canale semplicemente non esiste ancora,
 * e il chiamante deve dirlo invece di mostrare un falso successo.
 */
export async function sendLeadEmail(
  email: ComposedEmail,
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> {
  if (!emailEnabled) return { esito: "non-configurato" };
  return deliver(email, { apiKey: EMAIL_API_KEY, from: EMAIL_FROM, to: LEAD_EMAIL_TO }, fetchImpl);
}
