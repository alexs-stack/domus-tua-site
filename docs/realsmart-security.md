# RealSmart — sicurezza e privacy dei dati

Regole vincolanti su **cosa può e cosa NON può** entrare nel sito pubblico Domus Tua dal
gestionale RealSmart. Vale per la vetrina pubblica, per la ricerca on-site e per qualsiasi
funzione di **RAG / AI** che indicizzi i contenuti degli immobili.

Principio guida: **il sito è una vetrina pubblica in sola lettura.** Espone SOLO ciò che
un immobile in vendita mostrerebbe in una vetrina d'agenzia. Tutto il resto resta in RealSmart.

Documenti collegati: `docs/realsmart-integration-notes.md` (tecnico),
`docs/realsmart-client-questions.md` (domande al cliente).

---

## 1. Cosa NON deve MAI finire nel sito pubblico o nell'indice di ricerca/RAG

- **Dati personali dei proprietari/venditori**: nome, cognome, telefono, email, codice fiscale,
  recapiti. Un immobile non nomina mai chi lo vende.
- **Dati personali di acquirenti / persone interessate** e qualsiasi contatto raccolto altrove.
- **Documenti catastali e privati**: visure catastali, planimetrie catastali con dati
  identificativi, atti di provenienza, rogiti, APE nominativi, mutui, ipoteche, dati particellari
  che identifichino univocamente proprietà/proprietario.
- **Indirizzo civico completo** quando non esplicitamente autorizzato: di default pubblichiamo
  **comune + zona/quartiere**, non "Via X n. 12". Il campo `address` è opzionale apposta.
- **Contenuti di Drive/archivi privati**: cartelle, file, note interne, documenti condivisi
  dall'agenzia che non siano stati esplicitamente marcati come pubblici. Nessun contenuto di
  storage privato entra nel search/RAG.
- **Note interne, trattative, prezzi riservati, margini, provvigioni, storico offerte.**
- **Metadati sensibili delle foto**: EXIF con geolocalizzazione precisa, volti di terzi, targhe,
  documenti o schermi visibili nelle immagini.

## 2. Cosa È pubblicabile (solo annunci pubblici)

- Solo immobili con **stato pubblicabile** (es. `published`, e `reserved` con badge "Sotto
  proposta"). Gli stati `draft`, `sold`, `withdrawn` sono **esclusi** dalla lista pubblica
  (vedi `HIDDEN_STATUSES` in `app/lib/realsmart/client.ts`).
- Dati **commerciali dell'annuncio**: titolo, descrizione editoriale, prezzo (o "su richiesta"),
  tipologia, comune/zona, mq, locali, bagni, piano, classe energetica, caratteristiche,
  foto autorizzate, riferimento commerciale (es. "RIF. 1043").
- In sintesi: **solo ciò che comparirebbe legittimamente in una vetrina o su un portale.**

## 3. Difese già presenti nel codice

- **Filtro stati non pubblici** in `client.ts` (`HIDDEN_STATUSES`): venduti/ritirati/bozze non
  raggiungono la pagina.
- **Stato sconosciuto → `draft`** in `normalize.ts`: uno stato non riconosciuto NON viene
  pubblicato per errore (fail-safe: nel dubbio, nascondi).
- **Parsing difensivo** in `parse.ts`: nessun campo extra "passa" implicitamente. La
  normalizzazione (`normalize.ts`) costruisce `NormalizedProperty` con una **whitelist** di campi;
  eventuali campi sensibili presenti nel feed grezzo **non vengono copiati** nella forma pubblica.
- **`address` opzionale**: l'indirizzo civico completo si popola solo se esplicitamente voluto.

### Regola per il RAG / la ricerca AI

Indicizzare **solo `NormalizedProperty`** (la forma pubblica ripulita), **mai** il payload grezzo
RealSmart né file esterni (Drive, catasto, allegati). La forma normalizzata è per costruzione una
whitelist: è il confine di sicurezza per cosa l'AI può "vedere" e citare.

## 4. Segreti e credenziali

- Credenziali RealSmart (feed URL, API key, FTP, webhook secret) **solo in variabili d'ambiente
  server-side**: `REALSMART_*`. Mai hardcodate, mai committate, mai in `NEXT_PUBLIC_*`.
- L'unico flag pubblico è `NEXT_PUBLIC_USE_REALSMART` (on/off della modalità live): **non è un
  segreto** e non espone alcuna credenziale.
- Le chiamate al feed/API avvengono **solo lato server** (Server Components / route server): il
  browser non vede né l'endpoint né i token.
- Un eventuale **webhook** in ingresso va **verificato** con `REALSMART_WEBHOOK_SECRET` (firma)
  prima di innescare qualsiasi rivalidazione.

## 5. Immagini

- Servire solo immagini **autorizzate** dall'agenzia/RealSmart, con host dichiarati in
  `next.config` (`images.remotePatterns`).
- Rimuovere/ignorare **EXIF sensibili** (geolocalizzazione) dove possibile.
- Verificare che nelle foto non compaiano **volti di terzi, targhe, documenti o schermi** con
  dati leggibili.

## 6. Note GDPR

- **Base giuridica**: la pubblicazione degli annunci risponde all'attività commerciale
  dell'agenzia; **non** deve comportare la diffusione di dati personali di proprietari o terzi.
- **Minimizzazione**: pubblicare solo i dati necessari a presentare l'immobile (principio di
  minimizzazione). Nel dubbio su un campo, **non pubblicarlo**.
- **Indirizzo**: trattare l'indirizzo civico completo come dato potenzialmente identificativo;
  pubblicarlo solo se necessario e autorizzato.
- **Informativa privacy del sito**: deve coprire i dati raccolti via **form/contatti** (lead) e
  citare RealSmart come sistema gestionale. I lead dei form seguono il flusso CRM
  (`docs/forms-crm-notes.md`), separato dai dati pubblici degli annunci.
- **Diritti degli interessati**: le richieste (accesso, cancellazione) si gestiscono sul
  gestionale/CRM, non sul sito: il sito non è la fonte dei dati personali.
- **Conservazione**: il sito non conserva dati degli annunci in un proprio database; è una vista
  in cache (ISR) del gestionale. Rimuovere un immobile in RealSmart lo rimuove dal sito.

---

## Checklist pre go-live (privacy/sicurezza)

- [ ] Nessun dato personale di proprietari/terzi nel payload che pubblichiamo.
- [ ] Nessun documento catastale/privato o contenuto di Drive nel search/RAG.
- [ ] Solo stati pubblicabili visibili; venduti/ritirati/bozze esclusi.
- [ ] Indirizzo civico pubblicato solo se autorizzato (altrimenti comune/zona).
- [ ] Credenziali solo in env `REALSMART_*`; nessun segreto in `NEXT_PUBLIC_*` né nel client bundle.
- [ ] Webhook (se presente) con verifica firma `REALSMART_WEBHOOK_SECRET`.
- [ ] Host immagini autorizzati in `next.config`; foto senza dati sensibili/EXIF geolocalizzato.
- [ ] Informativa privacy del sito aggiornata (form/lead + menzione gestionale).
- [ ] RAG/ricerca indicizza solo `NormalizedProperty`, mai il grezzo o file esterni.
