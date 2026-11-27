---
id: RULE_ALL_FAC-16
title: Le total d'une facture est la somme de ses lignes
validation:
  {
    status: validated,
    date: 2026-11-16,
    by: une-personne,
    reason: "validée en réunion du mois de novembre, point trois",
  }
sources:
  - {
      ref: "réunion du 2026-11-10, point 3",
      path: docs/metier/reunions/r.md,
      at: section 2,
    }
code:
  [
    apps/api/src/facture/total.ts,
    apps/api/src/facture/lignes.ts,
    apps/web/src/facture/total.tsx,
  ]
criticality: {
    level: high,
    by: agent,
    reason: "Une erreur sur le total coûte de l argent au client et au cabinet, et personne ne la voit avant la clôture du mois",
  } # fixée par le skill criticite
---

L'énoncé.
