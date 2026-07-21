"use client";

import Reveal from "./Reveal";
import { SegnoDomus } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";

// Sezione "capacità": SOLO contenuto qualitativo e verificabile — i servizi che eroghiamo.
//
// ⚠️ Le metriche numeriche "vanity" precedenti (mq valutati, persone felici, transazioni, %
//    venduto) erano INVENTATE/non verificate: rimosse. La prova numerica REALE (rating,
//    recensioni, anni di attività) vive in Authority, da un'unica fonte (site.ts): non si
//    duplica qui. Vedi docs/content-replacement-checklist.md.

const copy = {
  it: {
    eyebrow: "Il metodo, in concreto",
    lead: "Un unico percorso curato in ogni dettaglio: dalla valutazione ai documenti verificati, dal marketing all'Open Domus, fino all'assistenza al rogito.",
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
    eyebrow: "The method, in practice",
    lead: "A single journey cared for in every detail: from valuation to verified documents, from marketing to Open Domus, all the way to support through closing.",
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
    eyebrow: "La méthode, concrètement",
    lead: "Un seul parcours soigné dans les moindres détails : de l'estimation aux documents vérifiés, du marketing à l'Open Domus, jusqu'à l'accompagnement à l'acte.",
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
    eyebrow: "Die Methode, konkret",
    lead: "Ein einziger, in jedem Detail betreuter Weg: von der Bewertung über geprüfte Dokumente und Marketing bis zum Open Domus und der Begleitung zum Notartermin.",
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
    eyebrow: "El método, en concreto",
    lead: "Un único recorrido cuidado en cada detalle: de la tasación a los documentos verificados, del marketing al Open Domus, hasta la asistencia a la escritura.",
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
        <Reveal className="max-w-2xl">
          <span className="eyebrow gap-3">
            <SegnoDomus className="h-3.5 w-9" embrace={false} />
            {c.eyebrow}
          </span>
          <p className="mt-5 font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-[2rem]">
            {c.lead}
          </p>
        </Reveal>
      </div>

      {/* Marquee di token di valore (servizi reali, nessun numero non verificato) */}
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
