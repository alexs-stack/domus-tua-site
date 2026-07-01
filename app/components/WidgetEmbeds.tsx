"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Inietta un widget esterno via <script src> (es. Trustindex).
 * Il widget popola il contenitore. Mostra uno stato di caricamento.
 */
export function ScriptWidget({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src || injected.current) return;
    // Iniezione singola, senza clear in cleanup: così il widget (es. Trustindex) non
    // viene rimosso dal doppio-mount di React StrictMode in sviluppo.
    injected.current = true;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    el.appendChild(s);
  }, [src]);

  return <div ref={ref} className="min-h-[120px]" />;
}

/**
 * Feed Instagram via iframe (LightWidget / Behold / EmbedSocial).
 * Iframe responsive con altezza fissa adattabile.
 */
export function IframeWidget({
  src,
  title,
  ratio = 1,
}: {
  src: string;
  title: string;
  ratio?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full overflow-hidden rounded-[1.5rem]" style={{ aspectRatio: ratio }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-cream-deep text-sm text-stone">
          Carico il feed…
        </div>
      )}
      <iframe
        src={src}
        title={title}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="h-full w-full"
        style={{ border: 0 }}
        scrolling="no"
      />
    </div>
  );
}
