/* LA LASTRA — l'entrata alla Lusion del video della home (A35 di Alberto, 19-20 settembre 2026).
   «vorrei avere queste animazione di entrata nel video come nel sito di lusion»: il poster del
   Congedo parte come una fotografia piccola sul margine del testo e, mentre si scorre, cresce
   piegandosi come un foglio fino alla banda piena e piatta. Direttive: docs/direttive-video-entrata.md
   (misure in .superpowers/sdd/…/qualita/a35/). Questo modulo è PURO (niente DOM, niente React):
   i numeri, la geometria del foglio e gli shader; il DOM lo fa useLastra.ts.

   Le due scatole (A42 di Alberto, 20 set. ~15:00: «il video va a destra della scritta, poi con lo
   scroll si apre con l'attuale animazione»; «deve diventare a schermo intero pieno come era dei
   commit fa»): la miniatura `da` è lo slot 16:9 a destra del titolo nella testa in flusso
   (`.dt-postcard_slot`, largo min(42vw, 640px) come la metà), lo schermo intero `a` è lo sticky
   100vw × 100svh. Tutte e due si leggono a ogni fotogramma in coordinate di VIEWPORT da due scatole
   mai trasformate (getBoundingClientRect di slot e schermo: qui nessun offset*, perché la miniatura
   sta fuori dallo schermo e lo schermo, agganciato, si sposta); il canvas è `fixed` sul viewport e
   il ritaglio DOM (via scala) riceve la trasformata relativa allo schermo.

   Il riferimento (lusion.co, `#home-reel`, hoisted.js @665900-667600) è un piano 32×32 in WebGL:
   ogni vertice ha un peso w = 1 − (x^1,5 + (1−y)^1,5)/2 e un progresso proprio
   v = smoothstep(0,3w, 0,7 + 0,3w, e), così l'angolo alto-destro parte per primo e il basso-sinistro
   per ultimo; più un'onda orizzontale del 10 % e una rotazione IN PIANO fino a 5,51° (nessuna
   prospettiva: A22). Qui c'è in più il fattore di piega `k`: a k = 1 il vertice è quello di Lusion,
   a k = 0 tutti i vertici hanno il progresso del vertice centrale, vu = smoothstep(0,15, 0,85, e):
   un rettangolo piatto, allineato agli assi, della misura intermedia. È lo stato in cui il foglio si
   distende quando lo scroll si ferma (la sosta: niente calamita, niente scroll-hijack) e insieme la
   via di riserva «scala» senza WebGL (il poster DOM riceve translate + scale).
   Differenze dichiarate da Lusion: poster fermo o il fotogramma vivo del loop muto, mai un video
   stirato (16:9 in 16:9, A27); niente tinta, angoli tondi, nastro, testo o tasto sopra la foto (C14,
   D108, D111); spento sotto MQ.corridor e con moto ridotto. */

/** I segmenti del piano (32×32 come Lusion). */
export const SEG = 32;
/** DPR massimo del canvas (memoria: 1440×900 a 1,5² × 4 byte ≈ 8,7 MB). */
export const DPR_MAX = 1.5;
/** La corsa dell'entrata (svh) e l'anticipo sull'aggancio dello sticky: 0,65 · 100 = 65svh, così a
    e 0 la testa (titolo a sinistra, miniatura a destra: ~555 px a 1440×900) è tutta a schermo e il
    foglio finisce di aprirsi 35svh dopo l'aggancio, a schermo già fermo. */
export const CORSA_SVH = 100;
export const ANTICIPO = 0.65;
/** Il pianerottolo a foglio disteso prima della cartolina (svh). */
export const PIAN_SVH = 20;
/** La sosta: nessun evento scroll per IDLE_MS con 0 < e < 1 → k → 0 in PIEGA_S secondi (dtCartolina). */
export const IDLE_MS = 250;
export const PIEGA_S = 0.6;
/** La sonda del renderer: il costo di UN draw del foglio a e 0,5, dentro il viewport, AL NETTO della
    lettura sincrona (`costoDraw`); sopra questa soglia → via scala (su canvas più grandi di PX_SONDA
    la soglia cresce coi pixel: `sogliaSonda`). Misurato il 23 set. a 1440×828:
    GPU vere 0,2-1 ms (Surface Pro 11, Adreno X1, Firefox a DPR 2 e Chromium), SwiftShader 5-15 ms a
    DPR 1. La sonda di prima (media dei draw 2-4 CON la lettura) sul Surface dava 2-3 ms anche senza
    nessun draw: svuotare la pipeline, risolvere l'MSAA del canvas intero e tornare dal processo della
    GPU costa lì più della soglia, e Firefox arrotonda performance.now() al millisecondo. La piega,
    disegnata davvero, ci gira a 60 fps (p95 16,7 ms). E non misura più sotto il sipario: gira a entrata
    della home finita, a giri, e per bocciare vuole una conferma (SONDA_PASSO_MS, giudizioSonda). */
export const SONDA_DRAW_MS = 1.5;
/** La sonda: draw per campione pieno e coppie di campioni (vuoto, pieno) alternati, dopo un pieno di scaldo. */
export const DRAW_SONDA = 4;
export const CAMPIONI_SONDA = 3;
/** Il canvas su cui SONDA_DRAW_MS è tarata: 1440×828 a DPR 1,5 (il Surface, DPR 2 fermato a DPR_MAX). */
export const PX_SONDA = 2160 * 1242;
/** Sopra il canvas di taratura le soglie della sonda crescono coi pixel; sotto restano quelle. */
const perPixel = (ms: number, px: number): number => ms * Math.max(1, px / PX_SONDA);

/** La soglia della sonda per un canvas di `px` pixel. Il draw colora metà del viewport, quindi il suo
    costo cresce coi pixel: sopra PX_SONDA la soglia cresce con loro, sotto resta SONDA_DRAW_MS. Sullo
    stesso Adreno a 2560×1440 (canvas 3840×2160, un monitor esterno) il costo va a 0,9-1,8 ms e a soglia
    fissa la sonda rifiutava 2 volte su 20; SwiftShader resta sopra di 3 volte a ogni misura. */
export const sogliaSonda = (px: number): number => perPixel(SONDA_DRAW_MS, px);

/* IL CANCELLO A TEMPO (23 set., seconda correzione). Sulla home vera il cancello girava al whenStill
   del montaggio, cioè sotto il sipario (idratazione, precarico di tutte le immagini, la gomma): lì le
   letture sincrone aspettavano 6-12 ms (vuoti [11, 6, 12], pieni [11, 10, 11]) e sul Surface Pro 11 la
   sonda leggeva, a freddo, 0,5-1,75 ms in Firefox (1,75 → scala; 1,50 sulla soglia) e 1,05-1,45 in
   Chromium; la stessa sonda a pagina ferma 0,25-1,0. Ora useLastra la fa girare a entrata della home
   finita, in un'`occasione` (idle, scheda in vista, scroll fermo, fuori dalla piega), a giri separati. */
/** Il passo del cancello: la sonda parte SONDA_PASSO_MS dopo l'handoff del sipario (o dopo il montaggio,
    se il sipario non c'è), i giri stanno a SONDA_PASSO_MS l'uno dall'altro, ed è anche il tetto dell'idle
    e il passo con cui si riguarda un momento che non va. 1,5 s: più della coda della gomma dopo l'handoff
    (1,05 s a tempo, 0,82 veloce), e abbastanza per scorrelare un intoppo di passaggio (GC, decodifica, la
    GPU che sale di frequenza). */
export const SONDA_PASSO_MS = 1500;
/** I giri al massimo; la GPU buona ne vuole uno. */
export const SONDA_PROVE = 3;
/** Un giro è torbido se anche il vuoto più corto (clear + readPixels 1×1) supera questo tempo: la GPU è
    occupata da altro e la differenza non dice niente. A riposo 1-3 ms (Adreno X1: Firefox 2-3, Chromium
    1-1,8; SwiftShader col minimo sotto 2), sotto il sipario della home 6-12. Il vuoto risolve l'MSAA del
    canvas intero, quindi sopra PX_SONDA la soglia cresce coi pixel (`sogliaTorbido`). */
export const SONDA_TORBIDO_MS = 5;
export const sogliaTorbido = (px: number): number => perPixel(SONDA_TORBIDO_MS, px);
/** Un giro pulito oltre SONDA_TETTO volte la soglia boccia subito: nessuna GPU vera è andata oltre 1,8 ms
    (3840×2160) né 1,75 (sotto il sipario); SwiftShader non è mai sceso sotto 4,95 a DPR 1, e il tetto a
    1440×828 è 4,5. Niente altri giri, che lì costano 200 ms l'uno. */
export const SONDA_TETTO = 3;
/** L'entrata della home trattiene il cancello: il sipario (Preloader.tsx toglie data-preloader a gomma
    finita) e la salita dell'hero (HeroCinematic.tsx toglie data-hero-entrata a salita finita: sul film a
    ~10 s, l'handoff più 4,8). Mai oltre ENTRATA_TETTO_MS dalla navigazione: è la rete per un attributo
    rimasto appeso. */
export const ENTRATA_ATTR = ["data-preloader", "data-hero-entrata"] as const;
export const ENTRATA_TETTO_MS = 15000;
export const entrataInCorso = (ha: (attr: string) => boolean, ora: number): boolean =>
  ora < ENTRATA_TETTO_MS && ENTRATA_ATTR.some((a) => ha(a));
/** I renderer software si riconoscono dal nome (WEBGL_debug_renderer_info): SwiftShader (la CI), llvmpipe
    e softpipe (Mesa), «Software Rasterizer», «Apple Software Renderer», WARP («Microsoft Basic Render
    Driver», anche nel nome ripulito di Firefox). WARP passa la sonda (0,25-0,5 ms): lo ferma solo il nome. */
export const RENDERER_SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;
export type Rett = { x: number; y: number; w: number; h: number };

const smooth = (e0: number, e1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Il progresso del vertice centrale: la misura del foglio piatto a k 0. */
export const vu = (e: number): number => smooth(0.15, 0.85, e);

/** Il peso di Lusion, con yd dall'alto: alto-destro (1, 0) → 0, basso-sinistro (0, 1) → 1. Il peso RITARDA
    (`progresso` parte a 0,3·w), quindi l'alto-destro parte per primo e il basso-sinistro per ultimo. */
export const peso = (x: number, yd: number): number => 1 - (Math.pow(x * x, 0.75) + Math.pow(1 - yd, 1.5)) / 2;

/** Il progresso proprio del vertice (x, yd) a progresso globale e, come Lusion. */
export const progresso = (e: number, x: number, yd: number): number => {
  const w = peso(x, yd);
  return smooth(w * 0.3, 0.7 + w * 0.3, e);
};

/** Il punto (px) del vertice (x, yd) a progresso e e piega k, fra la miniatura `da` e la banda `a`. */
export function puntoK(e: number, x: number, yd: number, da: Rett, a: Rett, k: number): { x: number; y: number; v: number } {
  const vs = progresso(e, x, yd);
  const v = vu(e) + (vs - vu(e)) * k;
  let dx = da.x + (a.x - da.x) * v;
  const dy = da.y + (a.y - da.y) * v;
  const dw = da.w + (a.w - da.w) * v;
  const dh = da.h + (a.h - da.h) * v;
  dx += dw * 0.1 * (0.5 - Math.cos(v * 2 * Math.PI) / 2) * k;
  const px = x * dw - dw * 0.5;
  const py = yd * dh - dh * 0.5;
  const ang = 2 * (smooth(0, 1, v) - v) * -0.5 * k;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: px * c - py * s + dw * 0.5 + dx, y: px * s + py * c + dh * 0.5 + dy, v };
}

/** La scatola di un elemento in coordinate di viewport (getBoundingClientRect: l'elemento non deve avere transform). */
export const rettDi = (r: { left: number; top: number; width: number; height: number }): Rett => ({ x: r.left, y: r.top, w: r.width, h: r.height });

/** Il rettangolo d'ingombro del foglio (bordo campionato a n punti per lato): il marcatore data-bg lo segue (A21). */
export function ingombro(e: number, da: Rett, a: Rett, k: number, n = 17): Rett {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const vedi = (p: { x: number; y: number }) => {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  };
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    vedi(puntoK(e, t, 0, da, a, k));
    vedi(puntoK(e, t, 1, da, a, k));
    vedi(puntoK(e, 0, t, da, a, k));
    vedi(puntoK(e, 1, t, da, a, k));
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Il foglio piatto a k 0 (la via scala): la scatola intermedia fra `da` e `a` a progresso e. */
export function scatolaPiatta(e: number, da: Rett, a: Rett): Rett {
  const v = vu(e);
  return { x: da.x + (a.x - da.x) * v, y: da.y + (a.y - da.y) * v, w: da.w + (a.w - da.w) * v, h: da.h + (a.h - da.h) * v };
}

/** La sonda del renderer: il costo di un draw al netto della lettura sincrona. `vuoti` sono i tempi di
    clear + readPixels 1×1, `pieni` quelli di clear + `n` draw + readPixels; si confrontano i minimi.
    Il rumore del cronometro si somma e basta (un'interruzione, la GPU che sale di frequenza dopo il
    riposo: sul Surface in Chromium i pieni del primo giro scendono 7,4 → 6,3 → 5,4 ms), quindi il
    campione più corto è il più vicino al costo vero. Mai sotto zero. */
export function costoDraw(vuoti: number[], pieni: number[], n: number): number {
  return Math.max(0, (Math.min(...pieni) - Math.min(...vuoti)) / n);
}

/** Le scatole della sonda: quelle vere, ma dentro il viewport `vp`. Quando il cancello gira slot e schermo
    stanno di solito migliaia di px sotto (la home si apre in cima) e un draw fuori dal viewport non
    colorerebbe un pixel: la sonda misurerebbe solo la lettura. La miniatura sta a metà altezza, lo
    schermo è il viewport, come a schermo agganciato. */
export function scatoleSonda(slot: Rett, vp: { w: number; h: number }): { da: Rett; a: Rett } {
  return { da: { x: slot.x, y: (vp.h - slot.h) / 2, w: slot.w, h: slot.h }, a: { x: 0, y: 0, w: vp.w, h: vp.h } };
}

/** Un giro della sonda: il costo di un draw (costoDraw) e se era torbido, cioè se anche il vuoto più
    corto supera sogliaTorbido per il canvas di `px` pixel. */
export type Giro = { costo: number; torbido: boolean };
export const giro = (vuoti: number[], pieni: number[], px: number): Giro => ({
  costo: costoDraw(vuoti, pieni, DRAW_SONDA),
  torbido: Math.min(...vuoti) > sogliaTorbido(px),
});

export type Giudizio = { esito: "gl" | "scala" | "ancora"; costo: number };

/** Il giudizio del cancello dopo i giri fatti finora, asimmetrico. Il rumore (un task, la GPU che sale di
    frequenza, il compositore) si somma ai pieni: fa sembrare lenta una GPU veloce, e veloce una lenta solo
    se gonfia anche i vuoti, cioè in un giro torbido. Quindi un giro pulito ≤ soglia basta per gl; per la
    scala serve una conferma: un giro pulito oltre SONDA_TETTO × soglia, o due puliti sopra soglia. Senza
    conferma si fa un altro giro, e al SONDA_PROVE-esimo decide il minimo di tutti i giri: i torbidi non
    promuovono da soli prima, e una GPU sulla soglia non si boccia per un giro solo. `costo` è il numero
    su cui poggia il giudizio. */
export function giudizioSonda(giri: readonly Giro[], soglia: number): Giudizio {
  const puliti = giri.filter((g) => !g.torbido).map((g) => g.costo);
  const pulito = Math.min(...puliti); // Infinity senza giri puliti
  if (pulito <= soglia) return { esito: "gl", costo: pulito };
  if (puliti.length > 0 && (pulito > SONDA_TETTO * soglia || puliti.length >= 2)) return { esito: "scala", costo: pulito };
  const tutti = Math.min(...giri.map((g) => g.costo));
  if (giri.length < SONDA_PROVE) return { esito: "ancora", costo: tutti };
  return { esito: tutti <= soglia ? "gl" : "scala", costo: tutti };
}

/** Lo stato di `data-entrata` per un progresso. */
export const statoDi = (e: number): "chiusa" | "piega" | "distesa" => (e <= 0 ? "chiusa" : e >= 1 ? "distesa" : "piega");

/* Gli shader: il vertex di Lusion alla lettera più u_k; il fragment fa object-cover della texture
   (niente tinta, niente angoli, niente rumore). */
export const VS = `#version 300 es
in vec2 a_pos;
uniform vec2 u_res; uniform vec4 u_da; uniform vec4 u_a; uniform float u_p; uniform float u_k;
out vec2 v_uv; out vec2 v_wh;
float sm(float e0,float e1,float x){float t=clamp((x-e0)/(e1-e0),0.,1.);return t*t*(3.-2.*t);}
void main(){
  float w=1.-(pow(a_pos.x*a_pos.x,.75)+pow(1.-a_pos.y,1.5))/2.;
  float vs=sm(w*.3,.7+w*.3,u_p);
  float vu=sm(.15,.85,u_p);
  float v=mix(vu,vs,u_k);
  vec2 xy=mix(u_da.xy,u_a.xy,v); vec2 wh=mix(u_da.zw,u_a.zw,v);
  xy.x+=mix(wh.x,0.,cos(v*6.2831853)*.5+.5)*.1*u_k;
  vec2 base=a_pos*wh-wh*.5;
  float r=(sm(0.,1.,v)-v)*-.5; float ang=2.*r*u_k; float c=cos(ang),s=sin(ang);
  vec2 rb=vec2(base.x*c-base.y*s,base.x*s+base.y*c);
  vec2 scr=rb+wh*.5+xy;
  gl_Position=vec4(scr.x/u_res.x*2.-1.,1.-scr.y/u_res.y*2.,0.,1.);
  v_uv=a_pos; v_wh=wh;
}`;

export const FS = `#version 300 es
precision highp float;
in vec2 v_uv; in vec2 v_wh;
uniform sampler2D u_tex; uniform float u_texAspect;
out vec4 o;
void main(){
  vec2 uv=v_uv; float ra=v_wh.x/max(v_wh.y,1.);
  if(ra>u_texAspect){uv.y=(uv.y-.5)*(u_texAspect/ra)+.5;}else{uv.x=(uv.x-.5)*(ra/u_texAspect)+.5;}
  o=texture(u_tex,uv);
}`;

export type Programma = {
  prog: WebGLProgram;
  u: { res: WebGLUniformLocation | null; da: WebGLUniformLocation | null; a: WebGLUniformLocation | null; p: WebGLUniformLocation | null; k: WebGLUniformLocation | null; tex: WebGLUniformLocation | null; asp: WebGLUniformLocation | null };
  n: number;
  tex: WebGLTexture;
};

/** Compila e collega; SEG×SEG triangoli in [0,1]², una texture LINEAR/CLAMP. Lancia se il driver rifiuta. */
export function programma(gl: WebGL2RenderingContext, seg: number = SEG): Programma {
  const shader = (tipo: number, src: string) => {
    const s = gl.createShader(tipo);
    if (!s) throw new Error("createShader");
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "compile");
    return s;
  };
  const prog = gl.createProgram();
  if (!prog) throw new Error("createProgram");
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
  gl.useProgram(prog);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = { res: U("u_res"), da: U("u_da"), a: U("u_a"), p: U("u_p"), k: U("u_k"), tex: U("u_tex"), asp: U("u_texAspect") };
  const pos = new Float32Array((seg + 1) * (seg + 1) * 2);
  for (let j = 0; j <= seg; j += 1) {
    for (let i = 0; i <= seg; i += 1) {
      const q = (j * (seg + 1) + i) * 2;
      pos[q] = i / seg;
      pos[q + 1] = j / seg;
    }
  }
  const idx = new Uint16Array(seg * seg * 6);
  let q = 0;
  for (let j = 0; j < seg; j += 1) {
    for (let i = 0; i < seg; i += 1) {
      const a = j * (seg + 1) + i;
      const b = a + 1;
      const c = a + seg + 1;
      const d = c + 1;
      idx[q++] = a;
      idx[q++] = c;
      idx[q++] = b;
      idx[q++] = b;
      idx[q++] = c;
      idx[q++] = d;
    }
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  const tex = gl.createTexture();
  if (!tex) throw new Error("createTexture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { prog, u, n: idx.length, tex };
}

/** Un draw del foglio con gli uniform dati. `pulisci` false solo nella sonda, per sommare più draw sullo stesso fotogramma. */
export function disegna(gl: WebGL2RenderingContext, p: Programma, res: { w: number; h: number }, da: Rett, a: Rett, e: number, k: number, aspetto: number, pulisci = true): void {
  if (pulisci) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  gl.uniform2f(p.u.res, res.w, res.h);
  gl.uniform4f(p.u.da, da.x, da.y, da.w, da.h);
  gl.uniform4f(p.u.a, a.x, a.y, a.w, a.h);
  gl.uniform1f(p.u.p, e);
  gl.uniform1f(p.u.k, k);
  gl.uniform1f(p.u.asp, aspetto);
  gl.uniform1i(p.u.tex, 0);
  gl.drawElements(gl.TRIANGLES, p.n, gl.UNSIGNED_SHORT, 0);
}
