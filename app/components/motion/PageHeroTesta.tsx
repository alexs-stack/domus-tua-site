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
// - `.dt-testa_riquadro` è la foto, in flusso e alta quanto la foto resa (A45), mai meno
//   del blocco: scorre con la pagina; `.dt-testa_blocco` (composto da PageHero, tre
//   livelli centrati) sta dentro, in flusso e in cima, alto almeno 100svh, sopra lo
//   strato assoluto della foto; poi `.dt-testa_pagina` (i tre punti sull'avorio) segue;
// - lo stato del CSS è lo stato a riposo: senza JS e con reduced-motion la pagina è
//   questa, completa; sticky non è un'animazione (D190). CLS 0 per costruzione: nulla
//   si misura, nulla si scrive dopo il paint;
// - `data-dive-zoom` e `data-bg="foto"` stanno sul riquadro: è il rettangolo che
//   tema.ts legge per il segno (D34) e il gancio del placeholder tinto (D125);
// - la foto è l'LCP: `preload`, `quality 60`, `sizes` dal rapporto della sorgente
//   (`sizesDi`, D183), inquadratura `--dt-op` scelta dal CSS per fascia (D180);
// - A44/A45 (20-21 set. 2026): le nove foto sono ALTE (2:3, generate con Higgsfield) e il
//   riquadro è IN FLUSSO, alto quanto la foto (`--dt-testa-ar`): «le foto su era residence sono
//   la pagina stessa … stai scrollando la foto stessa come se fosse la pagina» (Alberto). Il
//   blocco dei testi sta DENTRO il riquadro, in cima, e scorre con la foto. Nessun hook.
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
        {blocco}
      </div>
      <div className="dt-testa_pagina">{children}</div>
    </section>
  );
}
