#!/usr/bin/env node
/** Hook PreToolUse (Bash) : commandes interdites ou soumises à l'humain. */
import { lireEntree } from './entree.mjs';
import { decisionCommande } from './regles.mjs';

const commande = lireEntree().tool_input?.command ?? '';
const d = decisionCommande(commande);
if (d?.decision === 'refuser') {
  process.stderr.write(`${d.raison}\n`);
  process.exit(2);
}
if (d?.decision === 'demander') {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: d.raison } }));
}
