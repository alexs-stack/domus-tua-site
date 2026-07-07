import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.domustua.com";

// Indicizzazione SOLO in produzione. Su preview/staging (o quando il badge di anteprima è
// attivo) blocchiamo i crawler: gli URL di anteprima Vercel NON devono finire su Google.
// - Vercel imposta VERCEL_ENV = "production" | "preview" | "development".
// - Fallback (assente): consideriamo "produzione" solo se il badge anteprima NON è "true".
// Prima del go-live verificare che il dominio finale sia in VERCEL_ENV=production. Vedi
// docs/vercel-live-checklist.md (§SEO).
const isProduction = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : process.env.NEXT_PUBLIC_PREVIEW_BADGE !== "true";

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    // Anteprima/staging: niente indicizzazione, nessun sitemap esposto ai crawler.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
