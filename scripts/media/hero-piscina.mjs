// L'HERO DELLA HOME DALLA FOTO VERA DELLA PISCINA (A55 di Alberto, 22 settembre 2026).
//
// Chi l'ha chiesto: A55, «vorrei invertire le posizioni di questa immagine con quella della hero»,
// con lo screenshot della riga «Acquista casa con più risposte e meno dubbi» di Paths: la foto vera
// di Raffaela davanti alla villa con piscina (`public/images/reali/villa-pool.jpg`, 1920×1280, 3:2)
// diventa l'hero della home, e la scena generata con Higgsfield (`hero-raffaela-villa.jpg`,
// foto-alte.mjs) prende il suo posto in Paths.
//
// Cosa scrive, in public/media, con sharp e senza metadati (villa-pool.jpg porta un segmento APP1;
// media-file.test.ts vuole i JPEG puliti):
// - `hero-raffaela-piscina.jpg` 1920×1280: la foto intera, ricodificata (mozjpeg 85), per il desktop
//   (da 768: il `<source>` di HeroCinematic.tsx). Raffaela sta al centro (corpo 940→1040): per questo
//   il lockup della banda è sceso in basso a destra, sull'acqua (A55, HeroCinematic.tsx);
// - `hero-raffaela-piscina-m.jpg` 720×1280: il 9:16 del telefono, la striscia da x 660 con Raffaela
//   al 39-53 % della larghezza e la palma alla sua sinistra.
//
// La sagoma del preloader NON cambia: Alberto, nello stesso giro, «e se usassimo la maschera del
// preloader vecchia di Raffaela? La preferisco, e poi all'entrata ci sarà la foto nuova, la maschera
// se ne va via con l'entrata ad arco sulla hero». Restano `raffaela-sagoma-villa.webp` e `-m.webp`
// (foto-alte.mjs, il ritaglio in pizzo in basso a sinistra), che con questa foto non coincidono più
// con la figura sotto: la sagoma è la figura del preloader, e l'arco la porta via. Un ritaglio di
// Raffaela dalla foto della piscina (background remover di Higgsfield, job 8edab310) era stato
// provato e scartato con quella risposta.
//
// Uso, dalla radice del repo:  node scripts/media/hero-piscina.mjs
import sharp from "sharp";
import { join } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "public/images/reali/villa-pool.jpg");
const MEDIA = join(ROOT, "public/media");
const JPG = { quality: 85, mozjpeg: true, chromaSubsampling: "4:2:0" };
/** La striscia 9:16 del telefono. */
const TELEFONO = { left: 660, top: 0, width: 720, height: 1280 };
const mib = (n) => `${(n / 1048576).toFixed(2)} MiB`;

const meta = await sharp(SRC).metadata();
if (meta.width !== 1920 || meta.height !== 1280) throw new Error(`villa-pool.jpg è ${meta.width}×${meta.height}, attesa 1920×1280`);

// 1. L'hero del desktop: la foto intera, senza metadati.
const desk = await sharp(SRC).jpeg(JPG).toFile(join(MEDIA, "hero-raffaela-piscina.jpg"));
console.log(`hero-raffaela-piscina.jpg  ${desk.width}×${desk.height}  ${mib(desk.size)}`);

// 2. L'hero del telefono: la striscia 9:16.
const tel = await sharp(SRC).extract(TELEFONO).jpeg(JPG).toFile(join(MEDIA, "hero-raffaela-piscina-m.jpg"));
console.log(`hero-raffaela-piscina-m.jpg  ${tel.width}×${tel.height}  ${mib(tel.size)}`);
console.log("fatto");
