"use client";

// Servizi — l'elenco numerato della rivista (2026-09-11).
//
// PERCHE' RIFATTO. La sezione aveva TRE impaginazioni in una: cinque quadrati
// da 374 px in griglia a tre colonne (con la sesta cella vuota), poi il
// rendering che ripartiva come riga foto|testo con una TERZA misura (4:5).
// Tre attacchi verticali diversi in un capitolo solo: l'occhio non ritrovava
// mai la stessa linea. Ora e' l'elenco 01–06 del riferimento
// (immobiliaregoldengoal.it/vendere-casa, numeri serif giganti + titolo +
// paragrafo) impaginato nel template a due colonne: UNA foto `.dt-media-half`
// per riga, lato alternato, e due sole linee verticali in tutta la sezione.
//
// Scelta (a) e non (b) — sei tessere quadrate: sei quadrati da 605 px sono sei
// fotografie (ne avevamo cinque buone piu' un fotogramma video con la fascia
// del titolo cotta dentro, rifilata a mano col 125 % di altezza) e ~3600 px di
// capitolo per sei righe di testo. Il numero costa zero, e' il gesto
// editoriale del riferimento e lascia alla foto il ruolo di respiro.
import Image from "next/image";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import Parallax from "./motion/Parallax";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";

// `featureBadge` e `docEyebrow`/`docCopy` restano nel record per lingua ma non
// si rendono piu' (via il badge e la fascia D.O.C. col redesign). `featureTitle`
// e `featureCopy` sono ora la voce 06 dell'elenco.
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
    shotAlts: [
      "Salone valorizzato dall’home staging, con il tavolo e le sedie gialle",
      "Villa con piscina fotografata dal drone al tramonto",
    ],
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
    shotAlts: [
      "Living and dining room enhanced by home staging, with the yellow chairs",
      "Villa with swimming pool shot from a drone at sunset",
    ],
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
    shotAlts: [
      "Salon valorisé par le home staging, avec la table et les chaises jaunes",
      "Villa avec piscine photographiée par drone au coucher du soleil",
    ],
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
    shotAlts: [
      "Durch Home Staging aufgewerteter Wohn- und Essbereich mit den gelben Stühlen",
      "Villa mit Pool, bei Sonnenuntergang mit der Drohne aufgenommen",
    ],
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
    shotAlts: [
      "Salón revalorizado con home staging, con la mesa y las sillas amarillas",
      "Villa con piscina fotografiada con dron al atardecer",
    ],
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

// Tre fotografie, una per riga: due voci per riga. Il taglio e' scelto guardando
// il file, non la griglia — sono tutte 16:9 o 3:2, nel quadrato si perde solo
// larghezza (l'altezza resta intera) e nessuna sale oltre 1x.
//   home_staging  1024×683  il tavolo e le sedie stanno al centro → 50 %
//   villa-tramonto 1600×900 casa e piscina stanno al centro → 50 %
//   rendering_01  1920×1080 il divano e il tavolino stanno al centro → 50 %
// Fuori dalla home restano `rendering_03_master_bedroom_legno` e
// `premium_02_living_dining_piante` (doppioni di interni chiari) e
// `reali/video-villa-domotica` (fotogramma col titolo del video cotto nella
// fascia alta, che stava nel quadrato solo con un ritaglio del 125 %).
const ROWS = [
  { src: "/images/home_staging_01_sala_reale_sedie_gialle.jpg" },
  { src: "/images/reali/villa-tramonto.jpg" },
  { src: "/images/rendering_01_living_divano_grigio.jpg" },
];

// `sizes` segue la SCATOLA, non la colonna: con `object-cover` una foto 16:9 in
// un quadrato viene resa larga 1,78 volte il lato (poi rifilata). A 42vw
// servono ~75vw di sorgente, altrimenti il loader manda il ritaglio da 640 e lo
// stira. Stessa aritmetica sotto i 1024, dove la scatola e' larga 100 %.
const SHOT_SIZES = "(max-width: 1024px) 180vw, 75vw";

// Il rendering vive nella sezione creativa di /servizi: il link va lì.
const FEATURE_HREF = "/servizi#servizi-creativi";

export default function Services() {
  const { locale } = useLocale();
  const c = copy[locale];

  // Sei voci: le cinque dell'elenco piu' il rendering, che era una riga a sé
  // con una misura propria e ora e' la 06.
  const items = [...c.services, { title: c.featureTitle, copy: c.featureCopy }];
  const alts = [...c.shotAlts, c.featureAlt];

  return (
    <section id="servizi" className="dt-chapter bg-cream">
      <div className="dt-row">
        {/* Testa di capitolo: eyebrow e titolo d2 in colonna stretta. */}
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <TextLines as="h2" className="mt-6 max-w-[24ch] font-display text-d2">
          {c.title}
        </TextLines>
      </div>

      {ROWS.map((row, r) => {
        // La foto passa a destra nelle righe dispari: e' l'unica asimmetria
        // della sezione, dichiarata e ripetuta. A destra serve
        // `justify-self-end` perche' la scatola (42vw) e' piu' larga della
        // colonna della griglia e altrimenti sborderebbe oltre il margine.
        const right = r % 2 === 1;
        const last = r === ROWS.length - 1;
        return (
          <div
            key={row.src}
            className="dt-row mt-[10vh] grid gap-[6vw] lg:grid-cols-2 lg:items-center"
          >
            <Parallax
              speed={-0.04}
              scale={1.03}
              className={`dt-media-half ${right ? "lg:order-2 lg:justify-self-end" : ""}`}
              innerClassName="absolute inset-0"
            >
              <Image
                src={row.src}
                alt={alts[r]}
                fill
                sizes={SHOT_SIZES}
                className="object-cover"
              />
            </Parallax>

            {/* Due voci per riga. Da sm stanno affiancate (mai una pila di sei
                sul telefono); da lg tornano in colonna, perche' accanto alla
                foto la colonna di testo e' larga ~450 px e due titoli d3
                affiancati diventerebbero due strisce di 220 px. */}
            <div className={right ? "lg:pr-[6vw]" : "lg:pl-[6vw]"}>
              <ol className="grid gap-x-[3vw] gap-y-12 sm:grid-cols-2 lg:grid-cols-1">
                {items.slice(r * 2, r * 2 + 2).map((s, j) => {
                  const n = r * 2 + j;
                  return (
                    <li key={s.title}>
                      <Reveal delay={j * 80}>
                        {/* Il numero e' ornamento: l'ordine lo porta gia' <ol>. */}
                        <span
                          aria-hidden
                          className="block font-display text-d1 font-light leading-[0.85] text-stone"
                        >
                          {String(n + 1).padStart(2, "0")}
                        </span>
                        <h3 className="mt-4 font-display text-d3">{s.title}</h3>
                        <p className="mt-3 text-body text-graphite">{s.copy}</p>
                      </Reveal>
                    </li>
                  );
                })}
              </ol>

              {last && (
                <Reveal delay={160}>
                  <Cta href={FEATURE_HREF} variant="ghost" className="mt-10">
                    {c.featureCta}
                  </Cta>
                </Reveal>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
