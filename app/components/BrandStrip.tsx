"use client";

// BrandStrip — striscia cinetica in outline coi nomi propri del brand
// (identici in ogni lingua → nessun problema i18n). Decorativa (aria-hidden):
// riempie i "vuoti" tra sezioni con tipografia in movimento, reattiva alla
// velocità di scroll via VelocityMarquee (timeScale + skew già integrati).
import VelocityMarquee from "./motion/VelocityMarquee";

const ITEMS = ["Open Domus", "Domus D.O.C.", "Metodo Domus Tua", "Tradate · Varese"];

export default function BrandStrip({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`overflow-hidden py-10 sm:py-14 ${className}`}>
      <VelocityMarquee trackClassName="items-baseline">
        {ITEMS.map((t) => (
          <span
            key={t}
            className="whitespace-nowrap pr-[0.9em] font-display text-[9vw] font-medium italic leading-none text-transparent sm:text-[5.5vw]"
            style={{ WebkitTextStroke: "1px rgba(210, 10, 10, 0.28)" }}
          >
            {t}
            <span className="ml-[0.9em] inline-block h-[0.1em] w-[0.1em] rounded-full bg-red/25 align-middle" />
          </span>
        ))}
      </VelocityMarquee>
    </div>
  );
}
