// I NASTRI, LA ROTAIA E LO STAGE DELLE STELLE PRIMA DEL PAINT (23 set. 2026).
//
// Il difetto: ricaricando la home a 1440×900 appena sotto #voci, il ripristino nativo dello scroll
// arrivava sul layout del primo paint e all'idratazione una voce layout-shift da 1,0 portava via lo
// schermo. I tre nastri (HorizonScroller: storia, la finestra di Open Domus, Costi chiari) e la
// rotaia del team (HorizontalRail con `runway`) mettevano [data-on] e l'altezza SOLO da JS: fino ad
// allora erano colonne alte un'altra cosa (storia 1264 → 2995 px, finestra 6170 → 5501, costi
// 4002 → 5103, rotaia 819 → 1513). La cura sta in globals.css, blocco «I nastri e la rotaia prima
// del paint»: sotto `:root[data-hero-intro]` e la media query dei corridoi, finché l'host non ha
// [data-on], le regole gemelle di quelle [data-on] e le altezze che `size()` scriverà.
//
// Il test pretende che il gemello e l'originale restino la stessa cosa (una regola [data-on]
// cambiata da sola rifarebbe il salto), che le regole della colonna non scattino sul nastro armato
// e che le costanti delle altezze siano quelle dei dati e del CSS del titolo. La geometria vera la
// misura corridors.spec.ts («prima dell'idratazione»). I sorgenti si rileggono coi commenti tolti,
// come corridor-contract.test.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { FINESTRA } from "../motion/finestra";
import { COSTI } from "../motion/costi";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
const cssPulito = () => leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
const MQ_CORRIDOIO = "@media (min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";
const GATE = ":root[data-hero-intro]";

type Regola = { selettore: string; dichiarazioni: string[] };

/** Le regole di un testo CSS senza annidamenti (il corpo di un blocco @media o il file coi blocchi tolti). */
function regole(css: string): Regola[] {
  return [...css.matchAll(/([^{};]+)\{([^{}]*)\}/g)].map((m) => ({
    selettore: m[1].trim().replace(/\s+/g, " "),
    dichiarazioni: m[2]
      .split(";")
      .map((d) => d.trim().replace(/\s*:\s*/, ": ").replace(/\s+/g, " "))
      .filter(Boolean),
  }));
}

/** Il file con i blocchi @media (e ogni altra at-rule a blocco) tolti: restano le regole di primo livello. */
function primoLivello(css: string): string {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf("@", i);
    if (at === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, at);
    const open = css.indexOf("{", at);
    const semi = css.indexOf(";", at);
    if (open === -1 || (semi !== -1 && semi < open)) {
      i = semi === -1 ? css.length : semi + 1;
      continue;
    }
    let depth = 0;
    let j = open;
    for (; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}" && --depth === 0) break;
    }
    i = j + 1;
  }
  return out;
}

/** I corpi di tutti i blocchi @media dei corridoi (lo schema di corridor-contract.test.ts). */
function blocchiCorridoio(css: string): string[] {
  const out: string[] = [];
  let from = 0;
  for (let at = css.indexOf(MQ_CORRIDOIO, from); at !== -1; at = css.indexOf(MQ_CORRIDOIO, from)) {
    const open = css.indexOf("{", at);
    let depth = 0;
    let end = css.length;
    for (let i = open; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) {
        end = i;
        break;
      }
    }
    out.push(css.slice(open + 1, end));
    from = end + 1;
  }
  return out;
}

const css = cssPulito();
const primo = regole(primoLivello(css));
const armate = blocchiCorridoio(css).flatMap(regole);
const armata = (selettore: string) => armate.find((r) => r.selettore === selettore) ?? null;

describe("i nastri prima del paint: gemelli delle regole [data-on]", () => {
  // `.dt-horizon[data-on] X` → `:root[data-hero-intro] .dt-horizon:not([data-on]) X` (idem .dt-od e .dt-cc).
  const originali = primo.filter((r) => /^\.dt-(horizon|od|cc)\[data-on\]/.test(r.selettore));
  const gemello = (sel: string) => `${GATE} ${sel.replace(/^(\.dt-(?:horizon|od|cc))\[data-on\]/, "$1:not([data-on])")}`;

  test("le regole [data-on] dei tre nastri ci sono tutte", () => {
    // Sezione, schermo, track, pannello, territorio, gradini, testo; cinque della finestra; tre dei costi.
    assert.equal(originali.length, 15, originali.map((r) => r.selettore).join("\n"));
  });

  test("ognuna ha il gemello armato con le stesse dichiarazioni (lo schermo ritaglia con clip)", () => {
    for (const r of originali) {
      const g = armata(gemello(r.selettore));
      assert.ok(g, `manca il gemello di ${r.selettore} nel blocco dei corridoi`);
      // `hidden` farebbe dello schermo un contenitore di scroll (corridor-contract.test.ts): prima del
      // paint è `clip`, e senza scroll la geometria è la stessa.
      const attese = r.dichiarazioni.map((d) => d.replace(/^overflow: hidden$/, "overflow: clip"));
      const extra = g.dichiarazioni.filter((d) => !attese.includes(d));
      assert.deepEqual(
        attese.filter((d) => !g.dichiarazioni.includes(d)),
        [],
        `${r.selettore}: il gemello non ha le stesse dichiarazioni`,
      );
      // L'unica dichiarazione in più: la sezione spegne la rete di 2rem della colonna.
      assert.deepEqual(
        extra.filter((d) => !(r.selettore === ".dt-horizon[data-on]" && d === "overflow-clip-margin: 0px")),
        [],
        `${r.selettore}: il gemello scrive qualcosa che [data-on] non scrive`,
      );
    }
  });

  test("le regole della colonna non scattano sul nastro armato: il gemello riscrive ogni loro proprietà", () => {
    // `.dt-cc:not([data-on]) .dt-cc_cornice` c'è due volte, la seconda da 64rem: stessa proprietà, basta il primo livello.
    const colonna = primo.filter((r) => /^\.dt-(horizon|od|cc):not\(\[data-on\]\)/.test(r.selettore));
    assert.ok(colonna.length >= 3, "le regole della colonna non si trovano più");
    for (const r of colonna) {
      const g = armata(`${GATE} ${r.selettore}`);
      assert.ok(g, `${r.selettore}: manca la regola armata che la sovrascrive`);
      const scritte = g.dichiarazioni.map((d) => d.split(":")[0]);
      for (const d of r.dichiarazioni) {
        const prop = d.split(":")[0];
        // `overflow` copre `overflow-x`.
        assert.ok(
          scritte.some((p) => p === prop || prop.startsWith(`${p}-`)),
          `${r.selettore}: ${prop} della colonna resterebbe acceso sul nastro armato`,
        );
      }
    }
  });

  test("nessuna utility di sola colonna scritta con `.dt-horizon:not([data-on])`: la variante è nastro-colonna", () => {
    const dir = join(ROOT, "app", "components");
    const tsx = readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".tsx"));
    const colpe = tsx.filter((f) => leggi(join("app", "components", f)).includes("[.dt-horizon:not([data-on])_&]"));
    assert.deepEqual(colpe, []);
    const usi = tsx.filter((f) => /nastro-colonna:lg:/.test(leggi(join("app", "components", f))));
    assert.ok(usi.length >= 5, `nastro-colonna usata in ${usi.length} file`);
    // Le due vie del non-armato: nessun attributo del boot script, o la media query dei corridoi che non vale.
    const variante = /@custom-variant nastro-colonna\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
    assert.match(variante, /:root:not\(\[data-hero-intro\]\) \.dt-horizon:not\(\[data-on\]\) &\s*\{\s*@slot;/);
    assert.ok(
      variante.includes(`@media not all and ${MQ_CORRIDOIO.slice("@media ".length)}`),
      "la seconda via deve negare la media query dei corridoi, parola per parola",
    );
  });
});

describe("le altezze prima del paint sono quelle di size()", () => {
  const altezza = (sel: string) => armata(sel)?.dichiarazioni.find((d) => d.startsWith("height: ")) ?? null;
  const prop = (r: Regola | null, nome: string) => r?.dichiarazioni.find((d) => d.startsWith(`${nome}: `))?.slice(nome.length + 2) ?? null;

  test("storia: la larghezza del track, 100vw + 108vw (manifesto e territorio)", () => {
    assert.equal(altezza(`${GATE} .dt-horizon[data-corridor="storia"]:not([data-on])`), "height: calc(100vw + 108vw)");
    const pannello = primo.find((r) => r.selettore === ".dt-horizon[data-on] .dt-horizon_panel");
    const territorio = primo.find((r) => r.selettore === ".dt-horizon[data-on] .dt-horizon_panel--territory");
    assert.equal(prop(pannello ?? null, "width"), "100vw");
    assert.equal(prop(territorio ?? null, "width"), "108vw");
    const storia = leggi("app/components/HorizonStory.tsx");
    assert.equal((storia.match(/className="dt-horizon_panel /g) ?? []).length, 2, "i pannelli di storia sono due");
    assert.equal((storia.match(/dt-horizon_panel--territory/g) ?? []).length, 1);
  });

  test("la finestra: le costanti sono quelle di finestra.json, coda.json, FINESTRA e del titolo", () => {
    const foto = JSON.parse(leggi("app/lib/motion/finestra.json")) as { cielo: { cima: number } };
    const coda = JSON.parse(leggi("app/lib/motion/coda.json")) as { cielo: { cima: number }; sorgente: number[] };
    const r = armata(`${GATE} .dt-od:not([data-on])`);
    assert.ok(r, "manca l'altezza della finestra");
    const titolo = primo.find((x) => x.selettore === ".dt-od_titolo");
    assert.equal(prop(r, "--dt-od-titolo-fs"), prop(titolo ?? null, "font-size"), "la misura del titolo non è quella di .dt-od_titolo");
    assert.equal(prop(titolo ?? null, "inset"), "0.05em 0 auto 0");
    assert.equal(prop(titolo ?? null, "line-height"), "0.85");
    assert.equal(prop(r, "--dt-od-foto-h"), "calc(100vw / (var(--dt-od-ar)))");
    assert.equal(prop(r, "--dt-od-coda-h"), `calc(100vw * ${coda.sorgente[1]} / ${coda.sorgente[0]})`);
    assert.equal(
      prop(r, "--dt-od-salita"),
      `max(0px, calc(${foto.cielo.cima} * var(--dt-od-foto-h) - (0.05 * var(--dt-od-titolo-fs) + ${FINESTRA.copri} * 0.85 * var(--dt-od-titolo-fs))))`,
    );
    assert.equal(
      prop(r, "--dt-od-discesa"),
      `max(0px, calc(var(--dt-od-coda-h) - 100svh - max(0px, calc(${coda.cielo.cima} * var(--dt-od-coda-h) - ${FINESTRA.codaSopra} * 100svh))))`,
    );
    assert.equal(prop(r, "height"), `calc(var(--dt-od-salita) + ${FINESTRA.panels * 100}vw - 100vw + var(--dt-od-discesa) + 100svh)`);
  });

  test("le righe dei titoli che le formule contano: «Open Domus» una, «Nessun / costo / anticipato.» tre", () => {
    // Il CSS non sa quante righe fa un titolo: le formule le contano a mano, sul testo che il server
    // rende (sempre `it`; le altre lingue arrivano all'idratazione e cambiano comunque il testo). Un
    // titolo italiano riscritto cambia l'altezza di size() e rifà il salto: qui il test si ferma e
    // chiede di rifare il conto (e la misura di corridors.spec.ts a 1440×900 e 1024×768).
    const od = leggi("app/components/OpenDomus.tsx");
    assert.deepEqual([...new Set(od.match(/^\s*head: "([^"]*)",/gm)?.map((m) => m.trim()) ?? [])], ['head: "Open Domus.",'], "il titolo della finestra non è più «Open Domus.» (una riga, in ogni lingua)");
    const cc = leggi("app/components/CostiChiari.tsx");
    const it = cc.slice(cc.indexOf("  it: {"), cc.indexOf("  en: {"));
    assert.match(it, /^\s*title: "Nessun costo anticipato\.",/m, "il titolo italiano dei costi non è più «Nessun costo anticipato.» (tre righe da 0,9em nella formula)");
  });

  test("Costi chiari: le costanti sono quelle di COSTI e del titolo di tre righe", () => {
    const r = armata(`${GATE} .dt-cc:not([data-on])`);
    assert.ok(r, "manca l'altezza dei costi");
    const titolo = primo.find((x) => x.selettore === ".dt-cc_titolo");
    assert.equal(prop(r, "--dt-cc-titolo-fs"), prop(titolo ?? null, "font-size"), "la misura del titolo non è quella di .dt-cc_titolo");
    assert.equal(prop(titolo ?? null, "line-height"), "0.9");
    assert.equal(prop(r, "--dt-cc-foto-h"), "calc(100vw / (var(--dt-cc-ar)))");
    assert.equal(
      prop(r, "--dt-cc-salita"),
      `max(0px, calc(${COSTI.cimaTitolo} * var(--dt-cc-foto-h) - (${COSTI.rigaTop} + ${COSTI.copri} * 3 * 0.9 * var(--dt-cc-titolo-fs))))`,
    );
    // Quattro pannelli: la facciata, il claim da 60vw, Carmine e Seguici.
    assert.equal(COSTI.panels, 4);
    const claim = primo.find((x) => x.selettore === ".dt-cc[data-on] .dt-horizon_panel.dt-cc_panel--claim");
    assert.equal(prop(claim ?? null, "width"), "60vw");
    assert.equal(prop(r, "height"), "calc(var(--dt-cc-salita) + 360vw - 100vw + 100svh)");
  });

  test("la rotaia: la corsa di [data-on] come padding, RailProgress fuori dal flusso", () => {
    const on = primo.find((r) => r.selettore === ".dt-railway[data-on]");
    assert.equal(prop(on ?? null, "height"), "calc(var(--rail-len, 0px) + var(--rail-run, 120) * 1svh)");
    const r = armata(`${GATE} .dt-railway[data-corridor]:not([data-on])`);
    assert.equal(prop(r, "padding-bottom"), "calc(var(--rail-run, 120) * 1svh)");
    assert.equal(prop(armata(`${GATE} .dt-railway[data-corridor]:not([data-on]) > .dt-rail ~ *`), "position"), "absolute");
  });

  test("lo stage delle stelle è centrato nello schermo come con [data-on]", () => {
    const on = primo.find((r) => r.selettore === ".dt-starrev[data-on] .dt-starrev_stage");
    const r = armata(`${GATE} .dt-starrev .dt-starrev_stage`);
    assert.ok(on && r, "manca lo stage acceso o quello armato");
    assert.deepEqual([...r.dichiarazioni].sort(), [...on.dichiarazioni].sort());
  });
});
