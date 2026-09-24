# ADR-002 — Attribution & retention for territorial data (OpenStreetMap)

- **Status:** Proposed · **Date:** 2026-08-13 · Complements ADR-001.
- **Not legal advice.** This records what the official provider policies state, verified against the
  sources below on 2026-08-13. Confirm with the client's counsel before going live.

## Sources consulted (not guessed)

- OpenStreetMap copyright & license: <https://www.openstreetmap.org/copyright>
- ODbL / attribution guidelines: <https://osmfoundation.org/wiki/Licence/Attribution_Guidelines>
- Nominatim usage policy: <https://operations.osmfoundation.org/policies/nominatim/>
- Overpass API usage (ADR-001): <https://wiki.openstreetmap.org/wiki/Overpass_API>

## License

OpenStreetMap data is licensed under the **Open Database License (ODbL)**. Using it obliges us to
(1) **credit OpenStreetMap and its contributors** and (2) make clear the **ODbL** applies. Modifying
or building upon the *database* and distributing the result triggers ODbL **share-alike**.

## What our MVP actually does

We display a **produced work**: a short, human-readable list of nearby services (name + approximate
straight-line distance) per listing. We do **not** publish or redistribute an OSM-derived *database*.
For a produced work, the obligation is **attribution**; share-alike is not triggered because we do
not distribute the underlying geodata as a database.

## What MUST appear in the UI

- The credit **"© OpenStreetMap contributors"** wherever the territorial data is shown.
  - Implemented: it is the `attribution` field carried on every POI, rendered in the
    "Vivere in zona" section (`VivereInZona.tsx`) and exposed to the assistant as `fonte`.
- A reference to the license. Recommended: link the credit to
  **<https://www.openstreetmap.org/copyright>** (which states the ODbL). **Client input required:**
  confirm the exact link/placement with the agency before enabling the public section.

## What MAY be stored

- POI **name**, **category**, provider **id** (`node/way/relation` + id), computed **straight-line
  distance**, **retrieval date**, and the **attribution** string. This is the minimal subset needed
  to render the produced work.
- We do **not** retain full provider responses/raw payloads (ADR-001, enforced by the provider
  adapter and a leak-scan test).
- Caching/storing results is **permitted and expected** by the Nominatim policy ("Results must be
  cached on your side"). Our committed JSON store *is* that cache.

## Provider usage limits we honor

| Provider | Requirement | Where enforced |
| --- | --- | --- |
| Overpass API | < 10,000 requests/day, < 1 GB/day; identifying **User-Agent**; on **HTTP 429 pause 30 s** before retry | `provider/osm.ts` (UA header, 429 → `rateLimitPauseMs`, bounded retries) |
| Nominatim (if ever used for geocoding) | **1 req/sec** (bulk: 4/min), identifying **User-Agent**, **must cache**, no autocomplete, no systematic/bulk grid queries | Not used in the MVP (origin = municipality centroid, no geocoding). If enabled later, honor these before writing the adapter. |

Additional cost controls in code: `TERRITORY_MAX_CALLS_PER_RUN` (per-run call budget with clean
abort), per-run listing limit (default 5), concurrency 1, dry-run default, and the fingerprint skip
that avoids re-querying unchanged listings.

## Client inputs still required before go-live

1. Confirm the attribution wording + link placement acceptable to the agency's brand.
2. Legal sign-off that displaying OSM-derived POI names + distances as a produced work is acceptable
   for the agency's use, and that no share-alike obligation is triggered by the chosen presentation.
3. If a real provider run is ever done at scale, confirm the Overpass instance/limits (or self-host).
