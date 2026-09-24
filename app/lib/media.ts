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
  // Scelta cliente (2026-08-03): niente video nell'hero, resta la foto.
  // Il clip drone resta in /media pronto per un ripensamento.
  enabled: false,
  mp4: "/media/domus-hero.mp4",
  // Vuoto = sorgente non renderizzata (evita un 404 a ogni visita desktop);
  // valorizzare quando esisterà la codifica webm.
  webm: "",
  poster: "/media/hero-raffaela.jpg",
  // Base: Raffaela che presenta il soggiorno di un attico reale — dentro
  // l'arco del preloader si vede il crop su di lei, poi la camera rientra
  // e rivela la stanza (vedi HERO_FOCUS in HeroCinematic.tsx).
  base: "/media/hero-raffaela.jpg",
  baseAlt: "Raffaela Rizza presenta il soggiorno di un attico luminoso proposto da Domus Tua",
} as const;
