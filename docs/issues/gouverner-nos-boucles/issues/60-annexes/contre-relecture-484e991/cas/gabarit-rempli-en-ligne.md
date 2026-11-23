---
id: RULE_ALL_FAC-16
title: Le total d'une facture est la somme de ses lignes
validation:
  status: validated # candidate | validated | rejected | obsolete — seul un humain écrit validated
  date: 2026-11-16
  by: une-personne
  reason: validée en réunion
exception: { status: not-applicable, reason: sans objet ici }
epics: [ facture ]
instanceOf: RULE_ALL_FAC-2
sources:
  - { ref: "réunion du 2026-11-10, point 3", path: docs/metier/reunions/r.md, at: section 2 }
decisions:
  - { date: 2026-11-16, text: on arrondit au centime, by: une-personne }
links:
  - { type: refines, target: RULE_ALL_FAC-3 }
config:
  - { key: facture.arrondi, value: centime }   # une règle qui déclare des clés et n'a pas de test est « configurée »
code: [ apps/api/src/facture/total.ts ]   # fichiers de code qui réalisent la règle
criticality: { level: high, by: agent, reason: "une erreur coûte de l'argent, level: low n'y change rien" }   # fixée par le skill criticite
cases:
  - { id: total-nominal, title: "le total de deux lignes", kind: nominal, scope: business, family: limits }
notApplicableFamilies:
  - { family: time, reason: le total ne dépend pas de la date }
extensions: {}
---

L'énoncé.
