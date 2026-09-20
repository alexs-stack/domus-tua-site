"use client";

// Il blocco di posizionamento — §6.2 del Documento finale di sintesi.
//
// PERCHÉ ESISTE, E PERCHÉ PROPRIO QUI
// Fra l'hero e la ricerca c'è una frase che dice cosa distingue l'agenzia: chi deve
// scegliere a chi dare l'incarico (il proprietario) legge prima di chi cerca casa.
// Il titolo era una candidata per l'H1: qui, con i verbi che seguono, «bene» smette
// di essere ambiguo. Cinque azioni, non cinque aggettivi (§3.3).
//
// FORMA (2026-09-11): UNA riga del modello condiviso a due colonne — a sinistra la
// foto quadrata reale della sede in `dt-media-half`, a destra eyebrow, titolo d2
// maiuscolo, lead e i tre appigli col trattino rosso. Niente centrature, niente card.
// PERCHÉ RESTA UNA SEZIONE, E NON TRE PUNTI DENTRO L'HERO: la promessa dell'hero è
// una frase di posizionamento («vendi al prezzo giusto»), questa dice il COME in
// cinque azioni e porta la prima foto di persone vere della pagina. Ripiegata come
// elenco sotto la CTA dell'hero, sarebbe l'unica cosa da leggere nel primo schermo
// oltre alla CTA — e il primo schermo non è di nostra competenza (HeroCinematic e
// page.tsx hanno altri proprietari: la sezione non si può nemmeno togliere da qui).
// Quel che si poteva togliere era la larghezza inventata: la griglia 5/7 con la foto
// a 468px era la terza misura media della home nei primi tre schermi.
//
// COREOGRAFIA (Alberto, 13 settembre 2026: A18-A20; spec coreografia §3.3, CAT §3):
// da 1024 × 640 px con motion ok la sezione è il foglio che scorre sopra il tuffo
// dell'hero (margine −100svh in globals.css, sotto `data-hero-cover`), e a ogni
// larghezza le parole del titolo si allontanano in x fino a giustificare la riga:
// è il wordSpacing di Era reso con i transform, perché il wordSpacing rifarebbe
// l'impaginato a ogni fotogramma. La deriva `Parallax` della foto è uscita (D23):
// ±0,56 % dell'altezza non si vedeva ed era un secondo gesto nel capitolo.

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { chapters } from "../lib/motion/chapters";
import Reveal from "./Reveal";
import LamaMedia from "./motion/LamaMedia";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
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

/** A20 di Alberto, spec §3.3: scarto finale in x della parola sulla sua riga, k · min(10vw, slack / (n − 1)), con slack misurato a riposo; righe di una parola ferme. */
function wordShift(word: HTMLElement, title: HTMLElement): number {
  const words = Array.from(title.querySelectorAll<HTMLElement>(".dt-w"));
  const row = words.filter((w) => Math.abs(w.offsetTop - word.offsetTop) < 2);
  const n = row.length;
  if (n < 2) return 0;
  const k = row.indexOf(word);
  const last = row[n - 1];
  // Il bordo destro dell'ultima parola a riposo: si toglie la x che GSAP le ha già scritto.
  const lastRight = last.getBoundingClientRect().right - Number(gsap.getProperty(last, "x"));
  const slack = Math.max(0, title.getBoundingClientRect().right - lastRight);
  return k * Math.min(window.innerWidth * 0.1, slack / (n - 1));
}

export default function Posizionamento() {
  const { locale } = useLocale();
  const c = copy[locale];
  const textRef = useRef<HTMLDivElement>(null);

  // Le parole che si allontanano (A18-A20 di Alberto; spec coreografia §3.3). La
  // firma del capitolo sta in chapters.ts: ease none, scrub 0,8, h2 `top bottom` →
  // `center top`. Le righe si ricavano da `.dt-w` raggruppate per offsetTop e si
  // rimisurano a ogni refresh (valori funzione, invalidateOnRefresh); al cambio
  // lingua il titolo si rispezza e la timeline si rifà (revertOnUpdate).
  useGSAP(
    () => {
      const title = textRef.current?.querySelector<HTMLElement>("h2");
      if (!title) return;
      const sig = chapters.posizionamento.signature;
      if (!("st" in sig.trigger) || !("scrub" in sig.time)) return;
      const [start, end] = sig.trigger.st;
      const scrub = sig.time.scrub;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const words = gsap.utils.toArray<HTMLElement>(".dt-w", title);
        if (words.length < 2) return;
        gsap.fromTo(
          words,
          { x: 0 },
          {
            x: (_i: number, el: HTMLElement) => wordShift(el, title),
            ease: sig.ease,
            immediateRender: false,
            scrollTrigger: { trigger: title, start, end, scrub, invalidateOnRefresh: true },
          },
        );
      });
    },
    { scope: textRef, dependencies: [locale], revertOnUpdate: true },
  );

  return (
    <section data-hero-cover className="dt-chapter bg-cream">
      <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-center">
        {/* La sede, nella METÀ (dt-media-half, 42vw quadrata): è la stessa
            scatola delle altre righe foto+testo, così scorrendo l'occhio
            ritrova la stessa linea verticale invece di una larghezza nuova.
            consulenza.jpg è 1920×1625, quasi 1:1: nel quadrato si taglia il 15%
            e non si ingrandisce (la foto di gruppo 3:2 perderebbe i volti ai
            bordi, e la "sede" è una miniatura YouTube con del testo sopra).
            Il 15 % si toglie a SINISTRA (`100% 50%`, D201): a `45% 50%` la
            cliente di spalle restava tagliata all'80 % sul bordo destro; ora
            la finestra è 0,154–1,000 del file e la cliente è intera per quanto
            ne ha il file, Raffaela dentro (A27).
            La foto entra con la lama (A36, D200-D203): da sinistra, perché la
            cliente tocca il bordo destro, scivolo 10 % (margine sinistro dei
            corpi 13,1 %). Il capitolo muove il foglio e le parole, non la foto:
            la lama è il ruolo dei media, non un secondo gesto. */}
          <LamaMedia id="sede" className="dt-media-half">
            <Image
              src="/images/reali/consulenza.jpg"
              alt={c.imageAlt}
              fill
              // Dichiarato appena più largo della scatola (42vw, tetto 640): con
              // `sizes` esatto next/image sceglie il taglio subito sotto e in un
              // quadrato da 605 lo deve risalire del 12%. Sopra i 1600 px la
              // scatola smette di crescere, quindi anche `sizes` si ferma.
              sizes="(max-width: 1023px) 118vw, (max-width: 1599px) 50vw, 760px"
              className="object-cover"
              style={{ objectPosition: "100% 50%" }}
            />
          </LamaMedia>

        <div ref={textRef} className="lg:pl-[6vw]">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <SplitTitle as="h2" className="mt-6 font-display text-d2">
            {c.title}
          </SplitTitle>
          <Lead className="mt-8">{c.body}</Lead>

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
