"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function ActiveImage({ src, alt }: { src: string; alt: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      sizes="(max-width: 1024px) 100vw, 760px"
      className={`object-cover transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

export default function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="rounded-[2rem] border border-line bg-cream p-2">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[calc(2rem-0.5rem)]">
        {images.length > 0 && (
          <ActiveImage
            key={active}
            src={images[active]}
            alt={`${title} — immagine ${active + 1}`}
          />
        )}
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
                loading={active === i ? "eager" : "lazy"}
                sizes="(max-width: 1024px) 25vw, 180px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
