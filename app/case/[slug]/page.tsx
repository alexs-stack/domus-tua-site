import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WhatsAppFloat from "../../components/WhatsAppFloat";
import PropertyDetail from "./PropertyDetail";
import { getVisibleListings } from "../../lib/listings";
import { relatedListings } from "../../lib/related";
import { getPublicListingTerritory, getPublicAreaProfileFor } from "../../lib/territory/publicRead";
import { site, siteUrl, jsonLdScript } from "../../lib/site";

/**
 * RESA DINAMICA, DICHIARATA. Questa rotta legge il feed RealSmart, che si scarica con
 * `cache: "no-store"` (il grezzo è ~2.6MB, oltre il limite della Data Cache — vedi
 * app/lib/realsmart/client.ts). Un dato dinamico a runtime e una rotta statica sono
 * inconciliabili, e prima qui convivevano: `generateStaticParams()` prometteva ~186 schede
 * prerenderizzate mentre il dato sottostante costringeva Next a uscire dal prerender
 * (DYNAMIC_SERVER_USAGE). Da lì i 500 in produzione su /case/gallarate-92 e /case/malnate-91.
 *
 * Si sceglie UNA strategia sola, quella onesta rispetto alla sorgente: la scheda è dinamica.
 * NON significa una fetch del feed per visitatore — `getLiveListingsSnapshot()` tiene uno
 * snapshot in-process per ~12 minuti (single-flight), quindi il gestionale continua a essere
 * interrogato ~5 volte l'ora per istanza, esattamente come prima.
 *
 * `generateStaticParams()` è stato RIMOSSO: tornerà solo insieme a uno snapshot degli annunci
 * materializzato e durevole (oggi non esiste — vedi docs/adr/001-territorial-enrichment.md §5).
 */
export const dynamic = "force-dynamic";

/**
 * UNA lettura del catalogo per richiesta, condivisa da generateMetadata e dal corpo della pagina.
 *
 * `React.cache` è memoizzazione con AMBITO LA SINGOLA RICHIESTA (nessuna condivisione tra
 * richieste diverse): Next esegue generateMetadata e il render nello stesso ambito, quindi le
 * tre letture di prima (una nei metadati, due nel corpo) diventano una sola normalizzazione di
 * ~186 annunci invece di tre. Metadati e contenuto vedono così per costruzione LA STESSA
 * versione dell'immobile, senza il rischio che una rivalidazione tra i due passaggi faccia
 * descrivere in <title> un prezzo diverso da quello in pagina.
 */
const listingsForRequest = cache(getVisibleListings);
const listingForRequest = cache(async (slug: string) =>
  (await listingsForRequest()).find((p) => p.slug === slug),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await listingForRequest(slug);
  if (!p) return { title: "Immobile non trovato" };
  const canonical = `/case/${p.slug}`;
  // `absolute` scavalca il template " · Domus Tua Immobiliare" del layout: sommato a
  // titolo + zona superava i ~70 caratteri utili e la prima cosa a sparire nella
  // troncatura era il COMUNE — cioè l'unica parola per cui questa pagina può essere
  // cercata. È la famiglia di URL più numerosa del sito: vale una riga.
  const title = `${p.title}, ${p.zone} | Domus Tua`;
  return {
    title: { absolute: title },
    description: p.excerpt,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: "Domus Tua Immobiliare",
      url: canonical,
      title: `${p.title}, ${p.zone}`,
      description: p.excerpt,
      images: [
        {
          url: p.cover,
          alt: `${p.title} — ${p.zone}`,
        },
      ],
    },
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await listingForRequest(slug);
  if (!p) notFound();

  // Correlati: SOLO disponibili, mai l'immobile corrente, stessa zona prima. La regola vive in
  // app/lib/related.ts — qui non si ripete lo stato "venduto". Prima questa lista pescava dal
  // feed visibile venduti inclusi, e una scheda disponibile poteva suggerire case già vendute.
  const all = await listingsForRequest();
  const related = relatedListings(all, p);

  // Territorio APPROVATO letto SERVER-SIDE dallo store, cacheato con tag mirati e proiettato al
  // payload minimo (niente coordinate/storico). A feature spenta o senza dato approvato: null →
  // la sezione non entra nel DOM e non costa nulla al client. Nessuna chiamata a provider al render.
  const territory = await getPublicListingTerritory(p.slug);
  // Descrizioni d'area del comune (fatti verificati), lette server-side e cacheate. Null in assenza
  // di fatti approvati o a feature spenta → la sezione "La zona" non compare.
  const area = await getPublicAreaProfileFor(p.zone);

  // Dati strutturati per l'immobile (schema.org).
  //
  // PERCHÉ NON PIÙ `Product`. Product descrive un prodotto realmente acquistabile a prezzo
  // esposto e vincolante: un immobile in trattativa non lo è, e dichiararlo tale è markup
  // che non rappresenta la pagina. Da sapere prima di "migliorarlo": **nessuna delle due
  // forme produce un rich result** — Google non ne ha uno per gli immobili. Qui si marca
  // per chiarezza di entità, non per ottenere una decorazione in SERP.
  //
  // La forma è un grafo di tre nodi legati da @id, perché RealEstateListing è un sottotipo
  // di WebPage e da solo non può portare indirizzo, superficie o locali:
  //   #listing  RealEstateListing → la pagina dell'annuncio
  //   #property Apartment/House/Place → la cosa: dove sta, quanto è grande
  //   Offer     → il prezzo, con lo stato reale e il tipo di operazione
  const url = `${siteUrl}/case/${p.slug}`;
  const image = p.cover.startsWith("http") ? p.cover : `${siteUrl}${p.cover}`;
  const hasPrice = Number.isFinite(p.priceValue) && p.priceValue > 0;

  // `sqm`/`rooms`/`baths` sono stringhe da mostrare ("145 m²", "4 locali"): il numero si
  // estrae, e se non c'è il campo si omette invece di inventarlo.
  const firstNumber = (s: string | undefined): number | undefined => {
    const m = s?.match(/\d+([.,]\d+)?/);
    const n = m ? Number(m[0].replace(",", ".")) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  const floorSize = firstNumber(p.sqm);
  const rooms = firstNumber(p.rooms);
  const baths = firstNumber(p.baths);

  // Terreno e Commerciale non sono alloggi: restano Place, che è vero per entrambi.
  const propertyType =
    p.type === "Villa"
      ? "SingleFamilyResidence"
      : p.type === "Appartamento" || p.type === "Attico"
        ? "Apartment"
        : "Place";

  // Lo stato lo decide il flag del gestionale, lo stesso che la scheda usa per mostrare
  // "questo immobile è stato venduto" (PropertyDetail). Prima di questo la pagina diceva
  // "venduto" a chi la leggeva e InStock a Google: due affermazioni opposte nello stesso
  // documento. SoldOut e non OutOfStock, che significa "temporaneamente esaurito".
  // `status` distingue vendita e locazione: senza, un affitto da 800 € e una villa da
  // 800.000 € portano lo stesso identico markup (vedi app/lib/availability.ts, dove il
  // flag `sold` copre entrambi i casi).
  const availability = p.sold
    ? "https://schema.org/SoldOut"
    : "https://schema.org/InStock";
  const businessFunction =
    p.status === "Affitto"
      ? "http://purl.org/goodrelations/v1#LeaseOut"
      : "http://purl.org/goodrelations/v1#Sell";

  const residenceJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        "@id": `${url}#listing`,
        url,
        name: p.title,
        description: p.excerpt,
        image,
        provider: { "@id": `${siteUrl}/#organization` },
        mainEntity: { "@id": `${url}#property` },
      },
      {
        "@type": propertyType,
        "@id": `${url}#property`,
        name: p.title,
        address: {
          "@type": "PostalAddress",
          addressLocality: p.zone,
          // Sigla ISO (schema.org addressRegion), coerente col nodo organizzazione
          // in layout.tsx — prima qui era "Varese" e là "VA": stessa fonte ora.
          addressRegion: site.address.region,
          addressCountry: "IT",
        },
        ...(floorSize
          ? {
              floorSize: {
                "@type": "QuantitativeValue",
                value: floorSize,
                unitCode: "MTK", // metri quadri, codice UN/CEFACT
              },
            }
          : {}),
        ...(rooms ? { numberOfRooms: rooms } : {}),
        ...(baths ? { numberOfBathroomsTotal: baths } : {}),
      },
      ...(hasPrice
        ? [
            {
              "@type": "Offer",
              itemOffered: { "@id": `${url}#property` },
              seller: { "@id": `${siteUrl}/#organization` },
              price: p.priceValue,
              priceCurrency: "EUR",
              availability,
              businessFunction,
              url,
            },
          ]
        : []),
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Case", item: `${siteUrl}/acquista` },
      { "@type": "ListItem", position: 3, name: p.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(residenceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <Header />
      <PropertyDetail p={p} related={related} territory={territory} area={area} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
