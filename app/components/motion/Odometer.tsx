"use client";

// Odometer — il numero "rulla" cifra per cifra dentro colonne mascherate,
// al posto dello snap testuale di CountUp. Il render SSR/no-JS è il numero
// FINALE come testo semplice (mai 0, SEO-safe): le colonne vengono costruite
// solo post-idratazione dentro matchMedia(motionOk); con reduced-motion il
// testo resta statico e completo.
import { useRef } from "react";
import { gsap, useGSAP, MQ, dur, stagger } from "../../lib/motion/gsap";

type Props = {
  value: number;
  className?: string;
  /** Raggruppa le migliaia (es. 269395 → "269.395"). Stessa semantica di CountUp. */
  group?: boolean;
  /** Locale BCP-47 per il raggruppamento (es. "it-IT"). Usato solo se group=true. */
  locale?: string;
};

export default function Odometer({
  value,
  className = "",
  group = false,
  locale,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const formatted = group ? value.toLocaleString(locale) : String(value);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        // Ricostruzione post-idratazione: numero completo in sr-only per gli
        // screen reader, colonne visuali aria-hidden. Fino a qui vive il testo SSR.
        el.textContent = "";
        const sr = document.createElement("span");
        sr.className = "sr-only";
        sr.textContent = formatted;
        el.appendChild(sr);

        const visual = document.createElement("span");
        visual.setAttribute("aria-hidden", "true");
        el.appendChild(visual);

        const cols: HTMLSpanElement[] = [];
        const finals: number[] = [];
        for (const ch of formatted) {
          if (/^[0-9]$/.test(ch)) {
            // Finestra alta 1em con align-text-bottom: coincide con l'em-box del
            // testo circostante e, grazie a tnum, l'inline-block si stringe
            // esattamente alla larghezza della cifra → zero CLS.
            const win = document.createElement("span");
            win.className =
              "inline-block h-[1em] overflow-hidden align-text-bottom";
            const col = document.createElement("span");
            col.className = "block";
            for (let d = 0; d <= 9; d++) {
              const row = document.createElement("span");
              row.className = "block h-[1em] leading-none";
              row.textContent = String(d);
              col.appendChild(row);
            }
            win.appendChild(col);
            visual.appendChild(win);
            cols.push(col);
            finals.push(Number(ch));
          } else {
            // Separatori (punti, spazi) statici inline.
            visual.appendChild(document.createTextNode(ch));
          }
        }

        // Ogni riga è il 10% dell'altezza della colonna: yPercent -d*10 mostra
        // la cifra d. Stagger dalle unità verso sinistra (from: "end").
        gsap.set(cols, { yPercent: 0 });
        // Replay a ogni passaggio: restart all'ingresso, reset ISTANTANEO
        // risalendo oltre l'inizio (le cifre che rullano all'indietro sono
        // solo rumore).
        const tween = gsap.to(cols, {
          yPercent: (i: number) => -finals[i] * 10,
          duration: dur.hero,
          ease: "domus",
          stagger: { each: stagger.chars, from: "end" },
          scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "restart none none reset" },
          onStart() {
            gsap.set(cols, { willChange: "transform" });
          },
          onComplete() {
            // Le colonne restano (nessun revert), ma niente will-change residuo.
            gsap.set(cols, { clearProps: "willChange" });
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          // Se la media query si inverte (reduced-motion attivato a runtime)
          // si torna al numero completo come testo semplice.
          el.textContent = formatted;
        };
      });
    },
    { scope: ref, dependencies: [formatted] }
  );

  // key: al cambio locale/valore il nodo va RIMONTATO — la ricostruzione
  // imperativa stacca il text node originale (stesso motivo di TextLines).
  return (
    <span key={formatted} ref={ref} className={`tnum ${className}`}>
      {formatted}
    </span>
  );
}
