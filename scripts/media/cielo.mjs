// IL CIELO MASCHERATO DELLE FOTO ALTE (A46 di Alberto, 21 settembre 2026, sera).
//
// Chi l'ha chiesto: A46 («su eraresidence questa foto che usa come background alta ha il cielo
// mascherato, è no bg: ecco perché sembra un tutt'uno il cielo con il colore dello sfondo del
// sito. Dobbiamo fare la stessa cosa nel nostro sito, dove ci sono le immagini così alte»). Su
// era-residence («Architecture», la piscina) il cielo è alpha e il fondo pagina fa da cielo; da
// noi il fondo è l'avorio #f9ede8 (`--color-cream`): il cielo delle foto alte va via, la villa e
// il giardino posano sulla carta, e le scritte che stavano «nel cielo» tornano nell'inchiostro
// della rivista (quello lo fa il layout, non questo script).
//
// Cosa fa: legge le nove teste 2:3 di tinte.json (A44, scripts/media/foto-alte.mjs) e la
// finestra di Open Domus in home (villa-terrazze-glicine.jpg, 3:2, A45) e scrive, per ogni foto
// che HA un cielo, public/images/reali/<nome>-cielo.webp: stessa risoluzione della sorgente,
// canale alpha, WebP lossy q 86 con l'alpha LOSSLESS (`alphaQuality` 100: a 90 l'alpha si
// quantizza e il 255 del giardino diventa 251, cioè un soggetto opaco al 98 %; la maschera è
// quasi binaria e lossless costa meno byte, non di più), SENZA metadati (sharp non copia Exif,
// XMP, IPTC né il profilo ICC se non glielo si chiede). Le sorgenti JPEG restano su disco: sono
// il file di riserva e i test (media-file, tinte) le leggono. I due attici (/chi-siamo,
// /lavora-con-noi) sono interni, senza cielo (la luce del lucernario e della finestra ad arco
// sta dietro un vetro e resta): per loro nessun WebP, `cielo.file` null e linea 0.
//
// Com'è fatta la maschera (il prototipo dell'orchestratore, riscritto qui con le classi):
// 1. un PUNTEGGIO «cielo» per pixel, 0..1, dalla tinta (HSL): la classe `giorno` è l'azzurro
//    chiaro poco saturo con dominanza netta del blu sul rosso, e l'azzurro medio della cima
//    (L 0,45-0,64) solo se è blu netto (S ≥ 0,3, B − R ≥ 65: le colline lontane in foschia hanno
//    la stessa luminosità ma S 0,15 e B − R 30, e senza questo cancello il flood fill le
//    mangiava); la classe `sera` (/metodo, villa-vetrata-sera-alta) è il blu profondo e saturo
//    del crepuscolo (hue 200-224, S ≥ 0,44, B − R ≥ 70): i muri in ombra di quella foto sono
//    grigio-azzurri ma poco saturi (S ≤ 0,22, B − R ≤ 56) e restano fuori — il primo prototipo
//    li mangiava, o lasciava il cielo chiaro sopra i cipressi (L 0,65-0,73, che la classe del
//    giorno rifiuta perché troppo saturo); la classe `medio` (la finestra di Open Domus) è
//    l'azzurro medio del tardo pomeriggio, fra le due;
// 2. un FLOOD FILL dal bordo alto sui pixel col punteggio sopra la soglia (0,55), che non scende
//    mai sotto `ymax` (80 % dell'altezza: l'acqua della piscina e le colline stanno sotto); di
//    giorno la crescita passa anche per la foschia chiara azzurrina se il vicino è simile
//    (≤ 10/canale: il gradiente liscio verso l'orizzonte) e per il bianco neutro dell'orizzonte
//    se è quasi uguale (≤ 5/canale), di sera no (`crescita: false`: il blu è netto fino ai
//    cipressi e la foschia non c'è);
// 3. le TASCHE di cielo fra le foglie e fra i rami: sopra la «linea del cielo» (il punto più
//    basso della maschera nelle colonne vicine, ±80 px) ogni pixel che sembra cielo lo è;
// 4. l'alpha MORBIDA sui bordi: nella maschera il cielo è via del tutto (m 1); nei 3 px attorno
//    alla maschera il pixel è cielo QUANTO il suo punteggio (m = punteggio, se > 0,25): sono i
//    pixel misti, la punta di un cipresso, il cielo fra gli aghi. Il colore di quei pixel si
//    DECONTAMINA dal cielo (c = m·cielo + (1 − m)·soggetto, col cielo medio della stessa riga: il
//    gradiente del cielo è verticale), così niente frangia azzurra sull'avorio. Non oltre i 3 px:
//    le colline lontane in foschia hanno punteggi 0,25-0,5 e diventerebbero mezze trasparenti;
// 5. la FOSCHIA dell'orizzonte: dove sotto il bordo della maschera ci sono colline o monti chiari
//    e azzurrini (pixel `foschia` fuori dalla maschera, entro 12 px) la transizione da cielo a
//    terra è un gradiente lento, e una maschera netta lì fa isole e gradini (i blocchi 8×8 del
//    JPEG): in quella zona i soli pixel di foschia, di qua e di là del bordo, prendono la
//    maschera sfumata di 12 px; i pixel scuri e caldi accanto tengono il bordo netto;
// 6. il colore del soggetto ESTESO di 2 px dentro la maschera (dilatazione), così la sfumatura
//    finale dell'alpha (blur 1,6 px, l'antialias del bordo) non pesca il blu del cielo.
//
// Le due misure scritte in tinte.json (`cielo.linea`, `cielo.cima`, frazioni 0-1 dell'altezza):
// - `linea`: il primo y dall'alto in cui meno del 5 % dei pixel della riga è trasparente, cioè
//   dove il soggetto riempie la larghezza (il tetto, le colline): è il criterio chiesto
//   dall'orchestratore per A46;
// - `cima`: il primo y dall'alto in cui almeno il 5 % dei pixel della riga è opaco, cioè dove il
//   soggetto COMINCIA (le punte dei cipressi, la tenda): sopra `cima` c'è solo avorio, quindi un
//   blocco di scritte che finisce lì non copre nulla; fra `cima` e `linea` copre i lati.
// Sui due attici entrambe valgono 0 (nessun cielo).
//
// Chi scrive il JSON: questo script non tocca tinte.json da solo. Scrive i WebP e il foglio di
// contatto, poi rilancia scripts/media/tinte.mjs, che importa da qui la tabella `FOTO` e
// `misuraCielo`, rilegge i WebP, scrive `cielo` per rotta e FORZA la tinta alta ad "avorio" dove
// il cielo è trasparente: il fondo del riquadro si vede attraverso il cielo per sempre, non solo
// prima del decode, e deve essere il fondo pagina (PageHero: var(--color-cream)).
//
// Uso, dalla radice del repo:  node scripts/media/cielo.mjs [cartella del foglio di contatto]
import sharp from "sharp";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REALI = "public/images/reali";
const WEBP = { quality: 86, alphaQuality: 100, effort: 4 };

/* La tabella: nome della sorgente (senza estensione), dove si usa, la classe del cielo e, per
   foto, i parametri che scostano dal default. `interno`: nessun cielo, nessun WebP. */
export const FOTO = [
  /* Le lame di cielo fra i tronchi dei cipressi a sinistra di /vendi (tre, 1.100-2.200 px) e fra le
     fronde dell'ulivo di /acquista (due, 800-1.700 px) stanno più in basso del cielo mascherato nelle
     colonne vicine di oltre 80 px (e di oltre 400): la linea del cielo si cerca su ±700 px (±400 lasciava una lama su /vendi e le due di /acquista) (revisione avversaria di
     A46, 22 set. 2026, rilievo P03; sotto la linea c'è la piscina, che la maschera non tocca perché
     la ricerca delle tasche si ferma alla linea del cielo delle colonne accanto). */
  { nome: "villa-facciata-piscina-alta", uso: "/vendi", classe: "giorno", raggio: 700 },
  { nome: "villa-lettini-prato-alta", uso: "/acquista", classe: "giorno", raggio: 700 },
  { nome: "villa-angolo-piscina-alta", uso: "/servizi", classe: "giorno" },
  /* Di sera le tasche di cielo fra i cipressi, davanti al parapetto, stanno 100-250 px sotto il
     punto più basso del cielo nelle colonne accanto: la linea del cielo si cerca su ±300 px (sotto
     il parapetto c'è solo il prato, niente che sembri cielo). */
  { nome: "villa-vetrata-sera-alta", uso: "/metodo", classe: "sera", crescita: false, raggio: 300 },
  /* La tenda copre la cima: il cielo è una tasca a destra, dalla tenda alle colline, che tocca il
     bordo destro e non quello alto (il flood fill parte anche dai bordi laterali, fino al 40 %), e
     una striscia CHIUSA fra i due pilastri di pietra, sopra le colline (43-47 % dell'altezza), che
     non tocca nessun bordo: `libere` maschera ogni pixel di cielo sopra il 50 % senza chiedere la
     contiguità (le ortensie azzurrine stanno sotto, dal 58 %). */
  { nome: "villa-portico-tenda-alta", uso: "/open-domus", classe: "giorno", lati: 0.4, libere: 0.5 },
  { nome: "attico-travi-alta", uso: "/chi-siamo", classe: "interno" },
  { nome: "villa-salotto-esterno-alta", uso: "/recensioni", classe: "giorno" },
  { nome: "attico-studio-alta", uso: "/lavora-con-noi", classe: "interno" },
  { nome: "villa-piscina-lunga-alta", uso: "/domande-frequenti", classe: "giorno" },
  /* La finestra di Open Domus in home (OpenDomus.tsx): «Architecture» di era. A47 (Alberto, 22 set.
     2026: «qua perchè hai tagliato l'immagine, deve continuare, abbiamo fatto le immagini alte
     apposta per poterci scrollare a schermo intero senza uscire dalla foto»): la facciata a terrazze
     che SALE, 9:16 (villa-facciata-sale-alta, il corridoio di foto-alte.mjs), al posto della 3:2 col
     glicine di A45/A46 (villa-terrazze-glicine resta su disco come scena di riserva, senza WebP).
     Cielo di giorno, azzurro netto fino alle colline in foschia a destra; i parapetti sono muri
     pieni, non vetri: nessuna tasca libera. Le misure della finestra (cima, bande del segno) le
     scrive scripts/media/finestra.mjs in app/lib/motion/finestra.json. */
  { nome: "villa-facciata-sale-alta", uso: "finestra Open Domus (home)", classe: "giorno" },
];

/* I parametri comuni: la soglia del flood fill, il fondo oltre cui non scende, la crescita per
   similarità nella foschia, il raggio della linea del cielo per le tasche, la sfumatura. */
const DEFAULT = { soglia: 0.55, ymax: 0.8, crescita: true, raggio: 80, sfumatura: 1.6, estensione: 2, lati: 0, libere: 0, bordo: 3, foschia: 12 };

/* Il percorso pubblico del WebP di una foto, o null per gli interni. */
export const fileCielo = (f) => (f.classe === "interno" ? null : `/images/reali/${f.nome}-cielo.webp`);

/* HSL da un pixel sRGB: h in gradi, s e l in 0..1. */
function hsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 510;
  const s = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  let h = 0;
  if (max !== min) {
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h, s, l];
}
const rampa = (v, da, a) => (v <= da ? 0 : v >= a ? 1 : (v - da) / (a - da));

/* Le classi: `punteggio` 0..1 (quanto il pixel è cielo) e `foschia` (plausibile come cielo, cresce
   solo per contiguità e similarità). */
const CLASSI = {
  giorno: {
    punteggio(r, g, b) {
      const dom = b - r;
      if (dom < 14 || b < g - 4) return 0;
      const [h, s, l] = hsl(r, g, b);
      // Il cielo CHIARO (L ≥ 0,64): azzurro poco saturo, basta una dominanza del blu modesta.
      const hueOk = h >= 192 && h <= 232 ? 1 : h >= 184 && h <= 240 ? 0.7 : 0;
      const sOk = s >= 0.06 && s <= 0.62 ? 1 : s < 0.06 ? s / 0.06 : s < 0.8 ? (0.8 - s) / 0.18 : 0;
      const chiaro = Math.min(hueOk, rampa(l, 0.58, 0.64), sOk, rampa(dom, 14, 28));
      // Il cielo MEDIO (L 0,45-0,64: la cima di villa-lettini-prato, L 0,51): solo se è blu NETTO,
      // S ≥ 0,3 e B − R ≥ 65. Le colline lontane in foschia hanno la stessa luminosità (L 0,53-0,57)
      // ma S 0,13-0,17 e B − R 23-39: senza questo cancello il flood fill le mangiava.
      const hueMedio = h >= 198 && h <= 228 ? 1 : h >= 194 && h <= 232 ? 0.6 : 0;
      const medio = Math.min(hueMedio, rampa(l, 0.45, 0.52), rampa(s, 0.22, 0.3), rampa(dom, 45, 65));
      return Math.max(chiaro, medio);
    },
    foschia(r, g, b) {
      const [, s, l] = hsl(r, g, b);
      // 1: la foschia azzurrina. 2: il BIANCO NEUTRO dell'orizzonte (L > 0,85, croma ≤ 12, blu non
      // sotto il rosso di più di 2): la fascia di cielo quasi bianca sopra le colline, che il
      // primo prototipo lasciava (una striscia grigia a gradini sull'avorio). Cresce solo con la
      // similarità STRETTA (≤ 5/canale): un ombrellone o un muro bianco stanno a 25 dal cielo e
      // il loro bordo antialiasato fa passi da 8-12, la fascia fa passi da 1-3.
      if (l > 0.7 && s < 0.42 && b >= r + 3 && b >= g - 3) return 1;
      const croma = Math.max(r, g, b) - Math.min(r, g, b);
      if (l > 0.85 && croma <= 12 && b >= r - 2) return 2;
      return 0;
    },
  },
  sera: {
    punteggio(r, g, b) {
      const dom = b - r;
      if (dom < 40) return 0;
      const [h, s, l] = hsl(r, g, b);
      const hueOk = h >= 200 && h <= 224 ? 1 : h >= 194 && h <= 232 ? 0.7 : 0;
      // Il cielo fra gli aghi dei cipressi è meno saturo (S 0,44, B − R 87): la rampa parte a 0,3,
      // sopra i muri in ombra (S ≤ 0,22).
      const sOk = rampa(s, 0.3, 0.44);
      const lOk = Math.min(rampa(l, 0.15, 0.25), 1 - rampa(l, 0.8, 0.9));
      const domOk = rampa(dom, 40, 70);
      return Math.min(hueOk, sOk, lOk, domOk);
    },
    foschia: () => false,
  },
  /* L'azzurro medio (la finestra di Open Domus): hue 200-224, S 0,3-0,65, L 0,35-0,68, B − R ≥ 60.
     Solo dove non ci sono colline in foschia (che stanno in questa classe) né vetri che
     riflettono il cielo sotto la linea del tetto. */
  medio: {
    punteggio(r, g, b) {
      const dom = b - r;
      if (dom < 45) return 0;
      const [h, s, l] = hsl(r, g, b);
      const hueOk = h >= 200 && h <= 224 ? 1 : h >= 194 && h <= 232 ? 0.7 : 0;
      const sOk = Math.min(rampa(s, 0.26, 0.32), 1 - rampa(s, 0.62, 0.7));
      const lOk = Math.min(rampa(l, 0.3, 0.36), 1 - rampa(l, 0.66, 0.74));
      const domOk = rampa(dom, 45, 65);
      return Math.min(hueOk, sOk, lOk, domOk);
    },
    foschia: () => false,
  },
};

/* La maschera del cielo di una foto: Uint8Array W×H, 1 dove il cielo va via. */
function maschera(data, W, H, classe, p) {
  const n = W * H;
  const score = new Float32Array(n);
  const haze = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    score[i] = classe.punteggio(r, g, b);
    haze[i] = p.crescita ? classe.foschia(r, g, b) : 0;
  }
  // 2. Il flood fill dal bordo alto (e, con `lati`, dai bordi laterali fino a quella frazione).
  const mask = new Uint8Array(n);
  const stack = [];
  const YMAX = Math.floor(H * p.ymax);
  const semi = [];
  for (let x = 0; x < W; x++) semi.push(x);
  for (let y = 1; y < Math.floor(H * p.lati); y++) semi.push(y * W, y * W + W - 1);
  for (const i of semi) {
    if (score[i] > p.soglia && !mask[i]) {
      mask[i] = 1;
      stack.push(i);
    }
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    const y = (i - x) / W;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < YMAX ? i + W : -1]) {
      if (j < 0 || mask[j]) continue;
      const tolleranza = haze[j] === 2 ? 5 : 10;
      const simile =
        Math.abs(data[j * 3] - data[i * 3]) <= tolleranza &&
        Math.abs(data[j * 3 + 1] - data[i * 3 + 1]) <= tolleranza &&
        Math.abs(data[j * 3 + 2] - data[i * 3 + 2]) <= tolleranza;
      if (score[j] > p.soglia || (haze[j] && simile)) {
        mask[j] = 1;
        stack.push(j);
      }
    }
  }
  // 3a. Le tasche LIBERE (solo dove la foto lo chiede): sopra `libere` ogni pixel di cielo lo è.
  for (let i = 0; i < Math.floor(H * p.libere) * W; i++) if (!mask[i] && score[i] > 0.5) mask[i] = 1;
  // 3. Le tasche sopra la linea del cielo.
  const basso = new Int32Array(W).fill(-1);
  for (let x = 0; x < W; x++) {
    for (let y = H - 1; y >= 0; y--) {
      if (mask[y * W + x]) {
        basso[x] = y;
        break;
      }
    }
  }
  for (let x = 0; x < W; x++) {
    let m = -1;
    for (let k = Math.max(0, x - p.raggio); k <= Math.min(W - 1, x + p.raggio); k++) if (basso[k] > m) m = basso[k];
    for (let y = 0; y < m; y++) {
      const i = y * W + x;
      // Sopra la linea del cielo basta meno: la FOSCHIA AZZURRINA (classe 1: b ≥ r + 3, poco satura,
      // chiara) con un punteggio appena positivo è cielo fra le fronde (le lame di /acquista e di /vendi,
      // rilievo P03 della revisione di A46, 22 set. 2026); il bianco neutro (classe 2: i muri) no.
      if (!mask[i] && (score[i] > 0.5 || (haze[i] && score[i] > 0.25) || (haze[i] === 1 && score[i] > 0.1))) mask[i] = 1;
    }
  }
  return { mask, score, haze };
}

/* Un canale a 8 bit sfumato con sharp (blur gaussiano di `sigma`), come Float32 0..1. */
async function sfuma(canale, W, H, sigma) {
  // `precision: "float"`: col kernel intero di libvips un canale piatto a 255 esce a 251.
  const { data, info } = await sharp(Buffer.from(canale.buffer, canale.byteOffset, canale.length), { raw: { width: W, height: H, channels: 1 } })
    .blur({ sigma, precision: "float" })
    .toColourspace("b-w")
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 1) throw new Error(`canale a ${info.channels} canali`);
  const out = new Float32Array(W * H);
  for (let i = 0; i < out.length; i++) out[i] = data[i] / 255;
  return out;
}

/* 4-5. L'alpha morbida: m ∈ [0,1] per pixel (1 = cielo), il colore decontaminato dal cielo. */
async function alfaMorbida(data, { mask, score, haze }, W, H, p) {
  const n = W * H;
  // Il cielo medio per riga: i pixel della maschera col punteggio alto; senza, la riga sopra.
  const cieloRiga = new Float32Array(H * 3);
  let ultimo = null;
  for (let y = 0; y < H; y++) {
    let r = 0;
    let g = 0;
    let b = 0;
    let c = 0;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (mask[i] && score[i] > 0.8) {
        r += data[i * 3];
        g += data[i * 3 + 1];
        b += data[i * 3 + 2];
        c++;
      }
    }
    if (c >= 16) ultimo = [r / c, g / c, b / c];
    if (ultimo) cieloRiga.set(ultimo, y * 3);
  }
  // Il bordo: i pixel fuori dalla maschera entro `bordo` px da lei.
  const vicino = new Uint8Array(mask);
  for (let passo = 0; passo < p.bordo; passo++) {
    const prima = new Uint8Array(vicino);
    for (let i = 0; i < n; i++) {
      if (prima[i]) continue;
      const x = i % W;
      if ((x > 0 && prima[i - 1]) || (x < W - 1 && prima[i + 1]) || (i >= W && prima[i - W]) || (i + W < n && prima[i + W])) vicino[i] = 1;
    }
  }
  const m = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (mask[i]) m[i] = 1;
    else if (vicino[i] && score[i] > 0.25) m[i] = score[i];
  }
  // La foschia dell'orizzonte: nella zona in cui, fuori dalla maschera, la terra è chiara e
  // azzurrina (colline lontane, monti, isole di cielo pallido), i pixel di FOSCHIA — di qua e di là
  // del bordo — prendono la maschera sfumata: il bordo a gradini diventa un gradiente, le isole
  // quasi spariscono. I pixel scuri (cipressi, boschi) e caldi (i muri) tengono il bordo netto.
  if (p.foschia > 0 && p.crescita) {
    const terraChiara = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (haze[i] && !mask[i]) terraChiara[i] = 255;
    const zona = await sfuma(terraChiara, W, H, p.foschia);
    const maskByte = new Uint8Array(n);
    for (let i = 0; i < n; i++) maskByte[i] = mask[i] ? 255 : 0;
    const morbida = await sfuma(maskByte, W, H, p.foschia);
    for (let i = 0; i < n; i++) {
      if (!haze[i] || zona[i] <= 0.12) continue;
      m[i] = mask[i] ? morbida[i] : Math.max(m[i], morbida[i]);
    }
  }
  // La decontaminazione: c = m·cielo + (1 − m)·soggetto → soggetto.
  for (let i = 0; i < n; i++) {
    const k = m[i];
    if (k <= 0 || k >= 0.95) continue;
    const y = Math.floor(i / W);
    for (let ch = 0; ch < 3; ch++) {
      const c = data[i * 3 + ch];
      const cielo = cieloRiga[y * 3 + ch];
      data[i * 3 + ch] = Math.max(0, Math.min(255, Math.round((c - k * cielo) / (1 - k))));
    }
  }
  return m;
}

/* 4. Il colore del soggetto esteso di `passi` px dentro la maschera: ogni pixel di cielo con un
   vicino di soggetto prende il colore di quel vicino, e così via, un anello per passo. */
function estendi(data, mask, W, H, passi) {
  const n = W * H;
  let fronte = new Uint8Array(mask); // 1 = ancora cielo senza colore preso
  for (let passo = 0; passo < passi; passo++) {
    const prossimo = new Uint8Array(fronte);
    for (let i = 0; i < n; i++) {
      if (!fronte[i]) continue;
      const x = i % W;
      const vicini = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i + W < n ? i + W : -1];
      let r = 0;
      let g = 0;
      let b = 0;
      let c = 0;
      for (const j of vicini) {
        if (j < 0 || fronte[j]) continue;
        r += data[j * 3];
        g += data[j * 3 + 1];
        b += data[j * 3 + 2];
        c++;
      }
      if (c) {
        data[i * 3] = Math.round(r / c);
        data[i * 3 + 1] = Math.round(g / c);
        data[i * 3 + 2] = Math.round(b / c);
        prossimo[i] = 0;
      }
    }
    fronte = prossimo;
  }
}

/* Le due misure dall'alpha (Uint8Array W×H, 0 = trasparente): `linea` e `cima`, vedi in testa. */
export function misuraCielo(alpha, W, H) {
  let linea = -1;
  let cima = -1;
  for (let y = 0; y < H; y++) {
    let opachi = 0;
    for (let x = 0; x < W; x++) if (alpha[y * W + x] >= 128) opachi++;
    if (cima < 0 && opachi >= 0.05 * W) cima = y;
    if (opachi > 0.95 * W) {
      linea = y;
      break;
    }
  }
  const frazione = (y) => Number(((y < 0 ? H : y) / H).toFixed(3));
  return { linea: frazione(linea), cima: frazione(cima) };
}

/* Il taglio di una foto: WebP con alpha in public/images/reali, l'alpha in memoria per le misure. */
async function taglia(f) {
  const p = { ...DEFAULT, ...f };
  const src = join(ROOT, REALI, `${f.nome}.jpg`);
  if (!existsSync(src)) throw new Error(`manca ${src}`);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const esito = maschera(data, W, H, CLASSI[f.classe], p);
  const m = await alfaMorbida(data, esito, W, H, p);
  // 6. Il colore esteso dentro il cielo pieno, poi l'antialias del bordo.
  const pieno = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) pieno[i] = m[i] >= 0.95 ? 1 : 0;
  estendi(data, pieno, W, H, p.estensione);
  const alpha = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = Math.round(255 * (1 - m[i]));
  const sfumata = await sfuma(alpha, W, H, p.sfumatura);
  const alphaMorbida = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) alphaMorbida[i] = Math.round(255 * sfumata[i]);
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = alphaMorbida[i];
  }
  const out = join(ROOT, REALI, `${f.nome}-cielo.webp`);
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).webp(WEBP).toFile(out);
  let cielo = 0;
  for (let i = 0; i < W * H; i++) if (alphaMorbida[i] < 128) cielo++;
  return { out, W, H, rgba, alpha: alphaMorbida, cieloPct: (100 * cielo) / (W * H), ...misuraCielo(alphaMorbida, W, H) };
}

/* I tre punti da guardare da vicino in una foto tagliata: la PUNTA (il pixel opaco più alto: un
   cipresso, la tenda, un tetto), il FONDO (il pixel di cielo più basso: la tasca più profonda fra
   le foglie, o l'orizzonte) e la LINEA (il centro della riga in cui il soggetto riempie la
   larghezza). Finestre 400×300 px sorgente, 1:1. */
function puntiDaGuardare(alpha, W, H) {
  let punta = null;
  let fondo = null;
  for (let i = 0; i < W * H; i++) {
    if (alpha[i] >= 128) {
      if (!punta) punta = [i % W, Math.floor(i / W)];
    } else fondo = [i % W, Math.floor(i / W)];
  }
  return { punta: punta ?? [W / 2, 0], fondo: fondo ?? [W / 2, 0] };
}

/* Il foglio di contatto: le foto su avorio, ridotte, e sotto tre zoom 1:1 (punta, fondo, linea),
   per guardare cipressi, chiome, tetti, glicine e orizzonti: niente aloni azzurri, niente muri
   mangiati, niente tasche di cielo. */
async function contatto(esiti, dir) {
  const AVORIO = "#f9ede8";
  const TW = 400;
  const ZW = 400;
  const ZH = 300;
  const tessere = [];
  let x = 0;
  let hMax = 0;
  for (const e of esiti) {
    const foto = sharp(e.rgba, { raw: { width: e.W, height: e.H, channels: 4 } });
    const th = Math.round((e.H * TW) / e.W);
    const ridotta = await foto.clone().resize(TW, th, { kernel: "lanczos3" }).png().toBuffer();
    tessere.push({ input: ridotta, left: x, top: 0 });
    const { punta, fondo } = puntiDaGuardare(e.alpha, e.W, e.H);
    const finestre = [punta, fondo, [e.W / 2, e.linea * e.H]];
    let y = th + 8;
    for (const [cx, cy] of finestre) {
      const left = Math.min(e.W - ZW, Math.max(0, Math.round(cx - ZW / 2)));
      const top = Math.min(e.H - ZH, Math.max(0, Math.round(cy - ZH / 2)));
      tessere.push({ input: await foto.clone().extract({ left, top, width: ZW, height: ZH }).png().toBuffer(), left: x, top: y });
      y += ZH + 8;
    }
    hMax = Math.max(hMax, y);
    x += TW + 8;
  }
  const foglio = join(dir, "foglio-cieli.png");
  await sharp({ create: { width: x, height: hMax, channels: 3, background: AVORIO } })
    .composite(tessere)
    .png()
    .toFile(foglio);
  return foglio;
}

async function main() {
  // Il foglio di contatto non entra nel repo: una fotografia committata invecchia in silenzio.
  const dir = process.argv[2] ?? join(tmpdir(), "domus-cielo");
  mkdirSync(dir, { recursive: true });
  const esiti = [];
  for (const f of FOTO) {
    if (f.classe === "interno") {
      console.log(`${f.nome}: interno, nessun cielo (${f.uso})`);
      continue;
    }
    const t0 = Date.now();
    const e = await taglia(f);
    const kb = Math.round(statSync(e.out).size / 1024);
    console.log(
      `${f.nome}-cielo.webp  ${e.W}×${e.H}  ${kb} KB  cielo ${e.cieloPct.toFixed(1)} %  cima ${e.cima}  linea ${e.linea}  ${((Date.now() - t0) / 1000).toFixed(1)} s  (${f.uso})`,
    );
    esiti.push({ nome: f.nome, ...e });
  }
  console.log(`foglio di contatto: ${await contatto(esiti, dir)}`);
  // Il JSON lo scrive tinte.mjs, che rilegge i WebP appena scritti.
  const r = spawnSync(process.execPath, [join(ROOT, "scripts/media/tinte.mjs")], { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`tinte.mjs è uscito con ${r.status}`);
}

/* Dietro la guardia d'ingresso (D126): tinte.mjs e i test importano `FOTO`, `fileCielo` e
   `misuraCielo` senza far girare la pipeline. Niente top-level await: tsx compila in CommonJS. */
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((errore) => {
    console.error(errore);
    process.exitCode = 1;
  });
}
