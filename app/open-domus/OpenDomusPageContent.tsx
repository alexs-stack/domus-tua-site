"use client";

import { useLocale } from "../components/i18n/LocaleProvider";
import PageHero from "../components/PageHero";
import OpenDomus from "../components/OpenDomus";
import Highlights from "../components/Highlights";
import EditorialRows from "../components/EditorialRows";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";

const copy = {
  it: {
    heroEyebrow: "Asset proprietario",
    heroTitle: () => (
      <>
        Open Domus.
        <br />
        <span className="text-red-soft">Un evento, non una visita.</span>
      </>
    ),
    heroSubcopy:
      "Un format evoluto che unisce preparazione, accoglienza, documentazione e prequalifica. Trasforma la visita in un momento consapevole, ordinato e professionale.",
    heroAlt: "Living moderno con accenti senape",
    heroPrimary: "Organizza il tuo Open Domus",
    heroSecondary: "Come si svolge",

    highlightsEyebrow: "Perché è diverso",
    highlightsTitle: "Non è un open house. È un’esperienza preparata.",
    highlightsIntro:
      "La differenza non sta nell’aprire le porte, ma in tutto quello che succede prima e durante.",
    highlightsItems: [
      {
        title: "Per chi vende",
        copy: "Più interesse concentrato, immobile valorizzato e proposte più qualificate, in meno tempo.",
      },
      {
        title: "Per chi acquista",
        copy: "Informazioni chiare e documenti già disponibili: si visita con consapevolezza, senza ansie.",
      },
      {
        title: "Per tutti",
        copy: "Un’esperienza ordinata e professionale, che rende la compravendita un momento sereno.",
      },
    ],

    rowsEyebrow: "Come si svolge",
    rowsTitle: "Dietro ogni Open Domus, un metodo.",
    phases: [
      {
        title: "Preparazione dell’immobile",
        copy: "Prima dell’evento la casa viene valorizzata: ordine, luce, dettagli e, dove serve, home staging. L’immobile si presenta al meglio.",
        alt: "Sala preparata con home staging",
      },
      {
        title: "Accoglienza e materiali",
        copy: "Chi arriva trova documentazione chiara e materiali informativi: caratteristiche, planimetrie, contesto. Tutto quello che serve per decidere con serenità.",
        alt: "Living accogliente con zona pranzo",
      },
      {
        title: "Visite organizzate",
        copy: "Gli acquirenti prequalificati visitano in modo ordinato, senza caos e senza sovrapposizioni. Un’esperienza professionale per tutti.",
        alt: "Living open space con cucina",
      },
      {
        title: "Feedback e proposte",
        copy: "Raccogliamo i feedback e gestiamo le proposte con trasparenza. Spesso la proposta giusta arriva più in fretta del previsto.",
        alt: "Soggiorno arredato",
      },
    ],
  },
  en: {
    heroEyebrow: "Proprietary asset",
    heroTitle: () => (
      <>
        Open Domus.
        <br />
        <span className="text-red-soft">An event, not a viewing.</span>
      </>
    ),
    heroSubcopy:
      "A refined format that brings together preparation, hospitality, documentation and pre-qualification. It turns a viewing into a considered, orderly and professional moment.",
    heroAlt: "Modern living room with mustard accents",
    heroPrimary: "Organise your Open Domus",
    heroSecondary: "How it works",

    highlightsEyebrow: "Why it’s different",
    highlightsTitle: "It isn’t an open house. It’s a prepared experience.",
    highlightsIntro:
      "The difference isn’t in opening the doors, but in everything that happens before and during.",
    highlightsItems: [
      {
        title: "For sellers",
        copy: "More concentrated interest, a home shown at its best and more qualified offers, in less time.",
      },
      {
        title: "For buyers",
        copy: "Clear information and documents already at hand: you visit with full awareness, without anxiety.",
      },
      {
        title: "For everyone",
        copy: "An orderly, professional experience that makes buying and selling a calm moment.",
      },
    ],

    rowsEyebrow: "How it works",
    rowsTitle: "Behind every Open Domus, a method.",
    phases: [
      {
        title: "Preparing the property",
        copy: "Before the event the home is enhanced: tidiness, light, detail and, where needed, home staging. The property shows at its very best.",
        alt: "Room prepared with home staging",
      },
      {
        title: "Welcome and materials",
        copy: "Everyone who arrives finds clear documentation and informative materials: features, floor plans, context. Everything needed to decide with peace of mind.",
        alt: "Welcoming living room with dining area",
      },
      {
        title: "Organised viewings",
        copy: "Pre-qualified buyers visit in an orderly way, without chaos and without overlaps. A professional experience for everyone.",
        alt: "Open-plan living room with kitchen",
      },
      {
        title: "Feedback and offers",
        copy: "We gather feedback and handle offers with transparency. Often the right offer arrives sooner than expected.",
        alt: "Furnished living room",
      },
    ],
  },
  fr: {
    heroEyebrow: "Atout propriétaire",
    heroTitle: () => (
      <>
        Open Domus.
        <br />
        <span className="text-red-soft">Un événement, pas une visite.</span>
      </>
    ),
    heroSubcopy:
      "Un format évolué qui réunit préparation, accueil, documentation et préqualification. Il transforme la visite en un moment réfléchi, ordonné et professionnel.",
    heroAlt: "Séjour moderne aux accents moutarde",
    heroPrimary: "Organisez votre Open Domus",
    heroSecondary: "Comment ça se passe",

    highlightsEyebrow: "Pourquoi c’est différent",
    highlightsTitle: "Ce n’est pas une porte ouverte. C’est une expérience préparée.",
    highlightsIntro:
      "La différence ne tient pas au fait d’ouvrir les portes, mais à tout ce qui se passe avant et pendant.",
    highlightsItems: [
      {
        title: "Pour ceux qui vendent",
        copy: "Un intérêt plus concentré, un bien mis en valeur et des offres plus qualifiées, en moins de temps.",
      },
      {
        title: "Pour ceux qui achètent",
        copy: "Des informations claires et des documents déjà disponibles : on visite en toute conscience, sans appréhension.",
      },
      {
        title: "Pour tous",
        copy: "Une expérience ordonnée et professionnelle, qui fait de la vente un moment serein.",
      },
    ],

    rowsEyebrow: "Comment ça se passe",
    rowsTitle: "Derrière chaque Open Domus, une méthode.",
    phases: [
      {
        title: "Préparation du bien",
        copy: "Avant l’événement, la maison est mise en valeur : ordre, lumière, détails et, si besoin, home staging. Le bien se présente sous son meilleur jour.",
        alt: "Salon préparé avec home staging",
      },
      {
        title: "Accueil et documents",
        copy: "Chaque visiteur trouve une documentation claire et des supports d’information : caractéristiques, plans, environnement. Tout ce qu’il faut pour décider sereinement.",
        alt: "Salon chaleureux avec coin repas",
      },
      {
        title: "Visites organisées",
        copy: "Les acquéreurs préqualifiés visitent de façon ordonnée, sans confusion ni chevauchements. Une expérience professionnelle pour tous.",
        alt: "Séjour ouvert avec cuisine",
      },
      {
        title: "Retours et offres",
        copy: "Nous recueillons les retours et gérons les offres en toute transparence. Souvent, la bonne offre arrive plus vite que prévu.",
        alt: "Salon meublé",
      },
    ],
  },
  de: {
    heroEyebrow: "Eigenes Format",
    heroTitle: () => (
      <>
        Open Domus.
        <br />
        <span className="text-red-soft">Ein Event, keine Besichtigung.</span>
      </>
    ),
    heroSubcopy:
      "Ein durchdachtes Format, das Vorbereitung, Empfang, Dokumentation und Vorqualifizierung vereint. Es verwandelt die Besichtigung in einen bewussten, geordneten und professionellen Moment.",
    heroAlt: "Modernes Wohnzimmer mit senffarbenen Akzenten",
    heroPrimary: "Organisieren Sie Ihr Open Domus",
    heroSecondary: "So läuft es ab",

    highlightsEyebrow: "Warum es anders ist",
    highlightsTitle: "Kein Tag der offenen Tür. Ein vorbereitetes Erlebnis.",
    highlightsIntro:
      "Der Unterschied liegt nicht im Öffnen der Türen, sondern in allem, was davor und währenddessen geschieht.",
    highlightsItems: [
      {
        title: "Für Verkäufer",
        copy: "Mehr gebündeltes Interesse, eine ideal präsentierte Immobilie und qualifiziertere Angebote, in kürzerer Zeit.",
      },
      {
        title: "Für Käufer",
        copy: "Klare Informationen und bereits verfügbare Unterlagen: Sie besichtigen mit voller Sicherheit, ganz ohne Sorge.",
      },
      {
        title: "Für alle",
        copy: "Ein geordnetes, professionelles Erlebnis, das den Kauf und Verkauf zu einem gelassenen Moment macht.",
      },
    ],

    rowsEyebrow: "So läuft es ab",
    rowsTitle: "Hinter jedem Open Domus steht eine Methode.",
    phases: [
      {
        title: "Vorbereitung der Immobilie",
        copy: "Vor dem Event wird das Haus in Szene gesetzt: Ordnung, Licht, Details und, wo nötig, Home Staging. Die Immobilie zeigt sich von ihrer besten Seite.",
        alt: "Mit Home Staging vorbereiteter Raum",
      },
      {
        title: "Empfang und Unterlagen",
        copy: "Wer kommt, findet klare Dokumentation und informative Unterlagen: Ausstattung, Grundrisse, Umfeld. Alles, was man braucht, um in Ruhe zu entscheiden.",
        alt: "Einladendes Wohnzimmer mit Essbereich",
      },
      {
        title: "Organisierte Besichtigungen",
        copy: "Vorqualifizierte Käufer besichtigen geordnet, ohne Chaos und ohne Überschneidungen. Ein professionelles Erlebnis für alle.",
        alt: "Offenes Wohnzimmer mit Küche",
      },
      {
        title: "Rückmeldungen und Angebote",
        copy: "Wir sammeln die Rückmeldungen und behandeln die Angebote transparent. Oft kommt das richtige Angebot schneller als gedacht.",
        alt: "Eingerichtetes Wohnzimmer",
      },
    ],
  },
  es: {
    heroEyebrow: "Formato propio",
    heroTitle: () => (
      <>
        Open Domus.
        <br />
        <span className="text-red-soft">Un evento, no una visita.</span>
      </>
    ),
    heroSubcopy:
      "Un formato evolucionado que reúne preparación, acogida, documentación y precalificación. Convierte la visita en un momento consciente, ordenado y profesional.",
    heroAlt: "Salón moderno con acentos mostaza",
    heroPrimary: "Organiza tu Open Domus",
    heroSecondary: "Cómo se desarrolla",

    highlightsEyebrow: "Por qué es diferente",
    highlightsTitle: "No es una jornada de puertas abiertas. Es una experiencia preparada.",
    highlightsIntro:
      "La diferencia no está en abrir las puertas, sino en todo lo que ocurre antes y durante.",
    highlightsItems: [
      {
        title: "Para quien vende",
        copy: "Más interés concentrado, un inmueble realzado y propuestas más cualificadas, en menos tiempo.",
      },
      {
        title: "Para quien compra",
        copy: "Información clara y documentos ya disponibles: se visita con conciencia, sin inquietudes.",
      },
      {
        title: "Para todos",
        copy: "Una experiencia ordenada y profesional, que hace de la compraventa un momento sereno.",
      },
    ],

    rowsEyebrow: "Cómo se desarrolla",
    rowsTitle: "Detrás de cada Open Domus, un método.",
    phases: [
      {
        title: "Preparación del inmueble",
        copy: "Antes del evento la casa se realza: orden, luz, detalles y, donde hace falta, home staging. El inmueble se presenta en su mejor versión.",
        alt: "Sala preparada con home staging",
      },
      {
        title: "Acogida y materiales",
        copy: "Quien llega encuentra documentación clara y materiales informativos: características, planos, entorno. Todo lo necesario para decidir con tranquilidad.",
        alt: "Salón acogedor con zona de comedor",
      },
      {
        title: "Visitas organizadas",
        copy: "Los compradores precalificados visitan de forma ordenada, sin caos ni solapamientos. Una experiencia profesional para todos.",
        alt: "Salón abierto con cocina",
      },
      {
        title: "Comentarios y propuestas",
        copy: "Recogemos los comentarios y gestionamos las propuestas con transparencia. A menudo la propuesta adecuada llega antes de lo previsto.",
        alt: "Salón amueblado",
      },
    ],
  },
};

const phaseMeta = [
  { n: "01", image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg" },
  { n: "02", image: "/images/premium_02_living_dining_piante.jpg" },
  { n: "03", image: "/images/hero_05_living_cucina_tavolo.jpg" },
  { n: "04", image: "/images/premium_01_living_tv_divano.jpg" },
];

export default function OpenDomusPageContent() {
  const { locale } = useLocale();
  const c = copy[locale];

  const phases = phaseMeta.map((meta, i) => ({
    n: meta.n,
    image: meta.image,
    title: c.phases[i].title,
    copy: c.phases[i].copy,
    alt: c.phases[i].alt,
  }));

  return (
    <main className="flex-1">
      <PageHero
        eyebrow={c.heroEyebrow}
        title={c.heroTitle()}
        subcopy={c.heroSubcopy}
        image="/images/premium_05_living_accenti_senape.jpg"
        alt={c.heroAlt}
        primary={{ label: c.heroPrimary, href: "#contatti" }}
        secondary={{ label: c.heroSecondary, href: "#percorso" }}
      />

      <OpenDomus />

      <Highlights
        tone="cream"
        eyebrow={c.highlightsEyebrow}
        title={c.highlightsTitle}
        intro={c.highlightsIntro}
        items={c.highlightsItems}
      />

      <EditorialRows
        id="percorso"
        eyebrow={c.rowsEyebrow}
        title={c.rowsTitle}
        rows={phases}
      />

      <Reviews />
      <Contact />
    </main>
  );
}
