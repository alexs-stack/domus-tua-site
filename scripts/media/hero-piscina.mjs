// L'HERO ALTO DELLA HOME, IN NUMERI E NEI SUOI FILE (A49 e A71 di Alberto, 22 settembre 2026).
//
// Chi l'ha chiesto: A49, «non c'è né l'immagine alta che fa da sfondo pagina a schermo intero, né
// l'effetto dello scroll dentro l'immagine perché l'hai tagliata a metà e bloccato lo scroll della
// pagina per l'effetto zoom»; A71, «sì, fallo, anche il voto e i due link. prova a vedere se riesci a
// fare un upscale se ho crediti, sennò fa niente, e falla no-bg così è più bella». La foto è la piscina
// di Raffaela (villa-pool.jpg, 3:2) estesa a 2:3 con Higgsfield (outpaint + upscale 4K, 22 set., sera:
// `hero-raffaela-piscina-alta.jpg`, 2560×3812) e col cielo trasparente da scripts/media/cielo.mjs (la
// voce `hero-raffaela-piscina-alta`): `hero-raffaela-piscina-alta-cielo.webp`.
//
// Cosa scrive, dalla radice del repo (`node scripts/media/hero-piscina.mjs`), dopo cielo.mjs:
// - `public/images/reali/hero-raffaela-piscina-alta-m-cielo.webp`: la STRISCIA 9:16 del telefono,
//   ritagliata dal WebP alto (x 208 → 2352, cioè 2144 px centrati su 2560; l'alpha del cielo resta
//   lossless come in cielo.mjs). Scelta mia (D-A49): sotto i 768 la 2:3 a tutta larghezza è alta 581 px
//   a 390 e lascia 180 px di carta nel primo schermo; la 9:16 è alta 693, riempie la banda, tiene
//   Raffaela un sesto più grande e il lockup ha più acqua sotto. Raffaela sta al centro (x 0,51 della
//   foto → 0,51 della striscia) ed è intera; escono 208 px per lato: un pezzo del parapetto a sinistra
//   e del bordo in cotto a destra;
// - `app/lib/motion/hero.json`: le misure che il layout legge (hero.ts, HeroCinematic.tsx, globals.css
//   a mano, hero-alto.test.ts le confronta): per la foto e per la striscia, sorgente [w, h], il cielo
//   (`linea`, `cima`: misuraCielo di cielo.mjs, frazioni dell'altezza) e le bande del segno (`segno`:
//   misuraSegno di tinte.mjs sulla striscia 2-6 % della larghezza — sull'hero la parete e la ringhiera
//   dell'ala sinistra della villa —, dove le tacche del segno virano all'avorio; sul cielo, cioè la
//   carta, e sull'acqua chiara restano grafite). Il file lo scrive questo script, non finestra.mjs.
// I due JPEG di A55 in public/media (`hero-raffaela-piscina.jpg`, `-m.jpg`) restano su disco, non
// montati (Alberto, 22 set.: «lasciali nel repo»).
import sharp from "sharp";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { misuraCielo } from "./cielo.mjs";
import { misuraSegno } from "./tinte.mjs";

const ROOT = process.cwd();
const REALI = "public/images/reali";
const NOME = "hero-raffaela-piscina-alta";
const USCITA = "app/lib/motion/hero.json";
/* Il WebP: la qualità di cielo.mjs, alpha lossless. */
const WEBP = { quality: 86, alphaQuality: 100, effort: 4 };
/* La striscia 9:16: 3812 × 9 / 16 = 2144,25 → 2144 px, centrati (208 per lato). */
const TELEFONO = { left: 208, width: 2144 };

const src = join(ROOT, REALI, `${NOME}-cielo.webp`);
if (!existsSync(src)) throw new Error(`manca ${src}: lancia prima node scripts/media/cielo.mjs <dir> ${NOME}`);

/** Le misure di un WebP con alpha: sorgente, cielo e bande del segno. */
async function misura(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = new Uint8Array(info.width * info.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  return { sorgente: [info.width, info.height], cielo: misuraCielo(alpha, info.width, info.height), segno: misuraSegno(data, info.width, info.height) };
}

const meta = await sharp(src).metadata();
if (meta.width !== 2560 || meta.height !== 3812) throw new Error(`${NOME}-cielo.webp è ${meta.width}×${meta.height}, attesa 2560×3812`);

// 1. La striscia del telefono, dal WebP col cielo (l'alpha viaggia col ritaglio).
const outM = join(ROOT, REALI, `${NOME}-m-cielo.webp`);
const tel = await sharp(src).extract({ left: TELEFONO.left, top: 0, width: TELEFONO.width, height: meta.height }).webp(WEBP).toFile(outM);
console.log(`${NOME}-m-cielo.webp  ${tel.width}×${tel.height}  ${Math.round(tel.size / 1024)} KB`);

// 2. Le misure dei due file.
const foto = await misura(src);
const telefono = await misura(outM);
const esito = {
  file: `/images/reali/${NOME}-cielo.webp`,
  ...foto,
  telefono: { file: `/images/reali/${NOME}-m-cielo.webp`, ...telefono },
};
writeFileSync(join(ROOT, USCITA), `${JSON.stringify(esito, null, 2)}\n`);
const riga = (m) => `cielo cima ${m.cielo.cima} linea ${m.cielo.linea}, segno ${m.segno.map(([a, b]) => `${a}-${b}`).join(" ") || "mai"}`;
console.log(`${USCITA}: foto ${foto.sorgente.join("×")} ${riga(foto)}; telefono ${telefono.sorgente.join("×")} ${riga(telefono)}`);
console.log("fatto");
