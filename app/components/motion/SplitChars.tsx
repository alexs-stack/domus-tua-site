// SplitChars — parole e caratteri dei titoli e degli accenti, resi nel server (spec §2.3;
// A20 di Alberto: flip per lettera su tutti i titoli; A22: piatto come Era). Ogni parola è
// span.dt-w (inline-block, nowrap) e ogni carattere span.dt-c; fra due parole resta uno
// spazio vero, così l'a capo cade solo fra parole e il testo si copia intero. Una parola col
// trattino («Social-Storytelling») è una span.dt-w per pezzo, unite da <wbr/> senza spazio:
// va a capo dopo il trattino come il testo semplice e non esce dalla colonna. Lo split è lo
// stesso con JS, senza JS e con reduced-motion. La crenatura persa nell'inline-block torna
// da kern-table.json (D20): `--k` sul carattere di sinistra della coppia, anche a cavallo
// del trattino.
// Accetta stringhe, <br/> e <span className> (la parola rossa dei chiamanti di PageHero):
// un link o un bottone dentro un titolo finirebbe sotto aria-hidden, quindi in sviluppo è
// un errore (spec §2.3).
import { Children, Fragment, isValidElement, type CSSProperties, type ReactNode } from "react";
import { kernBetween, type KernFont } from "../../lib/motion/kern";

export type SplitRun = { kind: "text"; text: string; className?: string } | { kind: "br" };

const DEV = process.env.NODE_ENV !== "production";

export function runsOf(children: ReactNode): SplitRun[] {
  const out: SplitRun[] = [];
  const walk = (node: ReactNode, className?: string) => {
    Children.forEach(node, (child) => {
      if (child === null || child === undefined || typeof child === "boolean") return;
      if (typeof child === "string" || typeof child === "number") {
        out.push({ kind: "text", text: String(child), className });
        return;
      }
      if (isValidElement<{ children?: ReactNode; className?: string }>(child)) {
        if (child.type === "br") {
          out.push({ kind: "br" });
          return;
        }
        if (child.type === Fragment) {
          walk(child.props.children, className);
          return;
        }
        if (child.type === "span" && className === undefined) {
          walk(child.props.children, child.props.className ?? "");
          return;
        }
        if (!DEV) {
          walk(child.props.children, className);
          return;
        }
      }
      throw new Error("SplitTitle accetta solo stringhe, <br/> e <span className>: niente link, bottoni o altri elementi dentro un titolo (spec §2.3).");
    });
  };
  walk(children);
  return out;
}

/** Il nome accessibile: stringhe unite, <br/> come spazio, spazi compressi. */
export function plainText(children: ReactNode): string {
  return runsOf(children)
    .map((r) => (r.kind === "br" ? " " : r.text))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function graphemes(word: string, locale: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(word), (s) => s.segment);
  }
  return Array.from(word);
}

// Spec §2.3, chiesto dalla revisione del commit 5: il titolo spezzato va a capo dopo il
// trattino (U+002D, U+2010) come il testo semplice nel browser (UAX #14: LB20a, niente a
// capo dopo il trattino che apre la parola; LB25, niente a capo fra trattino e cifra).
// Oggi si taglia dove il trattino non è il primo carattere e lo segue una lettera.
const TRATTINO = /^[-\u2010]$/;
const LETTERA = /^\p{L}/u;
const tagliaDopo = (gs: string[], i: number) => i > 0 && i < gs.length - 1 && TRATTINO.test(gs[i]) && LETTERA.test(gs[i + 1]);

/**
 * `charAttr`: l'attributo delle lettere dell'hero. Spec §2.5, «La home»: lockup, firma e H1
 * non portano data-reveal, e la regola dello 0,02 di globals.css e la timeline di
 * HeroCinematic li trovano per `data-hero-char/tchar/schar`. A20 e A22 di Alberto: gli
 * stessi caratteri di tutti i titoli, con la crenatura misurata di D20.
 */
export type SplitCharsProps = {
  children: ReactNode;
  font: KernFont;
  locale: string;
  upper: boolean;
  charAttr?: "data-hero-char" | "data-hero-tchar" | "data-hero-schar";
  /**
   * A75: da dove conta `--i` sui caratteri, di seguito attraverso le parole, per uno stagger scritto
   * in CSS (il lockup d'entrata dell'hero, `.dt-hero_entrata` in globals.css, come le lettere del
   * preloader). Senza, nessun `--i`: le lettere animate da GSAP non ne hanno bisogno.
   */
  index?: number;
};

export default function SplitChars({ children, font, locale, upper, charAttr, index }: SplitCharsProps) {
  const extra: Record<string, string> | undefined = charAttr ? { [charAttr]: "" } : undefined;
  let n = index ?? 0;
  const nodes: ReactNode[] = [];
  // Inizio riga (o del titolo): gli spazi lì non si scrivono.
  let lineStart = true;
  let pendingSpace = false;
  let key = 0;
  for (const run of runsOf(children)) {
    if (run.kind === "br") {
      nodes.push(<br key={key++} />);
      lineStart = true;
      pendingSpace = false;
      continue;
    }
    for (const token of run.text.split(/(\s+)/)) {
      if (token === "") continue;
      if (/^\s+$/.test(token)) {
        pendingSpace = !lineStart;
        continue;
      }
      if (pendingSpace) nodes.push(<Fragment key={key++}>{" "}</Fragment>);
      pendingSpace = false;
      lineStart = false;
      const gs = graphemes(token, locale);
      const chars = gs.map((g, i) => {
        const k = i < gs.length - 1 ? kernBetween(font, g, gs[i + 1], upper, locale) : 0;
        const stile: Record<string, string | number> = {};
        if (k) stile["--k"] = `${k}em`;
        if (index !== undefined) stile["--i"] = n++;
        return (
          <span key={i} className="dt-c" data-c="" {...extra} style={Object.keys(stile).length ? (stile as CSSProperties) : undefined}>
            {g}
          </span>
        );
      });
      const className = run.className ? `dt-w ${run.className}` : "dt-w";
      let from = 0;
      for (let i = 0; i < gs.length; i++) {
        if (i < gs.length - 1 && !tagliaDopo(gs, i)) continue;
        if (from > 0) nodes.push(<wbr key={key++} />);
        nodes.push(
          <span key={key++} className={className} data-w="">
            {chars.slice(from, i + 1)}
          </span>,
        );
        from = i + 1;
      }
    }
  }
  return <>{nodes}</>;
}
