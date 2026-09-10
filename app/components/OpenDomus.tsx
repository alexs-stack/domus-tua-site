"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import Parallax from "./motion/Parallax";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";

// `cardTitle`, `cardText`, `videoAria` non si rendono più (via la card
// flottante e il player sulla foto), ma il record per lingua si conserva.
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
    cta: "Scopri se Open Domus è adatto al tuo immobile",
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
    cta: "See if Open Domus suits your property",
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
    cta: "Découvrez si Open Domus convient à votre bien",
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
    cta: "Prüfen Sie, ob Open Domus zu Ihrer Immobilie passt",
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
    cta: "Descubre si Open Domus encaja con tu inmueble",
    cardTitle: "Vendida en el primer Open Domus.",
    cardText: "La historia real de Teresa, contada por ella misma.",
    videoAria: "Mira la historia de Teresa, vendida en el primer Open Domus",
    imageAlt: "Raffaela Rizza con Teresa, la clienta que vendió en el primer Open Domus",
  },
};

export default function OpenDomus() {
  const { locale } = useLocale();
  const c = copy[locale];
  const lists = [
    { title: c.sellerLabel, items: c.sellerBenefits },
    { title: c.buyerLabel, items: c.buyerBenefits },
  ];

  // RIVISTA BIANCA (2026-09-10): riga piana su un solo avorio — foto grande a
  // sinistra, capitolo a destra. Via card, coni d'ombra, gradienti, timeline GSAP.
  return (
    <section id="open-domus" className="dt-chapter bg-cream">
      <div className="dt-row grid gap-[6vw] lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Lo scatto con Teresa è 1280×510 (2,5:1): in una scatola 4:5 ne
            resterebbe il 32 % della larghezza, mezza faccia a testa. Quadrata
            (ammessa dalla spec §3.3) se ne vede il 40 % e, centrata al 47 %,
            entrano entrambi i volti.
            `sizes` a 2,5× la colonna, non 1×: con object-cover la foto è resa
            larga 2,5 volte la scatola (e poi rifilata), quindi a 50vw il
            loader serviva un 720×286 stirato del doppio. Così arriva
            l'originale da 1280. */}
        <Parallax speed={-0.04}>
          <div className="relative aspect-square">
            <Image
              src="/images/reali/open-domus-teresa.jpg"
              alt={c.imageAlt}
              fill
              sizes="(max-width: 1024px) 250vw, 125vw"
              className="object-cover"
              style={{ objectPosition: "47% 50%" }}
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
          <Reveal>
            <p className="lead mt-6">{c.intro}</p>
          </Reveal>

          {/* Doppio valore: chi vende e chi compra, due liste col trattino rosso. */}
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {lists.map((list) => (
              <div key={list.title}>
                <h3 className="font-display text-d4 font-light">{list.title}</h3>
                <ul className="mt-4 flex flex-col gap-2 text-body text-graphite">
                  {list.items.map((it) => (
                    <li key={it} className="flex gap-3">
                      <span aria-hidden className="mt-3 h-px w-6 shrink-0 bg-red" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Reveal delay={100}>
            <Cta href="/open-domus" variant="ghost" className="mt-8">
              {c.cta}
            </Cta>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
