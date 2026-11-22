
// --- Essais de la contre-relecture de la PR 153, tour 2 (sommet 34ac533), ajoutés à la fin de
// skills/chaine/relecteur/scripts/relecteur.test.mjs puis retirés (jouer-t2.sh). Les cas `ESSAI-T2 … exigé` exigent ce
// que le delta doit tenir ; les cas `observé` n'exigent rien et écrivent ce qu'ils voient (console.log). ---
const { rmSync: retirerT2, symlinkSync: lienT2, readdirSync: lireDossierT2 } = process.getBuiltinModule('node:fs');
// Un PATH du jouet sans un outil : chaque entrée de /usr/bin et /bin en lien, sauf `sauf` ; `node` en lien à part
// (jamais son dossier, qui peut porter l'outil retiré).
function pathSansT2(q, sauf, { garderBin = true } = {}) {
  const dossier = join(q.racine, `sans-${sauf.join('-')}`);
  mkdirSync(dossier);
  for (const source of ['/usr/bin', '/bin'])
    if (existsSync(source))
      for (const nom of lireDossierT2(source))
        if (!sauf.includes(nom) && !existsSync(join(dossier, nom))) lienT2(join(source, nom), join(dossier, nom));
  if (!existsSync(join(dossier, 'node'))) lienT2(process.execPath, join(dossier, 'node'));
  q.env.PATH = `${garderBin ? `${join(q.racine, 'bin')}:` : ''}${dossier}`;
  return dossier;
}
const sortiesT2 = (q, n = '12') => {
  const p = q.lancer('passe');
  const j = q.lancer('jouer', n);
  const v = q.lancer('veille', '--pause', '0', '--sondes', '2');
  return { p, j, v };
};

// Question 1 : une vraie panne de GitHub reste une sortie 5 (une pause), jamais 6 ; même un `gh` qui sortirait en 69.
test('ESSAI-T2 E5-exigé — une vraie panne de GitHub (502, réponse vide, corps d’erreur, pas du JSON, `gh` sorti en 69) : `passe` et `jouer` en 5, la veille en pause, rien d’écrit', () => {
  const formes = [
    ['502', {}],
    ['réponse vide', { code: 0, sortie: '', erreur: '' }],
    ['corps d’erreur', { code: 0, sortie: '{"message":"Server Error"}\n', erreur: '' }],
    ['pas du JSON', { code: 0, sortie: '<html>502</html>\n', erreur: '' }],
    ['gh sorti en 69', { code: 69, erreur: 'gh: service indisponible' }],
  ];
  for (const [nom, forme] of formes) {
    const q = monter();
    pr(q);
    q.github({ pannes: [{ route: '^pulls\\?', fois: 1, ...forme }] });
    const p = q.lancer('passe');
    assert.equal(p.status, 5, `${nom} (passe) : ${p.stdout}${p.stderr}`);
    assert.match(p.stderr, /GitHub illisible \(repos\/\{owner\}\/\{repo\}\/pulls\?/, nom);
    assert.doesNotMatch(p.stderr, /manque au poste/, nom);
    q.github({ pannes: [{ route: '^pulls/12$', fois: 1, ...forme }] });
    const j = q.lancer('jouer', '12');
    assert.equal(j.status, 5, `${nom} (jouer) : ${j.stdout}${j.stderr}`);
    q.github({ pannes: [{ route: '^pulls\\?', fois: 1, ...forme }] });
    const v = q.lancer('veille', '--pause', '0', '--sondes', '2');
    assert.match(v.stdout, /^PAUSE GitHub illisible : .*\nVEILLE GESTE\nGESTE 12 distribuer règle 6\n$/, `${nom} (veille) : ${v.stdout}`);
    assert.deepEqual(ecritures(q), [], nom);
  }
});

// Question 1 : les événements de la PR (la seconde lecture de `jouer`, `poseeApres`) en panne : toujours 5.
test('ESSAI-T2 E5b-exigé — les commentaires de la PR en panne (`gh` sorti en 69) : `jouer` en 5, rien d’écrit', () => {
  const q = monter();
  pr(q);
  q.github({ pannes: [{ route: '^issues/12/comments', fois: 1, code: 69, erreur: 'gh: service indisponible' }] });
  const j = q.lancer('jouer', '12');
  assert.equal(j.status, 5, j.stdout + j.stderr);
  assert.deepEqual(ecritures(q), []);
});

// Observé : `jq` présent mais cassé (un binaire qui ne se lance pas), et `gh` absent.
test('ESSAI-T2 E6-observé — `jq` présent mais cassé (127 au lancement), `jq` qui répond 126, `gh` absent : les sorties telles quelles', () => {
  for (const [nom, corps] of [
    ['jq cassé, 127', 'echo "jq: error while loading shared libraries: libonig.so.5: cannot open shared object file" >&2\nexit 127'],
    ['jq cassé, 126', 'echo "jq: cannot execute binary file: Exec format error" >&2\nexit 126'],
  ]) {
    const q = monter();
    pr(q);
    writeFileSync(join(q.racine, 'bin', 'jq'), `#!/bin/sh\n${corps}\n`);
    chmodSync(join(q.racine, 'bin', 'jq'), 0o755);
    const { p, j, v } = sortiesT2(q);
    console.log(`[${nom}] passe ${p.status} : ${p.stderr.trim().split('\n').at(-1)} | jouer ${j.status} | veille ${v.status} : ${v.stdout.trim().replace(/\n/g, ' / ')} | écritures ${ecritures(q).length}`);
  }
  const g = monter();
  pr(g);
  retirerT2(join(g.racine, 'bin', 'gh'));
  pathSansT2(g, ['gh']);
  assert.notEqual(spawnSync('sh', ['-c', 'command -v gh'], { env: g.env }).status, 0, 'gh absent');
  const { p, j, v } = sortiesT2(g);
  console.log(`[gh absent] passe ${p.status} : ${p.stderr.trim().split('\n').at(-1)} | jouer ${j.status} | veille ${v.status} : ${v.stdout.trim().replace(/\n/g, ' / ')} | écritures ${ecritures(g).length}`);
});

// Question 4 : le régime 7 (aucune clé `relecture` sur develop). Avec `jq` : `hors-regime`, rien d'écrit, comme avant ;
// sans `jq` : la ligne neuve joue aussi, la passe sort en 6 (en 5 sur 5213463).
test('ESSAI-T2 E7-observé — le Relecteur en régime 7, avec et sans `jq`', () => {
  const a = monter({ contrat: { cheminsSensibles: [] } });
  pr(a);
  const pa = a.lancer('passe');
  console.log(`[régime 7, jq présent] passe ${pa.status} : ${pa.stdout.trim()} | écritures ${ecritures(a).length}`);
  const b = monter({ contrat: { cheminsSensibles: [] } });
  pr(b);
  pathSansT2(b, ['jq']);
  assert.notEqual(spawnSync('sh', ['-c', 'command -v jq'], { env: b.env }).status, 0, 'jq absent');
  const { p, v } = sortiesT2(b);
  console.log(`[régime 7, jq absent] passe ${p.status} : ${p.stderr.trim().split('\n').at(-1)} | veille ${v.status} : ${v.stdout.trim().replace(/\n/g, ' / ')} | écritures ${ecritures(b).length}`);
});
