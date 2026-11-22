// L'espion du régime 7 de la contre-relecture de la PR 153 : pose, dans un arbre de la PR, un journal de chaque appel de
// `sansOutil` (le seul code neuf qui s'exécute : il n'est appelé que là où un calcul vient d'être lancé), et du régime
// que chaque processus de `revue-exigee.mjs` et de `relecteur.mjs` a lu. Chaque ligne porte le pid du processus ; un
// processus qui a lu le régime 7 et appelé `sansOutil` serait un écart.
// Usage : node espion-regime-7.mjs poser <arbre> <journal> | node espion-regime-7.mjs lire <journal>
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [action, a, b] = process.argv.slice(2);
if (action === 'poser') {
  const journal = JSON.stringify(b);
  const remplacer = (fichier, paires) => {
    let texte = readFileSync(join(a, fichier), 'utf8');
    for (const [avant, apres] of paires) {
      if (texte.split(avant).length !== 2) throw new Error(`${fichier} : introuvable : ${avant.slice(0, 70)}`);
      texte = texte.replace(avant, () => apres);
    }
    writeFileSync(join(a, fichier), texte);
  };
  const tracerSync = (quoi) => `process.getBuiltinModule('node:fs').appendFileSync(${journal}, \`\${process.pid} ${quoi}\\n\`);`;
  remplacer('skills/chaine/fusionner/scripts/revue-exigee.mjs', [
    ['function sansOutil(calcul, r) {\n', `function sansOutil(calcul, r) {\n  ${tracerSync('capitaine sansOutil ${calcul} ${r.status}')}\n`],
    ...[["  const enTete = options.ouverte === undefined ? '' : `régime ${regime}\\n`;\n"]].map(([avant]) => [avant, `  ${tracerSync('capitaine regime ${regime} ouverte=${options.ouverte !== undefined}')}\n${avant}`]),
  ]);
  remplacer('skills/chaine/relecteur/scripts/relecteur.mjs', [
    ['function sansOutil(calcul, r) {\n', `function sansOutil(calcul, r) {\n  ${tracerSync('relecteur sansOutil ${calcul} ${r.status}')}\n`],
    ["  if (cle === null || !(Date.parse(json.created_at) > cle.depuis)) return { ...tete, regle: null, geste: 'hors-regime', raison: 'régime 7' };\n",
      `  if (cle === null || !(Date.parse(json.created_at) > cle.depuis)) { ${tracerSync('relecteur regime 7 pr ${pr.n}')} return { ...tete, regle: null, geste: 'hors-regime', raison: 'régime 7' }; }\n  ${tracerSync('relecteur regime 8 pr ${pr.n}')}\n`],
  ]);
  writeFileSync(b, '');
  console.log(`espion posé dans ${a}`);
} else if (action === 'lire') {
  // Le journal se lit dans l'ordre : un pid peut resservir à un autre processus pendant la passe. Chaque appel de
  // `sansOutil` est rattaché à la dernière ligne de régime écrite par le même pid avant lui (même processus : la CLI du
  // capitaine écrit son régime avant de lancer un calcul ; le Relecteur écrit le régime de chaque PR avant d'en juger).
  const lignes = readFileSync(a, 'utf8').split('\n').filter(Boolean);
  const dernier = new Map(); // pid → dernière ligne de régime ('capitaine regime 7 …', 'relecteur regime 8 pr 12', …)
  const compte = { 'capitaine 7 (--ouverte)': 0, 'capitaine 7 (sans --ouverte)': 0, 'capitaine 8': 0, 'relecteur 7': 0, 'relecteur 8': 0 };
  const appels = { 'capitaine sous le régime 8': 0, 'relecteur sous le régime 8': 0 };
  const ecarts = [];
  for (const l of lignes) {
    const [pid, qui, quoi, ...reste] = l.split(' ');
    if (quoi === 'regime') {
      dernier.set(`${qui} ${pid}`, l);
      const cle = qui === 'capitaine' ? (reste[0] === '8' ? 'capitaine 8' : reste[1] === 'ouverte=true' ? 'capitaine 7 (--ouverte)' : 'capitaine 7 (sans --ouverte)') : `relecteur ${reste[0]}`;
      compte[cle]++;
    } else if (quoi === 'sansOutil') {
      const avant = dernier.get(`${qui} ${pid}`);
      if (!avant || !avant.includes(' regime 8')) ecarts.push(`${l} (après : ${avant ?? 'aucune ligne de régime'})`);
      else appels[`${qui} sous le régime 8`]++;
    }
  }
  console.log(`${lignes.length} lignes`);
  console.log(`régimes lus : ${Object.entries(compte).map(([k, v]) => `${k} : ${v}`).join(' ; ')}`);
  console.log(`appels de sansOutil : ${Object.entries(appels).map(([k, v]) => `${k} : ${v}`).join(' ; ')}`);
  console.log(ecarts.length === 0 ? 'aucun écart : aucun appel de sansOutil après une lecture du régime 7' : `ÉCARTS (${ecarts.length}) :\n${ecarts.join('\n')}`);
  process.exit(ecarts.length === 0 ? 0 : 1);
}
