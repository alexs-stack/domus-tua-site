"use client";

// Logo Domus Tua — ORIGINAL-FIRST.
// Default: rende il logo ufficiale del cliente (brand.logo / brand.logoLight).
// Se il file manca, in dev/preview mostra un placeholder onesto "Logo ufficiale mancante"
// (mai un logo finto). `LogoMark` resta come fallback SOLO interno di sviluppo, attivabile
// con brand.useOriginalLogo=false. Vedi app/lib/brand.ts + docs/logo-assets.md.
import { useEffect, useState } from "react";
import { brand, showLogoDevPlaceholder } from "../lib/brand";

// Fallback interno di sviluppo (NON default, NON per la presentazione cliente):
// evoluzione del concetto casa + cuore. Da usare solo con useOriginalLogo=false.
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 21.5 24 7l18 14.5"
        stroke="var(--color-graphite)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 19.5V37a2.5 2.5 0 0 0 2.5 2.5h24a2.5 2.5 0 0 0 2.5-2.5V19.5"
        stroke="var(--color-graphite)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 35.2c-3.4-2.3-6.2-4.6-6.2-7.7a3.3 3.3 0 0 1 6.2-1.6 3.3 3.3 0 0 1 6.2 1.6c0 3.1-2.8 5.4-6.2 7.7z"
        fill="var(--color-red)"
      />
    </svg>
  );
}

// Fallback dev/preview quando il file ufficiale non è ancora stato depositato.
// Placeholder chiaro e volutamente "in attesa asset", non un logo alternativo.
function LogoMissing({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${
        light
          ? "border-cream/40 text-cream/70"
          : "border-red/50 text-red"
      }`}
      style={{ minWidth: brand.width * 0.66, height: brand.height }}
      title="Deposita /public/logo-domustua-original.svg — vedi docs/logo-assets.md"
      role="img"
      aria-label="Domus Tua Immobiliare (logo ufficiale mancante)"
    >
      <span aria-hidden className="text-sm">⌂</span>
      Logo ufficiale mancante
    </span>
  );
}

// Wordmark testuale minimale = ripiego di sola produzione se il file manca (mostra il NOME,
// non un mark ridisegnato). In dev/preview vince invece LogoMissing (onesto per la demo).
function TextWordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="font-display text-[1.4rem] font-semibold tracking-tight" aria-label="Domus Tua Immobiliare">
      <span style={{ color: light ? "#f3eee5" : "var(--color-graphite)" }}>Domus</span>
      <span style={{ color: "var(--color-red)" }}>Tua</span>
    </span>
  );
}

export function Logo({
  className = "",
  light = false,
}: {
  className?: string;
  withPayoff?: boolean;
  light?: boolean;
}) {
  const src = light ? brand.logoLight : brand.logo;
  // Probing deterministico dell'asset: evita il flash del broken-image e rende lo stato
  // "logo mancante" affidabile (non dipende dal timing di onError).
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    if (!brand.useOriginalLogo) return;
    let alive = true;
    const probe = new window.Image();
    /* eslint-disable react-hooks/set-state-in-effect */
    probe.onload = () => alive && setStatus("ok");
    probe.onerror = () => alive && setStatus("missing");
    probe.src = src;
    // Se già in cache (complete) risolvi subito.
    if (probe.complete && probe.naturalWidth > 0) setStatus("ok");
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      alive = false;
    };
  }, [src]);

  // Fallback interno di sviluppo esplicito (mark + wordmark ricostruiti).
  if (!brand.useOriginalLogo) {
    return <LogoMarkWordmark className={className} light={light} />;
  }

  if (status === "missing") {
    return showLogoDevPlaceholder ? <LogoMissing light={light} /> : <TextWordmark light={light} />;
  }

  if (status === "loading") {
    // Segnaposto invisibile che riserva lo spazio (nessun broken-image, nessun layout shift).
    return <span aria-hidden style={{ display: "inline-block", width: brand.width, height: brand.height }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Domus Tua Immobiliare"
      width={brand.width}
      height={brand.height}
      className={className}
    />
  );
}

// Il mark + wordmark storico, incapsulato per il solo uso di sviluppo.
function LogoMarkWordmark({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] font-semibold tracking-tight">
          <span style={{ color: light ? "#f3eee5" : "var(--color-graphite)" }}>Domus</span>
          <span style={{ color: "var(--color-red)" }}>Tua</span>
        </span>
        <span
          className="mt-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.42em]"
          style={{ color: light ? "rgba(243,238,229,0.6)" : "var(--color-stone)" }}
        >
          Immobiliare
        </span>
      </span>
    </span>
  );
}
