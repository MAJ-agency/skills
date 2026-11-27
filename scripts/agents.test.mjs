// Banc des définitions de sous-agents du plugin (programme « définitions d'agents », décisions A-1 à A-12 de
// docs/issues/definitions-d-agents/definitions-d-agents.spec.md, ticket 1). Une définition est un fichier de `agents/`
// que Claude Code charge au démarrage d'une session : son frontmatter fixe les outils, le modèle et le contexte du
// sous-agent. Ce banc tient chaque définition (ses clés, exactement, dans l'ordre), la liste `agents` de
// `.claude-plugin/plugin.json` (chaque fichier listé, et inversement), chaque nom `maj-skills:<nom>` cité sous
// `skills/` (une définition ou un skill déclaré), les skills qui lancent une définition (son nom et la phrase du
// repli), les cinq prompts de `relecture` (la lecture des règles d'abord, A-11) et le terme du glossaire (A-12).
// Les textes sont lus à plat (blancs et sauts de ligne réduits à une espace) là où une phrase peut changer de ligne.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const lire = (chemin) => readFileSync(join(RACINE, chemin), "utf8");
const plat = (t) => t.replace(/\s+/g, " ");
const PLUGIN = JSON.parse(lire(".claude-plugin/plugin.json"));
const RELECTURE = "skills/chaine/relecture";
const CRITICITE = "skills/chaine/criticite";
const PROMPTS = ["prompt-regles.md", "prompt-ticket.md", "prompt-documentation.md", "prompt-tickets.md", "prompt-regles-metier.md"];

// Ce que chaque définition fixe (A-1, A-2, A-3) : ses outils, mot pour mot, et ce que sa description nomme.
const ATTENDUES = {
  "axe-de-relecture": { tools: "Read, Grep, Glob", nomme: ["relecture", "revue-de-ticket", "revue-adversariale", "l'architecte", "régime 7"] },
  "classeur-de-criticite": { tools: "[]", nomme: ["criticite"] },
};
const CLES = ["name", "description", "tools", "model", "omitClaudeMd"];
const CORPS = "Ta mission, ta liste fermée et ton format de sortie sont dans ton message ; tu ne rends que ce qu'il demande.";
// Le noyau de la phrase du repli (A-6), le même dans chaque skill qui lance une définition.
const REPLI = "relance le même message, entier, par l'agent générique";
// La phrase de A-11, la même dans les cinq prompts de `relecture`.
const REGLES_DABORD =
  "Ces règles ne sont pas dans ton contexte : avant de juger, tu lis d'abord, dans {{BASE}}, le CLAUDE.md de la racine, celui de chaque dossier que le diff touche et de ses dossiers parents, et les fiches .claude/rules/*.md.";

/**
 * Le frontmatter d'une définition, lu ligne à ligne : `---`, des lignes `clé: valeur` sur une seule ligne, `---`.
 * Rend `{ cles, valeurs, corps }`, ou `{ erreur }` pour un frontmatter absent ou non fermé, une ligne qui n'est pas
 * `clé: valeur` (une liste sur plusieurs lignes, une valeur pliée), ou une clé en double.
 */
const lireDefinition = (texte) => {
  const lignes = texte.split(/\r?\n/);
  if (lignes[0] !== "---") return { erreur: "pas de frontmatter en première ligne" };
  const fin = lignes.indexOf("---", 1);
  if (fin === -1) return { erreur: "frontmatter non fermé" };
  const cles = [];
  const valeurs = {};
  for (const ligne of lignes.slice(1, fin)) {
    const m = ligne.match(/^([A-Za-z]+): (\S.*)$/);
    if (!m) return { erreur: `ligne hors de la forme « clé: valeur » : « ${ligne} »` };
    if (m[1] in valeurs) return { erreur: `clé en double : ${m[1]}` };
    cles.push(m[1]);
    valeurs[m[1]] = m[2];
  }
  return { cles, valeurs, corps: lignes.slice(fin + 1).join("\n") };
};

/** Les écarts d'une définition à ce que la spec fixe pour elle ; une liste vide quand elle est juste. */
const ecarts = (nom, texte) => {
  const d = lireDefinition(texte);
  if (d.erreur) return [d.erreur];
  const attendue = ATTENDUES[nom];
  if (!attendue) return [`${nom} : aucune définition attendue sous ce nom`];
  const e = [];
  if (d.cles.join(",") !== CLES.join(",")) e.push(`clés ${d.cles.join(", ")} au lieu de ${CLES.join(", ")}, dans cet ordre`);
  if (d.valeurs.name !== nom) e.push(`name « ${d.valeurs.name} » au lieu du nom du fichier, « ${nom} »`);
  if (d.valeurs.tools !== attendue.tools) e.push(`tools « ${d.valeurs.tools} » au lieu de « ${attendue.tools} »`);
  if (d.valeurs.model !== "opus") e.push(`model « ${d.valeurs.model} » au lieu de « opus »`);
  if (d.valeurs.omitClaudeMd !== "true") e.push(`omitClaudeMd « ${d.valeurs.omitClaudeMd} » au lieu de « true »`);
  const description = d.valeurs.description ?? "";
  if (description.length > 1024) e.push(`description de ${description.length} caractères`);
  if (description.includes(": ")) e.push("la description porte « : » suivi d'une espace (YAML non cité)");
  if (!description.includes("jamais de lui-même")) e.push("la description ne dit pas « jamais de lui-même »");
  for (const mot of attendue.nomme) if (!description.includes(mot)) e.push(`la description ne nomme pas « ${mot} »`);
  if (!plat(d.corps).includes(CORPS)) e.push(`le corps ne porte pas « ${CORPS} »`);
  return e;
};

const fichiersDefinitions = () =>
  readdirSync(join(RACINE, "agents"))
    .filter((n) => n.endsWith(".md"))
    .sort();

const AXE = lire("agents/axe-de-relecture.md");

test("lecteur du banc : entrées piégées", () => {
  assert.deepEqual(ecarts("axe-de-relecture", AXE), [], "la définition réelle passe");
  assert.match(lireDefinition("---\nname: a\nname: b\n---\n").erreur, /clé en double : name/);
  assert.match(lireDefinition("---\nname: a\ntools:\n  - Read\n---\n").erreur, /hors de la forme/, "un `tools` sur deux lignes");
  assert.match(lireDefinition("---\nname: a\ndescription: b\n").erreur, /non fermé/);
  assert.match(lireDefinition("name: a\n---\n").erreur, /première ligne/);
  assert.match(lireDefinition("---\r\nname: a\r\nname: b\r\n---\r\n").erreur, /clé en double/, "CRLF");
  const piege = (de, vers) => {
    const t = AXE.replace(de, vers);
    assert.notEqual(t, AXE, `le piège « ${vers.trim()} » s'applique`);
    return ecarts("axe-de-relecture", t);
  };
  assert.ok(piege("le relecteur de revue-adversariale", "le relecteur de revue-adversariale : un piège").some((x) => x.includes("« : »")), "une description qui porte « : »");
  assert.ok(piege("tools: Read, Grep, Glob", "tools: Read, Grep, Glob, Bash").some((x) => x.startsWith("tools")), "un `tools` changé");
  assert.ok(piege("model: opus", "model: sonnet").some((x) => x.startsWith("model")), "un `model` changé");
  assert.ok(piege("omitClaudeMd: true\n", "omitClaudeMd: true\npermissionMode: plan\n").some((x) => x.startsWith("clés")), "une clé de plus");
  assert.ok(piege("omitClaudeMd: true\n", "").some((x) => x.startsWith("clés")), "`omitClaudeMd` retiré");
  assert.ok(piege("jamais de lui-même", "de lui-même").some((x) => x.includes("jamais de lui-même")), "la description sans « jamais de lui-même »");
  assert.ok(piege("name: axe-de-relecture", "name: axe").some((x) => x.startsWith("name")), "un `name` qui n'est pas le nom du fichier");
  assert.ok(piege("régime 7", "régime sept").some((x) => x.includes("régime 7")), "un usage retiré de la description");
});

test("chaque définition de agents/ fixe ses outils, Opus et un contexte sans les consignes du projet, avec une description qui interdit la délégation spontanée (A-1 à A-5)", () => {
  const fichiers = fichiersDefinitions();
  assert.deepEqual(fichiers, Object.keys(ATTENDUES).map((n) => `${n}.md`).sort(), "agents/ : les deux définitions, et elles seules");
  for (const f of fichiers) assert.deepEqual(ecarts(f.replace(/\.md$/, ""), lire(`agents/${f}`)), [], `agents/${f}`);
});

test("la liste agents de plugin.json : chaque fichier de agents/ listé, et inversement, juste après skills (A-1)", () => {
  const liste = PLUGIN.agents;
  assert.ok(Array.isArray(liste), "plugin.json : une liste `agents`");
  assert.deepEqual([...liste].sort(), fichiersDefinitions().map((f) => `./agents/${f}`), "chaque fichier de agents/ est listé, et chaque entrée est un fichier de agents/");
  assert.equal(new Set(liste).size, liste.length, "entrée listée deux fois");
  for (const chemin of liste) assert.ok(existsSync(join(RACINE, chemin)), `${chemin} existe`);
  const cles = Object.keys(PLUGIN);
  assert.equal(cles.indexOf("agents"), cles.indexOf("skills") + 1, "plugin.json : `agents` juste après `skills`");
});

test("chaque maj-skills:<nom> cité sous skills/ désigne une définition de agents/ ou un skill déclaré", () => {
  const definitions = new Set(fichiersDefinitions().map((f) => f.replace(/\.md$/, "")));
  const skills = new Set(PLUGIN.skills.map((s) => s.split("/").pop()));
  for (const nom of definitions) assert.ok(!skills.has(nom), `${nom} : une définition et un skill du même nom`);
  const inconnus = [];
  const parcourir = (dossier) => {
    for (const e of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, e.name);
      if (e.isDirectory()) parcourir(chemin);
      else if (e.isFile())
        for (const m of readFileSync(chemin, "utf8").matchAll(/maj-skills:([a-z0-9][a-z0-9-]*)/g))
          if (!definitions.has(m[1]) && !skills.has(m[1])) inconnus.push(`${relative(RACINE, chemin)} : maj-skills:${m[1]}`);
    }
  };
  parcourir(join(RACINE, "skills"));
  assert.deepEqual(inconnus, [], "noms qui ne sont ni une définition ni un skill déclaré");
});

test("relecture lance chaque axe par maj-skills:axe-de-relecture, avec le repli et sa ligne du verdict ; les cinq prompts font lire les règles d'abord (A-6, A-11)", () => {
  const etape6 = lire(`${RELECTURE}/SKILL.md`).split(/^## /m).find((s) => s.startsWith("Étape 6 "));
  assert.ok(etape6, "relecture/SKILL.md : la section « Étape 6 »");
  for (const phrase of [
    "Outil **Agent**, agent `maj-skills:axe-de-relecture` (paramètre `subagent_type`), sans paramètre `model`",
    "chaque lancement essaie ce nom, le second sous-agent compris",
    "Si l'outil répond « Agent type 'maj-skills:axe-de-relecture' not found »",
    REPLI,
    "ce repli n'est pas un échec de l'outil : l'axe est joué",
  ])
    assert.ok(plat(etape6).includes(phrase), `relecture/SKILL.md, étape 6 : « ${phrase} »`);
  const verdict = lire(`${RELECTURE}/references/verdict.md`);
  assert.ok(verdict.includes("\nAgent des axes : <maj-skills:axe-de-relecture | agent générique, maj-skills:axe-de-relecture introuvable dans cette session (repli) | sans objet>\n"), "verdict.md : la ligne « Agent des axes : » du gabarit");
  for (const f of [`${RELECTURE}/references/cas-limites.md`, `${RELECTURE}/references/CONTENU.md`, `${CRITICITE}/references/CONTENU.md`])
    assert.ok(plat(lire(f)).includes(REPLI), `${f} : le noyau du repli, « ${REPLI} »`);
  assert.ok(plat(lire(`${RELECTURE}/references/cas-limites.md`)).includes("| 6 | L'outil Agent répond « Agent type 'maj-skills:axe-de-relecture' not found »"), "cas-limites.md : la ligne du repli dans la table de l'étape 6");
  for (const p of PROMPTS) {
    const texte = plat(lire(`${RELECTURE}/references/${p}`));
    assert.ok(texte.includes(REGLES_DABORD), `${p} : les règles lues d'abord (A-11)`);
    // La liste « pour vérifier un point » va jusqu'à « Rien d'autre » ou « tu ne modifies rien » : aucune fiche de règles n'y revient.
    const liste = texte.match(/pour vérifier un point([\s\S]*?)(Rien d'autre|tu ne modifies rien)/i);
    assert.ok(liste, `${p} : la liste « pour vérifier un point »`);
    assert.doesNotMatch(liste[1], /CLAUDE\.md|\.claude\/rules/, `${p} : les fiches de règles hors de la liste « pour vérifier un point »`);
  }
});

test("criticite lance son sous-agent par maj-skills:classeur-de-criticite, avec le repli, et la section Criticité nomme l'agent de chaque sortie brute (A-6)", () => {
  const skill = lire(`${CRITICITE}/SKILL.md`);
  const etape3 = skill.split(/^## /m).find((s) => s.startsWith("Étape 3 "));
  assert.ok(etape3, "criticite/SKILL.md : la section « Étape 3 »");
  for (const phrase of [
    "Outil **Agent**, agent `maj-skills:classeur-de-criticite` (paramètre `subagent_type`), sans paramètre `model`",
    "chaque lancement essaie ce nom, le second sous-agent compris",
    "Si l'outil répond « Agent type 'maj-skills:classeur-de-criticite' not found »",
    REPLI,
    "Le prompt lui dit de n'utiliser aucun outil : tout ce qu'il lui faut est dans son message.",
  ])
    assert.ok(plat(etape3).includes(phrase), `criticite/SKILL.md, étape 3 : « ${phrase} »`);
  const etape4 = skill.split(/^## /m).find((s) => s.startsWith("Étape 4 "));
  assert.ok(plat(etape4 ?? "").includes("chacune précédée de l'agent qui l'a rendue (`maj-skills:classeur-de-criticite`, ou « agent générique (repli) »)"), "criticite/SKILL.md, étape 4 : l'agent de chaque sortie brute");
  assert.ok(plat(lire(`${CRITICITE}/references/prompt.md`)).includes("N'utilise aucun outil"), "criticite/references/prompt.md : la phrase sans outil reste, pour le repli");
});

test("« Agent défini » est au glossaire, juste après « Axe », sa définition sur la ligne qui suit (A-12)", () => {
  const lignes = lire("CONTEXT.md").split(/\r?\n/);
  const i = lignes.indexOf("**Agent défini**:");
  assert.ok(i >= 0, "CONTEXT.md : le terme « Agent défini »");
  const definition = (lignes[i + 1] ?? "").trim();
  assert.ok(definition.length > 20 && !/^(_Avoid_|\*\*)/.test(definition), "sa définition sur la ligne qui suit");
  assert.ok(definition.includes("`maj-skills:<nom>`"), "la définition nomme la forme du nom");
  assert.ok((lignes[i + 2] ?? "").startsWith("_Avoid_:"), "une ligne `_Avoid_:`");
  const axe = lignes.indexOf("**Axe**:");
  assert.ok(axe >= 0 && axe < i && lignes.slice(axe + 1, i).every((l) => !l.startsWith("**")), "juste après « Axe »");
});

// Ticket 2 : les autres relectures de la chaîne (revue-de-ticket, revue-adversariale, l'architecte, le régime 7).
const NOM = "maj-skills:axe-de-relecture";
const REGLES_DU_DEPOT =
  "Ces règles ne sont pas dans ton contexte : avant de juger, tu lis d'abord, dans le dépôt, le CLAUDE.md de la racine, celui de chaque dossier que le diff touche et de ses dossiers parents, et les fiches .claude/rules/*.md.";
const LIGNE_RELECTEURS =
  "- Agent des relecteurs : maj-skills:axe-de-relecture | agent générique, maj-skills:axe-de-relecture introuvable dans cette session (repli)";
const CHAINE = "skills/chaine";
const section = (texte, debut) => texte.split(/^## /m).find((s) => s.startsWith(debut));
const ligne = (texte, marque) => texte.split("\n").find((l) => l.includes(marque));

test("les relectures de revue-de-ticket, revue-adversariale, de l'architecte et du régime 7 se lancent par maj-skills:axe-de-relecture, avec le repli (A-1, A-6, A-8)", () => {
  const ticket = lire(`${CHAINE}/revue-de-ticket/SKILL.md`);
  const adverse = lire(`${CHAINE}/revue-adversariale/SKILL.md`);
  const regime7 = lire(`${CHAINE}/chantier/references/regime-7.md`);
  const cibles = [
    ["revue-de-ticket/SKILL.md, étape 2", section(ticket, "Étape 2 ")],
    ["revue-de-ticket/SKILL.md, étape 4", section(ticket, "Étape 4 ")],
    ["revue-adversariale/SKILL.md, lots", ligne(adverse, "**Diff de plus de 2 000 lignes")],
    ["revue-adversariale/SKILL.md, étape 3", section(adverse, "Étape 3 ")],
    ["revue-adversariale/SKILL.md, étape 5", section(adverse, "Étape 5 ")],
    ["architecte/SKILL.md, § 5", ligne(lire(`${CHAINE}/architecte/SKILL.md`), "Un ticket hors chantier qu'il lance lui-même")],
    ["lancement.md, « contre-relit lui-même »", ligne(lire(`${CHAINE}/architecte/references/lancement.md`), "contre-relit lui-même")],
    ["regime-7.md, contre-revue du conducteur", ligne(regime7, "**La contre-revue du conducteur**")],
    ["regime-7.md, contre-relecture de l'architecte", ligne(regime7, "contre-relit lui-même")],
  ];
  for (const [nom, texte] of cibles) {
    assert.ok(texte, `${nom} : le passage existe`);
    assert.ok(plat(texte).includes(NOM), `${nom} : nomme ${NOM}`);
    assert.ok(plat(texte).includes(REPLI), `${nom} : le noyau du repli, « ${REPLI} »`);
  }
  assert.ok(plat(section(ticket, "Étape 2 ")).includes("sans paramètre `model`"), "revue-de-ticket étape 2 : sans paramètre `model`");
  assert.ok(plat(section(adverse, "Étape 3 ")).includes("sans paramètre `model`"), "revue-adversariale étape 3 : sans paramètre `model`");
});

test("les deux section-pr.md portent la ligne « Agent des relecteurs » juste après « Résultat », et les CONTENU.md disent la définition, la lecture des règles et le repli (A-6, décision 4)", () => {
  for (const f of ["revue-de-ticket", "revue-adversariale"]) {
    const l = lire(`${CHAINE}/${f}/references/section-pr.md`).split("\n");
    const i = l.findIndex((x) => x.startsWith("- Résultat :"));
    assert.ok(i > 0, `${f}/section-pr.md : la ligne « Résultat »`);
    assert.equal(l[i + 1], LIGNE_RELECTEURS, `${f}/section-pr.md : « Agent des relecteurs » juste après « Résultat »`);
    assert.equal(l[i + 2], "", `${f}/section-pr.md : puis la ligne vide et le tableau`);
    assert.ok(!l[i + 1].includes("`/security-review` :"), "la ligne ne se lit pas comme la ligne de /security-review");
    const contenu = plat(lire(`${CHAINE}/${f}/references/CONTENU.md`));
    for (const phrase of [NOM, REPLI, "les règles du projet d'abord"])
      assert.ok(contenu.includes(phrase), `${f}/CONTENU.md : « ${phrase} »`);
  }
  assert.ok(plat(lire(`${CHAINE}/revue-de-ticket/SKILL.md`)).includes("Agent des relecteurs"), "revue-de-ticket/SKILL.md : cite la ligne de la section");
  assert.ok(plat(lire(`${CHAINE}/revue-adversariale/SKILL.md`)).includes("Agent des relecteurs"), "revue-adversariale/SKILL.md : cite la ligne de la section");
});

test("le repli de la contre-relecture de l'architecte, de la contre-revue du conducteur et de la relecture d'un ticket hors chantier s'écrit là où chacune rend son résultat (décision 4)", () => {
  const lancement = plat(ligne(lire(`${CHAINE}/architecte/references/lancement.md`), "contre-relit lui-même"));
  assert.match(lancement, /à la fin du commentaire[^.]*jamais en première ligne/, "lancement.md : la ligne du repli à la fin du verdict, jamais en première ligne");
  assert.ok(lancement.includes("diff-revue.sh") && lancement.includes("n'a pas Bash"), "lancement.md : le diff dans un fichier, l'agent n'a pas Bash (décision 6)");
  assert.ok(lancement.includes("règles du projet d'abord"), "lancement.md : les règles lues d'abord (A-11)");
  const regime7 = lire(`${CHAINE}/chantier/references/regime-7.md`);
  const conducteur = plat(ligne(regime7, "**La contre-revue du conducteur**"));
  assert.ok(conducteur.includes("journal de la carte du chantier"), "regime-7.md : le repli au journal de la carte");
  assert.ok(conducteur.includes("diff-revue.sh") && conducteur.includes("n'a pas Bash"), "regime-7.md : le diff dans un fichier");
  assert.match(plat(ligne(regime7, "contre-relit lui-même")), /à la fin du commentaire[^.]*jamais en première ligne/, "regime-7.md : même règle que lancement.md");
  assert.ok(plat(ligne(lire(`${CHAINE}/architecte/SKILL.md`), "Un ticket hors chantier qu'il lance lui-même")).includes("## Comments"), "architecte/SKILL.md § 5 : le repli noté sous ## Comments du ticket");
});

test("les prompts de revue-adversariale et de revue-de-ticket font lire les règles du projet d'abord, hors de la liste « pour vérifier un point » (A-11)", () => {
  for (const f of ["revue-adversariale/references/prompt.md", "revue-de-ticket/references/prompt-ticket.md", "revue-de-ticket/references/prompt-documentation.md"]) {
    const texte = plat(lire(`${CHAINE}/${f}`));
    assert.ok(texte.includes(REGLES_DU_DEPOT), `${f} : les règles lues d'abord (A-11)`);
    assert.ok(!texte.includes("{{BASE}}"), `${f} : pas de {{BASE}}, le dépôt relu est le répertoire courant`);
    const debut = texte.indexOf("lecture seule");
    const fin = texte.search(/Rien d'autre|tu ne modifies rien/);
    assert.ok(debut >= 0 && fin > debut, `${f} : la liste de lecture`);
    assert.doesNotMatch(texte.slice(debut, fin), /CLAUDE\.md|\.claude\/rules/, `${f} : aucune fiche de règles dans la liste « pour vérifier un point »`);
  }
});
