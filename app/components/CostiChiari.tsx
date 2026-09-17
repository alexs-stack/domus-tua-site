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
// le discendenti del Playfair a interlinea 0.95). In home la riga è seguita da una banda:
// il loop dell'acqua largo quanto la riga, che sale quando arriva in scena (A20 di
// Alberto, spec §3.13, D25; solo con `acqua`, D28). Su /vendi resta la riga sola.

import Image from "next/image";
import { useRef } from "react";
import Reveal from "./Reveal";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import { Cta } from "./primitives/Cta";
import { useDict, useLocale } from "./i18n/LocaleProvider";
import type { Locale } from "../lib/i18n/dictionaries";
import { ambient } from "../lib/media";
import { gsap, useGSAP } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { chapters } from "../lib/motion/chapters";
import { clipClosed, clipOpen } from "../lib/motion/clip";
import { useAmbientVideo } from "./motion/useAmbientVideo";

// `first`, `noSale`, `includedLabel`, `included`: conservati dal blocco
// precedente; oggi non hanno più una riga propria.
type Copy = {
  eyebrow: string;
  title: string;
  scriptWord: string;
  lead: string;
  included: string;
  first: string;
  noSale: string;
  includedLabel: string;
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
  },
};

export default function CostiChiari({
  // `surface` resta nella firma per i chiamanti (home, /vendi) ma è inerte:
  // il fondo è uno solo, l'avorio, e le bande non si alternano più.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  surface = "paper",
  acqua = false,
}: {
  /** Conservata per compatibilità: il fondo è sempre `bg-cream`. */
  surface?: "paper" | "cream";
  /** La banda dell'acqua sotto la riga: solo in home (D28). */
  acqua?: boolean;
}) {
  const { locale } = useLocale();
  const d = useDict();
  const c = copy[locale];
  const bandRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Il loop dell'acqua (spec §3.13): da 768 px, in vista, con motion ok; a 390 e
  // con reduced-motion resta il poster. Senza `acqua` i ref restano vuoti e il hook non fa nulla.
  useAmbientVideo(videoRef, bandRef, { sources: { hd: ambient.acqua.hd } });

  // Capitolo 12 (A20 di Alberto, spec §3.13; D25): l'acqua sale a tempo, non in
  // scrub. La banda si apre dal basso quando passa la linea dell'80 % dello
  // schermo e si richiude verso il basso quando ci torna sotto (C22); uscendo
  // dall'alto resta aperta. Stato chiuso solo se al montaggio la banda è sotto
  // lo schermo. Rete a 2.500 ms se è in vista e chiusa, solo finché l'IO non ha
  // deciso. Firma e tratto d'uscita (ease e durata dalla nota) in chapters.ts.
  useGSAP(
    () => {
      const band = bandRef.current;
      if (!acqua || !band) return;
      const s = chapters.costi.signature;
      if (!("dur" in s.time) || !("io" in s.trigger)) {
        throw new Error("chapters.costi: Costi chiari vuole una firma a tempo con innesco IntersectionObserver");
      }
      const uscita = chapters.costi.secondary?.find((t) => t.note.startsWith("uscita"));
      const secondi = uscita ? /(\d+),(\d+) s/.exec(uscita.note) : null;
      if (!uscita || !secondi) {
        throw new Error("chapters.costi: manca il tratto «uscita» con la durata in secondi");
      }
      const outDur = Number(`${secondi[1]}.${secondi[2]}`);
      const outEase = uscita.ease;
      const { dur, delay } = s.time;
      const { rootMargin, threshold } = s.trigger.io;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, (ctx) => {
        let aperta = true;
        if (band.getBoundingClientRect().top > window.innerHeight) {
          gsap.set(band, { clipPath: clipClosed("bottom") });
          aperta = false;
        }
        // I tween che nascono dopo il setup passano da `ctx.add`, così il cambio
        // di preferenza a pagina aperta li revoca con gli altri.
        ctx.add("sale", () => {
          gsap.to(band, { clipPath: clipOpen, duration: dur, delay, ease: s.ease, overwrite: true });
        });
        ctx.add("scende", () => {
          gsap.to(band, { clipPath: clipClosed("bottom"), duration: outDur, ease: outEase, overwrite: true });
        });
        let primo = true;
        // D25 e C22: la rete salva solo una banda che l'osservatore non ha mai deciso.
        let deciso = false;
        let rete = 0;
        const io = new IntersectionObserver(
          ([e]) => {
            const sotto = e.boundingClientRect.top >= (e.rootBounds?.bottom ?? window.innerHeight);
            if (e.isIntersecting && !aperta) {
              aperta = true;
              deciso = true;
              window.clearTimeout(rete);
              ctx.sale();
            } else if (!primo && !e.isIntersecting && sotto && aperta) {
              // Regola del primo avviso, la stessa di Hairline (D22, D25): il primo
              // descrive la posizione di montaggio, e una banda aperta fra la linea
              // e il fondo non scende; l'ingresso invece vale anche al primo avviso
              // (scroll ripristinato al capitolo dopo il montaggio, spec §2.7).
              aperta = false;
              deciso = true;
              window.clearTimeout(rete);
              ctx.scende();
            }
            primo = false;
          },
          { rootMargin, threshold },
        );
        io.observe(band);
        rete = window.setTimeout(() => {
          const r = band.getBoundingClientRect();
          if (!deciso && !aperta && r.top < window.innerHeight && r.bottom > 0) {
            aperta = true;
            ctx.sale();
          }
        }, 2_500);
        return () => {
          io.disconnect();
          window.clearTimeout(rete);
        };
      });
    },
    { dependencies: [acqua], revertOnUpdate: true },
  );

  return (
    <section id="costi" className="bg-cream py-[clamp(1rem,3vh,2rem)]">
      <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-end">
        <div>
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
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
          <Reveal delay={200}>
            <Cta href="#contatti" variant="ghost" className="mt-8">
              {d.hero.ctaValuta}
            </Cta>
          </Reveal>
        </div>
      </div>
      {acqua && (
        <div className="dt-row mt-[clamp(2.5rem,7vh,5rem)]">
          {/* La banda dell'acqua (spec §3.13, D25): larga quanto la riga, 16:9,
              nessuna scritta sopra; `data-bg="foto"` per il monogramma. Il poster
              sta sotto il video, che è trasparente finché non ha un fotogramma. */}
          <div ref={bandRef} data-acqua-band data-bg="foto" className="dt-media-full">
            <Image
              src={ambient.acqua.poster}
              alt=""
              fill
              sizes="(max-width: 767px) 90vw, 84vw"
              quality={75}
              className="object-cover"
            />
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              loop
              playsInline
              preload="none"
              disablePictureInPicture
              disableRemotePlayback
              aria-hidden
              tabIndex={-1}
            />
          </div>
        </div>
      )}
    </section>
  );
}
