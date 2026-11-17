# Critères de l'axe Documentation (liste fermée)

Le relecteur reçoit le **diff**, et la section `## Criticité` du corps de la PR quand elle existe, et lit la documentation du dépôt. Il ne rend que des écarts rattachés à l'un de ces critères. Les chemins sont des rôles : le glossaire du projet (`GLOSSARY.md`, ou `CONTEXT.md`), le registre de règles (`docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`), les ADR (`docs/adr/` ou `docs/architecture/adr/`).

```text
D1  Glossaire — ADR_ALL_ARC-4 / langue des identifiants. Un terme du domaine nouveau dans le code (entité,
    value object, table, champ de contrat) a son entrée au glossaire avec son nom en code ; un
    identifiant qui ne correspond à aucune entrée est un écart.
D2  Registre de règles — docs/methode/decisions.md. Une règle métier nouvelle ou précisée par le
    code est au registre, avec sa source et son statut ; une règle écrite seulement dans un
    commentaire ou un test est un écart.
D3  ADR — docs/methode/decisions.md. Une décision structurante (nouvelle table hors règle commune,
    port nouveau, divergence avec un CLAUDE.md) a son ADR, ou le diff cite celle qui la couvre ;
    une divergence silencieuse est un écart.
D4  Index générés — scripts/docs/index-generes.json. Tout fichier généré touché par le diff est
    régénéré par sa commande, jamais édité ; un contrat Zod changé vient avec l'OpenAPI régénéré.
D5  Fiches et README — CLAUDE.md, README.md, .claude/rules/. Une commande, un script, une variable
    d'environnement ou un gate nouveau est nommé là où un humain ou un agent le cherchera
    (README § commandes, .env.example, fiche de règles concernée).
D6  Ticket et spec — docs/agents/issue-tracker.md. Le ticket et la spec reflètent ce qui a été
    fait : statut, décisions par défaut sous ## Comments, question ouverte dans
    docs/questions-ouvertes.md si une a surgi.
D7  Commentaires de code — ADR_ALL_ARC-4. Un commentaire dit le pourquoi, en français ; un commentaire qui
    paraphrase le code, ou un TODO sans ticket, est un écart.
D8  Criticité — skill criticite. Seulement si l'index commis du projet, anchorpost/anchorpost.json,
    porte "schema": "3" : le relecteur le lit dans l'index, jamais dans ce que dit la PR. Tout diff
    qui crée un fichier de règle ou change son énoncé, qui écrit ou change criticality, cases ou
    notApplicableFamilies dans un fichier de règle, ou qui retire une règle d'une ligne `Règles:`
    (spec ou ticket), a sa section « Criticité » dans la description de la PR : pour chaque règle,
    la commande exacte jouée depuis la racine du projet, sans variable d'environnement devant, puis
    chaque sortie brute de sous-agent, dans l'ordre (ou le lien du commentaire de la PR qui les
    porte), ou la raison écrite du geste. Écart bloquant : un tel geste sans sortie de sous-agent ni
    raison écrite ; un niveau écrit sous le plus haut niveau rendu validement ; une criticité low
    dont la raison est une raison de procédure, ou ne dit pas pourquoi une erreur serait sans
    conséquence durable ; un `by` autre que `agent` dans la PR d'un agent ; un cas rendu disparu, ou
    qui a changé de kind, de scope ou de sens, ou un « sans objet » ajouté, sans sa raison écrite
    dans la section.
    Une famille que le sous-agent laisse en question, listée dans la section avec sa question, n'est
    pas un écart ; une famille sans cas, sans « sans objet » et sans question listée reste
    bloquante.
```
