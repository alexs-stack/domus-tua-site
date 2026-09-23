// LA CARTOLINA DEL CONGEDO E L'ENTRATA ALLA LUSION.
//
// A19 e A20 di Alberto (13 set.), spec 2026-09-13 §3.18 e §9.1; A35 (19-20 set.,
// qualita/a35/direttive-video-entrata.md). Da 1024 px e 640 px d'altezza con
// motion ok il video finale è uno schermo sticky intero (100vw × 100svh) su un
// corridoio di 135svh (100 − 65 + 20 + 80): prima l'entrata — il video cresce
// dallo slot a destra del titolo piegandosi come un foglio, lineare su 100svh,
// con l'anticipo di 65svh sull'aggancio (A42) — poi la cartolina di sempre: il
// video si ritira in `inset(8% 22%)` e il footer sale crescendo da 0,75 a 1. La
// testa (h2 e comando) sta in flusso sopra lo schermo, lo slot a destra: niente
// lettere sulla fotografia (D108, D111). Sotto 1024 la banda non è
// sticky, nessuna entrata, e si ritira in `inset(4% 14%)` da 768 e in
// `inset(4% 10%)` sotto (D29). Il test rilegge i sorgenti: nessuno zoom sul
// video (il loop è tagliato alla codifica, senza il logo), nessun ritaglio
// sull'antenato dello sticky, la rete di tastiera solo col fuoco visibile, il
// footer agganciato solo in home.
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
// CRLF in LF: su Windows il checkout può avere i CRLF (core.autocrlf), e senza il "\n}\n" il blocco
// dell'entrata qui sotto correrebbe fino in fondo al file, e le regole fuori dalla media query passerebbero.
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
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
    // A49 (22 set. 2026, sera): anche l'hero ha dtCartolina come firma (la chiusura in cartolina è il motivo
    // comune d'uscita, D-A49-6): il capitolo 17 si prende per nome.
    const c = chapters.cartolina as unknown as { signature: Firma };
    assert.ok(c, "nessun capitolo cartolina in chapters.ts");
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
  test("useCorridor con id, stick, endTrigger ed end di §3.18; lo start con l'anticipo di A35 sulla testa in flusso", () => {
    assert.match(congedo, /useCorridor\(sectionRef,/);
    assert.match(congedo, /id:\s*"cartolina"/);
    assert.match(congedo, /stick:\s*"top"/);
    assert.match(congedo, /endTrigger:\s*footerRef/);
    assert.match(congedo, /end:\s*"clamp\(top 40%\)"/);
    // L'anticipo si misura sull'altezza della testa in flusso, mai su offsetTop dello sticky.
    assert.match(
      congedo,
      /start:\s*\(\)\s*=>\s*`top\+=\$\{\(testaRef\.current\?\.offsetHeight \?\? 0\) - window\.innerHeight \* \(CORSA_SVH \/ 100\) \* ANTICIPO\} top`/,
    );
    assert.doesNotMatch(congedo, /screenRef\.current\??\.offsetTop/);
  });
  test("i ritiri di §3.18 e i numeri della cartolina (0,54 · 0,85 · 0,545 su 132svh) riportati sulla timeline di 242svh (A35)", () => {
    assert.match(congedo, /\{ t: 8, r: 22, b: 8, l: 22 \}/);
    assert.match(congedo, /\{ t: 4, r: 14, b: 4, l: 14 \}/);
    assert.match(congedo, /\{ t: 4, r: 10, b: 4, l: 10 \}/);
    assert.match(congedo, /TL_SVH = 100 \+ CORSA_SVH \+ PIAN_SVH \+ CART_RUN_SVH - 8 - 40/);
    assert.match(congedo, /CART_SVH = 100 \+ CART_RUN_SVH - 8 - 40/);
    assert.match(congedo, /B_CART = 0\.54\b/);
    assert.match(congedo, /S_CART = 0\.85\b/);
    assert.match(congedo, /FOOT_AT_CART = 0\.545/);
    assert.match(congedo, /DUR_B = \(B_CART \* CART_SVH\) \/ TL_SVH/);
    assert.match(congedo, /DUR_S = \(S_CART \* CART_SVH\) \/ TL_SVH/);
    assert.match(congedo, /FOOT_AT = \(CORSA_SVH \+ PIAN_SVH \+ FOOT_AT_CART \* CART_SVH\) \/ TL_SVH/);
    assert.match(congedo, /duration:\s*DUR_B\b/);
    assert.match(congedo, /duration:\s*DUR_S\b/);
  });
  test("l'entrata (A35): il tratto `e` lineare è il primo della timeline e passa per il ponte della lastra", () => {
    assert.match(congedo, /useLastra\(\{ sectionRef, screenRef, slotRef, clipRef, markerRef, videoRef, eRef \}, lastraRef\)/);
    // Dopo un refresh di ScrollTrigger la lastra rilegge e dal progresso vero della timeline.
    assert.match(congedo, /eRef\.current = \(\) => Math\.min\(1, Math\.max\(0, tl\.progress\(\) \/ E_UNO\)\)/);
    const lastra = soloCodice(read("app/components/motion/useLastra.ts"));
    assert.match(lastra, /if \(inRefresh\) return;/);
    assert.match(lastra, /ScrollTrigger\.addEventListener\("refresh", onRefresh\)/);
    assert.match(lastra, /if \(eRef\) S\.e = eRef\.current\(\);/);
    assert.match(congedo, /E_UNO = CORSA_SVH \/ TL_SVH/);
    assert.match(congedo, /CART_AT = \(CORSA_SVH \+ PIAN_SVH\) \/ TL_SVH/);
    const e = /tl\.fromTo\(pr, \{ e: 0 \}, \{ e: 1, duration: E_UNO, ease: "none", onUpdate: \(\) => lastraRef\.current\.set\(pr\.e\) \}, 0\)/.exec(congedo);
    assert.ok(e, "manca il tratto e 0→1 lineare");
    const b = congedo.indexOf("duration: DUR_B");
    assert.ok(b > e!.index, "la cartolina deve venire dopo l'entrata");
    assert.match(congedo, /\}, CART_AT\)/);
  });
  test("la testa in flusso sopra lo schermo: h2 e comando a sinistra, lo slot della miniatura a destra; niente lettere sulla fotografia (D108, D111, A42)", () => {
    const testa = congedo.indexOf("dt-postcard_testa");
    const screen = congedo.indexOf("data-corridor-screen");
    const slot = congedo.indexOf("dt-postcard_slot");
    const title = congedo.indexOf('id="congedo-title"');
    const cta = congedo.indexOf("<Cta");
    assert.ok(testa > 0 && screen > 0 && slot > 0 && title > 0 && cta > 0);
    assert.ok(title > testa && title < screen, "l'h2 sta nella testa, prima dello schermo");
    assert.ok(cta > title && cta < slot && slot < screen, "dopo l'h2 il comando, poi lo slot, poi lo schermo");
    assert.match(congedo, /ref=\{slotRef\} className="dt-postcard_slot" aria-hidden/);
    assert.ok(!/<(h[1-6]|p|a|button)\b[\s\S]*?data-postcard-clip/.test(congedo.slice(screen)), "testo dentro lo schermo");
    assert.doesNotMatch(congedo, /dt-postcard_copy|dt-postcard_banda|dt-postcard_fascia/);
    assert.doesNotMatch(congedo, /ghost-dark/);
    assert.doesNotMatch(congedo, /text-white/);
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
  test("video d'ambiente sul ritaglio, 720p forzata, con la voce (A44)", () => {
    assert.match(congedo, /useAmbientVideo\(videoRef, clipRef, \{ sources: \{ hd: ambient\.congedo\.sd, sd: ambient\.congedo\.sd \}, audio: true \}\)/);
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
  test("globals.css: corsa di 135svh (100 − 65 + 20 + 80, A35/A42) e footer agganciato solo sotto la soglia dei corridoi", () => {
    assert.match(css, /\[data-corridor="cartolina"\]\s*\{[^}]*--corridor-run:\s*135svh/);
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

describe("il CSS dell'entrata (A35, A42)", () => {
  const mq = css.indexOf('[data-corridor="cartolina"] .dt-postcard_testa {');
  const blocco = css.slice(css.lastIndexOf("@media", mq), css.indexOf("\n}\n", mq));
  test("la testa a due colonne, lo slot, lo schermo intero senza ritaglio e la lastra fixed vivono solo nella media query dei corridoi", () => {
    assert.notEqual(mq, -1, "manca la testa a due colonne");
    assert.match(blocco, /\(min-width:\s*1024px\)\s*and\s*\(min-height:\s*640px\)\s*and\s*\(prefers-reduced-motion:\s*no-preference\)/);
    assert.match(blocco, /\.dt-postcard_testa\s*\{[^}]*grid-template-columns:\s*1fr 1fr/);
    assert.match(blocco, /\.dt-postcard_slot\s*\{[^}]*width:\s*min\(42vw, 640px\)/);
    assert.match(blocco, /\.dt-postcard_slot\s*\{[^}]*aspect-ratio:\s*16 \/ 9/);
    assert.match(blocco, /\[data-stick="top"\] > \[data-corridor-screen\]\s*\{[^}]*overflow:\s*visible/);
    assert.match(blocco, /\.dt-lastra\s*\{[^}]*position:\s*fixed/);
    assert.match(blocco, /\.dt-lastra\s*\{[^}]*pointer-events:\s*none/);
    // Fuori dalla media query lo slot non esiste.
    assert.match(css, /\n\.dt-postcard_slot\s*\{\s*display:\s*none;\s*\}/);
  });
  test("in via gl il ritaglio DOM è nascosto finché la lastra disegna; a distesa si nasconde il canvas; in via scala l'origine è 0 0", () => {
    assert.match(blocco, /\[data-entrata-via="gl"\]:not\(\[data-entrata="distesa"\]\) \[data-postcard-clip\]\s*\{\s*visibility:\s*hidden/);
    assert.match(blocco, /\[data-entrata="distesa"\] \.dt-lastra\s*\{\s*visibility:\s*hidden/);
    assert.match(blocco, /\[data-entrata-via="scala"\] \[data-postcard-clip\]\s*\{\s*transform-origin:\s*0 0/);
    assert.match(blocco, /\[data-bg\]\[data-foglio\]\s*\{[^}]*width:\s*1px;\s*height:\s*1px;\s*transform-origin:\s*0 0/);
  });
  test("nessun testo nascosto: la testa non ha visibility hidden sotto un attributo scritto da JS (2.4.11)", () => {
    assert.doesNotMatch(blocco, /\.dt-postcard_testa[^{]*\{[^}]*visibility/);
    assert.doesNotMatch(css, /dt-postcard_copy|dt-postcard_banda|dt-postcard_fascia/);
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
