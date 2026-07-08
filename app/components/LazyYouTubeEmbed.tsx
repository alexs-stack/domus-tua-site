"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "./Icons";

type Props = {
  id: string;
  title: string;
  /** Poster curato (foto reale). Se assente, ripiega sulla thumbnail YouTube.
   *  Consigliato SEMPRE per i video verticali/Short: la thumb YouTube in 16:9 esce
   *  con bande nere ai lati (aspetto "cheap"); un poster pulito lo evita. */
  poster?: string;
};

// Facciata leggera per YouTube: mostra solo il poster finché l'utente non clicca.
// L'iframe (e quindi tutto il peso di YouTube) viene caricato SOLO dopo il click,
// mai al mount. Questo tiene la sezione veloce anche con più player nella pagina.
export default function LazyYouTubeEmbed({ id, title, poster }: Props) {
  const [active, setActive] = useState(false);

  // Poster curato > thumbnail YouTube (i.ytimg.com è abilitato nei remotePatterns).
  const thumb = poster ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const embed = `https://www.youtube.com/embed/${id}?autoplay=1`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[1.5rem] border border-line bg-ink shadow-[var(--shadow-card)]">
      {active ? (
        <iframe
          src={embed}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`Riproduci il video: ${title}`}
          className="group absolute inset-0 block h-full w-full cursor-pointer"
        >
          <Image
            src={thumb}
            alt={title}
            fill
            sizes="(max-width:768px) 100vw, (max-width:1240px) 60vw, 720px"
            className="photo-warm object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
          {/* Velo caldo per profondità + leggibilità del play */}
          <span className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/10 to-ink/5" />
          {/* Play "premium": vetro morbido, anello sottile, ombra calda; triangolo otticamente centrato */}
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-red shadow-[0_20px_50px_-15px_rgba(26,24,22,0.65)] ring-1 ring-ink/5 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-white sm:h-[4.75rem] sm:w-[4.75rem]">
            <Play className="h-6 w-6 translate-x-0.5 sm:h-7 sm:w-7" />
          </span>
        </button>
      )}
    </div>
  );
}
