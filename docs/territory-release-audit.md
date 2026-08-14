# Domus Tua + Territory V2 — Audit di rilascio cumulativo (Prompt 18)

**Audit READ-ONLY.** Nessun fix, merge, deploy, attivazione flag o cambio DNS in questo passo.

- **Commit cumulativo (HEAD):** `b892c92bb21e2fcf43badb83c942ca7c16aedc99` (branch `claude/prompt-18-release-audit`, creato su `claude/prompt-17-pilot`)
- **Stato repo:** pulito (`git status --porcelain` vuoto)
- **Catena cumulativa:** prompts 1–17 presenti in storia lineare su questo HEAD (verificato con `git log`)
- **Ambiente dell'audit:** dev locale. **Non** esiste un preview deployato qui: gli item che richiedono
  preview/E2E/Lighthouse live **non** possono essere marcati PASS (regola del prompt) → BLOCKED.

## Evidenze cumulative eseguite

| Check | Comando | Esito |
|---|---|---|
| Lint | `npm run lint` | **0 errori**, 1 warning pre-esistente (scheduler.test var inutilizzata) |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | **OK** |
| Unit test | `npm test` | **1223/1224 pass**, 1 skip (Supabase opt-in), 0 fail |
| Parser | `test:parser` | **81/81** |
| Content audit | parte di `npm test` (content-integrity) | pass (incluso nei 1223) |
| Build produzione | `npm run build` | **EXIT 0** |
| Dependency audit | `npm audit` | **14 high** (pre-esistenti, non da Territory V2) — vedi sotto |

## Matrice di rilascio

| # | Area | Check | Evidenza | Esito | Owner | Prossima azione |
|---|---|---|---|---|---|---|
| 1 | Repo | SHA main/integration + stato pulito | HEAD `b892c92`, working tree pulito, catena 1–17 lineare | **PASS** | Dev | — |
| 2 | Build/CI | Lint, typecheck, unit, parser, content, build | 0 errori lint; tsc OK; 1223/1224 test; 81/81 parser; build EXIT 0 | **PASS** | Dev | — |
| 2b | Deps | Dependency audit | `npm audit`: 14 high (next 16.2.9<16.2.11, fast-xml-parser, sharp, postcss, nanoid) — **non** da Territory V2 | **BLOCKED** | Platform | Aggiornare next ≥16.2.11 + transitivi prima della produzione |
| 2c | E2E/A11y | full-site E2E, assistant E2E, accessibilità | **Territory E2E ESEGUITA** su build di produzione locale: `npm run e2e:territory` **14/14** (desktop+mobile, axe 0 violazioni, 0 errori console, privacy di rete). full-site/assistant non eseguite qui | **PASS (territory)** / resto BLOCKED | Dev/QA | Eseguire full-site + assistant in CI contro il preview |
| 3 | RealSmart | Live success, stale recovery, cold fail-closed, no-mock in prod | Unit: `realsmart.test.ts`, release gate, `lastKnownGood` (pass); comportamento **live** non verificabile senza preview+feed | **BLOCKED** | Dev/QA | Verificare sul preview con feed reale |
| 4 | Sicurezza | Bypass consenso, abuso API condivise | Unit: `leadRoute.test.ts`, `rateLimit`, cron auth+limit (pass) | **PASS (unit)** / preview BLOCKED | Dev | Ri-verificare sul preview |
| 5 | Catalogo | Zero venduti nelle raccomandazioni | Unit: sold overrides + `related` (pass) | **PASS (unit)** | Dev | Confermare sul preview |
| 6 | Privacy | Zero leak indirizzo/telefono con showAddress=false (verifier indipendente) | Unit: `privacyVerify.ts` + 40+ varianti (pass); audit live-feed richiede feed | **PASS (unit)** / live BLOCKED | Dev | Eseguire audit live-feed sul preview |
| 7 | Contenuti | Domus D.O.C. verità + copy approvato | Unit: contenuti/`domusDoc` (pass) | **PASS (unit)** | Cliente/Dev | Conferma copy cliente |
| 8 | **Territory** | Migrazioni schema, storage durevole, fairness scheduler, resilienza provider, autorizzazione editoriale | `migrate/originV2.test.ts`, `store/*` (repo/backupAudit/config), `scheduler.test.ts`, `provider/{resilience,endpoints,conformance}.test.ts`, `review/*` — tutti pass | **PASS** | Dev | — |
| 9 | **Territory** | Etichette d'origine pubbliche: property / zone / municipality | `view.test.ts` "modalità d'origine" (3 modi, pass) | **PASS** | Dev | — |
| 10 | **Territory** | Zero coordinate/indirizzi pubblici (HTML, RSC, API, tool assistente, log, rete) | `security.test.ts`, `performance.test.ts`, `view.test.ts`, `explorerModel.test.ts`, `territoryAssistant.test.ts`, `observability.test.ts` (pass); network coord-check verificato in Prompt 12 sul preview-route (0 tile/coord) | **PASS** (unit + preview-route) | Dev | Riconfermare su scheda reale con dato approvato |
| 11 | **Territory** | Chatbot: separazione fattuale, provenienza, domande sensibili, fallback stale | `territoryAssistant.test.ts` (16) + **eval REALE (gemini-3.6-flash)**: corpus completo 106/108, `territorio` 8/8, `sicurezza` 10/10, tool selection 100% | **PASS (reale)** | Dev | — |
| 12 | **Territory** | Budget payload/JS territory-off/on + Lighthouse | `performance.test.ts` (payload ≤3KB, off=0); Lighthouse configurato median×3, **non eseguito** qui; site-wide budget **fallisce** (baseline 0.41) | **PASS (budget)** / Lighthouse BLOCKED | Dev/QA | Eseguire Lighthouse sul preview; decidere sul rosso site-wide |
| 13 | Legale | Privacy/Cookie data-flow, ODbL, decisioni provider/legali | ADR-013/008: inventario data-flow + ODbL/Nominatim verificati su fonti primarie; decisioni **elencate** | **CLIENT ACTION** | Cliente/Legale | Approvare copy Privacy/Cookie + ODbL export + Nominatim |
| 14 | SEO/Infra | Sitemap, sold-page, redirect, canonical/robots, host preview | Unit/build (route presenti); comportamento host prod-preview non verificabile qui | **BLOCKED** | Dev/QA | Verificare sul preview (`verify:deploy`, `smoke`) |
| 15 | Email/DNS | Resend/SPF/DKIM/DMARC + salute lead | Config-dipendente; `/api/health` dichiara lo stato; DNS/DKIM = **client/ops** | **CLIENT ACTION** | Cliente/Ops | Configurare SPF/DKIM/DMARC; verificare consegna |

## Dettaglio dependency audit (2b)

14 high **pre-esistenti**, non introdotte da Territory V2 (che non aggiunge dipendenze):
`next` 16.2.9 (< 16.2.11: middleware bypass + DoS Server Actions), `fast-xml-parser`, `sharp`
(libvips CVE), `postcss` (path traversal), `nanoid`. → aggiornamento prima della produzione.

## Territory V2 — postura di rilascio

Territory V2 è **spento di default** (`NEXT_PUBLIC_TERRITORY_SECTION_ENABLED`,
`TERRITORY_ENRICHMENT_ENABLED`, `TERRITORY_ASSISTANT_ENABLED` = off). A feature spenta: **zero** costo
client (chunk non caricato), nessun dato pubblico, comportamento del sito/assistente invariato
(verificato dai test). Nulla è approvato o pubblicato (Prompt 17). Attivarlo è una decisione esplicita
alla verifica finale.

## Verdetto

### ⚠️ CONDITIONAL GO — con prerequisiti nominati

Il build cumulativo è **verde** (lint/typecheck/1223 test/parser/build) e Territory V2 è **sicuro e
spento**: la sua attivazione non introduce coordinate pubbliche, non pubblica draft e non ha regressioni
misurabili. **Non** è un GO pieno per "flag di produzione + DNS" perché, come richiesto, il preview
deployato **non è stato verificato insieme** in questo ambiente e restano prerequisiti aperti:

**Prerequisiti prima di GO pieno (flag produzione + DNS):**
1. **Preview deployato**: eseguire E2E full-site + assistant, accessibilità (axe), Lighthouse
   median×3, e il coord-check di rete su una scheda con dato approvato → tutti verdi insieme al commit.
2. **Lighthouse site-wide**: portare home/`/acquista` entro budget (LCP≤2500/TBT≤300) **oppure**
   accettazione esplicita del rosso pre-esistente (non è un problema del territorio).
3. **Dipendenze**: aggiornare `next` ≥16.2.11 e i transitivi high; ri-audit pulito.
4. **CLIENT/LEGALE**: Privacy/Cookie con voce territorio; ODbL *Produced Work* vs *Derived Database*;
   autorizzazione Nominatim; autorizzazione ricerca fatti d'area; provider identità per UI admin.
5. **Email/DNS**: SPF/DKIM/DMARC configurati e consegna lead verificata.
6. **Territory ON è graduale**: attivare i flag solo dopo approvazione editoriale dei draft del pilota
   (nessun draft è oggi approvato) e con storage durevole attivato.

Finché questi non sono chiusi e verificati sul preview, la raccomandazione è **CONDITIONAL GO**: si può
promuovere il sito con Territory V2 **spento** (sicuro, zero costo), e attivare il territorio in un
secondo momento, per comune, dopo l'approvazione umana e la verifica finale.
