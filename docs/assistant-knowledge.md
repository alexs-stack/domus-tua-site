# Knowledge base dell'assistente — come si aggiunge e si approva un contenuto

L'assistente può usare nelle risposte **solo** i contenuti marcati `verified`. Su tutto il
resto dice onestamente che non lo sa e propone il contatto col team.

Questo documento spiega come far passare un contenuto da "non lo sa" a "lo sa".

File: [`app/lib/assistant/knowledge/entries.ts`](../app/lib/assistant/knowledge/entries.ts)

---

## Da dove viene la conoscenza (2026-08-06)

Nessuna di queste sorgenti è "un testo scritto da noi".

| Sorgente | Cosa copre | Come arriva nel corpus |
| --- | --- | --- |
| **Copy pubblicato** | Metodo, Domus D.O.C., Open Domus, vendita, acquisto, valutazione, visite, proposte, servizi, privacy | Voci `verified` che riassumono la pagina, con il file della pagina come `source` |
| **FAQ del sito** | Le domande di `/domande-frequenti` | `fromFaq()` legge domanda e risposta da [`app/domande-frequenti/faq.ts`](../app/domande-frequenti/faq.ts) — **non le ricopia** |
| **FAQ candidature** | Le domande di `/lavora-con-noi` | `fromCareersFaq()`, stesso principio, da [`app/lavora-con-noi/faq.ts`](../app/lavora-con-noi/faq.ts) |
| **Dati strutturati** | Il team di `/chi-siamo` | La voce `team-agenzia` compone nomi e ruoli da [`app/lib/team.ts`](../app/lib/team.ts), la fonte unica della pagina |
| **Feed RealSmart** | Gli immobili | Non passa da qui: tool `search_listings` / `get_listing_details`, live |

Nessuna riga di questa tabella è una copia. Ogni sorgente resta padrona del proprio testo, e
l'assistente lo legge: una correzione fatta sulla pagina lo raggiunge nello stesso deploy.
Due test lo tengono onesto — uno confronta parola per parola le voci `faq-*` con le pagine,
l'altro fallisce se una FAQ pubblicata **non** è arrivata nel corpus.

Il criterio che ha sbloccato le voci ferme da mesi è uno solo, e vale la pena scriverlo:
**una frase che l'agenzia ha già pubblicato sul proprio sito è approvata dal fatto di essere
pubblicata.** Se è buona per un visitatore, è buona per l'assistente. Quello che resta
`pending` non è "in attesa di approvazione": è roba che sul sito **non c'è**.

È lo stesso principio per cui gli immobili non stanno in `entries.ts`: due copie della stessa
verità divergono sempre, e la copia vecchia è sempre quella che risponde all'utente.

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
| `verified` | Testo pubblicato o approvato, con fonte controllabile | **Sì** |
| `pending` | Serve, ma un testo da cui prenderlo non esiste ancora | No |
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

### Tieni il `content` corto — sotto le ~450 battute

Le prime voci prese dalle pagine erano lunghe 600-700 battute, due o tre volte le
preesistenti. Il retrieval ne restituisce fino a tre: il modello si trovava davanti ~2.000
battute di fonti e le parafrasava tutte, producendo risposte complete e prolisse dove ne
bastavano tre frasi.

Più conoscenza deve produrre risposte più **giuste**, non più lunghe. Se una voce non sta in
450 battute, quasi sempre sono due voci.

Accorciarle ha riportato la scelta dello strumento al 100% in `npm run eval` (era 96-97%).

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

## Aggiungere una FAQ già pubblicata sul sito

Se la domanda esiste già su `/domande-frequenti`, **non riscriverla**: promuovila.

```ts
fromFaq("costi", "vendita", ["quanto costa", "provvigione", "spese agenzia"]),
```

Tre argomenti: l'ID della FAQ (tipizzato, quindi un refuso non compila), la categoria di
conoscenza, e le keyword. Domanda e risposta le legge dalla pagina. Le keyword restano a
mano perché sono l'unica cosa che la pagina non ha: i modi in cui la stessa domanda si fa
a voce, che nella FAQ scritta non compaiono.

Per le domande di `/lavora-con-noi` vale lo stesso, con `fromCareersFaq(id, keywords)`: la
categoria è sempre `faq`, quindi l'argomento in meno.

Due test proteggono il meccanismo: uno confronta il testo di ogni voce `faq-*` con quello
della pagina (se qualcuno incollasse le risposte dentro `entries.ts`, diventa rosso), l'altro
fallisce se una FAQ pubblicata sul sito non è stata promossa — così aggiungere una domanda
alla pagina e scordarsi dell'assistente non passa in silenzio.

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

**Semantico** — **spento** (2026-08-06), e non per mancanza di chiavi: per una misura.
Copre in teoria le riformulazioni che il lessicale non prende. Se manca, o fallisce, o va in
timeout, sparisce senza conseguenze.

> ⚠️ **`ASSISTANT_SEMANTIC_FLOOR` non ha più un default.** Non impostata = livello semantico
> spento. È il risultato di `npm run calibrate:semantic` su `gemini-embedding-001`:
>
> | | soglia assoluta | quanto svetta (z) |
> | --- | --- | --- |
> | domanda pertinente più debole | 0,550 | −0,475 |
> | domanda fuori corpus più vicina | **0,667** | **3,159** |
>
> I due gruppi **si sovrappongono**, e non di poco: la domanda fuori corpus messa peggio sta
> comunque sopra la pertinente messa meglio. Nessuna soglia li separa.
>
> Sono state provate due strategie diverse, non una:
>
> 1. **Soglia assoluta** ("quanto somiglia?") — *"Che voto avete su Google?"* raggiunge 0,625
>    contro `valutazione-immobile`. Col vecchio default di 0,6 sarebbe passata, aggirando per
>    caso `reputazione-recensioni`, che è disabilitata **apposta**. Stessa sorte per *"Che
>    tempo farà domani?"* (0,600).
> 2. **Soglia relativa** ("somiglia a UNA voce più che alle altre?", z-score) — va **peggio**:
>    una domanda fuori corpus arriva a z=3,159, mentre una pertinente scende a z=−0,475, cioè
>    sotto la media del corpus per la voce che dovrebbe agganciare.
>
> Controprove fatte: 512, 1536 e 3072 dimensioni (non è il troncamento dei vettori); ed è
> stato corretto un errore nel set di prova, dove tre domande su mutui e tasse erano
> etichettate come rumore mentre `limiti-assistente` le copre legittimamente — la conclusione
> non cambia.
>
> Accendere il semantico oggi peggiorerebbe l'assistente. Per riaccenderlo servono un altro
> modello di embeddings e una nuova misura, non un numero scelto a mano.

Il ranking semantico della **ricerca immobili** invece è acceso, e la misura qui sopra non lo
riguarda: là i vettori ORDINANO candidati già filtrati, non decidono se qualcosa è pertinente.
Senza una soglia da superare, la sovrapposizione non fa danni. Vedi [ai-search.md](ai-search.md).

### E le riformulazioni? Le ha prese il lessicale

Il livello semantico esisteva per un motivo preciso: le domande poste con parole diverse da
quelle del corpus. Spegnendolo, quel motivo restava — così l'abbiamo misurato sugli stessi
casi, con il solo lessicale:

| | riformulazioni risolte (su 13) | fonte sbagliata | nessuna fonte |
| --- | --- | --- | --- |
| lessicale, prima | 3 | 6 | 4 |
| **lessicale, dopo** | **10** | 3 | **0** |
| semantico (misurato) | 2 prime scelte su 10 | — | — |

In mezzo non c'è un algoritmo nuovo: ci sono **le parole vere**. `IMU` e `detrarre` sui limiti
fiscali, `curiosi` su Open Domus, `burocrazia` sulle pratiche, `carte in regola` su Domus
D.O.C., `fare da solo` sulla vendita. Nessuna di queste compariva nel corpus, perché sono il
modo in cui la gente chiede — non il modo in cui l'agenzia scrive.

Le sei "fonti sbagliate" iniziali erano la parte peggiore, più delle quattro risposte vuote:
*"Quanto pagherò di IMU su questa casa?"* riceveva `faq-costi`, cioè la provvigione
dell'agenzia. Una fonte plausibile e fuori tema è esattamente ciò che fa rispondere
l'assistente **a fianco** della domanda, con la sicurezza di chi una fonte ce l'ha.

La lezione, per il prossimo che avrà la tentazione di aggiungere un modello: su un corpus di
poche decine di voci in una lingua sola, mezz'ora passata a scrivere le keyword giuste ha reso
più di un livello di embeddings — ed è deterministica, gratuita e senza rete. Coperto da un
test, con soglia 9/13: le tre che restano ricevono una fonte diversa da quella attesa ma non
sbagliata, e inseguire il punteggio pieno su tredici frasi scritte a mano vorrebbe dire tarare
il corpus sul test invece che sugli utenti.

Nessun database vettoriale: il corpus è di decine di voci e i vettori stanno in una Map in
cache. Introdurne uno ora sarebbe infrastruttura senza beneficio.

### Tarare la soglia

```bash
npm run calibrate:semantic
```

Richiede un provider di embeddings — `VOYAGE_API_KEY`, oppure `GEMINI_API_KEY` con
`AI_PROVIDER=google`; senza, esce subito dicendolo. Misura due distribuzioni sui casi di
[`__evals__/semanticCases.ts`](../app/lib/assistant/__evals__/semanticCases.ts): quanto
somigliano al corpus le domande che **devono** agganciare (riformulazioni che il lessicale non
prende) e quanto ci somigliano quelle che **devono** restare senza risposta. La soglia giusta
sta nella forbice tra le due, appena sopra il rumore — non a metà strada: dei due bordi, quello
che costa un "non lo so" è recuperabile, l'altro no.

Se la forbice non c'è, lo script lo dice: significa che su questo corpus il semantico non separa,
e tenerlo spento è la scelta onesta.

Rilancia dopo ogni allargamento del corpus, la forbice si sposta. E ricorda che i vettori
sono in cache per 24 ore: la chiave include un'impronta del corpus, quindi un deploy che
cambia i testi non riusa i vettori vecchi, ma un `revalidateTag("assistant-knowledge")`
resta il modo per forzare la mano.

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

Il secondo consiglio non è teorico. `limiti-garanzie` ha avuto la keyword `"tempi"` per mesi:
agganciava *"Che tempo farà domani?"*, perché tempo e tempi hanno la stessa radice. Il caso
era stato corretto nel corpus di prova e dimenticato in quello vero — dove nessun test lo
guardava. Se una regola vale, deve valere su entrambi.

---

## Cosa manca oggi (da chiedere a Raffaela)

La lista è corta, perché tutto ciò che il sito pubblica è già dentro. Restano le tre cose che
sul sito **non ci sono** — e nessuna si sblocca scrivendola noi:

| Voce | Serve | Perché non l'abbiamo dedotta |
| --- | --- | --- |
| `trattativa-prezzo` | Cosa si può dire a chi chiede se può offrire meno | `/vendi` e `/acquista` dicono che la trattativa è gestita con trasparenza, non danno una regola sul ribasso. Intanto risponde `proposte-documenti`: la trattativa la segue il team |
| `referente-casi-complessi` | Nome e ruolo di chi segue i casi che l'assistente non copre | `/chi-siamo` pubblica il team ma non assegna il ruolo. Dedurlo sarebbe inventare |
| `privacy-policy` | Il testo dell'informativa, per citarlo invece che rimandarci | La pagina stessa dichiara di essere una traduzione automatica da rivedere con un legale. Intanto `privacy-pagina` dice dove sta e chi è il titolare |

Restano anche due voci `disabled` che dipendono da una decisione, non da un testo: se le
metriche di volume del sito siano documentabili, e da dove leggere il numero di recensioni e
la valutazione media senza scriverli a mano (sono dati vivi: a mano diventano falsi).

E resta aperta la domanda se `info@domustua.com` e `immobiliare@domustua.it` coesistano.
