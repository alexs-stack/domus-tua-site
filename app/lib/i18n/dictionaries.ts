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
  nav: { vendi: string; acquista: string; metodo: string; servizi: string; openDomus: string; case: string; recensioni: string; chiSiamo: string; lavora: string; contatti: string; percorso: string };
  header: { valuta: string; whatsapp: string };
  cursor: { scopri: string; trascina: string };
  // Del vecchio blocco `hero` restano i TRE campi che qualcuno rende davvero:
  // `title1`/`title2` (il nastro cinetico che chiude la home, KineticStrip) e
  // `ctaValuta` (CostiChiari e /case-vendute). Gli altri otto — eyebrow, subcopy,
  // ctaMetodo, ctaCerco, founderRole, watch, ratingSuffix, chips — non li leggeva
  // nessuno, ed erano la copia FERMA dell'hero prima della riscrittura del §6.1:
  // il subcopy diceva ancora «Ti accompagniamo passo dopo passo» e il ratingSuffix
  // «oltre 500 recensioni». Copy morta che contraddice quella viva non è inerte: è
  // la versione che qualcuno ricollega per sbaglio, riportando dentro il testo che
  // era stato tolto. L'hero vero ha la sua copy in HeroCinematic.tsx.
  hero: {
    title1: string; title2: string; ctaValuta: string;
  };
  search: {
    // Sei chiavi, non ventitré. Le altre diciassette non le leggeva nessuno: erano
    // rimaste qui quando la ricerca ha smesso di usare i filtri a tendina, e fra loro
    // c'era `cta: "Cerca casa"` — copy MORTA che contraddiceva quella viva, in cinque
    // lingue. È la stessa trappola già disinnescata sul blocco `hero`: un dizionario che
    // conserva stringhe non rese non è inerte, è una fonte di verità alternativa che
    // prima o poi qualcuno rimette in pagina credendola quella buona.
    title: string; nlPlaceholder: string; nlTeaser: string; nlHint: string;
    sellerTitle: string; sellerCopy: string; sellerCta: string;
  };
  whatsapp: { cta: string };
  /**
   * `payoff` e la riga sotto il marchio, su OGNI pagina.
   *
   * Prima era scritta a mano dentro Footer.tsx, in italiano, e restava italiana anche in
   * tedesco e in spagnolo. Sta qui perche e copy, e il copy del sito vive nel dizionario.
   */
  footer: { payoff: string; naviga: string; orari: string; caseVendute: string; monFri: string; sat: string; sun: string; onAppt: string; valuta: string; privacy: string; cookie: string; cookiePrefs: string; contatti: string; lavora: string; faq: string };
  lang: { label: string };
};

export const dictionaries: Record<Locale, Dict> = {
  it: {
    nav: { vendi: "Vendi", acquista: "Acquista", metodo: "Metodo Domus", servizi: "Servizi", openDomus: "Open Domus", case: "Case", recensioni: "Recensioni", chiSiamo: "Chi siamo", lavora: "Lavora con noi", contatti: "Contatti", percorso: "Percorso" },
    header: { valuta: "Richiedi la valutazione", whatsapp: "Parla con noi su WhatsApp" },
    cursor: { scopri: "Scopri", trascina: "Trascina" },
    hero: {
      title1: "Vendi casa a Tradate",
      title2: "al prezzo giusto, nei tempi giusti.",
      ctaValuta: "Richiedi la valutazione del tuo immobile",
    },
    search: {
      title: "Che casa stai cercando?",
      nlPlaceholder: "Es. trilocale con giardino a Tradate sotto 300.000 €",
      nlTeaser: "Ricerca intelligente",
      nlHint: "Scrivi come parleresti a noi e trova la casa giusta.",
      sellerTitle: "Devi vendere casa?",
      sellerCopy: "Prima di pubblicarla la prepariamo, ne verifichiamo i documenti e ti seguiamo fino al rogito.",
      sellerCta: "Richiedi la valutazione del tuo immobile",
      },
    whatsapp: { cta: "Parla con noi su WhatsApp" },
    footer: { payoff: "Controlliamo i documenti prima di pubblicare. Rispondiamo noi al telefono, fino al rogito.", naviga: "Naviga", orari: "Orari", monFri: "Lun – Ven", sat: "Sabato", sun: "Domenica", onAppt: "Su appuntamento", valuta: "Richiedi la valutazione", privacy: "Privacy", cookie: "Cookie", cookiePrefs: "Preferenze cookie", contatti: "Contatti", lavora: "Lavora con noi", faq: "Domande frequenti", caseVendute: "Case vendute" },
    lang: { label: "Lingua" },
  },
  en: {
    nav: { vendi: "Sell", acquista: "Buy", metodo: "The Method", servizi: "Services", openDomus: "Open Domus", case: "Homes", recensioni: "Reviews", chiSiamo: "About us", lavora: "Work with us", contatti: "Contact", percorso: "Journey" },
    header: { valuta: "Request a valuation", whatsapp: "Talk to us on WhatsApp" },
    cursor: { scopri: "View", trascina: "Drag" },
    hero: {
      title1: "Sell your home in Tradate",
      title2: "at the right price, in the right time.",
      ctaValuta: "Request a valuation of your property",
    },
    search: {
      title: "What home are you looking for?",
      nlPlaceholder: "e.g. three-room with garden in Tradate under €300,000",
      nlTeaser: "Smart search",
      nlHint: "Write it just as you’d talk to us and find the right home.",
      sellerTitle: "Need to sell your home?",
      sellerCopy: "Before it goes online we prepare it, we check its paperwork, and we stay with you to the deed.",
      sellerCta: "Request a valuation of your property",
      },
    whatsapp: { cta: "Talk to us on WhatsApp" },
    footer: { payoff: "We check the paperwork before listing. We answer the phone ourselves, all the way to the deed.", naviga: "Navigate", orari: "Opening hours", monFri: "Mon – Fri", sat: "Saturday", sun: "Sunday", onAppt: "By appointment", valuta: "Request a valuation", privacy: "Privacy", cookie: "Cookies", cookiePrefs: "Cookie preferences", contatti: "Contact", lavora: "Work with us", faq: "FAQ", caseVendute: "Homes sold" },
    lang: { label: "Language" },
  },
  fr: {
    nav: { vendi: "Vendre", acquista: "Acheter", metodo: "La Méthode", servizi: "Services", openDomus: "Open Domus", case: "Biens", recensioni: "Avis", chiSiamo: "À propos", lavora: "Rejoignez-nous", contatti: "Contact", percorso: "Parcours" },
    header: { valuta: "Demander l’estimation", whatsapp: "Parlez-nous sur WhatsApp" },
    cursor: { scopri: "Découvrir", trascina: "Glisser" },
    hero: {
      title1: "Vendez votre bien à Tradate",
      title2: "au juste prix, dans les bons délais.",
      ctaValuta: "Demandez l’estimation de votre bien",
    },
    search: {
      title: "Quel bien recherchez-vous ?",
      nlPlaceholder: "Ex. trois-pièces avec jardin à Tradate sous 300 000 €",
      nlTeaser: "Recherche intelligente",
      nlHint: "Écrivez comme vous nous parleriez et trouvez le bon bien.",
      sellerTitle: "Vous devez vendre ?",
      sellerCopy: "Avant la mise en ligne, nous le préparons, nous contrôlons ses documents et nous restons avec vous jusqu’à l’acte.",
      sellerCta: "Demandez l’estimation de votre bien",
      },
    whatsapp: { cta: "Parlez-nous sur WhatsApp" },
    footer: { payoff: "Nous contrôlons les documents avant la mise en ligne. C’est nous qui répondons au téléphone, jusqu’à l’acte.", naviga: "Navigation", orari: "Horaires", monFri: "Lun – Ven", sat: "Samedi", sun: "Dimanche", onAppt: "Sur rendez-vous", valuta: "Demander l’estimation", privacy: "Confidentialité", cookie: "Cookies", cookiePrefs: "Préférences cookies", contatti: "Contact", lavora: "Rejoignez-nous", faq: "Questions fréquentes", caseVendute: "Biens vendus" },
    lang: { label: "Langue" },
  },
  de: {
    nav: { vendi: "Verkaufen", acquista: "Kaufen", metodo: "Die Methode", servizi: "Leistungen", openDomus: "Open Domus", case: "Immobilien", recensioni: "Bewertungen", chiSiamo: "Über uns", lavora: "Karriere", contatti: "Kontakt", percorso: "Ablauf" },
    header: { valuta: "Bewertung anfordern", whatsapp: "Sprechen Sie mit uns auf WhatsApp" },
    cursor: { scopri: "Entdecken", trascina: "Ziehen" },
    hero: {
      title1: "Verkaufen Sie Ihr Haus in Tradate",
      title2: "zum richtigen Preis, in der richtigen Zeit.",
      ctaValuta: "Bewertung Ihrer Immobilie anfordern",
    },
    search: {
      title: "Welche Immobilie suchen Sie?",
      nlPlaceholder: "z. B. Dreizimmer mit Garten in Tradate unter 300.000 €",
      nlTeaser: "Intelligente Suche",
      nlHint: "Schreiben Sie, wie Sie mit uns sprechen würden, und finden Sie das passende Zuhause.",
      sellerTitle: "Möchten Sie verkaufen?",
      sellerCopy: "Vor der Veröffentlichung bereiten wir sie vor, prüfen ihre Unterlagen und bleiben bis zum Notartermin an Ihrer Seite.",
      sellerCta: "Bewertung Ihrer Immobilie anfordern",
      },
    whatsapp: { cta: "Sprechen Sie mit uns auf WhatsApp" },
    footer: { payoff: "Wir prüfen die Unterlagen vor der Veröffentlichung. Und wir gehen selbst ans Telefon, bis zum Notartermin.", naviga: "Navigation", orari: "Öffnungszeiten", monFri: "Mo – Fr", sat: "Samstag", sun: "Sonntag", onAppt: "Nach Vereinbarung", valuta: "Bewertung anfordern", privacy: "Datenschutz", cookie: "Cookies", cookiePrefs: "Cookie-Einstellungen", contatti: "Kontakt", lavora: "Arbeiten Sie mit uns", faq: "Häufige Fragen", caseVendute: "Verkaufte Immobilien" },
    lang: { label: "Sprache" },
  },
  es: {
    nav: { vendi: "Vender", acquista: "Comprar", metodo: "El Método", servizi: "Servicios", openDomus: "Open Domus", case: "Inmuebles", recensioni: "Reseñas", chiSiamo: "Quiénes somos", lavora: "Únete al equipo", contatti: "Contacto", percorso: "Recorrido" },
    header: { valuta: "Solicita la valoración", whatsapp: "Habla con nosotras por WhatsApp" },
    cursor: { scopri: "Descubrir", trascina: "Arrastrar" },
    hero: {
      title1: "Vende tu casa en Tradate",
      title2: "al precio justo, en el tiempo justo.",
      ctaValuta: "Solicita la valoración de tu inmueble",
    },
    search: {
      title: "¿Qué casa estás buscando?",
      nlPlaceholder: "Ej. piso de tres habitaciones con jardín en Tradate por menos de 300.000 €",
      nlTeaser: "Búsqueda inteligente",
      nlHint: "Escribe como nos hablarías y encuentra la casa adecuada.",
      sellerTitle: "¿Necesitas vender?",
      sellerCopy: "Antes de publicarla la preparamos, comprobamos sus documentos y te acompañamos hasta la escritura.",
      sellerCta: "Solicita la valoración de tu inmueble",
      },
    whatsapp: { cta: "Habla con nosotras por WhatsApp" },
    footer: { payoff: "Comprobamos los documentos antes de publicar. Al teléfono respondemos nosotras, hasta la escritura.", naviga: "Navegar", orari: "Horario", monFri: "Lun – Vie", sat: "Sábado", sun: "Domingo", onAppt: "Con cita previa", valuta: "Solicita la valoración", privacy: "Privacidad", cookie: "Cookies", cookiePrefs: "Preferencias de cookies", contatti: "Contacto", lavora: "Trabaja con nosotras", faq: "Preguntas frecuentes", caseVendute: "Casas vendidas" },
    lang: { label: "Idioma" },
  },
};
