# Checklist sostituzione contenuti — pre-demo cliente

Mappa di **ogni contenuto demo o da verificare** presente nel sito, con file esatto, stato e
cosa serve dal cliente per andare in produzione. Obiettivo: sapere in un colpo d'occhio cosa
è reale, cosa è placeholder e cosa va confermato **prima della demo/messa online**.

Legenda stato:
- ✅ **Confermato** — dato reale, verificato, si può lasciare.
- 🟡 **Da confermare** — plausibilmente reale ma da validare col cliente.
- 🔶 **Demo** — contenuto fittizio dimostrativo, da sostituire prima del pubblico.
- 🔴 **Da sostituire prima della demo** — placeholder che, se lasciato, comunica un dato falso o incoerente.

---

## 1. Recensioni

| Contenuto | File esatto | Tipo | Stato | Cosa deve fornire il cliente |
| --- | --- | --- | --- | --- |
| 8 recensioni (nome, luogo, testo, rating, data, source) | `app/lib/reviews.ts` (`reviews[]`) | Testi + metadati fittizi | 🔶 Demo | Recensioni reali (o attivare widget Trustindex, vedi sotto). I testi attuali sono ripresi dal fallback statico e i valori `date`/`source`/`verified` sono plausibili ma inventati. |
| Riepilogo rating "4.9" + "500+" | `app/lib/reviews.ts` (`reviewSummary`) | Statistica | 🟡 Da confermare | Numero recensioni e media aggiornati (screenshot pannello Google/Trustindex). |
| Widget Trustindex live | `app/lib/site.ts` (`embeds.trustindexSrc`) + `app/components/Reviews.tsx` | Embed script | 🔴 Da sostituire prima della demo | Codice loader Trustindex (`https://cdn.trustindex.io/loader.js?...`). Se popolato, il sito mostra le **recensioni reali** al posto delle demo; altrimenti resta il fallback fittizio. |
| URL "Vedi tutte su Google" | `app/lib/site.ts` (`googleReviewsUrl`) | Link | 🟡 Da confermare | URL esatto della scheda Google Business (ora è una ricerca Google generica, non il profilo diretto). |
| Recensione featured / foto clienti | `public/images/reali/recensione-clienti.jpg`, `app/components/FeaturedTestimonial.tsx` | Foto + citazione | 🟡 Da confermare | Conferma che la foto e la citazione siano reali e liberatoria d'uso dell'immagine. |

---

## 2. Immobili

| Contenuto | File esatto | Tipo | Stato | Cosa deve fornire il cliente |
| --- | --- | --- | --- | --- |
| 6 immobili demo (prezzi, mq, zone, testi, features) | `app/lib/properties.ts` (`properties[]`) | Schede immobile fittizie | 🔶 Demo | Nulla da fornire manualmente: vanno sostituiti dal **feed RealSmart** (single source of truth). Vedi `docs/realsmart-integration-notes.md`. |
| 6 immobili mock RealSmart | `app/lib/realsmart/mocks.ts` | Payload grezzo fittizio | 🔶 Demo | Sostituiti automaticamente quando `fetchRawListings()` punterà al feed reale. Restano come fallback/test. |
| Foto immobili | `public/images/*.jpg` (`hero_*`, `premium_*`, `rendering_*`, `before_after_*`, `home_staging_*`) | Immagini libreria | 🔶 Demo | Foto reali arriveranno dai media RealSmart; le attuali sono immagini di libreria/rendering. |
| Badge editoriali ("In esclusiva", "Open Domus", "Virtual tour", "Documenti verificati") | `app/lib/properties.ts`, derivati in `app/lib/realsmart/normalize.ts` | Etichette | 🟡 Da confermare | Confermare quali badge sono veri per immobile (o le regole per derivarli dal feed). |
| Foto reale immobile di riferimento | `public/images/reali/attico-tradate.jpg` | Foto reale (canali) | 🟡 Da confermare | Conferma immobile ancora attivo e liberatoria d'uso. |

---

## 3. Statistiche e claim

| Contenuto | File esatto | Tipo | Stato | Cosa deve fornire il cliente |
| --- | --- | --- | --- | --- |
| "L'agenzia immobiliare indipendente più recensita della provincia di Varese" | `app/lib/site.ts` (`authority`), usato in `app/components/Authority.tsx` | Claim di primato | 🔴 Da sostituire prima della demo | **Prova/fonte** del primato (es. confronto numero recensioni). Claim comparativo di primato: senza fonte è rischioso (pubblicità comparativa). Se non dimostrabile, riformulare. |
| "4.9/5" (rating) | `app/lib/site.ts` (`rating`) — usato in Hero, Authority, Stats, Reviews, SocialVideoWall, layout metadata | Statistica | 🟡 Da confermare | Media reale aggiornata. |
| "500+" / "oltre 500 recensioni" | `app/lib/site.ts` (`reviewsCount`), `app/lib/reviews.ts`, `app/components/Stats.tsx` (valore hardcoded `500`), Hero (`/ 500+`), `app/recensioni/page.tsx`, `app/layout.tsx` | Statistica ripetuta in più file | 🟡 Da confermare | Numero reale. **Attenzione:** il "500" è ripetuto in più punti (alcuni hardcoded, non da `site.ts`): aggiornarli tutti insieme per coerenza. |
| "dal 2007" / "anni di esperienza" | `app/lib/site.ts` (`since: 2007`), calcolato in Authority/Stats/Team/Hero | Dato storico | 🟡 Da confermare | Anno di fondazione esatto. |
| Token di valore (Home staging, Emotional video, ecc.) | `app/components/Stats.tsx` (`tokens`) | Elenco servizi | 🟡 Da confermare | Conferma che tutti i servizi elencati siano offerti. |

---

## 4. Team e founder

| Contenuto | File esatto | Tipo | Stato | Cosa deve fornire il cliente |
| --- | --- | --- | --- | --- |
| Nome fondatrice "Raffaela Rizza" | `app/components/Hero.tsx`, `Team.tsx`, `OpenDomus.tsx`, `FeaturedTestimonial.tsx`, `app/chi-siamo/page.tsx` + filename `raffaela-*.jpg` | Nome proprio | 🔴 Da sostituire prima della demo | **Verificare la grafia:** il sito scrive "Raffael**a**" (una L) in quasi tutti i punti, il brief indica "Raffael**la**" (due L). Discrepanza già presente anche dentro `Hero.tsx` (commento vs testo). Confermare la grafia corretta e uniformare ovunque (testo + nomi file immagine). |
| Foto ritratto fondatrice | `public/images/reali/raffaela-ritratto.jpg` (Hero) | Foto reale | 🟡 Da confermare | Conferma foto ufficiale + liberatoria; idealmente versione ad alta risoluzione. |
| Foto team in sede | `public/images/reali/raffaela-team-sede.jpg` (Team) | Foto reale | 🟡 Da confermare | Conferma foto team aggiornata (persone ancora in organico) + liberatoria. |
| Foto Open Domus (Teresa) | `public/images/reali/open-domus-teresa.jpg` (OpenDomus) | Foto reale cliente | 🟡 Da confermare | Liberatoria d'uso immagine della cliente. |
| Citazione fondatrice ("Per noi una casa non è un annuncio…") | `app/components/Team.tsx` | Virgolettato | 🟡 Da confermare | Conferma/approvazione del virgolettato dalla founder. |

---

## 5. Contatti e dati agenzia (`app/lib/site.ts`)

| Contenuto | File esatto | Tipo | Stato | Cosa deve fornire il cliente |
| --- | --- | --- | --- | --- |
| Ragione sociale, P.IVA, indirizzo | `app/lib/site.ts` (`legal`, `vat`, `address`) | Dati legali | 🟡 Da confermare | Conferma ragione sociale, P.IVA `03836560122` e indirizzo `Corso Bernacchi 91, 21049 Tradate (VA)`. |
| Telefono / WhatsApp / email | `app/lib/site.ts` (`phone`, `whatsapp`, `email`) | Contatti | 🟡 Da confermare | Conferma numeri (`0331 844898`, WhatsApp `346 6042314`) ed email `info@domustua.com` attivi. |
| Orari di apertura | **Assenti nel codice** (nessun campo `hours` in `site.ts`) | Orari | 🔴 Da sostituire prima della demo | Orari di apertura reali da aggiungere a `site.ts` e mostrare in `Contact.tsx`/Footer (oggi non esiste il dato). |
| Social: Instagram, YouTube | `app/lib/site.ts` (`social.instagram`, `social.youtube`) | Link | ✅ Confermato | Canali reali già verificati. |
| Social: Facebook, TikTok | `app/lib/site.ts` (`social.facebook`, `social.tiktok`) | Link | 🟡 Da confermare | URL indicati come "da confermare" nel commento del file; validare handle esatti (o rimuovere se inattivi). |

---

## 6. Video YouTube (SocialVideoWall / Team / OpenDomus)

| Contenuto | File esatto | Tipo | Stato | Cosa deve fornire il cliente |
| --- | --- | --- | --- | --- |
| Titoli video (es. "La storia di Teresa…", "Villa Mozart, Tradate", "Domus Tua al cinema, su Prime Video") | `app/components/SocialVideoWall.tsx` (`featured`, `wall[]`) | Titoli editoriali | 🟡 Da confermare | I titoli sono redazionali (non necessariamente i titoli YouTube originali): confermare che descrivano correttamente il video linkato. |
| ID/URL video YouTube | `app/components/SocialVideoWall.tsx`, `Team.tsx` (`PRB3exiOa3I`), `OpenDomus.tsx` (`gYePYQHNTUM`) | Link | 🟡 Da confermare | Conferma che gli ID video (`gYePYQHNTUM`, `BEmbT6WbZ-c`, `PRB3exiOa3I`, `X8dRz1629F0`, `E70G5l_CTWg`, `qXYpUw3QC2E`, `rARkECgXUbU`) siano quelli giusti e pubblici. |
| Thumbnail video | `public/images/reali/video/*.jpg` (usate) + `public/images/reali/yt/*.jpg` (per-ID, non tutte referenziate) | Immagini | 🟡 Da confermare | Le thumbnail in `video/` sono nomi curati; in `yt/` sono per-ID YouTube ma **non tutte usate** nel codice. Confermare mappatura corretta ID→thumbnail. |
| Video hero (riquadro fondatrice) | `app/components/Hero.tsx` (`heroVideo = ""`) | Video | 🔶 Demo | Attualmente vuoto → mostra la foto come fallback. Fornire clip 15–35s (vedi `docs/client-assets-needed.md`). |

---

## 7. Testi servizi / metodo / Open Domus / Domus D.O.C.

| Contenuto | File esatto | Tipo | Stato | Cosa deve fornire il cliente |
| --- | --- | --- | --- | --- |
| Servizi (Valutazione, Servizi tecnici/legali, Home staging, Emotional video, Marketing) | `app/components/Services.tsx` (`services[]`) | Testi redazionali | 🟡 Da confermare | Approvazione testi e conferma elenco servizi effettivamente offerti. |
| Passi del "Metodo Domus Tua" | `app/components/Method.tsx` (`steps[]`) | Testi redazionali | 🟡 Da confermare | Approvazione descrizione del metodo. |
| Benefici Open Domus | `app/components/OpenDomus.tsx` (`benefits[]`) | Testi redazionali | 🟡 Da confermare | Approvazione claim su Open Domus (format proprietario). |
| Pilastri "Domus D.O.C. — Domus di Origine Certificata" | `app/components/DomusDocProtocol.tsx` (`pillars[]`) | Testi/claim proprietari | 🔴 Da sostituire prima della demo | Il file stesso nota che "la formulazione tecnico/legale definitiva va approvata dal cliente". Serve testo ufficiale approvato per un claim di "certificazione". |
| Payoff / titoli sezioni home | `app/components/Hero.tsx`, `SocialVideoWall.tsx`, `Social.tsx`, `Authority.tsx` | Copy | 🟡 Da confermare | Approvazione tono/claim principali (es. "più recensita", "senza stress"). |

---

## Priorità operativa prima della demo

**Bloccanti (🔴) — sistemare per primi:**
1. Grafia founder "Raffaela/Raffaella" — uniformare ovunque (`app/lib/site.ts` non contiene il nome: è hardcoded nei componenti).
2. Claim "più recensita della provincia" — fonte o riformulazione (`app/lib/site.ts`).
3. Orari di apertura — dato mancante da aggiungere.
4. Domus D.O.C. — testo/claim approvato.
5. Widget Trustindex — se si vuole mostrare recensioni reali alla demo (altrimenti le 🔶 demo restano visibili).

**Da confermare (🟡):** tutti i dati di contatto, statistiche, foto reali, ID video, testi servizi.

**Demo che si auto-risolvono (🔶):** immobili e relative foto → si sostituiscono da soli al collegamento RealSmart.
