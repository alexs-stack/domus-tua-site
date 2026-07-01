import Reveal from "./Reveal";
import { ArrowRight } from "./Icons";
import PropertyCard from "./PropertyCard";
import { getVisibleListings } from "../lib/listings";

export default async function Listings() {
  const featured = (await getVisibleListings()).slice(0, 3);
  return (
    <section id="case" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">Case in evidenza</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              Case selezionate, raccontate con cura.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <a href="/case" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink">
              Vedi tutte le case
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <Reveal key={p.slug} delay={i * 100}>
              <PropertyCard p={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
