// VIDEO D'AMBIENTE (spec 2026-09-13 §2.7, §3.13).
//
// Un consumatore, voluto con la coreografia piena (A18-A20 di Alberto): il drone del
// Congedo, gate unico dei video d'ambiente (soglia dei 768 px di DESIGN.md:401).
// L'acqua di Costi chiari (D25, D28) è uscita dal codice con A72 (22 set. 2026, notte:
// il capitolo è un nastro con la facciata): i suoi file restano nel repo, non montati.
// Qui si rileggono la scelta della sorgente, il gate senza GSAP (anche negli
// import indiretti del Congedo), il markup e l'uscita dell'acqua; che il video
// suoni, si fermi e riprenda lo misura e2e/ambient-video.spec.ts. I commenti
// vanno via prima di cercare, come in logo-colore.test.ts.

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
    // A44: `audio: true`, la voce di Raffaela parte da sola (o al primo gesto).
    assert.match(congedo, /useAmbientVideo\(videoRef, clipRef, \{ sources: \{ hd: ambient\.congedo\.sd, sd: ambient\.congedo\.sd \}, audio: true \}\)/);
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
  // A44 (20 set., sera): l'UNICA scrittura del tempo nel sito sta nel hook, dentro `accendi`, il
  // gestore del primo gesto che accende il suono: la clip ricomincia dalle parole di Raffaela
  // (02:00 del master). Nei componenti nessuna; nessun `autoPlay` da nessuna parte.
  test("nessuno scrive il tempo del video e nessuno parte da solo, salvo l'accensione del suono al primo gesto", () => {
    for (const f of ["app/components/Congedo.tsx", "app/components/motion/useLastra.ts"]) {
      const s = codice(f);
      assert.doesNotMatch(s, /autoPlay/, f);
      assert.doesNotMatch(s, /currentTime\s*=(?!=)/, f);
    }
    const hook = codice("app/components/motion/useAmbientVideo.ts");
    assert.doesNotMatch(hook, /autoPlay/);
    assert.equal((hook.match(/currentTime\s*=(?!=)/g) ?? []).length, 1, "una sola scrittura di currentTime nel hook");
    const accendi = /const accendi = \(\) => \{[\s\S]*?\n    \};/.exec(hook);
    assert.ok(accendi, "manca `accendi`, il gestore del primo gesto");
    assert.match(accendi![0], /v\.muted = false;\s*v\.currentTime = 0;\s*v\.play\(\)/, "la scrittura del tempo sta nel gestore del gesto, prima del play");
    // A60: chi ha tolto l'audio col comando (StoryVideo, `data-user-muted`) non se lo vede riaccendere dal gesto.
    assert.match(accendi![0], /if \(!allowed\(\) \|\| !inView \|\| zittito\(\)\) return;/, "fuori vista, o zittito, il gesto non fa partire niente");
    assert.doesNotMatch(codice("app/components/motion/useLastra.ts"), /video\.pause\(\)|video\.play\(\)/, "la lastra non comanda il loop");
  });

  test("il suono (A44): prova non muto solo in vista, ricorda il rifiuto, si arma sul primo gesto e si disarma allo smontaggio", () => {
    const hook = codice("app/components/motion/useAmbientVideo.ts");
    assert.match(hook, /audio\?: boolean;/);
    assert.match(hook, /const audio = o\.audio === true;/);
    assert.match(hook, /if \(audio && !negato && v\.muted && !zittito\(\)\) \{\s*v\.muted = false;\s*v\.play\(\)/, "prova col suono solo se chiesto, non ancora negato, ancora muto e non zittito dall'utente (A60)");
    assert.match(hook, /negato = true;\s*v\.muted = true;\s*v\.play\(\)\.catch\(markStill\);\s*arma\(\);/, "al rifiuto: muto, riparte, arma il gesto");
    assert.match(hook, /const GESTI = \["pointerdown", "keydown"\] as const;/);
    assert.match(hook, /window\.addEventListener\(t, accendi, \{ capture: true, passive: true \}\)/);
    assert.match(hook, /return \(\) => \{\s*disarma\(\);/, "lo smontaggio disarma il gesto");
    assert.match(hook, /\.name === "AbortError"\) return;/, "la pausa nostra non è un rifiuto");
    assert.match(hook, /if \(inView\) \{\s*suona\(\);/);
  });

  test("il markup del video del Congedo", () => {
    for (const f of ["app/components/Congedo.tsx"]) {
      assert.match(
        codice(f),
        /<video[\s\S]*?\bmuted\b[\s\S]*?\bloop\b[\s\S]*?\bplaysInline\b[\s\S]*?preload="none"[\s\S]*?\bdisablePictureInPicture\b[\s\S]*?\bdisableRemotePlayback\b[\s\S]*?\baria-hidden\b[\s\S]*?tabIndex=\{-1\}/,
        f,
      );
    }
  });

  // A72 (22 set. 2026, notte; Alberto: «togliamo il video della piscina, e mettiamo un'altra immagine
  // no-bg alta … ed entra la sezione di Carmine e Seguici»): l'acqua è uscita dal codice — nessun
  // consumatore, nessuna voce in media.ts, nessun <video> in Costi chiari — e i suoi file restano nel
  // repo (Alberto, 22 set.: i file non montati restano). Il capitolo 12 è il nastro (costi.test.ts).
  test("l'acqua è uscita dal codice con A72: nessun consumatore, i file restano nel repo", () => {
    assert.match(codice("app/page.tsx"), /<CostiChiari nastro \/>/);
    assert.doesNotMatch(codice("app/page.tsx"), /<CostiChiari[^>]*\bacqua\b/);
    assert.doesNotMatch(codice("app/vendi/VendiContent.tsx"), /<CostiChiari[^>]*\b(acqua|nastro)\b/);
    const costi = codice("app/components/CostiChiari.tsx");
    for (const morto of ["useAmbientVideo", "<video", "data-acqua-band", "ambient.acqua", "IntersectionObserver", "clipClosed", "clipOpen"]) {
      assert.ok(!costi.includes(morto), `${morto} è ancora in CostiChiari.tsx`);
    }
    assert.doesNotMatch(codice("app/lib/media.ts"), /\bacqua\b/);
    assert.deepEqual(Object.keys(ambient), ["congedo"]);
    assert.equal((codice("app/components/motion/useAmbientVideo.ts").match(/\bacqua\b/g) ?? []).length, 0);
    for (const p of ["/media/acqua-1080.webm", "/media/acqua-1080.mp4", "/media/acqua-poster.jpg"]) {
      assert.ok(existsSync(join(ROOT, "public", p)), `manca public${p}: i file dell'acqua restano nel repo (A72)`);
    }
    // La firma del capitolo 12 non è più l'acqua a tempo: è il nastro (D18).
    const s = chapters.costi.signature;
    assert.equal(s.ease, "dtTappe");
    assert.deepEqual(s.time, { scrub: true });
    assert.ok("st" in s.trigger && s.trigger.st[0] === "top+=arrivo top");
  });

  test("i file che i consumatori chiedono esistono", () => {
    for (const p of [ambient.congedo.hd.webm, ambient.congedo.hd.mp4, ambient.congedo.sd.webm, ambient.congedo.sd.mp4, ambient.congedo.poster]) {
      assert.ok(existsSync(join(ROOT, "public", p)), `manca public${p}`);
    }
  });
});
