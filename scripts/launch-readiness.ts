/**
 * Launch-readiness — `npm run launch-check`.
 *
 * Cancello di go-live: stampa la matrice di prontezza e FALLISCE (exit 1) se un check è BLOCKED.
 * Il blocco principale è l'approvazione dei documenti legali: finché la Privacy/Cookie Policy sono
 * placeholder (LEGAL_DOCS_APPROVED assente), NON si va live.
 *
 * Da eseguire con l'ambiente di PRODUZIONE prima del cutover DNS. La logica è in
 * app/lib/launchReadiness.ts (pura, testata). Non tocca rete, DNS o servizi esterni.
 */

import { evaluateLaunchReadiness } from "../app/lib/launchReadiness";

const report = evaluateLaunchReadiness(process.env);

const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));
console.log("\nLaunch-readiness Domus Tua\n");
console.log(`${pad("AREA", 12)}${pad("STATO", 15)}CHECK`);
console.log("-".repeat(72));
for (const c of report.checks) {
  console.log(`${pad(c.area, 12)}${pad(c.status, 15)}${c.check}`);
  console.log(`${pad("", 12)}${pad("", 15)}↳ ${c.detail}`);
  if (c.status !== "PASS") console.log(`${pad("", 12)}${pad("", 15)}→ ${c.action}`);
}
console.log("-".repeat(72));

if (!report.ready) {
  console.error(`\nNON PRONTO: ${report.blockers} blocco/i. Il lancio è sospeso finché non sono risolti.\n`);
  process.exitCode = 1;
} else {
  console.log("\nPRONTO: nessun blocco. (Restano le verifiche complete del Prompt 13.)\n");
}
