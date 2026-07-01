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
