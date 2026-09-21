// UN VALORE SOLO PER L'OMBRA ATTACCATA ALLE LETTERE SOPRA UN'IMMAGINE (D80).
//
// Chi l'ha chiesto: D80 di A28 (coordinatore, 18 set. 2026), dopo aver trovato
// TRE valori divergenti e nessun token: Congedo.tsx (due raggi, il più severo e
// il solo già passato da una lente), StarReviews.tsx (un raggio a 0,25) e
// PreloaderShell.tsx (un raggio a 28 px sul bruno). Com'è fatto oggi: il valore
// vive in un posto solo, `app/lib/ink-media.ts`, esportato come costante
// `INK_ON_MEDIA` per i siti che scrivono `style` e come utility `.dt-ink-media`
// in globals.css per i siti che scrivono classi. Questo test conta le
// occorrenze: in tutto `app/`, fuori dai test, devono essere DUE — la costante e
// l'utility — e devono portare lo stesso valore, carattere per carattere.
//
// È l'unico trattamento ammesso sul bianco che sta sopra un'immagine: l'ombra
// sta attaccata alle lettere. NON è un velo — niente rettangolo, niente
// vignettatura (vietati dalla cliente, C14, DESIGN.md:580).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");

const COSTANTE = "app/lib/ink-media.ts";
const UTILITY = "app/globals.css";
/* Il valore del Congedo, il più severo dei tre: due raggi, 2 px per staccare il
   bordo e 28 px per reggere il fotogramma più chiaro del volo. */
const VALORE = "0 1px 2px rgb(0 0 0 / 0.35), 0 0 28px rgb(0 0 0 / 0.45)";
const OMBRA = /textShadow|text-shadow/g;

/** Tutte le sorgenti di `app/`, fuori dai `__tests__` (che nominano il divieto). */
function sorgenti(): string[] {
  return readdirSync(join(ROOT, "app"), { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && /\.(ts|tsx|css)$/.test(d.name))
    .map((d) => join(d.parentPath, d.name).slice(ROOT.length + 1).split(sep).join("/"))
    .filter((p) => !p.includes("/__tests__/"))
    .sort();
}

describe("l'ombra sulle immagini, un valore solo (D80)", () => {
  test("in tutto app/ ci sono esattamente due occorrenze: la costante e l'utility", () => {
    const trovate = sorgenti()
      .map((p) => [p, (leggi(p).match(OMBRA) ?? []).length] as const)
      .filter(([, n]) => n > 0);
    assert.deepEqual(
      trovate,
      [
        [UTILITY, 1],
        [COSTANTE, 1],
      ],
      `l'ombra va dichiarata in due posti soli: invece ${trovate.map(([p, n]) => `${p} x${n}`).join(", ") || "nessuno"}`,
    );
  });

  test("la costante e l'utility portano lo stesso valore, carattere per carattere", () => {
    const dallaCostante = /textShadow:\s*"([^"]+)"/.exec(leggi(COSTANTE))?.[1];
    const dallUtility = /\.dt-ink-media\s*\{\s*text-shadow:\s*([^;]+);/.exec(leggi(UTILITY))?.[1];
    assert.equal(dallaCostante, VALORE, "la costante non porta il valore del Congedo");
    assert.equal(dallUtility?.trim(), VALORE, "l'utility non porta il valore del Congedo");
  });

  // A35 (Alberto, 19-20 set.): la testa del Congedo sta in flusso sopra lo schermo e il
  // comando nella fascia sotto la banda, inchiostro su crema (D108, D111): sul video
  // non c'è più nessuna lettera, quindi nessuna ombra. Il valore resta quello che il
  // Congedo aveva misurato; lo leggono le stelle e il preloader.
  test("Congedo non scrive più lettere sul video: nessuna ombra e nessuna copia a mano", () => {
    const congedo = leggi("app/components/Congedo.tsx");
    assert.doesNotMatch(congedo, /INK_ON_MEDIA|INK_ON_VIDEO|dt-ink-media/, "il Congedo non ha più testo sopra il media");
    assert.doesNotMatch(congedo, /text-white|ghost-dark/, "sul Congedo il testo è inchiostro su crema");
  });

  // A46 (Alberto, 21 set. 2026, sera): il cielo delle foto alte è trasparente e le scritte delle nove
  // teste stanno sull'avorio, nell'inchiostro della rivista: niente bianco, niente ombra, niente
  // deroga. Le teste escono dall'elenco delle scritte sopra un'immagine (ink-media.ts lo dice).
  test("le teste delle pagine interne non sono più scritte bianche su foto (A46): nessun text-white, nessun ghost-dark, nessuna ombra, e ink-media.ts lo dichiara", () => {
    for (const f of ["app/components/PageHero.tsx", "app/components/motion/PageHeroTesta.tsx", "app/components/Header.tsx"]) {
      // Prima le righe `//`, poi i blocchi: Header.tsx scrive «/case/*» in un commento di riga.
      const t = leggi(f).replace(/(^|[^:])\/\/[^\n]*/g, "$1").replace(/\/\*[\s\S]*?\*\//g, " ");
      assert.doesNotMatch(t, /text-white|ghost-dark|INK_ON_MEDIA|dt-ink-media/, `${f}: una scritta bianca o un'ombra su foto (A46)`);
    }
    assert.match(leggi(COSTANTE), /A46/, "ink-media.ts non dice che le teste stanno sull'avorio (A46)");
    assert.doesNotMatch(leggi(COSTANTE), /bianco nudo, senza ombra né\s+alone, come su era-residence/, "ink-media.ts descrive ancora le teste bianche di A40");
  });

  test("le cinque stelle e il preloader leggono l'utility", () => {
    for (const f of ["app/components/StarReviews.tsx", "app/components/motion/PreloaderShell.tsx"]) {
      assert.match(leggi(f), /\bdt-ink-media\b/, `${f} non legge .dt-ink-media`);
    }
  });

  test("niente velo e niente vignettatura al posto dell'ombra (C14)", () => {
    const css = leggi(UTILITY);
    const blocco = /\.dt-ink-media\s*\{[^}]*\}/.exec(css)?.[0] ?? "";
    assert.match(blocco, /text-shadow/);
    for (const vietato of ["background", "backdrop-filter", "filter", "box-shadow", "opacity"]) {
      assert.ok(!blocco.includes(vietato), `.dt-ink-media non è un velo: via ${vietato}`);
    }
  });
});
