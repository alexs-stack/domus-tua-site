// LA RAFFAELA VERA NELLA FOTO ALTA DELL'HERO (A73 e A74 di Alberto, 22 settembre 2026, notte).
//
// Chi l'ha chiesto: A73, «la foto della hero va modificata: usa Higgsfield per togliere il bg (ha
// qualche problema), e mettere la foto di Raffaela (attualmente è irriconoscibile perché modificata da
// Higgsfield). Usa quella del preloader. È come se dobbiamo photoshoppare la foto aggiungendo
// perfettamente la sagoma mascherata di Raffaela nella foto al posto di quella attuale. Proviamo con
// Higgsfield se fa. Non devono cambiare né rapporti, grandezza, né qualità». Poi A74, vedendo il primo
// montaggio (la sagoma del preloader, tagliata alle ginocchia, sui pantaloni della foto): «abbiamo fatto
// la foto con Higgsfield senza Raffaela apposta per poi attaccarla sopra, perché l'hai messa nella foto
// vecchia? Se non ha le gambe quella del preloader, metti questa» — il ritaglio INTERO, con le gambe e
// le scarpe (Downloads/higgsfield/raffaela-intera.png, 2560×3816 con l'alpha, la figura 1183×2187 px).
//
// Com'è fatto (un fotoritocco, non una generazione: la foto resta 2560×3812 e i suoi pixel restano
// quelli, tranne dove stava la figura alterata):
// 1. il PLATE: la foto alta senza la donna, chiesto a Higgsfield (gpt_image_2_5, «remove the woman …
//    keep every other part unchanged», 2k = 1360×2048, 3 crediti; job ef80fd4b-78d1-49bc-ae07-107abc4de706,
//    scaricato in Downloads/higgsfield come hf_20260922_181915_ef80fd4b-….png). È un render 2k: usarlo
//    come BASE vorrebbe dire ingrandirlo di 1,9 volte e perdere la qualità che A73 vieta di perdere;
//    quindi la base resta la foto e il plate, ALLINEATO all'originale (SAD sulla balaustra a destra, il
//    rendering è traslato di qualche pixel), copre SOLO la figura vecchia: tutta, dai capelli alle
//    scarpe (A74), con bordo sfumato — la maschera è la differenza originale/plate su copie sfumate
//    (i bordi fini disallineati si spengono), dentro il rettangolo della figura, chiusa e dilatata di
//    qualche pixel perché l'alone della figura vecchia non resti;
// 2. la RAFFAELA intera di Alberto (A74): la figura del PNG riscalata all'altezza della figura vecchia,
//    dalla cima dei capelli alla suola delle scarpe (misurate a mano, FIGURA: la stessa grandezza), e
//    posata coi piedi sul punto in cui stavano i suoi (le gambe centrate sulle gambe vecchie: la stessa
//    posizione); l'ombra sul pavimento è quella della foto.
// La JPEG esce a qualità 92 (mozjpeg, croma 4:4:4): una ricodifica sola, visivamente senza perdita.
// Poi: `node scripts/media/cielo.mjs <dir> hero-raffaela-piscina-alta` (il cielo trasparente) e
// `node scripts/media/hero-piscina.mjs` (la striscia del telefono e hero.json).
//
// Uso, dalla radice del repo:  node scripts/media/hero-raffaela.mjs [cartella dei PNG]
// Ingressi fuori repo (cartella): `hero-raffaela-piscina-alta-upscale.jpg` (la foto alta com'era, prima
// di questo ritocco: l'outpaint + upscale di A71), il plate `hf_*_ef80fd4b*.png` e `raffaela-intera.png`.
import sharp from "sharp";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const IN = process.argv[2] ?? "C:/Users/alber/Downloads/higgsfield";
const BASE = join(IN, "hero-raffaela-piscina-alta-upscale.jpg");
const PLATE_JOB = "ef80fd4b";
const SAGOMA = join(IN, "raffaela-intera.png");
const OUT = join(ROOT, "public/images/reali/hero-raffaela-piscina-alta.jpg");
const JPG = { quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" };

const W = 2560;
const H = 3812;
/* La zona di lavoro, il rettangolo della figura vecchia (capelli → scarpe, il braccio teso a destra) e la
   zona di riferimento per l'allineamento (balaustra e muretto a destra, senza di lei). Misurate il 22
   set. sulla foto alta. La figura vecchia è misurata a mano, NON sulla maschera: il plate è un render
   morbido e la differenza accende mezzo rettangolo (piastrelle, fronde), non solo lei. */
const ZONA = { left: 1120, top: 1740, width: 520, height: 700 };
const RETT = { left: 1200, top: 1810, right: 1560, bottom: 2370 };
/* La figura vecchia: cima dei capelli, suola delle scarpe, centro delle gambe. */
const FIGURA = { testa: 1833, piedi: 2352, gambeCx: 1325 };
const RIF = { left: 1560, top: 1860, width: 300, height: 260 };
const SOGLIA = 30;
const PREBLUR = 3;
/* La fascia bassa della figura (le gambe) su cui si centra la figura nuova: l'ultimo 15 % dell'altezza. */
const GAMBE = 0.15;

if (!existsSync(BASE)) throw new Error(`manca ${BASE}`);
const plateFile = readdirSync(IN).find((f) => f.startsWith("hf_") && f.includes(PLATE_JOB) && f.endsWith(".png"));
if (!plateFile) throw new Error(`manca il plate hf_*_${PLATE_JOB}*.png in ${IN}`);
if (!existsSync(SAGOMA)) throw new Error(`manca ${SAGOMA}`);

const grigio = async (img, box) => {
  const { data, info } = await sharp(img).extract(box).greyscale().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
};
/** Il rettangolo dei pixel accesi (> 128) di una maschera a 1 canale, e il centro x della sua fascia bassa. */
function misura(mask, w, h) {
  let top = h, bottom = -1, left = w, right = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] <= 128) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (bottom < 0) throw new Error("maschera vuota");
  const daY = bottom - Math.round((bottom - top) * GAMBE);
  let sx = 0, n = 0;
  for (let y = daY; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (mask[y * w + x] > 128) { sx += x; n++; }
    }
  }
  return { top, bottom, left, right, gambeCx: sx / n };
}
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

// 1b. La maschera della figura vecchia: la differenza dentro il suo rettangolo, chiusa e dilatata.
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
const dilatata = await sharp(chiusa, { raw: { width: zw, height: zh, channels: 1 } }).blur(2).threshold(40).toColourspace("b-w").raw().toBuffer();
let px = 0;
for (let i = 0; i < dilatata.length; i++) if (dilatata[i] > 128) px++;
const alpha = await sharp(dilatata, { raw: { width: zw, height: zh, channels: 1 } }).blur(2.5).toColourspace("b-w").png().toBuffer();
const toppa = await sharp(plateZona.data, { raw: { width: zw, height: zh, channels: 3 } }).joinChannel(alpha).png().toBuffer();

// 2. La figura intera: la sua alpha misurata come la maschera, poi la scala e la posa.
const sag = await sharp(SAGOMA).ensureAlpha().extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
const nuova = misura(sag.data, sag.info.width, sag.info.height);
const scala = (FIGURA.piedi - FIGURA.testa) / (nuova.bottom - nuova.top);
const fw = Math.round(sag.info.width * scala);
const fh = Math.round(sag.info.height * scala);
const fleft = Math.round(FIGURA.gambeCx - nuova.gambeCx * scala);
const ftop = Math.round(FIGURA.testa - nuova.top * scala);
const figuraPng = await sharp(SAGOMA).resize(fw, fh, { kernel: "lanczos3" }).png().toBuffer();

// 3. La toppa e la figura sulla foto.
const info = await sharp(BASE)
  .composite([
    { input: toppa, left: ZONA.left, top: ZONA.top },
    { input: figuraPng, left: fleft, top: ftop },
  ])
  .jpeg(JPG)
  .toFile(OUT);
console.log(
  `hero-raffaela-piscina-alta.jpg  ${info.width}×${info.height}  ${(info.size / 1048576).toFixed(2)} MiB  plate ${plateFile} allineato (${best.dx}, ${best.dy}), toppa ${px} px; figura vecchia y ${FIGURA.testa}→${FIGURA.piedi} (gambe a x ${FIGURA.gambeCx}); figura nuova scala ${scala.toFixed(4)}, ${fw}×${fh} a (${fleft}, ${ftop}), testa a y ${Math.round(ftop + nuova.top * scala)}, piedi a y ${Math.round(ftop + nuova.bottom * scala)}, gambe a x ${Math.round(fleft + nuova.gambeCx * scala)}`,
);
