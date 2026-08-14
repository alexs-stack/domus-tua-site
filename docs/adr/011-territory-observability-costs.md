# ADR-011 — Territory V2: osservabilità, analytics e costi operativi

- **Status:** Accettato (Prompt 14) · nessun vendor esterno · logging opt-in
- **Data:** 2026-08-14

## Contesto

Serve capire in produzione se il territorio è **sano** e **quanto costa**, senza loggare dati di
posizione privati e **senza installare un vendor** (constraint 8). Tutto poggia su interfacce
provider-neutre e sui dati già presenti nello store approvato.

## Definizioni delle metriche

Eventi tipizzati e privacy-safe (`observe.ts`, unione `TerritoryMetricEvent`):

| Evento | Campi (solo questi) | Copre |
|---|---|---|
| `provider-call` | provider, outcome, failure?, latencyMs, municipality?, runId? | chiamate provider, latenza, fallimenti |
| `geocode-call` | outcome, latencyMs, municipality?, runId? | geocoding **contato a parte** dai POI |
| `profile-cache` | result (hit/refreshed/stale/unavailable/budget-skipped) | cache hit/miss |
| `record-status` | status, municipality?, recordId (troncato) | record per draft/approved/stale/failed |
| `approval-turnaround` | hours, municipality? | tempo di lavorazione approvazione |
| `public-impression` / `public-interaction` | action, municipality? | impression/interazioni sezione pubblica |
| `assistant-tool` / `assistant-fallback` | tool, hadTerritory / reason, scope, turnId? | uso strumenti territoriali + fallback |

**Mai** presenti: coordinate esatte, indirizzi, telefoni, email, chiavi/token, payload grezzi, nomi
di revisori. Ammessi: comune "grosso" (slug, già pubblico) e ID di record **troncati** (constraint 2).
Il sink `guarded()` **scarta** in silenzio ogni evento che contenga una coordinata/telefono/campo
proibito (rete finale, verificata dai test). Sink disponibili: `NULL_SINK` (default), `ConsoleJsonSink`
(opt-in `TERRITORY_METRICS_LOG=true`), `MemorySink` (test). Nessun vendor.

**ID di correlazione** (constraint 3): `makeRunId()` per un run di refresh (oltre all'`executionId`
già presente nello scheduler) e `makeTurnId()` per un turno dell'assistente — opachi, **non** legati
all'identità dell'utente.

## Salute aggregata — `/api/health` (constraint 4)

`computeTerritoryHealth(metadata, …)` calcola dai **soli conteggi** dei record (nessuna origine):
record per stato, comuni coperti, copertura stale, backlog, età del più vecchio in attesa, tasso
d'errore, turnaround medio di approvazione, e `zeroApprovedAfterEnablement`. Ne esce un livello
`ok | warning | critical`. `/api/health` espone un blocco `territory` **solo aggregato**: stato,
conteggi, budget, kill switch, segnali — **niente nomi di revisori, niente origini precise, niente
dettagli di fonte**. → «un operatore capisce se il territorio è sano senza aprire il database».

## Soglie di allerta (constraint 5) — `thresholds.ts`

| Segnale | Warning | Critical | Env |
|---|---|---|---|
| Copertura stale | ≥ 0.20 | ≥ 0.40 | `TERRITORY_STALE_COVERAGE_*` |
| Backlog (draft+failed) | ≥ 20 | ≥ 50 | `TERRITORY_BACKLOG_*` |
| Età più vecchio in attesa | ≥ 72 h | ≥ 168 h | `TERRITORY_OLDEST_PENDING_HOURS_*` |
| Tasso d'errore provider | ≥ 0.25 | ≥ 0.50 | `TERRITORY_PROVIDER_ERROR_RATE_*` |
| Zero approvati dopo abilitazione | — | sempre critico | (derivato dai flag) |

## Budget e kill switch (constraint 6) — `budget.ts`

- **Kill switch** (`TERRITORY_KILL_SWITCH=true`): spegne **subito** ogni nuova chiamata esterna. In
  pratica `selectProviderFromEnv` consegna il provider reale **disabilitato** → `searchNearby` solleva
  `ProviderDisabledError`, il motore conserva l'ultimo dato approvato. **I dati pubblici approvati
  restano serviti** (le letture non passano dal provider). Verificato dai test.
- **Budget mensile**, SEPARATO per POI e geocoding (`TERRITORY_POI_MONTHLY_BUDGET`,
  `TERRITORY_GEOCODE_MONTHLY_BUDGET`): `evaluateCallBudget(kind, usedThisMonth, budgets)` è puro; oltre
  il tetto → nuove chiamate bloccate, dati approvati intatti. `callsThisMonth()` fornisce un conteggio
  deterministico dai `retrievedAt` dei profili del mese. Anche i provider oggi gratuiti hanno un tetto:
  un domani potrebbero far pagare, e comunque non si martella un'istanza pubblica.

## Report operativo mensile (constraint 7) — `opsReport.ts` + `npm run territory:ops-report`

Puro e **deterministico** (stessi input → stesso output), tracciabile alla fonte (store + audit), mai
coordinate/note. Contiene: copertura (comuni, record per stato), freschezza (età media/max approvati,
stale), fallimenti, azioni editoriali del mese (per tipo + editor distinti), uso del provider (refresh
del mese) ed engagement (se raccolto; altrimenti dichiarato «non raccolto», mai inventato). JSON o
Markdown, adatto al retainer.

## Dashboard / runbook proposto

- **Pannello salute**: `curl /api/health | jq .territory` → stato + segnali. Rosso su `critical`.
- **Runbook per segnale**:
  - *stale-coverage alto* → lanciare un sync dei profili scaduti; verificare il provider.
  - *backlog / oldest-pending alto* → sollecitare la review editoriale (CLI `territory:review`).
  - *provider-error-rate alto* → controllare la salute endpoint (`territory:provider-probe`), il
    circuit breaker (ADR-008); valutare i mirror.
  - *zero-approved dopo abilitazione* → verificare i flag e che esista dato approvato prima di
    pubblicizzare la sezione.
  - *budget vicino al tetto* → decidere se alzare il budget o accettare lo stop; il kill switch è la
    leva d'emergenza.
- **Logging**: `TERRITORY_METRICS_LOG=true` → una riga JSON per evento, ingeribile da qualunque
  pipeline esistente (nessun vendor).
- **Report mensile**: `npm run territory:ops-report -- --month=YYYY-MM --format=md` in allegato al
  retainer.

## Formula di costo mensile stimato

```
costo_mensile ≈ (chiamate_POI × prezzo_POI) + (chiamate_geocode × prezzo_geocode) + costo_storage

chiamate_POI ≈ comuni_attivi × refresh_al_mese_per_comune          # 1 query per profilo/refresh
chiamate_geocode ≈ nuovi_indirizzi_autorizzati_al_mese             # solo origini a livello immobile
```

Oggi (OSM Overpass, Nominatim con policy prudente): `prezzo_POI = prezzo_geocode = 0` → **costo
esterno ≈ 0**, dominato dallo storage (trascurabile per il pilota). Esempio pilota: 4 comuni ×
~1 refresh/settimana ≈ **~16 chiamate POI/mese**, ben sotto qualsiasi budget. La formula resta valida
per un provider a pagamento futuro: si popolano `prezzo_POI`/`prezzo_geocode` e i budget mensili
fanno da tetto rigido.

## Stato del CABLAGGIO (aggiornato dopo il Prompt 18)

Le metriche e il budget non sono più solo definiti: sono **collegati ai percorsi reali**.

- `provider-call` (con latenza ed esito), `profile-cache` e `record-status` sono emessi da
  `ProfileRefresher`; `assistant-tool`/`assistant-fallback` dai tool territoriali; `public-impression`
  dalla lettura server-side della sezione pubblica. Sempre attraverso `guarded()`.
- Il **budget mensile** è consultato PRIMA di ogni nuova query (`allowProviderCall` nel refresher):
  un breach instrada nel percorso `budget-skipped` già esistente — le nuove chiamate si fermano, il
  profilo approvato resta servito. Il report di sync espone `monthlyBudgetBlocked`.
- Test dedicati (`__tests__/wiring.test.ts`) falliscono se qualcuno scollega uno di questi percorsi.

## Acceptance coperta

- salute leggibile senza database (`/api/health.territory`, aggregato);
- **nessuna PII/coordinata** in log o metriche (guard + test dedicati);
- breach di budget/kill switch **ferma le nuove chiamate** ma **preserva il dato pubblico approvato**
  (test);
- report mensile **deterministico e tracciabile** (puro, da store + audit).
