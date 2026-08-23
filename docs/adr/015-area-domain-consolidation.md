# ADR-015 — Un solo dominio d'area, e i confini fra i quattro tipi di "fatto"

- **Stato:** Accettata
- **Data:** 2026-08-23
- **Contesto:** audit «Domus Tua — area description + RealSmart automation», Prompt 2 e 3
- **Sostituisce:** il modello parallelo `app/lib/realsmart/ai/areaFacts.ts` (rimosso)

## Il problema

Nel repository esistevano **due** modelli di "fatto d'area", entrambi con una costante
`AREA_FACTS` vuota:

| | `app/lib/territory/area` | `app/lib/realsmart/ai/areaFacts.ts` |
|---|---|---|
| fonte | URL + **proprietario** + data di recupero | solo URL + data |
| ambito geografico | `municipality` / `zone` / `region` | `comune` / `quartiere` / `provincia` |
| approvazione | stato + approvatore + data | solo `approvedBy` |
| conflitti fra fonti | previsti, bloccanti | assenti |
| traduzioni | approvate una per una | assenti |
| scadenza | `reviewBy`, blocca la pubblicazione | assente |
| validazione | schema Zod | funzione ad hoc che ritorna stringhe |

Due modelli vuoti non fanno danno finché restano vuoti. Il danno arriva al **primo fatto
approvato scritto in quello sbagliato**: da lì in poi ci sono due verità sulla stessa area e
nessuna delle due sa dell'altra. Il modello povero, per giunta, non ha i campi che rendono un
fatto pubblicabile con criterio — un fatto scaduto o in conflitto con un'altra fonte ufficiale
sarebbe uscito in pagina senza che nulla lo fermasse.

## Decisione

**Il dominio canonico è `app/lib/territory/area`.** Il secondo modello è stato rimosso, non
deprecato: un file deprecato che ancora compila è un file che qualcuno importerà.

Il dominio contiene ora quattro entità, tenute separate di proposito:

- **`AreaProfile`** — l'anagrafica dell'area: chiave canonica, etichetta, ambito, stato del
  lavoro. Nessun contenuto. `insufficient-evidence` è uno **stato finale legittimo**: è la
  differenza fra «non pubblichiamo perché non sappiamo» e «ci siamo dimenticati di quest'area».
- **`AreaFact`** — l'**evidenza**: una parafrasi neutra in italiano, una fonte primaria con
  proprietario e data di recupero, una scadenza di revisione, uno stato di approvazione, gli
  eventuali conflitti non risolti.
- **`AreaNarrative`** — il **racconto**: il testo generato dai fatti approvati, con la mappa
  affermazione → `factIds`. Nasce sempre `draft`.
- **`AreaReviewEvent`** — la storia, in sola aggiunta.

## Perché evidenza e racconto restano separati

È la decisione che regge tutto il resto.

Un fatto è **verificato una volta** e vale finché la fonte regge. Un testo è **un modo di
raccontarlo**, e cambia per ragioni che con l'evidenza non c'entrano nulla: una regola di stile,
una lingua nuova, un modello diverso. Se stessero nello stesso record, correggere una virgola
richiederebbe di riapprovare la fonte, e viceversa cambiare prompt farebbe ripartire la ricerca.

Da qui le due versioni separate:

- **`AREA_SCHEMA_VERSION`** — cambia la *forma* dei record;
- **`AREA_PROMPT_VERSION`** — cambiano le *regole editoriali*.

Alzare la seconda rigenera i testi **senza toccare i fatti**.

E da qui `factsHash` sulla narrativa: l'impronta dell'insieme di fatti da cui è nata. Quando i
fatti approvati cambiano, l'impronta non combacia più e **si sa che il testo è obsoleto senza
doverlo rigenerare per scoprirlo**. Il contrario — rigenerare per confrontare — è pagare per
scoprire che non serviva.

## I quattro tipi di "fatto", e chi risponde a cosa

Il confine che l'audit chiede di dichiarare. La domanda a cui ciascuno risponde è diversa, e
mescolarli è il modo in cui una scheda finisce per dire di un immobile qualcosa che vale per il
comune (o peggio, il contrario).

| | domanda | dove vive | come si verifica |
|---|---|---|---|
| **Fatto dell'immobile** | «quanti bagni ha *questa* casa?» | `PropertyFact` (`realsmart/facts.ts`) | gerarchia override > campo del gestionale > descrizione |
| **Fatto d'area** | «cosa c'è *in questa zona*?» | `AreaFact` (`territory/area`) | fonte primaria + approvazione umana + scadenza |
| **POI dell'immobile** | «quanto dista *da questa casa*?» | `PublicTerritoryPoi` (`territory/types.ts`) | provider + precisione d'origine dichiarata |
| **Narrativa d'area** | «come si racconta tutto questo?» | `AreaNarrative` | ogni affermazione mappata a `factIds` approvati |

Tre conseguenze pratiche:

1. **Il generatore di copy dell'immobile non scrive di zona.** Il divieto in
   `realsmart/ai/generate.ts` (niente città, servizi, trasporti, distanze) resta com'è. La
   narrativa d'area è un generatore **separato**, che legge solo `AreaFact` approvati.
2. **La narrativa condivisa non contiene distanze.** Le distanze sono per-immobile e dipendono
   dall'origine: metterle in un testo condiviso fra tutti gli immobili dell'area significherebbe
   affermare per una casa una distanza misurata da un'altra.
3. **Il chatbot legge la stessa proiezione pubblica della pagina.** Non fa ricerca dal vivo e non
   produce una sua versione dell'area: `getPublicAreaProfile` è l'unico percorso di lettura, e
   pubblica solo ciò che è approvato, fresco, senza conflitti e fattuale.

## Identità e impronte

Gli id sono **derivati dal contenuto**, non progressivi: `areaFactId` entra in funzione di area,
categoria, ambito, fonte e testo canonico. Due conseguenze volute:

- lo stesso fatto ricavato due volte dalla stessa fonte ottiene lo **stesso** id — il job
  editoriale lo riconosce invece di creare un doppione già approvato altrove;
- lo **stato di approvazione non entra nell'id**: includerlo farebbe cambiare identità al fatto
  proprio nel momento in cui lo si approva.

Il testo entra appiattito (minuscolo, spazi normalizzati): correggere una maiuscola non crea un
fatto nuovo da riapprovare, cambiare **ciò che il fatto afferma** sì.

L'hash è FNV-1a e non `node:crypto`, come già in `territory/fingerprint.ts`: il dominio gira nel
render, nei CLI e nei test, e non deve legarsi al runtime Node. Non è crittografico e non deve
esserlo — serve a riconoscere l'uguaglianza di un contenuto, non a difenderlo da una manomissione.
Due passaggi su domini diversi portano l'impronta a 64 bit: un FNV a 32 bit su qualche migliaio di
fatti darebbe collisioni con probabilità non trascurabile, e qui una collisione significa due
fatti che si scambiano l'identità.

## Chiavi, non etichette

Deciso in ADR-015 insieme al lavoro di Prompt 3 (`territory/area/identity.ts`): un'area si nomina
con una **chiave canonica** a cinque segmenti — `paese|regione|provincia|comune|quartiere` — e si
mostra con un'**etichetta**. I due campi non sono intercambiabili.

Il difetto che questo chiude era già in produzione, silente: `toPublicAreaProfile` filtrava con
`f.municipality === options.municipality`, cioè un'uguaglianza esatta fra due testi liberi, con
il chiamante che passava `"tradate"` e il fatto che conteneva `"Tradate"`. Non poteva combaciare
mai. Non se n'era accorto nessuno solo perché il dataset è ancora vuoto: **il bug aspettava il
primo fatto approvato.**

## Cosa NON è stato deciso qui

- Lo **storage durevole** (Supabase) resta come da ADR-004: gli schemi di questo ADR sono la
  forma dei record, non le tabelle.
- Il **generatore** di narrativa e il **giudice di qualità** non esistono ancora: qui c'è il
  contratto che dovranno rispettare (`AreaNarrative`, `claimMap`, `factsHash`, nessun
  auto-approve), non la loro implementazione.
- Il **registro dei comuni** contiene i quattro comuni del pilota. Provincia e regione sono fatti
  geografici e in questo progetto i fatti entrano con una fonte: ampliarlo è aggiungere una riga
  con la sua provenienza, non riempirlo a memoria.

## Verifica

Test in `app/lib/territory/area/__tests__/consolidation.test.ts`, fra cui tre guardie che
falliscono se la consolidazione viene disfatta: il file rimosso non deve tornare, `AREA_FACTS`
deve avere **una** dichiarazione, e `territory` non deve importare da `realsmart/ai`.
