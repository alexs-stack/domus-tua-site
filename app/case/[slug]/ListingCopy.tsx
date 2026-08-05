"use client";

// Composizione tipografica della descrizione di un immobile.
//
// La logica sta tutta in app/lib/listingCopy (pura, testata, senza React): qui restano
// solo le decisioni visive. Ogni tipo di blocco ha una voce diversa, e la gerarchia si
// legge prima ancora di leggere le parole:
//
//   aggancio     display Playfair, inchiostro pieno — la frase che ferma lo scroll
//   prosa        corpo Jakarta, grafite — il testo lungo, largo 68ch, mai di più
//   accento      display grande con il trattino rosso dell'eyebrow — un respiro
//   atmosfera    corsivo Playfair rientrato, come un a-parte a margine
//   elenco       segno Domus al posto del pallino, due colonne da sm in su
//   chiusura     hairline + display: il gradino verso la conversione
//
// Nessuno stato nascosto senza JS: solo i due blocchi "firma" (accento e chiusura) passano
// da Reveal, che ha già il fallback `scripting: none` e il rispetto di reduced-motion.
// Tutto il resto è statico e completo nell'HTML iniziale — testo di annuncio, va indicizzato.

import Reveal from "../../components/Reveal";
import { SegnoTick } from "../../components/BrandMotif";
import type { ListingBlock, Run } from "../../lib/listingCopy/format";

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((run, i) => {
        if (run.t === "strong") {
          // Peso e inchiostro, non colore: il rosso resta l'unico accento della vista
          // ed è già speso dall'eyebrow della zona e dalle CTA.
          return (
            <strong key={i} className="font-semibold text-ink">
              {run.v}
            </strong>
          );
        }
        if (run.t === "em") {
          return (
            <em key={i} className="italic">
              {run.v}
            </em>
          );
        }
        return <span key={i}>{run.v}</span>;
      })}
    </>
  );
}

function Block({ block }: { block: ListingBlock }) {
  switch (block.kind) {
    case "lead":
      return (
        <p className="max-w-[54ch] font-display text-[1.25rem] font-medium leading-[1.5] text-ink balance sm:text-[1.4rem]">
          <Runs runs={block.runs} />
        </p>
      );

    case "accent":
      return (
        <Reveal as="p" className="my-2 max-w-[26ch] font-display text-[1.5rem] font-medium leading-[1.18] tracking-tight text-ink balance sm:text-[1.75rem]">
          {/* Lo stesso trattino rosso dell'helper .eyebrow, ruotato in verticale:
              marca il respiro senza aggiungere un secondo accento cromatico. */}
          <span aria-hidden className="mb-4 block h-px w-7 bg-red/60" />
          <Runs runs={block.runs} />
        </Reveal>
      );

    case "atmosphere":
      return (
        <p className="max-w-[60ch] border-l border-line pl-5 font-display text-[1.05rem] italic leading-[1.75] text-stone sm:pl-6">
          <Runs runs={block.runs} />
        </p>
      );

    case "list":
      return (
        <div className="max-w-[68ch]">
          {block.lead.length > 0 && (
            <p className="text-[1rem] leading-relaxed text-graphite">
              <Runs runs={block.lead} />
            </p>
          )}
          <ul className={`grid gap-x-8 gap-y-2.5 sm:grid-cols-2 ${block.lead.length > 0 ? "mt-3.5" : ""}`}>
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[0.95rem] leading-relaxed text-graphite">
                {/* Stesso punto elenco del resto della scheda (blocco D.O.C., "Con te in
                    ogni passo"), un gradino più piccolo: dentro la prosa il segno deve
                    accompagnare, non scandire. Nudo leggerebbe come un accento "^". */}
                <span
                  aria-hidden
                  className="mt-[0.2rem] flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-full bg-red-soft text-red"
                >
                  <SegnoTick className="h-2.5 w-2.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case "closing":
      return (
        <Reveal as="div" className="mt-2 max-w-[54ch]">
          <span aria-hidden className="hairline mb-6 block" />
          <p className="font-display text-[1.15rem] font-medium leading-[1.55] text-ink balance sm:text-[1.25rem]">
            <Runs runs={block.runs} />
          </p>
        </Reveal>
      );

    default:
      return (
        <p className="max-w-[68ch] text-[1rem] leading-relaxed text-graphite">
          <Runs runs={block.runs} />
        </p>
      );
  }
}

export default function ListingCopy({ blocks }: { blocks: ListingBlock[] }) {
  if (blocks.length === 0) return null;
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}
