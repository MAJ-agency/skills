// Mutations ajoutées par la contre-relecture de la PR « tickets » (tour 1, sommet a95ab89) : même harnais que
// 83-85-annexes/mutations.mjs (un texte exact remplacé, les bancs nommés joués, le fichier remis après chacune).
// À lancer depuis la racine d'un clone où la PR est commitée : `node <chemin>/mutations-contre.mjs [<nom>…]`.
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const TR = 'skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs';
const TM = 'skills/chaine/tickets/references/scripts/verify/tickets.mjs';
const BT = 'skills/chaine/tickets/references/scripts/verify/tickets.test.mjs';
const BG = 'skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs';
const CT = 'skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs';
const BC = 'skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs';
const DT = 'scripts/depot.test.mjs';
const PS = 'scripts/preuve-suffisante-standard.test.mjs';
const GR = 'skills/chaine/tickets/references/gabarits/regle.md';
const TOUS = [BT, BG, DT, PS];

const MUTATIONS = [
  ["X1 tickets.mjs : l'index n'est lu qu'en régime 7 (K3 muet en régime 8)", TM, 'if (existsSync(INDEX_ANCHORPOST)) {', 'if (regime === 7 && existsSync(INDEX_ANCHORPOST)) {', [BT, BG]],
  ["X2 tickets-regles.mjs : la preuve suffisante ne se juge pas en régime 8", TR, 'const ids = [...new Set([...regles, ...prouve]', 'const ids = regime === 8 ? [] : [...new Set([...regles, ...prouve]', [BT, BG]],
  ["X3 tickets.mjs : sous --elaguer, un index qui n'est pas du JSON se tait", TM, "    process.exit(1);\n  }\n  if (lu !== null", "    if (!process.argv.includes('--elaguer')) process.exit(1);\n  }\n  if (lu !== null", [BT, BG]],
  ["X4 tickets.mjs : sous --geler-*, un index qui n'est pas du JSON se tait", TM, "    process.exit(1);\n  }\n  if (lu !== null", "    if (!process.argv.some((a) => a.startsWith('--geler-'))) process.exit(1);\n  }\n  if (lu !== null", [BT, BG]],
  ["X5 tickets.mjs : en régime 8, un index qui n'est pas du JSON se tait (le comportement de main)", TM, "    process.exit(1);\n  }\n  if (lu !== null", "    if (regime !== 8) process.exit(1);\n  }\n  if (lu !== null", [BT, BG]],
  ["X6 tickets.mjs : un index JSON null fait tomber le gate", TM, 'if (lu !== null && typeof lu === \'object\' && lu.schema === \'3\')', "if (typeof lu === 'object' && lu.schema === '3')", [BT, BG]],
  ["X7 tickets.mjs : un index au pivot 3 sans rules fait tomber le gate", TM, '(Array.isArray(lu.rules) ? lu.rules : [])', '(lu.rules)', [BT, BG]],
  ["X8 tickets-regles.mjs : Prouve: ne se juge que sur un ticket prêt", TR, '  for (const p of prouve) {', "  for (const p of status?.valeur === 'ready-for-agent' ? prouve : []) {", [BT, BG]],
  ["X9 tickets-regles.mjs : le mode n'est pas dit dans le message", TR, 'preuve suffisante (${suffisance.mode}) : ${e}', 'preuve suffisante (observe) : ${e}', [BT, BG]],
  ["X10 contexte-ticket.mjs : un jeton illisible de Prouve: n'est pas signalé", CT, '  for (const j of illisibles(valeurProuve))\n    out.push(', '  for (const j of [])\n    out.push(', [BC]],
  ["X11 gabarit de règle : sans le bloc caseRevision", GR, '# caseRevision:   à partir de la CLI Anchorpost 2.0.0', '# (rien)', TOUS],
  ["X13 tickets-regles.mjs : Prouve: lue sur la seule forme nue", TR, "const PROUVE_EN_TETE = ligneDEnTete('Prouve');", 'const PROUVE_EN_TETE = /^Prouve\\s*:\\s*(.*)$/;', [BT, BG]],
  ["X14 tickets-regles.mjs : un cas nommé dans Surfaces suffit pour toute règle (identifiant de règle ignoré)", TR, "if (!nommes.has(`${id}#${c}`))", "if (![...nommes].some((n) => n.endsWith(`#${c}`)))", [BT, BG]],
  ["X15 tickets.mjs : les avertissements écrits sur la sortie d'erreur", TM, "  for (const a of avertissements) console.log(`  ${a}`);", "  for (const a of avertissements) console.error(`  ${a}`);", [BT, BG]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
