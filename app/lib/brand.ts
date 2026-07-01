// Gestione logo: original-first, con fallback al wordmark SVG attuale.
// Il cliente ha chiesto di NON ridisegnare il logo in MVP. Quando arriva l'asset
// ufficiale, mettilo in /public e imposta useOriginalLogo: true. Vedi docs/logo-assets.md.
export const brand = {
  useOriginalLogo: false,
  logo: "/logo-domustua.svg", // versione a colori (header su chiaro)
  logoLight: "/logo-domustua-light.svg", // versione chiara (footer su scuro)
  width: 168,
  height: 40,
} as const;
