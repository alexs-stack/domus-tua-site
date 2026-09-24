// Carica .env.local / .env come fa Next, per gli script eseguiti con tsx.
//
// `next dev` e `next build` leggono .env.local da soli; un `tsx scripts/...` no. Senza
// questo, `npm run eval` gira in modalità simulata anche con la chiave configurata — e il
// report dice "SIMULATA" in una riga sola, che è facile non vedere.
//
// Va importato PER PRIMO: gli import ES vengono valutati in ordine, e i moduli di config
// leggono process.env al momento del caricamento.

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });
