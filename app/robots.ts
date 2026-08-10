import type { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";

// Origin: fonte unica in app/lib/site.ts.
const base = siteUrl;

// Indicizzazione SOLO in produzione. Su preview/staging (o quando il badge di anteprima è
// attivo) blocchiamo i crawler: gli URL di anteprima Vercel NON devono finire su Google.
// - Vercel imposta VERCEL_ENV = "production" | "preview" | "development".
// - Fallback (assente): consideriamo "produzione" solo se il badge anteprima NON è "true".
// Prima del go-live verificare che il dominio finale sia in VERCEL_ENV=production. Vedi
// docs/vercel-live-checklist.md (§SEO).
const isProduction = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === "production"
  : process.env.NEXT_PUBLIC_PREVIEW_BADGE !== "true";

// Bot che recuperano pagine per RISPONDERE a una persona, non per addestrare un modello.
// Sono due cose diverse e vanno tenute separate: OpenAI scrive che «Sites that are opted out
// of OAI-SearchBot will not be shown in ChatGPT search answers». Bloccarli non protegge da
// nulla, toglie soltanto Domus Tua dalle risposte di ChatGPT, Perplexity e Copilot.
//
// Restano FUORI da questa lista, perché sono una scelta della cliente e non una nostra:
//   • GPTBot, ClaudeBot, CCBot — addestramento;
//   • Google-Extended — non è un crawler ma il permesso d'uso per le app Gemini e il
//     grounding di Vertex. Attenzione: il grounding è recupero, non addestramento, quindi
//     negarlo toglie l'agenzia dalle risposte di Gemini. Non è la scelta indolore che sembra.
//     (AI Overviews e AI Mode seguono Googlebot e non hanno un opt-out separato.)
const RETRIEVAL_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    // Anteprima/staging: niente indicizzazione, nessun sitemap esposto ai crawler.
    //
    // ⚠️ I gruppi nominati NON vanno emessi qui, e non è una svista da correggere.
    // Nel protocollo robots i gruppi non si sommano: un bot applica SOLO il gruppo più
    // specifico che lo riguarda. Un `User-agent: OAI-SearchBot` incondizionato non
    // erediterebbe questo `Disallow: /` — annullerebbe la protezione delle anteprime
    // proprio per i bot che ci interessa governare, e per giunta su un sito che oggi vive
    // ancora sulle anteprime. Chi aggiunge un Disallow al gruppo `*` qui sotto deve
    // replicarlo in ogni gruppo nominato del ramo di produzione.
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...RETRIEVAL_BOTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
