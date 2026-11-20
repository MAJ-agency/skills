# Critères de l'axe Ticket (liste fermée)

L'axe reçoit le **contexte du ticket** (`scripts/chaine/contexte-ticket.mjs <ID>`, joué sur l'arbre à part : le ticket, sa ligne de spec, ses règles — la ligne `Règles:` et chaque fichier de règle tel que le dépôt l'écrit, en-tête YAML compris — puis les identifiants cités ailleurs, chacun trouvé ou introuvable) et le **diff**, et lit dans l'index commis du projet, `anchorpost/anchorpost.json` de l'arbre à part, s'il existe, le champ `schema` et l'entrée `rules` de chaque règle du ticket. Il ne rend que des écarts rattachés à l'un de ces critères. Tout écart est un constat **bloquant** ; ce que le dépôt ne permet pas de trancher est un **doute**.

Ce bloc est celui du skill `revue-de-ticket` (régime 7), mot pour mot, à sept réécritures près, que `scripts/relecture.test.mjs` tient : le sous-agent s'y nomme « l'axe » (trois réécritures), « la section de PR » devient « le verdict », un index que le diff n'a pas régénéré est régénéré par son auteur, la session de relecture ne modifiant rien, et la fiche `.claude/rules/tests.md` se lit sur la base (deux réécritures) : l'arbre à part ne porte aucun fichier de `.claude/`, et une PR ne peut pas affaiblir la règle qui la juge ; ce qu'elle y change est dans le diff.

```text
T1  Surfaces prouvées — ticket § « Surfaces ». Chaque ligne de la table surface → test a son test
    dans le diff (nom de fichier ou de cas qui la désigne) ; une surface sans test, ou un test qui
    n'exerce pas la surface qu'il nomme, est un écart.
T2  Décisions tenues — ticket § « Décisions ». Chaque décision tranchée est dans le code ; une
    décision laissée à la fille « par défaut prudent » est prise, et notée sous ## Comments du
    ticket ; une décision contredite par le code est un écart.
T3  Règles citées et leurs preuves — registre de règles, `.claude/rules/tests.md` de la base § Règles. Les
    règles sont celles de la ligne `Règles:` du ticket (« Règles du ticket » du contexte ; à défaut
    de ligne, chaque règle que le ticket cite). Deux branches, choisies règle par règle, quelle
    que soit la criticité de la règle.
    Branche « cas déclarés » — seulement si l'index commis du projet, anchorpost/anchorpost.json,
    porte "schema": "3" (l'axe lit ce champ dans l'index, jamais dans ce que disent le
    ticket ou la PR) et si l'en-tête de la règle, rendu dans « Règles du ticket », déclare au
    moins un cas sous `cases`. L'axe ne recompte pas les cas, la CLI Anchorpost le fait :
    elle écrit `proven: false` sur chaque cas déclaré qui n'a pas sa preuve au niveau exigé. Il
    vérifie ce que la machine ne juge pas, (a) à (c), sur chaque test du diff qui porte
    l'étiquette d'un cas de la règle (`[RULE_ALL_FAC-3#montant-nul]` : l'identifiant de la règle,
    `#`, celui du cas ; portée par un `describe`, elle vaut pour les tests qu'il contient) et sur
    chaque preuve que l'entrée de la règle range dans un fichier de cas, puis il lit ce que la
    machine a compté, (d), dans l'entrée de la règle sous `rules` de l'index de la branche relue
    (par sa `key`) :
    (a) ce que le test affirme correspond au titre du cas : l'axe lit l'assertion, pas le
        nom ; un test étiqueté d'un refus qui n'affirme pas le refus est un écart ; une preuve
        écrite dans un fichier de cas (`cas/*.json`, entrées `regle` et `cas`) n'affirme rien si
        aucun test du diff ou du dépôt ne lit ce fichier : c'est un écart ;
    (b) le genre de test convient au code que le cas exerce, selon les catégories de
        `.claude/rules/tests.md` de la base : un calcul pur se prouve par un test unitaire, et par un test
        de propriétés s'il porte un invariant chiffré ; une requête, par un test sur base réelle,
        jamais sur une base simulée ; un refus ou une entrée invalide d'une règle moyenne ou
        haute (`criticality.level` de l'entrée vaut `medium` ou `high`), exigés à la frontière de
        l'API (niveau `P1`), par un test qui passe par la route ; le cas normal d'une règle haute
        (`high`), exigé de bout en bout (niveau `P2`), par un vrai parcours. Le niveau exigé, la
        CLI le compte ; le niveau qu'elle donne à un test se lit dans `proofs[].level` de
        l'entrée : un test qui porte un niveau qu'il n'a pas (un `P1` qui ne passe pas par la
        route, un `P2` qui n'est pas un parcours) est un écart ;
    (c) un cas dit technique l'est vraiment : chaque cas `scope: technical` qu'un test du diff
        étiquette, ou que le diff ajoute ou modifie dans le fichier de la règle, est une situation
        que seule l'équipe voit (une saisie vide, un doublon, deux actions simultanées) ; s'il est
        une décision du métier (un refus, une exception que la MOA reconnaîtrait), c'est un
        écart : il échappe à la validation de la MOA ;
    (d) ce que la CLI a compté : une de ces règles dont un cas de `cases` porte `proven: false`
        est un écart, quel que soit `realisation.status` (`partial` si elle a des preuves,
        `to-build` ou `configured` si elle n'en a aucune : `proofs` est alors vide) ;
        `missing.reason` dit pourquoi : `no-proof`, aucune preuve ne nomme le cas, ou
        `level-too-low`, ses preuves sont d'un niveau trop bas. L'axe ne refait pas le
        compte : il lit celui de l'index. L'écart ne tombe que pour un cas qu'un autre ticket
        porte, aux cinq conditions réunies : le ticket relu nomme ce ticket ; il est « trouvé »
        dans « Identifiants cités » du contexte, sans « (archivé) », et n'est pas le ticket
        relu ; il est ouvert, son `Status:` n'est ni `Fait` ni `wontfix` ; sa ligne `Règles:` cite
        la règle ; ni la mention ni cette ligne `Règles:` ne sont ajoutées par le diff relu. L'axe
        rend alors « cas <règle>#<id> porté par <ticket> », pour le verdict. Un
        index que le diff n'a pas régénéré est un écart de T5, pour le seul index que (d) lit : son
        auteur le régénère par sa commande. Ses signes : une de ces règles absente de
        `rules` ; un test étiqueté du diff dont le titre manque aux `proofs` de la règle ; des
        `id` de cas qui diffèrent entre l'en-tête de la règle et son entrée.
    Un cas de bord que l'énoncé de la règle dit et qu'aucun cas de `cases` ne porte est un écart,
    et qu'une famille soit dite sans objet n'y change rien : le cas se dit, la session ne l'écrit
    pas elle-même ; son test, étiqueté de la règle sans nom de cas, est dû dans le diff.
    Un test qui porte un identifiant de règle, avec ou sans cas, qu'il ne prouve pas est un écart.
    Branche « sans cas déclarés » — toute autre règle : index absent ou d'un autre schéma, ou
    en-tête sans aucun cas sous `cases`. La règle a au moins un test qui porte son identifiant
    entre crochets en tête du nom (`[RULE_ALL_FAC-3]`), ou sur le `describe` qui le contient ;
    les cas de bord que la règle énonce (limite, zéro, dépassement, chevauchement, passage à
    minuit, montant nul ou négatif, doublon) ont chacun un cas ; un test qui porte un identifiant
    de règle qu'il ne prouve pas est un écart.
T4  Où — ticket § « Où ». Les fichiers que le ticket nomme sont ceux que le diff touche ; un
    fichier du diff hors de « Où » est justifié dans la PR ou retiré ; l'appelant réel cité
    (route, listener, cron) appelle bien la fonction.
T5  Vérification — ticket § « Vérification ». Les commandes ciblées du ticket ont un équivalent
    vert dans le diff (specs nommées présentes, index régénérés, specs de garde complétées).
T6  Périmètre — spec. Rien dans le diff au-delà du ticket : un ticket voisin commencé, une
    refactorisation hors sujet, une dépendance ajoutée que le ticket ne prévoit pas.
T7  Statut — docs/agents/issue-tracker.md. Le ticket porte `Status: Fait — PR #<n>` (ou
    `en cours — <branche>` si la PR n'est pas encore ouverte) et ses décisions par défaut sous
    ## Comments, datées.
T8  Recette d'un service tiers — cas vécu : anchorpost PR 74. Un test de recette ou un script
    qui pilote un service tiers (API, CLI, console) a sous ## Comments du ticket la page de
    documentation du fournisseur qui fonde chaque appel, lue à la date de la branche ; une recette
    sans cette référence, ou avec une référence plus ancienne que la branche, est un écart.
T9  Essai d'une réécriture de dépôt — cas vécu : anchorpost, vague 8 (ticket .39). Un diff qui
    réécrit les fichiers d'un dépôt (codemod, migration de convention, script de la chaîne qui
    modifie un projet) a sous ## Comments du ticket l'essai fait sur une copie d'un dépôt réel :
    le dépôt, son commit, la commande et ce qu'elle a changé ; un essai sur un dépôt jouet seul
    est un écart.
```

**Qui joue `T3`.** L'axe Ticket de la session de relecture, pour toutes les criticités. Ce paragraphe reste hors du bloc : le sous-agent de l'axe Ticket ne reçoit que le bloc, et ne saute aucune règle pour sa criticité.
