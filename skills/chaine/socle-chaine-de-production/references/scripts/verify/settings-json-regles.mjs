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

/** Matcheur des outils GitHub d'écriture (hook `garde-github`). */
export const MATCHER_GITHUB = '^mcp__.+__(push_files|create_or_update_file|delete_file|create_branch|merge_pull_request|enable_pr_auto_merge|update_pull_request_branch)$';

/** Les gardes de PreToolUse : chaque matcheur exigé lance son script, qui échoue fermé. */
export const GARDES = {
  'Edit|Write|MultiEdit|NotebookEdit': 'scripts/agent/garde-fichiers.mjs',
  Bash: 'scripts/agent/garde-commandes.mjs',
  [MATCHER_GITHUB]: 'scripts/agent/garde-github.mjs',
};

/** Événements de hook exigés, avec les matcheurs que chacun doit porter. */
export const HOOKS_EXIGES = {
  SessionStart: [],
  PreToolUse: Object.keys(GARDES),
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
    (groupe?.hooks ?? []).map((h) => ({ matcher: groupe.matcher, type: h?.type, command: h?.command ?? '', onFailure: h?.onFailure, timeout: h?.timeout, async: h?.async, asyncRewake: h?.asyncRewake })),
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
  // Chaque garde est lancée par son matcheur, et échoue fermé : `"onFailure": "block"` (Claude Code
  // 2.1.295 ou plus récent, page des hooks), un `"timeout"` d'au plus 60 s (le défaut est 600 s), jamais
  // en arrière-plan (`async`, `asyncRewake` : la page dit `onFailure` sans effet sur un hook en
  // arrière-plan). Sans quoi une garde qui plante, dépasse son délai ou a été remplacée laisserait passer
  // l'outil.
  // La garde se lance par la commande exacte du fragment (`node "$CLAUDE_PROJECT_DIR"/scripts/agent/…`),
  // en hook `command` : `… || true`, `true # …`, `echo …` ou un hook `prompt` ne la lancent pas.
  const lance = (l, script) => l.type === 'command' && new RegExp(`^node "\\$\\w+"/${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(l.command.trim());
  if (json?.disableAllHooks === true) {
    ecarts.push(`ligne ${ligneDeCle(texte, 'disableAllHooks')} : \`disableAllHooks\` à \`true\` coupe toutes les gardes. Retirer la clé.`);
  }
  const lignesPre = commandes(hooks.PreToolUse);
  for (const [matcher, script] of Object.entries(GARDES)) {
    if (lignesPre.some((l) => l.matcher === matcher) && !lignesPre.some((l) => l.matcher === matcher && lance(l, script))) {
      ecarts.push(`ligne ${ligneDeCle(texte, 'PreToolUse')} : \`hooks.PreToolUse\`, matcheur « ${matcher} », ne lance pas ${script}.`);
    }
  }
  for (const { command, onFailure, timeout, async: fond, asyncRewake } of lignesPre) {
    const garde = /scripts\/agent\/garde-[\w.-]+/.exec(command)?.[0];
    if (!garde) continue;
    const ligne = ligneDe(texte, new RegExp(garde.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    if (onFailure !== 'block') {
      ecarts.push(`ligne ${ligne} : \`hooks.PreToolUse\` lance ${garde} sans \`"onFailure": "block"\` : une garde qui plante ou dépasse son délai laisserait passer l'outil.`);
    }
    if (typeof timeout !== 'number' || !(timeout > 0 && timeout <= 60)) {
      ecarts.push(`ligne ${ligne} : \`hooks.PreToolUse\` lance ${garde} sans \`"timeout"\` numérique d'au plus 60 s : avec \`"onFailure": "block"\`, le défaut de 600 s tiendrait la session dix minutes sur une garde bloquée.`);
    }
    if (fond === true || asyncRewake === true) {
      ecarts.push(`ligne ${ligne} : \`hooks.PreToolUse\` lance ${garde} en arrière-plan (\`async\`) : il ne bloque plus rien.`);
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
