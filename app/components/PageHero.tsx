import Image from "next/image";
import type { ReactNode } from "react";
import { Cta } from "./primitives/Cta";
import Reveal from "./Reveal";
import Lead from "./motion/Lead";
import Parallax from "./motion/Parallax";
import RevealGroup from "./motion/RevealGroup";
import ScriptWord from "./motion/ScriptWord";
import SplitTitle from "./motion/SplitTitle";

type CTA = { label: string; href: string };

/* La taglia segue la COLONNA, non la gerarchia (DESIGN.md, «regola della
   colonna»): finché il titolo possiede tutta la riga resta la misura del
   riferimento (8vw ≈ 115 px a 1440), ma da lg vive nella colonna di sinistra e
   scende a 4.8vw — a 115 px una parola sola come «VALORIZZARE,» (12 segni)
   sfonderebbe la colonna. `16ch` tiene corte le righe sugli schermi larghi.
   Gli span dei chiamanti (`text-red-soft`, nato per l'hero scuro) sull'avorio
   non si leggono: il titolo è di un colore solo, il rosso è l'ornamento. */
const TITLE =
  "max-w-[16ch] font-display text-[clamp(3rem,8vw,9rem)] leading-[0.92] [&_span]:text-inherit lg:text-[clamp(2.75rem,4.8vw,5.25rem)]";

/* Hero delle pagine interne, «rivista bianca» (2026-09-10, rif.
   immobiliaregoldengoal.it): fondo avorio, titolo enorme con la
   parola-ornamento rossa sovrapposta, lead, CTA, foto squadrata.
   Impaginazione rifatta l'11 settembre: il blocco di testo sopra la foto era
   alto 942 px e su /servizi (viewport 900) della fotografia non si vedeva un
   pixel. Da qui la testa sta su DUE colonne da lg — titolo a sinistra, lead e
   CTA in basso a destra — e la banda risale sotto il titolo (6vw, il
   gesto del riferimento: media col `top_margin: -26%`), così la calligrafia
   ne attraversa il bordo alto come sull'hero della home.
   Niente scuro, niente velo, niente raggi. Nessun hook: niente "use client". */
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
    /* `isolate`: la banda sale col `-z-10` per finire SOTTO il titolo, e senza
       contesto di impilamento qui finirebbe sotto anche all'avorio della
       sezione — cioè invisibile. */
    <section id={id} className="relative isolate bg-cream pt-[clamp(2rem,6vh,4rem)]">
      {/* La testa è un gruppo (spec §2.5, §5.2; A20 di Alberto): occhiello, H1 e
          calligrafia si armano insieme sopra la piega. La banda sta nel gruppo
          ma non ha un ruolo: il motore non la tocca. La colonna del lead è un
          gruppo annidato (D50): da lg sta accanto al titolo, interseca il
          viewport e parte con la testa, allo stesso handoff o dopo 150 ms, con
          gli stessi indici di ruolo (un lead, una riga CTA); sotto lg sta sotto
          la banda 4/5, fuori dal viewport, e da gruppo di sé nasce nascosto ed
          entra allo scroll con le righe dalla maschera e la dissolvenza della
          CTA, con replay (C22) — in un gruppo solo partiva fuori vista e chi
          scorreva lo trovava già pieno e fermo. Il declassamento guarda il
          membro: `still` è la sola riga CTA (spec §2.2). */}
      <RevealGroup className="dt-row lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-x-[5vw]">
        {/* Colonna del titolo. Da lg il margine negativo IN BASSO (non un `-mt`
            sulla banda) è quello che fa risalire la fotografia: così la risalita
            si misura sulla colonna del titolo e non sul fondo della riga —
            quando il lead è più alto del titolo (/vendi, /domande-frequenti) la
            banda si ferma sotto il testo invece di tagliare l'ultima riga del
            titolo. `pb` meno profondo di `-mb`: la differenza (1.5vw) è quanta
            calligrafia finisce sulla foto, un terzo scarso come nel riferimento.
            Senza calligrafia (privacy, cookie) la risalita non c'è: non avendo
            niente da far attraversare, taglierebbe e basta l'ultima riga. */}
        <div
          className={`lg:col-start-1 lg:row-start-1 ${
            scriptWord ? "lg:-mb-[6vw] lg:pb-[4.5vw]" : "lg:pb-[2vw]"
          }`}
        >
          <Reveal>
            <span className="eyebrow">{eyebrow}</span>
          </Reveal>

          <div className="relative mt-6">
            {/* H1 per lettera (A20 di Alberto): SplitTitle spezza nel server le
                stringhe, il <br/> e la span rossa dei chiamanti, e dà all'h1 il
                nome accessibile intero. */}
            <SplitTitle as="h1" className={TITLE}>
              {title}
            </SplitTitle>
            {/* Misura e incastro vengono da `.script-word` (globals.css): la
                calligrafia attraversa l'ultima riga del titolo. Da lg rientro e
                corpo rimpiccioliscono con la colonna, se no una firma lunga
                («Domande frequenti») uscirebbe dalla colonna e finirebbe
                addosso al lead. */}
            {scriptWord && (
              <ScriptWord className="pl-[24vw] lg:pl-[6vw] lg:!text-[clamp(2.6rem,5.6vw,6rem)]">
                {scriptWord}
              </ScriptWord>
            )}
          </div>
        </div>

        {/* LA BANDA. `dt-media-full`, uno dei tre moduli media, con i margini
            negativi che annullano esatti il padding di `.dt-row` (5vw sotto md,
            8vw sopra): resta a tutta pagina come nel riferimento. Sotto md
            prende il rapporto della colonna (4:5) ma non la sua larghezza da
            42vw — un 16:9 a 390 era una feritoia di 219 px, un 42vw in un
            telefono non esiste. E sta QUI, subito dopo la calligrafia: la
            fotografia arriva prima del lead, non dopo la CTA. */}
        <Parallax
          speed={-0.04}
          mobile={false}
          className="relative -z-10 -mx-[5vw] mt-[clamp(1.5rem,4vh,3rem)] md:-mx-[8vw] lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:mt-0"
          innerClassName="dt-media-full !aspect-[4/5] md:!aspect-video"
        >
          {/* preload (non priority, deprecata in Next 16): è l'LCP della pagina. */}
          <Image src={image} alt={alt} fill preload sizes="100vw" quality={60} className="object-cover" />
        </Parallax>

        {/* Colonna del lead, gruppo annidato (D50): da lg in basso a destra,
            con un `pb` che le tiene l'ultima riga sopra il bordo della banda —
            il testo sopra le immagini è vietato, tranne la calligrafia e il
            congedo. */}
        <RevealGroup className="mt-[clamp(2rem,5vh,3rem)] lg:col-start-2 lg:row-start-1 lg:mt-0 lg:self-end lg:pb-[2vw]">
          <Lead>{subcopy}</Lead>

          <Reveal role="still">
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

          {/* Le tre prove erano etichette maiuscole spaziate a 16 px: la stessa
              riga dell'occhiello e dei bottoni, quindi lette come stampatello
              minuto. Qui sono corpo di testo (19 px) col trattino rosso
              dell'eyebrow davanti: si leggono come una riga di garanzie. */}
          {trust?.length ? (
            <ul className="mt-8 flex flex-col gap-y-3 text-body text-stone sm:flex-row sm:flex-wrap sm:gap-x-8">
              {trust.map((t) => (
                <li key={t} className="flex gap-2">
                  {/* `mt` e non `items-center`: sulle righe che vanno a capo il
                      trattino deve stare sulla PRIMA riga, non a mezza altezza. */}
                  <span aria-hidden className="mt-[0.72em] h-px w-[1.75rem] shrink-0 bg-red opacity-60" />
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
        </RevealGroup>
      </RevealGroup>
    </section>
  );
}
