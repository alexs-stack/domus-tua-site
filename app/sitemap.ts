import type { MetadataRoute } from "next";
import { getVisibleListings } from "./lib/listings";
import { siteUrl } from "./lib/site";

// Origin: fonte unica in app/lib/site.ts (era ricalcolato qui, in robots, nel layout e nella scheda).
const base = siteUrl;

// Solo pagine INDICIZZABILI. /privacy e /cookie sono escluse finché restano `noindex`
// (testo legale placeholder da validare): rimetterle qui quando saranno finalizzate e indicizzabili
// — includere URL noindex nel sitemap è una segnalazione contraddittoria per i crawler.
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
  "/lavora-con-noi",
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
