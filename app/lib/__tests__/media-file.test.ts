// I MEDIA DELLA VILLA: SENZA METADATI, CON NOMI NEUTRI, NESSUN FILE MANCANTE.
//
// Chi l'ha chiesto. D35 (spec 2026-09-13 §1.3): le foto e i fermi della villa
// del video tour entrano nel sito senza metadati e con nomi neutri, perché i
// cinque scatti portano nei dati del file la firma e l'e-mail del fotografo e
// il video ha l'indirizzo della villa nel nome. A24 di Alberto (13 settembre)
// chiede per il pannello del territorio un fermo del drone sul quartiere: oggi
// quel file non c'è, perché nessun fotogramma della sua finestra è senza
// persone, e HorizonStory tiene la foto di prima (vedi la riga esclusa in NUOVI).
//
// Com'è fatto oggi: scripts/media/villa-foto.mjs scrive i JPEG con sharp, che
// non copia EXIF, XMP né IPTC; le clip escono dalla catena di spec §7.2 mute e
// col moov in testa. Il test legge i byte: exiftool su questa macchina non c'è.
//
// La lista dei file è scritta a mano, non è un glob: `villa-pool.jpg` e
// `villa-tramonto.jpg` stanno in public/images/reali da prima, sono di altre
// case e portano un segmento APP1.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PUB = join(ROOT, "public");

/** I file del 13 settembre, con le misure che la catena deve dare. */
const NUOVI: ReadonlyArray<{ path: string; w: number; h: number }> = [
  { path: "images/reali/villa-portico-tenda.jpg", w: 2560, h: 1707 },
  { path: "images/reali/villa-piscina-facciata.jpg", w: 2560, h: 1707 },
  { path: "images/reali/villa-fronte-acqua.jpg", w: 2560, h: 1707 },
  { path: "images/reali/villa-angolo-piscina.jpg", w: 2560, h: 1707 },
  { path: "images/reali/villa-lettini.jpg", w: 2560, h: 1707 },
  { path: "images/reali/villa-salotto-ombrellone.jpg", w: 2560, h: 1440 },
  // villa-facciata-lettini.jpg escluso: R1 sul fotogramma 850 (persona seduta dietro la
  // vetrata, anche a 830, 840, 860 e 870), 2026-09-17
  { path: "images/reali/villa-vetrata-lanterne.jpg", w: 2560, h: 1440 },
  // villa-sala-tour.jpg escluso: R2 sul fotogramma 2115 (targa a muro con una frase
  // leggibile, anche a 2125 e 2135), 2026-09-17
  { path: "images/reali/villa-uliveto.jpg", w: 2560, h: 1440 },
  // territorio-quartiere.jpg escluso: R1 sul fotogramma 1950 (persona in piedi sotto la
  // gronda del portico, in tutti i nove candidati 1880-2020 di R4-T), 2026-09-17
  { path: "media/congedo-poster.jpg", w: 1920, h: 1080 },
  { path: "media/acqua-poster.jpg", w: 1920, h: 1080 },
  // A55 (22 set.): l'hero della home dalla foto vera della piscina, ricodificata senza l'APP1 di
  // villa-pool.jpg (scripts/media/hero-piscina.mjs): la foto intera 3:2 e la striscia 9:16 del telefono.
  { path: "media/hero-raffaela-piscina.jpg", w: 1920, h: 1280 },
  { path: "media/hero-raffaela-piscina-m.jpg", w: 720, h: 1280 },
];
const MP4 = ["media/congedo-drone-1080.mp4", "media/congedo-drone-720.mp4", "media/acqua-1080.mp4"];
const WEBM = ["media/congedo-drone-1080.webm", "media/congedo-drone-720.webm", "media/acqua-1080.webm"];

type JpegInfo = { w: number; h: number; exif: boolean; xmp: boolean; iptc: boolean; com: boolean };

/** Scorre i segmenti fino allo SOS: dimensioni dallo SOF, APP1 Exif e XMP, APP13 (IPTC), COM. */
function jpegInfo(buf: Buffer): JpegInfo {
  assert.ok(buf[0] === 0xff && buf[1] === 0xd8, "non è un JPEG");
  const out: JpegInfo = { w: 0, h: 0, exif: false, xmp: false, iptc: false, com: false };
  let i = 2;
  while (i < buf.length) {
    assert.equal(buf[i], 0xff, `marcatore atteso al byte ${i}`);
    while (buf[i] === 0xff) i++;
    const m = buf[i++];
    if (m === 0xd9 || m === 0xda) break;
    if ((m >= 0xd0 && m <= 0xd7) || m === 0x01) continue;
    const len = buf.readUInt16BE(i);
    const data = buf.subarray(i + 2, i + len);
    if (m === 0xc0 || m === 0xc1 || m === 0xc2) {
      out.h = buf.readUInt16BE(i + 3);
      out.w = buf.readUInt16BE(i + 5);
    }
    if (m === 0xe1 && data.subarray(0, 6).toString("latin1") === "Exif\0\0") out.exif = true;
    if (m === 0xe1 && data.subarray(0, 21).toString("latin1") === "http://ns.adobe.com/x") out.xmp = true;
    if (m === 0xed) out.iptc = true;
    if (m === 0xfe) out.com = true;
    i += len;
  }
  return out;
}

/** Box di primo livello e handler delle tracce dentro il moov. */
function mp4Info(buf: Buffer): { order: string[]; handlers: string[] } {
  const order: string[] = [];
  let moov: Buffer | null = null;
  let i = 0;
  while (i + 8 <= buf.length) {
    let size = buf.readUInt32BE(i);
    const type = buf.subarray(i + 4, i + 8).toString("latin1");
    if (size === 1) size = Number(buf.readBigUInt64BE(i + 8));
    if (size === 0) size = buf.length - i;
    assert.ok(size >= 8, `box ${type} con dimensione ${size}`);
    order.push(type);
    if (type === "moov") moov = buf.subarray(i, i + size);
    i += size;
  }
  const handlers: string[] = [];
  if (moov) {
    for (let p = moov.indexOf("hdlr"); p !== -1; p = moov.indexOf("hdlr", p + 4)) {
      handlers.push(moov.subarray(p + 12, p + 16).toString("latin1"));
    }
  }
  return { order, handlers };
}

function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function sorgenti(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "__tests__" || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) sorgenti(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

function nomi(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    out.push(e.name);
    if (e.isDirectory()) nomi(join(dir, e.name), out);
  }
  return out;
}

/** Chiavi che portano l'alt di una foto in un oggetto di dati o di copy: stringa o espressione. */
const ALT_IN_OGGETTO = /\b(?:alt|imageAlt|backdropAlt|heroAlt|villaAlt)\s*:\s*(?:"([^"]*)"|([\w.[\]]+))/;

/**
 * Gli alt delle foto nuove in un sorgente. Dentro un tag JSX serve `alt` non vuoto; se è
 * un'espressione, la sua ultima chiave (`c.heroAlt` → heroAlt, `c.hero.alt` → alt) ha almeno
 * cinque stringhe non vuote nel file, una per lingua. In un oggetto di dati serve una chiave
 * di ALT_IN_OGGETTO non vuota, oppure almeno cinque array `…Alts: [` di sole stringhe non
 * vuote (lo schema `shotAlts` di Services, dove la riga ha solo `src`).
 */
function altProblems(file: string, sorgente: string, nomi: readonly string[]): string[] {
  // `=>` e `>=` diventano `=_` e `_=`: stessa lunghezza, e i `>` rimasti chiudono i tag.
  const t = soloCodice(sorgente).replace(/=>/g, "=_").replace(/>=/g, "_=");
  const cinque = (espressione: string): string | null => {
    const chiave = /(\w+)\s*(?:\[[^\]]*\])?\s*$/.exec(espressione.trim())?.[1];
    if (!chiave) return `alt {${espressione}} senza una chiave leggibile`;
    const valori = [...t.matchAll(new RegExp(String.raw`\b${chiave}:\s*"([^"]*)"`, "g"))].map((v) => v[1].trim());
    return valori.length >= 5 && valori.every(Boolean)
      ? null
      : `${chiave} ha ${valori.length} valori (${valori.filter((v) => !v).length} vuoti), attesi almeno 5 non vuoti`;
  };
  const problemi: string[] = [];
  for (const nome of nomi) {
    const ago = `/images/reali/${nome}`;
    for (let i = t.indexOf(ago); i !== -1; i = t.indexOf(ago, i + ago.length)) {
      const lt = t.lastIndexOf("<", i);
      const nelTag = lt !== -1 && t.lastIndexOf(">", i) < lt && /^<[A-Za-z][\w.]*\s/.test(t.slice(lt, lt + 64));
      if (nelTag) {
        const fine = t.indexOf(">", i);
        const tag = t.slice(lt, fine === -1 ? t.length : fine + 1);
        const alt = /\balt=(?:"([^"]*)"|\{([^}]*)\})/.exec(tag);
        if (!alt) {
          problemi.push(`${file}: ${nome} in un tag senza alt`);
        } else if (alt[1] !== undefined) {
          if (!alt[1].trim()) problemi.push(`${file}: ${nome} con alt vuoto`);
        } else {
          const p = cinque(alt[2]);
          if (p) problemi.push(`${file}: ${nome}, ${p}`);
        }
        continue;
      }
      const apre = t.lastIndexOf("{", i);
      const chiude = t.indexOf("}", i);
      const oggetto = apre !== -1 && chiude !== -1 ? t.slice(apre, chiude + 1) : "";
      const propria = ALT_IN_OGGETTO.exec(oggetto);
      if (propria) {
        if (propria[1] !== undefined) {
          if (!propria[1].trim()) problemi.push(`${file}: ${nome} con alt vuoto nell'oggetto`);
        } else {
          const p = cinque(propria[2]);
          if (p) problemi.push(`${file}: ${nome}, ${p}`);
        }
        continue;
      }
      const liste = [...t.matchAll(/\b\w+Alts:\s*\[([^\]]*)\]/g)].map((m) =>
        [...m[1].matchAll(/"([^"]*)"/g)].map((s) => s[1].trim()),
      );
      const buone = liste.filter((l) => l.length > 0 && l.every(Boolean)).length;
      if (liste.length < 5 || buone !== liste.length) {
        problemi.push(`${file}: ${nome} in un oggetto senza alt; liste …Alts valide ${buone} su ${liste.length}, attese almeno 5`);
      }
    }
  }
  return problemi;
}

describe("i media della villa", () => {
  test("i JPEG nuovi esistono, hanno le misure della catena e nessun metadato", () => {
    const problemi: string[] = [];
    for (const f of NUOVI) {
      const p = join(PUB, f.path);
      if (!existsSync(p)) {
        problemi.push(`${f.path}: manca`);
        continue;
      }
      const j = jpegInfo(readFileSync(p));
      if (j.w !== f.w || j.h !== f.h) problemi.push(`${f.path}: ${j.w}×${j.h}, atteso ${f.w}×${f.h}`);
      for (const k of ["exif", "xmp", "iptc", "com"] as const) if (j[k]) problemi.push(`${f.path}: porta ${k}`);
    }
    assert.deepEqual(problemi, []);
  });

  // A44 (20 set.): le clip del Congedo portano la voce di Raffaela (`vide` + `soun`,
  // scripts/media/congedo.mjs); l'acqua di Costi chiari resta un loop di solo video.
  test("le clip del Congedo hanno video e audio, l'acqua solo video, col moov prima del mdat", () => {
    for (const f of MP4) {
      const p = join(PUB, f);
      assert.ok(existsSync(p), `${f}: manca`);
      const { order, handlers } = mp4Info(readFileSync(p));
      assert.ok(order.indexOf("moov") !== -1 && order.indexOf("moov") < order.indexOf("mdat"), `${f}: ordine ${order.join(",")}`);
      const attese = f.includes("congedo") ? ["vide", "soun"] : ["vide"];
      assert.deepEqual(handlers.filter((h) => h !== "mdir").sort(), attese.sort(), `${f}: tracce ${handlers.join(",")}`);
    }
    for (const f of WEBM) {
      const p = join(PUB, f);
      assert.ok(existsSync(p), `${f}: manca`);
      assert.equal(readFileSync(p).readUInt32BE(0), 0x1a45dfa3, `${f}: non è un WebM`);
    }
  });

  test("nessun nome in public porta l'indirizzo della villa", () => {
    const colpevoli = nomi(PUB).filter((n) => /cima|tradate-via/i.test(n));
    assert.deepEqual(colpevoli, []);
  });

  test("ogni percorso di media.ts esiste", () => {
    const media = soloCodice(readFileSync(join(ROOT, "app/lib/media.ts"), "utf8"));
    const percorsi = [...media.matchAll(/"(\/(?:media|images)\/[^"]+)"/g)].map((m) => m[1]);
    assert.ok(percorsi.length >= 9, `solo ${percorsi.length} percorsi in media.ts`);
    const mancanti = percorsi.filter((p) => !existsSync(join(PUB, p)));
    assert.deepEqual(mancanti, []);
  });

  test("domus-hero.mp4 non c'è più e nessun sorgente lo nomina", () => {
    assert.equal(existsSync(join(PUB, "media/domus-hero.mp4")), false);
    const citano = sorgenti(join(ROOT, "app")).filter((p) => readFileSync(p, "utf8").includes("domus-hero"));
    assert.deepEqual(citano, []);
  });

  test("altProblems segnala gli alt vuoti o mancanti e accetta quelli pieni", () => {
    const nomi = ["villa-lettini.jpg"];
    assert.equal(altProblems("dati.ts", 'const righe = [{ src: "/images/reali/villa-lettini.jpg", alt: "" }];', nomi).length, 1);
    assert.equal(altProblems("tag.tsx", '<Image src="/images/reali/villa-lettini.jpg" alt="" fill />', nomi).length, 1);
    assert.equal(altProblems("senza.tsx", '<Image src="/images/reali/villa-lettini.jpg" fill />', nomi).length, 1);
    assert.equal(
      altProblems("due.tsx", 'const copy = { it: { heroAlt: "a" }, en: { heroAlt: "" } };\n<PageHero image="/images/reali/villa-lettini.jpg" alt={c.heroAlt} />', nomi).length,
      1,
    );
    assert.equal(altProblems("righe.tsx", 'const ROWS = [{ src: "/images/reali/villa-lettini.jpg", ratio: 16 / 9 }];', nomi).length, 1);
    assert.deepEqual(altProblems("dati.ts", 'const righe = [{ src: "/images/reali/villa-lettini.jpg", alt: "Due lettini bianchi" }];', nomi), []);
    const lingue = ["it", "en", "fr", "de", "es"];
    const copy = lingue.map((l) => `${l}: { heroAlt: "Due lettini (${l})", shotAlts: ["Due lettini (${l})", "Sala"] }`).join(", ");
    assert.deepEqual(
      altProblems("pagina.tsx", `const copy = { ${copy} };\n<PageHero\n  image="/images/reali/villa-lettini.jpg"\n  alt={c.heroAlt}\n/>`, nomi),
      [],
    );
    assert.deepEqual(
      altProblems("servizi.tsx", `const copy = { ${copy} };\nconst ROWS = [{ src: "/images/reali/villa-lettini.jpg", ratio: 16 / 9 }];`, nomi),
      [],
    );
  });

  test("ogni foto nuova citata in app ha un alt non vuoto, in cinque lingue se viene dal copy", () => {
    const file = NUOVI.filter((f) => !f.path.endsWith("-poster.jpg")).map((f) => f.path.split("/").pop()!);
    const problemi = sorgenti(join(ROOT, "app")).flatMap((p) => altProblems(p, readFileSync(p, "utf8"), file));
    assert.deepEqual(problemi, []);
  });
});
