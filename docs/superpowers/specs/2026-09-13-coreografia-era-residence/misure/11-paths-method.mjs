// Commit 11 del piano 2026-09-13: Paths e Method. A20 di Alberto (un gesto per
// capitolo, firme da chapters.ts), spec §3.8 e §3.9; C01 della cliente (solo
// inset a spigolo vivo). Paths: m42 delle due colonne di #vendi a nove
// progressi del range «top 125%» → «bottom -25%», a 1440x900, 1024x768,
// 768x1024 e 390x664, più la distanza fra foto e testo; a 1440 e 1024 anche la
// seconda lettura del test di §3.8, col bordo alto della riga al 90 % e al 10 %
// del viewport. Method: inset della prima e della seconda scatola a 400 e 3400
// ms dal centro del viewport e a 600 ms dall'uscita, su / e /metodo, a
// 1440x900 e 390x664.
import { startServer, launch, motionContext, scrollInstant, mdTable, appendResults, gitCommit, today } from "./lib.mjs";

const PROGRESSI = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1];
const inset = (s) => {
  const m = /^inset\(([^)]*)\)$/.exec(s.trim());
  if (!m) return s;
  const v = m[1].split(/\s+/).filter(Boolean).map((x) => Math.round(Number.parseFloat(x) * 100) / 100 + 0);
  const [t, r = t, b = t, l = r] = v;
  return [t, r, b, l].join(" ");
};
const mobile = (vp) => vp.width < 768;
const contesto = (browser, vp) =>
  motionContext(
    browser,
    { viewport: vp, deviceScaleFactor: mobile(vp) ? 3 : 1, isMobile: mobile(vp), hasTouch: mobile(vp) },
    { consent: "accepted" },
  );
const intestazione = (nome, vp) => `### ${nome}, ${today()}, ${gitCommit()}, ${vp.width}x${vp.height}\n\n`;

// Gira nella pagina (page.evaluate lo serializza): colonne e riga di #vendi.
const leggiColonne = () => {
  const row = document.querySelector("[data-paths-row]#vendi");
  const cols = [...row.querySelectorAll("[data-paths-col]")];
  const m42 = (el) => {
    const t = getComputedStyle(el).transform;
    return Math.round(new DOMMatrixReadOnly(t === "none" ? undefined : t).m42 * 10) / 10;
  };
  const a = cols[0].getBoundingClientRect();
  const b = cols[1].getBoundingClientRect();
  return {
    a: m42(cols[0]),
    b: m42(cols[1]),
    ha: Math.round(cols[0].offsetHeight),
    hb: Math.round(cols[1].offsetHeight),
    hr: Math.round(row.offsetHeight),
    gap: Math.round(Number.parseFloat(getComputedStyle(row).rowGap) * 10) / 10,
    dist: Math.round((b.top - a.bottom) * 10) / 10,
  };
};

const srv = await startServer();
const browser = await launch();
try {
  for (const vp of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 664 },
  ]) {
    const ctx = await contesto(browser, vp);
    const page = await ctx.newPage();
    await page.goto(`${srv.base}/`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const righe = [];
    for (const p of PROGRESSI) {
      const y = await page.evaluate((prog) => {
        const el = document.querySelector("[data-paths-row]#vendi");
        const top = el.getBoundingClientRect().top + window.scrollY;
        const vh = window.innerHeight;
        const s = top - 1.25 * vh;
        const e = top + el.offsetHeight + 0.25 * vh;
        return s + prog * (e - s);
      }, p);
      await scrollInstant(page, Math.max(0, y));
      await page.waitForTimeout(1200); // scrub 0,5 e Lenis
      const r = await page.evaluate(leggiColonne);
      righe.push([p, r.a, r.b, r.ha, r.hb, r.gap, r.dist]);
    }
    appendResults(
      intestazione("11 paths, riga al progresso p del suo range", vp) +
        mdTable(["p", "m42 col 1", "m42 col 2", "h col 1", "h col 2", "row-gap", "testo − foto (px)"], righe),
    );

    if (vp.width >= 1024) {
      // Seconda lettura del test di §3.8: bordo alto della riga al 90 % e al 10 % del viewport.
      const letture = [];
      for (const frac of [0.9, 0.1]) {
        const y = await page.evaluate((f) => {
          const el = document.querySelector("[data-paths-row]#vendi");
          return el.getBoundingClientRect().top + window.scrollY - f * window.innerHeight;
        }, frac);
        await scrollInstant(page, Math.max(0, y));
        await page.waitForTimeout(1200);
        const r = await page.evaluate(leggiColonne);
        const p = Math.round((((1.25 - frac) * vp.height) / (1.5 * vp.height + r.hr)) * 1000) / 1000;
        letture.push([frac, p, r.a, r.b, r.hr]);
      }
      const delta = Math.round((letture[1][2] - letture[0][2]) * 10) / 10;
      appendResults(
        intestazione("11 paths, bordo alto della riga a una frazione del viewport", vp) +
          mdTable(["bordo alto / innerHeight", "p del range", "m42 col 1", "m42 col 2", "h riga"], letture) +
          `\n\nΔ m42 col 1 fra le due quote: ${delta} px. Lettura da riportare nella frase di §3.8 al commit 22 (spec §10).`,
      );
    }
    await ctx.close();
  }

  for (const vp of [
    { width: 1440, height: 900 },
    { width: 390, height: 664 },
  ]) {
    for (const rotta of ["/", "/metodo"]) {
      const ctx = await contesto(browser, vp);
      const page = await ctx.newPage();
      await page.goto(`${srv.base}${rotta}`, { waitUntil: "load" });
      await page.waitForTimeout(1500);
      const clip = (i) =>
        page.evaluate((k) => getComputedStyle(document.querySelectorAll('#metodo [data-clip="method"]')[k]).clipPath, i);
      const centra = (i) =>
        page.evaluate((k) => {
          const r = document.querySelectorAll('#metodo [data-clip="method"]')[k].getBoundingClientRect();
          window.scrollTo({ top: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2, behavior: "instant" });
        }, i);
      const righe = [];
      righe.push(["scatola 1, scroll 0", inset(await clip(0))]);
      await centra(0);
      await page.waitForTimeout(400);
      righe.push(["scatola 1, 400 ms", inset(await clip(0))]);
      await page.waitForTimeout(3000);
      righe.push(["scatola 1, 3400 ms", inset(await clip(0))]);
      await page.evaluate(() => {
        const el = document.querySelectorAll('#metodo [data-clip="method"]')[0];
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 0.95 * window.innerHeight, behavior: "instant" });
      });
      await page.waitForTimeout(600);
      righe.push(["scatola 1, uscita 600 ms", inset(await clip(0))]);
      await centra(1);
      await page.waitForTimeout(400);
      righe.push(["scatola 2, 400 ms", inset(await clip(1))]);
      await page.waitForTimeout(3000);
      righe.push(["scatola 2, 3400 ms", inset(await clip(1))]);
      appendResults(intestazione(`11 method ${rotta}`, vp) + mdTable(["momento", "inset (t r b l)"], righe));
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  await srv.stop();
}
