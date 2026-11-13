# Critères de l'axe Ticket (liste fermée)

Le relecteur reçoit le **contexte du ticket** (`scripts/chaine/contexte-ticket.mjs <ID>` : le ticket, sa ligne de spec, ses règles — la ligne `Règles:` et chaque fichier de règle tel que le dépôt l'écrit — puis les identifiants cités ailleurs, chacun trouvé ou introuvable) et le **diff**. Il ne rend que des écarts rattachés à l'un de ces critères.

```text
T1  Surfaces prouvées — ticket § « Surfaces ». Chaque ligne de la table surface → test a son test
    dans le diff (nom de fichier ou de cas qui la désigne) ; une surface sans test, ou un test qui
    n'exerce pas la surface qu'il nomme, est un écart.
T2  Décisions tenues — ticket § « Décisions ». Chaque décision tranchée est dans le code ; une
    décision laissée à la fille « par défaut prudent » est prise, et notée sous ## Comments du
    ticket ; une décision contredite par le code est un écart.
T3  Règles citées et cas de bord — registre de règles, `.claude/rules/tests.md` § Règles. Chaque
    règle de la ligne `Règles:` du ticket (« Règles du ticket » du contexte ; à défaut de ligne,
    chaque règle que le ticket cite) a au moins un test qui porte son identifiant entre crochets
    en tête du nom (`[RULE_ALL_FAC-3]`), ou sur le `describe` qui le contient ; les cas de bord
    que la règle énonce (limite, zéro, dépassement, chevauchement, passage à minuit, montant nul
    ou négatif, doublon) ont chacun un cas ; un test qui porte un identifiant de règle qu'il ne
    prouve pas est un écart.
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
