// Le dépôt contre lui-même : tout skill est déclaré dans le plugin, tout skill déclaré existe,
// son nom est celui de son dossier, et aucun SKILL.md ne dépasse le budget de 200 lignes
// que le socle impose aux projets (`budget-contexte.mjs`).
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const RACINE = new URL("..", import.meta.url).pathname;
const LIMITE = 200;

const dossiers = (dir) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

const skillsDuDepot = dossiers(join(RACINE, "skills")).flatMap((groupe) =>
  dossiers(join(RACINE, "skills", groupe))
    .filter((nom) => existsSync(join(RACINE, "skills", groupe, nom, "SKILL.md")))
    .map((nom) => `./skills/${groupe}/${nom}`),
);

const declares = JSON.parse(readFileSync(join(RACINE, ".claude-plugin/plugin.json"), "utf8")).skills;
const lire = (chemin) => readFileSync(join(RACINE, chemin, "SKILL.md"), "utf8");

test("chaque skill du dépôt est déclaré dans le plugin", () => {
  const manquants = skillsDuDepot.filter((s) => !declares.includes(s));
  assert.deepEqual(manquants, [], `skills absents de .claude-plugin/plugin.json : ${manquants.join(", ")}`);
});

test("chaque skill déclaré existe", () => {
  const fantomes = declares.filter((s) => !existsSync(join(RACINE, s, "SKILL.md")));
  assert.deepEqual(fantomes, [], `entrées de plugin.json sans SKILL.md : ${fantomes.join(", ")}`);
  assert.equal(new Set(declares).size, declares.length, "entrée déclarée deux fois");
});

test("le nom d'un skill est celui de son dossier", () => {
  for (const s of skillsDuDepot) {
    const entete = lire(s).match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(entete, `${s}/SKILL.md : pas d'en-tête`);
    const nom = entete[1].match(/^name:\s*(.+?)\s*$/m)?.[1];
    assert.equal(nom, s.split("/").pop(), `${s}/SKILL.md : name ≠ nom du dossier`);
  }
});

test("aucun SKILL.md ne dépasse 200 lignes", () => {
  const trop = skillsDuDepot
    .map((s) => ({ s, n: lire(s).replace(/\n$/, "").split("\n").length }))
    .filter(({ n }) => n > LIMITE)
    .map(({ s, n }) => `${s}/SKILL.md : ${n} lignes`);
  assert.deepEqual(trop, [], `SKILL.md au-dessus de ${LIMITE} lignes — déplacer du détail dans references/ : ${trop.join(" ; ")}`);
});
