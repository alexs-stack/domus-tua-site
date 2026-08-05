"use client";

// Blocco FAQ compatto, in coda a /vendi e /acquista.
//
// PERCHÉ ESISTE, VISTO CHE C'È GIÀ UNA PAGINA
// Chi ha appena finito di leggere come si vende non va a cercare una pagina di domande:
// ha la domanda ADESSO. Qui trova le quattro che riguardano il percorso appena letto —
// stesso testo della pagina, non una variante — e il rimando alle altre.
//
// Nessun JSON-LD qui: lo schema FAQPage vive solo su /domande-frequenti. Ripeterlo su tre
// pagine significherebbe dichiarare tre FAQ diverse per lo stesso contenuto, che per le
// linee guida di Google è markup ingannevole.

import Link from "next/link";
import FaqList from "./FaqList";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import { ArrowRight } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { faqPick, type FaqEntryId } from "../domande-frequenti/faq";
import type { Locale } from "../lib/i18n/dictionaries";

const copy: Record<Locale, { eyebrow: string; title: string; all: string }> = {
  it: {
    eyebrow: "Domande frequenti",
    title: "Le domande che ci fanno più spesso.",
    all: "Tutte le domande frequenti",
  },
  en: {
    eyebrow: "Frequently asked",
    title: "The questions we hear most often.",
    all: "All frequently asked questions",
  },
  fr: {
    eyebrow: "Questions fréquentes",
    title: "Les questions qu'on nous pose le plus.",
    all: "Toutes les questions fréquentes",
  },
  de: {
    eyebrow: "Häufige Fragen",
    title: "Die Fragen, die uns am häufigsten erreichen.",
    all: "Alle häufigen Fragen",
  },
  es: {
    eyebrow: "Preguntas frecuentes",
    title: "Las preguntas que más nos hacen.",
    all: "Todas las preguntas frecuentes",
  },
};

export default function FaqTeaser({
  ids,
  surface = "paper",
}: {
  ids: readonly FaqEntryId[];
  /** La banda su cui poggia il blocco, per non sovrapporre due superfici uguali. */
  surface?: "paper" | "cream";
}) {
  const { locale } = useLocale();
  const c = copy[locale];
  const entries = faqPick(locale, ids);
  if (entries.length === 0) return null;

  return (
    <section className={surface === "cream" ? "relative bg-cream" : "relative bg-paper"}>
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            <TextLines
              as="h2"
              className="mt-5 font-display text-3xl font-medium leading-[1.06] tracking-tight text-ink balance sm:text-[2.4rem]"
            >
              {c.title}
            </TextLines>
            <Reveal delay={140}>
              <Link
                href="/domande-frequenti"
                className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
              >
                {c.all}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <FaqList entries={entries} />
        </div>
      </div>
    </section>
  );
}
