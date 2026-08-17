// Dati di contatto e costanti del brand Domus Tua.
// Dati societari/contatti/orari VERIFICATI dal sito ufficiale domustua.com + Registro Imprese
// (lug 2026). Recensioni: 4,9/5 su Google, ~531 recensioni (fonte Trustindex, giu 2026).
// I dati immobili e le recensioni testuali nel sito sono DEMO da sostituire con quelli reali.

export const site = {
  name: "Domus Tua",
  legal: "Domus Tua srl Società unipersonale",
  vat: "03836560122",
  rea: "VA 382680",
  capital: "25.000", // capitale sociale interamente versato (€)
  since: 2007,
  address: {
    street: "Corso Bernacchi 91",
    // Parti ATOMICHE per i dati strutturati (schema.org PostalAddress): prima
    // erano ricopiate a mano in layout.tsx ("21049", "Tradate", "VA"), e la
    // sigla provincia divergeva pure — layout diceva "VA", la scheda immobile
    // `site.address.province` cioè "Varese". Una fonte sola, nessuna divergenza.
    postalCode: "21049",
    /** Comune (schema.org addressLocality). */
    locality: "Tradate",
    /** Forma di visualizzazione (CAP + comune): usata nel corpo del sito. */
    city: "21049 Tradate",
    /** Nome esteso della provincia (display). */
    province: "Varese",
    /** Sigla ISO della provincia (schema.org addressRegion). */
    region: "VA",
  },
  phone: { label: "0331 844898", href: "tel:+390331844898" },
  whatsapp: {
    label: "346 6042314",
    href: "https://wa.me/393466042314?text=Ciao%20Domus%20Tua%2C%20vorrei%20informazioni",
  },
  email: { label: "info@domustua.com", href: "mailto:info@domustua.com" },
  // Orari reali (fonte: domustua.com/contatti). Pomeriggio = 14:30 (non 15:00).
  hours: {
    weekdays: "9:00 – 12:30 · 14:30 – 19:00",
    saturday: "9:00 – 12:30",
  },
  // Spec orari per i dati strutturati (schema.org openingHours).
  openingHours: ["Mo-Fr 09:00-12:30", "Mo-Fr 14:30-19:00", "Sa 09:00-12:30"],
  rating: "4.9",
  reviewsCount: "531",
  /** Conteggio ARROTONDATO per difetto, per le frasi "oltre 500 recensioni".
      Derivato da reviewsCount (531): stessa fonte, così i due non divergono
      (il test di content-integrity lo verifica). */
  reviewsApprox: "500",
  // NB: nessun conteggio video qui. Il vecchio `videosCountLabel: "440+"` era una stima non
  // verificata mostrata come dato: rimosso. Se il cliente fornisce il numero reale del canale
  // (@DOMUSTUASRLIMMOBILIARE) si potrà reintrodurre, con la fonte annotata come per gli altri
  // campi di questo file. Vedi il test di content integrity.
  // Claim di autorevolezza.
  //
  // La versione precedente ("Tra le agenzie immobiliari indipendenti più recensite della
  // provincia di Varese") sbagliava tre cose in una riga: rimpiccioliva il territorio
  // (una classifica nazionale raccontata come provinciale), sbagliava il criterio
  // (Wikicasa Top Agency è costruita sul fatturato, non sulle recensioni) e buttava via
  // la ripetizione (tre anni consecutivi diventavano uno). E soprattutto DUPLICAVA la
  // prova già data dal 4,9/531 invece di aggiungerne una indipendente.
  //
  // L'ultima frase non è un ornamento: il premio da solo dice "siamo grandi", il premio
  // più "una sola sede, indipendenti, a guida femminile" dice quanto vale arrivarci da
  // Tradate, senza una rete nazionale dietro.
  authority:
    "Tre anni consecutivi tra le migliori 400 agenzie immobiliari d'Italia, in una classifica nazionale costruita sul fatturato. Da un'agenzia indipendente, a guida femminile, con una sola sede: Tradate.",
  // Riconoscimento Wikicasa (mostrato accanto al voto in StarReviews). Le parti
  // stabili stanno qui, una volta sola, invece che ripetute nella copy per ogni
  // lingua; il testo accessibile localizzato resta nel componente.
  //
  // `years` è la ripetizione, ed è la parte che conta: un anno è un risultato, tre
  // consecutivi sono un andamento. `label` resta la dicitura del riconoscimento.
  // Niente `issuer` separato: l'ente è dentro la denominazione ("Top Agency Wikicasa"),
  // e tenerlo come campo a parte significava soltanto stamparlo due volte di fila.
  award: {
    label: "Top Agency Wikicasa",
    years: [2024, 2025, 2026],
    href: "https://www.wikicasa.it/agenzia-immobiliare/domus-tua-178643",
  },
  // Google Business reale (CID ricavato dal Maps embed del sito ufficiale Domus Tua).
  googleReviewsUrl: "https://www.google.com/maps?cid=1402630747648240075",
  // Canali social REALI di Domus Tua Tradate (verificati).
  social: {
    instagram: {
      label: "Instagram",
      handle: "@domustuaimmobiliare_tradate",
      href: "https://www.instagram.com/domustuaimmobiliare_tradate/",
    },
    facebook: { label: "Facebook", href: "https://www.facebook.com/domustuaimmobiliaretradate/" },
    tiktok: { label: "TikTok", href: "https://www.tiktok.com/@domustuaimmobiliare" },
    youtube: { label: "YouTube", href: "https://www.youtube.com/@DOMUSTUASRLIMMOBILIARE" },
  },

  // Video REALI dal canale YouTube Domus Tua (@DOMUSTUASRLIMMOBILIARE), verificati.
  // Sorgente unica usata da SocialVideoWall + FeaturedTestimonial. Il cliente può
  // sostituire/aggiungere ID e timestamp; qui usiamo clip già pubbliche del canale.
  videos: {
    // Storia di successo — "Venduta al primo Open Domus" (villa di Roberta).
    featured: { id: "-82TSzY_TDE", title: "Villa di Roberta, venduta al primo Open Domus" },
    // Video recensioni reali.
    reviews: [
      { id: "eKwNiDl0Buo", title: "Recensione — Felicemente venduta" },
      { id: "RU-31QWTXuk", title: "Recensione — Serenamente venduta" },
      { id: "tCWd90eY8-Y", title: "Recensione — Facile vendere, sicuro acquistare" },
    ],
    // Testimonianza cliente (acquisto + vendita al primo Open Domus).
    testimonial: { id: "ceAu37wLTb4", title: "Carmine racconta la sua esperienza con Domus Tua" },
    // Storia di Teresa, venduta al primo Open Domus (sezione + pagina Open Domus).
    openDomus: { id: "gYePYQHNTUM", title: "Teresa, venduta al primo Open Domus" },
    // Presentazione del team Domus Tua (sezione Chi siamo).
    team: { id: "PRB3exiOa3I", title: "Il team Domus Tua si presenta" },
  },

  // ───────────────────────────────────────────────────────────
  // EMBED LIVE — incolla qui i codici dei widget per andare "live".
  // Finché restano vuoti, il sito mostra un fallback statico curato.
  //  • trustindexSrc: lo trovi nel pannello Trustindex (è già usato sul sito attuale)
  //    es. "https://cdn.trustindex.io/loader.js?XXXXXXXXXXXXXX"
  //  • instagramIframe: URL iframe di un widget IG (es. LightWidget / Behold / EmbedSocial)
  //    es. "https://cdn.lightwidget.com/widgets/XXXXXXXX.html"
  // ───────────────────────────────────────────────────────────
  embeds: {
    // Widget Trustindex REALE di Domus Tua (recensioni Google verificate).
    // Caricato via loader.js ufficiale DENTRO un iframe srcDoc con <meta charset="utf-8">
    // (vedi Reviews.tsx): document.currentScript è valido (script statico nel srcDoc) e gli
    // accenti restano corretti. NON iframare content.html raw: è servito senza charset →
    // mojibake (Ã¨, â€™). Hash widget: 3e10adc2514d705589260c30307 (da domustua.com).
    trustindexLoader: "https://cdn.trustindex.io/loader.js?3e10adc2514d705589260c30307",
    instagramIframe: "",
  },
} as const;

/**
 * VALORI PUBBLICATI MA NON CONFERMATI DAL CLIENTE.
 *
 * Struttura SOLO di codice: non viene MAI resa in pagina (niente etichette "da
 * confermare" o "TBD" visibili agli utenti — quelle sarebbero peggio del dato).
 * Serve a due cose: (1) documentare, in modo tipizzato e verificabile, le voci
 * su cui due sorgenti interne divergevano o il cui ruolo non è chiaro; (2) NON
 * scegliere al posto del cliente — ogni voce conserva TUTTI i candidati, indica
 * quale è pubblicato oggi e perché (il meno rischioso / già nella fonte unica),
 * e resta in attesa di conferma. La lista "conferme richieste" per il cliente si
 * ricava da qui. Il test di content-integrity verifica che il valore pubblicato
 * qui coincida con quello effettivamente usato dalla fonte unica.
 */
export const pendingConfirmation = {
  weekdayAfternoonOpening: {
    field: "Orario di riapertura pomeridiana, da lunedì a venerdì",
    published: "14:30",
    candidates: ["14:30", "15:00"],
    note:
      "site.ts e i dati strutturati (schema.org openingHours) dichiarano 14:30, " +
      "annotato come verificato da domustua.com; la pagina /contatti mostrava 15:00. " +
      "Unificato a 14:30 — il valore già presente nella fonte unica e nei dati " +
      "strutturati, quindi senza cambiare ciò che leggono i motori di ricerca. " +
      "NON è una decisione sul valore vero: entrambi restano candidati fino alla " +
      "conferma del cliente.",
  },
  wikicasaAward: {
    field: "Premio Wikicasa — denominazione esatta, anni e perimetro",
    published: {
      label: site.award.label,
      years: site.award.years,
      perimeter: "migliori 400 agenzie d'Italia, classifica nazionale su base fatturato",
    },
    candidates: [
      "Top Agency Wikicasa 2024/2025/2026 — nazionale, su fatturato",
      "Top Agency 2026 — provinciale, sulle recensioni (versione pubblicata fino al 2026-08-15)",
    ],
    note:
      "Il claim è stato riscritto perché quello precedente era sbagliato per difetto: " +
      "raccontava come provinciale e basata sulle recensioni una classifica che è " +
      "nazionale e costruita sul fatturato, e citava un anno solo invece di tre. " +
      "La fonte verificabile è il profilo pubblico Wikicasa (site.award.href). " +
      "PRIMA DEL GO-LIVE la direzione deve confermare denominazione esatta, i tre anni " +
      "e il perimetro: una prova vale perché è esatta, non perché è forte, e questa è " +
      "l'unica prova indipendente dal voto Google che l'agenzia possiede.",
  },
  emailRoles: {
    field: "Indirizzi email — pubblico vs operativo",
    published: {
      public: site.email.label, // mostrata sul sito
      operational: "immobiliare@domustua.it", // casella dove arrivano i lead (assistant/config.ts)
      sender: "assistente@domustua.it", // mittente tecnico delle notifiche (Resend)
    },
    candidates: [site.email.label, "immobiliare@domustua.it"],
    note:
      "Sul sito compaiono ruoli diversi: l'email PUBBLICA è " +
      `${site.email.label}, mentre i lead vengono instradati a immobiliare@domustua.it. ` +
      "Da confermare col cliente che siano corretti e intenzionalmente distinti " +
      "(pubblico ≠ casella operativa). Nessuno dei due viene scelto o unificato qui.",
  },
} as const;

/**
 * Origin pubblico del sito — FONTE UNICA.
 *
 * Prima era ricalcolato (con lo stesso fallback copiaincollato) in layout.tsx, sitemap.ts,
 * robots.ts e case/[slug]/page.tsx: bastava aggiornarne uno per avere metadata incoerenti.
 * `NEXT_PUBLIC_*` è pubblico per definizione, quindi la costante è leggibile anche dai
 * componenti client senza esporre nulla di sensibile.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.domustua.com";

/** Host del dominio canonico ("www.domustua.com"): serve a robots per riconoscersi. */
export const siteHost = new URL(siteUrl).host;

/**
 * Questo deploy può essere indicizzato?
 *
 * NON basta `VERCEL_ENV === "production"`. Il 10 agosto 2026 il sito girava su
 * `domus-tua-ten.vercel.app` con robots aperto a tutti e un `Sitemap:` che puntava a
 * www.domustua.com — dominio che allora serviva ancora il vecchio WordPress. Cioè: una copia
 * completa del sito, indicizzabile, che dichiarava come proprie delle URL altrui.
 * Il difetto non era la variabile mancante ma il fatto che NESSUNA variabile può sapere da
 * quale host sta rispondendo il server: `NEXT_PUBLIC_SITE_URL` dice dove il sito *vorrebbe*
 * stare, non dove *sta*.
 *
 * Quindi si guarda l'host della richiesta. Finché il dominio non è agganciato, ogni anteprima
 * Vercel resta chiusa da sola, senza che nessuno debba ricordarsi di impostare un flag.
 *
 * In locale (nessun VERCEL_ENV) la regola resta quella di prima — il badge di anteprima —
 * altrimenti `npm run dev` mostrerebbe sempre un robots chiuso e non si potrebbe verificare
 * quello vero.
 */
export function isIndexableDeployment(env: {
  vercelEnv?: string;
  previewBadge?: string;
  requestHost?: string | null;
}): boolean {
  if (!env.vercelEnv) return env.previewBadge !== "true";
  if (env.vercelEnv !== "production") return false;
  if (!env.requestHost) return false;
  // www e apex contano come lo stesso sito: uno dei due reindirizza all'altro, e far
  // dipendere l'indicizzazione da quale dei due è stato configurato primario sarebbe una
  // trappola silenziosa il giorno del passaggio.
  const bare = (h: string) => h.toLowerCase().replace(/^www\./, "");
  return bare(env.requestHost) === bare(siteHost);
}

// Href assoluti verso le pagine dedicate.
export const nav = [
  { key: "vendi", label: "Vendi", href: "/vendi" },
  { key: "acquista", label: "Acquista", href: "/acquista" },
  { key: "metodo", label: "Metodo Domus", href: "/metodo" },
  // Il metodo, poi i servizi che lo mettono in pratica, poi Open Domus (uno di
  // quei servizi, messo in evidenza). La pagina /servizi esisteva ma non era
  // raggiungibile dalla navigazione principale.
  { key: "servizi", label: "Servizi", href: "/servizi" },
  { key: "openDomus", label: "Open Domus", href: "/open-domus" },
  { key: "recensioni", label: "Recensioni", href: "/recensioni" },
  { key: "chiSiamo", label: "Chi siamo", href: "/chi-siamo" },
  // Sta accanto a "Chi siamo" perché è la stessa domanda vista dall'altra parte:
  // lì si racconta chi siamo, qui chi vorremmo diventare. Prima di "Contatti",
  // che resta l'ultima voce perché è l'ultimo passo.
  { key: "lavora", label: "Lavora con noi", href: "/lavora-con-noi" },
  { key: "contatti", label: "Contatti", href: "/contatti" },
] as const;

/**
 * Anni di attività, derivati da `site.since` — MAI scritti a mano.
 *
 * Il sito diceva tre cose diverse sulla stessa età: "oltre quindici anni" nel Metodo e in
 * Chi siamo, il conteggio esatto nei numeri della home, "dal 2007" nel footer. Quindici era
 * vero nel 2022. Una funzione (non una costante di modulo) perché un server che resta su per
 * mesi attraverserebbe un capodanno con il valore congelato all'import.
 */
export function yearsActive(): number {
  return new Date().getFullYear() - site.since;
}

/**
 * Serializza dati strutturati per un tag `<script type="application/ld+json">`.
 *
 * `JSON.stringify` da solo non basta: non tocca la sequenza `</script>`, e i titoli e le
 * descrizioni degli immobili arrivano dal gestionale — cioè da fuori. Un annuncio con
 * `</script><script>…` chiuderebbe il tag e il resto verrebbe eseguito. Sfuggire `<` (e i
 * separatori di riga U+2028/2029, che rompono il parser JS) chiude la strada.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Il sito come entit\u00e0, con la sua ricerca interna (punto 26).
 *
 * `SearchAction` dichiara a Google che il sito ha una ricerca propria e come interrogarla.
 * Serve al box di ricerca nei risultati (sitelinks searchbox) e, pi\u00f9 in generale, a far
 * capire che /acquista non \u00e8 un elenco statico ma uno strumento.
 *
 * \u26a0\ufe0f IL PARAMETRO DEV'ESSERE VERO, E LO \u00c8: `?q=` viene letto da PropertySearch, che
 * pre-imposta i filtri dai query param (\u00e8 lo stesso meccanismo con cui HomeSearchGateway
 * passa la ricerca dalla home). Dichiarare un endpoint di ricerca che non esiste \u00e8 una
 * delle poche cose che Google verifica davvero \u2014 e qui non serve mentire, la ricerca c'\u00e8.
 */
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: site.name,
    inLanguage: "it-IT",
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/acquista?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Dati strutturati dell'organizzazione (schema.org RealEstateAgent) \u2014 nodo perno
 * del grafo (`@id` #organization). Dati societari/orari/geo VERIFICATI. NIENTE
 * `aggregateRating` (policy Google + nessun contenuto recensioni idoneo, vedi
 * app/lib/reviews.ts). Estratto qui da layout.tsx per essere verificabile con un
 * test di go-live (dati strutturati critici). Vedi app/lib/__tests__/golive.test.ts.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${siteUrl}/#organization`,
    name: "Domus Tua Immobiliare",
    legalName: site.legal,
    vatID: site.vat,
    foundingDate: String(site.since),
    url: siteUrl,
    image: `${siteUrl}/images/reali/raffaela-ritratto.jpg`,
    telephone: site.phone.href.replace("tel:", ""),
    email: site.email.label,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      addressCountry: "IT",
    },
    geo: { "@type": "GeoCoordinates", latitude: 45.7114282, longitude: 8.905019 },
    // Il territorio dichiarato era più piccolo di quello reale: "Tradate e provincia di
    // Varese" mentre a catalogo ci sono immobili a Mozzate, che è provincia di Como.
    // Dichiarare meno di quello che si copre significa escludersi da soli da metà del
    // proprio mercato naturale — la fascia fra Varese e Como è continua, non si ferma
    // al confine amministrativo.
    areaServed: ["Tradate", "Provincia di Varese", "Alta provincia di Como"],
    openingHours: site.openingHours,
    // Il premio come dato strutturato, non solo come immagine in pagina: un anno per
    // voce, che è la forma che schema.org si aspetta e che rende leggibile la
    // ripetizione (tre anni consecutivi) invece del solo anno corrente.
    award: site.award.years.map((y) => `${site.award.label} ${y}`),
    // Fascia di prezzo del SERVIZIO di mediazione, non degli immobili. Google la usa
    // nella scheda locale; senza, il campo resta vuoto e viene compilato da terzi.
    priceRange: "€€",
    sameAs: [
      site.social.instagram.href,
      site.social.facebook.href,
      site.social.tiktok.href,
      site.social.youtube.href,
    ],
  } as const;
}
