// IL LESSICO DEI TEMPI È UNO SOLO (D17). Alberto ha scelto il 13 settembre la
// «Fedeltà letterale» (A20): durate, stagger, ritardo ed ease di era-residence,
// con un nome per parte uguale in CSS e in GSAP — `--dur-dt-<k>` ↔ `durDt.<k>`,
// `--ease-dt-<kebab>` ↔ CustomEase `"dt<Pascal>"`. Questo test rilegge
// globals.css, gsap.ts e mq.ts e pretende che i numeri coincidano, che i nomi
// di serie di Tailwind non vengano ridefiniti, che non entri nessun blur
// (DESIGN.md, C14) e che i dieci token di transitions.dev ci siano, col
// prefisso `--td-` e i valori di spec §2.6 (D17).
//
// Le ease si confrontano in due versi, e solo quelle che esistono: ogni ease
// di Era entra nel commit del suo primo consumatore (spec §2.6). REQUIRED_EASES
// dice quali devono esserci già, così il test non passa a vuoto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

import { durDt, staggerDt, delayDt, painted } from "../motion/gsap";
import { MQ } from "../motion/mq";
import { ROLES } from "../motion/text-roles";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Commenti via prima di cercare (schema di logo-colore.test.ts:44-46). */
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const css = soloCodice(read("app/globals.css"));
const gsapTs = read("app/lib/motion/gsap.ts");
const mqTs = read("app/lib/motion/mq.ts");

/** Le quattro ease di Era (main.pretty.js:2863), valore JS da tutt'e due le parti. */
const ERA_EASES: Record<string, string> = {
  out: "0.25,1,0.5,1",
  in: "0.5,0,0.75,0",
  "in-out": "0.75,0,0.25,1",
  ease: "0.25,0.1,0.25,1",
};
/** Le ease di Era che a questo punto della costruzione devono esistere. */
const REQUIRED_EASES = ["out", "in", "ease"];

const nums = (s: string) =>
  s
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
const kebab = (pascal: string) => pascal.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

const cssEases = new Map(
  [...css.matchAll(/--ease-dt-([a-z-]+):\s*cubic-bezier\(([^)]*)\)\s*;/g)].map((m) => [m[1], nums(m[2])]),
);
const gsapEases = new Map(
  [...gsapTs.matchAll(/^CustomEase\.create\("dt([A-Z][A-Za-z]*)", "([\d.,]+)"\);\r?$/gm)].map((m) => [
    kebab(m[1]),
    nums(m[2]),
  ]),
);

/** Il valore della prima (e unica) definizione di un token in globals.css. */
function token(name: string): string {
  const all = [...css.matchAll(new RegExp(String.raw`(?:^|[\s;{])${name}:\s*([^;]+);`, "g"))];
  assert.equal(all.length, 1, `${name}: attesa una definizione sola, trovate ${all.length}`);
  return all[0][1].trim();
}

function tsx(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) tsx(p, out);
    else if (nome.endsWith(".tsx")) out.push(p);
  }
  return out;
}

describe("le ease del lessico: CSS e GSAP dicono le stesse cifre", () => {
  test("ogni --ease-dt-* è una ease di Era e ha la CustomEase gemella", () => {
    for (const [k, v] of cssEases) {
      assert.ok(k in ERA_EASES, `--ease-dt-${k}: non è una ease del lessico di Era`);
      assert.deepEqual(v, nums(ERA_EASES[k]), `--ease-dt-${k}: cifre diverse da Era`);
      assert.deepEqual(gsapEases.get(k), v, `--ease-dt-${k}: manca la CustomEase gemella o ha altre cifre`);
    }
  });

  test("ogni CustomEase dt* con un nome di Era ha il token CSS gemello", () => {
    for (const [k, v] of gsapEases) {
      if (!(k in ERA_EASES)) continue;
      assert.deepEqual(v, nums(ERA_EASES[k]), `dt${k}: cifre diverse da Era`);
      assert.deepEqual(cssEases.get(k), v, `dt${k}: manca --ease-dt-${k} in globals.css`);
    }
  });

  test("le ease di Era arrivate fin qui ci sono", () => {
    for (const k of REQUIRED_EASES) assert.ok(cssEases.has(k), `manca --ease-dt-${k}`);
  });

  test("ogni ease nominata dai ruoli del testo è creata in gsap.ts", () => {
    for (const [role, r] of Object.entries(ROLES)) {
      for (const ease of [r.enter.ease, r.exit.ease]) {
        assert.match(gsapTs, new RegExp(String.raw`CustomEase\.create\("${ease}", `), `${role}: ${ease} non è registrata`);
      }
    }
  });

  test("le ease stanno in un @theme static (Tailwind emette solo le variabili usate)", () => {
    assert.match(css, /@theme static \{[^}]*--ease-dt-out:/);
  });

  test("CustomEase una per riga, nella forma che leggono i test", () => {
    for (const riga of gsapTs.split(/\r?\n/)) {
      assert.ok((riga.match(/CustomEase\.create\(/g) ?? []).length <= 1, `due CustomEase su una riga: ${riga}`);
    }
    // l'unica create su più righe ammessa è il path a cinque segmenti di dtLoader
    assert.doesNotMatch(gsapTs, /CustomEase\.create\(\s*\r?\n\s*"(?!dtLoader")/);
  });
});

describe("durate, stagger, ritardo, stato dipinto, corsa ctn", () => {
  test("--dur-dt-s/m/l = durDt.s/m/l", () => {
    assert.equal(Number.parseFloat(token("--dur-dt-s")), durDt.s);
    assert.equal(Number.parseFloat(token("--dur-dt-m")), durDt.m);
    assert.equal(Number.parseFloat(token("--dur-dt-l")), durDt.l);
    assert.deepEqual(durDt, { s: 0.4, m: 0.8, l: 1.2 });
  });

  test("--stagger-dt = staggerDt, --delay-dt-reveal = delayDt.reveal", () => {
    assert.equal(token("--stagger-dt"), "0.1s");
    assert.equal(staggerDt, 0.1);
    assert.equal(token("--delay-dt-reveal"), "0.3s");
    assert.equal(delayDt.reveal, 0.3);
  });

  test("--dt-painted = painted = 0.02, e la regola dell'hero lo legge", () => {
    assert.equal(token("--dt-painted"), "0.02");
    assert.equal(painted, 0.02);
    assert.match(css, /\[data-hero-schar\]\) \{\s*opacity: var\(--dt-painted\);/);
    assert.match(read("app/components/HeroCinematic.tsx"), /gsap\.set\(allChars, \{ opacity: painted \}\);/);
  });

  test("--dt-ctn-y: 11.54vw sotto 1024, 3.333vw da 64rem; ctnY() dice lo stesso con MQ.lg", () => {
    assert.match(css, /:root \{[^}]*--dt-ctn-y: 11\.54vw;/);
    assert.match(css, /@media \(min-width: 64rem\) \{\s*:root \{\s*--dt-ctn-y: 3\.333vw;\s*\}\s*\}/);
    assert.match(
      gsapTs,
      /export const ctnY = \(\): string =>\s*typeof window !== "undefined" && window\.matchMedia\(MQ\.lg\)\.matches \? "3\.333vw" : "11\.54vw";/,
    );
  });

  test("via i token senza lettori; restano quelli con un consumatore", () => {
    assert.doesNotMatch(css, /--dur-(short|reveal|hero|transition):/);
    assert.match(css, /--dur-micro: 0\.3s;/);
    assert.doesNotMatch(gsapTs, /export const dist\b/);
    assert.doesNotMatch(gsapTs, /\bwords: 0\.1,|\blines: 0\.11,/);
    // /case/[slug] resta ferma (D32): PropertyDetail.tsx legge dur.micro e stagger.chars
    assert.match(gsapTs, /micro: 0\.3,/);
    assert.match(gsapTs, /chars: 0\.06,/);
    assert.match(gsapTs, /reveal: 0\.9,/);
  });
});

describe("i nomi che non si usano", () => {
  test("nessuna ridefinizione di --ease-in, --ease-out, --ease-in-out (sono di serie in Tailwind 4)", () => {
    assert.doesNotMatch(css, /--ease-(?:in|out|in-out)\s*:/);
  });

  test("token di transitions.dev solo col prefisso --td-", () => {
    assert.doesNotMatch(
      css,
      /(?:^|[\s;{])--(?:duration-(?:micro|quick|fast|medium|slow)|ease-smooth-out|distance-medium|scale-(?:small|medium|tiny)|ease-bounce[\w-]*)\s*:/,
    );
  });

  test("i dieci token di transitions.dev ci sono, una volta sola, coi valori di spec §2.6", () => {
    const TD: Record<string, string> = {
      "--td-duration-micro": "80ms",
      "--td-duration-quick": "150ms",
      "--td-duration-fast": "250ms",
      "--td-duration-medium": "350ms",
      "--td-duration-slow": "400ms",
      "--td-ease-smooth-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      "--td-distance-medium": "12px",
      "--td-scale-small": "0.98",
      "--td-scale-medium": "0.97",
      "--td-scale-tiny": "0.99",
    };
    for (const [nome, valore] of Object.entries(TD)) assert.equal(token(nome), valore, nome);
    assert.doesNotMatch(css, /--td-(?:blur|ease-bounce)[\w-]*\s*:/);
  });

  test("nessun blur in globals.css e nei componenti (C14)", () => {
    const vietato = /--blur-|[\w-]-blur\s*:|blur\(|backdrop-filter/;
    assert.doesNotMatch(css, vietato);
    const colpevoli = tsx(join(ROOT, "app"))
      .filter((p) => vietato.test(soloCodice(readFileSync(p, "utf8"))))
      .map((p) => p.slice(ROOT.length + 1).split(sep).join("/"));
    assert.deepEqual(colpevoli, []);
  });
});

describe("requestRefresh(): un refresh per fotogramma, chiesto al cambio lingua (spec §2.3)", () => {
  test("gsap.ts lo definisce sopra requestAnimationFrame e LocaleProvider lo chiede a scroll fermo", () => {
    assert.match(
      gsapTs,
      /export const requestRefresh = \(\(\) => \{\s*let raf = 0;\s*return \(\) => \{\s*cancelAnimationFrame\(raf\);\s*raf = requestAnimationFrame\(\(\) => ScrollTrigger\.refresh\(\)\);/,
    );
    // D54: al cambio lingua il refresh passa da whenStill e l'attesa è il cleanup dell'effetto: un
    // caricamento completo di /#frammento con cookie non `it` cambia lingua con l'arrivo nativo in volo.
    assert.match(
      read("app/components/i18n/LocaleProvider.tsx"),
      /return whenStill\(\(\) => requestRefresh\(\)\);\s*\}, \[locale\]\);/,
    );
  });

  test("whenStill(): subito a scroll fermo, altrimenti a scrollEnd col tetto del motore; uno solo per corridoi e cambio lingua (D53, D54)", () => {
    const still = gsapTs.slice(gsapTs.indexOf("export function whenStill("), gsapTs.indexOf("export const requestRefresh"));
    assert.ok(still.length > 0, "manca export function whenStill in gsap.ts, prima di requestRefresh");
    assert.match(still, /if \(!ScrollTrigger\.isScrolling\(\)\) \{\s*fn\(\);\s*return \(\) => \{\};/);
    assert.match(still, /ScrollTrigger\.addEventListener\("scrollEnd", onEnd\)/);
    assert.match(still, /if \(!ScrollTrigger\.isScrolling\(\)\) onEnd\(\);\s*\}, STILL_CAP_MS\)/);
    assert.match(still, /return \(\) => \{\s*ScrollTrigger\.removeEventListener\("scrollEnd", onEnd\);\s*window\.clearTimeout\(cap\);/);
    assert.match(gsapTs, /^const STILL_CAP_MS = 4000;/m);
    const hook = soloCodice(read("app/components/motion/useCorridor.ts"));
    assert.match(hook, /whenStill\(\(\) => requestRefresh\(\)\)/);
    assert.doesNotMatch(hook, /function refreshWhenStill|STILL_CAP_MS/, "il corridoio non tiene una copia dell'helper");
  });

  test("load è fuori dagli eventi di refresh automatico di ScrollTrigger: dopo load rinfresca whenStill (D56)", () => {
    assert.match(gsapTs, /^ScrollTrigger\.config\(\{ ignoreMobileResize: true \}\);/m);
    // Sotto la guardia di `window`: senza DOM ScrollTrigger non ha la lista degli eventi e `config` cade.
    assert.match(
      gsapTs,
      /if \(typeof window !== "undefined"\) \{\s*ScrollTrigger\.config\(\{ autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize" \}\);\s*\}/,
    );
    assert.match(gsapTs, /window\.addEventListener\("load", \(\) => whenStill\(\(\) => requestRefresh\(\)\), \{ once: true \}\);/);
  });
});

describe("mq.ts: le media query senza GSAP", () => {
  test("le soglie dei corridoi (D22) e del segno (A21)", () => {
    assert.equal(MQ.corridor, "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 640px)");
    assert.equal(MQ.xl, "(min-width: 1280px)");
    assert.equal(MQ.lg, "(min-width: 1024px)");
    assert.equal(MQ.motionOk, "(prefers-reduced-motion: no-preference)");
  });

  test("mq.ts non importa GSAP; gsap.ts lo importa e lo riesporta", () => {
    assert.doesNotMatch(mqTs, /from\s+["'](?:gsap|@gsap\/react|\.\/gsap)/);
    assert.match(gsapTs, /^import \{ MQ \} from "\.\/mq";\r?$/m);
    assert.match(gsapTs, /^export \{ gsap, ScrollTrigger, CustomEase, useGSAP, MQ \};\r?$/m);
  });
});
