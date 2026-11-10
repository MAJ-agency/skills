---
name: recette-humaine
description: Recette humaine d'un module, en quatre phases avec un arrêt obligatoire après la première — inventaire (rôles, objets et états, table état × geste, surfaces, invariants, saisies, gestes coûteux, temps, traitements sans écran, définitions en double, défauts candidats, questions au produit), validation par le produit, tests de recette rouges, tickets de défauts — puis les correctifs par la chaîne ordinaire. À utiliser quand on demande une « recette humaine », une « recette » d'un module ou d'un parcours, ou « qu'est-ce qui casse si un humain fait ça ».
argument-hint: '<module> [--phase inventaire|tests|tickets] [--base <sha>]'
---

# Recette humaine d'un module

Les gates relisent un fichier, la revue adversariale relit un diff. Aucun des deux ne compare deux écrans, ne rejoue deux clics, ni ne parcourt la machine à états d'un objet. La recette humaine fait cela : une session inventorie ce qu'un humain peut faire au module, écrit les tests qui le prouvent, et dépose les défauts en tickets. Pourquoi, ce qu'elle coûte et ce qu'elle a rapporté : l'ADR « recette humaine » du dépôt, posée par `socle-chaine-de-production`. Méthode détaillée (familles de défauts, grilles, gabarit d'inventaire) : [`references/methode.md`](references/methode.md).

## Quand

- Avant la mise en recette d'un client sur un module qu'il utilisera, ou après une série de specs qui a remanié un module.
- Un module par passage. Rotation proposée : un module par sprint, priorité aux modules qui touchent l'argent, les courriels envoyés et les places.
- Jamais en CI : la recette est l'étape de jugement. Ce qu'elle laisse en CI, ce sont ses specs.

## Règles du jeu

- **Lire d'abord** `CLAUDE.md`, les règles du chemin (`apps/<service>/CLAUDE.md`, `.claude/rules/*.md`), `GLOSSARY.md`, le registre de règles (`docs/metier/regles/`) et les specs du module.
- **Ne rien corriger** pendant l'inventaire et les tests : un défaut devient un ticket, pas un diff. Les correctifs passent par la chaîne ordinaire (ticket réservé, branche, revue adversariale, `à-fusionner`).
- **N'inventer aucune règle.** Une règle sans source devient une question au produit ; deux sources qui se contredisent aussi. Chaque ligne de l'inventaire porte `[code]`, `[spec]`, `[règle]` ou `[proto]`.
- **Arrêt après l'inventaire.** Aucun test ne s'écrit avant la validation du produit (phase 2).
- **Branche** : `recette/<module>` depuis `origin/develop`, PR brouillon dès le premier commit, sujet `sujet/recette-<module>` si plus de trois tickets sont attendus (skill `sujet`).

## Phase 1 — inventaire (`--phase inventaire`, par défaut)

Sortie : `docs/recette/<module>/inventaire.md`, sections numérotées comme le gabarit (`methode.md` § « Gabarit »).

1. **Sources** : specs, ADR, registre, code (`fichier:ligne`), prototype. Base notée en tête (`develop` à `<sha>`).
2. **Rôles** : qui touche au module, avec le droit qui ouvre chaque geste (le catalogue de rôles de `packages/contracts`).
3. **Objets et états** : l'objet central et ses satellites ; états, transitions, et pour chaque transition qui la fait et ce qu'elle déclenche (événement, courriel, file).
4. **Table état × geste** de l'objet central : une ligne par état, une colonne par geste humain, chaque case « permis / refusé (code) / ? ». Les `?` sont des trous.
5. **Surfaces** par objet : chaque écran, courriel, PDF, export, endpoint public qui montre l'objet, avec son libellé et sa source de données.
6. **Invariants** `I-n` : ce qui doit dire la même chose partout (libellés, compteurs, échéances, montants). Chaque invariant cite ses surfaces et son statut : tenu, rompu, inconnu.
7. **Saisies à risque** : dates, noms, montants, fichiers, saisies libres ; ce que le schéma Zod partagé refuse et ce qu'il laisse passer.
8. **Gestes coûteux** : ce qui envoie un courriel, prend une place, débite, publie ; ce qui est rejouable (double clic, deux onglets, webhook rejoué).
9. **Temps** : fuseaux, minuit, fin de période, échéances calculées à la lecture ou figées.
10. **Traitements sans écran** : crons, listeners, files ; ce qu'ils font sur chaque état.
11. **Définitions en double** : la même règle écrite deux fois (front et back, deux services, web et mobile), avec les écarts.
12. **Quinze premiers tests** : risque = coût du défaut × probabilité du geste ; famille, geste humain, attendu, type (GF garde-fou `*.db.spec.ts`, PN parcours Playwright, IC invariant de cohérence), « écrivable maintenant » ou « bloqué par T-n ».
13. **Défauts candidats** `D-n` : constat en lecture, source, famille, test qui le prouverait. Rien n'est corrigé.
14. **Questions au produit** `T-n` : **quinze au plus**, chacune marquée « bloque un test » ou non ; le reste reste en dette de spec dans la section, sans numéro.

Clore par un résumé de dix lignes, puis s'arrêter.

Sous-agents : un `Explore` par axe large (surfaces, listeners et crons, définitions en double, saisies) pour garder le contexte de la session léger ; la session garde la table état × geste et les invariants.

## Phase 2 — validation par le produit

Le produit relit l'inventaire, tranche ou reporte les `T-n`, retire ou ajoute des tests. Rien ne s'écrit avant son « validé ». Une question reportée bloque ses tests, pas les autres.

## Phase 3 — tests de recette (`--phase tests`)

- Emplacements de `.claude/rules/tests.md`. Nom : `recette.<sujet>.db.spec.ts` ou `recette.<sujet>.spec.ts` à côté du code, `tests/recette-<sujet>.spec.ts` pour un parcours. En tête de fichier : le numéro de test de l'inventaire, la famille, l'invariant.
- **Un test écrit l'attendu de l'inventaire, jamais le comportement observé.** Un test rouge est un défaut confirmé, pas un test à ajuster.
- **Rouge = `it.skip` avec ticket**, sur la ligne au-dessus : `// skip: <TICKET> — <raison>` (`it.skip.each` pour une table). Le correctif retire le `skip` sans changer l'attendu. Un ticket `Fait` dont le `skip` est encore là est une dette à retirer dans la PR du correctif.
- **Pas d'identifiant de règle** du registre dans un titre de test de recette : le registre le lirait comme une preuve.
- **Un invariant se lit au catalogue partagé** (`packages/contracts`), pas à l'écran comme texte ; lire un fichier source comme texte reste l'exception, et le test dit alors ce qu'il cherche.
- Un test qui clignote est une course réelle jusqu'à preuve du contraire : le rejouer trois fois et en faire un défaut.
- Bilan dans l'inventaire, § 14 : cas, rouges, verts, intermittents, et le défaut que chaque rouge confirme.

## Phase 4 — tickets (`--phase tickets`)

- Une spec de défauts `SPEC_<CTX>_<TRI>-<n>-defauts-recette-<module>.spec.md` (identifiant par `node scripts/docs/next-id.mjs SPEC <CTX> <TRI>`), `Sujet: sujet/recette-<module>` en tête si plus de trois tickets, et un ticket par défaut confirmé au format « prêt pour agent » (`docs/agents/chaine-de-production.md` § 3), avec `Type: défaut` et `Règles:` reprises de l'inventaire. Chaque ticket cite la ligne `D-n` de l'inventaire et nomme le test rouge dans `## Surfaces` : le gate vérifie qu'il existe et n'est plus désactivé quand le ticket est `Fait`.
- Un défaut qui attend une réponse du produit : ticket `needs-info` avec la question `T-n`.
- Puis la chaîne ordinaire : `node scripts/docs/ticket-libre.mjs`, correctif, revue adversariale, `à-fusionner`. La PR de correctifs cite les tests passés de rouge à vert.

## Mesures

Pour chaque passage, noter dans `docs/recette/<module>/inventaire.md` § 14 : tests écrits, rouges à la première passe, intermittents, rouges devenus verts, questions répondues, tickets livrés. Repère du premier passage connu : 24 cas, 18 rouges, 1 intermittent, 13 tickets, 10 livrés en une PR.

## Ne jamais

- Corriger du code de production pendant les phases 1 à 3.
- Écrire un test avant la validation du produit, ni ajuster un attendu pour faire passer un test.
- Inventer une règle ou trancher une contradiction à la place du produit.
- Lancer la recette en CI ou par une Action GitHub.
- Dépasser quinze questions numérotées.
