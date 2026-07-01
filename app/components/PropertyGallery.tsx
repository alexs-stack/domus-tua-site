"use client";

import Image from "next/image";
import { useState } from "react";

export default function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="rounded-[2rem] border border-line bg-cream p-2">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[calc(2rem-0.5rem)]">
        {images.map((img, i) => (
          <Image
            key={img + i}
            src={img}
            alt={active === i ? `${title} — immagine ${i + 1}` : ""}
            fill
            priority={i === active}
            sizes="(max-width: 1024px) 100vw, 760px"
            aria-hidden={active !== i}
            className={`object-cover transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              active === i ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={img + i}
              onClick={() => setActive(i)}
              aria-label={`Vedi immagine ${i + 1}`}
              aria-current={active === i}
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl border transition-all duration-300 ${
                active === i ? "border-red ring-2 ring-red/30" : "border-line hover:border-red/40"
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                sizes="180px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
