# RealSmart — fixture controllata

`feed-sample.xml` è un feed di prova nella **forma reale** del feed RealSmart dell'agenzia
(`<Dati><immobili><immobile>…`), scritto a mano per esercitare parser, normalizzazione e
regole di integrità senza toccare la rete.

> ⚠️ **Dati inventati.** Nessun immobile, indirizzo, prezzo o cliente reale. Gli URL delle foto
> puntano all'host consentito (`cloud2.realsmart.it`) ma non esistono. Da non pubblicare mai
> come contenuto reale.

La usa `app/lib/realsmart/__tests__/realsmart.test.ts`. Per verificare il feed **vero**:
`npm run check:realsmart` (fuori CI — vedi `docs/realsmart-field-mapping.md` §4).

## Cosa contiene

| `Codice` | Caso coperto |
|---|---|
| `9001` | Caso pieno: descrizione con `<br/>`, spazi doppi, punto incollato e firma commerciale in coda; dotazioni dichiarate (Ascensore Sì, Giardino **No**, Box Sì + PostoAuto No); `ACE` con classe valida; tre foto; `Evidenza` Sì. |
| `9002` | Campi mancanti: nessuna dotazione dichiarata, niente `ACE`, niente foto, niente prezzo, niente piano. Deve produrre "informazione non disponibile" e "—", **non** una raffica di "No". |
| `9003` | `TrattativaRiservata` Sì → resta disponibile ma distinguibile (badge "In trattativa"). `ACE` contiene uno **stato** ("In fase di rilascio"), non una classe. Piano "T". |
| `9004` | Venduto dichiarato nel titolo (come fa l'agenzia): fuori da ogni vetrina, con badge "Venduto". |
| `9005` | Dati ostili e incoerenti: contratto in maiuscolo, locali non numerici ("due"), camere negative, prezzo "1.250 €/mese", superficie "80 mq", piano "s1", HTML e `<script>` nella descrizione, entità e accenti, una foto `http://` e una su host esterno (entrambe scartate), `ACE` = "Mancante". |
| _(senza codice)_ | Entry priva di `Codice` e `Riferimento`: viene scartata senza far cadere le altre. |

## Aggiungere un caso

1. Aggiungi un `<immobile>` con un `Codice` nuovo della serie `90xx`.
2. Aggiungi la riga in questa tabella, dicendo **cosa** esercita.
3. Aggiungi l'asserzione nel file di test: una fixture senza test è solo rumore.
