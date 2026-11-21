// Étendu aux formes d'un formateur (A-143, point 2) : ouvrants, entrées à virgule et fermants, à tout retrait.
// Générateur « structure » : des lignes aux seules formes de la liste blanche, à des retraits tirés au hasard. Chaque
// ligne est admise, leur suite ne l'est pas toujours : il éprouve l'alignement, les blocs et les listes.
// Usage : node structure.mjs <graine> <nombre> [fichier des dangers]
import { appendFileSync, writeFileSync } from 'node:fs';
import { classer, compteurs } from './ref.mjs';
const [graine0 = '1', nombre = '100000', sortie = null] = process.argv.slice(2);
let graine = Number(graine0) | 0;
const hasard = () => { graine = (graine + 0x6d2b79f5) | 0; let t = Math.imul(graine ^ (graine >>> 15), 1 | graine); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const un = (l) => l[Math.floor(hasard() * l.length)];
const n = (max) => Math.floor(hasard() * (max + 1));
const NIV = ['low', 'medium', 'high'];
const STAT = ['candidate', 'validated', 'rejected', 'obsolete'];
const CLES = ['criticality', 'criticality', 'validation', 'validation', 'code', 'code', 'level', 'level', 'status', 'status', 'by', 'reason', 'title', 'sources', 'ref', 'x', 'y', 'extensions'];
const valeur = () => un([un(NIV), un(NIV), un(STAT), un(STAT), 'agent', 'apps/a.ts', 'apps/b.ts', `"${un(NIV)}"`, `'${un(STAT)}'`, 'Un titre', `{ level: ${un(NIV)} }`, `{ status: ${un(STAT)} }`, `{ level: ${un(NIV)}, by: agent }`, '[apps/a.ts]', '[ apps/a.ts, apps/b.ts ]', '[]', '{}', `"x, level: ${un(NIV)}"`, '2026-11-16']);
const scalaireDeFlux = () => un([un(NIV), un(NIV), un(STAT), un(STAT), 'agent', 'apps/a.ts', 'apps/b.ts', `"${un(NIV)}"`, `'${un(STAT)}'`, 'une raison', `"x, level: ${un(NIV)}"`]);
const ligne = () => un([
  () => `${un(CLES)}: ${valeur()}`, () => `${un(CLES)}: ${valeur()}`, () => `${un(CLES)}: ${valeur()}`,
  () => `${un(CLES)}:`, () => `${un(CLES)}:`,
  () => `- ${valeur()}`, () => `- ${valeur()}`,
  () => `- ${un(CLES)}: ${valeur()}`, () => `- ${un(CLES)}:`,
  () => `# ${un(CLES)}: ${valeur()}`, () => '',
  () => un(['{', '{', '[', '[', '}', '}', ']', ']', '} # c', '{}', '[]']), () => un(['{', '[', '}', ']']),
  () => `${un(CLES)}: ${un(['{', '{', '['])}`, () => `- ${un(['{', '['])}`,
  () => `${un(CLES)}: ${scalaireDeFlux()},`, () => `${un(CLES)}: ${scalaireDeFlux()},`, () => `${un(CLES)}: ${scalaireDeFlux()},`,
  () => `${scalaireDeFlux()},`, () => `${scalaireDeFlux()},`,
  () => `${un(CLES)}: ${valeur()} # ${un(CLES)}: ${valeur()}`, () => `${un(CLES)}: # c`,
])();
if (sortie) writeFileSync(sortie, '');
const comptes = {};
for (let i = 0; i < Number(nombre); i++) {
  const k = 2 + n(9);
  let retrait = 0; let h = '';
  for (let j = 0; j < k; j++) {
    // Le plus souvent un retrait voisin du précédent : la suite a une chance d'être un vrai bloc.
    retrait = j === 0 ? un([0, 0, 0, 0, 2]) : un([retrait, retrait, retrait, retrait + 2, retrait + 2, retrait + 4, Math.max(0, retrait - 2), Math.max(0, retrait - 2), Math.max(0, retrait - 4), 0, 0, retrait + 1, Math.max(0, retrait - 1), retrait + 3]);
    h += `${' '.repeat(retrait)}${ligne()}\n`;
  }
  const texte = `---\n${h}---\n\nL'énoncé.\n`;
  let d;
  try { d = classer(texte); } catch (e) { d = { classe: 'PLANTAGE', module: String(e), lib: null }; }
  if (d === null) continue;
  comptes[d.classe] = (comptes[d.classe] ?? 0) + 1;
  if (sortie) appendFileSync(sortie, `${JSON.stringify({ g: 'structure', classe: d.classe, texte, module: d.module, lib: d.lib })}\n`);
}
console.log(JSON.stringify({ graine: graine0, tirages: Number(nombre), 'lus par le module': compteurs.lus, 'refusés par le module': compteurs.refus, comptes }, null, 1));
