# Knowledge base dell'assistente — come si aggiunge e si approva un contenuto

L'assistente può usare nelle risposte **solo** i contenuti marcati `verified`. Su tutto il
resto dice onestamente che non lo sa e propone il contatto col team.

Questo documento spiega come far passare un contenuto da "non lo sa" a "lo sa".

File: [`app/lib/assistant/knowledge/entries.ts`](../app/lib/assistant/knowledge/entries.ts)

---

## Le tre condizioni

Un contenuto entra nelle risposte quando ha **tutte e tre**:

1. `status: "verified"`
2. `content` non vuoto
3. `lastVerified` valorizzata (formato `AAAA-MM-GG`)

Il doppio controllo su stato e contenuto è voluto: una voce marcata `verified` per sbaglio ma
ancora senza testo non deve poter arrivare al modello. Un test lo verifica.

## Gli stati

| Stato | Significato | L'assistente lo usa? |
| --- | --- | --- |
| `verified` | Testo approvato, fonte controllabile | **Sì** |
| `pending` | Serve, ma il testo non è ancora stato approvato | No |
| `disabled` | Tolto di proposito, con motivo scritto | No, mai |

`pending` e `disabled` non sono scarti: sono memoria. Ogni voce non verificata **deve** avere
una `note` che spiega cosa manca o perché è stata tolta — altrimenti chi eredita il file non
sa cosa farne. Anche questo è verificato da un test.

---

## Aggiungere una FAQ

```ts
{
  id: "faq-provvigione-acquirente",   // stabile: non cambiarlo mai, i log vi fanno riferimento
  category: "faq",
  title: "Provvigione a carico di chi compra",
  content: "…testo approvato dal cliente, in italiano, breve e diretto…",
  status: "verified",
  source: "email di Raffaela del 12/09/2026",   // deve essere controllabile da un'altra persona
  lastVerified: "2026-09-12",
  locale: "it",
  keywords: ["provvigione", "commissione", "quanto costa", "spese agenzia"],
}
```

### `source` deve essere verificabile

Non "sito ufficiale" ma "sito ufficiale domustua.com/contatti". Non "me l'ha detto Raffaela"
ma "email di Raffaela del 12/09/2026". Fra un anno qualcuno dovrà poter ricontrollare senza
chiedere a chi ha scritto la voce.

### Scrivere buone `keywords`

Sono il segnale più forte del retrieval (pesano il triplo del corpo del testo), quindi vanno
curate. Due regole imparate correggendo falsi positivi reali:

**Evita le parole comuni e ambigue.** `"tempi"` sembrava innocuo su una voce sulle garanzie:
agganciava *"Che tempo farà domani?"*, perché in italiano tempo/tempi hanno la stessa radice.
Scrivi `"tempi di vendita"`.

**Usa le parole dell'utente, non le tue.** Una voce sulla trattativa con keyword
`trattare, sconto, ribasso` non agganciava *"Posso offrire una cifra più bassa?"*, che è come
la gente lo chiede davvero. Aggiungi `offrire`, `cifra più bassa`.

Le keyword di più parole si cercano come frase intera nella domanda: usale per le espressioni
("dove siete", "quanto vale", "cifra più bassa"), non per due parole scollegate.

---

## Cosa NON mettere qui

- **Immobili.** Arrivano live da RealSmart tramite i tool. Duplicarli qui creerebbe due verità
  che divergono, e la copia sarebbe sempre quella vecchia.
- **Numeri che cambiano nel tempo.** Recensioni, valutazione media, transazioni concluse.
  Scritti a mano diventano falsi senza che nessuno se ne accorga. Se servono, vanno letti da
  una fonte aggiornata. Un test impedisce che percentuali o numeri grandi finiscano in un
  contenuto verificato.
- **Metriche non documentate.** Il sito mostra 269.395 mq valutati, 6.433 persone, 1.523
  transazioni, 92% venduti, senza fonte nel codice — a differenza di orari e recensioni, che
  sono annotati. Finché non sono documentate, l'assistente non le ripete (voce
  `metriche-aziendali`, `disabled`).
- **Consulenza legale, fiscale, notarile o tecnica presentata come certa.** Su questi temi
  l'assistente non deve avere una fonte da cui attingere: deve rimandare al professionista.

---

## Come funziona il recupero

Due livelli indipendenti, ciascuno con la propria soglia. Si uniscono; nessuno dei due può
abbassare la soglia dell'altro. Se tacciono entrambi il risultato è vuoto — cioè "non lo so",
che è la risposta giusta.

**Lessicale** — sempre attivo, nessuna chiave, nessuna rete. Match per parola (non per
sottostringa), stemming italiano minimale, stopword per le parole funzionali e le forme
interrogative, e un peso per capacità discriminante: un termine presente in quasi tutte le
voci non porta segnale. Serve perché "Domus" è nel titolo di mezzo corpus.

**Semantico** — solo se `VOYAGE_API_KEY` è configurata. Copre le riformulazioni che il
lessicale non prende. Se manca, o fallisce, o va in timeout, sparisce senza conseguenze.

> ⚠️ La soglia di similarità semantica (`ASSISTANT_SEMANTIC_FLOOR`, default `0.6`) è un valore
> di partenza prudente, **non ancora tarato su dati reali**: serve una chiave Voyage per
> misurarla. Meglio troppo selettivi (costa un "non lo so") che troppo permissivi (costa una
> risposta sbagliata data con sicurezza).

Nessun database vettoriale: il corpus è di decine di voci e i vettori stanno in una Map in
cache. Introdurne uno ora sarebbe infrastruttura senza beneficio.

---

## Dopo ogni modifica

```bash
npm test
```

Due suite coprono la knowledge base:

- `__tests__/knowledge.test.ts` — il corpus **reale**: integrità, stati, copertura delle
  dodici aree, e cosa l'assistente sa e non sa oggi.
- `__tests__/knowledgeRetrieval.test.ts` — il **motore**, su un corpus di prova che ha la forma
  di quello definitivo: 42 domande rappresentative, incluse quelle che devono restare senza
  risposta.

Quando aggiungi una voce verificata, aggiungi anche il suo caso alla prima suite. Quando
correggi un falso positivo, aggiungi la domanda che lo provocava alla seconda.

---

## Cosa manca oggi (da chiedere a Raffaela)

Tutte queste voci esistono già come `pending` in `entries.ts`, con la nota di cosa serve:

| Voce | Serve |
| --- | --- |
| `metodo-domus` | Fasi del Metodo, cosa comprende, cosa si aspetta il cliente |
| `domus-doc` | Definizione ufficiale del protocollo e cosa viene verificato |
| `open-domus` | Come funziona, chi partecipa, come ci si iscrive |
| `processo-vendita` | Dal primo contatto all'incarico, costi e condizioni se comunicabili |
| `processo-acquisto` | Dalla ricerca alla proposta |
| `valutazione-immobile` | Modalità, tempi, se è gratuita e senza impegno |
| `appuntamenti-visite` | Come si prenota una visita |
| `proposte-documenti` | Spiegazione generale della proposta |
| `trattativa-prezzo` | Cosa si può dire su una proposta al ribasso |
| `referente-casi-complessi` | Nome e ruolo di chi segue i casi complessi |
| `faq-generali` | FAQ con risposte approvate (ognuna diventerà una voce con ID proprio) |
| `privacy-policy` | Informativa definitiva, per poterla citare e collegare |

Serve anche una decisione su due punti aperti: se le metriche del sito sono documentabili, e
se `info@domustua.com` e `immobiliare@domustua.it` coesistono.
