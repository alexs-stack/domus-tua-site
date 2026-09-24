"use client";

import { useRef } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import Parallax from "./motion/Parallax";
import Magnetic from "./motion/Magnetic";
import { Instagram, Facebook, TikTok, YouTube } from "./Icons";
import { site } from "../lib/site";
import { IframeWidget } from "./WidgetEmbeds";
import { gsap, useGSAP, MQ, dur, stagger } from "../lib/motion/gsap";
import { useLocale } from "./i18n/LocaleProvider";

const grid = [
  "/images/premium_01_living_tv_divano.jpg",
  "/images/rendering_03_master_bedroom_legno.jpg",
  "/images/hero_02_attico_travi_living.jpg",
  "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
  "/images/premium_05_living_accenti_senape.jpg",
  "/images/premium_03_cucina_moderna.jpg",
];

const channels = [
  { icon: Instagram, label: "Instagram", href: site.social.instagram.href },
  { icon: Facebook, label: "Facebook", href: site.social.facebook.href },
  { icon: TikTok, label: "TikTok", href: site.social.tiktok.href },
  { icon: YouTube, label: "YouTube", href: site.social.youtube.href },
];

const copy = {
  it: {
    eyebrow: "Seguici",
    title: "La casa è anche racconto. Vivila con noi, ogni giorno.",
    subcopy:
      "Case appena arrivate, before/after, Open Domus, dietro le quinte e consigli per chi vende o cerca casa. Siamo dove sei tu.",
    channelAria: (label: string) => `Domus Tua su ${label}`,
    feedTitle: "Feed Instagram di Domus Tua",
    profileAria: "Apri il profilo Instagram di Domus Tua",
    followBadge: "Segui",
  },
  en: {
    eyebrow: "Follow us",
    title: "A home is also a story. Live it with us, every day.",
    subcopy:
      "Just-listed homes, before/after, Open Domus, behind the scenes and advice for anyone selling or searching for a home. We're wherever you are.",
    channelAria: (label: string) => `Domus Tua on ${label}`,
    feedTitle: "Domus Tua Instagram feed",
    profileAria: "Open the Domus Tua Instagram profile",
    followBadge: "Follow",
  },
  fr: {
    eyebrow: "Suivez-nous",
    title: "Une maison, c'est aussi une histoire. Vivez-la avec nous, chaque jour.",
    subcopy:
      "Biens tout juste arrivés, avant/après, Open Domus, coulisses et conseils pour qui vend ou cherche un logement. Nous sommes là où vous êtes.",
    channelAria: (label: string) => `Domus Tua sur ${label}`,
    feedTitle: "Fil Instagram de Domus Tua",
    profileAria: "Ouvrir le profil Instagram de Domus Tua",
    followBadge: "Suivre",
  },
  de: {
    eyebrow: "Folgen Sie uns",
    title: "Ein Zuhause ist auch eine Geschichte. Erleben Sie sie mit uns, jeden Tag.",
    subcopy:
      "Neu eingetroffene Objekte, Vorher/Nachher, Open Domus, Einblicke hinter die Kulissen und Tipps für alle, die verkaufen oder ein Zuhause suchen. Wir sind, wo Sie sind.",
    channelAria: (label: string) => `Domus Tua auf ${label}`,
    feedTitle: "Instagram-Feed von Domus Tua",
    profileAria: "Das Instagram-Profil von Domus Tua öffnen",
    followBadge: "Folgen",
  },
  es: {
    eyebrow: "Síguenos",
    title: "Un hogar también es un relato. Vívelo con nosotros, cada día.",
    subcopy:
      "Casas recién llegadas, antes/después, Open Domus, entre bastidores y consejos para quien vende o busca casa. Estamos donde estás tú.",
    channelAria: (label: string) => `Domus Tua en ${label}`,
    feedTitle: "Feed de Instagram de Domus Tua",
    profileAria: "Abrir el perfil de Instagram de Domus Tua",
    followBadge: "Seguir",
  },
};

export default function Social() {
  const { locale } = useLocale();
  const c = copy[locale];

  const sectionRef = useRef<HTMLElement | null>(null);
  const channelsRef = useRef<HTMLDivElement | null>(null);
  const mosaicRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const cleanups: (() => void)[] = [];

        // Pill canali: micro-stagger orizzontale. Contengono link → opacity
        // (mai autoAlpha) + reti di sicurezza stile Reveal (focus/timeout).
        const row = channelsRef.current;
        if (row) {
          const pills = gsap.utils.toArray<HTMLElement>(row.children);
          const tween = gsap.fromTo(
            pills,
            { x: -10, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: dur.short,
              ease: "domus",
              stagger: stagger.cards / 2,
              clearProps: "opacity,transform",
              scrollTrigger: { trigger: row, start: "top 85%", once: true },
            }
          );
          const reveal = () => tween.progress(1);
          row.addEventListener("focusin", reveal, { once: true });
          const safety = window.setTimeout(reveal, 2500);
          cleanups.push(() => {
            row.removeEventListener("focusin", reveal);
            window.clearTimeout(safety);
          });
        }

        // Mosaico: ingresso 2D dal centro della griglia 2×3 (ref presente solo
        // quando il feed iframe NON è attivo). Le immagini sono decorative ma
        // ogni tile è un <a> verso il profilo → opacity + stesse reti di sicurezza.
        const mosaic = mosaicRef.current;
        if (mosaic) {
          const tiles = gsap.utils.toArray<HTMLElement>(mosaic.children);
          const tween = gsap.fromTo(
            tiles,
            { scale: 0.92, y: 18, opacity: 0 },
            {
              scale: 1,
              y: 0,
              opacity: 1,
              duration: dur.short,
              ease: "domus",
              stagger: { each: 0.07, grid: [2, 3], from: "center" },
              clearProps: "opacity,transform",
              scrollTrigger: { trigger: mosaic, start: "top 80%", once: true },
            }
          );
          const reveal = () => tween.progress(1);
          mosaic.addEventListener("focusin", reveal, { once: true });
          const safety = window.setTimeout(reveal, 2500);
          cleanups.push(() => {
            mosaic.removeEventListener("focusin", reveal);
            window.clearTimeout(safety);
          });
        }

        return () => cleanups.forEach((fn) => fn());
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* Left: pitch + canali — Reveal spezzato in due: il titolo TextLines
              resta nudo (niente doppio-hide) */}
          <div>
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            <TextLines
              as="h2"
              className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl"
            >
              {c.title}
            </TextLines>
            <Reveal delay={100}>
              <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">
                {c.subcopy}
              </p>

              <a
                href={site.social.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-8 inline-flex items-center gap-3 rounded-full border border-line bg-paper py-2.5 pl-3 pr-5 text-sm font-semibold text-ink transition-all duration-300 hover:border-red"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red text-white">
                  <Instagram className="h-5 w-5" />
                </span>
                {site.social.instagram.handle}
              </a>

              <div ref={channelsRef} className="mt-8 flex flex-wrap gap-2.5">
                {channels.map((ch) => (
                  <a
                    key={ch.label}
                    href={ch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={c.channelAria(ch.label)}
                    className="group flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5 text-sm font-medium text-graphite transition-all duration-300 hover:border-red hover:text-red"
                  >
                    <ch.icon className="h-[1.1rem] w-[1.1rem]" />
                    {ch.label}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right: feed Instagram live (se configurato) o griglia curata.
              Il ramo iframe conserva il suo Reveal; il mosaico entra via GSAP. */}
          {site.embeds.instagramIframe ? (
            <Reveal delay={120}>
              <IframeWidget
                src={site.embeds.instagramIframe}
                title={c.feedTitle}
                ratio={1}
              />
            </Reveal>
          ) : (
            <div ref={mosaicRef} className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Parallasse alternata dei riquadri — solo desktop, molto discreta */}
              {grid.map((src, i) => (
                <Parallax key={src} speed={i % 2 === 1 ? 1 : -1} range={12}>
                  <a
                    href={site.social.instagram.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-square overflow-hidden rounded-2xl"
                    aria-label={c.profileAria}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 33vw, 220px"
                      className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-red/0 text-white opacity-0 transition-all duration-300 group-hover:bg-red/45 group-hover:opacity-100">
                      <Instagram className="h-7 w-7" />
                    </span>
                    {i === 0 && (
                      // Magnetic DENTRO il posizionatore assoluto: il suo wrapper
                      // inline-flex riceve il transform, l'ancoraggio non si muove.
                      <div className="absolute left-2.5 top-2.5">
                        <Magnetic strength={0.2}>
                          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-red">
                            {c.followBadge}
                          </span>
                        </Magnetic>
                      </div>
                    )}
                  </a>
                </Parallax>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
