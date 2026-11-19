# Passation — architecte B : Anchorpost, la preuve suffisante (2026-11-19)

Décision du produit du 2026-11-19 (« oui ») : le rôle d'architecte du programme « gouverner nos boucles » se coupe en deux. **Tu es l'architecte B** : le chantier `SPEC_ALL_ANC-5` (la preuve suffisante) dans `MAJ-agency/anchorpost`, ses correctifs, sa livraison, la publication de la CLI. L'architecte A garde le plugin `MAJ-agency/skills` (la relecture indépendante). L'architecte sortant, `session_017ZgEwLrqQyenjLrzHpv1Kt`, s'arrête une fois les deux suites en place.

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
- Architecte, sur le scanner et `compare` : `A-43`, `A-66` (le scanner ne se trompe que du côté sûr : forme non lue → inactif et alerte), `A-67`, `A-68`, `A-69`, `A-70`, `A-71`, `A-72`, `A-103` (un `only` e2e coupe les deux catégories e2e), `A-120` (corps de test : nom déclaré ou importé, enveloppe gardée, tout autre appel non lu), `A-121` (`dist` et `coverage` jamais lus, `build` lu sous un ancêtre `src` seulement, tout voisin `package.json` fait une sortie), `A-124` (une règle fantôme d'un ticket archivé n'entre jamais dans l'index).
- `RULE_ALL_ANC-24` n'est pas amendée : la date et le niveau effectif sont une modalité de `compare`, spec seule ; l'étiquette `[RULE_ALL_ANC-24]` reste sur les tests de date.

## État au 2026-11-19, 08 h UTC (à revérifier sur GitHub)

- **Entrés dans le sujet depuis le 18** : `.27` et `.41` (#253), `.35`, `.36`, `.43`, `.25`, `.37`, `.49`, `.50`, `.51`, `.31`, `.34`. 574 preuves au dernier compte.
- **En contre-revue, sans label** : #316 (`.52`, sommet `c5fa135`) ; #318 (`.44`, sommet `0a93ef4`, un push de contre-revue en cours chez une fille neuve : la base nommée pour chaque écart, trois tests). L'architecte lit `scan.ts` et `files.ts` de #316 avant son label.
- **Suite, dans l'ordre de la table `## Vagues`** : `.45` (après `.44`), `.46`, `.47`, `.53`, `.54` (avant `.19`), `.38`, `.19`, le pilote, `.28`, `.30`, puis **la livraison intermédiaire** du sujet dans `develop`, puis **la CLI 2.0.0**, puis `.21`, `.26`, `.23`, `.24`, `.22`.
- **CLI** : la 1.3.0 est publiée (2026-11-18). La 2.0.0 change le format de l'index (pivot 3) et la sortie d'`index` et de `compare` : la liste « à porter à la 2.0.0 » est dans la carte du chantier (niveaux qui peuvent monter sur un dépôt à archives, `CompareReport.mergeBases` obligatoire, scanner plus strict). **Essai à blanc sur Fedora et Iroki avant de publier**, chiffres montrés au produit, accord explicite.
- **Un défaut à surveiller** : un test de `lateral.spec.ts` venu de `.50` a dépassé une fois son délai en CI (6,5 s pour 5 s) ; au second dépassement, un ticket de défaut, cadré dans la carte du chantier (mesurer, aligner le délai sur ses voisins ou corriger la cause, jamais de `retry`).

## Sessions en vie sur le compte de l'architecte sortant

- Conducteur : `session_017ZgEwLnCc7jARK6iJLXdDS` (depuis 07 h 48 UTC). Capitaine d'Anchorpost : `session_017ZgEwHF4GrsRFeyucHBA1Z` (réveil horaire de garde posé le 19). Filles en vol : celle du push de #318 (`session_017ZgEwKoopTgqZ3uMPrpwYt`).
- **Si tu es ouvert sur le même compte** : écris-leur ton identifiant par `send_message` ; ils mettent à jour leur ligne `Architecte:`.
- **Si tu es ouvert sur un autre compte** : tu ne peux pas leur écrire (une session d'un autre compte répond « introuvable »). L'architecte sortant arrête alors proprement ce conducteur et ce capitaine, sujet sans gel, rien de non poussé ; tu lances les tiens par `create_session` avec les gabarits de `lancement.md` et les consignes de l'annexe. Le capitaine ne suit que les étiquettes : aucune PR ne lui est nommée.

## Ce que tu dois savoir du coût

Un conducteur consomme vite : relève toutes les une à deux heures d'activité. Une fille coûte 10 à 30 $ par ticket. Deux coupures de quota le 18 et le 19 (HTTP 429) : les sessions s'arrêtent net, rien ne se perd si tout est poussé. Le chantier 3 du plugin (la relecture indépendante) retirera les contre-revues au conducteur.

## Ce qui attend le produit, de ton côté

Rien qui bloque. À lui redire au bon moment : la recette du ticket `.25` sur un espace réel ; l'essai à blanc et l'accord avant la CLI 2.0.0.
