# Brouillon — chantier « Description d'une feature » (P-39), 2026-11-17

## Faits relevés (agent de recherche, anchorpost develop 1eb9534, skills main c17f88b)
- CLI : `read/tracking/specs.ts` `loadSpecs` (titre, Sujet, Origine, EPIC, Règles) ; `sectionText(text, title)` existe (`headers.ts:75`), sans test direct, ne saute pas les blocs de code ; `build/tracking.ts:61` `buildFeatures` ; alertes `build/health.ts` (modèle : spec sans EPIC, `:226-235`, test `health.spec.ts:333`).
- Schéma : `FeatureSchema` v2 `index-schema.ts:162-186` (non strict), v3 = v2 sauf criticité ; `from-v2.ts`. Aucune borne de longueur. Texte long existant : `Rule.statement`.
- check : 9 groupes, seuls les `error` refusent ; « ancien toléré » : plancher du manifeste, `tickets-dette.json` (plugin), drapeau `derivedTitle`. La CLI est hors ligne, sans date.
- API : `packages/contracts/src/project.ts` `ProjectFeatureDto` ; `project.mappers.ts:43` `featureToDto` ; `snapshot.repository.ts:89` ; `openapi.json` généré.
- Web : `features/project/components/feature-row.tsx:201` `FeatureRow` (partout le même) ; aucun rendu markdown ; recherche `lib/search.ts:121` (id et titre).
- Cloisonnement : `citedVisibility` ; texte servi tel quel, seul le lien est filtré.
- Specs : six (`ANC-1, -4, -5, -6, -7`, `SOC-1`) ; prochain id `SPEC_ALL_ANC-8` (à confirmer par `next-id.mjs`). SOC-1 : H1 sans identifiant, ni Sujet ni EPIC.
- Gabarit : `docs/agents/gabarits/spec.spec.md` (copie du plugin `skills/chaine/tickets/references/gabarits/spec.spec.md`) ; cité par `architecte:54`, `chantier:60`, `tickets:53,62`, `anchorpost:67` ; aucun banc ne le fige. Aucun gate ne vérifie les sections d'une spec.

## Décisions techniques de l'architecte (provisoires)
- Section `## Description` en tête de la spec : un paragraphe (l'intention), puis `### Ce qui est attendu` et sa liste à puces.
- Index : `features[].description { intent, capabilities[] }`, facultatif (mineure de la CLI, après la 2.0.0).
- « Obligatoire » : clé facultative du manifeste, liste des specs tolérées sans description ; absente → alerte seule ; présente → `check` refuse toute spec sans description hors liste ; une spec listée qui en a une → alerte « retirer de la liste ».
- Alerte « ressemble à une règle » : mot de contrainte dans une capacité.
- Affichage : texte tel quel, sans lien, sur `FeatureRow` dépliée.

## Les six descriptions (brouillons, à faire valider)
- SPEC_ALL_ANC-1 : « En tant que membre d'un espace, je veux lire les règles métier de mon projet, leurs preuves, ses défauts et mes demandes depuis la documentation de son dépôt, afin de savoir où en est le projet sans dépendre de l'équipe. » — L'admin peut créer un espace en reliant un dépôt GitHub et une branche, et choisir son contexte. / L'admin peut inviter des membres par un lien envoyé par courriel. / Le membre voit la description du projet et ses règles métier. / Le membre voit, sur la page d'une règle, son énoncé, ses décisions, ses liens, ses preuves, ses défauts et les demandes qui la visent. / Le membre voit les défauts et les demandes du projet en liste. / L'admin voit les incohérences relevées dans la documentation.
- SPEC_ALL_ANC-4 : « En tant qu'équipe d'un projet, je veux qu'une commande lise la documentation de mon dépôt et en tire l'index qu'Anchorpost affiche, afin que la MOA lise toujours ce que dit le dépôt, jamais une ressaisie. » — L'équipe peut préparer un dépôt pour Anchorpost. / L'équipe peut produire l'index et le vérifier avant de pousser. / L'équipe peut convertir une documentation ancienne au standard. / Les contrôles d'un projet peuvent lire le dépôt par la même bibliothèque.
- SPEC_ALL_ANC-5 : « En tant que MOA, je veux savoir si chaque règle est assez prouvée au regard de ce que coûterait une erreur, afin de me fier au mot « prouvée ». » — La MOA voit la criticité de chaque règle, qui l'a fixée et pourquoi. / La MOA voit les cas attendus d'une règle, et lesquels sont prouvés. / La MOA voit qu'une règle est « partielle » quand des cas lui manquent. / L'équipe voit, à chaque PR, les règles touchées et ce qui leur manque.
- SPEC_ALL_ANC-6 : texte du pair (sources-pair.md).
- SPEC_ALL_ANC-7 : « En tant que membre d'un espace, je veux lire le projet par module puis par feature, afin de retrouver une règle ou un ticket là où je pense le projet. » — Le membre voit les modules, leurs features et les règles que chaque feature réalise. / Le membre voit toutes les features, et toutes les règles avec leurs filtres. / Le membre peut chercher un mot dans le sous-onglet ouvert. / Le membre voit, sur une feature, ses tickets, ses défauts ouverts et les demandes qui l'attendent. / Le membre voit la criticité de chaque règle et de chaque feature.
- SPEC_ALL_SOC-1 : « En tant qu'équipe du projet, je veux un squelette technique qui tient, afin de construire Anchorpost sans rediscuter l'outillage à chaque feature. » — L'équipe peut lancer tous les contrôles par une commande. / L'équipe dispose d'une API, d'un client web et de contrats partagés qui démarrent. / L'équipe peut mener plusieurs sessions d'agents en parallèle, avec une seule file de fusion.

## Tour de questions au produit (à poser quand la maquette du filtre est tranchée)
1. Une seule phrase par feature, pour le rôle principal.
2. Toute spec est décrite, même technique ; rôle « l'équipe du projet ».
3. « Obligatoire » par une liste des anciennes specs tolérées, qui ne peut que rétrécir.
4. Alerte quand une ligne de « Ce qui est attendu » ressemble à une règle (« jamais », « toujours », « seulement si », « sauf »).
5. Pas de validation datée de la description : validée avec la spec.
6. La recherche de l'onglet « Projet » lit aussi la description.
Ensuite : texte de la règle métier (RULE_ALL_ANC-31 ?), puis les six descriptions.
