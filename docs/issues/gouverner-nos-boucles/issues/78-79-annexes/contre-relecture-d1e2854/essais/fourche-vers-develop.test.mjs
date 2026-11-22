// Contre-relecture de la PR 152, tour 3 (sommet d1e2854) : une PR de fourche vers develop, jouée par la boucle avec les
// scripts d'avant le delta (8cd21e5) puis ceux du delta (d1e2854), chacun publié sur le develop d'un dépôt jouet par le
// `depot-jouet.mjs` de son arbre. Variables : `AVANT` et `APRES`, la racine d'un clone à chaque sommet.
// Lancer : `AVANT=… APRES=… node --test fourche-vers-develop.test.mjs`.
// Trois cas, dans les deux régimes : sa CI rouge à la première tentative (relancée), puis à la seconde (renvoyée) ; et
// une PR de fourche verte dont le titre cite un ticket qui déclare `sujet/lot` (« vers sujet/lot », regroupée). Pour
// chacun, les lignes de la boucle sur la PR et les écritures du capitaine sont les mêmes avant et après : le delta ne
// change pas le traitement d'une PR de fourche vers develop (A-208 : la suite). Le cas regroupé est rejoué une seconde
// fois, pour lire ce que devient la fourche reciblée.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { AVANT, APRES } = process.env;
if (!AVANT || !APRES) throw new Error("AVANT et APRES requis");
const charger = async (racine) => import(pathToFileURL(join(racine, "skills/chaine/sujet/scripts/depot-jouet.mjs")).href);
const SOMMETS = { avant: await charger(AVANT), apres: await charger(APRES) };
const REGIME8 = { cheminsSensibles: ["scripts/agent/**"], relecture: { depuis: "2026-11-17T09:00:00Z" } };
const REGIME7 = { cheminsSensibles: ["scripts/agent/**"] };

function monter({ depotJouet }, contrat, cas) {
  const d = depotJouet();
  d.ecrire(".claude/chaine.json", `${JSON.stringify(contrat, null, 2)}\n`);
  d.ecrire("docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md", "# SPEC_ALL_DEM-1\n\nSujet: sujet/lot\n");
  d.commit("chore: contrat et spec");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  const sha = d.branche("feat/pr-80", "origin/develop", { "docs/pr-80.md": "80\n" });
  d.git("push", "-q", "origin", ":refs/heads/feat/pr-80");
  d.git("switch", "-q", "--detach", "origin/develop");
  const rouge = cas !== "regroupée";
  d.github({
    exiges: ["qualite"],
    checks: { [sha]: { qualite: rouge ? "FAILURE" : "SUCCESS" } },
    runs: rouge ? { "#80": [{ id: 9, conclusion: "failure", run_attempt: cas === "rouge, seconde tentative" ? 2 : 1 }] } : {},
    pulls: [{ number: 80, title: rouge ? "docs(x): pr 80" : "docs(demo): SPEC_ALL_DEM-1.03 x", head: "fourche/a", sha, base: "develop", labels: ["à-fusionner"], fourche: "autre/jouet", body: "## Revue de ticket\n\nRien.\n", commentaires: [] }],
  });
  d.publierChaine();
  d.git("fetch", "-q", "origin");
  return d;
}

const lignes = (r) => r.stdout.split("\n").filter((l) => /^\[#80\]|^\[sujet\/lot\]/.test(l)).map((l) => l.replace(/\d\d:\d\d/g, "hh:mm").replace(/\b[0-9a-f]{7,40}\b/g, "<sha>"));
const ecrit = (d) => d.journal().map((e) => `${e.methode ?? ""} ${e.route}`.trim());

for (const [nomContrat, contrat] of [["régime 8", REGIME8], ["régime 7", REGIME7]])
  for (const cas of ["rouge, première tentative", "rouge, seconde tentative", "regroupée"])
    test(`boucle.sh, ${nomContrat} : une PR de fourche vers develop, ${cas} : le même traitement avant et après le delta`, () => {
      const vu = {};
      for (const [sommet, module] of Object.entries(SOMMETS)) {
        const d = monter(module, contrat, cas);
        const boucle = module.script("fusionner", "boucle.sh");
        const r = d.lancer(boucle);
        assert.equal(r.status, 0, `${sommet} : ${r.stdout}${r.stderr}`);
        vu[sommet] = { lignes: lignes(r), ecrit: ecrit(d), base: d.etat().pulls[0].base, labels: d.etat().pulls[0].labels };
        if (cas === "regroupée") {
          const r2 = d.lancer(boucle);
          vu[sommet].secondTour = lignes(r2);
          const etat = d.lancer(module.script("sujet", "sujet.sh"), "etat");
          vu[sommet].etat = etat.stdout.split("\n").filter((l) => /^lot\t/.test(l));
          vu[sommet].fusionnee = Boolean(d.etat().pulls[0].merged_at);
        }
        console.log(`== ${nomContrat}, ${cas}, ${sommet} : ${JSON.stringify(vu[sommet])}`);
      }
      const { secondTour: _a, ...avant } = vu.avant;
      const { secondTour: _b, ...apres } = vu.apres;
      assert.deepEqual(apres, avant, "premier tour, écritures, base, étiquettes, état du sujet");
    });
