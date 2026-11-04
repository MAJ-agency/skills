# Ouvrir le registre des règles métier

Status: ready-for-human
Type: task

`docs/metier/regles/` n'existe pas encore — normal, il naît avec sa première règle. Ce ticket rappelle **comment** l'ouvrir, pour que la première règle écrite le soit correctement.

Bloqué par : `1-modeliser-le-domaine`.

## Structure

Un fichier par sujet dans `docs/metier/regles/`, nommé **`<TRI>-regles.md`** — hors nomenclature : l'identifiant `<TRI>-<N>` est celui de la **règle** (`LIC-1`, `LIC-2`…), stable, attribué dans l'ordre, jamais réutilisé ; le fichier n'en porte pas, ainsi `LIC-3` désigne toujours une règle. Le trigramme s'inscrit **au registre avant** le premier fichier : `docs/methode/nomenclature.md`.

## Le cycle, et ce qui ne se négocie pas

```
candidate ──(geste humain)──▶ validée ──▶ implémentée
     ├──▶ rejetée   (avec sa raison)
     └──▶ obsolète  (avec sa raison)
```

- **Aucune machine n'écrit « validée ».** Ni skill, ni agent.
- **Une règle n'est jamais supprimée** : elle est marquée avec sa raison. L'historique des arbitrages vaut mieux qu'un fichier propre.
- **Un test qui couvre une règle porte son identifiant dans son nom** — c'est le lien vérifiable entre le registre et le code.
- **Signal d'alerte** : un stock de `candidate` non arbitrées qui gonfle. La validation ne suit pas, et le registre ment par omission.

## Comments
