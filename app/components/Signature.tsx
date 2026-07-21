// Firma della fondatrice — tocco umano "founder-led".
//
// ⚠️ PLACEHOLDER: questo è un tracciato calligrafico generico, NON la firma reale.
// Appena il cliente fornisce la firma vera (SVG o PNG trasparente), sostituire il <path>
// qui sotto (o passare a <img src="/images/reali/firma-raffaela.svg">). Mantiene le stesse
// proporzioni. Colore: rosso di marca su chiaro, cream su scuro (prop `light`).

export default function Signature({
  className = "h-8 w-auto",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const stroke = light ? "var(--color-cream)" : "var(--color-red)";
  return (
    <svg
      className={className}
      viewBox="0 0 224 64"
      fill="none"
      role="img"
      aria-label="Firma di Raffaela Rizza"
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
