# ADR-006 — Territory V2: base di conoscenza verificata dei fatti d'area

- **Status:** Accettato (Prompt 9) · fatti di produzione **vuoti** finché non c'è ricerca autorizzata
- **Data:** 2026-08-14

## Decisione

Una base di conoscenza di **fatti d'area** (comune/zona) **separata** dai fatti dell'immobile e dalle
distanze POI, a schema/storage/UI/assistente. Ogni fatto è **fattuale**, **tracciabile a una fonte
primaria corrente**, **parafrasato** (niente citazioni), con **data di revisione** e **stato di
approvazione**. Il linguaggio soggettivo è **bloccato** da un guard deterministico. La ricerca
avviene in **job editoriali controllati**, mai in chat o al render. `app/lib/territory/area/`.

## Schema della conoscenza (`area/types.ts`)

```
AreaFact {
  id, municipality, zone?, category, scope,
  text,                         // parafrasi CANONICA in italiano (quote-free)
  translations[] { locale, text, approved },   // draft finché non approvate
  source { url, owner, retrievedAt },           // fonte PRIMARIA obbligatoria
  reviewBy,                     // data di revisione/scadenza
  status: draft|approved|rejected, approvedBy?, approvedAt?,
  conflicts[] { source, note }, // fonti in conflitto: bloccano finché non risolte
}
```
Categorie ammesse (fattuali): `transport, regional-connection, municipal-service, healthcare,
school, park-facility, market-event`. **Vietate** (guard): sicurezza, prestigio, "migliore",
demografia/classi protette, garanzie d'investimento, previsioni di prezzo, idoneità a un gruppo.

## Regole di pubblicazione (`area/public.ts`)

Un fatto è **pubblicabile** solo se: `approved` **e** non scaduto (`reviewBy` futuro) **e** senza
conflitti non risolti **e** fattuale (guard come rete finale). Localizzazione: traduzione **approvata**
per la lingua, altrimenti la canonica italiana (mai una traduzione non approvata). Se nulla è
pubblicabile → `null`: l'assistente lo dice e **non inventa**. Promemoria di revisione:
`factsDueForReview`.

## Politica delle fonti

- **primarie e autoritative:** siti comunali, Regione Lombardia, operatori di trasporto ufficiali
  (Trenord…), direttori ufficiali scuole/sanità, OpenStreetMap per i POI geografici;
- ogni fatto porta **URL + proprietario + data di recupero**; niente fatto senza fonte;
- **conflitti** fra fonti: registrati, mai risolti in automatico → decisione editoriale (mai la
  versione più promozionale per default);
- **parafrasi** obbligatoria: nessuna citazione letterale (copyright); il testo è una sintesi neutra.

## Template editoriale (per ricercatori) — `AREA_FACT_TEMPLATE`

```jsonc
{
  "id": "tradate-stazione-01",
  "municipality": "tradate",
  "zone": null,
  "category": "transport",
  "scope": "municipality",
  "text": "La stazione di Tradate è servita dalla linea ferroviaria S…",  // neutro, senza virgolette
  "translations": [],
  "source": { "url": "https://…", "owner": "Comune di Tradate", "retrievedAt": "2026-08-14T00:00:00.000Z" },
  "reviewBy": "2027-02-14T00:00:00.000Z",
  "status": "draft",
  "conflicts": []
}
```
Import/export: `parseAreaFactsBundle` valida forma + segnala i **blocker** (soggettivo/conflitti)
senza scartare in silenzio; `serializeAreaFacts` produce un bundle deterministico riesaminabile in git.

## Piano pilota (4 comuni: Tradate, Venegono Superiore, Venegono Inferiore, Lonate Ceppino)

1. **Autorizzazione** del cliente a fare ricerca e budget editoriale (nessun fatto senza questo).
2. Per ogni comune, un ricercatore compila il template per categoria, partendo dalle fonti primarie:
   trasporti (stazione, linee), collegamenti regionali, servizi comunali (anagrafe, biblioteca),
   sanità (strutture ASST/farmacie di riferimento come fatti), scuole (istituti come istituzioni,
   senza classifiche), parchi/strutture, mercati/eventi ufficiali ricorrenti.
3. **Revisione umana**: guard soggettivo verde, fonte corrente, parafrasi neutra → `approved`.
4. Import nel bundle (`filesystem`), commit; l'assistente legge `getPublicAreaProfile`.
5. **Manutenzione**: `factsDueForReview` genera i promemoria; un fatto scaduto sparisce finché non è
   ri-verificato. Traduzioni: canonico italiano subito; en/fr/de/es restano draft finché riviste.

**NON popolare fatti di produzione senza autorizzazione esplicita alla ricerca e approvazione umana.**

## Acceptance coperta

- l'assistente può rispondere "com'è vivere a Tradate?" da fatti d'area approvati, senza inventare
  fatti dell'immobile (separazione a schema/storage/proiezione);
- ogni affermazione pubblicata è tracciabile a una fonte corrente;
- i prompt sensibili/soggettivi sono rifiutati o riformulati (guard) — nessun fatto soggettivo esce;
- i fatti stale spariscono (reviewBy) e restano solo i verificati.
