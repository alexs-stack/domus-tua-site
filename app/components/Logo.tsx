// Logo Domus Tua — evoluzione del concetto cuore/casa.
// Mark: tetto + cuore racchiusi in una forma pulita. Wordmark: Domus (grafite) + Tua (rosso),
// payoff IMMOBILIARE spaziato. Original-first: vedi app/lib/brand.ts + docs/logo-assets.md.
import { brand } from "../lib/brand";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* tetto */}
      <path
        d="M6 21.5 24 7l18 14.5"
        stroke="var(--color-graphite)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* corpo casa */}
      <path
        d="M9.5 19.5V37a2.5 2.5 0 0 0 2.5 2.5h24a2.5 2.5 0 0 0 2.5-2.5V19.5"
        stroke="var(--color-graphite)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* cuore */}
      <path
        d="M24 35.2c-3.4-2.3-6.2-4.6-6.2-7.7a3.3 3.3 0 0 1 6.2-1.6 3.3 3.3 0 0 1 6.2 1.6c0 3.1-2.8 5.4-6.2 7.7z"
        fill="var(--color-red)"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  withPayoff = true,
  light = false,
}: {
  className?: string;
  withPayoff?: boolean;
  light?: boolean;
}) {
  // Original-first: se configurato, usa l'asset ufficiale del cliente.
  if (brand.useOriginalLogo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={light ? brand.logoLight : brand.logo}
        alt="Domus Tua Immobiliare"
        width={brand.width}
        height={brand.height}
        className={className}
      />
    );
  }
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] font-semibold tracking-tight">
          <span style={{ color: light ? "#f3eee5" : "var(--color-graphite)" }}>Domus</span>
          <span style={{ color: "var(--color-red)" }}>Tua</span>
        </span>
        {withPayoff && (
          <span
            className="mt-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.42em]"
            style={{ color: light ? "rgba(243,238,229,0.6)" : "var(--color-stone)" }}
          >
            Immobiliare
          </span>
        )}
      </span>
    </span>
  );
}
