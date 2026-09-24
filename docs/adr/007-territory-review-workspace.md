# ADR-007 — Territory V2: workspace di review editoriale (servizio + CLI + artefatti)

- **Status:** Accettato (Prompt 10) · UI web amministrativa **rimandata** (manca l'autenticazione approvata)
- **Data:** 2026-08-14

## Contesto

L'arricchimento territoriale genera dati (POI, distanze, origine) che **non vanno mai pubblicati in
automatico**: serve una revisione umana esplicita, tracciata e concorrente. Fino al Prompt 9 le
operazioni editoriali passavano da funzioni pure (`approval.ts`) e da una CLI che scriveva
**direttamente** sul repository, senza un punto unico che garantisse audit e concorrenza ottimistica su
ogni scrittura. Questo prompt introduce un **livello di servizio** unico su cui poggiano CLI e (in
futuro) UI.

## Decisione

Un **`TerritoryReviewService`** tipizzato e **server-only** (`app/lib/territory/review/service.ts`) è
l'unico punto di scrittura editoriale. Ogni scrittura:

1. usa **concorrenza ottimistica** (`ifUpdatedAt` = versione vista dall'editor): chi ha dati vecchi
   **non** sovrascrive lavoro più recente → `TerritoryConcurrencyError`;
2. registra un **evento di audit immutabile** (attore + ora + motivo + transizione di stato);
3. **non pubblica mai in automatico**: `approveListing`/`applyBulkApprove` sono azioni esplicite.

Le **coordinate** non escono di default: la review mostra un'**etichetta d'origine leggibile**
(precisione + base); le coordinate compaiono solo per un editor **autorizzato** che le richiede
(`includeCoordinates`).

Gli **artefatti** (`review/artifacts.ts`) producono un **pacchetto di review deterministico**
(JSON key-sorted + Markdown) riesaminabile in git e PII-safe, con diff «cosa è cambiato», cronologia di
audit e le **istruzioni CLI esatte** per approvare. La **CLI** (`scripts/territory/review.ts`) ora
instrada **tutte** le scritture dal servizio e aggiunge `note`, `bulk-approve` (solo stesso profilo, con
`--confirm`) e `pack`.

I **fatti d'area** (Prompt 9) ottengono la loro promozione editoriale: `approveAreaFact` /
`rejectAreaFact` (`area/validate.ts`) applicano il guard soggettivo, i conflitti e la scadenza come
**rete finale** — nessun fatto soggettivo o stale può essere approvato.

## Flusso di lavoro

```
                    ┌──────────────────────────────────────────────┐
   sync/cron ──────▶│  repository: record in stato draft/stale/fail │
                    └───────────────┬──────────────────────────────┘
                                    │ listForReview()  (coda, con versione)
                                    ▼
                         ┌─────────────────────┐
                         │  editor (CLI / UI*)  │   * UI rimandata
                         └──────────┬──────────┘
             getReviewItem(code)    │  (etichette; coord solo se autorizzato)
                                    ▼
                    ┌───────────────────────────────────────┐
                    │  decisione: approve-poi / reject-poi / │
                    │  note / approve (pubblica) / unpublish │
                    │  / bulk-approve (stesso profilo)       │
                    └───────────────┬───────────────────────┘
                                    │  writeWithConcurrency(ifUpdatedAt = versione vista)
                                    ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  se versione corrisponde:  put + appendAuditEvent (immutabile)  │
        │  se qualcuno ha scritto:   TerritoryConcurrencyError (nessuna   │
        │                            scrittura, nessun audit “fantasma”)  │
        └───────────────┬───────────────────────────────────────────────┘
                        ▼
             stato approved → proiezione pubblica (Prompt 2/4): nessuna coordinata
                        │
        buildReviewPack(): JSON/MD deterministico, PII-safe, con istruzioni CLI
```

## Autorizzazione: perché la UI web è rimandata

Il prompt richiede una UI solo **se** esiste già un meccanismo di autenticazione/autorizzazione
**approvato**. Nel repository **non c'è** alcuna dipendenza di auth (nessun `next-auth`, `@auth`,
`lucia`, `clerk`, `iron-session`…) né un modello di ruoli editoriali approvato. Introdurre un login
amministrativo significherebbe **creare un sistema di autenticazione** e, plausibilmente, un servizio
esterno/di sessione — decisioni che eccedono questo prompt e richiedono **autorizzazione esplicita**.

Perciò:

- **Consegniamo ora**: servizio tipizzato + CLI da terminale (accesso già controllato da chi ha il
  repository e le variabili d'ambiente) + artefatti condivisibili. Nessun endpoint di scrittura nel
  browser, nessuna coordinata esposta.
- **Rimandiamo**: la UI web di review. Il servizio è **già l'API** su cui la UI si innesterà senza
  riscritture: la UI dovrà solo autenticare l'editor, mostrare `listForReview`/`getReviewItem` e
  chiamare gli stessi metodi con la `version` come token di concorrenza.

### Dipendenza esterna residua (per abilitare la UI)

1. **Decisione del cliente** sul provider di identità/ruoli editoriali (es. SSO aziendale, o auth
   gestita) — **creare account/servizi esterni richiede autorizzazione esplicita** (vincolo di
   progetto): non è stato fatto.
2. Un **modello di autorizzazione** che distingua «editor» da «editor autorizzato alle coordinate»
   (il servizio già prevede il gate `includeCoordinates`: la UI deve solo popolarlo dal ruolo).
3. Storage durevole di produzione attivato (ADR-004): oggi il default è filesystem/memoria; la UI
   multiutente presuppone il backend Postgres/Supabase **attivato con autorizzazione**.

## Sicurezza e privacy

- **Server-only**: `service.ts`/`artifacts.ts` non sono importabili nel bundle del browser; le
  coordinate d'origine e dei POI restano lato server e non entrano negli artefatti se non autorizzate.
- **Audit immutabile**: append-only, senza coordinate/segreti (solo chi/quando/cosa/transizione).
- **Nessun “approva tutto” implicito**: il bulk esige **stesso profilo** (stessa impronta) e
  **conferma esplicita**; ogni record approvato genera il proprio evento di audit.
- **Determinismo**: JSON key-sorted e Markdown stabili → diff di review leggibili in git.

## Acceptance coperta

- ogni scrittura editoriale è **atomica rispetto alla versione vista** e **tracciata** (test:
  concorrenza ottimistica blocca la scrittura stale; audit registrato; il tentativo fallito non lascia
  audit fantasma);
- **nessun auto-publish**: i dati generati restano `draft` finché un editor non approva
  esplicitamente (test);
- **coordinate gated**: nascoste di default, visibili solo con `includeCoordinates` (test su servizio
  e artefatti);
- **bulk sicuro**: profili diversi → errore; senza conferma → errore (test);
- **fatti d'area**: promozione editoriale con guard/scadenza/conflitti come rete finale (test);
- artefatti **deterministici e PII-safe** con istruzioni operative (test).

**La UI web amministrativa NON va introdotta senza un meccanismo di autenticazione/autorizzazione
approvato: fino ad allora la review è operata da servizio + CLI + artefatti.**
