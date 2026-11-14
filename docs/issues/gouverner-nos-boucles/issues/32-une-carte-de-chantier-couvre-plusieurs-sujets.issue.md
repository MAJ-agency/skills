# Une carte de chantier peut couvrir plusieurs sujets : `Sujet: sujet/a, sujet/b, sujet/c` est lue partout, le gate l'admet, et `demarrer` refuse un ticket qui en nomme plusieurs

Status: Fait — PR #90
Type: défaut
Label: contre-revue
Modèle: sonnet — le code est donné en diffs et en fichiers entiers, joué sur une copie jetable de `origin/main` (voir « Vérification ») ; deux lectures communes (JS, shell), cinq lecteurs qui les appellent, dix tests donnés mot pour mot ; rien n'est à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/sujet.test.mjs`, `skills/chaine/tickets/references/scripts/docs/ligne-sujet.mjs` (créé), `skills/chaine/tickets/references/scripts/docs/ligne-sujet.test.mjs` (créé), `skills/chaine/tickets/references/scripts/docs/couts.mjs`, `skills/chaine/tickets/references/scripts/docs/couts.test.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.mjs` (commentaire), `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`, `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `skills/chaine/tickets/references/CONTENU.md`, `skills/chaine/tickets/references/agents/issue-tracker.md`, `skills/chaine/tickets/references/gabarits/carte.map.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `.claude-plugin/plugin.json`

## Le besoin

**Le fait**, rapporté le 2026-11-14 par un projet qui pose le socle : `couts.mjs` lit la ligne `Sujet:` d'une carte de chantier par `/^Sujet:[ \t]*(?:sujet\/)?(\S+)/m`, le premier mot seul. Une carte qui couvre plusieurs sujets, `Sujet: sujet/a, sujet/b, sujet/c` (cas réel, déjà dans la branche d'intégration de ce projet, sur un chantier mené par un humain), donne le chantier « `a,` », virgule comprise. L'architecte a relevé que d'autres lecteurs de la même ligne supposent un sujet par carte. **Personne ne l'avait joué : c'est fait ici, et c'est plus large que `couts.mjs`.** Sur une carte à trois sujets :

- **le gate des cartes la refuse** (`pnpm check:tickets` sort 1) : la branche d'intégration du projet passe au rouge dès la pose du plugin ;
- **`sujet.sh` ne trouve la carte d'aucun des trois sujets** : `geler` sort 4 (« n'a pas de carte »), `gel` dit « pas gelé » (sortie 1) et `degeler` répond « rien à faire » en sortie 0, donc **un chantier ne peut pas être gelé** et `file.sh` ne montre jamais « gelée » pour ses PR ; `carte <nom>` refuse en sortie 9 la mise à jour de la carte de chaque sujet ; `livre` ne voit pas la carte en phase `fini` et `livrer` ne voit pas sa phase 4 (pas de livraison intermédiaire).

**La décision de l'architecte** : la ligne `Sujet:` à plusieurs valeurs est **admise partout**. Une carte est « celle de `sujet/<nom>` » si l'une de ses valeurs le nomme exactement. Raison : la carte existe déjà chez un projet, la réécrire en plusieurs cartes toucherait le travail d'un humain, et un refus du gate ferait passer sa branche d'intégration au rouge dès la pose. Le jeu ci-dessous n'a rien trouvé qui la casse : voir « Décisions » 6 et 7 pour ce que la carte partagée entraîne (une copie par branche de sujet, une phase qui est celle du chantier).

Quand le ticket est fait : sur une carte `Sujet: sujet/a, sujet/b, sujet/c`, le gate passe, le registre des coûts nomme le chantier « a, b, c », `geler`, `gel`, `degeler`, `etat`, `carte <nom>`, `livre` et `livrer` trouvent la carte pour chacun des trois sujets, et `demarrer` refuse (sortie 4) un ticket dont la ligne `Sujet:` en nomme plusieurs : un ticket se démarre sur un seul sujet.

## Où

Base : `origin/main` à `cadb4e5` (plugin **7.7.0**, **456 tests**). Les lignes ont été relevées le 2026-11-14. La session les retrouve par leur texte.

### Le relevé : tous les lecteurs de la ligne `Sujet:`

`git grep -n "Sujet" origin/main -- 'skills/**/*.mjs' 'skills/**/*.sh'`. « Rend » : ce que le lecteur donne **aujourd'hui** sur la ligne en tête de colonne (joué sur le jouet, voir « Reproduction »).

**Cartes** (`docs/**/*.map.md`) :

| Lecteur | Motif exact | `Sujet: sujet/a, sujet/b, sujet/c` | `Sujet: sujet/a sujet/b` | `- **Sujet :** sujet/a, sujet/b` | Lecture ou écriture |
| --- | --- | --- | --- | --- | --- |
| `couts.mjs` `lireCarte` (`:48`) | `/^Sujet:[ \t]*(?:sujet\/)?(\S+)/m` | chantier `a,` | chantier `a` | non lue : chantier = nom du fichier | lit ; le chantier est un libellé du registre `docs/agents/couts.md` (aucune clé) |
| gate des cartes `controlerCarte` (`tickets-regles.mjs` `:171` `SUJET`, `:545-550`) | `/^Sujet\s*:\s*(.*)$/`, puis `^sujet\/[a-z0-9]+(?:-[a-z0-9]+)*$` | **écart** : « attendu `sujet/<nom-en-kebab>` » | écart | ligne ignorée : la carte n'est pas une carte (`carte: false`), non contrôlée | lit |
| `sujet.sh` `sujet_livre` (`:182`), `phase_carte` (`:202`), `carte_fichier` (`:218`) | `grep -qE "^(- )?\**Sujet ?:\** *sujet/${nom}[[:space:]]*$"` | aucune carte pour a, b ni c | aucune | trouvée seulement si **une** valeur : `- **Sujet :** sujet/a` | lisent ; `carte_fichier` nourrit `gel_de` (`gel`, `etat`, `refuser_si_gele`, `fusionner`, `livrer`, `file.sh` « gelée ») et `ecrire_gel` (**écrit** : `geler`, `degeler`) |
| `sujet.sh` `carte_cite_le_sujet` (`:885`) | awk, première ligne `Sujet:` de l'en-tête, `l == s` | refus : sortie 9 | refus | refus | lit ; garde de `carte <nom>` (**écrit** : pousse sur `origin/sujet/<nom>`) |

**Specs et tickets** (un seul sujet : ils se démarrent sur un seul) :

| Lecteur | Motif exact | `Sujet: sujet/a, sujet/b, sujet/c` | `Sujet: sujet/a sujet/b` | `- **Sujet :** sujet/a, sujet/b` | Lecture ou écriture |
| --- | --- | --- | --- | --- | --- |
| gate des tickets `controlerTicket` (`tickets-regles.mjs` `:515`) | `^sujet\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\s\|$)` | **écart** | passe (seul le premier mot est vu) | ligne ignorée | lit |
| `avancement.mjs` (`:74`) | `/^(?:- )?\**Sujet\**\s*:\**\s*(sujet\/[a-z0-9-]+)/m`, sur les `.spec.md` et `.issue.md` seulement (`specDe`, `specDuFichier`) ; **jamais une carte** | `sujet/a` | `sujet/a` | `sujet/a` | lit |
| `sujet.sh` `carte` sans argument (`:98` `LIGNE_SUJET`, `:100-111`), donc `de`, `demarrer` (`sujet_du_ticket`), `etat`, `livrer-prets` et `file.sh` (colonne 2 de `sujet.sh carte`) | `git grep -E -m1 -o '^(- )?\**Sujet ?:\** *sujet/[a-z0-9][a-z0-9-]*'` sur `docs/*.spec.md` et `docs/*.issue.md` | le premier : `a` | `a` | `a` | lisent ; `demarrer` écrit (branche de travail) sur ce sujet |

Aucun autre script ne lit la ligne `Sujet:` d'une carte, d'une spec ou d'un ticket : `vagues.mjs`, `ticket-libre.mjs`, `archiver-tickets.mjs`, `contexte-ticket.mjs`, `boucle.sh`, `passer.sh`, les hooks d'agent. `passer.sh` **écrit** `Sujet: sujet/<nom>` dans le corps du commit de merge d'une livraison, une ligne par commit, un nom, que `sujet_livre` retrouve par `git log --grep` : c'est un message de commit, pas une carte, il ne change pas. Joués sur la carte à trois sujets : `avancement.mjs`, `vagues.mjs` et `ticket-libre.mjs` ne bougent pas.

### Reproduction, copie jetable de `origin/main`

Dépôt jouet des bancs (`depotJouet()` de `sujet/scripts/depot-jouet.mjs`) : une carte `docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md` à `Sujet: sujet/a, sujet/b, sujet/c` sur `develop` et sur les trois branches `sujet/a`, `sujet/b`, `sujet/c`, trois specs (`Sujet: sujet/a`, `sujet/b`, `sujet/c`) et leurs tickets, une spec `SPEC_ALL_DEM-4` à `Sujet: sujet/a, sujet/b`.

Côté `skills/chaine/tickets` (dépôt jouet du skill `tickets`, carte avec une ligne de coût) :

| Commande | Avant | Après |
| --- | --- | --- |
| `node scripts/docs/couts.mjs`, ligne « Par chantier » | `\| a,       \| 4-vague-1 \| 1 \| 1 \| 1,50 …` | `\| a, b, c  \| 4-vague-1 \| 1 \| 1 \| 1,50 …` |
| `node scripts/verify/tickets.mjs` | sortie 1, `…SPEC_ALL_DEM-1-demo.map.md:3 : carte SPEC_ALL_DEM-1-demo.map.md : Sujet « sujet/a, sujet/b, sujet/c » : attendu \`sujet/<nom-en-kebab>\`` | sortie 0, `tickets : OK … 1 carte(s)` |
| `node scripts/docs/avancement.mjs sujet/b` | tableau de `SPEC_ALL_DEM-2.01` (spec `sujet/b`) : correct, la carte n'est pas lue | inchangé |
| `node scripts/docs/avancement.mjs sujet/a` | `SPEC_ALL_DEM-1.01` et `SPEC_ALL_DEM-4.01` : la spec `Sujet: sujet/a, sujet/b` est lue pour `a` seul | inchangé (une spec n'a qu'un sujet) |
| `node scripts/docs/vagues.mjs SPEC_ALL_DEM-1`, `ticket-libre.mjs SPEC_ALL_DEM-1.01` | normaux | inchangés |

Côté `sujet.sh` (mêmes sorties pour chacun de `a`, `b`, `c`, `<x>` le sujet) :

| Commande | Avant | Après |
| --- | --- | --- |
| `sujet.sh geler <x> pause` | sortie 4 : `sujet/<x> n'a pas de carte sur sa branche (ligne Sujet: sujet/<x> d'un docs/**/*.map.md) : un sujet sans carte ne se gèle pas` | sortie 0 : `sujet/<x> gelé : plus aucune session n'en part, plus aucune de ses PR n'entre` |
| `sujet.sh gel <x>` | sortie 1, rien | sortie 0 : `2026-11-14 — pause` |
| `sujet.sh degeler <x>` (sujet non gelé, faute de gel possible) | sortie 0 : `sujet/<x> n'est pas gelé : rien à faire` | sortie 0 après un `geler` : `sujet/<x> dégelé. Le conducteur ne se réveille pas tout seul …` |
| `sujet.sh carte <x>` (un commit qui modifie la carte, sur une branche partie de `origin/sujet/<x>`) | sortie 9 : `REFUS : docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md ne déclarait pas Sujet: sujet/<x> avant <sha> : la carte d'un autre sujet ne se pousse pas ici` | sortie 0 : `carte poussée : 1 commit(s) sur sujet/<x>` |
| `sujet.sh etat`, après un gel de `b` | `b … en cours` (le gel n'est pas lu) | `b … gelé`, `a`, `c` : `en cours` |
| `file.sh`, PR vers develop du ticket `SPEC_ALL_DEM-2.01` (spec `sujet/b`) après un gel de `b` | `12	vers sujet/b …` | `12	gelée …` ; les PR de `a` : `vers sujet/a` |
| `sujet.sh livre <x>` (carte en `Phase: fini` sur develop, aucune branche de sujet) | sortie 1 : pas livré | sortie 0 : livré |
| `sujet.sh livrer b "<titre>"` (carte en phase 4 sur `sujet/b`) | tête de la PR `sujet/b` (pas de livraison intermédiaire) | tête `livraison/b-<date>` |
| `sujet.sh rafraichir <x>` | sortie 0 | sortie 0 (il ne lit pas la carte) |
| `sujet.sh demarrer SPEC_ALL_DEM-4.01` (spec `Sujet: sujet/a, sujet/b`) | sortie 0, `base=sujet/a` : le premier, en silence | sortie 4 : `SPEC_ALL_DEM-4.01 déclare plusieurs sujets (Sujet: sujet/a, sujet/b) : un ticket se démarre sur un seul sujet.` |

## Décisions

1. **Une carte est celle de `sujet/<nom>` si l'une des valeurs de sa ligne `Sujet:` le nomme exactement.** C'est la décision de l'architecte ; elle vaut pour le gate, pour `couts.mjs` et pour chaque commande de `sujet.sh` qui lit une carte (`sujet_livre`, `phase_carte`, `carte_fichier`, `carte_cite_le_sujet`).
2. **La forme de la liste** : des `sujet/<nom-en-kebab>` séparés par des **virgules**, espaces tolérées autour (`sujet/a,sujet/b` et `sujet/a , sujet/b` passent). L'espace seul n'est pas un séparateur : `sujet/a sujet/b` est une ligne mal formée. Une ligne dont **une** valeur n'est pas un nom de sujet (virgule en trop, majuscule, texte accolé, `sujet/a (lot 1)`) ne nomme **personne** : jamais de lecture partielle. Le préfixe `sujet/` est obligatoire, sauf pour `couts.mjs` qui acceptait un nom nu (`Sujet: demo`). Une tabulation après `Sujet:` est lue comme une espace, côté JS et côté shell. Les noms : kebab strict côté JS (`^[a-z0-9]+(?:-[a-z0-9]+)*$`, la règle du gate des cartes) ; côté shell `^sujet/[a-z0-9][a-z0-9-]*$`, la règle que `sujet.sh` applique déjà à un nom de sujet.
3. **La forme `- **Sujet :** sujet/a, sujet/b`** est lue par `sujet.sh` (toutes ses commandes, comme avant, valeur unique ou liste) et par `avancement.mjs` (specs et tickets). Elle n'est lue ni par `couts.mjs` ni par le gate des cartes, et **cela ne change pas** : l'y admettre ferait entrer dans le gate des cartes jamais contrôlées, donc rouge chez les projets qui en ont une.
4. **`couts.mjs` rend le chantier par tous les sujets, dans l'ordre, séparés par `, `** (`a, b, c`), pas par le premier. Le nom n'est pas une clé : il n'est lu que par `enMarkdown`, pour deux colonnes « Chantier » du registre. Le premier seul ferait lire que le coût est celui de `a`. Une ligne mal formée donne le nom du fichier, comme une carte sans `Sujet:`.
5. **Un ticket ou une spec n'a qu'un sujet.** Le gate des tickets ne change pas (il refuse déjà la virgule). **`sujet.sh demarrer` refuse (sortie 4)** un ticket dont la ligne qui fait foi, la sienne, sinon celle de sa spec, nomme plusieurs sujets, par virgule ou par espace (`sujet/a, sujet/b`, `sujet/a sujet/b`). Un ticket qui a sa propre ligne à un seul sujet passe, quelle que soit celle de sa spec. `avancement.mjs`, `vagues.mjs`, `ticket-libre.mjs`, `file.sh` ne changent pas : ils ne lisent pas les cartes.
6. **Les commandes qui écrivent n'écrivent pas davantage.** `geler`, `degeler` et `carte <nom>` écrivent sur `origin/sujet/<nom>`, dans la copie de la carte **de cette branche**, comme avant : `geler b` ne gèle ni `a` ni `c`, la ligne `Gel:` vit dans la copie de `sujet/b`, et `gel a` reste « pas gelé ». Conséquence, à savoir **non corrigée ici**, **acceptée par l'architecte** : une carte à trois sujets vit en **trois copies**, une par branche de sujet (née de develop), et `carte <nom>` n'en met à jour qu'une ; pour que les trois se ressemblent, le conducteur rejoue `carte` sur chaque nom. Les copies divergentes se rejoignent par `rafraichir` (fusion de develop dans le sujet) : un conflit sur la carte est possible, il se résout comme un autre.
7. **La phase d'une carte partagée est celle du chantier.** `sujet_livre` lit la carte sur develop : `Phase: 6-nettoyage` ou `fini` donne **tous** ses sujets pour livrés (`demarrer` refuse alors de les rouvrir, `file.sh` classe leurs PR directes). Le conducteur ne pose donc `6-nettoyage` qu'après la livraison du dernier sujet : une phrase le dit dans `sujet/SKILL.md` (§ 4, texte 1). Aucun code pour cela. **Accepté par l'architecte.**
8. **Version : mineure, 7.7.0 → 7.8.0.** Deux raisons, chacune suffit : un fichier est **ajouté** à ce que `poser` copie chez un projet (`scripts/docs/ligne-sujet.mjs` et son test), et un format que lisent les scripts **s'élargit** (la ligne `Sujet:` d'une carte). Le contenu de fichiers déjà posés change aussi (`couts.mjs`, `tickets-regles.mjs`, `sujet.sh`), mais seul, il ne ferait qu'un correctif. **Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre la version qui suit la sienne.**
9. **Pas de coupe.** Le lot touche huit fichiers de code, tests compris, plus un commentaire d'en-tête de `tickets.mjs` : quatre sources (`ligne-sujet.mjs`, `couts.mjs`, `tickets-regles.mjs`, `sujet.sh`) et quatre fichiers de test.
10. PR vers `main`, titre `fix(chaine): une carte de chantier couvre plusieurs sujets (plugin <version>)`. `Label: contre-revue` : PR ouverte hors brouillon, **sans `à-fusionner`**, et un mot à l'architecte dès la PR livrée. Commits sous les hooks, jamais `--no-verify`. Aucun test retiré, sauté ni assoupli : les assertions des tests existants ne changent pas.

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges sur `origin/main`

Poser les tests des §§ 6 à 9 (le fichier créé `ligne-sujet.test.mjs` du § 9 ne trouve pas son module : rouge aussi), puis `node --test` sur les quatre fichiers : **sept tests rouges** (33 à 37 de `sujet.test.mjs`, celui de `couts.test.mjs`, celui de `tickets.test.mjs`), les trois de `ligne-sujet.test.mjs` en erreur de module. Messages attendus, entre autres : `sujet/b n'a pas de carte sur sa branche …`, `expected: 'a, b, c' / actual: 'a,'`, `REFUS : … ne déclarait pas Sujet: sujet/a avant …`. Puis les §§ 1 à 5 : tout passe.

### 1. `skills/chaine/tickets/references/scripts/docs/ligne-sujet.mjs` (créé)

La lecture commune côté JS. Fichier entier :

```js
/**
 * Valeurs de la ligne `Sujet:` d'une carte de chantier. Une carte peut couvrir plusieurs sujets :
 * `Sujet: sujet/a, sujet/b, sujet/c`. Un ticket et une spec n'en nomment qu'un.
 * Lue par `couts.mjs` et par le gate des cartes (`verify/tickets-regles.mjs`) ; son équivalent
 * côté shell est `carte_nomme_le_sujet` de `sujet.sh`, qui lit la même forme.
 */

/** Un nom de sujet : kebab-case (la règle du gate des cartes). */
const NOM = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Les noms que porte la valeur d'une ligne `Sujet:` (le texte après `Sujet:`), dans l'ordre :
 * `sujet/a, sujet/b` → `['a', 'b']`. Valeurs séparées par des virgules, espaces tolérées autour ;
 * chacune est `sujet/<nom-en-kebab>` (le préfixe est facultatif avec `prefixeFacultatif`). Rend `null`
 * quand la valeur est vide ou qu'une valeur n'est pas un nom de sujet : virgule en trop, espace
 * pour seul séparateur, majuscule. Jamais de lecture partielle.
 */
export function nomsDeSujets(valeur, { prefixeFacultatif = false } = {}) {
  const noms = valeur
    .trim()
    .split(/\s*,\s*/)
    .map((v) => (v.startsWith('sujet/') ? v.slice('sujet/'.length) : prefixeFacultatif ? v : null));
  return noms.every((n) => n !== null && NOM.test(n)) ? noms : null;
}
```

### 2. `couts.mjs` et `tickets-regles.mjs` appellent `nomsDeSujets`

Diff exact (à appliquer à la main ou par `git apply`) :

```diff
diff --git a/skills/chaine/tickets/references/scripts/docs/couts.mjs b/skills/chaine/tickets/references/scripts/docs/couts.mjs
index daecc1e..1cc3955 100644
--- a/skills/chaine/tickets/references/scripts/docs/couts.mjs
+++ b/skills/chaine/tickets/references/scripts/docs/couts.mjs
@@ -19,4 +19,5 @@ import { join } from "node:path";
 import { pathToFileURL } from "node:url";
 import { lireTicket } from "./identifiants.mjs";
+import { nomsDeSujets } from "./ligne-sujet.mjs";
 
 export const REGISTRE = "docs/agents/couts.md";
@@ -41,10 +42,13 @@ const cellules = (ligne) =>
 
 /**
- * Une carte → son chantier, sa phase, ses lignes de coût et ses lignes illisibles. Une ligne
+ * Une carte → son chantier, sa phase, ses lignes de coût et ses lignes illisibles. Le chantier est
+ * le sujet de la carte, ou tous ses sujets séparés par `, ` quand elle en couvre plusieurs ; une
+ * ligne `Sujet:` mal formée donne le nom du fichier. Une ligne
  * sans montant (gabarit, relevé à venir, cellule vide) est ignorée sans bruit ; une ligne dont la
  * cellule porte autre chose est rendue dans `illisibles` (`{ cout, ligne }`) : `--verify` la refuse.
  */
 export function lireCarte(chemin, texte) {
-  const sujet = /^Sujet:[ \t]*(?:sujet\/)?(\S+)/m.exec(texte);
+  const sujet = /^Sujet:[ \t]*(.*)$/m.exec(texte);
+  const sujets = sujet && nomsDeSujets(sujet[1], { prefixeFacultatif: true });
   const phase = /^Phase:[ \t]*(\S.*)$/m.exec(texte);
   const section = /^## Coût[ \t]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texte);
@@ -70,5 +74,6 @@ export function lireCarte(chemin, texte) {
   return {
     chemin,
-    chantier: sujet ? sujet[1] : chemin.replace(/^.*\//, "").replace(/\.map\.md$/, ""),
+    // Une carte à plusieurs sujets : tous, dans l'ordre. Le nom ne sert que de libellé au registre.
+    chantier: sujets ? sujets.join(", ") : chemin.replace(/^.*\//, "").replace(/\.map\.md$/, ""),
     phase: phase ? phase[1].trim() : "—",
     lignes,
diff --git a/skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs b/skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs
index cfbddff..4dc891a 100644
--- a/skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs
+++ b/skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs
@@ -6,4 +6,5 @@
  * `docs/agents/chaine-de-production.md` § 3. Tout changement passe d'abord par ces fichiers.
  */
+import { nomsDeSujets } from '../docs/ligne-sujet.mjs';
 import { TICKET, identifiantDeLaSpec, identifiantDuTicket, estArchive, lireIdentifiant, litteral, dossierDuContexte, REGLE } from '../docs/identifiants.mjs';
 
@@ -534,5 +535,6 @@ const phaseValide = (v) => /^(1-grilling|2-decoupage|3-specs-en-fusion|4-vague-[
 /**
  * Contrôle de la fiche d'une carte de chantier (`*.map.md` portant une ligne `Sujet:`). Une carte
- * sans ligne `Sujet:` n'est pas une carte de chantier : ignorée (`carte: false`).
+ * sans ligne `Sujet:` n'est pas une carte de chantier : ignorée (`carte: false`). Une carte peut couvrir
+ * plusieurs sujets (`Sujet: sujet/a, sujet/b`) ; un ticket n'en nomme qu'un.
  * La fiche nomme `Responsable:` (une personne, jamais un identifiant de session) et `Conducteur:` (la
  * session qui mène le chantier) ; `Architecte:` (la session du programme) est facultative.
@@ -547,6 +549,9 @@ export function controlerCarte({ nom, texte, ficheGelee = false, plafonds = null
   const erreurs = [];
   const corps = sections(lignes);
-  if (!/^sujet\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sujet.valeur))
-    erreurs.push({ ligne: sujet.ligne, message: `carte ${nom} : Sujet « ${sujet.valeur} » : attendu \`sujet/<nom-en-kebab>\`` });
+  if (!nomsDeSujets(sujet.valeur))
+    erreurs.push({
+      ligne: sujet.ligne,
+      message: `carte ${nom} : Sujet « ${sujet.valeur} » : attendu \`sujet/<nom-en-kebab>\`, ou plusieurs séparés par des virgules (\`sujet/a, sujet/b\`)`,
+    });
   if (!corps.has('Fiche')) erreurs.push({ ligne: 1, message: `carte ${nom} : section \`## Fiche\` absente` });
   const phase = chercher(lignes, PHASE);
```

`avancement.mjs` ne change pas (décision 5).

### 3. `skills/chaine/sujet/scripts/sujet.sh`

La lecture commune côté shell (`AWK_NOMME`, `carte_nomme_le_sujet`), appelée par `sujet_livre`, `phase_carte`, `carte_fichier` ; `carte_cite_le_sujet` appelle la même fonction awk `nomme` ; `carte` est coupée en `carte` (qui rapatrie) et `carte_lue` (qui lit), et `demarrer` refuse un ticket à plusieurs sujets. Diff exact :

```diff
diff --git a/skills/chaine/sujet/scripts/sujet.sh b/skills/chaine/sujet/scripts/sujet.sh
index 60dbcf9..fe6b08a 100755
--- a/skills/chaine/sujet/scripts/sujet.sh
+++ b/skills/chaine/sujet/scripts/sujet.sh
@@ -45,6 +45,7 @@
 #                         (le hook d'agent refuse tout `git push` vers sujet/…). Chaque commit modifie en
 #                         place UN fichier docs/**/*.map.md et rien d'autre (ni création, ni suppression,
-#                         ni renommage, ni mode), dont la ligne `Sujet:` nomme exactement sujet/<nom>
-#                         avant comme après, et ce fichier est formaté par Prettier. Une branche en retard
+#                         ni renommage, ni mode), dont la ligne `Sujet:` nomme sujet/<nom> avant comme
+#                         après (seul, ou parmi plusieurs : `Sujet: sujet/a, sujet/b`), et ce fichier est
+#                         formaté par Prettier. Une branche en retard
 #                         rattrape le sujet par `git merge --ff-only` ; historique divergent, commit de
 #                         fusion ou option (jamais de push forcé) : sortie 9, rien n'est poussé
@@ -100,4 +101,27 @@ branches_sujet() { git for-each-ref --format='%(refname:short)' 'refs/remotes/or
 carte() {
   git fetch -q origin develop '+refs/heads/sujet/*:refs/remotes/origin/sujet/*' 2>/dev/null || true
+  carte_lue
+}
+# Un ticket ou une spec n'a qu'un sujet : la ligne `Sujet:` qui en nomme plusieurs
+# (`Sujet: sujet/a, sujet/b` ou `sujet/a sujet/b`) n'est lue que par `demarrer`, qui la refuse ;
+# seule une carte de chantier (`docs/**/*.map.md`) peut couvrir plusieurs sujets.
+LIGNE_PLUSIEURS="${LIGNE_SUJET}[[:space:],]+sujet/.*"
+# « ticket<TAB>valeurs » pour chaque ticket ou spec dont une ligne `Sujet:` nomme plusieurs sujets.
+declarations_multiples() {
+  # shellcheck disable=SC2046
+  { git grep -E -m1 -o "$LIGNE_PLUSIEURS" origin/develop $(branches_sujet) -- \
+    'docs/*.spec.md' 'docs/*.issue.md' ':!docs/*/issues/archive/*' 2>/dev/null || true; } |
+    sed -E 's#^[^:]+:##; s#:(- )?\**Sujet ?:\** *#\t#' |
+    identifiant fichiers | sort -u
+}
+# Valeurs de la ligne `Sujet:` qui fait foi pour un ticket (la sienne, sinon celle de sa spec) quand
+# elle nomme plusieurs sujets ; vide sinon. À lire après `carte` (qui rapatrie les branches).
+sujets_multiples_du_ticket() {
+  local t=$1 cible
+  cible=${t%.*}
+  [ -z "$(carte_lue | awk -F '\t' -v t="$t" '$1 == t { print "oui" }')" ] || cible=$t
+  declarations_multiples | awk -F '\t' -v c="$cible" '$1 == c && !f { print $2; f = 1 }'
+}
+carte_lue() {
   # shellcheck disable=SC2046
   git grep -h -E -m1 -o "$LIGNE_SUJET" origin/develop $(branches_sujet) -- \
@@ -169,4 +193,22 @@ Attendre que leur PR y soit fusionnée, puis relancer demarrer. Ne pas fusionner
 }
 
+# Une carte de chantier peut couvrir plusieurs sujets : `Sujet: sujet/a, sujet/b, sujet/c` (virgules,
+# espaces tolérées autour). Elle « nomme » `sujet/<nom>` quand l'une de ses valeurs l'est exactement ;
+# une ligne dont une valeur n'est pas `sujet/<nom-en-kebab>` (espace seul pour séparateur, virgule en
+# trop) ne nomme personne : jamais de demi-lecture. Lit la même forme que son équivalent JS,
+# `nomsDeSujets` (skill `tickets`, scripts/docs/ligne-sujet.mjs), hors tiret final ou double, que le
+# gate refuse avant. `nomme(ligne, sujet/<nom>)` reçoit la ligne entière.
+AWK_NOMME='function nomme(l, s,    n, v, i) {
+  sub(/^(- )?\**Sujet ?:\**[ \t]*/, "", l); sub(/[[:space:]]+$/, "", l)
+  n = split(l, v, /[ \t]*,[ \t]*/)
+  for (i = 1; i <= n; i++) if (v[i] !~ /^sujet\/[a-z0-9][a-z0-9-]*$/) return 0
+  for (i = 1; i <= n; i++) if (v[i] == s) return 1
+  return 0
+}'
+# Vrai si la carte reçue sur l'entrée standard a une ligne `Sujet:` qui nomme le sujet <nom>.
+carte_nomme_le_sujet() {
+  awk -v s="sujet/$1" "$AWK_NOMME"' /^(- )?\**Sujet ?:/ { if (nomme($0, s)) ok = 1 } END { exit !ok }'
+}
+
 # Sujet livré : sa carte (`docs/**/*.map.md` dont la ligne `Sujet:` le nomme), lue sur
 # origin/develop, porte `Phase: 6-nettoyage` ou `Phase: fini` ; à défaut de carte, la branche
@@ -180,5 +222,5 @@ sujet_livre() {
   git fetch -q origin develop 2>/dev/null || true
   while IFS= read -r f; do
-    git show "origin/develop:$f" | grep -qE "^(- )?\**Sujet ?:\** *sujet/${nom}[[:space:]]*\$" || continue
+    git show "origin/develop:$f" | carte_nomme_le_sujet "$nom" || continue
     trouve=1
     phase=$(git show "origin/develop:$f" | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
@@ -200,5 +242,5 @@ phase_carte() {
     git rev-parse -q --verify "$ref" >/dev/null || continue
     while IFS= read -r f; do
-      git show "$ref:$f" | grep -qE "^(- )?\**Sujet ?:\** *sujet/${nom}[[:space:]]*\$" || continue
+      git show "$ref:$f" | carte_nomme_le_sujet "$nom" || continue
       phase=$(git show "$ref:$f" | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
       break
@@ -216,5 +258,5 @@ carte_fichier() {
   local ref=$1 nom=$2 f
   while IFS= read -r f; do
-    git show "$ref:$f" | grep -qE "^(- )?\**Sujet ?:\** *sujet/${nom}[[:space:]]*\$" || continue
+    git show "$ref:$f" | carte_nomme_le_sujet "$nom" || continue
     printf '%s\n' "$f"
     return 0
@@ -264,5 +306,5 @@ ecrire_gel() {
     git fetch -q origin "+refs/heads/sujet/$nom:refs/remotes/origin/sujet/$nom" 2>/dev/null || sortir 9 "origin/sujet/$nom introuvable"
     f=$(carte_fichier "origin/sujet/$nom" "$nom")
-    [ -n "$f" ] || sortir 4 "sujet/$nom n'a pas de carte sur sa branche (ligne Sujet: sujet/$nom d'un docs/**/*.map.md) : un sujet sans carte ne se gèle pas"
+    [ -n "$f" ] || sortir 4 "sujet/$nom n'a pas de carte sur sa branche (un docs/**/*.map.md dont la ligne Sujet: nomme sujet/$nom) : un sujet sans carte ne se gèle pas"
     mode=$(git ls-tree "origin/sujet/$nom" -- "$f" | awk '{ print $1 }')
     nouveau=$(git show "origin/sujet/$nom:$f" | reecrire_gel "$valeur") ||
@@ -325,5 +367,5 @@ refuser_si_gele() {
 demarrer() {
   local arg=${1:?identifiant de ticket (SPEC_ALL_SOC-1.02) ou nom de sujet}
-  local nom branche courante ticket='' ref present=''
+  local nom branche courante ticket='' ref present='' multiple
   if ticket=$(identifiant lire "$arg"); then
     arg=$ticket
@@ -342,4 +384,8 @@ Ne pas partir de la branche de specs : attendre sa fusion (ou \`sujet.sh ouvrir
       return 0
     fi
+    multiple=$(sujets_multiples_du_ticket "$arg")
+    [ -z "$multiple" ] || sortir 4 "$arg déclare plusieurs sujets (Sujet: $multiple) : un ticket se démarre sur un seul sujet.
+Seule une carte de chantier (docs/**/*.map.md) peut en nommer plusieurs. Déclarer un seul sujet dans le ticket
+ou dans sa spec (ligne « Sujet: sujet/<nom> »), puis relancer."
   else
     nom=${arg#sujet/}
@@ -881,11 +927,12 @@ livrer_prets() {
 # `carte <nom>` : voir l'en-tête. Avec `geler` et `degeler` (qui ne changent que la ligne `Gel:`), le seul geste d'écriture d'une session sur un sujet.
 # Vrai si la carte `<rev>:<chemin>` déclare, en première ligne `Sujet:` de son en-tête (avant le
-# premier `## `), exactement `sujet/<nom>` : la lecture de `sujet_livre` et `phase_carte`. awk lit
+# premier `## `), `sujet/<nom>` seul ou parmi plusieurs valeurs (`carte_nomme_le_sujet`) : la lecture
+# de `sujet_livre` et `phase_carte`. awk lit
 # tout le flux (pas de sortie anticipée) : sous pipefail, un SIGPIPE de git ferait un faux refus.
 carte_cite_le_sujet() {
-  git cat-file blob "$1" 2>/dev/null | awk -v s="sujet/$2" '
+  git cat-file blob "$1" 2>/dev/null | awk -v s="sujet/$2" "$AWK_NOMME"'
     fini { next }
     /^## / { fini = 1; next }
-    /^(- )?\**Sujet ?:/ { l = $0; sub(/^(- )?\**Sujet ?:\** */, "", l); sub(/[[:space:]]+$/, "", l); ok = (l == s); fini = 1 }
+    /^(- )?\**Sujet ?:/ { ok = nomme($0, s); fini = 1 }
     END { exit !ok }'
 }
```

Deux pièges déjà joués : `git grep` sans résultat sort 1, et sous `set -o pipefail` la fonction `declarations_multiples` aurait fait sortir `demarrer` en silence (d'où l'accolade `{ … || true; }`) ; `carte_nomme_le_sujet` lit tout son flux (pas de `exit` anticipé) pour qu'un SIGPIPE de `git show` ne fasse pas un faux refus. Les messages `plus exactement` et `ne déclarait pas` de `carte <nom>` ne changent pas : `sujet.test.mjs` et `sujet-carte.test.mjs` les assertent.

### 4. Les textes

Une phrase par endroit, huit entrées. Dans chacun, la ligne citée ne change que par l'ajout ou le remplacement dit ; **le reste de la ligne reste tel quel**.

1. `skills/chaine/sujet/SKILL.md`, ligne 20 : à la suite de la phrase `Sans ticket, la première session du lot choisit le nom et le transmet aux suivantes.`, dans la même ligne, ajouter :

```text
 Une carte de chantier peut couvrir plusieurs sujets (`Sujet: sujet/a, sujet/b, sujet/c`, virgules) : elle est celle de chacun, et chaque commande de `sujet.sh` la trouve quand l'une de ses valeurs nomme le sujet (sa phase est celle du chantier : `6-nettoyage` ou `fini` donne tous ses sujets pour livrés, donc ne la poser qu'après la livraison du dernier) ; une spec ou un ticket n'en nomme qu'un, et `demarrer` refuse (sortie 4) un ticket dont la ligne en nomme plusieurs.
```

2. `skills/chaine/sujet/references/CONTENU.md`, ligne 7 : remplacer `ligne `Sujet:` exacte avant et après, Prettier passé)` par :

```text
ligne `Sujet:` qui nomme ce sujet avant et après, seul ou parmi plusieurs, Prettier passé)
```

3. `skills/chaine/tickets/references/CONTENU.md`, ligne 29 : remplacer `Sujet:` bien formé,` (le texte, sans guillemets) par :

```text
`Sujet:` bien formé (une carte de chantier peut en nommer plusieurs, séparés par des virgules),
```

4. `skills/chaine/tickets/references/agents/issue-tracker.md`, ligne 14 : remplacer `Pas de ligne : la PR vise develop.` par :

```text
Pas de ligne : la PR vise develop. Seule une carte de chantier (`*.map.md`) peut nommer plusieurs sujets (`Sujet: sujet/a, sujet/b`, virgules) ; une spec ou un ticket n'en nomme qu'un.
```

5. `skills/chaine/tickets/references/gabarits/carte.map.md` : après la ligne 3 `Sujet: sujet/{{nom}}`, insérer une ligne vide puis cette ligne (le reste du gabarit ne change pas) :

```text
<!-- Un chantier sur plusieurs sujets : une seule ligne, valeurs séparées par des virgules (sujet/a, sujet/b). -->
```

6. `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, ligne 35 : remplacer `celui dont la ligne `Sujet:` nomme exactement le sujet, avant comme après le commit, formaté par Prettier)` par :

```text
celui dont la ligne `Sujet:` nomme le sujet, seul ou parmi plusieurs valeurs séparées par des virgules, avant comme après le commit, formaté par Prettier)
```

7. `skills/chaine/sujet/SKILL.md`, ligne 42 : remplacer `dont la ligne `Sujet:` nomme exactement `sujet/<nom>` avant comme après.` (la phrase se trouve une seule fois) par :

```text
dont la ligne `Sujet:` nomme `sujet/<nom>`, seul ou parmi plusieurs valeurs séparées par des virgules, avant comme après.
```

8. `skills/chaine/tickets/references/scripts/verify/tickets.mjs`, ligne 12 (commentaire d'en-tête) : remplacer ` *   3. `Sujet:` de la forme `sujet/<kebab>` ;` par :

```text
 *   3. `Sujet:` : une ou plusieurs valeurs `sujet/<kebab>` séparées par des virgules ;
```

Le commentaire du gabarit est une ligne d'HTML : aucun lecteur de la ligne `Sujet:` ne la voit (tous sont ancrés en début de ligne sur `Sujet`).

### 5. `.claude-plugin/plugin.json`

`"version": "7.7.0"` devient `"version": "7.8.0"` (décision 8). Rien d'autre ne change dans ce fichier.

### 6. Tests de `sujet.test.mjs` (cinq, à la fin du fichier)

Ajouter, après `import assert from "node:assert/strict";`, les deux lignes `import { chmodSync, writeFileSync } from "node:fs";` et `import { join } from "node:path";`. Puis ajouter **à la fin du fichier**, après le dernier test existant, ce bloc mot pour mot :

```js
// =============================================================================
// Une carte de chantier peut couvrir plusieurs sujets : `Sujet: sujet/a, sujet/b, sujet/c`.
// Chaque commande qui lit la carte d'un sujet la trouve quand l'une des valeurs le nomme.
// =============================================================================
const CARTE_MULTI = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
const carteMulti = (ligne = "Sujet: sujet/a, sujet/b, sujet/c", phase = "4-vague-1", suite = "") =>
  `# SPEC_ALL_DEM-1 — Carte\n\n${ligne}\n\n## Fiche\n\nPhase: ${phase}\nConducteur: session_y${suite}\n\n## Decisions-so-far\n\n- A-1 — x\n`;

// Le faux `pnpm` du jouet ne formate rien : un « Prettier » identité, pour `carte <nom>`.
function formateurIdentite(d) {
  const fichier = join(d.racine, "bin", "pnpm");
  writeFileSync(fichier, "#!/bin/sh\ncat\n");
  chmodSync(fichier, 0o755);
}

// Trois sujets a, b, c, chacun avec la carte (trois valeurs sur sa ligne `Sujet:`) et un commit propre ;
// la spec déclare `a`.
function troisSujets(ligne) {
  const d = depotJouet();
  formateurIdentite(d);
  d.ecrire(CARTE_MULTI, carteMulti(ligne));
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/a\n");
  d.ecrire(ticket("01"), "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.commit("docs: carte et spec");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/a", "HEAD:refs/heads/sujet/b", "HEAD:refs/heads/sujet/c");
  for (const x of ["a", "b", "c"]) {
    d.branche(`sujet/${x}`, `origin/sujet/${x}`, { [`src/${x}.ts`]: "export {};\n" }, `feat(demo): ${x} (#1)`);
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  return d;
}

test("geler, gel, degeler et etat trouvent la carte qui nomme plusieurs sujets et n'écrivent que sur la branche du sujet visé", () => {
  const d = troisSujets();
  const g = d.lancer(SCRIPT, "geler", "b", "pause");
  assert.equal(g.status, 0, g.stdout + g.stderr);
  assert.equal(d.lancer(SCRIPT, "gel", "b").status, 0);
  assert.equal(d.lancer(SCRIPT, "gel", "a").status, 1, "la copie de la carte sur sujet/a n'est pas touchée");
  assert.equal(d.lancer(SCRIPT, "gel", "c").status, 1);
  assert.match(d.git("show", "origin/sujet/b:" + CARTE_MULTI), /^Gel: \d{4}-\d{2}-\d{2} — pause$/m);
  assert.doesNotMatch(d.git("show", "origin/sujet/a:" + CARTE_MULTI), /^Gel:/m);
  const etat = d.lancer(SCRIPT, "etat").stdout;
  assert.match(etat, /^b\t.*\tgelé$/m);
  assert.match(etat, /^a\t.*\ten cours$/m);
  const r = d.lancer(SCRIPT, "degeler", "b");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(d.lancer(SCRIPT, "gel", "b").status, 1);
});

test("livre : une carte qui nomme plusieurs sujets les donne tous livrés en phase fini sur develop, aucun avant", () => {
  const d = depotJouet();
  d.ecrire(CARTE_MULTI, carteMulti(undefined, "4-vague-1"));
  d.commit("docs: carte");
  d.git("push", "-q", "origin", "HEAD:develop");
  for (const x of ["a", "b", "c"]) assert.equal(d.lancer(SCRIPT, "livre", x).status, 1, `${x} : carte en phase 4`);
  d.ecrire(CARTE_MULTI, carteMulti(undefined, "fini"));
  d.commit("docs: carte finie");
  d.git("push", "-q", "origin", "HEAD:develop");
  for (const x of ["a", "b", "c"]) assert.equal(d.lancer(SCRIPT, "livre", x).status, 0, `${x} : carte finie`);
  assert.equal(d.lancer(SCRIPT, "livre", "d").status, 1, "un sujet que la carte ne nomme pas");
});

test("livrer : la carte qui nomme plusieurs sujets, en phase 4 sur le sujet, donne une livraison intermédiaire", () => {
  const d = depotJouet();
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/b\n");
  d.commit("docs: spec");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.branche("sujet/b", "origin/develop", { [CARTE_MULTI]: carteMulti(undefined, "4-vague-2") }, "docs(demo): carte (#1)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [] });
  const r = d.lancer(SCRIPT, "livrer", "b", "feat(demo): livraison intermédiaire");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(d.journal().find((e) => e.methode === "POST" && e.route === "pulls").champs.head, /^livraison\/b-\d{8}-\d{4}$/);
});

test("carte <nom> pousse la mise à jour d'une carte qui nomme plusieurs sujets, sur chacun des sujets qu'elle nomme, et refuse celui qu'elle ne nomme plus", () => {
  const d = troisSujets();
  for (const x of ["a", "b"]) {
    d.git("switch", "-q", "-C", `docs/carte-${x}`, `origin/sujet/${x}`);
    d.ecrire(CARTE_MULTI, carteMulti(undefined, "4-vague-1", `\nSessions: s-${x}`));
    d.commit(`docs(demo): carte ${x}`);
    const r = d.lancer(SCRIPT, "carte", x);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    d.git("fetch", "-q", "origin");
    assert.match(d.git("show", `origin/sujet/${x}:${CARTE_MULTI}`), new RegExp(`^Sessions: s-${x}$`, "m"));
  }
  assert.doesNotMatch(d.git("show", "origin/sujet/c:" + CARTE_MULTI), /Sessions/);
  d.git("switch", "-q", "-C", "docs/carte-c", "origin/sujet/c");
  d.ecrire(CARTE_MULTI, carteMulti("Sujet: sujet/a, sujet/b"));
  d.commit("docs(demo): c retiré de la carte");
  const refus = d.lancer(SCRIPT, "carte", "c");
  assert.equal(refus.status, 9, refus.stdout + refus.stderr);
  assert.match(refus.stdout, /plus exactement/);
});

test("demarrer refuse un ticket dont la ligne Sujet: nomme plusieurs sujets (sortie 4), le sien d'abord, sinon celle de sa spec", () => {
  const d = depotJouet();
  d.ecrire(SPEC, "# SPEC_ALL_DEM-1\n\nSujet: sujet/a, sujet/b\n");
  d.ecrire(ticket("01"), "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.ecrire(ticket("02"), "# .02\n\nStatus: ready-for-agent\nSujet: sujet/a\nBlocked by: —\n");
  d.ecrire(ticket("03"), "# .03\n\nStatus: ready-for-agent\nSujet: sujet/a sujet/b\nBlocked by: —\n");
  d.commit("docs: specs");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/a");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-1-01-travail", "origin/develop");
  for (const nn of ["01", "03"]) {
    const r = demarrer(d, `SPEC_ALL_DEM-1.${nn}`);
    assert.equal(r.status, 4, nn + r.stdout + r.stderr);
    assert.match(r.stdout, new RegExp(`SPEC_ALL_DEM-1\\.${nn} déclare plusieurs sujets \\(Sujet: sujet/a`));
    assert.match(r.stdout, /un ticket se démarre sur un seul sujet/);
  }
  const propre = demarrer(d, "SPEC_ALL_DEM-1.02");
  assert.equal(propre.status, 0, propre.stdout + propre.stderr);
  assert.match(propre.stdout, /^base=sujet\/a$/m);
});
```

### 7. Test de `couts.test.mjs`

Insérer ce test **avant** `test("le bilan compte les tickets distincts …` :

```js
test("une carte à plusieurs sujets rend tous ses sujets, dans l'ordre, jamais le premier mot avec sa virgule", () => {
  const ligne = [["fille", "SPEC_ALL_SOC-9.01", "s1", "sonnet", "200 k", "3,00"]];
  const c = lireCarte("docs/f/all/SPEC_ALL_SOC-9-demo.map.md", carte("a, sujet/b, sujet/c", ligne));
  assert.equal(c.chantier, "a, b, c");
  assert.match(plat(enMarkdown([c])), /\| a, b, c \| 4-vague-2 \| 1 \| 1 \|/);
  const mal = lireCarte("docs/f/all/SPEC_ALL_SOC-9-demo.map.md", carte("a sujet/b", ligne));
  assert.equal(mal.chantier, "SPEC_ALL_SOC-9-demo", "une ligne mal formée donne le nom du fichier, pas un demi-nom");
});
```

### 8. Test de `tickets.test.mjs`

Insérer ce test **avant** la ligne `const FICHE = (lignes) =>` :

```js
test('une carte peut nommer plusieurs sujets séparés par des virgules ; une liste mal formée est refusée, le message dit la forme attendue', () => {
  const carte = (sujet) => controlerCarte({ nom: 'c.map.md', texte: `# Carte\n\nSujet: ${sujet}\n\n## Fiche\n\nPhase: 2-decoupage\nResponsable: Camille Martin\nConducteur: session_y\n` });
  assert.deepEqual(carte('sujet/a, sujet/b, sujet/c').erreurs, []);
  assert.deepEqual(carte('sujet/a,sujet/b').erreurs, []);
  for (const mal of ['sujet/a sujet/b', 'sujet/a,', 'sujet/a, b', 'sujet/A']) {
    const erreurs = carte(mal).erreurs;
    assert.equal(erreurs.length, 1, mal);
    assert.match(erreurs[0].message, /carte c\.map\.md : Sujet « .* » : attendu `sujet\/<nom-en-kebab>`, ou plusieurs séparés par des virgules/, mal);
    assert.equal(erreurs[0].ligne, 3);
  }
});
```

### 9. `skills/chaine/tickets/references/scripts/docs/ligne-sujet.test.mjs` (créé)

Fichier entier :

```js
import assert from "node:assert/strict";
import { test } from "node:test";
import { module } from "./depot-jouet.mjs";

const { nomsDeSujets } = await module("docs/ligne-sujet.mjs");

test("nomsDeSujets lit une ou plusieurs valeurs sujet/<nom> séparées par des virgules, espaces tolérées", () => {
  assert.deepEqual(nomsDeSujets("sujet/socle"), ["socle"]);
  assert.deepEqual(nomsDeSujets("sujet/a, sujet/b, sujet/c"), ["a", "b", "c"]);
  assert.deepEqual(nomsDeSujets("sujet/a,sujet/b"), ["a", "b"]);
  assert.deepEqual(nomsDeSujets("  sujet/a  ,  sujet/b-2  "), ["a", "b-2"]);
});

test("nomsDeSujets refuse une valeur qui n'est pas un nom de sujet, sans lecture partielle", () => {
  for (const mal of ["", "sujet/a sujet/b", "sujet/a,", ",sujet/a", "sujet/a,,sujet/b", "sujet/A", "sujet/a (lot 1)", "sujet/a, b", "demo"]) {
    assert.equal(nomsDeSujets(mal), null, JSON.stringify(mal));
  }
});

test("nomsDeSujets accepte un nom sans préfixe quand le lecteur le tolère (couts.mjs)", () => {
  assert.deepEqual(nomsDeSujets("demo", { prefixeFacultatif: true }), ["demo"]);
  assert.deepEqual(nomsDeSujets("a, sujet/b", { prefixeFacultatif: true }), ["a", "b"]);
  assert.equal(nomsDeSujets("sujet/a sujet/b", { prefixeFacultatif: true }), null);
});
```

### 10. Ce qui ne change pas

`avancement.mjs`, `avancement-regles.mjs`, `vagues.mjs`, `ticket-libre.mjs`, `archiver-tickets.mjs`, `contexte-ticket.mjs`, `file.sh`, `boucle.sh`, `passer.sh`, les hooks d'agent ; le gate des tickets (`controlerTicket`) ; `scripts/poses.test.mjs` (il copie les dossiers entiers : le fichier créé est posé sans liste à toucher) ; tous les tests existants, assertions comprises.

## Surfaces

| Surface | Preuve |
| --- | --- |
| les trois lectures de la valeur : une ou plusieurs valeurs séparées par des virgules, le reste refusé sans lecture partielle, le préfixe facultatif pour `couts.mjs` | `skills/chaine/tickets/references/scripts/docs/ligne-sujet.test.mjs` « nomsDeSujets lit une ou plusieurs valeurs sujet/<nom> séparées par des virgules, espaces tolérées » « nomsDeSujets refuse une valeur qui n'est pas un nom de sujet, sans lecture partielle » « nomsDeSujets accepte un nom sans préfixe quand le lecteur le tolère (couts.mjs) » |
| le registre des coûts nomme le chantier d'une carte à plusieurs sujets (le fait) | `skills/chaine/tickets/references/scripts/docs/couts.test.mjs` « une carte à plusieurs sujets rend tous ses sujets, dans l'ordre, jamais le premier mot avec sa virgule » |
| le gate des cartes admet la liste et dit la forme attendue d'une liste mal formée | `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs` « une carte peut nommer plusieurs sujets séparés par des virgules ; une liste mal formée est refusée, le message dit la forme attendue » |
| `geler`, `gel`, `degeler` et `etat` trouvent la carte, n'écrivent que sur la branche du sujet visé | `skills/chaine/sujet/scripts/sujet.test.mjs` « geler, gel, degeler et etat trouvent la carte qui nomme plusieurs sujets et n'écrivent que sur la branche du sujet visé » |
| `livre` : carte partagée en phase `fini` sur develop | `skills/chaine/sujet/scripts/sujet.test.mjs` « livre : une carte qui nomme plusieurs sujets les donne tous livrés en phase fini sur develop, aucun avant » |
| `livrer` : la phase de la carte partagée, lue sur le sujet | `skills/chaine/sujet/scripts/sujet.test.mjs` « livrer : la carte qui nomme plusieurs sujets, en phase 4 sur le sujet, donne une livraison intermédiaire » |
| `carte <nom>` pousse la carte partagée sur chacun de ses sujets, refuse celui qu'elle ne nomme plus | `skills/chaine/sujet/scripts/sujet.test.mjs` « carte <nom> pousse la mise à jour d'une carte qui nomme plusieurs sujets, sur chacun des sujets qu'elle nomme, et refuse celui qu'elle ne nomme plus » |
| `demarrer` refuse un ticket à plusieurs sujets (le sien, sinon celui de sa spec), laisse passer celui qui en a un | `skills/chaine/sujet/scripts/sujet.test.mjs` « demarrer refuse un ticket dont la ligne Sujet: nomme plusieurs sujets (sortie 4), le sien d'abord, sinon celle de sa spec » |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, à la mineure qui suit |

## Vérification

Joué le 2026-11-14 dans une copie jetable de `cadb4e5`, avec les §§ 1 à 9 appliqués mot pour mot :

- Les dix tests nouveaux sur `origin/main` sans les §§ 1 à 5 : **sept rouges**, les trois de `ligne-sujet.test.mjs` en erreur de module (`Cannot find module …/ligne-sujet.mjs`). Avec : verts.
- `pnpm install --frozen-lockfile && pnpm test` : **466 sur 466**, rejoués le 2026-11-14 après la relecture (456 + 10 : trois dans `ligne-sujet.test.mjs`, un dans `couts.test.mjs`, un dans `tickets.test.mjs`, cinq dans `sujet.test.mjs`). `scripts/poses.test.mjs` passe sans retouche : le fichier créé est posé à plat et rejoué hors du plugin.
- Rejoué sur le jouet de « Reproduction » : toutes les lignes « Après » de ses deux tableaux.

Pour la session :

1. Le § 0, puis `pnpm install --frozen-lockfile && pnpm test` : vert, avec **le compte de `origin/main` plus 10**. Aucun test retiré ni sauté. `git diff origin/main --stat -- '*.test.mjs'` ne montre que quatre fichiers modifiés ou créés, **sans ligne retirée** : `git diff origin/main -- 'skills/**/*.test.mjs' | grep -c '^-[^-]'` rend 0.
2. `git diff origin/main --stat` : seize fichiers (huit de code, le commentaire de `tickets.mjs`, six de texte, `plugin.json`), aucun autre.
3. `git grep -nF 'sujet/${nom}[[:space:]]' -- skills/chaine/sujet/scripts/sujet.sh` ne rend plus rien : les trois lectures par `grep` de `sujet.sh` sont devenues `carte_nomme_le_sujet`.

## Hors périmètre

- **Un gate sur les specs** : une spec à `Sujet: sujet/a, sujet/b` n'est contrôlée par personne (le gate ne lit que les tickets et les cartes) ; `sujet.sh carte`, `file.sh` et `avancement.mjs` n'en lisent que le premier sujet, en silence. `demarrer` la refuse pour ses tickets (décision 5) ; un refus du gate sur la spec elle-même est à instruire à part.
- **Le gate des tickets** laisse passer `Sujet: sujet/a sujet/b` (sa regex accepte un blanc après le premier nom, pour un commentaire) : `demarrer` le refuse maintenant.
- **Une carte partagée en trois copies** (décision 6) : désigner une branche de référence, ou faire écrire `carte <nom>` sur les trois, est un autre dessin. À instruire quand le projet qui la porte aura vécu une vague.
- **La forme `- **Sujet :**` dans `couts.mjs` et le gate des cartes** (décision 3).

## Comments

- 2026-11-14 — **Fait** : PR 90, fusionnée `ce61357`, plugin 7.8.0. Contre-relue conforme ; une retouche : le JS lit les blancs comme l'awk (espace insécable, saut de page et tabulation verticale refusés en tête et autour d'une virgule). Pas de section de `CONTENU.md` pour `ligne-sujet.mjs`, comme pour `couts.mjs`.
- 2026-11-14 — Instruit sur `cadb4e5` (plugin 7.7.0). Fait reproduit et plus large que rapporté : sur la carte à trois sujets, le gate refuse, `geler` ne peut pas geler, `carte <nom>` refuse. Remède joué dans le plugin (466/466). La décision de l'architecte (admise partout) tient ; deux points non bloquants (décisions 6 et 7), **acceptés par l'architecte** : la carte partagée vit en trois copies, une par branche de sujet, et sa phase `6-nettoyage` ou `fini` donne tous ses sujets pour livrés, donc ne se pose qu'après la livraison du dernier. Relecture : prêt après corrections mineures, aucune bloquante ; le shell et le JS lisent pareil sur 96 cas (hors tiret final ou double, que le gate refuse avant).
