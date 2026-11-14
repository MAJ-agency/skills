# `sujet.sh demarrer` ne prescrit plus de rebase ni de push forcé, et le hook d'agent refuse tout push forcé, version corrective du plugin

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — la cause est établie, le remède, les tests et les textes sont donnés entiers ou mot pour mot, joués sur une copie jetable (voir « Où ») ; rien n'est à concevoir.
Blocked by: 25 (même ligne `version` de `.claude-plugin/plugin.json`, et `skills/chaine/fusionner/SKILL.md` touché par les deux)
Dépendances: —
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/sujet.test.mjs`, `skills/chaine/sujet/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/fusionner/SKILL.md`, `.claude-plugin/plugin.json`

## Le besoin

Rapporté le 2026-11-14 par un projet, sur le plugin 7.5.0 (`8c670e5`). Une session lance `bash scripts/chaine/sujet.sh demarrer <ticket>` sur une branche de ticket partie de `develop`, déjà poussée, alors que le ticket déclare un sujet. `demarrer` refuse (sortie 4) et affiche la consigne :

```
git rebase --onto origin/<sujet> origin/develop && git push --force-with-lease
```

Cette consigne est inapplicable dans un projet qui pose les hooks d'agent du même plugin : `garde-commandes` refuse la commande entière (la règle « rebase ou reset --hard sur une branche partagée » mord sur `origin/sujet/` et `origin/develop` cités dans la ligne). Et elle contredit les règles du produit, intangibles :

> jamais `--no-verify`, jamais de push forcé ni de réécriture, jamais de fusion avec un contrôle exigé rouge, jamais de test sauté ou assoupli, jamais de push sur la branche par défaut

Le projet qui l'a relevé documente chez lui une suite sans réécriture : une nouvelle branche partie du sujet, puis `cherry-pick` des commits.

L'instruction a trouvé un second écart de même nature : le hook `garde-commandes` **laisse passer** `git push --force-with-lease` et un refspec `+…`, et son message de refus du `--force` prescrit lui-même « `--force-with-lease` sur sa propre branche seulement ». Le plugin enseigne ainsi aux sessions un push forcé que les intangibles interdisent.

Quand le ticket est fait : `demarrer` laisse la branche intacte et affiche une suite qui reprend ses commits sur une branche neuve partie du sujet, sans rebase ni push forcé, suite que les hooks laissent passer et qui, jouée telle quelle, aboutit ; le hook refuse tout push forcé (`--force`, `--force-with-lease`, `--force-if-includes`, `-f` seul ou groupé, refspec `+…`, cité ou non), sur toute branche ; aucun texte du plugin ne prescrit plus de réécriture ; le plugin est en version corrective.

## Où

Base : `origin/main` à `8c670e5` (#84), plugin **7.5.0**, **428 tests** (la commande de `package.json` « test », jouée le 2026-11-14 sur une copie de `origin/main`, tous verts). Toutes les lignes ci-dessous sont relues sur ce commit. `S` abrège `skills/chaine/sujet`, `A` abrège `skills/chaine/socle-chaine-de-production/references/agent`.

### La cause, établie par la lecture et reproduite

- **`S/scripts/sujet.sh:363-374`** (`demarrer`) : trois cas. Branche déjà partie du sujet (`:363-366`) : rien. Branche sans commit propre (`:367-369`) : `git switch -q -C "$courante" "origin/$branche"`, la branche repart du sujet. Sinon (`:370-373`), le bloc cité plus bas (§ 2).
- `S/scripts/sujet.sh:11-12` (en-tête) : « une branche qui a déjà des commits partis de develop reçoit la commande de rebase ».
- **`A/regles.mjs:74`** : `[/\bgit\s+(rebase|reset\s+--hard)\b[^;&|]*\b(origin\/)?(develop|main|sujet\/)/, 'rebase ou reset --hard sur une branche partagée : jamais ; …']` refuse la consigne affichée.
- **`A/regles.mjs:71`** : `[/\bgit\s+push\b[^;&|]*\s(--force(?!-with-lease)|-f)(\s|$)/, "git push --force : interdit (réécrit l'historique partagé). --force-with-lease sur sa propre branche seulement."]` : le lookahead exempte `--force-with-lease`, la forme `-uf` et le refspec `+HEAD:x` ne sont pas vus, et le message prescrit le push forcé.
- `A/regles.test.mjs:28` fige cette exemption : `assert.equal(decisionCommande('git push --force-with-lease origin feat/x'), null);`.
- `skills/chaine/fusionner/SKILL.md:83` (« Ne jamais ») : « Rebaser ou pousser en force la branche d'une autre session. » : sous-entend qu'on pousse en force la sienne.

**Reproduit** dans une copie jetable de `origin/main` (`git archive`), avec le dépôt jouet du banc (`S/scripts/depot-jouet.mjs`) : spec qui déclare `Sujet: sujet/demo`, sujet qui a avancé d'un commit, branche `feat/spec-all-dem-1-01-travail` partie de `develop` avec deux commits, poussée (`-u`). `sujet.sh demarrer SPEC_ALL_DEM-1.01` sort en **4** et affiche, mot pour mot :

```
feat/spec-all-dem-1-01-travail porte déjà des commits partis de develop. Pour la placer sur le sujet (branche à soi) :
  git rebase --onto origin/sujet/demo origin/develop && git push --force-with-lease
puis relancer demarrer
```

`decisionCommande` de `A/regles.mjs`, sur la même copie : la ligne de consigne est refusée (raison « rebase ou reset --hard sur une branche partagée ») ; `git push --force-with-lease`, `git push --force-with-lease=feat/x origin feat/x`, `git push origin +HEAD:feat/x` et `git push "+HEAD:feat/x"` rendent `null` (ils passent) ; `git push -f origin feat/x` est refusé.

### Toutes les consignes de réécriture du plugin, classées

`git grep -n -i "rebase\|force-with-lease\|--force\|commit --amend\|reset --hard" origin/main -- skills ':!*.test.mjs'`, complété par `git grep -n -E "switch -q -C|update-ref|push[^\n]*\s\+"` :

| Occurrence | Classement |
| --- | --- |
| `S/scripts/sujet.sh:372` (et l'en-tête `:11-12`) | **consigne donnée à une session : à corriger** (§ 2) |
| `A/regles.mjs:71`, message « `--force-with-lease` sur sa propre branche seulement » | **refus du hook qui prescrit un push forcé : à corriger** (§ 3) |
| `A/regles.mjs:74` | refus du hook qui cite la commande : légitime |
| `skills/chaine/fusionner/SKILL.md:83` | documentation qui sous-entend le push forcé de sa propre branche : **à corriger** (§ 4) |
| `S/scripts/sujet.sh:369` `git switch -q -C "$courante" "origin/$branche"` (`demarrer`, branche sans commit propre) | usage interne : déplace une branche locale qui n'apporte aucun commit absent du sujet ; rien de publié n'est réécrit, rien n'est poussé. Respecte les intangibles |
| `S/scripts/sujet.sh:425` (`mettre_a_jour_sous_pr`, capitaine) `git switch -q -C "capitaine/$n" "origin/$tete"`, `:447` `reset -q --hard` | usage interne du capitaine : branche locale jetable `capitaine/<n>` ; ce qu'il pousse (`:454`) est un commit de fusion par `pousser`, sans force, avec le sommet attendu. Respecte les intangibles |
| `S/scripts/sujet.sh:532`, `:537`, `:575` (`rafraichir`, capitaine) `switch -q -C "$branche" "origin/$branche"`, `reset -q --hard "origin/$branche"` | usage interne : remet la copie **locale** du sujet sur `origin/sujet/<nom>` avant une fusion de develop, ou après un abandon ; le push (`:572`) est un merge sans force. Respecte les intangibles |
| `skills/chaine/fusionner/scripts/passer.sh:150` `git switch -q -C "capitaine/$N"` ; `boucle.sh:62, :172`, `github.sh:96-98` (`annuler_fusion`) `reset -q --hard` | usage interne du capitaine sur sa branche locale jetable ou son worktree détaché ; rien n'est poussé en force (`github.sh:86-94`, `pousser`). Respecte les intangibles |
| `S/scripts/sujet.sh:20, :31` ; `passer.sh:9, :13, :163` ; `fusionner/references/CONTENU.md:17` ; ADR « branches de sujet » `:15` ; `S/SKILL.md:54` ; `socle-chaine-de-production/SKILL.md:35`, `references/CONTENU.md:13` | documentation qui dit « jamais de rebase » ou compare à un `rebase --onto` : légitime (`CONTENU.md:13` est retouché au § 4 pour dire « tout push forcé ») |
| `S/scripts/faux-gh.mjs:266` `update-ref` | faux GitHub du banc : légitime |

### Le remède, joué

Dans la même copie : `git switch --no-track -c feat/spec-all-dem-1-01-travail-sur-sujet origin/sujet/demo`, `git cherry-pick --no-merges origin/develop..feat/spec-all-dem-1-01-travail`, `git push -u origin feat/spec-all-dem-1-01-travail-sur-sujet`, puis `demarrer` : sortie **0**, `base=sujet/demo`, les deux commits (`feat: a`, `feat: b`) au-dessus du sujet, l'ancienne branche intacte sur origin, la branche neuve sans amont avant le `push -u` puis suivant sa propre branche distante. Avec une branche qui a fusionné develop en cours de route (commit de merge) : `--no-merges` l'écarte, le contenu propre à develop ne passe pas sur le sujet, `demarrer` sort en 0. `decisionCommande` laisse passer les trois commandes.

Tout le code et les tests des § 1-3 ont été extraits de ce ticket, blocs de code tels quels, et appliqués à une copie neuve de `origin/main` (`git archive`, puis dépôt git local pour que `scripts/depot.test.mjs` lise les fichiers suivis) : `pnpm test` (la commande « test » de `package.json`) **431 sur 431** (428 + 3). Vus rouges d'abord, sur le `sujet.sh` et le `regles.mjs` de `origin/main` : 2 échecs dans `sujet.test.mjs`, 2 dans `regles.test.mjs` (le test nouveau et la ligne `:28` retournée). La table d'essai du relecteur (36 formes de `git push`) : toutes les formes forcées lues dans la commande sont refusées (`--forc`, `--force-w`, `-fu`, `+…` cité, option après le refspec, `sudo`, `env`, `command`, tabulation), `--no-force-with-lease` passe ; restent passantes, comme écrit au § 4, les deux formes par `-c remote.origin.push=+…`, `git config remote.origin.push +…` puis `git push`, l'alias git, et les trois suppressions de branche ordinaires ; `git push -o ci.skip +HEAD:feat/x` passe aussi, mais ce n'est pas un push forcé : `+HEAD:feat/x` y tient la place du dépôt distant, et git échoue.

## Décisions

1. **`demarrer` ne fait pas le travail lui-même, même sur une branche jamais poussée.** Il laisse la branche intacte et affiche la suite. Raisons : un `cherry-pick` peut tomber en conflit et laisserait l'arbre de la session à mi-chemin, dans un script dont le contrat est « refus 4, rien n'a bougé » ; déplacer une branche qui porte des commits, même locale, écarte l'ancien sommet (le reflog seul le garde) ; « pas poussée » ne se lit pas sûrement (la branche peut l'être sous un autre nom). Le cas sans commit propre, qui ne perd rien, reste traité par `demarrer` (`:367-369`).
2. **La branche neuve s'appelle `<ancienne>-sur-sujet`.** Elle garde le slug du ticket, donc l'identifiant que lisent `identifiants.mjs` (le laissez-passer `Dépendances:` du hook) et `ticket-libre.mjs`.
3. **L'ancienne branche poussée reste, intacte.** On ne la supprime pas par un push forcé, et `demarrer` ne prescrit pas sa suppression : la PR de l'ancienne branche se ferme (outil GitHub MCP `update_pull_request`, `state: "closed"`, avec un commentaire qui cite la nouvelle PR) ; GitHub ne supprime une branche qu'à la fusion de sa PR (réglage « Automatically delete head branches »), pas à sa fermeture. Sa suppression est un geste humain, ou du ménage de fin de chantier. `git push origin --delete <branche>` (ou `:<branche>`, `-d`) n'est ni un push forcé ni une réécriture : le hook le laisse passer pour toute branche hors `sujet/…`, `develop` et `main`, car il ne sait pas quelle branche est « à soi » ; ce ticket ne le prescrit pas, et le dit dans `CONTENU.md` (§ 4).
4. **Le hook refuse tout push forcé, la branche de la session comprise** : `--force`, `--force-with-lease`, `--force-if-includes` (avec ou sans `=valeur`), `-f` seul ou groupé (`-uf`), refspec `+…` cité ou non, derrière `git -C`, un chemin de git ou un préfixe (`timeout 5`). Les abréviations comptent : git accepte toute abréviation non ambiguë d'une option longue (`--force-w`, `--forc`), d'où le motif `--for…`. La lecture passe par `pushs()` (`A/regles.mjs:180-206`), qui sait déjà retirer les guillemets et trouver le `git push` d'un segment ; la règle `:71` disparaît. Une configuration (`-c remote.origin.push=+…`, `git config`) ou un alias échappent à cette lecture : écrit dans `CONTENU.md`, sans promesse. Le refus d'un push vers un sujet garde sa raison (il est testé avant). **Le test `A/regles.test.mjs:28` change de sens** : il disait que `--force-with-lease` passe ; il dit désormais qu'il est refusé. C'est un durcissement, pas un assouplissement ; à confirmer par l'architecte (une session ne pourra plus réécrire sa propre PR après un `commit --amend` : elle ajoute un commit, le squash du capitaine les réunit).
5. Ni `--no-verify`, ni test retiré, sauté ou assoupli ; aucune dépendance nouvelle.
6. **Version : patch.** Règle du `README.md`, « Ajouter un skill », étape 4 : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat. » La session part d'un `origin/main` où le ticket 25 est entré (`Blocked by: 25` : même ligne `version`, et `skills/chaine/fusionner/SKILL.md` touché par les deux, pas à la ligne `:83`), prend la version de `origin/main` à l'ouverture de la PR et monte le troisième chiffre ; les lignes citées ici se retrouvent par leur texte.
7. **La branche neuve ne suit pas le sujet** (`git switch --no-track -c`) : sans `--no-track`, `git switch -c <neuve> origin/<sujet>` la fait suivre `origin/sujet/<nom>` jusqu'au `push -u`, et un `git push` nu viserait le sujet (refusé par le hook, mais à tort proposé). Un conflit au `cherry-pick` se règle sur place (`--continue`) ou s'abandonne (`--abort`) sans rien perdre : la consigne le dit.

### Remèdes écartés

- **Garder la consigne et autoriser le rebase de sa propre branche dans le hook** : contraire aux intangibles (réécriture, push forcé).
- **`git merge origin/<sujet>` dans la branche de travail** : la branche garderait sa base `develop` ; la PR vers le sujet porterait les commits de develop absents du sujet, que le squash du capitaine ferait entrer dans le sujet hors de `sujet.sh rafraichir`.
- **`demarrer` qui fait le `cherry-pick`** : décision 1.
- **Laisser `--force-with-lease` passer sur la branche de la session** : c'est un push forcé ; la consigne « sur sa propre branche seulement » est exactement ce que les intangibles interdisent, et le hook ne sait pas sûrement ce qui est « à soi » (la branche d'une autre session porte aussi un slug de ticket).

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges sur `origin/main`

Écrire les tests des § 1 et 3, les jouer, les voir rouges : dans `S/scripts/sujet.test.mjs`, les deux tests nouveaux échouent (le premier sur `assert.doesNotMatch` de « rebase … origin », le second sur `consigne.length` à 0) ; dans `A/regles.test.mjs`, le test nouveau échoue sur `git push -uf origin feat/x` ou `--force-with-lease`, et la ligne `:28` retournée aussi. **Puis** seulement corriger.

### 1. `S/scripts/sujet.test.mjs` : deux tests

Insérer juste avant `test("ouvrir crée le sujet par git push et ne tente aucun appel de protection"` (`:96`) :

```js
// Branche de ticket partie de develop, deux commits, déjà poussée, alors que le ticket déclare un
// sujet qui a avancé ; develop a avancé aussi, et la branche l'a fusionné (commit de merge).
const TRAVAIL = "feat/spec-all-dem-1-01-travail";
function brancheParteDeDevelop() {
  const d = sujetAvecTickets("—");
  d.git("switch", "-q", "-c", "tmp", "origin/sujet/demo");
  d.ecrire("sujet.txt", "sujet\n");
  d.commit("feat: le sujet avance");
  d.git("push", "-q", "origin", "HEAD:sujet/demo");
  d.git("switch", "-q", "-c", TRAVAIL, "origin/develop");
  d.ecrire("a.txt", "a\n");
  d.commit("feat: a");
  d.git("switch", "-q", "-c", "tmp2", "origin/develop");
  d.ecrire("develop.txt", "develop\n");
  d.commit("feat: develop avance");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", TRAVAIL);
  d.git("merge", "-q", "--no-edit", "origin/develop");
  d.ecrire("b.txt", "b\n");
  d.commit("feat: b");
  d.git("push", "-q", "-u", "origin", `HEAD:refs/heads/${TRAVAIL}`);
  return d;
}

test("demarrer d'une branche poussée partie de develop : refus 4, consigne sans rebase ni push forcé, branche intacte", () => {
  const d = brancheParteDeDevelop();
  const avant = { tete: d.git("rev-parse", "HEAD"), distante: d.git("ls-remote", "--heads", "origin", TRAVAIL) };
  const r = demarrer(d, "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.doesNotMatch(r.stdout, /\brebase\b.*origin|--force|push -f|\+HEAD|reset --hard|--amend/);
  assert.match(r.stdout, /^ {2}git switch --no-track -c feat\/spec-all-dem-1-01-travail-sur-sujet origin\/sujet\/demo$/m);
  assert.match(r.stdout, /^ {2}git cherry-pick --no-merges origin\/develop\.\.feat\/spec-all-dem-1-01-travail$/m);
  assert.match(r.stdout, /^ {2}git push -u origin feat\/spec-all-dem-1-01-travail-sur-sujet$/m);
  assert.match(r.stdout, /^En conflit : résoudre, git add, git cherry-pick --continue \(ou --abort : rien n'est perdu, l'ancienne branche reste\)\.$/m);
  assert.equal(d.git("rev-parse", "HEAD"), avant.tete);
  assert.equal(d.git("rev-parse", "--abbrev-ref", "HEAD"), TRAVAIL);
  assert.equal(d.git("ls-remote", "--heads", "origin", TRAVAIL), avant.distante);
});

test("la consigne de demarrer, jouée telle quelle, reprend les commits sur une branche neuve partie du sujet", () => {
  const d = brancheParteDeDevelop();
  const distante = d.git("ls-remote", "--heads", "origin", TRAVAIL);
  const consigne = demarrer(d, "SPEC_ALL_DEM-1.01").stdout.split("\n").filter((l) => l.startsWith("  git "));
  assert.equal(consigne.length, 3, consigne.join("\n"));
  d.git(...consigne[0].trim().split(/\s+/).slice(1));
  assert.throws(() => d.git("rev-parse", "--abbrev-ref", "@{u}"), undefined, "la branche neuve ne suit pas le sujet");
  for (const ligne of consigne.slice(1)) d.git(...ligne.trim().split(/\s+/).slice(1));
  assert.equal(d.git("rev-parse", "--abbrev-ref", "@{u}"), `origin/${TRAVAIL}-sur-sujet`);
  const r = demarrer(d, "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^base=sujet\/demo$/m);
  assert.equal(d.git("log", "--format=%s", "origin/sujet/demo..HEAD"), "feat: b\nfeat: a");
  assert.equal(d.git("rev-parse", "HEAD"), d.git("rev-parse", `origin/${TRAVAIL}-sur-sujet`));
  assert.equal(d.git("ls-remote", "--heads", "origin", TRAVAIL), distante);
});
```

Le banc reste posable à plat (`scripts/poses.test.mjs`) : il n'importe rien hors de `depot-jouet.mjs`. La vérification que les hooks laissent passer la consigne vit dans `A/regles.test.mjs` (§ 3), pas ici : un banc posé sous `scripts/chaine/` n'a pas `scripts/agent/` dans le garde des bancs posés.

### 2. `S/scripts/sujet.sh`

`:11-12` (en-tête), remplacer les deux lignes

```
#                         `Blocked by:` n'y est pas fait (Status resolved/Fait/done) ; une branche
#                         qui a déjà des commits partis de develop reçoit la commande de rebase
```

par

```
#                         `Blocked by:` n'y est pas fait (Status resolved/Fait/done) ; une branche
#                         qui a déjà des commits partis de develop reste intacte et reçoit la suite
#                         qui les reprend sur une branche neuve partie du sujet (cherry-pick, jamais
#                         de rebase ni de push forcé)
```

`:370-373`, remplacer le bloc `else` par :

```bash
  else
    # Jamais de rebase ni de push forcé : les commits passent sur une branche neuve, l'ancienne reste.
    local neuve="$courante-sur-sujet"
    echo "$courante porte déjà des commits partis de develop : on ne la rebase pas, on ne pousse jamais en force."
    echo "Reprendre ses commits sur une branche neuve partie du sujet (arbre de travail propre d'abord) :"
    echo "  git switch --no-track -c $neuve origin/$branche"
    echo "  git cherry-pick --no-merges origin/develop..$courante"
    echo "  git push -u origin $neuve"
    echo "En conflit : résoudre, git add, git cherry-pick --continue (ou --abort : rien n'est perdu, l'ancienne branche reste)."
    echo "Ouvrir la PR de $neuve vers $branche ; fermer celle de $courante en citant la nouvelle."
    echo "$courante reste sur origin, intacte : sa suppression n'est pas un geste de session."
    sortir 4 "puis relancer demarrer depuis $neuve"
  fi
```

### 3. `A/regles.mjs` et `A/regles.test.mjs`

Dans `A/regles.mjs`, cinq retouches ; chaque bloc est donné à l'indentation exacte du fichier.

**a.** Supprimer la ligne `:71`, la règle `--force(?!-with-lease)|-f` de `COMMANDES_INTERDITES`.

**b.** Après `RAISON_PUSH_SUJET` (`:156-157`), ajouter :

```js
const RAISON_PUSH_FORCE =
  "push forcé (--force, --force-with-lease, --force-if-includes, -f, refspec +…) : jamais, sur aucune branche, la sienne comprise (il réécrit un historique publié). Une branche à reprendre se refait : branche neuve, `git cherry-pick`, nouvelle PR.";
```

**c.** Dans `pushs()`, après `let remoteEnOption = false;` (`:193`), ajouter :

```js
      let force = false;
```

après `if (/^--(all|mirror|branches)$/.test(mot)) tout = true;` (`:200`), ajouter (`--for…` : git accepte toute abréviation non ambiguë d'une option longue, `--force-w` comme `--forc` ; `--follow-tags` et `--no-force-with-lease` ne commencent pas par `--for`) :

```js
        if (/^(--for[a-z-]*(=.*)?|-[a-zA-Z]*f[a-zA-Z]*)$/.test(mot)) force = true;
```

et remplacer `return [{ refspecs: remoteEnOption ? positionnels : positionnels.slice(1), tout }];` (`:204`) par :

```js
      const refspecs = remoteEnOption ? positionnels : positionnels.slice(1);
      return [{ refspecs, tout, force: force || refspecs.some((refspec) => refspec.startsWith('+')) }];
```

**d.** Avant `/** Vrai si un \`git push\` de la commande n'a aucun refspec` (`:237`), ajouter :

```js
/**
 * Vrai si un `git push` de la commande force : `--force`, `--force-with-lease`, `--force-if-includes`,
 * leurs abréviations (`--force-w`), avec ou sans valeur, `-f` seul ou groupé (`-uf`), ou un refspec
 * `+…`, cité ou non. Aucune branche n'en est exemptée : les règles du produit interdisent tout push forcé.
 */
export const pousseEnForce = (commande) => pushs(commande).some(({ force }) => force);

```

**e.** Dans `decisionCommande`, entre la ligne `pushSansRefspec … RAISON_PUSH_SUJET` (`:262`) et `if (pushIllisible(commande))` (`:263`), ajouter :

```js
  if (pousseEnForce(commande)) return { decision: 'refuser', raison: RAISON_PUSH_FORCE };
```

Dans `A/regles.test.mjs` : la ligne `:28` devient `  assert.equal(decisionCommande('git push --force-with-lease origin feat/x').decision, 'refuser');`, et, juste avant `test('un push vers un sujet est refusé, quelle que soit la branche et la forme de la commande'` (`:83`) :

```js
test('tout push forcé est refusé, sur toute branche et sous toute forme ; la consigne de sujet.sh demarrer passe', () => {
  for (const commande of [
    'git push --force origin feat/x',
    'git push -f origin feat/x',
    'git push -uf origin feat/x',
    'git push --force-with-lease',
    'git push --force-with-lease origin feat/x',
    'git push --force-with-lease=feat/x:abc123 origin feat/x',
    'git push --force-w origin feat/x',
    'git push --force-if-includes --force-with-lease origin feat/x',
    'git push origin +HEAD:feat/x',
    'git push origin "+HEAD:feat/x"',
    'git push origin +feat/x',
    'git -C . push --force-with-lease origin feat/x',
    'timeout 5 git push origin +HEAD:feat/x',
    'git rebase --onto origin/sujet/demo origin/develop && git push --force-with-lease',
  ]) {
    const d = decisionCommande(commande, { brancheCourante: () => 'feat/spec-all-demo-1-01-travail' });
    assert.equal(d?.decision, 'refuser', commande);
  }
  assert.match(decisionCommande('git push --force-with-lease origin feat/x').raison, /cherry-pick/);
  for (const commande of [
    'git switch --no-track -c feat/spec-all-demo-1-01-travail-sur-sujet origin/sujet/demo',
    'git cherry-pick --no-merges origin/develop..feat/spec-all-demo-1-01-travail',
    'git push -u origin feat/spec-all-demo-1-01-travail-sur-sujet',
    'git push --follow-tags origin feat/x',
    'git push --no-force-with-lease origin feat/x',
    'git commit -m "jamais git push --force"',
  ])
    assert.equal(decisionCommande(commande, { brancheCourante: () => 'feat/spec-all-demo-1-01-travail' }), null, commande);
});
```

Les autres tests de `A/` ne changent pas : `git push origin +HEAD:sujet/demo` garde la raison « sujet.sh carte » (le refus du sujet est testé avant le push forcé), `garde-commandes.test.mjs:170, :175` (`git push --force origin x`, sortie 2) et `settings-json.test.mjs:63` (`Bash(git push --force:*)` est un écart) restent verts.

### 4. Les textes, mot pour mot

- `S/SKILL.md:25`, après « Cas vécu : douze PR en conflit au squash de leurs specs. », ajouter : « Une branche qui a déjà des commits partis de develop n'est ni rebasée ni poussée en force : `demarrer` la laisse intacte et affiche la suite qui reprend ses commits sur une branche neuve partie du sujet (`git switch --no-track -c`, `git cherry-pick --no-merges`, `git push -u`) ; la PR de l'ancienne branche se ferme en citant la nouvelle. »
- `skills/chaine/socle-chaine-de-production/references/CONTENU.md:13` : « `garde-commandes` refuse le push forcé, `--no-verify`, » devient « `garde-commandes` refuse tout push forcé (`--force-with-lease`, ses abréviations et refspec `+…` compris, sur toute branche), `--no-verify`, ».
- Même ligne, après « Une destination illisible (variable, substitution, motif, `--all`, `--mirror`) est refusée. », ajouter : « Restent hors de sa lecture : un push forcé porté par la configuration plutôt que par la commande (`git -c remote.origin.push=+HEAD:refs/heads/x push`, ou `git config remote.origin.push +…` puis `git push`) et un alias git (`git config alias.p "push --force"`, puis `git p`). La suppression d'une branche distante (`git push origin :x`, `--delete`, `-d`) passe, sauf vers un `sujet/…`, `develop` ou `main` : le hook ne sait pas quelle branche est « à soi ». »
- `S/SKILL.md:54` : « - Rebaser ou pousser en force une branche de sujet, ou y pousser à la main : la carte passe par `sujet.sh carte <nom>`. » devient « - Rebaser une branche de sujet, pousser en force une branche, quelle qu'elle soit (la sienne comprise), ou pousser à la main sur un sujet : la carte passe par `sujet.sh carte <nom>`. »
- `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md:10` : « refusent le push forcé, » devient « refusent tout push forcé, ».
- `skills/chaine/fusionner/SKILL.md:83` : « - Rebaser ou pousser en force la branche d'une autre session. » devient « - Rebaser la branche d'une autre session, ou pousser en force une branche, quelle qu'elle soit (la sienne comprise). »

### 5. La version — `.claude-plugin/plugin.json:3`

Patch (décision 6) : la version de `origin/main` à l'ouverture de la PR, troisième chiffre monté.

## Surfaces

| Surface | Preuve |
| --- | --- |
| consigne de `demarrer` sans réécriture | `skills/chaine/sujet/scripts/sujet.test.mjs` « demarrer d'une branche poussée partie de develop : refus 4, consigne sans rebase ni push forcé, branche intacte » |
| la consigne aboutit | `skills/chaine/sujet/scripts/sujet.test.mjs` « la consigne de demarrer, jouée telle quelle, reprend les commits sur une branche neuve partie du sujet » |
| tout push forcé refusé, la consigne passe les hooks | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « tout push forcé est refusé, sur toute branche et sous toute forme ; la consigne de sujet.sh demarrer passe » et « decisionCommande refuse le push forcé, --no-verify, le push direct sur develop/main, le rebase d’un sujet » (ligne `:28` retournée) |
| textes | `git grep -n -E "rebase --onto origin|sur sa propre branche seulement" -- skills ':!*.test.mjs'` ne rend rien ; `git grep -n "tout push forcé" -- skills/chaine/socle-chaine-de-production/references/CONTENU.md skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md` rend une ligne par fichier |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, au patch qui suit |

## Vérification

- `pnpm test` vert : le compte de `origin/main` plus 3 (428 + 3 = 431 sur `8c670e5`, ticket 25 non compris). `git diff origin/main --stat -- '*.test.mjs'` ne montre que `sujet.test.mjs` et `regles.test.mjs` ; `git diff origin/main -- skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs | grep -c "^-.*assert"` rend 1 (la ligne `:28`, retournée en refus).
- À la main, depuis la racine du plugin : `echo '{"tool_input":{"command":"git push --force-with-lease origin feat/x"}}' | node skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs; echo $?` affiche la raison et `2`.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, commite sous les hooks (jamais `--no-verify`), ouvre sa PR hors brouillon **sans poser `à-fusionner`** (`Label: contre-revue`), et écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- L'écriture d'une branche gardée par les outils GitHub MCP ou par `gh api` : ticket 27, qui part de ce ticket fait.
- Une protection de branche côté GitHub (« bloquer les push forcés » sur toutes les branches) : recommandation du ticket 27, décision du produit.
- Le cas « branche sans commit propre » de `demarrer` (`:367-369`) : inchangé.
- Les dépôts de projet : reposer `sujet.sh` et les hooks est leur affaire ; un projet qui documente chez lui la suite `cherry-pick` peut retirer sa note une fois le plugin à jour.

## Comments

- 2026-11-14 — Instruit sur `8c670e5` (plugin 7.5.0). Défaut reproduit sur une copie jetable avec le dépôt jouet du banc (sortie 4, consigne citée ci-dessus) ; `decisionCommande` joué sur la consigne et sur les formes forcées. Remède des § 1-3 joué dans la copie : tests nouveaux rouges sur `origin/main`, verts après ; suite complète 437 sur 437 avec le ticket 27 (428 sur `origin/main`). Textes du § 4 appliqués dans la copie, `scripts/depot.test.mjs` vert.
- 2026-11-14 — Relu : deux bloquantes (abréviations `--force-w`, `--forc` qui passaient le hook ; `git grep` des « Surfaces » qui rendait trois lignes) et sept mineures, toutes portées : motif `--for…`, `git grep` sur `rebase --onto origin` hors bancs, ligne de conflit dans la consigne, `--no-track`, ce qui échappe au hook écrit dans `CONTENU.md` (configuration, alias, suppression de branche), blocs du § 3 hors liste, `S/SKILL.md:54` aligné, `Blocked by: 25`. Rejoué en extrayant les blocs du ticket sur une copie neuve de `origin/main` : 431 sur 431.
- 2026-11-14 — Contre-relecture de la PR 86 (sommet `5d698b9`) : le code de ce ticket, recopié fidèlement, porte deux défauts, corrigés dans la PR et non dans les blocs ci-dessus — **la PR fait foi**. (1) Régression : `pushs()` découpe au saut de ligne sans recoller une ligne terminée par une barre oblique inverse ; `git push \` suivi de `--force origin x` à la ligne passait le hook et forçait le push, alors que la règle retirée le refusait. Remède : après `sansGuillemets(commande)`, `.replace(/\\\r?\n/g, ' ')` puis `.replace(/\\(.)/g, '$1')`, et deux commandes de plus au test. (2) `F=--force; git push $F origin x` passait : tout mot portant `$` ou un accent grave rend le push illisible, donc refusé. Mineures : `git send-pack` écrit hors de la lecture du hook ; la ligne « En conflit » dit qu'après `--abort` la branche neuve existe déjà ; git refuse `--forc` comme ambigu (le commentaire disait l'inverse). Leçon : un parseur qui remplace un motif se compare à l'ancien motif sur une même table de commandes, lignes continuées comprises.

