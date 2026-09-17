---
name: socle-contrats
description: Pose les paquets partagés d'un monorepo — packages/contracts (schémas Zod, types inférés, formes de réponse, corps d'erreur) et, à la première fonction partagée, packages/utils — avec leurs règles et les gardes qui interdisent tout import de framework. Use when adding shared contracts or utilities to a monorepo, or when an API and its clients must share types and validation.
---

# Socle contrats

Pose ce que l'API et ses clients **partagent** : le paquet `contracts`, source unique des schémas Zod, et le gabarit du paquet `utils`, posé le jour où deux briques partagent une fonction pure. Avec les règles qui font tenir le partage, et le lint qui les applique.

**Ce socle ne contient aucun contrat métier** : `contracts` ne porte que le corps d'erreur commun. Les contrats métier naissent avec le premier use case, une fois le domaine modélisé.

Tous les gabarits vivent dans [`references/`](references/). Les copier **verbatim** puis substituer les placeholders.

## Avant de commencer — vérifier le terrain

1. **La racine est-elle posée ?** Si `pnpm-workspace.yaml` est absent, **invoquer `/maj-skills:socle-monorepo`** : il pose la racine et revient ici. Ne pas poser la racine à la main.
2. Si `packages/contracts/` existe déjà, **s'arrêter et demander**.
3. Les placeholders (`{{PROJET}}`, `{{SCOPE}}`, …) sont ceux fixés par `socle-monorepo`. S'ils ne sont pas dans la conversation, les relire dans `package.json` et `CLAUDE.md`.

Ce skill ne pose **aucune question** : il n'y a rien à trancher. C'est `socle-monorepo` qui l'invoque, avant tout service, dès qu'un service est choisi.

## Étape 1 — poser `contracts`

| Source                                        | Destination           |
| --------------------------------------------- | --------------------- |
| `references/packages/CLAUDE.md`               | `packages/CLAUDE.md`  |
| `references/squelette/contracts/*`            | `packages/contracts/` — dont `eslint.rules.mjs`, chargé par l'ESLint racine |

Puis **composer les fichiers de la racine** — chaque fragment s'insère **immédiatement au-dessus** du marqueur de sa zone, sans supprimer le marqueur :

| Fragment                                     | Fichier racine | Zone                         |
| -------------------------------------------- | -------------- | ---------------------------- |
| `references/fragments/claude-md-routing.md`  | `CLAUDE.md`    | `<!-- socle:routing -->`      |
| `references/fragments/readme-ou-vit-quoi.md` | `README.md`    | `<!-- socle:ou-vit-quoi -->`  |
| `references/fragments/readme-regles.md`      | `README.md`    | `<!-- socle:regles -->`       |

Substituer les placeholders dans tout ce qui vient d'être copié.

## Étape 2 — `utils`, seulement à la première fonction

**Ne pas poser `packages/utils` maintenant.** Un paquet vide est un mensonge : il annonce un partage qui n'existe pas. Le gabarit [`references/squelette/utils/`](references/squelette/utils/) attend le jour où **deux briques** ont besoin de la même fonction pure. Ce jour-là :

1. Copier `references/squelette/utils/*` vers `packages/utils/`, substituer les placeholders.
2. Écrire la fonction **et son `*.spec.ts`**, ré-exporter depuis `src/index.ts`.
3. Ajouter `"@{{SCOPE}}/{{PROJET}}-utils": "workspace:*"` aux briques qui la consomment.
4. Ajouter la ligne `utils/` sous `packages/` dans le « Où vit quoi » du `README.md`.

C'est un skill de service ou un développeur qui déclenche ce geste, pas ce skill.

## Étape 3 — vérifier, puis seulement conclure

```bash
pnpm install
pnpm check      # le paquet build, lint, typecheck avec le reste
```

Vérifier que **la garde de framework mord** : créer `packages/contracts/src/sonde.ts` avec `import { Injectable } from "@nestjs/common";`, confirmer que `pnpm lint` échoue avec le message de `packages/CLAUDE.md`, **puis le supprimer**. Si le lint ne mord pas, `packages/contracts/eslint.rules.mjs` n'est pas chargé par l'ESLint racine.

Contrôler qu'il ne reste **aucun placeholder `{{…}}`** dans les fichiers posés.

**Ne pas commiter** : l'historique est écrit par `socle-monorepo` à la fin.

## Ce que ce skill ne fait pas

- **Aucun contrat métier.** Le corps d'erreur commun, et rien d'autre.
- **Aucun client généré** depuis OpenAPI : les clients importent les schémas Zod directement, c'est plus court et sans étape de génération. Le document OpenAPI reste émis par l'API pour un consommateur tiers.
- **Aucun paquet `ui`.** Les composants ne se partagent pas entre un client web et un client mobile.

## Anti-patterns

| Tentation                                                    | Pourquoi c'est faux                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| « Je pose `utils` tout de suite, vide, pour plus tard »      | Un paquet vide annonce un partage qui n'existe pas. Il naît avec sa première fonction.        |
| « Je déclare une `interface` à côté du schéma, c'est plus lisible » | Deux sources de vérité. Le type s'infère du schéma, jamais l'inverse.                 |
| « Je mets les libellés de l'enum dans `contracts` »          | Un libellé est de la présentation. Le tuple et le `z.enum` sont le contrat ; le libellé vit ailleurs. |
| « `contracts` importe une fonction de `utils` »              | Les paquets sont plats. Ce qui sert aux deux est au mauvais endroit.                          |
| « Je construis `dist/` pour que ce soit propre »             | Les sources suffisent et ne périment jamais. Un `dist/` oblige chaque tâche à dépendre de `^build`. |
