// Smoke test del sito, dall'esterno — le pagine e i comportamenti che DEVONO
// funzionare appena il dominio è agganciato, verificati con richieste HTTP reali.
//
//   npm run smoke                                   # default: http://127.0.0.1:3000 (locale, sicuro)
//   npm run smoke -- https://www.domustua.com       # il futuro dominio di produzione
//   SMOKE_URL=https://domus-tua.vercel.app npm run smoke
//
// SICURO DI DEFAULT: senza argomenti punta a localhost, non a un dominio reale.
// NON invia mai un lead vero, né email, né eventi analytics: il form endpoint si
// interroga con un payload che il server RIFIUTA (400) — vivo, ma nessun lead.
// Esce con codice 1 se una verifica OBBLIGATORIA fallisce.

// `export {}` rende questo file un MODULO: le sue dichiarazioni top-level restano
// nel suo scope e non collidono con quelle globali di scripts/verify-deploy.ts
// (entrambi definiscono `Check`/`main`). Non cambia l'esecuzione via tsx.
export {};

const base = (process.argv[2] || process.env.SMOKE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

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

async function checkRedirect(from: string, expectedTo: string) {
  try {
    const res = await get(from, { redirect: "manual" });
    const loc = res.headers.get("location") ?? "";
    const locPath = loc.replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0];
    // 308 (permanente per Next) o 301 sono entrambi validi.
    const permanent = res.status === 308 || res.status === 301;
    add(
      `redirect ${from}`,
      permanent && locPath === expectedTo,
      `${from} → ${res.status} ${locPath || "(nessuna Location)"} (atteso 308/301 → ${expectedTo})`
    );
  } catch (err) {
    add(`redirect ${from}`, false, `${from} → errore: ${err instanceof Error ? err.message : "?"}`);
  }
}

async function main() {
  console.log(`Smoke test → ${base}\n`);

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

  // robots.txt — vivo; segnaliamo se indicizzabile o chiuso (non fa fallire).
  const robots = await checkPage("robots.txt", "/robots.txt");
  if (robots?.ok) {
    const body = await robots.text();
    const indexable = /Allow:\s*\//i.test(body) && /Sitemap:/i.test(body);
    add(
      "robots: stato indicizzazione",
      true,
      indexable ? "indicizzabile (Allow + Sitemap)" : "chiuso ai crawler (Disallow /)",
      false
    );
  }

  // sitemap.xml — vivo, sull'host giusto, senza URL di anteprima.
  const sitemap = await checkPage("sitemap.xml", "/sitemap.xml");
  if (sitemap?.ok) {
    const body = await sitemap.text();
    add("sitemap: nessun URL di anteprima", !/vercel\.app|localhost|127\.0\.0\.1/.test(body), "");
  }

  // Redirect legacy rappresentativi.
  await checkRedirect("/vendi-casa", "/vendi");
  await checkRedirect("/case", "/acquista");
  await checkRedirect("/wp-sitemap.xml", "/sitemap.xml");

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
