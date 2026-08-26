// La PAROLA-DESTINAZIONE del sipario: pathname → nome della pagina in arrivo.
//
// Vive qui, fuori da PageTransition.tsx, per una ragione sola: è una funzione
// pura ed è l'unico pezzo di quel file che si possa mettere sotto test. La
// mappa era una TERZA lista di rotte scritta a mano — disallineata da `nav`
// (app/lib/site.ts) e da SITEMAP_ROUTES (app/sitemap.ts) — e infatti ne
// copriva otto su sedici: «Lavora con noi», «Servizi», «Case vendute», le
// domande frequenti, la valutazione, privacy e cookie cadevano tutte nel
// `default: null`, e il sipario copriva lo schermo col marchio e sotto, dove
// doveva esserci il nome della pagina, non c'era niente.
//
// Il test in __tests__/transitionLabel.test.ts pretende ora un'etichetta per
// OGNI rotta pubblica dichiarata nel sitemap: la prossima pagina aggiunta
// senza la sua voce fa fallire la suite invece di nascere muta.
import type { Dict } from "../../lib/i18n/dictionaries";

/* Ripiego per una rotta che nessuno ha mappato: l'ultimo segmento dell'URL,
   da kebab a frase («/nuova-pagina» → «Nuova pagina»). Non è tradotto — gli
   slug del sito sono italiani — ed è volutamente il ripiego e non la regola.
   Serve perché una pagina aggiunta domani non torni MUTA anche solo per il
   tempo che passa fra il deploy e il test rosso. */
function labelFromSlug(path: string): string | null {
  const slug = path.split("/").filter(Boolean).pop();
  if (!slug) return null;
  const words = slug.replace(/[-_]+/g, " ").trim();
  if (!words) return null;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Nome della pagina in arrivo, tradotto, oppure null se non va annunciata.
 *
 * Le parole vengono dal dizionario che le ha già in cinque lingue: `nav.*` per
 * le pagine del menu, `footer.*` per quelle che vivono solo in fondo. Nessuna
 * copy nuova da tradurre a mano: sono le stesse etichette che l'utente ha
 * appena letto nel link su cui ha cliccato.
 */
export function labelForPath(rawPath: string, d: Dict): string | null {
  const path =
    rawPath.length > 1 && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;
  const { nav, footer } = d;
  if (path === "/") return "Domus Tua"; // nome proprio: identico in ogni lingua
  // Le schede /case/<slug> e il vecchio indice /case (redirect 301 a /acquista,
  // next.config.ts:67). Confronto ESATTO sull'indice: rilassare il prefisso a
  // "/case" farebbe cadere qui dentro anche /case-vendute, che ha un nome suo.
  if (path === "/case" || path.startsWith("/case/")) return nav.case;
  switch (path) {
    case "/vendi":
      return nav.vendi;
    case "/acquista":
      return nav.acquista;
    case "/metodo":
      return nav.metodo;
    case "/servizi":
      return nav.servizi;
    case "/open-domus":
      return nav.openDomus;
    case "/recensioni":
      return nav.recensioni;
    case "/chi-siamo":
      return nav.chiSiamo;
    case "/lavora-con-noi":
      return nav.lavora;
    case "/contatti":
      return nav.contatti;
    case "/valutazione-immobile-tradate":
      return nav.valutazione;
    case "/case-vendute":
      return footer.caseVendute;
    case "/domande-frequenti":
      return footer.faq;
    case "/privacy":
      return footer.privacy;
    case "/cookie":
      return footer.cookie;
    // Pagine di servizio interne (redazione d'area, anteprime di territorio):
    // in produzione fanno notFound(), e non sono pagine del sito pubblico.
    // Il sipario non le annuncia.
    case "/area-review":
    case "/territory-preview":
      return null;
    default:
      return labelFromSlug(path);
  }
}

/**
 * Corpo della parola-destinazione, in funzione di quanto è lunga.
 *
 * Il layer è `whitespace-nowrap`: con una misura fissa le etichette nuove più
 * lunghe di quelle storiche — «Lavora con noi» (14), «Domande frequenti» (17)
 * contro i 12 di «Metodo Domus» — arrivavano al bordo su un telefono da
 * 360px, dove il clamp è già al suo minimo. Tre scaglioni bastano: la parola
 * resta grande dov'è corta e rientra dove è lunga.
 */
export function wordFontSize(text: string): string {
  if (text.length > 15) return "clamp(1.6rem, 4.4vw, 4.25rem)";
  if (text.length > 11) return "clamp(2.1rem, 5.6vw, 5.5rem)";
  return "clamp(2.75rem, 7.5vw, 7rem)";
}
