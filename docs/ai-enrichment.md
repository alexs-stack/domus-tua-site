# Arricchimento AI delle descrizioni — MVP

Riscrittura AI-assistita delle descrizioni RealSmart, **sicura per default**: la generazione è
offline e produce PROPOSTE; nulla sostituisce il testo pubblico senza una revisione umana; i
controlli privacy/fatti sono DETERMINISTICI, mai affidati al modello.

## Architettura (a parole)

```
 FONTE (immutabile)            GENERAZIONE (offline, batch)              APPLICAZIONE (sito)
 RealSmartListingRaw  ──►  normalize (deterministico) ──►  base   ──►  getAiNormalizer()
                                     │                                        │
                        redact indirizzi/telefoni (guards)          getPublished(listingId)
                                     │                                        │
                          prompt SOLO dai campi sorgente             hash fonte == record?
                                     │                                   │        │
                              CopyModel (Gemini)                       sì       no/assente
                                     │                                   │        │
                       parse SCHEMA STRETTO {paragrafi}          applica copy   deterministico
                                     │                            (normalizedBy="ai")
                        GUARD deterministici sull'output
                        (indirizzo/telefono/legale/numero)
                                     │
                     record VERSIONATO  status: draft ──► review ──► published / rejected
                                     │                         (revisione umana)
                              GeneratedCopyStore
```

- **Generazione** (`ai/batch.ts` → `ai/generate.ts`): offline, non nel percorso di richiesta.
- **Applicazione** (`aiNormalizer.ts`): il sito applica SOLO copy `published`, e solo se l'hash
  della fonte combacia (una copy obsoleta non si applica). Senza `published` → deterministico.

## Schema dell'output (stretto)

`ai/schema.ts` — il modello restituisce SOLO `{ "paragrafi": string[] }` (1–8, non vuoti),
`.strict()`: qualunque altra chiave fa fallire il parse. Nessun campo per fatti/indirizzi/prezzi:
quelli vengono dalla fonte.

## Guardie deterministiche (la barriera NON è mai il modello)

`ai/guards.ts`, PRIMA della chiamata (redazione della fonte) e DOPO (validazione dell'output):
- indirizzi civici (via/piazza + numero) con `showAddress=false` → scarto;
- telefoni → scarto;
- claim legali/di conformità (a norma, conforme, certificato, sanato, agibile…) → scarto;
- numeri non presenti nei campi sorgente (mq/locali/camere/bagni/prezzo) → allucinazione → scarto;
- toponimi non nel comune sorgente → scarto.
Una sola violazione scarta l'intero output → si resta sul deterministico. Test avversariali:
`ai/__tests__/generate.test.ts` (incluso il prompt-injection dentro il testo del feed).

## Ciclo di vita del dato

- La **fonte** RealSmart è immutabile.
- L'**output** è un `GeneratedCopyRecord` versionato per `listingId + sourceHash + promptVersion`,
  con provenienza (provider, modello, `generatedAt`, costo) e stato.
- Stati: `draft → review → published | rejected`. Solo `published` viene applicato dal sito.
- **Idempotenza**: `ai/hash.ts` — hash dei soli campi che alimentano la copy + versione del prompt.
  Stessa fonte → nessuna rigenerazione (nessun costo). Cambiare `PROMPT_VERSION` invalida di proposito.

## Costo, abuso, kill switch

`ai/record.ts` + `ai/batch.ts`:
- `maxBatch`, `concurrency`, `retries` (backoff esponenziale), `timeoutMs`;
- **tetto di spesa** per batch (`costCapUsd`): oltre, il batch si ferma;
- **kill switch** `REALSMART_AI_KILL=true`: ferma la generazione senza deploy;
- formula costo: `input/1e6 * $IN + output/1e6 * $OUT` (tariffe override d'ambiente). Ordine di
  grandezza per il tetto e il report, non fatturazione.
- **Idempotenza** evita di ripagare per una fonte invariata.

Stima per annuncio: ~`(token_in + token_out)` per il modello scelto × tariffa. Con Gemini flash e
descrizioni tipiche (~600 in / ~250 out) è nell'ordine di **$0,0001–0,0003 per annuncio**; 196
annunci una tantum ≈ pochi centesimi. Il tetto è comunque il freno vero.

## Chiavi e provider

Chiavi SOLO server (`GEMINI_API_KEY`, `ASSISTANT_EMAIL_*` non c'entra qui). Mai loggate: il core
logga solo il MESSAGGIO d'errore, mai la chiave né il contenuto dell'annuncio.

## Conoscenza di ZONA (separata)

`ai/areaFacts.ts` — dataset CURATO e **vuoto** di default: nessun fatto sulla città inventato. Ogni
fatto richiede `sourceUrl` + `retrievedAt` + `approvedBy` (validato). La copy generata NON usa la
zona (fuori incarico). Il chatbot, quando li combinerà, dovrà **distinguere** "su questo immobile"
da "sulla zona" — integrazione documentata come passo successivo, non ancora agganciata all'assistente.

## Persistenza — proposta di deploy (nessun vendor aggiunto in silenzio)

Oggi `InMemoryGeneratedCopyStore` (per-processo, non durevole): perfetto per batch offline e test.
Per la produzione, la **opzione più piccola** dietro la stessa interfaccia `GeneratedCopyStore`:
1. **File JSON versionato in repo** (`overrides`-style): zero vendor, revisione via PR. Adatto a
   volumi bassi e a un solo revisore. **Consigliata per l'MVP.**
2. Vercel KV / Upstash Redis: un record per chiave. Serve un account (costo, DPA).
3. Postgres/Supabase: se servono query di revisione ricche. Più infrastruttura.

## Cosa resta da decidere (cliente)
1. **Attivare la generazione?** (`REALSMART_AI_NORMALIZE=true` + chiave). Oggi spenta.
2. **Chi approva** le copy e con quale policy (uno o più revisori).
3. **Store durevole**: opzione 1/2/3 sopra.
4. **UI di revisione**: oggi c'è il modello dati + le transizioni; un pannello protetto (NON
   admin anonimo) mostrerebbe originale sanitizzato vs proposta, fatti cambiati, avvisi, provenienza,
   e i pulsanti approva/rifiuta. Da costruire dopo la scelta su auth/store.
