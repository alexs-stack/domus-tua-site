"use client";

// Paths — "Due percorsi, un solo metodo", riscritto (2026-08-04) sulla
// grammatica di moussamamadou/scroll-trigger-gsap-section: un fondale pinnato
// col titolo gigante e poi ogni percorso è una PAGINA PIENA che si alza dal
// basso (clip-path inset 100%→0, in scrub) — lo stesso gesto della cupola di
// "Perché scegliere Domus Tua", qui al servizio della scelta vendo/compro.
// Dentro ogni pagina: la foto respira (scale 1.35→1.18), le righe del titolo
// salgono dai loro binari (data-line del riferimento: yPercent 120 + rotate),
// i tre punti scivolano dentro dal lato del percorso (come i video del
// riferimento) e il percorso precedente si vela quando arriva il successivo.
// Meccanica: sticky-screen già collaudata dal sito (dt-wall/dt-starrev) al
// posto dei work_item `position:fixed` del riferimento — niente trappole di
// stacking con main/footer-uncover.
// reduced-motion / no-JS: intro + pannelli in colonna, tutto visibile e
// statico ([data-on] arriva solo via JS, desktop ≥1024).
// Mobile/tablet con motion (Fase 2 "parità mobile", 2026-08-11): la salita
// senza il corridoio — un sipario per pannello che scopre VERSO IL BASSO e i
// tre punti che entrano dai lati opposti, in una timeline sola per pannello.
// Anche lì niente [data-on]: nessuna altezza cambia, nessun refresh da
// rimettere in conto.
import Image from "next/image";
import SurfaceVeil from "./motion/SurfaceVeil";
import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import Fioritura from "./motion/Fioritura";
import { Cta } from "./primitives/Cta";
import { Check } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { getLenis } from "./motion/SmoothScroll";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger, dist } from "../lib/motion/gsap";

gsap.registerPlugin(SplitText);

const paths = [
  {
    id: "vendi",
    href: "/vendi",
    image: "/images/reali/consulenza.jpg",
  },
  {
    id: "acquista",
    href: "/acquista",
    image: "/images/reali/villa-pool.jpg",
  },
] as const;

const INTRO_IMG = "/images/reali/raffaela-team-sede.jpg";

const copy = {
  it: {
    eyebrow: "Due percorsi, un solo metodo",
    heading: "Che tu venda o acquisti, il nostro lavoro è proteggere le tue scelte.",
    introAlt: "Il team Domus Tua nella sede di Tradate",
    paths: {
      vendi: {
        tag: "Per chi vende",
        title: "Vendi casa con metodo, non con improvvisazione.",
        copy: "Valutiamo, prepariamo, raccontiamo e promuoviamo il tuo immobile con un percorso pensato per ridurre stress, tempi morti e incertezze.",
        points: [
          "Valutazione professionale e documenti verificati",
          "Foto, video, rendering e home staging",
          "Campagne marketing e Open Domus",
        ],
        cta: "Voglio vendere casa",
        alt: "Consulenza Domus Tua: il percorso di vendita spiegato al tavolo",
      },
      acquista: {
        tag: "Per chi acquista",
        title: "Acquista casa con più risposte e meno dubbi.",
        copy: "Ti accompagniamo nelle visite, nella documentazione, nella proposta e in ogni passaggio fino al rogito.",
        points: [
          "Informazioni chiare già prima della visita",
          "Documentazione verificata e trasparente",
          "Supporto su proposta, compromesso e rogito",
        ],
        cta: "Cerco casa",
        alt: "Villa con piscina seguita da Domus Tua",
      },
    },
  },
  en: {
    eyebrow: "Two paths, one method",
    heading: "Whether you sell or buy, our job is to protect your choices.",
    introAlt: "The Domus Tua team at the Tradate office",
    paths: {
      vendi: {
        tag: "For those selling",
        title: "Sell your home with method, not improvisation.",
        copy: "We appraise, prepare, tell the story of and promote your property through a process designed to reduce stress, downtime and uncertainty.",
        points: [
          "Professional appraisal and verified documents",
          "Photography, video, rendering and home staging",
          "Marketing campaigns and Open Domus",
        ],
        cta: "I want to sell my home",
        alt: "Domus Tua consultation: the selling journey explained at the table",
      },
      acquista: {
        tag: "For those buying",
        title: "Buy your home with more answers and fewer doubts.",
        copy: "We guide you through viewings, documentation, the offer and every step up to the closing.",
        points: [
          "Clear information even before the viewing",
          "Verified and transparent documentation",
          "Support with offer, preliminary contract and closing",
        ],
        cta: "I'm looking for a home",
        alt: "Villa with pool listed by Domus Tua",
      },
    },
  },
  fr: {
    eyebrow: "Deux parcours, une seule méthode",
    heading: "Que vous vendiez ou achetiez, notre métier est de protéger vos choix.",
    introAlt: "L'équipe Domus Tua dans l'agence de Tradate",
    paths: {
      vendi: {
        tag: "Pour ceux qui vendent",
        title: "Vendez votre bien avec méthode, pas à l'improviste.",
        copy: "Nous évaluons, préparons, mettons en valeur et faisons la promotion de votre bien grâce à un parcours pensé pour réduire le stress, les temps morts et les incertitudes.",
        points: [
          "Évaluation professionnelle et documents vérifiés",
          "Photos, vidéos, rendus et home staging",
          "Campagnes marketing et Open Domus",
        ],
        cta: "Je veux vendre mon bien",
        alt: "Consultation Domus Tua : le parcours de vente expliqué à la table",
      },
      acquista: {
        tag: "Pour ceux qui achètent",
        title: "Achetez votre bien avec plus de réponses et moins de doutes.",
        copy: "Nous vous accompagnons lors des visites, dans les démarches, dans l'offre et à chaque étape jusqu'à la signature.",
        points: [
          "Des informations claires dès avant la visite",
          "Une documentation vérifiée et transparente",
          "Un accompagnement pour l'offre, le compromis et la signature",
        ],
        cta: "Je cherche un bien",
        alt: "Villa avec piscine proposée par Domus Tua",
      },
    },
  },
  de: {
    eyebrow: "Zwei Wege, eine Methode",
    heading: "Ob Sie verkaufen oder kaufen: Unsere Aufgabe ist es, Ihre Entscheidungen zu schützen.",
    introAlt: "Das Domus Tua Team im Büro in Tradate",
    paths: {
      vendi: {
        tag: "Für Verkäufer",
        title: "Verkaufen Sie Ihre Immobilie mit Methode, nicht mit Improvisation.",
        copy: "Wir bewerten, bereiten vor, inszenieren und bewerben Ihre Immobilie mit einem Ablauf, der Stress, Leerlauf und Unsicherheiten reduziert.",
        points: [
          "Professionelle Bewertung und geprüfte Unterlagen",
          "Fotos, Videos, Renderings und Home Staging",
          "Marketingkampagnen und Open Domus",
        ],
        cta: "Ich möchte meine Immobilie verkaufen",
        alt: "Domus Tua Beratung: der Verkaufsweg, am Tisch erklärt",
      },
      acquista: {
        tag: "Für Käufer",
        title: "Kaufen Sie Ihre Immobilie mit mehr Antworten und weniger Zweifeln.",
        copy: "Wir begleiten Sie bei Besichtigungen, bei den Unterlagen, beim Angebot und bei jedem Schritt bis zum Notartermin.",
        points: [
          "Klare Informationen schon vor der Besichtigung",
          "Geprüfte und transparente Unterlagen",
          "Unterstützung bei Angebot, Vorvertrag und Notartermin",
        ],
        cta: "Ich suche eine Immobilie",
        alt: "Villa mit Pool im Angebot von Domus Tua",
      },
    },
  },
  es: {
    eyebrow: "Dos recorridos, un solo método",
    heading: "Tanto si vendes como si compras, nuestro trabajo es proteger tus decisiones.",
    introAlt: "El equipo Domus Tua en la oficina de Tradate",
    paths: {
      vendi: {
        tag: "Para quien vende",
        title: "Vende tu casa con método, no con improvisación.",
        copy: "Valoramos, preparamos, contamos y promocionamos tu inmueble con un recorrido pensado para reducir el estrés, los tiempos muertos y la incertidumbre.",
        points: [
          "Valoración profesional y documentos verificados",
          "Fotos, vídeos, renders y home staging",
          "Campañas de marketing y Open Domus",
        ],
        cta: "Quiero vender mi casa",
        alt: "Consultoría Domus Tua: el recorrido de venta explicado en la mesa",
      },
      acquista: {
        tag: "Para quien compra",
        title: "Compra tu casa con más respuestas y menos dudas.",
        copy: "Te acompañamos en las visitas, en la documentación, en la oferta y en cada paso hasta la firma.",
        points: [
          "Información clara ya antes de la visita",
          "Documentación verificada y transparente",
          "Apoyo en la oferta, el contrato preliminar y la firma",
        ],
        cta: "Busco casa",
        alt: "Villa con piscina ofrecida por Domus Tua",
      },
    },
  },
} as const;

export default function Paths() {
  const { locale } = useLocale();
  const c = copy[locale];
  const sectionRef = useRef<HTMLElement | null>(null);
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const runway = runwayRef.current;
      const screen = screenRef.current;
      if (!section || !runway || !screen) return;

      const mm = gsap.matchMedia();
      // `lg` e non `desktop`: questo è un set piece pinnato da 520vh, a 768
      // le due pagine piene si mangerebbero il contenuto. Il ramo qui sotto è
      // il gemello mobile, e dice lo stesso gesto senza il corridoio.
      mm.add({ desktop: MQ.lg, motionOk: MQ.motionOk }, (ctx) => {
        const cond = ctx.conditions as { desktop: boolean; motionOk: boolean };
        if (!cond.motionOk) return;

        const panels = gsap.utils.toArray<HTMLElement>("[data-paths-panel]", screen);

        // ── Telefono e tablet: la salita, senza il corridoio ──────────────
        // Il desktop dice "due strade, e ne scegli una" con due pagine piene
        // che si alzano e i punti che entrano da lati OPPOSTI. A 390px quel
        // mirroring non esiste: `justify-start`/`justify-end` non spostano
        // nulla perché `max-w-xl` riempie già la colonna. Quindi la lettura
        // "due strade" sul telefono la reggono SOLO i punti, ed è lì che va
        // speso il budget. Niente [data-on], niente runway da 520vh, nessun
        // ScrollTrigger.refresh(): qui non cambia nessuna altezza.
        // Ciò che NON scende quaggiù è lo SplitText dei due titoli: TextLines
        // è già la casa di un reveal a righe e gira sui telefoni — mai due
        // split sullo stesso testo.
        if (!cond.desktop) {
          const offs: Array<() => void> = [];

          // UNA RIMISURA, UNA SOLA, QUANDO I FONT SONO ARRIVATI.
          // `invalidateOnRefresh` da solo non basta: ricalcola le righe di
          // partenza a ogni refresh, ma se nessuno chiama un refresh dopo che
          // il documento è cresciuto, ricalcola sempre sugli stessi numeri
          // sbagliati. E il documento cresce: ~238px dopo l'idratazione,
          // quando i font si sostituiscono e il testo si riflette.
          // Misurato prima di questa riga: il sipario scattava col pannello
          // 92px sotto il bordo basso a 390, 94px a 768 — cioè partiva sempre
          // fuori campo, su tutte le larghezze, per tutta la sessione.
          // È un refresh globale e non se ne fanno a cuor leggero, ma è uno
          // solo, arriva a pagina ferma e ripaga tutti i trigger, non solo i
          // nostri. Il ramo desktop non ne ha bisogno: lì il runway da 520vh
          // domina l'altezza del documento e 238px non spostano niente.
          let refreshed = false;
          void document.fonts?.ready.then(() => {
            if (refreshed) return;
            refreshed = true;
            ScrollTrigger.refresh();
          });
          offs.push(() => {
            refreshed = true;
          });
          panels.forEach((panel, i) => {
            const points = gsap.utils.toArray<HTMLElement>("[data-paths-point]", panel);

            // 1) Il sipario — e IL VERSO CONTA PIÙ DI OGNI ALTRO NUMERO QUI.
            //    Meccanica come il ramo mobile di LiquidReveal: clip-path e
            //    nient'altro. Ma il verso che sembra giusto è quello sbagliato.
            //    Il pannello arriva dal basso, quindi l'istinto dice "sipario
            //    che sale", cioè inset(TOP …) che scopre dal fondo verso l'alto.
            //    Con quel verso il bordo ALTO del pannello è l'ultimo a
            //    dipingersi, ed è esattamente l'unica fascia già a schermo
            //    quando il trigger scatta: su un viewport da 664px il pannello
            //    ne è alto 648, e fra due fotografie scure si apriva una fascia
            //    di crema. Cioè il "taglio percepibile" che la cliente ha
            //    escluso (memoria di progetto, 2026-08-06).
            //    Con inset(… BOTTOM) si scopre dall'alto in giù: la prima cosa
            //    dipinta è il labbro che si sta guardando, e la crema non
            //    compare mai. Stesso gesto, senza il buco.
            //    Lo start resta presto (90%): a trigger scattato solo ~10vh di
            //    pannello sono a schermo, e il fronte del sipario corre molto
            //    più veloce dello scroll — non lo si raggiunge mai.
            //    (2026-08-11: TOLTO il dolly della foto, scale 1.06 → 1. La
            //    nota che lo accompagnava ammetteva da sé che «senza corridoio
            //    non c'è respiro da riempire»: sei centesimi di scala su una
            //    foto a pieno schermo non si vedono, e costavano una tween in
            //    più per pannello su un layer grande quanto lo schermo. Il
            //    desktop tiene il suo 1.35 → 1.18, che si legge perché lì il
            //    corridoio c'è.)
            const rise = gsap.timeline({
              scrollTrigger: {
                trigger: panel,
                start: "top 90%",
                // Replay a ogni passaggio, come LiquidReveal e Footer: è anche
                // ciò che rende innocua la rete di sicurezza qui sotto — un
                // progress(1) anticipato non brucia l'ingresso, il restart lo
                // rigioca. Niente clearProps: romperebbe restart/reverse.
                toggleActions: "restart none none reverse",
                // MISURA CHE INVECCHIA. Senza questo, il trigger si è
                // rivelato fuori posto di 236px su tutti e due i pannelli, per
                // sempre: il documento cresce di ~238px poco dopo
                // l'idratazione, e la riga di partenza calcolata prima resta
                // quella. Misurato a rotella vera su build di produzione: il
                // sipario scattava col pannello 170px SOTTO il bordo basso —
                // cioè non lo vedeva nessuno, a nessuna velocità.
                invalidateOnRefresh: true,
              },
            });
            rise.fromTo(
              panel,
              { clipPath: "inset(0% 0% 100% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: dur.transition, ease: "expo.out" },
              0
            );

            // 2) I tre punti dai lati OPPOSTI — vendi da destra, acquista da
            //    sinistra: gli stessi versi del desktop, ed è il budget di cui
            //    sopra. x piccola (dist.rise): non è una corsa da un capo
            //    all'altro dello schermo, è il verso della strada.
            //    IL TRIGGER È LORO, e la scelta è stata fatta due volte in
            //    senso opposto: vale la pena scrivere perché ha vinto questo.
            //    Attaccarli come secondo tempo di `rise` costava un trigger in
            //    meno, ma legava il loro ingresso a un RITARDO FISSO invece che
            //    alla loro posizione. Misurato a 390x664: allo scatto del
            //    sipario la lista è 516px sotto il bordo basso, quindi i punti
            //    entravano in campo solo dentro una finestra di velocità larga
            //    pochi pixel al secondo — troppo piano e si compongono fuori
            //    campo, troppo veloce e sono già a posto quando arrivano. Un
            //    trigger sulla lista costa due ScrollTrigger in tutto e li fa
            //    entrare quando li si guarda. La regola Chanel è pagata dal
            //    dolly della foto, tolto qui sopra.
            const list = points[0]?.closest("ul") ?? panel;
            if (points.length) {
              gsap.fromTo(
                points,
                { x: (i === 0 ? 1 : -1) * dist.rise, opacity: 0 },
                {
                  x: 0,
                  opacity: 1,
                  duration: dur.reveal,
                  ease: "domus",
                  stagger: stagger.cards,
                  scrollTrigger: {
                    trigger: list,
                    start: "top 85%",
                    toggleActions: "restart none none reverse",
                    invalidateOnRefresh: true,
                  },
                }
              );
            }

            // Rete di sicurezza, stessa forma di Footer/PageHero. Qui serve
            // davvero: il sipario è clip-path, non visibility, quindi il CTA
            // dentro il pannello resta nel tab order anche mentre è ritagliato
            // via — senza questa rete ci si atterra col Tab su un link
            // invisibile (WCAG 2.4.7). Il listener NON è { once: true }: con
            // restart/reverse lo stato nascosto può tornare, e la rete deve
            // valere anche la seconda volta.
            const reveal = () => rise.progress(1);
            panel.addEventListener("focusin", reveal);

            // La GUARDIA sul timeout (2026-08-11). La versione secca sparava a
            // 2,5s qualunque cosa stesse succedendo: misurato a t=3,2s con
            // scrollY ancora a 0, tutti e due i sipari erano aperti e i sei
            // punti a opacity 1 da cinque a tredici schermate sotto la piega.
            // La sezione si giocava da sola prima di essere guardata. Adesso la
            // rete interviene solo se il trigger ha davvero mancato il colpo:
            // la timeline è ancora ferma a zero E la riga di partenza di QUESTO
            // pannello è già stata superata. Il confronto scrollY/st.start è lo
            // stesso idioma del ramo desktop qui sotto.
            const rescue = () => {
              if (rise.progress() > 0) return;
              // LA GUARDIA LEGGE IL RETTANGOLO, NON `st.start`. Sembrava più
              // preciso confrontare `window.scrollY` con la riga di partenza
              // del trigger; è invece lo stesso numero stantio che il trigger
              // aveva sbagliato, quindi la rete ereditava l'errore che doveva
              // coprire e apriva il sipario col pannello ancora sotto il bordo
              // (misurato a frame: 717px su 640 di viewport a 360, 1126 su
              // 1024 a 768). La posizione vera dell'elemento non può invecchiare,
              // e la soglia è la stessa dello start: 90% del viewport.
              if (panel.getBoundingClientRect().top >= window.innerHeight * 0.9) return;
              reveal();
            };
            const safety = window.setTimeout(rescue, 2500);

            offs.push(() => {
              panel.removeEventListener("focusin", reveal);
              window.clearTimeout(safety);
              rise.scrollTrigger?.kill();
              rise.kill();
            });
          });
          return () => offs.forEach((off) => off());
        }

        section.setAttribute("data-on", "");

        const introImg = screen.querySelector<HTMLElement>("[data-paths-intro-img]");
        const introTxt = screen.querySelector<HTMLElement>("[data-paths-intro-txt]");
        const imgs = panels.map((p) => p.querySelector<HTMLElement>("[data-paths-img]"));
        const veils = panels.map((p) => p.querySelector<HTMLElement>("[data-paths-veil]"));
        if (!introImg || panels.length !== 2) return;

        // Stato iniziale SOLO via JS: le pagine aspettano sotto il bordo.
        panels.forEach((p, i) => {
          gsap.set(p, { clipPath: "inset(100% 0% 0% 0%)" });
          if (imgs[i]) gsap.set(imgs[i], { scale: 1.35, yPercent: 8 });
          if (veils[i]) gsap.set(veils[i], { opacity: 0 });
        });

        // I tre punti scivolano dentro dal lato del percorso (i "video" del
        // riferimento): vendi da destra, acquista da sinistra.
        const rows = panels.map((p) => gsap.utils.toArray<HTMLElement>("[data-paths-point]", p));

        // Master in scrub sulla runway. Scala interna: 10 unità.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: runway,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        });
        tl
          // Fondale: la foto del team respira mentre si legge il titolo...
          .fromTo(introImg, { scale: 1.05 }, { scale: 1.16, duration: 3.2 }, 0)
          // ...e il titolo deriva piano verso l'alto quando la pagina lo copre.
          .to(introTxt, { yPercent: -14, duration: 2.2 }, 1.0)
          // Percorso 1 (vendi): la pagina si alza dal basso.
          .to(panels[0], { clipPath: "inset(0% 0% 0% 0%)", duration: 2.0 }, 1.2)
          .to(imgs[0], { scale: 1.18, yPercent: 0, duration: 2.4 }, 1.2)
          .fromTo(
            rows[0],
            { x: () => window.innerWidth * 0.55, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.5, stagger: 0.3 },
            2.3
          )
          // Respiro di lettura (2 unità di quiete), poi il velo si posa sul
          // primo percorso mentre il secondo gli sale sopra.
          .to(veils[0], { opacity: 0.45, duration: 1.6 }, 5.4)
          .to(panels[1], { clipPath: "inset(0% 0% 0% 0%)", duration: 2.0 }, 5.4)
          .to(imgs[1], { scale: 1.18, yPercent: 0, duration: 2.4 }, 5.4)
          .fromTo(
            rows[1],
            { x: () => window.innerWidth * -0.55, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.5, stagger: 0.3 },
            6.5
          )
          // Coda di lettura del secondo percorso prima dello sgancio.
          .to({}, { duration: 1.6 }, 8.4);

        // Le righe dei titoli (grammatica data-line del riferimento): toggle
        // direzionale, NON in scrub — salgono dai binari quando la pagina è
        // quasi composta, tornano giù risalendo. Split a font pronti.
        let cancelled = false;
        const kills: Array<() => void> = [];
        document.fonts.ready.then(() => {
          if (cancelled) return;
          const starts = ["21% top", "51% top"];
          panels.forEach((panel, i) => {
            const title = panel.querySelector<HTMLElement>("[data-paths-title]");
            const extras = gsap.utils.toArray<HTMLElement>("[data-paths-el]", panel);
            if (!title) return;
            const split = SplitText.create(title, {
              type: "lines",
              tag: "span",
              linesClass: "dt-paths_line",
              mask: "lines",
              aria: "none",
            });
            gsap.set(split.lines, { yPercent: 120, rotate: 2 });
            // Solo opacity sugli extra (dentro c'è il CTA link: deve restare
            // nel tab order anche da spento).
            gsap.set(extras, { opacity: 0, y: 18 });
            let tw: gsap.core.Timeline | null = null;
            const play = () => {
              if (!tw) {
                tw = gsap
                  .timeline({ paused: true })
                  .to(split.lines, { yPercent: 0, rotate: 0, duration: 1.1, ease: "dtOut", stagger: 0.09 }, 0)
                  .to(extras, { opacity: 1, y: 0, duration: 0.8, ease: "domus", stagger: 0.08 }, 0.25);
              }
              tw.restart();
            };
            const st = ScrollTrigger.create({
              trigger: runway,
              start: starts[i],
              onEnter: play,
              onLeaveBack: () => tw?.reverse(),
            });
            kills.push(() => {
              st.kill();
              tw?.kill();
              split.revert();
            });
          });
        });

        // Tastiera dentro una pagina pinnata: porta lo scroll al beat in cui
        // quella pagina è composta (pattern di StarReviews/ReviewsWall).
        const composed = [0.44, 0.88];
        const onFocus = (i: number) => () => {
          const st = tl.scrollTrigger;
          if (!st) return;
          const target = st.start + (st.end - st.start) * composed[i];
          if (Math.abs(window.scrollY - target) < 4) return;
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(target, { immediate: true });
          else window.scrollTo({ top: target, behavior: "auto" });
          ScrollTrigger.update();
        };
        const offs = panels.map((panel, i) => {
          const fn = onFocus(i);
          panel.addEventListener("focusin", fn);
          return () => panel.removeEventListener("focusin", fn);
        });

        // La sezione è appena diventata alta 520vh: rimisura i trigger a valle.
        ScrollTrigger.refresh();

        return () => {
          cancelled = true;
          kills.forEach((kill) => kill());
          offs.forEach((off) => off());
          tl.scrollTrigger?.kill();
          tl.kill();
          section.removeAttribute("data-on");
        };
      });
    },
    { scope: sectionRef, dependencies: [locale], revertOnUpdate: true }
  );

  return (
    <section ref={sectionRef} className="dt-paths relative bg-paper">
      <div ref={runwayRef} className="dt-paths_runway">
        <div ref={screenRef} className="dt-paths_screen relative">
          {/* Fondale — il team, pinnato, col titolo gigante (rif. hero "Just
              scroll it"): è la pagina su cui i due percorsi saliranno. */}
          <div className="dt-paths_intro relative flex min-h-[72svh] items-end overflow-hidden lg:min-h-0">
            <div data-paths-intro-img className="absolute inset-0">
              <Image
                src={INTRO_IMG}
                alt={c.introAlt}
                fill
                sizes="100vw"
                quality={75}
                className="photo-warm object-cover"
              />
            </div>
            {/* Scrim caldo per la leggibilità (mai nero pieno: wine/espresso) */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-wine/85 via-espresso/35 to-espresso/15" />
            <Fioritura
              variant="corner-tr"
              palette="dark"
              className="absolute -right-4 -top-6 hidden h-[34vh] w-[15vw] lg:block"
            />
            <div
              data-paths-intro-txt
              className="relative mx-auto w-full max-w-[1240px] px-5 pb-16 pt-28 sm:px-8 lg:pb-[9vh]"
            >
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-red-soft">
                {c.eyebrow}
              </span>
              <h2 className="mt-5 max-w-[16ch] font-display text-d2 display-tight font-medium text-cream balance">
                {c.heading}
              </h2>
            </div>
          </div>

          {/* I due percorsi: pagine piene che si alzano dal basso. */}
          {paths.map((p, i) => {
            const t = c.paths[p.id];
            return (
              <article
                key={p.id}
                id={p.id}
                data-paths-panel
                data-surface="dark"
                className="dt-paths_panel relative flex min-h-[92svh] items-center overflow-hidden"
              >
                <div data-paths-img className="absolute inset-0">
                  <Image
                    src={p.image}
                    alt={t.alt}
                    fill
                    sizes="100vw"
                    quality={75}
                    className="photo-warm object-cover"
                  />
                </div>
                <div
                  aria-hidden
                  className={`absolute inset-0 ${
                    i === 0
                      ? "bg-gradient-to-r from-wine/85 via-espresso/45 to-espresso/20"
                      : "bg-gradient-to-l from-wine/85 via-espresso/45 to-espresso/20"
                  }`}
                />
                {i === 1 && (
                  <Fioritura
                    variant="corner-br"
                    palette="dark"
                    className="absolute -bottom-6 -right-4 hidden h-[36vh] w-[16vw] lg:block"
                  />
                )}
                {/* Il velo che si posa quando il percorso successivo sale */}
                <div aria-hidden data-paths-veil className="pointer-events-none absolute inset-0 bg-espresso" style={{ opacity: 0 }} />
                <div
                  className={`relative mx-auto flex w-full max-w-[1240px] px-5 py-24 sm:px-8 ${
                    i === 0 ? "justify-start" : "justify-end"
                  }`}
                >
                  <div className="max-w-xl">
                    <p data-paths-el className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-red-soft">
                      {t.tag}
                    </p>
                    <h3
                      data-paths-title
                      className="mt-5 font-display text-d3 display-tight font-medium text-cream balance"
                    >
                      {t.title}
                    </h3>
                    <p data-paths-el className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-cream/80 sm:text-base">
                      {t.copy}
                    </p>
                    <ul className="mt-8 flex flex-col gap-3.5">
                      {t.points.map((pt) => (
                        <li
                          key={pt}
                          data-paths-point
                          className="flex items-start gap-3 text-[0.95rem] text-cream/90"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream/15 text-cream">
                            <Check className="h-3 w-3" />
                          </span>
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <div data-paths-el className="mt-9">
                      <Cta href={p.href} variant="cta-solid" size="md">
                        {t.cta}
                      </Cta>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {/* I due bordi di "Due percorsi" sono foto a tutta pagina contro una
          campitura: i due salti più grossi della home dopo l'hero (misurati
          ΔRGB 131 e 381). I veli stanno sulla SEZIONE, non sullo schermo
          pinnato: così compaiono solo alle due estremità e non velano la
          fotografia per tutti i 520vh di corsa. */}
      <SurfaceVeil edge="top" tone="cream" height="24svh" strength={0.92} />
      <SurfaceVeil edge="bottom" tone="cream-deep" height="28svh" />
    </section>
  );
}
