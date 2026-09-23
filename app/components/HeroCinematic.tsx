"use client";

// HeroCinematic — l'HERO ALTO della home (A49 e A71 di Alberto, 22 settembre 2026).
//
// Chi l'ha chiesto. A49, con lo screenshot dell'hero: «ma sopratutto la hero e il preloader, stesso
// discorso di prima ma qua ancora peggio. non c'è né l'immagine alta che fa da sfondo pagina a schermo
// intero, né l'effetto dello scroll dentro l'immagine perché l'hai tagliata a metà e bloccato lo scroll
// della pagina per l'effetto zoom»; A71, la sera: «sì, fallo, anche il voto e i due link. prova a vedere
// se riesci a fare un upscale se ho crediti, sennò fa niente, e falla no-bg così è più bella».
//
// Com'è fatto oggi (i numeri in app/lib/motion/hero.ts e hero.json; il CSS nel blocco «L'HERO ALTO
// DELLA HOME» di globals.css, che riusa le classi della testa di era, PageHeroTesta.tsx):
// - la foto è la piscina di Raffaela estesa a 2:3 con Higgsfield e col cielo trasparente
//   (`hero-raffaela-piscina-alta-cielo.webp`, 2560×3812; sul telefono la striscia 9:16 centrata,
//   scripts/media/hero-piscina.mjs), IN FLUSSO come le teste (A45): larga tutto, alta quanto è resa,
//   nessun corridoio, nessun tuffo, nessuno zoom, nessun lift. Le scritte stanno DENTRO lo strato della
//   foto e salgono con lei, come se fossero nella foto; il cielo è la carta (A46);
// - a riposo lo strato sale sotto la testata finché il primo schermo (la banda `--dt-band-h`, dove
//   l'arco del preloader si apre: il patto della porta, intro-clocks.test) non finisce dove comincia il
//   blocco (D-A49-1, hero.ts `salitaRiposo`): il primo schermo è cielo-carta e villa, Raffaela e le
//   scritte arrivano col primo scroll; sul telefono la foto resta al suo posto e sta tutta nel primo
//   schermo;
// - da lg il blocco (sovratitolo, H1, CTA «Richiedi la valutazione», «Vendi casa» e «Cerco casa», il
//   voto) posa SULLA foto in bianco senza ombra (A70), grande, nella banda scura misurata: il portico a
//   destra di Raffaela (D-A49-2), in un terzo di riga a destra, così nessuna lettera la copre (A27) e la
//   sua mano tesa lo presenta; il lockup «Domus Tua» (font del logo, grafite e rosso, 10,5vw da lg, A55)
//   e la firma stanno sull'acqua in basso a destra, e sotto resta la coda libera in cui la foto si
//   ritira nella cornice della cartolina (ChiusuraFoto, A53: la firma del capitolo in chapters.ts);
// - sotto lg il lockup e la firma posano sull'acqua, centrati, e il blocco segue la foto sulla carta,
//   in inchiostro, centrato come prima (le sezioni sono atomiche: o tutte sulla foto o tutte sulla
//   carta, A48);
// - il rito d'ingresso delle lettere resta (ruoli `title` sul lockup e sull'H1, `accent` sulla firma:
//   A20/A22; `data-hero-char/tchar/schar`): ogni gruppo entra all'handoff del preloader se è in scena,
//   altrimenti la prima volta che entra nel viewport (D-A49-5: da lg a riposo il lockup sta sull'acqua,
//   sotto la piega, e un flip fuori campo non lo vede nessuno);
// - il <video> del drone resta montato dopo il primo paint, se e quando la cliente lo riaccende
//   (media.ts, `enabled: false`, C21).
// Nessun velo sopra la foto (la cliente, 10 set.). Con reduced-motion e senza JS la pagina è questa,
// ferma e completa.
import { useEffect, useRef, useState } from "react";
import { getImageProps } from "next/image";
import { Star } from "./Icons";
import { Cta } from "./primitives/Cta";
import { site, ratingLabel } from "../lib/site";
import { heroCinematic } from "../lib/media";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, durDt, painted, requestRefresh } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { ROLES, staggerEach, groupDelay, type RoleSpec } from "../lib/motion/text-roles";
import { afterCurtain, foldNetFired } from "../lib/motion/fold";
import { chapters, scrubOf } from "../lib/motion/chapters";
import { CHIUSURA, SIZES_HERO } from "../lib/motion/hero";
import foto from "../lib/motion/hero.json";
import SplitChars from "./motion/SplitChars";
import ChiusuraFoto from "./motion/ChiusuraFoto";

// ─────────────────────────────────────────────────────────────────────────────
// L'H1 È UNA PROMESSA, NON IL MARCHIO.
//
// Fino al 15 agosto 2026 l'H1 tecnico di questa pagina era il lockup «Domus Tua»: la
// pagina più importante del sito non diceva né cosa fa l'agenzia né dove. Il marchio
// resta protagonista a schermo (è il ponte visivo con il preloader) ma non è più
// l'intestazione: il lockup è tipografia di marca, e il nome vive già nel logo di
// testata, nel <title> e nei dati strutturati.
//
// `title1`/`title2` compongono una frase sola, spezzata sul divisore: la seconda metà
// è la parte che porta l'argomento. Tre cose la reggono, e vanno tenute insieme se un
// giorno la si riscrive:
//   • è all'imperativo — parla a una persona, non descrive un'attività;
//   • contiene «a Tradate» — è la chiave con cui le persone cercano davvero, e nessuna
//     versione precedente ce l'aveva;
//   • «al prezzo giusto» attacca la paura numero uno di chi vende (svendere), non la
//     quarta (lo stress); «nei tempi giusti» non promette né lentezza né velocità, ed è
//     coerente con la FAQ che si rifiuta di promettere tempi di vendita.
// È asimmetrica di proposito: parla al proprietario. Chi compra ha la CTA secondaria.
//
// 2026-09-10 (chiamata cliente): via `subcopy` e `founder` (la riga «RR Con
// Raffaela Rizza e il team») e via il bottone del video, sostituito da «Vendi
// casa» → /vendi. `place`/`awardChip`/`noCost` non si mostrano più qui (le
// chip in piccolo sono state tolte); il sigillo Wikicasa torna in Voci (spec
// §4.1), le chiavi restano finché quel capitolo non le riprende.
// ─────────────────────────────────────────────────────────────────────────────
const copy = {
  it: {
    badge: "Agenzia immobiliare a Tradate · dal 2007",
    title1: "Vendi casa a Tradate",
    title2: "al prezzo giusto, nei tempi giusti.",
    ctaValuta: "Richiedi la valutazione",
    ctaCerco: "Cerco casa",
    ctaVendi: "Vendi casa",
    reviews: `${site.reviewsCount} recensioni Google`,
    place: "A Tradate dal 2007",
    awardChip: "3 anni consecutivi fra le migliori 400 agenzie d'Italia — Wikicasa Top Agency",
    noCost: "Nessun costo anticipato",
    heroAlt: "Raffaela Rizza davanti alla villa con piscina proposta da Domus Tua",
  },
  en: {
    badge: "Estate agency in Tradate · since 2007",
    title1: "Sell your home in Tradate",
    title2: "at the right price, in the right time.",
    ctaValuta: "Request a valuation",
    ctaCerco: "I’m looking for a home",
    ctaVendi: "Sell your home",
    reviews: `${site.reviewsCount} Google reviews`,
    place: "In Tradate since 2007",
    awardChip: "Three years running among Italy's top 400 agencies — Wikicasa Top Agency",
    noCost: "No upfront costs",
    heroAlt: "Raffaela Rizza in front of a villa with a pool offered by Domus Tua",
  },
  fr: {
    badge: "Agence immobilière à Tradate · depuis 2007",
    title1: "Vendez votre bien à Tradate",
    title2: "au juste prix, dans les bons délais.",
    ctaValuta: "Demander l’estimation",
    ctaCerco: "Je cherche un bien",
    ctaVendi: "Vendre",
    reviews: `${site.reviewsCount} avis Google`,
    place: "À Tradate depuis 2007",
    awardChip: "Trois années consécutives parmi les 400 meilleures agences d'Italie — Wikicasa Top Agency",
    noCost: "Aucun frais d'avance",
    heroAlt: "Raffaela Rizza devant une villa avec piscine proposée par Domus Tua",
  },
  de: {
    badge: "Immobilienagentur in Tradate · seit 2007",
    title1: "Verkaufen Sie Ihr Haus in Tradate",
    title2: "zum richtigen Preis, in der richtigen Zeit.",
    ctaValuta: "Bewertung anfordern",
    ctaCerco: "Ich suche ein Zuhause",
    ctaVendi: "Verkaufen",
    reviews: `${site.reviewsCount} Google-Bewertungen`,
    place: "In Tradate seit 2007",
    awardChip: "Drei Jahre in Folge unter Italiens besten 400 Agenturen — Wikicasa Top Agency",
    noCost: "Keine Kosten im Voraus",
    heroAlt: "Raffaela Rizza vor einer Villa mit Pool im Angebot von Domus Tua",
  },
  es: {
    badge: "Agencia inmobiliaria en Tradate · desde 2007",
    title1: "Vende tu casa en Tradate",
    title2: "al precio justo, en el tiempo justo.",
    ctaValuta: "Solicita la valoración",
    ctaCerco: "Busco casa",
    ctaVendi: "Vender casa",
    reviews: `${site.reviewsCount} reseñas de Google`,
    place: "En Tradate desde 2007",
    awardChip: "Tres años consecutivos entre las 400 mejores agencias de Italia — Wikicasa Top Agency",
    noCost: "Sin costes por adelantado",
    heroAlt: "Raffaela Rizza delante de una villa con piscina ofrecida por Domus Tua",
  },
};

/** Un gruppo di lettere del rito d'ingresso: le sue lettere, il ruolo, il ritardo nel gruppo, l'elemento che dice se è in scena. */
type Gruppo = { nome: "lockup" | "h1" | "firma"; chars: HTMLElement[]; role: RoleSpec["enter"]; at: number; host: HTMLElement };

export default function HeroCinematic() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [playVideo, setPlayVideo] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  // I gruppi di lettere già entrati in questo montaggio (spec §2.3), con inizio e fine del loro
  // ingresso sull'orologio di `gsap.globalTimeline`: un cambio lingua dopo non li rifà.
  const suonati = useRef(new Map<Gruppo["nome"], { inizio: number; fine: number }>());

  // Ingresso delle lettere coi ruoli del testo di Era: `title` su lockup e H1,
  // `accent` sulla firma (A20 e A22 di Alberto, 13 settembre 2026; spec
  // coreografia §2.2 e §2.5). Lettere piatte, senza prospettiva (A22). Ritardi
  // dall'ordine nel gruppo: lockup 0,3 s, H1 0,4 s, firma 0,3 s. Col sipario
  // partono all'handoff (afterCurtain di fold.ts, subito se l'handoff è già
  // partito), senza sipario 150 ms dopo l'armamento. D-A49-5: ogni gruppo suona
  // all'handoff solo se il suo elemento è in scena; altrimenti aspetta la prima
  // entrata nel viewport (IntersectionObserver), perché da lg a riposo il lockup
  // e l'H1 stanno nella foto sotto la piega e un flip fuori campo non lo vede
  // nessuno. Stato dipinto a 0,02 e rete CSS `dt-rest-failsafe` restano quelli
  // di globals.css su `data-hero-char/tchar/schar` (la rete si spegne
  // all'armamento: un gruppo armato aspetta l'entrata, non l'orologio); lockup,
  // firma e H1 non portano `data-reveal`, quindi il motore dei gruppi non li
  // tocca. Cambio lingua (spec §2.3): LocaleProvider passa alla lingua del
  // cookie in un effetto passivo, dopo questo layout effect, e SplitChars riusa
  // gli span per indice (il lockup «Domus Tua» è uguale in ogni lingua: stessi
  // nodi) e ne aggiunge per le lettere in più. Con `dependencies: [locale]` e
  // `revertOnUpdate` l'effetto si rifà sugli span di oggi: un gruppo già entrato
  // non rifà l'ingresso, si accende se l'ingresso era finito e riprende dallo
  // stesso istante se era a metà; uno non ancora entrato si riarma e aspetta; a
  // rete CSS già scattata si accendono solo gli span nati dopo, e gli altri
  // finiscono la loro animazione CSS.
  //
  // La timeline dell'ingresso nasce in un callback (il timer dei 150 ms,
  // l'handoff, l'IntersectionObserver), cioè dopo che il Context di useGSAP ha
  // finito di registrare: passa dal `contextSafe` del ramo di matchMedia, così
  // `revertOnUpdate` la reverte col resto. Senza, la timeline del passaggio in
  // italiano sopravviveva al cambio lingua sugli span riusati del lockup:
  // il passaggio in tedesco li accendeva a 1 e le ultime lettere dello stagger
  // ripartivano poi dal loro `from`, opacità 0 (il lampo di hero-alto.spec,
  // «tedesco», sulla CI della PR #81). È il `contextSafe` del ramo e non quello
  // di useGSAP: quello esterno, chiamato dentro il ramo (l'handoff già partito
  // fa suonare subito), metterebbe i due Context uno nei dati dell'altro (D120,
  // ricerca-idempotenza.test.ts).
  useGSAP(
    () => {
      const section = sectionRef.current;
      const html = document.documentElement;
      if (!section) return;
      if (!html.hasAttribute("data-preloader") && !html.hasAttribute("data-hero-intro")) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, (_ramo, contextSafe) => {
        if (!contextSafe) return;
        const chars = (sel: string) => gsap.utils.toArray<HTMLElement>(sel, section);
        const host = (sel: string) => section.querySelector<HTMLElement>(sel);
        const candidati: Array<Omit<Gruppo, "host"> & { host: HTMLElement | null }> = [
          { nome: "lockup", chars: chars("[data-hero-char]"), role: ROLES.title.enter, at: groupDelay("title", 0), host: host("[data-hero-lockup]") },
          { nome: "h1", chars: chars("[data-hero-tchar]"), role: ROLES.title.enter, at: groupDelay("title", 1), host: host("h1") },
          { nome: "firma", chars: chars("[data-hero-schar]"), role: ROLES.accent.enter, at: groupDelay("accent", 0), host: host("[data-hero-script]") },
        ];
        const gruppi = candidati.filter((g): g is Gruppo => g.chars.length > 0 && g.host !== null);
        if (gruppi.length === 0) return;
        const accendi = (els: HTMLElement[]) => {
          els.forEach((el) => {
            el.style.animation = "none";
          });
          gsap.set(els, { opacity: 1 });
        };
        // L'ingresso di un gruppo, `dal` secondi dopo il suo inizio (0 la prima volta). Nel Context
        // del ramo anche quando parte da un callback: vedi il commento sopra useGSAP.
        const ingresso = contextSafe((g: Gruppo, dal: number) => {
          const r = g.role;
          gsap.set(g.chars, { willChange: "transform" });
          // Origine dei ruoli (spec §2.2): `accent` gira dalla linea di base, 50 % 100 %; `title` resta al centro.
          if (r.origin) gsap.set(g.chars, { transformOrigin: r.origin });
          const tl = gsap
            .timeline({ onComplete: () => gsap.set(g.chars, { clearProps: "willChange" }) })
            .fromTo(
              g.chars,
              { ...r.from },
              {
                ...r.to,
                duration: r.duration,
                ease: r.ease,
                stagger: staggerEach(r.stagger, g.chars.length, durDt.l),
                overwrite: true,
              },
              g.at,
            );
          if (dal > 0) tl.time(dal);
          suonati.current.set(g.nome, { inizio: tl.startTime(), fine: tl.endTime() });
        }) as (g: Gruppo, dal: number) => void;

        // I gruppi già entrati (cambio lingua): a ingresso finito si accendono e basta; a metà
        // riprendono dall'istante in cui erano, sugli span di oggi, senza ripartire da capo.
        const ora = gsap.globalTimeline.time();
        for (const g of gruppi) {
          const s = suonati.current.get(g.nome);
          if (!s) continue;
          if (ora >= s.fine) {
            accendi(g.chars);
            continue;
          }
          g.chars.forEach((el) => {
            el.style.animation = "none";
          });
          ingresso(g, ora - s.inizio);
        }
        const daSuonare = gruppi.filter((g) => !suonati.current.has(g.nome));
        if (daSuonare.length === 0) return;
        // Rete CSS già scattata (JS arrivato tardi): nessun ingresso. Si accendono solo gli span
        // la cui animazione CSS non è ancora partita, cioè quelli nati col cambio lingua.
        const arma = daSuonare.flatMap((g) => g.chars);
        if (foldNetFired(arma[0], "dt-rest-failsafe")) {
          accendi(arma.filter((el) => !foldNetFired(el, "dt-rest-failsafe")));
          return;
        }
        arma.forEach((el) => {
          el.style.animation = "none";
        });
        gsap.set(arma, { opacity: painted });

        const osservatori: IntersectionObserver[] = [];
        const suona = (g: Gruppo) => {
          if (!suonati.current.has(g.nome)) ingresso(g, 0);
        };
        const inScena = (el: HTMLElement) => {
          const b = el.getBoundingClientRect();
          return b.bottom > 0 && b.top < window.innerHeight;
        };
        const play = () => {
          for (const g of daSuonare) {
            if (inScena(g.host) || typeof IntersectionObserver === "undefined") {
              suona(g);
              continue;
            }
            const io = new IntersectionObserver(
              (voci) => {
                if (!voci.some((v) => v.isIntersecting)) return;
                io.disconnect();
                suona(g);
              },
              { threshold: 0 },
            );
            io.observe(g.host);
            osservatori.push(io);
          }
        };

        let annulla: () => void;
        if (html.hasAttribute("data-preloader")) {
          annulla = afterCurtain(play);
        } else {
          const t = window.setTimeout(play, 150);
          annulla = () => window.clearTimeout(t);
        }
        return () => {
          annulla();
          osservatori.forEach((o) => o.disconnect());
        };
      });
    },
    { scope: sectionRef, dependencies: [locale], revertOnUpdate: true },
  );

  // La fine dell'ENTRATA (A75). La salita è CSS (`dt-hero-sale` sullo strato, globals.css) e parte da
  // sola sull'orologio del preloader; qui si toglie `data-hero-entrata` quando è finita, così il lockup
  // d'entrata sparisce dal layout (display none) e una navigazione a caldo verso la home non la
  // ripete, e si chiede un refresh a ScrollTrigger: le misure prese durante la salita (la cartolina di
  // ChiusuraFoto, i nastri sotto) contavano la foto spostata. Se l'animazione non c'è più (JS arrivato
  // tardi) o viene annullata (reduced-motion a pagina aperta) si toglie subito. Allo smontaggio vero
  // (lo strato fuori dal DOM) si toglie anche a metà; il doppio montaggio di StrictMode lascia il nodo
  // al suo posto e non la ferma.
  useEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute("data-hero-entrata")) return;
    const strato = sectionRef.current?.querySelector<HTMLElement>("[data-testa-strato]") ?? null;
    let vivo = true;
    const fine = () => {
      if (!vivo) return;
      html.removeAttribute("data-hero-entrata");
      requestRefresh();
    };
    const salita = strato?.getAnimations().find((a) => (a as CSSAnimation).animationName === "dt-hero-sale");
    if (salita) salita.finished.then(fine, fine);
    else fine();
    return () => {
      vivo = false;
      if (strato && !strato.isConnected) html.removeAttribute("data-hero-entrata");
    };
  }, []);

  // Il video parte solo su desktop e se l'utente non ha ridotto le animazioni,
  // e solo se i file sono attivati. Oggi `heroCinematic.enabled=false`
  // (media.ts, scelta cliente 2026-08-03): il gate non decide nulla.
  //
  // Sotto 768 niente video. I file sono il loop del drone di app/lib/media.ts
  // (1080 e 720, MP4 e WebM). Se la cliente riaccende il video (C21 lo tiene
  // spento): gate `MQ.motionOk` a ogni larghezza; `<source media="(max-width:
  // 767.98px)">` col 720 PRIMA del 1080; `preload="none"`; mai con
  // `navigator.connection.saveData`. Prova: `perf:report` a 390 senza
  // richieste `.mp4`.
  //
  // Il <video> viene montato SOLO dopo il primo paint del poster (LCP), così la
  // selezione della sorgente non entra nel percorso critico dell'immagine LCP.
  // Il verdetto sta dentro gsap.matchMedia e non in due `.matches` letti a
  // mano: così un tablet ruotato lo ri-valuta invece di restare col responso
  // del primo render.
  useEffect(() => {
    if (!heroCinematic.enabled) return;
    const mm = gsap.matchMedia();
    mm.add(`${MQ.motionOk} and ${MQ.desktop}`, () => {
      // Rimanda il mount del video oltre il paint LCP.
      let raf = 0;
      let idleId = 0;
      // Feature-detect via "in": i tipi DOM danno requestIdleCallback come sempre presente,
      // ma alcuni browser (Safari datati) non ce l'hanno, quindi serve il fallback setTimeout.
      const hasIdle = "requestIdleCallback" in window;
      if (hasIdle) {
        idleId = window.requestIdleCallback(() => setPlayVideo(true), { timeout: 2500 });
      } else {
        raf = window.setTimeout(() => setPlayVideo(true), 1200);
      }

      return () => {
        if (hasIdle) window.cancelIdleCallback(idleId);
        else window.clearTimeout(raf);
        // Il <video> è montato da uno state React, che il revert di GSAP non sa
        // disfare: se non lo rimettiamo giù a mano, chi restringe la finestra
        // sotto i 768 si tiene il video acceso. Il poster torna a fare da hero.
        setPlayVideo(false);
      };
    });
    return () => mm.revert();
  }, []);

  // La regola del separatore decimale vive in site.ts (`ratingLabel`): stava qui, e
  // intanto /recensioni scriveva "4.9/5" in italiano. Una regola sola, un posto solo.
  const ratingDisplay = ratingLabel(locale);

  // I due file dell'hero (A49): il WebP col cielo trasparente 2:3 da 768, la striscia 9:16 sotto;
  // stesso alt, stessi `sizes` (100vw: la scatola ha il rapporto della foto, il cover non ritaglia),
  // stessa qualità (75, la voce di next.config `qualities` fra i 60 delle teste e i 78 dell'hero di
  // prima: è la foto LCP e la più grande del sito). `fotoImg` porta src/width/height/loading/
  // fetchPriority del ramo telefono; il srcSet lo rimettiamo esplicito per chiarezza. `preload` (non
  // `priority`, deprecata): è l'unica immagine prioritaria del sito.
  const comuni = { alt: c.heroAlt, sizes: SIZES_HERO, quality: 75, preload: true } as const;
  const {
    props: { srcSet: fotoDesktop },
  } = getImageProps({ ...comuni, src: heroCinematic.base, width: heroCinematic.baseSize.w, height: heroCinematic.baseSize.h });
  const {
    props: { srcSet: fotoTelefono, ...fotoImg },
  } = getImageProps({ ...comuni, src: heroCinematic.baseM, width: heroCinematic.baseMSize.w, height: heroCinematic.baseMSize.h });

  return (
    // La testa di era (le classi .dt-testa_* di globals.css e i ganci di ChiusuraFoto: `data-testa`,
    // `data-sopra="foto"`, lo strato, la scatola della foto, lo spazio sopra) più `.dt-hero`, che la
    // tiene sotto la testata e le dà la salita a riposo e le quote di hero.ts.
    <section ref={sectionRef} id="top" data-testa data-sopra="foto" className="dt-testa dt-hero relative isolate bg-cream">
      {/* Il riquadro è la CARTA (A46): in flusso, avorio, `overflow: clip`; sopra il cielo trasparente
          il segno resta grafite (nessun data-bg qui, data-bg.test). */}
      <div className="dt-testa_riquadro">
        {/* L'ENTRATA (A75): il lockup e la firma al centro del primo schermo, sulla carta, DIETRO lo strato
            della foto, che all'handoff è giù fuori campo e poi sale davanti a loro fino a Raffaela. Esiste
            solo sotto `html[data-hero-entrata]` (boot script, sipario sulla home); le lettere, la salita
            e il fondale sono @keyframes di globals.css («L'ENTRATA DELL'HERO»), sull'orologio del
            preloader. Decorativo e senza charAttr: il rito di GSAP e la regola dello 0,02 non lo
            toccano; il nome «Domus Tua» vive nel lockup sull'acqua. */}
        <div className="dt-hero_entrata" aria-hidden>
          <div className="font-brand text-hero font-extrabold tracking-[-0.02em] lg:text-(length:--text-hero-lg)">
            <span data-entrata-riga className="block text-graphite">
              <SplitChars font="brand-800" locale={locale} upper={false} index={0}>
                Domus
              </SplitChars>
            </span>
            <span data-entrata-riga className="block text-red">
              <SplitChars font="brand-800" locale={locale} upper={false} index={5}>
                Tua
              </SplitChars>
            </span>
          </div>
          <span
            data-entrata-firma
            className="script-word relative block !text-[clamp(2.2rem,6vw,5.5rem)]"
            style={{ "--script-tuck": "0" } as React.CSSProperties}
          >
            <SplitChars font="script-400" locale={locale} upper={false} index={0}>
              Raffaela Rizza
            </SplitChars>
          </span>
        </div>
        {/* Lo strato della foto: IN FLUSSO, alto quanto la foto resa (`--dt-hero-ar`), portato su della
            salita a riposo (D-A75-1, CSS) finché Raffaela è intera nel primo schermo. Il <picture> e i
            marcatori stanno nella scatola della foto; lo spazio sopra, con le scritte, la segue nello
            stacking e nel flusso. */}
        <div data-testa-strato className="dt-testa_strato">
          {/* La scatola della foto (A48): assoluta in cima allo strato, da lg lo riempie; il fondo è la
              carta (il cielo è trasparente). `data-hero-media` resta per sonde ed e2e; la foto è la LCP
              della home; NESSUN VELO sopra (la cliente ha bocciato vignettature e nero). La chiusura in
              cartolina (A53) scrive il clip qui, solo dentro la corsa. */}
          <div data-testa-foto-box data-hero-media className="dt-testa_foto">
            {/* Art direction (Next 16, `getImageProps`): la 2:3 da 768, la striscia 9:16 sotto (D-A49-4,
                hero-piscina.mjs). La foto comincia dalla cima (`50% 0%`): la scatola ha il suo rapporto
                e nulla viene ritagliato (A27); la sagoma del preloader tiene il ritaglio suo, perché con
                A55 non coincide più con la foto. */}
            <picture>
              <source media="(min-width: 768px)" srcSet={fotoDesktop} sizes={SIZES_HERO} />
              <img
                {...fotoImg}
                alt={c.heroAlt}
                srcSet={fotoTelefono}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: "50% 0%" }}
              />
            </picture>
            {playVideo && (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: "50% 0%" }}
                poster={heroCinematic.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onError={() => setPlayVideo(false)}
              >
                {heroCinematic.webm && <source src={heroCinematic.webm} type="video/webm" />}
                <source src={heroCinematic.mp4} type="video/mp4" />
              </video>
            )}
            {/* I marcatori del segno (D34, A21): uno per banda `segno` di hero.json — la parete e la
                ringhiera dell'ala sinistra della villa, dove la striscia del segno è opaca e scura —
                con `data-bg="foto"`: lì le tacche virano all'avorio; sul cielo (la carta) e sull'acqua
                chiara restano grafite. Il marcatore da 1 px del corridoio (D66) è morto con A49. */}
            {foto.segno.map(([da = 0, a = 0]) => (
              <span
                key={`${da}-${a}`}
                aria-hidden
                data-testa-soggetto
                data-bg="foto"
                className="dt-testa_soggetto"
                style={{ top: `${(da * 100).toFixed(2)}%`, bottom: `${((1 - a) * 100).toFixed(2)}%` }}
              />
            ))}
          </div>

          {/* Lo spazio sopra la foto (A48/A54): in flusso dentro lo strato, senza fondo. La POSA tiene la
              marca e il blocco: da lg comincia alla cima del portico (`testo`) col blocco in cima a
              destra e la marca sull'acqua in fondo (`coda`); sotto lg comincia sull'acqua (`acqua`) con
              la marca centrata alta quanto l'acqua e il blocco dopo la foto, sulla carta (CSS). */}
          <div className="dt-testa_sopra">
            <div className="dt-row dt-hero_posa">
              {/* LA MARCA: il lockup nel font del logo (`font-brand`, richiesta cliente: «stesso font del
                  logo in tutte le scritte Domus Tua») coi colori del logo, SULL'ACQUA, in basso a destra
                  da lg e centrato sotto (A55: Raffaela sta al centro della foto e nessuna lettera la
                  copre; da lg 10,5vw perché a 13vw la «D» le copriva le gambe). NON è l'h1 (vedi la nota
                  sopra `copy`). Le lettere animate stanno in uno span aria-hidden intorno a SplitChars:
                  il nome leggibile vive nello span sr-only — un aria-label su un <div> senza ruolo
                  verrebbe ignorato dalle AT e segnalato da axe (aria-prohibited-attr). `data-hero-lockup`
                  è l'elemento che il rito guarda per dire se il lockup è in scena. */}
              <div data-hero-lockup className="dt-hero_marca items-center text-center lg:items-end lg:text-right">
                {/* Minuscolo come il logo («DomusTua»): la regola globale mette in
                    maiuscolo solo h1-h4, e questo è un div apposta. */}
                <div className="font-brand text-hero font-extrabold tracking-[-0.02em] lg:text-(length:--text-hero-lg)">
                  <span className="sr-only">Domus Tua</span>
                  {/* Due righe, come il lockup di sempre (posizioni chieste da Alberto, 2026-09-10 sera);
                      il font resta quello del logo. Caratteri di SplitChars con la crenatura di
                      `brand-800` (A20, D20); `upper={false}` perché il lockup è minuscolo. */}
                  <span aria-hidden className="block text-graphite">
                    <SplitChars font="brand-800" locale={locale} upper={false} charAttr="data-hero-char">
                      Domus
                    </SplitChars>
                  </span>
                  <span aria-hidden className="block text-red">
                    <SplitChars font="brand-800" locale={locale} upper={false} charAttr="data-hero-char">
                      Tua
                    </SplitChars>
                  </span>
                </div>

                {/* La firma sotto il lockup, sull'acqua («firma più in basso», la cliente, 10 set.): non
                    scavalca più il bordo della foto, perché da lg quel bordo è la coda in cui la foto si
                    ritira nella cartolina (A53) e una firma a cavallo del ritaglio si taglierebbe.
                    `.script-word` (globals.css) è fuori dai layer e impone `position: relative`; `!text-…`
                    perché vincerebbe sull'utility (regola unlayered-beats-utilities). Le lettere sono di
                    SplitChars, con la crenatura di `script-400` (D20). */}
                <span
                  data-hero-script
                  aria-hidden
                  className="script-word relative block !text-[clamp(2.2rem,6vw,5.5rem)]"
                  style={{ "--script-tuck": "0" } as React.CSSProperties}
                >
                  <SplitChars font="script-400" locale={locale} upper={false} charAttr="data-hero-schar">
                    Raffaela Rizza
                  </SplitChars>
                </span>
              </div>

              {/* IL BLOCCO: sovratitolo, H1, CTA, i due link e il voto. Da lg posa sulla foto in bianco
                  (A70, senza ombra) nel terzo di riga a destra, allineato a sinistra come una colonna
                  accanto a Raffaela; sotto lg sta dopo la foto, sull'avorio, centrato (Alberto, 10 set.:
                  «rimettilo centrale»), in inchiostro. */}
              <div
                data-hero-block
                className="dt-hero_blocco flex flex-col items-center text-center max-lg:pb-[clamp(2.5rem,7vh,4.5rem)] max-lg:pt-[clamp(2.5rem,5vh,4rem)] lg:w-[32vw] lg:items-start lg:self-end lg:text-left"
              >
                {/* Sovratitolo: cosa fa l'agenzia e dove, prima ancora della promessa.
                    16 px, non di meno: la cliente non vuole scritte piccole. */}
                <p className="text-balance text-ui font-semibold uppercase tracking-[0.08em] text-stone">
                  {c.badge}
                </p>
                <h1 className="mt-3 max-w-[28ch] font-display text-d3">
                  <span className="sr-only">{`${c.title1} ${c.title2}`}</span>
                  {/* H1 maiuscolo per la regola globale di h1-h4, a peso 500
                      (globals.css:318-322): crenatura di `display-500` col maiuscolo
                      della lingua (A20, D20). */}
                  <span aria-hidden className="block">
                    <SplitChars font="display-500" locale={locale} upper charAttr="data-hero-tchar">
                      {c.title1}
                    </SplitChars>
                  </span>
                  <span aria-hidden className="block">
                    <SplitChars font="display-500" locale={locale} upper charAttr="data-hero-tchar">
                      {c.title2}
                    </SplitChars>
                  </span>
                </h1>
                <div className="mt-6 flex w-full max-w-[640px] flex-col items-center gap-4 lg:items-start">
                  <Cta href="/valutazione-immobile-tradate" variant="cta-solid" size="lg" arrow={false}>
                    {c.ctaValuta}
                  </Cta>
                  <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 lg:justify-start">
                    <Cta href="/vendi" variant="ghost" arrow={false}>
                      {c.ctaVendi}
                    </Cta>
                    <Cta href="#cerca" variant="ghost" arrow={false}>
                      {c.ctaCerco}
                    </Cta>
                  </div>
                  {/* Voto e conteggio in UN elemento solo, 16 px. Oro solo sulle
                      stelle: l'unica eccezione cromatica già sancita. */}
                  <a href="#recensioni" className="mt-2 flex items-center gap-3 text-ui text-ink">
                    <span className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-gold" />
                      ))}
                    </span>
                    <span className="font-semibold">
                      {ratingDisplay}/5 · {c.reviews}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* A53 sulla home (A49): finita la posa, la coda libera della foto si ritira nella cornice della
              cartolina mentre sale, con la firma del capitolo (chapters.ts `hero`: dtCartolina, scrub
              0,9, il motivo comune d'uscita delle foto alte). */}
          <ChiusuraFoto ease={chapters.hero.signature.ease} scrub={scrubOf("hero")} fondo={CHIUSURA} />
        </div>
      </div>
    </section>
  );
}
