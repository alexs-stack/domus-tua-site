import Image from "next/image";
import { ArrowUpRight, Bed, Ruler, Rooms } from "./Icons";
import Badge from "./primitives/Badge";
import type { Property } from "../lib/properties";

export default function PropertyCard({ p }: { p: Property }) {
  return (
    <a
      href={`/case/${p.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-line bg-paper transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:shadow-[0_44px_80px_-52px_rgba(26,24,22,0.55)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={p.cover}
          alt={p.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {p.badges.map((b) => (
            <Badge key={b} variant="onImage">
              {b}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-red">{p.zone}</p>
        <h3 className="mt-2 font-display text-2xl font-medium leading-tight tracking-tight text-ink">
          {p.title}
        </h3>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem] text-stone">
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="h-4 w-4 text-graphite" /> {p.sqm}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Rooms className="h-4 w-4 text-graphite" /> {p.rooms}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-graphite" /> {p.beds}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-5">
          <span className="tnum font-display text-2xl font-medium text-ink">{p.price}</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-deep text-ink transition-all duration-300 group-hover:bg-red group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </a>
  );
}
