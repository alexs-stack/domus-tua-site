// I GESTI DEI CAPITOLI 13-16 COINCIDONO COL REGISTRO DELLE FIRME.
//
// A20 di Alberto (13 set.): un gesto per capitolo, nessuna coppia con la stessa
// ease, lo stesso tempo o lo stesso innesco. `chapters.test.ts` presidia il
// registro; questo test pretende che il codice dei componenti usi proprio quei
// valori (spec 2026-09-13 §3.14-3.17), che i gesti di FeaturedTestimonial e
// Contact restino in home (D28) e che la foto del modulo resti nel Reveal
// fuori dalla home (§3.17, /case/[slug] ferma per D32).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { chapters } from "../motion/chapters";

const ROOT = process.cwd();

/* Commenti via prima di cercare, come `soloCodice` di logo-colore.test.ts. */
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const src = (rel: string) => soloCodice(readFileSync(join(ROOT, rel), "utf8"));

function tsx(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) tsx(p, out);
    else if (nome.endsWith(".tsx")) out.push(p);
  }
  return out;
}
const TUTTI = tsx(join(ROOT, "app")).map((p) => ({
  rel: relative(ROOT, p).split(sep).join("/"),
  testo: soloCodice(readFileSync(p, "utf8")),
}));

type Firma = { ease: string; time: { scrub?: number | true }; trigger: { st?: [string, string] } };
function firma(ease: string): Firma {
  const c = (Object.values(chapters) as Array<{ signature: Firma }>).find((ch) => ch.signature.ease === ease);
  assert.ok(c, `nessun capitolo con ease ${ease} in chapters.ts`);
  return c!.signature;
}

const gsapTs = src("app/lib/motion/gsap.ts");

describe("capitolo 13, FeaturedTestimonial: la foto affonda", () => {
  const ft = src("app/components/FeaturedTestimonial.tsx");
  const f = firma("dtAffonda");
  test("dtAffonda è registrata in gsap.ts con la curva di §3.1", () => {
    assert.match(gsapTs, /CustomEase\.create\("dtAffonda", "0\.5,0,0\.8,0\.45"\);/);
  });
  test("ease, scrub e innesco del codice = registro", () => {
    assert.match(ft, /ease:\s*"dtAffonda"/);
    assert.ok(ft.includes(`scrub: ${f.time.scrub}`), `scrub ${f.time.scrub} assente`);
    assert.ok(ft.includes(`start: "${f.trigger.st![0]}"`) && ft.includes(`end: "${f.trigger.st![1]}"`));
  });
  test("con gesture la sizes sale a 61vw, senza resta quella di oggi", () => {
    assert.ok(ft.includes('"(max-width:1024px) 132vw, 61vw"'));
    assert.ok(ft.includes('"(max-width:1024px) 132vw, 56vw"'));
  });
});

describe("capitolo 14, Social: il titolo si congeda (A25)", () => {
  const so = src("app/components/Social.tsx");
  const f = firma("expo.in");
  test("scala 1 → 1,12, opacità 1 → 0, origine 0 % 100 %", () => {
    assert.match(so, /scale:\s*1\.12/);
    // `0` seguito da un punto o da una cifra (0.5, 02) non vale: l'opacità finale è 0 tondo.
    assert.match(so, /opacity:\s*0(?![.\d])/);
    assert.match(so, /transformOrigin:\s*"0% 100%"/);
    assert.match(so, /ease:\s*"expo\.in"/);
  });
  test("scrub e innesco del codice = registro", () => {
    assert.ok(so.includes(`scrub: ${f.time.scrub}`));
    assert.ok(so.includes(`start: "${f.trigger.st![0]}"`) && so.includes(`end: "${f.trigger.st![1]}"`));
  });
  test("la section ritaglia in orizzontale (nessuno sticky dentro)", () => {
    assert.match(so, /<section className="[^"]*\boverflow-x-clip\b/);
  });
});

describe("capitolo 15, Team: la rotaia", () => {
  const team = src("app/components/Team.tsx");
  const rail = src("app/components/motion/HorizontalRail.tsx");
  const f = firma("dtRail");
  test("dtRail è registrata in gsap.ts con la curva di §3.1", () => {
    assert.match(gsapTs, /CustomEase\.create\("dtRail", "0\.5,0,0\.5,1"\);/);
  });
  test("Team passa scrub e ease del registro alla rotaia", () => {
    assert.ok(team.includes(`scrub={${f.time.scrub}}`), `Team non passa scrub={${f.time.scrub}}`);
    assert.match(team, /ease="dtRail"/);
    // Il corridoio del commit 7 resta acceso: corridors.spec.ts conta «team».
    assert.match(team, /corridor="team"/);
  });
  test("HorizontalRail tiene i default di oggi e non scrive più scrub fissi", () => {
    assert.match(rail, /scrub = 0\.6/);
    assert.match(rail, /ease = "none"/);
    assert.doesNotMatch(rail, /scrub:\s*0\.6/);
  });
  test("la rete di tastiera della rotaia scatta solo col fuoco visibile (spec §3.18, rete dei corridoi)", () => {
    assert.match(rail, /matches\(":focus-visible"\)/);
  });
  test("via la Parallax dall'intro del team (D23)", () => {
    assert.doesNotMatch(team, /Parallax/);
  });
  test("le foto del capitolo portano data-bg=\"foto\" (§6.1)", () => {
    assert.ok((team.match(/data-bg="foto"/g) ?? []).length >= 2);
  });
});

describe("capitolo 16, Contact: il modulo resta indietro (D30)", () => {
  const co = src("app/components/Contact.tsx");
  const f = firma("power1.in");
  test("yPercent −3,5 → 3,5 con ease, scrub e innesco del registro", () => {
    assert.match(co, /yPercent:\s*-3\.5/);
    assert.match(co, /yPercent:\s*3\.5/);
    assert.match(co, /ease:\s*"power1\.in"/);
    assert.ok(co.includes(`scrub: ${f.time.scrub}`));
    assert.ok(co.includes(`start: "${f.trigger.st![0]}"`) && co.includes(`end: "${f.trigger.st![1]}"`));
  });
  // Dal 20 set. (A36, D205-D206) fuori dalla home le chiavi entrano con la lama, e su
  // /case/[slug] LamaMedia rende il Reveal di oggi con lo stesso ritardo (frozenDelay 120).
  test("in home la foto sta fuori da ogni tween, altrove entra con la lama (D28 superata da D206; D205 su /case)", () => {
    // Il ternario intero: senza, o invertito, la foto resterebbe nel Reveal anche in home.
    assert.match(co, /\{gesture \? \(\s*keysPhoto\s*\) : \(\s*<LamaMedia id="chiavi" className="dt-media-half mt-10" frozenDelay=\{120\}>/);
    assert.match(co, /data-lag-col/);
  });
  test("requestRefresh a scroll fermo su sent, delivery e intento, su tutte le rotte, mai al montaggio (§3.17)", () => {
    assert.match(
      co,
      /useEffect\(\(\) => \{(?:(?!useEffect)[\s\S])*?return whenStill\(\(\) => requestRefresh\(\)\);\s*\}, \[sent, delivery, intent\]\);/,
    );
    // `whenStill` di gsap.ts, non una copia locale, e l'attesa è il cleanup
    // dell'effetto: un refresh forzato mentre un arrivo nativo al frammento è in
    // volo lo cancella, e su /#cerca rimette a 0,02 il pannello della ricerca
    // (D39, D53, D54, D56, D57). Il montaggio salta il refresh: nessuna altezza
    // è ancora cambiata e il deep-link `?intent=` arriva il tick dopo.
    assert.match(co, /import \{[^}]*\bwhenStill\b[^}]*\} from "\.\.\/lib\/motion\/gsap";/);
    assert.match(co, /if \(!montato\.current\) \{\s*montato\.current = true;\s*return;\s*\}/);
  });
});

describe("i gesti di FeaturedTestimonial e Contact restano in home (D28)", () => {
  test("solo app/page.tsx passa gesture", () => {
    const ft = TUTTI.filter((f) => /<FeaturedTestimonial\b[^>]*\bgesture\b/.test(f.testo)).map((f) => f.rel);
    const co = TUTTI.filter((f) => /<Contact\b[^>]*\bgesture\b/.test(f.testo)).map((f) => f.rel);
    assert.deepEqual(ft, ["app/page.tsx"]);
    assert.deepEqual(co, ["app/page.tsx"]);
  });
});
