# Assistente conversazionale — backend

Backend dell'assistente di `app/components/Assistant.tsx`. Risponde in italiano (e nelle altre
quattro lingue del sito), cerca sugli immobili **live** RealSmart, spiega solo contenuti
verificati di Domus Tua e passa la mano a email / WhatsApp / telefono quando serve una persona.

L'interfaccia, la sicurezza applicata e i cento eval stanno in
[assistant-ui-e-eval.md](assistant-ui-e-eval.md).

**Non salva niente.** La conversazione vive nel client e viaggia a ogni richiesta: nessun
database, nessun gestionale, nessun log del contenuto dei messaggi.

---

## 1. Come si accende

Due interruttori indipendenti, di proposito:

| Variabile | Dove | Effetto |
|---|---|---|
| `ANTHROPIC_API_KEY` | server | il provider può rispondere (`assistantConfigured`) |
| `NEXT_PUBLIC_ENABLE_ASSISTANT` | client | il widget è visibile sul sito (`assistantEnabled`) |
| `AI_ASSISTANT_MODEL` | server, opzionale | override del modello |

Il backend può essere pronto senza che la chat sia in pagina. **In produzione
`NEXT_PUBLIC_ENABLE_ASSISTANT` resta vuoto**: si accende dopo la fase di eval (prompt 8).

Modello di default: `claude-haiku-4-5-20251001`, la scelta già fatta dal progetto per la
ricerca. Il lavoro deterministico lo fanno gli strumenti; il modello formula la risposta. Si
cambia con `AI_ASSISTANT_MODEL`, senza toccare il codice.

Stato leggibile da `/api/health`:

```json
"assistant": { "enabled": false, "providerConfigured": true, "model": "claude-haiku-4-5-20251001" }
```

---

## 2. Architettura di un turno

```
Assistant.tsx ──POST /api/assistant──▶ route.ts ──▶ runAssistant()  ──▶ Claude (streaming)
   (SSE reader)                       (rate limit,      │                     │
                                       validazione)     │              tool_use
                                                        ▼                     │
                                                   runTool() ◀────────────────┘
                                            (RealSmart live, corpus verificato)
```

- `app/api/assistant/route.ts` — validazione + rate limit, risponde in **SSE**.
- `app/lib/ai/assistant.ts` — `runAssistant()`: async generator che emette eventi.
- `app/lib/ai/tools.ts` — i cinque strumenti e la loro esecuzione.
- `app/lib/ai/knowledge.ts` — corpus verificato + system prompt.

Eventi sul filo (`data: {…}\n\n`):

| Evento | Significato |
|---|---|
| `{"type":"text","text":"…"}` | pezzo di risposta, da concatenare |
| `{"type":"listings","listings":[…]}` | schede immobile da mostrare sotto la risposta |
| `{"type":"done"}` | turno concluso |
| `{"type":"error","reason":"…"}` | `not-configured` \| `provider-error` \| `timeout` \| `aborted` |

---

## 3. I cinque strumenti

| Strumento | Input | Cosa restituisce | Garanzia |
|---|---|---|---|
| `search_listings` | `query`, `max_results?` | fino a 4 immobili disponibili | passa da `applyFilters` → esclude i venduti; zero risultati = istruzione a non inventare |
| `get_listing_details` | `slug` | scheda completa dell'immobile | slug sconosciuto → errore; venduto → rifiuto esplicito |
| `retrieve_verified_knowledge` | `topic` | scheda verificata + fonte | tema fuori corpus → `found: false` + temi disponibili |
| `prepare_whatsapp_handoff` | `reason`, `listing_slug?` | link `wa.me` già scritto | `inviato: false` |
| `prepare_email_handoff` | `intent`, `listing_slug?` | email, telefono, URL del form | `inviato: false` |

Tre regole che il codice fa rispettare, non il prompt:

1. **Nessun venduto tra i disponibili.** Ricerca e dettagli filtrano su
   `app/lib/availability.ts`. Un venduto non può essere descritto come in vendita nemmeno se il
   modello lo chiede per slug.
2. **Input validati prima dell'esecuzione.** Il modello può produrre qualsiasi JSON: ogni
   strumento controlla forma, tipi e limiti e risponde con un errore leggibile invece di
   eseguire su valori arbitrari. `runTool` non lancia mai.
3. **Nessun invio.** Gli strumenti di contatto *preparano* un collegamento. Non spediscono: il
   consenso privacy si dà nel form, non in chat. Ogni risposta porta `inviato: false` e la nota
   che dice al modello di non affermare il contrario.

Un campo assente non diventa mai un "no": le dotazioni non dichiarate dal gestionale escono
come `"informazione non disponibile"` (tri-stato, come sulla scheda immobile).

---

## 4. Regole di risposta (system prompt)

In `buildAssistantSystem()`. Le non negoziabili:

- non inventare immobili, prezzi, indirizzi, metrature o disponibilità;
- mai presentare come disponibile un immobile venduto;
- se il tema non è nel materiale verificato, dirlo e proporre il team — niente conoscenza generica;
- non garantire tempi di vendita, prezzi di realizzo o risultati;
- niente consulenza legale, fiscale, notarile o finanziaria definitiva;
- mai dichiarare di aver inviato un messaggio o un'email.

E sul modo: una sola domanda di chiarimento quando la richiesta è ambigua, massimo 3-4 immobili,
risposte di 2-5 frasi, testo semplice (niente markdown), zero risultati → un allargamento
sensato + contatto umano.

---

## 5. Limiti e difese

| Difesa | Valore | Dove |
|---|---|---|
| Rate limit per IP | 30 richieste / 10 min → 429 + `retry-after` | `rateLimit.ts` (`ASSISTANT_LIMIT`) |
| Argine anti-raffica | 6 richieste / 30 s | `rateLimit.ts` (`ASSISTANT_BURST_LIMIT`) |
| Sanificazione input | caratteri di controllo e invisibili rimossi | `route.ts` (`sanitize`) |
| Payload massimo | 64 KB → 413 | `route.ts` |
| Messaggi accettati | ultimi 24, 1000 caratteri l'uno | `route.ts` |
| Cronologia inviata al modello | ultimi 12 turni | `ASSISTANT_MAX_HISTORY` |
| Token per risposta | 800 | `ASSISTANT_MAX_TOKENS` |
| Timeout provider | 25 s, 1 solo ritentativo | `ASSISTANT_TIMEOUT_MS` |
| Giri di strumenti | 4; all'ultimo giro gli strumenti vengono tolti | `ASSISTANT_MAX_TOOL_ROUNDS` |
| Abort | `req.signal` → SDK: chiudere la scheda ferma il turno | `route.ts` → `assistant.ts` |

Un ruolo diverso da `assistant` viene forzato a `user`: il client non può iniettare un turno di
sistema, che è l'unico canale di istruzioni dell'assistente.

**Nessun segreto nel client.** Il widget conosce solo `NEXT_PUBLIC_ENABLE_ASSISTANT` e chiama
`/api/assistant`. La chiave del provider vive solo sul server.

### Se il provider non c'è

`not-configured`, `provider-error`, `timeout` producono un messaggio di cortesia che rimanda ai
filtri di ricerca, a WhatsApp e al telefono — in cinque lingue (`FALLBACK`). **La ricerca
deterministica e i contatti restano utilizzabili in ogni caso**: la chat è un'aggiunta, non un
passaggio obbligato. Il testo già arrivato prima di un errore non viene buttato.

---

## 6. Test

`app/lib/__tests__/assistant.test.ts` — 30 test, senza chiamare il provider: gli strumenti
girano su un contesto costruito a mano (un immobile disponibile, uno venduto). Coprono le
definizioni degli strumenti, la validazione degli input, l'esclusione dei venduti, il
tri-stato delle dotazioni, il corpus verificato, gli handoff che non inviano, le regole del
prompt e i limiti del turno.

`app/lib/__tests__/assistant-ui-security.test.ts` — 30 test su interfaccia, endpoint sotto
attacco e integrità dell'insieme di eval. Test di browser e valutazione del modello: vedi
[assistant-ui-e-eval.md](assistant-ui-e-eval.md).

```bash
npm test
```
