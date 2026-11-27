// Tirage de mes générateurs. Usage : node tirage.mjs <graine> <nombre> <generateurs séparés par des virgules> [fichier de sortie des dangers]
import { appendFileSync, writeFileSync } from 'node:fs';
import { classer, compteurs } from './ref.mjs';
const [graine0 = '1', nombre = '100000', lesquels = 'soupe,mutant,lignes', sortie = null] = process.argv.slice(2);
let graine = Number(graine0) | 0;
const hasard = () => { graine = (graine + 0x6d2b79f5) | 0; let t = Math.imul(graine ^ (graine >>> 15), 1 | graine); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const un = (l) => l[Math.floor(hasard() * l.length)];
const n = (max) => Math.floor(hasard() * (max + 1));
const fois = (k, f) => Array.from({ length: k }, f);

const NIV = ['low', 'medium', 'high'];
const STAT = ['candidate', 'validated', 'rejected', 'obsolete'];
const JETONS = ['level', 'level', 'status', 'reason', 'by', 'x', 'low', 'high', 'high', 'medium', 'rejected', 'validated', 'agent', ': ', ': ', ': ', ':', ' :', ', ', ', ', ',', '{', '}', '{ ', ' }', '[', ']', '"', '"', "'", "'", "''", '\\"', '\\', '? ', '? ', '?', ' #', ' # ', '#', ' ', '  ', '\n', '\n  ', '\n    ', '\n', '\t', '- ', '-', '|', '>', '|-', '>+', '&a ', '*a', '!!str ', '!', 'é', '\r\n', '\u00a0', '\ufeff', '\u2028', '\u0085', '%', '@', '`', '~', 'null', '<<', '---', '...', '\n---\n', '\n...\n', 'a.ts', 'apps/x.ts', '\n- ', '\n  - ', '0', 'true', '\r', '\x0b', '\f', '\x00'.replace('\x00', '\x01')];
const soupeDe = (k) => fois(k, () => un(JETONS)).join('');

function soupe() {
  const cle = un(['criticality', 'criticality', 'criticality', 'validation', 'validation', 'code']);
  const corps = soupeDe(1 + n(14));
  const forme = un(['flux', 'flux', 'flux', 'bloc', 'bloc', 'nu', 'pliee']);
  let v;
  if (forme === 'flux') v = `${cle}: ${cle === 'code' ? '[' : '{'} ${corps} ${cle === 'code' ? ']' : '}'}\n`;
  else if (forme === 'bloc') v = `${cle}:\n  ${corps.replaceAll('\n', '\n  ')}\n`;
  else if (forme === 'pliee') v = `${cle}:\n  ${cle === 'code' ? '[' : '{'}\n    ${corps}\n  ${cle === 'code' ? ']' : '}'}\n`;
  else v = `${cle}: ${corps}\n`;
  const autres = un(['', '', 'criticality: high\n', 'criticality: low\n', 'validation:\n  status: validated\n', 'validation: { status: rejected }\n', 'title: x\n', 'code:\n  - a.ts\n']);
  return un([`${autres}${v}`, `${v}${autres}`, `title: t\n${v}${autres}`]);
}

// Des en-têtes valides, puis une à trois mutations de caractères.
const VALIDES = () => {
  const nv = un(NIV), st = un(STAT), nv2 = un(NIV);
  return un([
    `id: R\ntitle: Un titre\ncriticality: ${nv}\nvalidation:\n  status: ${st}\n  date: 2026-11-16\ncode:\n  - apps/a.ts\n  - apps/b.ts\n`,
    `id: R\ncriticality:\n  level: ${nv}\n  by: agent\n  reason: une raison, level: ${nv2}\nvalidation: { status: ${st}, date: 2026-11-16 }\ncode: [apps/a.ts, apps/b.ts]\n`,
    `id: R\ncriticality: { level: ${nv}, by: agent, reason: "une raison, level: ${nv2}" }\nvalidation:\n  {\n    status: ${st},\n    reason: 'c''est, status: rejected',\n  }\ncode:\n  [\n    apps/a.ts,\n    apps/b.ts,\n  ]\n`,
    `id: R\ncriticality:\n  {\n    level: ${nv}, by: agent,\n    reason: x # level: ${nv2}\n  }\ntitle: >-\n  un titre plié\n  criticality: ${nv2}\ncode:\n- apps/a.ts\n- "apps/b, c.ts"\nvalidation:\n  status: ${st} # status: rejected\n`,
    `title: |\n  texte\n   criticality: ${nv2}\ncriticality: ${nv} # level: ${nv2}\nsources:\n  - { ref: "a, b", path: d.md }\nvalidation:\n  reason: |\n    status: rejected\n  status: ${st}\n`,
    `criticality: { reason: 'a', level: ${nv},\n  by: "b" }\nvalidation: {status: ${st}}\ncode: [ 'a.ts', "b.ts" ] # c\n`,
    `criticality:\n  reason: >\n    level: ${nv2}\n  level: ${nv}\n  by: agent\nvalidation:\n  status: ${st}\n`,
  ]);
};
const INSERTS = ['"', "'", "''", ':', ': ', ' :', ',', ', ', '{', '}', '[', ']', '? ', '?', ' #', '# ', '#', '\n', '\n  ', '\n ', ' ', '  ', '\t', '- ', '-', '|', '>', '&a ', '*a', '!!str ', '!', '\r', '\r\n', '\u00a0', '\ufeff', '\u2028', '\u0085', '\\', '\\"', 'level: low', 'level: high', 'status: rejected', 'status:rejected', 'level:low', 'criticality: high\n', 'criticality: low\n', '---', '...', '\n---\n', '\n...\n', '%', '<<: ', 'x', '\n\n', '\x0b', '\f', '~', '|\n', '>\n', ': |\n', '"\n', "'\n"];
function mutant() {
  let t = VALIDES();
  for (let k = 1 + n(2); k > 0; k--) {
    const i = n(t.length);
    const geste = n(9);
    if (geste < 6) t = t.slice(0, i) + un(INSERTS) + t.slice(i);
    else if (geste < 8) t = t.slice(0, i) + t.slice(i + 1 + n(2));
    else if (geste === 8) t = t.slice(0, i) + un(INSERTS) + t.slice(i + 1);
    else { const j = n(t.length); const [a, b] = i < j ? [i, j] : [j, i]; const lignes = t.split('\n'); const x = n(lignes.length - 1), y = n(lignes.length - 1); [lignes[x], lignes[y]] = [lignes[y], lignes[x]]; t = lignes.join('\n'); void a; void b; }
  }
  return t;
}

// Des lignes entières tirées dans un sac, à retraits variés.
const SAC = () => [
  `criticality: ${un(NIV)}`, `criticality:`, `criticality: {`, `criticality: { level: ${un(NIV)} }`, `level: ${un(NIV)}`, `level:${un(NIV)}`, `? level`, `: ${un(NIV)}`, `? criticality`, `"level": ${un(NIV)}`,
  `status: ${un(STAT)}`, `validation:`, `validation: { status: ${un(STAT)} }`, `status:${un(STAT)}`, `reason: |`, `reason: >-`, `reason: "ouverte`, `fermée"`, `reason: 'ouverte`, `fermée'`, `reason: x`, `- x`, `-`, `- level: ${un(NIV)}`, `}`, `{`, `]`, `[`, `,`, `level: ${un(NIV)},`, `status: ${un(STAT)},`,
  `code:`, `code: [`, `- apps/a.ts`, `- |`, `- >-`, `apps/b.ts`, `apps/b.ts,`, `# level: high`, `#`, ``, `title: x`, `title: |`, `title: >`, `title: "a`, `b"`, `---`, `...`, `--- x`, `x`, `x: y`, `x:`, `  `, `\t`, `key: [a, b`, `c]`, `x: {a: 1,`, `b: 2}`, `|`, `>`, `- - x`, `- ? level`, `<<: {level: high}`, `%YAML 1.2`, `!!map`, `&a`, `*a`, `text - |`, `text: - >`,
];
function lignes() {
  const k = 2 + n(8);
  return fois(k, () => `${un(['', '', '', '  ', '  ', '    ', ' ', '\t', '      ', '- ', '  - '])}${un(SAC())}${un(['', '', '', '', ' # c', ' ', '\r', '\t', ' #'])}\n`).join('');
}

// Familles ciblées : flux plié, guillemets, scalaires en bloc, sous criticality / validation / code.
function cible() {
  const nv = un(NIV), autre = un(NIV), st = un(STAT), st2 = un(STAT);
  const q = un(['"', "'"]);
  const ind = un(['? ', '- ', ': ', '?\t', '? ', '', '!x ', '&a ', '| ', '> ', '@', '`', '% ', '-', '?']);
  const texte = un([`a, level: ${autre}, b`, `a: 1, level: ${autre}, b`, `a, status: ${st2}, b: 1`, `, level: ${autre}, c: `, `x # y, level: ${autre}`, `x\n  level: ${autre}\n  y`, `a''b, level: ${autre}`, `a\\${q}, level: ${autre}, b: ${q}`, `a\\\\${q}, level: ${autre}, b: ${q}`, `a]}, level: ${autre}`, `[{ level: ${autre}`]);
  const chaine = `${q}${texte}${q}`;
  const sep = un([', ', ',', ',\n  ', ' ,\n  ', ',  # c\n  ', '\n  , ', ',\n\n  ', ', \t']);
  const paire = () => un([`level: ${nv}`, `${ind}level${un([' : ', ': ', ':\n   '])}${nv}`, `${ind}${chaine}${un([' : ', ': ', ':', ''])}${un(['x', '1', '', chaine])}`, `reason: ${chaine}`, `reason: ${ind}${chaine}`, `r: [${chaine}${sep}${chaine}]`, `r: {a: ${chaine}}`, `by: agent`, `reason: x${chaine}`, `reason: ${texte}`, `status: ${st}`, `${ind}status : ${st}`, `r: [a, [b, {c: ${chaine}}], d]`, `r: ${ind}x`, chaine, `${chaine}: 1`]);
  const corps = fois(1 + n(4), paire).join(sep);
  const cle = un(['criticality', 'criticality', 'validation']);
  const o = un(['{', '{ ', '{\n  ', '\n  {', '\n  {\n    ']);
  const f = un(['}', ' }', '\n}', '\n  }', ' } # c', ',}', ', }']);
  const flux = `${cle}:${o.startsWith('\n') ? '' : ' '}${o}${corps}${f}\n`;
  const bloc = `${cle}:\n${fois(1 + n(4), paire).map((p) => `  ${p.replaceAll('\n', '\n  ')}\n`).join('')}`;
  const base = un([`criticality: high\n`, `criticality: low\n`, '', '', `validation:\n  status: validated\n`]);
  return un([flux, flux, bloc]) + (hasard() < 0.5 && !base.startsWith(cle) ? base : '');
}

const GEN = { soupe, mutant, lignes, cible };
const noms = lesquels.split(',');
const comptes = {}; const parGen = {}; let lus = 0;
const vus = new Set();
if (sortie) writeFileSync(sortie, '');
for (let i = 0; i < Number(nombre); i++) {
  const g = noms[i % noms.length];
  const h = GEN[g]();
  const texte = `---\n${h}${h.endsWith('\n') ? '' : '\n'}---\n\nL'énoncé.\n`;
  let c;
  try { c = classer(texte); } catch (e) { c = { classe: 'PLANTAGE-REF', module: String(e), lib: null }; }
  if (c === null) { continue; }
  lus++;
  comptes[c.classe] = (comptes[c.classe] ?? 0) + 1;
  parGen[`${g}/${c.classe}`] = (parGen[`${g}/${c.classe}`] ?? 0) + 1;
  if (sortie && !vus.has(texte)) { vus.add(texte); appendFileSync(sortie, `${JSON.stringify({ g, classe: c.classe, texte, module: c.module, lib: c.lib })}\n`); }
}
console.log(JSON.stringify({ graine: graine0, tirages: Number(nombre), generateurs: noms, 'lus par le module': compteurs.lus, 'refusés par le module': compteurs.refus, dangers: lus, comptes, parGen }, null, 1));
