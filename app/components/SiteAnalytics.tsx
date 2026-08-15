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
// ⚠️ PERCHÉ I DUE SCRIPT SONO CONDIZIONATI (e l'ascoltatore no)
// I due componenti caricano `/_vercel/insights/script.js` e
// `/_vercel/speed-insights/script.js`: percorsi che ESISTONO SOLO su un deploy Vercel,
// serviti dal suo edge. Fuori da lì — la CI, un `next start` in locale, un self-host —
// quelle due richieste tornano 404 e il browser aggiunge un secondo errore
// («Refused to execute script … MIME type text/html»). Non è un dettaglio da laboratorio:
// la suite e2e ha una guardia che pretende zero errori di console e zero richieste
// fallite, e li ha visti tutti e quattro. Sarebbe stato rumore anche nella console di un
// utente vero, il giorno in cui il sito girasse altrove.
//
// Quindi la decisione arriva DAL SERVER (`enabled`, calcolato in layout.tsx da
// `process.env.VERCEL`) e non da `NEXT_PUBLIC_VERCEL_ENV`, che è esposto al client solo se
// qualcuno ha lasciato attiva l'opzione giusta nella dashboard — cioè una condizione che
// si rompe in silenzio.
//
// L'ascoltatore delegato resta montato SEMPRE: non fa richieste di rete, e senza script
// `track` accoda e basta. Tenerlo acceso ovunque significa che il comportamento che si
// prova in locale è lo stesso che gira in produzione.

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

export default function SiteAnalytics({
  /**
   * Siamo su Vercel? Lo decide il server (layout.tsx): solo lì esistono gli endpoint
   * `/_vercel/*` che i due script chiedono. Vedi la nota in testa al file.
   */
  enabled,
}: {
  enabled: boolean;
}) {
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

  // Fuori da Vercel gli endpoint non esistono: montare i due script vorrebbe dire due 404
  // e due errori di console a ogni pagina, per nessun dato raccolto in cambio.
  if (!enabled) return null;

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
