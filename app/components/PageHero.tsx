import type { ReactNode } from "react";
import tinte from "../lib/motion/tinte.json";
import { cieloH } from "../lib/motion/testa";
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
   Gli span dei chiamanti (`text-red-soft`, nato per l'hero scuro) sull'avorio
   non si leggono (#fbeaea): il titolo è di un colore solo, l'inchiostro (D184,
   A46). */
const TITLE =
  "mx-auto max-w-[18ch] font-display text-[clamp(3rem,9vw,9rem)] leading-[0.92] [&_span]:text-inherit lg:text-[clamp(3.5rem,7vw,8rem)]";

/* La riga dei tre punti sotto la foto: la griglia di sempre (`dt-row`), centrata
   come il blocco. */
const GRIGLIA = "dt-row";

/* «LA TESTA DI ERA» (A38 di Alberto, 20 settembre 2026; brief T, D172-D198):
   «quando entri nella foto a schermo intero, la foto stessa diventa lo sfondo,
   e le scritte sopra». Il riferimento è «Perfect sea views» di era-residence.
   Questo file non ha hook né "use client" (spec §5.1: «PageHero resta server»);
   lo importano gli undici *Content.tsx, che sono client, e PageHeroTesta
   (client) riceve i figli React così come li compone.

   Un ramo solo (D175): la carta è il primo pixel della pagina, sotto la testata
   trasparente (PageHeroTesta), e in cima, nella griglia, stanno occhiello, H1,
   calligrafia, lead e i due comandi; poi la foto alta, poi i tre punti. Le nove
   rotte e i due legali seguono lo stesso passo: lo dice `tinte.json` per rotta,
   con la foto, la sorgente, le due inquadrature (D180: `lg` e `sotto`) e, da
   A46, il cielo. Sul telefono la stessa testa, colonna unica (D177).

   IL CIELO MASCHERATO (A46 di Alberto, 21 set. 2026, sera: «su eraresidence
   questa foto che usa come background alta ha il cielo mascherato, è no bg: ecco
   perché sembra un tutt'uno il cielo con il colore dello sfondo del sito.
   Dobbiamo fare la stessa cosa nel nostro sito, dove ci sono le immagini così
   alte»). Le sette teste col cielo montano il WebP con l'alpha
   (`tinta.cielo.file`, scripts/media/cielo.mjs) al posto del JPEG: il cielo è
   trasparente e la villa posa sulla carta. Le scritte, che con A38/A40 stavano
   «nel cielo» in bianco nudo, tornano nell'inchiostro della rivista — occhiello
   rosso, H1 `text-ink`, lead grafite, corsivo rosso, bottone rosso pieno, link
   fantasma inchiostro (`ghost`, non più `ghost-dark`) — e stanno SOPRA il
   soggetto, mai sopra la foto: il bianco nudo valeva per il cielo fotografato,
   che non c'è più, e la deroga a WCAG 1.4.3 è chiusa (h1 e lead reggono 4,5:1
   sulla carta, e2e/a11y.spec.ts). Regola unica per le undici teste: dove la
   foto non ha cielo (i due attici, i due legali, la tenda di /open-domus) il
   blocco sta comunque sull'avorio e la foto comincia sotto i comandi. Le classi
   sono quelle di sempre, senza `!` (`.eyebrow`, `.lead`, `.script-word`): il
   sito non ha più una scritta bianca fuori dal rosso e dalle immagini scure
   (ink-media.ts). Niente velo, niente rettangolo, niente gradiente (C14). */

/* LA TINTA DEL PLACEHOLDER, LE INQUADRATURE E IL CIELO NELL'HTML INIZIALE (D78,
   D125, D180, D187, A46): `scripts/media/tinte.mjs` misura la banda alta della
   foto e scrive `tinte.json`, committato; qui il server emette in uno <style>
   nell'HTML iniziale la tinta (il fondo dello STRATO della foto prima del
   decode, D125), le due inquadrature per fascia (`--dt-op-lg` / `--dt-op-sotto`:
   il CSS sceglie `--dt-op`), il rapporto della foto (`--dt-testa-ar`) e la CIMA
   del soggetto in frazione della larghezza (`--dt-cielo-h`: `cielo.cima` di
   tinte.json, la prima riga in cui almeno il 5 % dei pixel è opaco — sopra c'è
   solo cielo, cioè carta —, tradotta da `cieloH` di testa.ts): globals.css ne fa il margine negativo dello strato
   (`calc(-100% * var(--dt-cielo-h))`), così il soggetto comincia al fondo del
   blocco e nessuna lettera gli sta sopra. Non `cielo.linea` (la riga in cui il
   soggetto riempie la larghezza): su /vendi la linea sta a 0,488 ma i cipressi
   cominciano a 0,219 e il tetto a 0,33, e con la linea l'H1 posava sui cipressi
   e il bottone sul tetto (misurato il 21 set. sul build a 1440×900). Vale senza
   JS, con reduced-motion, senza fetch
   e senza FOUC. Le BANDE DEL SEGNO (`tinta.segno`, 22 set. 2026, rilievi C01/G02 della
   revisione di A46: le corse in cui la striscia del segno, 2-6 % della larghezza, è
   opaca e scura) passano a PageHeroTesta come prop, che ne fa un marcatore `foto` per
   corsa: sul cielo trasparente e sui muri bianchi il segno resta grafite. Lo <style> sta nell'albero del componente e non in <head> con
   `precedence`, così cambia con la pagina a ogni navigazione client
   (e2e/a28.spec.ts, «le tinte»). Dove il JSON dichiara `"avorio"` esce un
   TOKEN, mai un quarto colore (D124): col cielo trasparente il fondo si vede
   attraverso la foto per sempre, quindi il token è il FONDO PAGINA,
   `--color-cream` (A46); sugli interni resta la tinta misurata, sul solo strato. */
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
  tightTitle = false,
}: {
  /** Ancora della sezione (es. "top" per i link di risalita). */
  id?: string;
  /** La rotta, chiave di `tinte.json` (D78, D122). È il chiamante a dirla: PageHero
      è server e un componente server non conosce il pathname. */
  rotta: keyof typeof tinte;
  eyebrow: string;
  title: ReactNode;
  subcopy: string;
  /** La fotografia sorgente: la stessa di `tinte.json` per la rotta (tinte.test.ts lo pretende); l'inquadratura
      viene dal JSON (D180). Dove la rotta ha il cielo mascherato (A46) si monta `tinta.cielo.file`, il WebP con
      l'alpha, e questa resta la sorgente di riserva. */
  image: string;
  alt: string;
  primary: CTA;
  secondary?: CTA;
  trust?: string[];
  /** Parola-ornamento in corsivo, una per pagina (es. "Vendere"), rossa sull'avorio come nel resto
      della rivista (A46). Le pagine legali non la passano. */
  scriptWord?: string;
  /** Pavimento dell'H1 più basso sotto lg (2,5rem invece di 3rem) per la LINGUA in cui
      una parola sola del titolo non entra nei 324 px della colonna a 360 px:
      «Besichtigung.» di /open-domus in tedesco (368 px a 48 px) e «currículums.» di
      /lavora-con-noi in spagnolo (356 px). Audit del 21 settembre 2026 (blocco 23),
      difetto V04: taglia più piccola, mai testo nascosto né lettere spezzate. Il
      chiamante lo passa legato alla lingua (`tightTitle={locale === "de"}`): il primo
      giro lo passava secco e l'H1 scendeva a 40 px in tutte e cinque le lingue su due
      rotte, così chi legge in italiano vedeva due testate di taglia diversa senza una
      ragione visibile (revisori del 21 settembre). Le altre nove teste restano al
      pavimento di 3rem in ogni lingua; scala-telefono.test.ts lo pinna. */
  tightTitle?: boolean;
}) {
  const tinta = tinte[rotta];
  const stile = (
    <style>{`:root{--dt-tinta-alta:${tintaCss(tinta.alta, "var(--color-cream)")};--dt-op-lg:${tinta.objectPosition.lg};--dt-op-sotto:${tinta.objectPosition.sotto};--dt-testa-ar:${tinta.sorgente[0]} / ${tinta.sorgente[1]};--dt-cielo-h:${cieloH(tinta.cielo.cima, tinta.sorgente)}}`}</style>
  );

  /* Il blocco dei testi, centrato come «Perfect sea views» di era-residence (A41 di
     Alberto, 20 set. 2026: «preferisco il layout centrato tipo Perfect sea views»),
     in tre livelli sull'avorio sopra il soggetto (A46):
     - in alto il lead (il paragrafo breve di era), centrato, largo al massimo 40rem;
     - al centro l'occhiello (senza trattino: `eyebrow--center`), l'H1 per lettera
       (A20 di Alberto: SplitTitle spezza nel server le stringhe, il <br/> e la span
       dei chiamanti, e dà all'h1 il nome accessibile intero) e la calligrafia, che
       attraversa l'ultima riga del titolo (`.script-word`; sulla testa il tuck vale
       0, D185) e sta un poco a destra del centro, come una firma;
     - in basso il bottone rosso pieno e, sotto, il link fantasma a 18 px (D174).
     Nell'inchiostro della rivista (A46): nessun `color` nel CSS della testa, le
     classi di sempre nel markup. La testa è un gruppo (spec §2.5; A20): i tre livelli
     si armano insieme sopra la piega; il livello del piede è un gruppo annidato (D50).
     Il blocco è `.dt-testa_blocco` (globals.css): in flusso, sopra lo strato della
     foto, alto quanto il contenuto (e almeno 100svh da lg), con la griglia a tre
     righe (auto 1fr auto); la foto sale sotto di lui fino alla cima del soggetto. */
  const capo = (
    <div className="dt-testa_capo w-full">
      <Reveal>
        <Lead className="mx-auto max-w-[40rem] text-center">{subcopy}</Lead>
      </Reveal>
    </div>
  );
  const centro = (
    <div className="dt-testa_centro w-full text-center text-ink">
      <Reveal>
        <span className="eyebrow eyebrow--center">{eyebrow}</span>
      </Reveal>
      {/* `tightTitle`: la taglia stretta sta sul contenitore (`[&_h1]`), non su
          TITLE, che resta la classe unica dell'H1 (a28-fallback.test.ts); sotto lg
          batte `text-[clamp(3rem,…)]` per specificità, da lg vale il ramo lg di TITLE. */}
      <div className={tightTitle ? "mt-5 max-lg:[&_h1]:text-[clamp(2.5rem,9vw,9rem)]" : "mt-5"}>
        <SplitTitle as="h1" className={TITLE}>
          {title}
        </SplitTitle>
        {scriptWord && (
          <ScriptWord className="pl-[18vw] lg:pl-[10vw] lg:!text-[clamp(2.6rem,5.6vw,6rem)]">
            {scriptWord}
          </ScriptWord>
        )}
      </div>
    </div>
  );
  const piede = (
    <RevealGroup className="dt-testa_piede w-full">
      <div>
        <Reveal role="still">
          <div className="flex flex-col items-center gap-y-4">
            <Cta href={primary.href} variant="cta-solid" size="lg">
              {primary.label}
            </Cta>
            {secondary && (
              <Cta href={secondary.href} variant="ghost" arrow={false} className="dt-btn--ghost-testa">
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
      <PageHeroTesta id={id} src={tinta.cielo.file ?? image} alt={alt} segno={tinta.segno} blocco={blocco}>
        {punti}
      </PageHeroTesta>
    </>
  );
}
