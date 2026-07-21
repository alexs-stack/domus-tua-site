// Content-integrity: sorgente unica + helper per distinguere contenuto VERIFICATO da
// segnaposto/demo. Regola del sito (vedi docs/content-replacement-checklist.md):
//   • PRODUZIONE (NEXT_PUBLIC_PREVIEW_BADGE !== "true") → SOLO contenuto verificato.
//   • ANTEPRIMA  (=== "true") → può mostrare segnaposto, ma SEMPRE etichettati come demo.
//
// Client-safe: usa solo NEXT_PUBLIC_* (nessun segreto, nessuna env server-only). Importabile
// sia da componenti server sia da "use client".

import { site } from "./site";

/** true in anteprima; false in produzione. Guida il gating dei contenuti non verificati. */
export const isPreview = process.env.NEXT_PUBLIC_PREVIEW_BADGE === "true";

// ─── Video del canale YouTube (single source = site.videos) ──────────────────────────────
// Ogni video qui è REALE e confermato. La thumbnail usata è quella ufficiale di YouTube
// (`img.youtube.com/vi/<id>`), quindi titolo ↔ ID ↔ thumbnail sono coerenti PER COSTRUZIONE:
// impossibile mostrare una copertina che non corrisponde al video. Nessun ID è riusato.

export type VideoKind = "opendomus" | "recensione" | "storia";

export interface VerifiedVideo {
  id: string;
  title: string;
  kind: VideoKind;
  /** Solo video confermati dal canale entrano qui. */
  verified: true;
}

/** Storia in evidenza (player grande). */
export const featuredVideo: VerifiedVideo = {
  id: site.videos.featured.id,
  title: site.videos.featured.title,
  kind: "opendomus",
  verified: true,
};

/** Collezione sotto il player: recensioni reali + testimonianza cliente. Nessun duplicato. */
export const collectionVideos: VerifiedVideo[] = [
  ...site.videos.reviews.map((r) => ({
    id: r.id,
    title: r.title,
    kind: "recensione" as const,
    verified: true as const,
  })),
  {
    id: site.videos.testimonial.id,
    title: site.videos.testimonial.title,
    kind: "storia",
    verified: true,
  },
];

/** Thumbnail reale di YouTube (match garantito col video). */
export const ytThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
/** URL di visione su YouTube. */
export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/**
 * Guard di integrità: nessun ID YouTube è riusato tra card diverse.
 * Lanciata dal test di integrità (scripts/test-content-integrity.ts) e utilizzabile a runtime.
 */
export function assertUniqueVideoIds(vids: readonly { id: string }[]): void {
  const seen = new Set<string>();
  for (const v of vids) {
    if (seen.has(v.id)) {
      throw new Error(`[content] YouTube ID riusato tra card diverse: ${v.id}`);
    }
    seen.add(v.id);
  }
}
