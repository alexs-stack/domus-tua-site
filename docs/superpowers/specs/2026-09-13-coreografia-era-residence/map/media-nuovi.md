# Nuovi media consegnati da Alberto (2026-09-13)

Sorgenti in `C:\Users\alber\Downloads\` (fuori dal repo). Anteprime ridotte in
`docs/superpowers/specs/2026-09-13-coreografia-era-residence/media-new\` (`_DSC20xx.jpg` a 1400 px, `mov-contact-ts.jpg` foglio con i tempi,
`crop-grid.jpg` prova del ritaglio).

## Foto (5 uniche, stessa villa)

`_DSC2014 (1).jpg` e `_DSC2014.jpg` sono lo stesso file (SHA1 39B092A4B00F). Tutte 5977×3985 (3:2),
scatti professionali senza persone, villa contemporanea con rivestimento color rame/corten, piscina,
muretti in pietra, siepi, cielo blu (il blu è della fotografia, non un colore d'interfaccia).

| File | Cosa si vede | Note di composizione |
|---|---|---|
| `_DSC2014.jpg` | portico con tenda da sole aperta, poltrone, piscina a destra, statua scura di un marinaio in primo piano a sinistra | forte diagonale della tenda; la statua è un soggetto scuro a sinistra |
| `_DSC2016.jpg` | facciata intera con piscina e lettini, alberi a destra | ripresa larga, orizzonte medio |
| `_DSC2022.jpg` | facciata frontale e simmetrica, acqua della piscina in primo piano (metà bassa dell'inquadratura) | candidata al tuffo con origine bassa (50% 75%): si entra dall'acqua verso la casa |
| `_DSC2024.jpg` | angolo della piscina, facciata a sinistra, alberi a destra | acqua in primo piano, diagonale del bordo |
| `_DSC2025.jpg` | due lettini bianchi in primo piano, facciata e piscina | primo piano forte in basso a sinistra |

## Video `Tradate Via Cima rossa.mov`

- 3840×2160, 25 fps, H.264 High 8 bit bt709, 2'25" (145,56 s), 707 MB, traccia audio AAC,
  stream dati, copertina MJPEG incorporata (col logo).
- È un tour prodotto da Domus Tua: logo «DomusTua Immobiliare» BRUCIATO in alto a sinistra in ogni
  fotogramma (fra 3% e 17% della larghezza, fra 3% e 7,2% dell'altezza); logo grande al centro nel
  finale (2:21).
- È il SORGENTE dei file già nel sito: `public/media/domus-hero.mp4` (1920×1080, 4 s, la clip del
  Congedo, oggi scalata 1.14 per mangiare il logo) e `public/media/hero-aerial.jpg` (2560×1280, foto
  del pannello territorio di HorizonStory). Tocca quindi le domande bloccanti 2.2 e 6.2 di
  `docs/da-chiedere-alla-cliente.md` (chi l'ha girata: Domus Tua stessa; resta da confermare
  l'autorizzazione del proprietario). `public/images/reali/piscina-lusso.jpg` è un'altra casa (notte).
- Ritaglio che toglie il logo: `crop=iw*0.90:ih*0.90:iw*0.10:ih*0.10` (zoom 1,11, 16:9 invariato) →
  3456×1944 → scala a 1920×1080 nitida. Verificato su 4 fotogrammi.
- Nomi nel sito neutri, senza l'indirizzo della villa.

### Mappa delle scene (tagli con score > 0,30, secondi)

9,12 · 12,6 · 18,4 · 24 · 29,24 · 32,36 · 35,56 · 40,2 · 42,24 · 44,24 · 46,28 · 48,36 · 50,36 ·
54,44 · 59,08 · 65,48 · 75,08 · 81,08 · 84,4 · 87,04 · 90,36 · 93,8 · 96,92 · 100,48 · 103,52 ·
105,88 · 109,88 · 111,96 · 114,44 · 116,48 · 118,52 · 122,68 · (fine 145,56)

| Tratto | Contenuto | Persone | Uso possibile |
|---|---|---|---|
| 0–9,1 | drone dall'alto, lenta orbita sulla villa e la piscina | no | loop d'ambiente (è la clip del Congedo, oggi 4 s) |
| 9,1–12,6 | lettini e piscina da vicino | no | |
| 12,6–18,4 | drone sulla piscina, più vicino | no | |
| 18,4–24 | interno, Raffaela cammina | sì | |
| 24–29,2 | giardino con uliveto | no | loop d'ambiente |
| 29,2–32,4 | salotto esterno sotto l'ombrellone | no | |
| 32,4–35,6 | facciata con piscina e lettini | no | loop corto (3,2 s) |
| 35,6–40,2 | superficie dell'acqua con increspature | no | loop d'ambiente (texture) |
| 40,2–50,4 | dettagli: corten, lettini, vetrate con lanterne, alberi | no | |
| 54,4–59,1 | sala da pranzo, Raffaela | sì | |
| 59,1–65,5 | piscina e tenda, inquadratura bassa | no | |
| 65,5–75,1 | Raffaela parla in giardino | sì | |
| 75,1–81,1 | drone largo sul quartiere | no | |
| 81–122,7 | interni (soggiorno, scala, camere, finestra), spesso con Raffaela | sì/no | |
| 122,7–145,5 | Raffaela seduta a bordo piscina che parla, poi drone di chiusura con logo grande | sì | |

Vincoli: le clip d'ambiente sono mute (via l'audio), senza persone (niente effetti su volti),
ricodificate a 1920×1080 H.264 + WebM, faststart, poster dal primo fotogramma, una clip in un posto
solo per pagina.


> Correzione verificata durante la progettazione (13 set.): il fotogramma 1.130 (45,2 s) mostra una donna sul lettino, quindi il tratto 40,2–50,4 s NON è tutto senza persone. Fermi senza persone verificati: 770, 850, 1.185, 2.115. La mappa dei tagli per indice di fotogramma esatto è in design/lane-homeC.md §8.1.
