# ADR-005 — Territory V2: geocodifica autorizzata e precisione di zona

- **Status:** Accettato (Prompt 8) · geocoder esterno DISABILITATO finché non configurato
- **Data:** 2026-08-14

## Decisione

L'origine di calcolo può salire di precisione oltre il centroide comunale, ma **solo con
un'autorizzazione umana esplicita** e **solo con coordinate plausibili**. La gerarchia (dalla più
fine): `property-coordinate` (coord curata a mano) → `address-geocode` (geocodifica autorizzata) →
`zone-centroid` (curato, pubblico) → `municipality-centroid` (ripiego). Le coordinate restano
**server-only**; al pubblico va solo il livello di precisione + l'etichetta della base.

## Provider policy (geocoder)

- il geocoder è un'**interfaccia separata** dal provider di POI (`TerritoryGeocoder`);
- il geocoder esterno di default è **Nominatim/OpenStreetMap**, ma **disabilitato** finché non si
  imposta un **User-Agent identificativo** e un opt-in esplicito;
- prima di attivarlo si rispettano i termini ufficiali: **max 1 req/s**, User-Agent obbligatorio,
  **caching** dei risultati (fatto: `GeocodeCache` durevole), niente uso di massa, **attribuzione
  ODbL**. **MAI** scraping di pagine mappa per consumatori;
- la geocodifica gira **solo in un job editoriale controllato**, mai in una richiesta utente o nel
  render di pagina; lo stesso indirizzo approvato **non si geocodifica due volte** (cache per chiave
  `comune|indirizzo`).

## Fonti curate (server-only, vuote di default)

`app/lib/territory/territoryOrigin.data.ts` — un umano aggiunge, con traccia (fonte/revisore/data):
`MANUAL_COORDS` (coord curata = massima fiducia), `GEOCODE_AUTHORIZATIONS` (autorizza la geocodifica),
`GEOCODE_CACHE` (coord prodotte dal job), `ZONES` + `ZONE_OF_CODE`. **Vuoto** ⇒ tutti gli immobili
restano a precisione comune/zona.

## Macchina a stati dell'autorizzazione

```
[nessuna autorizzazione] ──(umano aggiunge MANUAL_COORD o GEOCODE_AUTH + fonte/revisore/data)──►
        [autorizzata]
            │  risoluzione:
            │   • coord curata → plausibile? ── sì → PROPERTY-COORDINATE
            │   │                              └ no → SCARTATA → [in revisione] → ripiego zona/comune
            │   • geocode autorizzato + coord in cache → plausibile? ── sì → ADDRESS-GEOCODE
            │                                                          └ no → [in revisione] → ripiego
            └──(umano rimuove la voce = REVOCA)──► [nessuna autorizzazione] → ripiego zona/comune
```

- `showAddress` è **separato**: non concede mai precisione a livello di immobile (due approvazioni
  distinte, entrambe auditabili);
- **revoca = rimuovere la voce**: al refresh successivo l'origine torna a zona/comune, in automatico;
- una coordinata **implausibile** (fuori dai limiti regionali o oltre ~12 km dal centroide comunale)
  non si pubblica mai: va **in revisione** e l'immobile ripiega.

## Modello di minaccia (privacy)

| Minaccia | Mitigazione |
|---|---|
| Coordinata dell'immobile trapelata al browser | schemi pubblici `.strict()` senza campi coord; `originBasis` porta solo precisione+etichetta; test "nessuna coordinata nel pubblico" |
| Inferenza dell'indirizzo nascosto dall'origine | precisione a livello di immobile SOLO con autorizzazione esplicita, mai dedotta da `showAddress`/indirizzo |
| Marker della casa su mappa con indirizzo riservato | senza autorizzazione l'origine è centroide zona/comune; la UI (Prompt 12) non centra mai sull'immobile in modalità riservata |
| Geocodifica su comune omonimo / refuso | validazione di plausibilità (bounds + distanza dal centroide) → revisione, mai pubblicazione |
| Abuso del geocoder esterno (rate-limit/ToS) | 1 req/s, User-Agent, caching durevole, solo job editoriale a basso volume; disabilitato di default |
| Coordinata curata errata da un revisore | traccia (fonte/revisore/data) + plausibilità + audit; reversibile via revoca |
| Autorizzazione dimenticata dopo vendita/ritiro | la revoca è la rimozione della voce; retention/withdrawal in Prompt 16 |

## Acceptance coperta

- immobili non autorizzati non lasciano mai la precisione centroide/zona;
- i geocode approvati sono in cache, validati e auditabili (traccia + plausibilità);
- la revoca toglie l'origine a livello di immobile da pagina, assistente e refresh futuri;
- test su: assenza autorizzazione, approvazione, geocode implausibile, provider assente, revoca,
  coordinate mai pubbliche.
