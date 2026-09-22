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
//   cima, alto quanto il contenuto e, da lg, almeno 100svh (nessun aspect-ratio: con un
//   min-height perderebbe il minimo del contenuto); le scritte, comandi compresi, stanno
//   sull'avorio;
// - `.dt-testa_strato` è la foto: IN FLUSSO dopo il blocco, alta quanto la foto resa a
//   larghezza piena (`--dt-testa-ar`), portata SU di quanto vale il suo cielo trasparente
//   fino alla CIMA del soggetto (`margin-top: calc(-100% * var(--dt-cielo-h))`, `cielo.cima`
//   di tinte.json in frazione della larghezza), così il soggetto comincia esattamente al
//   fondo del blocco (e senza cielo — attici, legali, la tenda di /open-domus — la foto
//   comincia sotto i comandi). Il suo fondo è il placeholder prima del decode (D125);
// - `[data-testa-soggetto]` sono i MARCATORI DEL SEGNO (D34): uno per banda `segno` di
//   tinte.json — le corse in cui la striscia del segno (2-6 % della larghezza) è opaca e
//   scura, misurate da scripts/media/tinte.mjs —, assoluti nello strato con `top`/`bottom`
//   in percentuale, `data-bg="foto"`: le tacche virano all'avorio solo lì; sul cielo
//   trasparente (la carta) e sui muri bianchi restano grafite (revisione avversaria di
//   A46, 22 set. 2026, C01/G02: un marcatore unico dalla cima in giù le faceva sparire);
// - `.dt-testa_sopra` è lo spazio DENTRO lo strato, dopo l'immagine (A48 di Alberto, 22 set.
//   2026: «portare le sezioni più sopra in modo che la foto sia semplicemente lo sfondo della
//   pagina»): in flusso, coi tre punti e le sezioni che la pagina posa sulla foto (`sopra`).
//   Da lg comincia subito sotto il blocco (`padding-top` = il cielo, `--dt-cielo-h`) in bianco con
//   l'ombra attaccata alle lettere del sito (A54, 22 set. sera: «metti una lieve ombra se non si
//   legge, o fai le scritte più grandi»; «dobbiamo riempire più spazi possibili nelle foto alte a
//   schermo intero») e senza fondo: lo strato è alto max(foto, cielo + contenuto) e l'immagine copre
//   dall'alto; sotto lg comincia dopo la foto (`padding-top` = l'altezza della foto, `--dt-testa-hw`),
//   in inchiostro; da lg il bianco vale con `data-sopra="foto"` (le teste con la foto della villa),
//   con `carta` (i due legali) anche da lg lo spazio sopra segue la foto in inchiostro. Dopo lo
//   spazio sopra, ChiusuraFoto (A53): la coda libera della foto si ritira nella cornice della
//   cartolina mentre sale. La foto e i marcatori stanno nella scatola `.dt-testa_foto`
//   (assoluta in cima allo strato: da lg riempie lo strato, sotto lg è alta quanto la foto resa), così
//   le bande del segno restano frazioni della FOTO anche quando lo strato cresce col contenuto;
// - lo stato del CSS è lo stato a riposo: senza JS e con reduced-motion la pagina è
//   questa, completa; niente sticky, niente trasformate (D190). CLS 0 per costruzione:
//   nulla si misura, nulla si scrive dopo il paint;
// - la foto è l'LCP: `preload`, `quality 60` (nel WebP l'alpha resta lossless, sharp tiene
//   alphaQuality 100; nell'AVIF, che Chrome riceve per primo, è lossy a q 38 —
//   image-optimizer.js — con croma 4:4:4: la frangia al bordo del cielo è misurata in
//   C05/P04 della revisione del 22 set., appena percettibile a 1×), `sizes` 100vw
//   (`SIZES_TESTA`: lo strato è largo tutto col rapporto della foto, il cover non
//   ritaglia; il conto per fold di D183 è morto con A45), inquadratura `--dt-op` scelta
//   dal CSS per fascia (D180). Nessun hook.
import Image from "next/image";
import type { ReactNode } from "react";
import { SIZES_TESTA } from "../../lib/motion/testa";
import ChiusuraFoto from "./ChiusuraFoto";

export default function PageHeroTesta({
  id,
  src,
  alt,
  segno,
  blocco,
  suFoto,
  sopra,
}: {
  id?: string;
  /** La foto: il WebP col cielo trasparente dove c'è (A46), altrimenti la sorgente (PageHero decide). */
  src: string;
  alt: string;
  /** Le bande del segno (`segno` di tinte.json): corse [da, a] in frazione dell'altezza della foto in cui il segno vira `foto`. */
  segno: ReadonlyArray<ReadonlyArray<number>>;
  /** Il blocco dei testi, centrato sull'avorio sopra il soggetto (lead; occhiello, H1, calligrafia; comandi): lo compone PageHero. */
  blocco: ReactNode;
  /** A48/A54: la testa ha la foto della villa (trattamento «testa»)? Allora da lg lo spazio sopra sta sulla foto, in bianco con l'ombra; altrimenti («carta») la segue in inchiostro. */
  suFoto: boolean;
  /** Lo spazio sopra la foto (A48): i tre punti e le sezioni che la pagina posa sulla foto; vuoto dove non c'è niente. */
  sopra?: ReactNode;
}) {
  return (
    <section id={id} data-testa data-sopra={suFoto ? "foto" : "carta"} className="dt-testa relative isolate">
      <div data-dive-zoom className="dt-testa_riquadro">
        {blocco}
        <div data-testa-strato className="dt-testa_strato">
          <div data-testa-foto-box className="dt-testa_foto">
            <Image
              data-testa-foto
              src={src}
              alt={alt}
              fill
              preload
              sizes={SIZES_TESTA}
              quality={60}
              className="object-cover"
              style={{ objectPosition: "var(--dt-op)" }}
            />
            {segno.map(([da = 0, a = 0]) => (
              <span
                key={`${da}-${a}`}
                aria-hidden
                data-testa-soggetto
                data-bg="foto"
                className="dt-testa_soggetto"
                style={{ top: `${(da * 100).toFixed(2)}%`, bottom: `${((1 - a) * 100).toFixed(2)}%` }}
              />
            ))}
          </div>
          <div className="dt-testa_sopra">{sopra}</div>
          <ChiusuraFoto />
        </div>
      </div>
    </section>
  );
}
