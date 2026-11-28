// Les seuls tests qu'un banc posé saute, chacun avec sa raison (ticket 117, A-266) : un autre saut est un banc qui ne se
// juge plus une fois posé. `banc` est le chemin du banc dans le projet. La liste est lue par les deux gardes qui jouent
// des bancs posés (`poses.test.mjs`, `references-posees.test.mjs`) : le même saut n'est écrit qu'une fois, avec une raison.
// Elle tient les sauts qu'un garde voit : un saut conditionnel qu'aucun garde ne produit (les deux tests de
// `mutation-regles.test.mjs` sans `apps/api/`, A-257) n'y entre pas ; sa raison est écrite dans le banc.
// Jamais posé dans un projet.

export const SAUTES = Object.freeze([
  Object.freeze({
    banc: "scripts/github/pr-titre.test.mjs",
    nom: "le workflow donne PR_OUVERTE, la date d’ouverture de la PR, comme les autres entrées : par `env:`",
    raison: "le workflow vit sous .github/workflows/ dans un projet ; le banc ne le lit que dans le plugin",
  }),
]);

/** Les entrées dont le banc est dans `bancs`, triées par banc puis par nom. */
export function sautesAttendus(bancs) {
  return SAUTES.filter((s) => bancs.includes(s.banc)).sort((a, b) => (a.banc < b.banc ? -1 : a.banc > b.banc ? 1 : a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0));
}
