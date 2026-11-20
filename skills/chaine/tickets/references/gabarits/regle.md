---
id: RULE_{{CTX}}_{{TRI}}-{{n}}
title: {{Le titre de la règle, en une ligne, sans point final}}
validation:
  status: candidate # candidate | validated | rejected | obsolete — seul un humain écrit validated
  # date: AAAA-MM-JJ        obligatoire dès que le statut n'est plus candidate
  # by: Prénom Nom          qui a tranché, par son nom
  # reason: …               obligatoire pour rejected et obsolete
# exception: { status: not-applicable | contradiction, reason: … }   les deux seuls états de réalisation écrits à la main
# epics: [ {{id-du-module}} ]   les modules (EPIC du manifeste) de la règle ; en plus, le module des specs qui la déclarent en `Règles:` ; sans aucun, la règle est « sans module » (un domaine ne donne pas de module ; CLI ≥ 1.2.0)
# instanceOf: RULE_ALL_{{TRI}}-{{m}}   la règle de socle que cette règle instancie ; elle hérite de ses preuves tant qu'elle n'en a pas en propre
sources:
  - { ref: {{réunion du AAAA-MM-JJ, document, grilling et numéro de question}}, path: {{docs/metier/reunions/…}}, at: {{horodatage ou section}} }
# decisions:
#   - { date: AAAA-MM-JJ, text: …, by: Prénom Nom }
# links:
#   - { type: refines | replaces | contradicts | parameterized-by | blocked-by, target: RULE_{{CTX}}_{{TRI}}-{{m}} }
# config:
#   - { key: {{clé.de.configuration}}, value: {{valeur attendue}} }   une règle qui déclare des clés et n'a pas de test est « configurée »
# code: [ apps/api/src/…/fichier.ts ]   fichiers de code qui réalisent la règle, chemins depuis la racine ; périmètre de la mutation par règle (`socle-tests`)
# criticality:   à partir de l'index au pivot 3 (CLI Anchorpost 2.0.0) ; en bloc, une clé par ligne, que nul formateur ne replie ; la forme nue (criticality: high) est celle d'avant, qu'on n'écrit plus ; fixée par le skill `criticite` à l'écriture de la règle, avant tout code ; un agent écrit toujours by: agent, une clé de `roles` du manifeste n'est écrite que par la personne elle-même ; reason obligatoire pour low ; un agent ne la baisse jamais
#   level: medium # low | medium | high
#   by: agent # agent | <clé de roles>
#   reason: "…" # entre guillemets ; sans eux, une virgule ou « : » coupe la raison
# cases:   à partir de l'index au pivot 3 (CLI Anchorpost 2.0.0) ; les cas attendus, rendus par le skill `criticite`
#   - { id: {{id-du-cas}}, title: …, kind: nominal | edge | invalid | refusal, scope: business | technical, family: … }   family facultatif
# notApplicableFamilies:   à partir de l'index au pivot 3 (CLI Anchorpost 2.0.0) ; chaque famille sans cas, avec sa raison ; le skill `criticite` répond aux dix familles quel que soit le niveau, et une réponse par famille est obligatoire dès medium ; écrite par le skill `criticite` seul ; la réponse est un cas, un « sans objet » motivé, ou une question ouverte au registre `docs/questions-ouvertes.md` ; le gate Anchorpost signale une famille sans réponse ; en `enforce`, il la refuse, sauf quand une question ouverte bloque la règle : la règle reste alors « partielle » jusqu'à la réponse
#   - { family: limits | empty | invalid-input | duplicate | ordering | time | permissions | rare-state | volume | failure, reason: … }
# extensions: {}   champs propres au projet, ignorés par Anchorpost
---

<!-- Une règle dit ce que le logiciel permet, exige, calcule ou refuse. Une fonctionnalité voulue (« Billetterie ») est une demande REQ ; une règle de l'organisation cliente sans rapport avec le logiciel est un document DOC. Le sigle {{TRI}} vient du registre (`docs/methode/nomenclature.md`) et a un seul sens dans tout le dépôt : préférer un domaine existant. -->

{{L'énoncé de la règle, en markdown libre, dans la langue du projet : ce que le métier exige, pas comment on le construit. Les précisions datées restent dans le texte : _(précisée le JJ/MM : …)_. Un passage qui ne vaut plus se barre, ~~ainsi~~, avec la date et la source de la revue. Une autre règle se cite par son identifiant complet (`RULE_ALL_LIC-2`) : la citation devient un lien déduit.}}

Un test qui prouve cette règle porte son identifiant entre crochets en tête de son nom : `it('[RULE_{{CTX}}_{{TRI}}-{{n}}] refuse …')`, nom en français. La réalisation (à construire, configurée, prouvée) n'est pas écrite ici : elle se lit dans les tests.
