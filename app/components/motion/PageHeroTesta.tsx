// «LA TESTA DI ERA»: il passo comune delle nove rotte (/vendi, /acquista, /servizi,
// /metodo, /open-domus, /chi-siamo, /recensioni, /lavora-con-noi, /domande-frequenti)
// e dei due legali (/privacy, /cookie).
//
// Chi l'ha chiesto: A38 di Alberto (20 settembre 2026): «quando entri nella foto a
// schermo intero, la foto stessa diventa lo sfondo, e le scritte sopra […] le scritte
// devono essere dentro la foto di sfondo […] scritte bianche»; A40: bianco nudo, senza
// ombra; A41: «preferisco il layout centrato tipo Perfect sea views» e «lo scroll
// continuo senza uscire dalla foto». Il riferimento è «Perfect sea views» di
// era-residence: foto a tutto schermo come sfondo, testi bianchi centrati dentro.
//
// Com'è fatto (tutto nel CSS del server, globals.css «la testa di era»; nessun JS di
// movimento, nessun tween, nessun pin, nessun corridoio):
// - `.dt-testa_riquadro` è la foto: `position: sticky; top: 0; height: 100svh`. Resta
//   ferma mentre il blocco dei testi e la pagina sotto le scorrono sopra, finché la
//   section finisce: è lo «scroll continuo dentro la foto» di era fatto senza foto alte
//   (le nostre sono tutte 3:2 e 16:9: nessun pan, la foto non si muove né si zooma);
// - `.dt-testa_blocco` (composto da PageHero, tre livelli centrati) sale sopra la foto
//   con `margin-top: -100svh`, alto almeno 100svh, e scorre in flusso; poi
//   `.dt-testa_pagina` (i tre punti sull'avorio) sale a sua volta sopra la foto;
// - lo stato del CSS è lo stato a riposo: senza JS e con reduced-motion la pagina è
//   questa, completa; sticky non è un'animazione (D190). CLS 0 per costruzione: nulla
//   si misura, nulla si scrive dopo il paint;
// - `data-dive-zoom` e `data-bg="foto"` stanno sul riquadro: è il rettangolo che
//   tema.ts legge per il segno (D34) e il gancio del placeholder tinto (D125);
// - la foto è l'LCP: `preload`, `quality 60`, `sizes` dal rapporto della sorgente
//   (`sizesDi`, D183), inquadratura `--dt-op` scelta dal CSS per fascia (D180).
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
  src: string;
  alt: string;
  /** Il rapporto larghezza/altezza della sorgente (`sorgente` di tinte.json): decide `sizes` (D183). */
  ratio: number;
  /** Il blocco dei testi, centrato sopra la foto (lead; occhiello, H1, calligrafia; comandi): lo compone PageHero. */
  blocco: ReactNode;
  /** La pagina che sale sopra la foto dopo il blocco (i tre punti sull'avorio); vuota dove la rotta non ha prove. */
  children?: ReactNode;
}) {
  return (
    <section id={id} data-testa className="dt-testa relative isolate">
      <div data-dive-zoom data-bg="foto" className="dt-testa_riquadro">
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
        </div>
      </div>
      {blocco}
      <div className="dt-testa_pagina">{children}</div>
    </section>
  );
}
