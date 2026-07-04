"use client";

import Reveal from "./Reveal";
import CountUp from "./CountUp";
import { SegnoDomus } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";

type Stat = {
  labelKey: "people" | "deals" | "sold" | "valued";
  count: { value: number; decimals?: number; suffix?: string };
};

/** La cifra maggiore fa da stat "eroe"; le altre tre stanno in una riga secondaria. */
const heroStat: Stat = { count: { value: 269395 }, labelKey: "valued" };
const secondaryStats: Stat[] = [
  { count: { value: 6433 }, labelKey: "people" },
  { count: { value: 1523 }, labelKey: "deals" },
  { count: { value: 92, suffix: "%" }, labelKey: "sold" },
];

/** Locale del sito → BCP-47 per il raggruppamento delle migliaia (269395 → "269.395"). */
const intlLocale: Record<string, string> = {
  it: "it-IT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
};

const copy = {
  it: {
    eyebrow: "I numeri di Domus Tua",
    labels: {
      people: "Persone felici",
      deals: "Transazioni concluse",
      sold: "Immobili venduti",
      valued: "Mq valutati",
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
    eyebrow: "The Domus Tua numbers",
    labels: {
      people: "Happy people",
      deals: "Deals closed",
      sold: "Properties sold",
      valued: "Sq m appraised",
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
    eyebrow: "Les chiffres de Domus Tua",
    labels: {
      people: "Personnes satisfaites",
      deals: "Transactions conclues",
      sold: "Biens vendus",
      valued: "M² estimés",
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
    eyebrow: "Die Zahlen von Domus Tua",
    labels: {
      people: "Zufriedene Menschen",
      deals: "Abgeschlossene Transaktionen",
      sold: "Verkaufte Immobilien",
      valued: "Bewertete m²",
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
    eyebrow: "Los números de Domus Tua",
    labels: {
      people: "Personas felices",
      deals: "Transacciones cerradas",
      sold: "Inmuebles vendidos",
      valued: "M² tasados",
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
        <div className="lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-x-16">
          {/* Stat eroe: la cifra maggiore, con eyebrow e Segno Domus come accento minimo */}
          <Reveal>
            <div className="flex flex-col">
              <span className="eyebrow eyebrow--center gap-3">
                <SegnoDomus className="h-3.5 w-9" embrace={false} />
                {c.eyebrow}
              </span>
              <span className="mt-5 font-display text-[3.4rem] font-medium leading-none tracking-tight text-ink sm:text-7xl lg:text-[5.5rem]">
                <CountUp
                  value={heroStat.count.value}
                  decimals={heroStat.count.decimals}
                  suffix={heroStat.count.suffix}
                  group
                  locale={intlLocale[locale]}
                />
              </span>
              <span className="mt-3 text-sm leading-snug text-stone">
                {c.labels[heroStat.labelKey]}
              </span>
            </div>
          </Reveal>

          {/* Divisore tra eroe e riga secondaria (hairline su mobile/tablet, bordo verticale su desktop) */}
          <div className="hairline my-9 lg:hidden" />

          {/* Riga secondaria: tre cifre inline separate da divisori hairline */}
          <div className="grid grid-cols-3 lg:border-l lg:border-line lg:pl-16">
            {secondaryStats.map((s, i) => (
              <Reveal
                key={s.labelKey}
                delay={90 + i * 90}
                className={
                  i > 0
                    ? "border-l border-line pl-4 sm:pl-6"
                    : "pr-4 sm:pr-6"
                }
              >
                <div className="flex flex-col">
                  <span className="font-display text-3xl font-medium leading-none tracking-tight text-ink sm:text-4xl lg:text-5xl">
                    <CountUp
                      value={s.count.value}
                      decimals={s.count.decimals}
                      suffix={s.count.suffix}
                      group
                      locale={intlLocale[locale]}
                    />
                  </span>
                  <span className="mt-2.5 text-xs leading-snug text-stone sm:text-sm">
                    {c.labels[s.labelKey]}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
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
