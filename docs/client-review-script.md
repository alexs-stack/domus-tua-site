# Script di presentazione al cliente — Domus Tua

> Documento **interno sersan**. Non condividere così com'è: è il talk-track per la prossima
> call di revisione con Raffaela Rizza e il team Domus Tua. Ordine delle sezioni allineato
> alla homepage reale (`app/page.tsx`). Per ogni tappa: **cosa mostrare**, **cosa dire**,
> **cosa è demo/placeholder**, **cosa serve da loro**.

---

## 0. Apertura — posizionamento (dire questo, testuale)

> **"Non stiamo rifacendo un sito: stiamo portando online il Metodo Domus Tua."**

Poi, in 30 secondi:

- Il sito non è una vetrina di annunci come tutti gli altri. È il **vostro metodo** reso
  navigabile: chi vende trova rassicurazione e prova, chi compra trova ricerca e chiarezza.
- Tutto ruota attorno a tre pilastri proprietari — **Metodo Domus Tua**, **Open Domus**,
  **Domus D.O.C. (Domus di Origine Certificata)** — e a una persona: **Raffaela**.
- Palette e tono sono i vostri: **rosso, grigio caldo, bianco caldo**. Niente oro, niente
  blu, niente freddo corporate. Premium ma umano.
- Oggi vi mostriamo un sito **completo e navigabile**. Alcuni contenuti sono ancora
  **segnaposto onesti** (immobili, alcune recensioni, video): sono lì per farvi vedere la
  forma finale. Alla fine vi diciamo **esattamente cosa ci serve da voi** per renderlo 100% reale.

Nota di taglio: parlare **al plurale del metodo, al singolare della persona**. Il metodo è il
prodotto, Raffaela è il volto.

---

## 0-bis. Come inquadrare i contenuti in anteprima (onestà)

In anteprima (build con `NEXT_PUBLIC_PREVIEW_BADGE=true`) in basso a sinistra compare un
piccolo badge **"Preview — contenuti in verifica"**. Cliccandolo si apre una **checklist
interna** che dice, in tempo reale, cosa è già collegato e cosa è ancora demo: **Logo**,
**Immobili** (RealSmart live vs mock), **Recensioni** (Trustindex live vs fallback),
**Hero video** (video vs poster), **Lead** (Google Sheet + WhatsApp / solo WhatsApp).

Regola d'oro con il cliente: **non spacciare mai il demo per reale**. Quando si arriva su una
parte ancora provvisoria, dire una frase semplice e trasparente, ad esempio:

> *"Questa è la forma finale; il contenuto qui è un segnaposto onesto — lo accendiamo con i
> vostri dati reali appena ce li passate."*

Cosa **non** fare: leggere una recensione demo come se fosse di un cliente vero, citare numeri
non verificati come definitivi, far credere che il video hero sia già online. Il badge serve
proprio a ricordarlo a noi durante la call: è **invisibile in produzione** (`=false`), quindi
il cliente finale non lo vedrà mai. La honesty non toglie forza alla demo — la rende credibile.

---

## 1. Hero cinematico + direzione video

**Mostra:** l'apertura della homepage (`HeroCinematic`).

**Di':**
- L'apertura è pensata per essere **un video**, non una foto: energia, emozione, prova sociale,
  sicurezza. Raffaela e il team al centro.
- Oggi vedete la **foto reale di Raffaela + team** come base/poster: il sito non è mai vuoto.
  Appena ci consegnate la clip, l'hero diventa video **da solo**, senza altri interventi.
- Il video parte solo su desktop, è **muto e in loop**; su mobile e per chi ha "riduci
  animazioni" resta la foto (leggera, testo sempre leggibile, pulsanti sempre visibili).
- Firma d'autore: la cornice **Segno Domus** attorno al canvas — è la nostra firma grafica
  ricorrente, discreta, che rende il sito riconoscibile come "vostro".

**Direzione della clip (shot list ideale):** Raffaela che accoglie/parla, il team in sede, un
Open Domus affollato, visite e tour, consegna delle chiavi, clip in stile reel. Caldo, luminoso,
umano — no stock freddo. 15–35 secondi, 16:9, 1080p.

**Placeholder:** il video (foto reale al suo posto).
**Serve da loro:** la clip (dettagli tecnici e nomi file in `docs/hero-video.md`).

---

## 2. Ricerca per chi compra (buyer)

**Mostra:** la barra `HomeSearchGateway` subito sotto l'hero, e poi la pagina `/case`
(`PropertySearch`).

**Di':**
- Chi arriva per **comprare** ha subito la ricerca in mano: zona, tipo di contratto, tipologia,
  budget, locali, caratteristiche. Filtri veri su dati normalizzati.
- C'è anche un campo in **linguaggio naturale** ("trilocale con giardino a Tradate sotto 300k").
  Oggi è un **teaser dichiarato "in arrivo"**: non esegue query e non finge di funzionare. È il
  segnaposto della **Fase 2** (vedi `docs/phase-plan.md`).
- Gli immobili oggi sono **6 schede demo**: servono a mostrare listing, filtri e scheda di
  dettaglio. Diventeranno reali con la **sincronizzazione RealSmart**.

**Placeholder:** i 6 immobili (`app/lib/properties.ts`), il campo NL.
**Serve da loro:** accesso RealSmart (vedi tappa 8).

---

## 3. Percorso di fiducia per chi vende (seller)

**Mostra:** la card "vendere" nel gateway, poi le sezioni `Paths` → `Method` → `OpenDomus`,
e la pagina `/vendi`.

**Di':**
- Chi vende non cerca un filtro: cerca **rassicurazione**. Il percorso lo prende per mano —
  "Vendere senza stress" — e gli spiega **come** lavorate, non solo che lavorate.
- Il cuore è il **Metodo Domus Tua** (`Method`): i passi, la chiarezza, il fatto che non è
  improvvisazione ma un processo ripetibile.
- **Open Domus** (`OpenDomus`) è la prova che il metodo funziona: l'evento che porta più
  visitatori qualificati in un giorno. Qui c'è già la **storia reale di "Teresa"** come prova
  sociale forte.
- Il form segmenta subito **"vendere / acquistare"**, così il lead arriva già qualificato.

**Placeholder:** i testi di metodo/servizi sono redazionali, plausibili ma **da validare** dalla
founder; la clip Open Domus.
**Serve da loro:** approvazione dei testi; eventuale video/foto Open Domus + liberatoria.

---

## 4. Social & video wall

**Mostra:** `SocialVideoWall` (in homepage subito dopo Authority) e la sezione `Social`.

**Di':**
- Il sito è **video/social-driven**: la vostra forza è che avete già contenuti reali con volti
  veri. Il muro video mette in vetrina i vostri **video YouTube** con thumbnail reali.
- La sezione `Social` può ospitare un **feed Instagram reale** (widget) al posto della griglia
  curata attuale, se lo volete live.

**Placeholder:** gli ID/titoli YouTube sono impostati ma **da confermare**; la griglia IG è
libreria in attesa di un eventuale widget.
**Serve da loro:** elenco definitivo video (URL/ID + **timestamp** del momento saliente +
conferma titoli); eventuale URL widget Instagram.

---

## 5. Recensioni Google / Trustindex

**Mostra:** la sezione `Reviews` + la pagina `/recensioni`.

**Di':**
- Le recensioni sono uno dei vostri **asset di credibilità più forti** e sul sito risultano
  **chiaramente Google/Trustindex** — non testimonianze decorative: badge fonte per card,
  stelle, data, spunta "verificato", link diretto alla scheda Google.
- Il sito è **già cablato sul vostro widget Trustindex reale** (l'hash trovato su domustua.com):
  quando è attivo mostra le **recensioni reali verificate** ovunque, con fallback demo marcato
  "Esempi dimostrativi" finché serve.
- Il pulsante "Leggi su Google" punta già alla **vostra scheda Google Business reale**
  (non a una ricerca generica).

**Placeholder:** le 8 recensioni statiche di `app/lib/reviews.ts` (fallback); i numeri "trust"
(oggi **4.9/5** e **500+**) da confermare.
**Serve da loro:** codice/loader widget Trustindex definitivo; **rating e n° recensioni
verificati** (screenshot pannello); selezione delle **top 5** da mettere in evidenza.

---

## 6. Metodo Domus Tua & Domus D.O.C.

**Mostra:** `Method` e `DomusDocProtocol` in homepage, più la pagina `/metodo`.

**Di':**
- **Metodo Domus Tua** è il filo narrativo di tutto il sito: è ciò che vi distingue da
  "un'agenzia qualunque".
- **Domus D.O.C. — Domus di Origine Certificata** è il vostro protocollo proprietario, presentato
  come una **certificazione** con i suoi pilastri. Proprio perché è un claim di certificazione,
  il testo deve essere **il vostro, approvato** anche a livello legale/comunicativo.

**Placeholder:** i pilastri D.O.C. e la promessa sono una **prima stesura** nostra.
**Serve da loro:** formulazione ufficiale e approvata di Domus D.O.C. (i pilastri + la promessa).

---

## 7. Open Domus

**Mostra:** la sezione `OpenDomus` e la pagina `/open-domus`.

**Di':**
- Open Domus è un **asset proprietario** e una macchina di prova sociale: merita una pagina sua.
- È anche il contenuto video più "caldo": la storia di Teresa, l'evento affollato, "venduto al
  primo Open Domus". Ottimo materiale sia per l'hero video sia per il muro video.

**Placeholder:** immagini/clip Open Domus.
**Serve da loro:** foto/video reali di un Open Domus + liberatoria del cliente ripreso.

---

## 8. Sincronizzazione RealSmart

**Mostra:** la pagina `/case` con filtri, poi una scheda `/case/[slug]`.

**Di':**
- Gli immobili non li gestirete due volte: **RealSmart resta la vostra unica fonte** (single
  source of truth). Il sito è **già predisposto** per agganciarsi al feed/API RealSmart —
  strato di normalizzazione, tipi e client sono pronti (`app/lib/realsmart/`).
- Finché non ci date accesso, il sito gira sui **6 immobili demo**. Con l'accesso, gli annunci
  diventano **reali e sempre allineati** al gestionale, senza doppio inserimento.
- Vi mostreremo la scheda immobile (galleria, dettagli) così vedete la **forma finale** di un
  annuncio reale.

**Placeholder:** i 6 immobili demo.
**Serve da loro (in ordine di preferenza):** (A) feed dedicato JSON/XML, (B) stesso feed dei
portali, (C) API REST — con credenziali, **un esempio reale di payload** e gli **URL delle foto**
(risoluzioni, watermark, diritti d'uso). Domande di dettaglio in `docs/realsmart-integration-notes.md`.

---

## 9. Riepilogo "cosa è segnaposto"

Dire con trasparenza — è un punto di forza, non una debolezza:

- **Immobili** → 6 demo, in attesa di RealSmart.
- **Recensioni** → widget Trustindex reale già cablato; 8 recensioni statiche come fallback;
  numeri 4.9/500+ da confermare.
- **Video hero e muro video** → foto reali al posto delle clip; ID YouTube da confermare.
- **Logo** → oggi ricostruito/segnaposto onesto; useremo il **vostro logo ufficiale** appena
  ci mandate i file (non lo ridisegniamo).
- **Testi** metodo / servizi / Open Domus / Domus D.O.C. → prima stesura, da validare.
- **Legale** → privacy/cookie da riempire con i vostri testi definitivi.

---

## 10. Cosa ci serve da voi (chiusura della call)

Passare qui alla checklist operativa — dettaglio completo in `docs/questions-for-client.md`.
In sintesi, per sbloccare il "live":

1. **File del logo ufficiale** (vettoriale + favicon).
2. **Clip video hero** (o conferma di quale preferite).
3. **Foto/video reali** di Raffaela e team (alta risoluzione + liberatorie).
4. **Elenco video YouTube** definitivi + **timestamp** + conferma titoli.
5. **Accesso RealSmart** (feed/API + credenziali + esempio payload + URL foto).
6. **Widget Trustindex** + **link scheda Google** + **rating/n° recensioni** verificati + **top 5** recensioni.
7. **Stat esatte** da mostrare (immobili venduti, anni, ecc.).
8. **Orari di apertura** della sede di Tradate.
9. **Testo Domus D.O.C.** approvato + validazione dei testi di metodo/servizi.
10. **OK sul "Segno Domus"** come firma grafica ricorrente.

Chiudere ricordando il posizionamento: **il sito è pronto nella forma; ci mancano i vostri
contenuti reali per accenderlo.**
