# Note di performance — Domus Tua

Raccomandazioni operative per mantenere il sito veloce man mano che si sostituiscono i contenuti
demo con quelli reali (video pesanti, feed RealSmart, molte foto). Il sito è già impostato bene:
queste note servono a **non regredire** quando arrivano gli asset veri.

Stack: Next.js 16 (App Router) + React 19 + Tailwind v4. Hosting: Vercel.

---

## 1. Video

Il sito è video-driven: il video è il primo rischio di peso.

- **Comprimere sempre** prima di caricare. Target hero: **15–35s**, sotto i ~3–5 MB se possibile.
  - Codec: **H.264/mp4** (compatibilità) + preferibilmente una variante **webm/VP9** (più leggera).
  - Esempio ffmpeg: `ffmpeg -i in.mov -vf scale=-2:1080 -c:v libx264 -crf 24 -preset slow -an out.mp4`
    (`-an` rimuove l'audio: il video hero è muto).
- **Hero video** (`app/components/Hero.tsx`, `heroVideo`): usare `muted loop playsInline preload="metadata"`
  (già così nel markup predisposto). `preload="metadata"` evita di scaricare tutto il file subito.
- **Poster/fallback**: mantenere la foto come `poster` (già presente: `raffaela-ritratto.jpg`), così
  si vede subito qualcosa mentre il video carica.
- **`prefers-reduced-motion`**: quando si attiva `heroVideo`, rendere Hero un client component e
  **non autoplay** se l'utente ha ridotto le animazioni (nota già scritta nel commento del file).
- **YouTube**: la video wall linka a YouTube con **thumbnail statiche** (`SocialVideoWall.tsx`) —
  è la scelta giusta: **non** embeddare iframe YouTube in pagina (portano JS pesante). Mantenere così.
- **Niente autoplay di più video** contemporaneamente; un solo video "vivo" per vista.

---

## 2. Immagini

Stato attuale: alcune immagini in `public/` sono pesanti/grandi. Esempi reali:
- `public/images/reali/yt-banner.jpg` ≈ **1007 KB** (2560×1440) — banner canale, probabilmente
  sovradimensionato per l'uso a schermo.
- Vari `hero_*.jpg` ≈ **300–340 KB** a 1920×1067.

Raccomandazioni:

- **Usare sempre `next/image`** (`Image`), mai `<img>` grezzo. Già fatto in Hero, Team, OpenDomus,
  SocialVideoWall, Social. `next/image` genera automaticamente AVIF/WebP e i formati responsive.
- **`sizes` corretto** su ogni immagine `fill`: già impostato bene nei componenti. Serve a non
  scaricare la versione 1920px su mobile. Verificarlo su ogni nuova immagine.
- **`priority`** solo sull'immagine above-the-fold (l'hero) — già così. Non metterlo altrove:
  toglie priorità alle risorse critiche.
- **Ridimensionare i sorgenti** prima del commit: non serve un master 2560px per un banner mostrato
  a ~1200px. Regola pratica: sorgente ≈ 1.5–2× la dimensione massima di rendering.
- **Config già ottimizzata** (`next.config.ts`): `formats: ["image/avif","image/webp"]` e
  `deviceSizes`/`imageSizes` calibrati. **Non rimuovere.**
- **Alt text**: mantenere alt descrittivi (SEO + a11y); le immagini puramente decorative (griglia
  Social) usano `alt=""`, corretto.
- **Pulizia asset**: in `public/images/reali/yt/` ci sono thumbnail per-ID **non tutte referenziate**
  dal codice — rimuovere le inutilizzate riduce il peso del deploy (vedi `content-replacement-checklist.md` §6).

---

## 3. Immagini remote RealSmart (`remotePatterns`)

Quando gli immobili arriveranno dal feed RealSmart, le **foto saranno su un host esterno**.

- Per usarle con `next/image` bisogna **autorizzare l'host** in `next.config.ts` sotto
  `images.remotePatterns`, es.:
  ```ts
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 220, 300, 384],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.realsmart.example", pathname: "/**" },
    ],
  },
  ```
- **Restringere** `hostname`/`pathname` il più possibile (no wildcard totali) per sicurezza.
- Se le foto RealSmart sono già ottimizzate/watermarkate e l'ottimizzazione Next non aiuta, valutare
  `unoptimized` **solo** per quelle specifiche — ma di norma lasciare che Next le ottimizzi.
- Chiedere a RealSmart URL **stabili** e risoluzioni adeguate (vedi domande in
  `docs/realsmart-integration-notes.md` §4).

---

## 4. Caching / ISR (revalidate)

Gli immobili cambiano lentamente: sfruttare l'**ISR** invece di render dinamici a ogni richiesta.

- Già previsto: `REVALIDATE_SECONDS = 720` (12 min) in `app/lib/realsmart/client.ts`.
- Sulla `fetch` reale usare:
  `next: { revalidate: REVALIDATE_SECONDS, tags: ["realsmart-listings"] }` (esempio già nel commento del client).
- Se RealSmart offre **webhook**, aggiungere una route che verifica la firma e chiama
  `revalidateTag("realsmart-listings")` per aggiornamenti immediati (nuovo/venduto), tenendo l'ISR
  come rete di sicurezza.
- **Non** rendere dinamiche le pagine immobili (`export const dynamic = "force-dynamic"`) se non
  strettamente necessario: perde il caching e rallenta.
- Le pagine editoriali (home, chi-siamo, servizi) sono **statiche**: mantenerle tali.

---

## 5. Server vs Client Components

Regola App Router: **server component di default**, `"use client"` solo dove serve interattività.

- Client components attuali (corretti): `Reviews.tsx` (filtri `useState`), `WidgetEmbeds.tsx`
  (iniezione script/iframe), `Header.tsx`, `PropertySearch.tsx`, `WhatsAppFloat.tsx`, `CountUp.tsx`,
  `WordReveal.tsx`, `Reveal.tsx`.
- **Non trasformare in client** i componenti solo-presentazione (Hero senza video, Authority, Team,
  OpenDomus, Stats): restano server → meno JS spedito.
- Quando si attiva `heroVideo`, l'unico motivo per rendere Hero client è gestire
  `prefers-reduced-motion` — farlo isolando **solo** la parte video in un piccolo client component,
  non l'intero Hero.
- Data fetching (RealSmart) va nei **server component** / funzioni server, mai nel client (protegge
  anche le credenziali).

---

## 6. JavaScript e dipendenze

- **Dipendenze attuali**: solo `next`, `react`, `react-dom` (vedi `package.json`). Bundle snello.
  **Mantenerlo così**: prima di aggiungere una libreria, valutare se si risolve con CSS/Tailwind o
  una manciata di righe.
- **Evitare dipendenze pesanti** per cose già coperte:
  - Animazioni: sono in CSS/Tailwind + piccoli helper (`Reveal`, `WordReveal`). **Non** aggiungere
    librerie di animazione (framer-motion, GSAP) se non indispensabile.
  - Icone: sono SVG interni (`Icons.tsx`). **Non** aggiungere icon-pack pesanti.
  - Carousel/slider: preferire CSS scroll-snap a librerie.
- **Widget di terze parti** (Trustindex, feed Instagram) caricano **script/iframe esterni**: sono già
  isolati in `WidgetEmbeds.tsx` con `async`/`defer` e `loading="lazy"` sull'iframe. Caricano solo se
  configurati (`site.embeds`), quindi zero costo finché non attivati. Non spostarli fuori da lì.
- **Font**: `next/font` (Fraunces + Plus Jakarta Sans) con `display: "swap"` — già ottimale
  (self-hosted, niente richiesta a Google runtime). Limitare i pesi/assi ai necessari.

---

## 7. Verifica prima di ogni deploy

- `npm run build` e controllare il **report bundle** (dimensioni First Load JS per route).
- Lighthouse / PageSpeed sulla home e su una scheda immobile (dopo RealSmart).
- Controllare che le nuove immagini abbiano `sizes` corretto e non siano sovradimensionate.
- Verificare che nessuna credenziale (RealSmart, ecc.) finisca nel bundle client o in git
  (solo env server / secret Vercel).

---

## In sintesi

Il progetto parte leggero (zero dipendenze extra, config immagini già buona, ISR previsto).
I tre punti dove è facile "rompere" la performance quando arrivano i contenuti reali sono:
**(1) video non compressi**, **(2) foto RealSmart non ottimizzate / host non configurato**,
**(3) dipendenze/embed aggiunti senza necessità**. Presidiare questi tre e il sito resta veloce.
