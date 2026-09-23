// L'aggancio della ricerca e il carosello di Voci, letti dal sorgente.
//
// Alberto, 13 settembre 2026: coreografia piena (A18) e fedeltà letterale a
// era-residence (A20). Spec coreografia §3.4 (CAT §6a) e §3.7 (CAT §4,
// animateSlide di Era). Firme in chapters.ts (D18). Commenti tolti prima di
// cercare (soloCodice di app/components/__tests__/logo-colore.test.ts).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chapters } from "../motion/chapters";
import { clipSlant } from "../motion/clip";

const root = join(__dirname, "..", "..", "..");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const ricerca = soloCodice(readFileSync(join(root, "app/components/HomeSearchGateway.tsx"), "utf8"));
const voci = soloCodice(readFileSync(join(root, "app/components/Voci.tsx"), "utf8"));

describe("HomeSearchGateway: l'aggancio del pannello", () => {
  test("la firma nel registro: circ.out, scrub 0,35, top 95% → top 55%", () => {
    const s = chapters.ricerca.signature;
    assert.equal(s.ease, "circ.out");
    assert.ok("scrub" in s.time && s.time.scrub === 0.35);
    assert.ok("st" in s.trigger);
    if ("st" in s.trigger) {
      assert.deepEqual(s.trigger.st, ["top 95%", "top 55%"]);
      assert.equal(s.trigger.el, "[data-dock]");
    }
  });

  test("l'innesco data-dock non scala: set e fromTo sul pannello interno; mai visibility né autoAlpha", () => {
    assert.match(
      ricerca,
      /<div\s+ref=\{dockRef\}\s+data-dock>\s*<div\s+ref=\{panelRef\}\s+data-dock-panel>\s*<form onSubmit=\{submit\}/,
    );
    assert.match(ricerca, /chapters\.ricerca\.signature/);
    assert.doesNotMatch(ricerca, /chapters\.cerca\b/);
    assert.match(ricerca, /gsap\.set\(panel, \{ opacity: 0\.02, scale: 0\.75 \}\)/);
    assert.match(ricerca, /gsap\.fromTo\(\s*panel,/);
    assert.match(ricerca, /trigger:\s*dock,/);
    assert.doesNotMatch(ricerca, /gsap\.(set|to|fromTo)\(\s*dock\b/);
    assert.match(ricerca, /immediateRender:\s*false/);
    assert.match(ricerca, /dock\.getBoundingClientRect\(\)\.top > 0\.95 \* window\.innerHeight/);
    assert.match(ricerca, /getTween\(\)\?\.progress\(1\)/);
    assert.doesNotMatch(ricerca, /autoAlpha|visibility/);
    assert.doesNotMatch(ricerca, /<Reveal[^>]*>\s*<form/);
  });

  // D57: con l'ancora su #cerca o più giù l'aggancio nasce a scroll fermo (whenStill di gsap.ts),
  // così l'arrivo nativo al frammento non dipinge lo stato spento. Anche con l'innesco già sopra la
  // linea di start se lo scroll è in corso (idratazione lenta): armato a metà dell'arrivo il pannello
  // nascerebbe al progresso di quel momento. E niente invalidateOnRefresh: col revert del refresh e
  // immediateRender false il pannello resterebbe pieno a progresso 0.
  test("con l'ancora l'aggancio aspetta lo scroll fermo; nessun invalidateOnRefresh", () => {
    assert.match(ricerca, /whenStill\(arma\)/);
    assert.match(ricerca, /if \(ancoraQuiOPiuGiu && \(sottoLaLinea\(\) \|\| ScrollTrigger\.isScrolling\(\)\)\) \{/);
    assert.match(ricerca, /if \(ScrollTrigger\.isScrolling\(\)\) parti\(\);/);
    assert.doesNotMatch(ricerca, /invalidateOnRefresh/);
  });

  // Un frammento malformato (`/#%`, `/#a%E2`) fa lanciare decodeURIComponent dentro il layout
  // effect: la decodifica sta in try/catch col ripiego sull'id grezzo, come fragmentPending di
  // reveal-engine.ts, e la home non cade su app/error.tsx.
  test("il frammento malformato non lancia: decodeURIComponent in try/catch con ripiego sull'id grezzo", () => {
    assert.doesNotMatch(ricerca, /getElementById\(decodeURIComponent\(location\.hash/);
    assert.match(
      ricerca,
      /try \{\s*return document\.getElementById\(decodeURIComponent\(id\)\);\s*\} catch \{\s*return document\.getElementById\(id\);\s*\}/,
    );
  });
});

describe("Voci: il carosello arriva da destra", () => {
  test("la firma nel registro: domus.inOut, 1,0 s, ritardo 0, stagger 0,15, IO −30 %", () => {
    const s = chapters.voci.signature;
    assert.equal(s.ease, "domus.inOut");
    assert.ok("dur" in s.time);
    if ("dur" in s.time) assert.deepEqual([s.time.dur, s.time.delay, s.time.stagger], [1, 0, 0.15]);
    assert.ok("io" in s.trigger);
    if ("io" in s.trigger) assert.deepEqual(s.trigger.io, { rootMargin: "0px 0px -30% 0px", threshold: 0 });
  });

  test("il parallelogramma di Era: ingresso da clipSlant, uscita coi due poligoni di §3.7", () => {
    assert.equal(clipSlant(0), "polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)");
    assert.equal(clipSlant(1), "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)");
    assert.match(voci, /clipSlant\(0\)/);
    assert.match(voci, /clipSlant\(1\)/);
    assert.match(voci, /"polygon\(0% 0%, 100% 0%, 125% 100%, 0% 100%\)"/);
    assert.match(voci, /"polygon\(0% 0%, 0% 0%, 0% 100%, 0% 100%\)"/);
    assert.match(voci, /chapters\.voci\.signature/);
    assert.match(voci, /new IntersectionObserver/);
    assert.match(voci, /if \(primoCallback\) \{\s*primoCallback = false;\s*if \(!e\.isIntersecting\) return;/);
    assert.doesNotMatch(voci, /ScrollTrigger/);
  });

  test("dt-still-trim resta sull'img; nessuna scala nel gesto (tetto 1,43)", () => {
    assert.match(voci, /<YoutubeThumb[^>]*className="dt-still-trim object-cover"/);
    const inner = voci.match(/<span\s+data-voci-slide-inner\s+className="([^"]*)"/);
    assert.ok(inner, "manca span data-voci-slide-inner");
    assert.ok(!inner![1].includes("dt-still-trim"), "dt-still-trim è finito sull'inner");
    assert.doesNotMatch(voci, /\bscale\s*:|scale\(/);
  });

  test("il link non riceve clip né transform; il play resta fuori dall'inner; il wrapper ritaglia in x", () => {
    assert.doesNotMatch(voci, /<a\b[^>]*data-voci/);
    assert.match(voci, /<span\s+data-voci-slide\s+className="dt-media-full block"/);
    const i = voci.search(/<span\s+data-voci-slide-inner\b/);
    const chiusa = voci.indexOf("</span>", voci.indexOf("<YoutubeThumb", i));
    const play = voci.indexOf("<Play", i);
    assert.ok(play > chiusa, "il play sta dentro l'inner che trasla");
    // passo clamp(2rem,5vh,4rem) dal 2026-09-20 (Alberto: distanze fra testo e foto piu' corte)
    assert.match(voci, /className="relative mt-\[clamp\(2rem,5vh,4rem\)\] overflow-x-clip"/);
  });
});
