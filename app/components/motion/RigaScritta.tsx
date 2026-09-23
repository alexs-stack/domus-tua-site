"use client";

// LA RIGA CHE SI SCRIVE (A80 di Alberto, 23 set. 2026: «ingegnati e stupiscimi cambiando il design dell'input
// della ricerca»). La prima volta che il campo della ricerca di /acquista entra nello schermo, l'esempio del
// segnaposto si scrive da solo, una volta, da sinistra a destra, dietro un cursore rosso; poi il cursore si
// spegne e resta il segnaposto nativo, lo stesso testo con le stesse misure. Una passata sola, al più ~3,3 s
// (sotto i 5 s di WCAG 2.2.2), mai in loop, mai lampeggiante.
//
// Com'è fatto:
// - il sovrapposto (`.dt-ricerca_esempio`, aria-hidden) sta sempre nell'HTML del server ma è `display: none`
//   finché il campo non porta `data-scrive`: senza JS, con reduced-motion o a campo non armato il segnaposto
//   nativo è lo stato fermo, completo;
// - si arma al montaggio solo se il campo è vuoto, senza fuoco e ancora sotto la linea dell'85 % (una ricarica
//   a metà pagina, `?q=` o un salto a #case non scrivono niente); armato, il segnaposto nativo è trasparente e il
//   sovrapposto è ritagliato a zero, così chi arriva vede il campo vuoto e poi la frase che si scrive;
// - si ferma — e torna subito il segnaposto nativo — al fuoco, a una lettera scritta, a un autofill (CSS `:has`)
//   o quando la pagina riempie il campo (`fermo`); e se lo scroll salta oltre il campo senza farlo partire;
// - anima solo clip-path, transform (xPercent) e opacity; nessuna libreria nuova.
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../../lib/motion/gsap";

export default function RigaScritta({ testo, fermo }: { testo: string; fermo: boolean }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const ferma = useRef<() => void>(() => {});

  useGSAP(
    () => {
      const esempio = ref.current;
      const campo = esempio?.parentElement;
      const input = campo?.querySelector<HTMLInputElement>("input");
      const scritto = esempio?.querySelector<HTMLElement>(".dt-ricerca_testo");
      const cursore = esempio?.querySelector<HTMLElement>(".dt-ricerca_cursore");
      if (!campo || !input || !scritto || !cursore) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        if (input.value || document.activeElement === input || campo.getBoundingClientRect().top < window.innerHeight * 0.85) return;
        campo.dataset.scrive = "";
        let tl: gsap.core.Timeline | null = null;
        const fine = () => {
          delete campo.dataset.scrive;
        };
        const scrivi = () => {
          // La durata si misura adesso, sul testo reso: da lg il segnaposto lungo arriva dopo l'idratazione.
          const d = gsap.utils.clamp(0.9, 1.8, (scritto.textContent ?? "").length * 0.032);
          tl = gsap.timeline({ delay: 0.5, onComplete: fine });
          tl.fromTo(scritto, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: d, ease: "power1.inOut" }, 0)
            .fromTo(cursore, { xPercent: -100, opacity: 1 }, { xPercent: 0, duration: d, ease: "power1.inOut" }, 0)
            .to(cursore, { opacity: 0, duration: 0.4, ease: "power2.in" }, d + 0.5);
        };
        const st = ScrollTrigger.create({
          trigger: campo,
          start: "top 85%",
          once: true,
          onEnter: scrivi,
          // Saltato oltre senza partire (un'ancora, uno scroll a strappo): niente campo vuoto, torna il segnaposto.
          onLeave: () => {
            if (!tl) fine();
          },
        });
        const stop = () => {
          tl?.kill();
          st.kill();
          fine();
        };
        input.addEventListener("focus", stop);
        input.addEventListener("input", stop);
        ferma.current = stop;
        return () => {
          input.removeEventListener("focus", stop);
          input.removeEventListener("input", stop);
          stop();
          gsap.set([scritto, cursore], { clearProps: "all" });
          ferma.current = () => {};
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  useEffect(() => {
    if (fermo) ferma.current();
  }, [fermo]);

  return (
    <span ref={ref} aria-hidden className="dt-ricerca_esempio">
      <span className="dt-ricerca_scritto">
        <span className="dt-ricerca_testo">{testo}</span>
        <span className="dt-ricerca_cursore" />
      </span>
    </span>
  );
}
