// Le geste que le refus du hook d'édition donne (constat 5) passe-t-il le hook de commandes ? `decisionCommande` de
// regles.mjs : `null`, la commande est permise.
// Usage : node geste-du-hook.mjs <racine de l'arbre>
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { decisionCommande } = await import(pathToFileURL(join(process.argv[2], 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs')).href);
const c = "git fetch --prune origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/*:refs/remotes/origin/sujet/*'";
console.log(`${c}\n→ ${JSON.stringify(decisionCommande(c, { dependancesPrevues: () => [], brancheCourante: () => 'feat/spec-all-demo-1-01-x', brancheParDefaut: () => 'main' }))}`);
