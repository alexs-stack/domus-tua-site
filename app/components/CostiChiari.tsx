"use client";

// Il blocco costi — §6.4 del Documento finale di sintesi.
//
// PERCHÉ ESISTE
// «Nessun costo anticipato, si paga solo a vendita conclusa» è probabilmente l'argomento
// di vendita più forte che l'agenzia possiede, e viveva in UN SOLO posto: dentro un
// accordion delle domande frequenti — cioè l'ultimo punto del sito in cui qualcuno lo
// cercherà. Chi sta valutando a chi dare l'incarico si ferma sulla domanda «quanto mi
// costa se poi non vendo?» molto prima di aprire una FAQ.
//
// LA REGOLA DEL LINGUAGGIO (§3.2)
// La gratuità resta, cambia la parola. Niente «gratis»: è registro da volantino e
// suggerisce un calcolatore automatico, cioè svaluta esattamente il servizio che il resto
// della pagina presenta come professionale. «Il primo incontro è senza impegno e senza
// costi» dice la stessa identica cosa e non abbassa il registro.
//
// PERCHÉ NON È UNA PROMESSA DI RISULTATO
// Dice cosa NON si paga e QUANDO si paga: condizioni contrattuali, fatti verificabili sul
// mandato. Non promette che la casa si venda (vedi §3.3 e la FAQ che si rifiuta di
// promettere tempi).
//
// LA FORMA: una RIGA-DICHIARAZIONE, non un capitolo. Il titolo sta a sinistra, il lead e
// il link sulla seconda colonna (la stessa linea verticale delle righe foto+testo), e la
// sezione non ha il padding di capitolo ma un filo di respiro (1-2rem, che tiene dentro
// le discendenti del Playfair a interlinea 0.95). Su /vendi è così.
//
// IN HOME È UN NASTRO (A72 di Alberto, 22 set. 2026, notte: «togliamo il video della piscina, e
// mettiamo un'altra immagine no-bg alta: villa-facciata-piscina-alta-cielo.webp, stesso stile e
// animazione dello sticky scroll che poi diventa scroll orizzontale, ed entra la sezione di Carmine e
// Seguici»; `nastro`, D28; costi.ts). La banda dell'acqua (A20, spec §3.13, D25: il loop che saliva
// dal basso) è uscita dal codice; i suoi file restano nel repo. Quattro pannelli di 100vw, come la
// finestra di Open Domus (A57/A65): (1) la facciata della villa bianca con la piscina, 2:3, intera,
// col cielo trasparente che è la carta e sopra, a destra, il TITOLO in inchiostro (D-A72-1: solo il
// titolo, come «Open Domus»; a destra perché a sinistra ci sono i cipressi e l'inchiostro non vi si
// legge); nel corridoio la scatola della foto SALE — l'arrivo, A65 — finché il tetto piatto della
// villa non arriva a metà delle lettere, poi il track scorre di lato; (2) il CLAIM dei costi
// (occhiello, la prima frase del lead in d2 per lettera, il resto in misura lead, le righe del
// mandato, il rilancio pieno: Alberto, «le scritte e i bottoni sono troppo piccole»); (3) Carmine
// (FeaturedTestimonial `panel`, col sipario del nastro e la foto che affonda); (4) Seguici (Social,
// col titolo grande per lettera). La firma è quella del capitolo
// (chapters.ts `costi`: dtTappe, con due soste sul claim e su Carmine; scrub `true`, il solo track
// saldato allo scroll — la morbidezza è quella di Lenis; D18); l'arrivo è lineare (secondaria).
// Niente coda né cartolina (D-A72-3). Sotto la soglia, con reduced-motion e senza JS i quattro
// pannelli stanno in colonna, la foto è intera e sale sotto il titolo (−30vw: il suo cielo è la
// carta). Le bande del segno (`.dt-cc_soggetto`,
// data-bg="foto": i cipressi, il gelsomino e la vetrata, la piscina) viaggiano con la foto.

import Image from "next/image";
import Reveal from "./Reveal";
import RevealGroup from "./motion/RevealGroup";
import HorizonScroller from "./motion/HorizonScroller";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import FeaturedTestimonial from "./FeaturedTestimonial";
import Social from "./Social";
import { Cta } from "./primitives/Cta";
import { useDict, useLocale } from "./i18n/LocaleProvider";
import type { Locale } from "../lib/i18n/dictionaries";
import { chapters, scrubOf } from "../lib/motion/chapters";
import { COSTI, SIZES_COSTI, arrivoDistance } from "../lib/motion/costi";
// A72: la foto del nastro, il suo cielo e le bande del segno, misurati da scripts/media/finestra.mjs
// sul WebP col cielo trasparente (`node scripts/media/finestra.mjs villa-facciata-piscina-alta
// app/lib/motion/costi.json`), come finestra.json per la finestra.
import foto from "../lib/motion/costi.json";

// `first`, `noSale`, `includedLabel`, `included`: conservati dal blocco
// precedente; oggi non hanno più una riga propria.
// `villaAlt` descrive la foto del nastro (A19, spec 2026-09-13 §7.5): quel che si vede, senza luoghi
// né frasi sulla vendita; il cielo è trasparente (la carta) e l'alt non lo nomina.
type Copy = {
  eyebrow: string;
  title: string;
  scriptWord: string;
  lead: string;
  included: string;
  first: string;
  noSale: string;
  includedLabel: string;
  villaAlt: string;
};

const copy: Record<Locale, Copy> = {
  it: {
    eyebrow: "Quanto costa",
    title: "Nessun costo anticipato.",
    scriptWord: "Nessun anticipo",
    lead: "Si paga solo a vendita conclusa. Valutazione, fotografie professionali, video, home staging e verifica dei documenti sono compresi nel metodo.",
    first: "Il primo incontro è senza impegno e senza costi.",
    noSale: "Se non vendiamo, non ci pagate: non c'è un listino nascosto in fondo al mandato.",
    includedLabel: "Compreso nel metodo",
    included: "Valutazione · Fotografie professionali · Video · Home staging · Verifica dei documenti",
    villaAlt: "Villa bianca con la vetrata del soggiorno, il gelsomino sul pilastro, i cipressi e la piscina a sfioro davanti alle colline",
  },
  en: {
    eyebrow: "What it costs",
    title: "No upfront costs.",
    scriptWord: "No upfront cost",
    lead: "You pay only once the sale is closed. Valuation, professional photography, video, home staging and document checks are part of the method.",
    first: "The first meeting carries no obligation and no cost.",
    noSale: "If we don't sell, you don't pay us: there is no hidden price list at the end of the mandate.",
    includedLabel: "Included in the method",
    included: "Valuation · Professional photography · Video · Home staging · Document checks",
    villaAlt: "White villa with the living-room glass wall, jasmine on the pillar, cypresses and an infinity pool facing the hills",
  },
  fr: {
    eyebrow: "Combien ça coûte",
    title: "Aucun frais d'avance.",
    scriptWord: "Aucune avance",
    lead: "Vous payez seulement une fois la vente conclue. Estimation, photographies professionnelles, vidéo, home staging et vérification des documents font partie de la méthode.",
    first: "Le premier rendez-vous est sans engagement et sans frais.",
    noSale: "Si nous ne vendons pas, vous ne nous payez pas : il n'y a pas de tarif caché au bas du mandat.",
    includedLabel: "Compris dans la méthode",
    included: "Estimation · Photographies professionnelles · Vidéo · Home staging · Vérification des documents",
    villaAlt: "Villa blanche avec la baie vitrée du séjour, le jasmin sur le pilier, les cyprès et la piscine à débordement face aux collines",
  },
  de: {
    eyebrow: "Was es kostet",
    title: "Keine Kosten im Voraus.",
    scriptWord: "Keine Vorauszahlung",
    lead: "Bezahlt wird erst nach erfolgreichem Verkauf. Bewertung, professionelle Fotos, Video, Home Staging und Unterlagenprüfung gehören zur Methode.",
    first: "Das erste Gespräch ist unverbindlich und kostenfrei.",
    noSale: "Verkaufen wir nicht, zahlen Sie nichts: Am Ende des Auftrags steht keine versteckte Preisliste.",
    includedLabel: "In der Methode enthalten",
    included: "Bewertung · Professionelle Fotos · Video · Home Staging · Unterlagenprüfung",
    villaAlt: "Weiße Villa mit der Glasfront des Wohnzimmers, Jasmin am Pfeiler, Zypressen und einem Infinity-Pool vor den Hügeln",
  },
  es: {
    eyebrow: "Cuánto cuesta",
    title: "Sin costes por adelantado.",
    scriptWord: "Sin anticipos",
    lead: "Se paga solo cuando la venta se cierra. Valoración, fotografías profesionales, vídeo, home staging y verificación de los documentos están incluidos en el método.",
    first: "El primer encuentro es sin compromiso y sin coste.",
    noSale: "Si no vendemos, no nos pagáis: no hay una lista de precios escondida al final del mandato.",
    includedLabel: "Incluido en el método",
    included: "Valoración · Fotografías profesionales · Vídeo · Home staging · Verificación de los documentos",
    villaAlt: "Villa blanca con la cristalera del salón, el jazmín en el pilar, los cipreses y la piscina infinita frente a las colinas",
  },
};

/** I marcatori del segno (D34, tema.ts): uno per banda scura della foto, in percentuale dell'altezza (lo schema della finestra). */
function Bande({ segno }: { segno: number[][] }) {
  return (
    <>
      {segno.map(([da = 0, a = 0]) => (
        <span
          key={`${da}-${a}`}
          aria-hidden
          data-bg="foto"
          className="dt-cc_soggetto"
          style={{ top: `${(da * 100).toFixed(2)}%`, bottom: `${((1 - a) * 100).toFixed(2)}%` }}
        />
      ))}
    </>
  );
}

export default function CostiChiari({
  // `surface` resta nella firma per i chiamanti (home, /vendi) ma è inerte:
  // il fondo è uno solo, l'avorio, e le bande non si alternano più.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  surface = "paper",
  nastro = false,
}: {
  /** Conservata per compatibilità: il fondo è sempre `bg-cream`. */
  surface?: "paper" | "cream";
  /** Il nastro con la facciata, Carmine e Seguici (A72): solo in home (D28). Su /vendi resta la riga sola. */
  nastro?: boolean;
}) {
  const { locale } = useLocale();
  const d = useDict();
  const c = copy[locale];
  // Il lead spezzato alla prima frase per il claim del nastro: «Si paga solo a vendita conclusa.» in
  // d2, il resto in misura lead. Su /vendi il lead resta intero.
  const taglio = c.lead.indexOf(". ");
  const claim = taglio > 0 ? c.lead.slice(0, taglio + 1) : c.lead;
  const intro = taglio > 0 ? c.lead.slice(taglio + 2) : "";

  const occhiello = (
    <Reveal>
      <span className="eyebrow">{c.eyebrow}</span>
    </Reveal>
  );
  const rilancio = (
    <Reveal delay={200}>
      <Cta href="#contatti" variant="ghost" className="mt-8">
        {d.hero.ctaValuta}
      </Cta>
    </Reveal>
  );

  if (!nastro) {
    return (
      <section id="costi" className="bg-cream py-[clamp(1rem,3vh,2rem)]">
        <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-end">
          <div>
            {occhiello}
            <SplitTitle as="h2" className="mt-6 font-display text-d2">
              {c.title}
            </SplitTitle>
            {/* Niente parola calligrafica, qui. È l'ornamento del CAPITOLO, e
                questa non è più un capitolo ma una riga: in mezza colonna la
                calligrafia attraversava l'ultima riga del titolo partendo dal
                margine, e «conclusa» spariva sotto la «N» di «Nessun anticipo» —
                che per giunta ripeteva il titolo parola per parola. Il rosso di
                questa riga sono l'eyebrow e il link. */}
          </div>
          {/* Il seguito sulla seconda colonna, alla stessa linea verticale delle
              righe foto+testo: è quel che rende questa una riga e non un capitolo. */}
          <div className="mt-6 lg:mt-0 lg:pl-[6vw]">
            <Lead>{c.lead}</Lead>
            {rilancio}
          </div>
        </div>
      </section>
    );
  }

  /* IL NASTRO (A72; costi.ts; CSS in globals.css, «IL NASTRO DI COSTI CHIARI»). La firma del
     capitolo va al track per prop (D18: dtTappe, scrub true); la salita — l'ARRIVO, A65 — muove solo la
     scatola della foto (`.dt-cc_window`) finché il tetto della villa (COSTI.cimaTitolo) non arriva a
     metà delle lettere del titolo (arrivoDistance), e HorizonScroller la aggiunge all'altezza della
     sezione così il gesto resta 1:1. Il titolo è assoluto sul cielo solo con [data-on]: `offsetTop` si
     legge nel pannello, che nel nastro è `position: relative`, e dentro la riga assoluta. */
  return (
    <HorizonScroller
      id="costi"
      corridor="costi"
      refreshKey={locale}
      className="dt-cc bg-cream"
      ease={chapters.costi.signature.ease}
      scrub={scrubOf("costi")}
      lead={{
        selector: ".dt-cc_window",
        distance: (el) => {
          // A65: il tetto arriva a metà delle lettere del titolo, che sta fermo nella cornice.
          const riga = el.closest<HTMLElement>(".dt-cc_panel")?.querySelector<HTMLElement>(".dt-cc_riga");
          const titolo = riga?.querySelector<HTMLElement>(".dt-cc_titolo");
          const copri = riga && titolo ? riga.offsetTop + titolo.offsetTop + COSTI.copri * titolo.offsetHeight : 0;
          return arrivoDistance({ fotoH: el.offsetHeight, copri });
        },
      }}
    >
      <div className="dt-horizon_panel dt-cc_panel dt-cc_panel--foto">
        {/* Il titolo del capitolo (D-A72-1) sta PRIMA della foto nel DOM (l'ordine di lettura) e, nel
            nastro, sopra di lei nello stacking, sul cielo-carta, A DESTRA (dal 40 % della larghezza: i
            cipressi arrivano al 36 %, e sotto il titolo c'è cielo fino al tetto piatto, che nella salita
            gli passa dietro fino a metà delle lettere, A65). In colonna è in flusso e la carta del cielo lo
            continua. Per lettera (SplitTitle) nella misura del nastro (`.dt-cc_titolo`, 7,5vw: tre righe su 52vw). */}
        <div className="dt-cc_riga dt-row py-20 nastro-colonna:lg:py-[8vh]">
          <SplitTitle as="h2" className="dt-cc_titolo font-display lg:ml-auto lg:w-[52vw] lg:text-right">
            {c.title}
          </SplitTitle>
        </div>
        <div className="dt-cc_cornice">
          <div className="dt-cc_window">
            <Image src={foto.file} alt={c.villaAlt} fill sizes={SIZES_COSTI} className="object-cover" style={{ objectPosition: "50% 0%" }} />
            <Bande segno={foto.segno} />
          </div>
        </div>
      </div>

      <div className="dt-horizon_panel dt-cc_panel dt-cc_panel--claim relative flex items-center">
        {/* Il CLAIM dei costi (D-A72-1), come il secondo pannello della finestra: occhiello, la prima
            frase del lead in d2 per lettera, il resto in misura lead, le due righe del mandato (primo
            incontro senza costi, se non vendiamo non ci pagate) e il rilancio PIENO, quello dell'hero
            (A66: nel nastro le scritte sono grandi). Gruppo del motore dei reveal: entra quando è in
            scena. In colonna prende il passo dei blocchi. */}
        <div className="dt-row w-full py-20 lg:py-0 nastro-colonna:lg:py-[8vh]">
          <RevealGroup className="max-w-[64ch]">
            {occhiello}
            <SplitTitle as="h3" className="mt-6 font-display text-d2">
              {claim}
            </SplitTitle>
            <Lead className="mt-6 max-w-[40ch]">{intro}</Lead>
            <Reveal>
              <p className="mt-6 max-w-[56ch] text-body text-graphite">
                {c.first} {c.noSale}
              </p>
            </Reveal>
            <Reveal role="still">
              <Cta href="#contatti" variant="cta-solid" size="lg" className="mt-8">
                {d.hero.ctaValuta}
              </Cta>
            </Reveal>
          </RevealGroup>
        </div>
      </div>

      <FeaturedTestimonial panel />
      <Social />
    </HorizonScroller>
  );
}
