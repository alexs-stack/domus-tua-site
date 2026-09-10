"use client";

// Servizi — il capitolo piano della rivista bianca (2026-09-10, rif.
// immobiliaregoldengoal.it): titolo d1, griglia di foto quadrate a tre
// colonne con titolo d3 e testo 19 px, e sotto la riga del rendering
// (foto 4:5, titolo d2, lead, link sottolineato). Via il nastro
// orizzontale, la distorsione WebGL, i sipari, i bagliori, i gradienti
// sulle foto e la fascia grafite del D.O.C. I testi sono gli stessi.
import Image from "next/image";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import Parallax from "./motion/Parallax";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";

// `featureBadge`, `docEyebrow`, `docCopy`: conservati dal capitolo
// precedente; oggi non hanno più una riga propria (via badge e fascia D.O.C.).
const copy = {
  it: {
    eyebrow: "Servizi Domus",
    title: "Tutto ciò che serve per valorizzare, proteggere e raccontare la tua casa.",
    featureBadge: "Servizio di punta",
    featureTitle: "Rendering e virtual rendering",
    featureCopy:
      "Vedere il potenziale dell’immobile prima ancora dei lavori.",
    featureAlt: "Rendering fotorealistico di un living moderno",
    featureCta: "Scopri i servizi creativi",
    services: [
      {
        title: "Servizi tecnico-legali",
        copy: "Consulenza catastale, urbanistica e amministrativa.",
      },
      {
        title: "Home staging",
        copy: "Valorizzare gli spazi per vendere prima e meglio.",
      },
      {
        title: "Emotional video real estate",
        copy: "Raccontare la casa con un film, non con due foto.",
      },
      {
        title: "Contenuti e campagne marketing",
        copy: "Visibilità mirata sui canali che contano.",
      },
      {
        title: "Open Domus",
        copy: "L’esperienza di visita che fa innamorare gli acquirenti.",
      },
    ],
    docEyebrow: "Protocollo Domus D.O.C.",
    docCopy:
      "Uno standard di trasparenza e qualità applicato a ogni immobile che trattiamo.",
  },
  en: {
    eyebrow: "Domus Services",
    title: "Everything you need to enhance, protect and tell the story of your home.",
    featureBadge: "Signature service",
    featureTitle: "Rendering and virtual rendering",
    featureCopy:
      "Seeing a property’s potential before the work even begins.",
    featureAlt: "Photorealistic rendering of a modern living room",
    featureCta: "Discover the creative services",
    services: [
      {
        title: "Technical and legal services",
        copy: "Cadastral, planning and administrative advice.",
      },
      {
        title: "Home staging",
        copy: "Enhancing spaces to sell sooner and better.",
      },
      {
        title: "Emotional video real estate",
        copy: "Telling the story of a home with a film, not two photos.",
      },
      {
        title: "Content and marketing campaigns",
        copy: "Targeted visibility on the channels that matter.",
      },
      {
        title: "Open Domus",
        copy: "The viewing experience that makes buyers fall in love.",
      },
    ],
    docEyebrow: "Domus D.O.C. Protocol",
    docCopy:
      "A standard of transparency and quality applied to every property we handle.",
  },
  fr: {
    eyebrow: "Services Domus",
    title: "Tout ce qu’il faut pour valoriser, protéger et raconter votre maison.",
    featureBadge: "Service phare",
    featureTitle: "Rendu et rendu virtuel",
    featureCopy:
      "Voir le potentiel du bien avant même les travaux.",
    featureAlt: "Rendu photoréaliste d’un salon moderne",
    featureCta: "Découvrir les services créatifs",
    services: [
      {
        title: "Services techniques et juridiques",
        copy: "Conseil cadastral, urbanistique et administratif.",
      },
      {
        title: "Home staging",
        copy: "Valoriser les espaces pour vendre plus vite et mieux.",
      },
      {
        title: "Emotional video real estate",
        copy: "Raconter la maison avec un film, pas avec deux photos.",
      },
      {
        title: "Contenus et campagnes marketing",
        copy: "Une visibilité ciblée sur les canaux qui comptent.",
      },
      {
        title: "Open Domus",
        copy: "L’expérience de visite qui fait tomber les acquéreurs amoureux.",
      },
    ],
    docEyebrow: "Protocole Domus D.O.C.",
    docCopy:
      "Un standard de transparence et de qualité appliqué à chaque bien que nous traitons.",
  },
  de: {
    eyebrow: "Domus Leistungen",
    title: "Alles, was Sie brauchen, um Ihr Zuhause aufzuwerten, zu schützen und seine Geschichte zu erzählen.",
    featureBadge: "Spitzenleistung",
    featureTitle: "Rendering und Virtual Rendering",
    featureCopy:
      "Das Potenzial der Immobilie sehen, noch bevor die Arbeiten beginnen.",
    featureAlt: "Fotorealistisches Rendering eines modernen Wohnzimmers",
    featureCta: "Die kreativen Leistungen entdecken",
    services: [
      {
        title: "Technische und rechtliche Dienstleistungen",
        copy: "Beratung zu Kataster, Baurecht und Verwaltung.",
      },
      {
        title: "Home Staging",
        copy: "Räume aufwerten, um schneller und besser zu verkaufen.",
      },
      {
        title: "Emotional Video Real Estate",
        copy: "Die Immobilie mit einem Film erzählen, nicht mit zwei Fotos.",
      },
      {
        title: "Inhalte und Marketingkampagnen",
        copy: "Gezielte Sichtbarkeit auf den Kanälen, die zählen.",
      },
      {
        title: "Open Domus",
        copy: "Das Besichtigungserlebnis, das Käufer verliebt macht.",
      },
    ],
    docEyebrow: "Domus D.O.C. Protokoll",
    docCopy:
      "Ein Standard für Transparenz und Qualität, angewandt auf jede Immobilie, die wir betreuen.",
  },
  es: {
    eyebrow: "Servicios Domus",
    title: "Todo lo que necesitas para revalorizar, proteger y contar la historia de tu casa.",
    featureBadge: "Servicio estrella",
    featureTitle: "Renderizado y renderizado virtual",
    featureCopy:
      "Ver el potencial del inmueble antes incluso de las obras.",
    featureAlt: "Renderizado fotorrealista de un salón moderno",
    featureCta: "Descubre los servicios creativos",
    services: [
      {
        title: "Servicios técnicos y legales",
        copy: "Asesoramiento catastral, urbanístico y administrativo.",
      },
      {
        title: "Home staging",
        copy: "Valorizar los espacios para vender antes y mejor.",
      },
      {
        title: "Emotional video real estate",
        copy: "Contar la casa con una película, no con dos fotos.",
      },
      {
        title: "Contenidos y campañas de marketing",
        copy: "Visibilidad selectiva en los canales que importan.",
      },
      {
        title: "Open Domus",
        copy: "La experiencia de visita que enamora a los compradores.",
      },
    ],
    docEyebrow: "Protocolo Domus D.O.C.",
    docCopy:
      "Un estándar de transparencia y calidad aplicado a cada inmueble que gestionamos.",
  },
};

// La foto di ogni servizio 01–05, nell'ordine dell'elenco `services`.
// Ognuna una volta sola in home: il drone di Villa Mozart sta in Method, la
// foto di Teresa in OpenDomus. `trimTop`: il fotogramma porta il titolo del
// video cotto nella fascia alta; la scatola sale del 25 % oltre la tessera,
// così la fascia resta fuori dal quadrato.
const SHOTS: { src: string; trimTop?: boolean }[] = [
  { src: "/images/rendering_03_master_bedroom_legno.jpg" },
  { src: "/images/home_staging_01_sala_reale_sedie_gialle.jpg" },
  { src: "/images/reali/villa-tramonto.jpg" },
  { src: "/images/premium_02_living_dining_piante.jpg" },
  { src: "/images/reali/video-villa-domotica.jpg", trimTop: true },
];

// Il rendering vive nella sezione creativa di /servizi: il link va lì.
const FEATURE_HREF = "/servizi#servizi-creativi";

export default function Services() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section id="servizi" className="dt-chapter bg-cream">
      <div className="dt-row">
        {/* Testa di capitolo: eyebrow e titolo d1 in colonna stretta. */}
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <TextLines as="h2" className="mt-6 max-w-[24ch] font-display text-d2">
          {c.title}
        </TextLines>

        {/* La griglia dei servizi: foto quadrata, titolo d3, testo 19 px.
            Il ritardo del reveal segue la colonna, non l'indice: la riga
            entra insieme, da sinistra a destra. */}
        <ul className="mt-[8vh] grid gap-x-[3vw] gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {c.services.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={(i % 3) * 80}>
                <div className="relative aspect-square overflow-hidden">
                  <div
                    className={
                      SHOTS[i].trimTop ? "absolute inset-x-0 bottom-0 h-[125%]" : "absolute inset-0"
                    }
                  >
                    <Image
                      src={SHOTS[i].src}
                      alt={s.title}
                      fill
                      sizes="(max-width:768px) 100vw, 30vw"
                      className="object-cover"
                    />
                  </div>
                </div>
                <h3 className="mt-5 font-display text-d3">{s.title}</h3>
                <p className="mt-3 text-body text-graphite">{s.copy}</p>
              </Reveal>
            </li>
          ))}
        </ul>

        {/* Il servizio di punta come riga 6/6: foto 4:5 a sinistra (deriva
            ±4 %), titolo d2, lead e link sottolineato a destra. */}
        <div className="mt-[10vh] grid gap-[6vw] lg:grid-cols-2 lg:items-center">
          <Parallax speed={-0.04}>
            <div className="relative aspect-[4/5]">
              <Image
                src="/images/rendering_01_living_divano_grigio.jpg"
                alt={c.featureAlt}
                fill
                sizes="(max-width:1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </Parallax>
          <div>
            <TextLines as="h3" className="font-display text-d2">
              {c.featureTitle}
            </TextLines>
            <Reveal>
              <p className="lead mt-6">{c.featureCopy}</p>
            </Reveal>
            <Reveal delay={100}>
              <Cta href={FEATURE_HREF} variant="ghost" className="mt-8">
                {c.featureCta}
              </Cta>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
