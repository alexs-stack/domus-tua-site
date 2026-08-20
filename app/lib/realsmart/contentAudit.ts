// Audit dei CONTENUTI degli annunci RealSmart — logica PURA e testabile.
//
// Lo script scripts/audit-listings-content.ts è un sottile wrapper CLI: scarica il feed e chiama
// `auditListing` qui. Tenere la logica in un modulo importabile permette di testarla senza rete
// (app/lib/realsmart/__tests__/contentAudit.test.ts) e di eseguirla in CI in modalità deliberata.
//
// ESITI
//   FAIL   — difetto STRUTTURALE o FUGA PRIVACY certa nell'output PUBBLICATO (un tag a schermo,
//            un segnaposto "____", un indirizzo/telefono sfuggito alla redazione). Blocca la CI.
//   REVIEW — questione EDITORIALE o IGIENE della FONTE da guardare a mano (paragrafo lunghissimo,
//            contraddizione, indirizzo/telefono nella descrizione GREZZA — già redatto in output,
//            ma da togliere nel gestionale). Non blocca: è una decisione umana.
//   PASS   — nessuna delle due.
//
// Nessun finding contiene PII: mai il valore di un indirizzo o di un telefono, solo il fatto che
// c'era e il riferimento dell'annuncio (codice) per correggerlo alla fonte.

import { normalizeRealSmartListing } from "./normalize";
import { normalizeDescription } from "./description";
import { hasCivicAddress, hasPhoneNumber, redactPrivateText } from "./privacy";
import { verifyRedaction } from "./privacyVerify";
import { FACT_GROUPS, type FactGroup } from "./facts";
import type { NormalizedProperty, RealSmartListingRaw } from "./types";

/** Oltre questa soglia un paragrafo è una parete di testo: va spezzato a mano o via override. */
export const LONG_PARAGRAPH_CHARS = 1200;
/** Oltre questa soglia un gruppo di fatti non si legge più a colpo d'occhio. */
export const MAX_GROUP_FACTS = 12;

export type Severity = "FAIL" | "REVIEW";

export interface Finding {
  severity: Severity;
  /** Codice-motivo stabile (kebab-case): entra nell'artefatto macchina. */
  check: string;
  /** Descrizione leggibile, MAI con PII (nessun indirizzo/telefono in chiaro). */
  detail: string;
}

export interface ListingAudit {
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

// ── Difetti STRUTTURALI (FAIL) ───────────────────────────────────────────────

/** Difetti strutturali certi: se compaiono, qualcosa è rotto nella pipeline. */
export function structuralFindings(p: NormalizedProperty, raw: RealSmartListingRaw): Finding[] {
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

  // Segnaposto mai compilati. Nel feed live esiste davvero «un ampio bagno di oltre ____ mq»:
  // qualcuno ha scritto la frase pensando di tornarci e non ci è tornato. La pipeline lo mette in
  // QUARANTENA in pubblicazione (placeholders.ts) — così nessun «____» arriva a chi compra casa —
  // e alza `placeholderQuarantined`. Qui quel segnale diventa FAIL: la riparazione VERA sta nel
  // gestionale o in un override approvato, non nella rete di sicurezza. Nessuna PII nel dettaglio.
  if (p.placeholderQuarantined) {
    out.push({
      severity: "FAIL",
      check: "segnaposto-non-compilato",
      detail:
        "segnaposto non compilato nella descrizione a gestionale (quarantenato in pubblicazione, da correggere alla fonte o via override approvato)",
    });
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

  // Indirizzo civico nei DATI: pubblicabile solo con override esplicito.
  if (p.showAddress && !p.address) {
    out.push({ severity: "FAIL", check: "indirizzo-incoerente", detail: "indirizzo autorizzato ma assente" });
  }
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

// ── Fughe PRIVACY (FAIL) e igiene della FONTE (REVIEW) ───────────────────────

/**
 * Rete di sicurezza della redazione (app/lib/realsmart/privacy.ts):
 *  • FAIL   se l'output PUBBLICATO (post-redazione) contiene ancora un indirizzo civico con
 *           showAddress=false o un telefono — significa che la redazione ha un buco. Blocca.
 *  • REVIEW se la descrizione GREZZA conteneva un indirizzo/telefono (già redatto in output):
 *           va tolto nel gestionale. Segnalato col codice dell'annuncio, senza il valore.
 * Nessun finding riporta il valore dell'indirizzo o del telefono.
 */
export function privacyFindings(p: NormalizedProperty, raw: RealSmartListingRaw): Finding[] {
  const out: Finding[] = [];
  const published = [...p.descriptionParagraphs, p.excerpt].join("\n");

  // Rete di sicurezza con VERIFICATORE INDIPENDENTE (app/lib/realsmart/privacyVerify.ts): NON usa
  // gli stessi pattern del redattore, così un buco in privacy.ts non si rispecchia qui. Confronta
  // per token con l'indirizzo strutturato noto e con un corpus di fuga scritto a parte.
  const verdict = verifyRedaction(published, {
    showAddress: p.showAddress,
    sourceAddress: raw.localita?.indirizzo,
  });
  if (verdict.reasons.some((r) => r.startsWith("leak-address"))) {
    out.push({
      severity: "FAIL",
      check: "privacy-leak-indirizzo",
      detail:
        "indirizzo civico ancora nell'output pubblicato con showAddress=false (verificatore indipendente): la redazione ha un buco",
    });
  }
  if (verdict.reasons.includes("leak-phone-corpus")) {
    out.push({
      severity: "FAIL",
      check: "privacy-leak-telefono",
      detail: "numero di telefono ancora nell'output pubblicato (verificatore indipendente): la redazione ha un buco",
    });
  }

  // Igiene della fonte: com'era la descrizione PRIMA della redazione.
  const sourceText = normalizeDescription(raw.descrizione).plainText;
  if (!p.showAddress && hasCivicAddress(sourceText)) {
    out.push({
      severity: "REVIEW",
      check: "indirizzo-in-descrizione",
      detail: "la descrizione a gestionale contiene un indirizzo civico (redatto in pubblicazione, da togliere alla fonte)",
    });
  }
  if (hasPhoneNumber(sourceText)) {
    out.push({
      severity: "REVIEW",
      check: "telefono-in-descrizione",
      detail: "la descrizione a gestionale contiene un telefono (rimosso in pubblicazione, da togliere alla fonte)",
    });
  }

  return out;
}

// ── Contraddizioni fattuali ──────────────────────────────────────────────────
//
// Le contraddizioni NON vengono MAI riscritte in automatico: questo è già garantito
// dall'ARCHITETTURA della pipeline, non da un controllo dell'audit. I fatti pubblicati
// nascono dai CAMPI del gestionale con priorità (facts.ts: campo RealSmart > descrizione), e la
// descrizione non sovrascrive mai un conteggio del campo. Un "cinque camere" nel testo con
// <Camere>3 resta un conflitto nella FONTE, non un dato inventato dal sito.
//
// Un rilevatore DETERMINISTICO di contraddizioni numeriche (confronto "N bagni/camere" nel testo
// vs campo) si è rivelato inaffidabile sul feed reale: le descrizioni di edifici plurifamiliari
// e le narrazioni stanza-per-stanza ("un bagno luminoso…") citano conteggi PARZIALI, non totali,
// e producevano ~70 falsi contrasti su 196 annunci — un rumore che avrebbe reso il report REVIEW
// ingestibile. Un rilevatore preciso richiede di distinguere "totale" da "parziale" nel testo:
// resta un lavoro futuro, non una guardia deterministica. Le anomalie residue emergono comunque
// via `factsReview` (fatti ambigui) e vanno corrette alla fonte.

// ── Questioni EDITORIALI (REVIEW) ────────────────────────────────────────────

export function editorialFindings(p: NormalizedProperty): Finding[] {
  const out: Finding[] = [];

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

// ── Composizione ─────────────────────────────────────────────────────────────

/** Esegue tutti i controlli su un annuncio grezzo e ne calcola lo stato complessivo. */
export function auditListing(raw: RealSmartListingRaw): ListingAudit {
  const p = normalizeRealSmartListing(raw);
  const findings = [
    ...structuralFindings(p, raw),
    ...privacyFindings(p, raw),
    ...editorialFindings(p),
  ];
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

// ── Artefatto macchina ───────────────────────────────────────────────────────

export interface AuditArtifact {
  generatedAt: string;
  summary: { total: number; pass: number; review: number; fail: number };
  /** Conteggio per codice-motivo, ordinato dal più frequente. */
  reasonCodes: Record<string, number>;
  listings: Array<{
    codice: string;
    riferimento: string;
    slug: string;
    stato: "PASS" | "REVIEW" | "FAIL";
    findings: Finding[];
  }>;
}

/**
 * Rete finale anti-PII per gli artefatti: qualunque dettaglio, prima di essere scritto, passa dal
 * redattore (indirizzi civici → comune/"zona riservata", telefoni → via). I dettagli sono già
 * costruiti senza PII, ma un dettaglio DINAMICO (es. una riga tecnica non risolta) non deve poter
 * far uscire un indirizzo o un recapito nel report. Choke point unico, deterministico.
 */
export function sanitizeFindingDetail(detail: string): string {
  return redactPrivateText(detail, { showAddress: false }).text;
}

/** Costruisce l'artefatto machine-readable (JSON), senza PII e con date iniettabile. */
export function buildAuditArtifact(audits: readonly ListingAudit[], generatedAt: string): AuditArtifact {
  const byCheck = new Map<string, number>();
  for (const a of audits) for (const f of a.findings) byCheck.set(f.check, (byCheck.get(f.check) ?? 0) + 1);
  const reasonCodes = Object.fromEntries([...byCheck.entries()].sort((a, b) => b[1] - a[1]));

  const fail = audits.filter((a) => a.stato === "FAIL").length;
  const review = audits.filter((a) => a.stato === "REVIEW").length;

  return {
    generatedAt,
    summary: { total: audits.length, pass: audits.length - fail - review, review, fail },
    reasonCodes,
    listings: audits.map((a) => ({
      codice: a.codice,
      riferimento: a.riferimento,
      slug: a.slug,
      stato: a.stato,
      findings: a.findings.map((f) => ({ ...f, detail: sanitizeFindingDetail(f.detail) })),
    })),
  };
}
