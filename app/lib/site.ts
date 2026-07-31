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
    city: "21049 Tradate",
    province: "Varese",
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
  // NB: nessun conteggio video qui. Il vecchio `videosCountLabel: "440+"` era una stima non
  // verificata mostrata come dato: rimosso. Se il cliente fornisce il numero reale del canale
  // (@DOMUSTUASRLIMMOBILIARE) si potrà reintrodurre, con la fonte annotata come per gli altri
  // campi di questo file. Vedi il test di content integrity.
  // Claim descrittivo/verificabile (non superlativo assoluto senza fonte, art. 2598 c.c.).
  // Se il cliente documenta il primato "più recensita", si può ripristinare la versione forte.
  authority: "Tra le agenzie immobiliari indipendenti più recensite della provincia di Varese.",
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
 * Origin pubblico del sito — FONTE UNICA.
 *
 * Prima era ricalcolato (con lo stesso fallback copiaincollato) in layout.tsx, sitemap.ts,
 * robots.ts e case/[slug]/page.tsx: bastava aggiornarne uno per avere metadata incoerenti.
 * `NEXT_PUBLIC_*` è pubblico per definizione, quindi la costante è leggibile anche dai
 * componenti client senza esporre nulla di sensibile.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.domustua.com";

// Href assoluti verso le pagine dedicate.
export const nav = [
  { key: "vendi", label: "Vendi", href: "/vendi" },
  { key: "acquista", label: "Acquista", href: "/acquista" },
  { key: "metodo", label: "Metodo Domus", href: "/metodo" },
  { key: "openDomus", label: "Open Domus", href: "/open-domus" },
  { key: "case", label: "Case", href: "/case" },
  { key: "recensioni", label: "Recensioni", href: "/recensioni" },
  { key: "chiSiamo", label: "Chi siamo", href: "/chi-siamo" },
  { key: "contatti", label: "Contatti", href: "/contatti" },
] as const;
