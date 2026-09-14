/* eslint-disable @typescript-eslint/no-require-imports -- controllo del registro archiviato con la spec del 13 settembre, si lancia a mano con node (CommonJS) */
// Controllo del registro della spec del 10 settembre (§11). Alberto ha chiesto il 13 settembre di
// aggiornare il registro solo con ciò che è costruito e verificato: le voci del 13 settembre
// (A18-A26 di Alberto, D16-D35 decisioni di lavoro) e le note nuove a C03, C05, C06, C21, C22, C23,
// D05, D14, D15 portano il segno MARK del coordinatore finché chi le costruisce e le verifica (di
// regola la chiusura del piano 2026-09-13, commit 22) non scrive lo stato del costruito con l'hash
// del commit. Oggi il controllo accetta per ogni voce o il segno o lo stato chiuso, quindi vale dal
// commit 1 alla chiusura.
// Uso, dalla radice del repo: node docs/superpowers/specs/2026-09-13-coreografia-era-residence/registro-check.cjs
const fs = require("node:fs");
const path = require("node:path");

const FILE = path.join(__dirname, "..", "2026-09-10-redesign-rivista-bianca-design.md");
const text = fs.readFileSync(FILE, "utf8");
const reg = text.slice(text.indexOf("## 11. Registro delle direttive"));
const MARK = "decisa il 13 set., da costruire (piano 2026-09-13)";
// Voce nuova chiusa: la cella intera comincia con uno stato del costruito in grassetto.
const ROW_DONE = /^\s*\*\*(Applicata|Superata|Confermata|Da rivedere)/;
// Nota chiusa: il segno è diventato «**Applicata** (commit <hash>)» o «**Superata da X** (commit <hash>)».
const NOTE_DONE = /\*\*(Applicata|Superata da [^*]+)\*\* \(commit [0-9a-f]{7,}\)/;
const SPEC_COMMIT = "50c2008";
const fails = [];
const rows = new Map();
const cellsOf = (line) => line.split(/(?<!\\)\|/).slice(1, -1);
for (const line of reg.split(/\r?\n/)) {
  const m = /^\| ([ACDQ]\d\d|—) \|/.exec(line);
  if (!m) continue;
  const n = cellsOf(line).length;
  if (n !== 5) fails.push(`${m[1]}: ${n} celle invece di 5`);
  const key = m[1] === "—" ? `—${rows.size}` : m[1];
  if (rows.has(key)) fails.push(`${key} compare due volte`);
  rows.set(key, line);
}
const ids = (p, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `${p}${String(a + i).padStart(2, "0")}`);
const row = (id) => rows.get(id) ?? "";
const state = (id) => cellsOf(row(id))[3] ?? "";
const last = (id) => cellsOf(row(id))[4] ?? "";
const count = (s, sub) => s.split(sub).length - 1;

for (const id of [...ids("A", 1, 26), ...ids("C", 1, 23), ...ids("D", 1, 35), "Q01"]) {
  if (!rows.has(id)) fails.push(`manca ${id}`);
}
const NEW = [...ids("A", 18, 26), ...ids("D", 16, 35)];
const NOTES = ["C03", "C05", "C06", "C21", "C22", "C23", "D05", "D14", "D15"];
for (const id of NEW) {
  if (!rows.has(id)) continue;
  const s = state(id);
  const marks = count(s, MARK);
  if (marks > 1) fails.push(`${id}: il segno compare ${marks} volte`);
  if (marks === 1 && /\*\*Applicata/.test(s)) fails.push(`${id}: col segno la voce non si dice applicata`);
  if (marks === 0) {
    if (!ROW_DONE.test(s)) fails.push(`${id}: né «${MARK}» né uno stato chiuso che cominci con **Applicata, **Superata, **Confermata o **Da rivedere`);
    const hashes = (last(id).match(/\b[0-9a-f]{7,}\b/g) ?? []).filter((h) => h !== SPEC_COMMIT);
    if (hashes.length === 0) fails.push(`${id}: chiusa senza l'hash del commit che l'ha costruita nell'ultima colonna`);
    if ((id === "D19" || id === "D26") && !/da far vedere ad Alberto|vista da Alberto/.test(s)) {
      fails.push(`${id}: lo stato chiuso non dice se Alberto l'ha vista`);
    }
    if ((id === "A24" || id === "D35") && !s.includes("2.13")) fails.push(`${id}: lo stato chiuso non cita la licenza (punto 2.13)`);
  }
}
for (const id of NOTES) {
  if (!rows.has(id)) continue;
  const s = state(id);
  const marks = count(s, MARK);
  const done = NOTE_DONE.test(s);
  if (marks > 1) fails.push(`${id}: il segno compare ${marks} volte`);
  if (marks === 0 && !done) fails.push(`${id}: né «${MARK}» né «**Applicata** (commit <hash>)» nella nota`);
  if (marks === 1 && done) fails.push(`${id}: segno e nota chiusa insieme`);
}
for (const id of ["C21", "C22", "C23"]) {
  if (rows.has(id) && !/^\s*\*\*Applicata/.test(state(id))) fails.push(`${id} è nel codice di oggi: lo stato comincia da «**Applicata»`);
}
const has = (id, s) => {
  if (rows.has(id) && !row(id).includes(s)) fails.push(`${id} non contiene «${s}»`);
};
has("C03", "A18-A20");
has("C03", "domanda aperta 12");
has("C05", "2,38 s");
has("C06", "VMAX");
has("C22", "A18");
has("D05", "D31");
has("D14", "D34");
has("D15", "A20");
if (![...rows.values()].some((r) => r.includes("«Approvato, scrivi la spec»"))) fails.push("manca la riga dell'approvazione");
const q = reg.slice(reg.indexOf("### 11.3 Domande aperte"), reg.indexOf("### 11.4"));
for (const n of [12, 13, 14]) if (!new RegExp(`^${n}\\. \\*\\*`, "m").test(q)) fails.push(`manca la domanda ${n}`);
if (/^15\. \*\*/m.test(q)) fails.push("la domanda 15 è chiusa da A26: non si aggiunge");
for (const s of ["Fanno eccezione tre domande del 13 settembre", "La 12", "La 13", "La 14"]) {
  if (!q.includes(s)) fails.push(`§11.3 senza «${s}»`);
}
if (!reg.includes("più le cinque di agosto ancora vive (C19-C23)")) fails.push("apertura di §11 ferma a «le due di agosto»");
if (!reg.includes("*da costruire*")) fails.push("lo stato *da costruire* non è fra gli stati di §11");
if (!reg.includes(`«${MARK}»`)) fails.push("la riga degli stati di §11 non riporta il segno alla lettera");
if (fails.length) {
  console.log(fails.join("\n"));
  process.exit(1);
}
console.log(`registro ok: ${rows.size} righe`);
