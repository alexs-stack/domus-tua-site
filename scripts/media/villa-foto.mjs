// Converte le foto e i fermi della villa del video tour per il sito.
//
// Chi l'ha chiesto: D35 (spec 2026-09-13 §1.3), foto senza metadati e con nomi
// neutri; A24 di Alberto (13 settembre), il fermo del quartiere per il pannello
// del territorio e la sala del tour. Com'è fatto oggi: sharp applica
// l'orientamento, porta il lato lungo a 2560 px (il massimo di `deviceSizes`
// in next.config.ts) e scrive JPEG mozjpeg senza EXIF, XMP né IPTC, che sharp
// non copia se non glielo si chiede. Fermi e poster li scrive prima la catena
// ffmpeg di spec §7.2, nella cartella di lavoro fuori dal repo.
//
// Uso, dalla radice del repo in Git Bash (la cartella di lavoro è scritta in ~/.domus-media-work):
//   DT_MEDIA_WORK="$(cygpath -m "$(cat ~/.domus-media-work)")" node scripts/media/villa-foto.mjs
// DT_MEDIA_Q (default 82) abbassa la qualità se un file supera 1.200 KB.
import sharp from "sharp";
import { existsSync } from "node:fs";
import { join } from "node:path";

const SRC = process.env.DT_MEDIA_SRC ?? "C:/Users/alber/Downloads";
const WORK = process.env.DT_MEDIA_WORK;
if (!WORK) {
  console.error("DT_MEDIA_WORK non impostata: è la cartella dove la catena ha scritto fermi e poster.");
  process.exit(1);
}
const Q = Number(process.env.DT_MEDIA_Q ?? 82);

const FOTO = "public/images/reali";
const MEDIA = "public/media";

// `_DSC2014 (1).jpg` è lo stesso file di `_DSC2014.jpg`: non si converte.
const foto = [
  ["_DSC2014.jpg", "villa-portico-tenda"],
  ["_DSC2016.jpg", "villa-piscina-facciata"],
  ["_DSC2022.jpg", "villa-fronte-acqua"],
  ["_DSC2024.jpg", "villa-angolo-piscina"],
  ["_DSC2025.jpg", "villa-lettini"],
];
// Fermi guardati uno per uno: uno scartato non esiste nella cartella e si salta.
const fermi = [
  "villa-salotto-ombrellone",
  "villa-facciata-lettini",
  "villa-vetrata-lanterne",
  "villa-sala-tour",
  "villa-uliveto",
  "territorio-quartiere",
];
// Il poster del Congedo non passa più di qui: lo scrive scripts/media/congedo.mjs dal master 4K (A29).
const poster = ["acqua"];

async function scrivi(input, output, jpeg) {
  const info = await sharp(input)
    .rotate()
    .resize({ width: 2560, withoutEnlargement: true, kernel: "lanczos3" })
    .jpeg(jpeg)
    .toFile(output);
  const meta = await sharp(output).metadata();
  if (meta.exif || meta.xmp || meta.iptc) throw new Error(`${output}: metadati rimasti`);
  console.log(`${output}\t${info.width}x${info.height}\t${Math.round(info.size / 1024)} KB`);
}

const jpegFoto = { quality: Q, mozjpeg: true, chromaSubsampling: "4:2:0", progressive: true };
const jpegPoster = { quality: 80, mozjpeg: true, progressive: true };

for (const [nome, uscita] of foto) {
  const input = join(SRC, nome);
  if (!existsSync(input)) throw new Error(`manca ${input}`);
  await scrivi(input, join(FOTO, `${uscita}.jpg`), jpegFoto);
}
for (const nome of fermi) {
  const input = join(WORK, `${nome}.png`);
  if (!existsSync(input)) {
    console.log(`${nome}: fermo scartato, non si converte`);
    continue;
  }
  await scrivi(input, join(FOTO, `${nome}.jpg`), jpegFoto);
}
for (const clip of poster) {
  const input = join(WORK, `${clip}-poster.png`);
  if (!existsSync(input)) throw new Error(`manca ${input}: prima \`enc ${clip}\``);
  await scrivi(input, join(MEDIA, `${clip}-poster.jpg`), jpegPoster);
}
