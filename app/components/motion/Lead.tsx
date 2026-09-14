"use client";

// Lead — il ruolo `lead` (spec §2.2-§2.3). A20 di Alberto («Fedeltà letterale»): le righe del
// paragrafo salgono da una maschera come in Era. SplitText nel client, a righe con maschera,
// dopo i font (o 3 s); sulle tre teste senza foto (`data-fold-lcp`, spec §2.5) anche dopo la
// prima voce LCP, e fino ad allora il paragrafo resta intero e dipinto a 0,02. onSplit non
// anima: riporta le righe allo stato del gruppo (resync); ingresso e uscita li suona il motore,
// e mentre la piega aspetta (`data-fold-pending`) le prende fold.ts alla partenza. Sotto la
// piega il paragrafo è armato col suo gruppo e resta intero finché lo split non ne fa righe
// (fuori dal viewport). Con reduced-motion e senza JS resta un <p> intero e fermo; sotto
// MotionFreeze (/case/[slug], D32 e A26) un <p> senza gruppo.
import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";
import { FOLD_LCP, FOLD_PENDING, afterFirstLcp, fontsOrTimeout } from "../../lib/motion/fold";
import { resync } from "../../lib/motion/reveal-engine";
import { useLocale } from "../i18n/LocaleProvider";
import RevealGroup, { useInRevealGroup } from "./RevealGroup";
import { useMotionFrozen } from "./MotionFreeze";

// Registrazione locale: SplitText resta fuori dal chunk del layout (il commento su SplitText in gsap.ts).
gsap.registerPlugin(SplitText);

export type LeadProps = { className?: string; children: string };

const classe = (className: string) => (className ? `lead ${className}` : "lead");

// D51 (giro di correzione 1 della verifica del commit 6; la regola di SplitChars, spec §2.3): SplitText
// mette in una riga le parole per la posizione del loro rettangolo, e una parola col trattino
// («multi-proposta», «Open-Domus-Event») che il browser spezza dopo il trattino finiva intera nella
// riga in cui comincia: la .dt-line a blocco (D47) andava a capo dentro di sé, alta due righe, e il
// paragrafo cresceva di una riga rispetto al testo intero. Il delimitatore fa parola a sé ogni
// spazio (resta un nodo di testo, `replaceWith` vuoto: nessun carattere aggiunto o tolto) e taglia
// dopo il trattino (U+002D, U+2010, il morbido U+00AD) seguito da un carattere. Con `tag: "span"`
// le parole restano inline: il browser va a capo dove andrebbe nel testo semplice, e un taglio dove
// non va a capo (trattino davanti a una cifra, trattino che apre la parola) resta sulla stessa riga.
const TAGLIO_PAROLE = /(?= )|(?<= )|(?<=[-\u2010\u00AD])(?=\S)/u;

function Righe({ className = "", children }: LeadProps) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const { locale } = useLocale();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        let split: SplitText | null = null;
        let annullato = false;
        const attese: Promise<void>[] = [fontsOrTimeout(3000)];
        if (el.closest(`[${FOLD_LCP}]`)) attese.push(afterFirstLcp());
        void Promise.all(attese).then(() => {
          if (annullato) return;
          split = SplitText.create(el, {
            type: "lines",
            mask: "lines",
            tag: "span",
            wordDelimiter: { delimiter: TAGLIO_PAROLE, replaceWith: "" },
            linesClass: "dt-line",
            aria: "none",
            autoSplit: true,
            onSplit: () => {
              el.setAttribute("data-lead", "split");
              const group = el.closest<HTMLElement>("[data-reveal-group]");
              if (group && !group.hasAttribute(FOLD_PENDING)) {
                if (el.style.opacity) el.style.opacity = "1";
                resync(group);
              }
              el.dispatchEvent(new Event("dt:lead", { bubbles: true }));
            },
          });
        });
        return () => {
          annullato = true;
          split?.revert();
          split = null;
          el.setAttribute("data-lead", "pending");
        };
      });
    },
    // Al cambio lingua il paragrafo si rimonta (key) e lo split si rifà sul testo nuovo:
    // SplitText stacca i nodi di testo, un aggiornamento React lascerebbe la lingua vecchia.
    { scope: ref, dependencies: [locale], revertOnUpdate: true },
  );

  return (
    <p key={locale} ref={ref} className={classe(className)} data-reveal="lead" data-lead="pending">
      {children}
    </p>
  );
}

export default function Lead(props: LeadProps) {
  const inGroup = useInRevealGroup();
  const frozen = useMotionFrozen();
  if (frozen) return <p className={classe(props.className ?? "")}>{props.children}</p>;
  return inGroup ? (
    <Righe {...props} />
  ) : (
    <RevealGroup>
      <Righe {...props} />
    </RevealGroup>
  );
}
