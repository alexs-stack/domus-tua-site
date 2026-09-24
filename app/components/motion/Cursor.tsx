"use client";

// ═══════════════════════════════════════════════════════════════════════════
// LA TARGHETTA — il cursore d'intento.
//
// Prima qui c'era il cerchio: un anello di 40px in mix-blend-difference che
// seguiva il puntatore ovunque con mezzo secondo di ritardo, più un punto
// rosso. È l'effetto più copiato del web e su questo sito non diceva niente:
// stava addosso al puntatore anche mentre si leggeva un paragrafo, dove non
// c'era nessun gesto da annunciare. Il cliente l'ha chiamato orribile e
// aveva ragione (2026-08-26).
//
// La regola nuova è una sola: IL CURSORE NATIVO RESTA. Il novantacinque per
// cento del tempo si naviga con la freccia del sistema — nessun anello,
// nessun ritardo, nessun blend. Il segno custom compare SOLO dove c'è
// davvero un gesto da dichiarare, cioè sugli elementi che portano
// `data-cursor`: le schede immobile e le tessere servizi («Scopri»), il
// nastro orizzontale e il confronto prima/dopo («Trascina»), i video («play»).
//
// E quando compare non è un cerchio: è una TARGHETTA. La targhetta
// dell'agenzia — crema, angoli tondi, il tetto rosso del monogramma davanti
// alla parola, un'ombra corta che la stacca dalla foto. Si porta dietro
// l'inclinazione del movimento (come un cartoncino tenuto in mano) e si
// schiaccia sul click. Fuori da quegli elementi non esiste proprio.
//
// Gating invariato: solo `pointer: fine` + motion ok (gsap.matchMedia). Su
// touch non esiste e niente lo presuppone. `cursor: none` è SCOPED ai soli
// bersagli (globals.css, sotto html.dt-cursor-active): fuori di lì il
// puntatore di sistema non viene mai tolto — se questo file smettesse di
// montare, il sito resterebbe navigabile com'è.
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";
import { useDict } from "../i18n/LocaleProvider";

export default function Cursor() {
  const d = useDict();
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Etichette tradotte lette via ref: i listener (registrati una volta nel
  // matchMedia) vedono sempre la lingua corrente senza ri-registrarsi.
  // Aggiornata in un effetto (mai durante il render): i lettori sono handler
  // di eventi, quindi girano sempre dopo il commit.
  const labelsRef = useRef<Record<string, string>>({});
  useEffect(() => {
    labelsRef.current = {
      scopri: d.cursor.scopri,
      trascina: `◂ ${d.cursor.trascina} ▸`,
      play: "",
    };
  }, [d]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const plate = root.querySelector<HTMLElement>("[data-cur-plate]");
      const label = root.querySelector<HTMLElement>("[data-cur-label]");
      const roof = root.querySelector<HTMLElement>("[data-cur-roof]");
      const play = root.querySelector<HTMLElement>("[data-cur-play]");
      if (!plate || !label || !roof || !play) return;

      const mm = gsap.matchMedia();
      mm.add(`${MQ.motionOk} and ${MQ.finePointer}`, () => {
        const html = document.documentElement;
        html.classList.add("dt-cursor-active");

        gsap.set(plate, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.6 });

        // Inseguimento CORTO (0.22s): il ritardo lungo del vecchio anello era
        // metà del problema — una targhetta che arriva in ritardo sembra
        // scollata dalla mano. Qui accompagna, non insegue.
        const toX = gsap.quickTo(plate, "x", { duration: 0.22, ease: "power3.out" });
        const toY = gsap.quickTo(plate, "y", { duration: 0.22, ease: "power3.out" });
        // L'inclinazione è l'unica cosa che resta "morbida": è lei a dare il
        // peso del cartoncino.
        const toRot = gsap.quickTo(plate, "rotation", { duration: 0.5, ease: "power2.out" });

        let lastX: number | null = null;
        let shown = false;

        const onMove = (e: PointerEvent) => {
          toX(e.clientX);
          toY(e.clientY);
          // Inclinazione dalla velocità orizzontale, con un tetto stretto:
          // sopra gli 8 gradi non è più un cartoncino, è una giostra.
          if (shown) {
            const dx = lastX === null ? 0 : e.clientX - lastX;
            toRot(gsap.utils.clamp(-8, 8, dx * 0.45));
          }
          lastX = e.clientX;
        };

        // Un solo owner delle transizioni della targhetta (overwrite "auto" su
        // ogni tween) + dedup su (stato, testo): pointerover scatta a ogni
        // attraversamento di confine, ma i tween partono solo quando qualcosa
        // cambia davvero — niente churn sul percorso caldo.
        let current = "";

        const show = (text: string, isPlay: boolean) => {
          label.textContent = isPlay ? "" : text;
          gsap.set(label, { display: isPlay ? "none" : "block" });
          gsap.set(roof, { display: isPlay || !text ? "none" : "block" });
          gsap.set(play, { display: isPlay ? "block" : "none" });
          if (shown) return; // già in scena: cambia solo il contenuto
          shown = true;
          gsap.to(plate, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.34,
            ease: "domus",
            overwrite: "auto",
          });
        };

        const hide = () => {
          if (!shown) return;
          shown = false;
          gsap.to(plate, {
            autoAlpha: 0,
            scale: 0.72,
            rotation: 0,
            duration: 0.2,
            ease: "power2.out",
            overwrite: "auto",
          });
        };

        const resolve = (target: Element | null) => {
          const tagged = (target as HTMLElement | null)?.closest?.<HTMLElement>("[data-cursor]");
          // Campi e widget di terzi non vengono mai coperti, nemmeno se
          // stanno dentro un bersaglio.
          const inField = (target as HTMLElement | null)?.closest?.(
            "input, textarea, select, [contenteditable='true'], iframe"
          );
          if (!tagged || inField) {
            current = "";
            hide();
            return;
          }
          const kind = tagged.dataset.cursor || "scopri";
          const isPlay = kind === "play";
          const text = isPlay
            ? ""
            : tagged.dataset.cursorLabel ?? labelsRef.current[kind] ?? labelsRef.current.scopri;
          const key = `${kind}:${text}`;
          if (key === current) return;
          current = key;
          show(text, isPlay);
        };

        const onOver = (e: PointerEvent) => resolve(e.target as Element);
        const onDown = () => {
          if (shown) gsap.to(plate, { scale: 0.9, duration: 0.14, ease: "power2.out" });
        };
        const onUp = () => {
          if (shown) gsap.to(plate, { scale: 1, duration: 0.24, ease: "domus" });
        };
        const onLeaveDoc = () => {
          current = "";
          hide();
        };

        // UNA NAVIGAZIONE PORTA VIA LA TARGHETTA. La targhetta sta a z-120,
        // il sipario delle transizioni a z-92 (PageTransition.tsx): senza
        // questo, cliccare una scheda immobile lasciava «Scopri» a
        // galleggiare sopra la porta chiusa per tutto il cambio pagina, e poi
        // sopra la pagina nuova finché il puntatore non attraversava un
        // confine (`pointerover` non riscatta da solo se il mouse sta fermo
        // mentre il DOM sotto viene sostituito).
        // Un click su un link dentro un bersaglio è sempre una navigazione:
        // le schede sono link, il nastro e il confronto prima/dopo no.
        const onClick = (e: MouseEvent) => {
          if ((e.target as Element | null)?.closest?.("a[href]")) onLeaveDoc();
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerover", onOver, { passive: true });
        window.addEventListener("pointerdown", onDown, { passive: true });
        window.addEventListener("pointerup", onUp, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeaveDoc);
        document.addEventListener("click", onClick, true);
        // Cambio di scheda o di finestra: il puntatore se ne va senza
        // attraversare il bordo del documento.
        window.addEventListener("blur", onLeaveDoc);

        return () => {
          html.classList.remove("dt-cursor-active");
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerover", onOver);
          window.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointerup", onUp);
          document.documentElement.removeEventListener("pointerleave", onLeaveDoc);
          document.removeEventListener("click", onClick, true);
          window.removeEventListener("blur", onLeaveDoc);
        };
      });
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[120]">
      {/* La targhetta: crema, testo grafite, tetto rosso. Nessun blend mode —
          il vecchio anello viveva in `difference` per restare leggibile sulle
          foto; una targhetta piena con la sua ombra è leggibile e basta, e
          soprattutto non inverte i colori del brand. */}
      <div
        data-cur-plate
        className="fixed left-0 top-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-graphite/12 bg-cream px-3 py-1.5 opacity-0 shadow-[0_8px_24px_-10px_rgba(26,24,22,0.55)]"
      >
        {/* Il tetto del monogramma, in rosso: la firma Domus Tua in 12px.
            Non è il logo ridisegnato — è la linea-tetto già usata come segno
            di marca (SegnoTick in BrandMotif). */}
        <svg
          data-cur-roof
          viewBox="0 0 24 24"
          fill="none"
          className="h-2.5 w-2.5 shrink-0 text-red"
        >
          <path
            d="M4 15 L12 7 L20 15"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          data-cur-label
          className="text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-graphite"
        />
        <svg
          data-cur-play
          viewBox="0 0 24 24"
          className="hidden h-3 w-3 text-red"
          fill="currentColor"
        >
          <path d="M8 5.5v13l11-6.5-11-6.5Z" />
        </svg>
      </div>
    </div>
  );
}
