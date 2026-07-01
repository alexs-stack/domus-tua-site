"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "../components/i18n/LocaleProvider";
import Reveal from "../components/Reveal";
import PageHero from "../components/PageHero";
import OpenDomus from "../components/OpenDomus";
import Highlights from "../components/Highlights";
import EditorialRows from "../components/EditorialRows";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";
import { ArrowUpRight, ArrowRight, Check, Play } from "../components/Icons";
import {
  SegnoDomusBadge,
  SegnoDomusCorner,
  SegnoDomusDivider,
} from "../components/BrandMotif";

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
    heroPrimary: "Vorrei vendere con Open Domus",
    heroSecondary: "Come si svolge",
    heroSubtitle: "Non una semplice visita. Un’esperienza preparata per vendere meglio.",

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

    compareEyebrow: "La differenza",
    compareTitle: "Non è un open house all’americana.",
    compareIntro:
      "L’open house classico apre le porte e spera. Open Domus prepara, seleziona e accompagna: il risultato è un altro livello.",
    compareOldLabel: "Open house classico",
    compareNewLabel: "Open Domus",
    compareOld: [
      "Porte aperte a chiunque, senza filtro",
      "Immobile mostrato così com’è",
      "Nessuna documentazione a portata di mano",
      "Visite affollate e caotiche",
      "Curiosi al posto di acquirenti reali",
    ],
    compareNew: [
      "Acquirenti prequalificati e realmente interessati",
      "Immobile preparato e valorizzato prima dell’evento",
      "Documenti e planimetrie pronti dal primo istante",
      "Visite ordinate, per appuntamento, senza sovrapposizioni",
      "Feedback strutturati e proposte più rapide",
    ],

    videoEyebrow: "La prova, in video",
    videoTitle: "Venduta al primo Open Domus.",
    videoText:
      "Teresa cercava serenità, non stress. Con Open Domus la sua casa è stata compresa e scelta subito. Guarda la sua storia, raccontata da lei.",
    videoBadge: "Storia vera",
    videoCta: "Guarda il video",
    videoAria: "Guarda la storia di Teresa, venduta al primo Open Domus",
    videoImageAlt: "Raffaela Rizza con Teresa, cliente che ha venduto al primo Open Domus",

    splitEyebrow: "Due punti di vista, un solo standard",
    splitTitle: "Pensato per chi vende. Rispettoso di chi acquista.",
    sellerLabel: "Se vendi",
    sellerItems: [
      "La tua casa mostrata al meglio, con home staging dove serve",
      "Interesse concentrato in un’unica giornata dedicata",
      "Solo acquirenti prequalificati, niente curiosi",
      "Feedback chiari per decidere con lucidità",
    ],
    buyerLabel: "Se acquisti",
    buyerItems: [
      "Documenti e planimetrie disponibili fin da subito",
      "Un’accoglienza curata, senza pressioni",
      "Tempo per capire davvero l’immobile",
      "Un processo trasparente, dalla visita alla proposta",
    ],

    faqEyebrow: "Domande frequenti",
    faqTitle: "Quello che i proprietari ci chiedono.",
    faq: [
      {
        q: "Quanto dura un Open Domus?",
        a: "In genere una giornata dedicata, con visite per appuntamento distribuite in fasce orarie. Concentrare l’interesse in poche ore crea slancio e comparabilità tra le proposte.",
      },
      {
        q: "Devo lasciare libera la casa?",
        a: "No. Ci occupiamo noi della preparazione, dell’accoglienza e della gestione delle visite. A te chiediamo solo di fidarti del metodo: al resto pensiamo noi.",
      },
      {
        q: "Chi partecipa alle visite?",
        a: "Solo acquirenti prequalificati e realmente interessati. Filtriamo a monte per proteggere la tua casa e il tuo tempo.",
      },
      {
        q: "È adatto a qualsiasi immobile?",
        a: "Open Domus dà il meglio quando c’è una storia da raccontare. Ne parliamo insieme e ti diciamo con onestà se è il format giusto per te.",
      },
    ],

    finalTitle: "La tua casa merita più di una visita qualunque.",
    finalText:
      "Raccontaci il tuo immobile: valutiamo insieme se Open Domus è la strada giusta per venderlo meglio.",
    finalCta: "Vorrei vendere con Open Domus",
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
    heroPrimary: "I’d like to sell with Open Domus",
    heroSecondary: "How it works",
    heroSubtitle: "Not just a viewing. An experience prepared to sell better.",

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

    compareEyebrow: "The difference",
    compareTitle: "It isn’t your average open house.",
    compareIntro:
      "A classic open house throws the doors open and hopes. Open Domus prepares, selects and guides: the result is a different league.",
    compareOldLabel: "Classic open house",
    compareNewLabel: "Open Domus",
    compareOld: [
      "Doors open to anyone, with no filter",
      "The property shown exactly as it is",
      "No documentation within reach",
      "Crowded, chaotic viewings",
      "Curious onlookers instead of real buyers",
    ],
    compareNew: [
      "Pre-qualified buyers who are genuinely interested",
      "A property prepared and enhanced before the event",
      "Documents and floor plans ready from the first moment",
      "Orderly viewings, by appointment, with no overlaps",
      "Structured feedback and faster offers",
    ],

    videoEyebrow: "The proof, on video",
    videoTitle: "Sold at the very first Open Domus.",
    videoText:
      "Teresa wanted peace of mind, not stress. With Open Domus her home was understood and chosen right away. Watch her story, told in her own words.",
    videoBadge: "True story",
    videoCta: "Watch the video",
    videoAria: "Watch Teresa’s story, sold at the first Open Domus",
    videoImageAlt: "Raffaela Rizza with Teresa, the client who sold at the first Open Domus",

    splitEyebrow: "Two points of view, one standard",
    splitTitle: "Designed for sellers. Respectful of buyers.",
    sellerLabel: "If you’re selling",
    sellerItems: [
      "Your home shown at its best, with home staging where needed",
      "Interest concentrated into one dedicated day",
      "Pre-qualified buyers only, no onlookers",
      "Clear feedback to decide with a clear head",
    ],
    buyerLabel: "If you’re buying",
    buyerItems: [
      "Documents and floor plans available from the outset",
      "A thoughtful welcome, with no pressure",
      "Time to truly understand the property",
      "A transparent process, from viewing to offer",
    ],

    faqEyebrow: "Frequently asked",
    faqTitle: "What owners ask us.",
    faq: [
      {
        q: "How long does an Open Domus last?",
        a: "Usually one dedicated day, with viewings by appointment across set time slots. Concentrating interest into a few hours creates momentum and lets offers be compared.",
      },
      {
        q: "Do I need to move out of the house?",
        a: "No. We take care of the preparation, the welcome and the management of the viewings. All we ask is that you trust the method — we handle the rest.",
      },
      {
        q: "Who takes part in the viewings?",
        a: "Only pre-qualified, genuinely interested buyers. We filter upstream to protect your home and your time.",
      },
      {
        q: "Is it right for any property?",
        a: "Open Domus is at its best when there’s a story to tell. We talk it through together and tell you honestly whether it’s the right format for you.",
      },
    ],

    finalTitle: "Your home deserves more than an ordinary viewing.",
    finalText:
      "Tell us about your property: together we’ll assess whether Open Domus is the right way to sell it better.",
    finalCta: "I’d like to sell with Open Domus",
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
    heroPrimary: "Je veux vendre avec Open Domus",
    heroSecondary: "Comment ça se passe",
    heroSubtitle: "Pas une simple visite. Une expérience préparée pour mieux vendre.",

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

    compareEyebrow: "La différence",
    compareTitle: "Ce n’est pas une porte ouverte comme les autres.",
    compareIntro:
      "La porte ouverte classique ouvre les portes et espère. Open Domus prépare, sélectionne et accompagne : le résultat est d’un tout autre niveau.",
    compareOldLabel: "Porte ouverte classique",
    compareNewLabel: "Open Domus",
    compareOld: [
      "Portes ouvertes à tous, sans filtre",
      "Le bien montré tel quel",
      "Aucune documentation à portée de main",
      "Des visites bondées et chaotiques",
      "Des curieux à la place d’acquéreurs réels",
    ],
    compareNew: [
      "Des acquéreurs préqualifiés et réellement intéressés",
      "Un bien préparé et valorisé avant l’événement",
      "Documents et plans prêts dès le premier instant",
      "Des visites ordonnées, sur rendez-vous, sans chevauchements",
      "Des retours structurés et des offres plus rapides",
    ],

    videoEyebrow: "La preuve, en vidéo",
    videoTitle: "Vendue dès le premier Open Domus.",
    videoText:
      "Teresa cherchait la sérénité, pas le stress. Avec Open Domus, sa maison a été comprise et choisie aussitôt. Regardez son histoire, racontée par elle-même.",
    videoBadge: "Histoire vraie",
    videoCta: "Regarder la vidéo",
    videoAria: "Regardez l’histoire de Teresa, vendue au premier Open Domus",
    videoImageAlt: "Raffaela Rizza avec Teresa, la cliente qui a vendu au premier Open Domus",

    splitEyebrow: "Deux points de vue, un seul standard",
    splitTitle: "Pensé pour ceux qui vendent. Respectueux de ceux qui achètent.",
    sellerLabel: "Si vous vendez",
    sellerItems: [
      "Votre maison mise en valeur, avec home staging si besoin",
      "Un intérêt concentré sur une seule journée dédiée",
      "Uniquement des acquéreurs préqualifiés, aucun curieux",
      "Des retours clairs pour décider avec lucidité",
    ],
    buyerLabel: "Si vous achetez",
    buyerItems: [
      "Documents et plans disponibles dès le départ",
      "Un accueil soigné, sans pression",
      "Le temps de comprendre vraiment le bien",
      "Un processus transparent, de la visite à l’offre",
    ],

    faqEyebrow: "Questions fréquentes",
    faqTitle: "Ce que les propriétaires nous demandent.",
    faq: [
      {
        q: "Combien de temps dure un Open Domus ?",
        a: "En général une journée dédiée, avec des visites sur rendez-vous réparties par créneaux horaires. Concentrer l’intérêt sur quelques heures crée un élan et permet de comparer les offres.",
      },
      {
        q: "Dois-je libérer la maison ?",
        a: "Non. Nous nous occupons de la préparation, de l’accueil et de la gestion des visites. Nous vous demandons seulement de faire confiance à la méthode : nous gérons le reste.",
      },
      {
        q: "Qui participe aux visites ?",
        a: "Uniquement des acquéreurs préqualifiés et réellement intéressés. Nous filtrons en amont pour protéger votre maison et votre temps.",
      },
      {
        q: "Convient-il à tout type de bien ?",
        a: "Open Domus donne le meilleur lorsqu’il y a une histoire à raconter. Nous en parlons ensemble et vous disons honnêtement si c’est le bon format pour vous.",
      },
    ],

    finalTitle: "Votre maison mérite mieux qu’une visite ordinaire.",
    finalText:
      "Parlez-nous de votre bien : ensemble, nous évaluons si Open Domus est la bonne voie pour mieux le vendre.",
    finalCta: "Je veux vendre avec Open Domus",
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
    heroPrimary: "Ich möchte mit Open Domus verkaufen",
    heroSecondary: "So läuft es ab",
    heroSubtitle: "Keine gewöhnliche Besichtigung. Ein Erlebnis, vorbereitet für den besseren Verkauf.",

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

    compareEyebrow: "Der Unterschied",
    compareTitle: "Kein Tag der offenen Tür wie jeder andere.",
    compareIntro:
      "Der klassische Tag der offenen Tür öffnet die Türen und hofft. Open Domus bereitet vor, wählt aus und begleitet: Das Ergebnis ist eine andere Liga.",
    compareOldLabel: "Klassischer Tag der offenen Tür",
    compareNewLabel: "Open Domus",
    compareOld: [
      "Türen für jeden offen, ohne Filter",
      "Die Immobilie wird gezeigt, wie sie ist",
      "Keine Unterlagen griffbereit",
      "Überfüllte, chaotische Besichtigungen",
      "Neugierige statt echter Käufer",
    ],
    compareNew: [
      "Vorqualifizierte, wirklich interessierte Käufer",
      "Eine vor dem Event vorbereitete und aufgewertete Immobilie",
      "Unterlagen und Grundrisse vom ersten Moment an bereit",
      "Geordnete Besichtigungen, nach Termin, ohne Überschneidungen",
      "Strukturierte Rückmeldungen und schnellere Angebote",
    ],

    videoEyebrow: "Der Beweis, im Video",
    videoTitle: "Beim ersten Open Domus verkauft.",
    videoText:
      "Teresa suchte Gelassenheit, nicht Stress. Mit Open Domus wurde ihr Zuhause sofort verstanden und gewählt. Sehen Sie ihre Geschichte, von ihr selbst erzählt.",
    videoBadge: "Wahre Geschichte",
    videoCta: "Video ansehen",
    videoAria: "Sehen Sie die Geschichte von Teresa, verkauft beim ersten Open Domus",
    videoImageAlt: "Raffaela Rizza mit Teresa, der Kundin, die beim ersten Open Domus verkauft hat",

    splitEyebrow: "Zwei Blickwinkel, ein Standard",
    splitTitle: "Für Verkäufer gedacht. Käufer gegenüber respektvoll.",
    sellerLabel: "Wenn Sie verkaufen",
    sellerItems: [
      "Ihr Zuhause im besten Licht, mit Home Staging wo nötig",
      "Interesse gebündelt an einem einzigen dedizierten Tag",
      "Nur vorqualifizierte Käufer, keine Neugierigen",
      "Klare Rückmeldungen, um mit klarem Kopf zu entscheiden",
    ],
    buyerLabel: "Wenn Sie kaufen",
    buyerItems: [
      "Unterlagen und Grundrisse von Anfang an verfügbar",
      "Ein sorgfältiger Empfang, ganz ohne Druck",
      "Zeit, die Immobilie wirklich zu verstehen",
      "Ein transparenter Ablauf, von der Besichtigung bis zum Angebot",
    ],

    faqEyebrow: "Häufige Fragen",
    faqTitle: "Was Eigentümer uns fragen.",
    faq: [
      {
        q: "Wie lange dauert ein Open Domus?",
        a: "In der Regel ein dedizierter Tag, mit Besichtigungen nach Termin in festen Zeitfenstern. Das Interesse auf wenige Stunden zu bündeln schafft Schwung und macht Angebote vergleichbar.",
      },
      {
        q: "Muss ich das Haus räumen?",
        a: "Nein. Wir kümmern uns um die Vorbereitung, den Empfang und die Organisation der Besichtigungen. Wir bitten Sie nur, der Methode zu vertrauen – um den Rest kümmern wir uns.",
      },
      {
        q: "Wer nimmt an den Besichtigungen teil?",
        a: "Nur vorqualifizierte, wirklich interessierte Käufer. Wir filtern im Vorfeld, um Ihr Zuhause und Ihre Zeit zu schützen.",
      },
      {
        q: "Eignet es sich für jede Immobilie?",
        a: "Open Domus zeigt seine Stärke, wenn es eine Geschichte zu erzählen gibt. Wir besprechen es gemeinsam und sagen Ihnen ehrlich, ob es das richtige Format für Sie ist.",
      },
    ],

    finalTitle: "Ihr Zuhause verdient mehr als eine gewöhnliche Besichtigung.",
    finalText:
      "Erzählen Sie uns von Ihrer Immobilie: Gemeinsam prüfen wir, ob Open Domus der richtige Weg ist, sie besser zu verkaufen.",
    finalCta: "Ich möchte mit Open Domus verkaufen",
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
    heroPrimary: "Quiero vender con Open Domus",
    heroSecondary: "Cómo se desarrolla",
    heroSubtitle: "No una simple visita. Una experiencia preparada para vender mejor.",

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

    compareEyebrow: "La diferencia",
    compareTitle: "No es una jornada de puertas abiertas cualquiera.",
    compareIntro:
      "La jornada de puertas abiertas clásica abre las puertas y espera. Open Domus prepara, selecciona y acompaña: el resultado es de otro nivel.",
    compareOldLabel: "Puertas abiertas clásicas",
    compareNewLabel: "Open Domus",
    compareOld: [
      "Puertas abiertas a cualquiera, sin filtro",
      "El inmueble mostrado tal cual",
      "Ninguna documentación a mano",
      "Visitas abarrotadas y caóticas",
      "Curiosos en lugar de compradores reales",
    ],
    compareNew: [
      "Compradores precalificados y realmente interesados",
      "Un inmueble preparado y revalorizado antes del evento",
      "Documentos y planos listos desde el primer instante",
      "Visitas ordenadas, con cita, sin solapamientos",
      "Comentarios estructurados y propuestas más rápidas",
    ],

    videoEyebrow: "La prueba, en vídeo",
    videoTitle: "Vendida en el primer Open Domus.",
    videoText:
      "Teresa buscaba tranquilidad, no estrés. Con Open Domus su casa fue comprendida y elegida enseguida. Mira su historia, contada por ella misma.",
    videoBadge: "Historia real",
    videoCta: "Ver el vídeo",
    videoAria: "Mira la historia de Teresa, vendida en el primer Open Domus",
    videoImageAlt: "Raffaela Rizza con Teresa, la clienta que vendió en el primer Open Domus",

    splitEyebrow: "Dos puntos de vista, un solo estándar",
    splitTitle: "Pensado para quien vende. Respetuoso con quien compra.",
    sellerLabel: "Si vendes",
    sellerItems: [
      "Tu casa mostrada en su mejor versión, con home staging donde haga falta",
      "Interés concentrado en una única jornada dedicada",
      "Solo compradores precalificados, nada de curiosos",
      "Comentarios claros para decidir con lucidez",
    ],
    buyerLabel: "Si compras",
    buyerItems: [
      "Documentos y planos disponibles desde el principio",
      "Una acogida cuidada, sin presiones",
      "Tiempo para entender de verdad el inmueble",
      "Un proceso transparente, de la visita a la propuesta",
    ],

    faqEyebrow: "Preguntas frecuentes",
    faqTitle: "Lo que los propietarios nos preguntan.",
    faq: [
      {
        q: "¿Cuánto dura un Open Domus?",
        a: "Por lo general una jornada dedicada, con visitas con cita repartidas en franjas horarias. Concentrar el interés en pocas horas crea impulso y permite comparar las propuestas.",
      },
      {
        q: "¿Debo dejar libre la casa?",
        a: "No. Nos ocupamos nosotros de la preparación, la acogida y la gestión de las visitas. Solo te pedimos que confíes en el método: del resto nos encargamos nosotros.",
      },
      {
        q: "¿Quién participa en las visitas?",
        a: "Solo compradores precalificados y realmente interesados. Filtramos de antemano para proteger tu casa y tu tiempo.",
      },
      {
        q: "¿Es adecuado para cualquier inmueble?",
        a: "Open Domus da lo mejor de sí cuando hay una historia que contar. Lo hablamos juntos y te decimos con honestidad si es el formato adecuado para ti.",
      },
    ],

    finalTitle: "Tu casa merece más que una visita cualquiera.",
    finalText:
      "Cuéntanos tu inmueble: valoramos juntos si Open Domus es el camino adecuado para venderlo mejor.",
    finalCta: "Quiero vender con Open Domus",
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
  const [openFaq, setOpenFaq] = useState<number>(0);

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

      {/* Sottotitolo / claim di prodotto */}
      <section className="bg-ink">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-16">
          <Reveal className="flex flex-col items-center text-center">
            <SegnoDomusBadge light>Open Domus</SegnoDomusBadge>
            <p className="mt-6 max-w-3xl font-display text-2xl font-medium leading-[1.2] tracking-tight text-cream balance sm:text-[2rem]">
              {c.heroSubtitle}
            </p>
          </Reveal>
        </div>
      </section>

      <OpenDomus />

      <Highlights
        tone="cream"
        eyebrow={c.highlightsEyebrow}
        title={c.highlightsTitle}
        intro={c.highlightsIntro}
        items={c.highlightsItems}
      />

      {/* Perché è diverso da un open house classico */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{c.compareEyebrow}</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {c.compareTitle}
            </h2>
            <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-stone">
              {c.compareIntro}
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 lg:grid-cols-2">
            {/* Colonna: open house classico */}
            <Reveal>
              <article className="flex h-full flex-col rounded-[1.75rem] border border-line bg-cream p-8">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-stone">
                  {c.compareOldLabel}
                </span>
                <ul className="mt-6 flex flex-col gap-3.5">
                  {c.compareOld.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-snug text-graphite">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-stone">
                        <span className="h-2 w-2 rounded-full bg-stone/40" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>

            {/* Colonna: Open Domus */}
            <Reveal delay={100}>
              <article className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-red/30 bg-ink p-8 text-cream shadow-[0_40px_80px_-50px_rgba(210,10,10,0.5)]">
                <SegnoDomusCorner className="right-4 top-4 opacity-70" rotate={90} size={30} />
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-red-soft">
                  {c.compareNewLabel}
                </span>
                <ul className="mt-6 flex flex-col gap-3.5">
                  {c.compareNew.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-snug text-cream/90">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red text-white">
                        <Check className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <EditorialRows
        id="percorso"
        tone="cream"
        eyebrow={c.rowsEyebrow}
        title={c.rowsTitle}
        rows={phases}
      />

      {/* La prova, in video — Venduta al primo Open Domus */}
      <section className="bg-ink">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <Reveal>
              <a
                href="https://www.youtube.com/watch?v=gYePYQHNTUM"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={c.videoAria}
                className="group relative block aspect-video overflow-hidden rounded-[2rem] border border-cream/15"
              >
                <Image
                  src="/images/reali/open-domus-teresa.jpg"
                  alt={c.videoImageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 680px"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-ink/50 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-cream backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-red" />
                  {c.videoBadge}
                </span>
                <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-8 w-8" />
                </span>
              </a>
            </Reveal>

            <Reveal delay={100}>
              <span className="inline-flex items-center gap-2 rounded-full border border-red/40 bg-red/10 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-red-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-red" />
                {c.videoEyebrow}
              </span>
              <h2 className="mt-6 font-display text-4xl font-medium leading-[1.05] tracking-tight text-cream balance sm:text-[3rem]">
                {c.videoTitle}
              </h2>
              <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-cream/80">
                {c.videoText}
              </p>
              <a
                href="https://www.youtube.com/watch?v=gYePYQHNTUM"
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-9 inline-flex items-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                {c.videoCta}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Card doppie: chi vende / chi acquista */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{c.splitEyebrow}</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {c.splitTitle}
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-2">
            <Reveal>
              <article className="flex h-full flex-col rounded-[1.75rem] border border-line bg-paper p-8">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-red">
                  {c.sellerLabel}
                </span>
                <ul className="mt-6 grid gap-4">
                  {c.sellerItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-snug text-graphite">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                        <Check className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>

            <Reveal delay={100}>
              <article className="flex h-full flex-col rounded-[1.75rem] border border-line bg-paper p-8">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-red">
                  {c.buyerLabel}
                </span>
                <ul className="mt-6 grid gap-4">
                  {c.buyerItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-snug text-graphite">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                        <Check className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">{c.faqEyebrow}</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {c.faqTitle}
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-3 lg:max-w-3xl">
            {c.faq.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={item.q} delay={i * 70}>
                  <div className="overflow-hidden rounded-2xl border border-line bg-cream">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="font-display text-lg font-medium leading-snug tracking-tight text-ink">
                        {item.q}
                      </span>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red transition-transform duration-300 ${
                          isOpen ? "rotate-90 bg-red-soft" : "bg-paper"
                        }`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-6 pb-6 text-[0.95rem] leading-relaxed text-stone">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="bg-ink">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
          <Reveal className="flex flex-col items-center text-center">
            <SegnoDomusDivider className="mb-8 w-full max-w-sm opacity-80" />
            <h2 className="max-w-2xl font-display text-3xl font-medium leading-[1.08] tracking-tight text-cream balance sm:text-[2.6rem]">
              {c.finalTitle}
            </h2>
            <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-cream/80">
              {c.finalText}
            </p>
            <a
              href="#contatti"
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-red py-4 pl-7 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
            >
              {c.finalCta}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>
        </div>
      </section>

      <Reviews />
      <Contact />
    </main>
  );
}
