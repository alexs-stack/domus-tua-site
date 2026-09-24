"use client";

// Il blocco di posizionamento — §6.2 del Documento finale di sintesi.
//
// PERCHÉ ESISTE, E PERCHÉ PROPRIO QUI
// Subito sotto l'hero c'era la ricerca immobili: lo spazio più prezioso della pagina —
// il primo blocco interattivo che si incontra — era assegnato all'ACQUIRENTE. Ma
// l'acquirente arriva comunque dai portali, ed è volume; il proprietario che deve
// scegliere a chi dare l'incarico è il fatturato, e finiva scavalcato da un modulo di
// ricerca. Adesso fra l'hero e la ricerca c'è una frase che dice cosa distingue
// l'agenzia, e la ricerca viene dopo (dove chi cerca casa la trova comunque: la CTA
// secondaria dell'hero punta lì).
//
// IL TITOLO È UN RECUPERO, NON UNA FRASE NUOVA
// «La tua casa merita di essere venduta bene» era una delle candidate per l'H1. Nell'H1
// era rischiosa — nella sua forma piena («…non in fretta») chi ha urgenza di vendere può
// leggerci "siamo lenti" — ma duecento pixel più in basso il rischio sparisce, perché i
// verbi che seguono spiegano cosa vuol dire "bene": valutare sui dati, verificare i
// documenti, preparare, raccontare, portare davanti alle persone giuste.
//
// Cinque azioni, non cinque aggettivi. È la stessa regola del §3.3 applicata al
// posizionamento: si dichiara cosa si fa, non quanto si è bravi.

import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import { useLocale } from "./i18n/LocaleProvider";
import type { Locale } from "../lib/i18n/dictionaries";

type Copy = { eyebrow: string; title: string; body: string; steps: string[] };

const copy: Record<Locale, Copy> = {
  it: {
    eyebrow: "Il metodo, in una riga",
    title: "La tua casa merita di essere venduta bene.",
    body: "Non la mettiamo semplicemente online. La valutiamo sui dati, ne verifichiamo i documenti prima di partire, la prepariamo, la raccontiamo e la portiamo davanti alle persone giuste.",
    steps: ["Valutata sui dati", "Documenti verificati prima", "Preparata e raccontata"],
  },
  en: {
    eyebrow: "The method, in one line",
    title: "Your home deserves to be sold well.",
    body: "We don't simply put it online. We value it on data, verify its paperwork before we start, prepare it, tell its story and bring it in front of the right people.",
    steps: ["Valued on data", "Paperwork verified first", "Prepared and told well"],
  },
  fr: {
    eyebrow: "La méthode, en une ligne",
    title: "Votre bien mérite d'être bien vendu.",
    body: "Nous ne le mettons pas simplement en ligne. Nous l'estimons sur des données, nous vérifions ses documents avant de commencer, nous le préparons, nous le racontons et nous l'amenons devant les bonnes personnes.",
    steps: ["Estimé sur des données", "Documents vérifiés d'abord", "Préparé et raconté"],
  },
  de: {
    eyebrow: "Die Methode, in einer Zeile",
    title: "Ihre Immobilie verdient es, gut verkauft zu werden.",
    body: "Wir stellen sie nicht einfach online. Wir bewerten sie anhand von Daten, prüfen ihre Unterlagen, bevor es losgeht, bereiten sie vor, erzählen ihre Geschichte und bringen sie vor die richtigen Menschen.",
    steps: ["Auf Daten bewertet", "Unterlagen zuerst geprüft", "Vorbereitet und erzählt"],
  },
  es: {
    eyebrow: "El método, en una línea",
    title: "Tu casa merece venderse bien.",
    body: "No la ponemos simplemente online. La valoramos con datos, verificamos sus documentos antes de empezar, la preparamos, la contamos y la llevamos ante las personas adecuadas.",
    steps: ["Valorada con datos", "Documentos verificados antes", "Preparada y contada"],
  },
};

export default function Posizionamento() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    // `cream-deep` è il tono con cui l'hero chiude il suo velo (SurfaceVeil) ed è lo
    // stesso su cui poggia la ricerca qui sotto: nessuna giuntura da nascondere, il
    // blocco si innesta nella stessa superficie invece di aprirne una nuova.
    <section data-tone="cream-deep" className="relative bg-cream-deep">
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="eyebrow eyebrow--center justify-center">{c.eyebrow}</span>
          </Reveal>
          <TextLines
            as="h2"
            className="mx-auto mt-6 font-display text-d3 display-tight font-medium text-ink balance"
          >
            {c.title}
          </TextLines>
          <Reveal delay={140}>
            <p className="mx-auto mt-7 max-w-2xl text-[1.05rem] leading-relaxed text-graphite">
              {c.body}
            </p>
          </Reveal>
        </div>

        {/* I tre appigli: la stessa promessa in forma scandita, per chi scorre invece
            di leggere. Non aggiungono nulla al paragrafo — lo rendono afferrabile. */}
        <Reveal delay={220}>
          <ul className="mx-auto mt-12 flex max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10">
            {c.steps.map((step) => (
              <li key={step} className="flex items-center gap-3 text-sm font-medium text-ink">
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                {step}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
