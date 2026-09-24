import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { siteUrl, isIndexableDeployment } from "./lib/site";

// Origin: fonte unica in app/lib/site.ts.
const base = siteUrl;

// Questa rotta legge gli header della richiesta (serve l'host reale, vedi
// isIndexableDeployment): Next la tratta quindi come dinamica invece di generarla una volta
// in build. È voluto — un robots.txt deciso in build non può sapere da quale dominio verrà
// servito, che è esattamente l'informazione che qui conta.

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
export const RETRIEVAL_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "Bingbot",
];

/**
 * Le regole robots.txt a partire dalla sola decisione «indicizzabile?». Pura e
 * verificabile senza il runtime di Next (robots() ci arriva dopo aver letto
 * l'host dalla richiesta). Vedi il test di go-live.
 */
export function robotsRules(indexable: boolean): MetadataRoute.Robots {
  if (!indexable) {
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

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  // Dietro il proxy di Vercel l'host richiesto arriva in x-forwarded-host; host resta il
  // ripiego per chi serve l'app senza proxy davanti.
  const requestHost = h.get("x-forwarded-host") ?? h.get("host");

  return robotsRules(
    isIndexableDeployment({
      vercelEnv: process.env.VERCEL_ENV,
      previewBadge: process.env.NEXT_PUBLIC_PREVIEW_BADGE,
      requestHost,
    }),
  );
}
