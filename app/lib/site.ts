// Dati di contatto e costanti del brand Domus Tua.
// NB: i numeri "trust" (4.9/5, 500+ recensioni) sono indicati come reali nel brief.
// I dati immobili e le recensioni nel sito sono DEMO da sostituire con quelli reali.

export const site = {
  name: "Domus Tua",
  legal: "Domus Tua srl Società unipersonale",
  vat: "03836560122",
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
  rating: "4.9",
  reviewsCount: "500+",
  videosCountLabel: "440+",
  videosCountNote: "video tra tour, recensioni e Open Domus",
  // Claim descrittivo/verificabile (non superlativo assoluto senza fonte, art. 2598 c.c.).
  // Se il cliente documenta il primato "più recensita", si può ripristinare la versione forte.
  authority: "Tra le agenzie immobiliari indipendenti più recensite della provincia di Varese.",
  // Google Business reale (CID ricavato dal Maps embed del sito ufficiale Domus Tua).
  googleReviewsUrl: "https://www.google.com/maps?cid=1402630747648240075",
  // Canali social reali. ⚠️ Facebook e TikTok da confermare con il cliente.
  social: {
    instagram: {
      label: "Instagram",
      handle: "@domustuaimmobiliare_tradate",
      href: "https://www.instagram.com/domustuaimmobiliare_tradate/",
    },
    facebook: { label: "Facebook", href: "https://www.facebook.com/DomusTuaImmobiliare" },
    tiktok: { label: "TikTok", href: "https://www.tiktok.com/@domustuaimmobiliare" },
    youtube: { label: "YouTube", href: "https://www.youtube.com/@DOMUSTUASRLIMMOBILIARE" },
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
