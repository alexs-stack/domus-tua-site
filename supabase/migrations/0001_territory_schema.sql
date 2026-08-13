-- Territory V2 — schema durevole (Prompt 7). Postgres / Supabase.
--
-- STATO: NON APPLICATO. Questo file è il progetto dello store di produzione scrivibile. Va eseguito
-- SOLO dopo approvazione del cliente e provisioning del progetto Supabase (o Postgres equivalente).
-- Vedi docs/adr/004-territory-durable-storage.md per la procedura e la decisione.
--
-- Principi:
--  • coordinate esatte SOLO server-side (colonne _lat/_lng), MAI esposte al browser;
--  • accesso solo via service-role (server-only): RLS nega tutto ad anon/authenticated;
--  • concorrenza ottimistica con colonna `version` (editor non si sovrascrivono in silenzio);
--  • audit APPEND-ONLY immutabile per approve/reject/publish/unpublish/authorize/revoke;
--  • indici su chiavi, stato, freschezza, next_attempt_at, fingerprint.

begin;

-- ── Profili di origine (cache di query, uno per comune/zona) ─────────────────
create table if not exists territory_profile (
  id                     uuid primary key default gen_random_uuid(),
  municipality           text not null unique,
  zone                   text,                              -- sotto-area opzionale (zone-centroid)
  origin_lat             double precision not null,         -- SERVER-ONLY
  origin_lng             double precision not null,         -- SERVER-ONLY
  origin_precision       text not null check (origin_precision in
                           ('property-coordinate','address-geocode','zone-centroid','municipality-centroid')),
  origin_accuracy_meters integer not null,
  origin_label           text not null,                     -- base pubblica (nessuna coordinata)
  fingerprint_hash       text not null,
  fingerprint_coord_key  text not null,
  schema_version         integer not null,
  status                 text not null check (status in ('draft','approved','stale','failed','disabled')),
  retrieved_at           timestamptz not null,
  expires_at             timestamptz,
  attempts               integer not null default 0,        -- retry (Prompt 6)
  last_attempt_at        timestamptz,
  next_attempt_at        timestamptz,
  dead_lettered          boolean not null default false,
  failure                jsonb,                             -- fallimento sanificato (no PII)
  version                integer not null default 1,        -- concorrenza ottimistica
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists ix_profile_status        on territory_profile (status);
create index if not exists ix_profile_retrieved_at  on territory_profile (retrieved_at);
create index if not exists ix_profile_fingerprint   on territory_profile (fingerprint_hash);
-- solo i profili FALLITI hanno un next_attempt_at utile: indice parziale per lo scheduler.
create index if not exists ix_profile_next_attempt  on territory_profile (next_attempt_at)
  where status = 'failed' and dead_lettered = false;

-- ── POI del profilo (coordinate server-only) ─────────────────────────────────
create table if not exists territory_poi (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references territory_profile (id) on delete cascade,
  provider_id       text not null,
  category          text not null check (category in
                      ('railway-station','pharmacy','supermarket','school','park')),
  name              text not null,
  distance_meters   integer not null check (distance_meters >= 0),
  distance_method   text not null default 'straight-line',
  coord_lat         double precision,                       -- SERVER-ONLY
  coord_lng         double precision,                       -- SERVER-ONLY
  source            jsonb not null,                         -- provider/retrieved_at/attribution/source_url
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  unique (profile_id, provider_id)
);
create index if not exists ix_poi_profile_category on territory_poi (profile_id, category);

-- ── Proiezione dell'immobile (chiave = codice RealSmart) ─────────────────────
create table if not exists territory_listing (
  id                     uuid primary key default gen_random_uuid(),
  real_smart_code        text not null unique,
  municipality           text not null,
  profile_id             uuid references territory_profile (id) on delete set null,
  origin_precision       text not null,
  origin_accuracy_meters integer not null,
  origin_label           text not null,
  origin_authorization   jsonb,                             -- autorizzazione esplicita (Prompt 4)
  fingerprint_hash       text not null,
  schema_version         integer not null,
  status                 text not null check (status in ('draft','approved','stale','failed','disabled')),
  retrieved_at           timestamptz not null,
  expires_at             timestamptz,
  approval               jsonb,                             -- approvazione a livello di record
  last_approved_public   jsonb,                             -- ultima vista pubblica approvata (sopravvive ai fallimenti)
  failure                jsonb,
  version                integer not null default 1,        -- concorrenza ottimistica
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists ix_listing_municipality on territory_listing (municipality);
create index if not exists ix_listing_status       on territory_listing (status);
create index if not exists ix_listing_profile      on territory_listing (profile_id);

-- ── Overlay di approvazione POI per-immobile (decisione editoriale) ──────────
create table if not exists territory_listing_poi (
  listing_id    uuid not null references territory_listing (id) on delete cascade,
  provider_id   text not null,
  state         text not null check (state in ('draft','approved','rejected')),
  approved_by   text,
  approved_at   timestamptz,
  note          text,
  primary key (listing_id, provider_id)
);

-- ── Storia dei tentativi di refresh (osservabilità) ──────────────────────────
create table if not exists territory_refresh_attempt (
  id            bigserial primary key,
  profile_id    uuid references territory_profile (id) on delete cascade,
  municipality  text not null,
  at            timestamptz not null default now(),
  outcome       text not null check (outcome in ('refreshed','stale','unavailable','budget-skipped','lease-skipped')),
  failure_kind  text,
  execution_id  text
);
create index if not exists ix_refresh_profile on territory_refresh_attempt (profile_id, at desc);

-- ── Audit APPEND-ONLY immutabile ─────────────────────────────────────────────
create table if not exists territory_audit_event (
  id              bigserial primary key,
  at              timestamptz not null default now(),
  action          text not null check (action in
                    ('approve','reject','publish','unpublish','refresh','fail','authorize-origin','revoke-origin','import')),
  actor           text not null,
  real_smart_code text,
  municipality    text,
  from_status     text,
  to_status       text,
  note            text
);
create index if not exists ix_audit_code on territory_audit_event (real_smart_code);
create index if not exists ix_audit_at   on territory_audit_event (at desc);
-- immutabilità: nessun UPDATE/DELETE (imposta a livello di ruolo/trigger — vedi ADR-004).

-- ── Lease per profilo (lock con scadenza, cross-istanza) ─────────────────────
create table if not exists territory_lease (
  key         text primary key,                             -- slug comune/zona
  holder      text not null,                                -- executionId
  expires_at  timestamptz not null
);
create index if not exists ix_lease_expires on territory_lease (expires_at);

-- ── RLS: server-only. Il browser non tocca MAI il DB (legge il JSON committato). ─
alter table territory_profile        enable row level security;
alter table territory_poi            enable row level security;
alter table territory_listing        enable row level security;
alter table territory_listing_poi    enable row level security;
alter table territory_refresh_attempt enable row level security;
alter table territory_audit_event    enable row level security;
alter table territory_lease          enable row level security;
-- Nessuna policy per anon/authenticated ⇒ accesso NEGATO a tutti tranne service_role (bypassa RLS).

commit;
