// Le gabarit `husky/pre-commit` du socle, joué sur le dépôt jouet du skill `sujet` depuis un worktree :
// lint-staged lit l'index du commit (GIT_INDEX_FILE), `pnpm run check:commit` ne voit plus ni GIT_DIR ni
// GIT_INDEX_FILE (sinon ses bancs à `git init` jouet écriraient dans le dépôt réel). Banc du plugin, jamais
// posé : il éprouve le gabarit, pas le hook d'un projet. Les scripts du capitaine sous un hook quelconque
// sont éprouvés par fusionner.test.mjs, posé.
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { depotJouet } from "../skills/chaine/sujet/scripts/depot-jouet.mjs";

const PRE_COMMIT = fileURLToPath(new URL("../skills/monorepo/socle-monorepo/references/husky/pre-commit", import.meta.url));

test("pre-commit du socle, depuis un worktree : lint-staged voit GIT_INDEX_FILE, check:commit ne voit ni GIT_DIR ni GIT_INDEX_FILE", () => {
  const d = depotJouet();
  const journal = join(d.racine, "hooks.log");
  const J = JSON.stringify(journal);
  const outil = (dossier, nom, corps) => {
    writeFileSync(join(dossier, nom), `#!/bin/sh\n${corps}\n`);
    chmodSync(join(dossier, nom), 0o755);
  };
  const hooks = join(d.racine, "hooks");
  mkdirSync(hooks);
  writeFileSync(join(hooks, "pre-commit"), readFileSync(PRE_COMMIT, "utf8"));
  chmodSync(join(hooks, "pre-commit"), 0o755);
  const vu = (nom) => `echo "${nom} GIT_DIR=\${GIT_DIR-absent} GIT_INDEX_FILE=\${GIT_INDEX_FILE-absent}" >> ${J}`;
  outil(join(d.racine, "bin"), "npx", vu("lint-staged"));
  outil(join(d.racine, "bin"), "pnpm", `cat > /dev/null\n[ "$1 $2" != "run check:commit" ] || ${vu("check:commit")}`);
  d.git("config", "core.hooksPath", hooks);
  const arbre = join(d.racine, "arbre");
  d.git("worktree", "add", "-q", "-b", "feat/w", arbre, "origin/develop");
  writeFileSync(join(arbre, "w.md"), "w\n");
  d.git("-C", arbre, "add", "w.md");
  d.git("-C", arbre, "commit", "-q", "-m", "docs: w");
  const lus = existsSync(journal) ? readFileSync(journal, "utf8").trim().split("\n") : [];
  assert.ok(lus.some((l) => /^lint-staged .*GIT_INDEX_FILE=(?!absent)/.test(l)), `lint-staged a vu GIT_INDEX_FILE : ${lus}`);
  assert.ok(lus.includes("check:commit GIT_DIR=absent GIT_INDEX_FILE=absent"), `check:commit ne les a pas vus : ${lus}`);
});
