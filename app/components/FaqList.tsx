"use client";

// Elenco di domande e risposte — la forma condivisa da /domande-frequenti e dai blocchi
// compatti in coda a /vendi e /acquista.
//
// `<details>`/`<summary>` nativi, di proposito: si aprono senza JavaScript, funzionano da
// tastiera senza una riga di ARIA scritta a mano e restano leggibili dai crawler. Il testo
// della risposta è nell'HTML iniziale anche quando il pannello è chiuso — è contenuto,
// non un dettaglio decorativo.
//
// Il markup del pannello è lo stesso già usato dalla FAQ di /lavora-con-noi: qui è stato
// estratto perché ora ha tre call-site, non uno.

import Reveal from "./Reveal";
import type { FaqEntry } from "../domande-frequenti/faq";

export default function FaqList({
  entries,
  startDelay = 0,
}: {
  entries: readonly FaqEntry[];
  /** ms di ritardo del primo elemento, per incastrare l'elenco in una coreografia più ampia */
  startDelay?: number;
}) {
  return (
    <div>
      {entries.map((item, i) => (
        <Reveal as="div" key={item.id} delay={startDelay + i * 45}>
          <details className="group border-b border-line py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left font-display text-lg font-medium leading-snug text-ink transition-colors duration-300 hover:text-red [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden
                className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-stone transition-transform duration-300 group-open:rotate-45"
              >
                <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-[1.6]">
                  <path d="M6 1v10M1 6h10" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p className="mt-3 max-w-2xl pr-12 text-[0.95rem] leading-relaxed text-stone">
              {item.a}
            </p>
          </details>
        </Reveal>
      ))}
    </div>
  );
}
