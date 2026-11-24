# Un renvoi pour conflit se corrige en fusionnant `develop` dans sa branche : le seul cas où une session met elle-même sa branche à jour

Status: Fait — PR #161
Type: défaut
Modèle: sonnet — une précision de texte à cinq endroits, la même partout, un banc qui la tient et la version ; rien à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-chaine-de-production.md`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/chantier/references/regime-7.md`, `scripts/bascule.test.mjs`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`

## Le besoin

**Décision du CTO (2026-11-24).** La méthode de la chaîne se contredit. La règle de la session de travail dit « **Ne jamais fusionner soi-même, ni remettre la branche à jour avec `develop`.** », et la règle du renvoi dit seulement « `fusion-bloquée` : PR renvoyée (conflit, CI rouge, refus, verdict absent) avec commentaire → corriger ». Pour un conflit, corriger veut dire fusionner `develop` dans sa branche ; or le capitaine n'a pas le droit de résoudre le conflit de code d'une autre session (skill `fusionner`, table des rôles).

**Le fait.** Le 2026-11-24, sur `fedora`, cinq PR de constats renvoyées pour conflit sont restées arrêtées : les sessions attendaient que le capitaine mette leur branche à jour, le capitaine attendait qu'elles corrigent. Le commentaire de renvoi disait pourtant le geste (`boucle.sh` : « Fusionner develop dans la branche et le résoudre », ou le sujet pour une sous-PR) ; c'est la règle écrite qui l'interdisait.

Quand le ticket est fait : chaque texte de `skills/` qui interdit à une session de remettre sa branche à jour dit l'exception du renvoi pour conflit, et les textes posés distinguent le conflit des autres causes de renvoi.

## Décisions

1. **Conflit** : la session fusionne sa base (`develop`, ou son sujet pour une sous-PR, ce que le renvoi de `boucle.sh` nomme déjà) dans sa branche, seule exception à la règle de la session de travail, résout le conflit, régénère les index générés et passe `pnpm check`. **Sinon** (CI rouge, refus, verdict absent) : corriger sans fusionner sa base. Puis redemander la relecture comme aujourd'hui (`à-relire`, sans retirer `fusion-bloquée`) ; en régime 7, retirer `fusion-bloquée` et remettre `à-fusionner`, comme avant.
2. **Les textes** : le fragment `claude-md-fusion.md` (puce « Session de travail » : « hors renvoi pour conflit (`fusion-bloquée`, ci-dessous) » ; puce « `fusion-bloquée` » : conflit / sinon) ; `chaine-de-production.md` § 5, la ligne « Renvoyée par le capitaine » ; la table des rôles de `fusionner/SKILL.md` et celle du capitaine de `regime-7.md` (« Ne fait jamais » : « … (hors renvoi pour conflit) » ; « Propriétaire renvoyé » : « corrige (conflit : fusionne develop dans sa branche et le résout), … ») et la ligne de la session qui code de `regime-7.md` ; le point 5 du gabarit de l'ADR « chaîne de production » (« Personne d'autre ne fusionne ni ne remet une branche à jour, hors renvoi pour conflit… »). Aucune ligne ajoutée.
3. **Aucun script ne change** : `renvoyer.sh` et `boucle.sh` disent déjà le geste ; les hooks d'agent laissent passer `git merge` puis un push ordinaire. Hors du renvoi d'une session : la livraison d'un sujet renvoyée (`sujet/SKILL.md`, « Livrer ») et le capitaine sans la chaîne (`architecte/references/lancement.md`, « Tu ne mets jamais une branche à jour toi-même ») suivent leurs propres règles, inchangées.
4. **Un banc** (`scripts/depot.test.mjs`) : toute ligne d'un `.md` de `skills/` qui dit « remettre (sa, la, une) branche à jour » porte « hors renvoi pour conflit », avec ses entrées piégées ; le fragment et la méthode posés portent la distinction ; `boucle.sh` dit toujours le geste. `scripts/bascule.test.mjs` suit les deux tables.
5. **Version : patch**, 8.3.3 → 8.3.4 (`main` était à 8.3.3, PR 160, à l'écriture), avec sa note.

## Vérification

- `pnpm test` vert.
- Le banc nouveau, rouge sur le point 5 de l'ADR remis tel qu'il était sur `main` (`…:21`), vert avec la précision.

## Comments

- 2026-11-24 — Ouvert et réalisé dans la même PR (#161), sur la décision du CTO du jour. `pnpm test` : 1478 tests, 1478 verts.
