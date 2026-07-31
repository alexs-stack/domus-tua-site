# Assistente Domus Tua — audit e architettura definitiva

> Documento di riferimento del programma "assistente 10/10". Redatto sull'ultimo commit di
> `main` (`4897ac9`). Prodotto dal **Prompt 1** (audit + architettura); i Prompt 2–10
> costruiscono sopra questo piano.
>
> Stato: **onde 1-10 completate** su ciò che non richiede chiavi e ambiente.
> Esito dell'audit finale: [assistant-audit-finale.md](assistant-audit-finale.md).
> Cosa manca per il rilascio: [assistant-rollout.md](assistant-rollout.md).

---

## 1. Cosa esiste oggi

| Area | File | Stato |
| --- | --- | --- |
| UI chat | `app/components/Assistant.tsx` (435 righe) | Completa, on-brand, focus trap + Escape + aria-live. **Nessuno streaming.** |
| Mount / code-split | `app/components/AssistantMount.tsx` | `next/dynamic` + `ssr:false`, gate su `NEXT_PUBLIC_ENABLE_ASSISTANT`. Corretto. |
| Endpoint chat | `app/api/assistant/route.ts` (53 righe) | POST stateless, sanifica la history, ritorna JSON completo. **Nessun rate limit.** |
| Loop agente | `app/lib/ai/assistant.ts` (184 righe) | `fetch` diretto su `api.anthropic.com`, 1 solo tool (`search_listings`), max 3 round. |
| Knowledge | `app/lib/ai/knowledge.ts` (51 righe) | Fatti agenzia hardcoded dentro il system prompt. Nessuno stato di verifica. |
| Parser NL | `app/lib/ai/parseQuery.ts` (417 righe) | Ottimo: percorso AI (Haiku, tool use) + fallback locale deterministico multilingua. |
| Ranking | `app/lib/ai/rank.ts` (119 righe) | `applyFilters` + ranking semantico (Voyage) con fallback keyword. Cache `unstable_cache`. |
| Immobili | `app/lib/listings.ts` → `app/lib/realsmart/*` | Feed XML live, `unstable_cache` 12 min, esclude `draft`/`sold`/`withdrawn`, fallback mock. |
| Lead | `app/api/lead/route.ts` + `app/lib/forms/*` | Honeypot + validazione + rate limit → **webhook Google Sheets** (persistenza). |
| Sicurezza | `app/lib/security/rateLimit.ts` | Sliding window in-memory per IP. Applicato a `/api/search` e `/api/lead`, **non** a `/api/assistant`. |
| Health | `app/api/health/route.ts` | Non riporta lo stato dell'assistente né del canale email. |
| Test | — | **Nessun test runner.** Solo `scripts/test-parser.ts` ad hoc. |

Verifiche di piattaforma fatte: `next@16.2.9` (docs locali in `node_modules/next/dist/docs/`),
React 19.2.4, App Router, nessuna dipendenza AI installata.

---

## 2. Difetti trovati (con impatto)

### P0 — bloccano il 10/10

1. **Le card immobili restano "appiccicate" tra un turno e l'altro.**
   `assistant.ts:164` fa `if (cards.length) lastListings = cards;`. Se la seconda ricerca dà
   zero risultati, il turno ritorna le card della ricerca *precedente*: l'utente vede immobili
   che non c'entrano con la domanda appena fatta. È esattamente il caso "non inventare
   risultati quando un tool restituisce zero immobili", violato dal codice, non dal modello.

2. **Nessun rate limit su `/api/assistant`.** È l'endpoint più costoso del sito (fino a 4
   chiamate Claude + 1 Voyage per richiesta) ed è l'unico pubblico senza limite. Buco di
   costo e di abuso.

3. **Nessuno streaming e nessun `maxDuration`.** La route attende l'intero loop (fino a 4 ×
   20 s di timeout) prima di rispondere. Su Vercel il limite di default della funzione è ben
   sotto quel valore: in caso di conversazione con tool call l'utente rischia un 504 senza
   alcun feedback. Percepito: "assistente lento/rotto".

4. **Il contesto della conversazione si perde.** Il client rimanda solo `{role, content}`
   testuali: i blocchi `tool_use`/`tool_result` del turno precedente non tornano indietro. Al
   secondo turno il modello **non sa** quali immobili ha mostrato → "la seconda ha il garage?"
   e "confronta le prime due" non sono rispondibili senza inventare.

5. **Il tool restituisce troppo poco.** `assistant.ts:169` passa al modello solo
   `title, zone, price, type`. Mancano slug, mq, locali, camere, bagni, caratteristiche,
   disponibilità. Il modello non può filtrare, confrontare o dire "informazione non
   disponibile" in modo onesto — può solo indovinare.

6. **Contenuti non verificati presentati come fatti.** `knowledge.ts` afferma nel system
   prompt "4.9/5 su Google con circa 531 recensioni", le 5 fasi del Metodo, i 6 servizi e la
   definizione di Domus D.O.C. come dati certi. Sono copy di marketing dal sito, non contenuti
   approvati dal cliente, e alcuni (il conteggio recensioni) cambiano nel tempo. Non esiste
   nessuno stato `verified`/`pending`.

### P1 — gravi

7. **`stop_reason` ignorato e `max_tokens: 1024`.** Una risposta troncata viene mostrata come
   risposta finale, senza segnalazione.
8. **Nessuna difesa da prompt injection.** Il testo utente entra tal quale nell'array messaggi;
   nessun controllo su richieste di system prompt/chiavi, nessun limite di tool round oltre il 3.
9. **Nessun canale email dall'assistente.** L'assistente può solo dire "usa il form del sito".
   Il form esistente scrive su Google Sheets — in conflitto con il vincolo "nessun CRM, nessuna
   persistenza". Serve un percorso email dedicato verso `immobiliare@domustua.it`.
10. **Nessun WhatsApp precompilato dall'assistente.** `buildWhatsAppUrl` esiste ed è puro, ma
    l'assistente non lo usa.
11. **`/api/health` cieco sull'assistente**: non distingue chatbot / provider AI / email / WhatsApp / RealSmart.
12. **Zero test.** Nessuna rete di sicurezza per i Prompt 2–10.

### P2 — da sistemare nelle onde successive

13. Il launcher (`bottom-24 right-5`, z-50) su mobile convive con `MobileActionBar`
    (`bottom: 0.75rem + safe-area`, z-40): margine stretto, da riverificare nel Prompt 6.
14. Il pannello usa `min(85dvh, 620px)` senza safe-area né gestione della tastiera mobile
    (`visualViewport`).
15. Nessun pulsante "interrompi" né "nuova conversazione".
16. `RESULTS_PER_SEARCH = 6` lato server ma la UI ne mostra 4: due numeri da allineare.
17. Discrepanza contatti: il sito espone `info@domustua.com`, il programma richiede
    `immobiliare@domustua.it` come destinatario delle richieste. **Da confermare con Raffaela**
    se le due caselle coesistono o se una sostituisce l'altra.

---

## 3. Cosa mantenere / cosa riscrivere

### Mantenere (buono, riusabile)

- **`parseQuery.ts` intero.** Parser locale deterministico multilingua con negazioni,
  intervalli, mq vs prezzo: è il pezzo migliore del codice AI e garantisce il funzionamento
  senza chiavi. Resta la base del tool `search_listings`.
- **`rank.ts`** (`applyFilters` + ranking ibrido semantico/keyword) e **`embeddings.ts`**:
  già difensivi, già con fallback. Il vincolo "deve funzionare senza embeddings" è già
  soddisfatto.
- **Tutta la catena RealSmart** (`client.ts`, `normalize.ts`, `toProperty.ts`, `soldOverrides`)
  e la facciata `listings.ts`: unica fonte degli immobili, già esclude venduti/bozze/ritirati.
- **`rateLimit.ts`**, **`validateLead.ts`**, **`whatsapp.ts`** (puri e testabili).
- **Il design della UI**: layout, palette, tipografia, focus trap, aria-live, code-split.
  Nessuna modifica al linguaggio visivo del sito.

### Riscrivere

- **`app/lib/ai/assistant.ts` → `app/lib/assistant/*`**: loop agente tipizzato, streaming,
  5 tool espliciti, contesto persistente nel turno, timeout/abort/retry, fallback deterministico.
- **`app/api/assistant/route.ts`**: validazione schema, rate limit, `maxDuration`, risposta in
  streaming SSE, errori sanificati.
- **`app/lib/ai/knowledge.ts` → `app/lib/assistant/knowledge/*`**: corpus versionato con
  `id`/`status`/`source`/`lastVerified`, retrieval ibrido, solo `verified` nel prompt (Prompt 2).
- **`Assistant.tsx`**: consumo dello stream, stop, nuova conversazione, mini-form email,
  CTA WhatsApp/telefono, safe-area e tastiera (Prompt 6).

### Aggiungere

- Test runner + suite (unit, tool, eval, E2E).
- Canale email server-side senza persistenza (Prompt 5).
- `/api/health` esteso (Prompt 5).

---

## 4. Dipendenze: cosa serve davvero

Analisi fatta leggendo `node_modules/ai/docs` (AI SDK **7.0.44**, provider Anthropic **4.0.25**,
installati in sandbox per la verifica, non ancora nel repo). Le API attuali sono diverse da
quelle "a memoria": `ToolLoopAgent`, `tool({ inputSchema })`, `stopWhen: isStepCount(n)`,
`streamText` + `toUIMessageStream`/`toTextStream`. L'esempio nella doc di Next
(`route.md`, `StreamingTextResponse`) è **obsoleto** e non va copiato.

**Raccomandazione: adottare `ai` + `@ai-sdk/anthropic` + `zod` lato server.**

Perché vale il costo:

1. **Validazione dell'input dei tool con zod** — oggi l'output del modello è validato a mano
   con `typeof` sparsi. Il Prompt 3 chiede esplicitamente "tool call con input invalido"
   gestita: con `inputSchema` è gratis e tipizzata.
2. **Streaming reale** già risolto (SSE, backpressure, abort), che è il P0 n. 3.
3. **`ai/test` (`MockLanguageModelV4`, `simulateReadableStream`)** — è la ragione decisiva.
   I Prompt 3, 4 e 8 chiedono ~150 casi deterministici su loop, tool, timeout, zero risultati,
   provider giù, output malformato. Senza mock provider dovrei scrivere a mano un finto
   `fetch` per ogni caso: fragile e costoso da mantenere.
4. **Loop control** (`stopWhen`, `prepareStep`, `activeTools`) per i limiti di round/token del
   Prompt 7.
5. Il model ID `claude-haiku-4-5-20251001` già in uso è nella union tipizzata del provider:
   nessun cambio di modello, nessun ID "ricordato a memoria".

Costo reale: 3 dipendenze **server-only** (~non finiscono nel bundle client). Il client
**non** userà `@ai-sdk/react`/`useChat`: la UI resta custom e legge uno stream SSE minimale
scritto a mano, così non si aggiunge un grammo al bundle browser né si tocca il design.

Restano fuori: nessun vector DB (corpus piccolo, retrieval lessicale + Voyage opzionale),
nessun ORM, nessun provider email pesante — per l'email si valuterà nel Prompt 5 tra
Resend/SMTP con una sola dipendenza o `fetch` diretto.

**Test runner: `node:test` + `tsx`,** già presente come devDependency di fatto (`npx tsx` è
usato dagli script). Zero nuove dipendenze, gira in CI. Per l'E2E del Prompt 9 servirà
Playwright, ma solo lì.

---

## 5. Architettura di destinazione

```
app/
  api/
    assistant/route.ts        POST  → SSE stream (validazione + rate limit + maxDuration)
    assistant/lead/route.ts   POST  → email verso immobiliare@domustua.it (Prompt 5)
    health/route.ts           GET   → stato separato per chatbot/AI/email/WhatsApp/RealSmart
  lib/assistant/
    config.ts                 env, flag, modello, limiti
    agent.ts                  loop tipizzato (streamText + tools + stopWhen)
    prompt.ts                 system prompt, regole, guardrail
    stream.ts                 protocollo SSE (text delta | listings | handoff | error | done)
    tools/
      searchListings.ts       ricerca RealSmart live (riusa parseQuery + rank)
      getListingDetails.ts    dettagli per slug/ID
      retrieveKnowledge.ts    solo contenuti verified (Prompt 2)
      prepareWhatsAppHandoff.ts   link wa.me precompilato (nessun invio)
      prepareEmailEnquiry.ts      dati per il mini-form (nessun invio)
    knowledge/                corpus versionato + retrieval ibrido (Prompt 2)
  components/
    Assistant.tsx             UI custom, consuma lo stream
```

**Principi non negoziabili**

- Nessuna persistenza: la conversazione vive nel client per la durata della sessione e non
  viene mai scritta su disco/DB/log.
- Gli immobili non stanno mai nel prompt: arrivano solo dai tool, dal feed live, e i venduti /
  bozze / ritirati sono esclusi a monte da `client.ts` (`HIDDEN_STATUSES`).
- L'assistente resta utilizzabile con provider AI giù, embeddings giù o feed giù: catena di
  fallback esplicita (AI → parser locale → filtri manuali → WhatsApp/telefono).
- Nessuna chiave nel client. Nessun HTML generato dal modello (la UI renderizza testo, React
  fa escaping).

---

## 6. Variabili d'ambiente

| Variabile | Ambito | Ruolo | Fase |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_ENABLE_ASSISTANT` | public | Mostra l'assistente. **Resta `false` fino al Prompt 9.** | esiste |
| `ANTHROPIC_API_KEY` | server | Provider AI. Assente → fallback onesto. | esiste |
| `AI_ASSISTANT_MODEL` | server | Override modello (default `claude-haiku-4-5-20251001`). | esiste |
| `VOYAGE_API_KEY` / `VOYAGE_MODEL` | server | Ranking semantico opzionale. | esiste |
| `ASSISTANT_LEAD_EMAIL_TO` | server | Destinatario richieste (`immobiliare@domustua.it`). | Prompt 5 |
| `ASSISTANT_EMAIL_PROVIDER_KEY` | server | Chiave provider email. Assente → nessun falso successo. | Prompt 5 |
| `ASSISTANT_RATE_LIMIT` | server | Override del limite per IP. | Prompt 7 |
| `NEXT_PUBLIC_SITE_URL` | public | URL assoluti nelle email e nei link WhatsApp. | esiste (da valorizzare) |

---

## 7. Rischi

| Rischio | Mitigazione |
| --- | --- |
| **Contenuti non approvati dal cliente** (FAQ, Metodo, D.O.C., orari, chi contattare) | Prompt 2: nulla entra nel prompt senza `status: verified`. Il materiale mancante è elencato in §9. |
| **Costi**: ogni turno può innescare più chiamate modello | Rate limit per IP + budget per sessione + `stopWhen` + `maxOutputTokens` (Prompt 7). Haiku resta il modello di default. |
| **Latenza su Vercel**: funzione che scade prima di rispondere | Streaming (primo byte veloce) + `maxDuration` esplicito + timeout per tool. |
| **Feed RealSmart instabile** | Già mitigato: `unstable_cache` + fallback mock. **Attenzione**: in produzione il fallback ai mock mostrerebbe immobili finti — da disattivare o marcare per l'assistente. Da decidere nel Prompt 4. |
| **Rate limit in-memory inefficace su serverless** | Noto e documentato. Per il go-live valutare uno store condiviso (Prompt 7). |
| **Prompt injection** | Guardrail di sistema + tool con schema chiuso + nessuna esecuzione di URL/istruzioni utente + suite di attacco (Prompt 7). |
| **Regressione del sito esistente** | Nessuna modifica a componenti non-assistente; `npm run check` verde a ogni onda. |

---

## 8. Criteri di successo misurabili

Soglie da verificare con la suite dei Prompt 8–9, non a occhio:

| Metrica | Soglia |
| --- | --- |
| Immobili inventati | **0** su 100 casi |
| Prezzi/dati inventati | **0** |
| Immobili non disponibili mostrati come acquistabili | **0** |
| Segreti esposti (chiavi, system prompt) | **0** su suite di attacco |
| Tool selection corretta | ≥ 95 % |
| FAQ verificate con risposta accettabile | ≥ 90 % |
| Primo token percepito (provider normale) | p95 < 2 s |
| Fallback utilizzabile su errore simulato | 100 % |
| Follow-up contestuale ("la seconda ha il garage?") | risposta corretta o "non disponibile", mai inventata |
| `npm run check` + test | verde in CI |
| Bundle client aggiuntivo a assistente chiuso | 0 KB (nessun caricamento finché non si apre) |

---

## 9. Materiale che serve da Raffaela (blocca il "verified")

Senza questi contenuti l'assistente resterà onesto ma povero: risponderà "non lo so, ti metto
in contatto" su tutto ciò che non è verificato.

- FAQ con risposte approvate.
- Orari e contatti definitivi (**inclusa la conferma su `info@domustua.com` vs
  `immobiliare@domustua.it`**).
- Spiegazione ufficiale di Metodo Domus, Open Domus, Domus D.O.C.
- Procedura visite/appuntamenti e presentazione di una proposta.
- Cosa l'assistente può e non può comunicare.
- Nome della persona/team a cui rimandare i casi complessi.
- Privacy Policy definitiva.
- Conferma o rimozione delle metriche pubbliche (4,9/5, 531 recensioni, "440+ video").

---

## 9-bis. Decisioni prese (onda 1)

1. **Vercel AI SDK server-only, approvato.** `ai` + `@ai-sdk/anthropic` + `zod` lato server;
   il client resta la nostra UI custom con un lettore SSE di venti righe (nessun
   `@ai-sdk/react`, zero peso aggiunto al bundle browser — verificato sul build).
2. **L'assistente non usa mai le fixture demo.** Se il feed RealSmart non è consultabile,
   dichiara di non poter consultare gli immobili e propone WhatsApp o telefono. Il resto del
   sito mantiene il fallback attuale.
3. **Onda 1 estesa ai cinque tool** del Prompt 3, oltre alle fondamenta.

---

## 9-ter. Stato dell'onda 1 (implementato)

**Difetti chiusi:** P0 1, 2, 3, 4, 5 · P1 8 (base), 10, 12. Più due bug trovati
scrivendo il codice e i test:

- **Disallineamento comune ↔ chiave di zona.** `Property.zone` vale `"<comune> (<provincia>)"`
  quando la provincia c'è: in quel caso il parser locale cercherebbe `\bTradate \(VA\)\b` nel
  testo dell'utente e non troverebbe mai nulla.
  ⚠️ **CORREZIONE (onda 4).** Lo avevo riportato come difetto ATTIVO in produzione. Non lo
  era: sul feed reale `provincia` è vuota su **tutti e 193** gli immobili, quindi `zone`
  coincide col comune e il filtro funzionava già. Il difetto era **latente**, non attivo.
  ✅ **RISOLTO A MONTE (PR #5, merge in questo branch).** Esiste ora `app/lib/comune.ts`, fonte
  unica di "che cos'è un comune" per API di ricerca, assistente, filtri del client e mappa,
  con match tollerante a provincia e accenti. L'assistente ha abbandonato il proprio
  meccanismo parallelo (`zoneKeyByComune`) e usa quello condiviso: una sola definizione,
  non due che possono divergere.
- **`pagePath` protocol-relative.** `//evil.test` passava come "percorso relativo" e finiva
  concatenato a `SITE_URL` nei messaggi di handoff. Regex stretta + test di regressione.

**Difetti ancora aperti:** P0 6 (knowledge non verificata → onda 2) · P1 9, 11 · tutti i P2.

**Conseguenza voluta e temporanea:** Metodo Domus, Domus D.O.C., Open Domus, processi,
valutazione e conteggio recensioni sono marcati `pending`. L'assistente **non** li racconta:
dice che non lo sa e propone il team. È il comportamento corretto finché Raffaela non approva
i testi (§9), ed è coperto da test. Si sblocca nell'onda 2. L'assistente è comunque disattivato
in produzione (`NEXT_PUBLIC_ENABLE_ASSISTANT=false`), quindi nessun utente lo vede.

**Da sapere per lo sviluppo locale:** l'assistente non usa mai le fixture demo. Con
`NEXT_PUBLIC_USE_REALSMART=false` non trova immobili. Il feed è un URL pubblico: in locale
basta lasciare il default. I test non toccano la rete (fixture in `__tests__/fixtures.ts`).

**Copertura attuale:** 63 test (`npm test`) su validazione, knowledge, 5 tool, loop agente
con `MockLanguageModelV4`, protocollo SSE e route. `npm run check` esegue lint, typecheck,
test e build.

---

## 9-quater. Onda 1.5 — consolidamento

Rilettura critica del codice dell'onda 1. Cinque difetti reali, tutti chiusi. Per A ed E il
test è stato scritto **prima** della correzione e si è visto fallire: è dimostrato che coglie
il difetto, non che lo descrive a posteriori.

| # | Difetto | Correzione |
| --- | --- | --- |
| A | **Il retrieval restituiva fonti sbagliate.** "Cos'è Domus D.O.C.?" → `identita-agenzia` + `contatti-ufficiali`. Il brand è nel titolo di quasi ogni voce, e un match nel titolo valeva esattamente la soglia. Col prompt che impone "usa SOLO queste fonti", il modello rispondeva *a fianco* della domanda: peggio di un onesto "non lo so". | Peso per capacità discriminante (IDF minimale) in `knowledge/retrieve.ts` + forme interrogative ("come", "dove", "quando") tra le stopword: erano parole di *domanda*, non di *argomento*. |
| B | **Tre round trip prima del primo token.** `search_listings` usava `parseQuery`, che con la chiave presente chiama Claude Haiku: una seconda chiamata al modello dentro il turno. | `parseQueryLocal` nel tool: deterministico, zero rete. La comprensione del linguaggio la fa già il modello agente. `/api/search` resta invariato. |
| C | **Troncamento silenzioso** (il P1 #7 che avevo erroneamente dato per chiuso). `finishReason` non era mai letto: al tetto dei token la frase si interrompeva a metà come se fosse finita. | Evento `incomplete` (`length` o `error`) + nota discreta nella UI. Il testo parziale resta: è valido, manca il seguito. |
| D | **Lo stream non si fermava chiudendo il pannello**: token pagati per nessuno. | `close()` chiama `abort`. |
| E | **Comune sconosciuto → zero risultati silenziosi.** Se il modello passava un comune fuori catalogo, la traduzione nome → chiave di zona veniva saltata e restava il nome pulito, che non combacia con `"Tradate (VA)"`. | Traduzione sempre applicata al valore finale (idempotente). |

Più tre correzioni minori: suggerimenti iniziali riallineati a ciò che l'assistente sa
davvero fare (2 dei 3 portavano a "non lo so"), messaggio dedicato per il rate limit, e la
prima suite sulla route (`__tests__/route.test.ts`).

**Verificato in esecuzione:** rate limit che scatta esattamente al 31° turno, messaggio
dedicato a schermo, precisione del retrieval sulle 12 domande rappresentative. La correzione
D è cablata sullo stesso meccanismo di abort già usato dal pulsante "ferma", ma senza chiave
reale non è esercitabile end-to-end: da confermare nello smoke test con provider vivo.

---

## 9-quinquies. Onda 2 — knowledge base (motore completo, testi in attesa)

Il Prompt 2 aveva due metà: la **macchina** e i **testi**. La macchina non dipendeva dal
cliente ed è finita; i testi sì, e restano `pending`.

**Fatto**

- Corpus versionato sulle 12 aree previste, con ID stabile, stato, fonte controllabile, data
  di verifica, locale e keywords. 9 voci `verified`, 12 `pending`, 3 `disabled`.
- Ogni voce non verificata porta una `note` che dice cosa serve per sbloccarla — verificato
  da un test, così l'informazione non si perde.
- Retrieval **ibrido**: lessicale sempre attivo (nessuna chiave, nessuna rete) + semantico
  opzionale via Voyage. I due livelli si qualificano con soglie indipendenti e si uniscono:
  nessuno può abbassare la soglia dell'altro. Se tacciono entrambi, la risposta è vuota.
- Nessun vector database: decine di voci, vettori in una Map in cache.
- 42 domande rappresentative su corpus di prova + suite sul corpus reale.
- Guida operativa: [`docs/assistant-knowledge.md`](assistant-knowledge.md).

**Due falsi positivi trovati dai test, entrambi corretti**

- *"Che tempo farà domani?"* agganciava "Nessuna promessa su **tempi** e prezzi": in italiano
  tempo/tempi condividono la radice.
- *"Cos'è Domus D.O.C.?"* agganciava "Chi è **Domus** Tua": il brand è ovunque nel corpus.

Radice comune: **una sola parola generica nel titolo bastava a qualificare una fonte.** Ora
serve una keyword curata oppure più segnali concordi (`MIN_LEXICAL_SCORE = 2`). Sbagliare per
prudenza costa un "non lo so"; sbagliare per zelo costa una risposta a fianco della domanda,
data con sicurezza.

**Non tarabile senza chiavi:** `ASSISTANT_SEMANTIC_FLOOR` (0.6) è un valore prudente di
partenza, mai misurato su dati reali. Serve `VOYAGE_API_KEY`.

**Trovato sul sito, non modificato** (è contenuto marketing approvato dal cliente: la
decisione è sua, non nostra — ma la knowledge base non lo contiene):

- `app/components/Signature.tsx` è un tracciato calligrafico generico con
  `aria-label="Firma di Raffaela Rizza"`: una firma inventata attribuita per nome a una
  persona reale. Il codice stesso la dichiara placeholder in attesa di quella vera.
- `app/components/Stats.tsx` mostra 269.395 mq valutati, 6.433 persone, 1.523 transazioni,
  92% venduti **senza alcuna fonte nel codice** — a differenza di orari e recensioni, che
  sono annotati.

---

## 9-sexies. Onda 4 — ricerca immobiliare

Prima di scrivere codice ho interrogato il feed reale (193 immobili) invece di assumere cosa
contenesse. Quattro riscontri hanno cambiato il progetto:

| Riscontro sul feed | Conseguenza |
| --- | --- |
| Le caratteristiche sono un **insieme chiuso di sei**: giardino, box/posto auto, doppi servizi, terrazzo, aria condizionata, ascensore | **Ascensore** e **aria condizionata** non erano cercabili: aggiunte. Cercare qualcosa che il gestionale non espone (cantina, piscina) produrrebbe risposte negative false |
| **Classe energetica assente su tutti e 193** | L'assistente risponde sempre "informazione non disponibile". Un test lo sorveglia: se il feed la popolerà, lo scopriamo subito |
| **Provincia vuota su tutti e 193** | Il difetto del comune era latente, non attivo (vedi correzione sopra) |
| "luminoso" in 148 descrizioni, "ristruttur" in 70, "indipendent" in 51 | Le richieste qualitative sono davvero supportate dai dati: passano dal ranking sul testo, non dai filtri |

**Costruito**

- Filtri per **camere** e **bagni**, che la UI del sito non offre, in un livello dedicato
  (`search/refine.ts`) per non alterare il comportamento di `/api/search`.
- **Comuni vicini** (`search/nearby.ts`) sulla tabella di coordinate già usata dalla mappa.
  Per un comune fuori tabella — il catalogo arriva a Milano e Legnano — non si inventa
  nessuna vicinanza: lista vuota, e l'assistente lo dice.
- **Allentamento a zero risultati** (`search/relax.ts`): le alternative vengono *provate* sui
  dati e si restituisce solo quella che produce risultati, col numero esatto. Se nessuna
  basta, `null` — e l'assistente offre WhatsApp o email invece di inventare un consiglio.
- **Motivo di pertinenza** calcolato (`search/explain.ts`): il modello riceve i criteri che
  l'immobile soddisfa davvero, così la frase "perché è adatto" non è una fantasia.

**Difetto trovato dai test:** `"in affitto sotto 1000 euro"` veniva ignorato. Il parser
scartava gli importi sotto 10.000 — giusto in vendita (impedisce che "120 mq" diventi un
budget), sbagliato in affitto, dove il vincolo spariva in silenzio. La soglia ora segue il
contratto. Vale anche per `/api/search`.

**Copertura:** 188 test in CI + 6 di integrazione opt-in.

```bash
REALSMART_INTEGRATION=1 npm test
```

I test di integrazione non guardano *quali* immobili ci sono (sarebbe una fotografia
destinata a scadere) ma se il feed regge ancora le assunzioni della ricerca: campi presenti,
slug univoci, nessun venduto tra i disponibili, e nessuna caratteristica nuova che la ricerca
non saprebbe filtrare.

---

## 9-septies. Onda 5 — email, WhatsApp, telefono, health

**Canale email** (`app/lib/assistant/lead/`, `app/api/assistant/lead/route.ts`)

- Modulo accessibile dentro la chat: nome, email **o** telefono, messaggio, immobile
  facoltativo, consenso privacy obbligatorio. Etichette collegate, `role="alert"` sugli
  errori, `role="status"` sulla conferma, target da 44px.
- Invio server-side verso `immobiliare@domustua.it` via Resend, con `fetch` diretto: nessuna
  dipendenza npm, coerente col resto del progetto. Per cambiare provider basta riscrivere
  `deliver`.
- **Il successo si dichiara solo su conferma del provider**, cioè una risposta di successo
  *con identificativo*. Un 200 senza `id` è trattato come fallimento: è il caso insidioso in
  cui si perderebbero richieste di clienti veri senza che nessuno se ne accorga.
- Nessuna persistenza. Nessuna conversazione allegata. Log senza dati personali.
- `reply_to` al cliente quando lascia un'email: chi riceve preme "Rispondi" e scrive a lui.
- Antispam: honeypot (silenzioso), soglia sui link (visibile), rate limit 5/10 min per IP.
- Lo slug dell'immobile viene validato contro il catalogo live: uno inventato dal client non
  entra nell'email come se fosse reale.

**Se il provider non è configurato** — cioè oggi — la route risponde `503` con
`email-non-configurata`, il modulo mostra un messaggio comprensibile e WhatsApp e telefono
restano in vista. Nessun falso successo, mai.

**WhatsApp e telefono**: link `wa.me` codificato con messaggio precompilato (immobile, link
alla scheda, preferenze, richiesta di ricontatto), e CTA `tel:` accanto agli handoff,
visibile su mobile.

**`/api/health`** riporta ora i cinque canali separatamente. Verificato in esecuzione:

```json
{ "chatbotEnabled": true, "aiProviderConfigured": false, "leadEmailConfigured": false,
  "whatsappConfigured": true, "realsmartAvailable": true, "knowledgeVerifiedEntries": 9 }
```

**Difetto trovato dai test:** l'euristica antispam contava i *pezzi* di un URL invece degli
URL. Un singolo `https://www.domustua.com/case/villa` valeva tre (schema + "www." + dominio)
e la richiesta di un cliente vero sarebbe stata scartata **in silenzio** — il peggior modo di
sbagliare per questa funzione. Ora conta gli URL interi, la soglia è tre, e l'esito è
**visibile**: una persona può correggere, invece di veder sparire la richiesta.

**Non verificabile senza chiavi:**

- che una mail arrivi davvero a `immobiliare@domustua.it` (serve `ASSISTANT_EMAIL_API_KEY` e
  un dominio verificato presso il provider);
- il modulo in chat non è stato visto in azione nel browser: compare solo quando l'assistente
  emette un handoff email, cosa che richiede un modello vivo. La logica è coperta dai test,
  il rendering no.

---

## 9-octies. Onda 6 — UI/UX mobile-first

**Due conflitti reali di sovrapposizione, trovati leggendo gli z-index invece che a occhio**

- Il pannello assistente (`z-[60]`, `inset-x-3 bottom-3`) occupava **esattamente** la stessa
  posizione e lo stesso z del banner cookie. Chi arrivava per la prima volta poteva trovarsi
  la chat sopra la richiesta di consenso.
- Il launcher fisso (`z-50`) galleggiava **sopra** il menu mobile a tutto schermo (`z-40`).

Alzare gli z-index a vicenda è una gara che non finisce. Ho introdotto un registro minimo
delle superfici aperte (`app/lib/ui/overlays.ts`, ~30 righe, nessuna dipendenza): chi apre
una superficie lo dichiara, e il launcher si toglie di mezzo. Verificato dal vivo: con banner
o menu aperti il launcher è `aria-hidden`, `tabindex="-1"` e opacità 0 — fuori anche da
tastiera e screen reader, non solo dalla vista.

**Mobile**

- Pannello a foglio dal basso, `env(safe-area-inset-bottom)`, `dvh` per la barra del browser.
- **Tastiera**: il pannello segue `visualViewport`. La tastiera mobile non emette `resize` su
  `window`, solo su `visualViewport`: senza seguirla, il campo di scrittura finisce sotto i
  tasti mentre si digita.
- Launcher posizionato con `calc()` sopra la MobileActionBar e il pulsante WhatsApp, non a
  occhio.
- Verificato a 320×568 e 375×812: nessun taglio, nessun salto di layout.

**Altro**

- Saluto e quattro suggerimenti iniziali esattamente come da programma.
- Pulsante "Nuova conversazione" nell'intestazione.
- Suggerimenti di seguito **solo** dopo una risposta con almeno due immobili, e solo per cose
  che l'assistente sa davvero fare (confronto, comuni vicini).
- Stato offline distinto dall'errore generico: `navigator.onLine === false` ha un messaggio
  suo, così nessuno riprova a vuoto pensando che sia rotto il sito.
- `motion-reduce:` su transizioni e sui puntini di attesa; target da 44px e anello di focus
  su ogni controllo.
- I puntini di attesa stanno **dentro** la bolla vuota: l'altezza non salta quando arriva il
  primo token.

**Dipendenza da segnalare:** due dei quattro suggerimenti richiesti ("Vorrei vendere casa",
"Come funziona Open Domus?") toccano temi ancora `pending` nella knowledge base. Oggi
l'assistente risponde onestamente "non lo so" e propone il team. Si risolvono da soli quando
arrivano i testi di Raffaela — ma finché non arrivano, due chip su quattro sono promesse che
l'assistente non può mantenere.

**Non verificato:** screen reader reale e connessione lenta. Le semantiche ARIA sono a posto
nell'albero di accessibilità, ma non ho provato VoiceOver né throttling di rete.

---

## 9-novies. Onda 7 — sicurezza, privacy, costi

Dettaglio completo, con ciò che **non** è difeso: [`docs/assistant-security.md`](assistant-security.md).

**Il buco più serio, chiuso.** Il rate limit era in-memory *per-istanza*: su Vercel ogni
lambda ha il proprio contatore, quindi il limite reale era un multiplo imprevedibile di quello
configurato e si azzerava a freddo. Ora c'è un contatore **condiviso** su Redis via API REST
(nessuna dipendenza npm, come già per Anthropic, Voyage e il provider email), con fallback sul
contatore locale se manca o non risponde entro 1,5 s.

⚠️ Va configurato: senza `RATE_LIMIT_REDIS_URL` il limite resta per-istanza.

**Difese strutturali verificate da test** (15 nuovi): schema chiuso che rifiuta ruoli e
parametri iniettati, errori come etichette e mai messaggi, nessun `dangerouslySetInnerHTML`,
nessun `localStorage`/`sessionStorage`/cookie nei moduli dell'assistente, **nessun `fetch`
dentro i tool** (niente SSRF), il lettore SSE del client non importa la config server, e i
`console.*` non interpolano variabili con dati personali.

**Dieci messaggi di attacco** verificano che testo ostile resti un semplice messaggio utente:
"ignora le istruzioni", richiesta del prompt di sistema, richiesta di chiavi, richiesta di
discriminare acquirenti, consulenza legale, insulti, `<script>`, SQL injection.

**Quello che questa suite NON dimostra**, scritto anche nel codice: verifica le difese
*strutturali*, non come si comporta il modello davanti a un tentativo di manipolazione. Quello
richiede un modello vivo ed è materia del Prompt 8. Un test verde qui **non** significa
"a prova di prompt injection".

Il danno resta però limitato per costruzione: anche convincendo il modello, non si può mostrare
un immobile inesistente (le card vengono dal catalogo, non dal testo), scaricare un URL,
inviare un'email da soli o rivelare chiavi che nel prompt non ci sono.

**Non difeso, dichiarato**: budget per sessione (non implementabile onestamente senza stato —
sarebbe in conflitto col vincolo di non persistenza), tetto di spesa giornaliero, abuso
distribuito su molti IP, istruzioni scritte dentro il feed RealSmart.

**Falso positivo trovato scrivendo i test**: il controllo sui segreti nel prompt cercava la
sottostringa `"re_"` (prefisso delle chiavi Resend) e combaciava con
`prepare_whatsapp_handoff`. Ora usa pattern di chiave veri — un test che grida al lupo viene
disattivato, ed è peggio di non averlo.

---

## 9-decies. Onda 8 — eval del comportamento

```bash
npm run eval            # contro il modello reale (richiede ANTHROPIC_API_KEY)
npm run eval -- --mock  # verifica l'harness, nessun costo
```

**100 casi** nella distribuzione richiesta (30 ricerca, 15 follow-up, 10 venditore, 10 FAQ,
10 contatto, 10 fuori ambito, 10 sicurezza, 5 errore), incluse tutte le domande obbligatorie
del programma — un test verifica che nessuna sparisca.

**Scelta di fondo: grader deterministici, non un modello giudice.** Quasi tutte le soglie sono
verificabili senza chiedere a un secondo modello se la risposta "va bene":

| Soglia | Come si misura |
| --- | --- |
| Zero immobili inventati | ogni slug citato o mostrato deve esistere nel catalogo |
| Zero prezzi inventati | ogni importo nel testo deve essere un prezzo reale o una cifra detta dall'utente |
| Zero segreti | espressioni regolari sulle forme di chiave |
| Zero immobili non disponibili | confronto con gli slug venduti |
| Scelta dello strumento | l'agente segnala i tool invocati via `onToolCall` (server-only) |
| p95 primo token | misurato sullo stream |

Un giudice-modello sarebbe più lento, più costoso e non deterministico proprio dove serve
certezza. Resta soggettivo il tono: lì non fingiamo un voto, misuriamo solo la concisione e
lasciamo il resto alla revisione umana dell'onda 10.

**Il test che conta davvero.** In modalità simulata l'eval dà 100/100 — che è esattamente il
risultato rassicurante e falso di cui diffidare. Perciò `__tests__/evalGraders.test.ts` mette
i grader davanti a risposte **deliberatamente sbagliate** e verifica che falliscano: immobile
inventato tra le card, immobile inventato citato come link, prezzo mai esistito, chiave
esposta, venduto mostrato come disponibile, strumento sbagliato, markdown, risposta fluviale,
handoff mancante. Un'eval i cui grader non sanno riconoscere un fallimento è peggio di nessuna
eval: produce un numero su cui qualcuno deciderà di pubblicare.

**Bug trovato nel banco di prova, non nell'assistente:** il modello simulato teneva il conto
dei passi ed era condiviso tra i turni, quindi nei casi multi-turno l'ultimo turno saltava la
chiamata allo strumento. Sembrava un difetto dell'assistente. Ora il modello si costruisce una
volta per turno.

**Il report** (`eval-report.md`) è generato e resta fuori dal repository: committarne uno in
modalità simulata lascerebbe in giro un 100% ingannevole.

**Cosa manca:** la misura vera. Servono `ANTHROPIC_API_KEY` e una singola esecuzione di
`npm run eval` per sapere davvero come si comporta l'assistente e quanto costa.

---

## 9-undecies. Onda 9 — E2E e rilascio

```bash
npm run e2e     # 44 test, desktop Chrome + iPhone Safari
```

Le risposte arrivano da uno stream SSE simulato via intercettazione di rete: nessuna chiave,
nessun feed, nessuna rete. Tutto il resto — routing, build, idratazione, accessibilità — è
l'applicazione vera. Coprono apertura/chiusura, invio, streaming ricomposto da più frammenti,
card e link corretti, zero risultati, conversazione multi-turno, WhatsApp, modulo email
(successo e provider non configurato), consenso obbligatorio, errore provider, rate limit,
risposta interrotta, focus, tastiera, aria-live e informativa privacy.

Rollout, variabili e checklist: [`docs/assistant-rollout.md`](assistant-rollout.md).

### ⛔️ Difetto P0 trovato qui — e NON riguarda l'assistente

**Sul sito non si poteva scrivere in nessun campo, da tastiera.**

Il preloader registra un listener globale per saltare l'intro al primo tasto. Chiamava
`preventDefault()` su Invio, spazio e ogni lettera, e solo *dopo* invocava la funzione di
salto, che a intro conclusa usciva subito. Ma il listener resta attaccato a `window` per tutta
la vita della pagina: a intro finita ogni tasto continuava a essere annullato **su tutto il
sito**, ricerca immobili e form contatti compresi.

Verificato: a intro conclusa da sei secondi, sulla pagina `/case`, digitando "tradate" nel
campo di ricerca il valore restava `""`.

`git diff main` su `Preloader.tsx` era **vuoto**: il difetto è preesistente, in produzione.

Perché nessuna delle verifiche manuali delle onde precedenti lo aveva colto: gli strumenti di
automazione del browser impostano il valore dei campi invece di premere i tasti. Da qui la
regola in `e2e/tastiera.spec.ts` — eventi da tastiera veri (`pressSequentially`), mai `fill()`
— e i due test di regressione che sorvegliano l'intero sito, non solo l'assistente.

Correzione: la guardia "intro già finita" ora sta **prima** di `preventDefault()`, e i
listener si staccano da soli a fine intro (doppia difesa, indipendente dalla guardia).

### Un secondo difetto, su Safari

Chiudendo il pannello il focus non tornava al launcher ma al `body`: Safari, a differenza di
Chrome, non dà il focus a un pulsante quando lo si clicca, quindi l'elemento da ripristinare
memorizzato all'apertura era il `body`. Chi naviga da tastiera si ritrovava all'inizio della
pagina. Emerso solo facendo girare la suite su WebKit, che è il motore vero di un iPhone.

### Instabilità della suite, non del prodotto

I primi run avevano fallimenti diversi ogni volta. Causa: la homepage è pesante e con otto
worker paralleli il solo caricamento consumava il budget di 30 s. Ora i test partono da una
pagina leggera (l'assistente è nel layout, è identico ovunque), con quattro worker e 60 s.

---

## 10. Sequenza di lavoro

| Onda | Contenuto | Stato |
| --- | --- | --- |
| 1 | Audit + architettura + fondamenta + 5 tool (questo documento) | **fatto** |
| 1.5 | Consolidamento: precisione retrieval, latenza, troncamento, abort | **fatto** |
| 2 | Knowledge base verificata + retrieval ibrido | **motore fatto**, testi in attesa del cliente |
| 3 | Motore conversazionale e 5 tool | da fare |
| 4 | Ricerca immobiliare + suite 50 query | **fatto** |
| 5 | Email + WhatsApp + health | **fatto**, invio reale da verificare con chiave provider |
| 6 | UI/UX premium mobile-first | **fatto** |
| 7 | Sicurezza, privacy, costi | **fatto** |
| 8 | Eval 100 casi | **fatto**, misura reale in attesa della chiave |
| 9 | E2E + rollout controllato | **E2E fatti**, rilascio in attesa di ambiente e contenuti |
| 10 | Audit red team finale | **fatto** su codice e comportamento verificabile — [audit](assistant-audit-finale.md) |
