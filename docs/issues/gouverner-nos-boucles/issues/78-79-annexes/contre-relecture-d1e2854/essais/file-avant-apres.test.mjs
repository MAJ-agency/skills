// Contre-relecture de la PR 152, tour 3 (sommet d1e2854) : le `file.sh` d'avant le delta (8cd21e5) et celui du delta
// (d1e2854), joués sur le même dépôt jouet, la même file, le même faux GitHub. Variables : `ARBRE` (un clone au sommet
// d1e2854, d'où viennent le dépôt jouet et le faux GitHub, inchangés par le delta), `AVANT` et `APRES` (le `file.sh` de
// chaque sommet, dans son arbre : chacun source le `github.sh` et le `sujet.sh` du sien, identiques aux deux sommets).
// Lancer : `ARBRE=… AVANT=…/file.sh APRES=…/file.sh node --test file-avant-apres.test.mjs`.
//
// Cas 1 : une file sans sous-PR de fourche (tous les états de l'en-tête de file.sh, et des PR de fourche vers develop),
// dans trois lectures de la liste des PR : telle que le faux GitHub la rend (`head.repo` et `base.repo`), sans aucun
// champ `repo` (un `gh` de banc plus ancien), et avec la tête sans dépôt d'une fourche supprimée vers develop. Pour
// chacune : le tableau, `--next`, `--rouges`, leur sortie d'erreur, leur code, et la liste des appels `gh` sont
// identiques avant et après. Cas 2 : la même file plus des sous-PR de fourche : seules leurs lignes changent (« fourche »),
// et `file.sh` en lit moins (ni checks ni `pulls/<n>` pour elles).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { ARBRE, AVANT, APRES } = process.env;
if (!ARBRE || !AVANT || !APRES) throw new Error("ARBRE, AVANT et APRES requis");
const { depotJouet, script } = await import(pathToFileURL(join(ARBRE, "skills/chaine/sujet/scripts/depot-jouet.mjs")).href);
const FAUX = script("sujet", "faux-gh.mjs");
const MARQUE = "<!-- renvoi-capitaine -->";

// Le `gh` du banc : chaque appel noté dans $ESPION_GH, puis la liste des PR ouvertes passée par le filtre $FILTRE_LISTE
// (s'il est posé), une PR seule par $FILTRE_PR, comme GitHub les rendrait.
function espion(d) {
  writeFileSync(join(d.racine, "filtre.mjs"), `const mode = process.argv[2];
let t = "";
process.stdin.on("data", (c) => (t += c)).on("end", () => {
  const v = JSON.parse(t);
  const sans = (process.env.SANS_DEPOT ?? "").split(",").filter(Boolean).map(Number);
  for (const p of Array.isArray(v) ? v : [v]) {
    if (process.env.SANS_REPO) { delete p.head.repo; delete p.base.repo; }
    if (sans.includes(p.number)) p.head.repo = null;
  }
  process.stdout.write(JSON.stringify(v) + "\\n");
});
`);
  Object.assign(d.env, { BANC_FAUX_GH: FAUX, BANC_FILTRE: join(d.racine, "filtre.mjs") });
  writeFileSync(join(d.racine, "bin/gh"), `#!/bin/sh
echo "$*" >> "$ESPION_GH"
case "$*" in *"-X "*) ;; *"/pulls?state=open"*|*"/pulls/"[0-9]*) node "$BANC_FAUX_GH" "$@" | node "$BANC_FILTRE"; exit 0 ;; esac
exec node "$BANC_FAUX_GH" "$@"
`);
}

function monterFile({ sousPrDeFourche }) {
  const d = depotJouet();
  d.ecrire(".claude/chaine.json", `${JSON.stringify({ cheminsSensibles: ["scripts/agent/**"] }, null, 2)}\n`);
  // Trois sujets : `lot` (déclaré par la spec DEM-1), `gele` (sa carte porte `Gel:`), `fini` (livré : sa carte sur
  // develop est en phase « fini »).
  d.ecrire("docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md", "# SPEC_ALL_DEM-1\n\nSujet: sujet/lot\n");
  d.ecrire("docs/features/fin/all/SPEC_ALL_FIN-1-fin.spec.md", "# SPEC_ALL_FIN-1\n\nSujet: sujet/fini\n");
  d.ecrire("docs/features/fin/all/SPEC_ALL_FIN-1-fin.map.md", "# carte\n\nSujet: sujet/fini\n\n## Fiche\n\nPhase: fini\n");
  d.commit("docs: specs et cartes");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  d.branche("sujet/gele", "origin/develop", { "docs/features/gel/all/SPEC_ALL_GEL-1-gel.map.md": "# carte\n\nSujet: sujet/gele\n\n## Fiche\n\nPhase: 4-vague-1\nGel: 2026-11-20 — banc\n" });
  const checks = {};
  const pulls = [];
  const pr = (n, { depuis = "origin/develop", base = "develop", ci = "SUCCESS", titre = `docs(x): pr ${n}`, labels = ["à-fusionner"], tete, ...autres } = {}) => {
    const sha = d.branche(`feat/pr-${n}`, depuis, { [`docs/pr-${n}.md`]: `${n}\n` });
    if (ci) checks[sha] = { qualite: ci };
    pulls.push({ number: n, title: titre, head: tete ?? `feat/pr-${n}`, sha, base, labels, commentaires: [], ...autres });
  };
  // Vers develop.
  pr(10);
  pr(11, { ci: null });
  pr(12, { ci: null, mergeableState: "dirty" });
  pr(13, { ci: "IN_PROGRESS" });
  pr(14, { ci: "FAILURE" });
  pr(15, { labels: ["à-fusionner", "prio:haute"] });
  pr(16, { draft: true });
  pr(17, { labels: ["à-fusionner", "fusion-bloquée"] });
  pr(18, { ci: "FAILURE", commentaires: [MARQUE, MARQUE, MARQUE] });
  pr(19, { base: "feat/pr-10" });
  pr(20, { base: "feat/vieille" });
  pr(21, { base: "feat/vieille-lot" });
  pr(23, { titre: "docs(demo): SPEC_ALL_DEM-1.03 x" });
  pr(24, { titre: "docs(demo): SPEC_ALL_DEM-1.04 x", labels: ["à-fusionner", "hors-sujet"] });
  pr(25, { titre: "docs(fin): SPEC_ALL_FIN-1.01 x" });
  pr(26, { ci: "CANCELLED", labels: [] }); // sans étiquette : hors de la file
  // Livraison du sujet `lot` (tête `sujet/lot`).
  const shaLot = d.git("rev-parse", "origin/sujet/lot");
  checks[shaLot] = { qualite: "SUCCESS" };
  pulls.push({ number: 22, title: "docs(demo): sujet/lot", head: "sujet/lot", sha: shaLot, base: "develop", labels: ["à-fusionner"], commentaires: [] });
  // Deux parentes fusionnées, l'une dans develop, l'autre dans sujet/lot.
  pulls.push({ number: 5, title: "vieille", head: "feat/vieille", sha: "1".repeat(40), base: "develop", state: "closed", merged_at: "2026-11-17T10:00:00Z", labels: [] });
  pulls.push({ number: 6, title: "vieille lot", head: "feat/vieille-lot", sha: "2".repeat(40), base: "sujet/lot", state: "closed", merged_at: "2026-11-17T10:00:00Z", labels: [] });
  // Sous-PR du dépôt, vers sujet/lot, dans chaque état ; une vers sujet/gele.
  pr(30, { depuis: "origin/sujet/lot", base: "sujet/lot" });
  pr(31, { depuis: "origin/sujet/lot", base: "sujet/lot", ci: null });
  pr(32, { depuis: "origin/sujet/lot", base: "sujet/lot", ci: null, mergeableState: "dirty" });
  pr(33, { depuis: "origin/sujet/lot", base: "sujet/lot", ci: "IN_PROGRESS" });
  pr(34, { depuis: "origin/sujet/lot", base: "sujet/lot", ci: "FAILURE" });
  pr(35, { depuis: "origin/sujet/lot", base: "sujet/lot", draft: true });
  pr(36, { depuis: "origin/sujet/lot", base: "sujet/lot", labels: ["à-fusionner", "fusion-bloquée"] });
  pr(37, { depuis: "origin/sujet/lot", base: "sujet/lot", ci: "FAILURE", commentaires: [MARQUE, MARQUE, MARQUE] });
  pr(38, { depuis: "origin/sujet/gele", base: "sujet/gele" });
  // PR de fourche vers develop (ou empilée) : leur traitement ne doit pas changer (A-208 : suite).
  const F = { fourche: "autre/jouet" };
  pr(40, { ...F, tete: "fourche/a" });
  pr(41, { ...F, tete: "fourche/b", ci: "FAILURE" });
  pr(42, { ...F, tete: "fourche/c", ci: "IN_PROGRESS" });
  pr(43, { ...F, tete: "fourche/d", ci: null });
  pr(44, { tete: "fourche/e", ci: "FAILURE" }); // fourche supprimée quand SANS_DEPOT=44 (sa tête sans dépôt)
  pr(45, { ...F, tete: "fourche/f", titre: "docs(demo): SPEC_ALL_DEM-1.05 x" });
  pr(46, { ...F, tete: "fourche/g", base: "feat/pr-10" });
  pr(47, { ...F, tete: "fourche/h", draft: true });
  if (sousPrDeFourche) {
    pr(60, { ...F, tete: "fourche/i", depuis: "origin/sujet/lot", base: "sujet/lot" });
    pr(61, { ...F, tete: "fourche/j", depuis: "origin/sujet/lot", base: "sujet/lot", ci: "FAILURE" });
    pr(62, { ...F, tete: "fourche/k", depuis: "origin/sujet/lot", base: "sujet/lot", ci: "IN_PROGRESS" });
    pr(63, { ...F, tete: "fourche/l", depuis: "origin/sujet/lot", base: "sujet/lot", ci: null });
    pr(64, { ...F, tete: "fourche/m", depuis: "origin/sujet/lot", base: "sujet/lot", draft: true });
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks, pulls });
  espion(d);
  return d;
}

// Un lancement de file.sh : sortie, erreur, code, appels `gh` (dans l'ordre).
function jouer(d, fichier, args, env) {
  const log = join(d.racine, "espion-gh.log");
  rmSync(log, { force: true });
  Object.assign(d.env, { ESPION_GH: log, SANS_REPO: "", SANS_DEPOT: "", ...env });
  const r = d.lancer(fichier, ...args);
  return { stdout: r.stdout, stderr: r.stderr, status: r.status, gh: existsSync(log) ? readFileSync(log, "utf8") : "" };
}

const LECTURES = { "liste telle quelle": {}, "liste sans champ repo": { SANS_REPO: "1" }, "fourche supprimée vers develop (#44)": { SANS_DEPOT: "44" } };
const MODES = [[], ["--next"], ["--rouges"]];

test("file.sh avant (8cd21e5) et après (d1e2854) : une file sans sous-PR de fourche, fourches vers develop comprises, se lit à l'identique (tableau, --next, --rouges, erreurs, codes, appels gh)", () => {
  const d = monterFile({ sousPrDeFourche: false });
  for (const [lecture, env] of Object.entries(LECTURES))
    for (const args of MODES) {
      const a = jouer(d, AVANT, args, env);
      const b = jouer(d, APRES, args, env);
      const cas = `${lecture}, file.sh ${args.join(" ") || "(tableau)"}`;
      assert.equal(b.stdout, a.stdout, `${cas} : sortie`);
      assert.equal(b.stderr, a.stderr, `${cas} : erreur`);
      assert.equal(b.status, a.status, `${cas} : code`);
      assert.equal(b.gh, a.gh, `${cas} : appels gh`);
      const appels = a.gh.trim().split("\n").filter(Boolean).length;
      console.log(`== ${cas} : identiques (code ${a.status}, ${appels} appels gh)`);
      if (!args.length) console.log(a.stdout.replace(/^/gm, "   "));
      else console.log(`   ${JSON.stringify(a.stdout)}`);
    }
});

test("file.sh avant et après : la même file plus des sous-PR de fourche ; seules leurs lignes changent, et après, file.sh ne lit pour elles ni checks ni pulls/<n>", () => {
  const d = monterFile({ sousPrDeFourche: true });
  const FOURCHES = ["60", "61", "62", "63"];
  for (const args of MODES) {
    const a = jouer(d, AVANT, args, {});
    const b = jouer(d, APRES, args, {});
    const cas = `file.sh ${args.join(" ") || "(tableau)"}`;
    assert.equal(b.status, a.status, `${cas} : code`);
    const sans = (s) => s.split("\n").filter((l) => !FOURCHES.includes(l.split("\t")[0])).join("\n");
    assert.equal(sans(b.stdout), sans(a.stdout), `${cas} : les autres lignes`);
    console.log(`== ${cas} : avant ${JSON.stringify(a.stdout.split("\n").filter((l) => FOURCHES.includes(l.split("\t")[0])))}`);
    console.log(`   après ${JSON.stringify(b.stdout.split("\n").filter((l) => FOURCHES.includes(l.split("\t")[0])))}`);
    const lus = (g) => g.split("\n").filter((l) => /commits\/[0-9a-f]+\/check-runs|pulls\/6[0-3]( |$)/.test(l)).length;
    console.log(`   appels gh : avant ${a.gh.trim().split("\n").length} (dont ${lus(a.gh)} checks ou pulls/<n>), après ${b.gh.trim().split("\n").length}`);
  }
  const t = jouer(d, APRES, [], {});
  const etats = Object.fromEntries(t.stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2)));
  assert.deepEqual([etats[60], etats[61], etats[62], etats[63], etats[64]], ["sujet/lot : fourche", "sujet/lot : fourche", "sujet/lot : fourche", "sujet/lot : fourche", "brouillon"]);
  assert.deepEqual(jouer(d, APRES, ["--rouges"], {}).stdout.split("\n").filter(Boolean).map((l) => l.split("\t")[0]), ["34", "14", "41", "44"]);
});
