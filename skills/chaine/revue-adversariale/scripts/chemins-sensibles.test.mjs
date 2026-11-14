// Chemins sensibles de l'étape 2 de la revue : moteur du gate recopié, CLI, parité avec le gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  const d = mkdtempSync(join(tmpdir(), "sens-"));
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
