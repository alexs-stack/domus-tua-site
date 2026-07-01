# Domande e materiali da chiedere al cliente — checklist per la call

> Documento **interno sersan**. Checklist operativa da usare **durante la call di revisione** con
> Raffaela e il team. Per ogni voce: **cosa chiedere**, **perché serve**, **dove va nel progetto**.
> Ordinata per priorità (bloccanti per il go-live prima). Versione estesa degli asset in
> `docs/client-assets-needed.md`; lo script della call è in `docs/client-review-script.md`.

Legenda priorità: **[P1]** bloccante go-live · **[P2]** cuore video/social · **[P3]** brand/legale.

---

## 1. Logo ufficiale — file [P1]

**Chiedere:** i file **vettoriali** del logo ufficiale (in ordine: SVG → PDF vettoriale → AI/EPS),
sfondo trasparente, in due varianti: **a colori** (per header su fondo chiaro) e **chiara/mono**
(per footer su fondo scuro). Più il **favicon** e, se esiste, il **solo simbolo**. Codici colore
ufficiali (HEX/RGB, eventuale Pantone/CMYK).
**Perché:** il logo **non va ridisegnato** (direttiva cliente). Il codice è già pronto a usarlo:
basta depositare i file. Serve anche per favicon e immagine di condivisione.
**Dove:** `public/logo-domustua-original.svg`, `public/logo-domustua-original-light.svg`,
`public/favicon.ico`. Dettagli in `docs/logo-assets.md`.

- [ ] SVG/PDF vettoriale a colori (header)
- [ ] Variante chiara/mono (footer)
- [ ] Favicon multi-size + (opz.) solo simbolo 512×512
- [ ] Codici colore ufficiali

---

## 2. Video hero — preferenza e clip [P2]

**Chiedere:** avete già una clip che vi rappresenta, o ne giriamo/montiamo una? Preferenza sul
contenuto dell'apertura (Raffaela che accoglie? un Open Domus? consegna chiavi?).
**Perché:** l'hero è **video-ready**; appena c'è il file l'apertura diventa video da sola.
**Specifiche:** 15–35s, **muta**, loop pulito, 16:9, 1080p; `mp4` + preferibilmente `webm`.
**Dove:** `public/media/domus-hero.mp4` / `.webm` / `-poster.jpg`, poi `heroCinematic.enabled = true`
in `app/lib/media.ts`. Dettagli e comandi ffmpeg in `docs/hero-video.md`.

- [ ] Preferenza contenuto hero confermata
- [ ] Clip fornita (o mandato in produzione)

---

## 3. Foto di Raffaela e del team [P2]

**Chiedere:** ritratto **founder** ad alta risoluzione, foto **team in sede** aggiornata,
eventuali clip. Con **liberatorie** per l'uso online.
**Perché:** oggi usiamo la foto reale ricavata dal banner YouTube; servono versioni ufficiali in
alta risoluzione (Hero, "Chi siamo", Team).
**Dove:** `public/images/reali/raffaela-ritratto.jpg`, `raffaela-team-sede.jpg` (verificare la
grafia del nome — il cliente scrive "Raffaela").

- [ ] Ritratto founder alta risoluzione + liberatoria
- [ ] Foto team in sede + liberatoria
- [ ] Conferma grafia del nome (Raffaela / Raffaella)

---

## 4. Video YouTube — link e timestamp [P2]

**Chiedere:** elenco **definitivo** dei video da mettere in vetrina, con **URL/ID YouTube** e,
dove serve, il **timestamp** del momento saliente. Conferma dei titoli redazionali che abbiamo
proposto.
**Perché:** oggi ID e titoli sono impostati ma **da confermare**; alcune thumbnail in
`public/images/reali/yt/` non sono nemmeno referenziate.
**Dove:** `app/components/SocialVideoWall.tsx` (`featured`, `wall[]`), `Team.tsx`, `OpenDomus.tsx`.
Video già noti da confermare: recensioni con volti reali (`BEmbT6WbZ-c`, `gYePYQHNTUM`),
team in sede (`PRB3exiOa3I`).

- [ ] Elenco video definitivo (URL/ID)
- [ ] Timestamp dei momenti salienti
- [ ] Titoli confermati

---

## 5. Accesso RealSmart [P1]

**Chiedere:** come possiamo leggere i vostri immobili da RealSmart, in ordine di preferenza:
(A) **feed dedicato** JSON/XML, (B) lo **stesso feed** che usate per i portali, (C) **API REST**.
Più: un **esempio reale di payload** e gli **URL delle foto** (risoluzioni, watermark, diritti d'uso).
**Perché:** RealSmart è la **single source of truth** degli immobili; finché manca giriamo su 6
demo. Con l'accesso, gli annunci sono reali e sempre allineati (no doppio inserimento).
**Dove:** credenziali come variabili d'ambiente (`REALSMART_FEED_URL`, `REALSMART_API_KEY`, o
host/user/pass FTP); innesto in `app/lib/realsmart/client.ts`. Domande di dettaglio in
`docs/realsmart-integration-notes.md` §4.

- [ ] Modalità di accesso (feed/API/FTP) + credenziali
- [ ] Esempio reale di payload
- [ ] URL foto + risoluzioni/watermark/diritti

---

## 6. Widget Trustindex — codice/embed [P1]

**Chiedere:** il **codice loader** del widget Trustindex già usato sul sito attuale
(formato `https://cdn.trustindex.io/loader.js?<HASH>`).
**Perché:** appena valorizzato, la sezione recensioni mostra le **recensioni reali verificate**
al posto delle demo. (Abbiamo già trovato l'hash `3e10adc2514d705589260c30307` su domustua.com:
confermare che è quello giusto e attuale.)
**Dove:** `app/lib/site.ts` → `embeds.trustindexSrc` / `trustindexWidget`.

- [ ] Codice/loader widget Trustindex confermato

---

## 7. Link scheda Google recensioni [P1]

**Chiedere:** l'**URL diretto** della vostra scheda Google Business Profile (non una ricerca).
**Perché:** il pulsante "Leggi su Google" deve puntare al **profilo reale**.
**Dove:** `app/lib/site.ts` → `googleReviewsUrl`. (Oggi impostato su
`https://www.google.com/maps?cid=1402630747648240075`: confermare che è la scheda corretta.)

- [ ] URL scheda Google confermato

---

## 8. Top 5 recensioni da mettere in evidenza [P1]

**Chiedere:** quali sono le **5 recensioni migliori** da mostrare in primo piano (nome, testo,
fonte). Idealmente un mix Venditori / Acquirenti / Open Domus.
**Perché:** oggi le 8 recensioni statiche (`app/lib/reviews.ts`) sono demo marcate come tali; le
top 5 reali danno peso alla prova sociale anche a widget spento.
**Dove:** `app/lib/reviews.ts` (fallback) + evidenza in `Reviews.tsx`.

- [ ] Top 5 recensioni selezionate

---

## 9. Stat esatte [P1]

**Chiedere:** i **numeri veri** da mostrare: **rating medio** e **numero recensioni** (screenshot
del pannello Google/Trustindex), più le statistiche di autorità (immobili venduti, anni di
attività, giorni medi di vendita, ecc.).
**Perché:** oggi in più punti compaiono **"4.9/5"** e **"500+"**; vanno confermati e resi
**coerenti** ovunque (Hero, `Stats.tsx`, `recensioni/page.tsx`, `layout.tsx`).
**Dove:** `app/lib/site.ts` (`rating`, `reviewsCount`) + valori hardcoded da allineare.

- [ ] Rating medio verificato (screenshot)
- [ ] Numero recensioni verificato (screenshot)
- [ ] Altre statistiche (venduti, anni, tempi medi)

---

## 10. Claim "più recensita della provincia di Varese" [P1]

**Chiedere:** possiamo mantenere il claim *"Tra le agenzie indipendenti più recensite della
provincia di Varese"*? C'è una fonte/prova, o preferite riformularlo?
**Perché:** è un claim comparativo di primato: senza fonte va ammorbidito o riformulato.
**Dove:** `app/lib/site.ts` → `authority`.

- [ ] Claim confermato con fonte, oppure riformulato

---

## 11. Orari di apertura [P1]

**Chiedere:** gli **orari** della sede di Tradate (giorni e fasce).
**Perché:** dato di contatto atteso da un utente locale, oggi **mancante**; utile anche per SEO
locale e JSON-LD.
**Dove:** da aggiungere a `app/lib/site.ts` e mostrare in `Contact.tsx` / Footer.

- [ ] Orari di apertura forniti

---

## 12. Testo Domus D.O.C. approvato [P3]

**Chiedere:** la formulazione **ufficiale e approvata** del protocollo **Domus D.O.C. — Domus di
Origine Certificata**: i pilastri e la promessa. Ok anche sul piano legale/comunicativo (è un
claim di "certificazione").
**Perché:** è un asset proprietario; il testo deve essere del cliente, non una nostra stesura.
**Dove:** `app/components/DomusDocProtocol.tsx` (`pillars[]`) + `Services.tsx`.
**Bonus:** cogliere l'occasione per far validare anche i testi di **Metodo**, **Servizi**,
**Open Domus** e il **payoff** dell'hero.

- [ ] Testo Domus D.O.C. ufficiale (pilastri + promessa)
- [ ] Validazione testi Metodo / Servizi / Open Domus / payoff

---

## 13. Approvazione "Segno Domus" [P3]

**Chiedere:** l'OK a usare il **Segno Domus** come **firma grafica ricorrente** (cornice hero,
angoli su card premium, divisori, badge sugli eyebrow). Mostrare dal vivo dove appare.
**Perché:** è l'elemento che rende il sito **riconoscibilmente Domus Tua** e non un template.
Va usato con misura (al massimo uno per sezione): confermare tono e livello di presenza.
**Dove:** `app/components/BrandMotif.tsx` (+ `SectionDivider.tsx`), doc `docs/brand-motif.md`.

- [ ] "Segno Domus" approvato come firma ricorrente

---

## Extra utili (se emergono in call)

- **Dati societari** completi (ragione sociale, P.IVA, indirizzo) e **handle social** da confermare
  (Facebook, TikTok) → `app/lib/site.ts`.
- **Testi legali** privacy/cookie definitivi (idealmente dal loro DPO/consulente) → `/privacy`, `/cookie`.
- **Dominio** ufficiale + accesso **DNS** per puntarlo a Vercel; secret di produzione da impostare nei
  Project Settings (mai committare).
- Eventuale **feed/widget Instagram** live → `embeds.instagramIframe` in `Social.tsx`.

---

## Checklist rapida (da spuntare in call)

- [ ] [P1] File logo ufficiale (vettoriale + favicon)
- [ ] [P2] Video hero: preferenza + clip
- [ ] [P2] Foto Raffaela + team (alta risoluzione + liberatorie)
- [ ] [P2] Video YouTube: link + timestamp + titoli
- [ ] [P1] Accesso RealSmart (feed/API + payload + URL foto)
- [ ] [P1] Widget/embed Trustindex
- [ ] [P1] Link scheda Google recensioni
- [ ] [P1] Top 5 recensioni
- [ ] [P1] Stat esatte (rating, n° recensioni, venduti/anni)
- [ ] [P1] Orari di apertura
- [ ] [P1] Claim "più recensita" (fonte o riformulazione)
- [ ] [P3] Testo Domus D.O.C. approvato + testi brand validati
- [ ] [P3] Approvazione "Segno Domus"
