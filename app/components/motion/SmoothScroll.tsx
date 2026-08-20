"use client";

// SmoothScroll — monta Lenis sul window e lo sincronizza con ScrollTrigger.
// Non wrappa i children (zero impatto su SSR/hydration): è un mount, come Grain.
// - Attivo solo con prefers-reduced-motion: no-preference (live: reagisce al cambio).
// - Il touch resta nativo (smoothWheel only) → mobile senza scroll-hijacking.
// - anchors: true → i link #ancora scorrono con Lenis rispettando scroll-margin-top.
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, MQ } from "../../lib/motion/gsap";

// Il sipario dell'intro. Lo mette l'inline script del layout PRIMA del primo
// paint e lo toglie chi arriva per primo fra: finish() del Preloader, il
// failsafe del boot script, il failsafe riarmato in abort. Finché è su <html>
// la pagina è ferma due volte — `html[data-preloader]{overflow:hidden}`
// (globals.css:1580) e Lenis fermo — e le due serrature NON si aprono con la
// stessa chiave: la prima cade insieme all'attributo, la seconda no. È da
// quell'asimmetria che nasce tutto ciò che è scritto sopra `watchCurtain`.
const CURTAIN = "data-preloader";

let activeLenis: Lenis | null = null;

/** Lenis attivo (null con reduced-motion o prima del mount). */
export function getLenis(): Lenis | null {
  return activeLenis;
}

export default function SmoothScroll() {
  useEffect(() => {
    const html = document.documentElement;
    const media = window.matchMedia(MQ.motionOk);
    let lenis: Lenis | null = null;
    let onTick: ((time: number) => void) | null = null;
    let curtainWatch: MutationObserver | null = null;

    // Il rilascio: le stesse due righe che Preloader.finish() esegue in coda
    // all'intro. Vivono ANCHE qui perché devono poter avvenire quando finish()
    // non viene chiamato mai (vedi sotto). `start()` di Lenis esce subito se non
    // era fermo, quindi eseguirlo due volte — una da finish(), una da qui — non
    // costa nulla: è voluto, non una svista.
    const release = () => {
      curtainWatch?.disconnect();
      curtainWatch = null;
      gsap.ticker.lagSmoothing(0);
      lenis?.start();
    };

    // ─── LA RETE, E PERCHÉ NON È RUMORE DIFENSIVO ──────────────────────────
    // Difetto misurato, docs/mobile-parity.md §5.3. Fino a oggi l'unico a
    // rimettere Lenis in moto era finish() dentro Preloader.tsx. Ma l'attributo
    // può cadere per mano di qualcun altro, e ci sono due strade reali in cui
    // finish() non gira mai:
    //
    //   1. il failsafe dello script di boot (app/layout.tsx) toglie l'attributo
    //      e basta — non sa che Lenis esiste;
    //   2. il Preloader idrata DOPO che quel failsafe è scattato (dal
    //      2026-08-17 non è più un chunk `ssr:false` ma viaggia col layout:
    //      resta possibile su un thread bloccato): il suo useGSAP trova <html>
    //      già pulito, esce alla prima riga e a finish() non ci arriva mai.
    //
    // In entrambi i casi Lenis resta fermo. E "fermo" non vuol dire "più lento":
    // `lenis.stop()` scrive `lenis-stopped` su <html>, che globals.css:164-166
    // traduce in `overflow: hidden`. Misurato su un telefono, è un viewport
    // murato: la pagina si vede finita, non scorre, e l'utente non ha un gesto
    // per uscirne — solo il ricaricamento. È il modo peggiore di rompersi,
    // perché sembra che il sito sia arrivato.
    //
    // Quando questa rete è stata scritta il telefono era salvo per un
    // accidente: sotto i 768px l'attributo non veniva mai stampato. Dal
    // 2026-08-11 non è più così — lo script di boot (app/layout.tsx) mette
    // `data-preloader` a OGNI larghezza (dal 2026-08-17 con un solo failsafe,
    // PRE_FAILSAFE_MS) — quindi sul telefono, dove la rete è lenta e il JS arriva in
    // ritardo o mai, questa è oggi la via PIÙ PROBABILE per rompere il sito, non
    // un caso di laboratorio. La rete non è più in anticipo su niente: è in
    // servizio.
    //
    // Quindi il contratto si chiude da questo lato. Non "qualcuno si ricorderà
    // di richiamarmi", ma: guardo l'attributo e riparto quando cade, chiunque
    // l'abbia tolto e per qualunque motivo (fine naturale, skip, failsafe,
    // chunk mai atterrato). finish() resta esattamente com'è: è la via veloce e
    // la cintura; questa è la bretella.
    //
    // Due scelte dentro la rete, entrambe deliberate:
    // - NIENTE timer nostro. Sarebbe l'ottavo numero di una famiglia che ne ha
    //   già sette (§5.2), tutti convinti di essere allineati fra loro. La
    //   rimozione dell'attributo è già garantita a monte da tre failsafe: qui
    //   non se ne aggiunge un quarto, si rende quella rimozione SUFFICIENTE.
    // - si osserva il solo `data-preloader` e si legge lo stato vivo, non i
    //   record: altri componenti fermano Lenis per ragioni loro (menu, overlay,
    //   transizioni di pagina) e questa rete non deve mai rimetterlo in moto
    //   sotto di loro.
    const watchCurtain = () => {
      curtainWatch?.disconnect();
      curtainWatch = new MutationObserver(() => {
        // Ancora coperto (un attributo può essere riscritto senza cadere):
        // non si tocca niente.
        if (html.hasAttribute(CURTAIN)) return;
        // Sul percorso normale finish() ha già rilasciato un microtask fa e
        // questo giro è un no-op. Si disconnette da sé: il sipario, in una
        // sessione, cade una volta sola.
        release();
      });
      curtainWatch.observe(html, { attributeFilter: [CURTAIN] });
    };

    const start = () => {
      if (lenis) return;
      lenis = new Lenis({
        lerp: 0.1,
        wheelMultiplier: 1,
        smoothWheel: true,
        anchors: true,
        autoRaf: false,
      });
      activeLenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      onTick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(onTick);
      // Contratto col preloader (che gira in layout effect, PRIMA di questo
      // useEffect): se l'intro sta coprendo, Lenis nasce fermo e il
      // lagSmoothing anti-jank dell'intro non va azzerato — sarà finish()
      // del Preloader a fare start() e lagSmoothing(0).
      //
      // [2026-08-11] Quella riga resta vera come percorso NORMALE, ma non è più
      // l'unica: finish() non è più l'unico a poter rilasciare, ed è bene che
      // non lo sia (vedi `watchCurtain` qui sopra).
      // E se l'attributo è GIÀ caduto quando montiamo — visitatore di ritorno,
      // reduced-motion, o failsafe scattato prima che questo effect girasse —
      // non c'è nessuna mutazione da aspettare e mettersi in ascolto sarebbe
      // un'attesa infinita: si rilascia subito, che è anche il comportamento
      // che questo ramo aveva già.
      if (html.hasAttribute(CURTAIN)) {
        lenis.stop();
        watchCurtain();
      } else {
        release();
      }
    };

    const stop = () => {
      // Prima della guardia: un observer appeso è l'unica cosa che potrebbe
      // sopravvivere a questo componente, e non deve.
      curtainWatch?.disconnect();
      curtainWatch = null;
      if (!lenis) return;
      if (onTick) gsap.ticker.remove(onTick);
      // Con Lenis distrutto non resta nessuna serratura da aprire: `destroy()`
      // ripulisce le classi `lenis-*` da <html>, quindi niente `lenis-stopped`
      // e niente `overflow: hidden`. Il lagSmoothing lo riazzera il prossimo
      // `start()` (o finish(), se l'intro sta ancora girando).
      lenis.destroy();
      lenis = null;
      activeLenis = null;
      onTick = null;
    };

    const sync = () => (media.matches ? start() : stop());
    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return null;
}
