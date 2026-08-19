import fs from 'node:fs';

// §6.8 — le pagine che portano già «Domus Tua» nel proprio title non devono ereditare il
// suffisso del template, o il marchio si legge due volte e la seconda viene troncata da
// Google. `absolute` è lo stesso meccanismo che la home usa già (app/page.tsx:31).
//
// /chi-siamo NON è in questa lista di proposito: «Chi siamo — agenzia immobiliare a Tradate
// dal 2007» non contiene il nome, quindi il suffisso ci sta bene e serve.
const edits = [
  ['app/metodo/page.tsx', '  title: "Il Metodo Domus Tua: come vendiamo casa, passo per passo",', '  title: { absolute: "Il Metodo Domus Tua: come vendiamo casa, passo per passo" },'],
  ['app/recensioni/page.tsx', '  title: `Recensioni Domus Tua: ${site.reviewsCount} clienti raccontano`,', '  title: { absolute: `Recensioni Domus Tua: ${site.reviewsCount} clienti raccontano` },'],
  ['app/contatti/page.tsx', '  title,\n  description,', '  title: { absolute: title },\n  description,'],
];

const byFile = new Map();
for (const [file] of edits) if (!byFile.has(file)) byFile.set(file, fs.readFileSync(file, 'utf8'));

for (const [file, from, to] of edits) {
  const src = byFile.get(file);
  const EOL = src.includes('\r\n') ? '\r\n' : '\n';
  const F = from.split('\n').join(EOL);
  const T = to.split('\n').join(EOL);
  const n = src.split(F).length - 1;
  if (n !== 1) { console.error('✗ ' + n + ' occorrenze in ' + file + ': ' + from.slice(0, 60)); process.exit(1); }
  byFile.set(file, src.replace(F, T));
}
for (const [f, src] of byFile) fs.writeFileSync(f, src, 'utf8');
console.log('✓ ' + edits.length + ' title resi assoluti');
