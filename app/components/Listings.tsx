import Reveal from "./Reveal";
import PropertyCard from "./PropertyCard";
import ListingsHeader from "./ListingsHeader";
import { getFeaturedListings } from "../lib/listings";

export default async function Listings() {
  // Solo immobili DISPONIBILI, ordinati (featured → recenti → immagini forti). Mai venduti.
  const featured = await getFeaturedListings(3);
  return (
    <section id="case" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <ListingsHeader />

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
