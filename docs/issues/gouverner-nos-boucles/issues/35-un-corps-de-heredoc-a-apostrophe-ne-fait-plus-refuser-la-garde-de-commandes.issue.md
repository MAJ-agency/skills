# La garde de commandes lit le corps d'un heredoc comme des commandes dès qu'il porte une apostrophe : la lecture à séparateurs cités retire d'abord les corps de heredoc, de gauche à droite avec les textes cités

Status: needs-triage
Type: défaut
Label: contre-revue
Modèle: sonnet — un bloc de code donné entier à la place d'une ligne de `regles.mjs`, deux tests donnés mot pour mot, une phrase de documentation et la version ; tout est joué sur une copie jetable de `origin/main` (voir « Vérification ») ; rien n'est à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `.claude-plugin/plugin.json`

## Le besoin

**Le fait**, rapporté le 2026-11-14 par un projet qui pose le socle 7.7.0 : la garde de commandes (`garde-commandes`, hook `PreToolUse` de Bash) refuse à tort une commande qui passe un texte français par un here-doc, par exemple `python3 - <<'EOF'` … `print("l'architecte : …")` … `EOF`, ou un message de commit ou de PR (`git commit -F - <<'EOF'`). Le motif est fréquent : toute session qui écrit un message en français ouvre un here-doc, et le français porte des apostrophes. Le refus tombe sur un texte qui n'est pas une commande, et la session perd un tour à le contourner.

**La cause** : `segmentsDeCommande` (`regles.mjs`) lit la commande deux fois, brute, puis avec les séparateurs de ses textes cités neutralisés (7.7.0, pour `gh api -f message="fix(api): x" -X PUT …` et `git -c user.name="a;b" push …`). La seconde lecture neutralise les textes cités **avant** que `lireSegments` retire les corps de here-doc. Une apostrophe du corps (`l'architecte`) ouvre alors un faux texte cité qui court jusqu'à la prochaine apostrophe, après la ligne de fin du here-doc : cette ligne devient un `_`, le here-doc ne se ferme plus, et son corps se lit comme des commandes. La première lecture, brute, retire les corps d'abord et n'a pas ce défaut ; la décision refuse si l'une des deux lectures refuse.

Quand le ticket est fait : un message ou un script en français passé par here-doc, même cité (`gh pr merge`, `git push --force` dans le texte), passe ; tout ce que `origin/main` refusait et qui est une vraie commande reste refusé (la monotonie, § « Vérification »).

## Où

Base : `origin/main` à `cadb4e5` (plugin **7.7.0**, **456 tests**). Les lignes ont été relues le 2026-11-14. La session les retrouve par leur texte.

- `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `segmentsDeCommande`, la ligne `const cites = commande.replace(/'[^']*'|"(?:[^"\\$`]|\\[^$`])*"/g, (cite) => cite.replace(/[;&|()\s]/g, '_'));` (≈ :225). Le seul lecteur de cette lecture en plus est `segmentsDeCommande`.
- La première lecture, `lireSegments(commande)`, n'est pas touchée : elle passe par `sansGuillemets`, qui retire les corps de here-doc d'abord.

### Reproduction, copie jetable de `cadb4e5`

Sur `origin/main`, `decisionCommande(commande, { brancheCourante: () => 'feat/x' })` rend `refuser` pour ces commandes, qui ne lancent rien de dangereux (le texte dangereux n'est que le corps d'un here-doc) :

| Commande (`\n` : saut de ligne) | `origin/main` | correctif |
| --- | --- | --- |
| `git commit -F - <<'EOF'\nfix(chaine): le capitaine seul lance gh pr merge\nl'architecte ne le lance pas\nEOF\ngit log --format='%s' -1` | refuser | passe |
| `git commit -F - <<'EOF'\nfix: plus de git push --force origin feat/x\nl'architecte\nEOF\ngit log --format='%s' -1` | refuser | passe |
| `git commit -F - <<-'EOF'\n\tfix: gh pr merge\n\tl'architecte\n\tEOF\necho 'fait'` | refuser | passe |
| `cat <<"FIN"\ngh pr merge 12\nl'architecte\nFIN\necho 'fait'` | refuser | passe |
| `cat <<'A' > a\ngh pr merge 1 ; l'un\nA\ncat <<'B' > b\nd'autre\nB\n` (deux here-docs) | refuser | passe |

Il faut deux conditions : une ligne du corps **avant** l'apostrophe qui contient le texte dangereux (un `gh pr merge` ou un `git push --force` lus comme commande), et une seconde apostrophe **après** la ligne de fin (`--format='%s'`, `echo 'fait'`, le here-doc suivant). Sans la seconde, rien ne s'apparie. L'exemple du projet, tel quel (`print("l'architecte : gh pr merge, gh repo sync")`, l'apostrophe est à l'intérieur de guillemets doubles), **passe déjà sur `origin/main`** : il n'est pas rouge, il reste dans le test comme cas de passage.

La cause est bien la seconde lecture seule : ces cinq commandes, jouées sur `origin/main` dont `segmentsDeCommande` ne garde que la première lecture, passent toutes.

**Dans l'autre sens**, le même défaut cache des vraies commandes. Sur `origin/main`, ces commandes **passent** alors qu'un shell les exécute : `echo "<<EOF" ; git push --force origin feat/x\ncat <<'EOF'\nx\nEOF\n` (un `<<EOF` cité ouvre, pour la première lecture, un here-doc qui avale le push), `cat <<EOF | git push --force origin feat/x\nx\nEOF\n` et `cat <<'EOF' ; gh pr merge 12\nx\nEOF\n` (la ligne d'ouverture d'un here-doc est une ligne de commande, que le motif retire avec le corps). Le correctif les refuse, par la seconde lecture. La première lecture garde ces trous, hors de ce ticket.

## Décisions

1. **Un seul balayage, de gauche à droite, comme le shell** : un motif unique qui reconnaît, au premier des deux qui se présente, un here-doc qui se ferme ou un texte cité. Un `<<EOF` **dans** un texte cité n'ouvre rien (le texte cité est lu en premier : `echo "<<EOF" ; git push -f` garde son push) ; une apostrophe **dans** un corps de here-doc n'ouvre rien (le here-doc est lu en premier). Un here-doc dont le délimiteur ne ferme jamais, ou ferme sur `EOFX`, n'est pas retiré : son texte reste lu, donc refusé s'il porte une commande dangereuse.
2. **Le correctif du projet n'est pas repris tel quel** (retirer les corps de here-doc par un `.replace` avant la neutralisation des textes cités). Il lève bien le faux refus, mais il fait **passer ce que `origin/main` refuse** : un `<<EOF` cité ouvre un here-doc qui avale la suite (`x="<<EOF" | echo $(cat <<'EOF'\nz\nEOF\n)\ngh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md` : refusé avant, passe avec lui). Joué, avec un shell comme oracle (voir « Vérification »), il laisse passer 6 commandes sur 16 000 dont `bash` lancerait le `gh` ou le `git push --force`.
3. **La ligne d'ouverture du here-doc reste lue** (`cat <<EOF | git push -f`, `cat <<'EOF' ; gh pr merge 12` : le shell les exécute) : le motif en garde le reste de la ligne, et le remplace par `<_heredoc` suivi de cette ligne. Sans cela, un correctif qui retire aussi la ligne d'ouverture laisse passer ce que la seconde lecture refusait par accident (la fuzz de la vérification l'a trouvé : `<<'EOF' echo $(cat <<'EOF' … ) ; gh api … -X PUT …`).
4. **Les `<` ne survivent pas à la neutralisation** : le corps retiré laisse `<_heredoc` (un seul `<`), et les `<` des textes cités et de la ligne d'ouverture deviennent `_`. `lireSegments` repasse par `sansGuillemets`, dont le motif de here-doc rouvrirait sinon un here-doc sur un `<<EOF` cité, ou sur un `<<'EOF'` resté dans la ligne d'ouverture, et avalerait la commande qui suit.
5. **La ligne de fin du motif s'écrit `\n[^\S\n]*`, pas `\n\s*`** : même fin de motif (le motif retire de `<<` à la fin de la ligne de fin, quel que soit le nombre de lignes vides avant elle), mais sans balayage au carré. Avec `\n\s*`, un here-doc qui ne se ferme jamais, suivi de 30 000 sauts de ligne, coûte un balayage de plus que `origin/main` (+ 12 à 20 % mesurés : le temps de la garde, 60 s au plus, est déjà de 7 à 15 s sur `origin/main` pour ce cas, voir « Hors périmètre »). Avec `[^\S\n]*`, le coût est celui de `origin/main`.
6. **Version : correctif (patch), 7.7.1.** Une correction de la garde posée, aucun skill ni gabarit ajouté. **Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre la version qui suit la sienne.**
7. PR vers `main`, titre `fix(chaine): un corps de heredoc à apostrophe ne fait plus refuser la garde de commandes (plugin 7.7.1)`. `Label: contre-revue` : PR ouverte hors brouillon, **sans `à-fusionner`**, et un mot à l'architecte dès la PR livrée. La revue passe `/security-review` (la garde est un hook de sécurité). Commits sous les hooks, jamais `--no-verify`. Aucun test retiré, sauté ni assoupli.

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges sur `origin/main`

Ajouter les deux tests du § 2 seuls dans `regles.test.mjs`, puis `node --test skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` : **2 rouges** sur 30 (`un corps de heredoc à apostrophes ne cache ni ne fabrique une commande gh` et `un << dans un texte cité n’ouvre pas de heredoc, …`). Puis le § 1 : 30 verts.

### 1. `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`

**a.** Insérer ces constantes entre `let dernierDecoupage = { commande: null, segments: [] };` et le commentaire `/**\n * Les segments d'une commande shell` :

```js
/** Un texte cité : entre apostrophes, ou entre guillemets doubles sans substitution. */
const TEXTE_CITE = /'[^']*'|"(?:[^"\\$`]|\\[^$`])*"/;
/**
 * Un heredoc qui se ferme (délimiteur, reste de la ligne d'ouverture, corps), ou un texte cité : le premier des deux, de gauche
 * à droite. La ligne de fin s'écrit `\n[^\S\n]*` et non `\n\s*` comme ailleurs : même fin de motif, mais `\s*` rejoue chaque suite de
 * sauts de ligne depuis chacun d'eux, et un heredoc qui ne ferme jamais, suivi de 30 000 sauts de ligne, coûterait de plus un balayage au carré.
 */
const HEREDOC_OU_TEXTE_CITE = new RegExp(`<<-?\\s*(['"]?)(\\w+)\\1([^\\n]*)\\n[\\s\\S]*?\\n[^\\S\\n]*\\2(?=\\s|$)|${TEXTE_CITE.source}`, 'g');
/** Le texte dont les séparateurs, les blancs et les `<` des textes cités sont devenus `_`. */
const neutraliser = (texte) => texte.replace(new RegExp(TEXTE_CITE, 'g'), (cite) => cite.replace(/[;&|()<\s]/g, '_'));
```

**b.** Dans `segmentsDeCommande`, remplacer la ligne `const cites = commande.replace(/'[^']*'|"(?:[^"\\$`]|\\[^$`])*"/g, (cite) => cite.replace(/[;&|()\s]/g, '_'));` (le commentaire qui la précède, « Un séparateur cité n'en est pas un … », reste) par :

```js
  // Un seul balayage, de gauche à droite, comme le shell : un `<<EOF` hors de tout texte cité ouvre un here-doc, dont
  // le corps est retiré s'il se ferme, et dont la ligne d'ouverture reste lue (`cat <<EOF | git push -f`) ; sans quoi
  // l'apostrophe d'un texte français (`l'architecte`) ouvre un faux texte cité qui avale la ligne de fin, et le corps
  // se lit comme des commandes. Un `<<EOF` dans un texte cité n'ouvre rien (`echo "<<EOF" ; git push -f`). Le corps
  // retiré laisse `<_heredoc`, et les `<` des textes cités et de la ligne d'ouverture deviennent `_` : la lecture
  // suivante n'y voit plus de here-doc.
  const cites = commande.replace(
    HEREDOC_OU_TEXTE_CITE,
    (lu, _guillemet, _delimiteur, ligne) => (ligne === undefined ? neutraliser(lu) : `<_heredoc${neutraliser(ligne).replace(/</g, '_')}`),
  );
```

Le reste de la fonction (`const segments = Object.freeze(…)`) ne change pas, ni `lireSegments`, `sansGuillemets`, `sansTexte`, `segmentsDAvant`, qui gardent leur motif `\n\s*`.

### 2. `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`

Insérer ces deux tests tels quels, juste avant `test('lireDependances : la ligne d’en-tête, accents graves ou nus, — ou absente → []', …)` :

```js
test('un corps de heredoc à apostrophes ne cache ni ne fabrique une commande gh', () => {
  const ctx = { brancheCourante: () => 'feat/x' };
  // Le texte dangereux n'est que le corps d'un heredoc : l'apostrophe de `l'architecte` ne doit pas ouvrir un faux texte
  // cité qui avale la ligne de fin, et la ligne suivante (`git log --format='%s'`) ne doit pas le fermer.
  for (const commande of [
    "git commit -F - <<'EOF'\nfix(chaine): le capitaine seul lance gh pr merge\nl'architecte ne le lance pas\nEOF\ngit log --format='%s' -1",
    "git commit -F - <<'EOF'\nfix: plus de git push --force origin feat/x\nl'architecte\nEOF\ngit log --format='%s' -1",
    "python3 - <<'EOF'\nprint(\"l'architecte : gh pr merge, gh repo sync\")\nEOF\n",
    "git commit -F - <<-'EOF'\n\tfix: gh pr merge\n\tl'architecte\n\tEOF\necho 'fait'",
    "cat <<\"FIN\"\ngh pr merge 12\nl'architecte\nFIN\necho 'fait'",
    "cat <<'A' > a\ngh pr merge 1 ; l'un\nA\ncat <<'B' > b\nd'autre\nB\n",
    'gh pr create --title "x" --body "$(cat <<\'EOF\'\ngh pr merge\nl\'architecte\nEOF\n)"',
  ])
    assert.equal(decisionCommande(commande, ctx), null, commande);
  // Ce qui suit le heredoc, ou la ligne qui l'ouvre, est une vraie commande : elle se lit.
  const force = 'git push --force origin feat/x';
  for (const commande of [
    "python3 - <<'EOF'\nprint(\"l'architecte : gh pr merge, gh repo sync\")\nEOF\ngh pr merge 12",
    `cat <<'EOF'\nfix: gh pr merge\nl'architecte\nEOF\n${force}`,
    `cat <<'EOF'\nl'architecte\nEOF\ngit -c user.name="a;b" push --force origin feat/x`,
    `cat <<'EOF'\nl'architecte\nEOF\ngh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md`,
    `cat <<EOF | ${force}\nl'architecte\nEOF\n`,
    "cat <<'EOF' ; gh pr merge 12\nx\nEOF\n",
  ])
    assert.equal(decisionCommande(commande, ctx)?.decision, 'refuser', commande);
});

test('un << dans un texte cité n’ouvre pas de heredoc, et un heredoc qui ne ferme pas n’en retire rien : ce qui suit reste lu', () => {
  const ctx = { brancheCourante: () => 'feat/x' };
  const force = 'git push --force origin feat/x';
  for (const commande of [
    `echo "<<EOF" ; ${force}`,
    `echo '<<EOF' && ${force}`,
    `echo "<<EOF" ; ${force}\ncat <<'EOF'\nx\nEOF\n`,
    `echo "<<X" ; gh api -X PUT repos/o/r/pulls/1/merge`,
    `cat <<'EOF'\nl'architecte\n${force}`,
    `cat <<'EOF'\nl'architecte\nEOFX\n${force}`,
    `echo '<<EOF' | echo $(cat <<'EOF'\nz\nEOF\n) | git -c user.name="a;b" push --force origin feat/x`,
    `x="<<EOF" | echo $(cat <<'EOF'\nz\nEOF\n)\ngh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md`,
    `<<'EOF' echo $(cat <<'EOF'\nz\nEOF\n) ; gh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md\n\tEOF`,
  ])
    assert.equal(decisionCommande(commande, ctx)?.decision, 'refuser', commande);
});
```

Ils prouvent : les passages du tableau (dont l'exemple du projet), les refus de ce qui suit ou ouvre le here-doc, les sondes du projet (`echo "<<EOF" ; …`, `echo '<<EOF' && …`, un here-doc qui ne ferme jamais, un délimiteur fermé par `EOFX`, `echo "<<X" ; gh api -X PUT …/merge`), et les deux formes que le correctif du projet laisse passer.

### 3. Les textes

- `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, une seule occurrence, dans le long paragraphe de `garde-commandes` : remplacer `sauf dans un texte qui porte une substitution, lu comme avant ;` par :

> `sauf dans un texte qui porte une substitution, lu comme avant, et le corps d'un here-doc qui se ferme en est retiré d'abord, un `<<EOF` placé dans un texte cité n'en ouvrant pas et la ligne d'ouverture restant lue (`cat <<EOF | git push -f` est refusé), sans quoi l'apostrophe d'un message en français (`l'architecte`) ouvrait un faux texte cité qui avalait la ligne de fin du here-doc, dont le corps se lisait alors comme des commandes ;`

- `.claude-plugin/plugin.json:3` : `"version": "7.7.0"` devient `"version": "7.7.1"` (ou la version qui suit celle d'une PR entrée avant, décision 6). Rien d'autre ne change dans ce fichier.

### 4. Ce qui ne change pas

La première lecture (`lireSegments(commande)`), `sansGuillemets`, `sansTexte`, `segmentsDAvant`, `decisionCommande`, `garde-commandes.mjs`, `garde-github.mjs`, `garde-commandes.test.mjs`, et tous les tests existants.

## Surfaces

| Surface | Preuve |
| --- | --- |
| un message ou un script en français passé par here-doc, même citant `gh pr merge` ou `git push --force`, n'est plus refusé ; la commande qui suit le here-doc ou ouvre sa ligne se lit (le fait) | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « un corps de heredoc à apostrophes ne cache ni ne fabrique une commande gh » |
| un `<<EOF` dans un texte cité, un here-doc qui ne ferme pas ou ferme sur `EOFX` n'ôtent rien à ce qui suit : rien de ce que `origin/main` refusait ne passe | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « un << dans un texte cité n’ouvre pas de heredoc, et un heredoc qui ne ferme pas n’en retire rien : ce qui suit reste lu » |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, au correctif qui suit |

## Vérification

Jouée le 2026-11-14 sur une copie jetable de `cadb4e5`, avec les §§ 1-3 appliqués mot pour mot (les scripts de mesure sont des copies de `regles.mjs` avant et après, importées sans le dépôt) :

- **Tests** : les deux tests seuls, sans le § 1 : 2 rouges sur 30. Avec le § 1 : 30 verts. Avec le seul correctif du projet : les mêmes 2 rouges (il laisse passer `cat <<EOF | git push --force …`, `cat <<'EOF' ; gh pr merge 12`, `echo "<<EOF" ; git push --force …` suivi d'un autre here-doc, et `x="<<EOF" | echo $(cat <<'EOF' …)` suivi d'un `gh api … -X PUT`, seule des quatre que `origin/main` refuse). `pnpm install --frozen-lockfile && pnpm test` : **458 sur 458** (456 + 2), aucun test retiré ni sauté.
- **Faux refus levés** : 1 120 commandes légitimes (le texte dangereux n'est que le corps d'un here-doc : sept textes dangereux × huit ouvertures de here-doc — `<<'EOF'`, `<<-'EOF'`, `<<"EOF"`, `<<EOF`, un script Python, deux here-docs, un corps de PR dans `$(cat <<'EOF' …)` — × cinq corps à apostrophe × quatre suites) : `origin/main` en refuse **375**, `origin/main` sans sa seconde lecture **0**, le correctif **0**.
- **Monotonie** (le script ci-dessous) : 98 890 commandes, 234 784 couples (commande, branche) dont la base est refusée par `origin/main` seule, 171 479 refusés par `origin/main` : **0 régression** (refusé avant, passe après). Et 27 047 commandes qui passaient avant sont refusées après : des vraies commandes que le here-doc cité ou la ligne d'ouverture cachaient (les trous ci-dessus).
- **Fuzz avec un shell pour oracle** : 16 000 commandes tirées au hasard (fragments de refus, `<<EOF` nus, cités, `<<-`, `<<"EOF"`, `EOF`, `EOFX`, `$(cat <<'EOF' …)`, apostrophes et guillemets) × 12 graines ; pour chacune, `bash` joue la commande avec `git`, `gh` et `npm` remplacés par des fonctions qui journalisent ce qu'on leur demande (rien ne s'exécute). Le correctif du projet : 6 régressions **réelles** (le shell lancerait le dangereux, `origin/main` refusait, la variante passe) sur la graine 1. Les variantes intermédiaires, une par défaut trouvé : le balayage seul sans `<` neutralisés, 1 (graine 1) ; sans ligne d'ouverture conservée, 2 (graine 2) ; avec elle mais sans neutraliser ses `<`, 1 (graine 6). Le correctif retenu : **0**, sur les graines 1 à 8 (fragments élargis aux lignes d'ouverture, motif en `\n\s*`) et 1 à 4 (motif final en `\n[^\S\n]*`) ; la monotonie et les faux refus ci-dessus sont ceux du motif final.
- **Temps**, `decisionCommande` sur `cat <<'EOF'\nl'x\n` puis 30 000 sauts de ligne puis un push forcé (here-doc non fermé, refusé) : `origin/main` 7,3 s, correctif 7,4 s. Sans apostrophe (passe) : 14,8 s et 15,0 s. Here-doc fermé suivi des mêmes sauts, ou 30 000 sauts seuls : moins de 3 ms des deux côtés. Le `timeout` de la garde est de 60 s ; le correctif ne fait pas pire que `origin/main` (avec `\n\s*` dans le motif nouveau : 9,4 s, 18,5 s : c'est la décision 5).

Pour la session :

1. Le § 0, puis `pnpm install --frozen-lockfile && pnpm test` : vert, avec **le compte de `origin/main` plus 2**. `git diff origin/main --stat -- '*.test.mjs'` ne montre que `regles.test.mjs`.
2. La monotonie : le script ci-dessous, avec `origin/main` et la branche, doit rendre `REGRESSIONS (refusé avant, passe après): 0` (sortie 0).
3. `git diff origin/main --stat` ne montre que les quatre fichiers des « Fichiers chauds ».

### Le script de monotonie

Dans un dossier hors du dépôt : `avant.mjs` est `git show origin/main:skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `apres.mjs` celui de la branche (ils ne dépendent que de `node:fs`). Le journal des commandes des tests se fait ainsi : copier `regles.test.mjs` dans `recueil/`, y ajouter ce `recueil/regles.mjs`, lancer `node --test recueil/regles.test.mjs` (quelques tests de la copie peuvent échouer, sans importance), puis passer `recueil/journal.jsonl` en troisième argument :

```js
import * as m from '../avant.mjs';
import { appendFileSync } from 'node:fs';
export * from '../avant.mjs';
export function decisionCommande(c, ctx) { appendFileSync(new URL('./journal.jsonl', import.meta.url), JSON.stringify(c) + '\n'); return m.decisionCommande(c, ctx); }
```

`node monotonie.mjs avant.mjs apres.mjs recueil/journal.jsonl` ; `monotonie.mjs` :

```js
// Monotonie : toute commande refusée par AVANT doit l'être par APRÈS. Usage : node monotonie.mjs avant.mjs apres.mjs [rec/log.jsonl]
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const [,, fa, fb, journal] = process.argv;
const A = await import(resolve(fa)), B = await import(resolve(fb));
const BRANCHES = ['feat/x', 'sujet/demo', 'develop'];
const ctx = (b) => ({ brancheCourante: () => b, brancheParDefaut: () => 'develop' });

// 1. Commandes refusées, tirées du journal des tests (toutes celles que decisionCommande a reçues).
const base = new Set(journal && existsSync(journal) ? readFileSync(journal, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
// 2. Formes à séparateur cité (7.7.0) et les refus courants.
for (const c of [
  'git push --force origin feat/x', 'git push -f origin feat/x', 'git push origin +feat/x', 'git push origin develop', 'git push origin HEAD:main',
  'git push origin HEAD:sujet/demo', 'git push', 'git push --all', 'git push origin HEAD:$B', 'git push --force-with-lease origin feat/x',
  'git commit --no-verify -m x', 'git rebase origin/sujet/x', 'npm install leaflet', 'pnpm add zod', 'yarn add zod',
  'gh pr merge 12', 'gh api -X PUT repos/o/r/pulls/1/merge', 'gh api -X DELETE repos/o/r/git/refs/heads/x', 'gh repo sync o/r',
  'gh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md', 'gh api -f message="a;b" -X PUT repos/o/r/pulls/1/merge',
  'gh api -f message="a | b" -X PUT repos/o/r/contents/a.md', "gh api -f message='fix(api): x' -X PUT repos/o/r/contents/a.md",
  'gh api repos/o/r/contents/a.md -f message="fix(api): x" -X PUT', 'gh api -f body="a & b" -X POST repos/o/r/issues/1/comments',
  'gh api -f title="x (y)" -X PATCH repos/o/r/pulls/1', 'gh pr merge --auto -t "a;b" 12', 'gh pr edit 1 --title "a;b" --body "c"; gh pr merge 1',
  'git -c user.name="a;b" push --force origin feat/x', 'git -c user.name="a b" push origin develop', 'git -c user.name="a(b)" push origin HEAD:sujet/x',
  "git -c user.name='a;b' push --force origin feat/x", 'git -C "a b" push --force origin feat/x', 'git -c core.x="a&&b" push -f',
  'git -c user.name="a;b" push origin HEAD:main', 'git -c a="b|c" push --all', 'git -c a="b;c" push origin "HEAD:sujet/x"',
  'git -c a="b c" push', 'timeout 5 git -c a="b;c" push -f', 'echo "a;b"; git push --force origin feat/x', "echo 'a;b' && git push -f",
  'git commit -m "a;b" --no-verify', 'git -c a="x;y" commit -m z --no-verify', 'gh api -f m="a;b" -X PUT repos/o/r/merges',
  'env X="a b" git push --force origin feat/x', 'FOO="a;b" git push -f', 'git push --force "origin" "feat/x"', 'git "push" -f',
]) base.add(c);

const PREFIXES = [
  '', "cat <<'EOF'\nx\nEOF\n", "cat <<'EOF'\nl'architecte\nEOF\n", "cat <<EOF\nl'x ; d'y\nEOF\n", "cat <<-EOF\n\tl'x\n\tEOF\n",
  "cat <<'EOF'\nl'architecte\n" /* non fermé */, "cat <<'EOF'\nl'architecte\nEOFX\n", 'echo "<<EOF" ; ', "echo '<<EOF' && ", 'echo "<<EOF"\nEOF\n',
  "echo \"<<EOF\" ; echo l'x\nEOF\n", "cat <<'EOF' > a\nl'x\nEOF\ncat <<'B'\nl'y\nB\n", 'echo "a<<EOF" | ', "cat <<\"EOF\"\nl'x\nEOF\n",
  "git commit -F - <<'EOF'\nfix: l'architecte\nEOF\n", "echo \"<<EOF\"; echo d'a\nEOF\n; ", "cat <<'EOF'\nEOF\n", "cat <<EOF\n", "echo <<EOF && ",
  "x=\"<<'EOF'\"\nl'x\nEOF\n", "echo '<<EOF'\n", "echo \"l'a\"\n", "echo l'a\n",
];
const SUFFIXES = [
  '', "\ncat <<'EOF'\nx\nEOF\n", "\ncat <<'EOF'\nl'architecte\nEOF\n", "\necho l'x", " <<'EOF'\nl'x\nEOF\n", " <<EOF\nx\nEOF", " # l'x",
  " ; echo \"<<EOF\"\nEOF\n", " && echo '<<EOF'\nEOF", "\n", " <<'EOF'\nl'x\n", " <<-X\n\tl'y\n\tX\n", " <<'EOF'\nl'x\nEOFX\n",
];
const corpus = new Map(); // commande -> base d'origine
const add = (c, b) => { if (!corpus.has(c)) corpus.set(c, b); };
for (const c of base) add(c, c);
for (const b of base) for (const p of PREFIXES) for (const s of SUFFIXES) add(p + b + s, b);
// La commande sur la ligne d'ouverture d'un here-doc, avec ou sans corps qui se ferme, ou dans un $( ) qui en ouvre un.
const WRAPS = [
  (b) => `cat <<EOF ; ${b}\nbody\nEOF\n`, (b) => `cat <<'EOF' | ${b}\nl'body\nEOF\n`, (b) => `cat <<EOF && ${b}\nbody\nEOF`, (b) => `cat <<-EOF ; ${b}\n\tl'x\n\tEOF\n`,
  (b) => `cat <<EOF "x;y" ; ${b}\nbody\nEOF\n`, (b) => `cat <<EOF ; ${b}\nbody\n`, (b) => `<<'EOF' echo $(cat <<'EOF'\nz\nEOF\n) ; ${b}\n\tEOF`,
  (b) => `echo '<<EOF' | echo $(cat <<'EOF'\nz\nEOF\n) | ${b}`, (b) => `x="<<EOF" | echo $(cat <<'EOF'\nz\nEOF\n)\n${b}`, (b) => `cat <<A <<B ; ${b}\nx\nA\ny\nB\n`,
  (b) => `echo "$(cat <<'EOF'\nl'x\nEOF\n)" ; ${b}`, (b) => `cat <<EOF >/dev/null ; ${b}\nl'x\nEOF\ncat <<EOF\nd'y\nEOF\n`, (b) => `echo "a<<EOF b" ${b}\nx\nEOF`,
];
for (const b of base) for (const w of WRAPS) add(w(b), b);
// Un here-doc dont le corps contient la commande, et ce que la ligne qui suit peut en faire.
for (const b of base) {
  add(`cat <<'EOF'\nl'a ${b} d'b\nEOF\n${b}`, b);
  add(`${b} <<'EOF'\n${b}\nEOF\n`, b);
  add(`cat <<'EOF'\n${b}\nEOF\n`, b);
  add(`echo "<<EOF"; ${b}\nEOF\n`, b);
  add(`echo '<<EOF'; ${b}\nEOF\n`, b);
  add(`echo "x <<EOF y"\n${b}\nEOF\n`, b);
  add(`echo l'a; ${b}\ncat <<'EOF'\nEOF d'x\n`, b);
}
let compte = 0, refuses = 0, regressions = [], leves = [];
for (const [c, origine] of corpus) for (const b of BRANCHES) {
  // Une base que AVANT ne refuse pas seule n'est pas un refus à garder : seul un refus de la base compte.
  if (A.decisionCommande(origine, ctx(b))?.decision !== 'refuser') continue;
  compte++;
  const da = A.decisionCommande(c, ctx(b))?.decision ?? null;
  const db = B.decisionCommande(c, ctx(b))?.decision ?? null;
  if (da === 'refuser') { refuses++; if (db !== 'refuser') regressions.push([b, c]); }
  else if (db === 'refuser') leves.push([b, c]);
}
console.log(`commandes: ${corpus.size}, couples (commande, branche) à base refusée: ${compte}, refusés par AVANT: ${refuses}`);
console.log(`REGRESSIONS (refusé avant, passe après): ${regressions.length}`);
for (const [b, c] of regressions.slice(0, 15)) console.log('  ', b, JSON.stringify(c));
console.log(`nouveaux refus (passe avant, refusé après): ${leves.length}`);
for (const [b, c] of leves.slice(0, 8)) console.log('  ', b, JSON.stringify(c));
process.exitCode = regressions.length ? 1 : 0;
```

Le journal donne 277 commandes distinctes, dont 218 refusées par `origin/main` sur l'une des trois branches ; le script y ajoute une cinquantaine de refus écrits à la main (les formes à séparateur cité de 7.7.0 comprises), puis les place derrière, devant et autour de here-docs de toutes sortes. Seule compte, pour une commande composée, la base refusée **seule** par `origin/main` : un here-doc qui n'avale que du texte ne rend pas la base dangereuse.

Sortie jouée (début) :

```
commandes: 98890, couples (commande, branche) à base refusée: 234784, refusés par AVANT: 171479
REGRESSIONS (refusé avant, passe après): 0
nouveaux refus (passe avant, refusé après): 27047
   feat/x "echo \"<<EOF\" ; git push --force origin feat/x\ncat <<'EOF'\nx\nEOF\n"
```

## Hors périmètre

- **La première lecture** : elle garde ses trous (`cat <<EOF | git push -f` passe par elle, la seconde lecture le refuse), ses refus par prudence (`git commit -m "fix: l'architecte ; gh pr merge"` : le `;` d'un message cité coupe la première lecture, qui lit `gh pr merge` comme une commande) et deux here-docs sur une même ligne (`cat <<A <<B ; git push -f`), que le motif ne sait pas lire. À instruire à part.
- **Le coût au carré des trois autres motifs de here-doc** (`sansTexte`, `sansGuillemets`, `segmentsDAvant`, `\n\s*`) : un here-doc qui ne ferme jamais, suivi de 30 000 sauts de ligne, coûte 7 à 15 s sur `origin/main`, et le double de sauts quatre fois plus. `\n[^\S\n]*` y donne le même résultat en temps linéaire : à instruire à part, avec la lecture de `lireSegments` qui les rejoue.

## Comments

- 2026-11-14 — **Suspendu par l'architecte, rangé sous le ticket 33** (lecteur de commandes par vrais jetons). Relecture par un agent neuf (opus) : pas prêt. Avec son propre corpus (225 732 commandes, 677 196 couples sur `feat/x`, `sujet/demo`, `develop`) et un oracle bash (programmes remplacés par des scripts qui journalisent), le correctif de ce ticket laisse passer **23 231** couples que `origin/main` refuse et dont bash lance vraiment la commande dangereuse ; celui du projet qui a rapporté le défaut, 56 334. Formes : `<<EOF` dans des guillemets doubles qui portent `$` ou un accent grave (la décision 1 ne tient pas), commentaire `# <<EOF`, `<<<`, `\<<`, `$((1<<EOF))`, corps donné à un shell (`bash <<'EOF'`, `| bash`, `source /dev/stdin`, `python3` et `os.system`), ligne d'ouverture lue par les lecteurs de push et de `gh` mais pas par `COMMANDES_INTERDITES` ni `ajouts` (`cat <<'EOF' ; npm install x`), appariement des apostrophes ou des guillemets déplacé par le retrait d'un corps. Toutes passent déjà sur `origin/main` **sans** apostrophe : `origin/main` ne les refusait que par accident ; mais la monotonie est absolue pour une garde, et une variante plus fine du relecteur reste à 2 504 régressions. Il faut concevoir : c'est le travail du ticket 33, pas un correctif à motifs (décision d'après la PR 89 : plus de motifs dans `regles.mjs`). Gain mesuré à garder pour le 33 : 18 refus à tort sur 110 commandes réalistes sur `origin/main`, 0 après, sans commande dangereuse. Temps : 30 000 lignes `cat <<EOF` non fermées puis un push, 43 s sur `origin/main`, 57 s avec ce correctif (proche du délai de 60 s de la garde). **D'ici au 33** : le contournement est écrit dans les consignes des sessions — un message long par `git commit -F <fichier>` ou `--body-file`, jamais par here-doc. **Pour le 33** : le corpus et l'oracle du relecteur deviennent son critère d'acceptation (aucune commande que bash exécute et que `origin/main` refuse ne passe) ; les formes ci-dessus en sont les cas nommés. Le ticket repose sur `cadb4e5` ; `main` est depuis à `2826309`, plugin 7.8.2 (trois fichiers du ticket inchangés).
- 2026-11-14 — Écrit par un agent (opus) sur `cadb4e5` : correctif du projet écarté (6 régressions sur 16 000 au fuzz à oracle bash), balayage unique « here-doc qui se ferme ou texte cité » ; 0 régression sur son propre corpus (98 890 commandes), faux refus 375 sur 1 120 → 0 ; 458 tests.
- 2026-11-14 — Instruit sur `cadb4e5` (plugin 7.7.0). Le correctif du projet a été vérifié puis refait : il lève le faux refus mais laisse passer des commandes que `origin/main` refuse (la fuzz les a trouvées), il ne garde pas la ligne d'ouverture d'un here-doc, et son test n'est pas rouge sur `origin/main` (l'exemple du projet a son apostrophe dans des guillemets doubles). Le correctif retenu est celui du § 1.
- 2026-11-16 — Architecte. Le ticket 33 est fait (PR #98, A-51 ter) : la garde refuse l'union du lecteur par jetons et de la lecture de 7.9.x **sur la commande d'origine**. Le remède écrit ici (retirer d'abord les corps de here-doc dans la lecture à séparateurs cités) est périmé : il rendrait l'union non monotone, comme l'allègement d'A-51 bis (contournement trouvé par `/security-review` sur `83d3e01`). Lever ces refus à tort sans rompre la monotonie demande un autre dessin : à regriller avant toute rédaction. Reste `needs-triage`.
