import type { NextConfig } from "next";

/**
 * Intestazioni di sicurezza applicate a ogni risposta.
 *
 * Nessuna Content-Security-Policy per ora: il sito carica GSAP con stili inline, il widget
 * Trustindex e gli embed YouTube, e una CSP scritta a occhio si romperebbe in produzione senza
 * che nessuno se ne accorga fino alla prima segnalazione. Le altre intestazioni invece non
 * hanno controindicazioni e coprono i rischi concreti: sniffing del tipo MIME, incorniciamento
 * del sito in una pagina altrui, referrer che perde informazioni, permessi di dispositivo che
 * non ci servono. La CSP resta un lavoro a sé, da fare in report-only con un endpoint che
 * raccolga le violazioni (vedi docs/security-and-abuse.md).
 */
const securityHeaders = [
  // Il browser non "indovina" il tipo di un file: un .txt caricato non diventa uno script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Il sito non va incorniciato altrove: niente clickjacking sul form contatti.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Fuori dal sito esce solo l'origine, non il percorso completo.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permessi che il sito non usa e che quindi nessuno script può chiedere.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // HTTPS obbligatorio per due anni, sottodomini compresi (Vercel serve già solo HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Nota fase 4 (WOW layer): valutate le View Transitions sperimentali per lo
  // shared element card→scheda, ma il React in uso (19.2.4 stabile, e anche il
  // vendored di Next 16.2.9) non esporta <ViewTransition> → percorso coperto
  // dalla page transition GSAP. Da rivalutare a runtime React canary.
  images: {
    // Formati moderni: meno peso, stessa qualità.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 220, 300, 384],
    // Thumbnail YouTube (LazyYouTubeEmbed): ottimizzate via next/image invece di servite raw.
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      // Foto immobili dal feed RealSmart (gestionale = source of truth).
      { protocol: "https", hostname: "cloud2.realsmart.it" },
      { protocol: "https", hostname: "*.realsmart.it" },
    ],
  },
};

export default nextConfig;
