// IL CONTRATTO DATA-BG (spec §6.1).
//
// Alberto il 13 settembre 2026, «Si stacca da 1024» (A21, D34): da 1024 px il
// cuore resta nel margine e sopra le foto le tacche dell'anello virano
// all'avorio. Il rilevatore (app/lib/motion/tema.ts) legge `[data-bg]`: chi
// possiede una foto mette l'attributo sull'elemento che coincide con la foto
// visibile. Questo test rilegge il sorgente e pretende tutte le zone di §6.1,
// i soli tre valori ammessi, e che il cambio di tema tinga solo le tacche:
// il logo resta grigio e rosso (C23, direttiva della cliente del 2026-08-26).
// Del rilevatore presidia le zone larghe 1 px che valgono per tutta la
// larghezza (D66) e la coda che rilegge il tema dopo gli scrub (D67).
// Le foto fuori elenco le trova e2e/segno.spec.ts, che guarda cosa c'è davvero
// sotto il segno.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { MARK_TEMA_CODA_S } from "../motion/mark";

const ROOT = process.cwd();
const rel = (p: string) => p.slice(ROOT.length + 1).split(sep).join("/");

function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
function sorgenti(dir: string, out: string[] = [], estensioni = /\.(tsx|ts)$/): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) sorgenti(p, out, estensioni);
    else if (estensioni.test(nome)) out.push(p);
  }
  return out;
}
function codice(file: string): string {
  const p = join(ROOT, file);
  assert.ok(existsSync(p), `manca ${file}`);
  return soloCodice(readFileSync(p, "utf8"));
}
/** Attributo JSX intero: preceduto da uno spazio, seguito da spazio, `=`, `/` o `>`. */
const attr = (nome: string) => new RegExp(String.raw`\s${nome}(?=[\s=/>])`);
/** Classe dentro un className: `className="… nome …"` o in un template. */
const classe = (nome: string) => new RegExp(String.raw`\sclassName=(?:"|\{\`)[^"\`]*\b${nome}\b`);
/** I tag JSX di apertura in cui `re` compare. */
function tagCon(src: string, re: RegExp): string[] {
  const out: string[] = [];
  const g = new RegExp(re.source, "g");
  let m: RegExpExecArray | null;
  while ((m = g.exec(src))) {
    const inizio = src.lastIndexOf("<", m.index);
    let graffe = 0;
    let fine = inizio;
    for (; fine < src.length; fine++) {
      const c = src[fine];
      if (c === "{") graffe++;
      else if (c === "}") graffe--;
      else if (c === ">" && graffe === 0) break;
    }
    out.push(src.slice(inizio, fine + 1));
  }
  return out;
}
const FOTO = /\sdata-bg="foto"/;
/**
 * Foto trovate da e2e/segno.spec.ts («se sotto il centro del segno c'è una foto,
 * il tema è foto») fuori dall'elenco di spec §6.1: [file, classe del tag che
 * coincide con la foto visibile]. Le voci le aggiunge lo Step 14 del commit 20
 * (A21), e da lì restano presidiate qui.
 */
const ZONE_EXTRA: Array<[string, string]> = [];

describe("le zone di spec §6.1 portano data-bg", () => {
  // A49 (22 set. 2026, sera): l'hero è la foto alta in flusso, la testa di era senza blocco: il marcatore
  // da 1 px del corridoio (D66) è morto e le zone `foto` sono le bande del segno di hero.json
  // (`.dt-testa_soggetto`, come le teste): sul cielo trasparente e sull'acqua chiara il segno resta grafite.
  test("hero: le bande di hero.json come marcatori del soggetto, nessun marcatore da 1 px (§3.2, A49)", () => {
    const src = codice("app/components/HeroCinematic.tsx");
    const tags = tagCon(src, FOTO);
    assert.equal(tags.length, 1, "un solo tag con data-bg=\"foto\" nell'hero");
    assert.ok(attr("data-testa-soggetto").test(tags[0]) && classe("dt-testa_soggetto").test(tags[0]) && /\saria-hidden\b/.test(tags[0]), "il marcatore dell'hero non è .dt-testa_soggetto aria-hidden");
    assert.ok(!/\bw-px\b|h-\[var\(--dt-band-h\)\]/.test(tags[0]), "il marcatore da 1 px alto quanto la banda è morto con A49");
    assert.doesNotMatch(src, /data-dive-zoom/, "l'hero non è una testa con [data-dive-zoom]: il rettangolo degli e2e delle undici rotte");
  });

  // A46 (Alberto, 21 set. 2026, sera): il cielo delle foto alte è trasparente e il riquadro della testa
  // è la carta — sopra il cielo il segno deve restare grafite (avorio sull'avorio non si vedrebbe). La
  // zona `foto` sono i marcatori delle bande del segno (`.dt-testa_soggetto`, uno per corsa `segno` di
  // tinte.json: dove nella striscia del segno la foto è opaca e scura; 22 set. 2026, C01/G02), dentro lo
  // strato della foto: un solo tag nel sorgente, reso in un map.
  test("PageHero: il marcatore del soggetto porta data-bg=\"foto\"; il riquadro [data-dive-zoom] è la carta e non porta data-bg (§5.1, A46)", () => {
    const files = sorgenti(join(ROOT, "app/components")).filter((p) =>
      attr("data-dive-zoom").test(soloCodice(readFileSync(p, "utf8"))),
    );
    assert.ok(files.length > 0, "nessun [data-dive-zoom] reso in app/components");
    for (const p of files) {
      const src = soloCodice(readFileSync(p, "utf8"));
      const riquadri = tagCon(src, attr("data-dive-zoom"));
      assert.ok(riquadri.every((t) => !/\sdata-bg=/.test(t)), `${rel(p)}: [data-dive-zoom] porta data-bg: sopra il cielo trasparente il segno sarebbe avorio sull'avorio (A46)`);
      const soggetti = tagCon(src, attr("data-testa-soggetto"));
      assert.equal(soggetti.length, 1, `${rel(p)}: un solo marcatore del soggetto`);
      assert.ok(FOTO.test(soggetti[0]), `${rel(p)}: il marcatore del soggetto senza data-bg="foto"`);
      assert.ok(classe("dt-testa_soggetto").test(soggetti[0]), `${rel(p)}: il marcatore non è .dt-testa_soggetto`);
      assert.ok(/\saria-hidden\b/.test(soggetti[0]), `${rel(p)}: il marcatore non è aria-hidden`);
    }
  });

  test("territorio in HorizonStory (§3.5, A24)", () => {
    const tags = tagCon(codice("app/components/HorizonStory.tsx"), attr("data-horizon-slide"));
    assert.ok(tags.length > 0, "manca [data-horizon-slide]");
    assert.ok(tags.some((t) => FOTO.test(t)), "la foto del territorio non porta data-bg=\"foto\"");
  });

  test("cinque stelle: .dt-starrev_intro acceso e spento dal film (§3.6)", () => {
    const src = codice("app/components/StarReviews.tsx");
    // Il commit 10 accende e spegne la zona in onFilm; il comportamento (assente a
    // p 0,04, foto a p 0,46) lo prova l'e2e delle stelle dello stesso commit.
    assert.match(src, /setAttribute\(\s*"data-bg"\s*,\s*"foto"\s*\)/);
    assert.match(src, /removeAttribute\(\s*"data-bg"\s*\)|toggleAttribute\(\s*"data-bg"/);
    const intro = tagCon(src, classe("dt-starrev_intro"));
    assert.ok(intro.length > 0, "manca .dt-starrev_intro");
    assert.ok(intro.every((t) => !FOTO.test(t)), ".dt-starrev_intro porta data-bg statico: sarebbe foto anche a copertina spenta");
  });

  test("tessere di Voci (§3.7)", () => {
    const tags = tagCon(codice("app/components/Voci.tsx"), classe("dt-media-full"));
    assert.ok(tags.length > 0, "manca la copertina .dt-media-full");
    assert.ok(tags.every((t) => FOTO.test(t)), "una copertina di Voci senza data-bg=\"foto\"");
  });

  // A46: la facciata della finestra ha il cielo trasparente e a schermo intero il segno (in alto a
  // sinistra, 4vw × asse della testata) sta sul cielo, cioè sull'avorio: la zona resta chiara
  // (`foto-chiara`, grafite), altrimenti le tacche avorio sparirebbero nel cielo avorio.
  // A57 (22 set. 2026, sera): la finestra è un nastro e i marcatori da 1 px del corridoio sono morti;
  // restano le bande delle travi dentro la scatola della foto (`.dt-od_soggetto`, `foto`), che
  // viaggiano con la cornice: sul cielo trasparente (la carta) e sui muri il segno resta grafite.
  test("finestra di Open Domus: le bande della facciata, e nessun marcatore da 1 px (§3.10, A46, A57)", () => {
    const src = codice("app/components/OpenDomus.tsx");
    const bande = tagCon(src, classe("dt-od_soggetto"));
    assert.ok(bande.length === 1 && FOTO.test(bande[0]), "il marcatore delle travi della facciata non porta data-bg=\"foto\"");
    assert.equal(tagCon(src, classe("dt-od_mark--a")).length + tagCon(src, classe("dt-od_mark--f")).length, 0, "i marcatori da 1 px del corridoio sono morti con A57");
  });

  // A72 (22 set. 2026, notte): Costi chiari è un nastro con la facciata col cielo trasparente (costi.json):
  // le bande scure (`.dt-cc_soggetto`, `foto`: i cipressi, il gelsomino e la vetrata, la piscina) viaggiano
  // con la foto; sul cielo-carta e sui muri bianchi il segno resta grafite. La banda dell'acqua è morta.
  test("nastro di Costi chiari: le bande della facciata, e nessuna banda dell'acqua (A72)", () => {
    const src = codice("app/components/CostiChiari.tsx");
    const bande = tagCon(src, classe("dt-cc_soggetto"));
    assert.ok(bande.length === 1 && FOTO.test(bande[0]), "il marcatore delle bande della facciata di Costi chiari non porta data-bg=\"foto\"");
    assert.equal(tagCon(src, attr("data-acqua-band")).length, 0, "la banda dell'acqua è morta con A72");
  });

  test("testimonianza: [data-sink-frame] (§3.14)", () => {
    const tags = tagCon(codice("app/components/FeaturedTestimonial.tsx"), attr("data-sink-frame"));
    assert.ok(tags.length > 0, "manca [data-sink-frame]");
    assert.ok(tags.every((t) => FOTO.test(t)), "[data-sink-frame] senza data-bg=\"foto\"");
  });

  test("Team: cornici e foto dell'intro (§3.16)", () => {
    const src = codice("app/components/Team.tsx");
    const cornici = tagCon(src, classe("dt-media-column"));
    assert.ok(cornici.length > 0 && cornici.every((t) => FOTO.test(t)), "una cornice .dt-media-column senza data-bg=\"foto\"");
    const immagini = [...src.matchAll(/<Image\b/g)].map((m) => m.index ?? 0);
    assert.ok(immagini.length >= 2, "attese almeno due <Image> nel Team (intro e tessere)");
    for (const i of immagini) {
      assert.ok(FOTO.test(src.slice(Math.max(0, i - 400), i)), `un <Image> del Team a ${i} senza data-bg="foto" nei 400 caratteri prima`);
    }
  });

  test("cartolina del Congedo: marcatore con l'inset del ritaglio a ogni frame (§3.18)", () => {
    const src = codice("app/components/Congedo.tsx");
    const tags = tagCon(src, FOTO);
    assert.ok(tags.some((t) => /ref=\{markerRef\}/.test(t) && /pointer-events-none/.test(t)), "manca il marcatore ref={markerRef}");
    // Commit 17: paintClip scrive nello stesso fotogramma il clip-path del ritaglio
    // e l'inset del marcatore. La geometria (±1 px) la prova e2e/segno.spec.ts.
    assert.match(src, /function paintClip\([^)]*marker[^)]*\)[\s\S]*?marker\.style\.inset = /);
    assert.match(src, /paintClip\(clipRef\.current, markerRef\.current/);
    // A35/A42: il marcatore sta dentro lo schermo intero (le percentuali dell'inset sono dello
    // schermo), e durante l'entrata useLastra lo porta sull'ingombro del foglio come 1×1 con
    // translate + scale (`data-foglio`), togliendo l'inset inline che lo batterebbe.
    const screen = src.indexOf("data-corridor-screen");
    const marker = src.indexOf("ref={markerRef}");
    assert.ok(screen > 0 && marker > screen, "il marcatore sta dentro lo schermo");
    const lastra = codice("app/components/motion/useLastra.ts");
    assert.match(lastra, /marker\.setAttribute\("data-foglio", ""\)/);
    assert.match(lastra, /marker\.style\.removeProperty\("inset"\)/);
    assert.match(lastra, /marker\.style\.transform = `translate\(/);
  });

  test("zone fuori elenco trovate dall'e2e (ZONE_EXTRA, Step 14)", () => {
    for (const [file, cls] of ZONE_EXTRA) {
      const tags = tagCon(codice(file), classe(cls));
      assert.ok(tags.length > 0, `${file}: manca .${cls}`);
      assert.ok(tags.every((t) => FOTO.test(t)), `${file}: .${cls} senza data-bg="foto"`);
    }
  });
});

describe("i valori e il colore", () => {
  test("tre valori soli: foto, avorio, foto-chiara", () => {
    const vietati: string[] = [];
    for (const p of sorgenti(join(ROOT, "app"))) {
      const src = soloCodice(readFileSync(p, "utf8"));
      for (const m of src.matchAll(/data-bg="([^"]*)"|setAttribute\(\s*"data-bg"\s*,\s*"([^"]*)"\s*\)/g)) {
        const v = m[1] ?? m[2];
        if (!["foto", "avorio", "foto-chiara"].includes(v)) vietati.push(`${rel(p)}: ${v}`);
      }
    }
    assert.deepEqual(vietati, [], `valori di data-bg non ammessi: ${vietati.join(", ")}`);
  });

  test("il tema tinge solo le tacche: .dt-segno cambia color e nient'altro (C23)", () => {
    const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
    const regole = css.match(/\.dt-segno[^{]*\{[^}]*\}/g) ?? [];
    assert.ok(regole.length >= 3, "attese le tre regole di .dt-segno (base, foto, reduced-motion)");
    for (const r of regole) {
      assert.doesNotMatch(r, /filter|mix-blend|invert|brightness|grayscale|background|box-shadow|fill\s*:|stroke\s*:/, r);
    }
    assert.ok(
      regole.some((r) => /^\.dt-segno \{\s*color: var\(--color-ink\);\s*transition: color var\(--td-duration-fast\) var\(--td-ease-smooth-out\);\s*\}$/.test(r)),
      "manca .dt-segno { color: var(--color-ink); transition: … }",
    );
    assert.ok(
      regole.some((r) => /^\.dt-segno\[data-tema="foto"\] \{\s*color: var\(--color-cream\);\s*\}$/.test(r)),
      "manca .dt-segno[data-tema=\"foto\"] { color: var(--color-cream); }",
    );
  });

  test("MarkSegno rende il badge depositato senza colori, filtri o fusioni propri", () => {
    const src = codice("app/components/motion/MarkSegno.tsx");
    assert.match(src, /<RotatingMark\b/);
    // `\bfilter\b` e non `filter`: `attributeFilter` del MutationObserver è lecito.
    assert.doesNotMatch(src, /#[0-9a-f]{3,6}\b|\bfill=|\bstroke=|\bfilter\b|mix-blend|\binvert\b|brightness|grayscale|\bstyle=\{\{/i);
    assert.match(src, /\saria-hidden/);
    assert.match(src, /pointer-events-none/);
    assert.match(src, /\shidden\s/);
    // Il selettore della guardia e2e di /case/* (commit 4, spec §5.4).
    assert.match(src, /\sdata-segno[\s>]/);
  });
});

describe("il rilevatore (tema.ts, MarkSegno)", () => {
  test("nessuna zona larga 1 px che valga per tutta la larghezza (D66, deroga a §6.1 b: morta con A57 e A49)", () => {
    // Le classi a cui un foglio di app/ dà `width: 1px` (il soggetto di ogni
    // selettore: l'ultimo composto). Le regole annidate in @media contano.
    const classi1px = new Map<string, string>();
    for (const p of sorgenti(join(ROOT, "app"), [], /\.css$/)) {
      const css = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/(?<![-\w])width\s*:\s*1px\b/.test(m[2])) continue;
        for (const sel of m[1].split(",")) {
          const soggetto = sel.trim().split(/[\s>+~]+/).pop() ?? "";
          for (const c of soggetto.matchAll(/\.([\w-]+)/g)) classi1px.set(c[1], rel(p));
        }
      }
    }
    // A57: `.dt-od_mark` è morta con il corridoio della finestra; A49: anche il marcatore dell'hero. La
    // deroga D66 non ha più zone: il rilevatore la tiene per la larghezza ≤ 1 px, e questo elenco è vuoto.
    const larghe1: string[] = [];
    for (const p of sorgenti(join(ROOT, "app"))) {
      for (const t of tagCon(soloCodice(readFileSync(p, "utf8")), /\sdata-bg=/)) {
        if (/\bw-px\b|\bw-\[1px\]/.test(t)) larghe1.push(`${rel(p)} · w-px`);
        if (/\bwidth:\s*["']?1(?:px)?["']?\s*[,}]/.test(t)) larghe1.push(`${rel(p)} · style width 1`);
        const cls = /\sclassName=(?:"([^"]*)"|\{`([^`]*)`)/.exec(t);
        for (const c of (cls?.[1] ?? cls?.[2] ?? "").split(/\s+/)) {
          if (classi1px.has(c)) larghe1.push(`${rel(p)} · .${c} (${classi1px.get(c)})`);
        }
      }
    }
    assert.deepEqual(larghe1, [], `zone data-bg larghe 1 px:\n${larghe1.join("\n")}`);
  });

  test("la coda del tema dura più dello scrub numerico più lungo di app/, con 0,2 s di margine (D67)", () => {
    const scrub: Array<[string, number]> = [];
    for (const p of sorgenti(join(ROOT, "app"))) {
      for (const m of soloCodice(readFileSync(p, "utf8")).matchAll(/\bscrub\s*(?::|=\{?)\s*([0-9]*\.?[0-9]+)/g)) {
        scrub.push([rel(p), Number(m[1])]);
      }
    }
    const max = Math.max(...scrub.map(([, v]) => v));
    assert.ok(scrub.length > 10 && max >= 1.3, `scansione degli scrub sospetta: ${scrub.length} valori, massimo ${max}`);
    assert.ok(
      MARK_TEMA_CODA_S >= max + 0.2 - 1e-9,
      `MARK_TEMA_CODA_S = ${MARK_TEMA_CODA_S} s, scrub più lungo ${max} s (${scrub.filter(([, v]) => v === max).map(([f]) => f).join(", ")})`,
    );
    const segno = codice("app/components/motion/MarkSegno.tsx");
    assert.match(segno, /fino = gsap\.ticker\.time \+ MARK_TEMA_CODA_S;/);
    assert.match(segno, /gsap\.ticker\.add\(passo\)/);
    // Rimosso a coda finita e nella pulizia della rotta.
    assert.equal(segno.match(/gsap\.ticker\.remove\(passo\)/g)?.length, 2);
  });
});
