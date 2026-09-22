// LA RAFFAELA VERA NELLA FOTO ALTA DELL'HERO (A73 di Alberto, 22 settembre 2026, notte).
//
// Chi l'ha chiesto: A73, «la foto della hero va modificata: usa Higgsfield per togliere il bg (ha
// qualche problema), e mettere la foto di Raffaela (attualmente è irriconoscibile perché modificata da
// Higgsfield). Usa quella del preloader. È come se dobbiamo photoshoppare la foto aggiungendo
// perfettamente la sagoma mascherata di Raffaela nella foto al posto di quella attuale. Proviamo con
// Higgsfield se fa. Non devono cambiare né rapporti, grandezza, né qualità».
//
// Com'è fatto (un fotoritocco, non una generazione: la foto resta 2560×3812 e i suoi pixel restano
// quelli, tranne dove stava la figura alterata):
// 1. il PLATE: la foto alta senza la donna, chiesto a Higgsfield (gpt_image_2_5, «remove the woman …
//    keep every other part unchanged», 2k = 1360×2048, 3 crediti; job ef80fd4b-78d1-49bc-ae07-107abc4de706,
//    scaricato in Downloads/higgsfield come hf_20260922_181915_ef80fd4b-….png); il rendering è morbido
//    e traslato di qualche pixel: qui lo si ALLINEA all'originale (SAD sulla balaustra a destra) e lo si
//    usa SOLO nelle schegge della figura vecchia che la figura nuova non copre (braccio destro, fianco,
//    capelli), con bordo sfumato — la maschera è la differenza originale/plate, misurata su copie sfumate
//    (i bordi fini disallineati si spengono), dentro il rettangolo della figura, chiusa;
// 2. le GAMBE: sotto il ginocchio restano i pantaloni bianchi e le scarpe della foto (nulla da inventare);
// 3. la RAFFAELA del preloader: `public/media/raffaela-sagoma.png` (il ritaglio vero con l'alpha, figura
//    113→902 × 401→1414, tagliato alle ginocchia) riscalata all'altezza testa→ginocchio della figura
//    vecchia (352 px: scala 0,347) e posata sul suo centro (x 1324, testa a y 1833): stessa grandezza,
//    stessa posizione, la gonna di pizzo sui pantaloni.
// La JPEG esce a qualità 92 (mozjpeg, croma 4:4:4): una ricodifica sola, visivamente senza perdita.
// Poi: `node scripts/media/cielo.mjs <dir> hero-raffaela-piscina-alta` (il cielo trasparente) e
// `node scripts/media/hero-piscina.mjs` (la striscia del telefono e hero.json).
//
// Uso, dalla radice del repo:  node scripts/media/hero-raffaela.mjs [cartella dei PNG]
// Ingressi fuori repo (cartella): `hero-raffaela-piscina-alta-upscale.jpg` (la foto alta com'era, prima
// di questo ritocco: l'outpaint + upscale di A71) e il plate `hf_*_ef80fd4b*.png`.
import sharp from "sharp";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const IN = process.argv[2] ?? "C:/Users/alber/Downloads/higgsfield";
const BASE = join(IN, "hero-raffaela-piscina-alta-upscale.jpg");
const PLATE_JOB = "ef80fd4b";
const SAGOMA = join(ROOT, "public/media/raffaela-sagoma.png");
const OUT = join(ROOT, "public/images/reali/hero-raffaela-piscina-alta.jpg");
const JPG = { quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" };

const W = 2560;
const H = 3812;
/* La figura del preloader dentro il suo canvas (foto-alte.mjs). */
const BBOX = { left: 113, top: 401, width: 902 - 113 + 1, height: 1414 - 401 + 1 };
/* La figura vecchia nella foto alta: testa, ginocchio, centro del corpo (misurata il 22 set.). */
const FIGURA = { testa: 1833, ginocchio: 2185, cx: 1324 };
/* Nel ritaglio del preloader il centro del corpo sta a 300 px dal bordo sinistro del bbox. */
const CORPO_X = 300;
/* La zona di lavoro, il rettangolo della figura vecchia, le gambe che restano, la zona di riferimento
   per l'allineamento (balaustra e muretto a destra, senza di lei). */
const ZONA = { left: 1120, top: 1740, width: 520, height: 700 };
const RETT = { left: 1225, top: 1815, right: 1545, bottom: 2195 };
const GAMBE = { left: 1230, top: 2170, width: 200, height: 270 };
const RIF = { left: 1560, top: 1860, width: 300, height: 260 };
const SOGLIA = 30;
const PREBLUR = 3;

if (!existsSync(BASE)) throw new Error(`manca ${BASE}`);
const plateFile = readdirSync(IN).find((f) => f.startsWith("hf_") && f.includes(PLATE_JOB) && f.endsWith(".png"));
if (!plateFile) throw new Error(`manca il plate hf_*_${PLATE_JOB}*.png in ${IN}`);
if (!existsSync(SAGOMA)) throw new Error(`manca ${SAGOMA}`);

const scala = (FIGURA.ginocchio - FIGURA.testa) / BBOX.height;
const fw = Math.round(BBOX.width * scala);
const fh = Math.round(BBOX.height * scala);
const fleft = Math.round(FIGURA.cx - CORPO_X * scala);
const ftop = FIGURA.testa;

const grigio = async (img, box) => {
  const { data, info } = await sharp(img).extract(box).greyscale().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
};
const plateBuf = await sharp(join(IN, plateFile)).resize(W, H, { kernel: "lanczos3" }).png().toBuffer();

// 1a. L'allineamento del plate: la traslazione (dx, dy) in ±32 px che minimizza la differenza in RIF.
const R = 32;
const oRif = await grigio(BASE, RIF);
const pBig = await grigio(plateBuf, { left: RIF.left - R, top: RIF.top - R, width: RIF.width + 2 * R, height: RIF.height + 2 * R });
let best = { dx: 0, dy: 0, sad: Infinity };
for (let dy = -R; dy <= R; dy++) {
  for (let dx = -R; dx <= R; dx++) {
    let sad = 0;
    for (let y = 0; y < oRif.h; y += 2) {
      for (let x = 0; x < oRif.w; x += 2) sad += Math.abs(oRif.data[y * oRif.w + x] - pBig.data[(y + R + dy) * pBig.w + (x + R + dx)]);
    }
    if (sad < best.sad) best = { dx, dy, sad };
  }
}
const plateZona = await sharp(plateBuf)
  .extract({ left: ZONA.left + best.dx, top: ZONA.top + best.dy, width: ZONA.width, height: ZONA.height })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const orig = await sharp(BASE).extract(ZONA).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const zw = orig.info.width;
const zh = orig.info.height;
const sfuma = (raw) => sharp(raw.data, { raw: { width: raw.info.width, height: raw.info.height, channels: 3 } }).blur(PREBLUR).raw().toBuffer();
const origS = await sfuma(orig);
const plateS = await sfuma(plateZona);

// 1b. La maschera: la differenza dentro il rettangolo della figura, chiusa, meno la figura nuova e le gambe.
const diff = Buffer.alloc(zw * zh);
for (let y = 0; y < zh; y++) {
  for (let x = 0; x < zw; x++) {
    const gx = x + ZONA.left;
    const gy = y + ZONA.top;
    if (gx < RETT.left || gx > RETT.right || gy < RETT.top || gy > RETT.bottom) continue;
    const i = y * zw + x;
    const d = Math.max(Math.abs(origS[i * 3] - plateS[i * 3]), Math.abs(origS[i * 3 + 1] - plateS[i * 3 + 1]), Math.abs(origS[i * 3 + 2] - plateS[i * 3 + 2]));
    diff[i] = d > SOGLIA ? 255 : 0;
  }
}
// `.toColourspace("b-w")`: dopo blur/threshold sharp torna a 3 canali e gli indici sarebbero sfasati.
const chiusa = await sharp(diff, { raw: { width: zw, height: zh, channels: 1 } }).blur(4).threshold(55).blur(3).threshold(50).toColourspace("b-w").raw().toBuffer();
if (chiusa.length !== zw * zh) throw new Error(`maschera: ${chiusa.length} byte, attesi ${zw * zh}`);
const figuraPng = await sharp(SAGOMA).extract(BBOX).resize(fw, fh, { kernel: "lanczos3" }).png().toBuffer();
const figAlpha = await sharp({ create: { width: zw, height: zh, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: figuraPng, left: fleft - ZONA.left, top: ftop - ZONA.top }])
  .extractChannel("alpha")
  .blur(1)
  .threshold(6)
  .raw()
  .toBuffer();
const maschera = Buffer.alloc(zw * zh);
let px = 0;
for (let y = 0; y < zh; y++) {
  for (let x = 0; x < zw; x++) {
    const i = y * zw + x;
    const gx = x + ZONA.left;
    const gy = y + ZONA.top;
    const gamba = gx >= GAMBE.left && gx < GAMBE.left + GAMBE.width && gy >= GAMBE.top && gy < GAMBE.top + GAMBE.height;
    const v = chiusa[i] > 128 && figAlpha[i] < 128 && !gamba ? 255 : 0;
    maschera[i] = v;
    if (v) px++;
  }
}
const alpha = await sharp(maschera, { raw: { width: zw, height: zh, channels: 1 } }).blur(2.5).toColourspace("b-w").png().toBuffer();
const toppa = await sharp(plateZona.data, { raw: { width: zw, height: zh, channels: 3 } }).joinChannel(alpha).png().toBuffer();

// 2 + 3. La toppa e la figura sulla foto; le gambe sono già lì.
const info = await sharp(BASE)
  .composite([
    { input: toppa, left: ZONA.left, top: ZONA.top },
    { input: figuraPng, left: fleft, top: ftop },
  ])
  .jpeg(JPG)
  .toFile(OUT);
console.log(
  `hero-raffaela-piscina-alta.jpg  ${info.width}×${info.height}  ${(info.size / 1048576).toFixed(2)} MiB  plate ${plateFile} allineato (${best.dx}, ${best.dy}), toppa ${px} px, figura ${fw}×${fh} a (${fleft}, ${ftop})`,
);
