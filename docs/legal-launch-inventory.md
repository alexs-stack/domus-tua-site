# Legal launch — inventario dei flussi dati e cosa serve dal cliente

Documento FATTUALE, non consulenza legale. Elenca cosa il sito carica e dove finiscono i dati,
così che il cliente / consulente possa redigere Privacy e Cookie Policy corrette. Nessun fatto
legale (titolare, tempi di conservazione, basi giuridiche, DPO) è inventato: quelli li fornisce
il cliente.

## 1. Terze parti e flussi dati (stato reale del codice)

| Servizio | Finalità | Dati | Trigger (quando parte) | Categoria consenso | Env / config |
| --- | --- | --- | --- | --- | --- |
| **Trustindex** (widget recensioni) | Mostrare le recensioni Google verificate | IP, cookie del widget | SOLO dopo consenso `accepted` **e** quando la sezione entra in viewport | Marketing / terze parti | `site.embeds.trustindexLoader` (o env `TRUSTINDEX_WIDGET_URL`) |
| **YouTube** (video) | Riproduzione video | IP, cookie YouTube | SOLO dopo click su "play" (click-to-load) + dominio `youtube-nocookie.com` | Marketing / terze parti | `site.videos.*` (id) |
| **CARTO / OpenStreetMap** (tile mappa) | Mostrare la mappa degli immobili | IP verso il tile server | Al render della mappa in `/acquista` (PropertySearch) — **non** attualmente gated dal consenso | Funzionale (mappa) — **da decidere** | hardcoded in `PropertyMap.tsx` |
| **Google Fonts** (Jakarta, Playfair, Pinyon) | Tipografia | nessuno verso Google | mai a runtime: `next/font/google` **auto-ospita** i font sul nostro dominio a build-time | Necessario (nessun terzo) | `next/font` in `app/layout.tsx` |
| **Resend** (email lead) | Recapito email dei lead all'agenzia | nome, contatto, messaggio del lead | invio del form (server-side) | — (dato di prima parte, non un cookie) | `RESEND_API_KEY`, `CONTACT_EMAIL_TO` |
| **RealSmart** (feed immobili) | Sorgente annunci | nessun dato utente in uscita | server-side, non nel browser | — | `REALSMART_FEED_URL` |

**Analytics:** nessuno. Non c'è Google Analytics / gtag / tag manager nel codice (verificato).

**Cookie di prima parte:** `dt_consent` (scelta cookie, 180 gg). Cookie tecnico/necessario.

## 2. Comportamento del consenso (implementato)

- Banner al primo accesso: **Accetta** / **Solo necessari** (rifiuta).
- **Prima del consenso: nessuna richiesta a terze parti** (Trustindex gated su `accepted`;
  YouTube click-to-load; mappa vedi sopra). Test E2E: `e2e/consent-reviews.spec.ts`.
- **Revoca a un clic:** link "Preferenze cookie" nel footer riapre il banner (`reopenConsent`).
- Scelta persistita in `dt_consent`, reattiva senza reload (`app/lib/consent.ts`).

## 3. Decisioni da prendere (terze parti)

1. **Mappa (CARTO/OSM):** i tile sono un servizio esterno che vede l'IP. Oggi la mappa si carica
   senza gate di consenso, come componente funzionale. Va deciso: (a) trattarla come funzionale
   (necessaria alla feature, nessun gate) oppure (b) gaterla come le altre terze parti. Serve la
   decisione per la Cookie Policy.
2. **YouTube:** confermato **click-to-load + youtube-nocookie**. Se preferite un gate di consenso
   esplicito (marketing) al posto del click-to-load, si può aggiungere.

## 4. Il cancello di lancio

Finché la Privacy/Cookie Policy sono placeholder:
- le pagine `/privacy` e `/cookie` restano **noindex** (`app/lib/legal.ts`);
- `npm run launch-check` **fallisce** (blocco "Legale").

Quando arriva il testo definitivo e approvato: metterlo in pagina e impostare
`LEGAL_DOCS_APPROVED=true`. Lo stesso flag rende le pagine indicizzabili (se è la policy SEO) e
sblocca il launch-check.

## 5. Questionario — cosa serve da Domus Tua / consulente legale

Per finalizzare Privacy e Cookie Policy servono:

1. **Titolare del trattamento**: ragione sociale, sede, contatti (email/telefono dedicati privacy).
2. **DPO / responsabile privacy**: nominato? contatti?
3. **Finalità e basi giuridiche** per ogni trattamento (lead form, recensioni, video, mappa).
4. **Tempi di conservazione** dei lead (email) e degli altri dati.
5. **Responsabili esterni (data processor)** da nominare: Resend (email), Trustindex (recensioni),
   Google/YouTube, CARTO/OSM (mappa), Vercel (hosting). Confermare l'elenco e gli accordi (DPA).
6. **Trasferimenti extra-UE** (es. provider USA): confermare le garanzie (SCC/adeguatezza).
7. **Cookie di terze parti**: elenco e durata dei cookie di Trustindex e YouTube (li forniscono i
   rispettivi provider) da citare nella Cookie Policy.
8. **Decisione mappa** (punto 3.1) e **decisione YouTube** (punto 3.2).
9. **Testo definitivo** di Privacy e Cookie Policy (o approvazione del testo che fornirete),
   dopodiché impostiamo `LEGAL_DOCS_APPROVED=true`.
