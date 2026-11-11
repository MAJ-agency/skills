// `boucle.sh` joue les scripts de la chaîne tels qu'ils sont sur origin/develop, à chaque tour :
// un correctif fusionné pendant la boucle est vu au tour suivant, jamais la copie faite au
// lancement ni celle du worktree. Dépôt jouet : le develop du jouet porte des scripts
// de remplacement (`scripts/chaine/`), la vraie `boucle.sh` joue dessus.
import { test } from "node:test";
import { spawn, spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const { depotJouet, script: scriptDe, GRAMMAIRE } = await import(
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
  // La boucle copie aussi la grammaire des identifiants d'origin/develop, à côté de scripts/chaine/.
  d.ecrire("scripts/docs/identifiants.mjs", readFileSync(GRAMMAIRE, "utf8"));
  publier({
    "github.sh": readFileSync(scriptDe("fusionner", "github.sh"), "utf8"),
    "identifiant.mjs": readFileSync(scriptDe("fusionner", "identifiant.mjs"), "utf8"),
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
    // Une ligne insérée juste après le shebang : la boucle publiée diffère de celle qui tourne.
    "boucle.sh": reelle.replace(/^([^\n]*\n)/, '$1echo "BOUCLE-NOUVELLE" >&2\n'),
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

test("scripts/docs/identifiants.mjs absent de develop : arrêt (6), aucun script joué ; présent, il est copié à côté des outils", () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1) });
  const copie = join(d.racine, "copie");
  d.env.BOUCLE_COPIE = copie;
  const ok = d.lancer(BOUCLE);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.equal(existsSync(join(copie, "scripts/docs/identifiants.mjs")), true);
  // identifiant.mjs de la copie trouve la grammaire copiée (../docs/), hors de tout dépôt.
  const lu1 = spawnSync("node", [join(copie, "scripts/chaine/identifiant.mjs"), "slug", "SPEC_ALL_SOC-1.03"], { cwd: d.racine, encoding: "utf8" });
  assert.equal(lu1.stdout.trim(), "spec-all-soc-1-03", lu1.stderr);
  d.git("rm", "-q", "scripts/docs/identifiants.mjs");
  publier({}, "chore: sans la grammaire");
  writeFileSync(d.env.TRACE, "");
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 6, r.stdout + r.stderr);
  assert.match(r.stderr, /ARRÊT : scripts\/docs\/identifiants\.mjs absent d'origin\/develop/);
  assert.deepEqual(lu(), [""]);
});

// --- Instance unique et arrêt d'un geste -----------------------------------------------------------
// Boucle lancée en tâche de fond (nouveau groupe de processus) dont `passer.sh` bloque : le temps
// de lancer une seconde boucle, ou `--arreter`. `/bin/sleep` : le `sleep` du jouet est factice.
const BLOQUE = 'echo "passer bloqué" >> "$TRACE"\n/bin/sleep 30';
function enTacheDeFond(d, ...args) {
  const enfant = spawn("bash", [BOUCLE, ...args], { cwd: d.travail, env: d.env, detached: true });
  let sortie = "";
  enfant.stdout.on("data", (b) => (sortie += b));
  enfant.stderr.on("data", (b) => (sortie += b));
  const fini = new Promise((ok) => enfant.on("close", (code, signal) => ok({ code, signal })));
  const nettoyer = () => {
    try {
      process.kill(-enfant.pid, "SIGKILL");
    } catch {
      /* déjà arrêtée */
    }
  };
  return { enfant, fini, nettoyer, sortie: () => sortie };
}
async function attendre(condition, delaiMs = 15000) {
  const fin = Date.now() + delaiMs;
  while (!condition()) {
    if (Date.now() > fin) throw new Error("délai dépassé");
    await new Promise((r) => setTimeout(r, 50));
  }
}
const fichierArret = (d) => join(d.travail, ".git", "boucle-arret");

test("une seconde boucle lancée pendant qu'une tourne s'arrête aussitôt, sortie 9", async () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1, BLOQUE) });
  const premiere = enTacheDeFond(d);
  try {
    await attendre(() => lu().includes("passer bloqué"));
    const seconde = d.lancer(BOUCLE);
    assert.equal(seconde.status, 9, seconde.stdout + seconde.stderr);
    assert.match(seconde.stderr, /une boucle tourne déjà/);
    assert.deepEqual(lu(), ["passer v1", "passer bloqué"], "la seconde n'a rien joué");
  } finally {
    premiere.nettoyer();
  }
});

test("le verrou survit à l'exec de relance : un fils tient déjà le descripteur 9, la nouvelle version ne le reprend pas", async () => {
  const { d, publier, lu } = jouet();
  // Un `git fetch` du premier tour lance un fils qui hérite du descripteur 9 : sans la garde
  // `BOUCLE_VERROU_PID`, l'instance relancée rouvrirait le verrou et se verrait refuser (sortie 9).
  const bin = join(d.racine, "bin-git");
  mkdirSync(bin);
  const git = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).stdout.trim();
  writeFileSync(
    join(bin, "git"),
    `#!/bin/sh\ncase "$1" in fetch) (/bin/sleep 30 </dev/null >/dev/null 2>&1 &) ;; esac\nexec ${git} "$@"\n`,
  );
  chmodSync(join(bin, "git"), 0o755);
  d.env.PATH = `${bin}:${d.env.PATH}`;
  publier({
    "boucle.sh": readFileSync(BOUCLE, "utf8").replace(/^([^\n]*\n)/, '$1echo "BOUCLE-NOUVELLE" >&2\n'),
    "file.sh": fileSh(1, 1),
    "passer.sh": passerSh(1, BLOQUE),
  });
  const premiere = enTacheDeFond(d);
  try {
    await attendre(() => lu().includes("passer bloqué"));
    assert.match(premiere.sortie(), /BOUCLE-NOUVELLE/, "la première a bien été relancée (exec)");
    const seconde = d.lancer(BOUCLE);
    assert.equal(seconde.status, 9, seconde.stdout + seconde.stderr);
  } finally {
    premiere.nettoyer();
  }
});

test("--arreter pendant un tour termine la boucle et ses processus, et pose le fichier d'arrêt", async () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 2), "passer.sh": passerSh(1, BLOQUE) });
  const boucle = enTacheDeFond(d);
  try {
    await attendre(() => lu().includes("passer bloqué"));
    const r = d.lancer(BOUCLE, "--arreter");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    // `close` n'arrive qu'une fois les tubes fermés : le `sleep` 30 du passage est donc mort aussi.
    const { code, signal } = await Promise.race([
      boucle.fini,
      new Promise((_, ko) => setTimeout(() => ko(new Error("boucle encore vivante")), 10000)),
    ]);
    assert.equal(code, 143, `sortie ${code}/${signal}`);
    assert.match(boucle.sortie(), /signal reçu/);
    assert.ok(existsSync(fichierArret(d)), "fichier d'arrêt posé");
    assert.deepEqual(lu(), ["passer v1", "passer bloqué"], "aucun second passage");
  } finally {
    boucle.nettoyer();
  }
});

test("le fichier d'arrêt est lu au début de chaque tour : sortie propre 10, pas de passage suivant", () => {
  const { d, publier, lu } = jouet();
  // Le premier passage pose le fichier d'arrêt lui-même ; la file en aurait encore un second.
  publier({
    "file.sh": fileSh(1, 2),
    "passer.sh": passerSh(1, 'touch "$(git rev-parse --git-common-dir)/boucle-arret"'),
  });
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 10, r.stdout + r.stderr);
  assert.match(r.stderr, /ARRÊT demandé/);
  assert.deepEqual(lu(), ["passer v1"]);
});

test("une boucle relancée tant que le fichier d'arrêt existe refuse de démarrer", () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1) });
  const arret = d.lancer(BOUCLE, "--arreter");
  assert.equal(arret.status, 0, arret.stdout + arret.stderr);
  assert.match(arret.stdout, /aucune boucle en cours/);
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 10, r.stdout + r.stderr);
  assert.match(r.stderr, /ARRÊT demandé/);
  assert.match(r.stderr, /--reprendre/);
  assert.deepEqual(lu(), []);
});

test("--reprendre retire le fichier d'arrêt et lance la boucle", () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1) });
  d.lancer(BOUCLE, "--arreter");
  assert.ok(existsSync(fichierArret(d)));
  const r = d.lancer(BOUCLE, "--reprendre");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(!existsSync(fichierArret(d)), "fichier d'arrêt retiré");
  assert.deepEqual(lu(), ["passer v1"]);
  // Le verrou est rendu avec la boucle : une relance ordinaire repart.
  const encore = d.lancer(BOUCLE);
  assert.equal(encore.status, 0, encore.stdout + encore.stderr);
});

test("--arreter en pleine fusion : la trappe remet le worktree propre, --reprendre repart", async () => {
  const { d, publier, lu } = jouet();
  d.branche("autre", "origin/develop", { "autre.txt": "x\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  publier({
    "file.sh": fileSh(1, 1),
    "passer.sh": passerSh(1, `git merge -q --no-commit --no-ff origin/autre\n${BLOQUE}`),
  });
  const boucle = enTacheDeFond(d);
  try {
    await attendre(() => lu().includes("passer bloqué"));
    assert.ok(d.git("rev-parse", "-q", "--verify", "MERGE_HEAD"), "fusion en cours avant l'arrêt");
    const r = d.lancer(BOUCLE, "--arreter");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    await boucle.fini;
    assert.throws(() => d.git("rev-parse", "-q", "--verify", "MERGE_HEAD"), "MERGE_HEAD annulé");
    assert.equal(d.git("status", "--porcelain"), "", "worktree propre");
    assert.equal(d.git("rev-parse", "HEAD"), d.git("rev-parse", "origin/develop"));
  } finally {
    boucle.nettoyer();
  }
  // Fusion déjà commitée (passer.sh a validé la fusion et régénère des index) : reset --hard.
  const autre = jouet();
  autre.d.branche("autre", "origin/develop", { "autre.txt": "x\n" });
  autre.d.git("switch", "-q", "--detach", "origin/develop");
  autre.publier({
    "file.sh": fileSh(1, 1),
    "passer.sh": passerSh(
      1,
      `git merge -q --no-edit origin/autre\necho sale > README.md\n${BLOQUE}`,
    ),
  });
  const b2 = enTacheDeFond(autre.d);
  try {
    await attendre(() => autre.lu().includes("passer bloqué"));
    assert.equal(autre.d.lancer(BOUCLE, "--arreter").status, 0);
    await b2.fini;
    assert.equal(autre.d.git("status", "--porcelain"), "");
    assert.equal(autre.d.git("rev-parse", "HEAD"), autre.d.git("rev-parse", "origin/develop"));
    const reprise = autre.d.lancer(BOUCLE, "--reprendre");
    assert.notEqual(reprise.status, 6, reprise.stdout + reprise.stderr);
  } finally {
    b2.nettoyer();
  }
});

test("boucle morte (kill -9) : les orphelins gardent le verrou, --arreter les tue par le groupe noté", async () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1, BLOQUE) });
  const boucle = enTacheDeFond(d);
  try {
    await attendre(() => lu().includes("passer bloqué"));
    process.kill(boucle.enfant.pid, "SIGKILL");
    await new Promise((r) => setTimeout(r, 200));
    const verrou = join(d.travail, ".git", "boucle.verrou");
    assert.equal(
      spawnSync("flock", ["-n", verrou, "true"]).status,
      1,
      "verrou encore tenu par les orphelins",
    );
    assert.equal(d.lancer(BOUCLE).status, 9, "une nouvelle boucle est refusée");
    const r = d.lancer(BOUCLE, "--arreter");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(spawnSync("flock", ["-n", verrou, "true"]).status, 0, "verrou libéré");
  } finally {
    boucle.nettoyer();
  }
});

test("--reprendre pendant qu'une boucle tient le verrou : refusé (9), fichier d'arrêt gardé", async () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1, BLOQUE) });
  const boucle = enTacheDeFond(d);
  try {
    await attendre(() => lu().includes("passer bloqué"));
    writeFileSync(fichierArret(d), "posé\n");
    const r = d.lancer(BOUCLE, "--reprendre");
    assert.equal(r.status, 9, r.stdout + r.stderr);
    assert.ok(existsSync(fichierArret(d)), "le fichier d'arrêt n'est pas retiré");
  } finally {
    boucle.nettoyer();
  }
});

test("une option inconnue ne lance pas la boucle : sortie 64", () => {
  const { d, publier, lu } = jouet();
  publier({ "file.sh": fileSh(1, 1), "passer.sh": passerSh(1) });
  const r = d.lancer(BOUCLE, "--arrete");
  assert.equal(r.status, 64, r.stdout + r.stderr);
  assert.match(r.stderr, /usage/);
  assert.deepEqual(lu(), []);
});

test("le fichier d'arrêt est relu avant livrer-prets : arrêt sans livraison", () => {
  const { d, publier, lu } = jouet();
  // `sujet.sh regrouper-series` (premier appel du tour) pose le fichier ; `livrer-prets` ne doit pas tourner.
  publier({
    "file.sh": fileSh(1, 0),
    "passer.sh": passerSh(1),
    "sujet.sh": `#!/usr/bin/env bash
case "$1" in
  regrouper-series) touch "$(git rev-parse --git-common-dir)/boucle-arret" ;;
  livrer-prets) echo "livrer-prets" >> "$TRACE" ;;
esac
exit 0
`,
  });
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 10, r.stdout + r.stderr);
  assert.deepEqual(lu(), [], "livrer-prets n'a pas tourné");
});
