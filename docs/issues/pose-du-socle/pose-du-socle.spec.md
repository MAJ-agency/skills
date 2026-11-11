# Pose du socle : les écarts relevés par une pose complète

> Date : 2026-11-10 — Statut : deux tickets, prêts pour agent, lancement sur accord du produit — Origine : pose complète d'un dépôt vide (monorepo, contrats, api, web, tests, chaîne) jouée par le ticket `5` du lot `standard-documentation` (PR #43), qui a relevé des écarts **sans rapport avec la grammaire des identifiants**.

## Ce qu'on corrige

Un projet posé par le plugin doit sortir propre : rien que la CI ou un audit de workflow signale, aucun index déclaré mais absent, aucun fichier écrit par un outil que le socle ne prévoit pas. Ces écarts existent sur `main` (3.10.x) comme sur `sujet/standard-documentation` : ils se corrigent sur `main`, le sujet les reçoit par un merge de `main`.

| Ticket | Objet                                                                                      |
| ------ | ------------------------------------------------------------------------------------------ |
| 1      | `ci.yml` du gabarit de la chaîne : plus d'expression `${{ }}` dans un `run:`               |
| 2      | Quatre écarts mineurs de la pose : `couts.md`, zone `test:db`, `AGENTS.md`, ligne Prettier |

## Hors périmètre

La grammaire des identifiants (lot `standard-documentation`).
