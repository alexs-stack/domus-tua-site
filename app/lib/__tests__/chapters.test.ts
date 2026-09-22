// Le firme di capitolo della home: A20 di Alberto («Fedeltà letterale»), D18.
//
// Il registro app/lib/motion/chapters.ts ha oggi 17 voci della home e il tuffo
// delle pagine interne. Questo test applica le regole di spec §3.1:
// - curve delle firme a distanza ≥ 0,045 (100 campioni con gsap.parseEase);
// - scrub numerici e durate a tempo a distanza ≥ 0,1;
// - inneschi diversi;
// - `none` firma di un capitolo solo.
// Le CustomEase si costruiscono dalle cifre del registro (`curve`). Il
// consumatore di un'ease la registra in gsap.ts nel suo commit (spec §2.6), e
// da lì il test pretende le stesse cifre. Pretende anche, per spec §3.1:
// - un capitolo consumato (CHAPTER_FILES) trova le sue CustomEase registrate;
// - ogni CustomEase di capitolo registrata ha un consumatore;
// - le stringhe del registro combaciano col codice dei nastri di oggi (CODE),
//   salvo le divergenze dichiarate in PENDING.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { chapters, HOME_ORDER, scrubOf, type Chapter, type ChapterId } from "../motion/chapters";

gsap.registerPlugin(CustomEase);

const ROOT = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const relOf = (p: string) => relative(ROOT, p).split(sep).join("/");

/* I commenti vanno via prima di cercare (schema di logo-colore.test.ts, D18):
   i file spiegano i divieti nominandoli. */
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
function sorgenti(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === "__tests__") continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) sorgenti(p, out);
    else if (/\.(tsx|ts)$/.test(nome)) out.push(p);
  }
  return out;
}
const FILES = sorgenti(join(ROOT, "app")).map((p) => ({
  rel: relOf(p),
  code: soloCodice(readFileSync(p, "utf8")),
}));

/** Le famiglie di serie ammesse nelle firme. */
const STD = /^(none|(power[1-4]|sine|expo|circ)\.(in|out|inOut))$/;
const EPS = 1e-9;
const HOME: Chapter[] = HOME_ORDER.map((id) => chapters[id]);

/** Le CustomEase registrate oggi in gsap.ts: nome → cifre (anche su più righe, come dtLoader a `:91`). */
const REGISTERED = new Map(
  [...soloCodice(read("app/lib/motion/gsap.ts")).matchAll(/CustomEase\.create\(\s*"([^"]+)",\s*"([^"]+)"\s*\)/g)].map(
    (m) => [m[1], m[2]] as const,
  ),
);

/* Chi consuma un capitolo (spec §2.6: la CustomEase nasce col consumatore;
   D18). I file sono quelli dei commit 8-18; un file che non esiste ancora non
   consuma nulla. */
const CHAPTER_FILES: Partial<Record<ChapterId, string[]>> = {
  hero: ["app/components/HeroCinematic.tsx"],
  storia: ["app/components/motion/HorizonScroller.tsx"],
  voci: ["app/components/Voci.tsx"],
  paths: ["app/components/Paths.tsx"],
  finestra: ["app/components/OpenDomus.tsx"],
  testimonianza: ["app/components/FeaturedTestimonial.tsx"],
  team: ["app/components/Team.tsx", "app/components/motion/HorizontalRail.tsx"],
  cartolina: ["app/components/Congedo.tsx"],
};

/* Il codice dei nastri che esistono già (A12, A03), confrontato con le
   stringhe del registro (A20, D18). PENDING: il capitolo il cui codice diverge
   ancora dal registro, col commit che lo allinea e toglie la voce. La rotaia
   non sta qui: HorizontalRail riceve scrub ed ease per prop e calcola il suo
   innesco, e gesti-coda.test.ts confronta con la voce `team` quello che
   Team.tsx le passa (scrub 0,7, dtRail; spec 2026-09-13 §3.16). */
const CODE: Partial<Record<ChapterId, string>> = {
  storia: "app/components/motion/HorizonScroller.tsx",
  recensioni: "app/components/StarReviews.tsx",
};
const PENDING: Partial<Record<ChapterId, number>> = {};

/* D-A49-6 (22 set. 2026, sera): l'USCITA dell'hero è la chiusura in cartolina — la stessa animazione delle
   teste di era e della coda della finestra, voluta uguale da Alberto (A53: «la foto con un animazione si
   chiude, come qui»; A68: «come nelle altre foto lunga alta, si chiudesse con l'animazione»; A49/A71 sulla
   home). L'hero e la cartolina del Congedo condividono quindi ease (dtCartolina) e scrub (0,9) per
   scelta, con inneschi diversi: fra questi due D18 non vale, e i controlli sulle firme li saltano a
   coppia dichiarata. */
const MOTIVO_COMUNE: ReadonlyArray<readonly [ChapterId, ChapterId]> = [["hero", "cartolina"]];
const comune = (a: ChapterId, b: ChapterId) => MOTIVO_COMUNE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
const quotedIn = (code: string, name: string) => [`"${name}"`, `'${name}'`, "`" + name + "`"].some((q) => code.includes(q));

/**
 * Il file consuma il capitolo dal registro:
 * - `chapters.<id>` o `chapters["<id>"]`;
 * - `id: "<id>"` di useCorridor;
 * - `chapter="<id>"` di ClipMedia e Hairline.
 * `corridor="<id>"` non conta: è l'attributo che i test contano, non una firma.
 */
function consumes(code: string, id: string): boolean {
  const e = escapeRe(id);
  return new RegExp(String.raw`chapters\.${e}\b|chapters\[["']${e}["']\]|\bid:\s*["']${e}["']|\bchapter=["']${e}["']`).test(code);
}

/** I file di CHAPTER_FILES che esistono e consumano il capitolo, o scrivono il nome di una sua CustomEase. */
function chapterUsers(ch: Chapter): string[] {
  const eases = [ch.signature, ...(ch.secondary ?? [])].map((e) => e.ease).filter((n) => !STD.test(n));
  return (CHAPTER_FILES[ch.id] ?? []).filter((rel) => {
    const code = FILES.find((f) => f.rel === rel)?.code;
    return code !== undefined && (consumes(code, ch.id) || eases.some((n) => quotedIn(code, n)));
  });
}

const FUORI = new Set(["app/lib/motion/gsap.ts", "app/lib/motion/chapters.ts"]);
/** I file dell'app, fuori da gsap.ts e chapters.ts, che scrivono il nome dell'ease fra virgolette. */
const literalUsers = (name: string) => FILES.filter((f) => !FUORI.has(f.rel) && quotedIn(f.code, name)).map((f) => f.rel);

type EaseUse = { chapter: string; ease: string; curve?: string };
const USES: EaseUse[] = Object.values(chapters).flatMap((ch) => [
  { chapter: ch.id, ease: ch.signature.ease, curve: ch.signature.curve },
  ...(ch.secondary ?? []).map((s) => ({ chapter: ch.id, ease: s.ease, curve: s.curve })),
]);

/** Ogni ease non di serie del registro, con le cifre della prima voce che la nomina. */
const CURVES = new Map<string, string>();
for (const u of USES) if (!STD.test(u.ease) && u.curve && !CURVES.has(u.ease)) CURVES.set(u.ease, u.curve);
for (const [name, digits] of CURVES) CustomEase.create(name, digits);

const curve = (name: string) => gsap.parseEase(name) as (t: number) => number;
function distance(a: string, b: string): number {
  const fa = curve(a);
  const fb = curve(b);
  let max = 0;
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    max = Math.max(max, Math.abs(fa(t) - fb(t)));
  }
  return max;
}

describe("chapters.ts: il registro", () => {
  // I capitoli di pagina (page-dive, ingresso, soglia) sono morti con A38/A41 (20 set. 2026).
  test("17 capitoli della home in ordine, e nessun altro", () => {
    assert.equal(HOME_ORDER.length, 17);
    assert.equal(new Set(HOME_ORDER).size, 17);
    for (const id of HOME_ORDER) assert.equal(chapters[id].id, id);
    assert.deepEqual(Object.keys(chapters).sort(), [...HOME_ORDER].sort());
  });

  test("ease ammesse: famiglie di serie di GSAP o CustomEase con le cifre nel registro", () => {
    for (const u of USES) {
      if (STD.test(u.ease)) continue;
      assert.ok(u.curve, `${u.chapter}: ${u.ease} non è di serie e non porta \`curve\``);
      assert.equal(CURVES.get(u.ease), u.curve, `${u.ease}: due curve diverse nel registro`);
      const f = curve(u.ease);
      assert.ok(Math.abs(f(0)) < 1e-6 && Math.abs(f(1) - 1) < 1e-6, `${u.ease}: la curva non va da 0 a 1`);
    }
  });

  test("una CustomEase già registrata in gsap.ts ha le cifre del registro", () => {
    for (const [name, digits] of CURVES) {
      const inGsap = REGISTERED.get(name);
      if (inGsap === undefined) continue;
      assert.equal(inGsap, digits, `${name}: gsap.ts e chapters.ts non hanno la stessa curva`);
    }
  });

  test("chi scrive il nome di una CustomEase di capitolo la trova registrata in gsap.ts (spec §2.6)", () => {
    const mancanti: string[] = [];
    for (const name of CURVES.keys()) {
      const users = literalUsers(name);
      if (users.length > 0 && !REGISTERED.has(name)) mancanti.push(`${name} (${users.join(", ")})`);
    }
    assert.deepEqual(mancanti, []);
  });

  test("il rilevatore dei consumatori riconosce le quattro forme e ignora data-corridor", () => {
    assert.ok(consumes("tl.to(zoom, { ease: chapters.hero.signature.ease })", "hero"));
    assert.ok(consumes('const s = chapters["finestra"].signature;', "finestra"));
    assert.ok(consumes('useCorridor(ref, { id: "cartolina", build })', "cartolina"));
    assert.ok(consumes('<ClipMedia chapter="method" from="left">', "method"));
    assert.ok(!consumes('<HorizontalRail corridor="team" runway={120}>', "team"));
    assert.ok(!consumes("chapters.heroic", "hero"));
  });

  test("un capitolo consumato ha le sue CustomEase registrate con le cifre del registro (spec §3.1)", () => {
    const mancanti = new Set<string>();
    for (const ch of Object.values(chapters)) {
      const users = chapterUsers(ch);
      if (users.length === 0) continue;
      for (const e of [ch.signature, ...(ch.secondary ?? [])]) {
        if (STD.test(e.ease)) continue;
        if (REGISTERED.get(e.ease) !== e.curve) mancanti.add(`${ch.id}: ${e.ease} (${users.join(", ")})`);
      }
    }
    assert.deepEqual([...mancanti], []);
  });

  test("ogni CustomEase di capitolo registrata in gsap.ts ha un consumatore (spec §3.1)", () => {
    const orfane = [...CURVES.keys()].filter(
      (name) =>
        REGISTERED.has(name) &&
        literalUsers(name).length === 0 &&
        !Object.values(chapters).some(
          (ch) => [ch.signature, ...(ch.secondary ?? [])].some((e) => e.ease === name) && chapterUsers(ch).length > 0,
        ),
    );
    assert.deepEqual(orfane, []);
  });

  test("il registro combacia col codice dei nastri di oggi, salvo PENDING", () => {
    const scarti: string[] = [];
    for (const [id, file] of Object.entries(CODE) as Array<[ChapterId, string]>) {
      if (id in PENDING) continue;
      const code = FILES.find((f) => f.rel === file)?.code ?? "";
      // Un nastro che legge chapters.<id> prende le stringhe da lì (A20, D18).
      if (consumes(code, id)) continue;
      const s = chapters[id].signature;
      if (!("st" in s.trigger) || !("scrub" in s.time)) {
        scarti.push(`${id}: nel registro non è in scrub con start ed end`);
        continue;
      }
      for (const needle of [`start: "${s.trigger.st[0]}"`, `end: "${s.trigger.st[1]}"`, `scrub: ${s.time.scrub}`, `"${s.ease}"`]) {
        if (!code.includes(needle)) scarti.push(`${id}: ${file} non contiene ${needle}`);
      }
    }
    assert.deepEqual(scarti, []);
  });
});

describe("A20 sulle firme della home (D18)", () => {
  test("nomi di ease diversi fra le 17 firme, salvo il motivo comune d'uscita (hero e cartolina, D-A49-6)", () => {
    const ripetute: string[] = [];
    for (let i = 0; i < HOME.length; i++) {
      for (let j = i + 1; j < HOME.length; j++) {
        if (HOME[i].signature.ease === HOME[j].signature.ease && !comune(HOME[i].id, HOME[j].id)) ripetute.push(`${HOME[i].id}/${HOME[j].id}: ${HOME[i].signature.ease}`);
      }
    }
    assert.deepEqual(ripetute, []);
    assert.equal(chapters.hero.signature.ease, chapters.cartolina.signature.ease, "l'uscita dell'hero è la cartolina (A53, A49)");
  });

  test("`none` è firma di un capitolo solo", () => {
    const lineari = HOME.filter((c) => c.signature.ease === "none").map((c) => c.id);
    assert.ok(lineari.length <= 1, `none in: ${lineari.join(", ")}`);
  });

  test("le curve delle firme distano almeno 0,045", () => {
    const vicine: string[] = [];
    for (let i = 0; i < HOME.length; i++) {
      for (let j = i + 1; j < HOME.length; j++) {
        if (comune(HOME[i].id, HOME[j].id)) continue;
        const d = distance(HOME[i].signature.ease, HOME[j].signature.ease);
        if (d < 0.045) vicine.push(`${HOME[i].id}/${HOME[j].id} ${d.toFixed(3)}`);
      }
    }
    assert.deepEqual(vicine, []);
  });

  test("i tratti secondari non lineari distano almeno 0,045 dalle firme degli altri capitoli", () => {
    const vicine: string[] = [];
    for (const ch of HOME) {
      for (const s of ch.secondary ?? []) {
        if (s.ease === "none") continue;
        for (const other of HOME) {
          if (other.id === ch.id || comune(ch.id, other.id)) continue;
          const d = distance(s.ease, other.signature.ease);
          if (d < 0.045) vicine.push(`${ch.id}:${s.ease}/${other.id} ${d.toFixed(3)}`);
        }
      }
    }
    assert.deepEqual(vicine, []);
  });

  test("scrub: `true` in un capitolo solo, numerici distanti almeno 0,1", () => {
    const scrubs = HOME.flatMap((c) => ("scrub" in c.signature.time ? [{ id: c.id, v: c.signature.time.scrub }] : []));
    assert.ok(scrubs.filter((s) => s.v === true).length <= 1, "scrub true in più capitoli");
    const nums = scrubs.flatMap((s) => (typeof s.v === "number" ? [{ id: s.id, v: s.v }] : []));
    const vicini: string[] = [];
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (comune(nums[i].id, nums[j].id)) continue;
        if (Math.abs(nums[i].v - nums[j].v) < 0.1 - EPS) vicini.push(`${nums[i].id}/${nums[j].id}`);
      }
    }
    assert.deepEqual(vicini, []);
  });

  test("durate a tempo distanti almeno 0,1 s", () => {
    const durs = HOME.flatMap((c) => ("dur" in c.signature.time ? [{ id: c.id, v: c.signature.time.dur }] : []));
    const vicine: string[] = [];
    for (let i = 0; i < durs.length; i++) {
      for (let j = i + 1; j < durs.length; j++) {
        if (Math.abs(durs[i].v - durs[j].v) < 0.1 - EPS) vicine.push(`${durs[i].id}/${durs[j].id}`);
      }
    }
    assert.deepEqual(vicine, []);
  });

  test("inneschi: coppie start/end diverse e rootMargin diversi", () => {
    const st = HOME.flatMap((c) => ("st" in c.signature.trigger ? [c.signature.trigger.st.join(" → ")] : []));
    assert.equal(new Set(st).size, st.length, `coppie ripetute: ${st.join(" | ")}`);
    const io = HOME.flatMap((c) => ("io" in c.signature.trigger ? [c.signature.trigger.io.rootMargin] : []));
    assert.equal(new Set(io).size, io.length, `rootMargin ripetuti: ${io.join(" | ")}`);
  });

  test("scrubOf legge lo scrub e rifiuta i capitoli a tempo", () => {
    // A49: l'hero non è più il tuffo in scrub true; la sua uscita ha lo scrub della cartolina.
    assert.equal(scrubOf("hero"), 0.9);
    assert.equal(scrubOf("finestra"), 0.15);
    assert.equal(scrubOf("team"), 0.7);
    assert.throws(() => scrubOf("voci"), /a tempo/);
  });
});

describe("componenti dei gesti a clip", () => {
  const soloIn = (tag: string, file: string) => {
    const users = FILES.filter((f) => new RegExp(`<${tag}\\b`).test(f.code)).map((f) => f.rel);
    assert.ok(users.every((u) => u === file), `<${tag} fuori da ${file}: ${users.join(", ")}`);
  };
  test("<ClipMedia solo in Method.tsx", () => soloIn("ClipMedia", "app/components/Method.tsx"));
  test("<Hairline solo in DomusDocProtocol.tsx", () => soloIn("Hairline", "app/components/DomusDocProtocol.tsx"));

  /* Spec §3.1 (C01, D18): nessun componente della home scrive clipPath inset
     in un tween a tempo. Si leggono gli argomenti di ogni chiamata `.to(`,
     `.from(` e `.fromTo(` contando le parentesi, in qualunque ordine delle
     chiavi. La chiamata è a tempo se non porta `scrollTrigger` e non sta
     dentro `build` di useCorridor, dove la timeline è in scrub e le durate sono
     posizioni. Senza `duration` un tween dura 0,5 s, quindi è a tempo anche
     lui. `gsap.set` non conta: dura zero. */
  const CLIP_INSET = /\bclipPath\s*:\s*(?:["'`]inset\(|clipOpen\b|clipClosed\(|clipFrame\()/;

  /** Il testo fra la parentesi aperta all'indice `open` e la sua chiusa. */
  function argsAt(code: string, open: number): string {
    let depth = 0;
    for (let i = open; i < code.length; i++) {
      if (code[i] === "(") depth++;
      else if (code[i] === ")" && --depth === 0) return code.slice(open + 1, i);
    }
    return code.slice(open + 1);
  }

  /** Gli intervalli dei corpi `build: (tl, q) => { … }` e `build(tl, q) { … }`. */
  function buildBodies(code: string): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    for (const m of code.matchAll(/\bbuild\s*(?::\s*(?:\([^)]*\)|[\w$]+)\s*=>\s*|\([^)]*\)\s*)\{/g)) {
      const start = (m.index ?? 0) + m[0].length - 1;
      let depth = 0;
      for (let i = start; i < code.length; i++) {
        if (code[i] === "{") depth++;
        else if (code[i] === "}" && --depth === 0) {
          out.push([start, i]);
          break;
        }
      }
    }
    return out;
  }

  /** Gli argomenti delle chiamate a tempo che scrivono un clip inset. */
  function timedClipCalls(code: string): string[] {
    const zones = buildBodies(code);
    const out: string[] = [];
    for (const m of code.matchAll(/[\w$)\]]\s*\.\s*(?:to|from|fromTo)\s*\(/g)) {
      const open = (m.index ?? 0) + m[0].length - 1;
      if (zones.some(([a, b]) => open > a && open < b)) continue;
      const args = argsAt(code, open);
      if (CLIP_INSET.test(args) && !/\bscrollTrigger\s*:/.test(args)) out.push(args.replace(/\s+/g, " ").slice(0, 120));
    }
    return out;
  }

  /* Dichiarati in spec §3.1: il sipario esistente del nastro e la firma di
     Costi chiari; ClipMedia e Hairline portano le firme di Method e D.O.C.
     (spec §2.7, D18). Congedo non serve: il ritaglio della cartolina lo
     scrive `paintClip` in un `onUpdate`, non un tween di clipPath. */
  const DICHIARATI = new Set([
    "app/components/motion/HorizonScroller.tsx",
    // A59: lo sfoglio delle foto di D.O.C. (tratto «sfoglio» del registro).
    "app/components/DomusDocProtocol.tsx",
    "app/components/CostiChiari.tsx",
    "app/components/motion/ClipMedia.tsx",
    "app/components/motion/Hairline.tsx",
  ]);

  test("il rilevatore vede i clip inset a tempo in ogni forma e ignora scrub, build, set e poligoni", () => {
    const n = (code: string) => timedClipCalls(code).length;
    assert.equal(n('gsap.to(el, { clipPath: "inset(0% 100% 0% 0%)", duration: 1.6 })'), 1);
    assert.equal(n('gsap.to(el, { duration: 1, clipPath: "inset(0%)" })'), 1);
    assert.equal(n("gsap.to(el, { clipPath: clipOpen })"), 1);
    assert.equal(n('tl.fromTo(el, { clipPath: clipClosed("left") }, { clipPath: clipOpen, ease: "power4.out" })\n  .to(x, { opacity: 1 })'), 1);
    assert.equal(n("gsap.timeline({ defaults: { duration: 2 } }).to(el, { clipPath: clipFrame(4, 10) })"), 1);
    assert.equal(n('gsap.to(el, { clipPath: clipFrame(8, 22), ease: "dtCartolina", scrollTrigger: { trigger: el, scrub: 0.9 } })'), 0);
    assert.equal(
      n('useCorridor(ref, { id: "cartolina", build: (tl, q) => { tl.to(q("[data-pc]"), { clipPath: clipFrame(8, 22), ease: "dtCartolina" }, 0); } })'),
      0,
    );
    assert.equal(n('gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)" })'), 0);
    assert.equal(n('tl.to(el, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1 })'), 0);
  });

  test("nessun componente della home scrive clipPath inset in un tween a tempo, salvo i dichiarati", () => {
    const home = new Set(
      [...read("app/page.tsx").matchAll(/from "\.\/components\/(\w+)"/g)].map((m) => `app/components/${m[1]}.tsx`),
    );
    for (const f of FILES) {
      if (f.rel.startsWith("app/components/motion/") && f.rel.endsWith(".tsx") && !/\/Preloader(Shell)?\.tsx$/.test(f.rel)) {
        home.add(f.rel);
      }
    }
    const colpevoli = FILES.filter((f) => home.has(f.rel) && !DICHIARATI.has(f.rel)).flatMap((f) =>
      timedClipCalls(f.code).map((c) => `${f.rel}: ${c}`),
    );
    assert.deepEqual(colpevoli, []);
  });
});
