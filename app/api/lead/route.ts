import { NextResponse } from "next/server";
import { rateLimit, clientIp, LEAD_LIMIT } from "../../lib/security/rateLimit";
import { validateLead } from "../../lib/forms/validateLead";
import { sendLeadEmail } from "../../lib/forms/email";

// Endpoint di cattura lead. Riceve il Lead dal form contatti, lo VALIDA/ripulisce
// (app/lib/forms/validateLead.ts) e lo spedisce via email all'agenzia
// (app/lib/forms/email.ts → Resend). Nessuna persistenza: niente database, niente foglio di
// calcolo, niente gestionale esterno. Le chiavi del provider sono server-only.
//
// ONESTÀ DELLA RISPOSTA: `ok: true` viene restituito SOLO se il provider ha accettato l'email.
// In ogni altro caso il client riceve `ok: false` con un `reason` stabile e mostra WhatsApp e
// telefono. Non si dichiara mai inviata una richiesta che non è partita.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cap sul corpo della richiesta: un payload abnorme viene rifiutato prima del parsing. */
const MAX_BODY_BYTES = 32_000;

/** Log senza PII: mai nome, contatto o messaggio, in nessun ambiente. */
function logOutcome(outcome: string, intent?: string): void {
  console.info(`[lead] ${outcome}${intent ? ` (intent=${intent})` : ""}`);
}

export async function POST(req: Request) {
  // Rate limit per IP (best-effort in-memory): argine contro submit ripetuti/flood.
  const rl = rateLimit(`lead:${clientIp(req)}`, LEAD_LIMIT);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, reason: "rate-limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } },
    );
  }

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, reason: "invalid", error: "too-large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid", error: "bad-json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, reason: "invalid", error: "bad-payload" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // Anti-spam honeypot: il campo "company" è nascosto nel form, un umano non lo compila.
  // Se valorizzato è un bot → rispondiamo ok senza spedire nulla (il bot non impara nulla).
  if (typeof payload.company === "string" && payload.company.trim() !== "") {
    logOutcome("honeypot: nessuna email inviata");
    return NextResponse.json({ ok: true });
  }

  // Validazione + whitelist: scarta campi ignoti, applica cap di lunghezza, verifica intento/
  // nome/contatto/consenso. Errori "safe" (nessun dettaglio interno).
  const result = validateLead(payload);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, reason: "invalid", error: result.error },
      { status: 400 },
    );
  }

  const sent = await sendLeadEmail(result.lead);
  if (!sent.ok) {
    logOutcome(
      sent.reason === "not-configured"
        ? "provider email non configurato — richiesta NON inviata"
        : "provider email in errore — richiesta NON inviata",
      result.lead.intent,
    );
    return NextResponse.json(
      { ok: false, reason: sent.reason },
      { status: sent.reason === "not-configured" ? 503 : 502 },
    );
  }

  logOutcome("email consegnata al provider", result.lead.intent);
  return NextResponse.json({ ok: true });
}
