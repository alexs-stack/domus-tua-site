// Smoke test del sito, dall'esterno — le pagine e i comportamenti che DEVONO
// funzionare appena il dominio è agganciato, verificati con richieste HTTP reali.
//
//   npm run smoke                                   # default: http://127.0.0.1:3000 (locale, sicuro)
//   npm run smoke -- https://www.domustua.com       # il futuro dominio di produzione
//   SMOKE_URL=https://domus-tua.vercel.app npm run smoke
//   npm run smoke -- https://www.domustua.com --host annunci.domustua.com   # il vecchio sottodominio
//
// SICURO DI DEFAULT: senza argomenti punta a localhost, non a un dominio reale.
// NON invia mai un lead vero, né email, né eventi analytics: il form endpoint si
// interroga con un payload che il server RIFIUTA (400) — vivo, ma nessun lead.
// Esce con codice 1 se una verifica OBBLIGATORIA fallisce.

// `export {}` rende questo file un MODULO: le sue dichiarazioni top-level restano
// nel suo scope e non collidono con quelle globali di scripts/verify-deploy.ts
// (entrambi definiscono `Check`/`main`). Non cambia l'esecuzione via tsx.
export {};

// L'inventario dei 25 URL del vecchio WordPress. Lo stesso che legge il test di go-live:
// due controlli, una lista sola — altrimenti "verificato" vuol dire cose diverse nei due posti.
import { LEGACY_ALL } from "../app/lib/legacyUrls";

const args = process.argv.slice(2);

/**
 * `--host annunci.domustua.com` — prova la regola host-scoped del vecchio sottodominio.
 *
 * Sta dietro un flag e non nel giro normale perché la regola entra in funzione SOLO quando
 * il DNS di quel sottodominio punta a questo deploy: finché la direzione non decide (voce 03
 * della checklist), una verifica automatica fallirebbe raccontando un problema che non è
 * nostro. Quando il DNS è girato, questo è il comando che dice se ha funzionato.
 */
const hostFlagIndex = args.indexOf("--host");
const forcedHost = hostFlagIndex >= 0 ? args[hostFlagIndex + 1] : undefined;
const positional = args.filter((a, i) => a !== "--host" && i !== hostFlagIndex + 1);

const base = (positional[0] || process.env.SMOKE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

/**
 * Il base URL punta al dominio pubblico? Alcune verifiche cambiano natura fra un'anteprima
 * (dove `Disallow: /` è CORRETTO e voluto) e la produzione (dove è l'errore più banale e più
 * letale di una messa online — §5.2 del Documento finale di sintesi).
 */
const isProduction = /(^|\.)domustua\.com$/i.test(new URL(base).hostname);

type Check = { name: string; pass: boolean; detail: string; required?: boolean };
const checks: Check[] = [];
const add = (name: string, pass: boolean, detail: string, required = true) =>
  checks.push({ name, pass, detail, required });

const TIMEOUT = 15_000;
async function get(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${base}${path}`, { signal: AbortSignal.timeout(TIMEOUT), ...init });
}

async function checkPage(name: string, path: string) {
  try {
    const res = await get(path, { headers: { "cache-control": "no-cache" } });
    add(name, res.ok, `${path} → ${res.status}`);
    return res;
  } catch (err) {
    add(name, false, `${path} → errore: ${err instanceof Error ? err.message : "?"}`);
    return null;
  }
}

/**
 * Segue la catena di redirect a mano, contando i salti.
 *
 * `redirect: "follow"` di fetch arriverebbe alla stessa pagina finale senza dire QUANTI
 * passaggi ci sono voluti — ed è esattamente il dato che serve qui: due salti sono la
 * normalizzazione dello slash (attesa), tre sono una catena da correggere.
 */
async function followChain(from: string, max = 5) {
  const chain: string[] = [];
  let path = from;
  try {
    for (let hop = 0; hop < max; hop++) {
      const res = await get(path, { redirect: "manual", headers: { "cache-control": "no-cache" } });
      if (res.status !== 301 && res.status !== 302 && res.status !== 307 && res.status !== 308) {
        return { hops: chain.length, finalStatus: res.status, finalPath: path, chain: [...chain, `${path}`] };
      }
      const loc = res.headers.get("location") ?? "";
      const next = loc.replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0] || "/";
      chain.push(`${path} [${res.status}]`);
      path = next;
    }
    add(`legacy ${from}`, false, `${from}: più di ${max} salti — catena o ciclo`);
    return null;
  } catch (err) {
    add(`legacy ${from}`, false, `${from} → errore: ${err instanceof Error ? err.message : "?"}`);
    return null;
  }
}

/**
 * Il vecchio sottodominio degli annunci deve uscire in UN salto verso il dominio nuovo.
 * Si interroga il base URL passando l'Host desiderato: è l'unico modo di provare una
 * regola host-scoped senza dipendere dalla propagazione DNS.
 */
async function checkSubdomain(host: string) {
  for (const path of ["/", "/un-annuncio-qualsiasi"]) {
    try {
      const res = await fetch(`${base}${path}`, {
        redirect: "manual",
        headers: { host, "cache-control": "no-cache" },
        signal: AbortSignal.timeout(TIMEOUT),
      });
      const loc = res.headers.get("location") ?? "";
      const permanente = res.status === 308 || res.status === 301;
      // La destinazione DEVE essere assoluta e su un host diverso: con una relativa il
      // browser resterebbe sul sottodominio, l'host tornerebbe a combaciare e la regola
      // si riapplicherebbe — ciclo infinito.
      const esce = /^https?:\/\//.test(loc) && new URL(loc).hostname !== host;
      add(
        `sottodominio ${host}${path}`,
        permanente && esce,
        `${res.status} → ${loc || "(nessuna Location)"} (atteso 308 assoluto fuori da ${host})`
      );
    } catch (err) {
      add(`sottodominio ${host}${path}`, false, `errore: ${err instanceof Error ? err.message : "?"}`);
    }
  }
}

async function main() {
  console.log(`Smoke test → ${base}${forcedHost ? ` (+ Host: ${forcedHost})` : ""}\n`);

  await checkPage("homepage", "/");
  await checkPage("catalogo", "/acquista");
  await checkPage("servizi", "/servizi");
  await checkPage("contatti", "/contatti");

  // Una scheda immobile reale: si prende il primo /case/… dal sitemap.
  try {
    const sm = await (await get("/sitemap.xml")).text();
    const first = sm.match(/\/case\/[a-z0-9-]+/i)?.[0];
    if (first) await checkPage("una scheda immobile", first);
    else add("una scheda immobile", false, "nessun /case/… nel sitemap", false);
  } catch {
    add("una scheda immobile", false, "sitemap non raggiungibile", false);
  }

  // Endpoint del form — VIVO ma senza lead: payload che il server rifiuta (400).
  try {
    const res = await get("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent: "seller" }), // manca nome/recapito → 400, nessun lead
    });
    add(
      "endpoint form (nessun lead)",
      res.status === 400,
      `POST /api/lead (payload incompleto) → ${res.status} (atteso 400: vivo, nessun lead creato)`
    );
  } catch (err) {
    add("endpoint form (nessun lead)", false, `POST /api/lead → errore: ${err instanceof Error ? err.message : "?"}`);
  }

  // robots.txt — vivo. In ANTEPRIMA il blocco totale è corretto e si segnala e basta;
  // in PRODUZIONE è la voce 02 della checklist, e un `Disallow: /` lì fa sparire il sito
  // da Google in 3-7 giorni. Su un dominio pubblico questa verifica è quindi OBBLIGATORIA:
  // è il senso di «verificare il giorno del lancio e di nuovo 48 ore dopo» — un controllo
  // che si può eseguire ma che non fa uscire 1 non protegge nessuno.
  const robots = await checkPage("robots.txt", "/robots.txt");
  if (robots?.ok) {
    const body = await robots.text();
    const indexable = /Allow:\s*\//i.test(body) && /Sitemap:/i.test(body);
    const bloccoTotale = /^\s*Disallow:\s*\/\s*$/im.test(body);
    if (isProduction) {
      add(
        "robots: il sito è indicizzabile",
        indexable && !bloccoTotale,
        bloccoTotale
          ? "BLOCCO TOTALE (Disallow: /) su un dominio pubblico — il sito sparisce da Google in 3-7 giorni"
          : indexable
            ? "indicizzabile (Allow + Sitemap)"
            : "né Allow né Sitemap dichiarati: verificare app/robots.ts"
      );
    } else {
      add(
        "robots: stato indicizzazione",
        true,
        indexable ? "indicizzabile (Allow + Sitemap)" : "chiuso ai crawler (Disallow /)",
        false
      );
    }
  }

  // sitemap.xml — vivo, sull'host giusto, senza URL di anteprima.
  const sitemap = await checkPage("sitemap.xml", "/sitemap.xml");
  if (sitemap?.ok) {
    const body = await sitemap.text();
    add("sitemap: nessun URL di anteprima", !/vercel\.app|localhost|127\.0\.0\.1/.test(body), "");
  }

  // ── L'inventario legacy AL COMPLETO, nella forma con lo slash ──────────────
  //
  // Non i rappresentanti: tutti. Ed è qui — non nel test unitario — che vanno chiesti
  // nella forma ORIGINALE, con lo slash finale, perché è l'unica in cui esistono nei
  // link là fuori ed è l'unica che mostra la normalizzazione di Next (`/vendi-casa/` →
  // `/vendi-casa` → `/vendi`: due risposte, non una). Il conteggio dei salti serve
  // proprio a rendere visibile quel doppio salto invece di lasciarlo nei commenti.
  const salti: string[] = [];
  for (const { from, to } of LEGACY_ALL) {
    const esito = await followChain(from);
    if (!esito) continue;
    add(
      `legacy ${from}`,
      esito.finalStatus === 200 && esito.finalPath === to,
      `${from} → ${esito.chain.join(" → ")} [${esito.finalStatus}] (atteso 200 su ${to})`
    );
    if (esito.hops > 1) salti.push(`${from}: ${esito.hops} salti`);
  }
  // Più di due salti è una catena vera e va corretta; due sono la normalizzazione dello
  // slash, attesa e documentata. Si segnala senza far fallire, così il numero resta sotto
  // gli occhi di chi rilegge il rapporto del go-live.
  add(
    "legacy: catene di redirect",
    true,
    salti.length ? `${salti.length} URL con più di un salto (atteso: tutti, per lo slash finale)` : "un solo salto ovunque",
    false
  );

  // ── Il sottodominio del vecchio gestionale, solo su richiesta ──────────────
  if (forcedHost) {
    await checkSubdomain(forcedHost);
  }

  // ── Report ──
  console.log("");
  for (const c of checks) {
    const mark = c.pass ? "✓" : c.required ? "✗" : "•";
    console.log(`  ${mark} ${c.name} — ${c.detail}`);
  }
  const failed = checks.filter((c) => c.required && !c.pass);
  console.log("");
  if (failed.length > 0) {
    console.log(`${failed.length} verifiche OBBLIGATORIE fallite.`);
    process.exit(1);
  }
  console.log("Tutte le verifiche obbligatorie superate.");
}

void main();
