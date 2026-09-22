// I RUOLI DEL TESTO. Alberto il 13 settembre: «Fedeltà letterale» (A20), quindi
// il testo si muove con gli animatori di era-residence (main.pretty.js:401-618),
// uguale in tutti i capitoli; «Piatto come Era» (A22), quindi nessuna
// transformPerspective. I tetti sono decisioni di lavoro (D19): stagger per
// carattere al massimo 1,2 s in ingresso e 0,4 s in uscita, indice nel gruppo
// fermo a 5. Un gruppo con link, bottoni, summary o campi declassa `ctn` a
// `still` (regola del 2026-08-04 sui bersagli nei replay).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  ROLES,
  INDEX_CAP,
  STAGGER_CAP,
  INTERACTIVE,
  demote,
  groupDelay,
  restVars,
  staggerEach,
  tweenVars,
} from "../motion/text-roles";

describe("ROLES: i valori di spec §2.2", () => {
  test("title: parole e caratteri, yPercent 50 e rotateY 90", () => {
    assert.deepEqual(ROLES.title, {
      targets: "[data-c]",
      enter: {
        from: { opacity: 0, yPercent: 50, rotateY: 90 },
        to: { opacity: 1, yPercent: 0, rotateY: 0 },
        duration: 1.2,
        stagger: 0.05,
        ease: "dtOut",
        origin: null,
      },
      exit: { to: { opacity: 0, yPercent: -50, rotateY: -90 }, duration: 0.4, stagger: 0.025, ease: "dtIn", origin: null },
    });
  });

  test("accent: rotateX 90 da 10vw, origine in basso; esce in alto verso −10vw", () => {
    assert.deepEqual(ROLES.accent, {
      targets: "[data-c]",
      enter: {
        from: { opacity: 0, rotateX: 90, x: "10vw" },
        to: { opacity: 1, rotateX: 0, x: "0vw" },
        duration: 1.2,
        stagger: 0.1,
        ease: "dtOut",
        origin: "50% 100%",
      },
      exit: { to: { opacity: 0, rotateX: -90, x: "-10vw" }, duration: 0.4, stagger: 0.05, ease: "dtIn", origin: "50% 0%" },
    });
  });

  test("lead: righe mascherate da yPercent 110, escono a −110", () => {
    assert.deepEqual(ROLES.lead, {
      targets: ".dt-line",
      enter: { from: { yPercent: 110 }, to: { yPercent: 0 }, duration: 1.2, stagger: 0.1, ease: "dtOut", origin: null },
      exit: { to: { yPercent: -110 }, duration: 0.4, stagger: 0.05, ease: "dtIn", origin: null },
    });
  });

  test("ctn e still animano il membro stesso (targets null); ctn sale di --dt-ctn-y, still solo opacità", () => {
    assert.equal(ROLES.ctn.targets, null);
    assert.equal(ROLES.still.targets, null);
    assert.deepEqual(ROLES.ctn.enter.from, { opacity: 0, y: "var(--dt-ctn-y)" });
    // "0vw", non 0: con la stessa unità della corsa GSAP non misura il layout per bersaglio (spec §9.3).
    assert.deepEqual(ROLES.ctn.enter.to, { opacity: 1, y: "0vw" });
    assert.deepEqual(ROLES.ctn.exit.to, { opacity: 0 });
    assert.deepEqual(ROLES.still.enter.from, { opacity: 0 });
    assert.deepEqual(ROLES.still.exit.to, { opacity: 0 });
    for (const r of [ROLES.ctn, ROLES.still]) {
      assert.equal(r.enter.duration, 1.2);
      assert.equal(r.enter.ease, "dtOut");
      assert.equal(r.exit.duration, 0.4);
      assert.equal(r.exit.ease, "dtIn");
      assert.equal(r.enter.stagger, 0);
      assert.equal(r.exit.stagger, 0);
    }
  });

  test("la corsa di ctn arriva a GSAP come ctnY(), non come var(): senza window vale 11.54vw", () => {
    assert.deepEqual(tweenVars("ctn", "in", 1, 0).from, { opacity: 0, y: "11.54vw" });
    assert.deepEqual(restVars("ctn", "out"), { opacity: 0, y: "11.54vw" });
    assert.deepEqual(restVars("ctn", "in"), { opacity: 1, y: "0vw" });
    assert.deepEqual(restVars("still", "out"), { opacity: 0 });
    assert.deepEqual(restVars("still", "in"), { opacity: 1 });
    assert.deepEqual(restVars("accent", "out"), { opacity: 0, rotateX: 90, x: "10vw", transformOrigin: "50% 100%" });
    assert.deepEqual(restVars("title", "in"), { opacity: 1, yPercent: 0, rotateY: 0 });
    assert.doesNotMatch(JSON.stringify([tweenVars("ctn", "in", 1, 0), restVars("ctn", "out")]), /var\(/);
  });

  test("lettere piatte: nessun ruolo porta una prospettiva (A22)", () => {
    assert.doesNotMatch(JSON.stringify(ROLES), /perspective/i);
  });
});

describe("tetti e ritardi (D19)", () => {
  test("staggerEach: fino a 25 caratteri resta lo 0,05 di Era, oltre scende", () => {
    assert.equal(staggerEach(0.05, 25, 1.2), 0.05);
    assert.ok(staggerEach(0.05, 34, 1.2) < 0.05);
    assert.equal(staggerEach(0.05, 34, 1.2), 0.036364);
    assert.equal(staggerEach(0.05, 1, 1.2), 0.05);
    assert.equal(staggerEach(0.025, 45, 0.4), 0.009091);
    assert.deepEqual(STAGGER_CAP, { in: 1.2, out: 0.4 });
  });

  test("groupDelay: 0,3 + i × 0,1 in ingresso, i × 0,05 in uscita, i fermo a 5", () => {
    assert.equal(INDEX_CAP, 5);
    assert.equal(groupDelay("ctn", 0), 0.3);
    assert.equal(groupDelay("ctn", 3), 0.6);
    assert.equal(groupDelay("title", 5), 0.8);
    assert.equal(groupDelay("title", 9), groupDelay("title", 5));
    assert.equal(groupDelay("ctn", 3, "out"), 0.15);
    assert.equal(groupDelay("ctn", 12, "out"), 0.25);
  });

  test("tweenVars: fromTo con overwrite in ingresso, to in uscita, tetti applicati", () => {
    assert.deepEqual(tweenVars("title", "in", 34, 1), {
      from: { opacity: 0, yPercent: 50, rotateY: 90 },
      to: { opacity: 1, yPercent: 0, rotateY: 0, duration: 1.2, delay: 0.4, stagger: 0.036364, ease: "dtOut", overwrite: true },
      origin: null,
    });
    assert.deepEqual(tweenVars("accent", "out", 8, 0), {
      from: null,
      to: { opacity: 0, rotateX: -90, x: "-10vw", duration: 0.4, delay: 0, stagger: 0.05, ease: "dtIn", overwrite: true },
      origin: "50% 0%",
    });
    assert.deepEqual(tweenVars("still", "out", 1, 2), {
      from: null,
      to: { opacity: 0, duration: 0.4, delay: 0.1, stagger: 0, ease: "dtIn", overwrite: true },
      origin: null,
    });
    assert.deepEqual(tweenVars("ctn", "in", 1, 3), {
      from: { opacity: 0, y: "11.54vw" },
      to: { opacity: 1, y: "0vw", duration: 1.2, delay: 0.6, stagger: 0, ease: "dtOut", overwrite: true },
      origin: null,
    });
  });
});

describe("declassamento ctn → still", () => {
  const con = { querySelector: () => ({}) } as unknown as Pick<ParentNode, "querySelector">;
  const senza = { querySelector: () => null } as unknown as Pick<ParentNode, "querySelector">;

  test("il selettore degli elementi interattivi è quello di spec §2.2", () => {
    assert.equal(INTERACTIVE, 'a[href], button, summary, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  });

  test("ctn con un interattivo diventa still; senza resta ctn; gli altri ruoli non cambiano", () => {
    assert.equal(demote("ctn", con), "still");
    assert.equal(demote("ctn", senza), "ctn");
    assert.equal(demote("title", con), "title");
    assert.equal(demote("still", con), "still");
  });
});
