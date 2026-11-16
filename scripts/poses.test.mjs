// Les bancs que les étapes `poser` copient à plat sous `scripts/chaine/` d'un projet tournent hors du
// plugin : aucun ne lit l'arbre du plugin sans repli. Les sources se lisent dans les dossiers des
// skills posés, pas dans une liste recopiée : un script ajouté à l'un d'eux est posé ici aussi.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
// [dossier source dans le plugin, dossier de destination dans le projet]
const POSES = [
  ["skills/chaine/fusionner/scripts", "scripts/chaine"],
  ["skills/chaine/sujet/scripts", "scripts/chaine"],
  ["skills/chaine/revue-adversariale/scripts", "scripts/chaine"],
  ["skills/chaine/revue-de-ticket/scripts", "scripts/chaine"],
  ["skills/monorepo/socle-monorepo/references/scripts/docs", "scripts/docs"],
  ["skills/chaine/tickets/references/scripts/docs", "scripts/docs"],
  ["skills/chaine/tickets/references/scripts/verify", "scripts/verify"],
];
// Fichiers de la racine du projet que les bancs posés lisent (socle-monorepo, TABLE-RACINE.md).
const RACINE_PROJET = [
  ["skills/monorepo/socle-monorepo/references/racine/commitlint.config.mjs", "commitlint.config.mjs"],
  // Le pre-push du socle, que `sujet-clore.test.mjs` joue devant une suppression de branche.
  ["skills/monorepo/socle-monorepo/references/husky/pre-push", ".husky/pre-push"],
];
// Le pre-commit d'un projet n'est pas le gabarit, et le dépôt jouet ne peut pas le faire tourner (il appelle
// les scripts et les dépendances du projet) : celui du garde refuse tout, un banc posé qui le joue tombe.
const PRE_COMMIT_PROJET = `#!/bin/sh
echo "pre-commit du projet : un banc posé ne le joue pas" >&2
exit 1
`;
// Sans les GIT_* hérités (sous un hook git, ils visent le vrai dépôt) ni NODE_TEST_CONTEXT : avec lui, le
// `node --test` enfant rend ses résultats au parent au lieu de les jouer et de sortir non nul.
// Plancher du nombre de tests que l'enfant joue (plus de 170 à l'écriture) : sous lui, le garde ne jouait rien.
const PLANCHER = 150;
const env = () =>
  Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith("GIT_") && cle !== "NODE_TEST_CONTEXT"));

test("les bancs posés à plat sous scripts/chaine/ tournent hors du plugin", { timeout: 320_000 }, () => {
  const projet = mkdtempSync(join(tmpdir(), "poses-"));
  try {
    const poses = new Map();
    const poser = (source, destination) => {
      assert.ok(!poses.has(destination), `${destination} posé deux fois : ${poses.get(destination)} et ${source}`);
      poses.set(destination, source);
      mkdirSync(join(projet, destination, ".."), { recursive: true });
      copyFileSync(join(RACINE, source), join(projet, destination));
      if (/\.sh$|pre-(commit|push)$/.test(destination)) chmodSync(join(projet, destination), 0o755);
    };
    for (const [dossier, vers] of POSES)
      for (const nom of readdirSync(join(RACINE, dossier))) poser(`${dossier}/${nom}`, `${vers}/${nom}`);
    for (const [source, destination] of RACINE_PROJET) poser(source, destination);
    mkdirSync(join(projet, ".husky"), { recursive: true });
    writeFileSync(join(projet, ".husky/pre-commit"), PRE_COMMIT_PROJET, { mode: 0o755 });
    const bancs = readdirSync(join(projet, "scripts/chaine"))
      .filter((n) => n.endsWith(".test.mjs"))
      .sort()
      .map((n) => join("scripts/chaine", n));
    const r = spawnSync(process.execPath, ["--test", "--test-reporter=spec", ...bancs], {
      cwd: projet,
      env: env(),
      encoding: "utf8",
      timeout: 300_000,
    });
    const sortie = (r.stdout + r.stderr).trim();
    const echecs = sortie.split("\n").filter((l) => /^\s*✖/.test(l) || /\bnot ok\b/.test(l));
    const joues = Number(/^\W*tests\s+(\d+)/m.exec(sortie)?.[1] ?? 0);
    assert.equal(r.status, 0, [...echecs, ...sortie.split("\n").slice(-40)].join("\n"));
    assert.ok(joues >= PLANCHER, `l'enfant a joué ${joues} tests, plancher ${PLANCHER} : il ne joue rien (NODE_TEST_CONTEXT hérité ?)\n${sortie.split("\n").slice(-20).join("\n")}`);
  } finally {
    rmSync(projet, { recursive: true, force: true });
  }
});
