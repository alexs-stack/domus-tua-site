/**
 * Audit dei CONTENUTI degli annunci RealSmart — `npm run audit:listings-content`.
 *
 * Sola lettura: scarica il feed, esegue la stessa pipeline del sito (parse → normalize → fatti →
 * separazione narrativa → REDAZIONE privacy) e scrive DUE report: uno leggibile (Markdown) e uno
 * machine-readable (JSON). Non modifica annunci, feed o gestionale.
 *
 * La logica dei controlli vive in app/lib/realsmart/contentAudit.ts (pura, testata). Qui c'è solo
 * l'IO: scaricare il feed, rendere i report, decidere il codice d'uscita.
 *
 * ESITI (vedi contentAudit.ts)
 *   FAIL   — difetto strutturale o FUGA PRIVACY nell'output pubblicato. Fa fallire il comando.
 *   REVIEW — questione editoriale o igiene della fonte (indirizzo/telefono nella descrizione
 *            grezza, già redatto in pubblicazione). NON fa fallire: è una decisione umana.
 *   PASS   — nessuna delle due.
 *
 * Nessun report contiene PII: né indirizzi civici, né telefoni, né email.
 *
 * Uso:
 *   npm run audit:listings-content
 *   npm run audit:listings-content -- --file=./feed.xml     (audit offline su un feed salvato)
 *   npm run audit:listings-content -- --out=./report.md --json=./report.json
 */

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { XMLParser } from "fast-xml-parser";

import { parseRealSmartPayload } from "../app/lib/realsmart/parse";
import { normalizeRealSmartListing } from "../app/lib/realsmart/normalize";
import { buildOverridesReport } from "../app/lib/realsmart/overrides";
import { listingOverrides } from "../app/lib/realsmart/overrides.data";
import { auditListing, buildAuditArtifact, type ListingAudit } from "../app/lib/realsmart/contentAudit";

const DEFAULT_FEED_URL =
  process.env.REALSMART_FEED_URL ?? "https://www.gestim2002.it/portali/immobili_724.xml";
const DEFAULT_OUT = "reports/listings-content-audit.md";
const DEFAULT_JSON = "reports/listings-content-audit.json";

/**
 * Limite della Data Cache di Next: oltre i 2 MB `unstable_cache` NON memorizza e si limita a
 * un warning nei log. Il sito continuerebbe a funzionare, ma riscaricando ed rielaborando il
 * feed da 2,6 MB a ogni richiesta. È un guasto silenzioso: lo controlliamo qui.
 */
const CACHE_LIMIT_BYTES = 2 * 1024 * 1024;

/** Errore di INFRA (feed non raggiungibile), distinto da un difetto di CONTENUTO. */
class FeedUnavailableError extends Error {}

async function loadFeed(): Promise<string> {
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  if (fileArg) return readFileSync(fileArg.slice("--file=".length), "utf8");

  try {
    const res = await fetch(DEFAULT_FEED_URL, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new FeedUnavailableError(`feed RealSmart ${res.status}`);
    return res.text();
  } catch (err) {
    if (err instanceof FeedUnavailableError) throw err;
    throw new FeedUnavailableError(err instanceof Error ? err.message : String(err));
  }
}

function argValue(prefix: string, fallback: string): string {
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function renderReport(audits: ListingAudit[], generatedAt: string, payloadBytes: number): string {
  const fails = audits.filter((a) => a.stato === "FAIL");
  const reviews = audits.filter((a) => a.stato === "REVIEW");
  const overrides = buildOverridesReport(listingOverrides, audits.map((a) => a.codice));

  const byCheck = new Map<string, number>();
  for (const a of audits) for (const f of a.findings) byCheck.set(f.check, (byCheck.get(f.check) ?? 0) + 1);

  const lines: string[] = [
    "# Audit contenuti annunci RealSmart",
    "",
    `Generato il ${generatedAt}. Sola lettura: nessun annuncio o feed è stato modificato.`,
    "Il report non contiene indirizzi civici, telefoni o email.",
    "",
    "## Riepilogo",
    "",
    `- annunci analizzati: **${audits.length}**`,
    `- PASS: **${audits.length - fails.length - reviews.length}**`,
    `- REVIEW: **${reviews.length}** (questioni editoriali/igiene fonte, non bloccanti)`,
    `- FAIL: **${fails.length}** (difetti strutturali o fughe privacy, bloccanti in CI)`,
    `- payload in cache: **${Math.round(payloadBytes / 1024)} KB** su ${CACHE_LIMIT_BYTES / 1024} KB (limite Data Cache di Next)`,
    "",
    "### Controlli scattati",
    "",
    ...(byCheck.size === 0
      ? ["Nessuno."]
      : [...byCheck.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([check, n]) => `- \`${check}\`: ${n}`)),
    "",
    "### Override manuali",
    "",
    `- applicati: ${overrides.applicati.length}`,
    `- orfani (immobile non più nel feed): ${overrides.orfani.length}${overrides.orfani.length ? ` — ${overrides.orfani.join(", ")}` : ""}`,
    "",
  ];

  if (fails.length > 0) {
    lines.push("## FAIL — da correggere", "");
    for (const a of fails) {
      lines.push(`### ${a.riferimento} (codice ${a.codice})`, "", `\`/case/${a.slug}\``, "");
      for (const f of a.findings.filter((x) => x.severity === "FAIL")) {
        lines.push(`- **${f.check}** — ${f.detail}`);
      }
      lines.push("");
    }
  }

  if (reviews.length > 0) {
    lines.push("## REVIEW — da guardare a mano", "");
    lines.push("| Riferimento | Controllo | Dettaglio |", "| --- | --- | --- |");
    for (const a of reviews) {
      for (const f of a.findings) {
        lines.push(`| ${a.riferimento} | \`${f.check}\` | ${f.detail.replace(/\|/g, "\\|")} |`);
      }
    }
    lines.push("");
  }

  lines.push(
    "## Provenienza dei dati",
    "",
    "| Riferimento | Stato | Da campo | Da descrizione | Da override | In revisione |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    ...audits.map(
      (a) =>
        `| ${a.riferimento} | ${a.stato} | ${a.fattiDaCampo} | ${a.fattiDaDescrizione} | ${a.fattiDaOverride} | ${a.daRivedere} |`,
    ),
    "",
  );

  return `${lines.join("\n")}\n`;
}

async function main() {
  const xml = await loadFeed();
  const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
  const raw = parseRealSmartPayload(parser.parse(xml) as unknown);
  if (raw.length === 0) throw new Error("nessun annuncio nel feed: audit non attendibile");

  const audits = raw.map(auditListing);

  // Peso del payload memorizzato da getLiveListings(): cresce con il catalogo.
  const payloadBytes = Buffer.byteLength(JSON.stringify(raw.map(normalizeRealSmartListing)));

  const out = argValue("--out=", DEFAULT_OUT);
  const jsonOut = argValue("--json=", DEFAULT_JSON);

  // La data arriva dall'esterno quando serve un report riproducibile in CI.
  const generatedAt = process.env.AUDIT_DATE ?? new Date().toISOString().slice(0, 10);

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderReport(audits, generatedAt, payloadBytes));
  mkdirSync(dirname(jsonOut), { recursive: true });
  writeFileSync(jsonOut, `${JSON.stringify(buildAuditArtifact(audits, generatedAt), null, 2)}\n`);

  const fails = audits.filter((a) => a.stato === "FAIL");
  const reviews = audits.filter((a) => a.stato === "REVIEW");
  console.log(
    `Audit contenuti: ${audits.length} annunci — ` +
      `${audits.length - fails.length - reviews.length} PASS, ${reviews.length} REVIEW, ${fails.length} FAIL`,
  );
  console.log(
    `Payload in cache: ${Math.round(payloadBytes / 1024)} KB su ${CACHE_LIMIT_BYTES / 1024} KB disponibili`,
  );
  console.log(`Report: ${out} · Artefatto JSON: ${jsonOut}`);

  if (payloadBytes > CACHE_LIMIT_BYTES) {
    console.error(
      `\nIl risultato normalizzato supera il limite della Data Cache di Next: ` +
        `unstable_cache non lo memorizzerà e ogni richiesta rielaborerà l'intero feed. ` +
        `Alleggerire NormalizedProperty (vedi app/lib/realsmart/normalize.ts).`,
    );
    process.exitCode = 1;
  }

  if (fails.length > 0) {
    console.error("\nDifetti strutturali / fughe privacy (bloccanti):");
    for (const a of fails) {
      for (const f of a.findings.filter((x) => x.severity === "FAIL")) {
        console.error(`  ${a.riferimento}  ${f.check}: ${f.detail}`);
      }
    }
    // Solo i FAIL fermano la CI: i REVIEW sono decisioni editoriali, non errori.
    process.exitCode = 1;
  }
}

main().catch((err) => {
  // Il feed è un servizio di terze parti: se è irraggiungibile NON è un difetto di contenuto.
  // In CI (AUDIT_SOFT_FEED_ERROR=1) un feed giù non deve bloccare — i FAIL di contenuto sì.
  if (err instanceof FeedUnavailableError && process.env.AUDIT_SOFT_FEED_ERROR === "1") {
    console.warn(`[audit] feed non raggiungibile, audit saltato (non bloccante): ${err.message}`);
    process.exitCode = 0;
    return;
  }
  console.error("[audit] errore:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
