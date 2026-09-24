"use client";

// Composizione tipografica della descrizione di un immobile.
//
// La logica sta tutta in app/lib/listingCopy (pura, testata, senza React): qui restano
// solo le decisioni visive. Ogni tipo di blocco ha una voce diversa, e la gerarchia si
// legge prima ancora di leggere le parole:
//
//   aggancio     display Playfair, inchiostro pieno — la frase che ferma lo scroll
//   prosa        corpo Jakarta a 17px su 1.75, grafite — largo 64ch, mai di più
//   accento      display grande con il trattino rosso dell'eyebrow — un respiro
//   atmosfera    corsivo Playfair rientrato, come un a-parte a margine
//   elenco       pannello crema con il segno Domus — le dotazioni si CONTANO, non si leggono
//   chiusura     hairline + display: il gradino verso la conversione
//
// LA MISURA, e perché NON è in `ch`. `ch` è la larghezza dello ZERO, non del carattere
// medio: in Plus Jakarta Sans lo zero è largo il 39% in più della lettera media, quindi
// `max-w-[64ch]` dava righe da 78 caratteri VERI — fuori dalla forbice di leggibilità
// (65-75). Peggio: `ch` si risolve sul font CARICATO, quindi la misura cambia tra
// fallback e webfont, e con lei l'altezza del blocco. Le misure qui sono in rem, prese
// dalla pagina reale: 39rem ≈ 70 caratteri di prosa, 34.5rem ≈ 68 di corsivo Playfair.
// I blocchi "firma" (aggancio, accento, chiusura) stanno più stretti — sono display, e un
// display si legge a colpo d'occhio o non si legge.
//
// IL RITMO. Non una spaziatura uniforme ma una scala: la prosa respira poco (è un discorso
// continuo), accento e chiusura molto (sono cesure). Lo spazio è la punteggiatura del
// layout — con un `gap` unico tutti i blocchi pesano uguale, e la gerarchia svanisce.
//
// L'ELENCO. È l'unico blocco su superficie piena: dentro un fiume di prosa le dotazioni
// sono l'informazione che si scandaglia, non che si legge riga per riga. Il pannello crema
// le stacca dal racconto e le rende scansionabili, con lo stesso segno Domus e la stessa
// crema delle card dei dati — la scheda resta un pezzo solo.
//
// Nessuno stato nascosto senza JS: solo i due blocchi "firma" (accento e chiusura) passano
// da Reveal, che ha già il fallback `scripting: none` e il rispetto di reduced-motion.
// Tutto il resto è statico e completo nell'HTML iniziale — testo di annuncio, va indicizzato.

import { useId } from "react";
import Reveal from "../../components/Reveal";
import { SegnoTick } from "../../components/BrandMotif";
import { blockText, splitSentences, type ListingBlock, type Run } from "../../lib/listingCopy/format";

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

/**
 * Voce di elenco: il segno Domus e il testo, allineati sulla prima riga.
 *
 * 1rem pieno e non 0.98: le dotazioni sono il contenuto che si SCANDAGLIA, e sotto i
 * 16px iOS ingrandisce da solo il viewport. Il testo più scansionato della colonna non
 * può essere anche il più piccolo.
 */
function Item({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-3 text-[1rem] leading-[1.6] text-ink">
      {/* Stesso punto elenco del resto della scheda (blocco D.O.C., "Con te in ogni
          passo"). `mt` ottico, non centrato: il segno deve stare sulla prima riga del
          testo, non a metà della voce quando questa va a capo. */}
      <span
        aria-hidden
        className="mt-[0.3rem] flex h-[1.2rem] w-[1.2rem] shrink-0 items-center justify-center rounded-full bg-red-soft text-red"
      >
        <SegnoTick className="h-2.5 w-2.5" />
      </span>
      <span>{children}</span>
    </li>
  );
}

/**
 * Blocco elenco: attacco in prosa + pannello delle voci.
 *
 * L'attacco è legato al pannello con `aria-labelledby`. Senza, chi naviga con uno screen
 * reader saltando di elenco in elenco sente «elenco, 4 voci» e basta: le dotazioni
 * arrivano senza sapere di COSA sono dotazioni. L'attacco resta comunque nel flusso di
 * lettura — l'associazione non lo duplica, lo rende raggiungibile anche fuori sequenza.
 */
function ListBlock({ block }: { block: Extract<ListingBlock, { kind: "list" }> }) {
  const leadId = useId();
  const hasLead = block.lead.length > 0;
  return (
    <div className="max-w-[39rem]">
      {hasLead && (
        <p id={leadId} className="mb-3.5 text-[1.0625rem] leading-[1.75] text-graphite text-pretty">
          <Runs runs={block.lead} />
        </p>
      )}
      {/* Due colonne da sm in su: le dotazioni sono sintagmi corti, in colonna unica
          lascerebbero metà riga vuota per tutta l'altezza del pannello. */}
      <ul
        aria-labelledby={hasLead ? leadId : undefined}
        className="grid gap-x-8 gap-y-3 rounded-[1.5rem] border border-line bg-cream/60 px-6 py-5 sm:grid-cols-2 sm:px-7 sm:py-6"
      >
        {block.items.map((item, i) => (
          <Item key={i}>{item}</Item>
        ))}
      </ul>
    </div>
  );
}

function Block({ block }: { block: ListingBlock }) {
  switch (block.kind) {
    case "lead":
      return (
        <p className="max-w-[30rem] font-display text-[1.35rem] font-medium leading-[1.4] tracking-[-0.01em] text-ink balance sm:text-[1.6rem]">
          <Runs runs={block.runs} />
        </p>
      );

    case "accent":
      return (
        <Reveal as="p" className="max-w-[23rem] font-display text-[1.55rem] font-medium leading-[1.18] tracking-tight text-ink balance sm:text-[1.85rem]">
          {/* Lo stesso trattino rosso dell'helper .eyebrow, ruotato in verticale:
              marca il respiro senza aggiungere un secondo accento cromatico. */}
          <span aria-hidden className="mb-5 block h-px w-8 bg-red/60" />
          <Runs runs={block.runs} />
        </Reveal>
      );

    case "atmosphere":
      return (
        <p className="max-w-[34.5rem] border-l-2 border-red/25 pl-5 font-display text-[1.08rem] italic leading-[1.8] text-stone sm:pl-7">
          <Runs runs={block.runs} />
        </p>
      );

    case "list":
      return <ListBlock block={block} />;

    case "closing":
      return (
        <Reveal as="div" className="max-w-[30rem]">
          <span aria-hidden className="hairline mb-7 block" />
          <p className="font-display text-[1.2rem] font-medium leading-[1.5] tracking-[-0.01em] text-ink balance sm:text-[1.35rem]">
            <Runs runs={block.runs} />
          </p>
        </Reveal>
      );

    default:
      return (
        <p className="max-w-[39rem] text-[1.0625rem] leading-[1.75] text-graphite text-pretty">
          <Runs runs={block.runs} />
        </p>
      );
  }
}

/**
 * Oltre questa lunghezza un paragrafo non è più una riga staccata ma prosa vera.
 * Vedi `spaceBefore`.
 */
const STACCATO_MAX = 72;

/**
 * Spazio SOPRA un blocco, in funzione di cosa lo precede.
 *
 * La regola è una sola: quanto più il blocco è una cesura, tanto più spazio si prende.
 * Due paragrafi di prosa di fila sono un discorso che continua e stanno vicini; un accento
 * o una chiusura interrompono, e l'interruzione deve vedersi prima ancora di leggerla.
 *
 * LO STACCATO. Metà degli annunci veri di Domus Tua è scritta a righe corte — «Tempo.»,
 * «Energia.», «Manutenzione.» — una per capoverso: è una figura retorica, una scala che
 * sale. Trattate come paragrafi qualunque diventavano trentasei blocchi distanti uguale,
 * e la scala si sfaldava in un elenco di frasi orfane. Quando due righe corte si susseguono
 * lo spazio si stringe: tornano a essere UN respiro solo, che è come sono state scritte.
 */
function spaceBefore(blocks: ListingBlock[], i: number): string {
  const kind = blocks[i].kind;
  const previous = blocks[i - 1].kind;

  if (kind === "accent" || kind === "closing") return "mt-12 sm:mt-14";
  if (previous === "accent") return "mt-7";
  if (kind === "list" || previous === "list") return "mt-8";
  if (kind === "atmosphere" || previous === "atmosphere") return "mt-8";

  // Una riga staccata è UNA frase corta, non semplicemente poco testo: due mezze frasi
  // vicine non sono una scala che sale, sono prosa spezzata, e vanno spaziate come prosa.
  const staccato = (index: number) => {
    if (blocks[index].kind !== "para") return false;
    const text = blockText(blocks[index]).trim();
    return text.length <= STACCATO_MAX && splitSentences(text).length === 1;
  };
  if (staccato(i) && (staccato(i - 1) || blocks[i - 1].kind === "lead")) return "mt-2.5";

  if (previous === "lead") return "mt-7";
  return "mt-5";
}

export default function ListingCopy({ blocks }: { blocks: ListingBlock[] }) {
  if (blocks.length === 0) return null;
  return (
    <div>
      {blocks.map((block, i) => (
        <div key={i} className={i === 0 ? undefined : spaceBefore(blocks, i)}>
          <Block block={block} />
        </div>
      ))}
    </div>
  );
}
