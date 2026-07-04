import type { MetadataRoute } from "next";
import { getVisibleListings } from "./lib/listings";

const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.domustua.com";

const routes = [
  "",
  "/vendi",
  "/acquista",
  "/metodo",
  "/open-domus",
  "/servizi",
  "/case",
  "/recensioni",
  "/chi-siamo",
  "/contatti",
  "/privacy",
  "/cookie",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getVisibleListings();
  // Property (forma consumata dalla UI) non espone updatedAt/publishedAt: il feed
  // RealSmart li scarta nel mapping. Usiamo la data di build come freshness per tutte
  // le voci, così i crawler ricevono comunque un lastModified valido.
  const now = new Date();
  const pages = routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
  }));
  const casePages = listings.map((p) => ({
    url: `${base}/case/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
  }));
  return [...pages, ...casePages];
}
