"use client";

// Sezione pubblica "Vivere in zona" — legge SOLO il dato approvato passato come prop dal server.
//
// Non chiama alcun provider, non conosce le coordinate esatte, non mostra mappe né marker della
// casa, non dice "a piedi/in auto" e non esprime giudizi. Se non c'è dato approvato e fresco, il
// modello di vista è null e la sezione si nasconde per intero (empty-state).

import { useLocale } from "../../components/i18n/LocaleProvider";
import { SegnoDomusDivider } from "../../components/BrandMotif";
import { buildTerritoryView, type TerritoryLocale } from "../../lib/territory/view";
import type { PublicListingTerritory } from "../../lib/territory/types";

export default function VivereInZona({
  territory,
}: {
  territory: PublicListingTerritory | null | undefined;
}) {
  const { locale } = useLocale();
  const view = buildTerritoryView(territory, locale as TerritoryLocale);

  // Empty-state: nessun dato approvato/fresco → nessuna sezione.
  if (!view) return null;

  return (
    <section
      aria-labelledby="vivere-in-zona-title"
      className="mx-auto max-w-[1240px] px-5 pb-4 sm:px-8"
    >
      <SegnoDomusDivider className="mb-12" />
      <div className="flex flex-col gap-1">
        <h2
          id="vivere-in-zona-title"
          className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl"
        >
          {view.title}
        </h2>
        {/* Metodo esplicito: distanza in linea d'aria, mai percorribilità. */}
        <p className="text-sm text-graphite">{view.methodLabel}</p>
      </div>

      <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {view.categories.map((cat) => (
          <div key={cat.category} className="rounded-2xl border border-line bg-cream p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">
              {cat.label}
            </dt>
            <dd className="mt-3">
              <ul className="flex flex-col gap-2">
                {cat.pois.map((poi, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3">
                    <span className="text-ink">
                      {poi.sourceUrl ? (
                        <a
                          href={poi.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="underline decoration-line underline-offset-2 transition-colors hover:text-red"
                        >
                          {poi.name}
                        </a>
                      ) : (
                        poi.name
                      )}
                    </span>
                    {/* Distanza come testo leggibile (mai icona da sola). */}
                    <span className="shrink-0 text-sm tabular-nums text-graphite">
                      {poi.distanceLabel}
                    </span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>

      {(view.updatedLabel || view.attribution) && (
        <p className="mt-6 text-xs text-graphite">
          {view.updatedLabel}
          {view.updatedLabel && view.attribution ? " · " : ""}
          {view.attribution}
        </p>
      )}
    </section>
  );
}
