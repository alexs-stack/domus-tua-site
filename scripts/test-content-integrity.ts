/**
 * Test di INTEGRITÀ CONTENUTI (Prompt 2).
 *
 * Fallisce (exit 1) se:
 *   1. due card video riusano lo stesso ID YouTube (copertina/titolo che mentono sul video);
 *   2. un video "visibile" non è marcato verified;
 *   3. il sito reintroduce una metrica numerica non verificata (mq/persone/transazioni/% venduto,
 *      conteggio video "440+") in un file sorgente di produzione;
 *   4. la sorgente unica (site.ts) torna a esporre un conteggio video non verificato;
 *   5. le recensioni demo non sono più gated dietro l'anteprima (rischio: demo mostrate come reali).
 *
 * Eseguibile con: npm run test:content   (usa tsx, come test:parser).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { site } from "../app/lib/site";
import { featuredVideo, collectionVideos, assertUniqueVideoIds } from "../app/lib/content";
import { openDomusCase, verifiedOpenDomusMetrics } from "../app/lib/openDomusCase";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(__dirname, "..", "app");
const SELF = join(__dirname, "test-content-integrity.ts");

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};
const pass = (msg: string) => console.log(`  ✓ ${msg}`);

// ─── 1 + 2. Video: ID unici e tutti verificati ───────────────────────────────────────────
const visible = [featuredVideo, ...collectionVideos];
try {
  assertUniqueVideoIds(visible);
  pass(`${visible.length} video visibili, nessun ID YouTube riusato`);
} catch (e) {
  fail((e as Error).message);
}
const unverified = visible.filter((v) => v.verified !== true);
if (unverified.length > 0) fail(`video non verificati esposti: ${unverified.map((v) => v.id).join(", ")}`);
else pass("tutti i video visibili sono verified:true");

// ─── 3. Nessuna metrica inventata nei sorgenti di produzione ──────────────────────────────
// Pattern che rappresentavano affermazioni NON verificate ora rimosse. Se ricompaiono, stop.
const BANNED: { re: RegExp; what: string }[] = [
  { re: /\b269395\b/, what: "mq valutati inventati (269395)" },
  { re: /\b6433\b/, what: "persone felici inventate (6433)" },
  { re: /\b1523\b/, what: "transazioni inventate (1523)" },
  { re: /440\s*\+/, what: 'conteggio video non verificato ("440+")' },
  { re: /\b92\s*%/, what: "% venduto non verificata (92%)" },
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if ([".ts", ".tsx"].includes(extname(p)) && p !== SELF) out.push(p);
  }
  return out;
}

const files = walk(APP_DIR);
let bannedHits = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const b of BANNED) {
    if (b.re.test(src)) {
      fail(`${b.what} in ${f.replace(APP_DIR, "app")}`);
      bannedHits++;
    }
  }
}
if (bannedHits === 0) pass(`nessuna metrica inventata in ${files.length} file sorgente`);

// ─── 4. site.ts non espone più un conteggio video non verificato ──────────────────────────
if ("videosCountLabel" in site || "videosCountNote" in site) {
  fail('site.ts espone ancora videosCountLabel/videosCountNote (conteggio video non verificato)');
} else {
  pass("site.ts non espone conteggi video non verificati");
}

// ─── 5. Le recensioni demo restano gated dietro l'anteprima ───────────────────────────────
const reviewsSrc = readFileSync(join(APP_DIR, "components", "Reviews.tsx"), "utf8");
if (reviewsSrc.includes("NEXT_PUBLIC_PREVIEW_BADGE")) {
  pass("Reviews.tsx mantiene il gate anteprima per le recensioni demo");
} else {
  fail("Reviews.tsx non gata più le recensioni demo dietro NEXT_PUBLIC_PREVIEW_BADGE");
}

// ─── 6. Caso studio Open Domus: video verificato + nessuna metrica non verificata mostrata ──
if (openDomusCase.story.verified === true) {
  pass("caso Open Domus: video testimonianza verificato");
} else {
  fail("caso Open Domus: il video testimonianza non è verificato");
}
const shownMetrics = verifiedOpenDomusMetrics();
const leaked = shownMetrics.filter((m) => !m.verified || m.value.trim().length === 0);
if (leaked.length === 0) {
  pass(`caso Open Domus: ${shownMetrics.length} metriche mostrate, tutte verificate con valore`);
} else {
  fail(`caso Open Domus: metriche non verificate/vuote esposte: ${leaked.map((m) => m.key).join(", ")}`);
}

console.log("");
if (failures > 0) {
  console.error(`✗ Integrità contenuti: ${failures} problema/i.`);
  process.exit(1);
}
console.log("✓ Integrità contenuti: tutti i check superati.");
