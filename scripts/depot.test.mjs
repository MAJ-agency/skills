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

// Le contrôle automatique d'une PR : `.github/workflows/ci.yml` joue les bancs du dépôt.
// Les lecteurs ci-dessous sont des fonctions pures, éprouvées sur des entrées piégées
// (CRLF, dernière ligne sans fin de ligne, variante voisine qui ne doit pas correspondre).
const CI = ".github/workflows/ci.yml";
const RECOPIE = ".github/workflows/recopier-skills.yml";
const workflow = () => readFileSync(join(RACINE, CI), "utf8");
const workflows = () =>
  readdirSync(join(RACINE, ".github/workflows"))
    .filter((f) => /\.ya?ml$/.test(f))
    .sort()
    .map((f) => [`.github/workflows/${f}`, readFileSync(join(RACINE, ".github/workflows", f), "utf8")]);
const lignes = (w) => w.split(/\r?\n/);

// Les lignes d'un `run:` qui portent une expression : la ligne de la clé, et le corps d'un bloc (`|`, `>`),
// c'est-à-dire les lignes plus indentées que la clé, jusqu'au retour à son indentation.
const runAvecExpression = (w) => {
  const l = lignes(w);
  const trouvees = [];
  for (let i = 0; i < l.length; i++) {
    const m = l[i].match(/^(\s*)(?:-\s+)?run:(.*)$/);
    if (!m) continue;
    if (l[i].includes("${{")) trouvees.push(l[i]);
    if (!/^\s*[|>][+-]?\s*(#.*)?$/.test(m[2])) continue;
    const indentCle = l[i].match(/^\s*/)[0].length + (/^\s*-\s+/.test(l[i]) ? l[i].match(/^\s*-\s+/)[0].length - l[i].match(/^\s*/)[0].length : 0);
    for (let j = i + 1; j < l.length; j++) {
      if (l[j].trim() !== "" && l[j].match(/^\s*/)[0].length <= indentCle) break;
      if (l[j].includes("${{")) trouvees.push(l[j]);
    }
  }
  return trouvees;
};
const actionsMalEpinglees = (w) =>
  [...w.matchAll(/^[ \t]*(?:-[ \t]+)?uses:[ \t]*(\S+)([^\r\n]*)$/gm)]
    .filter(([, ref, reste]) => !/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/.test(ref) || !/#\s*v\d/.test(reste))
    .map(([, ref]) => ref);
const nombreActions = (w) => [...w.matchAll(/^[ \t]*(?:-[ \t]+)?uses:/gm)].length;
const commande = (w, c) => lignes(w).some((l) => l.trim() === `- run: ${c}`);
const surPrVersMain = (w) => /^on:\s*\r?\n\s+pull_request:\s*\r?\n\s+branches:\s*\[\s*'main'\s*\]/m.test(w);
const aLigne = (w, re) => lignes(w).some((l) => re.test(l));

const SHA = "a".repeat(40);

test("lecteurs du workflow : entrées piégées", () => {
  // run: avec expression, CRLF et dernière ligne sans fin de ligne
  assert.equal(runAvecExpression("      - run: echo ${{ github.sha }}").length, 1);
  assert.equal(runAvecExpression("      - run: echo ok\r\n      - run: echo ${{ x }}\r\n").length, 1);
  assert.equal(runAvecExpression("      - run: pnpm test\r\n      - name: ${{ x }}").length, 0);
  // corps d'un bloc : `|` et `>`, CRLF, fin de bloc au retour à l'indentation de la clé
  assert.equal(runAvecExpression("      - run: |\n          echo ${{ x }}\n").length, 1);
  assert.equal(runAvecExpression("      - run: >\r\n          echo a\r\n          ${{ x }}").length, 1);
  assert.equal(runAvecExpression("        run: |-\n          echo ${{ x }}\n          echo ${{ y }}").length, 2);
  assert.equal(runAvecExpression("      - run: |\n          echo ok\n        env:\n          A: ${{ x }}").length, 0);
  assert.equal(runAvecExpression("      - run: |\n          echo ok\n      - name: ${{ x }}").length, 0);
  assert.equal(runAvecExpression("        run: |\n          echo ok\n\n          echo ${{ x }}").length, 1);
  // empreinte : 39 et 41 caractères refusés, 40 acceptée, commentaire de version obligatoire
  assert.deepEqual(actionsMalEpinglees(`- uses: a/b@${SHA} # v1.0.0\r\n- uses: c/d@${SHA} # v2`), []);
  assert.deepEqual(actionsMalEpinglees(`- uses: a/b@${SHA.slice(1)} # v1`), ["a/b@" + SHA.slice(1)]);
  assert.deepEqual(actionsMalEpinglees(`- uses: a/b@${SHA}a # v1`), ["a/b@" + SHA + "a"]);
  assert.deepEqual(actionsMalEpinglees(`- uses: a/b@${SHA}`), ["a/b@" + SHA]);
  assert.deepEqual(actionsMalEpinglees("- uses: a/b@v4 # v4"), ["a/b@v4"]);
  assert.equal(nombreActions(`- uses: a/b@${SHA} # v1`), 1);
  // commande exacte : `pnpm test:watch` n'est pas `pnpm test`
  assert.equal(commande("      - run: pnpm test\r\n", "pnpm test"), true);
  assert.equal(commande("      - run: pnpm test", "pnpm test"), true);
  assert.equal(commande("      - run: pnpm test:watch", "pnpm test"), false);
  // déclencheur
  const on = "on:\n  pull_request:\n    branches: ['main']\n";
  assert.equal(surPrVersMain(on), true);
  assert.equal(surPrVersMain(on.replace(/\n/g, "\r\n")), true);
  assert.equal(surPrVersMain("on:\n  pull_request:\n    branches: ['main2']\n"), false);
  assert.equal(surPrVersMain("on:\n  push:\n    branches: ['main']\n"), false);
  assert.equal(aLigne("on:\r\n  pull_request:\r\n    types: [opened]", /^\s+types:/), true);
  assert.equal(aLigne("      - run: pnpm test", /^\s+types:/), false);
});

test("aucun workflow n'écrit d'expression dans un `run:`", () => {
  for (const [f, w] of workflows()) {
    const fautives = runAvecExpression(w);
    assert.deepEqual(fautives, [], `${f} : expression dans un run: — passer par env: ${fautives.join(" ; ")}`);
  }
});

test("aucun workflow n'utilise que des actions épinglées par empreinte", () => {
  for (const [f, w] of workflows()) {
    assert.ok(nombreActions(w) > 0, `${f} : aucune action trouvée`);
    const mal = actionsMalEpinglees(w);
    assert.deepEqual(mal, [], `${f} : action non épinglée par une empreinte de 40 caractères avec sa version en commentaire : ${mal.join(" ; ")}`);
  }
});

test("le workflow de contrôle se lance sur toute PR vers main et joue pnpm test", () => {
  const w = workflow();
  assert.ok(surPrVersMain(w), `${CI} : déclencheur pull_request vers main attendu`);
  assert.ok(!aLigne(w, /^\s+types:/), `${CI} : pas de filtre types: (brouillons compris)`);
  assert.ok(!aLigne(w, /^\s+push:/), `${CI} : pas de déclencheur push`);
  assert.ok(commande(w, "pnpm install --frozen-lockfile"), `${CI} : installation figée attendue`);
  assert.ok(commande(w, "pnpm test"), `${CI} : pnpm test attendu`);
});

// Le workflow de recopie : deux déclencheurs, jeton en lecture seule, secret lu d'une seule façon.
const declencheurs = (w) => [...w.matchAll(/^  ([\w_]+):/gm)].map((m) => m[1]).filter((k) => ["push", "pull_request", "pull_request_target", "workflow_dispatch", "schedule"].includes(k));
const filtreChemin = (w) => /^on:\s*\r?\n(?:.*\r?\n)*?\s+paths:\s*\[\s*'\.claude-plugin\/plugin\.json'\s*\]/m.test(w);
const permissionsLectureSeule = (w) => /^permissions:\s*\r?\n\s+contents:[ \t]*read[ \t]*(?:\r?\n(?![ \t])|(?![\s\S]))/m.test(w);
const lignesSecret = (w) => lignes(w).filter((l) => l.includes("secrets."));
const lignesSecretMalFormees = (w) => lignesSecret(w).filter((l) => !/^\s*(?:-\s+)?[\w-]+:\s*\$\{\{\s*secrets\.RECOPIE_TOKEN\s*\}\}\s*$/.test(l));

test("lecteurs du workflow de recopie : entrées piégées", () => {
  assert.deepEqual(declencheurs("on:\r\n  push:\r\n    branches: ['main']\r\n  workflow_dispatch:\r\n"), ["push", "workflow_dispatch"]);
  assert.deepEqual(declencheurs("on:\n  pull_request:\n  workflow_dispatch:"), ["pull_request", "workflow_dispatch"]);
  assert.equal(filtreChemin("on:\n  push:\n    paths: ['.claude-plugin/plugin.json']\n"), true);
  assert.equal(filtreChemin("on:\n  push:\n    paths: ['.claude-plugin/plugin.json', 'x']\n"), false);
  assert.equal(filtreChemin("on:\n  push:\n    paths: ['.claude-plugin/plugin.jsonx']\n"), false);
  assert.equal(permissionsLectureSeule("permissions:\n  contents: read\njobs:\n"), true);
  assert.equal(permissionsLectureSeule("permissions:\r\n  contents: read"), true);
  assert.equal(permissionsLectureSeule("permissions:\n  contents: write\n"), false);
  assert.equal(permissionsLectureSeule("permissions:\n  contents: read\n  pull-requests: write\n"), false);
  assert.deepEqual(lignesSecretMalFormees("          token: ${{ secrets.RECOPIE_TOKEN }}\r\n"), []);
  assert.deepEqual(lignesSecretMalFormees("          RECOPIE_TOKEN: ${{ secrets.RECOPIE_TOKEN }}"), []);
  assert.equal(lignesSecretMalFormees("        run: echo ${{ secrets.RECOPIE_TOKEN }}").length, 1);
  assert.equal(lignesSecretMalFormees("          token: ${{ secrets.AUTRE }}").length, 1);
  assert.equal(lignesSecretMalFormees("          token: ${{ secrets.RECOPIE_TOKEN }} x").length, 1);
});

test("recopier-skills.yml : push sur main limité à plugin.json, workflow_dispatch, jamais pull_request", () => {
  const w = readFileSync(join(RACINE, RECOPIE), "utf8");
  assert.deepEqual(declencheurs(w), ["push", "workflow_dispatch"]);
  assert.ok(filtreChemin(w), `${RECOPIE} : filtre paths: ['.claude-plugin/plugin.json'] attendu`);
  assert.ok(!/pull_request/.test(w.replace(/^\s*#.*$/gm, "")), `${RECOPIE} : aucun pull_request`);
});

test("recopier-skills.yml : le jeton du workflow ne fait que lire", () => {
  const w = readFileSync(join(RACINE, RECOPIE), "utf8");
  assert.ok(permissionsLectureSeule(w), `${RECOPIE} : permissions réduit à contents: read`);
});

test("recopier-skills.yml : le secret n'apparaît que sous la forme `<clé>: ${{ secrets.RECOPIE_TOKEN }}`", () => {
  const w = readFileSync(join(RACINE, RECOPIE), "utf8");
  assert.ok(lignesSecret(w).length > 0, `${RECOPIE} : secret RECOPIE_TOKEN attendu`);
  assert.deepEqual(lignesSecretMalFormees(w), []);
});

// La carte d'un programme : son gabarit porte les sections de la carte de chantier qu'elle partage,
// plus la passation, et n'est pas une carte de chantier (aucune ligne `Sujet:`).
const PROGRAMME = "skills/chaine/tickets/references/gabarits/programme.md";
const SECTIONS_PROGRAMME = ["## Fiche", "## Chantiers", "## Decisions-so-far", "## Fog", "## Coût", "## Passation", "## Journal"];
const titres = (texte) => lignes(texte).filter((l) => /^## /.test(l)).map((l) => l.trimEnd());
const lignesSujet = (texte) => lignes(texte).filter((l) => /^\s*Sujet:/.test(l));
// Le corps d'une section `## <titre>` exacte, jusqu'à la section suivante ; "" si elle manque.
const section = (texte, titre) => {
  const l = lignes(texte);
  const debut = l.findIndex((x) => x.trimEnd() === `## ${titre}`);
  if (debut < 0) return "";
  const fin = l.findIndex((x, i) => i > debut && /^## /.test(x));
  return l.slice(debut + 1, fin < 0 ? undefined : fin).join("\n");
};

test("lecteurs du gabarit de programme : entrées piégées", () => {
  assert.deepEqual(titres("## Fiche\r\n### Sous\r\n## Coût \r\n# Titre"), ["## Fiche", "## Coût"]);
  assert.equal(lignesSujet("Sujet: sujet/x\r\n").length, 1);
  assert.equal(lignesSujet("pas de ligne `Sujet:` ici").length, 0);
  assert.equal(section("# T\n\n## Fiche\n\nArchitecte: x\n\n## Chantiers\n", "Fiche"), "\nArchitecte: x\n");
  assert.equal(section("# T\r\n\r\n## Fiche \r\nArchitecte: x\r\n## Chantiers\r\n", "Fiche"), "Architecte: x", "CRLF");
  assert.equal(section("## Coût\n| Rôle |", "Coût"), "| Rôle |", "dernière ligne sans fin de ligne");
  assert.equal(section("## Fiches\nArchitecte: x\n", "Fiche"), "", "variante voisine");
  assert.equal(section("## Coûts\n| Rôle |\n", "Coût"), "", "variante voisine");
  assert.equal(section("# T\n\n## Chantiers\n", "Fiche"), "");
});

test("le gabarit de programme porte ses sections et aucune ligne `Sujet:`", () => {
  const texte = readFileSync(join(RACINE, PROGRAMME), "utf8");
  assert.deepEqual(titres(texte), SECTIONS_PROGRAMME, `${PROGRAMME} : sections attendues, dans l'ordre`);
  assert.deepEqual(lignesSujet(texte), [], `${PROGRAMME} : une carte de programme n'a pas de ligne Sujet:`);
  for (const ligne of ["Phase:", "Responsable:", "Architecte:"]) {
    assert.ok(lignes(section(texte, "Fiche")).some((l) => l.startsWith(ligne)), `${PROGRAMME} : la fiche porte ${ligne}`);
  }
  const cout = section(texte, "Coût");
  assert.ok(cout.includes("| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |"), `${PROGRAMME} : en-tête du coût de la carte de chantier`);
  assert.ok(!PROGRAMME.endsWith(".map.md"), "un gabarit de programme n'est pas lu par le gate des cartes de chantier");
});

// La carte de chantier : son gabarit porte la ligne `Gel:` (vide) dans la fiche et la section `## Journal`
// où le conducteur écrit ses arrêts ; le gate des cartes n'exige ni l'une ni l'autre.
const CARTE = "skills/chaine/tickets/references/gabarits/carte.map.md";
test("le gabarit de la carte de chantier porte `Gel:` dans sa fiche et la section `## Journal`", () => {
  const texte = readFileSync(join(RACINE, CARTE), "utf8");
  assert.ok(lignes(section(texte, "Fiche")).includes("Gel:"), `${CARTE} : la fiche porte la ligne Gel: vide`);
  assert.ok(titres(texte).includes("## Journal"), `${CARTE} : section ## Journal`);
});
