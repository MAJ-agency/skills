// Essai E4 (second tour) : les phrases que le delta 47a7489..45d72a6 ajoute ou retire dans les textes des rôles ; pour
// chaque phrase neuve, si elle dit « régime 7 » ou « régime 8 » (sinon une session en régime 7 la suit).
// Usage : node e4-phrases-delta.mjs <racine de 47a7489> <racine de 45d72a6>
import { readFileSync } from 'node:fs';
const [avant, apres] = process.argv.slice(2);
const fichiers = ['skills/chaine/chantier/SKILL.md', 'skills/chaine/architecte/SKILL.md', 'skills/chaine/architecte/references/lancement.md', 'skills/chaine/fusionner/SKILL.md', 'skills/chaine/sujet/SKILL.md', 'skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md'];
const plat = (t) => t.replace(/\s+/g, ' ').replace(/\*\*/g, '');
const decouper = (t) => plat(t).split(/(?<=[.;:])\s+(?=[A-ZÀ-Ü«(`*0-9-])/).map((p) => p.trim()).filter((p) => p.length > 25);
for (const f of fichiers) {
  const a = readFileSync(`${avant}/${f}`, 'utf8');
  const b = readFileSync(`${apres}/${f}`, 'utf8');
  const parties = decouper(a).filter((p) => !plat(b).includes(p));
  const neuves = decouper(b).filter((p) => !plat(a).includes(p));
  console.log(`\n=== ${f} : ${parties.length} retirée(s), ${neuves.length} neuve(s)`);
  parties.forEach((p, i) => console.log(`  r${i + 1}. ${p.slice(0, 200)}`));
  neuves.forEach((p, i) => console.log(`  n${i + 1}. [${/régime [78]/.test(p) ? 'dit le régime' : 'SANS régime'}] ${p.slice(0, 260)}`));
}
