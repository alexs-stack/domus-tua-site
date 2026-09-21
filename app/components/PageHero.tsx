import type { ReactNode } from "react";
import tinte from "../lib/motion/tinte.json";
import { Cta } from "./primitives/Cta";
import Reveal from "./Reveal";
import Lead from "./motion/Lead";
import PageHeroTesta from "./motion/PageHeroTesta";
import RevealGroup from "./motion/RevealGroup";
import ScriptWord from "./motion/ScriptWord";
import SplitTitle from "./motion/SplitTitle";

type CTA = { label: string; href: string };

/* La taglia segue la COLONNA, non la gerarchia (DESIGN.md, «regola della
   colonna»): finché il titolo possiede tutta la riga resta la misura del
   riferimento (8vw ≈ 115 px a 1440), ma da lg vive nella colonna di sinistra e
   scende a 4.8vw — a 115 px una parola sola come «VALORIZZARE,» (12 segni)
   sfonderebbe la colonna. `16ch` tiene corte le righe sugli schermi larghi.
   Gli span dei chiamanti (`text-red-soft`, nato per l'hero scuro) sulla foto
   non si leggono: il titolo è di un colore solo, il bianco (D184). */
const TITLE =
  "mx-auto max-w-[18ch] font-display text-[clamp(3rem,9vw,9rem)] leading-[0.92] [&_span]:text-inherit lg:text-[clamp(3.5rem,7vw,8rem)]";

/* La riga dei tre punti sotto la foto: la griglia di sempre (`dt-row`), centrata
   come il blocco. */
const GRIGLIA = "dt-row";

/* «LA TESTA DI ERA» (A38 di Alberto, 20 settembre 2026; brief T, D172-D198):
   «quando entri nella foto a schermo intero, la foto stessa diventa lo sfondo,
   e le scritte sopra […] le scritte devono essere dentro la foto di sfondo […]
   scritte bianche». Il riferimento è «Perfect sea views» di era-residence.
   Questo file non ha hook né "use client" (spec §5.1: «PageHero resta server»);
   lo importano gli undici *Content.tsx, che sono client, e PageHeroTesta
   (client) riceve i figli React così come li compone.

   Un ramo solo (D175): la fotografia è il primo pixel della pagina, in una
   scatola alta 100svh sotto la testata trasparente (PageHeroTesta), e DENTRO
   la foto, in alto a sinistra nella griglia (D177), in bianco NUDO, senza
   ombra (A40 di Alberto), stanno occhiello, H1, calligrafia, lead
   e i due comandi; i tre punti dopo, sull'avorio. Le nove rotte scorrono con la
   parallasse (m 0,138, D182), i due legali sono fermi (m 0, D188): lo dice
   `tinte.json` per rotta, con la foto, la sorgente e le due inquadrature
   (D180: `lg` e `sotto`, scelte in qualita/a38/misure/cancello-T1.md). Sul
   telefono la stessa testa, colonna unica, tutto dentro (D177).

   IL BIANCO (D184; A40 di Alberto, 20 set. 2026: «negli screenshot di
   era-residence non c'erano le ombre sulle scritte bianche, rimuovile subito»):
   `text-white` sulle colonne e con `!` dove una regola non stratificata di
   globals.css scrive `color` (`.eyebrow`, `.lead`, `.script-word`: le regole
   senza layer battono le utility). Nessuna ombra, nessun alone, nessuna copia
   sotto le lettere: il bianco sta nudo sulla foto come su era-residence, e il
   contrasto sulla sola foto si dichiara col numero (deroga di Alberto a 1.4.3).
   Il bottone rosso pieno resta com'è, senza reset (5,54:1
   del bianco sul rosso). Il link fantasma sta a 18 px, impilato sotto il
   bottone (D174). Il lead sulla foto non usa la maschera per righe. Niente
   velo, niente rettangolo, niente gradiente sulla foto (C14). */

/* LA TINTA DEL PLACEHOLDER E LE INQUADRATURE NELL'HTML INIZIALE (D78, D125,
   D180, D187): `scripts/media/tinte.mjs` misura la banda alta della foto sul
   ritaglio del telefono e scrive `tinte.json`, committato; qui il server emette
   in uno <style> nell'HTML iniziale la tinta (il fondo del riquadro prima del
   decode e la barra della testata sotto lg, D82), le due inquadrature per
   fascia (`--dt-op-lg` / `--dt-op-sotto`: il CSS sceglie `--dt-op`). Vale senza JS, con reduced-motion, senza fetch e senza FOUC, e arriva
   anche a `Header.tsx`, che sta fuori dalla section. Lo <style> sta nell'albero
   del componente e non in <head> con `precedence`, così cambia con la pagina a
   ogni navigazione client (e2e/a28.spec.ts, «le tinte»). Dove il JSON dichiara
   `"avorio"` esce il TOKEN della zona, mai un quarto colore (D124):
   `--color-cream-deep`. */
const tintaCss = (b: { hex: string }, avorio: string) => (b.hex === "avorio" ? avorio : b.hex);

export default function PageHero({
  id,
  rotta,
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
  /** La rotta, chiave di `tinte.json` (D78, D122). È il chiamante a dirla: PageHero
      è server e un componente server non conosce il pathname. */
  rotta: keyof typeof tinte;
  eyebrow: string;
  title: ReactNode;
  subcopy: string;
  /** La fotografia: la stessa di `tinte.json` per la rotta (tinte.test.ts lo pretende); l'inquadratura viene dal JSON (D180). */
  image: string;
  alt: string;
  primary: CTA;
  secondary?: CTA;
  trust?: string[];
  /** Parola-ornamento in corsivo, una per pagina (es. "Vendere"), bianca dentro la foto (D184).
      Le pagine legali non la passano. */
  scriptWord?: string;
}) {
  const tinta = tinte[rotta];
  const stile = (
    <style>{`:root{--dt-tinta-alta:${tintaCss(tinta.alta, "var(--color-cream-deep)")};--dt-op-lg:${tinta.objectPosition.lg};--dt-op-sotto:${tinta.objectPosition.sotto};--dt-testa-ar:${tinta.sorgente[0]} / ${tinta.sorgente[1]}}`}</style>
  );

  /* Il blocco dei testi, centrato come «Perfect sea views» di era-residence (A41 di
     Alberto, 20 set. 2026: «preferisco il layout centrato tipo Perfect sea views»),
     in tre livelli dentro i 100svh della foto:
     - in alto il lead (il paragrafo breve di era), centrato, largo al massimo 40rem;
     - al centro l'occhiello (senza trattino: `eyebrow--center`), l'H1 per lettera
       (A20 di Alberto: SplitTitle spezza nel server le stringhe, il <br/> e la span
       dei chiamanti, e dà all'h1 il nome accessibile intero) e la calligrafia, che
       attraversa l'ultima riga del titolo (`.script-word`; sulla testa il tuck vale
       0, D185) e sta un poco a destra del centro, come una firma;
     - in basso il bottone rosso pieno e, sotto, il link fantasma a 18 px (D174).
     Tutto bianco e nudo (A40). La testa è un gruppo (spec §2.5; A20): i tre livelli
     si armano insieme sopra la piega; il livello del piede è un gruppo annidato (D50).
     Il blocco è `.dt-testa_blocco` (globals.css): in flusso, sopra la foto sticky,
     alto almeno 100svh, con la griglia a tre righe (auto 1fr auto). */
  const capo = (
    <div className="dt-testa_capo w-full">
      <Reveal>
        <Lead className="mx-auto max-w-[40rem] !text-white text-center">{subcopy}</Lead>
      </Reveal>
    </div>
  );
  const centro = (
    <div className="dt-testa_centro w-full text-center text-white">
      <Reveal>
        <span className="eyebrow eyebrow--center !text-white">{eyebrow}</span>
      </Reveal>
      <div className="mt-5">
        <SplitTitle as="h1" className={TITLE}>
          {title}
        </SplitTitle>
        {scriptWord && (
          <ScriptWord className="!text-white pl-[18vw] lg:pl-[10vw] lg:!text-[clamp(2.6rem,5.6vw,6rem)]">
            {scriptWord}
          </ScriptWord>
        )}
      </div>
    </div>
  );
  const piede = (
    <RevealGroup className="dt-testa_piede w-full text-white">
      <div>
        <Reveal role="still">
          <div className="flex flex-col items-center gap-y-4">
            <Cta href={primary.href} variant="cta-solid" size="lg">
              {primary.label}
            </Cta>
            {secondary && (
              <Cta href={secondary.href} variant="ghost-dark" arrow={false} className="dt-btn--ghost-testa">
                {secondary.label}
              </Cta>
            )}
          </div>
        </Reveal>
      </div>
    </RevealGroup>
  );
  const blocco = (
    <RevealGroup className="dt-testa_blocco">
      {capo}
      {centro}
      {piede}
    </RevealGroup>
  );

  /* Le prove sono corpo di testo (19 px) col trattino rosso dell'eyebrow
     davanti, sull'avorio sotto la foto, nella colonna del lead (§3.1): si
     leggono come una riga di garanzie. */
  const punti = trust?.length ? (
    <div className={`${GRIGLIA} pt-[clamp(1.5rem,4vh,2.5rem)] pb-[clamp(1.5rem,4vh,2.5rem)]`}>
      <ul className="flex flex-col gap-y-3 text-body text-stone sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8">
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
  ) : null;

  return (
    <>
      {stile}
      <PageHeroTesta id={id} src={image} alt={alt} ratio={tinta.sorgente[0] / tinta.sorgente[1]} blocco={blocco}>
        {punti}
      </PageHeroTesta>
    </>
  );
}
