"use server";

// Le AZIONI della redazione d'area.
//
// Sono endpoint, e vanno lette come tali: chiunque conosca l'identificativo dell'azione può
// invocarle, anche senza aver mai aperto la pagina. Perciò nessuna di queste funzioni decide
// nulla — ognuna legge l'identità dal COOKIE e delega al servizio, che controlla i permessi
// prima di scrivere. La UI nasconde i pulsanti che non servono; la difesa è qui sotto.
//
// CSRF: Next verifica l'origine delle azioni server, e in più il cookie di sessione è
// `SameSite=Strict` — quindi non viaggia con una richiesta partita da un altro sito.

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { currentSession, reviewService } from "./session";
import { REVIEW_COOKIE, verifyReviewToken } from "../lib/territory/area/review/auth";
import { ReviewOperationError } from "../lib/territory/area/review/service";
import { ReviewAuthError } from "../lib/territory/area/review/auth";

export interface ActionResult {
  ok: boolean;
  message: string;
  /** I motivi puntuali quando un guard ha rifiutato: si mostrano accanto al pulsante. */
  reasons?: string[];
}

/**
 * Esegue un'operazione e traduce gli errori in un esito leggibile.
 *
 * Gli errori NON si propagano alla pagina: un errore di autorizzazione che diventa una schermata
 * di errore dice a chi ci prova che l'endpoint esiste e cosa gli manca. Un esito uniforme dice
 * solo che non si può.
 */
async function run(fn: () => Promise<unknown>, success: string): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true, message: success };
  } catch (err) {
    if (err instanceof ReviewOperationError) {
      return { ok: false, message: err.message, reasons: err.reasons };
    }
    if (err instanceof ReviewAuthError) {
      return { ok: false, message: "Operazione non consentita." };
    }
    // Errore inatteso: messaggio generico. Il dettaglio va nei log del server, non in pagina.
    console.error("[area-review] azione fallita:", err instanceof Error ? err.message : String(err));
    return { ok: false, message: "Errore interno." };
  }
}

/** Apre una sessione da un token emesso via CLI. Non esiste una pagina di login pubblica. */
export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  const session = verifyReviewToken(token, new Date());
  if (!session) return { ok: false, message: "Token non valido o scaduto." };

  const store = await cookies();
  store.set(REVIEW_COOKIE, token, {
    httpOnly: true, // il token non deve essere leggibile da JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // non viaggia con richieste partite da un altro sito
    path: "/area-review",
    expires: new Date(session.expiresAt * 1000),
  });
  revalidatePath("/area-review");
  return { ok: true, message: `Sessione aperta come ${session.actor} (${session.role}).` };
}

export async function signOut(): Promise<ActionResult> {
  const store = await cookies();
  store.delete(REVIEW_COOKIE);
  revalidatePath("/area-review");
  return { ok: true, message: "Sessione chiusa." };
}

export async function approveFact(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const areaKey = String(formData.get("areaKey") ?? "");
  const factId = String(formData.get("factId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const result = await run(
    async () =>
      reviewService().approveFact(await currentSession(), {
        areaKey,
        factId,
        ...(reason ? { reason } : {}),
      }),
    "Fatto approvato.",
  );
  revalidatePath("/area-review");
  return result;
}

export async function rejectFact(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const result = await run(
    async () =>
      reviewService().rejectFact(await currentSession(), {
        areaKey: String(formData.get("areaKey") ?? ""),
        factId: String(formData.get("factId") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      }),
    "Fatto rifiutato.",
  );
  revalidatePath("/area-review");
  return result;
}

export async function approveNarrative(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const reason = String(formData.get("reason") ?? "").trim();
  const result = await run(
    async () =>
      reviewService().approveNarrative(await currentSession(), {
        areaKey: String(formData.get("areaKey") ?? ""),
        ...(reason ? { reason } : {}),
      }),
    "Narrativa approvata.",
  );
  revalidatePath("/area-review");
  return result;
}

export async function publishProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const result = await run(
    async () =>
      reviewService().publishProfile(await currentSession(), {
        areaKey: String(formData.get("areaKey") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      }),
    "Profilo pubblicato.",
  );
  revalidatePath("/area-review");
  return result;
}

export async function unpublishProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const result = await run(
    async () =>
      reviewService().unpublishProfile(await currentSession(), {
        areaKey: String(formData.get("areaKey") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      }),
    "Profilo ritirato.",
  );
  revalidatePath("/area-review");
  return result;
}

export async function markInsufficient(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const result = await run(
    async () =>
      reviewService().markInsufficientEvidence(await currentSession(), {
        areaKey: String(formData.get("areaKey") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      }),
    "Area segnata come «prove insufficienti».",
  );
  revalidatePath("/area-review");
  return result;
}

export async function requestRegeneration(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const result = await run(
    async () =>
      reviewService().requestRegeneration(await currentSession(), {
        areaKey: String(formData.get("areaKey") ?? ""),
        reason: String(formData.get("reason") ?? ""),
      }),
    "Rigenerazione accodata.",
  );
  revalidatePath("/area-review");
  return result;
}
