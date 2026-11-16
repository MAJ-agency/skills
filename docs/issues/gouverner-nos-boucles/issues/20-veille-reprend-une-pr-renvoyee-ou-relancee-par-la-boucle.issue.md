# La veille reprend une PR que la boucle vient de renvoyer ou de relancer, dès qu'elle revient dans la file, version corrective du plugin

Status: Fait — PR #78
Type: défaut
Modèle: sonnet — la cause est établie, le remède et les bancs sont donnés ligne à ligne ; rien n'est à concevoir.
Blocked by: —
Label: contre-revue
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/veille.sh`, `skills/chaine/fusionner/scripts/veille.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `.claude-plugin/plugin.json`

## Le besoin

Cas vécu le 2026-11-14 sur le dépôt anchorpost, rapporté par son capitaine de fusion. La veille (`veille.sh`, lancée sans argument : pause 120 s, durée 110 min) lance la boucle à 11 h 53. La boucle traite la PR 130 : `passer.sh` sort en 4, la boucle la renvoie elle-même (`refus.sh` → `renvoyer.sh` : `fusion-bloquée` posé, `à-fusionner` retiré, journal « [#130] RENVOI : sans section « Revue de ticket »… »). L'auteur corrige la description et remet `à-fusionner` à 11 h 54, moins d'une minute après. La veille, toujours vivante, ne reprend pas la PR pendant environ 7 minutes ; le capitaine la tue et la relance à 12 h 02, et la nouvelle veille fusionne la PR aussitôt. Le journal d'avant a été écrasé par la relance : il n'y a pas d'autre trace.

Sans le geste du capitaine, la PR serait restée dans la file jusqu'à la fin de la veille, 110 minutes au plus : la veille ne la voyait pas, et ne l'aurait jamais vue tant que sa ligne restait la même.

Quand le ticket est fait, une PR que la boucle vient de renvoyer, ou dont elle vient de relancer les jobs rouges, relance la boucle dès qu'une sonde la revoit « prête », « CI rouge » ou « sans CI », même si sa ligne est celle d'avant la boucle ; une PR que la boucle a seulement sautée ne la relance toujours pas en rond ; le plugin est en version corrective.

## Où

Base : `origin/main` à `c9a6055` (#77), plugin **7.2.0**, **391 tests** (`pnpm test`, joué le 2026-11-14 dans un arbre détaché). Toutes les lignes ci-dessous sont relues sur ce commit. `F` abrège `skills/chaine/fusionner`.

### La cause, établie par la lecture et reproduite

- `F/scripts/veille.sh:9-10` (en-tête) : « on ne relance que si la file contient une ligne (numéro + état) absente de l'ensemble vu au dernier lancement ou à la dernière sonde ».
- `F/scripts/veille.sh:52-59` (`etat_file`) : la ligne d'une PR est « `<n> prête` », « `<n> rouge` » ou « `<n> sans-ci` » ; tout autre état (dont « bloquée », `F/scripts/file.sh:121-122`, et une PR sans `à-fusionner`, absente de `file.sh:76`) n'y figure pas.
- **`F/scripts/veille.sh:62-63`** : `vu=$(etat_file || true)` est relevé **avant** le premier `lancer`. La PR 130, prête, y est : `vu` contient « 130 prête ».
- **`F/scripts/veille.sh:84-87`** : même ordre à chaque relance : `vu=$actuel`, puis `lancer`. L'ensemble vu est toujours celui d'avant la boucle.
- Pendant la boucle, `renvoyer.sh:24-25` retire `à-fusionner` et pose `fusion-bloquée`, puis `renvoyer.sh:35` écrit « `[#<n>] RENVOI : <cause>` ». La boucle reprend elle-même une PR corrigée avant sa dernière lecture de la file (`boucle.sh:327`, commentaire `boucle.sh:349-350`) ; au-delà, elle finit (`FILE VIDE`, `boucle.sh:374`).
- L'auteur retire `fusion-bloquée` et remet `à-fusionner` sans pousser : même sommet, CI toujours verte, `file.sh` rend de nouveau « 130 prête ». Si aucune sonde n'a vu la PR hors de la file entre le relevé et ce retour, la sonde suivante calcule `comm -13` (`veille.sh:83`) sur « 130 prête » ⊂ `vu` : rien de nouveau, **rien n'est relancé**, et `vu=$actuel` (`veille.sh:84`) garde la ligne. Plus aucune sonde ne la voit nouvelle tant qu'elle ne change pas d'état.

La fenêtre aveugle va de la dernière lecture de la file par la boucle jusqu'à la sonde suivante (au plus `pause`, 120 s, après `FILE VIDE`). Un renvoi corrigé en moins de deux minutes y tombe : c'est le cas vécu. L'hypothèse du capitaine est donc juste, et **incomplète** sur deux points : le défaut vaut aussi pour une boucle relancée par une sonde (`veille.sh:84-87`), et pour une PR « CI rouge » dont la boucle relance les jobs (`boucle.sh:228`, « `[#<n>] RELANCE des jobs rouges (<checks>)` ») et qui retombe rouge avant la sonde suivante : la ligne « `<n> rouge` » est celle d'avant la boucle, la veille ne relance pas, la PR n'est ni passée ni renvoyée jusqu'à la fin de la veille.

Reproduit le 2026-11-14 dans un arbre détaché sur `c9a6055`, avec la doublure de `veille.test.mjs` à laquelle on fait écrire une ligne à la boucle : les trois cas (renvoi pendant la boucle initiale, renvoi pendant une boucle relancée, relance de jobs rouges) donnent un lancement de moins qu'attendu ; avec le remède ci-dessous, les trois passent et les huit tests existants restent verts sans retouche.

### Ce qui ne change pas, vérifié

- `F/scripts/boucle.sh`, `renvoyer.sh`, `refus.sh`, `file.sh`, `passer.sh` : aucune ligne. Les formats lus par la veille y sont déjà : « `[#$N] RENVOI : ` » (`renvoyer.sh:35`, épinglé par `F/scripts/fusionner.test.mjs:299` et `:340`) et « `[#$n] RELANCE des jobs rouges` » (`boucle.sh:228`).
- Les huit tests de `F/scripts/veille.test.mjs` : leur texte ne bouge pas.

## Décisions

1. **Remède retenu : la veille oublie, après chaque boucle, les PR que cette boucle a renvoyées ou relancées.** Dans `veille.sh`, `journal_boucle`, son `mktemp` et la `trap … EXIT` se placent juste avant la fonction `lancer`, à la place de son commentaire (ligne 41) ; `lancer` (lignes 42-49) devient :

   ```bash
   # Sortie de la boucle, gardée pour lire les PR qu'elle a renvoyées ou relancées.
   journal_boucle=$(mktemp)
   trap 'rm -f "$journal_boucle"' EXIT

   # Lance la boucle ; un code non nul arrête la veille avec ce code. Une PR que la boucle a renvoyée
   # (`[#n] RENVOI`, renvoyer.sh) ou dont elle a relancé les jobs rouges (`[#n] RELANCE`, boucle.sh)
   # sort de l'ensemble vu : si elle revient avant la sonde suivante, même ligne qu'avant la boucle,
   # elle est nouvelle et relance la boucle (cas vécu : PR renvoyée, corrigée en une minute, invisible).
   lancer() {
     bash "$outils/boucle.sh" | tee "$journal_boucle"
     local rc=${PIPESTATUS[0]} agies
     if [ "$rc" != 0 ]; then
       echo "VEILLE ARRÊTÉE $(heure) : la boucle est sortie en $rc"
       exit "$rc"
     fi
     agies=$(sed -nE 's/^\[#([0-9]+)\] (RENVOI|RELANCE).*/\1/p' "$journal_boucle" | sort -u)
     [ -z "$agies" ] || vu=$(printf '%s\n' "$vu" | awk 'NR == FNR { a[$1]; next } !($1 in a)' <(printf '%s\n' "$agies") -)
   }
   ```

   La trap nettoie aussi sur SIGTERM, ce qu'envoie l'arrêt d'une tâche de fond (bash joue la trap `EXIT` à la mort par un TERM non piégé, vérifié le 2026-11-14) ; un SIGKILL laisse un fichier dans `$TMPDIR`, ce qui est accepté.

   Rien d'autre ne change dans la boucle de sonde (`veille.sh:61-91`) : `vu` est toujours relevé avant `lancer`, puis amputé par `lancer`. La sortie de la boucle continue d'aller au journal de la veille (le `tee`). L'en-tête (`veille.sh:9-10`) devient : « Une PR que la boucle vient de sauter reste « prête » : on ne relance que si la file contient une ligne (numéro + état) absente de l'ensemble vu au dernier lancement ou à la dernière sonde. Une PR que la boucle a renvoyée (`RENVOI`) ou dont elle a relancé les jobs rouges (`RELANCE`) sort de cet ensemble : revenue dans la file avant la sonde suivante, même ligne qu'avant, elle relance la boucle. »

2. **La propriété de l'en-tête est gardée.** Une PR sautée (sortie 7, renvoi qui échoue, `boucle.sh:352`, `:366`, `:367`) n'écrit ni `RENVOI` ni `RELANCE` (`renvoyer.sh` n'écrit sa ligne qu'après les labels et le commentaire, sous `set -e`) : elle reste dans `vu` et ne relance pas la boucle en rond. Une PR renvoyée qui ne revient pas est « bloquée », hors de `etat_file` : l'oublier ne relance rien. Une PR relancée qui finit renvoyée au tour suivant (`boucle.sh:230`) devient « bloquée » : pas de boucle en rond non plus. Une ligne « `[#n] RENVOI 3 sur 3` » oublie la PR, qui est « humain » et hors de `etat_file`. Cadence du cas « même PR renvoyée à chaque boucle » (l'auteur la remet à chaque fois sans la corriger) : une boucle par pause (120 s) au plus, puisque l'oubli ne joue qu'à la sonde suivante ; la série s'arrête au plafond de renvois (`renvoyer.sh:17`), après quoi `file.sh` classe la PR « humain » (`file.sh:125-126`), hors de `etat_file`.

3. **Remèdes écartés.**
   - *Relever `vu` après la boucle et non avant* (déplacer `veille.sh:62` après `:63`, et relire la file après le `lancer` de `:87`) : juste sur le fond (une PR renvoyée se lit « bloquée » après la boucle), mais chaque relevé est un appel de `file.sh` de plus, et la doublure de `veille.test.mjs:32-40` sert ses états par numéro d'appel. Essayé le 2026-11-14 : deux tests existants tombent (le test de la ligne `veille.test.mjs:71`, son second cas `r2` « rouge puis prête : nouvelle relance », 2 lancements au lieu de 3 ; `veille.test.mjs:86`, « boucle.sh sort en 3 », la veille sort avant le premier appel et le compteur n'existe pas). Les reprendre serait retoucher des bancs verts : écarté.
   - *Comparer numéro + état + sommet de la PR* : le cas vécu ne change pas le sommet (seule la description est corrigée, aucun push) ; « 130 prête » sur le même sommet resterait invisible. Et `file.sh` ne rend pas le sommet (`file.sh:145`) : il faudrait changer sa sortie, que `boucle.sh:258`, `:327` et `:373` lisent par colonnes. Écarté.
   - *Compter les renvois dans la ligne* (`renvois_de`, déjà calculé par `file.sh:125`) : couvrirait le renvoi, pas la relance des jobs rouges, et demande lui aussi une colonne de plus dans `file.sh`. Écarté.
   - *Vider `vu` après chaque boucle* : toute PR sautée relancerait la boucle à chaque sonde, ce que l'en-tête interdit. Écarté.

4. **Le couplage au journal de la boucle est assumé et gardé par les bancs** : la veille lit deux lignes que `renvoyer.sh` et `boucle.sh` écrivent déjà. Les tests 1 à 3 ci-dessous gardent la lecture (la veille reconnaît ces lignes), le test 5 garde l'écriture (`renvoyer.sh` et `boucle.sh` les écrivent toujours sous cette forme) : c'est l'ensemble qui garde le couplage, pas le test 5 seul. La boucle joue la copie de `scripts/chaine` d'`origin/develop` du projet (`boucle.sh:41-48`), la veille sa copie du scratchpad (`SKILL.md:88`) : dans un projet, les deux viennent du même plugin.

5. **Version** : la version corrective (patch) qui suit celle de `main` au moment où la session ouvre sa PR, lue dans `.claude-plugin/plugin.json` (aujourd'hui 7.2.0, donc 7.2.1 si `main` n'a pas bougé). Seule la ligne `"version"` change dans ce fichier.

## Surfaces

| Surface | Preuve |
| --- | --- |
| renvoi pendant la boucle initiale, puis retour avant la sonde | `F/scripts/veille.test.mjs` « PR renvoyée par la boucle puis ré-étiquetée avant la sonde : boucle relancée » — `veilleJouet([prete(130), prete(130), prete(130)], { sorties: ["[#130] RENVOI : sans section « Revue de ticket »\n"], sondes: 2 })` : 2 lancements |
| renvoi pendant une boucle relancée par une sonde | `F/scripts/veille.test.mjs` « PR renvoyée par une boucle relancée, puis ré-étiquetée : boucle relancée de nouveau » — `veilleJouet(["", prete(131), prete(131), prete(131)], { sorties: ["", "[#131] RENVOI : titre trop long\n"], sondes: 3 })` : 3 lancements |
| jobs rouges relancés, retombés avant la sonde | `F/scripts/veille.test.mjs` « jobs rouges relancés par la boucle, de nouveau rouges à la sonde : boucle relancée » — trois fois `31\tCI rouge : qualite\t\n`, `sorties: ["[#31] RELANCE des jobs rouges (qualite)\n"]`, `sondes: 2` : 2 lancements |
| la propriété gardée | `F/scripts/veille.test.mjs` « PR sautée par la boucle, renvoi d'une autre : pas de relance en rond » — trois fois `prete(32)`, `sorties: ["[#32] DÉBUT 11:53\n[#32] sortie=7 11:53\n[#40] RENVOI : conflit\n"]`, `sondes: 2` : 1 lancement |
| le couplage | `F/scripts/veille.test.mjs` « les lignes que la veille lit sont celles qu'écrivent renvoyer.sh et boucle.sh » — lit `renvoyer.sh` et `boucle.sh` à côté de `veille.sh` (`new URL("./renvoyer.sh", import.meta.url)`) et vérifie qu'ils contiennent `echo "[#$N] RENVOI : ` et `echo "[#$n] RELANCE des jobs rouges` |
| les bancs existants | les huit tests de `F/scripts/veille.test.mjs` (lignes 57-114), et `fusionner.test.mjs`, verts sans retouche |
| la documentation | `veille.sh:9-10` (décision 1), `F/SKILL.md:53` et `F/references/CONTENU.md:29` (ci-dessous) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que la ligne `"version"` |

La doublure : `veilleJouet` (`veille.test.mjs:22-53`) gagne une option `sorties = []`, dont la k-ième entrée (k = 0 pour le lancement initial) est écrite par le banc, avec `writeFileSync`, dans un fichier `sortie.<k>` du dossier jouet ; la fausse `boucle.sh` tient un compteur `k` dans ce dossier (comme `compte` pour `file.sh`) et fait `cat` de `sortie.<k>` s'il existe. Ainsi aucun guillemet français, `#`, `$` ni retour à la ligne d'une entrée ne passe par une chaîne bash générée ; sans l'option, la fausse boucle se comporte exactement comme aujourd'hui. Aucun des huit tests existants n'est modifié.

**Dans `F/SKILL.md:53`**, après « une PR que la boucle vient de sauter ne la relance pas en rond. », ajouter : « Une PR que la boucle a renvoyée ou dont elle a relancé les jobs rouges, revenue avant la sonde suivante, la relance (cas vécu : PR renvoyée, corrigée en une minute, restée invisible). » **Dans `F/references/CONTENU.md:29`**, après « ou qu'une PR mise de côté sans CI reçoit sa CI », ajouter : « , ou qu'une PR renvoyée ou relancée par la boucle revient dans la file ».

## Vérification

- **Rouge d'abord** : écrire les tests 1 à 3 (et l'option `sorties`) sur `veille.sh` inchangé, `node --test skills/chaine/fusionner/scripts/veille.test.mjs` : les trois échouent (1 lancement au lieu de 2, 2 au lieu de 3, 1 au lieu de 2) ; les tests 4 et 5 et les huit existants passent. Puis le remède.
- `node --test skills/chaine/fusionner/scripts/veille.test.mjs` : 13 tests, 0 échec.
- `pnpm test` vert : 391 tests à `c9a6055`, **396** attendus, plus ceux qu'une autre PR aurait fusionnés avant.
- `git diff --stat origin/main` : cinq fichiers, ceux de `Fichiers chauds`, plus ce ticket s'il est sur la branche.
- `git diff origin/main -- skills/chaine/fusionner/scripts/veille.test.mjs | grep '^-' | grep -v '^---'` ne rend que les lignes de `veilleJouet` qui reçoivent l'option `sorties`, aucune ligne d'un test.
- Intangibles : jamais `--no-verify` ; aucun test retiré, sauté ou assoupli ; aucune dépendance nouvelle.
- Ce dépôt n'a pas de gate des tickets : ce ticket n'est contrôlé que par sa relecture. La PR vise `main`.

## Hors périmètre

- **Les dépôts de projet** : anchorpost porte sa copie (`scripts/chaine/veille.sh`, identique à `main` le 2026-11-14). La reposer est un ticket de chaque projet ; et la veille tourne sur une copie du scratchpad (`F/SKILL.md:88`) : le correctif ne s'applique qu'après une nouvelle copie et une veille relancée.
- **Une PR sautée dont la cause disparaît sans que sa ligne change** (sortie 7 pour une parente pas encore fusionnée, renvoi qui échoue) : elle reste invisible jusqu'à un changement d'état, c'est la propriété voulue par l'en-tête. Une PR dont seul le sommet change passe par « CI en cours » ou « sans CI » (`file.sh:90-95`), qu'une sonde voit, sauf CI plus courte que la pause : non traité.
- **« Une PR sautée parce que son worktree propriétaire existe »** : ce saut n'existe pas sur `main` ; `proprietaire.sh` ne sert qu'au message de `renvoyer.sh:37`.
- **Le journal de la veille écrasé à la relance** (`F/SKILL.md:50`, `> <scratchpad>/veille.log`) : c'est lui qui a effacé la trace du cas vécu. Le passer en ajout est un autre ticket.
- `boucle.sh`, `file.sh`, `renvoyer.sh` : aucune ligne.
- Les tickets 17 et 19 de ce dossier, écrits en parallèle : ce ticket n'en touche pas les fichiers.

## Comments

- 2026-11-14 — Écrit après le cas anchorpost du jour (PR 130). L'hypothèse du capitaine (ensemble vu relevé avant la boucle) est confirmée par la lecture (`veille.sh:62-63`, `:84-87`) et reproduite sur `c9a6055` avec la doublure du banc ; elle s'étend à la boucle relancée et aux jobs rouges relancés. Non vérifiable : les heures exactes des sondes et l'état du reste de la file entre 11 h 53 et 12 h 02 (journal écrasé), et si la correction de la description a relancé une CI (si elle l'avait fait, la ligne serait passée par « CI en cours » et une sonde l'aurait vue : les 7 minutes disent que non, ou que la CI a été plus courte que la pause).
