-- Rollback di 0002_area_schema.sql. NON APPLICATO.
--
-- ⚠️ DISTRUGGE la conoscenza d'area: fonti, fatti approvati, testi, e soprattutto la STORIA di
-- revisione — cioè la prova di chi ha approvato cosa e quando. Quella storia è append-only
-- proprio perché non deve sparire: eseguire questo file è l'unico modo per perderla.
--
-- Prima di eseguire: esportare (`npm run territory:export`) e conservare il bundle in git.
-- Eseguire SOLO con autorizzazione esplicita e nominata.
--
-- L'ordine è quello inverso delle dipendenze. `area_facts` cita `area_sources` con
-- `on delete restrict`: va eliminata prima, altrimenti il drop delle fonti fallisce — ed è
-- esattamente il comportamento voluto in esercizio.

begin;

drop view  if exists public_property_area;

drop trigger  if exists tr_area_events_immutable on area_review_events;
drop function if exists area_review_events_immutable();

drop table if exists area_automation_runs;
drop table if exists area_review_events;
drop table if exists area_jobs;
drop table if exists property_area_contexts;
drop table if exists area_narratives;
drop table if exists area_facts;
drop table if exists area_sources;
drop table if exists area_profiles;

drop function if exists area_key_is_canonical(text);

commit;
