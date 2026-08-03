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
// o il video fallisce, resta il `base` come poster.
// Video consigliato: 15-35s, ~1080p, muto, loop.
export const heroCinematic = {
  // Scelta cliente (2026-08-03): niente video nell'hero, resta la foto aerea
  // della villa. Il clip drone resta in /media pronto per un ripensamento.
  enabled: false,
  mp4: "/media/domus-hero.mp4",
  // Vuoto = sorgente non renderizzata (evita un 404 a ogni visita desktop);
  // valorizzare quando esisterà la codifica webm.
  webm: "",
  poster: "/media/hero-aerial.jpg",
  // Base: ripresa aerea reale (drone) della villa con piscina — è l'immagine
  // dentro cui si "entra" attraverso l'arco del preloader (vedi Preloader.tsx).
  base: "/media/hero-aerial.jpg",
  baseAlt: "Vista aerea di una villa con piscina e giardino proposta da Domus Tua",
} as const;
