// Validazione pre-go-live, a livello di repository (nessun accesso a produzione):
//  • redirect legacy WordPress — source/destination/308/no-loop/no-catena/query;
//  • sitemap — host, rotte, immobili, niente URL noindex/anteprima/duplicati;
//  • robots — allow+sitemap in produzione, disallow totale in anteprima;
//  • dati strutturati organizzazione — campi critici, niente aggregateRating.
//
// Lo smoke test contro il dominio reale è un'altra cosa: scripts/smoke.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import nextConfig from "../../../next.config";
import { buildSitemap, SITEMAP_ROUTES, NON_INDEXABLE_ROUTES } from "../../sitemap";
import { robotsRules, RETRIEVAL_BOTS } from "../../robots";
import { organizationJsonLd, siteUrl } from "../site";
import { LEGACY_ALL, LEGACY_REDIRECTS, LEGACY_SAME_PATH, normalizedPath } from "../legacyUrls";

type Has = { type: string; key?: string; value?: string };
type Redirect = { source: string; destination: string; permanent?: boolean; has?: Has[] };

async function getRedirects(): Promise<Redirect[]> {
  const r = nextConfig.redirects ? await nextConfig.redirects() : [];
  return r as Redirect[];
}

/**
 * Una regola vincolata a un host DIVERSO dal nostro (il sottodominio annunci) è l'unica
 * a cui è concessa — anzi, imposta — una destinazione assoluta: vedi il test dedicato.
 */
const isCrossHost = (r: Redirect) => r.has?.some((h) => h.type === "host") ?? false;

describe("redirect legacy — go-live", () => {
  test("sono configurati (l'inventario WordPress non è vuoto)", async () => {
    const redirects = await getRedirects();
    assert.ok(redirects.length >= 10, `troppi pochi redirect: ${redirects.length}`);
  });

  test("ogni redirect ha source/destination assoluti e permanent:true (308 accettato)", async () => {
    for (const r of await getRedirects()) {
      assert.ok(r.source.startsWith("/"), `source non assoluto: ${r.source}`);
      // Le regole intra-sito restano relative; quelle legate a un host esterno DEVONO
      // essere assolute, altrimenti il salto non lascia il sottodominio (vedi sotto).
      if (isCrossHost(r)) {
        assert.ok(
          r.destination.startsWith(`${siteUrl}/`),
          `${r.source}: regola host-scoped con destinazione non assoluta sul dominio canonico: ${r.destination}`
        );
      } else {
        assert.ok(r.destination.startsWith("/"), `destination non assoluta: ${r.destination}`);
      }
      assert.equal(r.permanent, true, `${r.source}: atteso permanent (Next emette 308)`);
    }
  });

  test("nessun loop: una source non redirige a sé stessa", async () => {
    for (const r of await getRedirects()) {
      assert.notEqual(r.source, r.destination, `loop diretto: ${r.source}`);
    }
  });

  test("nessuna CATENA evitabile: la destinazione non è a sua volta una source", async () => {
    const redirects = await getRedirects();
    const sources = new Set(redirects.map((r) => r.source));
    for (const r of redirects) {
      const destPath = r.destination.split(/[?#]/)[0];
      assert.ok(
        !sources.has(destPath),
        `catena: ${r.source} → ${r.destination} (la destinazione è anche una source)`
      );
    }
  });

  test("nessuna destination annulla i query param (nessun '?' hardcoded)", async () => {
    for (const r of await getRedirects()) {
      assert.ok(
        !r.destination.includes("?"),
        `${r.source} → ${r.destination}: query hardcoded impedirebbe il passaggio dei parametri`
      );
    }
  });

  test("i redirect WordPress rappresentativi puntano alla destinazione giusta", async () => {
    const map = new Map((await getRedirects()).map((r) => [r.source, r.destination]));
    for (const [source, dest] of [
      ["/case", "/acquista"],
      ["/cerchi-casa", "/acquista"],
      ["/vendi-casa", "/vendi"],
      ["/servizi-domus", "/servizi"],
      ["/servizi-domus/open-domus", "/open-domus"],
      ["/team", "/chi-siamo"],
      ["/privacy-policy", "/privacy"],
      ["/cookies-policy", "/cookie"],
      ["/wp-sitemap.xml", "/sitemap.xml"],
      // Catalogo immobili del vecchio dominio: esatto e figlie.
      ["/proprieta", "/acquista"],
      ["/proprieta/:path*", "/acquista"],
    ] as const) {
      assert.equal(map.get(source), dest, `redirect mancante/errato: ${source} → ${dest}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// L'INVENTARIO COMPLETO, non i rappresentanti.
//
// Il test qui sopra controlla undici voci scelte a mano: passa anche se una delle
// altre quattordici è scoperta, ed è esattamente il modo in cui una migrazione
// "verificata" manda in 404 un URL che nessuno aveva in elenco. Qui si parte
// dall'inventario (app/lib/legacyUrls.ts) e si risolve OGNI voce contro le regole
// vere, jolly compresi — che è poi il senso della voce 01 della checklist,
// «mappa redirect completa, testata».
// ─────────────────────────────────────────────────────────────────────────────
describe("redirect legacy — inventario completo", () => {
  /**
   * Applica una `source` di Next a un percorso. Copre le tre forme usate qui:
   * letterale, `:param` (un segmento) e `:param*` (zero o più segmenti).
   * Non è un clone di path-to-regexp: se un domani servisse una forma diversa
   * (opzionali, regex inline), questo test deve FALLIRE invece di far finta.
   */
  const sourceMatches = (source: string, path: string): boolean => {
    assert.ok(
      !/[?()+]/.test(source),
      `source con sintaxi non supportata da questo matcher: ${source} — estendere sourceMatches`
    );
    const rx = new RegExp(
      "^" +
        source
          .split("/")
          .map((seg) => {
            if (seg.startsWith(":") && seg.endsWith("*")) return "(?:/.*)?";
            if (seg.startsWith(":")) return "/[^/]+";
            return seg ? "/" + seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
          })
          .join("") +
        "$"
    );
    return rx.test(path);
  };

  /** La PRIMA regola che combacia vince, come in Next. Le host-scoped non valgono qui. */
  const resolve = (redirects: Redirect[], path: string) =>
    redirects.filter((r) => !isCrossHost(r)).find((r) => sourceMatches(r.source, path));

  test("ogni URL dell'inventario trova una regola e atterra dove deve", async () => {
    const redirects = await getRedirects();
    const scoperti: string[] = [];
    const sbagliati: string[] = [];

    for (const { from, to, note } of LEGACY_REDIRECTS) {
      const path = normalizedPath(from);
      const rule = resolve(redirects, path);
      if (!rule) {
        scoperti.push(`${from} (atteso → ${to}${note ? ` — ${note}` : ""})`);
        continue;
      }
      if (rule.destination !== to) {
        sbagliati.push(`${from} → ${rule.destination} (atteso ${to}, via "${rule.source}")`);
      }
    }

    assert.deepEqual(
      scoperti,
      [],
      "URL del vecchio sito senza alcuna regola: al cutover rispondono 404 e l'autorità si perde"
    );
    assert.deepEqual(sbagliati, [], "URL del vecchio sito che atterrano sulla destinazione sbagliata");
  });

  test("nessuna voce dell'inventario atterra su un'altra source (catena)", async () => {
    const redirects = await getRedirects();
    const catene: string[] = [];
    for (const { from } of LEGACY_REDIRECTS) {
      const rule = resolve(redirects, normalizedPath(from));
      if (!rule) continue;
      // La destinazione non deve essere a sua volta redirettata: sarebbe un secondo
      // salto OLTRE quello della normalizzazione dello slash, e Google smette di
      // seguire le catene lunghe.
      const next = resolve(redirects, rule.destination);
      if (next) catene.push(`${from} → ${rule.destination} → ${next.destination}`);
    }
    assert.deepEqual(catene, [], "catena di redirect: la destinazione è a sua volta una source");
  });

  test("le rotte che NON cambiano indirizzo non vengono redirette", async () => {
    const redirects = await getRedirects();
    const redirettePerErrore: string[] = [];
    for (const { from } of LEGACY_SAME_PATH) {
      const rule = resolve(redirects, normalizedPath(from));
      if (rule) redirettePerErrore.push(`${from} → ${rule.destination} (via "${rule.source}")`);
    }
    assert.deepEqual(
      redirettePerErrore,
      [],
      "una rotta che esiste con lo stesso percorso non va redirette: sarebbe un salto inutile su una pagina viva"
    );
  });

  test("ogni destinazione dell'inventario è una rotta reale del sito", async () => {
    // Un redirect verso un percorso inesistente è un 404 con un passaggio in più:
    // peggio del 404 diretto, perché sembra gestito.
    // SITEMAP_ROUTES scrive la home come stringa vuota (si concatena a siteUrl);
    // l'inventario la scrive "/", che è la forma in cui esiste un URL. Si normalizza
    // qui invece di piegare una delle due convenzioni all'altra.
    const rotte = new Set<string>(
      [...SITEMAP_ROUTES, ...NON_INDEXABLE_ROUTES, "/sitemap.xml"].map((r) => r || "/")
    );
    const fantasma = LEGACY_ALL.map((l) => l.to).filter((to) => !rotte.has(to));
    assert.deepEqual(
      [...new Set(fantasma)],
      [],
      "destinazione che non corrisponde a nessuna rotta nota (sitemap.ts): il redirect porta in 404"
    );
  });

  test("l'inventario copre i 25 URL del sitemap WordPress", async () => {
    // Il numero è un promemoria, non un dogma: se cresce perché Search Console ha
    // rivelato URL che il sitemap del nucleo non esponeva, si alza la soglia. Se
    // CALA, qualcuno ha cancellato una riga e va capito perché.
    assert.ok(
      LEGACY_ALL.length >= 22,
      `inventario sceso a ${LEGACY_ALL.length} voci: il sitemap WordPress ne esponeva 25`
    );
  });
});

// Il sottodominio del vecchio catalogo. Se resta raggiungibile insieme al sito nuovo è
// contenuto duplicato dell'INTERO catalogo immobili, cioè l'agenzia che compete con sé
// stessa sulle stesse schede.
describe("sottodominio annunci — go-live", () => {
  const annunciRule = async () =>
    (await getRedirects()).find((r) =>
      r.has?.some((h) => h.type === "host" && h.value === "annunci.domustua.com")
    );

  test("esiste una regola che cattura ogni percorso del sottodominio", async () => {
    const rule = await annunciRule();
    assert.ok(rule, "nessun redirect per annunci.domustua.com: il catalogo vecchio resterebbe vivo");
    assert.equal(rule.source, "/:path*", "la regola deve catturare TUTTO il sottodominio, radice compresa");
    assert.equal(rule.permanent, true);
  });

  test("la destinazione è assoluta sul dominio canonico — altrimenti è un ciclo infinito", async () => {
    const rule = await annunciRule();
    assert.ok(rule);
    // Con una destinazione relativa il browser resterebbe su annunci.domustua.com,
    // l'host tornerebbe a combaciare e la regola si riapplicherebbe all'infinito.
    assert.equal(rule.destination, `${siteUrl}/acquista`);
    assert.notEqual(new URL(rule.destination).host, "annunci.domustua.com");
  });

  test("è la PRIMA regola: dal sottodominio si esce in un salto solo", async () => {
    const redirects = await getRedirects();
    const i = redirects.findIndex((r) =>
      r.has?.some((h) => h.type === "host" && h.value === "annunci.domustua.com")
    );
    // Se stesse dopo, `annunci.domustua.com/vendi-casa` combacerebbe prima con la riga
    // `/vendi-casa` e atterrerebbe su `annunci.domustua.com/vendi`: host sbagliato, e un
    // secondo salto per rimediare.
    assert.equal(i, 0, "la regola host-scoped deve precedere le regole di percorso");
  });
});

describe("sitemap — go-live", () => {
  const listings = [
    { slug: "villa-con-giardino-x", cover: "/images/a.jpg" },
    { slug: "attico-y", cover: "https://cloud2.realsmart.it/x.jpg" },
  ];
  const sm = buildSitemap(siteUrl, SITEMAP_ROUTES, listings);

  test("ogni URL è sull'host di produzione", () => {
    for (const e of sm) assert.ok(e.url.startsWith(siteUrl), e.url);
  });

  test("include le rotte statiche attese, homepage compresa", () => {
    const urls = new Set(sm.map((e) => e.url));
    assert.ok(urls.has(siteUrl), "homepage assente");
    for (const r of ["/servizi", "/acquista", "/contatti", "/lavora-con-noi"]) {
      assert.ok(urls.has(`${siteUrl}${r}`), `rotta assente: ${r}`);
    }
  });

  test("rotte immobile valide, con foto in URL ASSOLUTO", () => {
    const villa = sm.find((e) => e.url.endsWith("/case/villa-con-giardino-x"));
    assert.ok(villa, "immobile con path relativo assente");
    assert.ok(villa!.images?.[0]?.startsWith(siteUrl), "foto /images non resa assoluta");
    const attico = sm.find((e) => e.url.endsWith("/case/attico-y"));
    assert.ok(attico!.images?.[0]?.startsWith("https://cloud2.realsmart.it"), "foto http alterata");
  });

  test("nessuna rotta noindex (privacy/cookie) nel sitemap", () => {
    for (const r of NON_INDEXABLE_ROUTES) {
      assert.ok(!sm.some((e) => e.url === `${siteUrl}${r}`), `${r} non deve stare nel sitemap`);
    }
  });

  test("nessun URL di anteprima o localhost", () => {
    for (const e of sm) {
      assert.doesNotMatch(e.url, /vercel\.app|localhost|127\.0\.0\.1/, e.url);
    }
  });

  test("nessun URL duplicato", () => {
    const urls = sm.map((e) => e.url);
    assert.equal(urls.length, new Set(urls).size, "URL duplicati nel sitemap");
  });
});

describe("robots — go-live", () => {
  test("produzione: allow, sitemap dichiarato, bot di retrieval ammessi", () => {
    const r = robotsRules(true);
    assert.equal(r.sitemap, `${siteUrl}/sitemap.xml`);
    const rules = r.rules as { userAgent: string; allow?: string; disallow?: string }[];
    assert.ok(rules.some((x) => x.userAgent === "*" && x.allow === "/"), "manca allow: * /");
    for (const bot of RETRIEVAL_BOTS) {
      assert.ok(rules.some((x) => x.userAgent === bot && x.allow === "/"), `bot mancante: ${bot}`);
    }
  });

  test("anteprima/staging: disallow totale, nessun sitemap esposto", () => {
    const r = robotsRules(false);
    assert.equal(r.sitemap, undefined, "un'anteprima non deve esporre il sitemap");
    const rule = r.rules as { userAgent: string; disallow?: string };
    assert.equal(rule.userAgent, "*");
    assert.equal(rule.disallow, "/");
  });
});

describe("dati strutturati organizzazione — go-live", () => {
  const ld = organizationJsonLd();

  test("tipo, @id perno e campi societari verificati", () => {
    assert.equal(ld["@type"], "RealEstateAgent");
    assert.equal(ld["@id"], `${siteUrl}/#organization`);
    assert.ok(ld.name.length > 0);
    assert.ok(ld.vatID.length > 0);
    assert.equal(ld.address["@type"], "PostalAddress");
    assert.ok(ld.address.addressLocality.length > 0);
    assert.ok(ld.address.addressRegion.length > 0);
    assert.ok(Array.isArray(ld.openingHours) && ld.openingHours.length > 0);
    assert.ok(Array.isArray(ld.sameAs) && ld.sameAs.every((u) => u.startsWith("https://")));
  });

  test("NIENTE aggregateRating finché non c'è contenuto recensioni idoneo (policy Google)", () => {
    assert.ok(!("aggregateRating" in ld), "aggregateRating non deve comparire");
  });

  test("URL assoluti sul dominio di produzione", () => {
    assert.ok(ld.url.startsWith(siteUrl), ld.url);
    assert.ok(ld.image.startsWith(siteUrl), ld.image);
  });
});
