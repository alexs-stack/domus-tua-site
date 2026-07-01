import Reveal from "./Reveal";
import PropertyCard from "./PropertyCard";
import ListingsHeader from "./ListingsHeader";
import { getVisibleListings } from "../lib/listings";

export default async function Listings() {
  const featured = (await getVisibleListings()).slice(0, 3);
  return (
    <section id="case" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
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
