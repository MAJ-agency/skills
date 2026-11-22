// Les mutations de la PR « tickets » (tickets 83 à 85, retouchées par la relecture, A-202) : chacune remplace un texte exact d'un fichier, joue les bancs
// qu'elle vise, et doit les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un
// clone où le patch de la PR est appliqué : `node <chemin>/mutations.mjs [<nom>…]`.
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
const COPIE = 'docs/issues/standard-documentation/preuve-suffisante.spec.md';
const GR = 'skills/chaine/tickets/references/gabarits/regle.md';
const GT = 'skills/chaine/tickets/references/gabarits/ticket.issue.md';
const CR = 'skills/chaine/revue-de-ticket/references/criteres-ticket.md';
const CR8 = 'skills/chaine/relecture/references/criteres-ticket.md';
const BR8 = 'scripts/relecture.test.mjs';

const MUTATIONS = [
  ["P1 tickets-regles.mjs : la ligne Prouve: n'est pas lue", TR, "const PROUVE_EN_TETE = ligneDEnTete('Prouve');", "const PROUVE_EN_TETE = ligneDEnTete('Prouve-jamais');", [BT, BG]],
  ["P2 tickets-regles.mjs : une règle sur Règles: et sur Prouve: passe", TR, "    for (const r of reglesCitees(p.valeur).cites.filter((x) => realisees.has(x)))", "    for (const r of reglesCitees(p.valeur).cites.filter(() => false))", [BT]],
  ["P3 tickets-regles.mjs : Prouve: — passe", TR, "    if (p.valeur === '—') {\n      erreurs.push", "    if (p.valeur === '—' && false) {\n      erreurs.push", [BT]],
  ["P4 tickets-regles.mjs : Prouve: n'entre pas dans la preuve suffisante", TR, "const ids = [...new Set([...regles, ...prouve].flatMap(", "const ids = [...new Set([...regles].flatMap(", [BT, BG]],
  ["S1 tickets-regles.mjs : en enforce, un avertissement et non un refus", TR, "(suffisance.mode === 'enforce' ? erreurs : avertissements).push", "(suffisance.mode === 'jamais' ? erreurs : avertissements).push", [BT, BG]],
  ["S2 tickets-regles.mjs : en observe, un refus et non un avertissement", TR, "(suffisance.mode === 'enforce' ? erreurs : avertissements).push", "(suffisance.mode !== 'jamais' ? erreurs : avertissements).push", [BT, BG]],
  ["S3 tickets-regles.mjs : une règle « à classer » passe", TR, "    if (!r.criticite) ecarts.push(", "    if (false) ecarts.push(", [BT, BG]],
  ["S4 tickets-regles.mjs : une règle sans cas passe", TR, "    if (r.cas.length === 0) ecarts.push(", "    if (false) ecarts.push(", [BT, BG]],
  ["S5 tickets-regles.mjs : un cas que ## Surfaces ne nomme pas passe", TR, "      if (!nommes.has(`${id}#${c}`)) ecarts.push(", "      if (false) ecarts.push(", [BT, BG]],
  ["S6 tickets-regles.mjs : un cas voisin (#nominal-bis) nomme #nominal", TR, "match(new RegExp(`${REGLE}#[a-z0-9]+(?:-[a-z0-9]+)*`, 'g'))", "match(new RegExp(`${REGLE}#[a-z0-9]+`, 'g'))", [BT]],
  ["S7 tickets-regles.mjs : une règle absente de l'index passe", TR, "    if (r === null) {\n      ecarts.push(", "    if (r === null) {\n      continue;\n      ecarts.push(", [BT]],
  ["S8 tickets-regles.mjs : une règle rejetée ou obsolète se juge", TR, "    if (r.close) continue;", "    if (r.close && false) continue;", [BT]],
  ["S9 tickets-regles.mjs : un ticket prêt gelé se juge", TR, "  if (pret && !gele) {\n    for (const e of ecartsFormatPret", "  if (pret) {\n    if (!gele) for (const e of ecartsFormatPret", [BT]],
  ["G1 tickets.mjs : un index au schéma 2 se juge comme le pivot 3", TM, "lu.schema === '3'", "['2', '3'].includes(lu.schema)", [BG]],
  ["G2 tickets.mjs : project.sufficiency n'est pas lu (toujours observe)", TM, "mode: lu.project?.sufficiency === 'enforce' ? 'enforce' : 'observe',", "mode: 'observe',", [BG]],
  ["G3 tickets.mjs : un index qui n'est pas du JSON se tait", TM, "    process.exit(1);\n  }\n  if (lu !== null", "    lu = null;\n  }\n  if (lu !== null", [BG]],
  ["G4 tickets.mjs : les avertissements ne sont pas écrits", TM, "  for (const a of avertissements) console.log(`  ${a}`);", "", [BG]],
  ["G5 tickets.mjs : la criticité se lit à la racine de la règle (forme nue)", TM, "['low', 'medium', 'high'].includes(r.criticality?.level) ? r.criticality.level : null", "['low', 'medium', 'high'].includes(r.criticality) ? r.criticality : null", [BG]],
  ["C1 contexte-ticket.mjs : la ligne Prouve: n'est pas rendue", CT, "rendreLigne(reglesProuvees, \"Prouve\", \"règle prouvée par le ticket, sans la réaliser\");", "", [BC]],
  ["C2 contexte-ticket.mjs : une règle des deux lignes est rendue deux fois", CT, "const reglesProuvees = identifiantsCites(valeurProuve).filter(\n  (c) => !reglesRealisees.includes(c),\n);", "const reglesProuvees = identifiantsCites(valeurProuve);", [BC]],
  ["C3 contexte-ticket.mjs : une règle de Prouve: est répétée parmi les cités", CT, "const reglesDuTicket = [...reglesRealisees, ...reglesProuvees];", "const reglesDuTicket = [...reglesRealisees];", [BC]],
  ["D1 copie de la spec : celle du 2026-11-13 (la tête d'avant)", COPIE, "branche `develop` (`2be4e7e`, fichier inchangé depuis `ee9b8a2` du 2026-11-20)", "branche `claude/ecstatic-brahmagupta-bg4l0s`, commit `10dc74c`", [DT, PS]],
  ["D2 copie de la spec : le nom d'une personne dans un exemple", COPIE, "\"by\": \"Alice Martin\" }\n    }\n  ]\n}", "\"by\": \"Une Personne\" }\n    }\n  ]\n}", [DT, PS]],
  ["D3 gabarit de règle : sans la date de la criticité", GR, "#   date: AAAA-MM-JJ # facultative, à partir de la CLI Anchorpost 2.0.0 ; jamais écrite par un agent", "# date facultative, jamais écrite par un agent", [DT, PS]],
  ["D4 gabarit de ticket : sans la ligne Prouve:", GT, "Prouve: {{RULE_ALL_<TRI>-<n> — les règles", "Preuve: {{RULE_ALL_<TRI>-<n> — les règles", [DT, PS]],
  ["D5 critère T3 : Prouve: n'est plus lue", CR, "règles sont celles des lignes `Règles:` et `Prouve:` du ticket", "règles sont celles de la ligne `Règles:` du ticket", [DT, PS]],
  ["D6 critère T3 du régime 8 (relecture) : Prouve: n'est plus lue", CR8, "règles sont celles des lignes `Règles:` et `Prouve:` du ticket", "règles sont celles de la ligne `Règles:` du ticket", [BR8]],
  // Relecture, tour 1 (A-202) : la lecture de l'index commis, le doublon, le contexte, la clause (d) de T3, le gabarit.
  ["G6 tickets.mjs : un schema 3 en nombre se juge comme \"3\"", TM, "lu.schema === '3'", "String(lu.schema) === '3'", [BG]],
  ["G7 tickets.mjs : un niveau hors vocabulaire compte pour une criticité", TM, "criticite: ['low', 'medium', 'high'].includes(r.criticality?.level) ? r.criticality.level : null,", "criticite: r.criticality?.level ?? null,", [BG]],
  ["G8 tickets.mjs : validation.status n'est pas lu (aucune règle close)", TM, "close: ['rejected', 'obsolete'].includes(r.validation?.status),", "close: false,", [BG]],
  ["G9 tickets.mjs : une règle obsolète se juge", TM, "close: ['rejected', 'obsolete'].includes(r.validation?.status),", "close: ['rejected'].includes(r.validation?.status),", [BG]],
  ["G10 tickets.mjs : un cas sans id compte", TM, ".map((c) => c?.id).filter((c) => typeof c === 'string'),", ".map((c) => c?.id),", [BG]],
  ["S10 tickets-regles.mjs : une règle citée sur deux lignes se juge deux fois", TR, "const ids = [...new Set([...regles, ...prouve].flatMap((r) => (r.valeur === '—' ? [] : reglesCitees(r.valeur).cites)))]", "const ids = [...[...regles, ...prouve].flatMap((r) => (r.valeur === '—' ? [] : reglesCitees(r.valeur).cites))]", [BT]],
  ["C4 contexte-ticket.mjs : la ligne Prouve: se lit hors de l'en-tête", CT, "const ligneProuve = entete\n", "const ligneProuve = texteTicket\n", [BC]],
  ["C5 contexte-ticket.mjs : le commentaire de Prouve: n'est pas retiré", CT, ".replace(/^Prouve\\s*:/, \"\")\n  .replace(/\\s#.*$/, \"\");", ".replace(/^Prouve\\s*:/, \"\");", [BC]],
  ["D7 critère T3 (d) : un cas porté par un ticket qui le prouve sur Prouve: ne compte plus", CR, "sa ligne `Règles:` ou\n        `Prouve:` cite la règle", "sa ligne `Règles:`\n        cite la règle", [DT, PS]],
  ["D8 critère T3 (d) du régime 8 : un cas porté par un ticket qui le prouve sur Prouve: ne compte plus", CR8, "sa ligne `Règles:` ou\n        `Prouve:` cite la règle", "sa ligne `Règles:`\n        cite la règle", [BR8]],
  ["D9 gabarit de ticket : la criticité qui ne descend pas par Prouve: n'est plus dite", GT, " ; la criticité d'une feature ne descend pas par cette ligne, seulement par `Règles:`", "", [DT, PS]],
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
