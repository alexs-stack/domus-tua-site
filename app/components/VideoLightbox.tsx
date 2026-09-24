"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useModalBehaviour } from "./hooks/useModalBehaviour";
import { setOverlay } from "../lib/ui/overlays";
import { isTransitionCovering } from "./motion/PageTransition";
import { useLocale } from "./i18n/LocaleProvider";

// Il video IN PAGINA, che è ciò che il §6.5 chiede.
//
// PERCHÉ ESISTE. Ogni video del sito mandava il visitatore su YouTube: si cliccava una
// tessera del muro delle voci, o «Guarda il video» nell'hero, e si finiva su una pagina
// piena di consigli che portano altrove. Chi guardava la storia di Roberta la guardava
// dentro YouTube, e da lì difficilmente tornava indietro.
//
// PRIVACY, che qui non è un dettaglio ma il motivo della forma. L'iframe si monta SOLO
// quando il dialog è aperto: prima non parte nessuna richiesta verso YouTube, quindi chi
// non guarda un video non viene tracciato. Verificato in build di produzione: zero
// richieste a youtube-nocookie.com prima del clic, una per apertura, nessuna dopo la
// chiusura. Le miniature passano dall'ottimizzatore di Next, quindi l'indirizzo IP del
// visitatore non arriva mai a Google.
//
// COSA NON FA: non riproduce da solo, non compare a scomparsa, non parte allo scroll.
// L'unico modo di far partire un video è chiedere di vederlo.

const copy = {
  it: { play: "Riproduci il video", close: "Chiudi il video", region: "Video" },
  en: { play: "Play the video", close: "Close the video", region: "Video" },
  fr: { play: "Lire la vidéo", close: "Fermer la vidéo", region: "Vidéo" },
  de: { play: "Video abspielen", close: "Video schließen", region: "Video" },
  es: { play: "Reproducir el vídeo", close: "Cerrar el vídeo", region: "Vídeo" },
} as const;

export type VideoLightboxProps = {
  /** Video aperto, o null se il dialog è chiuso. */
  video: { id: string; title: string } | null;
  onClose: () => void;
};

export default function VideoLightbox({ video, onClose }: VideoLightboxProps) {
  const { locale } = useLocale();
  const c = copy[locale];
  const panelRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const close = useCallback(() => onClose(), [onClose]);

  // `keepScrollStopped` come nel dialog gemello: se una transizione di pagina sta coprendo
  // lo schermo, lo scroll non lo riavvia questo componente. Passarlo in un posto e non
  // nell'altro sarebbe esattamente la divergenza che l'estrazione dell'hook voleva evitare.
  useModalBehaviour({
    open: !!video,
    panelRef,
    onClose: close,
    keepScrollStopped: isTransitionCovering,
  });

  // Il registro delle superfici: chi ha elementi fissi (launcher dell'assistente, barra
  // mobile) si toglie di mezzo mentre questo è aperto, invece di gareggiare sugli z-index.
  useEffect(() => {
    if (!video) return;
    setOverlay("video", true);
    return () => setOverlay("video", false);
  }, [video]);

  // ESC RESTA VIVO ANCHE QUANDO SI TOCCA IL PLAYER.
  //
  // L'iframe è cross-origin: i tasti premuti là dentro nascono nel documento di YouTube e
  // NON arrivano al nostro `document`, dove il trap ascolta. Misurato: focus nell'iframe →
  // Esc non chiude più. E non è un caso limite, è la prima cosa che succede a chi mette in
  // pausa il video con un clic.
  //
  // La rete è questa: quando la finestra perde il focus verso l'iframe, glielo si riprende
  // e lo si rimette sul pannello. Il video continua a suonare — il focus non è la
  // riproduzione — e i tasti tornano a essere nostri. Chi vuole davvero i controlli di
  // YouTube ci arriva col Tab, e lì la scelta è sua.
  useEffect(() => {
    if (!video) return;
    const onBlur = () => {
      // Un tick: al momento del blur `activeElement` non è ancora aggiornato.
      window.setTimeout(() => {
        if (document.activeElement === iframeRef.current) panelRef.current?.focus();
      }, 0);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [video]);

  // Niente stato "montato": `video` e null sul server e al primo render del client — il
  // dialog si apre solo per un clic, che sul server non esiste. Quindi qui non si arriva
  // mai durante l idratazione, e non c e nessuna differenza fra i due alberi. La guardia
  // su `document` resta come rete, non come meccanismo.
  if (!video || typeof document === "undefined") return null;

  return createPortal(
    // PORTAL SU BODY, e non è un vezzo: `<main>` è un contesto di impilamento
    // (`isolation: isolate` da SurfaceFlow, `z-index: 10` dall'uncover del footer), quindi
    // un `fixed` reso lì dentro NON compete con header (z-50), banner cookie (z-[60]) e
    // grana (z-60), che gli sono fratelli nel body. Misurato prima di questa riga: con il
    // dialog aperto la pillola dell'header restava dipinta sopra il velo e CLICCABILE — si
    // premeva «Contatti» e la pagina se ne andava da sotto una superficie che si dichiara
    // `aria-modal`. È la stessa trappola che CaseQuickLook.tsx documenta e schiva così.
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-8">
      {/* Il velo. `aria-hidden` e NON focusabile, come nel dialog gemello: un bottone a
          tutto schermo fuori dal pannello catturava il primo Shift+Tab, portando il focus
          FUORI da una superficie `aria-modal` — dove l'anello di focus si disegna oltre i
          bordi del viewport, cioè non si vede. Le vie d'uscita annunciate restano due, e
          sono quelle giuste: Esc e il comando «chiudi». Il clic sul velo è una scorciatoia
          per chi usa il mouse, non l'unica porta. */}
      <div
        aria-hidden
        onClick={close}
        className="absolute inset-0 bg-espresso/85 backdrop-blur-sm"
      />
      {/* Il tetto alla LARGHEZZA è ciò che tiene il player dentro lo schermo mantenendo il
          16:9: su un telefono in orizzontale (844×390) un pannello a larghezza piena
          sfondava sopra e sotto, e il comando «chiudi» finiva 97px fuori dallo schermo con
          il documento bloccato — cioè senza nessuna uscita raggiungibile col dito. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${c.region}: ${video.title}`}
        tabIndex={-1}
        className="relative my-auto w-full max-w-[min(56rem,calc((100svh-9rem)*16/9))] outline-none"
      >
        {/* PRIMO nel DOM, e questa è la ragione: l'iframe è focusabile, e se venisse prima
            il primo Tab porterebbe dentro il player — dove Esc muore. Con l'uscita come
            prima tappa, chi naviga da tastiera trova la porta prima della stanza.
            Sta DENTRO il pannello e sovrapposto all'angolo del video, non sopra il suo
            bordo: così non può finire fuori schermo qualunque sia l'altezza. */}
        <button
          type="button"
          onClick={close}
          aria-label={c.close}
          className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-paper/90 text-ink shadow-[0_4px_14px_-6px_rgba(26,24,22,0.5)] backdrop-blur-sm transition-colors duration-300 hover:bg-red hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-[18px] w-[18px]"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink shadow-[0_60px_120px_-40px_rgba(26,24,22,0.85)]">
          <div className="relative aspect-video w-full">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`}
              title={video.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
        {/* Il titolo resta LEGGIBILE sotto il player, non solo nel nome accessibile: è la
            didascalia che il §6.5 vuole visibile, e qui la persona ha appena scelto di
            guardare proprio quel video. */}
        <p className="mt-3 text-sm text-cream/90">{video.title}</p>
      </div>
    </div>,
    document.body,
  );
}

/** L'etichetta del comando che apre il dialog, nella lingua di chi legge. */
export function useVideoPlayLabel(): (title: string) => string {
  const { locale } = useLocale();
  return (title: string) => `${copy[locale].play}: ${title}`;
}
