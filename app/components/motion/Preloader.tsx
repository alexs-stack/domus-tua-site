"use client";

// Preloader "Arco Domus" — prima visita della sessione.
// Coreografia rif. era-residence.com (reverse-engineering/era-residence/):
// lockup + progress, poi una PORTA AD ARCO sale dal fondo (maschera CSS a
// 4 layer, vedi globals.css) e ci si "tuffa" dentro l'hero: al tuffo parte
// INTRO_EVENT e HeroCinematic accende le lettere. (Qui c'era scritto che
// l'hero «scala 0.75→1»: quel tween non esiste più, la foto resta a scale 1 —
// è la sagoma del preloader a coincidere con lei pixel su pixel.)
// L'attributo <html data-preloader> è messo da un inline script nel layout
// PRIMA del primo paint (vedi app/layout.tsx): qui si coreografa e si smonta.
// - Una volta per sessione (sessionStorage), skip con tocco/click/tasto.
// - Assente con reduced-motion e senza JS (l'attributo non c'è mai).
// - Non blocca l'LCP: l'hero sotto continua fetch/decode; l'overlay è solo
//   un layer fixed sopra — ed è proprio ciò che l'arco rivela. Cambia però
//   QUALE elemento vince: sulla prima visita mobile il banner cookie non è più
//   il candidato (arriva al handoff, non pre-paint). Da misurare, non da
//   dedurre: docs/mobile-parity.md §7.1 punto 1.
// - Fallback senza mask-composite: sipario a salire (clip-path), stesso ritmo.
//
// LE DURATE VERE (misurate, 2026-08-11 — qui c'era scritto «~5s» e in
// docs/performance.md «~2,2s», e nessuno dei due numeri esisteva):
//   desktop  4,63s con la maschera · 3,50s sul sipario di ripiego
//   telefono 1,75s con la maschera · 1,30s sul sipario di ripiego
//
// E DAL 2026-08-11 L'INTRO SUONA ANCHE SUL TELEFONO. Non è la stessa più
// veloce: è un altro montaggio, perché il conto è al contrario di come
// sembrava. Il telefono scaricava GIÀ questo chunk e la sagoma (79.000 byte) e
// montava GIÀ 119 nodi a display:none per un'intro che non vedeva mai:
// portarla su mobile non aggiunge quel costo, lo mette a frutto. Quel che
// aggiunge è thread principale — ed è lì che si è tagliato:
//   • l'atto I (il lockup) è CSS puro e vive in globals.css: parte quando i
//     nodi entrano nel documento, non quando il ticker di GSAP trova un
//     frame libero, e toglie 21 tween e 21 `will-change`;
//   • l'atto II (la linea di carica) non c'è: 1px su 390 non guadagna nulla e
//     non misurava niente nemmeno prima (non è mai stato un progresso vero);
//   • restano la porta che sale e il tuffo, con la loro ease. Il gesto è
//     intero, sono gli ATTI a essere meno.
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, dur, MQ } from "../../lib/motion/gsap";
import {
  registerWarmup,
  runWarmup,
  scheduleIdleWarmup,
  warmAllImages,
  warmFirstFold,
} from "../../lib/motion/warmup";
import { MarkBadge, spinMarkBadge } from "./RotatingMark";
import { getLenis } from "./SmoothScroll";

export const INTRO_EVENT = "dt:intro:done";
export const INTRO_KEY = "dt-intro-seen";

// Il preloader monta FUORI da LocaleProvider (deve esserci prima di tutto):
// la lingua si legge direttamente dal cookie dt_locale, stesso contratto del
// provider. Solo il payoff è testuale: il lockup di marca è uguale ovunque.
const PAYOFF: Record<string, [string, string]> = {
  it: ["Vendere senza stress.", "Acquistare con sicurezza."],
  en: ["Sell stress-free.", "Buy with confidence."],
  fr: ["Vendre sans stress.", "Acheter en sécurité."],
  de: ["Verkaufen ohne Stress.", "Kaufen mit Sicherheit."],
  es: ["Vender sin estrés.", "Comprar con seguridad."],
};

function payoffFromCookie(): [string, string] {
  const m = typeof document !== "undefined" && document.cookie.match(/dt_locale=([a-z]{2})/);
  return PAYOFF[(m && m[1]) || "it"] ?? PAYOFF.it;
}

/** True se il preloader è attivo in questo istante (per l'handoff dell'hero). */
export function isIntroRunning(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-preloader");
}

// L'evento di handoff parte UNA SOLA VOLTA per documento, da qualunque
// percorso: fine naturale, skip, abort, scheda nascosta, e adesso anche dal
// percorso di recupero (il chunk atterrato dopo che il failsafe ha già tolto
// l'attributo). Chi ascolta — HeroCinematic per le lettere, CookieConsent per
// il banner — non deve mai restare appeso. Sta a livello di modulo e non
// dentro l'effect proprio perché i percorsi sono più d'uno: la bandiera
// dev'essere la stessa per tutti.
let introFired = false;
function fireIntro() {
  if (introFired) return;
  introFired = true;
  window.dispatchEvent(new Event(INTRO_EVENT));
}

/** Il boot script segna qui che il sipario era previsto (vedi layout.tsx). */
type BootFlags = { __dtPreArmed?: number; __dtPreFailsafe?: number };
const boot = () => window as unknown as BootFlags;

// Le ease dell'arco ("dtLoader", "dtDiveIn") vivono nel vocabolario condiviso
// (lib/motion/gsap.ts): le usa anche il sipario ad arco di PageTransition.

// Split per lettere (stessa tecnica del riferimento, resa in SSR): ogni char
// è animabile singolarmente. La riga vive dentro una maschera overflow-hidden
// per il titolo; lo script no (ruota su X e slitta, non deve essere tagliato).
//
// Le lettere restano nel markup a TUTTE le larghezze — è lo stesso HTML, e
// una diramazione per viewport in SSR sarebbe un mismatch di idratazione — ma
// sul telefono sono inerti: nessun tween per lettera, nessun `will-change`
// (globals.css chiude entrambi sotto i 768). A muoversi lì è la RIGA, cioè
// `data-pre-line`, sotto la maschera che questo componente costruisce già.
// `step` serve solo a scaglionarne l'ingresso in CSS.
function PreChars({
  text,
  script = false,
  step = 0,
}: {
  text: string;
  script?: boolean;
  step?: number;
}) {
  const attr = script ? { "data-pre-schar": "" } : { "data-pre-char": "" };
  const chars = text.split("").map((ch, i) =>
    ch === " " ? (
      " "
    ) : (
      <span key={i} {...attr} className="dt-pre-char inline-block">
        {ch}
      </span>
    )
  );
  if (script)
    return (
      <span data-pre-sline className="inline-block">
        {chars}
      </span>
    );
  return (
    <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
      <span data-pre-line={step} className="block">
        {chars}
      </span>
    </span>
  );
}

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* L'overlay SI RENDERIZZA SOLO SE L'INTRO DEVE DAVVERO SUONARE.
     Questo componente arriva da un import dinamico ssr:false, quindi il primo
     render avviene sul client, dopo lo script di boot: qui l'attributo si può
     già leggere. Prima si montava sempre, e su ogni visita di RITORNO (intro
     già vista) restavano 119 nodi a display:none e — soprattutto — la sagoma
     webp da 79.000 byte, che il browser scarica anche dentro un antenato
     display:none. Erano 79 KB di banda a ogni visita per un'immagine che
     nessuno avrebbe visto. La lettura è una sola, alla nascita: se l'attributo
     cade dopo (fine intro, failsafe) il componente non deve ri-renderizzare. */
  const [attivo] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.hasAttribute("data-preloader")
  );

  /* Chi torna sul sito, o chi ha reduced-motion, non vede il sipario: il
     precarico non ha una copertura dietro cui girare e non deve rubare tempo
     al primo rendering. Parte quindi a ruota libera, appena il thread respira.
     `runWarmup` e' idempotente: se l'intro c'e' stata, qui non fa nulla. */
  useEffect(() => {
    if (document.documentElement.hasAttribute("data-preloader")) return;

    /* IL RECUPERO — il difetto §5.3 dell'audit di parità mobile.
       Se il failsafe del boot script è scattato PRIMA che questo chunk
       atterrasse (rete lenta, chunk in ritardo: sul telefono è lo scenario
       più probabile di tutti), l'attributo è già sparito e l'intro non c'è
       più stata. Fin qui si usciva in silenzio, e restava appeso chi aspettava
       l'handoff: HeroCinematic e CookieConsent avrebbero atteso la propria
       rete a 6s per accorgersene. `__dtPreArmed` distingue "sipario mai
       previsto" da "sipario previsto e già ritirato" — a posteriori non c'è
       altro modo di saperlo — e qui l'evento parte subito.
       Le due righe su Lenis sono la cintura: la bretella l'ha SmoothScroll,
       che dal 2026-08-11 osserva la caduta dell'attributo e si rilascia da
       solo (serve anche per il caso in cui questo chunk non arrivi MAI, che
       da qui dentro sarebbe impossibile da coprire). Sono idempotenti da
       entrambi i lati: chiamarle due volte non costa nulla. */
    if (boot().__dtPreArmed) {
      fireIntro();
      gsap.ticker.lagSmoothing(0);
      getLenis()?.start();
    }
    scheduleIdleWarmup();
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      const html = document.documentElement;
      if (!root || !html.hasAttribute("data-preloader")) return;

      // Il taglio del telefono, deciso una volta sola e letto da qui in poi.
      // `MQ.belowDesktop` (767.98) e non 767: alle larghezze frazionarie — zoom
      // del browser, dpr non interi — un buco di un pixel lascerebbe spenti sia
      // questo ramo sia le regole CSS gemelle, che usano la stessa soglia.
      const mobile = window.matchMedia(MQ.belowDesktop).matches;

      // Il vero overlay è montato e dipinto: il primo fotogramma reso dal
      // server (layout.tsx) deve togliersi, o durante il tuffo lo si vedrebbe
      // dentro il buco dell'arco al posto dell'hero. Siamo in un layout
      // effect: l'attributo entra nello stesso paint del markup, nessun lampo.
      html.setAttribute("data-pre-live", "");

      // `completed`: sessionStorage va scritto solo quando l'intro è stata
      // davvero vista/saltata dall'utente — mai negli abort (StrictMode/HMR),
      // altrimenti in dev l'intro non si rivede più.
      // I listener di skip vanno TOLTI qui: il componente resta montato per
      // tutta la sessione e un preventDefault residuo sul keydown romperebbe
      // ogni input di testo del sito dopo l'intro.
      let removeSkipListeners = () => {};
      const finish = (completed: boolean) => {
        if (completed) {
          try {
            sessionStorage.setItem(INTRO_KEY, "1");
          } catch {
            /* storage pieno/bloccato: pazienza, si rivedrà */
          }
        }
        removeSkipListeners();
        html.removeAttribute("data-preloader");
        html.removeAttribute("data-pre-live");
        // Ripristina il contratto Lenis↔ScrollTrigger (vedi sotto).
        gsap.ticker.lagSmoothing(0);
        getLenis()?.start();
        // Sul telefono il registro del precarico NON è stato drenato dietro il
        // sipario (vedi più sotto il perché): parte adesso, a ruota libera,
        // dopo l'handoff. Su desktop `runWarmup` è già partito e questa riga
        // non fa nulla — `scheduleIdleWarmup` esce subito se è già in corso.
        scheduleIdleWarmup();
      };

      // Il CSS ha una safety autohide per il caso "bundle mai idratato":
      // da qui in poi il timone è di GSAP, l'animazione CSS va disattivata.
      root.style.animation = "none";

      const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
      // Cintura e bretelle: l'inline script già esclude reduced-motion,
      // ma se l'utente lo attiva tra paint e idratazione chiudiamo subito.
      if (!media.matches) {
        fireIntro();
        finish(true);
        return;
      }

      // Deep-link con ancora (/#contatti): la coreografia dell'arco presuppone
      // pagina in cima e combatterebbe lo scroll all'ancora di Next — niente
      // intro, si va dritti al contenuto richiesto.
      // Da oggi la decisione è già stata presa prima del paint dallo script di
      // boot (layout.tsx), che in quel caso non mette nemmeno l'attributo: qui
      // non ci si arriva più. La guardia resta come rete — costa un confronto,
      // e l'alternativa è un sipario che litiga con uno scroll all'ancora.
      if (window.location.hash) {
        fireIntro();
        finish(true);
        return;
      }

      // Il takeover è avvenuto: il failsafe JS del boot script (1,8s sul
      // telefono, 2,5s su desktop — il numero sta in layout.tsx) non deve più
      // strappare l'attributo a metà atto (tab nascosta, idratazione lenta).
      // Da qui la responsabilità di chiudere è SOLO di questo effect.
      try {
        window.clearTimeout(boot().__dtPreFailsafe);
      } catch {
        /* boot script mai eseguito: nulla da pulire */
      }

      getLenis()?.stop();
      // L'arco rivela l'hero: la pagina deve essere in cima (reload a metà
      // pagina, scroll restoration). Lenis è già fermo: salto istantaneo.
      window.scrollTo(0, 0);

      // Il jank di avvio (idratazione, decode immagini) con lagSmoothing(0)
      // farebbe saltare la timeline in avanti di secondi al primo tick.
      // Durante l'intro lo scroll è bloccato, quindi lo smoothing è sicuro;
      // finish() lo riporta a 0 (contratto SmoothScroll/Lenis).
      gsap.ticker.lagSmoothing(500, 33);

      const panel = root.querySelector<HTMLElement>("[data-pre-panel]");
      const content = root.querySelector<HTMLElement>("[data-pre-content]");
      const titleChars = root.querySelectorAll<HTMLElement>("[data-pre-char]");
      const scriptChars = root.querySelectorAll<HTMLElement>("[data-pre-schar]");
      const caps = root.querySelectorAll<HTMLElement>("[data-pre-cap]");
      const words = root.querySelectorAll<HTMLElement>("[data-pre-word]");
      const progress = root.querySelector<HTMLElement>("[data-pre-progress]");
      const track = root.querySelector<HTMLElement>("[data-pre-track]");
      if (!panel || !content) {
        fireIntro();
        finish(true);
        return;
      }

      // La porta ad arco vive su una maschera additiva con mask-composite:
      // dove non è supportata (browser datati) si ripiega sul sipario.
      const supportsArch =
        typeof CSS !== "undefined" && CSS.supports("mask-composite", "add");
      if (supportsArch) root.classList.add("is-arch", "dt-arch-mask");

      // Payoff nella lingua salvata (cookie dt_locale): il testo cambia PRIMA
      // del reveal (le righe sono ancora sotto la maschera → nessun flash).
      // Vale anche col primo atto in CSS: siamo in un layout effect, cioè
      // prima del paint in cui quelle animazioni cominciano — la riga sale già
      // nella lingua giusta, non cambia parola a metà salita.
      const [p1, p2] = payoffFromCookie();
      if (words[0]) words[0].textContent = p1;
      if (words[1]) words[1].textContent = p2;

      // Il badge gira per tutta l'intro, anello e monogramma in versi opposti:
      // stesso gesto dell'header.
      const spin = spinMarkBadge(root, 6);

      // ── IL PRECARICO: DIETRO IL SIPARIO, MAI OLTRE IL SIPARIO ───────────
      // Parte SUBITO, in parallelo all'intro: i secondi dell'animazione sono
      // tempo che l'utente sta gia' aspettando: e' li' che va messo il lavoro
      // che altrimenti cadrebbe sul primo scroll.
      //
      // Su DESKTOP: tutte le immagini della pagina, non solo quelle delle scene
      // animate (richiesta del cliente: «caricare tutto prima di entrare»). Si
      // iscrive PRIMA di avviare il precarico, cosi' entra nel primo giro di
      // raccolta. Scadenza 4,5s contro un'intro di 4,63: l'attesa è coperta dal
      // sipario per costruzione, non per fortuna. (Prima era 4,5 ma il tetto
      // vero era 5,7 — la corsa dei font non era compresa nella scadenza — e
      // fra 4,63 e 5,7 la pagina sembrava pronta e non scorreva. Il conto ora
      // torna: vedi il commento in warmup.ts.)
      //
      // Su TELEFONO no, ed è una decisione, non una svista: `warmAllImages`
      // sveglia OGNI immagine del documento e le mette in gara con la foto
      // dell'hero — cioè con l'unica immagine che l'arco sta per scoprire —
      // sulla connessione in cui quella gara si perde. Qui si aspetta solo il
      // primo schermo, senza svegliare niente; il registro (Header, CharFlip,
      // Fioritura, TeamTrail: quattro iscritti anche su mobile) passa da
      // `scheduleIdleWarmup()` in `finish()`, cioè DOPO l'handoff.
      // Il «caricare tutto prima di entrare» del cliente resta com'è dove è
      // stato misurato — su desktop. Su un telefono significherebbe spendere
      // il piano dati del visitatore per immagini che stanno sette schermate
      // più in basso e che forse non vedrà mai.
      let scaldata: Promise<void>;
      if (mobile) {
        // 1,4s < 1,75s di intro: idem, la scadenza sta dentro il sipario.
        scaldata = warmFirstFold(1400);
      } else {
        registerWarmup(warmAllImages);
        scaldata = runWarmup(4500);
      }
      /** true se l'utente ha saltato l'intro: allora non si aspetta il precarico. */
      let saltata = false;

      const tl = gsap.timeline({
        defaults: { ease: "domus" },
        onComplete: () => {
          spin?.kill();
          // Il sipario si alza solo quando le scene pesanti sono calde.
          // `runWarmup` e' partito insieme all'intro e ha una scadenza sua:
          // nel caso normale ha gia' finito e questo `then` e' immediato, su
          // rete lenta rinuncia e si entra comunque. Nessuno resta chiuso
          // fuori dal sito perche' un fiore non era pronto.
          if (saltata) finish(true);
          // `.catch` prima del `.then`: se il precarico rifiuta (basta una
          // immagine che non arriva), senza questa rete la promessa non si
          // risolve mai, `finish` non viene chiamato e il sipario resta su per
          // sempre. Un fiore che non carica non può chiudere fuori dal sito
          // chi sta guardando.
          else void scaldata.catch(() => {}).then(() => finish(true));
        },
      });

      // ── IL BUDGET DEI DUE MONTAGGI, IN UN POSTO SOLO ───────────────────
      // I tempi stanno qui e non sparsi dentro i tween perché sono un budget:
      // la somma dev'essere leggibile senza rileggere la timeline.
      //   telefono   0,25 la porta sale · 0,60 il lockup si congeda ·
      //              0,95 il tuffo → 1,75s (ripiego: 1,30s)
      //   desktop    2,25 · 2,35 · 3,13 → 4,63s (ripiego: 3,50s)
      // Sul telefono si taglia la DURATA e si tolgono ATTI; la porta tiene la
      // sua forma e il tuffo la sua ease. Non si tocca il gesto.
      const T = mobile
        ? {
            arco: 0.25,
            salita: 0.7,
            w0: "40vw",
            w1: "58vw",
            y1: "16vh",
            uscita: 0.6,
            uscitaDur: 0.4,
            uscitaY: -20,
            tuffo: 0.95,
            tuffoDur: 0.8,
            w2: "165vw",
            sipario: 0.55,
            siparioDur: 0.75,
          }
        : {
            arco: 2.25,
            salita: 1.1,
            w0: "24vw",
            w1: "36vw",
            y1: "15vh",
            uscita: 2.35,
            uscitaDur: 0.55,
            uscitaY: -28,
            tuffo: 3.13,
            tuffoDur: 1.5,
            w2: "125vw",
            sipario: 2.6,
            siparioDur: 0.9,
          };

      // ── Atto I — il lockup si compone (≈2.2s) ─────────────────────────
      // SOLO SU DESKTOP. Sul telefono questo atto è CSS e vive in globals.css:
      // qui non deve girare nulla, o GSAP riscriverebbe da zero — con un
      // salto visibile — ciò che il CSS ha già composto senza aspettarlo.
      //
      // Reveal fedeli al riferimento (README §7): titoli per lettere con
      // rotazione su Y, script per lettere con rotazione su X + slittamento
      // orizzontale, paragrafi per righe da sotto la maschera. Ease "dtOut".
      // La sagoma di Raffaela arriva per prima, dall'ombra; NON esce mai col
      // contenuto: resta finché l'arco non la scambia con la foto vera.
      if (!mobile) {
        const figure = root.querySelector<HTMLElement>("[data-pre-figure]");
        if (figure) {
          tl.fromTo(
            figure,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: dur.reveal, ease: "none" },
            0.15
          );
        }
        // Ritmo disteso (richiesta cliente 2026-08-03): stesse curve, durate e
        // stagger più larghi — l'intro respira senza allungarsi oltre misura.
        tl.to(content, { autoAlpha: 1, duration: 0.25, ease: "none" }, 0)
          .fromTo(
            titleChars,
            { opacity: 0, yPercent: 50, rotateY: 90, transformPerspective: 800 },
            {
              opacity: 1,
              yPercent: 0,
              rotateY: 0,
              duration: 1.3,
              stagger: 0.075,
              ease: "dtOut",
            },
            0.12
          )
          .fromTo(
            scriptChars,
            {
              opacity: 0,
              rotateX: 90,
              x: "6vw",
              transformOrigin: "center bottom",
              transformPerspective: 800,
            },
            {
              opacity: 1,
              rotateX: 0,
              x: "0vw",
              duration: 1.3,
              stagger: 0.065,
              ease: "dtOut",
            },
            0.6
          )
          .fromTo(
            caps,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.85, stagger: 0.11, ease: "dtOut" },
            0.4
          )
          .fromTo(
            words,
            { yPercent: 110 },
            { yPercent: 0, duration: 1.25, stagger: 0.14, ease: "dtOut" },
            0.65
          );

        // ── Atto II — la linea di carica (a scatti, come un vero load) ────
        // Non esiste sul telefono, e non è una rinuncia: è un filo di 1px alto
        // 64 che non è mai stato collegato a un caricamento vero. Su 390px non
        // guadagna niente e non misura niente. (globals.css lo toglie anche
        // dal flusso, così la promessa non resta con un buco sopra.)
        if (progress && track) {
          tl.to(progress, { autoAlpha: 1, duration: 0.25, ease: "none" }, 0.55).fromTo(
            track,
            { yPercent: -100 },
            { yPercent: 0, duration: 1.55, ease: "dtLoader" },
            0.6
          );
        }
      }

      // ── Atto III — la porta ad arco, e il tuffo ───────────────────────
      // Il contenuto si congeda mentre la porta sale; l'handoff all'hero
      // (INTRO_EVENT → le lettere di HeroCinematic) parte esattamente col tuffo.
      tl.addLabel("arch", T.arco);
      tl.to(
        content,
        { y: T.uscitaY, autoAlpha: 0, duration: T.uscitaDur, ease: "domus.inOut" },
        T.uscita
      );
      if (supportsArch) {
        tl.fromTo(
          root,
          { "--arch-w": T.w0, "--arch-y": "104vh" },
          { "--arch-w": T.w1, "--arch-y": T.y1, duration: T.salita, ease: "domus.inOut" },
          "arch"
        )
          .addLabel("dive", T.tuffo)
          .call(fireIntro, [], "dive")
          .to(
            root,
            { "--arch-w": T.w2, "--arch-y": "-100vh", duration: T.tuffoDur, ease: "dtDiveIn" },
            "dive"
          );
      } else {
        // Fallback: sipario che sale, handoff appena il bordo scopre l'hero.
        tl.addLabel("dive", T.sipario)
          .call(fireIntro, [], "dive")
          .to(
            panel,
            { clipPath: "inset(0% 0% 100% 0%)", duration: T.siparioDur, ease: "domus.inOut" },
            "dive"
          );
      }

      // Skip: al primo tocco/click/tasto si salta dritti al tuffo (mai
      // bloccare). seek() sopprime le callback attraversate: l'evento va
      // sparato a mano.
      // IL TOCCO È GIÀ COPERTO, e non serve aggiungere niente: il listener è
      // `pointerdown`, che nasce anche dal dito — verificato prima di portare
      // l'intro sul telefono, dove sarebbe stato il gesto di uscita più
      // probabile. Da sapere: saltare fa `seek("dive")`, quindi il tuffo suona
      // comunque per intero (0,8s sul telefono, 1,5s su desktop): lo skip
      // taglia il preambolo, non la porta.
      const skip = () => {
        if (tl.time() >= tl.labels.dive) return;
        // Saltare vuol dire "entra ADESSO": aspettare il precarico
        // contraddirebbe l'unico gesto con cui l'utente ha detto che ha fretta.
        // Il riscaldamento non si annulla, prosegue per conto suo — arrivera'
        // in ritardo su qualche scena, che e' esattamente il compromesso che
        // chi salta ha scelto.
        saltata = true;
        fireIntro();
        tl.seek("dive");
      };
      const onPointerSkip = () => skip();
      const onKeySkip = (e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        // Solo tasti "di contenuto": F5/DevTools/media key restano al browser.
        const usable =
          e.key === "Enter" || e.key === " " || e.key === "Escape" || e.key.length === 1;
        if (!usable) return;
        // La guardia "intro già finita" PRIMA di preventDefault, non dentro
        // skip(): è l'inversione che nell'onda 9 rese i campi inservibili in
        // produzione. Qui il listener viene staccato a fine intro, quindi oggi
        // non fa danno — ma l'ordine sbagliato resta una trappola per il
        // prossimo che tocchi la pulizia.
        if (tl.time() >= tl.labels.dive) return;
        // preventDefault: sotto l'overlay può esserci un elemento focalizzato
        // (es. un bottone) — il tasto salta l'intro, non deve attivare altro.
        e.preventDefault();
        skip();
      };
      // Se reduced-motion viene attivato DURANTE l'intro: fine immediata,
      // senza suonare il tuffo (1.5s di motion ampio non richiesto).
      const onMediaChange = () => {
        if (media.matches) return;
        // Reduced-motion acceso in corsa: chiusura immediata, senza attendere
        // il precarico (chi lo attiva ora vuole meno movimento, non piu' attesa).
        saltata = true;
        fireIntro();
        tl.progress(1); // onComplete → finish(true)
      };
      // Tab in background: il ticker GSAP si congela e la timeline non
      // avanzerebbe (col rischio di riaffiorare a caso al rientro) — si
      // chiude subito, l'utente al ritorno trova la pagina pronta.
      const onVisibility = () => {
        if (!document.hidden) return;
        // `saltata` come nello skip e nel cambio di reduced-motion: chi ha
        // lasciato la scheda non sta aspettando il precarico. Senza questa
        // riga la chiusura passa dal ramo che ATTENDE `scaldata`, e al ritorno
        // si trova la pagina finita che non scorre — il buco che questa fase è
        // venuta a chiudere, riaperto dalla porta di servizio.
        saltata = true;
        fireIntro();
        tl.progress(1);
      };
      window.addEventListener("pointerdown", onPointerSkip);
      window.addEventListener("keydown", onKeySkip);
      media.addEventListener("change", onMediaChange);
      document.addEventListener("visibilitychange", onVisibility);
      removeSkipListeners = () => {
        window.removeEventListener("pointerdown", onPointerSkip);
        window.removeEventListener("keydown", onKeySkip);
        media.removeEventListener("change", onMediaChange);
        document.removeEventListener("visibilitychange", onVisibility);
      };
      // Caso limite: la pagina è già nascosta al mount (aperta in tab in
      // background) — chiudi subito invece di strisciare.
      if (document.hidden) onVisibility();

      return () => {
        removeSkipListeners();
        // Abort a metà intro (StrictMode double-mount, HMR): l'attributo
        // `data-preloader` RESTA, così il re-run immediato ricostruisce la
        // coreografia (prima veniva rimosso e in dev l'intro non si vedeva
        // mai). Si ripristinano solo i contratti globali e si ri-arma il
        // failsafe del boot script: se il remount non arrivasse mai, l'overlay
        // si toglie comunque.
        // `data-pre-live` invece va tolto: dice "il vero overlay è a schermo",
        // e in questo istante non lo è più — senza toglierlo resterebbe nero
        // vuoto al posto del primo fotogramma. Il remount lo rimette.
        // 8000ms era il terzo orologio che si dichiarava allineato agli altri
        // due senza esserlo: è lo stesso mestiere del failsafe di boot, quindi
        // è lo stesso numero (1,8s / 2,5s, layout.tsx).
        if (html.hasAttribute("data-preloader")) {
          html.removeAttribute("data-pre-live");
          gsap.ticker.lagSmoothing(0);
          getLenis()?.start();
          boot().__dtPreFailsafe = window.setTimeout(
            () => {
              fireIntro();
              html.removeAttribute("data-preloader");
            },
            mobile ? 1800 : 2500
          );
        }
      };
    },
    { scope: rootRef }
  );

  // Intro non prevista (visita di ritorno, reduced-motion, niente JS al boot):
  // niente markup, niente 119 nodi, niente sagoma da 79 KB scaricata per
  // nessuno. Gli hook qui sopra sono già stati chiamati tutti, in ordine.
  if (!attivo) return null;

  return (
    <div ref={rootRef} aria-hidden className="dt-preloader">
      <div data-pre-panel className="absolute inset-0 overflow-hidden bg-espresso">
        {/* Profondità calda, mai nero piatto (stesse regole di .bg-ink).
            Il gradiente sta in globals.css (`.dt-pre-fondo`) e non più qui:
            lo porta anche il primo fotogramma reso dal server in layout.tsx,
            e due copie che divergono di una virgola si vedrebbero nel
            passaggio dall'uno all'altro. */}
        <div className="dt-pre-fondo absolute inset-0" />
        <div className="grain !absolute !z-0" aria-hidden />

        {/* La "sagoma" di Raffaela: il RITAGLIO con canale alpha della stessa
            foto dell'hero (stesso canvas 2000×1415, fornito dal cliente), con
            la stessa geometria object-cover dell'immagine sotto — silhouette
            pulita sul fondo del preloader, e quando l'arco la attraversa
            sagoma e foto coincidono pixel su pixel: la stanza "torna". */}
        <div data-pre-figure className="absolute inset-0" style={{ opacity: 0 }}>
          {/* WebP, non PNG: stesso canvas 2000×1415 e stesso canale alpha, ma 77 KB
              invece di 791. Il preloader è la PRIMA cosa che scarica un visitatore
              nuovo, in concorrenza con la foto dell'hero sulla stessa banda: 714 KB
              risparmiati lì valgono più che altrove. Il PNG resta come fallback per i
              browser senza WebP — la <picture> lo sceglie da sola.
              Resta un <img> e non next/image: qui serve il controllo pixel-su-pixel
              con la foto sotto (vedi commento sopra), non il resize automatico. */}
          <picture>
            <source srcSet="/media/raffaela-sagoma.webp" type="image/webp" />
            <img
              src="/media/raffaela-sagoma.png"
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: "50% 70%" }}
            />
          </picture>
        </div>

        {/* Anelli eco della porta (solo variante arco, vedi globals.css):
            la maschera li taglia dove c'è il buco, restano i profili. */}
        <div data-pre-arch-echo="2" />
        <div data-pre-arch-echo="1" />

        <div
          data-pre-content
          className="relative flex h-full flex-col items-center justify-between py-10 sm:py-12"
        >
          {/* Alto: il marchio ufficiale (variante per fondo scuro: la "Tua"
              del monogramma resta rossa), con l'anello che gira.
              Resta anche sul telefono: è SVG di soli transform, è il marchio,
              e non costa quasi niente — è la cosa che meno andava tagliata. */}
          <span data-pre-badge className="text-cream/85">
            <MarkBadge className="h-14 w-14" dark />
          </span>

          {/* Centro: lockup al centro, caps in colonna a destra (a sinistra
              c'è la sagoma di Raffaela: la colonna la bilancia). */}
          <div className="relative flex w-full items-center justify-center px-[6vw]">
            {/* div, non heading: l'overlay è decorativo (aria-hidden) e un h2
                prima dell'h1 di pagina sporcherebbe l'outline del documento. */}
            <div className="relative text-center">
              <div className="font-hero text-[11vh] font-medium leading-[0.95] tracking-[-0.01em] text-cream">
                <PreChars text="Domus" step={0} />
                <PreChars text="Tua" step={1} />
              </div>
              <span
                className="pointer-events-none absolute -bottom-[0.52em] left-1/2 -translate-x-1/2 whitespace-nowrap font-script text-[5.2vh] leading-none text-red [text-shadow:0_2px_28px_rgba(28,21,18,0.55)]"
              >
                <PreChars text="Raffaela Rizza" script />
              </span>
            </div>
            <span className="absolute right-[7vw] top-1/2 hidden -translate-y-1/2 flex-col items-start gap-3 md:flex">
              <span
                data-pre-cap
                className="text-[0.68rem] font-semibold uppercase tracking-[0.55em] text-cream/60"
              >
                Immobiliare
              </span>
              <span
                data-pre-cap
                className="text-[0.68rem] font-semibold uppercase tracking-[0.55em] text-cream/60"
              >
                dal 2007
              </span>
            </span>
          </div>

          {/* Basso: linea di carica + promessa. La linea NON è un progresso —
              non è mai stata legata a un caricamento vero, malgrado il nome —
              ed è per questo che sul telefono sparisce del tutto
              (globals.css): un filo da 1px su 390 non dice niente a nessuno. */}
          <div className="flex flex-col items-center">
            <span data-pre-progress className="block h-16 w-px overflow-hidden bg-cream/20 opacity-0">
              <span data-pre-track className="block h-full w-full bg-cream" />
            </span>
            <p className="mt-5 text-center text-[0.82rem] font-medium leading-relaxed text-cream/70">
              <span className="block overflow-hidden">
                <span data-pre-word="1" className="block">
                  Vendere senza stress.
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-pre-word="2" className="block">
                  Acquistare con sicurezza.
                </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
