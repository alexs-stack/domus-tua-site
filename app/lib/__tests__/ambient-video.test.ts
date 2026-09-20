// VIDEO D'AMBIENTE (spec 2026-09-13 §2.7, §3.13).
//
// Due consumatori, voluti con la coreografia piena (A18-A20 di Alberto): l'acqua
// di Costi chiari, solo in home (D25, D28), e il drone del Congedo, gate unico
// dei video d'ambiente (soglia dei 768 px di DESIGN.md:401).
// Qui si rileggono la scelta della sorgente, il gate senza GSAP (anche negli
// import indiretti del Congedo), la firma dell'acqua letta da chapters.ts e il
// markup; che il video suoni, si fermi e riprenda lo misura
// e2e/ambient-video.spec.ts. I commenti vanno via prima di cercare, come in
// logo-colore.test.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { AMBIENT_SD_MAX_PX, pickAmbientSource, renderedWidth } from "../motion/ambient";
import { ambient } from "../media";
import { chapters } from "../motion/chapters";
import { MQ } from "../motion/mq";

const ROOT = process.cwd();
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const codice = (p: string) => soloCodice(readFileSync(join(ROOT, p), "utf8"));

const hd = { webm: "/media/x-1080.webm", mp4: "/media/x-1080.mp4" };
const sd = { webm: "/media/x-720.webm", mp4: "/media/x-720.mp4" };

describe("la scelta della sorgente (spec §2.7)", () => {
  test("larghezza resa di un 16:9 in object-cover = max(boxW, boxH × 16/9) × dpr", () => {
    assert.equal(renderedWidth(1366, 768, 1), 1366);
    assert.equal(renderedWidth(1440, 900, 1), 1600);
    assert.ok(Math.abs(renderedWidth(768, 1024, 2) - 3640.89) < 0.01);
  });

  test("fino a 1.408 px resi la sd, oltre la hd; senza sd sempre la hd; WebM se il browser lo dà per certo", () => {
    assert.equal(AMBIENT_SD_MAX_PX, 1408);
    assert.equal(pickAmbientSource({ hd, sd }, { w: 1366, h: 768, dpr: 1, webm: true }), sd.webm);
    assert.equal(pickAmbientSource({ hd, sd }, { w: 1408, h: 792, dpr: 1, webm: false }), sd.mp4);
    assert.equal(pickAmbientSource({ hd, sd }, { w: 1440, h: 900, dpr: 1, webm: true }), hd.webm);
    assert.equal(pickAmbientSource({ hd, sd }, { w: 768, h: 432, dpr: 2, webm: false }), hd.mp4);
    assert.equal(pickAmbientSource({ hd }, { w: 800, h: 450, dpr: 1, webm: true }), hd.webm);
  });
});

describe("il gate e i consumatori", () => {
  test("useAmbientVideo non importa GSAP e legge MQ da mq.ts", () => {
    const hook = codice("app/components/motion/useAmbientVideo.ts");
    assert.doesNotMatch(hook, /from\s+["'][^"']*gsap[^"']*["']/);
    assert.match(hook, /from "\.\.\/\.\.\/lib\/motion\/mq"/);
    assert.match(hook, /saveData !== true/);
    assert.match(hook, /visibilityState === "visible"/);
    assert.equal(MQ.desktop, "(min-width: 768px)");
  });

  test("il Congedo passa a useAmbientVideo sul ritaglio della cartolina, senza pin e senza gate a mano", () => {
    const congedo = codice("app/components/Congedo.tsx");
    // Spec 2026-09-13 §3.18 (A19 e A20 di Alberto): l'host del video è il ritaglio [data-postcard-clip].
    assert.doesNotMatch(congedo, /\bpin\s*:/);
    assert.match(congedo, /useAmbientVideo\(videoRef, clipRef, \{ sources: \{ hd: ambient\.congedo\.sd, sd: ambient\.congedo\.sd \} \}\)/);
    assert.doesNotMatch(congedo, /IntersectionObserver/);
    assert.doesNotMatch(congedo, /<source\b/);
  });

  // Spec §2.6: il gate dei video d'ambiente non tira dentro GSAP, nemmeno per via
  // indiretta (mq.ts, ambient.ts). Il Congedo importa GSAP per la cartolina
  // (spec §3.18, A19 e A20 di Alberto): la visita parte dal hook, che è il modulo
  // su cui la regola è ancora vera. Così cade anche l'eccezione D61 sull'arco
  // LocaleProvider → gsap.ts: da qui il provider della lingua non si raggiunge.
  test("nessun modulo raggiunto dagli import di useAmbientVideo importa GSAP", () => {
    const partenza = "app/components/motion/useAmbientVideo.ts";
    const catene = new Map<string, string[]>([[partenza, [partenza]]]);
    const coda = [partenza];
    while (coda.length > 0) {
      const file = coda.shift()!;
      const catena = catene.get(file)!;
      for (const [, spec] of codice(file).matchAll(/(?:\bfrom|\bimport)\s+["']([^"']+)["']/g)) {
        assert.doesNotMatch(spec, /^(gsap|@gsap\/react)(\/|$)/, `${catena.join(" → ")} importa ${spec}`);
        const base = spec.startsWith(".") ? join(dirname(file), spec) : spec.startsWith("@/") ? spec.slice(2) : null;
        if (base === null) continue;
        const rel = base.split(sep).join("/");
        const trovato = [rel, `${rel}.ts`, `${rel}.tsx`, `${rel}/index.ts`, `${rel}/index.tsx`].find(
          (p) => /\.tsx?$/.test(p) && existsSync(join(ROOT, p)),
        );
        if (!trovato) continue;
        assert.notEqual(trovato, "app/lib/motion/gsap.ts", `${[...catena, trovato].join(" → ")}: il hook arriva a gsap.ts`);
        if (!catene.has(trovato)) {
          catene.set(trovato, [...catena, trovato]);
          coda.push(trovato);
        }
      }
    }
    // La visita deve essere arrivata alle soglie e alla scelta della sorgente, altrimenti non ha provato nulla.
    assert.ok(catene.has("app/lib/motion/mq.ts"), "la visita non ha raggiunto mq.ts");
    assert.ok(catene.has("app/lib/motion/ambient.ts"), "la visita non ha raggiunto ambient.ts");
  });

  // A35: anche la lastra del Congedo (useLastra.ts) non scrive il tempo né ferma il loop: il video
  // parte in vista come sempre e il foglio piega quel che c'è (Alberto, 20 set.).
  test("nessuno scrive il tempo del video e nessuno parte da solo", () => {
    for (const f of ["app/components/Congedo.tsx", "app/components/CostiChiari.tsx", "app/components/motion/useAmbientVideo.ts", "app/components/motion/useLastra.ts"]) {
      const s = codice(f);
      assert.doesNotMatch(s, /autoPlay/, f);
      assert.doesNotMatch(s, /currentTime\s*=(?!=)/, f);
    }
    assert.doesNotMatch(codice("app/components/motion/useLastra.ts"), /video\.pause\(\)|video\.play\(\)/, "la lastra non comanda il loop");
  });

  test("il markup dei due video", () => {
    for (const f of ["app/components/Congedo.tsx", "app/components/CostiChiari.tsx"]) {
      assert.match(
        codice(f),
        /<video[\s\S]*?\bmuted\b[\s\S]*?\bloop\b[\s\S]*?\bplaysInline\b[\s\S]*?preload="none"[\s\S]*?\bdisablePictureInPicture\b[\s\S]*?\bdisableRemotePlayback\b[\s\S]*?\baria-hidden\b[\s\S]*?tabIndex=\{-1\}/,
        f,
      );
    }
  });

  test("l'acqua solo in home (D28), con la firma del capitolo 12 e la banda della spec", () => {
    assert.match(codice("app/page.tsx"), /<CostiChiari acqua \/>/);
    assert.doesNotMatch(codice("app/vendi/VendiContent.tsx"), /<CostiChiari[^>]*\bacqua\b/);
    const s = chapters.costi.signature;
    assert.equal(s.ease, "expo.out");
    assert.deepEqual(s.time, { dur: 1.8, delay: 0 });
    assert.deepEqual(s.trigger, { io: { rootMargin: "0px 0px -20% 0px", threshold: 0 } });
    assert.deepEqual(
      (chapters.costi.secondary ?? []).map((t) => [t.ease, t.note]),
      [["sine.in", "uscita 0,7 s"]],
    );
    const costi = codice("app/components/CostiChiari.tsx");
    // Firma e uscita lette dal registro, non riscritte: se chapters.ts cambia, il gesto lo segue (D18).
    assert.match(costi, /chapters\.costi\.signature/);
    assert.match(costi, /chapters\.costi\.secondary/);
    assert.doesNotMatch(costi, /rootMargin:\s*["']/);
    assert.doesNotMatch(costi, /["'](expo\.out|sine\.in)["']/);
    assert.doesNotMatch(costi, /duration:\s*(1\.8|0\.7)\b/);
    // La rete vale solo finché l'IntersectionObserver non ha deciso; il primo avviso ammette l'ingresso.
    assert.match(costi, /if \(!deciso && !aperta && r\.top < window\.innerHeight && r\.bottom > 0\)/);
    assert.equal((costi.match(/deciso = true;\s*window\.clearTimeout\(rete\);/g) ?? []).length, 2);
    assert.doesNotMatch(costi, /if \(primo\) \{/);
    assert.match(costi, /useAmbientVideo\(videoRef, bandRef, \{ sources: \{ hd: ambient\.acqua\.hd \} \}\)/);
    assert.match(costi, /data-acqua-band data-bg="foto" className="dt-media-full"/);
    assert.match(costi, /sizes="\(max-width: 767px\) 90vw, 84vw"/);
    assert.match(costi, /mt-\[clamp\(2\.5rem,7vh,5rem\)\]/);
  });

  test("i file che i consumatori chiedono esistono", () => {
    for (const p of [
      ambient.acqua.hd.webm, ambient.acqua.hd.mp4, ambient.acqua.poster,
      ambient.congedo.hd.webm, ambient.congedo.hd.mp4, ambient.congedo.sd.webm, ambient.congedo.sd.mp4,
    ]) {
      assert.ok(existsSync(join(ROOT, "public", p)), `manca public${p}`);
    }
  });
});
