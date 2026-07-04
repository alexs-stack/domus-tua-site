import { NextResponse } from "next/server";
import { runAssistant, type ChatMessage } from "../../lib/ai/assistant";
import type { Locale } from "../../lib/i18n/dictionaries";

// Assistente conversazionale. Il client invia la cronologia; il server esegue il turno
// (con lo strumento search_listings) e ritorna { reply, listings }. Stateless.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCALES = ["it", "en", "fr", "de", "es"];
const MAX_MESSAGES = 24;
const MAX_LEN = 1000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 });
  }

  const raw = (body as { messages?: unknown })?.messages;
  const localeRaw = (body as { locale?: unknown })?.locale;
  const locale: Locale = (typeof localeRaw === "string" && LOCALES.includes(localeRaw) ? localeRaw : "it") as Locale;

  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ ok: false, error: "no-messages" }, { status: 400 });
  }

  // Sanifica: solo ruoli validi, testo non vuoto, lunghezza limitata, ultimi N.
  const history: ChatMessage[] = raw
    .filter((m): m is { role: string; content: string } =>
      !!m && typeof m === "object" && typeof (m as { content?: unknown }).content === "string",
    )
    .map((m): ChatMessage => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content.slice(0, MAX_LEN),
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_MESSAGES);

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ ok: false, error: "bad-history" }, { status: 400 });
  }

  try {
    const { reply, listings } = await runAssistant(history, locale);
    return NextResponse.json({ ok: true, reply, listings });
  } catch (err) {
    console.error("[assistant] errore:", err);
    return NextResponse.json({ ok: false, error: "error" }, { status: 200 });
  }
}
