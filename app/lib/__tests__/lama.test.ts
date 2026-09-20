// La lama, il ruolo comune `media` (A36 di Alberto, 19 set. 2026; brief D200-D219 in
// .superpowers/sdd/2026-09-13-coreografia-era-residence/qualita/a36/). Il modulo puro
// `lama.ts` (forme, tempi, tabella delle sette foto) e la primitiva `LamaMedia.tsx` letta
// come sorgente: nessuna scala, due IntersectionObserver propri, `will-change` solo in corsa,
// il gruppo dall'ordine DOM, il fade-up di oggi su /case. Poi i sei consumatori: chi la usa
// e chi no (D212), e le inquadrature di D201.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LAMA, LAMA_FOR, clipSlantFrom, clipSlantOut, delayFor, xDaMargine, xIniziale } from "../motion/lama";
import { clipSlant } from "../motion/clip";
import { durDt, staggerDt, delayDt } from "../motion/gsap";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

describe("lama.ts: i numeri del ruolo (D214)", () => {
  test("tempi e curve dal lessico di era: 1,2 s dtInOut in entrata, 0,4 s dtIn in uscita, ritardo 0,3 + i × 0,1", () => {
    assert.equal(LAMA.dur, durDt.l);
    assert.equal(LAMA.outDur, durDt.s);
    assert.equal(LAMA.ease, "dtInOut");
    assert.equal(LAMA.outEase, "dtIn");
    assert.equal(delayFor(0), delayDt.reveal);
    assert.equal(delayFor(1), 0.4);
    assert.equal(delayFor(3), 0.6, "in decimi: 0,3 + 3 × 0,1 in virgola mobile vale 0,6000000000000001");
    assert.equal(delayFor(5), 0.8);
    assert.equal(delayFor(7), 0.8, "tetto 5 (D204)");
    assert.equal(delayFor(-2), delayDt.reveal);
    assert.equal(staggerDt, 0.1);
  });

  test("gli IO: entrata a 0 px (il «top bottom» di era), uscita alla linea dell'85 % (D21)", () => {
    assert.equal(LAMA.entryMargin, "0px");
    assert.equal(LAMA.exitMargin, "0px 0px -15% 0px");
    assert.equal(LAMA.xMax, 10);
  });
});

describe("lama.ts: le forme (D213)", () => {
  test("da destra l'entrata è il parallelogramma di Voci (clip.ts), numero per numero", () => {
    for (const e of [0, 0.25, 0.5, 0.75, 1]) assert.equal(clipSlantFrom(e, "right"), clipSlant(e));
    assert.equal(clipSlantFrom(1, "right"), "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)");
    assert.equal(clipSlantFrom(0, "right"), "polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)");
  });

  test("da sinistra è lo specchio: a 1 il rettangolo pieno, a 0 una fessura fuori dal bordo sinistro", () => {
    assert.equal(clipSlantFrom(1, "left"), "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)");
    assert.equal(clipSlantFrom(0, "left"), "polygon(0% 0%, 0% 0%, -25% 100%, -1% 100%)");
    assert.equal(clipSlantFrom(0.5, "left"), "polygon(0% 0%, 50% 0%, 37.5% 100%, -0.5% 100%)");
    // Il bordo che guida: testa a 100e, piede a 125e − 25 (inclinazione del 25 %).
    assert.equal(clipSlantFrom(0.8, "left"), "polygon(0% 0%, 80% 0%, 75% 100%, -0.2% 100%)");
  });

  test("la famiglia è affine in e: un `to` verso clipSlantFrom(0) ripercorre l'entrata all'indietro (D213)", () => {
    const num = (poly: string) => [...poly.matchAll(/-?\d+(?:\.\d+)?%/g)].map((m) => Number.parseFloat(m[0]));
    for (const from of ["left", "right"] as const) {
      const a = num(clipSlantFrom(0, from));
      const b = num(clipSlantFrom(1, from));
      const mid = num(clipSlantFrom(0.5, from));
      mid.forEach((v, k) => assert.ok(Math.abs(v - (a[k] + b[k]) / 2) < 1e-9, `${from}: vertice ${k} non affine`));
    }
  });

  test("l'uscita da aperto collassa verso il lato d'ingresso con la foto ferma", () => {
    assert.equal(clipSlantOut(0, "right"), "polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)");
    assert.equal(clipSlantOut(1, "right"), "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)");
    assert.equal(clipSlantOut(0, "left"), "polygon(0% 0%, 100% 0%, 100% 100%, -25% 100%)");
    assert.equal(clipSlantOut(1, "left"), "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)");
  });

  test("nessuna forma è curva (C01) e ogni forma ha quattro vertici in percentuale", () => {
    for (const from of ["left", "right"] as const) {
      for (const p of [0, 0.3, 1]) {
        for (const poly of [clipSlantFrom(p, from), clipSlantOut(p, from)]) {
          assert.doesNotMatch(poly, /round|circle\(|ellipse\(|path\(|url\(/i);
          assert.equal((poly.match(/%/g) ?? []).length, 8, poly);
        }
      }
    }
  });
});

describe("lama.ts: le sette foto (D201-D203, D218)", () => {
  test("X = min(10, ⌊100·m⌋), sotto 3 vale 0", () => {
    assert.equal(xDaMargine(0), 0);
    assert.equal(xDaMargine(0.02), 0);
    assert.equal(xDaMargine(0.033), 3);
    assert.equal(xDaMargine(0.04), 4);
    assert.equal(xDaMargine(0.131), 10);
    assert.equal(xDaMargine(0.47), 10);
  });

  test("la tabella ricalcolata dai margini misurati: verso e scivolo di ogni foto", () => {
    // margine libero dei corpi sul lato d'ingresso (qualita/a36/sintesi/misure.json, parte A)
    const misure: Record<keyof typeof LAMA_FOR, { from: "left" | "right"; m: number }> = {
      sede: { from: "left", m: 0.131 },
      "paths-vendi": { from: "left", m: 0.033 },
      "paths-acquista": { from: "left", m: 0.47 },
      "chi-siamo": { from: "right", m: 0.365 },
      chiavi: { from: "right", m: 0.04 },
      "testimonianza-recensione": { from: "right", m: 0 },
      "testimonianza-consulenza": { from: "left", m: 0.264 },
    };
    assert.deepEqual(Object.keys(LAMA_FOR).sort(), Object.keys(misure).sort());
    for (const [id, v] of Object.entries(misure) as [keyof typeof LAMA_FOR, { from: "left" | "right"; m: number }][]) {
      assert.equal(LAMA_FOR[id].from, v.from, `${id}: verso`);
      assert.equal(LAMA_FOR[id].x, xDaMargine(v.m), `${id}: X`);
    }
    // Paths da sinistra per la regola della fila (Voci, che precede, apre da destra: A28 (10)).
    assert.equal(LAMA_FOR["paths-vendi"].x, 3);
    assert.equal(LAMA_FOR["paths-acquista"].from, "left");
    // La copertina cotta entra col solo bordo (D218).
    assert.equal(LAMA_FOR["testimonianza-recensione"].x, 0);
    assert.equal(xIniziale("sede"), -10);
    assert.equal(xIniziale("chiavi"), 4);
  });
});

describe("LamaMedia.tsx: la primitiva, letta come sorgente", () => {
  const src = soloCodice(leggi("app/components/motion/LamaMedia.tsx"));

  test("due IO propri, niente ScrollTrigger, nessuna scala, will-change solo in corsa (D214, D215)", () => {
    assert.equal((src.match(/new IntersectionObserver\(/g) ?? []).length, 2);
    assert.match(src, /rootMargin: LAMA\.entryMargin/);
    assert.match(src, /rootMargin: LAMA\.exitMargin/);
    assert.doesNotMatch(src, /ScrollTrigger|scrollTrigger:|\bpin\b/);
    assert.doesNotMatch(src, /\bscale\b\s*:/);
    assert.match(src, /box\.style\.willChange = "clip-path"/);
    assert.match(src, /inner\.style\.willChange = "transform"/);
    assert.match(src, /img\?\.decode\?\.\(\)/);
  });

  test("gli stati di D209: entrata solo da armato, su entry o exitLine; uscito dal basso → armato in un set", () => {
    assert.match(src, /if \(stato !== "armato"\) return;/);
    assert.match(src, /if \(stato === "armato"\) entra\(\);/);
    assert.match(src, /e\.boundingClientRect\.top >= window\.innerHeight && stato !== "riposo"/);
    assert.match(src, /if \(e\.boundingClientRect\.top < 0\) apri\(\);/, "il rientro dall'alto apre senza corsa");
    assert.match(src, /gsap\.matchMedia\(\)/);
    assert.match(src, /mm\.add\(MQ\.motionOk/);
  });

  test("uscita a metà entrata: la corsa torna indietro verso clipSlantFrom(0) (D213); da aperto clipSlantOut con l'interno fermo", () => {
    assert.match(src, /tl\.to\(box, \{ clipPath: clipSlantFrom\(0, from\), duration: LAMA\.outDur, ease: LAMA\.outEase/);
    assert.match(src, /\{ clipPath: clipSlantOut\(0, from\) \},\s*\{ clipPath: clipSlantOut\(1, from\), duration: LAMA\.outDur/);
  });

  test("il gruppo dall'ordine DOM di [data-lama-group] (D204), il fuoco apre, su /case il Reveal di oggi (D205)", () => {
    assert.match(src, /box\.closest\("\[data-lama-group\]"\)/);
    assert.match(src, /delayFor\(/);
    assert.match(src, /addEventListener\("focusin", onFocus\)/);
    assert.match(src, /useMotionFrozen\(\)/);
    assert.match(src, /<Reveal delay=\{frozenDelay\}>/);
    assert.match(src, /data-lama-inner/);
  });
});

describe("i consumatori (brief §4, D212)", () => {
  const usa = (p: string) => /<LamaMedia\b/.test(soloCodice(leggi(p)));

  test("sei moduli, sette foto: Posizionamento, Paths ×2, Chi siamo, Contact fuori dalla home, la testimonianza fuori dalla home", () => {
    const posiz = soloCodice(leggi("app/components/Posizionamento.tsx"));
    assert.match(posiz, /<LamaMedia id="sede" className="dt-media-half">/);
    assert.match(posiz, /objectPosition: "100% 50%"/, "la sede si rincornicia (D201)");
    const paths = soloCodice(leggi("app/components/Paths.tsx"));
    assert.match(paths, /id=\{p\.id === "vendi" \? "paths-vendi" : "paths-acquista"\}/);
    assert.match(soloCodice(leggi("app/chi-siamo/ChiSiamoContent.tsx")), /<LamaMedia id="chi-siamo" className="dt-media-half">/);
    const contact = soloCodice(leggi("app/components/Contact.tsx"));
    assert.match(contact, /gesture \? \(\s*keysPhoto\s*\) : \(\s*<LamaMedia id="chiavi"/, "in home ferme (D30), altrove la lama (D206)");
    assert.match(contact, /objectPosition: "50% 0%"/, "le chiavi dall'alto (D201)");
    assert.match(contact, /frozenDelay=\{120\}/, "su /case il fade-up di oggi (D205)");
    const testim = soloCodice(leggi("app/components/FeaturedTestimonial.tsx"));
    assert.match(testim, /gesture \? linkHome : linkLama/);
    assert.match(testim, /id=\{cotta \? "testimonianza-recensione" : "testimonianza-consulenza"\}/);
    assert.match(testim, /className=\{cotta \? "dt-still-trim--top object-cover" : "object-cover"\}/, "il trim solo sulla copertina cotta (D218)");
    assert.doesNotMatch(testim, /Parallax/, "via la deriva fuori dalla home (D207)");
    assert.match(testim, /sopra=\{play\}/, "il play dentro il ritaglio (D208)");
  });

  test("chi NON la usa (D212): Voci, Method, Services, Team, Costi, HorizonStory, Open Domus, PageHero, Congedo", () => {
    for (const p of [
      "app/components/Voci.tsx",
      "app/components/Method.tsx",
      "app/components/Services.tsx",
      "app/components/Team.tsx",
      "app/components/CostiChiari.tsx",
      "app/components/HorizonStory.tsx",
      "app/components/OpenDomus.tsx",
      "app/components/PageHero.tsx",
      "app/components/motion/PageHeroTesta.tsx",
      "app/components/Congedo.tsx",
    ]) {
      assert.ok(!usa(p), `${p} non deve usare LamaMedia`);
    }
  });
});
