import type { MetadataRoute } from "next";
import { properties } from "./lib/properties";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = routes.map((r) => ({ url: `${base}${r}`, changeFrequency: "monthly" as const }));
  const casePages = properties.map((p) => ({
    url: `${base}/case/${p.slug}`,
    changeFrequency: "weekly" as const,
  }));
  return [...pages, ...casePages];
}
