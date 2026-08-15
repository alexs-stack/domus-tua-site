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

## Aggiornamenti dopo il Prompt 18 (due difetti trovati sul codice reale)

**1. Lo SCOPE di zona non veniva applicato.** `AreaFact` ha `scope: municipality | zone | region` e
un campo `zone`, ma la proiezione pubblica filtrava SOLO per comune: un fatto di frazione (es. il
mercato di Abbiate Guazzone) sarebbe comparso su OGNI annuncio del comune, anche in un'altra
frazione — attribuire a un immobile i fatti di un altro quartiere. Ora:

- i fatti `scope: "zone"` compaiono **solo** se si chiede quella zona; senza zona sono **esclusi**
  (non valgono per tutto il comune);
- i fatti di zona vengono **prima** di quelli comunali: più specifici, più rilevanti per l'immobile;
- la zona entra nella CHIAVE di cache, così due frazioni non condividono la stessa voce.

**2. La lingua: niente italiano dentro una pagina tradotta.** La regola originale (sopra) faceva
ripiego sulla canonica italiana per le lingue senza traduzione approvata. Su una pagina per il resto
in inglese uscivano paragrafi in italiano: veri, ma con l'aria di un errore. **Decisione aggiornata:**
per le lingue diverse dall'italiano si mostrano SOLO i fatti con traduzione **approvata**; se non ne
resta nessuno la sezione non compare. Resta invariato il divieto di usare traduzioni non approvate.
`localizeFactText` non cambia; il filtro è `hasApprovedText`. Reversibile: è un singolo predicato.

## Il limite dei guard, e cosa ci si mette accanto

**Nessun controllo deterministico sa se un'affermazione è VERA.** Lo si è imparato su questo
repository, non in teoria: era stata scritta — e presentata come esemplare — la frase

> «Dalla stazione di Tradate la linea **S40** di Trenord porta diretti a Milano Cadorna e a **Como
> San Giovanni**.»

Ha superato schema, guard soggettivo e controlli di stile: nessun giudizio, dati concreti, fonte
citata, scritta bene. Era falsa due volte (Tradate non è sulla S40; non esiste un diretto per Como
San Giovanni). Il difetto non era nei guard: `subjective.ts` guarda i giudizi, `quality.ts` il
registro. La verità la può stabilire solo una persona con la fonte davanti.

Quello che il codice PUÒ fare è rendere quel controllo facile invece che teorico: `claims.ts`
scompone il testo nelle singole affermazioni e ne fa una **checklist** — sigle di linea, quantità,
enti — una domanda per riga. Chi legge una frase scorrevole annuisce; chi ha davanti sei caselle ne
controlla sei. Sulla frase sbagliata sarebbero emerse subito «la sigla è la S40?» e «arriva a Como
San Giovanni?».

Un secondo errore, trovato verificando i fatti dimostrativi, ha mostrato il limite della prima
versione: «In centro a Tradate ci sono la biblioteca civica **e** gli uffici dell'anagrafe» — ogni
pezzo vero, il legame falso (sedi in vie diverse). La scomposizione per nomi propri non lo vedeva:
produceva una sola casella. Da qui il tipo **`condivisa`**: riconosce «A e B» con un predicato in
comune e chiede di verificare i due membri **separatamente**. È la forma in cui una mezza verità
passa inosservata, e ora è l'unica che il controllo cerca esplicitamente.

Le sigle di linea e i numeri di servizio sono marcati **volatili**: non basta verificarli una volta,
vanno ricontrollati a ogni revisione perché cambiano con i riassetti di orario. `parseAreaFactsBundle`
restituisce per ogni fatto `verification { checklist, hints, volatile }`, così l'elenco arriva a chi
approva insieme al bundle.

## Acceptance coperta

- l'assistente può rispondere "com'è vivere a Tradate?" da fatti d'area approvati, senza inventare
  fatti dell'immobile (separazione a schema/storage/proiezione);
- ogni affermazione pubblicata è tracciabile a una fonte corrente;
- i prompt sensibili/soggettivi sono rifiutati o riformulati (guard) — nessun fatto soggettivo esce;
- i fatti stale spariscono (reviewBy) e restano solo i verificati.
