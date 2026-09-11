"use client";

import { useState } from "react";
import Image from "next/image";
import YoutubeThumb from "./YoutubeThumb";
import { Play } from "./Icons";
import { useVideoPlayLabel } from "./VideoLightbox";

type Props = {
  /** Proporzione del riquadro: i video del canale girati col telefono sono verticali. */
  aspect?: "video" | "portrait";
  id: string;
  title: string;
  /** Poster curato (foto reale). Se assente, ripiega sulla thumbnail YouTube.
   *  Consigliato SEMPRE per i video verticali/Short: la thumb YouTube in 16:9 esce
   *  con bande nere ai lati (aspetto "cheap"); un poster pulito lo evita. */
  poster?: string;
  /** Quanto e' larga la scatola, nel formato di `sizes`. Il valore di partenza
   *  («100vw») vale solo per la banda a tutta larghezza: da quando il video
   *  puo' stare in mezza colonna (`.dt-media-half`), chi lo mette dichiara la
   *  propria misura, e ricordando che con `object-cover` un fotogramma piu'
   *  largo della scatola viene reso piu' largo della scatola. */
  posterSizes?: string;
};

// Facciata leggera per YouTube: mostra solo il poster finché l'utente non clicca.
// L'iframe (e quindi tutto il peso di YouTube) viene caricato SOLO dopo il click,
// mai al mount. Questo tiene la sezione veloce anche con più player nella pagina.
//
// PRIVACY. Doppia protezione: (1) click-to-load — nessuna richiesta a YouTube prima che
// l'utente prema play, quindi il video non parte da solo e non traccia chi non lo guarda;
// (2) dominio "youtube-nocookie.com" (privacy-enhanced di YouTube): niente cookie di
// tracciamento finché non c'è interazione col player. Comportamento documentato in
// docs/legal-launch-inventory.md.
export default function LazyYouTubeEmbed({
  id,
  title,
  poster,
  aspect = "video",
  posterSizes: posterSizesProp,
}: Props) {
  const [active, setActive] = useState(false);
  // L etichetta era italiana fissa («Riproduci il video: …») su un sito in cinque lingue:
  // chi naviga in tedesco con uno screen reader si sentiva annunciare una frase italiana.
  // La formula sta accanto al dialog del video, cosi le due superfici che riproducono un
  // filmato lo annunciano allo stesso modo.
  const playLabel = useVideoPlayLabel();

  const embed = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
  const posterSizes =
    posterSizesProp ?? (aspect === "portrait" ? "(max-width:1024px) 100vw, 420px" : "100vw");
  const posterClassName =
    "photo-warm object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105";

  return (
    <div className={`relative w-full overflow-hidden bg-cream-deep ${aspect === "portrait" ? "aspect-[9/16]" : "aspect-video"}`}>
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
          aria-label={playLabel(title)}
          className="group absolute inset-0 block h-full w-full cursor-pointer"
        >
          {poster ? (
            /* Poster MUTO: il bottone che lo contiene ha gia il suo nome accessibile
               (aria-label), e ripetere il titolo nell alt lo fa annunciare due volte. */
            <Image src={poster} alt="" fill sizes={posterSizes} className={posterClassName} />
          ) : (
            <YoutubeThumb id={id} alt="" sizes={posterSizes} className={posterClassName} />
          )}
          {/* Play: cerchio rosso 96 px, l'unica curva ammessa (rivista bianca,
              2026-09-10). Niente velo sopra la foto, niente ombra né anello.
              Sul telefono 56: su una miniatura alta 189 px il cerchio da 96
              ne copriva il 51% — cioe' i volti — e il riferimento ne usa 55. */}
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 group-hover:scale-105 md:h-24 md:w-24">
            <Play className="h-5 w-5 translate-x-0.5 md:h-8 md:w-8" />
          </span>
        </button>
      )}
    </div>
  );
}
