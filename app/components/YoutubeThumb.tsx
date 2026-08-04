"use client";

// Copertina YouTube ad alta risoluzione con ripiego automatico.
//
// maxresdefault.jpg (1280×720) esiste solo per i video caricati in HD; per i
// più vecchi/verticali YouTube risponde 404. hqdefault.jpg (480×360) esiste
// sempre ma è visibilmente sgranata quando ingrandita nella griglia del muro
// delle voci. onError qui fa il downgrade silenzioso al primo fallimento.
import { useState } from "react";
import Image from "next/image";

type Props = {
  id: string;
  alt: string;
  sizes: string;
  className?: string;
};

export default function YoutubeThumb({ id, alt, sizes, className }: Props) {
  const [maxresFailed, setMaxresFailed] = useState(false);
  const src = maxresFailed
    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    : `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

  return (
    <Image
      key={src}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setMaxresFailed(true)}
    />
  );
}
