---
id: RULE_ALL_FAC-16
title: "Le total d'une facture : la somme de ses lignes"
validation:
  status: candidate
  # date: AAAA-MM-JJ        obligatoire dès que le statut n'est plus candidate
sources:
  - ref: réunion du 2026-11-10
    path: docs/metier/reunions/r.md
code:
  - apps/api/src/facture/total.ts
  - "apps/web/src/app/(compte)/[id]/page.tsx"
criticality:
  level: high
  by: agent
  reason: "Une erreur coûte de l'argent."
cases:
  - id: total-nominal
    title: "le total de deux lignes"
    kind: nominal
    scope: business
    family: limits
notApplicableFamilies:
  - family: time
    reason: "le total ne dépend pas de la date"
extensions:
  projet:
    chantier: facture
    seuils:
      - 10
      - 20
---

L'énoncé.
