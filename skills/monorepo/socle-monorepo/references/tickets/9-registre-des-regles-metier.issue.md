# SPEC_ALL_SOC-1.09 — Ouvrir le registre des règles métier

Status: ready-for-human
Type: task
Blocked by: 01

`docs/metier/regles/all/` est posé vide par le socle : le registre naît avec sa première règle. Ce ticket rappelle **comment** l'ouvrir, pour que la première règle écrite le soit correctement.


## Structure

**Une règle est un fichier** : `docs/metier/regles/all/RULE_ALL_<TRI>-<n>.md`, d'après le gabarit `docs/agents/gabarits/regle.md`. En haut, un en-tête YAML validé (identifiant, titre, validation, sources, liens) ; en bas, l'énoncé en markdown libre. Le trigramme du sujet s'inscrit **au registre des trigrammes avant** la première règle (`docs/methode/nomenclature.md`) ; le numéro vient de `node scripts/docs/next-id.mjs RULE ALL <TRI>`. Décision et raisons : `ADR_ALL_ARC-<N>` (le registre, un fichier par règle).

## Le cycle, et ce qui ne se négocie pas

```
validation (humaine)   candidate ──(geste humain)──▶ validated · rejected · obsolete (avec raison)
réalisation (calculée) to-build · configured · proven — jamais écrite à la main
```

- **Aucune machine n'écrit `validated`.** Ni skill, ni agent.
- **Personne n'écrit « implémentée ».** Un test qui prouve une règle porte son identifiant entre crochets en tête de son nom : `it('[RULE_ALL_LIC-2] …')`. C'est le lien vérifiable entre le registre et le code, et c'est ce que lit l'index.
- **Une règle n'est jamais supprimée** : elle est marquée avec sa raison. L'historique des arbitrages vaut mieux qu'un fichier propre.
- **Signal d'alerte** : un stock de `candidate` non arbitrées qui gonfle, ou des `candidate` qui ont des tests. La validation ne suit pas, et le registre ment par omission.

## Comments
