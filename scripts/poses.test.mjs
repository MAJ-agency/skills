// Les bancs que les étapes `poser` copient à plat sous `scripts/chaine/` d'un projet tournent hors du
// plugin : aucun ne lit l'arbre du plugin sans repli. Les sources se lisent dans les dossiers des
// skills posés, pas dans une liste recopiée : un script ajouté à l'un d'eux est posé ici aussi.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { environnementDeBanc } from "../skills/chaine/sujet/scripts/depot-jouet.mjs";
import { spawn } from "node:child_process";
import { availableParallelism } from "node:os";
import { aDesSousTests, couverture, nomsDesTests, RAPPORTEUR, travaux } from "./tranches.mjs";

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
// Fichiers posés un à un, et non par dossier : de `references/scripts/github/`, le socle de la chaîne ne pose que
// CODEOWNERS et le check `PR titre`, avec leurs bancs (étape 4 ter) ; `develop.sh` part seul, sans son banc (étape 9).
const SOCLE_GITHUB = "skills/chaine/socle-chaine-de-production/references/scripts/github";
const FICHIERS_POSES = [
  [`${SOCLE_GITHUB}/codeowners.mjs`, "scripts/github/codeowners.mjs"],
  [`${SOCLE_GITHUB}/codeowners.test.mjs`, "scripts/github/codeowners.test.mjs"],
  [`${SOCLE_GITHUB}/pr-titre.mjs`, "scripts/github/pr-titre.mjs"],
  [`${SOCLE_GITHUB}/pr-titre.test.mjs`, "scripts/github/pr-titre.test.mjs"],
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
// Une tranche : au plus TAILLE noms distincts (fusionner.test.mjs : 100 noms lus, dix tranches et un reste, où tournent
// ses 16 tests écrits en boucle) ; PARALLELE tranches à la fois, comme `node --test` joue ses fichiers.
const TAILLE = 10;
const PARALLELE = Math.max(2, availableParallelism() - 1);
const env = () => environnementDeBanc();

test("les bancs posés à plat sous scripts/chaine/ tournent hors du plugin", { timeout: 620_000 }, async () => {
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
    for (const [source, destination] of [...FICHIERS_POSES, ...RACINE_PROJET]) poser(source, destination);
    mkdirSync(join(projet, ".husky"), { recursive: true });
    writeFileSync(join(projet, ".husky/pre-commit"), PRE_COMMIT_PROJET, { mode: 0o755 });
    // Les bancs posés à plat dans scripts/chaine/ et scripts/github/ (socle de la chaîne : CODEOWNERS, PR titre).
    const bancs = ["scripts/chaine", "scripts/github"].flatMap((dossier) =>
      readdirSync(join(projet, dossier))
        .filter((n) => n.endsWith(".test.mjs"))
        .sort()
        .map((n) => join(dossier, n)));
    // Ticket 62 : `node --test` joue les tests d'un fichier l'un après l'autre, et `fusionner.test.mjs` (322 s sur 324
    // pour tous les bancs) fixait seul la durée de ce test. Chaque banc se joue en tranches d'au plus TAILLE noms
    // distincts, chacune par son processus, PARALLELE à la fois, les plus gros bancs d'abord ; la couverture prouve que
    // chaque test de premier niveau a tourné exactement une fois, ceux que la lecture des noms ne reconnaît pas compris
    // (tranche de reste). Un banc qui écrit des sous-tests se joue entier.
    writeFileSync(join(projet, "rapporteur-tranches.mjs"), RAPPORTEUR);
    const liste = bancs
      .map((banc) => {
        const source = readFileSync(join(projet, banc), "utf8");
        return travaux(banc, nomsDesTests(source), TAILLE, { entier: aDesSousTests(source) });
      })
      .sort((a, b) => b.length - a.length)
      .flat();
    const jouer = (t, i) =>
      new Promise((fin) => {
        const rapport = join(projet, `rapport-${i}.jsonl`);
        const args = ["--test", "--test-reporter=spec", "--test-reporter-destination=stdout", "--test-reporter=./rapporteur-tranches.mjs", `--test-reporter-destination=${rapport}`, ...t.args];
        const enfant = spawn(process.execPath, args, { cwd: projet, env: env(), stdio: ["ignore", "pipe", "pipe"] });
        let sortie = "";
        enfant.stdout.on("data", (d) => (sortie += d));
        enfant.stderr.on("data", (d) => (sortie += d));
        const minuterie = setTimeout(() => enfant.kill("SIGKILL"), 300_000);
        enfant.on("close", (code, signal) => {
          clearTimeout(minuterie);
          let noms = [];
          try {
            noms = readFileSync(rapport, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).nom);
          } catch {}
          fin({ t, code, signal, sortie: sortie.trim(), noms });
        });
      });
    const resultats = new Array(liste.length);
    let suivant = 0;
    await Promise.all(
      Array.from({ length: Math.min(PARALLELE, liste.length) }, async () => {
        while (suivant < liste.length) {
          const i = suivant++;
          resultats[i] = await jouer(liste[i], i);
        }
      }),
    );
    const enEchec = resultats.filter((r) => r.code !== 0);
    const recit = (r) => [`── ${r.t.banc} (${r.t.sorte}, sortie ${r.code ?? r.signal})`, ...r.sortie.split("\n").filter((l) => /^\s*✖/.test(l) || /\bnot ok\b/.test(l)), ...r.sortie.split("\n").slice(-40)].join("\n");
    assert.deepEqual(enEchec.map((r) => r.t.banc), [], enEchec.map(recit).join("\n"));
    assert.deepEqual(couverture(liste, resultats.map((r) => r.noms)), [], "chaque test d'un banc posé tourne exactement une fois");
    const joues = resultats.reduce((n, r) => n + r.noms.length, 0);
    assert.ok(joues >= PLANCHER, `les bancs posés ont joué ${joues} tests, plancher ${PLANCHER} : ils ne jouent rien (NODE_TEST_CONTEXT hérité ?)`);
  } finally {
    rmSync(projet, { recursive: true, force: true });
  }
});

// Un projet réel a son contrat, propriétaires remplis (question 4 du socle) : le banc de CODEOWNERS posé le lit et
// doit y passer aussi, pas seulement dans un projet sans contrat.
test("le banc de CODEOWNERS posé passe dans un projet dont le contrat a ses propriétaires", { timeout: 60_000 }, () => {
  const projet = mkdtempSync(join(tmpdir(), "poses-contrat-"));
  try {
    for (const [source, destination] of FICHIERS_POSES) {
      mkdirSync(join(projet, destination, ".."), { recursive: true });
      copyFileSync(join(RACINE, source), join(projet, destination));
    }
    mkdirSync(join(projet, ".claude"));
    const gabarit = JSON.parse(readFileSync(join(RACINE, "skills/chaine/socle-chaine-de-production/references/chaine.json"), "utf8"));
    const contrat = { ...gabarit, proprietaires: ["@exemple-une", "@exemple/relecteurs"], cheminsSensibles: [...gabarit.cheminsSensibles, "apps/api/src/auth/"] };
    writeFileSync(join(projet, ".claude/chaine.json"), JSON.stringify(contrat, null, 2));
    const r = spawnSync(process.execPath, ["--test", "scripts/github/codeowners.test.mjs"], { cwd: projet, env: env(), encoding: "utf8", timeout: 50_000 });
    assert.equal(r.status, 0, (r.stdout + r.stderr).split("\n").filter((l) => /not ok|✖|Error/.test(l)).join("\n"));
  } finally {
    rmSync(projet, { recursive: true, force: true });
  }
});
