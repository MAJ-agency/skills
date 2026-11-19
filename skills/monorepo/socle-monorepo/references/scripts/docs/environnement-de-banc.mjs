// L'environnement qu'un banc donne aux processus qu'il lance : celui du processus du banc, nettoyé de
// ce qui le ferait sortir de son dépôt jouet ou lire autre chose que son propre résultat.
//   - GIT_* : sous un hook git (pre-push), GIT_DIR et GIT_INDEX_FILE visent le vrai dépôt ; les
//     commandes du dépôt jouet y écriraient.
//   - PASSER_*, BOUCLE_*, PRE_PUSH_*, REVUE_* : ce que le capitaine exporte quand passer.sh pousse
//     (ses outils, sa copie, ses PR sautées, les refs du vrai push, sa revue).
//   - NODE_TEST_CONTEXT : avec lui, un `node --test` enfant rendrait ses résultats au runner parent.
//   - FORCE_COLOR : sous un terminal, `node --test` le pose ; un enfant le suit et sa sortie porte des
//     séquences ANSI (`console.log(4)` rend `\x1b[33m4\x1b[39m`) : un banc vert en CI rougirait sur un poste.
// NO_COLOR=1 est posé quelle que soit sa valeur héritée. Ce qui reste propre à un banc (identité git,
// GIT_CONFIG_GLOBAL, GARDER_JOUETS…) s'ajoute après l'appel. Aucun effet à l'import, aucune dépendance.
const PREFIXES = ['GIT_', 'PASSER_', 'BOUCLE_', 'PRE_PUSH_', 'REVUE_'];
const NOMS = ['FORCE_COLOR', 'NODE_TEST_CONTEXT'];

export function environnementDeBanc(base = process.env) {
  const env = Object.fromEntries(
    Object.entries(base).filter(([cle]) => !NOMS.includes(cle) && !PREFIXES.some((p) => cle.startsWith(p))),
  );
  env.NO_COLOR = '1';
  return env;
}
