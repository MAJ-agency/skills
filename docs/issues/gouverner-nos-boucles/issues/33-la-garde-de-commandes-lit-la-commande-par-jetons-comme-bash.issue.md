# La garde de commandes lit la commande par jetons, de gauche à droite comme bash : un here-doc quoté qu'aucun shell ne lit n'est plus pris pour des commandes, et ce que bash exécute est lu

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: opus — rien n'est donné en code hors des tests : il faut concevoir un lecteur de la syntaxe de bash (citations, here-docs, substitutions imbriquées, commandes composées) au cœur d'un hook de sécurité, où chaque écart avec bash est un contournement, puis rebrancher dessus des décideurs dont le comportement ne doit pas bouger ; la preuve est adverse (corpus et oracle bash), pas une liste de tests à verdir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `.claude-plugin/plugin.json`

## Le besoin

**Le fait.** Deux projets qui posent le socle perdent des tours sur la garde de commandes (`garde-commandes`, hook `PreToolUse` de Bash) : un message de commit ou de PR en français passé par here-doc est refusé dès que son corps cite un texte dangereux (`gh pr merge`, `git push --force`, `git push origin main`) avant une apostrophe (`l'agent`) et qu'une seconde apostrophe suit le terminateur (`git log --format='%s'`, `echo 'ok'`). Rapporté le 2026-11-14 (ticket 35), rejoué le 2026-11-16 sur `fedora` (carte, « Retours de `fedora` », constat 2). Le contournement en vigueur est `git commit -F <fichier>` ou `--body-file`.

**La cause.** `segmentsDeCommande` découpe la commande par motifs, deux fois (texte brut, puis séparateurs cités neutralisés), et les autres lecteurs (`sansTexte`, `motsDenudes`, `segmentsDAvant`) refont chacun leur découpage. Aucun ne lit comme bash : la seconde lecture neutralise les textes cités avant de retirer les corps de here-doc, si bien qu'une apostrophe du corps ouvre un faux texte cité qui avale le terminateur (ticket 35, « La cause »). Dans l'autre sens, les mêmes motifs retirent ce que bash exécute : la ligne d'ouverture d'un here-doc, un `<<EOF` cité, en commentaire, dans `<<<` ou dans `$(( ))`, le corps d'un here-doc donné à un shell. Dans la table ci-dessous, **24 commandes** que bash exécute, push forcé ou `gh pr merge` compris, passent sur `main`.

**Retoucher les motifs ne suffit pas** (ticket 35, suspendu sous celui-ci, et A-51) : le correctif du 35 laissait passer 23 231 couples (commande, branche) que `main` refuse et que bash exécute, sur le corpus de son relecteur ; une variante plus fine en laissait 2 504. Sur le corpus de ce ticket, il en laisse passer 32 (« Vérification »).

**Quand le ticket est fait** : un lecteur de jetons, de gauche à droite comme bash, remplace tous les découpages par motifs de `regles.mjs`. Un message ou un script en français passé par un here-doc quoté (`<<'EOF'`) à un programme qui ne l'exécute pas passe, même s'il cite `gh pr merge` ou `git push --force`. La ligne d'ouverture du here-doc, ce qui suit son terminateur, les substitutions d'un corps non quoté et le corps donné à un shell sont lus comme des commandes. Ce que le lecteur ne sait pas lire est refusé. Rien de ce que 7.9.0 refuse et que bash exécute ne passe. Les décisions (`COMMANDES_INTERDITES`, push, `gh`, dépendances) ne changent pas, seul le découpage change. Le ticket 35 est fermé par ce ticket : ses cas sont dans la table ci-dessous.

## Où

Base : `origin/main` à `fa7d3eb` (PR 93), plugin **7.9.0**, **499 tests** (`pnpm test`), dont 54 sous `references/agent/` (`regles.test.mjs` 28, `garde-commandes.test.mjs` 15, `garde-github.test.mjs` 6, `apres-edition.test.mjs` 3, `fin-de-tour.test.mjs` 2). Le ticket 39 (PR 94, 7.9.1) ne touche aucun fichier de `references/agent/` (sa décision 13). Lignes relues le 2026-11-16 sur `fa7d3eb` ; la session les retrouve par leur texte. `R` abrège `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`.

- **Les découpages à remplacer**, tous dans `R` : `sansTexte` (:152, exporté), `sansGuillemets` (:175), `sansSubstitutionsParenthesees` (:185), `segmentsDeCommande` (:220, exporté ; la neutralisation des textes cités :225, la double lecture :226), `lireSegments` (:232), `segmentsDAvant` (:270), `motsDenudes` (:456), et les découpes en ligne : `ajouts` (:107, `split(/[;&|\n]+/)` ; :109, `split(/\s+/)`), `lirePushs` (:312-314), `ecritParGh` (:560).
- **Les décideurs, qui ne changent pas** : `COMMANDES_INTERDITES` (:68-76), lu par `decisionCommande` sur `code` (:428) et `nu` (:431) ; `ajouts` (:106) et `OPTIONS_A_VALEUR`, `OPTIONS_SANS_RISQUE` ; `lirePushs` (:309) avec `indexDuProgramme` (:263), `lecturesDuProgramme` (:284), `OPTIONS_GIT_A_VALEUR`, `OPTIONS_PUSH_A_VALEUR`, `destination`, `nomDeBranche`, `brancheGardee` ; `ecritParGh` (:557) avec `OPTIONS_GH_API_A_VALEUR`, `CHEMIN_GH_ECRIT` ; l'ordre des refus de `decisionCommande` (:427-449) et ses raisons.
- **Les assertions qui figent des sorties de découpage**, à garder telles quelles : `regles.test.mjs:145-146` (`pousseSurUnSujet` sur un texte cité et sur un corps de here-doc : `false`), `:275-278` (`` segmentsDeCommande('git -C "$(pwd)" push origin HEAD:x; echo `date`') `` rend `['pwd', 'date', 'git -C $SUBSTITUTION push origin HEAD:x', 'echo $SUBSTITUTION']`), `:475-478` (`decisionCommande("git commit -m 'ne jamais git push --force'")` vaut `null`, `sansTexte('cat <<EOF\ngit push --force\nEOF')` vaut `'cat <<heredoc'`).
- **Contraintes du dépôt** : `scripts/depot.test.mjs:246-251` (`EXCEPTIONS_SAUT`) et `:286` : aucun `.mjs` suivi sous `skills/` ou `scripts/` ne nomme `--no-verify` ni `-n` de `git commit`, hors quatre fichiers dont `regles.mjs` et `regles.test.mjs`. Les bancs copient `regles.mjs` seul dans leurs projets jouets (`garde-commandes.test.mjs:35` et `:184`, `fin-de-tour.test.mjs:18`, `apres-edition.test.mjs:15`). Une erreur dans `regles.mjs` bloque Bash pour la session (`references/docs-agents/pieges.md:14`, `"onFailure": "block"`). `references/agent/` n'importe que `node:` et ses voisins.
- **Le délai du hook** : `references/settings-hooks.json:22`, `"timeout": 60` pour `garde-commandes`.
- **La documentation** : `skills/chaine/socle-chaine-de-production/references/CONTENU.md:13`, le paragraphe de `garde-commandes`.

## Les cas, joués sur `main`

Joués le 2026-11-16 sur `fa7d3eb` par `decisionCommande(commande, { brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' })`. La colonne « bash lance » vient d'un oracle : `bash -c` joue la commande dans un dossier jetable, avec `git`, `gh`, `npm`, `yarn` et `pnpm` remplacés par des scripts qui journalisent leurs arguments, sans rien exécuter. Elle montre chaque appel journalisé que 7.9.0 refuse quand on le lui donne seul, arguments neutralisés (blancs, séparateurs, guillemets et `$` devenus `_`). La table reprend les cas des pilotes du lecteur du 2026-11-16 (`cas.mjs`, `cas2.mjs`), les cinq commandes et les deux tests du ticket 35, et ceux qu'a ajoutés la rédaction. `\n` est un saut de ligne, `\t` une tabulation. P : faux refus à lever. G : passe déjà, à garder. R : à refuser.

| n° | commande | `main` | attendu | bash lance |
| --- | --- | --- | --- | --- |
| P1 | `git commit -m "$(cat <<'EOF'\nfix(chaine): le capitaine seul lance gh pr merge\n\nl'agent ne le lance pas\nEOF\n)" && git log --format='%s' -1` | refuser | passe | rien de gardé |
| P2 | `git commit -m "$(cat <<'EOF'\nfix: plus de git push --force origin feat/x\nl'agent\nEOF\n)"\necho 'ok'` | refuser | passe | rien de gardé |
| P3 | `git commit -m "$(cat <<'EOF'\nfix: refuser git push origin main\n\nl'agent\nEOF\n)" && git log --format='%h %s' -1` | refuser | passe | rien de gardé |
| P4 | `git commit -F - <<'EOF'\nfix(chaine): le capitaine seul lance gh pr merge\nl'architecte ne le lance pas\nEOF\ngit log --format='%s' -1` | refuser | passe | rien de gardé |
| P5 | `git commit -F - <<'EOF'\nfix: plus de git push --force origin feat/x\nl'architecte\nEOF\ngit log --format='%s' -1` | refuser | passe | rien de gardé |
| P6 | `git commit -F - <<-'EOF'\n\tfix: gh pr merge\n\tl'architecte\n\tEOF\necho 'fait'` | refuser | passe | rien de gardé |
| P7 | `cat <<"FIN"\ngh pr merge 12\nl'architecte\nFIN\necho 'fait'` | refuser | passe | rien de gardé |
| P8 | `cat <<'A' > a\ngh pr merge 1 ; l'un\nA\ncat <<'B' > b\nd'autre\nB\n` | refuser | passe | rien de gardé |
| P9 | `cat > m <<'EOF'\nfix: gh pr merge\nl'agent\nEOF\ngit commit -F m && git log --format='%s' -1` | refuser | passe | rien de gardé |
| P10 | `gh pr create --title "fix: l'agent" --body "$(cat <<'EOF'\ngit push --force origin feat/x\nl'architecte\nEOF\n)" && echo 'ok'` | refuser | passe | rien de gardé |
| P11 | `git commit -F - <<EOF\nfix: plus de git push --force origin feat/x\nl'agent\nEOF\necho 'ok'` | refuser | passe | rien de gardé |
| P12 | `git commit -F - <<\EOF\nfix: gh pr merge\nl'agent\nEOF\necho 'ok'` | refuser | passe | rien de gardé |
| G1 | `gh pr create --title "x" --body "$(cat <<'EOF'\ngh pr merge\nl'architecte\nEOF\n)"` | passe | passe | rien de gardé |
| G2 | `git commit -m "fix: l'agent ne pousse pas"` | passe | passe | rien de gardé |
| G3 | `git commit -m $'fix: l\'agent\n\ncorps'` | passe | passe | rien de gardé |
| G4 | `python3 - <<'EOF'\nprint("l'architecte : gh pr merge, gh repo sync")\nEOF\n` | passe | passe | rien de gardé |
| G5 | `git commit -m "$(cat <<'EOF'\nfeat(x): le garde\n\nCorps : l'agent ne pousse pas.\nEOF\n)"` | passe | passe | rien de gardé |
| G6 | `git commit -m "$(cat <<'EOF'\nfix: l'agent\nEOF\n)" && git push origin HEAD:feat/x` | passe | passe | rien de gardé |
| G7 | `cat > m <<'EOF'\nl'agent\nEOF` | passe | passe | rien de gardé |
| G8 | `git commit -m "$(cat <<'EOF'\nfix: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF\n)"` | passe | passe | rien de gardé |
| G9 | `git commit -m "chore: npm install x refusé"` | passe | passe | rien de gardé |
| G10 | `for f in a b; do echo "$f"; done && git log --format='%s' -1` | passe | passe | rien de gardé |
| G11 | `cat <<'A' <<'B'\nl'un : gh pr merge 1\nA\nd'autre\nB\necho 'ok'` | passe | passe | rien de gardé |
| R1 | `git commit -m "$(cat <<'EOF'\nl'agent\nEOF\n)" --no-verify` | refuser | refuser | `git commit -m l'agent --no-verify` |
| R2 | `git commit -m "$(cat <<'EOF'\nl'agent\nEOF\n)" -n` | refuser | refuser | `git commit -m l'agent -n` |
| R3 | `cat <<'EOF'\nl'agent\nEOF\ngit push --force origin feat/x` | refuser | refuser | `git push --force origin feat/x` |
| R4 | `cat <<'EOF'\nl'x\nEOF\n; git push --force origin feat/x` | refuser | refuser | rien (erreur de syntaxe) |
| R5 | `git commit -m "$(cat <<'EOF'\nl'agent\nEOF\n)" && git push origin main` | refuser | refuser | `git push origin main` |
| R6 | `git commit -m "$(cat <<'EOF'\nl'agent\nEOF\n)" \|\| git push origin develop` | refuser | refuser | rien de gardé |
| R7 | `cat <<'EOF' > m\nl'agent\nEOF\ngit commit --no-verify -F m` | refuser | refuser | `git commit --no-verify -F m` |
| R8 | `python3 - <<'EOF'\nprint("l'architecte : gh pr merge")\nEOF\ngh pr merge 12` | refuser | refuser | `gh pr merge 12` |
| R9 | `cat <<EOF \| git push --force origin feat/x\nl'architecte\nEOF\n` | passe | refuser | `git push --force origin feat/x` |
| R10 | `cat <<'EOF' ; gh pr merge 12\nx\nEOF\n` | passe | refuser | `gh pr merge 12` |
| R11 | `cat <<'EOF' > m && git commit --no-verify -F m\nx\nEOF\n` | passe | refuser | `git commit --no-verify -F m` |
| R12 | `cat <<'EOF' ; npm install leftpad\nx\nEOF\n` | passe | refuser | `npm install leftpad` |
| R13 | `cat <<EOF ; git push -f origin feat/x\nx\nEOF\n` | passe | refuser | `git push -f origin feat/x` |
| R14 | `echo "<<EOF" ; git push --force origin feat/x\ncat <<'EOF'\nx\nEOF\n` | passe | refuser | `git push --force origin feat/x` |
| R15 | `echo $'<<EOF'\ngit push -f\nl'x\nEOF\necho 'y'` | refuser | refuser | `git push -f` |
| R16 | `x="<<EOF" \| echo $(cat <<'EOF'\nz\nEOF\n)\ngh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md` | refuser | refuser | `gh api -f message=fix(api): x -X PUT repos/o/r/contents/a.md` |
| R17 | `# <<EOF\ngit push --force origin feat/x\nEOF` | passe | refuser | `git push --force origin feat/x` |
| R18 | `cat <<<EOF\ngit push --force origin feat/x\nEOF` | passe | refuser | `git push --force origin feat/x` |
| R19 | `echo $((1<<X))\ngit push --force origin feat/x\nX` | passe | refuser | `git push --force origin feat/x` |
| R20 | `cat <<EOF ; git push -f\n'\nEOF\necho 'fin'` | refuser | refuser | `git push -f` |
| R21 | `bash <<'EOF'\ngit push --force origin feat/x\nEOF` | passe | refuser | `git push --force origin feat/x` |
| R22 | `bash -s <<'EOF'\n# l'agent\ngit commit --no-verify -m x\nEOF` | passe | refuser | `git commit --no-verify -m x` |
| R23 | `cat <<'EOF' \| sh\ngit push origin main\nEOF` | passe | refuser | `git push origin main` |
| R24 | `source /dev/stdin <<'EOF'\ngit push --force origin feat/x\nEOF` | passe | refuser | `git push --force origin feat/x` |
| R25 | `python3 - <<'EOF'\nimport os; os.system("git push --force origin feat/x")\nEOF` | passe | refuser | `git push --force origin feat/x` |
| R26 | `eval "$(cat <<'EOF'\ngit push --force origin feat/x\nEOF\n)"` | passe | refuser | `git push --force origin feat/x` |
| R27 | `sh -c "$(cat <<'EOF'\ngit push --force origin feat/x\nEOF\n)"` | passe | refuser | `git push --force origin feat/x` |
| R28 | `python3 -c "$(cat <<'EOF'\nimport os; os.system('git push --force origin feat/x')\nEOF\n)"` | passe | refuser | `git push --force origin feat/x` |
| R29 | `cat <<EOF\nl'agent $(git push -f origin feat/x)\nEOF` | passe | refuser | `git push -f origin feat/x` |
| R30 | `` cat <<EOF\nl'agent `git push -f origin feat/x`\nEOF `` | passe | refuser | `git push -f origin feat/x` |
| R31 | `cat <<'EOF'\nl'architecte\nEOF\ngit -c user.name="a;b" push --force origin feat/x\ncat <<'EOF'\nl'architecte\nEOF\n` | passe | refuser | `git -c user.name=a;b push --force origin feat/x` |
| R32 | `cat <<'EOF'\nl'architecte\ngit push --force origin feat/x` | refuser | refuser | rien de gardé |
| R33 | `cat <<'EOF'\nl'architecte\nEOFX\ngit push --force origin feat/x` | refuser | refuser | rien de gardé |
| R34 | `cat <<'EOF' > s.sh\n# l'agent\ngit push --force origin feat/x\nEOF\nbash s.sh && echo 'ok'` | passe | refuser | `git push --force origin feat/x` |
| R35 | `git commit -m "l'agent" --no-verify` | refuser | refuser | `git commit -m l'agent --no-verify` |
| R36 | `git commit -m $'l\'agent' --no-verify` | refuser | refuser | `git commit -m l'agent --no-verify` |
| R37 | `echo l\'x; git push origin main` | refuser | refuser | `git push origin main` |
| R38 | `echo "git push --force origin feat/x"` | refuser | refuser | rien de gardé |
| R39 | `echo "gh pr merge 12"` | refuser | refuser | rien de gardé |
| R40 | `eval "git push -f origin feat/x"` | refuser | refuser | `git push -f origin feat/x` |
| R41 | `git commit -m "--no-verify"` | refuser | refuser | `git commit -m --no-verify` |
| R42 | `echo "$x <<EOF" ; git push --force origin feat/x\ncat <<'EOF'\nx\nEOF\n` | passe | refuser | `git push --force origin feat/x` |
| R43 | `cat <<A <<B ; git push --force origin feat/x\nx\nA\ny\nB\n` | passe | refuser | `git push --force origin feat/x` |
| R44 | `echo \<<EOF ; git push --force origin feat/x\ncat <<'EOF'\nx\nEOF\n` | passe | refuser | `git push --force origin feat/x` |
| R45 | `git commit -m "fix: l'architecte ; gh pr merge"` | refuser | refuser | rien de gardé |
| R46 | `cat <<'EOF'\nfix: gh pr merge\nl'architecte\nEOF\ngit push --force origin feat/x` | refuser | refuser | `git push --force origin feat/x` |
| R47 | `cat <<'EOF'\nl'architecte\nEOF\ngit -c user.name="a;b" push --force origin feat/x` | refuser | refuser | `git -c user.name=a;b push --force origin feat/x` |
| R48 | `cat <<'EOF'\nl'architecte\nEOF\ngh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md` | refuser | refuser | `gh api -f message=fix(api): x -X PUT repos/o/r/contents/a.md` |
| R49 | `echo "<<EOF" ; git push --force origin feat/x` | refuser | refuser | `git push --force origin feat/x` |
| R50 | `echo '<<EOF' && git push --force origin feat/x` | refuser | refuser | `git push --force origin feat/x` |
| R51 | `echo "<<X" ; gh api -X PUT repos/o/r/pulls/1/merge` | refuser | refuser | `gh api -X PUT repos/o/r/pulls/1/merge` |
| R52 | `echo '<<EOF' \| echo $(cat <<'EOF'\nz\nEOF\n) \| git -c user.name="a;b" push --force origin feat/x` | refuser | refuser | `git -c user.name=a;b push --force origin feat/x` |
| R53 | `<<'EOF' echo $(cat <<'EOF'\nz\nEOF\n) ; gh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md\n\tEOF` | refuser | refuser | `gh api -f message=fix(api): x -X PUT repos/o/r/contents/a.md` |

Bilan sur `main` : **76 cas, 36 rouges** : les 12 faux refus P, et 24 des 53 R, qui passent alors que bash lance la commande gardée (les 24 relevés, sans exception). Les 11 G passent. Les 29 autres R sont déjà refusés. Pour 7 d'entre eux, bash ne lance rien de gardé, et ils restent refusés quand même :

- R4 : erreur de syntaxe pour bash, illisible pour la garde ;
- R6 : le push suit `||`, bash le lancerait si le commit échouait ;
- R32 et R33 : here-doc non fermé, bash prend tout le reste pour du corps ; la garde ferme ;
- R38, R39 et R45 : la prudence de 7.9.0 sur un texte cité, gardée (décision 5).

R41 (`git commit -m "--no-verify"`) est un faux refus connu, laissé au ticket 34.

## Le coût, mesuré

`decisionCommande` seule, sur `fa7d3eb`, avec le script `temps.mjs` (« Vérification »). Les temps varient d'un passage à l'autre sur ce poste ; ce sont deux mesures.

| cas | forme | taille | `main` |
| --- | --- | --- | --- |
| a | `cat <<'EOF'\nl'x\n`, 30 000 sauts de ligne, un push forcé (non fermé) | 30 046 | 11,9 et 13,5 s |
| b | le même sans apostrophe | 30 044 | 12,3 et 14,6 s |
| c | 3 750 lignes `cat <<EOF`, non fermées, un push forcé | 37 530 | 1,0 et 1,9 s |
| d | 30 000 lignes `cat <<EOF`, non fermées, un push forcé | 300 030 | **71,9 s** |
| e | `cat <<'EOF'\n` puis 30 000 caractères sur une ligne (non fermé) | 30 043 | 0,01 et 0,03 s |
| f | 2 500 here-docs fermés à apostrophe, un push forcé | 40 030 | 0,04 s |

Le cas d dépasse le délai du hook (60 s) : la garde est tuée et Bash bloqué (`"onFailure": "block"`). Le refus tient, mais la session attend une minute. Les motifs de here-doc en `\n\s*` coûtent au carré (ticket 35, décision 5).

## Décisions

1. **Un lecteur, dans `regles.mjs`.** Une fonction pure et exportée, `lireCommande(commande)`, lit la commande de gauche à droite, comme bash, en un seul passage. Elle vit dans `regles.mjs` et non dans un module à part : les bancs ne copient que `regles.mjs`, et un projet qui le recopierait sans son nouveau voisin casserait sa garde, donc Bash. Aucune dépendance (la garde tourne avant tout `pnpm install`, et `references/agent/` n'importe que `node:`). Le lecteur couvre :
   - les mots : littéraux, `'…'`, `"…"`, `$'…'` (échappements du C), `$"…"`, `\x`, la ligne continuée `\⏎` ;
   - les expansions : `$x`, `${…}` imbriqué, `$(…)`, les accents graves (et ceux, échappés, qu'ils contiennent), `$((…))`, `<(…)`, `>(…)` ;
   - les opérateurs : `;`, `&`, `&&`, `||`, `|`, `|&`, le saut de ligne, `;;`, `;&`, `;;&` ;
   - les groupes `( … )` et `{ …; }`, les mots réservés en tête de commande (`if`, `then`, `elif`, `else`, `fi`, `for`, `in`, `do`, `done`, `while`, `until`, `case`, `esac`, `select`, `function`, `!`, `time`, `[[ ]]`, `coproc`) et les définitions de fonction ;
   - les affectations en tête (`X=1 cmd`, `X+=y`, `a[1]=x`), les redirections avec ou sans descripteur (`<`, `>`, `>>`, `>|`, `<>`, `<&`, `>&`, `&>`, `&>>`, `<<`, `<<-`, `<<<`), les commentaires (`#` en début de mot).

   Il lit les commandes partout où bash en exécute : en tête, dans les substitutions, les sous-shells, les groupes et les commandes composées, dans un corps de here-doc donné à un shell, dans l'argument de `-c` d'un shell et dans les arguments d'`eval` (relus comme une source, récursivement).
2. **Garde fermée.** `lireCommande` rend un motif d'illisibilité au lieu de deviner :
   - un here-doc qui ne se ferme pas, ou que bash ne fermerait qu'en fin de substitution (`$(cat <<'EOF'\nx\nEOF)`, que bash 5.2 accepte avec un avertissement) ;
   - un guillemet, une substitution, une expansion ou un groupe non fermés ;
   - un opérateur là où bash veut une commande (`EOF\n; git push …`, R4) ;
   - une syntaxe que le lecteur ne couvre pas ;
   - une profondeur d'imbrication au-delà d'une borne fixe (substitutions, `-c`, `eval`, corps).

   `decisionCommande` refuse alors, **avant tout autre refus**, avec une raison nouvelle :
   > `RAISON_ILLISIBLE = "commande que la garde ne sait pas lire (here-doc non fermé ou fermé autrement que par son délimiteur seul sur sa ligne, guillemet ou substitution non fermés, syntaxe inconnue) : elle est refusée plutôt que devinée. Récris-la plus simplement ; un message long passe par un here-doc quoté (<<'EOF' … EOF seul sur sa ligne) ou par git commit -F <fichier> / gh … --body-file <fichier>."`
3. **Les here-docs, comme bash.**
   - `<<` et `<<-` n'ouvrent un here-doc qu'en position d'opérateur : jamais dans un texte cité (`"<<EOF"`, `'<<EOF'`, `$'<<EOF'`, `"$x <<EOF"`), un commentaire, `<<<`, `$(( ))` ni après `\<`.
   - Le délimiteur est quoté si une partie de son mot l'est (`'EOF'`, `"EOF"`, `\EOF`, `E'O'F`), et il se lit sans ses guillemets.
   - Le terminateur est une ligne égale au délimiteur, rien de plus : pour `<<-`, après retrait des tabulations de tête, jamais des espaces. `EOF;`, `EOF `, `  EOF` et `EOFX` ne ferment rien.
   - Plusieurs here-docs sur une ligne se lisent dans l'ordre (`cat <<A <<B`).
   - La ligne d'ouverture est une ligne de commande, lue jusqu'à son saut de ligne (`cat <<'EOF' ; npm install x`, `cat <<EOF | git push -f`) ; ce qui suit le terminateur aussi.
4. **Le corps d'un here-doc** reçoit l'une de trois lectures. Toutes les listes ci-dessous sont fermées, écrites dans `regles.mjs` ; un programme absent d'une liste n'en fait pas partie.
   - **Retiré** : le texte littéral du corps n'est pas lu, si toutes ces conditions tiennent :
     - le consommateur est inerte. Le consommateur est le programme de la commande simple qui porte la redirection, lu après les affectations et les préfixes `env` (sans `-S`), `command`, `nice`, `nohup`, `time` et `timeout <durée>`. Les inertes : `cat`, `tee`, `head`, `tail`, `wc`, `sort`, `uniq`, `tr`, `cut`, `grep`, `diff`, `jq`, `base64`, `echo`, `printf`, `git commit`, `git tag`, `git notes`, `gh pr|issue|release create|edit|comment`, `gh api` ;
     - chaque commande qui suit le consommateur dans son pipeline est inerte ;
     - la substitution qui contient le here-doc, s'il y en a une, n'est pas le mot du programme ;
     - aucun exécuteur ne figure dans la commande entière. Les exécuteurs : les shells (`bash`, `sh`, `dash`, `zsh`, `ksh`, `mksh`, `busybox`), `source`, `.`, `eval`, les interpréteurs (`python`, `python2`, `python3`, `node`, `deno`, `bun`, `perl`, `ruby`, `php`, `lua`, `osascript`), `xargs`, `find`, `parallel`, `watch`, `ssh`, `su`, `script`, `sudo`, `doas`, `env -S`, un programme donné par un chemin dont le nom n'est ni `git` ni `gh` (`./s.sh`, `/tmp/s.sh`), un programme donné par une expansion. C'est ce qui ferme R34 (`cat <<'EOF' > s.sh` … puis `bash s.sh`) et l'affectation suivie d'un `eval`.

     Un corps quoté est alors retiré entier. Un corps non quoté garde ses substitutions (`$(…)`, accents graves, et celles des `${…}`), toujours lues comme des commandes, quel que soit le consommateur (R29, R30) : bash ne lit qu'elles, et P11 passe.
   - **Lu comme des commandes** (strict, récursif, illisible → refus) si le corps atteint un shell : le consommateur est un shell, `source`, `.` ou `eval` ; une commande qui le suit dans le pipeline en est un (`| sh`, `| bash -s`) ; ou la substitution qui le contient est un argument d'`eval` ou de `-c` d'un shell (R21 à R24, R26, R27).
   - **Relu par prudence** dans les autres cas : consommateur ni inerte ni shell (`python3 -`, un programme inconnu), ou exécuteur présent. Le texte du corps, guillemets et barres obliques inverses retirés, se lit en lecture L2 (décision 5), comme 7.9.0 lit un texte cité : R25 et R28 (`os.system("git push --force …")`) sont refusés, G4 (`print("l'architecte : gh pr merge, gh repo sync")`) passe. Il ne passe pas par L3 : 7.9.0 n'y voyait aucun corps de here-doc.
5. **Les décisions ne changent pas, seul le découpage change.** Le lecteur rend des commandes simples, et chaque décideur garde ses motifs, ses listes d'options et son ordre. Il lit ce qu'il lisait, reconstruit sur de vrais jetons, en trois lectures :
   - **L1, les mots** : un mot par mot de bash, valeur sans guillemets ; un mot qui porte une expansion se lit `$SUBSTITUTION` (il garde un `$`, donc reste illisible pour un refspec ou une route). L1 remplace la lecture à séparateurs cités neutralisés (:225).
   - **L2, la lecture éclatée** : les valeurs de L1 jointes par des blancs, puis recoupées sur les blancs et sur `;`, `&`, `|`, `(`, `)` et le saut de ligne. Une substitution non citée coupe aussi le segment, et ce qui la suit se relit comme un début de commande (`sudo -u git $(true) git push …`). C'est la prudence de 7.9.0 (première lecture de `segmentsDeCommande` et `segmentsDAvant`), documentée : `echo "gh pr merge 12"` (R39) et `git commit -m "fix: l'architecte ; gh pr merge"` (R45) restent refusés. Elle couvre aussi `watch "git log; gh pr merge 1"` et `ssh h "cd r; git push -f"`, que bash exécute et qu'aucune liste ne nomme. La décision 4 y ajoute les corps relus par prudence.
   - **L3, le texte des mots** : les valeurs de L1 jointes par des blancs ; un mot dont une partie citée porte un blanc ou un séparateur se lit `""`, comme `sansTexte` le faisait. `git commit -m "chore: npm install x refusé"` passe (G9), `git commit -m "--no-verify"` reste refusé (R41, au ticket 34), `git commit -m "a;b" --no-verify` aussi.

   | Décideur | 7.9.0 lit | Avec le lecteur |
   | --- | --- | --- |
   | `COMMANDES_INTERDITES` | `code` = `sansTexte(commande)` et `nu` = `sansTexte(motsDenudes(commande))`, la commande entière | L3 de chaque commande simple |
   | `ajouts` (dépendances) | `code` | L3 de chaque commande simple |
   | `pushs` (sujet, branche gardée, nom illisible, force, sans refspec, refspec illisible) | les deux lectures de `segmentsDeCommande`, et `segmentsDAvant` | L1 et L2 |
   | `ecritParGh` | `{ segment, suite }` des deux lectures | L1 et L2 ; `suite` est le source à partir de la commande, corps retirés exclus, commentaires compris (le mot `mutation` en commentaire après `gh api graphql` refuse toujours) |

   Les commandes simples comprennent celles des substitutions, des sous-shells, des corps lus comme commandes, et des arguments de `-c` et d'`eval`. Les corps relus par prudence ne passent que par L2.
6. **Les exports restent, avec leurs sorties testées.** Les exports se récrivent sur le lecteur, mêmes noms, mêmes signatures, mêmes sorties sur les assertions existantes :
   - `segmentsDeCommande` devient le rendu de L2 : `{ segment, suite }`, substitutions d'abord, `$SUBSTITUTION` (`regles.test.mjs:275-278`) ;
   - `sansTexte` (`:477`) ;
   - `paquetsAjoutes` et `ajouteUneDependance` (sur une commande, comme aujourd'hui) ;
   - `pousseSurUnSujet` et les autres `pousse…` ;
   - `decisionCommande`, `garde-commandes.mjs` et `entree.mjs` ne changent pas d'interface.

   Les découpages remplacés (`sansGuillemets`, `sansSubstitutionsParenthesees`, `lireSegments`, `segmentsDAvant`, `motsDenudes`, la double lecture) disparaissent, ou ne servent plus qu'à `sansTexte` s'il garde sa forme.
7. **L'interface sert le ticket 34.** Il refusera `HUSKY=0 git commit`, `export HUSKY=0`, `git -c core.hooksPath=… commit`, `git --config-env k=V push`, `git update-ref --stdin <<<"…"`, et tranchera `git commit -m "--no-verify"` et `-mn`. `lireCommande` rend donc au moins, sous des noms que la session choisit et documente en JSDoc :
   - `illisible` : le motif, ou `null` ;
   - les commandes simples, dans l'ordre du source, chacune avec : ses affectations de tête (nom, mot) ; ses mots (valeur sans guillemets ou « porte une expansion », texte brut, et s'il a une partie citée) ; ses redirections (opérateur, descripteur, cible) ; ses here-docs et here-strings (opérateur, délimiteur, quoté ou non, corps ou contenu, lecture retenue : retiré, commandes ou prudence) ; son origine (en tête, substitution, sous-shell, corps, argument de `-c` ou d'`eval`) ; sa position dans le source.

   Un test le montre sur `HUSKY=0 git -c core.hooksPath=x commit -m "a b" <<<"c"` : une affectation, cinq mots dont un cité, un here-string.
8. **Temps linéaire.** Un seul passage ; aucun motif à retour arrière sur le texte entier ; `suite` sans copie du reste de la commande pour chaque segment (un indice, ou une lecture paresseuse). Plafond : **1 s** pour `decisionCommande` sur chacun des cas a à f, jamais plus que `main`, et un test de la suite borne le cas d à **5 s** (`main` : 71,9 s).
9. **Monotonie, par corpus et oracle bash** (A-51). Sur le corpus de « Vérification », aucun couple (commande, branche) que 7.9.0 refuse, que la branche laisse passer, et où bash lance un appel que 7.9.0 refuse seul : **0 régression réelle**. Le banc doit aussi mordre : rejoué contre une variante fautive de la branche (ce qui suit le terminateur d'un here-doc n'est plus lu), il en trouve au moins une ; contre le correctif du ticket 35, il en trouve 32 sur `fa7d3eb`. Les faux refus levés et les refus nouveaux sont comptés et montrés dans la PR, dix exemples chacun.
10. **Version : mineure, 7.10.0.** Le comportement de la garde change : faux refus levés, refus nouveaux, raison nouvelle. Si une autre PR du plugin prend 7.10.0 avant celle-ci, la session prend la mineure suivante. Elle fusionne `main` dans sa branche (commit de fusion, ni rebase ni push forcé).
11. **La revue.**
    - `/security-review` sur **chaque sommet** poussé de la branche, pas seulement le dernier : la garde est un hook de sécurité. Sa section va dans le corps de la PR.
    - Toute commande d'écriture que la session trouve en plus de la table et que bash exécute (push, `gh` en écriture, saut de hook, dépendance), qu'elle passe sur `main` ou sur la branche, et qu'elle ferme ou non, est écrite dans la PR : la commande, ce que bash lance, `main` et la branche. **Elle n'en tait aucune.**
    - Commits sous les hooks, jamais `--no-verify` ; aucun test retiré, sauté ou assoupli.
    - PR hors brouillon, sans `à-fusionner` (`Label: contre-revue`), un mot à l'architecte dès la PR livrée.

12. **Précisions de l'architecte après la relecture du 2026-11-16** (elles complètent les décisions 4 et 5 et l'emportent sur elles en cas de doute) :
   - **Un préfixe inconnu n'est jamais transparent.** Le consommateur se lit après les seuls préfixes nommés en décision 4 ; tout autre mot qui lance son argument (`exec`, `builtin`, `stdbuf`, `ionice`, `chroot`, `setsid`, `flock`, `unbuffer`…) ou tout programme inconnu en tête fait passer le corps en **relu par prudence**, jamais en retiré. Un test : `exec cat <<'EOF'` … `git push --force origin feat/x` … `EOF` est relu par prudence (refusé).
   - **Une définition de fonction ou un `alias` compte comme un exécuteur**, où qu'il soit dans la commande entière : `f(){ cat; }; f <<'EOF'` et `alias c=bash; c <<'EOF'` ne retirent pas le corps. Un test pour chacun.
   - **L3 se lit à partir du programme**, mots réservés et ouvertures de groupe retirés (`!`, `time` et ses options, `{`, `(`, `if`, `then`, `elif`, `else`, `do`, `while`, `until`, `case … in`), puis les affectations ; le décideur voit donc la même commande que bash lance. Un test par mot réservé de la liste, chacun suivi d'un `npm install x`, refusé.
   - **Un tour d'attaques hors du ticket reste à faire, par la session** : le relecteur indépendant a été arrêté par un contrôle de sûreté avant de proposer ses propres commandes, et l'architecte ne l'a pas contourné. La session joue donc elle-même, à l'oracle, au moins vingt formes que ce ticket ne nomme pas (substitution de processus, here-string, `$'…'` à saut de ligne, ligne continuée par `\`, terminateur cité en partie `<<E"OF"` et `<<\EOF`, `coproc`, `case`, boucles, sous-shell, groupe) et les écrit dans la PR, avec leur verdict avant et après. Toute forme que bash exécute et que la branche laisse passer alors que `main` la refuse est une régression bloquante ; une forme qui passe déjà sur `main` est notée pour le ticket 34.
   - Mineure : dans la table, G3 vaut un antislash suivi de `n` littéral ; le test fait foi.

### Remèdes écartés

- **Retoucher les motifs** (correctif du ticket 35, balayage unique « here-doc qui se ferme ou texte cité ») : 32 régressions réelles sur le corpus de ce ticket, 23 231 sur celui du relecteur du 35. Décision de l'architecte après la PR 89 : plus de motifs dans `regles.mjs`.
- **Retirer les corps de here-doc avant de neutraliser les textes cités** (correctif du projet qui a rapporté le 35) : 56 334 régressions réelles chez le relecteur du 35.
- **Les mots seuls, sans lecture éclatée** : lèverait la prudence de 7.9.0. `watch "git log; gh pr merge 1"`, `ssh h "git push -f"`, `find . -exec sh -c '…' \;` ne seraient refusés que si une liste nommait chaque programme qui exécute son argument. C'est un changement de décision, hors d'A-51.
- **Retirer tout corps quoté, quel que soit le consommateur** : `bash <<'EOF'`, `| sh`, `eval "$(cat <<'EOF' …)"` passeraient (R21 à R27), et la monotonie casse dès qu'une apostrophe rendait le refus de 7.9.0 accidentel.
- **Un analyseur en paquet npm**, ou `bash -n` : une dépendance dans un hook posé chez chaque projet, qui tourne avant `pnpm install` ; `bash -n` ne rend que oui ou non, sans la structure, et dépend du bash du poste (3.2 sous macOS).
- **Un module `lecteur.mjs` à part** : les bancs copient `regles.mjs` seul, et un projet qui oublierait le second fichier casserait sa garde (Bash bloqué).

## À faire, dans l'ordre

La session part de `origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier. Les scripts de la « Vérification » se copient dans le dossier temporaire de la session, jamais dans le dépôt : ils nomment `--no-verify`, que `scripts/depot.test.mjs` refuse dans tout `.mjs` suivi hors de ses quatre exceptions.

### 0. Les tests d'abord, vus rouges sur `origin/main`

Insérer ce bloc tel quel dans `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, juste avant `test('lireDependances : la ligne d’en-tête, accents graves ou nus, — ou absente → []', …)`. Puis `node --test skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` : **2 rouges sur 31**. Le premier rend les 12 commandes P, le troisième les 24 R rouges de la table ; le deuxième (G) est vert.

```js
const CTX_33 = { brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' };
const F_33 = 'git push --force origin feat/x';
const ecarts = (commandes, attendu) => commandes.filter((c) => (decisionCommande(c, CTX_33)?.decision ?? 'passe') !== attendu);

test('ticket 33 : un here-doc quoté lu par un consommateur inerte n’est pas lu, même avec une apostrophe (faux refus de 7.9.0)', () => {
  const F = F_33;
  const commandes = [
    "git commit -m \"$(cat <<'EOF'\nfix(chaine): le capitaine seul lance gh pr merge\n\nl'agent ne le lance pas\nEOF\n)\" && git log --format='%s' -1", // P1
    `git commit -m "$(cat <<'EOF'\nfix: plus de ${F}\nl'agent\nEOF\n)"\necho 'ok'`, // P2
    "git commit -m \"$(cat <<'EOF'\nfix: refuser git push origin main\n\nl'agent\nEOF\n)\" && git log --format='%h %s' -1", // P3
    "git commit -F - <<'EOF'\nfix(chaine): le capitaine seul lance gh pr merge\nl'architecte ne le lance pas\nEOF\ngit log --format='%s' -1", // P4
    `git commit -F - <<'EOF'\nfix: plus de ${F}\nl'architecte\nEOF\ngit log --format='%s' -1`, // P5
    "git commit -F - <<-'EOF'\n\tfix: gh pr merge\n\tl'architecte\n\tEOF\necho 'fait'", // P6
    "cat <<\"FIN\"\ngh pr merge 12\nl'architecte\nFIN\necho 'fait'", // P7
    "cat <<'A' > a\ngh pr merge 1 ; l'un\nA\ncat <<'B' > b\nd'autre\nB\n", // P8
    "cat > m <<'EOF'\nfix: gh pr merge\nl'agent\nEOF\ngit commit -F m && git log --format='%s' -1", // P9
    `gh pr create --title "fix: l'agent" --body "$(cat <<'EOF'\n${F}\nl'architecte\nEOF\n)" && echo 'ok'`, // P10
    `git commit -F - <<EOF\nfix: plus de ${F}\nl'agent\nEOF\necho 'ok'`, // P11
    "git commit -F - <<\\EOF\nfix: gh pr merge\nl'agent\nEOF\necho 'ok'", // P12
  ];
  assert.deepEqual(ecarts(commandes, 'passe'), []);
});

test('ticket 33 : ce qui passait passe encore (corps de PR, apostrophes, $\'…\', boucle, deux here-docs sur une ligne)', () => {
  const commandes = [
    "gh pr create --title \"x\" --body \"$(cat <<'EOF'\ngh pr merge\nl'architecte\nEOF\n)\"", // G1
    "git commit -m \"fix: l'agent ne pousse pas\"", // G2
    "git commit -m $'fix: l\\'agent\\n\\ncorps'", // G3
    "python3 - <<'EOF'\nprint(\"l'architecte : gh pr merge, gh repo sync\")\nEOF\n", // G4
    "git commit -m \"$(cat <<'EOF'\nfeat(x): le garde\n\nCorps : l'agent ne pousse pas.\nEOF\n)\"", // G5
    "git commit -m \"$(cat <<'EOF'\nfix: l'agent\nEOF\n)\" && git push origin HEAD:feat/x", // G6
    "cat > m <<'EOF'\nl'agent\nEOF", // G7
    "git commit -m \"$(cat <<'EOF'\nfix: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF\n)\"", // G8
    "git commit -m \"chore: npm install x refusé\"", // G9
    "for f in a b; do echo \"$f\"; done && git log --format='%s' -1", // G10
    "cat <<'A' <<'B'\nl'un : gh pr merge 1\nA\nd'autre\nB\necho 'ok'", // G11
  ];
  assert.deepEqual(ecarts(commandes, 'passe'), []);
});

test('ticket 33 : ce que bash exécute se lit — ligne d’ouverture, après le terminateur, corps donné à un shell, substitutions d’un corps non quoté ; l’illisible est refusé', () => {
  const F = F_33;
  const commandes = [
    "git commit -m \"$(cat <<'EOF'\nl'agent\nEOF\n)\" --no-verify", // R1
    "git commit -m \"$(cat <<'EOF'\nl'agent\nEOF\n)\" -n", // R2
    `cat <<'EOF'\nl'agent\nEOF\n${F}`, // R3
    `cat <<'EOF'\nl'x\nEOF\n; ${F}`, // R4
    "git commit -m \"$(cat <<'EOF'\nl'agent\nEOF\n)\" && git push origin main", // R5
    "git commit -m \"$(cat <<'EOF'\nl'agent\nEOF\n)\" || git push origin develop", // R6
    "cat <<'EOF' > m\nl'agent\nEOF\ngit commit --no-verify -F m", // R7
    "python3 - <<'EOF'\nprint(\"l'architecte : gh pr merge\")\nEOF\ngh pr merge 12", // R8
    `cat <<EOF | ${F}\nl'architecte\nEOF\n`, // R9
    "cat <<'EOF' ; gh pr merge 12\nx\nEOF\n", // R10
    "cat <<'EOF' > m && git commit --no-verify -F m\nx\nEOF\n", // R11
    "cat <<'EOF' ; npm install leftpad\nx\nEOF\n", // R12
    "cat <<EOF ; git push -f origin feat/x\nx\nEOF\n", // R13
    `echo "<<EOF" ; ${F}\ncat <<'EOF'\nx\nEOF\n`, // R14
    "echo $'<<EOF'\ngit push -f\nl'x\nEOF\necho 'y'", // R15
    "x=\"<<EOF\" | echo $(cat <<'EOF'\nz\nEOF\n)\ngh api -f message=\"fix(api): x\" -X PUT repos/o/r/contents/a.md", // R16
    `# <<EOF\n${F}\nEOF`, // R17
    `cat <<<EOF\n${F}\nEOF`, // R18
    `echo $((1<<X))\n${F}\nX`, // R19
    "cat <<EOF ; git push -f\n'\nEOF\necho 'fin'", // R20
    `bash <<'EOF'\n${F}\nEOF`, // R21
    "bash -s <<'EOF'\n# l'agent\ngit commit --no-verify -m x\nEOF", // R22
    "cat <<'EOF' | sh\ngit push origin main\nEOF", // R23
    `source /dev/stdin <<'EOF'\n${F}\nEOF`, // R24
    `python3 - <<'EOF'\nimport os; os.system("${F}")\nEOF`, // R25
    `eval "$(cat <<'EOF'\n${F}\nEOF\n)"`, // R26
    `sh -c "$(cat <<'EOF'\n${F}\nEOF\n)"`, // R27
    `python3 -c "$(cat <<'EOF'\nimport os; os.system('${F}')\nEOF\n)"`, // R28
    "cat <<EOF\nl'agent $(git push -f origin feat/x)\nEOF", // R29
    "cat <<EOF\nl'agent `git push -f origin feat/x`\nEOF", // R30
    "cat <<'EOF'\nl'architecte\nEOF\ngit -c user.name=\"a;b\" push --force origin feat/x\ncat <<'EOF'\nl'architecte\nEOF\n", // R31
    `cat <<'EOF'\nl'architecte\n${F}`, // R32
    `cat <<'EOF'\nl'architecte\nEOFX\n${F}`, // R33
    `cat <<'EOF' > s.sh\n# l'agent\n${F}\nEOF\nbash s.sh && echo 'ok'`, // R34
    "git commit -m \"l'agent\" --no-verify", // R35
    "git commit -m $'l\\'agent' --no-verify", // R36
    "echo l\\'x; git push origin main", // R37
    `echo "${F}"`, // R38
    "echo \"gh pr merge 12\"", // R39
    "eval \"git push -f origin feat/x\"", // R40
    "git commit -m \"--no-verify\"", // R41
    `echo "$x <<EOF" ; ${F}\ncat <<'EOF'\nx\nEOF\n`, // R42
    `cat <<A <<B ; ${F}\nx\nA\ny\nB\n`, // R43
    `echo \\<<EOF ; ${F}\ncat <<'EOF'\nx\nEOF\n`, // R44
    "git commit -m \"fix: l'architecte ; gh pr merge\"", // R45
    `cat <<'EOF'\nfix: gh pr merge\nl'architecte\nEOF\n${F}`, // R46
    "cat <<'EOF'\nl'architecte\nEOF\ngit -c user.name=\"a;b\" push --force origin feat/x", // R47
    "cat <<'EOF'\nl'architecte\nEOF\ngh api -f message=\"fix(api): x\" -X PUT repos/o/r/contents/a.md", // R48
    `echo "<<EOF" ; ${F}`, // R49
    `echo '<<EOF' && ${F}`, // R50
    "echo \"<<X\" ; gh api -X PUT repos/o/r/pulls/1/merge", // R51
    "echo '<<EOF' | echo $(cat <<'EOF'\nz\nEOF\n) | git -c user.name=\"a;b\" push --force origin feat/x", // R52
    "<<'EOF' echo $(cat <<'EOF'\nz\nEOF\n) ; gh api -f message=\"fix(api): x\" -X PUT repos/o/r/contents/a.md\n\tEOF", // R53
  ];
  assert.deepEqual(ecarts(commandes, 'refuser'), []);
});
```

### 1. Le lecteur

`lireCommande` dans `regles.mjs`, décisions 1 à 4, 7 et 8, avec sa JSDoc : ce qu'il lit, ce qu'il rend, ce qui le rend illisible, les trois listes fermées (inertes, exécuteurs, shells) et le choix de lecture d'un corps.

### 2. Les décideurs sur le lecteur

Décisions 5 et 6 : `decisionCommande` refuse d'abord l'illisible (`RAISON_ILLISIBLE`), puis lit L3 pour `COMMANDES_INTERDITES` et `ajouts`, L1 et L2 pour `pushs` et `ecritParGh`. Les exports gardent leurs sorties testées. Les découpages par motifs disparaissent.

### 3. Les tests du lecteur

Dans `regles.test.mjs` seulement (les autres fichiers de test ne changent pas), au moins :
- **l'interface** (décision 7) : `lireCommande('HUSKY=0 git -c core.hooksPath=x commit -m "a b" <<<"c"')` rend une affectation `HUSKY`, cinq mots dont `a b` cité, un here-string `c`, et `illisible` nul ; et, sur `cat <<'EOF' ; npm install x\nl'a\nEOF\ngit log`, deux commandes de tête, `cat` avec un here-doc quoté retiré, `npm install x`, puis `git log` ;
- **l'illisible** : chaque motif de la décision 2 rend `RAISON_ILLISIBLE`, et `decisionCommande` la rend avant tout autre refus ;
- **les trois lectures d'un corps** (décision 4) : un corps retiré, un corps lu comme commandes, un corps relu par prudence, chacun avec ce que `lireCommande` en rend ;
- **le temps** : le cas d (`'cat <<EOF\n'.repeat(30000) + 'git push --force origin feat/x'`) est refusé en moins de 5 s.

### 4. Les textes

`skills/chaine/socle-chaine-de-production/references/CONTENU.md:13`, le paragraphe de `garde-commandes`. Ce qui est faux après ce ticket se récrit :
- « `segmentsDeCommande` fait ce découpage pour tous les lecteurs » ;
- « la commande se lit en plus avec les séparateurs de ses textes cités neutralisés, sauf dans un texte qui porte une substitution, lu comme avant » ;
- « un `git push` aussi sur le découpage d'avant (…) restent donc refusés, par prudence ».

À la place, quelques phrases :
- un lecteur de jetons lit la commande comme bash ;
- un here-doc quoté qu'aucun shell ni aucun exécuteur ne lit n'est pas lu (un message par `git commit -F - <<'EOF'` ou `"$(cat <<'EOF' … )"` passe, même s'il cite un push forcé) ;
- la ligne d'ouverture, ce qui suit le terminateur, les substitutions d'un corps non quoté et le corps donné à un shell se lisent comme des commandes ;
- ce qu'il ne sait pas lire est refusé ;
- la prudence sur les textes cités demeure (`echo "gh pr merge 12"` est refusé).

La liste « Restent hors de sa lecture » gagne les limites du « Hors périmètre » ci-dessous. Rien d'autre ne change dans ce fichier.

### 5. La version

`.claude-plugin/plugin.json:3` : `"version": "7.9.0"` devient `"version": "7.10.0"` (décision 10). Rien d'autre ne change dans ce fichier.

### 6. La preuve, la revue, la PR

« Vérification », points 3 à 6, puis la PR vers `main`, titre `feat(chaine): la garde de commandes lit la commande par jetons, comme bash (plugin 7.10.0)` (ou la version de la décision 10). Le corps porte :
- la sortie du banc de monotonie, et sa mutation ;
- les temps de `temps.mjs`, `main` et branche ;
- la section de `/security-review` de chaque sommet ;
- les commandes trouvées en plus (décision 11).

## Surfaces

| Surface | Preuve |
| --- | --- |
| un here-doc quoté qu'aucun shell ne lit n'est plus pris pour des commandes, même avec une apostrophe : les 12 faux refus de 7.9.0 passent | `regles.test.mjs` « ticket 33 : un here-doc quoté lu par un consommateur inerte n’est pas lu, même avec une apostrophe (faux refus de 7.9.0) » |
| ce qui passait passe encore | `regles.test.mjs` « ticket 33 : ce qui passait passe encore (corps de PR, apostrophes, $'…', boucle, deux here-docs sur une ligne) » |
| ce que bash exécute est lu (ligne d'ouverture, après le terminateur, corps donné à un shell, substitutions d'un corps non quoté, `<<` cité, en commentaire, `<<<`, `$(( ))`) ; l'illisible est refusé | `regles.test.mjs` « ticket 33 : ce que bash exécute se lit — ligne d’ouverture, après le terminateur, corps donné à un shell, substitutions d’un corps non quoté ; l’illisible est refusé » |
| l'interface que lira le ticket 34 | `regles.test.mjs`, test de la session (§ 3, l'interface) |
| la raison d'illisibilité, avant tout autre refus | `regles.test.mjs`, test de la session (§ 3, l'illisible) |
| les trois lectures d'un corps | `regles.test.mjs`, test de la session (§ 3) |
| temps linéaire | `regles.test.mjs`, test de la session (§ 3, le temps) ; `temps.mjs`, cas a à f, 1 s au plus, dans la PR |
| rien de ce que 7.9.0 refuse et que bash exécute ne passe | sortie de `monotonie.mjs` dans la PR : `REGRESSIONS REELLES … : 0`, et sa mutation à plus de 0 |
| les décisions ne changent pas | les 54 tests existants de `references/agent/`, verts sans changement ; `git diff origin/main -- '*.test.mjs'` sans ligne retirée |
| la documentation | `CONTENU.md:13`, relu en contre-revue (pas de test) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

Joué le 2026-11-16 dans un `git worktree` jetable de `fa7d3eb`, `TMPDIR` sous un dossier jetable :

- `pnpm install --frozen-lockfile && pnpm test` : **499 sur 499** (196 s).
- La table des cas, par `decisionCommande` et par l'oracle (le même que celui de `monotonie.mjs`).
- Le bloc du § 0, inséré dans une copie de `regles.test.mjs` : **2 rouges sur 31**. Écarts : 12 (P) et 24 (R) ; le test G est vert. Les commandes du bloc ont été comparées une à une à celles de la table : identiques.
- `monotonie.mjs`, `main` contre `main` : 245 337 commandes, 736 011 couples, 358 615 refusés par 7.9.0, **0** passent après (15 s). `main` contre le correctif du ticket 35 (§ 1 du 35 appliqué mot pour mot à une copie de `regles.mjs` de `fa7d3eb`) :
  - 557 couples refusés avant passent après, dont **32 régressions réelles** (par exemple `cat <<'EOF' && git push \⏎  --force origin feat/x`, ligne d'ouverture continuée) et 525 faux refus levés ;
  - 89 751 refus nouveaux ;
  - durée : 26 s.

  Le banc mord.
- `temps.mjs` : le tableau du « Coût ».

**Non établi** :

- **Le lecteur n'a pas été prototypé.** Les décisions 4 et 5 sont dérivées de la lecture de `regles.mjs`, des cas et de l'oracle, pas d'une implémentation. Le banc de monotonie est la preuve qu'elles tiennent. Si une décision s'avère fausse (une régression réelle qu'aucune règle conforme au ticket n'évite), la session l'écrit dans la PR et à l'architecte, au lieu de la contourner.
- **Le corpus du relecteur du ticket 35** (225 732 commandes) est introuvable. Celui-ci le remplace, avec les formes que ce relecteur nommait (guillemets à `$`, commentaire, `<<<`, `\<<`, `$((1<<…))`, corps donné à un shell, ligne d'ouverture, apostrophes).
- **Les limites de l'oracle** : `sudo` réinitialise `PATH` (le vrai `git` serait lancé, non journalisé) ; un programme absent du poste (`watch`, `parallel`, `ssh` vers un hôte) ne lance rien ; les journaux ne lancent aucun hook git ; le bash du poste est 5.2 (macOS a 3.2).

Pour la session :

1. Le § 0 : 2 rouges sur 31. Puis les §§ 1 à 3 : `node --test skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` vert.
2. `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus les tests ajoutés** (au moins 506 : 499, les 3 du § 0, au moins 4 du § 3). Contrôles du diff :
   - `git diff origin/main --stat` ne montre que les quatre fichiers des « Fichiers chauds » ;
   - `git diff origin/main -- '*.test.mjs' | grep -c '^-[^-]'` rend **0**.
3. **La monotonie.** Dans un dossier temporaire, hors du dépôt :
   - `avant.mjs` : `git show origin/main:skills/chaine/socle-chaine-de-production/references/agent/regles.mjs` ;
   - `apres.mjs` : le `regles.mjs` de la branche ;
   - le journal des tests : `regles.test.mjs` de `origin/main` copié dans `recueil/`, avec ce `recueil/regles.mjs`, puis `node --test recueil/regles.test.mjs` (4 tests de la copie échouent, sans importance : 277 commandes distinctes) :

   ```js
   import * as m from '../avant.mjs';
   import { appendFileSync } from 'node:fs';
   export * from '../avant.mjs';
   export function decisionCommande(c, ctx) { appendFileSync(new URL('./journal.jsonl', import.meta.url), JSON.stringify(c) + '\n'); return m.decisionCommande(c, ctx); }
   ```

   Puis `node monotonie.mjs avant.mjs apres.mjs recueil/journal.jsonl` : **`REGRESSIONS REELLES (bash lance un appel gardé): 0`**, sortie 0. Les graines par défaut (8 × 4 000 tirages) ; la session peut élargir (`--graines 32`), jamais réduire. Le banc doit mordre : contre une copie de `apres.mjs` dont le lecteur ne lit plus ce qui suit le terminateur d'un here-doc, il rend plus de 0, sortie 1. La PR porte les deux sorties, les comptes de faux refus levés et de refus nouveaux, dix exemples de chacun.
4. **Le temps** : `for k in a b c d e f; do node temps.mjs apres.mjs $k; done`, puis le même sur `avant.mjs`. Chaque cas en 1 s au plus sur la branche, jamais plus que `main`.
5. `/security-review` sur chaque sommet poussé (décision 11).
6. La PR (§ 6) ; un mot à l'architecte.

### `monotonie.mjs`

```js
// Monotonie à oracle bash : rien de ce que AVANT refuse et que bash exécute ne passe APRÈS.
// Usage : node monotonie.mjs <avant/regles.mjs> <apres/regles.mjs> [journal.jsonl] [--graines 8] [--tirages 4000]
// Sortie 0 si aucune régression réelle, 1 sinon.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const opt = (nom, defaut) => { const i = args.indexOf(nom); return i < 0 ? defaut : Number(args.splice(i, 2)[1]); };
const GRAINES = opt('--graines', 8), TIRAGES = opt('--tirages', 4000);
const [fa, fb, journal] = args;
const A = await import(resolve(fa)), B = await import(resolve(fb));
const BRANCHES = ['feat/x', 'sujet/demo', 'develop'];
const ctx = (b) => ({ brancheCourante: () => b, brancheParDefaut: () => 'develop' });
const refuse = (M, c, b) => M.decisionCommande(c, ctx(b))?.decision === 'refuser';

// L'oracle : bash joue la commande dans un dossier jetable ; git, gh, npm, yarn, pnpm sont des journaux (rien ne s'exécute).
const BANC = mkdtempSync(join(tmpdir(), 'monotonie-'));
mkdirSync(join(BANC, 'stub'));
for (const p of ['git', 'gh', 'npm', 'yarn', 'pnpm']) {
  writeFileSync(join(BANC, 'stub', p), `#!/bin/bash\nprintf '%s\\x1f' ${p} "$@" >> "$JOURNAL"; printf '\\x1e' >> "$JOURNAL"\n`);
  chmodSync(join(BANC, 'stub', p), 0o755);
}
const ENV = { PATH: `${BANC}/stub:/usr/bin:/bin`, JOURNAL: join(BANC, 'journal') };
if (spawnSync('bash', ['-c', 'command -v git'], { env: ENV, encoding: 'utf8' }).stdout.trim() !== `${BANC}/stub/git`) throw new Error('oracle : git n’est pas le journal');
function oracle(commande) {
  const bac = join(BANC, 'bac');
  rmSync(bac, { recursive: true, force: true });
  mkdirSync(bac);
  writeFileSync(ENV.JOURNAL, '');
  // Un chemin absolu vers un programme gardé est joué sur son journal ; la garde, elle, a lu le texte d'origine.
  const jouee = commande.replace(/(?:\/usr)?(?:\/local)?\/s?bin\/(git|gh|npm|yarn|pnpm)\b/g, `${BANC}/stub/$1`);
  spawnSync('bash', ['-c', jouee], { cwd: bac, env: { ...ENV, HOME: bac }, encoding: 'utf8', timeout: 5000, input: '' });
  return readFileSync(ENV.JOURNAL, 'utf8').split('\x1e').filter(Boolean).map((r) => r.split('\x1f').slice(0, -1));
}
// Un appel est gardé si AVANT refuse ses arguments, chacun neutralisé (blancs, séparateurs, guillemets, `$` → `_`).
const garde = (appel, b) => refuse(A, appel.map((x) => x.replace(/[\s;&|()<>'"\\$`]/g, '_')).join(' '), b);

// 1. Les refus de base : commandes reçues par decisionCommande dans les tests, et une liste écrite.
const base = new Set(journal && existsSync(journal) ? readFileSync(journal, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const F = 'git push --force origin feat/x';
for (const c of [
  F, 'git push -f origin feat/x', 'git push origin +feat/x', 'git push origin develop', 'git push origin HEAD:main', 'git push origin HEAD:sujet/demo',
  'git push', 'git push --all', 'git push origin HEAD:$B', 'git commit --no-verify -m x', 'git commit -n -m x', 'git rebase origin/sujet/x',
  'npm install leftpad', 'yarn add zod', 'pnpm add zod', 'gh pr merge 12', 'gh api -X PUT repos/o/r/pulls/1/merge', 'gh repo sync o/r',
  'gh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md', 'git -c user.name="a;b" push --force origin feat/x', "git -c user.name='a;b' push -f",
  'git -C "a b" push --force origin feat/x', 'env X="a b" git push --force origin feat/x', 'git "push" -f', '/usr/bin/git push -f', '\\git push -f',
]) base.add(c);

// 2. Les contextes : la base derrière, devant, dans et autour de here-docs de toutes sortes.
const DELIMS = ["'EOF'", '"EOF"', 'EOF', '\\EOF', "E'O'F"];
const CORPS = ['x', "l'architecte", "l'a ; d'b", 'gh pr merge 1', "l'x $(echo y)", "l'x `echo y`"];
const CONSO = ['cat', 'git commit -F -', 'bash', 'sh', 'bash -s', 'source /dev/stdin', 'python3 -', 'cat > s.sh', 'xargs echo'];
const ctxs = [];
for (const d of DELIMS) for (const corps of CORPS) for (const conso of CONSO) {
  const fin = d.replace(/['"\\]/g, '');
  ctxs.push((b) => `${conso} <<${d}\n${corps}\nEOF\n${b}`, (b) => `${conso} <<${d}\n${corps}\n${b}\n${fin}\n`, (b) => `${conso} <<${d} ; ${b}\n${corps}\n${fin}\n`);
}
ctxs.push(
  (b) => `cat <<EOF | ${b}\nl'x\nEOF\n`, (b) => `cat <<'EOF' && ${b}\nl'x\nEOF\necho 'y'`, (b) => `cat <<'EOF' | sh\n${b}\nEOF`, (b) => `eval "$(cat <<'EOF'\n${b}\nEOF\n)"`,
  (b) => `sh -c "$(cat <<'EOF'\n${b}\nEOF\n)"`, (b) => `git commit -m "$(cat <<'EOF'\nl'agent\nEOF\n)" && ${b}`, (b) => `git commit -m "$(cat <<'EOF'\nl'agent\nEOF\n)"\n${b}`,
  (b) => `cat <<EOF\nl'agent $(${b})\nEOF`, (b) => `cat <<EOF\nl'agent \`${b}\`\nEOF`, (b) => `cat <<'EOF' > s.sh\n# l'x\n${b}\nEOF\nbash s.sh && echo 'ok'`,
  (b) => `echo "<<EOF" ; ${b}\ncat <<'EOF'\nx\nEOF\n`, (b) => `echo "$x <<EOF" ; ${b}\ncat <<'EOF'\nx\nEOF\n`, (b) => `echo '<<EOF' && ${b}\nEOF`, (b) => `echo \\<<EOF ; ${b}\ncat <<'EOF'\nx\nEOF\n`,
  (b) => `# <<EOF\n${b}\nEOF`, (b) => `cat <<<EOF\n${b}\nEOF`, (b) => `echo $((1<<X))\n${b}\nX`, (b) => `cat <<A <<B ; ${b}\nx\nA\ny\nB\n`,
  (b) => `cat <<'EOF'\nl'architecte\nEOF\n${b}\ncat <<'EOF'\nl'architecte\nEOF\n`, (b) => `cat <<'EOF'\nl'x\nEOFX\n${b}`, (b) => `cat <<'EOF'\nl'x\nEOF;\n${b}\nEOF`,
  (b) => `cat <<-EOF\n\tl'x\n\tEOF\n${b}`, (b) => `x="<<EOF" | echo $(cat <<'EOF'\nz\nEOF\n)\n${b}`, (b) => `echo l\\'x; ${b}`, (b) => `${b} # l'x`, (b) => `${b} <<'EOF'\nl'x\nEOF\necho 'y'`,
);
const corpus = new Set(base);
for (const b of base) for (const c of ctxs) corpus.add(c(b));

// 3. Les tirages : fragments et séparateurs, graines fixes (générateur congruentiel, reproductible).
const FRAGMENTS = [...base].slice(0, 80).concat(["<<'EOF'", '<<EOF', '<<-EOF', '<<"EOF"', '<<<', '\nEOF\n', '\nEOFX\n', "l'x", '"a b"', "'c'", '$(', ')', '`', '#', '$((1<<', '))', 'cat', 'bash', '| sh', 'echo']);
const SEP = ['\n', ' ; ', ' && ', ' | ', ' ', ' || '];
for (let g = 1; g <= GRAINES; g++) {
  let x = g;
  const hasard = (n) => ((x = (x * 1103515245 + 12345) % 2147483648) % n);
  for (let t = 0; t < TIRAGES; t++) {
    let c = '';
    for (let k = 1 + hasard(5); k > 0; k--) c += FRAGMENTS[hasard(FRAGMENTS.length)] + SEP[hasard(SEP.length)];
    corpus.add(c);
  }
}

let couples = 0, refusesAvant = 0, candidats = 0;
const reelles = [], leves = [], nouveaux = [];
for (const c of corpus) {
  let joue = null;
  for (const b of BRANCHES) {
    couples++;
    const ra = refuse(A, c, b), rb = refuse(B, c, b);
    if (ra) refusesAvant++;
    if (!ra && rb) nouveaux.push([b, c]);
    if (!ra || rb) continue;
    candidats++;
    joue ??= oracle(c);
    const gardes = joue.filter((appel) => garde(appel, b));
    (gardes.length ? reelles : leves).push([b, c, gardes.map((a) => a.join(' '))]);
  }
}
rmSync(BANC, { recursive: true, force: true });
console.log(`commandes: ${corpus.size}, couples (commande, branche): ${couples}, refusés par AVANT: ${refusesAvant}`);
console.log(`refusés avant, passent après: ${candidats} — dont REGRESSIONS REELLES (bash lance un appel gardé): ${reelles.length}, faux refus levés: ${leves.length}`);
for (const [b, c, g] of reelles.slice(0, 15)) console.log('   REGRESSION', b, JSON.stringify(c), '→', JSON.stringify(g));
console.log(`nouveaux refus (passe avant, refusé après): ${nouveaux.length}`);
for (const [b, c] of nouveaux.slice(0, 5)) console.log('  ', b, JSON.stringify(c));
process.exitCode = reelles.length ? 1 : 0;
```

Ce qu'il génère :
- **une base** : les commandes que reçoit `decisionCommande` dans les tests de `origin/main`, et une liste écrite de refus (push forcé, vers un sujet, `develop`, `main`, nu, `--all`, `$B`, `--no-verify`, `-n`, `npm`, `yarn`, `pnpm add`, `gh pr merge`, `gh api` en écriture, séparateurs cités, `/usr/bin/git`, `\git`) ;
- **des contextes**, chaque base placée derrière, dans et sur la ligne d'ouverture de here-docs : cinq délimiteurs (`'EOF'`, `"EOF"`, `EOF`, `\EOF`, `E'O'F`), six corps (avec et sans apostrophe, avec substitution), neuf consommateurs (`cat`, `git commit -F -`, `bash`, `sh`, `bash -s`, `source /dev/stdin`, `python3 -`, `cat > s.sh`, `xargs echo`) ; plus 26 formes nommées (`| sh`, `eval "$(cat …)"`, `sh -c "$(cat …)"`, corps non quoté à substitution, fichier écrit puis lancé, `<<EOF` cité, à `$`, échappé, en commentaire, `<<<`, `$((1<<X))`, deux here-docs sur une ligne, entre deux here-docs à apostrophe, `EOFX`, `EOF;`, `<<-`, apostrophe échappée, commentaire final) ;
- **des tirages** : 8 graines × 4 000 commandes, de un à cinq fragments (bases, opérateurs de here-doc, terminateurs, apostrophes, guillemets, `$(`, accents graves, `#`, `$((1<<`, `cat`, `bash`, `| sh`) joints par saut de ligne, `;`, `&&`, `||`, `|` ou blanc.

Chaque commande se juge sur `feat/x`, `sujet/demo` et `develop`. L'oracle ne joue que les couples refusés avant et passés après ; un appel journalisé est « gardé » si 7.9.0 le refuse seul, arguments neutralisés.

### `temps.mjs`

```js
// Usage : node temps.mjs <regles.mjs> <cas> — temps de decisionCommande sur un pire cas.
import { resolve } from 'node:path';
const R = await import(resolve(process.argv[2]));
const F = 'git push --force origin feat/x';
const CAS = {
  a: `cat <<'EOF'\nl'x\n` + '\n'.repeat(30000) + F,              // non fermé, apostrophe, 30 000 sauts de ligne
  b: `cat <<'EOF'\nx\n` + '\n'.repeat(30000) + F,                // non fermé, sans apostrophe
  c: `cat <<EOF\n`.repeat(3750) + F,                              // 3 750 lignes « cat <<EOF », non fermées (37 530 caractères)
  d: `cat <<EOF\n`.repeat(30000) + F,                             // 30 000 lignes « cat <<EOF », non fermées (300 030 caractères)
  e: `cat <<'EOF'\n` + "l'x ".repeat(7500) + `\n${F}`,          // non fermé, 30 000 caractères sur une ligne
  f: `cat <<'E'\nl'x\nE\n`.repeat(2500) + F,                    // 2 500 here-docs fermés à apostrophe (40 030 caractères)
};
const c = CAS[process.argv[3]];
const t = process.hrtime.bigint();
const d = R.decisionCommande(c, { brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' });
console.log(process.argv[3], c.length, 'car.', d?.decision ?? 'passe', `${Number(process.hrtime.bigint() - t) / 1e9} s`);
```

## Hors périmètre

- **Le ticket 34**, sur ce lecteur : `HUSKY`, `core.hooksPath`, `include.path`, `GIT_CONFIG_*`, `--config-env`, `git update-ref` vers `refs/remotes/`, le push « matching », `git pull --no-verify`, `git am -n`, et les faux refus `git commit -m "--no-verify"` (R41) et `git commit -mn`.
- **Des arguments venus de l'entrée** : `cat <<'EOF' | xargs git push`, avec un corps `-f origin feat/x`, passe sur `main` et passera ; bash lance `git push -f origin feat/x`. C'est une décision (un push dont les arguments ne se lisent pas), pas un découpage.
- **Un programme donné par une expansion** : `$(echo git) push -f origin feat/x` passe sur `main` et passera. C'est aussi une décision.
- **Un hook git écrit par la commande, puis lancé par git** (`cat > .husky/pre-commit <<'EOF'` … puis `git commit`) : il passe sur `main` sans apostrophe, et l'oracle ne lance aucun hook. Il relève du ticket 34.
- **La prudence sur les textes cités** (L2) : `git commit -m "fix: l'architecte ; gh pr merge"` (R45) et `echo "gh pr merge 12"` restent refusés. La lever serait une décision, à instruire à part.
- **Ce que la configuration porte** (`git -c remote.origin.push=+…`, alias git) : limite déjà écrite dans `CONTENU.md`.

## Comments

- 2026-11-16 — Écrit par un agent (opus) sur `fa7d3eb` (plugin 7.9.0, 499 tests), sur A-51.
  - 76 cas joués sur `main` avec un oracle bash : 36 rouges, soit 12 faux refus et 24 commandes que bash exécute et que la garde laisse passer.
  - Banc de monotonie à oracle écrit et éprouvé : 0 de `main` contre `main`, 32 régressions réelles contre le correctif du ticket 35.
  - Pire cas mesuré : 71,9 s pour 300 030 caractères, au-delà du délai de 60 s du hook.
  - Le lecteur n'est pas prototypé : les décisions 4 et 5 se prouvent par le banc.
  - Le ticket 35 entre ici comme liste de cas (P4 à P8, G1, G4, R8 à R10, R14, R16, R32, R33, R46 à R53).
