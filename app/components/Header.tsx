"use client";

import { useEffect, useRef, useState } from "react";
import { setOverlay } from "../lib/ui/overlays";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RotatingMark from "./motion/RotatingMark";
import { Logo } from "./Logo";
import { Whatsapp } from "./Icons";
import { Cta } from "./primitives/Cta";
import { nav, site } from "../lib/site";
import { useDict } from "./i18n/LocaleProvider";
import LanguageSwitcher from "./i18n/LanguageSwitcher";
import { getLenis } from "./motion/SmoothScroll";

// Header "rivista bianca" (2026-09-10, rif. immobiliaregoldengoal.it):
// trasparente sul fondo avorio, logo ufficiale grande a sinistra, nav maiuscola
// a 16 px; da scrollato diventa cream-deep pieno con una hairline sotto. Via il
// pill scuro, il gradiente, il blur e ogni timeline GSAP: l'unico movimento è
// la transizione CSS del colore di fondo.
//
// Da lg in su la testata ha DUE righe: logo + lingua + CTA sopra, la nav sotto
// allineata a destra. Nove voci maiuscole a 16 px con tracking 0.08em pesano
// ~950 px di solo testo: in una riga sola, accanto a logo e CTA, non ci stanno
// nemmeno a 1440 (il vecchio header ci riusciva solo scendendo a 13 px e a xl).
// Due righe restano dentro i 7.5rem massimi previsti per l'altezza fissa.
//
// L'altezza della riga mobile (`--dt-header-h`, sotto) è la stessa usata come
// `top` del pannello del menu: il pannello è `fixed` e non può agganciarsi
// all'altezza dell'header con `top: 100%` (per un elemento fixed il blocco
// contenitore è il viewport).
// Una riga sola, alta `--dt-head-h` (globals.css): lo stesso numero che la
// sagoma del preloader usa come `top` per coincidere con la banda dell'hero.
// Prima erano due piani — logo sopra, nastro di nove parole sotto — ed e' il
// «menu sopra» che il cliente ha bocciato l'11 settembre.
const ROW_H = "h-[var(--dt-head-h)]";
const PANEL_TOP = "top-[var(--dt-head-h)]";

/* Le sei della testata e le tre che restano al menu del telefono: `nav` in
   lib/site.ts e' la fonte unica, qui si filtra soltanto. */
const navPrimary = nav.filter((item) => "primary" in item && item.primary);
const navSecondary = nav.filter((item) => !("primary" in item && item.primary));

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const d = useDict();
  const pathname = usePathname();
  // Voce di nav attiva: match esatto o prefisso di sezione. Le schede /case/<slug>
  // appartengono al catalogo, che vive su /acquista (l'indice /case non esiste più).
  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/acquista" && pathname.startsWith("/case/"));
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Cambio di rotta con il menu aperto (back/forward del browser, o un link che
  // non passa dall'onClick): si chiude. Stato aggiustato durante il render, non
  // in un effetto, così non c'è un frame col pannello vecchio sulla pagina nuova.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ownership dello scroll-lock: start() SOLO se è stato questo menu a fare
  // stop() (mai al mount con open=false).
  //
  // [2026-08-11] Il lock stava su `body` e non bloccava un bel niente
  // (docs/mobile-parity.md §6.16, dubbio ora sciolto leggendo la regola CSS).
  // L'overflow del body governa il viewport SOLO se la radice è `visible` su
  // entrambi gli assi; `html { overflow-x: clip }` glielo toglie, quindi quella
  // riga era una scrittura a vuoto. A bloccare davvero era il solo
  // `getLenis()?.stop()`, che mette `lenis-stopped` su <html> e da lì
  // `overflow: hidden`. Ma con prefers-reduced-motion Lenis viene distrutto e
  // `getLenis()` torna null: su quel telefono il menu si apriva sopra una pagina
  // che continuava a scorrere sotto il dito. Ora il lock è scritto dove
  // l'overflow conta — su <html> — e Lenis resta la seconda mandata dove esiste.
  const menuLockedRef = useRef(false);
  useEffect(() => {
    const root = document.documentElement;
    const release = () => {
      if (!menuLockedRef.current) return;
      menuLockedRef.current = false;
      root.style.overflowY = "";
      root.style.scrollbarGutter = "";
      getLenis()?.start();
    };
    if (open) {
      // Prima il posto della barra di scorrimento, poi il blocco. Dove le barre
      // occupano spazio (Windows/Linux, e il menu vive fino a 1023px: succede
      // anche su un desktop stretto) farla sparire allarga il viewport e sposta
      // TUTTO di quei ~15px, compresi gli elementi fixed — l'ICB è il viewport.
      // `scrollbar-gutter: stable` glielo tiene occupato. Con le barre a
      // sovrapposizione (telefoni, macOS) la misura è 0 e non si tocca nulla.
      if (window.innerWidth - root.clientWidth > 0) root.style.scrollbarGutter = "stable";
      // Solo l'asse Y: la scorciatoia `overflow` sovrascriverebbe anche
      // l'`overflow-x: clip` della radice, e `hidden` — a differenza di `clip` —
      // fa di <html> un contenitore di scorrimento orizzontale.
      root.style.overflowY = "hidden";
      // Con Lenis attivo lo scroll virtuale va fermato insieme a quello nativo,
      // altrimenti la pagina dietro il menu continua a "muoversi" con la rotella.
      getLenis()?.stop();
      menuLockedRef.current = true;
    } else {
      release();
    }
    // Un solo punto di rilascio per tutte le vie d'uscita: Escape, il click su
    // una voce, il cambio di rotta, il passaggio del breakpoint lg (l'effetto
    // matchMedia qui sotto) e lo smontaggio passano tutti da `open=false` o da
    // questa cleanup.
    return release;
  }, [open]);

  // Il menu mobile copre tutto lo schermo: lo dichiariamo così il launcher fisso
  // dell'assistente (z-50, sopra il menu a z-40) non ci galleggi davanti.
  useEffect(() => {
    setOverlay("mobile-menu", open);
    return () => setOverlay("mobile-menu", false);
  }, [open]);

  // Se il viewport supera il breakpoint lg con il menu aperto, pannello e
  // bottone spariscono (lg:hidden) ma il lock resterebbe: chiudiamo il menu.
  // ⚠️ Il valore deve restare allineato al breakpoint delle classi `lg:` qui sotto.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Accessibilità menu mobile: Escape chiude, focus intrappolato dentro il
  // pannello, focus sul primo elemento all'apertura e ripristino sul toggle
  // alla chiusura.
  useEffect(() => {
    if (!open) return;

    const menu = menuRef.current;
    if (!menu) return;

    const focusables = () =>
      Array.from(
        menu.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Sposta il focus sul primo elemento interattivo del menu.
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !menu.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !menu.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    // Copia il ref in una variabile locale per la cleanup (evita il warning ref-in-cleanup).
    const toggle = toggleRef.current;
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Ripristina il focus sul pulsante del menu alla chiusura.
      toggle?.focus();
    };
  }, [open]);

  // Con il menu aperto la barra prende il fondo pieno anche a scroll 0: sotto
  // c'è il pannello avorio, e una barra trasparente lascerebbe vedere la pagina
  // in una striscia fra logo e voci.
  const solid = scrolled || open;

  return (
    <header
      // `!border-transparent`: globals.css ha un `* { border-color: var(--color-line) }`
      // fuori da ogni @layer, che vince sulle utility; senza il `!` la hairline
      // resterebbe visibile anche sull'header trasparente.
      // In flusso: sul telefono resta appiccicato in alto (serve al bottone Menu),
      // da lg in su SCORRE VIA come nel riferimento — nessuna barra fissa su
      // ogni schermata, la pagina è tutta contenuto.
      className={`sticky top-0 z-50 border-b transition-colors duration-300 lg:relative ${
        solid
          ? "border-line bg-cream-deep lg:!border-transparent lg:!bg-transparent"
          : "!border-transparent bg-transparent"
      }`}
    >
      <div className={`dt-row flex ${ROW_H} items-center justify-between gap-x-8`}>
        <Link href="/" className="flex shrink-0 items-center gap-4" aria-label="Domus Tua, vai alla home">
          {/* Monogramma ufficiale in rotazione oraria (RotatingMark), solo da lg:
              sul telefono la riga è del logo e del bottone Menu. Lo span di
              contorno serve perché MarkBadge porta un suo `inline-block`, e in
              Tailwind v4 le utility della stessa proprietà escono in ordine
              alfabetico: `hidden` passato come className perderebbe. */}
          {/* UN cuore solo. Prima il badge rotante mostrava il monogramma e
              sedici pixel piu' a destra il logo ricominciava con lo stesso
              cuore piu' grande e fermo: un lockup che sembrava un errore di
              montaggio. Ora il badge — il cuore che gira in senso orario,
              richiesta del cliente — sta accanto al logo solo da xl, dove
              c'e' spazio perche' si legga; sotto, il logo da solo. */}
          <span className="hidden xl:contents">
            <RotatingMark className="h-14 w-14" />
          </span>
          <Logo className="h-auto w-[clamp(150px,13vw,210px)]" />
        </Link>

        {/* Riga 1, a destra (lg+): lingua e CTA piena. */}
        {/* Nessuna CTA nell'header (rif.): l'azione sta nell'hero e nelle
            pagine, una volta sola per schermo. */}
        {/* Le sei voci primarie e la lingua, sulla STESSA riga del logo e
            allineate al suo asse: 32 px di gap (il doppio del corpo) perche'
            si leggano come voci e non come una frase sola; peso 400 e
            tracking 0.1em come il riferimento. Le altre tre voci vivono nel
            menu del telefono e nel footer. */}
        <nav aria-label="Principale" className="hidden items-center gap-x-8 lg:flex">
          {navPrimary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="whitespace-nowrap text-ui uppercase tracking-[0.1em] text-ink decoration-1 underline-offset-[0.45em] transition-[text-decoration-color] duration-200 hover:underline focus-visible:underline aria-[current=page]:underline"
            >
              {d.nav[item.key]}
            </Link>
          ))}
          <LanguageSwitcher />
        </nav>

        {/* Toggle del menu (sotto lg): parola, non icona. L'aria-label conserva
            la parola "menu" in entrambi gli stati (e2e: getByRole button /menu/i). */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="-mr-3 inline-flex min-h-11 items-center px-3 text-ui font-semibold uppercase tracking-[0.1em] text-ink underline-offset-[0.45em] hover:underline focus-visible:underline lg:hidden"
        >
          {open ? "Chiudi" : "Menu"}
        </button>

      </div>

      {/* Menu mobile: pannello pieno avorio sotto la barra, voci a d2 in Playfair.
          `hidden` quando è chiuso: fuori dal DOM accessibile e dal tab order
          senza bisogno di aria-hidden/inert. Nessuna coreografia: si apre e
          si chiude, come nel riferimento.

          `overflow-y-auto`: nove voci a d2 più il blocco in coda chiedono più
          di un telefono basso (o di qualunque telefono in orizzontale); un
          elemento fixed non si raggiunge scorrendo la pagina, quindi scorre
          per conto suo. `data-lenis-prevent` dice a Lenis di lasciarlo fare;
          `overscroll-contain` perché la regola gemella in globals.css vale
          solo con Lenis attivo. */}
      <div
        ref={menuRef}
        id="mobile-menu"
        hidden={!open}
        data-lenis-prevent
        className={`fixed inset-x-0 bottom-0 ${PANEL_TOP} z-40 overflow-y-auto overscroll-contain bg-cream lg:hidden`}
      >
        {/* Stessa gerarchia del desktop: sei voci grandi, e le tre secondarie
            su una riga sola in coda. Nove voci a d2 non stavano in uno
            schermo: la CTA e WhatsApp cadevano sotto la piega. */}
        <nav className="dt-row flex flex-col pt-2">
          {navPrimary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="border-b border-line py-3 font-display text-[clamp(1.75rem,7.5vw,2.3rem)] font-medium uppercase leading-tight text-ink aria-[current=page]:text-red"
            >
              {d.nav[item.key]}
            </Link>
          ))}
          <span className="flex flex-wrap gap-x-6 gap-y-2 py-4">
            {navSecondary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="text-ui uppercase tracking-[0.1em] text-stone underline-offset-[0.4em] aria-[current=page]:text-red aria-[current=page]:underline"
              >
                {d.nav[item.key]}
              </Link>
            ))}
          </span>
        </nav>

        <div className="dt-row flex flex-col items-start gap-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
          <Cta
            href="/valutazione-immobile-tradate"
            variant="cta-solid"
            arrow={false}
            onClick={() => setOpen(false)}
          >
            {d.header.valuta}
          </Cta>
          <Cta
            href={site.whatsapp.href}
            variant="ghost"
            arrow={false}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Whatsapp className="h-5 w-5 text-red" /> {d.header.whatsapp}
          </Cta>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
