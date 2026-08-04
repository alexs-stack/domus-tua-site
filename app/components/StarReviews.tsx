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
   nella stella centrale di una fila di cinque; ogni stella è un momento
   (Venditori, Acquirenti, Il team — al centro, con la targa Top Agency —,
   Open Domus, Esperienza) che al click lo avvolge di nuovo a tutto schermo;
   le parole vere restano a Google e al widget Trustindex, rivelato dalla
   stessa lingua di clip. Il capitolo assorbe anche la banda Authority: il
   claim "più recensita" vive qui, sotto il cluster prova.
   FIRST VIEWPORT: il muro delle voci consegna lo sfondo pulito (uscita
   estesa delle card); la foto Top Agency appare PICCOLA, croppata a stella,
   centrata, e lo scroll la ZOOMA a tutto schermo (demo 3 del riferimento,
   flash + titolo-cover a caratteri stirati) per poi richiuderla nella stella
   centrale della fila: 5 stelle, voto 4,9/531, CTA Google + sigillo Wikicasa.
   FORM: codrops/FullscreenClipEffect (demo 1) — morph di clip-path a
   topologia costante (10 vertici), maschere a stella al posto delle pillole;
   pinned dal cliente in chat, con continuum scrubbato richiesto in chat
   (2026-08-04). Il cover-title esce per carattere (scaleY, stagger dal
   centro) e le voci si aprono al click col flash brightness/saturate del
   riferimento; lo scrub è bidirezionale per natura (direttiva replay).

   Verità: le citazioni di lib/reviews.ts sono DEMO → compaiono solo in
   PREVIEW con nota; in produzione le stelle portano didascalie di servizio
   (copy nostro) e la prova verbatim resta Trustindex/Google.
   Progressive enhancement: [data-on] solo desktop ≥1024 + motion ok; senza
   JS / reduced-motion / mobile la sezione è completa e statica.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import TextLines from "./motion/TextLines";
import { Star, Google } from "./Icons";
import { Cta } from "./primitives/Cta";
import TrustindexEmbed from "./TrustindexEmbed";
import { site } from "../lib/site";
import { reviews } from "../lib/reviews";
import { useConsent } from "../lib/consent";
import { useLocale } from "./i18n/LocaleProvider";
import { getLenis } from "./motion/SmoothScroll";
import { isTransitionCovering } from "./motion/PageTransition";
import { setOverlay } from "../lib/ui/overlays";
import { gsap, ScrollTrigger, useGSAP, MQ, dur } from "../lib/motion/gsap";
import { starClipPath, STAR_INNER_RATIO } from "../lib/star-shape";

type StarKey = "venditori" | "acquirenti" | "openDomus" | "esperienza" | "team";


/* Foto scelte guardandole una a una: niente frame video col play incorporato
   (handshake.jpg) né thumbnail con titoli baked-in al centro della scena.
   open-domus-teresa tiene il suo titolo "video recensione" — è l'artefatto
   autentico — ma la tessera ritaglia in basso sui volti (pos). */
const STARS: { key: StarKey; img: string; pos?: string; tileZoom?: string; demoReviewId: string }[] = [
  { key: "venditori", img: "/images/reali/villa-tramonto.jpg", demoReviewId: "marco-b" },
  { key: "acquirenti", img: "/images/reali/raffaela-keys.jpg", demoReviewId: "giulia-r" },
  { key: "team", img: "/images/reali/premio-team.jpg", demoReviewId: "rita-v" },
  {
    key: "openDomus",
    img: "/images/reali/open-domus-teresa.jpg",
    // Landscape in tile quadrato: object-cover vincola l'altezza, quindi la
    // Y di object-position non pana. Lo zoom con origine bassa ritaglia via
    // il titolo baked-in della thumbnail (che resta, autentico, nel fullscreen).
    tileZoom: "scale-[1.3] origin-bottom group-hover:scale-[1.43]",
    demoReviewId: "famiglia-conti",
  },
  { key: "esperienza", img: "/images/reali/consulenza.jpg", demoReviewId: "stefano-m" },
];
/** La stella in cui si richiude il fullscreen d'ingresso: il team con la targa
    Top Agency — la stessa prova del sigillo Wikicasa accanto alla CTA. */
const CENTER = 2;

const copy = {
  it: {
    eyebrow: "Recensioni",
    coverWord: "Cinque stelle",
    title: "Cinque stelle, una alla volta.",
    subtitle:
      "Non un numero: famiglie accompagnate una alla volta. Apri ogni stella per vedere da vicino i momenti che le persone raccontano su Google.",
    ratingLine: (count: string) => `su 5 · ${count} recensioni Google verificate`,
    cta: "Leggi tutte le recensioni su Google",
    openStar: (label: string) => `Apri la stella ${label}`,
    close: "Chiudi",
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
    demoNote: "Esempio dimostrativo: le recensioni reali di Google/Trustindex verranno collegate al lancio.",
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
      "Not a number: families guided one at a time. Open each star to see up close the moments people describe on Google.",
    ratingLine: (count: string) => `out of 5 · ${count} verified Google reviews`,
    cta: "Read all reviews on Google",
    openStar: (label: string) => `Open the ${label} star`,
    close: "Close",
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
    demoNote: "Demonstrative example: the real Google/Trustindex reviews will be connected at launch.",
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
      "Pas un chiffre : des familles accompagnées une à une. Ouvrez chaque étoile pour voir de près les moments que les gens racontent sur Google.",
    ratingLine: (count: string) => `sur 5 · ${count} avis Google vérifiés`,
    cta: "Lire tous les avis sur Google",
    openStar: (label: string) => `Ouvrir l'étoile ${label}`,
    close: "Fermer",
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
    demoNote: "Exemple de démonstration : les vrais avis Google/Trustindex seront connectés au lancement.",
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
      "Keine Zahl: Familien, einzeln begleitet. Öffnen Sie jeden Stern, um die Momente aus der Nähe zu sehen, von denen die Menschen auf Google erzählen.",
    ratingLine: (count: string) => `von 5 · ${count} verifizierte Google-Bewertungen`,
    cta: "Alle Bewertungen auf Google lesen",
    openStar: (label: string) => `Stern ${label} öffnen`,
    close: "Schließen",
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
    demoNote: "Beispielhafte Darstellung: Die echten Google-/Trustindex-Bewertungen werden zum Launch verbunden.",
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
      "No es un número: familias acompañadas una a una. Abre cada estrella para ver de cerca los momentos que la gente cuenta en Google.",
    ratingLine: (count: string) => `sobre 5 · ${count} reseñas de Google verificadas`,
    cta: "Leer todas las reseñas en Google",
    openStar: (label: string) => `Abrir la estrella ${label}`,
    close: "Cerrar",
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
    demoNote: "Ejemplo demostrativo: las reseñas reales de Google/Trustindex se conectarán en el lanzamiento.",
    awardAria: "Top Agency 2026 en Wikicasa — abrir el perfil de Domus Tua (nueva pestaña)",
    awardLabel: "Top Agency 2026",
    awardSub: "Wikicasa",
    claim: "Entre las agencias inmobiliarias independientes con más reseñas de la provincia de Varese.",
  },
};

/* ─────────────────────────── Overlay "voce" (portal) ─────────────────────── */

function StarVoice({
  index,
  onClose,
  restoreEl,
  locale,
}: {
  index: number;
  onClose: () => void;
  restoreEl: HTMLElement | null;
  locale: keyof typeof copy;
}) {
  const c = copy[locale];
  const star = STARS[index];
  const sc = c.stars[star.key];
  const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_BADGE === "true";
  const demoReview = PREVIEW ? reviews.find((r) => r.id === star.demoReviewId) : undefined;

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  // Contratto overlay del sito (come CaseQuickLook): registro superfici,
  // overflow lock, Lenis stop/start con ownership del sipario, focus sul
  // pannello (tabIndex -1, mai su un nodo che parte nascosto), restore focus.
  useEffect(() => {
    setOverlay("star-voice", true);
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    getLenis()?.stop();
    panelRef.current?.focus();
    return () => {
      setOverlay("star-voice", false);
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      if (!isTransitionCovering()) getLenis()?.start();
      if (restoreEl && document.contains(restoreEl)) restoreEl.focus();
    };
  }, [restoreEl]);

  // Morph di apertura: dalla stella della tessera (coordinate viewport, il
  // layer è fixed) alla stella "aperta" fullscreen. Con reduced-motion si
  // salta direttamente allo stato finale.
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const geoRef = useRef({ cx: 0, cy: 0, r: 0 });
  const applyRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const photo = photoRef.current;
    const content = contentRef.current;
    const root = rootRef.current;
    if (!photo || !content || !root) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Stella sempre regolare: si animano centro e raggio (proxy), la clip
    // viene rigenerata a ogni frame — mai interpolazione fra stringhe.
    const coverR = (Math.hypot(w, h) / 2 / STAR_INNER_RATIO) * 1.08;
    const geo = geoRef.current;
    const applyClip = () => {
      photo.style.clipPath = starClipPath(w, h, geo.cx, geo.cy, geo.r);
    };
    applyRef.current = applyClip;
    const motionOk = window.matchMedia(MQ.motionOk).matches;
    const rect = restoreEl?.getBoundingClientRect();
    // Visibilità del layer SUBITO e fuori timeline: mai dipendere da un tick
    // per mostrare un overlay che ha già bloccato lo scroll.
    gsap.set(root, { autoAlpha: 1 });
    if (!motionOk || !rect || rect.width === 0) {
      geo.cx = w / 2;
      geo.cy = h / 2;
      geo.r = coverR;
      applyClip();
      gsap.set(content, { autoAlpha: 1 });
      return;
    }
    geo.cx = rect.left + rect.width / 2;
    geo.cy = rect.top + rect.height / 2;
    geo.r = rect.width / 2;
    applyClip();
    const img = photo.querySelector("img");
    const vchars = root.querySelectorAll<HTMLElement>(".dt-starrev_vchar");
    const tl = gsap
      .timeline()
      // Easing del riferimento per il morph (centro → schermo, raggio → cover)
      .to(geo, { cx: w / 2, cy: h / 2, r: coverR, duration: 1.2, ease: "power4.inOut", onUpdate: applyClip }, 0)
      .fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.3, ease: "domus" }, 0)
      // Flash del riferimento: brightness/saturate salgono e si posano
      // durante l'espansione; a fine corsa torna il grading photo-warm.
      .to(
        img,
        {
          keyframes: [
            { filter: "brightness(1.5) saturate(1.3)", duration: 0.4, ease: "power2.in" },
            { filter: "brightness(1.01) saturate(1.06)", duration: 0.7, ease: "power2.out" },
          ],
        },
        0.05
      )
      .set(img, { clearProps: "filter" }, 1.2)
      // Il titolo entra per carattere (scaleY, stagger dal centro — rif. cover)
      .fromTo(
        vchars,
        { scaleY: 0, transformOrigin: "50% 100%" },
        { scaleY: 1, duration: 0.8, ease: "power4.out", stagger: { each: 0.03, from: "center" } },
        0.45
      )
      .fromTo(content, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: dur.short, ease: "domus" }, 0.6);
    tlRef.current = tl;
    // Failsafe: se il ticker non avanza (tab congelata, tween uccisa), snap
    // allo stato finale — il contenuto non resta mai nascosto.
    const safety = window.setTimeout(() => {
      if (tl.progress() === 0) tl.progress(1);
    }, 1000);
    return () => {
      window.clearTimeout(safety);
      tl.kill();
    };
    // restoreEl è stabile per la vita dell'overlay
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const photo = photoRef.current;
    const content = contentRef.current;
    const rect = restoreEl?.getBoundingClientRect();
    const motionOk = window.matchMedia(MQ.motionOk).matches;
    if (!motionOk || !photo || !content || !rect || rect.width === 0) {
      onClose();
      return;
    }
    // La chiusura non può dipendere SOLO dall'onComplete: se la timeline viene
    // uccisa o il ticker si ferma, la pagina resterebbe bloccata sull'overlay.
    const fallback = window.setTimeout(onClose, 1300);
    const vchars = rootRef.current?.querySelectorAll<HTMLElement>(".dt-starrev_vchar") ?? [];
    const geo = geoRef.current;
    const applyClip = applyRef.current;
    gsap
      .timeline({
        onComplete: () => {
          window.clearTimeout(fallback);
          onClose();
        },
      })
      .to(vchars, { scaleY: 0, duration: 0.3, ease: "power4.in", stagger: { each: 0.012, from: "center" } }, 0)
      .to(content, { autoAlpha: 0, y: 16, duration: 0.35, ease: "domus" }, 0)
      .to(
        geo,
        {
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          r: rect.width / 2,
          duration: 0.9,
          ease: "power4.inOut",
          onUpdate: () => applyClip?.(),
        },
        0
      )
      .to(rootRef.current, { autoAlpha: 0, duration: 0.25 }, ">-0.15");
  }, [onClose, restoreEl]);

  // Esc + trappola focus minima (ciclo tra i focusabili del pannello)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = rootRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  // Portal su body: il footer-uncover dà a <main> uno stacking context che
  // intrappolerebbe il fixed sotto il banner cookie (trappola nota).
  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[70]" role="presentation" style={{ opacity: 0 }}>
      {/* Backdrop pieno (niente blur full-viewport sotto un morph) */}
      <button
        type="button"
        aria-label={c.close}
        onClick={requestClose}
        className="absolute inset-0 h-full w-full cursor-default bg-espresso/85"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={sc.label}
        tabIndex={-1}
        className="absolute inset-0 outline-none"
      >
        {/* La foto, ritagliata dalla stella che si apre */}
        <div ref={photoRef} className="absolute inset-0 overflow-hidden" style={{ willChange: "clip-path" }}>
          <Image
            src={star.img}
            alt=""
            fill
            sizes="100vw"
            style={star.pos ? { objectPosition: star.pos } : undefined}
            className="photo-warm object-cover"
          />
          {/* Scrim per leggibilità del testo sopra la foto */}
          <div className="absolute inset-0 bg-gradient-to-t from-wine/85 via-wine/25 to-transparent" />
        </div>

        {/* Titolo gigante centrato (rif. cover del demo): entra per carattere */}
        <h3 className="dt-starrev_voicetitle pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center font-display font-medium leading-none text-cream">
          <span className="sr-only">{sc.label}</span>
          <span aria-hidden className="block">
            {sc.label.split("").map((ch, i) => (
              <span key={i} className="dt-starrev_vchar inline-block">
                {ch === " " ? " " : ch}
              </span>
            ))}
          </span>
        </h3>

        {/* Contenuto della voce */}
        <div ref={contentRef} className="absolute inset-x-0 bottom-0 p-6 pb-10 sm:p-12 sm:pb-14">
          <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-4">
            <span className="flex gap-1" aria-hidden>
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-4 w-4 text-red-soft" />
              ))}
            </span>
            <p className="max-w-xl text-[1.02rem] leading-relaxed text-cream/85 sm:text-lg">{sc.caption}</p>
            {demoReview && (
              <figure className="mt-2 max-w-xl border-l border-cream/30 pl-4">
                <blockquote className="text-[0.98rem] italic leading-relaxed text-cream/90">
                  “{demoReview.text}”
                </blockquote>
                <figcaption className="mt-2 text-[0.8rem] text-cream/65">
                  {demoReview.name} · {demoReview.place} — {copy[locale].demoNote}
                </figcaption>
              </figure>
            )}
            <Cta
              href={site.googleReviewsUrl}
              variant="cta-solid"
              size="sm"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3"
            >
              {c.cta}
            </Cta>
          </div>
        </div>

        {/* Chiudi */}
        <button
          type="button"
          onClick={requestClose}
          aria-label={c.close}
          className="absolute right-5 top-5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-cream/40 text-cream transition-colors duration-300 hover:border-cream hover:bg-cream/10 sm:right-8 sm:top-8"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}

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

  const [openStar, setOpenStar] = useState<{ index: number; el: HTMLElement } | null>(null);

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
        const els = gsap.utils.toArray<HTMLElement>(section.querySelectorAll("[data-sr-el]"));
        const chars = gsap.utils.toArray<HTMLElement>(intro.querySelectorAll(".dt-starrev_char"));

        // Stato d'attesa: tessere e contenuto spenti dietro l'intro a tutta
        // pagina. SOLO opacity, mai autoAlpha: tessere e link devono restare
        // nel tab order (visibility:hidden li rimuoverebbe).
        gsap.set(tiles, { opacity: 0, scale: 0.7 });
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
          .to(
            tiles,
            { opacity: 1, scale: 1, duration: 0.12, ease: "power2.out", stagger: { each: 0.015, from: "center" } },
            0.9
          )
          .to(els, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out", stagger: 0.015 }, 0.94)
          .to(intro, { autoAlpha: 0, duration: 0.08 }, 1.02)
          // Coda di respiro prima dello sgancio dello sticky
          .to({}, { duration: 0.2 }, 1.1);

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
          stage.removeEventListener("focusin", onFocusIn);
          tl.scrollTrigger?.kill();
          tl.kill();
          wst?.kill();
        };
      });
    },
    { scope: sectionRef }
  );

  const open = useCallback((i: number, el: HTMLElement) => setOpenStar({ index: i, el }), []);
  const close = useCallback(() => setOpenStar(null), []);

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
            <Image
              src={STARS[CENTER].img}
              alt=""
              fill
              sizes="100vw"
              style={STARS[CENTER].pos ? { objectPosition: STARS[CENTER].pos } : undefined}
              className="photo-warm object-cover"
            />
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
              className="mx-auto mt-5 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl lg:text-6xl"
            >
              {c.title}
            </TextLines>
          </div>
          <p data-sr-el className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-stone">
            <span className="flex items-center gap-2">
              <span className="tnum font-display text-2xl font-medium text-ink">{site.rating.replace(".", ",")}</span>
              <span className="flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-3.5 w-3.5 text-red" />
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
          {STARS.map((s, i) => {
            const sc = c.stars[s.key];
            return (
              <li key={s.key} className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  data-sr-tile
                  onClick={(e) => open(i, e.currentTarget)}
                  aria-label={c.openStar(sc.label)}
                  aria-haspopup="dialog"
                  className="dt-starrev_tile group relative block aspect-square w-full cursor-pointer"
                >
                  {/* La clip sta su uno span interno: il focus ring del bottone
                      resta visibile (la clip-path taglierebbe anche l'outline) */}
                  <span className="dt-starrev_tileclip absolute inset-0 block">
                    <Image
                      src={s.img}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 20vw, 210px"
                      style={s.pos ? { objectPosition: s.pos } : undefined}
                      className={`photo-warm object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,0.9,0.36,1)] ${
                        s.tileZoom ?? "group-hover:scale-110"
                      }`}
                    />
                  </span>
                </button>
                <span data-sr-el className="block text-center text-[0.6rem] font-semibold leading-tight text-graphite sm:text-[0.8rem]">
                  {sc.label}
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
              (docs/client-assets-needed.md) il sigillo diventa il fronte di un
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

      {openStar !== null && (
        <StarVoice index={openStar.index} onClose={close} restoreEl={openStar.el} locale={locale} />
      )}
    </section>
  );
}
