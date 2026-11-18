// Tests et heure : la fiche des tests du socle porte la règle « Le jour et l'heure » en trois points,
// socle-tests pose le gabarit qui les montre, et ni l'une ni l'autre ne nomme un fuseau réel ni un projet.
// Les textes sont lus à plat (blancs et sauts de ligne réduits à une espace).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const RACINE = new URL("..", import.meta.url).pathname;
const FICHE = "skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md";
const SOCLE_TESTS = "skills/monorepo/socle-tests";
const GABARIT = `${SOCLE_TESTS}/references/gabarits/exemple.jour-metier.spec.ts`;
const plat = (t) => t.replace(/\s+/g, " ");
const lire = (chemin) => plat(readFileSync(join(RACINE, chemin), "utf8"));
const exiger = (chemin, phrases) => {
  const texte = lire(chemin);
  const absentes = phrases.filter((p) => !texte.includes(plat(p)));
  assert.deepEqual(absentes, [], `${chemin} : passages absents : ${absentes.join(" | ")}`);
};

test("tests et heure : la fiche des tests porte la règle en trois points, socle-tests pose le gabarit, et aucun des deux ne nomme un fuseau réel ni un projet", () => {
  exiger(FICHE, [
    "## Le jour et l'heure",
    "**Le jour se lit dans le fuseau du métier, par l'horloge injectée.**",
    "**Un test crée ses données au lieu de lire celles du seed partagé.**",
    "**Un banc tourne avec une horloge posée.**",
    "docs/agents/gabarits/exemple.jour-metier.spec.ts",
  ]);
  assert.ok(existsSync(join(RACINE, GABARIT)), `${GABARIT} absent`);
  exiger(GABARIT, ["EXAMPLE_TIME_ZONE", "clock", "it.each"]);
  exiger(`${SOCLE_TESTS}/SKILL.md`, ["exemple.jour-metier.spec.ts"]);
  exiger(`${SOCLE_TESTS}/references/CONTENU.md`, ["exemple.jour-metier.spec.ts"]);
  // Aucun nom propre à un projet, ni fuseau réel hors celui d'exemple.
  for (const chemin of [FICHE, GABARIT]) {
    const texte = lire(chemin);
    assert.doesNotMatch(texte, /paris|iroki/i, `${chemin} nomme un projet ou un fuseau propre à un projet`);
    const fuseaux = [...texte.matchAll(/\b(?:Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z_]+/g)].map((m) => m[0]);
    assert.deepEqual(fuseaux.filter((f) => f !== "Pacific/Auckland"), [], `${chemin} nomme un fuseau réel autre que le fuseau d'exemple`);
  }
});
