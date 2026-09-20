// LA TINTA DEL PLACEHOLDER E I DATI DELL'INQUADRATURA, RILETTI DAL JSON (D78, D123, D124, D125, D126, D180, D187).
//
// Chi l'ha chiesto: D78 di A28 (Alberto, 18 set. 2026, punto 6) e D125 (la tinta come
// placeholder del riquadro prima del decode); A38 (20 set.) ha portato le scritte dentro la
// foto e D187 ha ridotto `tinte.json` al placeholder (la sola banda ALTA) e ai dati
// dell'inquadratura per rotta: `trattamento` (`testa` | `fermo`), `file`, `sorgente`,
// `objectPosition: { lg, sotto }` (T1.0, D180), `m` (D182). La banda bassa, `parallasse`,
// `ancoraggio`, `cornice` e `strato` sono morti. Com'è fatto oggi: `scripts/media/tinte.mjs`
// misura la banda con sharp sul ritaglio del telefono (390×844, `sotto`, m 0: è la foto che la
// barra `data-solid` copre scorrendo, D82) e scrive il JSON, committato; qui si RICALCOLA Y,
// ΔH′(2000) e C* di ogni valore, senza sharp, e si fallisce sotto i pavimenti di §4.3 o fuori
// dal cancello di D123. `PageHero.tsx`, che è server, emette la tinta e le due inquadrature in
// uno <style> nell'HTML iniziale: vale senza JS e con reduced-motion, e arriva anche a
// `Header.tsx`, che sta fuori dalla section.
//
// D123: sulla banda alta il cancello è la distanza di VALORE dall'avorio, ≥ 1,49:1 a due
// decimali (`CANCELLO_ALTA`, letto dallo script e non ricopiato). D124: dove il JSON dichiara
// "avorio" la pagina spedisce `--color-cream-deep`, e il pavimento si misura su quel token.
// D125 (compromesso dichiarato in D187): da lg il placeholder riusa la tinta misurata sul
// ritaglio del telefono — vive i 100-300 ms del decode. D126: `ritaglio()` decide QUALI pixel si
// misurano, quindi si prova qui; il modulo si importa senza far girare la pipeline.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CANCELLO_ALTA, SCATOLA as SCATOLA_DELLO_SCRIPT, ritaglio } from "../../../scripts/media/tinte.mjs";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");

type Banda = { hex: string; sorgente: string; Y: number; dH: number; C: number; avorio: number; misurato?: string };
type Voce = {
  trattamento: "testa" | "fermo";
  file: string;
  sorgente: [number, number];
  objectPosition: { lg: string; sotto: string };
  alta: Banda;
};
const tinte = JSON.parse(leggi("app/lib/motion/tinte.json")) as Record<string, Voce>;

/* I pavimenti di §4.3: assoluto = 4,5:1 con ink #46423d («nessuna sezione scura» detto con una
   cifra); di lavoro = 4,5:1 col rosso cupo #a30707 e con «Menu» grafite sulla barra. */
const PAVIMENTI = { assoluto: 0.4241, lavoro: 0.5329 };
const AVORIO = "#f9f5ef";

/* D124: il token che la pagina spedisce dove il JSON dichiara l'avorio, col suo valore in globals.css. */
const TOKEN_ALTA = "--color-cream-deep";
const valoreToken = (nome: string) => {
  const trovato = new RegExp(`${nome}:\\s*(#[0-9a-f]{6});`).exec(leggi("app/globals.css"));
  assert.ok(trovato, `globals.css non dichiara ${nome}`);
  return trovato[1];
};
const HEX_TOKEN_ALTA = valoreToken(TOKEN_ALTA);

/* Il repertorio di §0 del brief T: nove `testa`, due `fermo`. */
const REPERTORIO = [
  ["/vendi", "testa"],
  ["/acquista", "testa"],
  ["/servizi", "testa"],
  ["/metodo", "testa"],
  ["/open-domus", "testa"],
  ["/chi-siamo", "testa"],
  ["/recensioni", "testa"],
  ["/lavora-con-noi", "testa"],
  ["/domande-frequenti", "testa"],
  ["/privacy", "fermo"],
  ["/cookie", "fermo"],
] as const;

/* La scatola su cui lo script misura: il riquadro del telefono a riposo (D176). */
const SCATOLA = { w: 390, h: 844 };

/* Il `*Content.tsx` di ogni rotta: passa `image`, non più `objectPosition` (D180: dalla voce del JSON). */
const CONTENUTI: Record<string, string> = {
  "/vendi": "app/vendi/VendiContent.tsx",
  "/acquista": "app/acquista/AcquistaContent.tsx",
  "/servizi": "app/servizi/ServiziContent.tsx",
  "/metodo": "app/metodo/MetodoContent.tsx",
  "/open-domus": "app/open-domus/OpenDomusPageContent.tsx",
  "/chi-siamo": "app/chi-siamo/ChiSiamoContent.tsx",
  "/recensioni": "app/recensioni/RecensioniContent.tsx",
  "/lavora-con-noi": "app/lavora-con-noi/LavoraConNoiContent.tsx",
  "/domande-frequenti": "app/domande-frequenti/FaqContent.tsx",
  "/privacy": "app/privacy/PrivacyContent.tsx",
  "/cookie": "app/cookie/CookieContent.tsx",
};

/** Commenti via prima di cercare, come logo-colore.test.ts. */
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

/** Il blocco `<PageHero … />` di un file di contenuto, senza commenti. */
function bloccoPageHero(file: string): string {
  const t = soloCodice(leggi(file));
  const i = t.indexOf("<PageHero");
  assert.notEqual(i, -1, `${file}: nessun <PageHero`);
  return t.slice(i, t.indexOf("/>", i) + 2);
}

const lineare = (v: number) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
const daHex = (h: string) => [1, 3, 5].map((i) => lineare(parseInt(h.slice(i, i + 2), 16)));
const lumaY = (lin: number[]) => 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
const contrasto = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const Y_AVORIO = lumaY(daHex(AVORIO));

/** Lab D65 dalla luce lineare sRGB: serve per C* e per il ΔH′ della CIEDE2000. */
function lab(lin: number[]): [number, number, number] {
  const [r, g, b] = lin;
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const croma = (lin: number[]) => {
  const [, a, b] = lab(lin);
  return Math.hypot(a, b);
};

/** ΔH′ della CIEDE2000 — la differenza di TINTA, l'asse della parentela (§4.2). */
function deltaH(lin1: number[], lin2: number[]): number {
  const [, a1, b1] = lab(lin1);
  const [, a2, b2] = lab(lin2);
  const cBar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g = 0.5 * (1 - Math.sqrt(cBar ** 7 / (cBar ** 7 + 25 ** 7)));
  const [ap1, ap2] = [a1 * (1 + g), a2 * (1 + g)];
  const [cp1, cp2] = [Math.hypot(ap1, b1), Math.hypot(ap2, b2)];
  if (cp1 * cp2 === 0) return 0;
  const gradi = (y: number, x: number) => ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  let dh = gradi(b2, ap2) - gradi(b1, ap1);
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return Math.abs(2 * Math.sqrt(cp1 * cp2) * Math.sin((dh * Math.PI) / 360));
}

/** Le metriche RICALCOLATE da un colore, contro la banda sorgente. */
function metriche(h: string, sorgente: string) {
  const lin = daHex(h);
  const y = lumaY(lin);
  return { y, c: croma(lin), dh: deltaH(lin, daHex(sorgente)), av: contrasto(y, Y_AVORIO) };
}
/** Il colore su cui lo script ha DECISO (la tinta, o il numero misurato di chi dichiara l'avorio). */
const decisa = (b: Banda) => metriche(b.misurato ?? b.hex, b.sorgente);
/** Il colore che la pagina SPEDISCE: la tinta, o il token risolto al suo hex (D124). */
const spedita = (b: Banda) => metriche(b.hex === "avorio" ? HEX_TOKEN_ALTA : b.hex, b.sorgente);

describe("la tinta del placeholder e i dati dell'inquadratura (D187, §4)", () => {
  test("undici voci, una per testa, col trattamento del repertorio, la foto che esiste e nessun campo morto", () => {
    assert.deepEqual(Object.keys(tinte), REPERTORIO.map(([r]) => r));
    for (const [rotta, trattamento] of REPERTORIO) {
      const v = tinte[rotta];
      assert.equal(v.trattamento, trattamento, `${rotta}: trattamento fuori dal repertorio di §0`);
      assert.ok(existsSync(join(ROOT, "public", v.file)), `${rotta}: manca public${v.file}`);
      assert.deepEqual(Object.keys(v).sort(), ["alta", "file", "objectPosition", "sorgente", "trattamento"], `${rotta}: campi`);
    }
    // La scatola con cui lo script misura è quella dichiarata qui, non un'altra.
    assert.deepEqual(SCATOLA_DELLO_SCRIPT, SCATOLA, "la scatola di scripts/media/tinte.mjs non è il riquadro del telefono");
  });

  test("objectPosition.lg e .sotto nella forma `N% N%`; sorgente ≥ 1920 (il margine `m` è morto con A41)", () => {
    for (const [rotta] of REPERTORIO) {
      const v = tinte[rotta];
      assert.match(v.objectPosition.lg, /^\d+% \d+%$/, `${rotta}: objectPosition.lg`);
      assert.match(v.objectPosition.sotto, /^\d+% \d+%$/, `${rotta}: objectPosition.sotto`);
      assert.ok(v.sorgente[0] >= 1920 && v.sorgente[1] >= 1000, `${rotta}: sorgente ${v.sorgente.join("×")}`);
    }
    // D173 (/metodo resta 30% 50%), D181 (hero_02 su /lavora-con-noi), D173 (piscina-lusso su /domande-frequenti).
    assert.equal(tinte["/metodo"].objectPosition.lg, "30% 50%");
    assert.equal(tinte["/lavora-con-noi"].file, "/images/hero_02_attico_travi_living.jpg");
    assert.deepEqual(tinte["/lavora-con-noi"].sorgente, [1920, 1067]);
    assert.equal(tinte["/domande-frequenti"].file, "/images/reali/piscina-lusso.jpg");
    assert.deepEqual(tinte["/domande-frequenti"].sorgente, [1920, 1280]);
  });

  test("ogni valore è un colore a sei cifre, o l'avorio dichiarato col numero misurato", () => {
    for (const [rotta, v] of Object.entries(tinte)) {
      const b = v.alta;
      if (b.hex === "avorio") {
        assert.match(b.misurato ?? "", /^#[0-9a-f]{6}$/, `${rotta}: l'avorio va dichiarato col numero misurato`);
      } else {
        assert.match(b.hex, /^#[0-9a-f]{6}$/, `${rotta}: ${b.hex} non è un colore a sei cifre`);
        assert.equal(b.misurato, undefined, `${rotta}: \`misurato\` esiste solo quando la rotta dichiara l'avorio`);
      }
      assert.match(b.sorgente, /^#[0-9a-f]{6}$/, `${rotta}: la banda sorgente non è un colore a sei cifre`);
    }
  });

  test("Y, C* e ΔH′ del JSON sono quelli che si ricalcolano dal valore", () => {
    for (const [rotta, v] of Object.entries(tinte)) {
      const m = decisa(v.alta);
      assert.ok(Math.abs(m.y - v.alta.Y) < 5e-5, `${rotta}: Y dichiarata ${v.alta.Y}, ricalcolata ${m.y.toFixed(4)}`);
      assert.ok(Math.abs(m.c - v.alta.C) < 5e-3, `${rotta}: C* dichiarato ${v.alta.C}, ricalcolato ${m.c.toFixed(2)}`);
      assert.ok(Math.abs(m.dh - v.alta.dH) < 5e-3, `${rotta}: ΔH′ dichiarato ${v.alta.dH}, ricalcolato ${m.dh.toFixed(2)}`);
      assert.ok(Math.abs(m.av - v.alta.avorio) < 5e-4, `${rotta}: distanza dall'avorio dichiarata ${v.alta.avorio}, ricalcolata ${m.av.toFixed(3)}`);
    }
  });

  test("i pavimenti di chiarezza, sul valore che la pagina spedisce: nessuna sezione scura (§4.3, D124)", () => {
    assert.equal(HEX_TOKEN_ALTA, "#f4ece2", "il token dell'avorio di D124 non vale più quel che valeva");
    const scuro = lumaY(daHex("#aeaeae"));
    for (const [rotta, v] of Object.entries(tinte)) {
      const y = spedita(v.alta).y;
      assert.ok(y >= PAVIMENTI.assoluto, `${rotta}: Y ${y.toFixed(4)} sotto il pavimento assoluto ${PAVIMENTI.assoluto}`);
      assert.ok(y > scuro - 1e-3, `${rotta}: più scura del neutro più scuro ammesso (#aeaeae)`);
      assert.ok(y >= PAVIMENTI.lavoro, `${rotta}: Y ${y.toFixed(4)} sotto il pavimento di lavoro (la barra porta «Menu» grafite)`);
    }
  });

  test("parentela: ΔH′(2000) dalla banda sorgente sempre <= 5 (§4.4)", () => {
    for (const [rotta, v] of Object.entries(tinte)) {
      const dh = decisa(v.alta).dh;
      assert.ok(dh <= 5, `${rotta}: ΔH′ ${dh.toFixed(2)} — non è più la tinta di quella fotografia`);
    }
  });

  test(`il cancello della banda alta: distanza di valore >= ${CANCELLO_ALTA}:1 dall'avorio (D123)`, () => {
    assert.equal(CANCELLO_ALTA, 1.49, "D123: la soglia della banda alta è 1,49:1, a due decimali");
    for (const [rotta, v] of Object.entries(tinte)) {
      const alta = decisa(v.alta);
      if (v.alta.hex === "avorio") {
        assert.ok(alta.av < CANCELLO_ALTA, `${rotta}: dichiara l'avorio ma sta a ${alta.av.toFixed(4)}:1, cioè è una tinta`);
      } else {
        assert.ok(alta.av >= CANCELLO_ALTA, `${rotta}: ${v.alta.hex} sta a ${alta.av.toFixed(4)}:1 dall'avorio, sotto il cancello di D123`);
      }
    }
  });

  test("ritaglio(): il cover del riquadro del telefono, in pixel sorgente (D126)", () => {
    // Una 3:2 larga 2560 in 390×844: la scala la decide l'altezza (844 / 1707 = 0,4944), si vedono 789
    // colonne su 2560 e a «75%» si parte da (2560 − 789) × 0,75 = 1328; tutte le 1707 righe.
    assert.deepEqual(ritaglio(2560, 1707, SCATOLA, "75% 50%"), { left: 1328, top: 0, width: 789, height: 1707 });
    assert.deepEqual(ritaglio(2560, 1707, SCATOLA, "0% 50%"), { left: 0, top: 0, width: 789, height: 1707 });
    assert.deepEqual(ritaglio(2560, 1707, SCATOLA, "100% 0%"), { left: 1771, top: 0, width: 789, height: 1707 });
    // Una 16:9 larga 2560: 844 / 1440 = 0,5861, 665 colonne; a «50%» da 948.
    assert.deepEqual(ritaglio(2560, 1440, SCATOLA, "50% 50%"), { left: 948, top: 0, width: 665, height: 1440 });
    // Una 1,8 larga 1920 (hero): 844 / 1067 = 0,791, 493 colonne; a «0%» da 0.
    assert.deepEqual(ritaglio(1920, 1067, SCATOLA, "0% 25%"), { left: 0, top: 0, width: 493, height: 1067 });
    // Orizzontale (844×390): la scala la decide la larghezza; con una 3:2 si vedono 1183 righe su 1707, a «50%» dalla 262.
    assert.deepEqual(ritaglio(2560, 1707, { w: 844, h: 390 }, "50% 50%"), { left: 0, top: 262, width: 2560, height: 1183 });
  });

  test("importare lo script non fa girare la pipeline (D126)", () => {
    const json = join(ROOT, "app/lib/motion/tinte.json");
    const prima = statSync(json).mtimeMs;
    const figlio = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", "const m = await import('./scripts/media/tinte.mjs'); console.log(Object.keys(m).sort().join(','));", "app/lib/__tests__/tinte.test.ts"],
      { cwd: ROOT, encoding: "utf8", timeout: 30_000 },
    );
    assert.equal(figlio.status, 0, figlio.stderr);
    assert.equal(figlio.stdout.trim(), "CANCELLO_ALTA,SCATOLA,ritaglio", "l'import ha stampato altro: la pipeline è partita");
    assert.equal(statSync(json).mtimeMs, prima, "l'import ha riscritto tinte.json");
  });

  test("la fotografia del JSON è quella che il *Content.tsx passa a PageHero; l'inquadratura non si passa più (D180)", () => {
    for (const [rotta, file] of Object.entries(CONTENUTI)) {
      const blocco = bloccoPageHero(file);
      const foto = /\bimage="([^"]+)"/.exec(blocco);
      assert.ok(foto, `${file}: il blocco <PageHero non passa image="…"`);
      assert.equal(foto[1], tinte[rotta].file, `${file}: image ${foto[1]} contro ${tinte[rotta].file} in tinte.json — rigenera con node scripts/media/tinte.mjs`);
      for (const morta of ["objectPosition", "srcWidth", "sigla", "scriptInset"]) assert.doesNotMatch(blocco, new RegExp(`\\b${morta}\\b`), `${file}: la prop ${morta} è morta (D180, D196)`);
      assert.doesNotMatch(soloCodice(leggi(file)), /band-positions/, `${file}: band-positions.json è morto`);
    }
  });

  test("PageHero resta server ed emette la tinta e le due inquadrature nell'HTML iniziale (§4.5, D180)", () => {
    const hero = soloCodice(leggi("app/components/PageHero.tsx"));
    assert.doesNotMatch(hero, /["']use client["']/, "PageHero resta server: niente hook, niente use client");
    assert.doesNotMatch(hero, /\buse[A-Z]\w*\(/, "PageHero resta server: nessun hook");
    assert.match(hero, /import tinte from "\.\.\/lib\/motion\/tinte\.json"/, "PageHero non legge tinte.json");
    assert.match(hero, /<style>/, "PageHero non emette lo <style>");
    assert.match(hero, /--dt-tinta-alta/);
    assert.doesNotMatch(hero, /--dt-tinta-bassa/, "la tinta bassa è morta (D187)");
    assert.match(hero, /--dt-op-lg/, "lo <style> non scrive --dt-op-lg");
    assert.match(hero, /--dt-op-sotto/, "lo <style> non scrive --dt-op-sotto");
    assert.doesNotMatch(hero, /--dt-testa-mf/, "lo <style> scrive ancora --dt-testa-mf (A41: nessun margine)");
    // L'avorio non è un hex nel JSON: arriva come il token della sua ZONA (D124).
    assert.match(hero, new RegExp(`tintaCss\\(tinta\\.alta,\\s*"var\\(${TOKEN_ALTA}\\)"\\)`), `l'avorio della banda alta deve uscire come var(${TOKEN_ALTA})`);
    assert.match(hero, /rotta:\s*keyof typeof tinte/, "la rotta non è tipata sulle chiavi di tinte.json");
    assert.doesNotMatch(hero, /objectPosition\s*[=:]/, "PageHero non prende più objectPosition come prop (D180)");
  });

  test("il placeholder tinto sta sul solo riquadro della testa; i moduli media restano cream-deep (§4.2, D125)", () => {
    const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
    const modulo = /\.dt-media-full\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    assert.match(modulo, /background-color:\s*var\(--color-cream-deep\);/, "il modulo .dt-media-full non ha più il fondo di oggi");
    assert.doesNotMatch(modulo, /--dt-tinta-alta/, "la tinta della testa è finita su tutti i moduli media della rotta");
    assert.doesNotMatch(css, /\.dt-media-full\[data-dive-zoom\]/, "la regola della banda del tuffo è morta con PageHeroBand (D196)");
    const testa = /\.dt-testa_riquadro\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    assert.match(testa, /background-color:\s*var\(--dt-tinta-alta,\s*var\(--color-cream-deep\)\)/, "il lampo avorio prima della decodifica resta sul riquadro della testa");
    // Il riquadro della testa porta davvero il gancio, sullo stesso tag della scatola.
    assert.match(soloCodice(leggi("app/components/motion/PageHeroTesta.tsx")), /<div[^>]*\bdata-dive-zoom\b[^>]*className="dt-testa_riquadro\b/);
    for (const f of ["CostiChiari", "HorizonStory", "Voci", "FeaturedTestimonial", "EditorialRows", "Method"]) {
      const p = `app/components/${f}.tsx`;
      assert.doesNotMatch(soloCodice(leggi(p)), /data-dive-zoom/, `${p} prenderebbe la tinta della testa`);
    }
  });

  test("lo script non usa mai stats().dominant (§4.5)", () => {
    const mjs = leggi("scripts/media/tinte.mjs");
    assert.doesNotMatch(soloCodice(mjs), /\.dominant/, "stats().dominant dà #080808 su villa-uliveto e villa-lettini: un nero");
    assert.match(mjs, /sharp/);
  });
});
