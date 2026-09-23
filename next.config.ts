import type { NextConfig } from "next";
import { siteUrl } from "./app/lib/site";

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
  async redirects() {
    return [
      // ── Sottodominio annunci.domustua.com (catalogo del vecchio gestionale) ────
      //
      // Sta PRIMA di tutto il resto di proposito: sull'host degli annunci ogni URL deve
      // uscire con UN SOLO salto. Se questa regola stesse in fondo, `annunci/vendi-casa`
      // combacerebbe prima con la riga `/vendi-casa` qui sotto e atterrerebbe su
      // `annunci.domustua.com/vendi` — host sbagliato, e un secondo salto per rimediare.
      //
      // ⚠️ La destinazione è ASSOLUTA, e non è una scelta di stile. Con una destinazione
      // relativa (`/acquista`) il browser resterebbe sul sottodominio, l'host tornerebbe a
      // combaciare e il redirect si riapplicherebbe: ciclo infinito. L'origine viene da
      // `siteUrl` (fonte unica in app/lib/site.ts), così un cambio di dominio non lascia
      // qui dentro un valore vecchio.
      //
      // Destinazione IN BLOCCO su /acquista, non scheda per scheda: lo slug delle schede
      // nuove è il codice RealSmart, e senza l'inventario reale delle URL del sottodominio
      // una mappa puntuale sarebbe inventata. Quando il rapporto Pagine di Search Console
      // darà i percorsi veri, le righe puntuali vanno aggiunte QUI SOPRA (prima del
      // jolly), non al posto suo: il jolly resta la rete di sicurezza.
      //
      // ⚠️ Questa regola vive nel codice, ma da sola non basta: si applica solo se
      // `annunci.domustua.com` punta a QUESTO deploy. Finché il DNS del sottodominio
      // risponde dal vecchio hosting, il sito nuovo non lo vede nemmeno passare.
      // Vedi docs/migration-checklist.md.
      {
        source: "/:path*",
        has: [{ type: "host", value: "annunci.domustua.com" }],
        destination: `${siteUrl}/acquista`,
        permanent: true,
      },

      // L'indice /case non esiste più: il catalogo con la ricerca vive su /acquista.
      // Match esatto (le schede /case/<slug> restano), query param preservati di default
      // così i vecchi link /case?comune=… continuano a pre-impostare i filtri.
      { source: "/case", destination: "/acquista", permanent: true },

      // ── Sito WordPress precedente (dismesso al passaggio del dominio) ──────────
      //
      // Inventario di partenza: i 25 URL di https://www.domustua.com/wp-sitemap-posts-page-1.xml
      // (rilevato il 2026-08-10). NON è l'inventario dell'indicizzato: prima del go-live va
      // incrociato con il rapporto Pagine di Search Console sugli ultimi 16 mesi, perché un
      // sito vivo dal 2007 ha URL che il sitemap del nucleo WordPress non espone
      // (/?p=N, /category/*, /tag/*, pagine allegato). Vedi docs/retainer-plan.md §5.0-5.1.
      //
      // DUE COSE DA SAPERE PRIMA DI TOCCARE QUESTA LISTA:
      //
      // 1. Tutti gli URL legacy finiscono con "/" e le rotte nuove no. Con `trailingSlash`
      //    al default (false) Next normalizza PRIMA `/vendi-casa/` → `/vendi-casa` e poi
      //    applica il redirect: due risposte, non una. È accettabile (Google segue le
      //    catene brevi senza penalità) ed è il motivo per cui le `source` qui sotto NON
      //    portano lo slash: scriverlo non toglierebbe il salto, lo renderebbe solo
      //    invisibile a chi legge.
      // 2. `permanent: true` emette **308**, non 301 (scelta di Next per preservare il
      //    metodo della richiesta). Ai fini della canonicalizzazione sono equivalenti: chi
      //    verifica con `curl -sIL` deve accettare 308, altrimenti segnala 25 falsi errori.
      //
      // L'ordine conta: la prima regola che combacia vince, quindi le voci puntuali
      // precedono i caratteri jolly.

      // Le due pagine di ingresso del vecchio menu.
      { source: "/cerchi-casa", destination: "/acquista", permanent: true },
      { source: "/vendi-casa", destination: "/vendi", permanent: true },

      // Il catalogo immobili sul dominio principale del vecchio sito. La riga con il jolly
      // copre le eventuali schede figlie (/proprieta/<annuncio>): come per il sottodominio,
      // vanno in blocco su /acquista finché non esiste l'inventario reale delle URL.
      { source: "/proprieta/:path*", destination: "/acquista", permanent: true },
      { source: "/proprieta", destination: "/acquista", permanent: true },

      // Servizi. Open Domus ha una pagina propria; gli altri cinque confluiscono nell'hub
      // finché non avranno la loro (docs/retainer-plan.md §7.1: sono le destinazioni
      // previste, ed è il motivo per cui quelle pagine sono il primo lavoro editoriale).
      { source: "/servizi-domus/open-domus", destination: "/open-domus", permanent: true },
      { source: "/servizi-domus/:slug", destination: "/servizi", permanent: true },
      { source: "/servizi-domus", destination: "/servizi", permanent: true },

      // Team: sei pagine persona più l'indice. Oggi non esiste una rotta per persona
      // (§7.3 la prevede): finché non c'è, tutte a /chi-siamo, che contiene il team.
      { source: "/team/:slug", destination: "/chi-siamo", permanent: true },
      { source: "/team", destination: "/chi-siamo", permanent: true },

      // Duplicato indicizzabile rimasto nel vecchio CMS ("Chi siamo – Copy").
      { source: "/chi-siamo-copy", destination: "/chi-siamo", permanent: true },

      // Tre porte diverse verso la stessa cosa: le candidature.
      { source: "/entra-a-far-parte-del-team", destination: "/lavora-con-noi", permanent: true },
      { source: "/candidatura", destination: "/lavora-con-noi", permanent: true },
      { source: "/diventa-agente", destination: "/lavora-con-noi", permanent: true },

      // Legali: cambiano nome, non contenuto.
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/cookies-policy", destination: "/cookie", permanent: true },

      // Il sitemap del nucleo WordPress è linkato dal vecchio robots.txt ed è citato da
      // strumenti terzi: mandarlo al nostro invece che in 404.
      { source: "/wp-sitemap.xml", destination: "/sitemap.xml", permanent: true },

      // NB: /, /contatti e /chi-siamo esistono con lo stesso percorso e non vanno redirette.
      // "Valuta il tuo immobile" è nel menu del vecchio sito ma non nel suo sitemap: se
      // risulta essere una pagina reale, la sua riga va aggiunta qui prima del passaggio.
    ];
  },
  // Nota fase 4 (WOW layer): valutate le View Transitions sperimentali per lo
  // shared element card→scheda, ma il React in uso (19.2.4 stabile, e anche il
  // vendored di Next 16.2.9) non esporta <ViewTransition> → percorso coperto
  // dalla page transition GSAP. Da rivalutare a runtime React canary.
  images: {
    // Formati moderni: meno peso, stessa qualità.
    formats: ["image/avif", "image/webp"],
    // Next 16: le qualità NON in lista vengono riportate alla più vicina
    // (default [75]) — senza questa lista i quality={} dei componenti sono
    // silenziosamente ignorati. 60 = immagini velate/di sfondo; 78 = hero
    // (sorgente WhatsApp già compressa, non va ricompressa aggressivamente).
    qualities: [60, 75, 78],
    // 2560: l'hero è full-bleed anche su schermi QHD — senza questo taglio
    // il browser stira la variante 1920.
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920, 2560],
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
