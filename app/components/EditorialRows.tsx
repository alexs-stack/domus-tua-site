import Image from "next/image";
import Reveal from "./Reveal";

export type EditorialRow = {
  n: string;
  title: string;
  copy: string;
  image: string;
  alt: string;
};

export default function EditorialRows({
  id,
  eyebrow,
  title,
  intro,
  rows,
  tone = "paper",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  rows: EditorialRow[];
  tone?: "paper" | "cream";
}) {
  return (
    <section id={id} className={tone === "cream" ? "bg-cream" : "bg-paper"}>
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {title}
          </h2>
          {intro && <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-stone">{intro}</p>}
        </Reveal>

        <div className="mt-16 flex flex-col gap-16 sm:gap-24">
          {rows.map((r, i) => {
            const reversed = i % 2 === 1;
            return (
              <Reveal key={r.n}>
                <div
                  className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
                    reversed ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-line">
                    <Image
                      src={r.image}
                      alt={r.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 560px"
                      className="photo-warm object-cover"
                    />
                  </div>
                  <div className={reversed ? "lg:pr-6" : "lg:pl-6"}>
                    <span className="font-display text-5xl font-medium text-red/25">{r.n}</span>
                    <h3 className="mt-4 font-display text-[1.8rem] font-medium leading-[1.1] tracking-tight text-ink balance sm:text-[2.2rem]">
                      {r.title}
                    </h3>
                    <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-stone">{r.copy}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
