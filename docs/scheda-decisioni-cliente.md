# Domus Tua — scheda decisioni per il go-live

Cosa serve **da voi** per mettere online il sito, e le poche scelte da confermare. Il lavoro tecnico
di risanamento è concluso (13 interventi, tutti verificati); il codice è pronto. Restano azioni e
decisioni che spettano all'agenzia, non allo sviluppo.

Ogni voce ha: **cosa è**, le **opzioni**, cosa succede **oggi** (il valore di sicurezza già impostato),
e la **proposta**. Dove c'è 🔴 la voce **blocca** la messa online finché non è sistemata; 🟠 = da
decidere ma con un default sicuro già attivo; ⚪️ = facoltativa.

---

## A. Azioni che bloccano il go-live 🔴

### A1. Testi legali (Privacy e Cookie Policy)
- **Cosa è:** le pagine Privacy e Cookie devono avere il testo definitivo, validato. Finché non è
  approvato, il sito **si dichiara di proposito non indicizzabile** (un cancello di sicurezza).
- **Cosa fare:** fornire i due testi definitivi (traccia in `docs/legal-launch-inventory.md`), metterli
  in pagina, poi accendere l'approvazione (`LEGAL_DOCS_APPROVED=true`).
- **Proposta:** far vedere le due pagine al vostro consulente/commercialista prima di approvare.

### A2. Dominio di produzione
- **Cosa è:** l'indirizzo pubblico definitivo (es. `www.domustua.it`). Serve al sito per generare
  correttamente link, anteprime social e mappa del sito.
- **Cosa fare:** puntare il dominio al sito (DNS) e impostare `NEXT_PUBLIC_SITE_URL` sul dominio finale.
- **Nota:** il cutover DNS e la Search Console li gestite voi/il vostro fornitore di dominio.

### A3. Correzione dei contenuti nel gestionale (feed RealSmart)
- **Cosa è:** un controllo automatico blocca la pubblicazione di descrizioni con **segnaposto** tipo
  `____` (testo incompleto). Oggi due immobili li hanno: **T447** e **T2055**.
- **Cosa fare:** completare quelle descrizioni in RealSmart. È un controllo **voluto**: resta "rosso"
  finché il testo non è a posto, così non va online un annuncio con buchi.
- **Proposta:** correggere in gestionale; nessun intervento sul sito necessario.

---

## B. Scelte da confermare (default sicuro già attivo) 🟠

### B1. Immobili venduti — come trattarli sui motori di ricerca
- **Cosa è:** quando un immobile è venduto, la sua pagina come si comporta su Google?
- **Opzioni:**
  1. **`noindex`** *(oggi)* — la pagina resta online per chi ha il link, ma esce dall'indice Google.
  2. **`redirect`** — chi apre il vecchio link viene portato alla lista "Acquista".
  3. **`410 / rimosso`** — si dichiara la pagina non più esistente (richiede un piccolo intervento in più).
- **Proposta:** tenere **`noindex`**: non si perdono i contatti di chi ha salvato il link, ma non si
  accumulano pagine "vendute" nei risultati di ricerca.

### B2. "Domus D.O.C. / Documenti verificati" sul singolo immobile
- **Cosa è:** il badge/di­citura che attesta il protocollo Domus D.O.C. su un immobile.
- **Come funziona oggi:** appare **solo** se lo confermate voi esplicitamente per quell'immobile — mai
  dedotto dal testo dell'annuncio. Senza conferma, non appare.
- **Proposta:** confermare questa regola (evidenza esplicita per immobile). È una dichiarazione di
  conformità: meglio non automatica.

### B3. Lingue del sito
- **Cosa è:** il selettore multilingua (it/en/fr/de/es).
- **Oggi:** **solo italiano** (selettore nascosto), consigliato per la prima presentazione.
- **Proposta:** partire in italiano; le altre lingue si accendono quando i testi tradotti sono pronti.

---

## C. Assistente e AI 🟠 / ⚪️

### C1. Assistente (chat) sul sito
- **Cosa è:** la chat che risponde ai visitatori e raccoglie richieste.
- **Serve:** una chiave provider (Google `GEMINI_API_KEY`). Senza, la chat resta nascosta.
- **Proposta:** accenderla con Gemini (già scelto e calibrato). Decisione: **on/off al lancio**.

### C2. Riscrittura AI delle descrizioni (arricchimento) ⚪️
- **Cosa è:** un aiuto AI che **propone** descrizioni migliori partendo da quelle del gestionale.
- **Oggi:** **spenta**. È costruita "sicura per default": genera **bozze**, non pubblica niente da sola,
  e i controlli su privacy/fatti sono automatici e non affidati all'AI.
- **Decisioni se la volete usare:**
  1. **Attivarla?** (oggi no).
  2. **Chi approva** le descrizioni proposte prima che vadano online.
  3. **Dove salvarle** — proposta più semplice: un file versionato nel repo (nessun fornitore in più).
- **Proposta:** lasciarla spenta al lancio; valutarla dopo, quando il sito è online e stabile.

---

## D. Facoltative (migliorie, non bloccanti) ⚪️

### D1. Email delle richieste (lead)
- **Cosa è:** l'invio via email delle richieste dal sito/assistente.
- **Oggi:** senza chiave email configurata, **WhatsApp e telefono restano attivi** e l'assistente non
  finge mai di aver inviato. Con una chiave (Resend) si aggiunge il canale email.
- **Proposta:** configurare l'email quando volete il canale in più; non blocca il lancio.

### D2. Protezione anti-abuso condivisa
- **Cosa è:** il limite di richieste per proteggere i moduli/chat da abusi. Funziona già "best-effort";
  con un piccolo servizio (Upstash Redis) diventa condiviso e più robusto tra le istanze.
- **Proposta:** facoltativa; consigliata se prevedete traffico alto.

### D3. Widget recensioni (Trustindex) e Instagram
- **Cosa è:** i riquadri recensioni e social. Si caricano **solo dopo il consenso cookie**.
- **Cosa fare:** fornire gli URL dei widget quando li volete attivi.

---

## Riepilogo — sequenza consigliata
1. 🔴 Completare **A1** (legali), **A2** (dominio), **A3** (segnaposto T447/T2055).
2. 🟠 Confermare **B1** (venduti = noindex), **B2** (D.O.C. su conferma), **B3** (solo italiano).
3. 🟠 Decidere **C1** (assistente on/off).
4. Accendere il feed live e spegnere il badge "contenuti in verifica".
5. ⚪️ Valutare con calma **C2** (AI descrizioni) e le voci **D** dopo il lancio.

> I dettagli tecnici di ogni voce sono in `docs/launch-readiness-audit.md` e in `.env.example`.
