// Firma della fondatrice — trattamento tipografico del NOME (non una finta calligrafia).
//
// Scelta di integrità: finché non arriva la firma reale (SVG/PNG trasparente), NON mostriamo
// un tracciato calligrafico inventato — sarebbe un segnaposto spacciato per firma. Mostriamo
// invece il nome "Raffaela Rizza" nel serif di marca (Fraunces, corsivo): elegante, onesto,
// e sostituibile con l'asset reale senza cambiare i chiamanti.
//
// Per passare alla firma vera: sostituire il contenuto con
//   <img src="/images/reali/firma-raffaela.svg" alt="Raffaela Rizza" ... />
// mantenendo la stessa API (className, light).

export default function Signature({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const color = light ? "text-cream" : "text-red";
  return (
    <span
      className={`font-display text-xl italic leading-none tracking-tight ${color} ${className}`}
      aria-label="Raffaela Rizza"
    >
      Raffaela Rizza
    </span>
  );
}
