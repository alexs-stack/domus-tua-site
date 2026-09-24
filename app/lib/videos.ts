// Configurazione dei video del sito — UNICA e PURA.
//
// Gli ID YouTube reali vivono in app/lib/site.ts (`site.videos`). Qui si decide soltanto
// COME sono composti i blocchi video della home: quali card entrano nel muro delle voci e
// quale video sta nel blocco testimonianza.
//
// Perché un modulo a parte: prima la composizione stava dentro il componente client (con
// import di gsap e next/image), quindi non era verificabile da un test — e la griglia
// riciclava quattro id su otto slot, presentando lo stesso video con titoli diversi.
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

/** Video del blocco testimonianza (FeaturedTestimonial). */
export const testimonialVideo = site.videos.testimonial;

/**
 * Il muro delle voci (ReviewsWall, home): TUTTI i video reali del canale come
 * card — storia in evidenza, le tre recensioni, Teresa/Open Domus e il team.
 * La testimonianza NON entra: ha il suo blocco dedicato (FeaturedTestimonial).
 * Ogni card porta il titolo reale del canale; l'unicità la controlla il test.
 */
export const wallVideos: VideoSlot[] = [
  { ...site.videos.featured, kind: "opendomus", thumb: youtubeThumb(site.videos.featured.id) },
  ...site.videos.reviews.map(
    (r): VideoSlot => ({ id: r.id, kind: "recensione", thumb: youtubeThumb(r.id), title: r.title }),
  ),
  { ...site.videos.openDomus, kind: "opendomus", thumb: youtubeThumb(site.videos.openDomus.id) },
  { ...site.videos.team, kind: "dietro", thumb: youtubeThumb(site.videos.team.id) },
];

/**
 * Tutti gli id mostrati come card/player sulla home. Usato dal test di unicità.
 * Dal 2026-08-03 il muro (wallVideos) ha sostituito la vecchia collezione
 * filtrabile, rimossa col suo componente il 2026-08-15: qui restano solo le
 * composizioni montate davvero (muro + testimonianza, che resta a parte).
 */
export function allVideoIds(): string[] {
  return [testimonialVideo.id, ...wallVideos.map((v) => v.id)];
}
