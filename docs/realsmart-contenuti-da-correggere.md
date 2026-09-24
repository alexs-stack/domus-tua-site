# RealSmart — contenuti da correggere alla fonte (gestionale)

Il sito redige e protegge già i contenuti in automatico (redazione privacy deterministica a più
livelli, `app/lib/realsmart/privacy.ts`, con verificatore INDIPENDENTE in
`app/lib/realsmart/privacyVerify.ts`): **nessun indirizzo civico o telefono esce in pubblicazione**
quando l'indirizzo non è autorizzato. Ma alcune cose il sito non può ripararle da solo — vanno
corrette nel gestionale RealSmart. Questo elenco è l'esito dell'audit contenuti
(`npm run audit:listings-content`, artefatto completo in `reports/listings-content-audit.json`).

Ultimo audit di riferimento: **196 annunci → 46 PASS, 149 REVIEW, 1 FAIL**. Il FAIL (T447) è
stato da allora approvato e non blocca più: vedi sotto. La redazione più
estesa (layer sull'indirizzo strutturato noto, più toponimi, nomi con articolo) e il verificatore
indipendente portano a **zero fughe** in output; il maggior numero di REVIEW rispetto al passato è
solo miglior RILEVAZIONE degli indirizzi da togliere alla fonte, non più contenuto pubblicato.

## 1. Bloccante (FAIL) — da correggere prima del lancio

| Rif. | Codice | Problema | Stato |
| --- | --- | --- | --- |
| **T447** | **2055** | La descrizione contiene un segnaposto non compilato: «un ampio bagno di oltre **____** mq». | **Approvata la pubblicazione senza la misura** (2026-08-23). Resta da completare nel gestionale. |

Un segnaposto pubblicato è un buco nel testo che arriva a chi compra casa, e nessun livello di
presentazione può ripararlo. La pipeline toglie da sé la sola frase-misura incompleta — senza
inventare la misura — e pubblica «un ampio bagno, un disimpegno con arredo e un sottoscala che
funge da comodo ripostiglio»: in pagina un «____» non è mai arrivato.

Quello che mancava era la DECISIONE. Finché non era registrata, l'audit trattava la quarantena
come un difetto ancora da riparare e teneva rossa la CI di ogni PR, difetto o no — col risultato
che il rosso non distingueva più «questa modifica rompe qualcosa» da «T447 è ancora lì», ed è
così che un altro guasto vero (l'E2E dell'assistente) è rimasto rosso per giorni senza che
nessuno se ne accorgesse.

Ora la decisione c'è, in `app/lib/realsmart/overrides.data.ts`:

```ts
{ codice: "2055", segnapostoApprovato: true, motivo: …, fonte: …, data: …, autore: … }
```

L'annuncio **resta nel report** (a REVIEW, non più FAIL), quindi non sparisce dai radar. La
deroga vale per quel `codice` soltanto: qualunque altro annuncio con un segnaposto continua a
far fallire l'audit, e c'è un test che lo verifica. Chi rientra nel gestionale può completare la
misura e togliere anche quella riga.

## 2. Telefoni nella descrizione (4) — rimossi in pubblicazione, da togliere alla fonte

Il numero **non** compare sul sito (viene rimosso), ma non deve stare nella descrizione: il
recapito dell'agenzia ha i suoi spazi (contatti, WhatsApp), non il corpo dell'annuncio.

- A204 (cod. 1952)
- T374 (cod. 2044)
- NT307 (cod. 2063)
- T381 (cod. 2070)

## 3. Indirizzi civici nella descrizione (131) — redatti in pubblicazione

In 131 descrizioni compare un indirizzo civico esatto (via/piazza + numero) mentre l'indirizzo
**non** è autorizzato alla pubblicazione. Il sito **sostituisce automaticamente** l'indirizzo con
il Comune (esempio sintetico: «in via Esempio 10» → «in Lonate Ceppino»), quindi **non c'è alcuna
fuga**: la verifica indipendente `privacy-leak-indirizzo` è a **zero**. Restano due decisioni per
il cliente, annuncio per annuncio (elenco completo dei codici nell'artefatto JSON):

1. **Togliere l'indirizzo dalla descrizione** nel gestionale (consigliato), oppure
2. **Autorizzare la pubblicazione dell'indirizzo** per quello specifico immobile (override
   `mostraIndirizzo`), se il proprietario è d'accordo.

> Domanda per il cliente (vedi anche il foglio-decisioni): con `showAddress=false` va rimosso
> ogni numero civico da descrizione, metadata, chatbot e dati strutturati? La risposta di default
> del sito è **sì** (già applicata).

## Come rileggere l'elenco aggiornato

```bash
npm run audit:listings-content
```

Produce `reports/listings-content-audit.md` (leggibile) e
`reports/listings-content-audit.json` (macchina). Nessuno dei due contiene indirizzi o telefoni
in chiaro: solo il codice dell'annuncio e il tipo di problema. In CI gli stessi report sono
caricati come artefatto del job «Audit contenuti annunci».
