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
  "/recensioni",
  "/chi-siamo",
  "/contatti",
  "/lavora-con-noi",
  "/domande-frequenti",
];

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
  const pages = routes.map((r) => ({ url: `${base}${r}` }));

  // Le foto degli immobili sono un asset proprietario e non stanno da nessun'altra parte:
  // dichiararle qui è il modo di farle scoprire senza una sitemap immagini separata.
  const casePages = listings.map((p) => ({
    url: `${base}/case/${p.slug}`,
    images: [p.cover.startsWith("http") ? p.cover : `${base}${p.cover}`],
  }));

  return [...pages, ...casePages];
}
