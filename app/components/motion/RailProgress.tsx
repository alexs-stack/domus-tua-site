"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   RAILPROGRESS — l'invito dei nastri touch.

   PERCHÉ ESISTE. Sotto i 1024 i due nastri del sito (.dt-rail di
   HorizontalRail e .dt-socialrail di Social) sono uno scroll orizzontale
   NATIVO: comanda il dito, ed è la scelta giusta — pilotare una fila
   orizzontale dallo scroll verticale toglierebbe alla gente il gesto che si
   aspetta. Ma entrambi nascondono la barra nativa (`scrollbar-width: none`),
   e una fila che esce dal bordo destro senza barra non dice a nessuno che c'è
   dell'altro fuori campo. Il gesto c'era, mancava l'invito.

   E DA «PARITÀ MOBILE 2» (scheda 20) FA UN SECONDO MESTIERE. Il nastro
   desktop ha due piani: il track che scorre e, dentro ogni cornice, il media
   che pana in senso contrario di una quota per tessera (`data-depth`) — sono
   le due velocità a fare la profondità. Sotto i 1024 il primo piano ce l'ha
   già il dito, il secondo mancava del tutto. Adesso la stessa frazione 0→1
   che muove il pallino viene scritta anche sullo scroller, e il CSS la
   trasforma nello stesso `translateX` per pan: stesso effetto del desktop,
   parametri (la corsa) dettati dal dito invece che dallo scroll verticale.

   NON È COREOGRAFIA, ED È DELIBERATO. Niente GSAP, niente ScrollTrigger,
   niente rAF: il dito è già la sorgente del tempo, e ricamparlo sarebbe
   lavoro in più sul thread principale per dire esattamente la stessa cosa.
   Un listener `scroll` passivo scrive una custom property, il pallino si
   sposta di solo transform. Per la stessa ragione resta acceso sotto
   reduced-motion: un indicatore di posizione non è un'animazione, è una
   barra di scorrimento — spegnerlo toglierebbe informazione a chi ha chiesto
   meno movimento, non movimento.

   DOVE NON ESISTE. Da 1024 in su il nastro è pilotato da GSAP e non ha nulla
   fuori campo da dichiarare. Con JS spento non esiste affatto: la pagina
   resta completa senza, perché è un'affordance dello scroll, non contenuto.
   Ed è `aria-hidden`, perché duplica in figura un'informazione che la
   posizione di scroll già porta con sé: a chi legge a schermo letto sarebbe
   solo rumore.

   `pointer-events-none` non è uno scrupolo: su Social l'indicatore sta in
   sovrimpressione sulla fascia bassa della rotaia, che è ancora area di
   scorrimento. Due pixel che rubassero il dito sarebbero due pixel in cui il
   nastro non si trascina — cioè l'esatto contrario del suo mestiere.

   E UNA COSA DA NON FARE MAI DA QUI: "accendere" il nastro mettendogli
   [data-on] sotto i 1024. `.dt-rail[data-on]` e `.dt-socialrail[data-on]`
   (globals.css) mettono `overflow: hidden; scroll-snap-type: none` e
   spegnerebbero insieme il trascinamento e lo snap che questo indicatore
   serve ad annunciare.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, type RefObject } from "react";
import { MQ } from "../../lib/motion/gsap";

export default function RailProgress({
  scroller,
  className = "",
}: {
  /** il contenitore che scorre davvero (.dt-rail / .dt-socialrail) */
  scroller: RefObject<HTMLElement | null>;
  /** posizionamento e aria al sito di chiamata: quanto spazio ci sia sotto un
      nastro lo sa solo quel nastro (Social ne ha già in cassa, il corridoio no) */
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [touchRail, setTouchRail] = useState(false);

  // `change` e non una lettura sola: quattro gate del sito leggevano .matches
  // una volta e buttavano via la MediaQueryList, e un tablet ruotato restava
  // con la geometria dell'altro ramo finché non ricaricava (§2.2 del dossier
  // di parità). Qui il prezzo dell'errore sarebbe un indicatore appeso sotto
  // un nastro che ormai è di GSAP.
  useEffect(() => {
    const mql = window.matchMedia(MQ.belowLg);
    const sync = () => setTouchRail(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    const host = hostRef.current;
    if (!touchRail || !el || !host) return;

    // `flat` = il nastro ci sta tutto, non c'è niente da annunciare. Tenuto
    // in chiusura e non in stato React: cambia solo a una rotazione, e uno
    // setState dentro un handler di scroll sarebbe un render per fotogramma.
    let flat: boolean | null = null;
    // `room` MISURATA FUORI DALLO SCROLL, ed è la differenza fra un indicatore
    // gratuito e uno che costa. `scrollWidth`/`clientWidth` su un contenitore
    // con overflow forzano un layout sincrono ogni volta che qualcosa a monte
    // è sporco: leggerle nell'handler significherebbe un layout forzato per
    // OGNI evento di scroll, sul thread principale, mentre il dito trascina —
    // cioè esattamente dove un telefono non ha margine. La corsa del nastro
    // cambia solo quando cambia la larghezza, e quello lo sa già `onResize`.
    let room = 0;
    const measure = () => {
      room = el.scrollWidth - el.clientWidth;
      const still = room <= 1;
      if (still !== flat) {
        flat = still;
        host.toggleAttribute("data-flat", still);
      }
    };
    // Nell'handler resta una sola lettura, ed è l'unica che cambia davvero.
    // La frazione si scrive in DUE posti, e il secondo è il pan del nastro
    // («parità mobile 2», scheda 20): sull'host, dove muove il pallino, e
    // sullo SCROLLER, da cui i `.dt-rail_pan`/`.dt-socialrail_pan` la
    // ereditano per panare la foto dentro la cornice in senso contrario alla
    // corsa — il secondo piano che da 1024 in su fa GSAP e che sotto non
    // c'era. È una `setProperty` in più su un evento già in ascolto: niente
    // ScrollTrigger, niente rAF, niente will-change (l'alleggerimento
    // nominato è proprio questo — il pan mobile non porta con sé un trigger).
    const write = () => {
      const still = room <= 1;
      const p = still ? 0 : el.scrollLeft / room;
      host.style.setProperty("--rail-p", `${p}`);
      // A nastro fermo (ci sta tutto, `data-flat`) il pallino va a inizio
      // pista — ma il pan no: senza corsa non c'è parallasse, e 0 lo
      // lascerebbe scentrato di `depth` per sempre. .5 è il riposo.
      el.style.setProperty("--rail-p", still ? "0.5" : `${p}`);
    };
    measure();
    write();
    el.addEventListener("scroll", write, { passive: true });

    // Il resize su un telefono è una tempesta: la barra URL che compare e
    // scompare ne spara uno a ogni gesto — e quelli cambiano l'ALTEZZA, mai
    // la larghezza. Rileggere la geometria a ogni colpo sarebbe layout letto
    // per niente, quindi si riscrive solo quando la larghezza cambia davvero
    // (rotazione), che è l'unico caso in cui la corsa del nastro cambia.
    let w = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      measure();
      write();
    };
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", write);
      window.removeEventListener("resize", onResize);
      // Ruotando a landscape ≥1024 il nastro passa a GSAP, che scrive
      // `xPercent` inline sugli stessi pan: la frazione va tolta o resterebbe
      // ferma l'ultima posizione del dito sotto il tween nuovo.
      el.style.removeProperty("--rail-p");
    };
  }, [touchRail, scroller]);

  // Nessun `return null`: montarlo dopo il primo paint aggiungerebbe la sua
  // altezza a pagina già dipinta, cioè uno spostamento di layout misurabile
  // (CLS) su ogni rotta che porta un nastro. La scatola c'è sempre e a
  // cambiare è solo se si vede — `aria-hidden` perché duplica un'informazione
  // che la posizione dello scroll porta già con sé.
  return (
    <div
      ref={hostRef}
      aria-hidden
      // `invisible` e non `hidden`: la scatola resta prenotata, quindi passare
      // da invisibile a visibile all'idratazione non sposta una riga. Con JS
      // spento `touchRail` non diventa mai vero e la pista non compare — un
      // indicatore di posizione senza nessuno che lo aggiorni sarebbe un
      // ornamento che mente. Da lg in su comanda GSAP e l'indicatore non serve.
      className={`pointer-events-none mx-auto h-[2px] w-16 overflow-hidden rounded-full bg-ink/15 transition-opacity duration-500 data-[flat]:opacity-0 motion-reduce:transition-none lg:invisible ${
        touchRail ? "" : "invisible"
      } ${className}`}
    >
      {/* Il pallino è UN TERZO della pista, quindi la sua corsa vale esattamente
          due volte la propria larghezza: la posizione si scrive in percentuale
          di sé stesso e nessuno deve conoscere una misura in pixel — né il JS,
          che scrive solo la frazione 0→1, né questa classe. */}
      <span className="block h-full w-1/3 translate-x-[calc(var(--rail-p,0)*200%)] rounded-full bg-red" />
    </div>
  );
}
