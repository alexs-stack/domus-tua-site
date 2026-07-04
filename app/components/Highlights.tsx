import Reveal from "./Reveal";
import { SegnoDomus } from "./BrandMotif";

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

        {/* Lista editoriale numerata: righe asimmetriche separate da hairline,
            l'indice tabellare in rosso è l'unico accento (no card identiche). */}
        <ol className="mt-14 border-t border-line sm:mt-16">
          {items.map((it, i) => (
            <Reveal
              as="li"
              key={it.title}
              delay={i * 90}
              className="group grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-b border-line py-8 sm:grid-cols-[7rem_1fr] sm:gap-x-10 sm:py-10 md:grid-cols-[10rem_1fr] md:gap-x-16"
            >
              <div className="flex flex-col items-start gap-3">
                <SegnoDomus
                  className="h-4 w-11 opacity-70 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100"
                  embrace={false}
                />
                <span className="tnum font-display text-3xl font-medium leading-none text-red sm:text-4xl md:text-5xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="max-w-xl pt-0.5">
                <h3 className="font-display text-xl font-medium leading-snug tracking-tight text-ink sm:text-2xl">
                  {it.title}
                </h3>
                <p className="mt-2.5 text-[0.98rem] leading-relaxed text-stone">{it.copy}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
