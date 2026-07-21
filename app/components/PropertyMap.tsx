"use client";

// Mappa "Case in vendita" — mappa REALE (OpenStreetMap via Leaflet) con un marker per COMUNE.
// Il feed non ha coordinate del singolo immobile (indirizzo spesso omesso per privacy): i pin
// sono a livello di comune (mai la casa esatta). Leaflet è caricato dinamicamente lato client
// (accede a window) e i tile OSM danno la geografia reale — così la mappa non è mai "vuota".
// I comuni non geolocalizzati finiscono in "Altre zone" (mai persi).
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { useLocale } from "./i18n/LocaleProvider";
import type { TownGroup } from "../lib/geo/comuni";

const copy = {
  it: { title: "Dove sono le case in vendita", subtitle: "Comuni con immobili disponibili — clicca un pin per filtrare.", others: "Altre zone", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "immobile" : "immobili"}` },
  en: { title: "Where the homes for sale are", subtitle: "Towns with available properties — click a pin to filter.", others: "Other areas", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "home" : "homes"}` },
  fr: { title: "Où se trouvent les biens à vendre", subtitle: "Communes avec des biens disponibles — cliquez un point pour filtrer.", others: "Autres secteurs", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "bien" : "biens"}` },
  de: { title: "Wo die Immobilien zum Verkauf sind", subtitle: "Orte mit verfügbaren Immobilien — Pin klicken zum Filtern.", others: "Weitere Gebiete", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "Immobilie" : "Immobilien"}` },
  es: { title: "Dónde están las casas en venta", subtitle: "Municipios con inmuebles disponibles — haz clic en un pin para filtrar.", others: "Otras zonas", tip: (t: string, n: number) => `${t} · ${n} ${n === 1 ? "inmueble" : "inmuebles"}` },
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

      map = L.map(containerRef.current, {
        scrollWheelZoom: false, // niente hijack dello scroll di pagina; zoom con i controlli
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const markers: import("leaflet").Marker[] = [];
      for (const g of mapped) {
        const size = 26 + Math.round(16 * (g.count / maxCount));
        const icon = L.divIcon({
          className: "",
          html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:#c1272d;color:#fff;border:2px solid #fff;box-shadow:0 6px 16px -4px rgba(150,30,26,.7);font-weight:600;font-size:12px;line-height:1;font-family:var(--font-jakarta,system-ui,sans-serif)">${g.count}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const m = L.marker([g.coords!.lat, g.coords!.lng], { icon, title: c.tip(g.town, g.count) }).addTo(map);
        m.bindTooltip(c.tip(g.town, g.count), { direction: "top", offset: [0, -size / 2] });
        m.on("click", () => onSelectRef.current(g.key));
        markers.push(m);
      }

      const fit = () => {
        if (!map) return;
        if (markers.length > 0) map.fitBounds(L.featureGroup(markers).getBounds().pad(0.25), { maxZoom: 13 });
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
      <div className="mb-4">
        <h3 className="font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">{c.title}</h3>
        <p className="mt-1 text-sm text-stone">{c.subtitle}</p>
      </div>

      {/* Contenitore mappa: altezza fissa → niente CLS. La geografia arriva dai tile OSM. */}
      <div
        ref={containerRef}
        className="z-0 h-[420px] w-full overflow-hidden rounded-[1.75rem] border border-line bg-cream sm:h-[520px]"
      />

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
