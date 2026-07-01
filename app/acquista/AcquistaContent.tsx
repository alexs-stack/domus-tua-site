"use client";

import { useLocale } from "../components/i18n/LocaleProvider";
import PageHero from "../components/PageHero";
import Highlights from "../components/Highlights";
import EditorialRows from "../components/EditorialRows";
import PropertySearch from "../components/PropertySearch";
import DomusDocProtocol from "../components/DomusDocProtocol";
import FeaturedTestimonial from "../components/FeaturedTestimonial";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";
import SectionDivider from "../components/SectionDivider";
import type { Property } from "../lib/properties";

const copy = {
  it: {
    hero: {
      eyebrow: "Per chi acquista",
      title: () => (
        <>
          Acquistare casa,
          <br />
          <span className="text-red-soft">con sicurezza.</span>
        </>
      ),
      subcopy:
        "Non ti mostriamo solo case. Ti accompagniamo verso una scelta sicura, con informazioni chiare, documenti verificati e assistenza in ogni passaggio.",
      alt: "Living moderno bianco e luminoso",
      primaryLabel: "Cerco casa",
      secondaryLabel: "Vedi le case",
      trust: ["Informazioni prima della visita", "Documenti verificati", "Assistenza fino al rogito"],
    },
    highlights: {
      eyebrow: "Comprare sereni",
      title: "Una casa è una scelta importante. Meriti di farla informato.",
      intro:
        "Acquistare casa non dovrebbe significare dubbi e ansie. Con Domus Tua ogni decisione poggia su informazioni chiare e su un team al tuo fianco.",
      items: [
        {
          title: "Trasparenza totale",
          copy: "Ti diciamo come stanno davvero le cose: pregi, vincoli e contesto di ogni immobile.",
        },
        {
          title: "Nessuna sorpresa",
          copy: "Documentazione verificata prima della proposta: sai esattamente cosa stai acquistando.",
        },
        {
          title: "Sempre accompagnato",
          copy: "Dalla prima visita al rogito, hai un riferimento che ti guida in ogni passaggio.",
        },
      ],
    },
    steps: {
      eyebrow: "Come funziona l'acquisto",
      title: "Il percorso che ti porta alle chiavi, con serenità.",
      intro: "Un metodo chiaro per scegliere bene, senza fretta e senza pressioni.",
      rows: [
        {
          title: "Ricerca mirata",
          copy: "Ascoltiamo cosa cerchi davvero e selezioniamo solo immobili coerenti con le tue esigenze e il tuo budget. Niente visite a vuoto.",
          alt: "Living moderno e luminoso",
        },
        {
          title: "Le risposte prima della visita",
          copy: "Prima di una visita vogliamo che tu abbia già le informazioni importanti: caratteristiche, documenti, contesto. Così entri in casa con consapevolezza.",
          alt: "Camera da letto con finiture in legno",
        },
        {
          title: "Visite guidate e documenti chiari",
          copy: "Ti accompagniamo in visita e mettiamo nero su bianco la documentazione, con trasparenza totale su ogni aspetto dell'immobile.",
          alt: "Soggiorno arredato con divano",
        },
        {
          title: "Proposta, trattativa e rogito",
          copy: "Ti supportiamo nella proposta, nella negoziazione e in ogni passaggio fino alla firma. Compri con sicurezza, non con ansia.",
          alt: "Cucina moderna",
        },
      ],
    },
    testimonial: {
      quote:
        "Ci siamo sentiti accompagnati in ogni passaggio, fino al rogito. Informazioni chiare e trasparenza totale: abbiamo scelto senza ansie.",
      author: "Cliente Domus Tua",
      context: "Acquisto seguito fino al rogito, Tradate",
      alt: "Il team Domus Tua con una cliente nella sede di Tradate",
    },
  },
  en: {
    hero: {
      eyebrow: "For buyers",
      title: () => (
        <>
          Buying a home,
          <br />
          <span className="text-red-soft">with confidence.</span>
        </>
      ),
      subcopy:
        "We don’t just show you houses. We guide you towards a confident choice, with clear information, verified documents and support at every step.",
      alt: "Bright, modern white living room",
      primaryLabel: "I’m looking for a home",
      secondaryLabel: "See the homes",
      trust: ["Information before the viewing", "Verified documents", "Support all the way to closing"],
    },
    highlights: {
      eyebrow: "Buy with peace of mind",
      title: "A home is an important choice. You deserve to make it well informed.",
      intro:
        "Buying a home shouldn’t mean doubts and anxiety. With Domus Tua every decision rests on clear information and on a team by your side.",
      items: [
        {
          title: "Complete transparency",
          copy: "We tell you how things really are: the strengths, the constraints and the setting of every property.",
        },
        {
          title: "No surprises",
          copy: "Documentation verified before the offer: you know exactly what you are buying.",
        },
        {
          title: "Always accompanied",
          copy: "From the first viewing to closing, you have a point of reference guiding you at every step.",
        },
      ],
    },
    steps: {
      eyebrow: "How buying works",
      title: "The journey that brings you to the keys, with peace of mind.",
      intro: "A clear method to choose well, without haste and without pressure.",
      rows: [
        {
          title: "Targeted search",
          copy: "We listen to what you’re really looking for and select only properties that match your needs and your budget. No pointless viewings.",
          alt: "Bright, modern living room",
        },
        {
          title: "The answers before the viewing",
          copy: "Before a viewing we want you to already have the important information: features, documents, context. So you walk in with full awareness.",
          alt: "Bedroom with wood finishes",
        },
        {
          title: "Guided viewings and clear documents",
          copy: "We accompany you on the viewing and put the documentation in writing, with total transparency on every aspect of the property.",
          alt: "Living room furnished with a sofa",
        },
        {
          title: "Offer, negotiation and closing",
          copy: "We support you with the offer, the negotiation and every step up to signing. You buy with confidence, not anxiety.",
          alt: "Modern kitchen",
        },
      ],
    },
    testimonial: {
      quote:
        "We felt supported at every step, all the way to closing. Clear information and total transparency: we chose without any worries.",
      author: "Domus Tua client",
      context: "Purchase followed through to closing, Tradate",
      alt: "The Domus Tua team with a client at the Tradate office",
    },
  },
  fr: {
    hero: {
      eyebrow: "Pour ceux qui achètent",
      title: () => (
        <>
          Acheter une maison,
          <br />
          <span className="text-red-soft">en toute sérénité.</span>
        </>
      ),
      subcopy:
        "Nous ne vous montrons pas seulement des maisons. Nous vous accompagnons vers un choix serein, avec des informations claires, des documents vérifiés et un soutien à chaque étape.",
      alt: "Séjour moderne, blanc et lumineux",
      primaryLabel: "Je cherche une maison",
      secondaryLabel: "Voir les biens",
      trust: ["Les informations avant la visite", "Documents vérifiés", "Accompagnement jusqu’à l’acte"],
    },
    highlights: {
      eyebrow: "Acheter sereinement",
      title: "Une maison est un choix important. Vous méritez de le faire en connaissance de cause.",
      intro:
        "Acheter une maison ne devrait pas rimer avec doutes et inquiétudes. Avec Domus Tua, chaque décision repose sur des informations claires et sur une équipe à vos côtés.",
      items: [
        {
          title: "Transparence totale",
          copy: "Nous vous disons les choses telles qu’elles sont vraiment : atouts, contraintes et contexte de chaque bien.",
        },
        {
          title: "Aucune surprise",
          copy: "Documentation vérifiée avant l’offre : vous savez exactement ce que vous achetez.",
        },
        {
          title: "Toujours accompagné",
          copy: "De la première visite à l’acte, vous avez un interlocuteur qui vous guide à chaque étape.",
        },
      ],
    },
    steps: {
      eyebrow: "Comment se passe l’achat",
      title: "Le parcours qui vous mène jusqu’aux clés, en toute sérénité.",
      intro: "Une méthode claire pour bien choisir, sans hâte et sans pression.",
      rows: [
        {
          title: "Recherche ciblée",
          copy: "Nous écoutons ce que vous cherchez vraiment et sélectionnons uniquement des biens en accord avec vos besoins et votre budget. Aucune visite inutile.",
          alt: "Séjour moderne et lumineux",
        },
        {
          title: "Les réponses avant la visite",
          copy: "Avant une visite, nous voulons que vous ayez déjà les informations importantes : caractéristiques, documents, contexte. Ainsi vous entrez en toute connaissance de cause.",
          alt: "Chambre avec finitions en bois",
        },
        {
          title: "Visites guidées et documents clairs",
          copy: "Nous vous accompagnons en visite et mettons la documentation noir sur blanc, avec une transparence totale sur chaque aspect du bien.",
          alt: "Salon meublé avec un canapé",
        },
        {
          title: "Offre, négociation et acte",
          copy: "Nous vous soutenons pour l’offre, la négociation et chaque étape jusqu’à la signature. Vous achetez en toute confiance, sans stress.",
          alt: "Cuisine moderne",
        },
      ],
    },
    testimonial: {
      quote:
        "Nous nous sommes sentis accompagnés à chaque étape, jusqu’à l’acte. Des informations claires et une transparence totale : nous avons choisi sans inquiétude.",
      author: "Client Domus Tua",
      context: "Achat suivi jusqu’à l’acte, Tradate",
      alt: "L’équipe Domus Tua avec une cliente au bureau de Tradate",
    },
  },
  de: {
    hero: {
      eyebrow: "Für Käufer",
      title: () => (
        <>
          Ein Zuhause kaufen,
          <br />
          <span className="text-red-soft">mit Sicherheit.</span>
        </>
      ),
      subcopy:
        "Wir zeigen Ihnen nicht nur Häuser. Wir begleiten Sie zu einer sicheren Entscheidung, mit klaren Informationen, geprüften Unterlagen und Unterstützung bei jedem Schritt.",
      alt: "Helles, modernes weißes Wohnzimmer",
      primaryLabel: "Ich suche ein Zuhause",
      secondaryLabel: "Immobilien ansehen",
      trust: ["Informationen vor der Besichtigung", "Geprüfte Unterlagen", "Begleitung bis zum Notartermin"],
    },
    highlights: {
      eyebrow: "Entspannt kaufen",
      title: "Ein Zuhause ist eine wichtige Entscheidung. Sie verdienen es, sie gut informiert zu treffen.",
      intro:
        "Ein Zuhause zu kaufen sollte nicht Zweifel und Sorgen bedeuten. Mit Domus Tua ruht jede Entscheidung auf klaren Informationen und auf einem Team an Ihrer Seite.",
      items: [
        {
          title: "Vollständige Transparenz",
          copy: "Wir sagen Ihnen, wie die Dinge wirklich stehen: Vorzüge, Einschränkungen und Umfeld jeder Immobilie.",
        },
        {
          title: "Keine Überraschungen",
          copy: "Unterlagen werden vor dem Angebot geprüft: Sie wissen genau, was Sie kaufen.",
        },
        {
          title: "Immer begleitet",
          copy: "Von der ersten Besichtigung bis zum Notartermin haben Sie einen Ansprechpartner, der Sie bei jedem Schritt führt.",
        },
      ],
    },
    steps: {
      eyebrow: "So läuft der Kauf",
      title: "Der Weg, der Sie zu den Schlüsseln bringt, ganz entspannt.",
      intro: "Eine klare Methode, um gut zu wählen, ohne Eile und ohne Druck.",
      rows: [
        {
          title: "Gezielte Suche",
          copy: "Wir hören zu, was Sie wirklich suchen, und wählen nur Immobilien aus, die zu Ihren Bedürfnissen und Ihrem Budget passen. Keine vergeblichen Besichtigungen.",
          alt: "Helles, modernes Wohnzimmer",
        },
        {
          title: "Die Antworten vor der Besichtigung",
          copy: "Vor einer Besichtigung möchten wir, dass Sie die wichtigen Informationen bereits haben: Eigenschaften, Unterlagen, Umfeld. So betreten Sie das Haus mit voller Klarheit.",
          alt: "Schlafzimmer mit Holzausstattung",
        },
        {
          title: "Begleitete Besichtigungen und klare Unterlagen",
          copy: "Wir begleiten Sie bei der Besichtigung und halten die Unterlagen schriftlich fest, mit völliger Transparenz zu jedem Aspekt der Immobilie.",
          alt: "Mit einem Sofa eingerichtetes Wohnzimmer",
        },
        {
          title: "Angebot, Verhandlung und Notartermin",
          copy: "Wir unterstützen Sie beim Angebot, bei der Verhandlung und bei jedem Schritt bis zur Unterschrift. Sie kaufen mit Sicherheit, nicht mit Sorge.",
          alt: "Moderne Küche",
        },
      ],
    },
    testimonial: {
      quote:
        "Wir haben uns bei jedem Schritt begleitet gefühlt, bis zum Notartermin. Klare Informationen und völlige Transparenz: Wir haben ohne Sorgen gewählt.",
      author: "Kunde von Domus Tua",
      context: "Kauf bis zum Notartermin begleitet, Tradate",
      alt: "Das Team von Domus Tua mit einer Kundin im Büro in Tradate",
    },
  },
  es: {
    hero: {
      eyebrow: "Para quien compra",
      title: () => (
        <>
          Comprar casa,
          <br />
          <span className="text-red-soft">con seguridad.</span>
        </>
      ),
      subcopy:
        "No solo te mostramos casas. Te acompañamos hacia una elección segura, con información clara, documentos verificados y asistencia en cada paso.",
      alt: "Salón moderno blanco y luminoso",
      primaryLabel: "Busco casa",
      secondaryLabel: "Ver las casas",
      trust: ["Información antes de la visita", "Documentos verificados", "Asistencia hasta la escritura"],
    },
    highlights: {
      eyebrow: "Comprar con tranquilidad",
      title: "Una casa es una elección importante. Mereces hacerla bien informado.",
      intro:
        "Comprar casa no debería significar dudas y ansiedad. Con Domus Tua cada decisión se apoya en información clara y en un equipo a tu lado.",
      items: [
        {
          title: "Transparencia total",
          copy: "Te contamos cómo están realmente las cosas: virtudes, limitaciones y contexto de cada inmueble.",
        },
        {
          title: "Ninguna sorpresa",
          copy: "Documentación verificada antes de la propuesta: sabes exactamente qué estás comprando.",
        },
        {
          title: "Siempre acompañado",
          copy: "Desde la primera visita hasta la escritura, tienes un referente que te guía en cada paso.",
        },
      ],
    },
    steps: {
      eyebrow: "Cómo funciona la compra",
      title: "El recorrido que te lleva hasta las llaves, con tranquilidad.",
      intro: "Un método claro para elegir bien, sin prisas y sin presiones.",
      rows: [
        {
          title: "Búsqueda selectiva",
          copy: "Escuchamos lo que buscas de verdad y seleccionamos solo inmuebles acordes con tus necesidades y tu presupuesto. Sin visitas en vano.",
          alt: "Salón moderno y luminoso",
        },
        {
          title: "Las respuestas antes de la visita",
          copy: "Antes de una visita queremos que ya tengas la información importante: características, documentos, contexto. Así entras en casa con conocimiento.",
          alt: "Dormitorio con acabados en madera",
        },
        {
          title: "Visitas guiadas y documentos claros",
          copy: "Te acompañamos en la visita y ponemos por escrito la documentación, con transparencia total sobre cada aspecto del inmueble.",
          alt: "Salón amueblado con sofá",
        },
        {
          title: "Propuesta, negociación y escritura",
          copy: "Te apoyamos en la propuesta, en la negociación y en cada paso hasta la firma. Compras con seguridad, no con ansiedad.",
          alt: "Cocina moderna",
        },
      ],
    },
    testimonial: {
      quote:
        "Nos sentimos acompañados en cada paso, hasta la escritura. Información clara y transparencia total: elegimos sin ansiedad.",
      author: "Cliente de Domus Tua",
      context: "Compra acompañada hasta la escritura, Tradate",
      alt: "El equipo de Domus Tua con una clienta en la sede de Tradate",
    },
  },
};

const stepImages = [
  "/images/hero_04_living_moderno_bianco.jpg",
  "/images/rendering_03_master_bedroom_legno.jpg",
  "/images/premium_01_living_tv_divano.jpg",
  "/images/premium_03_cucina_moderna.jpg",
];

export default function AcquistaContent({ listings }: { listings: Property[] }) {
  const { locale } = useLocale();
  const c = copy[locale];

  const buySteps = c.steps.rows.map((r, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: r.title,
    copy: r.copy,
    image: stepImages[i],
    alt: r.alt,
  }));

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={c.hero.eyebrow}
        title={c.hero.title()}
        subcopy={c.hero.subcopy}
        image="/images/hero_04_living_moderno_bianco.jpg"
        alt={c.hero.alt}
        primary={{ label: c.hero.primaryLabel, href: "#contatti" }}
        secondary={{ label: c.hero.secondaryLabel, href: "#case" }}
        trust={c.hero.trust}
      />

      <Highlights
        eyebrow={c.highlights.eyebrow}
        title={c.highlights.title}
        intro={c.highlights.intro}
        items={c.highlights.items}
      />

      <EditorialRows
        id="percorso"
        eyebrow={c.steps.eyebrow}
        title={c.steps.title}
        intro={c.steps.intro}
        rows={buySteps}
      />

      <PropertySearch properties={listings} />
      <FeaturedTestimonial
        quote={c.testimonial.quote}
        author={c.testimonial.author}
        context={c.testimonial.context}
        image="/images/reali/open-domus-teresa.jpg"
        alt={c.testimonial.alt}
        videoHref="https://www.youtube.com/@DOMUSTUASRLIMMOBILIARE"
      />
      <DomusDocProtocol tone="cream" />
      <Reviews />
      <div className="bg-cream-deep">
        <SectionDivider tone="cream-deep" />
      </div>
      <Contact />
    </main>
  );
}
