import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WhatsAppFloat from "../../components/WhatsAppFloat";
import PropertyDetail from "./PropertyDetail";
import { getVisibleListings, getVisibleListing } from "../../lib/listings";
import { site } from "../../lib/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.domustua.com";

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
  return {
    title: `${p.title}, ${p.zone}`,
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
  const p = await getVisibleListing(slug);
  if (!p) notFound();

  const all = await getVisibleListings();
  const related = [
    ...all.filter((r) => r.slug !== p.slug && r.zone === p.zone),
    ...all.filter((r) => r.slug !== p.slug && r.zone !== p.zone),
  ].slice(0, 3);

  // Dati strutturati per l'immobile (schema.org). Offer inclusa solo con prezzo numerico
  // valido (> 0), come richiesto per i Rich Results Google.
  const url = `${siteUrl}/case/${p.slug}`;
  const image = p.cover.startsWith("http") ? p.cover : `${siteUrl}${p.cover}`;
  const hasPrice = Number.isFinite(p.priceValue) && p.priceValue > 0;

  const residenceJsonLd = {
    "@context": "https://schema.org",
    "@type": ["Product", "Residence"],
    name: p.title,
    description: p.excerpt,
    image,
    url,
    category: p.type,
    areaServed: p.zone,
    address: {
      "@type": "PostalAddress",
      addressLocality: p.zone,
      addressRegion: site.address.province,
      addressCountry: "IT",
    },
    ...(hasPrice
      ? {
          offers: {
            "@type": "Offer",
            price: p.priceValue,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Case", item: `${siteUrl}/case` },
      { "@type": "ListItem", position: 3, name: p.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(residenceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <PropertyDetail p={p} related={related} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
