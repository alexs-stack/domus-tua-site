import Reveal from "./Reveal";

export default function Highlights({
  eyebrow,
  title,
  intro,
  items,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  items: { title: string; copy: string }[];
  /** Conservata per i chiamanti: il fondo è uno solo (avorio) dal 2026-09-10. */
  tone?: "paper" | "cream";
}) {
  return (
    <section className="dt-chapter bg-cream">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-6 max-w-[20ch] font-display text-d1">{title}</h2>
          {intro && <p className="lead mt-8">{intro}</p>}
        </Reveal>

        {/* Lista editoriale numerata: righe asimmetriche separate da hairline,
            l'indice tabellare in rosso è l'unico accento (no card identiche). */}
        <ol className="mt-16 border-t border-line">
          {items.map((it, i) => (
            <Reveal
              as="li"
              key={it.title}
              delay={i * 45}
              className="group grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-b border-line py-8 sm:grid-cols-[7rem_1fr] sm:gap-x-10 sm:py-10 md:grid-cols-[10rem_1fr] md:gap-x-16"
            >
              <span className="tnum font-display text-d2 text-red">{String(i + 1).padStart(2, "0")}</span>
              <div className="max-w-[60ch] pt-1">
                <h3 className="font-display text-d3">{it.title}</h3>
                <p className="mt-4 text-body text-graphite">{it.copy}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
