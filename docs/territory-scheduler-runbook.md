# Territory — scheduler equo: runbook operativo (Prompt 6)

Lo scheduler arricchisce i profili territoriali in modo **equo, resumabile e idempotente**. È
**spento di default** e non cablato ad alcun cron: si attiva solo con flag + segreto corretti.

## Stati del profilo e transizioni

```
                    ┌───────────── cache HIT (impronta invariata + fresco) → deriva, 0 query
                    │
[actionable] ──► classifica ──► NEEDS-QUERY ──► lease ──► refresh ──┬─ ok → draft (attempts=0)
                    │                                                 └─ errore → FAILED (attempts+1,
                    │                                                              nextAttemptAt=backoff)
                    ├─ RETRY-PENDING (backoff non scaduto) → saltato, non blocca i sani
                    └─ DEAD-LETTER (attempts ≥ MAX) → richiede intervento umano
```

- **cursore di equità:** i profili NEEDS-QUERY sono ordinati per priorità (mai-tentati → retry
  dovuti → stale/cambiati) e poi per `lastAttemptAt` più **vecchio**. Con un budget più piccolo del
  numero di profili, ogni run avanza su quelli più trascurati → tutto è raggiunto nei run successivi.
- **backoff:** esponenziale (`60s · 2^(n-1)`, cap 24h) + **full jitter**, onora `Retry-After`.
- **dead-letter:** dopo `MAX_ATTEMPTS` (6) niente più retry automatici.
- **lease:** lock per profilo con scadenza (default 60s): due run non arricchiscono lo stesso
  profilo due volte. In-memory per-istanza negli adattatori MVP; cross-istanza con lo store
  approvato (Prompt 7).

## Endpoint cron — `GET /api/cron/territory`

**Inerte** finché non valgono TUTTE:
1. `CRON_SECRET` impostato (server-only) e header `Authorization: Bearer <secret>` corretto
   (confronto a **tempo costante**);
2. `TERRITORY_ENRICHMENT_ENABLED=true`;
3. store scrivibile (in produzione l'adattatore `json` è in sola lettura → i job girano via CLI).

Risposta: **solo conteggi aggregati** (nessun segreto, nessuna coordinata). Campi: `executionId`,
`considered`, `enriched`, `unchanged`, `failed`, `providerCalls`, `profilesRefreshed`,
`cacheHitListings`, `retryPending`, `deadLettered`, `leaseSkipped`, `budgetReached`,
`estimatedProviderCalls`.

## Comandi (CLI, dev/offline)

```bash
# Stima (dry-run): zero query, zero scritture, quante query servirebbero
npm run territory:sync -- --dry-run

# Esecuzione con budget stretto di QUERY (profili)
npm run territory:sync -- --max-calls 5

# Report/stato
npm run territory:report
```

## Diagnosi

| Sintomo | Causa probabile | Azione |
|---|---|---|
| `deadLettered > 0` | un profilo ha esaurito i retry | indagare il provider per quel comune; azzerare via CLI dopo il fix |
| `retryPending` alto e stabile | provider instabile | controllare rate-limit/timeout; il backoff si allarga da solo |
| `leaseSkipped > 0` ripetuto | run sovrapposti | ridurre la frequenza del cron o allungare `leaseTtlMs` |
| `estimatedProviderCalls` alto | molti profili nuovi/stale | alzare temporaneamente il budget per più run, o distribuire nel tempo |
| cron risponde 503 `disabled` | flag spento | atteso: `TERRITORY_ENRICHMENT_ENABLED` non è `true` |

## Variabili d'ambiente (server-only)

`CRON_SECRET`, `TERRITORY_ENRICHMENT_ENABLED`, `TERRITORY_MAX_CALLS_PER_RUN` (budget query),
`TERRITORY_CONCURRENCY`, `TERRITORY_STORE_ADAPTER`. Nessuna è `NEXT_PUBLIC_*`.

## Idempotenza e resumabilità

- ogni run è sicuro a invocazioni ripetute: la freschezza del profilo + il lease evitano il doppio
  lavoro; un edit non-di-posizione non innesca query (Prompt 5);
- lo stato di avanzamento è **persistito** (`lastAttemptAt`/`attempts`/`nextAttemptAt` sul profilo):
  un run interrotto riprende dal punto giusto al successivo, senza cursore esterno.
