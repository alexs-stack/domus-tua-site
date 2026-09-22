// LA FINESTRA DI OPEN DOMUS, IN NUMERI (A47 di Alberto, 22 settembre 2026).
//
// Chi l'ha chiesto: A47 («qua perchè hai tagliato l'immagine, deve continuare, abbiamo fatto le
// immagini alte apposta per poterci scrollare a schermo intero senza uscire dalla foto»; poi, con
// lo screenshot della finestra: «questa immagine è tagliata? se si mettila completa e scrivici
// sopra come hai fatto con le altre pagine» e «questa sezione va sopra l'immagine di open domus»).
//
// Cosa fa: legge il WebP col cielo trasparente della facciata che sale (cielo.mjs, la voce
// `villa-facciata-sale-alta`, 9:16) e scrive app/lib/motion/finestra.json con le misure che il
// layout della finestra legge (finestra.ts e OpenDomus.tsx; globals.css le porta a mano e
// finestra.test.ts le confronta): la sorgente [w, h], il cielo (`linea`, `cima`: misuraCielo di
// cielo.mjs, frazioni dell'altezza) e le bande del segno (`segno`: misuraSegno di tinte.mjs sulla
// striscia 2-6 % della larghezza, come per le teste: dove la foto è opaca e scura — le travi di
// legno delle pergole — le tacche del segno virano all'avorio; sui muri bianchi, sul travertino e
// sul cielo, cioè la carta, restano grafite). Come tinte.mjs per le rotte, ma la finestra non è una
// rotta: ha il suo file.
//
// Uso, dalla radice del repo, dopo cielo.mjs:  node scripts/media/finestra.mjs
import sharp from "sharp";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FOTO, fileCielo, misuraCielo } from "./cielo.mjs";
import { misuraSegno } from "./tinte.mjs";

const ROOT = process.cwd();
const USCITA = "app/lib/motion/finestra.json";
const NOME = "villa-facciata-sale-alta";

const foto = FOTO.find((f) => f.nome === NOME);
if (!foto) throw new Error(`cielo.mjs non conosce ${NOME}`);
const file = fileCielo(foto);
const percorso = join(ROOT, "public", file);
if (!existsSync(percorso)) throw new Error(`manca ${file}: lancia prima node scripts/media/cielo.mjs`);

const { data, info } = await sharp(percorso).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const alpha = new Uint8Array(info.width * info.height);
for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
const cielo = misuraCielo(alpha, info.width, info.height);
const segno = misuraSegno(data, info.width, info.height);

const esito = { file, sorgente: [info.width, info.height], cielo, segno };
writeFileSync(join(ROOT, USCITA), `${JSON.stringify(esito, null, 2)}\n`);
console.log(
  `${USCITA}: ${file} ${info.width}×${info.height}, cielo cima ${cielo.cima} linea ${cielo.linea}, segno ${segno.map(([a, b]) => `${a}-${b}`).join(" ") || "mai"}`,
);
