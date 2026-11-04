// =============================================================================
// Revue adversariale exigée au passage du capitaine (ADR « chaîne de production »).
//
// Une PR qui touche du code (apps/, packages/, scripts/, donc les seeds de scripts/db/)
// n'est éligible que si sa description porte une section « Revue adversariale » : un titre
// Markdown hors bloc de code. Règles pures, testées par revue-exigee.test.mjs ; la CLI sert
// passer.sh et sujet.sh.
//
// Garde-fou ajouté le 20/10 (#844, #939) : une PR dont le titre annonce du code (feat, fix…)
// mais dont le diff ne contient que de la documentation est refusée. Cas vécu : la session pose
// `à-fusionner` pendant que son pre-push, long, n'a pas encore poussé le code ; la boucle squashe
// alors la seule ligne Status du commit de réservation et le code reste sur la branche.
//
// Usage : printf '%s\n' "$fichiers" | node revue-exigee.mjs "$corps" ["$titre"]
// Sortie 0 éligible · 1 non éligible, motif sur la sortie standard.
// =============================================================================

const CHEMINS_CODE = /^(apps|packages|scripts)\//;

/** Le diff touche-t-il un chemin qui exige la revue ? */
export function exigeRevue(fichiers) {
  return fichiers.some((f) => CHEMINS_CODE.test(f.trim()));
}

/** La description a-t-elle un titre « Revue adversariale » hors bloc de code ? */
export function aSectionRevue(corps) {
  let dansBloc = false;
  for (const ligne of (corps ?? '').split(/\r?\n/)) {
    if (/^\s{0,3}(```|~~~)/.test(ligne)) {
      dansBloc = !dansBloc;
      continue;
    }
    if (!dansBloc && /^\s{0,3}#{1,6}\s+revue adversariale\b/i.test(ligne)) return true;
  }
  return false;
}

/** Motif de non-éligibilité, ou null si la PR peut passer. */
export function motifSansRevue({ corps, fichiers }) {
  if (!exigeRevue(fichiers) || aSectionRevue(corps)) return null;
  return 'sans section « Revue adversariale » dans la description alors que la PR touche apps/, packages/ ou scripts/ : lancer le skill revue-adversariale';
}

const TYPES_AVEC_CODE = /^(feat|fix|refactor|perf)(\([^)]*\))?!?:/;

/** Le titre annonce du code alors que le diff ne contient que de la documentation ? */
export function motifTitreSansCode({ titre, fichiers }) {
  const t = (titre ?? '').trim();
  const m = TYPES_AVEC_CODE.exec(t);
  if (!m || /^(docs?)$/i.test((m[2] ?? '').replace(/[()]/g, ''))) return null;
  const liste = fichiers.map((f) => f.trim()).filter(Boolean);
  if (liste.length === 0 || !liste.every((f) => f.startsWith('docs/'))) return null;
  return `titre « ${m[1]} » mais le diff ne contient que de la documentation (${liste.length} fichier(s) sous docs/) : le code est-il poussé ? Poser à-fusionner après le dernier push (le pre-push est long), ou retitrer en docs:`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs');
  const fichiers = readFileSync(0, 'utf8').split('\n').filter(Boolean);
  const motif =
    motifSansRevue({ corps: process.argv[2] ?? '', fichiers }) ??
    motifTitreSansCode({ titre: process.argv[3] ?? '', fichiers });
  if (motif) {
    process.stdout.write(`${motif}\n`);
    process.exit(1);
  }
}
