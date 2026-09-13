const path = "C:/Users/alber/domus-tua-site/node_modules/gsap/dist/";
const { gsap } = require(path + "gsap.js");
const { CustomEase } = require(path + "CustomEase.js");
gsap.registerPlugin(CustomEase);
const custom = { dtSosta: "M0,0 C0.25,0.45 0.3,0.5 0.5,0.5 C0.7,0.5 0.75,0.55 1,1", dtRailA: "0.5,0,0.5,1", dtRailB: "0.4,0,0.2,1", dtRailC: "0.6,0,0.4,1", dtLag: "0.2,0,0.4,1",
  dtEase: "0.25,0.1,0.25,1", dtIn: "0.5,0,0.75,0", dtInOut: "0.75,0,0.25,1", dtOut: "0.25,1,0.5,1",
  dtHorScroll: "0.25,0,0.75,1", dtWrite: "0.333,0,0.667,1", domusInOut: "M0,0 C0.66,0 0.22,1 1,1",
  dtDock: "0.33,1,0.68,1", dtAffonda: "0.5,0,0.8,0.45", dtRail: "0.12,0,0.88,1", dtLento: "0.35,0.05,0.65,0.95",
  dtCartolina: "0.45,0,0.15,1", domus: "M0,0 C0.22,0.9 0.36,1 1,1", dtDiveIn: "0.6,0,0,1",
};
for (const [k, v] of Object.entries(custom)) CustomEase.create(k, v);
const std = ["back.out","sine.in","circ.in","none","power1.in","power1.out","power1.inOut","power2.in","power2.out","power2.inOut","power3.in","power3.out","power3.inOut","power4.in","power4.out","power4.inOut","sine.in","sine.out","sine.inOut","expo.in","expo.out","expo.inOut","circ.in","circ.out","circ.inOut"];
const names = [...Object.keys(custom), ...std];
const f = Object.fromEntries(names.map(n => [n, gsap.parseEase(n)]));
const d = (a,b) => { let m=0; for (let i=0;i<=100;i++){ const t=i/100; m=Math.max(m, Math.abs(f[a](t)-f[b](t))); } return m; };
const pick = process.argv.slice(2);
const list = pick.length ? pick : names;
const rows = [];
for (let i=0;i<list.length;i++) for (let j=i+1;j<list.length;j++) rows.push([list[i], list[j], d(list[i], list[j])]);
rows.sort((a,b)=>a[2]-b[2]);
for (const r of rows.filter(r=>r[2]<0.1)) console.log(r[2].toFixed(3), r[0], r[1]);
