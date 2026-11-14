/**
 * Règles des hooks Claude Code du projet (ADR « chaîne de production »), en fonctions pures : les
 * scripts de hook (garde-fichiers, garde-commandes) les appliquent, et `regles.test.mjs` les éprouve
 * (`node --test scripts/agent/`, dans `pnpm check:tickets`).
 *
 * Ce que les règles disent « jamais » et qu'une consigne ne garantit pas : le hook le refuse avant
 * que l'agent ne construise dessus, au lieu d'attendre le pre-push ou la CI.
 *
 * Ce qui est propre au projet vient de deux fichiers : `.claude/chaine.json` (le dossier des
 * migrations) et `scripts/docs/index-generes.json` (les fichiers générés et leur commande).
 */
import { readFileSync } from 'node:fs';

const lireJson = (url) => {
  try {
    return JSON.parse(readFileSync(url, 'utf8'));
  } catch {
    return null;
  }
};

/** Le contrat du projet (`.claude/chaine.json`). */
export const CHAINE = lireJson(new URL('../../.claude/chaine.json', import.meta.url)) ?? {};

/** Index générés : `[{ chemin, commande }]`, `*` = un segment de chemin. */
export const INDEX_GENERES = lireJson(new URL('../docs/index-generes.json', import.meta.url))?.index ?? [];

/** Manifeste de la copie des skills de la chaîne (`.claude/skills/maj-skills.json`), `null` s'il est absent ou illisible. */
export const MANIFESTE_SKILLS = lireJson(new URL('../../.claude/skills/maj-skills.json', import.meta.url));

/**
 * Fichiers générés : ils se régénèrent, ils ne s'éditent pas. Chemin (`*` = un segment) → commande.
 * Les index de `INDEX_GENERES` y sont tous, plus le lockfile.
 */
export const FICHIERS_GENERES = Object.fromEntries([
  ...INDEX_GENERES.map(({ chemin, commande }) => [chemin, commande]),
  ['pnpm-lock.yaml', 'pnpm install / pnpm add (jamais à la main)'],
]);

/** Motif → expression régulière (`*` = un segment de chemin). */
const cheminDuMotif = (motif) => new RegExp(`^${motif.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+')}$`);

/**
 * Refus d'éditer un fichier, ou `null` si l'édition est permise.
 * @param {string} chemin chemin relatif à la racine du dépôt
 * @param {{ migrationExistante: (chemin: string) => boolean, migrations?: string, skillsRecopies?: string[], versionSkills?: string }} contexte
 *   `migrations` : dossier des migrations (défaut : `CHAINE.migrations`, sinon `apps/api/src/db/migrations/`)
 *   `skillsRecopies` : noms des skills recopiés (défaut : `skills` du manifeste, sinon `[]`) ; vide, rien n'est protégé
 *   `versionSkills` : version de la copie (défaut : `version` du manifeste, sinon `?`)
 */
export function refusEdition(
  chemin,
  {
    migrationExistante,
    migrations = CHAINE.migrations ?? 'apps/api/src/db/migrations/',
    skillsRecopies = Array.isArray(MANIFESTE_SKILLS?.skills) ? MANIFESTE_SKILLS.skills : [],
    versionSkills = MANIFESTE_SKILLS?.version ?? '?',
  },
) {
  const c = chemin.replace(/\\/g, '/').replace(/^\.\//, '');
  const genere = Object.keys(FICHIERS_GENERES).find((motif) => cheminDuMotif(motif).test(c));
  if (genere) return `${c} est généré : le régénérer avec « ${FICHIERS_GENERES[genere]} ».`;
  if (skillsRecopies.length > 0) {
    const skill = /^\.claude\/skills\/([^/]+)\//.exec(c)?.[1];
    const dansLaCopie = c === '.claude/skills/maj-skills.json' || (skill !== undefined && skillsRecopies.includes(skill));
    if (dansLaCopie) {
      return `${c} est une copie des skills de la chaîne (maj-skills ${versionSkills}) : elle ne se modifie pas dans ce projet. Modifier le skill dans MAJ-agency/skills ; la copie arrive par PR.`;
    }
  }
  const nom = c.split('/').pop() ?? '';
  if (/^\.env(\..+)?$/.test(nom) && nom !== '.env.example') {
    return `${c} : fichier d'environnement local, jamais édité par un agent (secrets). Modifier .env.example.`;
  }
  const dossier = migrations.replace(/\/+$/, '');
  if (c.startsWith(`${dossier}/`) && /\.(ts|sql|js|mjs)$/.test(c) && migrationExistante(c)) {
    return `${c} : une migration déjà livrée ne se modifie jamais. Créer une nouvelle migration.`;
  }
  return null;
}

/** Commandes refusées : motif → raison. */
const COMMANDES_INTERDITES = [
  [/(^|[;&|]\s*|\s)npm\s+(i|install|ci|add|uninstall|update)\b/, 'npm : le gestionnaire du projet est pnpm.'],
  [/(^|[;&|]\s*|\s)yarn(\s|$)/, 'yarn : le gestionnaire du projet est pnpm.'],
  [/\bgit\s+push\b[^;&|]*\s(--force(?!-with-lease)|-f)(\s|$)/, "git push --force : interdit (réécrit l'historique partagé). --force-with-lease sur sa propre branche seulement."],
  [/\bgit\s+(commit|push)\b[^;&|]*\s--no-verify\b/, "--no-verify : les hooks git sont le pare-feu local — corriger ce qu'ils signalent."],
  [/\bgit\s+push\b[^;&|]*[\s:](develop|main)(\s|$)/, 'pousser sur develop ou main : jamais directement, une PR passe par le capitaine de fusion.'],
  [/\bgit\s+(rebase|reset\s+--hard)\b[^;&|]*\b(origin\/)?(develop|main|sujet\/)/, 'rebase ou reset --hard sur une branche partagée : jamais ; un sujet se rafraîchit par merge (sujet.sh rafraichir).'],
];

const RAISON_DEPENDANCE =
  "Dépendance nouvelle refusée : elle n'est pas sur la ligne `Dépendances:` du ticket, lue sur le sujet (ou cette ligne ne se lit pas : origin injoignable, option qui change la source, `.npmrc` modifié, ticket hors sujet, branche sans ticket). Écris à qui a lancé ta session, ton conducteur dans un chantier : le paquet, pourquoi, ce qu'il remplace. C'est lui qui l'accorde, en complétant la ligne sur le sujet. Un paquet prévu par cette ligne passe.";

/** Options de pnpm suivies d'une valeur, qu'il ne faut pas prendre pour un paquet. */
const OPTIONS_A_VALEUR = new Set(['--filter', '-F', '--dir', '-C', '--reporter', '--loglevel', '--store-dir', '--modules-dir', '--lockfile-dir', '--network-concurrency', '--child-concurrency']);

/**
 * Nom d'un paquet sans sa version : `leaflet@1.9.4` → `leaflet`, `@types/leaflet@^1` → `@types/leaflet`.
 * Seule une version ou une étiquette se retire : un alias ou une source (`leaflet@npm:autre`,
 * `x@github:…`, `x@file:…`) garde la spécification entière, qu'aucune ligne `Dépendances:` ne porte.
 */
export const nomDuPaquet = (specification) => {
  const arobase = specification.indexOf('@', specification.startsWith('@') ? 1 : 0);
  if (arobase < 0) return specification;
  const version = specification.slice(arobase + 1);
  return /^[\w.^~<>=*|+-]*$/.test(version) ? specification.slice(0, arobase) : specification;
};

/**
 * Options de `pnpm add` qui ne changent ni la source ni la cible de l'installation : seules celles-ci
 * laissent passer un paquet prévu. `--registry`, `--config.*`, `--global`, `-C`/`--dir` (qui lit le
 * `.npmrc` d'un autre dossier)… sont toujours refusées.
 */
const OPTIONS_SANS_RISQUE = new Set(['-D', '--save-dev', '-P', '--save-prod', '-O', '--save-optional', '-E', '--save-exact', '--save-peer', '-w', '--workspace-root', '--filter', '-F', '--prefer-offline', '--offline']);

/** Chaque ajout de la commande (`pnpm add`, `pnpm install <paquet>`) : `{ paquets, options }`. */
function ajouts(code) {
  const commandes = code.replace(/\d*(>>?|<)&?\s*[^\s;&|]*/g, ' ').split(/[;&|\n]+/);
  return commandes.flatMap((commande) => {
    const mots = commande.trim().split(/\s+/);
    let i = mots.findIndex((mot) => /(^|\/)pnpm$/.test(mot));
    if (i < 0) return [];
    const positionnels = [];
    // Ce qui précède pnpm (`npm_config_registry=… pnpm`, `env …`) peut changer la source.
    const options = i > 0 ? ['(préfixe)'] : [];
    for (i++; i < mots.length; i++) {
      if (!mots[i].startsWith('-')) positionnels.push(mots[i]);
      else {
        options.push(mots[i].split('=')[0]);
        if (OPTIONS_A_VALEUR.has(mots[i])) i++;
      }
    }
    const [sousCommande, ...paquets] = positionnels;
    return ['add', 'i', 'install'].includes(sousCommande) && paquets.length > 0 ? [{ paquets: paquets.map(nomDuPaquet), options }] : [];
  });
}

/**
 * Paquets qu'ajoute la commande (`pnpm add <paquet>`, `pnpm install <paquet>`), noms sans version.
 * Un chemin, une URL ou un alias reste tel quel : il ne figure dans aucune ligne `Dépendances:`.
 */
export const paquetsAjoutes = (code) => ajouts(code).flatMap(({ paquets }) => paquets);

/** Vrai si la commande ajoute un paquet (`pnpm add <paquet>`, `pnpm install <paquet>`). */
export const ajouteUneDependance = (code) => paquetsAjoutes(code).length > 0;

/**
 * Paquets que le ticket prévoit : sa ligne d'en-tête `Dépendances:` (avant la première section),
 * noms entre accents graves ou nus, séparés par des virgules, jusqu'à un ` — ` ou ` # ` de commentaire.
 * `—` ou ligne absente → `[]`.
 */
export function lireDependances(texteDuTicket) {
  const enTete = (texteDuTicket ?? '').split(/^## /m)[0];
  const ligne = (/^Dépendances:[ \t]*(.*)$/m.exec(enTete)?.[1] ?? '').split(/\s[—#]\s/)[0];
  return ligne
    .split(',')
    .map((nom) => nom.replace(/`/g, '').trim())
    .filter((nom) => nom && !/^[—–-]+$/.test(nom))
    .map(nomDuPaquet);
}

/** La commande sans son texte libre : corps de heredoc et chaînes entre guillemets. */
export function sansTexte(commande) {
  return commande
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g, '<<heredoc')
    .replace(/'[^']*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');
}

const RAISON_PUSH_SUJET =
  "un sujet ne se pousse jamais à la main, quelle que soit la branche : seul sujet.sh y écrit (demarrer, rafraichir, fusionner, livrer, carte). Sans ce refus, une session écrirait elle-même la ligne `Dépendances:` qui l'autorise. Pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";
const RAISON_PUSH_ILLISIBLE =
  "git push dont la destination ne se lit pas (variable, substitution, motif, --all, --mirror) : elle pourrait viser un sujet. Écris le refspec en clair ; pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";

/** La commande sans ses corps de heredoc ni ses guillemets : un refspec cité se lit comme un refspec nu. */
function sansGuillemets(commande) {
  return commande.replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g, '<<heredoc').replace(/["']/g, '');
}

/** Options de `git` placées avant la sous-commande et suivies d'une valeur (`git -C .. push`). */
const OPTIONS_GIT_A_VALEUR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix']);
/** Options de `git push` suivies d'une valeur séparée : cette valeur n'est ni le remote ni un refspec. */
const OPTIONS_PUSH_A_VALEUR = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);

/**
 * Chaque `git push` de la commande, `git` nu ou par son chemin (`/usr/bin/git`), avec ou sans options
 * (`git -C . push`, `git -c x=y push`), derrière n'importe quel préfixe (`timeout 5 git push`), dans
 * un sous-shell ou une substitution (`(…)`, `$(…)`, accents graves) : ses refspecs, c'est-à-dire les
 * positionnels après le remote (tous, si `--repo` porte le remote), et `tout` pour `--all`,
 * `--mirror` ou `--branches`. Les guillemets sont retirés d'abord : `"HEAD:sujet/x"` vise le même sujet
 * que `HEAD:sujet/x`. Seul le premier `git` d'un segment compte : `git commit -m "… git push …"` n'est
 * pas un push.
 */
function pushs(commande) {
  return sansGuillemets(commande)
    .replace(/`/g, '$(')
    .split(/[;&|\n()]+/)
    .flatMap((segment) => {
      const mots = segment.trim().split(/\s+/);
      const i = mots.findIndex((mot) => /(^|\/)git$/.test(mot));
      if (i < 0) return [];
      let j = i + 1;
      while (j < mots.length && mots[j].startsWith('-')) j += OPTIONS_GIT_A_VALEUR.has(mots[j]) ? 2 : 1;
      if (mots[j] !== 'push') return [];
      const positionnels = [];
      let tout = false;
      let remoteEnOption = false;
      for (let k = j + 1; k < mots.length; k++) {
        const mot = mots[k];
        if (!mot.startsWith('-')) {
          positionnels.push(mot);
          continue;
        }
        if (/^--(all|mirror|branches)$/.test(mot)) tout = true;
        if (/^--repo(=|$)/.test(mot)) remoteEnOption = true;
        if (OPTIONS_PUSH_A_VALEUR.has(mot)) k++;
      }
      return [{ refspecs: remoteEnOption ? positionnels : positionnels.slice(1), tout }];
    });
}

/** La branche distante qu'écrit un refspec ; `HEAD` ou `@` seuls poussent la branche courante. */
function destination(refspec, brancheCourante) {
  const cible = refspec.replace(/^\+/, '').split(':').pop() ?? '';
  return cible === 'HEAD' || cible === '@' ? (brancheCourante() ?? '') : cible;
}

/**
 * Vrai si un `git push` de la commande a pour destination une branche de sujet : `HEAD:sujet/x`,
 * `HEAD:refs/heads/sujet/x`, `sujet/x` seul, cités ou non, ou `HEAD` depuis une branche `sujet/…`.
 * Un sujet ne s'écrit que par `sujet.sh` (que le hook ne voit pas, il lance un script) : sans ce
 * refus, une session écrirait elle-même, sur le sujet, la ligne `Dépendances:` qui l'autorise (faille
 * relevée en contre-revue, puis en revue de sécurité : la première version ne refusait que depuis une
 * branche de ticket, et laissait passer un refspec entre guillemets, `git -C`, `git` par son chemin,
 * une autre branche courante, ou `git` derrière un préfixe comme `timeout 5`).
 */
export function pousseSurUnSujet(commande, brancheCourante = () => null) {
  return pushs(commande).some(({ refspecs }) => refspecs.some((refspec) => /^(refs\/heads\/)?sujet\//.test(destination(refspec, brancheCourante))));
}

/**
 * Vrai si un `git push` de la commande a un refspec qu'on ne peut pas lire : variable ou
 * substitution, destination en motif (`refs/heads/*`), ou `--all`, `--mirror`, `--branches`.
 */
export function pushIllisible(commande) {
  return pushs(commande).some(
    ({ refspecs, tout }) => tout || refspecs.some((refspec) => /[$`]/.test(refspec) || /[*?[{]/.test(destination(refspec, () => null))),
  );
}

/** Vrai si un `git push` de la commande n'a aucun refspec : il pousse la branche courante vers son amont. */
export function pushSansRefspec(commande) {
  return pushs(commande).some(({ refspecs }) => refspecs.length === 0);
}

/**
 * Décision sur une commande shell : `{ decision: 'refuser', raison }`, ou `null`. Le hook ne demande
 * jamais rien à un humain : ce qu'il ne laisse pas passer, il le refuse et dit quoi faire.
 * @param {{ dependancesPrevues?: () => string[] | null, brancheCourante?: () => string | null }} [contexte]
 *   Tout `git push` vers un `sujet/…` est refusé, quelle que soit la branche courante : un sujet ne
 *   s'écrit que par `sujet.sh`, sans quoi la session écrirait elle-même la ligne qui l'autorise. Un
 *   `git push` sans refspec, ou vers `HEAD`, depuis une branche `sujet/…` (`brancheCourante`, lue
 *   une fois au plus) l'est aussi ; un refspec illisible (variable, substitution, motif, `--all`)
 *   l'est aussi.
 *   `dependancesPrevues` : paquets de la ligne `Dépendances:` du ticket de la branche, lue sur le
 *   sujet (`null` si introuvable) ; appelée seulement si la commande ajoute un paquet. Une commande
 *   passe sans question quand chacun de ses paquets y figure et qu'aucune option ne change la source
 *   (`--registry`, `--config.*`) ; un seul paquet absent ou une telle option, et elle est refusée.
 */
export function decisionCommande(commande, { dependancesPrevues = () => null, brancheCourante = () => null } = {}) {
  const code = sansTexte(commande);
  for (const [motif, raison] of COMMANDES_INTERDITES) if (motif.test(code)) return { decision: 'refuser', raison };
  let branche;
  const courante = () => (branche === undefined ? (branche = brancheCourante()) : branche);
  if (pousseSurUnSujet(commande, courante)) return { decision: 'refuser', raison: RAISON_PUSH_SUJET };
  if (pushSansRefspec(commande) && (courante() ?? '').startsWith('sujet/')) return { decision: 'refuser', raison: RAISON_PUSH_SUJET };
  if (pushIllisible(commande)) return { decision: 'refuser', raison: RAISON_PUSH_ILLISIBLE };
  const liste = ajouts(code);
  if (liste.length === 0) return null;
  const sansRisque = liste.every(({ options }) => options.every((o) => OPTIONS_SANS_RISQUE.has(o)));
  const prevues = sansRisque ? dependancesPrevues() : null;
  const paquets = liste.flatMap((a) => a.paquets);
  if (Array.isArray(prevues) && paquets.every((p) => prevues.includes(p))) return null;
  return { decision: 'refuser', raison: RAISON_DEPENDANCE };
}

/** Un fichier que le hook d'après-édition passe à Prettier puis ESLint. */
export const lintable = (chemin) =>
  /\.(ts|tsx|mjs|js)$/.test(chemin) && !/(^|\/)(node_modules|dist|\.next|\.expo|coverage|\.turbo)\//.test(chemin);
