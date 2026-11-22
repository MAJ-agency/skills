// Mutations du tour 2 (sommet 277e949), sur les bancs neufs du delta : même harnais que
// 83-85-annexes/mutations.mjs (un texte exact remplacé, les bancs nommés joués, le fichier remis après chacune).
// À lancer depuis la racine d'un clone où la PR est commitée : `node <chemin>/mutations-tour-2.mjs [<nom>…]`.
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
  ["Y1 tickets.mjs : sous --geler-types, la dette est récrite avant la sortie 1 d'un index illisible", TM, "    process.exit(1);\n  }\n  if (lu !== null", "    if (process.argv.includes('--geler-types')) writeFileSync(join(ROOT, 'scripts/verify/tickets-dette.json'), '{}\\n');\n    process.exit(1);\n  }\n  if (lu !== null", [BG]],
  ["Y2 tickets.mjs : sous --geler-fiches seul, un index illisible se tait", TM, "    process.exit(1);\n  }\n  if (lu !== null", "    if (!process.argv.includes('--geler-fiches')) process.exit(1);\n  }\n  if (lu !== null", [BG]],
  ["Y3 tickets.mjs : en régime 8, le mode est toujours observe", TM, "mode: lu.project?.sufficiency === 'enforce' ? 'enforce' : 'observe',", "mode: regime === 8 ? 'observe' : lu.project?.sufficiency === 'enforce' ? 'enforce' : 'observe',", [BG]],
  ["Y4 tickets.mjs : en régime 8, le mode est toujours enforce", TM, "mode: lu.project?.sufficiency === 'enforce' ? 'enforce' : 'observe',", "mode: regime === 8 || lu.project?.sufficiency === 'enforce' ? 'enforce' : 'observe',", [BG]],
  ["Y5 tickets.mjs : l'index illisible ne dit pas sa cause", TM, "illisible (${e.message.split('\\n')[0]}) :", 'illisible :', [BG]],
  ["Y6 tickets.mjs : au pivot 3 sans rules, rien n'est jugé", TM, "if (lu !== null && typeof lu === 'object' && lu.schema === '3') {", "if (lu !== null && typeof lu === 'object' && lu.schema === '3' && Array.isArray(lu.rules)) {", [BG]],
  ["Y7 tickets.mjs : un index null est jugé comme un pivot 3 vide", TM, "if (lu !== null && typeof lu === 'object' && lu.schema === '3') {", "if (lu === null || (typeof lu === 'object' && lu.schema === '3')) {", [BG]],
  ["Y8 tickets-regles.mjs : Prouve: lue sans les puces", TR, "const PROUVE_EN_TETE = ligneDEnTete('Prouve');", 'const PROUVE_EN_TETE = /^\\**Prouve\\**\\s*:\\**\\s*(.*)$/i;', [BT]],
  ["Y9 tickets-regles.mjs : Prouve: lue sans la puce étoile", TR, "const PROUVE_EN_TETE = ligneDEnTete('Prouve');", 'const PROUVE_EN_TETE = /^(?:-[ \\t]+)?\\**Prouve\\**\\s*:\\**\\s*(.*)$/i;', [BT]],
  ["Y10 tickets-regles.mjs : Prouve: sensible à la casse", TR, "const PROUVE_EN_TETE = ligneDEnTete('Prouve');", "const PROUVE_EN_TETE = new RegExp(ligneDEnTete('Prouve').source);", [BT]],
  ["Y11 gabarit de règle : caseRevision sans by", GR, '#   date: AAAA-MM-JJ\n#   by: <clé de roles>\n#   reason: "…"', '#   date: AAAA-MM-JJ\n#   reason: "…"', [PS]],
  ["Y12 gabarit de règle : caseRevision sans « jamais écrite par un agent »", GR, "un seul, le plus récent ; jamais écrite par un agent : signée", 'un seul, le plus récent ; signée', [PS]],
  ["Y13 gabarit de règle : caseRevision avant notApplicableFamilies", GR, "# notApplicableFamilies:", "# caseRevision: (déplacé)\n# notApplicableFamilies:", [PS]],
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
