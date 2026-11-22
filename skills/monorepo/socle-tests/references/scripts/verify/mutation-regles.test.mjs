import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { echapperGlob, normaliser, perimetre, perimetreDuDepot, perimetreDuPaquet } from "./mutation-regles.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
// Les configurations sont dans `gabarits/` du skill ; posées dans un projet, dans `apps/api/` (SKILL.md
// étape 2.5). Le banc joue celles qu'il trouve, comme `tests-creux.test.mjs` pour la grammaire.
const trouver = (nom) => [join(ICI, "../../gabarits", nom), join(ICI, "../../apps/api", nom)].find(existsSync);
const CONFIG = trouver("stryker.regles.config.mjs");
const CONFIG_NOYAU = trouver("stryker.config.mjs");
const base = (await import(pathToFileURL(CONFIG_NOYAU).href)).default;

const regle = (key, status, code) => ({ key, realisation: { status, levels: [], proofCount: 0, inherited: false }, code });
const index = (rules, schema = "2") => ({ schema, rules });
const tous = () => true;

test("deux règles prouvées, trois fichiers : l'union, triée, avec ses fichiers par règle", () => {
  const p = perimetre(
    index([
      regle("RULE_ALL_LIC-1", "proven", ["apps/api/src/b.ts", "apps/api/src/a.ts"]),
      regle("RULE_ALL_LIC-2", "proven", ["packages/x/src/c.ts"]),
    ]),
    tous,
  );
  assert.deepEqual(p.fichiers, ["apps/api/src/a.ts", "apps/api/src/b.ts", "packages/x/src/c.ts"]);
  assert.deepEqual(p.regles, [
    { regle: "RULE_ALL_LIC-1", criticite: null, fichiers: ["apps/api/src/b.ts", "apps/api/src/a.ts"] },
    { regle: "RULE_ALL_LIC-2", criticite: null, fichiers: ["packages/x/src/c.ts"] },
  ]);
  assert.deepEqual(p.ecartes, []);
  assert.equal(p.raison, undefined);
});

test("une règle to-build, configured ou contradiction n'entre pas, même avec du code déclaré", () => {
  const p = perimetre(
    index([
      regle("RULE_ALL_LIC-1", "proven", ["a.ts"]),
      regle("RULE_ALL_LIC-2", "to-build", ["b.ts"]),
      regle("RULE_ALL_LIC-3", "configured", ["c.ts"]),
      regle("RULE_ALL_LIC-4", "contradiction", ["d.ts"]),
    ]),
    tous,
  );
  assert.deepEqual(p.fichiers, ["a.ts"]);
  assert.deepEqual(p.ecartes, []);
});

test("un chemin de code absent du dépôt est écarté, nommé avec sa règle, et le reste est gardé", () => {
  const p = perimetre(index([regle("RULE_FNSMR_LIC-05", "proven", ["src/ici.ts", "src/absent.ts"])]), (c) => c === "src/ici.ts");
  assert.deepEqual(p.fichiers, ["src/ici.ts"]);
  assert.deepEqual(p.ecartes, [{ regle: "RULE_FNSMR_LIC-05", chemin: "src/absent.ts", motif: "absent du dépôt" }]);
});

test("la clé d'une règle garde ses zéros de tête, telle que l'index l'écrit", () => {
  const p = perimetre(index([regle("RULE_FNSMR_LIC-05", "proven", ["a.ts"])]), tous);
  assert.equal(p.regles[0].regle, "RULE_FNSMR_LIC-05");
});

test("un fichier déclaré par deux règles est muté une fois et figure sous les deux", () => {
  const p = perimetre(index([regle("RULE_ALL_LIC-1", "proven", ["a.ts", "./a.ts"]), regle("RULE_ALL_LIC-2", "proven", ["a.ts"])]), tous);
  assert.deepEqual(p.fichiers, ["a.ts"]);
  assert.deepEqual(p.regles.map((r) => [r.regle, r.fichiers]), [["RULE_ALL_LIC-1", ["a.ts"]], ["RULE_ALL_LIC-2", ["a.ts"]]]);
});

test("pas d'index : périmètre vide, raison dite, rien d'écarté", () => {
  const p = perimetre(undefined, tous);
  assert.deepEqual([p.fichiers, p.regles, p.ecartes], [[], [], []]);
  assert.match(p.raison, /pas d'index anchorpost\/anchorpost\.json.*ne suit pas Anchorpost/);
});

test("index illisible, d'un autre schéma ou sans liste de règles : vide, avec une raison propre à chaque cas", () => {
  assert.match(perimetre(null, tous).raison, /illisible/);
  assert.match(perimetre([], tous).raison, /illisible/);
  assert.match(perimetre(index([regle("RULE_ALL_LIC-1", "proven", ["a.ts"])], "1"), tous).raison, /schéma "1".*schémas "2" et "3"/);
  assert.match(perimetre({ schema: "2" }, tous).raison, /sans liste de règles/);
  for (const p of [perimetre(null, tous), perimetre(index([regle("RULE_ALL_LIC-1", "proven", ["a.ts"])], "1"), tous)]) assert.deepEqual(p.fichiers, []);
});

test("des règles prouvées sans fichier de code, ou sans règle prouvée : vide, et la raison les distingue", () => {
  assert.match(perimetre(index([regle("RULE_ALL_LIC-1", "proven", undefined)]), tous).raison, /1 règle\(s\) prouvée\(s\), aucune ne déclare de fichier/);
  assert.match(perimetre(index([regle("RULE_ALL_LIC-1", "to-build", ["a.ts"])]), tous).raison, /aucune règle prouvée/);
  assert.match(perimetre(index([]), tous).raison, /aucune règle prouvée/);
});

test("un chemin qui sort du dépôt, un test, une déclaration, du câblage (contrôleur, module, dto, gabarit) ou un autre langage est écarté, jamais muté", () => {
  const p = perimetre(
    index([regle("RULE_ALL_LIC-1", "proven", ["../hors.ts", "/etc/passwd.ts", "C:/x.ts", "a/../../b.ts", "src/a.spec.ts", "src/a.d.ts", "db/schema.sql", 42, "src/ok.ts", "src/x.controller.ts", "src/x.module.ts", "src/dto/in.ts", "src/templates/m.ts", "src/db/migrations/001.ts", "src/db/types.ts", "src/main.ts"])]),
    tous,
  );
  assert.deepEqual(p.fichiers, ["src/ok.ts"]);
  assert.deepEqual(
    p.ecartes.map((e) => [e.chemin, e.motif.split(" ")[0]]),
    [["../hors.ts", "hors"], ["/etc/passwd.ts", "hors"], ["C:/x.ts", "hors"], ["a/../../b.ts", "hors"], ["src/a.spec.ts", "hors"], ["src/a.d.ts", "hors"], ["db/schema.sql", "hors"], ["42", "hors"], ["src/x.controller.ts", "hors"], ["src/x.module.ts", "hors"], ["src/dto/in.ts", "hors"], ["src/templates/m.ts", "hors"], ["src/db/migrations/001.ts", "hors"], ["src/db/types.ts", "hors"], ["src/main.ts", "hors"]],
  );
});

test("un chemin avec un octet nul est écarté, il ne fait pas planter le script", () => {
  const racine = depot(index([regle("RULE_ALL_LIC-1", "proven", ["src/a\0.ts", "src/ok.ts"])]), ["src/ok.ts"]);
  const p = perimetreDuDepot(racine);
  assert.deepEqual(p.fichiers, ["src/ok.ts"]);
  assert.equal(p.ecartes.length, 1);
  assert.equal(normaliser("a\0b.ts"), null);
});

test("normaliser : ./ et // retirés, slashs, sorties du dépôt refusées", () => {
  assert.equal(normaliser("./apps//api/src/a.ts"), "apps/api/src/a.ts");
  assert.equal(normaliser("apps\\api\\a.ts"), "apps/api/a.ts");
  for (const mauvais of ["", ".", "..", "../a", "/a", "D:\\a", null, undefined, 3]) assert.equal(normaliser(mauvais), null);
});

function depot(contenu, fichiers = []) {
  const racine = mkdtempSync(join(tmpdir(), "mutation-regles-"));
  for (const f of fichiers) {
    mkdirSync(join(racine, f, ".."), { recursive: true });
    writeFileSync(join(racine, f), "export const x = 1;\n");
  }
  if (contenu !== undefined) {
    mkdirSync(join(racine, "anchorpost"), { recursive: true });
    writeFileSync(join(racine, "anchorpost/anchorpost.json"), typeof contenu === "string" ? contenu : JSON.stringify(contenu));
  }
  return racine;
}

test("perimetreDuDepot lit l'index commis : un fichier réel est retenu, un dossier ou un absent est écarté", () => {
  const racine = depot(index([regle("RULE_ALL_LIC-1", "proven", ["apps/api/src/a.ts", "apps/api/src", "apps/api/src/b.ts"])]), ["apps/api/src/a.ts"]);
  const p = perimetreDuDepot(racine);
  assert.deepEqual(p.fichiers, ["apps/api/src/a.ts"]);
  assert.deepEqual(p.ecartes.map((e) => e.chemin), ["apps/api/src", "apps/api/src/b.ts"]);
});

test("un lien symbolique du dépôt vers l'extérieur n'entre pas dans le périmètre", () => {
  const dehors = mkdtempSync(join(tmpdir(), "mutation-dehors-"));
  writeFileSync(join(dehors, "secret.ts"), "export const s = 1;\n");
  const racine = depot(index([regle("RULE_ALL_LIC-1", "proven", ["src/lien/secret.ts", "src/ok.ts"])]), ["src/ok.ts"]);
  symlinkSync(dehors, join(racine, "src/lien"));
  const p = perimetreDuDepot(racine);
  assert.deepEqual(p.fichiers, ["src/ok.ts"]);
  assert.deepEqual(p.ecartes.map((e) => e.chemin), ["src/lien/secret.ts"]);
});

test("perimetreDuDepot : index absent ou JSON invalide → vide, sans lever", () => {
  assert.match(perimetreDuDepot(depot(undefined)).raison, /pas d'index/);
  assert.match(perimetreDuDepot(depot("{ pas du json")).raison, /illisible/);
});

test("perimetreDuPaquet ne garde que les fichiers du paquet, en chemins relatifs, et compte ce qui est ailleurs", () => {
  const racine = depot(
    index([regle("RULE_ALL_LIC-1", "proven", ["apps/api/src/a.ts", "packages/x/src/c.ts"]), regle("RULE_ALL_LIC-2", "proven", ["packages/x/src/c.ts"])]),
    ["apps/api/src/a.ts", "packages/x/src/c.ts"],
  );
  const p = perimetreDuPaquet(racine, join(racine, "apps/api"));
  assert.deepEqual(p.mutate, ["src/a.ts"]);
  assert.deepEqual(p.regles, [{ regle: "RULE_ALL_LIC-1", criticite: null, fichiers: ["apps/api/src/a.ts"] }]);
  assert.deepEqual(p.ailleurs, ["packages/x/src/c.ts"]);
  assert.equal(p.raison, undefined);
  const autre = perimetreDuPaquet(racine, join(racine, "apps/web"));
  assert.deepEqual(autre.mutate, []);
  assert.match(autre.raison, /aucun des 2 fichier\(s\) du périmètre n'est dans ce paquet/);
});

function projet({ avecIndex }) {
  const racine = depot(avecIndex ? index([regle("RULE_ALL_LIC-1", "proven", ["apps/api/src/a.ts"]), regle("RULE_ALL_LIC-2", "proven", ["apps/api/src/gone.ts"]), regle("RULE_ALL_LIC-3", "to-build", ["apps/api/src/c.ts"])]) : undefined, [
    "apps/api/src/a.ts",
    "apps/api/src/c.ts",
  ]);
  mkdirSync(join(racine, "scripts/verify"), { recursive: true });
  copyFileSync(join(ICI, "mutation-regles.mjs"), join(racine, "scripts/verify/mutation-regles.mjs"));
  copyFileSync(CONFIG, join(racine, "apps/api/stryker.regles.config.mjs"));
  copyFileSync(CONFIG_NOYAU, join(racine, "apps/api/stryker.config.mjs"));
  return racine;
}
const lancer = (racine, args, cwd = racine) =>
  spawnSync(process.execPath, [join(racine, "scripts/verify/mutation-regles.mjs"), ...args], { cwd, encoding: "utf8", env: { ...process.env, PROJET_RACINE: undefined, GITHUB_STEP_SUMMARY: undefined } });

test("--list : un fichier par ligne sur stdout, ce qui est écarté sur stderr, sortie 0", () => {
  const r = lancer(projet({ avecIndex: true }), ["--list"]);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "apps/api/src/a.ts\n");
  assert.match(r.stderr, /écarté RULE_ALL_LIC-2 apps\/api\/src\/gone\.ts — absent du dépôt/);
});

test("--list sans index : rien sur stdout, la raison sur stderr, sortie 0", () => {
  const r = lancer(projet({ avecIndex: false }), ["--list"]);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /périmètre vide — pas d'index anchorpost\/anchorpost\.json/);
});

test("--lancer nomme les fichiers prouvés d'un autre paquet, qu'il ne mute pas", () => {
  const racine = projet({ avecIndex: false });
  mkdirSync(join(racine, "packages/x/src"), { recursive: true });
  writeFileSync(join(racine, "packages/x/src/c.ts"), "export const c = 1;\n");
  mkdirSync(join(racine, "anchorpost"), { recursive: true });
  writeFileSync(join(racine, "anchorpost/anchorpost.json"), JSON.stringify(index([regle("RULE_ALL_LIC-1", "proven", ["packages/x/src/c.ts"])])));
  const r = lancer(racine, ["--lancer"], join(racine, "apps/api"));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /1 fichier\(s\) de règles qui ont des preuves sont dans un autre paquet.*packages\/x\/src\/c\.ts/);
  assert.match(r.stdout, /aucun des 1 fichier\(s\) du périmètre n'est dans ce paquet/);
});

test("--lancer sans index : ne lance rien (ni pnpm ni Stryker), le dit, sortie 0", () => {
  const racine = projet({ avecIndex: false });
  const r = lancer(racine, ["--lancer"], join(racine, "apps/api"));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /périmètre vide — pas d'index/);
  assert.doesNotMatch(r.stdout, /fichier\(s\) à muter/);
});

test("sans option, usage et sortie 2", () => {
  const r = lancer(projet({ avecIndex: false }), []);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage/);
});

test("mutate échappe les globs par une classe à un caractère : une route [id].ts ou (groupe)/x.ts se mute elle-même", () => {
  assert.equal(echapperGlob("src/app/[id]/(g)/a{b}*?.ts"), "src/app/[[]id]/[(]g[)]/a[{]b[}][*][?].ts");
  assert.equal(echapperGlob("src/a!b+c@d.ts"), "src/a!b+c@d.ts");
  const racine = depot(index([regle("RULE_ALL_LIC-1", "proven", ["apps/web/src/[id].ts"])]), ["apps/web/src/[id].ts"]);
  const p = perimetreDuPaquet(racine, join(racine, "apps/web"));
  assert.deepEqual(p.fichiers, ["apps/web/src/[id].ts"]);
  assert.deepEqual(p.mutate, ["src/[[]id].ts"]);
});

test("la config Stryker des règles lit le périmètre du paquet : mutate relatif, vide sans index", () => {
  const lire = (racine) =>
    JSON.parse(
      spawnSync(process.execPath, ["--input-type=module", "-e", "import('./stryker.regles.config.mjs').then((m) => console.log(JSON.stringify(m.default)))"], {
        cwd: join(racine, "apps/api"),
        encoding: "utf8",
        env: { ...process.env, PROJET_RACINE: undefined },
      }).stdout,
    );
  const avec = lire(projet({ avecIndex: true }));
  assert.deepEqual(avec.mutate, ["src/a.ts"]);
  assert.equal(avec.thresholds.break, 0, "rapport seulement : le plancher du noyau ne s'applique pas");
  assert.equal(avec.plugins[0], "@stryker-mutator/vitest-runner", "hérite de la configuration du noyau");
  assert.notEqual(avec.incrementalFile, base.incrementalFile);
  assert.ok(avec.reporters.includes("json"));
  assert.deepEqual(lire(projet({ avecIndex: false })).mutate, []);
});

test("STRYKER_MUTATE remplace le périmètre de l'index pour un essai local", () => {
  const racine = projet({ avecIndex: true });
  const sortie = spawnSync(process.execPath, ["--input-type=module", "-e", "import('./stryker.regles.config.mjs').then((m) => console.log(JSON.stringify(m.default.mutate)))"], {
    cwd: join(racine, "apps/api"),
    encoding: "utf8",
    env: { ...process.env, PROJET_RACINE: undefined, STRYKER_MUTATE: "src/x.ts,src/y.ts" },
  });
  assert.deepEqual(JSON.parse(sortie.stdout), ["src/x.ts", "src/y.ts"]);
});

// La criticité posée par une fonction : aucun texte du plugin ne la montre en ligne (scripts/depot.test.mjs).
const niveauDeclare = (level) => ({ level, origin: "declared" });
// K6 de la preuve suffisante (SPEC_ALL_ANC-5 § 7 et § 8) : l'index au pivot 3, où une règle qui a des preuves sans
// avoir tous ses cas prouvés est « partielle ». Ses tests existent : sa solidité se mesure comme celle d'une prouvée.
test("pivot 3 : les règles prouvées et partielles entrent, avec leur criticité ; to-build, configured et les autres non", () => {
  const avec = (key, status, code, level) => ({ ...regle(key, status, code), ...(level ? { criticality: niveauDeclare(level) } : {}) });
  const p = perimetre(
    index(
      [
        avec("RULE_ALL_LIC-1", "proven", ["a.ts"], "high"),
        avec("RULE_ALL_LIC-2", "partial", ["b.ts"], "medium"),
        avec("RULE_ALL_LIC-3", "partial", ["c.ts"]),
        avec("RULE_ALL_LIC-4", "to-build", ["d.ts"], "high"),
        avec("RULE_ALL_LIC-5", "configured", ["e.ts"], "low"),
        avec("RULE_ALL_LIC-6", "not-applicable", ["f.ts"]),
        avec("RULE_ALL_LIC-7", "partial", ["g.ts"], "urgent"),
      ],
      "3",
    ),
    tous,
  );
  assert.deepEqual(p.fichiers, ["a.ts", "b.ts", "c.ts", "g.ts"]);
  assert.deepEqual(p.regles.map((r) => [r.regle, r.criticite]), [["RULE_ALL_LIC-1", "high"], ["RULE_ALL_LIC-2", "medium"], ["RULE_ALL_LIC-3", null], ["RULE_ALL_LIC-7", null]], "« à classer », ou un niveau hors vocabulaire : null");
  assert.deepEqual(perimetre(index([regle("RULE_ALL_LIC-2", "partial", ["b.ts"])], "2"), tous).fichiers, [], "au schéma 2, partial n'existe pas : seule proven entre");
});

test("pivot 3 : sans règle prouvée ou partielle, la raison le dit avec les mots du pivot 3", () => {
  assert.match(perimetre(index([regle("RULE_ALL_LIC-1", "to-build", ["a.ts"])], "3"), tous).raison, /^aucune règle prouvée ou partielle dans l'index : rien à muter$/);
  assert.match(perimetre(index([regle("RULE_ALL_LIC-1", "partial", undefined)], "3"), tous).raison, /^1 règle\(s\) prouvée\(s\) ou partielle\(s\), aucune ne déclare de fichier de code utilisable/);
  assert.match(perimetre(index([regle("RULE_ALL_LIC-1", "proven", ["a.ts"])], 3), tous).raison, /de schéma 3, la mutation lit les schémas "2" et "3"/, "un nombre n'est pas le schéma \"3\"");
});

test("--list sur un index au pivot 3 : une règle partielle donne ses fichiers", () => {
  const racine = projet({ avecIndex: false });
  mkdirSync(join(racine, "anchorpost"), { recursive: true });
  writeFileSync(join(racine, "anchorpost/anchorpost.json"), JSON.stringify(index([regle("RULE_ALL_LIC-1", "partial", ["apps/api/src/a.ts"])], "3")));
  const r = lancer(racine, ["--list"]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "apps/api/src/a.ts\n");
});
