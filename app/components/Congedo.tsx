"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { heroCinematic } from "../lib/media";

/* Congedo — la banda video finale (spec 4.15, rif. immobiliaregoldengoal.it):
   il clip drone a tutta larghezza, titolo bianco d1 in basso a sinistra e il
   link "Contattaci" sottolineato. Nessun velo: il video è il fondo. Niente GSAP. */

// Poster della banda: si vede solo dove il video NON parte (telefono,
// reduced-motion). Non piu' `hero-aerial.jpg`: quella ripresa drone e' il
// pannello del territorio, quattromila pixel piu' su, e la stessa villa con
// la stessa piscina apriva e chiudeva la stessa scorsa. Questa e' un'altra
// piscina, scura nell'angolo dove cade il titolo bianco. E non
// `heroCinematic.poster`: quel ritratto e' chiaro e il bianco senza velo non
// ci si legge.
const POSTER = "/images/reali/piscina-lusso.jpg";

/* L'unico trattamento ammesso sul bianco che sta sopra un'immagine: un'ombra
   di testo, la stessa grammatica della copertina delle cinque stelle. NON è un
   velo — niente rettangolo, niente vignettatura sul video (vietati dalla
   cliente): l'ombra sta attaccata alle lettere. Serve perché il volo del drone
   porta sotto il titolo, per qualche fotogramma, le tende bianche e la
   pavimentazione chiara: nessun taglio può evitarle e il bianco su bianco
   sparisce. Due raggi: 2px per staccare il bordo, 28px per reggere il caso
   peggiore. */
const INK_ON_VIDEO = {
  textShadow: "0 1px 2px rgb(0 0 0 / 0.35), 0 0 28px rgb(0 0 0 / 0.45)",
} as const;

const copy = {
  it: { title: "Vendere casa, senza stress.", cta: "Contattaci" },
  en: { title: "Selling your home, without stress.", cta: "Contact us" },
  fr: { title: "Vendre votre bien, sans stress.", cta: "Contactez-nous" },
  de: { title: "Verkaufen ohne Stress.", cta: "Kontakt" },
  es: { title: "Vender casa, sin estrés.", cta: "Contáctanos" },
} as const;

export default function Congedo() {
  const { locale } = useLocale();
  const c = copy[locale];
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Il video parte solo con motion ok, da 768 in su (le soglie di MQ in
  // lib/motion/gsap.ts, non importate per non tirarsi dietro GSAP) e quando la
  // banda è vicina allo schermo. Niente autoPlay e preload="none": sotto 768 e
  // con reduced-motion il mp4 (5,4 MB) non viene mai richiesto, resta la foto.
  useEffect(() => {
    const v = videoRef.current;
    const host = sectionRef.current;
    if (!v || !host) return;
    const mqs = [
      matchMedia("(prefers-reduced-motion: no-preference)"),
      matchMedia("(min-width: 768px)"),
    ];
    let near = false;
    const sync = () => {
      if (near && mqs.every((m) => m.matches)) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        sync();
      },
      { rootMargin: "40% 0px" }
    );
    io.observe(host);
    mqs.forEach((m) => m.addEventListener("change", sync));
    return () => {
      io.disconnect();
      mqs.forEach((m) => m.removeEventListener("change", sync));
      v.pause();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="congedo-title"
      className="relative aspect-video min-h-[70svh] w-full overflow-hidden bg-cream-deep"
    >
      {/* IL TAGLIO, misurato (11 settembre) e non più a occhio: dove la banda
          non è 16:9 — telefono e tablet verticale — il fotogramma 2:1 perde due
          terzi della larghezza, e con `20% 50%` sotto il titolo bianco finiva
          la parete chiara della villa: «VENDERE» spariva. A 16% ci finisce la
          chioma scura degli alberi (31% di pixel chiari contro il 37%, e con
          l'ombra qui sotto basta). Zoom 1.14 come il video: è il suo fermo
          immagine e i due non devono saltare quando parte.
          `sizes` sovradimensionato apposta: sul telefono di questa foto se ne
          vede meno di un terzo della larghezza, quindi «100vw» faceva scegliere
          al browser un file da 420 px di cui 122 ingranditi a 390 — la banda
          finale del sito era una poltiglia. Con 200vw il pezzo visibile arriva
          già grande abbastanza; `quality` scende a 60 per non pagarla due volte. */}
      <Image
        src={POSTER}
        alt=""
        fill
        sizes="(max-width: 767px) 200vw, 100vw"
        quality={60}
        className="scale-[1.14] object-cover object-[16%_50%] origin-bottom-right"
      />
      {/* Senza poster: finché non ha un frame è trasparente e sotto resta la foto. */}
      <video
        ref={videoRef}
        // scale 1.14 dall'angolo in basso a destra: la clip ha il logo Domus Tua
        // bruciato in alto a sinistra (verificato l'11 settembre a video in
        // corsa: a 1.0 si legge, da 1.14 in su il taglio superiore lo mangia).
        // Resta quindi com'è: è il motivo per cui sotto il titolo non si può
        // scegliere l'inquadratura, e per cui il bianco ha bisogno dell'ombra.
        className="absolute inset-0 h-full w-full scale-[1.14] object-cover object-[16%_50%] origin-bottom-right"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
      >
        {heroCinematic.webm && <source src={heroCinematic.webm} type="video/webm" />}
        <source src={heroCinematic.mp4} type="video/mp4" />
      </video>

      <div className="dt-row absolute inset-x-0 bottom-[12vh]">
        <h2
          id="congedo-title"
          className="max-w-[12ch] text-balance font-display text-d1 text-white"
          style={INK_ON_VIDEO}
        >
          {c.title}
        </h2>
        {/* Le regole .dt-btn sono unlayered: per la taglia d4 leggera serve `!`. */}
        <Cta
          href="#contatti"
          variant="ghost-dark"
          arrow={false}
          className="mt-8 !text-d4 !font-light"
          style={INK_ON_VIDEO}
        >
          {c.cta}
        </Cta>
      </div>
    </section>
  );
}
