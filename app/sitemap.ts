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
  const pages = routes.map((r) => ({ url: `${base}${r}`, changeFrequency: "monthly" as const }));
  const casePages = listings.map((p) => ({
    url: `${base}/case/${p.slug}`,
    changeFrequency: "weekly" as const,
  }));
  return [...pages, ...casePages];
}
