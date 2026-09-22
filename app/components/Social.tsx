"use client";

/* Seguici — il terzo pannello del nastro di Costi chiari (A72 di Alberto, 22 set. 2026, notte:
   «… ed entra la sezione di Carmine e Seguici»): occhiello, il titolo GRANDE per lettera (A66: nel
   nastro le scritte sono grandi e si muovono; SplitTitle come il titolo dei costi e quello di Carmine,
   negli altri due pannelli), il paragrafo editoriale, il feed Instagram (solo se configurato in
   site.embeds.instagramIframe) e le icone social. Niente nastro di foto, niente chip: il racconto
   per immagini lo fanno i capitoli.
   FORMA: una RIGA a due colonne (dal 2026-09-11: titolo a sinistra, paragrafo + feed + icone sulla
   seconda colonna), oggi dentro il pannello: nel nastro sta sulla carta, dopo Carmine; in colonna
   (sotto la soglia dei corridoi, reduced-motion, senza JS) è la stessa riga in flusso. Non ha più una
   <section> sua: la sezione è #costi (CostiChiari.tsx). */

import Reveal from "./Reveal";
import RevealGroup from "./motion/RevealGroup";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import { useHorizonTrack } from "./motion/HorizonScroller";
import { useRef } from "react";
import { gsap, useGSAP, type ScrollTrigger } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { chapters, scrubOf } from "../lib/motion/chapters";
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
  const track = useHorizonTrack();

  // Il titolo si congeda (A25 di Alberto, 13 set.: «Esce crescendo e sfumando»; spec 2026-09-13
  // §3.15): uscendo dall'alto il blocco occhiello + titolo cresce da 1 a 1,12 e sfuma da 1 a 0, con
  // l'origine in basso a sinistra; rientrando torna pieno: speculare per scrub (C22). Firma e scrub dal
  // registro (chapters.ts `social`, D18). Opacità finale 0 e non 0,02: dentro non c'è niente di
  // focalizzabile e axe salta lo 0.
  // A72: dentro il nastro il blocco vive nello schermo sticky, e un trigger su di lui mentirebbe
  // (ScrollTrigger misura la quota di layout, non quella agganciata): il trigger è la SEZIONE del
  // nastro, che non è sticky — dallo sgancio dello schermo («bottom bottom»: la corsa del track è
  // finita e la sezione sale con la pagina) finché il piede del blocco non esce dal bordo alto. In
  // colonna (sotto la soglia dei corridoi, motion ok) il trigger è il wrapper fermo del blocco, come
  // prima: ScrollTrigger misura un rettangolo che non cambia.
  useGSAP(
    () => {
      const trigger = triggerRef.current;
      const block = blockRef.current;
      if (!trigger || !block) return;
      const congedo = (innesco: ScrollTrigger.Vars) =>
        gsap.fromTo(
          block,
          { scale: 1, opacity: 1, transformOrigin: "0% 100%" },
          {
            scale: 1.12,
            opacity: 0,
            ease: chapters.social.signature.ease,
            scrollTrigger: { scrub: scrubOf("social"), invalidateOnRefresh: true, ...innesco },
          },
        );
      const mm = gsap.matchMedia();
      mm.add({ corridor: MQ.corridor, motionOk: MQ.motionOk }, (ctx) => {
        const c = ctx.conditions as { corridor: boolean; motionOk: boolean };
        if (!c.motionOk) return;
        if (c.corridor && track) {
          return track((_tween, screen) => {
            const root = screen.parentElement;
            if (!root) return;
            const tw = congedo({
              trigger: root,
              start: "bottom bottom",
              end: () => `bottom ${screen.clientHeight - (block.getBoundingClientRect().bottom - screen.getBoundingClientRect().top)}px`,
            });
            return () => {
              tw.scrollTrigger?.kill();
              tw.kill();
              gsap.set(block, { clearProps: "transform,opacity" });
            };
          });
        }
        congedo({ trigger, start: "center center", end: "bottom top" });
      });
    },
    { dependencies: [locale, track], revertOnUpdate: true },
  );

  return (
    /* Il pannello: la riga a due colonne sulla carta. `overflow-x-clip` qui non serve più: lo dà la
       sezione del nastro (blocco dt-horizon, anche in colonna). */
    <div className="dt-horizon_panel dt-cc_panel dt-cc_panel--seguici relative flex items-center">
      <div className="dt-row grid w-full gap-[6vw] py-20 lg:grid-cols-[3fr_2fr] lg:items-end lg:py-0 [.dt-horizon:not([data-on])_&]:lg:py-[8vh]">
        <div ref={triggerRef}>
          <div ref={blockRef} data-seguici-congedo>
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            {/* Il titolo per lettera nella misura del nastro (A66: più grande del d2 della riga di
                prima), su ~10 caratteri per riga nella sua colonna. */}
            <SplitTitle as="h2" className="mt-6 max-w-[16ch] font-display text-[clamp(2.3rem,5.2vw,5rem)] leading-[0.95]">
              {c.title}
            </SplitTitle>
          </div>
        </div>

        <RevealGroup className="lg:pl-[2vw]">
          <Lead>{c.subcopy}</Lead>

          {/* Il feed, quando c'è, sta nella METÀ (dt-media-half, quadrata come la griglia di
              Instagram): è la stessa scatola delle foto, non una banda su misura. Non passa da
              IframeWidget perché quello fissa il proprio aspect-ratio in linea e arrotonda gli angoli.
              Senza URL non c'è scatola: un vuoto quadrato non è un feed. */}
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
        </RevealGroup>
      </div>
    </div>
  );
}
