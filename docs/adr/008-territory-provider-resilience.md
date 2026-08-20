# ADR-008 — Territory V2: resilienza, correttezza e conformità del provider di POI

- **Status:** Accettato (Prompt 11) · provider reale **disabilitato** salvo `TERRITORY_PLACES_PROVIDER=osm`
- **Data:** 2026-08-14

## Contesto

I POI (farmacie, scuole, stazioni…) vengono da un provider esterno: OpenStreetMap via **Overpass API**.
È dato pubblico e prezioso, ma un provider esterno è anche la parte più fragile e meno fidata del
sistema: può essere lento, sovraccarico, restituire pagine d'errore HTML, payload enormi o testo
ostile. Questo prompt indurisce quel confine **senza** cambiare l'astrazione `TerritoryPlacesProvider`
(fake per i test, osm per la produzione).

## Contratto Overpass verificato

Verificato sulla documentazione ufficiale (`wiki.openstreetmap.org/wiki/Overpass_API`):

- `POST /api/interpreter`, query nel corpo come `data=<QL>`, `Content-Type application/x-www-form-urlencoded`;
- risposta `[out:json]` con `elements[]`; nodi con `lat/lon`, way/relation con `center {lat,lon}` grazie a `out center`;
- ogni categoria è definita da **una coppia di tag esatta** (`railway=station`, `amenity=pharmacy`,
  `shop=supermarket`, `amenity=school`, `leisure=park`): nessuna classificazione euristica;
- endpoint pubblici sovraccarichi rispondono `429`/`504` e possono includere `Retry-After`; è richiesto
  uno **User-Agent identificativo**.

## Macchina a stati per richiesta

```
                       pick() dal pool di endpoint (circuit breaker)
                                    │
             tutti "open" ─────────┤────────── un endpoint usabile
                    │               │                    │
   ProviderAllEndpointsDownError    │              POST /api/interpreter (timeout+abort)
        (non si spara traffico)     │                    │
                                    │        ┌───────────┴──────────────────────────┐
                                    │        ▼                                       ▼
                                    │   fetch lancia                            risposta HTTP
                                    │   ┌────┴─────────────┐          ┌──────────────┼───────────────┐
                                    │   ▼                  ▼          ▼              ▼               ▼
                                    │ abort esterno   nostro abort   429         502/503/504     2xx / 4xx
                                    │ (propaga)       Timeout        RateLimit    Timeout            │
                                    │                                (Retry-After)                   │
                                    │                                                    ┌───────────┴─────────┐
                                    │                                                    ▼                     ▼
                                    │                                              4xx config            2xx: guardie
                                    │                                              ResponseError         Content-Type≠html,
                                    │                                                                    byte≤cap, elementi≤cap,
                                    │                                                                    JSON, schema
                                    │                                                                          │
   Transitori (RateLimit/Timeout/Network/AllDown):                                                    valido → map+evidence
     recordFailure(endpoint) → retry (≤ maxRetries), ruota endpoint,                                   ↘ schema errato → SchemaError
     onora Retry-After; oltre soglia il circuito si APRE (cooldown → half-open → chiude al 1º successo)  ↘ troppo grande → PayloadTooLarge
   Non transitori (Response/Schema/PayloadTooLarge): rilancia SENZA retry
```

Al livello superiore (`ProfileRefresher`, ADR-003/005): **qualunque** errore del provider conserva
l'ultimo profilo approvato (stale) o segnala `unavailable`, e registra lo stato di retry/backoff sul
profilo. **Un fallimento del provider non rimuove mai il dato pubblico già approvato.**

## Tassonomia degli errori (constraint 5)

| Errore | Causa | Transitorio | `EnrichmentFailureKind` |
|---|---|---|---|
| `ProviderRateLimitError` | HTTP 429 (con `Retry-After`) | sì | `rate-limit` |
| `ProviderTimeoutError` | nostro timeout, o 502/503/504 | sì | `timeout` |
| `ProviderNetworkError` | DNS/connessione/TLS | sì | `network` |
| `ProviderAllEndpointsDownError` | tutti i circuiti aperti | sì | `network` |
| `ProviderResponseError` | 4xx di configurazione, Content-Type HTML | no | `invalid-response` |
| `ProviderSchemaError` | JSON valido, struttura errata | no | `invalid-response` |
| `ProviderPayloadTooLargeError` | oltre i tetti byte/elementi | no | `invalid-response` |
| `ProviderDisabledError` | provider spento | no | `disabled` |

## Budget di richiesta e tetti

- **Query per profilo:** 1 per origine per refresh (profile-cache, ADR-003); più immobili nello stesso
  comune condividono la stessa query.
- **Retry:** default 2 (→ max 3 tentativi), solo su errori transitori; backoff 500·(n) ms per timeout,
  `Retry-After` (con tetto **120 s**) per il rate-limit.
- **Timeout:** 25 s per tentativo (query Overpass anch'essa `[timeout:25]`).
- **Tetti di sicurezza prima di trattenere:** **≤ 8 MB** per risposta (Content-Length se dichiarato +
  byte reali), **≤ 5000 elementi**, **Content-Type** non HTML/XML.
- **Endpoint:** default **uno** (istanza principale). Mirror **opt-in** (`endpoints`/env), con circuit
  breaker (soglia 4 fallimenti consecutivi, cooldown 60 s, half-open). Niente traffico a pioggia.

## Correttezza e sicurezza dei contenuti (constraint 7)

`normalizeProviderName` (rete finale condivisa): scarta nomi con **caratteri di controllo/invisibili**,
**markup HTML o entità**, **marcatori di prompt-injection** ("ignore all previous instructions",
"you are now"…), o senza alcun carattere alfanumerico; collassa gli spazi; limita la lunghezza. Nel
dubbio **scarta**, non "corregge". Ogni POI conserva l'**evidenza** del tag (`amenity=pharmacy`) come
provenienza verificabile: nessun luogo entra senza evidenza. I payload grezzi non vengono mai
trattenuti né loggati; si conserva solo l'evidenza normalizzata necessaria.

## Conformità sorgente — ODbL (constraint 9, per revisione legale)

OpenStreetMap è distribuito sotto **ODbL 1.0** (database) + **DbCL** (contenuti). Decisioni adottate,
da confermare con il legale:

- **Attribuzione**: "© OpenStreetMap contributors" resta **visibile** nella UI del territorio e
  presente nell'export dei dati (campo attribuzione per POI). Obbligo ODbL §4.3.
- **Uso "Produced Work"**: il sito mostra **distanze e nomi derivati**, non ridistribuisce il database
  OSM. Questo è tipicamente un *Produced Work* (ODbL §4.5): richiede attribuzione, **non** impone la
  condivisione allo stesso modo del Produced Work.
- **Share-alike / Derived Database**: NON pubblichiamo un database derivato. Se in futuro si esportasse
  un *dataset* di POI (non solo la pagina), quell'export sarebbe un **Derived Database** soggetto a
  **share-alike ODbL**: andrebbe rilasciato sotto ODbL con attribuzione. → **da valutare col legale
  prima di qualunque export pubblico di dataset.**
- **Evidenza dei tag**: conservata lato server per tracciabilità; non è ridistribuzione del database.
- **Rispetto dell'infrastruttura**: User-Agent identificativo, una query per profilo, backoff e circuit
  breaker; niente scraping massivo delle istanze pubbliche.

## Suite di conformità (constraint 11)

`provider/conformance.ts` codifica il contratto di verità/provenienza (providerId, categoria richiesta,
nome sicuro, evidenza, provider atteso, retrievedAt ISO, entro raggio, dedup, ordine per distanza,
limite, attribuzione) e `checkDisabledMakesNoCall`. **Fake e OSM (su fixture) passano entrambi la stessa
suite**: un provider futuro è "conforme" solo se la supera. Fixture deterministiche
(`__tests__/fixtures/overpass.ts`) coprono nodi, way, relation, duplicati, oggetti senza nome, tag
multipli e risultati fuori raggio.

## Runbook — sonda LIVE (opt-in, separata dai test)

I test **non toccano mai la rete** (solo fixture). Per verificare la realtà:

```bash
TERRITORY_LIVE_PROBE=1 npm run territory:provider-probe -- --lat=45.708 --lng=8.906 --radius=1500
```

- È **opt-in**: senza `TERRITORY_LIVE_PROBE=1` la sonda si rifiuta di partire (nessun traffico
  accidentale). Esegue **una** chiamata reale, stampa i conteggi per categoria, l'evidenza del primo
  POI e la **salute degli endpoint**. Mai coordinate esatte dei POI, mai payload grezzo.
- Mirror opt-in: `TERRITORY_OVERPASS_MIRRORS=1` per usare la lista di mirror noti invece della sola
  istanza principale.
- Attesa: se un endpoint è degradato, la sonda mostra `open/half-open`; ripetere dopo il cooldown.
- **Non** eseguire la sonda in CI o in loop: è una verifica manuale e rispettosa.

## Acceptance coperta

- i fallimenti del provider **non rimuovono** mai il dato pubblico approvato (livello ProfileRefresher);
- risposte sovradimensionate/ostili sono **limitate in sicurezza** (byte/elementi/Content-Type/nomi);
- ogni categoria ha **tag/evidenza espliciti** (nessuna classificazione euristica);
- l'**attribuzione** resta visibile e accurata (UI + export);
- tutti i test usano **fixture**; la sonda live è **separata e opt-in**.
