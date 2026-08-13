/**
 * Audit dei redirect legacy — `npm run redirect-audit [-- --legacy=<file>]`.
 *
 * Due controlli:
 *  1) STRUTTURALE (sempre): loop, catene multi-hop, source auto-referenziali, doppioni case/slash
 *     nell'inventario di app/lib/seo/redirects.ts. Esce con codice 1 se ne trova.
 *  2) RICONCILIAZIONE (con --legacy=<file>): confronta l'elenco degli URL legacy del cliente
 *     (una riga per URL: wp-sitemap*.xml estratto, export Pagine di Search Console, backlink)
 *     con redirect + rotte vive, e stampa gli URL SCOPERTI. Non blocca: è una lista di lavoro.
 *
 * Non tocca DNS, Search Console o servizi esterni. Vedi docs/seo-redirects.md.
 */

import { readFileSync } from "node:fs";

import { legacyRedirects, validateRedirects, unmappedLegacyUrls } from "../app/lib/seo/redirects";
import { SITEMAP_ROUTES } from "../app/sitemap";

const structural = validateRedirects(legacyRedirects);
console.log(`\nRedirect legacy: ${legacyRedirects.length} regole.`);
if (structural.length === 0) {
  console.log("Struttura OK: nessun loop, catena o doppione.");
} else {
  console.error("\nDifetti strutturali:");
  for (const i of structural) console.error(`  [${i.kind}] ${i.detail}`);
  process.exitCode = 1;
}

const legacyArg = process.argv.find((a) => a.startsWith("--legacy="));
if (legacyArg) {
  const file = legacyArg.slice("--legacy=".length);
  const urls = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  const unmapped = unmappedLegacyUrls(urls, SITEMAP_ROUTES);
  console.log(`\nRiconciliazione con ${urls.length} URL legacy da ${file}:`);
  if (unmapped.length === 0) {
    console.log("Tutti gli URL legacy sono coperti (redirect o rotta viva).");
  } else {
    console.log(`SCOPERTI (${unmapped.length}) — da mappare o accettare consapevolmente:`);
    for (const u of unmapped) console.log(`  ${u}`);
  }
} else {
  console.log(
    "\nRiconciliazione col cliente: passa gli URL legacy con --legacy=<file> " +
      "(wp-sitemap estratto / export Search Console). Vedi docs/seo-redirects.md.",
  );
}
console.log("");
