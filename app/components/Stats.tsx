import Reveal from "./Reveal";
import CountUp from "./CountUp";
import { site } from "./../lib/site";

const years = new Date().getFullYear() - site.since;

type Stat = {
  label: string;
  count?: { value: number; decimals?: number; suffix?: string };
  text?: string;
};

const stats: Stat[] = [
  { count: { value: years, suffix: "+" }, label: "Anni di esperienza, dal 2007" },
  { count: { value: Number(site.rating), decimals: 1, suffix: "/5" }, label: "Rating medio sulle recensioni" },
  { count: { value: 500, suffix: "+" }, label: "Recensioni di clienti reali" },
  { text: "Tradate", label: "Radici locali, provincia di Varese" },
];

const tokens = [
  "Valutazione professionale",
  "Documenti verificati",
  "Open Domus",
  "Home staging",
  "Rendering & virtual",
  "Emotional video",
  "Marketing immobiliare",
  "Assistenza fino al rogito",
];

export default function Stats() {
  return (
    <section className="border-b border-line bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="flex flex-col">
                <span className="font-display text-5xl font-medium tracking-tight text-ink sm:text-6xl">
                  {s.count ? (
                    <CountUp
                      value={s.count.value}
                      decimals={s.count.decimals}
                      suffix={s.count.suffix}
                    />
                  ) : (
                    s.text
                  )}
                </span>
                <span className="mt-3 max-w-[14rem] text-sm leading-snug text-stone">
                  {s.label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Marquee di token di valore */}
      <div className="relative overflow-hidden border-t border-line py-5">
        <div className="marquee-track flex w-max gap-3">
          {[...tokens, ...tokens].map((t, i) => (
            <span
              key={i}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-line bg-paper px-5 py-2 text-sm font-medium text-graphite"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red" />
              {t}
            </span>
          ))}
        </div>
        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-cream to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-cream to-transparent" />
      </div>
    </section>
  );
}
