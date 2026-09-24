// Emette un token di sessione per la redazione d'area.
//
//   npm run area:token -- --actor anna --role editor [--hours 12]
//
// Non esiste una pagina di accesso pubblica, e non è una mancanza: la redazione ha quattro
// persone, non quattromila, e una pagina di login sarebbe una superficie in più da difendere per
// un problema che non c'è. Il token si emette qui e si incolla una volta.
//
// PERCHÉ IL TOKEN PORTA IL NOME. Le decisioni editoriali finiscono in un audit append-only con
// nome e cognome. Un segreto condiviso fra quattro persone renderebbe quell'audit una finzione:
// tutte le approvazioni firmate «chiunque avesse il segreto».

import { issueReviewToken, type ReviewRole } from "../../app/lib/territory/area/review/auth";

const ROLES: ReviewRole[] = ["viewer", "researcher", "editor", "publisher"];

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main(): void {
  const actor = argValue("--actor");
  const role = argValue("--role") as ReviewRole | undefined;
  const hours = Number.parseInt(argValue("--hours") ?? "12", 10);

  if (!actor || !role || !ROLES.includes(role)) {
    console.error("Uso: npm run area:token -- --actor <nome> --role <ruolo> [--hours 12]");
    console.error(`Ruoli: ${ROLES.join(" | ")}`);
    console.error("");
    console.error("  viewer      guarda e basta");
    console.error("  researcher  accoda ricerche e registra fonti — NON approva ciò che trova");
    console.error("  editor      approva fatti e narrative");
    console.error("  publisher   pubblica e ritira");
    process.exit(1);
  }
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24 * 7) {
    console.error("--hours dev'essere fra 1 e 168.");
    process.exit(1);
  }

  try {
    const token = issueReviewToken({ actor, role }, { now: new Date(), ttlSeconds: hours * 3600 });
    console.log("");
    console.log(`  ${actor} · ${role} · valido ${hours} ore`);
    console.log("");
    console.log(token);
    console.log("");
    console.log("  Incollalo su /area-review. Non condividerlo: le decisioni prese con questo");
    console.log(`  token risulteranno firmate "${actor}".`);
    console.log("");
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
