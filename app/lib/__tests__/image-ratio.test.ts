// LE MISURE DICHIARATE A <Image> SONO QUELLE DEL FILE.
//
// Chi l'ha chiesto. Audit del 21 settembre 2026 (blocco 23, rifinitura dopo le foto
// alte), difetto V05: su /lavora-con-noi CareerApplication dichiarava width 480 e
// height 640 su team-trio.jpg, che sul disco è 1920×1280 (3:2). next/image scrive
// `aspect-ratio: auto 480 / 640` sul segnaposto: il rettangolo riservato è verticale,
// la foto arriva orizzontale, e al decode tutto ciò che sta sotto risale di 192 px
// (CLS misurato). La regola del progetto è «la pagina è completa e ferma» (spec §9,
// nessun salto di layout): il segnaposto deve avere il rapporto della foto.
//
// Com'è fatto. Si leggono i sorgenti .tsx di app/, si prende ogni tag <Image …> con
// `src` letterale in public/ e width/height numerici, e si confronta w/h con il
// rapporto del file letto da sharp: la differenza ammessa è l'1 %. Restano fuori gli
// SVG (vettoriali: il browser li impagina nel rettangolo dichiarato senza salto) e i
// `src` variabili (copertine YouTube, foto dei consulenti: il rapporto lo dà il dato,
// non il codice).

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const PUB = join(ROOT, "public");

function sorgenti(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "__tests__" || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) sorgenti(p, out);
    else if (e.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

type Dichiarazione = { file: string; src: string; w: number; h: number };

/** Ogni <Image src="/…" width={w} height={h}> con i tre attributi letterali. */
function dichiarazioni(): Dichiarazione[] {
  const out: Dichiarazione[] = [];
  for (const file of sorgenti(join(ROOT, "app"))) {
    const testo = readFileSync(file, "utf8");
    for (const tag of testo.matchAll(/<Image\b([\s\S]*?)\/?>/g)) {
      const attrs = tag[1];
      const src = /\bsrc="(\/[^"]+)"/.exec(attrs);
      const w = /\bwidth=\{(\d+)\}/.exec(attrs);
      const h = /\bheight=\{(\d+)\}/.exec(attrs);
      if (!src || !w || !h) continue;
      out.push({ file: file.slice(ROOT.length + 1).replaceAll("\\", "/"), src: src[1], w: Number(w[1]), h: Number(h[1]) });
    }
  }
  return out;
}

describe("V05 · <Image> con width/height dichiara il rapporto vero del file", () => {
  const raster = dichiarazioni().filter((d) => /\.(jpe?g|png|webp|avif)$/i.test(d.src));

  test("la rete vede almeno la foto di /lavora-con-noi", () => {
    assert.ok(
      raster.some((d) => d.src === "/images/reali/team-trio.jpg"),
      "team-trio.jpg non ha più width/height letterali: se è voluto, aggiornare questo test",
    );
  });

  // Secondo giro del blocco 23 (audit del 21 settembre 2026, V05): la figura è
  // `max-w-[18rem]`, cioè la foto è resa 288 px larga a 360, 390, 768, 1024 e 1440,
  // ma `sizes` dichiarava «60vw» sotto 1024 — 461 px a 768 (il doppio del reso) e
  // 216 px a 360 (meno del reso). DESIGN.md, «La regola dei sizes»: `sizes` descrive
  // i pixel chiesti. Con un tetto in rem la misura è una sola, a ogni larghezza.
  test("la foto di /lavora-con-noi chiede 18rem, la larghezza del suo tetto, a ogni viewport", () => {
    const src = readFileSync(join(ROOT, "app/components/CareerApplication.tsx"), "utf8");
    const tag = /<Image\b[^>]*?src="\/images\/reali\/team-trio\.jpg"[^>]*?>/.exec(src);
    assert.ok(tag, "il tag <Image> di team-trio.jpg non c'è più: se è voluto, aggiornare questo test");
    const sizes = /\bsizes="([^"]+)"/.exec(tag[0]);
    assert.ok(sizes, "team-trio.jpg è senza sizes");
    assert.equal(sizes[1], "18rem", "sizes non descrive i 288 px resi dal tetto max-w-[18rem]");
  });

  for (const d of raster) {
    test(`${d.file}: ${d.src} dichiara ${d.w}×${d.h}`, async () => {
      const path = join(PUB, d.src);
      assert.ok(existsSync(path), `${d.src} non esiste in public/`);
      const m = await sharp(path).metadata();
      assert.ok(m.width && m.height, `sharp non legge le misure di ${d.src}`);
      const dichiarato = d.w / d.h;
      const vero = m.width / m.height;
      const scarto = Math.abs(dichiarato - vero) / vero;
      assert.ok(
        scarto <= 0.01,
        `${d.src} è ${m.width}×${m.height} (${vero.toFixed(3)}), il codice dichiara ${d.w}×${d.h} (${dichiarato.toFixed(3)}): ` +
          `scarto ${(scarto * 100).toFixed(1)} %, il segnaposto salta al decode`,
      );
    });
  }
});
