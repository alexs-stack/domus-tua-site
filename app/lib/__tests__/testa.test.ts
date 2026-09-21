// LA TESTA DI ERA, IN NUMERI (A38, A40, A41 di Alberto; D175, D176, D183 del brief T).
//
// Chi l'ha chiesto: A38 (Alberto, 20 settembre 2026): la fotografia a schermo intero diventa lo
// sfondo e le scritte stanno dentro, bianche. Com'è fatto oggi: `app/lib/motion/testa.ts` è il
// modulo puro coi numeri (scatola 100svh, m 0,138, `yPercent 0 → 100·m/(1+m)`, curva dtTerreno,
// la finestra dello ScrollTrigger, `sizesDi` e `sizesSottoLg`); `PageHeroTesta.tsx` monta il
// tween; `tinte.json` porta per rotta il trattamento (`testa` | `fermo`), la foto, la sorgente,
// le due inquadrature (`objectPosition.lg` e `.sotto`, scelte da T1.0 in cancello-T1.md), `m`
// e la tinta alta del placeholder. Le scritte sono bianche e nude (A40 di Alberto: nessuna
// ombra). Qui si rileggono numeri e sorgenti, senza DOM: il movimento sui pixel lo prova
// e2e/a28.spec.ts.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { BUCKETS, TESTA, sizesDi, sizesSottoLg } from "../motion/testa";

gsap.registerPlugin(CustomEase);

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
/** Commenti via prima di cercare (schema di logo-colore.test.ts): i file nominano i divieti che rispettano. */
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

type Banda = { hex: string; sorgente: string; Y: number; dH: number; C: number; avorio: number; misurato?: string };
type Voce = {
  trattamento: "testa" | "fermo";
  file: string;
  sorgente: [number, number];
  objectPosition: { lg: string; sotto: string };
  alta: Banda;
};
const tinte = JSON.parse(leggi("app/lib/motion/tinte.json")) as Record<string, Voce>;

/* I deviceSizes e gli imageSizes di next.config.ts, letti e non ricopiati: i candidati del srcset li decidono loro. */
const CONFIG = (() => {
  const src = leggi("next.config.ts");
  const lista = (nome: string) => {
    const m = new RegExp(`${nome}:\\s*\\[([^\\]]+)\\]`).exec(src);
    assert.ok(m, `next.config.ts non dichiara ${nome}`);
    return m[1].split(",").map((s) => Number(s.trim()));
  };
  return { deviceSizes: lista("deviceSizes"), imageSizes: lista("imageSizes") };
})();
const ALL_SIZES = [...CONFIG.imageSizes, ...CONFIG.deviceSizes].sort((a, b) => a - b);

/**
 * La larghezza in px CSS che il browser ricava da una stringa `sizes` a un viewport, con le regole
 * dell'attributo: vale la prima condizione `(max-width: Xpx)` soddisfatta, altrimenti l'ultima voce senza condizione.
 */
function sizePx(sizes: string, vw: number): number {
  for (const voce of sizes.split(",").map((s) => s.trim())) {
    const cond = /^\(max-width:\s*([\d.]+)px\)\s+([\d.]+)vw$/.exec(voce);
    if (cond) {
      if (vw <= Number(cond[1])) return (vw * Number(cond[2])) / 100;
      continue;
    }
    const nuda = /^([\d.]+)vw$/.exec(voce);
    assert.ok(nuda, `sizes: voce non riconosciuta «${voce}»`);
    return (vw * Number(nuda[1])) / 100;
  }
  throw new Error("sizes senza voce finale");
}
/**
 * I candidati del srcset come li scrive next/image (get-img-props.js, `getWidths`): la regex
 * `(^|\s)(1?\d?\d)vw` legge solo i `vw` fino a 199, e i candidati sono tutti gli `allSizes` non più
 * piccoli del più piccolo deviceSize × il più piccolo di quei vw.
 */
function candidati(sizes: string): number[] {
  const re = /(^|\s)(1?\d?\d)vw/g;
  const pct: number[] = [];
  for (let m = re.exec(sizes); m; m = re.exec(sizes)) pct.push(Number(m[2]));
  if (!pct.length) return ALL_SIZES;
  const minimo = Math.min(...pct) * 0.01;
  return ALL_SIZES.filter((s) => s >= CONFIG.deviceSizes[0] * minimo);
}
/** Il candidato che il browser sceglie: il più piccolo non più piccolo di sizes × DPR, altrimenti il più grande. */
const scelto = (sizes: string, vw: number, dpr: number) => {
  const c = candidati(sizes);
  return c.find((w) => w >= sizePx(sizes, vw) * dpr) ?? c[c.length - 1];
};
/** Il primo bucket di next.config.ts non più piccolo della larghezza chiesta (DPR 1). */
const bucket = (px: number) => CONFIG.deviceSizes.find((d) => d >= px) ?? CONFIG.deviceSizes[CONFIG.deviceSizes.length - 1];
/** L'altezza della scatola e dello strato a un viewport da lg (§3.1: scatola 100svh, strato × (1 + m)). */
/** A41: la foto è ferma (sticky), lo strato è il riquadro: nessun margine. */
const scatola = (vh: number) => ({ h: vh, hs: vh });

describe("testa.ts: i numeri della testa di era (D176; A41: nessun margine, la foto è ferma)", () => {
  test("la scatola è 100svh, e basta: nessun margine, nessuna ampiezza, nessuna curva (A41)", () => {
    assert.deepEqual(Object.keys(TESTA), ["h"]);
    assert.equal(TESTA.h, "100svh");
  });

  test("testa.ts resta il modulo dei soli numeri: nessun import; PageHeroTesta non riceve `m`, non ha hook, non ha GSAP (A41)", () => {
    const mod = soloCodice(leggi("app/lib/motion/testa.ts"));
    assert.doesNotMatch(mod, /\bimport\b/, "testa.ts importa qualcosa: non è più un modulo puro");
    assert.doesNotMatch(mod, /tinte\.json/, "testa.ts legge tinte.json");
    assert.doesNotMatch(mod, /["']use client["']|\bgsap\b/, "testa.ts non è dati");
    assert.deepEqual([...BUCKETS], CONFIG.deviceSizes, "i bucket copiati in testa.ts non sono i deviceSizes di next.config.ts");
    const client = soloCodice(leggi("app/components/motion/PageHeroTesta.tsx"));
    assert.doesNotMatch(client, /tinte\.json/, "PageHeroTesta legge tinte.json");
    // A45: statico di nuovo — la foto alta scorre con la pagina; nessun hook, nessun GSAP, niente `m`.
    assert.doesNotMatch(client, /\bm:\s*number|yPercent|gsap|useGSAP|ScrollTrigger|["']use client["']|\buse[A-Z]\w*(?=\s*(?:<[^>]*>)?\()/, "PageHeroTesta non è più statico (A45: la foto è la pagina)");
    assert.match(client, /sizes=\{sizesDi\(/, "sizes non viene dal rapporto della sorgente (D183)");
  });
});

describe("sizesDi e sizesSottoLg: i byte sono un cancello (D183, §3.4)", () => {
  test("le stringhe per 3:2 e 16:9, e il primo termine 338 / 400 / 405 per 1,5 / 16:9 / 1,8", () => {
    // A41 (nessun margine): 3:2 dipinge 1152 / 1200 / 1350 / 1620 px ai quattro fold → 112vw, 100vw, 100vw.
    assert.equal(sizesDi(1.5), "(max-width: 1023.98px) 338vw, (max-width: 1279.98px) 112vw, (max-width: 1439.98px) 100vw, 100vw");
    assert.equal(sizesDi(16 / 9), "(max-width: 1023.98px) 400vw, (max-width: 1279.98px) 133vw, (max-width: 1439.98px) 111vw, 107vw");
    assert.equal(sizesSottoLg(1.5), "338vw");
    assert.equal(sizesSottoLg(16 / 9), "400vw");
    assert.equal(sizesSottoLg(1.8), "405vw");
    assert.ok(sizesDi(1.8).startsWith("(max-width: 1023.98px) 405vw, "));
    // Il primo termine è sizesSottoLg: ceil(100 · r · 2,25).
    for (const r of [1.5, 16 / 9, 1.8, 1.799]) assert.ok(sizesDi(r).startsWith(`(max-width: 1023.98px) ${sizesSottoLg(r)}, `), `r ${r}`);
  });

  test("ai quattro fold da lg il bucket regge quel che il cover dipinge: ingrandimento ≤ 1,000 per r ∈ {1,5; 1,778; 1,799}", () => {
    const attesi: Record<string, Record<string, number>> = {
      "1.5": { "1024x768": 1280, "1280x800": 1280, "1440x900": 1536, "1920x1080": 1920 },
      "1.778": { "1024x768": 1536, "1280x800": 1536, "1440x900": 1920, "1920x1080": 2560 },
      "1.799": { "1024x768": 1536, "1280x800": 1536, "1440x900": 1920, "1920x1080": 2560 },
    };
    for (const r of [1.5, 1.778, 1.799]) {
      const sizes = sizesDi(r);
      for (const [vw, vh] of [
        [1024, 768],
        [1280, 800],
        [1440, 900],
        [1920, 1080],
      ] as const) {
        const b = bucket(sizePx(sizes, vw));
        assert.equal(b, attesi[String(r)][`${vw}x${vh}`], `r ${r} a ${vw}×${vh}: bucket`);
        // `object-cover` sullo strato: serve max(larghezza, altezza dello strato × rapporto).
        const serve = Math.max(vw, scatola(vh).hs * r);
        assert.ok(serve / b <= 1 + 1e-9, `${vw}×${vh} r ${r}: servono ${Math.round(serve)} px su un bucket ${b} (×${(serve / b).toFixed(3)})`);
      }
    }
    // A 1440 e 1920 le 3:2 tengono il bucket di oggi (1536 e 1920, D182): il floor e non il ceil.
    assert.equal(bucket(sizePx(sizesDi(1.5), 1440)), 1536);
    assert.equal(bucket(sizePx(sizesDi(1.5), 1920)), 1920);
    // A 1280 esatti vale il termine 1439,98 (100vw): un 3:2 dipinge 1280 px e il bucket 1280 basta senza ingrandimento (A41).
    assert.equal(bucket(sizePx(sizesDi(1.5), 1280)), 1280);
  });

  test("sotto lg (D183): a DPR 2 e 3 i telefoni comuni ricevono 2560, a DPR 1 1536; la regex di next/image ignora i vw sopra 199", () => {
    // next/image legge solo i vw ≤ 199: con 3:2 restano 112, 100, 100 → dieci candidati da 360 a 2560.
    assert.deepEqual(candidati(sizesDi(1.5)), [360, 384, 420, 640, 768, 1024, 1280, 1536, 1920, 2560]);
    // 390×844: un 3:2 dipinge 844 × 1,5 = 1266 px CSS; un 16:9 1501; un 1,8 1518.
    const dipinta = (vh: number, r: number) => Math.round(vh * r);
    const tabella: Array<[number, number, number, number, number, number]> = [
      // vw, vh, dpr, r, bucket atteso, ingrandimento massimo dichiarato
      [390, 844, 2, 1.5, 2560, 1.0],
      [390, 844, 3, 1.5, 2560, 1.49],
      [390, 844, 1, 1.5, 1536, 1.0],
      [390, 844, 2, 16 / 9, 2560, 1.18],
      [390, 844, 3, 16 / 9, 2560, 1.77],
      [390, 844, 1, 16 / 9, 1920, 1.0],
      [360, 640, 2, 1.5, 2560, 1.0],
      [360, 800, 3, 1.5, 2560, 1.49],
      [375, 812, 3, 1.5, 2560, 1.44],
      [412, 915, 2, 1.5, 2560, 1.08],
      [412, 915, 3, 1.5, 2560, 1.61],
    ];
    for (const [vw, vh, dpr, r, atteso, ingr] of tabella) {
      const b = scelto(sizesDi(r), vw, dpr);
      assert.equal(b, atteso, `${vw}×${vh} @${dpr} r ${r.toFixed(3)}: bucket ${b}`);
      const chiede = dipinta(vh, r) * dpr;
      assert.ok(chiede / b <= ingr + 1e-9, `${vw}×${vh} @${dpr} r ${r.toFixed(3)}: chiede ${chiede} su ${b} (×${(chiede / b).toFixed(2)}), dichiarato ≤ ${ingr}`);
    }
    // 390×844 @2 con 3:2: 2532 px chiesti → 2560, ingrandimento 1,000; @1 1266 → 1536.
    assert.equal(scelto(sizesDi(1.5), 390, 2), 2560);
    assert.equal(scelto(sizesDi(1.5), 390, 1), 1536);
    // Col `245vw` della prima stesura il 3:2 a 390 @2 prendeva 1920: ×1,32 (critica g1).
    const vecchio = "(max-width: 1023.98px) 245vw, (max-width: 1279.98px) 112vw, (max-width: 1439.98px) 100vw, 100vw";
    assert.equal(scelto(vecchio, 390, 2), 1920);
    assert.ok((dipinta(844, 1.5) * 2) / scelto(vecchio, 390, 2) > 1.3);
  });
});

describe("tinte.json: gli undici dati dell'inquadratura (D180, D187)", () => {
  const ROTTE = ["/vendi", "/acquista", "/servizi", "/metodo", "/open-domus", "/chi-siamo", "/recensioni", "/lavora-con-noi", "/domande-frequenti", "/privacy", "/cookie"];

  test("undici voci: nove `testa` e due `fermo` (i legali); nessun campo morto", () => {
    assert.deepEqual(Object.keys(tinte), ROTTE);
    for (const [rotta, v] of Object.entries(tinte)) {
      const legale = rotta === "/privacy" || rotta === "/cookie";
      assert.equal(v.trattamento, legale ? "fermo" : "testa", `${rotta}: trattamento`);
      // `m` è morto con A41 (la foto è sticky, nessuna parallasse) e la pulizia del 20 set. l'ha tolto da tinte.mjs.
      for (const morto of ["m", "bassa", "parallasse", "ancoraggio", "cornice", "strato", "soglia", "ingresso"]) assert.ok(!(morto in v), `${rotta}: il campo ${morto} è morto (D187, A41)`);
    }
  });

  test("objectPosition.lg e .sotto nella forma `N% N%`, sorgente ≥ 1920 di larghezza, alta.Y ≥ 0,5329, la foto esiste", () => {
    for (const [rotta, v] of Object.entries(tinte)) {
      assert.match(v.objectPosition.lg, /^\d+% \d+%$/, `${rotta}: lg`);
      assert.match(v.objectPosition.sotto, /^\d+% \d+%$/, `${rotta}: sotto`);
      assert.ok(Array.isArray(v.sorgente) && v.sorgente.length === 2 && v.sorgente[0] >= 1920, `${rotta}: sorgente ${JSON.stringify(v.sorgente)}`);
      assert.ok(v.alta.Y >= 0.5329, `${rotta}: la tinta alta sta sotto il pavimento di lavoro`);
      assert.ok(existsSync(join(ROOT, "public", v.file)), `${rotta}: manca public${v.file}`);
    }
    // A44 (20 set. 2026): le nove teste hanno le foto ALTE generate con Higgsfield (2:3, 2560×3816),
    // la cima a riposo da lg (`50% 0%`) e il centro sul telefono; D173/D181 (hero_02, piscina-lusso,
    // /metodo a 30% 50%) sono superate. consulenza.jpg non è in nessuna testa.
    for (const rotta of ["/vendi", "/acquista", "/servizi", "/metodo", "/open-domus", "/chi-siamo", "/recensioni", "/lavora-con-noi", "/domande-frequenti"] as const) {
      const v = tinte[rotta];
      assert.match(v.file, /^\/images\/reali\/[a-z-]+-alta\.jpg$/, `${rotta}: non è una foto alta`);
      assert.deepEqual(v.sorgente, [2560, 3816], `${rotta}: sorgente`);
      assert.equal(v.objectPosition.lg, "50% 0%", `${rotta}: la cima a riposo da lg`);
      assert.equal(v.objectPosition.sotto, "50% 50%", `${rotta}: centrata sul telefono`);
    }
    for (const v of Object.values(tinte)) assert.notEqual(v.file, "/images/reali/consulenza.jpg");
  });
});
