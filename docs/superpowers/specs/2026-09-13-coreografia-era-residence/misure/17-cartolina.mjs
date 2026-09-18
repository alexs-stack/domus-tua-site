// La cartolina del Congedo misurata (commit 17). Spec 2026-09-13 §3.18 e §4,
// A19 e A20 di Alberto, D29. Sticky a 1024, 1440 e 1920 nelle cinque lingue;
// ramo del telefono a 768 e 390. Gira sul build esistente con motion attivo e
// consenso accettato (lib.mjs del commit 2), appende la tabella a
// risultati.md ed esce con 1 se una riga è KO.
import { appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

/** `aggiunta` = section + margine del footer − banda di oggi, max(larghezza·9/16, 70svh) (spec §4). */
const STICKY = [
  { width: 1024, height: 768, aggiunta: 745 },
  { width: 1440, height: 900, aggiunta: 738 },
  { width: 1920, height: 1080, aggiunta: 778 },
];
const TELEFONO = [
  { width: 768, height: 1024, lati: [4, 14, 4, 14] },
  { width: 390, height: 664, lati: [4, 10, 4, 10] },
];
const LINGUE = ["it", "en", "fr", "de", "es"];

const righe = [];
let ko = 0;
function riga(vp, misura, valore, atteso, ok) {
  const v = typeof valore === "number" ? Number(valore.toFixed(3)) : String(valore);
  righe.push([`${vp.width}×${vp.height}`, misura, v, atteso, ok ? "ok" : "KO"]);
  if (!ok) ko += 1;
}

/** I quattro lati di un inset() calcolato, espansi dalle forme corte («inset(8% 22%)» → [8, 22, 8, 22]); «none» vale quattro zeri. */
function lati(clip) {
  const m = /^inset\(([^)]*)\)$/.exec(String(clip).trim());
  if (!m) return [0, 0, 0, 0];
  const n = m[1]
    .split(/\s+/)
    .filter(Boolean)
    .map((v) => Number.parseFloat(v));
  if (n.length === 1) return [n[0], n[0], n[0], n[0]];
  if (n.length === 2) return [n[0], n[1], n[0], n[1]];
  if (n.length === 3) return [n[0], n[1], n[2], n[1]];
  return n.slice(0, 4);
}

/** Il titolo sta nella finestra: lo schermo meno i lati del ritaglio, ±1 px. */
function dentro(st) {
  const [t, r, b, l] = lati(st.clip);
  const s = st.schermo;
  const w = { l: s.left + (s.width * l) / 100, r: s.right - (s.width * r) / 100, t: s.top + (s.height * t) / 100, b: s.bottom - (s.height * b) / 100 };
  const tt = st.titolo;
  return tt.left >= w.l - 1 && tt.right <= w.r + 1 && tt.top >= w.t - 1 && tt.bottom <= w.b + 1;
}

/** Il bordo basso chiude prima (§3.18): il top del footer non sale sopra il bordo basso della finestra, ±1 px. */
function sottoLaFinestra(st) {
  const b = lati(st.clip)[2];
  return st.footTop >= st.schermo.bottom - (st.schermo.height * b) / 100 - 1;
}

/** Codice che gira nella pagina, iniettato come stringa: quote, stato, CTA libera, scroll istantaneo. */
function sonda() {
  const attendi = (ms) => new Promise((r) => setTimeout(r, ms));
  const quota = (el) => {
    let y = 0;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  };
  const sec = document.querySelector('[data-corridor="cartolina"]');
  const screen = sec.querySelector(":scope > [data-corridor-screen]");
  const clip = sec.querySelector("[data-postcard-clip]");
  const foot = document.querySelector("footer[data-postcard-foot]");
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };
  const stato = () => {
    const t = getComputedStyle(foot).transform;
    return {
      clip: getComputedStyle(clip).clipPath,
      schermo: box(screen),
      titolo: box(document.getElementById("congedo-title")),
      footTop: foot.getBoundingClientRect().top,
      footO: Number(getComputedStyle(foot).opacity),
      footA: new DOMMatrixReadOnly(t === "none" ? undefined : t).a,
    };
  };
  const ctaLibera = () => {
    const a = sec.querySelector(".dt-postcard_copy a");
    const r = a.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === a || a.contains(hit));
  };
  const vai = async (y, ms) => {
    window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
    await attendi(ms);
  };
  return { sec, screen, clip, foot, quota, stato, ctaLibera, vai };
}

/** Un contesto per viewport e lingua, con le richieste video contate dal primo byte. */
async function apri(browser, base, vp, locale) {
  const ctx = await motionContext(browser, { viewport: { width: vp.width, height: vp.height } }, { consent: "accepted", locale });
  const page = await ctx.newPage();
  const video = [];
  page.on("request", (r) => {
    if (/\.(mp4|webm)(\?|$)/i.test(r.url())) video.push(r.url());
  });
  await page.goto(`${base}/`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  // Stringa valutata da CDP: nessun `new Function` nella pagina.
  await page.evaluate(`window.__sonda = (${sonda.toString()})();`);
  return { ctx, page, video };
}

const { base, stop } = await startServer();
const browser = await launch();
try {
  for (const vp of STICKY) {
    for (const lingua of LINGUE) {
      const { ctx, page } = await apri(browser, base, vp, lingua);
      if (lingua !== "it") {
        const st = await page.evaluate(async () => {
          const s = window.__sonda;
          await s.vai(s.quota(s.foot) - window.innerHeight * 0.4, 1500);
          return s.stato();
        });
        await ctx.close();
        riga(vp, `titolo dentro la finestra (${lingua})`, dentro(st), "true", dentro(st));
        continue;
      }
      const m = await page.evaluate(async () => {
        const s = window.__sonda;
        const vh = window.innerHeight;
        const secTop = s.quota(s.sec);
        const footTop = s.quota(s.foot);
        const fine = footTop - vh * 0.4;
        const out = {
          on: s.sec.hasAttribute("data-on"),
          altezza: s.sec.offsetHeight,
          margine: Number.parseFloat(getComputedStyle(s.foot).marginTop),
          bordo: [],
        };
        await s.vai(secTop, 1200);
        out.cta0 = s.ctaLibera();
        await s.vai(secTop + vh * 0.4, 1200);
        out.meta = s.stato();
        out.ctaMeta = s.ctaLibera();
        out.ambient = s.clip.getAttribute("data-ambient");
        await s.vai(footTop - vh * 0.9, 1500);
        out.footO90 = Number(getComputedStyle(s.foot).opacity);
        for (const p of [0.55, 0.7, 0.85]) {
          await s.vai(secTop + p * (fine - secTop), 1500);
          out.bordo.push([p, s.stato()]);
        }
        await s.vai(fine, 1500);
        out.fine = s.stato();
        out.bordo.push([1, out.fine]);
        out.ctaFine = s.ctaLibera();
        return out;
      });
      await ctx.close();
      const banda = Math.max(Math.round((vp.width * 9) / 16), vp.height * 0.7);
      const aggiunta = m.altezza + m.margine - banda;
      const meta = lati(m.meta.clip);
      const fine = lati(m.fine.clip);
      riga(vp, "data-on sulla cartolina", m.on, "true", m.on);
      riga(vp, "altezza della section", m.altezza, `${(vp.height * 1.8).toFixed(0)} ± 1 (180svh)`, Math.abs(m.altezza - vp.height * 1.8) <= 1);
      riga(vp, "margin-top del footer", m.margine, `${(-vp.height * 0.08).toFixed(1)} ± 1 (−8svh)`, Math.abs(m.margine + vp.height * 0.08) <= 1);
      riga(vp, "aggiunta d'altezza della home (§4)", aggiunta, `${vp.aggiunta} ± 2`, Math.abs(aggiunta - vp.aggiunta) <= 2);
      riga(vp, "top dello schermo a metà corsa", m.meta.schermo.top, "|top| ≤ 1", Math.abs(m.meta.schermo.top) <= 1);
      riga(vp, "inset alto a metà corsa", meta[0], "(0, 8)", meta[0] > 0 && meta[0] < 8);
      riga(vp, "opacità del footer al 90 %", m.footO90, "< 0,2", m.footO90 < 0.2);
      for (const [p, st] of m.bordo) {
        riga(vp, `footer sotto il bordo basso della finestra a p ${p}`, `top ${st.footTop.toFixed(1)} · b ${lati(st.clip)[2]} %`, "top ≥ bordo della finestra − 1", sottoLaFinestra(st));
      }
      riga(vp, "inset col footer al 40 %", fine.join(" "), "8 22 8 22 ± 0,2", [8, 22, 8, 22].every((v, i) => Math.abs(fine[i] - v) <= 0.2));
      riga(vp, "footer al 40 %: opacità e scala", `${m.fine.footO} · ${m.fine.footA}`, "1 · 1 ± 0,001", m.fine.footO === 1 && Math.abs(m.fine.footA - 1) <= 0.001);
      riga(vp, "CTA libera a 0, metà, fine", `${m.cta0} · ${m.ctaMeta} · ${m.ctaFine}`, "true · true · true", m.cta0 && m.ctaMeta && m.ctaFine);
      riga(vp, "video d'ambiente a metà corsa", m.ambient, "playing", m.ambient === "playing");
      riga(vp, "titolo dentro la finestra (it)", dentro(m.fine), "true", dentro(m.fine));
    }
  }

  for (const vp of TELEFONO) {
    const { ctx, page, video } = await apri(browser, base, vp, null);
    const m = await page.evaluate(async () => {
      const s = window.__sonda;
      const vh = window.innerHeight;
      const out = { on: s.sec.hasAttribute("data-on"), pos: getComputedStyle(s.screen).position, margine: getComputedStyle(s.foot).marginTop };
      // Prima l'inizio del tratto («bottom bottom»), poi la fine: un unico salto
      // dalla cima del documento fino alla fine non arriva allo ScrollTrigger a
      // 768×1024 e la banda resta a progresso 0 (verificato con una scansione:
      // rientrando alla stessa quota dipinge). Il ramo sticky qui sopra entra
      // già nel tratto a passi, per la stessa ragione.
      await s.vai(s.quota(s.screen) + s.screen.offsetHeight - vh, 1200);
      await s.vai(s.quota(s.screen) + s.screen.offsetHeight - vh * 0.3, 1500);
      out.fine = s.stato();
      return out;
    });
    await ctx.close();
    const fine = lati(m.fine.clip);
    riga(vp, "niente data-on, schermo non sticky", `${m.on} · ${m.pos}`, "false · relative", !m.on && m.pos === "relative");
    riga(vp, "margin-top del footer", m.margine, "0px", m.margine === "0px");
    riga(vp, "inset a fine tratto", fine.join(" "), `${vp.lati.join(" ")} ± 0,2`, vp.lati.every((v, i) => Math.abs(fine[i] - v) <= 0.2));
    riga(vp, "opacità del footer a fine tratto", m.fine.footO, "1", m.fine.footO === 1);
    riga(vp, "titolo dentro la finestra (it)", dentro(m.fine), "true", dentro(m.fine));
    if (vp.width < 768) riga(vp, "richieste video", video.length, "0", video.length === 0);
  }
} finally {
  await browser.close();
  await stop();
}

appendResults(
  `### Commit 17 · la cartolina del Congedo (${today()}, ${gitCommit()}, 1024 · 1440 · 1920 · 768 · 390)\n\n${mdTable(["viewport", "misura", "valore", "atteso", "esito"], righe)}`,
);
console.log(righe.map((r) => r.join(" | ")).join("\n"));
process.exitCode = ko ? 1 : 0;
