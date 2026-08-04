"use client";

// Preloader "Arco Domus" — prima visita della sessione.
// Coreografia rif. era-residence.com (reverse-engineering/era-residence/):
// lockup + progress, poi una PORTA AD ARCO sale dal fondo (maschera CSS a
// 4 layer, vedi globals.css) e ci si "tuffa" dentro l'hero, che nel
// frattempo scala 0.75→1 (handoff INTRO_EVENT → HeroCinematic).
// L'attributo <html data-preloader> è messo da un inline script nel layout
// PRIMA del primo paint (vedi app/layout.tsx): qui si coreografa e si smonta.
// - Una volta per sessione (sessionStorage), ~5s, skip con click/tasto.
// - Assente con reduced-motion, su mobile e senza JS (l'attributo non c'è mai).
// - Non blocca l'LCP: l'hero sotto continua fetch/decode; l'overlay è solo
//   un layer fixed sopra — ed è proprio ciò che l'arco rivela.
// - Fallback senza mask-composite: sipario a salire (clip-path), stesso ritmo.
import { useRef } from "react";
import { gsap, useGSAP, dur } from "../../lib/motion/gsap";
import { MarkBadge } from "./RotatingMark";
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

// Le ease dell'arco ("dtLoader", "dtDiveIn") vivono nel vocabolario condiviso
// (lib/motion/gsap.ts): le usa anche il sipario ad arco di PageTransition.

// Split per lettere (stessa tecnica del riferimento, resa in SSR): ogni char
// è animabile singolarmente. La riga vive dentro una maschera overflow-hidden
// per il titolo; lo script no (ruota su X e slitta, non deve essere tagliato).
function PreChars({ text, script = false }: { text: string; script?: boolean }) {
  const attr = script ? { "data-pre-schar": "" } : { "data-pre-char": "" };
  const chars = text.split("").map((ch, i) =>
    ch === " " ? (
      " "
    ) : (
      <span key={i} {...attr} className="inline-block will-change-transform">
        {ch}
      </span>
    )
  );
  if (script) return <span className="inline-block">{chars}</span>;
  return (
    <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
      <span className="block">{chars}</span>
    </span>
  );
}

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const html = document.documentElement;
      if (!root || !html.hasAttribute("data-preloader")) return;

      // L'evento di handoff parte una sola volta, da qualunque percorso
      // (fine naturale, skip, abort): chi ascolta non deve mai restare appeso.
      let introFired = false;
      const fireIntro = () => {
        if (introFired) return;
        introFired = true;
        window.dispatchEvent(new Event(INTRO_EVENT));
      };

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
        // Ripristina il contratto Lenis↔ScrollTrigger (vedi sotto).
        gsap.ticker.lagSmoothing(0);
        getLenis()?.start();
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
      if (window.location.hash) {
        fireIntro();
        finish(true);
        return;
      }

      // Il takeover è avvenuto: il failsafe JS del boot script (8s) non deve
      // più strappare l'attributo a metà atto (tab nascosta, idratazione
      // lenta). Da qui la responsabilità di chiudere è SOLO di questo effect.
      try {
        window.clearTimeout(
          (window as unknown as { __dtPreFailsafe?: number }).__dtPreFailsafe
        );
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
      const ring = root.querySelector<HTMLElement>("[data-rot-core]");
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
      const [p1, p2] = payoffFromCookie();
      if (words[0]) words[0].textContent = p1;
      if (words[1]) words[1].textContent = p2;

      // L'anello del marchio gira per tutta l'intro (stesso gesto dell'header).
      const spin = ring
        ? gsap.to(ring, {
            rotation: 360,
            duration: 6,
            ease: "none",
            repeat: -1,
            transformOrigin: "center center",
          })
        : null;

      const tl = gsap.timeline({
        defaults: { ease: "domus" },
        onComplete: () => {
          spin?.kill();
          finish(true);
        },
      });

      // ── Atto I — il lockup si compone (≈2.2s) ─────────────────────────
      // Reveal fedeli al riferimento (README §7): titoli per lettere con
      // rotazione su Y, script per lettere con rotazione su X + slittamento
      // orizzontale, paragrafi per righe da sotto la maschera. Ease "dtOut".
      // La sagoma di Raffaela arriva per prima, dall'ombra; NON esce mai col
      // contenuto: resta finché l'arco non la scambia con la foto vera.
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
      if (progress && track) {
        tl.to(progress, { autoAlpha: 1, duration: 0.25, ease: "none" }, 0.55).fromTo(
          track,
          { yPercent: -100 },
          { yPercent: 0, duration: 1.55, ease: "dtLoader" },
          0.6
        );
      }

      // ── Atto III — la porta ad arco, e il tuffo (≈2.4s) ───────────────
      // Il contenuto si congeda mentre la porta sale; l'handoff all'hero
      // (scale 0.75→1 in HeroCinematic) parte esattamente col tuffo.
      tl.addLabel("arch", 2.25);
      tl.to(
        content,
        { y: -28, autoAlpha: 0, duration: 0.55, ease: "domus.inOut" },
        "arch+=0.1"
      );
      if (supportsArch) {
        tl.fromTo(
          root,
          { "--arch-w": "24vw", "--arch-y": "104vh" },
          { "--arch-w": "36vw", "--arch-y": "15vh", duration: 1.1, ease: "domus.inOut" },
          "arch"
        )
          .addLabel("dive", "arch+=0.88")
          .call(fireIntro, [], "dive")
          .to(
            root,
            { "--arch-w": "125vw", "--arch-y": "-100vh", duration: 1.5, ease: "dtDiveIn" },
            "dive"
          );
      } else {
        // Fallback: sipario che sale, handoff appena il bordo scopre l'hero.
        tl.addLabel("dive", "arch+=0.35")
          .call(fireIntro, [], "dive")
          .to(
            panel,
            { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "domus.inOut" },
            "dive"
          );
      }

      // Skip: al primo click/tasto si salta dritti al tuffo (mai bloccare).
      // seek() sopprime le callback attraversate: l'evento va sparato a mano.
      const skip = () => {
        if (tl.time() >= tl.labels.dive) return;
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
        // preventDefault: sotto l'overlay può esserci un elemento focalizzato
        // (es. un bottone) — il tasto salta l'intro, non deve attivare altro.
        e.preventDefault();
        skip();
      };
      // Se reduced-motion viene attivato DURANTE l'intro: fine immediata,
      // senza suonare il tuffo (1.5s di motion ampio non richiesto).
      const onMediaChange = () => {
        if (media.matches) return;
        fireIntro();
        tl.progress(1); // onComplete → finish(true)
      };
      // Tab in background: il ticker GSAP si congela e la timeline non
      // avanzerebbe (col rischio di riaffiorare a caso al rientro) — si
      // chiude subito, l'utente al ritorno trova la pagina pronta.
      const onVisibility = () => {
        if (!document.hidden) return;
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
        // RESTA, così il re-run immediato ricostruisce la coreografia (prima
        // veniva rimosso e in dev l'intro non si vedeva mai). Si ripristinano
        // solo i contratti globali e si ri-arma il failsafe del boot script:
        // se il remount non arrivasse mai, l'overlay si toglie comunque.
        if (html.hasAttribute("data-preloader")) {
          gsap.ticker.lagSmoothing(0);
          getLenis()?.start();
          (window as unknown as { __dtPreFailsafe?: number }).__dtPreFailsafe =
            window.setTimeout(() => {
              fireIntro();
              html.removeAttribute("data-preloader");
            }, 8000);
        }
      };
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} aria-hidden className="dt-preloader">
      <div data-pre-panel className="absolute inset-0 overflow-hidden bg-espresso">
        {/* Profondità calda, mai nero piatto (stesse regole di .bg-ink). */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(95% 130% at 12% -10%, rgba(150, 26, 24, 0.32), transparent 55%), radial-gradient(90% 120% at 102% 112%, rgba(24, 12, 12, 0.9), transparent 60%)",
          }}
        />
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
              del monogramma resta rossa), con l'anello che gira */}
          <span className="text-cream/85">
            <MarkBadge className="h-14 w-14" dark />
          </span>

          {/* Centro: lockup al centro, caps in colonna a destra (a sinistra
              c'è la sagoma di Raffaela: la colonna la bilancia). */}
          <div className="relative flex w-full items-center justify-center px-[6vw]">
            {/* div, non heading: l'overlay è decorativo (aria-hidden) e un h2
                prima dell'h1 di pagina sporcherebbe l'outline del documento. */}
            <div className="relative text-center">
              <div className="font-hero text-[11vh] font-medium leading-[0.95] tracking-[-0.01em] text-cream">
                <PreChars text="Domus" />
                <PreChars text="Tua" />
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

          {/* Basso: linea di carica + promessa */}
          <div className="flex flex-col items-center">
            <span data-pre-progress className="block h-16 w-px overflow-hidden bg-cream/20 opacity-0">
              <span data-pre-track className="block h-full w-full bg-cream" />
            </span>
            <p className="mt-5 text-center text-[0.82rem] font-medium leading-relaxed text-cream/70">
              <span className="block overflow-hidden">
                <span data-pre-word className="block">
                  Vendere senza stress.
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-pre-word className="block">
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
