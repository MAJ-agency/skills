// Lit des en-têtes par le module puis par `yaml` 2.9.1. Usage : MODULE=<double-relecture.mjs> node essais/un.mjs < cas/<fichier>.txt
// L'entrée : des en-têtes séparés par une ligne `====`. Les caractères qui ne se voient pas s'écrivent <TAB>, <CR>,
// <NBSP> (U+00A0), <BOM> (U+FEFF), <LS> (U+2028), <NEL> (U+0085).
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { enTeteDeRegle } from './ref.mjs';
const INVISIBLES = { TAB: 9, CR: 13, NBSP: 0xa0, BOM: 0xfeff, LS: 0x2028, NEL: 0x85 };
for (const c of readFileSync(0, 'utf8').split(/^====\n/m)) {
  const h = c.replace(/\n$/, '').replace(/<(TAB|CR|NBSP|BOM|LS|NEL)>/g, (_, nom) => String.fromCharCode(INVISIBLES[nom]));
  const texte = `---\n${h}\n---\n\nL'énoncé.\n`;
  let m, y;
  try { m = JSON.stringify(enTeteDeRegle(texte)); } catch (e) { m = `REFUS ${e.message}`; }
  try { y = JSON.stringify(parse(h, { logLevel: 'error' })); } catch (e) { y = `ERREUR ${e.message.split('\n')[0]}`; }
  console.log(JSON.stringify(h)); console.log('  module :', m); console.log('  yaml   :', y);
}
