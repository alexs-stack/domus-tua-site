import Image from "next/image";
import type { ReactNode } from "react";
import { Cta } from "./primitives/Cta";
import Reveal from "./Reveal";
import Parallax from "./motion/Parallax";
import TextLines from "./motion/TextLines";

type CTA = { label: string; href: string };

/* Titolo a 8vw come nel riferimento (≈115 px a 1440), maiuscolo per regola
   globale; `16ch` tiene le righe corte anche sui titoli lunghi. Gli span dei
   chiamanti (`text-red-soft`, nato per l'hero scuro) sull'avorio non si
   leggono: qui il titolo è di un colore solo, il rosso è la parola-ornamento. */
const TITLE =
  "max-w-[16ch] font-display text-[clamp(3rem,8vw,9rem)] leading-[0.92] [&_span]:text-inherit";

/* Hero delle pagine interne, «rivista bianca» (2026-09-10, rif.
   immobiliaregoldengoal.it): fondo avorio, titolo enorme con la
   parola-ornamento rossa sovrapposta, lead, CTA, foto 16:9 squadrata sotto.
   Niente scuro, niente velo, niente raggi. Movimento: solo Reveal, TextLines,
   Parallax. Nessun hook: niente "use client". */
export default function PageHero({
  id,
  eyebrow,
  title,
  subcopy,
  image,
  alt,
  primary,
  secondary,
  trust,
  scriptWord,
}: {
  /** Ancora della sezione (es. "top" per i link di risalita). */
  id?: string;
  eyebrow: string;
  title: ReactNode;
  subcopy: string;
  image: string;
  alt: string;
  primary: CTA;
  secondary?: CTA;
  trust?: string[];
  /** Parola-ornamento in corsivo rosso, una per pagina (es. "Vendere").
      Le pagine legali non la passano. */
  scriptWord?: string;
}) {
  return (
    <section id={id} className="relative bg-cream pt-[clamp(2rem,6vh,4rem)]">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>

        <div className="relative mt-6">
          {/* TextLines vuole una stringa pura (SplitText); il JSX dei
              chiamanti (<br/>, span rossa) si rende nell'h1 così com'è. */}
          {typeof title === "string" ? (
            <TextLines as="h1" className={TITLE}>
              {title}
            </TextLines>
          ) : (
            <h1 className={TITLE}>{title}</h1>
          )}
          {/* Misura e incastro vengono da `.script-word` (globals.css): la
              calligrafia attraversa l'ultima riga del titolo, come nel
              riferimento. Qui resta solo il rientro. */}
          {scriptWord && (
            <span
              aria-hidden
              className="script-word pl-[24vw]"
            >
              {scriptWord}
            </span>
          )}
        </div>

        <Reveal delay={120}>
          <p className="lead mt-8">{subcopy}</p>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Cta href={primary.href} variant="cta-solid" size="lg">
              {primary.label}
            </Cta>
            {secondary && (
              <Cta href={secondary.href} variant="ghost" arrow={false}>
                {secondary.label}
              </Cta>
            )}
          </div>
        </Reveal>

        {trust?.length ? (
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-ui uppercase tracking-[0.08em] text-stone">
            {trust.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Foto squadrata a tutta larghezza. Parallasse minima; ferma sotto i
          768 perché a 390 la corsa starebbe sotto i 10 px (invisibile). */}
      <Parallax speed={-0.04} mobile={false}>
        <div className="relative mt-[clamp(2rem,6vh,4rem)] aspect-[16/9] w-full">
          {/* preload (non priority, deprecata in Next 16): è l'LCP della pagina. */}
          <Image src={image} alt={alt} fill preload sizes="100vw" quality={60} className="object-cover" />
        </div>
      </Parallax>
    </section>
  );
}
