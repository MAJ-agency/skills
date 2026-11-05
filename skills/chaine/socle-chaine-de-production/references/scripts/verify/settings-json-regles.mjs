/**
 * Règles pures du gate `settings-json` : la forme de `.claude/settings.json`.
 * Le gate (`settings-json.mjs`) lit le fichier ; ici, aucune entrée-sortie, tout s'éprouve.
 *
 * Le gate lit, il ne corrige pas et ne propose pas de contenu : une session ne touche pas à ses
 * droits (ADR « chaîne de production »). Chaque écart dit la règle et la ligne.
 */
import { existsSync } from 'node:fs';

// Posé dans un projet, regles.mjs des hooks est dans scripts/agent/ ; dans le plugin, dans references/agent/.
const { decisionCommande } = await import(
  existsSync(new URL('../agent/regles.mjs', import.meta.url)) ? '../agent/regles.mjs' : '../../agent/regles.mjs'
);

/** Événements de hook exigés, avec les matcheurs que chacun doit porter. */
export const HOOKS_EXIGES = {
  SessionStart: [],
  PreToolUse: ['Edit|Write|MultiEdit|NotebookEdit', 'Bash'],
  PostToolUse: [],
  Stop: [],
};

/** Clés qui n'ont de sens qu'à une place : `permissions` à la racine, `allow`/`deny` dessous. */
const PLACES = { permissions: [], allow: ['permissions'], deny: ['permissions'] };

const ligneDe = (texte, motif) => {
  const i = texte.split('\n').findIndex((l) => motif.test(l));
  return i === -1 ? 1 : i + 1;
};

const ligneDeCle = (texte, cle) => ligneDe(texte, new RegExp(`"${cle}"\\s*:`));

/** Parcourt l'objet et rend les clés `permissions`/`allow`/`deny` posées ailleurs qu'à leur place. */
function clesMalPlacees(noeud, chemin = []) {
  if (noeud === null || typeof noeud !== 'object') return [];
  if (Array.isArray(noeud)) return noeud.flatMap((n) => clesMalPlacees(n, chemin));
  return Object.entries(noeud).flatMap(([cle, valeur]) => {
    const mal =
      cle in PLACES && PLACES[cle].join('/') !== chemin.join('/')
        ? [{ cle, chemin: [...chemin, cle].join('.') }]
        : [];
    return [...mal, ...clesMalPlacees(valeur, [...chemin, cle])];
  });
}

/** Commandes `command` d'un événement de hook, avec le matcheur qui les porte. */
const commandes = (evenement) =>
  (Array.isArray(evenement) ? evenement : []).flatMap((groupe) =>
    (groupe?.hooks ?? []).map((h) => ({ matcher: groupe.matcher, command: h?.command ?? '' })),
  );

/**
 * Écarts de forme d'un `settings.json`.
 * @param {string} texte contenu du fichier
 * @param {{ fichierExiste: (chemin: string) => boolean }} contexte
 * @returns {string[]} un message par écart, vide si le fichier est conforme
 */
export function ecartsSettings(texte, { fichierExiste }) {
  let json;
  try {
    json = JSON.parse(texte);
  } catch (e) {
    const position = /position (\d+)/.exec(String(e.message))?.[1];
    const ligne = position ? texte.slice(0, Number(position)).split('\n').length : 1;
    return [
      `ligne ${ligne} : JSON invalide (${e.message}) ; Claude Code ignore le fichier en entier, hooks compris. Corriger la syntaxe (virgule en trop, guillemet manquant).`,
    ];
  }
  const ecarts = [];

  for (const { cle, chemin } of clesMalPlacees(json)) {
    ecarts.push(
      `ligne ${ligneDeCle(texte, cle)} : « ${chemin} » mal placé ; ${
        cle === 'permissions'
          ? "`permissions` ne se déclare qu'à la racine"
          : `\`${cle}\` ne se déclare que sous \`permissions\` (\`permissions.${cle}\`), ailleurs la liste est inerte`
      }.`,
    );
  }

  // `permissions` est facultatif (un projet neuf n'a pas encore de liste blanche) ; présent, il
  // porte un `allow` non vide, et rien qui autorise ce que les hooks refusent.
  const allow = json?.permissions?.allow;
  if ((json?.permissions !== undefined || 'allow' in (json ?? {})) && (!Array.isArray(allow) || allow.length === 0)) {
    ecarts.push(
      `ligne ${ligneDeCle(texte, 'permissions')} : \`permissions.allow\` doit être un tableau non vide.`,
    );
  } else if (Array.isArray(allow)) {
    for (const entree of allow) {
      const bash = /^Bash\((.*?)(?::\*)?\)$/.exec(String(entree));
      const verdict = bash && decisionCommande(bash[1]);
      if (verdict?.decision === 'refuser') {
        ecarts.push(
          `ligne ${ligneDe(texte, new RegExp(JSON.stringify(entree).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))} : « ${entree} » autorise ce que les hooks refusent (${verdict.raison}). Retirer l'entrée.`,
        );
      }
    }
  }

  const hooks = json?.hooks ?? {};
  for (const [evenement, matcheurs] of Object.entries(HOOKS_EXIGES)) {
    const lignes = commandes(hooks[evenement]);
    const ligneEvenement = ligneDeCle(texte, evenement);
    if (lignes.length === 0) {
      ecarts.push(`ligne ${ligneEvenement} : \`hooks.${evenement}\` absent ou vide.`);
      continue;
    }
    for (const matcher of matcheurs) {
      if (!lignes.some((l) => l.matcher === matcher)) {
        ecarts.push(
          `ligne ${ligneEvenement} : \`hooks.${evenement}\` sans matcheur « ${matcher} ».`,
        );
      }
    }
  }
  for (const [evenement, valeur] of Object.entries(hooks)) {
    for (const { command } of commandes(valeur)) {
      const fichier = /scripts\/agent\/[\w.-]+/.exec(command)?.[0];
      const ligne = ligneDe(
        texte,
        new RegExp((fichier ?? command).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      );
      // Une commande qui ne cite pas scripts/agent/ est un outil externe (graphify) : acceptée telle quelle.
      if (fichier && !fichierExiste(fichier)) {
        ecarts.push(`ligne ${ligne} : \`hooks.${evenement}\` cite ${fichier}, qui n'existe pas.`);
      }
    }
  }
  return ecarts;
}
