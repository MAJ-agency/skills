// Banc des textes du lot 4 (ticket 66) : le skill `relecteur` est déclaré et se lance comme un rôle, ses deux
// étiquettes sont celles de la décision du Relecteur, son gabarit de lancement porte les lignes de tout prompt, et
// les cartes le nomment. Le script et sa conduite sont jugés par son banc, `skills/chaine/relecteur/scripts/`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ETIQUETTES } from "../skills/chaine/fusionner/scripts/decision-relecteur.mjs";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const lire = (chemin) => readFileSync(join(RACINE, chemin), "utf8");
const SKILL = "skills/chaine/relecteur";
const exigerDans = (chemin, phrases) => {
  const texte = lire(chemin);
  for (const p of phrases) assert.ok(texte.includes(p), `${chemin} : « ${p} » attendu`);
};
const bloc = (texte, titre) => {
  const i = texte.indexOf(titre);
  assert.ok(i >= 0, `section « ${titre} » attendue`);
  const debut = texte.indexOf("```text\n", i) + "```text\n".length;
  return texte.slice(debut, texte.indexOf("\n```", debut)).split("\n");
};

test("le skill relecteur est un rôle : marqué, sous 200 lignes, déclaré au plugin, au README et à la liste des références", () => {
  const skill = lire(`${SKILL}/SKILL.md`);
  assert.match(skill, /^---\nname: relecteur\ndescription: .+\nargument-hint: .+\ndisable-model-invocation: true\n---\n/);
  assert.ok(skill.split("\n").length <= 200, "SKILL.md : 200 lignes au plus (A-98)");
  assert.ok(JSON.parse(lire(".claude-plugin/plugin.json")).skills.includes("./skills/chaine/relecteur"));
  assert.ok(JSON.parse(lire("skills/monorepo/socle-monorepo/references/scripts/verify/references-agent-integrees.json"))["skills-plugins"].includes("maj-skills:relecteur"));
  exigerDans("README.md", ["| [`relecteur`](skills/chaine/relecteur/SKILL.md)", "    relecteur/\n      SKILL.md ", "relecteur.mjs (passe, jouer, distribuer, veille)"]);
  exigerDans(`${SKILL}/SKILL.md`, ["**La file, la décision et la veille sont des scripts**", "la nouvelle étiquette **avant** de retirer l'ancienne", "`source_revision` **la base de la PR** (jamais sa tête)", "Créer d'abord, écrire la distribution ensuite", "**sort en 3 sans rien écrire**", "`VEILLE GESTE`", "`VEILLE FINIE`", "`VEILLE ARRÊTÉE sortie <c>`"]);
});

test("A-180 — la veille sous le plafond de l'outil Bash, le couple au réemploi, l'état par get_session, une suite écrite pour chaque sortie", () => {
  exigerDans(`${SKILL}/SKILL.md`, [
    "`select:mcp__claude-code-remote__send_message,mcp__claude-code-remote__create_session,mcp__claude-code-remote__get_session,TaskStop`",
    "relecteur.mjs' veille --duree 25 >",
    "**25 minutes, pas plus** : l'outil Bash arrête une tâche de fond à 30 minutes par défaut",
    "au-delà de 500 000 tokens, l'écrire à l'architecte, qui lance un Relecteur neuf, et s'arrêter",
    "**`passe` d'abord**, toujours",
    "**et au même couple** que celui du geste",
    "pour les règles 4, 5 et 6 seulement",
    "`plafond` : plus de 700 000 tokens de contexte",
    "**Un verrou** (`flock`) tient le dossier",
  ]);
  const skill = lire(`${SKILL}/SKILL.md`);
  const sorties = skill.slice(skill.indexOf("## Les sorties de `passe`, `jouer` et `distribuer`"), skill.indexOf("## Créer ou relancer les sessions"));
  for (const code of [0, 1, 2, 3, 5, 6, 7, 9, 12]) assert.match(sorties, new RegExp(`^\\| ${code} \\| \\S`, "m"), `la sortie ${code} a sa suite`);
  assert.match(sorties, /^\| 7 \| .*au second refus, l'architecte et `--taire <n>`/m);
  assert.ok(!/elle a écrit qu'elle est au plafond/.test(skill), "« au plafond » ne se lit plus dans un message");
});

test("contre-relecture de la PR 146 — aucun geste laissé à improviser : le délai de l'outil, toute autre sortie, la veille arrêtée, les champs de get_session, les lignes à l'architecte, une PR tue", () => {
  exigerDans(`${SKILL}/SKILL.md`, [
    "**au premier plan, avec le `timeout` de l'outil Bash à `600000`**",
    "elle ne commence aucune pause qui finirait après ses 25 minutes",
    "**aucune de ces trois lignes** (l'outil a arrêté la veille) : comme `VEILLE FINIE`",
    "(`session_context.model` qui contient `faits.modele`, `claude-opus-…` pour `opus`, et `session_context.effort_level` égal à `faits.effort`)",
    "`plafond` : plus de 700 000 tokens de contexte (`external_metadata.context_usage.used_tokens`)",
    "(`get_session` sans argument, `external_metadata.context_usage.used_tokens`)",
    "Les lignes du Relecteur lui-même à l'architecte ont trois formes, et aucune autre : « PR <n> : <cause> ; PR tue »",
    "tant que la passe lui rend le même geste à la même règle",
    "une erreur de `passe`, qui ne nomme aucune PR : l'architecte, et s'arrêter",
  ]);
  // A-182 : un champ que get_session ne rend pas, dans les deux sections qui le lisent.
  const phrase = "Sans compte de tokens (`context_usage`), la session n'est pas tenue au plafond ; sans `effort_level`, le couple n'est pas tenu pour égal, et la PR reçoit une session neuve.";
  const skillA182 = lire(`${SKILL}/SKILL.md`);
  for (const [debut, fin] of [["## Créer ou relancer les sessions", "## L'état des sessions"], ["## L'état des sessions", "## Les lignes"]]) {
    assert.ok(skillA182.slice(skillA182.indexOf(debut), skillA182.indexOf(fin)).includes(phrase), `« ${debut} » : la phrase d'A-182 attendue`);
  }
  const skill = lire(`${SKILL}/SKILL.md`);
  const sorties = skill.slice(skill.indexOf("## Les sorties de `passe`, `jouer` et `distribuer`"), skill.indexOf("## Créer ou relancer les sessions"));
  assert.match(sorties, /^\| autre, ou aucune \(l'outil a arrêté la commande\) \| \S/m, "une sortie hors de la table a sa suite");
  assert.ok(!lire(`${SKILL}/references/CONTENU.md`).includes("pour la seule règle 5"), "l'état des sessions : règles 4, 5 et 6");
});

test("les deux étiquettes neuves : labels.sh en pose neuf, dont les quatre que la décision du Relecteur lit ; plus aucun « sept labels »", () => {
  const labels = lire("skills/chaine/socle-chaine-de-production/references/labels.sh");
  const noms = labels.slice(labels.indexOf("<<'FIN'\n") + 8, labels.indexOf("\nFIN\n")).split("\n").map((l) => l.split("|")[0]);
  assert.equal(noms.length, 9);
  for (const e of ETIQUETTES) assert.ok(noms.includes(e), `labels.sh pose ${e}`);
  exigerDans("skills/chaine/socle-chaine-de-production/references/admin.md", ["**Les neuf labels**, dont `à-relire` et `à-reprendre`"]);
  for (const f of ["skills/chaine/socle-chaine-de-production/SKILL.md", "skills/chaine/socle-chaine-de-production/references/CONTENU.md", "skills/chaine/socle-chaine-de-production/references/labels.sh", "skills/chaine/socle-chaine-de-production/references/admin.md", "skills/chaine/fusionner/references/CONTENU.md", "README.md"]) {
    assert.ok(!/sept (labels|mots du protocole)/.test(lire(f)), `${f} : « sept labels » ne se dit plus`);
  }
  exigerDans("skills/chaine/socle-chaine-de-production/SKILL.md", ["les neuf labels, les hooks d'agent", "liste les neuf labels", "Les neuf labels sont le protocole des skills. Un dixième n'est lu par personne."]);
});

test("le gabarit de lancement du Relecteur : sa commande en première ligne, puis les lignes « Outils : », « Argument : », « Skills : », « Version : » et la place des consignes du produit", () => {
  const lancement = lire("skills/chaine/architecte/references/lancement.md");
  const relecteur = bloc(lancement, "## Le Relecteur d'un dépôt");
  const capitaine = bloc(lancement, "## Le capitaine d'un dépôt");
  assert.equal(relecteur[0], "/maj-skills:relecteur");
  assert.deepEqual(relecteur.map((l) => l.split(" : ")[0]).slice(2, 6), ["Outils", "Argument", "Skills", "Version"]);
  assert.ok(relecteur[2].includes("select:mcp__claude-code-remote__send_message,mcp__claude-code-remote__create_session,mcp__claude-code-remote__get_session"));
  // Les lignes « Skills : » et « Version : » sont celles du capitaine, pour ce skill.
  const pour = (ligne) => ligne.replaceAll("fusionner", "relecteur");
  assert.equal(relecteur[4], pour(capitaine.find((l) => l.startsWith("Skills : "))));
  assert.equal(relecteur[5], pour(capitaine.find((l) => l.startsWith("Version : "))));
  assert.equal(relecteur[6], "<les deux lignes des consignes du produit, telles quelles, puis la ligne « Commits : »>");
  exigerDans("skills/chaine/architecte/references/lancement.md", ["`tags` `[\"role:relecteur\"]`", "`effort` `\"medium\"`", "l'inscrit sur la ligne `Relecteurs:` de la carte", "(ligne du chantier, `Capitaines:` ou `Relecteurs:`)"]);
});

test("le prompt d'une session de relecture commence par la commande du skill relecture, et porte les consignes du produit telles que lancement.md les donne", () => {
  const texte = lire(`${SKILL}/references/prompt-session.md`);
  const prompt = bloc(texte, "# Le prompt d'une session de relecture");
  assert.equal(prompt[0], "/maj-skills:relecture <n> <tour> <sommet>");
  const consignes = bloc(lire("skills/chaine/architecte/references/lancement.md"), "## Les consignes du produit, dans chaque prompt");
  assert.deepEqual(prompt.slice(-3), consignes, "les trois lignes du produit et la ligne « Commits : », mot pour mot");
  assert.ok(prompt.some((l) => l.startsWith("Seconde relecture : ") && l.includes("Tu ne lis pas son verdict")), "A-90");
  assert.match(bloc(texte, "## Le message qui relance une session")[0], /^Relance : PR <n>, tour <tour>, sommet <sommet>\. /);
});

test("les cartes nomment le Relecteur : `Relecteurs:` dans la fiche d'un programme, `Relecteur:` dans celle d'un chantier", () => {
  assert.match(lire("skills/chaine/tickets/references/gabarits/programme.md"), /^Capitaines: .+\nRelecteurs: \{\{par dépôt : session_id du Relecteur \(régime 8\), ou « absent »\}\}$/m);
  assert.match(lire("skills/chaine/tickets/references/gabarits/carte.map.md"), /^Capitaine: .+\nRelecteur: \{\{session_id du Relecteur du dépôt \(régime 8\), ou « absent »\}\}$/m);
});

test("fusionner/references/CONTENU.md décrit les trois calculs de la relecture (A-137)", () => {
  exigerDans("skills/chaine/fusionner/references/CONTENU.md", ["## `scripts/verdict.mjs`, `scripts/decision-relecteur.mjs`", "## `scripts/meme-contenu.sh`", "## `scripts/double-relecture.mjs`", "Un refus ne compte jamais moins qu'un refus"]);
});
