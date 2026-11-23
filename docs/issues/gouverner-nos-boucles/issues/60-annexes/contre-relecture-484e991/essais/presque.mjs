// Générateur de formes « presque admises » : un en-tête écrit dans les seules formes de la liste blanche, puis abîmé
// d'un caractère (inséré, retiré ou remplacé), parfois de deux. Une part des tirages n'est pas abîmée : elle dit si
// les formes admises sont lues comme `yaml` les lit.
// Usage : node presque.mjs <graine> <nombre> [fichier des dangers] ; PART_INTACTE=0.2 par défaut.
import { appendFileSync, writeFileSync } from 'node:fs';
import { classer, bibliotheque, enTeteDeRegle, Illisible, compteurs } from './ref.mjs';
const [graine0 = '1', nombre = '100000', sortie = null] = process.argv.slice(2);
const PART_INTACTE = Number(process.env.PART_INTACTE ?? '0.2');
let graine = Number(graine0) | 0;
const hasard = () => { graine = (graine + 0x6d2b79f5) | 0; let t = Math.imul(graine ^ (graine >>> 15), 1 | graine); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const un = (l) => l[Math.floor(hasard() * l.length)];
const n = (max) => Math.floor(hasard() * (max + 1));
const p = (x) => hasard() < x;
const melange = (l) => l.map((v) => [hasard(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
const NIV = ['low', 'medium', 'high'];
const STAT = ['candidate', 'validated', 'rejected', 'obsolete'];
const leurre = () => un(['level: low', 'status: rejected', ', level: low, x: y', 'criticality: low', '# level: low', "l'agent", 'a "b" c', '{ level: low }', '[x]', 'x # y', "c''est", 'a\\\\b', '- apps/z.ts', 'level: high']);
const com = () => (p(0.2) ? `${un([' ', '  ', '   '])}# ${leurre()}` : '');
const nuBloc = () => un(['Un titre', "Le total d'une facture", 'a "b" c', 'x#y', 'a, b; c', 'RULE_{{CTX}}_{{TRI}}', 'voir §3 (annexe)', '2026-11-16', 'a:b', 'é à ü « x »', 'une-personne', 'a [b] {c}', '.cache', '_x', '100 %', 'a | b > c', 'x * y & z ! w']);
const cite = () => { const t = `${un(['abc', 'une raison', "l'agent"])} ${leurre()}`; return p(0.5) ? `"${t.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"` : `'${t.replaceAll("'", "''")}'`; };
const nuFlux = () => un(['abc', 'une raison', "l'agent", 'docs/r.md', 'a.b/c-d_e', 'section 2', 'x (y)', 'a; b', 'x « y »', '.x', '2026-11-16']);
const scalaireBloc = () => (p(0.5) ? nuBloc() : cite());
const scalaireFlux = () => (p(0.5) ? nuFlux() : cite());
const mot = (v) => un([v, v, v, `"${v}"`, `'${v}'`]);
const CHEMINS = ['apps/api/src/a.ts', 'apps/web/src/b.tsx', 'packages/c/d.ts', '.github/workflows/ci.yml', '_x/y.ts'];
const CHEMINS_CITES = ['"apps/web/src/app/(compte)/[id]/page.tsx"', "'apps/l''un/x.ts'", '"apps/a, b.ts"', "'apps/x # y.ts'", '"apps/q\\"r.ts"'];
const fluxMap = (paires) => { const e = un(['', ' ']); return paires.length === 0 ? un(['{}', '{ }']) : `{${e}${paires.map(([k, v]) => `${k}:${un([' ', '  '])}${v}`).join(un([', ', ',', ' , ']))}${e}}`; };
const fluxListe = (items) => { const e = un(['', ' ']); return items.length === 0 ? un(['[]', '[ ]']) : `[${e}${items.join(un([', ', ',', ' , ']))}${e}]`; };

function criticite() {
  const niveau = un(NIV);
  const forme = un(['absente', 'nue', 'bloc', 'bloc', 'flux', 'flux']);
  if (forme === 'absente') return '';
  if (forme === 'nue') return `criticality: ${mot(niveau)}${com()}\n`;
  const paires = melange([['level', mot(niveau)], ...melange([['by', 'agent'], ['reason', forme === 'flux' ? scalaireFlux() : scalaireBloc()]]).slice(0, n(2))]);
  if (forme === 'flux') return `criticality: ${fluxMap(paires)}${com()}\n`;
  const r = un(['  ', '  ', ' ', '    ']);
  return `criticality:${com()}\n${paires.map(([k, v]) => `${p(0.1) ? `${un(['', r, r + r])}# ${leurre()}\n` : ''}${r}${k}: ${v}${com()}\n`).join('')}`;
}
function validation() {
  const statut = un(STAT);
  const forme = un(['absente', 'bloc', 'bloc', 'bloc', 'flux']);
  if (forme === 'absente') return '';
  const paires = melange([['status', mot(statut)], ...melange([['date', '2026-11-16'], ['by', 'une-personne'], ['reason', forme === 'flux' ? scalaireFlux() : scalaireBloc()]]).slice(0, n(3))]);
  if (forme === 'flux') return `validation: ${fluxMap(paires)}${com()}\n`;
  const r = un(['  ', '  ', '    ']);
  return `validation:${com()}\n${paires.map(([k, v]) => `${r}${k}: ${v}${com()}\n`).join('')}${p(0.1) ? `${r}# date: AAAA-MM-JJ\n` : ''}`;
}
function code() {
  const forme = un(['absente', 'vide', 'bloc', 'bloc', 'bloc0', 'flux', 'flux']);
  if (forme === 'absente') return '';
  if (forme === 'vide') return `code: ${un(['[]', '[ ]'])}${com()}\n`;
  const k = 1 + n(3);
  if (forme === 'flux') return `code: ${fluxListe(melange([...CHEMINS, ...CHEMINS_CITES.filter((c) => !c.includes('[') || true)]).slice(0, k).map((c) => (/^[."'_]|^apps\/(api|web)|^packages/.test(c) ? c : c)))}${com()}\n`.replace(/(\[| |,)(\.github[^,\] ]*|_x[^,\] ]*)/g, '$1$2');
  const r = forme === 'bloc0' ? '' : un(['  ', '  ', '    ', ' ']);
  return `code:${com()}\n${melange([...CHEMINS, ...CHEMINS_CITES]).slice(0, k).map((c) => `${r}- ${c}${com()}\n`).join('')}`;
}
const AUTRES = () => [
  `title: ${scalaireBloc()}${com()}\n`,
  `sources:\n  - ${fluxMap([['ref', scalaireFlux()], ['path', 'docs/r.md']])}${com()}\n`,
  `sources:\n  - ref: ${scalaireBloc()}\n    path: docs/r.md\n  - ref: x\n    at: ${scalaireBloc()}\n`,
  `extensions:\n  projet:\n    criticality: low\n    validation:\n      status: rejected\n    seuils:\n      - 10\n      - ${cite()}\n`,
  `extensions: ${fluxMap(p(0.5) ? [] : [['level', 'low'], ['status', 'rejected']])}\n`,
  `# criticality: low\n`,
  `\n`,
  `epics: ${fluxListe(['facture', 'paiement'].slice(0, 1 + n(1)))}\n`,
  `exception: ${fluxMap([['status', 'not-applicable'], ['reason', scalaireFlux()]])}\n`,
  `cases:\n  - id: total-nominal\n    title: ${cite()}\n    kind: nominal\n  - id: x\n    title: ${nuBloc()}\n`,
  `instanceOf: RULE_ALL_FAC-2\n`,
  `  # un commentaire en retrait : ${leurre()}\n`,
];
// Une seule ligne par clé de premier niveau : deux `sources:` seraient une clé en double.
const unParCle = (lignes) => { const vues = new Set(); return lignes.filter((l) => { const k = /^([A-Za-z]+):/.exec(l)?.[1]; if (!k) return true; if (vues.has(k)) return false; vues.add(k); return true; }); };
const DEGATS = ['"', "'", ':', ' ', ' ', '#', ',', '{', '}', '[', ']', '-', '?', '!', '&', '*', '|', '>', '\\', '\n', '\n', '\t', '\r', '\u00a0', '\ufeff', '%', '@', '`', '~', '.', 'x', '0', 'é', '\u2028', '\x0b', '\f', '<', '=', '\u0085', '\u200b', ';', '(', '/'];
function abimer(h) {
  const i = n(h.length - 1);
  const geste = n(3);
  if (geste <= 1) return h.slice(0, i) + un(DEGATS) + h.slice(i);
  if (geste === 2) return h.slice(0, i) + h.slice(i + 1);
  return h.slice(0, i) + un(DEGATS) + h.slice(i + 1);
}

// Les abîmures visées : une ligne prise au hasard, tordue vers une forme que la liste blanche n'admet pas.
function abimerUneLigne(h) {
  const L = h.split('\n');
  const i = n(L.length - 2 < 0 ? 0 : L.length - 2);
  const l = L[i];
  const r = /^ */.exec(l)[0];
  const geste = n(15);
  if (geste === 0) L[i] = l.replace(/: /, ':'); // plus de blanc après les deux-points
  else if (geste === 1) L.splice(i + 1, 0, `${r}  ${un(['x', 'level: low', 'status: rejected', '- apps/z.ts', '"y"', '# c', 'high'])}`); // une ligne plus profonde après une valeur
  else if (geste === 2) L.splice(i + 1, 0, l.replace(/^( *)([A-Za-z_]+)/, (_, a, b) => a + un([b, b.toUpperCase(), 'true', 'True', 'null']))); // clé en double, ou presque
  else if (geste === 3) L[i] = un([' ', '  ', '\t', '\u00a0']) + l; // retrait décalé
  else if (geste === 4) L[i] = l.replace(/^ /, ''); // retrait réduit
  else if (geste === 5) L[i] = l.replace(/(: |- )/, `$1${un(['? ', '!!str ', '&a ', '*a ', '| ', '> ', '|', '>-', '- ', '@', '`', '%', '~ ', '<< '])}`); // un indicateur devant la valeur
  else if (geste === 6) L[i] = l.replace(/, /, ',\n' + r + '  '); // un flux plié en deux
  else if (geste === 7) L[i] = l.replace(/(["'])([^"']*)\1/, '$1$2'); // une chaîne non refermée
  else if (geste === 8) L[i] = l.replace(/(["'])([^"']*)\1/, (_, g, t) => `${g}${t}\n${r}  suite${g}`); // une chaîne pliée
  else if (geste === 9) L[i] = l.replace(/^( *)([A-Za-z_]+):/, (_, a, b) => `${a}${un([`"${b}"`, `'${b}'`, `? ${b}`, `${b} `, b.repeat(300), `${b}.x`, `-${b}`])}:`); // la clé écrite autrement
  else if (geste === 10) L[i] = l.replace(/ #/, '#'); // commentaire collé
  else if (geste === 11) L[i] = l.replace(/([\]}])/, `$1${un(['x', ' x', ',', ' ]', '}'])}`); // du texte après un flux
  else if (geste === 12) L[i] = l.replace(/([{[]) ?/, `$1${un(['{ a: b }, ', '[x], ', ', ', '? ', '"k": v, ', 'k, ', 'k:v, ', '- '])}`); // un flux imbriqué ou une forme de flux refusée
  else if (geste === 13) L[i] = l.replace(/: (.*)$/, ':\n' + r + '  $1'); // la valeur à la ligne suivante
  else if (geste === 14) L[i] = l.replace(/: (.*)$/, (_, v) => `: ${un(['|', '>', '|-', '>+'])}\n${r}  ${v}`); // un scalaire en bloc
  else L[i] = l + un(['\r', ' \t', '\\', ' :', ':', ' ,', '\u00a0', '\u2028x: y']); // une fin de ligne abîmée
  return L.join('\n');
}

if (sortie) writeFileSync(sortie, '');
const comptes = {}; let intacts = 0, intactsRefuses = 0, intactsYamlRefuse = 0, lus = 0;
for (let i = 0; i < Number(nombre); i++) {
  let h = `id: RULE_ALL_FAC-${i % 97}\n${melange([criticite(), validation(), code(), ...unParCle(melange(AUTRES())).slice(0, n(4))]).join('')}`;
  const intact = p(PART_INTACTE);
  if (!intact) { h = p(0.5) ? abimer(h) : abimerUneLigne(h); if (p(0.1)) h = abimer(h); }
  const texte = `---\n${h}${h.endsWith('\n') ? '' : '\n'}---\n\nL'énoncé.\n`;
  if (intact) {
    intacts++;
    try { enTeteDeRegle(texte); } catch (e) { if (!(e instanceof Illisible)) throw e; intactsRefuses++; if (sortie) appendFileSync(sortie, `${JSON.stringify({ g: 'presque', classe: 'R-intact-refuse-par-le-module', texte, module: e.message, lib: bibliotheque(texte) })}\n`); }
    if (bibliotheque(texte).erreur) intactsYamlRefuse++;
  }
  let d;
  try { d = classer(texte); } catch (e) { d = { classe: 'PLANTAGE', module: String(e), lib: null }; }
  if (d === null) continue;
  lus++;
  comptes[d.classe] = (comptes[d.classe] ?? 0) + 1;
  if (sortie) appendFileSync(sortie, `${JSON.stringify({ g: 'presque', classe: d.classe, texte, module: d.module, lib: d.lib })}\n`);
}
console.log(JSON.stringify({ graine: graine0, tirages: Number(nombre), 'lus par le module': compteurs.lus, 'refusés par le module': compteurs.refus, intacts, 'intacts refusés par le module': intactsRefuses, 'intacts refusés par yaml': intactsYamlRefuse, comptes }, null, 1));
