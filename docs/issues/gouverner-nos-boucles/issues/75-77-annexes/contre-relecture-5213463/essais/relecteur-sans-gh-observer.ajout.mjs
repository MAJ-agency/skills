
// --- Observation (contre-relecture de la PR 153) : un poste sans `gh` (le faux du jouet retiré, le PATH sans /usr/local/bin) ;
// ajouté après relecteur-poste.ajout.mjs (il en reprend `sansJq`, qui ne pose que /usr/bin et /bin). Rien n'est exigé. ---
test('ESSAI-153 E4-observé — un poste sans `gh` : les sorties et le journal de la veille, tels quels', () => {
  const q = monter();
  pr(q);
  const { rmSync: retirerEssai } = process.getBuiltinModule('node:fs');
  retirerEssai(join(q.racine, 'bin', 'gh'));
  // Le PATH sans `gh` : /usr/bin et /bin en liens (jq compris, remis à part), node à part.
  sansJq(q);
  lienEssai('/usr/bin/jq', join(q.racine, 'sans-jq', 'jq'));
  assert.notEqual(spawnSync('sh', ['-c', 'command -v gh'], { env: q.env }).status, 0, 'gh absent');
  assert.equal(spawnSync('sh', ['-c', 'command -v jq'], { env: q.env }).status, 0, 'jq présent');
  const p = q.lancer('passe');
  console.log(`passe : sortie ${p.status} ; sa sortie d'erreur : ${p.stderr.trim()}`);
  const v = q.lancer('veille', '--pause', '0', '--sondes', '2');
  console.log(`veille --pause 0 --sondes 2 : sortie ${v.status} ; son journal :\n${v.stdout.trim()}`);
});
