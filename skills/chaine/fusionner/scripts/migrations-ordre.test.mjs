// Ordre des migrations à l'arrivée dans develop : règle pure, CLI, passer.sh, sujet.sh livrer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { controlerOrdre, horodatage, message, plus10Minutes } from "./migrations-ordre.mjs";
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const DOSSIER = "apps/api/src/db/migrations";
const CHAINE = JSON.stringify({ migrations: `${DOSSIER}/` });
const mig = (h, nom = "demo") => `${DOSSIER}/${h}-${nom}.ts`;

test("horodatage : douze chiffres avant le premier tiret, sinon null", () => {
  assert.equal(horodatage("202612011000-demo.ts"), "202612011000");
  assert.equal(horodatage("apps/x/202612011000-a.ts"), "202612011000");
  assert.equal(horodatage("index.ts"), null);
});

test("plus10Minutes : passe l'heure, le jour et l'année", () => {
  assert.equal(plus10Minutes("202612011000"), "202612011010");
  assert.equal(plus10Minutes("202612011050"), "202612011100");
  assert.equal(plus10Minutes("202612312355"), "202701010005");
});

test("controlerOrdre : une migration postérieure à la dernière passe", () => {
  assert.deepEqual(
    controlerOrdre({ base: ["202612011000-a.ts"], ajoutees: ["202612011100-b.ts"] }),
    [],
  );
});

test("controlerOrdre : antérieure ou égale refusée, avec l'horodatage libre suivant", () => {
  const refus = controlerOrdre({
    base: ["202611271000-a.ts", "202612011000-b.ts"],
    ajoutees: ["202611281000-c.ts", "202612011000-d.ts"],
  });
  assert.deepEqual(
    refus.map((r) => [r.fichier, r.propose]),
    [
      ["202611281000-c.ts", "202612011010"],
      ["202612011000-d.ts", "202612011020"],
    ],
  );
  assert.match(message(refus), /202611281000-c\.ts.*202612011010-c\.ts/);
});

test("controlerOrdre : base sans migration, rien à contrôler", () => {
  assert.deepEqual(controlerOrdre({ base: [], ajoutees: ["202611281000-c.ts"] }), []);
});

// Dépôt jouet : develop a livré jusqu'à 202612011000, la PR ajoute une migration à `h`.
function pr(d, h) {
  d.ecrire(".claude/chaine.json", CHAINE);
  d.ecrire(mig("202612011000", "livree"), "// livrée\n");
  d.commit("chore: develop");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("feat/migr", "origin/develop", { [mig(h, "nouvelle")]: "// nouvelle\n" });
  d.github({
    pulls: [
      {
        number: 40,
        title: "feat(db): nouvelle",
        head: "feat/migr",
        base: "develop",
        labels: ["à-fusionner"],
        body: "## Revue adversariale\n\nRien de bloquant.\n",
      },
    ],
  });
}
const script = (nom) => scriptDe("fusionner", nom);
const cli = () => new URL("./migrations-ordre.mjs", import.meta.url).pathname;

test("CLI : sortie 1 et message pour une migration trop ancienne, 0 sinon", () => {
  const d = depotJouet();
  pr(d, "202611281000");
  const ko = d.lancer("-c", `node ${cli()} origin/develop origin/feat/migr`);
  assert.equal(ko.status, 1);
  assert.match(ko.stdout, /202611281000-nouvelle\.ts.*202612011010-nouvelle\.ts/);
  const d2 = depotJouet();
  pr(d2, "202612011100");
  assert.equal(d2.lancer("-c", `node ${cli()} origin/develop origin/feat/migr`).status, 0);
});

test("passer.sh : une migration ajoutée plus ancienne que celle de develop est refusée (sortie 4), sans fusion", () => {
  const d = depotJouet();
  pr(d, "202611281000");
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /202611281000-nouvelle\.ts.*202612011010-nouvelle\.ts/);
  assert.ok(!d.journal().some((e) => e.methode === "PUT"), "aucune fusion");
});

test("passer.sh : une migration postérieure ne gêne pas", () => {
  const d = depotJouet();
  pr(d, "202612011100");
  d.github({ checks: {}, exiges: [] });
  const r = d.lancer(script("passer.sh"), "40");
  assert.doesNotMatch(r.stdout, /pas postérieur/);
});

test("sujet.sh livrer : un sujet dont la migration est plus ancienne que celle de develop n'ouvre aucune PR (sortie 4)", () => {
  const d = depotJouet();
  d.ecrire(".claude/chaine.json", CHAINE);
  d.ecrire(mig("202612011000", "livree"), "// livrée\n");
  d.commit("chore: develop");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { [mig("202611281000", "lot")]: "// lot\n" });
  const r = d.lancer(scriptDe("sujet", "sujet.sh"), "livrer", "lot", "feat(db): lot");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /202611281000-lot\.ts.*202612011010-lot\.ts/);
  assert.ok(!d.journal().some((e) => e.methode === "POST"), "aucune PR ouverte");
});
