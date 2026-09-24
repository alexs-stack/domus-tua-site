"use client";

// Il blocco costi — §6.4 del Documento finale di sintesi.
//
// PERCHÉ ESISTE
// «Nessun costo anticipato, si paga solo a vendita conclusa» è probabilmente l'argomento
// di vendita più forte che l'agenzia possiede, e viveva in UN SOLO posto: dentro un
// accordion delle domande frequenti — cioè l'ultimo punto del sito in cui qualcuno lo
// cercherà. Chi sta valutando a chi dare l'incarico si ferma sulla domanda «quanto mi
// costa se poi non vendo?» molto prima di aprire una FAQ.
//
// LA REGOLA DEL LINGUAGGIO (§3.2)
// La gratuità resta, cambia la parola. Niente «gratis»: è registro da volantino e
// suggerisce un calcolatore automatico, cioè svaluta esattamente il servizio che il resto
// della pagina presenta come professionale. «Il primo incontro è senza impegno e senza
// costi» dice la stessa identica cosa e non abbassa il registro.
//
// PERCHÉ NON È UNA PROMESSA DI RISULTATO
// Le tre righe dicono cosa NON si paga e QUANDO si paga: sono condizioni contrattuali,
// fatti verificabili sul mandato. Non promettono che la casa si venda (vedi §3.3 e la FAQ
// che si rifiuta di promettere tempi).

import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import { Cta } from "./primitives/Cta";
import { useDict, useLocale } from "./i18n/LocaleProvider";
import type { Locale } from "../lib/i18n/dictionaries";

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  included: string;
  first: string;
  noSale: string;
  includedLabel: string;
};

const copy: Record<Locale, Copy> = {
  it: {
    eyebrow: "Quanto costa",
    title: "Nessun costo anticipato. Si paga solo a vendita conclusa.",
    lead: "Valutazione, fotografie professionali, video, home staging e verifica dei documenti sono compresi nel metodo.",
    first: "Il primo incontro è senza impegno e senza costi.",
    noSale: "Se non vendiamo, non ci pagate: non c'è un listino nascosto in fondo al mandato.",
    includedLabel: "Compreso nel metodo",
    included: "Valutazione · Fotografie professionali · Video · Home staging · Verifica dei documenti",
  },
  en: {
    eyebrow: "What it costs",
    title: "No upfront costs. You pay only once the sale is closed.",
    lead: "Valuation, professional photography, video, home staging and document checks are part of the method.",
    first: "The first meeting carries no obligation and no cost.",
    noSale: "If we don't sell, you don't pay us: there is no hidden price list at the end of the mandate.",
    includedLabel: "Included in the method",
    included: "Valuation · Professional photography · Video · Home staging · Document checks",
  },
  fr: {
    eyebrow: "Combien ça coûte",
    title: "Aucun frais d'avance. Vous payez seulement une fois la vente conclue.",
    lead: "Estimation, photographies professionnelles, vidéo, home staging et vérification des documents font partie de la méthode.",
    first: "Le premier rendez-vous est sans engagement et sans frais.",
    noSale: "Si nous ne vendons pas, vous ne nous payez pas : il n'y a pas de tarif caché au bas du mandat.",
    includedLabel: "Compris dans la méthode",
    included: "Estimation · Photographies professionnelles · Vidéo · Home staging · Vérification des documents",
  },
  de: {
    eyebrow: "Was es kostet",
    title: "Keine Kosten im Voraus. Bezahlt wird erst nach erfolgreichem Verkauf.",
    lead: "Bewertung, professionelle Fotos, Video, Home Staging und Unterlagenprüfung gehören zur Methode.",
    first: "Das erste Gespräch ist unverbindlich und kostenfrei.",
    noSale: "Verkaufen wir nicht, zahlen Sie nichts: Am Ende des Auftrags steht keine versteckte Preisliste.",
    includedLabel: "In der Methode enthalten",
    included: "Bewertung · Professionelle Fotos · Video · Home Staging · Unterlagenprüfung",
  },
  es: {
    eyebrow: "Cuánto cuesta",
    title: "Sin costes por adelantado. Se paga solo cuando la venta se cierra.",
    lead: "Valoración, fotografías profesionales, vídeo, home staging y verificación de los documentos están incluidos en el método.",
    first: "El primer encuentro es sin compromiso y sin coste.",
    noSale: "Si no vendemos, no nos pagáis: no hay una lista de precios escondida al final del mandato.",
    includedLabel: "Incluido en el método",
    included: "Valoración · Fotografías profesionales · Vídeo · Home staging · Verificación de los documentos",
  },
};

export default function CostiChiari({
  surface = "paper",
}: {
  /** La banda su cui poggia il blocco, per non affiancare due superfici uguali. */
  surface?: "paper" | "cream";
}) {
  const { locale } = useLocale();
  const d = useDict();
  const c = copy[locale];

  return (
    <section
      id="costi"
      className={`relative ${surface === "cream" ? "bg-cream" : "bg-paper"}`}
      data-surface="light"
    >
      <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
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
            <Reveal delay={120}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-graphite">{c.lead}</p>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-graphite">{c.first}</p>
            </Reveal>
            {/* La riga che chiude l'obiezione, in evidenza: è quella che il proprietario
                sta cercando e non deve doverla pescare dentro un paragrafo. */}
            <Reveal delay={240}>
              <p className="mt-6 max-w-xl border-l-2 border-red pl-5 text-base font-medium leading-relaxed text-ink">
                {c.noSale}
              </p>
            </Reveal>
            <Reveal delay={300}>
              <Cta href="#contatti" variant="cta" size="md" className="mt-8">
                {d.hero.ctaValuta}
              </Cta>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <div className="rounded-card border border-line bg-cream-deep p-7 sm:p-8">
              <span className="eyebrow">{c.includedLabel}</span>
              <ul className="mt-5 space-y-3">
                {c.included.split(" · ").map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-snug text-graphite">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
