---
id: RULE_ALL_FAC-16
title: "Le total d'une facture : la somme de ses lignes"
code:
  - apps/api/src/facture/total.ts
criticality:
  level: high
  by: agent
  reason: "Une erreur sur le total coûte de l argent au client et au cabinet, et personne ne la voit avant la clôture du mois"
---

L'énoncé.
