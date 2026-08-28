# socle-nest-hexagonal

Un skill Claude Code qui **amorce un backend NestJS hexagonal complet** dans un dépôt vide : le service qui démarre, ses règles d'architecture, la méthode de travail, la documentation structurée, l'outillage agent — et les tickets de tout ce qui reste à trancher.

**Aucune règle métier**, par construction. Ce socle ne porte que de la configuration, de l'architecture et de la méthode. Le métier arrive après, par le grilling.

## Installer

```bash
claude plugin marketplace add <votre-compte>/socle-nest-hexagonal
claude plugin install socle-nest-hexagonal@socle-nest-hexagonal
```

## Utiliser

Dans un dépôt vide :

```
/socle-nest-hexagonal
```

Le skill pose cinq questions — nom, portée npm, titre, langue de la documentation, multi-tenance — puis fait le reste.

## Ce qu'il produit

**Un service qui démarre.** NestJS 11, TypeScript strict, monorepo pnpm + Turborepo. `GET /health` répond, Swagger UI est servi hors production, le document OpenAPI est **généré depuis les schémas Zod** avec un gate anti-dérive.

**Une architecture verrouillée par la machine.** Hexagonal ports & adapters, dépendances vers l'intérieur uniquement. Les frontières ne sont pas que documentées : `no-restricted-imports` les fait échouer au lint, et `check:arch` compile `domain/` + `application/` sans `infrastructure/` pour prouver que la règle d'or tient.

**Les ports techniques déjà câblés.** Journalisation, horloge et identifiants injectés par token — jamais un `new Logger()` ni un `new Date()` en dur. Gestion des erreurs de domaine avec un filtre global et une table code → statut HTTP livrée **vide**, accompagnée de sa procédure d'ajout.

**Une configuration qui refuse de mentir.** L'environnement est validé par Zod au démarrage, fail-fast, avec durcissement production. Les valeurs de développement sont committées et jamais injectées en production. Sous Vitest, le `.env` de la machine n'est pas chargé : les tests restent déterministes.

**Une méthode écrite.** Cinq documents qui font autorité : comment interroger un plan (grilling), quand écrire une ADR, comment nommer un document, comment concevoir un module profond, quels invariants la machine doit garantir.

**Une documentation structurée.** Tout sous `docs/`, trié par thème — ADR, architecture, métier, features. Nomenclature `<TRI>-<NNNN>-<slug>.md` avec registre de trigrammes, pour qu'une référence ne casse jamais au déplacement d'un fichier.

**L'outillage agent installé.** graphify avec ses hooks, les skills Matt Pocock et superpowers, et la configuration `docs/agents/` produite en invoquant `setup-matt-pocock-skills` — pas recopiée à la main.

**Neuf tickets.** Ce que le socle a délibérément laissé ouvert : modéliser le domaine, choisir l'hébergement, décider s'il y a un client, monter la couche base de données, l'authentification, le journal d'audit, le pare-feu CI, l'observabilité, le registre des règles métier. Chacun avec sa question, ses options et sa conséquence.

## Ce qu'il ne fait pas, volontairement

- **Aucune couche base de données.** Le schéma dépend d'un domaine qui n'existe pas encore.
- **Aucun front.** Le jour où un client naît, ses règles se reprennent en bloc.
- **Aucune décision d'hébergement**, donc `trust proxy` reste non configuré — le défaut d'Express échoue du bon côté, et poser un chiffre au hasard inventerait une topologie.
- **Aucune authentification implémentée.** Sa forme dépend du client : cookies pour un navigateur, jetons porteurs pour du mobile, signature de pass pour un portefeuille. La recette est écrite, elle attend la réponse.

## Structure

```
.claude-plugin/marketplace.json
plugins/socle-nest-hexagonal/
  .claude-plugin/plugin.json
  skills/socle-nest-hexagonal/
    SKILL.md                 le processus, en sept étapes
    references/
      CONTENU.md             inventaire des gabarits, avec le pourquoi de chacun
      methode/               les cinq documents de méthode
      api/                   règles impératives back + guide d'architecture
      adr/                   ARC-0001 nomenclature, ARC-0002 transactions (deux branches)
      squelette/             le code et la configuration à copier
      tickets/               les neuf tickets de ce qui reste à trancher
```

## Licence

MIT.
