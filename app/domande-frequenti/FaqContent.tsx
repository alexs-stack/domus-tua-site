"use client";

// Pagina delle domande frequenti — la casa canonica della FAQ del sito.
//
// COLLOCAZIONE (decisa con il cliente, motivata in docs/plan-sprint.md)
// Una pagina dedicata porta lo schema FAQPage in un posto solo e dà un indirizzo alle
// domande ("te lo mando", "guarda qui"). I blocchi compatti in coda a /vendi e /acquista
// intercettano invece chi la domanda ce l'ha già, mentre legge — e rimandano qui.
//
// Il contenuto vive tutto in ./faq.ts: qui c'è solo la composizione.
// Motion di casa: occhiello in Reveal, titolo in TextLines, colonna d'indice appiccicata
// che accompagna la lettura, elenchi in stagger.

import Link from "next/link";
import PageHero from "../components/PageHero";
import Reveal from "../components/Reveal";
import FaqList from "../components/FaqList";
import Contact from "../components/Contact";
import TextLines from "../components/motion/TextLines";
import { SegnoDomusDivider } from "../components/BrandMotif";
import { ArrowRight } from "../components/Icons";
import { Cta } from "../components/primitives/Cta";
import { useLocale } from "../components/i18n/LocaleProvider";
import { site } from "../lib/site";
import { faq } from "./faq";
import type { Locale } from "../lib/i18n/dictionaries";

type Copy = {
  heroEyebrow: string;
  heroTitle: () => React.ReactNode;
  heroSubcopy: string;
  heroAlt: string;
  heroPrimary: string;
  heroSecondary: string;
  indexLabel: string;
  restEyebrow: string;
  restTitle: string;
  restCopy: string;
  restCta: string;
  linkOpenDomus: string;
  linkMetodo: string;
};

const copy: Record<Locale, Copy> = {
  it: {
    heroEyebrow: "Domande frequenti",
    heroTitle: () => (
      <>
        Le risposte,
        <br />
        <span className="text-red-soft">prima delle domande.</span>
      </>
    ),
    heroSubcopy:
      "Quello che ci chiedono più spesso chi vende e chi compra casa a Tradate e in provincia di Varese. Se la tua domanda non è qui, chiedicela: rispondiamo noi.",
    heroAlt: "Raffaela Rizza con una cliente nella sede Domus Tua di Tradate",
    heroPrimary: "Fai la tua domanda",
    heroSecondary: "Vai alle risposte",
    indexLabel: "In questa pagina",
    restEyebrow: "Non hai trovato la risposta?",
    restTitle: "Chiedicelo e basta.",
    restCopy: `Una domanda specifica sulla tua casa merita una risposta specifica, non un paragrafo generico. Scrivici o chiamaci allo ${site.phone.label}: ti risponde una persona, non un modulo.`,
    restCta: "Scrivici la tua domanda",
    linkOpenDomus: "Come funziona un Open Domus",
    linkMetodo: "Il Metodo Domus Tua, passo per passo",
  },
  en: {
    heroEyebrow: "Frequently asked questions",
    heroTitle: () => (
      <>
        The answers,
        <br />
        <span className="text-red-soft">before the questions.</span>
      </>
    ),
    heroSubcopy:
      "What sellers and buyers in Tradate and the Varese province ask us most often. If your question isn't here, ask us: you'll hear back from us.",
    heroAlt: "Raffaela Rizza with a client at the Domus Tua office in Tradate",
    heroPrimary: "Ask your question",
    heroSecondary: "Go to the answers",
    indexLabel: "On this page",
    restEyebrow: "Didn't find your answer?",
    restTitle: "Just ask us.",
    restCopy: `A specific question about your home deserves a specific answer, not a generic paragraph. Write to us or call ${site.phone.label}: a person replies, not a form.`,
    restCta: "Send us your question",
    linkOpenDomus: "How an Open Domus works",
    linkMetodo: "The Domus Tua Method, step by step",
  },
  fr: {
    heroEyebrow: "Questions fréquentes",
    heroTitle: () => (
      <>
        Les réponses,
        <br />
        <span className="text-red-soft">avant les questions.</span>
      </>
    ),
    heroSubcopy:
      "Ce que nous demandent le plus souvent celles et ceux qui vendent ou achètent à Tradate et dans la province de Varese. Si votre question n'y est pas, posez-la : c'est nous qui répondons.",
    heroAlt: "Raffaela Rizza avec une cliente à l'agence Domus Tua de Tradate",
    heroPrimary: "Posez votre question",
    heroSecondary: "Aller aux réponses",
    indexLabel: "Sur cette page",
    restEyebrow: "Vous n'avez pas trouvé ?",
    restTitle: "Demandez-nous, tout simplement.",
    restCopy: `Une question précise sur votre bien mérite une réponse précise, pas un paragraphe générique. Écrivez-nous ou appelez le ${site.phone.label} : c'est une personne qui répond, pas un formulaire.`,
    restCta: "Écrivez-nous votre question",
    linkOpenDomus: "Comment se déroule un Open Domus",
    linkMetodo: "La Méthode Domus Tua, étape par étape",
  },
  de: {
    heroEyebrow: "Häufige Fragen",
    heroTitle: () => (
      <>
        Die Antworten,
        <br />
        <span className="text-red-soft">vor den Fragen.</span>
      </>
    ),
    heroSubcopy:
      "Was uns Verkäuferinnen und Käufer in Tradate und der Provinz Varese am häufigsten fragen. Steht Ihre Frage nicht dabei, stellen Sie sie uns: Sie hören von uns.",
    heroAlt: "Raffaela Rizza mit einer Kundin im Domus Tua Büro in Tradate",
    heroPrimary: "Stellen Sie Ihre Frage",
    heroSecondary: "Zu den Antworten",
    indexLabel: "Auf dieser Seite",
    restEyebrow: "Keine Antwort gefunden?",
    restTitle: "Fragen Sie uns einfach.",
    restCopy: `Eine konkrete Frage zu Ihrer Immobilie verdient eine konkrete Antwort, keinen allgemeinen Absatz. Schreiben Sie uns oder rufen Sie ${site.phone.label} an: Es antwortet ein Mensch, kein Formular.`,
    restCta: "Schreiben Sie uns Ihre Frage",
    linkOpenDomus: "Wie ein Open Domus abläuft",
    linkMetodo: "Die Domus-Tua-Methode, Schritt für Schritt",
  },
  es: {
    heroEyebrow: "Preguntas frecuentes",
    heroTitle: () => (
      <>
        Las respuestas,
        <br />
        <span className="text-red-soft">antes que las preguntas.</span>
      </>
    ),
    heroSubcopy:
      "Lo que más nos preguntan quienes venden y quienes compran casa en Tradate y en la provincia de Varese. Si tu pregunta no está, háznosla: te respondemos nosotras.",
    heroAlt: "Raffaela Rizza con una clienta en la oficina de Domus Tua en Tradate",
    heroPrimary: "Haz tu pregunta",
    heroSecondary: "Ir a las respuestas",
    indexLabel: "En esta página",
    restEyebrow: "¿No has encontrado la respuesta?",
    restTitle: "Pregúntanoslo sin más.",
    restCopy: `Una pregunta concreta sobre tu casa merece una respuesta concreta, no un párrafo genérico. Escríbenos o llama al ${site.phone.label}: responde una persona, no un formulario.`,
    restCta: "Escríbenos tu pregunta",
    linkOpenDomus: "Cómo funciona un Open Domus",
    linkMetodo: "El Método Domus Tua, paso a paso",
  },
};

export default function FaqContent() {
  const { locale } = useLocale();
  const c = copy[locale];
  const groups = faq[locale];

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle()}
        subcopy={c.heroSubcopy}
        image="/images/reali/consulenza.jpg"
        alt={c.heroAlt}
        primary={{ label: c.heroPrimary, href: "#contatti" }}
        secondary={{ label: c.heroSecondary, href: `#${groups[0].id}` }}
        // Stessa foto d'ufficio molto luminosa di /lavora-con-noi: col velo standard
        // il titolo crema si perde sulla metà chiara dell'immagine.
        scrim="strong"
      />

      <SegnoDomusDivider className="py-14" />

      <section className="relative bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8 sm:pb-32">
          <div className="grid gap-12 lg:grid-cols-[0.62fr_1.38fr] lg:gap-16">
            {/* Indice: appiccicato su desktop, accompagna la lettura senza rincorrerla.
                NIENTE transform sugli antenati di un elemento sticky (regola del layer
                motion): questa colonna resta fuori da CameraIn e da Parallax. */}
            <nav aria-label={c.indexLabel} className="lg:sticky lg:top-32 lg:self-start">
              <Reveal>
                <p className="eyebrow">{c.indexLabel}</p>
              </Reveal>
              <ul className="mt-5 flex flex-col gap-2.5">
                {groups.map((group, i) => (
                  <Reveal as="li" key={group.id} delay={80 + i * 60}>
                    <a
                      href={`#${group.id}`}
                      className="group inline-flex items-baseline gap-3 font-display text-lg font-medium text-ink transition-colors duration-300 hover:text-red"
                    >
                      <span className="tnum text-[0.72rem] font-semibold tracking-[0.2em] text-stone">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {group.title}
                    </a>
                  </Reveal>
                ))}
              </ul>

              <Reveal delay={280}>
                <span aria-hidden className="hairline my-8 block" />
                <div className="flex flex-col gap-3">
                  <Link
                    href="/open-domus"
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
                  >
                    {c.linkOpenDomus}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/metodo"
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
                  >
                    {c.linkMetodo}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </Reveal>
            </nav>

            <div className="flex flex-col gap-16 sm:gap-20">
              {groups.map((group) => (
                <div key={group.id} id={group.id} className="scroll-mt-32">
                  <TextLines
                    as="h2"
                    className="font-display text-3xl font-medium leading-[1.06] tracking-tight text-ink balance sm:text-[2.4rem]"
                  >
                    {group.title}
                  </TextLines>
                  <div className="mt-8">
                    <FaqList entries={group.entries} />
                  </div>
                </div>
              ))}

              {/* La via d'uscita: nessuna FAQ copre tutto, e fingere di sì è il modo
                  più rapido per far sentire solo chi ha una domanda vera. */}
              <div className="rounded-[2rem] border border-line bg-cream p-8 sm:p-10">
                <Reveal>
                  <span className="eyebrow">{c.restEyebrow}</span>
                  <h2 className="mt-5 font-display text-2xl font-medium leading-snug tracking-tight text-ink balance sm:text-3xl">
                    {c.restTitle}
                  </h2>
                  <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-stone">
                    {c.restCopy}
                  </p>
                  <Cta href="#contatti" variant="cta" size="md" className="mt-7">
                    {c.restCta}
                  </Cta>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Contact />
    </main>
  );
}
