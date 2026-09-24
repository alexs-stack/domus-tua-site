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
// LA SCALA ERA ROVESCIATA. Misurata in pagina, la scheda diceva questo: prosa del racconto
// 17px, voci degli elenchi 16px, VALORI DEI FATTI 14px, loro etichette 11.2px. Cioè il
// testo più piccolo e meno leggibile della pagina era esattamente quello su cui si decide
// se una casa è la tua — la metratura, la classe energetica, il numero di bagni — mentre
// la prosa, che si legge una volta sola, era il più grande. Ora i valori stanno a 16px
// come le voci d'elenco della descrizione (stesso tipo di contenuto, stesso corpo) e le
// etichette a 12px, che è il pavimento sotto cui un testo non va mai. Le etichette sono
// maiuscoletto spaziato: a 11.2px erano decorazione, non informazione.
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
      <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-graphite">
        {title}
      </h2>
      <FactList facts={visible} className="mt-4" />
      {rest.length > 0 && (
        <details className="mt-2">
          {/* `min-h-11` = 44px: è un bersaglio tattile, non una riga di testo. Senza,
              l'area toccabile era alta quanto il testo (20px) e su mobile si manca.
              Il segno Domus ruotato è l'AFFORDANCE: senza, "Altre 3 voci" era testo rosso
              indistinguibile da un link — niente diceva che apre lì, né se è già aperto.
              Punta in giù da chiuso, torna su da aperto, con la stessa ease del sito. */}
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-red outline-offset-4 transition-colors hover:text-red-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-red">
            {moreLabel(rest.length)}
            <SegnoTick className="dt-disclosure h-2.5 w-2.5" />
          </summary>
          <FactList facts={rest} className="mt-1" />
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
      {/* SUBGRID, e serve davvero. Ogni coppia è una cella della griglia a due colonne:
          con due griglie indipendenti, un'etichetta che va a capo («CLASSE ENERGETICA» su
          134px di mobile) spingeva GIÙ solo il suo valore e la riga si sfalsava — «E» un
          gradino sotto «Terra». Con `grid-rows-subgrid` le due celle affiancate condividono
          le stesse due tracce: etichette allineate fra loro, valori allineati fra loro,
          sempre. Dove subgrid non c'è, la cella resta una colonna semplice: si perde
          l'allineamento, non l'informazione. */}
      {valued.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          {valued.map((f) => (
            <div key={f.key} className="row-span-2 grid grid-rows-subgrid gap-y-1">
              <dt className="text-[0.75rem] font-medium uppercase tracking-[0.06em] text-graphite">
                {f.label}
              </dt>
              <dd className="tnum self-start text-[1rem] font-medium leading-snug text-ink">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {flags.length > 0 && (
        <ul className={valued.length > 0 ? "mt-5 flex flex-col gap-2.5" : "flex flex-col gap-2.5"}>
          {flags.map((f) => (
            <li key={f.key} className="flex items-start gap-2.5 text-[1rem] leading-snug text-graphite">
              <span
                aria-hidden
                className="mt-[0.15rem] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red"
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
  hiddenKeys,
}: {
  facts: readonly PropertyFact[] | undefined;
  labels: FactGroupLabels;
  moreLabel: (n: number) => string;
  /**
   * Chiavi già mostrate altrove nella scheda (la striscia sotto la gallery): qui si
   * omettono, perché lo stesso dato scritto due volte a due passi di distanza non
   * informa il doppio — fa dubitare di quale dei due sia quello giusto.
   */
  hiddenKeys?: readonly string[];
}) {
  if (!facts || facts.length === 0) return null;

  // L'esclusione viene PRIMA del filtro sui gruppi vuoti: se un box resta senza voci
  // non deve comparire come cornice vuota.
  const hidden = new Set(hiddenKeys ?? []);
  const visibleFacts = hidden.size > 0 ? facts.filter((f) => !hidden.has(f.key)) : facts;

  const groups = GROUP_ORDER.map((group) => ({
    group,
    facts: visibleFacts.filter((f) => f.group === group),
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
