---
id: R
validation:
  status: validated
  detail:
    {
      a: une valeur longue longue longue longue longue longue longue longue longue longue,
      b: "une valeur longue longue longue longue longue longue longue longue longue longue",
    }
  liste:
    [
      une valeur longue longue longue longue longue longue longue longue longue longue,
      "une valeur longue longue longue longue longue longue longue longue longue longue",
    ]
sources:
  - ref: x
    detail:
      {
        a: une valeur longue longue longue longue longue longue longue longue longue longue,
        b: "une valeur longue longue longue longue longue longue longue longue longue longue",
      }
  - {
      a: une valeur longue longue longue longue longue longue longue longue longue longue,
      b: "une valeur longue longue longue longue longue longue longue longue longue longue",
    }
  - [
      une valeur longue longue longue longue longue longue longue longue longue longue,
      "une valeur longue longue longue longue longue longue longue longue longue longue",
    ]
cases:
  - id: c
    liste:
      - {
          a: une valeur longue longue longue longue longue longue longue longue longue longue,
          b: "une valeur longue longue longue longue longue longue longue longue longue longue",
        }
criticality:
  {
    level: high,
    by: agent,
    reason: "une valeur longue longue longue longue longue longue longue longue longue longue, une valeur longue longue longue longue longue longue longue longue longue longue",
  }
code:
  [
    "apps/web/src/app/(compte)/[id]/page.tsx",
    apps/api/src/facture/total.ts,
    apps/api/src/facture/lignes.ts,
  ]
vide:
  {
    a: une valeur longue longue longue longue longue longue longue longue longue longue,
    b: "une valeur longue longue longue longue longue longue longue longue longue longue",
    c: "l'un",
  }
---
