
// --- Essai de la contre-relecture de la PR 153 (ajouté à la fin de skills/chaine/relecteur/scripts/relecteur.test.mjs
// par essais/jouer.sh) --- Le Relecteur sur un poste qui ne porte pas la chaîne, sans talon :
// - E2 : le vrai meme-contenu.sh sous un git qui se dit 2.40 ;
// - E3 : un poste sans `jq` (le PATH du jouet sans lui) : `github.sh` sort en 69 dès son chargement.
// Attendu par le texte de la PR (SKILL.md, la sortie 6 : « un calcul dit qu'un outil de la chaîne manque au poste (sa
// sortie 69 : git plus ancien que 2.41, `jq` absent, …) : l'architecte, et s'arrêter » ; l'en-tête du script, la note) :
// la sortie 6, la veille arrêtée, rien d'écrit sur GitHub.
const { chmodSync: chmodEssai, symlinkSync: lienEssai, readdirSync: lireDossierEssai } = await import('node:fs');
const VRAI_GIT = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
const git240 = (d) => {
  writeFileSync(join(d.racine, 'bin', 'git'), `#!/bin/sh\nif [ "$1" = version ]; then echo "git version 2.40.1"; exit 0; fi\nexec ${VRAI_GIT} "$@"\n`);
  chmodEssai(join(d.racine, 'bin', 'git'), 0o755);
};
// Un PATH sans `jq` : chaque outil de /usr/bin et /bin en lien, sauf lui ; `node` à part.
const sansJq = (d) => {
  const dossier = join(d.racine, 'sans-jq');
  mkdirSync(dossier);
  for (const source of ['/usr/bin', '/bin'])
    if (existsSync(source))
      for (const nom of lireDossierEssai(source))
        if (nom !== 'jq' && !existsSync(join(dossier, nom))) lienEssai(join(source, nom), join(dossier, nom));
  d.env.PATH = `${join(d.racine, 'bin')}:${dossier}:${dirname(process.execPath)}`;
  assert.notEqual(spawnSync('sh', ['-c', 'command -v jq'], { env: d.env }).status, 0, 'jq est bien absent du PATH du jouet');
};

test('ESSAI-153 E2 — le vrai meme-contenu.sh sous git 2.40 : `jouer` et la passe sortent en 6, la cause dite, rien d’écrit ; la veille s’arrête', () => {
  const m = monter();
  const ancien = pr(m);
  ajouter(m, [distribution(1, ancien, ['session_rel1']), 2], [verdict(ancien, 1, 'session_rel1', 'validé'), 3]);
  m.git('switch', '-q', 'feat/a');
  m.ecrire('src/a.mjs', 'export const a = 2;\n');
  m.commit('fix: a');
  m.git('push', '-q', 'origin', 'HEAD:feat/a');
  git240(m);
  const h = m.lancer('jouer', '12');
  assert.equal(h.status, 6, h.stdout + h.stderr);
  assert.match(h.stderr, /^relecteur : meme-contenu\.sh : un outil de la chaîne manque au poste \(sortie 69\) : git ≥ 2\.41 requis, ici 2\.40$/m);
  assert.equal(m.lancer('passe').status, 6);
  const v = m.lancer('veille', '--pause', '0', '--sondes', '1');
  assert.match(v.stdout, /\nVEILLE ARRÊTÉE sortie 6\n$/);
  assert.deepEqual(ecritures(m), []);
});

test('ESSAI-153 E3 — un poste sans `jq` : la passe et `jouer` sortent en 6 (« `jq` absent », la sortie 6 du texte), jamais en 5 ; la veille s’arrête au lieu de faire une pause sans fin', () => {
  const q = monter();
  pr(q);
  sansJq(q);
  const p = q.lancer('passe');
  assert.equal(p.status, 6, `passe : ${p.status} : ${p.stderr}`);
  assert.match(p.stderr, /jq est requis/);
  assert.equal(q.lancer('jouer', '12').status, 6);
  const v = q.lancer('veille', '--pause', '0', '--sondes', '2');
  assert.doesNotMatch(v.stdout, /^PAUSE /m, v.stdout);
  assert.match(v.stdout, /\nVEILLE ARRÊTÉE sortie 6\n$/, v.stdout);
  assert.deepEqual(ecritures(q), []);
});
