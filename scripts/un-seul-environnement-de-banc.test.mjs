// Le filtre des variables GIT_* d'un banc vit en un seul endroit : environnement-de-banc.mjs
// (socle-monorepo). Un banc ou un depot-jouet.mjs qui le recopie diverge tôt ou tard : ce banc refuse
// toute ligne qui filtre `GIT_`. Il se lit lui-même : le motif ci-dessous est une regex échappée.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const COPIE = /startsWith\(\s*['"]GIT_['"]/;
const AUTORISE = "environnement-de-banc.mjs";
const SOI = "un-seul-environnement-de-banc.test.mjs";

function fichiers(dossier) {
  const out = [];
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(dossier, e.name);
    if (e.isDirectory()) out.push(...fichiers(p));
    else if ((e.name.endsWith(".test.mjs") || e.name === "depot-jouet.mjs") && e.name !== SOI) out.push(p);
  }
  return out;
}

test("un seul environnement de banc : aucun banc ne recopie le filtre des variables GIT_*", () => {
  const fautifs = [join(RACINE, "scripts"), join(RACINE, "skills")]
    .flatMap(fichiers)
    .filter((f) => !f.endsWith(AUTORISE) && COPIE.test(readFileSync(f, "utf8")))
    .map((f) => relative(RACINE, f))
    .sort();
  assert.deepEqual(fautifs, [], `copies du filtre GIT_* à remplacer par environnementDeBanc() : ${fautifs.join(", ")}`);
});

test("le motif de copie : guillemets simples ou doubles, fin de ligne CRLF ou absente ; pas les voisins", () => {
  for (const ligne of ["c.startsWith('GIT_')", 'c.startsWith("GIT_")', "x.startsWith( 'GIT_' )\r\n", "!k.startsWith('GIT_')"]) {
    assert.ok(COPIE.test(ligne), ligne);
  }
  for (const ligne of ["c.startsWith('GIT_CONFIG')", 'c.startsWith("MON_GIT_")', "c.endsWith('GIT_')", "// GIT_ en commentaire"]) {
    assert.equal(COPIE.test(ligne), false, ligne);
  }
});
