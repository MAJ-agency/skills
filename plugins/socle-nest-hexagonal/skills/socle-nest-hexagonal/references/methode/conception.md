# Conception — modules profonds, TDD, revue

Vocabulaire et règles de conception, en amont des règles d'architecture impératives ([`apps/api/CLAUDE.md`](../../apps/api/CLAUDE.md)). L'hexagonal dit _où_ mettre le code ; ce document dit _quelle forme_ lui donner.

Sources : `mattpocock-skills:codebase-design`, `mattpocock-skills:tdd`, `mattpocock-skills:code-review`.

---

## Modules profonds

L'objectif : **beaucoup de comportement derrière une petite interface**, posée sur une couture propre, testable à travers cette interface.

### Glossaire — employer ces termes exactement

Ne pas substituer « composant », « service », « API », « boundary ». La cohérence du vocabulaire _est_ l'intérêt.

**Module** : tout ce qui a une interface et une implémentation. Délibérément agnostique à l'échelle : une fonction, une classe, un package, une tranche traversant les couches. _Éviter_ : unité, composant, service.

**Interface** : tout ce qu'un appelant doit savoir pour utiliser le module correctement — la signature de type, mais aussi les invariants, les contraintes d'ordre, les modes d'erreur, la configuration requise, les caractéristiques de performance. _Éviter_ : API, signature (trop étroits : ils ne désignent que la surface de types).

**Implémentation** : ce qu'il y a dans le module, son corps de code. Distinct d'**adapter** : une chose peut être un petit adapter avec une grosse implémentation (un repository Postgres) ou un gros adapter avec une petite implémentation (un faux en mémoire).

**Profondeur** : le levier à l'interface. La quantité de comportement qu'un appelant (ou un test) peut exercer par unité d'interface qu'il doit apprendre. Un module est **profond** quand beaucoup de comportement tient derrière une petite interface ; **plat** quand l'interface est presque aussi complexe que l'implémentation.

**Couture** _(seam, Michael Feathers)_ : un endroit où l'on peut altérer le comportement sans éditer à cet endroit ; le _lieu_ où vit l'interface d'un module. Où poser la couture est une décision de conception à part entière, distincte de ce qu'on met derrière. _Éviter_ : « frontière » (surchargé par le bounded context du DDD).

**Adapter** : une chose concrète qui satisfait une interface à une couture. Décrit un _rôle_ (quelle case il remplit), pas une substance.

**Levier** : ce que les appelants gagnent à la profondeur. Une implémentation se rembourse sur N sites d'appel et M tests.

**Localité** : ce que les mainteneurs gagnent à la profondeur. Le changement, les bugs, la connaissance et la vérification se concentrent en un seul endroit. Corrigé une fois, corrigé partout.

### Principes

- **La profondeur est une propriété de l'interface, pas de l'implémentation.** Un module profond peut être composé en interne de petites parties mockables et remplaçables ; elles ne font simplement pas partie de son interface. Un module peut avoir des **coutures internes** (privées à son implémentation, utilisées par ses propres tests) en plus de la **couture externe** à son interface.
- **Le test de suppression.** Imaginer que le module disparaît. Si la complexité s'évapore, c'était un passe-plat. Si elle réapparaît chez N appelants, il gagnait sa vie.
- **L'interface est la surface de test.** Appelants et tests franchissent la même couture. Si tu veux tester _au-delà_ de l'interface, le module a probablement la mauvaise forme.
- **Un adapter, c'est une couture hypothétique. Deux adapters, c'est une vraie.** Ne pas introduire de couture tant que rien ne varie réellement en travers.

Face à une interface, se demander : puis-je réduire le nombre de méthodes ? simplifier les paramètres ? cacher plus de complexité à l'intérieur ?

### Concevoir pour la testabilité

1. **Accepter ses dépendances, ne pas les créer.** `traiter(demande, passerelle)` plutôt que `new Passerelle()` à l'intérieur.
2. **Retourner des résultats, ne pas produire d'effets de bord.** `calculerRemise(panier): Remise` plutôt que `appliquerRemise(panier): void`.
3. **Petite surface.** Moins de méthodes = moins de tests. Moins de paramètres = préparation de test plus simple.

### Cadrages rejetés

- **La profondeur comme ratio lignes-d'implémentation / lignes-d'interface** (Ousterhout) : ça récompense le gonflement de l'implémentation. On utilise la profondeur-comme-levier.
- **« Interface » au sens du mot-clé TypeScript `interface`** ou des méthodes publiques d'une classe : trop étroit — ici, l'interface inclut tout fait qu'un appelant doit connaître.

---

## TDD — la boucle rouge → vert

### Ce qu'est un bon test

Un test vérifie un **comportement** à travers une interface publique, pas un détail d'implémentation. Le code peut changer entièrement ; les tests, non. Un bon test se lit comme une spécification.

À l'exploration du code, lire [`CONTEXT.md`](../../CONTEXT.md) pour que les noms de tests et le vocabulaire des interfaces collent au langage du domaine, et respecter les ADR de la zone touchée.

### Où vont les tests : les coutures

Les tests vivent **aux coutures**, jamais contre les internes.

**Ne tester qu'à des coutures convenues d'avance.** Avant d'écrire le moindre test, écrire les coutures sous test et les **confirmer avec l'utilisateur**. Aucun test n'est écrit à une couture non confirmée. On ne peut pas tout tester : convenir des coutures en amont, c'est ainsi que l'effort de test atterrit sur les chemins critiques et la logique complexe, au lieu de chaque cas limite.

La question : « quelle est l'interface publique, et quelles coutures testons-nous ? »

### Anti-patterns

- **Couplé à l'implémentation** : mocke des collaborateurs internes, teste des méthodes privées, ou vérifie par un canal détourné (interroger la base plutôt que passer par l'interface). Le signe : le test casse au refactoring alors que le comportement n'a pas bougé.
- **Tautologique** : l'assertion recalcule la valeur attendue de la même façon que le code (`expect(add(a, b)).toBe(a + b)`, un snapshot dérivé à la main de la même manière). Il passe par construction et ne peut jamais contredire le code. **La valeur attendue doit venir d'une source de vérité indépendante** : un littéral connu-bon, un exemple travaillé, la spec.
- **Découpage horizontal** : écrire tous les tests puis toute l'implémentation. Des tests en lot vérifient du comportement _imaginé_ : on teste la _forme_ des choses plutôt que le comportement visible, les tests deviennent insensibles aux vrais changements, et on se verrouille sur une structure de test avant d'avoir compris l'implémentation. Travailler en **tranches verticales** : un test → une implémentation → on recommence, chaque test étant une **balle traçante** qui répond à ce que le cycle précédent a appris.

### Règles de la boucle

- **Rouge avant vert.** Écrire le test qui échoue d'abord, puis juste assez de code pour le faire passer. Ne pas anticiper les tests futurs ni ajouter de fonctionnalité spéculative.
- **Une tranche à la fois.** Une couture, un test, une implémentation minimale par cycle.
- **Le refactoring ne fait pas partie de la boucle.** Il appartient à l'étape de revue, pas au cycle rouge → vert.

---

## Revue — deux axes

Une revue de code se lit sur deux axes indépendants, rendus côte à côte :

1. **Standards** — le code respecte-t-il les règles documentées de ce dépôt ? (`apps/api/CLAUDE.md`, les ADR, ce document.)
2. **Spec** — le code fait-il ce que la demande d'origine demandait ? Ni moins (scope raboté), ni plus (scope élargi en douce).

Un écart sur l'axe Standards est une dette ; un écart sur l'axe Spec est un malentendu. Les deux se corrigent différemment — d'où l'intérêt de ne pas les mélanger dans une liste unique.

**Recevoir une revue** demande de la rigueur, pas de l'acquiescement : vérifier techniquement chaque remarque avant de l'appliquer. Une remarque fausse s'argumente ; une remarque juste s'applique sans cérémonie.
