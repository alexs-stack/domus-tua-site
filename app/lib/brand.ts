// Gestione logo — ORIGINAL-FIRST (direttiva cliente: NON ridisegnare il logo in MVP).
// Il logo ufficiale Domus Tua è il default e va usato ovunque, perché è già presente
// su tutti i materiali del cliente. Basta depositare i file in /public con questi nomi.
//
//   /public/logo-domustua-original.svg        → versione a colori (header su chiaro)
//   /public/logo-domustua-original-light.svg  → versione chiara (footer su scuro)
//   /public/favicon.ico                       → favicon / avatar
//
// Finché i file mancano, in dev/preview compare un placeholder onesto "Logo ufficiale
// mancante" (mai un logo finto ridisegnato). Vedi docs/logo-assets.md.
//
// `LogoMark` in Logo.tsx resta SOLO come fallback interno di sviluppo (useOriginalLogo:false),
// non è il default e non va usato in presentazione cliente.
export const brand = {
  useOriginalLogo: true,
  // Logo UFFICIALE reale (da domustua.com): PNG trasparente 500×92, colori del brand.
  logo: "/logo-domustua-original.png", // header su sfondo chiaro
  // Nessuna variante chiara fornita: nel footer scuro il logo va su una chip chiara
  // (vedi Footer.tsx). Chiedere al cliente un SVG + versione monocromatica chiara.
  logoLight: "/logo-domustua-original.png",
  favicon: "/favicon.ico",
  width: 200,
  height: 37,
} as const;

// Mostra il placeholder "logo mancante" solo in sviluppo o in preview (mai in produzione
// reale), così la demo cliente resta onesta senza spacciare un logo finto per l'ufficiale.
export const showLogoDevPlaceholder =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_PREVIEW_BADGE === "true";
