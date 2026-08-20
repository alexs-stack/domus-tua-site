"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { Logo } from "./Logo";
import { reopenConsent } from "../lib/consent";
import { Phone, Whatsapp, Mail, Pin } from "./Icons";
import { Cta } from "./primitives/Cta";
import SocialLinks from "./primitives/SocialLinks";
import Fioritura from "./motion/Fioritura";
import { getLenis } from "./motion/SmoothScroll";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../lib/motion/gsap";
import { nav, site } from "../lib/site";
import { useDict } from "./i18n/LocaleProvider";

export default function Footer() {
  const d = useDict();
  const footerRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const tailRef = useRef<HTMLDivElement | null>(null);
  const wordmarkRef = useRef<HTMLDivElement | null>(null);
  const legalRef = useRef<HTMLDivElement | null>(null);

  // Lo stesso effetto a ogni larghezza — l'«uncover» — con due tagli
  // (vedi globals.css "Footer reveal"):
  // - Desktop ≥1024px + motion ok: TUTTO il footer è fisso dietro al main
  //   (classe html.dt-footer-reveal + var --dt-footer-h = altezza del footer)
  //   e il contenuto si "assesta" in scrub mentre viene scoperto; il wordmark
  //   gigante sale dalla maschera.
  // - Sotto 1024px + motion ok: uncover PARZIALE. A 390 il footer intero
  //   misura ~1 393px (griglia a una colonna 949 + coda) contro 844 di
  //   viewport: fissarlo tutto renderebbe irraggiungibile per sempre la parte
  //   sopra il viewport. Quindi è fissa solo la CODA (wordmark + riga legale,
  //   ~280px: [data-footer-tail]) — le colonne restano in flusso con la loro
  //   entrata a colonne — e --dt-footer-h è l'altezza della sola coda.
  //   La coda NON sta dietro al main come sul desktop: sta dentro una cornice
  //   in flusso ([data-footer-tail-frame], clip-path: inset(0)) alta quanto
  //   lei; il clip-path la ritaglia anche se è `fixed` (overflow non lo
  //   farebbe) e la cornice, salendo con la pagina, la scopre dal basso — la
  //   stessa trasformazione del main che scopre il footer, senza toccare
  //   z-index/fondi di main e colonne (la texture topografica resta visibile
  //   sotto le colonne) e senza margini fantasma sul main.
  //   Perché non l'ultima colonna insieme alla coda: sotto lg starebbe in
  //   100 svh (181 + 280px), ma la griglia deve restare UN elemento per le
  //   tre colonne del desktop — spezzarla vorrebbe dire duplicare il DOM.
  // - Senza JS o con reduced-motion tutto in flusso e visibile.
  // Niente transform sugli antenati dei fixed (regola di casa).
  useGSAP(
    () => {
      const footer = footerRef.current;
      const grid = gridRef.current;
      if (!footer || !grid) return;
      const cols = Array.from(grid.children);
      if (cols.length === 0) return;

      const mm = gsap.matchMedia();
      const html = document.documentElement;

      // Ingresso a colonne "classico" (sotto lg + fallback desktop quando il
      // footer non entra nel viewport). opacity, non autoAlpha:
      // visibility:hidden toglierebbe i link del footer dal tab order.
      const columnsEnter = () => {
        const tween = gsap.fromTo(
          cols,
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.1,
            ease: "expo.out",
            // Replay a ogni passaggio: restart all'ingresso, reverse risalendo.
            scrollTrigger: { trigger: footer, start: "top 85%", toggleActions: "restart none none reverse" },
          }
        );
        // Reti di sicurezza (stesso patto di Reveal): il focus da tastiera o un
        // timeout rivelano subito le colonne se il trigger non è ancora scattato.
        const reveal = () => tween.progress(1);
        footer.addEventListener("focusin", reveal, { once: true });
        const safety = window.setTimeout(reveal, 2500);
        return () => {
          footer.removeEventListener("focusin", reveal);
          window.clearTimeout(safety);
        };
      };

      // Tastiera: un elemento fixed è "in viewport" per il browser anche se
      // coperto dal main (desktop) o ritagliato dalla cornice (sotto lg) →
      // al focus dentro la parte fissa portiamo l'uncover a fine corsa, così
      // il focus ring è davvero visibile (WCAG 2.4.7).
      const scrollToBottom = () => {
        const bottom = ScrollTrigger.maxScroll(window);
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(bottom, { immediate: true });
        else window.scrollTo({ top: bottom, behavior: "instant" });
      };

      // Resize della parte fissa: UN ResizeObserver, coalescente (solo cambi
      // di altezza), condiviso dai due tagli. La prima notifica post-observe è
      // ridondante (tutto appena misurato). Ritorna la disconnessione.
      const watchHeight = (target: HTMLElement, onChange: (h: number) => void) => {
        let lastH = target.offsetHeight;
        // NIENTE flag `first` qui, e la sua assenza è il punto.
        //
        // C'era: la prima consegna del ResizeObserver veniva scartata a priori, perché RO
        // notifica sempre una volta all'`observe()` senza che nulla sia cambiato. Ma quello
        // scarto NON aggiornava `lastH`, e allora una variazione arrivata FRA la misura
        // iniziale e quella prima consegna spariva per sempre: la callback che la portava
        // veniva buttata, e le successive confrontavano contro un `lastH` ormai vecchio.
        //
        // È come si perdeva un pixel: il sigillo Wikicasa del footer è un SVG che risolve
        // dopo il primo paint, alzava la colonna di 1px, e `--dt-footer-h` restava a 886
        // mentre il footer era 887 — l'uncover scopriva un pixel di troppo, per sempre.
        // Stesso meccanismo per un font che arriva tardi o per il launcher dell'assistente.
        //
        // Il confronto `h === lastH` fa già da solo il lavoro del flag: alla prima consegna
        // l'altezza è invariata e si esce, senza però perdere il caso in cui non lo è.
        const ro = new ResizeObserver(() => {
          const h = target.offsetHeight;
          if (h === lastH) return;
          lastH = h;
          onChange(h);
        });
        // `border-box`: la coda cambia altezza anche solo per il PADDING —
        // il launcher dell'assistente, montando, alza il `pb` via `:has()`
        // (globals.css). Con l'osservazione predefinita (content-box) quel
        // cambio non arriva mai: `--dt-footer-h` e la cornice restavano
        // all'altezza di prima e l'uncover scopriva un pezzo di troppo
        // (trovato dall'e2e della Fase 2 su /privacy, 2026-08-18).
        ro.observe(target, { box: "border-box" });
        return () => ro.disconnect();
      };

      mm.add(`${MQ.motionOk} and ${MQ.belowLg}`, () => {
        const cleanupCols = columnsEnter();
        const frame = frameRef.current;
        const tail = tailRef.current;
        const wordmark = wordmarkRef.current;
        const legal = legalRef.current;
        if (!frame || !tail) return cleanupCols;
        // Stessa guardia del desktop, sulla sola coda: se nemmeno lei entra
        // nel viewport (zoom testo estremo, landscape bassissimo) resta in
        // flusso: meglio una coda ferma che una mutilata.
        if (tail.offsetHeight > window.innerHeight) return cleanupCols;

        // La var PRIMA della classe: la cornice prende altezza da lei, e la
        // coda diventa fixed (altezza 0 in flusso) solo con la classe.
        const setH = () => html.style.setProperty("--dt-footer-h", `${tail.offsetHeight}px`);
        setH();
        html.classList.add("dt-footer-reveal");

        // Il settle della coda: stessa coreografia del desktop (contenuto
        // y56/opacity .3→1 e wordmark yPercent 68→0 dalla maschera), ma la
        // percentuale la calcoliamo noi dalla geometria VIVA invece che da uno
        // ScrollTrigger: con `ignoreMobileResize` (gsap.ts) la barra URL non
        // fa refresh, quindi un end calcolato a barra estesa resterebbe
        // irraggiungibile a barra ritratta (~100px su ~300 di corsa: il
        // wordmark si fermerebbe a due terzi). Qui p = quanta coda la cornice
        // ha già scoperto, letta a ogni scroll: due letture di layout, nessun
        // refresh, e p arriva a 1 esattamente in fondo, con qualunque barra.
        // Alleggerimento (regola Chanel): sul telefono il footer non chiede
        // mai ScrollTrigger.refresh() e non ha will-change — la coda è una
        // riga di wordmark e una riga legale, il compositor la tiene già.
        // Mai opacity 0: i link legali restano nel tab order.
        // COSTO MISURATO (2026-08-18, /acquista 390 CPU×4, a contenuto pari,
        // handler cronometrati in pagina): la lettura qui costa 6-7 ms per
        // evento, ma NON è additiva — è il flush di layout che senza questo
        // listener paga il listener nativo di Lenis (`actualScroll`, 5,5-9,7 ms
        // per evento su HEAD e con questo listener tolto): chi legge per primo
        // paga, la somma resta la stessa. Un throttling a rAF o una cache di
        // innerHeight non cambierebbero il conto (Chromium spedisce già un solo
        // evento scroll per frame): si lascia com'è finché una misura non dice
        // altro.
        const settle = gsap.timeline({ paused: true });
        if (legal) {
          settle.fromTo(legal, { y: 56, opacity: 0.3 }, { y: 0, opacity: 1, ease: "none" }, 0);
        }
        if (wordmark) {
          settle.fromTo(wordmark, { yPercent: 68 }, { yPercent: 0, ease: "none" }, 0.12);
        }
        let h = tail.offsetHeight;
        const update = () => {
          const top = frame.getBoundingClientRect().top;
          const p = gsap.utils.clamp(0, 1, (window.innerHeight - top) / h);
          settle.progress(p);
        };
        update();
        window.addEventListener("scroll", update, { passive: true });

        let active = true;
        const deactivate = () => {
          if (!active) return;
          active = false;
          window.removeEventListener("scroll", update);
          window.removeEventListener("resize", onResize);
          tail.removeEventListener("focusin", scrollToBottom);
          settle.kill();
          gsap.set([...(legal ? [legal] : []), ...(wordmark ? [wordmark] : [])], { clearProps: "all" });
          html.classList.remove("dt-footer-reveal");
          html.style.removeProperty("--dt-footer-h");
        };

        tail.addEventListener("focusin", scrollToBottom);

        // Il viewport che cambia altezza SENZA che cambi la coda (finestra
        // ridimensionata sotto lg, split view, barra URL): il ResizeObserver
        // qui sotto non lo vede, ma p dipende da innerHeight e la guardia pure.
        // Una lettura per evento, nessun refresh di ScrollTrigger: se la coda
        // non entra più, torna in flusso; altrimenti si ricalcola p subito,
        // senza aspettare il prossimo scroll.
        const onResize = () => {
          if (tail.offsetHeight > window.innerHeight) {
            deactivate();
            unwatch();
            return;
          }
          update();
        };
        window.addEventListener("resize", onResize);

        // Rotazione, font che arrivano, cambio lingua: la coda cambia altezza
        // → la cornice la segue; se non entra più nel viewport, coda in flusso.
        const unwatch = watchHeight(tail, (next) => {
          if (next > window.innerHeight) {
            deactivate();
            unwatch();
            return;
          }
          h = next;
          setH();
          update();
        });

        return () => {
          unwatch();
          deactivate();
          cleanupCols();
        };
      });

      mm.add(`${MQ.motionOk} and ${MQ.lg}`, () => {
        // L'uncover intero ha senso solo se il footer entra tutto nel viewport:
        // da fixed, la parte sopra il viewport sarebbe irraggiungibile per
        // sempre (laptop bassi). In quel caso: footer in flusso + ingresso
        // classico.
        if (footer.offsetHeight > window.innerHeight) return columnsEnter();

        const wordmark = wordmarkRef.current;
        html.classList.add("dt-footer-reveal");
        const setH = () => html.style.setProperty("--dt-footer-h", `${footer.offsetHeight}px`);
        setH();

        // Il progresso dell'uncover = l'ultimo tratto di scroll alto quanto il
        // footer (main ha margin-bottom = --dt-footer-h). Le colonne restano
        // sempre parzialmente visibili (mai opacity 0: link nel tab order).
        const settle = gsap.timeline({
          scrollTrigger: {
            start: () => Math.max(0, ScrollTrigger.maxScroll(window) - footer.offsetHeight),
            end: () => ScrollTrigger.maxScroll(window),
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        settle.fromTo(
          cols,
          { y: 56, opacity: 0.3 },
          { y: 0, opacity: 1, stagger: 0.08, ease: "none" },
          0
        );
        if (wordmark) {
          settle.fromTo(wordmark, { yPercent: 68 }, { yPercent: 0, ease: "none" }, 0.12);
        }

        let active = true;
        const deactivate = () => {
          if (!active) return;
          active = false;
          settle.scrollTrigger?.kill();
          settle.kill();
          gsap.set([...cols, ...(wordmark ? [wordmark] : [])], { clearProps: "all" });
          html.classList.remove("dt-footer-reveal");
          html.style.removeProperty("--dt-footer-h");
        };

        footer.addEventListener("focusin", scrollToBottom);

        // Resize: refresh al frame dopo (coalescente).
        let raf = 0;
        const unwatch = watchHeight(footer, (h) => {
          if (h > window.innerHeight) {
            // Non entra più: meglio un footer in flusso che uno mutilato.
            deactivate();
            unwatch();
            return;
          }
          setH();
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => ScrollTrigger.refresh());
        });

        return () => {
          cancelAnimationFrame(raf);
          unwatch();
          footer.removeEventListener("focusin", scrollToBottom);
          deactivate();
        };
      });
    },
    { scope: footerRef }
  );

  return (
    <footer
      data-surface="dark"
      ref={footerRef}
      className="dt-footer-reveal-target topo-ambient relative bg-graphite text-cream"
    >
      {/* Angolo fiorito notturno: l'ultimo tralcio del filo botanico, in
          palette dark sul graphite. A ogni larghezza (una Fioritura per
          sezione, «parità mobile 2» scheda 6): sotto lg box più stretto e
          basso (18svh × 28vw — svh: la barra URL non deve farlo saltare),
          cap/dpr li decide Fioritura stessa. Quando l'uncover fissa il
          footer, `fixed` (specificità maggiore) vince su `relative` e lo
          scudo resta ancorato al footer stesso. `!absolute`: la regola
          unlayered `.topo-ambient > *` (position: relative) batte le utility
          Tailwind — senza il `!` lo scudo collassa a h=0 e l'overflow-hidden
          ritaglia il canvas nel nulla. */}
      <div aria-hidden className="pointer-events-none !absolute inset-0 overflow-hidden">
        <Fioritura
          variant="corner-tr"
          palette="dark"
          className="absolute -right-5 -top-6 h-[18svh] w-[28vw] lg:h-[30vh] lg:w-[13vw]"
        />
      </div>
      {/* Il padding orizzontale sta sui due blocchi (griglia e coda) e non sul
          contenitore: sotto lg la coda diventa fixed (left/right 0) e deve
          portarsi dietro i suoi margini da sola. */}
      <div className="relative mx-auto max-w-[1240px] pt-16 sm:pt-20">
        <div ref={gridRef} className="grid gap-12 px-5 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            {/* Logo a colori su chip chiara: leggibile sul footer scuro finché non arriva
                una variante monocromatica chiara dal cliente. */}
            <span className="inline-flex rounded-xl bg-paper px-3.5 py-2.5">
              <Logo light />
            </span>
            {/* Qui sotto c'era il monogramma da solo: due volte lo stesso segno
                a due righe di distanza, perché la chip qui sopra lo porta già
                dentro il logo completo (2026-08-09, direttiva cliente). */}
            <p className="mt-6 max-w-sm font-display text-2xl font-medium leading-snug text-cream">
              Con Domus Tua è facile vendere ed è sicuro acquistare.
            </p>
            {/* §6.3 — il premio va esposto anche nel footer, cioè su OGNI pagina: è l'unica
                prova indipendente che l'agenzia possiede (il 4,9/531 è pur sempre il voto
                dei suoi clienti), e finora viveva solo nel capitolo recensioni della home.
                Chi atterra su una scheda immobile da Google non lo incontrava mai.

                Il sigillo è lo stesso file di StarReviews, `alt=""` perché il testo accanto
                lo dice già — due letture della stessa cosa per chi usa uno screen reader.
                Il fondo qui è espresso e l'SVG è pensato per fondi chiari: sta dentro una
                pastiglia carta, come il logo due righe sopra. */}
            <a
              href={site.award.href}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target mt-6 inline-flex items-center gap-3 text-cream/70 transition-colors duration-300 hover:text-cream"
            >
              {/* Misure ESPLICITE sulla scatola, non solo sugli attributi dell'immagine.
                  L'SVG è `unoptimized` e risolve dopo il primo paint: senza un'altezza
                  fissata, la colonna del footer cresceva di 1px al suo arrivo — e il
                  footer, qui, non è un blocco qualunque. La sua altezza è scritta in
                  `--dt-footer-h`, su cui poggia tutto l'uncover del desktop: un pixel di
                  scarto e la cornice scopre un pixel di troppo. L'ha visto l'e2e. */}
              <span className="inline-flex h-[62px] w-[102px] shrink-0 items-center justify-center rounded-lg bg-paper">
                <Image
                  src="/badges/wikicasa-top-agency.svg"
                  alt=""
                  width={78}
                  height={38}
                  unoptimized
                  className="block h-[38px] w-[78px]"
                />
              </span>
              <span className="leading-tight">
                <span className="block text-[0.8rem] font-semibold text-cream">
                  {site.award.label}
                </span>{" "}
                <span className="link-draw block text-[0.75rem]">
                  {site.award.years.join(" · ")}
                </span>
              </span>
            </a>
            <div className="tap-list mt-7 flex flex-col gap-3 text-sm text-cream/70">
              <a href={site.phone.href} className="tap-target flex items-center gap-3 hover:text-cream">
                <Phone className="h-4 w-4 text-red-soft" /> {site.phone.label}
              </a>
              <a
                href={site.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target flex items-center gap-3 hover:text-cream"
              >
                <Whatsapp className="h-4 w-4 text-red-soft" /> {site.whatsapp.label}
              </a>
              <a href={site.email.href} className="tap-target flex items-center gap-3 hover:text-cream">
                <Mail className="h-4 w-4 text-red-soft" /> {site.email.label}
              </a>
              <span className="flex items-start gap-3">
                <Pin className="mt-0.5 h-4 w-4 shrink-0 text-red-soft" />
                {site.address.street}, {site.address.city} ({site.address.province})
              </span>
            </div>

            {/* Social — icone con tooltip elastico (§CTA SYSTEM) */}
            <SocialLinks tone="dark" className="mt-7" />
          </div>

          {/* Nav */}
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream/75">
              {d.footer.naviga}
            </p>
            <ul className="tap-list mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
              {nav.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    className="link-draw tap-target text-sm text-cream/70 transition-colors duration-300 hover:text-cream"
                  >
                    {d.nav[n.key]}
                  </a>
                </li>
              ))}
              {/* Domus D.O.C. — asset proprietario (nome-brand, invariato tra le lingue).
                  Punta alla sezione protocollo in homepage; discoverabile da ogni pagina. */}
              <li>
                <Link
                  href="/#domus-doc"
                  className="link-draw tap-target text-sm text-cream/70 transition-colors duration-300 hover:text-cream"
                >
                  Domus D.O.C.
                </Link>
              </li>
              {/* "Domande frequenti" vive qui e non in `nav`: è un link di
                  supporto, non una destinazione primaria. La barra desktop ora
                  porta nove voci ("Servizi" aggiunta il 2026-08-13): misurate a
                  1280px stanno in 780px, senza andare a capo — ma la FAQ resta
                  comunque qui, ed è già linkata dai blocchi in coda a /vendi e
                  /acquista. */}
              <li>
                <Link
                  href="/domande-frequenti"
                  className="link-draw tap-target text-sm text-cream/70 transition-colors duration-300 hover:text-cream"
                >
                  {d.footer.faq}
                </Link>
              </li>
              {/* Le case vendute. La pagina esiste, sta nel sitemap ed è la sola prova
                  di RISULTATO che il sito possiede — «nessun concorrente della zona la
                  ha», dice il documento — ma la trovava solo chi passava da /vendi e
                  arrivava in fondo. Un ingresso stabile da ogni pagina, qui e non nella
                  barra: il menu porta già dieci voci, e questa è una prova da cercare,
                  non una destinazione primaria (stesso criterio della FAQ, sopra). */}
              <li>
                <Link
                  href="/case-vendute"
                  className="link-draw tap-target text-sm text-cream/70 transition-colors duration-300 hover:text-cream"
                >
                  {d.footer.caseVendute}
                </Link>
              </li>
            </ul>
          </div>

          {/* Orari */}
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cream/75">
              {d.footer.orari}
            </p>
            <ul className="mt-5 flex flex-col gap-2 text-sm text-cream/70">
              <li className="flex justify-between gap-4">
                <span>{d.footer.monFri}</span>
                <span className="tnum text-cream">{site.hours.weekdays}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>{d.footer.sat}</span>
                <span className="tnum text-cream">{site.hours.saturday}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>{d.footer.sun}</span>
                {/* /70: /50 su graphite scende sotto il 4.5:1 AA (è contenuto, non decorazione) */}
                <span className="text-cream/70">{d.footer.onAppt}</span>
              </li>
            </ul>
            {/* /#contatti (non #contatti): su /privacy e /cookie non esiste
                l'ancora locale e la CTA sarebbe un link morto. */}
            <Cta href="/valutazione-immobile-tradate" variant="reveal-cream" size="sm" className="mt-6">
              {d.footer.valuta}
            </Cta>
          </div>
        </div>

        {/* La CODA: wordmark + riga legale. Sotto lg è la parte fissa
            dell'uncover parziale, dentro la cornice che la ritaglia (vedi il
            commento in cima). Il margine sta sulla cornice e non sul wordmark:
            un margine dentro un box fixed non collassa e sposterebbe la coda. */}
        <div ref={frameRef} data-footer-tail-frame className="mt-16">
          <div
            ref={tailRef}
            data-footer-tail
            className="mx-auto max-w-[1240px] px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-8 sm:pb-20"
          >
            {/* pb extra sotto sm: lascia spazio alla MobileActionBar fissa
                (~64px + safe-area) così l'ultima riga legale non finisce mai
                sotto la barra d'azione mobile — anche quando la coda è fixed
                (il padding viaggia con lei). */}
            {/* Wordmark gigante — filigrana di chiusura, sale dalla maschera
                durante l'uncover, a ogni larghezza. Decorativo: il nome vero
                vive nel logo e nei metadata.
                "Tua" in rosso come nel logo (2026-08-09, direttiva cliente): il
                filo di marca è quello, e ripeterlo anche in filigrana costa una
                parola. L'opacità NON è la stessa delle due metà — il crema al 10%
                e il rosso al 10% non pesano uguale sul graphite, e la filigrana
                leggerebbe come un errore di stampa invece che come il logo. */}
            <div aria-hidden className="select-none overflow-hidden">
              <div
                ref={wordmarkRef}
                data-footer-wordmark
                className="whitespace-nowrap font-display font-medium italic leading-[0.85] tracking-tight text-cream/[0.1]"
                style={{ fontSize: "clamp(4.5rem, 13.5vw, 13rem)" }}
              >
                Domus <span className="text-red/30">Tua</span>
              </div>
            </div>

            <div
              ref={legalRef}
              data-footer-legal
              className="mt-10 flex flex-col gap-4 border-t border-cream/20 pt-7 text-[0.78rem] text-cream/65 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="tnum">
                © {new Date().getFullYear()} {site.legal} · P.IVA {site.vat} · REA {site.rea} · Cap. € {site.capital} i.v.
              </p>
              <div className="flex gap-5">
                <a href="/privacy" className="link-underline tap-target hover:text-cream">{d.footer.privacy}</a>
                <a href="/cookie" className="link-underline tap-target hover:text-cream">{d.footer.cookie}</a>
                {/* Riapre il banner: la revoca del consenso è sempre a un clic (diritto GDPR). */}
                <button
                  type="button"
                  onClick={() => reopenConsent()}
                  className="link-underline tap-target text-left hover:text-cream"
                >
                  {d.footer.cookiePrefs}
                </button>
                <a href="/contatti" className="link-underline tap-target hover:text-cream">{d.footer.contatti}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
