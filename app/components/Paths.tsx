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
// Mobile/tablet con motion (Fase 3 «parità mobile 2», 2026-08-18, verdetto 18
// PORT-SENZA-PIN): la salita senza il corridoio, ma con TUTTI i gesti del
// desktop — sipario che scopre verso il basso, foto che respira in scrub coi
// numeri del desktop (1.35 → 1.18), righe del titolo che salgono dai binari,
// extra e punti che entrano dai lati opposti. Ciò che resta a casa è il solo
// corridoio: niente [data-on], niente runway da 520vh, nessuna altezza che
// cambia (legge 4 — non si ruba lo scroll).
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
        cta: "Richiedi la valutazione del tuo immobile",
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
        cta: "Request a valuation of your property",
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
        cta: "Demandez l’estimation de votre bien",
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
        cta: "Bewertung Ihrer Immobilie anfordern",
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
        cta: "Solicita la valoración de tu inmueble",
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
        // PORT-SENZA-PIN (onda «parità mobile 2», verdetto 18). Fino al
        // 2026-08-11 quaggiù c'era la dottrina vecchia — «tradurre il gesto» —
        // e restavano solo due cose: il sipario e i punti. Il ragionamento
        // scritto allora era che a 390 il mirroring destra/sinistra non si
        // legge (`justify-start`/`justify-end` non spostano nulla perché
        // `max-w-xl` riempie già la colonna) e quindi «il budget va speso tutto
        // sui punti». Resta vero il fatto, non la conseguenza: il budget non è
        // un numero fisso da spendere in un posto solo, e la foto che respira
        // e le righe che salgono dai binari si vedono a 390 esattamente come a
        // 1440. Adesso scendono tutti i gesti del desktop, coi SUOI numeri
        // (`scale 1.35 → 1.18`, `yPercent 8 → 0`, righe `yPercent 120 /
        // rotate 2`): quello che non scende è il solo corridoio.
        //
        // REGOLA CHANEL — cosa si alleggerisce per pagare i tre gesti in più:
        //   · SplitText solo `lines` (≈3 righe × 2 titoli = 6 span), mai chars,
        //     e senza il `will-change` permanente che il CSS teneva su
        //     `.dt-paths_line` — la regola è ora scoped a `[data-on]`, cioè al
        //     solo ramo desktop (globals.css, blocco «Due percorsi»);
        //   · `will-change: transform` sulla foto SOLO mentre il pannello
        //     attraversa il viewport (`onToggle` dello scrub), mai a riposo;
        //   · UN SOLO ScrollTrigger a toggle per pannello dove prima ce n'erano
        //     due: sipario, punti e righe li decide la stessa guardia. Il conto
        //     resta due trigger per pannello (toggle + scrub della foto) con
        //     tre gesti in più di prima.
        if (!cond.desktop) {
          const offs: Array<() => void> = [];
          const builders: Array<() => void> = [];
          let cancelled = false;

          panels.forEach((panel, i) => {
            const img = panel.querySelector<HTMLElement>("[data-paths-img]");
            const title = panel.querySelector<HTMLElement>("[data-paths-title]");
            const extras = gsap.utils.toArray<HTMLElement>("[data-paths-el]", panel);
            const points = gsap.utils.toArray<HTMLElement>("[data-paths-point]", panel);
            const list = points[0]?.closest("ul") ?? panel;

            // 1) Il sipario — resta com'è, e IL VERSO CONTA PIÙ DI OGNI ALTRO
            //    NUMERO QUI. Meccanica come il ramo mobile di LiquidReveal:
            //    clip-path e nient'altro. Ma il verso che sembra giusto è
            //    quello sbagliato. Il pannello arriva dal basso, quindi
            //    l'istinto dice "sipario che sale", cioè inset(TOP …) che
            //    scopre dal fondo verso l'alto. Con quel verso il bordo ALTO
            //    del pannello è l'ultimo a dipingersi, ed è esattamente l'unica
            //    fascia già a schermo quando il trigger scatta: su un viewport
            //    da 664px il pannello ne è alto 648, e fra due fotografie scure
            //    si apriva una fascia di crema. Cioè il "taglio percepibile"
            //    che la cliente ha escluso (memoria di progetto, 2026-08-06).
            //    Con inset(… BOTTOM) si scopre dall'alto in giù: la prima cosa
            //    dipinta è il labbro che si sta guardando, e la crema non
            //    compare mai. Stesso gesto, senza il buco.
            const rise = gsap.timeline({ paused: true }).fromTo(
              panel,
              { clipPath: "inset(0% 0% 100% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: dur.transition, ease: "expo.out" },
              0
            );

            // 2) I tre punti dai lati OPPOSTI — vendi da destra, acquista da
            //    sinistra: gli stessi versi del desktop. x piccola (dist.rise):
            //    non è una corsa da un capo all'altro dello schermo, è il verso
            //    della strada. Entrano quando LA LISTA è in campo, non dopo un
            //    ritardo fisso dal sipario: misurato a 390x664, allo scatto del
            //    sipario la lista è 516px sotto il bordo basso, quindi un
            //    ritardo fisso li faceva comporre fuori campo o li trovava già
            //    a posto, a seconda della velocità del pollice.
            const slide = points.length
              ? gsap.fromTo(
                  points,
                  { x: (i === 0 ? 1 : -1) * dist.rise, opacity: 0 },
                  {
                    x: 0,
                    opacity: 1,
                    duration: dur.reveal,
                    ease: "domus",
                    stagger: stagger.cards,
                    paused: true,
                  }
                )
              : null;

            // 3) Le righe del titolo — la tween del desktop, identica
            //    (`yPercent 120 / rotate 2`, `dtOut`, 1,1s, stagger .09) più
            //    gli extra in `opacity` + `y 18`. Lo split vuole i font veri:
            //    si costruisce in `builders`, che gira a `document.fonts.ready`
            //    (qui sotto, dopo il ciclo). Fino ad allora `lift` è null e la
            //    guardia lo salta: nessuno stato nascosto scritto in anticipo.
            let lift: gsap.core.Timeline | null = null;

            // ── IL DIFETTO §9.4 SI CHIUDE QUI ────────────────────────────
            // Il sipario scattava col pannello FUORI CAMPO a ogni larghezza:
            // bordo alto a 717px su un viewport di 640, 769 su 664, 1123 su
            // 1024, dove `start: "top 90%"` prometteva 576, 598, 922. Lo scarto
            // è sempre positivo e vale 141-201px: è il DOCUMENTO CHE CRESCE
            // SOPRA il pannello dopo l'ultima rimisura (font sostituiti,
            // sezioni che si compongono). La riga di partenza che ScrollTrigger
            // tiene in cache resta quella di prima, cioè più in alto del vero,
            // e il trigger scatta quando il pannello è già sceso di altrettanto.
            // Rincorrere la crescita con le rimisure non basta ed era già stato
            // provato: `invalidateOnRefresh` più un `ScrollTrigger.refresh()` a
            // `fonts.ready` avevano salvato 390 e mancato le altre due
            // larghezze (docs/mobile-parity.md §9.4).
            // La posizione VERA dell'elemento, invece, non può invecchiare — è
            // lo stesso ragionamento con cui la rete di sicurezza qui sotto era
            // già stata corretta a leggere il rettangolo invece di `st.start`.
            // Quindi si separa l'armamento dalla decisione: si ARMA prestissimo
            // (`top bottom`: il pannello che tocca il bordo basso) e si DECIDE
            // con `getBoundingClientRect()` nel frame in cui si guarda. Una
            // cache invecchiata può solo far armare tardi — e in quel caso la
            // guardia è già aperta e scatta al primo update — mai far partire
            // il sipario fuori campo. Le soglie tornano leggibili come sono
            // scritte: 85% del viewport per il sipario e per i punti, 60% per
            // le righe (il titolo si compone quando lo si sta leggendo).
            // COSTO: una `getBoundingClientRect()` per tick di scroll finché le
            // tre guardie non sono aperte (due se i punti mancano ancora), poi
            // zero — il primo `if` esce subito. È una lettura di layout senza
            // scrittura, dentro un handler che ScrollTrigger chiama solo mentre
            // il pannello attraversa il viewport.
            // `dots`/`lines` nascono già "fatti" se la loro tween non esiste
            // (nessun punto, nessun titolo): così il primo `if` di `gates` può
            // chiudere il rubinetto delle letture invece di restare aperto per
            // sempre in attesa di qualcosa che non arriverà.
            let curtain = false;
            let dots = !slide;
            let lines = !title;
            const gates = () => {
              if (curtain && dots && lines) return;
              const vh = window.innerHeight;
              const top = panel.getBoundingClientRect().top;
              if (!curtain && top <= vh * 0.85) {
                curtain = true;
                rise.restart();
              }
              if (!lines && lift && top <= vh * 0.6) {
                lines = true;
                lift.restart();
              }
              if (!dots && slide && list.getBoundingClientRect().top <= vh * 0.85) {
                dots = true;
                slide.restart();
              }
            };
            // Risalendo si torna allo stato di partenza e le guardie si
            // riarmano: è il `restart none none reverse` di prima, scritto a
            // mano perché adesso le tween sono tre e i loro innesti diversi.
            const rewind = () => {
              curtain = false;
              dots = !slide;
              lines = !title;
              rise.reverse();
              slide?.reverse();
              lift?.reverse();
            };
            const st = ScrollTrigger.create({
              trigger: panel,
              start: "top bottom",
              end: "bottom top",
              invalidateOnRefresh: true,
              onEnter: gates,
              onUpdate: gates,
              onLeaveBack: rewind,
            });

            // 4) La foto respira — i numeri del desktop (`:439`), in scrub
            //    sull'attraversamento del pannello. È il gesto che il
            //    2026-08-11 era stato tolto perché ridotto a `1.06 → 1`: sei
            //    centesimi di scala su una foto a pieno schermo non si vedono
            //    davvero, ma diciassette sì, ed è la stessa trasformazione che
            //    il desktop mette in mano al suo master pinnato. Qui il
            //    corridoio non c'è, quindi il respiro se lo prende
            //    l'attraversamento: `top 90%` → `bottom 60%`, ~1,25 viewport di
            //    corsa. Solo transform (scale + yPercent): composited.
            //    `will-change` a tempo, mai a riposo (regola Chanel).
            if (img) {
              const dolly = gsap.fromTo(
                img,
                { scale: 1.35, yPercent: 8 },
                {
                  scale: 1.18,
                  yPercent: 0,
                  ease: "none",
                  scrollTrigger: {
                    trigger: panel,
                    start: "top 90%",
                    end: "bottom 60%",
                    scrub: 0.4,
                    // Lo scrub tollera la cache invecchiata di cui sopra —
                    // sfasa di qualche decina di px una scala continua, che
                    // nessuno legge come difetto — ma la rimisura a
                    // `fonts.ready` gliela si dà comunque.
                    invalidateOnRefresh: true,
                    onToggle: (self) => {
                      img.style.willChange = self.isActive ? "transform" : "auto";
                    },
                  },
                }
              );
              offs.push(() => {
                dolly.scrollTrigger?.kill();
                dolly.kill();
                img.style.willChange = "";
              });
            }

            if (title) {
              builders.push(() => {
                const split = SplitText.create(title, {
                  type: "lines",
                  tag: "span",
                  linesClass: "dt-paths_line",
                  mask: "lines",
                  aria: "none",
                });
                gsap.set(split.lines, { yPercent: 120, rotate: 2 });
                // Solo opacity+y sugli extra (dentro c'è il CTA link: deve
                // restare nel tab order anche da spento — mai autoAlpha).
                gsap.set(extras, { opacity: 0, y: 18 });
                const tl = gsap
                  .timeline({ paused: true })
                  .to(split.lines, { yPercent: 0, rotate: 0, duration: dur.transition, ease: "dtOut", stagger: 0.09 }, 0)
                  .to(extras, { opacity: 1, y: 0, duration: 0.8, ease: "domus", stagger: 0.08 }, 0.25);
                lift = tl;
                // Se i font arrivano quando il pannello è GIÀ oltre la soglia
                // (o la rete di sicurezza ha già composto tutto), lo stato
                // nascosto sarebbe un passo indietro sotto gli occhi: si
                // compone nello stesso frame in cui lo si è scritto.
                if (lines || panel.getBoundingClientRect().top <= window.innerHeight * 0.6) {
                  lines = true;
                  tl.progress(1);
                }
                offs.push(() => {
                  tl.kill();
                  split.revert();
                });
              });
            }

            // Rete di sicurezza, stessa forma di Footer/PageHero. Qui serve
            // davvero: il sipario è clip-path, non visibility, quindi il CTA
            // dentro il pannello resta nel tab order anche mentre è ritagliato
            // via — senza questa rete ci si atterra col Tab su un link
            // invisibile (WCAG 2.4.7), e adesso anche su un titolo fuori dal
            // binario e su extra a opacity 0. Il listener NON è { once: true }:
            // con restart/reverse lo stato nascosto può tornare, e la rete deve
            // valere anche la seconda volta.
            const settle = () => {
              curtain = true;
              dots = true;
              lines = true;
              rise.progress(1);
              slide?.progress(1);
              lift?.progress(1);
            };
            panel.addEventListener("focusin", settle);

            // La GUARDIA sul timeout (2026-08-11). La versione secca sparava a
            // 2,5s qualunque cosa stesse succedendo: misurato a t=3,2s con
            // scrollY ancora a 0, tutti e due i sipari erano aperti e i sei
            // punti a opacity 1 da cinque a tredici schermate sotto la piega.
            // La sezione si giocava da sola prima di essere guardata. Adesso la
            // rete non compone niente da sé: chiede alle stesse guardie di
            // guardare, e quelle leggono il rettangolo vivo. Se il pannello è
            // ancora sotto il bordo non succede nulla, oggi come fra dieci
            // schermate.
            const safety = window.setTimeout(gates, 2500);

            offs.push(() => {
              panel.removeEventListener("focusin", settle);
              window.clearTimeout(safety);
              st.kill();
              rise.kill();
              slide?.kill();
            });
          });

          // UNA RIMISURA, UNA SOLA, QUANDO I FONT SONO ARRIVATI — e prima gli
          // split, che vogliono le righe vere. Il refresh non è più ciò che
          // tiene in campo il sipario (lo fanno le guardie qui sopra): serve
          // allo scrub della foto, e ripaga tutti i trigger a valle, non solo i
          // nostri. È globale e non se ne fanno a cuor leggero, ma è uno solo e
          // arriva a pagina ferma. Il ramo desktop non ne ha bisogno: lì il
          // runway da 520vh domina l'altezza del documento.
          let refreshed = false;
          void document.fonts?.ready.then(() => {
            if (refreshed || cancelled) return;
            refreshed = true;
            builders.forEach((build) => build());
            ScrollTrigger.refresh();
          });
          offs.push(() => {
            cancelled = true;
            refreshed = true;
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
          <div className="dt-paths_intro relative flex min-h-[72svh] items-end overflow-hidden bg-espresso lg:min-h-0">
            <div data-paths-intro-img className="dt-mob-band absolute inset-0">
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
            {/* Tralcio dell'intro, acceso anche sotto lg (onda «parità mobile
                2», verdetto 6): delle due Fioriture del capitolo è questa che
                resta a 390 — «una per sezione» — con box 117px quadrati
                (`w-[30vw]`), dpr 1,5 e tetto 900 dentro Fioritura. L'angolo
                alto a destra è aria a ogni larghezza: il testo dell'intro è
                ancorato in basso (`items-end`). Sotto lg niente sbordo verso
                l'alto (`top-0`, non `-top-6`): a 390 la fascia che precede
                chiude con la scritta cinetica, e i 24px di sbordo le finivano
                sopra (screenshot 2026-08-18) — «mai un fiore sopra un testo». */}
            <Fioritura
              variant="corner-tr"
              palette="dark"
              className="absolute -right-4 top-0 h-[20vh] w-[30vw] lg:-top-6 lg:h-[34vh] lg:w-[15vw]"
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
                {/* Sotto lg resta `hidden`: «una Fioritura per sezione a 390»
                    (docs/effetti-reference.md; onda «parità mobile 2», verdetto
                    6) — il capitolo tiene il tralcio dell'intro. Non è la
                    dottrina «tradurre», è un tetto di densità. */}
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
