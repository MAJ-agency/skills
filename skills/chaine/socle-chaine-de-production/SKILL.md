---
name: socle-chaine-de-production
description: Pose dans un monorepo tout ce que supposent les skills d'exploitation de la chaîne de production (tickets, sujet, fusionner, revue-adversariale, chantier, recette-humaine) — develop qui intègre et main qui livre, les sept labels, les hooks d'agent, le contrat .claude/chaine.json, la liste des index générés, une CI minimale, la méthode docs/agents/chaine-de-production.md et trois ADR — puis dit ce qu'un admin fait à la main. Use when setting up parallel agent sessions, a merge captain, adversarial review or subject branches on a repository, or when a chain skill says the socle is missing.
---

# Socle de la chaîne de production

Pose, une fois, ce que les skills d'exploitation lisent ensuite sans le remettre en question. **Il n'écrit rien de métier**, et il n'exploite rien : fusionner, relire, cadrer sont les skills `fusionner`, `revue-adversariale`, `chantier`.

Tous les gabarits vivent dans [`references/`](references/). Les copier **verbatim** puis substituer les placeholders `{{PROJET}}`, `{{PROJET_SNAKE}}`, `{{SCOPE}}`, `{{DATE}}`, `{{ADR_CHAINE}}`, `{{ADR_SUJET}}`. Ce que chaque pièce fait et pourquoi : [`references/CONTENU.md`](references/CONTENU.md).

## Avant de commencer — vérifier le terrain

1. **La racine est-elle posée ?** `pnpm-workspace.yaml` absent → invoquer `/maj-skills:socle-monorepo` d'abord.
2. **Le dépôt a-t-il un remote GitHub ?** `git remote get-url origin`. Sans lui, les labels, la CI et la protection des branches n'ont pas de sens : s'arrêter et le dire.
3. Si `.claude/chaine.json` existe, le socle est posé : **s'arrêter et demander** ; une mise à jour se fait pièce par pièce.
4. Les skills `tickets` et ce socle vont ensemble : `scripts/docs/identifiants.mjs` absent → l'étape 2 l'invoque.

## Étape 1 — les questions

En un seul tour, chacune avec sa recommandation :

1. **Chemins sensibles** — les dossiers du code où un diff passe en plus `/security-review` : authentification, droits, chiffrement, paiement, export de données. _(Recommandé : `apps/api/src/infrastructure/**/auth/`, et ce que le projet a déjà nommé.)_
2. **Filles par vague** — combien de sessions filles en parallèle par défaut. _(Recommandé : 6.)_
3. **Dossier des migrations** — ce que le hook de fichiers protège. _(Recommandé : `apps/api/src/db/migrations/` pour le socle API ; `apps/api/prisma/migrations/` pour un projet Prisma.)_

Rien d'autre : les branches sont `develop` et `main`, les labels ont leurs noms, le fichier de critères s'écrit à l'installation de `revue-adversariale`.

## Étape 2 — poser

1. **Le skill `tickets`** : invoquer `/maj-skills:tickets poser`. Il pose les scripts de `scripts/docs/` et `scripts/verify/`, le tracker et les gabarits.
   Puis `/maj-skills:revue-adversariale poser` : `scripts/chaine/diff-revue.sh` et le fichier de critères. (Les skills `sujet` et `fusionner` se posent de même, à leur arrivée.)
2. **Le contrat** : `references/chaine.json` → `.claude/chaine.json`, rempli des réponses de l'étape 1.
3. **Les index générés** : `references/index-generes.json` → `scripts/docs/index-generes.json`, s'il n'existe pas. Y ajouter les index que le projet connaît déjà (OpenAPI de l'API, index de graphify s'il est versionné).
4. **Les hooks d'agent** : `references/agent/*` → `scripts/agent/`. Fusionner `references/settings-hooks.json` dans la clé `hooks` de `.claude/settings.json` : les deux entrées `PreToolUse` **s'ajoutent** à celles de graphify. Tester : `node --test scripts/agent/regles.test.mjs`, puis une commande refusée à la main : `echo '{"tool_input":{"command":"git push --force origin x"}}' | node scripts/agent/garde-commandes.mjs` sort en 2.
5. **Les labels** : `references/labels.sh` → `scripts/github/labels.sh`. Avec `gh` authentifié, le jouer ; sinon `--liste`, et la ligne va dans `admin.md`.
6. **La CI** : `references/ci/ci.yml` → `.github/workflows/ci.yml`, placeholders substitués. S'il existe déjà un workflow, y ajouter les deux jobs plutôt que le remplacer.
7. **La méthode** : `references/docs-agents/chaine-de-production.md` → `docs/agents/chaine-de-production.md`.
8. **Les ADR** : `node scripts/docs/next-id.mjs ARC` trois fois, de suite ; `references/adr/ARC-N-chaine-de-production.md`, `ARC-N-branches-de-sujet.md`, `ARC-N-recette-humaine.md` → `docs/adr/ARC-<n>-….md`, `{{N}}` et `{{DATE}}` substitués. `{{ADR_CHAINE}}` et `{{ADR_SUJET}}` valent ces identifiants dans tous les fichiers posés.
9. **La branche `develop`** : `git fetch origin main && git push origin origin/main:refs/heads/develop` si elle n'existe pas. La branche par défaut et sa protection sont à l'admin (`admin.md`).
10. **Les fragments** : chaque fragment s'insère immédiatement au-dessus du marqueur de sa zone, sans le supprimer :

| Fragment                                  | Fichier racine | Zone                          |
| ----------------------------------------- | -------------- | ----------------------------- |
| `references/fragments/claude-md-routing.md` | `CLAUDE.md`  | `<!-- socle:routing -->`      |
| `references/fragments/claude-md-fusion.md`  | `CLAUDE.md`  | en fin de fichier, avant `## graphify` |
| `references/fragments/readme-commandes.md`  | `README.md`  | `<!-- socle:commandes -->`    |
| `references/fragments/readme-ou-vit-quoi.md` | `README.md` | `<!-- socle:ou-vit-quoi -->`  |

11. **La liste de l'admin** : `references/admin.md` → `docs/agents/chaine-admin.md`, cases à cocher par l'humain.

## Étape 3 — vérifier, puis seulement conclure

```bash
pnpm check
pnpm check:tickets        # le gate et les tests des scripts, dont scripts/agent/
node scripts/docs/next-id.mjs ARC
```

Puis : aucun placeholder `{{…}}` restant (chercher `{{[A-Z_]+}}` hors JSX) ; `.claude/settings.json` valide et les quatre hooks présents (deux graphify, deux agent) ; `gh api repos/{owner}/{repo}/labels --jq '.[].name'` liste les sept labels, ou la case correspondante de `chaine-admin.md` est ouverte.

Remettre à l'humain **la liste de `chaine-admin.md`** : rien de la chaîne ne tourne tant que `develop` n'est pas protégée avec « branche à jour exigée ».

## Étape 4 — l'historique

Si ce socle est invoqué seul : `chore(chaine): pose le socle de la chaîne de production`, puis `docs(adr): consigne la chaîne de production, les branches de sujet et la recette humaine`. Invoqué par `socle-monorepo`, c'est lui qui écrit l'historique.

## Ce que ce skill ne fait pas

- **Ni critères de revue, ni chemins sensibles inventés.** Le fichier de critères naît avec `revue-adversariale` ; les chemins viennent de la question 1.
- **Aucun réglage GitHub qui demande un admin** : protection, branche par défaut, suppression automatique. Il les liste.
- **Aucun chantier.** Il ne lance pas de session, n'ouvre pas de sujet.

## Anti-patterns

| Tentation                                                      | Pourquoi c'est faux                                                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| « Je garde `main` comme branche d'intégration, c'est plus simple » | Le capitaine, les sujets et les scripts lisent `develop`. Deux conventions, c'est deux fois les tests. |
| « Je mets les règles de fusion dans un prompt, pas dans un hook » | Un prompt se contourne, un hook non. Le push forcé a été vu deux fois avant le hook.                |
| « Je recopie les ADR de Fedora »                               | Une ADR est une décision du projet, datée et signée. Le gabarit porte les faits ; le projet la fait sienne. |
| « J'ajoute un label de plus pour notre cas »                   | Les sept labels sont le protocole des skills. Un huitième n'est lu par personne.                     |
| « La CI minimale ne suffit pas, j'écris les E2E tout de suite » | Un E2E sans seed ni parcours est un job rouge. Ils arrivent avec le premier parcours.               |
