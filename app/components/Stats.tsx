"use client";

import Reveal from "./Reveal";
import CountUp from "./CountUp";
import { site } from "./../lib/site";
import { useLocale } from "./i18n/LocaleProvider";

const years = new Date().getFullYear() - site.since;

type Stat = {
  labelKey: "years" | "rating" | "reviews" | "roots";
  count?: { value: number; decimals?: number; suffix?: string };
  text?: string;
};

const stats: Stat[] = [
  { count: { value: years, suffix: "+" }, labelKey: "years" },
  { count: { value: Number(site.rating), decimals: 1, suffix: "/5" }, labelKey: "rating" },
  { count: { value: Number.parseInt(site.reviewsCount, 10) || 500, suffix: "+" }, labelKey: "reviews" },
  { text: "Tradate", labelKey: "roots" },
];

const copy = {
  it: {
    labels: {
      years: "Anni di esperienza, dal 2007",
      rating: "Rating medio sulle recensioni",
      reviews: "Recensioni di clienti reali",
      roots: "Radici locali, provincia di Varese",
    },
    tokens: [
      "Valutazione professionale",
      "Documenti verificati",
      "Open Domus",
      "Home staging",
      "Rendering & virtual",
      "Emotional video",
      "Marketing immobiliare",
      "Assistenza fino al rogito",
    ],
  },
  en: {
    labels: {
      years: "Years of experience, since 2007",
      rating: "Average rating from reviews",
      reviews: "Reviews from real clients",
      roots: "Local roots, province of Varese",
    },
    tokens: [
      "Professional valuation",
      "Verified documents",
      "Open Domus",
      "Home staging",
      "Rendering & virtual tours",
      "Emotional video",
      "Real estate marketing",
      "Support through to closing",
    ],
  },
  fr: {
    labels: {
      years: "Années d'expérience, depuis 2007",
      rating: "Note moyenne des avis",
      reviews: "Avis de clients réels",
      roots: "Racines locales, province de Varese",
    },
    tokens: [
      "Estimation professionnelle",
      "Documents vérifiés",
      "Open Domus",
      "Home staging",
      "Rendu & visite virtuelle",
      "Vidéo émotionnelle",
      "Marketing immobilier",
      "Accompagnement jusqu'à l'acte",
    ],
  },
  de: {
    labels: {
      years: "Jahre Erfahrung, seit 2007",
      rating: "Durchschnittsbewertung der Rezensionen",
      reviews: "Bewertungen echter Kunden",
      roots: "Lokal verwurzelt, Provinz Varese",
    },
    tokens: [
      "Professionelle Bewertung",
      "Geprüfte Dokumente",
      "Open Domus",
      "Home Staging",
      "Rendering & virtuell",
      "Emotionales Video",
      "Immobilienmarketing",
      "Begleitung bis zum Notartermin",
    ],
  },
  es: {
    labels: {
      years: "Años de experiencia, desde 2007",
      rating: "Valoración media de las reseñas",
      reviews: "Reseñas de clientes reales",
      roots: "Raíces locales, provincia de Varese",
    },
    tokens: [
      "Tasación profesional",
      "Documentos verificados",
      "Open Domus",
      "Home staging",
      "Renderizado y virtual",
      "Vídeo emocional",
      "Marketing inmobiliario",
      "Asistencia hasta la escritura",
    ],
  },
};

export default function Stats() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section className="border-b border-line bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.labelKey} delay={i * 90}>
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
                  {c.labels[s.labelKey]}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Marquee di token di valore */}
      <div className="relative overflow-hidden border-t border-line py-5">
        <div className="marquee-track flex w-max gap-3">
          {[...c.tokens, ...c.tokens].map((t, i) => (
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
