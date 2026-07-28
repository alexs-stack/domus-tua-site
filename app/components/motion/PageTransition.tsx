"use client";

// Transizioni di pagina — sipario espresso con il Segno che si ridisegna.
// Architettura (Next 16): un listener delegato in capture intercetta i click
// sui link interni (i <Link> restano com'erano: prefetch gratis), fa
// preventDefault → exit timeline → router.push; all'arrivo del nuovo pathname
// il sipario si apre sulla pagina già coreografata.
// - Nessun wrapper attorno alla pagina: overlay fixed fratello del contenuto
//   → gli elementi fixed (header, WhatsApp, action bar) restano intatti.
// - Back/forward del browser: nessuna transizione; se il popstate arriva
//   DURANTE l'exit, il push pendente viene invalidato (navSeq) — il tasto
//   Indietro vince sempre.
// - Il sipario annuncia la destinazione: parola outline col nome tradotto
//   della pagina (d.nav.*), scritta nel DOM dentro navigate() prima della
//   copertura; route non mappate → solo il Segno.
// - Reduced-motion: navigazione nativa Next, sipario mai.
// - Scroll: reset istantaneo sotto il sipario; ScrollTrigger.refresh() dopo il
//   mount; focus sull'ancora (se c'è) o su #main per tastiera/screen reader.
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, MQ, dur } from "../../lib/motion/gsap";
import { SegnoDomus } from "../BrandMotif";
import { useDict } from "../i18n/LocaleProvider";
import { getLenis } from "./SmoothScroll";

const CLOSED = "inset(100% 0% 0% 0%)";
const OPEN = "inset(0% 0% 0% 0%)";
const EXITED = "inset(0% 0% 100% 0%)";

type NavDict = ReturnType<typeof useDict>["nav"];

// Il sipario annuncia la destinazione: pathname → etichetta tradotta (d.nav.*).
// Route non mappate (privacy, cookie, servizi…) → null: resta solo il Segno.
function labelForPath(rawPath: string, nav: NavDict): string | null {
  const path =
    rawPath.length > 1 && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;
  if (path === "/") return "Domus Tua"; // nome proprio: identico in ogni lingua
  if (path === "/case" || path.startsWith("/case/")) return nav.case;
  switch (path) {
    case "/vendi":
      return nav.vendi;
    case "/acquista":
      return nav.acquista;
    case "/metodo":
      return nav.metodo;
    case "/open-domus":
      return nav.openDomus;
    case "/recensioni":
      return nav.recensioni;
    case "/chi-siamo":
      return nav.chiSiamo;
    case "/contatti":
      return nav.contatti;
    default:
      return null;
  }
}

let navigateImpl: ((href: string) => void) | null = null;
let coveringGlobal = false;

/** True mentre il sipario copre (exit → entrance): chi gestisce Lenis
 *  (es. la chiusura del menu) non deve riavviare lo scroll in questa finestra. */
export function isTransitionCovering(): boolean {
  return coveringGlobal;
}

/** Naviga con la transizione coreografata (fallback: nessuna transizione). */
export function transitionTo(href: string) {
  if (navigateImpl) navigateImpl(href);
  else window.location.assign(href);
}

export default function PageTransition() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const wordRef = useRef<HTMLDivElement | null>(null);
  const coveringRef = useRef(false);
  const navSeqRef = useRef(0);
  const safetyRef = useRef<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Dizionario via ref: navigate() vive nell'effetto [router] e non deve
  // ri-registrare il listener (né perdere un safety timeout in corso) a ogni
  // cambio lingua. navigate parte solo da eventi utente → la ref è già fresca.
  const d = useDict();
  const dictRef = useRef(d);
  useEffect(() => {
    dictRef.current = d;
  }, [d]);

  const setCovering = (v: boolean) => {
    coveringRef.current = v;
    coveringGlobal = v;
  };

  // Uscita: sipario a TRE LAME sfalsate + Segno ridisegnato, poi push.
  useEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const blades = Array.from(panel.querySelectorAll<HTMLElement>("[data-blade]"));
    const paths = Array.from(panel.querySelectorAll<SVGPathElement>("svg path"));

    const reveal = () => {
      // Apertura del sipario (percorso safety: la route non è mai arrivata).
      gsap.set(root, { pointerEvents: "none" });
      const word = wordRef.current;
      if (word) gsap.killTweensOf(word);
      const tl = gsap.timeline({
        onComplete() {
          gsap.set(blades, { clipPath: CLOSED });
          if (word) word.textContent = ""; // a riposo il layer resta vuoto
          setCovering(false);
          getLenis()?.start();
        },
      });
      tl.to(paths, { autoAlpha: 0, duration: 0.18, ease: "none" }, 0).to(
        blades,
        { clipPath: EXITED, duration: 0.55, ease: "domus.inOut", stagger: 0.07 },
        0.05
      );
      if (word) tl.to(word, { autoAlpha: 0, duration: 0.18, ease: "none" }, 0);
    };

    const navigate = (href: string) => {
      if (coveringRef.current) return;
      // Il gate reduced-motion vale anche per i caller programmatici
      // (transitionTo): navigazione pulita senza sipario.
      if (!window.matchMedia(MQ.motionOk).matches) {
        router.push(href);
        return;
      }
      setCovering(true);
      const navId = ++navSeqRef.current;
      getLenis()?.stop();

      const mobile = !window.matchMedia(MQ.desktop).matches;
      paths.forEach((p) => {
        const len = p.getTotalLength() + 2;
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      });
      gsap.set(root, { pointerEvents: "auto" });
      gsap.set(panel.querySelector("[data-segno-layer]"), { autoAlpha: 1 });
      gsap.set(paths, { autoAlpha: 1 });

      // La parola-destinazione va nel DOM ORA, prima che il sipario copra.
      // Timeline separata da quella delle lame: non deve spostare l'onComplete
      // che fa il push — la scivolata può proseguire mentre la route carica.
      const word = wordRef.current;
      if (word) {
        let destPath = href;
        try {
          destPath = new URL(href, window.location.origin).pathname;
        } catch {
          /* href relativo malformato: nessuna parola, il sipario resta com'è */
        }
        const label = labelForPath(destPath, dictRef.current.nav);
        gsap.killTweensOf(word);
        word.textContent = label ?? "";
        if (label) {
          gsap
            .timeline()
            // Alpha rapida mentre le lame chiudono…
            .fromTo(
              word,
              { xPercent: -6, autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.3, ease: "none" },
              0.1
            )
            // …scivolata orizzontale sottile con la coda lunga della firma.
            .to(word, { xPercent: 0, duration: dur.transition, ease: "domus" }, 0.1);
        } else {
          gsap.set(word, { autoAlpha: 0 });
        }
      }

      gsap
        .timeline({
          onComplete() {
            // Un popstate nel frattempo ha già cambiato pagina: il push
            // pendente sarebbe una seconda navigazione non richiesta.
            if (navSeqRef.current !== navId) return;
            router.push(href);
            // Se la pagina nuova non arriva (errore, route lentissima),
            // il sipario si riapre comunque: mai lasciare l'utente al buio.
            safetyRef.current = window.setTimeout(() => {
              if (coveringRef.current) reveal();
            }, 4000);
          },
        })
        .fromTo(
          blades,
          { clipPath: CLOSED },
          {
            clipPath: OPEN,
            duration: mobile ? 0.32 : 0.45,
            ease: "domus.inOut",
            stagger: 0.07,
          }
        )
        .to(
          paths,
          { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut", stagger: 0.1 },
          0.2
        );
    };

    navigateImpl = navigate;

    // Listener delegato in capture: intercetta prima del gestore di <Link>.
    // Solo preventDefault (niente stopPropagation): gli onClick React dei
    // componenti (es. chiusura del menu mobile) continuano a funzionare.
    const onClick = (e: MouseEvent) => {
      // Guard PRIMA di qualunque preventDefault: durante la copertura un
      // Enter su un link focalizzato deve restare un evento nativo (o venire
      // ignorato dal browser), mai essere inghiottito a vuoto.
      if (coveringRef.current) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!window.matchMedia(MQ.motionOk).matches) return;
      const target = e.target as Element | null;
      const a = target?.closest?.("a");
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download") || a.hasAttribute("data-no-transition")) return;
      const rawHref = a.getAttribute("href");
      if (!rawHref) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      // Ancore nella stessa pagina: le gestisce Lenis (anchors: true).
      if (url.pathname === window.location.pathname) return;

      e.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (navigateImpl === navigate) navigateImpl = null;
      if (safetyRef.current) window.clearTimeout(safetyRef.current);
    };
  }, [router]);

  // Atterraggio su ancora al PRIMO load (es. /#vendi da link esterno): pin e
  // layout dinamici spostano la pagina dopo lo scroll nativo del browser —
  // a layout stabile si ri-aggancia l'ancora (6.5rem = scroll-margin-top).
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.refresh();
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(el, { immediate: true, offset: -104 });
      else el.scrollIntoView();
    }, 700);
    return () => window.clearTimeout(t);
  }, []);

  // Entrata: quando il pathname cambia MENTRE il sipario copre.
  useEffect(() => {
    // Qualunque cambio di pathname invalida un eventuale push pendente
    // (caso: back/forward premuto durante l'exit).
    navSeqRef.current++;
    if (!coveringRef.current) return;
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    if (safetyRef.current) {
      window.clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }

    // Reset scroll istantaneo sotto il sipario (mai se c'è un'ancora da
    // raggiungere: quella la gestisce Next con lo scrollIntoView).
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });

    const blades = Array.from(panel.querySelectorAll<HTMLElement>("[data-blade]"));
    const paths = Array.from(panel.querySelectorAll<SVGPathElement>("svg path"));
    const word = wordRef.current;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        // L'exit potrebbe essere ancora vivo (popstate durante il sipario):
        // un solo owner delle lame (e della parola) da qui in poi.
        gsap.killTweensOf(word ? [...blades, ...paths, word] : [...blades, ...paths]);
        // La pagina sotto è pronta: i click tornano subito al contenuto,
        // le lame continuano ad aprirsi solo visivamente.
        gsap.set(root, { pointerEvents: "none" });
        const tl = gsap.timeline({
          onComplete() {
            gsap.set(blades, { clipPath: CLOSED });
            if (word) word.textContent = ""; // a riposo il layer resta vuoto
            setCovering(false);
            getLenis()?.start();
            // Focus coerente con la destinazione: l'ancora se presente,
            // altrimenti il contenitore della pagina.
            const hash = window.location.hash;
            const anchorTarget = hash
              ? document.getElementById(decodeURIComponent(hash.slice(1)))
              : null;
            if (anchorTarget) {
              anchorTarget.setAttribute("tabindex", "-1");
              anchorTarget.focus({ preventScroll: true });
            } else {
              document.getElementById("main")?.focus({ preventScroll: true });
            }
          },
        });
        tl.to(paths, { autoAlpha: 0, duration: 0.18, ease: "none" }, 0).to(
          blades,
          {
            clipPath: EXITED,
            duration: dur.short,
            ease: "domus.inOut",
            stagger: { each: 0.06, from: "end" },
          },
          0.05
        );
        // La parola svanisce col Segno, prima che le lame scoprano la pagina.
        if (word) tl.to(word, { autoAlpha: 0, duration: 0.18, ease: "none" }, 0);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-[92]">
      {/* Sipario a tre lame verticali sfalsate (più cinema del wipe unico);
          si sovrappongono di mezzo punto per non lasciare cuciture. */}
      <div ref={panelRef} className="absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-blade
            className="absolute inset-y-0 bg-espresso"
            style={{
              left: `${i * 33.3 - (i > 0 ? 0.4 : 0)}%`,
              width: i === 2 ? `${100 - (2 * 33.3 - 0.4)}%` : "34%",
              clipPath: CLOSED,
              backgroundImage:
                "radial-gradient(120% 90% at 50% -10%, rgba(150, 26, 24, 0.28), transparent 60%), radial-gradient(120% 100% at 50% 115%, rgba(24, 12, 12, 0.85), transparent 65%)",
            }}
          />
        ))}
        {/* Il Segno vive sopra le lame: invisibile finché il sipario non copre. */}
        <div
          data-segno-layer
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: 0 }}
        >
          <SegnoDomus className="h-9 w-24" />
        </div>
        {/* Parola-destinazione: nome tradotto della pagina in arrivo, outline
            Fraunces corsivo sopra le lame, composizione editoriale in basso a
            sinistra. A riposo: vuota e autoAlpha 0 (il testo lo scrive navigate). */}
        <div
          ref={wordRef}
          aria-hidden
          className="pointer-events-none absolute bottom-[7vh] left-[4vw] select-none whitespace-nowrap font-display italic leading-none text-transparent"
          style={{
            fontSize: "11vw",
            WebkitTextStroke: "1.5px rgba(255, 252, 244, 0.35)",
            opacity: 0,
            visibility: "hidden",
          }}
        />
      </div>
    </div>
  );
}
