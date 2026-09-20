// LA TESTA DI ERA A RIPOSO: LO STATO DEL CSS È L'UNICO STATO (D77 di A28; D176, D184, D190 del brief T; A40 e A41 di Alberto).
//
// Chi l'ha chiesto: A38 di Alberto (20 settembre 2026): la fotografia a schermo intero diventa
// lo sfondo, le scritte stanno dentro, bianche. D190: senza JS e con moto ridotto lo stato del
// CSS è lo stato a riposo — scatola, strato uguale alla scatola (`--dt-testa-m: 0px`), testi
// dentro, bianchi e nudi (A40: nessuna ombra); il bianco sta nel markup, non sotto il gate.
// D191: da lg il blocco dei testi è assoluto anche a riposo (CLS 0 per costruzione: un cambio
// di font non muove la pagina), sotto lg sta in flusso dentro il riquadro a `min-height:
// 100svh`. Vincoli globali: senza JS e con reduced-motion nessun
// `data-hero-intro`, nessun corridoio, nessun testo nascosto in CSS.
//
// Com'è fatto oggi, e che cosa si legge qui (sorgenti e CSS, senza DOM; il DOM lo prova
// e2e/a28.spec.ts, «senza JS e con moto ridotto»):
// - fuori flusso stanno solo lo strato della foto (assoluto nel riquadro, la scatola di
//   `<Image fill>`) e il riquadro stesso, sticky in alto (A41: la foto resta ferma mentre il
//   blocco dei testi e la pagina le scorrono sopra); nessuna regola sotto un gate: lo stato è uno;
// - nessuno `display: none`, nessuna `opacity` e nessun `clip-path` su un testo nel CSS della
//   testa: il solo stato dipinto resta `--dt-painted` (spec §2.5);
// - il riquadro è alto 100svh con `overflow: clip` su ogni fascia; il blocco dei testi è
//   `min-height: 100svh` e cresce col testo (D177: nulla si taglia, la foto sotto resta sticky);
// - la section porta il `margin-top` negativo su ogni fascia: la foto è il pixel 0 (D176);
// - il CSS della testa non scrive `color` (il bianco sta nel markup, con `!` dove una regola
//   non stratificata lo pretende: `.eyebrow`, `.script-word`, `.lead`) e non scrive mai
//   `text-shadow` (A40: bianco nudo); nessun `text-shadow: none` in `app/` (D184);
// - PageHero e PageHeroTesta sono server: nessun tween, nessun hook; `--script-tuck: 0` solo sotto
//   `.dt-testa` (D185);
// - la testata sopra la foto è fatta di classi (D186): nessuna regola CSS nuova su `header`
//   oltre a D82 (`header[data-solid]` sotto lg).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const cssPulito = () => leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");

const MQ_CORRIDOIO = "@media (min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";
const MQ_LG = "@media (min-width: 64rem)";

/** Le regole `selettore { dichiarazioni }` di un CSS, con la catena dei blocchi @ che le contengono. */
function regole(css: string): Array<{ selettore: string; corpo: string; media: string[] }> {
  const out: Array<{ selettore: string; corpo: string; media: string[] }> = [];
  const corpoDa = (open: number): [string, number] => {
    let depth = 0;
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}" && --depth === 0) return [css.slice(open + 1, i), i + 1];
    }
    throw new Error("CSS: parentesi non chiusa");
  };
  const visita = (testo: string, base: number, media: string[]) => {
    let i = 0;
    while (i < testo.length) {
      const open = testo.indexOf("{", i);
      if (open === -1) return;
      const testa = testo.slice(i, open).trim().replace(/^[;}]+/, "").trim();
      const [corpo, dopo] = corpoDa(base + open);
      if (testa.startsWith("@") && corpo.includes("{")) visita(corpo, base + open + 1, [...media, testa]);
      else out.push({ selettore: testa, corpo, media });
      i = dopo - base;
    }
  };
  visita(css, 0, []);
  return out;
}

const TESTA = /^(:root\[data-hero-intro\]\s+)?\.dt-testa(?=[_\s.:,[]|$)/;
/** Lo strato della FOTO: assoluto per costruzione anche a riposo (la scatola di `<Image fill>`), con margine 0 uguale al riquadro. */
const STRATO_FOTO = ".dt-testa_strato";
/** A41: il riquadro della foto è sticky (fermo mentre la pagina gli scorre sopra); il blocco dei testi sta in flusso, sopra. */
const RIQUADRO = ".dt-testa_riquadro";
const BLOCCO = ".dt-testa_blocco";

describe("D190: lo stato del CSS è lo stato a riposo, e fuori dal gesto la testa è ferma", () => {
  const css = cssPulito();
  const dellaTesta = regole(css).filter((r) => r.selettore.split(",").some((s) => TESTA.test(s.trim())));
  const per = (sel: string) => dellaTesta.filter((r) => r.selettore === sel);

  test("il CSS della testa esiste", () => {
    assert.ok(dellaTesta.length >= 6, `attese almeno sei regole .dt-testa*: ${dellaTesta.length}`);
  });

  test("fuori flusso stanno solo lo strato della foto (assoluto nel riquadro) e il riquadro (sticky, A41); nessun gate, nessun fixed", () => {
    const fuori: string[] = [];
    for (const r of dellaTesta) {
      if (!/position\s*:\s*(absolute|fixed|sticky)/.test(r.corpo)) continue;
      const selettori = r.selettore.split(",").map((s) => s.trim());
      if (selettori.every((s) => s === STRATO_FOTO) && /position\s*:\s*absolute/.test(r.corpo)) continue;
      if (selettori.every((s) => s === RIQUADRO) && /position\s*:\s*sticky/.test(r.corpo)) continue;
      fuori.push(r.selettore);
    }
    assert.deepEqual(fuori, []);
    assert.ok(!dellaTesta.some((r) => r.selettore.startsWith(":root[data-hero-intro]")), "la testa non ha più regole sotto il gate: lo stato è uno solo (A41)");
    for (const r of dellaTesta) assert.doesNotMatch(r.corpo, /position\s*:\s*fixed/, `${r.selettore}: fixed nella testa`);
  });

  test("nessun testo nascosto nel CSS della testa: niente display none, opacity o clip-path fuori dal gate; niente color, niente text-shadow (A40)", () => {
    const colpe: string[] = [];
    for (const r of dellaTesta) {
      const gate = r.media.includes(MQ_CORRIDOIO) && r.selettore.startsWith(":root[data-hero-intro]");
      if (gate) continue;
      if (/display\s*:\s*none|opacity\s*:|clip-path\s*:|visibility\s*:\s*hidden/.test(r.corpo)) colpe.push(r.selettore);
    }
    assert.deepEqual(colpe, []);
    for (const r of dellaTesta) {
      assert.doesNotMatch(r.corpo, /(^|[^-])color\s*:/, `${r.selettore}: il CSS della testa scrive color (il bianco è nel markup, D184)`);
      assert.doesNotMatch(r.corpo, /text-shadow/, `${r.selettore}: text-shadow nella testa (A40: bianco nudo)`);
      assert.doesNotMatch(r.corpo, /box-shadow/, `${r.selettore}: box-shadow (DESIGN.md:417)`);
    }
    // Il trattino dell'occhiello resta decorativo: nessuna regola `.dt-testa .eyebrow::before`.
    assert.ok(!dellaTesta.some((r) => /eyebrow::before/.test(r.selettore)), "il trattino resta decorativo (esente da 1.4.11)");
  });

  test("la scatola (D176, A41): section sotto la testata su ogni fascia; riquadro sticky 100svh con clip; strato = riquadro; blocco in flusso sopra la foto, centrato, a tre righe", () => {
    const base = per(".dt-testa").filter((r) => r.media.length === 0);
    assert.ok(base.length >= 1, ".dt-testa senza regola base");
    assert.ok(base.some((r) => /margin-top\s*:\s*calc\(-1 \* \(var\(--dt-head-h\) \+ 1px\)\)/.test(r.corpo)), "la section non sale sotto la testata fuori da ogni media query (D176)");
    assert.ok(base.some((r) => /--dt-testa-h\s*:\s*100svh/.test(r.corpo)), "la scatola non è 100svh");
    assert.ok(base.some((r) => /--script-tuck\s*:\s*0\b/.test(r.corpo)), "--script-tuck: 0 non sta sotto .dt-testa (D185)");
    assert.doesNotMatch(css, /--dt-testa-m\b|--dt-testa-mf/, "il margine della parallasse è morto (A41)");
    // Il riquadro: sticky in alto, alto 100svh, clip (mai hidden), il placeholder tinta alta; una regola sola, su ogni fascia.
    const riquadro = per(RIQUADRO);
    assert.equal(riquadro.length, 1, "una sola regola del riquadro, senza media query (A41)");
    assert.deepEqual(riquadro[0].media, []);
    assert.match(riquadro[0].corpo, /position\s*:\s*sticky/);
    assert.match(riquadro[0].corpo, /(^|[^-])top\s*:\s*0/);
    assert.match(riquadro[0].corpo, /(^|[^-])height\s*:\s*var\(--dt-testa-h\)/, "il riquadro non è alto 100svh");
    assert.match(riquadro[0].corpo, /overflow\s*:\s*clip/, "il riquadro ritaglia con clip, mai hidden");
    assert.doesNotMatch(riquadro[0].corpo, /overflow\s*:\s*(hidden|auto|scroll)|clip-path|transform|min-height/);
    assert.match(riquadro[0].corpo, /background-color\s*:\s*var\(--dt-tinta-alta, var\(--color-cream-deep\)\)/, "il placeholder del riquadro non è la tinta alta (D125)");
    // Lo strato è il riquadro: inset 0, nessun margine, nessuna trasformazione.
    const strato = per(STRATO_FOTO);
    assert.equal(strato.length, 1);
    assert.match(strato[0].corpo, /inset\s*:\s*0/);
    assert.doesNotMatch(strato[0].corpo, /transform|clip-path|height\s*:\s*calc/);
    // Il blocco: in flusso, sopra la foto (z 1) con margin-top −100svh, alto almeno 100svh, griglia a tre righe centrata (A41).
    const blocco = per(BLOCCO);
    assert.equal(blocco.length, 1, "una sola regola del blocco, senza media query (A41)");
    assert.match(blocco[0].corpo, /position\s*:\s*relative/);
    assert.match(blocco[0].corpo, /z-index\s*:\s*1/);
    assert.match(blocco[0].corpo, /margin-top\s*:\s*calc\(-1 \* var\(--dt-testa-h\)\)/, "il blocco non sale sopra la foto");
    assert.match(blocco[0].corpo, /min-height\s*:\s*var\(--dt-testa-h\)/, "il blocco non è alto almeno 100svh");
    assert.match(blocco[0].corpo, /display\s*:\s*grid/);
    assert.match(blocco[0].corpo, /grid-template-rows\s*:\s*auto 1fr auto/, "le tre righe: lead, titolo, comandi");
    assert.match(blocco[0].corpo, /justify-items\s*:\s*center/);
    assert.match(blocco[0].corpo, /text-align\s*:\s*center/, "il blocco non è centrato (A41: Perfect sea views)");
    assert.match(blocco[0].corpo, /padding-top\s*:\s*calc\(var\(--dt-head-h\) \+ 1px \+ clamp\(/, "il lead non parte sotto la testata");
    assert.doesNotMatch(blocco[0].corpo, /position\s*:\s*absolute|(^|[^-])top\s*:/);
    assert.match(per(".dt-testa_centro")[0]?.corpo ?? "", /align-self\s*:\s*center/, "il titolo non sta al centro della riga 1fr");
    // La pagina sotto la foto sta in flusso, sull'avorio (D187: la tinta bassa è morta).
    const pagina = per(".dt-testa_pagina");
    assert.equal(pagina.length, 1);
    assert.match(pagina[0].corpo, /position\s*:\s*relative/);
    assert.match(pagina[0].corpo, /z-index\s*:\s*1/, "la pagina non sale sopra la foto sticky (A41)");
    assert.doesNotMatch(pagina[0].corpo, /position\s*:\s*(absolute|fixed|sticky)|transform|margin-top\s*:\s*calc\(-1/);
    assert.match(pagina[0].corpo, /background-color\s*:\s*var\(--color-cream\)/);
    // A41: la fascia coi punti è alta almeno 60svh (la «sezione dopo» che copre la foto); vuota, non occupa niente.
    const fascia = per(".dt-testa_pagina:not(:empty)");
    assert.equal(fascia.length, 1);
    assert.match(fascia[0].corpo, /min-height\s*:\s*60svh/);
    assert.doesNotMatch(css, /--dt-tinta-bassa/, "la tinta bassa è morta (D187)");
    // L'inquadratura per fascia (D180): --dt-op dalla media query.
    assert.ok(base.some((r) => /--dt-op\s*:\s*var\(--dt-op-sotto/.test(r.corpo)), "sotto lg --dt-op non legge --dt-op-sotto");
    const lg = per(".dt-testa").filter((r) => r.media.length === 1 && r.media[0] === MQ_LG);
    assert.ok(lg.some((r) => /--dt-op\s*:\s*var\(--dt-op-lg/.test(r.corpo)), "da lg --dt-op non legge --dt-op-lg");
    // Il tuck della calligrafia vale 0 solo sotto .dt-testa: la regola del corsivo resta −0,2em.
    assert.match(css, /\.script-word\s*\{[^}]*margin-top:\s*var\(--script-tuck, -0\.2em\)/);
    const tuck0 = regole(css).filter((r) => /--script-tuck\s*:\s*0\b/.test(r.corpo));
    assert.ok(tuck0.every((r) => TESTA.test(r.selettore)), `--script-tuck: 0 fuori dalla testa: ${tuck0.map((r) => r.selettore).join(", ")}`);
  });

  test("sotto lg la testata sticky prende la tinta alta da solida (D82); nessuna regola CSS nuova su header (D186)", () => {
    const tutte = regole(css);
    const d82 = tutte.filter((r) => r.selettore === "header[data-solid]");
    assert.equal(d82.length, 1, "una sola regola header[data-solid]");
    assert.deepEqual(d82[0].media, ["@media (max-width: 63.99rem)"], "D82 vale sotto lg e basta");
    assert.match(d82[0].corpo, /background-color\s*:\s*var\(--dt-tinta-alta, var\(--color-cream-deep\)\)/);
    const suHeader = tutte.filter((r) => /(^|[\s,>+~])header\b/.test(r.selettore) && !/^header\[data-solid\]$/.test(r.selettore));
    assert.deepEqual(
      suHeader.map((r) => r.selettore).filter((s) => /data-su-foto/.test(s)),
      [],
      "la testata sulla foto è fatta di classi nel markup, non di regole CSS (D186)",
    );
    const header = leggi("app/components/Header.tsx");
    assert.match(header, /data-solid=\{solid \|\| undefined\}/, "Header.tsx non porta data-solid");
    assert.match(header, /data-su-foto=\{suFoto \|\| undefined\}/, "Header.tsx non porta data-su-foto (D186)");
    assert.match(header, /const suFoto = pathname in tinte/, "suFoto non si legge da tinte.json");
    assert.match(header, /"border-line bg-cream-deep lg:!border-transparent lg:!bg-transparent"/, "le classi della barra solida sono cambiate");
    assert.doesNotMatch(header, /:has\(/, "nessun :has() globale");
    // Da lg la nav vive solo sulla foto (la testata scorre via): bianca con `suFoto` e basta; «Menu» sotto lg con `suFoto && !solid`.
    assert.match(header, /suFoto \? "text-white" : "text-ink"/, "le voci della nav non sono bianche sulla foto");
    assert.match(header, /suFoto && !solid \? "text-white" : "text-ink"/, "«Menu» non è bianco sopra la foto a scroll 0");
    assert.match(header, /<LanguageSwitcher light=\{suFoto\} \/>/, "il selettore lingua della nav non prende la variante light sulla foto");
    const lingua = leggi("app/components/i18n/LanguageSwitcher.tsx");
    assert.match(lingua, /light \? "border-white\/60 text-white hover:border-white"/, "la variante light non è bianco nudo (D186, A40)");
  });
});

describe("il bianco nudo (A40 di Alberto): nessuna ombra sulle scritte dentro le foto delle teste, nessun reset (D184)", () => {
  /** Tutte le sorgenti di `app/`, fuori dai `__tests__`. */
  const sorgenti = () =>
    readdirSync(join(ROOT, "app"), { recursive: true, withFileTypes: true })
      .filter((d) => d.isFile() && /\.(ts|tsx|css)$/.test(d.name))
      .map((d) => join(d.parentPath, d.name).slice(ROOT.length + 1).split(sep).join("/"))
      .filter((p) => !p.includes("/__tests__/"));

  test("nessun `text-shadow: none` e nessun `textShadow: \"none\"` in app/: niente da azzerare, perché niente si aggiunge (D184)", () => {
    for (const p of sorgenti()) {
      const t = soloCodice(leggi(p));
      assert.doesNotMatch(t, /text-shadow\s*:\s*none|textShadow\s*:\s*["']none["']/, `${p}: un reset dell'ombra (D184)`);
    }
  });

  test("l'alone è morto (A40): nessun .dt-alone, nessun --dt-alone-testa, nessuna ALONE_TESTA, nessuna copia data-alone-copia in app/", () => {
    for (const p of sorgenti()) {
      const t = soloCodice(leggi(p));
      assert.doesNotMatch(t, /dt-alone\b|--dt-alone-testa|ALONE_TESTA|data-alone-copia|\bstatico\b\s*[?:=]|senzaBianco/, `${p}: un residuo dell'alone (A40)`);
    }
    // La testa e la testata non portano nessuna ombra: né l'alone né l'ombra di D80 (che resta per le foto scure).
    for (const p of ["app/components/PageHero.tsx", "app/components/motion/PageHeroTesta.tsx", "app/components/Header.tsx", "app/components/i18n/LanguageSwitcher.tsx"]) {
      assert.doesNotMatch(soloCodice(leggi(p)), /dt-ink-media|INK_ON_MEDIA|textShadow|text-shadow/, `${p}: un'ombra sulle scritte della testa (A40)`);
    }
  });
});

describe("PageHero e PageHeroTesta senza JS e senza gesto", () => {
  const hero = soloCodice(leggi("app/components/PageHero.tsx"));
  const testa = soloCodice(leggi("app/components/motion/PageHeroTesta.tsx"));

  test("PageHero resta server, monta la sola testa e legge da tinte.json trattamento, foto, inquadrature e margine", () => {
    assert.doesNotMatch(hero, /["']use client["']/);
    assert.doesNotMatch(hero, /\buse[A-Z]\w*\(/, "nessun hook");
    assert.doesNotMatch(hero, /\bParallax\b|\bTextLines\b/);
    assert.doesNotMatch(hero, /PageHeroDive|PageHeroBand|PageHeroSoglia|PageHeroIngresso|PageHeroTerreno|data-dive-(content|band|text)/, "resta un pezzo del repertorio R (D175, D196)");
    assert.match(hero, /<PageHeroTesta\b/);
    assert.equal((hero.match(/<PageHeroTesta\b/g) ?? []).length, 1, "un ramo solo: la testa (D175)");
    assert.equal((hero.match(/<RevealGroup\b/g) ?? []).length, 2, "esattamente due RevealGroup: il blocco e il piede dei comandi (D50)");
    // I testi marcati: occhiello, H1, calligrafia, lead, riga dei comandi (i salvati di §9 del brief R).
    assert.ok((hero.match(/<Reveal\b/g) ?? []).length >= 2);
    assert.match(hero, /<SplitTitle as="h1" className=\{TITLE\}>/, "l'H1 non è il SplitTitle di sempre, nudo (A40)");
    assert.match(hero, /<ScriptWord className="!text-white/, "la calligrafia non è bianca e nuda (A40)");
    assert.match(hero, /<Lead className="mx-auto max-w-\[40rem\] !text-white text-center">/, "il lead non è bianco, nudo e centrato in alto (A41)");
    assert.match(hero, /className="eyebrow eyebrow--center !text-white"/, "l'occhiello non è bianco, nudo e centrato senza trattino (A41)");
    assert.match(hero, /className="dt-testa_capo w-full"/, "manca il capo (il lead in alto)");
    assert.match(hero, /className="dt-testa_centro w-full text-center text-white"/, "manca il centro (occhiello, H1, calligrafia)");
    assert.match(hero, /className="dt-testa_piede w-full text-white"/, "manca il piede (i comandi)");
    assert.ok(hero.indexOf("{capo}") < hero.indexOf("{centro}") && hero.indexOf("{centro}") < hero.indexOf("{piede}"), "l'ordine dei tre livelli non è capo, centro, piede");
    assert.match(hero, /variant="ghost-dark"[^>]*className="dt-btn--ghost-testa"|className="dt-btn--ghost-testa"[^>]*variant="ghost-dark"/, "il fantasma non è ghost-dark ghost-testa (D174)");
    assert.match(hero, /variant="cta-solid" size="lg"/, "il bottone pieno non è com'è");
    assert.doesNotMatch(/<Cta[^>]*variant="cta-solid"[^>]*>/.exec(hero)?.[0] ?? "", /dt-ink-media|text-shadow/, "il bottone pieno non porta ombre (D184)");
    assert.match(hero, /flex-col items-center gap-y-4/, "il fantasma non è impilato sotto il bottone, centrato (D174, A41)");
    // Lo <style> nell'HTML iniziale: tinta alta, le due inquadrature, la frazione del margine.
    assert.equal((hero.match(/<style>/g) ?? []).length, 1);
    assert.match(hero, /--dt-tinta-alta:/);
    assert.match(hero, /--dt-op-lg:/);
    assert.match(hero, /--dt-op-sotto:/);
    assert.doesNotMatch(hero, /--dt-testa-mf|tinta\.m\b/, "il margine della parallasse è morto (A41)");
    assert.ok(hero.indexOf("{stile}") < hero.indexOf("<PageHeroTesta"), "lo <style> non precede la section");
    // `tinta.objectPosition.lg` (la lettura dal JSON per lo <style>) è viva; la PROP no.
    assert.doesNotMatch(hero, /(?<!\.)objectPosition|srcWidth|\bsigla\b|scriptInset/, "le prop morte (D180, D196)");
    // Il tuck della calligrafia sta nel CSS (`.dt-testa`), non nel markup.
    assert.doesNotMatch(hero, /script-tuck/);
  });

  test("PageHeroTesta è statico (A41): nessun hook, nessun GSAP, nessun tween; la foto sticky sta nel CSS", () => {
    assert.doesNotMatch(testa, /["']use client["']/, "PageHeroTesta non ha bisogno del client");
    assert.doesNotMatch(testa, /\buse[A-Z]\w*\(|gsap|useGSAP|ScrollTrigger|matchMedia|fromTo|yPercent|willChange/, "un residuo del tween (A41)");
    assert.doesNotMatch(testa, /\bpin\s*:|pinSpacing|anticipatePin|position:\s*["']sticky/, "nessun pin, nessuno sticky scritto da JS (sta nel CSS)");
    assert.doesNotMatch(testa, /\bParallax\b|ScrollTrigger\.refresh\(\)/);
    assert.doesNotMatch(testa, /\.style\.|gsap\.set\(/, "nessuno stile scritto da JS");
    assert.doesNotMatch(testa, /data-corridor|data-on|data-stick/, "la testa non è un corridoio");
    assert.match(testa, /className="dt-testa_riquadro"/);
    assert.match(testa, /sizes=\{sizesDi\(/, "sizes non viene dal rapporto della sorgente (D183)");
    assert.match(testa, /quality=\{60\}/);
    assert.match(testa, /\bpreload\b/, "la foto della testa è l'LCP");
    assert.match(testa, /objectPosition:\s*"var\(--dt-op\)"/, "l'inquadratura non è --dt-op (D180)");
    assert.match(testa, /<div[^>]*\bdata-dive-zoom\b[^>]*\bdata-bg="foto"/, "data-bg sta sul riquadro");
    assert.doesNotMatch(testa, /data-testa-strato[^>]*data-bg/, "data-bg non sta sullo strato");
    // Il blocco e la pagina stanno FUORI dal riquadro sticky, dopo di lui: sono loro a scorrergli sopra.
    assert.ok(testa.indexOf("{blocco}") > testa.indexOf('className="dt-testa_riquadro"'), "il blocco non segue il riquadro");
    assert.ok(testa.indexOf('className="dt-testa_pagina"') > testa.indexOf("{blocco}"), "la pagina non segue il blocco");
  });

  test("SplitTitle, ScriptWord e SplitChars sono quelli di sempre: nessuna copia, nessun `alone`, nessun `statico` (A40)", () => {
    for (const f of ["SplitTitle", "ScriptWord", "SplitChars"]) {
      const c = soloCodice(leggi(`app/components/motion/${f}.tsx`));
      assert.doesNotMatch(c, /\balone\b|data-alone-copia|\bstatico\b|senzaBianco|dt-alone/, `${f}: un residuo della copia dell'alone (A40)`);
    }
  });
});
