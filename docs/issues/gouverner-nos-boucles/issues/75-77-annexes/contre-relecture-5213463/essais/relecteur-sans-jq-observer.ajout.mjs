
// --- Observation (contre-relecture de la PR 153) : ce que la passe et la veille écrivent sur un poste sans `jq`, sans
// rien exiger ; ajouté après relecteur-poste.ajout.mjs (il en reprend `sansJq`). ---
test('ESSAI-153 E3-observé — un poste sans `jq` : les sorties et le journal de la veille, tels quels', () => {
  const q = monter();
  pr(q);
  sansJq(q);
  const p = q.lancer('passe');
  console.log(`passe : sortie ${p.status} ; sa sortie d'erreur : ${p.stderr.trim()}`);
  const j = q.lancer('jouer', '12');
  console.log(`jouer 12 : sortie ${j.status}`);
  const v = q.lancer('veille', '--pause', '0', '--sondes', '3');
  console.log(`veille --pause 0 --sondes 3 : sortie ${v.status} ; son journal :\n${v.stdout.trim()}`);
  console.log(`écritures sur GitHub : ${ecritures(q).length}`);
});
