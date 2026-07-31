// Validazione della richiesta all'assistente.
//
// Separata dalla route perché è la superficie che riceve input non fidato: va testata
// da sola, con i casi limite (body enorme, ruoli falsificati, slug inventati, campi estranei).

import { z } from "zod";
import { MAX_MESSAGES, MAX_MESSAGE_LEN, MAX_SHOWN_SLUGS } from "./config";
import type { ClientMessage } from "./types";

/**
 * Schema del body. `strict()` scarta i campi ignoti invece di ignorarli in silenzio:
 * un client che manda cose non previste è un segnale, non un dettaglio.
 */
const bodySchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(MAX_MESSAGE_LEN),
            listingSlugs: z.array(z.string().min(1).max(160)).max(MAX_SHOWN_SLUGS).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_MESSAGES),
    /**
     * Percorso relativo della pagina di origine.
     * Mai un URL assoluto e mai protocol-relative ("//evil.test"): finisce concatenato a
     * SITE_URL nei messaggi di handoff, e un `//` lì dentro punterebbe a un altro dominio.
     */
    pagePath: z
      .string()
      .max(200)
      .regex(/^\/(?!\/)[^\s]*$/, "percorso relativo")
      .optional(),
  })
  .strict();

export type AssistantRequest = {
  messages: ClientMessage[];
  pagePath?: string;
};

export type ValidationResult =
  | { ok: true; request: AssistantRequest }
  | { ok: false; code: "bad-request" };

/**
 * Valida e normalizza il body.
 *
 * Oltre allo schema applica due regole di conversazione:
 *  - i messaggi vuoti (solo spazi) vengono scartati;
 *  - l'ultimo messaggio deve essere dell'utente, altrimenti non c'è nulla a cui rispondere.
 */
export function parseAssistantRequest(raw: unknown): ValidationResult {
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "bad-request" };

  const messages: ClientMessage[] = parsed.data.messages
    .map((m) => ({
      role: m.role,
      content: m.content.trim(),
      listingSlugs: m.listingSlugs,
    }))
    .filter((m) => m.content.length > 0);

  if (messages.length === 0) return { ok: false, code: "bad-request" };
  if (messages[messages.length - 1].role !== "user") return { ok: false, code: "bad-request" };

  return { ok: true, request: { messages, pagePath: parsed.data.pagePath } };
}
