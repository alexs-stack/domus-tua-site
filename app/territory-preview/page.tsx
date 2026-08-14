// Anteprima DEV-ONLY della sezione "Vivere in zona" (Prompt 12) con dati fixture deterministici.
//
// Serve solo a verificare visivamente/E2E la sezione in locale, senza popolare dati di produzione né
// dipendere dal feed. In PRODUZIONE questa route restituisce 404 (notFound): non è una pagina pubblica,
// non finisce nella sitemap, non è indicizzabile.

import { notFound } from "next/navigation";
import VivereInZona from "../case/[slug]/VivereInZona";
import type { PublicListingTerritory } from "../lib/territory/types";

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

export default function TerritoryPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="py-16">
      <VivereInZona territory={FIXTURE} />
    </main>
  );
}
