# RealSmart — contenuti da correggere alla fonte (gestionale)

Il sito redige e protegge già i contenuti in automatico (redazione privacy deterministica a più
livelli, `app/lib/realsmart/privacy.ts`, con verificatore INDIPENDENTE in
`app/lib/realsmart/privacyVerify.ts`): **nessun indirizzo civico o telefono esce in pubblicazione**
quando l'indirizzo non è autorizzato. Ma alcune cose il sito non può ripararle da solo — vanno
corrette nel gestionale RealSmart. Questo elenco è l'esito dell'audit contenuti
(`npm run audit:listings-content`, artefatto completo in `reports/listings-content-audit.json`).

Ultimo audit di riferimento: **196 annunci → 46 PASS, 149 REVIEW, 1 FAIL**. La redazione più
estesa (layer sull'indirizzo strutturato noto, più toponimi, nomi con articolo) e il verificatore
indipendente portano a **zero fughe** in output; il maggior numero di REVIEW rispetto al passato è
solo miglior RILEVAZIONE degli indirizzi da togliere alla fonte, non più contenuto pubblicato.

## 1. Bloccante (FAIL) — da correggere prima del lancio

| Rif. | Codice | Problema | Azione |
| --- | --- | --- | --- |
| **T447** | **2055** | La descrizione contiene un segnaposto non compilato: «un ampio bagno di oltre **____** mq». | Completare o togliere la frase nel gestionale. Finché resta, l'audit in CI è rosso (di proposito). |

Questo è l'unico FAIL: un segnaposto pubblicato è un buco nel testo che arriva a chi compra
casa, e nessun livello di presentazione può ripararlo.

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
