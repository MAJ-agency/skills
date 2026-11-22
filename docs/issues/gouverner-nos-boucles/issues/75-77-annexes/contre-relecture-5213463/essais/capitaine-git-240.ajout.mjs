
// --- Essai de la contre-relecture de la PR 153 (ajouté à la fin de verdict-du-capitaine.test.mjs par essais/jouer.sh) ---
// Le vrai meme-contenu.sh, sans talon, sous un git qui se dit 2.40 (un `git` en tête du PATH du jouet qui ne répond
// autrement qu'à `git version`) : la sortie 69 du calcul suivie de bout en bout, par passer.sh (premier et second
// contrôle) et par sujet.sh fusionner. Attendu par le ticket 75, décision 2 : passer.sh 3, sujet.sh fusionner 11.
const { chmodSync: chmodEssai } = await import("node:fs");
const VRAI_GIT = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).stdout.trim();
const git240 = (d) => {
  writeFileSync(join(d.racine, "bin", "git"), `#!/bin/sh\nif [ "$1" = version ]; then echo "git version 2.40.1"; exit 0; fi\nexec ${VRAI_GIT} "$@"\n`);
  chmodEssai(join(d.racine, "bin", "git"), 0o755);
};
const CAUSE_240 = /revue du capitaine en échec : meme-contenu\.sh : un outil de la chaîne manque au poste \(sortie 69\) : git ≥ 2\.41 requis, ici 2\.40/;

test("ESSAI-153 passer.sh, git 2.40, premier contrôle (un tour sur un sommet plus ancien) : sortie 3, la cause dite, jamais sautée en 7", () => {
  const d = monter();
  versDevelop(d);
  d.branche("feat/a", "feat/a", { "docs/a2.md": "a2\n" }, "docs(a): suite");
  d.git("switch", "-q", "--detach", "origin/develop");
  git240(d);
  const r = passer(d);
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /revue du capitaine en échec \(sortie 3\) : /);
  assert.match(r.stdout + r.stderr, CAUSE_240);
  assert.deepEqual(fusions(d), []);
});

test("ESSAI-153 passer.sh, git 2.40, second contrôle (après la mise à jour du capitaine) : sortie 3, la cause dite", () => {
  const d = monter();
  versDevelop(d);
  d.branche("develop", "origin/develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  git240(d);
  const r = passer(d);
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /revue du capitaine en échec avant la fusion \(sortie 3\) : /);
  assert.match(r.stdout + r.stderr, CAUSE_240);
  assert.deepEqual(fusions(d), []);
});

test("ESSAI-153 sujet.sh fusionner, git 2.40, second contrôle (sous-PR en retard, mise à jour) : sortie 11, côté capitaine", () => {
  const d = monter();
  versSujet(d, { retard: true });
  git240(d);
  const r = fusionner(d);
  assert.equal(r.status, 11, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /#80 : revue du capitaine en échec \(sortie 3 : /);
  assert.match(r.stdout + r.stderr, CAUSE_240);
  assert.deepEqual(fusions(d), []);
});
