// L'aritmetica dei corridoi sticky: A19 di Alberto («Sticky dove serve»), D22.
//
// Oggi app/lib/motion/corridor-math.ts è la parte pura di useCorridor:
// - quota di aggancio e innesco di default (spec §2.7);
// - cue avanti e indietro;
// - rete di fine documento;
// - ricerca del progresso che rende visibile un elemento a fuoco.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { chapters } from "../motion/chapters";
import {
  cuesValid,
  DEFAULT_END,
  defaultStart,
  endNetDue,
  nearestVisibleProgress,
  stepCues,
  stickTopFor,
} from "../motion/corridor-math";

describe("corridor-math", () => {
  test("quota di aggancio: 0 per stick top, min(0, innerHeight − H) per stick bottom", () => {
    assert.equal(stickTopFor("top", 900, 1200), 0);
    assert.equal(stickTopFor("bottom", 900, 984), -84); // #top a 1440×900 (spec §3.2)
    assert.equal(stickTopFor("bottom", 900, 700), 0);
  });

  test("l'innesco di default è quello scritto nel registro", () => {
    assert.equal(defaultStart("bottom", -84), "top -84px");
    assert.equal(defaultStart("top", 0), "top top");
    const hero = chapters.hero.signature.trigger;
    const dive = chapters["page-dive"].signature.trigger;
    assert.ok("st" in hero);
    assert.ok("st" in dive);
    assert.deepEqual(hero.st, ["top ${stickTop}px", DEFAULT_END]);
    assert.deepEqual(dive.st, [defaultStart("top", 0), DEFAULT_END]);
  });

  test("cue: avanti una volta, indietro una volta, i mancanti dopo un salto", () => {
    const cues = [{ at: 0.5 }, { at: 1 }];
    const fired = [false, false];
    assert.deepEqual(stepCues(cues, fired, 0.2), []);
    assert.deepEqual(stepCues(cues, fired, 0.6), [{ index: 0, dir: "forward" }]);
    assert.deepEqual(stepCues(cues, fired, 0.7), []);
    assert.deepEqual(stepCues(cues, fired, 1), [{ index: 1, dir: "forward" }]);
    assert.deepEqual(stepCues(cues, fired, 0.1), [
      { index: 1, dir: "backward" },
      { index: 0, dir: "backward" },
    ]);
    const ricarica = [false, false];
    assert.deepEqual(stepCues(cues, ricarica, 1), [
      { index: 0, dir: "forward" },
      { index: 1, dir: "forward" },
    ]);
  });

  test("cue validi solo in (0, 1] e in ordine", () => {
    assert.equal(cuesValid([{ at: 0.94 }, { at: 1 }]), true);
    assert.equal(cuesValid([{ at: 0 }]), false);
    assert.equal(cuesValid([{ at: 1.2 }]), false);
    assert.equal(cuesValid([{ at: 1 }, { at: 0.5 }]), false);
  });

  test("rete di fine documento", () => {
    const base = {
      scrollY: 0,
      innerHeight: 900,
      scrollHeight: 30000,
      wrapperBottom: 2000,
      progress: 0.4,
      hasEndTrigger: false,
      stEnd: 5000,
    };
    assert.equal(endNetDue(base), false);
    assert.equal(endNetDue({ ...base, scrollY: 29100 }), true);
    assert.equal(endNetDue({ ...base, wrapperBottom: 901 }), true);
    assert.equal(endNetDue({ ...base, scrollY: 29100, progress: 1 }), false);
  });

  test("rete di fine documento con endTrigger: la cartolina finisce col footer al 40 %", () => {
    // 1440×900: section 1.620 px (100svh + 80svh), footer attaccato sotto con −8svh.
    // Il bordo basso della section tocca il viewport prima che il footer arrivi al 40 %.
    const cartolina = {
      scrollY: 30000,
      innerHeight: 900,
      scrollHeight: 32000,
      wrapperBottom: 880,
      progress: 0.7,
      hasEndTrigger: true,
      stEnd: 30400,
    };
    assert.equal(endNetDue(cartolina), false);
    assert.equal(endNetDue({ ...cartolina, scrollY: 30399 }), true);
    assert.equal(endNetDue({ ...cartolina, scrollY: 30500, progress: 1 }), false);
    assert.equal(endNetDue({ ...cartolina, scrollY: 31100 }), true);
  });

  test("fuoco: il progresso visibile più vicino a quello di oggi", () => {
    const vista = (p: number) => p >= 0.3 && p <= 0.5;
    assert.equal(nearestVisibleProgress(0.4, vista), 0.4);
    assert.ok(Math.abs((nearestVisibleProgress(0.8, vista) ?? -1) - 0.5) < 1e-3);
    assert.ok(Math.abs((nearestVisibleProgress(0.1, vista) ?? -1) - 0.3) < 1e-3);
    assert.equal(nearestVisibleProgress(0.5, () => false), null);
  });
});
