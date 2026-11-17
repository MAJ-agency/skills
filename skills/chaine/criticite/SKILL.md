---
name: criticite
description: Fixe la criticité d'une règle métier, à utiliser à toute création d'un fichier de règle et à tout changement de son énoncé, avant tout code, quelle que soit la session, et pour classer une règle « à classer ». Un sous-agent en contexte vierge, dont le message est fabriqué par le script du skill à partir du seul identifiant de la règle (l'énoncé, les specs qui la portent, les définitions du standard, rien d'autre), rend le niveau et sa raison, les cas attendus et une réponse à chacune des dix familles ; jamais « basse » sans raison écrite, le niveau supérieur dans le doute, `by` vaut `agent`, un agent ne baisse jamais un niveau. La session écrit le niveau rendu ou un plus haut dans le fichier de la règle, et la commande jouée et chaque sortie brute dans la section « Criticité » de sa PR. Sans index Anchorpost au pivot 3, le skill le dit et s'arrête.
argument-hint: '<RULE_…> [<RULE_…>…]'
---

# Criticité d'une règle

La criticité d'une règle dit ce qu'elle doit prouver. Décision du produit : « La criticité est fixée par un agent, plus par l'humain. Un skill de criticité, lancé dans un sous-agent en contexte vierge au moment où la règle s'écrit, avant tout code, fixe le niveau et sa raison, écrit les cas attendus et répond aux dix familles. L'humain ne valide plus règle par règle : il revoit les niveaux dans Anchorpost et corrige par une PR. » Ses deux parades : « le skill ne rend jamais « basse » sans une raison écrite dans la règle ; dans le doute, il rend le niveau supérieur » ; « l'index dit qui a fixé chaque criticité, un agent ou une personne ». Ce skill est le premier geste ; l'index et Anchorpost font le second.

Une règle est **classée** quand `criticality`, `cases` et `notApplicableFamilies` sont écrits dans son fichier, et la commande jouée et chaque sortie brute dans la section `## Criticité` de la PR.

## Quand

- **À toute création d'un fichier de règle, et à tout changement de son énoncé, avant tout code**, quelle que soit la session. D'ordinaire, la session qui écrit la spec qui porte la règle écrit son fichier, `candidate`, à l'étape de la spec, après le grilling : l'architecte d'un programme, le conducteur au cadrage d'un chantier, ou toute session qui publie une règle (skill `tickets`). Une règle naît aussi en recette, ou dans une session qui code et la découvre : cette session lance le skill de même, avant de coder ce que la règle exige. Une session qui code ne relance pas le skill sur une règle dont elle ne change pas l'énoncé.
- **Sur une règle « à classer »** (aucune criticité) : de même, par la session qui reprend la règle ; et à la repose du projet au pivot 3, sur chaque règle sans criticité.
- **Sur une règle déjà classée** : étape 5.
- **Le sous-agent est lancé par la session elle-même** : un sous-agent ne lance pas de sous-agent. Une session qui fait rédiger la règle par un sous-agent lance ce skill une fois le fichier écrit.
- **Une règle que la session écrit et ne classe pas est un écart**, dès que l'index est au pivot 3 : la revue de ticket le relève (critère `D8`), bloquant.

## Étape 1 — L'index du projet est-il au pivot 3 ?

Le schéma strict des règles ne porte `criticality` sous la forme `{ level, by, reason }`, `cases` et `notApplicableFamilies` qu'au pivot 3 (CLI Anchorpost 2.0.0). La forme nue (`criticality: high`) est celle d'avant, qu'on n'écrit plus. La session lit le champ `schema` de l'index commis, depuis la racine du projet :

```bash
node -e 'const f=require("fs"),p="anchorpost/anchorpost.json";console.log(f.existsSync(p)?JSON.parse(f.readFileSync(p,"utf8")).schema:"absent")'
```

**Seul l'index compte.** S'il ne rend pas `3`, le skill le dit en une phrase (« l'index du projet n'est pas au pivot 3 : la règle reste « à classer » ») et s'arrête : aucun sous-agent, rien dans la PR, rien dans le fichier. La règle s'écrit quand même `candidate`, à l'étape de la spec ; son classement viendra à la repose du projet au pivot 3, qui lance ce skill sur chaque règle sans criticité.

## Étape 2 — Ce que reçoit le sous-agent

Les mots du produit : le sous-agent « ne connaît que l'énoncé de la règle, sa spec et les définitions ». Son message est fabriqué par le script du skill, à partir du seul identifiant de la règle, jamais à la main :

```bash
mkdir -p <scratchpad>/criticite
node <dossier du skill>/scripts/contexte-regle.mjs <RULE_…> > <scratchpad>/criticite/<RULE_…>.md
```

La commande exacte, jouée depuis la racine du projet, sans variable d'environnement devant ; c'est elle que la section `## Criticité` recopie. `<dossier du skill>` est le dossier de base que l'outil Skill donne au chargement (à défaut, `~/.claude/plugins/marketplaces/maj/skills/chaine/criticite`). Le script se lance une fois que la ligne `Règles:` de la spec, ou d'un de ses tickets, nomme la règle. Il choisit l'entrée, pas la session :

- **le fichier de la règle** : `docs/metier/regles/<ctx>/<RULE_…>.md` ; introuvable, il refuse et dit le chemin cherché ;
- **l'énoncé** : son `title`, lu sur sa seule ligne, et le texte qui suit l'en-tête, l'en-tête YAML retiré (ni `validation`, ni `decisions`, ni `sources`, ni une criticité déjà écrite) et les commentaires HTML retirés ; un titre plié ou illisible, ou un en-tête qui ne se lit pas, est refusé ;
- **les specs qui la portent** : toute `*.spec.md` sous `docs/` dont la ligne `Règles:` nomme la règle, ou dont un ticket la nomme dans sa ligne `Règles:` ou `Prouve:` ; chaque spec copiée au mot près, ses commentaires (HTML, ou ligne `[//]: # (…)`) retirés, même si elle porte un niveau ; une spec dont le nom ne porte pas d'identifiant lisible est ignorée et nommée ; aucune : « aucune spec ne déclare cette règle », un signal à vérifier avant de lancer le sous-agent (la ligne `Règles:` est-elle écrite ?) ; aucun lien symbolique n'est suivi, une spec qui en est un est ignorée et nommée, une règle qui en est un est refusée ;

La session passe la sortie du script telle quelle, sans rien y ajouter ni rien y réécrire. Elle n'ajoute **jamais** rien : ni le niveau d'une feature lu au manifeste ou à l'index, ni l'intention de l'auteur, ni l'historique de la session, ni la description de la PR, ni le niveau ou les cas déjà écrits dans l'en-tête de la règle, ni le code, ni les tests. Un refus du script se corrige dans le fichier de la règle, puis le script se rejoue. Un contexte de plus de 300 000 caractères est refusé, avec la taille de la règle et de chaque spec : la session s'arrête, le dit, et ne tronque rien à la main. Un refus que la session ne peut pas corriger dans le fichier de la règle (projet hors convention) : elle s'arrête et le dit ; elle ne fabrique jamais l'entrée à la main.

## Étape 3 — Lancer le sous-agent

Outil **Agent**, un sous-agent neuf par règle. Son prompt est la sortie du script, entière, et rien d'autre. Le prompt lui dit de n'utiliser aucun outil : tout ce qu'il lui faut est dans son message.

## Étape 4 — Lire, tracer, retenir ou corriger, écrire

1. **Lire.** La sortie est un seul bloc YAML au format du prompt, puis la ligne « Questions : ». Hors format, ou `low` sans `reason`, ou une famille sans cas, sans « sans objet » et sans question, ou `by` autre que `agent` : un second sous-agent neuf, une fois. Encore hors format : la session retient le plus haut niveau apparu parmi les sorties qui le donnent validement (un `low` sans `reason` ne compte pas), et `high` à défaut, avec `by: agent` et une raison qui dit « deux sorties hors format » ; cette raison ne vaut jamais pour un `low`. Elle reprend leurs cas lisibles. Après un lancement, la règle ne reste jamais « à classer ». **Jamais « basse » sans une raison écrite.**
2. **Tracer.** La section `## Criticité` du corps de la PR porte, pour chaque règle, la commande jouée, puis chaque sortie brute de sous-agent, dans l'ordre, puis ce que la session écrit et pourquoi. Toute PR qui écrit ou change `criticality`, `cases` ou `notApplicableFamilies` dans un fichier de règle, ou qui retire une règle d'une ligne `Règles:`, porte cette section, avec la sortie du sous-agent ou la raison écrite du geste. Une règle relancée garde le plus haut des niveaux rendus. Si la section ferait passer le corps de la PR au-delà de 65 536 caractères, les sorties brutes vont en commentaires de la PR, un par règle, et la section garde, par règle, la commande, le niveau retenu et le lien du commentaire.
3. **Retenir ou corriger.** La session relit chaque cas et chaque famille contre l'énoncé. Elle écrit le niveau rendu, ou un niveau plus haut ; jamais plus bas : **un agent peut monter un niveau, jamais le baisser** ; baisser est le geste d'une personne, par une PR. Elle peut ajouter un cas, ou corriger la forme d'un titre. Elle ne retire un cas rendu, ne change son `kind` ni son `scope`, ne change le sens de son titre, et n'ajoute un « sans objet » que le sous-agent n'a pas rendu, qu'avec la raison écrite dans la section `## Criticité`, que le relecteur lit. Les questions du sous-agent vont dans la PR, ou à qui tranche la règle. Une famille que le sous-agent laisse en question reste sans réponse dans le fichier : la section `## Criticité` la liste avec sa question, pour qui tranche la règle (la MOA pour une situation métier, l'architecte ou le conducteur pour une situation technique). Le skill se relance sur la règle quand la réponse est écrite dans l'énoncé ou dans la spec.
4. **La feature.** Une règle déclarée par une feature (`Règles:` de sa spec ou d'un de ses tickets) reçoit la criticité fixée sur cette feature (`featureCriticality` du manifeste), et prend la plus haute des deux. Une règle basse ne peut donc pas vivre dans une feature moyenne : quand la session voit une règle proposée sous le niveau d'une feature qui la déclare, elle l'écrit dans la section (« la règle prendra le niveau de la feature »). Retirer une règle d'une ligne `Règles:` pour baisser sa criticité est le geste d'une personne : le skill le constate et le signale dans la section, il ne le fait pas.
5. **Écrire** dans l'en-tête du fichier de la règle (formes de la spec du standard, `SPEC_ALL_ANC-5` d'Anchorpost) ; `by` vaut toujours `agent` :

   ```yaml
   criticality:
     level: medium # low | medium | high
     by: agent
     reason: "Une erreur fausse ce que la MOA lit sur la page d'une règle."
   cases:
     - id: nominal
       title: Un membre invité par lien magique rejoint l'espace
       kind: nominal # nominal | edge | invalid | refusal
       scope: business # business | technical
     - id: lien-expire
       title: Un lien expiré est refusé
       kind: refusal
       scope: business
       family: time # facultatif : l'une des dix familles
   notApplicableFamilies:
     - { family: volume, reason: "Un espace n'a qu'une poignée d'invitations en cours." }
   ```

   Puis la commande d'index du projet, celle que nomme `scripts/docs/index-generes.json`, et le gate Anchorpost du projet.

## Étape 5 — Relancé sur une règle déjà classée

Le sous-agent ne voit pas le niveau déjà écrit (étape 2) ; la session compare après.

- **Une criticité fixée par une personne** (`by` qui n'est pas `agent`, ou la forme ancienne `criticality: high`, sans `by`) : le skill ne réécrit jamais une criticité fixée par une personne. Tout écart, plus haut ou plus bas, se signale dans la section pour qu'une personne décide.
- **Une criticité fixée par un agent** : un niveau rendu plus haut s'écrit, avec sa raison ; égal, rien ne change ; si le sous-agent rend un niveau plus bas, la session ne change rien et le signale dans la section pour qu'une personne décide.
- **Les cas et les familles déjà écrits** ne se retirent ni ne se réécrivent : un cas nouveau retenu s'ajoute ; un cas métier ajouté à une règle `validated` attend une validation nouvelle, écrite par un humain.

## Ne jamais

- Ajouter quoi que ce soit au message du script, ou fabriquer ce message à la main : l'intention de l'auteur, l'historique de la session, le niveau d'une feature, le niveau déjà écrit, le code ou les tests.
- Écrire « basse » sans raison, ou avec une raison de procédure (« deux sorties hors format »), ou trancher un doute vers le bas.
- Écrire un niveau sous le plus haut rendu, baisser un niveau, ou réécrire une criticité fixée par une personne.
- Écrire `by:` autre que `agent` : un agent écrit toujours `by: agent`, quel que soit son rôle ; le nom d'une personne est le geste de cette personne, par sa PR.
- Retirer un cas rendu, changer son `kind` ou son `scope`, changer le sens de son titre, ou ajouter un « sans objet », sans la raison dans la section `## Criticité`.
- Retirer une règle d'une ligne `Règles:` pour baisser sa criticité.
- Lancer un sous-agent, écrire une criticité ou une section `## Criticité` quand l'index du projet n'est pas au pivot 3 ; écrire la forme nue `criticality: high`.
- Écrire `validated` : seul un humain l'écrit.
- Écrire un cas que ni l'énoncé ni la spec ne portent, pour répondre à une famille : une situation non tranchée est une question, pas un cas.
- Lancer ce skill dans un sous-agent.
