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
import { buildTerritoryView, buildAreaView, type TerritoryLocale } from "../../lib/territory/view";
import type { TerritoryPoiCategory } from "../../lib/territory/categories";
import type { PublicListingTerritory } from "../../lib/territory/types";
import type { PublicAreaProfile } from "../../lib/territory/area/types";

// Code-split: il diagramma entra nel bundle solo quando l'utente lo apre. ssr:false → mai in SSR,
// così il percorso "feature spenta / non aperto" non aggiunge JS client apprezzabile.
const TerritoryDistanceExplorer = dynamic(() => import("./TerritoryDistanceExplorer"), {
  ssr: false,
  loading: () => (
    <p className="mt-4 text-body text-graphite" role="status" aria-live="polite">
      …
    </p>
  ),
});

export default function VivereInZona({
  territory,
  area,
}: {
  territory: PublicListingTerritory | null | undefined;
  area?: PublicAreaProfile | null;
}) {
  const { locale } = useLocale();
  const view = useMemo(() => buildTerritoryView(territory, locale as TerritoryLocale), [territory, locale]);
  const areaView = useMemo(() => buildAreaView(area, locale as TerritoryLocale), [area, locale]);

  // Filtro categorie: null = tutte. Selezione multipla, a stato locale (nessun impatto SSR/SEO).
  const [selected, setSelected] = useState<TerritoryPoiCategory[] | null>(null);
  const [showExplorer, setShowExplorer] = useState(false);

  const filtered = useMemo(() => {
    if (!view) return [];
    return selected === null ? view.categories : view.categories.filter((c) => selected.includes(c.category));
  }, [view, selected]);

  // Empty-state: né distanze né descrizioni d'area approvate → nessuna sezione.
  if (!view && !areaView) return null;

  function toggle(category: TerritoryPoiCategory) {
    setSelected((prev) => {
      if (prev === null) return view!.categories.map((c) => c.category).filter((c) => c !== category);
      const next = prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category];
      return next.length === view!.categories.length ? null : next;
    });
  }

  const isActive = (category: TerritoryPoiCategory) => selected === null || selected.includes(category);
  const sectionTitle = view ? view.title : areaView!.title;

  return (
    <section aria-labelledby="vivere-in-zona-title" className="dt-row border-t border-line pb-4 pt-16">
      <div className="flex flex-col gap-2">
        <h2 id="vivere-in-zona-title" className="font-display text-d2">
          {sectionTitle}
        </h2>
        {/* Base d'origine ESPLICITA (mai "dall'immobile" per un centroide) + metodo (linea d'aria). */}
        {view && <p className="mt-4 text-body text-ink">{view.originLabel}</p>}
        {view && (
          <p className="text-body text-graphite">
            {view.contextLabel} · {view.methodLabel}
          </p>
        )}
      </div>

      {view && (
      <>
      {/* Filtro per categoria: controlli semantici, aria-pressed, focus visibile, navigabili da tastiera. */}
      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label={view.explorer.filterLegend}>
        <button
          type="button"
          onClick={() => setSelected(null)}
          aria-pressed={selected === null}
          className="min-h-11 border border-line px-4 py-2 text-ui font-semibold uppercase tracking-[0.08em] text-graphite transition-colors aria-pressed:border-red aria-pressed:text-red"
        >
          {view.explorer.filterAll}
        </button>
        {view.categories.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => toggle(cat.category)}
            aria-pressed={isActive(cat.category)}
            className="min-h-11 border border-line px-4 py-2 text-ui font-semibold uppercase tracking-[0.08em] text-graphite transition-colors aria-pressed:border-red aria-pressed:text-red"
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-body text-graphite" role="status">
          {view.explorer.empty}
        </p>
      ) : (
        <dl className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cat) => (
            <div key={cat.category} className="border-t border-line pt-5">
              <dt className="text-ui font-semibold uppercase tracking-[0.08em] text-graphite">{cat.label}</dt>
              <dd className="mt-4">
                <ul className="flex flex-col gap-2">
                  {cat.pois.map((poi, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3">
                      <span className="text-body text-ink">
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
                      <span className="shrink-0 text-body tabular-nums text-graphite">{poi.distanceLabel}</span>
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
            className="dt-btn dt-btn--ghost"
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
        <p className="mt-6 text-ui text-graphite">
          {view.updatedLabel}
          {view.updatedLabel && view.attribution ? " · " : ""}
          {view.attribution}
        </p>
      )}
      </>
      )}

      {/* La zona in sintesi: DESCRIZIONI d'area verificate (fatti, non giudizi), ognuna con la fonte
          primaria e la data di verifica. Nessuna coordinata, nessun superlativo (guard a monte). */}
      {areaView && (
        <div className={view ? "mt-14" : ""}>
          {view && (
            <h3 className="font-display text-d3">{areaView.title}</h3>
          )}
          <ul className="mt-6 flex flex-col gap-5">
            {areaView.facts.map((f, i) => (
              <li key={i} className="border-l-2 border-line pl-4">
                <p className="text-ui font-semibold uppercase tracking-[0.08em] text-graphite">{f.categoryLabel}</p>
                <p className="mt-2 text-body text-ink">{f.text}</p>
                <p className="mt-2 text-ui text-graphite">
                  {f.sourceUrl ? (
                    <a
                      href={f.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="underline decoration-line underline-offset-2 transition-colors hover:text-red"
                    >
                      {f.sourceOwner}
                    </a>
                  ) : (
                    f.sourceOwner
                  )}
                  {f.reviewedLabel ? ` · ${f.reviewedLabel}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
