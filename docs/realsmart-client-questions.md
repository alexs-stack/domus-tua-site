# RealSmart — domande per il cliente / RealSmart

Elenco puntuale di domande da porre al cliente (agenzia) e/o al supporto **RealSmart** per
completare l'integrazione del sito. Finché non abbiamo queste risposte, il sito resta sui
**mock normalizzati** (`NEXT_PUBLIC_USE_REALSMART` non impostato a `"true"`).

Contesto tecnico e mappatura dei campi: `docs/realsmart-integration-notes.md`.
Vincoli su privacy e dati pubblicabili: `docs/realsmart-security.md`.

> Suggerimento: chiedere sempre **un esempio reale** del payload (feed/risposta API) così com'è,
> anche solo per 1–2 immobili. Un file vero vale più di dieci risposte a parole e ci permette di
> scrivere subito il parser reale (`app/lib/realsmart/parse.ts`).

---

## 1. Disponibilità della sorgente (feed / API / FTP)

1. È disponibile un **feed dedicato** per il nostro sito, oppure solo il **feed che alimenta i
   portali** (tipo Immobiliare.it / Casa.it), oppure delle **API**?
2. Nel piano/contratto attuale dell'agenzia, quali di queste opzioni sono **già incluse** e quali
   comportano un **costo aggiuntivo** o un'attivazione?
3. Qual è la modalità di **consegna** dei dati:
   - un **URL** che possiamo interrogare (HTTP GET)?
   - un **file** depositato su **FTP/SFTP**?
   - un **webhook** che notifica le modifiche verso un nostro endpoint?
4. Potete fornirci un **esempio reale** del payload per 1–2 immobili (anche di prova)?

## 2. Formato e schema

5. Il feed/risposta è in **XML** o in **JSON**?
6. Esiste uno **schema, XSD, o documentazione dei campi** scaricabile?
7. Se XML: qual è lo **standard**? (es. formato "portali" tipo Immobiliare.it XML, o un formato
   proprietario RealSmart?)
8. C'è un **envelope/involucro** attorno alla lista (es. `{ listings: [...] }`, un root element XML,
   metadati di testata) o è un array/elenco diretto di immobili?
9. Il feed è **paginato**? Se sì, come (cursore, offset, numero pagina, link "next")?

## 3. Autenticazione e accesso

10. Come ci si **autentica**? (API key in header, Basic auth, token OAuth, URL con token,
    IP allowlist, credenziali FTP…)
11. Serve una **IP allowlist**? In tal caso servono gli **IP in uscita** del nostro hosting
    (li forniamo noi una volta scelto/confermato l'ambiente di produzione).
12. Ci sono **ambienti separati** (staging/test vs produzione) con credenziali diverse?

## 4. Immagini e media

13. Le **foto** sono esposte come **URL diretti e stabili**? Su quale **host/CDN**?
    (Ci serve per autorizzare il dominio in `next.config` → `images.remotePatterns`.)
14. Le immagini hanno **watermark**? Quali **risoluzioni** sono disponibili?
15. Ci sono **vincoli d'uso/licenza** sulle foto (chi le ha scattate, diritti di pubblicazione)?
16. Oltre alle foto, il feed espone **planimetrie**, **video**, **virtual tour**? Con quale
    campo/tipo li distinguiamo?
17. Esiste un campo per **ordinare** i media (foto di copertina, sequenza gallery)?

## 5. Stato e ciclo di vita dell'annuncio

18. Come viene espresso lo **stato** di un immobile? Quali valori esatti? (es. attivo, sotto
    proposta/opzionato, venduto, affittato, ritirato, bozza…)
19. Un immobile **venduto/affittato** **resta nel feed** (marcato con uno stato) oppure
    **sparisce**?
20. E gli immobili **archiviati/ritirati**: restano marcati o vengono rimossi?
21. Come si distingue **vendita** da **affitto** (campo `contratto` o simile)? Ci sono altri
    tipi (es. asta, nuova costruzione)?
22. Esiste un **codice/riferimento univoco e stabile** per immobile, che non cambia nel tempo?
    (Ci serve per URL/slug permanenti e per non "perdere" un immobile tra un aggiornamento e l'altro.)

## 6. Freschezza e aggiornamenti

23. Ogni quanto **rigenerate/aggiornate** il feed lato RealSmart?
24. Le **date** di pubblicazione e ultimo aggiornamento sono presenti? In che **formato e fuso**
    orario (ISO 8601 UTC? ora locale?)?
25. È supportato un **webhook/notifica** al cambio di stato (nuovo, ribasso prezzo, venduto)?
    Se sì, come si **verifica la firma** della chiamata (secret condiviso)?

## 7. Limiti tecnici

26. Ci sono **rate limit** (numero di richieste al minuto/ora) o **finestre orarie** in cui
    interrogare il feed/API?
27. C'è un **limite di dimensione** del payload o un numero massimo di immobili per risposta?
28. Esiste un **contatto tecnico** di riferimento in RealSmart per il debug in fase di collegamento?

## 8. Contenuti editoriali

29. Possiamo avere **descrizioni/testi personalizzati** per il sito, o solo quelli usati sui
    portali? (I testi dei portali sono spesso standardizzati e non "nostri".)
30. Quali **campi** sono effettivamente popolati e affidabili per ogni immobile? (mq, locali,
    bagni, piano, classe energetica, spese, riferimento…)

---

## Cosa serve a noi per collegare (riepilogo operativo)

Una volta ottenute le risposte, ci bastano:

- un **esempio reale** del payload (ripulito da dati sensibili — vedi `realsmart-security.md`);
- la **modalità** (feed URL / API / FTP) e le **credenziali** da mettere in variabili d'ambiente:
  `REALSMART_FEED_URL`, `REALSMART_API_KEY`/token, `REALSMART_API_BASE`,
  eventuali `REALSMART_FTP_*`, e `REALSMART_WEBHOOK_SECRET` se ci sarà un webhook;
- l'elenco degli **host immagini** da autorizzare in `next.config`.

Poi resta solo da: mappare i campi reali in `app/lib/realsmart/parse.ts`, cablare la fetch in
`app/lib/realsmart/client.ts`, e impostare `NEXT_PUBLIC_USE_REALSMART="true"` in produzione.
