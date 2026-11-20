# Décisions & glossaire — ADR, GLOSSARY.md, documentation vivante

Comment on écrit ce qui a été tranché. Trois artefacts, trois rôles distincts qu'il ne faut pas mélanger.

| Artefact                           | Répond à                       | Ne contient jamais                               |
| ---------------------------------- | ------------------------------ | ------------------------------------------------ |
| [`GLOSSARY.md`](../../GLOSSARY.md) | **que veut dire ce mot ?**     | de détail d'implémentation, de spec, de décision |
| [`docs/adr/`](../adr/)             | **pourquoi ce choix ?**        | de règle métier (elle va au registre)            |
| `docs/metier/regles/`              | **que doit faire le métier ?** | de justification technique                       |

---

## ADR — quand en écrire une

**Les trois critères doivent être vrais en même temps.** S'il en manque un, pas d'ADR.

1. **Difficile à défaire** — changer d'avis plus tard coûte réellement quelque chose.
2. **Surprenant sans le contexte** — un futur lecteur regardera le code et se demandera « mais pourquoi ont-ils fait ça ? ».
3. **Le fruit d'un vrai arbitrage** — il y avait des alternatives crédibles et on en a choisi une pour des raisons précises.

Si c'est facile à défaire, on le défera. Si ce n'est pas surprenant, personne ne se posera la question. S'il n'y avait pas d'alternative, il n'y a rien à consigner au-delà de « on a fait l'évidence ».

### Ce qui qualifie

- **Forme architecturale.** « C'est un monorepo. » « Le modèle d'écriture est event-sourcé, la lecture est projetée. »
- **Patterns d'intégration entre contextes.** « A et B communiquent par événements de domaine, pas par HTTP synchrone. »
- **Choix technologiques porteurs de lock-in.** Base de données, bus de messages, fournisseur d'identité, cible de déploiement. Pas chaque librairie — celles qu'il faudrait un trimestre pour remplacer.
- **Décisions de frontière et de périmètre.** « Les données du titulaire appartiennent au contexte X ; les autres n'y font référence que par identifiant. » **Les « non » explicites valent autant que les « oui ».**
- **Écarts délibérés au chemin évident.** « SQL manuel plutôt qu'un ORM, parce que X. » Tout ce dont un lecteur raisonnable supposerait le contraire — ça empêche le prochain ingénieur de « corriger » un choix délibéré.
- **Contraintes invisibles dans le code.** « Hébergement souverain obligatoire. » « Temps de réponse < 200 ms par contrat. »
- **Alternatives rejetées quand le rejet n'est pas évident.** Sinon on vous reproposera GraphQL dans six mois.

### Format — MADR simplifié

Format retenu : MADR simplifié. Le minimum viable d'une ADR est un paragraphe ; les sections ci-dessous ne se remplissent que quand elles apportent vraiment quelque chose.

```md
# <TRI>-<N> — <titre court de la décision>

- Statut : proposé | accepté | déprécié | remplacé par `<TRI>-<N>`
- Date : AAAA-MM-JJ
- Décideurs : <qui a tranché>
- Portée : <ce que ça engage>

## Contexte

<Le problème, les contraintes, ce qui rend le choix non évident.>

## Décision

<Ce qu'on a décidé. Impératif, pas descriptif.>

## Alternatives écartées

<Chacune avec la raison du rejet. C'est la section qui empêche de rejouer le débat.>

## Conséquences

**Positives** — …
**Coûts / négatives** — …
**Risques & parades** — <risque> → <parade>

## Notes d'implémentation

<Recette concrète, requêtes, extraits de config. Facultatif.>

## Liens

- ADR liées : …
- Sources : …
```

- **Nommage du fichier : `ADR_<CTX>_<TRI>-<n>-<slug>.md`** — le type `ADR`, le contexte (`ALL` pour une décision qui vaut partout), le trigramme du sujet, une séquence unique par type, contexte et trigramme. Règle complète et registre : [`nomenclature.md`](nomenclature.md). **Si le sujet n'a pas encore de trigramme, l'inscrire au registre avant de créer le fichier** — c'est une étape de la procédure, pas une exception. Une décision transverse porte le trigramme réservé `ARC` et vit à la racine de `docs/adr/` ; une décision rattachée à un sujet vit dans le sous-dossier de ce sujet. **`docs/adr/` n'a pas d'index** — le nom du fichier porte l'identité (`ADR_ALL_ARC-1`), lister le dossier suffit.
- **Créer `docs/adr/` paresseusement** : à la première ADR, pas avant.
- **Une ADR n'est jamais supprimée.** Elle est `dépréciée` ou `remplacée par`, avec sa raison.
- Le re-grilling d'une ADR ajoute une section `## Amendements du grill (JJ/MM/AAAA)` — voir [grilling.md](grilling.md#re-griller-ce-qui-a-déjà-été-décidé).

---

## GLOSSARY.md — le langage ubiquitaire

`GLOSSARY.md` est **un glossaire et rien d'autre**. Ce n'est ni une spec, ni un brouillon, ni un dépôt de décisions d'implémentation. Il est **totalement dépourvu de détail d'implémentation** — à une exception près, voulue par `ADR_ALL_ARC-4` : **l'entrée de chaque terme est son nom en code**, anglais et généraliste, suivi du libellé français affiché. C'est le seul pont entre le mot du métier et l'identifiant.

```md
# <Nom du contexte>

<Une ou deux phrases : ce qu'est ce contexte et pourquoi il existe.>

## Langage

**licence** — licence :
Le titre annuel délivré par la fédération à une personne physique.
_Éviter_ : carte, permis, adhésion

**holder** — titulaire :
La personne physique à qui une licence est délivrée.
_Éviter_ : utilisateur, compte, licencié
```

### Règles

- **Être tranchant.** Quand plusieurs mots existent pour le même concept, en choisir un et lister les autres sous `_Éviter_`.
- **Définitions serrées.** Une à deux phrases maximum. Définir ce que la chose **est**, pas ce qu'elle fait.
- **Seulement les termes propres au contexte de ce projet.** Les concepts génériques de programmation (timeout, type d'erreur, patterns utilitaires) n'y ont pas leur place, même si le projet les emploie massivement. Le test avant d'ajouter un terme : _est-ce un concept propre à ce contexte, ou un concept général de programmation ?_ Seul le premier entre.
- **Grouper sous des sous-titres** quand des grappes naturelles émergent. Si tout tient dans un domaine cohérent, une liste plate suffit.
- **Mise à jour en ligne, pendant la session** — jamais en lot après coup.

### Un ou plusieurs contextes

- Un seul `GLOSSARY.md` à la racine : cas par défaut.
- Plusieurs contextes → un `GLOSSARY-MAP.md` à la racine qui liste les contextes, où ils vivent, et **comment ils se relient** (quels événements traversent quelle frontière, quels types sont partagés). Les ADR système restent dans `docs/adr/` ; les ADR propres à un contexte vivent à côté de lui.

---

## Registre des règles métier

Distinct des ADR : une ADR dit **pourquoi une décision technique**, une règle dit **ce que le métier exige**. Une règle survit à un changement de stack ; une ADR non.

Décision et alternatives écartées : `ADR_ALL_ARC-<N>` (le registre, un fichier par règle). Le gabarit : `docs/agents/gabarits/regle.md`.

- **Une règle est un fichier** : `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`. Un en-tête YAML entre deux lignes `---`, validé par un schéma, puis l'énoncé en markdown libre : aussi long qu'il faut, avec ses précisions datées (`_(précisée le 24/09 : …)_`) et ses passages barrés. Le contexte `all/` existe toujours. Les champs de l'en-tête sont en anglais ; la prose est dans la langue du projet.
- **L'identifiant est stable** : `RULE_<CTX>_<TRI>-<n>`, attribué dans l'ordre par `node scripts/docs/next-id.mjs RULE <CTX> <TRI>`, jamais réutilisé, jamais renommé ([`nomenclature.md`](nomenclature.md)). Le trigramme vient du registre des trigrammes.
- **Deux statuts.** La `validation` est écrite par un humain : `candidate`, `validated`, `rejected`, `obsolete`, avec `date`, `by` (qui a tranché, par son nom) et `reason` pour un rejet ou une obsolescence. Aucune machine n'écrit `validated`. La **réalisation** n'est jamais écrite : elle est calculée depuis les tests (`proven` avec son niveau P0, P1 ou P2), depuis les clés de configuration déclarées (`configured`), sinon `to-build`. Deux exceptions s'écrivent à la main dans le champ `exception`, avec leur raison : `not-applicable` et `contradiction`.
- **Une règle n'est jamais supprimée** : elle devient `rejected` ou `obsolete`. Cycle complet : [grilling.md](grilling.md#cycle-de-validation--la-machine-ne-valide-jamais).
- **Un test qui prouve une règle porte son identifiant entre crochets en tête de son nom** : `it('[RULE_ALL_LIC-2] <comportement>', …)`, en français comme tout nom de test. Plusieurs étiquettes par test sont permises. C'est le lien vérifiable entre le registre et le code ; un test de recette n'en porte jamais ([`.claude/rules/tests.md`](../../.claude/rules/tests.md)).
- **Les liens entre règles sont typés et déclarés** dans l'en-tête (`links`) : `replaces`, `refines`, `contradicts`, `parameterized-by`, `blocked-by`. Une règle de contexte qui instancie une règle de socle le dit par `instanceOf`, et hérite de ses preuves tant qu'elle n'en a pas en propre. Les liens par simple citation sont déduits par la machine, jamais écrits.
- **Les sources et les décisions** sont des listes : `sources` (référence, chemin, horodatage), `decisions` (date, texte, qui). Les noms des personnes s'écrivent : on sait qui a dit quoi.
- **Les fichiers de code d'une règle** s'écrivent dans `code` (facultatif, chemins depuis la racine du dépôt) : c'est un champ du standard, et le périmètre de la mutation par règle (`socle-tests`). Un chemin qui n'existe pas est refusé par `anchorpost check`.
- **Les champs propres à un projet** (une estimation, un chantier) vivent sous `extensions`, que le schéma laisse passer et qu'Anchorpost ignore.
- Les questions non arbitrées vivent dans `docs/questions-ouvertes.md`, datées et sourcées. Une question dont la ligne `Bloque :` cite une règle la marque « a une question ouverte », sans toucher à ses statuts.
- **Aucun annuaire écrit à la main.** La vue d'ensemble d'un registre est l'index généré `anchorpost/anchorpost.json`, qui porte pour chaque règle ses statuts, ses liens et les tests qui la prouvent.

---

## Documentation vivante — trois couches

Principe directeur, non négociable :

> **La fraîcheur de la documentation ne peut pas reposer sur la vigilance humaine.** Ce qui est dérivable du code est régénéré et vérifié par la machine ; ce qui relève du jugement est écrit par un humain, éventuellement assisté, jamais auto-mergé.

| Couche                      | Contenu                                   | Change comment        | Automatisation                                |
| --------------------------- | ----------------------------------------- | --------------------- | --------------------------------------------- |
| **1 — Généré déterministe** | ERD, contrats OpenAPI, graphe de modules  | fonction pure du code | **régénéré + vérifié en CI** (gate doc-drift) |
| **2 — Narratif**            | ADR, docs de domaine, runbooks, glossaire | décision humaine      | **assisté** en PR (propose, un humain valide) |
| **3 — Assemblage visuel**   | Anchorpost, qui lit l'index `anchorpost/anchorpost.json` (couche 1) et les documents du manifeste (couche 2) | lecture à chaque push | aucun calcul côté site : il lit l'index commis |

- Les générateurs de la couche 1 doivent être **déterministes** (tri stable, aucun horodatage dans la sortie) — sinon le gate clignote et on apprend à l'ignorer.
- **Jamais d'auto-merge de prose.** Un LLM _propose_, il ne _décide_ pas. Une seule exception, décidée par le produit : la criticité d'une règle, ses cas attendus et ses réponses aux dix familles sont fixés par un agent (skill `criticite`, sous-agent en contexte vierge) ; l'humain les revoit après coup et les corrige par une PR ; un agent peut monter un niveau, jamais le baisser. De la doc narrative auto-générée sans relecture produit du plausible-mais-faux, noie le signal et érode la confiance.
- **Une doc qui vit ailleurs que le dépôt est une doc qui ment.** Un SaaS de doc (Notion, Confluence) reste une vitrine de diffusion, jamais la source de vérité.
- **Public cible : la reprise.** La page d'accueil de la doc est une porte d'entrée « reprendre ce projet », pas un sommaire. L'objectif : qu'une équipe qui reprend dans deux ou trois ans comprenne _pourquoi_ chaque choix a été fait sans rejouer les débats.
- **Garde-fou données personnelles** : ne jamais envoyer de PII ni de fixture à données personnelles à un assistant LLM. Le contexte se limite au diff de code et aux docs techniques.

---

## Écrire pour un agent

Ces documents sont lus par un agent autant que par un humain. Repris de `mattpocock-skills:writing-for-agents`.

- **Une seule source de vérité par sens.** La duplication coûte en maintenance, en tokens, et gonfle artificiellement l'importance d'une règle.
- **L'environnement est une source de vérité.** Un document qui recopie `package.json` ou l'arborescence est un **cache** : il ne se justifie que si la recherche est coûteuse. Cacher ce que l'agent ne peut pas trouver en regardant — la convention non écrite, la raison d'un choix, le piège qu'aucune config n'avoue. Laisser les recherches à un fichier / une commande à l'environnement, où elles ne peuvent pas périmer.
- **Chasser les no-ops.** Une instruction que le modèle suit déjà par défaut paie du contexte pour ne rien dire. Le test : _est-ce que ça change le comportement par rapport au défaut ?_ Quand une phrase échoue, supprimer la phrase entière plutôt que la raboter.
- **Formuler au positif.** Interdire ramène le comportement interdit dans le contexte et le rend _plus_ disponible. Dire la cible (« logger via le port injecté ») plutôt que l'interdit seul. Une interdiction ne se justifie qu'en garde-fou dur — et même là, l'accompagner de la cible positive.
- **Divulgation progressive.** Ce dont toutes les branches ont besoin reste en ligne ; ce qu'une seule branche atteint part derrière un pointeur. L'échec typique est le **sprawl** : un document trop long, même sans une ligne morte — l'attention s'y dilue.
- **Co-localiser.** Définition, règles et pièges d'un même concept sous un même titre, plutôt qu'éparpillés.
