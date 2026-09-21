// LE FOTO ALTE GENERATE CON HIGGSFIELD (A44 di Alberto, 20 settembre 2026).
//
// Chi l'ha chiesto: A41 («non abbiamo foto lunghe e alte come era: loro le usano per uno scroll
// continuo senza uscire dalla foto») e A44 («Raffaela mi ha detto che non possiamo tenere la foto
// della hero perché è una casa che hanno perso il cliente … teniamo Raffaela tagliata (mascherata)
// così la aggiungiamo in un'altra foto che generiamo … genera più foto possibili ad alta qualità e
// molto lunghe di altezza»). Il piano, il brief e il registro delle 22 generazioni (Nano Banana
// Pro a 4K, 2:3 = 3392×5056 e 9:16 = 3072×5504) stanno in
// docs/superpowers/specs/2026-09-20-foto-alte-higgsfield.md.
//
// Cosa fa: legge i PNG scaricati da Alberto (nomi `hf_<data>_<job>.png`), li riconosce dal job id,
// e scrive nel repo:
// - le TESTE delle nove rotte e le foto di scena come JPEG 2:3 larghi 2560 (2560×3816) e i due
//   corridoi 9:16 larghi 2160 (2160×3870), qualità 85 mozjpeg, SENZA metadati (media-file.test.ts:
//   niente Exif/XMP/IPTC/COM), in public/images/reali/<nome>-alta.jpg;
// - l'HERO della home: la scena H1 (salotto a doppia altezza col terzo sinistro libero) con il
//   RITAGLIO VERO di Raffaela (`public/media/raffaela-sagoma.png`, alpha, 2000×1415, figura
//   111→905 × 397→1415) posato in basso a sinistra, e la stessa cosa sul 9:16 M1 per il telefono
//   (`hero-raffaela-villa.jpg` 2560×3816 e `hero-raffaela-villa-m.jpg` 1440×2580);
// - le due SAGOME per il preloader, la sola figura con l'alpha sullo STESSO canvas dei due hero
//   (stesso rapporto → stessa geometria object-cover → il patto della porta: sagoma e foto
//   coincidono, intro-clocks.test.ts), a 1600×2385 e 800×1433, WebP con alpha.
//
// La misura della figura (scelta di qualità, DESIGN.md «Hero»): sul desktop il riquadro ancorato in
// basso mostra, con object-cover a 16:9, il 31 % dell'altezza della foto 2:3 (a 1920×977) e il 38 %
// a 1440×900, il 26 % su un 21:9; la figura è alta il 25 % del canvas così è INTERA su ogni fascia
// comune (A27: mai tagliata) e occupa l'80 % della banda a 1920 e il 66 % a 1440, a sinistra, fuori
// dal lockup centrato. Sul telefono il 9:16 si vede quasi intero (cover a 390×771 → 100 % dell'altezza):
// figura al 42 % del canvas. Il taglio alle ginocchia è quello del ritaglio della cliente: il bordo
// basso della figura sta sul bordo basso del canvas, come nell'hero di prima.
//
// Uso, dalla radice del repo:  node scripts/media/foto-alte.mjs [cartella dei PNG]
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const IN = process.argv[2] ?? "C:/Users/alber/Downloads/higgsfield";
const REALI = join(ROOT, "public/images/reali");
const MEDIA = join(ROOT, "public/media");
const SAGOMA = join(MEDIA, "raffaela-sagoma.png");
const JPG = { quality: 85, mozjpeg: true, chromaSubsampling: "4:2:0" };

/* Il registro: job → uscita. `w` è la larghezza finale; l'altezza segue il rapporto del sorgente. */
const FOTO = [
  // Le teste delle nove rotte (tinte.mjs le legge da qui per nome).
  { job: "1d62a880", out: "villa-facciata-piscina-alta.jpg", w: 2560, uso: "/vendi" },
  { job: "d8a53616", out: "villa-lettini-prato-alta.jpg", w: 2560, uso: "/acquista" },
  { job: "2e458574", out: "villa-angolo-piscina-alta.jpg", w: 2560, uso: "/servizi" },
  { job: "75f44fb2", out: "villa-vetrata-sera-alta.jpg", w: 2560, uso: "/metodo" },
  { job: "c2568d7c", out: "villa-portico-tenda-alta.jpg", w: 2560, uso: "/open-domus" },
  { job: "5f6d48f2", out: "attico-travi-alta.jpg", w: 2560, uso: "/chi-siamo" },
  { job: "e6a60b85", out: "villa-salotto-esterno-alta.jpg", w: 2560, uso: "/recensioni" },
  { job: "5ac66281", out: "attico-studio-alta.jpg", w: 2560, uso: "/lavora-con-noi" },
  { job: "7cf05262", out: "villa-piscina-lunga-alta.jpg", w: 2560, uso: "/domande-frequenti" },
  // I corridoi 9:16.
  { job: "52481984", out: "villa-facciata-sale-alta.jpg", w: 2160, uso: "corridoio" },
  { job: "675ee6b5", out: "villa-terrazza-colline-alta.jpg", w: 2160, uso: "corridoio" },
  // Le scene alternative dell'hero, disponibili per le righe foto+testo.
  { job: "2058b57d", out: "villa-portico-glicine-alta.jpg", w: 2560, uso: "scena" },
  { job: "0c8ea706", out: "villa-ingresso-scala-alta.jpg", w: 2560, uso: "scena" },
  // La facciata a terrazze col glicine, AMPIA (3:2): la finestra di Open Domus, la sezione
  // «Architecture» di era (A45, 21 set.).
  { job: "4ad28297", out: "villa-terrazze-glicine.jpg", w: 2560, uso: "finestra Open Domus" },
  // La seconda scena ampia dell'hero (doppia altezza col lucernario), tenuta come riserva.
  { job: "a1f4d9a0", out: "villa-salotto-doppio.jpg", w: 2560, uso: "scena" },
  // Raffaela generata dai suoi riferimenti (figura intera, A27).
  { job: "3ac9f673", out: "raffaela-porta-alta.jpg", w: 2560, uso: "Raffaela" },
  { job: "64b0dd29", out: "raffaela-chiavi-alta.jpg", w: 2560, uso: "Raffaela" },
  { job: "57a89d47", out: "raffaela-salotto-alta.jpg", w: 2560, uso: "Raffaela" },
  { job: "7ed73da2", out: "raffaela-portico-alta.jpg", w: 2560, uso: "Raffaela" },
];
/* L'hero: la scena vuota, la frazione d'altezza della figura e la quota `tieni` della scena da
   tenere dall'alto. A45 (Alberto, 21 set.: «non mi piace la foto che hai messo per l'hero … era
   molto più ampia»): sul desktop la scena è AMPIA, 3:2 (il salotto intero come nell'hero di prima:
   soffitto, vetrata sul portico, piscina, divano), non una fetta del 2:3. La banda a schermo intero
   a 16:9 ne mostra il 70-84 % dell'altezza (ancorata in basso), un 21:9 il 58 %: la figura è alta
   il 55 % del canvas così è intera fin quasi al 21:9. Sul telefono resta il 9:16 (M1) con la figura
   al 42 %. Il bordo basso della figura sta sul bordo basso del canvas (il taglio del ritaglio). */
const HERO = [
  { job: "cd67e18a", out: "hero-raffaela-villa.jpg", sagoma: "raffaela-sagoma-villa.webp", w: 2560, tieni: 1, figura: 0.55, sagomaW: 1600 },
  { job: "d1b8f6ea", out: "hero-raffaela-villa-m.jpg", sagoma: "raffaela-sagoma-villa-m.webp", w: 1440, tieni: 1, figura: 0.42, sagomaW: 800 },
];
/* La figura dentro il ritaglio: bbox dell'alpha misurata con sharp.trim (111→905 × 397→1415). */
const FIGURA = { canvasW: 2000, canvasH: 1415, top: 397, h: 1018 };

if (!existsSync(IN)) {
  console.error(`manca la cartella dei PNG: ${IN}`);
  process.exit(1);
}
const file = (job) => {
  const f = readdirSync(IN).find((n) => n.startsWith("hf_") && n.includes(`_${job}`) && n.endsWith(".png"));
  if (!f) throw new Error(`manca il PNG del job ${job} in ${IN}`);
  return join(IN, f);
};
const mib = (n) => `${(n / 1048576).toFixed(2)} MiB`;
mkdirSync(REALI, { recursive: true });

// 1. Le foto: ricampionate alla larghezza scelta (lanczos3), appiattite, senza metadati.
for (const f of FOTO) {
  const src = sharp(file(f.job));
  const meta = await src.metadata();
  const h = Math.round((meta.height * f.w) / meta.width);
  const out = join(REALI, f.out);
  const info = await src.resize(f.w, h, { kernel: "lanczos3" }).flatten({ background: "#f9f5ef" }).jpeg(JPG).toFile(out);
  console.log(`${f.out}  ${info.width}×${info.height}  ${mib(info.size)}  (${f.uso})`);
}

// 2. L'hero: la scena col ritaglio posato in basso a sinistra, e la sagoma sola sullo stesso canvas.
for (const h of HERO) {
  const meta = await sharp(file(h.job)).metadata();
  const Hpiena = Math.round((meta.height * h.w) / meta.width);
  const H = Math.round(Hpiena * h.tieni);
  const src = sharp(file(h.job)).resize(h.w, Hpiena, { kernel: "lanczos3" }).extract({ left: 0, top: 0, width: h.w, height: H });
  // La scala del ritaglio: figura alta `figura · H`.
  const s = (h.figura * H) / FIGURA.h;
  const sagW = Math.round(FIGURA.canvasW * s);
  const sagH = Math.round(FIGURA.canvasH * s);
  // Sul telefono il canvas del ritaglio scalato è più largo della foto (2128 > 1440): si tiene la
  // striscia sinistra larga quanto il canvas (la figura sta a 111→905 del ritaglio, dentro).
  const sagVisW = Math.min(sagW, h.w);
  const sagoma = await sharp(SAGOMA)
    .resize(sagW, sagH, { kernel: "lanczos3" })
    .extract({ left: 0, top: 0, width: sagVisW, height: sagH })
    .png()
    .toBuffer();
  const top = H - sagH; // il bordo basso del ritaglio sul bordo basso del canvas
  const out = join(MEDIA, h.out);
  const info = await src
    .flatten({ background: "#f9f5ef" })
    .composite([{ input: sagoma, left: 0, top }])
    .jpeg(JPG)
    .toFile(out);
  console.log(`${h.out}  ${info.width}×${info.height}  ${mib(info.size)}  figura ${Math.round(FIGURA.h * s)} px (${Math.round(h.figura * 100)} %)`);
  // La sagoma per il preloader: stesso canvas, ridotto, trasparente fuori dalla figura.
  const k = h.sagomaW / h.w;
  const sagOut = join(MEDIA, h.sagoma);
  const sag = await sharp({ create: { width: h.sagomaW, height: Math.round(H * k), channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(sagoma).resize(Math.round(sagVisW * k), Math.round(sagH * k), { kernel: "lanczos3" }).png().toBuffer(), left: 0, top: Math.round(top * k) }])
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(sagOut);
  console.log(`${h.sagoma}  ${sag.width}×${sag.height}  ${mib(sag.size)}`);
}
console.log("fatto");
