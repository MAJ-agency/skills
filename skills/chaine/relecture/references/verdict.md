# Le verdict d'une session de relecture

Un commentaire de la PR, neuf, écrit une fois, jamais modifié. Son en-tête est lu par la machine (`scripts/chaine/verdict.mjs`) : la marque, puis six lignes, dans cet ordre, sans rien entre elles ni avant la marque, puis une ligne vide. Ce qui suit la ligne vide est pour l'auteur de la PR : la machine ne le lit pas.

```markdown
<!-- relecture:verdict -->
Sommet relu: <sommet de la distribution, 40 caractères>
Tour: <tour de la distribution>
Verdict: <validé | refusé | incomplet>
Bloquants: <nombre de bloquants gardés>
Session: <identifiant de cette session>
/security-review: <lancée | non requise>

PR #<n> vers `<base>` : <n> fichiers, <n> lignes relues (index générés exclus).

Axes et contrôles :
- Règles : <joué | non exécuté, et la cause | sans objet>
- Ticket : <joué | non exécuté, et la cause | sans objet>
- Documentation : <joué | non exécuté, et la cause | sans objet>
- Tickets : <joué | non exécuté, et la cause | sans objet>
- Règles métier : <joué | non exécuté, et la cause | sans objet>
- Session : `C1` <joué | non exécuté, et la cause | sans objet> · `C2` <…> · `C3` <…> · `C4` <joué, `/security-review` lancée après vérification | non exécuté, `/security-review` non lancée, et la cause | sans objet>

Pour lever un « non exécuté » : <qui lève chaque cause, et comment | sans objet>

| Gravité | Axe | Critère | Fichier et ligne | Constat | Test qui l'aurait attrapé |
| --- | --- | --- | --- | --- | --- |
| <bloquant ou doute> | <axe> | <critère, et la règle écrite qu'il applique> | `<fichier>:<ligne>` | <le constat, une phrase> | <pour un bloquant : le test ; pour un doute : —> |

Écartés au tri : <n>.
- `<fichier>:<ligne>` : <le critère cité, ou « sans critère »>, <pourquoi il est écarté, en une phrase>

Hors du diff relu : <`<fichier>`, et pourquoi : lockfile, snapshot, sans écart contre la base, binaire, binaire illisible, binaire sous un chemin sensible | aucun>

Index à régénérer par le capitaine : <`<index>` | aucun>

Cas laissés à un autre ticket (`T3`, (d)) : <cas `<règle>#<id>` porté par `<ticket>` | aucun>
```

## Remplir l'en-tête

- **`Sommet relu:`** le sommet que la distribution nomme, en entier, en minuscules, même si la tête de la PR a bougé depuis. Un verdict sur un autre sommet se lit `incomplet`.
- **`Tour:`** le numéro que la distribution donne.
- **`Verdict:`** trois cas, dans cet ordre. `refusé` dès qu'il reste au moins un bloquant gardé au tri, **même si un axe ou un contrôle est « non exécuté »** : un bloquant confirmé l'emporte, l'auteur corrige, et le tour suivant rejoue tout, sur un contenu neuf. Sinon `incomplet` dès qu'un axe ou un contrôle est « non exécuté », que `/security-review` était exigée et n'a pas été lancée, qu'un fichier binaire est sous un chemin sensible, ou qu'un binaire est illisible (ni une image, ni une police, ni une archive). Sinon `validé`.
- **`Bloquants:`** le nombre de lignes « bloquant » du tableau. `validé` et `incomplet` veulent 0, `refusé` veut 1 ou plus. La machine lit `validé` avec un bloquant, ou `refusé` sans bloquant, comme un verdict illisible, donc `incomplet` ; elle accepte `incomplet` avec des bloquants, mais la session ne l'écrit jamais : la commande de l'étape 8 le refuse.
- **`Session:`** l'identifiant de la session de relecture, celui que la distribution nomme.
- **`/security-review:`** `lancée` si la vérification de `C4` (`gestes.md`) est sortie en 0 avant le lancement et que la commande a tourné sur ce sommet : jamais sur parole, jamais parce qu'on lui a dit quel diff lire. `non requise` si le diff relu ne touche aucun chemin sensible. Un seul de ces deux mots, et rien après : les chemins s'écrivent dans le corps. Exigée et non lancée : la ligne se retire entière, et la ligne `C4` du corps dit « `/security-review` non lancée », avec la cause ; le verdict est `incomplet` sans bloquant, `refusé` s'il en reste un. L'en-tête n'a pas de mot pour « non lancée » : la machine lirait le verdict illisible.

Aucune ligne ne s'ajoute à l'en-tête, aucune ne s'y déplace. La commande de contrôle (`gestes.sh controle`, étape 8 de `SKILL.md`) relit le brouillon comme la machine le lira : elle se joue avant de publier, puis sur le commentaire publié.

**Limite connue.** Sur une PR qui touche un chemin sensible, le Relecteur compte `incomplet` tout verdict sans la ligne `/security-review: lancée`, un `refusé` compris (`compter`, dans le calcul de décision que `fusionner` pose sous `scripts/chaine/`). Un `refusé` écrit alors que `/security-review` n'a pas pu tourner ne rend donc pas la PR à son auteur : le Relecteur relance la session, au même tour. La session écrit quand même `refusé` : ses constats sont sur la PR, et le verdict dit ce qu'elle a vu.

## Remplir le corps

- Un axe ou un contrôle que le diff ne déclenche pas est « sans objet ». Un axe dont le sous-agent a échoué deux fois ou n'a pas lu tout le diff, un contrôle dont l'outil manque : « non exécuté », avec la cause. Quand le diff relu lui-même est « non exécuté », aucun axe ne s'est joué : chacun s'écrit « non exécuté », avec cette cause. « Pour lever un « non exécuté » » dit, pour chaque cause, qui la lève et comment (`cas-limites.md`, « Qui lève un `incomplet` ») : un `incomplet` sans cette ligne laisse la PR sans issue. Un verdict `refusé` qui porte un « non exécuté » le dit ainsi, sur la ligne de l'axe ou du contrôle : l'auteur sait ce que le tour suivant jouera en plus.
- Une ligne du tableau par constat gardé au tri, les bloquants d'abord. Sans constat : le tableau se remplace par la phrase « Aucun constat. ».
- Le critère est cité par son identifiant (`S3`, `P2`, `T1`, `D4`, `K5`, `M2`, `C3`) et par la règle écrite qu'il applique.
- Pour un bloquant, la dernière colonne dit le test qui l'aurait attrapé : l'auteur corrige le bloquant avec ce test, ou le conteste. Quand aucun test ne peut le tenir (un écart de documentation, un ticket), elle dit « aucun test », et pourquoi.
- « Écartés au tri » dit combien de constats la session a écartés, et pourquoi en une phrase chacun : sans critère cité, faux, écarté par un arbitrage, ligne venue de `develop`, doublon d'un autre axe.
- « Hors du diff relu » nomme chaque fichier changé que les axes n'ont pas lu, et pourquoi, **toujours**, quel que soit le verdict : `pnpm-lock.yaml` ou un fichier `.snap` (`hors.txt`), un fichier sans écart contre la base (`sans-ecart.txt`), un fichier binaire (`binaires.txt` : le diff n'en porte que le nom). Un binaire sous un chemin sensible se dit tel, et le verdict est alors `incomplet` : un fichier sensible que personne ne peut lire ne se valide pas. De même un binaire illisible (`illisibles.txt` : git le dit binaire, et son extension n'est ni celle d'une image, ni d'une police, ni d'une archive) : du code avec un octet nul ou un texte en UTF-16 que personne ne lit ne se valide pas. Un index à commande, que `C1` vérifie, ne s'y nomme pas.
- « Index à régénérer par le capitaine » nomme, sur une PR de mise à jour, chaque index à commande que la fusion a touché et que `C1` trouve périmé : ce n'est pas un constat, le capitaine le régénère quand il fait avancer le sujet.
- Aucune ligne du corps ne commence par `Relecture — `, `Relecture en panne`, `À relire — `, `Plafond — `, `Décision de plafond`, `Arbitrage — ` ni `Lecture illisible` : ce sont les marques du Relecteur, de l'auteur et de l'arbitre.

## Un exemple

```text
<!-- relecture:verdict -->
Sommet relu: 0123456789abcdef0123456789abcdef01234567
Tour: 1
Verdict: refusé
Bloquants: 1
Session: session_01AbCdEfGhIjKlMnOpQrStUv
/security-review: non requise

PR #412 vers `sujet/facture` : 6 fichiers, 214 lignes relues (index générés exclus).

Axes et contrôles :
- Règles : joué
- Ticket : joué
- Documentation : non exécuté, le sous-agent a rendu deux fois une sortie hors format
- Tickets : sans objet
- Règles métier : sans objet
- Session : `C1` joué · `C2` joué · `C3` sans objet · `C4` sans objet

Pour lever un « non exécuté » : Documentation, le tour suivant le rejoue après la correction de l'auteur

| Gravité | Axe | Critère | Fichier et ligne | Constat | Test qui l'aurait attrapé |
| --- | --- | --- | --- | --- | --- |
| bloquant | Ticket | `T3`, `RULE_ALL_FAC-16`, cas `montant-nul` | `apps/api/src/facture/total.ts:42` | Une facture sans ligne rend `undefined` au lieu de 0 : le cas `montant-nul` n'a pas de preuve. | `total.spec.ts`, « [RULE_ALL_FAC-16#montant-nul] rend 0 pour une facture sans ligne » |
| doute | Règles | `S9`, `apps/api/CLAUDE.md` de la base § « Invariants » | `apps/api/src/facture/total.ts:57` | Le total est-il relu sous le verrou de la facture ? Le diff ne montre pas l'appelant. | — |

Écartés au tri : 1.
- `apps/api/src/facture/total.ts:12` : sans critère, une suggestion de nommage.

Hors du diff relu : `apps/web/public/logo.png`, binaire ; `pnpm-lock.yaml`, lockfile

Index à régénérer par le capitaine : aucun

Cas laissés à un autre ticket (`T3`, (d)) : aucun
```

Dans cet exemple, l'axe Documentation n'a pas pu être joué et le verdict est `refusé` : le bloquant de l'axe Ticket suffit. Sans ce bloquant, le même verdict s'écrirait `incomplet`, `Bloquants: 0`.
