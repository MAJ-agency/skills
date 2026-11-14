/**
 * Règles pures du gate `skills-recopies` : la copie des skills de la chaîne (`.claude/skills/`)
 * contre son manifeste (`.claude/skills/maj-skills.json`, posé par `scripts/recopier-skills.mjs`).
 * Le gate (`skills-recopies.mjs`) lit le disque ; ici, aucune entrée-sortie, tout s'éprouve.
 */

/** Vrai pour un objet JSON simple (ni `null`, ni tableau). */
const estObjet = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Lit le texte du manifeste.
 * @returns {{ manifeste: { version: string, skills: string[], fichiers: Record<string, string> } } | { invalide: string }}
 */
export function lireManifeste(texte) {
  let json;
  try {
    json = JSON.parse(texte);
  } catch (e) {
    return { invalide: `JSON invalide (${e.message})` };
  }
  if (!estObjet(json)) return { invalide: "ce n'est pas un objet JSON" };
  if (!Array.isArray(json.skills) || !json.skills.every((n) => typeof n === 'string')) return { invalide: '`skills` doit être un tableau de chaînes' };
  if (!estObjet(json.fichiers) || !Object.values(json.fichiers).every((v) => typeof v === 'string')) return { invalide: '`fichiers` doit être un objet dont chaque valeur est une chaîne' };
  return { manifeste: { version: typeof json.version === 'string' ? json.version : '?', skills: json.skills, fichiers: json.fichiers } };
}

/**
 * Écarts entre la copie et son manifeste.
 * @param {{ skills: string[], fichiers: Record<string, string> }} manifeste
 * @param {{ empreinte: (chemin: string) => string | null, fichiersDuSkill: (nom: string) => string[] }} disque
 *   chemins relatifs à `.claude/skills/`, barres obliques ; `empreinte` rend `null` si le fichier est absent
 * @returns {string[]} « <chemin> : absent | modifié | en trop », vide si la copie est intacte
 */
export function ecartsCopie({ skills, fichiers }, { empreinte, fichiersDuSkill }) {
  const ecarts = [];
  for (const [chemin, attendue] of Object.entries(fichiers)) {
    const reelle = empreinte(chemin);
    if (reelle === null) ecarts.push(`${chemin} : absent`);
    else if (reelle !== attendue) ecarts.push(`${chemin} : modifié`);
  }
  for (const nom of skills) for (const chemin of fichiersDuSkill(nom)) if (!(chemin in fichiers)) ecarts.push(`${chemin} : en trop`);
  return ecarts;
}

/** La phrase qui clôt la liste des écarts. */
export const phraseEcart = (version) =>
  `la copie des skills diffère de son manifeste (maj-skills ${version}) : elle ne se modifie pas dans ce projet. La rétablir depuis la branche d'intégration, ou attendre la PR de recopie.`;
