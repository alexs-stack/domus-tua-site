"use client";

import { useRef } from "react";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import CountUp from "./CountUp";
import Parallax from "./motion/Parallax";
import { Star, Google, ArrowUpRight, Play } from "./Icons";
import { site } from "../lib/site";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";

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

  // Card rating: un'unica timeline all'ingresso — le stelle poppano, poi le
  // tre mini-stat risalgono. Il CountUp resta com'è (parte dal suo IO).
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const ratingRef = useRef<HTMLSpanElement | null>(null);
  const starsRef = useRef<HTMLSpanElement | null>(null);
  const statsRef = useRef<HTMLUListElement | null>(null);
  useGSAP(
    () => {
      const card = cardRef.current;
      if (!card) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const tl = gsap.timeline({
          // Replay a ogni passaggio: restart all'ingresso, reverse risalendo
          // (niente clearProps: la timeline resta riavvolgibile).
          scrollTrigger: { trigger: card, start: "top 82%", toggleActions: "restart none none reverse" },
        });
        if (starsRef.current) {
          tl.fromTo(
            starsRef.current.children,
            { scale: 0.6, transformOrigin: "50% 50%" },
            {
              scale: 1,
              duration: 0.5,
              ease: "back.out(1.6)",
              stagger: 0.06,
            },
            0
          );
        }
        if (statsRef.current) {
          tl.fromTo(
            statsRef.current.children,
            { y: 14, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: "expo.out",
              stagger: 0.1,
            },
            0.35
          );
        }
        // Profondità: il 4.9 cresce appena in scrub lungo la sezione. La card
        // vive già dentro Parallax (nessuno sticky): il transform è sicuro.
        if (ratingRef.current && sectionRef.current) {
          gsap.set(ratingRef.current, { willChange: "transform" });
          gsap.fromTo(
            ratingRef.current,
            { scale: 1, transformOrigin: "left center" },
            {
              scale: 1.05,
              ease: "none",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }
      });
    },
    { scope: cardRef }
  );

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-red text-white">
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
          {/* Reveal spezzato in due: il titolo TextLines resta nudo (niente doppio-hide) */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white">
                {c.eyebrow}
              </span>
            </Reveal>
            <TextLines
              as="h2"
              className="mt-6 font-display text-4xl font-medium leading-[1.06] tracking-tight balance sm:text-5xl lg:text-[3.4rem]"
            >
              {c.heading}
            </TextLines>
            <Reveal delay={100}>
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
          </div>

          {/* Card rating — deriva leggera contro la colonna testo (solo desktop).
              Resta desktop anche dopo la parità mobile, ed è una scelta: la
              deriva ha senso finché la card sta ACCANTO alla colonna di testo e
              le scorre contro. Sotto lg la griglia diventa una colonna sola, la
              card va sotto il testo, e non resta nessuna controparte — solo un
              blocco di cifre (il 4.9, le tre mini-stat) che si muove mentre lo
              si legge. La profondità qui la fanno già lo scrub sul 4.9 e la
              timeline delle stelle, che sono ungated e girano sul telefono. */}
          <Reveal delay={120}>
            <Parallax speed={-0.06}>
              <div ref={cardRef} className="rounded-[2rem] bg-white p-7 text-ink shadow-[0_40px_90px_-50px_rgba(80,4,4,0.9)] sm:p-9">
                <div className="flex items-center gap-4">
                  {/* Wrapper: è lui a scalare in scrub, non lo span di CountUp. */}
                  <span ref={ratingRef} className="inline-block leading-none">
                    <CountUp
                      value={parseFloat(site.rating)}
                      decimals={1}
                      className="font-display text-7xl font-medium leading-none text-ink"
                    />
                  </span>
                  <div>
                    <span ref={starsRef} className="flex gap-1">
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

                <ul ref={statsRef} className="mt-6 grid grid-cols-3 gap-2 text-center sm:gap-3">
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
            </Parallax>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
