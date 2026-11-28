# La table des rôles de `fusionner`, la session de travail de `sujet` et le README nomment `demande.mjs`, jamais le commentaire `À relire`

Status: ready-for-agent
Type: défaut
Modèle: sonnet — deux phrases de skill, une ligne du README et leur banc de texte, sans code ; la règle est celle du ticket 104 (`A-241` (3), confirmée par `A-242` (2)) : un texte qui fait écrire une demande nomme la commande, jamais la forme ni le commentaire. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 119 commité sur la branche
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/SKILL.md` (22, la table « La règle ») ; `skills/chaine/sujet/SKILL.md` (28, « Session de travail », point 3) ; `README.md` (180, l'arbre du dépôt) ; `scripts/bascule.test.mjs` (131, dans le test de 127-151 ; un test neuf) ; `NOTES-DE-VERSION.md`. **Dans la PR de 119 à 121, après 119** : 119 touche `scripts/bascule.test.mjs` (un test neuf) et pose la version ; 121 ne touche aucun de ces fichiers hors `NOTES-DE-VERSION.md`. Le ticket 107 a touché `fusionner/SKILL.md:97-102`, `:135`, `:138`, loin de `:22`. Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

## Le besoin

Deux remarques de relecture, laissées pour une suite (journal de la carte, 2026-11-28).

1. **PR #177** (ticket 104), 05 h 27 UTC : « `fusionner/SKILL.md:22` et `sujet/SKILL.md:28` disent encore « le commentaire `À relire` » ». Le ticket 104 a fait nommer la commande `node scripts/chaine/demande.mjs` à chaque texte qui fait écrire une demande ; ces deux phrases lui ont échappé. Une session qui lit l'une d'elles écrit le commentaire de tête, ce que le constat (8) de l'essai réel a montré (un sha faux, « complété de tête depuis un sha court »).
2. **PR #176** (ticket 101), 03 h 45 UTC : « `README.md` ne cite pas `demande.mjs` ». L'arbre du dépôt (`README.md:180`) liste les scripts de `fusionner` sans lui.

Le besoin : **ces deux phrases nomment la commande, et le README cite le script**.

## La cause, à la source

Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

1. `skills/chaine/fusionner/SKILL.md:22`, la ligne « Session de travail » de la table des rôles : « demande la relecture (`À relire`, puis `à-relire`) après son dernier push ».
2. `skills/chaine/sujet/SKILL.md:28` : « La relecture se demande après le dernier push, comme `demarrer` le dit (le commentaire `À relire`, puis l'étiquette `à-relire`) ». `demarrer` dit déjà la commande (`sujet.sh:449`, `demande_de_relecture`, qui écrit `$DEMANDE_DE_RELECTURE` de `github.sh:453`, `node scripts/chaine/demande.mjs --session …`) : la parenthèse du skill dit autre chose que ce qu'elle cite.
3. `README.md:180` : « github.sh, identifiant.mjs, file.sh, passer.sh, boucle.sh, renvoyer.sh, refus.sh, proprietaire.sh, revue-exigee.mjs, migrations-ordre.mjs, commits-a-relire.mjs, verdict.mjs et decision-relecteur.mjs […], meme-contenu.sh, double-relecture.mjs, les tests » : pas `demande.mjs`.
4. Le banc `scripts/bascule.test.mjs:131` exige la phrase de `fusionner/SKILL.md:22` telle quelle ; le test du ticket 104 (`:251-282`) ne lit ni `fusionner/SKILL.md` ni `sujet/SKILL.md` § « Session de travail ».

## Décisions

Le ticket applique `A-241` (3) (la commande, jamais la forme ; confirmée par `A-242` (2)) comme le ticket 104 ; rien n'y est à trancher.

1. **`fusionner/SKILL.md:22`** : « demande la relecture (la ligne que rend `node scripts/chaine/demande.mjs`, puis `à-relire`) après son dernier push ». Les arguments ne s'écrivent pas dans une cellule de table : l'étape 5 de `chaine-de-production.md` les donne.
2. **`sujet/SKILL.md:28`** : « La relecture se demande après le dernier push, comme `demarrer` le dit (la ligne que rend `node scripts/chaine/demande.mjs --session <la sienne> --conducteur <celle du conducteur, ou —>`, copiée dans un commentaire, puis l'étiquette `à-relire`) » : les mots et les arguments de `sujet/SKILL.md:80`, la PR de réception (ticket 104, cas 3).
3. **`README.md:180`** : `demande.mjs` (la demande `À relire`) entre dans la liste, après `decision-relecteur.mjs`.
4. **Le banc** : `scripts/bascule.test.mjs:131` suit la phrase neuve ; un test neuf tient que ni `fusionner/SKILL.md` ni `sujet/SKILL.md` ne disent plus « `À relire`, puis » ni « le commentaire `À relire` », que les deux phrases nomment `node scripts/chaine/demande.mjs`, et que `README.md` cite `demande.mjs`.
5. **La version** : celle de la PR de 119 à 121 ; la note dit que les deux skills nomment la commande.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/SKILL.md:22` | décision 1 |
| `skills/chaine/sujet/SKILL.md:28` | décision 2 |
| `README.md:180` | décision 3 |
| `scripts/bascule.test.mjs:131` | **change à dessein** : la phrase neuve |
| `scripts/bascule.test.mjs` | un test neuf (décision 4) ; `:155` (« jamais `à-fusionner`, que le Relecteur pose sur un verdict validé ») **inchangé**, la décision 2 garde cette fin de phrase |
| `NOTES-DE-VERSION.md` | la note de la PR, complétée |

Modèle : le test du ticket 104, `scripts/bascule.test.mjs:251-282`.

## À faire, dans l'ordre

1. Sur la branche de la PR, 119 commité ; relire chaque ligne citée.
2. **Le banc, rouge** : le test neuf et `:131` changé.
3. **Les trois textes**. Le banc vert.
4. Un commit ; la note complétée.
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| `fusionner/SKILL.md` § « La règle » : la ligne « Session de travail » nomme `node scripts/chaine/demande.mjs`, et `à-relire` après lui | `scripts/bascule.test.mjs:131`, à dessein |
| `fusionner/SKILL.md` et `sujet/SKILL.md` : aucun « le commentaire `À relire` », aucun « (`À relire`, puis » ; `sujet/SKILL.md` § « Session de travail » nomme la commande avec `--session` et `--conducteur` | `scripts/bascule.test.mjs`, test neuf |
| `README.md` : `demande.mjs` dans la ligne des scripts de `fusionner` | de même |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| `sujet/SKILL.md:28` remis | le test neuf |
| `fusionner/SKILL.md:22` remis | `:131` et le test neuf |
| `demande.mjs` retiré de `README.md:180` | le test neuf |

## Vérification

1. Le banc ciblé : `env -u NODE_PATH node --test scripts/bascule.test.mjs`, rouge à l'étape 2, vert après.
2. Les mutations : toutes rouges.
3. La suite entière : ticket 121, « Vérification ».

## Hors périmètre

- Les messages des scripts (`github.sh:453`, `renvoyer.sh`) : ils nomment déjà la commande (ticket 104).
- L'ADR du socle, qui écrit la forme : la décision, pas un geste (ticket 119, « Hors périmètre »).

## Comments

- 2026-11-28 — Écrit par un agent rédacteur sur `origin/main` à `b5c7ac3` (plugin 8.9.5), sur les remarques de relecture des PR #176 et #177. Les occurrences de `À relire` des skills et du README ont été relevées par `git grep` à ce sommet : seules ces deux phrases restent. `Status: ready-for-agent`.
- 2026-11-28 — Second tour de relecture : la règle citée est `A-241` (3), non `A-235` (corrigé par l'architecte).
