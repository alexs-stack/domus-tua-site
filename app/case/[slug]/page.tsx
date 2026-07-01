import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WhatsAppFloat from "../../components/WhatsAppFloat";
import PropertyGallery from "../../components/PropertyGallery";
import Contact from "../../components/Contact";
import { ArrowRight, ArrowUpRight, Check, Whatsapp } from "../../components/Icons";
import { getVisibleListings, getVisibleListing } from "../../lib/listings";
import { site } from "../../lib/site";

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

  const specs = [
    { label: "Superficie", value: p.sqm },
    { label: "Locali", value: p.rooms },
    { label: "Camere", value: p.beds },
    { label: "Bagni", value: p.baths },
    { label: "Tipologia", value: p.type },
    { label: "Stato", value: p.status },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 pt-32 sm:px-8 sm:pt-36">
          {/* Breadcrumb */}
          <Link
            href="/case"
            className="group inline-flex items-center gap-2 text-sm font-medium text-stone transition-colors hover:text-ink"
          >
            <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:-translate-x-1" />
            Tutte le case
          </Link>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-red">
                {p.zone}
              </p>
              <h1 className="mt-2 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
                {p.title}
              </h1>
            </div>
            <span className="tnum font-display text-4xl font-medium text-ink">{p.price}</span>
          </div>

          <div className="mt-8">
            <PropertyGallery images={p.gallery} title={p.title} />
          </div>
        </div>

        {/* Content + sticky card */}
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr] lg:gap-16">
            <div>
              <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                Descrizione
              </h2>
              <div className="mt-4 flex flex-col gap-4 text-[1rem] leading-relaxed text-graphite">
                {p.description.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <h2 className="mt-12 font-display text-2xl font-medium tracking-tight text-ink">
                Caratteristiche
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[0.95rem] text-graphite">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sticky card */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-line bg-cream p-7">
                <div className="flex flex-wrap gap-2">
                  {p.badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-full bg-paper px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-graphite"
                    >
                      {b}
                    </span>
                  ))}
                </div>

                <p className="tnum mt-5 font-display text-3xl font-medium text-ink">{p.price}</p>

                <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-6">
                  {specs.map((s) => (
                    <div key={s.label}>
                      <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-stone">
                        {s.label}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-ink">{s.value}</dd>
                    </div>
                  ))}
                </dl>

                <a
                  href="#contatti"
                  className="group mt-7 flex items-center justify-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
                >
                  Richiedi una visita
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
                <a
                  href={site.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-full border border-line bg-paper py-3.5 text-sm font-semibold text-ink transition-colors hover:border-red hover:text-red"
                >
                  <Whatsapp className="h-5 w-5 text-red" /> Scrivici su WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </div>

        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
