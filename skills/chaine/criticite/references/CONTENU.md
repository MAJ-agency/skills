# Ce que contient le skill criticite, et pourquoi

## `SKILL.md`

Le geste de la session qui crée une règle ou change son énoncé : vérifier que l'index Anchorpost du projet est au pivot 3, sinon s'arrêter ; fabriquer le message du sous-agent par le script, le lancer, tracer la commande et chaque sortie brute dans la PR, la retenir ou la corriger, l'écrire dans le fichier de la règle. Décision du produit, citée en tête : la criticité est fixée par un agent, en contexte vierge, au moment où la règle s'écrit et avant tout code ; l'humain revoit les niveaux dans Anchorpost et corrige par une PR. Les garde-fous (jamais « basse » sans raison, le niveau supérieur dans le doute, un agent écrit toujours `by: agent` et ne baisse jamais, une criticité fixée par une personne ne se réécrit pas, la commande et chaque sortie brute dans la section « Criticité » de la PR, deux sorties hors format qui donnent le plus haut niveau apparu, jamais « à classer ») sont les parades de cette décision. Le sous-agent se lance par l'agent défini `maj-skills:classeur-de-criticite` (dossier `agents/` du plugin) : aucun outil, Opus, et un contexte sans le `CLAUDE.md` ni les fiches `.claude/rules/` de la session ; sans lui, l'agent générique recevait ces consignes à côté du message, un écart aux mots du produit (« ne connaît que l'énoncé de la règle, sa spec et les définitions »). Une session partie d'un instantané du plugin antérieur à 8.4.0 n'a pas la définition : elle relance le même message, entier, par l'agent générique et le dit dans la section `## Criticité`, où chaque sortie brute porte l'agent qui l'a rendue. Le skill ne pose rien dans le projet : son script se lance depuis le dossier du skill.

## `scripts/contexte-regle.mjs`

Fabrique le message du sous-agent à partir du seul identifiant de la règle : il trouve lui-même le fichier de la règle et les specs qui la portent (par leur ligne `Règles:` ou par celle d'un de leurs tickets, `Règles:` ou `Prouve:`), et rend le prompt exact, l'énoncé (le titre sur sa seule ligne et le corps, sans BOM, en-tête YAML ni commentaires HTML) et chaque spec, copiée au mot près, ses commentaires (HTML, ou ligne `[//]: # (…)`) retirés ; au-delà de 300 000 caractères, chaque spec réduite à son en-tête et aux sections qui citent la règle, et le refus seulement si le message passe encore le plafond. Le script choisit l'entrée, pas la session : elle ne peut ni réécrire l'énoncé, ni choisir ou tronquer une spec, ni glisser un mot sur le niveau voulu. Il est autonome : il n'importe aucun script du projet, se lance depuis le dossier du skill et lit la racine du projet dans le dossier courant, sans variable d'environnement. Il ne suit aucun lien symbolique, refuse un nom de fichier à caractère de contrôle, un en-tête annoncé mais illisible et un contexte de plus de 300 000 caractères, et ignore, en la nommant, une spec sans identifiant lisible. Son banc, `contexte-regle.test.mjs`, joue la règle et ses specs trouvées, la règle introuvable, les liens symboliques, les noms à caractère de contrôle, la casse du nom, le BOM, le titre plié ou illisible, l'en-tête et les commentaires retirés, la spec identique octet pour octet, le tri des specs au-delà du plafond, la règle sans en-tête, « aucune spec ne déclare cette règle ».

## `references/prompt.md`

Le prompt exact du sous-agent, à liste fermée, sur le modèle de la revue adversariale. Il ne reçoit que l'énoncé de la règle et la spec qui la porte (ou, au-delà du plafond, son extrait : en-tête et sections qui citent la règle, que le message nomme), qu'il lit comme des données, et n'utilise aucun outil. La définition retire déjà les outils ; la phrase du prompt reste pour le repli, où l'agent générique les a tous. Le format de sortie est l'en-tête à écrire, pour que la session le relise sans le récrire. Une puce du prompt dit ce qu'est un extrait : un silence de l'extrait n'est pas une réponse, la situation qu'il ne tranche pas va dans « Questions ».

Les définitions sont copiées des règles d'Anchorpost, qui fixent le standard, le 2026-11-17 :

- les trois niveaux : `RULE_ALL_ANC-24` ;
- les quatre genres de cas : `RULE_ALL_ANC-26` ;
- la portée, métier ou technique : `RULE_ALL_ANC-27` ;
- ce qu'une règle doit déclarer selon son niveau, et les dix familles : `RULE_ALL_ANC-28`.

Une famille peut rester en question : un essai réel du skill, joué sur une règle d'exemple, a rendu 20 à 26 cas, différents d'une passe à l'autre, dont des comportements que ni l'énoncé ni la spec ne portaient ; le prompt ne fabrique donc pas de réponse à une famille que les textes ne tranchent pas.

Quand l'une de ces règles est amendée, la copie se met à jour par un ticket du plugin. Aucun projet n'a aujourd'hui ses propres niveaux : le prompt n'a pas de place pour d'autres définitions.
