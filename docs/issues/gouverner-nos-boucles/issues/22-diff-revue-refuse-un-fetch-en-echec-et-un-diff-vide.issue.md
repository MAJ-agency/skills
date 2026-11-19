# `diff-revue.sh` refuse une base qu'il n'a pas pu rapatrier et un diff vide, version corrective

Status: Fait — PR #81
Type: défaut
Modèle: sonnet — les textes à écrire sont donnés mot pour mot ; le script et son banc sont spécifiés par leur comportement, cas par cas.
Blocked by: 17
Label: contre-revue
Dépendances: —
Fichiers chauds: `skills/chaine/revue-adversariale/scripts/diff-revue.sh`, `skills/chaine/revue-adversariale/scripts/diff-revue.test.mjs` (créé), `skills/chaine/revue-adversariale/SKILL.md`, `skills/chaine/revue-adversariale/references/CONTENU.md`, `skills/chaine/revue-de-ticket/SKILL.md`, `.claude-plugin/plugin.json`

## Le besoin

`diff-revue.sh` prépare le diff que relisent la revue adversariale et la revue de ticket. Deux défauts, relevés en comparant au plugin 6.0.0 la copie qu'un projet Prisma et Jest (fedora) avait corrigée de son côté, et toujours là :

- **Un fetch en échec est ignoré.** `skills/chaine/revue-adversariale/scripts/diff-revue.sh:15` : `git fetch -q origin "${base#origin/}" 2>/dev/null || true`. Distant injoignable : la revue porte sur une base périmée, sans que personne le sache. Le script fetche aussi une base qui n'est pas `origin/…` (`HEAD~3`, un sha), en vain.
- **Un diff vide est accepté.** `diff-revue.sh:23-29` écrit `diff.patch` et sort en 0 quel qu'en soit le contenu, alors que `revue-adversariale/SKILL.md:34` dit « Fini quand `diff.patch` existe, non vide ». Une session peut lancer un sous-agent sur rien et conclure « aucun écart ».

Quand le ticket est fait, le script sort en 1 avec un motif dans ces deux cas, ne fetche que les bases `origin/…`, et les deux skills qui l'appellent disent cette sortie ; le plugin est au correctif suivant.

## Où

Base : `origin/main` à `c9a6055` (plugin **7.2.0**, 391 tests verts), lignes relues le 2026-11-14. Ce ticket part **après la fusion du ticket 17** : la session relève chaque ligne sur `origin/main` d'alors et retrouve les phrases par leur texte (le 17 touche les mêmes fichiers, sur d'autres lignes : ci-dessous).

### 1. `skills/chaine/revue-adversariale/scripts/diff-revue.sh` (29 lignes)

- `:15` : fetch seulement si la base commence par `origin/` ; un fetch en échec sort en 1, sur la sortie d'erreur : « diff-revue : fetch de <base> impossible : la base serait périmée ; vérifier le distant, ou passer une base locale ». Une autre base n'est jamais fetchée.
- Après `:24` : un `diff.patch` vide sort en 1, sur la sortie d'erreur : « diff-revue : diff vide contre <base> (zones : <zones, ou « tout »>) : rien à relire ». Les deux fichiers restent écrits (un `diff.patch` d'une passe précédente est écrasé, jamais relu par erreur).
- L'en-tête (`:4-10`) donne les sorties : « Sortie 0 diff écrit · 1 base `origin/…` non rapatriée, ou diff vide ».

### 2. `skills/chaine/revue-adversariale/SKILL.md:34`

Après « (le script l'affiche). », ajouter : « Sortie 1 (base non rapatriée, ou diff vide) : le lire, ne lancer aucun sous-agent ; un lot de zone vide n'a pas de sous-agent. »

### 3. `skills/chaine/revue-adversariale/references/CONTENU.md`, section `scripts/diff-revue.sh` (ligne 5)

Ajouter à la fin du paragraphe : « Il sort en 1 sans rien relire quand la base `origin/…` ne se rapatrie pas (une revue sur une base périmée ne se voit pas) ou quand le diff est vide ; il ne fetche jamais une base locale. Banc : `diff-revue.test.mjs`, sur le dépôt jouet du skill `sujet`, qui reste dans le plugin. »

### 4. `skills/chaine/revue-de-ticket/SKILL.md:26-30`

Le bloc de `:25-28` appelle `diff-revue.sh` ; à `:30`, après « pour une sous-PR de sujet. », ajouter : « `diff-revue.sh` sort en 1 si la base ne se rapatrie pas ou si le diff est vide : s'arrêter et le lire, aucun sous-agent sur un diff vide. »

### 5. La version — `.claude-plugin/plugin.json:3`

Le correctif qui suit la version de `origin/main` à l'ouverture de la PR : 7.3.0 si le ticket 17 a posé cette version, donc **7.3.1**. Critère du `README.md:179` : « Patch pour une correction » ; le script rejoint ce que son skill promet déjà (« non vide »), aucun script, skill ni gabarit n'est ajouté, aucune clé de `.claude/chaine.json` ne bouge. Si la session devait ajouter un autre code de sortie que 1, elle le dit à l'architecte avant de choisir la version.

### Fichiers partagés avec le ticket 17, lignes disjointes

`revue-adversariale/SKILL.md` (le 17 : lignes 13-16, 41, 44 ; celui-ci : 34) ; `revue-adversariale/references/CONTENU.md` (le 17 ajoute une section `scripts/chemins-sensibles.mjs` après celle-ci ; celui-ci ne touche que la section `scripts/diff-revue.sh`) ; `revue-de-ticket/SKILL.md` (le 17 : ligne 15 ; celui-ci : 30) ; `.claude-plugin/plugin.json`. D'où `Blocked by: 17`.

## Décisions

1. Sortie 1 pour les deux refus, comme la copie corrigée du projet d'origine ; aucun autre code.
2. Une zone sans changement est un diff vide : le message nomme les zones, la session saute ce lot.
3. Une base qui n'est pas `origin/…` n'est pas fetchée : la session a choisi une base locale, le script ne la remplace pas.
4. Le banc reste dans le plugin : l'étape 0 de `revue-adversariale` ne le pose pas (même choix que le banc de `chemins-sensibles.mjs`, ticket 17). Un projet qui ne repose pas `scripts/chaine/diff-revue.sh` garde son comportement d'aujourd'hui ; les deux skills disent la sortie 1, qu'une copie ancienne ne rend jamais.
5. Ni `--no-verify`, ni test retiré ou assoupli ; aucune dépendance.

## Surfaces

Banc à écrire **d'abord**, et à voir rouge sur `origin/main` :

| Surface | Preuve |
| --- | --- |
| `diff-revue.sh` | `skills/chaine/revue-adversariale/scripts/diff-revue.test.mjs` (créé), sur `depotJouet()` (importé à côté, sinon de `../../sujet/scripts/depot-jouet.mjs`, comme `fusionner/scripts/migrations-ordre.test.mjs:6-10`), `REVUE_DIR` dans un dossier temporaire, lancé par `d.lancer("-c", …)`, quatre tests : (a) une branche qui change `src/a.ts` et l'index `docs/adr/README.md` du jouet : sortie 0, `diff.patch` non vide, sans `docs/adr/README.md` (non-régression) ; (b) même branche, distant cassé (`git remote set-url origin <dossier absent>`), base `origin/develop` : sortie 1, `fetch` sur la sortie d'erreur ; (c) même distant cassé, base `HEAD~1` : sortie 0 (aucun fetch) ; (d) une branche sans changement : sortie 1, « diff vide » sur la sortie d'erreur. Rouges sur `origin/main` : (b) et (d) sortent en 0 |
| les skills | `git grep -n "Sortie 1" -- skills/chaine/revue-adversariale/SKILL.md` rend la ligne 34 ; `git grep -n "diff vide" -- skills/chaine/revue-de-ticket/SKILL.md skills/chaine/revue-adversariale/references/CONTENU.md` rend une ligne dans chacun |
| le fetch qui n'échoue plus en silence | la commande sous ce tableau ne rend que la ligne 12 (`shift`) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, au correctif qui suit celle de `origin/main` |

```bash
git grep -n -F "|| true" -- skills/chaine/revue-adversariale/scripts/diff-revue.sh
```

## Vérification

- `pnpm test` vert : le nombre de `origin/main` au départ (400 attendus après le ticket 17) plus 4. Aucun test existant modifié, désactivé ni retiré.
- `bash -n skills/chaine/revue-adversariale/scripts/diff-revue.sh` ; le garde-fou « aucun script du plugin ne saute un hook git » (`scripts/depot.test.mjs`) vert.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, ouvre sa PR hors brouillon **sans poser `à-fusionner`** (`Label: contre-revue`), et écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- Tout ce que porte le ticket 17 (chemins sensibles, prompt, migrations, recette, noms de projet).
- Les zones d'exemple de `diff-revue.sh:6,28` (`apps/api, apps/web…`) : légitimes, laissées.
- Les dépôts de projet : reposer `scripts/chaine/diff-revue.sh` est leur affaire.

## Comments

- 2026-11-14 — Sorti du ticket 17 à la relecture (coupe décidée par l'architecte). Lignes relevées sur `c9a6055`.
