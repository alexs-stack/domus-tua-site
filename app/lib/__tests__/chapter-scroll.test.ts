// Lo scroll torna al capitolo alla ricarica (D22).
//
// Oggi app/lib/motion/chapter-scroll.ts è la parte pura: quale capitolo è in
// vista, cosa si salva in LAST_Y_KEY al pagehide, dove si torna alla
// ricarica. Il DOM lo tocca Preloader.tsx.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseLastY, pickChapter, restoreTarget, snapshot } from "../motion/chapter-scroll";

const TOPS = [
  { id: "top", top: 0 },
  { id: "perche-domus-tua", top: 3000 },
  { id: "storia", top: 3400 },
  { id: "recensioni", top: 8100 },
  { id: "servizi", top: 15000 },
];

describe("chapter-scroll", () => {
  test("il capitolo in vista è l'ultimo cominciato sopra y, il più interno a parità", () => {
    assert.equal(pickChapter(TOPS, 0)?.id, "top");
    assert.equal(pickChapter(TOPS, 3500)?.id, "storia");
    assert.equal(pickChapter(TOPS, 15600)?.id, "servizi");
    assert.equal(pickChapter([{ id: "a", top: 100 }, { id: "b", top: 100 }], 100)?.id, "b");
    assert.equal(pickChapter([], 10), null);
  });

  test("snapshot: percorso, y, capitolo e scarto dentro il capitolo", () => {
    assert.deepEqual(snapshot("/", 15600, TOPS), { p: "/", y: 15600, id: "servizi", dy: 600 });
    assert.deepEqual(snapshot("/vendi", 12, []), { p: "/vendi", y: 12, id: "", dy: 12 });
  });

  test("parseLastY scarta ciò che non è suo", () => {
    assert.equal(parseLastY(null), null);
    assert.equal(parseLastY("{"), null);
    assert.equal(parseLastY('{"p":"/","y":"10","id":"x","dy":0}'), null);
    assert.equal(parseLastY('{"y":10,"id":"x","dy":0}'), null);
    assert.deepEqual(parseLastY('{"p":"/","y":10,"id":"x","dy":2}'), { p: "/", y: 10, id: "x", dy: 2 });
  });

  test("restoreTarget: solo alla ricarica, sulla stessa rotta, senza ancora, dentro il documento", () => {
    const saved = { p: "/", y: 15600, id: "servizi", dy: 600 };
    const ctx = { pathname: "/", hash: "", navigation: "reload", tops: [{ id: "servizi", top: 15200 }], maxY: 40000 };
    assert.equal(restoreTarget(saved, ctx), 15800);
    assert.equal(restoreTarget(saved, { ...ctx, navigation: "navigate" }), null);
    assert.equal(restoreTarget(saved, { ...ctx, navigation: "back_forward" }), null);
    assert.equal(restoreTarget(saved, { ...ctx, hash: "#contatti" }), null);
    assert.equal(restoreTarget(saved, { ...ctx, pathname: "/vendi" }), null);
    assert.equal(restoreTarget(saved, { ...ctx, tops: [] }), 15600);
    assert.equal(restoreTarget(saved, { ...ctx, maxY: 15000 }), 15000);
    assert.equal(restoreTarget(null, ctx), null);
  });
});
