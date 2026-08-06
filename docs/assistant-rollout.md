# Assistente — rilascio controllato

L'interruttore è uno solo: **`NEXT_PUBLIC_ENABLE_ASSISTANT`**. Vuoto o `false` = l'assistente
non esiste per l'utente (il componente non viene nemmeno montato, il suo bundle non viene
scaricato). Nessun'altra variabile può accenderlo per sbaglio.

Oggi vale `false`. Deve restare così finché la checklist qui sotto non è tutta verde.

---

## Variabili d'ambiente

| Variabile | Ambito | Senza di essa |
| --- | --- | --- |
| `NEXT_PUBLIC_ENABLE_ASSISTANT` | public | L'assistente non compare. **È l'interruttore.** |
| `ANTHROPIC_API_KEY` | server | Risposta di fallback onesta, canali umani attivi |
| `AI_ASSISTANT_MODEL` | server | Default `claude-haiku-4-5-20251001` |
| `ASSISTANT_RATE_LIMIT` | server | Default 30 turni per IP ogni 10 minuti |
| `RATE_LIMIT_REDIS_URL` + `_TOKEN` | server | ⚠️ Limite **per-istanza**: non è un limite vero su serverless |
| `ASSISTANT_EMAIL_API_KEY` | server | Il modulo email dichiara di non poter inviare; WhatsApp e telefono restano |
| `ASSISTANT_EMAIL_FROM` | server | Default `assistente@domustua.it`; dev'essere su dominio verificato |
| `ASSISTANT_LEAD_EMAIL_TO` | server | Default `immobiliare@domustua.it` |
| `VOYAGE_API_KEY` | server | Embeddings da Gemini invece che da Voyage. Non tocca la knowledge base, che è lessicale |
| `ASSISTANT_SEMANTIC_FLOOR` | server | **Va lasciata vuota**: retrieval semantico spento, per misura ([assistant-knowledge.md](assistant-knowledge.md)) |
| `NEXT_PUBLIC_SITE_URL` | public | Link relativi nei messaggi di handoff |

Elenco completo con commenti: [`.env.example`](../.env.example).

---

## Le quattro fasi

**1. Preview** — `NEXT_PUBLIC_ENABLE_ASSISTANT=true` solo sull'ambiente di anteprima Vercel,
con `ANTHROPIC_API_KEY`. Serve a eseguire `npm run eval` contro il modello reale e a fare la
prima prova da browser. Nessun utente vede nulla.

**2. Prova interna** — la stessa preview, usata da Raffaela e dal team per una settimana. È
qui che emergono le risposte imbarazzanti che nessun test può prevedere. Da questa fase
escono i contenuti mancanti della knowledge base.

**3. Produzione a rischio limitato** — assistente acceso in produzione **con il canale email
ancora spento**. Le richieste passano da WhatsApp e telefono, che sono canali già rodati. Se
qualcosa va storto, nessuna richiesta di un cliente si perde in una casella non configurata.

**4. Produzione completa** — canale email acceso, dopo aver verificato che una mail di prova
arrivi davvero a `immobiliare@domustua.it`.

## Rollback

`NEXT_PUBLIC_ENABLE_ASSISTANT=false` e redeploy. L'assistente sparisce; il resto del sito non
si accorge di nulla. Nessun dato da ripulire: la conversazione non è mai stata salvata da
nessuna parte.

Non serve rollback del codice: l'assistente non modifica nessuna pagina esistente.

---

## Checklist prima di accendere

Verificabile ora, in questo repository:

- [x] `npm run check` — lint, typecheck, 270 unit test, 81 casi parser, build
- [x] `npm run e2e` — 46 test, desktop Chrome e iPhone Safari
- [x] Nessun segreto nel bundle client (verificato con grep sul build)
- [x] Il prompt di sistema non è nel bundle client
- [x] Nessuna persistenza della conversazione (verificato da test sui sorgenti)
- [x] `/api/health` riporta i cinque canali separatamente
- [x] Il canale email non dichiara mai un invio non avvenuto
- [x] WhatsApp punta a +39 346 604 2314, con messaggio codificato
- [x] Il feed RealSmart regge le assunzioni della ricerca (`REALSMART_INTEGRATION=1 npm test`)
- [x] Chunk assistente 40 KB, caricato solo all'apertura; SDK AI assente dal client
- [x] Nessuna firma inventata attribuita a una persona reale

Richiede un ambiente configurato — **non ancora fatto**:

- [ ] `npm run eval` contro il modello reale, con le soglie del programma rispettate
- [ ] Una mail di prova **ricevuta davvero** su `immobiliare@domustua.it`
- [ ] `RATE_LIMIT_REDIS_URL` configurata (senza, il limite è per-istanza)
- [ ] Allarme di budget sulla console Anthropic
- [ ] Prova reale da browser sulla preview Vercel
- [ ] Latenza p95 del primo token misurata sotto i 2 s

Richiede il cliente — **non ancora fatto**:

- [ ] Testi approvati per Metodo, D.O.C., Open Domus, processi, valutazione, visite, FAQ
      (oggi `pending`: l'assistente dice onestamente di non sapere)
- [ ] Decisione su `info@domustua.com` vs `immobiliare@domustua.it`
- [ ] Metriche del sito documentate o rimosse (269.395 mq, 6.433 persone, 1.523 transazioni, 92%)
- [ ] Firma reale di Raffaela (`brand.signature`) — nel frattempo non viene mostrata nulla,
      invece del tracciato inventato che le veniva attribuito per nome

> Due dei quattro suggerimenti iniziali ("Vorrei vendere casa", "Come funziona Open Domus?")
> toccano temi ancora `pending`. Finché restano tali, due chip su quattro portano a un onesto
> "non lo so": accendere l'assistente prima dei contenuti significa accettarlo.
