// `regenerer_index` de github.sh (sourcé par sujet.sh, passer.sh et boucle.sh) : les contrôles
// (`verification`) jouent après toutes les régénérations, un échec fait échouer la mise à jour.
// Dépôt jouet partagé (depot-jouet.mjs) ; commandes et contrôles sont des `sh -c` triviaux.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const GITHUB = script("fusionner", "github.sh");
const SCRIPT_SUJET = script("sujet", "sujet.sh");

const declarer = (d, index) =>
  d.ecrire("scripts/docs/index-generes.json", JSON.stringify({ index }));

const regenerer = (d) =>
  spawnSync("bash", ["-c", `source ${GITHUB}; regenerer_index`], {
    cwd: d.travail,
    env: d.env,
    encoding: "utf8",
  });

test("regenerer_index joue les contrôles après toutes les commandes, dans l’ordre", () => {
  const d = depotJouet();
  declarer(d, [
    { chemin: "a.txt", commande: "echo cmd-a >> trace", verification: "echo ver-a >> trace" },
    { chemin: "b.txt", commande: "echo cmd-b >> trace", verification: "echo ver-b >> trace" },
  ]);
  const r = regenerer(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(d.lire("trace"), "cmd-a\ncmd-b\nver-a\nver-b\n");
});

test("regenerer_index dédoublonne les contrôles identiques", () => {
  const d = depotJouet();
  declarer(d, [
    { chemin: "a.txt", commande: "true", verification: "echo ver >> trace" },
    { chemin: "b.txt", commande: "true", verification: "echo ver >> trace" },
  ]);
  assert.equal(regenerer(d).status, 0);
  assert.equal(d.lire("trace"), "ver\n");
});

test("un contrôle en échec fait échouer regenerer_index, sortie et commande sur stderr", () => {
  const d = depotJouet();
  declarer(d, [{ chemin: "a.txt", commande: "true", verification: "echo types périmés; exit 1" }]);
  const r = regenerer(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /\[echo types périmés; exit 1\] types périmés/);
});

test("une entrée sans verification et une entrée en chaîne simple ne changent rien", () => {
  const d = depotJouet();
  declarer(d, ["docs/ancien.md", { chemin: "a.txt", commande: "echo cmd >> trace" }]);
  const r = regenerer(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(d.lire("trace"), "cmd\n");
});

test("rafraichir annule la mise à jour quand un contrôle échoue : le sujet reste inchangé", () => {
  const d = depotJouet();
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/demo");
  d.ecrire("autre.md", "develop avance\n");
  d.commit("docs: develop avance");
  d.git("push", "-q", "origin", "HEAD:develop");
  declarer(d, [{ chemin: "a.txt", commande: "true", verification: "echo faux; exit 1" }]);
  d.commit("chore: contrôle qui échoue");
  d.git("push", "-q", "origin", "HEAD:develop");
  const avant = d.git("rev-parse", "origin/sujet/demo");
  const r = d.lancer(SCRIPT_SUJET, "rafraichir", "demo");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /gate des index\/registres en échec/);
  assert.match(r.stderr, /\[echo faux; exit 1\] faux/);
  assert.equal(d.git("ls-remote", "origin", "sujet/demo").split("\t")[0], avant);
});

test("regenerer_index montre la sortie d’une commande de régénération en échec, préfixée de la commande", () => {
  const d = depotJouet();
  const commande = "echo base injoignable; echo detail >&2; exit 1";
  declarer(d, [{ chemin: "a.txt", commande }]);
  const r = regenerer(d);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.ok(r.stderr.includes(`[${commande}] base injoignable`), r.stderr);
  assert.ok(r.stderr.includes(`[${commande}] detail`), r.stderr);
});

test("jq absent : github.sh s'arrête dès qu'on le source, sortie 69, une ligne qui dit quoi installer", () => {
  const d = depotJouet();
  const bash = spawnSync("sh", ["-c", "command -v bash"], { encoding: "utf8" }).stdout.trim();
  const vide = join(d.racine, "vide");
  mkdirSync(vide);
  const r = spawnSync(bash, ["-c", `source ${GITHUB}; echo suite`], {
    cwd: d.travail,
    env: { ...d.env, PATH: vide },
    encoding: "utf8",
  });
  assert.equal(r.status, 69, r.stdout + r.stderr);
  assert.equal(r.stdout, "");
  assert.equal(r.stderr.trim().split("\n").length, 1, r.stderr);
  assert.match(r.stderr, /jq est requis/);
  assert.match(r.stderr, /sudo apt install jq/);
});

// `ascendance <testé> <cible>` : la règle d'ascendance, partagée par passer.sh et sujet.sh. Quatre verdicts ; une
// réf absente ne conclut jamais `à-jour`.
const ascendance = (d, teste, cible) =>
  spawnSync("bash", ["-c", `source ${GITHUB}; ascendance "$1" "$2"`, "_", teste, cible], {
    cwd: d.travail,
    env: d.env,
    encoding: "utf8",
  });
const ADR = "docs/adr";
// develop ajoute l'ADR 1 ; `pr` part d'avant et apporte `fichiersPr` ; develop reçoit ensuite `fichiersCible`.
function ascendanceJouet(fichiersPr, fichiersCible) {
  const d = depotJouet();
  d.ecrire("docs/f.md", "0\n");
  d.commit("docs: f");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  const teste = d.branche("feat/pr", "origin/develop", fichiersPr);
  if (fichiersCible) d.branche("develop", "origin/develop", fichiersCible);
  d.git("switch", "-q", "--detach", "origin/develop");
  return { d, teste };
}

test("ascendance : la cible est ancêtre du sommet testé, à-jour", () => {
  const { d, teste } = ascendanceJouet({ "docs/x.md": "x\n" });
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "à-jour\n");
});

test("ascendance : la cible a avancé sans conflit, retard (même pour de la documentation seule)", () => {
  const { d, teste } = ascendanceJouet({ "docs/x.md": "x\n" }, { "docs/guide.md": "g\n" });
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "retard\n");
});

test("ascendance : conflit sur un index généré seul, conflit-index avec le fichier", () => {
  const { d, teste } = ascendanceJouet(
    { [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n", [`${ADR}/README.md`]: "- ADR_ALL_ARC-2-b.md\n" },
    { [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n", [`${ADR}/README.md`]: "- ADR_ALL_ARC-3-c.md\n" },
  );
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `conflit-index\n${ADR}/README.md\n`);
});

test("ascendance : conflit hors index générés, conflit avec les fichiers", () => {
  const { d, teste } = ascendanceJouet(
    { "docs/f.md": "pr\n", [`${ADR}/README.md`]: "- pr\n" },
    { "docs/f.md": "develop\n", [`${ADR}/README.md`]: "- develop\n" },
  );
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `conflit\n${ADR}/README.md\ndocs/f.md\n`);
});

test("ascendance : la liste des index se lit sur la cible, jamais dans l'arbre de travail", () => {
  const { d, teste } = ascendanceJouet({ "docs/f.md": "pr\n" }, { "docs/f.md": "develop\n" });
  // L'arbre de travail déclare docs/f.md index généré : la cible, elle, ne le déclare pas.
  declarer(d, [{ chemin: "docs/f.md", commande: "true" }]);
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "conflit\ndocs/f.md\n");
});

test("ascendance : une réf absente sort en 1, motif sur la sortie d'erreur, jamais à-jour", () => {
  const { d, teste } = ascendanceJouet({ "docs/x.md": "x\n" });
  for (const [a, b] of [
    [teste, "origin/absente"],
    ["0".repeat(40), "origin/develop"],
  ]) {
    const r = ascendance(d, a, b);
    assert.equal(r.status, 1, r.stdout);
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /introuvable/);
  }
});
