# Guida al video Hero — Domus Tua

Il riquadro a destra della hero (foto di Raffaela) è già predisposto per ospitare una
clip video. Oggi mostra la foto della fondatrice come fallback; appena colleghi un file
video parte automaticamente al posto della foto. Questa guida spiega **cosa girare**,
**come esportarlo** e **come attivarlo nel codice**.

Riferimenti nel codice (già pronti):
- Componente: `app/components/Hero.tsx`
- Costante di attivazione: `const heroVideo = ""` → riga 17 di `Hero.tsx`
- Blocco `<video>` già cablato con `autoPlay muted loop playsInline preload="metadata"`
  → righe 100-112 di `Hero.tsx`
- Poster / fallback immagine: `public/images/reali/raffaela-ritratto.jpg` (già presente)

---

## 1. Dove mettere i file

Crea la cartella `public/videos/` (oggi non esiste ancora) e inserisci **due formati**
dello stesso video, per la massima compatibilità browser:

```
public/videos/hero-domustua.mp4     ← formato principale (H.264, tutti i browser)
public/videos/hero-domustua.webm    ← formato alternativo più leggero (VP9)
```

Il **poster** (immagine mostrata prima che il video sia pronto e come fallback) è già:

```
public/images/reali/raffaela-ritratto.jpg
```

Va bene così: mantiene coerenza tra la versione foto e la versione video. Se in futuro
vuoi un poster dedicato (es. un fotogramma della clip), esporta un frame a 1080×1350
(rapporto 4:5) e salvalo in `public/images/reali/hero-poster.jpg`, poi aggiorna
l'attributo `poster` in `Hero.tsx`.

---

## 2. Durata e contenuti consigliati

**Durata: 15-35 secondi.** È una clip d'atmosfera in loop, non un video da guardare
fino in fondo: deve trasmettere calore e sicurezza in pochi secondi. Sotto i 15s risulta
nervosa, sopra i 35s pesa troppo e stanca in loop.

**Cosa far vedere** (ordine consigliato dal più forte):

1. **Raffaella Rizza** — volto della fondatrice, sguardo o mezzo sorriso verso camera,
   in sede o in una casa luminosa. È il cuore founder-led del brand: deve esserci.
2. **Team al lavoro** — dettagli umani: una stretta di mano, una consegna chiavi, il
   team in ufficio in corso Bernacchi.
3. **Open Domus** — momenti delle giornate a porte aperte: persone che visitano, luce
   naturale, ambienti curati (asset proprietario, va valorizzato).
4. **Visite e clienti felici** — famiglie che entrano in casa, reazioni autentiche,
   emozione del "sì, è questa".
5. **Immobili** — carrellate lente e stabili su interni curati (soggiorni, cucine,
   esterni con verde). Movimenti morbidi, mai frenetici.

Tono: **emozione + sicurezza**, luce calda, ritmo lento. Coerente con il brand
rosso/grigio/bianco caldo.

**Cosa evitare:**

- ❌ Audio necessario per capire: il video parte **muto** (`muted`) e in loop → deve
  funzionare senza sonoro. Niente parlato indispensabile o testi da leggere.
- ❌ Testi/scritte in sovraimpressione: il riquadro è piccolo e ha già chip e affordance
  "Guarda i video" sopra; testo nel video diventa illeggibile.
- ❌ Tagli rapidi, zoom aggressivi, transizioni "reel/TikTok": qui serve eleganza, non
  energia da feed.
- ❌ Loghi di terzi, watermark di app di montaggio, filtri virati blu o oro (fuori palette).
- ❌ Inquadrature buie o mosse: la clip gira in loop, ogni difetto si nota a ogni giro.
- ❌ Stacco brusco tra fine e inizio: cura il punto di loop (vedi sotto).

**Loop pulito:** fai iniziare e finire la clip su un'inquadratura simile (es. stessa
scena o un fade tenue) così il `loop` non "salta". In alternativa, chiudi e apri su un
campo quasi statico.

---

## 3. Formato, dimensioni e compressione

Il riquadro hero è in rapporto **4:5 / 5:5** (verticale-quadrato), con `object-cover`:
il video viene ritagliato al centro. Gira quindi **verticale o quadrato**, non orizzontale
(un 16:9 verrebbe tagliato ai lati perdendo i bordi).

| Parametro            | Valore consigliato                                        |
|----------------------|-----------------------------------------------------------|
| Rapporto             | 4:5 (1080×1350) oppure 1:1 (1080×1080)                    |
| Risoluzione          | ~1080p sul lato lungo (basta: il box è < 560px a schermo) |
| Frame rate           | 24 o 30 fps                                               |
| Durata               | 15-35 s, in loop pulito                                   |
| Codec MP4            | H.264 (High profile), audio rimosso                       |
| Codec WebM           | VP9                                                       |
| Bitrate video        | ~2.5-4 Mbps (MP4), ~2-3 Mbps (WebM)                       |
| **Peso target**      | **< 8-10 MB** per file (idealmente 3-6 MB)                |
| Audio                | **Nessuna traccia audio** (parte muto, così pesa meno)    |
| `faststart` (MP4)    | Sì (`+faststart`): parte prima, senza attendere il download|

### Comandi ffmpeg pronti

Partendo da un master `master.mov` verticale (1080×1350). Rimuoviamo l'audio con `-an`.

**MP4 (H.264):**
```bash
ffmpeg -i master.mov -an -vf "scale=1080:-2,fps=30" \
  -c:v libx264 -profile:v high -preset slow -crf 24 \
  -movflags +faststart public/videos/hero-domustua.mp4
```

**WebM (VP9):**
```bash
ffmpeg -i master.mov -an -vf "scale=1080:-2,fps=30" \
  -c:v libvpx-vp9 -b:v 0 -crf 32 \
  public/videos/hero-domustua.webm
```

Se dopo l'export un file supera i ~10 MB, alza il `-crf` (es. 26-28 su MP4, 34-36 su
WebM): riduce il peso con perdita di qualità minima su un box così piccolo. Verifica il
peso con `ls -lh public/videos/`.

> Nota: se non hai ffmpeg, va bene qualsiasi export "web 1080p H.264, no audio" da
> Premiere / DaVinci / CapCut, poi comprimi con [Handbrake](https://handbrake.fr)
> (preset "Web / Vimeo YouTube 1080p", audio disattivato). L'obiettivo resta < 8-10 MB.

---

## 4. Come attivarlo nel codice

Il blocco `<video>` è **già presente** in `app/components/Hero.tsx` (righe 100-112). Devi
solo valorizzare il path. Apri `Hero.tsx` e modifica la riga 17:

```ts
// PRIMA (foto statica, stato attuale)
const heroVideo = "";

// DOPO (attiva il video)
const heroVideo = "/videos/hero-domustua.mp4";
```

Appena `heroVideo` è una stringa non vuota, il ternario a riga 100
(`{heroVideo ? <video …/> : <Image …/>}`) mostra il `<video>` al posto della foto.

### Aggiungere anche la sorgente WebM (consigliato)

Per servire il WebM (più leggero) ai browser che lo supportano e l'MP4 come fallback,
sostituisci l'unica `<source>` di riga 111 con due sorgenti tipizzate — **il WebM prima**:

```tsx
<source src="/videos/hero-domustua.webm" type="video/webm" />
<source src="/videos/hero-domustua.mp4" type="video/mp4" />
```

In quel caso `const heroVideo` serve solo come "interruttore": tienilo valorizzato (es.
`"/videos/hero-domustua.mp4"`) per far comparire il tag `<video>`.

### Accessibilità — `prefers-reduced-motion`

`Hero.tsx` è oggi un Server Component e il video parte sempre in `autoPlay`. Chi ha
attivato "riduci animazioni" nel sistema operativo vedrebbe comunque il video partire.
Come indicato nel commento a riga 16, quando attivi il video valuta di:

- trasformare `Hero` (o estrarre solo il riquadro media) in Client Component
  (`"use client"`), leggere
  `window.matchMedia("(prefers-reduced-motion: reduce)")` e, se attivo, **non montare il
  `<video>`** (mostrare la foto) oppure ometterlo `autoPlay` e mostrare il poster.

Non è bloccante per andare online, ma è il modo corretto di rispettare la preferenza
utente. Coerente con la nota "coerenza motion" già presente nel design system.

---

## 5. Fallback: cosa succede se il video manca o non parte

Il sistema è **fail-safe** per costruzione:

- **`heroVideo` vuoto** (`""`, stato attuale) → viene renderizzata la `<Image>` con la
  foto di Raffaela. Nessun buco, nessun errore.
- **File assente o 404** (path sbagliato) → il tag `<video>` mostra il `poster`
  (`raffaela-ritratto.jpg`): l'utente vede comunque la foto, non un rettangolo nero.
- **Browser che non riproduce il codec** → resta visibile il `poster`.
- **Connessione lenta** → grazie a `preload="metadata"` e al poster, la foto è subito a
  schermo mentre il video si carica.

**Regola pratica:** il poster deve sempre esistere ed essere di qualità, perché è la rete
di sicurezza in tutti gli scenari. Oggi è già a posto.

---

## 6. Checklist prima di pubblicare

- [ ] Clip 15-35s, verticale/quadrata (4:5 o 1:1), loop pulito
- [ ] Muta, senza testi in sovraimpressione, luce calda, ritmo lento
- [ ] `public/videos/hero-domustua.mp4` esiste, < 8-10 MB, `+faststart`
- [ ] (Opzionale ma consigliato) `public/videos/hero-domustua.webm` esiste, < 8-10 MB
- [ ] Poster verificato: `public/images/reali/raffaela-ritratto.jpg`
- [ ] `const heroVideo` valorizzato in `app/components/Hero.tsx` (riga 17)
- [ ] (Se aggiunto WebM) due `<source>` con `type`, WebM prima dell'MP4
- [ ] Valutato il rispetto di `prefers-reduced-motion`
- [ ] Provato in locale con `npm run dev` e su mobile (deve partire in autoplay muto)
