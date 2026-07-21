// Configurazione media dell'hero. Vedi docs/hero-video-guide.md.
//
// Per attivare il video reale:
//  1. Metti i file in /public/videos/hero-domustua.mp4 e .webm
//  2. Imposta enabled: true
// Finché enabled è false (o i file mancano), l'hero mostra il poster (foto di Raffaela).
//
// Video consigliato: 15-35s, ~1080p, muto, loop.
// Contenuti: Raffaella, team, Open Domus, visite, video emozionali, clienti felici, immobili.
export const heroMedia = {
  enabled: false,
  mp4: "/videos/hero-domustua.mp4",
  webm: "/videos/hero-domustua.webm",
  poster: "/images/reali/raffaela-ritratto.jpg",
  posterAlt: "Raffaela Rizza, fondatrice di Domus Tua, nella sede di Tradate",
  youtube: "https://www.youtube.com/@DOMUSTUASRLIMMOBILIARE",
} as const;

// Hero CINEMATICO full-bleed (HeroCinematic.tsx). Vedi docs/hero-brand-film-shotlist.md.
// Il video parte solo su desktop, senza prefers-reduced-motion e senza data-saver; se i file
// /media mancano o il video fallisce, resta il poster immagine (foto reale) — su desktop il
// crop landscape (`base`), su mobile il crop verticale (`baseMobile`). Per andare "live":
// metti i file in /public/media e imposta enabled: true. Girato del brand: shot-list nel doc.
export const heroCinematic = {
  enabled: false,
  // Sorgenti video in ordine di preferenza: AV1 (miglior compressione) → VP9 WebM → H.264 MP4.
  // Il browser sceglie la prima che sa decodificare; l'MP4 H.264 è il fallback universale.
  av1: "/media/domus-hero.av1.webm",
  webm: "/media/domus-hero.webm",
  mp4: "/media/domus-hero.mp4",
  // Poster del <video> (mostrato mentre il video carica): art-directed, 16:9.
  poster: "/media/domus-hero-poster.jpg",
  // Poster immagine DESKTOP (landscape) — foto reale, sempre presente come LCP/fallback.
  // Villa di pregio con Raffaela Rizza in primo piano: calda, umana, "founder-led".
  base: "/images/reali/villa-pool.jpg",
  baseAlt: "Raffaela Rizza davanti a una villa di pregio con piscina, a Tradate",
  // Poster immagine MOBILE (ritratto) — crop verticale pensato per gli schermi portrait,
  // con la fondatrice come soggetto centrale (niente villa tagliata male su 9:16).
  baseMobile: "/images/reali/raffaela-keys.jpg",
  baseMobileAlt: "Raffaela Rizza con le chiavi di una casa, a Tradate",
  // Focal point (object-position) per orientamento: evita di tagliare il soggetto.
  focalDesktop: "50% 35%",
  focalMobile: "50% 28%",
  youtube: "https://www.youtube.com/@DOMUSTUASRLIMMOBILIARE",
} as const;
