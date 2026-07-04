"use client";

import Reveal from "./Reveal";
import CountUp from "./CountUp";
import { useLocale } from "./i18n/LocaleProvider";

type Stat = {
  labelKey: "people" | "deals" | "sold" | "valued";
  count?: { value: number; decimals?: number; suffix?: string };
  text?: string;
};

const stats: Stat[] = [
  { count: { value: 6433 }, labelKey: "people" },
  { count: { value: 1523 }, labelKey: "deals" },
  { count: { value: 92, suffix: "%" }, labelKey: "sold" },
  { count: { value: 269395 }, labelKey: "valued" },
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
                      group
                      locale={intlLocale[locale]}
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
