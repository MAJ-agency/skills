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
import { environnementDeBanc } from "../skills/chaine/sujet/scripts/depot-jouet.mjs";
import { availableParallelism } from "node:os";
import { readFileSync } from "node:fs";
import { aDesSousTests, conclure, lancer, nomsDesTests, ordre, PLAFOND, RAPPORTEUR, travaux } from "./tranches.mjs";

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
// le check `PR titre`, avec son banc (étape 4 ter) ; `develop.sh` part seul, sans son banc (étape 9).
const SOCLE_GITHUB = "skills/chaine/socle-chaine-de-production/references/scripts/github";
const FICHIERS_POSES = [
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
// Une tranche : au plus TAILLE noms distincts (fusionner.test.mjs : 91 noms lus, dix tranches et un reste, où tournent
// ses tests écrits en boucle) ; PARALLELE tranches à la fois, comme `node --test` joue ses fichiers.
const TAILLE = 10;
const PARALLELE = Math.max(2, availableParallelism() - 1);
const env = () => environnementDeBanc();

// Ticket 64 : le délai du test est le plafond de `tranches.mjs` (garde contre un blocage, pas une assertion). Chaque
// travail a sa borne, qui suit son poids, et est tué par son groupe de processus. Le bilan (part du plafond, pire cas, trois
// marges les plus courtes) est rendu par `t.diagnostic`, en vert comme en rouge ; atteindre le plafond rougit.
test("les bancs posés à plat sous scripts/chaine/ tournent hors du plugin", { timeout: PLAFOND + 60_000 }, async (t) => {
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
    // Les bancs posés à plat dans scripts/chaine/ et scripts/github/ (socle de la chaîne : PR titre).
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
    const parBanc = bancs.flatMap((banc) => {
      const source = readFileSync(join(projet, banc), "utf8");
      return travaux(banc, nomsDesTests(source), TAILLE, { entier: aDesSousTests(source), source });
    });
    const liste = ordre(parBanc);
    const jouer = async (travail, i) => {
      const rapport = join(projet, `rapport-${i}.jsonl`);
      const args = ["--test", "--test-reporter=spec", "--test-reporter-destination=stdout", "--test-reporter=./rapporteur-tranches.mjs", `--test-reporter-destination=${rapport}`, ...travail.args];
      const promesse = lancer(args, { cwd: projet, env: env(), borne: travail.borne });
      enCours.add(promesse);
      const r = await promesse;
      enCours.delete(promesse);
      let noms = [];
      try {
        noms = readFileSync(rapport, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).nom);
      } catch {}
      return { ...r, t: travail, noms };
    };
    const resultats = new Array(liste.length);
    const enCours = new Set();
    let suivant = 0;
    let depasse = false;
    const debut = Date.now();
    const garde = setTimeout(() => {
      depasse = true;
      for (const p of enCours) p.arreter();
    }, PLAFOND);
    try {
      await Promise.all(
        Array.from({ length: Math.min(PARALLELE, liste.length) }, async () => {
          while (suivant < liste.length && !depasse) {
            const i = suivant++;
            resultats[i] = await jouer(liste[i], i);
          }
        }),
      );
    } finally {
      clearTimeout(garde);
      for (const p of enCours) p.arreter();
    }
    // Un travail arrêté par la garde est un travail non joué : il compte parmi les non joués, pas parmi les résultats.
    const rendus = resultats.map((r) => (depasse && r?.arrete ? undefined : r));
    const { diagnostics, fautes } = conclure(liste, rendus, { parallele: PARALLELE, duree: Date.now() - debut, depasse, plancher: PLANCHER });
    for (const ligne of diagnostics) t.diagnostic(ligne);
    assert.deepEqual(fautes, [], "les bancs posés tournent hors du plugin, chaque test exactement une fois");
  } finally {
    rmSync(projet, { recursive: true, force: true });
  }
});
