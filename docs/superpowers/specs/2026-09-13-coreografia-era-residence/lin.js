const p="0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1".split(",").map(Number);
// segments: start (0,0); then triples
let pts=[[0,0]]; for(let i=0;i<p.length;i+=2) pts.push([p[i],p[i+1]]);
// pts: P0, c1,c2,P1, c1,c2,P2...
const segs=[]; for(let i=0;i+3<pts.length;i+=3) segs.push([pts[i],pts[i+1],pts[i+2],pts[i+3]]);
const bez=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d};
// dense sample of curve
const S=[]; for(const s of segs){for(let k=0;k<=4000;k++){const t=k/4000;S.push([bez(s[0][0],s[1][0],s[2][0],s[3][0],t),bez(s[0][1],s[1][1],s[2][1],s[3][1],t)])}}
S.sort((a,b)=>a[0]-b[0]);
const curve=x=>{let lo=0,hi=S.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(S[m][0]<=x)lo=m;else hi=m}const a=S[lo],b=S[hi];if(b[0]===a[0])return a[1];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])};
const parse=s=>s.split(",").map(q=>q.trim().split(/\s+/)).map(([y,x])=>[parseFloat(x)/100,parseFloat(y)]);
const cur=parse("0 0%, 0.148 6.3%, 0.276 12.5%, 0.381 18.8%, 0.453 25%, 0.504 31.3%, 0.533 37.5%, 0.554 43.8%, 0.575 50%, 0.621 56.3%, 0.715 62.5%, 0.797 68.8%, 0.858 75%, 0.901 81.3%, 0.938 87.5%, 0.971 93.8%, 1 100%");
const prop=parse("0 0%, 0.154 6.5%, 0.283 12.9%, 0.378 18.6%, 0.414 21.2%, 0.442 23.8%, 0.482 28.2%, 0.504 31.3%, 0.54 39.6%, 0.584 52.2%, 0.595 53.9%, 0.615 55.8%, 0.75 65%, 0.826 71.4%, 0.866 76%, 0.91 82.6%, 1 100%");
function evalLin(L,x){for(let i=1;i<L.length;i++){if(x<=L[i][0]){const a=L[i-1],b=L[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}}return 1}
function stats(L,name){let max=0,at=0,sum=0,n=0,ptErr=0;for(const [x,y] of L){ptErr=Math.max(ptErr,Math.abs(curve(x)-y))}for(let k=0;k<=10000;k++){const x=k/10000;const e=Math.abs(evalLin(L,x)-curve(x));sum+=e;n++;if(e>max){max=e;at=x}}console.log(name,"points",L.length,"maxErr",max.toFixed(4),"at",at.toFixed(3),"mean",(sum/n).toFixed(5),"maxPointErr",ptErr.toFixed(4))}
stats(cur,"current");stats(prop,"proposed");
// cubic-bezier(0.2,0.45,0,0.25) fallback error
const cb=(x1,y1,x2,y2,x)=>{let lo=0,hi=1;for(let i=0;i<60;i++){const t=(lo+hi)/2;const bx=3*(1-t)*(1-t)*t*x1+3*(1-t)*t*t*x2+t*t*t;if(bx<x)lo=t;else hi=t}const t=(lo+hi)/2;return 3*(1-t)*(1-t)*t*y1+3*(1-t)*t*t*y2+t*t*t};
let m=0,ma=0;for(let k=0;k<=2000;k++){const x=k/2000;const e=Math.abs(cb(0.2,0.45,0,0.25,x)-curve(x));if(e>m){m=e;ma=x}}console.log("fallback cb max",m.toFixed(4),"at",ma);
// door timing: ease domus.inOut (0.66,0,0.22,1); arch-y from 104vh to 15vh; when y <= band bottom?
// band: top = head (10vh approx), height 60svh -> bottom ~70vh (desktop, svh~vh). Mobile head clamp 4.5rem ~ 72px of 844 = 8.5vh
for (const bottom of [70,68.5,62]){let tt=null;for(let k=0;k<=11000;k++){const t=k/10000;const y=104-(104-15)*cb(0.66,0,0.22,1,t);if(y<=bottom){tt=t;break}}console.log("door reaches",bottom,"vh at progress",tt&&tt.toFixed(3),"=",tt&&(tt*1.1).toFixed(3),"s")}
console.log("ease(0.8)",cb(0.66,0,0.22,1,0.8).toFixed(4));
// short door at skip t=0.3
console.log("door y at 0.3s",(104-89*cb(0.66,0,0.22,1,0.3/1.1)).toFixed(1));
