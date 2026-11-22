// Mutations du relecteur, ticket 90 : chacune remplace un texte exact (ou l'ajoute en fin de fichier), joue les bancs
// nommés, puis remet le fichier. À lancer depuis la racine d'un arbre : node mutations-relecteur.mjs [<nom>…]
// Sortie : une ligne ROUGE ou VERTE par mutation (VERTE : la mutation survit).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const EB = 'skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.test.mjs';
const R = 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs';
const AGENT = ['apres-edition', 'fin-de-tour', 'garde-commandes', 'garde-fichiers', 'garde-github', 'garde-illisible', 'regles'].map((b) => `skills/chaine/socle-chaine-de-production/references/agent/${b}.test.mjs`);
const G8 = ['--test-name-pattern=régime 8', 'scripts/references-posees.test.mjs'];
const FIN = Symbol('fin');
const MUTATIONS = [
  ['M11 un banc posé saute un sous-test (sortie TAP indentée)', EB, FIN, "\ntest('M11', async (t) => { await t.test('sous-test sauté', { skip: true }, () => {}); });\n", G8],
  ['M12 un banc posé marque « todo » un sous-test rouge (jamais jugé)', EB, FIN, "\ntest('M12', async (t) => { await t.test('sous-test todo rouge', { todo: true }, () => { throw new Error('rouge'); }); });\n", G8],
  ['M14 regles.mjs : les index de index-generes.json ne sont plus refusés (hors du ticket)', R, '  ...INDEX_GENERES.map(({ chemin, commande }) => [chemin, commande]),\n', '', AGENT],
];
const voulues = process.argv.slice(2);
for (const [nom, fichier, avant, apres, args] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (avant !== FIN && texte.split(avant).length !== 2) { console.log(`INTROUVABLE ${nom}`); continue; }
  writeFileSync(fichier, avant === FIN ? texte + apres : texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...args], { encoding: 'utf8', timeout: 1_800_000, maxBuffer: 64 * 1024 * 1024 });
  writeFileSync(fichier, texte);
  const echecs = (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.slice(0, 80)).join(' | ');
  const diag = (r.stdout.match(/^# régime.*$/gm) ?? []).join(' ; ');
  console.log(`${r.status !== 0 ? 'ROUGE' : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}${diag ? ` — ${diag}` : ''}`);
}
