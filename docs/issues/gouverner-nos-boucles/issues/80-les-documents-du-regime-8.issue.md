# Les documents du régime 8 : la méthode, le fragment, le tracker, la conception, la criticité, la recette et le tableau d'avancement disent la relecture indépendante (lot 6a, bascule 8.0.0)

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — le texte entier est dans le patch commun aux tickets 80, 81 et 82 ([`80-82-annexes/lot-6.patch`](80-82-annexes/lot-6.patch), sha256 `1ceca4a337704551b77ef241668c3549bc02a3819a161cd095cdf5f5ff850818`, `git apply` sur `97d17e3`, plugin 7.39.0), décrit fichier par fichier ci-dessous ; les bancs neufs ou changés sont rouges avant le patch et verts après, les 68 mutations de [`80-82-annexes/mutations.mjs`](80-82-annexes/mutations.mjs) sont toutes rouges, la suite entière est verte (« Vérification »). Patch repris après le tour de relecture des tickets (`A-196`, rapport [`80-82-annexes/relecture-tour-1/rapport.md`](80-82-annexes/relecture-tour-1/rapport.md)). Rien n'est à concevoir : qui veut changer une phrase ou une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/tickets/references/agents/issue-tracker.md`, `skills/chaine/tickets/references/scripts/docs/avancement.mjs`, `avancement-regles.mjs` et `avancement.test.mjs`, `skills/monorepo/socle-monorepo/references/methode/conception.md`, `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md`, `skills/chaine/criticite/SKILL.md`, `skills/chaine/recette-humaine/SKILL.md` ; et, communs aux trois tickets, `scripts/bascule.test.mjs` (neuf), `scripts/depot.test.mjs`, `README.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`. Les tickets 81 et 82 écrivent leurs fichiers dans la même PR. Recouvrement avec les tickets de suite 75 à 79 (scripts du Relecteur et du capitaine, `revue-exigee.mjs`, `passer.sh`, `sujet.sh`, les gardes) : aucun script de ce lot n'est l'un des leurs ; ils peuvent toucher `skills/chaine/fusionner/SKILL.md` (ticket 81), `scripts/depot.test.mjs`, `README.md` et les deux fichiers de version : ce lot passe après eux (§ 0).

## Le besoin

Ce ticket réalise la partie **6a** de la spec `docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` (section « Les lots », point 6) : les **documents du régime 8**, ceux que la repose d'un projet pose (`A-93`, « le document posé par la repose »). Les lots 1 à 5 sont dans `main` (7.39.0) : les scripts jugent par les verdicts dès que la base d'une PR porte la clé `relecture` (lot 5), mais les documents que lisent les sessions qui codent disent encore la chaîne d'avant : la revue de ticket par l'auteur, `à-fusionner` posé par lui, la contre-revue du conducteur, `Label: contre-revue` obligatoire, le conducteur qui archive ses filles (ce que la garde du mode « Auto » lui refuse, `P-62`). Une session lancée après la repose suivrait ces textes et poserait `à-fusionner` sur une PR que le capitaine renverrait faute de verdict.

Les documents posés ne décrivent que le régime 8 : une session dont la PR est en régime 7 lit les documents de sa branche, d'avant la repose (`A-97` : « un ticket commencé avant la repose finit donc en 7, sur les documents de sa branche »). Les skills, eux, sont lus dans le marketplace par toutes les sessions : ils portent les deux régimes (ticket 81).

## Où

| Fichier | Ce qui change (le patch fait foi) |
| --- | --- |
| `…/docs-agents/chaine-de-production.md` | En tête, le paragraphe **Relecture indépendante** (le régime 8, la clé, `{{ADR_RELECTURE}}`). § 1 : les rôles du Relecteur et de la session de relecture remplacent le « relecteur adversaire » ; le conducteur arbitre, reçoit les plafonds, relève les coûts et écrit « à archiver » ; la fille demande la relecture, ne se relit pas, ne pose jamais `à-fusionner` ; l'architecte lance un Relecteur par dépôt, arbitre les PR du conducteur, décide au plafond, archive. § 2 : le point **4 bis. Relecture** ; la livraison intermédiaire étiquetée aussitôt par qui livre (`P-60`). § 3 : `Sensibles:` et `Relecture: double` dans l'en-tête montré, à la place de `Label: contre-revue` ; le paragraphe **Fichiers sensibles : l'accord avant le code** (`A-73` à `A-76`) ; le gate tel que le lot 5c l'a laissé. § 5 : le régime lu dans la sortie de `sujet.sh demarrer` ; les étapes **5. Demander la relecture**, **6. Sur `à-reprendre`** (corriger avec le test, ou contester ; `A-88`), **7. Rendre la main** avec le **réveil de secours** (`A-86`, ses cinq cas dans l'ordre ; le cas `fusion-bloquée` seulement sans `à-relire`, `A-196` point 2) ; la PR renvoyée qui redemande la relecture. § 6, « Relevé des coûts » : les sessions de relecture relevées avec la fille (rôle `relecture`, `A-87`), la ligne `à archiver : <session>, <ticket>, <coût>` à l'architecte, qui archive (`P-62`). |
| `…/fragments/claude-md-fusion.md` | Le point **Relecture indépendante** ; la session de travail demande la relecture ; `fusion-bloquée` fait redemander la relecture ; le capitaine juge par le verdict ; `{{ADR_RELECTURE}}` dans la ligne des décisions. |
| `skills/chaine/tickets/references/agents/issue-tracker.md` | « Livrer, c'est demander la relecture » (`À relire`, `à-relire`, jamais `à-fusionner`). |
| `…/scripts/docs/avancement-regles.mjs`, `avancement.mjs`, `avancement.test.mjs` | Deux lignes de plus au tableau : **À reprendre (verdict refusé ou renvoi)**, une PR ouverte qui porte `à-reprendre` ou `fusion-bloquée` ; **En relecture**, une PR ouverte qui porte `à-relire` ; quel que soit le `Status:` du ticket (`Fait — PR #n` s'écrit avant la relecture), jamais une PR fusionnée, étiquettes comparées en NFC. Un test neuf. |
| `…/methode/conception.md`, `…/racine/CLAUDE.md` (socle-monorepo) | « Quand » : avec la chaîne en relecture indépendante, la revue est celle d'une session de relecture ; sans la chaîne, `/mattpocock-skills:code-review` comme avant. La cellule de la carte d'orientation. |
| `skills/chaine/criticite/SKILL.md`, `skills/chaine/recette-humaine/SKILL.md` | La relecture relève une règle non classée (axe « Règles métier », `D8`) ; les correctifs d'une recette demandent la relecture. Le régime 7 dit en une demi-phrase. |
| `scripts/bascule.test.mjs` (neuf, commun) | Le test « les documents posés sont ceux du régime 8 » (ce ticket) ; les autres sont aux tickets 81 et 82. |
| `scripts/depot.test.mjs` | Le passage de `criticite/SKILL.md` que le banc fige, à sa nouvelle forme. |

## Décisions

1. **Les documents posés sont ceux du régime 8, seuls** (`A-93`, `A-97`). Aucun paragraphe « en régime 7 » dans `chaine-de-production.md`, le fragment ou le tracker : la branche d'une PR en régime 7 porte les anciens. Exception : les documents que `socle-monorepo` pose sans la chaîne (`conception.md`, `CLAUDE.md`) disent les deux cas, avec et sans la chaîne, et `criticite` et `recette-humaine`, lus dans le marketplace, disent le régime 7 en une demi-phrase.
2. **La numérotation du cycle (§ 2) ne change pas** : la relecture est le point « 4 bis », pour que les renvois existants (« § 2, point 7 », le banc du bilan supprimé) restent vrais. Celle du § 5 change : l'étape 5 est la demande de relecture, et la vérification « titre (#n) » y passe ; `architecte/SKILL.md` § 7 cite « § 5 » sans numéro d'étape (ticket 81).
3. **La demande de relecture a la forme que lit le Relecteur** (`FORME_DEMANDE` de `decision-relecteur.mjs`, la même que `DEMANDE_DE_RELECTURE` de `github.sh`) : `À relire — sommet <sha> — Session: <id> — Conducteur: <id>`, seule dans son commentaire, le sha entier du dernier push ; puis `à-relire`, par la liste entière des étiquettes (`A-84`).
4. **Le réveil de secours** (`A-86`) remplace le `send_later` à 90 minutes : réarmé à chaque demande, ses cinq cas dans l'ordre d'`A-86`. Le cas `fusion-bloquée` ne vaut que sans `à-relire` (`A-196` point 2) : une PR renvoyée garde `fusion-bloquée` pendant toute sa relecture, que le Relecteur retire en posant `à-fusionner` ; sinon la fille « corrigerait et redemanderait » à chaque réveil.
5. **Archiver** (`P-62`, `A-87`, `A-185` point 8) : la garde du mode « Auto » refuse `archive_session` au conducteur ; il relève le coût de ses filles et de leurs sessions de relecture, puis écrit une ligne `à archiver` par session à l'architecte (sans programme, au produit), qui archive.
6. **Le tableau d'avancement** lit les étiquettes de la PR d'un ticket, toutes PR ouvertes comprises, même quand le ticket est déjà `Fait — PR #n` (ce qu'il est dès la demande de relecture) ; une PR fusionnée ne compte jamais. Comparaison en NFC, comme le Relecteur (`A-84`).
7. **Les documents du régime 8 ne se reposent qu'avec la clé** (`A-196` point 4) : `chaine-de-production.md`, le fragment et `issue-tracker.md`, reposés seuls dans un dépôt en régime 7, y feraient demander une relecture que personne ne fait. La note de version le dit ; un refus mécanique attend le lot 7 ou le nettoyage.

## Questions à l'architecte

Celles de la PR, pour les trois tickets, sont au ticket 82 (« Questions à l'architecte ») : les huit du rédacteur, tranchées par `A-195`, et les cinq du tour de relecture, tranchées par `A-196`.

## À faire, dans l'ordre

Une seule PR, un seul patch, la version 8.0.0, pour les trois tickets. Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser.

### § 0 — Partir de `main`, les annexes

```bash
git fetch origin main
[ "$(git branch --show-current)" != main ] || git switch -c claude/lot-6-bascule-8
git switch -C "$(git branch --show-current)" origin/main
if git fetch origin claude/hopeful-lovelace-ouk6tz; then R=FETCH_HEAD; else R=origin/main; fi
for f in lot-6.patch mutations.mjs note-et-version.mjs; do git show "$R":docs/issues/gouverner-nos-boucles/issues/80-82-annexes/$f > "$S/$f"; done
sha256sum "$S/lot-6.patch"
git show origin/main:.claude-plugin/plugin.json | grep '"version"'
git log --oneline 97d17e3..origin/main | wc -l
```

La branche de la session, sans commit encore, est remise sur `origin/main` (jamais `main` elle-même). Les annexes se lisent sur la branche de documentation du programme, `claude/hopeful-lovelace-ouk6tz` ; si elle n'existe plus (sa PR de documentation est entrée dans `main`), le fetch échoue et la boucle les lit sur `origin/main`, sans autre choix à faire. Elles s'écrivent dans `S`, jamais dans le dépôt. La somme rendue est **`1ceca4a337704551b77ef241668c3549bc02a3819a161cd095cdf5f5ff850818`**, sinon s'arrêter. **Le `main` attendu** : `97d17e3` (7.39.0, la dernière ligne rend `0`), ou `main` après les PR des tickets de suite 75 à 79, si elles sont entrées avant (7.39.x ou 7.40.0).

### § 1 — Les bancs d'abord, vus rouges, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" origin/main
(cd "$S/rouge" && git apply -3 --include='*.test.mjs' "$S/lot-6.patch"; git -C "$S/rouge" status --short | wc -l)
(cd "$S/rouge" && for f in scripts/bascule.test.mjs scripts/depot.test.mjs scripts/veille-du-capitaine.test.mjs skills/chaine/tickets/references/scripts/docs/avancement.test.mjs skills/chaine/socle-chaine-de-production/references/scripts/verify/settings-json.test.mjs; do printf '%s ' "$f"; node --test --test-reporter=tap "$f" 2>&1 | grep -E '^# (tests|pass|fail) ' | tr '\n' ' '; echo; done)
git worktree remove --force "$S/rouge"
```

Cinq fichiers posés (quatre changés, un neuf), jamais dans la branche de la session ; `git apply -3` dit « Falling back to direct application » et sort en 0. Les comptes attendus : « Vérification », point 1. Sur un `main` plus récent, ce sont les mêmes 18 tests qui sont rouges ; le total d'un fichier (« sur 69 ») peut croître de ce que les tickets 75 à 79 ont ajouté, sans que ce soit un écart.

### § 2 — Le patch, la version et la note, dans la branche

```bash
git apply -3 "$S/lot-6.patch"; git diff --name-only --diff-filter=U
git checkout HEAD -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/note-et-version.mjs" "$S/lot-6.patch"
git add -A && git diff --cached --stat origin/main | tail -n 1
```

Sur `97d17e3`, `git apply -3` sort en 0 et la deuxième commande ne rend rien. Sur un `main` plus récent, il ne laisse en conflit que `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` (sortie 1) ; tout autre fichier en conflit : s'arrêter et l'écrire au lanceur (une PR des tickets 75 à 79 a changé la même phrase). Ces deux fichiers ne se résolvent jamais à la main : `git checkout HEAD --` les remet tels que `main`, et `note-et-version.mjs` passe la version à **8.0.0** et pose la note 8.0.0 du patch en tête (`7.39.0 → 8.0.0 ; note 8.0.0 posée en tête de NOTES-DE-VERSION.md`). Il sort en 1, sans rien écrire, si `main` est déjà à 8.0.0 ou plus : s'arrêter. La dernière ligne : `32 files changed`.

- **Si `main` bouge entre l'ouverture de la PR et sa fusion** : fusionner `origin/main` dans la branche par un commit de fusion (jamais de rebase ni de push forcé) ; si `plugin.json` ou `NOTES-DE-VERSION.md` sont en conflit, `git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json` puis `node "$S/note-et-version.mjs" "$S/lot-6.patch"` ; puis « Vérification » à nouveau.

### § 3 — Vérifier, commiter, livrer

Un seul commit, son message égal au titre de la PR : `git commit -m "feat(chaine): la bascule, le régime 8 de la relecture indépendante devient posable (plugin 8.0.0)"`. Puis « Vérification », points 2 à 5, dans l'ordre ; la suite entière (point 3) se lance par l'outil Bash **en tâche de fond** (`run_in_background`), avec un `timeout` explicite de `2400000` ms :

```bash
uptime; node --test 'scripts/*.test.mjs' 'skills/*/*/scripts/*.test.mjs' 'skills/*/*/references/scripts/*/*.test.mjs' 'skills/*/*/references/agent/*.test.mjs' > "$S/suite.log" 2>&1; echo "sortie $?" >> "$S/suite.log"
```

puis `tail -n 12 "$S/suite.log"` quand elle a fini (un `Monitor` jusqu'à la ligne `sortie`). Charge au-dessus de 3 (`uptime`) : attendre avant de la lancer. Puis le push, la destination en clair :

```bash
git push -u origin claude/lot-6-bascule-8
```

(une session dont la branche porte un autre nom pousse ce nom, en clair, jamais une variable). La PR des trois tickets vers `main`, prête (pas en brouillon), sans étiquette, titrée comme le commit ; dans le corps, la sortie de la « Vérification » (comptes, mutations, suite entière). La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire (deux tours sur la PR, `P-65`), puis joue l'essai réel après la fusion (ticket 82). La session rend au lanceur l'URL de la PR et la sortie de la « Vérification », puis s'arrête.

## Surfaces

| Surface | Prouvée par |
| --- | --- |
| Rôles du régime 8 ; le relecteur adversaire n'est plus un rôle | `bascule.test.mjs`, « les documents posés sont ceux du régime 8 » |
| La relecture dans le cycle (4 bis) | idem |
| `Sensibles:`, `Relecture: double`, l'accord avant le code ; `Label: contre-revue` plus montré obligatoire | idem |
| Les étapes 5 à 7 du § 5, la forme de la demande (le sha entier), `à-relire` avant de retirer `à-reprendre` | idem |
| Le réveil de secours : cinq cas, dans l'ordre ; `fusion-bloquée` sans `à-relire` ; l'écrire au conducteur | idem |
| « à archiver » à l'architecte | idem |
| Le fragment, le tracker, la conception, la criticité, la recette | idem |
| La forme de la demande est celle de `github.sh` | idem, dernière assertion |
| Le tableau : à reprendre, en relecture, Status `Fait` compris, jamais une PR fusionnée, NFC | `avancement.test.mjs`, « relecture indépendante : à reprendre… » |
| Le passage figé de `criticite/SKILL.md` | `depot.test.mjs`, « le skill de criticité… » |

## Vérification

Ces comptes valent pour la PR entière, les trois tickets ensemble, mesurés sur un clone neuf de `97d17e3` le 2026-11-22, Node 22.23.5.

1. **Rouge avant le patch** (§ 1) : **18 rouges** — `bascule.test.mjs` 9 sur 9 (le fichier neuf), `depot.test.mjs` 4 sur 69 (criticité, une sous-PR à la fois, la section « Recevoir develop », CODEOWNERS nommé), `veille-du-capitaine.test.mjs` 2 sur 4, `avancement.test.mjs` 1 sur 9, `settings-json.test.mjs` 2 sur 24.
2. **Vert après.** Les mêmes cinq fichiers dans la branche : 115 sur 115.
3. **La suite entière** (§ 3) : **1 396 sur 1 396** sur `97d17e3`, aucun sauté, 1 076 s (rejouée sur un clone neuf après le tour de relecture des tickets ; les retouches ajoutent des assertions, aucun test) ([`80-82-annexes/suite.txt`](80-82-annexes/suite.txt)) ; sur un `main` plus récent, le total de `main` plus 12.
4. **Mutations.** `node "$S/mutations.mjs"` depuis la racine, la branche commitée : **68 mutations**, « toutes rouges » ([`80-82-annexes/mutations.txt`](80-82-annexes/mutations.txt), 68 sur 68) (B1 à B36 pour les textes, V1 à V6 pour la veille, A1 à A6 pour le tableau, S1 à S6 pour le gate, D1 pour le banc de dépôt, R1 à R13 pour le tour de relecture des tickets : R1 à R9 les trous des bancs, R10 à R13 les retouches) ; une série par sa lettre (`node "$S/mutations.mjs" B`), une mutation par son nom (`B12`). Les mutations de ce ticket : B22 à B29, A1 à A6, R2, R3, R11.
5. `git diff --stat origin/main` : les 32 fichiers des « Où » des trois tickets, et eux seuls (trois neufs : `scripts/bascule.test.mjs`, `regime-7.md`, l'ADR).

## Ce qui n'a pas été établi

1. **Une session réelle qui suit ces documents** (une fille en régime 8, son réveil de secours, une contestation) n'est jouée par aucun banc : c'est l'essai réel du ticket 82, cas 1, 18 (contestation et arbitrage) et 19 (les trois branches du réveil de secours).
2. **Le tableau d'avancement sur un vrai GitHub** : les étiquettes y sont lues comme avant, par `gh api` ; seul le calcul neuf est éprouvé.
3. **Un document du régime 8 reposé seul dans un dépôt sans la clé** n'est refusé par rien : la note le dit (`A-196` point 4).

## Hors périmètre

- Les skills des rôles (ticket 81), le contrat, le socle, l'ADR et la version (ticket 82).
- Le gabarit de ticket (`ticket.issue.md`) garde sa ligne `Label: contre-revue`, lisible et sans effet en régime 8 : elle sort au nettoyage (lot 9, `A-102`).
- La repose dans les projets (lot 7).

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur la spec (lot 6, partie a ; `A-86`, `A-87`, `A-93`, `A-97`, `P-62`) et sur `origin/main` à `97d17e3` (plugin 7.39.0). Patch, bancs et mutations joués sur un clone neuf (« Vérification »).
- 2026-11-22 — Repris par le relecteur des tickets après son tour (`A-196`) : le réveil de secours (cas `fusion-bloquée` sans `à-relire`), la note (les documents ne se reposent qu'avec la clé), la source des annexes et les comptes de § 1 sur un `main` plus récent ; patch régénéré (sha256 `1ceca4a3…`), 68 mutations, rejoué sur un clone neuf de `97d17e3` (« Vérification »).
