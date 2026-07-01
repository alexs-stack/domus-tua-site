# Piano di fase — Domus Tua

> Documento **interno sersan**. Serve a inquadrare con il cliente **cosa è Fase 1** (il sito che
> vende oggi) e **cosa è Fase 2** (l'intelligenza attorno al sito). Regola di scopo:
> **la Fase 1 mette Domus Tua online in modo premium, reale e misurabile; la Fase 2 aggiunge
> l'AI e l'automazione sopra fondamenta già solide.** Non si vende Fase 2 finché Fase 1 non è live.

Riferimenti: `docs/ai-roadmap.md` (dettaglio tecnico delle fasi AI),
`docs/realsmart-integration-notes.md`, `docs/reviews-integration.md`, `docs/forms-crm-notes.md`.

---

## Principio guida

- **Prima la sostanza, poi l'intelligenza.** Un sito che mostra immobili reali, recensioni reali
  e cattura lead è già un asset commerciale. L'AI amplifica un sistema che funziona; non lo
  sostituisce e non copre le mancanze.
- **Niente AI finta.** Ogni comportamento "intelligente" che appare sul sito o è reale o è
  dichiarato esplicitamente "in arrivo". Il campo di ricerca in linguaggio naturale, oggi, è un
  teaser onesto — non finge di funzionare.
- **Dati privati fuori dal sito pubblico.** Tutto ciò che tocca documenti/processi interni
  (Drive, gestionale, CRM) vive dietro autenticazione, mai nel sito pubblico né nel repo.

---

## Fase 1 — Il sito che vende (ora)

Obiettivo: **Domus Tua online, premium, con contenuti reali e cattura lead.** È il perimetro del
"go-live".

| Ambito | Cosa comprende | Stato |
|---|---|---|
| **Sito & pagine core** | Home, `/vendi`, `/acquista`, `/metodo`, `/open-domus`, `/servizi`, `/case` + `/case/[slug]`, `/recensioni`, `/chi-siamo`, `/contatti`, `/privacy`, `/cookie`. Multilingua IT/EN/FR/DE/ES. | Costruito; testi da validare |
| **Logo ufficiale** | Uso del logo ufficiale del cliente (header/footer/favicon) — non ridisegnato. | In attesa dei file |
| **Video hero** | Apertura cinematica video-ready; foto reale come base finché arriva la clip. | Predisposto; in attesa clip |
| **Sync annunci RealSmart** | Immobili reali e sempre allineati al gestionale; strato normalizzazione/tipi/client già pronti. | Predisposto; in attesa accesso |
| **Recensioni Google/Trustindex** | Widget Trustindex reale cablato + link scheda Google reale; badge fonte, stelle, "verificato". | Cablato; da confermare numeri/top 5 |
| **Form & cattura lead / WhatsApp** | Form segmentato "vendere/acquistare" che apre WhatsApp precompilato; CTA e contatti sempre presenti. | Attivo (via WhatsApp) |
| **SEO & trust locale** | JSON-LD, metadata per il mercato locale, orari/dati sede, prova sociale. | In gran parte fatto; orari da aggiungere |

**Definizione di "fatto" (Fase 1):**
- Immobili **reali** live da RealSmart (no demo).
- Recensioni **reali** Google/Trustindex con numeri confermati.
- **Logo ufficiale** e **video hero** in opera.
- Lead che arrivano **segmentati e tracciabili** (almeno WhatsApp; email/CRM è già ponte verso Fase 2).
- Testi legali e di brand **validati**.
- Dominio ufficiale su Vercel, secret configurati.

---

## Fase 2 — L'intelligenza attorno al sito (dopo)

Obiettivo: **trasformare il sito da vetrina a sistema** — ricerca conversazionale, assistenza
automatica e automazioni interne. Ogni voce poggia su fondamenta di Fase 1 già live.

| Ambito | Cosa comprende | Prerequisito (Fase 1) |
|---|---|---|
| **Ricerca in linguaggio naturale** | L'utente scrive "trilocale con giardino a Tradate sotto 300k" e il sistema traduce in filtri. Solo su **annunci pubblici** già sincronizzati. Attiva il campo NL oggi teaser. | Annunci reali da RealSmart |
| **Chatbot** | Q&A sui **contenuti pubblici** del sito: metodo, Open Domus, Domus D.O.C., zone, come vendere/comprare. Nessun dato riservato. | Contenuti di sito validati |
| **Assistente vocale** | Ricerca e chatbot utilizzabili **a voce** (accessibilità + mobile). | Ricerca NL + chatbot |
| **RAG interno su Drive/processi** | Strumento **interno al team** su documenti e processi privati (Drive/gestionale). Dietro autenticazione e permessi, **fuori dal sito pubblico**. | Autenticazione + governance dati |
| **Automazioni CRM/processi** | Lead che dal sito entrano nel CRM/gestionale via webhook/API, con tipo lead, pagina sorgente, immobile, contatto; follow-up e assegnazioni automatizzate. | Lead segmentati (già ponte in Fase 1) |
| **Workflow contenuti/social** | Pipeline per pubblicare video/recensioni/annunci su sito e social in modo coordinato. | Muro video + feed social live |

**Regole di ingaggio Fase 2:**
- Nessun dato sensibile nel repo o nel client.
- Il RAG interno è un **prodotto separato** dal sito pubblico, con la sua sicurezza.
- L'AL/AI si attiva a stadi: prima NL sugli annunci pubblici, poi chatbot, poi voce, poi interno.

---

## Come raccontarlo al cliente

- **Fase 1 è ciò che comprate oggi**: un sito premium che porta online il Metodo Domus Tua,
  mostra immobili e recensioni reali e vi porta contatti qualificati.
- **Fase 2 è la crescita**: quando la base è live e misurabile, aggiungiamo ricerca
  conversazionale, chatbot, voce e le automazioni che fanno risparmiare tempo al team.
- Il sito è **già progettato per accogliere la Fase 2** (il campo NL, il ponte lead→CRM, lo
  strato annunci): non ci sarà da rifare, solo da accendere.
