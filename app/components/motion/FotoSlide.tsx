"use client";

// FotoSlide — le foto che scorrono da sole una sopra l'altra (A76 di Alberto, 22 settembre 2026, notte:
// «effetti slide sulle 2 foto della sezione Vendere senza stress … e tra la pineta e Milano. Fare un
// effetto di slide automatico una sopra l'altra, come in era residence», con lo screenshot della galleria
// di era: la foto nuova entra da destra sopra la vecchia con un bordo in diagonale). Vista la prima
// versione: «l'animazione è perfetta», ma «niente frecce, bottoni e numeri, solo l'animazione automatica
// dopo 1 secondo».
//
// Com'è fatta:
// - le foto stanno impilate nella stessa scatola (quella che il nastro apre a sipario: la scatola porta
//   `data-horizon-slide` e la zona foto del segno, la pila porta `data-horizon-slide-img`, così lo zoom
//   d'ingresso di HorizonScroller vale per tutte); la prima è quella di sempre;
// - dopo `SOSTA` secondi la successiva entra con un clip-path a quattro punti: il bordo d'attacco scorre
//   da destra a sinistra inclinato di `PENDENZA` punti (la cima in testa, come nello screenshot), la foto
//   nuova si assesta da 1,12 a 1 e la vecchia scivola indietro di un 8 %: `dtInOut`, l'InOut di Era, in
//   `CORSA` secondi; poi di nuovo, in giro;
// - nessun controllo (Alberto). Il giro si ferma solo dove nessuno lo vede: foto fuori vista
//   (IntersectionObserver) o scheda nascosta; con reduced-motion e senza JS resta la prima foto, ferma.
//   Scelta di Alberto, dichiarata: senza un comando di pausa il giro non soddisfa WCAG 2.2.2.
// Solo transform e clip-path (PRODUCT.md, Performance).
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { gsap } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";

export type Foto = { src: string; alt: string; pos?: string };

/** Secondi di sosta su ogni foto (Alberto: «automatico dopo 1 secondo»), secondi di corsa, punti di pendenza del bordo. */
export const SOSTA = 1;
export const CORSA = 1.4;
export const PENDENZA = 10;

const P = PENDENZA;
/** Il clip della foto che entra da destra: nascosta e intera. */
export const CLIP = {
  da: `polygon(100% 0%, ${100 + P}% 0%, ${100 + P}% 100%, ${100 + P}% 100%)`,
  a: `polygon(${-P}% 0%, ${100 + P}% 0%, ${100 + P}% 100%, 0% 100%)`,
} as const;

/** Una lastra qualsiasi (A77: la facciata di un video di YouTube) al posto di una foto. */
export type Lastra = { key: string; node: ReactNode };

export default function FotoSlide({
  foto,
  lastre: contenuti,
  sizes = "100vw",
  className = "",
  boxClassName,
}: {
  foto?: readonly Foto[];
  /**
   * A77 (Alberto: «fai la stessa cosa anche per questa sezione, con le preview di YouTube»): lastre
   * interattive al posto delle foto. Un clic dentro una lastra ferma il giro su di lei per sempre (chi
   * preme play non deve vedersi coprire il video dalla foto dopo).
   */
  lastre?: readonly Lastra[];
  sizes?: string;
  /** Il contenitore (larghezza e posto nella griglia del chiamante). */
  className?: string;
  /** La scatola delle foto: uno dei tre moduli media del sito, col suo rapporto. */
  boxClassName: string;
}) {
  const voci: readonly Lastra[] =
    contenuti ??
    (foto ?? []).map((f) => ({
      key: f.src,
      node: <Image src={f.src} alt={f.alt} fill sizes={sizes} className="object-cover" style={f.pos ? { objectPosition: f.pos } : undefined} />,
    }));
  const interattive = contenuti !== undefined;
  const n = voci.length;
  const [attivo, setAttivo] = useState(0);
  const pilaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const pila = pilaRef.current;
    if (!pila || n < 2) return;
    const lastre = Array.from(pila.querySelectorAll<HTMLElement>("[data-foto-lastra]"));
    const s = { attivo: 0, fuori: true, fermo: false };
    const mm = gsap.matchMedia();
    // Si anima l'involucro (`data-foto-quadro`), non l'<img>: la facciata di YouTube ha una transizione CSS
    // sulla trasformata del poster (lo zoom al passaggio del mouse) che rincorrerebbe ogni fotogramma di GSAP.
    const quadro = (l: HTMLElement) => l.querySelector<HTMLElement>("[data-foto-quadro]");

    const mostra = (i: number) => {
      lastre.forEach((l, k) => {
        gsap.set(l, { zIndex: k === i ? 1 : 0, visibility: k === i ? "visible" : "hidden", clipPath: "none" });
        const q = quadro(l);
        if (q) gsap.set(q, { scale: 1, xPercent: 0 });
      });
    };

    let aggiorna = () => {};
    let ferma = () => {};
    mm.add(MQ.motionOk, () => {
      let giro: gsap.core.Timeline | null = null;
      ferma = () => {
        giro?.kill();
        giro = null;
      };
      const avanti = () => {
        if (s.fermo) return;
        const da = s.attivo;
        const a = (da + 1) % n;
        const vecchia = lastre[da];
        const nuova = lastre[a];
        lastre.forEach((l, k) => {
          if (k !== da && k !== a) gsap.set(l, { visibility: "hidden", zIndex: 0 });
        });
        // La sosta è il primo secondo della timeline (non un `delay`): fuori vista si ferma e riprende dove era.
        giro = gsap
          .timeline({
            paused: true,
            defaults: { duration: CORSA, ease: "dtInOut" },
            onComplete: () => {
              mostra(a);
              s.attivo = a;
              setAttivo(a);
              avanti();
            },
          })
          .call(
            () => {
              gsap.set(vecchia, { zIndex: 1, visibility: "visible", clipPath: "none" });
              gsap.set(nuova, { zIndex: 2, visibility: "visible" });
            },
            undefined,
            SOSTA,
          )
          .fromTo(nuova, { clipPath: CLIP.da }, { clipPath: CLIP.a, immediateRender: false }, SOSTA)
          .fromTo(quadro(nuova), { scale: 1.12, xPercent: 6 }, { scale: 1, xPercent: 0, immediateRender: false }, SOSTA)
          .to(quadro(vecchia), { xPercent: -8 }, SOSTA);
        aggiorna();
      };
      aggiorna = () => {
        if (!giro) return;
        if (s.fuori || s.fermo || document.hidden) giro.pause();
        else giro.play();
      };
      avanti();
      return () => {
        ferma();
        ferma = () => {};
        aggiorna = () => {};
        mostra(s.attivo);
      };
    });

    // A77: un clic dentro una lastra interattiva (il play di un video) ferma il giro su quella lastra, anche a
    // metà corsa: la lastra cliccata è quella sotto il puntatore (il clip-path taglia anche il bersaglio).
    const clic = (e: Event) => {
      const l = (e.target as Element | null)?.closest<HTMLElement>("[data-foto-lastra]");
      const i = l ? lastre.indexOf(l) : -1;
      if (i < 0) return;
      s.fermo = true;
      ferma();
      mostra(i);
      s.attivo = i;
      setAttivo(i);
    };
    if (interattive) pila.addEventListener("click", clic, { capture: true });

    const io = new IntersectionObserver(
      (voci) => {
        s.fuori = !voci.some((v) => v.isIntersecting);
        aggiorna();
      },
      { threshold: 0.35 },
    );
    io.observe(pila);
    const cambio = () => aggiorna();
    document.addEventListener("visibilitychange", cambio);

    return () => {
      mm.revert();
      io.disconnect();
      document.removeEventListener("visibilitychange", cambio);
      pila.removeEventListener("click", clic, { capture: true });
    };
  }, [n, interattive]);

  return (
    <div className={`dt-foto-slide ${className}`}>
      <div data-horizon-slide data-bg="foto" className={boxClassName}>
        <div ref={pilaRef} data-horizon-slide-img className="absolute inset-0">
          {voci.map((v, i) => (
            <div
              key={v.key}
              data-foto-lastra
              aria-hidden={i === attivo ? undefined : true}
              className="absolute inset-0 overflow-hidden"
              style={{ zIndex: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
            >
              <div data-foto-quadro className="absolute inset-0">
                {v.node}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
