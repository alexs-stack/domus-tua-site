// Anteprima DEV-ONLY della sezione "Vivere in zona" (Prompt 12) con dati fixture deterministici.
//
// Serve solo a verificare visivamente/E2E la sezione in locale, senza popolare dati di produzione né
// dipendere dal feed. In PRODUZIONE questa route restituisce 404 (notFound): non è una pagina pubblica,
// non finisce nella sitemap, non è indicizzabile.

import { notFound } from "next/navigation";
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
  // Etichetta di QUARTIERE: l'anteprima esercita il caso più stretto, "Vivere in {Quartiere}".
  // Con la sola etichetta di comune l'intestazione sarebbe "Vivere a Tradate".
  label: "Abbiate Guazzone",
  // La NARRATIVA approvata: sintesi 60–90 parole + sezioni nell'ordine canonico. Ogni frase qui
  // deriva dai fatti sotto — è la condizione che il cancello di pubblicazione impone, e questa
  // fixture serve anche a verificare che una narrativa conforme si veda come deve.
  narrative: {
    title: "Vivere in Abbiate Guazzone",
    intro:
      "Abbiate Guazzone è una frazione di Tradate, e la vita quotidiana si appoggia ai servizi " +
      "del comune. La stazione è servita dalla linea suburbana S40, che collega direttamente " +
      "Milano Cadorna e Como San Giovanni; la direttrice storica verso Varese e Milano è la ex " +
      "statale 233 Varesina. In centro hanno sede la biblioteca civica e gli sportelli " +
      "anagrafici. L'assistenza ospedaliera fa capo al Galmarini, parte dell'ASST dei Sette " +
      "Laghi, e il verde è quello del Parco Pineta.",
    sections: [
      {
        category: "transport",
        heading: "Mobilità",
        body:
          "Il collegamento ferroviario passa dalla stazione di Tradate, sulla linea suburbana " +
          "S40 di Trenord: da lì partono i treni diretti verso Milano Cadorna e Como San Giovanni.",
      },
      {
        category: "regional-connection",
        heading: "Collegamenti territoriali",
        body:
          "Su gomma il riferimento è la ex strada statale 233 Varesina, che attraversa il " +
          "territorio comunale ed è la direttrice storica fra Varese e Milano.",
      },
      {
        category: "municipal-service",
        heading: "Servizi quotidiani",
        body:
          "Gli sportelli anagrafici e la biblioteca civica hanno sede nel centro di Tradate, " +
          "a poca distanza dalla frazione.",
      },
      {
        category: "healthcare",
        heading: "Salute",
        body:
          "L'ospedale Galmarini di Tradate fa parte dell'ASST dei Sette Laghi ed è il " +
          "riferimento ospedaliero dell'area.",
      },
      {
        category: "park-facility",
        heading: "Verde e tempo libero",
        body:
          "Il Parco Pineta di Appiano Gentile e Tradate è un'area naturale protetta regionale " +
          "estesa su circa 4.800 ettari.",
      },
    ],
  },
  facts: [
    { category: "transport", scope: "municipality", text: "La stazione di Tradate è servita dalla linea suburbana S40 di Trenord, con collegamenti diretti verso Milano Cadorna e Como San Giovanni.", sourceOwner: "Trenord", sourceUrl: "https://www.trenord.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "regional-connection", scope: "municipality", text: "Il territorio comunale è attraversato dalla ex strada statale 233 Varesina, direttrice storica tra Varese e Milano.", sourceOwner: "Comune di Tradate", sourceUrl: "https://www.comune.tradate.va.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "municipal-service", scope: "municipality", text: "Nel centro cittadino hanno sede la biblioteca civica e gli sportelli anagrafici del Comune.", sourceOwner: "Comune di Tradate", sourceUrl: "https://www.comune.tradate.va.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "healthcare", scope: "municipality", text: "L'ospedale «Galmarini» di Tradate fa parte dell'ASST dei Sette Laghi.", sourceOwner: "ASST Sette Laghi", sourceUrl: "https://www.asst-settelaghi.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "school", scope: "municipality", text: "A Tradate sono presenti scuole di ogni grado, dall'infanzia alla secondaria di secondo grado.", sourceOwner: "Comune di Tradate", sourceUrl: "https://www.comune.tradate.va.it/", reviewedAt: "2026-08-10T00:00:00.000Z" },
    { category: "park-facility", scope: "municipality", text: "Il Parco Pineta di Appiano Gentile e Tradate è un'area naturale protetta regionale estesa su circa 4.800 ettari.", sourceOwner: "Parco Pineta / Regione Lombardia", sourceUrl: "https://www.parcopineta.org/", reviewedAt: "2026-08-10T00:00:00.000Z" },
  ],
};

export default function TerritoryPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="py-16">
      <VivereInZona territory={FIXTURE} area={AREA_FIXTURE} />
    </main>
  );
}
