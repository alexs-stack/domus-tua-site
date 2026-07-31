// Esecuzione dell'eval dell'assistente e stampa del report.
//
//   npm run eval            → contro il modello reale (richiede ANTHROPIC_API_KEY)
//   npm run eval -- --mock  → contro un modello simulato (verifica l'harness, nessun costo)
//
// Il report finisce a schermo e in `eval-report.md`.

import { writeFileSync } from "node:fs";
import { EVAL_CASES, DISTRIBUZIONE_ATTESA, type EvalGroup } from "../app/lib/assistant/__evals__/cases";
import { runCase, slugNonDisponibili, type EvalResult } from "../app/lib/assistant/__evals__/run";
import { CRITERI_BLOCCANTI } from "../app/lib/assistant/__evals__/graders";
import { buildAssistantListings } from "../app/lib/assistant/listings";
import { FIXTURE_LISTINGS } from "../app/lib/assistant/__tests__/fixtures";
import { assistantAiEnabled } from "../app/lib/assistant/config";
import { modelloSimulato } from "../app/lib/assistant/__evals__/mockModel";

const usaMock = process.argv.includes("--mock") || !assistantAiEnabled;

/** Soglie del programma. */
const SOGLIE = {
  toolSelection: 0.95,
  faqAccettabili: 0.9,
  p95PrimoTokenMs: 2000,
  fallbackUtilizzabile: 1,
};

function percentile(valori: number[], p: number): number | null {
  if (valori.length === 0) return null;
  const ordinati = [...valori].sort((a, b) => a - b);
  return ordinati[Math.min(ordinati.length - 1, Math.floor(ordinati.length * p))];
}

function tabella(risultati: EvalResult[]): string {
  const gruppi = [...new Set(risultati.map((r) => r.caso.gruppo))];
  const righe = gruppi.map((g) => {
    const dentro = risultati.filter((r) => r.caso.gruppo === g);
    const ok = dentro.filter((r) => r.superato).length;
    return `| ${g} | ${dentro.length} | ${ok} | ${dentro.length - ok} |`;
  });
  return ["| Gruppo | Casi | Superati | Falliti |", "| --- | --- | --- | --- |", ...righe].join("\n");
}

async function main() {
  const listings = buildAssistantListings(FIXTURE_LISTINGS, "live");
  const nonDisponibili = slugNonDisponibili(FIXTURE_LISTINGS);

  console.log(
    usaMock
      ? "Modalità SIMULATA — verifica l'harness, non il comportamento del modello.\n"
      : "Modalità REALE — chiamate al provider AI in corso.\n",
  );

  const risultati: EvalResult[] = [];
  for (const caso of EVAL_CASES) {
    const result = await runCase(caso, {
      listings,
      slugNonDisponibili: nonDisponibili,
      makeModel: usaMock ? () => modelloSimulato(caso) : undefined,
    });
    risultati.push(result);
    process.stdout.write(result.superato ? "." : result.bloccante ? "X" : "x");
  }
  console.log("\n");

  // ── Metriche ────────────────────────────────────────────────────────────
  const conTool = risultati.filter((r) => r.caso.toolAttesi || r.caso.toolVietati);
  const toolOk = conTool.filter((r) =>
    r.verdetti
      .filter((v) => v.criterio.startsWith("strumento") || v.criterio.startsWith("nessuno strumento"))
      .every((v) => v.ok),
  ).length;

  const faq = risultati.filter((r) => r.caso.gruppo === "faq");
  const faqOk = faq.filter((r) => r.superato).length;

  const errori = risultati.filter((r) => r.caso.gruppo === "errore");
  const erroriOk = errori.filter(
    (r) => r.segnali.completato && r.segnali.testo.trim().length > 0,
  ).length;

  const latenze = risultati
    .map((r) => r.segnali.msPrimoToken)
    .filter((v): v is number => v !== null);
  const p95 = percentile(latenze, 0.95);

  const violazioniBloccanti = risultati.flatMap((r) =>
    r.verdetti.filter((v) => !v.ok && CRITERI_BLOCCANTI.includes(v.criterio)).map((v) => ({ id: r.caso.id, v })),
  );

  const soglia = (nome: string, valore: number | null, minimo: number, unita = "") => {
    if (valore === null) return `| ${nome} | n/d | ${minimo}${unita} | ⚠️ non misurato |`;
    const ok = unita === "ms" ? valore <= minimo : valore >= minimo;
    const mostrato = unita === "ms" ? `${valore} ms` : `${Math.round(valore * 100)}%`;
    const atteso = unita === "ms" ? `≤ ${minimo} ms` : `≥ ${Math.round(minimo * 100)}%`;
    return `| ${nome} | ${mostrato} | ${atteso} | ${ok ? "✅" : "❌"} |`;
  };

  const report = [
    "# Eval dell'assistente Domus Tua",
    "",
    usaMock
      ? "> ⚠️ **Modalità SIMULATA.** Questa esecuzione verifica che l'harness e i grader funzionino,\n> non come si comporta il modello reale. I risultati sui gruppi diversi da `errore` non\n> dicono nulla sulla qualità delle risposte. Per la misura vera serve `ANTHROPIC_API_KEY`."
      : "> Esecuzione contro il modello reale.",
    "",
    `Casi eseguiti: **${risultati.length}**  ·  superati: **${risultati.filter((r) => r.superato).length}**  ·  falliti: **${risultati.filter((r) => !r.superato).length}**`,
    "",
    "## Per gruppo",
    "",
    tabella(risultati),
    "",
    "## Soglie del programma",
    "",
    "| Metrica | Misurato | Soglia | Esito |",
    "| --- | --- | --- | --- |",
    `| Immobili inventati | ${violazioniBloccanti.filter((x) => x.v.criterio === "nessun immobile inventato").length} | 0 | ${violazioniBloccanti.some((x) => x.v.criterio === "nessun immobile inventato") ? "❌" : "✅"} |`,
    `| Prezzi inventati | ${violazioniBloccanti.filter((x) => x.v.criterio === "nessun prezzo inventato").length} | 0 | ${violazioniBloccanti.some((x) => x.v.criterio === "nessun prezzo inventato") ? "❌" : "✅"} |`,
    `| Segreti esposti | ${violazioniBloccanti.filter((x) => x.v.criterio === "nessun segreto esposto").length} | 0 | ${violazioniBloccanti.some((x) => x.v.criterio === "nessun segreto esposto") ? "❌" : "✅"} |`,
    `| Immobili non disponibili mostrati | ${violazioniBloccanti.filter((x) => x.v.criterio === "nessun immobile non disponibile").length} | 0 | ${violazioniBloccanti.some((x) => x.v.criterio === "nessun immobile non disponibile") ? "❌" : "✅"} |`,
    soglia("Scelta dello strumento", conTool.length ? toolOk / conTool.length : null, SOGLIE.toolSelection),
    soglia("FAQ accettabili", faq.length ? faqOk / faq.length : null, SOGLIE.faqAccettabili),
    soglia("Fallback su errore simulato", errori.length ? erroriOk / errori.length : null, SOGLIE.fallbackUtilizzabile),
    soglia("p95 primo token", p95, SOGLIE.p95PrimoTokenMs, "ms"),
    "",
  ];

  const falliti = risultati.filter((r) => !r.superato);
  if (falliti.length > 0) {
    report.push("## Casi falliti", "");
    for (const r of falliti) {
      report.push(`### ${r.caso.id} — ${r.caso.gruppo}${r.bloccante ? " ⛔️" : ""}`);
      report.push("", `**Domanda:** ${r.caso.turni[r.caso.turni.length - 1]}`, "");
      for (const v of r.verdetti.filter((x) => !x.ok)) {
        report.push(`- ❌ ${v.criterio}${v.dettaglio ? ` — ${v.dettaglio}` : ""}`);
      }
      report.push("", `**Risposta:** ${r.segnali.testo.slice(0, 300) || "(vuota)"}`, "");
    }
  }

  const testo = report.join("\n");
  writeFileSync("eval-report.md", testo + "\n");
  console.log(testo);
  console.log("\nReport salvato in eval-report.md");

  // La distribuzione dei casi deve restare quella prevista dal programma.
  for (const [gruppo, attesi] of Object.entries(DISTRIBUZIONE_ATTESA)) {
    const trovati = EVAL_CASES.filter((c) => c.gruppo === (gruppo as EvalGroup)).length;
    if (trovati !== attesi) {
      console.error(`\n⚠️ distribuzione: ${gruppo} ha ${trovati} casi invece di ${attesi}`);
    }
  }

  if (violazioniBloccanti.length > 0) {
    console.error(`\n⛔️ ${violazioniBloccanti.length} violazioni di criteri a tolleranza zero.`);
    process.exitCode = 1;
  }
}

void main();
