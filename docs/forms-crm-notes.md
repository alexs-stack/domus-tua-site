# Form & CRM — note

## Comportamento attuale
- Il form in `app/components/Contact.tsx` **non ha backend**: al submit compone un messaggio e apre
  **WhatsApp** (`wa.me`) con i dati precompilati. Dopo l'apertura mostra un messaggio inline di
  conferma con numero di fallback (utile se il popup è bloccato su mobile).
- Toggle "Vendere / Acquistare" per segmentare l'intento.
- CTA WhatsApp e contatti (telefono, email, indirizzo, mappa) sempre disponibili.

## Segmentazione lead (da strutturare)
Per un handoff CRM pulito, ogni lead dovrebbe portare:
- **tipo lead**: `vendere` | `acquistare` | `open-domus` | `altro`
- **pagina sorgente** (es. `/vendi`, `/acquista`, `/case/<slug>`)
- **immobile selezionato** (slug/riferimento, se il lead parte da una scheda)
- nome, contatto, messaggio, zona/budget se dalla ricerca

Oggi questi campi sono parzialmente impliciti nel messaggio WhatsApp. Vanno resi espliciti quando si
aggiunge un backend.

## Opzioni future
1. **Endpoint email/serverless** (es. route handler Next + provider email) con salvataggio lead.
2. **CRM / gestionale**: invio del lead a RealSmart o a un CRM (webhook/API) con i campi sopra.
3. **Doppio canale**: WhatsApp per l'immediatezza + salvataggio server per il tracciamento.

## Privacy
Aggiungere consenso e informativa (link a `/privacy`) prima di attivare un salvataggio server dei
dati. Vedi `docs/deployment-notes.md` e le pagine `/privacy`, `/cookie` (testo da validare).
