"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "./Icons";

type Props = {
  id: string;
  title: string;
};

// Facciata leggera per YouTube: mostra solo la thumbnail finché l'utente non clicca.
// L'iframe (e quindi tutto il peso di YouTube) viene caricato SOLO dopo il click,
// mai al mount. Questo tiene la sezione veloce anche con più player nella pagina.
export default function LazyYouTubeEmbed({ id, title }: Props) {
  const [active, setActive] = useState(false);

  // La thumbnail arriva da i.ytimg.com (host abilitato nei remotePatterns di next.config):
  // next/image la ottimizza (avif/webp) con fill + sizes.
  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const embed = `https://www.youtube.com/embed/${id}?autoplay=1`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[1.5rem] border border-line bg-ink">
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
            className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110">
            <Play className="h-7 w-7" />
          </span>
        </button>
      )}
    </div>
  );
}
