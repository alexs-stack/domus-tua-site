import Image from "next/image";
import Reveal from "./Reveal";
import MaskReveal from "./motion/MaskReveal";
import Parallax from "./motion/Parallax";

export type EditorialRow = {
  n: string;
  title: string;
  copy: string;
  image: string;
  alt: string;
};

export default function EditorialRows({
  id,
  eyebrow,
  title,
  intro,
  rows,
  tone = "paper",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  rows: EditorialRow[];
  tone?: "paper" | "cream";
}) {
  return (
    <section id={id} className={tone === "cream" ? "bg-cream" : "bg-paper"}>
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {title}
          </h2>
          {intro && <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-stone">{intro}</p>}
        </Reveal>

        <div className="mt-16 flex flex-col gap-16 sm:gap-24">
          {rows.map((r, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={r.n}
                className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
                  reversed ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Cornice immagine: sipario che si apre dal lato visivo del capitolo
                    (righe dispari invertite via order) + parallasse lenta all'interno.
                    `mobile`: la deriva vive dentro la cornice, sotto l'overscan
                    1.1 — sul telefono si muove la fotografia, non il suo bordo.
                    È l'unico posto di questa riga dove la parallasse aggiunge
                    profondità invece di far ballare quello che si sta leggendo. */}
                <MaskReveal
                  from={reversed ? "right" : "left"}
                  zoom={1.14}
                  className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-line"
                  innerClassName="absolute inset-0"
                >
                  {/* `mobile` tolta dopo la misura: sotto sm la cornice è
                      `aspect-[5/4]` in una colonna da 350px, quindi alta 306px,
                      e `speed 0.1` vale ±1,4% — 7,8px di corsa totale su
                      quattro righe per pagina, su tre rotte. Sotto la soglia
                      con cui questa wave ha cancellato la cupola e i gradini:
                      dodici ScrollTrigger scrubbati per un movimento invisibile
                      sarebbe il conto peggiore della fase. Se un giorno la
                      cornice si alza sotto sm, la si riaccende. */}
                  <Parallax
                    speed={0.1}
                    scale={1.1}
                    className="absolute inset-0"
                    innerClassName="absolute inset-0"
                  >
                    <Image
                      src={r.image}
                      alt={r.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 560px"
                      className="photo-warm object-cover"
                    />
                  </Parallax>
                </MaskReveal>
                {/* Il Reveal resta solo sulla colonna testo: l'immagine ha già il suo ingresso. */}
                <Reveal className={reversed ? "lg:pr-6" : "lg:pl-6"}>
                  {/* Numero-fantasma: deriva più veloce del flusso, effetto collage editoriale.
                      Niente `mobile`, e sono due ragioni che vanno nella stessa
                      direzione: il collage esiste perché a due colonne il numero
                      scorre CONTRO la fotografia accanto, e sotto lg quella
                      fotografia gli sta sopra invece che a fianco — non c'è più
                      nulla contro cui derivare. E l'ampiezza qui è in px: 52px
                      di corsa su un numerale incollato al titolo, in colonna
                      stretta, si legge come un titolo che non sta fermo. */}
                  <Parallax speed={-1} range={26} className="w-fit">
                    <span className="font-display text-5xl font-medium text-red/25">{r.n}</span>
                  </Parallax>
                  <h3 className="mt-4 font-display text-[1.8rem] font-medium leading-[1.1] tracking-tight text-ink balance sm:text-[2.2rem]">
                    {r.title}
                  </h3>
                  <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-stone">{r.copy}</p>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
