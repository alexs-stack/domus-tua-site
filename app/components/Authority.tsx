"use client";

import Reveal from "./Reveal";
import { Star, Google, ArrowUpRight, Play } from "./Icons";
import { site } from "../lib/site";
import { useLocale } from "./i18n/LocaleProvider";

const years = new Date().getFullYear() - site.since;

const copy = {
  it: {
    eyebrow: "La reputazione che conta",
    heading: site.authority,
    subLead: `Da oltre ${years} anni cresciamo insieme, con te, in professionalità, innovazione e integrità. Non lo diciamo noi: lo raccontano centinaia di famiglie del territorio.`,
    ctaReviews: "Leggi le recensioni su Google",
    ctaVideo: "Guarda le video recensioni",
    reviewsSuffix: `su ${site.reviewsCount} recensioni`,
    verifiedPre: "Valutazione verificata su ",
    verifiedMid: " e ",
    statYears: "anni",
    statReviews: "recensioni",
    statRating: "rating medio",
  },
  en: {
    eyebrow: "The reputation that matters",
    heading: "Among the most-reviewed independent real estate agencies in the province of Varese.",
    subLead: `For over ${years} years we've been growing together, with you, in professionalism, innovation and integrity. Don't take our word for it: hundreds of local families tell the story.`,
    ctaReviews: "Read the reviews on Google",
    ctaVideo: "Watch the video reviews",
    reviewsSuffix: `from ${site.reviewsCount} reviews`,
    verifiedPre: "Rating verified on ",
    verifiedMid: " and ",
    statYears: "years",
    statReviews: "reviews",
    statRating: "average rating",
  },
  fr: {
    eyebrow: "La réputation qui compte",
    heading: "Parmi les agences immobilières indépendantes les plus commentées de la province de Varese.",
    subLead: `Depuis plus de ${years} ans, nous grandissons ensemble, avec vous, dans le professionnalisme, l'innovation et l'intégrité. Ce n'est pas nous qui le disons : ce sont des centaines de familles de la région qui en témoignent.`,
    ctaReviews: "Lire les avis sur Google",
    ctaVideo: "Voir les avis en vidéo",
    reviewsSuffix: `sur ${site.reviewsCount} avis`,
    verifiedPre: "Évaluation vérifiée sur ",
    verifiedMid: " et ",
    statYears: "ans",
    statReviews: "avis",
    statRating: "note moyenne",
  },
  de: {
    eyebrow: "Die Reputation, die zählt",
    heading: "Eine der meistbewerteten unabhängigen Immobilienagenturen in der Provinz Varese.",
    subLead: `Seit über ${years} Jahren wachsen wir gemeinsam mit Ihnen – in Professionalität, Innovation und Integrität. Das sagen nicht wir: Hunderte Familien aus der Region erzählen davon.`,
    ctaReviews: "Bewertungen auf Google lesen",
    ctaVideo: "Video-Bewertungen ansehen",
    reviewsSuffix: `aus ${site.reviewsCount} Bewertungen`,
    verifiedPre: "Bewertung verifiziert auf ",
    verifiedMid: " und ",
    statYears: "Jahre",
    statReviews: "Bewertungen",
    statRating: "Durchschnittsnote",
  },
  es: {
    eyebrow: "La reputación que cuenta",
    heading: "Entre las agencias inmobiliarias independientes más reseñadas de la provincia de Varese.",
    subLead: `Desde hace más de ${years} años crecemos juntos, contigo, en profesionalidad, innovación e integridad. No lo decimos nosotros: lo cuentan cientos de familias del territorio.`,
    ctaReviews: "Lee las reseñas en Google",
    ctaVideo: "Mira las videorreseñas",
    reviewsSuffix: `de ${site.reviewsCount} reseñas`,
    verifiedPre: "Valoración verificada en ",
    verifiedMid: " y ",
    statYears: "años",
    statReviews: "reseñas",
    statRating: "valoración media",
  },
} as const;

export default function Authority() {
  const { locale } = useLocale();
  const c = copy[locale];

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
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white">
              {c.eyebrow}
            </span>
            <h2 className="mt-6 font-display text-4xl font-medium leading-[1.06] tracking-tight balance sm:text-5xl lg:text-[3.4rem]">
              {c.heading}
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
              {c.subLead}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={site.googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white py-3.5 pl-6 pr-3 text-sm font-semibold text-red transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-cream active:scale-[0.98]"
              >
                {c.ctaReviews}
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
                {c.ctaVideo}
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
                    {c.reviewsSuffix}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-cream px-4 py-3.5">
                <Google className="h-6 w-6 shrink-0" />
                <p className="text-sm leading-snug text-graphite">
                  {c.verifiedPre}<span className="font-semibold text-ink">Google</span>{c.verifiedMid}
                  Trustindex
                </p>
              </div>

              <ul className="mt-6 grid grid-cols-3 gap-2 text-center sm:gap-3">
                {[
                  { v: `${years}+`, l: c.statYears },
                  { v: site.reviewsCount, l: c.statReviews },
                  { v: site.rating, l: c.statRating },
                ].map((s) => (
                  <li key={s.l} className="rounded-2xl bg-cream-deep px-2 py-4">
                    <span className="tnum block font-display text-xl font-medium text-red sm:text-2xl">
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
