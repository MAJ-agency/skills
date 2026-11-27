// Générateur « YAML valide par construction, de toutes les écritures » pour criticality, validation, code.
// Usage : node valide.mjs <graine> <nombre> [fichier des dangers] ; SANS=<regex> écarte les en-têtes qui y répondent.
import { appendFileSync, writeFileSync } from 'node:fs';
import { classer, bibliotheque, compteurs } from './ref.mjs';
const [graine0 = '1', nombre = '100000', sortie = null] = process.argv.slice(2);
const SANS = process.env.SANS ? new RegExp(process.env.SANS) : null;
let graine = Number(graine0) | 0;
const hasard = () => { graine = (graine + 0x6d2b79f5) | 0; let t = Math.imul(graine ^ (graine >>> 15), 1 | graine); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const un = (l) => l[Math.floor(hasard() * l.length)];
const n = (max) => Math.floor(hasard() * (max + 1));
const p = (x) => hasard() < x;
const melange = (l) => l.map((v) => [hasard(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
const NIV = ['low', 'medium', 'high'];
const STAT = ['candidate', 'validated', 'rejected', 'obsolete'];
const esp = (min = 0) => ' '.repeat(min + n(2));
const blancs = () => un(['', '', ' ', '  ', '\t', ' \t']);

// Les leurres : ce qu'un lecteur naïf lirait comme une paire.
const leurre = (famille) => { const cle = famille === 'v' ? 'status' : 'level'; const val = famille === 'v' ? un(STAT) : un(NIV); return un([`${cle}: ${val}`, `, ${cle}: ${val}, x: y`, `${cle}: ${val}, `, `x, ${cle}: ${val}`, `{ ${cle}: ${val} }`, `"${cle}": ${val}`, `# ${cle}: ${val}`, `x # , ${cle}: ${val}, y: z`, `x: 1, ${cle}: ${val}, z: 2`, `criticality: ${un(NIV)}`, `] , ${cle}: ${val}`, `} , ${cle}: ${val} , {`]); };
const mots = () => un(['abc', "l'agent", 'une raison', 'c\'est grave', 'a - b', 'x > y', 'a | b', 'é à ü', '100 %', 'a: b'.replace(': ', ':'), 'voir §3', '@x', '`x`', 'fin.']);

/** Un texte libre écrit en flux (dans { } ou [ ]) ; rend le source YAML. `r` : le retrait des lignes de continuation. */
function texteEnFlux(famille, r) {
  const l = leurre(famille);
  const suite = `\n${r}${esp()}`;
  return un([
    () => mots().replace(/[,\[\]{}#:]/g, ''),
    () => `"${mots()} ${l.replaceAll('"', '\\"')}"`,
    () => `'${mots()} ${l.replaceAll("'", "''")}'`,
    () => `"a\\"${l.replaceAll('"', '\\"')}\\\\"`,
    () => `'a''${l.replaceAll("'", "''")}'''`,
    () => `"${mots()}${suite}${l.replaceAll('"', '\\"')}${suite}fin"`,
    () => `'${mots()}${suite}${l.replaceAll("'", "''")}${suite}fin'`,
    () => `abc${suite}"def # ${l}"`, // plain plié : la suite commence par un guillemet, puis un commentaire
    () => `abc${suite}'def # ${l}'`,
    () => `abc${suite}def # ${l}`,
    () => `abc # ${l}${suite}def`,
    () => `"${mots()} # ${l.replaceAll('"', '\\"')}"`,
    () => `"\\x41\\u00e9 ${l.replaceAll('"', '\\"')}"`,
    () => `"a\\\n${r}  b ${l.replaceAll('"', '\\"')}"`,
    () => `x"y${l.replace(/[,\[\]{}#:"]/g, '')}"`,
    () => `x'y`,
    () => `"${l.replaceAll('"', '\\"')}" # ${leurre(famille)}`,
  ])();
}
/** Une valeur du vocabulaire, écrite de plusieurs façons valides. */
const mot = (v, r) => un([v, v, v, `"${v}"`, `'${v}'`, `\n${r}  ${v}`, `"${v.slice(0, 2)}\\\n${r}  ${v.slice(2)}"`, `"\\x${v.charCodeAt(0).toString(16)}${v.slice(1)}"`, `'${v}' # c`, `${v} # ${leurre('c')}`]);
/** Une clé, écrite de plusieurs façons valides. */
const cleEnFlux = (k) => un([k, k, k, k, `"${k}"`, `'${k}'`, `? ${k}`, `? "${k}"`, `?\t${k}`, `${k} `, `"\\x${k.charCodeAt(0).toString(16)}${k.slice(1)}"`]);

function mappageEnFlux(paires, famille) {
  const r = '  ';
  const sep = () => un([', ', ',', ` ,${blancs()}`, `,\n${r}${esp()}`, `, # ${leurre(famille)}\n${r}${esp()}`, `\n${r}, `, `,\n\n${r} `, `,\n${r}# ${leurre(famille)}\n${r} `]);
  const corps = paires.map(([k, v]) => { const c = cleEnFlux(k); return `${c}${c.startsWith('"') || c.startsWith("'") ? un([':', ': ', ' : ']) : un([': ', ': ', ' : ', `:\n${r}   `])}${v}`; });
  let s = '';
  for (let i = 0; i < corps.length; i++) s += corps[i] + (i < corps.length - 1 ? sep() : un(['', '', ',', ' ,', `,\n${r}`]));
  const ouvre = un(['{', '{ ', `{\n${r}  `, `{ # ${leurre(famille)}\n${r}  `, `\n${r}{`, `\n${r}{ `, `\n${r}{\n${r}  `]);
  const ferme = un(['}', ' }', `\n${r}}`, `\n${r}  }`, ` } # ${leurre(famille)}`]);
  return `${ouvre.startsWith('\n') ? '' : ' '}${ouvre}${s}${ferme}`;
}

/** Un texte libre écrit en bloc, valeur d'une clé au retrait `r`. */
function texteEnBloc(famille, r) {
  const l = () => leurre(famille);
  const q = (t, g) => (g === '"' ? t.replaceAll('"', '\\"') : t.replaceAll("'", "''"));
  return un([
    () => mots().replace(/ #|: |^[@`]/g, ' '),
    () => `"${mots()} ${q(l(), '"')}"`,
    () => `'${mots()} ${q(l(), "'")}'`,
    () => `"${mots()} ${q(l(), '"')}" # ${l()}`,
    () => `abc # ${l()}`,
    () => `|${un(['', '-', '+'])}\n${r}  ${l()}\n${r}  ${l()}`,
    () => `>${un(['', '-', '+'])}\n${r}    ${l()}\n${r}    ${l()}`,
    () => `|${un(['1', '2', '2-', '-2'])}\n${r}      ${l()}\n${r}  ${l()}`.replace(/\|(-?)1(-?)\n(.*)\n.*$/s, `|$11$2\n$3\n${r} ${l()}`),
    () => `|\n\n${r} ${l()}`,
    () => `> # commentaire\n${r} ${l()}`,
    () => `abc\n${r}  ${l().replace(/: | #|^#/g, ' ')}`,
    () => `abc\n${r} "def ${l().replace(/: | #/g, ' ')}"`,
    () => `"abc\n${r} ${q(l(), '"')}\n${r} fin"`,
    () => `'abc\n${r} ${q(l(), "'")}\n${r} fin'`,
    () => `"abc\n\n${r}  ${q(l(), '"')}"`,
    () => `\n${r}  abc\n${r}  ${l().replace(/: | #|^#/g, ' ')}`,
    () => `\n${r}  "abc ${q(l(), '"')}"`,
    () => `\n${r}  |\n${r}  ${l()}`.replace(/\|\n(\s*)/, `|\n$1 `),
  ])();
}
const cleEnBloc = (k, r) => un([k, k, k, k, k, `"${k}"`, `'${k}'`, `${k} `, `${k}\t`, `? ${k}\n${r}`, `? "${k}"\n${r}`, `? |-\n${r}  ${k}\n${r}`]);
function mappageEnBloc(paires, famille) {
  const r = un(['  ', '  ', ' ', '    ', '\t'].filter((x) => x !== '\t'));
  let s = p(0.2) ? ` # ${leurre(famille)}` : '';
  for (const [k, v] of paires) {
    if (p(0.15)) s += `\n${un([r, '', r + '  ', '        '])}# ${leurre(famille)}`;
    if (p(0.08)) s += '\n';
    const c = cleEnBloc(k, r);
    s += `\n${r}${c}${c.includes('\n') ? ': ' : un([': ', ': ', ':\t', ':  '])}${typeof v === 'function' ? v(r) : v}`;
  }
  return s;
}

function criticite() {
  const niveau = un(NIV);
  const forme = un(['absente', 'nue', 'nue', 'flux', 'flux', 'flux', 'bloc', 'bloc', 'bloc']);
  if (forme === 'absente') return ['', null];
  if (forme === 'nue') return [`criticality:${un([' ', '  ', '\t'])}${mot(niveau, '')}\n`.replace(':\t\n', ':\n').replace(/: +\n/, ':\n'), niveau];
  const extras = melange([['by', forme === 'flux' ? texteEnFlux('c', '  ') : (r) => texteEnBloc('c', r)], ['reason', forme === 'flux' ? texteEnFlux('c', '  ') : (r) => texteEnBloc('c', r)]]).slice(0, n(2));
  const paires = melange([['level', forme === 'flux' ? mot(niveau, '  ') : (r) => mot(niveau, r)], ...extras]);
  return [`criticality:${forme === 'flux' ? mappageEnFlux(paires, 'c') : mappageEnBloc(paires, 'c')}\n`, niveau];
}
function validation() {
  const statut = un(STAT);
  const forme = un(['absente', 'flux', 'flux', 'bloc', 'bloc', 'bloc']);
  if (forme === 'absente') return ['', undefined];
  const txt = forme === 'flux' ? () => texteEnFlux('v', '  ') : () => (r) => texteEnBloc('v', r);
  const extras = melange([['date', '2026-11-16'], ['by', txt()], ['reason', txt()]]).slice(0, n(3));
  const paires = melange([['status', forme === 'flux' ? mot(statut, '  ') : (r) => mot(statut, r)], ...extras]);
  return [`validation:${forme === 'flux' ? mappageEnFlux(paires, 'v') : mappageEnBloc(paires, 'v')}\n`, statut];
}
function code() {
  const chemins = melange(['apps/api/src/a.ts', 'apps/web/src/b.tsx', 'packages/c/d.ts', 'apps/l\'un/e.ts', 'apps/x y/f.ts', 'apps/é/g.ts']).slice(0, 1 + n(3));
  const forme = un(['absente', 'flux', 'flux', 'bloc', 'bloc', 'bloc']);
  if (forme === 'absente') return ['', []];
  const ecrit = (c, enFlux, r) => un([c, c, c, `"${c}"`, `'${c.replaceAll("'", "''")}'`, `"${c.slice(0, 5)}\\\n${r}   ${c.slice(5)}"`, `"\\x${c.charCodeAt(0).toString(16)}${c.slice(1)}"`, ...(enFlux ? [`${c} # x`] : [`${c} # apps/z.ts`, `|-\n${r}    ${c}`, `>-\n${r}    ${c}`, `\n${r}    ${c}`, `"${c}" # , apps/z.ts`])]);
  if (forme === 'flux') {
    const r = '  ';
    const sep = () => un([', ', ',', `,\n${r}  `, `, # apps/z.ts\n${r}  `, `\n${r}  , `]);
    let s = '';
    chemins.forEach((c, i) => { let e = ecrit(c, true, r); if (e.endsWith('# x')) e += `\n${r}  `; s += e + (i < chemins.length - 1 ? sep() : un(['', ',', `,\n${r}`])); });
    const ouvre = un(['[', '[ ', `[\n${r}  `, `\n${r}[`, `\n${r}[\n${r}    `, `[ # apps/z.ts\n${r}  `]);
    return [`code:${ouvre.startsWith('\n') ? '' : ' '}${ouvre}${s}${un([']', ' ]', `\n${r}]`, ' ] # c'])}\n`, chemins];
  }
  const r = un(['', '  ', '    ', ' ']);
  return [`code:${p(0.2) ? ' # - apps/z.ts' : ''}\n${chemins.map((c) => `${p(0.1) ? `${r}# - apps/z.ts\n` : ''}${r}-${un([' ', '  ', '\t'])}${ecrit(c, false, r)}\n`).join('')}`, chemins];
}
const AUTRES = () => [
  `title: ${un(['Un titre', '"Un titre : level: low"', `'c''est, criticality: low'`, `>-\n  plié\n  criticality: low`, `|\n  texte\n  validation: { status: rejected }`, `abc\n  suite criticality low`, `|2\n    criticality: low\n  status: rejected`, `>\n\n  criticality: low\n`.trimEnd(), `"a\n  criticality: low\n  b"`, `'a\n\n  code: [x]\n  b'`])}\n`,
  `sources:\n  - { ref: "réunion, point 3", path: docs/r.md }\n`,
  `extensions:\n  projet:\n    criticality: low\n    validation: { status: rejected }\n`,
  `extensions: { projet: { criticality: low, level: low }, x: [a, "b, level: low"] }\n`,
  `# criticality: low\n`,
  `epics: [facture]\n`,
  `decisions:\n- { date: 2026-11-16, text: "criticality: low", by: x }\n`,
  `links:\n  - type: refines\n    target: RULE_ALL_FAC-2\n`,
];

if (sortie) writeFileSync(sortie, '');
const comptes = {}; let invalides = 0, refus = 0, accords = 0, ecartes = 0, attendusFaux = 0;
for (let i = 0; i < Number(nombre); i++) {
  const [c, niveau] = criticite(); const [v, statut] = validation(); const [k, chemins] = code();
  const h = `id: RULE_ALL_FAC-${i}\n${melange([c, v, k, ...melange(AUTRES()).slice(0, n(3))]).join('')}`;
  if (SANS?.test(h)) { ecartes++; continue; }
  const texte = `---\n${h}---\n\nL'énoncé.\n`;
  const l = bibliotheque(texte);
  if (l.erreur || l.invalide) invalides++;
  else if ((l.niveau ?? null) !== niveau || l.statut !== statut || JSON.stringify(l.code) !== JSON.stringify(chemins)) attendusFaux++;
  const d = classer(texte);
  if (d === null) { continue; }
  comptes[d.classe] = (comptes[d.classe] ?? 0) + 1;
  if (sortie) appendFileSync(sortie, `${JSON.stringify({ g: 'valide', classe: d.classe, texte, module: d.module, lib: d.lib })}\n`);
}
console.log(JSON.stringify({ graine: graine0, tirages: Number(nombre), 'lus par le module': compteurs.lus, 'refusés par le module': compteurs.refus, ecartes, 'refusés par yaml (générateur imparfait)': invalides, 'lus par yaml autrement que prévu': attendusFaux, comptes }, null, 1));
