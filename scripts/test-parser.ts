// Suite di regressione del parser locale (ricerca in linguaggio naturale, keyless).
// Esegui:  npx tsx scripts/test-parser.ts
// Esce con codice 1 se un caso fallisce (adatto a una gate di CI).
//
// I casi vivono in app/lib/ai/__evals__/searchCases.ts: li condivide con `npm run eval:search`,
// che misura gli STESSI casi sul percorso AI. Casi d'oro solo per il fallback non direbbero
// nulla su ciò che gli utenti usano davvero quando la chiave c'è.

import { parseQueryLocal } from "../app/lib/ai/parseQuery";
import { CASI, FACETS, verifica } from "../app/lib/ai/__evals__/searchCases";

let pass = 0;
const failures: string[] = [];

for (const { q, e } of CASI) {
  const { errori } = verifica(parseQueryLocal(q, FACETS), e);
  if (errori.length) failures.push(`✗ "${q}"\n    ${errori.join("\n    ")}`);
  else pass++;
}

console.log(`\nParser test: ${pass}/${CASI.length} passati.`);
if (failures.length) {
  console.log(`\n${failures.length} falliti:\n`);
  console.log(failures.join("\n\n"));
  process.exit(1);
}
console.log("Tutti i casi passano. ✓\n");
