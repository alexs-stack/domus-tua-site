// LA TESTA DI ERA A RIPOSO: LO STATO DEL CSS È L'UNICO STATO (D77 di A28; D176, D184, D190 del brief T; A40, A41, A45 e A46 di Alberto).
//
// Chi l'ha chiesto: A38 di Alberto (20 settembre 2026): la fotografia a schermo intero diventa
// lo sfondo e le scritte stanno dentro. A46 di Alberto (21 settembre 2026, sera): «su eraresidence
// questa foto che usa come background alta ha il cielo mascherato, è no bg: ecco perché sembra un
// tutt'uno il cielo con il colore dello sfondo del sito. Dobbiamo fare la stessa cosa nel nostro
// sito, dove ci sono le immagini così alte». Da qui il cielo delle foto alte è TRASPARENTE
// (`<nome>-cielo.webp`, scripts/media/cielo.mjs) e la villa posa sulla carta: le scritte che
// stavano «nel cielo» tornano nell'inchiostro della rivista (occhiello rosso, h1 inchiostro, lead
// grafite, corsivo rosso, bottone rosso pieno, link fantasma inchiostro) e stanno SOPRA il
// soggetto, mai sopra la foto. Il bianco nudo di A40 valeva per il cielo fotografato, che non c'è
// più. D190: senza JS e con moto ridotto lo stato del CSS è lo stato a riposo. Vincoli globali:
// senza JS e con reduced-motion nessun `data-hero-intro`, nessun corridoio, nessun testo nascosto
// in CSS.
//
// Com'è fatto oggi, e che cosa si legge qui (sorgenti e CSS, senza DOM; il DOM lo prova
// e2e/a28.spec.ts, «senza JS e con moto ridotto»):
// - il riquadro (`.dt-testa_riquadro`) è la carta: in flusso, `position: relative`, fondo
//   `--color-cream`, `overflow: clip`, alto quanto il blocco più la foto meno il cielo; dentro, in
//   ordine, il blocco dei testi (`.dt-testa_blocco`, in flusso, sopra nello stacking) e lo strato
//   della foto (`.dt-testa_strato`, IN FLUSSO, alto quanto la foto resa: `aspect-ratio` dal
//   sorgente) portato SU fino alla CIMA del soggetto (`margin-top: calc(-100% * var(--dt-cielo-h))`,
//   `cielo.cima` di tinte.json in frazione della larghezza: la prima riga con almeno il 5 % di
//   pixel opachi, sopra c'è solo carta); così il soggetto comincia esattamente al fondo del blocco
//   e nessuna lettera gli sta sopra. Non la `linea`: su /vendi sta a 0,488 mentre i cipressi
//   cominciano a 0,219, e con la linea l'H1 posava sui cipressi (misurato il 21 set.). Fuori
//   flusso sta solo il marcatore del soggetto (`.dt-testa_soggetto`, assoluto nello strato dalla
//   cima in giù, `data-bg="foto"` per il segno) e la scatola di `<Image fill>`; nessuna regola
//   sotto un gate: lo stato è uno;
// - il blocco è alto quanto il contenuto e da lg almeno 100svh (`min-height: var(--dt-testa-h)`
//   sotto `@media (min-width: 64rem)`); nessun aspect-ratio (con un min-height esplicito perderebbe
//   il minimo del contenuto: su /servizi a 1440 il fantasma usciva); sotto lg la foto segue i
//   comandi. Cresce col testo (D177);
// - nessuno `display: none`, nessuna `opacity` e nessun `clip-path` su un testo nel CSS della
//   testa: il solo stato dipinto resta `--dt-painted` (spec §2.5);
// - la section porta il `margin-top` negativo su ogni fascia: la carta è il pixel 0 (D176);
// - il CSS della testa non scrive `color` (i colori sono le classi di sempre nel markup: `.eyebrow`,
//   `.lead`, `.script-word`, `text-ink`) e non scrive mai `text-shadow`; nessun `text-shadow: none`
//   in `app/` (D184);
// - PageHero e PageHeroTesta sono server: nessun tween, nessun hook; `--script-tuck: 0` solo sotto
//   `.dt-testa` (D185);
// - la testata è quella del resto del sito (A46): nessun `data-su-foto`, nessuna voce bianca,
//   nessuna regola CSS su `header` (D82 è morta: la barra sticky sotto lg è cream-deep ovunque).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
/** Prima le righe `//`, poi i blocchi: Header.tsx scrive «/case/*» in un commento di riga, che al primo passaggio aprirebbe un blocco. */
const soloCodiceRighePrima = (t: string) => t.replace(/(^|[^:])\/\/[^\n]*/g, "$1").replace(/\/\*[\s\S]*?\*\//g, " ");
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
/** Lo strato della FOTO: in flusso (A46), alto quanto la foto resa, portato su di quanto vale il cielo. */
const STRATO_FOTO = ".dt-testa_strato";
/** Il marcatore del soggetto: assoluto nello strato, dalla cima del soggetto in giù (`data-bg="foto"` per il segno, D34). */
const SOGGETTO = ".dt-testa_soggetto";
/** La carta: il riquadro in flusso, fondo avorio, che contiene blocco e strato (A46). */
const RIQUADRO = ".dt-testa_riquadro";
const BLOCCO = ".dt-testa_blocco";

describe("D190: lo stato del CSS è lo stato a riposo, e fuori dal gesto la testa è ferma", () => {
  const css = cssPulito();
  const dellaTesta = regole(css).filter((r) => r.selettore.split(",").some((s) => TESTA.test(s.trim())));
  const per = (sel: string) => dellaTesta.filter((r) => r.selettore === sel);

  test("il CSS della testa esiste", () => {
    assert.ok(dellaTesta.length >= 6, `attese almeno sei regole .dt-testa*: ${dellaTesta.length}`);
  });

  // A45 (21 set. 2026): la foto è la pagina — il riquadro è in flusso (relative), il blocco dei testi
  // in flusso dentro di lui. A46: anche lo strato della foto è in flusso; fuori flusso sta solo il
  // marcatore del soggetto (assoluto nello strato).
  test("fuori flusso sta solo il marcatore del soggetto (assoluto nello strato, A46); nessuno sticky, nessun gate, nessun fixed", () => {
    const fuori: string[] = [];
    for (const r of dellaTesta) {
      if (!/position\s*:\s*(absolute|fixed|sticky)/.test(r.corpo)) continue;
      const selettori = r.selettore.split(",").map((s) => s.trim());
      if (selettori.every((s) => s === SOGGETTO) && /position\s*:\s*absolute/.test(r.corpo)) continue;
      fuori.push(r.selettore);
    }
    assert.deepEqual(fuori, []);
    for (const r of dellaTesta) assert.doesNotMatch(r.corpo, /position\s*:\s*sticky/, `${r.selettore}: sticky nella testa (A45: la foto scorre con la pagina)`);
    assert.ok(!dellaTesta.some((r) => r.selettore.startsWith(":root[data-hero-intro]")), "la testa non ha più regole sotto il gate: lo stato è uno solo (A41)");
    for (const r of dellaTesta) assert.doesNotMatch(r.corpo, /position\s*:\s*fixed/, `${r.selettore}: fixed nella testa`);
  });

  test("nessun testo nascosto nel CSS della testa: niente display none, opacity o clip-path fuori dal gate; niente color, niente text-shadow (D184)", () => {
    const colpe: string[] = [];
    for (const r of dellaTesta) {
      const gate = r.media.includes(MQ_CORRIDOIO) && r.selettore.startsWith(":root[data-hero-intro]");
      if (gate) continue;
      if (/display\s*:\s*none|opacity\s*:|clip-path\s*:|visibility\s*:\s*hidden/.test(r.corpo)) colpe.push(r.selettore);
    }
    assert.deepEqual(colpe, []);
    for (const r of dellaTesta) {
      assert.doesNotMatch(r.corpo, /(^|[^-])color\s*:/, `${r.selettore}: il CSS della testa scrive color (i colori sono le classi nel markup, D184)`);
      assert.doesNotMatch(r.corpo, /text-shadow/, `${r.selettore}: text-shadow nella testa (niente ombre sull'avorio)`);
      assert.doesNotMatch(r.corpo, /box-shadow/, `${r.selettore}: box-shadow (DESIGN.md:417)`);
    }
    // Il trattino dell'occhiello resta decorativo: nessuna regola `.dt-testa .eyebrow::before`.
    assert.ok(!dellaTesta.some((r) => /eyebrow::before/.test(r.selettore)), "il trattino resta decorativo (esente da 1.4.11)");
  });

  test("la scatola (D176, A45, A46): section sotto la testata; riquadro = la carta, in flusso, avorio, con clip; blocco in flusso in cima, alto quanto il contenuto e da lg almeno 100svh; strato in flusso portato su fino alla cima del soggetto; marcatore del soggetto", () => {
    const base = per(".dt-testa").filter((r) => r.media.length === 0);
    assert.ok(base.length >= 1, ".dt-testa senza regola base");
    assert.ok(base.some((r) => /margin-top\s*:\s*calc\(-1 \* \(var\(--dt-head-h\) \+ 1px\)\)/.test(r.corpo)), "la section non sale sotto la testata fuori da ogni media query (D176)");
    assert.ok(base.some((r) => /--dt-testa-h\s*:\s*100svh/.test(r.corpo)), "la scatola non è 100svh");
    assert.ok(base.some((r) => /--script-tuck\s*:\s*0\b/.test(r.corpo)), "--script-tuck: 0 non sta sotto .dt-testa (D185)");
    assert.doesNotMatch(css, /--dt-testa-m\b|--dt-testa-mf/, "il margine della parallasse è morto (A41)");
    // Il riquadro (A46): la carta. In flusso, fondo `--color-cream` (col cielo trasparente il riquadro non
    // si vede: la villa posa sulla carta), NESSUNA altezza né aspect-ratio (è alto quanto blocco + strato,
    // il minimo automatico del contenuto: un'altezza esplicita ritaglierebbe il tedesco, D177), clip (mai
    // hidden: un contenitore di scroll perde quel minimo); una regola sola, su ogni fascia.
    const riquadro = per(RIQUADRO);
    assert.equal(riquadro.length, 1, "una sola regola del riquadro, senza media query (A45)");
    assert.deepEqual(riquadro[0].media, []);
    assert.match(riquadro[0].corpo, /position\s*:\s*relative/);
    assert.doesNotMatch(riquadro[0].corpo, /aspect-ratio/, "il rapporto della foto sta sullo strato, non sulla carta (A46)");
    assert.doesNotMatch(riquadro[0].corpo, /min-height|(^|[^-])height\s*:/, "un'altezza esplicita sul riquadro spegne il minimo automatico: il blocco lungo verrebbe ritagliato (D177)");
    assert.match(riquadro[0].corpo, /overflow\s*:\s*clip/, "il riquadro ritaglia con clip, mai hidden");
    assert.doesNotMatch(riquadro[0].corpo, /overflow\s*:\s*(hidden|auto|scroll)|clip-path|transform|position\s*:\s*sticky|(^|[^-])top\s*:/);
    assert.match(riquadro[0].corpo, /background-color\s*:\s*var\(--color-cream\)/, "il fondo del riquadro non è la carta (A46: il cielo è un tutt'uno con lo sfondo del sito)");
    assert.doesNotMatch(riquadro[0].corpo, /--dt-tinta-alta|cream-deep/, "la tinta del placeholder sta sullo strato, non sulla carta (A46)");
    // Lo strato (A46): IN FLUSSO dopo il blocco, largo tutto, alto quanto la foto resa (aspect-ratio dal
    // sorgente: --dt-testa-ar, scritto da PageHero), portato SU fino alla cima del soggetto
    // (`margin-top: calc(-100% * var(--dt-cielo-h))`: percentuale della LARGHEZZA, come vuole CSS 2.1 §8.3,
    // e --dt-cielo-h è `cielo.cima` × altezza / larghezza del sorgente — la cima, non la linea); il
    // placeholder prima del decode è la tinta alta (D125) qui e solo qui; nessuna trasformazione, nessun inset.
    const hero = leggi("app/components/PageHero.tsx");
    assert.match(hero, /--dt-testa-ar:\$\{tinta\.sorgente\[0\]\} \/ \$\{tinta\.sorgente\[1\]\}/, "PageHero non scrive il rapporto della foto");
    // 22 set. (C01/G02): `--dt-cielo` (la cima come quota del marcatore del segno) è morta: le bande stanno in tinte.json.
    assert.doesNotMatch(hero, /--dt-cielo:\$\{/, "PageHero scrive ancora --dt-cielo: il marcatore del segno legge le bande `segno`, non la cima");
    assert.match(hero, /--dt-cielo-h:\$\{cieloH\(tinta\.cielo\.cima, tinta\.sorgente\)\}/, "PageHero non scrive la cima del soggetto in frazione della larghezza (--dt-cielo-h, A46)");
    assert.doesNotMatch(soloCodice(hero), /cielo\.linea/, "la linea del cielo non è la cima del soggetto: con la linea l'H1 posa sui cipressi (A46, 21 set.)");
    const strato = per(STRATO_FOTO);
    assert.equal(strato.length, 1, "una sola regola dello strato, senza media query");
    assert.deepEqual(strato[0].media, []);
    assert.match(strato[0].corpo, /position\s*:\s*relative/, "lo strato non è in flusso (A46)");
    assert.match(strato[0].corpo, /width\s*:\s*100%/);
    assert.match(strato[0].corpo, /aspect-ratio\s*:\s*var\(--dt-testa-ar, 2 \/ 3\)/, "lo strato non è alto quanto la foto (A45/A46)");
    assert.match(strato[0].corpo, /margin-top\s*:\s*calc\(-100% \* var\(--dt-cielo-h, 0\)\)/, "lo strato non è portato su fino alla cima del soggetto (A46)");
    assert.match(strato[0].corpo, /background-color\s*:\s*var\(--dt-tinta-alta, var\(--color-cream\)\)/, "il placeholder prima del decode (D125) non sta sullo strato, o non ricade sull'avorio");
    assert.doesNotMatch(strato[0].corpo, /inset\s*:|transform|clip-path|height\s*:\s*calc|position\s*:\s*absolute/);
    // I marcatori del segno (22 set., C01/G02): assoluti nello strato, larghi tutto, senza puntatore; le quote
    // (top/bottom in percentuale dell'altezza dello strato) sono le bande `segno` di tinte.json, scritte nel markup.
    const soggetto = per(SOGGETTO);
    assert.equal(soggetto.length, 1);
    assert.match(soggetto[0].corpo, /position\s*:\s*absolute/);
    assert.doesNotMatch(soggetto[0].corpo, /--dt-cielo\b|(^|[^-])top\s*:/, "le quote dei marcatori stanno nel markup (le bande), non nel CSS");
    assert.match(soggetto[0].corpo, /left\s*:\s*0/);
    assert.match(soggetto[0].corpo, /inset\s*:\s*auto 0 0(\s|;)|right\s*:\s*0/);
    assert.match(soggetto[0].corpo, /pointer-events\s*:\s*none/);
    assert.doesNotMatch(soggetto[0].corpo, /background|transform|z-index/);
    // Il blocco (A46): in flusso DENTRO il riquadro, in cima, sopra lo strato (z 1), griglia a tre righe centrata,
    // alto quanto il contenuto (nulla si taglia, D177); da lg il pavimento di 100svh: due regole, la base e
    // quella sotto (min-width: 64rem). NESSUN aspect-ratio: con un min-height esplicito un box con aspect-ratio
    // perde il minimo del contenuto (su /servizi a 1440×900 il blocco restava a 900 px con 967 px di testo).
    const blocco = per(BLOCCO);
    assert.equal(blocco.length, 2, "due regole del blocco: la base e il pavimento di 100svh da lg (A46)");
    const [bloccoBase, bloccoLg] = blocco[0].media.length === 0 ? [blocco[0], blocco[1]] : [blocco[1], blocco[0]];
    assert.deepEqual(bloccoBase.media, []);
    assert.deepEqual(bloccoLg.media, [MQ_LG], "il pavimento di 100svh vale da lg");
    assert.match(bloccoLg.corpo, /min-height\s*:\s*var\(--dt-testa-h\)/, "da lg il blocco non è alto almeno 100svh");
    assert.doesNotMatch(bloccoBase.corpo, /min-height/, "sotto lg il blocco è alto quanto il contenuto: la foto segue i comandi (A46)");
    assert.doesNotMatch(bloccoBase.corpo, /aspect-ratio/, "un aspect-ratio sul blocco spegne il minimo del contenuto sotto un min-height (A46, /servizi a 1440)");
    assert.doesNotMatch(bloccoLg.corpo, /aspect-ratio/);
    assert.match(bloccoBase.corpo, /position\s*:\s*relative/);
    assert.doesNotMatch(bloccoBase.corpo, /position\s*:\s*absolute|inset\s*:|(^|[^-])top\s*:/, "il blocco assoluto non fa crescere il riquadro (D177)");
    assert.match(bloccoBase.corpo, /z-index\s*:\s*1/);
    assert.doesNotMatch(bloccoBase.corpo, /margin-top\s*:\s*calc\(-1/, "il margine negativo di A41 è morto (A45: il blocco sta dentro la carta)");
    assert.match(bloccoBase.corpo, /display\s*:\s*grid/);
    assert.match(bloccoBase.corpo, /grid-template-rows\s*:\s*auto 1fr auto/, "le tre righe: lead, titolo, comandi");
    assert.match(bloccoBase.corpo, /justify-items\s*:\s*center/);
    assert.match(bloccoBase.corpo, /text-align\s*:\s*center/, "il blocco non è centrato (A41: Perfect sea views)");
    assert.match(bloccoBase.corpo, /padding-top\s*:\s*calc\(var\(--dt-head-h\) \+ 1px \+ clamp\(/, "il lead non parte sotto la testata");
    assert.match(per(".dt-testa_centro")[0]?.corpo ?? "", /align-self\s*:\s*center/, "il titolo non sta al centro della riga 1fr");
    // 2.4.7: sull'avorio il bottone rosso pieno tiene l'anello del sito (rosso a offset 3): la regola
    // dell'anello bianco a offset 0, nata per il bottone dentro la foto, è morta con A46.
    assert.ok(!dellaTesta.some((r) => /focus-visible/.test(r.selettore)), "la testa non ha più regole di focus proprie: l'anello è quello del sito (A46)");
    assert.doesNotMatch(css, /\.dt-testa \.dt-btn--cta-solid:focus-visible/);
    // La pagina sotto la foto sta in flusso, sull'avorio (D187: la tinta bassa è morta).
    const pagina = per(".dt-testa_pagina");
    assert.equal(pagina.length, 1);
    assert.match(pagina[0].corpo, /position\s*:\s*relative/);
    assert.match(pagina[0].corpo, /z-index\s*:\s*1/);
    assert.doesNotMatch(pagina[0].corpo, /position\s*:\s*(absolute|fixed|sticky)|transform|margin-top\s*:\s*calc\(-1/);
    assert.match(pagina[0].corpo, /background-color\s*:\s*var\(--color-cream\)/);
    // A45: la fascia coi punti segue la foto in flusso, con un passo di capitolo; vuota, non occupa niente.
    const fascia = per(".dt-testa_pagina:not(:empty)");
    assert.equal(fascia.length, 1);
    assert.match(fascia[0].corpo, /min-height\s*:\s*clamp\(12rem, 30svh, 22rem\)/);
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

  test("la testata è quella del resto del sito (A46): nessuna regola CSS su header (D82 morta), nessun data-su-foto, voci in inchiostro, lingua nella variante di sempre", () => {
    const tutte = regole(css);
    // D82 (la barra sticky sotto lg tinta come la foto) è morta con A46: sotto la barra c'è la carta, poi la
    // foto; la barra solida è `bg-cream-deep` come su ogni altra rotta (la classe nel markup, D186).
    assert.deepEqual(tutte.filter((r) => r.selettore === "header[data-solid]").map((r) => r.selettore), [], "header[data-solid] ha ancora una regola: D82 è morta con A46");
    const suHeader = tutte.filter((r) => /(^|[\s,>+~])header\b/.test(r.selettore));
    assert.deepEqual(suHeader.map((r) => r.selettore), [], "nessuna regola CSS su header: la testata è fatta di classi nel markup (D186)");
    assert.doesNotMatch(css, /data-su-foto|--dt-tinta-alta, var\(--color-cream-deep\)/, "un residuo della testata sulla foto (A46)");
    const header = soloCodiceRighePrima(leggi("app/components/Header.tsx"));
    assert.match(header, /data-solid=\{solid \|\| undefined\}/, "Header.tsx non porta data-solid");
    assert.doesNotMatch(header, /data-su-foto|suFoto|tinte\.json|\btinte\b/, "Header.tsx legge ancora tinte.json o porta data-su-foto (A46: la testata non sta più sulla foto)");
    assert.doesNotMatch(header, /text-white|border-white/, "una voce bianca nella testata (A46)");
    assert.match(header, /"border-line bg-cream-deep lg:!border-transparent lg:!bg-transparent"/, "le classi della barra solida sono cambiate");
    assert.doesNotMatch(header, /:has\(/, "nessun :has() globale");
    // Le voci della nav e «Menu» in inchiostro, senza rami: la classe è una.
    assert.match(header, /className="whitespace-nowrap text-ui uppercase tracking-\[0\.1em\] text-ink decoration-1/, "le voci della nav non sono inchiostro e basta");
    assert.match(header, /text-ui font-semibold uppercase tracking-\[0\.1em\] text-ink underline-offset-\[0\.45em\]/, "«Menu» non è inchiostro e basta");
    assert.match(header, /<LanguageSwitcher \/>/, "il selettore lingua della nav non è quello di sempre");
    assert.doesNotMatch(header, /<LanguageSwitcher light/, "il selettore lingua porta ancora la variante light (A46)");
    assert.doesNotMatch(soloCodice(leggi("app/components/i18n/LanguageSwitcher.tsx")), /\blight\b|text-white|border-white/, "LanguageSwitcher porta ancora la prop `light` e il ramo bianco (morti con A46, tolti il 22 set.)");
  });
});

describe("nessuna ombra sulle scritte della testa e nessun reset (D184; A40 per il resto del sito, A46 per la testa sull'avorio)", () => {
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

  test("l'alone è morto (A40) e con A46 anche il bianco: nessun .dt-alone, nessuna ALONE_TESTA, nessun text-white nella testa e nella testata", () => {
    for (const p of sorgenti()) {
      const t = soloCodice(leggi(p));
      assert.doesNotMatch(t, /dt-alone\b|--dt-alone-testa|ALONE_TESTA|data-alone-copia|\bstatico\b\s*[?:=]|senzaBianco/, `${p}: un residuo dell'alone (A40)`);
    }
    // La testa e la testata non portano nessuna ombra: né l'alone né l'ombra di D80 (che resta per le foto scure);
    // e con A46 nessun bianco: le scritte stanno sull'avorio, nell'inchiostro della rivista.
    for (const p of ["app/components/PageHero.tsx", "app/components/motion/PageHeroTesta.tsx", "app/components/Header.tsx", "app/components/i18n/LanguageSwitcher.tsx"]) {
      assert.doesNotMatch(soloCodice(leggi(p)), /dt-ink-media|INK_ON_MEDIA|textShadow|text-shadow/, `${p}: un'ombra sulle scritte della testa (A40)`);
    }
    for (const p of ["app/components/PageHero.tsx", "app/components/motion/PageHeroTesta.tsx", "app/components/Header.tsx"]) {
      assert.doesNotMatch(soloCodiceRighePrima(leggi(p)), /text-white|ghost-dark|border-white|#fff\b/, `${p}: una scritta bianca (A46: le teste stanno sull'avorio)`);
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
    assert.match(hero, /<SplitTitle as="h1" className=\{TITLE\}>/, "l'H1 non è il SplitTitle di sempre");
    // A46: i colori della rivista, cioè le classi di sempre senza `!` e senza bianco: la calligrafia rossa
    // (`.script-word`), il lead grafite (`.lead`), l'occhiello rosso (`.eyebrow`), l'H1 inchiostro (`text-ink`).
    assert.match(hero, /<ScriptWord className="pl-\[18vw\] lg:pl-\[10vw\]/, "la calligrafia non è quella di sempre, rossa (A46)");
    assert.match(hero, /<Lead className="mx-auto max-w-\[40rem\] text-center">/, "il lead non è grafite e centrato in alto (A41, A46)");
    assert.match(hero, /className="eyebrow eyebrow--center"/, "l'occhiello non è rosso e centrato senza trattino (A41, A46)");
    assert.match(hero, /className="dt-testa_capo w-full"/, "manca il capo (il lead in alto)");
    assert.match(hero, /className="dt-testa_centro w-full text-center text-ink"/, "manca il centro in inchiostro (occhiello, H1, calligrafia)");
    assert.match(hero, /className="dt-testa_piede w-full"/, "manca il piede (i comandi)");
    assert.ok(hero.indexOf("{capo}") < hero.indexOf("{centro}") && hero.indexOf("{centro}") < hero.indexOf("{piede}"), "l'ordine dei tre livelli non è capo, centro, piede");
    assert.match(hero, /variant="ghost"[^>]*className="dt-btn--ghost-testa"|className="dt-btn--ghost-testa"[^>]*variant="ghost"/, "il fantasma non è il ghost inchiostro a 18 px (D174, A46)");
    // (`lg:!text-[clamp(…)]` sulla calligrafia è una taglia, non un colore: resta.)
    assert.doesNotMatch(hero, /!text-white|text-white|text-cream|ghost-dark/, "un residuo del bianco nudo (A46)");
    // La foto: il WebP col cielo trasparente dove c'è (`cielo.file`), altrimenti la sorgente del chiamante.
    assert.match(hero, /src=\{tinta\.cielo\.file \?\? image\}/, "PageHeroTesta non riceve il WebP col cielo (A46)");
    assert.match(hero, /variant="cta-solid" size="lg"/, "il bottone pieno non è com'è");
    assert.doesNotMatch(/<Cta[^>]*variant="cta-solid"[^>]*>/.exec(hero)?.[0] ?? "", /dt-ink-media|text-shadow/, "il bottone pieno non porta ombre (D184)");
    assert.match(hero, /flex-col items-center gap-y-4/, "il fantasma non è impilato sotto il bottone, centrato (D174, A41)");
    // Lo <style> nell'HTML iniziale: tinta alta, le due inquadrature, il rapporto della foto, la linea del cielo.
    assert.equal((hero.match(/<style>/g) ?? []).length, 1);
    assert.match(hero, /--dt-tinta-alta:/);
    assert.match(hero, /--dt-op-lg:/);
    assert.match(hero, /--dt-op-sotto:/);
    assert.doesNotMatch(hero, /--dt-cielo:/, "lo <style> scrive ancora --dt-cielo (morta il 22 set.)");
    assert.match(hero, /--dt-cielo-h:/, "lo <style> non scrive --dt-cielo-h (A46)");
    assert.match(hero, /import \{ cieloH \} from "\.\.\/lib\/motion\/testa"/, "la frazione del cielo si calcola nel modulo puro dei numeri (testa.ts)");
    assert.doesNotMatch(hero, /--dt-testa-mf|tinta\.m\b/, "il margine della parallasse è morto (A41)");
    assert.ok(hero.indexOf("{stile}") < hero.indexOf("<PageHeroTesta"), "lo <style> non precede la section");
    // `tinta.objectPosition.lg` (la lettura dal JSON per lo <style>) è viva; la PROP no.
    assert.doesNotMatch(hero, /(?<!\.)objectPosition|srcWidth|\bsigla\b|scriptInset/, "le prop morte (D180, D196)");
    // Il tuck della calligrafia sta nel CSS (`.dt-testa`), non nel markup.
    assert.doesNotMatch(hero, /script-tuck/);
  });

  // A45 (21 set. 2026): la testa è tornata statica — la foto alta è la pagina (in flusso), nessun
  // hook, nessun GSAP, nessun pan (usePanTesta è morto): senza JS e con reduced-motion la pagina è questa.
  test("PageHeroTesta è statico (A45): nessun hook, nessun GSAP, nessun tween; la foto scorre con la pagina", () => {
    assert.doesNotMatch(testa, /["']use client["']/, "PageHeroTesta non ha bisogno del client");
    assert.doesNotMatch(testa, /\buse[A-Z]\w*(?=\s*(?:<[^>]*>)?\()|gsap|useGSAP|ScrollTrigger|matchMedia|fromTo|yPercent|willChange|usePanTesta/, "un residuo di movimento (A45)");
    assert.doesNotMatch(testa, /\bpin\s*:|pinSpacing|anticipatePin|position:\s*["']sticky/, "nessun pin, nessuno sticky scritto da JS");
    assert.doesNotMatch(testa, /\bParallax\b|ScrollTrigger\.refresh\(\)/);
    assert.doesNotMatch(testa, /\.style\.|gsap\.set\(/, "nessuno stile scritto da JS");
    assert.doesNotMatch(testa, /data-corridor|data-on|data-stick/, "la testa non è un corridoio");
    assert.ok(!existsSync(join(ROOT, "app/components/motion/usePanTesta.ts")), "usePanTesta.ts esiste ancora");
    // A46: dentro il riquadro (la carta) prima il blocco dei testi, poi lo strato della foto (l'ordine di
    // lettura: l'H1 prima dell'immagine), poi la pagina.
    const riq = testa.indexOf('className="dt-testa_riquadro"');
    const blocco = testa.indexOf("{blocco}", riq);
    const strato = testa.indexOf('className="dt-testa_strato"', blocco);
    const chiusa = testa.indexOf('className="dt-testa_pagina"', strato);
    assert.ok(riq > -1 && blocco > riq && strato > blocco && chiusa > strato, "l'ordine non è riquadro, blocco, strato, pagina (A46)");
    assert.match(testa, /className="dt-testa_riquadro"/);
    // Il marcatore del soggetto: dentro lo strato, dopo l'immagine, con data-bg="foto" per il segno (D34).
    const marcatore = /<span[^>]*\bdata-testa-soggetto\b[^>]*>/.exec(testa)?.[0] ?? "";
    assert.ok(marcatore, "manca il marcatore del soggetto (A46)");
    assert.match(marcatore, /\bdata-bg="foto"/);
    assert.match(marcatore, /\baria-hidden\b/);
    assert.match(marcatore, /className="dt-testa_soggetto"/);
    assert.ok(testa.indexOf("data-testa-soggetto") > strato && testa.indexOf("data-testa-soggetto") < chiusa, "il marcatore non sta nello strato");
    assert.match(testa, /sizes=\{SIZES_TESTA\}/, "sizes non è il 100vw dello strato in flusso (A45; revisione del 22 set., C02/P01/G03)");
    assert.match(testa, /segno\.map\(/, "i marcatori del segno non vengono dalle bande di tinte.json (22 set.)");
    assert.match(testa, /quality=\{60\}/);
    assert.match(testa, /\bpreload\b/, "la foto della testa è l'LCP");
    assert.match(testa, /objectPosition:\s*"var\(--dt-op\)"/, "l'inquadratura non è --dt-op (D180)");
    // Il riquadro è la carta: nessun data-bg (il segno vi resta grafite); la zona foto è il marcatore.
    assert.doesNotMatch(/<div[^>]*\bdata-dive-zoom\b[^>]*>/.exec(testa)?.[0] ?? "", /data-bg/, "data-bg sul riquadro: il segno sarebbe avorio sull'avorio del cielo (A46)");
    assert.doesNotMatch(testa, /data-testa-strato[^>]*data-bg/, "data-bg non sta sullo strato");
    assert.ok(testa.indexOf('className="dt-testa_pagina"') > testa.indexOf("{blocco}"), "la pagina non segue il blocco");
  });

  test("SplitTitle, ScriptWord e SplitChars sono quelli di sempre: nessuna copia, nessun `alone`, nessun `statico` (A40)", () => {
    for (const f of ["SplitTitle", "ScriptWord", "SplitChars"]) {
      const c = soloCodice(leggi(`app/components/motion/${f}.tsx`));
      assert.doesNotMatch(c, /\balone\b|data-alone-copia|\bstatico\b|senzaBianco|dt-alone/, `${f}: un residuo della copia dell'alone (A40)`);
    }
  });
});
