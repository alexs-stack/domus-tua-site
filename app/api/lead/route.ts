import { NextResponse } from "next/server";
import { rateLimit, clientIp, LEAD_LIMIT } from "../../lib/security/rateLimit";
import { validateLead } from "../../lib/forms/validateLead";

// Endpoint di cattura lead. Riceve il Lead dal form contatti, lo VALIDA/ripulisce
// (app/lib/forms/validateLead.ts) e, se SHEETS_WEBHOOK_URL è configurato (Google Apps Script
// Web App legato a un Google Sheet — vedi docs/form-backend-next-step.md), inoltra il record.
// L'URL del webhook è SERVER-ONLY (mai NEXT_PUBLIC_): non viene mai esposto al client.
//
// Best-effort: se il webhook non è configurato o fallisce, rispondiamo comunque 200 con
// ok:false — il form usa WhatsApp come canale immediato e non deve mai rompersi.
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

  if (!WEBHOOK) {
    // Backend non ancora configurato: non persistiamo, ma non blocchiamo il flusso.
    // In PRODUZIONE non logghiamo PII (nome/contatto): solo un riassunto non identificante.
    if (IS_PROD) {
      console.info(`[lead] SHEETS_WEBHOOK_URL non configurato — lead non salvato (intent=${record.intent})`);
    } else {
      console.info("[lead] SHEETS_WEBHOOK_URL non configurato — lead non salvato:", record);
    }
    return NextResponse.json({ ok: false, reason: "not-configured" });
  }

  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(record),
      // Apps Script può essere lento a freddo: non teniamo appesa la richiesta.
      signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json({ ok: res.ok });
  } catch (err) {
    // Logghiamo l'errore di rete, MAI il contenuto del lead (PII).
    console.error("[lead] invio al webhook fallito:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, reason: "webhook-failed" });
  }
}
