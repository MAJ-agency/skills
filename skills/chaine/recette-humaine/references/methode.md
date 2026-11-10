# Recette humaine — méthode détaillée

Annexe de `SKILL.md`. Elle fixe le vocabulaire et le gabarit de l'inventaire ; le skill fixe le déroulé.

## Les neuf familles de défauts

Chaque défaut candidat, chaque test, porte une famille. Elles servent à ne pas chercher toujours au même endroit.

| Famille | Nom                        | Ce qu'on cherche                                                                                                              | Exemple vécu                                                  |
| ------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| A       | La saisie qui ment         | Une valeur acceptée qui ne veut pas dire ce que l'humain a tapé : date avec heure, fuseau, nombre à virgule, fichier mal typé | Dates lues avec l'heure, désordre accepté                     |
| B       | L'erreur au mauvais moment | Un refus qui arrive trop tard (après le paiement, après le courriel) ou trop tôt, ou en anglais                               | Recherche qui ne trouve pas, puis doublon créé                |
| C       | Deux écrans, deux vérités  | Le même objet dit deux choses selon la surface : libellé, compteur, échéance, numéro                                          | Trois libellés pour un même état                              |
| D       | La vie après               | Ce qui se passe après la transition : annulée puis réactivée, suspendue puis évoluée, remplacée puis modifiée, deux clics     | Annulée → active passait ; deux mutations ouvertes            |
| E       | Le mauvais destinataire    | Courriel, notification, attestation partis au mauvais moment ou à la mauvaise personne, ou jamais                             | Paiement confirmé sans attestation ni valideur                |
| F       | Le geste introuvable       | L'action existe dans l'API mais aucune surface ne la propose, ou l'inverse                                                    | —                                                             |
| G       | La saisie libre réelle     | Ce que l'utilisateur tape vraiment : accents, espaces en bout, apostrophes, « prénom nom », copier-coller                     | « helene », « Hélène D'Artagnan » introuvables                |
| H       | L'environnement            | Fuseau, minuit, fin de période, navigateur, deux onglets, réseau lent, webhook rejoué                                         | Échéance qui change selon le fuseau                           |
| I       | Ce qu'on ne doit pas voir  | Donnée servie à un rôle qui ne devrait pas la lire, ou d'un autre tenant                                                      | Motif de suspension servi à qui ne devait pas le voir         |

## Deux grilles pour ne rien oublier

**SFDPOT** (James Bach), pour parcourir le module : _Structure_ (fichiers, tables, files), _Function_ (ce qu'il fait), _Data_ (saisies, états, bornes), _Platform_ (web, mobile, courriel, PDF), _Operations_ (qui l'utilise, quand, sous quelle charge), _Time_ (fuseaux, échéances, périodes).

**FEW HICCUPPS** (Michael Bolton), pour juger un comportement : cohérent avec _Familiarity_ (les défauts connus), _Explainability_, _World_, _History_ (versions précédentes), _Image_, _Comparable products_, _Claims_ (specs, registre, promesses commerciales), _User expectations_, _Product_ (cohérence interne : deux écrans), _Purpose_, _Statutes_ (loi, RGPD). Un invariant `I-n` cite l'oracle qu'il applique.

## Gabarit de l'inventaire (`docs/recette/<module>/inventaire.md`)

```markdown
# Recette humaine — inventaire du module `<module>`

**Date :** … · **Base :** `develop` à `<sha>` · **Statut :** à valider par le produit avant tout test.

Périmètre retenu : … (objet central, objets satellites, ce qui est exclu et pourquoi).
Méthode : neuf familles (A…I). `[code]` / `[spec]` / `[règle]` / `[proto]`. Ordre d'autorité : registre > ADR > spec > code > prototype.

## 1. Les rôles

## 2. Les objets, leurs états et transitions

## 3. Table état × geste de <l'objet central>

## 4. Les surfaces par objet

## 5. Les invariants de cohérence

## 6. Les saisies à risque

## 7. Les gestes coûteux

## 8. Le temps

## 9. Les traitements sans écran

## 10. Les définitions en double

## 11. Les 15 premiers tests à écrire

## 12. Les défauts candidats (constat en lecture, rien de corrigé)

## 13. Les trous : questions pour le produit (15 au plus, « bloque un test » marqué)

## 14. Première passe de tests (date, après validation)

## Annexe : prochaines étapes
```

Colonnes attendues :

- § 3 : une ligne par état, une colonne par geste ; case `permis`, `refusé (CODE)`, `?`. Source de chaque case en note.
- § 5 : `I-n | ce qui doit être vrai | surfaces | oracle (FEW HICCUPPS) | statut (tenu / rompu / inconnu) + source`.
- § 11 : `# | famille | geste humain | attendu | type (GF / PN / IC) | écrivable maintenant ou bloqué par T-n`.
- § 12 : `D-n | constat | source | famille | test qui le prouverait`.
- § 13 : `T-n | question | sources en contradiction ou absentes | bloque le test n° | réponse (vide)`.

## Types de tests

| Type | Nom                    | Où                                                   | Ce qu'il prouve                                                                                   |
| ---- | ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GF   | garde-fou              | `recette.<sujet>.db.spec.ts` à côté du repository    | Une transition, un refus, une écriture sous concurrence (base réelle)                            |
| PN   | parcours               | `tests/recette-<sujet>.spec.ts`                      | Un geste humain de bout en bout (Playwright)                                                      |
| IC   | invariant de cohérence | `recette.<sujet>.spec.ts` dans `apps/api`            | Deux surfaces disent la même chose : lu au catalogue partagé, jamais une application dans l'autre |

Un test de concurrence lance les deux gestes par `Promise.allSettled`, puis compte ce qui est en base **et** vérifie la nature du refus (code d'erreur), pas seulement le nombre de succès.

## Le ticket d'un défaut

Un défaut confirmé devient un ticket `Type: défaut`, au format « prêt pour agent ». Sa ligne `Règles:` reprend les règles de l'inventaire, par leur identifiant complet (`Règles: RULE_ALL_LIC-3`). Son corps cite la ligne `D-n`. Sa section `## Surfaces` nomme le test rouge qui prouvera la correction, dans une colonne « Preuve » :

```markdown
## Surfaces

| Surface             | Preuve                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ |
| refus à l'échéance  | `apps/api/src/licence/recette.licence.db.spec.ts` « [RULE_ALL_LIC-3] refuse une licence expirée » |
| écran de renouvellement | `tests/recette-licence.spec.ts` « affiche la date d'échéance », « propose le renouvellement » |
```

- Le fichier de test entre accents graves (`*.spec.ts`, `*.test.ts`, `*.e2e-spec.ts`), puis le **titre exact** de chaque test entre « » ou "" ; plusieurs titres d'un même fichier se suivent, séparés par des virgules.
- Le titre est celui du premier argument de `it(…)` ou `test(…)`, caractère pour caractère : le gate le cherche littéralement.
- Quand le ticket passe `Fait`, le gate refuse un test introuvable, et un test désactivé (`it.skip`, `test.skip`, `xit`, `it.todo`, ou sous un `describe.skip`) : il ne prouve rien.

## Ce qu'un premier passage a appris

- Les défauts vivent aux coutures : entre surfaces, entre chemins jumeaux, entre deux fonctions qui normalisent, sous deux clics. Chercher là d'abord.
- « N'inventer aucune règle » est la contrainte la plus productive : quarante questions sourcées, dont deux bloquaient des tickets. Quinze suffisent si on marque celles qui bloquent.
- Un test qui clignote était une course réelle.
- Un test qui lit une surface comme texte se casse à chaque refonte ; lire le catalogue partagé.
- Le correctif d'un défaut de concurrence a lui-même eu un défaut, trouvé par la revue adversariale : la recette ne remplace pas la chaîne, elle la précède.
