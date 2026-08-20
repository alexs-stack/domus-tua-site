# ADR-014 — Territory V2: pilota di acquisizione dati e approvazione editoriale

- **Status:** Accettato (Prompt 17) · pilota eseguito in **fixture**; run live-osm e approvazioni **in sospeso**
- **Data:** 2026-08-14

## Contesto

Serve un pilota **controllato** per i comuni abilitati, **senza pubblicare automaticamente** e senza
attivare flag di produzione. Il pilota genera i draft e i pacchetti di review, misura l'uso del
provider e lascia **all'umano** ogni approvazione.

## Comuni del pilota (constraint 1)

Confermati dalla configurazione (`PILOT_MUNICIPALITIES`, override `TERRITORY_PILOT_TOWNS`):
**tradate, venegono-superiore, venegono-inferiore, lonate-ceppino**. I centroidi comunali esistono in
`COMUNI_COORDS`, quindi l'origine si risolve a livello **municipality-centroid** (nessuna origine a
livello di immobile: constraint 6 — non esistono record di autorizzazione).

## Esecuzione (constraint 2, 7)

`npm run territory:pilot` — due modalità:

- **fixture** (default, eseguita): provider e immobili **sintetici**, **nessuna rete**. Dimostra il
  flusso end-to-end e produce artefatti reali e ispezionabili. I POI **non** sono reali.
- **live-osm**: chiamate reali a Overpass — richiede `TERRITORY_PLACES_PROVIDER=osm` **e**
  `--i-am-authorized` (autorizzazione del cliente). **Non eseguita** in questo ambiente.

**Riuso del profilo dimostrato** (constraint acceptance): **12 immobili** in 4 comuni → **4 chiamate
al provider** (una per origine/comune) = **3 immobili per query**. Fallimenti: 0.

## Artefatti prodotti (constraint 4) — `docs/pilot/`

- `pilot-report.md` / `.json` — report del pilota (uso provider, per-comune, decisioni in sospeso).
- `review-<comune>.md` / `.json` — pacchetto di review PII-safe per ciascun comune: base d'origine e
  accuratezza, POI per categoria con link fonte, diff (cosa è cambiato), storia di audit e le
  **istruzioni ESATTE** per approvare via CLI. Nessuna coordinata (non richieste `includeCoordinates`).

Ogni comune ha quindi un **pacchetto di provenienza completo e riesaminabile** (constraint acceptance).

## Fatti d'area (constraint 3)

`getPublicAreaProfile` per ciascun comune → **vuoti**: la ricerca dei fatti d'area richiede
l'autorizzazione del cliente (ADR-006/013) e non è stata eseguita. Stato riportato come
`empty-pending-research` — **mai inventati**.

## Cosa NON è stato fatto (constraint 5, 6, 9)

- **Nessun draft approvato** — l'approvazione è un'azione umana esplicita via `territory:review`.
- **Nessuna origine a livello di immobile** usata (nessun record di autorizzazione esiste).
- **Nessun flag di produzione attivato**, nessuna pubblicazione, nessuna scrittura sullo store di
  produzione (il pilota fixture usa uno store in memoria).

## Import approvato: auditabile e reversibile (constraint 8, acceptance)

Dopo l'approvazione umana, il flusso di import esiste ed è **auditabile e reversibile**:

- **Import**: `territory:import` (ADR-004) porta le decisioni approvate nello **store configurato**;
  ogni scrittura del servizio di review registra un evento di **audit** immutabile.
- **Verifica proiezione**: `toPublicListingTerritory` è deterministica e coord-free (test); un
  `territory:report`/`ops-report` conferma copertura e freschezza.
- **Reversibilità**: `territory:review -- unpublish` (disable) e il **backup/restore** (`territory:export`/
  `import`, ADR-004) permettono di annullare; l'audit resta come traccia.

## Uso del provider (constraint 7)

| Metrica | Valore (fixture) |
|---|---|
| Chiamate al provider | 4 |
| Profili aggiornati (origini uniche) | 4 |
| Immobili per query (riuso) | 3 |
| Fallimenti | 0 |
| Cache hit | 0 (primo run) |

## Decisioni umane ancora in sospeso (constraint acceptance)

1. **Approvare/rifiutare** i draft POI per ogni comune (`territory:review`) — nessuno è auto-approvato.
2. **Autorizzare la ricerca dei fatti d'area** (fonti primarie) — oggi vuoti.
3. **Autorizzare** (se voluto) l'uso dell'origine a livello di immobile per singoli annunci.
4. **Eseguire il run live-osm** (con autorizzazione) per acquisire POI reali sotto ODbL.
5. **Attivare storage durevole e flag di produzione** SOLO alla verifica finale (Prompt 18).

## Acceptance coperta

- ogni comune del pilota ha un pacchetto di provenienza completo e riesaminabile;
- nessun dato draft compare in pubblico o nell'output dell'assistente (flag off, nulla approvato);
- il riuso del profilo dimostra **una query per origine** (3 immobili/query);
- l'import approvato è **auditabile e reversibile** (audit + backup/unpublish).
