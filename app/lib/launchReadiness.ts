// Launch-readiness: il cancello che impedisce di andare live con i documenti legali provvisori.
//
// Logica PURA e testabile (app/lib/__tests__/launchReadiness.test.ts). Lo script
// scripts/launch-readiness.ts la esegue su process.env, stampa la matrice e imposta il codice
// d'uscita: BLOCKED → il comando fallisce.
//
// PRINCIPIO. Non inventa fatti legali: verifica solo che le DECISIONI e le APPROVAZIONI esplicite
// ci siano (LEGAL_DOCS_APPROVED, dominio di produzione, badge di anteprima spento). Il contenuto
// legale vero lo fornisce il cliente/consulente (vedi docs/legal-launch-inventory.md).

export type LaunchStatus = "PASS" | "BLOCKED" | "CLIENT ACTION";

export interface LaunchCheck {
  area: string;
  check: string;
  status: LaunchStatus;
  detail: string;
  action: string;
}

export interface LaunchReport {
  checks: LaunchCheck[];
  /** true solo se nessun check è BLOCKED (le CLIENT ACTION sono attese, non bloccano il comando). */
  ready: boolean;
  blockers: number;
}

type Env = Record<string, string | undefined>;

function isTrue(v: string | undefined): boolean {
  return v === "true";
}

/**
 * Valuta la prontezza al lancio dalle sole variabili d'ambiente (nessun accesso a rete/fs).
 * Estendibile: la verifica finale completa vive nel programma di reaudit (Prompt 13).
 */
export function evaluateLaunchReadiness(env: Env): LaunchReport {
  const checks: LaunchCheck[] = [];

  // 1) Documenti legali approvati — il gate principale di questo passo.
  const legalApproved = isTrue(env.LEGAL_DOCS_APPROVED);
  checks.push({
    area: "Legale",
    check: "Privacy & Cookie Policy validate e approvate",
    status: legalApproved ? "PASS" : "BLOCKED",
    detail: legalApproved
      ? "LEGAL_DOCS_APPROVED=true"
      : "testo placeholder: non validato da legale/DPO (finalità, basi giuridiche, conservazione, titolare)",
    action: legalApproved
      ? "—"
      : "Fornire il testo definitivo (docs/legal-launch-inventory.md), metterlo in pagina, poi LEGAL_DOCS_APPROVED=true",
  });

  // 2) Dominio di produzione: NEXT_PUBLIC_SITE_URL deve puntare al sito reale, non a preview/local.
  const siteUrl = (env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  const siteOk =
    /^https:\/\/.+/i.test(siteUrl) && !/example\.com|localhost|127\.0\.0\.1|vercel\.app/i.test(siteUrl);
  checks.push({
    area: "Dominio",
    check: "NEXT_PUBLIC_SITE_URL punta al dominio di produzione",
    status: siteOk ? "PASS" : "BLOCKED",
    detail: siteUrl ? `attuale: ${siteUrl}` : "non impostato",
    action: siteOk ? "—" : "Impostare NEXT_PUBLIC_SITE_URL sul dominio finale (https://www.domustua.com)",
  });

  // 3) Badge "contenuti in anteprima" spento in produzione.
  const previewBadge = isTrue(env.NEXT_PUBLIC_PREVIEW_BADGE);
  checks.push({
    area: "Anteprima",
    check: "Badge 'contenuti in verifica' spento",
    status: previewBadge ? "BLOCKED" : "PASS",
    detail: previewBadge ? "NEXT_PUBLIC_PREVIEW_BADGE=true" : "spento",
    action: previewBadge ? "Togliere NEXT_PUBLIC_PREVIEW_BADGE in produzione" : "—",
  });

  const blockers = checks.filter((c) => c.status === "BLOCKED").length;
  return { checks, ready: blockers === 0, blockers };
}
