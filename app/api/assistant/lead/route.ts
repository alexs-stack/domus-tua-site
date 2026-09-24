import { NextResponse } from "next/server";
import { LEAD_LIMIT, MAX_BODY_BYTES } from "../../../lib/assistant/config";
import { composeLeadEmail, type ListingContext } from "../../../lib/assistant/lead/format";
import { sendLeadEmail } from "../../../lib/assistant/lead/send";
import { validateLead } from "../../../lib/assistant/lead/validate";
import { getAssistantListings } from "../../../lib/assistant/listings";
import { clientIp, rateLimitShared } from "../../../lib/security/rateLimit";

// Richiesta scritta lasciata dall'assistente → email a immobiliare@domustua.it.
//
// Nessuna persistenza: il contenuto viene formattato, inviato e dimenticato. Non tocca
// database, non tocca il webhook Google Sheets usato dal form del sito, e non allega mai
// la conversazione.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/** Esito comunicato al client. Nessun dettaglio tecnico, mai. */
type LeadResponse = {
  ok: boolean;
  /** Etichetta per il messaggio da mostrare. */
  code?: string;
};

export async function POST(req: Request): Promise<NextResponse<LeadResponse>> {
  // 1. Rate limit per IP: qui ogni richiesta finisce nella casella di una persona.
  const rl = await rateLimitShared(`assistant-lead:${clientIp(req)}`, LEAD_LIMIT);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, code: "rate-limited" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } },
    );
  }

  // 2. Dimensione del body.
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, code: "bad-request" }, { status: 413 });
    }
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, code: "bad-request" }, { status: 400 });
  }

  // 3. Validazione + antispam.
  const validated = validateLead(raw);
  if (!validated.ok) {
    // Bot in trappola (honeypot, messaggio pieno di link): rispondiamo come se fosse andata
    // bene, senza inviare nulla. Dirgli che è stato scoperto gli insegnerebbe come passare.
    if (validated.silenzioso) return NextResponse.json({ ok: true });
    return NextResponse.json({ ok: false, code: validated.code }, { status: 400 });
  }

  // 4. L'immobile di interesse vale solo se esiste davvero nel catalogo live: uno slug
  //    inventato dal client non deve finire nell'email come se fosse un immobile reale.
  let listing: ListingContext | undefined;
  if (validated.lead.immobile) {
    const listings = await getAssistantListings();
    const property = listings.properties.find((p) => p.slug === validated.lead.immobile);
    if (property) {
      listing = {
        slug: property.slug,
        title: property.title,
        zone: property.zone,
        price: property.price,
      };
    }
  }

  // 5. Invio. Successo SOLO su conferma del provider.
  const email = composeLeadEmail(validated.lead, listing);
  const result = await sendLeadEmail(email);

  if (result.esito === "non-configurato") {
    // Nessun falso successo: il client mostrerà WhatsApp e telefono, che funzionano.
    console.info("[assistant/lead] canale email non configurato — richiesta non inviata");
    return NextResponse.json({ ok: false, code: "email-non-configurata" }, { status: 503 });
  }

  if (result.esito === "fallito") {
    return NextResponse.json({ ok: false, code: "invio-fallito" }, { status: 502 });
  }

  // Log senza PII: mai nome, contatto o testo del messaggio.
  console.info(`[assistant/lead] richiesta inviata (${result.id})`);
  return NextResponse.json({ ok: true });
}
