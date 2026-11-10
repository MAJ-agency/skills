// Le point d'entrée des `.sh` vers la grammaire des identifiants : chaque commande, et la recherche
// de `identifiants.mjs` dans les trois dispositions (projet, copie à plat du capitaine, plugin).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const SCRIPT = new URL("./identifiant.mjs", import.meta.url).pathname;
const GRAMMAIRE = [
  new URL("../docs/identifiants.mjs", import.meta.url).pathname,
  new URL("../../tickets/references/scripts/docs/identifiants.mjs", import.meta.url).pathname,
].find(existsSync);
const lancer = (args, input = "", script = SCRIPT) =>
  spawnSync(process.execPath, [script, ...args], { input, encoding: "utf8" });

test("lire : une spec ou un ticket, en majuscules ; tout le reste sort en 1 sans rien écrire", () => {
  assert.equal(lancer(["lire", "spec_all_soc-1.03"]).stdout, "SPEC_ALL_SOC-1.03\n");
  assert.equal(lancer(["lire", "SPEC_FNSMR_PAY-3"]).stdout, "SPEC_FNSMR_PAY-3\n");
  for (const autre of ["SOC-1.03", "ALL-FOF-12", "RULE_ALL_LIC-3", "demo", "sujet/demo", ""]) {
    const r = lancer(["lire", autre]);
    assert.equal(r.status, 1, autre);
    assert.equal(r.stdout, "");
  }
});

test("slug : l'identifiant tel qu'une branche ou un sujet le porte", () => {
  assert.equal(lancer(["slug", "SPEC_ALL_SOC-1.03"]).stdout, "spec-all-soc-1-03\n");
  assert.equal(lancer(["slug", "SPEC_ALL_SOC-1"]).stdout, "spec-all-soc-1\n");
  assert.equal(lancer(["slug", "SOC-1"]).status, 1);
});

test("ticket-de-pr : le titre d'abord, sinon la branche, sinon rien", () => {
  assert.equal(lancer(["ticket-de-pr", "feat(api): couche (SPEC_ALL_SOC-1.03)", "feat/x"]).stdout, "SPEC_ALL_SOC-1.03\n");
  assert.equal(lancer(["ticket-de-pr", "feat(api): couche", "feat/spec-all-soc-1-04-couche"]).stdout, "SPEC_ALL_SOC-1.04\n");
  assert.equal(lancer(["ticket-de-pr", "feat(api): couche (SOC-1.03)", "feat/soc-1-03-couche"]).stdout, "\n");
  assert.equal(lancer(["ticket-de-pr", "feat(demo): sujet", "sujet/spec-all-soc-1"]).stdout, "\n");
});

test("tickets : les tickets cités dans un texte, un par ligne", () => {
  assert.equal(lancer(["tickets"], "SPEC_ALL_SOC-1.01, puis SPEC_FNSMR_PAY-3.02 ; 05 et SOC-1.04 non\n").stdout, "SPEC_ALL_SOC-1.01\nSPEC_FNSMR_PAY-3.02\n");
  assert.equal(lancer(["tickets"], "05, 07\n").stdout, "");
});

test("fichiers : l'identifiant du ticket ou de la spec remplace le chemin, les autres lignes tombent", () => {
  const entree = [
    "docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md\tsocle",
    "docs/features/socle/all/issues/SPEC_ALL_SOC-1-socle.02.issue.md\tautre",
    "docs/features/vieux/SOC-2-vieux.spec.md\tvieux",
    "docs/features/socle/all/SPEC_ALL_SOC-1-socle.map.md\tsocle",
    "",
  ].join("\n");
  assert.equal(lancer(["fichiers"], entree).stdout, "SPEC_ALL_SOC-1\tsocle\nSPEC_ALL_SOC-1.02\tautre\n");
});

test("colonne-ticket : chaque ligne reçoit le ticket de sa PR, ou une colonne vide", () => {
  const entree = "1\tdevelop\tfeat/spec-all-dem-2-01-a\tfalse\tfeat(demo): a\n2\tdevelop\tfeat/x\tfalse\tfix: b (SPEC_ALL_DEM-2.02)\n3\tdevelop\tchore/menage\tfalse\tchore: c\n";
  assert.equal(
    lancer(["colonne-ticket", "5", "3"], entree).stdout,
    "1\tdevelop\tfeat/spec-all-dem-2-01-a\tfalse\tfeat(demo): a\tSPEC_ALL_DEM-2.01\n2\tdevelop\tfeat/x\tfalse\tfix: b (SPEC_ALL_DEM-2.02)\tSPEC_ALL_DEM-2.02\n3\tdevelop\tchore/menage\tfalse\tchore: c\t\n",
  );
  assert.equal(lancer(["colonne-ticket", "titre", "3"], entree).status, 2);
});

test("commande inconnue : usage, sortie 2", () => {
  const r = lancer(["deviner"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage : identifiant\.mjs lire <id>/);
});

test("la grammaire est trouvée à côté (copie à plat du capitaine) ou dans ../docs/ (projet) ; absente : sortie 6", () => {
  const racine = mkdtempSync(join(tmpdir(), "identifiant-"));
  const plat = join(racine, "outils");
  mkdirSync(plat);
  copyFileSync(SCRIPT, join(plat, "identifiant.mjs"));
  const seul = lancer(["slug", "SPEC_ALL_SOC-1"], "", join(plat, "identifiant.mjs"));
  assert.equal(seul.status, 6);
  assert.match(seul.stderr, /scripts\/docs\/identifiants\.mjs introuvable/);
  copyFileSync(GRAMMAIRE, join(plat, "identifiants.mjs"));
  assert.equal(lancer(["slug", "SPEC_ALL_SOC-1"], "", join(plat, "identifiant.mjs")).stdout, "spec-all-soc-1\n");
  mkdirSync(join(racine, "scripts/chaine"), { recursive: true });
  mkdirSync(join(racine, "scripts/docs"));
  copyFileSync(SCRIPT, join(racine, "scripts/chaine/identifiant.mjs"));
  copyFileSync(GRAMMAIRE, join(racine, "scripts/docs/identifiants.mjs"));
  assert.equal(lancer(["slug", "SPEC_ALL_SOC-1"], "", join(racine, "scripts/chaine/identifiant.mjs")).stdout, "spec-all-soc-1\n");
});
