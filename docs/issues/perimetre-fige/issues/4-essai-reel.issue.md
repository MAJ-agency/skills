# L'essai réel du périmètre figé, sur `essai-relecture-8`

Status: ready-for-agent
Type: task
Modèle: sonnet — une repose de scripts déjà écrits, puis des gestes d'auteur dans un ordre donné sur deux PR de documentation ; rien à concevoir, tout l'attendu est écrit ici.
Blocked by: 3
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: dans `MAJ-agency/essai-relecture-8` : `scripts/chaine/` (les scripts et les bancs que `fusionner` pose), `docs/agents/chaine-de-production.md`, `CLAUDE.md` (le fragment de la fusion), `docs/adr/ADR_ALL_ARC-9-relecture-independante.md`, `docs/features/essai/all/` (la spec et les tickets de l'essai) ; dans `MAJ-agency/skills` : ce ticket seul (`Status:` et `## Comments`)

Programme : [`../../../programmes/perimetre-fige.programme.md`](../../../programmes/perimetre-fige.programme.md). Spec : [`../perimetre-fige.spec.md`](../perimetre-fige.spec.md) (« Vérification », « Essai réel » ; règles 1 à 5). Suit les tickets [1](1-decision-de-plafond-de-l-architecte.issue.md), [2](2-declaration-et-controle-du-perimetre.issue.md) et [3](3-critere-de-perimetre-suite-et-tours-bornes.issue.md), fusionnés sur `main` de `MAJ-agency/skills` (plugin 8.8.0 ou plus).

## Le besoin

Les bancs des tickets 2 et 3 tiennent les scripts et les textes. Ils ne montrent pas qu'une vraie PR de documentation, relue par de vraies sessions, converge avant le plafond. La spec demande un essai réel sur `MAJ-agency/essai-relecture-8`, dont les commentaires font preuve.

**Quand le ticket est fait :**

1. `develop` d'`essai-relecture-8` porte les scripts reposés que la note 8.7.0 exige, et ses documents du régime 8 disent la déclaration de périmètre.
2. Cas 1 joué : une PR de documentation demandée sans déclaration reçoit `Périmètre absent` ; déclarée, elle est relue ; un bloquant est relevé au tour 1 ; la correction poussée avec un fichier hors périmètre reçoit `Périmètre dépassé — <fichiers>`, sans tour compté ; le fichier retiré et la suite écrite, le tour suivant est validé, avant le plafond.
3. Cas 2 joué : une décision non déclarée, écrite dans un fichier déclaré, est relevée par le critère de périmètre ; un constat nouveau sur un texte inchangé, s'il se produit, est listé sous « Relevés tardifs » et ne bloque pas.
4. Chaque attendu a sa preuve : l'URL du commentaire de la PR d'essai, sous `## Comments` de ce ticket et dans le ticket du dépôt d'essai.
5. Tout écart entre l'attendu et ce qui s'est produit est écrit à l'architecte, avec l'URL du commentaire. La session ne corrige aucun skill.

## Où

Lu le 2026-11-27 dans le clone `/home/user/essai-relecture-8` (branche `develop`, sommet `e0cea1c`) et dans `MAJ-agency/skills` (plugin 8.5.0). La session relit chaque emplacement sur `origin/develop` du dépôt d'essai avant d'agir.

- **Le dépôt d'essai est en régime 8.** `.claude/chaine.json`, l. 22 : `"depuis": "2026-11-22T14:13:25Z"`. `CLAUDE.md`, l. 65 : « - **Relecture indépendante.** Toute PR, documentation comprise, est relue par une session de relecture que lance le **Relecteur** du dépôt (skill `relecteur`) » ; l. 66 : « - **Session de travail.** Dès la PR poussée et rien d'autre à faire : PR hors brouillon, le commentaire `À relire — sommet <sha> — Session: <id> — Conducteur: <id>`, puis l'étiquette `à-relire` » ; l. 64 : « - **Réserver le ticket avant de coder** ».
- **Les chemins sensibles** : `.claude/chaine.json`, l. 5, `"scripts/chaine/**"` ; l. 11, `".claude/**"`. `docs/agents/chaine-de-production.md`, l. 77 : « **Fichiers sensibles : l'accord avant le code.** Un chemin sensible (`cheminsSensibles` de `.claude/chaine.json`) ne se modifie que sur la branche d'un ticket dont la ligne `Sensibles:` le couvre ». La repose touche `scripts/chaine/**`.
- **Les scripts posés** : `scripts/chaine/decision-relecteur.mjs`, `verdict.mjs`, `revue-exigee.mjs` et leurs bancs (`decision-relecteur.test.mjs`, `verdict.test.mjs`, `revue-exigee.test.mjs`) sont dans le dépôt, à leur version d'avant ce programme. Le Relecteur joue ceux de `develop` (`relecteur.mjs` l. 20 du plugin).
- **Les documents du régime 8 posés** : `docs/agents/chaine-de-production.md` (§ 5, l. 128, « 5. **Demander la relecture.** » ; l. 129, « 6. **Sur `à-reprendre`** ») ; `CLAUDE.md` (le fragment de la fusion, § « Fusion vers `develop` : une file, un capitaine », l. 60 à 71) ; `docs/adr/ADR_ALL_ARC-9-relecture-independante.md`. `docs/agents/` et `CLAUDE.md` exigent la revue (`revue-exigee.mjs`, l. 63 à 66 du plugin) : la PR de repose n'est pas une PR de documentation.
- **La nomenclature du dépôt d'essai n'est pas celle de `skills`.** Ses specs et ses tickets suivent `<TYPE>_<CTX>_<TRI>-<n>` : `docs/features/essai/all/SPEC_ALL_ESS-1-essai-regime-8.spec.md`, sa carte `SPEC_ALL_ESS-1-essai-regime-8.map.md` (l. 7, « Phase: fini »), ses tickets `docs/features/essai/all/issues/SPEC_ALL_ESS-1-essai-regime-8.01.issue.md` à `.09`. Le trigramme `ESS` est au registre (`docs/methode/nomenclature.md`, l. 151 : « essai réel du régime 8 — la spec et les tickets de l'essai »). Un identifiant neuf se prend par `node scripts/docs/next-id.mjs`, un ticket se réserve par `node scripts/docs/ticket-libre.mjs <identifiant>`.
- **Le modèle d'un ticket d'essai** : `SPEC_ALL_ESS-1-essai-regime-8.09.issue.md`. En-tête (`Status:`, `Type:`, `Règles:`, `Modèle:`, `Fichiers chauds:`, `Sensibles:`, `Dépendances:`), puis les sections ordinaires, puis deux sections propres à l'essai, que la spec `SPEC_ALL_ESS-1` décrit l. 9 : « `## L'essai`, ce que la session qui le code fait de plus qu'à l'ordinaire, et dans quel ordre ; `## Ce que le ticket ne fait pas`, pour qu'elle n'improvise rien ». L'accord du produit sur des fichiers sensibles y est écrit dans la spec (l. 14, « `P-66`, 2026-11-22 ») et dans la carte (`## Fichiers sensibles`).
- **Le plugin de la session** : `~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json` (8.4.0 dans l'instantané lu le 2026-11-27).

## Décisions

1. **Ce qui revient à l'architecte, avant de lancer ce ticket.** La session de ce ticket est l'auteur des PR d'essai : elle ne lance ni Relecteur, ni capitaine, ni session de relecture. Avant le lancement, l'architecte :
   - lance un capitaine et un Relecteur pour `essai-relecture-8`, après la mise à jour du plugin en 8.8.0 ou plus (les sessions inscrites dans la carte `SPEC_ALL_ESS-1` datent du 2026-11-23) ;
   - obtient du produit l'accord pour `scripts/chaine/**` dans ce dépôt, pour la repose, et l'écrit dans sa carte ; la ligne `Sensibles:` du ticket de repose le cite. Sans cet accord écrit, la session s'arrête après le cadrage (étape 2 du scénario) et l'écrit à l'architecte ;
   - donne dans le prompt l'identifiant de sa session, pour les lignes à l'architecte.
2. **Le dépôt de la session.** À trancher par l'architecte au lancement. Défaut prudent : la session s'ouvre sur `MAJ-agency/essai-relecture-8` seul, pour que les hooks d'agent du dépôt d'essai se chargent ; elle lit ce ticket par l'outil GitHub (`get_file_contents` sur `MAJ-agency/skills`) ou le reçoit dans son prompt. Elle écrit le compte rendu dans le ticket du dépôt d'essai et le rend à l'architecte, qui recopie les URL sous `## Comments` de ce ticket et passe son `Status:`. Si la session est ouverte sur les deux dépôts, elle écrit elle-même ces lignes, dans une PR de `skills`.
3. **Où le compte rendu se range dans le dépôt d'essai.** Proposition, à suivre sauf avis contraire de l'architecte : une spec neuve, `SPEC_ALL_ESS-2` (« Essai réel du périmètre figé », identifiant pris par `next-id.mjs`), sans sujet, et trois tickets à sa convention : `.01`, la repose (du code, `Sensibles: scripts/chaine/** — accord de <nom>, <date>`) ; `.02`, le cas 1 ; `.03`, le cas 2. Chaque ticket porte les sections `## L'essai` et `## Ce que le ticket ne fait pas`, comme ceux de `SPEC_ALL_ESS-1`. Les URL des preuves vont sous `## Comments` du ticket de chaque cas. La carte `SPEC_ALL_ESS-1` est finie : elle ne change pas.
4. **La mise à niveau du plugin.** Premier geste de la session : `claude plugin marketplace update maj`, puis lire la version de `~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json`. Elle vaut 8.8.0 ou plus, sinon la session s'arrête et l'écrit à l'architecte. Les skills se lisent ensuite dans les fichiers du marketplace (`~/.claude/plugins/marketplaces/maj/skills/chaine/<skill>/`), pas dans la version chargée au démarrage.
5. **La repose** : ce que la note de version 8.7.0 écrit sous « Ce qu'un projet fait pour en profiter », et rien de plus. Rejouer l'étape 0 du skill `fusionner` (elle repose `scripts/chaine/` avec ses bancs, dont `decision-relecteur.mjs`, `verdict.mjs`, `revue-exigee.mjs`) ; reposer `docs/agents/chaine-de-production.md` et le fragment `CLAUDE.md` de la fusion, les placeholders d'ADR remplacés par les identifiants du dépôt (`ADR_ALL_ARC-6`, `-7`, `-9`) ; amender le point 5 de `ADR_ALL_ARC-9` (note 8.6.0). Une seule PR, sur le ticket `.01`, relue en régime 8 comme une PR de code sensible (`/security-review`), fusionnée par le capitaine. Les scripts de `develop` qui la jugent sont ceux d'avant : elle n'a pas à déclarer de périmètre. L'essai commence quand elle est fusionnée et que le Relecteur a été relancé.
6. **L'écart planté.** Chaque cas a besoin d'un bloquant au tour 1. Le plus mécanique est une référence morte (critère `K4` de l'axe Tickets) : le ticket d'essai cite, sous `## Où`, un modèle à imiter par un chemin qui n'existe pas (`packages/essai/src/absent.mjs:1-10`). Une PR d'essai n'écrit que des fichiers `.md` sous `docs/features/essai/all/` et `docs/adr/` : aucun chemin qui exige la revue, donc une PR de documentation.
7. **Le second cas ne se force pas.** Un « relevé tardif » est un constat qu'une session relève au tour 2 sur un texte que le tour 1 a lu sans rien y relever. L'auteur ne peut pas obliger une session de relecture à manquer un écart au tour 1. Le cas 2 plante donc un écart discret, et le ticket écrit quoi faire dans les trois issues (étape 12). Une issue qui ne montre pas de relevé tardif n'est pas un échec du ticket : la session le dit dans son compte rendu, et l'architecte décide si le banc du ticket 3 suffit.
8. **Les PR d'essai vont jusqu'à la fusion.** Sur un verdict validé, le Relecteur pose `à-fusionner` et le capitaine fusionne : la chaîne se prouve jusqu'au bout, comme pour `SPEC_ALL_ESS-1`. La PR brouillon qui porte la suite du cas 1 reste ouverte, en brouillon ; l'architecte la ferme après le compte rendu.
9. **Aucune version du plugin ne change.** Ce ticket ne modifie aucun skill.

## Le scénario

La session suit `docs/agents/chaine-de-production.md` § 5 du dépôt d'essai pour chaque PR (réserver, brouillon, demander la relecture, redemander après correction). Elle ne se relit pas, ne pose jamais `à-fusionner`, ne fusionne pas, ne met pas sa branche à jour avec `develop`. Entre deux gestes, elle attend la ligne du Relecteur ou son réveil de secours ; elle n'interroge pas GitHub en boucle. À chaque étape, elle note l'URL du commentaire qui fait preuve.

**Préparation**

1. Mettre le plugin à niveau (décision 4).
2. Le cadrage : une PR de documentation qui crée `SPEC_ALL_ESS-2` et ses trois tickets (décision 3). Les scripts de `develop` sont encore les anciens : aucun contrôle de périmètre ne joue. Attendre sa fusion.
3. La repose, sur le ticket `.01` (décision 5). Attendre sa fusion, puis écrire à l'architecte « repose fusionnée, Relecteur à relancer », et attendre sa réponse.

**Cas 1 — le fichier hors périmètre** (ticket `.02`, PR A)

4. Écrire un ticket d'essai `SPEC_ALL_ESS-2.04`, jamais lancé (`Status: wontfix`), avec l'écart planté de la décision 6. Ouvrir la PR A vers `develop`. Demander la relecture **sans** déclaration. Attendu : le commentaire `Périmètre absent`, l'étiquette `à-reprendre`, aucune distribution `Relecture — tour 1`.
5. Écrire la déclaration, un commentaire de quatre lignes : `Périmètre — ticket d'essai SPEC_ALL_ESS-2.04` ; `Fichiers:` le chemin du ticket ; `Décisions: aucune` ; `Sujets: l'essai du périmètre figé`. Redemander la relecture. Attendu : la distribution du tour 1, puis un verdict `refusé` dont un bloquant cite `K4` et le ticket.
6. Corriger la référence morte (un chemin qui existe), et, dans le même push, ajouter un fichier d'ADR que la déclaration ne nomme pas (`docs/adr/ADR_ALL_ARC-<n>-essai-hors-perimetre.md`, identifiant pris par `next-id.mjs`). Redemander la relecture. Attendu : le commentaire `Périmètre dépassé — docs/adr/ADR_ALL_ARC-<n>-essai-hors-perimetre.md`, l'étiquette `à-reprendre`, **aucune** distribution du tour 2.
7. Retirer le fichier d'ADR de la PR A par un commit de plus. Ouvrir la PR B, en brouillon, qui porte ce fichier. Écrire sur la PR A le commentaire `Suite — ADR d'essai hors périmètre — #<numéro de la PR B>`. Redemander la relecture. Attendu : la distribution du tour 2, puis un verdict `validé` ; `à-fusionner` posée par le Relecteur. La PR A a un seul tour refusé : elle est loin du plafond.
8. Relever les URL : `Périmètre absent`, la déclaration, la distribution et le verdict du tour 1, `Périmètre dépassé`, le commentaire `Suite`, la distribution et le verdict du tour 2.

**Cas 2 — la décision dans un fichier déclaré, et le relevé tardif** (ticket `.03`, PR C)

9. Écrire un ticket d'essai `SPEC_ALL_ESS-2.05`, jamais lancé (`Status: wontfix`), avec deux écarts : la référence morte de la décision 6, bien visible sous `## Où` ; et un écart discret, loin du premier, que la session choisit dans la liste `K1` à `K6` (par exemple une surface de `## Surfaces` dont la preuve ne nomme ni test ni commande, `K5`). Ouvrir la PR C, écrire la déclaration (comme à l'étape 5, `Décisions: aucune`), demander la relecture. Attendu : un verdict `refusé` au tour 1. Noter si le second écart y est relevé.
10. Corriger le ou les bloquants du verdict, et eux seuls. Dans le même push, écrire dans le ticket `.05`, sous `## Décisions`, une décision nouvelle que la déclaration ne nomme pas (une phrase : « Décision d'essai E-1 : … »). Redemander la relecture. Attendu : le Relecteur distribue le tour 2 (le fichier est dans le périmètre), et le verdict est `refusé` avec un bloquant du critère de périmètre (`K7`), qui demande le retrait.
11. Retirer la décision par un commit de plus. Écrire la suite : la même PR B, ou un ticket, reçoit la décision ; commentaire `Suite — décision d'essai E-1 — #<PR B>` sur la PR C. Redemander la relecture. Attendu : un verdict `validé` au tour 3, sans plafond.
12. Le relevé tardif, selon ce qui s'est produit pour l'écart discret :
    - **relevé au tour 1** : c'est un bloquant ordinaire, corrigé à l'étape 10. Le relevé tardif n'est pas observé ; la session le dit ;
    - **relevé pour la première fois au tour 2 ou 3** : attendu, il est sous « Relevés tardifs » du verdict, hors du tableau, et il ne compte pas dans `Bloquants:`. S'il est dans le tableau comme bloquant, c'est un écart à l'attendu (étape 14) ;
    - **jamais relevé** : le relevé tardif n'est pas observé ; la session le dit.
13. Relever les URL : la déclaration, les trois distributions, les trois verdicts, le commentaire `Suite`, et la ligne « Relevés tardifs » de chaque verdict des tours 2 et 3.

**Si l'attendu ne se produit pas**

14. La session n'insiste pas et ne contourne rien. Elle écrit à l'architecte (`send_message`) une ligne par écart : le cas, l'étape, l'attendu, ce qui s'est produit, l'URL du commentaire. Elle laisse la PR dans son état, sans la fermer. Elle ne modifie aucun skill, aucun script posé, aucune étiquette posée par un autre. Elle continue l'autre cas s'il n'en dépend pas, sinon elle s'arrête. Cas prévus :
    - un tour 1 validé (l'écart planté n'est pas relevé) : recommencer le cas une fois, sur une PR neuve, avec un écart plus net ; au second tour 1 validé, l'écrire à l'architecte ;
    - une lecture illisible (`Lecture illisible — …`) : l'écrire à l'architecte, qui en lit la cause ;
    - trois tours refusés sur une PR d'essai : le plafond ; la décision de plafond revient à l'architecte, pour la PR d'une session de ticket hors chantier (spec, règle 6 : rien ne change pour elle) ; la session attend sa décision et la suit ;
    - le Relecteur muet plus de trois heures après une demande : le réveil de secours de § 5, puis l'architecte.

## Surfaces

| Surface | Preuve |
| --- | --- |
| plugin à niveau | la sortie de la lecture de `~/.claude/plugins/marketplaces/maj/.claude-plugin/plugin.json` : `"version"` 8.8.0 ou plus, recopiée dans le compte rendu |
| repose des scripts | l'URL de la PR de repose fusionnée ; sur `origin/develop`, `grep -c "Périmètre absent" scripts/chaine/decision-relecteur.mjs` rend 1 ou plus, et `node --test scripts/chaine/decision-relecteur.test.mjs scripts/chaine/verdict.test.mjs` sort en 0 |
| documents du régime 8 reposés | sur `origin/develop`, `grep -n "Périmètre — " docs/agents/chaine-de-production.md CLAUDE.md` rend une ligne au moins dans chacun |
| refus sans déclaration | l'URL du commentaire `Périmètre absent` de la PR A ; aucune distribution avant la déclaration (la liste des commentaires de la PR, dans l'ordre) |
| refus d'un fichier hors périmètre | l'URL du commentaire `Périmètre dépassé — …` de la PR A ; une seule distribution entre le verdict du tour 1 et la suivante, qui porte « tour 2 » |
| suite et verdict validé avant le plafond | l'URL du commentaire `Suite — …` et celle du verdict `validé` du tour 2 de la PR A ; aucun commentaire `Plafond — décision attendue` sur la PR A |
| critère de périmètre | l'URL du verdict du tour 2 de la PR C : un bloquant qui cite `K7` |
| relevé tardif | l'URL du verdict qui le liste sous « Relevés tardifs », ou la phrase du compte rendu qui dit qu'il n'a pas été observé, et dans laquelle des trois issues |
| compte rendu | `## Comments` des tickets `.02` et `.03` du dépôt d'essai, et de ce ticket : une ligne par attendu, son URL, « conforme » ou l'écart |

## Vérification

1. Dans le dépôt d'essai, `pnpm check` vert sur la branche de la repose avant sa livraison (ses bancs posés compris).
2. Pour chaque PR d'essai, la liste de ses commentaires dans l'ordre (`gh api --paginate 'repos/MAJ-agency/essai-relecture-8/issues/<n>/comments' --jq '.[] | [.created_at, .html_url, (.body | split("\n")[0])] | @tsv'`, ou l'outil GitHub `pull_request_read`, méthode `get_comments`), recopiée dans le compte rendu : elle montre l'ordre des marques et l'absence d'une distribution là où le Relecteur a refusé.
3. Le compte rendu relu contre la table des surfaces : chaque ligne a son URL, ou dit pourquoi elle n'en a pas.
4. Le rendu à l'architecte, en cinq lignes : les PR, ce qui est conforme, les écarts, ce qui n'a pas été observé, les sessions à archiver.

**Ce que le ticket ne fait pas.** Il ne modifie aucun fichier de `skills` hors ce ticket. Il ne corrige ni un skill ni un script posé quand l'essai contredit l'attendu : il l'écrit à l'architecte. Il ne lance ni Relecteur, ni capitaine, ni session de relecture. Il ne pose ni ne retire aucune étiquette, hors `à-relire` sur ses propres demandes. Il n'écrit aucun verdict, aucun arbitrage, aucune décision de plafond.

**Consignes de livraison.** Jamais `--no-verify`, jamais de push forcé, jamais `git commit --amend` : une correction est un commit de plus. Dans le dépôt d'essai, la chaîne est posée : chaque PR demande sa relecture (`À relire`, puis `à-relire`), jamais `à-fusionner`. Dans `skills`, si la session y écrit (décision 2) : `pnpm test` vert avant de livrer ; la PR vise `main` ; le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet livré), puis le label `à-fusionner` ; la session ne fusionne pas. **Le corps de cette PR déclare son périmètre** : une ligne `Périmètre — compte rendu de l'essai réel`, puis `Fichiers:` (ce ticket), `Décisions: aucune` et `Sujets:`. Les PR A et C du dépôt d'essai déclarent le leur par le commentaire `Périmètre — …` : c'est l'objet de l'essai.

## Comments

- 2026-11-27 — Écrit par un sous-agent de l'architecte du programme « périmètre figé », d'après la spec validée (`P-2`, `P-3`). Rien n'est écrit dans `essai-relecture-8` : la spec `SPEC_ALL_ESS-2` et ses tickets sont une proposition (décision 3). Trois points reviennent à l'architecte avant le lancement : l'accord du produit sur `scripts/chaine/**` pour la repose, le dépôt sur lequel la session s'ouvre, et le fait que le second cas ne se force pas (décision 7).
