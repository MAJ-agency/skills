// Les bancs ne laissent rien dans le dossier temporaire : chaque banc est joué dans un `node --test`
// enfant dont le TMPDIR est neuf, et ce dossier doit être vide quand l'enfant a fini. Sans cela, un
// capitaine dont chaque push joue les bancs posés remplit son disque (un dépôt jouet pèse environ un
// mégaoctet, et le pre-push en crée des centaines).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const JOUET_SUJET = join(RACINE, "skills/chaine/sujet/scripts/depot-jouet.mjs");
const JOUET_TICKETS = join(RACINE, "skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs");

// Sans les GIT_* hérités (sous un hook git, ils visent le vrai dépôt), ni NODE_TEST_CONTEXT (l'enfant
// rendrait ses résultats au parent au lieu de les jouer), ni GARDER_JOUETS (il garde les dossiers).
const envEnfant = (temporaire, plus = {}) => ({
  ...Object.fromEntries(
    Object.entries(process.env).filter(([cle]) => !cle.startsWith("GIT_") && cle !== "NODE_TEST_CONTEXT" && cle !== "GARDER_JOUETS"),
  ),
  TMPDIR: temporaire,
  ...plus,
});

// Joue `fichier` sous `node --test` avec un TMPDIR neuf ; rend la sortie et ce qui reste dans ce TMPDIR.
function jouer(fichier, plus = {}) {
  const temporaire = mkdtempSync(join(tmpdir(), "nettoyage-"));
  try {
    const r = spawnSync(process.execPath, ["--test", fichier], { env: envEnfant(temporaire, plus), encoding: "utf8", timeout: 120_000 });
    return { ...r, reste: readdirSync(temporaire).sort() };
  } finally {
    rmSync(temporaire, { recursive: true, force: true });
  }
}

// Un banc minuscule, écrit hors du TMPDIR de l'enfant, qui appelle `corps` après avoir importé le dépôt jouet.
function bancJetable(jouet, corps) {
  const dossier = mkdtempSync(join(tmpdir(), "nettoyage-banc-"));
  const fichier = join(dossier, "jetable.test.mjs");
  writeFileSync(
    fichier,
    `import { test } from "node:test";\nimport assert from "node:assert/strict";\nconst jouet = await import(${JSON.stringify(pathToFileURL(jouet).href)});\ntest("banc", () => {\n${corps}\n});\n`,
  );
  return { fichier, retirer: () => rmSync(dossier, { recursive: true, force: true }) };
}

function retireLesJouets(jouet) {
  const banc = bancJetable(jouet, "jouet.depotJouet(); jouet.depotJouet();");
  try {
    const r = jouer(banc.fichier);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.deepEqual(r.reste, []);
  } finally {
    banc.retirer();
  }
}

function retireAussiQuandIlEchoue(jouet) {
  const banc = bancJetable(jouet, "jouet.depotJouet(); assert.fail('échec voulu');");
  try {
    const r = jouer(banc.fichier);
    assert.notEqual(r.status, 0, "le banc devait échouer");
    assert.deepEqual(r.reste, []);
  } finally {
    banc.retirer();
  }
}

function gardeLesJouets(jouet) {
  const banc = bancJetable(jouet, "jouet.depotJouet(); jouet.depotJouet();");
  try {
    const r = jouer(banc.fichier, { GARDER_JOUETS: "1" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.reste.length, 2, r.reste.join(", "));
    assert.ok(r.reste.every((n) => n.startsWith("jouet-")), r.reste.join(", "));
    assert.match(r.stdout + r.stderr, /GARDER_JOUETS : 2 dossier\(s\) gardé\(s\)/);
  } finally {
    banc.retirer();
  }
}

// Les titres sont écrits en toutes lettres : le gate des tickets les cherche littéralement.
test("depot-jouet (sujet) : les dépôts jouets d'un banc sont retirés à sa sortie", () => retireLesJouets(JOUET_SUJET));
test("depot-jouet (tickets) : les dépôts jouets d'un banc sont retirés à sa sortie", () => retireLesJouets(JOUET_TICKETS));
test("depot-jouet (sujet) : un banc qui échoue retire aussi ses dossiers", () => retireAussiQuandIlEchoue(JOUET_SUJET));
test("depot-jouet (tickets) : un banc qui échoue retire aussi ses dossiers", () => retireAussiQuandIlEchoue(JOUET_TICKETS));
test("depot-jouet (sujet) : GARDER_JOUETS=1 garde les dossiers et dit combien", () => gardeLesJouets(JOUET_SUJET));
test("depot-jouet (tickets) : GARDER_JOUETS=1 garde les dossiers et dit combien", () => gardeLesJouets(JOUET_TICKETS));

// Le garde agit avant la création : avec TMPDIR=/, rien ne doit être créé à la racine du disque.
function refuseUneRacine(jouet) {
  const marque = `racine-${process.pid}-${Date.now()}-`;
  const banc = bancJetable(
    jouet,
    `process.env.TMPDIR = "/";\nassert.throws(() => jouet.dossierTemporaire(${JSON.stringify(marque)}), /le dossier temporaire est la racine/);`,
  );
  try {
    const r = jouer(banc.fichier);
    const restes = readdirSync("/").filter((n) => n.startsWith(marque));
    for (const n of restes) rmSync(join("/", n), { recursive: true, force: true });
    assert.deepEqual(restes, [], "un dossier a été créé à la racine");
    assert.equal(r.status, 0, r.stdout + r.stderr);
  } finally {
    banc.retirer();
  }
}
test("depot-jouet (sujet) : dossierTemporaire refuse un dossier temporaire à la racine sans rien créer", () => refuseUneRacine(JOUET_SUJET));
test("depot-jouet (tickets) : dossierTemporaire refuse un dossier temporaire à la racine sans rien créer", () => refuseUneRacine(JOUET_TICKETS));

test("depot-jouet (tickets) : la copie des scripts du plugin est retirée aussi", () => {
  const banc = bancJetable(JOUET_TICKETS, "assert.ok(jouet.script('docs/vagues.mjs'));");
  try {
    const r = jouer(banc.fichier);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.deepEqual(r.reste, []);
  } finally {
    banc.retirer();
  }
});

// Bancs réels : l'un crée des dépôts jouets et ses propres dossiers (`revue-`), l'autre ses dossiers (`sens-`)
// et la copie des scripts du skill tickets.
function bancReelNeLaissePasDeDossier(banc) {
  assert.ok(existsSync(join(RACINE, banc)));
  const r = jouer(join(RACINE, banc));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(r.reste, []);
}
test("diff-revue.test.mjs ne laisse rien dans le dossier temporaire", () =>
  bancReelNeLaissePasDeDossier("skills/chaine/revue-adversariale/scripts/diff-revue.test.mjs"));
test("chemins-sensibles.test.mjs ne laisse rien dans le dossier temporaire", () =>
  bancReelNeLaissePasDeDossier("skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs"));

// Hors des bancs : chez un vrai capitaine, `passer.sh` se relance depuis une copie (`mktemp`), une par PR passée.
test("passer.sh retire sa copie du dossier temporaire dès qu'elle tourne", async () => {
  const { depotJouet, script } = await import(pathToFileURL(JOUET_SUJET).href);
  const d = depotJouet();
  d.publierChaine();
  d.github({ pulls: [{ number: 7, title: "docs(demo): simple", head: "docs/simple", base: "develop", labels: [] }] });
  const r = d.lancer(script("fusionner", "passer.sh"), "7");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#7\] sans le label à-fusionner/, "la copie n'a pas tourné jusqu'à l'éligibilité");
  assert.deepEqual(readdirSync(d.env.TMPDIR).filter((n) => n.startsWith("passer.")), []);
});

// Le motif de retrait ne doit pas laisser `*` traverser `/` : `passer.x/../victime` n'est pas une copie.
test("passer.sh ne retire pas un chemin qui sort de sa copie par /../", async () => {
  const { depotJouet, script } = await import(pathToFileURL(JOUET_SUJET).href);
  const d = depotJouet();
  d.publierChaine();
  d.github({ pulls: [{ number: 7, title: "docs(demo): simple", head: "docs/simple", base: "develop", labels: [] }] });
  const victime = join(d.env.TMPDIR, "victime");
  writeFileSync(victime, "à garder");
  mkdirSync(join(d.env.TMPDIR, "passer.x"));
  const passer = script("fusionner", "passer.sh");
  const r = spawnSync("bash", [passer, "7"], {
    cwd: d.travail,
    env: { ...d.env, PASSER_OUTILS: dirname(passer), PASSER_COPIE: `${d.env.TMPDIR}/passer.x/../victime` },
    encoding: "utf8",
  });
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.ok(existsSync(victime), "passer.sh a retiré un fichier hors de sa copie");
});
