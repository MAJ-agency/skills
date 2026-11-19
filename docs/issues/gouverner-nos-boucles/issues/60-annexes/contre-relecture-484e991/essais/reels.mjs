import { readFileSync } from 'node:fs';
import { enTeteDeRegle, bibliotheque } from './ref.mjs';
let lus = 0, refus = 0, ecarts = 0; const niveaux = {};
for (const f of process.argv.slice(2)) {
  const texte = readFileSync(f, 'utf8');
  const l = bibliotheque(texte);
  let m; try { m = enTeteDeRegle(texte); } catch (e) { refus++; console.log('REFUS', f, '::', e.message, ':: yaml', JSON.stringify(l.erreur ?? l.brut ?? l)); continue; }
  lus++;
  const ln = l.niveau ?? null;
  niveaux[`${m.niveau}/${m.enVigueur ? 'en vigueur' : 'hors vigueur'}`] = (niveaux[`${m.niveau}/${m.enVigueur ? 'en vigueur' : 'hors vigueur'}`] ?? 0) + 1;
  if (l.erreur || l.sansEnTete || l.niveauInvalide || l.codeInvalide || m.niveau !== ln || m.enVigueur !== l.enVigueur || JSON.stringify(m.code) !== JSON.stringify(l.code)) { ecarts++; console.log('ÉCART', f, JSON.stringify(m), JSON.stringify(l)); }
}
console.log(JSON.stringify({ fichiers: process.argv.length - 2, lus, refus, ecarts, niveaux }));
