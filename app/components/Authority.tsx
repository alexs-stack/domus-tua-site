import Reveal from "./Reveal";
import { Star, Google, ArrowUpRight, Play } from "./Icons";
import { site } from "../lib/site";

const years = new Date().getFullYear() - site.since;

export default function Authority() {
  return (
    <section className="relative overflow-hidden bg-red text-white">
      {/* profondità calda */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(120% 90% at 85% 0%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(100% 80% at 0% 100%, rgba(120,5,5,0.55), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white">
              La reputazione che conta
            </span>
            <h2 className="mt-6 font-display text-4xl font-medium leading-[1.06] tracking-tight balance sm:text-5xl lg:text-[3.4rem]">
              {site.authority}
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
              Da oltre {years} anni cresciamo insieme, con te, in professionalità, innovazione e
              integrità. Non lo diciamo noi: lo raccontano centinaia di famiglie del territorio.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={site.googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white py-3.5 pl-6 pr-3 text-sm font-semibold text-red transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-cream active:scale-[0.98]"
              >
                Leggi le recensioni su Google
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red/10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
              <a
                href={site.social.youtube.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-white/35 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <Play className="h-3.5 w-3.5" />
                </span>
                Guarda le video recensioni
              </a>
            </div>
          </Reveal>

          {/* Card rating */}
          <Reveal delay={120}>
            <div className="rounded-[2rem] bg-white p-7 text-ink shadow-[0_40px_90px_-50px_rgba(80,4,4,0.9)] sm:p-9">
              <div className="flex items-center gap-4">
                <span className="tnum font-display text-7xl font-medium leading-none text-ink">
                  {site.rating}
                </span>
                <div>
                  <span className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-red" />
                    ))}
                  </span>
                  <p className="mt-1.5 text-sm font-semibold text-graphite">
                    su {site.reviewsCount} recensioni
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-cream px-4 py-3.5">
                <Google className="h-6 w-6 shrink-0" />
                <p className="text-sm leading-snug text-graphite">
                  Valutazione verificata su <span className="font-semibold text-ink">Google</span> e
                  Trustindex
                </p>
              </div>

              <ul className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { v: `${years}+`, l: "anni" },
                  { v: site.reviewsCount, l: "recensioni" },
                  { v: "#1", l: "in provincia" },
                ].map((s) => (
                  <li key={s.l} className="rounded-2xl bg-cream-deep px-2 py-4">
                    <span className="tnum block font-display text-2xl font-medium text-red">
                      {s.v}
                    </span>
                    <span className="mt-1 block text-[0.72rem] uppercase tracking-wide text-stone">
                      {s.l}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
