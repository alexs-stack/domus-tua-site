import type { ReactNode } from "react";
import { Cta } from "./primitives/Cta";
import Reveal from "./Reveal";
import Lead from "./motion/Lead";
import PageHeroBand from "./motion/PageHeroBand";
import PageHeroDive from "./motion/PageHeroDive";
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

/* Testa delle pagine interne della «rivista bianca» (2026-09-10, rif.
   immobiliaregoldengoal.it): fondo avorio, titolo enorme, calligrafia rossa che
   ne attraversa l'ultima riga, lead, CTA, foto squadrata a tutta larghezza. Da lg
   sta su due colonne, titolo a sinistra e lead con CTA in basso a destra, e la
   banda risale sotto il titolo col margine negativo della colonna.
   Il tuffo è di A20 (Alberto, 13 settembre 2026, «Fedeltà letterale», spec §5.1):
   PageHeroDive fa della section un corridoio sticky da 1024 px e 640 px d'altezza
   con motion ok, dove il contenuto sale più veloce della banda e poi la foto passa
   da 1 a 2; PageHeroBand porta la foto base, che è l'LCP, e lo strato nitido di
   D33. Questo file non ha hook né "use client" (spec §5.1: «PageHero resta
   server»); oggi lo importano solo i *Content.tsx, che sono client, e i due figli
   client ricevono i figli React così come li compone. `data-dive-text` segna i
   testi che il tuffo misura e che non passano mai sopra la foto; la calligrafia è
   l'eccezione dichiarata (DESIGN.md:583), e il fondo del testo di Δt la conta lo
   stesso (DIVE_BOTTOM_SEL, spec §5.1). Niente scuro, niente velo, niente raggi
   (C01, C14). */
export default function PageHero({
  id,
  eyebrow,
  title,
  subcopy,
  image,
  alt,
  objectPosition = "50% 50%",
  srcWidth,
  primary,
  secondary,
  trust,
  scriptWord,
  scriptInset = false,
}: {
  /** Ancora della sezione (es. "top" per i link di risalita). */
  id?: string;
  eyebrow: string;
  title: ReactNode;
  subcopy: string;
  image: string;
  alt: string;
  /** `object-position` della foto (spec §7.4); decide il ritaglio 4:5 del telefono. */
  objectPosition?: string;
  /** Larghezza in px del file di `image`: sopra 1920 il corridoio monta lo strato nitido (D33). Presidiata da page-hero-dive.test.ts. */
  srcWidth: number;
  primary: CTA;
  secondary?: CTA;
  trust?: string[];
  /** Parola-ornamento in corsivo rosso, una per pagina (es. "Vendere").
      Le pagine legali non la passano. */
  scriptWord?: string;
  /** Spec §7.4 (nota di D15): dove la calligrafia sulla foto della villa non si legge a occhio, da lg attraversa la
      banda di 0,5vw invece di 1,5vw. L'esito sta in misure/18/calligrafia-esito.json. */
  scriptInset?: boolean;
}) {
  return (
    <PageHeroDive id={id}>
      {/* `relative`: è il riferimento delle misure del tuffo (offsetTop). Il `pt`
          sta qui e non sulla section, perché la section è il corridoio. */}
      <div data-dive-content className="relative pt-[clamp(2rem,6vh,4rem)]">
        {/* La testa è un gruppo (spec §2.5, §5.2; A20 di Alberto): occhiello, H1 e
            calligrafia si armano insieme sopra la piega. La banda sta nel gruppo
            ma non ha un ruolo: il motore non la tocca. La colonna del lead è un
            gruppo annidato (D50): da lg sta accanto al titolo, interseca il
            viewport e parte con la testa, allo stesso handoff o dopo 150 ms, con
            gli stessi indici di ruolo (un lead, una riga CTA); sotto lg sta sotto
            la banda 4/5, fuori dal viewport, e da gruppo di sé nasce nascosto ed
            entra allo scroll con le righe dalla maschera e la dissolvenza della
            CTA, con replay (C22). Il declassamento guarda il membro: `still` è la
            sola riga CTA (spec §2.2). */}
        <RevealGroup className="dt-row lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-x-[5vw]">
          {/* Colonna del titolo. Da lg il margine negativo IN BASSO fa risalire la
              fotografia misurandosi sulla colonna del titolo, non sul fondo della
              riga: quando il lead è più alto del titolo (/vendi,
              /domande-frequenti) la banda si ferma sotto il testo. `pb` meno
              profondo di `-mb`: la differenza (1.5vw, 0.5vw con `scriptInset`) è
              quanta calligrafia finisce sulla foto. Senza calligrafia (privacy,
              cookie) la risalita non c'è. */}
          <div
            className={`lg:col-start-1 lg:row-start-1 ${
              scriptWord ? (scriptInset ? "lg:-mb-[6vw] lg:pb-[5.5vw]" : "lg:-mb-[6vw] lg:pb-[4.5vw]") : "lg:pb-[2vw]"
            }`}
          >
            <div data-dive-text>
              <Reveal>
                <span className="eyebrow">{eyebrow}</span>
              </Reveal>
            </div>

            <div className="relative mt-6">
              {/* H1 per lettera (A20 di Alberto): SplitTitle spezza nel server le
                  stringhe, il <br/> e la span rossa dei chiamanti, e dà all'h1 il
                  nome accessibile intero. */}
              <div data-dive-text>
                <SplitTitle as="h1" className={TITLE}>
                  {title}
                </SplitTitle>
              </div>
              {/* Misura e incastro vengono da `.script-word` (globals.css): la
                  calligrafia attraversa l'ultima riga del titolo. Da lg rientro e
                  corpo rimpiccioliscono con la colonna, se no una firma lunga
                  («Domande frequenti») finirebbe addosso al lead. */}
              {scriptWord && (
                <ScriptWord className="pl-[24vw] lg:pl-[6vw] lg:!text-[clamp(2.6rem,5.6vw,6rem)]">{scriptWord}</ScriptWord>
              )}
            </div>
          </div>

          {/* La banda: `dt-media-full` (decisione di lavoro 11 set., D15; foto
              squadrata a tutta pagina, niente curve né card: la cliente, C01),
              dentro PageHeroBand, con i margini negativi che annullano il padding
              di `.dt-row` (5vw sotto md, 8vw sopra). Sotto md la cornice è 4:5. Sta
              subito dopo la calligrafia, prima del lead. `-z-10` la tiene sotto il
              titolo dentro l'`isolate` della section; nel corridoio di
              `PageHeroDive` (Alberto, 13 set., A20, spec §5.1) sale meno del
              contenuto, di +(Δt − Δb); sotto quella soglia lo zoom leggero è di
              PageHeroBand. */}
          <div
            data-dive-band
            className="relative -z-10 -mx-[5vw] mt-[clamp(1.5rem,4vh,3rem)] md:-mx-[8vw] lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:mt-0"
          >
            <PageHeroBand src={image} alt={alt} objectPosition={objectPosition} srcWidth={srcWidth} />
          </div>

          {/* Colonna del lead, gruppo annidato (D50): da lg in basso a destra, con
              un `pb` che tiene l'ultima riga sopra il bordo della banda. Nessun
              testo sopra le foto tranne la calligrafia e il congedo
              (DESIGN.md:583): nel tuffo di A20 i `data-dive-text` escono dall'alto
              prima che la foto cresca (spec §5.1). */}
          <RevealGroup className="mt-[clamp(2rem,5vh,3rem)] lg:col-start-2 lg:row-start-1 lg:mt-0 lg:self-end lg:pb-[2vw]">
            <div data-dive-text>
              <Lead>{subcopy}</Lead>
            </div>

            <div data-dive-text>
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
            </div>

            {/* Le prove sono corpo di testo (19 px) col trattino rosso
                dell'eyebrow davanti: si leggono come una riga di garanzie. */}
            {trust?.length ? (
              <div data-dive-text>
                <ul className="mt-8 flex flex-col gap-y-3 text-body text-stone sm:flex-row sm:flex-wrap sm:gap-x-8">
                  {trust.map((t) => (
                    <li key={t} className="flex gap-2">
                      {/* `mt` e non `items-center`: sulle righe che vanno a capo il
                          trattino sta sulla PRIMA riga, non a mezza altezza. */}
                      <span aria-hidden className="mt-[0.72em] h-px w-[1.75rem] shrink-0 bg-red opacity-60" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </RevealGroup>
        </RevealGroup>
      </div>
    </PageHeroDive>
  );
}
