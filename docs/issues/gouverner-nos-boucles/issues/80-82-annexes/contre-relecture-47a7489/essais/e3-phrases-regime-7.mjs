// Essai E3 (le régime 7 sous 8.0.0) : pour chaque skill joué, (a) les phrases du texte de 7.39.0 absentes du texte de
// 8.0.0 et de regime-7.md, (b) les phrases du texte de 8.0.0 absentes de celui de 7.39.0 qui ne disent ni « régime 8 »
// ni « régime 7 » (celles qu'une session en régime 7 suivrait sans filtre). Chacune est classée à la main dans le rapport.
// Usage : node e3-phrases-regime-7.mjs <racine de 97d17e3> <racine de 47a7489>
import { readFileSync } from 'node:fs';
const [base, tete] = process.argv.slice(2);
const fichiers = ['skills/chaine/chantier/SKILL.md', 'skills/chaine/architecte/SKILL.md', 'skills/chaine/architecte/references/lancement.md', 'skills/chaine/fusionner/SKILL.md', 'skills/chaine/sujet/SKILL.md'];
const plat = (t) => t.replace(/\s+/g, ' ').replace(/\*\*/g, '');
const decouper = (t) => plat(t).split(/(?<=[.;:])\s+(?=[A-ZÀ-Ü«(`*0-9-])/).map((p) => p.trim()).filter((p) => p.length > 25);
const sept = plat(readFileSync(`${tete}/skills/chaine/chantier/references/regime-7.md`, 'utf8'));
for (const f of fichiers) {
  const avant = readFileSync(`${base}/${f}`, 'utf8');
  const apres = readFileSync(`${tete}/${f}`, 'utf8');
  const a = decouper(avant).filter((p) => !plat(apres).includes(p) && !sept.includes(p));
  const b = decouper(apres).filter((p) => !plat(avant).includes(p) && !/régime [78]|Deux régimes/.test(p));
  console.log(`\n=== ${f}\n(a) ${a.length} phrase(s) de 7.39.0 sans place en 8.0.0`);
  a.forEach((p, i) => console.log(`  a${i + 1}. ${p.slice(0, 220)}`));
  console.log(`(b) ${b.length} phrase(s) neuves sans « régime 7/8 »`);
  b.forEach((p, i) => console.log(`  b${i + 1}. ${p.slice(0, 220)}`));
}
