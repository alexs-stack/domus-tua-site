# Migrazione dominio — checklist operativa (go-live)

Il passaggio di `domustua.com` dal vecchio WordPress al nuovo sito su Vercel. Da eseguire
**nell'ordine**. Nessun passo qui tocca il codice: sono azioni su DNS, Vercel e Search Console.

> Strumenti a supporto (girano SENZA accesso a produzione):
> - `npm test` → suite `golive` (redirect, sitemap, robots, dati strutturati) + `indexability`.
> - `npm run smoke -- https://www.domustua.com` → verifica HTTP dal vivo del dominio finale.
> - `npm run verify:deploy -- https://www.domustua.com` → stato env/integrazioni via `/api/health`.

---

## 🚧 BLOCCANTE — decisione ESTERNA ancora aperta

**`annunci.domustua.com`** — la sorte del sottodominio (usato dal vecchio gestionale/annunci)
NON è decisa, ed è una **scelta del cliente**, non un'assunzione tecnica. Prima del cutover va
stabilito: resta attivo? viene rediretto? viene dismesso? Se annunci pubblici puntano lì e lo si
spegne senza redirect, si perdono link e posizionamento. **Non procedere al cambio DNS finché
questa decisione non è scritta.** (Gli altri redirect legacy sono già in `next.config.ts`.)

---

## 0. Accessi necessari (prerequisiti)

- [ ] Pannello **DNS** del dominio `domustua.com` (registrar o provider DNS).
- [ ] Account **Vercel** del progetto (owner/admin) per aggiungere il dominio.
- [ ] **Google Search Console** — proprietà del dominio (verrà (ri)verificata).
- [ ] Accesso al **vecchio hosting WordPress** (per un eventuale rollback rapido).
- [ ] Sapere chi presidia la **casella lead** e il **numero WhatsApp** (vedi form/email sotto).

## 1. Prima di toccare il DNS — registrare i valori attuali

- [ ] **Annotare i record DNS correnti** di `@` (apex), `www` e `annunci` (tipo, valore, TTL):
      servono per il rollback. Screenshot o export della zona.
- [ ] **Controllo TTL**: abbassare il TTL dei record A/CNAME interessati (es. a 300s) **con
      anticipo** (almeno 1× il TTL vecchio prima), così il cambio propaga in fretta e un
      rollback è veloce. Se il TTL era a ore, aspettare che il valore basso sia propagato.
- [ ] Confermare la **decisione `annunci.domustua.com`** (blocco sopra).

## 2. Preparare Vercel (prima del cambio DNS)

- [ ] Aggiungere `www.domustua.com` e `domustua.com` come domini del progetto Vercel; scegliere
      il **primario** (di norma `www`, con apex → www) — l'indicizzabilità tratta i due come lo
      stesso sito (`isIndexableDeployment`).
- [ ] Impostare le **env di produzione** su Vercel: `NEXT_PUBLIC_SITE_URL=https://www.domustua.com`,
      più le integrazioni previste (feed RealSmart, Trustindex, casella lead — vedi §6/§7 e
      `verify:deploy`). `NEXT_PUBLIC_PREVIEW_BADGE` **spento** in produzione.
- [ ] Redeploy e verifica sull'URL di anteprima Vercel che il build è verde.

## 3. Cambio DNS

- [ ] Puntare `@`/`www` ai valori Vercel (A/ALIAS/CNAME come indicato da Vercel).
- [ ] Applicare la decisione su `annunci` (redirect o dismissione), non lasciarlo orfano.
- [ ] Attendere la propagazione (il TTL basso di §1 aiuta) e l'emissione del **certificato TLS**
      da parte di Vercel.

## 4. Verifica del deploy (appena il dominio risponde)

- [ ] `npm run smoke -- https://www.domustua.com` → tutte le verifiche obbligatorie verdi
      (home, catalogo, una scheda, servizi, contatti, endpoint form, robots, sitemap, redirect).
- [ ] `npm run verify:deploy -- https://www.domustua.com` → env e integrazioni a posto,
      badge anteprima **spento**, commit atteso.
- [ ] Aprire il sito: HTTPS valido, nessun avviso di certificato, l'apex reindirizza al primario.

## 5. Verifica redirect (i 25 legacy)

- [ ] Lo smoke test copre i rappresentativi. Per l'inventario completo, `curl -sIL` su ogni
      URL legacy (da `next.config.ts` + rapporto Pagine di Search Console degli ultimi 16 mesi):
      atteso **308** (o 301) verso la destinazione giusta, **una sola** volta (niente catene
      lunghe, niente loop). Ricordare: Next emette **308**, non 301 — è corretto, non segnalarlo
      come errore.
- [ ] Nessun URL legacy risponde 404.

## 6. Verifica form ed email

- [ ] Inviare **un lead di prova reale** dal form (con un proprio recapito): verificare che
      arrivi dove deve — WhatsApp precompilato **e** casella lead/foglio se configurati.
      (Lo smoke test NON invia lead veri: questo va fatto a mano, una volta.)
- [ ] Confermare **chi legge la casella** e che l'email di notifica (se accesa) non finisca in
      spam. Vedi `docs/da-chiedere-alla-cliente.md` §5.2 (indirizzo pubblico vs operativo).
- [ ] **DNS email (SPF/DKIM/DMARC)**: NON si toccano in questa migrazione, ma se si accende
      l'invio email (Resend) il mittente dev'essere su un dominio con quei record a posto — è un
      prerequisito lato dominio, non del sito.

## 7. Search Console

- [ ] (Ri)verificare la proprietà del dominio sul nuovo hosting.
- [ ] **Inviare la sitemap**: `https://www.domustua.com/sitemap.xml`.
- [ ] Controllare `robots.txt` in produzione: **indicizzabile** (`Allow: /` + `Sitemap:`), non il
      `Disallow: /` delle anteprime.
- [ ] Usare **Controllo URL** su home e 2–3 pagine chiave: indicizzabili, canonical corretto.
- [ ] Tenere d'occhio il rapporto **Pagine** per i 404 sui vecchi URL non ancora mappati:
      aggiungere i redirect mancanti in `next.config.ts` se emergono.

## 8. Follow-up a 48 ore

- [ ] Search Console: nessun picco di errori di scansione o 404; i redirect risultano seguiti.
- [ ] Log Vercel: nessun `[realsmart] feed non disponibile` ripetuto (feed instabile), nessun
      picco di `[realsmart] qualità dati` (dati peggiorati).
- [ ] Core Web Vitals di campo (CrUX/Speed Insights) non peggiorati rispetto al vecchio sito.
- [ ] Il form ha prodotto lead veri arrivati a destinazione.

## 9. Condizioni di rollback

Tornare ai record DNS di §1 (rollback rapido grazie al TTL basso) se, entro le prime ore:

- il sito non risponde o il **certificato TLS** non viene emesso;
- lo **smoke test** o `verify:deploy` falliscono su verifiche obbligatorie e non si risolvono
  rapidamente;
- il **form non consegna** i lead a nessun canale;
- errori diffusi (5xx) o pagine vuote sul catalogo;
- il **robots** di produzione risulta chiuso (`Disallow: /`) per una mis-configurazione dell'host.

Il rollback è solo DNS: il vecchio WordPress resta in piedi finché non si è certi del nuovo.
