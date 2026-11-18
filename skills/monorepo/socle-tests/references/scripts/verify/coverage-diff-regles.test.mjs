import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  aliasDeTsconfig,
  baseDepuisPush,
  choisirBase,
  decisionSansBase,
  exemption,
  fusionner,
  inScope,
  metriques,
  plages,
  referenceDuDiff,
  suiteSurBaseCible,
  verdict,
} from "./coverage-diff-regles.mjs";

const entree = (hits, branches = [[1, 0]], fonctions = [1]) => ({
  statementMap: Object.fromEntries(
    hits.map((_, i) => [i, { start: { line: i + 1 } }]),
  ),
  s: Object.fromEntries(hits.map((h, i) => [i, h])),
  b: Object.fromEntries(branches.map((b, i) => [i, b])),
  f: Object.fromEntries(fonctions.map((f, i) => [i, f])),
});

test("le périmètre : le code des apps et des paquets, hors specs, routes, migrations, types générés et ui vendored", () => {
  for (const f of [
    "apps/api/src/domain/x.ts",
    "packages/contracts/src/a.ts",
    "apps/web/src/features/health/api/use-health.ts",
  ])
    assert.ok(inScope(f), f);
  for (const f of [
    "apps/api/src/domain/x.spec.ts",
    "apps/api/src/x.property.spec.ts",
    "apps/api/src/db/migrations/202611-a.ts",
    "apps/api/src/db/types.ts",
    "apps/api/src/main.ts",
    "apps/api/src/app.module.ts",
    "apps/web/src/app/page.tsx",
    "apps/mobile/app/index.tsx",
    "apps/web/src/components/ui/button.tsx",
    "scripts/verify/x.mjs",
    "docs/a.md",
  ])
    assert.ok(!inScope(f), f);
});

test("les métriques lisent lignes, branches, fonctions et lignes non couvertes", () => {
  const m = metriques(
    entree(
      [1, 0, 3, 0],
      [
        [2, 0],
        [1, 1],
      ],
      [2, 0],
    ),
  );
  assert.deepEqual(m, {
    lignes: 50,
    branches: 75,
    fonctions: 50,
    totalFonctions: 2,
    totalLignes: 4,
    nonCouvertes: [2, 4],
  });
  assert.equal(plages([2, 4, 5, 6, 9]), "2, 4-6, 9");
});

test("le verdict : jamais exécuté, sous les seuils, nouveau plus exigeant, ou rien", () => {
  assert.deepEqual(
    verdict(metriques(entree([0, 0], [[0, 0]], [0])), { nouveau: false }),
    ["aucun test n'exécute ce fichier"],
  );
  assert.deepEqual(verdict(null, { nouveau: false }), [
    "aucun test n'exécute ce fichier",
  ]);
  const moyen = metriques(
    entree(
      [1, 1, 1, 1, 0],
      [
        [1, 0],
        [1, 1],
      ],
      [1],
    ),
  ); // 80 % lignes, 75 % branches
  assert.deepEqual(verdict(moyen, { nouveau: false }), []);
  assert.deepEqual(verdict(moyen, { nouveau: true }), ["lignes 80 % < 90 %"]);
  const faible = metriques(entree([1, 0, 0], [[1, 0, 0]], [1]));
  assert.deepEqual(verdict(faible, { nouveau: false }), [
    "lignes 33.3 % < 80 %",
    "branches 33.3 % < 70 %",
  ]);
  assert.deepEqual(
    verdict(metriques(entree([1], [], [])), { nouveau: true }),
    [],
  ); // pas de branche, pas de fonction : n/a
});

test("la fusion additionne les compteurs des suites sans base et des suites sur base", () => {
  const sans = { "/r/a.ts": entree([1, 0], [[1, 0]], [1, 0]) };
  const avec = {
    "/r/a.ts": entree([0, 2], [[0, 3]], [0, 1]),
    "/r/b.ts": entree([1]),
  };
  const f = fusionner(sans, avec);
  assert.deepEqual(f["/r/a.ts"].s, { 0: 1, 1: 2 });
  assert.deepEqual(f["/r/a.ts"].b, { 0: [1, 3] });
  assert.deepEqual(f["/r/a.ts"].f, { 0: 1, 1: 1 });
  assert.ok(f["/r/b.ts"]);
});

test("l'exemption se lit dans les dix premières lignes, avec sa raison", () => {
  assert.equal(
    exemption(
      "// coverage-diff: ignore — amorçage Nest, pas testable en unitaire\nexport {};",
    ),
    "amorçage Nest, pas testable en unitaire",
  );
  assert.equal(
    exemption(
      "export {};\n".repeat(12) + "// coverage-diff: ignore — trop tard",
    ),
    null,
  );
});

test("sans base : un distant sans aucune branche est un premier push qui passe ; la base listée sur le distant est à rapatrier ; des branches sans elle, elle est absente ; ls-remote en échec, le distant est muet", () => {
  assert.equal(decisionSansBase(""), "premier-push");
  assert.equal(decisionSansBase("\n"), "premier-push");
  assert.equal(
    decisionSansBase("0123abcd\trefs/heads/main\n4567ef01\trefs/heads/develop"),
    "base-a-fetcher",
  );
  assert.equal(
    decisionSansBase("0123abcd\trefs/heads/main\n4567ef01\trefs/heads/develop\n"),
    "base-a-fetcher",
  );
  // Le cas de la chaîne : `main` poussée, `develop` pas encore née.
  assert.equal(decisionSansBase("0123abcd\trefs/heads/main"), "base-absente");
  assert.equal(
    decisionSansBase("0123abcd\trefs/heads/main\n4567ef01\trefs/heads/develop-old"),
    "base-absente",
  );
  assert.equal(
    decisionSansBase("0123abcd\trefs/heads/main", "main"),
    "base-a-fetcher",
  );
  assert.equal(decisionSansBase(null), "distant-muet");
  assert.equal(decisionSansBase(undefined), "distant-muet");
});

test("fusionner — le squelette coverage.all d'une suite sans base ne masque pas l'exécution réelle sur base", () => {
  const squelette = {
    "/x/env.development.ts": {
      statementMap: { 0: { start: { line: 1 } } },
      fnMap: { 0: {} },
      branchMap: {},
      s: { 0: 0 },
      f: { 0: 0 },
      b: {},
    },
  };
  const reel = {
    "/x/env.development.ts": {
      statementMap: { 0: { start: { line: 1 } } },
      fnMap: {},
      branchMap: {},
      s: { 0: 3 },
      f: {},
      b: {},
    },
  };
  const m = metriques(fusionner(squelette, reel)["/x/env.development.ts"]);
  assert.equal(m.lignes, 100);
  assert.equal(m.totalFonctions, 0);
  assert.deepEqual(verdict(m, { nouveau: false }), []);
});

const ZERO = "0".repeat(40);
const HEAD = "a".repeat(40);

test("la base d'un push vers un sujet : origin/sujet/<nom>", () => {
  const ligne = `refs/heads/docs/carte ${HEAD} refs/heads/sujet/demo ${"b".repeat(40)}`;
  assert.equal(baseDepuisPush(ligne, HEAD), "origin/sujet/demo");
});

test("la base d'un push : seul un push vers un sujet compte, la suppression est ignorée", () => {
  assert.equal(baseDepuisPush(`refs/heads/fix/x ${HEAD} refs/heads/fix/x ${ZERO}`, HEAD), null);
  assert.equal(baseDepuisPush(`refs/heads/develop ${HEAD} refs/heads/develop ${ZERO}`, HEAD), null);
  assert.equal(baseDepuisPush(`(delete) ${ZERO} refs/heads/sujet/x ${HEAD}`, HEAD), null);
  assert.equal(baseDepuisPush("", HEAD), null);
  assert.equal(baseDepuisPush(undefined, HEAD), null);
});

test("la base d'un push : parmi plusieurs refs, celle de HEAD", () => {
  const autre = "c".repeat(40);
  const lignes = [
    `refs/heads/a ${autre} refs/heads/sujet/autre ${ZERO}`,
    `refs/heads/b ${HEAD} refs/heads/sujet/le-bon ${ZERO}`,
  ].join("\n");
  assert.equal(baseDepuisPush(lignes, HEAD), "origin/sujet/le-bon");
});

test("la base : le plus proche ancêtre parmi develop et les sujets, develop à égalité", () => {
  const develop = { ref: "origin/develop", distance: 12 };
  assert.equal(choisirBase([develop, { ref: "origin/sujet/s", distance: 2 }]), "origin/sujet/s");
  assert.equal(
    choisirBase([develop, { ref: "origin/sujet/livre", distance: 12 }]),
    "origin/develop",
  );
  assert.equal(
    choisirBase([{ ref: "origin/sujet/loin", distance: 30 }, develop]),
    "origin/develop",
  );
  assert.equal(
    choisirBase([
      develop,
      { ref: "origin/sujet/b", distance: 3 },
      { ref: "origin/sujet/a", distance: 3 },
    ]),
    "origin/sujet/a",
  );
  assert.equal(choisirBase([]), "origin/develop");
});

test("la base : un sujet qui a avancé depuis la création de la branche reste le plus proche", () => {
  const sh = (cwd, ...a) =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], {
      cwd,
      encoding: "utf8",
    }).trim();
  const dir = mkdtempSync(join(tmpdir(), "base-auto-"));
  try {
    sh(dir, "init", "-q", "-b", "main");
    const commit = (m) => sh(dir, "commit", "-q", "--allow-empty", "-m", m);
    commit("develop");
    sh(dir, "update-ref", "refs/remotes/origin/develop", "HEAD");
    commit("sujet 1");
    const fille = sh(dir, "rev-parse", "HEAD");
    commit("sœur squashée dans le sujet");
    sh(dir, "update-ref", "refs/remotes/origin/sujet/demo", "HEAD");
    sh(dir, "checkout", "-q", "--detach", fille);
    commit("fille 1");
    commit("fille 2");
    const sortie = execFileSync(
      process.execPath,
      [new URL("./coverage-diff.mjs", import.meta.url).pathname, "--base-auto", "--dry-run"],
      { env: { ...process.env, PROJET_RACINE: dir }, encoding: "utf8" },
    );
    assert.match(sortie, /par rapport à origin\/sujet\/demo/);
    // Une branche partie de develop garde develop, un sujet existant ne l'attire pas.
    sh(dir, "checkout", "-q", "--detach", "origin/develop");
    commit("correctif");
    const hors = execFileSync(
      process.execPath,
      [new URL("./coverage-diff.mjs", import.meta.url).pathname, "--base-auto", "--dry-run"],
      { env: { ...process.env, PROJET_RACINE: dir }, encoding: "utf8" },
    );
    assert.match(hors, /par rapport à origin\/develop/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("suiteSurBaseCible : un import relatif ou par alias du fichier, de son dossier à index ou de son module voisin cible le fichier ; un import de type, d'un autre fichier ou d'un dossier qui a un fichier frère ne le cible pas", () => {
  const fichier = "src/users/users.repository.ts";
  const alias = [{ motif: "@u/*", cibles: ["src/users/*"] }];
  const presents = new Set(["src/users/index.ts", "src/lots/index.ts", "src/lots.ts"]);
  const existe = (c) => presents.has(c);
  const cible = (source, chemin = "src/users/users.db.spec.ts", f = fichier, a = alias) =>
    suiteSurBaseCible(f, [{ chemin, source }], a, existe);
  // le fichier lui-même, relatif ou par alias, avec ou sans extension
  assert.equal(cible('import { R } from "./users.repository";'), true);
  assert.equal(cible('import { R } from "./users.repository.js";'), true);
  assert.equal(cible('import { R } from "@u/users.repository";'), true);
  assert.equal(cible('import "./users.repository";'), true);
  assert.equal(cible('const m = await import("./users.repository");'), true);
  // le dossier à index, sans fichier frère
  assert.equal(cible('import { x } from "../users";', "src/other/o.db.spec.ts"), true);
  // le module du dossier (convention Nest : users/users.module), ou le module voisin du dossier
  assert.equal(cible('import { M } from "./users.module";'), true);
  assert.equal(cible('import { M } from "../users/users.module";', "src/other/o.db.spec.ts"), true);
  assert.equal(cible('import { M } from "../users.module";', "src/other/o.db.spec.ts"), true);
  assert.equal(cible('import { M } from "./lots.module";'), false);
  // un type n'est pas exécuté
  assert.equal(cible('import type { R } from "./users.repository";'), false);
  assert.equal(cible('export type { R } from "./users.repository";'), false);
  // un autre fichier
  assert.equal(cible('import { x } from "./autre";'), false);
  // un dossier qui a un fichier frère `lots.ts` : l'import vise ce fichier, pas l'index
  assert.equal(cible('import { x } from "../lots";', "src/other/o.db.spec.ts", "src/lots/index.ts"), false);
  // un paquet extérieur n'est pas le fichier
  assert.equal(cible('import { x } from "zod";'), false);
  // sans alias lisible, seuls les imports relatifs comptent
  assert.equal(cible('import { R } from "@u/users.repository";', undefined, fichier, []), false);
  // aucune spec
  assert.equal(suiteSurBaseCible(fichier, [], alias, existe), false);
  // fins de ligne CRLF, dernière ligne sans fin de ligne
  assert.equal(cible('import { R } from "./users.repository";\r\nR;'), true);
  assert.equal(cible('import { R } from "./users.repository"'), true);
  // un alias de type sans point-virgule ne masque pas l'import qui le suit
  assert.equal(cible('export type X = Y\nimport { R } from "./users.repository"\n'), true);
  assert.equal(cible('import type * as T from "./users.repository";'), false);
});

test("referenceDuDiff : la fusion recalculée gagne ; base develop inchangée ; develop illisible, la base et la note ; HEAD contient develop et la base non, develop ; sinon la base", () => {
  const base = { base: "origin/sujet/x", fusion: null, developLisible: true, headContientDevelop: false, baseContientDevelop: false };
  const mb = "mmm";
  const ref = (o) => referenceDuDiff({ ...base, mergeBase: mb, mergeBaseDevelop: "ddd", ...o });
  assert.deepEqual(ref({ fusion: "tree", headContientDevelop: true }), { reference: "tree", sorte: "fusion", note: null });
  assert.deepEqual(ref({ base: "origin/develop", headContientDevelop: true }), { reference: mb, sorte: "base", note: null });
  assert.deepEqual(ref({ developLisible: false }), {
    reference: mb,
    sorte: "base",
    note: "origin/develop illisible : diff lu contre origin/sujet/x, sans repli",
  });
  assert.deepEqual(ref({ headContientDevelop: true }), { reference: "ddd", sorte: "develop", note: null });
  assert.deepEqual(ref({ headContientDevelop: true, baseContientDevelop: true }), { reference: mb, sorte: "base", note: null });
  assert.deepEqual(ref({}), { reference: mb, sorte: "base", note: null });
});

test("aliasDeTsconfig : commentaires, virgules finales, CRLF et chemins à `*/` ; illisible, aucun alias", () => {
  const texte =
    '{\r\n  // commentaire\r\n  "compilerOptions": {\r\n    "baseUrl": "./",\r\n    /* bloc */ "paths": { "@x/*": ["src/*/index", "src/x/*",], },\r\n  },\r\n}';
  assert.deepEqual(aliasDeTsconfig(texte), [{ motif: "@x/*", cibles: ["src/*/index", "src/x/*"] }]);
  assert.deepEqual(aliasDeTsconfig('{"compilerOptions":{"baseUrl":"src","paths":{"@a":["a.ts"]}}}'), [{ motif: "@a", cibles: ["src/a.ts"] }]);
  assert.deepEqual(aliasDeTsconfig('{"compilerOptions":{}}'), []);
  assert.deepEqual(aliasDeTsconfig("pas du json"), []);
});
