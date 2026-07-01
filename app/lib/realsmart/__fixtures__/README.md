# RealSmart — fixtures di esempio

Cartella di **payload di esempio** per l'integrazione RealSmart. Serve a sviluppare e testare il
parser (`app/lib/realsmart/parse.ts`) **prima** di avere il feed reale del gestionale.

> ⚠️ **Dati fittizi.** Nessun dato reale di clienti o proprietari. Le immagini riutilizzano la
> libreria asset già presente in `/public/images`. Da NON pubblicare come contenuto reale.

---

## `sample-feed.json`

Payload di esempio nella forma che `parseRealSmartPayload()` sa leggere **oggi**:

```json
{
  "listings": [
    { "codice": "DT-1043", "titolo": "…", "prezzo": 420000, "…": "…" }
  ]
}
```

Il parser accetta due forme:

1. un **envelope** `{ "listings": [ … ] }` (come questo file);
2. un **array diretto** di annunci `[ { … }, { … } ]`.

Qualsiasi altra forma produce un array vuoto — **senza mai lanciare eccezioni**.

### Cosa contiene (3 annunci)

| `codice`  | Tipologia    | Note utili al test |
|-----------|--------------|--------------------|
| `DT-1043` | Attico       | Caso "pieno": prezzo numerico, media con didascalia e ordine, stato `published`. |
| `DT-1088` | Appartamento | Prezzo come **stringa** `"245.000"` e `mq` come stringa: verifica la conversione difensiva a valle. Include un media `planimetria` (escluso dalla gallery foto). |
| `DT-1119` | Appartamento | Stato `reserved`: il sito deriva il badge "Sotto proposta". |

Gli edge case (prezzo stringa, media senza `ordine`, `planimetria` vs `foto`, stati diversi)
sono scelti apposta per esercitare la normalizzazione in `app/lib/realsmart/normalize.ts`.

---

## Lo schema reale è ancora da definire (TBD dal cliente)

Questo file rispecchia i **nostri mock**, non il feed vero di RealSmart. Nomi dei campi, formato
(XML vs JSON), envelope, forma dei media e ciclo di vita degli stati **non sono confermati**.

Quando riceveremo un **esempio reale** dal cliente/RealSmart:

1. salvarlo qui accanto (es. `real-feed-sample.json` o `real-feed-sample.xml`), **ripulito** da
   qualsiasi dato sensibile (indirizzi civici completi, dati catastali, dati dei proprietari);
2. aggiornare `parse.ts` per mappare i **nomi reali** dei campi su `RealSmartListingRaw`
   (e aggiungere uno step di parsing XML → oggetto se il feed è XML);
3. aggiornare questa tabella e le note.

Le domande aperte da porre al cliente/RealSmart sono in
[`docs/realsmart-client-questions.md`](../../../../docs/realsmart-client-questions.md).
Le regole su cosa NON deve mai entrare nel feed pubblico sono in
[`docs/realsmart-security.md`](../../../../docs/realsmart-security.md).
