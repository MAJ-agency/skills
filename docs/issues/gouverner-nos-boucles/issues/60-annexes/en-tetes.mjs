// Essai hors dépôt : fabrique des en-têtes de règle et dit ce que le lecteur du module en lit.
// Usage : node en-tetes.mjs <chemin de double-relecture.mjs> <nombre> > en-tetes.jsonl
// Une ligne JSON par en-tête : { texte, lu: { niveau, code, enVigueur } } ou { texte, refus: "<message>" }.
import { pathToFileURL } from 'node:url';
const [module, nombre = '80000'] = process.argv.slice(2);
const { enTeteDeRegle, Illisible } = await import(pathToFileURL(module).href);

// Tirage reproductible (mulberry32).
let graine = 20261118;
const hasard = () => {
  graine = (graine + 0x6d2b79f5) | 0;
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const un = (liste) => liste[Math.floor(hasard() * liste.length)];
const melange = (liste) => liste.map((v) => [hasard(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

const NIVEAUX = ['low', 'medium', 'high'];
const TEXTES = [
  'une erreur coûte de l\'argent', 'c\'est grave', 'l\'agent', 'rien', '"entre guillemets, level: low"', '\'entre apostrophes, level: low\'',
  '"un # dans la chaîne"', '\'un # dans la chaîne\'', 'jusqu\'à 50 % d\'erreurs', '"d\'un côté, de l\'autre"', 'agent', 'd\'abord l\'un puis l\'autre',
  '"level: high"', '\'level: low\'', 'x\'', '\'\'', '""', 'l\'un # et l\'autre', '"a\'b"', '\'a"b\'', 'niveau-haut', 'a.b/c-d_e',
  // L'apostrophe échappée de YAML, `''`, dans une chaîne entre apostrophes (troisième tour de la relecture).
  `!!str 'x, level: low, z: "'`, `&a 'x, level: low, z: "'`, `!!str x`, `&b agent`, `"a\n    # ", level: high, r2: '\n    ", level: low, r3: x'`, `"plié\n      sur deux lignes"`, `*b`,
  `'l''agent'`, `'a'', level: low, z: "'`, `'a'', status: rejected, z: "'`, `'d''abord # pas un commentaire'`, `''''`, `'c''est grave, level: low'`,
];
const CHEMINS = [
  '!!str apps/api/src/etiquete.ts', '&c apps/api/src/ancre.ts', '*c', '!!str "apps/api/src/e2.ts"', '>-\n      apps/api/src/bloc.ts',
  'apps/api/src/facture/total.ts', 'apps/web/src/l\'un.ts', '"apps/web/a, b.ts"', '\'apps/web/c, d.ts\'', 'apps/web/d\'un/x.ts', 'packages/contracts/src/facture.ts',
  '"apps/x # y.ts"', '\'apps/x # z.ts\'', 'apps/api/src/app.module.ts', 'apps/l\'un/l\'autre.ts', '"apps/q\'r.ts"', `'apps/l''un/x.ts'`,
];
const COMMENTAIRES = ['', '', '', ' # un commentaire', ' # l\'autre', ' # \', level: low', ' # ", level: low', ' # level: low, by: agent', ' # c\'est tout'];
const STATUTS = ['candidate', 'validated', 'rejected', 'obsolete'];
const retrait = () => un(['  ', '  ', '    ']);

function criticite() {
  const niveau = un(NIVEAUX);
  const cle = (c) => un([c, c, c, c, c, c, `"${c}"`, `'${c}'`, `!!str ${c}`, `&k${c} ${c}`]);
  const paires = melange([[cle('level'), un([niveau, niveau, niveau, niveau, `"${niveau}"`, `'${niveau}'`, `!!str ${niveau}`, `&n ${niveau}`])], [cle('by'), un(TEXTES)], [cle('reason'), un(TEXTES)], [un(['"r"', "'r'", 'r']), un(TEXTES)]]).slice(0, un([1, 2, 3, 3, 4]));
  if (!paires.some(([c]) => c.includes('level'))) paires.push(['level', niveau]);
  const forme = un(['absente', 'nue', 'nue', 'bloc', 'bloc', 'ligne', 'ligne', 'pliee', 'pliee', 'pliee']);
  if (forme === 'absente') return '';
  if (forme === 'nue') return `criticality: ${un([niveau, `"${niveau}"`, `'${niveau}'`])}${un(COMMENTAIRES)}\n`;
  const r = retrait();
  if (forme === 'bloc') return `criticality:${un(COMMENTAIRES)}\n${paires.map(([c, v]) => `${r}${c}: ${v}${un(COMMENTAIRES)}\n`).join('')}`;
  if (forme === 'ligne') return `criticality: { ${paires.map(([c, v]) => `${c}${un([': ', ': ', ': ', ':'])}${v}`).join(', ')}${un(['', ','])} }${un(COMMENTAIRES)}\n`;
  // Pliée : une ou deux paires par ligne, un commentaire possible à chaque ligne.
  const lignes = [];
  for (let i = 0; i < paires.length; ) {
    const n = un([1, 1, 2]);
    lignes.push(`${r}${r}${paires.slice(i, i + n).map(([c, v]) => `${c}: ${v}`).join(', ')},${un(COMMENTAIRES)}\n`);
    i += n;
  }
  return un([`criticality:\n${r}{\n${lignes.join('')}${r}}\n`, `criticality: {${un(COMMENTAIRES)}\n${lignes.join('')}${r}}\n`]);
}
function code() {
  const chemins = melange(CHEMINS).slice(0, un([1, 1, 2, 3, 4]));
  const forme = un(['absente', 'vide', 'bloc', 'bloc', 'bloc0', 'ligne', 'ligne', 'pliee', 'pliee']);
  if (forme === 'absente') return '';
  if (forme === 'vide') return `code: []${un(COMMENTAIRES)}\n`;
  const r = retrait();
  if (forme === 'bloc') return `code:${un(COMMENTAIRES)}\n${chemins.map((c) => `${r}- ${c}${un(COMMENTAIRES)}\n`).join('')}`;
  if (forme === 'bloc0') return `code:\n${chemins.map((c) => `- ${c}${un(COMMENTAIRES)}\n`).join('')}`;
  if (forme === 'ligne') return `code: [${un(['', ' '])}${chemins.join(', ')}${un(['', ',', ' '])}]${un(COMMENTAIRES)}\n`;
  return `code:\n${r}[\n${chemins.map((c) => `${r}${r}${c},${un(COMMENTAIRES)}\n`).join('')}${r}]\n`;
}
function validation() {
  const statut = un(STATUTS);
  const forme = un(['bloc', 'bloc', 'bloc', 'ligne', 'pliee', 'absente']);
  if (forme === 'absente') return '';
  if (forme === 'bloc') return `validation:\n  status: ${statut}${un(COMMENTAIRES)}\n  date: 2026-11-16\n${un(['', `  reason: ${un(TEXTES)}\n`])}`;
  if (forme === 'ligne') return `validation: { ${un(['', '', '"r":' + un(TEXTES) + ', ', 'r: ' + un(TEXTES) + ', '])}${un(['status', 'status', '"status"'])}: ${un([statut, statut, '!!str ' + statut])}, reason: ${un(TEXTES)} }${un(COMMENTAIRES)}\n`;
  return `validation:\n  {\n    status: ${statut},${un(COMMENTAIRES)}\n    reason: ${un(TEXTES)},${un(COMMENTAIRES)}\n  }\n`;
}
const TITRES = ['title: Le total d\'une facture est la somme de ses lignes\n', `title: "Un titre : avec deux-points, level: low"\n`, 'title: C\'est l\'agent qui fixe le niveau # level: low\n'];
const AUTRES = ['epics: [facture]\n', 'sources:\n  - { ref: "réunion, point 3", path: docs/r.md }\n', 'extensions:\n  projet:\n    criticality: low\n    status: rejected\n', '# criticality: low\n'];

for (let i = 0; i < Number(nombre); i++) {
  const cles = melange([criticite(), code(), validation(), un(TITRES), ...melange(AUTRES).slice(0, 3)]).join('');
  const texte = `---\nid: RULE_ALL_FAC-${i}\n${cles}---\n\nL'énoncé.\n`;
  let ligne;
  try {
    ligne = { texte, lu: enTeteDeRegle(texte) };
  } catch (e) {
    if (!(e instanceof Illisible)) throw e;
    ligne = { texte, refus: e.message };
  }
  process.stdout.write(`${JSON.stringify(ligne)}\n`);
}
