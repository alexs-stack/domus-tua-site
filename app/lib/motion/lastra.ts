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
/** La sonda del renderer: media dei draw 2-4 (readPixels 1×1) sopra questa soglia → via scala. */
export const SONDA_DRAW_MS = 1.5;
/** I renderer software si riconoscono dal nome (WEBGL_debug_renderer_info). */
export const RENDERER_SOFTWARE = /swiftshader|llvmpipe|software|basic render/i;
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

/** Un draw del foglio con gli uniform dati. */
export function disegna(gl: WebGL2RenderingContext, p: Programma, res: { w: number; h: number }, da: Rett, a: Rett, e: number, k: number, aspetto: number): void {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(p.u.res, res.w, res.h);
  gl.uniform4f(p.u.da, da.x, da.y, da.w, da.h);
  gl.uniform4f(p.u.a, a.x, a.y, a.w, a.h);
  gl.uniform1f(p.u.p, e);
  gl.uniform1f(p.u.k, k);
  gl.uniform1f(p.u.asp, aspetto);
  gl.uniform1i(p.u.tex, 0);
  gl.drawElements(gl.TRIANGLES, p.n, gl.UNSIGNED_SHORT, 0);
}
