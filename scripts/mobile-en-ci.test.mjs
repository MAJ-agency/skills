// Banc de la référence des parcours sur appareil en CI du socle mobile : la méthode tirée d'un premier projet
// y est, le ticket gabarit des parcours et l'inventaire y renvoient, et rien de ce projet n'y entre.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const RACINE = new URL("..", import.meta.url).pathname;
const MOB = "skills/mobile/socle-mobile-expo/references";
const REFERENCE = `${MOB}/mobile/docs/MOBILE_CI.md`;
const plat = (t) => t.replace(/\s+/g, " ");
const exiger = (chemin, phrases) => {
  const texte = plat(readFileSync(join(RACINE, chemin), "utf8"));
  const absentes = phrases.filter((p) => !texte.includes(plat(p)));
  assert.deepEqual(absentes, [], `${chemin} : passages absents : ${absentes.join(" | ")}`);
};

test("mobile en CI : la référence porte les sept points, le ticket gabarit 15 y renvoie, et rien d'un projet n'y entre", () => {
  assert.ok(existsSync(join(RACINE, REFERENCE)), `${REFERENCE} : absent`);
  const texte = readFileSync(join(RACINE, REFERENCE), "utf8");
  for (const jeton of ["cores: 4", "ram-size: 4096M", "stopApp: false", "hide_error_dialogs", "am_anr", "am_crash", "events", "timeout-minutes", "paths"]) {
    assert.ok(texte.includes(jeton), `${REFERENCE} : « ${jeton} » absent`);
  }
  exiger(REFERENCE, [
    "juge le diff de toute la PR",
    "un ANR ou un crash de l'app rend le run rouge",
  ]);
  exiger(`${MOB}/tickets/15-parcours-sur-appareil.issue.md`, ["MOBILE_CI.md"]);
  exiger(`${MOB}/CONTENU.md`, ["docs/MOBILE_CI.md"]);
  const interdits = texte.match(/iroki|majagency|etxen|SOC-4\.|ARC-19|close-anr/gi) ?? [];
  assert.deepEqual(interdits, [], `${REFERENCE} : rien d'un projet n'y entre`);
});
