// Misura dei gesti dei capitoli 13-16 della home (commit 16).
// Spec 2026-09-13 §3.14-3.17: A20 e A25 di Alberto, D29, D30. Gira sul build
// esistente con motion attivo: `npm run build`, poi
// `node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/16-coda-home.mjs`.
// Appende la tabella a misure/risultati.md ed esce con 1 se una riga è KO.
import { appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const VIEWPORT = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 664 },
];

/** cubic-bezier(x1, y1, x2, y2) valutata in x per bisezione. */
function bezier(x1, y1, x2, y2) {
  const b = (t, p1, p2) => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3;
  return (x) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (b(m, x1, x2) < x) lo = m;
      else hi = m;
    }
    return b((lo + hi) / 2, y1, y2);
  };
}
const dtRail = bezier(0.5, 0, 0.5, 1);

const righe = [];
let ko = 0;
function riga(vp, misura, valore, atteso, ok) {
  const v = typeof valore === "number" ? Number(valore.toFixed(3)) : String(valore);
  righe.push([`${vp.width}×${vp.height}`, misura, v, atteso, ok ? "ok" : "KO"]);
  if (!ok) ko += 1;
}

const { base, stop } = await startServer();
const browser = await launch();
try {
  for (const vp of VIEWPORT) {
    // Consenso già dato: niente banner sopra la rotaia o il modulo.
    const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted" });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    const m = await page.evaluate(async () => {
      const attendi = (ms) => new Promise((r) => setTimeout(r, ms));
      const vai = async (y, ms) => {
        window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
        await attendi(ms);
      };
      const quota = (el) => {
        let y = 0;
        for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
        return y;
      };
      const matrice = (el) => {
        const t = getComputedStyle(el).transform;
        return new DOMMatrixReadOnly(t === "none" ? undefined : t);
      };
      const vh = window.innerHeight;
      const out = {};

      // 13 · la foto affonda
      const frame = document.querySelector("main a[data-sink-frame]");
      const sink = frame.querySelector("[data-sink]");
      const fTop = quota(frame);
      const fH = frame.offsetHeight;
      out.ftH = fH;
      await vai(fTop + fH - vh * 0.5, 1600);
      out.ftMeta = matrice(sink).m42;
      await vai(fTop + fH - vh * 0.05, 1600);
      out.ftFine = matrice(sink).m42;
      out.ftLink = getComputedStyle(frame).transform;

      // 14 · Seguici si congeda
      const block = document.querySelector("[data-seguici-congedo]");
      const sTop = quota(block);
      const sH = block.offsetHeight;
      const s0 = sTop + sH / 2 - vh / 2;
      const s1 = sTop + sH;
      await vai(s0 - 2, 1800);
      out.soA0 = matrice(block).a;
      out.soO0 = Number(getComputedStyle(block).opacity);
      await vai(s0 + 0.9 * (s1 - s0), 1800);
      out.soA9 = matrice(block).a;
      out.soO9 = Number(getComputedStyle(block).opacity);
      out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;

      // 15 · la rotaia, solo con [data-on]
      const wrap = document.querySelector("#chi-siamo .dt-railway");
      const rail = wrap.querySelector(".dt-rail");
      const track = rail.querySelector(".dt-rail_track");
      out.railOn = rail.hasAttribute("data-on");
      out.railX = [];
      if (out.railOn) {
        const top = Math.max(0, Math.round((vh - rail.offsetHeight) / 2));
        const start = quota(wrap) - top;
        const end = quota(wrap) + wrap.offsetHeight - (top + rail.offsetHeight);
        out.railOver = Math.max(0, track.scrollWidth - rail.clientWidth);
        for (const p of [0.25, 0.5, 0.75]) {
          await vai(start + p * (end - start), 1200);
          out.railX.push([p, matrice(track).m41]);
        }
      }

      // 16 · il modulo resta indietro
      const grid = document.querySelector("#contatti [data-lag-grid]");
      const col = document.querySelector("#contatti [data-lag-col]");
      const c0 = quota(grid) + grid.offsetHeight / 2 - vh / 2;
      out.co = [];
      for (const d of [0, 400, 800]) {
        await vai(c0 + d, 1500);
        out.co.push(getComputedStyle(col).transform === "none" ? null : matrice(col).m42);
      }
      return out;
    });

    let tastiera = null;
    if (m.railOn) {
      const tiles = page.locator("#chi-siamo .dt-rail_track > figure");
      await tiles.nth(1).focus();
      await page.waitForTimeout(600);
      await page.keyboard.press("Tab");
      await page.waitForTimeout(900);
      tastiera = await tiles.nth(2).evaluate((el) => {
        const b = el.getBoundingClientRect();
        return {
          l: b.left,
          r: b.right,
          vw: window.innerWidth,
          sl: el.closest(".dt-rail").scrollLeft,
          focus: document.activeElement === el,
        };
      });
    }
    await ctx.close();

    const H = m.ftH;
    riga(vp, "13 m42 a metà corsa", m.ftMeta, `(1, ${(0.1 * H + 1).toFixed(1)}]`, m.ftMeta > 1 && m.ftMeta <= 0.1 * H + 1);
    riga(vp, "13 m42 a p 0,95", m.ftFine, `[${(0.08 * H - 1).toFixed(1)}, ${(0.1 * H + 1).toFixed(1)}]`, m.ftFine >= 0.08 * H - 1 && m.ftFine <= 0.1 * H + 1);
    riga(vp, "13 transform del link", m.ftLink, "none", m.ftLink === "none");
    riga(vp, "14 scala al centro", m.soA0, "[0,995, 1,005]", m.soA0 >= 0.995 && m.soA0 <= 1.005);
    riga(vp, "14 opacità al centro", m.soO0, "≥ 0,99", m.soO0 >= 0.99);
    riga(vp, "14 scala a p 0,9", m.soA9, "[1,05, 1,07] (atteso 1,060)", m.soA9 >= 1.05 && m.soA9 <= 1.07);
    riga(vp, "14 opacità a p 0,9", m.soO9, "[0,45, 0,55] (atteso 0,497)", m.soO9 >= 0.45 && m.soO9 <= 0.55);
    riga(vp, "14 traboccamento orizzontale", m.overflow, "≤ 1", m.overflow <= 1);
    for (const [p, x] of m.railX) {
      const atteso = -m.railOver * dtRail(p);
      riga(vp, `15 x del track a p ${p}`, x, `${atteso.toFixed(1)} ± ${(0.02 * m.railOver).toFixed(1)}`, Math.abs(x - atteso) <= 0.02 * m.railOver);
    }
    if (tastiera) {
      const ok = tastiera.focus && tastiera.l >= -1 && tastiera.r <= tastiera.vw + 1 && tastiera.sl === 0;
      riga(vp, "15 Tab alla terza tessera", `left ${tastiera.l.toFixed(0)}, right ${tastiera.r.toFixed(0)}, scrollLeft ${tastiera.sl}`, "dentro [0, vw], scrollLeft 0", ok);
    } else {
      riga(vp, "15 rotaia", "scorrimento nativo", "sotto 1024 nessun [data-on]", vp.width < 1024);
    }
    if (vp.width >= 1024) {
      const [a, b, c] = m.co;
      riga(vp, "16 m42 griglia al centro", a, "[−40, 40]", a !== null && a >= -40 && a <= 40);
      riga(vp, "16 m42 a +400 e +800", `${b} · ${c}`, "crescente, ≤ 40", a !== null && b > a && c > b && c <= 40);
    } else {
      riga(vp, "16 transform della colonna", m.co.join(" · "), "none a ogni quota", m.co.every((v) => v === null));
    }
  }
} finally {
  await browser.close();
  await stop();
}

appendResults(
  `### Commit 16 · capitoli 13-16 della home (${today()}, ${gitCommit()}, 1440×900 · 1024×768 · 390×664)\n\n${mdTable(["viewport", "misura", "valore", "atteso", "esito"], righe)}`,
);
console.log(righe.map((r) => r.join(" | ")).join("\n"));
process.exitCode = ko ? 1 : 0;
