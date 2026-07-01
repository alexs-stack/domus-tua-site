# Ottimizzazione media — Domus Tua

Guida operativa per **immagini, video e YouTube** sul sito. Domus Tua è un sito
premium e **video-driven**: i media sono ciò che trasmette emozione e fiducia, ma
sono anche il primo rischio di peso. Questa guida serve a tenere il sito **veloce e
bello** man mano che si sostituiscono gli asset demo con quelli reali (video pesanti,
molte foto, feed RealSmart).

Stack: Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript strict. Hosting: Vercel.

Documenti collegati:
- `docs/hero-video.md` — hero cinematico (video + poster), file e attivazione.
- `docs/performance-notes.md` — quadro performance generale.
- `docs/content-replacement-checklist.md` — sostituzione asset demo → reali.

---

## 1. Immagini — dimensioni & sorgenti

**Regola d'oro: comprimi e ridimensiona il sorgente PRIMA del commit.** `next/image`
serve i formati responsive, ma non deve partire da un master enorme.

Dimensione consigliata del sorgente (lato lungo), per uso:

| Uso | Rendering max | Sorgente consigliato | Formato master |
|-----|---------------|----------------------|----------------|
| Hero / full-bleed | ~1920 px | 1920–2400 px | JPG qualità ~80 |
| Foto sezione / editorial rows | ~1200 px | 1600–1920 px | JPG qualità ~80 |
| Card immobile / griglia | ~640 px | 900–1280 px | JPG qualità ~80 |
| Ritratto team | ~480 px | 800–960 px | JPG qualità ~82 |
| Thumbnail video (16:9) | ~640 px | 1280×720 px | JPG qualità ~80 |
| Loghi / icone | come da uso | SVG se possibile | SVG / PNG |

Regola pratica: **sorgente ≈ 1.5–2× la dimensione massima di rendering**. Non serve un
master 2560 px per un banner mostrato a ~1200 px (vedi il caso `yt-banner.jpg` ≈ 1 MB in
`docs/performance-notes.md` §2).

Ridimensionamento rapido con ffmpeg (funziona anche su immagini singole):

```bash
# Ridimensiona a 1920 px sul lato lungo e ricomprime (mantiene proporzioni)
ffmpeg -i sorgente.jpg -vf "scale='min(1920,iw)':-2" -q:v 3 public/images/reali/nome.jpg
```

Con ImageMagick, in alternativa:

```bash
magick sorgente.jpg -resize '1920x1920>' -quality 82 public/images/reali/nome.jpg
```

## 2. `next/image` — linee guida

- **Usa sempre `next/image`** (`import Image from "next/image"`), mai `<img>` grezzo.
  Genera automaticamente AVIF/WebP e le varianti responsive. Già così in `Hero`,
  `HeroCinematic`, `Team`, `OpenDomus`, `Services`, `Paths`, `EditorialRows`,
  `PropertyCard`, `PropertyGallery`, `SocialVideoWall`, `PageHero`.
- **`sizes` corretto su ogni immagine `fill`.** Descrive quanto spazio occupa l'immagine
  a ogni breakpoint, così il browser non scarica la versione 1920 px su mobile. Esempi
  reali (da `SocialVideoWall.tsx`):
  ```tsx
  // card grande del muro video
  sizes="(max-width:1024px) 100vw, 640px"
  // card piccola in griglia
  sizes="(max-width:1024px) 50vw, 300px"
  ```
  Verifica `sizes` su **ogni nuova immagine** `fill` — è l'errore più comune.
- **`priority` solo sull'above-the-fold** (l'hero). Metterlo altrove toglie priorità alle
  risorse critiche e peggiora l'LCP. Tutto il resto: lazy di default (nessun flag).
- **`width`/`height` reali** sulle immagini non-`fill`, per riservare lo spazio ed evitare
  layout shift (CLS).
- **`alt` descrittivo** su ogni immagine di contenuto (SEO + accessibilità). Le immagini
  **puramente decorative** usano `alt=""` — corretto, così gli screen reader le saltano.
- **Config già ottimizzata** in `next.config.ts` — **non rimuovere**:
  ```ts
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 220, 300, 384],
  }
  ```
- **Immagini remote (RealSmart):** per servirle con `next/image` va autorizzato l'host in
  `images.remotePatterns` (restringendo `hostname`/`pathname` il più possibile). Dettagli
  in `docs/performance-notes.md` §3.

## 3. Video — compressione (ffmpeg)

Il sito è video-driven: **comprimi sempre** prima di caricare. I video del sito sono
**muti** → rimuovi la traccia audio (`-an`). Target hero: **15–35 s**, loop pulito
(inizio e fine si raccordano), sotto i ~3–5 MB quando possibile.

Servi **due sorgenti**: WebM (VP9/AV1, più leggero, per primo) + MP4 (H.264, compatibilità
universale). Il browser sceglie la prima che sa leggere.

```bash
# MP4 (H.264) — compatibilità universale, target < 4–6 MB
# -an rimuove l'audio · -crf 24 qualità/peso · +faststart = parte prima (moov all'inizio)
ffmpeg -i sorgente.mov -an -vf "scale=1920:-2" \
  -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p \
  -movflags +faststart public/media/domus-hero.mp4

# WebM (VP9) — più leggero, servito per primo ai browser che lo supportano
ffmpeg -i sorgente.mov -an -vf "scale=1920:-2" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -deadline good \
  public/media/domus-hero.webm
```

Note tecniche:
- `-pix_fmt yuv420p` garantisce che l'MP4 parta su tutti i browser (incluso Safari).
- Per un file **più leggero**, alza il `-crf` (es. 26–28 mp4, 36–38 webm): meno peso, meno
  qualità. Controlla sempre il risultato a schermo.
- Se il video non deve stare in loop perfetto, taglia con `-ss` (inizio) e `-t` (durata):
  `ffmpeg -ss 00:00:03 -t 00:00:20 -i sorgente.mov ...`.

Ordine delle `<source>` nel markup: **WebM prima, MP4 dopo**.

```tsx
<video muted loop playsInline preload="metadata" poster="/media/domus-hero-poster.jpg">
  <source src="/media/domus-hero.webm" type="video/webm" />
  <source src="/media/domus-hero.mp4" type="video/mp4" />
</video>
```

Attributi obbligatori su ogni video di sfondo/decorativo: `muted`, `loop`, `playsInline`,
`preload="metadata"` (evita di scaricare tutto il file subito), `poster`. Già così in
`HeroCinematic.tsx`. Vedi `docs/hero-video.md` per file, nomi e attivazione
(`heroCinematic.enabled` in `app/lib/media.ts`).

## 4. Poster — requisiti

Il **poster è obbligatorio** su ogni video: è ciò che si vede prima della riproduzione,
su connessioni lente e quando il video non parte (mobile / reduced-motion / errore).

- **Formato/proporzioni** identiche al video (16:9 per l'hero), così non c'è salto quando
  parte la riproduzione.
- **JPG ottimizzato**, ~1920 px lato lungo, qualità ~80 (poche centinaia di KB).
- **Frame significativo**: un fotogramma bello, con volto/soggetto a fuoco — non un frame
  nero o mosso. Punto focale leggermente alto se sotto va del testo (l'hero ha CTA e titolo
  in basso a sinistra).
- **Coerenza col fallback:** se il video è disattivato, deve restare visibile un'immagine
  reale e leggibile (in `HeroCinematic` il `base` è la foto reale di Raffaela + team).

Estrai il poster da un frame preciso:

```bash
# Poster dal frame a 2 secondi (scegli un istante "bello")
ffmpeg -i sorgente.mov -ss 00:00:02 -frames:v 1 -q:v 3 public/media/domus-hero-poster.jpg
```

## 5. YouTube — lazy-loading (mai iframe multipli)

**Non embeddare `<iframe>` YouTube direttamente in pagina.** Ogni iframe YouTube carica
centinaia di KB di JavaScript di terze parti prima ancora che l'utente prema play, e
rallenta tutto (LCP, TBT, main-thread). Sul muro video ci sono **7+ video**: sette iframe
affonderebbero la pagina.

**Regola ferrea: mai caricare più iframe YouTube contemporaneamente.** Al massimo **uno**
alla volta, e **solo dopo un click esplicito** dell'utente.

### 5a. Stato attuale (facade con thumbnail + link)

`SocialVideoWall.tsx` mostra **thumbnail statiche** (`next/image`, con `sizes` corretto e
badge play) che **linkano al video su YouTube** (`target="_blank"`) — zero iframe, zero JS
di terze parti. È la scelta giusta per un muro con molti video: **mantenerla**.

### 5b. Play in pagina → `LazyYouTubeEmbed`

Quando serve far partire un video **dentro** la pagina (es. il video featured/hero della
sezione), usa il pattern **facade** incapsulato nel componente **`LazyYouTubeEmbed`**:

- Renderizza solo una **thumbnail** (`next/image`) + un **badge play**, con `alt`
  descrittivo. Peso iniziale: quello di una singola immagine.
- **Carica l'`<iframe>` solo al click** sulla thumbnail. Prima del click, nessuno script
  YouTube è in pagina.
- Autorizza il **click** con `autoplay=1` (il gesto utente lo consente) e usa il dominio
  **`youtube-nocookie.com`** per non lasciare cookie prima dell'interazione.
- **Un solo iframe attivo per volta:** se sono presenti più `LazyYouTubeEmbed`, aprirne uno
  **chiude/scarica** gli altri (non tenere N iframe montati). Su un muro come
  `SocialVideoWall`, preferire comunque la facade con link esterno (5a).
- Rispetta `prefers-reduced-motion`: nessun autoplay non richiesto; l'iframe parte solo dal
  click dell'utente (vedi §7).

Scheletro di riferimento del componente (client component, TypeScript strict):

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "./Icons";

type Props = {
  /** ID del video YouTube, es. "gYePYQHNTUM" */
  id: string;
  /** Thumbnail locale ottimizzata (16:9), es. "/images/reali/video/...jpg" */
  thumb: string;
  /** Titolo per alt/aria — usa la stringa localizzata */
  title: string;
};

export default function LazyYouTubeEmbed({ id, thumb, title }: Props) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-ink">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerated-web player; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={title}
      className="group relative block aspect-video w-full overflow-hidden rounded-[1.5rem] bg-ink"
    >
      <Image
        src={thumb}
        alt={title}
        fill
        sizes="(max-width:1024px) 100vw, 640px"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110">
        <Play className="h-6 w-6" />
      </span>
    </button>
  );
}
```

> Nota: `allow` sopra è indicativo; correggi la stringa `allow` reale in `"accelerometer; autoplay; encrypted-media; picture-in-picture"` in fase di implementazione. Il punto architetturale — thumbnail → iframe solo al click, uno per volta — resta invariato.

**Thumbnail YouTube:** preferisci una **thumbnail locale** in `public/images/reali/video/`
(come già fa `SocialVideoWall`), non l'hotlink a `i.ytimg.com`. Se proprio serve la miniatura
remota, autorizza l'host in `next.config.ts` (`remotePatterns`). Ridimensionala secondo la
tabella §1 (16:9, ~1280×720).

## 6. Convenzioni di nomenclatura file

Nomi **minuscoli, in kebab-case, senza spazi né accenti**, descrittivi. Coerenti con quelli
già in repo.

| Cartella | Contenuto | Esempi |
|----------|-----------|--------|
| `public/media/` | video hero + poster hero | `domus-hero.mp4`, `domus-hero.webm`, `domus-hero-poster.jpg` |
| `public/videos/` | altri video (hero classico) | `hero-domustua.mp4`, `hero-domustua.webm` |
| `public/images/reali/` | foto reali (team, sede, ritratti) | `raffaela-ritratto.jpg`, `raffaela-team-sede.jpg` |
| `public/images/reali/video/` | thumbnail dei video YouTube | `recensione-teresa.jpg`, `villa-mozart.jpg` |

Regole:
- **Estensioni corrette e coerenti col contenuto:** `.mp4`, `.webm`, `.jpg`, `.png`, `.svg`.
- **Video:** stesso nome base per mp4/webm/poster (`domus-hero.mp4` / `.webm` /
  `-poster.jpg`) — più facile da cablare in `app/lib/media.ts`.
- **Thumbnail video:** nome che descrive il contenuto, non l'ID YouTube
  (`villa-mozart.jpg`, non `X8dRz1629F0.jpg`) — più leggibile nel codice.
- **Niente numeri progressivi anonimi** (`img1.jpg`, `foto2.jpg`): non dicono nulla e si
  perdono i riferimenti.
- **Aggiorna sempre il path nel codice** (`media.ts`, componente) quando rinomini un file:
  i path sono cablati, un rename senza update rompe l'immagine.
- **Rimuovi gli asset non referenziati** (es. thumbnail per-ID in `public/images/reali/yt/`
  non usate): riducono il peso del deploy — vedi `docs/content-replacement-checklist.md` §6.

## 7. `prefers-reduced-motion`

Alcuni utenti chiedono di **ridurre le animazioni** (impostazione di sistema). Il sito la
rispetta e va mantenuto così.

- **Video di sfondo/hero:** su reduced-motion (e su mobile) **non** si carica/riproduce il
  video → resta il **poster/foto** leggero. In `HeroCinematic.tsx` è gestito via
  `window.matchMedia("(prefers-reduced-motion: no-preference)")`: il video parte solo se
  l'utente **non** ha ridotto le animazioni.
- **CSS** (`app/globals.css`): sotto `@media (prefers-reduced-motion: reduce)` le entrate
  `.reveal` sono immediate (niente fade/translate), `scroll-behavior` diventa `auto`, e le
  animazioni continue (`.marquee-track`, `.ken-burns`, `.scroll-progress`, `.hero-parallax`)
  sono spente con `animation: none`. **Non introdurre animazioni infinite senza un guard qui.**
- **JS** (`CountUp.tsx`): con reduced-motion mostra subito il valore finale invece di contare.
  Stesso principio per ogni nuovo effetto JS: controlla `matchMedia` e degrada allo stato finale.
- **YouTube (`LazyYouTubeEmbed`):** già conforme — l'iframe parte **solo** dal click
  dell'utente, mai in autoplay non richiesto. Non aggiungere autoplay automatico al mount.

**Regola generale per ogni nuovo media/animazione:** funziona e resta bello **anche fermo**.
Il movimento è un di più, mai un requisito per leggere il contenuto o usare le CTA.

---

## Checklist prima del deploy

- [ ] Immagini ridimensionate al sorgente (≈1.5–2× il rendering), non master enormi.
- [ ] Ogni immagine `fill` ha un `sizes` corretto; `priority` solo sull'hero.
- [ ] `alt` descrittivo (o `alt=""` se decorativa) su ogni immagine.
- [ ] Video muti (`-an`), compressi, mp4 **e** webm, `+faststart`, sotto ~5 MB se possibile.
- [ ] Poster presente su ogni video, stesso rapporto d'aspetto, frame significativo.
- [ ] Nessun iframe YouTube al load: thumbnail + link (muro) o `LazyYouTubeEmbed` (play in
      pagina). **Mai più di un iframe attivo insieme.**
- [ ] Nomi file in kebab-case, path aggiornati nel codice, asset non usati rimossi.
- [ ] Verificato con "riduci animazioni" attivo: poster al posto del video, contenuto leggibile.
