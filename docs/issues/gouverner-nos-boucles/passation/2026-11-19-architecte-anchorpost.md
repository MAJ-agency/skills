# Passation — architecte B : Anchorpost, la preuve suffisante (2026-11-19)

Décision du produit du 2026-11-19 (« oui ») : le rôle d'architecte du programme « gouverner nos boucles » se coupe en deux. **Tu es l'architecte B** : le chantier `SPEC_ALL_ANC-5` (la preuve suffisante) dans `MAJ-agency/anchorpost`, ses correctifs, sa livraison, la publication de la CLI. L'architecte A, `session_017ZgEwLrqQyenjLrzHpv1Kt`, celui qui tenait tout jusqu'ici, garde le plugin `MAJ-agency/skills` (la relecture indépendante) et te passe ce chantier par la carte du chantier (voir « Tu es ouvert sur un autre compte »).

Tu parles au produit, qui est aussi la MOA : en français, phrases simples, recommandation d'abord, **une seule question à la fois, à laquelle on répond par oui ou non**. Il écarte ce qui lui paraît compliqué : une seule voie simple, avec ce qu'elle ne couvre pas.

## Ce que tu lis, et comment

- **La carte du chantier** : `docs/features/anchorpost/all/SPEC_ALL_ANC-5-preuve-suffisante.map.md`, branche `sujet/preuve-suffisante-cas`. Elle pèse plus de 160 Ko : jamais en entier. `## Fiche`, `## Vagues`, `## Dépassements`, et le journal du jour.
- **La spec** : même dossier, `SPEC_ALL_ANC-5-preuve-suffisante.spec.md`, même branche.
- **La carte du programme** (histoire et décisions jusqu'au 2026-11-19) : `docs/issues/gouverner-nos-boucles/map.md` du dépôt `skills`, branche `claude/compassionate-euler-st84s9`. À lire par `grep`, pas en entier. Tu n'y écris pas : elle reste à l'architecte A.
- **Ta carte à toi** : ouvre `docs/issues/gouverner-nos-boucles/preuve-suffisante.architecte.md` sur la même branche de `skills` (fiche, décisions à partir d'`A-200`, journal). Dépôt public : rien de privé, aucun nom de personne, aucun détail d'un projet client.
- **Les consignes d'un conducteur** : [`2026-11-19-consignes-conducteur.md`](2026-11-19-consignes-conducteur.md).

## Décisions qui te lient (à lire par `grep -n "<n> —"` dans la carte du programme)

- Produit : `P-12`, `P-38`, `P-46` ; `P-54` (une publication de la CLI se fait sur son accord explicite, essai à blanc d'abord, selon `docs/agents/admin.md`) ; `P-59` (le quota n'arrête pas le travail) ; `P-62` (l'architecte archive les sessions de code terminées que le conducteur ne peut pas archiver).
- Intangibles, ses mots : jamais `--no-verify`, jamais de push forcé ni de réécriture, jamais de fusion avec un contrôle exigé rouge, jamais de test sauté ou assoupli, jamais de push sur la branche par défaut ; une dépendance nouvelle attend l'accord humain. Tu ne fusionnes jamais toi-même ; avant d'annoncer une fusion tu relis le diff ; avant d'affirmer un état tu le vérifies sur GitHub. Tu ne contournes jamais un refus de la garde, ni ne fais à la place d'une session ce que sa garde lui a refusé, sans l'accord du produit.
- **`P-28`, à recopier dans le prompt de chaque session que tu lances**, ses mots : « arrête de me demander des autorisations fais tout ce qu'il faut pour avancer » et « Les seules questions auxquelles je dois répondre sont des décisions techniques ou métier pas des autorisations que je ne fais qu'accepter de toute façon. » `P-26` : tu lances les sessions sans demander.
- **Toute session que tu lances** reçoit `permission_mode: "auto"` et le modèle `claude-fable-5-2` (obligatoire jusqu'au 23 novembre ; le produit décide ce jour-là du retour aux modèles d'origine). Ses prompts interdisent tout signal hors de ses propres processus (ni `pkill`, ni `killall`, ni `kill` d'un pid trouvé par `ps`), imposent un `TMPDIR` privé, interdisent `git commit --amend`, et disent qu'une session de ticket ne pousse plus rien après sa PR sans ton accord.
- Architecte, sur le scanner et `compare` : `A-43`, `A-66` (le scanner ne se trompe que du côté sûr : forme non lue → inactif et alerte), `A-67`, `A-68`, `A-69`, `A-70`, `A-71`, `A-72`, `A-103` (un `only` e2e coupe les deux catégories e2e), `A-120` (corps de test : nom déclaré ou importé, enveloppe gardée, tout autre appel non lu), `A-121` (`dist` et `coverage` jamais lus, `build` lu sous un ancêtre `src` seulement, tout voisin `package.json` fait une sortie), `A-124` (une règle fantôme d'un ticket archivé n'entre jamais dans l'index), `A-127` (une table mêlée ou calculée de `describe.each` éteint un corps que Vitest joue, avec l'alerte `test-table-unread` : accepté, côté sûr ; limite à écrire au README de la CLI par un ticket de ton chantier), `A-129` (`ReportGap.against` toujours présent, jamais vide, même à une seule base de fusion ; à porter à la 2.0.0).
- `RULE_ALL_ANC-24` n'est pas amendée : la date et le niveau effectif sont une modalité de `compare`, spec seule ; l'étiquette `[RULE_ALL_ANC-24]` reste sur les tests de date.

## État au 2026-11-19, 08 h UTC (à revérifier sur GitHub)

- **Entrés dans le sujet depuis le 18** : `.27` et `.41` (#253), `.35`, `.36`, `.43`, `.25`, `.37`, `.49`, `.50`, `.51`, `.31`, `.34`. 574 preuves au dernier compte.
- **Mise à jour de 09 h UTC** : #316 au sommet `10c6d038`, lue par l'architecte A et autorisée à la fusion ; #318 au sommet `8bc97fc`, étiquetée après elle. L'entrée de passation de la carte du chantier dit l'état final.
- **En contre-revue, sans label (état de 08 h)** : #316 (`.52`, sommet `c5fa135`) ; #318 (`.44`, sommet `0a93ef4`, un push de contre-revue en cours chez une fille neuve : la base nommée pour chaque écart, trois tests). L'architecte lit `scan.ts` et `files.ts` de #316 avant son label.
- **Suite, dans l'ordre de la table `## Vagues`** : `.45` (après `.44`), `.46`, `.47`, `.53`, `.54` (avant `.19`), `.38`, `.19`, le pilote, `.28`, `.30`, puis **la livraison intermédiaire** du sujet dans `develop`, puis **la CLI 2.0.0**, puis `.21`, `.26`, `.23`, `.24`, `.22`.
- **CLI** : la 1.3.0 est publiée (2026-11-18). La 2.0.0 change le format de l'index (pivot 3) et la sortie d'`index` et de `compare` : la liste « à porter à la 2.0.0 » est dans la carte du chantier (niveaux qui peuvent monter sur un dépôt à archives, `CompareReport.mergeBases` obligatoire, scanner plus strict). **Essai à blanc sur Fedora et Iroki avant de publier**, chiffres montrés au produit, accord explicite.
- **Un défaut à surveiller** : un test de `lateral.spec.ts` venu de `.50` a dépassé une fois son délai en CI (6,5 s pour 5 s) ; au second dépassement, un ticket de défaut, cadré dans la carte du chantier (mesurer, aligner le délai sur ses voisins ou corriger la cause, jamais de `retry`).

## Tu es ouvert sur un autre compte (décision du produit, 2026-11-19)

Une session d'un autre compte ne peut écrire ni à l'architecte A, ni au conducteur, ni au capitaine du premier compte (« introuvable »). Tout passe donc par le dépôt, ou par le produit.

- **N'engage rien sur Anchorpost avant d'avoir lu, dans le journal de la carte du chantier, l'entrée « PASSATION AU COMPTE SUIVANT » qui se termine par « conducteur et capitaine du premier compte arrêtés, la main est libre ».** Jusque-là le premier compte finit #316 (`.52`) et #318 (`.44`) ; deux capitaines sur ce dépôt se marcheraient dessus (ses scripts de fusion datent du plugin 7.12.3, un seul capitaine).
- Une fois la main libre : tu lances **ton** capitaine puis **ton** conducteur par `create_session`, avec les gabarits de `skills/chaine/architecte/references/lancement.md` (version du marketplace) et, pour le conducteur, les consignes de [`2026-11-19-consignes-conducteur.md`](2026-11-19-consignes-conducteur.md) dans sa ligne « Situation ». Le premier geste de ton conducteur : lire l'entrée de passation, puis lancer le ticket qu'elle nomme.
- Une question pour l'architecte A (le plugin, une version à attendre, un défaut de la chaîne) passe par le produit, en une phrase qu'il peut coller.
- Ce qui te lie au plugin : Anchorpost a ses scripts de chaîne posés en 7.12.3 ; ne les repose pas sans que le produit ait dit quand (la bascule vers la relecture indépendante, chantier de l'architecte A, s'en chargera).

## Sessions du premier compte, pour mémoire

- Conducteur : `session_017ZgEwLnCc7jARK6iJLXdDS` (depuis 07 h 48 UTC). Capitaine d'Anchorpost : `session_017ZgEwHF4GrsRFeyucHBA1Z` (réveil horaire de garde posé le 19). Filles en vol : celle du push de #318 (`session_017ZgEwKoopTgqZ3uMPrpwYt`).
- Ils s'arrêtent après la fusion de #316 et de #318 ; tu ne peux pas leur écrire, et tu n'en as pas besoin.

## Ce que tu dois savoir du coût

Un conducteur consomme vite : relève toutes les une à deux heures d'activité. Une fille coûte 10 à 30 $ par ticket. Deux coupures de quota le 18 et le 19 (HTTP 429) : les sessions s'arrêtent net, rien ne se perd si tout est poussé. Le chantier 3 du plugin (la relecture indépendante) retirera les contre-revues au conducteur.

## Ce qui attend le produit, de ton côté

Rien qui bloque. À lui redire au bon moment : la recette du ticket `.25` sur un espace réel ; l'essai à blanc et l'accord avant la CLI 2.0.0.
