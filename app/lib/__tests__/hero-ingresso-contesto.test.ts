// L'ingresso delle lettere dell'hero resta nel Context del ramo: il lampo del lockup al cambio lingua.
//
// Com'è fatto oggi: in HeroCinematic.tsx la timeline d'ingresso di un gruppo nasce in un callback (il timer
// dei 150 ms, l'handoff del sipario, l'IntersectionObserver), quindi dopo che il Context di useGSAP ha finito
// di registrare. Passa da `ingresso = contextSafe(...)`, dove `contextSafe` è il SECONDO argomento del ramo di
// gsap.matchMedia: così `revertOnUpdate` (dependencies [locale]) la reverte col resto. Prima la timeline
// italiana sopravviveva al revert, il passaggio tedesco accendeva a 1 gli stessi span del lockup (SplitChars
// li riusa per indice) e le ultime lettere dello stagger ripartivano dal `from`, opacità 0: il lampo di
// e2e/hero-alto.spec.ts «tedesco», intermittente perché dipende da quando LocaleProvider cambia lingua. Il
// contextSafe di useGSAP chiamato dentro il ramo farebbe ricorrere il revert (D120): lo prova
// ricerca-idempotenza.test.ts.
//
// GSAP vera, senza DOM, lettere come oggetti semplici e orologio guidato a mano (`gsap.updateRoot`): il primo
// blocco prova il meccanismo, il secondo che la ripresa a metà non riparte da capo, il terzo che
// HeroCinematic.tsx usa quell'idioma. Commenti tolti prima di cercare (soloCodice di hero-alto.test.ts).
import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import gsap from "gsap";

const root = join(__dirname, "..", "..", "..");
const soloCodice = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const hero = soloCodice(readFileSync(join(root, "app/components/HeroCinematic.tsx"), "utf8"));

// L'orologio: il ticker vero non deve rendere fra un passo e l'altro. Si riattacca alla fine, così
// l'autoSleep di updateRoot addormenta il ticker e il processo del test esce.
gsap.ticker.remove(gsap.updateRoot);
after(() => {
  gsap.ticker.add(gsap.updateRoot);
});
const avanza = (s: number) => gsap.updateRoot(gsap.globalTimeline.time() + s);

/** Il Context di useGSAP (@gsap/react: `gsap.context(() => {}, scope)`). */
const nuovoContesto = () => gsap.context(() => {});
/** «Domus Tua»: 8 span, accesi dal CSS prima dell'armamento. */
const lockup = () => Array.from({ length: 8 }, () => ({ opacity: 1 }));
const opacita = (lettere: object[]) => lettere.map((l) => (l as { opacity: number }).opacity);
/** La timeline d'ingresso del ruolo `title`: 0,3 s di ritardo, 1,2 s, stagger 0,05 (8 lettere). */
const creaIngresso = (lettere: object[]) =>
  gsap.timeline().fromTo(lettere, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "none", stagger: 0.05 }, 0.3);
/** La condizione di un ramo senza window (MQ.motionOk vuole window.matchMedia; la chiave `all` no). */
const SEMPRE = { all: "(prefers-reduced-motion: no-preference)" };

/**
 * Il passaggio in italiano: il ramo dipinge le lettere e consegna al «timer» la funzione che crea
 * l'ingresso. `fuori` = com'era (nessun Context); `ramo` = il contextSafe del ramo, com'è oggi.
 */
function passaggioItaliano(esterno: gsap.Context, lettere: object[], modo: "fuori" | "ramo") {
  let timer!: () => gsap.core.Timeline;
  esterno.add(() => {
    gsap.matchMedia().add(SEMPRE, (_ramo, contextSafe) => {
      gsap.set(lettere, { opacity: 0.02 });
      const crea = () => creaIngresso(lettere);
      timer = modo === "ramo" ? (contextSafe!(crea) as () => gsap.core.Timeline) : crea;
    });
  });
  return timer;
}

/** Il passaggio tedesco per un gruppo già suonato e finito: si accende e basta. */
const passaggioTedesco = (esterno: gsap.Context, lettere: object[]) =>
  esterno.add(() => {
    gsap.matchMedia().add(SEMPRE, () => {
      gsap.set(lettere, { opacity: 1 });
    });
  });

describe("GSAP: la timeline nata in un callback e il revert di useGSAP", () => {
  test("fuori da ogni Context sopravvive al revert e rifà il lampo sulle lettere riaccese (com'era)", () => {
    const esterno = nuovoContesto();
    const lettere = lockup();
    const orfana = passaggioItaliano(esterno, lettere, "fuori")(); // il timer dei 150 ms: nessun Context corrente
    avanza(0.4); // l'ultima lettera parte a 0,3 + 7·0,05 = 0,65 s: è ancora al `from`
    esterno.revert(); // cambio lingua, revertOnUpdate
    assert.ok(gsap.getTweensOf(lettere).length > 0, "la timeline italiana è ancora sul globalTimeline");
    passaggioTedesco(esterno, lettere);
    avanza(0.5);
    const ultima = opacita(lettere).at(-1)!;
    assert.ok(ultima < 0.3, `il lampo: l'ultima lettera, accesa a 1, è tornata a ${ultima}`);
    orfana.kill();
    esterno.revert();
  });

  test("dal contextSafe del ramo la reverte il revert di useGSAP: nessun lampo", () => {
    const esterno = nuovoContesto();
    const lettere = lockup();
    const tl = passaggioItaliano(esterno, lettere, "ramo")();
    avanza(0.4);
    esterno.revert();
    assert.equal(gsap.getTweensOf(lettere).length, 0, "nessun tween resta sulle lettere");
    assert.equal(tl.parent, null, "la timeline è uccisa");
    passaggioTedesco(esterno, lettere);
    avanza(0.5);
    assert.deepEqual(opacita(lettere), Array(8).fill(1));
    esterno.revert();
  });

  test("il contextSafe del ramo chiamato dentro il ramo (handoff già partito) non crea il ciclo di D120", () => {
    const esterno = nuovoContesto();
    const lettere = lockup();
    esterno.add(() => {
      gsap.matchMedia().add(SEMPRE, (_ramo, contextSafe) => {
        (contextSafe!(() => creaIngresso(lettere)) as () => void)();
      });
    });
    assert.doesNotThrow(() => esterno.revert());
    assert.equal(gsap.getTweensOf(lettere).length, 0);
  });
});

describe("la ripresa a metà (suonati con inizio e fine sull'orologio di gsap)", () => {
  type Lettera = { opacity: number; yPercent: number; rotateY: number };
  /** Il lockup col ruolo `title` intero: opacità, yPercent e rotateY, a riposo come dopo il CSS. */
  const lockupTitle = (): Lettera[] => Array.from({ length: 8 }, () => ({ opacity: 1, yPercent: 0, rotateY: 0 }));
  /** Solo la posa: GSAP appende `_gsap` (circolare) a ogni bersaglio. */
  const posa = (lettere: Lettera[]) => lettere.map(({ opacity, yPercent, rotateY }) => ({ opacity, yPercent, rotateY }));
  const ingressoTitle = (lettere: Lettera[]) =>
    gsap
      .timeline()
      .fromTo(lettere, { opacity: 0, yPercent: 50, rotateY: 90 }, { opacity: 1, yPercent: 0, rotateY: 0, duration: 1.2, ease: "none", stagger: 0.05 }, 0.3);

  /**
   * Il ramo di HeroCinematic ridotto all'osso: al primo passaggio dipinge e consegna l'ingresso al «timer»;
   * ai cambi lingua dopo, un gruppo finito si accende (solo opacità, come `accendi`) e uno a metà riprende.
   * `salto`: `ignore` = il salto avanti fuori dal Context (com'è oggi); `dentro` = dentro il contextSafe.
   */
  function scena(salto: "ignore" | "dentro") {
    const esterno = nuovoContesto();
    const lettere = lockupTitle();
    const suonati = new Map<string, { inizio: number; fine: number }>();
    let timer!: () => void;
    const passaggio = (primo: boolean) =>
      esterno.add(() => {
        gsap.matchMedia().add(SEMPRE, (ramo, contextSafe) => {
          const ingresso = contextSafe!((dal: number) => {
            const tl = ingressoTitle(lettere);
            if (dal > 0) {
              if (salto === "ignore") ramo.ignore(() => tl.time(dal));
              else tl.time(dal);
            }
            suonati.set("lockup", { inizio: tl.startTime(), fine: tl.endTime() });
          }) as (dal: number) => void;
          const ora = gsap.globalTimeline.time();
          const s = suonati.get("lockup");
          if (s && ora >= s.fine) gsap.set(lettere, { opacity: 1 });
          else if (s) ingresso(ora - s.inizio);
          if (primo) {
            gsap.set(lettere, { opacity: 0.02 });
            timer = () => ingresso(0);
          }
        });
      });
    /** Il cambio lingua: revertOnUpdate, poi il passaggio nella lingua nuova. */
    const cambiaLingua = () => {
      esterno.revert();
      passaggio(false);
    };
    passaggio(true);
    return { esterno, lettere, cambiaLingua, avviaTimer: () => timer() };
  }

  test("rifatta con tl.time(ora - inizio) sugli stessi span, ogni lettera riparte da dov'era", () => {
    const { esterno, lettere, cambiaLingua, avviaTimer } = scena("ignore");
    avviaTimer();
    avanza(0.7);
    const prima = opacita(lettere);
    cambiaLingua();
    const dopo = opacita(lettere);
    dopo.forEach((v, i) => assert.ok(Math.abs(v - prima[i]) < 1e-6, `lettera ${i}: ${prima[i]} prima, ${v} dopo`));
    const max = dopo.slice();
    for (let k = 0; k < 20; k++) {
      avanza(0.1);
      opacita(lettere).forEach((v, i) => {
        assert.ok(!(max[i] >= 0.9 && v <= 0.1), `lampo sulla lettera ${i}`);
        max[i] = Math.max(max[i], v);
      });
    }
    assert.deepEqual(opacita(lettere), Array(8).fill(1));
    esterno.revert();
  });

  test("dopo la ripresa, il cambio lingua a ingresso finito lascia le lettere a riposo, non di taglio", () => {
    const { esterno, lettere, cambiaLingua, avviaTimer } = scena("ignore");
    avviaTimer();
    avanza(0.9); // tutte le 8 lettere sono partite (l'ultima a 0,65 s)
    cambiaLingua(); // it → de, ripresa a metà
    avanza(3); // ingresso finito
    cambiaLingua(); // de → fr dal selettore: il gruppo è finito, si accende
    avanza(1);
    assert.deepEqual(posa(lettere), Array(8).fill({ opacity: 1, yPercent: 0, rotateY: 0 }));
    esterno.revert();
  });

  test("col salto avanti dentro il Context il revert doppio lascia la posa `from` (il difetto che `ignore` evita)", () => {
    const { esterno, lettere, cambiaLingua, avviaTimer } = scena("dentro");
    avviaTimer();
    avanza(0.9);
    cambiaLingua();
    avanza(3);
    cambiaLingua();
    avanza(1);
    const p = posa(lettere);
    assert.ok(
      p.every((l) => l.rotateY === 90 && l.yPercent === 50),
      `le lettere dovrebbero essere rimaste di taglio: ${JSON.stringify(p)}`,
    );
    esterno.revert();
  });
});

describe("HeroCinematic.tsx: l'ingresso passa dal contextSafe del ramo", () => {
  test("il ramo di matchMedia riceve il suo contextSafe e l'ingresso ci passa", () => {
    assert.match(hero, /mm\.add\(MQ\.motionOk, \(ramo, contextSafe\) => \{\s*if \(!contextSafe\) return;/);
    assert.match(hero, /const ingresso = contextSafe\(\(g: Gruppo, dal: number\) => \{[\s\S]*?const tl = gsap\s*\.timeline\(/);
  });

  test("una sola timeline, dentro l'ingresso; il timer, l'handoff e l'observer ci arrivano da `suona`", () => {
    assert.equal((hero.match(/gsap\s*\.timeline\(/g) ?? []).length, 1);
    const corpo = /const ingresso = contextSafe\(([\s\S]*?)\}\) as \(g: Gruppo, dal: number\) => void;/.exec(hero)?.[1] ?? "";
    assert.match(corpo, /gsap\s*\.timeline\(/, "la timeline sta dentro il contextSafe del ramo");
    assert.match(hero, /const suona = \(g: Gruppo\) => \{\s*if \(!suonati\.current\.has\(g\.nome\)\) ingresso\(g, 0\);\s*\};/);
  });

  test("nessun contextSafe di useGSAP: il callback non prende argomenti e il ritorno non si destruttura", () => {
    assert.match(hero, /useGSAP\(\s*\(\) => \{/);
    assert.doesNotMatch(hero, /=\s*useGSAP\(/);
  });

  test("la ripresa: inizio e fine sull'orologio di gsap, finito si accende, a metà riprende", () => {
    assert.match(hero, /suonati\.current\.set\(g\.nome, \{ inizio: tl\.startTime\(\), fine: tl\.endTime\(\) \}\)/);
    assert.match(hero, /const ora = gsap\.globalTimeline\.time\(\);/);
    assert.match(hero, /if \(ora >= s\.fine\) \{\s*accendi\(g\.chars\);\s*continue;\s*\}/);
    assert.match(hero, /ingresso\(g, ora - s\.inizio\);/);
    assert.match(hero, /if \(dal > 0\) ramo\.ignore\(\(\) => tl\.time\(dal\)\);/, "il salto avanti fuori dal Context del ramo");
  });
});
