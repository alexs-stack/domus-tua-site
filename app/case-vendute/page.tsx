import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { getVisibleListings, isSold } from "../lib/listings";
import type { Property } from "../lib/properties";
import { comuneOf } from "../lib/comune";
import { isCompletedSale, soldDetectionDate } from "../lib/realsmart/soldOverrides";
import { getListingDataSourceStatus } from "../lib/realsmart/status";
import CaseVenduteContent, { type SoldCard, type SoldStats } from "./CaseVenduteContent";
import { breadcrumbJsonLd, jsonLdScript } from "../lib/site";

/** Voce del briciolo di pane per questa pagina (voce 26 della checklist). */
const BREADCRUMB_NAME = "Case vendute";
const BREADCRUMB_PATH = "/case-vendute";

export const metadata: Metadata = {
  title: "Case vendute a Tradate e provincia: i risultati di Domus Tua",
  description:
    "Gli immobili che Domus Tua ha portato fino alla firma, comune per comune. Campione e data del rilevamento dichiarati: nessun prezzo di vendita stimato, nessun tempo promesso.",
  alternates: { canonical: "/case-vendute" },
  openGraph: {
    title: "Case vendute a Tradate e provincia: i risultati di Domus Tua",
    description:
      "Gli immobili che Domus Tua ha portato fino alla firma, comune per comune. Campione e data del rilevamento dichiarati.",
  },
};

/** La data del rilevamento in forma leggibile (it-IT: "8 agosto 2026"). */
function formatDetectionDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/**
 * Quante schede disegnare.
 *
 * Il catalogo ne ha 168 e mostrarle tutte portava la pagina a 700 KB — la stessa classe di
 * problema che il documento contesta a /acquista (punto 29), con l'aggravante che qui non
 * servirebbe: questa pagina deve PROVARE, non far navigare. A provare è il numero in cima,
 * con il suo denominatore; la centosessantottesima card non convince nessuno che le prime
 * quarantotto non abbiano già convinto.
 *
 * Il taglio è dichiarato in pagina, non silenzioso: «ne mostriamo 48». Un troncamento
 * taciuto si legge come "questo è tutto", ed è la bugia più facile da evitare.
 *
 * NB: il feed non espone la data di vendita, quindi non esiste un ordinamento "più
 * recenti". Le prime 48 sono le prime del catalogo: nessun criterio implicito da spiegare.
 */
const MAX_CARDS = 48;

/** Dal Property completo ai sei campi della card. Niente prezzo: è di richiesta, non di
    vendita, e accanto alla parola "venduta" verrebbe letto come la cifra incassata. */
function toSoldCard(p: Property): SoldCard {
  return { slug: p.slug, title: p.title, zone: p.zone, type: p.type, sqm: p.sqm, cover: p.cover };
}

export default async function CaseVendutePage() {
  const all = await getVisibleListings();
  // NON `isSold`: quello risponde a «lo tolgo dalla vetrina?» ed è giustamente largo —
  // comprende preliminari e proposte accettate. Qui l'affermazione è pubblica e diversa
  // («l'abbiamo venduto»), quindi serve il predicato stretto. Vedi isCompletedSale.
  const sold = all.filter((p) => isSold(p) && isCompletedSale(p.slug, p.cover));

  // Il denominatore è parte del dato: "166 vendute" senza "su 196 pubblicate" è un numero
  // che non si può leggere. Entrambi vengono dalla stessa fonte, nello stesso istante.
  const stats: SoldStats = {
    sold: sold.length,
    total: all.length,
    comuni: new Set(sold.map((p) => comuneOf(p.zone)).filter(Boolean)).size,
    shown: Math.min(sold.length, MAX_CARDS),
    // La data si dichiara SOLO quando i dati vengono davvero dal gestionale. Con le
    // fixture di anteprima lo stato "venduto" è scritto a mano nel repo, non rilevato:
    // stampare una data di rilevamento accanto a dei dati demo sarebbe la cosa più
    // sbagliata che questa pagina possa fare, perché darebbe autorevolezza al segnaposto.
    detectedOn:
      getListingDataSourceStatus().mode === "mock"
        ? null
        : formatDetectionDate(soldDetectionDate()),
  };

  return (
    <>
      {/* Briciolo di pane: è ciò che Google mostra al posto dell'URL nudo nei
          risultati. Costruito da breadcrumbJsonLd (site.ts), non ricopiato. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(BREADCRUMB_NAME, BREADCRUMB_PATH)) }}
      />
      <Header />
      {/* Proiezione ai SOLI campi che la card disegna. `toGridProperty` non basta qui:
          toglie descrizione e galleria ma lascia facts, features, excerpt, badges e
          prezzi, e su 168 immobili quella zavorra portava la pagina a 1,2 MB — peggio di
          /acquista, che il documento cita come difetto (punto 29). */}
      <CaseVenduteContent listings={sold.slice(0, MAX_CARDS).map(toSoldCard)} stats={stats} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
