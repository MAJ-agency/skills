// Chemins sensibles de l'étape 2 de la revue : moteur du gate recopié, CLI, parité avec le gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const { dossierTemporaire } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);
// Posé dans un projet, le gate est dans scripts/verify/ ; dans le plugin, le dépôt jouet du skill tickets le pose.
const GATE_POSE = new URL("../verify/tickets-regles.mjs", import.meta.url);
const chargerGate = existsSync(GATE_POSE)
  ? () => import(GATE_POSE.href)
  : async () => (await import("../../tickets/references/scripts/docs/depot-jouet.mjs")).module("verify/tickets-regles.mjs");

const CLI = new URL("./chemins-sensibles.mjs", import.meta.url).pathname;
const sansGit = () =>
  Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith("GIT_")));

// [motif, chemin, touché]
const TABLE = [
  ["apps/api/src/**/auth/**", "apps/api/src/auth/guard.ts", true],
  ["apps/api/src/**/auth/**", "apps/api/src/infrastructure/http/auth/guard.ts", true],
  ["apps/api/src/**/auth/**", "apps/api/src/authz/x.ts", false],
  ["src/paiement/*webhook*", "src/paiement/stripe-webhook.ts", true],
  ["src/paiement/*webhook*", "src/paiement/sous/webhook.ts", false],
  ["scripts/docs/identifiants.mjs", "scripts/docs/identifiants.mjs", true],
  ["scripts/docs/identifiants.mjs", "scripts/docs/identifiantsXmjs", false],
  ["apps/web/src/lib/auth/", "apps/web/src/lib/auth/session.ts", true],
  [".claude/**", ".claude/settings.json", true],
  [".claude/**", "x.claude/a", false],
  ["**/auth/**", "auth/a.ts", true],
  ["**/auth/**", "apps/api/src/auth/a.ts", true],
  ["**/auth/**", "apps/api/src/authz/a.ts", false],
  ["src/*.pem", "src/cle.pem", true],
  ["src/*.pem", "src/sous/cle.pem", false],
  ["src/paiement/*", "src/paiement/relevé de compte.ts", true],
  ["src/paiement/", "src/paiement/relevé de compte.ts", true],
  ["src/paiement/réglé.ts", "src/paiement/réglé.ts", true],
  ["src/a.b+c(d).ts", "src/a.b+c(d).ts", true],
  ["src/a.b+c(d).ts", "src/aXb+c(d).ts", false],
  ["src/a.b+c(d).ts", "src/a.bbc(d).ts", false],
]; 

function dossierAvec(contrat) {
  const d = dossierTemporaire("sens-");
  if (contrat !== undefined) {
    mkdirSync(join(d, ".claude"));
    writeFileSync(join(d, ".claude/chaine.json"), contrat);
  }
  return d;
}
const lancer = (cwd, entree) =>
  spawnSync("node", [CLI], { cwd, input: entree, encoding: "utf8", env: sansGit() });

test("la table : les motifs se lisent comme ceux du gate", () => {
  for (const [motif, chemin, touche] of TABLE) {
    const r = lancer(dossierAvec(JSON.stringify({ cheminsSensibles: [motif] })), `${chemin}\n`);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, touche ? `${chemin}\t${motif}\n` : "", `${motif} / ${chemin}`);
  }
});

test("parité : même verdict que motifSensibleTouche du gate", async () => {
  const gate = await chargerGate();
  for (const [motif, chemin] of TABLE) {
    const r = lancer(dossierAvec(JSON.stringify({ cheminsSensibles: [motif] })), `${chemin}\n`);
    const attendu = gate.motifSensibleTouche(chemin, [motif]);
    assert.equal(r.stdout, attendu === null ? "" : `${chemin}\t${attendu}\n`, `${motif} / ${chemin}`);
  }
});

test("CLI : chemin<TAB>motif des seuls chemins touchés, sortie 0 ; sans contrat, rien et 0", () => {
  const d = dossierAvec(JSON.stringify({ cheminsSensibles: [".claude/**", "src/auth/"] }));
  const r = lancer(d, "README.md\n.claude/settings.json\nsrc/auth/a.ts\nsrc/autre.ts\n");
  assert.equal(r.status, 0);
  assert.equal(r.stdout, ".claude/settings.json\t.claude/**\nsrc/auth/a.ts\tsrc/auth/\n");
  const sans = lancer(dossierAvec(undefined), "src/auth/a.ts\n");
  assert.equal(sans.status, 0);
  assert.equal(sans.stdout, "");
});

test("CLI : contrat illisible ou cheminsSensibles pas une liste de chaînes, sortie 2 avec motif sur stderr", () => {
  for (const contrat of ["{pas du json", JSON.stringify({ cheminsSensibles: "src/" }), JSON.stringify({ cheminsSensibles: [1] })]) {
    const r = lancer(dossierAvec(contrat), "src/a.ts\n");
    assert.equal(r.status, 2, contrat);
    assert.match(r.stderr, /chaine\.json/);
    assert.equal(r.stdout, "");
  }
});

test("la commande de l'étape 2 : un fichier déplacé hors du dossier sensible et un chemin accentué sont vus", () => {
  const d = dossierAvec(JSON.stringify({ cheminsSensibles: ["src/paiement/"] }));
  const env = {
    ...sansGit(),
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@example.org",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@example.org",
  };
  const git = (...a) => execFileSync("git", a, { cwd: d, env, encoding: "utf8" });
  git("init", "-q", "-b", "develop");
  mkdirSync(join(d, "src/paiement"), { recursive: true });
  writeFileSync(join(d, "src/paiement/stripe-webhook.ts"), "export const a = 1;\n".repeat(20));
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("switch", "-q", "-c", "feat");
  mkdirSync(join(d, "src/divers"), { recursive: true });
  git("mv", "src/paiement/stripe-webhook.ts", "src/divers/ancien.ts");
  writeFileSync(join(d, "src/paiement/réglé.ts"), "export const b = 2;\n");
  git("add", "-A");
  git("commit", "-q", "-m", "feat");
  const r = spawnSync(
    "bash",
    ["-c", `git -c core.quotepath=false diff --name-only --no-renames develop...HEAD | node "${CLI}"`],
    { cwd: d, env, encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr);
  const lignes = r.stdout.trim().split("\n").sort();
  assert.deepEqual(lignes, [
    "src/paiement/réglé.ts\tsrc/paiement/",
    "src/paiement/stripe-webhook.ts\tsrc/paiement/",
  ]);
});

test("entrée vide : sortie 2 avec un motif, jamais lue comme « rien de sensible »", () => {
  const r = lancer(dossierAvec(JSON.stringify({ cheminsSensibles: ["src/"] })), "");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /aucun fichier reçu/);
  assert.equal(r.stdout, "");
  // Une entrée non vide sans chemin sensible reste une sortie 0 silencieuse.
  const ok = lancer(dossierAvec(JSON.stringify({ cheminsSensibles: ["src/"] })), "README.md\n");
  assert.equal(ok.status, 0);
  assert.equal(ok.stdout, "");
});

test("la commande de l'étape 2 : git en échec dans le tube, avec pipefail, sort non nul", () => {
  const d = dossierAvec(JSON.stringify({ cheminsSensibles: ["src/"] }));
  const env = { ...sansGit(), GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" };
  execFileSync("git", ["init", "-q", "-b", "develop"], { cwd: d, env });
  const r = spawnSync(
    "bash",
    ["-c", `set -o pipefail; git -c core.quotepath=false diff --name-only --no-renames base-introuvable...HEAD | node "${CLI}"`],
    { cwd: d, env, encoding: "utf8" },
  );
  assert.notEqual(r.status, 0);
});

test("CLI : un chemin que git cite entre guillemets, ou d'une autre casse, touche son motif ; une citation mal formée sort en 2", () => {
  const d = dossierAvec(JSON.stringify({ cheminsSensibles: ["scripts/agent/**", ".claude/**", "src/paiement/"] }));
  const entree = ['"scripts/agent/a\\"b.mjs"', '".claude/x\\tb"', '"src/paiement/r\\303\\251gl\\303\\251.ts"', "Scripts/Agent/a.mjs", ".Claude/settings.json", '"docs/a\\"b.md"'];
  const r = lancer(d, `${entree.join("\n")}\n`);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(
    r.stdout,
    `${entree[0]}\tscripts/agent/**\n${entree[1]}\t.claude/**\n${entree[2]}\tsrc/paiement/\n${entree[3]}\tscripts/agent/**\n${entree[4]}\t.claude/**\n`,
  );
  for (const mal of ['"scripts/agent/a.mjs', '"scripts/agent/a\\qb.mjs"']) {
    const m = lancer(d, `${mal}\n`);
    assert.equal(m.status, 2, mal);
    assert.match(m.stderr, /illisible/, mal);
  }
});

// Le contrat de la base s'ajoute à celui de l'arbre : une branche qui retire son chemin de chaine.json le garde
// sensible (le label contre-revue et /security-review ne s'esquivent pas).
test("CLI : le contrat de la base s'ajoute ; une branche qui retire un chemin sensible de chaine.json et le touche reste sensible", () => {
  const d = dossierAvec(JSON.stringify({ cheminsSensibles: ["src/paiement/"] }));
  const env = {
    ...sansGit(),
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@example.org",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@example.org",
  };
  const git = (...a) => execFileSync("git", a, { cwd: d, env, encoding: "utf8" });
  git("init", "-q", "-b", "develop");
  git("add", "-A");
  git("commit", "-q", "-m", "contrat");
  git("update-ref", "refs/remotes/origin/develop", "develop");
  git("switch", "-q", "-c", "feat");
  writeFileSync(join(d, ".claude/chaine.json"), JSON.stringify({ cheminsSensibles: [] }));
  mkdirSync(join(d, "src/paiement"), { recursive: true });
  writeFileSync(join(d, "src/paiement/x.ts"), "export const x = 1;\n");
  writeFileSync(join(d, "a.md"), "a\n");
  git("add", "-A");
  git("commit", "-q", "-m", "retire le chemin");
  const lancerIci = (...base) =>
    spawnSync("node", [CLI, ...base], { cwd: d, env, input: "a.md\nsrc/paiement/x.ts\n", encoding: "utf8" });
  for (const base of [[], ["origin/develop"]]) {
    const r = lancerIci(...base);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, "src/paiement/x.ts\tsrc/paiement/\n", `base ${base[0] ?? "par défaut"}`);
  }
  const illisible = lancerIci("nulle-part");
  assert.equal(illisible.status, 0, illisible.stderr);
  assert.deepEqual(
    illisible.stdout.trim().split("\n").map((l) => l.replace(/\t\(base illisible : .*\)$/, "\t?")),
    ["a.md\t?", "src/paiement/x.ts\t?"],
    "base illisible : chaque chemin est sensible",
  );
});

// Sans base donnée, une branche dont le ticket déclare un sujet lit le contrat de ce sujet.
test("CLI : sans base donnée, le sujet du ticket de la branche fait la base", async () => {
  const { depotJouet } = await import(
    existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
  );
  const d = depotJouet();
  d.ecrire("docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md", "# Démo\n\nSujet: sujet/lot\n");
  d.commit("docs: spec");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { ".claude/chaine.json": JSON.stringify({ cheminsSensibles: ["infra/**"] }) }, "chore: contrat du lot");
  d.git("switch", "-q", "-C", "feat/spec-all-dem-1-01-infra", "origin/sujet/lot");
  d.ecrire(".claude/chaine.json", JSON.stringify({ cheminsSensibles: [] }));
  d.ecrire("infra/main.tf", "x\n");
  d.commit("chore: infra");
  const r = spawnSync("node", [CLI], { cwd: d.travail, env: d.env, input: "infra/main.tf\n", encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "infra/main.tf\tinfra/**\n");
});

// macOS écrit souvent les noms en NFD : un chemin NFD touche un motif NFC, et l'inverse.
test("CLI : un chemin en NFD touche son motif en NFC, et l'inverse", () => {
  const nfc = "src/paiement/réglé.ts".normalize("NFC");
  const nfd = "src/paiement/réglé.ts".normalize("NFD");
  assert.notEqual(nfc, nfd);
  for (const [motif, chemin] of [[nfc, nfd], [nfd, nfc]]) {
    const r = lancer(dossierAvec(JSON.stringify({ cheminsSensibles: [motif] })), `${chemin}\n`);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, `${chemin}\t${motif}\n`);
  }
});

test("un chemin décité qui porte un saut de ligne, \\r ou U+2028 touche encore son motif", () => {
  const cas = [
    ["**/secret/**", '"x\\ny/secret/k.md"'],
    ["src/auth/**", '"src/auth/a\\nb.md"'],
    ["src/auth/**", '"src/auth/a\\rb.md"'],
    ["**/secret/**", '"x\\342\\200\\250y/secret/k.md"'],
    ["**/secret/**", '"x\\342\\200\\251y/secret/k.md"'],
    [".github/**", '".github/workflows/x\\342\\200\\250.yml"'],
  ];
  for (const [motif, cite] of cas) {
    const r = lancer(dossierAvec(JSON.stringify({ cheminsSensibles: [motif] })), `${cite}\n`);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, new RegExp(`\\t${motif.replace(/[*/.]/g, "\\$&")}\\n$`), `${motif} / ${cite}`);
  }
});
