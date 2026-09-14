// SplitChars rende nel server parole e caratteri dei titoli (spec §2.3; A20 e A22 di
// Alberto: flip per lettera, piatto). Qui si pretende il markup che il motore anima
// (`[data-c]`), gli spazi veri fra le parole, i <br/> e la span rossa dei chiamanti di
// PageHero, il nome accessibile e il rifiuto degli elementi interattivi.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SplitChars, { plainText, runsOf } from "../../components/motion/SplitChars";
import table from "../motion/kern-table.json";

const T = table as Record<string, Record<string, number>>;
const render = (children: ReactNode, upper = true, locale = "it") =>
  // eslint-disable-next-line react/no-children-prop -- file .ts senza JSX: `children` è un prop obbligatorio di SplitCharsProps
  renderToStaticMarkup(createElement(SplitChars, { font: "display-500", locale, upper, children }));
const conta = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe("SplitChars", () => {
  test("una parola per span.dt-w, un carattere per span.dt-c, uno spazio vero fra le parole", () => {
    const html = render("Due parole");
    assert.equal(conta(html, /class="dt-w"/g), 2);
    assert.equal(conta(html, /data-c=""/g), 9);
    assert.match(html, /<\/span><\/span> <span class="dt-w"/);
  });

  test("il titolo di PageHero: <br/> vero e la span rossa sulle sue parole", () => {
    const html = render([
      "Acquistare casa,",
      createElement("br", { key: "b" }),
      createElement("span", { key: "s", className: "text-red-soft" }, "con sicurezza."),
    ]);
    assert.equal(conta(html, /<br\/>/g), 1);
    assert.equal(conta(html, /class="dt-w text-red-soft"/g), 2);
    assert.doesNotMatch(html, /<br\/> /, "uno spazio dopo il <br/> sposterebbe l'attacco della riga");
  });

  test("il nome accessibile unisce le stringhe, il <br/> vale uno spazio", () => {
    assert.equal(
      plainText(["Lo raccontano", createElement("br", { key: "b" }), createElement("span", { key: "s", className: "x" }, "le persone.")]),
      "Lo raccontano le persone.",
    );
    assert.equal(plainText("  Due   spazi  "), "Due spazi");
  });

  test("dentro un titolo niente link né bottoni: errore in sviluppo", () => {
    assert.throws(() => runsOf(createElement("a", { href: "/vendi" }, "Vendi")), /SplitTitle accetta solo/);
    assert.throws(() => runsOf(createElement("button", null, "Ok")), /SplitTitle accetta solo/);
  });

  test("la crenatura va sul carattere di sinistra della coppia", () => {
    // Una coppia di sole lettere A-Z: la punteggiatura (', &) uscirebbe escapata nell'HTML.
    const voce = Object.entries(T["display-500"]).find(([p]) => /^[A-Z]{2}$/.test(p));
    assert.ok(voce, "display-500 senza coppie di lettere: rigenerare con npx tsx scripts/kern-table.ts");
    const [coppia, v] = voce;
    const html = render(coppia);
    assert.match(html, new RegExp(`style="--k:${v}em">${coppia[0]}</span>`));
  });

  test("la parola col trattino va a capo dopo il trattino: una span.dt-w per pezzo, unite da <wbr/>", () => {
    // Spec §2.3, chiesto dalla revisione del commit 5: senza il taglio la parola intera non va a capo e in de a 1440 esce dalla colonna dei servizi di /vendi.
    const html = render("Social-Storytelling", true, "de");
    assert.equal(conta(html, /class="dt-w"/g), 2);
    assert.equal(conta(html, /<wbr\/>/g), 1);
    assert.equal(conta(html, /data-c=""/g), 19);
    assert.match(html, /-<\/span><\/span><wbr\/><span class="dt-w" data-w=""><span class="dt-c" data-c=""[^>]*>S<\/span>/, "fra i pezzi nessuno spazio");
    const trattino = String.fromCharCode(0x2010);
    assert.equal(conta(render(`Open${trattino}Domus`), /class="dt-w"/g), 2);
    // Dove il testo semplice non va a capo non si taglia: trattino in testa, trattino prima di una cifra.
    assert.equal(conta(render("-uno"), /class="dt-w"/g), 1);
    assert.equal(conta(render("Covid-19"), /class="dt-w"/g), 1);
  });

  test("a cavallo del trattino la crenatura resta sul carattere di sinistra", () => {
    const voce = Object.entries(T["display-500"]).find(([p]) => /^[A-Z]-$/.test(p));
    assert.ok(voce, "display-500 senza coppie lettera-trattino: rigenerare con npx tsx scripts/kern-table.ts");
    const [coppia, v] = voce;
    const html = render(`${coppia[0]}-Casa`);
    assert.match(html, new RegExp(`style="--k:${v}em">${coppia[0]}</span><span class="dt-c" data-c="">-</span></span><wbr/><span class="dt-w"`));
  });

  test("i grafemi composti restano un carattere solo; «ß» non rompe il maiuscolo tedesco", () => {
    assert.equal(conta(render("e\u0301"), /data-c=""/g), 1);
    assert.equal(conta(render("Straße", true, "de"), /data-c=""/g), 6);
  });
});
