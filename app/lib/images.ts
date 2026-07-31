// Sorgenti immagine consentite. Modulo PURO, condiviso tra parser del feed e UI.
//
// Le foto degli immobili arrivano da un sistema esterno (RealSmart): l'elenco degli host
// ammessi decide da dove il browser scarica risorse, quindi non può essere lasciato al feed.
// Deve restare allineato a `images.remotePatterns` in next.config.ts — un URL fuori lista
// romperebbe next/image a runtime.

/** Host remoti ammessi: il dominio RealSmart e i suoi sottodomini, solo in HTTPS. */
export function isAllowedRemoteImage(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return parsed.hostname === "realsmart.it" || parsed.hostname.endsWith(".realsmart.it");
  } catch {
    return false;
  }
}

/**
 * Sorgente mostrabile dalla UI: un asset locale del sito (`/images/…`) oppure un URL remoto
 * consentito. Serve al lightbox per non aprire mai in grande un'immagine di provenienza
 * arbitraria, anche se finisse nella galleria per un errore a monte.
 */
export function isDisplayableImage(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  return isAllowedRemoteImage(src);
}
