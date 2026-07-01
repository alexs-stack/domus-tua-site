import Reveal from "./Reveal";
import { SegnoDomus } from "./BrandMotif";
import { Check, ArrowUpRight, Star } from "./Icons";

// Domus D.O.C. — protocollo di fiducia proprietario.
// NB: la formulazione tecnico/legale definitiva va approvata dal cliente.
const pillars = [
  { t: "Verifica documentale", d: "Titoli, conformità e documenti controllati prima di mettere in vendita." },
  { t: "Trasparenza pre-visita", d: "Le informazioni che contano disponibili già prima di entrare in casa." },
  { t: "Immobile preparato", d: "Spazi valorizzati e raccontati con materiali professionali." },
  { t: "Meno sorprese al rogito", d: "Un percorso ordinato che riduce imprevisti e tempi morti." },
];

export default function DomusDocProtocol({
  tone = "cream",
  id = "domus-doc",
}: {
  tone?: "cream" | "paper" | "cream-deep";
  id?: string;
}) {
  const bg = tone === "paper" ? "bg-paper" : tone === "cream-deep" ? "bg-cream-deep" : "bg-cream";
  return (
    <section id={id} className={bg}>
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.2rem] border border-line bg-paper p-8 shadow-[0_50px_100px_-70px_rgba(26,24,22,0.6)] sm:p-12">
            {/* watermark motif */}
            <span className="pointer-events-none absolute -right-6 -top-6 opacity-[0.06]" aria-hidden>
              <SegnoDomus className="h-40 w-72" embrace={false} />
            </span>

            <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              {/* Intro */}
              <div>
                <span className="eyebrow">Protocollo proprietario</span>
                <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-[3rem]">
                  Domus D.O.C.
                </h2>
                <p className="mt-1 font-display text-lg text-red-dark">Domus di Origine Certificata</p>
                <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">
                  Non una promessa, ma un metodo verificabile: prepariamo, controlliamo e rendiamo
                  chiaro ogni passaggio, così vendere è più sereno e acquistare è più sicuro.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-cream p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-red-dark">
                      Per chi vende
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-graphite">
                      Un immobile pronto, documentato e credibile: più fiducia, proposte più
                      qualificate.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-cream p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-red-dark">
                      Per chi acquista
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-graphite">
                      Più informazioni e meno sorprese: si visita e si sceglie con consapevolezza.
                    </p>
                  </div>
                </div>

                <a
                  href="/metodo"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
                >
                  Scopri il protocollo
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
              </div>

              {/* Pilastri */}
              <ul className="flex flex-col gap-3">
                {pillars.map((p, i) => (
                  <li
                    key={p.t}
                    className="flex items-start gap-4 rounded-2xl border border-line bg-cream p-5 transition-colors duration-300 hover:border-red/30"
                  >
                    <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-soft font-display text-sm font-semibold text-red-dark">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-red-dark" />
                        <p className="font-display text-lg font-medium text-ink">{p.t}</p>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-stone">{p.d}</p>
                    </div>
                  </li>
                ))}
                <li className="mt-1 flex items-center gap-2 pl-1 text-[0.8rem] text-stone">
                  <Star className="h-3.5 w-3.5 text-red" />
                  Protocollo applicato a ogni incarico Domus Tua.
                </li>
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
