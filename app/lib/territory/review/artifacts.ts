// Artefatti di review DETERMINISTICI (Prompt 10): pacchetto JSON + Markdown per i team senza UI.
//
// Riesaminabile in git, PII-safe: origine come ETICHETTA leggibile (mai coordinate di default),
// POI con fonte e data, diff (cosa è cambiato e perché il refresh), cronologia di audit e le
// istruzioni ESATTE per approvare via CLI. Le coordinate compaiono solo se l'editor è autorizzato e
// le chiede esplicitamente.

import type { TerritoryReviewService, ReviewItem } from "./service";
import type { EnrichmentStatus } from "../types";

export interface ReviewPack {
  packVersion: number;
  generatedAt: string;
  municipality?: string;
  includesCoordinates: boolean;
  items: ReviewItem[];
}

/** Costruisce il pacchetto di review (opzionalmente per comune). Coordinate solo se autorizzato. */
export async function buildReviewPack(
  service: TerritoryReviewService,
  options: { generatedAt: string; municipality?: string; includeCoordinates?: boolean; status?: EnrichmentStatus },
): Promise<ReviewPack> {
  const summaries = await service.listForReview(options.status ? { status: options.status } : undefined);
  const filtered = options.municipality
    ? summaries.filter((s) => s.municipality === options.municipality)
    : summaries;
  const sorted = [...filtered].sort((a, b) => (a.realSmartCode < b.realSmartCode ? -1 : 1));

  const items: ReviewItem[] = [];
  for (const s of sorted) {
    const item = await service.getReviewItem(s.realSmartCode, { includeCoordinates: options.includeCoordinates });
    if (item) items.push(item);
  }
  return {
    packVersion: 1,
    generatedAt: options.generatedAt,
    ...(options.municipality ? { municipality: options.municipality } : {}),
    includesCoordinates: options.includeCoordinates === true,
    items,
  };
}

/** JSON deterministico del pacchetto (`\n` finale). */
export function serializeReviewPackJson(pack: ReviewPack): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

function line(s: string): string {
  return `${s}\n`;
}

/** Markdown deterministico e leggibile del pacchetto di review. */
export function renderReviewPackMarkdown(pack: ReviewPack): string {
  let out = "";
  out += line(`# Review territoriale${pack.municipality ? ` — ${pack.municipality}` : ""}`);
  out += line("");
  out += line(`Generato: ${pack.generatedAt} · ${pack.items.length} immobili da rivedere · coordinate: ${pack.includesCoordinates ? "incluse (autorizzato)" : "nascoste (etichette)"}`);
  out += line("");

  for (const item of pack.items) {
    out += line(`## ${item.realSmartCode} — ${item.municipality} · stato ${item.status}`);
    out += line(`- Origine: ${item.originBasis.precision} — "${item.originBasis.label}" (±${item.originBasis.accuracyMeters} m)${item.originCoord ? ` · coord ${item.originCoord.lat},${item.originCoord.lng}` : ""}`);
    out += line(`- Dato del: ${item.retrievedAt} · impronta ${item.fingerprintHash} · versione ${item.version}`);
    out += line("");
    out += line("### POI");
    for (const p of item.pois) {
      out += line(`- [${p.approvalState}] ${p.category}: ${p.name} — ≈ ${p.distanceMeters} m · ${p.sourceOwner}${p.sourceUrl ? ` (${p.sourceUrl})` : ""} · ${p.retrievedAt}`);
    }
    out += line("");
    out += line("### Cosa è cambiato (vs ultimo approvato)");
    out += line(`- aggiunti: ${item.diff.added.map((e) => e.name).join(", ") || "—"}`);
    out += line(`- rimossi: ${item.diff.removed.map((e) => e.name).join(", ") || "—"}`);
    out += line(`- invariati: ${item.diff.unchanged.length}`);
    out += line("");
    if (item.audit.length > 0) {
      out += line("### Storia (audit)");
      for (const e of item.audit) out += line(`- ${e.at} · ${e.action} · ${e.actor}${e.note ? ` — ${e.note}` : ""}`);
      out += line("");
    }
    out += line("### Per approvare (CLI)");
    out += line("```bash");
    out += line(`npm run territory:review -- approve ${item.realSmartCode} --by=<nome>`);
    out += line("```");
    out += line("");
  }
  return out;
}
