import Image from "next/image";
import Reveal from "./Reveal";
import Parallax from "./motion/Parallax";

export type EditorialRow = {
  n: string;
  title: string;
  copy: string;
  /** Facoltativa: una riga senza scatto vero si racconta col suo numero. */
  image?: string;
  alt?: string;
};

export default function EditorialRows({
  id,
  eyebrow,
  title,
  intro,
  rows,
  media,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  rows: EditorialRow[];
  /** Forza la variante. Senza, decide la regola qui sotto. */
  media?: boolean;
  /** Conservata per i chiamanti: il fondo è uno solo (avorio) dal 2026-09-10. */
  tone?: "paper" | "cream";
}) {
  /* UNA FOTO VERA O NIENTE.
     Questo modulo si ripeteva dodici volte su quattro pagine e le sue foto
     erano sempre le stesse quattro stanze in 3D: le «cinque fasi di un Open
     Domus» — preparazione, accoglienza, visite, feedback — illustrate da
     soggiorni renderizzati vuoti, e `home_staging_01` in fila su /vendi,
     /servizi e /open-domus. Un render non dice nulla del passo che
     accompagna: e' riempimento, e si vede.
     La regola e' automatica perche' sia difficile da violare: il modulo
     mostra le fotografie solo se OGNI riga ne ha una vera (`reali/`).
     Altrimenti diventa quello che il riferimento fa con i suoi valori — un
     elenco numerato, col numerale grande al posto dell'immagine. */
  const withMedia = media ?? rows.every((r) => r.image?.includes("/reali/"));

  if (!withMedia) {
    return (
      <section id={id} className="dt-chapter bg-cream">
        <div className="dt-row">
          <Reveal>
            <span className="eyebrow">{eyebrow}</span>
            <h2 className="mt-6 max-w-[20ch] font-display text-d1">{title}</h2>
            {intro && <p className="lead mt-8">{intro}</p>}
          </Reveal>
          <ol className="mt-16 flex flex-col">
            {rows.map((r) => (
              <li key={r.n} className="border-t border-line py-10 lg:py-12">
                <Reveal className="grid gap-4 lg:grid-cols-[1fr_3fr] lg:gap-16">
                  {/* Pietra, non rosso: nel riferimento il numerale grande e'
                      grigio e l'accento sta sul TITOLO. Sei numerali rossi in
                      colonna sarebbero sei richieste d'attenzione dove ce n'e'
                      una sola, la CTA. Stesso trattamento dell'elenco dei
                      Servizi, perche' l'elenco del sito sia uno. */}
                  <span className="tnum block font-display text-d1 font-light leading-[0.85] text-stone">
                    {r.n}
                  </span>
                  <div>
                    <h3 className="max-w-[20ch] font-display text-d2 balance">{r.title}</h3>
                    <p className="lead mt-5">{r.copy}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="dt-chapter bg-cream">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-6 max-w-[20ch] font-display text-d1">{title}</h2>
          {intro && <p className="lead mt-8">{intro}</p>}
        </Reveal>

        <div className="mt-20 flex flex-col gap-20 sm:gap-28">
          {rows.map((r, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={r.n}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
                  reversed ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Foto squadrata (4:3), senza cornice né raggio, con la sola
                    parallasse lenta all'interno (righe dispari invertite via order). */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* mob off (misura): sotto sm la cornice è `aspect-[5/4]` in
                      una colonna da 350px, quindi alta 306px, e `speed 0.1`
                      vale ±1,4% — 7,8px di corsa totale, che con la corsa
                      dimezzata del telefono (Parallax, PHONE_SPEED_FACTOR)
                      diventano ~4px: invisibile, sotto i ~10px del criterio
                      dell'onda «parità mobile 2». Quattro righe per pagina su
                      tre rotte: dodici ScrollTrigger scrubbati per un
                      movimento che non c'è. Se un giorno la cornice si alza
                      sotto sm, si toglie il `mobile={false}`. */}
                  <Parallax
                    speed={0.1}
                    scale={1.1}
                    mobile={false}
                    className="absolute inset-0"
                    innerClassName="absolute inset-0"
                  >
                    <Image
                      src={r.image ?? ""}
                      alt={r.alt ?? ""}
                      fill
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      className="object-cover"
                    />
                  </Parallax>
                </div>
                {/* Il Reveal resta solo sulla colonna testo: l'immagine ha già il suo ingresso. */}
                <Reveal className={reversed ? "lg:pr-6" : "lg:pl-6"}>
                  {/* Numero-fantasma: deriva più veloce del flusso, effetto collage editoriale.
                      Acceso anche sul telefono (default di Parallax dall'onda
                      «parità mobile 2», verdetto 7). L'onda precedente lo
                      teneva fermo sotto 768 per due ragioni; rilette: «sotto lg
                      la fotografia gli sta sopra, non c'è nulla contro cui
                      derivare» vale già fra 768 e 1023, dove la deriva c'è
                      sempre stata — non è una ragione del telefono; e i 52px di
                      corsa «da titolo che non sta fermo» sul telefono sono 26
                      (`range` dimezzato dal componente): sopra i ~10px del
                      criterio, dunque visibile, e su un numerale decorativo al
                      25% che sta SOPRA il titolo, non dentro. */}
                  <span className="tnum block text-ui font-semibold uppercase tracking-[0.08em] text-red">{r.n}</span>
                  <h3 className="mt-4 max-w-[20ch] font-display text-d2 balance">{r.title}</h3>
                  <p className="lead mt-6">{r.copy}</p>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
