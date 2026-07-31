// Configurazione dei video del sito — UNICA e PURA.
//
// Gli ID YouTube reali vivono in app/lib/site.ts (`site.videos`). Qui si decide soltanto
// COME sono composti i blocchi video della home: quale video sta nel player in evidenza e
// quali entrano nella collezione filtrabile.
//
// Perché un modulo a parte: prima la composizione stava dentro SocialVideoWall.tsx ("use
// client", con import di gsap e next/image), quindi non era verificabile da un test — e la
// griglia riciclava quattro id su otto slot, presentando lo stesso video con titoli diversi.
// Essendo un modulo puro, il test di content integrity può controllare l'unicità degli id.

import { site } from "./site";

export type VideoKind = "recensione" | "opendomus" | "tour" | "dietro";

export type VideoSlot = {
  /** Id YouTube: identità della card. Mai ripetuto tra gli slot. */
  id: string;
  kind: VideoKind;
  /** Copertina: foto reale dell'agenzia oppure la thumbnail del video stesso. */
  thumb: string;
  /** Titolo reale dal canale: nessuna didascalia inventata. */
  title: string;
};

/** Copertina del video stesso (i.ytimg.com è tra i remotePatterns di next.config). */
export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeWatch(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Video del player in evidenza (iframe caricato solo al click). */
export const featuredVideo = site.videos.featured;

/**
 * Collezione della griglia: le video recensioni reali.
 *
 * Non contiene né il video in evidenza né la testimonianza cliente: quest'ultima ha già il
 * suo blocco dedicato sulla home (FeaturedTestimonial). Prima comparivano entrambi anche
 * qui, con titoli diversi, facendo sembrare il canale più ricco di quanto sia.
 */
export const videoCollection: VideoSlot[] = site.videos.reviews.map(
  (r): VideoSlot => ({
    id: r.id,
    kind: "recensione",
    thumb: youtubeThumb(r.id),
    title: r.title,
  }),
);

/** Video del blocco testimonianza (FeaturedTestimonial). */
export const testimonialVideo = site.videos.testimonial;

/** Tutti gli id mostrati sulla home. Usato dal test di unicità. */
export function allVideoIds(): string[] {
  return [featuredVideo.id, testimonialVideo.id, ...videoCollection.map((v) => v.id)];
}
