import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WhatsAppFloat from "../../components/WhatsAppFloat";
import PropertyDetail from "./PropertyDetail";
import { getVisibleListings, getVisibleListing } from "../../lib/listings";

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
  return {
    title: `${p.title}, ${p.zone}`,
    description: p.excerpt,
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

  return (
    <>
      <Header />
      <PropertyDetail p={p} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
