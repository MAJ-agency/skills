# Critères de l'axe Documentation (liste fermée)

Le relecteur reçoit le **diff** et lit la documentation du dépôt. Il ne rend que des écarts rattachés à l'un de ces critères. Les chemins sont des rôles : le glossaire du projet (`GLOSSARY.md`, ou `CONTEXT.md`), le registre de règles (`docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md`), les ADR (`docs/adr/` ou `docs/architecture/adr/`).

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
```
