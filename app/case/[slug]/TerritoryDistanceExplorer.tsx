"use client";

// Esploratore SCHEMATICO di distanze (Prompt 12) — caricato in modo lazy SOLO dopo interazione.
//
// Disegna anelli di distanza e punti collocati per distanza (raggio) e categoria (angolo di settore).
// PRIVACY per costruzione: non riceve né conosce coordinate; nessuna chiamata di rete, nessun tile di
// mappa. Le direzioni sono illustrative, non reali. L'SVG è decorativo (role="img" con descrizione
// sintetica per screen reader); il dettaglio autorevole resta nelle card sopra. Rispetta reduced-motion.

import { buildExplorerModel } from "../../lib/territory/explorerModel";
import type { TerritoryExplorerStrings, TerritoryLocale, TerritoryViewCategory } from "../../lib/territory/view";
import type { TerritoryPoiCategory } from "../../lib/territory/categories";

/** Accenti on-brand (rosso/grigi caldi): la categoria è SEMPRE ridondata dal testo, mai solo colore. */
const CATEGORY_COLOR: Record<TerritoryPoiCategory, string> = {
  "railway-station": "var(--color-ink)",
  pharmacy: "var(--color-red)",
  supermarket: "var(--color-graphite)",
  school: "var(--color-red-dark)",
  park: "#8a8175",
};

export default function TerritoryDistanceExplorer({
  categories,
  strings,
  locale,
}: {
  categories: TerritoryViewCategory[];
  strings: TerritoryExplorerStrings;
  locale: TerritoryLocale;
}) {
  const model = buildExplorerModel(categories, locale);

  if (model.points.length === 0) {
    return (
      <p className="mt-4 text-sm text-graphite" role="status">
        {strings.empty}
      </p>
    );
  }

  const distances = model.points.map((p) => p.distanceLabel);
  const summary = `${strings.ariaTitle}: ${model.points.length} · ${strings.centerLabel} · ${distances[0]}–${distances[distances.length - 1]}`;

  return (
    <figure className="mt-4">
      <div className="mx-auto max-w-[420px]">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={summary}
          className="h-auto w-full motion-safe:transition-opacity"
        >
          {/* Anelli di distanza */}
          {model.rings.map((ring) => (
            <g key={ring.distanceMeters}>
              <circle
                cx={50}
                cy={50}
                r={ring.radiusPct}
                fill="none"
                stroke="var(--color-line)"
                strokeWidth={0.4}
              />
              <text
                x={50}
                y={50 - ring.radiusPct - 0.8}
                textAnchor="middle"
                fontSize={2.6}
                fill="var(--color-graphite)"
              >
                {ring.label}
              </text>
            </g>
          ))}

          {/* Spokes + punti */}
          {model.points.map((p) => (
            <g key={p.key}>
              <line x1={50} y1={50} x2={p.xPct} y2={p.yPct} stroke="var(--color-line)" strokeWidth={0.25} />
              <circle cx={p.xPct} cy={p.yPct} r={1.8} fill={CATEGORY_COLOR[p.category]}>
                <title>{`${p.categoryLabel}: ${p.name} — ${p.distanceLabel}`}</title>
              </circle>
            </g>
          ))}

          {/* Centro (base d'origine) */}
          <circle cx={50} cy={50} r={1.4} fill="var(--color-red)" />
          <text x={50} y={54.5} textAnchor="middle" fontSize={2.8} fontWeight={600} fill="var(--color-ink)">
            {strings.centerLabel}
          </text>
        </svg>
      </div>
      <figcaption className="mt-3 text-center text-xs text-graphite">{strings.caption}</figcaption>
    </figure>
  );
}
