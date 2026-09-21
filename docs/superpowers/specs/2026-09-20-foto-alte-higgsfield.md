# Foto alte generate con Higgsfield — il piano (A44, 20 settembre 2026)

## Perché

- **A41 di Alberto (20 set.)**: «non abbiamo foto lunghe e alte come era: loro le usano per uno
  scroll continuo senza uscire dalla foto». Su era-residence.com le foto sono il fondo stesso
  della pagina; misurato il 20 set.: originali a 1920 px, formati **4:5** (1920×2400, il CTA
  «Perfect sea views»), **3:4** (1920×2560, landscaping) e 10:9 (hero), in `object-fit: cover`
  dentro scatole più alte dello schermo, così scorrendo si resta dentro la foto.
- **A44 di Alberto (20 set., sera)**: la cliente non può tenere la foto dell'hero
  (`public/media/hero-raffaela.jpg`, il soggiorno di un attico: è una casa di cui hanno perso il
  cliente). Serve un'altra foto. Raffaela ha detto che **tutto ciò che è generato si può usare**,
  anche se non sono case reali. Raffaela resta col suo ritaglio (`raffaela-sagoma.png`, alpha,
  2000×1415) da posare su una foto generata, oppure si genera con lei come modella.
- Il difetto visto oggi («l'immagine spezzata», hero e preloader): la banda `--dt-band-h` è
  60svh; a 1920×977 sono 586 px, mentre la foto 2000×1415 resa a 1920 è alta 1358. Si vede il
  43 % in alto e Raffaela resta col mento sul bordo, in hero e in preloader (stessa geometria).
  La cura è quella di era: **banda 100svh e foto alta che scorre in verticale**, non un
  ritaglio più furbo.

## Cosa si genera

| # | Uso | Formato | Pixel minimi | Persone |
|---|-----|---------|--------------|---------|
| H1-H3 | **Hero della home** (fondo sotto «Domus Tua»; Raffaela posata a sinistra col ritaglio) | 2:3 | 2560×3840 | nessuna nella scena; terzo sinistro libero |
| T1-T9 | **Teste delle pagine interne** (`tinte.json`: /vendi, /acquista, /servizi, /metodo, /open-domus, /chi-siamo, /recensioni, /lavora-con-noi, /domande-frequenti) | 2:3 | 2560×3840 | nessuna |
| C1-C3 | **Corridoi** (la finestra sticky di Open Domus, la cartolina; l'immagine che si apre a schermo intero nell'animazione di era, oggi senza scritta) | 9:16 | 2160×3840 | nessuna |
| R1-R4 | **Raffaela come modella** (Soul ID / riferimento) — porta, terrazza, chiavi, salotto | 2:3 | 2560×3840 | Raffaela intera, mai tagliata (A27) |
| M1-M3 | **Telefono**: le stesse scene in 9:16 per la fascia mobile (`.dt-mob-band`, docs/foto-mobile.md) | 9:16 | 1440×2560 | come sopra |

«Più foto possibili»: per ogni prompt si chiedono **4 varianti** (seed diversi) e si tiene la
migliore; per H1-H3 e R1-R4 si chiedono 8. Totale atteso: 22 prompt × 4-8 = **100-130 immagini**,
di cui ~25 entrano nel sito.

## Il brief di stile (da era-residence, adattato a Tradate)

Cosa si tiene di era: architettura contemporanea **bianca e in pietra chiara**, linee pulite,
vetrate grandi, verde rampicante e fiori sulle facciate, **cielo azzurro limpido**, luce calda di
tardo pomeriggio con ombre lunghe e morbide, composizione **sgombra** con molto cielo in alto
(le scritte bianche stanno sulla sola fotografia, senza ombra né velo: deroga A40), acqua di
piscina, tessuti chiari, resa da rendering fotorealistico d'agenzia.

Cosa cambia perché siamo a Tradate (provincia di Varese) e non a Estepona: **niente mare e
niente palme**; al posto della bouganville glicine, gelsomino, ortensie, rose rampicanti;
sullo sfondo colline verdi, cipressi, prealpi, un lago (Varese, Como) solo dove il prompt lo
dice. Case: villa singola con giardino e piscina, attico con terrazza, casa di paese
ristrutturata, cortile a corte lombarda con portico. Interni: bianco, legno chiaro, pietra,
travi dove ha senso, luce naturale dalle vetrate.

Il negative prompt del design (DESIGN.md «Don't», C01): niente superfici nere, niente
vignettatura né veli, niente curve gratuite, **nessun testo, logo, insegna o filigrana**,
nessuna distorsione sulle persone, nessun volto tagliato, niente HDR sparato, niente
saturazione da cartolina.

## Le regole di composizione per le foto alte

1. **Cielo o soffitto nel terzo alto**, pulito: lì cadono lead e h1 bianchi delle teste
   (`.dt-testa_blocco`) e il lockup «Domus Tua» dell'hero.
2. Il soggetto (facciata, piscina, salotto) nel **60 % basso**: è quello che compare scorrendo.
3. **Hero**: il terzo sinistro a altezza occhi resta libero (pavimento in vista, nessun mobile
   alto) per posare Raffaela; la luce viene da destra o frontale, come nel ritaglio (volto
   illuminato, braccio destro teso verso destra).
4. Nessun elemento importante sui bordi laterali: sul telefono resta in campo la striscia
   centrale (docs/foto-mobile.md, `keepW`).
5. Prospettiva a altezza d'occhio, ottica 28-35 mm, linee verticali dritte (correzione
   prospettica), f/8, ISO basso.

## I prompt

Suffisso comune (in coda a ogni prompt):

> `photorealistic architectural photography, contemporary Italian villa in the green countryside of Varese near Tradate, white plaster and pale stone, large glazing, warm late-afternoon sunlight with soft long shadows, climbing wisteria and jasmine, cypresses and gentle hills, clear blue sky, clean uncluttered composition, editorial magazine quality, natural colours, no people, no text, no watermark, no logos, medium format, 32mm lens, f/8, eye level, vertical portrait 2:3, sky occupying the upper third`

Negative (dove il modello lo accetta): `sea, beach, palm trees, black surfaces, vignette, haze overlay, fisheye, tilted verticals, cropped faces, text, signage, watermark, logo, cartoon, oversaturated, HDR halos, extra limbs`

### H — Hero della home (2:3, terzo sinistro libero)

- **H1 Salotto verso il giardino**: `bright double-height living room seen from the entrance, white walls, pale oak floor, a full-height glass wall on the right opening onto a garden with a pool and hills, low linen sofa on the right, the left third of the frame is empty floor and a plain white wall at eye level, sunlight entering from the right,` + suffisso (senza «no people»: la scena è vuota ma il posto per la persona serve).
- **H2 Portico coperto**: `covered porch of a white villa, stone floor, slim white columns, wisteria hanging from the pergola beam, view over a lawn and a turquoise pool, a low outdoor sofa on the right, left third empty at eye level, golden hour light from the right,` + suffisso.
- **H3 Ingresso con scala**: `entrance hall of a renovated Lombard villa, white walls, a light oak staircase rising on the right, a tall window at the landing flooding the space with daylight, terrazzo floor, left third empty, sunlight from the right,` + suffisso.

### T — Teste delle pagine interne (2:3)

- **T1 /vendi — facciata con piscina, mattino**: `white contemporary villa facade with cantilevered roof, glass corners, a long turquoise pool in the foreground reflecting the house, wet stone deck, morning light, hills behind,`
- **T2 /acquista — giardino coi lettini**: `lawn and pool of a villa, two cream sun loungers, an olive tree and a stone wall, the white house in the background under a big sky, warm afternoon,`
- **T3 /servizi — angolo piscina**: `corner of an infinity pool meeting a white wall covered in jasmine, a glass railing, cypresses beyond, low sun,`
- **T4 /metodo — vetrata con lanterne, sera**: `glass wall of a living room seen from the terrace at dusk, warm interior light, two stone lanterns on the deck, deep blue sky, lawn in the foreground,`
- **T5 /open-domus — portico con tenda**: `stone portico with a cream awning, wooden dining table set for lunch, wisteria, view over the garden,`
- **T6 /chi-siamo — attico con travi**: `attic living room with white painted wooden beams, big dormer window, linen sofa, plants, soft daylight, tidy and airy,`
- **T7 /recensioni — salotto esterno con ombrellone**: `outdoor lounge on a stone terrace, cream parasol, rope armchairs, hydrangeas in pots, white villa wall, hills in the distance,`
- **T8 /lavora-con-noi — studio luminoso**: `bright home office in a white attic, oak desk by a big window, a chair, plants, sky through the skylight,`
- **T9 /domande-frequenti — piscina di lusso**: `long rectangular pool at a white villa, stone deck, a row of cypresses, evening light, calm water,`

Tutti + suffisso.

### C — Corridoi (9:16, molto alti)

- **C1 La facciata che sale** (finestra sticky di Open Domus, la scena di «Architecture» di era): `looking up along a white terraced facade with pergola beams, wisteria and jasmine spilling over each terrace, blue sky above, stone base below,` + suffisso (con `vertical 9:16, strongly vertical composition from ground to sky`).
- **C2 La terrazza verso le colline** (la «Perfect sea views» nostra): `rooftop terrace under a vine-covered pergola, cushioned sofas and a set table in the foreground, a low white parapet and green hills with a lake in the distance, hazy warm light,` + suffisso 9:16.
- **C3 Il corridoio di vetro**: `long glazed corridor of a villa opening onto a courtyard garden, stone floor, light and shadow stripes, jasmine on the wall outside,` + suffisso 9:16.

### R — Raffaela come modella (Soul ID / riferimento immagine)

Riferimenti da caricare (viso e figura): `public/images/reali/raffaela-ritratto.jpg`,
`raffaela-founder.jpg`, `raffaela-specchio-sorriso.jpg`, `raffaela-specchio-profilo.jpg`,
`raffaela-keys.jpg`, `raffaela-team-sede.jpg`, e il ritaglio `public/media/raffaela-sagoma.png`
(figura intera, tailleur bianco di pizzo). Descrizione della persona nel prompt:
`a smiling Italian woman in her sixties with short wavy blonde hair, wearing a white lace
blazer over a black top and white lace trousers, a black pendant necklace, confident and warm`.
Regole: figura intera o a tre quarti, **mai tagliata** (A27), volto fedele al riferimento,
nessun ritocco che la cambi, nessuna posa da stock.

- **R1 Alla porta**: `she stands at the open front door of a white villa, welcoming, one hand extended toward the garden, full body visible, morning light,`
- **R2 Le chiavi**: `she holds out a set of house keys toward the camera on a sunlit terrace, hills behind, three-quarter body,`
- **R3 In salotto**: `she presents a bright living room, standing on the left, arm extended to the right toward the glass wall, full body,` (sostituto diretto dell'hero attuale)
- **R4 Sul portico**: `she walks under a wisteria pergola of a villa, relaxed, full body, golden hour,`

Tutti + suffisso, togliendo `no people`.

### M — Telefono (9:16)

Le tre scene che vincono fra H1-H3 e R1-R4 rigenerate in 9:16 con lo stesso seed/riferimento
(«Reframe» o «Outpaint» dell'app quando c'è: si allunga la stessa immagine, non se ne fa
un'altra).

## Il flusso nell'app Higgsfield

1. **Image** → modello fotorealistico (Nano Banana Pro / GPT Image / Seedream: quello che dà il
   formato 2:3 e 9:16 nativo e la qualità 2K). Per R1-R4 il modello con riferimento del
   personaggio (**Soul** con Soul ID, o «Reference» con le foto caricate).
2. Aspect ratio **2:3** (teste e hero) o **9:16** (corridoi e telefono), qualità **2K**;
   4 varianti per prompt (8 per H e R).
3. Sulle scelte: **Upscale/Enhance a 4K** (2560×3840 o 2160×3840 e oltre). Nessun filtro
   «cinematic», nessun grain.
4. Download PNG/JPG in `C:/Users/alber/Downloads/higgsfield/` con nomi parlanti
   (`H1-salotto-01.png`).
5. Nel repo: `node scripts/media/foto-alte.mjs C:/Users/alber/Downloads/higgsfield` (da
   scrivere: toglie i metadati, verifica ≥ 2560 di larghezza e il rapporto, scrive
   `public/images/reali/<nome>-alta.jpg` q 88 e il `.webp`, aggiorna `sorgente` in
   `tinte.json`). Per l'hero: posa del ritaglio di Raffaela con `sharp` (composite sul terzo
   sinistro, altezza figura = 78 % dell'altezza foto, piede a 2 % dal bordo basso), e poi
   `raffaela-sagoma*.webp` rigenerati sullo stesso canvas per il preloader.
6. Codice (dopo le foto): hero e preloader a 100svh con pan verticale della foto alta (sotto);
   `tinte.json` con i nuovi file e le inquadrature `lg`/`sotto`; test `tinte`/`testa`/`intro-clocks`
   allineati; Playwright a 1440×900, 1920×977 e 390×844.

## Come si usano nel sito (la foto è la pagina)

*(Riscritto il 21 set., A45 di Alberto: «le foto su era residence sono la pagina stessa. Quando
scrolli, le scritte salgono su come se fossero in quello spazio della foto, e stai scrollando
la foto stessa come se fosse la pagina». La prima versione — riquadro sticky 100svh e pan con
`translateY` — era sbagliata ed è stata tolta con `usePanTesta`.)*

Come su era: la foto sta a larghezza 100 % in un riquadro IN FLUSSO alto quanto la foto resa
(`aspect-ratio` dal sorgente, mai meno di 100svh; con 2:3 a 1440: 2146 px), e scorre con la
pagina 1:1, **senza zoom, senza sticky, senza trasformate** (A27: nessun taglio dei volti). Le
scritte stanno DENTRO il riquadro, in cima, alte un primo schermo: salgono con la foto, e la foto
continua da sola per un altro schermo e mezzo prima che l'avorio riprenda. Reduced-motion e
senza JS: la stessa pagina. Il preloader mostra la stessa inquadratura dell'hero (patto della
porta, `intro-clocks.test.ts`).

## Stato

- 20 set. sera: piano scritto; nel repo il bridge Higgsfield (`bl_generate_image`) non serve
  (vuole Blender col pannello collegato e non accetta il formato); nessuna chiave API sul PC.
  Si genera dall'app web: **Alberto fa il login su higgsfield.ai nel Browser pane** e poi
  guido io l'app, oppure genera lui coi prompt sopra.
- Il video del Congedo con l'audio e la banda dell'hero a 100svh si fanno intanto (stessa
  sera, sessione «layout»).

## Generazioni del 20 settembre (sera)

Connettore claude.ai `higgsfield`, modello **Nano Banana Pro a 4K** (4 crediti l'una; il server la registra come `nano_banana_2`), 22 immagini, 88 crediti su 110 (restano 22). Le generazioni «unlimited» non erano disponibili; invio a gruppi di 3 (a 12 in parallelo il server risponde «out of credits» a torto). Riferimenti caricati per le R: `raffaela-sagoma.png` (media `c9e70fca-…`) e `raffaela-ritratto.jpg` (media `21d7ef23-…`). Gli URL del CDN sono quelli della galleria Higgsfield; i file vanno salvati in `C:/Users/alber/Downloads/higgsfield/` col codice come nome.

| Codice | Uso | Formato | Pixel | Job | File |
|---|---|---|---|---|---|
| H1 | hero, salotto doppia altezza, terzo sinistro libero | 2:3 | 3392×5056 | `80f076f5` | [hf_20260920_171624_80f076f5-ee06…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171624_80f076f5-ee06-491c-bc59-049dedb59bf5.png) |
| H1b | hero, salotto con ulivo (seed 2) | 2:3 | 3392×5056 | `5170304e` | [hf_20260920_172348_5170304e-ace6…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172348_5170304e-ace6-4000-8213-c3b95ffd50ca.png) |
| H2 | hero, portico coperto col glicine | 2:3 | 3392×5056 | `2058b57d` | [hf_20260920_171623_2058b57d-6167…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171623_2058b57d-6167-4767-9c2d-06a1946b7459.png) |
| H2b | hero, terrazza sotto la pergola (seed 2) | 2:3 | 3392×5056 | `71e025b7` | [hf_20260920_172348_71e025b7-8019…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172348_71e025b7-8019-4500-85f6-c878fcc5dc16.png) |
| H3 | hero, ingresso con scala | 2:3 | 3392×5056 | `0c8ea706` | [hf_20260920_171623_0c8ea706-a91a…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171623_0c8ea706-a91a-48dd-9ee0-f3d8568afd92.png) |
| T1 | /vendi, facciata con piscina | 2:3 | 3392×5056 | `1d62a880` | [hf_20260920_171659_1d62a880-b556…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171659_1d62a880-b556-4d11-bad5-129bf2183f51.png) |
| T2 | /acquista, giardino coi lettini | 2:3 | 3392×5056 | `d8a53616` | [hf_20260920_171536_d8a53616-7e12…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171536_d8a53616-7e12-4871-8b4a-22952ec0cf3c.png) |
| T3 | /servizi, angolo piscina | 2:3 | 3392×5056 | `2e458574` | [hf_20260920_171659_2e458574-020a…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171659_2e458574-020a-46b5-942a-5e6e86a86885.png) |
| T4 | /metodo, vetrata con lanterne, sera | 2:3 | 3392×5056 | `75f44fb2` | [hf_20260920_171659_75f44fb2-df95…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171659_75f44fb2-df95-48cd-b0c9-e38f0294225f.png) |
| T5 | /open-domus, portico con tenda | 2:3 | 3392×5056 | `c2568d7c` | [hf_20260920_171536_c2568d7c-88b5…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171536_c2568d7c-88b5-4737-8f1c-bf37e2558eee.png) |
| T6 | /chi-siamo, attico con travi | 2:3 | 3392×5056 | `5f6d48f2` | [hf_20260920_171730_5f6d48f2-7352…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171730_5f6d48f2-7352-4cf4-9c5c-6f94cb84d0d7.png) |
| T7 | /recensioni, salotto esterno con ombrellone | 2:3 | 3392×5056 | `e6a60b85` | [hf_20260920_171537_e6a60b85-a217…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171537_e6a60b85-a217-452e-b028-f2cccc3a9dda.png) |
| T8 | /lavora-con-noi, studio in mansarda | 2:3 | 3392×5056 | `5ac66281` | [hf_20260920_171730_5ac66281-7ca3…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171730_5ac66281-7ca3-4b24-a50e-3f9e53b541fa.png) |
| T9 | /domande-frequenti, piscina lunga | 2:3 | 3392×5056 | `7cf05262` | [hf_20260920_171730_7cf05262-32fd…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_171730_7cf05262-32fd-4fd0-981c-259d3ee75418.png) |
| C1 | corridoio, la facciata che sale | 9:16 | 3072×5504 | `52481984` | [hf_20260920_172315_52481984-553d…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172315_52481984-553d-44b4-9638-7790771aa1f4.png) |
| C2 | corridoio, terrazza verso le colline | 9:16 | 3072×5504 | `675ee6b5` | [hf_20260920_172314_675ee6b5-5eba…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172314_675ee6b5-5eba-487b-b785-94bab925ff58.png) |
| M1 | telefono, salotto H1 in 9:16 | 9:16 | 3072×5504 | `d1b8f6ea` | [hf_20260920_172314_d1b8f6ea-0329…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172314_d1b8f6ea-0329-4494-b1d9-ed7390bfca37.png) |
| R3 | Raffaela nel salotto (rif. sagoma+ritratto; piedi tagliati come nel ritaglio) | 2:3 | 3392×5056 | `ac1ca930` | [hf_20260920_172259_ac1ca930-fbb7…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172259_ac1ca930-fbb7-4162-acc7-2f31d9038481.png) |
| R3b | Raffaela nel salotto, figura intera con le scarpe (rif. solo ritratto) | 2:3 | 3392×5056 | `57a89d47` | [hf_20260920_172543_57a89d47-3f11…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172543_57a89d47-3f11-4a31-80fd-5ff430cc863c.png) |
| R1 | Raffaela alla porta | 2:3 | 3392×5056 | `3ac9f673` | [hf_20260920_172259_3ac9f673-c66f…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172259_3ac9f673-c66f-4f74-aec6-86f54bac55a8.png) |
| R2 | Raffaela con le chiavi | 2:3 | 3392×5056 | `64b0dd29` | [hf_20260920_172259_64b0dd29-8591…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172259_64b0dd29-8591-40b3-bbda-a7dbffb9efc2.png) |
| R4b | Raffaela sul portico, figura intera (rif. solo ritratto) | 2:3 | 3392×5056 | `7ed73da2` | [hf_20260920_172543_7ed73da2-c872…](https://d8j0ntlcm91z4.cloudfront.net/user_3JbH482QmV11l1mMyGhDFtAehct/hf_20260920_172543_7ed73da2-c872-44f8-9e46-679037d1b10d.png) |

Tre in più il 20 set. alle 20:22 (12 crediti, ne restano **10**), dopo A45 di Alberto («non mi piace la foto che hai messo per l'hero … era molto più ampia»; «la sezione rifatta di era residence di architecture»):

| # | scena | rapporto | pixel | codice | file scaricato |
|---|---|---|---|---|---|
| H-wide-2 | hero della home, il salotto a doppia altezza AMPIO, tutta la stanza in campo, terzo sinistro libero per il ritaglio di Raffaela | 3:2 | 5056×3392 | `cd67e18a` | `hf_20260920_202257_cd67e18a-90ea-49de-a0c8-bdf1a485b98c.png` |
| A1 | la facciata a terrazze bianche col glicine e i cipressi, per la finestra di Open Domus («Architecture» di era) | 3:2 | 5056×3392 | `4ad28297` | `hf_20260920_202257_4ad28297-ee2b-4ac9-bea4-28331b5879ca.png` |
| A2 | il salotto doppio con la vetrata, scena di riserva | 3:2 | 5056×3392 | `a1f4d9a0` | `hf_20260920_202257_a1f4d9a0-8663-4807-9bba-007071593f54.png` |

Visto a occhio: T2, H1, R3, R3b, C1 rispondono al brief (cielo o soffitto puliti in alto, soggetto in basso, terzo sinistro libero dove serve). R3 ha i piedi tagliati sul bordo basso perché il ritaglio di riferimento finisce lì; R3b e R4b usano il solo ritratto e hanno la figura intera. Da guardare tutte insieme nella galleria prima di scegliere.

## Posa nel sito (20-21 settembre, notte)

Fatto con `scripts/media/foto-alte.mjs` (registro job → file, JPEG senza metadati, composito
dell'hero e sagome del preloader):

- **hero** a schermo intero ancorato in basso, AMPIO (A45): H-wide-2 (`cd67e18a`) 3:2 a 2560×1717
  col ritaglio vero di Raffaela alto il 55 % del canvas in basso a sinistra (`hero-raffaela-villa.jpg`,
  `raffaela-sagoma-villa.webp`); sul telefono M1 (`d1b8f6ea`) 9:16 a 1440×2580 con Raffaela al 42 %
  (`hero-raffaela-villa-m.jpg`, `raffaela-sagoma-villa-m.webp`). La prima posa (H1 2:3 con l'80 %
  della foto tagliata) è stata buttata: Alberto la voleva ampia come la stanza del `main`;
- **nove teste** alte in `tinte.json`, in flusso (A45: la foto è la pagina; niente `usePanTesta`),
  alt nuovi in cinque lingue;
- **la finestra di Open Domus** con A1 (`villa-terrazze-glicine.jpg`, 2560×1717) e il titolo
  «Open Domus» bianco sopra, come «ARCHITECTURE» su era (A45).

Non ancora usati: `villa-facciata-sale-alta.jpg` e `villa-terrazza-colline-alta.jpg` (corridoi
9:16), `villa-portico-glicine-alta.jpg`, `villa-ingresso-scala-alta.jpg`, `villa-salotto-doppio.jpg`,
`raffaela-porta/chiavi/salotto/portico-alta.jpg` (in `public/images/reali`, pronti per Paths,
Servizi, Contact). Crediti restanti: **10**.

