"use client";

// Il blocco di posizionamento — §6.2 del Documento finale di sintesi.
//
// PERCHÉ ESISTE, E PERCHÉ PROPRIO QUI
// Fra l'hero e la ricerca c'è una frase che dice cosa distingue l'agenzia: chi deve
// scegliere a chi dare l'incarico (il proprietario) legge prima di chi cerca casa.
// Il titolo era una candidata per l'H1: qui, con i verbi che seguono, «bene» smette
// di essere ambiguo. Cinque azioni, non cinque aggettivi (§3.3).
//
// FORMA (rivista bianca, 2026-09-10): due colonne 5/7 — a sinistra la foto quadrata
// reale della sede, a destra eyebrow, titolo d2 maiuscolo, lead e i tre appigli con
// il trattino rosso. Niente centrature, niente card.

import Image from "next/image";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import Parallax from "./motion/Parallax";
import { useLocale } from "./i18n/LocaleProvider";
import type { Locale } from "../lib/i18n/dictionaries";

type Copy = { eyebrow: string; title: string; body: string; steps: string[]; imageAlt: string };

const copy: Record<Locale, Copy> = {
  it: {
    eyebrow: "Il metodo, in una riga",
    title: "La tua casa merita di essere venduta bene.",
    body: "Non la mettiamo semplicemente online. La valutiamo sui dati, ne verifichiamo i documenti prima di partire, la prepariamo, la raccontiamo e la portiamo davanti alle persone giuste.",
    steps: ["Valutata sui dati", "Documenti verificati prima", "Preparata e raccontata"],
    imageAlt: "Raffaela Bisognin consegna una proposta d'acquisto a una cliente nella sede Domus Tua",
  },
  en: {
    eyebrow: "The method, in one line",
    title: "Your home deserves to be sold well.",
    body: "We don't simply put it online. We value it on data, verify its paperwork before we start, prepare it, tell its story and bring it in front of the right people.",
    steps: ["Valued on data", "Paperwork verified first", "Prepared and told well"],
    imageAlt: "Raffaela Bisognin handing a purchase offer to a client at the Domus Tua office",
  },
  fr: {
    eyebrow: "La méthode, en une ligne",
    title: "Votre bien mérite d'être bien vendu.",
    body: "Nous ne le mettons pas simplement en ligne. Nous l'estimons sur des données, nous vérifions ses documents avant de commencer, nous le préparons, nous le racontons et nous l'amenons devant les bonnes personnes.",
    steps: ["Estimé sur des données", "Documents vérifiés d'abord", "Préparé et raconté"],
    imageAlt: "Raffaela Bisognin remet une offre d'achat à une cliente dans l'agence Domus Tua",
  },
  de: {
    eyebrow: "Die Methode, in einer Zeile",
    title: "Ihre Immobilie verdient es, gut verkauft zu werden.",
    body: "Wir stellen sie nicht einfach online. Wir bewerten sie anhand von Daten, prüfen ihre Unterlagen, bevor es losgeht, bereiten sie vor, erzählen ihre Geschichte und bringen sie vor die richtigen Menschen.",
    steps: ["Auf Daten bewertet", "Unterlagen zuerst geprüft", "Vorbereitet und erzählt"],
    imageAlt: "Raffaela Bisognin übergibt einer Kundin ein Kaufangebot im Büro von Domus Tua",
  },
  es: {
    eyebrow: "El método, en una línea",
    title: "Tu casa merece venderse bien.",
    body: "No la ponemos simplemente online. La valoramos con datos, verificamos sus documentos antes de empezar, la preparamos, la contamos y la llevamos ante las personas adecuadas.",
    steps: ["Valorada con datos", "Documentos verificados antes", "Preparada y contada"],
    imageAlt: "Raffaela Bisognin entrega una propuesta de compra a una clienta en la sede de Domus Tua",
  },
};

export default function Posizionamento() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section className="dt-chapter bg-cream">
      <div className="dt-row grid gap-[6vw] lg:grid-cols-[5fr_7fr] lg:items-center">
        {/* La sede, in quadrato: consulenza.jpg è quasi 1:1, la foto di gruppo 3:2
            perderebbe i volti ai bordi e la "sede" è una miniatura YouTube con testo. */}
        <Parallax speed={-0.04}>
          <div className="relative aspect-square">
            <Image
              src="/images/reali/consulenza.jpg"
              alt={c.imageAlt}
              fill
              sizes="(max-width: 1023px) 90vw, 35vw"
              className="object-cover"
              style={{ objectPosition: "45% 50%" }}
            />
          </div>
        </Parallax>

        <div>
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <TextLines as="h2" className="mt-6 font-display text-d2">
            {c.title}
          </TextLines>
          <Reveal delay={120}>
            <p className="lead mt-8">{c.body}</p>
          </Reveal>

          {/* I tre appigli: la stessa promessa in forma scandita, per chi scorre. */}
          <Reveal delay={200}>
            <ul className="mt-10 flex flex-col gap-3 text-body text-ink">
              {c.steps.map((step) => (
                <li key={step} className="flex items-center gap-4">
                  <span aria-hidden className="h-px w-8 shrink-0 bg-red" />
                  {step}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
