// Mutations ajoutées par la relecture, PR « tickets » (83 à 85).
const TR = 'skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs';
const TM = 'skills/chaine/tickets/references/scripts/verify/tickets.mjs';
const BT = 'skills/chaine/tickets/references/scripts/verify/tickets.test.mjs';
const BG = 'skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs';
const CT = 'skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs';
const BC = 'skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs';
const CR = 'skills/chaine/revue-de-ticket/references/criteres-ticket.md';
const CR8 = 'skills/chaine/relecture/references/criteres-ticket.md';
const DT = 'scripts/depot.test.mjs';
const BR8 = 'scripts/relecture.test.mjs';
export const MUTATIONS = [
  ["X1 tickets.mjs : un schema 3 en nombre se juge comme \"3\"", TM, "lu.schema === '3'", "String(lu.schema) === '3'", [BG, BT]],
  ["X2 tickets.mjs : un niveau hors vocabulaire compte pour une criticité", TM, "criticite: ['low', 'medium', 'high'].includes(r.criticality?.level) ? r.criticality.level : null,", "criticite: r.criticality?.level ?? null,", [BG, BT]],
  ["X3 tickets.mjs : validation.status n'est pas lu (aucune règle close)", TM, "close: ['rejected', 'obsolete'].includes(r.validation?.status),", "close: false,", [BG, BT]],
  ["X4 tickets.mjs : une règle obsolète se juge", TM, "close: ['rejected', 'obsolete'].includes(r.validation?.status),", "close: ['rejected'].includes(r.validation?.status),", [BG, BT]],
  ["X5 tickets.mjs : un cas sans id compte (identifiant undefined)", TM, ".map((c) => c?.id).filter((c) => typeof c === 'string'),", ".map((c) => c?.id),", [BG, BT]],
  ["X6 tickets-regles.mjs : Prouve: lue dans tout le fichier", TR, "  tete(lignes).forEach((brute, i) => {\n    const m = PROUVE_EN_TETE", "  lignes.forEach((brute, i) => {\n    const m = PROUVE_EN_TETE", [BT]],
  ["X7 tickets-regles.mjs : une règle citée deux fois se juge deux fois", TR, "const ids = [...new Set([...regles, ...prouve].flatMap((r) => (r.valeur === '—' ? [] : reglesCitees(r.valeur).cites)))]", "const ids = [...[...regles, ...prouve].flatMap((r) => (r.valeur === '—' ? [] : reglesCitees(r.valeur).cites))]", [BT, BG]],
  ["X8 contexte-ticket.mjs : le commentaire de Prouve: n'est pas retiré", CT, ".replace(/^Prouve\\s*:/, \"\")\n  .replace(/\\s#.*$/, \"\");", ".replace(/^Prouve\\s*:/, \"\");", [BC]],
  ["X9 contexte-ticket.mjs : la ligne Prouve: lue n'importe où dans le ticket", CT, "const ligneProuve = entete\n", "const ligneProuve = texteTicket\n", [BC]],
  ["X10 tickets.mjs : l'index illisible sort en 0 (se tait sans juger)", TM, "    process.exit(1);\n  }\n  if (lu !== null", "    process.exit(0);\n  }\n  if (lu !== null", [BG]],
  // Sur l'arbre retouché (retouche-85-T3-porte-par-prouve) seulement : la clause (d) de T3.
  ["X11 critère T3 (d) : un cas porté par un ticket qui le prouve sur Prouve: ne compte plus", CR, "sa ligne `Règles:` ou\n        `Prouve:` cite la règle ; ni la mention ni cette ligne ne sont ajoutées", "sa ligne `Règles:`\n        cite la règle ; ni la mention ni cette ligne ne sont ajoutées", [DT]],
  ["X12 critère T3 (d) du régime 8 : idem", CR8, "sa ligne `Règles:` ou\n        `Prouve:` cite la règle ; ni la mention ni cette ligne ne sont ajoutées", "sa ligne `Règles:`\n        cite la règle ; ni la mention ni cette ligne ne sont ajoutées", [BR8]],
];
