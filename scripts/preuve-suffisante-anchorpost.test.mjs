// Bancs de la part de `skills` de la preuve suffisante (SPEC_ALL_ANC-5 § 8, tickets 83 à 89 de gouverner-nos-boucles) :
// les textes que les skills posent, lus à plat comme dans `depot.test.mjs` (blancs et sauts de ligne réduits à une
// espace : une phrase exigée peut changer de ligne, une phrase glissée au milieu d'un passage le rompt).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const RACINE = new URL("..", import.meta.url).pathname;
const SKILLS_CHAINE = "skills/chaine";
const lignes = (w) => w.split(/\r?\n/);
const plat = (t) => t.replace(/\s+/g, " ");
const exiger = (chemin, phrases) => {
  const texte = plat(readFileSync(join(RACINE, chemin), "utf8"));
  const absentes = phrases.filter((p) => !texte.includes(plat(p)));
  assert.deepEqual(absentes, [], `${chemin} : passages absents : ${absentes.join(" | ")}`);
};
const FICHE_ANCHORPOST = `${SKILLS_CHAINE}/anchorpost/references/rules/anchorpost.md`;

// K5 de la preuve suffisante (SPEC_ALL_ANC-5 § 8) : le skill `anchorpost` suit la CLI 2.0.0, publique, au pivot 3.
test("le skill anchorpost suit la CLI 2.0.0 : manifeste au schéma 3, CLI publique sans jeton, passage au pivot 3", () => {
  const ANCHORPOST = `${SKILLS_CHAINE}/anchorpost`;
  const manifeste = JSON.parse(readFileSync(join(RACINE, ANCHORPOST, "references/manifest.json"), "utf8"));
  assert.equal(manifeste.schema, "3");
  assert.equal(manifeste.sufficiency, "observe", "un projet adopte en observe ; enforce est une décision du produit");
  assert.deepEqual(Object.keys(manifeste.contexts[0].floor), ["date", "proven", "partial"]);
  const skill = readFileSync(join(RACINE, ANCHORPOST, "SKILL.md"), "utf8");
  assert.doesNotMatch(skill.split("## Étape 2")[0], /read:packages|_authToken=\$\{NODE_AUTH_TOKEN\}/, "l'installation ne demande plus de jeton");
  const etape1 = skill.split("## Étape 1")[1].split("## Étape 2")[0];
  assert.ok(etape1.indexOf("retire d'abord ces deux lignes") >= 0 && etape1.indexOf("retire d'abord ces deux lignes") < etape1.indexOf("pnpm add -Dw"), "les lignes de GitHub Packages se retirent avant pnpm add, qui sinon y cherche le paquet");
  assert.doesNotMatch(skill, /paquet privé|CLI privée/, "le skill ne dit plus nulle part la CLI privée (l'étape 7, l'ADR)");
  for (const f of ["references/fragments/admin.md", "references/adr/ADR_ALL_ARC-N-index-anchorpost.md"])
    assert.doesNotMatch(readFileSync(join(RACINE, ANCHORPOST, f), "utf8"), /paquet (npm )?privé sur GitHub Packages, installé|network secret pour l'hôte/, `${f} : la recette du jeton est retirée`);
  exiger(`${ANCHORPOST}/SKILL.md`, [
    "La CLI est un paquet npm **public** sur npmjs.com (Anchorpost `ADR_ALL_ARC-16`) : une installation ordinaire, sans jeton ni `.npmrc` particulier.",
    "2. `pnpm add -Dw @maj-agency/anchorpost@^2`",
    "1. Les deux lignes de GitHub Packages retirées de `.npmrc` s'il les porte (étape 1, point 1), puis `pnpm add -Dw @maj-agency/anchorpost@^2`",
    "## Passer au pivot 3 (`pivot-3`)",
    "3. Chaque règle sans criticité ni cas (l'alerte de projet de l'index les compte) se classe par le skill `criticite`, une règle à la fois, avant tout code qui la touche",
    "5. Le passage à `enforce` est une décision du produit, projet par projet",
  ]);
});

test("la fiche anchorpost dit comment écrire une criticité, un cas, une étiquette de cas, et ce que dit compare", () => {
  exiger(FICHE_ANCHORPOST, [
    "## Criticité et cas attendus (pivot 3, CLI Anchorpost ≥ 2.0.0)",
    "- **`criticality`** : `level` (`low`, `medium`, `high`), `by` (`agent`, ou une clé de `roles` du manifeste, que seule la personne écrit), `reason` (obligatoire pour `low`), et `date` (`AAAA-MM-JJ`), facultative",
    "- **`cases`** : chaque cas a `id` (minuscules, chiffres, tirets, unique dans la règle), `title`, `kind` (`nominal` le cas normal, `edge` un cas limite, `invalid` une entrée invalide, `refusal` un refus)",
    "**Un test qui prouve un cas le nomme après un `#`** : `it('[RULE_ALL_LIC-3#lien-expire] refuse un lien expiré')`",
    "## Ce que dit `anchorpost compare`",
    "En `observe`, ce sont des avertissements et la commande sort 0 ; en `enforce`, elle sort 1.",
    "Un ticket qui prouve une règle sans la réaliser la nomme sur `Prouve:`, jamais sur `Règles:`",
  ]);
  const lignesFiche = readFileSync(join(RACINE, FICHE_ANCHORPOST), "utf8").split("\n").length;
  assert.ok(lignesFiche < 200, `${FICHE_ANCHORPOST} : ${lignesFiche} lignes, moins de deux cents (budget-contexte)`);
});
