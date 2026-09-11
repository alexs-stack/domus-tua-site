"use client";

import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";

// `cardTitle` e `videoAria` non si rendono più (via la card flottante e il
// player disegnato a mano sulla foto): l'annuncio del play lo scrive
// LazyYouTubeEmbed nella lingua corrente. `title` è diventato `head` + `claim`:
// il titolo lungo occupava quattro righe in mezza colonna e leggeva come un
// errore di impaginazione, la frase è scesa nel paragrafo editoriale.
const copy = {
  it: {
    eyebrow: "Il nostro format esclusivo",
    head: "Open Domus.",
    claim: "Un’esperienza preparata per vendere meglio.",
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
    head: "Open Domus.",
    claim: "An experience designed to sell better.",
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
    head: "Open Domus.",
    claim: "Une expérience pensée pour mieux vendre.",
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
    head: "Open Domus.",
    claim: "Ein Erlebnis, das auf besseren Verkauf ausgelegt ist.",
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
    head: "Open Domus.",
    claim: "Una experiencia preparada para vender mejor.",
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

// Il poster è il fotogramma della storia di Teresa: 1280×510, cioè 2,5:1.
const TERESA_POSTER = "/images/reali/open-domus-teresa.jpg";

export default function OpenDomus() {
  const { locale } = useLocale();
  const c = copy[locale];
  const lists = [
    { title: c.sellerLabel, items: c.sellerBenefits },
    { title: c.buyerLabel, items: c.buyerBenefits },
  ];

  // RIVISTA BIANCA (2026-09-11): la storia di Teresa era una FOTO 1280×510
  // schiacciata in un quadrato da 589 px — ne restava il 40 % (ingrandito
  // 1,15 volte) e le due donne erano tagliate alla fronte. Ora è il video da
  // cui quel fotogramma è preso, in una scatola 16:9 larga come la mezza foto
  // del resto della home: il ritaglio toglie solo larghezza (l'altezza resta
  // intera, i volti sono interi) e la sorgente scende a 0,67x — nessun
  // ingrandimento. Niente Parallax sulla facciata: una scatola che deriva
  // mentre si mira il tasto play è un bersaglio mobile.
  return (
    <section id="open-domus" className="dt-chapter bg-cream">
      <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-center">
        {/* La scatola è più larga della colonna della griglia (42vw contro
            ~39vw): a destra deve allinearsi alla fine, o sborda dal margine. */}
        <div className="dt-media-half aspect-video! lg:order-2 lg:justify-self-end">
          <LazyYouTubeEmbed
            id={site.videos.openDomus.id}
            title={site.videos.openDomus.title}
            poster={TERESA_POSTER}
            /* Il fotogramma e' 2,5:1 dentro una scatola 16:9: con
               `object-cover` viene reso largo 1,41 volte la scatola, quindi
               i pixel che servono non sono quelli della colonna. */
            posterSizes="(max-width:1024px) 141vw, 60vw"
          />
        </div>

        <div className="lg:pr-[6vw]">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <TextLines as="h2" className="mt-6 font-display text-d2">
            {c.head}
          </TextLines>
          <Reveal>
            <p className="lead mt-6">{c.claim}</p>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-6 max-w-[60ch] text-body text-graphite">{c.intro}</p>
          </Reveal>
        </div>
      </div>

      {/* Doppio valore: chi vende e chi compra, due liste col trattino rosso.
          La seconda colonna è larga quanto la scatola video (42vw, max 640) e
          quindi comincia sulla SUA stessa linea: con due colonne uguali sarebbe
          partita 43 px più a destra del bordo del video — uno sfasamento che si
          vede e non si spiega. */}
      <div className="dt-row mt-[8vh] grid gap-[6vw] sm:grid-cols-2 lg:grid-cols-[1fr_min(42vw,640px)]">
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

      {/* Il rilancio sta in fondo, a tutta larghezza: nella mezza colonna
          l'etichetta (44 caratteri) andava a capo e la freccia restava
          appesa a destra della prima riga. */}
      <div className="dt-row mt-[6vh]">
        <Reveal delay={80}>
          <Cta href="/open-domus" variant="ghost">
            {c.cta}
          </Cta>
        </Reveal>
      </div>
    </section>
  );
}
