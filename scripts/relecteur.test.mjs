// Banc des textes du lot 4 (ticket 66) : le skill `relecteur` est déclaré et se lance comme un rôle, ses deux
// étiquettes sont celles de la décision du Relecteur, son gabarit de lancement porte les lignes de tout prompt, et
// les cartes le nomment. Le script et sa conduite sont jugés par son banc, `skills/chaine/relecteur/scripts/`.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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
// Une section de SKILL.md, de son titre au titre suivant de même niveau ; une ligne de cette section (une puce, une
// ligne de table) qui commence par `debut`. Une phrase exigée à sa place ne passe plus si elle quitte sa section ou sa puce.
const section = (texte, titre) => {
  const i = texte.indexOf(`\n${titre}\n`);
  assert.ok(i >= 0, `section « ${titre} » attendue`);
  const fin = texte.indexOf("\n## ", i + 1);
  return texte.slice(i, fin === -1 ? texte.length : fin);
};
const ligne = (texte, titre, debut) => {
  const l = section(texte, titre).split("\n").filter((x) => x.startsWith(debut));
  assert.equal(l.length, 1, `« ${titre} » : une ligne qui commence par « ${debut} »`);
  return l[0];
};
const exigerA = (morceau, ou, phrases) => {
  for (const p of phrases) assert.ok(morceau.includes(p), `${ou} : « ${p} » attendu à cette place`);
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
    "au-delà de 500 000 tokens, l'écrire à l'architecte (« Relecteur arrêté : contexte à <k> tokens »), et s'arrêter : l'architecte l'archive, puis lance un Relecteur neuf",
    "**`passe` d'abord**, toujours",
    "**et au même couple** que celui du geste",
    "pour les règles 1, 4, 5 et 6 seulement",
    "`plafond` : plus de 700 000 tokens de contexte",
    "**Un verrou** (`flock`) tient le dossier",
  ]);
  const skill = lire(`${SKILL}/SKILL.md`);
  const sorties = skill.slice(skill.indexOf("## Les sorties de `passe`, `jouer` et `distribuer`"), skill.indexOf("## Créer ou relancer les sessions"));
  for (const code of [0, 1, 2, 3, 5, 6, 7, 9, 12]) assert.match(sorties, new RegExp(`^\\| ${code} \\| \\S`, "m"), `la sortie ${code} a sa suite`);
  assert.match(sorties, /^\| 7 \| .*au second refus de suite, l'architecte et `--taire` avec la clé de la PR \(`<n>:<geste>:<règle>:<tête>`, recopiée de sa ligne de `passe`\)/m);
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
    "tant que la passe rend pour la PR la même clé, elle se tait ; un autre geste à jouer, une autre règle ou une autre tête lèvent la sourdine",
    "une erreur de `passe`, qui ne nomme aucune PR : l'architecte, et s'arrêter",
  ]);
  // R6 (troisième tour) : les phrases de R1 et R2 à leur place, la relance dans la puce `VEILLE ARRÊTÉE`, la borne du
  // couple dans « L'état des sessions » (les mutations E1 et E2 les déplaçaient sans qu'aucun banc ne rougisse).
  const texte = lire(`${SKILL}/SKILL.md`);
  exigerA(ligne(texte, "## La veille", "- **`VEILLE ARRÊTÉE sortie <c>`**"), "la puce `VEILLE ARRÊTÉE`", ["quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille avec `--attendre` : sa fin est ce réveil"]);
  exigerA(section(texte, "## L'état des sessions"), "« L'état des sessions »", ["Une session seulement attendue (`rien`, raison `attente`) n'est `couple` que si `get_session` rend les deux champs et que l'un diffère ; un champ absent la laisse `vivante`, et elle ne s'écrit jamais `morte` pour son couple."]);
  exigerA(section(texte, "## Les lignes"), "« Les lignes »", ["Les lignes du Relecteur lui-même à l'architecte ont quatre formes, et aucune autre : « PR <n> : <cause> ; PR tue »"]);
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

test("ticket 94 — `noter` a sa ligne dans la table « À chaque réveil », et `jouer` dit la note de même contenu, entre la pose et le retrait", () => {
  const texte = lire(`${SKILL}/SKILL.md`);
  exigerA(ligne(texte, "## À chaque réveil", "| `noter` |"), "la ligne `noter`", ["`jouer <n>` ; aucune ligne"]);
  exigerA(section(texte, "## À chaque réveil"), "« À chaque réveil »", ["la note de même contenu, entre la pose et le retrait"]);
});

test("ticket 95 — la veille rend ses sourdines (`SOURDINES`), la session la relance avec elles et le journal des veilles, jamais avec sa mémoire ; la puce `VEILLE ARRÊTÉE` lit la ligne qui précède", () => {
  const texte = lire(`${SKILL}/SKILL.md`);
  exigerA(ligne(texte, "## La veille", "- **`VEILLE ARRÊTÉE sortie <c>`**"), "la puce `VEILLE ARRÊTÉE`", ["avec la ligne qui précède `VEILLE ARRÊTÉE`"]);
  assert.ok(!ligne(texte, "## La veille", "- **`VEILLE ARRÊTÉE sortie <c>`**").includes("la dernière ligne du journal"), "la dernière ligne est `SOURDINES`");
  exigerA(section(texte, "## La veille"), "« La veille »", [
    "`SOURDINES <clé>,…`",
    "`SOURDINES aucune`",
    "`cat <scratchpad>/relecteur-veille.log >> <scratchpad>/relecteur-veilles.log`",
    "`grep '^SOURDINES ' <scratchpad>/relecteur-veilles.log | tail -n 1`",
    "jamais avec sa mémoire",
    "`<n>:contrat-illisible:—:*`",
  ]);
  exigerA(ligne(texte, "## À chaque réveil", "| `contrat-illisible` |"), "la ligne `contrat-illisible`", ["`--taire` avec la clé `<n>:contrat-illisible:—:*`"]);
  for (const code of ["| 1 |", "| 2 |"]) exigerA(ligne(texte, "## Les sorties de `passe`, `jouer` et `distribuer`", code), `la ligne ${code}`, ["`--taire` avec la clé de la PR"]);
  assert.ok(!texte.includes("--taire <n>"), "plus aucun `--taire <n>` : une clé, jamais un numéro");
});

test("ticket 96 — `signaler` a sa ligne dans la table « À chaque réveil », « Les lignes » dit la demande modifiée, et l'étape 5 dit qu'une demande ne se modifie jamais", () => {
  const texte = lire(`${SKILL}/SKILL.md`);
  exigerA(ligne(texte, "## À chaque réveil", "| `signaler` |"), "la ligne `signaler`", ["`jouer <n>`, ses lignes, puis `jouer <n>` de nouveau, et son geste"]);
  exigerA(section(texte, "## Les lignes"), "« Les lignes »", ["une demande `À relire` modifiée ne sonne personne d'autre que par la ligne de `signaler`", "ou avec le commentaire du plafond ou la trace de `signaler` : rejoué, il n'en rend aucune"]);
  exigerA(ligne(texte, "## À chaque réveil", "| `signaler` |"), "la ligne `signaler`", ["ou n'a pas la forme d'une demande"]);
  exigerA(section(texte, "## À chaque réveil"), "« À chaque réveil »", ["le rejeu peut renvoyer les lignes du refus une seconde fois : un doublon toléré"]);
  exigerA(ligne(lire("skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md"), "## 5. Session fille : les consignes communes", "5. **Demander la relecture.**"), "l'étape 5", ["la demande ne se modifie jamais ; une erreur (un sha faux) se corrige par une demande neuve"]);
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

test("le gabarit de lancement du Relecteur : une phrase d'ouverture en mots (jamais « / »), puis les lignes « Outils : », « Skills : », « Version : » et la place des consignes du produit", () => {
  const lancement = lire("skills/chaine/architecte/references/lancement.md");
  const relecteur = bloc(lancement, "## Le Relecteur d'un dépôt");
  const capitaine = bloc(lancement, "## Le capitaine d'un dépôt");
  assert.ok(!relecteur[0].startsWith("/"), "create_session refuse un prompt qui commence par « / » (2026-11-23)");
  assert.ok(relecteur[0].startsWith("Tu es le Relecteur du dépôt") && relecteur[0].includes("Ton rôle est le skill relecteur de maj-skills"));
  assert.deepEqual(relecteur.map((l) => l.split(" : ")[0]).slice(1, 4), ["Outils", "Skills", "Version"]);
  assert.ok(relecteur[1].includes("select:mcp__claude-code-remote__send_message,mcp__claude-code-remote__create_session,mcp__claude-code-remote__get_session"));
  // Les lignes « Skills : » et « Version : » sont celles du capitaine, pour ce skill.
  const pour = (ligne) => ligne.replaceAll("fusionner", "relecteur");
  assert.equal(relecteur[2], pour(capitaine.find((l) => l.startsWith("Skills : "))));
  assert.equal(relecteur[3], pour(capitaine.find((l) => l.startsWith("Version : "))));
  assert.equal(relecteur[4], "<les deux lignes des consignes du produit, telles quelles, puis la ligne « Commits : »>");
  exigerDans("skills/chaine/architecte/references/lancement.md", ["`tags` `[\"role:relecteur\"]`", "`effort` `\"medium\"`", "l'inscrit sur la ligne `Relecteurs:` de la carte", "(ligne du chantier, `Capitaines:` ou `Relecteurs:`)"]);
});

test("le prompt d'une session de relecture commence par une phrase en mots (jamais « / »), et porte les consignes du produit telles que lancement.md les donne", () => {
  const texte = lire(`${SKILL}/references/prompt-session.md`);
  const prompt = bloc(texte, "# Le prompt d'une session de relecture");
  assert.ok(!prompt[0].startsWith("/"), "create_session refuse un prompt qui commence par « / » (2026-11-23)");
  assert.ok(prompt[0].startsWith("Tu es la session de relecture de la PR <n>") && prompt[0].includes("Ton rôle est le skill relecture de maj-skills, avec pour arguments le numéro de la PR, le tour et le sommet : <n> <tour> <sommet>"));
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
  exigerDans("skills/chaine/fusionner/references/CONTENU.md", ["## `scripts/verdict.mjs`, `scripts/decision-relecteur.mjs`", "## `scripts/meme-contenu.sh`", "## `scripts/double-relecture.mjs`", "Un refus ne compte jamais moins qu'un refus", "`fichiersNommes`", "la clé `perimetre`", "le geste `perimetre`"]);
});

test("le périmètre figé (ticket 2) : le Relecteur ne lit toujours rien, la machine lit pour lui le périmètre", () => {
  exigerDans(`${SKILL}/SKILL.md`, ["Il ne lit ni le diff, ni les constats, ni le corps d'un verdict", "la machine lit les fichiers du diff et ceux qu'un verdict nomme", "| `etiqueter`, `plafonner`, `perimetre`, `panne`, `illisible` | `jouer <n>`", "le commentaire du plafond, du périmètre (`Périmètre absent` ou `Périmètre dépassé — <fichiers>`", "Le commentaire du périmètre rend ses lignes comme celui du plafond"]);
  exigerDans(`${SKILL}/references/CONTENU.md`, ["la PR de documentation par `revue-exigee.mjs`, le delta par git", "les cas du périmètre"]);
});

test("suite du ticket 66 (ticket 69) — chaque phrase neuve à sa place : `--attendre` et la borne de 9, l'état `couple`, `send_message` en échec, les causes des lignes, une étiquette restée, l'installation à retenter", () => {
  const texte = lire(`${SKILL}/SKILL.md`);
  // R5 : la sortie 9 a la borne de 12, et `--attendre` se dit dans « La veille ».
  exigerA(ligne(texte, "## Les sorties de `passe`, `jouer` et `distribuer`", "| 9 |"), "la ligne de la sortie 9", ["rejouer au réveil suivant ; à la seconde fois de suite, l'architecte, et s'arrêter"]);
  exigerA(section(texte, "## La veille"), "« La veille »", ["`--attendre` : une pause avant la première passe aussi, sous la même borne de 25 minutes"]);
  // A-184 (3) : un geste au premier plan qui renvoie au réveil suivant pendant un réveil fait relancer la veille avec
  // `--attendre`, après `VEILLE GESTE` comme après `VEILLE FINIE`.
  for (const puce of ["- **`VEILLE GESTE`**", "- **`VEILLE FINIE`**"])
    exigerA(ligne(texte, "## La veille", puce), `la puce ${puce}`, ["puis relancer la veille, avec `--attendre` si un geste de ce réveil a rendu une suite « rejouer au réveil suivant »"]);
  // 15 (A-182, point 2) : l'état `couple`, lu pour `reecrire` comme pour une session attendue, remplacé une fois par tour.
  exigerA(section(texte, "## L'état des sessions"), "« L'état des sessions »", [
    '`{ "<session>": "vivante" | "morte" | "plafond" | "couple" }`',
    "`couple` : elle tourne à un autre couple que celui de `faits` (`session_context.model` ne contient pas `faits.modele`, ou `session_context.effort_level` n'est pas `faits.effort`)",
    "`reecrire`, qui réemploie la session, suit cette règle de « Créer ou relancer » : il lui faut les deux champs ; un champ absent, `couple`.",
    "Une session `couple` est remplacée comme une morte, une fois par tour (`remplacer`, cause `couple`).",
  ]);
  exigerA(ligne(texte, "## À chaque réveil", "| `reecrire` |"), "la ligne de `reecrire`", ["sinon (`morte`, `plafond` ou `couple`) `jouer <n> --sessions <fichier>`, qui rend `remplacer`"]);
  exigerA(ligne(texte, "## À chaque réveil", "| `remplacer` |"), "la ligne de `remplacer`", ["cause `couple` : rien de plus, la neuve est au couple de `faits`"]);
  // 16, R4 et C11 : `send_message` en échec, les causes des lignes à l'architecte, une étiquette restée.
  exigerA(section(texte, "## Les lignes"), "« Les lignes »", [
    "`send_message` en échec (une ligne, ou le message de relance) : le rejouer une fois ; encore en échec, une ligne à l'architecte, « PR <n> : send_message en échec vers <session> : <sa dernière ligne non vide> », puis la suite du geste. Une ligne à l'architecte elle-même en échec deux fois : l'écrire dans sa réponse, et s'arrêter.",
    "« <sous-commande> sortie aucune : l'outil l'a arrêtée » pour une commande coupée sans code",
    "« create_session en échec : <sa dernière ligne non vide> »",
    "Une étiquette déjà là, posée avant la marque la plus récente de la PR (restée d'un tour d'avant, que l'auteur n'a pas retirée), n'est pas un passage rejoué : ses lignes partent.",
  ]);
  // 17 : comment l'installation se retente.
  exigerA(section(texte, "## Mise en place (une fois par session)"), "« Mise en place »", ["Une installation en échec ne se retente qu'au lockfile suivant de develop, ou dans un Relecteur neuf (son dossier est neuf) : la cause « dépendances de develop » le dit à l'architecte."]);
  assert.ok(!texte.includes("ont trois formes"), "les lignes à l'architecte ont quatre formes");
});

test("contre-relecture de la PR 147 — les quatre formes des lignes à l'architecte, chacune dans leur phrase, et aucune autre ; la borne de 12 et d'une sortie hors de la table, à leur ligne", () => {
  const texte = lire(`${SKILL}/SKILL.md`);
  // A-183, point 4 : la liste elle-même, pas seulement son début ni la quatrième forme écrite ailleurs dans la section.
  const phrase = ligne(texte, "## Les lignes", "Les lignes du Relecteur lui-même à l'architecte ont quatre formes, et aucune autre : ");
  const formes = phrase.slice(0, phrase.indexOf(" La `<cause>`"));
  exigerA(formes, "la phrase des quatre formes", [
    "« PR <n> : <cause> ; PR tue » quand il fait taire une PR",
    "« Relecteur arrêté : <cause> » quand il s'arrête",
    "« PR <n> : session <id> orpheline, à archiver »",
    "« PR <n> : send_message en échec vers <session> : <sa dernière ligne non vide> », une ligne perdue",
  ]);
  assert.equal(formes.split("« ").length - 1, 4, "quatre formes, et aucune autre");
  // R5 s'appuie sur « la seconde fois » de 12 et d'une sortie hors de la table : chacune à sa ligne, comme celle de 9.
  const sorties = "## Les sorties de `passe`, `jouer` et `distribuer`";
  for (const debut of ["| 9 |", "| 12 |", "| autre, ou aucune (l'outil a arrêté la commande) |"])
    exigerA(ligne(texte, sorties, debut), `la ligne ${debut}`, ["rejouer au réveil suivant ; à la seconde fois de suite, l'architecte, et s'arrêter"]);
});

test("suites de la PR 147 et du lot 5 (ticket 77) — la borne de la sortie 5 de `jouer`, « rejouer au réveil suivant » partout où le réveil suivant rejoue, « de suite », `reecrire` qui peut rendre `panne`, un champ absent, le plafond rejoué, la sortie 69 des calculs", () => {
  const texte = lire(`${SKILL}/SKILL.md`);
  const sorties = "## Les sorties de `passe`, `jouer` et `distribuer`";
  // A-189, point 2 : la sortie 5 a sa borne, comme la sortie 7, et sa suite se lit « rejouer au réveil suivant » (ce que
  // `--attendre` suit) ; la sortie 7 et toutes les bornes disent « de suite » (A-189, point 3).
  exigerA(ligne(texte, sorties, "| 5 |"), "la ligne de la sortie 5", ["GitHub n'a pas répondu : rejouer au réveil suivant ; `jouer <n>` sorti en 5 pour la seconde fois de suite sur la même PR : l'architecte, et `--taire` avec la clé de la PR (`<n>:<geste>:<règle>:<tête>`, recopiée de sa ligne de `passe`)"]);
  exigerA(ligne(texte, sorties, "| 7 |"), "la ligne de la sortie 7", ["la rejouer au réveil suivant ; au second refus de suite, l'architecte et `--taire` avec la clé de la PR (`<n>:<geste>:<règle>:<tête>`, recopiée de sa ligne de `passe`)"]);
  // A-192, point 1 : la sortie 69 d'un calcul arrête le Relecteur (sortie 6), comme des calculs absents.
  exigerA(ligne(texte, sorties, "| 6 |"), "la ligne de la sortie 6", ["un calcul dit qu'un outil de la chaîne manque au poste (sa sortie 69 : git plus ancien que 2.41, `jq` absent, la grammaire des identifiants introuvable)", ": l'architecte, et s'arrêter"]);
  assert.ok(!texte.includes("à la seconde fois,"), "chaque borne dit « de suite »");
  // Décision 2 du ticket 77 : la phrase de `--attendre` dit aussi « de suite » (une pause de quelques secondes compterait
  // sinon pour la seconde fois de suite) ; la recherche de « à la seconde fois, » ne la lit pas.
  exigerA(section(texte, "## La veille"), "« La veille »", ["se rejouerait aussitôt et compterait pour la seconde fois de suite."]);
  assert.ok(!texte.includes("le réveil suivant rejoue"), "la sortie 5 : « rejouer au réveil suivant »");
  exigerA(section(texte, "## Créer ou relancer les sessions"), "« Créer ou relancer les sessions »", ["`create_session` en échec pour une autre cause : rejouer au réveil suivant ; à la seconde fois de suite, l'architecte, et `--taire` avec la clé de la PR (`<n>:<geste>:<règle>:<tête>`, recopiée de sa ligne de `passe`)."]);
  // A-189, point 3 : `reecrire` d'une session hors service peut rendre `panne`, dont les lignes partent.
  exigerA(ligne(texte, "## À chaque réveil", "| `reecrire` |"), "la ligne de `reecrire`", ["`jouer <n> --sessions <fichier>`, qui rend `remplacer`, ou `panne` (une session déjà remplacée dans ce tour) : ses lignes (« Les lignes »)"]);
  exigerA(section(texte, "## L'état des sessions"), "« L'état des sessions »", ["il lui faut les deux champs ; un champ absent, `couple`."]);
  assert.ok(!texte.includes("sans les deux champs"), "« sans les deux champs » se lisait aussi « si les deux manquent »");
  // A-189, point 1 : le plafond rejoué après un retrait refusé redit « décision de plafond attendue », et c'est voulu.
  exigerA(section(texte, "## Les lignes"), "« Les lignes »", ["Une exception, voulue : rejoué après un retrait refusé, un plafond redit « décision de plafond attendue » à l'auteur et au conducteur (son étiquette s'est posée avant son commentaire) ; ces lignes partent comme les autres."]);
  // La veille relancée avec `--attendre` sur toute suite « rejouer au réveil suivant » : la sortie 5 en est une.
  for (const puce of ["- **`VEILLE GESTE`**", "- **`VEILLE FINIE`**"])
    exigerA(ligne(texte, "## La veille", puce), `la puce ${puce}`, ["avec `--attendre` si un geste de ce réveil a rendu une suite « rejouer au réveil suivant »"]);
});

test("ticket 97 — un Relecteur s'arrête par l'archivage de sa session, jamais par interrupt_session ni par un message (A-229, A-231, A-232)", () => {
  const skill = lire(`${SKILL}/SKILL.md`);
  assert.ok(skill.split("\n").length <= 200, "SKILL.md : 200 lignes au plus");
  const arreter = ligne(skill, "## Qui le lance", "- **L'arrêter**");
  exigerA(arreter, "« L'arrêter »", [
    "`archive_session`",
    "l'architecte du dépôt",
    "sans question au produit",
    "son coût relevé",
    "ses réveils supprimés",
    "sans architecte en vie, le produit",
    "`interrupt_session` n'arrête pas sa veille",
    "un message ne l'arrête pas",
    "`TaskStop`",
    "« Relecteur arrêté : <cause> »",
  ]);
  exigerA(section(skill, "## Ne jamais"), "« Ne jamais »", ["un ordre de s'arrêter compris : seul l'archivage l'arrête"]);
  exigerA(ligne(skill, "## Qui le lance", "- **Un Relecteur par dépôt.**"), "« Un Relecteur par dépôt »", ["l'architecte archive l'ancien d'abord (« L'arrêter »)"]);

  const lancement = lire("skills/chaine/architecte/references/lancement.md");
  const archiver = ligne(lancement, "## Après le lancement", "- **Archiver un Relecteur**");
  exigerA(archiver, "« Archiver un Relecteur »", ["`list_triggers`", "`persistent_session_id`", "`delete_trigger`", "`archive_session`", "`get_session`", "sans question au produit", "`A-232`"]);
  assert.ok(archiver.indexOf("`archive_session`") < archiver.indexOf("lancer le neuf"), "archiver, puis lancer le neuf");
  assert.ok(archiver.indexOf("`get_session`") < archiver.indexOf("lancer le neuf"), "lire l'archivage, puis lancer le neuf");
  const relecteurDepot = section(lancement, "## Le Relecteur d'un dépôt");
  exigerA(relecteurDepot, "« Le Relecteur d'un dépôt »", ["« Archiver un Relecteur » d'abord", "Relecteur <id> à archiver : <raison>", "n'en lance pas de neuf avant que `get_session` le dise archivé"]);

  const architecte = lire("skills/chaine/architecte/SKILL.md");
  const archiverArchi = architecte.split("\n").find((l) => l.startsWith("**Archiver**"));
  assert.ok(archiverArchi, "« Archiver » attendu");
  exigerA(archiverArchi, "architecte « Archiver »", ["Le Relecteur n'est jamais `completed`", "sans question au produit", "« Archiver un Relecteur »"]);
  assert.ok(architecte.includes("« Archiver un Relecteur »"), "architecte/SKILL.md renvoie à « Archiver un Relecteur »");

  assert.match(lire(`${SKILL}/references/CONTENU.md`), /`A-229`[^\n]*`interrupt_session`/);

  // interrupt_session sous skills/ : la ligne des filles du chantier, la puce « L'arrêter », la raison d'A-229, rien d'autre.
  const trouves = [];
  const parcourir = (dossier) => {
    for (const e of readdirSync(join(RACINE, dossier), { withFileTypes: true })) {
      const chemin = `${dossier}/${e.name}`;
      if (e.isDirectory()) { if (e.name !== "node_modules") parcourir(chemin); continue; }
      if (!/\.(md|mjs|sh|json)$/.test(e.name)) continue;
      lire(chemin).split("\n").forEach((l) => { if (l.includes("interrupt_session")) trouves.push([chemin, l]); });
    }
  };
  parcourir("skills");
  assert.deepEqual(trouves.map(([c]) => c).sort(), [
    "skills/chaine/chantier/SKILL.md",
    "skills/chaine/relecteur/SKILL.md",
    "skills/chaine/relecteur/references/CONTENU.md",
  ]);
  for (const [c, l] of trouves) {
    if (c.endsWith("chantier/SKILL.md")) assert.ok(l.startsWith("2. **Interrompre les filles**"), "chantier : la ligne des filles");
    if (c.endsWith("relecteur/SKILL.md")) assert.ok(l.includes("n'arrête pas sa veille"), "relecteur : la puce « L'arrêter »");
  }
});
