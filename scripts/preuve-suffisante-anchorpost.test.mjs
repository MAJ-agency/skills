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
  assert.match(manifeste.$comment, /prouvées \(un cas nominal déclaré, chaque cas attendu prouvé et, dès medium, chaque famille répondue\)/, "le commentaire du gabarit dit « prouvée » comme la CLI");
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
    "1. Les deux lignes de GitHub Packages retirées de `.npmrc` s'il les porte (étape 1, point 1), puis `pnpm add -Dw @maj-agency/anchorpost@^2.0.2`",
    "2. `pnpm exec anchorpost migrate manifest` (le plan, rien n'est écrit), puis `pnpm exec anchorpost migrate manifest --apply` : la commande que nomme l'alerte `manifest-schema-old`.",
    "Jamais `init --force`.",
    "## Passer au pivot 3 (`pivot-3`)",
    "3. Chaque règle sans criticité ni cas (l'alerte de projet de l'index compte celles qui ont des preuves ; les autres ont chacune leur alerte, « sans criticité » ou « aucun cas ») se classe par le skill `criticite`, une règle à la fois, avant tout code qui la touche",
    "5. Le passage à `enforce` est une décision du produit, projet par projet",
  ]);
  // Les décisions 2 et 3 du ticket, en leur substance : le manifeste sensible, le plancher qu'on relève, `enforce` écrit par une personne.
  exiger(`${ANCHORPOST}/SKILL.md`, [
    "en `enforce`, une règle `validated` sans criticité ou une règle moyenne ou haute dont une famille n'a pas de réponse (des avertissements en `observe`)",
    "`anchorpost migrate manifest` le réécrit au schéma 3 tel que la CLI le lit déjà, sans rien y générer",
    "5. `.claude/chaine.json` : `anchorpost/manifest.json` dans `cheminsSensibles` (le plancher, `sufficiency` et `featureCriticality` ne se baissent que par une personne).",
    "Puis, à la main, le plancher relevé d'après la mesure du jour, avec une date nouvelle et la personne qui le pose (`floor { date, by, proven, partial }`)",
    "une PR où une personne écrit `\"sufficiency\": \"enforce\"`.",
  ]);
  // Le passage par `migrate manifest` (A-213, question 1), en sa substance : l'arbre propre, ce que la commande écrit et refuse, la raison d'une feature basse.
  exiger(`${ANCHORPOST}/SKILL.md`, [
    "Commiter : la commande suivante exige un arbre propre.",
    ": la commande que nomme l'alerte `manifest-schema-old`.",
    "sa date gardée, jamais re-mesuré",
    "elle refuse, sans rien écrire, une clé que le schéma 3 perdrait",
    "la commande la refuse, et `init` aussi ; le manifeste se réécrit alors au schéma 3 à la main, aux mêmes conversions, avec la `reason` que donne la personne nommée par `by` : une session ne l'écrit pas à sa place, elle la demande dans sa PR.",
  ]);
  exiger(`${ANCHORPOST}/references/fragments/admin.md`, [
    "- [ ] **Le passage à `enforce`** de la preuve suffisante est une décision du produit : la personne écrit `\"sufficiency\": \"enforce\"` dans le manifeste, par une PR.",
  ]);
  // La note 8.3.0 : ce qu'un projet repose, et l'ordre du retrait de la ligne de registre.
  exiger("NOTES-DE-VERSION.md", [
    "- **Reposer la fiche** `.claude/rules/anchorpost.md`, dans un dépôt au pivot 3 (un dépôt au schéma 2 la repose au point 4 de « Passer au pivot 3 »)",
    "et ajouter `anchorpost/manifest.json` aux `cheminsSensibles` de `.claude/chaine.json` (étape 4, point 5)",
    "retire d'abord de `.npmrc` les lignes `@maj-agency:registry=…` et `…_authToken=…`, puis installe la CLI",
    "la CLI (≥ 2.0.2), `anchorpost migrate manifest` qui écrit le manifeste au schéma 3 tel que la CLI le lit déjà",
  ]);
});

test("la fiche anchorpost dit comment écrire une criticité, un cas, une étiquette de cas, et ce que dit compare", () => {
  exiger(FICHE_ANCHORPOST, [
    "## Criticité et cas attendus (pivot 3, CLI Anchorpost ≥ 2.0.0)",
    "Une règle déclarée en `Règles:` par une feature dont `featureCriticality` fixe le niveau prend le plus haut des deux ; une règle sans l'une ni l'autre est « à classer », jamais « basse ».",
    "une étiquette qui nomme un cas que la règle ne déclare pas est refusée par `anchorpost check`",
    "Un agent ne lève jamais un écart en baissant un niveau, un cas ou un plancher : il le dit dans sa PR, et la personne décide.",
    "C'est un chemin sensible : un agent n'y baisse ni un plancher, ni une criticité, ni `sufficiency`.",
    "`scope` (`business` un cas que la MOA reconnaît, `technical` un cas que seule l'équipe voit)",
    "la nomme sur `Prouve:`, jamais sur `Règles:` : la criticité d'une feature ne descend que par `Règles:`.",
    "Ses écarts, entre autres (la liste fermée est celle du README de la CLI) :",
    "- **`criticality`** : `level` (`low`, `medium`, `high`), `by` (`agent`, ou une clé de `roles` du manifeste, que seule la personne écrit), `reason` (obligatoire pour `low`), et `date` (`AAAA-MM-JJ`), facultative",
    "- **`cases`** : chaque cas a `id` (minuscules, chiffres, tirets, unique dans la règle), `title`, `kind` (`nominal` le cas normal, `edge` un cas limite, `invalid` une entrée invalide, `refusal` un refus)",
    "**Un test qui prouve un cas le nomme après un `#`** : `it('[RULE_ALL_LIC-3#lien-expire] refuse un lien expiré')`",
    "## Ce que dit `anchorpost compare`",
    "En `observe`, ce sont des avertissements et la commande sort 0 ; en `enforce`, elle sort 1.",
    "Un ticket qui prouve une règle sans la réaliser la nomme sur `Prouve:`, jamais sur `Règles:`",
    "une règle est « prouvée » quand elle déclare un cas `nominal`, que chacun de ses cas l'est et, dès `medium`, que chacune des dix familles a sa réponse",
    "un cas qui la porte (un cas `invalid` répond à `invalid-input`), ce « sans objet » motivé, ou une question ouverte dont la ligne `Bloque :` nomme la règle, qui la laisse « partielle ».",
    "« partielle » quand elle a une preuve sans l'être (un cas sans preuve au niveau exigé, que `realisation.cases` compte ; aucun cas déclaré ; pas de cas `nominal` ou une famille sans réponse, que `realisation.missing` nomme).",
  ]);
  const lignesFiche = readFileSync(join(RACINE, FICHE_ANCHORPOST), "utf8").split("\n").length;
  assert.ok(lignesFiche < 200, `${FICHE_ANCHORPOST} : ${lignesFiche} lignes, moins de deux cents (budget-contexte)`);
});
