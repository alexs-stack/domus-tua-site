# ADR-001 — Territorial-enrichment MVP architecture & privacy

- **Status:** Proposed (awaiting approval before implementation)
- **Date:** 2026-08-13
- **Scope:** Pilot municipalities — Tradate, Venegono Superiore, Venegono Inferiore, Lonate Ceppino
- **Categories:** railway station, pharmacy, supermarket, school, public park
- **Hard limits:** max 2 approved POIs per category · straight-line distance only · no runtime
  enrichment calls · no AI-generated prose · structured "Vivere in zona" section · the same public
  dataset feeds the chatbot.

## Decisions (locked with the client)

1. **Coordinate origin = municipality centroid.** The pilot uses the existing `COMUNI_COORDS`
   table as each listing's origin. No geocoding, no PII. The schema still supports property-level
   coordinates later (see §2).
2. **Real Places provider = OpenStreetMap Overpass + Nominatim.** No billing activation (respects
   constraint 16), attribution-only, aligned with the existing Leaflet/OSM stack. The concrete
   adapter is finalized at Prompt 4 *after* reading the provider's official documentation. A
   deterministic fake provider is used until then and in all tests.
3. **This ADR is persisted** at `docs/adr/001-territorial-enrichment.md`.

---

## 1. Current listing → page flow (verified)

`RealSmart public XML` → `fetchRawListings()` (`app/lib/realsmart/client.ts`, `fetch` with
`cache: "no-store"` + hard timeout) → `parseRealSmartPayload()` (`parse.ts`, envelope
`<Dati><immobili><immobile>`) → `normalize.ts` → **`NormalizedProperty`** → `normalizedToProperty()`
→ `Property`, all behind the single facade `app/lib/listings.ts`. Shared cache:
`unstable_cache(loadListings, ["realsmart-listings-v3"], { revalidate: 720 })`. `UltimaModifica` →
`updatedAt`; `codice` is the stable primary key.

## 2. Coordinates — the assumption that fails, and the decision it forces

**The feed exposes no per-property coordinates.** `parse.ts` reads `Comune`, `CAP`, `Zona`, and an
often-omitted `Indirizzo` — no latitude/longitude. `NormalizedProperty` carries none. The only
coordinates in the repo are a **municipality-centroid table**, `app/lib/geo/comuni.ts`
(`COMUNI_COORDS`), which already contains all four pilot towns. `PropertyMap.tsx` documents this.

Each listing therefore gets a derived **`originCoord`** with a `coordSource`:

- `municipality-centroid` — from `COMUNI_COORDS` (public, not PII). **MVP default (chosen).**
- `property` — future: server-only geocode of `Indirizzo`; the coordinate never leaves the server
  (constraints 10–12).

This keeps the full fingerprint / rounded-coordinate machinery the later prompts assume: the
rounded-coord hash applies to the centroid, and adding a property coordinate later changes the
fingerprint and re-triggers enrichment. The pilot needs **no geocoding and no PII**. Distances are
labelled *"distanza indicativa in linea d'aria"* — honest whether the origin is a centroid or a
house.

**API-volume consequence:** with centroid origins, all listings in a town share one origin, so the
engine **dedupes provider calls by rounded coordinate** → the whole pilot is **~4 origins ×
5 categories ≈ 4–20 provider calls total, once**, then only on staleness / fingerprint / schema
change. A pre-run estimator prints the projected count before any call (Prompts 7 & 10).

## 3. Assistant retrieval (verified)

`agent.ts` → `tools/getListingDetails.ts` returns `toListingPayload()` (structured facts, `null`
for unknowns) **plus `property.excerpt`** — the short excerpt, not the full 300–600-word
description. Prompt 9 adds an optional `territory` object sourced from the **same public
projection** the property page uses.

## 4. Existing conventions reused

- **Env:** server-only readers (mirroring `realsmart/env.ts`), validated only when active, throwing
  a clear listing of missing vars. Public flags are `NEXT_PUBLIC_*` only.
- **Job / store precedent:** `scripts/detect-sold.ts` — argv CLI, reuses `parseRealSmartPayload`,
  incremental (skip-unchanged), writes **key-sorted JSON**, suppresses no-op writes, fail-safe on
  error, read at runtime for free via a server-only-guarded data module (the
  `overrides.data.ts` guard is the precedent for the private store).
- **Tests:** `node:test` + `assert`; Zod for external-input validation; Playwright e2e; assistant
  evals in `app/lib/assistant/__evals__/`.

## 5. Persistent storage — none exists yet; comparison

| Option | Runtime cost | Approval trail | Infra | Verdict |
|---|---|---|---|---|
| **Committed key-sorted JSON** (à la `sold-detected.json`) | Zero (bundled import) | **Git commit = audit** | None | **Production (MVP)** |
| In-memory | Zero | — | None | **Tests (deterministic)** |
| Local filesystem (atomic tmp+rename) | n/a (CLI only) | file mtime | None | Dev/CLI bridge that *produces* the committed JSON |
| Supabase (Postgres) | network | DB rows / RLS | New infra; MCP present but **unwired + needs auth** | Documented future path; **disabled without config** |

**Recommendation:** production = **committed JSON**; local/test = **in-memory**; the filesystem
adapter is the CLI's write path; the Supabase adapter is stubbed and **fails safe** when
unconfigured (never silently ephemeral).

## 6. Change detection / fingerprint

`EnrichmentFingerprint = hash(municipality + roundedOriginCoord(~3dp) + UltimaModifica +
schemaVersion)`. The engine skips the provider when the fingerprint is unchanged **and** the schema
is current **and** approved data is still fresh.

## 7. Separation of concerns (four distinct records)

- **Original RealSmart description** — untouched, in `NormalizedProperty` (constraint 2).
- **Structured property facts** — untouched, `facts.ts`.
- **`MunicipalityTerritoryProfile`** — POIs per unique origin (town centroid); the dedup/cache layer.
- **`ListingTerritoryEnrichment`** (private, keyed by `codice`) → projected to
  **`PublicListingTerritory`** (public, no coords). In the MVP a listing references its municipality
  profile; the schema is ready for property-level POIs later.

## 8. Privacy handling

Two committed files:

- **`data/enrichment.private.json`** — server-only, guarded like `overrides.data.ts`: origin coord
  (only if property-derived), provider IDs, sanitized provider metadata.
- **`data/territory.public.json`** — the **only** file the browser bundle may import: POI name,
  category, rounded straight-line distance, provider attribution, `retrievedAt`, `method`. No
  coordinates.

A test asserts the public JSON contains **no lat/lng keys and no address strings** (leak scan). An
address is never surfaced merely because it appears in the description (constraint 12).

## 9. States, freshness, failure

- States: `draft → approved`, plus `stale`, `failed`, `disabled`.
- `stale` when `now − retrievedAt > TERRITORY_FRESHNESS_DAYS` **or** schema/fingerprint mismatch.
- Only `approved` + non-stale records enter the public projection (constraint 14).
- Provider failure ⇒ **keep last approved public data**, record a sanitized `EnrichmentFailure`,
  mark the draft `failed` — public projection untouched (constraint 12).
- Storage/provider unavailable at runtime cannot break the site: runtime reads only the committed
  public JSON, which always exists.

## 10. Provider abstraction

`TerritoryPlacesProvider.searchNearby(origin, radiusM, categories, { language, limit, signal })` →
normalized typed POIs. `FakePlacesProvider` (deterministic fixtures) for tests/dry-run; the OSM
adapter is implemented at Prompt 4 after reading its docs. Internal category normalization means the
implementation is not coupled to any single provider.

---

## Proposed modules / paths

```
app/lib/territory/{types,categories,geo,fingerprint,public,config,env}.ts
app/lib/territory/store/{repository,memory,filesystem,json,supabase}.ts
app/lib/territory/provider/{provider,fake, osm}.ts
app/lib/territory/{engine,approval,metrics}.ts
app/lib/territory/data/{territory.public.json, enrichment.private.json}
app/lib/territory/__tests__/**
scripts/territory/{sync,approve,review,report}.ts   -> npm run territory:*
app/api/cron/territory/route.ts                      (PREPARED, not activated)
app/case/[slug]/VivereInZona.tsx                     (Prompt 8)
```

## Storage keys

- Private/public listing record → RealSmart `codice`.
- Municipality profile → town slug (`tradate`, `venegono-superiore`, …) / rounded-coord bucket
  `lat3,lng3`.

## Environment variables (all default OFF / disabled in production)

Server-only: `TERRITORY_ENRICHMENT_ENABLED`, `TERRITORY_ASSISTANT_ENABLED`, `TERRITORY_PILOT_TOWNS`
(CSV, default the 4), `TERRITORY_PLACES_PROVIDER` (`fake` | `osm`), `TERRITORY_PLACES_API_KEY`
(secret; absent ⇒ provider disabled ⇒ **no calls** — Overpass/Nominatim need none, the hook stays
for future providers), `TERRITORY_SEARCH_RADIUS_M` (1500), `TERRITORY_FRESHNESS_DAYS` (180),
`TERRITORY_MAX_PER_CATEGORY` (2), `TERRITORY_MAX_CALLS_PER_RUN`, `TERRITORY_REQUEST_TIMEOUT_MS`,
`TERRITORY_CONCURRENCY` (1), `TERRITORY_STORE_ADAPTER` (`json` | `memory` | `supabase`),
`CRON_SECRET` (endpoint auth). Public: `NEXT_PUBLIC_TERRITORY_SECTION_ENABLED`. `schemaVersion`
lives in code.

## Cache & expiry

Runtime reads the **bundled** public JSON — zero cost, no `unstable_cache` needed (local data, like
`sold-detected.json`). Freshness governed by `TERRITORY_FRESHNESS_DAYS`; stale ⇒ section auto-hides.

## Anticipated provider-call volume

Pilot, centroid origins: ~4 unique origins × 5 categories ≈ **4–20 calls total, once**; subsequent
runs only re-call on staleness / fingerprint / schema change. Enforced by
`TERRITORY_MAX_CALLS_PER_RUN` with a pre-run estimate.

## Rollout controls

Flags off by default · pilot-town allowlist · CLI **dry-run default** · provider disabled without
configuration · per-run **call budget** + concurrency 1 · human approval (commit) required before
the public projection regenerates · page section and assistant access behind **separate** flags
(approve/stage without exposing).

## Test plan

Pure units (haversine, fingerprint, roundCoord, validateLatLng, normalizeMunicipality, sort/limit,
`toPublic`) · repository contract tests identical across in-memory + filesystem · deterministic
fake-provider fixtures · engine decision matrix (Prompt 5's 13 cases) · section component/page tests
(approved / none / stale / partial / long-names / mobile / no-coords) · assistant tool + eval cases
(Prompt 9) · **leak-scan test** on the public JSON.

## Failure & rollback

Provider fails ⇒ last approved kept, sanitized failure logged. Runtime never breaks (reads committed
public JSON). Rollback = revert the approval commit **or** flip
`NEXT_PUBLIC_TERRITORY_SECTION_ENABLED=false` (instant hide, no code deploy). Stale/schema bump ⇒
auto-hide until re-approved. No DNS / deployment / production-cron / billing changes anywhere
(constraint 16).
