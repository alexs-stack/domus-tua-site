// LA TESTA DI ERA, IN NUMERI (A38, A41, A45, A46 di Alberto; D176 del brief T).
//
// Chi l'ha chiesto: A38 (Alberto, 20 settembre 2026): la fotografia a schermo intero diventa lo
// sfondo; A41 e A45: la foto alta è la pagina, in flusso, senza tween; A46 (21 set. 2026, sera: «su
// eraresidence questa foto che usa come background alta ha il cielo mascherato, è no bg … dobbiamo
// fare la stessa cosa»): `cielo: { file, linea, cima }` per rotta, e le scritte stanno sull'avorio
// SOPRA il soggetto, nell'inchiostro della rivista; `cieloH()` traduce la CIMA del soggetto (frazione
// dell'altezza della foto) in frazione della LARGHEZZA, perché il margine verticale dello strato si
// misura sulla larghezza. Com'è fatto oggi: `app/lib/motion/testa.ts` è il modulo puro coi numeri
// (`TESTA`, `cieloH`, `SIZES_TESTA`); `PageHeroTesta.tsx` è statico; `tinte.json` porta per rotta
// il trattamento, la foto, la sorgente, le inquadrature, la tinta alta, il cielo e le bande del segno.
// Qui si rileggono numeri e sorgenti, senza DOM: i pixel li prova e2e/a28.spec.ts. (Intestazione
// riscritta il 22 set. dalla revisione avversaria di A46, rilievo R10: diceva «linea del cielo».)
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SIZES_TESTA, TESTA, cieloH } from "../motion/testa";

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
  cielo: { file: string | null; linea: number; cima: number };
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
    const client = soloCodice(leggi("app/components/motion/PageHeroTesta.tsx"));
    assert.doesNotMatch(client, /tinte\.json/, "PageHeroTesta legge tinte.json");
    // A45: statico di nuovo — la foto alta scorre con la pagina; nessun hook, nessun GSAP, niente `m`.
    assert.doesNotMatch(client, /\bm:\s*number|yPercent|gsap|useGSAP|ScrollTrigger|["']use client["']|\buse[A-Z]\w*(?=\s*(?:<[^>]*>)?\()/, "PageHeroTesta non è più statico (A45: la foto è la pagina)");
    assert.match(client, /sizes=\{SIZES_TESTA\}/, "sizes non è il 100vw dello strato in flusso (A45; 22 set.)");
  });
});

describe("SIZES_TESTA: 100vw su ogni fascia (A45: lo strato è in flusso e dipinge il viewport; revisione del 22 set., C02/P01/G03)", () => {
  test("il valore, e i bucket che il browser sceglie: 1024 a 390 @2, 1280 a 390 e 360 @3, 1536 a 768 @2 e 1440 @1, 2560 a 1440 @2, mai un ingrandimento", () => {
    assert.equal(SIZES_TESTA, "100vw");
    assert.equal(sizePx(SIZES_TESTA, 390), 390);
    assert.equal(scelto(SIZES_TESTA, 390, 2), 1024);
    assert.equal(scelto(SIZES_TESTA, 390, 3), 1280);
    assert.equal(scelto(SIZES_TESTA, 360, 3), 1280);
    assert.equal(scelto(SIZES_TESTA, 768, 2), 1536);
    assert.equal(scelto(SIZES_TESTA, 1024, 1), 1024);
    assert.equal(scelto(SIZES_TESTA, 1440, 1), 1536);
    assert.equal(scelto(SIZES_TESTA, 1440, 2), 2560);
    assert.equal(scelto(SIZES_TESTA, 1920, 1), 1920);
    for (const [vw, dpr] of [[390, 2], [390, 3], [768, 2], [1024, 1], [1440, 1], [1920, 1]] as const) {
      assert.ok(scelto(SIZES_TESTA, vw, dpr) >= Math.min(2560, vw * dpr), `${vw} @${dpr}: il bucket è più stretto dei pixel chiesti`);
    }
    assert.equal(bucket(sizePx(SIZES_TESTA, 1440)), 1536);
    // Il conto per fold di D183 (151vw sotto lg per un 2:3, dal riquadro 100svh in cover di A41) chiedeva il 1920
    // a 390 @3 dove basta il 1280: +45…+72 KB (AVIF, il formato di allora) sull'immagine LCP (misurato il 22 set. sul build).
    const vecchio = "(max-width: 1023.98px) 151vw, (max-width: 1279.98px) 100vw, (max-width: 1439.98px) 100vw, 100vw";
    assert.equal(scelto(vecchio, 390, 3), 1920);
    assert.equal(scelto(vecchio, 390, 2), 1280);
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

// ── A46: la testa sull'avorio, in numeri ────────────────────────────────────
// La CIMA del soggetto (`cielo.cima`, frazione dell'altezza della foto: la prima riga in cui almeno il
// 5 % dei pixel è opaco, misurata da cielo.mjs; sopra c'è solo cielo, cioè carta) decide di quanto lo
// strato della foto sale sotto il blocco: `margin-top: calc(-100% * var(--dt-cielo-h))` con
// --dt-cielo-h = cima × altezza / larghezza del sorgente (`cieloH`), cioè la cima in frazione della
// larghezza resa. Così il soggetto comincia al fondo del blocco su ogni fascia e nessuna lettera gli
// sta sopra. Non la `linea` (la riga in cui il soggetto riempie la larghezza): su /vendi la linea sta
// a 0,488, i cipressi a 0,219 e il tetto a 0,33 — con la linea l'H1 posava sui cipressi e il bottone
// sul tetto (build del 21 set., 1440×900). Il blocco è alto quanto il contenuto, da lg almeno 100svh:
// dove la cima in px supera il blocco lo strato comincia sopra la carta e il clip ne taglia il solo
// cielo trasparente.
describe("A46: la cima del soggetto, in numeri (cieloH, tinte.json, i sei viewport)", () => {
  const VIEWPORT = [
    [390, 844],
    [360, 640],
    [768, 1024],
    [1024, 640],
    [1440, 900],
    [1920, 1080],
  ] as const;

  test("cieloH(): una frazione dell'altezza della foto in frazione della larghezza, a quattro decimali; 0 resta 0", () => {
    assert.equal(cieloH(0.219, [2560, 3816]), 0.3264);
    assert.equal(cieloH(0.402, [2560, 3816]), 0.5992);
    assert.equal(cieloH(0, [2560, 3816]), 0);
    assert.equal(cieloH(0.5, [1000, 1000]), 0.5);
    assert.equal(cieloH(0.134, [2560, 1717]), 0.0899);
  });

  test("testa.ts resta puro: cieloH non importa nulla e non legge tinte.json", () => {
    const mod = soloCodice(leggi("app/lib/motion/testa.ts"));
    assert.match(mod, /export const cieloH/);
    assert.doesNotMatch(mod, /\bimport\b|tinte\.json/);
  });

  test("sulle nove teste la cima sta sopra la linea e, in px, sotto il pavimento di 100svh da lg (tranne /acquista a 1920×1080, dove il clip taglia solo cielo)", () => {
    const ROTTE_TESTA = Object.keys(tinte).filter((r) => tinte[r].trattamento === "testa");
    for (const rotta of ROTTE_TESTA) {
      const v = tinte[rotta];
      const [sw, sh] = v.sorgente;
      assert.ok(v.cielo.cima >= 0 && v.cielo.cima <= v.cielo.linea, `${rotta}: cima ${v.cielo.cima} sopra la linea ${v.cielo.linea}`);
      const h = cieloH(v.cielo.cima, v.sorgente);
      assert.ok(Math.abs(h - (v.cielo.cima * sh) / sw) < 5e-5, `${rotta}: cieloH`);
      for (const [vw, vh] of VIEWPORT) {
        const cimaPx = vw * h;
        // Da lg il blocco è almeno 100svh: la cima ci sta dentro su ogni rotta ai quattro viewport da lg, tranne
        // /acquista (0,402) a 1920×1080: 1150 px contro 1080, e lì lo strato comincia 70 px sopra la carta.
        if (vw >= 1024 && !(rotta === "/acquista" && vw === 1920)) assert.ok(cimaPx <= vh, `${rotta} a ${vw}×${vh}: la cima (${cimaPx.toFixed(0)} px) supera i 100svh`);
      }
    }
    // I casi contati il 21 settembre a 1440: /vendi 0,219 × 2146 = 470 px, /acquista 0,402 × 2146 = 863 px (i
    // più profondi), /servizi 642, /metodo 150, /recensioni e /open-domus 0 (il muro e la tenda toccano la cima),
    // gli interni 0: il blocco resta a 100svh e la foto sale di quel tanto.
    const px1440 = (rotta: string) => 1440 * cieloH(tinte[rotta].cielo.cima, tinte[rotta].sorgente);
    assert.ok(Math.abs(px1440("/vendi") - 470) <= 1.5, `/vendi a 1440: ${px1440("/vendi").toFixed(1)}`);
    assert.ok(Math.abs(px1440("/acquista") - 863) <= 1.5, `/acquista a 1440: ${px1440("/acquista").toFixed(1)}`);
    assert.ok(px1440("/servizi") < 900 && px1440("/metodo") < 900 && px1440("/domande-frequenti") < 900);
    for (const rotta of ["/chi-siamo", "/lavora-con-noi", "/open-domus", "/recensioni"]) assert.equal(px1440(rotta), 0, `${rotta}: senza cima la foto comincia sotto il blocco`);
    assert.ok(1920 * cieloH(tinte["/acquista"].cielo.cima, tinte["/acquista"].sorgente) > 1080, "/acquista a 1920: la cima supera 100svh (dichiarato)");
  });
});
