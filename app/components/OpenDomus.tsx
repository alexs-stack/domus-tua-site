"use client";

import Image from "next/image";
import { useRef } from "react";
import Reveal from "./Reveal";
import CharFlip from "./motion/CharFlip";
import TextLines from "./motion/TextLines";
import LiquidReveal from "./motion/LiquidReveal";
import Parallax from "./motion/Parallax";
import { Play } from "./Icons";
import { Cta } from "./primitives/Cta";
import { SegnoDomusCorner, SegnoTick } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";
import { site } from "../lib/site";
import { youtubeWatch } from "../lib/videos";

const copy = {
  it: {
    eyebrow: "Il nostro format esclusivo",
    title: "Open Domus: un’esperienza preparata per vendere meglio.",
    intro:
      "Non una semplice visita, ma un format proprietario di Domus Tua che unisce preparazione, accoglienza, documentazione e prequalifica. Trasforma la classica visita in un momento consapevole, ordinato e professionale, per chi vende e per chi cerca casa.",
    sellerLabel: "Per chi vende",
    buyerLabel: "Per chi compra",
    sellerBenefits: [
      "Immobile preparato e valorizzato prima dell'evento",
      "Acquirenti prequalificati e visite senza caos",
      "Feedback raccolti e proposta più rapida e concreta",
    ],
    buyerBenefits: [
      "Vedi la casa al suo meglio, con luce e ordine curati",
      "Documentazione e informazioni disponibili già in visita",
      "Nessuna pressione: capisci con calma se è la casa giusta",
    ],
    cta: "Scopri Open Domus",
    cardTitle: "Venduta al primo Open Domus.",
    cardText: "La storia vera di Teresa, raccontata da lei.",
    videoAria: "Guarda la storia di Teresa, venduta al primo Open Domus",
    imageAlt: "Raffaela Rizza con Teresa, cliente che ha venduto al primo Open Domus",
  },
  en: {
    eyebrow: "Our signature format",
    title: "Open Domus: an experience designed to sell better.",
    intro:
      "Not just a viewing, but a format proprietary to Domus Tua that combines preparation, hospitality, documentation and pre-qualification. It turns the classic viewing into a considered, orderly and professional moment, for those who are selling and those who are looking for a home.",
    sellerLabel: "For sellers",
    buyerLabel: "For buyers",
    sellerBenefits: [
      "Property prepared and enhanced ahead of the event",
      "Pre-qualified buyers and viewings free of chaos",
      "Feedback collected and a faster, more concrete offer",
    ],
    buyerBenefits: [
      "See the home at its best, with light and order cared for",
      "Documentation and information available during the viewing",
      "No pressure: understand calmly if it's the right home",
    ],
    cta: "Discover Open Domus",
    cardTitle: "Sold at the very first Open Domus.",
    cardText: "Teresa's true story, told in her own words.",
    videoAria: "Watch Teresa's story, sold at the first Open Domus",
    imageAlt: "Raffaela Rizza with Teresa, the client who sold at the first Open Domus",
  },
  fr: {
    eyebrow: "Notre format signature",
    title: "Open Domus : une expérience pensée pour mieux vendre.",
    intro:
      "Pas une simple visite, mais un format propre à Domus Tua qui allie préparation, accueil, documentation et préqualification. Il transforme la visite classique en un moment réfléchi, ordonné et professionnel, pour ceux qui vendent comme pour ceux qui cherchent un logement.",
    sellerLabel: "Pour les vendeurs",
    buyerLabel: "Pour les acquéreurs",
    sellerBenefits: [
      "Bien préparé et valorisé avant l'événement",
      "Acquéreurs préqualifiés et visites sans chaos",
      "Retours recueillis et offre plus rapide et concrète",
    ],
    buyerBenefits: [
      "Voyez la maison sous son meilleur jour, lumière et ordre soignés",
      "Documentation et informations disponibles dès la visite",
      "Sans pression : comprenez sereinement si c'est la bonne maison",
    ],
    cta: "Découvrir Open Domus",
    cardTitle: "Vendue dès le premier Open Domus.",
    cardText: "La véritable histoire de Teresa, racontée par elle-même.",
    videoAria: "Regardez l'histoire de Teresa, vendue au premier Open Domus",
    imageAlt: "Raffaela Rizza avec Teresa, la cliente qui a vendu au premier Open Domus",
  },
  de: {
    eyebrow: "Unser eigenes Format",
    title: "Open Domus: ein Erlebnis, das auf besseren Verkauf ausgelegt ist.",
    intro:
      "Keine gewöhnliche Besichtigung, sondern ein Domus Tua eigenes Format, das Vorbereitung, Empfang, Dokumentation und Vorqualifizierung vereint. Es verwandelt die klassische Besichtigung in einen bewussten, geordneten und professionellen Moment – für alle, die verkaufen, und für alle, die ein Zuhause suchen.",
    sellerLabel: "Für Verkäufer",
    buyerLabel: "Für Käufer",
    sellerBenefits: [
      "Immobilie vor dem Termin vorbereitet und aufgewertet",
      "Vorqualifizierte Käufer und Besichtigungen ohne Chaos",
      "Feedback gesammelt und ein schnelleres, konkreteres Angebot",
    ],
    buyerBenefits: [
      "Sehen Sie das Zuhause von seiner besten Seite, Licht und Ordnung gepflegt",
      "Unterlagen und Informationen schon bei der Besichtigung verfügbar",
      "Ohne Druck: in Ruhe verstehen, ob es das richtige Zuhause ist",
    ],
    cta: "Open Domus entdecken",
    cardTitle: "Beim ersten Open Domus verkauft.",
    cardText: "Die wahre Geschichte von Teresa, von ihr selbst erzählt.",
    videoAria: "Sehen Sie die Geschichte von Teresa, verkauft beim ersten Open Domus",
    imageAlt: "Raffaela Rizza mit Teresa, der Kundin, die beim ersten Open Domus verkauft hat",
  },
  es: {
    eyebrow: "Nuestro formato exclusivo",
    title: "Open Domus: una experiencia preparada para vender mejor.",
    intro:
      "No una simple visita, sino un formato propio de Domus Tua que combina preparación, acogida, documentación y precualificación. Transforma la visita clásica en un momento consciente, ordenado y profesional, para quien vende y para quien busca casa.",
    sellerLabel: "Para quien vende",
    buyerLabel: "Para quien compra",
    sellerBenefits: [
      "Inmueble preparado y revalorizado antes del evento",
      "Compradores precualificados y visitas sin caos",
      "Comentarios recogidos y una propuesta más rápida y concreta",
    ],
    buyerBenefits: [
      "Ve la casa en su mejor versión, con luz y orden cuidados",
      "Documentación e información disponibles ya en la visita",
      "Sin presión: entiende con calma si es la casa adecuada",
    ],
    cta: "Descubre Open Domus",
    cardTitle: "Vendida en el primer Open Domus.",
    cardText: "La historia real de Teresa, contada por ella misma.",
    videoAria: "Mira la historia de Teresa, vendida en el primer Open Domus",
    imageAlt: "Raffaela Rizza con Teresa, la clienta que vendió en el primer Open Domus",
  },
};

export default function OpenDomus() {
  const { locale } = useLocale();
  const c = copy[locale];

  // Ingresso a cascata delle righe benefici: stato nascosto solo via JS.
  // Replay a ogni passaggio: niente clearProps (romperebbe restart/reverse).
  const benefitsRef = useRef<HTMLDivElement | null>(null);
  useGSAP(
    () => {
      const root = benefitsRef.current;
      if (!root) return;
      const rows = root.querySelectorAll("li");
      if (!rows.length) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.fromTo(
          rows,
          { y: 16, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.06,
            scrollTrigger: { trigger: root, start: "top 85%", toggleActions: "restart none none reverse" },
          }
        );
      });
    },
    { scope: benefitsRef }
  );

  return (
    <section id="open-domus" data-surface="paper" className="relative overflow-hidden bg-paper">
      {/* Coni d'ombra obliqui: bg-paper è la campitura più piatta della home e
          senza di questi il format esclusivo poggia sul nulla.
          Rif. _refs/aurelia (MIT) — vedi docs/effetti-reference.md §2.6. */}
      <div aria-hidden className="dt-godray">
        <span className="dt-godray_beam" style={{ "--gr-x": "18%", "--gr-w": "17vw", "--gr-a": 1 } as React.CSSProperties} />
        <span className="dt-godray_beam" style={{ "--gr-x": "44%", "--gr-w": "26vw", "--gr-a": 0.72 } as React.CSSProperties} />
        <span className="dt-godray_beam" style={{ "--gr-x": "77%", "--gr-w": "13vw", "--gr-a": 0.85 } as React.CSSProperties} />
      </div>
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        {/* TESTA DI CAPITOLO — 2026-08-06. Il titolo stava in mezza griglia a
            48px fissi: su un 1920 leggeva come un sottotitolo. Ora prende
            tutta la colonna a `text-d2` (la scala display del sito) e la
            griglia a due colonne sparisce: sopra il capitolo, sotto la banda.
            CharFlip al posto di TextLines: qui il titolo è breve e il gesto
            giusto è il carattere che gira, non la riga che sale (i due non
            vanno mai sullo stesso elemento).
            `exit` su titolo e intro: risalendo la pagina il capitolo si
            smonta invece di restare fermo.
            Via `balance` dal titolo: il bilanciamento si ricalcola dopo lo
            split di SplitText e fa saltare una riga. */}
        <Reveal delay={100}>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <CharFlip as="h2" delay={0.1} className="mt-5 font-display text-d2 display-tight font-medium text-ink" exit>
          {c.title}
        </CharFlip>
        {/* mt-10 e non mt-6: con `.display-tight` (interlinea .92) le
            discendenti dell'ultima riga del titolo escono dal loro box —
            «meglio.» andava a toccare la prima riga dell'intro. */}
        <TextLines as="p" className="mt-10 max-w-2xl text-[1.02rem] leading-relaxed text-stone" exit>
          {c.intro}
        </TextLines>

        {/* LA BANDA — la foto era `aspect-[4/5]` in mezza griglia, cioè ~560px
            su un contenitore da 1240. Adesso attraversa tutta la colonna e
            sale a ~72svh: è l'«immagine grande» chiesta dal cliente.
            NON è full-bleed, e la ragione è misurata:
            raffaela-founder.jpg è 1024×682, quindi a piena larghezza di
            viewport su un 1920 verrebbe stirata 1.9× (poltiglia). A piena
            COLONNA resta a ~1.15×, che è il limite in cui una foto è ancora
            una foto. Per andare oltre serve un originale da almeno 2000px —
            è una richiesta da girare alla cliente.
            Il LiquidReveal resta esattamente dov'era (è la firma della
            sezione) e la deriva sale da 0.12 a 0.18: una banda larga ha
            bisogno di più corsa per non sembrare incollata. */}
        <Reveal className="mt-14 lg:mt-20">
          <Parallax speed={0.18}>
            <div className="relative rounded-[2rem] border border-line bg-cream p-2">
              <SegnoDomusCorner className="left-3.5 top-3.5 z-10" rotate={0} />
              <a
                href={youtubeWatch(site.videos.openDomus.id)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={c.videoAria}
                className="group relative block aspect-[4/5] overflow-hidden rounded-[calc(2rem-0.5rem)] sm:aspect-[16/10] lg:aspect-auto lg:h-[min(72svh,42rem)]"
              >
                {/* Reveal liquido sul solo media (signature della sezione):
                    link e play restano sopra il velo, mai clippati.

                    IL RIEMPIMENTO STA SULLO SPAN, NON SUL LiquidReveal, ed è
                    un bug vero che qui si chiude: LiquidReveal si stampa
                    addosso `relative ${className}`, quindi passargli
                    `absolute inset-0` produceva la classe doppia
                    "relative absolute". Le utility di posizione di Tailwind
                    NON hanno la specificità dalla loro parte: vince l'ultima
                    scritta nel foglio, e `.relative` sta DOPO `.absolute`.
                    Risultato: il contenitore restava relative, `inset-0` non
                    mordeva, l'altezza collassava a 0 e la foto della sezione
                    semplicemente non c'era (misurato: 1158×0). Con lo span
                    che fa il posizionamento e il figlio a `h-full w-full`
                    non c'è più nessun duello di classi. */}
                <span className="absolute inset-0">
                  <LiquidReveal tone="paper" className="h-full w-full">
                    <Image
                      src="/images/reali/raffaela-founder.jpg"
                      alt={c.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 1180px"
                      className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                  </LiquidReveal>
                </span>
                <span className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-6 w-6" />
                </span>
              </a>
              {/* card flottante — controderiva rispetto alla foto, nessun clip aggiunto */}
              <Parallax
                speed={-0.08}
                className="absolute -bottom-5 left-5 right-5 sm:left-auto sm:right-6 sm:w-64"
              >
                <div className="rounded-2xl border border-line bg-paper px-5 py-4 shadow-[0_30px_60px_-40px_rgba(26,24,22,0.6)]">
                  <p className="font-display text-lg font-medium text-ink">{c.cardTitle}</p>
                  <p className="mt-1 text-sm text-stone">
                    {c.cardText}
                  </p>
                </div>
              </Parallax>
            </div>
          </Parallax>
        </Reveal>

        {/* Doppio valore: Open Domus lavora sia per chi vende sia per chi compra.
            Fuori dal Reveal: le righe entrano in cascata via GSAP (vedi benefitsRef).
            mt generoso: la card flottante scende 20px sotto la cornice. */}
        <div ref={benefitsRef} className="mt-16 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:mt-20">
          {[
            { label: c.sellerLabel, items: c.sellerBenefits },
            { label: c.buyerLabel, items: c.buyerBenefits },
          ].map((grp) => (
            <div key={grp.label}>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-red-dark">
                {grp.label}
              </p>
              <ul className="mt-3 flex flex-col gap-3">
                {grp.items.map((b) => (
                  <li key={b} className="group/row flex items-start gap-3 text-[0.92rem] text-graphite transition-colors duration-300 hover:text-ink">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark transition-colors duration-300 group-hover/row:bg-red group-hover/row:text-cream">
                      <SegnoTick className="h-3 w-3" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Reveal delay={150}>
          <Cta href="#contatti" variant="reveal-cream" size="md" className="mt-10">
            {c.cta}
          </Cta>
        </Reveal>
      </div>
    </section>
  );
}
