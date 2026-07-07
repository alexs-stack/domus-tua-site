# Integrazione RealSmart — note operative

Documento di lavoro per collegare il sito Domus Tua al gestionale **RealSmart**.
Stato attuale: **scaffolding tipizzato pronto, nessuna API reale collegata.** Il sito gira
su mock normalizzati (`app/lib/realsmart/mocks.ts`) finché non riceviamo endpoint e credenziali.

Obiettivo: quando arrivano gli accessi, l'integrazione deve richiedere **solo** la sostituzione
del corpo di `fetchRawListings()` in `app/lib/realsmart/client.ts` — tipi e consumo lato sito
restano invariati.

---

## 1. Cos'è RealSmart nel nostro flusso

RealSmart è il **gestionale immobiliare** dell'agenzia e va trattato come **single source of truth**
per gli immobili: prezzo, stato (in vendita / sotto proposta / venduto), foto, dati catastali, testi.

Principio guida: **non si duplicano né si modificano i dati sul sito.** Il sito è una vista
in sola lettura del gestionale. Ogni modifica (nuovo immobile, ribasso, "venduto") si fa in
RealSmart e si propaga al sito automaticamente. Questo evita disallineamenti e doppio lavoro.

---

## 2. Le tre vie di integrazione

In ordine di preferibilità per il nostro caso:

### A. Feed dedicato al sito (XML/JSON) — **preferita**
Un export pensato per noi, con tutti i campi che ci servono e senza compromessi editoriali.
- Pro: controllo pieno sui campi, testi curati, nessun campo "portale" da ripulire.
- Contro: RealSmart deve poterlo generare/configurare (potrebbe essere a pagamento o non previsto).

### B. Stesso feed dei portali (tipo Immobiliare.it / Casa.it)
Riuso del feed che RealSmart già produce per i portali (spesso XML standard, es. formato tipo
"Immobiliare.it XML" o simili).
- Pro: quasi sempre già attivo, zero lavoro lato RealSmart.
- Contro: schema pensato per i portali (campi rigidi, testi non nostri, foto con watermark),
  da mappare/ripulire nel nostro `normalize.ts`. Possibili limiti su descrizioni personalizzate.

### C. API REST
Interrogazione diretta di eventuali API RealSmart.
- Pro: dati freschi on-demand, filtri lato server, possibile push.
- Contro: richiede documentazione API, auth, rate limit; spesso non disponibile o a listino.

> **Decisione da prendere col cliente/RealSmart:** quale delle tre è realmente disponibile
> sul loro piano. Partiamo assumendo B (feed portali) come fallback più probabile, puntando ad A.

---

## 3. Push vs Polling

Due modelli di aggiornamento, non mutuamente esclusivi:

- **Push** (RealSmart notifica noi):
  - *Webhook*: RealSmart chiama un nostro endpoint a ogni modifica → rivalidazione on-demand
    (Next: `revalidateTag("realsmart-listings")`). Reattivo, elegante. Richiede che RealSmart
    supporti webhook (spesso NO).
  - *FTP/SFTP*: RealSmart deposita periodicamente un file (XML/JSON) su uno spazio; noi lo leggiamo.
    Comune nei gestionali "vecchia scuola". Richiede credenziali FTP e un job di lettura.

- **Polling** (noi interroghiamo RealSmart):
  - ISR di Next con `revalidate ≈ 10–15 min` (attuale default: `REVALIDATE_SECONDS = 720s`, 12 min).
    Semplice, robusto, sufficiente: gli immobili non cambiano al secondo. È la strategia di partenza.

> **Strategia consigliata:** partire in **polling ISR (~12 min)**. Se RealSmart offre webhook,
> aggiungere rivalidazione on-demand per i "venduto/nuovo" immediati, mantenendo l'ISR come rete.

---

## 4. Domande da fare a RealSmart / al cliente

**Accesso e modalità**
1. È disponibile un **feed dedicato** (A), o solo il **feed portali** (B), o delle **API** (C)?
2. Formato del feed: **XML o JSON**? Esiste uno **schema/XSD/esempio** scaricabile?
3. Consegna: **URL da interrogare** (polling) o **file su FTP/SFTP** o **webhook push**?
4. Frequenza di aggiornamento del feed lato RealSmart (ogni quanto rigenerano l'export?).

**Autenticazione**
5. Come ci si autentica? (API key, Basic auth, token OAuth, IP allowlist, URL con token…)
6. Ci sono **rate limit** o finestre orarie?

**Contenuti**
7. Le **foto**: URL diretti e stabili? Con **watermark**? Che risoluzioni? Vincoli d'uso?
8. Possiamo avere **descrizioni/testi personalizzati** per il sito o solo quelli dei portali?
9. Come vengono espressi **stato** (venduto/proposta/ritirato) e **tipo contratto** (vendita/affitto)?
10. C'è un **codice/riferimento univoco stabile** per immobile (per slug/URL permanenti)?

**Ciclo di vita**
11. Un immobile **venduto** resta nel feed (marcato) o **sparisce**? E gli **archiviati**?
12. Le **date** (pubblicazione/aggiornamento) sono presenti e in che fuso/formato?

---

## 5. Credenziali necessarie (da raccogliere)

Da salvare come **variabili d'ambiente** (mai hardcodate, mai committate):

| Scenario | Variabili d'ambiente attese |
|---|---|
| Feed URL (A/B) | `REALSMART_FEED_URL`, eventuale `REALSMART_API_KEY` / token |
| API REST (C) | `REALSMART_API_BASE`, `REALSMART_API_KEY` (o client id/secret OAuth) |
| FTP/SFTP | `REALSMART_FTP_HOST`, `REALSMART_FTP_USER`, `REALSMART_FTP_PASS`, `REALSMART_FTP_PATH` |
| Webhook push | `REALSMART_WEBHOOK_SECRET` (per verificare la firma delle chiamate in ingresso) |

Aggiungere le chiavi a `.env.local` (dev) e ai secret dell'hosting (prod). Documentare in `.env.example`.

---

## 6. Checklist endpoint (quando avremo gli accessi)

- [ ] URL/host di produzione confermato e raggiungibile dal nostro server.
- [ ] Metodo di auth funzionante (test con `curl` o script isolato).
- [ ] Esempio reale di payload salvato come fixture per test (`app/lib/realsmart/__fixtures__/`).
- [ ] Mappatura payload → `RealSmartListingRaw` scritta (parser in `client.ts`).
- [ ] Gestione paginazione (se il feed è paginato).
- [ ] Gestione errori/timeout + fallback ai mock già presente.
- [ ] `revalidate`/tag ISR verificati in staging.
- [ ] Verifica che tutti i **campi necessari** (sez. 7) siano popolati.

---

## 7. Campi necessari per il sito

Mappatura verso `NormalizedProperty` (vedi `app/lib/realsmart/types.ts`). Allineata al modello
immobili già in uso (`app/lib/properties.ts`).

**Obbligatori**
- `codice` (univoco, stabile) → `id` + base dello `slug`
- `titolo` → `title`
- `prezzo` → `price` + `priceLabel` (formattato it-IT, es. `€ 420.000`; assente → "Prezzo su richiesta")
- `contratto` (vendita/affitto) → `contract`
- `tipologia` → `type`
- `localita.comune` / `localita.provincia` → `town` / `province`
- `statoPubblicazione` → `status` (+ badge derivati)
- almeno una `media` foto → `images[]`

**Consigliati**
- `descrizione`, `mq`, `locali`, `bagni`, `piano`, `classeEnergetica`,
  `caratteristiche[]`, `localita.indirizzo`, `dataPubblicazione`, `dataAggiornamento`,
  `riferimento` (mostrato come "RIF. ...").

Campi mancanti: gestiti in modo **difensivo** da `normalize.ts` (0, stringa vuota o `undefined`),
mai errore in pagina.

---

## 8. Gestione immobili venduti / archiviati

Regola attuale (in `client.ts`, `HIDDEN_STATUSES`):
- `draft`, `sold`, `withdrawn` → **esclusi** dalla lista pubblica.
- `reserved` → **mostrato** con badge "Sotto proposta".
- `published` → mostrato.

Se il feed **non marca** i venduti ma li **rimuove**, l'esclusione è automatica (spariscono dal feed).

Opzione futura (social proof): mostrare i "Venduto" in una sezione dedicata. Il badge "Venduto"
è **già derivato** in `normalize.ts`; basterà rimuovere `"sold"` da `HIDDEN_STATUSES` e filtrare
in una vista apposita. Da confermare col cliente se desiderato.

---

## 9. Strategia cache

- **ISR polling** come default: `REVALIDATE_SECONDS = 720` (12 min) in `client.ts`.
- Usare `next: { revalidate: REVALIDATE_SECONDS, tags: ["realsmart-listings"] }` sulla `fetch` reale.
- Se disponibile **webhook**: aggiungere una route che, verificata la firma
  (`REALSMART_WEBHOOK_SECRET`), chiama `revalidateTag("realsmart-listings")` per l'aggiornamento
  immediato di nuovi/venduti, mantenendo l'ISR come rete di sicurezza.
- Le **immagini** RealSmart (host esterno) vanno aggiunte a `images.remotePatterns` di
  `next.config` prima di usarle con `next/image` (da fare quando avremo gli URL reali).

---

## 10. Privacy da confermare

- **Indirizzo civico completo**: pubblicabile o solo comune/zona? (`address` è opzionale apposta.)
- **Foto**: diritti d'uso e watermark; volti/targhe/dati sensibili nelle immagini.
- **Dati catastali / proprietari**: non devono finire nel feed pubblico né nel sito.
- **Basi giuridiche e informativa**: allineare con l'informativa privacy del sito.

---

## 11. Fallback

- Se la sorgente reale è irraggiungibile o risponde con errore, `getLiveListings()` **ripiega
  sui mock** invece di mostrare una pagina vuota o un errore (già implementato con `try/catch`).
- **Logging attivo (fatto):** ogni fallback logga il motivo lato server —
  `"[realsmart] feed non disponibile → fallback ai mock: <messaggio>"` (`client.ts`). Mai esposto
  al client.
- **Va MONITORATO.** Il fallback evita la pagina bianca, ma **maschera** un feed rotto: se non lo
  guardi, potresti presentare **mock demo credendoli reali**. Regola: prima di ogni call cliente,
  `GET /api/health` (`listingsMode` deve essere `realsmart`) **e** un'occhiata ai log per il
  messaggio di fallback. In produzione ad alto valore: aggiungere **alerting** su quel log.
- **Preview:** il badge di anteprima mostra la modalità **prevista** (`Immobili: RealSmart live`),
  non l'esito runtime — con `unstable_cache` il "wasFallback" per-richiesta è inaffidabile
  (vedi `app/lib/listings.ts`). Quindi la modalità è nel badge, ma il **fallback effettivo** si
  verifica dai log, non dal badge.
- I mock restano utili anche in dev/preview e per i test di regressione della normalizzazione.

---

## File coinvolti

- `app/lib/realsmart/types.ts` — contratti di tipo (raw + normalized).
- `app/lib/realsmart/normalize.ts` — `normalizeRealSmartListing()` (pura, difensiva).
- `app/lib/realsmart/mocks.ts` — `getMockRealSmartListings()` (6 immobili zona Tradate/Varese).
- `app/lib/realsmart/client.ts` — `getLiveListings()`, `REVALIDATE_SECONDS`, punto di innesto fetch reale.
- `app/lib/realsmart/index.ts` — barrel dei re-export.
