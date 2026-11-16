/**
 * Règles des hooks Claude Code du projet (ADR « chaîne de production »), en fonctions pures : les
 * scripts de hook (garde-fichiers, garde-commandes, garde-github) les appliquent, et `regles.test.mjs` les éprouve
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
 * @param {{ migrationExistante: (chemin: string) => boolean, migrations?: string }} contexte
 *   `migrations` : dossier des migrations (défaut : `CHAINE.migrations`, sinon `apps/api/src/db/migrations/`)
 */
export function refusEdition(
  chemin,
  {
    migrationExistante,
    migrations = CHAINE.migrations ?? 'apps/api/src/db/migrations/',
  },
) {
  const c = chemin.replace(/\\/g, '/').replace(/^\.\//, '');
  const genere = Object.keys(FICHIERS_GENERES).find((motif) => cheminDuMotif(motif).test(c));
  if (genere) return `${c} est généré : le régénérer avec « ${FICHIERS_GENERES[genere]} ».`;
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
  [/(^|[;&|]\s*|\s)npm\s+(i|install|ci|add|uninstall|update)\b/i, 'npm : le gestionnaire du projet est pnpm.'],
  [/(^|[;&|]\s*|\s)yarn(\s|$)/i, 'yarn : le gestionnaire du projet est pnpm.'],
  [/\bgit\s+(commit|push)\b[^;&|]*\s--no-verify\b/i, "--no-verify : les hooks git sont le pare-feu local — corriger ce qu'ils signalent."],
  // Ses abréviations (`--no-veri`, `--no-verif`) ; `--no-verify-signatures`, option de `merge` et `pull`, passe.
  [/\bgit\s+(commit|push|merge|am|rebase)\b[^;&|]*\s--no-veri(fy?)?(?![\w-])/i, "--no-verify : les hooks git sont le pare-feu local — corriger ce qu'ils signalent."],
  // `git commit -n` est `--no-verify`, seul ou groupé (`-nm`, `-an`).
  [/\bgit\s+commit\b[^;&|]*\s-[a-z]*n[a-z]*(\s|$)/i, "-n de git commit (--no-verify) : les hooks git sont le pare-feu local — corriger ce qu'ils signalent."],
  [/\bgit\s+push\b[^;&|]*[\s:](develop|main)(\s|$)/i, 'pousser sur develop ou main : jamais directement, une PR passe par le capitaine de fusion.'],
  [/\bgit\s+(rebase|reset\s+--hard)\b[^;&|]*\b(origin\/)?(develop|main|sujet\/)/i, 'rebase ou reset --hard sur une branche partagée : jamais ; un sujet se rafraîchit par merge (sujet.sh rafraichir).'],
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
const RAISON_NOM_ILLISIBLE =
  "nom de branche illisible (segment . ou .., %, barre finale, caractère de contrôle, blancs autour) : un client d'URL le résout, il pourrait viser un sujet, develop ou main. Écris le nom en clair ; pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";
const RAISON_PUSH_GARDEE =
  "pousser sur develop, main ou la branche par défaut, sous quelque graphie que ce soit (refs/heads/develop, heads/main, majuscules) : jamais directement, une PR passe par le capitaine de fusion.";
const RAISON_PUSH_FORCE =
  "push forcé (--force, --force-with-lease, --force-if-includes, -f, refspec +…) : jamais, sur aucune branche, la sienne comprise (il réécrit un historique publié). Une branche à reprendre se refait : branche neuve, `git cherry-pick`, nouvelle PR.";
const RAISON_PUSH_ILLISIBLE =
  "git push dont la destination ne se lit pas (variable, substitution, motif, --all, --mirror) : elle pourrait viser un sujet. Écris le refspec en clair ; pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";

/**
 * La commande sans ses corps de heredoc, ses guillemets ni ses barres obliques inverses, lignes continuées
 * recollées : un refspec cité se lit comme un refspec nu, `\git` comme `git`, `gh pr \⏎ merge` comme
 * `gh pr merge`. Tous les lecteurs de commandes (`pushs`, `ecritParGh`) partent de ce texte.
 */
function sansGuillemets(commande) {
  return commande
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g, '<<heredoc')
    .replace(/\\\r?\n/g, ' ')
    .replace(/["'\\]/g, '');
}

/** Mot qui remplace une substitution dans la commande englobante : il porte `$`, donc se lit illisible. */
const SUBSTITUTION = '$SUBSTITUTION';
/** Le texte où chaque `$(…)`, parenthèses équilibrées (non fermée : jusqu'à la fin), devient `SUBSTITUTION`. */
function sansSubstitutionsParenthesees(texte) {
  let sortie = '';
  for (let i = 0; i < texte.length; i++) {
    if (texte[i] !== '$' || texte[i + 1] !== '(') {
      sortie += texte[i];
      continue;
    }
    let j = i + 1;
    for (let profondeur = 0; j < texte.length; j++) {
      if (texte[j] === '(') profondeur++;
      else if (texte[j] === ')' && --profondeur === 0) break;
    }
    sortie += SUBSTITUTION + (/^[^\s;&|()]/.test(texte.slice(j + 1)) ? ' ' : '');
    i = j;
  }
  return sortie;
}

/**
 * Le dernier découpage : `decisionCommande` lit la même commande six fois (sujet, branche gardée, push
 * nu, force, illisible, `gh`) ; `sansGuillemets`, dont le motif de here-doc coûte, n'y passe qu'une fois.
 */
let dernierDecoupage = { commande: null, segments: [] };

/**
 * Les segments d'une commande shell, utilitaire commun des lecteurs de commandes (`pushs`, `ecritParGh`,
 * et `appelsGit` du ticket 28) : `{ segment, suite }`, où `suite` est le texte de la source du segment à
 * partir de lui. La commande passe d'abord par `sansGuillemets` (`\git` s'y lit `git`). Chaque
 * substitution, `$(…)` ou entre accents graves, est extraite des plus intérieures aux plus extérieures et
 * lue comme une source à part, puis remplacée dans la commande englobante par `SUBSTITUTION` :
 * `git -C "$(pwd)" push origin HEAD:sujet/x` se lit `git -C $SUBSTITUTION push origin HEAD:sujet/x`.
 * Chaque source se découpe sur `;`, `&`, `|`, saut de ligne et sous-shell `( … )`.
 * @param {string} commande la commande telle que l'outil Bash la reçoit
 * @returns {readonly { segment: string, suite: string }[]} figé : le dernier découpage est gardé pour la commande suivante identique
 */
export function segmentsDeCommande(commande) {
  if (dernierDecoupage.commande === commande) return dernierDecoupage.segments;
  // Un séparateur cité n'en est pas un (`-f message="fix(api): x"`, `-c user.name="a;b"`) : la commande se lit en
  // plus avec les séparateurs et les blancs de ses textes cités neutralisés (hors texte à substitution, lu comme
  // avant). Une lecture en plus : rien de ce que la première refuse ne passe.
  const cites = commande.replace(/'[^']*'|"(?:[^"\\$`]|\\[^$`])*"/g, (cite) => cite.replace(/[;&|()\s]/g, '_'));
  const segments = Object.freeze([...lireSegments(commande), ...(cites === commande ? [] : lireSegments(cites))].map((x) => Object.freeze(x)));
  dernierDecoupage = { commande, segments };
  return segments;
}

/** Le découpage d'une lecture de `segmentsDeCommande`. */
function lireSegments(commande) {
  const decouper = (source) =>
    [...source.matchAll(/[^;&|\n()]+/g)].filter(([segment]) => segment.trim()).map(({ 0: segment, index }) => ({ segment, suite: source.slice(index) }));
  // Des accents graves échappés (`echo \`git push …\``) sont une substitution imbriquée : lus comme `$(…)` avant
  // que `sansGuillemets` retire les barres obliques inverses.
  let reste = sansGuillemets(commande.replace(/\\`([^`]*?)\\`/g, '$($1)')).replace(/`([^`]*)`/g, '$($1)');
  const segments = [];
  for (let m = /\$\(([^()]*)\)/.exec(reste); m; m = /\$\(([^()]*)\)/.exec(reste)) {
    segments.push(...decouper(m[1]));
    const apres = reste.slice(m.index + m[0].length);
    // Suivi d'une espace si un mot y est collé : `$(true)git push …` exécute `git push …`.
    reste = reste.slice(0, m.index) + SUBSTITUTION + (/^[^\s;&|()]/.test(apres) ? ' ' : '') + apres;
  }
  // Une substitution qui contient des parenthèses (`$( (pwd) )`, `$((1))`) n'est pas extraite et se découpe sur `(`
  // et `)` comme avant ; la commande englobante se lit en plus avec chacune remplacée par `SUBSTITUTION` : sans quoi
  // `git -c a.b=$((1)) push …` serait coupé avant `push`.
  const aplatie = sansSubstitutionsParenthesees(reste);
  const enPlus = aplatie === reste ? [] : decouper(aplatie);
  return [...segments, ...decouper(reste), ...enPlus];
}

/** Options de `git` placées avant la sous-commande et suivies d'une valeur (`git -C .. push`). */
const OPTIONS_GIT_A_VALEUR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix', '--attr-source']);
/** Options de `git push` suivies d'une valeur séparée : cette valeur n'est ni le remote ni un refspec. */
const OPTIONS_PUSH_A_VALEUR = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);

/**
 * Index du programme d'un segment : le premier mot que `motif` reconnaît, hors affectation (`X=/a/git`),
 * option (`--chdir=/w/git`) et valeur d'option suivie du vrai programme (`env -C /w/git git …`,
 * `sudo -u git gh …`) ; un chemin qui contient `=` (`./a=b/git`) reste un programme ; -1 sinon.
 */
function indexDuProgramme(mots, motif) {
  // Le mot suivant ne compte que s'il pourrait être un programme : `git --work-tree=/x/git push` reste `git`.
  const candidat = (mot) => motif.test(mot) && !/^(-|[A-Za-z_]\w*=)/.test(mot);
  return mots.findIndex((mot, k) => candidat(mot) && !candidat(mots[k + 1] ?? ''));
}

/** Le découpage d'avant `segmentsDeCommande`, tel quel : guillemets retirés, accents graves lus `$(`, coupé sur `(` et `)`. */
function segmentsDAvant(commande) {
  return commande
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g, '<<heredoc')
    .replace(/["']/g, '')
    .replace(/\\\r?\n/g, ' ')
    .replace(/\\(.)/g, '$1')
    .replace(/`/g, '$(')
    .split(/[;&|\n()]+/);
}

/**
 * Les index où lire le programme d'un segment : celui d'`indexDuProgramme`, et le premier mot que `exact`
 * reconnaît (la lecture d'avant, à la casse exacte), pour que rien de ce qu'elle refusait ne passe.
 */
function lecturesDuProgramme(mots, motif, exact) {
  return [...new Set([indexDuProgramme(mots, motif), mots.findIndex((mot) => exact.test(mot))])].filter((i) => i >= 0);
}

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
  if (derniersPushs.commande !== commande) derniersPushs = { commande, pushs: Object.freeze(lirePushs(commande)) };
  return derniersPushs.pushs;
}

/**
 * Les derniers `pushs` lus : `decisionCommande` les demande six fois pour la même commande (sujet, nom
 * illisible, branche gardée, push nu, force, illisible) ; la lecture, qui coûte, n'est faite qu'une fois.
 */
let derniersPushs = { commande: null, pushs: [] };

/** La lecture de `pushs`, sans mémoire. */
function lirePushs(commande) {
  // Le découpage de `segmentsDeCommande`, et en plus celui d'avant (texte qui suit une substitution lu comme un
  // segment à part : `sudo -u git $(true) git push …`), pour que rien de ce qu'il refusait ne passe.
  return [...segmentsDeCommande(commande).map(({ segment }) => segment), ...segmentsDAvant(commande)]
    .flatMap((segment) => {
      const mots = segment.trim().split(/\s+/);
      // Deux lectures du programme : la prudente, et celle d'avant (premier `git` à la casse exacte), pour que
      // rien de ce qu'elle refusait ne passe (`sudo -u GIT -H git push …`).
      return lecturesDuProgramme(mots, /(^|[/$])git$/i, /(^|\/)git$/).flatMap((i) => {
        let j = i + 1;
        while (j < mots.length && mots[j].startsWith('-')) j += OPTIONS_GIT_A_VALEUR.has(mots[j]) ? 2 : 1;
        if (mots[j]?.toLowerCase() !== 'push') return [];
        const positionnels = [];
        let tout = false;
        let remoteEnOption = false;
        let force = false;
        let illisible = false;
        for (let k = j + 1; k < mots.length; k++) {
          const mot = mots[k];
          if (/[$`]/.test(mot)) illisible = true;
          if (!mot.startsWith('-')) {
            positionnels.push(mot);
            continue;
          }
          if (/^--(all|mirror|branches)$/.test(mot)) tout = true;
          // Git accepte les abréviations non ambiguës (`--force-w`, `--force-wi`, `--force-i`) ; `--for…` les couvre
          // toutes, et refuse aussi `--forc`, que git rejette comme ambigu : prudence sans coût.
          if (/^(--for[a-z-]*(=.*)?|-[a-zA-Z]*f[a-zA-Z]*)$/.test(mot)) force = true;
          if (/^--repo(=|$)/.test(mot)) remoteEnOption = true;
          if (OPTIONS_PUSH_A_VALEUR.has(mot)) k++;
        }
        const refspecs = remoteEnOption ? positionnels : positionnels.slice(1);
        return [{ refspecs, tout, illisible, force: force || refspecs.some((refspec) => refspec.startsWith('+')) }];
      });
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
  return pushs(commande).some(({ refspecs }) => refspecs.some((refspec) => (nomDeBranche(destination(refspec, brancheCourante)) ?? '').startsWith('sujet/')));
}

/** Vrai si un `git push` de la commande vise un nom que `nomDeBranche` ne lit pas (`./feat/x`, `feat/./x`, `develop/`). */
export function pousseVersUnNomIllisible(commande, brancheCourante = () => null) {
  return pushs(commande).some(({ refspecs }) =>
    refspecs.some((refspec) => {
      const cible = destination(refspec, brancheCourante);
      return Boolean(cible) && cible !== 'HEAD' && nomDeBranche(cible) === null;
    }),
  );
}

/**
 * Vrai si un `git push` de la commande écrit une branche gardée (`brancheGardee` : sujet, `develop`,
 * `main`, branche par défaut), sous toutes ses graphies (`HEAD:refs/heads/develop`, `HEAD:heads/develop`,
 * `HEAD:DEVELOP`), ou pousse sans refspec, ou vers `HEAD`, depuis une telle branche. Une destination
 * vide (branche courante inconnue) n'est pas lue ici. `develop:feat/x` écrit `feat/x` : il passe.
 */
export function pousseSurUneBrancheGardee(commande, brancheCourante = () => null, brancheParDefaut = () => null) {
  let parDefaut;
  const defaut = () => (parDefaut === undefined ? (parDefaut = brancheParDefaut()) : parDefaut);
  // `develop`, `main` et les sujets se lisent sans la branche par défaut : elle n'est demandée que pour un autre nom.
  const gardee = (b) => Boolean(b) && b !== 'HEAD' && (brancheGardee(b) || brancheGardee(b, defaut()));
  return pushs(commande).some(({ refspecs }) =>
    refspecs.length === 0 ? gardee(brancheCourante()) : refspecs.some((refspec) => gardee(destination(refspec, brancheCourante))),
  );
}

/**
 * Vrai si un `git push` de la commande a un refspec qu'on ne peut pas lire : variable ou
 * substitution, destination en motif (`refs/heads/*`), ou `--all`, `--mirror`, `--branches`.
 */
export function pushIllisible(commande) {
  return pushs(commande).some(
    ({ refspecs, tout, illisible }) => tout || illisible || refspecs.some((refspec) => /[$`]/.test(refspec) || /[*?[{]/.test(destination(refspec, () => null))),
  );
}

/**
 * Vrai si un `git push` de la commande force : `--force`, `--force-with-lease`, `--force-if-includes`,
 * leurs abréviations (`--force-w`), avec ou sans valeur, `-f` seul ou groupé (`-uf`), ou un refspec
 * `+…`, cité ou non. Aucune branche n'en est exemptée : les règles du produit interdisent tout push forcé.
 */
export const pousseEnForce = (commande) => pushs(commande).some(({ force }) => force);

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
export function decisionCommande(commande, { dependancesPrevues = () => null, brancheCourante = () => null, brancheParDefaut = () => null } = {}) {
  const code = sansTexte(commande);
  // Aussi sur la commande aux mots dénudés : un mot cité seul (`"git"`, `$'git'`, `"--no-verify"`), des
  // guillemets vides ou une barre oblique inverse dans un mot (`g''it`, `g\it`) ne cachent pas un motif.
  const nu = sansTexte(motsDenudes(commande));
  for (const [motif, raison] of COMMANDES_INTERDITES) if (motif.test(code) || motif.test(nu)) return { decision: 'refuser', raison };
  let branche;
  const courante = () => (branche === undefined ? (branche = brancheCourante()) : branche);
  if (pousseSurUnSujet(commande, courante)) return { decision: 'refuser', raison: RAISON_PUSH_SUJET };
  if (pushSansRefspec(commande) && (courante() ?? '').startsWith('sujet/')) return { decision: 'refuser', raison: RAISON_PUSH_SUJET };
  if (pousseVersUnNomIllisible(commande, courante)) return { decision: 'refuser', raison: RAISON_NOM_ILLISIBLE };
  if (pousseSurUneBrancheGardee(commande, courante, brancheParDefaut)) return { decision: 'refuser', raison: RAISON_PUSH_GARDEE };
  if (pousseEnForce(commande)) return { decision: 'refuser', raison: RAISON_PUSH_FORCE };
  if (ecritParGh(commande)) return { decision: 'refuser', raison: RAISON_GH_ECRIT };
  if (pushIllisible(commande)) return { decision: 'refuser', raison: RAISON_PUSH_ILLISIBLE };
  const liste = ajouts(code);
  if (liste.length === 0) return null;
  const sansRisque = liste.every(({ options }) => options.every((o) => OPTIONS_SANS_RISQUE.has(o)));
  const prevues = sansRisque ? dependancesPrevues() : null;
  const paquets = liste.flatMap((a) => a.paquets);
  if (Array.isArray(prevues) && paquets.every((p) => prevues.includes(p))) return null;
  return { decision: 'refuser', raison: RAISON_DEPENDANCE };
}

/**
 * La commande aux mots dénudés, pour les motifs de `COMMANDES_INTERDITES` : lignes continuées recollées,
 * barres obliques inverses et guillemets vides retirés, un mot cité seul (sans blanc) sans ses guillemets ni
 * le `$` d'une citation ANSI-C (`$'git'`). Un texte cité qui porte un blanc reste un texte.
 */
function motsDenudes(commande) {
  return commande
    .replace(/\\\r?\n/g, ' ')
    .replace(/\\/g, '')
    .replace(/(['"])\1/g, '')
    .replace(/\$?(['"])([^\s'"$`]+)\1/g, '$2');
}

/** Un fichier que le hook d'après-édition passe à Prettier puis ESLint. */
export const lintable = (chemin) =>
  /\.(ts|tsx|mjs|js)$/.test(chemin) && !/(^|\/)(node_modules|dist|\.next|\.expo|coverage|\.turbo)\//.test(chemin);

/**
 * Nom d'une branche tel que GitHub le lira, ou `null` s'il porte des blancs autour (`" develop"`) :
 * barres doublées réduites, préfixes `refs/`, `heads/`, `remotes/` et `origin/` retirés (dans le doute,
 * `origin/develop` se lit `develop`), en minuscules.
 */
export function nomDeBranche(branche) {
  const brute = String(branche ?? '');
  if (brute.trim() !== brute) return null;
  // Un segment `.` ou `..`, un `%`, un caractère de contrôle ou une barre finale : un client d'URL le résout ou le décode
  // (`./develop` se lit `develop` chez GitHub) ; le nom ne se lit pas, il est gardé.
  if (brute.split('/').some((s) => s === '.' || s === '..') || /[%\x00-\x1f\x7f]|\/$/.test(brute)) return null;
  return brute
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '')
    .replace(/^((refs|heads|remotes|origin)\/)+/i, '')
    .toLowerCase();
}

/**
 * Branche gardée : un sujet (`sujet/…`), `develop`, `main`, la branche par défaut du dépôt, ou un nom
 * vide ou entouré de blancs. Une session n'y écrit jamais elle-même : le capitaine par ses scripts, le
 * conducteur par `sujet.sh`. Une seule définition pour `git push`, `gh` et les outils GitHub.
 */
export function brancheGardee(branche, brancheParDefaut = null) {
  const b = nomDeBranche(branche);
  if (!b) return true;
  const parDefaut = nomDeBranche(brancheParDefaut);
  return b.startsWith('sujet/') || b === 'develop' || b === 'main' || (Boolean(parDefaut) && b === parDefaut);
}

const RAISON_OUTIL_ECRIT =
  "écrire par un outil GitHub (push_files, create_or_update_file, delete_file, create_branch) sur un sujet, develop, main ou la branche par défaut : jamais. Un sujet ne s'écrit que par sujet.sh, sans quoi une session écrirait elle-même la ligne `Dépendances:` qui l'autorise ; develop et main ne reçoivent que des PR fusionnées par le capitaine. Écrire sur sa branche de travail, puis ouvrir une PR ; pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";
const RAISON_OUTIL_FUSION =
  "fusionner par un outil GitHub une PR dont la base est un sujet, develop, main ou la branche par défaut, ou dont la base ne se lit pas : jamais. Le capitaine fusionne par ses scripts (passer.sh, sujet.sh fusionner), qui vérifient les contrôles exigés.";
const RAISON_OUTIL_MISE_A_JOUR =
  "mettre à jour par un outil GitHub une PR dont la tête est un sujet, develop, main ou la branche par défaut, ou dont la tête ne se lit pas : jamais, l'outil écrirait sur cette branche. Un sujet se rafraîchit par sujet.sh rafraichir (le capitaine) ; une branche de travail se met à jour par l'outil, ou par git merge puis un push ordinaire.";
const RAISON_GH_ECRIT =
  "écrire par `gh` une branche, un fichier ou une règle de branche (gh api en écriture vers git/refs, contents, merges, merge-upstream, pulls/<n>/merge ou update-branch, branches/<b>/protection ou rename, rulesets, une mutation GraphQL ou une requête illisible, gh pr merge, gh pr update-branch, gh pr close --delete-branch, gh repo sync, gh alias set ou import) : jamais à la main. On pousse sa branche par git push, une PR se fusionne par le capitaine (passer.sh, sujet.sh fusionner), un sujet ne s'écrit que par sujet.sh ; une PR se met à jour par l'outil update_pull_request_branch, ou par git merge puis un push ordinaire.";

/** Outils GitHub d'écriture, par nom court (après le dernier `__`) : leur paramètre `branch` porte la branche visée. */
export const OUTILS_GITHUB_ECRITURE = ['push_files', 'create_or_update_file', 'delete_file', 'create_branch'];
/** Outils GitHub de fusion, par nom court : ils ne portent que `pullNumber`, la base se lit à part. */
export const OUTILS_GITHUB_FUSION = ['merge_pull_request', 'enable_pr_auto_merge'];
/** Outil GitHub de mise à jour d'une PR, par nom court : il écrit sur la tête de la PR, qui se lit à part. */
export const OUTILS_GITHUB_MISE_A_JOUR = ['update_pull_request_branch'];
/** Les sept outils que garde `garde-github`, et rien d'autre. */
export const OUTILS_GITHUB_GARDES = [...OUTILS_GITHUB_ECRITURE, ...OUTILS_GITHUB_FUSION, ...OUTILS_GITHUB_MISE_A_JOUR];

/**
 * Décision sur un appel d'outil MCP (hook `garde-github`) : `{ decision: 'refuser', raison }` ou `null`.
 * Le serveur se reconnaît au nom court de l'outil, quel que soit son préfixe (`mcp__github__`, ou un
 * serveur nommé autrement par le projet). Une branche absente, vide ou qui n'est pas un texte se lit
 * comme gardée : l'API écrirait sur la branche par défaut.
 * @param {string} outil nom complet de l'outil (`mcp__github__push_files`)
 * @param {Record<string, unknown>} entree `tool_input`
 * @param {{ brancheParDefaut?: string | null, refsDeLaPr?: (entree: Record<string, unknown>) => { tete: string, base: string } | null }} [contexte]
 *   `refsDeLaPr` : la tête et la base de la PR visée (`null` si elles ne se lisent pas), appelée pour une
 *   fusion ou une mise à jour seulement ; une fusion regarde la base, une mise à jour la tête.
 */
export function decisionOutilGithub(outil, entree = {}, { brancheParDefaut = null, refsDeLaPr = () => null } = {}) {
  const court = String(outil).split('__').pop();
  if (OUTILS_GITHUB_ECRITURE.includes(court)) {
    const branche = entree?.branch;
    if (typeof branche === 'string' && branche !== '' && nomDeBranche(branche) === null) return { decision: 'refuser', raison: RAISON_NOM_ILLISIBLE };
    return typeof branche !== 'string' || brancheGardee(branche, brancheParDefaut) ? { decision: 'refuser', raison: RAISON_OUTIL_ECRIT } : null;
  }
  if (OUTILS_GITHUB_FUSION.includes(court)) {
    return brancheGardee(refsDeLaPr(entree)?.base, brancheParDefaut) ? { decision: 'refuser', raison: RAISON_OUTIL_FUSION } : null;
  }
  if (OUTILS_GITHUB_MISE_A_JOUR.includes(court)) {
    return brancheGardee(refsDeLaPr(entree)?.tete, brancheParDefaut) ? { decision: 'refuser', raison: RAISON_OUTIL_MISE_A_JOUR } : null;
  }
  return null;
}

/** Options de `gh api` suivies d'une valeur séparée. */
const OPTIONS_GH_API_A_VALEUR = new Set(['-X', '--method', '-f', '--raw-field', '-F', '--field', '-H', '--header', '--input', '-q', '--jq', '-t', '--template', '--hostname', '--cache', '-p', '--preview']);
/** Routes REST qui écrivent une branche, un fichier ou une règle de branche, en écriture. */
const CHEMIN_GH_ECRIT = /(^|\/)(git\/refs(\/|$)|contents(\/|$)|merges$|merge-upstream$|pulls\/[^/]+\/(merge|update-branch|ccr\/auto_merge)$|branches\/[^/]+\/protection(\/|$)|branches\/.+\/rename$|rulesets(\/|$))/;

/**
 * Vrai si la commande écrit une branche, un fichier ou une règle de branche par `gh` : `gh pr merge`,
 * `gh pr close -d`, `gh repo sync`, `gh alias set` et `gh alias import` (avec ou sans `-R`/`--repo`,
 * avant ou après la sous-commande) ; `gh api` vers une route de `CHEMIN_GH_ECRIT`, ou vers un chemin
 * illisible (variable, substitution, encodé), avec une méthode autre que GET (explicite, ou implicite : un
 * champ `-f`/`-F` ou `--input` fait un POST) ; `gh api graphql` (ou la route `/graphql`) dont la requête,
 * cherchée dans la commande à partir de `gh`, est une mutation ou ne se lit pas (`query=@fichier`,
 * `--input`, variable).
 */
export function ecritParGh(commande) {
  return segmentsDeCommande(commande).some(({ segment, suite }) => {
    // `-i` est la seule option booléenne courte de `gh api` : `-iX PUT`, `-iXPUT`, `-ifk=v` se lisent `-X`, `-f`.
    const mots = segment.trim().split(/\s+/).map((mot) => mot.replace(/^-i+(?=[XfF])/, '-'));
    // Seul le premier programme du segment compte : `git commit -m "gh pr merge 3"` n'est pas une fusion.
    // `$'gh'` se lit `$gh` sans ses guillemets ; un système de fichiers insensible à la casse lance `GH`.
    return lecturesDuProgramme(mots, /(^|[/$])(gh|git)$/i, /(^|\/)(gh|git)$/).some((i) => {
      if (!/(^|[/$])gh$/i.test(mots[i])) return false;
      // Positionnels après `gh`, sans `-R`, `--repo`, `--hostname` ni leur valeur : `gh -R o/r pr merge 3` est `pr merge`.
      const pos = [];
      for (let k = i + 1; k < mots.length; k++) {
        if (mots[k] === '-R' || mots[k] === '--repo' || mots[k] === '--hostname') k++;
        else if (!mots[k].startsWith('-')) pos.push(mots[k]);
      }
      if ((pos[0] === 'pr' && (pos[1] === 'merge' || pos[1] === 'update-branch')) || (pos[0] === 'repo' && pos[1] === 'sync')) return true;
      if (pos[0] === 'alias' && (pos[1] === 'set' || pos[1] === 'import')) return true;
      if (pos[0] === 'pr' && pos[1] === 'close' && mots.some((mot) => /^(-[a-zA-Z]*d[a-zA-Z]*|--delete-branch)(=.*)?$/.test(mot))) return true;
      if (pos[0] !== 'api') return false;
      let chemin = null;
      const positionnels = [];
      let methode = null;
      let champs = false;
      for (let k = mots.indexOf('api', i + 1) + 1; k < mots.length; k++) {
        const mot = mots[k];
        if (!mot.startsWith('-')) {
          chemin ??= mot;
          positionnels.push(mot);
          continue;
        }
        const [option, valeurJointe] = mot.split(/=(.*)/s);
        const valeur = valeurJointe ?? (OPTIONS_GH_API_A_VALEUR.has(option) ? mots[++k] : undefined);
        if (option === '-X' || option === '--method') methode = String(valeur ?? '').toUpperCase();
        else if (/^-X./.test(mot)) methode = mot.slice(2).toUpperCase();
        // `-fcle=valeur` : un champ collé à son option fait un POST comme `-f cle=valeur`.
        if (['-f', '--raw-field', '-F', '--field', '--input'].includes(option) || /^-[fF]./.test(option)) champs = true;
      }
      // Route lue comme gh l'enverra : hôte, barres de tête, de fin, doublées et `./` retirés, requête et fragment
    // (`#…`, jamais envoyé) coupés, en minuscules.
      const routeDe = (c) => c.replace(/^[a-z]+:\/\/[^/]+/i, '').replace(/\/(\.\/)+/g, '/').replace(/\/{2,}/g, '/').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '').toLowerCase();
      const route = routeDe(chemin ?? '');
      // Un champ cité à blancs placé avant la route (`-f message="add file" … repos/…/contents/a`) laisse des mots
      // devant elle : chaque positionnel qui a la forme d'une route (`repos/…`, `graphql`, une URL) compte aussi.
      const routes = [route, ...positionnels.slice(1).filter((p) => /^(\/?repos\/|\/?graphql$|[a-z]+:\/\/)/i.test(p)).map(routeDe)];
      // La mutation se cherche de `gh` à la fin de la commande : ni avant (un message de commit), ni bornée au
      // segment (la découpe sur `(` couperait `query A { a(x: 1) } mutation B { … }`).
      if (routes.some((r) => /(^|\/)graphql$/.test(r)) && (/\bmutation\b/i.test(suite) || /query=@|--input|[$]/.test(segment))) return true;
      if (/(^|\/)graphql$/.test(route)) return false;
      const ecrit = (methode ?? (champs ? 'POST' : 'GET')) !== 'GET';
      // Un chemin qui ne se lit pas (variable, substitution, encodé, segment `..`) pourrait viser une branche : refusé en écriture.
      return ecrit && chemin !== null && (/[$%]/.test(chemin) || /(^|\/)\.\.(\/|$|[?#])/.test(chemin) || routes.some((r) => CHEMIN_GH_ECRIT.test(r)));
    });
  });
}
