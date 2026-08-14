// Anteprima DEV-ONLY della sezione "Vivere in zona" (Prompt 12) con dati fixture deterministici.
//
// Serve solo a verificare visivamente/E2E la sezione in locale, senza popolare dati di produzione né
// dipendere dal feed. In PRODUZIONE questa route restituisce 404 (notFound): non è una pagina pubblica,
// non finisce nella sitemap, non è indicizzabile.

import { notFound } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VivereInZona from "../case/[slug]/VivereInZona";
import type { PublicListingTerritory } from "../lib/territory/types";
import type { PublicAreaProfile } from "../lib/territory/area/types";

export const dynamic = "force-static";

// Impedisce l'indicizzazione anche in caso di esposizione accidentale.
export const metadata = { robots: { index: false, follow: false } };

const FIXTURE: PublicListingTerritory = {
  realSmartCode: "DEMO",
  municipality: "tradate",
  method: "straight-line",
  originBasis: { precision: "municipality-centroid", label: "Tradate" },
  retrievedAt: "2026-08-13T10:00:00.000Z",
  pois: [
    { category: "railway-station", name: "Stazione di Tradate", distanceMeters: 950, distanceMethod: "straight-line", provider: "osm-overpass", attribution: "© OpenStreetMap contributors", sourceUrl: "https://www.openstreetmap.org/node/1" },
    { category: "pharmacy", name: "Farmacia Centrale", distanceMeters: 240, distanceMethod: "straight-line", provider: "osm-overpass", attribution: "© OpenStreetMap contributors" },
    { category: "pharmacy", name: "Farmacia San Rocco", distanceMeters: 520, distanceMethod: "straight-line", provider: "osm-overpass", attribution: "© OpenStreetMap contributors" },
    { category: "supermarket", name: "Esselunga", distanceMeters: 680, distanceMethod: "straight-line", provider: "osm-overpass", attribution: "© OpenStreetMap contributors" },
    { category: "school", name: "Scuola Primaria Dante", distanceMeters: 430, distanceMethod: "straight-line", provider: "osm-overpass", attribution: "© OpenStreetMap contributors" },
    { category: "park", name: "Parco Comunale", distanceMeters: 1200, distanceMethod: "straight-line", provider: "osm-overpass", attribution: "© OpenStreetMap contributors" },
  ],
};

// Descrizioni d'area DIMOSTRATIVE per Tradate: fatti reali e verificabili (stazione S40, ospedale
// Galmarini, Parco Pineta…), neutri e senza superlativi (passano il guard soggettivo), ognuno con la
// fonte primaria e la data di verifica. È l'esempio di qualità "10/10" della sezione "La zona".
const AREA_FIXTURE: PublicAreaProfile = {
  municipality: "tradate",
  facts: [
    { category: "transport", scope: "municipality", text: "Dalla stazione di Tradate la linea S40 di Trenord porta diretti a Milano Cadorna e a Como San Giovanni.", sourceOwner: "Trenord", sourceUrl: "https://www.trenord.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "regional-connection", scope: "municipality", text: "La Varesina, la ex statale 233, attraversa Tradate e collega Varese a Milano.", sourceOwner: "Comune di Tradate", sourceUrl: "https://www.comune.tradate.va.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "municipal-service", scope: "municipality", text: "In centro a Tradate ci sono la biblioteca civica e gli uffici dell'anagrafe.", sourceOwner: "Comune di Tradate", sourceUrl: "https://www.comune.tradate.va.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "healthcare", scope: "municipality", text: "A Tradate c'è l'ospedale Galmarini, che fa parte dell'ASST dei Sette Laghi.", sourceOwner: "ASST Sette Laghi", sourceUrl: "https://www.asst-settelaghi.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "school", scope: "municipality", text: "A Tradate ci sono scuole di ogni grado, dall'infanzia alle superiori.", sourceOwner: "Comune di Tradate", sourceUrl: "https://www.comune.tradate.va.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "park-facility", scope: "municipality", text: "Il Parco Pineta di Appiano Gentile e Tradate è un parco regionale protetto di circa 4.800 ettari.", sourceOwner: "Parco Pineta / Regione Lombardia", sourceUrl: "https://www.parcopineta.org/", reviewedAt: "2026-08-10T00:00:00.000Z" },
  ],
};

/**
 * Visibile in sviluppo e, in un build di produzione, SOLO con `TERRITORY_PREVIEW=1` esplicito —
 * è così che la suite E2E può misurarla su un build vero. I deploy di produzione non impostano
 * mai quella variabile: lì la route resta 404 (e comunque `noindex`).
 */
function previewAllowed(): boolean {
  if (process.env.TERRITORY_PREVIEW === "1") return true;
  return process.env.NODE_ENV !== "production";
}

export default function TerritoryPreviewPage() {
  if (!previewAllowed()) notFound();
  // Header/Footer reali: l'anteprima deve somigliare a una pagina vera, non a un frammento —
  // è anche la condizione perché la suite E2E misuri la sezione nel suo contesto (chrome inclusa).
  return (
    <>
      <Header />
      <main id="main" className="py-16">
        <VivereInZona territory={FIXTURE} area={AREA_FIXTURE} />
      </main>
      <Footer />
    </>
  );
}
