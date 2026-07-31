# Ricerca AI immobili

Ricerca in linguaggio naturale sulla pagina case: l'utente scrive *"trilocale con giardino a
Tradate sotto 300.000 €"* e ottiene i risultati giusti, ordinati per rilevanza.

## Come funziona (a strati, tutti con fallback)

1. **Frase → filtri** (`app/lib/ai/parseQuery.ts`)
   - Con `ANTHROPIC_API_KEY`: **Claude Haiku** estrae i filtri (tipo, comune, prezzo, locali,
     caratteristiche) + la parte descrittiva (`semanticQuery`), via structured output.
   - Senza chiave: **parser locale** deterministico (regex/keyword) — meno furbo ma funziona.
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

1. **Claude (parsing)** — crea una chiave su console.anthropic.com (con credito/fatturazione),
   poi su **Vercel → Settings → Environment Variables**: `ANTHROPIC_API_KEY=sk-ant-…`.
   Modello di default: `claude-haiku-4-5-20251001` (override con `AI_SEARCH_MODEL`).
2. **Voyage (semantico)** — crea una chiave su voyageai.com, poi `VOYAGE_API_KEY=…`
   (override modello con `VOYAGE_MODEL`, default `voyage-3.5-lite`).
3. Redeploy.

Sono **server-only** (niente prefisso `NEXT_PUBLIC_`): non finiscono mai nel bundle client.

## Costi (indicativi, volumi di un'agenzia locale)

- **Claude Haiku**: input piccolo (frase + schema) → **frazioni di centesimo a ricerca**,
  ordine di grandezza qualche centesimo al giorno anche con traffico discreto.
- **Voyage embeddings**: gli immobili si embeddano una volta (cache 12 min); a ricerca si embedda
  solo la query → costo trascurabile.

## Guardrail già presenti

- Lunghezza query limitata (`MAX_QUERY_LEN`, 300 caratteri).
- Timeout sulle chiamate esterne (8s Claude, 10s Voyage) → nessuna richiesta appesa.
- Ogni errore/timeout degrada al livello inferiore (AI → locale, semantico → parole chiave) e,
  in ultima istanza, ai filtri manuali. La ricerca non si rompe mai.

## Assistente conversazionale (Livello C) — FATTO

Chat on-brand (`app/components/Assistant.tsx`, montata nel layout) che dialoga, cerca case
(riusando la pipeline sopra tramite lo strumento `search_listings`) e risponde su Domus D.O.C.,
servizi, Open Domus, metodo, contatti/orari. In 5 lingue, con schede immobile mostrate in chat.

Il backend ha un documento suo: **[docs/assistant-backend.md](assistant-backend.md)** —
strumenti, regole, limiti, fallback. In sintesi:

- `POST /api/assistant` risponde in **streaming (SSE)**; il turno gira in `app/lib/ai/assistant.ts`
  con cinque strumenti tipizzati (`app/lib/ai/tools.ts`) e il corpus verificato in
  `app/lib/ai/knowledge.ts`. Modello: `AI_ASSISTANT_MODEL` (default Claude Haiku 4.5).
- **Opt-in**: la chat compare solo se `NEXT_PUBLIC_ENABLE_ASSISTANT="true"` (flag client) E c'è
  `ANTHROPIC_API_KEY` (server). In produzione il flag resta spento finché non è fatta la fase di
  eval. Senza chiave l'assistente risponde con un messaggio di cortesia (usa i filtri / WhatsApp).
- Limiti: 30 richieste per IP ogni 10 minuti, payload 64 KB, 24 messaggi da 1000 caratteri,
  cronologia agli ultimi 12 turni, 800 token per risposta, timeout 25 s, 4 giri di strumenti,
  abort propagato al provider.
- Garanzie nel codice (non solo nel prompt): nessun venduto tra i disponibili, input del modello
  validati prima dell'esecuzione, gli strumenti di contatto preparano il collegamento ma non
  inviano nulla, un campo assente non diventa mai un "no".

## Possibili estensioni (Fase 2+)

- Cache delle query identiche.
(Le conversazioni non si salvano: nessun CRM, nessuno storico. Chi vuole essere ricontattato
passa dal form o da WhatsApp, dove dà il consenso.)
