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

// Hero CINEMATICO full-bleed (HeroCinematic.tsx). Vedi docs/hero-video.md.
// Il video parte solo su desktop e senza prefers-reduced-motion; se i file /media mancano
// o il video fallisce, resta il `base` (foto reale di Raffaella + team) come poster.
// Per andare "live": metti i file in /public/media e imposta enabled: true.
export const heroCinematic = {
  enabled: false,
  mp4: "/media/domus-hero.mp4",
  webm: "/media/domus-hero.webm",
  poster: "/media/domus-hero-poster.jpg",
  // Fallback sempre presente (foto reale). Villa di pregio, luminosa, con Raffaela Rizza
  // in primo piano: calda, umana e "founder-led", coerente col brand e col velo scuro del testo.
  base: "/images/reali/villa-pool.jpg",
  baseAlt: "Raffaela Rizza davanti a una villa di pregio con piscina, a Tradate",
  youtube: "https://www.youtube.com/@DOMUSTUASRLIMMOBILIARE",
} as const;
