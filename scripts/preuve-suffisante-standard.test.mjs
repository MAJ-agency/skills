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
const GABARIT_TICKET = "skills/chaine/tickets/references/gabarits/ticket.issue.md";

// K1 et K3 de la preuve suffisante (SPEC_ALL_ANC-5 § 8) : la copie de lecture de la spec amendée, et la ligne
// `Prouve:` du gabarit de ticket, juste sous `Règles:`.
test("la copie de la spec de la preuve suffisante est celle des amendements du 2026-11-14 au 2026-11-20, sans le nom d'une personne", () => {
  const COPIE = "docs/issues/standard-documentation/preuve-suffisante.spec.md";
  const texte = readFileSync(join(RACINE, COPIE), "utf8");
  assert.match(texte, /^# SPEC_ALL_ANC-5 — La preuve suffisante : criticité, cas attendus, état « partielle »\n\n> \*\*Copie de lecture\.\*\* /);
  exiger(COPIE, [
    "branche `develop` (`2be4e7e`, fichier inchangé depuis `ee9b8a2` du 2026-11-20)",
    "### Amendement (2) du 2026-11-17 : un agent fixe la criticité, les familles dès la moyenne",
    "Amendement du 2026-11-18 (SPEC_ALL_ANC-5.37, `A-35` D3, D7 et D8, `A-37` R4)",
    "**`caseRevision: { date, by, reason }`**",
    "4. un cas d'une règle `validated` **sur la base** changé sans le geste daté d'une personne (`RULE_ALL_ANC-27`, amendé le 2026-11-20 par SPEC_ALL_ANC-5.38, plus bas)",
  ]);
  assert.doesNotMatch(texte, /Copie du 2026-11-13\./, "la copie d'avant l'amendement est remplacée");
  assert.deepEqual(texte.match(/"by": "[^"]+"/g), ['"by": "Alice Martin"', '"by": "Alice Martin"'], "les exemples nomment la personne fictive de la spec");
});

test("le gabarit de ticket porte la ligne `Prouve:` sous `Règles:`, et une ligne de `## Surfaces` par cas attendu", () => {
  const texte = readFileSync(join(RACINE, GABARIT_TICKET), "utf8");
  const enTete = lignes(texte.split(/^## /m)[0]);
  const regles = enTete.findIndex((l) => l.startsWith("Règles: "));
  assert.match(enTete[regles + 1] ?? "", /^Prouve: \{\{RULE_ALL_<TRI>-<n> — les règles que le ticket prouve sans les réaliser \(il écrit leurs tests, pas leur code\) ; jamais une règle de `Règles:` ; la criticité d'une feature ne descend pas par cette ligne, seulement par `Règles:` ; ou retirer la ligne\}\}$/);
  assert.match(texte, /^\| \{\{RULE_<CTX>_<TRI>-<n>#<cas>\}\} \| \{\{projet suivi par Anchorpost, index au pivot 3 : une ligne par cas attendu des règles de `Règles:` et de `Prouve:`/m);
});
