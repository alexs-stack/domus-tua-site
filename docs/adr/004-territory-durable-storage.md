# ADR-004 — Territory V2: storage durevole di produzione

- **Status:** Progettato · adattatore durevole **in attesa di autorizzazione** (Prompt 7)
- **Data:** 2026-08-13

## Decisione

Lo store territoriale ha **quattro adattatori** dietro un'unica interfaccia (`TerritoryRepository`).
La produzione **oggi** legge dal **JSON committato** (durevole, versionato in git, sopravvive ai
deploy). Lo store **scrivibile a runtime** (per il cron/editor) è un **Postgres/Supabase** il cui
schema è progettato per intero (`supabase/migrations/0001_territory_schema.sql`) ma **NON attivato**:
provisioning + migrazioni richiedono l'**approvazione esplicita del cliente** (nessun servizio a
pagamento o migrazione di produzione senza autorizzazione).

## Matrice degli adattatori

| Adattatore | Uso | Scrittura runtime | Durevole | Cross-istanza | Stato |
|---|---|---|---|---|---|
| `memory` | test | sì (effimera) | no | no | attivo (test) |
| `filesystem` | CLI/dev | sì (file) | sì (disco locale) | no | attivo |
| `json` | **produzione** | **no (sola lettura)** | sì (git) | sì (bundle) | attivo |
| `supabase` | produzione scrivibile | sì | sì | sì | **progettato, non attivato** |

- runtime di produzione: **legge** i record approvati dal JSON committato → l'ultimo-approvato
  sopravvive a fallimenti e deploy;
- i job schedulati **scrivono draft** in sicurezza SOLO su uno store scrivibile (`filesystem` in
  locale; `supabase` quando approvato). Su `json` la scrittura fallisce per costruzione.

## ERD (testo)

```
territory_profile (1) ───< territory_poi                 (POI del profilo, coord SERVER-ONLY)
territory_profile (1) ───< territory_refresh_attempt     (storia dei refresh)
territory_profile (1) ───< territory_listing (0..N)      (listing → profilo, FK opzionale)
territory_listing (1) ───< territory_listing_poi         (overlay approvazione POI per-immobile)
territory_audit_event   (append-only, immutabile: approve/publish/revoke/import…)
territory_lease         (lock per profilo con scadenza, holder = executionId)

profile:  municipality(uniq), origin_lat/lng(server-only), origin_precision/accuracy/label,
          fingerprint_hash, status, retrieved_at, attempts/next_attempt_at/dead_lettered, version
listing:  real_smart_code(uniq), profile_id, origin_*, status, approval, last_approved_public, version
```

**Coordinate** (`*_lat/_lng`) vivono SOLO server-side; il browser non tocca mai il DB (RLS nega
tutto tranne il service-role) e legge esclusivamente il JSON pubblico senza coordinate.

## Concorrenza ottimistica

- colonna `version` su `territory_profile` e `territory_listing`; ogni update editoriale fa
  `UPDATE … SET version = version + 1 WHERE id = $1 AND version = $expected` → se un altro editor ha
  scritto nel frattempo, 0 righe aggiornate = conflitto (nessuna sovrascrittura silenziosa);
- negli adattatori MVP l'equivalente è `PutOptions.ifUpdatedAt` (già presente e testato).

## Audit immutabile

- `territory_audit_event` è **append-only**: nessun UPDATE/DELETE (via privilegi di ruolo / trigger
  `before update/delete → raise exception`). Traccia approve/reject/publish/unpublish/authorize/
  revoke/refresh/import con attore e timestamp, **senza coordinate**.

## Piano di backup / rollback

- **backup:** `npm run territory:export [file]` → bundle JSON **deterministico** (chiavi ordinate,
  riesaminabile in git) di immobili + profili + audit. È la strategia di backup dell'MVP: committare
  il bundle. Con Supabase, lo stesso comando esporta dal DB.
- **restore/migrazione fra adattatori:** `npm run territory:import -- file` valida ogni record con lo
  schema e scrive nello store attivo (traccia un evento `import`).
- **rollback schema:** `supabase/migrations/0001_territory_schema.down.sql` (elimina in ordine
  inverso). **Esportare prima** un bundle; eseguire solo con autorizzazione.

## Configurazione richiesta (server-only, mai `NEXT_PUBLIC_*`)

| Variabile | Scopo |
|---|---|
| `TERRITORY_STORE_ADAPTER` | `json` (prod) · `filesystem` (dev) · `supabase` (quando approvato) |
| `TERRITORY_DATA_DIR` | cartella dei file committati (json/filesystem) |
| `SUPABASE_URL` | endpoint progetto (solo con adattatore supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | chiave service-role **server-only** (mai al browser) |
| `TERRITORY_ALLOW_EPHEMERAL` | opt-in esplicito per `memory` in produzione (sconsigliato) |

## Decisioni che richiedono il cliente (aperte)

1. **Approvare Supabase** (o un Postgres equivalente) come store scrivibile di produzione, con
   provisioning e budget. Finché non approvato, resta il flusso JSON committato + CLI.
2. Se approvato: eseguire la migrazione (procedura sopra), implementare le query tipizzate
   nell'adattatore, impostare i secret server-only.

## Acceptance coperta

- runtime legge approvati (json) · job scrivono draft (filesystem/supabase);
- due editor non si sovrascrivono (version / ifUpdatedAt);
- ultimo-approvato sopravvive a fallimento e deploy (json committato + `last_approved_public`);
- export JSON deterministico e riesaminabile in git;
- secret server-only (RLS + nessuna variabile pubblica).
