# ADR-013 — Territory V2: sicurezza, privacy, legale e ciclo di vita del dato

- **Status:** Accettato (Prompt 16) · decisioni legali marcate **DA LEGALE**, non inventate
- **Data:** 2026-08-14

## Threat model e mitigazioni

| # | Minaccia | Mitigazione | Dove |
|---|---|---|---|
| 1 | **Inferenza dell'indirizzo nascosto** (dedurre la casa dai POI) | Payload pubblico coord-free; distanze in linea d'aria dal **centroide** salvo autorizzazione; ≤2 POI/cat; l'esploratore è schematico (nessuna posizione reale) | `public.ts`, ADR-009 |
| 2 | **Fuga di coordinate** | Schemi pubblici `.strict()` senza campi coord; `toPublicListingTerritory` non proietta `origin`/`coord`; test che falliscono se una coord rientra | `security.test.ts`, `types.ts` |
| 3 | **Accesso editor non autorizzato** | Nessuna UI admin web (ADR-007); review via CLI (accesso = repo+env); scritture editoriali con audit + concorrenza ottimistica; revalidate route con segreto | `review/service.ts`, `api/territory/revalidate` |
| 4 | **Abuso del cron** | `CRON_SECRET` (confronto a tempo costante) + feature flag + **rate limit** + budget stretto di query; store di produzione read-only | `api/cron/territory` |
| 5 | **Poisoning del provider** (nomi ostili/HTML/injection) | `normalizeProviderName` (scarta controlli/HTML/injection); classificazione solo su tag esatto; caps byte/elementi | ADR-008, `provider.ts` |
| 6 | **Prompt injection** (nomi POI/fatti come istruzioni) | Testo del provider = DATO nel prompt dell'assistente; test d'injection | ADR-010, `territoryAssistant.test.ts` |
| 7 | **SSRF / abuso dell'endpoint configurato** | **Allowlist di host** + rifiuto di IP privati/loopback/link-local/metadata; solo HTTPS; wired nel pool Overpass e nel geocoder | `endpointPolicy.ts` |
| 8 | **Esposizione di segreti** | Origini e credenziali service-role **server-only**; `/api/health` solo aggregati; test anti-segreto sulle superfici pubbliche | `security.test.ts`, ADR-011 |

## SSRF — dettaglio (constraint 2)

`checkEndpoint(url)` ammette solo: **HTTPS**, host in `ALLOWED_PROVIDER_HOSTS` (overpass-api.de,
overpass.kumi.systems, maps.mail.ru, nominatim.openstreetmap.org), e **mai** un host privato
(`127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16` metadata cloud, `100.64/10` CGNAT,
`localhost`, `.internal`, `.local`, loopback/ULA IPv6). Il pool Overpass scarta gli endpoint non sicuri
e **lancia** se non ne resta nessuno; il geocoder rifiuta un `baseUrl` non conforme prima della fetch.

## Origini e credenziali server-only (constraint 3)

La coordinata d'origine e l'autorizzazione restano nel record privato (`origin`, `originAuthorization`)
e **non** entrano mai nel payload pubblico né in `/api/health`. Le chiavi service-role (Supabase, ecc.)
sono lette solo server-side; nessun `NEXT_PUBLIC_*` le espone.

## Tabella di RITENZIONE e cancellazione (constraint 4)

| Evento | Azione sul territorio | Origine esatta | Pubblico | Audit |
|---|---|---|---|---|
| Immobile **ritirato/venduto/eliminato** | `withdrawTerritory` → **disabled** | ridotta al **centroide**, autorizzazione **rimossa** | nascosto | `withdraw` |
| **Autorizzazione origine revocata** | `revokeOriginAuthorization` → **stale** | ridotta al centroide, autorizzazione rimossa; ri-derivare dal centro | nascosto finché non ri-derivato+approvato | `revoke-origin` |
| Record **disabled** oltre la ritenzione (default **90 gg**) | `shouldPurgeTerritory` → cancellazione definitiva del record | eliminata | — | l'audit **resta** (immutabile) |
| Immobile **stale** (dato scaduto) | non pubblicato finché non ri-approvato | invariata | nascosto | `fail`/`refresh` |

**Acceptance**: un immobile revocato/ritirato **non usa né espone** più l'origine esatta (precisione
ridotta al centroide + disabilitazione/stale; test).

## Profili comunali storici — proprietà e ritenzione (constraint 5)

I **fatti d'area** (comune/zona: trasporti, servizi…) sono **indipendenti dagli immobili**: restano
utili anche se un immobile sparisce. Decisione: i profili comunali approvati **si conservano**
finché la fonte è corrente (`reviewBy`); non vengono cancellati alla scomparsa di un immobile.
**Proprietà del dato:** il contenuto è parafrasi da fonti primarie (Comune, operatori) con
attribuzione; l'agenzia possiede la curatela/traduzione, non i fatti sottostanti. Ritenzione: fino
alla scadenza di revisione; un fatto scaduto sparisce dal pubblico finché non è ri-verificato.

## Audit (constraint 6)

Azioni tracciate (append-only, senza coordinate/segreti): `authorize-origin`, `revoke-origin`,
`geocode`, `approve`, `reject`, `publish`, `unpublish`, `withdraw`, `refresh`, `fail`, `note`,
`import`. La storia è la prova di ogni autorizzazione/pubblicazione/revoca.

## Rate limiting (constraint 7)

Cron territoriale: `TERRITORY_CRON_LIMIT` (6 / 10 min per IP) oltre al segreto. Revalidate route:
segreto + (per natura) invocazione rara. Endpoint pubblici del sito (lead/search) hanno già i propri
limiti. **In produzione multi-istanza** usare il limiter **condiviso** (`rateLimitShared`) per cron/
admin — il limiter in-memory è best-effort per-istanza.

## Licenze e attribuzione — fonti primarie (constraint 8)

- **OpenStreetMap / Overpass**: dati sotto **ODbL 1.0** (openstreetmap.org/copyright). Attribuzione
  "© OpenStreetMap contributors" visibile in UI e nell'export. Uso come *Produced Work*
  (attribuzione, non share-alike); un futuro export di **dataset** sarebbe *Derived Database* →
  share-alike. Vedi ADR-008. **DA LEGALE:** conferma dell'uso *Produced Work* vs *Derived Database*
  prima di qualunque export pubblico di dataset.
- **Nominatim**: Usage Policy ufficiale (operations.osmfoundation.org/policies/nominatim) → User-Agent
  identificativo, ≤1 req/s, no uso massivo. Disabilitato di default (ADR-005). **DA LEGALE/CLIENTE:**
  autorizzazione all'uso e budget prima di attivarlo.

## Inventario del FLUSSO DATI per Privacy/Cookie Policy (constraint 9)

- **Dati raccolti dai POI (OSM):** nome, categoria, coordinata del POI (server-only), tag di evidenza.
  Nessun dato personale dell'utente del sito.
- **Origine dell'immobile:** coordinata/indirizzo **server-only**, mai pubblicati; usati solo per
  calcolare distanze; ridotti/rimossi al ritiro o alla revoca.
- **Al pubblico esce:** categoria, nome del POI, **distanza in linea d'aria**, base d'origine
  (etichetta, senza coord), attribuzione, data. **Nessuna** coordinata, **nessun** indirizzo.
- **Terze parti contattate a runtime di pagina:** **nessuna** (il dato è pre-approvato nello store;
  i provider si contattano solo nei job editoriali, mai al render).
- **Cookie/tracking introdotti dal territorio:** **nessuno** (nessun tile di mappa, nessuna rete).
- **Log/metriche:** solo aggregati, comune "grosso" e ID troncati; mai coord/PII (ADR-011).

→ **DA CLIENTE/LEGALE:** aggiungere alla Privacy/Cookie Policy la voce "dati territoriali da
OpenStreetMap (ODbL), elaborati server-side, nessun dato personale, nessun cookie".

## Stato del CABLAGGIO (aggiornato dopo il Prompt 18)

- La **ritenzione** è ora eseguibile: `TerritoryRepository.deleteListingEnrichment` esiste in tutti gli
  adattatori scrivibili (il `json` di sola lettura rifiuta) e la CLI `npm run territory:purge` elenca i
  candidati in **dry-run**, cancellando solo con `--confirm`. L'audit non viene mai toccato.
- **Precisione di zona**: il feed dichiara la zona in `localita.zona`; la normalizzazione ora la
  conserva (`NormalizedProperty.zoneName`) e un centroide di zona curato UNA volta copre tutti gli
  annunci di quella zona (±500 m invece di ±2000 m), senza mappa codice→zona da mantenere.
  La zona si usa **solo se il feed la dichiara**: non si rivela nulla che l'agenzia non pubblichi già.
  **Misurato sul feed reale: 125 annunci nei comuni del pilota, 0 con `zona` valorizzata** → oggi il
  meccanismo non si attiva. `npm run territory:zones` rende la cosa misurabile nel tempo.

## Approvazioni NON risolte (constraint acceptance — elencate, non indovinate)

1. **DA LEGALE** — OSM ODbL: conferma *Produced Work* vs *Derived Database* per l'export di dataset.
2. **DA LEGALE/CLIENTE** — attivazione Nominatim (Usage Policy) e budget.
3. **DA CLIENTE** — autorizzazione alla ricerca dei fatti d'area e all'uso dell'origine a livello di
   immobile (coordinata/indirizzo) per singoli annunci.
4. **DA CLIENTE** — testo della Privacy/Cookie Policy con la voce territorio.
5. **DA CLIENTE** — provider di identità/ruoli editoriali per un'eventuale UI admin (ADR-007).
6. **DA OPS** — attivazione dello storage durevole di produzione e del limiter condiviso prima di
   abilitare cron/scritture a runtime.

## Acceptance coperta

- immobili revocati/ritirati non usano né espongono l'origine esatta (lifecycle + test);
- schemi e risposte pubbliche non possono contenere coordinate (`.strict()` + test);
- gli endpoint provider non possono puntare a reti interne (SSRF policy + test);
- scritture admin/cron richiedono autenticazione + rate limit (segreto + limiter);
- le decisioni legali/cliente sono **elencate**, non indovinate.
