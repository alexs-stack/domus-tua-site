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
//
// IL CIELO MASCHERATO (A46 di Alberto, 21 set. 2026, sera: «su eraresidence questa foto che usa
// come background alta ha il cielo mascherato, è no bg … dobbiamo fare la stessa cosa nel nostro
// sito, dove ci sono le immagini così alte»). `scripts/media/cielo.mjs` taglia il cielo delle
// teste in `<nome>-cielo.webp` con alpha e `tinte.mjs` scrive per rotta `cielo: { file, linea,
// cima }`; col cielo trasparente il fondo del riquadro si vede attraverso la foto per sempre,
// quindi la tinta alta è "avorio" per forza e PageHero la traduce nel FONDO PAGINA
// (`--color-cream`, non più `--color-cream-deep`: D124 vale ancora per l'idea, il token cambia).
// Qui si legge il WebP nei byte (VP8X con l'alpha, nessun chunk ICCP/EXIF/XMP) e con sharp (la
// prima riga trasparente, l'ultima opaca), e si pinnano le due misure.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { CANCELLO_ALTA, SCATOLA as SCATOLA_DELLO_SCRIPT, SEGNO, misuraSegno, ritaglio } from "../../../scripts/media/tinte.mjs";
import { FOTO as CIELI, fileCielo, misuraCielo } from "../../../scripts/media/cielo.mjs";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");

type Banda = { hex: string; sorgente: string; Y: number; dH: number; C: number; avorio: number; misurato?: string };
type Cielo = { file: string | null; linea: number; cima: number };
type Voce = {
  trattamento: "testa" | "fermo";
  file: string;
  sorgente: [number, number];
  objectPosition: { lg: string; sotto: string };
  alta: Banda;
  cielo: Cielo;
  /** Le bande del segno (22 set. 2026, C01/G02): dove, nella striscia del segno, la foto è opaca e scura. */
  segno: Array<[number, number]>;
};
const tinte = JSON.parse(leggi("app/lib/motion/tinte.json")) as Record<string, Voce>;

/* I pavimenti di §4.3: assoluto = 4,5:1 con ink #46423d («nessuna sezione scura» detto con una
   cifra); di lavoro = 4,5:1 col rosso cupo #a30707 e con «Menu» grafite sulla barra. */
const PAVIMENTI = { assoluto: 0.4241, lavoro: 0.5329 };
const AVORIO = "#f9f5ef";

/* D124: il token che la pagina spedisce dove il JSON dichiara l'avorio, col suo valore in
   globals.css. A46: è il FONDO PAGINA, perché col cielo trasparente il riquadro non deve
   staccare dalla carta. */
const TOKEN_ALTA = "--color-cream";
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
      assert.deepEqual(Object.keys(v).sort(), ["alta", "cielo", "file", "objectPosition", "segno", "sorgente", "trattamento"], `${rotta}: campi`);
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
    // A44: le nove foto alte (2560×3816) con la cima a riposo da lg; D173/D181 superate.
    assert.equal(tinte["/metodo"].objectPosition.lg, "50% 0%");
    assert.equal(tinte["/lavora-con-noi"].file, "/images/reali/attico-studio-alta.jpg");
    assert.deepEqual(tinte["/lavora-con-noi"].sorgente, [2560, 3816]);
    assert.equal(tinte["/domande-frequenti"].file, "/images/reali/villa-piscina-lunga-alta.jpg");
    assert.deepEqual(tinte["/domande-frequenti"].sorgente, [2560, 3816]);
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
    assert.equal(HEX_TOKEN_ALTA, "#f9f5ef", "il token dell'avorio (A46: il fondo pagina) non vale più quel che valeva");
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

  test(`il cancello della banda alta: distanza di valore >= ${CANCELLO_ALTA}:1 dall'avorio (D123); col cielo trasparente l'avorio è per forza (A46)`, () => {
    assert.equal(CANCELLO_ALTA, 1.49, "D123: la soglia della banda alta è 1,49:1, a due decimali");
    for (const [rotta, v] of Object.entries(tinte)) {
      const alta = decisa(v.alta);
      if (v.cielo.file) {
        // Il fondo del riquadro si vede attraverso il cielo per sempre: sulla tenda di /open-domus la
        // banda misurata è la tenda (1,66:1 dall'avorio), e la tinta è l'avorio lo stesso.
        assert.equal(v.alta.hex, "avorio", `${rotta}: il cielo è trasparente e la tinta alta non è l'avorio`);
        continue;
      }
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
    assert.equal(figlio.stdout.trim(), "CANCELLO_ALTA,SCATOLA,SEGNO,misuraSegno,ritaglio", "l'import ha stampato altro: la pipeline è partita");
    assert.equal(statSync(json).mtimeMs, prima, "l'import ha riscritto tinte.json");
    // A46: lo stesso per cielo.mjs, che tinte.mjs importa: nessun WebP riscritto.
    const webp = join(ROOT, "public", tinte["/vendi"].cielo.file ?? "");
    const primaWebp = existsSync(webp) ? statSync(webp).mtimeMs : null;
    const figlioCielo = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", "const m = await import('./scripts/media/cielo.mjs'); console.log(Object.keys(m).sort().join(','));", "app/lib/__tests__/tinte.test.ts"],
      { cwd: ROOT, encoding: "utf8", timeout: 30_000 },
    );
    assert.equal(figlioCielo.status, 0, figlioCielo.stderr);
    assert.equal(figlioCielo.stdout.trim(), "FOTO,fileCielo,misuraCielo", "l'import di cielo.mjs ha stampato altro: la pipeline è partita");
    assert.equal(existsSync(webp) ? statSync(webp).mtimeMs : null, primaWebp, "l'import di cielo.mjs ha riscritto un WebP");
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
    // L'avorio non è un hex nel JSON: arriva come token (D124), e dal cielo mascherato è il fondo
    // pagina (A46): col cielo trasparente il riquadro non deve staccare dalla carta.
    assert.match(hero, new RegExp(`tintaCss\\(tinta\\.alta,\\s*"var\\(${TOKEN_ALTA}\\)"\\)`), `l'avorio della banda alta deve uscire come var(${TOKEN_ALTA})`);
    assert.doesNotMatch(hero, /tintaCss\([^)]*cream-deep/, "il placeholder del cielo trasparente non può essere cream-deep (A46)");
    assert.match(hero, /rotta:\s*keyof typeof tinte/, "la rotta non è tipata sulle chiavi di tinte.json");
    assert.doesNotMatch(hero, /objectPosition\s*[=:]/, "PageHero non prende più objectPosition come prop (D180)");
  });

  test("il placeholder tinto sta sul solo strato della foto (A46); il riquadro è la carta; i moduli media restano cream-deep, tranne la finestra col cielo (§4.2, D125)", () => {
    const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
    const modulo = /\.dt-media-full\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    assert.match(modulo, /background-color:\s*var\(--color-cream-deep\);/, "il modulo .dt-media-full non ha più il fondo di oggi");
    assert.doesNotMatch(modulo, /--dt-tinta-alta/, "la tinta della testa è finita su tutti i moduli media della rotta");
    assert.doesNotMatch(css, /\.dt-media-full\[data-dive-zoom\]/, "la regola della banda del tuffo è morta con PageHeroBand (D196)");
    // A46: il riquadro è la carta (col cielo trasparente si vede attraverso la foto per sempre); il lampo
    // prima del decode (D125) sta sullo strato della foto e ricade sull'avorio, mai su cream-deep.
    const riquadro = /\.dt-testa_riquadro\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    assert.match(riquadro, /background-color:\s*var\(--color-cream\);/, "il riquadro della testa non è la carta (A46)");
    assert.doesNotMatch(riquadro, /--dt-tinta-alta|cream-deep/, "la tinta del placeholder sta sullo strato, non sul riquadro (A46)");
    const scatola = /\.dt-testa_foto\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    assert.match(scatola, /background-color:\s*var\(--dt-tinta-alta,\s*var\(--color-cream\)\)/, "il lampo prima della decodifica non sta sulla scatola della foto (D125, A46, A48)");
    assert.doesNotMatch(/\.dt-testa_strato\s*\{[^}]*\}/.exec(css)?.[0] ?? "", /background-color/, "la tinta sullo strato colorerebbe lo spazio sotto la foto (A48)");
    // La finestra di Open Domus mostra il cielo trasparente: il suo modulo prende la carta, non cream-deep.
    const finestra = /\.dt-od_window\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    assert.match(finestra, /background-color:\s*var\(--color-cream\);/, "la finestra col cielo trasparente non posa sulla carta (A46)");
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

/* IL CIELO MASCHERATO (A46). I chunk di un WebP: RIFF, "WEBP", poi FourCC + lunghezza LE; VP8X
   porta i flag (0x20 ICC, 0x10 alpha, 0x08 Exif, 0x04 XMP) e il canvas (larghezza−1, altezza−1
   su 24 bit). Un lossy con alpha è VP8X + ALPH + VP8. */
type WebpInfo = { w: number; h: number; alpha: boolean; chunks: string[]; metadati: string[] };
function webpInfo(buf: Buffer): WebpInfo {
  assert.equal(buf.subarray(0, 4).toString("latin1"), "RIFF", "non è un RIFF");
  assert.equal(buf.subarray(8, 12).toString("latin1"), "WEBP", "non è un WebP");
  const out: WebpInfo = { w: 0, h: 0, alpha: false, chunks: [], metadati: [] };
  let i = 12;
  while (i + 8 <= buf.length) {
    const fourcc = buf.subarray(i, i + 4).toString("latin1");
    const len = buf.readUInt32LE(i + 4);
    out.chunks.push(fourcc);
    if (fourcc === "VP8X") {
      const flag = buf[i + 8];
      out.alpha = (flag & 0x10) !== 0;
      out.w = buf.readUIntLE(i + 12, 3) + 1;
      out.h = buf.readUIntLE(i + 15, 3) + 1;
      if (flag & 0x20) out.metadati.push("ICC (flag)");
      if (flag & 0x08) out.metadati.push("Exif (flag)");
      if (flag & 0x04) out.metadati.push("XMP (flag)");
    }
    if (fourcc === "ICCP" || fourcc === "EXIF" || fourcc === "XMP ") out.metadati.push(fourcc.trim());
    if (fourcc === "ALPH") out.alpha = true;
    i += 8 + len + (len % 2);
  }
  return out;
}

/** Le frazioni di pixel trasparenti (alpha < 128) della prima riga e opachi (alpha = 255) dell'ultima. */
async function righeEstreme(percorso: string) {
  const { data, info } = await sharp(percorso).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  let trasparentiPrima = 0;
  let opachiUltima = 0;
  let cielo = 0;
  for (let x = 0; x < W; x++) {
    if (data[x * 4 + 3] < 128) trasparentiPrima++;
    if (data[((H - 1) * W + x) * 4 + 3] === 255) opachiUltima++;
  }
  for (let i = 3; i < data.length; i += 4) if (data[i] < 128) cielo++;
  return { W, H, trasparentiPrima: trasparentiPrima / W, opachiUltima: opachiUltima / W, cielo: cielo / (W * H), meta: await sharp(percorso).metadata() };
}

/* Le sette teste col cielo e la frazione minima di prima riga trasparente. La tenda di /open-domus
   copre TUTTA la cima: il cielo è una tasca a destra e una striscia fra i pilastri (il 6,8 % dei
   pixel), la prima riga è opaca e `linea` e `cima` valgono 0 come su un interno; su /recensioni
   il muro a sinistra tocca il bordo alto (prima riga trasparente all'85 %); sulle altre cinque
   almeno il 90 %. Su tutte almeno il 4 % dei pixel è cielo. */
const PRIMA_RIGA: Record<string, number> = {
  "/vendi": 0.9,
  "/acquista": 0.9,
  "/servizi": 0.9,
  "/metodo": 0.9,
  "/open-domus": 0,
  "/recensioni": 0.8,
  "/domande-frequenti": 0.9,
};
const CIELO_MINIMO = 0.04;
/* I due attici sono interni: nessun cielo, nessun WebP, linea e cima 0. */
const INTERNI = ["/chi-siamo", "/lavora-con-noi"];

describe("il cielo mascherato delle foto alte (A46)", () => {
  test("la tabella di cielo.mjs copre le nove teste con la loro foto e la finestra di Open Domus", () => {
    for (const [rotta, trattamento] of REPERTORIO) {
      const f = CIELI.find((c) => c.uso === rotta);
      if (trattamento === "fermo") {
        assert.equal(f, undefined, `${rotta}: i legali restano fermi sulla loro foto, senza cielo`);
        continue;
      }
      assert.ok(f, `${rotta}: manca nella tabella FOTO di cielo.mjs`);
      assert.equal(`/images/reali/${f.nome}.jpg`, tinte[rotta].file, `${rotta}: la sorgente di cielo.mjs non è la foto di tinte.json`);
      if (INTERNI.includes(rotta)) assert.equal(f.classe, "interno", `${rotta}: è un interno`);
      else assert.ok(["giorno", "sera"].includes(f.classe), `${rotta}: classe ${f.classe}`);
    }
    // A47 (22 set. 2026): la finestra monta la facciata che SALE, 9:16, col cielo di giorno.
    const finestra = CIELI.find((c) => c.nome === "villa-facciata-sale-alta");
    assert.ok(finestra && finestra.classe === "giorno", "la finestra di Open Domus (villa-facciata-sale-alta) manca o non è nella classe del giorno");
    // La finestra monta il WebP col cielo trasparente (A46) letto da finestra.json (scripts/media/finestra.mjs),
    // non un percorso scritto a mano (A47).
    const finestraJson = JSON.parse(leggi("app/lib/motion/finestra.json")) as { file: string };
    assert.equal(finestraJson.file, fileCielo(finestra!), "finestra.json non porta il WebP col cielo della facciata che sale (A47)");
    const od = soloCodice(leggi("app/components/OpenDomus.tsx"));
    assert.match(od, /import foto from "\.\.\/lib\/motion\/finestra\.json"/, "OpenDomus.tsx non legge finestra.json (A47)");
    assert.doesNotMatch(od, /villa-terrazze-glicine|villa-facciata-sale-alta\.(jpg|webp)/, "OpenDomus.tsx monta ancora un file a mano: il file sta in finestra.json (A47)");
  });

  test("le nove teste montano il WebP col cielo dove c'è: PageHero passa `tinta.cielo.file ?? image` (A46)", () => {
    assert.match(soloCodice(leggi("app/components/PageHero.tsx")), /src=\{tinta\.cielo\.file \?\? image\}/, "PageHero non passa il WebP col cielo a PageHeroTesta");
    for (const rotta of Object.keys(PRIMA_RIGA)) assert.ok(tinte[rotta].cielo.file, `${rotta}: senza cielo.file la testa monterebbe il JPEG`);
  });

  test("ogni rotta con cielo ha il WebP: esiste, alpha, stessa misura della sorgente, nessun metadato; linea fra 0,05 e 0,7, cima <= linea", () => {
    for (const rotta of Object.keys(PRIMA_RIGA)) {
      const v = tinte[rotta];
      const f = CIELI.find((c) => c.uso === rotta)!;
      assert.equal(v.cielo.file, fileCielo(f), `${rotta}: cielo.file non è il WebP di cielo.mjs`);
      assert.match(v.cielo.file ?? "", /^\/images\/reali\/[a-z-]+-cielo\.webp$/, `${rotta}: il nome del WebP`);
      const percorso = join(ROOT, "public", v.cielo.file!);
      assert.ok(existsSync(percorso), `${rotta}: manca public${v.cielo.file} — lancia node scripts/media/cielo.mjs`);
      const w = webpInfo(readFileSync(percorso));
      assert.ok(w.alpha, `${rotta}: il WebP non ha l'alpha (chunk ${w.chunks.join(",")})`);
      assert.deepEqual([w.w, w.h], v.sorgente, `${rotta}: il WebP è ${w.w}×${w.h}, la sorgente ${v.sorgente.join("×")}`);
      assert.deepEqual(w.metadati, [], `${rotta}: il WebP porta metadati`);
      const minimo = PRIMA_RIGA[rotta] > 0 ? 0.05 : 0;
      assert.ok(v.cielo.linea >= minimo && v.cielo.linea <= 0.7, `${rotta}: linea del cielo ${v.cielo.linea} fuori da ${minimo}-0,7`);
      assert.ok(v.cielo.cima >= 0 && v.cielo.cima <= v.cielo.linea, `${rotta}: cima ${v.cielo.cima} sopra la linea ${v.cielo.linea}`);
      assert.equal(v.cielo.linea, Number(v.cielo.linea.toFixed(3)), `${rotta}: linea a più di tre decimali`);
    }
  });

  test("i due attici interni: nessun cielo, nessun WebP, linea e cima 0; i due legali senza cielo", () => {
    for (const rotta of INTERNI) {
      const v = tinte[rotta];
      assert.deepEqual(v.cielo, { file: null, linea: 0, cima: 0 }, `${rotta}: è un interno`);
      assert.equal(existsSync(join(ROOT, "public", v.file.replace(/\.jpg$/, "-cielo.webp"))), false, `${rotta}: un WebP del cielo per un interno`);
      assert.notEqual(v.alta.hex, "avorio", `${rotta}: senza cielo la tinta resta misurata (D123)`);
    }
    for (const rotta of ["/privacy", "/cookie"]) assert.deepEqual(tinte[rotta].cielo, { file: null, linea: 0, cima: 0 }, `${rotta}: i legali sono fermi`);
  });

  test("nel WebP la prima riga è trasparente (il cielo) e l'ultima tutta opaca (il giardino); sharp vede l'alpha", async () => {
    for (const [rotta, minimo] of Object.entries(PRIMA_RIGA)) {
      const v = tinte[rotta];
      const r = await righeEstreme(join(ROOT, "public", v.cielo.file!));
      assert.equal(r.meta.hasAlpha, true, `${rotta}: sharp non vede l'alpha`);
      assert.equal(r.meta.format, "webp", `${rotta}: formato ${r.meta.format}`);
      assert.ok(r.trasparentiPrima >= minimo, `${rotta}: la prima riga è trasparente al ${(100 * r.trasparentiPrima).toFixed(1)} %, attesi ≥ ${100 * minimo} %`);
      assert.equal(r.opachiUltima, 1, `${rotta}: l'ultima riga è opaca al ${(100 * r.opachiUltima).toFixed(1)} %`);
      assert.ok(r.cielo >= CIELO_MINIMO, `${rotta}: solo il ${(100 * r.cielo).toFixed(1)} % dei pixel è cielo`);
    }
  });

  test("la finestra di Open Domus: villa-facciata-sale-alta-cielo.webp, 9:16 come la sorgente, alpha, senza metadati (A47)", async () => {
    const f = CIELI.find((c) => c.nome === "villa-facciata-sale-alta")!;
    const percorso = join(ROOT, "public", fileCielo(f)!);
    assert.ok(existsSync(percorso), `manca ${fileCielo(f)}`);
    const sorgente = await sharp(join(ROOT, "public/images/reali/villa-facciata-sale-alta.jpg")).metadata();
    const w = webpInfo(readFileSync(percorso));
    assert.ok(w.alpha, "il WebP della finestra non ha l'alpha");
    assert.deepEqual([w.w, w.h], [sorgente.width, sorgente.height]);
    assert.deepEqual([w.w, w.h], [2160, 3870], "la facciata che sale è il corridoio 9:16 di foto-alte.mjs");
    // finestra.json (scripts/media/finestra.mjs) porta la stessa sorgente: il CSS della finestra ne legge il rapporto.
    const finestraJson = JSON.parse(leggi("app/lib/motion/finestra.json")) as { sorgente: number[] };
    assert.deepEqual(finestraJson.sorgente, [w.w, w.h], "finestra.json non porta la misura del WebP montato");
    // La 3:2 col glicine di A45/A46 non ha più il WebP: è una scena di riserva.
    assert.equal(existsSync(join(ROOT, "public/images/reali/villa-terrazze-glicine-cielo.webp")), false, "il WebP della facciata col glicine è rimasto su disco senza lettori");
    assert.deepEqual(w.metadati, []);
    const r = await righeEstreme(percorso);
    assert.ok(r.trasparentiPrima >= 0.9, `la prima riga è trasparente al ${(100 * r.trasparentiPrima).toFixed(1)} %`);
    assert.equal(r.opachiUltima, 1, `l'ultima riga è opaca al ${(100 * r.opachiUltima).toFixed(1)} %`);
  });

  test("misuraCielo(): linea dove meno del 5 % è trasparente, cima dove almeno il 5 % è opaco", () => {
    // 100×100: le prime 20 righe tutte cielo; dalle righe 20-49 un cipresso largo 10 (10 % opaco);
    // dalla 50 in giù tutto opaco tranne 3 colonne di cielo (3 % trasparente) fino alla 59; poi pieno.
    const W = 100;
    const H = 100;
    const alpha = new Uint8Array(W * H);
    for (let y = 20; y < H; y++) for (let x = 0; x < W; x++) alpha[y * W + x] = y < 50 ? (x < 10 ? 255 : 0) : y < 60 ? (x < 97 ? 255 : 0) : 255;
    assert.deepEqual(misuraCielo(alpha, W, H), { linea: 0.5, cima: 0.2 });
    // Un cipresso largo 4 (4 %) non fa cima: sotto il 5 %.
    for (let y = 20; y < 50; y++) for (let x = 4; x < 10; x++) alpha[y * W + x] = 0;
    assert.deepEqual(misuraCielo(alpha, W, H), { linea: 0.5, cima: 0.5 });
    // Tutto opaco: 0 e 0. Tutto trasparente: 1 e 1 (il soggetto non comincia mai).
    assert.deepEqual(misuraCielo(new Uint8Array(W * H).fill(255), W, H), { linea: 0, cima: 0 });
    assert.deepEqual(misuraCielo(new Uint8Array(W * H), W, H), { linea: 1, cima: 1 });
  });
});

// ── Le bande del segno (revisione avversaria di A46, 22 set. 2026: C01, G02) ──────────────────────
// Il marcatore `foto` del segno partiva dalla cima del soggetto su tutta la larghezza: dove nella
// striscia del segno (2-6 % della larghezza, MarkSegno.tsx) c'era cielo trasparente o un muro bianco, le
// tacche viravano all'avorio sull'avorio e sparivano per 100-940 px di scroll. tinte.mjs misura le corse
// in cui quella striscia è opaca e scura (Y < 0,30) e PageHeroTesta rende un marcatore per corsa.
describe("le bande del segno (22 set. 2026)", () => {
  test("ogni rotta ha `segno`: corse [da, a] in frazione dell'altezza, ordinate, separate, lunghe almeno il 2 %", () => {
    for (const [rotta, v] of Object.entries(tinte)) {
      assert.ok(Array.isArray(v.segno), `${rotta}: segno non è una lista`);
      let prima = -1;
      for (const [da, a] of v.segno) {
        assert.ok(da >= 0 && a <= 1 && a - da >= SEGNO.minimo - 1e-9, `${rotta}: banda ${da}-${a}`);
        assert.ok(prima < 0 || da - prima >= SEGNO.salto - 1e-9, `${rotta}: bande troppo vicine (${prima} → ${da})`);
        prima = a;
      }
    }
  });

  test("le bande di /vendi, /recensioni e /chi-siamo sono quelle che misuraSegno rilegge dal file montato", async () => {
    for (const rotta of ["/vendi", "/recensioni", "/chi-siamo"]) {
      const v = tinte[rotta];
      const { data, info } = await sharp(join(ROOT, "public", v.cielo.file ?? v.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.deepEqual(misuraSegno(data, info.width, info.height), v.segno, `${rotta}: le bande in tinte.json non sono quelle del file`);
    }
  });

  test("i casi che hanno fatto nascere la misura: /recensioni non comincia sul muro bianco in cima, /vendi comincia sui cipressi (≤ 0,30), /metodo non prima del corpo della villa a sinistra", () => {
    assert.ok(tinte["/recensioni"].segno.length > 0 && tinte["/recensioni"].segno[0][0] > 0.05, "/recensioni: il segno virerebbe avorio sul muro bianco");
    assert.ok(tinte["/vendi"].segno.length > 0 && tinte["/vendi"].segno[0][0] <= 0.3, "/vendi: la prima banda non è sui cipressi");
    assert.ok(tinte["/metodo"].segno.length > 0 && tinte["/metodo"].segno[0][0] >= 0.3, "/metodo: la banda partirebbe sul cielo trasparente a sinistra");
  });

  test("PageHero passa le bande a PageHeroTesta, che rende un marcatore `foto` per banda; `--dt-cielo` (la cima come quota del marcatore) è morta", () => {
    const hero = soloCodice(leggi("app/components/PageHero.tsx"));
    assert.match(hero, /segno=\{tinta\.segno\}/, "PageHero non passa `segno`");
    assert.doesNotMatch(hero, /--dt-cielo:/, "PageHero scrive ancora --dt-cielo");
    const testa = soloCodice(leggi("app/components/motion/PageHeroTesta.tsx"));
    assert.match(testa, /segno\.map\(/, "PageHeroTesta non rende un marcatore per banda");
  });
});

