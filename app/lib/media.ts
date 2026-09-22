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
  poster: "/images/reali/hero-raffaela-piscina-alta.jpg",
  // Base (A49 e A71, 22 set. 2026, sera; Alberto: «non c'è né l'immagine alta che fa da sfondo pagina
  // a schermo intero, né l'effetto dello scroll dentro l'immagine»; «sì, fallo … e falla no-bg così è
  // più bella»): la FOTO VERA di Raffaela davanti alla villa con piscina (villa-pool.jpg, 3:2, che A55
  // aveva portato all'hero da Paths) ESTESA a 2:3 con Higgsfield (outpaint + upscale 4K,
  // `hero-raffaela-piscina-alta.jpg`) e col cielo trasparente da scripts/media/cielo.mjs: `base` è il
  // WebP con l'alpha, `baseM` la striscia 9:16 centrata per il telefono, ritagliata dallo stesso WebP
  // da scripts/media/hero-piscina.mjs (art direction a 768 in HeroCinematic.tsx; le misure in
  // app/lib/motion/hero.json). I due JPEG di A55 in public/media restano su disco, non montati. La
  // scena AMPIA generata con Higgsfield (A44/A45, `hero-raffaela-villa.jpg`) resta in Paths. Il
  // soggiorno dell'attico di prima (`hero-raffaela.jpg`) è uscito: la cliente non può più mostrare
  // quella casa.
  base: "/images/reali/hero-raffaela-piscina-alta-cielo.webp",
  baseM: "/images/reali/hero-raffaela-piscina-alta-m-cielo.webp",
  /** Le misure dei due file (hero.json): le legge HeroCinematic per `getImageProps` e hero-alto.test.ts. */
  baseSize: { w: 2560, h: 3812 },
  baseMSize: { w: 2144, h: 3812 },
  baseAlt: "Raffaela Rizza davanti alla villa con piscina proposta da Domus Tua",
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
    poster: "/media/congedo-poster.jpg",
  },
  acqua: {
    hd: { webm: "/media/acqua-1080.webm", mp4: "/media/acqua-1080.mp4" },
    poster: "/media/acqua-poster.jpg",
  },
};
