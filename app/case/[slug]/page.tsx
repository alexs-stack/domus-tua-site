import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { soldPageDirective, soldRobots } from "../../lib/seo/soldPolicy";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WhatsAppFloat from "../../components/WhatsAppFloat";
import PropertyDetail from "./PropertyDetail";
import { getVisibleListings, getVisibleListing } from "../../lib/listings";
import { site, siteUrl, jsonLdScript } from "../../lib/site";

export async function generateStaticParams() {
  const list = await getVisibleListings();
  return list.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getVisibleListing(slug);
  if (!p) return { title: "Immobile non trovato" };
  const canonical = `/case/${p.slug}`;
  // `absolute` scavalca il template " · Domus Tua Immobiliare" del layout: sommato a
  // titolo + zona superava i ~70 caratteri utili e la prima cosa a sparire nella
  // troncatura era il COMUNE — cioè l'unica parola per cui questa pagina può essere
  // cercata. È la famiglia di URL più numerosa del sito: vale una riga.
  const title = `${p.title}, ${p.zone} | Domus Tua`;
  // Venduto: robots dalla policy (default noindex). Per un immobile disponibile nessun robots
  // esplicito = indicizzabile come sempre. redirect/gone non passano di qui (rispondono prima).
  const robots = p.sold ? soldRobots() ?? undefined : undefined;
  return {
    title: { absolute: title },
    description: p.excerpt,
    ...(robots ? { robots } : {}),
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
  const p = await getVisibleListing(slug);
  if (!p) notFound();

  // Policy SEO dei venduti (app/lib/seo/soldPolicy.ts). Il default "noindex" tiene la pagina
  // online per gli utenti e la esclude dall'indice (robots in generateMetadata). "redirect" e
  // "gone" invece cambiano la RISPOSTA HTTP e vanno gestiti qui, prima di renderizzare.
  if (p.sold) {
    const directive = soldPageDirective();
    if (directive.kind === "redirect") redirect(directive.redirectTo ?? "/acquista");
    // "gone" (410) richiederebbe un middleware: una pagina SSG non può restituire 410 da sola.
    // Ripiego onesto sul 404 (notFound) finché non si aggiunge il middleware — documentato.
    if (directive.kind === "gone") notFound();
  }

  const all = await getVisibleListings();
  const related = [
    ...all.filter((r) => r.slug !== p.slug && r.zone === p.zone),
    ...all.filter((r) => r.slug !== p.slug && r.zone !== p.zone),
  ].slice(0, 3);

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
      <PropertyDetail p={p} related={related} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
