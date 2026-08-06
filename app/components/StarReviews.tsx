"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   CINQUE STELLE — il capitolo recensioni della home (2026-08-04).

   THESIS: la valutazione Google non è un contatore ma cinque momenti reali
   visti ATTRAVERSO la forma della stella. Rifiuta il template hero-metric
   (numeri grossi + label + marquee di tag) che sostituisce.
   OWN-WORLD: mondo Domus incombente — carta calda, Playfair, rosso col
   contagocce, ease "domus". La stella a 5 punte (ratio 0.475, punta in alto)
   è l'unica forma nuova, usata come maschera fotografica.
   STORY: il visitatore arriva su una foto a tutto schermo che si richiude
   nella stella centrale di una fila di cinque; nell'istante in cui la foto
   si posa, la fila si ACCENDE D'ORO dal centro verso i lati e un riflesso
   comincia a viaggiare da una stella all'altra. Le cinque stelle non sono
   più finestre ma il segno pieno del voto, ciascuna con il fronte di lavoro
   che si è guadagnata (Venditori, Acquirenti, Il team, Open Domus,
   Esperienza). Le parole vere restano a Google e al widget Trustindex,
   rivelato dalla stessa lingua di clip. Il capitolo assorbe anche la banda
   Authority: il claim "più recensita" vive qui, sotto il cluster prova.

   REVISIONE 2026-08-06 (direttiva cliente): via le fotografie dalle tessere.
   La stella a 5 punte tagliava i volti sulle punte e lasciava le immagini in
   letterbox — un difetto visibile a tutte le viewport. Le stelle diventano
   ORO (materiale, non decorazione: vedi l'eccezione dichiarata in
   globals.css) e puramente decorative: niente click, niente overlay. Il
   cluster prova poggia ora su voto + CTA Google + sigillo + widget.
   FIRST VIEWPORT: il muro delle voci consegna lo sfondo pulito (uscita
   estesa delle card); la foto Top Agency appare PICCOLA, croppata a stella,
   centrata, e lo scroll la ZOOMA a tutto schermo (demo 3 del riferimento,
   flash + titolo-cover a caratteri stirati) per poi richiuderla nella stella
   centrale della fila: 5 stelle, voto 4,9/531, CTA Google + sigillo Wikicasa.
   FORM: codrops/FullscreenClipEffect (demo 1) — morph di clip-path a
   topologia costante (10 vertici), maschere a stella al posto delle pillole;
   pinned dal cliente in chat, con continuum scrubbato richiesto in chat
   (2026-08-04). Il cover-title esce per carattere (scaleY, stagger dal
   centro); lo scrub è bidirezionale per natura (direttiva replay).

   Verità: la prova verbatim resta Trustindex/Google — le stelle sono il
   segno del voto, le didascalie sono copy nostro sui fronti di lavoro.
   Progressive enhancement: [data-on] solo desktop ≥1024 + motion ok; senza
   JS / reduced-motion / mobile la sezione è completa e statica, con le
   stelle già d'oro e il riflesso affidato a un'animazione CSS.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";
import Image from "next/image";
import TextLines from "./motion/TextLines";
import { Star, Google } from "./Icons";
import { Cta } from "./primitives/Cta";
import TrustindexEmbed from "./TrustindexEmbed";
import { site } from "../lib/site";
import { useConsent } from "../lib/consent";
import { useLocale } from "./i18n/LocaleProvider";
import { getLenis } from "./motion/SmoothScroll";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../lib/motion/gsap";
import { starClipPath, STAR_INNER_RATIO } from "../lib/star-shape";

type StarKey = "venditori" | "acquirenti" | "openDomus" | "esperienza" | "team";

/** I cinque fronti di lavoro che il voto premia. Ordine narrativo: chi vende,
    chi compra, le persone (al centro, dove atterra la foto del premio), il
    momento Open Domus, l'esperienza complessiva. */
const STARS: { key: StarKey }[] = [
  { key: "venditori" },
  { key: "acquirenti" },
  { key: "team" },
  { key: "openDomus" },
  { key: "esperienza" },
];
/** La stella in cui si richiude il fullscreen d'ingresso: il team con la targa
    Top Agency — la stessa prova del sigillo Wikicasa accanto alla CTA. È
    l'ULTIMA fotografia del capitolo: da lì in poi la fila è solo oro. */
const CENTER = 2;
const INTRO_IMG = "/images/reali/premio-team.jpg";

const copy = {
  it: {
    eyebrow: "Recensioni",
    coverWord: "Cinque stelle",
    title: "Cinque stelle, una alla volta.",
    subtitle:
      "Non un numero: famiglie accompagnate una alla volta. Cinque stelle guadagnate su ogni fronte del lavoro — le parole, quelle vere, restano su Google.",
    ratingLine: (count: string) => `su 5 · ${count} recensioni Google verificate`,
    cta: "Leggi tutte le recensioni su Google",
    stars: {
      venditori: { label: "Venditori", caption: "Dalla valutazione seria al rogito, senza sorprese." },
      acquirenti: { label: "Acquirenti", caption: "La casa giusta, con documenti già verificati." },
      openDomus: { label: "Open Domus", caption: "La visita che trasforma l'interesse in proposte." },
      esperienza: { label: "Esperienza", caption: "Ogni passaggio spiegato, ogni dubbio ascoltato." },
      team: { label: "Il team", caption: "Persone prima degli immobili, ogni giorno." },
    },
    widgetTitle: "Parola per parola.",
    widgetNote: "Recensioni Google verificate tramite Trustindex.",
    consentGate:
      "Il widget delle recensioni è di Trustindex: si carica solo dopo il tuo consenso ai cookie. Puoi leggerle subito su Google.",
    iframeTitle: "Recensioni Google verificate di Domus Tua (Trustindex)",
    awardAria: "Top Agency 2026 su Wikicasa — apri il profilo di Domus Tua (scheda nuova)",
    awardLabel: "Top Agency 2026",
    awardSub: "Wikicasa",
    claim: site.authority,
  },
  en: {
    eyebrow: "Reviews",
    coverWord: "Five stars",
    title: "Five stars, one at a time.",
    subtitle:
      "Not a number: families guided one at a time. Five stars earned on every front of the work — the real words stay on Google.",
    ratingLine: (count: string) => `out of 5 · ${count} verified Google reviews`,
    cta: "Read all reviews on Google",
    stars: {
      venditori: { label: "Sellers", caption: "From a serious valuation to the deed, no surprises." },
      acquirenti: { label: "Buyers", caption: "The right home, with documents already verified." },
      openDomus: { label: "Open Domus", caption: "The visit that turns interest into offers." },
      esperienza: { label: "Experience", caption: "Every step explained, every doubt heard." },
      team: { label: "The team", caption: "People before properties, every day." },
    },
    widgetTitle: "Word for word.",
    widgetNote: "Google reviews verified via Trustindex.",
    consentGate:
      "The reviews widget is provided by Trustindex: it loads only after you accept cookies. You can read the reviews on Google right away.",
    iframeTitle: "Verified Google reviews of Domus Tua (Trustindex)",
    awardAria: "Top Agency 2026 on Wikicasa — open the Domus Tua profile (new tab)",
    awardLabel: "Top Agency 2026",
    awardSub: "Wikicasa",
    claim: "Among the most-reviewed independent real estate agencies in the province of Varese.",
  },
  fr: {
    eyebrow: "Avis",
    coverWord: "Cinq étoiles",
    title: "Cinq étoiles, une à la fois.",
    subtitle:
      "Pas un chiffre : des familles accompagnées une à une. Cinq étoiles gagnées sur chaque front du métier — les vrais mots restent sur Google.",
    ratingLine: (count: string) => `sur 5 · ${count} avis Google vérifiés`,
    cta: "Lire tous les avis sur Google",
    stars: {
      venditori: { label: "Vendeurs", caption: "De l'estimation sérieuse à l'acte, sans surprises." },
      acquirenti: { label: "Acheteurs", caption: "Le bon logement, avec des documents déjà vérifiés." },
      openDomus: { label: "Open Domus", caption: "La visite qui transforme l'intérêt en offres." },
      esperienza: { label: "Expérience", caption: "Chaque étape expliquée, chaque doute écouté." },
      team: { label: "L'équipe", caption: "Les personnes avant les biens, chaque jour." },
    },
    widgetTitle: "Mot pour mot.",
    widgetNote: "Avis Google vérifiés via Trustindex.",
    consentGate:
      "Le widget d'avis est fourni par Trustindex : il ne se charge qu'après votre consentement aux cookies. Vous pouvez lire les avis sur Google dès maintenant.",
    iframeTitle: "Avis Google vérifiés de Domus Tua (Trustindex)",
    awardAria: "Top Agency 2026 sur Wikicasa — ouvrir le profil de Domus Tua (nouvel onglet)",
    awardLabel: "Top Agency 2026",
    awardSub: "Wikicasa",
    claim: "Parmi les agences immobilières indépendantes les plus commentées de la province de Varese.",
  },
  de: {
    eyebrow: "Bewertungen",
    coverWord: "Fünf Sterne",
    title: "Fünf Sterne, einer nach dem anderen.",
    subtitle:
      "Keine Zahl: Familien, einzeln begleitet. Fünf Sterne, an jeder Front der Arbeit verdient — die echten Worte bleiben auf Google.",
    ratingLine: (count: string) => `von 5 · ${count} verifizierte Google-Bewertungen`,
    cta: "Alle Bewertungen auf Google lesen",
    stars: {
      venditori: { label: "Verkäufer", caption: "Von der seriösen Bewertung bis zum Notartermin, ohne Überraschungen." },
      acquirenti: { label: "Käufer", caption: "Das richtige Zuhause, mit bereits geprüften Dokumenten." },
      openDomus: { label: "Open Domus", caption: "Der Besuch, der Interesse in Angebote verwandelt." },
      esperienza: { label: "Erfahrung", caption: "Jeder Schritt erklärt, jeder Zweifel gehört." },
      team: { label: "Das Team", caption: "Menschen vor Immobilien, jeden Tag." },
    },
    widgetTitle: "Wort für Wort.",
    widgetNote: "Google-Bewertungen, verifiziert über Trustindex.",
    consentGate:
      "Das Bewertungs-Widget stammt von Trustindex: Es lädt erst nach Ihrer Cookie-Einwilligung. Die Bewertungen können Sie sofort auf Google lesen.",
    iframeTitle: "Verifizierte Google-Bewertungen von Domus Tua (Trustindex)",
    awardAria: "Top Agency 2026 auf Wikicasa — das Profil von Domus Tua öffnen (neuer Tab)",
    awardLabel: "Top Agency 2026",
    awardSub: "Wikicasa",
    claim: "Eine der meistbewerteten unabhängigen Immobilienagenturen in der Provinz Varese.",
  },
  es: {
    eyebrow: "Reseñas",
    coverWord: "Cinco estrellas",
    title: "Cinco estrellas, una a la vez.",
    subtitle:
      "No es un número: familias acompañadas una a una. Cinco estrellas ganadas en cada frente del trabajo — las palabras de verdad están en Google.",
    ratingLine: (count: string) => `sobre 5 · ${count} reseñas de Google verificadas`,
    cta: "Leer todas las reseñas en Google",
    stars: {
      venditori: { label: "Vendedores", caption: "De la tasación seria a la escritura, sin sorpresas." },
      acquirenti: { label: "Compradores", caption: "La casa adecuada, con documentos ya verificados." },
      openDomus: { label: "Open Domus", caption: "La visita que convierte el interés en propuestas." },
      esperienza: { label: "Experiencia", caption: "Cada paso explicado, cada duda escuchada." },
      team: { label: "El equipo", caption: "Personas antes que inmuebles, cada día." },
    },
    widgetTitle: "Palabra por palabra.",
    widgetNote: "Reseñas de Google verificadas mediante Trustindex.",
    consentGate:
      "El widget de reseñas es de Trustindex: se carga solo tras tu consentimiento de cookies. Puedes leer las reseñas en Google ahora mismo.",
    iframeTitle: "Reseñas de Google verificadas de Domus Tua (Trustindex)",
    awardAria: "Top Agency 2026 en Wikicasa — abrir el perfil de Domus Tua (nueva pestaña)",
    awardLabel: "Top Agency 2026",
    awardSub: "Wikicasa",
    claim: "Entre las agencias inmobiliarias independientes con más reseñas de la provincia de Varese.",
  },
};

/* ─────────────────────────────── Sezione ─────────────────────────────────── */

export default function StarReviews() {
  const { locale } = useLocale();
  const c = copy[locale];
  const consent = useConsent();
  const showTrustindex = site.embeds.trustindexLoader.length > 0 && consent === "accepted";
  const awaitingConsent = site.embeds.trustindexLoader.length > 0 && consent !== "accepted";

  const sectionRef = useRef<HTMLElement | null>(null);
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLUListElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const intro = introRef.current;
      const row = rowRef.current;
      if (!section || !stage || !intro || !row) return;

      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 1024px)", motionOk: MQ.motionOk }, (ctx) => {
        const cond = ctx.conditions as { desktop: boolean; motionOk: boolean };
        if (!cond.desktop || !cond.motionOk) return;
        const runway = runwayRef.current;
        const screen = screenRef.current;
        if (!runway || !screen) return;

        section.setAttribute("data-on", "");
        const tiles = gsap.utils.toArray<HTMLElement>(row.querySelectorAll("[data-sr-tile]"));
        const halos = gsap.utils.toArray<HTMLElement>(row.querySelectorAll(".dt-starrev_halo"));
        const sweeps = gsap.utils.toArray<HTMLElement>(row.querySelectorAll(".dt-starrev_sweep"));
        const els = gsap.utils.toArray<HTMLElement>(section.querySelectorAll("[data-sr-el]"));
        const chars = gsap.utils.toArray<HTMLElement>(intro.querySelectorAll(".dt-starrev_char"));

        // Stato d'attesa: tessere e contenuto spenti dietro l'intro a tutta
        // pagina. SOLO opacity, mai autoAlpha: il contenuto attorno alle
        // stelle (CTA, sigillo) deve restare nel tab order.
        gsap.set(tiles, { opacity: 0, scale: 0.7 });
        // L'alone parte spento: l'accensione è il suo colpo di luce.
        gsap.set(halos, { opacity: 0 });
        gsap.set(els, { opacity: 0, y: 24 });
        // La stella piccola appare dal fondo pulito che il muro consegna:
        // l'intro parte spenta e i caratteri del cover partono "stirati"
        // (grammatica della demo 3: entrano quando la stella è a tutto schermo).
        gsap.set(intro, { autoAlpha: 0 });
        gsap.set(chars, { opacity: 0, scaleY: 8, scaleX: 0.1, transformOrigin: "50% 100%" });

        // GEOMETRIA A PROXY: la stella resta SEMPRE regolare perché non si
        // interpolano stringhe di poligoni ma centro (cx, cy) e raggio (r) —
        // la clip-path viene rigenerata a ogni frame dalla misura corrente
        // dello schermo. I vertici viaggiano sui raggi: nessuna scheggiatura
        // a metà morph, a qualunque viewport, anche durante un resize.
        const geo = { cx: 0, cy: 0, r: 0 };
        const applyClip = () => {
          const sr = screen.getBoundingClientRect();
          intro.style.clipPath = starClipPath(sr.width, sr.height, geo.cx, geo.cy, geo.r);
        };
        const centerX = () => screen.getBoundingClientRect().width / 2;
        const centerY = () => screen.getBoundingClientRect().height / 2;
        const smallR = () => {
          const sr = screen.getBoundingClientRect();
          return Math.min(sr.width, sr.height) * 0.21;
        };
        // Copre tutto lo schermo quando il raggio INTERNO supera la semidiagonale
        const coverR = () => {
          const sr = screen.getBoundingClientRect();
          return (Math.hypot(sr.width, sr.height) / 2 / STAR_INNER_RATIO) * 1.08;
        };
        const tileC = () => {
          const sr = screen.getBoundingClientRect();
          const tr = tiles[CENTER].getBoundingClientRect();
          return {
            cx: tr.left - sr.left + tr.width / 2,
            cy: tr.top - sr.top + tr.height / 2,
            r: tr.width / 2,
          };
        };

        // Il continuo di scroll (grammatica dell'orizzonte "Perché scegliere
        // Domus Tua"), arco della DEMO 3 del riferimento (richiesta 2026-08-04):
        // il muro consegna lo sfondo pulito → la foto Top Agency appare
        // PICCOLA, croppata a stella, centrata → lo scroll la ZOOMA a tutto
        // schermo (flash + titolo a caratteri stirati) → poi si richiude
        // nella stella centrale della fila. Scrub = bidirezionale per natura.
        const introImg = intro.querySelector("img");
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: runway,
            // "top 55%", non "top top": la stella comincia ad accendersi
            // mentre il muro svuotato sta ancora lasciando il viewport — lo
            // scroll legge UNA pagina continua, senza il vuoto di un intero
            // schermo tra i due capitoli (richiesta 2026-08-04).
            start: "top 55%",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        tl
          // A. La stella piccola appare, centrata sul fondo pulito
          .fromTo(intro, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: "none" }, 0.02)
          // B. Zoom-in della demo 3: il raggio cresce fino a coprire lo schermo
          .fromTo(
            geo,
            { cx: centerX, cy: centerY, r: smallR },
            { r: coverR, duration: 0.42, ease: "power4.inOut", onUpdate: applyClip },
            0.14
          )
          .fromTo(introImg, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: "power2.inOut" }, 0.12)
          // Flash del riferimento a cavallo del fullscreen
          .to(introImg, { filter: "brightness(1.5) saturate(1.35)", duration: 0.14, ease: "power2.in" }, 0.4)
          .to(introImg, { filter: "brightness(1.01) saturate(1.06)", duration: 0.18, ease: "power2.out" }, 0.54)
          // C. Il titolo entra coi caratteri stirati (demo 3: scaleY 8 → 1, dalla fine)
          .to(
            chars,
            { opacity: 1, scaleY: 1, scaleX: 1, duration: 0.16, ease: "power3.out", stagger: { each: 0.014, from: "end" } },
            0.46
          )
          // D. Il titolo esce mentre la stella si richiude nella tessera centrale
          .to(
            chars,
            { scaleY: 0, opacity: 0, duration: 0.1, ease: "power2.in", stagger: { each: 0.008, from: "center" } },
            0.68
          )
          .to(
            geo,
            {
              cx: () => tileC().cx,
              cy: () => tileC().cy,
              r: () => tileC().r,
              duration: 0.28,
              ease: "power4.inOut",
              onUpdate: applyClip,
            },
            0.7
          )
          // E. L'ACCENSIONE. La foto si è appena posata nella tessera
          // centrale: da lì l'oro si propaga verso i lati (stagger "center").
          // Il corpo sale in opacity/scale…
          .to(
            tiles,
            { opacity: 1, scale: 1, duration: 0.12, ease: "power2.out", stagger: { each: 0.015, from: "center" } },
            0.9
          )
          // …e l'alone dà il colpo di luce: sovraelongazione a 1 e ritorno al
          // valore di riposo. Due tween invece di un keyframe perché lo scrub
          // deve poterli percorrere all'indietro senza scatti.
          .to(halos, { opacity: 1, duration: 0.06, ease: "power2.out", stagger: { each: 0.015, from: "center" } }, 0.9)
          .to(halos, { opacity: 0.5, duration: 0.14, ease: "power2.inOut", stagger: { each: 0.015, from: "center" } }, 0.97)
          .to(els, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out", stagger: 0.015 }, 0.94)
          .to(intro, { autoAlpha: 0, duration: 0.08 }, 1.02)
          // Coda di respiro prima dello sgancio dello sticky
          .to({}, { duration: 0.2 }, 1.1);

        // RIFLESSO CONTINUO — l'unica animazione a tempo del capitolo (tutto
        // il resto è scrubbato). Una banda di luce attraversa le stelle una
        // dopo l'altra, poi il metallo respira nella pausa. La rotazione la
        // mette GSAP, non il CSS: se restasse nel CSS, animare xPercent
        // riscriverebbe `transform` per intero e la banda si raddrizzerebbe.
        gsap.set(sweeps, { rotate: 16 });
        const shimmer = gsap.fromTo(
          sweeps,
          { xPercent: -160 },
          {
            xPercent: 420,
            duration: 1.25,
            ease: "power1.inOut",
            stagger: { each: 0.14 },
            repeat: -1,
            repeatDelay: 2.8,
            paused: true,
          }
        );
        // Respiro dell'alone su SCALE, mai su opacity: l'opacity dell'alone è
        // scritta dallo scrub dell'accensione, e due tween sulla stessa
        // proprietà si strapperebbero il valore a vicenda.
        const breath = gsap.to(halos, {
          scale: 1.07,
          duration: 2.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.18 },
          paused: true,
        });
        // Fuori scena: pausa e via il will-change (5 layer promossi a vuoto
        // per tutta la pagina sono memoria video sprecata).
        const lit = ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            if (self.isActive) {
              section.setAttribute("data-lit", "");
              shimmer.play();
              breath.play();
            } else {
              section.removeAttribute("data-lit");
              shimmer.pause();
              breath.pause();
            }
          },
        });

        // Tastiera: contenuto pinnato = si porta lo scroll a fine runway
        // (pattern del footer), così focus ring e contenuto sono davvero visibili.
        const onFocusIn = () => {
          const st = tl.scrollTrigger;
          if (!st || st.progress >= 0.95) return;
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(st.end, { immediate: true });
          else window.scrollTo({ top: st.end, behavior: "instant" as ScrollBehavior });
        };
        stage.addEventListener("focusin", onFocusIn);

        // Widget: rivelato con la stessa lingua (stella → aperto), una volta.
        let wst: ScrollTrigger | null = null;
        const widget = widgetRef.current;
        if (widget) {
          // Solo opacity (mai autoAlpha): dentro ci sono link e iframe che
          // devono restare raggiungibili da tastiera per la rete focusin.
          gsap.set(widget, { opacity: 0 });
          // Replay a ogni passaggio: tween persistente (niente clearProps),
          // restart all'ingresso e reverse risalendo oltre l'inizio.
          let wtl: gsap.core.Tween | null = null;
          wst = ScrollTrigger.create({
            trigger: widget,
            start: "top 82%",
            onEnter: () => {
              if (!wtl) {
                const r = widget.getBoundingClientRect();
                // Stessa tecnica a proxy: raggio animato, clip rigenerata.
                const wgeo = { r: Math.min(r.width, r.height) * 0.18, o: 0 };
                const wCover = (Math.hypot(r.width, r.height) / 2 / STAR_INNER_RATIO) * 1.08;
                wtl = gsap.to(wgeo, {
                  r: wCover,
                  o: 1,
                  duration: 1.2,
                  ease: "domus.inOut",
                  paused: true,
                  onUpdate: () => {
                    widget.style.opacity = String(wgeo.o);
                    widget.style.clipPath = starClipPath(r.width, r.height, r.width / 2, r.height / 2, wgeo.r);
                  },
                });
              }
              wtl.restart();
              const snap = wtl;
              window.setTimeout(() => {
                if (snap.progress() === 0) snap.progress(1);
              }, 1800);
            },
            onLeaveBack: () => wtl?.reverse(),
          });
          const revealWidget = () => {
            wst?.kill();
            gsap.set(widget, { clearProps: "opacity,clipPath" });
          };
          widget.addEventListener("focusin", revealWidget, { once: true });
        }

        return () => {
          section.removeAttribute("data-on");
          section.removeAttribute("data-lit");
          stage.removeEventListener("focusin", onFocusIn);
          tl.scrollTrigger?.kill();
          tl.kill();
          shimmer.kill();
          breath.kill();
          lit.kill();
          wst?.kill();
        };
      });
    },
    { scope: sectionRef }
  );

  return (
    // Niente bg-cream proprio: la sezione vive dentro la superficie curva di
    // HorizonStory — un secondo bloom qui riaccenderebbe la linea d'ombra al
    // confine col muro delle voci (il "taglio" segnalato il 2026-08-04).
    <section ref={sectionRef} id="recensioni" className="dt-starrev relative">
      {/* Runway + schermo sticky ([data-on]): lo scroll scolpisce il morph —
          la foto Top Agency arriva a TUTTA PAGINA come prosecuzione della
          sezione precedente e, scendendo, entra dentro la stella centrale.
          Senza [data-on] (mobile/reduced/no-JS): flusso normale, statico. */}
      <div ref={runwayRef} className="dt-starrev_runway">
        <div ref={screenRef} className="dt-starrev_screen relative">
          {/* Intro full-bleed (decorativa: la tessera vera sta sotto, identica) */}
          <div ref={introRef} aria-hidden className="dt-starrev_intro pointer-events-none absolute inset-0 hidden overflow-hidden">
            <Image src={INTRO_IMG} alt="" fill sizes="100vw" className="photo-warm object-cover" />
            {/* Velo caldo + titolo-cover gigante: i caratteri escono in scaleY
                con stagger dal centro mentre la stella si chiude (rif. Codrops). */}
            <div className="absolute inset-0 bg-wine/30" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <span className="dt-starrev_cover text-center font-display font-medium leading-none text-cream">
                {c.coverWord.split("").map((ch, i) => (
                  <span key={i} className="dt-starrev_char inline-block">
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div ref={stageRef} className="dt-starrev_stage relative mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        {/* Testa: eyebrow + titolo + voto */}
        <div className="text-center">
          <span data-sr-el className="eyebrow eyebrow--center justify-center">
            {c.eyebrow}
          </span>
          {/* Il titolo arriva col beat finale dello scrub (wrapper data-sr-el):
              durante l'arco stella-piccola → fullscreen la scena resta pulita. */}
          <div data-sr-el>
            <TextLines
              as="h2"
              className="mx-auto mt-5 max-w-[20ch] font-display text-d3 display-tight font-medium text-ink"
            >
              {c.title}
            </TextLines>
          </div>
          <p data-sr-el className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-stone">
            <span className="flex items-center gap-2">
              <span className="tnum font-display text-2xl font-medium text-ink">{site.rating.replace(".", ",")}</span>
              {/* Le stelline del voto seguono il materiale della fila: rosso e
                  oro nello stesso blocco leggerebbero come due sistemi. */}
              <span className="flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-3.5 w-3.5 text-gold" />
                ))}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Google className="h-3.5 w-3.5" /> {c.ratingLine(String(site.reviewsCount))}
            </span>
          </p>
          <p data-sr-el className="mx-auto mt-4 max-w-xl text-[0.98rem] leading-relaxed text-stone">
            {c.subtitle}
          </p>
        </div>

        {/* La fila delle cinque stelle */}
        <ul ref={rowRef} className="dt-starrev_row mx-auto mt-10 grid w-full max-w-[1050px] grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
          {STARS.map((s) => {
            const sc = c.stars[s.key];
            return (
              <li key={s.key} className="flex flex-col items-center gap-3">
                {/* La stella è puro segno grafico: tre strati ritagliati dalla
                    stessa clip-path a 10 vertici — alone sfocato dietro, corpo
                    metallico, riflesso che lo attraversa. Nessuna fotografia,
                    nessun click: decorativa, quindi aria-hidden. Il senso lo
                    portano l'etichetta e la didascalia, che sono testo vero. */}
                <span data-sr-tile aria-hidden className="dt-starrev_star">
                  <span className="dt-starrev_halo" />
                  <span className="dt-starrev_gold">
                    <span className="dt-starrev_sweep" />
                  </span>
                </span>
                <span data-sr-el className="block text-center">
                  <span className="block text-[0.6rem] font-semibold leading-tight text-graphite sm:text-[0.8rem]">
                    {sc.label}
                  </span>
                  {/* Sotto sm la fila è di cinque colonne strettissime: la
                      didascalia diventerebbe una colonna di sillabe. */}
                  <span className="mt-1 hidden text-[0.72rem] leading-snug text-stone sm:block">{sc.caption}</span>
                </span>
              </li>
            );
          })}
        </ul>

        {/* CTA + sigillo Top Agency */}
        <div data-sr-el className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
          <Cta href={site.googleReviewsUrl} variant="cta" size="md" target="_blank" rel="noopener noreferrer">
            {c.cta}
          </Cta>
          {/* Sigillo Wikicasa: fluttua piano (dt-float), fermo con reduced-motion.
              Il claim di autorevolezza (ex banda Authority) chiude il cluster prova.
              Quando il cliente consegna la foto del certificato Top Agency 2026
              (docs/da-chiedere-alla-cliente.md §2.11) il sigillo diventa il fronte di un
              flip certificato/badge — lo slot è questo. */}
          <a
            href="https://www.wikicasa.it/agenzia-immobiliare/domus-tua-178643"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={c.awardAria}
            className="dt-starrev_award group flex items-center gap-3"
          >
            <span className="block" style={{ animation: "dt-float 7s ease-in-out infinite" }}>
              <Image
                src="/badges/wikicasa-top-agency.svg"
                alt=""
                width={120}
                height={58}
                unoptimized
                className="transition-transform duration-500 ease-[cubic-bezier(0.22,0.9,0.36,1)] group-hover:-rotate-2 group-hover:scale-105"
              />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-ink">{c.awardLabel}</span>
              <span className="link-draw block text-[0.8rem] text-stone">{c.awardSub}</span>
            </span>
          </a>
        </div>
        <p data-sr-el className="mx-auto mt-7 max-w-md text-center text-sm italic leading-snug text-stone">
          {c.claim}
        </p>

          </div>
        </div>
      </div>

      {/* Parola per parola: il widget Trustindex (o la prova reale senza consenso) */}
      <div className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8 sm:pb-20">
        <div ref={widgetRef}>
          <h3 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">{c.widgetTitle}</h3>
          {showTrustindex ? (
            <div className="mt-6">
              <TrustindexEmbed title={c.iframeTitle} />
            </div>
          ) : (
            <div className="mt-6 rounded-[1.75rem] border border-line bg-paper p-8 text-center">
              <p className="mx-auto max-w-md text-[0.98rem] leading-relaxed text-graphite">
                {awaitingConsent ? c.consentGate : c.widgetNote}
              </p>
              <Cta
                href={site.googleReviewsUrl}
                variant="cta"
                size="sm"
                className="mt-5"
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.cta}
              </Cta>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
