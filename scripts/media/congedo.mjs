// IL VIDEO DEL CONGEDO: LA CLIP DA 02:00 DEL MASTER 4K (A29 di Alberto, 18 settembre 2026).
//
// Chi l'ha chiesto: A29 («inoltre vorrei che alla fine, quando c'è il video a pieno schermo, sia
// il video completo non una parte»), precisata la sera stessa: «fallo partire da 02:00», e
// ribadita il 20 settembre («doveva iniziare come prima a 02:00»). La finestra è quella decisa
// dal coordinatore e da Alberto (A33.3, D102 di qualita/a29/commit-congedo-brief.md): dal
// fotogramma 120,000 s per 556 fotogrammi, cioè fino a 142,200 s, 22,24 s netti. Non «fino
// alla fine»: da 143,24 s il master è una cartolina NERA col logo, il divieto della cliente.
//
// Com'è fatto: la ricetta di qualita/a29/attrezzi/enc.sh (§6.1 del brief C), misurata il 19
// settembre su ffmpeg 8.1.1. Dal 20 settembre (A44 di Alberto: «il video alla fine di Raffaela
// è senza audio»; già A30: «quella parte è proprio dove parla Raffaela») le clip portano ANCHE
// la traccia audio del master: `-map 0:a:0`, AAC 128 kb/s stereo nei MP4 e Opus 96 kb/s nei
// WebM, coi filtri di D117: `afade` in ingresso di 0,6 s (`st=0`, mai `st=120`: dopo `-ss` i
// tempi ripartono da zero e con 120 la clip esce MUTA) e `alimiter=limit=0.891:level=disabled`
// (il master clippa già a 0,0 dB; senza `level=disabled` il limiter rinormalizza e annulla il
// tetto). In più, perché qui il video è in LOOP e non un pezzo che finisce, un `afade` in
// uscita di 0,6 s sul punto di giunta (21,64 → 22,24 s), che il brief non aveva perché lì il
// pezzo finiva. `-t 22.24` accanto a `-frames:v 556`: `-frames:v` conta solo i fotogrammi e
// senza `-t` l'audio correrebbe fino alla fine del master (2'25"), 2,8 s oltre il video.
// Il <video> del Congedo resta `muted` all'avvio (l'autoplay col suono i browser lo negano):
// il suono lo accende l'interruttore «Sonoro» di Congedo.tsx, che riporta la clip a 0 e la fa
// ripartire con la voce. media-file.test.ts vuole `vide` + `soun` sulle clip del Congedo e solo
// `vide` sull'acqua. I nomi restano `congedo-drone-*` così nessun consumatore cambia (media.ts,
// gli e2e, le sonde); il poster è `congedo-poster.jpg` (Next 16, `minimumCacheTTL` di 4 ore).
// Le otto trappole di §6.1: `-frames:v 556` (il fotogramma del taglio), `-map 0:v:0` (via il
// flusso tmcd e la miniatura mjpeg), GOP 2 s a keyframe fissi (`-g 50 -keyint_min 50
// -sc_threshold 0`: 12 keyframe, il seek regge), tag bt709, `-write_tmcd 0`, `-map_metadata -1`,
// `+faststart` (moov prima del mdat). Il poster è il PRIMO fotogramma della clip (120,000 s:
// terrazza e cielo, nessuna persona, A27), JPEG 1920×1080 senza metadati.
//
// Uso, dalla radice del repo, con il master di Alberto in Downloads (mai dai derivati):
//   node scripts/media/congedo.mjs [percorso-del-master]
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MASTER = process.argv[2] ?? "C:/Users/alber/Downloads/Tradate Via Cima rossa.mov";
const DA = 120; // s: 02:00
const FOTOGRAMMI = 556; // 120,000 → 142,200 a 25 fps
const DURATA = "22.24"; // s: 556 fotogrammi a 25 fps, il tetto dell'audio
const OUT = join(ROOT, "public/media");
// D117 più la dissolvenza in uscita del loop (vedi sopra).
const AUDIO = ["-af", "afade=t=in:st=0:d=0.6:curve=qsin,afade=t=out:st=21.64:d=0.6:curve=qsin,alimiter=limit=0.891:level=disabled", "-ac", "2", "-ar", "48000"];
const COLORE = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"];
const GOP = ["-g", "50", "-keyint_min", "50"];

if (!existsSync(MASTER)) {
  console.error(`manca il master: ${MASTER}`);
  process.exit(1);
}

function ffmpeg(args, uscita) {
  const t0 = Date.now();
  const r = spawnSync("ffmpeg", ["-nostdin", "-hide_banner", "-loglevel", "error", "-y", ...args, uscita], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`ffmpeg è uscito con ${r.status} su ${uscita}`);
    process.exit(r.status ?? 1);
  }
  console.log(`${uscita.slice(ROOT.length + 1)}  ${(statSync(uscita).size / 1048576).toFixed(2)} MiB  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

for (const [r, scala] of [
  ["1080", "1920:1080"],
  ["720", "1280:720"],
]) {
  const comune = ["-ss", String(DA), "-i", MASTER, "-map", "0:v:0", "-map", "0:a:0", "-frames:v", String(FOTOGRAMMI), "-t", DURATA, "-vf", `scale=${scala}:flags=lanczos`, ...AUDIO];
  ffmpeg(
    [...comune, "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-pix_fmt", "yuv420p", ...COLORE, ...GOP, "-sc_threshold", "0", "-c:a", "aac", "-b:a", "128k", "-write_tmcd", "0", "-map_metadata", "-1", "-movflags", "+faststart"],
    join(OUT, `congedo-drone-${r}.mp4`),
  );
  ffmpeg(
    [...comune, "-c:v", "libvpx-vp9", "-crf", "38", "-b:v", "0", "-row-mt", "1", "-tile-columns", "2", ...GOP, "-pix_fmt", "yuv420p", ...COLORE, "-c:a", "libopus", "-b:a", "96k", "-map_metadata", "-1"],
    join(OUT, `congedo-drone-${r}.webm`),
  );
}
// Il poster: il primo fotogramma della clip, JPEG senza Exif/XMP/IPTC/COM (media-file.test.ts).
ffmpeg(
  ["-ss", String(DA), "-i", MASTER, "-map", "0:v:0", "-frames:v", "1", "-vf", "scale=1920:1080:flags=lanczos", "-q:v", "3", "-map_metadata", "-1", "-fflags", "+bitexact", "-flags", "+bitexact"],
  join(OUT, "congedo-poster.jpg"),
);
console.log("fatto: quattro clip da 02:00 (556 fotogrammi, con l'audio) e il poster");
