// La card X/Twitter riusa la stessa immagine di marca dell'OpenGraph.
// I campi di route (runtime/size/…) sono dichiarati qui perché Next li richiede statici
// nel file di convenzione; il generatore dell'immagine è riusato dall'OpenGraph.
import OpengraphImage from "./opengraph-image";

export const runtime = "nodejs";
export const alt = "Domus Tua Immobiliare — Vendere senza stress, acquistare con sicurezza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OpengraphImage;
