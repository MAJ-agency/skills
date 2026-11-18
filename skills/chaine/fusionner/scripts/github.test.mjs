// `regenerer_index` de github.sh (sourcé par sujet.sh, passer.sh et boucle.sh) : les contrôles
// (`verification`) jouent après toutes les régénérations, un échec fait échouer la mise à jour.
// Dépôt jouet partagé (depot-jouet.mjs) ; commandes et contrôles sont des `sh -c` triviaux.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const GITHUB = script("fusionner", "github.sh");
const SCRIPT_SUJET = script("sujet", "sujet.sh");

const declarer = (d, index) =>
  d.ecrire("scripts/docs/index-generes.json", JSON.stringify({ index }));

const regenerer = (d) =>
  spawnSync("bash", ["-c", `source ${GITHUB}; regenerer_index`], {
    cwd: d.travail,
    env: d.env,
    encoding: "utf8",
  });

test("regenerer_index joue les contrôles après toutes les commandes, dans l’ordre", () => {
  const d = depotJouet();
  declarer(d, [
    { chemin: "a.txt", commande: "echo cmd-a >> trace", verification: "echo ver-a >> trace" },
    { chemin: "b.txt", commande: "echo cmd-b >> trace", verification: "echo ver-b >> trace" },
  ]);
  const r = regenerer(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(d.lire("trace"), "cmd-a\ncmd-b\nver-a\nver-b\n");
});

test("regenerer_index dédoublonne les contrôles identiques", () => {
  const d = depotJouet();
  declarer(d, [
    { chemin: "a.txt", commande: "true", verification: "echo ver >> trace" },
    { chemin: "b.txt", commande: "true", verification: "echo ver >> trace" },
  ]);
  assert.equal(regenerer(d).status, 0);
  assert.equal(d.lire("trace"), "ver\n");
});

test("un contrôle en échec fait échouer regenerer_index, sortie et commande sur stderr", () => {
  const d = depotJouet();
  declarer(d, [{ chemin: "a.txt", commande: "true", verification: "echo types périmés; exit 1" }]);
  const r = regenerer(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /\[echo types périmés; exit 1\] types périmés/);
});

test("une entrée sans verification et une entrée en chaîne simple ne changent rien", () => {
  const d = depotJouet();
  declarer(d, ["docs/ancien.md", { chemin: "a.txt", commande: "echo cmd >> trace" }]);
  const r = regenerer(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(d.lire("trace"), "cmd\n");
});

test("rafraichir annule la mise à jour quand un contrôle échoue : le sujet reste inchangé", () => {
  const d = depotJouet();
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/demo");
  d.ecrire("autre.md", "develop avance\n");
  d.commit("docs: develop avance");
  d.git("push", "-q", "origin", "HEAD:develop");
  declarer(d, [{ chemin: "a.txt", commande: "true", verification: "echo faux; exit 1" }]);
  d.commit("chore: contrôle qui échoue");
  d.git("push", "-q", "origin", "HEAD:develop");
  const avant = d.git("rev-parse", "origin/sujet/demo");
  const r = d.lancer(SCRIPT_SUJET, "rafraichir", "demo");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /gate des index\/registres en échec/);
  assert.match(r.stderr, /\[echo faux; exit 1\] faux/);
  assert.equal(d.git("ls-remote", "origin", "sujet/demo").split("\t")[0], avant);
});

test("regenerer_index montre la sortie d’une commande de régénération en échec, préfixée de la commande", () => {
  const d = depotJouet();
  const commande = "echo base injoignable; echo detail >&2; exit 1";
  declarer(d, [{ chemin: "a.txt", commande }]);
  const r = regenerer(d);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.ok(r.stderr.includes(`[${commande}] base injoignable`), r.stderr);
  assert.ok(r.stderr.includes(`[${commande}] detail`), r.stderr);
});

test("jq absent : github.sh s'arrête dès qu'on le source, sortie 69, une ligne qui dit quoi installer", () => {
  const d = depotJouet();
  const bash = spawnSync("sh", ["-c", "command -v bash"], { encoding: "utf8" }).stdout.trim();
  const vide = join(d.racine, "vide");
  mkdirSync(vide);
  const r = spawnSync(bash, ["-c", `source ${GITHUB}; echo suite`], {
    cwd: d.travail,
    env: { ...d.env, PATH: vide },
    encoding: "utf8",
  });
  assert.equal(r.status, 69, r.stdout + r.stderr);
  assert.equal(r.stdout, "");
  assert.equal(r.stderr.trim().split("\n").length, 1, r.stderr);
  assert.match(r.stderr, /jq est requis/);
  assert.match(r.stderr, /sudo apt install jq/);
});

// `ascendance <testé> <cible>` : la règle d'ascendance, partagée par passer.sh et sujet.sh. Quatre verdicts ; une
// réf absente ne conclut jamais `à-jour`.
const ascendance = (d, teste, cible) =>
  spawnSync("bash", ["-c", `source ${GITHUB}; ascendance "$1" "$2"`, "_", teste, cible], {
    cwd: d.travail,
    env: d.env,
    encoding: "utf8",
  });
const ADR = "docs/adr";
// develop ajoute l'ADR 1 ; `pr` part d'avant et apporte `fichiersPr` ; develop reçoit ensuite `fichiersCible`.
function ascendanceJouet(fichiersPr, fichiersCible) {
  const d = depotJouet();
  d.ecrire("docs/f.md", "0\n");
  d.commit("docs: f");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  const teste = d.branche("feat/pr", "origin/develop", fichiersPr);
  if (fichiersCible) d.branche("develop", "origin/develop", fichiersCible);
  d.git("switch", "-q", "--detach", "origin/develop");
  return { d, teste };
}

test("ascendance : la cible est ancêtre du sommet testé, à-jour", () => {
  const { d, teste } = ascendanceJouet({ "docs/x.md": "x\n" });
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "à-jour\n");
});

test("ascendance : la cible a avancé sans conflit, retard (même pour de la documentation seule)", () => {
  const { d, teste } = ascendanceJouet({ "docs/x.md": "x\n" }, { "docs/guide.md": "g\n" });
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "retard\n");
});

test("ascendance : conflit sur un index généré seul, conflit-index avec le fichier", () => {
  const { d, teste } = ascendanceJouet(
    { [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n", [`${ADR}/README.md`]: "- ADR_ALL_ARC-2-b.md\n" },
    { [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n", [`${ADR}/README.md`]: "- ADR_ALL_ARC-3-c.md\n" },
  );
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `conflit-index\n${ADR}/README.md\n`);
});

test("ascendance : conflit hors index générés, conflit avec les fichiers", () => {
  const { d, teste } = ascendanceJouet(
    { "docs/f.md": "pr\n", [`${ADR}/README.md`]: "- pr\n" },
    { "docs/f.md": "develop\n", [`${ADR}/README.md`]: "- develop\n" },
  );
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `conflit\n${ADR}/README.md\ndocs/f.md\n`);
});

test("ascendance : la liste des index se lit sur la cible, jamais dans l'arbre de travail", () => {
  const { d, teste } = ascendanceJouet({ "docs/f.md": "pr\n" }, { "docs/f.md": "develop\n" });
  // L'arbre de travail déclare docs/f.md index généré : la cible, elle, ne le déclare pas.
  declarer(d, [{ chemin: "docs/f.md", commande: "true" }]);
  const r = ascendance(d, teste, "origin/develop");
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, "conflit\ndocs/f.md\n");
});

test("ascendance : une réf absente sort en 1, motif sur la sortie d'erreur, jamais à-jour", () => {
  const { d, teste } = ascendanceJouet({ "docs/x.md": "x\n" });
  for (const [a, b] of [
    [teste, "origin/absente"],
    ["0".repeat(40), "origin/develop"],
  ]) {
    const r = ascendance(d, a, b);
    assert.equal(r.status, 1, r.stdout);
    assert.equal(r.stdout, "");
    assert.match(r.stderr, /introuvable/);
  }
});

// ── GitHub illisible (ticket 9, A-21) : une lecture qui décide d'un état passe par `lire_github`, qui refuse une réponse
// vide, non JSON, porteuse d'un `message` d'erreur ou à code non nul : sortie 5, jamais un état. ─────────────────────
const fonction = (d, corps, ...args) =>
  spawnSync("bash", ["-c", `source ${GITHUB}; ${corps}`, "_", ...args], {
    cwd: d.travail,
    env: d.env,
    encoding: "utf8",
  });
const PR1 = "repos/{owner}/{repo}/pulls/1";
function avecPr() {
  const d = depotJouet();
  d.github({ pulls: [{ number: 1, title: "t", head: "feat/x", base: "develop", labels: [] }] });
  return d;
}

test("lire_github refuse une réponse vide, non JSON, porteuse de message ou à code non nul : sortie 5 ; un JSON valide passe ; --absent rend son défaut sur un 404 seulement", () => {
  const d = avecPr();
  const refus = [
    { sortie: "", erreur: "gh: Bad Gateway (HTTP 502)", code: 1 },
    { sortie: "<html>502 Bad Gateway</html>", erreur: "gh: Bad Gateway (HTTP 502)", code: 1 },
    { sortie: "", code: 0, erreur: "" },
    { sortie: "  \n", code: 0, erreur: "" },
    { sortie: "<html>502 Bad Gateway</html>", code: 0, erreur: "" },
    { sortie: '{"message":"Server Error","documentation_url":"https://docs.github.com"}', code: 0, erreur: "" },
  ];
  for (const panne of refus) {
    d.github({ pannes: [{ route: "^pulls/1$", ...panne }] });
    const r = fonction(d, 'lire_github "$1"', PR1);
    assert.equal(r.status, 5, `${JSON.stringify(panne)} : ${r.stdout}${r.stderr}`);
    assert.equal(r.stdout, "", JSON.stringify(panne));
    assert.match(r.stderr, /GitHub illisible \(repos\/\{owner\}\/\{repo\}\/pulls\/1\) : /, JSON.stringify(panne));
  }
  const ok = fonction(d, 'lire_github "$1"', PR1);
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(JSON.parse(ok.stdout).number, 1);
  // Un tableau d'objets n'est jamais refusé pour un champ `message` imbriqué ; des pages concaténées se lisent chacune.
  d.github({ pannes: [{ route: "^pulls/1$", sortie: '[{"message":"commit"}]', code: 0, erreur: "" }] });
  assert.equal(fonction(d, 'lire_github "$1"', PR1).status, 0);
  d.github({ pannes: [{ route: "^pulls/1$", sortie: '[1,2]\n[3]\n', code: 0, erreur: "" }] });
  const pages = fonction(d, 'lire_github "$1" --paginate', PR1);
  assert.equal(pages.status, 0, pages.stderr);
  assert.equal(pages.stdout, "[1,2]\n[3]\n");
  d.github({ pannes: [{ route: "^pulls/1$", sortie: '[1]\n{"message":"Server Error"}\n', code: 0, erreur: "" }] });
  assert.equal(fonction(d, 'lire_github "$1" --paginate', PR1).status, 5, "une page d'erreur parmi d'autres");
  d.github({ pannes: [{ route: "^pulls/1$", sortie: "[1]\n<html>", code: 0, erreur: "" }] });
  assert.equal(fonction(d, 'lire_github "$1" --paginate', PR1).status, 5, "une page illisible parmi d'autres");
  // --absent : un 404 est une réponse (protection absente), tout autre refus reste une panne.
  const absent = fonction(d, `lire_github "$1" --absent '[]'`, "repos/{owner}/{repo}/branches/develop/protection/required_status_checks");
  assert.equal(absent.status, 0, absent.stderr);
  assert.equal(absent.stdout, "[]\n");
  d.github({ pannes: [{ route: "protection/required_status_checks$" }] });
  const panne = fonction(d, `lire_github "$1" --absent '[]'`, "repos/{owner}/{repo}/branches/develop/protection/required_status_checks");
  assert.equal(panne.status, 5, panne.stdout + panne.stderr);
  assert.equal(panne.stdout, "");
});

// `pousser` classe un push refusé par la trace de husky 9 (A-22) : 3 avec elle (le hook refuse, la PR est à corriger),
// 4 sans (le distant refuse : échec fermé, jamais un renvoi), 5 quand la branche a bougé.
const TRACE_HUSKY = "husky - pre-push script failed (code 1)";
function hookLocal(d, corps) {
  const dir = join(d.racine, "hooks");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "pre-push"), `#!/bin/sh\n${corps}\n`);
  chmodSync(join(dir, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", dir);
}
function hookDistant(d, corps) {
  writeFileSync(join(d.origine, "hooks", "pre-receive"), `#!/bin/sh\n${corps}\n`);
  chmodSync(join(d.origine, "hooks", "pre-receive"), 0o755);
}
const pousser = (d, refspec, branche, avant = "") =>
  fonction(d, 'pousser "$1" "$2" "$3"', refspec, branche, avant);

test("pousser rend 4 sur un push refusé sans trace de husky, 3 avec la trace, 5 quand la branche a bougé", () => {
  const distant = depotJouet();
  hookDistant(distant, 'echo "règle du dépôt : refus" >&2; exit 1');
  const quatre = pousser(distant, "HEAD:refs/heads/feat/p", "feat/p");
  assert.equal(quatre.status, 4, quatre.stdout + quatre.stderr);
  assert.match(quatre.stderr, /\[git push -q origin HEAD:refs\/heads\/feat\/p\] remote: règle du dépôt : refus/);
  assert.match(quatre.stderr, /push refusé par le distant \(ou échec sans trace du hook pre-push\) : sortie ci-dessus/);
  assert.doesNotMatch(quatre.stderr, /refusé par le hook pre-push :/);

  // Une trace écrite par le distant (« remote: husky - … ») n'est pas celle du hook local.
  const imite = depotJouet();
  hookDistant(imite, `echo "${TRACE_HUSKY}" >&2; exit 1`);
  assert.equal(pousser(imite, "HEAD:refs/heads/feat/p", "feat/p").status, 4);

  const hook = depotJouet();
  hookLocal(hook, `echo "pnpm check rouge" >&2; echo "${TRACE_HUSKY}"; exit 1`);
  const trois = pousser(hook, "HEAD:refs/heads/feat/p", "feat/p");
  assert.equal(trois.status, 3, trois.stdout + trois.stderr);
  assert.match(trois.stderr, /\] pnpm check rouge/);
  assert.match(trois.stderr, /push refusé par le hook pre-push : sortie ci-dessus ; corriger, jamais en sautant le hook/);
  assert.equal(hook.git("ls-remote", "origin", "refs/heads/feat/p"), "", "rien n'est poussé");

  const bouge = depotJouet();
  const avant = bouge.branche("feat/q", "origin/develop", { "q.md": "q\n" });
  bouge.branche("feat/q", "origin/feat/q", { "q2.md": "q2\n" });
  bouge.git("switch", "-q", "--detach", "origin/develop");
  bouge.ecrire("autre.md", "autre\n");
  bouge.commit("docs: autre");
  const cinq = pousser(bouge, "HEAD:refs/heads/feat/q", "feat/q", avant);
  assert.equal(cinq.status, 5, cinq.stdout + cinq.stderr);
});

test("masquer_url : le jeton d'un hook distant est masqué dans ce que relaient jouer_ou_dire, pousser et git_masque, et le code de git est gardé", () => {
  const d = depotJouet();
  hookDistant(d, 'echo "refus : https://x:jeton-secret@exemple.test/regles" >&2; exit 1');
  const relais = [
    fonction(d, 'jouer_ou_dire "git push -q origin HEAD:refs/heads/feat/m"'),
    pousser(d, "HEAD:refs/heads/feat/m", "feat/m"),
    fonction(d, "git_masque push -q origin HEAD:refs/heads/feat/m"),
  ];
  for (const r of relais) {
    assert.notEqual(r.status, 0, r.stderr);
    assert.match(r.stderr, /https:\/\/\*\*\*@exemple\.test\/regles/, r.stderr);
    assert.doesNotMatch(r.stdout + r.stderr, /jeton-secret/);
  }
  const brut = spawnSync("git", ["push", "-q", "origin", "HEAD:refs/heads/feat/m"], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.equal(relais[2].status, brut.status, "git_masque rend le code de git");
  const masque = fonction(d, "printf '%s\\n' 'https://u@h.test/a ssh://git:t0k3n@h.test/b http://h.test/c' | masquer_url");
  assert.equal(masque.stdout, "https://***@h.test/a ssh://***@h.test/b http://h.test/c\n");
  const fetch = fonction(d, "git_masque fetch -q origin develop; echo \"code $?\"");
  assert.equal(fetch.stderr, "");
  assert.equal(fetch.stdout, "code 0\n");
});

test("checks_exiges : une panne n'est jamais « aucun check exigé » (sortie 5) ; des règles vides et une protection absente rendent [] ; une réponse qui n'est pas un tableau sort en 5", () => {
  const d = depotJouet();
  const exiges = () => fonction(d, "checks_exiges");
  d.github({ exiges: ["qualite", "e2e"] });
  assert.equal(exiges().stdout.replace(/\s/g, ""), '["e2e","qualite"]');
  d.github({ pannes: [{ route: "^rules/branches/develop$" }] });
  let r = exiges();
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /GitHub illisible/);
  d.github({ pannes: [{ route: "^rules/branches/develop$", sortie: '{"total":1}', code: 0, erreur: "" }] });
  r = exiges();
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.equal(r.stdout, "");
  d.github({ exiges: [] });
  r = exiges();
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "[]", "règles vides, protection absente (404)");
  d.github({ pannes: [{ route: "protection/required_status_checks$" }] });
  r = exiges();
  assert.equal(r.status, 5, "règles vides, puis protection en panne : jamais []");
  assert.equal(r.stdout, "");
  d.github({ protectionClassique: true, exiges: ["qualite"] });
  assert.equal(exiges().stdout.replace(/\s/g, ""), '["qualite"]');
});

test("checks_commit : un corps vide ou une erreur sort en 5, jamais une liste vide", () => {
  const d = depotJouet();
  const sha = d.git("rev-parse", "HEAD");
  d.github({ checks: { "*": { qualite: "SUCCESS" } } });
  const lire = () => fonction(d, 'checks_commit "$1"', sha);
  assert.equal(lire().stdout, "qualite\tSUCCESS\n");
  for (const panne of [
    { route: "/check-runs", sortie: "", code: 0, erreur: "" },
    { route: "/check-runs" },
    { route: "/check-runs", sortie: '{"message":"Server Error"}', code: 0, erreur: "" },
    { route: "/status$" },
  ]) {
    d.github({ pannes: [panne] });
    const r = lire();
    assert.equal(r.status, 5, `${JSON.stringify(panne)} : ${r.stdout}${r.stderr}`);
    assert.equal(r.stdout, "", JSON.stringify(panne));
  }
});
