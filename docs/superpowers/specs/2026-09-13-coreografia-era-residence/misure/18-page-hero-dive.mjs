// MISURE DEL COMMIT 18: IL TUFFO DELLE 11 PAGEHERO E LE BANDE DELLA VILLA.
//
// A20 di Alberto (13 settembre 2026, «Fedeltà letterale») mette il tuffo sticky su
// tutte le PageHero (spec §5.1). D33 fissa i `sizes` e lo strato nitido, D37 il
// ramo sotto la soglia, spec §7.4 una foto della villa per pagina e il controllo
// della calligrafia, spec §8 quello dei volti, spec §9.3 il CLS a 1024×1366.
// Dalla radice del repo:
//
//   node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/18-page-hero-dive.mjs <sottocomando>
//
//   posizioni                senza server. sharp sui tre fermi 16:9 di /metodo, /recensioni
//                            e /cookie: entropia della fetta 4:5 a x 30/40/50/60/70 %,
//                            ritagli in misure/18/, app/lib/motion/band-positions.json.
//   scegli /metodo=40,…      senza server: riscrive le x scelte dopo il controllo a occhio.
//   corridoio [/vendi,…]     geometria del corridoio a 1024×768, 1440×900, 1920×1080.
//   telefono                 scala dello strato interno sotto soglia a 390×664, 768×1024, 1440×600.
//   calligrafia              la calligrafia sulla banda delle sei rotte della villa con
//                            scriptWord, a 1440×900 e 1024×768, p 0: PNG e quota di pixel
//                            con contrasto ≥ 3:1 col rosso.
//   calligrafia-esito /vendi=leggibile,…   scrive misure/18/calligrafia-esito.json.
//   volti                    /lavora-con-noi e /domande-frequenti a 1440×900 e 1920×1080,
//                            p 0,6, 0,8 e 1: JPEG e scala uniforme della scatola.
//   ipad                     le 11 rotte a 1024×1366 DPR 2: CLS a scroll 0 e avorio sotto la banda.
//   lcp-base <out.json>      dal worktree della base: LCP a 390×664 DPR 3, CPU ×4, Slow 4G.
//   lcp <base.json>          sul build del ramo, stesso profilo, con la variante 133vw se serve.
//
// Codici d'uscita: 0 regge; 1 una regola della spec non regge; 2 uso sbagliato;
// 3 (solo lcp) 200vw sfora e 133vw regge: va applicata la variante 133vw.
//
// Server sulla 3178, contesto con motion attivo e sipario saltato, host esterni
// stubbati, tabelle e risultati.md vengono da ./lib.mjs. lcp-base lo lancia una
// copia di questo file nel worktree della base: il suo ./lib.mjs è quello del
// commit 2 e il suo ROOT è il worktree.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { HERE, ROOT, appendResults, gitCommit, launch, mdTable, median, motionContext, startServer, today } from "./lib.mjs";

const OUT = join(HERE, "18");
const DIVE_SEL = '[data-corridor="page-dive"]';
const ROTTE = ["/vendi", "/acquista", "/servizi", "/metodo", "/chi-siamo", "/recensioni", "/open-domus", "/lavora-con-noi", "/domande-frequenti", "/privacy", "/cookie"];
/** Le sei rotte con la foto della villa e una parola in calligrafia (spec §7.4, nota di D15). */
const VILLA_CON_FIRMA = ["/vendi", "/acquista", "/servizi", "/open-domus", "/metodo", "/recensioni"];
/** I tre fermi 16:9 del video tour nelle bande del gruppo 2 (spec §7.4), come percorso sotto
    public/images/. /privacy resta fuori dalla misura: il suo fermo (villa-facciata-lettini.jpg) non esiste
    nel repo e fra le foto della villa non ne resta una libera, quindi tiene la foto di oggi
    (hero_01_attico_travi_salotto.jpg, 1920×1067, circa 16:9) centrata, senza object-position misurato e
    senza riga in band-positions.json (D63). */
const FERMI = {
  "/metodo": "reali/villa-vetrata-lanterne.jpg",
  "/recensioni": "reali/villa-salotto-ombrellone.jpg",
  "/cookie": "reali/villa-uliveto.jpg",
};
const X = [30, 40, 50, 60, 70];
/** Le stesse della sonda CDP (scripts/mobile-cdp-probe.ts:69-72) e della chiusura: 1,6 Mbps giù, 750 kbps su, 150 ms RTT. */
const SLOW_4G = { offline: false, latency: 150, downloadThroughput: (1638.4 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };
const ROTTE_LCP = ["/vendi", "/acquista", "/metodo"];
const GIRI = 5;
/** D33 in spec §5.1: LCP mediano a 390 DPR 3 Slow 4G ≤ base + 150 ms; spec §9.3: ≤ 2,5 s se la base sta sotto. */
const MARGINE_D33 = 150;
const TETTO_LCP = 2500;
const SIZES_TELEFONO = "(max-width: 767.98px) 200vw";

let uscita = 0;
function cade(messaggio) {
  console.error(messaggio);
  if (uscita === 0) uscita = 1;
}

function sezione(titolo, header, righe, nota) {
  appendResults(`## ${titolo}\n\n${today()} · commit ${gitCommit()}\n\n${mdTable(header, righe)}\n\n${nota}`);
}

/** Server di produzione sulla 3178 e chromium headless di lib.mjs, chiusi anche se la misura lancia. */
async function conSito(fn) {
  const server = await startServer();
  const browser = await launch();
  try {
    return await fn(server.base, browser);
  } finally {
    await browser.close();
    await server.stop();
  }
}

/** Contesto di lib.mjs: motion ok, sipario saltato, host esterni stubbati, consenso dato salvo `consent: null`. */
async function apri(browser, { width, height, dpr = 1, mobile = false, consent = "accepted" }) {
  const ctx = await motionContext(
    browser,
    { viewport: { width, height }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile },
    { consent },
  );
  return { ctx, page: await ctx.newPage() };
}

async function vai(page, base, rotta) {
  await page.goto(base + rotta, { waitUntil: "load", timeout: 120_000 });
}

async function acceso(page) {
  await page.waitForSelector(`${DIVE_SEL}[data-on]`, { state: "attached", timeout: 15_000 });
  await page.waitForTimeout(800);
}

/** Porta il corridoio al progresso p (start "top top", end "bottom bottom") e restituisce il progresso raggiunto. */
function aProgresso(page, p) {
  return page.evaluate(
    async ({ sel, p }) => {
      const s = document.querySelector(sel);
      const top = s.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + p * (s.offsetHeight - window.innerHeight), behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 60));
      return (window.scrollY - top) / (s.offsetHeight - window.innerHeight);
    },
    { sel: DIVE_SEL, p },
  );
}

/** Luminanza relativa WCAG di un pixel sRGB. */
function luminanza(r, g, b) {
  const c = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
/** --color-red #d20a0a (globals.css:44), il rosso della calligrafia. */
const L_ROSSO = luminanza(0xd2, 0x0a, 0x0a);

async function misuraCorridoio(base, browser, rotte) {
  const righe = [];
  for (const [w, h] of [[1024, 768], [1440, 900], [1920, 1080]]) {
    for (const rotta of rotte) {
      const fermo = await apri(browser, { width: w, height: h });
      await fermo.page.emulateMedia({ reducedMotion: "reduce" });
      await vai(fermo.page, base, rotta);
      await fermo.page.waitForTimeout(800);
      const h0 = await fermo.page.evaluate((sel) => document.querySelector(sel).offsetHeight, DIVE_SEL);
      await fermo.ctx.close();

      const { ctx, page } = await apri(browser, { width: w, height: h });
      await vai(page, base, rotta);
      await acceso(page);
      const geo = await page.evaluate((sel) => {
        const sec = document.querySelector(sel);
        const screen = sec.querySelector(":scope > [data-corridor-screen]");
        const content = sec.querySelector("[data-dive-content]");
        const band = content.querySelector("[data-dive-band]");
        const offsetIn = (el) => {
          let y = 0;
          for (let n = el; n && n !== content; n = n.offsetParent) y += n.offsetTop;
          return y;
        };
        let textBottom = 0;
        // DIVE_BOTTOM_SEL di page-dive.ts: il fondo del testo di Δt comprende la calligrafia (spec §5.1).
        for (const t of content.querySelectorAll("[data-dive-text], .script-word")) textBottom = Math.max(textBottom, offsetIn(t) + t.offsetHeight);
        const vh = screen.offsetHeight;
        // 1,25 e 24 sono DIVE.bandFactor e DIVE.textMargin di app/lib/motion/page-dive.ts (formula di A20, spec §5.1).
        const db = Math.max(0, offsetIn(band) + band.offsetHeight - vh);
        const dt = Math.max(1.25 * db, textBottom + 24);
        // Il centro del segno di D34 sta a --dt-head-h / 2 (spec §6.1).
        const sonda = document.createElement("div");
        sonda.style.cssText = "position:absolute;left:0;top:0;width:1px;visibility:hidden;height:var(--dt-head-h)";
        document.body.append(sonda);
        const asse = sonda.getBoundingClientRect().height / 2;
        sonda.remove();
        return { H: sec.offsetHeight, db: Math.round(db), dt: Math.round(dt), asse, p180: 180 / (sec.offsetHeight - window.innerHeight) };
      }, DIVE_SEL);
      // Spec §5.1 stima che la calligrafia lasci la foto nei primi 180 px del corridoio: qui è un dato, non una soglia.
      // Senza scriptWord (/privacy, /cookie) «-».
      await aProgresso(page, geo.p180);
      const a180 = await page.evaluate(() => {
        const parola = document.querySelector("[data-dive-content] .script-word");
        return parola ? Math.round(parola.getBoundingClientRect().bottom - document.querySelector("[data-dive-zoom]").getBoundingClientRect().top) : null;
      });
      let pFirma = null;
      let pUscita = null;
      let gapMin = Number.POSITIVE_INFINITY;
      let top08 = null;
      let pAsse = null;
      let copre1 = false;
      for (let i = 0; i <= 20; i += 1) {
        const prog = i / 20;
        await aProgresso(page, prog);
        const s = await page.evaluate((asse) => {
          const z = document.querySelector("[data-dive-zoom]").getBoundingClientRect();
          const vis = [...document.querySelectorAll("[data-dive-text]")].map((t) => t.getBoundingClientRect()).filter((r) => r.bottom > 0);
          const x = 0.04 * window.innerWidth;
          const parola = document.querySelector("[data-dive-content] .script-word");
          return {
            gap: vis.length ? Math.min(...vis.map((r) => z.top - r.bottom)) : null,
            fuori: vis.length === 0,
            firmaFuori: parola ? parola.getBoundingClientRect().bottom <= 0.5 : null,
            zTop: z.top,
            sullAsse: z.left <= x && z.right >= x && z.top <= asse && z.bottom >= asse,
            copre: z.top <= 0 && z.left <= 0 && z.right >= window.innerWidth && z.bottom >= window.innerHeight,
          };
        }, geo.asse);
        if (s.fuori && pUscita === null) pUscita = prog;
        if (s.firmaFuori === true && pFirma === null) pFirma = prog;
        // Uscita definitiva: se la calligrafia torna nello schermo più avanti, la p d'uscita si azzera.
        if (s.firmaFuori === false) pFirma = null;
        if (s.gap !== null) gapMin = Math.min(gapMin, s.gap);
        if (s.sullAsse && pAsse === null) pAsse = prog;
        if (i === 16) top08 = Math.round(s.zTop);
        if (i === 20) copre1 = s.copre;
      }
      await ctx.close();
      const conFirma = a180 !== null;
      righe.push([`${w}×${h}`, rotta, h0, geo.H, geo.H - h0, geo.db, geo.dt, pUscita ?? "mai", conFirma ? (pFirma ?? "mai") : "-", conFirma ? a180 : "-", Math.round(gapMin), top08, geo.asse.toFixed(1), pAsse ?? "mai", copre1 ? "sì" : "no"]);
      if (!(gapMin > 0)) cade(`${rotta} ${w}×${h}: margine testo-foto ${Math.round(gapMin)} px`);
      if (pUscita === null || pUscita > 0.6) cade(`${rotta} ${w}×${h}: il testo esce a ${pUscita ?? "mai"}, oltre 0,6`);
      if (conFirma && (pFirma === null || pFirma > 0.6)) cade(`${rotta} ${w}×${h}: la calligrafia esce a ${pFirma ?? "mai"}, oltre 0,6`);
      if (!copre1) cade(`${rotta} ${w}×${h}: a p 1 la foto non copre lo schermo`);
    }
  }
  sezione(
    "18 · il tuffo delle PageHero: geometria del corridoio (motion ok, DPR 1)",
    ["viewport", "rotta", "section senza corridoio px", "section col corridoio px", "aggiunta px", "Δb px", "Δt px", "p testo uscito", "p calligrafia uscita", "calligrafia sulla foto a 180 px", "margine minimo testo-foto px", "bordo alto foto a p 0,8 px", "centro del segno a y px", "foto sul centro del segno da p", "copre a p 1"],
    righe,
    "Regole di spec §5.1: margine > 0, testo e calligrafia usciti entro p 0,6 (Δt col fondo della calligrafia, DIVE_BOTTOM_SEL), copertura a p 1. «calligrafia sulla foto a 180 px» è la stima di spec §5.1, un dato e non una soglia (≤ 0: già fuori dalla foto). «p testo uscito» e il margine leggono i soli `data-dive-text`: la calligrafia a p 0 attraversa la foto per scelta (DESIGN.md:583). «aggiunta px» si confronta con le stime +690 / +740 / +700. Bordo alto a p 0,8 e p della foto sul centro del segno: dati per la scelta sul tema foto a 1024×768 (spec §5.1 contro §6.1), non soglie di questo commit.",
  );
}

async function misuraTelefono(base, browser) {
  const righe = [];
  for (const { width, height, dpr, mobile, tetto } of [
    { width: 390, height: 664, dpr: 3, mobile: true, tetto: 1.06 },
    { width: 768, height: 1024, dpr: 3, mobile: true, tetto: 1.08 },
    { width: 1440, height: 600, dpr: 1, mobile: false, tetto: 1.08 },
  ]) {
    const { ctx, page } = await apri(browser, { width, height, dpr, mobile });
    await vai(page, base, "/vendi");
    await page.waitForTimeout(1_000);
    const q = await page.evaluate((sel) => {
      const sec = document.querySelector(sel);
      const band = sec.querySelector("[data-dive-band]");
      return {
        start: Math.round(sec.getBoundingClientRect().top + window.scrollY),
        end: Math.round(band.getBoundingClientRect().bottom + window.scrollY),
        on: sec.hasAttribute("data-on"),
        sticky: getComputedStyle(sec.querySelector(":scope > [data-corridor-screen]")).position === "sticky",
      };
    }, DIVE_SEL);
    if (q.on || q.sticky) cade(`${width}×${height}: sotto soglia il corridoio è acceso (data-on ${q.on}, sticky ${q.sticky})`);
    for (const [quota, y] of [
      ["scroll 0", 0],
      ["metà intervallo", Math.round((q.start + q.end) / 2)],
      ["fine intervallo", q.end],
      ["fine + 40 px", q.end + 40],
    ]) {
      await page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), y);
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => {
        const mat = (sel) => {
          const t = getComputedStyle(document.querySelector(sel)).transform;
          return t === "none" ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(t);
        };
        return { inner: mat("[data-dive-inner]").a, zoomFermo: mat("[data-dive-zoom]").isIdentity, y: Math.round(window.scrollY) };
      });
      righe.push([`${width}×${height}`, quota, m.y, m.inner.toFixed(4), tetto, m.zoomFermo ? "sì" : "no"]);
      if (!m.zoomFermo) cade(`${width}×${height} ${quota}: la scatola scala sotto soglia`);
      if (m.inner > tetto + 0.001) cade(`${width}×${height} ${quota}: scala ${m.inner.toFixed(4)} oltre ${tetto}`);
      if (quota === "scroll 0" && Math.abs(m.inner - 1) > 0.001) cade(`${width}×${height}: a scroll 0 la scala è ${m.inner.toFixed(4)}`);
      if (quota === "metà intervallo" && !(m.inner > 1 && m.inner < tetto)) cade(`${width}×${height}: a metà intervallo la scala è ${m.inner.toFixed(4)}`);
      if (quota.startsWith("fine") && Math.abs(m.inner - tetto) > 0.005) cade(`${width}×${height} ${quota}: scala ${m.inner.toFixed(4)} invece di ${tetto}`);
    }
    await ctx.close();
  }
  sezione(
    "18 · il tuffo sotto soglia su /vendi (spec §5.1, D37)",
    ["viewport", "quota", "scrollY", "scala di [data-dive-inner]", "tetto", "scatola all'identità"],
    righe,
    "Regole: nessuno sticky; scala 1 a scroll 0, fra 1 e il tetto a metà dell'intervallo section top top → banda bottom top, uguale al tetto (±0,005) alla fine e oltre; scatola sempre all'identità.",
  );
}

async function misuraPosizioni() {
  const { default: sharp } = await import("sharp");
  mkdirSync(OUT, { recursive: true });
  const esito = {};
  const righe = [];
  for (const [rotta, file] of Object.entries(FERMI)) {
    const p = join(ROOT, "public/images", file);
    if (!existsSync(p)) {
      righe.push([rotta, file, "file assente", "-", "banda invariata", "-"]);
      continue;
    }
    const { width: W, height: H } = await sharp(p).metadata();
    // Scatola 4:5 del telefono con object-fit: cover: resta visibile una fetta larga H · 0,8.
    const w = Math.min(W, Math.round(H * 0.8));
    const entropie = {};
    for (const x of X) {
      const left = Math.round(((W - w) * x) / 100);
      // La fetta si materializza prima delle statistiche e del ritaglio, così entrambi leggono la stessa area.
      const fetta = await sharp(p).extract({ left, top: 0, width: w, height: H }).toBuffer();
      entropie[x] = (await sharp(fetta).stats()).entropy;
      await sharp(fetta).resize({ width: 480 }).jpeg({ quality: 80 }).toFile(join(OUT, `ritaglio-${rotta.slice(1)}-${x}.jpg`));
    }
    const [xMigliore, eMigliore] = Object.entries(entropie).sort((a, b) => b[1] - a[1])[0];
    const x = eMigliore - entropie[50] < 0.05 ? 50 : Number(xMigliore);
    esito[rotta] = `${x}% 50%`;
    righe.push([rotta, file, `${W}×${H}`, X.map((k) => entropie[k].toFixed(3)).join(" / "), esito[rotta], `misure/18/ritaglio-${rotta.slice(1)}-<x>.jpg`]);
  }
  writeFileSync(join(ROOT, "app/lib/motion/band-positions.json"), `${JSON.stringify(esito, null, 2)}\n`);
  sezione(
    "18 · object-position dei fermi 16:9 nelle bande (ritaglio 4:5 del telefono)",
    ["rotta", "file", "W×H", "entropia a x 30/40/50/60/70 %", "scelta", "ritagli"],
    righe,
    "Regola: vince l'entropia massima, a meno che superi quella a 50 % di meno di 0,05 bit. La scelta si conferma guardando i ritagli e si corregge con `scegli` (18c Step 1).",
  );
  console.log(JSON.stringify(esito, null, 1));
}

function scegli(arg) {
  const file = join(ROOT, "app/lib/motion/band-positions.json");
  if (!arg || !existsSync(file)) {
    console.error("uso: scegli /metodo=40,/cookie=60 (dopo posizioni)");
    return 2;
  }
  const posizioni = JSON.parse(readFileSync(file, "utf8"));
  const righe = [];
  for (const coppia of arg.split(",")) {
    const [rotta, x] = coppia.split("=");
    if (!(rotta in posizioni) || !X.includes(Number(x))) {
      console.error(`scegli: «${coppia}» non valido (rotte ${Object.keys(posizioni).join(", ")}; x ${X.join(", ")})`);
      return 2;
    }
    righe.push([rotta, posizioni[rotta], `${x}% 50%`]);
    posizioni[rotta] = `${x}% 50%`;
  }
  writeFileSync(file, `${JSON.stringify(posizioni, null, 2)}\n`);
  sezione("18 · object-position dei fermi corretti a occhio", ["rotta", "misura", "scelta a occhio"], righe, "Col valore della misura il ritaglio 4:5 tagliava a metà il soggetto della foto (ritagli in misure/18/).");
  return 0;
}

async function misuraCalligrafia(base, browser) {
  const { default: sharp } = await import("sharp");
  mkdirSync(OUT, { recursive: true });
  const righe = [];
  for (const [w, h] of [[1440, 900], [1024, 768]]) {
    for (const rotta of VILLA_CON_FIRMA) {
      const { ctx, page } = await apri(browser, { width: w, height: h });
      await vai(page, base, rotta);
      await acceso(page);
      // Spec §9.2: l'ingresso del testo finisce entro 3,5 s.
      await page.waitForTimeout(3_500);
      const r = await page.evaluate(() => {
        const parola = document.querySelector("[data-dive-content] .script-word");
        const banda = document.querySelector("[data-dive-band]");
        if (!parola || !banda) return null;
        const a = parola.getBoundingClientRect();
        return { left: a.left, right: a.right, bottom: a.bottom, bandTop: banda.getBoundingClientRect().top, vw: window.innerWidth };
      });
      if (!r) {
        cade(`${rotta} ${w}×${h}: manca .script-word o [data-dive-band]`);
        await ctx.close();
        continue;
      }
      const sopraFoto = r.bottom - r.bandTop;
      if (sopraFoto <= 0) {
        righe.push([`${w}×${h}`, rotta, 0, "-", "-", "la parola non tocca la foto"]);
        await ctx.close();
        continue;
      }
      const x = Math.max(0, Math.floor(r.left - 8));
      const larghezza = Math.min(r.vw, Math.ceil(r.right + 8)) - x;
      const alto = Math.max(0, Math.floor(r.bandTop - 0.03 * r.vw));
      const nome = `calligrafia-${rotta.slice(1)}-${w}.png`;
      await page.screenshot({ path: join(OUT, nome), clip: { x, y: alto, width: larghezza, height: Math.ceil(r.bottom + 8) - alto } });
      // La foto sotto la parola, senza la parola: stile solo nel contesto della misura.
      await page.addStyleTag({ content: ".script-word{visibility:hidden!important}" });
      await page.waitForTimeout(100);
      const png = await page.screenshot({ clip: { x, y: Math.ceil(r.bandTop), width: larghezza, height: Math.max(1, Math.floor(sopraFoto)) } });
      const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      let forti = 0;
      for (let i = 0; i < data.length; i += info.channels) {
        const L = luminanza(data[i], data[i + 1], data[i + 2]);
        if ((Math.max(L, L_ROSSO) + 0.05) / (Math.min(L, L_ROSSO) + 0.05) >= 3) forti += 1;
      }
      righe.push([`${w}×${h}`, rotta, Math.round(sopraFoto), `${Math.round((100 * forti) / (info.width * info.height))} %`, `misure/18/${nome}`, "da guardare"]);
      await ctx.close();
    }
  }
  sezione(
    "18 · calligrafia sulla banda della villa (spec §7.4, nota di D15)",
    ["viewport", "rotta", "px di parola sulla foto", "pixel ≥ 3:1 col rosso sotto la parola", "immagine", "esito"],
    righe,
    "La quota aiuta a guardare, non decide: l'esito lo dà il controllo a occhio dei PNG (18c Step 9), scritto con `calligrafia-esito`.",
  );
}

function scriviEsito(arg) {
  const coppie = Object.fromEntries((arg ?? "").split(",").filter(Boolean).map((c) => c.split("=")));
  const valide =
    JSON.stringify(Object.keys(coppie).sort()) === JSON.stringify([...VILLA_CON_FIRMA].sort()) &&
    Object.values(coppie).every((v) => v === "leggibile" || v === "illeggibile");
  if (!valide) {
    console.error(`uso: calligrafia-esito ${VILLA_CON_FIRMA.map((r) => `${r}=leggibile|illeggibile`).join(",")}`);
    return 2;
  }
  const esito = Object.fromEntries(VILLA_CON_FIRMA.map((r) => [r, coppie[r]]));
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "calligrafia-esito.json"), `${JSON.stringify(esito, null, 2)}\n`);
  sezione(
    "18 · esito del controllo a occhio della calligrafia",
    ["rotta", "esito"],
    VILLA_CON_FIRMA.map((r) => [r, esito[r]]),
    "Dove l'esito è «illeggibile» PageHero riceve `scriptInset`, cioè `lg:pb-[5.5vw]` (spec §7.4).",
  );
  return 0;
}

async function misuraVolti(base, browser) {
  mkdirSync(OUT, { recursive: true });
  const righe = [];
  for (const [w, h] of [[1440, 900], [1920, 1080]]) {
    for (const rotta of ["/lavora-con-noi", "/domande-frequenti"]) {
      const { ctx, page } = await apri(browser, { width: w, height: h });
      await vai(page, base, rotta);
      await acceso(page);
      for (const p of [0.6, 0.8, 1]) {
        const reale = await aProgresso(page, p);
        const m = await page.evaluate(() => {
          const z = document.querySelector("[data-dive-zoom]");
          const t = getComputedStyle(z).transform;
          const mat = t === "none" ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(t);
          return { a: mat.a, b: mat.b, c: mat.c, d: mat.d, fit: getComputedStyle(z.querySelector("img[data-dive-base]")).objectFit };
        });
        const nome = `volti-${rotta.slice(1)}-${w}-${String(p).replace(".", "")}.jpg`;
        await page.screenshot({ path: join(OUT, nome), type: "jpeg", quality: 80 });
        // Spec §8: persone reali senza distorsione, zoom uniforme.
        const uniforme = Math.abs(m.a - m.d) < 1e-3 && Math.abs(m.b) < 1e-3 && Math.abs(m.c) < 1e-3 && m.fit === "cover";
        if (!uniforme) cade(`${rotta} ${w}×${h} p ${p}: scala non uniforme (a ${m.a}, d ${m.d}, b ${m.b}, c ${m.c}, ${m.fit})`);
        righe.push([`${w}×${h}`, rotta, reale.toFixed(3), m.a.toFixed(3), uniforme ? "sì" : "no", `misure/18/${nome}`]);
      }
      await ctx.close();
    }
  }
  sezione(
    "18 · volti di consulenza.jpg nel tuffo (spec §8, origine 50 % 75 %)",
    ["viewport", "rotta", "p", "scala", "uniforme", "immagine"],
    righe,
    "Controllo a occhio (18d Step 3): a p 1 nessun volto tagliato a metà dal bordo dello schermo e nessun volto più alto di metà schermo.",
  );
}

async function misuraIpad(base, browser) {
  mkdirSync(OUT, { recursive: true });
  const righe = [];
  for (const rotta of ROTTE) {
    const { ctx, page } = await apri(browser, { width: 1024, height: 1366, dpr: 2, mobile: true });
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await vai(page, base, rotta);
    await page.waitForTimeout(3_000);
    const r = await page.evaluate((sel) => {
      const sec = document.querySelector(sel);
      const screen = sec.querySelector(":scope > [data-corridor-screen]");
      const banda = sec.querySelector("[data-dive-band]");
      return {
        cls: window.__cls,
        on: sec.hasAttribute("data-on"),
        avorio: Math.round(screen.getBoundingClientRect().bottom - banda.getBoundingClientRect().bottom),
      };
    }, DIVE_SEL);
    let immagine = "-";
    if (r.on && r.avorio > 0) {
      immagine = `misure/18/ipad-${rotta.slice(1)}.png`;
      await page.screenshot({ path: join(OUT, `ipad-${rotta.slice(1)}.png`) });
    }
    // Spec §9.3: CLS 0 anche a 1024×1366; quattro decimali, come i test e2e del CLS.
    if (r.cls.toFixed(4) !== "0.0000") cade(`${rotta} 1024×1366: CLS ${r.cls.toFixed(4)} a scroll 0`);
    righe.push(["1024×1366 DPR 2", rotta, r.on ? "sì" : "no", r.cls.toFixed(4), r.avorio, immagine]);
    await ctx.close();
  }
  sezione(
    "18 · iPad Pro 1024×1366 a scroll 0 (spec §9.3)",
    ["viewport", "rotta", "corridoio acceso", "CLS", "avorio sotto la banda px", "immagine"],
    righe,
    "Regola: CLS 0 su ogni rotta. L'avorio sotto la banda dentro lo schermo sticky non è una soglia: le immagini vanno ad Alberto.",
  );
}

function osservaLcp() {
  window.__lcp = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__lcp.push({ t: e.startTime, url: e.url || "", tag: e.element ? e.element.tagName : "" });
  }).observe({ type: "largest-contentful-paint", buffered: true });
}

/** GIRI giri a 390×664 DPR 3, CPU ×4, Slow 4G dopo un giro senza freno che scalda la cache delle immagini; senza consenso, come la base di spec §2.5. */
async function giriLcp(browser, base, rotta, riscrivi = null) {
  const giri = [];
  for (let i = 0; i <= GIRI; i += 1) {
    const { ctx, page } = await apri(browser, { width: 390, height: 664, dpr: 3, mobile: true, consent: null });
    await page.addInitScript(osservaLcp);
    if (riscrivi) {
      await page.route(base + rotta, async (route) => {
        const r = await route.fetch();
        const headers = { ...r.headers() };
        delete headers["content-encoding"];
        delete headers["content-length"];
        await route.fulfill({ status: r.status(), headers, body: riscrivi(await r.text()) });
      });
    }
    if (i > 0) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", SLOW_4G);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    }
    await page.goto(base + rotta, { waitUntil: "load", timeout: 180_000 });
    await page.waitForTimeout(9_000);
    const ultimo = await page.evaluate(() => window.__lcp.at(-1) ?? null);
    await ctx.close();
    if (i > 0) giri.push(ultimo ?? { t: Number.NaN, url: "", tag: "" });
  }
  const validi = giri.filter((g) => Number.isFinite(g.t)).sort((a, b) => a.t - b.t);
  const centrale = validi[Math.floor(validi.length / 2)] ?? { t: Number.NaN, url: "", tag: "" };
  let w = "-";
  try {
    w = new URL(centrale.url).searchParams.get("w") ?? "-";
  } catch {
    // voce LCP senza URL: non è un'immagine
  }
  const mediana = validi.length === GIRI ? Math.round(median(validi.map((g) => g.t))) : Number.NaN;
  return { giri, mediana, elemento: centrale.tag, w };
}

async function lcpBase(out) {
  if (!out) {
    console.error("uso: lcp-base <file.json>");
    return 2;
  }
  const rotte = await conSito(async (base, browser) => {
    const r = {};
    for (const rotta of ROTTE_LCP) r[rotta] = await giriLcp(browser, base, rotta);
    return r;
  });
  const dati = {
    commit: gitCommit(),
    data: today(),
    profilo: "390×664 DPR 3, CPU ×4, Slow 4G (1,6 Mbps, 750 kbps, 150 ms RTT), 5 giri dopo un giro di riscaldo, senza consenso, sipario saltato",
    rotte,
  };
  writeFileSync(out, `${JSON.stringify(dati, null, 2)}\n`);
  console.log(JSON.stringify(Object.fromEntries(ROTTE_LCP.map((r) => [r, rotte[r].mediana]))));
  return ROTTE_LCP.every((r) => Number.isFinite(rotte[r].mediana)) ? 0 : 1;
}

async function lcp(file) {
  if (!file || !existsSync(file)) {
    console.error("uso: lcp <base.json scritto da lcp-base>");
    return 2;
  }
  const base = JSON.parse(readFileSync(file, "utf8"));
  const regge = (ms, b) => Number.isFinite(ms) && Number.isFinite(b) && ms <= b + MARGINE_D33 && (ms <= TETTO_LCP || b > TETTO_LCP);
  const righe = [];
  let sfora200 = false;
  let sfora133 = false;
  await conSito(async (url, browser) => {
    for (const rotta of ROTTE_LCP) {
      const b = base.rotte[rotta]?.mediana ?? Number.NaN;
      const ramo = await giriLcp(browser, url, rotta);
      let stima133 = "-";
      let esito = "regge";
      if (!regge(ramo.mediana, b)) {
        sfora200 = true;
        // Le due varianti passano dallo stesso route.fulfill, che prende l'HTML fuori dal freno di rete: la
        // distorsione è la stessa per entrambe, e la loro differenza si somma al ramo misurato senza route.
        const identico = await giriLcp(browser, url, rotta, (html) => html);
        const v133 = await giriLcp(browser, url, rotta, (html) => html.replaceAll(SIZES_TELEFONO, "(max-width: 767.98px) 133vw"));
        const stima = Math.round(ramo.mediana + (v133.mediana - identico.mediana));
        stima133 = `${stima} (con route: ${identico.mediana} → ${v133.mediana}, w ${v133.w})`;
        if (regge(stima, b)) esito = "sfora a 200vw, regge a 133vw";
        else {
          sfora133 = true;
          esito = "sfora anche a 133vw";
        }
      }
      righe.push([rotta, b, ramo.mediana, ramo.mediana - b, b + MARGINE_D33, ramo.elemento, ramo.w, stima133, esito]);
    }
  });
  const codice = !sfora200 ? 0 : sfora133 ? 1 : 3;
  const decisione =
    codice === 0
      ? "D33 regge: sotto 768 resta 200vw."
      : codice === 3
        ? "200vw sfora e 133vw regge: sotto 768 passa a 133vw, deroga a D04 dichiarata."
        : "Sfora anche 133vw, o supera 2,5 s con la base sotto: il blocco si ferma e riferisce questi numeri.";
  sezione(
    "18 · D33: LCP a 390×664 DPR 3, CPU ×4, Slow 4G, contro la base del commit 2",
    ["rotta", "base ms", "ramo ms", "Δ ms", "tetto ms", "elemento", "w servito", "133vw stimato ms", "esito"],
    righe,
    `Base: commit ${base.commit} del ${base.data} (${base.profilo}), la stessa della chiusura. Soglie di spec §5.1 e §9.3: ramo ≤ base + 150 ms e ≤ 2,5 s se la base sta sotto 2,5 s. ${decisione}`,
  );
  console.log(decisione);
  return codice;
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "posizioni") await misuraPosizioni();
else if (cmd === "scegli") uscita = scegli(arg);
else if (cmd === "corridoio") await conSito((base, browser) => misuraCorridoio(base, browser, arg ? arg.split(",") : ROTTE));
else if (cmd === "telefono") await conSito(misuraTelefono);
else if (cmd === "calligrafia") await conSito(misuraCalligrafia);
else if (cmd === "calligrafia-esito") uscita = scriviEsito(arg);
else if (cmd === "volti") await conSito(misuraVolti);
else if (cmd === "ipad") await conSito(misuraIpad);
else if (cmd === "lcp-base") uscita = await lcpBase(arg);
else if (cmd === "lcp") uscita = await lcp(arg);
else {
  console.error(
    "uso: posizioni | scegli <rotta>=<x>,… | corridoio [/rotta,…] | telefono | calligrafia | calligrafia-esito <rotta>=leggibile|illeggibile,… | volti | ipad | lcp-base <out.json> | lcp <base.json>",
  );
  uscita = 2;
}
process.exitCode = uscita;
