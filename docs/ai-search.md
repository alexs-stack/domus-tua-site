# Ricerca AI immobili

Ricerca in linguaggio naturale sulla pagina case: l'utente scrive *"trilocale con giardino a
Tradate sotto 300.000 €"* e ottiene i risultati giusti, ordinati per rilevanza.

## Come funziona (a strati, tutti con fallback)

1. **Frase → filtri** (`app/lib/ai/parseQuery.ts`)
   - Con `ANTHROPIC_API_KEY`: **Claude Haiku** estrae i filtri (tipo, comune, prezzo, locali,
     caratteristiche) + la parte descrittiva (`semanticQuery`), via structured output.
   - Senza chiave: **parser locale** deterministico (regex/keyword) — meno furbo ma funziona.
2. **Filtro** (`app/lib/ai/rank.ts` → `applyFilters`): stessa logica dei filtri manuali del sito.
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

- Backend: `POST /api/assistant` → `app/lib/ai/assistant.ts` (loop con lo strumento, max 3 giri)
  + `app/lib/ai/knowledge.ts` (conoscenza dell'agenzia nel system prompt, corpus piccolo = niente
  vector DB). Modello: `AI_ASSISTANT_MODEL` (default Claude Haiku 4.5).
- **Opt-in**: la chat compare solo se `NEXT_PUBLIC_ENABLE_ASSISTANT="true"` (flag client) E c'è
  `ANTHROPIC_API_KEY` (server). Senza chiave l'assistente risponde con un messaggio di cortesia
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
