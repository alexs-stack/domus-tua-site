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
// Dice cosa NON si paga e QUANDO si paga: condizioni contrattuali, fatti verificabili sul
// mandato. Non promette che la casa si venda (vedi §3.3 e la FAQ che si rifiuta di
// promettere tempi).
//
// LA FORMA (2026-09-11): una RIGA-DICHIARAZIONE, non un capitolo. Prima era un
// `dt-chapter` da 806px costruito attorno a una frase sola: dentro c'era più vuoto che
// parole, e due capitoli di fila senza media facevano sembrare la pagina finita. Ora il
// titolo sta a sinistra, il lead e il link sulla seconda colonna (la stessa linea
// verticale delle righe foto+testo) e la sezione non ha il padding di capitolo ma un
// filo di respiro (1-2rem, che tiene dentro le discendenti del Playfair a interlinea
// 0.95): l'aria vera gliela danno i capitoli vicini, che ne hanno in abbondanza.

import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import { Cta } from "./primitives/Cta";
import { useDict, useLocale } from "./i18n/LocaleProvider";
import type { Locale } from "../lib/i18n/dictionaries";

// `first`, `noSale`, `includedLabel`, `included`: conservati dal blocco
// precedente; oggi non hanno più una riga propria.
type Copy = {
  eyebrow: string;
  title: string;
  scriptWord: string;
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
    scriptWord: "Nessun anticipo",
    lead: "Valutazione, fotografie professionali, video, home staging e verifica dei documenti sono compresi nel metodo.",
    first: "Il primo incontro è senza impegno e senza costi.",
    noSale: "Se non vendiamo, non ci pagate: non c'è un listino nascosto in fondo al mandato.",
    includedLabel: "Compreso nel metodo",
    included: "Valutazione · Fotografie professionali · Video · Home staging · Verifica dei documenti",
  },
  en: {
    eyebrow: "What it costs",
    title: "No upfront costs. You pay only once the sale is closed.",
    scriptWord: "No upfront cost",
    lead: "Valuation, professional photography, video, home staging and document checks are part of the method.",
    first: "The first meeting carries no obligation and no cost.",
    noSale: "If we don't sell, you don't pay us: there is no hidden price list at the end of the mandate.",
    includedLabel: "Included in the method",
    included: "Valuation · Professional photography · Video · Home staging · Document checks",
  },
  fr: {
    eyebrow: "Combien ça coûte",
    title: "Aucun frais d'avance. Vous payez seulement une fois la vente conclue.",
    scriptWord: "Aucune avance",
    lead: "Estimation, photographies professionnelles, vidéo, home staging et vérification des documents font partie de la méthode.",
    first: "Le premier rendez-vous est sans engagement et sans frais.",
    noSale: "Si nous ne vendons pas, vous ne nous payez pas : il n'y a pas de tarif caché au bas du mandat.",
    includedLabel: "Compris dans la méthode",
    included: "Estimation · Photographies professionnelles · Vidéo · Home staging · Vérification des documents",
  },
  de: {
    eyebrow: "Was es kostet",
    title: "Keine Kosten im Voraus. Bezahlt wird erst nach erfolgreichem Verkauf.",
    scriptWord: "Keine Vorauszahlung",
    lead: "Bewertung, professionelle Fotos, Video, Home Staging und Unterlagenprüfung gehören zur Methode.",
    first: "Das erste Gespräch ist unverbindlich und kostenfrei.",
    noSale: "Verkaufen wir nicht, zahlen Sie nichts: Am Ende des Auftrags steht keine versteckte Preisliste.",
    includedLabel: "In der Methode enthalten",
    included: "Bewertung · Professionelle Fotos · Video · Home Staging · Unterlagenprüfung",
  },
  es: {
    eyebrow: "Cuánto cuesta",
    title: "Sin costes por adelantado. Se paga solo cuando la venta se cierra.",
    scriptWord: "Sin anticipos",
    lead: "Valoración, fotografías profesionales, vídeo, home staging y verificación de los documentos están incluidos en el método.",
    first: "El primer encuentro es sin compromiso y sin coste.",
    noSale: "Si no vendemos, no nos pagáis: no hay una lista de precios escondida al final del mandato.",
    includedLabel: "Incluido en el método",
    included: "Valoración · Fotografías profesionales · Vídeo · Home staging · Verificación de los documentos",
  },
};

export default function CostiChiari({
  // `surface` resta nella firma per i chiamanti (home, /vendi) ma è inerte:
  // il fondo è uno solo, l'avorio, e le bande non si alternano più.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  surface = "paper",
}: {
  /** Conservata per compatibilità: il fondo è sempre `bg-cream`. */
  surface?: "paper" | "cream";
}) {
  const { locale } = useLocale();
  const d = useDict();
  const c = copy[locale];

  return (
    <section id="costi" className="bg-cream py-[clamp(1rem,3vh,2rem)]">
      <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-end">
        <div>
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <TextLines as="h2" className="mt-6 font-display text-d2">
            {c.title}
          </TextLines>
          {/* Niente parola calligrafica, qui. È l'ornamento del CAPITOLO, e
              questa non è più un capitolo ma una riga: in mezza colonna la
              calligrafia attraversava l'ultima riga del titolo partendo dal
              margine, e «conclusa» spariva sotto la «N» di «Nessun anticipo» —
              che per giunta ripeteva il titolo parola per parola. Il rosso di
              questa riga sono l'eyebrow e il link. */}
        </div>
        {/* Il seguito sulla seconda colonna, alla stessa linea verticale delle
            righe foto+testo: è quel che rende questa una riga e non un capitolo. */}
        <div className="mt-6 lg:mt-0 lg:pl-[6vw]">
          <Reveal delay={140}>
            <p className="lead">{c.lead}</p>
          </Reveal>
          <Reveal delay={200}>
            <Cta href="#contatti" variant="ghost" className="mt-8">
              {d.hero.ctaValuta}
            </Cta>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
