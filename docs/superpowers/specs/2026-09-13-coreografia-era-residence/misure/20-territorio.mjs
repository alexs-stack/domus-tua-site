// Misura del rientro del pannello del territorio contro il monogramma fisso
// (spec §6.1, HorizonStory.tsx). Chiesta da A27 di Alberto («qualità massima»)
// per la decisione di lavoro D68 del coordinatore: il segno non copre mai un
// titolo, un link o un bottone, e il pannello del territorio porta il contenuto
// oltre il bordo del segno anche col corridoio «storia» acceso, con un rientro
// di riserva di almeno RISERVA px su tutte le larghezze da 1024 in su.
//
// `e2e/segno.spec.ts` prova che nessun bersaglio finisce SOTTO il segno; qui si
// misura l'ARIA che resta, che il test non sa dire, e si guardano i gradini del
// titolo ([data-horizon-stair]) con la loro scatola d'inchiostro: si muovono in
// parallasse contraria (HorizonScroller.tsx, xPercent 25 → −25 sulla riga di
// mezzo) e alla posa di fine corsa sono l'elemento che più si avvicina al segno,
// mentre il rettangolo dell'h3 che li contiene resta fermo al suo posto di
// layout e non racconta il loro movimento.
//
//   node docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/20-territorio.mjs
//
// Esce 1 se una regola cade. Server, browser, contesto (consenso accettato,
// sipario saltato con la chiave INTRO_QUIET, host esterni stubbati) e tabelle da
// ./lib.mjs: build esistente in .next, `next start` sulla 3178, Chromium
// headless con motion ok. Mai su next dev (Turbopack serve globals.css con
// un'edizione di ritardo).
import { appendResults, gitCommit, launch, mdTable, motionContext, startServer, today } from "./lib.mjs";

/** Il rientro di riserva che D68 chiede fra il bordo destro del segno e il contenuto del pannello. */
const RISERVA = 16;
/** Passo della corsa del corridoio, lo stesso della parte «in scrub» di e2e/segno.spec.ts. */
const PASSO = 40;
/**
 * I quattro viewport col nastro acceso (MQ.corridor, D22) e i due in cui il
 * segno c'è ma il corridoio no (altezza sotto 640): lì il pannello è un blocco
 * in colonna e la variante `[.dt-horizon:not([data-on])_&]` tiene 8vw sui due
 * lati. D68 chiede il rientro in tutti e due gli stati, quindi si misurano
 * tutti e due.
 */
const VIEWPORTS = [
  [1024, 768, true],
  [1280, 800, true],
  [1440, 900, true],
  [1920, 1080, true],
  [1024, 600, false],
  [1440, 600, false],
];

const f1 = (x) => (x === null || x === undefined || Number.isNaN(x) ? "—" : Number(x).toFixed(1));

/**
 * Corsa del corridoio «storia» a passi di PASSO px. Per ogni campione in cui il
 * segno è acceso legge il margine = bordo sinistro dell'elemento − bordo destro
 * della scatola del segno, contato SOLO dove c'è sovrapposizione verticale col
 * segno (altrove il margine orizzontale non vuol dire niente), e ne tiene il
 * minimo per bersaglio. I gradini si misurano con un Range sul testo: la
 * scatola del blocco è larga quanto la colonna, le lettere no.
 */
async function corsa(page, passo) {
  return page.evaluate(async (step) => {
    const segno = document.querySelector("[data-segno]");
    const zona = document.querySelector('[data-corridor="storia"]');
    if (!segno || !zona) return { errore: !segno ? "manca [data-segno]" : 'manca [data-corridor="storia"]' };
    const pannello = document.querySelector(".dt-horizon_panel--territory > *");
    if (!pannello) return { errore: "manca il pannello del territorio" };

    const vai = async (y) => {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 120));
    };
    const acceso = () => !segno.hidden && Number(getComputedStyle(segno).opacity) >= 0.1;
    /** La scatola d'inchiostro di un elemento con una riga sola di testo (Range sul nodo di testo). */
    const inchiostro = (el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      const box = r.getBoundingClientRect();
      r.detach?.();
      return box.width > 0 ? box : el.getBoundingClientRect();
    };
    const gradini = [...pannello.querySelectorAll("[data-horizon-stair]")];
    const titolo = pannello.querySelector("h3");
    const link = pannello.querySelector("a");
    const bersagli = [
      ...(titolo ? [{ nome: "h3 (scatola)", el: titolo, ink: false }] : []),
      ...(link ? [{ nome: "link (scatola)", el: link, ink: false }] : []),
      ...gradini.map((el, i) => ({ nome: `gradino ${i + 1} «${(el.textContent ?? "").trim()}»`, el, ink: true })),
    ];
    const peggio = bersagli.map((b) => ({ nome: b.nome, margine: Infinity, y: null, campioni: 0 }));

    const alto = zona.getBoundingClientRect().top + window.scrollY;
    const basso = alto + zona.offsetHeight;
    const max = document.documentElement.scrollHeight - innerHeight;
    const da = Math.max(0, Math.floor(alto - innerHeight));
    const a = Math.min(max, Math.ceil(basso));
    let passi = 0;
    for (let y = da; y <= a; y += step) {
      await vai(y);
      if (!acceso()) continue;
      passi++;
      const s = segno.getBoundingClientRect();
      bersagli.forEach((b, i) => {
        if (!b.el.checkVisibility()) return;
        const r = b.ink ? inchiostro(b.el) : b.el.getBoundingClientRect();
        if (r.width <= 0 || Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top) <= 0) return;
        peggio[i].campioni++;
        const m = r.left - s.right;
        if (m < peggio[i].margine) {
          peggio[i].margine = m;
          peggio[i].y = y;
        }
      });
    }

    // Geometria a corsa finita, dove il nastro inquadra il pannello intero.
    await vai(Math.min(max, Math.ceil(basso)));
    const cs = getComputedStyle(pannello);
    const s = segno.getBoundingClientRect();
    // La foto del territorio (A27 di Alberto: le foto non si tagliano più del
    // dovuto). La scatola è 16:9 e la sorgente 2:1, quindi la quota in quadro
    // non dipende da quanto la scatola si stringe: si misura per dirlo coi numeri.
    const foto = pannello.querySelector("[data-horizon-slide] img");
    const fr = foto?.getBoundingClientRect();
    const geometria = {
      foto: foto
        ? {
            larghezza: fr.width,
            altezza: fr.height,
            rapporto: fr.width / fr.height,
            quadro: (100 * (fr.width / fr.height)) / (foto.naturalWidth / foto.naturalHeight),
            sizes: foto.getAttribute("sizes"),
            servita: (foto.currentSrc.match(/[?&]w=(\d+)/) ?? [])[1] ?? "—",
          }
        : null,
      segnoDestra: s.right,
      rientro: parseFloat(cs.paddingLeft),
      utile: pannello.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
      traboccaPannello: pannello.scrollWidth - pannello.clientWidth,
      traboccaDoc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      gradini: gradini.map((el) => ({
        testo: (el.textContent ?? "").trim(),
        righe: el.getClientRects().length,
        larghezza: inchiostro(el).width,
      })),
    };
    return { passi, peggio: peggio.map((p) => ({ ...p, margine: p.margine === Infinity ? null : p.margine })), geometria };
  }, passo);
}

const server = await startServer();
const browser = await launch();
const righe = [];
const gradiniRighe = [];
const guai = [];
try {
  for (const [width, height, acceso] of VIEWPORTS) {
    const stato = acceso ? "nastro" : "colonna";
    const ctx = await motionContext(browser, { viewport: { width, height } }, { consent: "accepted", skipCurtain: true });
    const page = await ctx.newPage();
    await page.goto(`${server.base}/`, { waitUntil: "load", timeout: 90_000 });
    await page.waitForSelector(acceso ? '[data-corridor="storia"][data-on]' : '[data-corridor="storia"]', { state: "attached", timeout: 20_000 });
    if (!acceso) {
      const on = await page.locator('[data-corridor="storia"]').getAttribute("data-on");
      if (on !== null) guai.push(`${width}×${height}: il corridoio «storia» è acceso e qui lo si voleva spento`);
    }
    await page.waitForTimeout(1500);
    const esito = await corsa(page, PASSO);
    await ctx.close();
    if (esito.errore) {
      guai.push(`${width}×${height}: ${esito.errore}`);
      continue;
    }
    const { geometria: g } = esito;
    for (const p of esito.peggio) {
      righe.push([`${width}×${height} ${stato}`, p.nome, f1(g.segnoDestra), f1(g.rientro), p.margine === null ? "—" : f1(p.margine), p.y ?? "—", p.campioni]);
      if (p.margine !== null && p.margine < RISERVA) guai.push(`${width}×${height} ${stato}: ${p.nome} a ${f1(p.margine)} px dal segno (scroll ${p.y}), sotto la riserva di ${RISERVA} px`);
    }
    gradiniRighe.push([
      `${width}×${height} ${stato}`,
      f1(g.utile),
      g.gradini.map((s) => `${f1(s.larghezza)} (${s.righe} riga${s.righe === 1 ? "" : "he"})`).join(" · "),
      g.traboccaPannello,
      g.traboccaDoc,
      g.foto ? `${f1(g.foto.larghezza)}×${f1(g.foto.altezza)} (${g.foto.rapporto.toFixed(3)}, ${g.foto.quadro.toFixed(1)} % in quadro, w=${g.foto.servita})` : "—",
    ]);
    for (const s of g.gradini) if (s.righe !== 1) guai.push(`${width}×${height}: il gradino «${s.testo}» sta su ${s.righe} righe`);
    if (g.traboccaPannello > 0) guai.push(`${width}×${height}: il pannello trabocca di ${g.traboccaPannello} px`);
    if (g.traboccaDoc > 0) guai.push(`${width}×${height}: il documento trabocca di ${g.traboccaDoc} px`);
    console.log(`${width}×${height}: ${esito.passi} passi col segno acceso, margine minimo ${f1(Math.min(...esito.peggio.filter((p) => p.margine !== null).map((p) => p.margine)))} px`);
  }
} finally {
  await browser.close();
  await server.stop();
}

const testo = [
  `## 20 · il territorio oltre il segno (D68)`,
  ``,
  `${today()} · commit ${gitCommit()} · misure/20-territorio.mjs · corsa del corridoio «storia» su «/» a passi di ${PASSO} px, build di produzione sulla 3178.`,
  `«Margine» = bordo sinistro dell'elemento − bordo destro della scatola del segno, nei soli campioni in cui l'elemento si sovrappone in verticale al segno;`,
  `per i gradini è la scatola d'inchiostro (Range sul testo), non quella del blocco. Riserva chiesta da D68: ${RISERVA} px.`,
  ``,
  mdTable(["viewport", "elemento", "segno destra", "rientro sinistro", "margine peggiore", "a scroll", "campioni"], righe),
  ``,
  mdTable(["viewport", "larghezza utile", "gradini: inchiostro e righe", "trabocca pannello", "trabocca documento", "foto del territorio"], gradiniRighe),
  ``,
  guai.length ? `**Regole cadute:**\n${guai.map((g) => `- ${g}`).join("\n")}` : `**Regole rispettate:** ogni bersaglio oltre i ${RISERVA} px, i gradini su una riga sola, nessun traboccamento.`,
].join("\n");
appendResults(testo);
console.log(testo);
if (guai.length) process.exitCode = 1;
