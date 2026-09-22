"use client";

// StoryVideo — la storia di Roberta come video VERO, non più la facciata di YouTube (A60 di
// Alberto, 22 set. 2026, sera: «ho scaricato il video di Villa di Roberta, venduta al primo Open
// Domus, mettilo al posto della preview youtube, con la logica di audio che si attiva in
// automatico, e quando esci dalla sezione scrollando la pagina, si disattiva»).
//
// Com'è fatto: la scatola è il modulo colonna 9:16 del sito (chi lo monta passa la classe); il
// <video> nasce muto, playsInline e senza precarico, col poster del primo fotogramma. Il gate,
// le sorgenti (hd 1080 / sd 720, WebM o MP4) e il suono sono quelli di useAmbientVideo (A44, il
// drone del Congedo): in vista prova a suonare NON muto; se il browser lo nega parte muto e si
// accende al primo gesto della pagina; fuori vista si ferma. Qui in più ci sono i due comandi
// che un video con la voce deve avere (WCAG 1.4.2): pausa/riproduci e audio sì/no, cerchi rossi
// da 56 px come il play delle facciate (l'unica curva ammessa). Chi toglie l'audio col comando lo
// tiene tolto: `data-user-muted` lo dice al hook. Con reduced-motion o senza motion il video non
// parte da solo e i comandi restano l'unico modo di vederlo. Il tempo del video non si scrive.
import { useEffect, useRef, useState } from "react";
import { useAmbientVideo } from "./motion/useAmbientVideo";
import { useLocale } from "./i18n/LocaleProvider";
import { Pause, Play, SoundOff, SoundOn } from "./Icons";
import type { AmbientSources } from "../lib/motion/ambient";

const copy = {
  it: { play: "Riproduci il video", pause: "Metti in pausa il video", unmute: "Attiva l'audio", mute: "Togli l'audio" },
  en: { play: "Play the video", pause: "Pause the video", unmute: "Turn the sound on", mute: "Turn the sound off" },
  fr: { play: "Lire la vidéo", pause: "Mettre la vidéo en pause", unmute: "Activer le son", mute: "Couper le son" },
  de: { play: "Video abspielen", pause: "Video anhalten", unmute: "Ton einschalten", mute: "Ton ausschalten" },
  es: { play: "Reproducir el vídeo", pause: "Pausar el vídeo", unmute: "Activar el audio", mute: "Quitar el audio" },
} as const;

type Props = {
  /** Titolo reale del video: è il nome accessibile del <video>. */
  title: string;
  poster: string;
  sources: AmbientSources;
  /** La scatola: uno dei moduli media del sito (relative, overflow hidden, rapporto della sorgente). */
  className?: string;
};

export default function StoryVideo({ title, poster, sources, className = "" }: Props) {
  const { locale } = useLocale();
  const c = copy[locale];
  const host = useRef<HTMLDivElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  // Anche sul telefono (minWidth aperto): la storia non è un'atmosfera, è il contenuto.
  useAmbientVideo(video, host, {
    audio: true,
    minWidth: "(min-width: 0px)",
    sources,
    ar: sources.ar,
    sdWidth: sources.sdWidth,
  });

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVolume = () => setMuted(v.muted);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("volumechange", onVolume);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("volumechange", onVolume);
    };
  }, []);

  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      // Un clic è un gesto: il suono si può accendere, salvo chi l'ha tolto apposta.
      if (v.dataset.userMuted !== "1") v.muted = false;
      v.play().catch(() => {
        v.muted = true;
        v.play().catch(() => undefined);
      });
    } else {
      v.pause();
    }
  };
  const toggleMute = () => {
    const v = video.current;
    if (!v) return;
    const zittisci = !v.muted;
    v.muted = zittisci;
    if (zittisci) v.dataset.userMuted = "1";
    else delete v.dataset.userMuted;
    setMuted(zittisci);
  };

  return (
    <div ref={host} className={`dt-story ${className}`} data-story>
      <video
        ref={video}
        muted
        playsInline
        preload="none"
        poster={poster}
        aria-label={title}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="dt-story_comandi">
        <button type="button" onClick={togglePlay} aria-label={playing ? c.pause : c.play} aria-pressed={playing} className="dt-story_tasto">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
        </button>
        <button type="button" onClick={toggleMute} aria-label={muted ? c.unmute : c.mute} aria-pressed={!muted} className="dt-story_tasto">
          {muted ? <SoundOff className="h-5 w-5" /> : <SoundOn className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
