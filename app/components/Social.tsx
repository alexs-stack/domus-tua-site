"use client";

/* Seguici — la rivista bianca (2026-09-10): eyebrow, titolo grande, il
   paragrafo editoriale, il feed Instagram (solo se configurato in
   site.embeds.instagramIframe) e le icone social. Niente nastro di foto,
   niente chip: il racconto per immagini lo fanno i capitoli. */

import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import SocialLinks from "./primitives/SocialLinks";
import { site } from "../lib/site";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Seguici",
    title: "La casa è anche racconto. Vivila con noi, ogni giorno.",
    subcopy:
      "Case appena arrivate, before/after, Open Domus, dietro le quinte e consigli per chi vende o cerca casa. Siamo dove sei tu.",
    channelAria: (label: string) => `Domus Tua su ${label}`,
    feedTitle: "Feed Instagram di Domus Tua",
  },
  en: {
    eyebrow: "Follow us",
    title: "A home is also a story. Live it with us, every day.",
    subcopy:
      "Just-listed homes, before/after, Open Domus, behind the scenes and advice for anyone selling or searching for a home. We're wherever you are.",
    channelAria: (label: string) => `Domus Tua on ${label}`,
    feedTitle: "Domus Tua Instagram feed",
  },
  fr: {
    eyebrow: "Suivez-nous",
    title: "Une maison, c'est aussi une histoire. Vivez-la avec nous, chaque jour.",
    subcopy:
      "Biens tout juste arrivés, avant/après, Open Domus, coulisses et conseils pour qui vend ou cherche un logement. Nous sommes là où vous êtes.",
    channelAria: (label: string) => `Domus Tua sur ${label}`,
    feedTitle: "Fil Instagram de Domus Tua",
  },
  de: {
    eyebrow: "Folgen Sie uns",
    title: "Ein Zuhause ist auch eine Geschichte. Erleben Sie sie mit uns, jeden Tag.",
    subcopy:
      "Neu eingetroffene Objekte, Vorher/Nachher, Open Domus, Einblicke hinter die Kulissen und Tipps für alle, die verkaufen oder ein Zuhause suchen. Wir sind, wo Sie sind.",
    channelAria: (label: string) => `Domus Tua auf ${label}`,
    feedTitle: "Instagram-Feed von Domus Tua",
  },
  es: {
    eyebrow: "Síguenos",
    title: "Un hogar también es un relato. Vívelo con nosotros, cada día.",
    subcopy:
      "Casas recién llegadas, antes/después, Open Domus, entre bastidores y consejos para quien vende o busca casa. Estamos donde estás tú.",
    channelAria: (label: string) => `Domus Tua en ${label}`,
    feedTitle: "Feed de Instagram de Domus Tua",
  },
};

export default function Social() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section className="dt-chapter bg-cream">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <TextLines as="h2" className="mt-6 max-w-[16ch] font-display text-d2">
          {c.title}
        </TextLines>
        <Reveal delay={80}>
          <p className="lead mt-8">{c.subcopy}</p>
        </Reveal>

        {/* Il feed: la scatola è responsiva (4:3, poi 21:9) e l'iframe la
            riempie. Non passa da IframeWidget perché quello fissa il proprio
            aspect-ratio in linea e arrotonda gli angoli. Senza URL non c'è
            scatola: un vuoto di 21:9 non è un feed. */}
        {site.embeds.instagramIframe ? (
          <Reveal delay={120}>
            <div className="relative mt-10 aspect-[4/3] w-full overflow-hidden bg-cream-deep lg:aspect-[21/9]">
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
    </section>
  );
}
