# Critères de l'axe Ticket (liste fermée)

Le relecteur reçoit le **contexte du ticket** (`scripts/chaine/contexte-ticket.mjs <ID>` : le ticket, sa ligne de spec, les règles et ADR cités tels que le dépôt les écrit) et le **diff**. Il ne rend que des écarts rattachés à l'un de ces critères.

```text
T1  Surfaces prouvées — ticket § « Surfaces ». Chaque ligne de la table surface → test a son test
    dans le diff (nom de fichier ou de cas qui la désigne) ; une surface sans test, ou un test qui
    n'exerce pas la surface qu'il nomme, est un écart.
T2  Décisions tenues — ticket § « Décisions ». Chaque décision tranchée est dans le code ; une
    décision laissée à la fille « par défaut prudent » est prise, et notée sous ## Comments du
    ticket ; une décision contredite par le code est un écart.
T3  Règles citées et cas de bord — registre de règles, `.claude/rules/tests.md` § Règles. Chaque
    règle que le ticket cite (`Règles:`, `RULE_ALL_FAC-3`) a au moins un test qui porte son
    identifiant entre crochets en tête du nom (`[RULE_ALL_FAC-3]`) ; les cas de bord que la règle énonce (limite, zéro, dépassement, chevauchement,
    passage à minuit, montant nul ou négatif, doublon) ont chacun un cas ; un test qui porte un
    identifiant de règle qu'il ne prouve pas est un écart.
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
```
