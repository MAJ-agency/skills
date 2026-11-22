// Chaque mutation d'un fichier de mutations (l'annexe, ou mutations-contre.mjs) trouve-t-elle son texte, une fois
// exactement, dans l'arbre donné ? Usage : node textes-mutations.mjs <fichier de mutations> <racine de l'arbre>
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const [annexe, arbre] = process.argv.slice(2);
const src = readFileSync(annexe, 'utf8');
const debut = src.indexOf('const MUTATIONS = [');
const fin = src.indexOf('];\n', debut);
const consts = src.slice(0, debut);
const code = consts.replace(/^import .*$/gm, '') + '\nreturn ' + src.slice(debut + 'const MUTATIONS = '.length, fin + 1) + ';';
const MUTATIONS = new Function(code)();
let ko = 0;
for (const [nom, fichier, avant] of MUTATIONS) {
  const n = readFileSync(join(arbre, fichier), 'utf8').split(avant).length - 1;
  if (n !== 1) { ko++; console.log(`${nom} : trouvée ${n} fois`); }
}
console.log(`${MUTATIONS.length} mutations, ${ko} hors de leur texte`);
