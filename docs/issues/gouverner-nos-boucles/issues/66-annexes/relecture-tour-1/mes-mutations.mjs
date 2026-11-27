// Mutations du relecteur-66, même mécanique que l'annexe : un texte exact remplacé, les bancs visés joués, le fichier remis.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const D = 'skills/chaine/fusionner/scripts/decision-relecteur.mjs';
const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const BD = 'skills/chaine/fusionner/scripts/decision-relecteur.test.mjs';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BL = 'scripts/relecture.test.mjs';
const MUTATIONS = [
  ['N1 sensible : chemins-sensibles en échec lu « rien de sensible » (garde ouverte)', R, "return r.status !== 0 || r.stdout.trim() !== '';", "return r.status === 0 && r.stdout.trim() !== '';", [BR]],
  ['N2 exiges : double-relecture illisible lu 1', R, "r.status === 20 ? 2 : 'illisible'", 'r.status === 20 ? 2 : 1', [BR]],
  ['N3 même contenu : illisible lu « même »', R, 'memeContenu[s] = r.status === 0 ? true :', 'memeContenu[s] = r.status !== 20 ? true :', [BR]],
  ['N4 même contenu : illisible lu « différent »', R, "r.status === 20 ? false : 'illisible'", 'r.status === 20 ? false : false', [BR]],
  ['N5 régime : ouverte à l’instant de `depuis` admise', R, '!(Date.parse(json.created_at) > cle.depuis)', '!(Date.parse(json.created_at) >= cle.depuis)', [BR]],
  ['N6 régime : une base hors de la chaîne (main) admise', R, "if (pr.base !== 'develop' && !/^sujet\\/[A-Za-z0-9._-]+$/.test(pr.base)) return", 'if (false) return', [BR]],
  ['N7 couple : deux verdicts exigés reçoivent le couple ordinaire', R, '|| faits.exiges >= 2 ?', '|| faits.exiges > 2 ?', [BR]],
  ['N8 distribuer : des identifiants en double admis', R, ' || new Set(ids).size !== ids.length', '', [BR]],
  ['N9 distribuer : completer attend une seule session', R, 'completer: g.manque,', 'completer: 1,', [BR]],
  ['N10 distribuer : la reprise après arbitrage perd « non compté »', R, "mention: g.regle === 4 ? d.MENTION_ARBITRAGE : null", 'mention: null', [BR]],
  ['N11 préparer : seule develop est relue', R, "'+refs/heads/*:refs/remotes/origin/*'", "'+refs/heads/develop:refs/remotes/origin/develop'", [BR]],
  ['N12 lire : seule la première page compte', R, 'elif all(.[]; type == "array") then add else', 'elif all(.[]; type == "array") then .[0] else', [BR]],
  ['N13 jouer : « Relecture en panne » jamais écrit', R, "g.geste === 'plafonner' || g.geste === 'panne' || g.geste === 'illisible'", "g.geste === 'plafonner' || g.geste === 'illisible'", [BR]],
  ['N14 jouer : étiquettes comparées sans NFC', R, "(json.labels ?? []).map((l) => l.name.normalize('NFC'))", '(json.labels ?? []).map((l) => l.name)', [BR]],
  ['N15 horloge : l’heure du banc tenue hors du faux GitHub', R, "banc !== undefined && (process.env.FAUX_GH ?? '') !== ''", 'banc !== undefined', [BR]],
  ['N16 compter : « non requise » vaut « lancée » sur un chemin sensible', D, "(sensible && v.securite !== 'lancée')", '(sensible && v.securite === null)', [BD, BL]],
  ['N17 compter : un validé sur un autre sommet compte validé', D, "(v.illisible || v.sommet !== sommet || (sensible", '(v.illisible || (sensible', [BD, BL]],
  ['N18 contrat : `depuis` sans date valide admis', R, " || !Number.isFinite(Date.parse(r.depuis))) return 'illisible';", ") return 'illisible';", [BR]],
];
const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) { console.log(`INTROUVABLE ${nom}`); vertes++; continue; }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 600_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
