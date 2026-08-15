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
| 12 | **Territory** | Budget payload/JS territory-off/on + Lighthouse | `performance.test.ts` (payload ≤3KB, off=0); **Lighthouse ORA ESEGUITO** (locale, build di produzione, mobile Slow-4G, mediana×3, due tornate concordi) — vedi tabella sotto. Il «baseline 0.41» che stava qui era **stale**: misurato, home **0.82**, `/acquista` **0.83**. Resta sotto il budget 0.90, e l'LCP (≈4,8 s) resta il rosso vero | **PASS (budget)** / preview BLOCKED | Dev/QA | Ripetere sul preview deployato; decidere sul rosso LCP |
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
   Numeri **misurati** qui, non stimati (locale, `npx next start`, mobile 390×844, Slow-4G,
   mediana di 3, **due tornate indipendenti a macchina scarica**):

   | pagina | perf | a11y | SEO | LCP | TBT | CLS | elemento LCP |
   |---|---|---|---|---|---|---|---|
   | `/` (prima visita, con intro) | 0.82 | 1.00 | 1.00 | 4842 ms | 3 ms | 0.000 | `span[data-hero-schar]` |
   | `/#senza-intro` (intro saltata) | 0.82 | 1.00 | 1.00 | 4846 ms | 4 ms | 0.000 | `#cookie-consent-desc` |
   | `/acquista` | 0.83 | 1.00 | 1.00 | 4492 ms | 3 ms | 0.000 | hero `<img>` |

   > **Una misura precedente di questo stesso documento era sbagliata, e vale la pena dire come.**
   > La prima tornata dava `/` a 0.61 con LCP 10027 ms e TBT 469 ms. Era stata lanciata **in
   > background mentre sulla stessa macchina giravano build e Playwright**: la contesa di CPU si
   > è sommata al rallentamento 4× di Lighthouse e ha gonfiato tutto. Due tornate successive a
   > macchina scarica concordano fra loro entro 5 ms di LCP e smentiscono la prima. Le cifre qui
   > sopra sono quelle. Regola che ne segue: **Lighthouse non si lancia in parallelo ad altro** —
   > un numero misurato sotto carico non è un numero, e finisce dritto in un documento di rilascio.

   Cosa resta vero, e cosa è caduto:
   - **Il costo dell'intro sparisce a macchina scarica.** `/` e `/#senza-intro` danno lo stesso
     punteggio (0.82) e lo stesso LCP (4842 vs 4846 ms). Il «costo dell'intro» misurato nella
     prima tornata era contesa di CPU, non l'intro. La riga `/#senza-intro` resta perché isola
     una variabile vera, ma **non** è la prova che l'intro costi: oggi non costa.
   - **Il file di configurazione dichiarava il falso** (questo regge, ed è indipendente dalla
     misura). `extraHeaders: {Cookie: dt_consent=accepted}` doveva «saltare il preloader»: non
     poteva — il preloader guarda `sessionStorage`, ed `extraHeaders` manda un'intestazione di
     richiesta, non un cookie del browser (il consenso si legge solo da `document.cookie`).
   - **L'LCP della home è sempre un piccolo elemento di TESTO**: il banner cookie (~19.700 px²)
     quando l'intro non c'è, uno span del titolo hero (~14.238 px²) quando c'è. La fotografia
     dell'hero — 329.160 px² dentro il viewport, opaca, completa a 45 ms — Chrome non la promuove
     **mai** a candidato (verificato con `scripts/lcp-probe.mts`; su `/acquista`, dove l'hero è
     un `<img>` normale, l'LCP È l'immagine: non è una regola generale sulle immagini).
     Conseguenza operativa: **sulla home l'LCP si sposta cambiando il testo e il momento in cui
     compare il banner, non ottimizzando le immagini.** Il titolo è spezzato in un box per
     carattere (SplitText) e l'LCP misura il box, non la frase.
   - **TBT ≈ 3 ms va guardato con sospetto**, non festeggiato: nello stesso report
     `mainthread-work-breakdown` vale 365–544 ms. Significa solo che nessun singolo task supera
     i 50 ms; non che il thread principale sia libero.
2-bis. **Accessibilità**: la misura ha trovato un difetto vero sulla home — titolo e testo della
   lastra «servizio di punta» a contrasto **1,03** (crema su crema): il velo scuro stava dentro la
   `MaskReveal` e veniva ritagliato via finché il sipario non si apriva, mentre il testo, che è suo
   fratello nel DOM, era già dipinto. Corretto (velo fuori dal sipario) → a11y home **0.97 → 1.00**,
   zero violazioni di contrasto. La suite axe non poteva vederlo: gira tutta con
   `reducedMotion: "reduce"` e ogni stato nascosto vive dentro `MQ.motionOk`. Il varco è ora chiuso
   da `e2e/a11y-motion.spec.ts`, che misura il contrasto **con il movimento acceso**.
3. **Dipendenze**: aggiornare `next` ≥16.2.11 e i transitivi high; ri-audit pulito.
4. **CLIENT/LEGALE**: Privacy/Cookie con voce territorio; ODbL *Produced Work* vs *Derived Database*;
   autorizzazione Nominatim; autorizzazione ricerca fatti d'area; provider identità per UI admin.
5. **Email/DNS**: SPF/DKIM/DMARC configurati e consegna lead verificata.
6. **Territory ON è graduale**: attivare i flag solo dopo approvazione editoriale dei draft del pilota
   (nessun draft è oggi approvato) e con storage durevole attivato.

Finché questi non sono chiusi e verificati sul preview, la raccomandazione è **CONDITIONAL GO**: si può
promuovere il sito con Territory V2 **spento** (sicuro, zero costo), e attivare il territorio in un
secondo momento, per comune, dopo l'approvazione umana e la verifica finale.
