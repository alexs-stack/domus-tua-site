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
import { team, teamInitials, teamRoleLabels } from "../team";
import { locales } from "../i18n/dictionaries";
import { ASSISTANT_NAME, buildSystemPrompt } from "../assistant/prompt";

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

// Separatore normalizzato: su Windows path.relative restituisce backslash e i confronti
// con i percorsi attesi (scritti con "/") fallirebbero per piattaforma, non per contenuto.
const REL = (f: string) => path.relative(process.cwd(), f).split(path.sep).join("/");

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

});

describe("content integrity — terze parti dietro al consenso", () => {
  test("il widget Trustindex si monta solo con consenso accettato", () => {
    // Regressione: l'iframe con il loader Trustindex partiva al primo render, cioè prima di
    // qualsiasi scelta dell'utente sui cookie. Dopo il refactor l'iframe vive in
    // TrustindexEmbed e il gate nei componenti che lo montano: si scandisce l'albero
    // (non un elenco a mano) perché è così che questo test era invecchiato — guardava
    // Reviews.tsx mentre il loader si era spostato.
    const embedPath = path.join(APP_DIR, "components", "TrustindexEmbed.tsx");
    const embedSrc = fs.readFileSync(embedPath, "utf8");
    assert.match(
      embedSrc,
      /trustindexLoader\}"><\/script>/,
      "loader Trustindex non trovato in TrustindexEmbed: aggiornare questo test",
    );

    // Il loader ha UNA casa sola: se lo script ricompare incorporato altrove, il gate
    // dei consumer non lo protegge più.
    const altreCase = productionSources().filter(
      (f) => f !== embedPath && /<script src=[^>]*trustindexLoader/.test(fs.readFileSync(f, "utf8")),
    );
    assert.deepEqual(
      altreCase.map(REL),
      [],
      "lo script del loader Trustindex deve vivere solo in TrustindexEmbed.tsx",
    );

    // Anche l'URL reale del CDN ha una casa sola (site.ts): un loader hardcodato
    // altrove scavalcherebbe sia il gate sia la sandbox senza citare la costante.
    const cdnAltrove = productionSources().filter(
      (f) =>
        !f.endsWith(path.join("lib", "site.ts")) &&
        fs.readFileSync(f, "utf8").includes("cdn.trustindex.io"),
    );
    assert.deepEqual(
      cdnAltrove.map(REL),
      [],
      "l'URL cdn.trustindex.io deve vivere solo in app/lib/site.ts",
    );

    // I consumer si scoprono dall'IMPORT del modulo, non dal tag JSX: un import
    // rinominato o un next/dynamic non possono uscire dalla scansione in silenzio —
    // il file importatore che non contiene il tag letterale fa FALLIRE il test e
    // costringe ad aggiornarlo consapevolmente.
    const importaEmbed = (src: string) => /(?:from\s*|import\()\s*["'][^"']*TrustindexEmbed["']/.test(src);
    const consumers = productionSources().filter((f) => importaEmbed(fs.readFileSync(f, "utf8")));
    assert.ok(
      consumers.length > 0,
      "nessun componente importa TrustindexEmbed: il controllo non sta guardando niente",
    );
    for (const f of consumers) {
      const src = fs.readFileSync(f, "utf8");
      assert.match(src, /useConsent\(\)/, `${REL(f)}: monta TrustindexEmbed senza leggere il consenso`);
      assert.match(src, /consent === "accepted"/, `${REL(f)}: manca il gate sul consenso accettato`);
      const gateIndex = src.indexOf("showTrustindex ?");
      assert.ok(gateIndex > 0, `${REL(f)}: manca il ramo "showTrustindex ?" prima del mount`);
      // TUTTI i mount, non solo il primo: un secondo <TrustindexEmbed aggiunto in
      // coda al file senza gate deve far scattare il test.
      const mounts = [...src.matchAll(/<TrustindexEmbed/g)].map((m) => m.index ?? -1);
      assert.ok(
        mounts.length > 0,
        `${REL(f)}: importa TrustindexEmbed ma non contiene il tag letterale <TrustindexEmbed — se l'import è stato rinominato o reso dinamico, riportare qui la scansione`,
      );
      for (const mountIndex of mounts) {
        assert.ok(
          gateIndex < mountIndex,
          `${REL(f)}: ogni mount dell'embed deve stare dentro il ramo protetto dal gate`,
        );
      }
    }
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
  test("NEXT_PUBLIC_SITE_URL letto in un posto solo (più diagnostica: /api/health e launch-check)", () => {
    const readers = productionSources().filter((f) =>
      /NEXT_PUBLIC_SITE_URL/.test(stripComments(fs.readFileSync(f, "utf8"))),
    );
    // launchReadiness legge la env GREZZA di proposito: site.ts la default-a al dominio di
    // produzione, nascondendo il caso "non impostata" che il launch-check deve invece rilevare.
    assert.deepEqual(readers.map(REL).sort(), [
      "app/api/health/route.ts",
      "app/lib/launchReadiness.ts",
      "app/lib/site.ts",
    ]);
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

describe("team — fonte unica del roster", () => {
  test("il roster è quello pubblicato dall'agenzia, con una sola founder", () => {
    assert.equal(team.length, 6);
    assert.equal(team.filter((m) => m.founder).length, 1);
    assert.equal(team[0].name, "Raffaela Rizza");
    // Grafia confermata da una recensione Google reale: una L sola.
    assert.ok(!JSON.stringify(team).includes("Raffaella"));
  });

  test("nomi e ruoli non si ripetono", () => {
    assert.equal(new Set(team.map((m) => m.name)).size, team.length);
    const nonFounder = team.filter((m) => !m.founder).map((m) => m.role);
    assert.equal(new Set(nonFounder).size, nonFounder.length);
  });

  test("ogni ruolo ha un'etichetta in tutte le lingue", () => {
    for (const locale of locales) {
      for (const member of team) {
        const label = teamRoleLabels[locale][member.role];
        assert.ok(label && label.trim().length > 0, `manca ${member.role} in ${locale}`);
      }
    }
  });

  // Il nome della FONDATRICE ricorre legittimamente nella prosa del sito (storia
  // dell'agenzia, alt delle foto, metadata): non è un roster duplicato. Il rischio
  // vero è che qualcuno riscriva a mano l'elenco delle colleghe da qualche parte.
  test("i nomi del resto del team vivono solo in app/lib/team.ts", () => {
    const others = productionSources().filter((f) => {
      if (f.endsWith(path.join("lib", "team.ts"))) return false;
      const src = fs.readFileSync(f, "utf8");
      return team.filter((m) => !m.founder).some((m) => src.includes(m.name));
    });
    assert.deepEqual(others.map(REL), []);
  });

  test("le iniziali restano di due lettere", () => {
    for (const member of team) {
      assert.match(teamInitials(member.name), /^[A-ZÀ-Ý]{2}$/);
    }
  });

  // "Raffaella" con due L è l'errore che una correzione automatica, un copia-incolla o un
  // collega in buona fede introducono prima o poi: è la grafia "giusta" in italiano, ma non
  // è la sua. Il roster era già protetto; da quando l'assistente del sito porta il suo nome
  // ("Assistente Raffaela") lo sbaglio arriverebbe fino alla prima riga di una conversazione.
  test("«Raffaela» resta con una L sola in tutto il sito", () => {
    const colpevoli = productionSources().filter((f) =>
      /Raffaella/.test(stripComments(fs.readFileSync(f, "utf8"))),
    );
    assert.deepEqual(colpevoli.map(REL), []);
  });
});

describe("assistente — la persona della fondatrice", () => {
  test("si chiama Assistente Raffaela, con una L sola", () => {
    assert.equal(ASSISTANT_NAME, "Assistente Raffaela");
    assert.ok(!ASSISTANT_NAME.includes("Raffaella"));
  });

  test("il prompt porta il nome, la voce e il limite di onestà", () => {
    const prompt = buildSystemPrompt();
    assert.ok(prompt.includes(ASSISTANT_NAME), "il prompt non nomina l'assistente");
    assert.match(prompt, /Non SEI Raffaela/, "manca la riga che impedisce di spacciarsi per lei");
    assert.match(prompt, /Prima la persona, poi l'immobile/, "manca la voce dell'agenzia");
  });

  // Impegno di marca (PRODUCT.md): nei testi rivolti al pubblico Domus Tua non parla di AI.
  // Il divieto vale su ciò che si LEGGE, non sulle istruzioni al modello — che infatti devono
  // nominare la cosa per poterla vietare. Quindi: la UI non ne parla, il prompt sì.
  test("la UI dell'assistente non nomina mai AI né intelligenza artificiale", () => {
    const vietato = /\bA\.?I\.?\b|intelligenza artificiale|artificial intelligence/i;
    for (const nome of ["Assistant.tsx", "AssistantLeadForm.tsx", "AssistantMount.tsx"]) {
      const src = stripComments(fs.readFileSync(path.join(APP_DIR, "components", nome), "utf8"));
      const riga = src.split("\n").find((l) => vietato.test(l));
      assert.equal(riga, undefined, `riferimento ad AI in ${nome}: ${riga}`);
    }
  });

  test("il prompt vieta esplicitamente di nominare AI", () => {
    assert.match(buildSystemPrompt(), /Non nominare mai AI/);
  });

  test("il pannello si presenta col nome in tutte e cinque le lingue", () => {
    const src = fs.readFileSync(path.join(APP_DIR, "components", "Assistant.tsx"), "utf8");
    const titoli = src.match(/title: "Assistente Raffaela"/g) ?? [];
    assert.equal(titoli.length, locales.length, "il nome manca in qualche lingua");
  });
});
