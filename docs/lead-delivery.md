# Consegna dei lead — modello canonico

Fonte unica di verità su come arriva un lead del form contatti. Sostituisce le note contraddittorie
del vecchio `.env.example` (che documentava e insieme "rimuoveva" `SHEETS_WEBHOOK_URL`/`CONTACT_FORM_MODE`).

## Le due strade di un lead

Al submit del form (`app/components/Contact.tsx`) partono **due strade indipendenti**:

1. **WhatsApp (client)** — si apre `wa.me` precompilato. È il canale **immediato**, **NON una
   consegna**: è l'utente a premere invio. La UI dice *"stiamo aprendo WhatsApp"*, mai "inviato".
2. **`/api/lead` (server)** — recapita il lead all'agenzia, best-effort, su due canali:
   - **Email (Resend)** — il recapito reale. Riusa la **stessa** configurazione dell'assistente
     (`ASSISTANT_EMAIL_API_KEY`, `ASSISTANT_EMAIL_FROM`, `ASSISTANT_LEAD_EMAIL_TO`). Un solo
     canale email per tutto il sito.
   - **Google Sheet (opzionale)** — se `SHEETS_WEBHOOK_URL` è impostata, salva il lead anche su
     foglio. In **aggiunta** all'email, non al posto.

   Se **né** email **né** sheet sono configurati, `/api/lead` risponde `ok:false` e resta solo il
   WhatsApp. `serverDelivered = email || sheet`.

L'assistente conversazionale usa lo **stesso** canale email (`prepareEmailEnquiry` → Resend).

## Matrice variabili → capacità

| Variabile | Capacità | Vuota = |
| --- | --- | --- |
| `ASSISTANT_EMAIL_API_KEY` | Email lead (Resend) — form **e** assistente | Nessuna email; l'assistente non finge l'invio |
| `ASSISTANT_EMAIL_FROM` | Mittente (dominio verificato) | Default `assistente@domustua.it` |
| `ASSISTANT_LEAD_EMAIL_TO` | Destinatario | Default `immobiliare@domustua.it` |
| `SHEETS_WEBHOOK_URL` | Persistenza opzionale su Google Sheet | Nessun salvataggio su foglio |
| — WhatsApp — | UX immediata (client), sempre disponibile | (non una consegna) |

**Rimosse (dead vars):** `CONTACT_FORM_MODE` (il form non ha "modalità"), `CONTACT_EMAIL_TO` (il
destinatario è `ASSISTANT_LEAD_EMAIL_TO`). Il codice non le leggeva più.

## Reporting veritiero

`/api/health` → `integrations.leadDelivery`:
```json
{ "email": false, "sheet": false, "whatsapp": true, "serverDelivered": false }
```
Il badge di anteprima (`demoChecklist`) mostra "Email" / "Google Sheet" / "Email + Google Sheet"
/ "Solo WhatsApp (nessuna consegna server)". WhatsApp **non** viene mai chiamato "backend": era il
difetto del vecchio `leadBackend`, che riportava "Solo WhatsApp" anche con l'email attiva.

Test: `app/lib/__tests__/lead.test.ts` (matrice email × sheet), `app/lib/__tests__/health.test.ts`.

## Priorità / retry / idempotenza (canali multipli)

Email e Sheet sono **indipendenti e best-effort**: un canale che fallisce non blocca l'altro.
`/api/lead` prova entrambi e risponde `ok:true` se **almeno uno** ha preso in carico il lead,
`ok:false` se nessuno. Non c'è retry automatico (il lead resta comunque nel WhatsApp dell'utente).
Idempotenza: nessuna, ma l'honeypot + il rate limit riducono i doppioni; un eventuale doppio invio
genera al più due email/righe, senza effetti collaterali.

## Consegna email — checklist DNS (da fare su chi ospita il dominio)

Perché le email di lead non finiscano in spam o vengano rifiutate, il dominio mittente
(`ASSISTANT_EMAIL_FROM`, es. `@domustua.it`) va autenticato presso Resend:

1. **Dominio verificato in Resend** — aggiungere il dominio nel pannello Resend e pubblicare i
   record DNS che indica.
2. **SPF** — record TXT che autorizza Resend a spedire per il dominio (fornito da Resend).
3. **DKIM** — record CNAME/TXT di firma (forniti da Resend) — è ciò che regge la reputazione.
4. **DMARC** — record TXT `_dmarc` con almeno `p=none` (monitoraggio), poi `quarantine`/`reject`.
5. **Mittente** — `ASSISTANT_EMAIL_FROM` su un dominio verificato (altrimenti Resend rifiuta).
6. **Destinatario** — confermare `ASSISTANT_LEAD_EMAIL_TO` (default `immobiliare@domustua.it`).

### Procedura di test (dopo la configurazione)
- Impostare le tre `ASSISTANT_EMAIL_*` su Vercel e rideployare.
- `curl https://<dominio>/api/health` → `integrations.leadDelivery.email` deve essere `true`.
- Inviare un lead di prova dal form: verificare l'arrivo all'indirizzo destinatario e che **non**
  finisca in spam (SPF/DKIM allineati).

## Cosa serve da Domus Tua
- Confermare gli indirizzi email operativi (mittente e destinatario).
- Decidere se attivare anche la **persistenza su Google Sheet** (`SHEETS_WEBHOOK_URL`) o restare
  su sola email.
- Pubblicare i record DNS (SPF/DKIM/DMARC) forniti da Resend per il dominio mittente.
