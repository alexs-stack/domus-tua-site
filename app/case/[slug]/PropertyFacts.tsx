// Box dei fatti strutturati nella colonna destra della scheda immobile.
//
// REGOLE DI PRESENTAZIONE (vedi app/lib/realsmart/facts.ts per il modello dati)
//   • si mostrano solo i gruppi che hanno dati: niente box vuoti, niente "—";
//   • dato numerico o qualificato → coppia etichetta/valore in <dl>/<dt>/<dd>;
//   • dotazione booleana → spunta + etichetta testuale (l'icona è decorativa: l'informazione
//     non è mai affidata solo a un'icona o a un colore);
//   • massimo 8 voci immediatamente visibili per gruppo, il resto in un <details> nativo —
//     nessun JavaScript, nessuno scroll interno al box.
//
// Le ETICHETTE dei fatti restano in italiano: i valori arrivano dal testo italiano
// dell'annuncio ("a pavimento", "Monte Rosa") e tradurre solo metà coppia confonderebbe.
// I titoli dei gruppi, invece, seguono la lingua scelta.

import { SegnoTick } from "../../components/BrandMotif";
// Import di SOLI TIPI: le regole di estrazione restano server-side e fuori dal bundle client.
import type { FactGroup, PropertyFact } from "../../lib/realsmart/facts";

/** Ordine di rendering dei box. Allineato a FACT_GROUPS in app/lib/realsmart/facts.ts. */
const GROUP_ORDER: readonly FactGroup[] = ["principali", "esterni", "comfort", "spazi", "forza"];

/** Oltre questa soglia le voci in eccesso finiscono nel <details>. */
const MAX_VISIBLE = 8;

export type FactGroupLabels = Record<FactGroup, string>;

function GroupBox({
  title,
  facts,
  moreLabel,
}: {
  title: string;
  facts: readonly PropertyFact[];
  moreLabel: (n: number) => string;
}) {
  // I dati con valore vengono prima: sono quelli che rispondono alle domande concrete.
  const sorted = [...facts].sort((a, b) => Number(Boolean(b.value)) - Number(Boolean(a.value)));
  const visible = sorted.slice(0, MAX_VISIBLE);
  const rest = sorted.slice(MAX_VISIBLE);

  return (
    <section className="rounded-[2rem] border border-line bg-cream p-6 sm:p-7">
      <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-stone">
        {title}
      </h2>
      <FactList facts={visible} className="mt-4" />
      {rest.length > 0 && (
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-sm font-semibold text-red outline-offset-4 transition-colors hover:text-red-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-red">
            {moreLabel(rest.length)}
          </summary>
          <FactList facts={rest} className="mt-3" />
        </details>
      )}
    </section>
  );
}

function FactList({ facts, className }: { facts: readonly PropertyFact[]; className?: string }) {
  const valued = facts.filter((f) => f.value);
  const flags = facts.filter((f) => !f.value);

  return (
    <div className={className}>
      {valued.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {valued.map((f) => (
            <div key={f.key}>
              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-stone">
                {f.label}
              </dt>
              <dd className="tnum mt-0.5 text-sm font-medium text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {flags.length > 0 && (
        <ul className={valued.length > 0 ? "mt-4 flex flex-col gap-2" : "flex flex-col gap-2"}>
          {flags.map((f) => (
            <li key={f.key} className="flex items-start gap-2.5 text-[0.9rem] text-graphite">
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red"
              >
                <SegnoTick className="h-3 w-3" />
              </span>
              {f.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Rende i box dei fatti, uno per gruppo non vuoto.
 * Se l'immobile non ha fatti strutturati (fixture demo) non rende nulla: la scheda ricade
 * sulla vecchia lista "Caratteristiche".
 */
export default function PropertyFacts({
  facts,
  labels,
  moreLabel,
}: {
  facts: readonly PropertyFact[] | undefined;
  labels: FactGroupLabels;
  moreLabel: (n: number) => string;
}) {
  if (!facts || facts.length === 0) return null;

  const groups = GROUP_ORDER.map((group) => ({
    group,
    facts: facts.filter((f) => f.group === group),
  })).filter((entry) => entry.facts.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {groups.map(({ group, facts: groupFacts }) => (
        <GroupBox
          key={group}
          title={labels[group]}
          facts={groupFacts}
          moreLabel={moreLabel}
        />
      ))}
    </div>
  );
}
