"use client";

import { useDict, useLocale } from "../components/i18n/LocaleProvider";
import PageHero from "../components/PageHero";
import ThreadNav from "../components/motion/ThreadNav";
import Highlights from "../components/Highlights";
import EditorialRows from "../components/EditorialRows";
import PropertySearch from "../components/PropertySearch";
import DomusDocProtocol from "../components/DomusDocProtocol";
import FeaturedTestimonial from "../components/FeaturedTestimonial";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";
import SectionDivider from "../components/SectionDivider";
import Reveal from "../components/Reveal";
import FaqTeaser from "../components/FaqTeaser";
import { Whatsapp } from "../components/Icons";
import { Cta } from "../components/primitives/Cta";
import { SegnoDomusCorner, SegnoDomusBadge, SegnoTick } from "../components/BrandMotif";
import { site } from "../lib/site";
import { buildWhatsAppUrl } from "../lib/forms/whatsapp";
import { FAQ_BUYER } from "../domande-frequenti/faq";
import type { GridProperty } from "../lib/properties";

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
        "Non ti mostriamo solo case. Verifichiamo i documenti prima della visita, ti diciamo cosa abbiamo controllato e restiamo con te fino al rogito.",
      alt: "Living moderno bianco e luminoso",
      primaryLabel: "Cerco casa",
      secondaryLabel: "Vedi le case in vendita",
      trust: ["Informazioni prima della visita", "Documenti verificati", "Assistenza fino al rogito"],
    },
    highlights: {
      eyebrow: "Comprare sereni",
      title: "Comprare casa è una scelta importante. Meriti chiarezza, prima di decidere.",
      intro:
        "Acquistare casa non dovrebbe significare dubbi e ansie. Con Domus Tua ogni decisione poggia su informazioni chiare e su un team al tuo fianco.",
      items: [
        {
          title: "Pregi e vincoli",
          copy: "Ti diciamo come stanno davvero le cose: pregi, vincoli e contesto di ogni immobile.",
        },
        {
          title: "Documenti verificati",
          copy: "Documentazione verificata prima della proposta: sai esattamente cosa stai acquistando.",
        },
        {
          title: "La stessa persona",
          copy: "Dalla prima visita al rogito parli sempre con la stessa persona, non con un centralino.",
        },
      ],
    },
    steps: {
      eyebrow: "Come funziona l'acquisto",
      title: "Il percorso che ti porta alle chiavi, con serenità.",
      intro: "Il percorso di chi compra — diverso da quello di chi vende, che è il Metodo Domus in nove passaggi. Qui sono quattro, e servono a scegliere bene senza fretta.",
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
          copy: "Veniamo in visita con te e mettiamo nero su bianco la documentazione: conformità, titoli e spese. Quello che non sappiamo ancora, te lo diciamo.",
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
    reassure: {
      eyebrow: "Al tuo fianco",
      title: "La casa giusta non si trova solo con un filtro.",
      intro:
        "Un filtro trova annunci; noi ti aiutiamo a interpretarli, organizziamo le visite, verifichiamo i documenti e ti seguiamo fino alla proposta e al rogito. Ecco cosa facciamo per te.",
      list: [
        "Visite organizzate su misura, senza appuntamenti a vuoto.",
        "Informazioni chiare su ogni immobile, prima ancora di entrare.",
        "Documenti condivisi con te non appena disponibili.",
        "Assistenza nella proposta, per presentarla nel modo giusto.",
        "Accompagnamento fino al rogito, con te in ogni firma.",
      ],
      ctaTitle: "Lasciaci la tua richiesta",
      ctaCopy:
        "Raccontaci che casa cerchi: zona, budget, ciò che conta per te. Ti richiamiamo noi.",
      ctaLabel: "Lasciaci la tua richiesta",
      offlineNote:
        "Non trovi ciò che cerchi tra gli annunci? Molte richieste vengono seguite prima ancora che l’immobile arrivi online: raccontaci cosa desideri.",
      aiBadge: "Ricerca intelligente",
      aiText:
        "Cerca casa scrivendo come parleresti a noi: provala nella ricerca intelligente qui sopra.",
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
        "We don’t just show you houses. We check the paperwork before the viewing, tell you what we verified, and stay with you through to the deed.",
      alt: "Bright, modern white living room",
      primaryLabel: "I’m looking for a home",
      secondaryLabel: "See the homes for sale",
      trust: ["Information before the viewing", "Verified documents", "Support all the way to closing"],
    },
    highlights: {
      eyebrow: "Buy with peace of mind",
      title: "Buying a home is an important choice. You deserve clarity, before you decide.",
      intro:
        "Buying a home shouldn’t mean doubts and anxiety. With Domus Tua every decision rests on clear information and on a team by your side.",
      items: [
        {
          title: "Strengths and limits",
          copy: "We tell you how things really are: the strengths, the constraints and the setting of every property.",
        },
        {
          title: "Documents checked",
          copy: "Documentation verified before the offer: you know exactly what you are buying.",
        },
        {
          title: "The same person",
          copy: "From the first viewing to the deed you always speak to the same person, not a switchboard.",
        },
      ],
    },
    steps: {
      eyebrow: "How buying works",
      title: "The journey that brings you to the keys, with peace of mind.",
      intro: "The buyer’s path — different from the seller’s, which is the Domus Method in nine steps. Here there are four, and they are there to help you choose well, without haste.",
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
          copy: "We come to the viewing with you and put the paperwork in writing: compliance, titles and costs. What we don’t know yet, we tell you.",
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
    reassure: {
      eyebrow: "By your side",
      title: "The right home isn’t found with a filter alone.",
      intro:
        "A filter finds listings; we help you interpret them, arrange the viewings, verify the documents and support you through to the offer and closing. Here’s what we do for you.",
      list: [
        "Viewings arranged around you, with no wasted appointments.",
        "Clear information on every property, before you even step inside.",
        "Documents shared with you as soon as they are available.",
        "Support with the offer, so it is presented the right way.",
        "Guidance all the way to closing, beside you at every signature.",
      ],
      ctaTitle: "Leave us your request",
      ctaCopy:
        "Tell us what you’re looking for: area, budget, what matters to you. We’ll call you back.",
      ctaLabel: "Leave us your request",
      offlineNote:
        "Can’t find what you want among the listings? Many requests are handled before a home even goes online: tell us what you’re after.",
      aiBadge: "Smart search",
      aiText:
        "Search for a home by writing just as you’d talk to us: try the smart search above.",
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
        "Nous ne vous montrons pas seulement des maisons. Nous contrôlons les documents avant la visite, nous vous disons ce que nous avons vérifié, et nous restons à vos côtés jusqu’à l’acte.",
      alt: "Séjour moderne, blanc et lumineux",
      primaryLabel: "Je cherche un bien",
      secondaryLabel: "Voir les biens à vendre",
      trust: ["Les informations avant la visite", "Documents vérifiés", "Accompagnement jusqu’à l’acte"],
    },
    highlights: {
      eyebrow: "Acheter sereinement",
      title: "Acheter un bien est un choix important. Vous méritez d’y voir clair, avant de décider.",
      intro:
        "Acheter une maison ne devrait pas rimer avec doutes et inquiétudes. Avec Domus Tua, chaque décision repose sur des informations claires et sur une équipe à vos côtés.",
      items: [
        {
          title: "Atouts et contraintes",
          copy: "Nous vous disons les choses telles qu’elles sont vraiment : atouts, contraintes et contexte de chaque bien.",
        },
        {
          title: "Documents vérifiés",
          copy: "Documentation vérifiée avant l’offre : vous savez exactement ce que vous achetez.",
        },
        {
          title: "La même personne",
          copy: "De la première visite à l’acte, vous parlez toujours à la même personne, pas à un standard.",
        },
      ],
    },
    steps: {
      eyebrow: "Comment se passe l’achat",
      title: "Le parcours qui vous mène jusqu’aux clés, en toute sérénité.",
      intro: "Le parcours de l’acquéreur — distinct de celui du vendeur, qui est la Méthode Domus en neuf étapes. Ici elles sont quatre, et servent à bien choisir, sans hâte.",
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
          copy: "Nous venons à la visite avec vous et mettons la documentation par écrit : conformité, titres et charges. Ce que nous ne savons pas encore, nous vous le disons.",
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
    reassure: {
      eyebrow: "À vos côtés",
      title: "Le bon bien ne se trouve pas avec un simple filtre.",
      intro:
        "Un filtre trouve des annonces ; nous vous aidons à les interpréter, organisons les visites, vérifions les documents et vous accompagnons jusqu’à l’offre et l’acte. Voici ce que nous faisons pour vous.",
      list: [
        "Des visites organisées sur mesure, sans rendez-vous inutiles.",
        "Des informations claires sur chaque bien, avant même d’entrer.",
        "Des documents partagés avec vous dès qu’ils sont disponibles.",
        "Un accompagnement pour l’offre, afin de la présenter comme il faut.",
        "Un suivi jusqu’à l’acte, à vos côtés à chaque signature.",
      ],
      ctaTitle: "Laissez-nous votre demande",
      ctaCopy:
        "Dites-nous ce que vous cherchez : secteur, budget, ce qui compte pour vous. Nous vous rappelons.",
      ctaLabel: "Laissez-nous votre demande",
      offlineNote:
        "Vous ne trouvez pas votre bonheur parmi les annonces ? Beaucoup de demandes sont suivies avant même la mise en ligne d’un bien : dites-nous ce que vous souhaitez.",
      aiBadge: "Recherche intelligente",
      aiText:
        "Cherchez un bien en écrivant comme vous nous parleriez : essayez la recherche intelligente ci-dessus.",
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
        "Wir zeigen Ihnen nicht nur Häuser. Wir prüfen die Unterlagen vor der Besichtigung, sagen Ihnen, was wir kontrolliert haben, und bleiben bis zum Notartermin an Ihrer Seite.",
      alt: "Helles, modernes weißes Wohnzimmer",
      primaryLabel: "Ich suche ein Zuhause",
      secondaryLabel: "Immobilien zum Verkauf ansehen",
      trust: ["Informationen vor der Besichtigung", "Geprüfte Unterlagen", "Begleitung bis zum Notartermin"],
    },
    highlights: {
      eyebrow: "Entspannt kaufen",
      title: "Ein Haus zu kaufen ist eine wichtige Entscheidung. Sie verdienen Klarheit, bevor Sie entscheiden.",
      intro:
        "Ein Zuhause zu kaufen sollte nicht Zweifel und Sorgen bedeuten. Mit Domus Tua ruht jede Entscheidung auf klaren Informationen und auf einem Team an Ihrer Seite.",
      items: [
        {
          title: "Vorzüge und Einschränkungen",
          copy: "Wir sagen Ihnen, wie die Dinge wirklich stehen: Vorzüge, Einschränkungen und Umfeld jeder Immobilie.",
        },
        {
          title: "Geprüfte Unterlagen",
          copy: "Unterlagen werden vor dem Angebot geprüft: Sie wissen genau, was Sie kaufen.",
        },
        {
          title: "Dieselbe Person",
          copy: "Von der ersten Besichtigung bis zum Notartermin sprechen Sie immer mit derselben Person, nicht mit einer Zentrale.",
        },
      ],
    },
    steps: {
      eyebrow: "So läuft der Kauf",
      title: "Der Weg, der Sie zu den Schlüsseln bringt, ganz entspannt.",
      intro: "Der Weg des Käufers — ein anderer als der des Verkäufers, der die Domus-Methode in neun Schritten ist. Hier sind es vier, und sie helfen, ohne Eile gut zu wählen.",
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
          copy: "Wir kommen mit zur Besichtigung und legen die Unterlagen schriftlich vor: Konformität, Titel und Kosten. Was wir noch nicht wissen, sagen wir Ihnen.",
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
    reassure: {
      eyebrow: "An Ihrer Seite",
      title: "Das richtige Zuhause findet man nicht mit einem Filter allein.",
      intro:
        "Ein Filter findet Anzeigen; wir helfen Ihnen, sie einzuordnen, organisieren die Besichtigungen, prüfen die Unterlagen und begleiten Sie bis zum Angebot und Notartermin. Das tun wir für Sie.",
      list: [
        "Besichtigungen, die auf Sie zugeschnitten sind – keine vergeblichen Termine.",
        "Klare Informationen zu jeder Immobilie, noch bevor Sie eintreten.",
        "Unterlagen, die wir mit Ihnen teilen, sobald sie verfügbar sind.",
        "Unterstützung beim Angebot, damit es richtig vorgelegt wird.",
        "Begleitung bis zum Notartermin, an Ihrer Seite bei jeder Unterschrift.",
      ],
      ctaTitle: "Hinterlassen Sie uns Ihre Anfrage",
      ctaCopy:
        "Sagen Sie uns, was Sie suchen: Lage, Budget, was Ihnen wichtig ist. Wir rufen Sie zurück.",
      ctaLabel: "Anfrage hinterlassen",
      offlineNote:
        "Sie finden nicht das Passende unter den Anzeigen? Viele Anfragen betreuen wir, bevor eine Immobilie überhaupt online geht: Sagen Sie uns, was Sie sich wünschen.",
      aiBadge: "Intelligente Suche",
      aiText:
        "Suchen Sie ein Zuhause, indem Sie schreiben, wie Sie mit uns sprechen würden: gleich oben ausprobieren.",
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
        "No solo te mostramos casas. Comprobamos los documentos antes de la visita, te decimos qué hemos verificado y seguimos contigo hasta la escritura.",
      alt: "Salón moderno blanco y luminoso",
      primaryLabel: "Busco casa",
      secondaryLabel: "Ver las casas en venta",
      trust: ["Información antes de la visita", "Documentos verificados", "Asistencia hasta la escritura"],
    },
    highlights: {
      eyebrow: "Comprar con tranquilidad",
      title: "Comprar casa es una elección importante. Mereces claridad, antes de decidir.",
      intro:
        "Comprar casa no debería significar dudas y ansiedad. Con Domus Tua cada decisión se apoya en información clara y en un equipo a tu lado.",
      items: [
        {
          title: "Ventajas y límites",
          copy: "Te contamos cómo están realmente las cosas: virtudes, limitaciones y contexto de cada inmueble.",
        },
        {
          title: "Documentos verificados",
          copy: "Documentación verificada antes de la propuesta: sabes exactamente qué estás comprando.",
        },
        {
          title: "La misma persona",
          copy: "Desde la primera visita hasta la escritura hablas siempre con la misma persona, no con una centralita.",
        },
      ],
    },
    steps: {
      eyebrow: "Cómo funciona la compra",
      title: "El recorrido que te lleva hasta las llaves, con tranquilidad.",
      intro: "El recorrido de quien compra — distinto del de quien vende, que es el Método Domus en nueve pasos. Aquí son cuatro, y sirven para elegir bien, sin prisas.",
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
          copy: "Vamos contigo a la visita y ponemos por escrito la documentación: conformidad, títulos y gastos. Lo que aún no sabemos, te lo decimos.",
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
    reassure: {
      eyebrow: "A tu lado",
      title: "La casa adecuada no se encuentra solo con un filtro.",
      intro:
        "Un filtro encuentra anuncios; nosotros te ayudamos a interpretarlos, organizamos las visitas, verificamos los documentos y te acompañamos hasta la propuesta y la escritura. Esto es lo que hacemos por ti.",
      list: [
        "Visitas organizadas a tu medida, sin citas en vano.",
        "Información clara de cada inmueble, antes incluso de entrar.",
        "Documentos compartidos contigo en cuanto están disponibles.",
        "Asistencia en la propuesta, para presentarla como corresponde.",
        "Acompañamiento hasta la escritura, contigo en cada firma.",
      ],
      ctaTitle: "Déjanos tu solicitud",
      ctaCopy:
        "Cuéntanos qué casa buscas: zona, presupuesto, lo que te importa. Te llamamos nosotros.",
      ctaLabel: "Déjanos tu solicitud",
      offlineNote:
        "¿No encuentras lo que buscas entre los anuncios? Muchas peticiones las seguimos antes incluso de que el inmueble esté online: cuéntanos qué deseas.",
      aiBadge: "Búsqueda inteligente",
      aiText:
        "Busca casa escribiendo como nos hablarías: pruébala en el buscador inteligente de arriba.",
    },
  },
};

const stepImages = [
  "/images/hero_04_living_moderno_bianco.jpg",
  "/images/rendering_03_master_bedroom_legno.jpg",
  "/images/premium_01_living_tv_divano.jpg",
  "/images/premium_03_cucina_moderna.jpg",
];

export default function AcquistaContent({ listings }: { listings: GridProperty[] }) {
  const { locale } = useLocale();
  const d = useDict();
  const c = copy[locale];

  const buySteps = c.steps.rows.map((r, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: r.title,
    copy: r.copy,
    image: stepImages[i],
    alt: r.alt,
  }));

  // WhatsApp acquirente precompilato (canale immediato, oltre al form).
  const buyerWa = buildWhatsAppUrl(
    site.whatsapp.href,
    "Ciao Domus Tua, sto cercando casa: vorrei raccontarvi zona, budget e cosa conta per me.",
  );

  return (
    <>
      {/* Filo rosso di pagina: fixed, fratello di <main> (mai sotto antenati trasformati). */}
      <ThreadNav
        chapters={[
          { id: "top", label: "Domus Tua" },
          { id: "case", label: d.nav.case },
          { id: "percorso", label: d.nav.percorso },
          { id: "recensioni", label: d.nav.recensioni },
          { id: "contatti", label: d.nav.contatti },
        ]}
      />
      <main className="flex-1">
        <PageHero
          id="top"
          eyebrow={c.hero.eyebrow}
          title={c.hero.title()}
          subcopy={c.hero.subcopy}
          image="/images/hero_04_living_moderno_bianco.jpg"
          alt={c.hero.alt}
          primary={{ label: c.hero.primaryLabel, href: "#contatti" }}
          secondary={{ label: c.hero.secondaryLabel, href: "#case" }}
          trust={c.hero.trust}
        />

        {/* Ricerca in alto: chi compra deve poter cercare subito (#case = target dell'hero). */}
        <div id="case">
          <PropertySearch properties={listings} />
        </div>

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

        <section className="bg-paper">
          <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
            <div className="grid gap-14 lg:grid-cols-[1fr_0.92fr] lg:items-start lg:gap-20">
              {/* Rassicurazione: cosa facciamo per te */}
              <Reveal>
                <span className="eyebrow">{c.reassure.eyebrow}</span>
                <h2 className="mt-5 max-w-lg font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
                  {c.reassure.title}
                </h2>
                <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-stone">
                  {c.reassure.intro}
                </p>
                <ul className="mt-9 space-y-4">
                  {c.reassure.list.map((item) => (
                    <li key={item} className="flex items-start gap-3.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                        <SegnoTick className="h-4 w-4" />
                      </span>
                      <span className="text-[0.98rem] leading-relaxed text-ink/85">{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              {/* Card lead acquirente + teaser AI */}
              <Reveal delay={120} className="lg:pt-2">
                <div className="relative overflow-hidden rounded-[2rem] border border-line bg-cream p-8 sm:p-10">
                  <SegnoDomusCorner className="right-5 top-5 opacity-70" rotate={90} size={30} />
                  <h3 className="font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-[1.7rem]">
                    {c.reassure.ctaTitle}
                  </h3>
                  <p className="mt-3 text-[0.98rem] leading-relaxed text-stone">
                    {c.reassure.ctaCopy}
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Cta href="#contatti" variant="cta" size="md">
                      {c.reassure.ctaLabel}
                    </Cta>
                    {/* Canale immediato: WhatsApp precompilato con l'intento acquirente. */}
                    <Cta
                      href={buyerWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="ghost"
                      size="md"
                      arrow={false}
                    >
                      <Whatsapp className="h-4 w-4 text-red" /> WhatsApp
                    </Cta>
                  </div>

                  <p className="mt-7 border-t border-line pt-6 text-[0.9rem] leading-relaxed text-stone">
                    {c.reassure.offlineNote}
                  </p>

                  {/* Richiamo alla ricerca intelligente (attiva) resa più in basso da <PropertySearch> */}
                  <div className="mt-7 rounded-[1.5rem] border border-dashed border-red/25 bg-paper/70 p-5">
                    <SegnoDomusBadge>{c.reassure.aiBadge}</SegnoDomusBadge>
                    <p className="mt-3.5 text-[0.95rem] leading-relaxed text-ink/80">
                      {c.reassure.aiText}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <FeaturedTestimonial
          quote={c.testimonial.quote}
          author={c.testimonial.author}
          context={c.testimonial.context}
          image="/images/reali/consulenza.jpg"
          alt={c.testimonial.alt}
          /* NIENTE videoHref: il default del componente è il video-testimonianza
             preciso (FeaturedTestimonial.tsx:195). Qui c’era l’URL del CANALE scritto
             a mano, sotto un pulsante che dice «Guarda la video recensione»: chi
             cliccava atterrava su una griglia e doveva scegliere da solo quale.
             È il difetto che il §6.5 descrive per l’hero, sopravvissuto qui. */
        />
        <DomusDocProtocol tone="cream" />
        <Reviews />

        {/* Le domande di chi compra, prima del modulo: chi sta per scrivere ha ancora
            un dubbio in testa, e spesso e' uno di questi quattro. */}
        <FaqTeaser ids={FAQ_BUYER} surface="cream" />

        <div className="bg-cream-deep">
          <SectionDivider tone="cream-deep" />
        </div>
        {/* Pagina acquirente: il form parte già sull'intento "cerco casa". */}
        <Contact initialIntent="buyer" />
      </main>
    </>
  );
}
