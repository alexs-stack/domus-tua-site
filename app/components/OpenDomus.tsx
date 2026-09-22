"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import RevealGroup from "./motion/RevealGroup";
import HorizonScroller from "./motion/HorizonScroller";
import SplitTitle from "./motion/SplitTitle";
import SplitChars from "./motion/SplitChars";
import Lead from "./motion/Lead";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import FotoSlide from "./motion/FotoSlide";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { useRef } from "react";
import { site } from "../lib/site";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";
import { clipSides } from "../lib/motion/clip";
import { CORNICE_LG } from "./motion/ChiusuraFoto";
import { chapters, scrubOf } from "../lib/motion/chapters";
import { FINESTRA, SIZES_FINESTRA, codaDistance, codaFrom, leadDistance } from "../lib/motion/finestra";
// A47 (22 set. 2026): la foto della finestra, il suo cielo e le bande del segno, misurati da
// scripts/media/finestra.mjs sul WebP col cielo trasparente (come tinte.json per le teste).
import foto from "../lib/motion/finestra.json";
// A67: la foto della coda (la piscina lunga, scelta da Alberto), misurata dallo stesso script.
import codaFoto from "../lib/motion/coda.json";

// `cardTitle` e `videoAria` non si rendono più (via la card flottante e il
// player disegnato a mano sulla foto): l'annuncio del play lo scrive
// LazyYouTubeEmbed nella lingua corrente. `title` è diventato `head` + `claim`:
// il titolo lungo occupava quattro righe in mezza colonna e leggeva come un
// errore di impaginazione, la frase è scesa nel paragrafo editoriale.
// `villaAlt` descrive la foto della finestra in home (A19, spec 2026-09-13 §7.5):
// quel che si vede, senza luoghi né frasi sulla vendita. Da A46 il cielo della foto è
// trasparente e al suo posto c'è la carta: l'alt non nomina più «un cielo azzurro».
// `stairs` è il titolo a gradini della coda (A66) e `codaAlt` la sua foto (A67).
const copy = {
  it: {
    eyebrow: "Il nostro format esclusivo",
    head: "Open Domus.",
    claim: "Un’esperienza preparata per vendere meglio.",
    intro:
      "Un format proprietario che unisce preparazione, accoglienza, documentazione e prequalifica: la visita diventa un momento ordinato e consapevole, per chi vende e per chi cerca casa.",
    sellerLabel: "Per chi vende",
    buyerLabel: "Per chi compra",
    stairs: ["Per chi vende", "e per chi", "compra"],
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
    villaAlt: "Facciata a terrazze bianche di una residenza contemporanea che sale, con le pergole di legno, il glicine in fiore, il basamento in travertino e le colline",
    codaAlt: "Piscina lunga davanti a una villa bianca col gelsomino sui pilastri, i cipressi e le colline",
  },
  en: {
    eyebrow: "Our signature format",
    head: "Open Domus.",
    claim: "An experience designed to sell better.",
    intro:
      "A proprietary format combining preparation, hospitality, documentation and pre-qualification: the viewing becomes an orderly, considered moment, for sellers and for buyers.",
    sellerLabel: "For sellers",
    buyerLabel: "For buyers",
    stairs: ["For sellers", "and for", "buyers"],
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
    villaAlt: "White terraced facade of a contemporary residence rising up, with wooden pergolas, wisteria in bloom, a travertine base and the hills",
    codaAlt: "A long pool in front of a white villa with jasmine on the pillars, cypresses and the hills",
  },
  fr: {
    eyebrow: "Notre format signature",
    head: "Open Domus.",
    claim: "Une expérience pensée pour mieux vendre.",
    intro:
      "Un format propre à Domus Tua qui allie préparation, accueil, documentation et préqualification : la visite devient un moment ordonné et réfléchi, pour ceux qui vendent comme pour ceux qui cherchent.",
    sellerLabel: "Pour les vendeurs",
    buyerLabel: "Pour les acquéreurs",
    stairs: ["Pour les vendeurs", "et pour les", "acquéreurs"],
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
    villaAlt: "Façade en terrasses blanches d’une résidence contemporaine qui s’élève, avec ses pergolas en bois, la glycine en fleurs, le soubassement en travertin et les collines",
    codaAlt: "Une longue piscine devant une villa blanche au jasmin sur les piliers, les cyprès et les collines",
  },
  de: {
    eyebrow: "Unser eigenes Format",
    head: "Open Domus.",
    claim: "Ein Erlebnis, das auf besseren Verkauf ausgelegt ist.",
    intro:
      "Ein eigenes Format, das Vorbereitung, Empfang, Dokumentation und Vorqualifizierung vereint: Die Besichtigung wird zu einem geordneten, bewussten Moment – für Verkäufer wie für Suchende.",
    sellerLabel: "Für Verkäufer",
    buyerLabel: "Für Käufer",
    stairs: ["Für Verkäufer", "und für", "Käufer"],
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
    villaAlt: "Weiße Terrassenfassade einer modernen Residenz, die in die Höhe steigt, mit Holzpergolen, blühender Glyzinie, Travertinsockel und den Hügeln",
    codaAlt: "Ein langer Pool vor einer weißen Villa mit Jasmin an den Pfeilern, Zypressen und den Hügeln",
  },
  es: {
    eyebrow: "Nuestro formato exclusivo",
    head: "Open Domus.",
    claim: "Una experiencia preparada para vender mejor.",
    intro:
      "Un formato propio que combina preparación, acogida, documentación y precualificación: la visita se convierte en un momento ordenado y consciente, para quien vende y para quien busca casa.",
    sellerLabel: "Para quien vende",
    buyerLabel: "Para quien compra",
    stairs: ["Para quien vende", "y para quien", "compra"],
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
    villaAlt: "Fachada de terrazas blancas de una residencia contemporánea que se eleva, con pérgolas de madera, la glicina en flor, el basamento de travertino y las colinas",
    codaAlt: "Una piscina larga delante de una villa blanca con jazmín en los pilares, cipreses y las colinas",
  },
};

// Il poster è il fotogramma della storia di Teresa: 1280×510, cioè 2,5:1. Dentro una scatola
// 16:9 con `object-cover` viene reso largo 1,41 volte la scatola, quindi i pixel che servono
// non sono quelli della colonna.
const TERESA_POSTER = "/images/reali/open-domus-teresa.jpg";
const TERESA_SIZES = "(max-width:1024px) 141vw, 60vw";

/** I marcatori del segno (D34, tema.ts): uno per banda scura della foto, in percentuale dell'altezza. */
function Bande({ segno }: { segno: number[][] }) {
  return (
    <>
      {segno.map(([da = 0, a = 0]) => (
        <span
          key={`${da}-${a}`}
          aria-hidden
          data-bg="foto"
          className="dt-od_soggetto"
          style={{ top: `${(da * 100).toFixed(2)}%`, bottom: `${((1 - a) * 100).toFixed(2)}%` }}
        />
      ))}
    </>
  );
}

type Props = {
  /** Il nastro della finestra (A57/A58): solo in home (D28). /metodo e /open-domus rendono il capitolo senza. */
  finestra?: boolean;
};

export default function OpenDomus({ finestra = false }: Props) {
  const { locale } = useLocale();
  const c = copy[locale];
  // Uno span nascosto nel pannello della coda per trovare la sezione del nastro (HorizonScroller tiene il
  // suo ref): lo schema di ChiusuraFoto, senza un wrapper in più nel DOM.
  const codaRef = useRef<HTMLSpanElement | null>(null);

  // A68 (Alberto, 22 set. 2026, sera: «all'uscita, come nelle altre foto lunghe alte, si chiudesse con
  // l'animazione»): la chiusura in cartolina della coda. Finita la coda lo schermo si sgancia e sale con la
  // pagina; da lì, finché il fondo della sezione non arriva al 10 % del viewport, la scatola della piscina
  // si ritira nella cornice della cartolina (8 % sopra e sotto, 22 % ai lati: CORNICE_LG di ChiusuraFoto,
  // la meccanica del Congedo), con lo scrub e l'ease dtCartolina. Il clip sta sulla scatola `.dt-od_coda`,
  // che non è antenata di nulla di sticky; a riposo non si scrive nulla. Solo col nastro (MQ.corridor).
  useGSAP(
    () => {
      const root = codaRef.current?.closest<HTMLElement>(".dt-od") ?? null;
      const coda = root?.querySelector<HTMLElement>(".dt-od_coda");
      if (!root || !coda) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.corridor, () => {
        const f = { p: 0 };
        const k = CORNICE_LG;
        const dipingi = () => {
          if (f.p <= 0) {
            coda.style.removeProperty("clip-path");
            return;
          }
          coda.style.clipPath = clipSides(+(k.t * f.p).toFixed(3), +(k.r * f.p).toFixed(3), +(k.b * f.p).toFixed(3), +(k.l * f.p).toFixed(3));
        };
        const tl = gsap.timeline({
          defaults: { ease: "dtCartolina", immediateRender: false },
          // A79 (Alberto: «stessa cosa qua, a questa altezza dell'immagine», la piscina a tutto schermo nella
          // coda): la cartolina comincia quando il fondo della sezione sta ancora 1,3 schermi sotto il bordo
          // (all'inizio della discesa della coda) e finisce al 70 %: con la piscina che riempie lo schermo (il
          // fondo a 1,5 schermi) è già a metà. Prima partiva allo sgancio e finiva al 10 %, a foto uscita.
          scrollTrigger: { trigger: root, start: "bottom 230%", end: "bottom 70%", scrub: 0.9, invalidateOnRefresh: true },
        });
        tl.fromTo(f, { p: 0 }, { p: 1, duration: 1, onUpdate: dipingi });
        return () => {
          coda.style.removeProperty("clip-path");
        };
      });
    },
    { dependencies: [locale, finestra], revertOnUpdate: true },
  );
  // A78 (Alberto, 22 set. 2026, notte: «la scritta Open Domus deve essere animata dal centro verso
  // l'esterno, con GSAP, come se uscisse dal centro e si allargasse verso sinistra e destra»): quando il
  // titolo entra in scena la scritta si apre dal centro (un clip-path a poligono dalla linea di mezzo ai bordi) e le lettere,
  // raccolte verso il centro, scivolano ai loro posti a sinistra e a destra (le più vicine al centro per
  // prime), expo.out in 1,6 s. Le distanze sono misurate con offsetLeft (la trasformata del nastro non le
  // tocca) e rimisurate a ogni entrata; uscito sotto lo schermo il titolo si riarma, così risalendo e
  // riscendendo si riapre. Solo con motion ok: con reduced-motion e senza JS la scritta è intera e ferma.
  const titoloRef = useRef<HTMLHeadingElement | null>(null);
  useGSAP(
    () => {
      const h2 = titoloRef.current;
      if (!h2) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const lettere = gsap.utils.toArray<HTMLElement>(".dt-c", h2);
        if (lettere.length === 0) return;
        const verso = (el: HTMLElement) => h2.offsetWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
        const tl = gsap
          .timeline({ paused: true, defaults: { duration: 1.6, ease: "expo.out" } })
          // Un poligono e non `inset(`: i tween a tempo con inset sono dei gesti dichiarati (chapters.test, D18).
          .fromTo(h2, { clipPath: "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)" }, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }, 0)
          .fromTo(
            lettere,
            { x: (_: number, el: HTMLElement) => verso(el) * 0.85, opacity: 0 },
            { x: 0, opacity: 1, stagger: { each: 0.035, from: "center" } },
            0,
          );
        // Si osserva la cornice e non l'h2: col clip chiuso l'h2 ha area zero e per l'IntersectionObserver
        // non entra mai. Parte quando la cima della cornice (dove posa il titolo) passa il 75 % dello schermo.
        const cornice = h2.parentElement ?? h2;
        const io = new IntersectionObserver(
          (voci) => {
            for (const v of voci) {
              if (v.isIntersecting) {
                if (tl.progress() === 0) tl.invalidate().restart();
              } else if (v.boundingClientRect.top > window.innerHeight) {
                tl.pause(0);
              }
            }
          },
          { threshold: 0, rootMargin: "0px 0px -25% 0px" },
        );
        io.observe(cornice);
        return () => {
          io.disconnect();
          tl.kill();
          gsap.set([h2, ...lettere], { clearProps: "clipPath,transform,opacity" });
        };
      });
    },
    { dependencies: [locale, finestra], revertOnUpdate: true },
  );

  const lists = [
    { title: c.sellerLabel, items: c.sellerBenefits },
    { title: c.buyerLabel, items: c.buyerBenefits },
  ];

  // RIVISTA BIANCA (2026-09-11): la storia di Teresa era una FOTO 1280×510 schiacciata in un
  // quadrato da 589 px — ne restava il 40 % (ingrandito 1,15 volte) e le due donne erano tagliate
  // alla fronte. Ora è il video da cui quel fotogramma è preso, in una scatola 16:9 larga come la
  // mezza foto del resto della home: il ritaglio toglie solo larghezza (l'altezza resta intera, i
  // volti sono interi) e la sorgente scende a 0,67x — nessun ingrandimento.
  // A77 (Alberto, 22 set. 2026, notte: «ora fai la stessa cosa anche per questa sezione, con le preview di
  // YouTube»): le facciate dei video scorrono da sole una sopra l'altra come le foto di «Perché Domus Tua»
  // (FotoSlide, sosta 1 s): prima Teresa col suo poster, poi le tre video recensioni del canale con la
  // copertina di YouTube. Un clic sul play ferma il giro su quel video. Le facciate restano quelle di
  // sempre (click-to-load, youtube-nocookie: nessuna richiesta al player prima del play, solo le copertine
  // da i.ytimg.com come nel muro delle voci).
  const lastreVideo = [
    {
      key: site.videos.openDomus.id,
      node: <LazyYouTubeEmbed id={site.videos.openDomus.id} title={site.videos.openDomus.title} poster={TERESA_POSTER} posterSizes={TERESA_SIZES} />,
    },
    ...site.videos.reviews.map((v) => ({
      key: v.id,
      node: <LazyYouTubeEmbed id={v.id} title={v.title} posterSizes="(max-width:1024px) 100vw, 42vw" />,
    })),
  ];
  const cta = (
    <Reveal role="still">
      <Cta href="/open-domus" variant="ghost">
        {c.cta}
      </Cta>
    </Reveal>
  );

  if (!finestra) {
    return (
      <section id="open-domus" className="dt-chapter bg-cream">
        <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-center">
          {/* La scatola è più larga della colonna della griglia (42vw contro ~39vw): a destra deve
              allinearsi alla fine, o sborda dal margine. */}
          <FotoSlide className="lg:order-2 lg:justify-self-end" boxClassName="dt-media-half aspect-video!" lastre={lastreVideo} />
          <div className="lg:pr-[6vw]">
            <Reveal role="ctn">
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            <SplitTitle as="h2" className="mt-6 font-display text-d2">
              {c.head}
            </SplitTitle>
            <Lead className="mt-6">{c.claim}</Lead>
            <Reveal role="ctn">
              <p className="mt-6 max-w-[60ch] text-body text-graphite">{c.intro}</p>
            </Reveal>
          </div>
        </div>
        {/* Doppio valore: chi vende e chi compra, due liste col trattino rosso. La seconda colonna è
            larga quanto la scatola video (42vw, max 640) e quindi comincia sulla SUA stessa linea:
            con due colonne uguali sarebbe partita 43 px più a destra del bordo del video — uno
            sfasamento che si vede e non si spiega. */}
        <div className="dt-row mt-[5vh] grid gap-[6vw] sm:grid-cols-2 lg:grid-cols-[1fr_min(42vw,640px)]">
          {lists.map((list) => (
            <div key={list.title}>
              <SplitTitle as="h3" font="display-400" className="font-display text-d4 font-light">
                {list.title}
              </SplitTitle>
              <ul className="mt-4 flex flex-col gap-2 text-body text-graphite">
                {list.items.map((it) => (
                  <li key={it} className="flex gap-3">
                    <span aria-hidden className="mt-3 h-px w-6 shrink-0 bg-red" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Il rilancio sta in fondo, a tutta larghezza: nella mezza colonna l'etichetta (44
            caratteri) andava a capo e la freccia restava appesa a destra della prima riga. */}
        <div className="dt-row mt-[4vh]">{cta}</div>
      </section>
    );
  }

  /* LA FINESTRA — un NASTRO come «Tra la Pineta e Milano» (A57 e A58 di Alberto, 22 set. 2026,
     sera, poi A65-A67 la stessa sera; finestra.ts; CSS in globals.css, «LA FINESTRA DI OPEN
     DOMUS»). Tre pannelli di 100vw:
     1. la facciata che sale, 9:16, INTERA, col cielo trasparente che è la carta e il titolo del
        capitolo in inchiostro sopra (A45, A46, A47). Nel corridoio (HorizonScroller, da 1024×640
        con motion ok) lo schermo si aggancia con la foto a schermo intero DA SUBITO — niente
        tende, niente stage in scala (A58) — e la SALITA muove solo la scatola della foto: il
        titolo resta fermo e il tetto delle terrazze gli passa dietro finché non arriva a metà
        delle lettere (A65, `FINESTRA.copri`); da lì il nastro scorre di lato e la foto esce a
        sinistra; niente chiusura in cartolina (A58);
     2. il claim del format in d2 (A66: «le scritte sono troppo piccole, rendile grandi») con
        l'intro in misura lead e il video di Teresa, che entra col sipario del nastro
        (`data-horizon-slide`: clip da sinistra e scala 1,15 → 1, lo stesso gesto del territorio);
     3. la CODA (A67): la piscina lunga no-bg a tutta larghezza (coda.json, scelta da Alberto),
        arrivata da destra col sipario e già alzata (il soggetto al 55 % dello schermo), e sopra
        di lei, sulla carta del cielo, il titolo a gradini in parallasse (A66, come «Tra la Pineta
        e Milano»), le due liste in misura lead e il rilancio; finito il nastro, la foto e le
        scritte scendono 1:1 con lo scroll (`tail` di HorizonScroller) finché il fondo della foto
        non tocca il fondo dello schermo, e lì la sezione finisce.
     La firma resta quella del capitolo (chapters.ts `finestra`: dtInOut, scrub 0,15 — D18: due
     capitoli non condividono ease né scrub, quindi il nastro della finestra non copia le cifre di
     `storia` ma il gesto); salita e coda sono lineari (secondarie). I testi dei pannelli sono
     gruppi del motore dei reveal, che nel nastro entrano quando sono in scena (spec §2.4). Sotto
     la soglia, con reduced-motion e senza JS i tre pannelli stanno in colonna, le foto sono intere
     e nulla è nascosto. I marcatori del segno (`.dt-od_soggetto`, `data-bg="foto"`) sono le bande
     scure di finestra.json e coda.json e viaggiano con le foto: elementsFromPoint legge la
     geometria trasformata. */
  return (
    <HorizonScroller
      id="open-domus"
      corridor="finestra"
      refreshKey={locale}
      className="dt-od bg-cream"
      ease={chapters.finestra.signature.ease}
      scrub={scrubOf("finestra")}
      lead={{
        selector: ".dt-od_window",
        distance: (el) => {
          // A65: il tetto arriva a metà delle lettere del titolo, che sta fermo nella cornice.
          const titolo = el.parentElement?.querySelector<HTMLElement>(".dt-od_titolo");
          const copri = titolo ? titolo.offsetTop + FINESTRA.copri * titolo.offsetHeight : 0;
          return leadDistance({ cima: foto.cielo.cima, fotoH: el.offsetHeight, copri });
        },
      }}
      tail={{
        selector: ".dt-od_coda_foto",
        also: ".dt-od_coda_testo",
        from: (el, screen) => codaFrom({ cima: codaFoto.cielo.cima, fotoH: el.offsetHeight, vh: screen.clientHeight }),
        distance: (el, screen) =>
          codaDistance({
            fotoH: el.offsetHeight,
            vh: screen.clientHeight,
            from: codaFrom({ cima: codaFoto.cielo.cima, fotoH: el.offsetHeight, vh: screen.clientHeight }),
          }),
      }}
    >
      <div className="dt-horizon_panel dt-od_panel dt-od_panel--foto">
        {/* La sezione «Architecture» di era-residence (A45): dentro la cornice, il titolo del capitolo,
            enorme, appoggiato al bordo alto della foto, in INCHIOSTRO sul cielo trasparente che è la
            carta (A46). L'h2 sta prima della foto nel DOM (l'ordine di lettura) e sopra di lei nello
            stacking: nella salita (A65) la scatola della foto gli passa dietro. */}
        <div className="dt-od_cornice">
          {/* A78: le lettere per l'apertura dal centro (useGSAP qui sopra); il nome leggibile nello sr-only. */}
          <h2 ref={titoloRef} className="dt-od_titolo font-display">
            <span className="sr-only">{c.head.replace(/\.$/, "")}</span>
            <span aria-hidden className="block">
              <SplitChars font="display-500" locale={locale} upper>
                {c.head.replace(/\.$/, "")}
              </SplitChars>
            </span>
          </h2>
          <div className="dt-od_window">
            <Image src={foto.file} alt={c.villaAlt} fill sizes={SIZES_FINESTRA} className="object-cover" style={{ objectPosition: "50% 0%" }} />
            <Bande segno={foto.segno} />
          </div>
        </div>
      </div>

      <div className="dt-horizon_panel dt-od_panel dt-od_panel--claim relative flex items-center">
        {/* La riga a due colonne del sito, come il manifesto del nastro: a sinistra occhiello, claim in
            d2 (A66) e intro in misura lead; a destra il video di Teresa nella metà 16:9, col sipario. In
            colonna (sotto la soglia) il pannello prende il passo dei blocchi. */}
        <div className="dt-row grid w-full gap-[6vw] py-20 lg:grid-cols-2 lg:items-center lg:py-0 [.dt-horizon:not([data-on])_&]:lg:py-[8vh]">
          <RevealGroup className="lg:pr-[4vw]">
            <Reveal role="ctn">
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            <SplitTitle as="h3" className="mt-6 font-display text-d2">
              {c.claim}
            </SplitTitle>
            <Lead className="mt-6 max-w-[38ch]">{c.intro}</Lead>
          </RevealGroup>
          {/* A77: le facciate dei video scorrono da sole (FotoSlide porta il sipario del nastro e la zona foto). */}
          <FotoSlide className="lg:justify-self-end" boxClassName="dt-media-half aspect-video!" lastre={lastreVideo} />
        </div>
      </div>

      <div className="dt-horizon_panel dt-od_panel dt-od_panel--coda">
        {/* Le scritte della coda (A66): il titolo a gradini (data-horizon-stair: parallasse contraria del
            nastro), le due liste in misura lead con la loro etichetta e il rilancio. Nel nastro posano
            sulla carta del cielo della piscina e scendono con lei; in colonna stanno prima della foto. */}
        <div className="dt-od_coda_testo dt-row py-20 [.dt-horizon:not([data-on])_&]:lg:py-[8vh]">
          <h3 className="font-display leading-[0.95] tracking-[-0.01em]">
            {c.stairs.map((line, i) => (
              <span
                key={line}
                data-horizon-stair
                className={`block text-[clamp(2.6rem,7vw,6.5rem)] ${i === 1 ? "lg:ml-[9vw]" : i === 2 ? "lg:ml-[4vw]" : ""}`}
              >
                {line}
              </span>
            ))}
          </h3>
          <RevealGroup className="mt-8 grid gap-[3vw] sm:grid-cols-2">
            {lists.map((list) => (
              <div key={list.title}>
                <Reveal>
                  <span className="block text-ui font-medium uppercase tracking-[0.12em] text-graphite">{list.title}</span>
                </Reveal>
                <ul className="mt-3 flex flex-col gap-2 text-lead text-graphite">
                  {list.items.map((it) => (
                    <Reveal key={it} as="li" className="flex gap-3">
                      <span aria-hidden className="mt-[0.7em] h-px w-6 shrink-0 bg-red" />
                      {it}
                    </Reveal>
                  ))}
                </ul>
              </div>
            ))}
          </RevealGroup>
          <div className="mt-8">{cta}</div>
        </div>
        <span ref={codaRef} hidden data-chiusura-coda />
        <div data-horizon-slide data-bg="foto" className="dt-od_coda">
          <div data-horizon-slide-img className="dt-od_coda_foto">
            <Image src={codaFoto.file} alt={c.codaAlt} fill sizes={SIZES_FINESTRA} className="object-cover" style={{ objectPosition: "50% 0%" }} />
            <Bande segno={codaFoto.segno} />
          </div>
        </div>
      </div>
    </HorizonScroller>
  );
}
