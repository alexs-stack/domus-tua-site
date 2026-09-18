// L'inquadratura del volo sotto il titolo bianco del Congedo (commit 17).
// Spec 2026-09-13 §3.18 (A19 e A20 di Alberto): `--pc-focus` si misura a 1024,
// 1440, 1920 e sotto 1024 con la luminanza sotto il titolo sui fotogrammi 0,
// metà e ultimo del loop. Metodo di lane-homeC §7.4: luminanza media dei pixel
// sotto il rettangolo del titolo, col titolo nascosto; vince il candidato più
// scuro nel caso peggiore fra viewport e fotogrammi. La quota di pixel con
// luminanza > 180 si riporta come dato, senza soglia. Due passate:
// - `--base`, sul build del commit 16: la banda di oggi (poster
//   piscina-lusso.jpg a 16% 50%, zoom 1,14). Scrive 17-pc-focus-base.json col
//   caso peggiore di ogni fascia.
// Le due passate guardano la stessa cosa: da 768 px la banda riproduce lo
// stesso loop del drone prima e dopo il commit 17, quindi il video è acceso in
// tutt'e due e i tre fotogrammi si campionano allo stesso modo; sotto 768 il
// video non parte mai e resta il solo poster.
// - senza argomenti, sul build del commit 17: i candidati 8, 12, 16 e 24 %
//   sull'asse x, più 50 % da 1024. KO se il candidato scelto è più chiaro
//   della base della sua fascia.
// Run: npm run build, poi node …/misure/17-pc-focus.mjs [--base]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { HERE, appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

const BASE = process.argv.includes("--base");
const BASE_FILE = join(HERE, "17-pc-focus-base.json");
/** La banda: la section del Congedo prima e dopo il commit 17 (stesso aria-labelledby). */
const BANDA = 'section[aria-labelledby="congedo-title"]';
const CORSIA = ["8% 50%", "12% 50%", "16% 50%", "24% 50%"];
const OGGI = "oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14";

/* `attuale` è il valore che la fascia ha oggi in app/globals.css (.dt-postcard e
   i due @media): serve solo alla regola «a pari merito entro un punto resta il
   valore scritto», così rilanciare lo script non fa oscillare il CSS. */
const FASCE = [
  { id: "base", nome: "sotto 768 (regola base)", attuale: "12% 50%", vps: [{ width: 390, height: 664 }], candidati: CORSIA },
  { id: "768", nome: "768-1023 (@media min-width 768px)", attuale: "8% 50%", vps: [{ width: 768, height: 1024 }], candidati: CORSIA },
  {
    id: "1024",
    nome: "da 1024 (@media min-width 1024px)",
    attuale: "8% 50%",
    vps: [
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ],
    candidati: [...CORSIA, "50% 50%"],
  },
];
/** Luminanza oltre la quale un pixel conta come chiaro: solo per la colonna informativa. */
const CHIARO = 180;
/** Sotto un punto di luminanza media (su 255) di differenza resta il valore attuale del CSS. */
const PARI = 1;

if (!BASE && !existsSync(BASE_FILE)) {
  throw new Error("manca misure/17-pc-focus-base.json: prima lo Step 0 del commit 17, sul build del commit 16");
}

async function luminanza(png) {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let somma = 0;
  let chiari = 0;
  const n = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) {
    const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    somma += y;
    if (y > CHIARO) chiari += 1;
  }
  return { media: somma / n, chiari: chiari / n };
}

/** Una pagina a un viewport: banda in vista, titolo nascosto, un campione per fotogramma e candidato. */
async function misura(browser, base, vp, candidati) {
  const ctx = await motionContext(browser, { viewport: vp }, { consent: "accepted" });
  const page = await ctx.newPage();
  const out = [];
  try {
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.waitForTimeout(800);
    await page.evaluate((sel) => {
      let y = 0;
      for (let n = document.querySelector(sel); n; n = n.offsetParent) y += n.offsetTop;
      window.scrollTo({ top: y, behavior: "instant" });
    }, BANDA);
    await page.waitForTimeout(1500);
    await page
      .waitForFunction((sel) => [...document.querySelectorAll(`${sel} img`)].every((i) => i.complete && i.naturalWidth > 0), BANDA, { timeout: 10_000 })
      .catch(() => {});
    // Il gate dei video d'ambiente parte da 768 px sia sulla banda del commit 16
    // sia sulla cartolina: il confronto è omogeneo solo col video acceso in
    // tutt'e due le passate.
    const conVideo = vp.width >= 768;
    if (conVideo) {
      await page
        .waitForFunction(
          (sel) => document.querySelector(`${sel}[data-ambient], ${sel} [data-ambient]`)?.getAttribute("data-ambient") === "playing",
          BANDA,
          { timeout: 10_000 },
        )
        .catch(() => {});
    }
    const rect = await page.evaluate(
      ([sel, nascondiVideo]) => {
        const t = document.getElementById("congedo-title");
        const r = t.getBoundingClientRect();
        (t.closest(".dt-postcard_copy") ?? t.parentElement).style.visibility = "hidden";
        const v = document.querySelector(`${sel} video`);
        if (nascondiVideo && v) {
          v.pause();
          v.style.visibility = "hidden";
        }
        const x = Math.max(0, r.left);
        const y = Math.max(0, r.top);
        return { x, y, width: Math.min(r.right, window.innerWidth) - x, height: Math.min(r.bottom, window.innerHeight) - y };
      },
      [BANDA, !conVideo],
    );
    const durata = conVideo ? await page.evaluate((sel) => document.querySelector(`${sel} video`)?.duration || 0, BANDA) : 0;
    const tempi = durata > 0 ? [0, durata / 2, Math.max(0, durata - 0.1)] : [null];
    for (const t of tempi) {
      if (t !== null) {
        await page.evaluate(
          async ([sel, tt]) => {
            const v = document.querySelector(`${sel} video`);
            v.pause();
            await new Promise((r) => {
              v.addEventListener("seeked", r, { once: true });
              setTimeout(r, 3000);
              v.currentTime = tt;
            });
          },
          [BANDA, t],
        );
      }
      for (const cand of candidati) {
        if (!BASE) {
          await page.evaluate((c) => {
            document.querySelector('[data-corridor="cartolina"]').style.setProperty("--pc-focus", c);
            return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          }, cand);
        }
        const l = await luminanza(await page.screenshot({ clip: rect }));
        out.push({ fotogramma: t === null ? "poster" : `t ${t.toFixed(2)} s`, cand, ...l });
      }
    }
  } finally {
    await ctx.close();
  }
  return out;
}

const soglie = BASE ? null : JSON.parse(readFileSync(BASE_FILE, "utf8"));
const { base, stop } = await startServer();
const browser = await launch();
const righe = [];
const scelte = [];
const peggioriBase = {};
let ko = 0;
try {
  for (const f of FASCE) {
    const candidati = BASE ? [OGGI] : f.candidati;
    const peggiore = new Map(candidati.map((c) => [c, { media: 0, chiari: 0 }]));
    for (const vp of f.vps) {
      for (const m of await misura(browser, base, vp, candidati)) {
        const p = peggiore.get(m.cand);
        peggiore.set(m.cand, { media: Math.max(p.media, m.media), chiari: Math.max(p.chiari, m.chiari) });
        righe.push([`${vp.width}×${vp.height}`, f.nome, m.fotogramma, m.cand, Number(m.media.toFixed(1)), Number(m.chiari.toFixed(3))]);
      }
    }
    if (BASE) {
      peggioriBase[f.id] = peggiore.get(OGGI);
      continue;
    }
    const [migliore, valore] = [...peggiore.entries()].sort((a, b) => a[1].media - b[1].media)[0];
    const scelta = peggiore.get(f.attuale).media - valore.media <= PARI ? f.attuale : migliore;
    const v = peggiore.get(scelta);
    const tetto = soglie.fasce[f.id].media;
    const ok = v.media <= tetto;
    if (!ok) ko += 1;
    scelte.push([f.nome, scelta, Number(v.media.toFixed(1)), Number(v.chiari.toFixed(3)), `≤ ${tetto.toFixed(1)} (base)`, ok ? "ok" : "KO"]);
  }
} finally {
  await browser.close();
  await stop();
}

const intestazione = ["viewport", "fascia", "fotogramma", "candidato", "luminanza media", "quota > 180"];
const quando = `${today()}, ${gitCommit()}, 390 · 768 · 1024 · 1440 · 1920`;
if (BASE) {
  writeFileSync(BASE_FILE, `${JSON.stringify({ data: today(), commit: gitCommit(), fasce: peggioriBase }, null, 2)}\n`, "utf8");
  appendResults(`### Commit 17 · base di --pc-focus, la banda del commit 16 (${quando})\n\n${mdTable(intestazione, righe)}`);
  console.log(peggioriBase);
} else {
  appendResults(
    `### Commit 17 · --pc-focus, luminanza sotto il titolo (${quando})\n\n${mdTable(intestazione, righe)}\n\n${mdTable(["fascia", "--pc-focus", "caso peggiore", "quota > 180", "tetto", "esito"], scelte)}`,
  );
  console.log(scelte.map((r) => r.join(" | ")).join("\n"));
}
process.exitCode = ko ? 1 : 0;
