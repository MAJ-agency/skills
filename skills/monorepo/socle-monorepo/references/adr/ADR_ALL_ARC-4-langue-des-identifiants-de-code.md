# ADR_ALL_ARC-4 — Langue des identifiants de code

- Statut : **accepté**
- Date : {{DATE}}
- Portée : tout le code du dépôt — `apps/*`, `packages/*`, schéma de base, scripts et gates

## Contexte

Le projet se documente **en français** : le glossaire, les règles métier, les réunions, l'interface et les commits sont dans la langue de l'équipe et du client. La tentation évidente est d'écrire le code dans la même langue, pour que le langage ubiquitaire du métier soit aussi celui du code : `CreerLicenceDto`, feature `sante`, script `check:dette`.

Deux faits s'y opposent :

1. **Un produit est généraliste**, pas un outil sur mesure pour un seul client ou un seul marché. Les concepts du code doivent donc être **généralistes** (`client_case`, `stakeholder`, `organization`), pas les mots d'un seul métier (`dossier_beneficiaire`, `auxiliaire_de_vie`).
2. Le glossaire métier reste **en français** parce que le client, les règles et l'interface le sont. Si le code est en français aussi, chaque concept a un nom métier français et un nom généraliste français, ce qui est pire que deux langues : deux mots français pour la même chose.

La question n'est pas « français ou anglais » mais **où passe la frontière entre le langage du métier et le langage du code**.

## Décision

- **Tous les identifiants de code sont en anglais** : noms de fichiers et dossiers, tables et colonnes, types, classes, fonctions, variables, champs de DTO et de contrat Zod, routes, scripts `package.json`, variables d'environnement, noms de gates.
- **Les identifiants sont généralistes**, pas traduits mot à mot du métier : `client_case` et non `beneficiary_file`, `stakeholder` et non `beneficiary`, `staff` et non `care_worker`. Le test : un autre marché que celui du premier client comprendrait-il ce nom ?
- **La prose reste en français** : commentaires, documentation, messages de commit, textes d'interface, messages d'erreur destinés aux humains, noms de tests (qui citent les règles du registre, `<TRI>-<N>`).
- **`GLOSSARY.md` porte la correspondance.** Chaque terme du glossaire a pour entrée son **nom en code** et sa définition en français, avec le libellé affiché à l'utilisateur. C'est le seul pont entre le mot du métier et l'identifiant ; un agent n'a pas à deviner. Le fichier s'appelle `GLOSSARY.md`, le nom qu'attendent les skills de Matt Pocock (`grill-with-docs`, `domain-modeling`) qui portent le grilling : avec un autre nom, ils créeraient un second glossaire.
- **Un terme métier sans nom en code dans `GLOSSARY.md` n'est pas prêt à être codé.**
- **Exception : les scripts posés par le plugin `maj-skills`** (`scripts/docs/`, `scripts/verify/`, `scripts/chaine/`, `scripts/agent/`, `scripts/github/`, et les scripts `package.json` qui les lancent) gardent la langue du plugin, le français. Ce sont des copies verbatim de ses gabarits, corrigées dans le plugin et reposées ici : les traduire les rendrait indiffables avec leur source — la raison même pour laquelle les règles impératives des services restent en anglais. Un script écrit pour ce projet seul suit la règle générale.

## Alternatives écartées

- **Français partout** — cohérent avec le glossaire, mais fige des noms de métier dans un produit généraliste, et interdit tout nom généraliste sans inventer un second vocabulaire français.
- **Base de données seule en anglais, domaine en français** — deux noms par concept, et une traduction dans chaque repository. C'est l'endroit exact où un agent se trompe de nom.
- **Glossaire en anglais aussi** — le client, les règles, l'interface et les réunions sont en français ; un glossaire anglais ne serait lu par personne côté métier.

## Conséquences

**Positives.** Un seul nom par concept dans le code, lisible par un futur marché ou un futur prestataire. Le glossaire devient l'index du code.

**Coûts.** Une discipline : le nom en code se fixe au glossaire avant d'écrire le code ; les guides et les `CLAUDE.md` donnent leurs exemples en anglais.

**Risques & parades.**

| Risque                                                          | Parade                                                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Un identifiant traduit mot à mot du métier (`beneficiary_file`) | Revue : le test « un autre marché comprendrait-il ? » ; le glossaire fixe le nom avant le code                 |
| De la prose en anglais par contagion (commentaires, commits)    | Commitlint et revue : la règle est « identifiants anglais, prose française », pas « tout en anglais »          |
| Un terme codé sans passer par le glossaire                      | Le nom en code est une ligne obligatoire de `GLOSSARY.md` ; une PR qui introduit un concept absent est refusée |

## Liens

- `GLOSSARY.md` — la correspondance terme ↔ nom en code
- `docs/methode/decisions.md` § _GLOSSARY.md — le langage ubiquitaire_
- `CLAUDE.md` racine, `apps/*/CLAUDE.md`, `packages/CLAUDE.md` — portent la règle
