# Audit finale — assistente Domus Tua

Audit condotto come QA indipendente sul codice e sul comportamento verificabile, **non** su un
ambiente di produzione: senza `ANTHROPIC_API_KEY` non esiste un assistente vivo da provare da
utente reale. Quello che segue distingue con precisione ciò che è stato misurato da ciò che
non lo è.

---

## Difetti trovati e corretti

### P0 — bloccanti

**Sul sito non si poteva scrivere in nessun campo, da tastiera.**
Il preloader registrava un listener globale per saltare l'intro al primo tasto: annullava
Invio, spazio e ogni lettera, e la guardia "intro già finita" stava *dentro* la funzione di
salto, cioè dopo `preventDefault()`. Il listener restava attaccato a `window` per tutta la
vita della pagina.

Verificato su `/case`, a intro conclusa da sei secondi: digitando "tradate" nel campo di
ricerca il valore restava `""`. **Preesistente in produzione** (`git diff main` su
`Preloader.tsx` era vuoto), e indipendente dall'assistente.
→ Guardia prima di `preventDefault()`, listener staccati a fine intro. Regressione in
`e2e/tastiera.spec.ts`.

### P1 — gravi

**Un comune senza immobili disponibili veniva scartato in silenzio.**
Sul feed reale, "casa a Milano" restituiva quattro case dell'area di Tradate senza dire nulla:
Milano è nel catalogo ma tutti i suoi immobili risultano venduti. L'utente non aveva modo di
accorgersi che la risposta non c'entrava con la domanda.
→ Nuovo esito `comune-non-coperto`, con i comuni vicini che hanno davvero immobili. Verificato
sui dati reali: Milano → nessuna alternativa inventata; Gornate-Olona → tre vicini veri.

**Azzerare la conversazione durante una risposta cancellava il saluto.**
Il turno annullato eseguiva la sua pulizia (`slice(0, -1)`) sull'ultimo messaggio, che nel
frattempo era diventato il saluto della conversazione nuova.
→ Token di turno: una richiesta superata non può più scrivere sullo stato. Regressione E2E.

**Il contesto degli immobili nel prompt non aveva tetto.**
Il numero di slug rimandati indietro lo decide il client: una conversazione lunga — o un
client ostile — faceva crescere il prompt di sistema a ogni richiesta, e il costo con lui.
→ `MAX_SHOWN_IN_PROMPT = 8`, tenendo i più recenti (sono quelli a cui si riferiscono gli
ordinali). Regressione unit.

**I comuni col trattino non trovavano coordinate.**
Il feed scrive "Gornate-Olona", la tabella "gornate olona": nessun vicino, in silenzio.
→ Normalizzazione della chiave.

### Comportamento cambiato di proposito

Due test asserivano che un comune fuori catalogo venisse **ignorato**. Era il comportamento
sbagliato: aggiornati con la motivazione scritta accanto, non riscritti in silenzio per far
passare il codice nuovo.

---

## Da portare al cliente

**167 immobili su 193 risultano venduti** (86%), tutti rilevati dal badge bruciato sulla
copertina via OCR, nessuno dal titolo o dallo stato del gestionale. Restano 26 immobili
disponibili in 9 comuni.

Non è un difetto dell'assistente — il sito usa lo stesso criterio e mostra gli stessi 26 — ma
va confermato con l'agenzia: **se l'OCR sovra-rileva, sia il sito sia l'assistente stanno
nascondendo immobili reali**. È l'unica verifica che nessun test può fare al posto di una
persona che conosce il portafoglio.

Restano aperti anche: metriche del sito non documentate (269.395 mq, 6.433 persone, 1.523
transazioni, 92%), la firma **reale** di Raffaela da fornire, i contenuti `pending` della
knowledge base, e `info@domustua.com` vs `immobiliare@domustua.it`.
Dettagli in [`assistant-rollout.md`](assistant-rollout.md).

### Trovati dopo la prima stesura dell'audit

**81 casi di test del parser non giravano da nessuna parte.**
`scripts/test-parser.ts` esisteva già e copre il parser della ricerca in linguaggio naturale,
condiviso con `/api/search`. Non era in `npm test` né in CI: le mie modifiche al parser
(soglia di prezzo per gli affitti, nuove caratteristiche) avrebbero potuto romperlo in
silenzio. Passa 81/81, ma è stato verificato solo perché sono andato a cercarlo.
→ Aggiunto a `npm run check` e alla CI.

**Firma inventata attribuita per nome a una persona reale.**
`Signature.tsx` era un tracciato calligrafico generico con `aria-label="Firma di Raffaela
Rizza"`, mostrato accanto al suo nome nella hero e nei contatti, dove veniva persino animato
come se si stesse firmando. Il codice stesso lo dichiarava un segnaposto.

Il progetto ha già la regola giusta scritta per il logo — *"mai un asset finto spacciato per
l'originale"* — e qui l'aggravante è che riguarda l'identità di qualcuno.
→ Stessa convenzione del logo: `brand.signature` vuota, firma **non mostrata** finché non
arriva quella vera. Verificato in pagina: zero attribuzioni, nessun vuoto lasciato nel layout.

---

## Misure del bundle

| | |
| --- | --- |
| Chunk dell'assistente | **40 KB** non compressi, caricato solo all'apertura del pannello |
| SDK AI nel bundle client | **assente** (server-only) |
| Prompt di sistema nel bundle client | **assente** |
| Segreti nel bundle client | **assenti** |

---

## Punteggi

Non assegno un voto dove non ho una misura. "n/d" significa che manca la prova, non che vada
bene.

| Dimensione | Voto | Su cosa si basa |
| --- | --- | --- |
| **Correttezza dei dati** | 8/10 | Ogni immobile, prezzo e caratteristica viene dal feed live; i campi mancanti sono `null` e non diventano un "no". Manca la prova col modello vivo |
| **Ricerca immobili** | 8/10 | 53 query italiane + 13 di comportamento su fixture, integrazione sul feed reale (193 immobili), allentamento verificato sui dati. Il ranking semantico non è mai stato tarato |
| **Conversazione** | n/d | Il contesto multi-turno è cablato e testato con modello finto. Come risponda davvero un modello vero **non è stato misurato** |
| **Conversione** | n/d | I canali funzionano; se convincano è una domanda a cui rispondono gli utenti, non i test |
| **Sicurezza** | 7/10 | Difese strutturali verificate (schema chiuso, no SSRF, no HTML, no segreti nel bundle). Resistenza del modello all'injection **non verificata**: serve un modello vivo |
| **Privacy** | 9/10 | Nessuna persistenza, nessun `localStorage`, log senza dati personali, consenso obbligatorio — tutto verificato da test sui sorgenti. Manca l'informativa definitiva del cliente |
| **Accessibilità** | 7/10 | Dialog, focus trap, ritorno del focus (corretto anche su Safari), aria-live, 44px, reduced-motion, tastiera su Chrome e WebKit. Nessuna prova con screen reader reale |
| **Prestazioni** | n/d | I tool rispondono in 0-2 ms sul feed reale e nessun bundle AI raggiunge il browser. **La latenza che conta — il primo token dal modello — non è mai stata misurata** |
| **Affidabilità** | 8/10 | Fallback su provider giù, feed giù, output vuoto, tool inesistente, input non valido, timeout, offline: tutti coperti. Rate limit condiviso presente ma **mai eseguito contro un Redis vero** |

**Nessun 10.** Tre dimensioni su nove non hanno una misura, e le altre poggiano su test con
modello simulato. Un 10/10 qui sarebbe un numero inventato — esattamente la cosa che questo
assistente è costruito per non fare.

---

## Stato

```
270 unit test · 81 parser · 46 E2E (Chrome + iPhone Safari) · 6 integrazione opt-in
npm run check: verde
```

Per chiudere l'audit davvero servono, nell'ordine: `ANTHROPIC_API_KEY` su una preview,
`npm run eval` contro il modello reale, e una mezz'ora di conversazioni vere fatte da una
persona.
