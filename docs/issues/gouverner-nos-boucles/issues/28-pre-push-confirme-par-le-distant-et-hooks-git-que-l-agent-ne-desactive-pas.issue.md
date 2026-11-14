# Le pre-push ne se laisse plus dire « rien de neuf » par une ref fabriquée ni ne passe aux bancs les variables du capitaine, et les hooks d'agent refusent qu'on désactive les hooks git, correctif du plugin

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — le gabarit du hook, les règles et les tests sont donnés entiers ou en remplacements exacts, joués sur une copie jetable (voir « Où ») ; rien n'est à concevoir. La revue passe `/security-review`.
Blocked by: 27 (même fichier `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs` et son banc, même phrase de `references/CONTENU.md:13` et de `references/fragments/claude-md-fusion.md:10`)
Dépendances: —
Fichiers chauds: `skills/monorepo/socle-monorepo/references/husky/pre-push`, `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `.claude-plugin/plugin.json`

## Le besoin

Relevé le 2026-11-14 par deux relectures de sécurité d'un projet qui pose le socle 7.5.0. Deux trous dans le pare-feu local, que ce ticket ferme ; le ticket 29 traite les trois autres constats des mêmes relectures (capitaine et chemins sensibles). L'architecte y ajoute une défense en profondeur contre la fuite d'environnement du capitaine vers les bancs (remède principal : ticket 30, `depot-jouet.mjs`, fusionné par #87).

1. **Le `pre-push` du gabarit se laisse dire « rien de neuf ».** Pour juger qu'un commit est déjà connu du distant, il lance `git rev-list -n 1 "$sha" --not --remotes`. `--remotes` compte toute ref locale sous `refs/remotes/*`, de n'importe quel distant, même fabriquée sur place : `git update-ref refs/remotes/leurre/x HEAD` (ou `git fetch . HEAD:refs/remotes/origin/x`) puis `git push` fait sortir le hook en 0, sans `pnpm run check`.
2. **`HUSKY=0`, `core.hooksPath` et d'autres formes sautent les hooks git sans que le hook d'agent le refuse.** `garde-commandes` ne refuse que `--no-verify` écrit en toutes lettres juste après `git commit` ou `git push`.
3. **Le pre-push passe aux contrôles qu'il lance les variables du capitaine.** `passer.sh` s'exécute sous `PASSER_OUTILS`, `boucle.sh` exporte `BOUCLE_COPIE` et `BOUCLE_VERROU_PID` (et relance avec `BOUCLE_SAUTEES`, `BOUCLE_ATTENTE`) ; le push du capitaine lance le pre-push, qui lance `pnpm run check`, donc les bancs du projet : un banc qui joue `passer.sh` ou `boucle.sh` hériterait des outils, de la copie et du verrou du capitaine.

Les règles du produit, intangibles :

> jamais `--no-verify`, jamais de push forcé ni de réécriture, jamais de fusion avec un contrôle exigé rouge, jamais de test sauté ou assoupli, jamais de push sur la branche par défaut

Quand le ticket est fait : le pre-push ne conclut « rien de neuf » que pour des commits connus des refs de suivi **du distant visé** et **confirmés par ce distant** (`git ls-remote --heads`) ; une ref fabriquée, un distant nommé par son URL, un distant injoignable font contrôler ; les variables du capitaine sont retirées de l'environnement avant les contrôles, `PRE_PUSH_REFS` reste. `garde-commandes` refuse toute commande qui désactive les hooks git (affectation de `HUSKY` ou de `GIT_CONFIG_PARAMETERS`/`GIT_CONFIG_COUNT` en tête de commande, `core.hooksPath` ou `include.path` par `-c`, `--config-env` ou écrits par `git config`, valeur vide comprise, `--no-verify` abrégé, derrière `git -C`, une ligne continuée, dans une substitution ou pour `git pull`, `git commit -n`, `git am -n`) et `git update-ref` vers `refs/remotes/`. Aucune commande que les skills font taper ne change de décision, `echo HUSKY=0`, `grep HUSKY=0` et `--no-verify-signatures` passent ; une écriture interdite **citée entre guillemets** dans une autre commande est refusée, par prudence (limite écrite, décision 5).

## Où

Base : `origin/main` à `ea7ea67` (#87 : tickets 25, 26 et 30 fusionnés), plugin **7.6.0**, **435 tests**. Lignes relues sur ce commit (le ticket 30 n'a touché aucun fichier de ce ticket) ; la session relève les lignes sur `origin/main` d'alors (le ticket 27 sera passé) et retrouve chaque ancrage par son texte (§ « Ancrages »). `A` abrège `skills/chaine/socle-chaine-de-production/references/agent`, `R` abrège `skills/chaine/socle-chaine-de-production/references`, `H` abrège `skills/monorepo/socle-monorepo/references/husky`.

### Les faits, à la source

- **`H/pre-push:20-38`** (posé chez un projet en `.husky/pre-push`, inchangé depuis 7.5.0) : `rien_de_neuf` fait, pour chaque commit, `neuf=$(git rev-list -n 1 "$sha" --not --remotes 2>/dev/null) || return 1` (`:30`). Le nom du distant (`$1`) n'est pas lu. `:42` : `unset GIT_DIR GIT_INDEX_FILE`, rien d'autre, avant `pnpm run check`.
- **Variables du capitaine** : `skills/chaine/fusionner/scripts/passer.sh:55` (`PASSER_OUTILS=… exec bash "$copie"`), `boucle.sh:88` (`export BOUCLE_COPIE`), `:155` (`export BOUCLE_VERROU_PID=$$`), `:202` (`BOUCLE_SAUTEES=… BOUCLE_ATTENTE=… exec bash "$outils/boucle.sh"`). `passer.sh:52` saute sa copie si `PASSER_OUTILS` est déjà posé, `boucle.sh:86` prend `BOUCLE_COPIE` pour dossier de copie, `:151` saute la prise du verrou si `BOUCLE_VERROU_PID` vaut `$$`.
- **`A/regles.mjs:71`** : seule règle des hooks git, `[/\bgit\s+(commit|push)\b[^;&|]*\s--no-verify\b/, …]`. Elle ne voit ni `git -C . commit --no-verify`, ni `--no-veri` (git accepte toute abréviation non ambiguë : `git commit --no-veri -m x` commite sans hook, joué sur git 2.43), ni `git commit -n` ni `git am -n` (formes courtes de `--no-verify`), ni `git pull --no-verify`.
- **`A/regles.mjs:168`** : `OPTIONS_GIT_A_VALEUR` ne contient pas `--config-env`, que git accepte aussi séparé (`git --config-env core.hooksPath=V status` : accepté). `pushs()` prend alors la valeur pour la sous-commande : `git --config-env user.name=N push origin HEAD:sujet/x` passe le refus des sujets.
- **Husky 9.1.7** (gabarit `socle-monorepo/references/racine/package.json:32`), fichier `husky` du paquet : `[ "${HUSKY-}" = "0" ] && exit 0` avant tout hook ; `index.js` pose `core.hooksPath` par `git config`. Donc `HUSKY=0 git commit`, `git -c core.hooksPath=/dev/null commit`, `git -c core.hooksPath= commit` (valeur vide, joué : commit sans hook), `git config core.hooksPath ""` et `git config --unset core.hooksPath` sautent les hooks ; un fichier inclus (`include.path`, `includeIf.….path`) peut poser `core.hooksPath`.
- `git grep -n "update-ref"` : seulement des bancs et le faux GitHub (`sujet/scripts/faux-gh.mjs`, sur le dépôt nu). Aucun skill ni script ne fait taper `git update-ref` à une session. `git grep -n "git config\|git -c " -- skills ':!*.test.mjs'` : `git -c core.quotepath=false diff …`, lecture. Les bancs posent `core.hooksPath` par `execFileSync` dans leur dépôt jouet : le hook n'en voit rien, il ne lit que `tool_input.command` (`A/garde-commandes.mjs`, dernière lecture de l'entrée).

### Reproduit, copie jetable

- **Pre-push** : origine nue, clone, le gabarit en `core.hooksPath` sous `sh -e`, faux `pnpm` qui journalise et sort 1. Commit neuf poussé : sortie 1, `pnpm` appelé. Même commit après `git update-ref refs/remotes/leurre/x HEAD` : **sortie 0, `pnpm` jamais appelé, la branche créée sur le distant** ; idem avec `refs/remotes/origin/leurre` et `git fetch -q . HEAD:refs/remotes/origin/leurre2`.
- **Variables** : push d'un commit neuf avec `PASSER_OUTILS`, `BOUCLE_*` dans l'environnement : le faux `pnpm` les voit toutes (test du § 2, rouge sur le gabarit de `origin/main`).
- **Hooks d'agent** : la table de la relecture (135 commandes), jouée sur `decisionCommande` de `origin/main` : toutes les formes de saut ci-dessus passent.

### Le remède, joué

Le code et les tests des § 1-4, appliqués mot pour mot à une copie de `ea7ea67`, puis `pnpm install --frozen-lockfile && pnpm test` (`TMPDIR` sous un dossier jetable) : **439 sur 439** (435 + 4). `develop.test.mjs` 10 sur 10 (8 + 2), bancs de `A/` 42 sur 42 (40 + 2). Vus rouges : les deux tests du § 2 sur le gabarit de `origin/main` ; les deux tests du § 4 sur le `regles.mjs` de `origin/main` ; les lignes ajoutées par les deux relectures (`git pull --no-verify`, `git am -n`, `core.hooksPath ""`, `include.path`, `git -C $(pwd) commit -n`, `\git commit -n`, `` `HUSKY=0 …` ``, `echo HUSKY=0`, `grep -rn HUSKY=0 .husky`, puis les trois lignes continuées, `--no-verify-signatures`, `--get-urlmatch`) rouges sur les versions précédentes de ce ticket, vertes ici.

**Contrôles de la relecture, rejoués** : `regression.mjs` (338 commandes tirées des bancs et des `SKILL.md`, 4 464 variantes) : **0 commande refusée par `origin/main` qui passe après** ; `cont.mjs` (chaque commande refusée du test, coupée en ligne continuée à chaque espace) : **0 variante continuée qui passe** sur 29 commandes ; la table de 135 ci-dessous. Les trois contrôles donnent les mêmes résultats avec la forme « `segmentsDeCommande` » du § 3 b' (utilitaire du ticket 27 recopié tel que son ticket l'écrit, `sansGuillemets` du 27 compris), et les 42 tests de `A/` y sont verts.

**Table de la relecture, rejouée sur ce remède** (135 commandes) : 121 conformes. Restent 14 laissez-passer, tous expliqués, aucun faux refus dans la table (les faux refus sur du texte cité sont une limite écrite, décision 5) :
- refusés par git lui-même, donc sans effet : `git cherry-pick --no-verify`, `git revert --no-verify` (option inexistante), `git commit --no-v`, `--no-ver` (ambigus), `git -ccore.hooksPath=…` (option inconnue), `git -c core.hooksPath commit` (« missing value »), `git config core.hookspath=x` (clé invalide) ;
- sans effet sur les hooks : `git branch -f --track x` ;
- hors de la lecture, écrits au § 5 : `git fetch . X:refs/remotes/…`, `git push . X:refs/remotes/…`, `git remote add x . && git fetch x`, `echo … | git update-ref --stdin`, `git symbolic-ref refs/remotes/origin/HEAD …` (le pre-push du § 1 les rattrape : il confirme auprès du distant), `sh -c "HUSKY=0 git commit …"`.

Les 155 commandes entre accents graves des `SKILL.md` et références du plugin : même décision avant et après. `garde-commandes.mjs` joué à la main : `HUSKY=0 git commit -m x`, `git -c core.hooksPath=/dev/null push origin feat/x`, `git update-ref refs/remotes/origin/x HEAD` sortent en 2 ; `git config --get core.hooksPath` en 0.

## Décisions

1. **Le pre-push confirme « rien de neuf » auprès du distant réel**, pas seulement par `--remotes=<distant>`, qui laisse le leurre sous `refs/remotes/origin/` (joué). Après la lecture locale, `git ls-remote --heads -- "$1"` ; chaque commit doit être atteignable depuis une branche que le distant porte réellement (`git rev-list --ignore-missing --stdin`). L'aller-retour n'a lieu **que** quand la lecture locale conclut « rien de neuf » (push de `develop.sh`, `sujet.sh ouvrir`, livraison intermédiaire) ; un push qui porte un commit neuf contrôle sans réseau de plus. Distant injoignable : on contrôle. En interactif, cette seconde connexion peut redemander une authentification (écrit dans l'en-tête du hook). La lecture locale reste, restreinte au distant visé (`--remotes="$1"`).
2. **Un distant nommé par une URL, un chemin ou un motif fait contrôler** (`case $1 in '' | */* | *:* | *[*?[]*`) : aucune ref de suivi ne le nomme. Les scripts de la chaîne poussent tous vers `origin`.
3. **Le pre-push retire les variables du capitaine avant ses contrôles** : `unset GIT_DIR GIT_INDEX_FILE PASSER_OUTILS BOUCLE_COPIE BOUCLE_SAUTEES BOUCLE_ATTENTE BOUCLE_VERROU_PID`. Aucune n'a de sens pour un contrôle ; chacune ferait jouer à un banc les outils, la copie ou le verrou du capitaine. `PRE_PUSH_REFS` reste exporté : `check:coverage --base-auto` la lit. Défense en profondeur seulement : le remède principal de la fuite est le ticket 30 (`depot-jouet.mjs`), et un banc lancé hors du pre-push (`pnpm test` à la main dans le worktree du capitaine) n'en profite pas.
4. **Le hook d'agent refuse aussi `git update-ref` vers `refs/remotes/`**, en défense en profondeur : le pre-push n'en dépend plus (décision 1), mais d'autres lecteurs se fient aux refs de suivi (`ticket-libre`, `next-id`, la couverture `--base-auto`). `git update-ref` d'une branche locale passe.
5. **Désactiver les hooks git est refusé sous toutes les formes que la commande porte** :
   - affectation de `HUSKY`, `GIT_CONFIG_PARAMETERS` ou `GIT_CONFIG_COUNT` **en tête de commande** (début, après `;`, `&`, `|`, `(`, `{`, `!`, un saut de ligne, un accent grave, un mot-clé `then`, `do`, `else`, `elif`, `if`, `while`, `until`, `time`, ou derrière `export`, `declare`, `typeset`, `readonly`, `local`, `env`, `sudo`, `nohup`, `exec`, d'autres affectations pouvant précéder), quelle que soit la valeur ; en argument (`echo HUSKY=0`, `grep -rn HUSKY=0 .husky`, `git log --grep HUSKY=0`) elle passe ;
   - `core.hooksPath`, `include.path` ou `includeIf.….path` passés par `git -c` ou `--config-env` (clé lue sans casse) avant **toute** sous-commande, ou écrits, vidés, retirés par `git config` (`""` et `''` comptent pour un argument), ou la section `core` retirée ; la lecture passe (`--get`, `--list`, la clé seule) ;
   - `--no-verify` et ses abréviations (`--no-veri…`) pour `commit`, `push`, `merge`, `am`, `rebase`, `pull` (`cherry-pick` et `revert` n'ont pas l'option) ; `-n` de `commit` et de `am`, seul ou groupé, lu avant la première option courte à valeur (`-am x` passe, `-mn` est le message « n ») ; `git push -n` (`--dry-run`) passe ;
   - `--no-verify` se reconnaît à ses abréviations exactes (`a.length >= 9 && '--no-verify'.startsWith(a)`) : `--no-verify-signatures` (`git merge`, `git pull`) passe ; `git config --get-urlmatch` est une lecture ;
   - ces appels de git sont lus derrière `git -C`, un chemin de git, `\git`, une ligne continuée (`\⏎` recollée, `\x` lu `x`, comme dans `pushs()`), et dans une substitution : les substitutions (`$(…)`, accents graves) sont extraites d'abord, de la plus intérieure, comme des segments, et leur place devient un mot (`git -C $(pwd) commit -n` garde sa sous-commande).
   Le texte libre d'un message de commit ou d'un heredoc ne compte pas pour `HUSKY=`, `--no-verify` et `-n` (`sansTexte`). **Limite, comme pour `git push` et `gh`** : `core.hooksPath`, `include.path` et `git update-ref` se lisent sur la commande sans guillemets (`sansGuillemets`) ; une forme interdite **citée entre guillemets dans une autre commande** est donc lue comme une commande et refusée (`grep -rn "git config core.hooksPath" skills`, `echo "git -c core.hooksPath=/x commit"`, `gh pr create --body "… git update-ref refs/remotes/x"`) : le hook cherche le mot, pas le programme. Un message de commit (`git commit -m "… git config core.hooksPath x"`) passe, la première commande du segment étant `git commit`. La règle `:71` reste.
6. **`--config-env` entre dans `OPTIONS_GIT_A_VALEUR`** : sans quoi la valeur est prise pour la sous-commande, et un `git --config-env x=Y push` vers un sujet échappait au refus des sujets.
7. Un seul message pour la famille des hooks (`RAISON_HOOKS_GIT`), qui dit quoi faire.
8. Ni `--no-verify`, ni test retiré, sauté ou assoupli ; aucune dépendance nouvelle. Les tests existants ne changent pas.
9. **Version : correctif (patch).** Règle : patch pour une correction, y compris quand le contenu d'un fichier déjà posé change (ici le gabarit `husky/pre-push` et `scripts/agent/regles.mjs`) ; mineure quand un skill, un gabarit ou un fichier posé s'ajoute ; majeure quand un skill change de contrat. La session prend la version de `origin/main` à l'ouverture de la PR et monte le troisième chiffre. Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre la version qui suit la sienne.
10. **La revue de la PR passe `/security-review`**, en plus de la revue de ticket. Un contournement qu'elle trouve se corrige dans `regles.mjs` ou le gabarit avec son test, ou s'écrit dans « hors de sa lecture » de `R/CONTENU.md`.

### Remèdes écartés

- **`--remotes=<distant>` seul** : laisse le leurre sous `refs/remotes/origin/` (décision 1).
- **`git ls-remote` à chaque push** : un aller-retour même quand un commit neuf rend la réponse évidente.
- **Le motif `HUSKY=` partout dans la commande** (première version de ce ticket) : refusait `echo HUSKY=0`, `grep -rn HUSKY=0 .husky`, `git log --grep HUSKY=0`.
- **Refuser tout `git config` d'une clé `core.*`** : faux refus (`core.quotepath`, lu par la revue).
- **Vider tout l'environnement du capitaine dans le pre-push** (`env -i`) : `PRE_PUSH_REFS`, `PATH`, les variables du projet en ont besoin.

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges

Sur `origin/main` (27 fait) : écrire les deux tests du § 2 et les deux tests du § 4, les jouer, les voir rouges ; **puis** seulement écrire le code.

**Pour la session, à cause de la limite de la décision 5** : ta description de PR et tes messages de commit vont citer `git config core.hooksPath`, `git update-ref refs/remotes/…` ou `HUSKY=0`. Ne les passe pas dans la commande elle-même : la description par un fichier (`gh pr create --body-file <fichier>`, ou l'outil GitHub MCP), un message de commit long par `git commit -F <fichier>`. Un refus du hook sur ta propre commande n'est pas un défaut à corriger dans `regles.mjs`.

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

### 3. `A/regles.mjs`

**a.** La ligne `const OPTIONS_GIT_A_VALEUR = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix']);` (`:168`) devient :

```js
const OPTIONS_GIT_A_VALEUR = new Set(['-C', '-c', '--config-env', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--super-prefix']);
```

**b.** Juste avant le commentaire `/**` qui ouvre ` * Décision sur une commande shell : …` (`:259-260`), insérer :

```js
const RAISON_HOOKS_GIT =
  "désactiver les hooks git (HUSKY=0, core.hooksPath ou include.path par -c, --config-env, git config ou GIT_CONFIG_*, --no-verify sous toute forme, git commit -n, git am -n) : jamais. Ils sont le pare-feu local : corriger ce qu'ils signalent. Un banc installe ses hooks dans son dépôt jouet par son script, jamais par une commande de session.";
const RAISON_REF_DE_SUIVI =
  "git update-ref vers refs/remotes/ : jamais. Une ref de suivi ne s'écrit que par git fetch ; fabriquée sur place, elle fait croire qu'un commit est déjà sur le distant (pre-push, ticket-libre, couverture du diff). `git fetch origin` d'abord.";

/**
 * Chaque appel de `git` d'un texte déjà nettoyé (`sansGuillemets` ou `sansTexte`), dans un segment
 * (`;`, `&`, `|`, sous-shell, substitution) : ses options globales (`-c x=y` en un élément), sa
 * sous-commande et ses arguments. Seul le premier `git` d'un segment compte ; `\git` est git.
 */
function appelsGit(texte) {
  // Lignes continuées recollées, `\x` lu `x` (`gi\t`, `\git`), comme dans `pushs()`. Puis les
  // substitutions, de la plus intérieure : leur contenu est un segment, leur place un mot
  // (`git -C $(pwd) commit -n` garde sa sous-commande).
  let reste = texte.replace(/\\\r?\n/g, ' ').replace(/\\(.)/g, '$1').replace(/`([^`]*)`/g, '$($1)');
  const segments = [];
  for (let avant; avant !== reste; ) {
    avant = reste;
    reste = reste.replace(/\$\(([^()]*)\)/g, (_, dedans) => (segments.push(dedans), '_'));
  }
  return [...segments, reste]
    .flatMap((morceau) => morceau.split(/[;&|\n()]+/))
    .flatMap((segment) => {
      const mots = segment.trim().split(/\s+/);
      const i = mots.findIndex((mot) => /(^\\?|\/)git$/.test(mot));
      if (i < 0) return [];
      const globales = [];
      let j = i + 1;
      for (; j < mots.length && mots[j].startsWith('-'); j++) globales.push(OPTIONS_GIT_A_VALEUR.has(mots[j]) ? `${mots[j]} ${mots[++j] ?? ''}` : mots[j]);
      return [{ globales, sous: mots[j] ?? '', args: mots.slice(j + 1) }];
    });
}

/**
 * `git config` qui écrit ou retire `core.hooksPath`, ou un `include.path` / `includeIf.….path` (un
 * fichier inclus peut poser `core.hooksPath`) ; la lecture passe : `--get`, `--list`, la clé seule.
 */
function ecritHooksPath({ sous, args }) {
  if (sous !== 'config') return false;
  if (args.some((a, k) => /^-?-?(remove|rename)-section$/.test(a) && /^core$/i.test(args[k + 1] ?? ''))) return true;
  if (!args.some((a) => /^(core\.hookspath|include\.path|includeif\..+\.path)$/i.test(a))) return false;
  if (args.some((a) => /^--(get|get-all|get-regexp|get-urlmatch|list)$|^-l$/.test(a))) return false;
  const positionnels = args.filter((a) => !a.startsWith('-'));
  if (positionnels[0] === 'get' || positionnels[0] === 'list') return false;
  return args.some((a) => /^--(unset|unset-all|add|replace-all)$/.test(a)) || positionnels.length >= 2;
}

/** Options courtes de `git commit` suivies d'une valeur : dans un groupe (`-am x`), ce qui suit est la valeur. */
const COURTES_COMMIT_A_VALEUR = 'mFcCtuS';

/**
 * Vrai si la commande désactive les hooks git : affectation de `HUSKY`, `GIT_CONFIG_PARAMETERS` ou
 * `GIT_CONFIG_COUNT` en tête de commande (préfixe, `export`, `env`…, pas un argument : `echo HUSKY=0`
 * passe), `git -c` ou `--config-env` sur `core.hooksPath` ou un `include.path`, `git config` qui les
 * écrit ou les retire (valeur vide comprise), `--no-verify` abrégé ou derrière `git -C`, `git commit -n`
 * et `git am -n` seuls ou groupés. Le texte libre (message de commit, heredoc) ne compte pas.
 */
const AFFECTE_HOOKS =
  /(?:^|[;&|({!\n`]|\b(?:then|do|else|elif|if|while|until|time)\s|\b(?:export|declare|typeset|readonly|local|env|sudo|nohup|exec)\b[^;&|(){}\n]*?\s)\s*(?:[A-Za-z_]\w*=\S*\s+)*(?:HUSKY|GIT_CONFIG_PARAMETERS|GIT_CONFIG_COUNT)=/;
export function sauteLesHooks(commande) {
  const code = sansTexte(commande);
  if (AFFECTE_HOOKS.test(code)) return true;
  // `""` vide reste un argument : `git config core.hooksPath ""` écrit une valeur vide, qui saute les hooks.
  if (appelsGit(sansGuillemets(commande.replace(/""|''/g, '_'))).some((a) => a.globales.some((g) => /^(-c\s+|--config-env[=\s]\s*)(core\.hookspath|include\.path|includeif\..+\.path)=/i.test(g)) || ecritHooksPath(a)))
    return true;
  return appelsGit(code).some(
    ({ sous, args }) =>
      (['commit', 'push', 'merge', 'am', 'rebase', 'pull'].includes(sous) && args.some((a) => a.length >= 9 && '--no-verify'.startsWith(a))) ||
      (['commit', 'am'].includes(sous) && args.some((a) => /^-[a-zA-Z]+$/.test(a) && /n/.test(a.slice(1).split(new RegExp(`[${COURTES_COMMIT_A_VALEUR}]`))[0]))),
  );
}

/** Vrai si un `git update-ref` de la commande vise une ref de suivi (`refs/remotes/…`). */
export const ecritUneRefDeSuivi = (commande) =>
  appelsGit(sansGuillemets(commande)).some(({ sous, args }) => sous === 'update-ref' && args.some((a) => a.startsWith('refs/remotes/')));
```

**b'.** **Selon ce que `main` porte au départ de la session.** Le ticket 27 doit apporter un utilitaire commun, `export function segmentsDeCommande(commande)` (rendu `{ segment, suite }[]` ; il applique `sansGuillemets`, qui recolle les lignes continuées et retire les barres obliques inverses, puis extrait les substitutions des plus intérieures aux plus extérieures et les remplace par le mot `$SUBSTITUTION`). Lire `regles.mjs` sur `origin/main` :
- **`segmentsDeCommande` y est** : remplacer toute la fonction `appelsGit` du bloc b (de `function appelsGit(texte) {` à son `}` fermant, commentaire `/** … */` au-dessus gardé) par la forme ci-dessous, qui ne refait pas l'extraction :

```js
function appelsGit(texte) {
  // `segmentsDeCommande` (ticket 27) : lignes continuées recollées, guillemets et barres obliques
  // inverses retirés, substitutions lues comme des segments, de la plus intérieure.
  return segmentsDeCommande(texte).flatMap(({ segment }) => {
    const mots = segment.trim().split(/\s+/);
    const i = mots.findIndex((mot) => /(^\\?|\/)git$/.test(mot));
    if (i < 0) return [];
    const globales = [];
    let j = i + 1;
    for (; j < mots.length && mots[j].startsWith('-'); j++) globales.push(OPTIONS_GIT_A_VALEUR.has(mots[j]) ? `${mots[j]} ${mots[++j] ?? ''}` : mots[j]);
    return [{ globales, sous: mots[j] ?? '', args: mots.slice(j + 1) }];
  });
}
```

- **il n'y est pas** : garder `appelsGit` tel que le bloc b l'écrit.

Les tests du § 4 sont les mêmes dans les deux cas ; les deux formes ont été jouées (voir « Le remède, joué »).

**c.** Dans `decisionCommande`, juste après la ligne `  for (const [motif, raison] of COMMANDES_INTERDITES) if (motif.test(code)) return { decision: 'refuser', raison };` (`:275`) :

```js
  if (sauteLesHooks(commande)) return { decision: 'refuser', raison: RAISON_HOOKS_GIT };
  if (ecritUneRefDeSuivi(commande)) return { decision: 'refuser', raison: RAISON_REF_DE_SUIVI };
```

`sansTexte` et `sansGuillemets` existent déjà dans le fichier ; aucun import ne change. `regles.mjs` et `regles.test.mjs` sont dans les exceptions du garde « aucun script du plugin ne saute un hook git » (`scripts/depot.test.mjs`, `EXCEPTIONS_SAUT`) : ils peuvent écrire `HUSKY=0` et `-c core.hooksPath`.

### 4. `A/regles.test.mjs`

Insérer juste avant `test('lireDependances : la ligne d’en-tête, accents graves ou nus, — ou absente → []'` (`:221`) ; seul `decisionCommande`, déjà importé, est utilisé (l'import, que 27 modifie, ne change pas) :

```js
test('les hooks git ne se désactivent pas : HUSKY, core.hooksPath, GIT_CONFIG_*, --no-verify sous toute forme, commit -n ; la lecture et les commandes des skills passent', () => {
  for (const commande of [
    'HUSKY=0 git commit -m x',
    'export HUSKY=0 && git push -u origin feat/x',
    'env HUSKY=0 git push origin feat/x',
    'HUSKY=0 bash scripts/chaine/passer.sh 12',
    'git -c core.hooksPath=/dev/null commit -m x',
    'git -c "core.hookspath=/dev/null" push origin feat/x',
    'git --config-env core.hooksPath=VIDE commit -m x',
    'git config core.hooksPath /dev/null',
    'git config --unset core.hooksPath',
    'git config --global core.hooksPath /tmp/vide',
    'git config --remove-section core',
    'GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -m x',
    'git commit -n -m x',
    'git commit -anm x',
    'git -C . commit --no-verify -m x',
    'git commit --no-veri -m x',
    'git push --no-verif origin feat/x',
    'git merge --no-verify origin/develop',
    'git pull --no-verify origin develop',
    'git am -n x.patch',
    'git config core.hooksPath ""',
    'git -c include.path=/tmp/x.cfg commit -m x',
    'git config include.path /tmp/x.cfg',
    'git -C $(pwd) commit -n -m x',
    '\\git commit -n -m x',
    '`HUSKY=0 git commit -m x`',
    'git commit \\\n  -n -m x',
    'git -C . \\\n  commit --no-verify -m x',
    'git config \\\n  core.hooksPath ""',
  ]) {
    const d = decisionCommande(commande);
    assert.equal(d?.decision, 'refuser', commande);
    if (!/--no-verify /.test(commande)) assert.match(d.raison, /hooks git/, commande);
  }
  for (const commande of [
    'git config user.name "Session"',
    'git config --get core.hooksPath',
    'git config core.hooksPath',
    'git config --list',
    'git commit -m "doc: HUSKY=0 et core.hooksPath sont refusés"',
    'git commit -m "fix -n option"',
    'git commit -am x',
    'git commit -q --no-edit',
    'git -c core.quotepath=false diff --name-only --no-renames origin/develop...HEAD',
    'git merge --no-edit origin/develop',
    'git push -n origin feat/x',
    'pnpm install --frozen-lockfile',
    'echo HUSKY=0',
    'grep -rn HUSKY=0 .husky',
    'git log --grep HUSKY=0',
    'if grep -q HUSKY=0 f; then echo oui; fi',
    'git config --get include.path',
    'git config --get-urlmatch core.hooksPath https://example.org',
    'git merge --no-verify-signatures origin/develop',
    'git pull --no-verify-signatures origin develop',
  ])
    assert.equal(decisionCommande(commande), null, commande);
});

test('une ref de suivi ne se fabrique pas (git update-ref vers refs/remotes/), et `git --config-env` ne cache pas un push vers un sujet', () => {
  for (const commande of ['git update-ref refs/remotes/origin/leurre HEAD', 'git -C . update-ref refs/remotes/leurre/x HEAD', 'git -C $(pwd) update-ref refs/remotes/origin/x HEAD', 'git update-ref -d refs/remotes/origin/develop'])
    assert.match(decisionCommande(commande)?.raison ?? '', /refs\/remotes/, commande);
  assert.equal(decisionCommande('git update-ref -d refs/heads/tmp'), null);
  assert.match(decisionCommande('git --config-env user.name=NOM push origin HEAD:sujet/demo')?.raison ?? '', /sujet\.sh carte/);
});
```

### 5. Les textes, mot pour mot

- `R/CONTENU.md:13`, juste avant « Cas vécu : un ticket validé au découpage, bloqué 46 h sur le paquet qu'il prévoyait. », insérer : « Il refuse encore toute façon de sauter les hooks git au-delà de `--no-verify` en toutes lettres (abrégé, derrière `git -C` ou une ligne continuée, `git pull`, `git commit -n`, `git am -n`) : une affectation de `HUSKY`, `GIT_CONFIG_PARAMETERS` ou `GIT_CONFIG_COUNT` en tête de commande (préfixe, `export`, `env` ; `echo HUSKY=0` ou `grep HUSKY=0` passent), `core.hooksPath` ou un `include.path` passés par `git -c` ou `--config-env`, ou écrits, vidés, retirés par `git config` (la lecture passe) ; et `git update-ref` vers `refs/remotes/`, car une ref de suivi fabriquée sur place ferait croire qu'un commit est déjà sur le distant. Le hook ne lit que la commande de la session : un banc qui pose ses hooks dans son dépôt jouet le fait dans son script. Échappent encore à cette lecture, pour les hooks git : `bash -c "…"`, un alias git, `GIT_CONFIG_GLOBAL` vers un fichier, `rm -rf .husky/_`, un `~/.config/husky/init.sh`, l'édition de `.husky/*` par l'outil d'édition (un chemin sensible de la revue, pas un refus), un script lancé par la session ; pour les refs de suivi : `git fetch . X:refs/remotes/…`, `git push . X:refs/remotes/…`, `git remote add x . && git fetch x`, `… | git update-ref --stdin`, `git $(…)` en sous-commande, et `git symbolic-ref refs/remotes/origin/HEAD …`, sans effet sur le pre-push, qui ne lit que des branches : le pre-push confirme « rien de neuf » auprès du distant, une ref fabriquée ne le dispense donc pas du contrôle. Comme pour `git push`, le hook cherche le mot, pas le programme : une écriture de `core.hooksPath`, d'un `include.path` ou de `refs/remotes/` citée entre guillemets dans une autre commande (`grep -rn "git config core.hooksPath" skills`, `echo "…"`, `gh pr create --body "…"`) est refusée, par prudence ; un long texte passe par un fichier (`--body-file`). La CI exigée, qui rejoue la commande du pre-push, reste la frontière. ». Sur `ea7ea67`, la ligne porte déjà, du ticket 26, « Restent hors de sa lecture : un push forcé porté par la configuration… » ; la phrase insérée ne répète pas cette tournure (« Échappent encore à cette lecture »). Texte final de ce passage sur `main` après ce ticket, 27 non compté : « … La suppression d'une branche distante (`git push origin :x`, `--delete`, `-d`) passe, sauf vers un `sujet/…`, `develop` ou `main` : le hook ne sait pas quelle branche est « à soi ». Il refuse encore toute façon de sauter les hooks git au-delà de `--no-verify` en toutes lettres (abrégé, derrière `git -C` ou une ligne continuée, `git pull`, `git commit -n`, `git am -n`) : une affectation de `HUSKY`, `GIT_CONFIG_PARAMETERS` ou `GIT_CONFIG_COUNT` en tête de commande (préfixe, `export`, `env` ; `echo HUSKY=0` ou `grep HUSKY=0` passent), `core.hooksPath` ou un `include.path` passés par `git -c` ou `--config-env`, ou écrits, vidés, retirés par `git config` (la lecture passe) ; et `git update-ref` vers `refs/remotes/`, car une ref de suivi fabriquée sur place ferait croire qu'un commit est déjà sur le distant. Le hook ne lit que la commande de la session : un banc qui pose ses hooks dans son dépôt jouet le fait dans son script. Échappent encore à cette lecture, pour les hooks git : `bash -c "…"`, un alias git, `GIT_CONFIG_GLOBAL` vers un fichier, `rm -rf .husky/_`, un `~/.config/husky/init.sh`, l'édition de `.husky/*` par l'outil d'édition (un chemin sensible de la revue, pas un refus), un script lancé par la session ; pour les refs de suivi : `git fetch . X:refs/remotes/…`, `git push . X:refs/remotes/…`, `git remote add x . && git fetch x`, `… | git update-ref --stdin`, `git $(…)` en sous-commande, et `git symbolic-ref refs/remotes/origin/HEAD …`, sans effet sur le pre-push, qui ne lit que des branches : le pre-push confirme « rien de neuf » auprès du distant, une ref fabriquée ne le dispense donc pas du contrôle. Comme pour `git push`, le hook cherche le mot, pas le programme : une écriture de `core.hooksPath`, d'un `include.path` ou de `refs/remotes/` citée entre guillemets dans une autre commande (`grep -rn "git config core.hooksPath" skills`, `echo "…"`, `gh pr create --body "…"`) est refusée, par prudence ; un long texte passe par un fichier (`--body-file`). La CI exigée, qui rejoue la commande du pre-push, reste la frontière. Cas vécu : un ticket validé au découpage, bloqué 46 h sur le paquet qu'il prévoyait. La garde vaut pour des sessions de bonne foi : … ». Le ticket 27 insère sa phrase sur `gh` après « Une destination illisible (variable, substitution, motif, `--all`, `--mirror`) est refusée. » et réécrit « La garde vaut pour des sessions de bonne foi… » : deux endroits de la ligne que cette insertion ne touche pas.
- `R/CONTENU.md:25`, « le pre-push du socle (`husky/pre-push`) sort 0 quand rien de neuf ne part. » devient « le pre-push du socle (`husky/pre-push`) sort 0 quand rien de neuf ne part (chaque commit connu des refs de suivi du distant visé, puis de ses branches lues par `git ls-remote --heads` : une ref de suivi se fabrique sur place). »
- Même ligne, « suppression sans contrôle, worktree sans `GIT_DIR` » devient « suppression sans contrôle, ref de suivi fabriquée sur place ou distant nommé par son URL contrôlés, worktree sans `GIT_DIR`, variables du capitaine (`PASSER_OUTILS`, `BOUCLE_*`) retirées avant les contrôles ».
- `R/fragments/claude-md-fusion.md:10`, « `--no-verify`, le push direct » devient « `--no-verify` et toute autre façon de sauter les hooks git (`HUSKY=0`, `core.hooksPath`, `git commit -n`), le push direct ».

### 6. La version — `.claude-plugin/plugin.json:3`

Patch (décision 9).

### Ancrages, sur `ea7ea67`, et ce qu'en fera le ticket 27

Le ticket 27 est encore en correction : il déplacera notamment le traitement des barres obliques inverses (aujourd'hui dans `pushs()`, `:183-184`) dans `sansGuillemets`, et donnera une définition unique de « branche gardée » en JavaScript. Ce que cela laisse suspendu est dit dans la dernière colonne.

| Ancrage | Sur `ea7ea67` | Ce que 27 en fera (suspendu) |
| --- | --- | --- |
| `H/pre-push` (fichier entier) | inchangé depuis 7.5.0 | rien |
| `develop.test.mjs` « pre-push du socle : supprimer une branche distante ne joue rien » | `:177` | rien |
| `regles.mjs`, ligne `const OPTIONS_GIT_A_VALEUR` | `:168` | rien d'annoncé |
| `regles.mjs`, commentaire « Décision sur une commande shell » | `:260` | 27 ajoute ses fonctions à la fin, après `lintable` |
| `regles.mjs`, boucle `COMMANDES_INTERDITES` de `decisionCommande` | `:275` | 27 ajoute une ligne plus bas, après `pousseEnForce` |
| `regles.test.mjs`, « lireDependances : la ligne d’en-tête » | `:221` | 27 insère ses tests juste avant : les nôtres viennent après les siens |
| `CONTENU.md:13`, « Cas vécu : un ticket validé… » | une fois | 27 touche deux autres phrases de la ligne (§ 5) |
| `CONTENU.md:25` | une fois | rien |
| `claude-md-fusion.md:10`, « `--no-verify`, le push direct » | une fois (« refusent tout push forcé, `--no-verify`, le push direct… ») | 27 ajoute après « `develop` ou `main`, » : l'ancrage reste unique |

**Suspendu au 27** : la forme de `appelsGit` (§ 3 b ou b') dépend de la présence de `segmentsDeCommande` sur `main` ; dans les deux formes, `appelsGit` recolle lui-même ou reçoit recollées les lignes continuées, et lit `\git` comme `git` : les lignes du test du § 4 (`'\\git commit -n -m x'`, `'git -C $(pwd) commit -n -m x'`, les trois lignes continuées) le vérifient, quel que soit le `sansGuillemets` de `main`. Noms ajoutés à `regles.mjs` : `RAISON_HOOKS_GIT`, `RAISON_REF_DE_SUIVI`, `appelsGit`, `ecritHooksPath`, `COURTES_COMMIT_A_VALEUR`, `AFFECTE_HOOKS`, `sauteLesHooks`, `ecritUneRefDeSuivi` ; aucun ne croise ceux de 26 (`RAISON_PUSH_FORCE`, `pousseEnForce`) ni ceux annoncés par 27 (`brancheGardee`, `ecritParGh`, `decisionOutilGithub`, `segmentsDeCommande`, `SUBSTITUTION`…).

## Surfaces

| Surface | Preuve |
| --- | --- |
| pre-push : leurre sous `refs/remotes/`, distant par URL | `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` « pre-push du socle : une ref de suivi fabriquée sur place, ou un distant nommé par son URL, ne dispense pas du contrôle » |
| pre-push : variables du capitaine retirées, `PRE_PUSH_REFS` gardée | `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` « pre-push du socle : les contrôles ne voient pas les variables du capitaine, et voient PRE_PUSH_REFS » |
| pre-push : `develop.sh` et la suppression passent toujours sans contrôle | `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` « crée develop sous le hook pre-push du socle, qui ne joue rien : rien de neuf ne part, et la rapatrie » et « pre-push du socle : supprimer une branche distante ne joue rien », inchangés et verts |
| hooks git non désactivables, aucune commande des skills refusée | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « les hooks git ne se désactivent pas : HUSKY, core.hooksPath, GIT_CONFIG_*, --no-verify sous toute forme, commit -n ; la lecture et les commandes des skills passent » |
| refs de suivi, `--config-env` | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « une ref de suivi ne se fabrique pas (git update-ref vers refs/remotes/), et `git --config-env` ne cache pas un push vers un sujet » |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, au patch qui suit |

## Vérification

- `pnpm test` vert : le compte de `origin/main` plus 4 (sur `ea7ea67` : 435 + 4). `git diff origin/main --stat -- '*.test.mjs'` ne montre que `develop.test.mjs` et `regles.test.mjs` ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend 0.
- À la main, depuis la racine du plugin : `echo '{"tool_input":{"command":"HUSKY=0 git commit -m x"}}' | node skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs; echo $?` affiche la raison et `2` ; avec `echo HUSKY=0` ou `git config --get core.hooksPath`, rien et `0`.
- Revue : revue de ticket, puis `/security-review` sur la branche ; leurs sections dans le corps de la PR.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, commite sous les hooks (jamais `--no-verify`), ouvre sa PR hors brouillon **sans poser `à-fusionner`** (`Label: contre-revue`), et écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- Les autres constats des mêmes relectures (renvois falsifiables, tête gardée, chemins sensibles du gabarit) : ticket 29.
- La fuite d'environnement du capitaine vers les bancs lancés hors du pre-push : ticket 30 (`depot-jouet.mjs`, fusionné).
- Les faux refus d'une forme interdite citée entre guillemets dans une autre commande (décision 5) : même limite que pour `git push` et `gh` ; la lever demanderait un vrai analyseur du shell.
- Ce que le hook ne lit pas (§ 5, « Échappent encore à cette lecture ») ; la frontière est la CI exigée et, pour les branches, la protection côté GitHub (recommandation du ticket 27).
- Les dépôts de projet : reposer `.husky/pre-push` et `scripts/agent/` est leur affaire ; un `.husky/pre-push` propre au projet qui garde `--not --remotes` garde le trou.

## Comments

- 2026-11-14 — Instruit sur `8c670e5` (plugin 7.5.0) : trous reproduits (pre-push : sortie 0 sous trois leurres ; `decisionCommande` : 17 commandes qui passent).
- 2026-11-14 — Relu par un agent neuf : « pas prêt », cinq bloquantes (`core.hooksPath ""`, `git am -n` et `git pull --no-verify`, substitutions et `\git`, `include.path`, faux refus du motif `HUSKY=`) et des mineures (« hors de lecture » complété, seconde connexion de `ls-remote`, phrase de `CONTENU.md:13` sans doublon). Correctifs du relecteur vérifiés et portés ; ajout de l'architecte (variables du capitaine retirées par le pre-push) retenu, décision 3. Version passée en patch (décision de l'architecte). Rebasé sur `b94eeb0` (plugin 7.5.2, 434 tests) : `pnpm test` 438 sur 438 ; table de la relecture rejouée : 121 sur 135 conformes, 14 laissez-passer expliqués, aucun faux refus.
- 2026-11-14 — Vérifié par le relecteur : une bloquante (les lignes continuées contournaient toutes les nouvelles règles `git` : 47 variantes) et quatre mineures (`--no-verify-signatures`, `--get-urlmatch`, faux refus sur texte cité, « Il refuse aussi » doublé dans `CONTENU.md:13`). Portées ; forme de `appelsGit` sur `segmentsDeCommande` (ticket 27) donnée et jouée. Rebasé sur `ea7ea67` (plugin 7.6.0, 435 tests) : `pnpm test` 439 sur 439 ; `regression.mjs` 0 perdue, `cont.mjs` 0 variante, table 121 sur 135.
