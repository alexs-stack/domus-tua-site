// LA TINTA DEL PLACEHOLDER E I DATI DELL'INQUADRATURA DI OGNI TESTA (D187 del brief T, A38).
//
// Chi l'ha chiesto: D78 di A28 (Alberto, 18 settembre 2026, punto 6: la pagina continua sopra
// la foto) e D125 (la tinta come placeholder del riquadro prima del decode); A38 (20 settembre)
// ha portato le scritte dentro la foto a schermo intero e D187 ha ridotto le tinte a questo:
// per rotta il trattamento (`testa` sulle nove, `fermo` sui due legali), la foto, la sorgente
// in px (per `sizesDi`, D183), le due inquadrature (`objectPosition.lg` e `.sotto`, scelte da
// T1.0 in qualita/a38/misure/cancello-T1.md: A27 prima, poi il numero sulla sola foto, D180),
// e la sola tinta ALTA. La banda BASSA, l'acqua di /servizi, il margine `m` (A41: la foto è
// sticky e ferma, nessuna parallasse), `parallasse`, `ancoraggio`, `cornice` e `strato` sono morti:
// sotto la foto la pagina è l'avorio (A32.3 vale sotto) e da lg la striscia della testata
// tinta non esiste più (la testata è trasparente sopra la foto, D186).
//
// Dove vive la tinta alta (D82, D125): sotto lg la barra sticky `header[data-solid]` la prende
// da 24 px di scroll, e il riquadro la mostra prima che la foto decodifichi, su ogni fascia.
// Quindi la banda si misura sul ritaglio che il TELEFONO vede a riposo (390×844, `objectPosition
// .sotto`, m 0: lo strato è il riquadro), le prime 24 righe sorgente sotto la testata: è la foto
// che la barra copre scorrendo. Da lg il placeholder riusa lo stesso valore: un compromesso
// dichiarato (D125), perché da lg la tinta vive solo i 100-300 ms del decode.
//
// Com'è fatto oggi: sharp legge le undici fotografie; per ciascuna si ricostruisce il cover del
// riquadro 390×844 con l'`objectPosition.sotto`, si fa la MEDIA IN LUCE LINEARE della banda
// alta e la si schiarisce verso il bianco finché la luminanza relativa arriva al pavimento di
// lavoro (0,5329: 4,5:1 col rosso cupo e con l'inchiostro di «Menu»); se la banda schiarita
// resta indistinguibile dall'avorio (< 1,49:1, D123) la rotta dichiara "avorio" col numero
// misurato accanto. L'uscita è `app/lib/motion/tinte.json`, committato, che `PageHero.tsx`
// (server) emette in uno <style> nell'HTML iniziale.
//
// MAI `stats().dominant`: su `villa-uliveto.jpg` e `villa-lettini.jpg` restituisce `#080808`,
// cioè un nero — l'unica cosa che la cliente vieta.
//
// IL CIELO MASCHERATO (A46 di Alberto, 21 settembre 2026, sera: «su eraresidence questa foto che
// usa come background alta ha il cielo mascherato, è no bg … dobbiamo fare la stessa cosa nel
// nostro sito, dove ci sono le immagini così alte»). scripts/media/cielo.mjs taglia il cielo
// delle teste in `<nome>-cielo.webp` (alpha) e rilancia questo script, che importa da lì la
// tabella `FOTO` e `misuraCielo` e scrive per rotta `cielo: { file, linea, cima }` (il WebP e le
// due frazioni d'altezza, vedi cielo.mjs; per i due attici interni e i due legali `file` null e
// 0). Dove il cielo è trasparente la banda alta si misura sull'immagine COMPOSTA SU AVORIO (è
// quello che il visitatore vede) e la tinta alta è "avorio" PER FORZA, qualunque sia la misura:
// il fondo del riquadro si vede attraverso il cielo per sempre, non solo prima del decode, e
// deve essere il fondo pagina (`--color-cream`, PageHero.tsx), altrimenti il cielo della tenda di
// /open-domus (la banda misurata è la tenda, non il cielo) staccherebbe dalla carta.
//
// Uso, dalla radice del repo:  node scripts/media/tinte.mjs
import sharp from "sharp";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { FOTO as CIELI, fileCielo, misuraCielo } from "./cielo.mjs";

const ROOT = process.cwd();
const USCITA = "app/lib/motion/tinte.json";

/* La scatola su cui si misura la banda: il riquadro del telefono a riposo (D176: `min-height:
   100svh`, dal pixel 0 sotto la testata sticky trasparente), a 390×844. */
export const SCATOLA = { w: 390, h: 844 };

/* Le undici teste. `lg` e `sotto` vengono da qualita/a38/misure/cancello-T1.md (T1.0, D180): A27
   prima (nucleo del soggetto entro 5 punti dal massimo raggiungibile su quel viewport), poi il
   numero sulla sola foto come spareggio; le sette che tengono la foto di oggi hanno la `lg` di
   D180, le due foto nuove (D173, D181) l'hanno dalla griglia di 25. `tinte.test.ts` riverifica
   sul sorgente che PageHero legga da qui, così la misura non può divergere dal markup. */
/* A44 (20 set. 2026): le nove teste hanno le foto ALTE generate con Higgsfield (2:3, 2560×3816,
   scripts/media/foto-alte.mjs). Da lg a riposo si vede la CIMA (`lg: "50% 0%"`: cielo o soffitto
   sotto le scritte bianche) e usePanTesta la percorre scorrendo; sul telefono un 2:3 sta quasi
   intero in 390×844, centrato (`sotto: "50% 50%"`), e la banda alta si misura lì. I due legali
   restano fermi sulle foto di prima. */
const ROTTE = [
  { rotta: "/vendi", trattamento: "testa", file: "public/images/reali/villa-facciata-piscina-alta.jpg", lg: "50% 0%", sotto: "50% 50%" },
  { rotta: "/acquista", trattamento: "testa", file: "public/images/reali/villa-lettini-prato-alta.jpg", lg: "50% 0%", sotto: "50% 50%" },
  { rotta: "/servizi", trattamento: "testa", file: "public/images/reali/villa-angolo-piscina-alta.jpg", lg: "50% 0%", sotto: "50% 50%" },
  { rotta: "/metodo", trattamento: "testa", file: "public/images/reali/villa-vetrata-sera-alta.jpg", lg: "50% 0%", sotto: "50% 50%" },
  { rotta: "/open-domus", trattamento: "testa", file: "public/images/reali/villa-portico-tenda-alta.jpg", lg: "50% 0%", sotto: "50% 50%" },
  { rotta: "/chi-siamo", trattamento: "testa", file: "public/images/reali/attico-travi-alta.jpg", lg: "50% 0%", sotto: "50% 50%" },
  { rotta: "/recensioni", trattamento: "testa", file: "public/images/reali/villa-salotto-esterno-alta.jpg", lg: "50% 0%", sotto: "50% 50%" },
  /* D181: hero_02 (1920×1067, senza persone) al posto di attico-tradate (1200×800, render). */
  { rotta: "/lavora-con-noi", trattamento: "testa", file: "public/images/reali/attico-studio-alta.jpg", lg: "50% 0%", sotto: "50% 50%" },
  /* D173: la piscina di notte (1920×1280, senza persone) al posto di consulenza.jpg (A27 sul telefono). */
  { rotta: "/domande-frequenti", trattamento: "testa", file: "public/images/reali/villa-piscina-lunga-alta.jpg", lg: "50% 0%", sotto: "50% 50%" },
  { rotta: "/privacy", trattamento: "fermo", file: "public/images/hero_01_attico_travi_salotto.jpg", lg: "50% 50%", sotto: "0% 50%" },
  { rotta: "/cookie", trattamento: "fermo", file: "public/images/reali/villa-uliveto.jpg", lg: "60% 50%", sotto: "75% 50%" },
];

/* Il pavimento di lavoro di §4.3: 0,5329 = 4,5:1 col rosso cupo #a30707 e, a maggior ragione,
   con l'inchiostro #46423d di «Menu» sulla barra `data-solid`; l'assoluto (0,4241, 4,5:1 con
   ink) sta sotto e lo presidia `tinte.test.ts` sul valore che la pagina spedisce. */
const PAVIMENTO = 0.5329;
/* Il cancello di parentela della banda alta (D123): distanza di valore dall'avorio ≥ 1,49:1, a
   due decimali; sotto, la rotta dichiara l'avorio col numero. */
export const CANCELLO_ALTA = 1.49;
/* La banda: le prime 24 righe SORGENTE del ritaglio visibile. */
const BANDA = 24;
const AVORIO = "#f9f5ef";

const LUT = Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const aLineare = (v) => LUT[v];
const aSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const lumaY = (lin) => 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
const byte = (c) => Math.round(Math.min(1, Math.max(0, aSrgb(c))) * 255);
const hex = (lin) => "#" + lin.map((c) => byte(c).toString(16).padStart(2, "0")).join("");
const daHex = (h) => [1, 3, 5].map((i) => aLineare(parseInt(h.slice(i, i + 2), 16)));

/* Lab D65 dalla luce lineare sRGB, per il C* e per il ΔH′ della CIEDE2000. */
function lab(lin) {
  const [r, g, b] = lin;
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const fx = f(X);
  const fy = f(Y);
  const fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const croma = (lin) => {
  const [, a, b] = lab(lin);
  return Math.hypot(a, b);
};

/* ΔH′ della CIEDE2000 — la differenza di TINTA, che è l'asse della parentela (§4.2). */
function deltaH(lin1, lin2) {
  const [, a1, b1] = lab(lin1);
  const [, a2, b2] = lab(lin2);
  const cBar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g = 0.5 * (1 - Math.sqrt(cBar ** 7 / (cBar ** 7 + 25 ** 7)));
  const ap1 = a1 * (1 + g);
  const ap2 = a2 * (1 + g);
  const cp1 = Math.hypot(ap1, b1);
  const cp2 = Math.hypot(ap2, b2);
  if (cp1 * cp2 === 0) return 0;
  const gradi = (y, x) => ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  let dh = gradi(b2, ap2) - gradi(b1, ap1);
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return Math.abs(2 * Math.sqrt(cp1 * cp2) * Math.sin((dh * Math.PI) / 360));
}

const contrasto = (y1, y2) => (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
const Y_AVORIO = lumaY(daHex(AVORIO));

/* Il ritaglio che la scatola MOSTRA, in pixel SORGENTE: `object-cover` più `objectPosition` con
   l'aritmetica del browser (persone.md §1.4). Lo strato è la scatola (m 0 sotto lg, D128). */
export function ritaglio(srcW, srcH, scatola, objectPosition) {
  const [px, py] = objectPosition.split(/\s+/).map((v) => parseFloat(v) / 100);
  const scala = Math.max(scatola.w / srcW, scatola.h / srcH);
  const width = Math.min(srcW, Math.round(scatola.w / scala));
  const height = Math.min(srcH, Math.round(scatola.h / scala));
  return { left: Math.round((srcW - width) * px), top: Math.round((srcH - height) * py), width, height };
}

/* La media della banda IN LUCE LINEARE: la media fotometrica, non quella dei byte. `immagine` è
   una pipeline sharp: la foto, o il WebP col cielo composto sull'avorio (A46). */
async function media(immagine, box) {
  const { data, info } = await immagine.clone().extract(box).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    r += aLineare(data[i]);
    g += aLineare(data[i + 1]);
    b += aLineare(data[i + 2]);
  }
  return [r / n, g / n, b / n];
}

/* La schiaritura verso il bianco IN LUCE LINEARE, con la correzione dell'arrotondamento a 8 bit. */
function schiarisci(lin, pavimento) {
  const y0 = lumaY(lin);
  let t = y0 >= pavimento ? 0 : (pavimento - y0) / (1 - y0);
  for (let i = 0; i < 128; i += 1) {
    const h = hex(lin.map((c) => c + t * (1 - c)));
    if (lumaY(daHex(h)) >= pavimento) return h;
    t = Math.min(1, t + 0.002);
  }
  throw new Error("schiaritura: il pavimento non si raggiunge");
}

function metriche(h, sorgente) {
  const lin = daHex(h);
  const y = lumaY(lin);
  return {
    hex: h,
    sorgente,
    Y: Number(y.toFixed(4)),
    dH: Number(deltaH(lin, daHex(sorgente)).toFixed(2)),
    C: Number(croma(lin).toFixed(2)),
    avorio: Number(contrasto(y, Y_AVORIO).toFixed(3)),
  };
}

/* LA PIPELINE DIETRO UNA GUARDIA D'INGRESSO (D126): gira solo quando il file è il programma
   lanciato, così `tinte.test.ts` importa `ritaglio` e `SCATOLA` senza decodificare undici foto. */
/* Il cielo di una rotta (A46): il WebP con alpha di cielo.mjs, riletto per le due misure, e la
   stessa immagine composta sull'avorio per la banda; null dove la rotta non ha cielo. */
async function cieloDi(rotta, meta) {
  const f = CIELI.find((c) => c.uso === rotta);
  const file = f ? fileCielo(f) : null;
  if (!file) return null;
  const percorso = join(ROOT, "public", file);
  if (!existsSync(percorso)) throw new Error(`manca ${file}: lancia prima node scripts/media/cielo.mjs`);
  const { data, info } = await sharp(percorso).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== meta.width || info.height !== meta.height) throw new Error(`${file}: ${info.width}×${info.height}, la sorgente è ${meta.width}×${meta.height}`);
  const alpha = new Uint8Array(info.width * info.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  return { file, ...misuraCielo(alpha, info.width, info.height), composta: sharp(percorso).flatten({ background: AVORIO }) };
}

async function main() {
  const esito = {};
  const righe = [];
  for (const r of ROTTE) {
    if (!existsSync(join(ROOT, r.file))) throw new Error(`manca ${r.file}`);
    const meta = await sharp(join(ROOT, r.file)).metadata();
    const box = ritaglio(meta.width, meta.height, SCATOLA, r.sotto);
    const alto = { ...box, height: Math.min(BANDA, box.height) };
    const cielo = await cieloDi(r.rotta, meta);
    const sorgenteAlta = hex(await media(cielo ? cielo.composta : sharp(join(ROOT, r.file)), alto));
    const misurata = metriche(schiarisci(daHex(sorgenteAlta), PAVIMENTO), sorgenteAlta);
    // A46: col cielo trasparente la tinta è l'avorio per forza; altrimenti il cancello di D123.
    const alta = cielo || misurata.avorio < CANCELLO_ALTA ? { ...misurata, hex: "avorio", misurato: misurata.hex } : misurata;
    esito[r.rotta] = {
      trattamento: r.trattamento,
      file: r.file.replace(/^public/, ""),
      sorgente: [meta.width, meta.height],
      objectPosition: { lg: r.lg, sotto: r.sotto },
      alta,
      cielo: cielo ? { file: cielo.file, linea: cielo.linea, cima: cielo.cima } : { file: null, linea: 0, cima: 0 },
    };
    righe.push(
      [
        r.rotta.padEnd(19),
        r.trattamento.padEnd(6),
        `${meta.width}x${meta.height}`.padEnd(10),
        `lg ${r.lg}`.padEnd(12),
        `sotto ${r.sotto}`.padEnd(15),
        `righe ${box.top}-${box.top + alto.height}`.padEnd(17),
        `alta ${alta.hex.padEnd(7)} (${misurata.hex} <- ${misurata.sorgente}  Y ${misurata.Y.toFixed(4)}  C* ${String(misurata.C).padStart(5)}  dH ${String(misurata.dH).padStart(5)}  avorio ${misurata.avorio.toFixed(3)}:1)`,
        cielo ? `cielo cima ${cielo.cima} linea ${cielo.linea}` : "senza cielo",
      ].join("  "),
    );
  }

  writeFileSync(join(ROOT, USCITA), `${JSON.stringify(esito, null, 2)}\n`);
  console.log(righe.join("\n"));
  console.log(`\n${USCITA}: ${Object.keys(esito).length} rotte, banda alta di ${BANDA} righe sorgente sul ritaglio del telefono ${SCATOLA.w}x${SCATOLA.h}.`);
}

/* Senza top-level await: `tinte.test.ts` gira in CommonJS e tsx compila anche questo modulo in
   CommonJS, dove esbuild rifiuta il top-level await. */
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((errore) => {
    console.error(errore);
    process.exitCode = 1;
  });
}
