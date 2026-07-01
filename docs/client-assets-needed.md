# Asset e materiali da richiedere al cliente

Elenco completo di ciò che serve da **Domus Tua** per portare il sito da "premium con contenuti
demo" a "premium con contenuti 100% reali e live". Ogni voce indica **cosa serve**, **dove finisce
nel progetto** e **perché**. Ordinato per priorità.

Riferimenti utili: `docs/content-replacement-checklist.md` (stato per contenuto),
`docs/realsmart-integration-notes.md` (dettaglio integrazione immobili).

---

## Priorità 1 — Bloccanti per andare "live"

### 1.1 Accesso / feed / API RealSmart (immobili)
- **Cosa:** modalità di accesso agli immobili dal gestionale RealSmart. In ordine di preferenza:
  (A) feed dedicato JSON/XML, (B) stesso feed usato per i portali, (C) API REST. Più credenziali.
- **Dove:** endpoint/credenziali come **variabili d'ambiente** (`REALSMART_FEED_URL`,
  `REALSMART_API_KEY`, o host/user/pass FTP). Innesto in `app/lib/realsmart/client.ts` (`fetchRawListings`).
- **Perché:** RealSmart è la **single source of truth** degli immobili. Finché manca, il sito gira
  sui 6 immobili demo. Domande dettagliate già preparate in `docs/realsmart-integration-notes.md` §4.
- **Serve anche:** un esempio reale di payload (per scrivere il parser) e gli **URL delle foto**
  con relative risoluzioni/watermark/diritti d'uso.

### 1.2 Codice widget Trustindex (recensioni reali)
- **Cosa:** codice loader del widget Trustindex già usato sul sito attuale
  (es. `https://cdn.trustindex.io/loader.js?XXXXXXXX`).
- **Dove:** `app/lib/site.ts` → `embeds.trustindexSrc`.
- **Perché:** appena valorizzato, la sezione recensioni mostra le **recensioni reali verificate**
  al posto delle 8 demo in `app/lib/reviews.ts`.

### 1.3 URL profilo Google recensioni
- **Cosa:** URL diretto della scheda Google Business Profile (non una ricerca generica).
- **Dove:** `app/lib/site.ts` → `googleReviewsUrl`.
- **Perché:** oggi il pulsante "Leggi le recensioni su Google" punta a una ricerca Google, non al profilo.

### 1.4 Numeri "trust" verificati (rating e recensioni)
- **Cosa:** media recensioni reale e numero totale (screenshot pannello Google/Trustindex).
- **Dove:** `app/lib/site.ts` (`rating`, `reviewsCount`) + valori hardcoded da allineare
  (Hero, `Stats.tsx`, `recensioni/page.tsx`, `layout.tsx`).
- **Perché:** "4.9/5" e "500+" sono ripetuti in più punti; servono confermati e coerenti.

### 1.5 Testo Domus D.O.C. approvato
- **Cosa:** formulazione ufficiale del protocollo "Domus D.O.C. — Domus di Origine Certificata"
  (i 4 pilastri e la promessa), approvata anche sul piano legale/comunicativo.
- **Dove:** `app/components/DomusDocProtocol.tsx` (`pillars[]`) + `Services.tsx`.
- **Perché:** è un asset proprietario e un claim di "certificazione": deve essere testo del cliente.

### 1.6 Verifica claim "più recensita della provincia di Varese"
- **Cosa:** prova/fonte del primato (o autorizzazione a mantenerlo).
- **Dove:** `app/lib/site.ts` → `authority`.
- **Perché:** claim comparativo di primato; senza fonte va riformulato.

### 1.7 Orari di apertura
- **Cosa:** orari sede di Tradate.
- **Dove:** da aggiungere a `app/lib/site.ts` (campo oggi assente) e mostrare in `Contact.tsx`/Footer.
- **Perché:** dato di contatto atteso da un utente locale, attualmente mancante.

---

## Priorità 2 — Video e materiali visivi (cuore del sito video/social-driven)

### 2.1 Video hero
- **Cosa:** clip 15–35s (mp4 + preferibilmente webm), muta, loopabile. Soggetti ideali:
  Raffaella/team, Open Domus, visite, momenti clienti.
- **Dove:** `public/videos/hero.mp4` + impostare `heroVideo` in `app/components/Hero.tsx`.
- **Perché:** il riquadro hero è predisposto per il video (ora mostra la foto come poster/fallback).

### 2.2 Foto e video di Raffaella e del team
- **Cosa:** ritratto founder ad alta risoluzione, foto team in sede aggiornata, eventuali clip.
- **Dove:** `public/images/reali/raffaela-ritratto.jpg`, `raffaela-team-sede.jpg` (verificare grafia nome file).
- **Perché:** sono le foto reali in Hero e sezione "Chi siamo"; servono versioni ufficiali + liberatorie.

### 2.3 Link YouTube + timestamp
- **Cosa:** elenco definitivo dei video da mettere in vetrina, con **URL/ID YouTube** e, dove serve,
  **timestamp** del momento saliente. Conferma dei titoli redazionali.
- **Dove:** `app/components/SocialVideoWall.tsx` (`featured`, `wall[]`), `Team.tsx`, `OpenDomus.tsx`.
- **Perché:** oggi ID e titoli sono impostati ma vanno confermati (alcune thumbnail in
  `public/images/reali/yt/` non sono nemmeno referenziate).

### 2.4 Clip / storia Open Domus
- **Cosa:** video o foto reali di un Open Domus (es. la storia di "Teresa" già usata) + liberatoria cliente.
- **Dove:** `public/images/reali/open-domus-teresa.jpg`, video linkato in `OpenDomus.tsx`.
- **Perché:** Open Domus è asset proprietario e prova sociale forte.

### 2.5 Widget / feed Instagram (opzionale live)
- **Cosa:** URL iframe di un widget IG (LightWidget / Behold / EmbedSocial).
- **Dove:** `app/lib/site.ts` → `embeds.instagramIframe` (consumato da `Social.tsx`).
- **Perché:** se valorizzato, mostra il feed IG reale al posto della griglia curata di immagini di libreria.

---

## Priorità 3 — Brand, testi e legale

### 3.1 Logo originale
- **Cosa:** file vettoriale del logo (SVG/AI/PDF) e varianti (positivo/negativo, wordmark, solo simbolo).
- **Dove:** attualmente il logo è ricostruito in codice (`app/components/Logo.tsx`).
- **Perché:** per allineare il `LogoMark` all'originale, il favicon e gli asset di condivisione.

### 3.2 Testi servizi approvati
- **Cosa:** approvazione (o riscrittura) dei testi di: Servizi, Metodo Domus Tua, Open Domus, payoff home.
- **Dove:** `Services.tsx`, `Method.tsx`, `OpenDomus.tsx`, `Hero.tsx`.
- **Perché:** ora sono redazionali/plausibili; servono validati dalla founder.

### 3.3 Documenti legali (privacy / cookie / note legali)
- **Cosa:** testo informativa privacy, cookie policy, dati societari completi, eventuale titolare
  del trattamento e finalità.
- **Dove:** pagine `app/privacy/`, `app/cookie/` (già presenti come scaffold) + Footer.
- **Perché:** obbligo GDPR/cookie; da riempire con testi legali reali (idealmente forniti dal
  consulente/DPO del cliente).

### 3.4 Conferma dati societari e social
- **Cosa:** ragione sociale, P.IVA, indirizzo, contatti; handle Facebook e TikTok (indicati "da confermare").
- **Dove:** `app/lib/site.ts`.
- **Perché:** dati legali e link social devono essere reali e attivi.

---

## Priorità 4 — Hosting e messa online

### 4.1 Requisiti hosting / dominio
- **Cosa:**
  - Dominio definitivo (es. `domustua.com`) e accesso DNS per puntarlo a Vercel.
  - Conferma progetto/piano Vercel (già presente `domus-tua`, dominio `domus-tua-ten.vercel.app`).
  - **Secret di produzione**: variabili RealSmart e ogni chiave (mai committare; impostarle nei
    Project Settings di Vercel).
- **Dove:** DNS del registrar + Environment Variables su Vercel; `next.config.ts` (`images.remotePatterns`
  per gli host foto RealSmart quando noti).
- **Perché:** per servire il sito sul dominio ufficiale con i dati live e le immagini remote autorizzate.

### 4.2 Analytics / consenso (opzionale)
- **Cosa:** eventuale strumento di analytics e configurazione consenso cookie coerente con la policy.
- **Perché:** misurare il traffico rispettando il consenso; da concordare col cliente.

---

## Riepilogo rapido (checklist di raccolta)

- [ ] Accesso RealSmart (feed/API/FTP) + credenziali + esempio payload + URL foto
- [ ] Codice widget Trustindex
- [ ] URL profilo Google recensioni
- [ ] Rating e n° recensioni verificati (screenshot)
- [ ] Testo Domus D.O.C. approvato
- [ ] Fonte/riformulazione claim "più recensita"
- [ ] Orari di apertura
- [ ] Video hero (15–35s)
- [ ] Foto/video Raffaella + team (alta risoluzione + liberatorie)
- [ ] Link YouTube definitivi + timestamp + conferma titoli
- [ ] Clip/storia Open Domus + liberatoria cliente
- [ ] URL feed/widget Instagram (opzionale)
- [ ] Logo vettoriale originale + varianti
- [ ] Testi servizi/metodo/Open Domus approvati
- [ ] Testi privacy / cookie / note legali
- [ ] Conferma dati societari + handle Facebook/TikTok
- [ ] Dominio + accesso DNS + secret su Vercel
