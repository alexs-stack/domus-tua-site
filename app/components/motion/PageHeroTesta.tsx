// «LA TESTA DI ERA»: il passo comune delle nove rotte (/vendi, /acquista, /servizi,
// /metodo, /open-domus, /chi-siamo, /recensioni, /lavora-con-noi, /domande-frequenti)
// e dei due legali (/privacy, /cookie).
//
// Chi l'ha chiesto: A38 di Alberto (20 settembre 2026): «quando entri nella foto a
// schermo intero, la foto stessa diventa lo sfondo, e le scritte sopra»; A41: «preferisco
// il layout centrato tipo Perfect sea views» e «lo scroll continuo senza uscire dalla
// foto»; A45 (21 set.): «le foto su era residence sono la pagina stessa … stai
// scrollando la foto stessa come se fosse la pagina». A46 (Alberto, 21 set. 2026, sera):
// «su eraresidence questa foto che usa come background alta ha il cielo mascherato, è no
// bg: ecco perché sembra un tutt'uno il cielo con il colore dello sfondo del sito.
// Dobbiamo fare la stessa cosa nel nostro sito, dove ci sono le immagini così alte».
//
// Com'è fatto (tutto nel CSS del server, globals.css «la testa di era»; nessun JS di
// movimento, nessun tween, nessun pin, nessun corridoio):
// - `.dt-testa_riquadro` è la CARTA: in flusso, fondo avorio, `overflow: clip`, alto quanto
//   il blocco più la foto meno il cielo; porta `data-dive-zoom` (il rettangolo che gli e2e
//   leggono) e NON porta `data-bg`: sopra il cielo trasparente il segno resta grafite;
// - `.dt-testa_blocco` (composto da PageHero, tre livelli centrati) viene PRIMA nel DOM
//   (l'ordine di lettura: l'H1 prima dell'immagine) e sopra nello stacking: in flusso, in
//   cima, alto almeno quanto il cielo della foto (`aspect-ratio: 1 / var(--dt-cielo-h)`) e,
//   da lg, almeno 100svh; le scritte, comandi compresi, stanno sull'avorio;
// - `.dt-testa_strato` è la foto: IN FLUSSO dopo il blocco, alta quanto la foto resa a
//   larghezza piena (`--dt-testa-ar`), portata SU di quanto vale il suo cielo trasparente
//   (`margin-top: calc(-100% * var(--dt-cielo-h))`), così il soggetto comincia esattamente
//   al fondo del blocco (e senza cielo — attici, legali, la tenda di /open-domus — la foto
//   comincia sotto i comandi). Il suo fondo è il placeholder prima del decode (D125);
// - `[data-testa-soggetto]` è il marcatore del soggetto: assoluto nello strato dalla linea
//   del cielo in giù, `data-bg="foto"` per il segno (D34): le tacche virano all'avorio solo
//   sulla villa, mai sulla carta;
// - poi `.dt-testa_pagina` (i tre punti sull'avorio) segue in flusso;
// - lo stato del CSS è lo stato a riposo: senza JS e con reduced-motion la pagina è
//   questa, completa; niente sticky, niente trasformate (D190). CLS 0 per costruzione:
//   nulla si misura, nulla si scrive dopo il paint;
// - la foto è l'LCP: `preload`, `quality 60` (l'alpha del WebP resta lossless nell'ottimizzatore:
//   sharp tiene alphaQuality 100), `sizes` dal rapporto della sorgente (`sizesDi`, D183),
//   inquadratura `--dt-op` scelta dal CSS per fascia (D180; con lo strato al rapporto della
//   foto il cover non ritaglia nulla). Nessun hook.
import Image from "next/image";
import type { ReactNode } from "react";
import { sizesDi } from "../../lib/motion/testa";

export default function PageHeroTesta({
  id,
  src,
  alt,
  ratio,
  blocco,
  children,
}: {
  id?: string;
  /** La foto: il WebP col cielo trasparente dove c'è (A46), altrimenti la sorgente (PageHero decide). */
  src: string;
  alt: string;
  /** Il rapporto larghezza/altezza della sorgente (`sorgente` di tinte.json): decide `sizes` (D183). */
  ratio: number;
  /** Il blocco dei testi, centrato sull'avorio sopra il soggetto (lead; occhiello, H1, calligrafia; comandi): lo compone PageHero. */
  blocco: ReactNode;
  /** La pagina che segue la foto (i tre punti sull'avorio); vuota dove la rotta non ha prove. */
  children?: ReactNode;
}) {
  return (
    <section id={id} data-testa className="dt-testa relative isolate">
      <div data-dive-zoom className="dt-testa_riquadro">
        {blocco}
        <div data-testa-strato className="dt-testa_strato">
          <Image
            data-testa-foto
            src={src}
            alt={alt}
            fill
            preload
            sizes={sizesDi(ratio)}
            quality={60}
            className="object-cover"
            style={{ objectPosition: "var(--dt-op)" }}
          />
          <span aria-hidden data-testa-soggetto data-bg="foto" className="dt-testa_soggetto" />
        </div>
      </div>
      <div className="dt-testa_pagina">{children}</div>
    </section>
  );
}
