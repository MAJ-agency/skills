// Plafonds de session : règle pure, contrat, entrée douteuse, CLI.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { juger, jugerTout, plafondsDe, PAR_DEFAUT } from "./plafonds.mjs";

const SCRIPT = new URL("./plafonds.mjs", import.meta.url).pathname;
const lancer = (entree, contrat) => {
  const cwd = mkdtempSync(join(tmpdir(), "plafonds-"));
  if (contrat !== undefined) {
    mkdirSync(join(cwd, ".claude"));
    writeFileSync(join(cwd, ".claude/chaine.json"), contrat);
  }
  return spawnSync("node", [SCRIPT], { cwd, input: JSON.stringify(entree), encoding: "utf8" });
};

test("une fille sous ses deux plafonds est rendue ok", () => {
  assert.equal(juger({ role: "fille", contexte: 399999, cout: 3 }).verdict, "ok");
  assert.equal(juger({ role: "fille", contexte: 0, cout: 19.99 }).verdict, "ok");
});

test("une fille au plafond de contexte ou de coût est à signaler, la mesure et le plafond nommés", () => {
  const c = juger({ role: "fille", contexte: 400000, cout: 1 });
  assert.equal(c.verdict, "signaler");
  assert.match(c.motif, /contexte 400000 tokens ≥ plafond 400000/);
  const k = juger({ role: "fille", contexte: 10, cout: 25 });
  assert.equal(k.verdict, "signaler");
  assert.match(k.motif, /coût 25 \$ ≥ plafond 20 \$/);
  assert.match(juger({ role: "fille", contexte: 401000, cout: 25 }).motif, /contexte.*coût/);
});

test("un conducteur ou un architecte au plafond de contexte est à signaler", () => {
  for (const role of ["conducteur", "architecte"]) {
    assert.equal(juger({ role, contexte: 399999, cout: 99 }).verdict, "ok");
    const r = juger({ role, contexte: 400000, cout: 0 });
    assert.equal(r.verdict, "signaler");
    assert.match(r.motif, /plafond 400000/);
  }
});

test("aucun verdict ne coupe une session : le script ne rend que ok ou signaler", () => {
  const verdicts = new Set(
    ["fille", "conducteur", "architecte"].flatMap((role) =>
      [0, 399999, 400000, 900000].flatMap((contexte) =>
        [0, 19.99, 20, 500].map((cout) => juger({ role, contexte, cout }).verdict),
      ),
    ),
  );
  assert.deepEqual([...verdicts].sort(), ["ok", "signaler"]);
});

test("sans clé plafonds, les valeurs par défaut s'appliquent ; mal formée, le script sort en erreur", () => {
  assert.deepEqual(plafondsDe({}), PAR_DEFAUT);
  assert.deepEqual(plafondsDe({ plafonds: { coutFille: 5 } }), { ...PAR_DEFAUT, coutFille: 5 });
  assert.throws(() => plafondsDe({ plafonds: [] }), /objet/);
  assert.throws(() => plafondsDe({ plafonds: { coutFille: "20" } }), /coutFille/);
  assert.throws(() => plafondsDe({ plafonds: { coutFile: 20 } }), /inconnue/);
  const entree = [{ session: "s", role: "fille", contexte: 1, cout: 1 }];
  assert.equal(lancer(entree).status, 0);
  assert.equal(lancer(entree, "{}").status, 0);
  const r = lancer(entree, JSON.stringify({ plafonds: { coutFille: -1 } }));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /coutFille/);
  assert.equal(lancer(entree, "{pas du json").status, 2);
  // Le contrat est lu : un plafond plus bas signale.
  const bas = lancer(entree, JSON.stringify({ plafonds: { coutFille: 1 } }));
  assert.equal(bas.stdout, "s\tsignaler\tcoût 1 $ ≥ plafond 1 $\n");
});

test("un rôle inconnu ou une mesure illisible n'est jamais rendu ok", () => {
  assert.throws(() => juger({ role: "capitaine", contexte: 1, cout: 1 }), /rôle inconnu/);
  assert.throws(() => juger({ role: "fille", contexte: "400k", cout: 1 }), /illisible/);
  assert.throws(() => juger({ role: "fille", contexte: 1 }), /illisible/);
  assert.throws(() => juger({ role: "conducteur", contexte: NaN }), /illisible/);
  assert.throws(() => jugerTout([{ role: "fille", contexte: 1, cout: 1 }]), /session manquante/);
  assert.throws(() => jugerTout({}), /liste/);
  assert.throws(() => jugerTout([{ session: "s9", role: "x" }]), /session s9/);
  const r = lancer([{ session: "s", role: "inconnu", contexte: 1, cout: 1 }]);
  assert.equal(r.status, 2);
  assert.equal(r.stdout, "");
});

test("CLI : l'essai du ticket, quatre verdicts", () => {
  const r = lancer([
    { session: "a", role: "fille", contexte: 399999, cout: 3 },
    { session: "b", role: "fille", contexte: 401000, cout: 3 },
    { session: "c", role: "fille", contexte: 1000, cout: 25 },
    { session: "d", role: "conducteur", contexte: 410000, cout: 3 },
  ]);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(
    r.stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2).join(" ")),
    ["a ok", "b signaler", "c signaler", "d signaler"],
  );
});
