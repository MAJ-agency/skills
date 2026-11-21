// Contre-relecture de la PR 146, premier tour : quinze mutations K1 à K15, ciblées sur ce que les essais ont trouvé
// fragile (même mécanique que l'annexe du ticket : un texte exact remplacé, les bancs visés joués, le fichier remis).
// Jouées sur l'arbre de la PR (d1679f3), puis sur l'arbre retouché (retouches-tour-1.patch) : chaque texte visé existe
// dans les deux. À lancer depuis la racine de l'arbre : `node <chemin>/mutations-c1.mjs [K<n>…]`.
// Sortie 0 : toutes rouges ; 1 : une au moins verte, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';

const MUTATIONS = [
  ['K1 git : les GIT_CONFIG_* de la session remplacés, pas complétés', R, 'const n = Number(env.GIT_CONFIG_COUNT ?? 0);', 'const n = 0;'],
  ['K2 git : le fsmonitor n’est plus coupé', R, "['core.fsmonitor', 'false']]", "['core.untrackedCache', 'false']]"],
  ['K3 git : les hooks cherchés à leur place par défaut (.git/hooks)', R, "[['core.hooksPath', '']", "[['core.hooksPath', '.git/hooks']"],
  ['K4 diff propre : `a-juger` en échec lu comme une liste vide', R, 'if (a.status !== 0) return { cause:', 'if (false) return { cause:'],
  ['K5 diff propre : le diff vers develop en échec lu comme une liste vide', R, 'return d.status === 0 ? { fichiers:', 'return true ? { fichiers:'],
  ['K6 dépendances : une installation en échec relue comme faite', R, "DEPENDANCES = lu[1] !== 'echec';", 'DEPENDANCES = true;'],
  ['K7 dépendances : une installation en échec rend illisible toute PR vers un sujet', R, 'if (a.status !== 0 && !DEPENDANCES)', 'if (!DEPENDANCES)'],
  ['K8 illisible : une cause signalée ne se redit jamais, même après le délai', R, '&& t.texte.startsWith(commentaire) && commun.maintenant - Date.parse(t.date) <= commun.delaiMs)', '&& t.texte.startsWith(commentaire))'],
  ['K9 illisible : une forme refusée sans session d’auteur ne sonne personne', R, "a === 'auteur' && demande.auteur !== null ?", "a === 'auteur' ?"],
  ['K10 dépendances : l’installation sans `--frozen-lockfile`', R, "['install', '--frozen-lockfile', '--prefer-offline']", "['install', '--prefer-offline']"],
  ['K11 dépendances : un lockfile de develop changé ne réinstalle pas', R, 'if (lu[0] === empreinte && (', 'if (lu.length > 0 && ('],
  ['K12 veille : elle ne s’arrête plus au bout de sa durée', R, 'const fin = Date.now() + duree * 60_000;', 'const fin = Infinity;'],
  ['K13 verrou : jamais pris', R, 'if (process.env.RELECTEUR_VERROU) return null;', 'return null;'],
  ['K14 diff propre : une PR de mise à jour lue sur sa première liste (la résolution), sans ses retouches', R, 'return { fichiers: (seconde ?? premiere ?? \'\').split', 'return { fichiers: (premiere ?? \'\').split'],
  ['K15 fourche : une fourche supprimée (`head.repo` nul) lue comme le dépôt', R, 'if ((json.head.repo?.full_name ?? null) !== (json.base.repo?.full_name ?? null))', 'if (json.head.repo && json.head.repo.full_name !== json.base.repo?.full_name)'],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs = [BR]] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
