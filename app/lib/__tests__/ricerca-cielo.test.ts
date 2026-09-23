// LA RICERCA NEL CIELO (A80 di Alberto, 23 settembre 2026: «dobbiamo risolvere la pagina acquista, la ricerca
// intelligente non si vede … ingegnati e stupiscimi cambiando il design dell'input della ricerca, con qualcosa di
// figo e bello e consono al design del sito»).
//
// Com'è fatta: la testa della ricerca di /acquista sta nel cielo della foto (PageHero `cielo`), sulla carta, in
// inchiostro; il campo è una riga in Playfair col segnaposto in corsivo pietra che si scrive da solo una volta
// (RigaScritta), la riga rossa del fuoco disegnata sulla riga d'inchiostro e il pulsante tondo come punto fermo.
// Qui si leggono sorgenti e CSS; il DOM, la geometria e i pixel li prova e2e/a28.spec.ts («la ricerca nel cielo»).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

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

const cercaSrc = leggi("app/components/PropertySearch.tsx");
const cerca = soloCodice(cercaSrc);
const riga = soloCodice(leggi("app/components/motion/RigaScritta.tsx"));
const css = leggi("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, " ");
const ricerca = regole(css).filter((r) => r.selettore.split(",").some((s) => s.trim().startsWith(".dt-ricerca")));

describe("la ricerca nel cielo (A80)", () => {
  test("/acquista posa la testa della ricerca nel cielo, non più sulla foto", () => {
    const acq = soloCodice(leggi("app/acquista/AcquistaContent.tsx"));
    assert.match(acq, /cielo=\{<SearchHead \/>\}/);
    assert.doesNotMatch(acq, /sopra=\{<SearchHead/, "la ricerca sta ancora nello spazio sopra la foto");
  });

  test("i segnaposto: l'intero da lg entra nel campo (≤ 64 segni), il corto sotto lg (≤ 28), in cinque lingue, nessuna parola sull'AI", () => {
    const interi = [...cercaSrc.matchAll(/\bnlPlaceholder: "([^"]+)"/g)].map((m) => m[1]);
    const corti = [...cercaSrc.matchAll(/\bnlPlaceholderBreve: "([^"]+)"/g)].map((m) => m[1]);
    assert.equal(interi.length, 5, "un segnaposto intero per lingua");
    assert.equal(corti.length, 5, "un segnaposto corto per lingua");
    for (const s of interi) assert.ok(s.length <= 64, `«${s}» (${s.length} segni) non entra nel campo a 1024`);
    for (const s of corti) assert.ok(s.length <= 28, `«${s}» (${s.length} segni) non entra nel campo a 390`);
    for (const s of [...interi, ...corti]) assert.doesNotMatch(s, /\b(AI|IA|KI|intelligenza artificiale|artificial)\b/i, `«${s}»: nessun riferimento all'AI nei testi (PRODUCT.md)`);
    // Il segnaposto per fascia: il corto nel server e al primo render (nessun mismatch), l'intero da lg dopo.
    assert.match(cerca, /useSyncExternalStore\(iscriviLg, \(\) => window\.matchMedia\(MQ\.lg\)\.matches, \(\) => false\)/);
    assert.match(cerca, /const esempio = daLg \? c\.nlPlaceholder : c\.nlPlaceholderBreve;/);
  });

  test("il campo e il pulsante non portano utility: le `!` di Tailwind coprirebbero la riga rossa disegnata", () => {
    const da = cerca.indexOf("<input", cerca.indexOf("function TestaRicerca"));
    const input = da > -1 ? cerca.slice(da, cerca.indexOf("/>", da) + 2) : "";
    assert.match(input, /^<input\s+className="dt-ricerca_domanda"\s/, "il campo della domanda non ha la sola classe dt-ricerca_domanda");
    assert.match(input, /aria-label=\{c\.nlAria\}/, "il nome accessibile del campo è cambiato");
    const b = cerca.search(/<button\s+type="button"\s+className="dt-ricerca_punto"\s/);
    assert.ok(b > -1, "il pulsante tondo non ha la sola classe dt-ricerca_punto");
    const bottone = cerca.slice(b, cerca.indexOf("</button>", b));
    assert.match(bottone, /aria-label=\{c\.searchAria\}/);
    assert.match(bottone, /data-pieno=\{nl\.trim\(\) \|\| searching \? "" : undefined\}/, "il disco rosso non segue la frase (e la ricerca in corso: lo spinner è bianco)");
    assert.doesNotMatch(cerca, /transition-all/, "transition-all nella ricerca");
  });

  test("il CSS della ricerca è piatto: nessuna ombra, velo, filtro o sfumatura; il raggio solo sul pulsante tondo; si muove solo transform", () => {
    assert.ok(ricerca.length >= 15, `attese le regole .dt-ricerca*: ${ricerca.length}`);
    for (const r of ricerca) {
      assert.doesNotMatch(r.corpo, /box-shadow|text-shadow|(^|[^-])filter\s*:|backdrop-filter|gradient|blur/, `${r.selettore}: niente ombre, veli o sfocature (DESIGN.md, la regola del piatto)`);
      const raggio = /border-radius\s*:\s*([^;]+)/.exec(r.corpo)?.[1]?.trim();
      if (raggio && raggio !== "0") {
        assert.match(r.selettore, /^\.dt-ricerca_punto(::before)?$/, `${r.selettore}: una curva fuori dal pulsante tondo (la cliente: niente curvo)`);
      }
      const trans = /(?:^|[;\s])transition\s*:\s*([^;]+)/.exec(r.corpo)?.[1]?.trim();
      if (trans && trans !== "none") assert.match(trans, /^transform\s/, `${r.selettore}: una transizione che non è transform`);
    }
    const ridotto = ricerca.filter((r) => r.media.includes("@media (prefers-reduced-motion: reduce)"));
    assert.ok(ridotto.some((r) => /transition\s*:\s*none/.test(r.corpo)), "con reduced-motion la riga e il disco cambiano senza transizione");
    // Il campo toglie l'anello globale solo per sé: l'indicatore del fuoco è la riga rossa di 2 px.
    const fuoco = ricerca.find((r) => r.selettore === ".dt-ricerca_campo:focus-within::after");
    assert.ok(fuoco && /transform\s*:\s*scaleX\(1\)/.test(fuoco.corpo), "manca la riga rossa del fuoco");
    const riga2 = ricerca.find((r) => r.selettore === ".dt-ricerca_campo::after");
    assert.match(riga2?.corpo ?? "", /height\s*:\s*2px/);
    assert.match(riga2?.corpo ?? "", /background\s*:\s*var\(--color-red\)/);
    // Il sovrapposto che si scrive è spento finché il campo non è armato: senza JS resta il segnaposto nativo.
    const esempio = ricerca.find((r) => r.selettore === ".dt-ricerca_esempio" && r.media.length === 0);
    assert.match(esempio?.corpo ?? "", /display\s*:\s*none/);
    assert.ok(ricerca.some((r) => r.selettore === ".dt-ricerca_campo[data-scrive] .dt-ricerca_esempio" && /display\s*:\s*flex/.test(r.corpo)));
  });

  test("la riga che si scrive: una passata sola, solo con motion ok, via GSAP, e si ferma al fuoco e alla prima lettera", () => {
    assert.match(riga, /from "\.\.\/\.\.\/lib\/motion\/gsap"/);
    assert.match(riga, /mm\.add\(MQ\.motionOk,/);
    assert.match(riga, /once: true/);
    assert.match(riga, /gsap\.utils\.clamp\(0\.9, 1\.8,/, "la scrittura dura più di 1,8 s");
    assert.doesNotMatch(riga, /\brepeat\b|\byoyo\b/, "la riga non deve ripetersi (WCAG 2.2.2)");
    assert.match(riga, /addEventListener\("focus", stop\)/);
    assert.match(riga, /addEventListener\("input", stop\)/);
    assert.match(riga, /aria-hidden/);
    assert.match(riga, /onLeave: \(\) => \{\s*if \(!tl\) fine\(\);\s*\}/, "saltata oltre senza partire, la riga non ridà il segnaposto");
    assert.match(cerca, /<RigaScritta testo=\{esempio\} fermo=\{!!nl\} \/>/);
  });
});
