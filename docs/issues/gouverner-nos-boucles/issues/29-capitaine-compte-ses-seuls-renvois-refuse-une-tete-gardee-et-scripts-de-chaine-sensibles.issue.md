# Le capitaine ne compte que ses propres renvois, ne pousse jamais sur une tête gardée, et ses scripts, les hooks git et la CI deviennent des chemins sensibles, correctif du plugin

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — le code, les tests et les textes sont donnés entiers ou en remplacements exacts, joués sur une copie jetable (voir « Où ») ; rien n'est à concevoir. La revue passe `/security-review`.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/file.sh`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `scripts/depot.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `.claude-plugin/plugin.json`

## Le besoin

Relevé le 2026-11-14 par deux relectures de sécurité d'un projet qui pose le socle 7.5.0. Trois constats sur le capitaine et le contrat ; le ticket 28 traite les deux autres (pre-push, hooks d'agent).

1. **Le compteur de renvois est falsifiable.** `renvois_de` compte tout commentaire qui porte la marque `<!-- renvoi-capitaine -->`, quel qu'en soit l'auteur. Sur un dépôt public, n'importe quel compte GitHub peut commenter une PR : trois commentaires marqués la mettent en état « humain » et la sortent de la file.
2. **Le capitaine pousse sur la tête de la PR sans refuser une branche gardée.** Une PR étiquetée `à-fusionner` dont la tête est `main` (ou `develop`, ou la branche par défaut) fait pousser par `passer.sh` le commit de fusion de develop **sur cette branche**. `sujet.sh fusionner` et `sujet.sh relancer` ont le même trou pour une sous-PR (tête `develop` : push sur `develop`).
3. **Les scripts de la chaîne, les hooks git et la CI ne sont pas des chemins sensibles dans le gabarit.** `cheminsSensibles` ne contient ni `scripts/chaine/**`, ni `.husky/**`, ni `.github/workflows/**`, ni `.github/actions/**` : une PR qui modifie `passer.sh`, `chemins-sensibles.mjs`, `diff-revue.sh`, le `pre-push` ou le workflow de la CI exigée échappe au régime sensible de la revue (`/security-review`) et, côté tickets, à `Label: contre-revue`. La CI exigée est pourtant la frontière derrière les hooks : un hook se contourne, la CI rejoue la même commande.

Les règles du produit, intangibles :

> jamais `--no-verify`, jamais de push forcé ni de réécriture, jamais de fusion avec un contrôle exigé rouge, jamais de test sauté ou assoupli, jamais de push sur la branche par défaut

Quand le ticket est fait : seuls les commentaires marqués **du compte qui tient le capitaine** comptent ; ce compte illisible, toute PR se lit au plafond et `file.sh` le dit une fois ; `passer.sh` refuse (sortie 4) une PR dont la tête est `develop`, `main` ou la branche par défaut, sans rien pousser, `sujet.sh fusionner`/`relancer` de même pour une sous-PR (tête gardée ou `sujet/*`), et `boucle.sh` renvoie la PR sur la sortie 4 de `relancer` ; la livraison d'un sujet (`sujet/<nom>` → develop) passe toujours ; le gabarit de `.claude/chaine.json` range `scripts/chaine/**`, `.husky/**`, `.github/workflows/**` et `.github/actions/**` parmi les chemins sensibles, et un test du plugin le garde. Pour un projet qui les a dans sa liste : toute PR qui touche un script de la chaîne, un hook git ou un workflow passe `/security-review`, et un ticket qui en touche un porte `Label: contre-revue`.

## Où

Base : `origin/main` à `ea7ea67` (#87 : tickets 25, 26 et 30 fusionnés), plugin **7.6.0**, **435 tests**. Le ticket 30 n'a touché aucun fichier de ce ticket hors `plugin.json` : les lignes relevées sur `b94eeb0` valent sur `ea7ea67`. Lignes relues sur ce commit ; la session relève les lignes sur `origin/main` d'alors et retrouve chaque ancrage par son texte. `F` abrège `skills/chaine/fusionner`, `J` abrège `skills/chaine/sujet/scripts`, `R` abrège `skills/chaine/socle-chaine-de-production/references`. Posés chez un projet : `F/scripts/*` et `J/sujet.sh` sous `scripts/chaine/`, `R/chaine.json` en `.claude/chaine.json`.

**Indépendant du ticket 27** : 27 touche `regles.mjs`, `garde-github.mjs`, `settings-hooks.json`, le gate `settings-json`, `R/../SKILL.md`, `R/CONTENU.md:13`, `claude-md-fusion.md`, `J/../SKILL.md` et la version ; ce ticket ne partage avec lui que `R/CONTENU.md` (ligne `:5` ici, `:13` là) et `plugin.json`, qui se règlent par la fusion de `main`. 27 annonce une définition unique de « branche gardée » en JavaScript (`regles.mjs`) ; la fonction shell `tete_gardee` de ce ticket en est la jumelle côté capitaine, à garder alignée (`develop`, `main`, la branche par défaut).

### Les faits, à la source

- **Renvois** — `F/scripts/github.sh:21-29` : `gh api --paginate "$DEPOT/issues/$1/comments?per_page=100" --jq '.[] | select(.body | contains("<!-- renvoi-capitaine -->")) | 1'` ; aucun filtre d'auteur. Lu par `F/scripts/file.sh:125` (`etat='humain'`) et `F/scripts/renvoyer.sh:16`. Le faux GitHub des bancs ne simule pas d'auteur (`J/faux-gh.mjs:197-199` rend `{ id, body }`) ni la route `user`.
- **Tête** — `F/scripts/passer.sh:76` lit `tete=$(champ .head.ref)` ; seule la base est contrôlée ; `:150` part de `origin/$tete`, `:225` `pousser "HEAD:refs/heads/$tete" …`. `J/sujet.sh:474-482` (`fusionner`) ne contrôle que la base ; `mettre_a_jour_sous_pr` (`:432`) pousse `HEAD:refs/heads/$tete` (`:464`) sur un conflit d'index ; `relancer` (`:628-648`) pousse toujours la fusion du sujet sur la tête (`:648`).
- **`boucle.sh` et la sortie 4 de `relancer`** — `F/scripts/boucle.sh:281-287` : `bash "$SUJET" relancer "$n" 2>&1 | sed …`, puis `case "$rc"` ne traite que 2 (renvoi) et 6 (pas propre) : une sortie 4 serait ignorée, la PR reviendrait à chaque tour sans renvoi (joué par la relecture). `refus.sh` lit le motif dans le fichier `$sortie` (`boucle.sh:310`, `sortie=$(mktemp)`), que cette branche n'écrit pas aujourd'hui.
- **La livraison d'un sujet passe légitimement par là** : tête `sujet/<nom>`, base develop ; `passer.sh:115-117` la reconnaît, et l'étape 4 pousse sur `sujet/<nom>` la fusion de develop (test existant « passer.sh : la livraison d'une branche sujet/ nomme son sujet dans le corps du commit de merge »). `passer.sh` ne refuse donc pas `sujet/*`. Pour une sous-PR (base `sujet/*`), aucun chemin du skill `sujet` n'a pour tête un sujet.
- **Chemins sensibles** — `R/chaine.json:3` : `"cheminsSensibles": ["scripts/agent/**", "scripts/docs/identifiants.mjs", ".claude/**"]`. La revue adversariale passe le diff à `scripts/chaine/chemins-sensibles.mjs` et lance **en plus** `/security-review` dès une ligne ; le gate `tickets` exige `Label: contre-revue` dès que `Fichiers chauds:` touche un motif. `R/../SKILL.md`, § « Avant de commencer — vérifier le terrain », point 3 : « Si `.claude/chaine.json` existe, le socle est posé : s'arrêter et demander ; une mise à jour se fait pièce par pièce » : un projet posé ne reçoit pas le nouveau gabarit.

### Reproduit, copie jetable

- **Tête** (sur `8c670e5`, chemin de code inchangé sur `ea7ea67`) : PR #70 tête `main` base `develop`, `à-fusionner`, checks verts : `passer.sh 70` sort en 0 et **`origin/main` reçoit le commit « Merge remote-tracking branch 'origin/develop' into capitaine/70 »**, puis la PR est squashée. Sous-PR #71 tête `develop` base `sujet/lot` : `sujet.sh relancer 71` sort en 0 et **`origin/develop` avance**.
- **Renvois, `boucle.sh`, chemins sensibles** : montrés par les tests du § 8, rouges sur `origin/main`.

### Le remède, joué

Le code, les tests et les textes des § 1-10, appliqués mot pour mot à une copie de `ea7ea67`, puis `pnpm install --frozen-lockfile && pnpm test` (`TMPDIR` sous un dossier jetable) : **440 sur 440** (435 + 5) ; le test de `scripts/depot.test.mjs` ne laisse aucun dossier `chaine-json-*` dans `TMPDIR`. Vus rouges sur les scripts de `origin/main` (faux GitHub du § 1 en place) : les quatre tests du § 8 ; le test de `boucle.sh` aussi avec le seul `boucle.sh` de `origin/main` (« [#76] RENVOI » absent, aucun `POST issues/76/comments` au journal du faux `gh`) ; le test du § 9 sur le `chaine.json` de `origin/main`. Le test des renvois, à deux PR, compte une seule fois le message du compte illisible.

## Décisions

1. **Seul compte le compte qui tient le capitaine**, lu par `gh api user --jq .login` : une fois par `file.sh` (variable `LOGIN_CAPITAINE`, héritée par chaque `$(renvois_de …)`), sinon à l'appel (`renvoyer.sh`). Le login est vérifié (`^[A-Za-z0-9][A-Za-z0-9-]*(\[bot\])?$`) avant d'entrer dans le filtre `jq` de `gh api --jq`, qui ne prend pas d'`--arg`. Joué dans une session cloud : `gh api user` y rend un login.
2. **Compte du capitaine illisible : la PR se lit au plafond.** Le plafond est le frein qui remet la PR à un humain : faute de savoir qui renvoie, on ne le lâche pas ; le sens inverse (0) laisserait la boucle renvoyer sans fin. `file.sh` le dit **une fois** (« compte du capitaine illisible (gh api user) : chaque PR se lit au plafond de renvois et attend un humain ») et pose `LOGIN_CAPITAINE='?'`, que `renvois_de` lit comme illisible sans relancer `gh api user` ni redire le message ; hors de `file.sh` (`renvoyer.sh`), `renvois_de` le dit pour sa PR. Coût assumé : si `gh api user` échoue alors que le reste de l'API répond (jeton d'installation d'une application GitHub), toute la file se lit `humain` jusqu'à ce que l'humain règle le jeton ; le message le nomme. Les commentaires illisibles gardent leur règle du ticket 7 (compte 0).
3. **Ce qui reste hors d'atteinte du compteur** : toutes les sessions d'un projet commentent sous le même compte (même jeton) ; une session peut donc encore écrire la marque, comme elle peut retirer un label. Un collaborateur qui supprime les commentaires du capitaine remet le compte à zéro. Le compteur est un frein contre la boucle, pas une frontière ; écrit dans `F/references/CONTENU.md`.
4. **Tête gardée, dans `passer.sh` : `develop`, `main`, ou la branche par défaut du dépôt**, lue dans le JSON de la PR que `passer.sh` a déjà (`base.repo.default_branch`) : aucun appel de plus. Refus en **sortie 4** (« refus corrigeable par l'auteur » : `boucle.sh` renvoie la PR par `refus.sh` avec ce motif, branche `passer.sh` existante), **avant** tout fetch, merge ou push. `sujet/*` n'est pas une tête gardée pour `passer.sh` : la livraison d'un sujet y passe.
5. **Même garde dans `sujet.sh fusionner` et `relancer`**, plus `sujet/*` : une sous-PR part d'une branche de travail. Une fonction `tete_gardee` dans `github.sh`, que `passer.sh` et `sujet.sh` sourcent déjà ; une fonction `refuser_tete_gardee` dans `sujet.sh`.
6. **`boucle.sh` renvoie la sous-PR sur la sortie 4 de `relancer`** : la sortie de `relancer` va aussi dans `$sortie` (`tee`), et le `case` gagne `4) bash "$outils/refus.sh" "$n" "$sortie"`, comme la branche `passer.sh`. Sans quoi la sous-PR refusée revient à chaque tour, sans renvoi ni motif (joué par la relecture). La sortie 4 de `sujet.sh fusionner` est déjà renvoyée par la boucle.
7. **Le faux GitHub simule l'auteur d'un commentaire et la branche par défaut**, sans casser les bancs existants : un commentaire écrit en chaîne (forme actuelle, et `POST` du capitaine) est du compte du capitaine (`etat.capitaine`, défaut `capitaine`) ; un objet `{ auteur, body }` est d'un autre compte ; `user` rend `{ login }`, ou 403 avec `compteIllisible` ; `base.repo.default_branch` vaut `etat.brancheParDefaut`, défaut `main`.
8. **Le gabarit gagne `scripts/chaine/**`, `.husky/**`, `.github/workflows/**` et `.github/actions/**`** (décision de l'architecte pour les deux derniers : la CI exigée est la frontière des hooks). Pour un projet qui les porte : toute PR qui touche un script de la chaîne, un hook git, un workflow ou une action composite passe en plus `/security-review` ; un ticket dont les `Fichiers chauds:` en touchent un porte `Label: contre-revue` (le gate `tickets` le refuse sinon). Un projet déjà posé garde sa liste tant qu'il ne l'édite pas (un contrat posé ne se réécrit pas) : la phrase est écrite dans `R/CONTENU.md` (§ 10), et la PR la reprend dans sa description. **Aucun gate de projet n'exige ces motifs** : un gate rendrait rouges, à la mise à jour du plugin, des projets qui n'ont rien cassé ; un test **du plugin** garde le gabarit, en le faisant lire par le script même de la revue (`chemins-sensibles.mjs`).
9. Ni `--no-verify`, ni test retiré, sauté ou assoupli ; aucune dépendance nouvelle. Les tests existants ne changent pas.
10. **Version : correctif (patch).** Règle : patch pour une correction, y compris quand le contenu d'un fichier déjà posé change (ici les scripts du capitaine et de `sujet`, le gabarit du contrat) ; mineure quand un skill, un gabarit ou un fichier posé s'ajoute ; majeure quand un skill change de contrat. La session prend la version de `origin/main` à l'ouverture de la PR et monte le troisième chiffre. Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre la version qui suit la sienne.
11. **La revue de la PR passe `/security-review`**, en plus de la revue de ticket.

### Remèdes écartés

- **Filtrer par `author_association` (OWNER, MEMBER, COLLABORATOR)** : écarte les comptes extérieurs sans `gh api user`, mais compte n'importe quel collaborateur, et l'association d'un membre privé d'une organisation se lit mal selon les droits du jeton.
- **Un label de renvoi compté** : un label se pose et se retire par quiconque a l'écriture ; et le ticket 7 a écarté tout label nouveau.
- **Lire la branche par défaut par `gh api repos/{owner}/{repo}`** : un appel de plus, quand le JSON de la PR la porte.
- **Refuser `sujet/*` en tête dans `passer.sh`** : casserait la livraison d'un sujet.
- **Un gate de projet qui exige les nouveaux motifs** : décision 8.

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges

Sur `origin/main` : poser d'abord le faux GitHub du § 1 (outillage de banc), écrire les tests des § 8 et 9, les jouer, les voir rouges (« 56 humain » au lieu de « 56 prête » ; sortie 0 au lieu de 4 pour #70 ; sortie 0 au lieu de 4 pour `fusionner 73`/`relancer 73` ; « [#76] RENVOI » absent ; aucune ligne pour `scripts/chaine/passer.sh`) ; **puis** seulement écrire le code.

### 1. `J/faux-gh.mjs`

- La ligne d'en-tête `//   pulls       PR { number, title, body, draft, state, labels: [noms], base, head, merged_at, commentaires: [corps] }` (`:5`) devient :

```js
//   pulls       PR { number, title, body, draft, state, labels: [noms], base, head, merged_at, commentaires }
//               `commentaires` : [corps], écrits par le compte du capitaine, ou { auteur, body } d'un autre compte
//   capitaine   compte que rend `gh api user` (défaut « capitaine ») ; compteIllisible : `user` répond 403
//   brancheParDefaut  branche par défaut du dépôt (défaut « main »), dans `base.repo.default_branch`
```

- Dans `versRest`, `    base: { ref: pr.base },` (`:111`) devient `    base: { ref: pr.base, repo: { default_branch: etat.brancheParDefaut ?? "main" } },`.
- Les trois lignes de `  // Lecture des commentaires : ceux de \`commentaires\` (corps seuls), comme GitHub les rend.` à `    return (pr(m[1]).commentaires ?? []).map((body, i) => ({ id: i + 1, body }));` (`:197-199`) deviennent :

```js
  // Lecture des commentaires, comme GitHub les rend : un corps seul est du compte du capitaine.
  if ((m = route.match(/^issues\/(\d+)\/comments$/)) && methode === "GET")
    return (pr(m[1]).commentaires ?? []).map((c, i) =>
      typeof c === "string"
        ? { id: i + 1, body: c, user: { login: etat.capitaine ?? "capitaine" } }
        : { id: i + 1, body: c.body, user: { login: c.auteur } },
    );
  if (route === "user" && methode === "GET")
    return etat.compteIllisible
      ? echec("gh: Resource not accessible by integration (HTTP 403)")
      : { login: etat.capitaine ?? "capitaine" };
```

### 2. `F/scripts/github.sh`

- Le bloc qui va de `# Renvois d'une PR (A-10) : chaque commentaire de renvoyer.sh porte cette marque, invisible (un` (`:17`) jusqu'à la ligne `  if lus=$(gh api --paginate "$DEPOT/issues/$1/comments?per_page=100" --jq '.[] | select(.body | contains("<!-- renvoi-capitaine -->")) | 1'); then` (`:23`) incluse devient (le reste de la fonction ne change pas) :

```bash
# Renvois d'une PR (A-10) : chaque commentaire de renvoyer.sh porte cette marque, invisible (un
# commentaire HTML). Le compte se lit sur la PR elle-même : aucun label nouveau. Seuls comptent les
# commentaires du compte qui tient le capitaine (`gh api user`, lu une fois : file.sh le garde dans
# LOGIN_CAPITAINE, `?` s'il est illisible) : la marque recopiée par un autre compte ne met pas la PR
# en attente d'un humain.
MARQUE_RENVOI='<!-- renvoi-capitaine -->'
# Commentaires illisibles : 0 sur la sortie, dit sur la sortie d'erreur (un seul nombre, jamais deux).
# Compte du capitaine illisible : le plafond (la PR attend un humain), dit sur la sortie d'erreur ;
# le frein des renvois ne se lâche jamais faute de savoir qui renvoie.
renvois_de() {
  local lus login=${LOGIN_CAPITAINE:-}
  [ -n "$login" ] || login=$(gh api user --jq .login 2>/dev/null) || login=''
  if ! [[ "$login" =~ ^[A-Za-z0-9][A-Za-z0-9-]*(\[bot\])?$ ]]; then
    [ -n "${LOGIN_CAPITAINE:-}" ] ||
      echo "renvois de #$1 : compte du capitaine illisible (gh api user), compté au plafond : la PR attend un humain" >&2
    plafond_renvois
    return
  fi
  if lus=$(gh api --paginate "$DEPOT/issues/$1/comments?per_page=100" --jq ".[] | select(.user.login == \"$login\" and (.body | contains(\"<!-- renvoi-capitaine -->\"))) | 1"); then
```

- Juste avant `# Sommet (dernier commit) de la branche d'une PR.` (`:119`), insérer :

```bash
# Tête de PR gardée : `develop`, `main`, ou la branche par défaut du dépôt (2e argument, lu dans le
# JSON de la PR : `base.repo.default_branch`). Le capitaine pousse la mise à jour d'une PR sur sa tête :
# jamais sur celles-ci (« jamais de push sur la branche par défaut »). La livraison d'un sujet
# (`sujet/<nom>` vers develop) n'en est pas une : la mettre à jour avec develop est le chemin prévu.
tete_gardee() { [ "$1" = develop ] || [ "$1" = main ] || { [ -n "${2:-}" ] && [ "$1" = "$2" ]; }; }
```

### 3. `F/scripts/file.sh`

Juste après `plafond=$(plafond_renvois)` (`:48`) :

```bash
# Compte du capitaine, lu une fois pour toute la file (renvois_de) ; illisible : dit une fois ici.
LOGIN_CAPITAINE=$(gh api user --jq .login 2>/dev/null) || LOGIN_CAPITAINE=''
if [ -z "$LOGIN_CAPITAINE" ]; then
  echo "compte du capitaine illisible (gh api user) : chaque PR se lit au plafond de renvois et attend un humain" >&2
  LOGIN_CAPITAINE='?' # dit une fois : renvois_de rend le plafond sans relire ni redire
fi
```

### 4. `F/scripts/passer.sh`

Juste après `tete=$(champ .head.ref)` (`:76`) :

```bash
# Tête gardée (develop, main, branche par défaut) : l'étape 4 y pousserait la fusion avec develop.
! tete_gardee "$tete" "$(champ '.base.repo.default_branch // ""')" ||
  sortir 4 "tête de la PR = $tete, branche gardée (develop, main ou la branche par défaut) : le capitaine n'y pousse jamais ; ouvrir la PR depuis une branche de travail"
```

### 5. `F/scripts/boucle.sh`

Dans `traiter_sujets`, branche `sujet/*': prête (sans CI)')` (`:280-287`), la ligne `        bash "$SUJET" relancer "$n" 2>&1 | sed "s#^#[\#$n] #"` devient :

```bash
        bash "$SUJET" relancer "$n" 2>&1 | tee "$sortie" | sed "s#^#[\#$n] #"
```

et, dans le `case "$rc"` qui suit, juste après la ligne `          2) bash "$outils/renvoyer.sh" "$n" "conflit avec ${etat%%:*} : fusionner ${etat%%:*} dans la branche et le résoudre" ;;` :

```bash
          4) bash "$outils/refus.sh" "$n" "$sortie" ;; # tête gardée : renvoyée avec le motif
```

`rc=${PIPESTATUS[0]}` reste le statut de `relancer` (premier élément du tube).

### 6. `J/sujet.sh`

- Juste avant `fusionner() {` (`:474`) :

```bash
# Sous-PR dont la tête est develop, main, la branche par défaut ou un sujet : mettre_a_jour_sous_pr et
# relancer y pousseraient la fusion du sujet. Une sous-PR part d'une branche de travail : sortie 4.
refuser_tete_gardee() {
  local tete
  tete=$(jq -r .head.ref <<<"$2")
  if tete_gardee "$tete" "$(jq -r '.base.repo.default_branch // ""' <<<"$2")" || [[ "$tete" == sujet/* ]]; then
    sortir 4 "#$1 : tête $tete, branche gardée (develop, main, la branche par défaut ou un sujet) : le capitaine n'y pousse jamais ; ouvrir la sous-PR depuis une branche de travail"
  fi
}
```

- Dans `fusionner`, juste après `  [[ "$base" == sujet/* ]] || sortir 4 "#$n vise $base, pas une branche sujet/ : elle passe par le capitaine"` (`:481`), et dans `relancer`, juste après `  [[ "$base" == sujet/* ]] || sortir 4 "#$n vise $base, pas un sujet"` (`:633`), la ligne :

```bash
  refuser_tete_gardee "$n" "$pr"
```

- En-tête, « dernière ligne est le motif, `fusionner` : titre, commitlint, revue, base) · 6 arbre de travail pas » (`:69`) devient « dernière ligne est le motif, `fusionner` : titre, commitlint, revue, base ; `fusionner` et `relancer` : tête gardée, develop, main, la branche par défaut ou un sujet) · 6 arbre de travail pas ».

### 7. `R/chaine.json`

- `"cheminsSensibles": ["scripts/agent/**", "scripts/docs/identifiants.mjs", ".claude/**"],` devient `"cheminsSensibles": ["scripts/agent/**", "scripts/chaine/**", ".husky/**", ".github/workflows/**", ".github/actions/**", "scripts/docs/identifiants.mjs", ".claude/**"],`.
- Dans `$comment`, « `cheminsSensibles` part des gardes de la chaîne elle-même (les hooks, la convention d'identifiants qu'ils lisent, la configuration de l'agent) » devient « `cheminsSensibles` part des gardes de la chaîne elle-même (les hooks d'agent, les scripts du capitaine et des sujets, les hooks git, la CI et ses actions, la convention d'identifiants qu'ils lisent, la configuration de l'agent) ».

### 8. `F/scripts/fusionner.test.mjs` : quatre tests

Juste avant `test("boucle.sh : une PR à l'état humain n'est ni passée, ni relancée, ni renvoyée"` (`:404`) — `renvoi` est la constante du fichier (`:344`) :

```js
test("renvois : seuls les commentaires du compte du capitaine comptent ; compte illisible, la PR attend un humain", () => {
  const d = depotJouet();
  for (const b of ["feat/a", "feat/b"]) d.branche(b, "origin/develop", { [`${b}.md`]: `${b}\n` });
  // La marque recopiée par un autre compte : trois fois sur #56, une fois sur #57 après deux vrais renvois.
  const autre = { auteur: "un-autre-compte", body: renvoi };
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [
      pr(56, "feat/a", { commentaires: [autre, autre, autre] }),
      pr(57, "feat/b", { commentaires: [renvoi, autre, renvoi] }),
    ],
  });
  const etats = () => d.lancer(script("file.sh")).stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2).join(" "));
  assert.deepEqual(etats(), ["56 prête", "57 prête"]);
  const r56 = d.lancer(script("renvoyer.sh"), "56", "x");
  assert.equal(r56.status, 0, r56.stdout + r56.stderr);
  assert.doesNotMatch(r56.stdout, /attend un humain/);
  assert.match(d.lancer(script("renvoyer.sh"), "57", "x").stdout, /^\[#57\] RENVOI 3 sur 3 : la PR attend un humain$/m);
  // Compte du capitaine illisible : le frein ne se lâche pas, chaque PR attend un humain, et on le dit.
  const e = depotJouet();
  e.branche("feat/c", "origin/develop", { "feat/c.md": "c\n" });
  e.branche("feat/d", "origin/develop", { "feat/d.md": "d\n" });
  e.github({ compteIllisible: true, exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } }, pulls: [pr(58, "feat/c"), pr(59, "feat/d")] });
  const r = e.lancer(script("file.sh"));
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2).join(" ")), ["58 humain", "59 humain"]);
  assert.equal(r.stderr.match(/compte du capitaine illisible \(gh api user\)/g)?.length, 1, r.stderr);
});
```

Juste avant `test("refus.sh : renvoie la PR avec le dernier motif de la sortie, préfixe retiré"` (`:442`) — les tests lisent le distant par `d.git("ls-remote", "origin")` :

```js
test("passer.sh : une PR dont la tête est develop, main ou la branche par défaut est refusée (sortie 4) sans rien pousser", () => {
  const d = depotJouet();
  d.branche("main", "origin/develop", { "docs/m.md": "m\n" }, "docs: main");
  d.branche("trunk", "origin/develop", { "docs/t.md": "t\n" }, "docs: trunk");
  d.branche("develop", "origin/develop", { "docs/d.md": "d\n" }, "docs: develop");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    brancheParDefaut: "trunk",
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(70, "main"), pr(71, "trunk"), pr(72, "develop", { base: "main" })],
  });
  const avant = d.git("ls-remote", "origin");
  for (const [n, tete] of [["70", "main"], ["71", "trunk"], ["72", "develop"]]) {
    const r = d.lancer(script("passer.sh"), n);
    assert.equal(r.status, 4, `#${n} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, new RegExp(`tête de la PR = ${tete}, branche gardée .* le capitaine n'y pousse jamais`));
  }
  assert.equal(d.git("ls-remote", "origin"), avant);
  assert.deepEqual(d.journal(), []);
});

test("sujet.sh fusionner et relancer : une sous-PR dont la tête est develop, main ou un sujet est refusée (sortie 4) sans rien pousser", () => {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "a.md": "a\n" }, "feat(demo): a (#1)");
  d.branche("sujet/autre", "origin/develop", { "o.md": "o\n" }, "feat(demo): o (#2)");
  d.branche("main", "origin/develop", { "m.md": "m\n" }, "docs: main");
  d.git("switch", "-q", "--detach", "origin/develop");
  const sous = (number, head) => ({ number, title: "feat(demo): x", head, base: "sujet/lot", labels: ["à-fusionner"] });
  d.github({ exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } }, pulls: [sous(73, "develop"), sous(74, "main"), sous(75, "sujet/autre")] });
  const avant = d.git("ls-remote", "origin");
  for (const geste of ["fusionner", "relancer"])
    for (const n of ["73", "74", "75"]) {
      const r = d.lancer(scriptDe("sujet", "sujet.sh"), geste, n);
      assert.equal(r.status, 4, `${geste} #${n} : ${r.stdout}${r.stderr}`);
      assert.match(r.stdout, /branche gardée .* le capitaine n'y pousse jamais/);
    }
  assert.equal(d.git("ls-remote", "origin"), avant);
  assert.deepEqual(d.journal(), []);
});

test("boucle.sh : une sous-PR sans CI dont la tête est gardée est renvoyée avec le motif de relancer, rien n'est poussé", () => {
  const d = depotJouet();
  d.publierChaine();
  d.branche("sujet/lot", "origin/develop", { "lot.md": "lot\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks: {}, pulls: [pr(76, "develop", { base: "sujet/lot", title: "feat(demo): x" })] });
  const avant = d.git("ls-remote", "origin");
  const r = d.lancer(script("boucle.sh"));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#76\] RENVOI : #76 : tête develop, branche gardée/);
  assert.deepEqual(d.etat().pulls[0].labels, ["fusion-bloquée"]);
  const commentaire = d.journal().find((e) => e.methode === "POST" && e.route === "issues/76/comments");
  assert.ok(commentaire, `commentaire de renvoi posté : ${JSON.stringify(d.journal())}`);
  assert.match(commentaire.champs.body, /tête develop, branche gardée/);
  assert.equal(d.git("ls-remote", "origin"), avant);
});
```

Ces tests n'installent aucun hook git et ne commitent rien sous les hooks.

### 9. `scripts/depot.test.mjs`

L'import `import { existsSync, readdirSync, readFileSync } from "node:fs";` (`:5`) devient les deux lignes :

```js
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
```

et, juste avant `// Un script du plugin ne saute jamais un hook git (« jamais --no-verify ») : les scripts que le plugin` (`:210`) :

```js
// Les gardes de la chaîne passent par le régime sensible de la revue (`/security-review`) : le gabarit
// du contrat les nomme, lu par le script même de la revue adversariale.
test("le gabarit .claude/chaine.json range les gardes de la chaîne parmi les chemins sensibles", () => {
  const dossier = mkdtempSync(join(tmpdir(), "chaine-json-"));
  mkdirSync(join(dossier, ".claude"));
  copyFileSync(join(RACINE, "skills/chaine/socle-chaine-de-production/references/chaine.json"), join(dossier, ".claude/chaine.json"));
  const gardes = [
    "scripts/agent/regles.mjs",
    "scripts/chaine/passer.sh",
    "scripts/chaine/chemins-sensibles.mjs",
    "scripts/chaine/diff-revue.sh",
    ".husky/pre-push",
    ".husky/pre-commit",
    "scripts/docs/identifiants.mjs",
    ".claude/settings.json",
    ".github/workflows/ci.yml",
    ".github/actions/setup/action.yml",
  ];
  try {
    const sortie = execFileSync("node", [join(RACINE, "skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs")], {
      cwd: dossier,
      input: `${gardes.join("\n")}\napps/api/src/main.ts\n`,
      encoding: "utf8",
    });
    assert.deepEqual(sortie.trim().split("\n").map((l) => l.split("\t")[0]), gardes);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});
```

### 10. Les textes, mot pour mot

- `F/SKILL.md:60`, « (sortie 4 : titre trop long ou refusé par commitlint, revue adversariale absente, base hors `sujet/`) » devient « (sortie 4 : titre trop long ou refusé par commitlint, revue adversariale absente, base hors `sujet/`, tête gardée : `develop`, `main`, la branche par défaut, ou un sujet pour une sous-PR ; sortie 4 de `sujet.sh relancer` comprise) ».
- Même ligne, « Les renvois se comptent sur la PR (marque invisible dans chaque commentaire de `renvoyer.sh`) » devient « Les renvois se comptent sur la PR (marque invisible dans chaque commentaire de `renvoyer.sh`, comptée seulement sous le compte qui tient le capitaine, `gh api user` ; ce compte illisible, toute PR se lit au plafond, et `file.sh` le dit une fois) ».
- `F/references/CONTENU.md:17`, « Fait passer une PR : éligibilité (label, brouillon, titre de 120 caractères, » devient « Fait passer une PR : éligibilité (label, brouillon, tête qui n'est ni `develop`, ni `main`, ni la branche par défaut, titre de 120 caractères, ».
- `F/references/CONTENU.md:33`, après « Le renvoi : labels échangés, cause commentée, worktree propriétaire retrouvé pour prévenir la session. », insérer : « Le compte des renvois ne lit que les commentaires marqués du compte qui tient le capitaine (`gh api user`, lu une fois par `file.sh`) : la marque recopiée par un autre compte ne met pas une PR en attente d'un humain ; ce compte illisible, toute PR se lit au plafond (le frein ne se lâche pas faute de savoir qui renvoie), et `file.sh` le dit une fois. Les sessions du projet commentent sous le même compte, et un collaborateur peut supprimer des commentaires : le compte est un frein contre la boucle, pas une frontière. »
- `R/CONTENU.md:5`, après « Les branches ne s'y déclarent pas : `develop` intègre, `main` livre, pour tous les projets. », insérer : « Les chemins sensibles du gabarit sont les gardes de la chaîne : `scripts/agent/**`, `scripts/chaine/**` (capitaine, sujets, revue), `.husky/**` (hooks git), `.github/workflows/**` et `.github/actions/**` (la CI exigée, frontière des hooks), `scripts/docs/identifiants.mjs`, `.claude/**`. Toute PR qui en touche un passe en plus `/security-review`, et un ticket dont les `Fichiers chauds:` en touchent un porte `Label: contre-revue`. Un projet posé avant l'arrivée de `scripts/chaine/**`, `.husky/**`, `.github/workflows/**` et `.github/actions/**` dans le gabarit les ajoute à sa propre liste : un contrat posé ne se réécrit pas (`SKILL.md`, § « Avant de commencer », point 3). »

25 a réécrit `F/SKILL.md:14` et `F/references/CONTENU.md:45`, 26 `F/SKILL.md:83` et `R/CONTENU.md:13`, et 27 réécrira `R/CONTENU.md:13` : aucun de ces ancrages.

### 11. La version — `.claude-plugin/plugin.json:3`

Patch (décision 10).

## Surfaces

| Surface | Preuve |
| --- | --- |
| renvois du seul capitaine, compte illisible au plafond, dit une fois | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « renvois : seuls les commentaires du compte du capitaine comptent ; compte illisible, la PR attend un humain » |
| `passer.sh` et la tête gardée | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : une PR dont la tête est develop, main ou la branche par défaut est refusée (sortie 4) sans rien pousser » |
| `sujet.sh` et la tête gardée | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « sujet.sh fusionner et relancer : une sous-PR dont la tête est develop, main ou un sujet est refusée (sortie 4) sans rien pousser » |
| `boucle.sh` renvoie la sortie 4 de `relancer` | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « boucle.sh : une sous-PR sans CI dont la tête est gardée est renvoyée avec le motif de relancer, rien n'est poussé » |
| la livraison d'un sujet passe toujours | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : la livraison d'une branche sujet/ nomme son sujet dans le corps du commit de merge », inchangé et vert |
| les renvois existants comptent toujours | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « renvoyer.sh : au troisième renvoi, le commentaire dit que la PR attend un humain » et « file.sh : une PR renvoyée autant de fois que le plafond est montrée humain, et ni --next ni --rouges ne la rendent », inchangés et verts |
| le gabarit des chemins sensibles | `scripts/depot.test.mjs` « le gabarit .claude/chaine.json range les gardes de la chaîne parmi les chemins sensibles » |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, au patch qui suit |

## Vérification

- `pnpm test` vert : le compte de `origin/main` plus 5. `git diff origin/main --stat -- '*.test.mjs'` ne montre que `fusionner.test.mjs` et `scripts/depot.test.mjs` ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend 0.
- `node -e "JSON.parse(require('fs').readFileSync('skills/chaine/socle-chaine-de-production/references/chaine.json','utf8'))"` ne lève rien.
- Revue : revue de ticket, puis `/security-review` sur la branche ; leurs sections dans le corps de la PR, qui reprend aussi la phrase de repose du § 10 (`R/CONTENU.md:5`) pour les projets déjà posés.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, commite sous les hooks (jamais `--no-verify`), ouvre sa PR hors brouillon **sans poser `à-fusionner`** (`Label: contre-revue`), et écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- Le pre-push et les hooks d'agent : ticket 28.
- **Le message « compte du capitaine illisible » sort une fois par lancement de `file.sh`**, donc trois ou quatre fois par tour de boucle (`boucle.sh` lance `file.sh` plusieurs fois par tour), et `gh api user` est appelé à chaque lancement (mesuré par la relecture : 13 appels pour un tour de 3 PR). Suite possible : le lire une fois par tour dans `boucle.sh` et le passer à `file.sh` par `LOGIN_CAPITAINE`.
- Une PR venue d'une fourche dont la tête porte le nom d'une branche du dépôt : `passer.sh` lit `origin/$tete`, pas la fourche ; avec ce ticket, une tête `develop`, `main` ou la branche par défaut est refusée, quelle que soit la fourche. Comparer `head.repo.full_name` et `base.repo.full_name` reste à instruire si un projet ouvre ses PR aux fourches.
- La protection des branches côté GitHub (recommandation du ticket 27).
- Les dépôts de projet : reposer les scripts et compléter leur `.claude/chaine.json` est leur affaire.

## Comments

- 2026-11-14 — Instruit sur `8c670e5` (plugin 7.5.0) : push sur `main` par `passer.sh` et sur `develop` par `sujet.sh relancer` reproduits sur le dépôt jouet.
- 2026-11-14 — Relu par un agent neuf : « prêt après corrections », deux bloquantes (sortie 4 de `relancer` ignorée par `boucle.sh` ; message du compte illisible répété et `gh api user` relancé pour chaque PR) et des mineures. Correctifs du relecteur vérifiés et portés, test de `boucle.sh` ajouté ; `.github/workflows/**` et `.github/actions/**` ajoutés (décision de l'architecte) ; `Blocked by: —` ; version passée en patch. Rebasé sur `b94eeb0` (plugin 7.5.2, 434 tests) : `pnpm test` 439 sur 439.
- 2026-11-14 — Vérifié par le relecteur : prêt, deux retouches portées (dossier temporaire du test du gabarit retiré par `try`/`finally` ; commentaire de renvoi vérifié au journal du faux `gh` dans le test de `boucle.sh`) ; appels répétés de `gh api user` écrits dans « Hors périmètre ». Rebasé sur `ea7ea67` (plugin 7.6.0, 435 tests) : `pnpm test` 440 sur 440.
