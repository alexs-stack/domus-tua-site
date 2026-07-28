import PropertyCard from "./PropertyCard";
import ListingsHeader from "./ListingsHeader";
import ListingsGrid from "./ListingsGrid";
import { getVisibleListings } from "../lib/listings";

export default async function Listings() {
  const featured = (await getVisibleListings()).slice(0, 3);
  return (
    <section id="case" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <ListingsHeader />

        {/* Le card sono figli diretti della griglia: entrano in batch (GSAP). */}
        <ListingsGrid className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.slug} p={p} />
          ))}
        </ListingsGrid>
      </div>
    </section>
  );
}
