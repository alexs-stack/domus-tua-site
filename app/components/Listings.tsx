import PropertyCard from "./PropertyCard";
import ListingsHeader from "./ListingsHeader";
import ListingsGrid from "./ListingsGrid";
import Atmosphere from "./motion/Atmosphere";
import CameraIn from "./motion/CameraIn";
import { getVisibleListings } from "../lib/listings";

export default async function Listings() {
  const featured = (await getVisibleListings()).slice(0, 3);
  return (
    <section id="case" className="relative bg-cream">
      {/* Aria: il luogo in filigrana (nome proprio, identico in ogni lingua) */}
      <Atmosphere word="Tradate" glow drift={-1} wordClassName="right-[3%] top-[3%] text-[14vw]" />
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <ListingsHeader />

        {/* Camera dolly d'ingresso + card in batch (GSAP). */}
        <CameraIn>
          <ListingsGrid className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard key={p.slug} p={p} />
            ))}
          </ListingsGrid>
        </CameraIn>
      </div>
    </section>
  );
}
