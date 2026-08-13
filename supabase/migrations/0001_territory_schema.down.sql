-- Rollback di 0001_territory_schema.sql (Prompt 7). NON APPLICATO.
--
-- Elimina le tabelle in ordine inverso di dipendenza. ATTENZIONE: distrugge i dati territoriali
-- (drafts, profili, audit). Esportare prima con `npm run territory:export` (backup riesaminabile in
-- git) e conservare il bundle. Eseguire SOLO con autorizzazione esplicita.

begin;

drop table if exists territory_lease;
drop table if exists territory_audit_event;
drop table if exists territory_refresh_attempt;
drop table if exists territory_listing_poi;
drop table if exists territory_listing;
drop table if exists territory_poi;
drop table if exists territory_profile;

commit;
