// Samples Era's loaderEase (= Domus dtLoader) path and compares with the linear() in globals.css.
const path = "M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1";
const nums = path.replace(/^M0,0,C/, "").split(",").map(Number);
// segments: start (0,0), then triples of control points
const segs = [];
let p0 = [0, 0];
for (let i = 0; i < nums.length; i += 6) {
  const c1 = [nums[i], nums[i + 1]], c2 = [nums[i + 2], nums[i + 3]], p3 = [nums[i + 4], nums[i + 5]];
  segs.push([p0, c1, c2, p3]);
  p0 = p3;
}
const bez = (a, b, c, d, t) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};
// dense table
const table = [];
for (const [a, b, c, d] of segs) {
  for (let k = 0; k <= 4000; k++) {
    const t = k / 4000;
    table.push([bez(a[0], b[0], c[0], d[0], t), bez(a[1], b[1], c[1], d[1], t)]);
  }
}
table.sort((p, q) => p[0] - q[0]);
const yAt = (x) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let lo = 0, hi = table.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (table[m][0] <= x) lo = m; else hi = m;
  }
  const [x0, y0] = table[lo], [x1, y1] = table[hi];
  return x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
};
console.log("anchors:", segs.map((s) => s[3]));
// current CSS linear()
const css = [[0,0],[0.148,6.3],[0.276,12.5],[0.381,18.8],[0.453,25],[0.504,31.3],[0.533,37.5],[0.554,43.8],[0.575,50],[0.621,56.3],[0.715,62.5],[0.797,68.8],[0.858,75],[0.901,81.3],[0.938,87.5],[0.971,93.8],[1,100]];
console.log("\nCSS stop check (x, css y, true y, diff):");
for (const [y, pc] of css) {
  const x = pc / 100;
  console.log(x.toFixed(4), y, yAt(x).toFixed(4), (y - yAt(x)).toFixed(4));
}
const evalLinear = (stops, x) => {
  for (let i = 1; i < stops.length; i++) {
    const [ya, xa] = [stops[i - 1][0], stops[i - 1][1] / 100];
    const [yb, xb] = [stops[i][0], stops[i][1] / 100];
    if (x <= xb) return ya + ((yb - ya) * (x - xa)) / (xb - xa || 1);
  }
  return 1;
};
const err = (stops) => {
  let max = 0, at = 0, sum = 0, n = 0;
  for (let k = 0; k <= 2000; k++) {
    const x = k / 2000;
    const e = Math.abs(evalLinear(stops, x) - yAt(x));
    sum += e; n++;
    if (e > max) { max = e; at = x; }
  }
  return { max: max.toFixed(4), at: at.toFixed(3), mean: (sum / n).toFixed(5) };
};
console.log("\ncurrent CSS linear() error vs curve:", err(css));
// exact uniform 1/16 with true values
const uni = [];
for (let k = 0; k <= 16; k++) uni.push([+yAt(k / 16).toFixed(3), +((k / 16) * 100).toFixed(2)]);
console.log("uniform 1/16 true:", err(uni));
// greedy/optimal: choose 18 or 20 points including anchors, minimize max error by iterative insertion (RDP-like)
function build(nPts) {
  const anchors = [0, 0.238, 0.396, 0.522, 0.714, 1];
  let xs = [...anchors];
  const mk = (xs) => xs.slice().sort((a, b) => a - b).map((x) => [+yAt(x).toFixed(3), +(x * 100).toFixed(1)]);
  while (xs.length < nPts) {
    const stops = mk(xs);
    let worst = 0, wx = 0;
    for (let k = 0; k <= 2000; k++) {
      const x = k / 2000;
      const e = Math.abs(evalLinear(stops, x) - yAt(x));
      if (e > worst) { worst = e; wx = x; }
    }
    xs.push(+wx.toFixed(3));
  }
  return mk(xs);
}
for (const n of [17, 18, 20]) {
  const s = build(n);
  console.log(`\nanchor+RDP ${n} pts:`, err(s));
  console.log("linear(" + s.map(([y, x]) => `${y} ${x}%`).join(", ") + ")");
}
// fallback bezier fit check cubic-bezier(0.2,0.45,0,0.25)
const cb = (x1, y1, x2, y2) => (x) => {
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) {
    const t = (lo + hi) / 2;
    if (bez(0, x1, x2, 1, t) < x) lo = t; else hi = t;
  }
  return bez(0, y1, y2, 1, (lo + hi) / 2);
};
const f = cb(0.2, 0.45, 0, 0.25);
let mx = 0;
for (let k = 0; k <= 1000; k++) mx = Math.max(mx, Math.abs(f(k / 1000) - yAt(k / 1000)));
console.log("\nfallback cubic-bezier max err:", mx.toFixed(4));
// timing phases at 1.55s
const D = 1.55, delay = 0.6;
console.log("\nphases (abs s): anchor x -> t");
for (const x of [0.238, 0.396, 0.522, 0.714, 1]) console.log(x, (delay + x * D).toFixed(3), "y", yAt(x).toFixed(3));
// Era timings
const durL = 1.2;
console.log("\nEra intro: track 2.4->6.4, arch 6.4->", 6.4 + 1.25 * durL, "dive", 6.4 + 0.9 * 1.25 * durL, "->", 6.4 + 0.9 * 1.25 * durL + 2 * durL);
console.log("Era short: arch 0->", 1.25 * durL, "dive", 0.9 * 1.25 * durL, "->", 0.9 * 1.25 * durL + 2 * durL);
// Domus short: arch 1.1, dive at 0.8 progress
console.log("Domus short: arch 0->1.1, dive 0.88->", 0.88 + 1.5, "autohide", 0.88 + 1.5 + 0.1);
// domus.inOut value at x (for arch-y at t)
const inOut = cb(0.66, 0, 0.22, 1);
for (const t of [0.2, 0.3, 0.4, 0.5, 0.55, 0.6, 0.7, 0.88]) {
  const k = inOut(t / 1.1);
  console.log("short t", t, "door progress", k.toFixed(3), "arch-y vh", (104 + (15 - 104) * k).toFixed(1));
}
console.log("arch-k check inOut(0.8)=", inOut(0.8).toFixed(4));
