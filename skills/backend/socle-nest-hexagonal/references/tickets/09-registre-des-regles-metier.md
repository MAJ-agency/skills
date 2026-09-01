# Ouvrir le registre des règles métier

Status: ready-for-human
Type: task

`docs/metier/` n'existe pas encore — normal, il naît avec sa première règle. Ce ticket rappelle **comment** l'ouvrir, pour que la première règle écrite le soit correctement.

Bloqué par : `01-modeliser-le-domaine`.

## Structure

Un fichier par domaine dans `docs/metier/regles/`, avec des **identifiants stables** préfixés par le trigramme du sujet (`XXX-001`, `XXX-002`…). Le trigramme s'inscrit **au registre avant** le premier fichier : `docs/methode/nomenclature.md`.

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
