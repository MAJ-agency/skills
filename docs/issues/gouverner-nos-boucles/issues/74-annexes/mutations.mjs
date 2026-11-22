// Les mutations du ticket 74 (M4, M5b, M6, M12, T9b et T10b changent de cible, M20 à M26 et T12 à T15 sont neuves : relecture, tour 1, A-190) : chacune change une ligne de `veille.sh` ou déplace une phrase de `fusionner/SKILL.md`,
// joue les bancs qu'elle nomme, et doit en rendre un rouge ; le fichier est remis après chaque mutation. À lancer
// depuis la racine d'un clone où `ticket-74.patch` est appliqué : `node <chemin>/mutations.mjs [<nom>…]` (`M3`, `T2`…).
// Sortie 0 : toutes rouges.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const V = 'skills/chaine/fusionner/scripts/veille.sh';
const S = 'skills/chaine/fusionner/SKILL.md';
const BV = 'skills/chaine/fusionner/scripts/veille.test.mjs';
const BU = 'skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs';
const BT = 'scripts/veille-du-capitaine.test.mjs';

// `avant` doit se trouver une fois exactement ; sinon la mutation est introuvable.
const remplacer = (avant, apres) => (t) => (t.split(avant).length !== 2 ? null : t.replace(avant, () => apres));
// Retire `bloc` (une fois) et le pose juste avant `repere` (une fois).
const deplacer = (bloc, repere) => (t) => {
  if (t.split(bloc).length !== 2 || t.split(repere).length !== 2) return null;
  const sans = t.replace(bloc, () => '');
  return sans.split(repere).length !== 2 ? null : sans.replace(repere, () => `${bloc}${repere}`);
};

const TIMEOUT = " Sans ce `timeout`, l'outil arrête la tâche à 30 minutes, sans ligne finale, au milieu d'un passage s'il le faut : la veille compte sur deux heures (`--marge 40` sous une limite de 120 minutes), et une veille de moins de 30 minutes ne laisserait aucune marge à un passage qui attend sa CI.";
const AUCUNE = "- **Aucune de ces lignes** (l'outil a arrêté la tâche, hors un `TaskStop` joué par la session elle-même ; le conteneur a redémarré) : une veille morte, jamais une fin sans suite : « Réveil de garde », points 1 à 3, tout de suite.\n";
const debutGarde = (t) => t.indexOf('**Réveil de garde.**');
const finGarde = (t) => t.indexOf('Suivre le journal avec un `Monitor`');

const MUTATIONS = [
  // veille.sh : le descripteur 7 hérité par un fils qui peut survivre à la veille.
  ['M1 veille.sh : le `sleep` de la pause hérite du verrou de la veille', V, remplacer('  sleep "$pause" 7>&-\n', '  sleep "$pause"\n'), [BV]],
  ['M2 veille.sh : la boucle hérite du verrou de la veille', V, remplacer('bash "$outils/boucle.sh" "${suite[@]}" 7>&- |', 'bash "$outils/boucle.sh" "${suite[@]}" |'), [BV]],
  ['M3 veille.sh : `tee` hérite du verrou de la veille', V, remplacer('| tee "$journal_boucle" 7>&-', '| tee "$journal_boucle"'), [BV]],
  ['M4 veille.sh : file.sh hérite du verrou de la veille (lecture initiale)', V, (t) => {
    const r = remplacer('sortie=$(bash "$outils/file.sh" 2>/dev/null 7>&-)', 'sortie=$(bash "$outils/file.sh" 2>/dev/null)')(t);
    return r === null ? null : remplacer('vu=$(exec 7>&-; etat_file || true)', 'vu=$(etat_file || true)')(r);
  }, [BV]],
  ['M5b veille.sh : la commande de préparation hérite du verrou de la veille', V, remplacer('(exec 7>&- 8>&-; cd', '(exec 8>&-; cd'), [BV]],
  // veille.sh : le verrou et l'état.
  ['M6 veille.sh : pas de verrou (une seconde veille démarre)', V, remplacer('flock -w 3 7 || {', 'true || {'), [BV]],
  ['M7 veille.sh : l’état « lancee » n’est pas écrit', V, remplacer(`printf 'lancee %s\\n' "$debut" > "$ETAT_VEILLE"\n`, ''), [BV]],
  ['M8 veille.sh : la ligne finale n’est pas écrite dans l’état', V, remplacer(`  printf 'fin %s %s\\n' "$(date +%s)" "$2" > "$ETAT_VEILLE"\n`, ''), [BV]],
  ['M9 veille.sh : l’arrêt de la préparation n’écrit pas sa fin', V, remplacer('arreter_preparation() { finir 13 "VEILLE ARRÊTÉE $(heure) : $1"; }', 'arreter_preparation() { echo "VEILLE ARRÊTÉE $(heure) : $1"; exit 13; }'), [BV]],
  ['M10 veille.sh : la fin à l’échéance n’écrit pas sa fin', V, remplacer('if echeance_passee; then finir 0 "VEILLE FINIE $(heure) (échéance)"; fi', 'if echeance_passee; then echo "VEILLE FINIE $(heure) (échéance)"; exit 0; fi'), [BV]],
  ['M11 veille.sh : la boucle sortie en code non nul n’écrit pas sa fin', V, remplacer('[ "$rc" = 0 ] || finir "$rc" "VEILLE ARRÊTÉE $(heure) : la boucle est sortie en $rc"', '[ "$rc" = 0 ] || { echo "VEILLE ARRÊTÉE $(heure) : la boucle est sortie en $rc"; exit "$rc"; }'), [BV]],
  ['M12 veille.sh : l’état écrit avant le verrou (une seconde veille l’écrase)', V, (t) => {
    const ligne = `printf 'lancee %s\\n' "$debut" > "$ETAT_VEILLE"\n`;
    const r = remplacer(ligne, '')(t);
    return r === null ? null : remplacer('exec 7>>"$VERROU_VEILLE"\nflock -w 3 7', `${ligne}exec 7>>"$VERROU_VEILLE"\nflock -w 3 7`)(r);
  }, [BV]],
  // veille.sh : --etat.
  ['M13 veille.sh --etat : le fichier d’arrêt n’est pas lu', V, remplacer('  if [ -e "$ARRET" ]; then\n', '  if false; then\n'), [BV]],
  ['M14 veille.sh --etat : la fin écrite lue avant le fichier d’arrêt', V, (t) => {
    const arret = t.slice(t.indexOf('  if [ -e "$ARRET" ]; then\n'), t.indexOf('  if [ "$mot" = fin ] && [ -n "$ligne" ]; then\n'));
    const fin = t.slice(t.indexOf('  if [ "$mot" = fin ] && [ -n "$ligne" ]; then\n'), t.indexOf('  echo "VEILLE MORTE ('));
    return arret && fin ? t.replace(arret + fin, () => fin + arret) : null;
  }, [BV]],
  ['M15 veille.sh --etat : VIVANTE sort en 1', V, remplacer('    echo "VEILLE VIVANTE${lancee:+ ($lancee)}"\n    exit 0\n', '    echo "VEILLE VIVANTE${lancee:+ ($lancee)}"\n    exit 1\n'), [BV, BT]],
  ['M16 veille.sh --etat : MORTE sort en 2', V, remplacer('puis la relancer avec --reprendre"\n  exit 1\n', 'puis la relancer avec --reprendre"\n  exit 2\n'), [BV, BT]],
  ['M17 veille.sh --etat : exige CAPITAINE_ID', V, remplacer('if [ "${1-}" = --etat ]; then\n', 'if [ "${1-}" = --etat ]; then\n  [ -n "${CAPITAINE_ID-}" ] || exit 64\n'), [BV]],
  // veille.sh : --reprendre.
  ['M18 veille.sh : --reprendre transmis à chaque lancement de la boucle', V, remplacer('  reprendre=0\n  preparer_si_besoin\n', '  preparer_si_besoin\n'), [BV]],
  ['M19 veille.sh : --reprendre jamais transmis', V, remplacer('[ "$reprendre" = 0 ] || suite=(--reprendre)', 'true || suite=(--reprendre)'), [BV, BU]],
  // Relecture, tour 1 (A-190) : --reprendre avant la préparation, les sous-shells, l'attente d'un --etat, la lecture sous le verrou.
  ['M20 veille.sh : --reprendre ne retire plus le fichier d’arrêt avant la préparation', V, remplacer('  rm -f "$ARRET"\n  exec 8>&-\nfi\n', '  exec 8>&-\nfi\n'), [BV]],
  ['M21 veille.sh : --reprendre retire le fichier d’arrêt même quand une boucle tient son verrou', V, remplacer('  flock -n 8 || finir 9 ', '  true || finir 9 '), [BV]],
  ['M22 veille.sh : la lecture initiale de la file garde le descripteur 7 dans son sous-shell', V, remplacer('vu=$(exec 7>&-; etat_file || true)', 'vu=$(etat_file || true)'), [BV]],
  ['M26 veille.sh : la sonde de la boucle de la veille garde le descripteur 7 dans son sous-shell', V, remplacer('if ! actuel=$(exec 7>&-; etat_file); then', 'if ! actuel=$(etat_file); then'), [BV]],
  ['M23 veille.sh : le sous-shell de la préparation garde le descripteur 7', V, remplacer('(exec 7>&- 8>&-; cd "$racine" && sh -c "$commande" </dev/null 2>&1)', '(cd "$racine" && sh -c "$commande" </dev/null 2>&1 8>&- 7>&-)'), [BV]],
  ['M24 veille.sh : la veille n’attend pas un --etat en cours (flock -n)', V, remplacer('flock -w 3 7 ||', 'flock -n 7 ||'), [BV]],
  ['M25 veille.sh --etat : l’état lu avant le verrou', V, remplacer('  exec 7>>"$VERROU_VEILLE"\n  if ! flock -n 7; then\n', '  lire_etat\n  if ! flock -n "$VERROU_VEILLE" true; then\n'), [BV]],
  // SKILL.md : chaque phrase à sa place.
  ['T1 SKILL.md : le timeout dit après la commande de la veille, plus dans le paragraphe qui la lance', S, (t) => {
    const r = remplacer(TIMEOUT, '')(t);
    return r === null ? null : remplacer('\nAvant chaque lancement de la boucle, la veille joue', `\n${TIMEOUT.trim()}\n\nAvant chaque lancement de la boucle, la veille joue`)(r);
  }, [BT]],
  ['T2 SKILL.md : le `timeout` à 600000 au lieu de 7200000', S, remplacer("avec le `timeout` de l'outil Bash à `7200000`** (deux heures, son maximum)", "avec le `timeout` de l'outil Bash à `600000`** (deux heures, son maximum)"), [BT]],
  ['T3 SKILL.md : la puce « Aucune de ces lignes » avant celle de la sortie 13', S, deplacer(AUCUNE, '- **`VEILLE ARRÊTÉE`, sortie 13**'), [BT]],
  ['T4 SKILL.md : la puce « Aucune de ces lignes » retirée', S, remplacer(AUCUNE, ''), [BT]],
  ['T5 SKILL.md : le réveil de garde déplacé après le suivi du journal', S, (t) => {
    const g = t.slice(debutGarde(t), finGarde(t));
    if (debutGarde(t) < 0 || finGarde(t) < 0) return null;
    const sans = t.replace(g, () => '');
    return remplacer('\n**Devant un refus durable de fusion**', `\n${g}**Devant un refus durable de fusion**`)(sans);
  }, [BT]],
  ['T6 SKILL.md : le réveil de garde réarmé à chaque réveil', S, remplacer("Il ne se réarme qu'au réveil de garde, jamais à un autre réveil : un seul réveil de garde attend à la fois.", 'Il se réarme à chaque réveil.'), [BT]],
  ['T7 SKILL.md : la garde à 120 minutes', S, remplacer('`delay_minutes` `60`', '`delay_minutes` `120`'), [BT]],
  ['T8 SKILL.md : les points 2 et 3 du réveil de garde échangés', S, (t) => {
    const g = t.slice(debutGarde(t), finGarde(t));
    const p2 = g.slice(g.indexOf('\n2. '), g.indexOf('\n3. '));
    const p3 = g.slice(g.indexOf('\n3. '), g.indexOf('\n4. '));
    if (!p2 || !p3) return null;
    return t.replace(p2 + p3, () => p3.replace('\n3. ', '\n2. ') + p2.replace('\n2. ', '\n3. '));
  }, [BT]],
  ['T9b SKILL.md : `--reprendre` retiré du point 3, et la relance recopie', S, remplacer('puis relancer la veille par la seconde ligne du bloc ci-dessus, sans recopier (le worktree peut être resté sur une PR), en tâche de fond avec le même `timeout`, et avec `--reprendre` : elle retire ce fichier dès son verrou pris, avant sa préparation.', 'puis relancer la veille comme ci-dessus.'), [BT]],
  ['T10b SKILL.md : la sortie 9 ne nomme plus une autre veille, ni la suite par --etat', S, remplacer('Sortie 9 : une autre boucle tient le verrou, ou une autre veille tourne (`une veille tourne déjà`) : ne rien relancer avant de savoir laquelle (`veille.sh --etat`) : la suite de son point 2 (« Réveil de garde ») ;', 'Sortie 9 : une autre boucle tient le verrou, ne rien relancer avant de savoir laquelle ;'), [BT]],
  ['T11 veille.sh : l’en-tête ne dit plus le timeout', V, remplacer('# avec son `timeout` à 7200000 (ms, skill fusionner § « Boucle »)', '# en tâche de fond (skill fusionner § « Boucle »)'), [BT]],
  ['T12 SKILL.md : la garde perd son nom', S, remplacer('`name` « Garde de la veille du capitaine », ', ''), [BT]],
  ['T13 SKILL.md : la commande de la veille tronque son journal (`>`)', S, remplacer('bash <scratchpad>/outils/veille.sh >> <scratchpad>/veille.log 2>&1   #', 'bash <scratchpad>/outils/veille.sh > <scratchpad>/veille.log 2>&1   #'), [BT]],
  ['T14 SKILL.md : le point 2 sans suite pour une autre sortie (64)', S, remplacer(' ; une autre sortie (64 : la copie est d\'avant `--etat`, les scripts du projet ne sont pas reposés) : pas de garde, le dire une fois au lanceur (scripts à reposer par « poser », dans une PR du projet), ne plus réarmer, et après une fin sans ligne finale relancer la veille sans `--reprendre`', ''), [BT]],
  ['T15 SKILL.md : « Reprendre » rejoue boucle.sh --reprendre', S, remplacer('**Reprendre** : relancer la veille avec `--reprendre`', '**Reprendre** : `bash scripts/chaine/boucle.sh --reprendre`, puis relancer la veille avec `--reprendre`'), [BT]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
let jouees = 0;
let rouges = 0;
for (const [nom, fichier, muter, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  const mute = muter(texte);
  if (mute === null || mute === texte) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  jouees++;
  writeFileSync(fichier, mute);
  const t0 = Date.now();
  let r;
  try {
    r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  } finally {
    writeFileSync(fichier, texte);
  }
  const rouge = r.status !== 0;
  if (rouge) rouges++;
  else vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(`${rouges} rouges sur ${jouees} jouées, ${MUTATIONS.length} dans le fichier`);
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
