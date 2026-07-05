"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { ArrowUpRight, Check, Play } from "./Icons";
import { SegnoDomusCorner } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Il nostro format esclusivo",
    title: "Open Domus: un’esperienza preparata per vendere meglio.",
    intro:
      "Non una semplice visita, ma un format proprietario di Domus Tua che unisce preparazione, accoglienza, documentazione e prequalifica. Trasforma la classica visita in un momento consapevole, ordinato e professionale, per chi vende e per chi cerca casa.",
    sellerLabel: "Per chi vende",
    buyerLabel: "Per chi compra",
    sellerBenefits: [
      "Immobile preparato e valorizzato prima dell'evento",
      "Acquirenti prequalificati e visite senza caos",
      "Feedback raccolti e proposta più rapida e concreta",
    ],
    buyerBenefits: [
      "Vedi la casa al suo meglio, con luce e ordine curati",
      "Documentazione e informazioni disponibili già in visita",
      "Nessuna pressione: capisci con calma se è la casa giusta",
    ],
    cta: "Scopri Open Domus",
    cardTitle: "Venduta al primo Open Domus.",
    cardText: "La storia vera di Teresa, raccontata da lei.",
    videoAria: "Guarda la storia di Teresa, venduta al primo Open Domus",
    imageAlt: "Raffaela Rizza con Teresa, cliente che ha venduto al primo Open Domus",
  },
  en: {
    eyebrow: "Our signature format",
    title: "Open Domus: an experience designed to sell better.",
    intro:
      "Not just a viewing, but a format proprietary to Domus Tua that combines preparation, hospitality, documentation and pre-qualification. It turns the classic viewing into a considered, orderly and professional moment, for those who are selling and those who are looking for a home.",
    sellerLabel: "For sellers",
    buyerLabel: "For buyers",
    sellerBenefits: [
      "Property prepared and enhanced ahead of the event",
      "Pre-qualified buyers and viewings free of chaos",
      "Feedback collected and a faster, more concrete offer",
    ],
    buyerBenefits: [
      "See the home at its best, with light and order cared for",
      "Documentation and information available during the viewing",
      "No pressure: understand calmly if it's the right home",
    ],
    cta: "Discover Open Domus",
    cardTitle: "Sold at the very first Open Domus.",
    cardText: "Teresa's true story, told in her own words.",
    videoAria: "Watch Teresa's story, sold at the first Open Domus",
    imageAlt: "Raffaela Rizza with Teresa, the client who sold at the first Open Domus",
  },
  fr: {
    eyebrow: "Notre format signature",
    title: "Open Domus : une expérience pensée pour mieux vendre.",
    intro:
      "Pas une simple visite, mais un format propre à Domus Tua qui allie préparation, accueil, documentation et préqualification. Il transforme la visite classique en un moment réfléchi, ordonné et professionnel, pour ceux qui vendent comme pour ceux qui cherchent un logement.",
    sellerLabel: "Pour les vendeurs",
    buyerLabel: "Pour les acquéreurs",
    sellerBenefits: [
      "Bien préparé et valorisé avant l'événement",
      "Acquéreurs préqualifiés et visites sans chaos",
      "Retours recueillis et offre plus rapide et concrète",
    ],
    buyerBenefits: [
      "Voyez la maison sous son meilleur jour, lumière et ordre soignés",
      "Documentation et informations disponibles dès la visite",
      "Sans pression : comprenez sereinement si c'est la bonne maison",
    ],
    cta: "Découvrir Open Domus",
    cardTitle: "Vendue dès le premier Open Domus.",
    cardText: "La véritable histoire de Teresa, racontée par elle-même.",
    videoAria: "Regardez l'histoire de Teresa, vendue au premier Open Domus",
    imageAlt: "Raffaela Rizza avec Teresa, la cliente qui a vendu au premier Open Domus",
  },
  de: {
    eyebrow: "Unser eigenes Format",
    title: "Open Domus: ein Erlebnis, das auf besseren Verkauf ausgelegt ist.",
    intro:
      "Keine gewöhnliche Besichtigung, sondern ein Domus Tua eigenes Format, das Vorbereitung, Empfang, Dokumentation und Vorqualifizierung vereint. Es verwandelt die klassische Besichtigung in einen bewussten, geordneten und professionellen Moment – für alle, die verkaufen, und für alle, die ein Zuhause suchen.",
    sellerLabel: "Für Verkäufer",
    buyerLabel: "Für Käufer",
    sellerBenefits: [
      "Immobilie vor dem Termin vorbereitet und aufgewertet",
      "Vorqualifizierte Käufer und Besichtigungen ohne Chaos",
      "Feedback gesammelt und ein schnelleres, konkreteres Angebot",
    ],
    buyerBenefits: [
      "Sehen Sie das Zuhause von seiner besten Seite, Licht und Ordnung gepflegt",
      "Unterlagen und Informationen schon bei der Besichtigung verfügbar",
      "Ohne Druck: in Ruhe verstehen, ob es das richtige Zuhause ist",
    ],
    cta: "Open Domus entdecken",
    cardTitle: "Beim ersten Open Domus verkauft.",
    cardText: "Die wahre Geschichte von Teresa, von ihr selbst erzählt.",
    videoAria: "Sehen Sie die Geschichte von Teresa, verkauft beim ersten Open Domus",
    imageAlt: "Raffaela Rizza mit Teresa, der Kundin, die beim ersten Open Domus verkauft hat",
  },
  es: {
    eyebrow: "Nuestro formato exclusivo",
    title: "Open Domus: una experiencia preparada para vender mejor.",
    intro:
      "No una simple visita, sino un formato propio de Domus Tua que combina preparación, acogida, documentación y precualificación. Transforma la visita clásica en un momento consciente, ordenado y profesional, para quien vende y para quien busca casa.",
    sellerLabel: "Para quien vende",
    buyerLabel: "Para quien compra",
    sellerBenefits: [
      "Inmueble preparado y revalorizado antes del evento",
      "Compradores precualificados y visitas sin caos",
      "Comentarios recogidos y una propuesta más rápida y concreta",
    ],
    buyerBenefits: [
      "Ve la casa en su mejor versión, con luz y orden cuidados",
      "Documentación e información disponibles ya en la visita",
      "Sin presión: entiende con calma si es la casa adecuada",
    ],
    cta: "Descubre Open Domus",
    cardTitle: "Vendida en el primer Open Domus.",
    cardText: "La historia real de Teresa, contada por ella misma.",
    videoAria: "Mira la historia de Teresa, vendida en el primer Open Domus",
    imageAlt: "Raffaela Rizza con Teresa, la clienta que vendió en el primer Open Domus",
  },
};

export default function OpenDomus() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section id="open-domus" className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Visual */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative rounded-[2rem] border border-line bg-cream p-2">
              <SegnoDomusCorner className="left-3.5 top-3.5 z-10" rotate={0} />
              <a
                href="https://www.youtube.com/watch?v=gYePYQHNTUM"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={c.videoAria}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[calc(2rem-0.5rem)] sm:aspect-[5/5]"
              >
                <Image
                  src="/images/reali/raffaela-founder.jpg"
                  alt={c.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-6 w-6" />
                </span>
              </a>
              {/* card flottante */}
              <div className="absolute -bottom-5 left-5 right-5 rounded-2xl border border-line bg-paper px-5 py-4 shadow-[0_30px_60px_-40px_rgba(26,24,22,0.6)] sm:left-auto sm:right-6 sm:w-64">
                <p className="font-display text-lg font-medium text-ink">{c.cardTitle}</p>
                <p className="mt-1 text-sm text-stone">
                  {c.cardText}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Content */}
          <Reveal className="order-1 lg:order-2" delay={100}>
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {c.title}
            </h2>
            <p className="mt-6 max-w-lg text-[1.02rem] leading-relaxed text-stone">
              {c.intro}
            </p>

            {/* Doppio valore: Open Domus lavora sia per chi vende sia per chi compra. */}
            <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {[
                { label: c.sellerLabel, items: c.sellerBenefits },
                { label: c.buyerLabel, items: c.buyerBenefits },
              ].map((grp) => (
                <div key={grp.label}>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-red-dark">
                    {grp.label}
                  </p>
                  <ul className="mt-3 flex flex-col gap-3">
                    {grp.items.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-[0.92rem] text-graphite">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                          <Check className="h-3 w-3" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <a
              href="#contatti"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
            >
              {c.cta}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
