"use client";

import { useRef } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import CharFlip from "./motion/CharFlip";
import { Instagram } from "./Icons";
import SocialLinks from "./primitives/SocialLinks";
import { site } from "../lib/site";
import { IframeWidget } from "./WidgetEmbeds";
import { gsap, useGSAP, MQ, dur, stagger } from "../lib/motion/gsap";
import RailProgress from "./motion/RailProgress";
import { useLocale } from "./i18n/LocaleProvider";

/* LA ROTAIA — otto scatti che scorrono di lato mentre la pagina scende.
   Formati e quote deliberatamente disuguali: una fila di riquadri identici
   legge come una griglia messa in orizzontale, non come un feed. `depth` è
   quanto l'immagine pana DENTRO la sua cornice, in direzione contraria alla
   corsa: è la parallasse che dà profondità al nastro.
   Le tessere sono decorative (aria-hidden): il percorso vero verso Instagram
   è il bottone nella colonna di testo, e senza link nel nastro non esiste il
   problema di raggiungere da tastiera una tessera fuori schermo. */
const rail = [
  { src: "/images/premium_01_living_tv_divano.jpg", w: "20vw", ratio: "3 / 4", lift: "-18px", depth: 7 },
  { src: "/images/before_after_02_living_after.jpg", w: "16vw", ratio: "1 / 1", lift: "34px", depth: 4 },
  { src: "/images/rendering_03_master_bedroom_legno.jpg", w: "22vw", ratio: "4 / 5", lift: "-6px", depth: 8 },
  { src: "/images/hero_02_attico_travi_living.jpg", w: "27vw", ratio: "16 / 10", lift: "22px", depth: 5 },
  { src: "/images/home_staging_01_sala_reale_sedie_gialle.jpg", w: "17vw", ratio: "1 / 1", lift: "-30px", depth: 9 },
  { src: "/images/premium_05_living_accenti_senape.jpg", w: "20vw", ratio: "3 / 4", lift: "10px", depth: 4 },
  { src: "/images/rendering_04_camera_luce_naturale.jpg", w: "24vw", ratio: "4 / 3", lift: "-14px", depth: 7 },
  { src: "/images/premium_03_cucina_moderna.jpg", w: "18vw", ratio: "1 / 1", lift: "26px", depth: 5 },
];

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

  const sectionRef = useRef<HTMLElement | null>(null);
  const channelsRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // DUE CONTESTI, NON UNO. Le pill non dipendono dalla larghezza, la rotaia
      // sì: tenerle insieme significherebbe che GSAP reverte e ricostruisce
      // ANCHE le pill a ogni attraversamento dei 1024 (è il contratto di
      // matchMedia — se una qualsiasi condizione cambia, il context intero
      // ricomincia). Su un semplice resize le pill tornerebbero a opacity 0 e,
      // se la sezione è già passata, `toggleActions` non le rigioca: link di
      // navigazione invisibili fino alla rete di sicurezza a 2,5s.
      mm.add(MQ.motionOk, () => {
        // Pill canali: micro-stagger orizzontale. Contengono link → opacity
        // (mai autoAlpha) + reti di sicurezza stile Reveal (focus/timeout).
        // Replay a ogni passaggio: niente clearProps (romperebbe restart/reverse).
        const row = channelsRef.current;
        if (!row) return;
        const pills = gsap.utils.toArray<HTMLElement>(row.querySelectorAll("li"));
        const tween = gsap.fromTo(
          pills,
          { x: -10, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: dur.short,
            ease: "domus",
            stagger: stagger.cards / 2,
            scrollTrigger: { trigger: row, start: "top 85%", toggleActions: "restart none none reverse" },
          }
        );
        const reveal = () => tween.progress(1);
        row.addEventListener("focusin", reveal, { once: true });
        const safety = window.setTimeout(reveal, 2500);
        return () => {
          row.removeEventListener("focusin", reveal);
          window.clearTimeout(safety);
        };
      });

      // La soglia sta nelle condizioni, non in un matchMedia letto a mano:
      // prima era `window.matchMedia("(min-width: 1024px)").matches` letto una
      // volta sola, quindi un tablet ruotato restava col nastro montato (o
      // spento) per sbaglio, e `data-on` non veniva mai tolto scendendo.
      mm.add(`${MQ.motionOk} and ${MQ.lg}`, () => {
        const cleanups: (() => void)[] = [];

        // LA ROTAIA — parallasse orizzontale su due piani.
        // Piano 1: il nastro trasla di tutta la sua eccedenza mentre la sezione
        // attraversa il viewport. Piano 2: dentro ogni cornice l'immagine pana
        // in senso CONTRARIO, di una quota diversa per tessera (`depth`). Sono
        // le due velocità a fare la profondità: un nastro che scorre e basta è
        // solo una fila che si muove.
        // Il pin non serve e non lo vogliamo: la home è già piena di sezioni
        // pinnate e un'altra sarebbe attrito. Il nastro corre nel tempo che la
        // sezione impiega a passare, senza rubare scroll.
        const railEl = railRef.current;
        if (railEl) {
          const track = railEl.querySelector<HTMLElement>(".dt-socialrail_track");
          const pans = gsap.utils.toArray<HTMLElement>(railEl.querySelectorAll(".dt-socialrail_pan"));
          // Sotto lg il nastro resta uno scroll orizzontale nativo: sul touch
          // trascinare è il gesto che la gente si aspetta, e guidarlo dallo
          // scroll verticale glielo toglierebbe. Non serve un ramo: questo
          // context non esiste proprio sotto i 1024.
          if (track) {
            railEl.setAttribute("data-on", "");
            const st = {
              trigger: railEl,
              start: "top 96%",
              end: "bottom 4%",
              scrub: 0.6,
              invalidateOnRefresh: true,
            } as const;
            // Eccedenza ricalcolata a ogni refresh: le larghezze sono in vw.
            const overflow = () => Math.max(0, track.scrollWidth - railEl.clientWidth);
            const move = gsap.fromTo(track, { x: 0 }, { x: () => -overflow(), ease: "none", scrollTrigger: st });
            const pan = gsap.fromTo(
              pans,
              { xPercent: (i, el) => -Number(el.dataset.depth ?? 6) },
              {
                xPercent: (i, el) => Number(el.dataset.depth ?? 6),
                ease: "none",
                scrollTrigger: st,
              }
            );
            cleanups.push(() => {
              railEl.removeAttribute("data-on");
              move.scrollTrigger?.kill();
              move.kill();
              pan.scrollTrigger?.kill();
              pan.kill();
            });
          }
        }

        return () => cleanups.forEach((fn) => fn());
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} data-tone="cream" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        {/* La testa cambia impianto a seconda di cosa la accompagna. Col feed
            iframe resta la vecchia coppia testo|widget. SENZA feed il racconto
            per immagini è passato tutto alla rotaia full-bleed qui sotto, e
            lasciare il pitch in mezza griglia con l'altra metà vuota sarebbe
            un buco: allora il testo si apre in due colonne editoriali — il
            titolo grande a sinistra, il resto a destra. */}
        <div
          className={
            site.embeds.instagramIframe
              ? "grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
              : "grid gap-x-12 gap-y-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end"
          }
        >
          <div>
            {/* Reveal spezzato in due: il titolo splittato resta nudo (niente doppio-hide) */}
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            {/* Testa di capitolo: d2, il gradino delle teste di capitolo, al
                posto dei 48px fissi di prima. La scala a due rami (con e senza
                iframe) non serve più: d2 è già un clamp in vw, si adatta da sé
                alla colonna in cui capita.
                `balance` è VIETATA sui titoli splittati: text-wrap si
                ricalcola dopo lo split di SplitText e fa saltare una riga.
                `display-tight` è unlayered e detta interlinea e tracking. */}
            <CharFlip
              as="h2"
              exit
              className="mt-5 font-display text-d3 display-tight font-medium text-ink"
            >
              {c.title}
            </CharFlip>
          </div>

          {site.embeds.instagramIframe ? (
            <Reveal delay={120}>
              <IframeWidget src={site.embeds.instagramIframe} title={c.feedTitle} ratio={1} />
            </Reveal>
          ) : null}

          <Reveal delay={100}>
            <p className="max-w-md text-[1.02rem] leading-relaxed text-stone">{c.subcopy}</p>

            <a
              href={site.social.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-7 inline-flex items-center gap-3 rounded-full border border-line bg-paper py-2.5 pl-3 pr-5 text-sm font-semibold text-ink transition-all duration-300 hover:border-red"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red text-white">
                <Instagram className="h-5 w-5" />
              </span>
              {site.social.instagram.handle}
            </a>

            <div ref={channelsRef} className="mt-7">
              <SocialLinks ariaLabel={c.channelAria} />
            </div>
          </Reveal>
        </div>
      </div>

      {/* LA ROTAIA — full-bleed, fuori dal contenitore: il nastro deve toccare
          i due bordi dello schermo, altrimenti non è un nastro ma una riga. */}
      {!site.embeds.instagramIframe && (
        <div className="relative">
          <div ref={railRef} className="dt-socialrail" aria-hidden>
            <ul className="dt-socialrail_track">
              {rail.map((t) => (
                <li
                  key={t.src}
                  className="dt-socialrail_item"
                  style={
                    { "--w": t.w, "--ratio": t.ratio, "--lift": t.lift } as React.CSSProperties
                  }
                >
                  <span className="dt-socialrail_frame">
                    {/* Il pannello è più largo della cornice: è lo spazio in cui
                        l'immagine pana senza mai scoprire un bordo. */}
                    <span className="dt-socialrail_pan" data-depth={t.depth}>
                      <Image
                        src={t.src}
                        alt=""
                        fill
                        sizes="(max-width: 1023px) 60vw, 30vw"
                        className="photo-warm object-cover"
                      />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* L'INVITO DEL NASTRO (sotto i 1024, dove comanda il dito). La barra
              nativa è nascosta apposta, quindi niente diceva che il nastro
              continua oltre il bordo destro. In sovrimpressione e non in
              flusso: la rotaia tiene già in cassa il suo `padding-bottom`
              (clamp 2.5→4.5rem, l'aria per le quote disuguali delle tessere),
              e l'indicatore si siede LÌ invece di allungare la sezione — su
              una home che su un telefono è già lunga 46 schermate, un'aggiunta
              che non costa una riga di pagina è l'unica onesta.
              Il wrapper esiste solo per dargli quel riferimento: `relative` non
              può stare sulla rotaia, che è il contenitore che scorre — un
              assoluto dentro uno scroller scorrerebbe col contenuto. */}
          <RailProgress scroller={railRef} className="absolute inset-x-0 bottom-4" />
        </div>
      )}
    </section>
  );
}
