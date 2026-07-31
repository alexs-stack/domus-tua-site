// Configurazione media dell'hero — UNICA.
//
// Storia: esistevano due configurazioni parallele (`heroMedia` e `heroCinematic`), con file,
// poster e URL del canale duplicati. `heroMedia` non era usato da nessun componente — solo da
// demoStatus, che quindi riportava "hero video live" leggendo un flag morto. Resta un solo
// oggetto, quello effettivamente consumato da HeroCinematic.tsx.
//
// Il link al canale YouTube NON vive qui: la fonte unica dei canali social è app/lib/site.ts
// (`site.social.youtube.href`).
//
// Hero CINEMATICO full-bleed (HeroCinematic.tsx). Vedi docs/hero-video.md.
// Il video parte solo su desktop e senza prefers-reduced-motion; se i file /media mancano
// o il video fallisce, resta il `base` (foto reale di Raffaella + team) come poster.
// Per andare "live": metti i file in /public/media e imposta enabled: true.
// Video consigliato: 15-35s, ~1080p, muto, loop.
export const heroCinematic = {
  enabled: false,
  mp4: "/media/domus-hero.mp4",
  webm: "/media/domus-hero.webm",
  poster: "/media/domus-hero-poster.jpg",
  // Fallback sempre presente (foto reale). Villa di pregio, luminosa, con Raffaela Rizza
  // in primo piano: calda, umana e "founder-led", coerente col brand e col velo scuro del testo.
  base: "/images/reali/villa-pool.jpg",
  baseAlt: "Raffaela Rizza davanti a una villa di pregio con piscina, a Tradate",
} as const;
