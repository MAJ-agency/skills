// `regenerer_index` de github.sh (sourcé par sujet.sh, passer.sh et boucle.sh) : les contrôles
// (`verification`) jouent après toutes les régénérations, un échec fait échouer la mise à jour.
// Dépôt jouet partagé (depot-jouet.mjs) ; commandes et contrôles sont des `sh -c` triviaux.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
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
