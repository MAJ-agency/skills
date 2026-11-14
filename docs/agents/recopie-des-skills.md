# La recopie des skills de la chaîne dans les projets

Les skills restent privés et voyagent avec chaque projet : ce dépôt les recopie dans `.claude/skills/` du projet, et un workflow ouvre la PR que le capitaine du projet fusionne.

## Ce qui est copié, et où

La commande `node scripts/recopier-skills.mjs <dossier du projet>` copie chaque skill de `skills/chaine/` que git suit (un dossier qui porte un `SKILL.md`) vers `<projet>/.claude/skills/<nom>/`, avec la même arborescence, les mêmes octets et le bit exécutable de la source. Les skills hors de `skills/chaine/` et les fichiers non suivis ne sont jamais copiés. La copie est un miroir strict : un fichier en trop est supprimé, un fichier modifié est réécrit, et un skill retiré de la source est retiré du projet.

Un dossier de `.claude/skills/` que ni la source ni le manifeste ne nomment est un skill propre au projet : la commande n'y touche pas. Si un dossier du même nom existe sans que le manifeste le nomme, elle refuse (code 1) ; `--remplacer` le remplace en entier. `--source <racine>` joue la commande depuis un autre dépôt `skills`, ce que fait le banc.

## Le manifeste

`.claude/skills/maj-skills.json` déclare la copie : la source, la version du plugin, les skills copiés et le sha256 de chaque fichier. Il ne porte ni date ni identifiant de commit : la même source donne le même manifeste, octet pour octet.

## La copie ne se modifie pas dans le projet

Une modification se fait dans ce dépôt ; la copie arrive par PR. Toute édition faite dans le projet est écrasée à la prochaine recopie.

## Ce que la copie n'est pas

Elle sert à lire les skills et leurs références, pas à exécuter leurs scripts sur place : un projet joue les siens depuis `scripts/chaine/`, et deux scripts cherchent un fichier hors de `skills/chaine/`, qu'ils ne trouvent pas dans un projet.

## Le workflow

`.github/workflows/recopier-skills.yml` se lance à chaque push sur `main` qui touche `.claude-plugin/plugin.json`, ou à la main (onglet Actions, « Recopier les skills », *Run workflow* sur `main` ; sur une autre branche il ne copie rien). Un premier job lit `scripts/recopie-projets.json` ; un second joue la commande pour chaque projet de la liste, puis ouvre une PR `chore/recopie-maj-skills` vers sa branche avec le label `à-fusionner`, ou remet à jour la PR déjà ouverte. Il ne compare pas les versions : dès que la copie diffère de la branche du projet, la PR existe.

**Limite de la file.** Un groupe de concurrence par projet : GitHub ne garde qu'une exécution en attente par groupe. La dernière gagne, et elle copie l'état de `main`.

## Ajouter un projet à la liste

Ajouter `{ "depot": "MAJ-agency/<nom>", "branche": "<branche>" }` à `scripts/recopie-projets.json`, après avoir ajouté le dépôt au jeton (ci-dessous) et vérifié la liste « Avant sa première copie ». `fedora` n'y est pas : sa chaîne est d'une version antérieure, il entre après son alignement.

## Avant sa première copie, un projet

- lève l'exclusion de git : le `.gitignore` du socle porte `.claude/*` (ligne 2), il faut ajouter `!.claude/skills/` ;
- exclut `.claude/skills/` d'`eslint` et de `prettier` (les scripts copiés font échouer `eslint .`) ;
- a les labels de la chaîne, dont `à-fusionner` (`skills/chaine/socle-chaine-de-production/references/labels.sh`).

## Le réglage unique d'un administrateur

- crée un jeton à accès fin limité aux dépôts de la liste, droits « Contents » et « Pull requests » en lecture et écriture ;
- l'enregistre comme secret d'Actions `RECOPIE_TOKEN` de ce dépôt.

Sans ce secret, le workflow échoue dès sa première étape. Le jeton par défaut d'un workflow ne peut pas écrire dans un autre dépôt, et une PR qu'il ouvrirait ne lancerait pas la CI du projet : d'où le secret.
