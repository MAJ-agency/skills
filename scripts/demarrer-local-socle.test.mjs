// Le gabarit `scripts/db/demarrer-local.sh` du socle Nest, joué contre de faux initdb, pg_ctl, psql, createdb
// (aucun PostgreSQL réel) dans un projet jetable. Banc du plugin, jamais posé : il éprouve le gabarit.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dossierTemporaire, environnementDeBanc } from "../skills/chaine/sujet/scripts/depot-jouet.mjs";

const SQUELETTE = fileURLToPath(new URL("../skills/backend/socle-nest-hexagonal/references/squelette/", import.meta.url));

const portLibre = () =>
  new Promise((resolve) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const outil = (dossier, nom, corps) => {
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, nom), `#!/bin/sh\n${corps}\n`);
  chmodSync(join(dossier, nom), 0o755);
};

/** Joue le gabarit ; `existante` : la base existe déjà ; `donneesInitialisees` : PG_VERSION déjà posé. */
async function jouer({ locales = "C\nC.utf8\nPOSIX", encBase = "UTF8", encServeur = "UTF8", existante = false, donneesInitialisees = false } = {}) {
  const tmp = dossierTemporaire("demarrer-local-");
  const port = await portLibre();
  const projet = join(tmp, "projet");
  mkdirSync(join(projet, "scripts", "db"), { recursive: true });
  copyFileSync(join(SQUELETTE, "scripts", "db", "demarrer-local.sh"), join(projet, "scripts", "db", "demarrer-local.sh"));
  const compose = readFileSync(join(SQUELETTE, "compose.yaml"), "utf8")
    .replaceAll("{{PROJET_SNAKE}}", "jouet")
    .replace("5433:5432", `${port}:5432`);
  writeFileSync(join(projet, "compose.yaml"), compose);
  const journal = join(tmp, "appels.log");
  const marque = join(tmp, "base-existe");
  const donnees = join(tmp, "donnees");
  writeFileSync(journal, "");
  if (existante) writeFileSync(marque, "");
  if (donneesInitialisees) {
    mkdirSync(donnees);
    writeFileSync(join(donnees, "PG_VERSION"), "16\n");
  }
  const bin = join(tmp, "pg", "16", "bin");
  const J = JSON.stringify(journal);
  const M = JSON.stringify(marque);
  outil(bin, "initdb", `echo "initdb $*" >> ${J}\nwhile [ $# -gt 0 ]; do [ "$1" = -D ] && d=$2; shift; done\nmkdir -p "$d"; echo 16 > "$d/PG_VERSION"`);
  outil(bin, "pg_ctl", `echo "pg_ctl $*" >> ${J}\n[ "$3" = status ] && exit 3\nexit 0`);
  outil(bin, "createdb", `echo "createdb $*" >> ${J}\n: > ${M}`);
  outil(
    bin,
    "psql",
    `echo "psql $*" >> ${J}
for a in "$@"; do q=$a; done
case "$q" in
  "SELECT 1") [ -f ${M} ] ;;
  *"datname = 'template1'"*) echo "$ENC_SERVEUR" ;;
  *pg_encoding_to_char*) [ -f ${M} ] && echo "$ENC_BASE"; exit 0 ;;
  *) exit 0 ;;
esac`,
  );
  const fakes = join(tmp, "fakes");
  outil(fakes, "docker", "exit 1");
  outil(fakes, "id", 'echo 1000');
  writeFileSync(join(tmp, "locales.txt"), `${locales}\n`);
  outil(fakes, "locale", `cat ${JSON.stringify(join(tmp, "locales.txt"))}`);
  const env = environnementDeBanc();
  const r = spawnSync("bash", [join(projet, "scripts", "db", "demarrer-local.sh")], {
    encoding: "utf8",
    env: {
      ...env,
      PATH: `${fakes}:${process.env.PATH}`,
      PG_RACINE: join(tmp, "pg"),
      PGDATA_LOCAL: donnees,
      ENC_BASE: encBase,
      ENC_SERVEUR: encServeur,
    },
  });
  const appels = readFileSync(journal, "utf8").trim().split("\n").filter(Boolean);
  return { r, appels, donnees, bin, existe: existsSync(marque) };
}

test("demarrer-local du socle : initdb reçoit --encoding=UTF8 et la locale C.UTF-8", async () => {
  const { r, appels } = await jouer();
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const initdb = appels.find((l) => l.startsWith("initdb "));
  assert.ok(initdb, `initdb appelé : ${appels}`);
  assert.match(initdb, /--encoding=UTF8/);
  assert.match(initdb, /--locale=C\.UTF-8/);
});

test("demarrer-local du socle : locale C.UTF-8 absente, repli sur --no-locale, encodage UTF8 gardé, dit au journal", async () => {
  const { r, appels } = await jouer({ locales: "C\nPOSIX" });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const initdb = appels.find((l) => l.startsWith("initdb "));
  assert.match(initdb, /--encoding=UTF8/);
  assert.match(initdb, /--no-locale/);
  assert.doesNotMatch(initdb, /--locale=/);
  assert.match(r.stdout, /demarrer-local : locale C\.UTF-8 absente de ce système, repli sur --no-locale \(encodage UTF8 conservé\)/);
});

test("demarrer-local du socle : createdb reçoit -E UTF8 -T template0", async () => {
  const { r, appels } = await jouer();
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const createdb = appels.find((l) => l.startsWith("createdb "));
  assert.ok(createdb, `createdb appelé : ${appels}`);
  assert.match(createdb, /-E UTF8/);
  assert.match(createdb, /-T template0/);
});

test("demarrer-local du socle : base existante en SQL_ASCII, sortie 6, commandes à copier, jamais de DROP", async () => {
  const { r, appels } = await jouer({ existante: true, encBase: "SQL_ASCII" });
  assert.equal(r.status, 6, r.stderr + r.stdout);
  assert.match(r.stderr, /demarrer-local : base jouet en SQL_ASCII : la recréer \(la base locale est jetable : rien à sauvegarder\)\. Commandes :/);
  assert.match(r.stderr, /psql .* -d postgres -c 'DROP DATABASE jouet'/);
  assert.match(r.stderr, /bash scripts\/db\/demarrer-local\.sh/);
  assert.match(r.stderr, /puis rejouer les migrations du projet/);
  assert.doesNotMatch(r.stderr, /iroki|--filter/i);
  assert.ok(!appels.some((l) => /DROP/.test(l)), `aucun DROP exécuté : ${appels}`);
  assert.ok(!appels.some((l) => l.startsWith("createdb ")), `aucun createdb : ${appels}`);
});

test("demarrer-local du socle : serveur initialisé en SQL_ASCII, sortie 6, arrêt et suppression à copier", async () => {
  const { r, appels, donnees, bin } = await jouer({ donneesInitialisees: true, encServeur: "SQL_ASCII" });
  assert.equal(r.status, 6, r.stderr + r.stdout);
  assert.match(r.stderr, new RegExp(`demarrer-local : serveur ${donnees.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} initialisé en SQL_ASCII : l'arrêter et supprimer .* \\(la base locale est jetable : rien à sauvegarder\\)\\. Commandes :`));
  assert.ok(r.stderr.includes(`${bin}/pg_ctl -D ${donnees} stop`), r.stderr);
  assert.ok(r.stderr.includes(`rm -rf ${donnees}`), r.stderr);
  assert.match(r.stderr, /bash scripts\/db\/demarrer-local\.sh/);
  assert.match(r.stderr, /puis rejouer les migrations du projet/);
  assert.ok(!appels.some((l) => /DROP|rm -rf/.test(l)), `rien supprimé : ${appels}`);
  assert.ok(!appels.some((l) => l.startsWith("createdb ")), `aucun createdb : ${appels}`);
});

test("demarrer-local du socle : base existante en UTF8, rien n'est recréé", async () => {
  const { r, appels } = await jouer({ existante: true, encBase: "UTF8" });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.ok(!appels.some((l) => /^(initdb|createdb) /.test(l)), `rien recréé : ${appels}`);
});

test("demarrer-local du socle : locale C.UTF-8 présente en tête d'une longue liste, pas de repli à tort (SIGPIPE sous pipefail)", async () => {
  const locales = ["C.utf8", ...Array.from({ length: 30000 }, (_, i) => `xx_${i}.utf8`)].join("\n");
  const { r, appels } = await jouer({ locales });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const initdb = appels.find((l) => l.startsWith("initdb "));
  assert.match(initdb, /--locale=C\.UTF-8/);
  assert.doesNotMatch(r.stdout, /repli/);
});
