-- Dominio d'AREA — schema durevole (audit «area description + RealSmart automation», Prompt 4).
-- Postgres / Supabase.
--
-- STATO: NON APPLICATO. Come 0001, questo file è il progetto dello store: va eseguito SOLO dopo
-- approvazione esplicita e su un progetto Supabase nominato. Vedi docs/adr/004 (storage) e
-- docs/adr/015 (confini del dominio d'area).
--
-- RAPPORTO CON 0001. Le tabelle `territory_*` di 0001 riguardano le DISTANZE per-immobile: un
-- profilo di origine, i suoi POI, la proiezione pubblica. Le tabelle `area_*` di qui riguardano
-- la CONOSCENZA d'area: fonti, fatti verificati, testi generati. Sono due cose diverse e restano
-- separate — vedi la tabella dei quattro tipi di "fatto" in ADR-015. L'unico punto di contatto è
-- `property_area_contexts`, che lega un immobile alla sua area.
--
-- PRINCIPI (invariati rispetto a 0001):
--  • coordinate esatte SOLO server-side, MAI in una vista pubblica;
--  • RLS nega tutto ad anon/authenticated: si passa solo da service_role (server);
--  • concorrenza ottimistica con `version`;
--  • audit APPEND-ONLY per ogni decisione editoriale;
--  • nessun auto-approve: `approved_by` e `approved_at` sono obbligatori insieme allo stato.
--
-- CONVENZIONE SULLE CHIAVI. `area_key` è la chiave canonica a cinque segmenti
-- (`paese|regione|provincia|comune|quartiere`, vedi app/lib/territory/area/identity.ts). MAI
-- un'etichetta: il vincolo `ck_area_key_shape` lo impone in database, non solo in TypeScript,
-- perché un'etichetta infilata come chiave è il difetto che questo lavoro ha appena tolto.

begin;

-- ─────────────────────────────────────────────────────────────
-- Vincolo di forma riusato da tutte le tabelle con una chiave d'area.
-- Cinque segmenti separati da "|", ciascuno slug o vuoto. Il comune può mancare solo in
-- casi non risolti, che però non arrivano qui: chi scrive un profilo ha già un comune.
-- ─────────────────────────────────────────────────────────────
create or replace function area_key_is_canonical(k text) returns boolean
  language sql immutable parallel safe as
$$ select k ~ '^[a-z0-9-]*\|[a-z0-9-]*\|[a-z0-9-]*\|[a-z0-9-]+\|[a-z0-9-]*$' $$;

-- ── 1. Profili d'area — l'anagrafica, nessun contenuto ───────────────────────
create table if not exists area_profiles (
  id                    uuid primary key default gen_random_uuid(),
  area_key              text not null unique,
  -- Chiave del solo comune: le frazioni la condividono, ed è così che i fatti a scala
  -- comunale si scrivono una volta invece di una per frazione.
  municipality_area_key text not null,
  label                 text not null,                     -- etichetta pubblica ("Abbiate Guazzone")
  country               text not null default 'it',
  region                text,                              -- NULL = non nel registro, non "sconosciuta per sempre"
  province              text,                              -- sigla ("VA")
  municipality          text not null,                     -- slug
  neighbourhood         text,                              -- slug, NULL = profilo di comune
  scope                 text not null check (scope in ('municipality','zone','region')),
  status                text not null check (status in
                          ('draft','researching','approved','insufficient-evidence')),
  schema_version        integer not null,
  review_by             timestamptz,
  approved_by           text,
  approved_at           timestamptz,
  version               integer not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint ck_profile_area_key       check (area_key_is_canonical(area_key)),
  constraint ck_profile_muni_key       check (area_key_is_canonical(municipality_area_key)),
  -- Nessun auto-approve: uno stato "approved" senza chi e quando non è un'approvazione.
  constraint ck_profile_approval       check (
    status <> 'approved' or (approved_by is not null and approved_at is not null)),
  -- Un profilo di comune non ha quartiere; uno di zona ce l'ha. Impedisce il record ibrido
  -- che poi nessuna query sa interrogare.
  constraint ck_profile_scope_shape    check (
    (scope = 'zone' and neighbourhood is not null) or
    (scope <> 'zone' and neighbourhood is null))
);
create index if not exists ix_area_profile_status on area_profiles (status);
create index if not exists ix_area_profile_muni   on area_profiles (municipality_area_key);
create index if not exists ix_area_profile_review on area_profiles (review_by)
  where status = 'approved';

-- ── 2. Fonti d'area ──────────────────────────────────────────────────────────
create table if not exists area_sources (
  id                uuid primary key default gen_random_uuid(),
  area_profile_id   uuid not null references area_profiles (id) on delete cascade,
  source_id         text not null,                         -- id derivato dall'URL canonico (as_…)
  url               text not null,
  canonical_url     text not null,
  owner             text not null,                         -- ente proprietario ("Comune di Tradate")
  source_type       text not null check (source_type in
                      ('municipality','province','region','national','transport-operator',
                       'healthcare','education','parks','secondary')),
  retrieved_at      timestamptz not null,
  review_by         timestamptz not null,
  content_hash      text not null,                         -- cambia → la fonte è cambiata
  status            text not null check (status in ('active','changed','stale','unreachable','rejected')),
  last_http_status  integer,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Una fonte per area: lo stesso URL riletto NON crea una riga nuova, aggiorna questa.
  -- È ciò che rende il job di ricerca ripetibile senza gonfiare la tabella.
  unique (area_profile_id, canonical_url)
);
create index if not exists ix_area_source_status  on area_sources (status);
create index if not exists ix_area_source_review  on area_sources (review_by) where status = 'active';
create index if not exists ix_area_source_sid     on area_sources (source_id);

-- ── 3. Fatti d'area — l'evidenza ─────────────────────────────────────────────
create table if not exists area_facts (
  id               uuid primary key default gen_random_uuid(),
  fact_id          text not null unique,                   -- id derivato dal contenuto (af_…)
  area_profile_id  uuid not null references area_profiles (id) on delete cascade,
  category         text not null check (category in
                     ('transport','municipal-service','park-facility','school',
                      'healthcare','market-event','regional-connection')),
  scope            text not null check (scope in ('municipality','zone','region')),
  canonical_text_it text not null,                         -- parafrasi canonica italiana
  source_id        uuid not null references area_sources (id) on delete restrict,
  source_locator   text not null,                          -- dove esattamente nella fonte
  status           text not null check (status in ('candidate','approved','rejected','conflicted','stale')),
  confidence       numeric(3,2) check (confidence >= 0 and confidence <= 1),
  approved_by      text,
  approved_at      timestamptz,
  review_by        timestamptz not null,
  -- Fatti che si contraddicono condividono un conflict_group: finché il gruppo non è risolto,
  -- NESSUNO dei suoi membri è pubblicabile. Il database non sceglie un vincitore.
  conflict_group   text,
  content_hash     text not null,
  schema_version   integer not null,
  version          integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint ck_fact_approval check (
    status <> 'approved' or (approved_by is not null and approved_at is not null)),
  -- `on delete restrict` sulla fonte, non `cascade`: cancellare una fonte NON deve far sparire
  -- in silenzio i fatti che ne dipendono. Vanno prima rivisti o rifiutati a mano.
  constraint ck_fact_conflicted check (status <> 'conflicted' or conflict_group is not null)
);
-- Anti-duplicato: lo stesso testo, dalla stessa fonte, per la stessa area, è UN fatto.
create unique index if not exists ux_area_fact_dedup
  on area_facts (area_profile_id, source_id, md5(lower(btrim(canonical_text_it))));
create index if not exists ix_area_fact_profile   on area_facts (area_profile_id, status);
create index if not exists ix_area_fact_review    on area_facts (review_by) where status = 'approved';
create index if not exists ix_area_fact_conflict  on area_facts (conflict_group) where conflict_group is not null;

-- ── 4. Narrative d'area — il racconto ────────────────────────────────────────
create table if not exists area_narratives (
  id               uuid primary key default gen_random_uuid(),
  area_profile_id  uuid not null references area_profiles (id) on delete cascade,
  locale           text not null check (locale in ('it','en','fr','de','es')),
  title            text not null,
  intro            text not null,
  sections         jsonb not null,                         -- [{category,heading,body,factIds}]
  claim_map        jsonb not null,                         -- [{claim,factIds}]
  source_ids_used  jsonb not null default '[]'::jsonb,
  -- Impronta dei fatti approvati da cui nasce: non combacia più → il testo è obsoleto, e lo si
  -- sa SENZA rigenerarlo (rigenerare per confrontare è pagare per scoprire che non serviva).
  facts_hash       text not null,
  prompt_version   text not null,
  model_id         text,
  quality_score    integer check (quality_score >= 0 and quality_score <= 100),
  status           text not null check (status in ('draft','approved','rejected','superseded')),
  approved_by      text,
  approved_at      timestamptz,
  published_at     timestamptz,
  schema_version   integer not null,
  version          integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint ck_narrative_approval check (
    status <> 'approved' or (approved_by is not null and approved_at is not null)),
  -- La soglia di pubblicazione vive anche qui, non solo nel codice: un punteggio sotto 95 non
  -- deve poter essere approvato nemmeno da uno script che salta il gate applicativo.
  constraint ck_narrative_quality  check (
    status <> 'approved' or (quality_score is not null and quality_score >= 95))
);
-- Una sola narrativa NON superata per area e lingua: le versioni vecchie diventano 'superseded'.
create unique index if not exists ux_area_narrative_current
  on area_narratives (area_profile_id, locale) where status in ('draft','approved');
create index if not exists ix_area_narrative_status on area_narratives (status);

-- ── 5. Contesto d'area per immobile ──────────────────────────────────────────
create table if not exists property_area_contexts (
  id                  uuid primary key default gen_random_uuid(),
  real_smart_code     text not null unique,
  area_profile_id     uuid not null references area_profiles (id) on delete restrict,
  source_hash         text not null,                       -- impronta della località dell'immobile
  -- ⚠️ SERVER-ONLY. Nessuna vista pubblica seleziona queste due colonne, e la vista
  -- `public_property_area` più sotto è la prova che si può servire la pagina senza toccarle.
  private_origin_lat  double precision,
  private_origin_lng  double precision,
  public_origin_type  text not null check (public_origin_type in
                        ('property-coordinate','address-geocode','zone-centroid','municipality-centroid')),
  public_origin_label text not null,                       -- base leggibile, senza coordinate
  location_precision  text not null check (location_precision in
                        ('neighbourhood','municipality','unresolved')),
  poi_snapshot        jsonb not null default '[]'::jsonb,
  calculated_at       timestamptz not null,
  review_by           timestamptz,
  status              text not null check (status in ('draft','approved','stale','rejected')),
  approved_by         text,
  approved_at         timestamptz,
  version             integer not null default 1,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint ck_ctx_approval check (
    status <> 'approved' or (approved_by is not null and approved_at is not null)),
  -- Una precisione a livello di immobile senza coordinata privata è una contraddizione: dichiara
  -- di misurare dalla casa senza sapere dov'è.
  constraint ck_ctx_precision check (
    public_origin_type not in ('property-coordinate','address-geocode')
    or (private_origin_lat is not null and private_origin_lng is not null))
);
create index if not exists ix_ctx_profile on property_area_contexts (area_profile_id);
create index if not exists ix_ctx_status  on property_area_contexts (status);

-- ── 6. Coda dei job ──────────────────────────────────────────────────────────
create table if not exists area_jobs (
  id               uuid primary key default gen_random_uuid(),
  -- L'idempotenza sta QUI, non nella logica applicativa: due sync concorrenti che scoprono lo
  -- stesso immobile cambiato producono la stessa chiave, e la seconda insert non passa.
  idempotency_key  text not null unique,
  job_type         text not null check (job_type in
                     ('research-sources','extract-facts','generate-narrative',
                      'translate-narrative','compute-property-context','revalidate')),
  target_id        text not null,                          -- area_key o codice RealSmart
  state            text not null check (state in
                     ('pending','leased','done','failed','dead-letter','cancelled')),
  attempts         integer not null default 0,
  available_at     timestamptz not null default now(),     -- backoff: non prima di qui
  locked_by        text,
  locked_until     timestamptz,
  last_error       text,                                   -- sanificato: mai URL con credenziali
  run_metadata     jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz,
  constraint ck_job_lease check ((locked_by is null) = (locked_until is null))
);
-- Indice parziale per lo scheduler: interroga solo ciò che è davvero prendibile.
create index if not exists ix_area_job_ready on area_jobs (available_at)
  where state = 'pending';
create index if not exists ix_area_job_target on area_jobs (target_id, job_type);
create index if not exists ix_area_job_state  on area_jobs (state);

-- ── 7. Eventi di revisione — sola aggiunta ───────────────────────────────────
create table if not exists area_review_events (
  id            bigserial primary key,
  area_key      text not null,                             -- COM'ERA all'epoca: non si ricalcola
  subject       text not null check (subject in ('fact','narrative','source','profile')),
  subject_id    text not null,
  action        text not null check (action in
                  ('generate','validate','approve','reject','publish','unpublish',
                   'manual-edit','source-expired','location-changed')),
  actor         text not null,
  at            timestamptz not null default now(),
  reason        text,
  before_hash   text,
  after_hash    text,
  schema_version integer not null,
  -- Una decisione senza motivo non è auditabile. Vincolo in database perché è esattamente il
  -- campo che si smette di compilare quando si va di fretta.
  constraint ck_event_reason check (
    action not in ('publish','unpublish','reject') or btrim(coalesce(reason,'')) <> '')
);
create index if not exists ix_area_event_subject on area_review_events (subject, subject_id, at desc);
create index if not exists ix_area_event_area    on area_review_events (area_key, at desc);
create index if not exists ix_area_event_at      on area_review_events (at desc);

-- Immutabilità reale, non solo dichiarata: il trigger blocca UPDATE e DELETE anche a
-- service_role. Un audit che si può riscrivere non è un audit.
create or replace function area_review_events_immutable() returns trigger
  language plpgsql as
$$ begin
     raise exception 'area_review_events è append-only: % non ammesso', tg_op;
   end $$;
drop trigger if exists tr_area_events_immutable on area_review_events;
create trigger tr_area_events_immutable
  before update or delete on area_review_events
  for each row execute function area_review_events_immutable();

-- ── 8. Esecuzioni dell'automazione — osservabilità ───────────────────────────
create table if not exists area_automation_runs (
  id                 uuid primary key default gen_random_uuid(),
  run_id             text not null unique,
  feed_version       text,                                 -- impronta dello snapshot RealSmart
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  discovered_count   integer not null default 0,
  changed_count      integer not null default 0,
  skipped_count      integer not null default 0,
  failed_count       integer not null default 0,
  provider_calls     integer not null default 0,
  ai_tokens          integer not null default 0,
  cost_eur           numeric(10,4) not null default 0,
  duration_ms        integer,
  deployment_version text,
  outcome            text check (outcome in ('ok','partial','failed','budget-exhausted','killed')),
  created_at         timestamptz not null default now()
);
create index if not exists ix_area_run_started on area_automation_runs (started_at desc);

-- ── Vista pubblica: la prova che la pagina si serve senza coordinate ─────────
--
-- Non è una comodità: è un CONFINE. Finché il percorso di lettura pubblico passa da qui, non
-- esiste una query che possa portarsi dietro `private_origin_lat/lng` per distrazione.
create or replace view public_property_area as
  select c.real_smart_code,
         p.area_key,
         p.label            as area_label,
         c.public_origin_type,
         c.public_origin_label,
         c.location_precision,
         c.poi_snapshot,
         c.calculated_at
    from property_area_contexts c
    join area_profiles p on p.id = c.area_profile_id
   where c.status = 'approved'
     and p.status = 'approved';

-- ── RLS: server-only, come 0001 ──────────────────────────────────────────────
alter table area_profiles           enable row level security;
alter table area_sources            enable row level security;
alter table area_facts              enable row level security;
alter table area_narratives         enable row level security;
alter table property_area_contexts  enable row level security;
alter table area_jobs               enable row level security;
alter table area_review_events      enable row level security;
alter table area_automation_runs    enable row level security;
-- Nessuna policy per anon/authenticated ⇒ accesso NEGATO a tutti tranne service_role.
-- La vista pubblica NON è un'eccezione: eredita la RLS delle tabelle sottostanti, e si legge
-- comunque dal server. Il browser non parla mai col database.
-- I ruoli `anon` e `authenticated` esistono su Supabase, non in un Postgres qualunque: senza
-- questa guardia la migrazione fallisce con «role "anon" does not exist» su Neon, su RDS o su
-- un'istanza locale, e il rollback della transazione lascia lo schema a metà del nulla. Dove non
-- esistono la revoca è comunque superflua — nessun permesso è mai stato concesso a un ruolo
-- assente — quindi saltarla non allarga di un millimetro ciò che si può leggere.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public_property_area from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on public_property_area from authenticated';
  end if;
end $$;

commit;
