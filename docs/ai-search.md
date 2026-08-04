# Ricerca AI immobili

Ricerca in linguaggio naturale sulla pagina case: l'utente scrive *"trilocale con giardino a
Tradate sotto 300.000 €"* e ottiene i risultati giusti, ordinati per rilevanza.

## Come funziona (a strati, tutti con fallback)

1. **Frase → filtri** (`app/lib/ai/parseQuery.ts`)
   - Con un provider configurato: il modello estrae i filtri (tipo, comune, prezzo, locali,
     caratteristiche) + la parte descrittiva (`semanticQuery`), via structured output.
     Provider predefinito **Gemini** (`GEMINI_API_KEY`, modello `gemini-2.5-flash`), in
     alternativa **Claude** (`ANTHROPIC_API_KEY`, `claude-haiku-4-5-20251001`).
     La scelta la fa `app/lib/ai/provider.ts`, condivisa con l'assistente.
   - Senza chiave: **parser locale** deterministico (regex/keyword) — meno furbo ma funziona.

   I due provider condividono schema, prompt e `sanitize`: cambia solo la forma della chiamata
   HTTP (tool use forzato su Claude, function calling con `mode: ANY` su Gemini).
   Su Gemini il parsing gira con `thinkingBudget: 0`: su un'estrazione di campi il
   ragionamento non cambia l'esito e la ricerca è sulla strada critica dell'utente.

   > Perché `gemini-2.5-flash` e non la Lite, che costa meno: sulla frase
   > *"bilocale luminoso a Como senza giardino"* la Lite aggiungeva Ascensore e Aria
   > condizionata, mai chieste — filtri inventati che tolgono risultati buoni.
2. **Filtro** (`app/lib/ai/rank.ts` → `applyFilters`): stessa logica dei filtri manuali del sito.
   - La chiave del **comune** è il nome pulito (`app/lib/comune.ts` → `comuneOf`): `Property.zone`
     dei dati live include la provincia (`"Tradate (VA)"`), ma nessuno scrive "villa a Tradate (VA)".
     `comuniFacet` costruisce la stessa lista per la facet del parser, la tendina di
     `PropertySearch` e la mappa; `matchesComune` accetta anche varianti con provincia/accenti.
     Regressione coperta da `app/lib/__tests__/comune.test.ts`.
3. **Ranking**
   - Con `VOYAGE_API_KEY`: **ranking semantico** via embeddings (Voyage). I vettori dei 186
     immobili sono calcolati una volta e messi in cache (`unstable_cache`, 12 min).
   - Senza chiave: **ranking per parole chiave** (quante keyword compaiono nel testo).

Endpoint: `POST /api/search` `{ q }` → `{ ok, filters, rankedSlugs, source, semantic }`.
Il client (`PropertySearch.tsx`) imposta i filtri (le chip riflettono cosa ha capito l'AI) e
mostra gli immobili nell'ordine restituito. Se l'utente tocca un filtro a mano, esce dalla
modalità AI e torna al filtro classico. Se `/api/search` fallisce, restano i filtri manuali.

## Attivazione

Tutto è **opt-in**: senza chiavi la ricerca funziona già (parser locale + parole chiave).
Per la versione piena:

1. **Provider (parsing)** — una sola chiave, che serve anche all'assistente. Su
   **Vercel → Settings → Environment Variables**:
   - **Gemini** (predefinito): `GEMINI_API_KEY=AIza…` da aistudio.google.com.
     Modello di default `gemini-2.5-flash`.
   - **Claude** (alternativa): `ANTHROPIC_API_KEY=sk-ant-…` da console.anthropic.com.
     Modello di default `claude-haiku-4-5-20251001`.

   Con entrambe le chiavi vince Gemini; `AI_PROVIDER=anthropic` inverte la scelta senza
   toccare il codice. Override del modello con `AI_SEARCH_MODEL`.
2. **Voyage (semantico)** — crea una chiave su voyageai.com, poi `VOYAGE_API_KEY=…`
   (override modello con `VOYAGE_MODEL`, default `voyage-3.5-lite`).
3. Redeploy.

Sono **server-only** (niente prefisso `NEXT_PUBLIC_`): non finiscono mai nel bundle client.

## Costi (indicativi, volumi di un'agenzia locale)

- **Modello di parsing** (Gemini Flash o Claude Haiku): input piccolo (frase + schema) →
  **frazioni di centesimo a ricerca**, ordine di grandezza qualche centesimo al giorno anche
  con traffico discreto.
- **Voyage embeddings**: gli immobili si embeddano una volta (cache 12 min); a ricerca si embedda
  solo la query → costo trascurabile.

## Misura del percorso AI

```bash
npm run test:parser     # parser locale, deterministico, dentro `npm test` — nessuna chiave
npm run eval:search     # percorso AI col provider vero — richiede una chiave
```

Entrambi girano sugli **stessi casi** (`app/lib/ai/__evals__/searchCases.ts`), e non è un
dettaglio: il parser locale è il *fallback* del percorso AI, quindi l'unica domanda che conta
non è "l'AI funziona?" ma **"l'AI fa meglio di ciò che sostituisce?"**. Il report li mette
affiancati.

| Metrica | Soglia | Perché |
| --- | --- | --- |
| Filtri inventati | 0 | tolleranza zero |
| Concordanza sugli 81 casi d'oro | ≥ parser locale | l'AI non deve peggiorare nulla |
| Frasi colloquiali risolte | > parser locale | altrimenti la chiave non serve |
| Chiamate cadute nel fallback | 0 | timeout o schema rotto |

**Perché "filtri inventati" è l'unico criterio a tolleranza zero:** un filtro che la frase non
chiede *toglie* immobili buoni dai risultati, e l'utente non vede niente di sbagliato — vede
solo meno case. Un campo mancante, al confronto, allarga soltanto la ricerca.

**Cosa ha trovato appena acceso** (Gemini, 87 casi): 59/81 contro 81/81 del parser locale.
Il difetto dominante era che «trilocale» impostava i locali ma non la tipologia — quindi
"trilocale a Tradate" lasciava passare ville e capannoni con tre locali. Il prompt diceva
*"bilocale=2 locali, trilocale=3"* e il modello lo seguiva alla lettera: quelle parole dicono
**due** cose, non una. Corretto il prompt (mappa completa delle tipologie, sinonimi
multilingua, superficie senza qualificatore = minimo, «casa» generico che non forza Villa),
si arriva a **81/81 sui casi d'oro e 6/6 sulle frasi colloquiali, dove il parser locale fa
0/6**. Latenza mediana 524 ms, p95 819 ms.

Le frasi colloquiali (`CASI_COLLOQUIALI`) stanno fuori da `npm test` di proposito: sono
abbreviazioni e diminutivi — *"un trilo"*, *"appartamentino"*, *"negozio a Busto"*, *"spendo
sui 600"* — che le regex non possono coprire per costruzione. Servono a misurare il valore
aggiunto della chiave, che i casi d'oro (scritti sul contratto del fallback) non possono
mostrare: lì il pareggio è il massimo ottenibile.

## Guardrail già presenti

- Lunghezza query limitata (`MAX_QUERY_LEN`, 300 caratteri).
- Timeout sulle chiamate esterne (8s sul provider di parsing, 10s Voyage) → nessuna richiesta appesa.
- Ogni errore/timeout degrada al livello inferiore (AI → locale, semantico → parole chiave) e,
  in ultima istanza, ai filtri manuali. La ricerca non si rompe mai.

## Assistente conversazionale (Livello C) — FATTO

Chat on-brand (`app/components/Assistant.tsx`, montata nel layout) che dialoga, cerca case
(riusando la pipeline sopra tramite lo strumento `search_listings`) e risponde su Domus D.O.C.,
servizi, Open Domus, metodo, contatti/orari. In 5 lingue, con schede immobile mostrate in chat.

- Backend: `POST /api/assistant` → `app/lib/ai/assistant.ts` (loop con lo strumento, max 3 giri)
  + `app/lib/ai/knowledge.ts` (conoscenza dell'agenzia nel system prompt, corpus piccolo = niente
  vector DB). Modello: `AI_ASSISTANT_MODEL` (default `gemini-3.6-flash` su Gemini, Claude Haiku 4.5 su Anthropic).
- **Opt-in**: la chat compare solo se `NEXT_PUBLIC_ENABLE_ASSISTANT="true"` (flag client) E c'è
  `GEMINI_API_KEY` oppure `ANTHROPIC_API_KEY` (server). Senza chiave l'assistente risponde con un messaggio di cortesia
  (usa i filtri / WhatsApp). Attivazione: imposta entrambe le variabili su Vercel + redeploy.
- Guardrail: max 24 messaggi e 1000 caratteri per messaggio, cronologia troncata agli ultimi 12
  turni, timeout 20s, il modello non inventa immobili/prezzi (solo ciò che lo strumento restituisce),
  nessuna consulenza legale/fiscale (rimanda al team).
- Non ancora fatto: streaming token-by-token (oggi risposta completa con indicatore "sta scrivendo"),
  rate limiting per IP.

## Possibili estensioni (Fase 2+)

- Streaming delle risposte dell'assistente (SSE) per un effetto "digita".
- Rate limiting per IP sugli endpoint (oggi mitigato da lunghezza + timeout + fallback).
- Cache delle query identiche.
- Memoria lead: salvare le conversazioni interessate come lead (collegamento a /api/lead).
