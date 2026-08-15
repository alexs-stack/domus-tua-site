"use client";

// Montaggio della misurazione. Un file solo, così il layout resta leggibile e c'è un
// unico posto da guardare quando qualcuno chiede «cosa manda dati fuori da qui?».
//
// DUE COSE, NON UNA
//  • Analytics    → pagine viste e conversioni (vedi app/lib/analytics.ts).
//  • SpeedInsights → Core Web Vitals sul traffico VERO. È il punto 34 della checklist,
//    che chiede i vitals «con dati reali di traffico, non solo in laboratorio»: oggi
//    l'unica misura è lighthouserc.js, cioè un laboratorio con una rete simulata e nessun
//    telefono vero. Un LCP buono in laboratorio e pessimo in 4G a Tradate è esattamente il
//    tipo di divergenza che questo chiude.
//
// PERCHÉ NON PASSA DAL GATE DEL CONSENSO
// La regola di app/lib/consent.ts — «chi carica script o iframe di terze parti DEVE passare
// da qui» — nasce dal widget Trustindex, che si caricava prima di qualsiasi scelta e
// scriveva cookie propri. Qui non c'è nessuna delle due cose: lo script è servito in
// prima parte da /_vercel/insights, non scrive cookie e non legge nulla dal dispositivo,
// quindi non c'è niente su cui chiedere il consenso *cookie*. Il resto degli obblighi
// (nomina del responsabile nell'informativa) è nel commento di app/lib/analytics.ts.
//
// In sviluppo i due componenti non inviano nulla: si accendono in produzione. Restano
// montati comunque, perché un `if (production)` qui vorrebbe dire che il percorso che va
// in produzione non è mai quello che si è provato.

import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  CONVERSIONS,
  CONVERSION_SOURCES,
  trackConversion,
  type ConversionSource,
} from "../lib/analytics";

/**
 * Punti di partenza dichiarati dai contenitori via `data-conv-source`. Derivato
 * dall'elenco unico in app/lib/analytics.ts: un Set scritto a mano qui si sarebbe
 * disallineato al primo valore nuovo, e il sintomo sarebbe stato un attributo valido
 * per TypeScript che questo listener scarta senza dire niente.
 */
const KNOWN_SOURCES: ReadonlySet<string> = new Set(CONVERSION_SOURCES);

/**
 * Da dove è partito il clic. Prima si guarda l'etichetta esplicita del contenitore, poi si
 * ripiega sul punto di riferimento del documento: così un link nuovo viene comunque
 * attribuito a qualcosa di sensato invece di sparire in un "altro".
 */
function sourceOf(el: Element): ConversionSource {
  const declared = el.closest<HTMLElement>("[data-conv-source]")?.dataset.convSource;
  if (declared && KNOWN_SOURCES.has(declared)) return declared as ConversionSource;
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  if (el.closest("form")) return "modulo";
  return "fluttuante";
}

export default function SiteAnalytics() {
  // UN SOLO ASCOLTATORE, non dodici onClick.
  //
  // WhatsApp e telefono compaiono in dodici punti del sito (testata, footer, barra mobile,
  // bolla fluttuante, ricerca, scheda immobile, pagina contatti…). Attaccare un onClick a
  // ciascuno vuol dire due cose: dodici modifiche adesso, e la certezza che il tredicesimo
  // link — quello che qualcuno aggiungerà fra tre mesi — non venga contato, senza che
  // nessuno se ne accorga. La delega sul documento cattura anche quello.
  //
  // `capture: true` perché alcuni di questi link vivono dentro componenti che fermano la
  // propagazione per gestire il proprio stato; in cattura l'evento passa comunque di qui
  // prima di arrivarci. E il listener è passivo rispetto alla navigazione: NON chiama
  // preventDefault, quindi il clic fa quello che ha sempre fatto anche se `track` fallisce.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;

      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("tel:")) {
        trackConversion(CONVERSIONS.telefono, sourceOf(link));
        return;
      }
      // wa.me e api.whatsapp.com sono le due forme che il sito produce (link diretti e
      // messaggi precompilati costruiti da buildWhatsAppUrl).
      if (href.includes("wa.me/") || href.includes("api.whatsapp.com")) {
        trackConversion(CONVERSIONS.whatsapp, sourceOf(link));
      }
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return (
    <>
      <Analytics
        // Rete di sicurezza sulle URL, non decorazione. Il sito non mette dati personali
        // nei parametri (i filtri della ricerca sono comune, prezzo, tipologia), ma questo
        // è l'unico punto in cui un indirizzo di pagina esce dal browser: se un domani una
        // rotta si portasse dietro qualcosa di identificabile, verrebbe tagliato qui
        // invece di finire in un pannello di analisi.
        beforeSend={(event) => {
          try {
            const url = new URL(event.url);
            for (const key of ["email", "tel", "telefono", "phone", "nome", "name", "token"]) {
              url.searchParams.delete(key);
            }
            return { ...event, url: url.toString() };
          } catch {
            return event;
          }
        }}
      />
      <SpeedInsights />
    </>
  );
}
