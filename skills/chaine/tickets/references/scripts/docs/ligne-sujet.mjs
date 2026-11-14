/**
 * Valeurs de la ligne `Sujet:` d'une carte de chantier. Une carte peut couvrir plusieurs sujets :
 * `Sujet: sujet/a, sujet/b, sujet/c`. Un ticket et une spec n'en nomment qu'un.
 * Lue par `couts.mjs` et par le gate des cartes (`verify/tickets-regles.mjs`) ; son équivalent
 * côté shell est `carte_nomme_le_sujet` de `sujet.sh`, qui lit la même forme.
 */

/** Un nom de sujet : kebab-case (la règle du gate des cartes). */
const NOM = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Les noms que porte la valeur d'une ligne `Sujet:` (le texte après `Sujet:`), dans l'ordre :
 * `sujet/a, sujet/b` → `['a', 'b']`. Valeurs séparées par des virgules, espaces ou tabulations tolérées autour (ni espace insécable, ni
 * saut de page, comme l'awk de `sujet.sh`, qui lit la même ligne) ;
 * chacune est `sujet/<nom-en-kebab>` (le préfixe est facultatif avec `prefixeFacultatif`). Rend `null`
 * quand la valeur est vide ou qu'une valeur n'est pas un nom de sujet : virgule en trop, espace
 * pour seul séparateur, majuscule. Jamais de lecture partielle.
 */
export function nomsDeSujets(valeur, { prefixeFacultatif = false } = {}) {
  const noms = valeur
    .replace(/^[ \t]+/, '')
    .replace(/[ \t\n\v\f\r]+$/, '')
    .split(/[ \t]*,[ \t]*/)
    .map((v) => (v.startsWith('sujet/') ? v.slice('sujet/'.length) : prefixeFacultatif ? v : null));
  return noms.every((n) => n !== null && NOM.test(n)) ? noms : null;
}
