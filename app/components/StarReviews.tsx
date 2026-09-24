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

   PARITÀ MOBILE 2 (2026-08-18, scheda 16): il film è lo STESSO a ogni
   larghezza — stella che si forma, zoom, lampo, caratteri stirati,
   accensione della fila — e cambiano tre parametri: il palcoscenico
   ([data-on] = schermo sticky sul desktop, [data-sr-mob] = un box ancorato
   alla fila sul telefono, perché la legge 4 vieta di pinnare), l'orologio
   (scrub sul desktop, timeline `once` a tempo sul telefono) e il contorno
   (sotto lg il testo della sezione non si spegne: il box non lo copre).
   Progressive enhancement invariato: entrambi gli attributi li mette JS —
   senza JS e con reduced-motion la sezione è completa e statica, con le
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
/** Quanto dura il film sul telefono, dove non c'è lo scroll a scandirlo (parità
    mobile 2, scheda 16). Non è una durata nuova inventata per il mobile: è la
    STESSA timeline del desktop — 1,3 unità di posizioni e le sue ease — letta
    da un orologio invece che dallo scroll. Si cambia qui, in un posto solo. */
const FILM_MS = 3000;

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
      venditori: { label: "Venditori", caption: "Dalla valutazione seria al rogito, un riferimento solo." },
      acquirenti: { label: "Acquirenti", caption: "La casa giusta, con documenti già verificati." },
      openDomus: { label: "Open Domus", caption: "La visita che trasforma l'interesse in proposte." },
      esperienza: { label: "Esperienza", caption: "Ogni passaggio spiegato, ogni dubbio ascoltato." },
      team: { label: "Il team", caption: "Persone prima degli immobili, ogni giorno." },
    },
    widgetTitle: "Verificate da Trustindex",
    widgetNote: "Recensioni Google verificate tramite Trustindex.",
    consentGate:
      "Il widget delle recensioni è di Trustindex: si carica solo dopo il tuo consenso ai cookie. Puoi leggerle subito su Google.",
    iframeTitle: "Recensioni Google verificate di Domus Tua (Trustindex)",
    // Solo la CODA del nome accessibile: la testa è il testo visibile, e la
    // compone il JSX. Vedi il commento sul link del sigillo, in fondo.
    awardAriaHint: "apri il profilo di Domus Tua (scheda nuova)",
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
      venditori: { label: "Sellers", caption: "From a serious valuation to the deed, a single point of contact." },
      acquirenti: { label: "Buyers", caption: "The right home, with documents already verified." },
      openDomus: { label: "Open Domus", caption: "The visit that turns interest into offers." },
      esperienza: { label: "Experience", caption: "Every step explained, every doubt heard." },
      team: { label: "The team", caption: "People before properties, every day." },
    },
    widgetTitle: "Verified by Trustindex",
    widgetNote: "Google reviews verified via Trustindex.",
    consentGate:
      "The reviews widget is provided by Trustindex: it loads only after you accept cookies. You can read the reviews on Google right away.",
    iframeTitle: "Verified Google reviews of Domus Tua (Trustindex)",
    awardAriaHint: "open the Domus Tua profile (new tab)",
    claim:
      "Three years running among Italy's 400 best estate agencies, in a national ranking built on revenue. From an independent, women-led agency with a single office: Tradate.",
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
      venditori: { label: "Vendeurs", caption: "De l'estimation sérieuse à l'acte, un seul interlocuteur." },
      acquirenti: { label: "Acheteurs", caption: "Le bon logement, avec des documents déjà vérifiés." },
      openDomus: { label: "Open Domus", caption: "La visite qui transforme l'intérêt en offres." },
      esperienza: { label: "Expérience", caption: "Chaque étape expliquée, chaque doute écouté." },
      team: { label: "L'équipe", caption: "Les personnes avant les biens, chaque jour." },
    },
    widgetTitle: "Vérifiés par Trustindex",
    widgetNote: "Avis Google vérifiés via Trustindex.",
    consentGate:
      "Le widget d'avis est fourni par Trustindex : il ne se charge qu'après votre consentement aux cookies. Vous pouvez lire les avis sur Google dès maintenant.",
    iframeTitle: "Avis Google vérifiés de Domus Tua (Trustindex)",
    awardAriaHint: "ouvrir le profil de Domus Tua (nouvel onglet)",
    claim:
      "Trois années consécutives parmi les 400 meilleures agences immobilières d'Italie, dans un classement national fondé sur le chiffre d'affaires. Par une agence indépendante, dirigée par des femmes, avec une seule adresse : Tradate.",
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
      venditori: { label: "Verkäufer", caption: "Von der seriösen Bewertung bis zum Notartermin, eine einzige Ansprechperson." },
      acquirenti: { label: "Käufer", caption: "Das richtige Zuhause, mit bereits geprüften Dokumenten." },
      openDomus: { label: "Open Domus", caption: "Der Besuch, der Interesse in Angebote verwandelt." },
      esperienza: { label: "Erfahrung", caption: "Jeder Schritt erklärt, jeder Zweifel gehört." },
      team: { label: "Das Team", caption: "Menschen vor Immobilien, jeden Tag." },
    },
    widgetTitle: "Von Trustindex verifiziert",
    widgetNote: "Google-Bewertungen, verifiziert über Trustindex.",
    consentGate:
      "Das Bewertungs-Widget stammt von Trustindex: Es lädt erst nach Ihrer Cookie-Einwilligung. Die Bewertungen können Sie sofort auf Google lesen.",
    iframeTitle: "Verifizierte Google-Bewertungen von Domus Tua (Trustindex)",
    awardAriaHint: "das Profil von Domus Tua öffnen (neuer Tab)",
    claim:
      "Drei Jahre in Folge unter den 400 besten Immobilienagenturen Italiens, in einem nationalen Ranking nach Umsatz. Von einer unabhängigen, von Frauen geführten Agentur mit einem einzigen Standort: Tradate.",
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
      venditori: { label: "Vendedores", caption: "De la tasación seria a la escritura, una sola referencia." },
      acquirenti: { label: "Compradores", caption: "La casa adecuada, con documentos ya verificados." },
      openDomus: { label: "Open Domus", caption: "La visita que convierte el interés en propuestas." },
      esperienza: { label: "Experiencia", caption: "Cada paso explicado, cada duda escuchada." },
      team: { label: "El equipo", caption: "Personas antes que inmuebles, cada día." },
    },
    widgetTitle: "Verificadas por Trustindex",
    widgetNote: "Reseñas de Google verificadas mediante Trustindex.",
    consentGate:
      "El widget de reseñas es de Trustindex: se carga solo tras tu consentimiento de cookies. Puedes leer las reseñas en Google ahora mismo.",
    iframeTitle: "Reseñas de Google verificadas de Domus Tua (Trustindex)",
    awardAriaHint: "abrir el perfil de Domus Tua (nueva pestaña)",
    claim:
      "Tres años consecutivos entre las 400 mejores agencias inmobiliarias de Italia, en una clasificación nacional basada en la facturación. De una agencia independiente, liderada por mujeres, con una sola sede: Tradate.",
  },
};

/* ─────────────────────────────── Sezione ─────────────────────────────────── */

export default function StarReviews() {
  const { locale } = useLocale();
  const c = copy[locale];
  // "2024 · 2025 · 2026". Composto qui e usato SIA nel testo visibile SIA nella coda
  // dell'aria-label: se un giorno cambia un anno, i due non possono divergere — che è
  // esattamente il difetto (label-content-name-mismatch) già corretto una volta qui.
  const awardYears = site.award.years.join(" · ");
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
      const runway = runwayRef.current;
      const screen = screenRef.current;
      if (!section || !stage || !intro || !row || !runway || !screen) return;

      const mm = gsap.matchMedia();
      mm.add({ lg: MQ.lg, motionOk: MQ.motionOk }, (ctx) => {
        const cond = ctx.conditions as { lg: boolean; motionOk: boolean };
        if (!cond.motionOk) return;

        /* ── LO STESSO FILM A OGNI LARGHEZZA (parità mobile 2, 2026-08-18) ───
           Fino a qui il telefono aveva un ramo suo: niente foto, niente morph,
           solo l'accensione delle tessere. La motivazione scritta era il costo
           — «applyClip riserializza una clip-path a 10 vertici a partire da un
           getBoundingClientRect A OGNI FRAME» — ed era vera per metà: il conto
           salato è il getBoundingClientRect (un layout sincrono per frame), non
           l'aritmetica dei dieci vertici. Tolta quella misura (v. `measure()`
           qui sotto), del morph resta paint di clip-path, che la dottrina di
           questa onda ammette a patto di nominare l'alleggerimento.
           Quindi da qui c'è UN film solo — stessi atti, stesso ordine, stesse
           ease — e le due larghezze cambiano tre parametri:
             · il PALCOSCENICO: sul desktop lo schermo sticky su una runway di
               360 svh; sul telefono un BOX ancorato alla fila delle stelle,
               perché la legge 4 vieta di pinnare (con 100 svh di sticky una
               runway da 1,2 vh lascerebbe 0,2 vh di corsa: non è una corsa);
             · l'OROLOGIO: scrub sul desktop, timeline `once` A TEMPO (~3 s) sul
               telefono — è l'idioma dell'accensione che il ramo mobile usava
               già, applicato a tutto il film;
             · il CONTORNO: sul telefono il testo della sezione (`[data-sr-el]`)
               resta fermo e visibile, perché il box copre la fila e non lo
               schermo: non c'è nulla da nascondere dietro il sipario. */
        const tiles = gsap.utils.toArray<HTMLElement>(row.querySelectorAll("[data-sr-tile]"));
        if (!tiles.length) return;
        const halos = gsap.utils.toArray<HTMLElement>(row.querySelectorAll(".dt-starrev_halo"));
        const sweeps = gsap.utils.toArray<HTMLElement>(row.querySelectorAll(".dt-starrev_sweep"));
        const els = gsap.utils.toArray<HTMLElement>(section.querySelectorAll("[data-sr-el]"));
        const chars = gsap.utils.toArray<HTMLElement>(intro.querySelectorAll(".dt-starrev_char"));
        const introImg = intro.querySelector("img");
        const flash = intro.querySelector<HTMLElement>(".dt-starrev_flash");
        const cleanup: (() => void)[] = [];

        // Il palcoscenico si dichiara PRIMA di ogni misura: [data-on] fa
        // runway + schermo sticky, [data-sr-mob] rende presente il layer intro
        // come box (in globals.css). Nessuno dei due esiste senza JS.
        section.setAttribute(cond.lg ? "data-on" : "data-sr-mob", "");

        /* IL BOX MOBILE. Sul desktop il layer intro è `inset: 0` dello schermo
           sticky, cioè il viewport. Sul telefono lo schermo sticky non c'è e
           `inset: 0` sarebbe l'intera sezione (il doppio del viewport): il film
           vive quindi in un riquadro ancorato alla FILA — dov'è la tessera in
           cui la foto deve posarsi — alto al più 62 svh. Due custom property,
           scritte qui e non in CSS perché la quota della fila la sa solo il
           layout; e scritte UNA VOLTA, non per frame. */
        const placeBox = () => {
          const sr = screen.getBoundingClientRect();
          const rr = row.getBoundingClientRect();
          const bottom = rr.bottom - sr.top + 10;
          const h = Math.min(window.innerHeight * 0.62, bottom);
          section.style.setProperty("--sr-box-top", `${Math.max(0, bottom - h)}px`);
          section.style.setProperty("--sr-box-h", `${h}px`);
        };

        /* ── L'ALLEGGERIMENTO NOMINATO (a): LA MISURA, UNA VOLTA ─────────────
           Il riquadro del film e la tessera d'arrivo si misurano qui e a ogni
           rimisura di ScrollTrigger (rotazione, font, altezze dinamiche), non
           dentro `applyClip`: per frame resta la sola aritmetica dei vertici.
           È la cosa più cara per frame del sito che se ne va, e vale a ogni
           larghezza — il desktop ci guadagna quanto il telefono. */
        const boxG = { w: 0, h: 0 };
        const tileG = { cx: 0, cy: 0, r: 0 };
        const measure = () => {
          if (!cond.lg) placeBox();
          const br = intro.getBoundingClientRect();
          const t = tiles[CENTER];
          const tr = t.getBoundingClientRect();
          // Una misura degenere (sezione ancora senza layout, o nascosta a
          // metà transizione di pagina) non deve sostituire l'ultima buona: la
          // clip-path in percentuali di zero è un poligono di NaN, cioè il
          // layer che sparisce. Meglio un riquadro vecchio di un frame.
          if (br.width <= 0 || br.height <= 0 || tr.width <= 0) return;
          boxG.w = br.width;
          boxG.h = br.height;
          // Il rect di una tessera SCALATA è scalato: normalizzando per la
          // scala corrente il raggio d'arrivo è quello della stella d'oro
          // finita — la foto si posa dentro la tessera, non dentro il suo 70 %
          // d'attesa — e non dipende dall'istante in cui misuriamo.
          const s = (gsap.getProperty(t, "scaleX") as number) || 1;
          tileG.cx = tr.left - br.left + tr.width / 2;
          tileG.cy = tr.top - br.top + tr.height / 2;
          tileG.r = tr.width / s / 2;
        };

        // Stato d'attesa: tessere e alone spenti dietro il layer intro. SOLO
        // opacity, mai autoAlpha: il contenuto attorno alle stelle (CTA Google,
        // sigillo Wikicasa) deve restare nel tab order.
        gsap.set(tiles, { opacity: 0, scale: 0.7 });
        // L'alone parte spento: l'accensione è il suo colpo di luce.
        gsap.set(halos, { opacity: 0 });
        // La stella piccola appare dal fondo pulito che il muro consegna:
        // l'intro parte spenta e i caratteri del cover partono "stirati"
        // (grammatica della demo 3: entrano quando la stella è a tutto schermo).
        gsap.set(intro, { autoAlpha: 0 });
        gsap.set(chars, { opacity: 0, scaleY: 8, scaleX: 0.1, transformOrigin: "50% 100%" });
        gsap.set(flash, { opacity: 0 });
        // Il testo della sezione si spegne SOLO dove il sipario lo copre per
        // davvero, cioè sotto lo schermo sticky del desktop.
        if (cond.lg) gsap.set(els, { opacity: 0, y: 24 });

        measure();
        /* `refreshInit` E NON `refresh`, ed è una correzione di ORDINE, non di
           gusto. In `_refreshAll` ScrollTrigger fa in fila: dispatch di
           "refreshInit" → revert → `t.refresh()` di ogni trigger (dove
           `invalidateOnRefresh` invalida la timeline) → `_updateAll()` (dove i
           valori funzione — `centerX`, `smallR`, `() => tileG.cx` — vengono
           ri-letti e RICONGELATI) → dispatch di "refresh".
           Agganciata a "refresh", la rimisura arrivava dopo che i nuovi
           estremi erano già stati presi dal riquadro VECCHIO: dopo una
           rotazione lo zoom finiva alla misura di prima e la stella si posava
           accanto alla tessera, non dentro, fino al refresh successivo.
           `refreshInit` è lo stesso aggancio che usa HorizontalRail per la
           stessa ragione, e le due misure qui sono entrambe RELATIVE (fila
           rispetto allo schermo, tessera rispetto al riquadro): il revert dei
           pin che avviene subito dopo non le sposta. */
        ScrollTrigger.addEventListener("refreshInit", measure);
        cleanup.push(() => ScrollTrigger.removeEventListener("refreshInit", measure));

        // GEOMETRIA A PROXY: la stella resta SEMPRE regolare perché non si
        // interpolano stringhe di poligoni ma centro (cx, cy) e raggio (r) —
        // la clip-path viene rigenerata a ogni frame dalla misura CORRENTE del
        // riquadro. I vertici viaggiano sui raggi: nessuna scheggiatura a metà
        // morph, a qualunque viewport, anche durante un resize.
        const geo = { cx: 0, cy: 0, r: 0 };
        const applyClip = () => {
          intro.style.clipPath = starClipPath(boxG.w, boxG.h, geo.cx, geo.cy, geo.r);
        };
        const centerX = () => boxG.w / 2;
        const centerY = () => boxG.h / 2;
        const smallR = () => Math.min(boxG.w, boxG.h) * 0.21;
        // Copre tutto il riquadro quando il raggio INTERNO supera la semidiagonale
        const coverR = () => (Math.hypot(boxG.w, boxG.h) / 2 / STAR_INNER_RATIO) * 1.08;
        // Il ritaglio esiste PRIMA che il layer si accenda: fra l'atto A
        // (autoAlpha) e l'atto B (zoom) il riquadro non deve mai mostrarsi come
        // rettangolo — sul telefono, dove il box sta in mezzo al testo, si
        // vedrebbe come un lampo di fotografia fuori posto.
        geo.cx = centerX();
        geo.cy = centerY();
        geo.r = smallR();
        applyClip();

        /* ── L'ALLEGGERIMENTO NOMINATO (b): `will-change` A TEMPO ────────────
           Il livello promosso serve solo dentro la finestra del film, non per
           tutta la pagina come faceva la regola `[data-on] .dt-starrev_intro`
           di globals.css fino al 2026-08-18. Sul desktop la finestra è quella
           del trigger scrubbato (dal primo all'ultimo atto, in entrambi i
           versi); sul telefono è la timeline stessa. */
        const morphOn = () => intro.setAttribute("data-sr-morph", "");
        const morphOff = () => intro.removeAttribute("data-sr-morph");
        cleanup.push(morphOff);

        // La quota d'ingresso del telefono, scritta una volta sola: la usano il
        // trigger e la sua rete di sicurezza, e devono dire lo stesso numero.
        // Il trigger è la FILA, non lo stage: lo stage a 390 è alto ~1 400 px,
        // e ancorato lassù il film partirebbe con il box ancora sotto la piega
        // — la stella si poserebbe fuori scena. Il box comincia ~500 px sopra
        // la fila, quindi a `top 85%` della fila il riquadro è tutto in vista.
        const startPct = 85;

        // Il continuo di scroll (grammatica dell'orizzonte "Perché scegliere
        // Domus Tua"), arco della DEMO 3 del riferimento (richiesta 2026-08-04):
        // il muro consegna lo sfondo pulito → la foto Top Agency appare
        // PICCOLA, croppata a stella, centrata → lo scroll la ZOOMA a tutto
        // riquadro (lampo + titolo a caratteri stirati) → poi si richiude nella
        // stella centrale della fila. Sul desktop è scrub (bidirezionale per
        // natura); sul telefono la stessa timeline suonata a tempo.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: cond.lg
            ? {
                trigger: runway,
                // "top 55%", non "top top": la stella comincia ad accendersi
                // mentre il muro svuotato sta ancora lasciando il viewport — lo
                // scroll legge UNA pagina continua, senza il vuoto di un intero
                // schermo tra i due capitoli (richiesta 2026-08-04).
                start: "top 55%",
                end: "bottom bottom",
                scrub: 0.6,
                invalidateOnRefresh: true,
                onToggle: (self) => (self.isActive ? morphOn() : morphOff()),
              }
            : {
                trigger: row,
                start: `top ${startPct}%`,
                // `once`: dopo il film il trigger si spegne da solo. Serve
                // contro il difetto di famiglia registrato nell'audit (§6.15):
                // un refresh da resize su `toggleActions … reverse`
                // rispegnerebbe la fila con la rete di sicurezza già spesa.
                once: true,
                invalidateOnRefresh: true,
              },
          onStart: cond.lg ? undefined : morphOn,
          onComplete: cond.lg ? undefined : morphOff,
        });
        tl
          // A. La stella piccola appare, centrata sul fondo pulito
          .fromTo(intro, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: "none" }, 0.02)
          // B. Zoom-in della demo 3: il raggio cresce fino a coprire il riquadro
          .fromTo(
            geo,
            { cx: centerX, cy: centerY, r: smallR },
            { r: coverR, duration: 0.42, ease: "power4.inOut", onUpdate: applyClip },
            0.14
          )
          .fromTo(introImg, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: "power2.inOut" }, 0.12)
          /* Il LAMPO del riferimento a cavallo del fullscreen. Fino al
             2026-08-18 erano due tween di `filter: brightness() saturate()`
             sulla foto: un filtro per frame su un'immagine a tutto schermo è
             ricalcolo di pixel, ed è nell'elenco anti-pattern dell'onda. Stesso
             effetto — la luce che sale e ricade lasciando la foto un filo più
             chiara — con un velo caldo in sola `opacity` sopra la fotografia e
             sotto il velo di vino: composited, e senza il salto di layer che
             `filter` provoca. Il guadagno è di TUTTE le larghezze, non solo del
             telefono: il desktop lo suona da qui in poi allo stesso modo. */
          .to(flash, { opacity: 0.5, duration: 0.14, ease: "power2.in" }, 0.4)
          .to(flash, { opacity: 0.04, duration: 0.18, ease: "power2.out" }, 0.54)
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
              cx: () => tileG.cx,
              cy: () => tileG.cy,
              r: () => tileG.r,
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
          // deve poterli percorrere all'indietro senza scatti, e perché così
          // l'ultimo tween È lo stato finale: la rete di sicurezza del telefono
          // ha un posto dove atterrare con progress(1).
          .to(halos, { opacity: 1, duration: 0.06, ease: "power2.out", stagger: { each: 0.015, from: "center" } }, 0.9)
          .to(halos, { opacity: 0.5, duration: 0.14, ease: "power2.inOut", stagger: { each: 0.015, from: "center" } }, 0.97)
          .to(intro, { autoAlpha: 0, duration: 0.08 }, 1.02)
          // Coda di respiro prima dello sgancio dello sticky
          .to({}, { duration: 0.2 }, 1.1);
        // Il testo della sezione entra col beat finale: solo dove era stato
        // spento (desktop), altrimenti non c'è nulla da riaccendere.
        if (cond.lg) tl.to(els, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out", stagger: 0.015 }, 0.94);

        if (!cond.lg) {
          // L'OROLOGIO ADATTATO, e nient'altro: la timeline vale 1,3 "unità"
          // (le stesse posizioni che sul desktop scandisce lo scroll), suonate
          // a tempo diventano i ~3 s della scheda 16. Nessun atto tolto,
          // nessuna ease cambiata: solo il timeScale.
          tl.timeScale(tl.duration() / (FILM_MS / 1000));

          // Reti di sicurezza, stesso patto di Reveal/Footer: il fuoco da
          // tastiera che entra nella scena accende comunque. Le stelle sono
          // decorative (aria-hidden) ma stanno fra due link veri: nessuno deve
          // tabulare dentro una fila spenta.
          const reveal = () => {
            tl.progress(1);
            morphOff();
          };
          stage.addEventListener("focusin", reveal, { once: true });
          // La rete a tempo, invece, va GUARDATA, e la trappola merita di
          // restare scritta: su un elemento a undici schermate dalla cima un
          // timeout secco non salva l'animazione, LA ANNULLA. Nessuno arriva
          // qui in due secondi e mezzo, quindi il timeout completava la
          // timeline fuori scena; poi la fila attraversava davvero la quota e
          // ScrollTrigger chiamava play() su una timeline già finita — niente
          // accensione, il telefono si riprendeva la fila statica di prima.
          // Scatta solo se il film è ancora fermo E la riga d'ingresso è stata
          // davvero superata: cioè solo quando il trigger ha mancato.
          const safety = window.setTimeout(() => {
            if (tl.progress() > 0) return;
            if (row.getBoundingClientRect().top < (window.innerHeight * startPct) / 100) reveal();
          }, 2500);
          cleanup.push(() => {
            window.clearTimeout(safety);
            stage.removeEventListener("focusin", reveal);
          });
        } else {
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
          cleanup.push(() => stage.removeEventListener("focusin", onFocusIn));
        }

        /* RIFLESSO CONTINUO — l'unica animazione a tempo del capitolo oltre al
           film del telefono. Una banda di luce attraversa le stelle una dopo
           l'altra, poi il metallo respira nella pausa. Sul desktop la mette
           GSAP: se restasse nel CSS, animare xPercent riscriverebbe `transform`
           per intero e la banda si raddrizzerebbe. Sotto lg il riflesso resta
           l'animazione CSS di globals.css, gated [data-lit] come qui.
           REGOLA CHANEL — ciò che il telefono NON paga: il riflesso fuori scena
           si ferma ([data-sr-gate] + [data-lit]), cinque loop di transform che
           altrimenti girerebbero in batteria a venti schermate di distanza.
           [data-sr-gate] dice al CSS «il riflesso ce l'ha in mano JS»: senza JS
           quella regola non si applica e il fallback resta quello di prima. */
        let shimmer: gsap.core.Tween | null = null;
        let breath: gsap.core.Tween | null = null;
        if (cond.lg) {
          gsap.set(sweeps, { rotate: 16 });
          shimmer = gsap.fromTo(
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
          // scritta dal film, e due tween sulla stessa proprietà si
          // strapperebbero il valore a vicenda.
          breath = gsap.to(halos, {
            scale: 1.07,
            duration: 2.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            stagger: { each: 0.18 },
            paused: true,
          });
        } else {
          section.setAttribute("data-sr-gate", "");
        }
        // Fuori scena: pausa e via il will-change (5 layer promossi a vuoto per
        // tutta la pagina sono memoria video sprecata).
        const lit = ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            if (self.isActive) {
              section.setAttribute("data-lit", "");
              shimmer?.play();
              breath?.play();
            } else {
              section.removeAttribute("data-lit");
              shimmer?.pause();
              breath?.pause();
            }
          },
        });

        // Widget: rivelato con la stessa lingua (stella → aperto), una volta.
        // Resta solo sul desktop: sotto lg il blocco è un iframe di terza parte
        // dietro il cancello del consenso, e ritagliarlo a stella significa
        // clip-path per frame su un contenuto che non controlliamo.
        let wst: ScrollTrigger | null = null;
        const widget = widgetRef.current;
        if (cond.lg && widget) {
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
          cleanup.forEach((fn) => fn());
          section.removeAttribute("data-on");
          section.removeAttribute("data-sr-mob");
          section.removeAttribute("data-sr-gate");
          section.removeAttribute("data-lit");
          section.style.removeProperty("--sr-box-top");
          section.style.removeProperty("--sr-box-h");
          // La clip-path la scrive `applyClip` sullo stile inline, fuori dal
          // contesto di GSAP: il revert di matchMedia non la conosce e
          // attraversando la soglia dei 1024 px resterebbe l'ultima stella
          // ritagliata addosso al layer.
          intro.style.removeProperty("clip-path");
          tl.scrollTrigger?.kill();
          tl.kill();
          shimmer?.kill();
          breath?.kill();
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
          Sotto lg ([data-sr-mob]) gli stessi atti suonano dentro un box
          ancorato alla fila, a tempo invece che in scrub. Senza JS e con
          reduced-motion nessuno dei due attributi compare: flusso normale,
          statico, il layer intro resta display:none. */}
      <div ref={runwayRef} className="dt-starrev_runway">
        <div ref={screenRef} className="dt-starrev_screen relative">
          {/* Intro full-bleed (decorativa: la tessera vera sta sotto, identica) */}
          <div ref={introRef} aria-hidden className="dt-starrev_intro pointer-events-none absolute inset-0 hidden overflow-hidden">
            {/* ALLEGGERIMENTO (d) — la foto del film sul telefono è la stessa,
                a definizione più bassa: è il modello di Lusion (`_ld`, `_low`,
                `mobile.mp4`) e la legge 2 dell'onda («il costo si paga con gli
                asset, mai con gli atti»). Fino al 2026-08-18 questo layer era
                display:none sotto lg, quindi la fotografia non si scaricava
                affatto: ora che il film suona anche sul telefono, `55vw`
                dichiarato sotto la soglia fa scegliere al browser la variante
                da 640 px invece di quella da 1 200 (a dpr 3 sono ~150 KB in
                meno) — e sotto una clip a stella che si muove la differenza
                non si vede. La soglia è il gemello decimale di MQ.lg
                (1023.98): stessa riga di confine, scritta nella sola lingua
                che `sizes` capisce. */}
            <Image
              src={INTRO_IMG}
              alt=""
              fill
              sizes="(max-width: 1023.98px) 55vw, 100vw"
              className="photo-warm object-cover"
            />
            {/* IL LAMPO, e perché è un velo e non un filtro: a cavallo del
                fullscreen la foto riceve un colpo di luce. Fino al 2026-08-18
                era `filter: brightness() saturate()` tweenato due volte, cioè
                pixel ricalcolati per frame su un'immagine a tutto schermo — il
                primo anti-pattern dell'onda «parità mobile 2». Ora è questo
                velo: sopra la fotografia, sotto il velo di vino (esattamente
                dov'era il filtro), animato in sola opacity. Sta nel DOM a ogni
                larghezza perché il miglioramento è di tutte. */}
            <div className="dt-starrev_flash absolute inset-0" />
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
          {/* IL NOME ACCESSIBILE NASCE DAL TESTO VISIBILE (parità mobile,
              Fase 4, 2026-08-11). Lighthouse dava qui
              `label-content-name-mismatch`: l'etichetta diceva «Top Agency
              2026 SU Wikicasa — …» e quel «su» in mezzo bastava perché le
              parole che si leggono non fossero più contenute nel nome che si
              sente. Non è un cavillo di conformità: chi guida il sito a voce
              pronuncia ciò che vede, e con quel «su» il comando non aggancia
              più il link. Ora la testa dell'etichetta è composta con le
              STESSE due costanti che stanno a schermo, quindi non può più
              divergere quando il copy cambia — e la coda (dove va, e che si
              apre altrove) resta, perché è l'informazione che il testo
              visibile non dà. */}
          <a
            href={site.award.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${site.award.label} ${awardYears} — ${c.awardAriaHint}`}
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
              {/* Lo spazio esplicito qui sotto non è una svista e non si vede:
                  fra due span `block` il browser scarta lo spazio bianco, il
                  disegno non si muove di un pixel. Serve nel DOM, perché il
                  testo visibile lo si ricava concatenando i nodi di testo
                  SENZA separatore: senza questo spazio si leggerebbe «Top
                  Agency 2026Wikicasa» tutto attaccato, e l'etichetta qui sopra
                  — che lo spazio ce l'ha — non lo conterrebbe più. */}
              {/* Sotto il nome del premio vanno gli ANNI, non l'ente: l'ente è già
                  dentro il nome ("Top Agency Wikicasa") e ripeterlo dava «Top Agency
                  Wikicasa / Wikicasa». Gli anni invece sono l'informazione che il badge
                  da solo non dà, ed è quella che conta: uno è un risultato, tre
                  consecutivi sono un andamento. */}
              <span className="block text-sm font-semibold text-ink">{site.award.label}</span>{" "}
              <span className="link-draw block text-[0.8rem] text-stone">{awardYears}</span>
            </span>
          </a>
        </div>
        <p data-sr-el className="mx-auto mt-7 max-w-md text-center text-sm italic leading-snug text-stone">
          {c.claim}
        </p>

          </div>
        </div>
      </div>

      {/* Il widget Trustindex (o la prova reale senza consenso).
          NON è più una sezione con un titolo suo. Si chiamava «Parola per parola» ed era
          la quinta intestazione di recensioni della home: cinque titoli diversi per la
          stessa prova, che così si indebolisce invece di rafforzarsi (§ item 11).
          Adesso è quello che è sempre stato nei fatti — la verifica di terza parte in coda
          al blocco del voto, sotto lo stesso titolo — e il ruolo lo dice una riga di
          servizio, non un'intestazione che promette una sezione nuova. */}
      <div className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8 sm:pb-20">
        {/* `data-reviews-widget` è l'appiglio per i test, e non è zucchero: la suite
            trovava questo blocco cercando il testo del suo titolo, quindi un cambio di
            copy — che è lavoro editoriale normale — faceva fallire un test sul
            CARICAMENTO PIGRO, che col copy non c'entra niente. Un attributo stabile
            separa le due cose: la copy può cambiare, il cancello resta verificabile. */}
        <div ref={widgetRef} data-reviews-widget>
          <p className="eyebrow">{c.widgetTitle}</p>
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
