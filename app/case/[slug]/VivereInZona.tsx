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

  // TITOLO DELLA SEZIONE. Quando c'è un'area verificata è la sua intestazione — "Vivere in
  // Abbiate Guazzone" per un quartiere, "Vivere a Tradate" per un comune. Senza area si resta
  // sul titolo delle distanze, che è ciò che la sezione mostra in quel caso.
  const sectionTitle = areaView ? areaView.title : view!.title;
  const eyebrow = areaView?.eyebrow;

  return (
    <section aria-labelledby="vivere-in-zona-title" className="dt-row border-t border-line pb-4 pt-16">
      <div className="flex flex-col gap-2">
        {/* Occhiello: dice di cosa parla la sezione prima che il titolo dica DOVE. Non è un
            heading (non deve entrare nella struttura del documento): è l'eyebrow del sistema
            (rosso col trattino, 16 px), la stessa cellula che apre ogni capitolo. */}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id="vivere-in-zona-title" className="font-display text-d2">
          {sectionTitle}
        </h2>
        {/* Base d'origine ESPLICITA (mai "dall'immobile" per un centroide) + metodo (linea d'aria).
            Restano QUI solo quando la sezione è fatta di sole distanze: se sopra c'è la sintesi
            d'area, scendono sotto "Distanze utili" — è lì che dicono qualcosa. Sotto un titolo
            come «Vivere in Abbiate Guazzone», la riga «Distanze indicative dal centro di Tradate»
            si legge come una correzione dell'intestazione, non come il metodo di misura. */}
        {view && !areaView && (
          <>
            <p className="mt-4 text-body text-ink">{view.originLabel}</p>
            <p className="text-body text-graphite">
              {view.contextLabel} · {view.methodLabel}
            </p>
          </>
        )}
      </div>

      {/* SINTESI D'AREA. Sta PRIMA delle distanze di proposito: dice dove ci si trova, e le
          distanze rispondono a "quanto dista da qui" — una domanda che ha senso solo dopo.
          È testo reso dal server: sta nell'HTML iniziale, si legge senza JavaScript e non
          sposta il layout quando il bundle arriva. */}
      {areaView && areaView.intro && (
        <div className="mt-8 max-w-[60ch]">
          <p className="lead">{areaView.intro}</p>
          {areaView.sections.length > 0 && (
            <div className="mt-8 flex flex-col gap-6">
              {areaView.sections.map((sec, i) => (
                <div key={i}>
                  {/* Sottotitolo vero (resta nell'outline): la taglia di lista d4 in
                      Playfair, maiuscolo per regola globale — come i titoli di colonna. */}
                  <h3 className="font-display text-d4">{sec.heading}</h3>
                  <p className="mt-2 text-body text-ink">{sec.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view && (
      <>
      {/* Distanze utili: specifiche di QUESTO immobile, misurate dall'origine dichiarata sopra. */}
      {areaView && (
        <div className="mt-14 flex flex-col gap-1">
          <h3 className="font-display text-d3">{view.distancesTitle}</h3>
          <p className="mt-2 text-body text-ink">{view.originLabel}</p>
          <p className="text-body text-graphite">
            {view.contextLabel} · {view.methodLabel}
          </p>
        </div>
      )}
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

      {/* FONTI. I fatti verificati con il loro ente e la data di controllo.
          
          `<details>` e non un pannello a stato React, per tre ragioni che valgono più
          dell'uniformità: funziona senza JavaScript, è già accessibile da tastiera e agli screen
          reader senza aria-* scritti a mano, e soprattutto tiene il contenuto NELL'HTML — chi
          cerca la fonte la trova anche con la pagina non idratata.
          
          Chiuso di default quando c'è una narrativa: lì il testo è la sostanza e le fonti sono
          l'apparato. Senza narrativa i fatti SONO la sezione, e restano aperti. */}
      {areaView && (
        <details className={view ? "mt-14" : "mt-6"} open={!areaView.intro}>
          <summary className="cursor-pointer text-ui font-semibold uppercase tracking-[0.08em] text-ink marker:text-graphite">
            {areaView.sourcesSummary}
          </summary>
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
        </details>
      )}
    </section>
  );
}
