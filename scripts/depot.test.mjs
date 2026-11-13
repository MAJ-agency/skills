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
const CI = ".github/workflows/ci.yml";
const workflow = () => readFileSync(join(RACINE, CI), "utf8");

test("le workflow de contrôle n'écrit aucune expression dans un `run:`", () => {
  const fautives = workflow()
    .split("\n")
    .filter((l) => /^\s*(-\s+)?run:/.test(l) && l.includes("${{"));
  assert.deepEqual(fautives, [], `${CI} : expression dans un run: — passer par env: ${fautives.join(" ; ")}`);
});

test("le workflow de contrôle n'utilise que des actions épinglées par empreinte", () => {
  const usages = [...workflow().matchAll(/^\s*(?:-\s+)?uses:\s*(\S+)(.*)$/gm)];
  assert.ok(usages.length > 0, `${CI} : aucune action trouvée`);
  const mal = usages
    .filter(([, ref, reste]) => !/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/.test(ref) || !/#\s*v\d/.test(reste))
    .map(([, ref]) => ref);
  assert.deepEqual(mal, [], `${CI} : action non épinglée par une empreinte de 40 caractères avec sa version en commentaire : ${mal.join(" ; ")}`);
});

test("le workflow de contrôle se lance sur toute PR vers main et joue pnpm test", () => {
  const w = workflow();
  assert.match(w, /^on:\s*\n\s+pull_request:\s*\n\s+branches:\s*\[\s*'main'\s*\]/m, `${CI} : déclencheur pull_request vers main attendu`);
  assert.doesNotMatch(w, /^\s+types:/m, `${CI} : pas de filtre types: (brouillons compris)`);
  assert.doesNotMatch(w, /^\s+push:/m, `${CI} : pas de déclencheur push`);
  assert.match(w, /^\s+- run: pnpm install --frozen-lockfile\s*$/m, `${CI} : installation figée attendue`);
  assert.match(w, /^\s+- run: pnpm test\s*$/m, `${CI} : pnpm test attendu`);
});
