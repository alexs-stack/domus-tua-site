// L'HERO ALTO DELLA HOME, LETTO DAL SORGENTE (A49 e A71 di Alberto, 22 settembre 2026).
//
// Chi l'ha chiesto: A49 («non c'è né l'immagine alta che fa da sfondo pagina a schermo intero, né
// l'effetto dello scroll dentro l'immagine perché l'hai tagliata a metà e bloccato lo scroll della
// pagina per l'effetto zoom») e A71 («sì, fallo, anche il voto e i due link … e falla no-bg»).
// Com'è fatto oggi: HeroCinematic.tsx è la testa di era senza blocco sull'avorio (le classi .dt-testa_*
// più .dt-hero in globals.css), con la foto alta di hero.json in flusso, il blocco bianco sulla banda
// scura e il lockup sull'acqua da lg, la chiusura in cartolina all'uscita (ChiusuraFoto con la firma
// del registro). I numeri stanno in hero.ts e hero.json; qui si pretende che sorgente, CSS, media.ts e
// registro dicano la stessa geometria. Schema di intro-clocks.test.ts: regex sul sorgente, commenti
// tolti prima di cercare (soloCodice di logo-colore.test.ts). Sostituisce hero-dive.test.ts (il tuffo
// di A18-A23 è morto con A49).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chapters, scrubOf } from "../motion/chapters";
import { heroCinematic } from "../media";
import { HERO, SIZES_HERO, hwDi, salitaRiposo } from "../motion/hero";
import foto from "../motion/hero.json";

const root = join(__dirname, "..", "..", "..");
const read = (rel: string) => readFileSync(join(root, rel), "utf8");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const hero = soloCodice(read("app/components/HeroCinematic.tsx"));
const pos = soloCodice(read("app/components/Posizionamento.tsx"));
const chiusura = soloCodice(read("app/components/motion/ChiusuraFoto.tsx"));
const css = read("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
const chaptersTs = soloCodice(read("app/lib/motion/chapters.ts"));

/** Larghezza e altezza di un WebP dal chunk VP8X (canvas), VP8L o VP8. */
function webpSize(buf: Buffer): { w: number; h: number } {
  assert.equal(buf.toString("latin1", 0, 4), "RIFF", "non è un RIFF");
  assert.equal(buf.toString("latin1", 8, 12), "WEBP", "non è un WebP");
  const chunk = buf.toString("latin1", 12, 16);
  if (chunk === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (chunk === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  throw new Error(`chunk WebP sconosciuto: ${chunk}`);
}

/** La regola CSS con quel selettore esatto (fuori o dentro una media query), normalizzata. */
function regola(sel: string): string | null {
  const m = new RegExp(String.raw`(?:^|[;{}])\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\s*\{([^}]*)\}`).exec(css);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}
/** Il CSS dal blocco `@media (min-width: 64rem)` che contiene `.dt-hero[data-sopra="foto"] .dt-testa_sopra` in poi. */
function daLg(): string {
  const i = css.indexOf('.dt-hero[data-sopra="foto"] .dt-testa_sopra');
  assert.ok(i > -1, "manca la regola lg dello spazio sopra dell'hero");
  const media = css.lastIndexOf("@media", i);
  assert.equal(css.slice(media, css.indexOf("{", media)).trim(), "@media (min-width: 64rem)", "le regole da lg dell'hero non stanno sotto (min-width: 64rem)");
  return css.slice(media);
}

describe("i file dell'hero: hero.json, media.ts, i WebP (A49, D-A49-4)", () => {
  test("media.ts monta i due WebP di hero.json e ne dichiara le misure vere", () => {
    assert.equal(heroCinematic.base, foto.file);
    assert.equal(heroCinematic.baseM, foto.telefono.file);
    const d = webpSize(readFileSync(join(root, "public", heroCinematic.base)));
    const t = webpSize(readFileSync(join(root, "public", heroCinematic.baseM)));
    assert.deepEqual([d.w, d.h], foto.sorgente, "hero.json non dice la misura del WebP alto");
    assert.deepEqual([t.w, t.h], foto.telefono.sorgente, "hero.json non dice la misura della striscia");
    assert.deepEqual({ ...heroCinematic.baseSize }, { w: d.w, h: d.h }, "baseSize di media.ts non è la misura del file");
    assert.deepEqual({ ...heroCinematic.baseMSize }, { w: t.w, h: t.h }, "baseMSize di media.ts non è la misura del file");
    assert.match(heroCinematic.poster, /hero-raffaela-piscina-alta\.jpg$/);
  });

  test("la foto è la 2:3 estesa (2560×3812) e la striscia del telefono è 9:16, alta uguale, col cielo", () => {
    assert.deepEqual(foto.sorgente, [2560, 3812]);
    assert.equal(foto.telefono.sorgente[1], foto.sorgente[1], "la striscia non è alta quanto la foto");
    assert.ok(Math.abs(foto.telefono.sorgente[0] / foto.telefono.sorgente[1] - 9 / 16) < 0.001, "la striscia non è 9:16");
    for (const f of [foto, foto.telefono]) {
      assert.ok(f.cielo.cima > 0.15 && f.cielo.cima < 0.25, `il cielo trasparente vale ${f.cielo.cima} dell'altezza`);
      assert.ok(f.segno.length >= 1, "nessuna banda del segno");
      for (const [a, b] of f.segno) assert.ok(a >= 0 && b <= 1 && a < b, `banda ${a}-${b}`);
    }
    assert.match(foto.file, /-cielo\.webp$/);
    assert.match(foto.telefono.file, /-m-cielo\.webp$/);
  });

  test("i token per fascia di globals.css sono i numeri di hero.json: rapporto, altezza su larghezza, cima del soggetto", () => {
    const [w, h] = foto.sorgente;
    const [wm, hm] = foto.telefono.sorgente;
    assert.match(css, new RegExp(String.raw`--dt-hero-ar:\s*${wm} / ${hm};`), "il rapporto della striscia nel token");
    assert.match(css, new RegExp(String.raw`--dt-hero-hw:\s*${hwDi(foto.telefono.sorgente).toFixed(4)};`));
    assert.match(css, new RegExp(String.raw`--dt-hero-cima:\s*${foto.telefono.cielo.cima};`));
    assert.match(
      css,
      new RegExp(String.raw`@media \(min-width: 48rem\) \{\s*:root \{\s*--dt-hero-ar:\s*${w} / ${h};\s*--dt-hero-hw:\s*${hwDi(foto.sorgente).toFixed(4)};\s*--dt-hero-cima:\s*${foto.cielo.cima};`),
      "i tre token della foto alta da 768",
    );
    assert.equal(hwDi(foto.sorgente), 1.4891);
    assert.equal(hwDi(foto.telefono.sorgente), 1.778);
  });
});

describe("hero.ts: le quote e la salita a riposo (D-A49-1, D-A49-2, D-A49-3)", () => {
  test("le quote stanno dentro la foto, in ordine, con la coda per la cartolina", () => {
    assert.equal(SIZES_HERO, "100vw");
    assert.ok(HERO.testo > foto.cielo.cima, "il blocco comincia dentro il cielo trasparente: sarebbe bianco sulla carta");
    assert.ok(HERO.acqua > HERO.testo && HERO.coda > HERO.acqua && HERO.coda < 1);
    assert.ok(HERO.cotto > 0 && HERO.cotto < 0.1);
    // La coda libera (1 − coda) deve valere almeno un quarto di viewport (ChiusuraFoto si arma solo così)
    // su ogni schermo da 1024×640 a 2560×1440: l'altezza resa è larghezza × altezza/larghezza.
    for (const [vw, vh] of [
      [1024, 640],
      [1024, 768],
      [1280, 800],
      [1440, 900],
      [1920, 1080],
      [2560, 1440],
    ]) {
      const fotoH = vw * hwDi(foto.sorgente);
      assert.ok((1 - HERO.coda) * fotoH >= 0.25 * vh, `a ${vw}×${vh} la coda libera vale ${Math.round((1 - HERO.coda) * fotoH)} px: la cartolina non si arma`);
    }
  });

  test("salitaRiposo: il primo schermo finisce dove comincia il blocco, mai oltre il cielo, mai negativa", () => {
    const H = 1440 * 1.4891; // 2144 px a 1440
    // 1440×900: testata 90 + 1 px, banda 809: sale di 0,42·H − 809.
    assert.ok(Math.abs(salitaRiposo({ testo: HERO.testo, cima: foto.cielo.cima, fotoH: H, band: 809 }) - (0.42 * H - 809)) < 1e-9);
    // Telefono: la foto (693 px) è più corta della banda: resta al suo posto.
    assert.equal(salitaRiposo({ testo: HERO.testo, cima: foto.telefono.cielo.cima, fotoH: 693, band: 759 }), 0);
    // Schermo largo e basso (2560×720): la salita si ferma alla cima del soggetto, il tetto non si taglia.
    const H2 = 2560 * 1.4891;
    assert.equal(salitaRiposo({ testo: HERO.testo, cima: foto.cielo.cima, fotoH: H2, band: 647 }), foto.cielo.cima * H2);
  });

  test("il CSS porta le stesse quote e la stessa salita (clamp fra −cima·H, banda − testo·H e 0)", () => {
    const r = regola(".dt-hero");
    assert.ok(r, "manca .dt-hero");
    assert.match(r!, /--dt-testa-ar: var\(--dt-hero-ar\)/, "l'hero non passa il rapporto alle classi della testa");
    assert.match(r!, /--dt-testa-hw: var\(--dt-hero-hw\)/);
    assert.match(r!, new RegExp(String.raw`--dt-hero-testo: ${HERO.testo};`));
    assert.match(r!, new RegExp(String.raw`--dt-hero-acqua: ${HERO.acqua};`));
    assert.match(r!, new RegExp(String.raw`--dt-hero-coda: ${HERO.coda};`));
    assert.match(r!, new RegExp(String.raw`--dt-hero-cotto: ${HERO.cotto};`));
    assert.match(r!, /margin-top: 0;/, "l'hero deve stare sotto la testata (il patto della porta), non sotto di lei col margine della testa");
    const strato = regola(".dt-hero .dt-testa_strato");
    assert.ok(strato, "manca la salita a riposo sullo strato");
    assert.match(
      strato!,
      /margin-top: clamp\( calc\(-100% \* var\(--dt-hero-cima\) \* var\(--dt-hero-hw\)\), calc\(var\(--dt-band-h\) - 100% \* var\(--dt-hero-testo\) \* var\(--dt-hero-hw\)\), 0px \);/,
      "la salita a riposo non è clamp(−cima·H, banda − testo·H, 0) in percentuali della larghezza",
    );
    // Sotto lg lo spazio sopra comincia sull'acqua; la marca è alta quanto l'acqua col cotto nel padding (border-box).
    assert.match(regola(".dt-hero .dt-testa_sopra") ?? "", /padding-top: calc\(100% \* var\(--dt-hero-acqua\) \* var\(--dt-hero-hw\)\);/);
    const marca = regola(".dt-hero_marca") ?? "";
    assert.match(marca, /order: 1;/);
    assert.match(marca, /justify-content: flex-end;/);
    assert.match(marca, /margin-inline: -8vw;/, "sotto lg la marca deve uscire dal padding della riga: l'aspect-ratio si misura sulla sua larghezza");
    assert.match(marca, /aspect-ratio: 1 \/ calc\(\(1 - var\(--dt-hero-acqua\)\) \* var\(--dt-hero-hw\)\);/);
    assert.match(marca, /padding-bottom: calc\(100% \* var\(--dt-hero-cotto\) \* var\(--dt-hero-hw\)\);/);
    assert.match(css, /@media \(max-width: 767px\) \{\s*\.dt-hero_marca \{\s*margin-inline: -5vw;/, "sotto i 768 la riga ha 5vw di padding");
    assert.match(regola(".dt-hero_blocco") ?? "", /order: 2;/);
    // Da lg: lo spazio sopra dal blocco, la posa alta (coda − testo)·H con blocco in cima e marca in fondo, H1 bianco.
    const lg = daLg();
    assert.match(lg, /\.dt-hero\[data-sopra="foto"\] \.dt-testa_sopra \{\s*padding-top: calc\(100% \* var\(--dt-hero-testo\) \* var\(--dt-hero-hw\)\);/);
    assert.match(lg, /\.dt-hero_posa \{\s*justify-content: space-between;\s*aspect-ratio: 1 \/ calc\(\(var\(--dt-hero-coda\) - var\(--dt-hero-testo\)\) \* var\(--dt-hero-hw\)\);/);
    assert.match(lg, /\.dt-hero_marca \{\s*order: 2;\s*margin-inline: 0;\s*aspect-ratio: auto;\s*padding-bottom: 0;/);
    assert.match(lg, /\.dt-hero_blocco \{\s*order: 1;/);
    assert.match(lg, /\.dt-hero\[data-sopra="foto"\] \.dt-testa_sopra h1 \{\s*color: #fff;\s*font-size: calc\(var\(--text-d3\) \* 1\.2\);/, "l'H1 sulla foto non è bianco e un quinto più grande (A70)");
    assert.match(lg, /\.dt-hero_marca \.text-graphite \{\s*color: var\(--color-graphite\);/, "il «Domus» del lockup deve restare grafite dentro lo spazio bianco");
    // Niente ombre, veli, sticky o trasformate nel blocco dell'hero (da `.dt-hero {` all'ultima regola, il
    // grigio del lockup dentro lo spazio bianco; i commenti sono già tolti).
    const da = css.indexOf(".dt-hero {");
    const a = css.indexOf("color: var(--color-graphite);", css.indexOf(".dt-hero_marca .text-graphite", da));
    assert.ok(da > -1 && a > da, "il blocco dell'hero non è intero (manca la regola del grigio del lockup)");
    const blocco = css.slice(da, a);
    assert.ok(blocco.length > 500 && blocco.length < 4000, `il blocco dell'hero è lungo ${blocco.length} caratteri: non è quello`);
    assert.doesNotMatch(blocco, /text-shadow|box-shadow|backdrop-filter|transform\s*:|position\s*:\s*(sticky|fixed)|overflow\s*:\s*(hidden|auto|scroll)/);
  });
});

describe("HeroCinematic: il DOM della testa senza blocco (A49)", () => {
  test("è la testa di era: section#top con data-testa e data-sopra=foto, riquadro, strato, scatola della foto, spazio sopra, chiusura", () => {
    assert.match(hero, /<section\s+ref=\{sectionRef\}\s+id="top"\s+data-testa\s+data-sopra="foto"\s+className="dt-testa dt-hero relative isolate bg-cream">/);
    const riquadro = hero.indexOf('className="dt-testa_riquadro"');
    const strato = hero.indexOf('<div data-testa-strato className="dt-testa_strato">');
    const box = hero.indexOf('<div data-testa-foto-box data-hero-media className="dt-testa_foto">');
    const picture = hero.indexOf("<picture>", box);
    const sopra = hero.indexOf('<div className="dt-testa_sopra">');
    const posa = hero.indexOf('className="dt-row dt-hero_posa"');
    const marca = hero.indexOf('<div data-hero-lockup className="dt-hero_marca');
    const blocco = hero.indexOf("data-hero-block");
    const chiusuraAt = hero.indexOf('<ChiusuraFoto ease={chapters.hero.signature.ease} scrub={scrubOf("hero")} />');
    assert.ok(
      riquadro > -1 && strato > riquadro && box > strato && picture > box && sopra > picture && posa > sopra && marca > posa && blocco > marca && chiusuraAt > blocco,
      "l'ordine del DOM non è riquadro → strato → foto → spazio sopra (marca, blocco) → chiusura",
    );
    // La scatola della foto NON porta data-bg (sopra il cielo trasparente il segno resta grafite); il solo
    // data-bg è il marcatore delle bande del segno (hero.json), come nelle teste.
    assert.equal(hero.split('data-bg="foto"').length - 1, 1, "un marcatore solo");
    assert.match(hero, /<span\s+key=\{`\$\{da\}-\$\{a\}`\}\s+aria-hidden\s+data-testa-soggetto\s+data-bg="foto"\s+className="dt-testa_soggetto"/);
    assert.match(hero, /foto\.segno\.map\(/);
  });

  test("niente corridoio, tuffo, zoom, lift, marcatore da 1 px, pin o prospettiva (A49, A22)", () => {
    for (const morto of [
      "useCorridor",
      "data-corridor",
      "data-corridor-screen",
      "data-corridor-run",
      "data-hero-zoom",
      "data-hero-lift",
      "data-hero-block-lift",
      "w-px",
      "h-[var(--dt-band-h)]",
      "photoRise",
      "textLift",
      "heroBox",
      'objectPosition: "10% 100%"',
      "translate-y-[26%]",
    ]) {
      assert.ok(!hero.includes(morto), `${morto} è ancora nell'hero`);
    }
    assert.doesNotMatch(hero, /\bpin\s*:|pinSpacing|anticipatePin/);
    assert.doesNotMatch(hero, /transformPerspective|perspective\(/);
    assert.doesNotMatch(hero, /scrollTrigger|\bscale\s*:|gsap\.to\(/, "un tween di scroll sulla foto o sui testi: l'hero è in flusso");
    assert.ok(!css.includes('[data-corridor="hero"]'), 'CSS: [data-corridor="hero"] è morto');
    assert.ok(!css.includes("--corridor-run: 200svh"), "CSS: la corsa del tuffo è morta");
    assert.ok(!css.includes("data-hero-cover") && !pos.includes("data-hero-cover"), "il foglio di Posizionamento sopra l'hero è morto");
    assert.match(pos, /<section\s+id="posizionamento"\s+className="dt-chapter bg-cream">/);
    assert.match(chaptersTs, /export type CorridorId = "cartolina";/);
  });

  test("la foto: due WebP in art direction a 768, sizes 100vw, dalla cima, qualità 75 (una voce di next.config), preload (LCP)", () => {
    assert.match(hero, /const comuni = \{ alt: c\.heroAlt, sizes: SIZES_HERO, quality: 75, preload: true \} as const;/);
    assert.match(read("next.config.ts"), /qualities:\s*\[[^\]]*\b75\b/, "75 non è fra le qualità ammesse di next.config");
    assert.match(hero, /<source media="\(min-width: 768px\)" srcSet=\{fotoDesktop\} sizes=\{SIZES_HERO\} \/>/);
    assert.match(hero, /srcSet=\{fotoTelefono\}\s+className="absolute inset-0 h-full w-full object-cover"\s+style=\{\{ objectPosition: "50% 0%" \}\}/);
    assert.match(hero, /src: heroCinematic\.base, width: heroCinematic\.baseSize\.w, height: heroCinematic\.baseSize\.h/);
    assert.match(hero, /src: heroCinematic\.baseM, width: heroCinematic\.baseMSize\.w, height: heroCinematic\.baseMSize\.h/);
  });

  test("la marca: lockup nel font del logo sull'acqua, centrato sotto lg e a destra da lg a 10,5vw (A55); la firma sotto, senza scavalcare il bordo", () => {
    assert.match(hero, /data-hero-lockup className="dt-hero_marca items-center text-center lg:items-end lg:text-right"/);
    assert.match(hero, /font-brand text-hero [^"]*lg:text-\(length:--text-hero-lg\)/, "il lockup senza la misura ridotta da lg");
    assert.match(css, /--text-hero-lg:\s*clamp\(3\.1rem, 10\.5vw, 13rem\);/);
    assert.match(hero, /<span\s+data-hero-script\s+aria-hidden\s+className="script-word relative block !text-\[clamp\(2\.2rem,6vw,5\.5rem\)\]"/);
    assert.match(hero, /"--script-tuck": "0"/);
    assert.equal((hero.match(/<SplitChars[^>]*font="brand-800"[^>]*charAttr="data-hero-char"/g) ?? []).length, 2, "lockup: Domus e Tua");
    assert.equal((hero.match(/<SplitChars[^>]*font="script-400"[^>]*charAttr="data-hero-schar"/g) ?? []).length, 1, "firma");
    assert.doesNotMatch(read("app/components/motion/PreloaderShell.tsx"), /--text-hero-lg/, "il lockup del preloader non deve seguire la misura ridotta dell'hero");
  });

  test("il blocco: sovratitolo, H1 per lettera, CTA, i due link e il voto; a destra e a sinistra da lg, centrato sotto (A71)", () => {
    assert.match(hero, /data-hero-block\s+className="dt-hero_blocco flex flex-col items-center text-center max-lg:pb-\[[^\]]+\] max-lg:pt-\[[^\]]+\] lg:w-\[32vw\] lg:items-start lg:self-end lg:text-left"/);
    assert.match(hero, /<h1 className="mt-3 max-w-\[28ch\] font-display text-d3">/);
    assert.equal((hero.match(/<SplitChars[^>]*font="display-500"[^>]*\bupper\b[^>]*charAttr="data-hero-tchar"/g) ?? []).length, 2, "H1: title1 e title2, maiuscolo come ogni h1");
    assert.match(hero, /variant="cta-solid" size="lg" arrow=\{false\}/);
    assert.match(hero, /<Cta href="\/vendi" variant="ghost" arrow=\{false\}>/);
    assert.match(hero, /<Cta href="#cerca" variant="ghost" arrow=\{false\}>/);
    assert.match(hero, /<a href="#recensioni" className="mt-2 flex items-center gap-3 text-ui text-ink">/);
    assert.match(hero, /lg:items-start/);
    assert.match(hero, /lg:justify-start/);
    assert.doesNotMatch(hero, /text-white|dt-ink-media|textShadow|text-shadow/, "il bianco viene dal CSS della testa (A70), senza ombre");
  });

  test("il rito delle lettere: ruoli title e accent per gruppo, in scena all'handoff o alla prima entrata (D-A49-5)", () => {
    assert.match(hero, /role: ROLES\.title\.enter, at: groupDelay\("title", 0\), host: host\("\[data-hero-lockup\]"\)/);
    assert.match(hero, /role: ROLES\.title\.enter, at: groupDelay\("title", 1\), host: host\("h1"\)/);
    assert.match(hero, /role: ROLES\.accent\.enter, at: groupDelay\("accent", 0\), host: host\("\[data-hero-script\]"\)/);
    assert.match(hero, /if \(r\.origin\) gsap\.set\(g\.chars, \{ transformOrigin: r\.origin \}\);/);
    assert.equal((hero.match(/overwrite:\s*true/g) ?? []).length, 1, "il fromTo dei gruppi senza overwrite: true (spec §2.2)");
    assert.match(hero, /stagger: staggerEach\(r\.stagger, g\.chars\.length, durDt\.l\)/);
    assert.doesNotMatch(hero, /dur\.hero/);
    assert.match(hero, /foldNetFired\(arma\[0\], "dt-rest-failsafe"\)/);
    assert.match(hero, /gsap\.set\(arma, \{ opacity: painted \}\);/);
    assert.match(hero, /annulla = afterCurtain\(play\);/);
    assert.match(hero, /window\.setTimeout\(play, 150\)/);
    assert.match(hero, /new IntersectionObserver\(/);
    assert.match(hero, /if \(inScena\(g\.host\) \|\| typeof IntersectionObserver === "undefined"\)/);
    assert.match(hero, /suonati\.current\.has\(g\.nome\)/);
    assert.match(hero, /\{ scope: sectionRef, dependencies: \[locale\], revertOnUpdate: true \}/);
    assert.match(hero, /osservatori\.forEach\(\(o\) => o\.disconnect\(\)\)/, "gli observer si tolgono al cleanup");
  });
});

describe("il registro: la firma dell'hero è l'uscita in cartolina (D-A49-6), Posizionamento senza foglio", () => {
  test("chapters.hero: dtCartolina, scrub 0,9, innesco sullo strato di #top, il rito delle lettere come tratto secondario", () => {
    const s = chapters.hero.signature;
    assert.equal(s.ease, "dtCartolina");
    assert.ok("scrub" in s.time && s.time.scrub === 0.9);
    assert.ok("st" in s.trigger && s.trigger.el === "#top [data-testa-strato]");
    if ("st" in s.trigger) assert.deepEqual(s.trigger.st, ["top+=${fineSopra} top", "top+=${foto} 10%"]);
    assert.equal(scrubOf("hero"), 0.9);
    assert.ok((chapters.hero.secondary ?? []).some((x) => x.ease === "dtOut"));
    assert.match(hero, /chapters\.hero\.signature\.ease/, "l'hero non legge la firma dal registro");
    // ChiusuraFoto prende ease e scrub per prop, coi default delle teste.
    assert.match(chiusura, /export default function ChiusuraFoto\(\{ ease = "dtCartolina", scrub = 0\.9 \}/);
    assert.match(chiusura, /defaults: \{ ease, immediateRender: false \}/);
    assert.match(chiusura, /\bscrub,\s*invalidateOnRefresh: true/);
  });

  test("chapters.posizionamento: none, scrub 0,8, #posizionamento h2 top bottom → center top", () => {
    const s = chapters.posizionamento.signature;
    assert.equal(s.ease, "none");
    assert.ok("scrub" in s.time && s.time.scrub === 0.8);
    assert.ok("st" in s.trigger && s.trigger.el === "#posizionamento h2");
    if ("st" in s.trigger) assert.deepEqual(s.trigger.st, ["top bottom", "center top"]);
    assert.match(pos, /chapters\.posizionamento\.signature/);
    assert.doesNotMatch(pos, /import Parallax|<Parallax/);
  });

  test("il commento di contratto di page.tsx non conta più il tuffo fra i corridoi", () => {
    const pageTsx = read("app/page.tsx");
    assert.doesNotMatch(pageTsx, /il\s+tuffo\s+dell'hero/);
    assert.match(pageTsx, /foto alta/);
  });
});
