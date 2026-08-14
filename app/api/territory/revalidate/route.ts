// Invalidazione MIRATA della cache territoriale (Prompt 15).
//
// Dopo un'approvazione editoriale (oggi via CLI, ADR-007), questo endpoint invalida SOLO le pagine
// toccate: `territory:listing:<code>` per un immobile, `territory:profile:<comune>` per un comune. Non
// invalida l'intero sito. Protetto da un segreto server-only: senza segreto configurato, è disattivato
// (404) — non deve esistere una leva pubblica per forzare revalidazioni.

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { territoryCacheTags } from "../../../lib/territory/publicRead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.TERRITORY_REVALIDATE_SECRET;
  if (!secret) {
    // Nessun segreto: endpoint disattivato. 404 per non rivelarne l'esistenza.
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { code?: string; municipality?: string };
  try {
    body = (await request.json()) as { code?: string; municipality?: string };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const tags: string[] = [];
  if (typeof body.code === "string" && body.code.length > 0) {
    tags.push(`territory:listing:${body.code}`);
  }
  if (typeof body.municipality === "string" && body.municipality.length > 0) {
    for (const t of territoryCacheTags("_", body.municipality)) {
      if (t.startsWith("territory:profile:")) tags.push(t);
    }
  }
  if (tags.length === 0) {
    return NextResponse.json({ error: "missing code or municipality" }, { status: 400 });
  }

  // Stale-while-revalidate: le pagine restano servite, il dato fresco arriva alla prossima visita.
  for (const tag of tags) revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: true, tags }, { headers: { "cache-control": "no-store" } });
}
