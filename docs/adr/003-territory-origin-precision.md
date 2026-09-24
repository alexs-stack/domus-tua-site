# ADR-003 — Territory V2: gerarchia di precisione dell'origine e verità delle distanze

- **Status:** Accettato (Prompt 4)
- **Data:** 2026-08-13
- **Contesto:** l'MVP calcola le distanze POI dal CENTROIDE del comune ma le mostrava senza dire da
  dove sono misurate. Territory V2 deve supportare più livelli di precisione **in sicurezza**,
  senza mai spacciare una distanza dal centroide per una distanza dall'immobile.

## Decisione

Il vecchio `coordSource` binario diventa una **gerarchia di precisione tipizzata** con metadati di
accuratezza e una **base pubblica** senza coordinate. Le origini a livello di immobile richiedono
un'**autorizzazione esplicita** (mai dedotta dall'indirizzo).

## Mappa schema — vecchio → nuovo

| v1 (MVP) | v2 (Territory V2) |
|---|---|
| `coordSource: "municipality-centroid" \| "property"` | `originPrecision: "property-coordinate" \| "address-geocode" \| "zone-centroid" \| "municipality-centroid"` |
| — | `originAccuracyMeters: number` (raggio di incertezza per livello) |
| — | `originLabel: string` (base leggibile, **senza coordinate**) |
| — | `originAuthorization?: { precision, source, reviewedBy, reviewedAt }` (obbligatoria per property/address) |
| `origin: GeoCoord` (server-only) | invariato (server-only) |
| Public: *(nessuna base d'origine)* | Public: `originBasis: { precision, label }` — **nessuna coordinata** |
| `TERRITORY_SCHEMA_VERSION = 1` | `TERRITORY_SCHEMA_VERSION = 2` |

## Livelli di precisione (dal più preciso)

| precisione | accuratezza | autorizzazione | frase pubblica (it) |
|---|---|---|---|
| `property-coordinate` | ±0 m | **richiesta** | «Distanze indicative dall'immobile» |
| `address-geocode` | ±60 m | **richiesta** | «Distanze indicative dall'immobile» |
| `zone-centroid` | ±500 m | no | «Distanze indicative dal centro della zona San Rocco» |
| `municipality-centroid` | ±2000 m | no | «Distanze indicative dal centro di Tradate» |

La frase si deriva **solo** da `originBasis.precision` (`describeOriginBasis`, view.ts): è
strutturalmente impossibile etichettare un centroide come distanza dall'immobile.

## Regole di migrazione (v1 → v2) — `app/lib/territory/migrate.ts`

Eseguita al **confine di lettura** degli store (idempotente, mai in scrittura):

1. `coordSource "municipality-centroid"` → `originPrecision "municipality-centroid"`; `"property"` → `"property-coordinate"`.
2. `originAccuracyMeters` = valore del livello (`ORIGIN_ACCURACY_METERS`).
3. `originLabel` = nome del comune dallo slug (`"venegono-superiore"` → `"Venegono Superiore"`).
4. `lastApprovedPublic` incorporato riceve `originBasis: { precision, label }`.
5. **Lo `status` è preservato**: un `draft` resta `draft` — nessuna approvazione automatica.
6. **Fail-safe:** un vecchio `"property"` senza autorizzazione migra a `property-coordinate` ma non
   supera la validazione (serve l'autorizzazione) → scartato in lettura. Nel pilota non è mai
   esistito, quindi è un caso teorico.

## Invarianti imposti dallo schema (Zod `.strict()` + refinement)

- una precisione a livello di immobile **richiede** un'autorizzazione con `precision` coerente;
- il pubblico (`PublicListingTerritory`, `PublicTerritoryPoi`, `originBasis`) **rifiuta** qualunque
  coordinata: un `lat`/`lng` che trapela è un errore di validazione, non un dettaglio;
- `originAuthorization` porta sempre `source`, `reviewedBy`, `reviewedAt` (traccia di chi/quando).

## Esempi (base pubblica, nessuna coordinata)

```jsonc
// municipality-centroid (default MVP)
{ "precision": "municipality-centroid", "label": "Tradate" }   // "…dal centro di Tradate"
// zone-centroid
{ "precision": "zone-centroid", "label": "San Rocco" }         // "…dal centro della zona San Rocco"
// property-coordinate (richiede originAuthorization sul record privato)
{ "precision": "property-coordinate", "label": "Tradate" }     // "…dall'immobile"
```

Le precisioni fini (zona/geocodifica/coordinata) sono **supportate dai tipi** ma la loro
RISOLUZIONE è aggiunta nei prompt successivi (5 engine/zone, 8 geocodifica), ognuna con la propria
autorizzazione esplicita. Nel pilota l'origine resta `municipality-centroid`.
