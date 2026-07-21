"use client";

// Mappa "Case in vendita" — a livello di COMUNE (il feed non ha coordinate; niente posizioni
// esatte delle case = privacy-safe). Nessuna dipendenza esterna, nessun tile di terze parti:
// i pin sono posizionati alle loro coordinate geografiche RELATIVE reali (normalizzate nel
// riquadro). I comuni senza coordinate note finiscono in "Altre zone" (mai persi, mai inventati).
import { useMemo } from "react";
import { SegnoDomus } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import type { TownGroup } from "../lib/geo/comuni";

const copy = {
  it: { title: "Dove sono le case in vendita", subtitle: "Comuni con immobili disponibili — clicca per filtrare.", others: "Altre zone", one: "immobile", many: "immobili", aria: (n: number, t: string) => `Vedi ${n} ${n === 1 ? "immobile" : "immobili"} a ${t}` },
  en: { title: "Where the homes for sale are", subtitle: "Towns with available properties — click to filter.", others: "Other areas", one: "home", many: "homes", aria: (n: number, t: string) => `See ${n} ${n === 1 ? "home" : "homes"} in ${t}` },
  fr: { title: "Où se trouvent les biens à vendre", subtitle: "Communes avec des biens disponibles — cliquez pour filtrer.", others: "Autres secteurs", one: "bien", many: "biens", aria: (n: number, t: string) => `Voir ${n} ${n === 1 ? "bien" : "biens"} à ${t}` },
  de: { title: "Wo die Immobilien zum Verkauf sind", subtitle: "Orte mit verfügbaren Immobilien — zum Filtern klicken.", others: "Weitere Gebiete", one: "Immobilie", many: "Immobilien", aria: (n: number, t: string) => `${n} ${n === 1 ? "Immobilie" : "Immobilien"} in ${t} ansehen` },
  es: { title: "Dónde están las casas en venta", subtitle: "Municipios con inmuebles disponibles — haz clic para filtrar.", others: "Otras zonas", one: "inmueble", many: "inmuebles", aria: (n: number, t: string) => `Ver ${n} ${n === 1 ? "inmueble" : "inmuebles"} en ${t}` },
};

const PAD = 12; // % di margine interno per non incollare i pin ai bordi

export default function PropertyMap({
  groups,
  activeKey,
  onSelect,
}: {
  groups: TownGroup[];
  activeKey?: string;
  onSelect: (key: string) => void;
}) {
  const { locale } = useLocale();
  const c = copy[locale];

  const mapped = useMemo(() => groups.filter((g) => g.coords), [groups]);
  const others = useMemo(() => groups.filter((g) => !g.coords), [groups]);
  const maxCount = useMemo(() => Math.max(1, ...groups.map((g) => g.count)), [groups]);

  // Posizione normalizzata (x%, y%) dalle coordinate reali; lat invertita (nord = alto).
  const positioned = useMemo(() => {
    if (mapped.length === 0) return [];
    const lats = mapped.map((g) => g.coords!.lat);
    const lngs = mapped.map((g) => g.coords!.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const spanLat = maxLat - minLat, spanLng = maxLng - minLng;
    return mapped.map((g) => {
      const x = spanLng < 1e-6 ? 50 : PAD + ((g.coords!.lng - minLng) / spanLng) * (100 - 2 * PAD);
      const y = spanLat < 1e-6 ? 50 : PAD + ((maxLat - g.coords!.lat) / spanLat) * (100 - 2 * PAD);
      return { g, x, y };
    });
  }, [mapped]);

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">{c.title}</h3>
        <p className="mt-1 text-sm text-stone">{c.subtitle}</p>
      </div>

      {/* Riquadro mappa — sfondo di marca, nessun tile esterno. Altezza fissa → niente CLS. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-line bg-cream sm:aspect-[16/9]">
        {/* Texture leggera + motivo Segno Domus in filigrana */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 30%, rgba(150,30,26,0.05), transparent 45%), radial-gradient(circle at 75% 70%, rgba(26,24,22,0.04), transparent 45%)",
          }}
        />
        <span className="pointer-events-none absolute right-5 top-5 opacity-[0.06]" aria-hidden>
          <SegnoDomus className="h-16 w-40" embrace={false} />
        </span>

        {/* Pin dei comuni, posizionati alle coordinate relative reali */}
        {positioned.map(({ g, x, y }) => {
          const active = g.key === activeKey;
          const scale = 0.7 + 0.6 * (g.count / maxCount); // pin più grande = più immobili
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => onSelect(g.key)}
              aria-label={c.aria(g.count, g.town)}
              className="group absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center focus-visible:outline-none"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span
                className={`flex items-center justify-center rounded-full border-2 border-white font-display text-[0.7rem] font-semibold tabular-nums shadow-[0_6px_16px_-6px_rgba(150,30,26,0.7)] transition-all duration-300 group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-red group-focus-visible:ring-offset-2 ${
                  active ? "bg-red-dark text-white ring-2 ring-red ring-offset-2" : "bg-red text-white"
                }`}
                style={{ height: `${1.6 * scale}rem`, width: `${1.6 * scale}rem` }}
              >
                {g.count}
              </span>
              {/* codina del pin */}
              <span className={`h-2 w-[2px] ${active ? "bg-red-dark" : "bg-red"}`} aria-hidden />
              <span className="mt-1 whitespace-nowrap rounded-full bg-paper/90 px-2 py-0.5 text-[0.7rem] font-medium text-ink shadow-sm backdrop-blur-sm">
                {g.town}
              </span>
            </button>
          );
        })}

        {mapped.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-stone">
            {c.subtitle}
          </div>
        )}
      </div>

      {/* Comuni senza coordinate note: non li perdiamo, li elenchiamo come chip cliccabili. */}
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
