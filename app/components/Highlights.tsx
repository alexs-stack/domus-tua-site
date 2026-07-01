import Reveal from "./Reveal";
import { Check } from "./Icons";

export default function Highlights({
  eyebrow,
  title,
  intro,
  items,
  tone = "cream",
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  items: { title: string; copy: string }[];
  tone?: "paper" | "cream";
}) {
  return (
    <section className={tone === "cream" ? "bg-cream" : "bg-paper"}>
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {title}
          </h2>
          {intro && <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-stone">{intro}</p>}
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 90}>
              <article className="group flex h-full flex-col rounded-[1.75rem] border border-line bg-paper p-7 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-red/40">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-soft text-red-dark">
                  <Check className="h-5 w-5" />
                </span>
                <h3 className="mt-6 font-display text-xl font-medium leading-snug tracking-tight text-ink">
                  {it.title}
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-stone">{it.copy}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
