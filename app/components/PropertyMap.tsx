"use client";

// Mappa "Case in vendita" — mappa REALE (OpenStreetMap via Leaflet) con un marker per COMUNE.
// Il feed non ha coordinate del singolo immobile (indirizzo spesso omesso per privacy): i pin
// sono a livello di comune (mai la casa esatta). Leaflet è caricato dinamicamente lato client
// (accede a window) e i tile OSM danno la geografia reale — così la mappa non è mai "vuota".
// I comuni non geolocalizzati finiscono in "Altre zone" (mai persi).
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { SegnoDomus } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import type { TownGroup } from "../lib/geo/comuni";

const copy = {
  it: { eyebrow: "La mappa", title: "Dove sono le case in vendita", subtitle: "Comuni con immobili disponibili — tocca un comune per vedere le case.", legend: "Il numero indica gli immobili disponibili nel comune", others: "Altre zone", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "immobile" : "immobili"}` },
  en: { eyebrow: "The map", title: "Where the homes for sale are", subtitle: "Towns with available properties — tap a town to see the homes.", legend: "The number shows available homes in the town", others: "Other areas", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "home" : "homes"}` },
  fr: { eyebrow: "La carte", title: "Où se trouvent les biens à vendre", subtitle: "Communes avec des biens disponibles — touchez une commune pour voir les biens.", legend: "Le nombre indique les biens disponibles dans la commune", others: "Autres secteurs", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "bien" : "biens"}` },
  de: { eyebrow: "Die Karte", title: "Wo die Immobilien zum Verkauf sind", subtitle: "Orte mit verfügbaren Immobilien — Ort antippen, um die Immobilien zu sehen.", legend: "Die Zahl zeigt die verfügbaren Immobilien im Ort", others: "Weitere Gebiete", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "Immobilie" : "Immobilien"}` },
  es: { eyebrow: "El mapa", title: "Dónde están las casas en venta", subtitle: "Municipios con inmuebles disponibles — toca un municipio para ver las casas.", legend: "El número indica los inmuebles disponibles en el municipio", others: "Otras zonas", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "inmueble" : "inmuebles"}` },
};

export default function PropertyMap({
  groups,
  onSelect,
}: {
  groups: TownGroup[];
  activeKey?: string;
  onSelect: (key: string) => void;
}) {
  const { locale } = useLocale();
  const c = copy[locale];
  const containerRef = useRef<HTMLDivElement | null>(null);
  // onSelect può cambiare a ogni render: teniamolo in un ref così l'effetto mappa non si
  // re-inizializza. L'aggiornamento del ref avviene in un effect (non durante il render).
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const others = groups.filter((g) => !g.coords);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;
    let timer = 0;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const mapped = groups.filter((g) => g.coords);
      const maxCount = Math.max(1, ...mapped.map((g) => g.count));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      map = L.map(containerRef.current, {
        scrollWheelZoom: false, // niente hijack dello scroll di pagina; zoom con i controlli
        zoomControl: true,
        attributionControl: true,
        // Rispetta prefers-reduced-motion: niente animazioni di zoom/fade.
        fadeAnimation: !reduce,
        zoomAnimation: !reduce,
        markerZoomAnimation: !reduce,
      });

      // Base CARTO Positron: minimalista e chiara (pochi POI colorati) → perfetta come tela
      // per i marker rossi; la scaldiamo verso il crema via CSS (.dt-map).
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const markers: import("leaflet").Marker[] = [];
      for (const g of mapped) {
        const size = 24 + Math.round(14 * (g.count / maxCount));
        const fs = Math.max(11, Math.round(size * 0.42));
        const icon = L.divIcon({
          className: "dt-marker",
          html: `<div class="dt-marker__badge" style="width:${size}px;height:${size}px;font-size:${fs}px">${g.count}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const m = L.marker([g.coords!.lat, g.coords!.lng], { icon, title: c.tip(g.town, g.count) }).addTo(map);
        // Tooltip all'hover (comune · N): il nome del comune è già stampato dalla base CARTO,
        // quindi niente etichette permanenti che si accavallano nei comuni vicini.
        m.bindTooltip(c.tip(g.town, g.count), { className: "dt-tip", direction: "top", offset: [0, -size / 2 - 2], opacity: 1 });
        m.on("click", () => onSelectRef.current(g.key));
        markers.push(m);
      }

      const fit = () => {
        if (!map) return;
        if (markers.length > 0) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.32), { maxZoom: 12, padding: [24, 40] });
        else map.setView([45.708, 8.906], 11); // Tradate come vista di default
      };
      fit();
      // Il contenitore può essere misurato a 0 al primo tick (mappa appena montata): ricalcoliamo
      // le dimensioni dopo che il layout si è assestato (rAF + un timeout di sicurezza), senza
      // ResizeObserver (evita loop di reflow), così i tile riempiono la mappa.
      const recalc = () => {
        if (cancelled || !map) return;
        map.invalidateSize();
        fit();
      };
      requestAnimationFrame(recalc);
      timer = window.setTimeout(recalc, 300);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (map) map.remove();
    };
  }, [groups, c]);

  return (
    <div>
      {/* Intestazione editoriale */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow gap-2.5">
            <SegnoDomus className="h-3 w-8" embrace={false} />
            {c.eyebrow}
          </span>
          <h3 className="mt-3 font-display text-2xl font-medium leading-tight tracking-tight text-ink sm:text-[1.9rem]">
            {c.title}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone">{c.subtitle}</p>
        </div>
        {/* Legenda */}
        <div className="flex shrink-0 items-center gap-2.5 rounded-full border border-line bg-paper px-4 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red text-[0.7rem] font-semibold text-white tabular-nums">
            3
          </span>
          <span className="max-w-[13rem] text-[0.76rem] leading-snug text-stone">{c.legend}</span>
        </div>
      </div>

      {/* Contenitore mappa: cornice premium, altezza fissa → niente CLS. La geografia (e i nomi
          dei comuni) arriva dai tile OSM, desaturati e caldi via CSS (.dt-map) per restare on-brand. */}
      <div className="relative overflow-hidden rounded-[1.9rem] border border-line bg-cream p-1.5 shadow-[var(--shadow-card)]">
        <div
          ref={containerRef}
          className="dt-map z-0 h-[440px] w-full overflow-hidden rounded-[1.5rem] sm:h-[560px]"
        />
        {/* Firma di marca (Segno Domus) in filigrana sull'angolo, sopra la mappa. */}
        <span className="pointer-events-none absolute bottom-4 left-5 z-[400] opacity-25" aria-hidden>
          <SegnoDomus className="h-4 w-11 text-red" embrace={false} />
        </span>
      </div>

      {/* Comuni senza coordinate note: elencati come chip cliccabili (mai persi, mai inventati). */}
      {others.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-wide text-stone">{c.others}</p>
          <div className="flex flex-wrap gap-2">
            {others.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => onSelect(g.key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[0.8rem] text-graphite transition-colors duration-300 hover:border-red/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                {g.town}
                <span className="tnum rounded-full bg-red-soft px-1.5 text-[0.7rem] font-semibold text-red-dark">{g.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
