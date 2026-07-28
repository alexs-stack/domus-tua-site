"use client";

// Transizioni di pagina — sipario espresso con il Segno che si ridisegna.
// Architettura (Next 16): un listener delegato in capture intercetta i click
// sui link interni (i <Link> restano com'erano: prefetch gratis), fa
// preventDefault → exit timeline → router.push; all'arrivo del nuovo pathname
// il sipario si apre sulla pagina già coreografata.
// - Nessun wrapper attorno alla pagina: overlay fixed fratello del contenuto
//   → gli elementi fixed (header, WhatsApp, action bar) restano intatti.
// - Back/forward del browser: nessuna transizione (il listener non è coinvolto
//   e l'entrance parte solo se il sipario sta coprendo).
// - Reduced-motion: il listener non interviene, navigazione nativa Next.
// - Scroll: reset istantaneo sotto il sipario; ScrollTrigger.refresh() dopo il
//   mount; focus su #main per gli utenti tastiera/screen reader.
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, MQ, dur } from "../../lib/motion/gsap";
import { SegnoDomus } from "../BrandMotif";
import { getLenis } from "./SmoothScroll";

const CLOSED = "inset(100% 0% 0% 0%)";
const OPEN = "inset(0% 0% 0% 0%)";
const EXITED = "inset(0% 0% 100% 0%)";

let navigateImpl: ((href: string) => void) | null = null;

/** Naviga con la transizione coreografata (fallback: nessuna transizione). */
export function transitionTo(href: string) {
  if (navigateImpl) navigateImpl(href);
  else window.location.assign(href);
}

export default function PageTransition() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const coveringRef = useRef(false);
  const safetyRef = useRef<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Uscita: sipario che sale + Segno ridisegnato, poi push.
  useEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const paths = Array.from(panel.querySelectorAll<SVGPathElement>("svg path"));

    const reveal = () => {
      // Apertura del sipario sulla pagina nuova (o forzata dalla safety).
      const tl = gsap.timeline({
        onComplete() {
          gsap.set(root, { pointerEvents: "none" });
          gsap.set(panel, { clipPath: CLOSED });
          coveringRef.current = false;
          getLenis()?.start();
        },
      });
      tl.to(paths, { autoAlpha: 0, duration: 0.18, ease: "none" }, 0).to(
        panel,
        { clipPath: EXITED, duration: 0.6, ease: "domus.inOut" },
        0.05
      );
    };

    const navigate = (href: string) => {
      if (coveringRef.current) return;
      coveringRef.current = true;
      getLenis()?.stop();

      const mobile = !window.matchMedia(MQ.desktop).matches;
      paths.forEach((p) => {
        const len = p.getTotalLength() + 2;
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      });
      gsap.set(root, { pointerEvents: "auto" });
      gsap.set(paths, { autoAlpha: 1 });

      gsap
        .timeline({
          onComplete() {
            router.push(href);
            // Se la pagina nuova non arriva (errore, route lentissima),
            // il sipario si riapre comunque: mai lasciare l'utente al buio.
            safetyRef.current = window.setTimeout(() => {
              if (coveringRef.current) reveal();
            }, 4000);
          },
        })
        .fromTo(
          panel,
          { clipPath: CLOSED },
          { clipPath: OPEN, duration: mobile ? 0.35 : 0.5, ease: "domus.inOut" }
        )
        .to(
          paths,
          { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut", stagger: 0.1 },
          0.12
        );
    };

    navigateImpl = navigate;

    // Listener delegato in capture: intercetta prima del gestore di <Link>.
    // Solo preventDefault (niente stopPropagation): gli onClick React dei
    // componenti (es. chiusura del menu mobile) continuano a funzionare.
    const onClick = (e: MouseEvent) => {
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

  // Entrata: quando il pathname cambia MENTRE il sipario copre.
  useEffect(() => {
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

    const paths = Array.from(panel.querySelectorAll<SVGPathElement>("svg path"));
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        const tl = gsap.timeline({
          onComplete() {
            gsap.set(root, { pointerEvents: "none" });
            gsap.set(panel, { clipPath: CLOSED });
            coveringRef.current = false;
            getLenis()?.start();
            const main = document.getElementById("main");
            main?.focus({ preventScroll: true });
          },
        });
        tl.to(paths, { autoAlpha: 0, duration: 0.18, ease: "none" }, 0).to(
          panel,
          { clipPath: EXITED, duration: dur.short, ease: "domus.inOut" },
          0.05
        );
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-[92]">
      <div
        ref={panelRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden bg-espresso"
        style={{ clipPath: CLOSED }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(95% 130% at 12% -10%, rgba(150, 26, 24, 0.32), transparent 55%), radial-gradient(90% 120% at 102% 112%, rgba(24, 12, 12, 0.9), transparent 60%)",
          }}
        />
        <SegnoDomus className="relative h-9 w-24" />
      </div>
    </div>
  );
}
