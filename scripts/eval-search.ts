// Eval della ricerca in linguaggio naturale sul percorso AI.
//
//   npm run eval:search     → 81 casi d'oro contro il provider vero
//
// La chat aveva 100 casi misurati; la ricerca, che è la feature che gli utenti toccano per
// prima, non aveva nulla: solo il parser locale era coperto. Questo script chiude il buco.
//
// La domanda a cui risponde non è "l'AI funziona?" ma **"l'AI fa meglio del fallback che
// sostituisce?"**. Per questo ogni caso passa da entrambi i percorsi e il report li mette
// affiancati: un percorso AI che va peggio del parser locale è un peggioramento pagato.
//
// Il report finisce a schermo e in `eval-search-report.md`.

// PRIMO import: valorizza process.env da .env.local prima che i moduli di config lo leggano.
import "./load-env";
import { writeFileSync } from "node:fs";
import { CASI, CASI_COLLOQUIALI, FACETS, verifica, type Expect } from "../app/lib/ai/__evals__/searchCases";
import { parseQuery, parseQueryLocal } from "../app/lib/ai/parseQuery";
import { AI_PROVIDER, AI_SEARCH_MODEL, aiParseEnabled } from "../app/lib/ai/config";
import type { ParsedSearch } from "../app/lib/ai/types";

interface Riga {
  q: string;
  /** "oro" = contratto del parser locale; "colloquiale" = frasi che il fallback non copre. */
  gruppo: "oro" | "colloquiale";
  atteso: Expect;
  ai: ParsedSearch;
  locale: ParsedSearch;
  /** Errori e filtri inventati, per percorso. */
  erroriAi: string[];
  inventatiAi: string[];
  erroriLocale: string[];
  inventatiLocale: string[];
  /** true se il percorso AI è caduto nel fallback locale (provider giù, timeout, schema). */
  fallback: boolean;
  ms: number;
}

function percentile(valori: number[], p: number): number | null {
  if (valori.length === 0) return null;
  const ordinati = [...valori].sort((a, b) => a - b);
  return ordinati[Math.min(ordinati.length - 1, Math.floor(ordinati.length * p))];
}

function esito(ok: boolean): string {
  return ok ? "✅" : "❌";
}

async function main() {
  if (!aiParseEnabled) {
    console.error(
      "Nessun provider configurato: imposta GEMINI_API_KEY (o ANTHROPIC_API_KEY) in .env.local.\n" +
        "Il parser locale è già coperto da `npm run test:parser`, che non richiede chiavi.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Ricerca AI — ${AI_PROVIDER} / ${AI_SEARCH_MODEL}, ` +
      `${CASI.length} casi d'oro + ${CASI_COLLOQUIALI.length} colloquiali.\n`,
  );

  const righe: Riga[] = [];
  const tutti = [
    ...CASI.map((c) => ({ ...c, gruppo: "oro" as const })),
    ...CASI_COLLOQUIALI.map((c) => ({ ...c, gruppo: "colloquiale" as const })),
  ];
  // Sequenziale di proposito: in parallelo le latenze non sarebbero più confrontabili.
  for (const { q, e, gruppo } of tutti) {
    const inizio = Date.now();
    const { filters, source } = await parseQuery(q, FACETS);
    const ms = Date.now() - inizio;
    const locale = parseQueryLocal(q, FACETS);

    const ai = verifica(filters, e);
    const loc = verifica(locale, e);
    righe.push({
      q,
      gruppo,
      atteso: e,
      ai: filters,
      locale,
      erroriAi: ai.errori,
      inventatiAi: ai.inventati,
      erroriLocale: loc.errori,
      inventatiLocale: loc.inventati,
      fallback: source === "local",
      ms,
    });
    process.stdout.write(ai.inventati.length ? "!" : ai.errori.length ? "x" : ".");
  }
  console.log("\n");

  // ── Metriche ──────────────────────────────────────────────────────────────
  const oro = righe.filter((r) => r.gruppo === "oro");
  const colloquiali = righe.filter((r) => r.gruppo === "colloquiale");
  const totale = oro.length;
  const okAi = oro.filter((r) => r.erroriAi.length === 0).length;
  const okLocale = oro.filter((r) => r.erroriLocale.length === 0).length;
  const okAiColl = colloquiali.filter((r) => r.erroriAi.length === 0).length;
  const okLocaleColl = colloquiali.filter((r) => r.erroriLocale.length === 0).length;
  const inventatiAi = righe.filter((r) => r.inventatiAi.length > 0);
  const inventatiLocale = righe.filter((r) => r.inventatiLocale.length > 0);
  const fallback = righe.filter((r) => r.fallback);
  const p95 = percentile(righe.map((r) => r.ms), 0.95);
  const mediana = percentile(righe.map((r) => r.ms), 0.5);

  // Dove l'AI vince e dove perde rispetto al fallback: è il confronto che decide se tenerla.
  const soloAi = righe.filter((r) => r.erroriAi.length === 0 && r.erroriLocale.length > 0);
  const soloLocale = righe.filter((r) => r.erroriAi.length > 0 && r.erroriLocale.length === 0);

  const report = [
    "# Eval della ricerca AI — Domus Tua",
    "",
    `> Provider **${AI_PROVIDER}**, modello \`${AI_SEARCH_MODEL}\`, ${totale} casi d'oro.`,
    ">",
    "> Le attese descrivono il contratto del **parser locale**. Una divergenza del modello non è",
    "> automaticamente un errore: le differenze sono elencate in fondo, da leggere a mano.",
    "",
    "## Soglie",
    "",
    "| Metrica | AI | Parser locale | Soglia | Esito |",
    "| --- | --- | --- | --- | --- |",
    `| Filtri inventati | ${inventatiAi.length} | ${inventatiLocale.length} | 0 | ${esito(inventatiAi.length === 0)} |`,
    `| Concordanza coi casi d'oro | ${okAi}/${totale} | ${okLocale}/${totale} | ≥ fallback | ${esito(okAi >= okLocale)} |`,
    `| Frasi colloquiali risolte | ${okAiColl}/${colloquiali.length} | ${okLocaleColl}/${colloquiali.length} | > fallback | ${esito(okAiColl > okLocaleColl)} |`,
    `| Chiamate cadute nel fallback | ${fallback.length} | — | 0 | ${esito(fallback.length === 0)} |`,
    `| Latenza mediana | ${mediana} ms | — | — | — |`,
    `| Latenza p95 | ${p95} ms | — | — | — |`,
    "",
    "**Filtri inventati** = un filtro che la frase NON chiede, o che nega esplicitamente.",
    "È l'unico difetto a tolleranza zero: toglie immobili buoni dai risultati senza che",
    "l'utente veda nulla di sbagliato — vede solo meno case. Un campo mancante, al confronto,",
    "allarga soltanto la ricerca.",
    "",
    "## Cosa cambia rispetto al parser locale",
    "",
    "I casi d'oro descrivono il contratto del fallback, quindi lì il pareggio è il massimo",
    "ottenibile: servono a dire che l'AI non **peggiora** nulla. Il valore aggiunto si vede",
    "sulle frasi colloquiali — abbreviazioni, diminutivi, comuni accorciati, importi senza",
    "unità — che le regex non possono coprire per costruzione.",
    "",
    `- Casi risolti **solo** dall'AI: **${soloAi.length}**`,
    `- Casi risolti **solo** dal parser locale: **${soloLocale.length}**`,
    "",
  ];

  if (inventatiAi.length) {
    report.push("## ⛔️ Filtri inventati dall'AI", "");
    for (const r of inventatiAi) {
      report.push(`- \`${r.q}\` — ${r.inventatiAi.join("; ")}`);
    }
    report.push("");
  }

  if (fallback.length) {
    // Senza l'elenco, "1 chiamata caduta nel fallback" è un numero su cui non si può agire:
    // non si sa se è un timeout casuale o una frase che rompe sempre lo schema.
    report.push("## Chiamate cadute nel fallback locale", "");
    for (const r of fallback) report.push(`- \`${r.q}\` — ${r.ms} ms`);
    report.push("");
  }

  if (soloAi.length) {
    report.push("## Guadagni dell'AI (il parser locale sbagliava)", "");
    for (const r of soloAi) report.push(`- \`${r.q}\` — locale: ${r.erroriLocale.join("; ")}`);
    report.push("");
  }

  if (soloLocale.length) {
    report.push("## Regressioni dell'AI (il parser locale aveva ragione)", "");
    for (const r of soloLocale) report.push(`- \`${r.q}\` — AI: ${r.erroriAi.join("; ")}`);
    report.push("");
  }

  const testo = report.join("\n");
  writeFileSync("eval-search-report.md", testo + "\n");
  console.log(testo);
  console.log("\nReport salvato in eval-search-report.md");

  const violazioni: string[] = [];
  if (inventatiAi.length) violazioni.push(`${inventatiAi.length} casi con filtri inventati`);
  if (okAi < okLocale) violazioni.push(`concordanza AI (${okAi}) sotto il parser locale (${okLocale})`);
  if (fallback.length) violazioni.push(`${fallback.length} chiamate cadute nel fallback`);
  if (okAiColl <= okLocaleColl) {
    violazioni.push(`nessun guadagno sulle frasi colloquiali (AI ${okAiColl}, locale ${okLocaleColl})`);
  }
  if (violazioni.length) {
    console.error(`\n⛔️ ${violazioni.join(" · ")}`);
    process.exitCode = 1;
  }
}

void main();
