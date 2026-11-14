import assert from "node:assert/strict";
import { test } from "node:test";
import { module } from "./depot-jouet.mjs";

const { nomsDeSujets } = await module("docs/ligne-sujet.mjs");

test("nomsDeSujets lit une ou plusieurs valeurs sujet/<nom> séparées par des virgules, espaces tolérées", () => {
  assert.deepEqual(nomsDeSujets("sujet/socle"), ["socle"]);
  assert.deepEqual(nomsDeSujets("sujet/a, sujet/b, sujet/c"), ["a", "b", "c"]);
  assert.deepEqual(nomsDeSujets("sujet/a,sujet/b"), ["a", "b"]);
  assert.deepEqual(nomsDeSujets("  sujet/a  ,  sujet/b-2  "), ["a", "b-2"]);
});

test("nomsDeSujets refuse une valeur qui n'est pas un nom de sujet, sans lecture partielle", () => {
  for (const mal of ["", "sujet/a sujet/b", "sujet/a,", ",sujet/a", "sujet/a,,sujet/b", "sujet/A", "sujet/a (lot 1)", "sujet/a, b", "demo"]) {
    assert.equal(nomsDeSujets(mal), null, JSON.stringify(mal));
  }
});

test("nomsDeSujets accepte un nom sans préfixe quand le lecteur le tolère (couts.mjs)", () => {
  assert.deepEqual(nomsDeSujets("demo", { prefixeFacultatif: true }), ["demo"]);
  assert.deepEqual(nomsDeSujets("a, sujet/b", { prefixeFacultatif: true }), ["a", "b"]);
  assert.equal(nomsDeSujets("sujet/a sujet/b", { prefixeFacultatif: true }), null);
});

test("nomsDeSujets lit les blancs comme l'awk de sujet.sh : espaces et tabulations autour, rien d'autre en tête ni autour d'une virgule", () => {
  assert.deepEqual(nomsDeSujets("sujet/a,\tsujet/b"), ["a", "b"]);
  assert.deepEqual(nomsDeSujets("sujet/a, sujet/b\f"), ["a", "b"], "fin de ligne : [[:space:]] de l'awk");
  assert.deepEqual(nomsDeSujets("sujet/a, sujet/b\v"), ["a", "b"]);
  for (const mal of ["sujet/a, sujet/b ", " sujet/a", "sujet/a, sujet/b", "sujet/a ,\fsujet/b", "\fsujet/a", "\vsujet/a"]) {
    assert.equal(nomsDeSujets(mal), null, JSON.stringify(mal));
  }
});
