"use client";

/* LA CHIUSURA DELLA FOTO (A53 di Alberto, 22 set. 2026, sera: «inoltre vorrei che quando arriviamo alla
   fine della foto (dove c'è l'erba) la foto con un animazione si chiude, come qui» — lo screenshot è la
   cartolina del Congedo, il video ritirato nella cornice sulla carta).

   Com'è fatta. La coda della foto — dopo la banda scura in cui posano i tre punti e le sezioni,
   `sopra[1]` ≤ 0,85 (tinte.mjs, A52) — è libera da scritte per costruzione. Quando il fondo dello
   spazio sopra passa la cima del viewport (da lg, con `data-sopra="foto"`), o quando il fondo della
   foto arriva al fondo del viewport (sotto lg e con `data-sopra="carta"`, dove lo spazio sopra segue
   la foto), la scatola della foto si ritira nella cornice della cartolina — 8 % sopra e sotto, 22 %
   ai lati da lg; 4/14 su tablet e 4/10 sul telefono (D29) — mentre sale, con lo scrub e l'ease
   dtCartolina, fino a quando il fondo della foto arriva al 10 % (da lg) o al 30 % (sotto) del
   viewport. È la meccanica della banda del Congedo sotto la soglia (Congedo.tsx, `phone`): NESSUNO
   sticky (A45: la foto scorre con la pagina), nessun pin, il clip sta sulla scatola della foto, che
   non è antenata di nulla di sticky (spec §8), e i marcatori del segno, figli della scatola, seguono
   il ritaglio da soli (fuori dalla cornice il segno torna grafite: elementsFromPoint rispetta il
   clip-path). Il clip si scrive con `clipSides` (spigolo vivo, C01). Con reduced-motion, sotto la
   soglia di motion e senza JS non succede niente: la foto finisce dritta, la pagina è completa.
   Il componente non ha DOM suo: uno span nascosto per trovare la testa che lo monta (PageHeroTesta
   resta server, senza hook: a28-fallback.test).
   A47 + A53 (Alberto, 22 set. 2026, pomeriggio, con lo screenshot del fondo della facciata: «qua, la
   foto, come nelle altre pagine con le foto a schermo intero no bg, deve rimpicciolirsi alla fine»):
   lo monta anche la finestra di Open Domus in home (OpenDomus.tsx, dentro la cornice dopo il
   capitolo): lì lo strato è la cornice `.dt-od_cornice`, la scatola della foto `.dt-od_window` e lo
   spazio sopra il capitolo `.dt-od_content`; la sezione porta `data-od` e `data-sopra="foto"`. La
   scatola sta dentro lo stage sticky del corridoio, ma la chiusura parte quando lo stage è già
   sganciato e a scala 1, e il clip sta sulla scatola, che non è antenata di nulla di sticky. */

import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";
import { clipSides } from "../../lib/motion/clip";

/** La cornice della cartolina per fascia (Congedo.tsx, D29). */
/** La cornice della cartolina da lg (D29): la legge anche la coda della finestra di Open Domus (A68). */
export const CORNICE_LG = { t: 8, r: 22, b: 8, l: 22 };
const CORNICE_TAB = { t: 4, r: 14, b: 4, l: 14 };
const CORNICE_PHONE = { t: 4, r: 10, b: 4, l: 10 };
const MQ_LG = "(min-width: 64rem)";

export default function ChiusuraFoto() {
  const ref = useRef<HTMLSpanElement | null>(null);

  useGSAP(
    () => {
      const testa = ref.current?.closest<HTMLElement>("[data-testa]") ?? null;
      const strato = testa?.querySelector<HTMLElement>("[data-testa-strato]") ?? null;
      const foto = testa?.querySelector<HTMLElement>("[data-testa-foto-box]") ?? null;
      const sopra = testa?.querySelector<HTMLElement>(".dt-testa_sopra") ?? null;
      if (!testa || !strato || !foto) return;
      const mm = gsap.matchMedia();
      // Nella finestra (A47) sotto lg il clip della scatola è dell'otturatore di spec §3.10 (OpenDomus.tsx,
      // ramo `phone`): due padroni sullo stesso clip-path sono uno di troppo, e la chiusura lì non si arma.
      mm.add({ motionOk: MQ.motionOk, lg: MQ_LG }, (ctx) => {
        const c = ctx.conditions as { motionOk: boolean; lg: boolean };
        if (!c.motionOk) return;
        const cornice = () => (window.matchMedia(MQ_LG).matches ? CORNICE_LG : window.matchMedia(MQ.desktop).matches ? CORNICE_TAB : CORNICE_PHONE);
        // Lo spazio sopra sta SULLA foto (da lg, con la banda scura): la chiusura parte quando il suo fondo passa la
        // cima del viewport, così nessuna scritta bianca resta sulla carta scoperta dal ritaglio. Altrimenti parte
        // quando il fondo della foto arriva al fondo del viewport (la banda del Congedo sul telefono).
        const suFoto = () => testa.dataset.sopra === "foto" && window.matchMedia(MQ_LG).matches && !!sopra && sopra.offsetHeight > 0;
        const fineSopra = () => (sopra ? sopra.offsetTop + sopra.offsetHeight : 0);
        // La coda libera sotto le scritte: se è più corta di un quarto di viewport (/vendi: la piscina, con la sezione,
        // arriva al fondo della foto) la chiusura non si arma — un lampo non è un'animazione — e la foto finisce dritta.
        const coda = () => (suFoto() ? foto.offsetHeight - fineSopra() : Infinity);
        const MAI = "top+=999999 top";
        const f = { p: 0 };
        // A riposo (p 0) nessun clip scritto: la scatola resta com'è nel CSS (`clip-path: none`), come con
        // reduced-motion e senza JS; la cornice si scrive solo dentro la corsa e si toglie tornando in cima.
        const dipingi = () => {
          if (f.p <= 0) {
            foto.style.removeProperty("clip-path");
            return;
          }
          const k = cornice();
          foto.style.clipPath = clipSides(+(k.t * f.p).toFixed(3), +(k.r * f.p).toFixed(3), +(k.b * f.p).toFixed(3), +(k.l * f.p).toFixed(3));
        };
        const tl = gsap.timeline({
          defaults: { ease: "dtCartolina", immediateRender: false },
          scrollTrigger: {
            trigger: strato,
            start: () => (coda() < window.innerHeight * 0.25 ? MAI : suFoto() ? `top+=${fineSopra()} top` : `top+=${foto.offsetHeight} bottom`),
            end: () => (coda() < window.innerHeight * 0.25 ? MAI : suFoto() ? `top+=${foto.offsetHeight} 10%` : `top+=${foto.offsetHeight} 30%`),
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        });
        tl.fromTo(f, { p: 0 }, { p: 1, duration: 1, onUpdate: dipingi });
        return () => {
          foto.style.removeProperty("clip-path");
        };
      });
    },
    { scope: ref },
  );

  return <span ref={ref} hidden data-chiusura />;
}
