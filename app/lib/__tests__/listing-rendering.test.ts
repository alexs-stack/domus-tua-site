// Rotte che leggono il catalogo LIVE: devono dichiarare la resa DINAMICA, e il client non deve
// mai scambiare un segnale interno di Next per un guasto del gestionale.
//
// IL DIFETTO CHE QUESTI TEST CHIUDONO (produzione, 23 agosto 2026: 500 su /case/gallarate-92 e
// /case/malnate-91, `DYNAMIC_SERVER_USAGE`).
//
// Il feed si scarica con `cache: "no-store"`. Next lo osserva e, in prerender, INTERROMPE la
// generazione statica LANCIANDO una DynamicServerError — è un segnale di controllo, non un errore.
// Due cose lo trasformavano in un guasto:
//
//   1. `loadListings` aveva un `catch (err)` universale che lo INGOIAVA e lo registrava come
//      «feed non disponibile», restituendo uno snapshot fail-closed VUOTO che il memo teneva per
//      NEGATIVE_REVALIDATE_SECONDS. Verificato su questo repo prima della correzione:
//        [realsmart] feed non disponibile: Dynamic server usage: Route /acquista … revalidate: 0
//
//   2. `/case/[slug]` dichiarava `generateStaticParams()` — cioè prometteva ~186 schede statiche
//      su un dato che statico non è.
//
// C'è un terzo effetto, più subdolo, che questi test coprono per TUTTE le rotte del catalogo:
// lo snapshot in-process fa sì che solo la PRIMA pagina a leggere il catalogo esegua davvero la
// fetch. Le successive leggono il memo, Next non vede alcun accesso dinamico e le prerenderizza.
// Misurato qui prima della correzione: `ƒ /acquista` ma `○ /case-vendute` — stessa sorgente,
// classificazione diversa, decisa dall'ordine dei worker. /case-vendute pubblica un conteggio
// («N vendute su M pubblicate»): congelarlo in build significa affermare due numeri non più veri.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

/**
 * Il sorgente SENZA commenti. Serve perché questi test cercano righe di CODICE: senza questo
 * passaggio, una spiegazione che cita `generateStaticParams()` o incolla una riga di log farebbe
 * fallire (o peggio: passare) il controllo per il testo di un commento. Piccola macchina a stati
 * invece di una regex, così un `//` dentro un URL in stringa non viene scambiato per un commento.
 */
function codeOnly(src: string): string {
  let out = "";
  let i = 0;
  let quote: string | null = null;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (quote) {
      if (c === "\\") { out += src.slice(i, i + 2); i += 2; continue; }
      if (c === quote) quote = null;
      out += c; i++; continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; out += c; i++; continue; }
    if (c === "/" && next === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && next === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2; continue;
    }
    out += c; i++;
  }
  return out;
}

/**
 * Ogni rotta che legge la facciata del catalogo (app/lib/listings.ts). Se ne nasce una nuova,
 * il test "l'elenco è completo" qui sotto la fa emergere invece di lasciarla scoprire in
 * produzione.
 */
const FEED_ROUTES = [
  "app/case/[slug]/page.tsx",
  "app/acquista/page.tsx",
  "app/case-vendute/page.tsx",
  "app/sitemap.ts",
  "app/api/search/route.ts",
  "app/api/health/route.ts",
];

describe("rotte che leggono il catalogo live", () => {
  for (const route of FEED_ROUTES) {
    test(`${route}: dichiara la resa dinamica`, () => {
      assert.match(
        codeOnly(read(route)),
        /^export const dynamic = "force-dynamic";$/m,
        `${route} legge il feed live ma non dichiara \`export const dynamic = "force-dynamic"\`: ` +
          "Next può prerenderizzarla, e il catalogo resterebbe congelato al momento della build.",
      );
    });
  }

  test("nessuna rotta alimentata dal feed promette pagine statiche", () => {
    // `generateStaticParams()` e una sorgente `no-store` sono inconciliabili: è la coppia che
    // produceva i 500. Tornerà solo con uno snapshot durevole degli annunci.
    for (const route of FEED_ROUTES) {
      assert.doesNotMatch(
        codeOnly(read(route)),
        /generateStaticParams/,
        `${route}: generateStaticParams() su una rotta alimentata dal feed live (fetch no-store) ` +
          "riporta il difetto DYNAMIC_SERVER_USAGE.",
      );
    }
  });

  test("l'elenco delle rotte del catalogo è completo", () => {
    // Difende l'elenco qui sopra: una rotta nuova che importa la facciata e non compare in
    // FEED_ROUTES non verrebbe controllata da nessuno dei test precedenti.
    const out = execFileSync(
      "grep",
      ["-rl", "--include=*.ts", "--include=*.tsx", "-E", 'from "[^"]*lib/listings"', "app"],
      { encoding: "utf8" },
    );
    const importers = out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      // I test e i componenti non sono rotte: contano solo i file-convenzione di Next.
      .filter((f) => /(?:^|\/)(?:page|route|sitemap)\.tsx?$/.test(f));

    const missing = importers.filter((f) => !FEED_ROUTES.includes(f));
    assert.deepEqual(
      missing,
      [],
      `rotte che leggono il catalogo ma non elencate in FEED_ROUTES: ${missing.join(", ")}. ` +
        "Aggiungile all'elenco (e dichiara la resa dinamica) invece di rimuovere questo test.",
    );
  });
});

describe("segnali interni di Next nel client RealSmart", () => {
  test("loadListings rilancia i segnali di Next prima di gestire l'errore", () => {
    const src = codeOnly(read("app/lib/realsmart/client.ts"));
    assert.match(
      src,
      /import \{ unstable_rethrow \} from "next\/navigation";/,
      "client.ts non importa unstable_rethrow: il catch tornerebbe a scambiare una " +
        "DynamicServerError per un guasto del gestionale.",
    );

    // La riga deve stare in TESTA al catch: dopo un `console.error` avrebbe già inquinato i log
    // con un falso «feed non disponibile», e dopo il `return` non servirebbe a nulla.
    const catchAt = src.indexOf("} catch (err) {");
    assert.ok(catchAt > 0, "catch di loadListings non trovato");
    const rethrowAt = src.indexOf("unstable_rethrow(err);", catchAt);
    const logAt = src.indexOf("[realsmart] feed non disponibile:", catchAt);
    assert.ok(rethrowAt > catchAt, "unstable_rethrow(err) non è dentro il catch di loadListings");
    assert.ok(
      rethrowAt < logAt,
      "unstable_rethrow(err) va PRIMA del console.error: altrimenti un segnale di controllo di " +
        "Next viene comunque registrato come guasto del feed.",
    );
  });
});
