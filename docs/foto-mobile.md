# Le foto sul telefono — il ritaglio, misurato e chiuso

**Data:** 2026-08-19 · **Richiesta cliente:** «su mobile la foto di Raffaela è tagliata, e anche
l'immagine di sfondo sotto quando si entra nel sito. Stessa cosa per altre foto nel sito.
Dobbiamo rimpicciolirle e posizionarle bene in modo che siano proporzionate come nella versione
desktop. È possibile farlo senza cambiare la versione desktop?»

La risposta breve alle due domande: **sì, ed è tutto sotto i 768 px.** Il desktop non cambia di
un pixel — verificato, non promesso (§5).

---

## 1. Il difetto, in numeri

Non era un'impressione: è una frazione, e si misura. `npm run probe:crop` apre ogni rotta a 390 e
a 1440, legge per ogni `<img>` la scatola renderizzata, `object-fit` e `object-position`, e
calcola **quanta parte della sorgente sopravvive** al ritaglio.

La regola che governa tutto è una sola:

```
keepW = rapportoScatola / rapportoSorgente          (quando la scatola è più stretta della foto)
```

Cioè: **quanto si vede dipende SOLO dal rapporto della scatola.** Non dall'`object-position` (che
sceglie *quale* striscia, non *quanta*), non da `sizes` (che sceglie il file, non l'inquadratura),
non dalla scala (che ingrandisce la striscia sbagliata).

Tutte le fotografie del sito sono orizzontali (1,18 – 2,51). Uno schermo di telefono è verticale
(390×844 = 0,46). Chiedere a una foto 1,41 di riempire una scatola 0,46 significa ingrandirla
finché l'altezza basta — e buttare i tre quarti della larghezza.

Misura a freddo, prima di toccare niente (`docs/shots/crop-prima.json`):

| superficie | file | scatola 390 | prima | desktop |
|---|---|---|---|---|
| hero della home | `hero-raffaela.jpg` (1,41) | 390×1052 | **26 %** | 100 % |
| sagoma del preloader | `raffaela-sagoma-m.webp` (1,41) | 390×844 | **33 %** | 100 % |
| fondale HorizonStory | `hero-aerial.jpg` (2,00) | 390×844 | **23 %** | 80 % |
| PageHero (×8 pagine) | `hero_*`, `premium_*` (1,78-1,80) | 421×747 | **27-31 %** | 92 % |
| intro dei percorsi | `raffaela-team-sede.jpg` (1,78) | 390×608 | **36 %** | 90 % |
| testimonianza | `consulenza.jpg` (1,18) | 480×849 | **48 %** | 55 % |
| ritratto Open Domus | `raffaela-founder.jpg` (1,50) | 332×415 | **53 %** | 84 % |
| lastra Servizi | `rendering_01` (1,78) | 369×405 | **51 %** | 71 % |
| squadra in rosso | `team-red.jpg` (0,86 **verticale**) | 350×262 | **65 %** (altezza) | 65 % |

Il divario fra le due colonne — 60 punti sulle prime cinque righe — è la definizione del difetto:
**non è una fotografia sbagliata, è una scatola verticale**. Sul desktop le stesse identiche foto
si vedono per intero.

### Perché proprio un avambraccio

Il caso segnalato dal cliente è il più netto e vale la pena vederlo per esteso. Nella sorgente
Raffaela sta a **sinistra**: il corpo dal 4,5 % al 28 % della larghezza, la mano tesa fino al 46 %.
Con `object-position: 50%` la striscia superstite è centrata: dal 37 % al 63 %. Dentro quella
striscia **lei non c'è** — c'è il suo avambraccio, ingrandito tre volte, più il divano e la
vetrata. Il testo alternativo dice «Raffaela Rizza presenta il soggiorno»: sul telefono non si
vedeva né lei né il soggiorno.

### Un difetto dentro il difetto

Il patto scritto in `PreloaderShell.tsx` — sagoma e foto coincidono «pixel su pixel», così quando
l'arco si apre la silhouette *diventa* la stanza — **valeva solo da 768 in su**. Sotto, il
pannello del sipario è alto quanto il viewport (844) e la sezione dell'hero lo sfonda (1052): due
scatole diverse, due ritagli diversi, nessuna coincidenza. Nessuno se n'era accorto perché in
entrambi i casi si vedeva un avambraccio, e due avambracci sbagliati si somigliano.

---

## 2. Le strade possibili, e perché una sola

Dalla formula del §1 discende che ci sono **esattamente due leve**:

1. **cambiare il rapporto della scatola** — la foto smette di riempire l'altezza e diventa una
   fascia;
2. **tagliare un altro file** — un ritaglio verticale dedicato al telefono, composto a mano.

Sono state provate entrambe, come CSS vero sulla pagina vera, e confrontate a schermo
(`docs/shots/scelta.png`). La (2) — riquadrare senza rimpicciolire — lascia la foto ingrandita:
sposta l'inquadratura ma la stanza resta un frammento, e per le sette foto di stanze non c'era
nessun ritaglio verticale che le rendesse leggibili. Chiede inoltre dodici asset nuovi, ognuno con
una scelta di composizione da rifare a ogni cambio di foto.

È stata scelta la **(1)**, che è anche ciò che chiedeva la lettera del cliente
(«rimpicciolirle e posizionarle bene»): niente asset nuovi, nessun file in più da scaricare, e la
regola vive in un posto solo.

---

## 3. Cos'è cambiato

Tutto sta in `app/globals.css`, dentro il blocco `@media (max-width: 767.98px)` già esistente.
**Da 768 in su nessuna di queste regole esiste**: `absolute inset-0` resta intatto.

### 3a. La fascia di Raffaela (preloader + hero)

Un solo insieme di numeri per **due** nodi — `[data-pre-figure]` del sipario e `[data-hero-photo]`
dell'hero — perché è quello che li fa coincidere:

```css
--dt-fascia-w: 180vw;                              /* 702 px su 390 */
--dt-fascia-h: calc(var(--dt-fascia-w) / 1.4134);  /* il rapporto della sorgente */
--dt-fascia-x: -7vw;
```

La foto non si ingrandisce più per riempire l'altezza: si porta **alla scala che avrebbe su uno
schermo largo il doppio** e si appoggia al piede della prima schermata. Raffaela viene 132 px
larga — **il 34 % dello schermo, esattamente la quota che occupa sul desktop** (475 px su 1440).

Entrambi i nodi partono da `top: 0` della propria scatola (il pannello fisso del sipario e la
sezione dell'hero cominciano tutti e due a y = 0 con la pagina ferma), quindi lo stesso `top`
calcolato li sovrappone senza dipendere da come il browser conta l'altezza del viewport.

Il limite di `--dt-fascia-x` non è estetico ma geometrico: il fianco sinistro di Raffaela comincia
al 4,5 % della sorgente, cioè a 31,6 px di 702. Oltre i 7vw le si taglierebbe il braccio contro il
bordo — che è il difetto da cui si parte.

Con la figura finalmente in campo, il testo del sipario doveva farle posto, e lo fa **nel modo in
cui glielo fa già il desktop**: lì i caps stanno in colonna sul bordo destro
(`md:absolute md:right-[7vw]`) proprio perché a sinistra c'è lei. Sul telefono ora vale la stessa
regola — caps in colonna a destra, piede (linea di carica + payoff) allineato a destra. Prima
erano centrati sopra la sua giacca bianca: cream al 60 % su pizzo bianco, cioè illeggibili.

### 3b. La fascia generica (`.dt-mob-band`)

Per il resto del sito, una classe sola:

```css
.dt-mob-band {
  top: 0; bottom: auto;
  height: var(--dt-band-h, 78vw);        /* rapporto 1,28 */
  mask-image: linear-gradient(to bottom, #000 var(--dt-band-solid, 72%), transparent 100%);
}
.dt-mob-band--basso  { /* ancorata in basso, testo sopra la foto */ }
.dt-mob-band--centro { /* centrata, senza dissolvenza: per le foto che vivono nel crema */ }
```

78vw dà una scatola 1,28: su una sorgente 16:9 tiene il **71 %** della larghezza invece del 29 %;
su una 4:3 la tiene tutta. La fascia si spegne in dissolvenza sul fondo scuro della sezione invece
di finire con un taglio netto, così sotto continua il colore e il testo che ci passa sopra resta
leggibile come prima.

Dove la sezione non aveva un fondo (la foto copriva tutto, quindi non serviva) ne è stato aggiunto
uno **invisibile sul desktop**, perché lì la foto continua a coprire `inset-0` per intero:
`bg-ink` su `PageHero`, `bg-espresso` su `.dt-paths_intro`, `bg-graphite` sulla lastra Servizi,
`bg-cream-deep` sul pannello di HorizonStory.

### 3c. Due cornici col rapporto sbagliato

Due casi non volevano una fascia ma una cornice giusta:

- **`OpenDomus.tsx`** — `aspect-[4/5]` su una sorgente 3:2 esatta. Ora `aspect-[3/2]` sotto i 640;
  `sm:aspect-[16/10]` e `lg:aspect-auto` invariati.
- **`ChiSiamoContent.tsx`** — `team-red.jpg` è l'unica **verticale** del gruppo (0,86) dentro una
  cornice 4/3: `object-cover` tagliava il 35 % dell'altezza, cioè teste e piedi. Ora
  `aspect-[7/8]` sotto i 640 — dove la griglia è a una colonna — e `sm:aspect-[4/3]` da lì in su,
  per non sfilare la riga della griglia.

---

## 4. Il risultato, negli stessi numeri del §1

| superficie | prima | dopo |
|---|---|---|
| hero della home | 26 % | **100 %** |
| `consulenza` su /lavora-con-noi | 39 % | **93 %** |
| `consulenza` su /acquista, /vendi, /recensioni | 48 % | **93 %** |
| PageHero (×8 pagine) | 27-31 % | **70-72 %** |
| fondale HorizonStory | 23 % | **64 %** |
| intro dei percorsi | 36 % | **72 %** |
| squadra in rosso | 65 % | **99 %** |
| ritratto Open Domus | 53 % | **84 %** |
| lastra Servizi | 51 % | **64 %** |

**Nessuna immagine è peggiorata**, a nessuna delle due larghezze.

Sagoma e foto ora coincidono anche sul telefono: misurate, `x -27 / y 347 / 702×497` tutte e due —
il patto «pixel su pixel» del preloader vale finalmente a ogni larghezza.

---

## 5. Come si è verificato che il desktop non cambia

Non a occhio:

- **Geometria, ogni immagine.** `npm run probe:crop` prima e dopo, confronto automatico a 1440:
  **84 immagini con la stessa identica quota di sorgente visibile, zero cambiate.** Le 12 righe
  che differiscono hanno la percentuale identica e la scatola diversa di pochi pixel: sono
  caroselli còlti in un punto diverso dello scrub fra le due passate.
- **Pixel.** Screenshot del preloader a 1440 prima/dopo: **0 byte di differenza.** Sull'hero la
  differenza è dello 0,46 %, contro uno **0,36 % di rumore misurato fra due scatti dello stesso
  build** (l'immagine ha un'animazione continua): stesso ordine di grandezza, nessun segnale.
- **Suite.** `npm run lint`, `npm run typecheck`, `npm test` (1 283 test), `npm run test:e2e`
  (**313 passati, 0 falliti**) su cinque viewport.

### L'unico test toccato, e perché non è un test indebolito

`e2e/mobile-effects.spec.ts:418` leggeva `will-change` dopo uno `scrollTo(page, 400)` scritto a
mano. Da quando la foto di `PageHero` è una fascia, il layer non è più alto quanto la sezione — a
390 sono ~304 px — quindi a scrollY 400 **è già uscito dal campo e `will-change` viene tolto,
correttamente**. L'asserzione è rimasta identica («in campo il layer è promosso»); è il punto in
cui la si misura che ora viene preso dalla geometria vera (`innerH / 2`) invece che da un numero
inchiodato. Il test continua a fallire se la promozione sparisce davvero.

---

## 6. Cosa NON è stato toccato, e perché

- **I due pannelli dei percorsi** (`consulenza` 42 %, `villa-pool` 33 % sulla home). Sembrano
  candidati dai numeri, ma il ritaglio è stato **renderizzato e guardato**: la striscia superstite
  di `villa-pool` tiene la facciata, le palme, il bordo piscina e la figura — è una composizione
  verticale che funziona, non un frammento. Cambiarla sarebbe stato peggiorare qualcosa che legge
  bene per far quadrare una tabella.
- **Le tessere del nastro Servizi** (`open-domus-teresa.jpg`, 2,51 in una cornice 4/5 → 37 %).
  Il ritaglio è severo **a ogni larghezza, desktop compreso**: non è un difetto del telefono, ed è
  fuori dal perimetro «senza cambiare il desktop». Vale una decisione a parte, insieme al cliente:
  quella foto è panoramica e nessuna cornice verticale la salva.
- **Gli attributi `sizes`.** L'audit li segnalava come possibili sovra-dichiarazioni. Misurati sui
  byte davvero scaricati a freddo: **2 545 KB a 390 contro 2 565 KB a 1440**, file massimo 1 280 px
  su entrambi. Nessun sovraccarico da correggere, quindi nessuna modifica: sarebbe stato rumore su
  una misura che non lo chiedeva.

---

## 7. Strumenti lasciati in casa

```bash
npm run probe:crop                                  # a 390 e 1440, sul build in ascolto su :3181
npm run probe:crop -- --widths 360x740 --min 0.8    # altre larghezze, altra soglia
```

Stampa le righe sotto soglia ordinate per perdita e scrive il JSON completo in
`docs/shots/crop.json` (`docs/shots/` è gitignored). Vuole una build di produzione già in ascolto
(`npx next start --port 3181`), come le altre sonde del repo.

Se un giorno si aggiunge una fotografia a tutto schermo, la si passa di qui: se esce sotto il
65 %, o le si dà `.dt-mob-band`, o si sa già cosa si sta accettando.
