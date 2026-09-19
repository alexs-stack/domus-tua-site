// Configurazione dei media video del sito — UNICA.
//
// Il link al canale YouTube NON vive qui: la fonte unica dei canali social è app/lib/site.ts
// (`site.social.youtube.href`).
//
// Hero CINEMATICO full-bleed (HeroCinematic.tsx), vedi docs/hero-video.md. C21, la cliente il
// 3 agosto: niente video nell'hero, resta la foto; `enabled` resta false. `mp4` e `webm`
// puntano al loop del drone; il Congedo usa `ambient.congedo` con useAmbientVideo (spec §2.7).
export const heroCinematic = {
  enabled: false,
  mp4: "/media/congedo-drone-1080.mp4",
  webm: "/media/congedo-drone-1080.webm",
  poster: "/media/hero-raffaela.jpg",
  // Base: Raffaela che presenta il soggiorno di un attico reale — dentro
  // l'arco del preloader si vede il crop su di lei, poi la camera rientra
  // e rivela la stanza (vedi HERO_FOCUS in HeroCinematic.tsx).
  base: "/media/hero-raffaela.jpg",
  baseAlt: "Raffaela Rizza presenta il soggiorno di un attico luminoso proposto da Domus Tua",
} as const;

export type AmbientSource = { webm: string; mp4: string };

// I video d'ambiente (spec 2026-09-13 §7.3): due loop muti dal video tour di Domus Tua, senza
// logo (ritaglio del 10 % in alto e a sinistra) e raccordati con una dissolvenza. Il drone
// sulla villa è la cartolina del Congedo (A19 di Alberto), la superficie dell'acqua è Costi
// chiari (A18). `hd` 1920×1080, `sd` 1280×720: la sorgente la scrive useAmbientVideo la
// prima volta che l'host si avvicina (warm 50 %): 720p fino a 1.408 px resi, 1080p oltre.
// La produzione aspetta i punti 2.2, 2.13 e 6.2 del documento per la cliente
// (assertVillaMediaCleared in launchReadiness.ts, chiamata da next.config.ts al build).
export const ambient: {
  congedo: { hd: AmbientSource; sd: AmbientSource; poster: string };
  acqua: { hd: AmbientSource; poster: string };
} = {
  congedo: {
    hd: { webm: "/media/congedo-drone-1080.webm", mp4: "/media/congedo-drone-1080.mp4" },
    sd: { webm: "/media/congedo-drone-720.webm", mp4: "/media/congedo-drone-720.mp4" },
    poster: "/media/congedo-drone-poster.jpg",
  },
  acqua: {
    hd: { webm: "/media/acqua-1080.webm", mp4: "/media/acqua-1080.mp4" },
    poster: "/media/acqua-poster.jpg",
  },
};
