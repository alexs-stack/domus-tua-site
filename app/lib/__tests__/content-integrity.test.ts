// Content integrity — rete di sicurezza contro il rientro di contenuti NON verificati.
//
// Le PR precedenti avevano introdotto (e in parte lasciato in pagina) numeri, firme e
// abbinamenti video che non hanno una fonte: sembravano dati dell'agenzia ma erano
// segnaposto di design. Questo test fallisce se tornano, per merge, revert o copia-incolla
// da un vecchio branch.
//
// Regola: qualunque cifra mostrata come dato di Domus Tua deve avere una fonte annotata in
// app/lib/site.ts (Google/Trustindex, Registro Imprese, sito ufficiale). Se il cliente
// fornisce le metriche reali, si aggiornano site.ts E l'allowlist qui sotto — mai solo la UI.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { site } from "../site";
import { allVideoIds, videoCollection, featuredVideo, testimonialVideo } from "../videos";
import { isAvailable, isSold, onlyAvailable } from "../availability";
import { CONSENT_COOKIE } from "../consent";

const APP_DIR = path.join(process.cwd(), "app");

/** Sorgenti di PRODUZIONE: esclude test e fixture (dove i valori di prova sono legittimi). */
function productionSources(): string[] {
  const out: string[] = [];
  (function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "__tests__" || entry.name === "__fixtures__") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) out.push(full);
    }
  })(APP_DIR);
  return out;
}

/**
 * Toglie i commenti: quelli che spiegano PERCHÉ un contenuto è vietato citano per forza il
 * contenuto stesso, e non devono far fallire il test. Il `//` preceduto da ":" (https://…)
 * resta intatto.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
}

/**
 * Ripulisce il sorgente dai falsi positivi legittimi PRIMA di cercare i pattern vietati:
 *  - i commenti (vedi sopra);
 *  - le soglie ScrollTrigger (`start: "top 92%"`) sono coordinate di animazione, non claim;
 *  - le classi Tailwind con valori arbitrari (`h-[440px]`, `text-[0.92rem]`) sono layout.
 */
function stripTechnicalValues(src: string): string {
  return stripComments(src)
    .replace(/\b(?:start|end|endTrigger):\s*"[^"]*"/g, "")
    .replace(/\[[^\]\s]*\]/g, "");
}

const REL = (f: string) => path.relative(process.cwd(), f);

/**
 * Contenuti VIETATI. Ognuno è stato mostrato come dato reale senza avere una fonte.
 * `why` finisce nel messaggio di errore: chi rompe il test capisce perché senza archeologia.
 */
const FORBIDDEN: { label: string; pattern: RegExp; why: string }[] = [
  {
    label: "269.395 m² valutati",
    pattern: /\b269[.\s]?395\b/,
    why: "metratura valutata mai documentata dall'agenzia",
  },
  {
    label: "6.433 persone",
    pattern: /\b6[.\s]?433\b/,
    why: "conteggio persone mai documentato",
  },
  {
    label: "1.523 transazioni",
    pattern: /\b1[.\s]?523\b/,
    why: "conteggio transazioni mai documentato",
  },
  {
    label: "92% venduto",
    pattern: /\b92\s?%/,
    why: "percentuale di venduto mai documentata (claim comparativo a rischio art. 2598 c.c.)",
  },
  {
    label: "440+ video",
    pattern: /\b440\s?\+/,
    why: "conteggio video stimato, mai verificato sul canale YouTube",
  },
];

describe("content integrity — numeri e claim senza fonte", () => {
  const files = productionSources();

  test("le sorgenti di produzione esistono (il test non passa a vuoto)", () => {
    assert.ok(files.length > 50, `trovati solo ${files.length} file in app/`);
  });

  for (const { label, pattern, why } of FORBIDDEN) {
    test(`"${label}" non compare nei file di produzione`, () => {
      const hits = files.filter((f) =>
        pattern.test(stripTechnicalValues(fs.readFileSync(f, "utf8"))),
      );
      assert.deepEqual(
        hits.map(REL),
        [],
        `"${label}" è tornato in pagina — ${why}. ` +
          `Se il cliente ha fornito il dato reale, mettilo in app/lib/site.ts con la fonte ` +
          `annotata e aggiorna questo test.`,
      );
    });
  }

  test("site.ts non riespone un conteggio video non verificato", () => {
    assert.ok(
      !("videosCountLabel" in site),
      "videosCountLabel era una stima ('440+') mostrata come dato: reintrodurlo solo col numero reale del canale",
    );
  });
});

describe("content integrity — firma della fondatrice", () => {
  test("nessun componente Signature con tracciato calligrafico inventato", () => {
    assert.equal(
      fs.existsSync(path.join(APP_DIR, "components", "Signature.tsx")),
      false,
      "il vecchio Signature.tsx disegnava una firma generica spacciata per quella di Raffaela Rizza",
    );
    const importers = productionSources().filter((f) =>
      /from\s+"[^"]*\/Signature"/.test(fs.readFileSync(f, "utf8")),
    );
    assert.deepEqual(importers.map(REL), []);
  });
});

describe("content integrity — team attuale", () => {
  // Eleonora D'Agati e Tiziana Galeone non fanno più parte di Domus Tua. Il test copre tutte
  // le grafie in cui i nomi potrebbero rientrare (apostrofo tipografico o dritto, con o senza
  // spazio) e vale su tutti i file di produzione: componenti, dizionari, metadata, alt text.
  const FORMER_MEMBERS: { label: string; pattern: RegExp }[] = [
    { label: "Eleonora D'Agati", pattern: /eleonora|d[’'` ]?agati/i },
    { label: "Tiziana Galeone", pattern: /tiziana|galeone/i },
  ];

  for (const { label, pattern } of FORMER_MEMBERS) {
    test(`"${label}" non compare nei file di produzione`, () => {
      const hits = productionSources().filter((f) => pattern.test(fs.readFileSync(f, "utf8")));
      assert.deepEqual(
        hits.map(REL),
        [],
        `${label} non è più in organico: non deve comparire in roster, dizionari, metadata, ` +
          `dati strutturati o alt text. Nessun sostituto va inventato al suo posto.`,
      );
    });
  }

  test("il roster resta quello confermato, senza nomi aggiunti", () => {
    const src = fs.readFileSync(path.join(APP_DIR, "components", "Team.tsx"), "utf8");
    const names = [...src.matchAll(/\{ name: "([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(names, [
      "Raffaela Rizza",
      "Paloma Cavalcante",
      "Viola Benatti",
      "Katya Fedrigo",
    ]);
  });

  test("le foto di gruppo non sono descritte come il team attuale", () => {
    // Le foto ritraggono la composizione precedente e restano in pagina finché il cliente non
    // fornisce quelle nuove (docs/client-assets-needed.md §1.3-bis): alt e didascalie devono
    // descrivere l'immagine, non dichiarare chi lavora oggi in agenzia.
    const files = [
      path.join(APP_DIR, "components", "Team.tsx"),
      path.join(APP_DIR, "chi-siamo", "ChiSiamoContent.tsx"),
    ];
    for (const file of files) {
      const src = fs.readFileSync(file, "utf8");
      const claims = [...src.matchAll(/^ *(?:imageAlt|captionName|squadra\w*Alt): "([^"]+)"/gm)]
        .map((m) => m[1])
        .filter((v) => /\b(il team|the .*team|l.équipe|das .*team|el equipo|e il team|and the team)\b/i.test(v));
      assert.deepEqual(
        claims,
        [],
        `${path.basename(file)}: alt/didascalia dichiarano "il team" su una foto di gruppo non aggiornata`,
      );
    }
  });
});

describe("content integrity — video YouTube", () => {
  test("nessun video ripetuto tra evidenza e collezione", () => {
    const ids = allVideoIds();
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(
      duplicates,
      [],
      "lo stesso video mostrato più volte (prima con titoli diversi) fa sembrare il canale più ricco di quanto sia",
    );
  });

  test("evidenza e testimonianza non sono ripetute nella griglia", () => {
    assert.equal(videoCollection.some((v) => v.id === featuredVideo.id), false);
    assert.equal(videoCollection.some((v) => v.id === testimonialVideo.id), false);
  });

  test("ogni card porta il titolo reale del video sul canale", () => {
    const byId = new Map<string, string>(site.videos.reviews.map((r) => [r.id, r.title]));
    for (const v of videoCollection) {
      assert.ok(v.title.length > 0, `slot ${v.id} senza titolo`);
      assert.equal(
        v.title,
        byId.get(v.id),
        `il titolo dello slot ${v.id} non è quello reale in site.videos: niente didascalie inventate`,
      );
    }
  });

  test("gli id provengono da site.videos (fonte unica)", () => {
    const known = new Set<string>([
      site.videos.featured.id,
      site.videos.testimonial.id,
      site.videos.openDomus.id,
      site.videos.team.id,
      ...site.videos.reviews.map((r) => r.id),
    ]);
    for (const id of allVideoIds()) {
      assert.ok(known.has(id), `id ${id} non presente in site.videos`);
    }
  });
});

describe("content integrity — venduti mai tra i disponibili", () => {
  const listings = [
    { slug: "disponibile", sold: false },
    { slug: "venduto", sold: true },
    { slug: "senza-flag" },
  ];

  test("isAvailable/isSold sono complementari", () => {
    for (const p of listings) {
      assert.notEqual(isAvailable(p), isSold(p));
    }
  });

  test("un immobile senza flag è considerato disponibile", () => {
    assert.equal(isAvailable({ slug: "senza-flag" } as { sold?: boolean }), true);
  });

  test("onlyAvailable rimuove i venduti", () => {
    assert.deepEqual(
      onlyAvailable(listings).map((p) => p.slug),
      ["disponibile", "senza-flag"],
    );
  });

  test("le vetrine passano dalla lista filtrata, non da getVisibleListings", () => {
    // Regressione: la sezione "le nostre case" della home prendeva i primi tre immobili del
    // feed così com'erano — un venduto in cima alla lista RealSmart finiva tra le proposte.
    const src = fs.readFileSync(path.join(APP_DIR, "components", "Listings.tsx"), "utf8");
    assert.match(src, /getAvailableListings\(\)/);
    assert.doesNotMatch(src, /getVisibleListings\(\)/);
  });
});

describe("content integrity — terze parti dietro al consenso", () => {
  const reviewsSrc = fs.readFileSync(path.join(APP_DIR, "components", "Reviews.tsx"), "utf8");

  test("il widget Trustindex si monta solo con consenso accettato", () => {
    // Regressione: l'iframe con il loader Trustindex partiva al primo render, cioè prima di
    // qualsiasi scelta dell'utente sui cookie.
    assert.match(reviewsSrc, /useConsent\(\)/);
    assert.match(reviewsSrc, /consent === "accepted"/);
    const iframeIndex = reviewsSrc.indexOf("trustindexLoader}\"></script>");
    assert.ok(iframeIndex > 0, "loader Trustindex non trovato: aggiornare questo test");
    assert.ok(
      reviewsSrc.indexOf("showTrustindex ?") < iframeIndex,
      "il loader Trustindex deve stare dentro il ramo protetto dal gate",
    );
  });

  test("una sola implementazione del consenso", () => {
    const others = productionSources().filter((f) => {
      if (f.endsWith(path.join("lib", "consent.ts"))) return false;
      return new RegExp(`["'\`]${CONSENT_COOKIE}\\b`).test(fs.readFileSync(f, "utf8"));
    });
    assert.deepEqual(
      others.map(REL),
      [],
      `il nome del cookie di consenso deve vivere solo in app/lib/consent.ts`,
    );
  });
});

describe("content integrity — fonti uniche", () => {
  test("NEXT_PUBLIC_SITE_URL letto in un posto solo (più /api/health, che è diagnostica)", () => {
    const readers = productionSources().filter((f) =>
      /NEXT_PUBLIC_SITE_URL/.test(stripComments(fs.readFileSync(f, "utf8"))),
    );
    assert.deepEqual(readers.map(REL).sort(), ["app/api/health/route.ts", "app/lib/site.ts"]);
  });

  test("NEXT_PUBLIC_USE_REALSMART letto in un posto solo", () => {
    const readers = productionSources().filter((f) =>
      /NEXT_PUBLIC_USE_REALSMART/.test(stripComments(fs.readFileSync(f, "utf8"))),
    );
    assert.deepEqual(readers.map(REL), ["app/lib/realsmart/env.ts"]);
  });

  test("il numero di telefono vive solo in site.ts", () => {
    const digits = site.phone.href.replace("tel:", "");
    const others = productionSources().filter((f) => {
      if (f.endsWith(path.join("lib", "site.ts"))) return false;
      return fs.readFileSync(f, "utf8").includes(digits);
    });
    assert.deepEqual(others.map(REL), []);
  });
});
