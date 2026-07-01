// i18n — fondamenta. IT è la lingua principale (SEO). EN/FR/DE/ES tradotti per chrome + hero + ricerca.
// Il resto del corpo pagina segue in fase successiva sulla stessa architettura.
export const locales = ["it", "en", "fr", "de", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "it";
export const localeNames: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};
export const localeShort: Record<Locale, string> = {
  it: "IT",
  en: "EN",
  fr: "FR",
  de: "DE",
  es: "ES",
};

type Dict = {
  nav: { vendi: string; acquista: string; metodo: string; openDomus: string; case: string; recensioni: string; chiSiamo: string; contatti: string };
  header: { valuta: string; whatsapp: string };
  hero: {
    eyebrow: string; title1: string; title2: string; subcopy: string;
    ctaValuta: string; ctaMetodo: string; ctaCerco: string;
    founderRole: string; watch: string; ratingSuffix: string;
    chips: string[];
  };
  search: {
    title: string; nlPlaceholder: string; nlTeaser: string; nlHint: string;
    contract: string; type: string; zone: string; budget: string; rooms: string; features: string;
    all: string; sale: string; rent: string; anyBudget: string; anyRooms: string;
    resultsOne: string; resultsMany: string; cta: string; sellerTitle: string; sellerCta: string;
    emptyTitle: string; emptyCopy: string; emptyCta: string;
  };
  whatsapp: { cta: string };
  footer: { naviga: string; orari: string; monFri: string; sat: string; sun: string; onAppt: string; valuta: string; privacy: string; cookie: string; contatti: string };
  lang: { label: string };
};

export const dictionaries: Record<Locale, Dict> = {
  it: {
    nav: { vendi: "Vendi", acquista: "Acquista", metodo: "Metodo Domus", openDomus: "Open Domus", case: "Case", recensioni: "Recensioni", chiSiamo: "Chi siamo", contatti: "Contatti" },
    header: { valuta: "Valuta la tua casa", whatsapp: "Scrivici su WhatsApp" },
    hero: {
      eyebrow: "Agenzia immobiliare · Tradate dal 2007",
      title1: "Vendere casa, senza stress.",
      title2: "Acquistare casa, con sicurezza.",
      subcopy: "Dal 2007 mettiamo le persone prima degli immobili. Ti accompagniamo passo dopo passo, dalla valutazione al rogito, unendo calore umano e strumenti innovativi: rendering, video, home staging e Open Domus.",
      ctaValuta: "Valuta il tuo immobile", ctaMetodo: "Scopri il Metodo", ctaCerco: "Cerco casa",
      founderRole: "Fondatrice · con te dal 2007", watch: "Guarda i video",
      ratingSuffix: "su Google · oltre 500 recensioni",
      chips: ["Video immobiliari", "Open Domus", "Domus D.O.C.", "Tradate · Varese"],
    },
    search: {
      title: "Che casa stai cercando?",
      nlPlaceholder: "Es. trilocale con giardino a Tradate sotto 300.000 €",
      nlTeaser: "Ricerca intelligente in arrivo",
      nlHint: "Presto potrai cercare casa scrivendo come parleresti a noi. Intanto usa i filtri.",
      contract: "Contratto", type: "Tipologia", zone: "Zona", budget: "Budget", rooms: "Locali", features: "Caratteristiche",
      all: "Tutte", sale: "Vendita", rent: "Affitto", anyBudget: "Nessun limite", anyRooms: "Qualsiasi",
      resultsOne: "immobile trovato", resultsMany: "immobili trovati", cta: "Cerca casa",
      sellerTitle: "Devi vendere casa?", sellerCta: "Richiedi una valutazione",
      emptyTitle: "Nessun immobile con questi filtri.",
      emptyCopy: "Non c’è online? Potrebbe arrivare. Raccontaci cosa cerchi: molte case le troviamo noi.",
      emptyCta: "Lasciaci la tua richiesta",
    },
    whatsapp: { cta: "Scrivici ora" },
    footer: { naviga: "Naviga", orari: "Orari", monFri: "Lun – Ven", sat: "Sabato", sun: "Domenica", onAppt: "Su appuntamento", valuta: "Valuta la tua casa", privacy: "Privacy", cookie: "Cookie", contatti: "Contatti" },
    lang: { label: "Lingua" },
  },
  en: {
    nav: { vendi: "Sell", acquista: "Buy", metodo: "The Method", openDomus: "Open Domus", case: "Homes", recensioni: "Reviews", chiSiamo: "About us", contatti: "Contact" },
    header: { valuta: "Value your home", whatsapp: "Message us on WhatsApp" },
    hero: {
      eyebrow: "Real estate agency · Tradate since 2007",
      title1: "Sell your home, stress-free.",
      title2: "Buy your home, with confidence.",
      subcopy: "Since 2007 we put people before properties. We guide you step by step, from valuation to the deed, combining human warmth with innovative tools: renderings, video, home staging and Open Domus.",
      ctaValuta: "Value your home", ctaMetodo: "Discover the Method", ctaCerco: "I'm looking for a home",
      founderRole: "Founder · with you since 2007", watch: "Watch the videos",
      ratingSuffix: "on Google · 500+ reviews",
      chips: ["Property videos", "Open Domus", "Domus D.O.C.", "Tradate · Varese"],
    },
    search: {
      title: "What home are you looking for?",
      nlPlaceholder: "e.g. three-room with garden in Tradate under €300,000",
      nlTeaser: "Smart search coming soon",
      nlHint: "Soon you'll be able to search just as you'd talk to us. For now, use the filters.",
      contract: "Contract", type: "Type", zone: "Area", budget: "Budget", rooms: "Rooms", features: "Features",
      all: "All", sale: "Sale", rent: "Rent", anyBudget: "No limit", anyRooms: "Any",
      resultsOne: "home found", resultsMany: "homes found", cta: "Search homes",
      sellerTitle: "Need to sell your home?", sellerCta: "Request a valuation",
      emptyTitle: "No homes match these filters.",
      emptyCopy: "Not online yet? It might be soon. Tell us what you're after: we find many homes for our clients.",
      emptyCta: "Send us your request",
    },
    whatsapp: { cta: "Message us" },
    footer: { naviga: "Navigate", orari: "Opening hours", monFri: "Mon – Fri", sat: "Saturday", sun: "Sunday", onAppt: "By appointment", valuta: "Value your home", privacy: "Privacy", cookie: "Cookies", contatti: "Contact" },
    lang: { label: "Language" },
  },
  fr: {
    nav: { vendi: "Vendre", acquista: "Acheter", metodo: "La Méthode", openDomus: "Open Domus", case: "Biens", recensioni: "Avis", chiSiamo: "À propos", contatti: "Contact" },
    header: { valuta: "Estimez votre bien", whatsapp: "Écrivez-nous sur WhatsApp" },
    hero: {
      eyebrow: "Agence immobilière · Tradate depuis 2007",
      title1: "Vendre sa maison, sans stress.",
      title2: "Acheter sa maison, en toute sécurité.",
      subcopy: "Depuis 2007, nous plaçons les personnes avant les biens. Nous vous accompagnons pas à pas, de l'estimation à l'acte, en alliant chaleur humaine et outils innovants : rendus, vidéo, home staging et Open Domus.",
      ctaValuta: "Estimez votre bien", ctaMetodo: "Découvrir la Méthode", ctaCerco: "Je cherche un bien",
      founderRole: "Fondatrice · à vos côtés depuis 2007", watch: "Voir les vidéos",
      ratingSuffix: "sur Google · plus de 500 avis",
      chips: ["Vidéos immobilières", "Open Domus", "Domus D.O.C.", "Tradate · Varèse"],
    },
    search: {
      title: "Quel bien recherchez-vous ?",
      nlPlaceholder: "Ex. trois-pièces avec jardin à Tradate sous 300 000 €",
      nlTeaser: "Recherche intelligente bientôt disponible",
      nlHint: "Bientôt, vous pourrez chercher comme vous nous parleriez. En attendant, utilisez les filtres.",
      contract: "Contrat", type: "Type", zone: "Zone", budget: "Budget", rooms: "Pièces", features: "Caractéristiques",
      all: "Tous", sale: "Vente", rent: "Location", anyBudget: "Sans limite", anyRooms: "Indifférent",
      resultsOne: "bien trouvé", resultsMany: "biens trouvés", cta: "Rechercher",
      sellerTitle: "Vous devez vendre ?", sellerCta: "Demander une estimation",
      emptyTitle: "Aucun bien avec ces filtres.",
      emptyCopy: "Pas encore en ligne ? Cela peut arriver. Dites-nous ce que vous cherchez : nous trouvons de nombreux biens pour nos clients.",
      emptyCta: "Envoyez-nous votre demande",
    },
    whatsapp: { cta: "Écrivez-nous" },
    footer: { naviga: "Navigation", orari: "Horaires", monFri: "Lun – Ven", sat: "Samedi", sun: "Dimanche", onAppt: "Sur rendez-vous", valuta: "Estimez votre bien", privacy: "Confidentialité", cookie: "Cookies", contatti: "Contact" },
    lang: { label: "Langue" },
  },
  de: {
    nav: { vendi: "Verkaufen", acquista: "Kaufen", metodo: "Die Methode", openDomus: "Open Domus", case: "Immobilien", recensioni: "Bewertungen", chiSiamo: "Über uns", contatti: "Kontakt" },
    header: { valuta: "Immobilie bewerten", whatsapp: "Schreib uns auf WhatsApp" },
    hero: {
      eyebrow: "Immobilienagentur · Tradate seit 2007",
      title1: "Verkaufen ohne Stress.",
      title2: "Kaufen mit Sicherheit.",
      subcopy: "Seit 2007 stellen wir Menschen vor Immobilien. Wir begleiten Sie Schritt für Schritt, von der Bewertung bis zum Notartermin, mit menschlicher Wärme und innovativen Werkzeugen: Renderings, Video, Home Staging und Open Domus.",
      ctaValuta: "Immobilie bewerten", ctaMetodo: "Die Methode entdecken", ctaCerco: "Ich suche eine Immobilie",
      founderRole: "Gründerin · an Ihrer Seite seit 2007", watch: "Videos ansehen",
      ratingSuffix: "auf Google · über 500 Bewertungen",
      chips: ["Immobilienvideos", "Open Domus", "Domus D.O.C.", "Tradate · Varese"],
    },
    search: {
      title: "Welche Immobilie suchen Sie?",
      nlPlaceholder: "z. B. Dreizimmer mit Garten in Tradate unter 300.000 €",
      nlTeaser: "Intelligente Suche folgt bald",
      nlHint: "Bald können Sie suchen, wie Sie mit uns sprechen würden. Nutzen Sie vorerst die Filter.",
      contract: "Vertrag", type: "Typ", zone: "Gebiet", budget: "Budget", rooms: "Zimmer", features: "Merkmale",
      all: "Alle", sale: "Verkauf", rent: "Miete", anyBudget: "Kein Limit", anyRooms: "Beliebig",
      resultsOne: "Immobilie gefunden", resultsMany: "Immobilien gefunden", cta: "Immobilien suchen",
      sellerTitle: "Möchten Sie verkaufen?", sellerCta: "Bewertung anfragen",
      emptyTitle: "Keine Immobilie mit diesen Filtern.",
      emptyCopy: "Noch nicht online? Vielleicht bald. Sagen Sie uns, was Sie suchen: Vieles finden wir für unsere Kunden.",
      emptyCta: "Senden Sie uns Ihre Anfrage",
    },
    whatsapp: { cta: "Schreib uns" },
    footer: { naviga: "Navigation", orari: "Öffnungszeiten", monFri: "Mo – Fr", sat: "Samstag", sun: "Sonntag", onAppt: "Nach Vereinbarung", valuta: "Immobilie bewerten", privacy: "Datenschutz", cookie: "Cookies", contatti: "Kontakt" },
    lang: { label: "Sprache" },
  },
  es: {
    nav: { vendi: "Vender", acquista: "Comprar", metodo: "El Método", openDomus: "Open Domus", case: "Inmuebles", recensioni: "Reseñas", chiSiamo: "Quiénes somos", contatti: "Contacto" },
    header: { valuta: "Valora tu casa", whatsapp: "Escríbenos por WhatsApp" },
    hero: {
      eyebrow: "Agencia inmobiliaria · Tradate desde 2007",
      title1: "Vender tu casa, sin estrés.",
      title2: "Comprar tu casa, con seguridad.",
      subcopy: "Desde 2007 ponemos a las personas antes que los inmuebles. Te acompañamos paso a paso, de la valoración a la escritura, uniendo calidez humana y herramientas innovadoras: renders, vídeo, home staging y Open Domus.",
      ctaValuta: "Valora tu casa", ctaMetodo: "Descubre el Método", ctaCerco: "Busco casa",
      founderRole: "Fundadora · contigo desde 2007", watch: "Ver los vídeos",
      ratingSuffix: "en Google · más de 500 reseñas",
      chips: ["Vídeos inmobiliarios", "Open Domus", "Domus D.O.C.", "Tradate · Varese"],
    },
    search: {
      title: "¿Qué casa estás buscando?",
      nlPlaceholder: "Ej. piso de tres habitaciones con jardín en Tradate por menos de 300.000 €",
      nlTeaser: "Búsqueda inteligente muy pronto",
      nlHint: "Pronto podrás buscar como nos hablarías. Mientras tanto, usa los filtros.",
      contract: "Contrato", type: "Tipo", zone: "Zona", budget: "Presupuesto", rooms: "Habitaciones", features: "Características",
      all: "Todos", sale: "Venta", rent: "Alquiler", anyBudget: "Sin límite", anyRooms: "Cualquiera",
      resultsOne: "inmueble encontrado", resultsMany: "inmuebles encontrados", cta: "Buscar casa",
      sellerTitle: "¿Necesitas vender?", sellerCta: "Solicita una valoración",
      emptyTitle: "Ningún inmueble con estos filtros.",
      emptyCopy: "¿Todavía no está online? Puede que llegue pronto. Cuéntanos qué buscas: muchas casas las encontramos nosotros para nuestros clientes.",
      emptyCta: "Envíanos tu solicitud",
    },
    whatsapp: { cta: "Escríbenos" },
    footer: { naviga: "Navegar", orari: "Horario", monFri: "Lun – Vie", sat: "Sábado", sun: "Domingo", onAppt: "Con cita previa", valuta: "Valora tu casa", privacy: "Privacidad", cookie: "Cookies", contatti: "Contacto" },
    lang: { label: "Idioma" },
  },
};
