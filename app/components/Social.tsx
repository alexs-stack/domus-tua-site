"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import { Instagram, Facebook, TikTok, YouTube } from "./Icons";
import { site } from "../lib/site";
import { IframeWidget } from "./WidgetEmbeds";
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

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {/* Left: pitch + canali */}
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {c.title}
            </h2>
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

            <div className="mt-8 flex flex-wrap gap-2.5">
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

          {/* Right: feed Instagram live (se configurato) o griglia curata */}
          <Reveal delay={120}>
            {site.embeds.instagramIframe ? (
              <IframeWidget
                src={site.embeds.instagramIframe}
                title={c.feedTitle}
                ratio={1}
              />
            ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {grid.map((src, i) => (
                <a
                  key={src}
                  href={site.social.instagram.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-2xl"
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
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-red">
                      {c.followBadge}
                    </span>
                  )}
                </a>
              ))}
            </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
