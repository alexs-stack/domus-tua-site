# Asset e materiali da richiedere al cliente

Elenco di ciò che serve da **Domus Tua** per portare il sito da "premium con contenuti demo" a
"premium con contenuti reali e live". Ogni voce indica **cosa serve**, **dove finisce nel progetto**
e **perché**. Ordinato in tre priorità:

- **Priorità 1 — prima della prossima presentazione:** il minimo per far vedere un sito che sembra
  "suo" al cliente (logo, video, volti reali, prove sociali, accesso gestionale).
- **Priorità 2 — prima del lancio online:** ciò che serve per andare "live" in modo corretto,
  completo e a norma.
- **Priorità 3 — evoluzioni future:** contenuti e automazioni che estendono il sito nel tempo.

Riferimenti utili: `docs/content-replacement-checklist.md` (stato per contenuto),
`docs/realsmart-integration-notes.md` (dettaglio integrazione immobili).

Nota: durante la fase demo, il sito mostra il badge "Preview — contenuti demo da sostituire"
(attivo con la variabile `NEXT_PUBLIC_PREVIEW_BADGE=true`). I dati provvisori sono marcati DEMO in
`app/lib/properties.ts` (immobili) e `app/lib/reviews.ts` (recensioni).

---

## Priorità 1 — Prima della prossima presentazione

Obiettivo: alla prossima demo il cliente deve riconoscere **il suo brand, i suoi volti e le sue
prove sociali**, non contenuti generici.

### 1.1 Logo ufficiale
- **Cosa:** file vettoriale del logo (SVG/AI/PDF) e varianti (positivo/negativo, wordmark, solo
  simbolo), colori esatti.
- **Dove:** oggi il logo è ricostruito in codice (`app/components/Logo.tsx`); serve per allineare il
  `LogoMark` all'originale.
- **Perché:** è il primo elemento di riconoscibilità del brand in presentazione.

### 1.2 Video hero / video del sito attuale
- **Cosa:** clip 15–35s (mp4 + preferibilmente webm), muta, loopabile. Soggetti ideali:
  Raffaela/team, Open Domus, visite, momenti clienti. In alternativa, i video già usati sul sito
  attuale.
- **Dove:** `public/videos/hero.mp4` + impostare `heroVideo` in `app/components/Hero.tsx`.
- **Perché:** il riquadro hero è predisposto per il video (ora mostra la foto come poster/fallback);
  il video fa la differenza in presentazione.

### 1.3 Foto e video di Raffaela e del team
- **Cosa:** ritratto founder ad alta risoluzione, foto team in sede aggiornata, eventuali clip.
- **Dove:** `public/images/reali/raffaela-ritratto.jpg`, `raffaela-team-sede.jpg` (verificare grafia
  del nome file).
- **Perché:** sono i volti reali in Hero e nella sezione "Chi siamo"; danno immediatezza e fiducia.

### 1.4 Link YouTube + timestamp (5–10)
- **Cosa:** 5–10 video da mettere in vetrina, con **URL/ID YouTube** e, dove serve, **timestamp** del
  momento saliente. Conferma dei titoli redazionali.
- **Dove:** `app/components/SocialVideoWall.tsx` (`featured`, `wall[]`), `Team.tsx`, `OpenDomus.tsx`.
- **Perché:** oggi ID e titoli sono impostati ma vanno confermati (alcune thumbnail in
  `public/images/reali/yt/` non sono nemmeno referenziate).

### 1.5 Conferma widget Trustindex (recensioni reali)
- **Cosa:** codice loader del widget Trustindex già usato sul sito attuale
  (es. `https://cdn.trustindex.io/loader.js?XXXXXXXX`).
- **Dove:** `app/lib/site.ts` → `embeds.trustindexSrc`.
- **Perché:** appena valorizzato, la sezione recensioni mostra le **recensioni reali verificate** al
  posto delle demo in `app/lib/reviews.ts`.

### 1.6 Conferma link profilo Google recensioni
- **Cosa:** URL diretto della scheda Google Business Profile (non una ricerca generica) + conferma di
  media recensioni e numero totale (screenshot pannello Google/Trustindex).
- **Dove:** `app/lib/site.ts` → `googleReviewsUrl`, `rating`, `reviewsCount` (da allineare anche in
  Hero, `Stats.tsx`, `recensioni/page.tsx`, `layout.tsx`).
- **Perché:** oggi il pulsante "Leggi le recensioni su Google" punta a una ricerca; "4.9/5" e "500+"
  vanno confermati e resi coerenti ovunque.

### 1.7 Asset social/video migliori
- **Cosa:** selezione dei migliori contenuti social/video da mettere in vetrina (Instagram,
  eventuali reel/clip Open Domus) + storia Open Domus di "Teresa" già usata, con liberatoria cliente.
- **Dove:** `app/components/SocialVideoWall.tsx`, `Social.tsx`, `OpenDomus.tsx`,
  `public/images/reali/open-domus-teresa.jpg`.
- **Perché:** Open Domus e i contenuti social sono asset proprietari e prova sociale forte.

### 1.8 Accesso RealSmart
- **Cosa:** modalità di accesso agli immobili dal gestionale RealSmart, in ordine di preferenza:
  (A) feed dedicato JSON/XML, (B) stesso feed usato per i portali, (C) API REST. Più credenziali e un
  esempio reale di payload.
- **Dove:** credenziali come **variabili d'ambiente** (`REALSMART_FEED_URL`, `REALSMART_API_KEY`, o
  host/user/pass FTP). Innesto in `app/lib/realsmart/client.ts` (`fetchRawListings`).
- **Perché:** RealSmart è la **single source of truth** degli immobili. Anche solo poterlo mostrare in
  demo con un immobile reale cambia la percezione. Domande dettagliate in
  `docs/realsmart-integration-notes.md` §4.

---

## Priorità 2 — Prima del lancio online

Obiettivo: sito completo, corretto e a norma, pronto per essere pubblicato sul dominio ufficiale.

### 2.1 Feed immobili attivo
- **Cosa:** collegamento RealSmart funzionante e autorizzato, con gli **URL delle foto** e relative
  risoluzioni/watermark/diritti d'uso.
- **Dove:** `app/lib/realsmart/client.ts` + `next.config.ts` (`images.remotePatterns` per gli host
  foto RealSmart quando noti). La facciata `app/lib/listings.ts` passerà da `getVisibleListings()`
  (demo) a `getLiveListings()`.
- **Perché:** finché manca, il sito gira sui 6 immobili demo; per il lancio servono gli immobili reali
  live.

### 2.2 Testi legali (privacy / cookie / note legali)
- **Cosa:** testo informativa privacy, cookie policy, dati societari completi, titolare del
  trattamento e finalità (idealmente forniti dal consulente/DPO del cliente).
- **Dove:** pagine `app/privacy/`, `app/cookie/` (già presenti come scaffold) + Footer.
- **Perché:** obbligo GDPR/cookie; non si può pubblicare senza testi legali reali.

### 2.3 Orari di apertura confermati
- **Cosa:** orari ufficiali della sede di Tradate.
- **Dove:** da aggiungere a `app/lib/site.ts` (campo oggi assente), mostrare in `Contact.tsx`/Footer e
  allineare i dati strutturati `openingHours` in `layout.tsx`.
- **Perché:** dato di contatto atteso da un utente locale, oggi provvisorio/da confermare.

### 2.4 Dati ufficiali di team e società
- **Cosa:** ragione sociale, P.IVA, indirizzo, contatti, dati membri del team; handle Facebook e
  TikTok (oggi indicati "da confermare"). Testo ufficiale del protocollo "Domus D.O.C. — Domus di
  Origine Certificata" (4 pilastri e promessa) e verifica/riformulazione del claim "più recensita
  della provincia di Varese".
- **Dove:** `app/lib/site.ts` (dati societari, social, `authority`), `Team.tsx`,
  `app/components/DomusDocProtocol.tsx` (`pillars[]`), `Services.tsx`.
- **Perché:** dati legali, claim di "certificazione" e claim comparativo devono essere reali e
  validati dalla founder.

### 2.5 Immagine OG (social sharing)
- **Cosa:** immagine dedicata 1200x630 per l'anteprima nelle condivisioni.
- **Dove:** `public/og-image.png` + `openGraph.images` in `app/layout.tsx` (oggi usa una foto hero
  provvisoria).
- **Perché:** per un'anteprima curata quando il sito viene condiviso su social/messaggistica.

### 2.6 Favicon ufficiale
- **Cosa:** favicon derivata dal logo ufficiale (`.ico` + eventuali PNG/apple-touch).
- **Dove:** `public/favicon.ico` (referenziato in `metadata.icons` di `app/layout.tsx`).
- **Perché:** completa la riconoscibilità del brand nel browser.

### 2.7 Destinazione del form di contatto
- **Cosa:** dove devono arrivare i messaggi del modulo contatti (email, CRM, servizio esterno) e con
  quali eventuali chiavi/endpoint.
- **Dove:** `app/components/Contact.tsx` + variabili d'ambiente su Vercel.
- **Perché:** senza destinazione confermata, i contatti raccolti al lancio andrebbero persi.

---

## Priorità 3 — Evoluzioni future

Obiettivo: estendere il sito con contenuti e automazioni dopo il lancio.

### 3.1 Base di conoscenza AI
- **Cosa:** FAQ, procedure, materiali informativi e documentazione da usare come knowledge base per
  risposte assistite (assistente virtuale, ricerca intelligente).
- **Perché:** abilita esperienze conversazionali e supporto automatizzato coerenti col metodo Domus Tua.

### 3.2 Google Drive / documenti di processo
- **Cosa:** accesso ai documenti operativi e di processo dell'agenzia (Google Drive o simili).
- **Perché:** fonte per popolare knowledge base, testi e automazioni con contenuti reali e aggiornati.

### 3.3 Script chatbot / assistente vocale
- **Cosa:** copioni e flussi per chatbot e/o assistente vocale (accoglienza, qualifica lead, FAQ).
- **Perché:** per integrare un assistente coerente con tono e brand (warm, human, premium).

### 3.4 Documentazione CRM / automazioni di processo
- **Cosa:** descrizione del CRM in uso e dei flussi da automatizzare (lead, follow-up, Open Domus,
  passaggi fino al rogito).
- **Perché:** per collegare il sito al processo commerciale e automatizzare la gestione dei contatti.

### 3.5 Template brochure
- **Cosa:** modelli di brochure/schede immobile (layout, testi ricorrenti, elementi grafici).
- **Perché:** per generare materiali coerenti col brand a partire dai dati degli immobili.

---

## Riepilogo rapido (checklist di raccolta)

**Priorità 1 — prima della presentazione**
- [ ] Logo ufficiale (vettoriale + varianti)
- [ ] Video hero / video del sito attuale
- [ ] Foto/video Raffaela + team (alta risoluzione + liberatorie)
- [ ] 5–10 link YouTube + timestamp + conferma titoli
- [ ] Conferma widget Trustindex
- [ ] Conferma link profilo Google + rating/n° recensioni (screenshot)
- [ ] Migliori asset social/video (incl. storia Open Domus + liberatoria)
- [ ] Accesso RealSmart (feed/API/FTP) + credenziali + esempio payload + URL foto

**Priorità 2 — prima del lancio**
- [ ] Feed immobili attivo + diritti/URL foto
- [ ] Testi privacy / cookie / note legali
- [ ] Orari di apertura confermati
- [ ] Dati ufficiali team/società + handle Facebook/TikTok + testo Domus D.O.C. + claim "più recensita"
- [ ] Immagine OG dedicata (1200x630)
- [ ] Favicon ufficiale
- [ ] Destinazione del form di contatto

**Priorità 3 — futuro**
- [ ] Base di conoscenza AI
- [ ] Accesso Google Drive / documenti di processo
- [ ] Script chatbot / assistente vocale
- [ ] Documentazione CRM / automazioni di processo
- [ ] Template brochure
