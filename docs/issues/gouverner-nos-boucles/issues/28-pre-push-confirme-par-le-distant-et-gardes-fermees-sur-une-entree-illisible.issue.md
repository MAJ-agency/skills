# Le pre-push ne se laisse plus dire « rien de neuf » par une ref fabriquée ni ne passe aux bancs les variables du capitaine, et les gardes de commandes et de fichiers refusent une entrée qu'elles ne lisent pas, correctif du plugin

Status: Fait — PR #91
Type: défaut
Label: contre-revue
Modèle: sonnet — le gabarit du hook, les deux gardes, leur module d'entrée, les tests et les phrases sont donnés entiers ou en remplacements exacts, joués sur une copie jetable de `cadb4e5` (voir « Vérification ») ; rien n'est à concevoir. La revue passe `/security-review`.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/monorepo/socle-monorepo/references/husky/pre-push`, `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/entree.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.test.mjs`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `.claude-plugin/plugin.json`

## Le besoin

Relevé le 2026-11-14 par deux relectures de sécurité d'un projet qui pose le socle 7.5.0, puis à la contre-relecture de la PR 89. Ce ticket ferme trois trous du pare-feu local. **Il ne touche ni `regles.mjs` ni `regles.test.mjs`** : décision de l'architecte après la PR 89, on n'ajoute plus de motifs au lecteur de commandes. Les hooks git que l'agent désactive (`HUSKY=0`, `core.hooksPath`…), `git update-ref refs/remotes/…` et `git push origin :` vont au ticket 34, qui attend le découpage en mots du ticket 33.

1. **Le `pre-push` du gabarit se laisse dire « rien de neuf ».** Pour juger qu'un commit est déjà connu du distant, il lance `git rev-list -n 1 "$sha" --not --remotes`. `--remotes` compte toute ref locale sous `refs/remotes/*`, de n'importe quel distant, même fabriquée sur place. `git update-ref refs/remotes/leurre/x HEAD` (ou `git fetch . HEAD:refs/remotes/origin/x`), puis `git push`, fait sortir le hook en 0 sans `pnpm run check`. Le hook ne lit pas non plus le nom du distant (`$1`) : un distant nommé par son URL, un distant injoignable passent de même.
2. **Le pre-push passe aux contrôles qu'il lance les variables du capitaine.** `passer.sh` se relance sous `PASSER_OUTILS`, `boucle.sh` exporte `BOUCLE_COPIE` et `BOUCLE_VERROU_PID` et se relance avec `BOUCLE_SAUTEES` et `BOUCLE_ATTENTE`. Le push du capitaine lance le pre-push, qui lance `pnpm run check`, donc les bancs du projet : un banc qui joue `passer.sh` ou `boucle.sh` hérite des outils, de la copie et du verrou du capitaine. Le remède principal est fait (ticket 30, `depot-jouet.mjs` retire ces variables) ; ceci est la défense en profondeur que le ticket 30 laissait à part (sa décision 4).
3. **`garde-commandes` et `garde-fichiers` n'échouent pas fermés sur une entrée illisible.** `lireEntree` rend `{}` sur une entrée vide ou un JSON illisible ; `garde-commandes` lit alors la commande `''` et sort en 0, `garde-fichiers` ne trouve aucun chemin et sort en 0. Un `tool_input` sans le champ jugé, ou un champ d'un autre type (un nombre, un tableau), passe de même. Seul `garde-github`, depuis la PR 89, refuse une entrée qu'il ne lit pas. Les trois gardes sont déclarées `"onFailure": "block"` : une garde qui plante bloque, mais une garde qui sort en 0 sur ce qu'elle n'a pas lu laisse passer.

Les règles du produit, intangibles :

> jamais `--no-verify`, jamais de push forcé ni de réécriture, jamais de fusion avec un contrôle exigé rouge, jamais de test sauté ou assoupli, jamais de push sur la branche par défaut

Quand le ticket est fait : le pre-push ne conclut « rien de neuf » que pour des commits connus des refs de suivi **du distant visé** et **confirmés par ce distant** (`git ls-remote --heads`) ; une ref fabriquée, un distant nommé par son URL, son chemin ou un motif, un distant injoignable font contrôler ; les variables du capitaine sont retirées avant les contrôles, `PRE_PUSH_REFS` reste. `garde-commandes` et `garde-fichiers` refusent (sortie 2, raison sur la sortie d'erreur) une entrée vide, illisible, sans `tool_input` ou dont le champ jugé n'a pas le type attendu ; toute entrée légitime de leurs outils passe comme avant.

## Où

Base : `origin/main` à `cadb4e5` (PR 89 : ticket 27 fusionné), plugin **7.7.0**, **456 tests**. Lignes relues sur ce commit ; la session les relève sur `origin/main` d'alors et retrouve chaque ancrage par son texte. `A` abrège `skills/chaine/socle-chaine-de-production/references/agent`, `R` abrège `skills/chaine/socle-chaine-de-production/references`, `H` abrège `skills/monorepo/socle-monorepo/references/husky`.

### Les faits, à la source

- **`H/pre-push:20-38`**, inchangé depuis 7.5.0 (`git diff ea7ea67 cadb4e5 -- skills/monorepo/socle-monorepo/references/husky/` est vide) : `rien_de_neuf` fait, pour chaque commit, `neuf=$(git rev-list -n 1 "$sha" --not --remotes 2>/dev/null) || return 1` (`:30`). `:38` l'appelle sans argument : le nom du distant (`$1`) n'est jamais lu. `:42` : `unset GIT_DIR GIT_INDEX_FILE`, rien d'autre, avant `pnpm run check`.
- **Variables du capitaine** : `skills/chaine/fusionner/scripts/passer.sh:55` (`PASSER_OUTILS=… exec bash "$copie"`), `skills/chaine/fusionner/scripts/boucle.sh:88` (`export BOUCLE_COPIE`), `:155` (`export BOUCLE_VERROU_PID=$$`), `:202` (`BOUCLE_SAUTEES=… BOUCLE_ATTENTE=… exec bash "$outils/boucle.sh"`). `passer.sh:52` saute sa copie si `PASSER_OUTILS` est déjà posé, `boucle.sh:86` prend `BOUCLE_COPIE` pour dossier de copie, `:151` saute la prise du verrou si `BOUCLE_VERROU_PID` vaut `$$`. `skills/chaine/sujet/scripts/depot-jouet.mjs:40` (`PREFIXES_CHAINE`, ticket 30) les retire déjà pour les bancs qui passent par lui.
- **`A/entree.mjs:6-12`** : `lireEntree()` rend `JSON.parse(stdin)`, ou `{}` dans le `catch`. Une entrée `null` rend `null`.
- **`A/garde-commandes.mjs:61`** : `const commande = lireEntree().tool_input?.command ?? '';`. `decisionCommande('')` rend `null` : sortie 0. Une entrée `null` lève une `TypeError`, sortie 1 (bloquante par `onFailure`, mais pas par la garde).
- **`A/garde-fichiers.mjs:7-9`** : `relatif(entree.tool_input?.file_path ?? entree.tool_input?.notebook_path)` ; `relatif` rend `null` sur une valeur fausse, et `if (!chemin) process.exit(0)`. Un `file_path` d'un autre type qu'une chaîne lève dans `relatif` (sortie 1) ou passe (`0`, `false`).
- **`A/garde-github.mjs:41-46`** : `lireEntree() ?? {}`, puis tout `tool_name` hors des sept outils de son matcher est refusé (« entrée de hook illisible : refusé », sortie 2). C'est la forme reprise ici.
- **`apres-edition.mjs:13`** et **`fin-de-tour.mjs:16`** lisent aussi `lireEntree()` ; ils ne gardent rien (`PostToolUse`, `Stop`) et ne changent pas. `demarrage.mjs` n'importe que `RACINE`.

### Ce que les matchers attrapent, et la forme de leur `tool_input`

Fragment `R/settings-hooks.json` sur `cadb4e5`, et la page des hooks de Claude Code (`https://code.claude.com/docs/en/hooks`, lue le 2026-11-14) : un matcher fait de lettres, chiffres, `_`, `-`, espaces, `,` et `|` est une liste de noms exacts ; tout autre caractère en fait une expression régulière JavaScript non ancrée.

| Garde | Matcher | Outils attrapés | Champ jugé | Forme, et d'où elle vient |
| --- | --- | --- | --- | --- |
| `garde-commandes` | `Bash` | `Bash` seul (nom exact) | `command` | chaîne ; la page des hooks : `command`, `description`, `timeout`, `run_in_background`. Toute entrée `Bash` légitime porte `command`. |
| `garde-fichiers` | `Edit\|Write\|MultiEdit\|NotebookEdit` | ces quatre noms exacts | `file_path`, sinon `notebook_path` | `Edit`, `Write` : `file_path`, chaîne, « toujours absolu » (page des hooks). `NotebookEdit` : `notebook_path`, chaîne obligatoire ; **établi par le schéma de l'outil, pas par la page des hooks**, qui ne donne pas son `tool_input`. `MultiEdit` : **non établi** ; l'outil n'apparaît plus dans la référence des outils (`https://code.claude.com/docs/en/tools-reference`), le matcher le garde. |
| `garde-github` | `^mcp__.+__(push_files\|…\|update_pull_request_branch)$` | les sept outils d'écriture, tout serveur | — | inchangé par ce ticket |

Aucun outil attrapé n'a d'entrée légitime sans son champ : refuser l'absence ne refuse rien de vrai. Un chemin hors du dépôt (`relatif` rend `null`) reste permis, comme aujourd'hui.

### Reproduit, copie jetable de `cadb4e5`

- **Pre-push**, sous `dash` (le `sh` de Debian, celui des tests) et sous `dash -e` (Husky), sur un dépôt jouet à faux `pnpm` : commit neuf contrôlé ; même commit sous les leurres `refs/remotes/leurre/x`, `refs/remotes/origin/leurre`, `git fetch . HEAD:refs/remotes/origin/x` : **sortie 0, `pnpm` jamais appelé** ; distant injoignable, `$1` en URL, en chemin, en motif (`o*`, `or?gin`, `[o]rigin`), commençant par `-` (`-origin`, `--upload-pack=…`) ou vide : **sortie 0**.
- **Variables** : push d'un commit neuf avec `PASSER_OUTILS`, `BOUCLE_*` dans l'environnement : le faux `pnpm` les voit toutes (test du § 2, rouge sur le gabarit de `origin/main`).
- **Gardes** : `printf '' | node A/garde-commandes.mjs` sort en 0 ; de même `{"tool_input":`, `{}`, `{"tool_input":{"command":42}}`. `garde-fichiers` sort en 0 sur les mêmes et sur `{"tool_input":{"file_path":""}}`.

## Décisions

1. **Le pre-push confirme « rien de neuf » auprès du distant réel**, pas seulement par `--remotes=<distant>`, qui laisse le leurre sous `refs/remotes/origin/` (joué). Après la lecture locale, `git ls-remote --heads -- "$1"` ; chaque commit doit être atteignable depuis une branche que le distant porte réellement (`git rev-list --ignore-missing --stdin`). L'aller-retour n'a lieu **que** quand la lecture locale conclut « rien de neuf » (push de `develop.sh`, `sujet.sh ouvrir`, livraison intermédiaire) : un push qui porte un commit neuf contrôle sans réseau de plus. Distant injoignable : on contrôle. En interactif, cette seconde connexion peut redemander une authentification (écrit dans l'en-tête du hook). La lecture locale reste, restreinte au distant visé (`--remotes="$1"`).
2. **Un distant nommé par une URL, un chemin ou un motif fait contrôler** (`case $1 in '' | */* | *:* | *[*?[]*`) : aucune ref de suivi ne le nomme. Un nom qui commence par `-` n'a pas de ref de suivi non plus (joué : il contrôle), et `--` devant `"$1"` empêche `ls-remote` de le lire comme une option. Les scripts de la chaîne poussent tous vers `origin`.
3. **Le pre-push retire les variables du capitaine avant ses contrôles** : `unset GIT_DIR GIT_INDEX_FILE PASSER_OUTILS BOUCLE_COPIE BOUCLE_SAUTEES BOUCLE_ATTENTE BOUCLE_VERROU_PID`. Aucune n'a de sens pour un contrôle ; chacune ferait jouer à un banc les outils, la copie ou le verrou du capitaine. `PRE_PUSH_REFS` reste exporté : `check:coverage --base-auto` la lit. `REVUE_DIR` n'est pas retiré : aucun capitaine ne le pose, et le dépôt jouet le retire déjà. Défense en profondeur seulement : un banc lancé hors du pre-push (`pnpm test` à la main dans le worktree du capitaine) n'en profite pas ; le dépôt jouet du ticket 30 le couvre.
4. **Les gardes échouent fermées sur ce qu'elles ne lisent pas.** Une fonction de plus dans `A/entree.mjs`, `lireToolInput()`, rend l'objet `tool_input` ou `null` (entrée vide, JSON illisible, autre chose qu'un objet, `tool_input` absent ou autre chose qu'un objet). `garde-commandes` refuse si `command` n'est pas une chaîne ; `garde-fichiers` refuse si `file_path ?? notebook_path` n'est pas une chaîne non vide. La chaîne vide de `Bash` passe (elle ne lance rien), le chemin vide est refusé (`relatif('')` le prendrait pour « hors du dépôt »). Message unique de forme : « entrée de hook illisible (… attendu) : refusé », comme `garde-github`.
5. **`lireEntree` ne change pas** : `apres-edition` et `fin-de-tour` la lisent et ne gardent rien ; `garde-github` garde sa propre lecture (il n'a pas de champ unique, il juge `tool_name`). Ni `apres-edition`, ni `fin-de-tour`, ni `demarrage` ne sont touchés.
6. **Les tests des deux gardes vont dans `A/garde-commandes.test.mjs`**, pas dans un fichier nouveau : `references/agent/*` est posé tel quel chez un projet, et un fichier posé de plus ferait une version mineure (décision 8). Chaque test lance le script de la garde sur une entrée brute, dans un dépôt jouet où les quatre fichiers sont copiés, comme le banc existant.
7. Ni `--no-verify`, ni test retiré, sauté ou assoupli ; aucune dépendance nouvelle. Les tests existants ne changent pas. Rien dans `A/regles.mjs` ni `A/regles.test.mjs`.
8. **Version : correctif (patch).** Règle : patch pour une correction, y compris quand le contenu d'un fichier déjà posé change (ici le gabarit `husky/pre-push` et `scripts/agent/`) ; mineure quand un skill, un gabarit ou un fichier posé s'ajoute ; majeure quand un skill change de contrat. La session prend la version de `origin/main` à l'ouverture de la PR et monte le troisième chiffre (sur `cadb4e5` : 7.7.0 → 7.7.1). Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre la version qui suit la sienne.
9. **La revue de la PR passe `/security-review`**, en plus de la revue de ticket. Un contournement qu'elle trouve dans le pre-push ou les gardes se corrige avec son test ; un contournement par la commande elle-même (motif de `regles.mjs`) va au ticket 34, pas ici.

### Remèdes écartés

- **`--remotes=<distant>` seul** : laisse le leurre sous `refs/remotes/origin/` (décision 1).
- **`git ls-remote` à chaque push** : un aller-retour même quand un commit neuf rend la réponse évidente.
- **Vider tout l'environnement dans le pre-push** (`env -i`) : `PRE_PUSH_REFS`, `PATH`, les variables du projet en ont besoin.
- **`lireEntree` qui rend `null`** : changerait `apres-edition` et `fin-de-tour`, hors de ce ticket.
- **Refuser selon `tool_name`** dans `garde-commandes` et `garde-fichiers` : les bancs existants (`garde-commandes.test.mjs`, `apres-edition.test.mjs`) envoient un `tool_input` sans `tool_name`, et le matcher a déjà filtré l'outil ; le champ jugé suffit.

## À faire, dans l'ordre

Les blocs de code ci-dessous qui commencent par une ligne vide se collent sans elle : la ligne vide du fichier suffit, Prettier refuserait la double.

### 0. Les tests d'abord, vus rouges

Sur `origin/main` : écrire les deux tests du § 2 et les deux tests du § 4, les jouer (`node --test R/scripts/github/develop.test.mjs A/garde-commandes.test.mjs`), les voir rouges (quatre `not ok` : sorties 0 au lieu de 1 ou 2, et les variables vues) ; **puis** seulement écrire le code.

### 1. `H/pre-push` : remplacer le fichier entier par

```sh
#!/usr/bin/env sh
# Garde-fou avant envoi au dépôt : miroir exact du job CI « qualite » —
# build · lint · typecheck · tests sans infrastructure · cycles · gates.
# Les suites qui exigent Postgres (`*.db.spec.ts`, script test:db) restent en
# CI, avec le service. Un hook se contourne (--no-verify) : c'est pourquoi la
# CI rejoue la même commande. Voir docs/methode/pare-feu-ci.md.
#
# Les scripts de la chaîne (capitaine, sujet, develop) poussent sous ce hook,
# jamais en le sautant. Il lit son entrée une fois, en tête : une ligne par ref
# poussée, `<ref locale> <sha local> <ref distante> <sha distant>`. Quand rien
# de neuf ne part, il n'a rien à contrôler et sort 0 : chaque ligne est une
# suppression (sha nul) ou un commit déjà connu du distant visé (`$1`), lu deux
# fois : sur ses refs de suivi (`git rev-list <sha> --not --remotes=<distant>`),
# puis sur ses branches réelles (`git ls-remote --heads`), car une ref de suivi
# se fabrique sur place (`git update-ref refs/remotes/…`, `git fetch .`). Entrée
# vide, ligne illisible, distant nommé par une URL ou un motif, distant
# injoignable, erreur de git : il contrôle. Jamais de sortie 0 par défaut.
# Limites : un commit déjà sur une branche du distant passe sans contrôle local ;
# la CI exigée le rejoue sur la PR. `git ls-remote` ouvre une seconde connexion
# au distant : en interactif, une seconde authentification peut être demandée.
PRE_PUSH_REFS=$(cat)
export PRE_PUSH_REFS

rien_de_neuf() {
  # Le distant par son nom (`origin`) : une URL ou un motif ne nomme aucune ref de suivi.
  case $1 in '' | */* | *:* | *[*?[]*) return 1 ;; esac
  lues=0
  commits=''
  while read -r locale sha ref distant reste; do
    [ -n "$locale$sha$ref$distant$reste" ] || continue
    [ -n "$distant" ] || return 1
    case $sha in
      *[!0]*) ;;
      *) lues=$((lues + 1)); continue ;;
    esac
    git cat-file -e "$sha^{commit}" 2>/dev/null || return 1
    neuf=$(git rev-list -n 1 "$sha" --not --remotes="$1" 2>/dev/null) || return 1
    [ -z "$neuf" ] || return 1
    commits="$commits $sha"
    lues=$((lues + 1))
  done <<EOF_REFS
$PRE_PUSH_REFS
EOF_REFS
  [ "$lues" -ge 1 ] || return 1
  [ -n "$commits" ] || return 0
  # Les refs de suivi disent « déjà là » : le distant le confirme, ou l'on contrôle.
  branches=$(git ls-remote --heads -- "$1" 2>/dev/null) || return 1
  for sha in $commits; do
    neuf=$(printf '%s\n' "$branches" | sed -n 's/^\([0-9a-f]\{40,\}\)[[:space:]].*/^\1/p' |
      git rev-list --ignore-missing --stdin -n 1 "$sha" 2>/dev/null) || return 1
    [ -z "$neuf" ] || return 1
  done
}
if rien_de_neuf "${1-}"; then exit 0; fi

# Sous un `git worktree`, git exporte GIT_DIR (et GIT_INDEX_FILE) au hook : les bancs qui font un
# `git init` jouet y écriraient dans le dépôt réel. Voir docs/agents/pieges.md. Les variables du
# capitaine (passer.sh, boucle.sh) ne passent pas non plus aux bancs : elles leur feraient jouer les
# outils et le verrou du capitaine. PRE_PUSH_REFS reste : la couverture du diff la lit.
unset GIT_DIR GIT_INDEX_FILE PASSER_OUTILS BOUCLE_COPIE BOUCLE_SAUTEES BOUCLE_ATTENTE BOUCLE_VERROU_PID
pnpm run check
```

Du `sh` POSIX : ni tableau, ni `local`, ni `[[`. `dash -n` le lit sans erreur.

### 2. `R/scripts/github/develop.test.mjs`

Insérer juste avant `test('pre-push du socle : supprimer une branche distante ne joue rien'` (`:177`) :

```js
test('pre-push du socle : une ref de suivi fabriquée sur place, ou un distant nommé par son URL, ne dispense pas du contrôle', () => {
  const leurres = [
    (d) => d.git('update-ref', 'refs/remotes/leurre/x', 'HEAD'),
    (d) => d.git('update-ref', 'refs/remotes/origin/leurre', 'HEAD'),
    (d) => d.git('fetch', '-q', '.', 'HEAD:refs/remotes/origin/leurre'),
  ];
  for (const [i, leurre] of leurres.entries()) {
    const d = depotJouet();
    writeFileSync(join(d.travail, 'neuf.md'), 'neuf\n');
    d.git('add', '-A');
    d.git('commit', '-q', '-m', 'chore: neuf');
    leurre(d);
    const r = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/essai'], { cwd: d.travail, env: d.env, encoding: 'utf8' });
    assert.notEqual(r.status, 0, `leurre ${i} : ${r.stderr}`);
    assert.deepEqual(pnpmJoue(d), ['run check'], `leurre ${i}`);
    assert.deepEqual(Object.keys(d.tetes()), ['refs/heads/main'], `leurre ${i}`);
  }
  // Un commit déjà sur le distant, mais le distant nommé par son URL : aucune ref de suivi ne le nomme.
  const d = depotJouet();
  const url = d.git('remote', 'get-url', 'origin');
  const sha = d.git('rev-parse', 'HEAD');
  const r = spawnSync('sh', [d.hook, url, url], { cwd: d.travail, env: d.env, input: `HEAD ${sha} refs/heads/x ${'0'.repeat(40)}\n`, encoding: 'utf8' });
  assert.equal(r.status, 1, r.stderr);
  assert.deepEqual(pnpmJoue(d), ['run check']);
});

test('pre-push du socle : les contrôles ne voient pas les variables du capitaine, et voient PRE_PUSH_REFS', () => {
  const d = depotJouet();
  const vu = join(d.racine, 'env.log');
  writeFileSync(join(d.racine, 'bin', 'pnpm'), `#!/bin/sh\nenv | grep -E '^(PASSER_OUTILS|BOUCLE_[A-Z_]+|PRE_PUSH_REFS)=' | sort >> ${JSON.stringify(vu)}\nexit 0\n`);
  writeFileSync(join(d.travail, 'neuf.md'), 'neuf\n');
  d.git('add', '-A');
  d.git('commit', '-q', '-m', 'chore: neuf');
  const capitaine = { PASSER_OUTILS: '/capitaine/outils', BOUCLE_COPIE: '/capitaine/copie', BOUCLE_SAUTEES: ' 12 ', BOUCLE_ATTENTE: ' 13 ', BOUCLE_VERROU_PID: '4242' };
  const r = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/essai'], { cwd: d.travail, env: { ...d.env, ...capitaine }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const lignes = readFileSync(vu, 'utf8').trim().split('\n');
  assert.equal(lignes.length, 2, lignes.join('\n'));
  for (const l of lignes) assert.match(l, /^PRE_PUSH_REFS=HEAD [0-9a-f]{40} refs\/heads\/essai 0{40}$/);
});
```

Le dépôt jouet de ce banc ajoute au hook la ligne `pnpm run check:coverage --base-auto` (`:64`) : d'où deux lignes au second test, une par appel de `pnpm`. `d.hook`, `d.env`, `d.racine`, `d.tetes()` et `pnpmJoue` existent déjà dans le fichier.

### 3. `A/entree.mjs`, `A/garde-commandes.mjs`, `A/garde-fichiers.mjs`

**a.** `A/entree.mjs` : juste après la fonction `lireEntree` (après son `}` fermant, `:12`), insérer :

```js

/**
 * `tool_input` de l'entrée JSON d'une garde PreToolUse, ou `null` s'il ne se lit pas : entrée vide, JSON
 * illisible, autre chose qu'un objet, `tool_input` absent ou autre chose qu'un objet. Une garde refuse sur
 * `null` : elle échoue fermée. `lireEntree`, qui rend `{}`, reste celle des hooks qui ne gardent rien.
 */
export function lireToolInput() {
  const objet = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
  const entree = lireEntree();
  return objet(entree) && objet(entree.tool_input) ? entree.tool_input : null;
}
```

**b.** `A/garde-commandes.mjs` : la ligne `import { brancheParDefaut, lireEntree, RACINE } from './entree.mjs';` (`:4`) devient `import { brancheParDefaut, lireToolInput, RACINE } from './entree.mjs';`, et la ligne `const commande = lireEntree().tool_input?.command ?? '';` (`:61`) est remplacée par :

```js
// Entrée illisible, ou `command` qui n'est pas une chaîne : refusé, la garde échoue fermée.
const commande = lireToolInput()?.command;
if (typeof commande !== 'string') {
  process.stderr.write('entrée de hook illisible (tool_input.command, une chaîne, attendue) : refusé\n');
  process.exit(2);
}
```

**c.** `A/garde-fichiers.mjs` : la ligne `import { lireEntree, relatif, RACINE } from './entree.mjs';` (`:4`) devient `import { lireToolInput, relatif, RACINE } from './entree.mjs';`, et ces deux lignes (`:7-8`) :

```js
const entree = lireEntree();
const chemin = relatif(entree.tool_input?.file_path ?? entree.tool_input?.notebook_path);
```

sont remplacées par :

```js
// Le chemin visé : `file_path` (Edit, Write, MultiEdit), `notebook_path` (NotebookEdit). Entrée illisible,
// ou chemin absent, vide ou d'un autre type : refusé, la garde échoue fermée. Hors du dépôt : permis.
const entree = lireToolInput();
const vise = entree?.file_path ?? entree?.notebook_path;
if (typeof vise !== 'string' || vise === '') {
  process.stderr.write('entrée de hook illisible (tool_input.file_path ou notebook_path, un chemin, attendu) : refusé\n');
  process.exit(2);
}
const chemin = relatif(vise);
```

La ligne suivante, `if (!chemin) process.exit(0);`, reste : un chemin hors du dépôt est permis.

### 4. `A/garde-commandes.test.mjs`

Ajouter à la fin du fichier, après le test « la sortie standard ne porte jamais permissionDecision, commande refusée ou non » ; les imports (`spawnSync`, `copyFileSync`, `mkdirSync`, `join`, `depotJouet`, `ENV`) et les aides `refuse` et `passe` existent déjà :

```js

/** Les gardes copiées dans un dépôt jouet, lancées sur une entrée brute : stdin tel quel, ou l'objet en JSON. */
function gardes() {
  const d = depotJouet();
  const agent = join(d.racine, 'outils/scripts/agent');
  mkdirSync(agent, { recursive: true });
  for (const f of ['entree.mjs', 'regles.mjs', 'garde-commandes.mjs', 'garde-fichiers.mjs']) copyFileSync(new URL(f, import.meta.url), join(agent, f));
  const brut = (garde, entree) =>
    spawnSync(process.execPath, [join(agent, `${garde}.mjs`)], {
      cwd: d.travail,
      env: { ...ENV, PATH: d.bin, CLAUDE_PROJECT_DIR: d.travail },
      input: typeof entree === 'string' ? entree : JSON.stringify(entree),
      encoding: 'utf8',
    });
  return { ...d, brut };
}
/** Entrées qu'aucune garde ne lit : vide, JSON illisible, autre chose qu'un objet, `tool_input` absent ou d'un autre type. */
const ILLISIBLES = ['', '{"tool_input":', 'null', '[]', '"Bash"', {}, { tool_name: 'Bash' }, { tool_input: null }, { tool_input: 'git push --force origin x' }, { tool_input: ['git', 'status'] }];

test('garde-commandes refuse une entrée illisible ou une commande qui n’est pas une chaîne, et laisse passer l’entrée de Bash', () => {
  const g = gardes();
  for (const entree of [...ILLISIBLES, { tool_name: 'Bash', tool_input: {} }, { tool_input: { command: 42 } }, { tool_input: { command: ['git', 'push', '--force', 'origin', 'x'] } }, { tool_input: { command: null } }, { tool_input: { cmd: 'git status' } }]) {
    const r = g.brut('garde-commandes', entree);
    refuse(r, `garde-commandes : ${JSON.stringify(entree)}`);
    assert.match(r.stderr, /entrée de hook illisible/);
  }
  passe(g.brut('garde-commandes', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git status', description: 'État', timeout: 120000, run_in_background: false } }));
  refuse(g.brut('garde-commandes', { tool_name: 'Bash', tool_input: { command: 'git push --force origin x' } }));
});

test('garde-fichiers refuse une entrée illisible ou un chemin absent, vide ou d’un autre type, et laisse passer Edit, Write, MultiEdit, NotebookEdit', () => {
  const g = gardes();
  for (const entree of [...ILLISIBLES, { tool_name: 'Write', tool_input: { content: 'x' } }, { tool_input: { file_path: 42 } }, { tool_input: { file_path: ['README.md'] } }, { tool_input: { file_path: '' } }, { tool_input: { notebook_path: {} } }]) {
    const r = g.brut('garde-fichiers', entree);
    refuse(r, `garde-fichiers : ${JSON.stringify(entree)}`);
    assert.match(r.stderr, /entrée de hook illisible/);
  }
  const dans = (chemin) => join(g.travail, chemin);
  for (const entree of [
    { tool_name: 'Edit', tool_input: { file_path: dans('README.md'), old_string: 'jouet', new_string: 'x', replace_all: false } },
    { tool_name: 'Write', tool_input: { file_path: dans('docs/a.md'), content: 'x\n' } },
    { tool_name: 'MultiEdit', tool_input: { file_path: dans('README.md'), edits: [{ old_string: 'jouet', new_string: 'x' }] } },
    { tool_name: 'NotebookEdit', tool_input: { notebook_path: dans('n.ipynb'), cell_id: 'a', new_source: 'x' } },
    { tool_name: 'Write', tool_input: { file_path: join(g.racine, 'hors-du-depot.md'), content: 'x\n' } },
  ])
    passe(g.brut('garde-fichiers', entree), entree.tool_name);
  refuse(g.brut('garde-fichiers', { tool_name: 'Write', tool_input: { file_path: dans('.env'), content: 'x' } }));
  refuse(g.brut('garde-fichiers', { tool_name: 'NotebookEdit', tool_input: { notebook_path: dans('pnpm-lock.yaml'), new_source: 'x' } }));
});
```

`depotJouet` vient du `depot-jouet.mjs` du skill `tickets`, que le ticket 31 modifie (retrait des dossiers à la sortie du processus) : s'il entre d'abord, ces tests ne changent pas. Les deux dernières lignes de chaque test vérifient que les refus d'avant tiennent (push forcé ; `.env` et lockfile, ce dernier par `notebook_path`). Le `regles.mjs` copié ne trouve ni `.claude/chaine.json` ni `index-generes.json` à côté de lui : seuls le lockfile, les `.env` et le dossier de migrations par défaut sont gardés, ce qui suffit.

### 5. `R/CONTENU.md`, mot pour mot

Section `## Les hooks d'agent — \`agent/\`` (une seule ligne, `:13`) et section `## La branche \`develop\`` (`:25`) :

- `:13`, la phrase « Une entrée qu'il ne lit pas est refusée. » (à la fin du passage sur `garde-github`, juste avant « Les trois gardes de `PreToolUse` portent un `"timeout"` ») devient : « Une entrée qu'il ne lit pas est refusée ; `garde-commandes` et `garde-fichiers` de même : une entrée vide ou illisible, sans `tool_input`, ou dont le champ jugé n'est pas une chaîne (`command` ; `file_path`, ou `notebook_path` pour `NotebookEdit`, un chemin non vide) est refusée, sortie 2 et la raison sur la sortie d'erreur. `apres-edition` et `fin-de-tour`, qui ne gardent rien, lisent encore une entrée illisible comme vide. »
- `:13`, dans « Restent hors de sa lecture : … », après « des hooks git coupés par la configuration (`git -c core.hooksPath=/dev/null commit`, `git config core.hooksPath …`) ; », insérer : « une ref de suivi fabriquée sur place (`git update-ref refs/remotes/…`, `git fetch . X:refs/remotes/…`) : le pre-push ne s'y fie plus, il confirme auprès du distant, mais `ticket-libre`, `next-id` et la couverture du diff (`--base-auto`) la lisent encore ; ». La phrase qui suit (« une PR reciblée vers une branche gardée… ») ne change pas.
- `:13`, « `garde-commandes.test.mjs` éprouve la lecture du ticket sur un dépôt jouet, » devient « `garde-commandes.test.mjs` éprouve la lecture du ticket sur un dépôt jouet et l'entrée illisible de `garde-commandes` et de `garde-fichiers`, ».
- `:25`, « et le pre-push du socle (`husky/pre-push`) sort 0 quand rien de neuf ne part. » devient « et le pre-push du socle (`husky/pre-push`) sort 0 quand rien de neuf ne part (chaque commit connu des refs de suivi du distant visé, puis de ses branches lues par `git ls-remote --heads` : une ref de suivi se fabrique sur place). »
- `:25`, la fin « suppression sans contrôle, worktree sans `GIT_DIR`). » devient « suppression sans contrôle, ref de suivi fabriquée sur place ou distant nommé par son URL contrôlés, worktree sans `GIT_DIR`, variables du capitaine (`PASSER_OUTILS`, `BOUCLE_*`) retirées avant les contrôles). Limites du pre-push : un commit déjà sur une branche du distant passe sans contrôle local, la CI exigée le rejoue sur la PR ; la confirmation ouvre une seconde connexion au distant, et en interactif une seconde authentification peut être demandée ; quand le distant a un `pushurl` distinct de son URL de lecture, la confirmation lit l'URL de lecture, pas celle où part le push ; les variables du capitaine ne sont retirées que pour ses contrôles, pas pour un banc lancé à la main (le dépôt jouet des bancs les retire lui-même) ; un hook sauté (`HUSKY=0`, `core.hooksPath`) ne joue rien du tout. La frontière reste la CI exigée. »

Les passages de `:13` qui disent déjà hors de lecture `git am -n`, `git pull --no-verify`, `HUSKY=0`, `git -C . commit --no-verify` et `core.hooksPath` restent tels quels : le ticket 34 les fermera.

### 6. La version — `.claude-plugin/plugin.json:3`

Patch (décision 8). Rien d'autre ne change dans ce fichier.

### Ce qui ne change pas

`A/regles.mjs`, `A/regles.test.mjs`, `A/garde-github.mjs`, `A/apres-edition.mjs`, `A/fin-de-tour.mjs`, `A/demarrage.mjs`, `R/settings-hooks.json`, `R/fragments/claude-md-fusion.md`, `passer.sh`, `boucle.sh`, `depot-jouet.mjs`.

## Surfaces

| Surface | Preuve |
| --- | --- |
| pre-push : leurre sous `refs/remotes/`, distant par URL | `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` « pre-push du socle : une ref de suivi fabriquée sur place, ou un distant nommé par son URL, ne dispense pas du contrôle » |
| pre-push : variables du capitaine retirées, `PRE_PUSH_REFS` gardée | `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` « pre-push du socle : les contrôles ne voient pas les variables du capitaine, et voient PRE_PUSH_REFS » |
| pre-push : `develop.sh` et la suppression passent toujours sans contrôle | `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` « crée develop sous le hook pre-push du socle, qui ne joue rien : rien de neuf ne part, et la rapatrie » et « pre-push du socle : supprimer une branche distante ne joue rien », inchangés et verts |
| `garde-commandes` fermée sur une entrée illisible, l'entrée de `Bash` passe | `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.test.mjs` « garde-commandes refuse une entrée illisible ou une commande qui n’est pas une chaîne, et laisse passer l’entrée de Bash » |
| `garde-fichiers` fermée sur une entrée illisible, les entrées de ses quatre outils passent | `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.test.mjs` « garde-fichiers refuse une entrée illisible ou un chemin absent, vide ou d’un autre type, et laisse passer Edit, Write, MultiEdit, NotebookEdit » |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, au patch qui suit |

## Vérification

Joué le 2026-11-14 dans une copie jetable de `cadb4e5`, §§ 1-6 appliqués mot pour mot, `TMPDIR` sous un dossier jetable :

- `pnpm install --frozen-lockfile && pnpm test` : **460 sur 460** (456 + 4). Sur `cadb4e5` sans rien : 456 sur 456.
- Les quatre tests nouveaux sur le code de `origin/main` (gabarit, `entree.mjs` et les deux gardes remis) : **quatre `not ok`** — les deux gardes sortent en 0 sur l'entrée vide (attendu 2), le pre-push sort en 0 sous le premier leurre (attendu non nul), le faux `pnpm` voit les variables du capitaine (12 lignes au lieu de 2). Avec le code : verts.
- Pre-push seul, sous `dash` et sous `dash -e`, 23 scénarios sur un dépôt jouet à faux `pnpm` : commit neuf, deux lignes dont une neuve, entrée vide → contrôle ; commit déjà sur le distant, deux lignes connues, suppression seule, tag annoté ou léger d'un commit connu, distant nommé `amont` qui porte le commit → sortie 0 sans contrôle ; les trois leurres, distant injoignable, `$1` en URL, en chemin relatif, en motif (`o*`, `or?gin`, `[o]rigin`), commençant par `-` (`-origin`, `--upload-pack=touch PWNED`, aucun fichier `PWNED` créé) ou vide → contrôle. Sur le gabarit de `origin/main`, ces dix derniers sortaient en 0.

Pour la session :

1. Le § 0, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus 4**. `git diff origin/main --stat -- '*.test.mjs'` ne montre que `develop.test.mjs` et `garde-commandes.test.mjs` ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend 0 ; `git diff origin/main --stat -- '*regles*'` est vide.
2. À la main, depuis la racine du plugin : `printf '' | node skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs; echo $?` affiche « entrée de hook illisible … » et `2` ; `echo '{"tool_input":{"command":"git status"}}' | node skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs; echo $?` n'affiche que `0`. De même pour `garde-fichiers.mjs` avec `printf ''` (2) et `{"tool_input":{"file_path":"/tmp/x"}}` (0).
3. `dash -n skills/monorepo/socle-monorepo/references/husky/pre-push` : rien.
4. Revue : revue de ticket, puis `/security-review` sur la branche ; leurs sections dans le corps de la PR.
5. La PR vise `main`, titre `fix(chaine): pre-push confirmé par le distant, gardes fermées sur une entrée illisible (plugin <version>)`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, commite sous les hooks (jamais `--no-verify`), ouvre sa PR hors brouillon **sans poser `à-fusionner`** (`Label: contre-revue`), et écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- **Les hooks git que l'agent désactive** (`HUSKY=0`, `core.hooksPath`, `include.path`, `GIT_CONFIG_*`, `--config-env`, `git am -n`, `git pull --no-verify`, `git -C . commit --no-verify`), **`git update-ref` vers `refs/remotes/`** et **`git push origin :`** : ticket 34, après le découpage en mots du ticket 33. Ce ticket n'ajoute aucun motif à `regles.mjs`.
- `lireEntree` dans `apres-edition` et `fin-de-tour` : ils ne gardent rien ; une entrée illisible y reste lue comme vide.
- La fuite d'environnement du capitaine vers un banc lancé hors du pre-push : ticket 30 (`depot-jouet.mjs`, fusionné).
- Les dépôts de projet : reposer `.husky/pre-push` et `scripts/agent/` est leur affaire ; un `.husky/pre-push` propre au projet qui garde `--not --remotes` garde le trou.

## Comments

- 2026-11-14 — **Fait** : PR 91, fusionnée `436c96e`, plugin 7.8.1. Contre-relue non conforme une fois : une ref de remplacement (`git replace`, `refs/replace/`, `GIT_REPLACE_REF_BASE`) faisait encore sauter le contrôle et le commit neuf arrivait sur le distant ; corrigé dans ce ticket par `export GIT_NO_REPLACE_OBJECTS=1` et un leurre de plus au test ; `pushInsteadOf` et greffes locales ajoutés aux limites. Restent au ticket 34 : `git push origin :`, `--config-env`, et ce qui passe par un hook sauté.
- 2026-11-14 — Instruit sur `8c670e5` (plugin 7.5.0) : trous reproduits (pre-push : sortie 0 sous trois leurres).
- 2026-11-14 — Deux relectures (agent neuf, puis le relecteur) sur la version longue, rebasée sur `ea7ea67` (439 sur 439) ; leurs correctifs du pre-push et de ses tests sont repris ici sans changement.
- 2026-11-14 — Relu par un agent neuf : prêt, aucune bloquante. Rejoué : 460 sur 460, quatre rouges sans le code, pre-push sous `dash -eu` sur 30 cas dont leurres, URL, motifs, `--upload-pack`, distant injoignable ; gardes fermées sur entrée vide, illisible, `{}`, `null`. Portés : la limite du `pushurl` dans `CONTENU.md`, la ligne vide de tête des blocs. Non vérifié par lui : `/security-review`, Husky réel, charge réelle de `NotebookEdit`.
- 2026-11-14 — **Réduit** après la PR 89 (décision de l'architecte : plus de motifs dans `regles.mjs`) et réécrit sur `cadb4e5` (plugin 7.7.0, 456 tests). Gardé : le pre-push et ses deux tests, appliqués tels quels (le gabarit et `develop.test.mjs` n'ont pas bougé depuis `ea7ea67`). Ajouté : les gardes de commandes et de fichiers fermées sur une entrée illisible (relevé à la contre-relecture de la PR 89), les limites du pre-push dans `CONTENU.md`. Parti au ticket 34 : tout ce qui touchait `regles.mjs`. Joué : 460 sur 460, quatre rouges sans le code, 23 scénarios du pre-push sous `dash`.
