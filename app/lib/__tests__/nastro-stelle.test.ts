// IL NASTRO E IL FILM DELLE STELLE DOPO IL MOTORE — spec 2026-09-13 §2.4,
// §3.5 punto 2 e §3.6 (A20 di Alberto: titoli per lettera; A12: i gesti dei
// capitoli 4 e 5 restano quelli di oggi).
// 1. HorizonScroller non spezza più testo: niente SplitText, niente autoAlpha,
//    niente data-horizon-reveal; il manifesto è un SplitTitle dentro
//    HorizonEnter, che il nastro fa partire al cue «top 70%» della radice.
// 2. HorizonStory: manifesto e h4 del territorio sono SplitTitle, i due lead
//    sono Lead (ruolo lead di spec §2.2).
// 3. Il film delle stelle resta di 1,3 unità: il titolo non entra nella
//    timeline con tl.add, arriva col cue TITLE_CUE (0,94) sotto [data-set-on]
//    della runway. Il parser della timeline fallisce su ogni battuta che non
//    sa leggere, invece di saltarla.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const APP = join(process.cwd(), "app");
const leggi = (...p: string[]) => readFileSync(join(APP, ...p), "utf8");

function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** Indice subito dopo la parentesi che chiude quella aperta a `open`. */
function chiusura(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === "(" || ch === "{" || ch === "[") depth++;
    else if (ch === ")" || ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error("parentesi non chiusa");
}

/** Argomenti di primo livello della chiamata che apre a `open` (indice della parentesi). */
function argomenti(src: string, open: number): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === "(" || ch === "{" || ch === "[") {
      depth++;
      if (depth === 1) continue;
    } else if (ch === ")" || ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        out.push(cur.trim());
        return out;
      }
    } else if (ch === "," && depth === 1) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  throw new Error("parentesi non chiusa");
}

/** La fine del film letta dal sorgente: la catena che comincia con `tl` subito
 *  dopo la configurazione di `gsap.timeline(` e ogni istruzione `tl.<metodo>(`
 *  successiva, fino a `if (!cond.` (l'orologio a tempo). Ammesse solo .to e
 *  .fromTo con posizione numerica o TITLE_CUE: un .add, un .set, un .call,
 *  un'etichetta o una posizione relativa ("<", "+=0.2") fanno fallire il test.
 *  Restituisce max(posizione + duration) e conta le battute lette. */
function fineFilm(src: string): { fine: number; battute: number } {
  const inizio = src.indexOf("const tl = gsap.timeline(");
  assert.ok(inizio > -1, "timeline del film non trovata");
  const stop = src.indexOf("if (!cond.", inizio);
  assert.ok(stop > inizio, "blocco dell'orologio a tempo non trovato");
  const cue = Number(/const TITLE_CUE = ([\d.]+);/.exec(src)?.[1]);
  const pezzo = src.slice(inizio, stop);
  let max = 0;
  let battute = 0;
  const leggiCatena = (da: number): number => {
    let i = da;
    for (;;) {
      const m = /^\s*\.(\w+)\(/.exec(pezzo.slice(i));
      if (!m) return i;
      const open = i + m[0].length - 1;
      const args = argomenti(pezzo, open);
      assert.ok(m[1] === "to" || m[1] === "fromTo", `.${m[1]}( sul film: ammesse solo .to e .fromTo`);
      const pos = args[args.length - 1];
      const valore = pos === "TITLE_CUE" ? cue : /^\d+(\.\d+)?$/.test(pos) ? Number(pos) : Number.NaN;
      assert.ok(Number.isFinite(valore), `.${m[1]}( con posizione «${pos}»: attesi un numero o TITLE_CUE`);
      const d = /duration:\s*([\d.]+)/.exec(args[args.length - 2]);
      max = Math.max(max, valore + (d ? Number(d[1]) : 0));
      battute++;
      i = chiusura(pezzo, open);
    }
  };
  const dopoConfig = chiusura(pezzo, pezzo.indexOf("("));
  const testa = /^\s*;\s*tl(?=\s*\.)/.exec(pezzo.slice(dopoConfig));
  assert.ok(testa, "dopo la configurazione il film non continua con la catena di `tl`");
  const dopoCatena = leggiCatena(dopoConfig + testa[0].length);
  for (const m of pezzo.slice(dopoCatena).matchAll(/\btl(?=\s*\.\w+\()/g)) {
    leggiCatena(dopoCatena + m.index! + 2);
  }
  return { fine: Math.round(max * 1000) / 1000, battute };
}

describe("HorizonScroller lascia il testo al motore", () => {
  const scroller = soloCodice(leggi("components", "motion", "HorizonScroller.tsx"));
  const story = soloCodice(leggi("components", "HorizonStory.tsx"));

  test("nessuno split, nessun autoAlpha, nessun attributo di reveal proprio", () => {
    assert.doesNotMatch(scroller, /SplitText/, "HorizonScroller spezza ancora il testo");
    assert.doesNotMatch(scroller, /autoAlpha/, "autoAlpha è tornato nel nastro");
    assert.doesNotMatch(scroller + story, /data-horizon-reveal/, "reveal proprio del nastro ancora in uso");
    assert.doesNotMatch(scroller, /transformPerspective/, "le lettere devono restare piatte (A22)");
  });

  test("il cue del manifesto è un ScrollTrigger sulla radice a «top 70%», nei due versi", () => {
    assert.match(
      scroller,
      /ScrollTrigger\.create\(\{\s*trigger: root,\s*start: "top 70%",\s*onEnter: forward,\s*onLeaveBack: backward,/,
      "il cue non sta sulla radice o non esce risalendo",
    );
    assert.match(
      scroller,
      /onRefresh: \(self\) => \{\s*if \(self\.progress > 0\) forward\(\);/,
      "a un refresh oltre il cue il manifesto deve entrare",
    );
    assert.match(scroller, /api\.current\?\.play\("in"\)/);
    assert.match(scroller, /api\.current\?\.play\("out"\)/);
    assert.match(scroller, /export function HorizonEnter\(/);
    assert.match(scroller, /<RevealGroup\s+trigger="manual"/);
    // Il gruppo si registra nel layout effect del figlio, prima di questo effetto:
    // il refresh fa rileggere l'antenato al motore (sweep), all'accensione e allo spegnimento.
    // A scroll fermo (D53, whenStill): un refresh forzato cancellerebbe l'arrivo nativo a /#frammento.
    assert.match(scroller, /setAttribute\("data-on", ""\);\s*const stopRefresh = whenStill\(\(\) => requestRefresh\(\)\);/);
    assert.match(scroller, /return \(\) => \{\s*stopRefresh\(\);/);
    assert.match(scroller, /removeAttribute\("data-on"\);\s*root\.style\.height = "";\s*whenStill\(\(\) => requestRefresh\(\)\);/);
    // Manuale per [data-corridor][data-on] della radice (CUE_ANCESTOR del motore): nessun attributo in più.
    assert.doesNotMatch(scroller, /data-set-on/);
    assert.match(scroller, /<section ref=\{rootRef\} id=\{id\} data-corridor=\{corridor\}/);
  });

  test("manifesto e h4 del territorio sono SplitTitle, il manifesto dentro HorizonEnter", () => {
    assert.match(story, /<HorizonEnter[\s\S]*?<SplitTitle as="h3"[\s\S]*?<\/HorizonEnter>/);
    assert.match(story, /<SplitTitle as="h4"/);
    assert.equal((story.match(/<SplitTitle\b/g) ?? []).length, 3);
  });

  // A76: le foto dei due pannelli scorrono in FotoSlide (la galleria di era): la scatola di FotoSlide è la
  // zona foto del segno e il sipario del nastro, e la pila delle foto porta lo zoom d'ingresso.
  const slide = readFileSync(join(APP, "components", "motion", "FotoSlide.tsx"), "utf8");
  test("la foto del territorio è una zona foto del monogramma (spec §6.1, A21)", () => {
    assert.match(story, /<FotoSlide className="w-full" boxClassName="dt-media-full"/);
    assert.match(slide, /<div data-horizon-slide data-bg="foto" className=\{boxClassName\}>/);
  });

  // 2026-09-20 (Alberto: «uno spazio enorme vuoto nello scroll orizzontale»): il manifesto
  // e' la riga a due colonne con una foto nella meta' 16:9, anch'essa zona foto e sipario;
  // il lead sotto le tre frasi non c'e' piu' (ripeteva Posizionamento). Resta il lead del video.
  test("il manifesto porta la foto nella metà 16:9, zona foto e sipario del nastro", () => {
    assert.match(story, /<HorizonEnter className="dt-row grid w-full gap-\[6vw\][^"]*lg:grid-cols-2[^"]*">/);
    assert.match(story, /<FotoSlide\s+className="lg:justify-self-end"\s+boxClassName="dt-media-half !aspect-video"/);
    assert.match(story, /villa-salotto-ombrellone\.jpg/);
    assert.equal((story.match(/<FotoSlide\b/g) ?? []).length, 2, "le due foto del nastro scorrono in FotoSlide");
    assert.equal((slide.match(/data-horizon-slide-img className=/g) ?? []).length, 1, "lo zoom d'ingresso sta sulla pila, una volta");
  });

  test("l'unico lead di HorizonStory è un Lead", () => {
    assert.equal((story.match(/<Lead\b/g) ?? []).length, 1);
    assert.doesNotMatch(story, /className="lead[\s"]/);
  });

  test("le classi dello split del nastro sono uscite da globals.css", () => {
    const css = readFileSync(join(APP, "globals.css"), "utf8");
    assert.doesNotMatch(css, /\.dt-h(word|char)\b/);
  });
});

describe("il film delle stelle resta di 1,3 unità", () => {
  const src = soloCodice(leggi("components", "StarReviews.tsx"));

  test("fine della timeline a 1,3, con tutte le 14 battute lette", () => {
    const { fine, battute } = fineFilm(src);
    assert.equal(battute, 14, "13 battute della catena più il wrapper [data-sr-el]");
    assert.equal(fine, 1.3);
    assert.match(src, /\.to\(\{\}, \{ duration: 0\.2 \}, 1\.1\)/, "la coda di respiro è cambiata");
  });

  test("il titolo arriva col cue sotto [data-set-on] della runway, non con tl.add", () => {
    assert.doesNotMatch(src, /\btl\.add\(/, "una timeline di testo è stata aggiunta al film");
    assert.match(src, /const TITLE_CUE = 0\.94;/);
    assert.match(src, /titleApi\.current\?\.play\("in"\)/);
    assert.match(src, /titleApi\.current\?\.play\("out"\)/);
    assert.match(src, /<RevealGroup\s+trigger="manual"/);
    assert.match(
      src,
      /<RevealGroup\s+trigger="manual"[\s\S]*?<Reveal>[\s\S]*?<SplitTitle as="h2"[\s\S]*?<Lead className="mx-auto mt-6">[\s\S]*?<\/RevealGroup>/,
      "occhiello, titolo e lead nello stesso gruppo manuale",
    );
    // I refresh a scroll fermo (D53, whenStill): l'attesa dell'accensione sta nel cleanup con il resto.
    assert.match(
      src,
      /if \(cond\.lg\) \{\s*runway\.setAttribute\("data-set-on", ""\);\s*cleanup\.push\(whenStill\(\(\) => requestRefresh\(\)\)\);\s*\}/,
    );
    assert.match(src, /onUpdate: cond\.lg \? onFilm : undefined,/, "il cue sta sull'onUpdate della timeline");
    assert.match(src, /tl\.to\(els, \{[^}]*\}, TITLE_CUE\)/, "il wrapper [data-sr-el] si accende al cue");
    assert.match(src, /runway\.removeAttribute\("data-set-on"\);[\s\S]*?lit\.kill\(\);\s*whenStill\(\(\) => requestRefresh\(\)\);/);
  });

  test("la copertina del film è zona foto solo da onFilm (spec §3.6 e §6.1)", () => {
    const tag = /<div ref=\{introRef\}[^>]*>/.exec(src)?.[0] ?? "";
    assert.ok(tag.length > 0, "manca il layer .dt-starrev_intro");
    assert.doesNotMatch(tag, /data-bg/, "data-bg statico sulla copertina: sarebbe foto anche a copertina spenta");
    assert.match(src, /intro\.setAttribute\("data-bg", "foto"\)/);
    assert.equal((src.match(/intro\.removeAttribute\("data-bg"\)/g) ?? []).length, 2, "una volta in onFilm, una nel cleanup");
    assert.match(src, /Math\.hypot\(geo\.cx, geo\.cy\) <= geo\.r \* STAR_INNER_RATIO/, "la regola è il raggio interno sull'angolo del segno");
  });

  test("i commenti non parlano più del muro, della superficie curva o del pin", () => {
    const STANTIO = /\bmur[oi]\b|superficie curva|cupola|\b(al|sul) pin\b|containerAnimation per i reveal/i;
    for (const file of [
      ["components", "StarReviews.tsx"],
      ["components", "motion", "HorizonScroller.tsx"],
    ]) {
      const righe = leggi(...file)
        .split("\n")
        .map((r, i) => ({ r, n: i + 1 }))
        .filter(({ r }) => STANTIO.test(r))
        .map(({ n, r }) => `${n}: ${r.trim()}`);
      assert.deepEqual(righe, [], `${file.join("/")} ha ancora commenti stantii`);
    }
  });
});
