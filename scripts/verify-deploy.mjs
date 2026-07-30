#!/usr/bin/env node
// Verifica post-deploy DETERMINISTICA (nessuna dipendenza, solo fetch di Node 20+).
//
// Interroga /api/health del deploy e conferma che rifletta ESATTAMENTE lo stato atteso:
//   • commit SHA del deploy == SHA atteso (default: HEAD locale) → "deployed == main";
//   • modalità RealSmart live (integrations.useRealSmart === true);
//   • mappa "venduto" disponibile (soldMap.available === true);
//   • preview badge spento in produzione (env.previewBadge === false);
//   • stampa build/deployment timestamp e deployment id per il log.
//
// Uso:
//   node scripts/verify-deploy.mjs [baseUrl] [expectedSha]
//   DEPLOY_URL=https://... node scripts/verify-deploy.mjs
//
// Esempi:
//   node scripts/verify-deploy.mjs https://domus-tua-ten.vercel.app
//   node scripts/verify-deploy.mjs https://domus-tua-ten.vercel.app $(git rev-parse HEAD)
//
// Exit code 0 = tutto verde; 1 = almeno un check fallito (usabile in CI/hook post-deploy).

import { execSync } from "node:child_process";

const baseUrl = (process.argv[2] || process.env.DEPLOY_URL || "").replace(/\/+$/, "");
if (!baseUrl) {
  console.error("✗ Nessun URL. Uso: node scripts/verify-deploy.mjs <baseUrl> [expectedSha]");
  process.exit(1);
}

// SHA atteso: arg esplicito, oppure HEAD locale (in CI = commit che ha innescato il deploy).
let expectedSha = process.argv[3] || process.env.EXPECTED_SHA || "";
if (!expectedSha) {
  try {
    expectedSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    expectedSha = ""; // repo non disponibile: si salta il confronto SHA (warning, non errore).
  }
}

// Se è in produzione ci aspettiamo il badge preview SPENTO; per un preview lo lasciamo passare.
const expectProduction = (process.env.EXPECT_ENV || "production") === "production";

const healthUrl = `${baseUrl}/api/health`;
console.log(`→ GET ${healthUrl}`);

let data;
try {
  const res = await fetch(healthUrl, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) {
    console.error(`✗ HTTP ${res.status} da ${healthUrl}`);
    process.exit(1);
  }
  data = await res.json();
} catch (err) {
  console.error(`✗ Fetch fallita: ${err?.message ?? err}`);
  process.exit(1);
}

const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok, detail });

const deployedSha = data?.deploy?.commit ?? null;
if (expectedSha) {
  check(
    "commit SHA == atteso",
    deployedSha === expectedSha,
    `deployed=${deployedSha ?? "null"} atteso=${expectedSha}`,
  );
} else {
  console.warn("⚠ SHA atteso non disponibile: confronto commit saltato.");
}

check("RealSmart live", data?.integrations?.useRealSmart === true, `listingsMode=${data?.integrations?.listingsMode}`);
check("mappa venduto disponibile", data?.integrations?.soldMapAvailable === true, `items=${data?.soldMap?.itemCount ?? 0}, generatedAt=${data?.soldMap?.generatedAt ?? "?"}`);
if (expectProduction) {
  check("preview badge spento (prod)", data?.env?.previewBadge === false, `previewBadge=${data?.env?.previewBadge}`);
}
check("siteUrl configurato", typeof data?.env?.siteUrl === "string" && data.env.siteUrl.length > 0, `siteUrl=${data?.env?.siteUrl ?? "null"}`);

console.log("");
console.log(`  deploy env:   ${data?.deploy?.vercelEnv ?? "?"}  ref=${data?.deploy?.commitRef ?? "?"}`);
console.log(`  build time:   ${data?.deploy?.buildTime ?? "?"}`);
console.log(`  deployment:   ${data?.deploy?.deploymentId ?? "?"}`);
console.log(`  sold counts:  ${JSON.stringify(data?.soldMap?.counts ?? {})}`);
console.log("");

let failed = 0;
for (const c of checks) {
  console.log(`  ${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? `  (${c.detail})` : ""}`);
  if (!c.ok) failed++;
}

console.log("");
if (failed > 0) {
  console.error(`✗ Verifica FALLITA: ${failed}/${checks.length} check non superati.`);
  process.exit(1);
}
console.log(`✓ Verifica OK: ${checks.length}/${checks.length} check superati. Deploy allineato.`);
