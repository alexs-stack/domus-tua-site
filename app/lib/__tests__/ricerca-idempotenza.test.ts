// L'aggancio della ricerca non si raddoppia e non fa ricorrere GSAP (D120).
//
// Com'è fatto oggi: in `HomeSearchGateway.tsx` set, tween e ScrollTrigger dell'aggancio vivono
// in un gsap.context proprio (`contestoAggancio`), figlio del solo ramo di `gsap.matchMedia`, e
// `arma` smonta quello che ha creato prima di ricrearlo. Il meccanismo di GSAP che D120 evita:
// `Context.add` esegue `prev.data.push(self)` (gsap-core.js 3.15, riga 3925), quindi un
// `contextSafe` del Context di `useGSAP` chiamato DENTRO il ramo mette ciascuno dei due Context
// nei dati dell'altro, e `Context.prototype.getTweens` (riga 3949) ricorre sui figli senza fondo
// fino al «RangeError: Maximum call stack size exceeded».
//
// Questo file presidia D120 con GSAP vera, senza DOM (Context e tween di oggetti semplici
// bastano): il primo blocco prova il meccanismo, il secondo che l'idioma di `arma` chiamato più
// volte lascia un tween solo, il terzo che `HomeSearchGateway.tsx` usa quell'idioma. Le regex
// sul sorgente sono la rete secondaria: il conteggio VERO degli ScrollTrigger del pannello
// armato più volte, nel browser e con `window.__dtST()`, sta in e2e/a28.spec.ts.
//
// Commenti tolti prima di cercare (`soloCodice` di app/lib/__tests__/ricerca-voci.test.ts).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import gsap from "gsap";

const root = join(__dirname, "..", "..", "..");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const ricerca = soloCodice(readFileSync(join(root, "app/components/HomeSearchGateway.tsx"), "utf8"));

/** `gsap.context()` senza argomenti restituisce il contesto CORRENTE: per averne uno nuovo serve una funzione. */
const nuovoContesto = () => gsap.context(() => {});
/**
 * Quel che fa `contextSafe` di @gsap/react: `context.current.add(null, func)`. I tipi di GSAP
 * non dichiarano il primo argomento nullo, il runtime lo accetta — ed è il runtime che produceva
 * il RangeError, quindi il test deve chiamarlo come lo chiama la libreria.
 */
const comeContextSafe = (ctx: ReturnType<typeof nuovoContesto>, fn: () => void): (() => void) =>
  (ctx.add as unknown as (nome: null, func: () => void) => () => void)(null, fn);

describe("GSAP: il Context che contiene sé stesso, e come non farlo", () => {
  test("un contextSafe del Context esterno, chiamato dentro un ramo annidato, fa ricorrere getTweens", () => {
    const esterno = nuovoContesto();
    const ramo = nuovoContesto();
    const contextSafe = comeContextSafe(esterno, () => {});
    esterno.add(() => {
      ramo.add(() => {
        contextSafe();
      });
    });
    assert.ok(ramo.data.includes(esterno), "il ramo annidato finisce per contenere il Context esterno");
    assert.ok(esterno.data.includes(ramo), "e il Context esterno contiene il ramo: è un ciclo");
    assert.throws(() => esterno.getTweens(), RangeError);
  });

  test("un contesto LOCALE creato dentro il ramo tiene l'albero un albero: nessuna ricorsione", () => {
    const esterno = nuovoContesto();
    const ramo = nuovoContesto();
    esterno.add(() => {
      ramo.add(() => {
        const locale = nuovoContesto();
        locale.add(() => {});
      });
    });
    assert.ok(!ramo.data.includes(esterno));
    assert.deepEqual(esterno.getTweens(), []);
    esterno.revert();
  });
});

describe("l'aggancio della ricerca: `arma` è idempotente", () => {
  test("chiamata due volte lascia UN tween solo sul pannello", () => {
    const ramo = nuovoContesto();
    const locale = nuovoContesto();
    const pannello = { opacity: 0.02, scale: 0.75 };
    let tween: gsap.core.Tween | undefined;
    const smonta = () => {
      tween?.kill();
      tween = undefined;
      locale.revert();
    };
    const arma = () => {
      smonta();
      locale.add(() => {
        tween = gsap.fromTo(pannello, { opacity: 0.02, scale: 0.75 }, { opacity: 1, scale: 1, paused: true });
      });
    };
    let unaVolta = -1;
    ramo.add(() => {
      arma();
      unaVolta = locale.getTweens().length;
      arma();
      arma();
    });
    // `gsap.fromTo` registra nel contesto anche il tween dello stato di partenza: quel che conta
    // è che tre chiamate non lascino più roba di una sola.
    assert.equal(locale.getTweens().length, unaVolta, "tre chiamate lasciano quel che ne lascia una");
    assert.equal(gsap.getTweensOf(pannello).length, 1, "un tween solo sul bersaglio");
    smonta();
    ramo.revert();
    assert.equal(gsap.getTweensOf(pannello).length, 0);
  });

  test("senza lo smontaggio i tween si accumulano: è il difetto che D120 chiude", () => {
    const locale = nuovoContesto();
    const pannello = { opacity: 0.02 };
    const arma = () => {
      locale.add(() => {
        gsap.fromTo(pannello, { opacity: 0.02 }, { opacity: 1, paused: true });
      });
    };
    arma();
    arma();
    assert.equal(gsap.getTweensOf(pannello).length, 2);
    locale.revert();
  });
});

describe("HomeSearchGateway.tsx usa il modo nuovo (D120)", () => {
  test("nessun contextSafe: né chiesto a useGSAP né chiamato dentro il ramo di matchMedia", () => {
    assert.doesNotMatch(ricerca, /contextSafe/);
    assert.match(ricerca, /useGSAP\(\s*\(\) => \{/);
  });

  test("il contesto dell'aggancio nasce con una funzione, non con `gsap.context()` nudo", () => {
    assert.match(ricerca, /const contestoAggancio = gsap\.context\(\(\) => \{\}\);/);
    assert.doesNotMatch(ricerca, /gsap\.context\(\)/);
  });

  test("`arma` smonta prima di ricreare, e crea dentro il contesto dell'aggancio", () => {
    assert.match(ricerca, /const smonta = \(\) => \{[\s\S]*?tween\?\.scrollTrigger\?\.kill\(\);[\s\S]*?tween\?\.kill\(\);[\s\S]*?contestoAggancio\.revert\(\);[\s\S]*?\};/);
    assert.match(ricerca, /const arma = \(\) => \{\s*if \(dockFocused\.current\) return;\s*smonta\(\);\s*contestoAggancio\.add\(\(\) => \{/);
  });

  test("un solo fromTo e un solo ScrollTrigger sul pannello, e il cleanup smonta", () => {
    assert.equal(ricerca.match(/gsap\.fromTo\(/g)?.length, 1);
    assert.equal(ricerca.match(/scrollTrigger:\s*\{/g)?.length, 1);
    assert.match(ricerca, /dock\.removeEventListener\("focusin", onFocus\);\s*smonta\(\);/);
  });
});
