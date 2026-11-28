// Banc de `demande.mjs` (ticket 101, A-234, A-235, A-241) : la demande `À relire` fabriquée, jamais tapée.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
const { depotJouet, script: scriptDe, environnementDeBanc } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);
const DEMANDE = scriptDe("fusionner", "demande.mjs");
const { demande } = await import(pathToFileURL(DEMANDE).href);
const { lireMarques } = await import(pathToFileURL(scriptDe("fusionner", "decision-relecteur.mjs")).href);

const A = "session_Auteur1";
const C = "session_Conducteur2";
const jouer = (d, ...args) => spawnSync(process.execPath, [DEMANDE, ...args], { cwd: d.travail, env: d.env, encoding: "utf8" });

// Un jouet dont la branche de travail est poussée.
function jouetPousse() {
  const d = depotJouet();
  const sommet = d.branche("feat/x", "origin/develop", { "a.md": "a\n" });
  return { d, sommet };
}

test("cas 1 : la ligne écrite, sommet = HEAD, sortie 0", () => {
  const { d, sommet } = jouetPousse();
  const r = jouer(d, "--session", A, "--conducteur", C);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `À relire — sommet ${sommet} — Session: ${A} — Conducteur: ${C}\n`);
  assert.equal(sommet.length, 40);
  const t = jouer(d, "--session", "-", "--conducteur", "-");
  assert.equal(t.stdout, `À relire — sommet ${sommet} — Session: — — Conducteur: —\n`);
});

test("cas 2 : sommet non poussé, tête détachée, branche absente d'origin : sortie 1", () => {
  const { d } = jouetPousse();
  d.ecrire("b.md", "b\n");
  d.commit("feat: local");
  let r = jouer(d, "--session", A, "--conducteur", C);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /pousser d'abord/);
  d.git("switch", "-q", "-c", "feat/locale");
  r = jouer(d, "--session", A, "--conducteur", C);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /absente d'origin/);
  assert.match(r.stderr, /aucune demande/);
  d.git("checkout", "-q", "--detach");
  r = jouer(d, "--session", A, "--conducteur", C);
  assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /tête détachée/);
});

test("cas 3 : --branche lit la tête d'origin, pas HEAD", () => {
  const { d, sommet } = jouetPousse();
  d.git("switch", "-q", "-c", "autre", "origin/develop");
  const r = jouer(d, "--session", "-", "--conducteur", C, "--branche", "feat/x");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `À relire — sommet ${sommet} — Session: — — Conducteur: ${C}\n`);
  const absente = jouer(d, "--session", "-", "--conducteur", C, "--branche", "feat/nulle");
  assert.equal(absente.status, 1, absente.stderr);
  assert.match(absente.stderr, /absente d'origin/);
});

test("cas 4 : un champ hors forme ou absent : sortie 2, avant tout appel à git", () => {
  const { d } = jouetPousse();
  for (const args of [
    ["--session", "moi", "--conducteur", C],
    ["--session", A, "--conducteur", ""],
    ["--session", "session_", "--conducteur", C],
    ["--session", "https://exemple.org/session_a", "--conducteur", C],
    ["--session", A],
    ["--conducteur", C],
    [],
  ]) {
    const r = jouer(d, ...args);
    assert.equal(r.status, 2, `${args.join(" ")} : ${r.stderr}`);
  }
  // Hors de tout dépôt, sans argument : l'usage, sortie 2.
  const hors = spawnSync(process.execPath, [DEMANDE], { cwd: d.racine, env: { ...environnementDeBanc(), GIT_DIR: "/nulle-part" }, encoding: "utf8" });
  assert.equal(hors.status, 2);
  assert.match(hors.stderr, /usage : node demande\.mjs/);
});

test("cas 5 : deux identifiants égaux : sortie 2, la cause dite ; — aux deux champs : sortie 0", () => {
  const { d } = jouetPousse();
  const egal = jouer(d, "--session", A, "--conducteur", A);
  assert.equal(egal.status, 2);
  assert.match(egal.stderr, /--conducteur —/);
  assert.equal(jouer(d, "--session", "—", "--conducteur", "—").status, 0);
});

test("cas 6 : origin illisible : sortie 12", () => {
  const { d } = jouetPousse();
  d.git("remote", "set-url", "origin", "/chemin/qui/n/existe/pas.git");
  const r = jouer(d, "--session", A, "--conducteur", C);
  assert.equal(r.status, 12, r.stderr);
});

test("cas 7 : la ligne se lit comme une demande, pour les quatre combinaisons permises", () => {
  const sommet = "b".repeat(40);
  for (const [s, c] of [[A, C], [A, "—"], ["—", C], ["—", "—"]]) {
    const corps = demande({ sommet, session: s, conducteur: c });
    const m = lireMarques([{ id: 1, body: corps, created_at: "2026-11-17T12:00:00Z", updated_at: "2026-11-17T12:00:00Z", author_association: "OWNER" }]);
    assert.equal(m.demandes.length, 1, corps);
    const [d] = m.demandes;
    assert.equal(d.sommet, sommet);
    assert.equal(d.auteur, s === "—" ? null : s);
    assert.equal(d.conducteur, c === "—" ? null : c);
  }
});

test("cas 8 : --branche d'une tête absente d'origin (PR de fourche) : sortie 1, la fourche et « aucune demande » dits, rien sur la sortie standard", () => {
  const { d } = jouetPousse();
  const r = jouer(d, "--session", "-", "--conducteur", C, "--branche", "feat/fourche");
  assert.equal(r.status, 1, r.stderr);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /la tête d'une PR de fourche/);
  assert.match(r.stderr, /aucune demande/);
});

test("cas 9 : une branche sans commit sort en 1 ; git en panne à la lecture de HEAD sort en 12", () => {
  const { d } = jouetPousse();
  d.git("switch", "-q", "--orphan", "feat/vide");
  const vide = jouer(d, "--session", A, "--conducteur", C);
  assert.equal(vide.status, 1, vide.stderr);
  assert.match(vide.stderr, /n'a aucun commit/);
  // Une doublure de git : 128 sur `rev-parse --verify -q HEAD`, le reste au vrai git.
  d.git("switch", "-q", "feat/x");
  const bin = join(d.racine, "bin");
  mkdirSync(bin, { recursive: true });
  const vrai = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).stdout.trim();
  writeFileSync(join(bin, "git"), `#!/bin/sh\nif [ "$1" = rev-parse ] && [ "$2" = --verify ]; then echo "fatal: panne" >&2; exit 128; fi\nexec "${vrai}" "$@"\n`);
  chmodSync(join(bin, "git"), 0o755);
  const panne = spawnSync(process.execPath, [DEMANDE, "--session", A, "--conducteur", C], { cwd: d.travail, env: { ...d.env, PATH: `${bin}:${d.env.PATH}` }, encoding: "utf8" });
  assert.equal(panne.status, 12, panne.stderr);
  assert.match(panne.stderr, /git ne lit pas HEAD/);
});
