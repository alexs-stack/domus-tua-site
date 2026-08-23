// Il ponte fra il cookie della richiesta e la sessione editoriale. SERVER-ONLY.
//
// Sta in un file suo per una ragione precisa: l'accesso al cookie è l'UNICO punto in cui
// l'identità entra nel sistema. Tenerlo separato dalle operazioni (../lib/territory/area/review)
// significa che il servizio editoriale resta puro e testabile senza una richiesta HTTP finta —
// e che nessuno può passare una sessione come parametro dall'esterno, che è il modo classico in
// cui un'autorizzazione si aggira.

import { cookies } from "next/headers";

import {
  REVIEW_COOKIE,
  verifyReviewToken,
  isReviewConfigured,
  type ReviewSession,
} from "../lib/territory/area/review/auth";
import { AreaReviewService } from "../lib/territory/area/review/service";
import { createAreaRepository } from "../lib/territory/area/store/config";
import { AREA_PROMPT_VERSION } from "../lib/territory/area/types";

/** La sessione della richiesta corrente, o `null`. Mai un parametro: sempre dal cookie. */
export async function currentSession(): Promise<ReviewSession | null> {
  if (!isReviewConfigured()) return null;
  const store = await cookies();
  return verifyReviewToken(store.get(REVIEW_COOKIE)?.value, new Date());
}

/**
 * Il servizio editoriale per questa richiesta.
 *
 * Può LANCIARE se lo storage durevole non è configurato in produzione: è voluto, ed è lo stesso
 * fail-closed di `createAreaRepository`. Meglio una pagina che dice «storage non configurato»
 * che una redazione che sembra funzionare e scrive in memoria.
 */
export function reviewService(): AreaReviewService {
  return new AreaReviewService({
    repo: createAreaRepository(),
    now: () => new Date(),
    promptVersion: AREA_PROMPT_VERSION,
  });
}
