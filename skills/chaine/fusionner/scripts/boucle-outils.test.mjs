// `boucle.sh` joue les scripts de la chaîne tels qu'ils sont sur origin/develop, à chaque tour :
// un correctif fusionné pendant la boucle est vu au tour suivant, jamais la copie faite au
// lancement ni celle du worktree. Dépôt jouet : le develop du jouet porte des scripts
// de remplacement (`scripts/chaine/`), la vraie `boucle.sh` joue dessus.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const BOUCLE = scriptDe("fusionner", "boucle.sh");
const CHAINE = "scripts/chaine";

// Scripts de remplacement : `file.sh` annonce une PR prête tant que `passer.sh` n'a pas tourné
// autant de fois que sa version l'exige ; `passer.sh` se note dans la trace.
const fileSh = (version, fois) => `#!/usr/bin/env bash
[ "$1" = --rouges ] && exit 0
n=$(grep -c '^passer' "$TRACE" 2>/dev/null)
[ "\${n:-0}" -lt ${fois} ] && printf '4${version}\\tprête\\n'
exit 0
`;
const passerSh = (version, suite = "") => `#!/usr/bin/env bash
echo "passer v${version}" >> "$TRACE"
${suite}
exit 0
`;

function jouet(extraEnv = {}) {
  const d = depotJouet();
  const trace = join(d.racine, "trace.log");
  d.env.TRACE = trace;
  Object.assign(d.env, extraEnv);
  const publier = (fichiers, message = "chore(chaine): scripts") => {
    for (const [nom, corps] of Object.entries(fichiers)) d.ecrire(`${CHAINE}/${nom}`, corps);
    d.commit(message);
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
  };
  publier({
    "github.sh": readFileSync(scriptDe("fusionner", "github.sh"), "utf8"),
    "boucle.sh": readFileSync(BOUCLE, "utf8"),
    "sujet.sh": "#!/usr/bin/env bash\nexit 0\n",
    "renvoyer.sh": "#!/usr/bin/env bash\nexit 0\n",
    "refus.sh": "#!/usr/bin/env bash\nexit 0\n",
  });
  const lu = () => (existsSync(trace) ? readFileSync(trace, "utf8").trim().split("\n") : []);
  return { d, publier, lu };
}

test("un script de la chaîne modifié sur develop pendant la boucle est celui que joue le tour suivant", () => {
  const { d, publier, lu } = jouet();
  // passer v1 publie, pendant sa propre exécution, la v2 de `file.sh` et de `passer.sh` sur develop.
  const v2 = join(d.racine, "v2");
  const autre = join(d.racine, "autre");
  const publicationV2 = `
git clone -q "${d.origine}" "${autre}"
cd "${autre}"
printf '%s' '${fileSh(2, 2).replace(/'/g, "'\\''")}' > ${CHAINE}/file.sh
printf '%s' '${passerSh(2).replace(/'/g, "'\\''")}' > ${CHAINE}/passer.sh
git add -A && git commit -q -m "fix(chaine): v2" && git push -q origin HEAD:develop`;
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1, publicationV2) });
  // Le worktree du capitaine n'a jamais vu la v2 : seul un fetch la lui apporte.
  assert.equal(d.git("show", `origin/develop:${CHAINE}/passer.sh`).includes("passer v1"), true);
  void v2;

  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(lu(), ["passer v1", "passer v2"], r.stdout + r.stderr);
});

test("boucle.sh modifié sur develop : la boucle se relance sur la nouvelle version", () => {
  const { d, publier } = jouet();
  const reelle = readFileSync(BOUCLE, "utf8");
  publier({
    "boucle.sh": reelle.replace("\n", '\necho "BOUCLE-NOUVELLE" >&2\n'),
    "file.sh": fileSh(1, 0),
    "passer.sh": passerSh(1),
  });
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.stderr.match(/BOUCLE-NOUVELLE/g)?.length, 1, "relancée une seule fois");
});

test("scripts joués depuis la copie, pas depuis le worktree", () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1) });
  // Le worktree porte un `passer.sh` différent, non publié : il ne doit jamais tourner.
  d.ecrire(`${CHAINE}/passer.sh`, passerSh("WORKTREE"));
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(lu(), ["passer v1"]);
});

test("origin/develop introuvable : arrêt avec un message clair, aucun script joué", () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1) });
  d.git("--git-dir", d.origine, "update-ref", "-d", "refs/heads/develop");
  d.git("update-ref", "-d", "refs/remotes/origin/develop");
  const r = d.lancer(BOUCLE);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /origin\/develop/);
  assert.deepEqual(lu(), []);
});
