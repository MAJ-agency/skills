// `sautesAttendus` (ticket 117, A-266) : les sauts admis d'un banc posé, lus par `poses.test.mjs` et `references-posees.test.mjs`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { SAUTES, sautesAttendus } from "./sautes-admis.mjs";

test("`sautesAttendus` rend les entrées des seuls bancs donnés, triées par banc puis nom ; `SAUTES` est gelé", () => {
  assert.ok(Object.isFrozen(SAUTES));
  assert.ok(SAUTES.length >= 1);
  for (const s of SAUTES) assert.deepEqual(Object.keys(s).sort(), ["banc", "nom", "raison"]);
  const pr = SAUTES.filter((s) => s.banc === "scripts/github/pr-titre.test.mjs");
  assert.equal(pr.length, 1);
  assert.deepEqual(sautesAttendus(["scripts/github/pr-titre.test.mjs"]), pr);
  assert.deepEqual(sautesAttendus(["scripts/chaine/autre.test.mjs"]), []);
  assert.deepEqual(sautesAttendus([]), []);
  const tri = sautesAttendus(SAUTES.map((s) => s.banc));
  assert.deepEqual(tri, [...tri].sort((a, b) => a.banc.localeCompare(b.banc) || a.nom.localeCompare(b.nom)));
});
