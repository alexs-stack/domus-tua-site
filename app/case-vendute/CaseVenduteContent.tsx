"use client";

// /case-vendute — punto 31 della checklist.
//
// «Pagina /case-vendute con i risultati reali: nessun concorrente della zona la ha.»
// È vero, ed è anche il motivo per cui va fatta con più scrupolo del solito: una pagina di
// risultati è la più facile da gonfiare e la più costosa da smentire.
//
// ─────────────────────────────────────────────────────────────────────────────
// TRE COSE CHE QUESTA PAGINA NON DICE, E PERCHÉ
//
// 1. NON MOSTRA IL PREZZO.
//    `Property.price` è il prezzo di RICHIESTA del gestionale, non quello di vendita.
//    Stamparlo sotto la parola "venduta" lo trasforma, agli occhi di chiunque, nella cifra
//    incassata — un'affermazione che nessun dato qui dentro sostiene. Il prezzo reale di
//    rogito non è pubblico e non lo conosciamo. Quindi non c'è.
//
// 2. NON DICE QUANDO.
//    Il feed RealSmart non espone la data di vendita (vedi scripts/detect-sold.ts: lo stato
//    "venduto" si legge OCR dal badge sulla copertina, non da un campo). Senza data non si
//    può scrivere né "venduta a marzo" né ordinare per recente: sarebbe inventato.
//
// 3. NON DICE IN QUANTO TEMPO.
//    La FAQ del sito si rifiuta di promettere tempi di vendita ed è la riga più credibile
//    che l'agenzia abbia. Una pagina di risultati che insinua "vendiamo in fretta" la
//    tradirebbe a due clic di distanza.
//
// COSA DICE INVECE: quante sono, su quante pubblicate, in quanti comuni, e a che data è
// stato fatto il rilevamento. Campione e periodo dichiarati, come chiede il punto 33 per
// gli Open Domus. Un numero con la sua fonte accanto vale più di un numero più grande.
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Reveal from "./../components/Reveal";
import TextLines from "./../components/motion/TextLines";
import { Cta } from "./../components/primitives/Cta";
import { useDict, useLocale } from "./../components/i18n/LocaleProvider";
import type { Locale } from "../lib/i18n/dictionaries";

/**
 * I SEI campi che la card disegna, e nient'altro.
 *
 * Questo componente è client, quindi ogni proprietà che riceve viene serializzata
 * nell'HTML: passare l'intero `GridProperty` per 168 immobili significava spedire anche
 * `facts`, `features`, `excerpt`, `badges` e i prezzi — roba che la card non rende — e
 * portava la pagina a 1,2 MB, cioè peggio di /acquista, che il documento cita come difetto
 * da correggere (punto 29). Proiettare qui è la differenza fra 1,2 MB e un decimo.
 *
 * `price` NON c'è di proposito e non va aggiunto: vedi la nota in testa al file.
 */
export type SoldCard = {
  slug: string;
  title: string;
  zone: string;
  type: string;
  sqm: string;
  cover: string;
};

export type SoldStats = {
  /** Immobili venduti nel catalogo. */
  sold: number;
  /** Totale delle schede pubblicate dal gestionale (il campione). */
  total: number;
  /** Comuni distinti in cui si è venduto. */
  comuni: number;
  /** Quante schede vengono effettivamente disegnate (il resto è dichiarato, non nascosto). */
  shown: number;
  /** Data del rilevamento, già formattata dal server (ISO → locale). */
  detectedOn: string | null;
};

type Copy = {
  eyebrow: string;
  title: string;
  lead: (s: SoldStats) => string;
  statSold: string;
  statTotal: string;
  statComuni: string;
  source: (date: string) => string;
  shownNote: (shown: number, total: number) => string;
  noPrice: string;
  cardSold: string;
  cardCta: string;
  ctaTitle: string;
  ctaBody: string;
  empty: string;
};

const copy: Record<Locale, Copy> = {
  it: {
    eyebrow: "Risultati",
    title: "Le case che abbiamo venduto.",
    lead: (s) =>
      `Non un numero tondo: le schede degli immobili che Domus Tua ha portato fino alla firma. Sono ${s.sold} sulle ${s.total} pubblicate, in ${s.comuni} comuni fra la provincia di Varese e l'alta provincia di Como.`,
    statSold: "immobili venduti",
    statTotal: "schede pubblicate",
    statComuni: "comuni",
    shownNote: (shown, total) => `Ne mostriamo ${shown} su ${total}: bastano a farsi un'idea, e la pagina resta leggera anche da telefono.`,
    source: (date) => `Rilevati dal gestionale il ${date}. Il conteggio si aggiorna con il catalogo.`,
    noPrice:
      "Qui non trovi i prezzi: il gestionale espone il prezzo di richiesta, non quello di rogito, e non vogliamo far passare l'uno per l'altro. Per la stessa ragione non trovi le date né i tempi di vendita — non li promettiamo prima, non li useremo come vetrina dopo.",
    cardSold: "Venduta",
    cardCta: "Vedi la scheda",
    ctaTitle: "La prossima potrebbe essere la tua.",
    ctaBody:
      "Ogni immobile di questa pagina è partito da una valutazione e da una verifica dei documenti. Il primo incontro è senza impegno e senza costi.",
    empty:
      "Il catalogo non espone immobili venduti in questo momento. Torna a trovarci: la pagina si aggiorna con il gestionale.",
  },
  en: {
    eyebrow: "Results",
    title: "The homes we have sold.",
    lead: (s) =>
      `Not a round number: the listings Domus Tua carried through to signing. That's ${s.sold} out of ${s.total} published, across ${s.comuni} municipalities between the province of Varese and upper Como.`,
    statSold: "properties sold",
    statTotal: "listings published",
    statComuni: "municipalities",
    shownNote: (shown, total) => `We show ${shown} of ${total}: enough to get the picture, and the page stays light on a phone.`,
    source: (date) => `Detected from the management system on ${date}. The count follows the catalogue.`,
    noPrice:
      "You won't find prices here: the system exposes the asking price, not the price at completion, and we won't pass one off as the other. For the same reason there are no dates or selling times — we don't promise them beforehand and we won't use them as a shop window afterwards.",
    cardSold: "Sold",
    cardCta: "See the listing",
    ctaTitle: "The next one could be yours.",
    ctaBody:
      "Every property on this page started with a valuation and a document check. The first meeting carries no obligation and no cost.",
    empty: "The catalogue shows no sold properties right now. Come back soon: this page follows the system.",
  },
  fr: {
    eyebrow: "Résultats",
    title: "Les biens que nous avons vendus.",
    lead: (s) =>
      `Pas un chiffre rond : les annonces que Domus Tua a menées jusqu'à la signature. Soit ${s.sold} sur ${s.total} publiées, dans ${s.comuni} communes entre la province de Varese et le haut de la province de Côme.`,
    statSold: "biens vendus",
    statTotal: "annonces publiées",
    statComuni: "communes",
    shownNote: (shown, total) => `Nous en montrons ${shown} sur ${total} : de quoi se faire une idée, et la page reste légère sur mobile.`,
    source: (date) => `Relevés depuis le logiciel de gestion le ${date}. Le compte suit le catalogue.`,
    noPrice:
      "Vous ne trouverez pas de prix ici : le logiciel expose le prix demandé, pas celui de l'acte, et nous ne voulons pas faire passer l'un pour l'autre. Pour la même raison, ni dates ni délais de vente — nous ne les promettons pas avant et nous n'en ferons pas une vitrine après.",
    cardSold: "Vendu",
    cardCta: "Voir l'annonce",
    ctaTitle: "Le prochain pourrait être le vôtre.",
    ctaBody:
      "Chaque bien de cette page est parti d'une estimation et d'une vérification des documents. Le premier rendez-vous est sans engagement et sans frais.",
    empty:
      "Le catalogue n'expose aucun bien vendu pour le moment. Revenez bientôt : cette page suit le logiciel.",
  },
  de: {
    eyebrow: "Ergebnisse",
    title: "Die Immobilien, die wir verkauft haben.",
    lead: (s) =>
      `Keine runde Zahl: die Objekte, die Domus Tua bis zur Unterschrift begleitet hat. Das sind ${s.sold} von ${s.total} veröffentlichten, in ${s.comuni} Gemeinden zwischen der Provinz Varese und dem oberen Como.`,
    statSold: "verkaufte Immobilien",
    statTotal: "veröffentlichte Objekte",
    statComuni: "Gemeinden",
    shownNote: (shown, total) => `Wir zeigen ${shown} von ${total}: genug für einen Eindruck, und die Seite bleibt auch am Handy leicht.`,
    source: (date) => `Am ${date} aus der Verwaltungssoftware erhoben. Die Zahl folgt dem Katalog.`,
    noPrice:
      "Preise finden Sie hier nicht: Die Software zeigt den Angebotspreis, nicht den Preis beim Notar, und wir wollen das eine nicht als das andere ausgeben. Aus demselben Grund keine Daten und keine Verkaufszeiten — wir versprechen sie vorher nicht und stellen sie nachher nicht ins Schaufenster.",
    cardSold: "Verkauft",
    cardCta: "Zum Objekt",
    ctaTitle: "Die nächste könnte Ihre sein.",
    ctaBody:
      "Jede Immobilie auf dieser Seite begann mit einer Bewertung und einer Unterlagenprüfung. Das erste Gespräch ist unverbindlich und kostenfrei.",
    empty:
      "Der Katalog zeigt derzeit keine verkauften Immobilien. Schauen Sie bald wieder vorbei: Diese Seite folgt der Software.",
  },
  es: {
    eyebrow: "Resultados",
    title: "Las casas que hemos vendido.",
    lead: (s) =>
      `No es un número redondo: las fichas de los inmuebles que Domus Tua ha llevado hasta la firma. Son ${s.sold} de ${s.total} publicadas, en ${s.comuni} municipios entre la provincia de Varese y la alta provincia de Como.`,
    statSold: "inmuebles vendidos",
    statTotal: "fichas publicadas",
    statComuni: "municipios",
    shownNote: (shown, total) => `Mostramos ${shown} de ${total}: suficientes para hacerse una idea, y la página sigue siendo ligera en el móvil.`,
    source: (date) => `Detectados desde el gestor el ${date}. El recuento sigue al catálogo.`,
    noPrice:
      "Aquí no encontrarás precios: el gestor expone el precio de salida, no el de la escritura, y no queremos hacer pasar uno por otro. Por la misma razón no hay fechas ni plazos de venta: no los prometemos antes y no los usaremos de escaparate después.",
    cardSold: "Vendida",
    cardCta: "Ver la ficha",
    ctaTitle: "La próxima podría ser la tuya.",
    ctaBody:
      "Cada inmueble de esta página empezó con una valoración y una verificación de documentos. El primer encuentro es sin compromiso y sin coste.",
    empty:
      "El catálogo no muestra inmuebles vendidos en este momento. Vuelve pronto: esta página sigue al gestor.",
  },
};

export default function CaseVenduteContent({
  listings,
  stats,
}: {
  listings: SoldCard[];
  stats: SoldStats;
}) {
  const { locale } = useLocale();
  const d = useDict();
  const c = copy[locale];

  return (
    <main className="flex-1 bg-paper">
      <section className="relative bg-cream-deep">
        <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <TextLines
            as="h1"
            // 18ch a questa scala tipografica spezzava il titolo una parola per riga.
            className="mt-5 max-w-[26ch] font-display text-d2 display-tight font-medium text-ink balance"
          >
            {c.title}
          </TextLines>
          <Reveal delay={120}>
            <p className="mt-7 max-w-2xl text-[1.05rem] leading-relaxed text-graphite">
              {c.lead(stats)}
            </p>
          </Reveal>

          {/* I numeri, con il campione accanto: senza il denominatore un conteggio
              di vendite non si può leggere. */}
          <Reveal delay={180}>
            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-line pt-8 sm:grid-cols-3">
              {[
                { n: stats.sold, label: c.statSold },
                { n: stats.total, label: c.statTotal },
                { n: stats.comuni, label: c.statComuni },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="tnum block font-display text-4xl font-medium leading-none text-ink sm:text-5xl">
                      {s.n}
                    </span>
                    <span className="mt-2 block text-sm leading-snug text-stone">{s.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {stats.shown < stats.sold && (
            <Reveal delay={200}>
              <p className="mt-6 text-[0.8rem] leading-relaxed text-stone">
                {c.shownNote(stats.shown, stats.sold)}
              </p>
            </Reveal>
          )}

          {stats.detectedOn && (
            <Reveal delay={220}>
              <p className="mt-6 text-[0.8rem] leading-relaxed text-stone">
                {c.source(stats.detectedOn)}
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* La nota sui prezzi sta PRIMA della griglia, non in fondo in piccolo: è la
          prima domanda che si fa chi arriva qui, e lasciarla senza risposta finché
          non si è scorso tutto è il modo migliore per farla diventare un sospetto. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8">
          <p className="max-w-3xl border-l-2 border-red pl-5 text-[0.95rem] leading-relaxed text-graphite">
            {c.noPrice}
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
          {listings.length === 0 ? (
            <p className="max-w-xl text-[0.98rem] leading-relaxed text-graphite">{c.empty}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((p) => (
                <li key={p.slug}>
                  {/* Card volutamente scarna: niente prezzo, niente CTA commerciale.
                      Il badge "VENDUTO" è già impresso nella copertina dall'agenzia —
                      quello a schermo qui è il testo leggibile della stessa cosa, per
                      chi non vede l'immagine. */}
                  <a
                    href={`/case/${p.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-cream transition-colors duration-300 hover:border-red/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                  >
                    <span className="relative block aspect-[4/3] overflow-hidden bg-cream-deep">
                      <Image
                        src={p.cover}
                        alt={p.title}
                        fill
                        loading="lazy"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.04]"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-cream">
                        {c.cardSold}
                      </span>
                    </span>
                    <span className="flex flex-1 flex-col p-5">
                      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-stone">
                        {p.zone}
                      </span>
                      <span className="mt-2 font-display text-lg font-medium leading-snug text-ink">
                        {p.title}
                      </span>
                      <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.85rem] text-graphite">
                        <span>{p.type}</span>
                        {/\d/.test(p.sqm) && (
                          <>
                            <span aria-hidden className="h-1 w-1 rounded-full bg-graphite/50" />
                            <span className="tnum">{p.sqm}</span>
                          </>
                        )}
                      </span>
                      <span className="mt-4 inline-flex items-center gap-2 text-[0.8rem] font-semibold text-graphite transition-colors duration-300 group-hover:text-red">
                        {c.cardCta}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-cream-deep">
        <div className="mx-auto max-w-[1240px] px-5 py-20 text-center sm:px-8 sm:py-24">
          <TextLines
            as="h2"
            className="mx-auto max-w-[22ch] font-display text-d3 display-tight font-medium text-ink"
          >
            {c.ctaTitle}
          </TextLines>
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-[1.02rem] leading-relaxed text-graphite">
              {c.ctaBody}
            </p>
          </Reveal>
          <Reveal delay={180}>
            <Cta href="/#contatti" variant="cta" size="md" className="mt-8">
              {d.hero.ctaValuta}
            </Cta>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
