// Banc de la commande de recopie : joué sur un faux dépôt `skills` temporaire (git init, fichiers suivis).
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, symlinkSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(RACINE, "scripts/recopier-skills.mjs");
const tmp = () => mkdtempSync(join(tmpdir(), "recopie-"));
const jouer = (...args) => spawnSync("node", [SCRIPT, ...args], { encoding: "utf8" });
const git = (dir, ...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8" });
const ecrire = (dir, chemin, contenu, mode) => {
  const p = join(dir, chemin);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, contenu);
  if (mode) chmodSync(p, mode);
};
const tous = (dir, base = dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? tous(join(dir, e.name), base) : [join(dir, e.name).slice(base.length + 1)],
      )
    : [];

const FICHIERS = {
  "skills/chaine/alpha/SKILL.md": "# alpha\n",
  "skills/chaine/alpha/references/a.md": "a\n",
  "skills/chaine/alpha/scripts/run.sh": "#!/bin/sh\n",
  "skills/chaine/beta/SKILL.md": "# beta\n",
  "skills/chaine/sans-skill/lisez-moi.md": "pas un skill\n",
  "skills/autre/gamma/SKILL.md": "# gamma\n",
};

function fauxDepot(version = "1.2.3") {
  const d = tmp();
  git(d, "init", "-q");
  git(d, "config", "user.email", "t@t");
  git(d, "config", "user.name", "t");
  ecrire(d, ".claude-plugin/plugin.json", JSON.stringify({ name: "x", version }));
  for (const [c, t] of Object.entries(FICHIERS)) ecrire(d, c, t, c.endsWith(".sh") ? 0o755 : undefined);
  git(d, "add", "-A");
  git(d, "commit", "-qm", "init");
  return d;
}
const suivre = (d) => {
  git(d, "add", "-A");
  git(d, "commit", "-qm", "maj", "--allow-empty");
};
const manifeste = (p) => JSON.parse(readFileSync(join(p, ".claude/skills/maj-skills.json"), "utf8"));

test("copie neuve : mêmes chemins, mêmes octets, manifeste dans l'ordre et les tris", () => {
  const src = fauxDepot();
  ecrire(src, "skills/chaine/alpha/node_modules/x.js", "non suivi");
  ecrire(src, "skills/chaine/alpha/.DS_Store", "non suivi");
  const p = tmp();
  const r = jouer(p, "--source", src);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "alpha : copié\nbeta : copié\nmaj-skills 1.2.3\n");
  const copie = tous(join(p, ".claude/skills")).filter((f) => f !== "maj-skills.json");
  assert.deepEqual(copie.sort(), ["alpha/SKILL.md", "alpha/references/a.md", "alpha/scripts/run.sh", "beta/SKILL.md"]);
  assert.equal(readFileSync(join(p, ".claude/skills/alpha/references/a.md"), "utf8"), "a\n");
  const brut = readFileSync(join(p, ".claude/skills/maj-skills.json"), "utf8");
  const m = JSON.parse(brut);
  assert.deepEqual(Object.keys(m), ["$comment", "source", "version", "skills", "fichiers"]);
  assert.equal(m.source, "MAJ-agency/skills");
  assert.equal(m.version, "1.2.3");
  assert.deepEqual(m.skills, ["alpha", "beta"]);
  assert.deepEqual(Object.keys(m.fichiers), [...Object.keys(m.fichiers)].sort());
  assert.match(m.fichiers["alpha/SKILL.md"], /^[0-9a-f]{64}$/);
  assert.equal(brut, JSON.stringify(m, null, 2) + "\n");
});

test("second passage : dix lignes à jour, manifeste identique", () => {
  const src = fauxDepot();
  const p = tmp();
  jouer(p, "--source", src);
  const avant = readFileSync(join(p, ".claude/skills/maj-skills.json"), "utf8");
  const r = jouer(p, "--source", src);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "alpha : à jour\nbeta : à jour\nmaj-skills 1.2.3\n");
  assert.equal(readFileSync(join(p, ".claude/skills/maj-skills.json"), "utf8"), avant);
});

test("miroir strict : fichier en trop supprimé, fichier modifié réécrit", () => {
  const src = fauxDepot();
  const p = tmp();
  jouer(p, "--source", src);
  ecrire(p, ".claude/skills/alpha/en-trop/x.md", "x");
  ecrire(p, ".claude/skills/alpha/SKILL.md", "bricolé");
  const r = jouer(p, "--source", src);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /alpha : copié/);
  assert.match(r.stdout, /beta : à jour/);
  assert.equal(existsSync(join(p, ".claude/skills/alpha/en-trop")), false);
  assert.equal(readFileSync(join(p, ".claude/skills/alpha/SKILL.md"), "utf8"), "# alpha\n");
});

test("fichier puis skill retirés de la source : retirés de la copie", () => {
  const src = fauxDepot();
  const p = tmp();
  jouer(p, "--source", src);
  git(src, "rm", "-q", "skills/chaine/alpha/references/a.md");
  rmSync(join(src, "skills/chaine/alpha/references"), { recursive: true, force: true });
  suivre(src);
  assert.equal(jouer(p, "--source", src).status, 0);
  assert.equal(existsSync(join(p, ".claude/skills/alpha/references")), false);
  git(src, "rm", "-rq", "skills/chaine/beta");
  suivre(src);
  const r = jouer(p, "--source", src);
  assert.match(r.stdout, /beta : supprimé/);
  assert.equal(existsSync(join(p, ".claude/skills/beta")), false);
  assert.deepEqual(manifeste(p).skills, ["alpha"]);
});

test("un skill propre au projet n'est pas touché", () => {
  const src = fauxDepot();
  const p = tmp();
  ecrire(p, ".claude/skills/maison/SKILL.md", "à moi");
  jouer(p, "--source", src);
  jouer(p, "--source", src);
  assert.equal(readFileSync(join(p, ".claude/skills/maison/SKILL.md"), "utf8"), "à moi");
  assert.deepEqual(manifeste(p).skills, ["alpha", "beta"]);
});

test("refus d'écraser un dossier non posé par la commande, puis --remplacer", () => {
  const src = fauxDepot();
  const p = tmp();
  ecrire(p, ".claude/skills/alpha/perso.md", "perso");
  const r = jouer(p, "--source", src);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /alpha/);
  assert.equal(existsSync(join(p, ".claude/skills/maj-skills.json")), false);
  assert.equal(existsSync(join(p, ".claude/skills/beta")), false);
  assert.equal(jouer(p, "--source", src, "--remplacer").status, 0);
  assert.equal(existsSync(join(p, ".claude/skills/alpha/perso.md")), false);
  assert.equal(existsSync(join(p, ".claude/skills/alpha/SKILL.md")), true);
});

test("manifeste précédent illisible : refus, puis --remplacer", () => {
  const src = fauxDepot();
  for (const contenu of ["pas du json", '{"skills": "x"}']) {
    const p = tmp();
    ecrire(p, ".claude/skills/maj-skills.json", contenu);
    const r = jouer(p, "--source", src);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /maj-skills\.json/);
    assert.equal(readFileSync(join(p, ".claude/skills/maj-skills.json"), "utf8"), contenu);
    assert.equal(jouer(p, "--source", src, "--remplacer").status, 0);
    assert.deepEqual(manifeste(p).skills, ["alpha", "beta"]);
  }
});

test("bit exécutable conservé", () => {
  const src = fauxDepot();
  const p = tmp();
  jouer(p, "--source", src);
  assert.ok(statSync(join(p, ".claude/skills/alpha/scripts/run.sh")).mode & 0o100);
  assert.equal(statSync(join(p, ".claude/skills/alpha/SKILL.md")).mode & 0o111, 0);
});

test("lien symbolique refusé, côté source et côté projet", () => {
  const src = fauxDepot();
  symlinkSync("SKILL.md", join(src, "skills/chaine/alpha/lien.md"));
  suivre(src);
  const p = tmp();
  const r = jouer(p, "--source", src);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /lien\.md/);
  assert.equal(existsSync(join(p, ".claude")), false);

  const src2 = fauxDepot();
  for (const lien of [".claude", ".claude/skills", ".claude/skills/alpha"]) {
    const p2 = tmp();
    const cible = tmp();
    mkdirSync(dirname(join(p2, lien)), { recursive: true });
    symlinkSync(cible, join(p2, lien));
    const r2 = jouer(p2, "--source", src2);
    assert.equal(r2.status, 1, lien);
    assert.deepEqual(readdirSync(cible), [], lien);
  }
});

test("usage : code 2", () => {
  const src = fauxDepot();
  assert.equal(jouer().status, 2);
  assert.equal(jouer(tmp(), "--inconnue").status, 2);
  assert.equal(jouer(join(tmp(), "absent"), "--source", src).status, 2);
  const fichier = join(tmp(), "f");
  writeFileSync(fichier, "x");
  assert.equal(jouer(fichier, "--source", src).status, 2);
  assert.equal(jouer(tmp(), "--source").status, 2);
  assert.match(jouer().stderr, /usage/);
});

test("sur ce dépôt : les skills copiés sont ceux de plugin.json sous skills/chaine/", () => {
  const p = tmp();
  const r = jouer(p);
  assert.equal(r.status, 0, r.stderr);
  const plugin = JSON.parse(readFileSync(join(RACINE, ".claude-plugin/plugin.json"), "utf8"));
  const attendus = plugin.skills.filter((s) => s.startsWith("./skills/chaine/")).map((s) => s.split("/").pop()).sort();
  assert.deepEqual(manifeste(p).skills, attendus);
  assert.equal(manifeste(p).version, plugin.version);
});

test("la liste des projets : un dépôt MAJ-agency/<nom> et une branche", () => {
  const { projets } = JSON.parse(readFileSync(join(RACINE, "scripts/recopie-projets.json"), "utf8"));
  assert.ok(projets.length > 0);
  for (const p of projets) {
    assert.match(p.depot, /^MAJ-agency\/[\w.-]+$/);
    assert.ok(typeof p.branche === "string" && p.branche !== "");
  }
});

test("le mode d'emploi nomme le secret, la liste, le manifeste et la ligne de .gitignore", () => {
  const doc = readFileSync(join(RACINE, "docs/agents/recopie-des-skills.md"), "utf8");
  for (const m of ["RECOPIE_TOKEN", "scripts/recopie-projets.json", ".claude/skills/maj-skills.json", "!.claude/skills/"])
    assert.ok(doc.includes(m), `recopie-des-skills.md ne nomme pas ${m}`);
});
