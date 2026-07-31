# Lead — email, WhatsApp, telefono

Tre canali, un solo backend.

| Canale | Chi agisce | Dove arriva |
|---|---|---|
| **Form contatti** | il sito, server-side | email a `immobiliare@domustua.it` |
| **WhatsApp** | l'utente (apre il link) | `+39 346 604 2314` |
| **Telefono** | l'utente | `0331 844898` |

**Nessuna persistenza**: nessun database, nessun foglio di calcolo, nessun gestionale esterno.
Il lead diventa un'email e basta. Il vecchio flusso via Google Apps Script / Google Sheets
(`SHEETS_WEBHOOK_URL`, `CONTACT_FORM_MODE`) è stato rimosso da codice e documentazione, e un test
di regressione impedisce che rientri.

## Come funziona

1. Il form valida lato client (nome, contatto, consenso privacy) e fa `POST /api/lead`.
2. `app/api/lead/route.ts` applica rate limit per IP, cap sul corpo, honeypot, e rivalida tutto
   lato server (`app/lib/forms/validateLead.ts`) — il consenso è **obbligatorio** anche qui, non
   solo nel form.
3. `app/lib/forms/email.ts` compone l'email e la spedisce con Resend.
4. **La conferma appare solo se il provider ha accettato il messaggio.** In ogni altro caso il
   form dice che la richiesta non è partita e mostra WhatsApp e telefono.

### Cosa contiene l'email

Oggetto: `Richiesta dal sito · <tipo di richiesta> · <nome>`.

Corpo (solo i campi effettivamente compilati — niente righe "non fornito"):
tipo di richiesta, nome, contatto, zona, tipologia, budget, caratteristiche, immobile con l'URL
della scheda, messaggio, pagina di origine, data e ora (fuso Europe/Rome), conferma del consenso.

`Reply-To` = l'email dell'utente, quando il campo contatto ne contiene una. Se ha lasciato un
telefono, il Reply-To non si imposta (meglio nessun Reply-To che uno inventato).

Il corpo è in **testo semplice** di proposito: il contenuto arriva da un form pubblico e in testo
semplice non esiste superficie di injection.

## Configurazione (Vercel → Settings → Environment Variables)

| Variabile | Ambienti | Valore |
|---|---|---|
| `RESEND_API_KEY` | Production, Preview | chiave da [resend.com/api-keys](https://resend.com/api-keys) |
| `LEAD_FROM_EMAIL` | Production, Preview | mittente su dominio **verificato** in Resend, es. `Domus Tua Sito <sito@domustua.it>` |
| `LEAD_TO_EMAIL` | Production, Preview | opzionale — vuoto = `immobiliare@domustua.it` |

Tutte e tre sono **server-only**: nessun prefisso `NEXT_PUBLIC_`, nessuna chiave nel bundle del
browser.

Passi:

1. Crea l'account Resend e aggiungi il dominio `domustua.it` (o il sottodominio di invio).
2. Inserisci in DNS i record SPF/DKIM che Resend indica e attendi la verifica.
   Finché il dominio non è verificato, l'invio fallisce e il form mostra WhatsApp e telefono.
3. Crea una API key con permesso di sola spedizione e incollala in `RESEND_API_KEY`.
4. Imposta `LEAD_FROM_EMAIL` con un indirizzo del dominio verificato.
5. Redeploy, poi verifica: `GET /api/health` → `integrations.emailLeadConfigured: true`.
6. Invia una richiesta di prova dal form e controlla che arrivi in casella.

## Sicurezza

- Validazione **server-side** con whitelist dei campi: tutto ciò che non è previsto viene scartato.
- Cap di lunghezza per campo + cap sul corpo della richiesta (32 KB → `413`).
- Caratteri di controllo rimossi; a capo ammessi solo nel messaggio libero, così un nome con `\n`
  non può spezzare l'oggetto dell'email.
- Honeypot (`company`): se compilato, risposta `ok` senza spedire nulla.
- Rate limit per IP: 8 richieste / 10 minuti → `429` con `Retry-After`.
- Consenso privacy obbligatorio lato server.
- **Nessun PII nei log**: si registra solo l'esito e il tipo di richiesta, mai nome, contatto o
  messaggio — in nessun ambiente.

## WhatsApp

I link sono costruiti in `app/lib/forms/whatsapp.ts` (modulo puro, testato) e sono sempre
correttamente codificati:

- **schede immobile** → titolo, riferimento commerciale (se il feed lo espone) e **URL della
  scheda**, così l'agenzia apre subito l'annuncio giusto;
- **form e ricerca** → il **tipo di richiesta** ("Cerca casa", "Vuole vendere"…);
- **ripiego del form** → il messaggio completo del lead già compilato.

WhatsApp lo apre **l'utente**: il sito non dichiara mai "messaggio inviato" per quel canale.
L'unico invio vero è l'email.

## Stato in `/api/health`

```json
{
  "integrations": {
    "leadBackend": "email",
    "emailLeadConfigured": true,
    "leadRecipientConfigured": true,
    "whatsappConfigured": true
  }
}
```

`emailLeadConfigured: false` in produzione significa che **il form non invia**: è un blocco al
go-live, non un dettaglio.

## Test

`app/lib/__tests__/lead.test.ts` copre: email consegnata, provider non configurato, errore del
provider, provider irraggiungibile, payload invalido, consenso mancante, spam da honeypot,
payload enorme, rate limit, link WhatsApp (codifica, URL della scheda, tipo di richiesta) e la
regressione "nessun Google Sheets". Il provider non viene mai chiamato davvero: la fetch globale
è sostituita da uno stub.
