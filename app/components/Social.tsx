"use client";

/* Seguici — eyebrow, titolo grande, il paragrafo editoriale, il feed Instagram
   (solo se configurato in site.embeds.instagramIframe) e le icone social.
   Niente nastro di foto, niente chip: il racconto per immagini lo fanno i
   capitoli.
   FORMA (2026-09-11): una RIGA, non un capitolo. Con `instagramIframe` vuoto qui
   non c'è nessun media, e un `dt-chapter` da 702px attorno a un titolo e quattro
   icone leggeva come una pagina rimasta indietro. Titolo a sinistra, paragrafo +
   feed + icone sulla seconda colonna, alla stessa linea verticale delle righe
   foto+testo; il vuoto verticale lo danno i capitoli vicini. */

import Reveal from "./Reveal";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import { useRef } from "react";
import { gsap, useGSAP } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import SocialLinks from "./primitives/SocialLinks";
import { site } from "../lib/site";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Seguici",
    title: "La casa è anche racconto. Vivila con noi, ogni giorno.",
    subcopy:
      "Case appena arrivate, before/after, Open Domus e dietro le quinte.",
    channelAria: (label: string) => `Domus Tua su ${label}`,
    feedTitle: "Feed Instagram di Domus Tua",
  },
  en: {
    eyebrow: "Follow us",
    title: "A home is also a story. Live it with us, every day.",
    subcopy:
      "Just-listed homes, before/after, Open Domus and behind the scenes.",
    channelAria: (label: string) => `Domus Tua on ${label}`,
    feedTitle: "Domus Tua Instagram feed",
  },
  fr: {
    eyebrow: "Suivez-nous",
    title: "Une maison, c'est aussi une histoire. Vivez-la avec nous, chaque jour.",
    subcopy:
      "Biens tout juste arrivés, avant/après, Open Domus et coulisses.",
    channelAria: (label: string) => `Domus Tua sur ${label}`,
    feedTitle: "Fil Instagram de Domus Tua",
  },
  de: {
    eyebrow: "Folgen Sie uns",
    title: "Ein Zuhause ist auch eine Geschichte. Erleben Sie sie mit uns, jeden Tag.",
    subcopy:
      "Neu eingetroffene Objekte, Vorher/Nachher, Open Domus und Blicke hinter die Kulissen.",
    channelAria: (label: string) => `Domus Tua auf ${label}`,
    feedTitle: "Instagram-Feed von Domus Tua",
  },
  es: {
    eyebrow: "Síguenos",
    title: "Un hogar también es un relato. Vívelo con nosotros, cada día.",
    subcopy:
      "Casas recién llegadas, antes/después, Open Domus y entre bastidores.",
    channelAria: (label: string) => `Domus Tua en ${label}`,
    feedTitle: "Feed de Instagram de Domus Tua",
  },
};

export default function Social() {
  const { locale } = useLocale();
  const c = copy[locale];
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);

  // Il titolo si congeda (A25 di Alberto, 13 set.: «Esce crescendo e
  // sfumando»; spec 2026-09-13 §3.15): uscendo dall'alto il blocco eyebrow +
  // titolo cresce da 1 a 1,12 e sfuma da 1 a 0, con l'origine in basso a
  // sinistra. Rientrando torna pieno: speculare per scrub (C22). Il trigger è
  // il wrapper fermo, non il blocco che scala: ScrollTrigger misura un
  // rettangolo che non cambia. Opacità finale 0 e non 0,02: dentro non c'è
  // niente di focalizzabile e axe salta lo 0.
  useGSAP(() => {
    const trigger = triggerRef.current;
    const block = blockRef.current;
    if (!trigger || !block) return;
    const mm = gsap.matchMedia();
    mm.add(MQ.motionOk, () => {
      gsap.fromTo(
        block,
        { scale: 1, opacity: 1, transformOrigin: "0% 100%" },
        {
          scale: 1.12,
          opacity: 0,
          ease: "expo.in",
          scrollTrigger: {
            trigger,
            start: "center center",
            end: "bottom top",
            scrub: 1.3,
            invalidateOnRefresh: true,
          },
        },
      );
    });
  });

  return (
    /* `overflow-x-clip`: a 390 il blocco largo 90vw scalato a 1,12 uscirebbe
       dal bordo destro; nessuno sticky vive qui dentro (spec §3.15). */
    <section className="overflow-x-clip bg-cream py-[clamp(1rem,3vh,2rem)]">
      <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-end">
        <div ref={triggerRef}>
          <div ref={blockRef} data-seguici-congedo>
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            <SplitTitle as="h2" className="mt-6 max-w-[16ch] font-display text-d2">
              {c.title}
            </SplitTitle>
          </div>
        </div>

        <div className="mt-6 lg:mt-0 lg:pl-[6vw]">
          <Lead>{c.subcopy}</Lead>

          {/* Il feed, quando c'è, sta nella METÀ (dt-media-half, quadrata come
              la griglia di Instagram): è la stessa scatola delle foto, non una
              banda su misura. Non passa da IframeWidget perché quello fissa il
              proprio aspect-ratio in linea e arrotonda gli angoli. Senza URL
              non c'è scatola: un vuoto quadrato non è un feed. */}
          {site.embeds.instagramIframe ? (
            <Reveal delay={120}>
              <div className="dt-media-half mt-10">
                <iframe
                  src={site.embeds.instagramIframe}
                  title={c.feedTitle}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full"
                  style={{ border: 0 }}
                  scrolling="no"
                />
              </div>
            </Reveal>
          ) : null}

          <Reveal delay={160}>
            <div className="mt-8">
              <SocialLinks ariaLabel={c.channelAria} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
