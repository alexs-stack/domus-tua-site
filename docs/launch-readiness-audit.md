# Audit finale di prontezza al lancio — Domus Tua

**Prompt 13 del programma di remediation. Audit READ-ONLY** (nessuna modifica di prodotto in questo
ramo): verifica lo stato cumulativo dei 12 interventi (Prompt 1→12, PR #32–#43) e dà **una** raccomandazione
GO / GO CONDIZIONATO / NO-GO.

Data: 2026-08-13. Base `main` = `ff1e54f` (baseline pre-remediation). I 12 interventi sono **PR aperte,
non ancora unite**: `main` — e quindi il sito attualmente su Vercel — è ancora la baseline.

---

## Raccomandazione: **GO CONDIZIONATO**

Il codice di remediation è pronto al lancio **una volta soddisfatte le condizioni qui sotto**. Non è un
GO pieno perché restano azioni del cliente (contenuti legali, contenuti feed, configurazione dominio) e
l'unione ordinata delle PR; non è un NO-GO perché l'unico difetto **di codice** bloccante trovato in questo
audit è stato corretto e verificato durante l'audit stesso.

### Condizioni bloccanti prima del go-live
1. **Unire le 12 PR in ordine** (#32→#43) con le due correzioni qui sotto incluse. Prompt 4 e Prompt 5
   toccano gli stessi file (`PropertyDetail.tsx`, `normalize.ts`): unire in ordine e risolvere il conflitto
   atteso (nessun conflitto logico, solo sovrapposizione testuale).
2. **Azioni del cliente** (attese, non difetti): testo legale definitivo + `LEGAL_DOCS_APPROVED=true`;
   `NEXT_PUBLIC_SITE_URL` sul dominio di produzione; correzione dei segnaposto `____` nel feed (T447/T2055);
   `NEXT_PUBLIC_USE_REALSMART=true` e badge anteprima spento in Production.
3. **Decisioni del cliente** (default sicuri già in codice, ma da confermare): policy URL venduti (default
   `noindex`), default Domus D.O.C., attivazione/pipeline AI (oggi spenta).

---

## Reperto P0 — trovato e corretto durante l'audit

**Regex con gruppo inline `(?i:…)` non portabile → crash sul runtime di CI/produzione.**

- **Dove:** `app/lib/realsmart/privacy.ts` (Prompt 4, PR #35) e `app/lib/realsmart/ai/guards.ts`
  (Prompt 12, PR #43). La regex `CIVIC_ADDRESS_RE` si costruisce al **caricamento del modulo** con il
  modificatore in linea `(?i:…)`.
- **Perché è sfuggito:** il sandbox locale gira **Node 26**, che accetta `(?i:…)`. Il runner di CI (e il
  Node di produzione Vercel) lo **rifiutano**: `new RegExp` lancia
  `SyntaxError: Invalid regular expression: Invalid group`. Il job `npm test` era verde in locale e **rosso
  in CI** (622/626 nelle 4 suite AI del Prompt 12 fallite al load del modulo).
- **Gravità:**
  - `privacy.ts` è importato da `normalize.ts`, cioè il **percorso di normalizzazione di OGNI annuncio**.
    Al merge del Prompt 4, l'import del modulo avrebbe **lanciato in produzione** → catalogo giù e, cosa
    peggiore, la **redazione privacy deterministica** (il controllo cardine del Prompt 4) non si sarebbe
    caricata sul runtime di destinazione. Difetto **bloccante**.
  - `guards.ts` è fuori dal percorso di richiesta (solo generazione AI offline, oggi spenta), quindi il
    sito non era a rischio, ma il job test di CI era rosso e lo strumento batch sarebbe crollato sul Node
    di destinazione.
  - **`privacy.ts` non è ancora su `main`**: la produzione attuale non è a rischio; il difetto sarebbe
    entrato **al merge** della PR #35.
- **Correzione (in questo audit, sui rami di competenza — non nel ramo dell'audit):** riscrittura senza flag
  inline; ogni lettera delle parole-chiave stradali e del token `n./numero/civico` diventa una classe a due
  casi (case-insensitive **portabile**), mantenendo `\p{Lu}` case-sensitive per la precisione sui nomi
  propri. Nessun cambiamento di comportamento. Commit `a3f92f7` (PR #35) e `8b9499a` (PR #43).
- **Verifica:** locale verde (privacy 157/157; unit 654 su #35 e 657 su #43; parser 81/81; build OK) e
  **conferma su CI** che il job test torna verde sul runner (è la prova di portabilità che il locale su
  Node 26 non può dare).

---

## Matrice di lancio

Legenda stato: ✅ pronto · ⚙️ pronto, richiede config/azione cliente · 🔎 pronto, decisione cliente.

| # | Area | Controllo | Evidenza | Stato |
|---|------|-----------|----------|-------|
| 1 | Lead / consenso | Consenso privacy obbligatorio **lato server** (non solo UI) | `app/api/lead`, `app/api/assistant/lead` (PR #32) | ✅ |
| 2 | Integrità dati | Nessun **venduto** tra correlati/suggerimenti | `app/lib/related.ts` (PR #33) | ✅ |
| 3 | Feed | **Mai mock in produzione**: stale/fail-closed, gate `VERCEL_ENV` | `loadListings`/`getVisibleListings` (PR #34) | ⚙️ richiede `NEXT_PUBLIC_USE_REALSMART=true` |
| 4 | Privacy | **Redazione deterministica** indirizzi/telefoni nelle descrizioni + gate contenuti in CI | `privacy.ts`, `contentAudit.ts` (PR #35) | ⚙️ P0 corretto; gate CI resta rosso finché il cliente non corregge `____` |
| 5 | Contenuti | **Domus D.O.C.** evidence-based, non per ogni immobile | `domusDoc.ts` (PR #36) | 🔎 confermare default |
| 6 | Legale | **Cancello di lancio** (privacy/cookie) + revoca consenso 1-click | `legal.ts`, `launchReadiness.ts` (PR #37) | ⚙️ richiede testo legale + `LEGAL_DOCS_APPROVED=true` |
| 7 | Sicurezza deps | Vulnerabilità di produzione chiuse (Next 16.3, fast-xml-parser 5.10.1, `node>=22`) | `package.json` (PR #38) | ✅ |
| 8 | Lead / health | Consegna lead riconciliata + **health veritiero** (niente stato finto) | `leadDelivery`, `app/api/health` (PR #39) | ✅ |
| 9 | Sicurezza | **Rate limit condiviso** su tutte le route pubbliche + chiave IP hashata | `rateLimit.ts` (PR #40) | ⚙️ opzionale `RATE_LIMIT_REDIS_*` per il condiviso |
| 10 | Performance | Payload griglia senza `facts` (/acquista 75→16 KB) + budget Lighthouse scaglionati | `toGridProperty` (PR #41) | ✅ (Budget Lighthouse è **informativo**) |
| 11 | SEO | Policy URL-venduti tipizzata, sitemap pulito, redirect estratti+validati, i18n off | `soldPolicy.ts`, `redirects.ts`, `sitemap.ts` (PR #42) | 🔎 confermare default `noindex` venduti |
| 12 | AI enrichment | Core + **guardie deterministiche** + ciclo revisione, store in-memory, **no auto-publish** | `app/lib/realsmart/ai/*` (PR #43) | 🔎 P0 corretto; attivazione/store = decisione cliente |

---

## Stato CI delle PR (al momento dell'audit)

- Comune a **tutte** le PR: **`Budget Lighthouse (informativo)`** rosso — è **informativo/non bloccante**
  (varianza Lighthouse in sandbox), non un blocco di lancio.
- **PR #35 (Prompt 4):** `Audit contenuti annunci` rosso **di proposito** — è il gate che resta rosso finché
  il cliente non toglie i segnaposto `____` dal feed (T447/T2055). Dopo la correzione P0, il job
  `Lint, typecheck, test & build` torna verde.
- **PR #43 (Prompt 12):** dopo la correzione P0, `Lint, typecheck, test & build` torna verde.
- Le altre PR (#32–#34, #36–#42): job bloccanti verdi; solo il Budget Lighthouse informativo rosso.

> Nota di metodo: `tsx` non fa type-check a runtime, quindi `npm test` in locale può passare mentre `next
> build` (tsc) e alcuni runtime differiscono. L'audit ha volutamente incrociato **CI** e non solo il locale:
> è così che è emerso il P0.

---

## Configurazione di deploy da impostare (riassunto)

Obbligatorie in Production: `NEXT_PUBLIC_SITE_URL` (dominio finale), `NEXT_PUBLIC_USE_REALSMART=true`,
badge anteprima spento, `LEGAL_DOCS_APPROVED=true` (dopo i testi), un provider AI (`GEMINI_API_KEY`) se si
tiene accesa ricerca/assistente. Consigliate: `RATE_LIMIT_REDIS_URL`/`_TOKEN` (rate limit condiviso),
`ASSISTANT_EMAIL_API_KEY` (canale email lead). Riferimento completo: `.env.example`.

## Fuori perimetro (per il cliente, non toccati)
DNS / cutover del dominio, Google Search Console, testi legali definitivi, correzione dei contenuti del
feed RealSmart, decisioni di prodotto (policy venduti, D.O.C., attivazione AI).
