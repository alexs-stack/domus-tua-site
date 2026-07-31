/**
 * Audit dei CONTENUTI degli annunci RealSmart — `npm run audit:listings-content`.
 *
 * Sola lettura: scarica il feed, esegue la stessa pipeline del sito (parse → normalize →
 * fatti → separazione narrativa) e scrive un report. Non modifica annunci, feed o gestionale.
 *
 * ESITI
 *   FAIL   — difetto STRUTTURALE certo (un tag a schermo, un dato senza fonte, una descrizione
 *            vuota). Fa fallire il comando: sono cose che non devono mai arrivare online.
 *   REVIEW — questione EDITORIALE da guardare a mano (un paragrafo lunghissimo, una riga
 *            tecnica non risolta, una contraddizione nel testo). NON fa fallire il comando:
 *            non è un bug, è una decisione umana.
 *   PASS   — nessuna delle due.
 *
 * Il report non contiene PII: né indirizzi civici, né telefoni, né email degli agenti.
 *
 * Uso:
 *   npm run audit:listings-content
 *   npm run audit:listings-content -- --file=./feed.xml     (audit offline su un feed salvato)
 *   npm run audit:listings-content -- --out=./report.md
 */

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { XMLParser } from "fast-xml-parser";

import { parseRealSmartPayload } from "../app/lib/realsmart/parse";
import { normalizeRealSmartListing } from "../app/lib/realsmart/normalize";
import { normalizeDescription, proposeParagraphs } from "../app/lib/realsmart/description";
import { buildOverridesReport } from "../app/lib/realsmart/overrides";
import { getListingOverride } from "../app/lib/realsmart/overrides.data";
import { listingOverrides } from "../app/lib/realsmart/overrides.data";
import { FACT_GROUPS, type FactGroup } from "../app/lib/realsmart/facts";
import type { NormalizedProperty, RealSmartListingRaw } from "../app/lib/realsmart/types";

const DEFAULT_FEED_URL =
  process.env.REALSMART_FEED_URL ?? "https://www.gestim2002.it/portali/immobili_724.xml";
const DEFAULT_OUT = "reports/listings-content-audit.md";
const PROPOSALS_OUT = "reports/proposte-descrizioni.md";

/** Oltre questa soglia un paragrafo è una parete di testo: va spezzato a mano o via override. */
const LONG_PARAGRAPH_CHARS = 1200;
/**
 * Quota di parole oltre la quale una descrizione sostituita da override si considera SCOLLATA
 * dall'originale: sotto questa soglia stanno le correzioni volute (un segnaposto tolto, un
 * refuso), sopra c'è un testo riscritto in RealSmart che il sito non sta più mostrando.
 */
const OVERRIDE_DRIFT_TOLERANCE = 0.05;
/** Oltre questa soglia un gruppo di fatti non si legge più a colpo d'occhio. */
const MAX_GROUP_FACTS = 12;
/**
 * Limite della Data Cache di Next: oltre i 2 MB `unstable_cache` NON memorizza e si limita a
 * un warning nei log. Il sito continuerebbe a funzionare, ma riscaricando ed rielaborando il
 * feed da 2,6 MB a ogni richiesta. È un guasto silenzioso: lo controlliamo qui.
 */
const CACHE_LIMIT_BYTES = 2 * 1024 * 1024;

type Severity = "FAIL" | "REVIEW";

interface Finding {
  severity: Severity;
  check: string;
  detail: string;
}

interface ListingAudit {
  riferimento: string;
  codice: string;
  slug: string;
  stato: "PASS" | "REVIEW" | "FAIL";
  findings: Finding[];
  fattiDaCampo: number;
  fattiDaDescrizione: number;
  fattiDaOverride: number;
  daRivedere: number;
}

// ── Controlli ───────────────────────────────────────────────────────────────

/** Difetti STRUTTURALI: se compaiono, qualcosa è rotto nella pipeline. */
function structuralFindings(p: NormalizedProperty, raw: RealSmartListingRaw): Finding[] {
  const out: Finding[] = [];
  const text = p.descriptionParagraphs.join("\n");

  if (/<br\b|<\/?[a-z][^>]*>/i.test(text)) {
    out.push({ severity: "FAIL", check: "tag-visibile", detail: "la descrizione pubblicata contiene markup" });
  }
  if (/&(amp|lt|gt|nbsp|quot|apos|#\d+);/i.test(text)) {
    out.push({ severity: "FAIL", check: "entita-non-decodificata", detail: "entità HTML non decodificata nel testo" });
  }
  if (p.descriptionParagraphs.some((par) => par.trim().length === 0)) {
    out.push({ severity: "FAIL", check: "paragrafo-vuoto", detail: "paragrafo vuoto nella descrizione" });
  }
  if (p.descriptionParagraphs.length === 0) {
    out.push({ severity: "FAIL", check: "descrizione-vuota", detail: "nessun paragrafo pubblicabile" });
  }

  // Camere: devono venire dal campo <Camere>, mai da "locali - 1".
  const camere = p.facts.find((f) => f.key === "camere");
  const camereRaw = Number.parseInt(String(raw.camere ?? "0").replace(/\D/g, ""), 10) || 0;
  if (camere && camere.source === "realsmart" && Number(camere.value) !== camereRaw) {
    out.push({
      severity: "FAIL",
      check: "camere-calcolate",
      detail: `pubblicate ${camere.value} camere ma il gestionale ne dichiara ${camereRaw}`,
    });
  }

  // Classe energetica: solo da <ACE>, da un override o da una frase inequivocabile.
  const energia = p.facts.find((f) => f.key === "classeEnergetica");
  if (energia && energia.source === "realsmart" && !raw.classeEnergetica && !raw.statoAttestatoEnergetico) {
    out.push({
      severity: "FAIL",
      check: "classe-energetica-senza-ace",
      detail: `"${energia.value}" pubblicata come classe energetica senza un campo <ACE> valido`,
    });
  }

  // Ogni fatto deve dichiarare una fonte e un valore utile.
  for (const f of p.facts) {
    if (!["override", "realsmart", "descrizione"].includes(f.source)) {
      out.push({ severity: "FAIL", check: "fatto-senza-fonte", detail: `"${f.key}" non dichiara una fonte` });
    }
    if (f.value !== undefined && (f.value.trim() === "" || f.value.trim() === "—" || /^no$/i.test(f.value))) {
      out.push({
        severity: "FAIL",
        check: "valore-non-informativo",
        detail: `"${f.key}" pubblica il valore non informativo "${f.value}"`,
      });
    }
  }

  // Nessuna chiave duplicata e nessun dato in due gruppi.
  const keys = p.facts.map((f) => f.key);
  const duplicate = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (duplicate.length > 0) {
    out.push({
      severity: "FAIL",
      check: "caratteristica-duplicata",
      detail: `chiavi ripetute: ${[...new Set(duplicate)].join(", ")}`,
    });
  }

  // Un gruppo dichiarato non può essere vuoto (i box vuoti non devono esistere).
  for (const group of FACT_GROUPS) {
    const inGroup = p.facts.filter((f) => f.group === group);
    if (inGroup.length === 0) continue;
    if (inGroup.every((f) => !f.label.trim())) {
      out.push({ severity: "FAIL", check: "box-vuoto", detail: `gruppo "${group}" senza etichette` });
    }
  }

  // Indirizzo civico: pubblicabile solo con override esplicito.
  if (p.showAddress && !p.address) {
    out.push({ severity: "FAIL", check: "indirizzo-incoerente", detail: "indirizzo autorizzato ma assente" });
  }
  // Serve il nome della via subito dopo il toponimo: così "in corso di valutazione" (uno stato
  // legittimo dell'APE) non viene scambiato per un indirizzo.
  const civico = p.facts.find((f) =>
    /\b(?:via|viale|piazza|piazzale|largo|vicolo|corso|strada)\s+\p{Lu}/u.test(`${f.label} ${f.value ?? ""}`),
  );
  if (civico) {
    out.push({
      severity: "FAIL",
      check: "indirizzo-nei-dati",
      detail: `il dato "${civico.key}" contiene un riferimento stradale`,
    });
  }

  return out;
}

/** Multiset di parole: serve a confrontare due versioni dello stesso testo. */
function wordCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const w of text.toLowerCase().match(/\p{L}+/gu) ?? []) {
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return counts;
}

/**
 * Un override che sostituisce la descrizione CONGELA il testo: se poi l'agenzia riscrive
 * l'annuncio in RealSmart, il sito continua a mostrare la nostra versione e nessuno se ne
 * accorge. Qui confrontiamo le parole delle due versioni e segnaliamo quando divergono troppo.
 */
function overrideDriftFinding(p: NormalizedProperty, raw: RealSmartListingRaw): Finding | null {
  const override = getListingOverride(raw.codice);
  if (!override?.descrizione) return null;

  const current = normalizeDescription(raw.descrizione).paragraphs.join(" ");
  const published = override.descrizione.join(" ");
  const a = wordCounts(current);
  const b = wordCounts(published);

  let differences = 0;
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    differences += Math.abs((a.get(key) ?? 0) - (b.get(key) ?? 0));
  }
  const total = [...a.values()].reduce((sum, n) => sum + n, 0) || 1;
  const drift = differences / total;
  if (drift <= OVERRIDE_DRIFT_TOLERANCE) return null;

  return {
    severity: "REVIEW",
    check: "override-descrizione-scollata",
    detail: `la descrizione pubblicata differisce dal feed per il ${Math.round(drift * 100)}% delle parole: l'agenzia ha probabilmente riscritto l'annuncio e il sito non lo sta mostrando`,
  };
}

/** Questioni EDITORIALI: da guardare a mano, mai da correggere in automatico. */
function editorialFindings(p: NormalizedProperty, raw: RealSmartListingRaw): Finding[] {
  const out: Finding[] = [];

  const drift = overrideDriftFinding(p, raw);
  if (drift) out.push(drift);

  for (const par of p.descriptionParagraphs) {
    if (par.length > LONG_PARAGRAPH_CHARS) {
      out.push({
        severity: "REVIEW",
        check: "paragrafo-lunghissimo",
        detail: `un paragrafo di ${par.length} caratteri: nel testo non esiste alcun separatore da cui ricavare un a-capo, serve una descrizione approvata via override`,
      });
      break;
    }
  }

  for (const line of p.keptFactLines) {
    out.push({
      severity: "REVIEW",
      check: "riga-tecnica-non-risolta",
      detail: `"${line.line.slice(0, 70)}" — frammenti non strutturati: ${line.unresolved.join(" / ")}`,
    });
  }

  for (const item of p.factsReview) {
    out.push({
      severity: "REVIEW",
      check: `fatto-${item.reason}`,
      detail: `${item.key}: ${item.detail}`,
    });
  }

  const text = p.descriptionParagraphs.join("\n");
  if (/con domus\s*tua|we love home|sicuro acquistare|leggi le oltre/i.test(text)) {
    out.push({ severity: "REVIEW", check: "boilerplate-residuo", detail: "firma commerciale ancora nel testo" });
  }
  if (/_{3,}|\bXXX\b|\bTBD\b/i.test(text)) {
    out.push({
      severity: "REVIEW",
      check: "segnaposto-nel-testo",
      detail: "la descrizione contiene un segnaposto non compilato (es. \"____ mq\")",
    });
  }

  for (const group of FACT_GROUPS as readonly FactGroup[]) {
    const n = p.facts.filter((f) => f.group === group).length;
    if (n > MAX_GROUP_FACTS) {
      out.push({ severity: "REVIEW", check: "gruppo-troppo-lungo", detail: `"${group}" ha ${n} voci` });
    }
  }

  if (p.contentPreservation < 0.9) {
    out.push({
      severity: "REVIEW",
      check: "preservazione-bassa",
      detail: `conservato il ${Math.round(p.contentPreservation * 100)}% del testo normalizzato`,
    });
  }

  return out;
}

// ── Proposte di descrizione per i blocchi illeggibili ───────────────────────

/** Le parole devono essere le stesse: una bozza che perde testo non si propone. */
function sameWords(a: string, b: string): boolean {
  const w = (s: string) => (s.toLowerCase().match(/\p{L}+/gu) ?? []).join(" ");
  return w(a) === w(b);
}

interface Proposal {
  riferimento: string;
  codice: string;
  slug: string;
  chars: number;
  paragrafi: string[];
}

function buildProposal(p: NormalizedProperty): Proposal | null {
  if (!p.descriptionParagraphs.some((par) => par.length > LONG_PARAGRAPH_CHARS)) return null;
  if (getListingOverride(p.sourceRef.codice)?.descrizione) return null; // già sistemato

  const paragrafi = p.descriptionParagraphs.flatMap((par) =>
    par.length > LONG_PARAGRAPH_CHARS ? proposeParagraphs(par) : [par],
  );
  // Guardia: se la bozza non contiene esattamente le stesse parole, non la si propone.
  if (!sameWords(paragrafi.join(" "), p.descriptionParagraphs.join(" "))) return null;

  return {
    riferimento: p.sourceRef.riferimento ?? p.sourceRef.codice,
    codice: p.sourceRef.codice,
    slug: p.slug,
    chars: Math.max(...p.descriptionParagraphs.map((par) => par.length)),
    paragrafi,
  };
}

function renderProposals(proposals: Proposal[], generatedAt: string): string {
  const lines: string[] = [
    "# Bozze di descrizione da approvare",
    "",
    `Generato il ${generatedAt}.`,
    "",
    "Questi annunci arrivano da RealSmart come **un unico blocco di testo**: nel contenuto non",
    "esiste alcun separatore (né break, né a-capo, né punteggiatura incollata) da cui ricavare",
    "un a-capo. Il sito quindi li pubblica così come sono — inventare paragrafi è esattamente il",
    "difetto che abbiamo tolto.",
    "",
    "Qui sotto, per ciascuno, il **medesimo testo** spezzato ai confini di frase. Non è applicato",
    "da nessuna parte: è una bozza. Chi la approva la incolla in `app/lib/realsmart/overrides.data.ts`",
    "compilando `fonte`, `data` e `autore` (vedi `docs/realsmart-overrides.md`).",
    "",
    "Ogni bozza contiene le stesse identiche parole dell'originale: la verifica è automatica,",
    "una bozza che perdesse testo non verrebbe nemmeno stampata.",
    "",
    `Annunci da sistemare: **${proposals.length}**.`,
    "",
  ];

  for (const proposal of proposals) {
    lines.push(
      `## ${proposal.riferimento} — \`/case/${proposal.slug}\``,
      "",
      `Paragrafo più lungo: ${proposal.chars} caratteri. Bozza: ${proposal.paragrafi.length} paragrafi.`,
      "",
      "```ts",
      "  {",
      `    codice: ${JSON.stringify(proposal.codice)},`,
      '    motivo: "descrizione originale in blocco unico, illeggibile in pagina",',
      '    fonte: "DA COMPILARE — chi ha approvato il testo",',
      '    data: "DA COMPILARE — YYYY-MM-DD",',
      '    autore: "DA COMPILARE",',
      "    descrizione: [",
      ...proposal.paragrafi.map((par) => `      ${JSON.stringify(par)},`),
      "    ],",
      "  },",
      "```",
      "",
    );
  }

  return `${lines.join("\n")}\n`;
}

// ── Esecuzione ──────────────────────────────────────────────────────────────

function auditListing(raw: RealSmartListingRaw): ListingAudit {
  const p = normalizeRealSmartListing(raw);
  const findings = [...structuralFindings(p, raw), ...editorialFindings(p, raw)];
  const stato = findings.some((f) => f.severity === "FAIL")
    ? "FAIL"
    : findings.length > 0
      ? "REVIEW"
      : "PASS";

  return {
    riferimento: p.sourceRef.riferimento ?? p.sourceRef.codice,
    codice: p.sourceRef.codice,
    slug: p.slug,
    stato,
    findings,
    fattiDaCampo: p.facts.filter((f) => f.source === "realsmart").length,
    fattiDaDescrizione: p.facts.filter((f) => f.source === "descrizione").length,
    fattiDaOverride: p.facts.filter((f) => f.source === "override").length,
    daRivedere: p.factsReview.length,
  };
}

async function loadFeed(): Promise<string> {
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  if (fileArg) return readFileSync(fileArg.slice("--file=".length), "utf8");

  const res = await fetch(DEFAULT_FEED_URL, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`feed RealSmart ${res.status}`);
  return res.text();
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
    `- REVIEW: **${reviews.length}** (questioni editoriali, non bloccanti)`,
    `- FAIL: **${fails.length}** (difetti strutturali, bloccanti in CI)`,
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
  const proposals = raw.map(normalizeRealSmartListing).map(buildProposal).filter((x): x is Proposal => x !== null);

  // Peso del payload memorizzato da getLiveListings(): cresce con il catalogo.
  const payloadBytes = Buffer.byteLength(JSON.stringify(raw.map(normalizeRealSmartListing)));
  const outArg = process.argv.find((a) => a.startsWith("--out="));
  const out = outArg ? outArg.slice("--out=".length) : DEFAULT_OUT;

  // La data arriva dall'esterno quando serve un report riproducibile in CI.
  const generatedAt = process.env.AUDIT_DATE ?? new Date().toISOString().slice(0, 10);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderReport(audits, generatedAt, payloadBytes));
  writeFileSync(PROPOSALS_OUT, renderProposals(proposals, generatedAt));

  const fails = audits.filter((a) => a.stato === "FAIL");
  const reviews = audits.filter((a) => a.stato === "REVIEW");
  console.log(
    `Audit contenuti: ${audits.length} annunci — ` +
      `${audits.length - fails.length - reviews.length} PASS, ${reviews.length} REVIEW, ${fails.length} FAIL`,
  );
  console.log(
    `Payload in cache: ${Math.round(payloadBytes / 1024)} KB su ${CACHE_LIMIT_BYTES / 1024} KB disponibili`,
  );
  console.log(`Report: ${out}`);
  console.log(`Bozze di descrizione da approvare: ${proposals.length} → ${PROPOSALS_OUT}`);

  if (payloadBytes > CACHE_LIMIT_BYTES) {
    console.error(
      `\nIl risultato normalizzato supera il limite della Data Cache di Next: ` +
        `unstable_cache non lo memorizzerà e ogni richiesta rielaborerà l'intero feed. ` +
        `Alleggerire NormalizedProperty (vedi app/lib/realsmart/normalize.ts).`,
    );
    process.exitCode = 1;
  }

  if (fails.length > 0) {
    console.error("\nDifetti strutturali:");
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
  console.error("[audit] errore:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
