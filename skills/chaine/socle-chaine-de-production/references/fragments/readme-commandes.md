| `pnpm check:tickets`                                 | le gate des tickets (`Status:`, `Type:`, `Règles:`, `Blocked by:`, format prêt pour agent) et les tests des scripts d'agent |
| `node scripts/docs/ticket-libre.mjs <id>`            | un ticket est-il libre ? à lancer avant de coder                                                        |
| `node scripts/docs/next-id.mjs <TYPE> <CTX> <TRI>`   | le prochain numéro libre d'un type, d'un contexte et d'un trigramme (`SPEC ALL SOC`, `ADR ALL ARC`)     |
| `node scripts/docs/avancement.mjs <sujet/x\|SPEC>`   | l'avancement d'un chantier, sans réveiller l'architecte                                                 |
