// Feed RealSmart FINTO servito su HTTP locale, che CONTA le richieste ricevute.
//
// Perché esiste: il percorso di produzione è quello LIVE (fetch `no-store` del feed XML), e
// alcune proprietà si possono verificare solo lì — che la scheda risponda 200, che uno slug
// inesistente risponda 404, e soprattutto che UNA richiesta di pagina non scarichi il feed più
// di una volta. La modalità mock offline non tocca la rete e quindi non prova nulla di tutto ciò.
//
//   npx tsx scripts/fake-feed.ts [--port 3179] [--file <percorso.xml>]
//
// Endpoint:
//   GET /feed.xml   → la fixture XML (incrementa il contatore)
//   GET /__count    → { "requests": N }  (non incrementa)
//   POST /__reset   → azzera il contatore
//
// Serve SOLO allo sviluppo e alla verifica: non è importato da codice di produzione.

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function argValue(flag: string, fallback: string): string {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const port = Number.parseInt(argValue("--port", "3179"), 10);
const file = argValue("--file", join(process.cwd(), "app/lib/realsmart/__fixtures__/sample-feed.xml"));
const xml = readFileSync(file, "utf8");

let requests = 0;

const server = createServer((req, res) => {
  const url = req.url ?? "/";

  if (url.startsWith("/__count")) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ requests }));
    return;
  }

  if (url.startsWith("/__reset")) {
    requests = 0;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ requests }));
    return;
  }

  requests++;
  // `charset=UTF-8` esplicito: senza, il client decodificherebbe in latin1 e gli accenti
  // arriverebbero come mojibake — esattamente il difetto che la checklist live cerca.
  res.writeHead(200, { "content-type": "application/xml; charset=UTF-8" });
  res.end(xml);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[fake-feed] ${file}`);
  console.log(`[fake-feed] in ascolto su http://127.0.0.1:${port}/feed.xml`);
});
