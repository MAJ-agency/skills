// Les bancs de la chaîne tournent sous le pre-push, donc sous le capitaine quand passer.sh pousse :
// ils héritent alors de PASSER_OUTILS, BOUCLE_COPIE, BOUCLE_SAUTEES, PRE_PUSH_REFS… du vrai
// capitaine. Le dépôt jouet (depot-jouet.mjs) les retire : le passer.sh d'un banc lit ses propres
// outils, la boucle d'un banc n'écrase pas la copie du vrai capitaine ni ne saute ses PR.
// Le scénario tourne dans un node enfant, car depot-jouet.mjs lit process.env à son chargement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DEPOT_JOUET = new URL("./depot-jouet.mjs", import.meta.url).href;

// Une PR prête (#7) sur le jouet, la boucle du jouet la passe ; l'enfant rend l'env du jouet et la sortie.
const SCENARIO = `
import { depotJouet, script } from ${JSON.stringify(DEPOT_JOUET)};
const d = depotJouet();
d.publierChaine();
d.branche("docs/simple", "origin/develop", { "docs/simple.md": "simple\\n" });
d.git("switch", "-q", "--detach", "origin/develop");
d.github({
  exiges: ["qualite"],
  checks: { "*": { qualite: "SUCCESS" } },
  pulls: [{ number: 7, title: "docs(demo): simple", head: "docs/simple", base: "develop", labels: ["à-fusionner"] }],
});
const r = d.lancer(script("fusionner", "boucle.sh"));
console.log(JSON.stringify({ cles: Object.keys(d.env), status: r.status, sortie: r.stdout + r.stderr }));
`;

// Ce que le capitaine exporte quand passer.sh pousse sous le pre-push : outils et copie du vrai
// capitaine (sa copie, incomplète, sans revue-exigee.mjs), PR sautées, refs du vrai push.
function capitainePiege() {
  const racine = mkdtempSync(join(tmpdir(), "capitaine-"));
  const copie = join(racine, ".git", "boucle-outils");
  const outils = join(copie, "scripts", "chaine");
  mkdirSync(outils, { recursive: true });
  writeFileSync(join(copie, "MARQUE"), "copie du vrai capitaine\n");
  const env = {
    PASSER_OUTILS: outils,
    BOUCLE_COPIE: copie,
    BOUCLE_SAUTEES: " 7 ",
    BOUCLE_ATTENTE: " 7 ",
    BOUCLE_VERROU_PID: "1",
    PRE_PUSH_REFS: `refs/heads/vraie ${"1".repeat(40)} refs/heads/vraie ${"2".repeat(40)}`,
    REVUE_DIR: join(racine, "revue"),
  };
  return { racine, copie, env };
}

test(
  "sous les variables du capitaine héritées, la boucle d'un banc fusionne sa PR avec ses propres outils et laisse la copie du capitaine intacte",
  { timeout: 120_000 },
  () => {
    const p = capitainePiege();
    try {
      const r = spawnSync(process.execPath, ["--input-type=module", "-e", SCENARIO], {
        env: { ...process.env, ...p.env },
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stdout + r.stderr);
      const { cles, status, sortie } = JSON.parse(r.stdout.trim().split("\n").at(-1));
      assert.equal(status, 0, sortie);
      assert.match(sortie, /\[#7\] FUSIONNÉE/);
      assert.ok(
        existsSync(join(p.copie, "MARQUE")),
        "la copie des outils du capitaine a été remplacée",
      );
      assert.deepEqual(readdirSync(join(p.racine, ".git")), ["boucle-outils"]);
      assert.deepEqual(
        cles.filter((cle) => cle in p.env),
        [],
        "l'environnement du dépôt jouet garde des variables du capitaine",
      );
    } finally {
      rmSync(p.racine, { recursive: true, force: true });
    }
  },
);

// Sous un terminal, `node --test` pose FORCE_COLOR=1 : un enfant de banc en hérite et sa sortie porte des
// séquences ANSI. Même scénario enfant que ci-dessus : depot-jouet.mjs lit process.env à son chargement.
const SCENARIO_COULEUR = `
import { depotJouet } from ${JSON.stringify(DEPOT_JOUET)};
import { spawnSync } from "node:child_process";
const d = depotJouet();
const enfant = spawnSync(process.execPath, ["-e", "console.log(4)"], { env: d.env, encoding: "utf8" });
console.log(JSON.stringify({ force: d.env.FORCE_COLOR ?? null, noColor: d.env.NO_COLOR ?? null, sortie: enfant.stdout }));
`;

function sousCouleurHeritee() {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", SCENARIO_COULEUR], {
    env: { ...process.env, FORCE_COLOR: "1", NO_COLOR: undefined },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return JSON.parse(r.stdout.trim().split("\n").at(-1));
}

test("sous FORCE_COLOR=1 hérité (node --test sous un terminal), l'environnement du dépôt jouet n'a pas FORCE_COLOR et porte NO_COLOR=1", () => {
  const { force, noColor } = sousCouleurHeritee();
  assert.equal(force, null);
  assert.equal(noColor, "1");
});

test("un enfant d'un banc ne rend aucune séquence ANSI quand le banc hérite de FORCE_COLOR=1", () => {
  assert.equal(sousCouleurHeritee().sortie, "4\n");
});
