// Firma della fondatrice — tocco umano "founder-led".
//
// ⚠️ NON viene mostrata finché il cliente non fornisce quella VERA (`brand.signature`).
//
// Prima qui c'era un tracciato calligrafico generico con `aria-label="Firma di Raffaela
// Rizza"`, mostrato accanto al suo nome e animato come se si stesse firmando: una firma
// inventata attribuita per nome a una persona reale. È lo stesso principio già scritto per
// il logo — "mai un asset finto spacciato per l'originale" — con l'aggravante che qui
// riguarda l'identità di qualcuno.
//
// Il tracciato resta come SEGNAPOSTO DI SVILUPPO, mostrato solo quando `preview` è esplicito
// (per lavorare sul layout) e comunque senza dichiararsi firma di nessuno.

import { brand } from "../lib/brand";

/** true se la firma reale è disponibile: i chiamanti possono saltare il blocco che la ospita. */
export const hasRealSignature = brand.signature.trim().length > 0;

export default function Signature({
  className = "h-8 w-auto",
  light = false,
  preview = false,
}: {
  className?: string;
  light?: boolean;
  /** Mostra il tracciato segnaposto per lavorare sul layout. Mai in pagina. */
  preview?: boolean;
}) {
  if (hasRealSignature) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={brand.signature} alt="Firma di Raffaela Rizza" className={className} />;
  }
  if (!preview) return null;

  const stroke = light ? "var(--color-cream)" : "var(--color-red)";
  return (
    <svg
      className={className}
      viewBox="0 0 224 64"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 48 C 10 22 18 14 20 24 C 22 36 14 48 20 46 C 32 42 30 22 40 26 C 47 29 40 47 48 45 C 58 43 60 27 68 31 C 74 34 66 47 74 45 C 86 41 88 26 96 31 C 101 35 96 46 104 44 C 116 41 118 24 130 29 C 138 33 128 47 140 45 C 154 42 156 30 170 34 C 180 37 174 47 184 43 C 194 39 196 30 206 34"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 56 C 74 62 152 60 214 51"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
