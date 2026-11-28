// Banc de la relance CircleCI de `boucle.sh` (`traiter_rouges`) : les checks exigés sont des statuts de commit
// `ci/circleci: <job>`, dont le `target_url` porte le workflow. Une CI rouge voit son workflow relancé une fois par
// sommet (`POST https://circleci.com/api/v2/workflow/<id>/rerun`, `{"from_failed": true}`, jeton `CIRCLECI_TOKEN` dans
// l'en-tête `Circle-Token`), puis la PR est renvoyée si un workflow neuf retombe. Sans jeton, ou relance refusée : la
// ligne le dit, aucun renvoi. Aucun réseau : un faux `curl` en tête de PATH note chaque appel et rend le code HTTP
// demandé ; l'API réelle n'est jamais appelée.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);

const W1 = "772ea9ef-b2d0-403f-94f1-3ac78e69e840";
const W2 = "0b6f2c1e-9a4d-4e5f-8c3b-1d2e3f4a5b6c";
const W3 = "5e1d9c2a-7b3f-4a6e-9d8c-2f1e0a9b8c7d";
const JETON = "jeton-de-banc-jamais-reel";
const QUALITE = "ci/circleci: qualite";
const statut = (workflow, state = "failure", contexte = QUALITE, url = null) => ({
  context: contexte,
  state,
  target_url: url ?? `https://app.circleci.com/workflow/${workflow}/job/71320b56-3450-499c-9c28-e9f2aa82a302`,
});

// Le jouet en régime 7 (sans contrat : aucune éligibilité jouée), les scripts de la chaîne sur develop, un faux curl.
function monter({ contrat = null } = {}) {
  const d = depotJouet();
  if (contrat) {
    d.ecrire(".claude/chaine.json", `${JSON.stringify(contrat, null, 2)}\n`);
    d.commit("chore: contrat");
  }
  d.publierChaine();
  for (const nom of ["decision-relecteur.mjs", "verdict.mjs", "double-relecture.mjs", "meme-contenu.sh"]) {
    d.ecrire(`scripts/chaine/${nom}`, readFileSync(scriptDe("fusionner", nom), "utf8"));
  }
  d.ecrire("scripts/chaine/chemins-sensibles.mjs", readFileSync(scriptDe("revue-adversariale", "chemins-sensibles.mjs"), "utf8"));
  d.commit("chore(chaine): calculs");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  // Faux curl : une ligne JSON par appel (arguments, entrée standard). Code HTTP : 400 pour le workflow écrit dans
  // `curl-refus`, sinon celui de `curl-code` (202 par défaut). Corps écrit dans le fichier de `-o` : `curl-corps`, sinon
  // `{"workflow_id": W2}` (le workflow neuf que rend CircleCI).
  const journal = join(d.env.FAUX_GH, "curl.jsonl");
  const code = join(d.env.FAUX_GH, "curl-code");
  const refus = join(d.env.FAUX_GH, "curl-refus");
  const corps = join(d.env.FAUX_GH, "curl-corps");
  const faux = join(d.racine, "faux-curl.mjs");
  writeFileSync(
    faux,
    `import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
const entree = readFileSync(0, "utf8");
appendFileSync(${JSON.stringify(journal)}, JSON.stringify({ args, entree, fuite: process.env.CIRCLECI_TOKEN ?? null }) + "\\n");
const lu = (f, d) => (existsSync(f) ? readFileSync(f, "utf8").trim() : d);
const refuse = lu(${JSON.stringify(refus)}, "");
const c = refuse && args.some((a) => a.includes(refuse)) ? "400" : lu(${JSON.stringify(code)}, "202");
const o = args[args.indexOf("-o") + 1];
if (o && o !== "/dev/null") writeFileSync(o, lu(${JSON.stringify(corps)}, ${JSON.stringify(JSON.stringify({ workflow_id: W2 }))}));
process.stdout.write(c);
`,
  );
  writeFileSync(join(d.racine, "bin", "curl"), `#!/bin/sh\nexec node ${JSON.stringify(faux)} "$@"\n`);
  chmodSync(join(d.racine, "bin", "curl"), 0o755);
  // Le faux gh, appelé par les enfants de la boucle (file.sh, renvoyer.sh, la boucle elle-même) : il note s'il voit le
  // jeton dans son environnement, ce qui ne doit jamais arriver.
  const fuites = join(d.env.FAUX_GH, "fuites");
  const gh = join(d.racine, "bin", "gh");
  writeFileSync(gh, readFileSync(gh, "utf8").replace("#!/bin/sh\n", `#!/bin/sh\n[ -z "\${CIRCLECI_TOKEN:-}" ] || echo "gh $*" >> ${JSON.stringify(fuites)}\n`));
  d.fuites = () => (existsSync(fuites) ? readFileSync(fuites, "utf8") : "");
  d.refuser = (w) => writeFileSync(refus, w);
  d.corps = (c) => writeFileSync(corps, c);
  d.env.CIRCLECI_TOKEN = JETON;
  d.appelsCurl = () => (existsSync(journal) ? readFileSync(journal, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
  d.codeCurl = (c) => writeFileSync(code, String(c));
  d.memoire = () => {
    const f = join(d.travail, ".git", "boucle-relances-circleci");
    return existsSync(f) ? readFileSync(f, "utf8") : "";
  };
  return d;
}
// La PR 31 vers develop, rouge sur CircleCI (`statuts`), sans aucun run GitHub Actions.
function rouge(d, statuts = [statut(W1)], { commentaires = [] } = {}) {
  const sha = d.branche("feat/b", "origin/develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: [QUALITE],
    checks: {},
    statuts: { "*": statuts },
    pulls: [{ number: 31, title: "docs(b): b", head: "feat/b", base: "develop", labels: ["à-fusionner"], commentaires }],
  });
  return sha;
}
const tour = (d) => {
  const r = d.lancer(scriptDe("fusionner", "boucle.sh"));
  assert.match(r.stdout, /FILE VIDE/, r.stdout + r.stderr);
  return r;
};
const labels = (d) => d.etat().pulls.find((p) => p.number === 31).labels;

test("boucle.sh, CircleCI : une CI rouge voit son workflow relancé une fois (from_failed, jeton par l'entrée standard), puis la PR est renvoyée si le workflow neuf retombe", () => {
  const d = monter();
  const sha = rouge(d);
  let r = tour(d);
  assert.match(r.stdout, /^\[#31\] RELANCE des jobs rouges \(ci\/circleci: qualite\)$/m, r.stdout);
  const appels = d.appelsCurl();
  assert.equal(appels.length, 1, JSON.stringify(appels));
  const [appel] = appels;
  assert.ok(appel.args.includes(`https://circleci.com/api/v2/workflow/${W1}/rerun`), appel.args.join(" "));
  assert.equal(appel.args[appel.args.indexOf("--data") + 1], '{"from_failed": true}');
  assert.equal(appel.args[appel.args.indexOf("-X") + 1], "POST");
  assert.ok(appel.args.includes("-H") && appel.args.includes("@-"), "en-têtes lus sur l'entrée standard");
  assert.equal(appel.entree, `Circle-Token: ${JETON}\n`);
  assert.ok(!appel.args.some((a) => a.includes(JETON)), "le jeton n'est jamais un argument de curl");
  assert.ok(!(r.stdout + r.stderr).includes(JETON), "ni dans le journal");
  assert.match(d.memoire(), new RegExp(`^31 ${sha} \\d+ ${W1} ${W2}$`, "m"));
  assert.ok(!d.memoire().includes(JETON), "ni dans la mémoire");
  assert.equal(appel.fuite, null, "curl ne reçoit pas le jeton par son environnement");
  assert.ok(!d.journal().some((e) => /rerun-failed-jobs$/.test(e.route)), "aucune relance GitHub Actions");
  assert.deepEqual(labels(d), ["à-fusionner"]);

  // Les statuts du workflow relancé n'ont pas encore changé : on attend, sans relancer ni renvoyer.
  r = tour(d);
  assert.match(r.stdout, new RegExp(`^\\[#31\\] relance CircleCI en route \\(workflow ${W1}\\) : statuts du workflow neuf attendus$`, "m"), r.stdout);
  assert.equal(d.appelsCurl().length, 1, "une seule relance par sommet");
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.deepEqual(labels(d), ["à-fusionner"]);

  // Le workflow neuf retombe : renvoi, sans seconde relance.
  d.github({ statuts: { "*": [statut(W2)] } });
  r = tour(d);
  assert.match(r.stdout, /^\[#31\] RENVOI : CI rouge sur le sommet de la PR, aussi à la relance : ci\/circleci: qualite/m, r.stdout);
  assert.equal(d.appelsCurl().length, 1);
  assert.deepEqual(labels(d), ["fusion-bloquée"]);
  assert.equal(d.fuites(), "", "aucun enfant de la boucle ne voit le jeton");
});

test("boucle.sh, CircleCI : un sommet neuf a droit à sa propre relance", () => {
  const d = monter();
  rouge(d);
  tour(d);
  assert.equal(d.appelsCurl().length, 1);
  // L'auteur pousse : sommet neuf, rouge sur un autre workflow ; la mémoire ne vaut que pour l'ancien sommet.
  const neuf = d.branche("feat/b", "origin/feat/b", { "docs/b.md": "b bis\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ statuts: { "*": [statut(W2)] } });
  const r = tour(d);
  assert.match(r.stdout, /^\[#31\] RELANCE des jobs rouges/m, r.stdout);
  assert.equal(d.appelsCurl().length, 2);
  assert.ok(d.appelsCurl()[1].args.includes(`https://circleci.com/api/v2/workflow/${W2}/rerun`));
  assert.match(d.memoire(), new RegExp(`^31 ${neuf} \\d+ ${W2} ${W2}$`, "m"));
  assert.deepEqual(labels(d), ["à-fusionner"]);
});

test("boucle.sh, CircleCI : sans CIRCLECI_TOKEN, aucune relance ni aucun renvoi, et la ligne le dit", () => {
  const d = monter();
  delete d.env.CIRCLECI_TOKEN;
  rouge(d);
  const r = tour(d);
  assert.match(
    r.stdout,
    /^\[#31\] CI rouge sur CircleCI \(ci\/circleci: qualite\) : aucune relance, CIRCLECI_TOKEN absent de l'environnement du capitaine \(skill fusionner, « Relance CircleCI »\) ; PR laissée rouge dans la file$/m,
    r.stdout,
  );
  assert.equal(d.appelsCurl().length, 0, "curl jamais appelé");
  assert.doesNotMatch(r.stdout, /RELANCE|RENVOI/);
  assert.equal(d.memoire(), "");
  assert.deepEqual(labels(d), ["à-fusionner"]);
});

test("boucle.sh, CircleCI : une relance refusée (HTTP 401) est dite, rien n'est noté, aucun renvoi ; elle se rejoue au tour suivant", () => {
  const d = monter();
  rouge(d);
  d.codeCurl(401);
  let r = tour(d);
  assert.match(r.stdout, new RegExp(`^\\[#31\\] relance CircleCI refusée \\(workflow ${W1}\\) : HTTP 401 ; PR laissée rouge, rejouée au tour suivant$`, "m"), r.stdout);
  assert.doesNotMatch(r.stdout, /RELANCE des jobs|RENVOI/);
  assert.equal(d.memoire(), "");
  assert.deepEqual(labels(d), ["à-fusionner"]);
  d.codeCurl(202);
  r = tour(d);
  assert.match(r.stdout, /^\[#31\] RELANCE des jobs rouges/m, r.stdout);
  assert.equal(d.appelsCurl().length, 2);
});

test("boucle.sh, CircleCI : une relance sans statut neuf au-delà de BOUCLE_CIRCLECI_DELAI est jugée sans effet, la PR renvoyée", () => {
  const d = monter();
  d.env.BOUCLE_CIRCLECI_DELAI = "0";
  rouge(d);
  tour(d);
  const r = tour(d);
  assert.match(r.stdout, new RegExp(`^\\[#31\\] relance CircleCI sans effet : aucun statut neuf depuis 0 s \\(workflow ${W1}\\)$`, "m"), r.stdout);
  assert.match(r.stdout, /^\[#31\] RENVOI : CI rouge sur le sommet de la PR, aussi à la relance/m);
  assert.equal(d.appelsCurl().length, 1);
  assert.deepEqual(labels(d), ["fusion-bloquée"]);
});

test("boucle.sh, CircleCI : deux jobs rouges du même workflow, une seule relance ; un target_url d'une autre forme n'est jamais relancé", () => {
  const d = monter();
  rouge(d, [
    statut(W1),
    statut(W1, "error", "ci/circleci: test-db"),
    statut(W1, "success", "ci/circleci: zizmor"),
    statut(null, "failure", "ci/circleci: autre", `https://exemple.invalid/workflow/${W2}/job/x`),
    statut(null, "failure", "ci/circleci: pas-un-uuid", "https://app.circleci.com/workflow/pas-un-uuid;rm/job/x"),
  ]);
  const r = tour(d);
  assert.match(r.stdout, /^\[#31\] RELANCE des jobs rouges/m, r.stdout);
  const appels = d.appelsCurl();
  assert.equal(appels.length, 1, JSON.stringify(appels));
  assert.ok(appels[0].args.includes(`https://circleci.com/api/v2/workflow/${W1}/rerun`));
});

test("boucle.sh, CircleCI : rouge seulement hors CircleCI (aucun workflow lisible, aucun run Actions) : ni relance ni renvoi", () => {
  const d = monter();
  rouge(d, [statut(null, "failure", QUALITE, "https://exemple.invalid/build/12")]);
  const r = tour(d);
  assert.equal(d.appelsCurl().length, 0);
  assert.doesNotMatch(r.stdout, /RELANCE|RENVOI|CircleCI/);
  assert.deepEqual(labels(d), ["à-fusionner"]);
});

test("boucle.sh, CircleCI, régime 8 : une PR rouge sans tour validé est renvoyée pour son verdict, son workflow jamais relancé", () => {
  const d = monter({ contrat: { cheminsSensibles: ["scripts/agent/**"], relecture: { depuis: "2026-11-17T09:00:00Z" } } });
  rouge(d);
  const r = tour(d);
  assert.match(r.stdout, /^\[#31\] éligibilité avant la CI : sortie 4 : /m, r.stdout);
  assert.match(r.stdout, /^\[#31\] RENVOI : aucun tour de relecture validé pour le contenu de ce sommet/m);
  assert.equal(d.appelsCurl().length, 0, "aucune relance CircleCI");
  assert.deepEqual(labels(d), ["fusion-bloquée"]);
});

test("boucle.sh, CircleCI : un refus partiel (deux workflows, l'un refusé) ne renvoie pas ; le refusé se rejoue au tour suivant", () => {
  const d = monter();
  d.corps(JSON.stringify({ workflow_id: W3 }));
  rouge(d, [statut(W1), statut(W2, "failure", "ci/circleci: test-db")]);
  d.refuser(W2);
  let r = tour(d);
  assert.match(r.stdout, /^\[#31\] RELANCE des jobs rouges/m, r.stdout);
  assert.match(r.stdout, new RegExp(`^\\[#31\\] relance CircleCI refusée \\(workflow ${W2}\\) : HTTP 400`, "m"));
  assert.doesNotMatch(d.memoire(), new RegExp(` ${W2} `), "le refusé n'est pas noté");
  d.refuser("");
  r = tour(d);
  assert.match(r.stdout, new RegExp(`^\\[#31\\] relance CircleCI en route \\(workflow ${W1}\\)`, "m"), r.stdout);
  assert.match(r.stdout, /^\[#31\] RELANCE des jobs rouges/m, "W2 relancé à ce tour");
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.equal(d.appelsCurl().filter((a) => a.args.some((x) => x.includes(W2))).length, 2);
  assert.deepEqual(labels(d), ["à-fusionner"]);
});

test("boucle.sh, CircleCI : un workflow qui échoue après la relance d'un autre a droit à sa propre relance", () => {
  const d = monter();
  d.corps(JSON.stringify({ workflow_id: W3 }));
  rouge(d, [statut(W1), statut(W2, "pending", "ci/circleci: test-db")]);
  d.github({ exiges: [QUALITE, "ci/circleci: test-db"] });
  tour(d);
  assert.equal(d.appelsCurl().length, 1);
  // W1 a été relancé (W3 tourne), W2 finit rouge pour la première fois.
  d.github({ statuts: { "*": [statut(W3, "pending"), statut(W2, "failure", "ci/circleci: test-db")] } });
  const r = tour(d);
  assert.match(r.stdout, /^\[#31\] RELANCE des jobs rouges/m, r.stdout);
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.ok(d.appelsCurl()[1].args.includes(`https://circleci.com/api/v2/workflow/${W2}/rerun`));
});

test("boucle.sh, CircleCI : une réponse sans workflow neuf lisible est notée « ? » ; tout rouge suivant du sommet renvoie, jamais une seconde relance", () => {
  const d = monter();
  d.corps("pas du json");
  const sha = rouge(d);
  tour(d);
  assert.match(d.memoire(), new RegExp(`^31 ${sha} \\d+ ${W1} \\?$`, "m"));
  d.github({ statuts: { "*": [statut(W3)] } });
  const r = tour(d);
  assert.match(r.stdout, /^\[#31\] RENVOI : CI rouge sur le sommet de la PR, aussi à la relance/m, r.stdout);
  assert.equal(d.appelsCurl().length, 1);
});

test("boucle.sh, CircleCI et GitHub Actions sur le même sommet : chacun relancé une fois ; le run Actions épuisé et CircleCI retombé, renvoi", () => {
  const d = monter();
  rouge(d);
  d.github({ runs: { "#31": [{ id: 7, conclusion: "failure", run_attempt: 1 }] } });
  let r = tour(d);
  assert.match(r.stdout, /^\[#31\] RELANCE des jobs rouges/m, r.stdout);
  assert.ok(d.journal().some((e) => e.route === "actions/runs/7/rerun-failed-jobs"), "run Actions relancé");
  assert.equal(d.appelsCurl().length, 1, "workflow CircleCI relancé");
  d.github({ runs: { "#31": [{ id: 7, conclusion: "failure", run_attempt: 2 }] }, statuts: { "*": [statut(W2)] } });
  r = tour(d);
  assert.match(r.stdout, /^\[#31\] RENVOI : CI rouge sur le sommet de la PR, aussi à la relance/m, r.stdout);
  assert.equal(d.appelsCurl().length, 1);
  assert.deepEqual(labels(d), ["fusion-bloquée"]);
});
