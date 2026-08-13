import { NextResponse } from "next/server";
import { rateLimit, clientIp, LEAD_LIMIT } from "../../lib/security/rateLimit";
import { validateLead } from "../../lib/forms/validateLead";
import { notifyLeadByEmail } from "../../lib/forms/leadEmail";

// Endpoint di cattura lead. Riceve il Lead dal form contatti, lo VALIDA/ripulisce
// (app/lib/forms/validateLead.ts) e lo instrada su DUE canali best-effort:
//  • notifica EMAIL all'agenzia (Resend, riuso del trasporto dell'assistente —
//    app/lib/forms/leadEmail.ts). Server-only, chiave in env: senza chiave non
//    parte (stato di oggi in produzione), quindi nessuna consegna finché non la
//    si configura di proposito;
//  • riga su GOOGLE SHEET se SHEETS_WEBHOOK_URL è configurato (Apps Script Web
//    App — vedi docs/form-backend-next-step.md).
// Entrambe le credenziali sono SERVER-ONLY (mai NEXT_PUBLIC_): mai esposte al client.
//
// Best-effort: se nessun canale è configurato o entrambi falliscono, rispondiamo
// comunque con ok:false — il form usa WhatsApp come canale immediato e non deve mai rompersi.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBHOOK = process.env.SHEETS_WEBHOOK_URL;
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  // Rate limit per IP (best-effort in-memory): argine contro submit ripetuti/flood.
  const rl = rateLimit(`lead:${clientIp(req)}`, LEAD_LIMIT);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, reason: "rate-limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "bad-payload" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // Anti-spam honeypot: il campo "company" è nascosto nel form, un umano non lo compila.
  // Se valorizzato è un bot → fingiamo successo e NON scriviamo sul foglio.
  if (typeof payload.company === "string" && payload.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // Validazione + whitelist: scarta campi ignoti, applica cap di lunghezza, verifica intento/
  // nome/contatto/consenso. Errori "safe" (nessun dettaglio interno).
  const result = validateLead(payload);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const record = { ...result.lead, createdAt: new Date().toISOString() };

  // ── Canale 1: notifica email (Resend condiviso). Best-effort, env-gated. ──
  // Senza chiave torna "non-configurato" e NON contatta nessun provider: nessuna
  // consegna in produzione finché la chiave non è impostata. Mai PII nei log.
  let emailSent = false;
  try {
    const mail = await notifyLeadByEmail(result.lead);
    emailSent = mail.esito === "inviato";
    if (mail.esito === "fallito") {
      console.error("[lead] notifica email: invio non riuscito");
    }
  } catch (err) {
    console.error("[lead] notifica email: errore", err instanceof Error ? err.message : err);
  }

  // ── Canale 2: Google Sheet, se configurato. ──
  let sheetSaved = false;
  if (WEBHOOK) {
    try {
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(record),
        // Apps Script può essere lento a freddo: non teniamo appesa la richiesta.
        signal: AbortSignal.timeout(8000),
      });
      sheetSaved = res.ok;
    } catch (err) {
      // Logghiamo l'errore di rete, MAI il contenuto del lead (PII).
      console.error("[lead] invio al webhook fallito:", err instanceof Error ? err.message : err);
    }
  } else if (!IS_PROD) {
    // Solo in sviluppo: eco del record per ispezione locale (in prod mai PII).
    console.info("[lead] SHEETS_WEBHOOK_URL non configurato — lead non salvato su foglio:", record);
  }

  if (!emailSent && !sheetSaved) {
    // Nessun canale ha preso in carico il lead: non fingiamo un successo.
    // In PRODUZIONE il log resta non identificante (solo l'intento).
    if (IS_PROD) {
      console.info(`[lead] nessun canale configurato/riuscito (intent=${record.intent})`);
    }
    return NextResponse.json({ ok: false, reason: "not-delivered" });
  }
  return NextResponse.json({ ok: true });
}
