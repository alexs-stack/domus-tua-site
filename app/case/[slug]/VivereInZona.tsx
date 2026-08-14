"use client";

// Sezione pubblica "Vivere in zona" — legge SOLO il dato approvato passato come prop dal server.
//
// Non chiama alcun provider, non conosce le coordinate esatte, non mostra marker della casa, non dice
// "a piedi/in auto" e non esprime giudizi. Enhancement (Prompt 12): frase esplicita sulla BASE
// dell'origine, contesto comune/zona, filtro per categoria accessibile ed esploratore schematico di
// distanze caricato in modo lazy SOLO dopo interazione (nessun impatto sull'LCP iniziale). Se non c'è
// dato approvato e fresco → null e la sezione si nasconde.

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { useLocale } from "../../components/i18n/LocaleProvider";
import { SegnoDomusDivider } from "../../components/BrandMotif";
import { buildTerritoryView, type TerritoryLocale } from "../../lib/territory/view";
import type { TerritoryPoiCategory } from "../../lib/territory/categories";
import type { PublicListingTerritory } from "../../lib/territory/types";

// Code-split: il diagramma entra nel bundle solo quando l'utente lo apre. ssr:false → mai in SSR,
// così il percorso "feature spenta / non aperto" non aggiunge JS client apprezzabile.
const TerritoryDistanceExplorer = dynamic(() => import("./TerritoryDistanceExplorer"), {
  ssr: false,
  loading: () => (
    <p className="mt-4 text-sm text-graphite" role="status" aria-live="polite">
      …
    </p>
  ),
});

export default function VivereInZona({
  territory,
}: {
  territory: PublicListingTerritory | null | undefined;
}) {
  const { locale } = useLocale();
  const view = useMemo(() => buildTerritoryView(territory, locale as TerritoryLocale), [territory, locale]);

  // Filtro categorie: null = tutte. Selezione multipla, a stato locale (nessun impatto SSR/SEO).
  const [selected, setSelected] = useState<TerritoryPoiCategory[] | null>(null);
  const [showExplorer, setShowExplorer] = useState(false);

  const filtered = useMemo(() => {
    if (!view) return [];
    return selected === null ? view.categories : view.categories.filter((c) => selected.includes(c.category));
  }, [view, selected]);

  // Empty-state: nessun dato approvato/fresco → nessuna sezione.
  if (!view) return null;

  function toggle(category: TerritoryPoiCategory) {
    setSelected((prev) => {
      if (prev === null) return view!.categories.map((c) => c.category).filter((c) => c !== category);
      const next = prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category];
      return next.length === view!.categories.length ? null : next;
    });
  }

  const isActive = (category: TerritoryPoiCategory) => selected === null || selected.includes(category);

  return (
    <section aria-labelledby="vivere-in-zona-title" className="mx-auto max-w-[1240px] px-5 pb-4 sm:px-8">
      <SegnoDomusDivider className="mb-12" />
      <div className="flex flex-col gap-1">
        <h2
          id="vivere-in-zona-title"
          className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl"
        >
          {view.title}
        </h2>
        {/* Base d'origine ESPLICITA (mai "dall'immobile" per un centroide) + metodo (linea d'aria). */}
        <p className="text-sm text-ink">{view.originLabel}</p>
        <p className="text-sm text-graphite">
          {view.contextLabel} · {view.methodLabel}
        </p>
      </div>

      {/* Filtro per categoria: controlli semantici, aria-pressed, focus visibile, navigabili da tastiera. */}
      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label={view.explorer.filterLegend}>
        <button
          type="button"
          onClick={() => setSelected(null)}
          aria-pressed={selected === null}
          className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-graphite transition-colors aria-pressed:border-red aria-pressed:bg-red-soft aria-pressed:text-red"
        >
          {view.explorer.filterAll}
        </button>
        {view.categories.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => toggle(cat.category)}
            aria-pressed={isActive(cat.category)}
            className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-graphite transition-colors aria-pressed:border-red aria-pressed:bg-red-soft aria-pressed:text-red"
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-graphite" role="status">
          {view.explorer.empty}
        </p>
      ) : (
        <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cat) => (
            <div key={cat.category} className="rounded-2xl border border-line bg-cream p-5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-graphite">{cat.label}</dt>
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
                      <span className="shrink-0 text-sm tabular-nums text-graphite">{poi.distanceLabel}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Progressive enhancement: l'esploratore appare SOLO dopo il click (lazy chunk). */}
      {filtered.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowExplorer((v) => !v)}
            aria-expanded={showExplorer}
            aria-controls="territory-distance-explorer"
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-red hover:text-red"
          >
            {showExplorer ? view.explorer.hide : view.explorer.reveal}
          </button>
          {showExplorer && (
            <div id="territory-distance-explorer">
              <TerritoryDistanceExplorer categories={filtered} strings={view.explorer} locale={locale as TerritoryLocale} />
            </div>
          )}
        </div>
      )}

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
