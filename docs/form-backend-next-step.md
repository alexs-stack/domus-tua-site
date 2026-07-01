# Form lead — dove va il prossimo passo (backend)

Documento di lavoro per scegliere **dove salvare/instradare i lead** del form contatti quando
supereremo l'MVP. Confronta le destinazioni possibili con pro/contro e indica il passo consigliato.

---

## Da dove partiamo (stato attuale — MVP)

Il form in `app/components/Contact.tsx` ha **tre intenti chiari** (`Voglio vendere` / `Cerco casa` /
`Ho una domanda`) più `Open Domus`, con **campi diversi per intento**:

- **Venditore**: nome, telefono/email, comune dell'immobile, tipologia, messaggio.
- **Acquirente**: nome, telefono/email, zona desiderata, budget, tipologia, caratteristiche.
- **Domanda**: nome, contatto, messaggio.

Al submit **non c'è backend**: si valida lato client (nome + contatto obbligatori), si costruisce
un oggetto `Lead` tipizzato e si apre **WhatsApp** con il messaggio precompilato.

Pezzi già pronti e riusabili per il backend:

- `app/lib/forms/lead.ts` — tipo **`Lead`** (intent, name, contact + campi opzionali) e
  `formatLeadMessage(lead)`. È **già il payload** che una qualsiasi destinazione dovrà ricevere.
- `app/lib/forms/whatsapp.ts` — `buildWhatsAppUrl(baseHref, message)` (puro), resta valido come
  **canale immediato** anche quando aggiungeremo il salvataggio server.

> Principio: il backend **si affianca** a WhatsApp, non lo sostituisce. WhatsApp dà l'immediatezza
> (il cliente scrive subito); il server dà **tracciamento e follow-up** (nessun lead perso).

---

## Le destinazioni a confronto

### 1. Email transazionale (route handler Next + provider email)
Un endpoint (Route Handler App Router) riceve il `Lead` e invia una mail all'agenzia
(es. Resend / Postmark / SMTP).

- **Pro**: rapidissimo da attivare; zero nuove UI; arriva dove l'agenzia già guarda (la posta);
  costo quasi nullo; nessun dato personale conservato da noi oltre alla mail.
- **Contro**: la mail **non è un archivio** (niente ricerca/stato/statistiche); rischio spam/deliverability;
  nessuna segmentazione automatica; follow-up manuale.
- **Adatto se**: si vuole "non perdere nessun lead" **subito**, con lo sforzo minimo.

### 2. Google Sheets (via API / Apps Script)
L'endpoint accoda ogni lead come **riga** in un foglio condiviso.

- **Pro**: l'agenzia legge/filtra/annota senza tool nuovi; visibile a più persone; export banale;
  ottimo come mini-CRM temporaneo e per capire i volumi reali.
- **Contro**: non scala (concorrenza, righe, permessi); auth Google da gestire (service account);
  **dati personali su Google** → attenzione GDPR (accessi, conservazione); niente automazioni serie.
- **Adatto se**: serve visibilità condivisa e reportistica leggera senza costruire un gestionale.

### 3. Supabase (Postgres gestito)
L'endpoint scrive il `Lead` in una tabella `leads` (Postgres), con eventuale dashboard.

- **Pro**: **archivio vero** (query, stato lead, storicizzazione, statistiche); scala; row-level security;
  base solida per una dashboard interna o notifiche; tipi generabili. Ottimo ponte verso un CRM.
- **Contro**: un servizio in più da gestire (account, chiavi, migrazioni, backup); serve costruire
  la UI di consultazione; responsabilità GDPR come titolari del trattamento (conservazione, cancellazione).
- **Adatto se**: vogliamo possedere i dati e costruirci sopra (dashboard/automazioni) senza legarci a un CRM.

### 4. CRM dedicato (HubSpot / Pipedrive / simili)
L'endpoint invia il lead al CRM via API/webhook; il commerciale lavora la pipeline lì.

- **Pro**: pensato per la **gestione commerciale** (pipeline, promemoria, assegnazioni, email/automazioni,
  reportistica); nessuna UI da costruire; scala con il team.
- **Contro**: **costo ricorrente** e curva di adozione; rischio doppio gestionale se poi si usa RealSmart
  anche per i contatti; lock-in; mappatura campi da mantenere.
- **Adatto se**: c'è (o ci sarà) un team commerciale che lavora i lead in modo strutturato.

### 5. RealSmart (gestionale immobiliare dell'agenzia) — *da verificare*
RealSmart è già la **single source of truth degli immobili** (vedi `docs/realsmart-integration-notes.md`).
Se espone un ingresso lead/anagrafiche, il contatto entrerebbe **nello stesso posto** in cui si gestiscono
immobili e clienti.

- **Pro**: **un solo gestionale** per immobili + contatti (niente silos); collegamento naturale
  lead ↔ immobile (`propertyRef` è già previsto nel tipo `Lead`); l'agenzia lavora dove è già abituata.
- **Contro**: **dipende da cosa espone RealSmart** — oggi non è confermato che accetti lead via API/webhook
  (l'integrazione immobili prevista è in sola lettura). Da chiedere insieme agli accessi feed/API.
- **Adatto se**: RealSmart offre un endpoint di acquisizione contatti → **prima scelta strategica**,
  perché evita un secondo gestionale.

> Domanda da girare a RealSmart/cliente: *"È possibile inviare a RealSmart un nuovo contatto/lead
> (nome, recapito, richiesta, immobile di riferimento) via API o webhook?"* — da aggiungere alla
> lista in `docs/realsmart-client-questions.md`.

---

## Sintesi

| Destinazione | Sforzo | Costo | Archivio/Ricerca | Gestione commerciale | GDPR (nostra responsabilità) |
|---|---|---|---|---|---|
| Email | Molto basso | ~0 | No | No | Bassa |
| Google Sheets | Basso | ~0 | Base | No | Media |
| Supabase | Medio | Basso | Sì | Da costruire | Alta |
| CRM | Medio | Ricorrente | Sì | Sì | Media/Alta |
| RealSmart | Da verificare | — | Sì (nel gestionale) | Sì | Media |

---

## Passo consigliato

**Fase 1 — subito (giorni):** aggiungere un **Route Handler** (`app/api/lead/route.ts`) che, oltre
all'apertura WhatsApp lato client, riceve il `Lead` e **invia una email** all'agenzia. Sblocca il
"nessun lead perso" con sforzo minimo e senza nuovi servizi. Il `Lead` è già il payload.

**Fase 2 — a breve:** in parallelo alla mail, **accodare i lead** in una destinazione consultabile.
Se serve solo visibilità condivisa → **Google Sheets**. Se vogliamo un archivio serio e possedere i
dati → **Supabase** (tabella `leads` + piccola dashboard interna).

**Fase 3 — strategica:** **verificare RealSmart**. Se accetta lead via API/webhook, instradare lì i
contatti (un solo gestionale, lead collegato all'immobile). In assenza, valutare un **CRM** solo quando
esiste un team che lavora la pipeline.

**In tutte le fasi:**
- La logica lato server parte da `formatLeadMessage`/`Lead`: aggiungere `submitLead(lead)` accanto a
  `app/lib/forms/lead.ts` e arricchire il tipo con `sourcePage`, `propertyRef`, `consent`, `createdAt`.
- Prima di **salvare** dati su server: consenso esplicito + link all'informativa (`/privacy`) — oggi il
  form mostra solo la microcopy "Usiamo i tuoi dati solo per rispondere alla tua richiesta.", sufficiente
  per il canale WhatsApp ma **da integrare** con l'informativa quando i dati vengono conservati.
  Vedi `docs/forms-crm-notes.md` e `docs/deployment-notes.md`.

---

## File coinvolti

- `app/components/Contact.tsx` — form con intenti + campi dinamici (MVP WhatsApp).
- `app/lib/forms/lead.ts` — tipo `Lead` + `formatLeadMessage` (payload backend-ready, con TODO).
- `app/lib/forms/whatsapp.ts` — `buildWhatsAppUrl` (canale immediato, resta valido).
- `docs/forms-crm-notes.md` — note storiche su form/CRM e segmentazione lead.
- `docs/realsmart-integration-notes.md` / `docs/realsmart-client-questions.md` — contesto RealSmart.
