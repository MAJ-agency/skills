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
const workflow = () => readFileSync(join(RACINE, CI), "utf8");
const lignes = (w) => w.split(/\r?\n/);

const runAvecExpression = (w) => lignes(w).filter((l) => /^\s*(-\s+)?run:/.test(l) && l.includes("${{"));
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
  // empreinte : 39 et 41 caractères refusés, 40 acceptée, commentaire de version obligatoire
  assert.deepEqual(actionsMalEpinglees(`- uses: a/b@${SHA} # v1.0.0\r\n- uses: c/d@${SHA} # v2`), []);
  assert.deepEqual(actionsMalEpinglees(`- uses: a/b@${SHA.slice(1)} # v1`), ["a/b@" + SHA.slice(1)]);
  assert.deepEqual(actionsMalEpinglees(`- uses: a/b@${SHA}a # v1`), ["a/b@" + SHA + "a"]);
  assert.deepEqual(actionsMalEpinglees(`- uses: a/b@${SHA}`), ["a/b@" + SHA]);
  assert.deepEqual(actionsMalEpinglees("- uses: a/b@v4 # v4"), ["a/b@v4"]);
  assert.equal(nombreActions(`- uses: a/b@${SHA} # v1`), 1);
  // commande exacte : `pnpm test:watch` n'est pas `pnpm test`
  assert.equal(commande("      - run: pnpm test\r\n", "pnpm test"), true);
  assert.equal(commande("      - run: pnpm test", "pnpm test"), false);
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

test("le workflow de contrôle n'écrit aucune expression dans un `run:`", () => {
  const fautives = runAvecExpression(workflow());
  assert.deepEqual(fautives, [], `${CI} : expression dans un run: — passer par env: ${fautives.join(" ; ")}`);
});

test("le workflow de contrôle n'utilise que des actions épinglées par empreinte", () => {
  const w = workflow();
  assert.ok(nombreActions(w) > 0, `${CI} : aucune action trouvée`);
  const mal = actionsMalEpinglees(w);
  assert.deepEqual(mal, [], `${CI} : action non épinglée par une empreinte de 40 caractères avec sa version en commentaire : ${mal.join(" ; ")}`);
});

test("le workflow de contrôle se lance sur toute PR vers main et joue pnpm test", () => {
  const w = workflow();
  assert.ok(surPrVersMain(w), `${CI} : déclencheur pull_request vers main attendu`);
  assert.ok(!aLigne(w, /^\s+types:/), `${CI} : pas de filtre types: (brouillons compris)`);
  assert.ok(!aLigne(w, /^\s+push:/), `${CI} : pas de déclencheur push`);
  assert.ok(commande(w, "pnpm install --frozen-lockfile"), `${CI} : installation figée attendue`);
  assert.ok(commande(w, "pnpm test"), `${CI} : pnpm test attendu`);
});
