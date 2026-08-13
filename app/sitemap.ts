import type { MetadataRoute } from "next";
import { getVisibleListings } from "./lib/listings";
import { siteUrl } from "./lib/site";

// Origin: fonte unica in app/lib/site.ts (era ricalcolato qui, in robots, nel layout e nella scheda).
const base = siteUrl;

// Solo pagine INDICIZZABILI. /privacy e /cookie sono escluse finché restano `noindex`
// (testo legale placeholder da validare): rimetterle qui quando saranno finalizzate e indicizzabili
// — includere URL noindex nel sitemap è una segnalazione contraddittoria per i crawler.
export const SITEMAP_ROUTES = [
  "",
  "/vendi",
  "/acquista",
  "/metodo",
  "/open-domus",
  "/servizi",
  "/recensioni",
  "/chi-siamo",
  "/contatti",
  "/lavora-con-noi",
  "/domande-frequenti",
] as const;

/** Rotte NON indicizzabili: non devono MAI comparire nel sitemap (segnalazione
    contraddittoria). Serve al test di go-live per accorgersene se una rientra. */
export const NON_INDEXABLE_ROUTES = ["/privacy", "/cookie"] as const;

/**
 * Costruisce il sitemap da host + rotte + immobili. Puro e deterministico:
 * verificabile senza rete né cache (sitemap() gli passa gli immobili veri).
 */
export function buildSitemap(
  origin: string,
  routes: readonly string[],
  listings: readonly { slug: string; cover: string }[],
): MetadataRoute.Sitemap {
  const pages = routes.map((r) => ({ url: `${origin}${r}` }));
  const casePages = listings.map((p) => ({
    url: `${origin}/case/${p.slug}`,
    images: [p.cover.startsWith("http") ? p.cover : `${origin}${p.cover}`],
  }));
  return [...pages, ...casePages];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await getVisibleListings();

  // NIENTE lastModified, ed è una scelta.
  //
  // Prima qui c'era un solo `new Date()` applicato a ogni URL: a ogni deploy l'intero sito
  // dichiarava di essere cambiato, comprese pagine ferme da mesi. Google usa lastmod solo
  // "if it's consistently and verifiably accurate" — una data uguale ovunque e mossa da
  // ogni build non lo è, e il campo smette di essere creduto per tutto l'host.
  // Omettere è legittimo e non costa niente; mentire costa.
  //
  // La forma di Property consumata dalla UI non espone updatedAt/publishedAt (il mapping
  // RealSmart li scarta). Quando il feed li fornirà — è una domanda aperta al fornitore,
  // docs/retainer-plan.md §11.9 — qui torna un lastModified vero PER URL, non uno per tutti.
  //
  // Niente `changeFrequency`: Google lo ignora, dichiarato. Era codice morto che prometteva
  // una cadenza che nessuno rispetta e nessuno legge.
  // Le foto degli immobili sono un asset proprietario: buildSitemap le dichiara
  // (image sitemap inline) invece di una sitemap immagini separata.
  return buildSitemap(base, SITEMAP_ROUTES, listings);
}
