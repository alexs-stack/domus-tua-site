// LA CARTOLINA DEL CONGEDO.
//
// A19 e A20 di Alberto (13 set.), spec 2026-09-13 §3.18 e §9.1. Da 1024 px e
// 640 px d'altezza con motion ok la banda finale è uno schermo sticky alto
// 100svh su un corridoio di 80svh: il video si ritira in `inset(8% 22%)` e il
// footer sale crescendo da 0,75 a 1. Sotto 1024 la banda non è sticky e si
// ritira in `inset(4% 14%)` da 768 e in `inset(4% 10%)` sotto (D29). Il test
// rilegge i sorgenti: nessuno zoom sul video (il loop è tagliato alla codifica,
// senza il logo), nessun ritaglio sull'antenato dello sticky, la rete di
// tastiera solo col fuoco visibile, il footer agganciato solo in home.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { clipSides, assertStraight } from "../motion/clip";
import { chapters } from "../motion/chapters";
import { ambient } from "../media";

const ROOT = process.cwd();

/* Commenti via prima di cercare, come `soloCodice` di logo-colore.test.ts. */
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const congedo = soloCodice(read("app/components/Congedo.tsx"));
const footer = soloCodice(read("app/components/Footer.tsx"));
const css = read("app/globals.css");
const gsapTs = read("app/lib/motion/gsap.ts");

function tsx(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) tsx(p, out);
    else if (nome.endsWith(".tsx")) out.push(p);
  }
  return out;
}

type Firma = { ease: string; time: { scrub?: number | true }; trigger: { st?: [string, string] } };

describe("clipSides: quattro lati a spigolo vivo (C01)", () => {
  test("scrive sempre quattro percentuali", () => {
    assert.equal(clipSides(8, 22, 8, 22), "inset(8% 22% 8% 22%)");
    assert.equal(clipSides(0, 0, 0, 0), "inset(0% 0% 0% 0%)");
    assert.equal(clipSides(4.25, 10, 4, 10), "inset(4.25% 10% 4% 10%)");
  });
  test("passa assertStraight", () => {
    assert.doesNotThrow(() => assertStraight(clipSides(8, 22, 8, 22)));
  });
});

describe("la firma del capitolo 17", () => {
  test("dtCartolina è registrata una per riga con la curva di §3.1", () => {
    assert.match(gsapTs, /CustomEase\.create\("dtCartolina", "0\.45,0,0\.15,1"\);/);
  });
  test("registro: scrub 0,9 e fine clamp(top 40%); il ramo del telefono usa lo stesso scrub", () => {
    const c = (Object.values(chapters) as Array<{ signature: Firma }>).find((ch) => ch.signature.ease === "dtCartolina");
    assert.ok(c, "nessun capitolo con ease dtCartolina in chapters.ts");
    assert.equal(c!.signature.time.scrub, 0.9);
    assert.match(c!.signature.trigger.st![1], /clamp\(top 40%\)/);
    assert.ok(congedo.includes(`scrub: ${c!.signature.time.scrub}`));
  });
});

describe("Congedo.tsx", () => {
  test("niente zoom 1,14, niente autoPlay, currentTime mai scritto", () => {
    assert.doesNotMatch(congedo, /scale-\[1\.14\]|\b1\.14\b/);
    assert.doesNotMatch(congedo, /autoPlay/);
    assert.doesNotMatch(congedo, /currentTime\s*=/);
  });
  test("la section non ritaglia: lo sticky si aggancia", () => {
    const m = /<section\b[^>]*className="([^"]*)"/.exec(congedo);
    assert.ok(m, "section senza className");
    assert.doesNotMatch(m![1], /overflow-(hidden|auto|scroll)/);
  });
  test("il markup del corridoio esiste in SSR", () => {
    for (const s of [
      'data-corridor="cartolina"',
      'data-stick="top"',
      "data-corridor-screen",
      "data-corridor-run",
      "data-postcard-clip",
      'data-bg="foto"',
      'id="congedo-title"',
    ]) {
      assert.ok(congedo.includes(s), `manca ${s}`);
    }
  });
  test("useCorridor con id, stick, endTrigger ed end di §3.18", () => {
    assert.match(congedo, /useCorridor\(sectionRef,/);
    assert.match(congedo, /id:\s*"cartolina"/);
    assert.match(congedo, /stick:\s*"top"/);
    assert.match(congedo, /endTrigger:\s*footerRef/);
    assert.match(congedo, /end:\s*"clamp\(top 40%\)"/);
  });
  test("i ritiri di §3.18 e l'ingresso del footer a 0,545", () => {
    assert.match(congedo, /\{ t: 8, r: 22, b: 8, l: 22 \}/);
    assert.match(congedo, /\{ t: 4, r: 14, b: 4, l: 14 \}/);
    assert.match(congedo, /\{ t: 4, r: 10, b: 4, l: 10 \}/);
    assert.match(congedo, /FOOT_AT = 0\.545/);
    assert.match(congedo, /duration:\s*0\.54\b/);
    assert.match(congedo, /duration:\s*0\.85\b/);
  });
  test("la rete di tastiera scatta solo col fuoco visibile (A19 di Alberto; correzione bloccante 3 di homeC)", () => {
    assert.match(congedo, /matches\(":focus-visible"\)/);
  });
  test("alla ricarica il footer si decide sulla quota d'arrivo del Preloader (D22)", () => {
    assert.match(congedo, /getEntriesByType\("navigation"\)/);
    assert.match(congedo, /ScrollTrigger\.addEventListener\("refresh", onRefresh\)/);
    assert.match(congedo, /if \(armed && inView\(\)\) armFooter\(s, footer, tl, at, trigger, start, false\);/);
  });
  // Spec §3.18: col clip-path in corsa la 1080p supera il tetto di paint, quindi
  // la 720p sta su tutt'e due le chiavi (misure/17-paint.mjs).
  test("video d'ambiente sul ritaglio, 720p forzata", () => {
    assert.match(congedo, /useAmbientVideo\(videoRef, clipRef, \{ sources: \{ hd: ambient\.congedo\.sd, sd: ambient\.congedo\.sd \} \}\)/);
  });
  test("sizes del poster: la resa al taglio più stretto di ogni larghezza", () => {
    assert.ok(congedo.includes('"(max-width: 767px) 270vw, (max-width: 1023px) 166vw, 134vw"'));
  });
  test("il titolo è un h2 a peso 500 (globals.css:318-322): la crenatura legge display-500", () => {
    assert.match(congedo, /font="display-500"/);
    assert.doesNotMatch(congedo, /font="display-400"/);
  });
  test("la CTA è un blocco con un link: ruolo still, solo opacità (spec §2.2)", () => {
    assert.match(congedo, /<Reveal role="still">\s*<Cta/);
  });
  test("footer: stato armato a parte e tween con immediateRender false (spec §3.18)", () => {
    assert.match(congedo, /gsap\.set\(footer, \{ scale: 0\.75, opacity: 0, transformOrigin: "50% 0%" \}\)/);
    assert.match(congedo, /immediateRender: false/);
    assert.doesNotMatch(congedo, /immediateRender: true/);
    assert.match(congedo, /gsap\.context\(/);
  });
});

describe("il footer della cartolina", () => {
  test("Footer scrive data-postcard-foot solo con postcard", () => {
    assert.match(footer, /postcard = false/);
    assert.match(footer, /data-postcard-foot=\{postcard \? "" : undefined\}/);
  });
  test("solo app/page.tsx passa postcard", () => {
    const chi = tsx(join(ROOT, "app"))
      .filter((p) => /<Footer\b[^>]*\bpostcard\b/.test(soloCodice(readFileSync(p, "utf8"))))
      .map((p) => relative(ROOT, p).split(sep).join("/"));
    assert.deepEqual(chi, ["app/page.tsx"]);
  });
  test("globals.css: corsa di 80svh e footer agganciato solo sotto la soglia dei corridoi", () => {
    assert.match(css, /\[data-corridor="cartolina"\]\s*\{[^}]*--corridor-run:\s*80svh/);
    const i = css.indexOf('main:has([data-corridor="cartolina"]) + footer[data-postcard-foot]');
    assert.notEqual(i, -1, "manca la regola del footer");
    const media = css.lastIndexOf("@media", i);
    assert.match(
      css.slice(media, i),
      /\(min-width:\s*1024px\)\s*and\s*\(min-height:\s*640px\)\s*and\s*\(prefers-reduced-motion:\s*no-preference\)/,
    );
    assert.match(css.slice(i, i + 220), /margin-top:\s*-8svh/);
  });
});

describe("i file del loop del Congedo", () => {
  test("hd, sd e poster esistono in public/", () => {
    const c = ambient.congedo;
    for (const p of [c.hd.mp4, c.hd.webm, c.sd.mp4, c.sd.webm, c.poster]) {
      assert.ok(existsSync(join(ROOT, "public", p)), `manca public${p}`);
    }
  });
});
