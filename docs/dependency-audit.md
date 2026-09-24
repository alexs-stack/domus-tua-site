# Audit dipendenze — stato e disposizione (Prompt 7)

Aggiornamento mirato per chiudere le vulnerabilità di PRODUZIONE. Nessun refresh ampio.

## Diff delle dipendenze dirette

| Pacchetto | Prima | Dopo | Perché |
| --- | --- | --- | --- |
| `next` | 16.2.9 | **16.3.0** | 9 advisory (middleware bypass, SSRF, cache confusion, DoS). Chiude anche postcss e sharp bundle-ati da Next. |
| `eslint-config-next` | 16.2.9 | **16.3.0** | Allineato a Next. |
| `fast-xml-parser` | ^5.9.3 | **^5.10.1** | GHSA-8r6m-32jq-jx6q (reset dei limiti di entity expansion via DOCTYPE ripetuti). |
| `overrides.postcss` | — | **^8.5.26** | Forza la patch anche sotto `@tailwindcss/postcss` (path traversal via sourceMappingURL). Build-time. |
| `engines.node` | — | **>=22** | Gli AI SDK richiedono Node 22; guardia esplicita. |

`npm install` (non `audit fix --force`) ha risolto tutto: **`npm audit --omit=dev` → 0 vulnerabilità**.

## Node standardizzato

Tutti i workflow ora su **Node 22** (prima il job Lighthouse in ci.yml e detect-sold.yml erano su 20).
Coerente con `engines: node >=22`.

## Vulnerabilità residue — TUTTE dev-only (non raggiungibili in produzione)

`npm audit` (incl. dev) riporta ancora 12 findings, tutte in tooling di CI/build che **non gira mai
in produzione e non tocca input non fidati**. Non rimosse perché il fix richiederebbe di rompere il
tool; disposizione documentata qui.

| Finding | Catena | Raggiungibilità | Disposizione |
| --- | --- | --- | --- |
| lighthouse / puppeteer-core / @puppeteer/browsers / extract-zip / js-yaml / tmp | `@lhci/cli` (già alla latest 0.15.1) | Solo nel job Lighthouse (CI, `continue-on-error`): lancia Chrome headless sul NOSTRO sito, nessun input di terzi. | Accettata (dev-only). Rivedere quando @lhci/cli pubblica deps aggiornate. Owner: manutenzione, alla prossima minor di lhci. |
| brace-expansion | `@typescript-eslint` (lint) | Solo lint locale/CI, glob nostri. | Accettata (dev-only). Si chiude col prossimo bump di eslint. |
| uuid, external-editor, inquirer, tmp | tooling lhci/eslint | Solo CI/build. | Accettata (dev-only). |

Runtime esposto (il bundle che arriva al browser e il server Next in produzione): **0 vulnerabilità**.

## Evidenza di verifica

- `npm audit --omit=dev` → **found 0 vulnerabilities**
- `npm ci` → lockfile riproducibile
- lint 0 · typecheck 0 · **test 622/622** (parser RealSmart 81/81) · build (Next 16.3.0) OK
- E2E assistente: **46 passed**
- Smoke parser sul feed live reale con fast-xml-parser 5.10.1: **196 annunci** parsati.
