// Scripts du capitaine de fusion sur le dépôt jouet : file.sh (ordre et états),
// passer.sh (conflits, revue exigée, checks exigés), renvoyer.sh. GitHub est simulé par le faux
// `gh` de depot-jouet.mjs, qui fusionne pour de vrai dans le dépôt nu ; aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const script = (nom) => scriptDe("fusionner", nom);
const PERIMETRE = "Périmètre des changements";
const REVUE = "## Revue adversariale\n\nRien de bloquant.\n";
const ecritures = (d) => d.journal().map((e) => `${e.methode} ${e.route}`);

// PR ouverte étiquetée à-fusionner, vers develop par défaut.
const pr = (number, head, autres = {}) => ({
  number,
  title: `docs(demo): ${head.replace(/^[a-z]+\//, "")}`,
  head,
  base: "develop",
  labels: ["à-fusionner"],
  ...autres,
});

test("file.sh : sous-PR de sujet, livraisons de sujet (sujet/ et livraison intermédiaire), prio:haute, puis numéro ; CI en cours et rouge signalées", () => {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "lot.md": "lot\n" });
  d.git("push", "-q", "origin", "origin/sujet/lot:refs/heads/livraison/lot-20261109-1200");
  for (const b of [
    "feat/seize",
    "feat/dix-sept",
    "feat/dix-huit",
    "feat/dix-neuf",
    "feat/vingt",
    "fix/vingt-et-un",
  ]) {
    d.branche(b, "origin/develop", { [`${b}.md`]: `${b}\n` });
  }
  d.branche("feat/sous", "origin/sujet/lot", { "sous.md": "sous\n" });
  d.github({
    exiges: ["qualite"],
    checks: {
      "*": { qualite: "SUCCESS" },
      "#19": { qualite: "IN_PROGRESS" },
      "#17": { qualite: "FAILURE" },
    },
    pulls: [
      pr(16, "feat/seize", { labels: ["à-fusionner", "fusion-bloquée"] }),
      pr(17, "feat/dix-sept"),
      pr(18, "feat/dix-huit", { labels: [] }),
      pr(19, "feat/dix-neuf"),
      pr(20, "feat/vingt"),
      pr(21, "fix/vingt-et-un", { labels: ["à-fusionner", "prio:haute"] }),
      pr(22, "sujet/lot"),
      pr(23, "feat/sous", { base: "sujet/lot" }),
      pr(24, "livraison/lot-20261109-1200"),
    ],
  });

  const r = d.lancer(script("file.sh"));
  assert.equal(r.status, 0, r.stderr);
  const lignes = r.stdout
    .trim()
    .split("\n")
    .map((l) => l.split("\t").slice(0, 2).join(" "));
  assert.deepEqual(lignes, [
    "23 sujet/lot : prête",
    "22 prête",
    "24 prête",
    "21 prête",
    "16 bloquée",
    "17 CI rouge : qualite",
    "19 CI en cours",
    "20 prête",
  ]);
  assert.match(r.stdout, /^21\tprête\t\[prio:haute\]/m);
  // --next : la prochaine PR vers develop ; les sous-PR passent par traiter_sujets (boucle.sh).
  assert.equal(d.lancer(script("file.sh"), "--next").stdout, "22\n");
  assert.equal(d.lancer(script("file.sh"), "--rouges").stdout, "17\tqualite\n");
  assert.deepEqual(d.journal(), [], "file.sh ne fait que lire");
});

const ADR = "docs/adr";
const index = (...adr) => adr.map((f) => `- ${f}\n`).join("");

// develop et la PR #30 ajoutent chacun une ADR et régénèrent l'index : conflit sur l'index seul.
function conflitIndex() {
  const d = depotJouet();
  d.ecrire(`${ADR}/ADR_ALL_ARC-1-a.md`, "# 1\n");
  d.ecrire(`${ADR}/README.md`, index("ADR_ALL_ARC-1-a.md"));
  d.commit("docs: adr 1");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.branche("docs/adr-deux", "origin/develop", {
    [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md"),
  });
  d.branche("develop", "origin/develop", {
    [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-3-c.md"),
  });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(30, "docs/adr-deux", { title: "docs(adr): ADR 2" })],
  });
  return d;
}

test("passer.sh : un conflit sur un index généré seul est régénéré, puis la PR est fusionnée", () => {
  const d = conflitIndex();
  const r = d.lancer(script("passer.sh"), "30");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /mise à jour poussée/);
  assert.match(r.stdout, /FUSIONNÉE : [0-9a-f]+, arbre = arbre testé/);
  d.git("fetch", "-q", "origin");
  assert.equal(
    d.developDistant(`${ADR}/README.md`) + "\n",
    index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md", "ADR_ALL_ARC-3-c.md"),
  );
  assert.match(
    d.git("log", "-1", "--format=%s", "origin/develop"),
    /^docs\(adr\): ADR 2 \(#30\)$/,
  );
  assert.deepEqual(ecritures(d), [
    "PUT pulls/30/merge",
    "DELETE issues/30/labels/%C3%A0-fusionner",
  ]);
});

// develop et la PR #31 modifient la même ligne de code.
function conflitCode(corps) {
  const d = depotJouet();
  d.ecrire("apps/api/x.ts", "export const x = 1;\n");
  d.commit("feat: x");
  d.git("push", "-q", "origin", "HEAD:develop");
  const sommet = d.branche("feat/x-deux", "origin/develop", {
    "apps/api/x.ts": "export const x = 2;\n",
  });
  d.branche("develop", "origin/develop", {
    "apps/api/x.ts": "export const x = 3;\n",
  });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(31, "feat/x-deux", { body: corps })],
  });
  return { d, sommet };
}

test("passer.sh : un conflit dans du code n’est jamais résolu, sortie 2 sans écriture", () => {
  const { d, sommet } = conflitCode(REVUE);
  const developAvant = d.git("rev-parse", "origin/develop");
  const r = d.lancer(script("passer.sh"), "31");
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /conflit avec develop hors index générés :\n {2}apps\/api\/x\.ts/,
  );
  d.git("fetch", "-q", "origin");
  assert.equal(
    d.git("rev-parse", "origin/feat/x-deux"),
    sommet,
    "branche de la PR intacte",
  );
  assert.equal(d.git("rev-parse", "origin/develop"), developAvant);
  assert.equal(
    d.git("status", "--porcelain"),
    "",
    "fusion annulée dans le worktree du capitaine",
  );
  assert.deepEqual(d.journal(), []);
});

test("passer.sh : une PR qui touche apps/ sans section « Revue de ticket » ni « Revue adversariale » n’est pas éligible", () => {
  const { d } = conflitCode("Pas de revue.");
  const r = d.lancer(script("passer.sh"), "31");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /sans section « Revue de ticket » ni « Revue adversariale »/,
  );
  assert.deepEqual(d.journal(), []);
});

test("passer.sh : pile dont la parente est squashée, le fichier que seule la PR a changé garde sa version", () => {
  const d = depotJouet();
  d.ecrire("docs/f.md", "0\n");
  d.commit("docs: f");
  d.git("push", "-q", "origin", "HEAD:develop");
  const parente = d.branche("docs/parente", "origin/develop", {
    "docs/f.md": "1\n",
  });
  d.branche("docs/enfant", "origin/docs/parente", { "docs/f.md": "2\n" });
  // Squash de la parente #50 dans develop : même contenu, ascendance perdue.
  d.branche(
    "develop",
    "origin/develop",
    { "docs/f.md": "1\n" },
    "docs: parente (#50)",
  );
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [
      pr(50, "docs/parente", {
        state: "closed",
        merged_at: "2026-10-19T00:00:00Z",
        labels: [],
        sha: parente,
      }),
      pr(51, "docs/enfant", { base: "docs/parente" }),
    ],
  });
  const r = d.lancer(script("passer.sh"), "51");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /conflit de pile résolu : docs\/f\.md \(develop = départ de la pile, version de la PR gardée\)/,
  );
  assert.match(r.stdout, /reciblée sur develop \(parente #50 fusionnée\)/);
  d.git("fetch", "-q", "origin");
  assert.equal(d.developDistant("docs/f.md"), "2");
  assert.deepEqual(ecritures(d), [
    "PATCH pulls/51",
    "PUT pulls/51/merge",
    "DELETE issues/51/labels/%C3%A0-fusionner",
  ]);
});

// PR #32 sans conflit ; checks du sommet : un check non exigé rouge, et `E2E Web` rouge.
function checksRouges(exiges) {
  const d = depotJouet();
  d.branche("feat/simple", "origin/develop", { "docs/simple.md": "simple\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges,
    checks: {
      "*": {
        [PERIMETRE]: "SUCCESS",
        qualite: "SUCCESS",
        "E2E Web": "FAILURE",
        Aikido: "FAILURE",
      },
    },
    pulls: [pr(32, "feat/simple")],
  });
  return d;
}

test("passer.sh : un check exigé rouge (lu dans la protection de develop) donne la sortie 3", () => {
  const d = checksRouges(["qualite", "E2E Web"]);
  const r = d.lancer(script("passer.sh"), "32");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /checks exigés rouges :\n {2}E2E Web : FAILURE/);
  assert.doesNotMatch(r.stdout, /Aikido/);
  assert.deepEqual(d.journal(), [], "ni fusion ni label");
});

test("passer.sh : les checks exigés se lisent aussi dans l'ancienne protection de branche, sans ruleset", () => {
  const d = checksRouges(["qualite", "E2E Web"]);
  d.github({ protectionClassique: true });
  const r = d.lancer(script("passer.sh"), "32");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /E2E Web : FAILURE/);
});

test("passer.sh : un check rouge non exigé ne retient pas la fusion", () => {
  const d = checksRouges(["qualite"]);
  const r = d.lancer(script("passer.sh"), "32");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /déjà à jour avec develop/);
  assert.deepEqual(ecritures(d), [
    "PUT pulls/32/merge",
    "DELETE issues/32/labels/%C3%A0-fusionner",
  ]);
});

test("passer.sh : FORCE_COLOR=1 dans l'environnement du capitaine ne fait refuser aucun titre", () => {
  const d = checksRouges(["qualite"]);
  const r = spawnSync("bash", [script("passer.sh"), "32"], {
    cwd: d.travail,
    env: { ...d.env, FORCE_COLOR: "1" },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(ecritures(d), [
    "PUT pulls/32/merge",
    "DELETE issues/32/labels/%C3%A0-fusionner",
  ]);
});

test("renvoyer.sh : pose fusion-bloquée, retire à-fusionner et commente la cause", () => {
  const d = depotJouet();
  d.branche("feat/renvoi", "origin/develop", { "docs/r.md": "r\n" });
  d.github({ pulls: [pr(40, "feat/renvoi")] });
  const r = d.lancer(
    script("renvoyer.sh"),
    "40",
    "conflit avec develop sur `a.ts`",
  );
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /^\[#40\] RENVOI : conflit avec develop sur `a\.ts`$/m,
  );
  const [pose, retrait, commentaire] = d.journal();
  assert.deepEqual(
    [pose.methode, pose.route, pose.champs],
    ["POST", "issues/40/labels", { "labels[]": "fusion-bloquée" }],
  );
  assert.deepEqual(
    [retrait.methode, retrait.route],
    ["DELETE", "issues/40/labels/%C3%A0-fusionner"],
  );
  assert.equal(commentaire.route, "issues/40/comments");
  assert.match(
    commentaire.champs.body,
    /^\*\*Renvoyée par le capitaine de fusion\*\* : conflit avec develop sur `a\.ts`\./,
  );
  assert.match(
    commentaire.champs.body,
    /retirer `fusion-bloquée` et remettre `à-fusionner`/,
  );
  assert.match(
    commentaire.champs.body,
    /_Generated by \[Claude Code\]\(https:\/\/claude\.ai\/code\)_$/,
  );
  assert.deepEqual(d.etat().pulls[0].labels, ["fusion-bloquée"]);
  assert.match(commentaire.champs.body, /^<!-- renvoi-capitaine -->$/m);
  assert.doesNotMatch(commentaire.champs.body, /attend un humain/);
});

const MARQUE = "<!-- renvoi-capitaine -->";
const renvoi = `**Renvoyée par le capitaine de fusion** : x.\n\n${MARQUE}\n`;

test("renvoyer.sh : au troisième renvoi, le commentaire dit que la PR attend un humain", () => {
  const d = depotJouet();
  d.branche("feat/trois", "origin/develop", { "docs/t.md": "t\n" });
  // Deux renvois déjà marqués ; un commentaire sans marque (ancien renvoi, ou humain) ne compte pas.
  d.github({
    pulls: [pr(41, "feat/trois", { commentaires: [renvoi, "un avis", renvoi, "ancien renvoi sans marque"] })],
  });
  const r = d.lancer(script("renvoyer.sh"), "41", "CI rouge");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^\[#41\] RENVOI : CI rouge$/m);
  assert.match(r.stdout, /^\[#41\] RENVOI 3 sur 3 : la PR attend un humain$/m);
  const commentaire = d.journal().find((e) => e.route === "issues/41/comments");
  assert.match(commentaire.champs.body, /cette PR attend un humain/);
  assert.match(commentaire.champs.body, new RegExp(MARQUE));
  // Les deux labels se posent comme pour un renvoi ordinaire.
  assert.deepEqual(d.etat().pulls[0].labels, ["fusion-bloquée"]);
  // Le plafond vient du contrat : à 5, le troisième renvoi est encore ordinaire.
  const e = depotJouet();
  e.branche("feat/cinq", "origin/develop", { "docs/c.md": "c\n" });
  e.ecrire(".claude/chaine.json", '{"plafonds":{"renvoisParPR":5}}\n');
  e.github({ pulls: [pr(42, "feat/cinq", { commentaires: [renvoi, renvoi] })] });
  const r5 = e.lancer(script("renvoyer.sh"), "42", "x");
  assert.doesNotMatch(r5.stdout, /attend un humain/);
  // Contrat mal formé : valeur par défaut, dite sur la sortie d'erreur, jamais un arrêt.
  const f = depotJouet();
  f.branche("feat/mal", "origin/develop", { "docs/m.md": "m\n" });
  f.ecrire(".claude/chaine.json", '{"plafonds":{"renvoisParPR":"trois"}}\n');
  f.github({ pulls: [pr(43, "feat/mal", { commentaires: [renvoi, renvoi] })] });
  const rm = f.lancer(script("renvoyer.sh"), "43", "x");
  assert.equal(rm.status, 0, rm.stdout + rm.stderr);
  assert.match(rm.stderr, /valeur par défaut 3/);
  assert.match(rm.stdout, /attend un humain/);
});

test("file.sh : une PR renvoyée autant de fois que le plafond est montrée humain, et ni --next ni --rouges ne la rendent", () => {
  const d = depotJouet();
  for (const b of ["feat/a", "feat/b", "feat/c"])
    d.branche(b, "origin/develop", { [`${b}.md`]: `${b}\n` });
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" }, "#52": { qualite: "FAILURE" } },
    pulls: [
      pr(51, "feat/a", { commentaires: [renvoi, renvoi, renvoi] }),
      pr(52, "feat/b", { commentaires: [renvoi, renvoi, renvoi] }),
      pr(53, "feat/c", { commentaires: [renvoi, renvoi] }),
    ],
  });
  const r = d.lancer(script("file.sh"));
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(
    r.stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2).join(" ")),
    ["51 humain", "52 humain", "53 prête"],
  );
  assert.equal(d.lancer(script("file.sh"), "--next").stdout, "53\n");
  assert.equal(d.lancer(script("file.sh"), "--rouges").stdout, "");
  assert.deepEqual(d.journal(), [], "file.sh ne fait que lire");
});

test("renvois : seuls les commentaires du compte du capitaine comptent ; compte illisible, la PR attend un humain", () => {
  const d = depotJouet();
  for (const b of ["feat/a", "feat/b"]) d.branche(b, "origin/develop", { [`${b}.md`]: `${b}\n` });
  // La marque recopiée par un autre compte : trois fois sur #56, une fois sur #57 après deux vrais renvois.
  const autre = { auteur: "un-autre-compte", body: renvoi };
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [
      pr(56, "feat/a", { commentaires: [autre, autre, autre] }),
      pr(57, "feat/b", { commentaires: [renvoi, autre, renvoi] }),
    ],
  });
  const etats = () => d.lancer(script("file.sh")).stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2).join(" "));
  assert.deepEqual(etats(), ["56 prête", "57 prête"]);
  const r56 = d.lancer(script("renvoyer.sh"), "56", "x");
  assert.equal(r56.status, 0, r56.stdout + r56.stderr);
  assert.doesNotMatch(r56.stdout, /attend un humain/);
  assert.match(d.lancer(script("renvoyer.sh"), "57", "x").stdout, /^\[#57\] RENVOI 3 sur 3 : la PR attend un humain$/m);
  // Compte du capitaine illisible : le frein ne se lâche pas, chaque PR attend un humain, et on le dit.
  const e = depotJouet();
  e.branche("feat/c", "origin/develop", { "feat/c.md": "c\n" });
  e.branche("feat/d", "origin/develop", { "feat/d.md": "d\n" });
  e.github({ compteIllisible: true, exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } }, pulls: [pr(58, "feat/c"), pr(59, "feat/d")] });
  const r = e.lancer(script("file.sh"));
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2).join(" ")), ["58 humain", "59 humain"]);
  assert.equal(r.stderr.match(/compte du capitaine illisible \(gh api user\)/g)?.length, 1, r.stderr);
});

test("boucle.sh : une PR à l'état humain n'est ni passée, ni relancée, ni renvoyée", () => {
  const d = depotJouet();
  d.publierChaine();
  d.branche("feat/h", "origin/develop", { "h.md": "h\n" });
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "FAILURE" } },
    runs: { "#60": [{ id: 9, conclusion: "failure", run_attempt: 1 }] },
    pulls: [pr(60, "feat/h", { commentaires: [renvoi, renvoi, renvoi] })],
  });
  const r = d.lancer(script("boucle.sh"));
  assert.match(r.stdout, /FILE VIDE/, r.stdout + r.stderr);
  assert.deepEqual(
    ecritures(d).filter((e) => /^(PUT|POST|DELETE|PATCH) (pulls|issues|actions)/.test(e)),
    [],
  );
});

const TITRE_LONG = `docs(demo): ${"x".repeat(110)}`;

test("passer.sh : titre au-delà de 120 caractères = sortie 4 (à renvoyer) ; brouillon = sortie 7 (sautée)", () => {
  const d = depotJouet();
  d.branche("feat/long", "origin/develop", { "docs/l.md": "l\n" });
  d.branche("feat/brouillon", "origin/develop", { "docs/b.md": "b\n" });
  d.github({
    pulls: [
      pr(60, "feat/long", { title: TITRE_LONG }),
      pr(61, "feat/brouillon", { draft: true }),
    ],
  });
  const long = d.lancer(script("passer.sh"), "60");
  assert.equal(long.status, 4, long.stdout + long.stderr);
  assert.match(long.stdout, /sujet du squash à \d+ caractères \(> 120\)/);
  const brouillon = d.lancer(script("passer.sh"), "61");
  assert.equal(brouillon.status, 7, brouillon.stdout + brouillon.stderr);
  assert.deepEqual(d.journal(), []);
});

test("passer.sh : une PR dont la tête est develop, main ou la branche par défaut est refusée (sortie 4) sans rien pousser", () => {
  const d = depotJouet();
  d.branche("main", "origin/develop", { "docs/m.md": "m\n" }, "docs: main");
  d.branche("trunk", "origin/develop", { "docs/t.md": "t\n" }, "docs: trunk");
  d.branche("develop", "origin/develop", { "docs/d.md": "d\n" }, "docs: develop");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    brancheParDefaut: "trunk",
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(70, "main"), pr(71, "trunk"), pr(72, "develop", { base: "main" })],
  });
  const avant = d.git("ls-remote", "origin");
  for (const [n, tete] of [["70", "main"], ["71", "trunk"], ["72", "develop"]]) {
    const r = d.lancer(script("passer.sh"), n);
    assert.equal(r.status, 4, `#${n} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, new RegExp(`tête de la PR = ${tete}, branche gardée .* le capitaine n'y pousse jamais`));
  }
  assert.equal(d.git("ls-remote", "origin"), avant);
  assert.deepEqual(d.journal(), []);
});

test("sujet.sh fusionner et relancer : une sous-PR dont la tête est develop, main ou un sujet est refusée (sortie 4) sans rien pousser", () => {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "a.md": "a\n" }, "feat(demo): a (#1)");
  d.branche("sujet/autre", "origin/develop", { "o.md": "o\n" }, "feat(demo): o (#2)");
  d.branche("main", "origin/develop", { "m.md": "m\n" }, "docs: main");
  d.git("switch", "-q", "--detach", "origin/develop");
  const sous = (number, head) => ({ number, title: "feat(demo): x", head, base: "sujet/lot", labels: ["à-fusionner"] });
  d.github({ exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } }, pulls: [sous(73, "develop"), sous(74, "main"), sous(75, "sujet/autre")] });
  const avant = d.git("ls-remote", "origin");
  for (const geste of ["fusionner", "relancer"])
    for (const n of ["73", "74", "75"]) {
      const r = d.lancer(scriptDe("sujet", "sujet.sh"), geste, n);
      assert.equal(r.status, 4, `${geste} #${n} : ${r.stdout}${r.stderr}`);
      assert.match(r.stdout, /branche gardée .* le capitaine n'y pousse jamais/);
    }
  assert.equal(d.git("ls-remote", "origin"), avant);
  assert.deepEqual(d.journal(), []);
});

test("boucle.sh : une sous-PR sans CI dont la tête est gardée est renvoyée avec le motif de relancer, rien n'est poussé", () => {
  const d = depotJouet();
  d.publierChaine();
  d.branche("sujet/lot", "origin/develop", { "lot.md": "lot\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks: {}, pulls: [pr(76, "develop", { base: "sujet/lot", title: "feat(demo): x" })] });
  const avant = d.git("ls-remote", "origin");
  const r = d.lancer(script("boucle.sh"));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#76\] RENVOI : #76 : tête develop, branche gardée/);
  assert.deepEqual(d.etat().pulls[0].labels, ["fusion-bloquée"]);
  const commentaire = d.journal().find((e) => e.methode === "POST" && e.route === "issues/76/comments");
  assert.ok(commentaire, `commentaire de renvoi posté : ${JSON.stringify(d.journal())}`);
  assert.match(commentaire.champs.body, /tête develop, branche gardée/);
  assert.equal(d.git("ls-remote", "origin"), avant);
});

test("refus.sh : renvoie la PR avec le dernier motif de la sortie, préfixe retiré", () => {
  const d = depotJouet();
  d.branche("feat/long", "origin/develop", { "docs/l.md": "l\n" });
  d.github({ pulls: [pr(62, "feat/long", { title: TITRE_LONG })] });
  const refus = d.lancer(script("passer.sh"), "62");
  d.ecrire("sortie.txt", refus.stdout);
  const r = d.lancer(script("refus.sh"), "62", "sortie.txt");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /RENVOI : sujet du squash à \d+ caractères \(> 120\) : raccourcir le titre/,
  );
  const commentaire = d.journal().find((e) => e.route === "issues/62/comments");
  assert.match(commentaire.champs.body, /raccourcir le titre de la PR/);
  assert.deepEqual(d.etat().pulls[0].labels, ["fusion-bloquée"]);
});

test("refus.sh : sortie illisible, renvoyée avec un motif de repli", () => {
  const d = depotJouet();
  d.branche("feat/x", "origin/develop", { "docs/x.md": "x\n" });
  d.github({ pulls: [pr(63, "feat/x")] });
  const r = d.lancer(script("refus.sh"), "63", "absent.txt");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(
    r.stdout,
    /RENVOI : refusée en sortie 4, voir le journal du capitaine/,
  );
});

test("boucle.sh : sous-PR et PR vers develop à titre trop long renvoyées avec le motif ; brouillon sauté sans écriture", () => {
  const d = depotJouet();
  d.publierChaine();
  d.branche("sujet/lot", "origin/develop", { "lot.md": "lot\n" });
  d.branche("feat/sous-longue", "origin/sujet/lot", { "sl.md": "sl\n" });
  d.branche("feat/sous-brouillon", "origin/sujet/lot", { "sb.md": "sb\n" });
  d.branche("feat/directe", "origin/develop", { "docs/d.md": "d\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [
      pr(70, "feat/sous-longue", { base: "sujet/lot", title: TITRE_LONG }),
      pr(71, "feat/sous-brouillon", { base: "sujet/lot", draft: true }),
      pr(72, "feat/directe", {
        title: TITRE_LONG,
        labels: ["à-fusionner", "hors-sujet"],
      }),
    ],
  });
  const r = d.lancer(script("boucle.sh"));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  for (const n of [70, 72]) {
    assert.match(
      r.stdout,
      new RegExp(`\\[#${n}\\] RENVOI : sujet du squash à \\d+ caractères`),
    );
  }
  assert.ok(ecritures(d).includes("POST issues/70/comments"));
  assert.ok(ecritures(d).includes("POST issues/72/comments"));
  assert.ok(
    !ecritures(d).some((e) => e.includes("/71/")),
    "brouillon : ni label ni commentaire",
  );
  const labels = Object.fromEntries(
    d.etat().pulls.map((p) => [p.number, p.labels]),
  );
  assert.deepEqual(labels[70], ["fusion-bloquée"]);
  assert.deepEqual(labels[72], ["hors-sujet", "fusion-bloquée"]);
});

// un sujet livré ne se rouvre jamais par automatisme.
const SPEC_LOT = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md";
const CARTE_LOT = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
function depotSujetLivre(phase) {
  const d = depotJouet();
  d.ecrire(SPEC_LOT, "# SPEC_ALL_DEM-1\n\n- **Sujet :** sujet/lot\n");
  d.ecrire(CARTE_LOT, `# SPEC_ALL_DEM-1 — carte\n\nSujet: sujet/lot\n\nPhase: ${phase}\n`);
  d.commit("docs: spec et carte");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.publierChaine();
  d.branche("fix/spec-all-dem-1-02-correctif", "origin/develop", { "docs/c.md": "c\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [pr(80, "fix/spec-all-dem-1-02-correctif", { title: "fix(demo): SPEC_ALL_DEM-1.02 correctif" })],
  });
  return d;
}
const branchesDistantes = (d) => d.git("ls-remote", "--heads", "origin", "sujet/*");

test("file.sh : PR dont le ticket déclare un sujet livré (carte Phase: fini) classée directe, sans écriture", () => {
  const d = depotSujetLivre("fini");
  const r = d.lancer(script("file.sh"));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^80\tprête\t.*\tsujet livré : lot$/m);
  assert.doesNotMatch(r.stdout, /vers sujet/);
  assert.deepEqual(d.journal(), []);
});

test("boucle.sh : sujet livré — hors-sujet posé, ni branche créée ni reciblage", () => {
  const d = depotSujetLivre("6-nettoyage");
  d.lancer(script("boucle.sh"));
  assert.equal(branchesDistantes(d), "", "aucune branche sujet/lot recréée");
  assert.ok(ecritures(d).includes("POST issues/80/labels"));
  assert.ok(!ecritures(d).some((e) => e.startsWith("PATCH pulls/80")), "jamais reciblée");
  assert.ok(d.etat().pulls.every((p) => p.number !== 80 || p.base !== "sujet/lot"));
});

test("file.sh : sujet en cours (Phase: 4-code) — PR toujours reciblée sur le sujet", () => {
  const d = depotSujetLivre("4-code");
  d.git("push", "-q", "origin", "origin/develop:refs/heads/sujet/lot");
  const r = d.lancer(script("file.sh"));
  assert.match(r.stdout, /^80\tvers sujet\/lot\t/m);
  assert.doesNotMatch(r.stdout, /sujet livré/);
});

// une livraison intermédiaire (tête `livraison/<nom>-<date>`) se traite comme une livraison
// de sujet seulement si `sujet/<nom>` existe et que la branche n'apporte qu'un sommet du sujet (fusionné
// avec develop après une mise à jour) : le nom de branche seul ne suffit pas.
const LIVRAISON = "livraison/lot-20261109-1200";
function livraison(tete, sujetContientSommet) {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "lot.md": "lot\n" });
  if (sujetContientSommet) d.git("push", "-q", "origin", `origin/sujet/lot:refs/heads/${tete}`);
  else d.branche(tete, "origin/develop", { "apps/api/l.ts": "export const l = 1;\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(40, tete, { title: "feat(demo): livraison intermédiaire" })],
  });
  return d;
}

test("passer.sh : une vraie livraison intermédiaire est fusionnée par commit de merge", () => {
  const d = livraison(LIVRAISON, true);
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.equal(
    d.git("rev-list", "--parents", "-1", "origin/develop").split(" ").length,
    3,
    "commit de merge : deux parents",
  );
});

test("passer.sh : un faux livraison/* qui ne vient d'aucun sujet repasse par la revue", () => {
  const d = livraison("livraison/x-20261109-1200", false);
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/);
  assert.deepEqual(d.journal(), []);
});

test("passer.sh : livraison/* dont le sommet n'est pas dans sujet/<nom> repasse par la revue", () => {
  const d = livraison(LIVRAISON, false);
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.deepEqual(d.journal(), []);
});

// Livraison intermédiaire de code (revue exigée hors livraison) : develop a bougé, le premier passage
// pousse sur la tête la fusion avec develop, puis s'arrête sur des checks rouges (sortie 3).
function livraisonMiseAJour() {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "apps/api/lot.ts": "export const lot = 1;\n" });
  d.git("push", "-q", "origin", `origin/sujet/lot:refs/heads/${LIVRAISON}`);
  d.branche("develop", "origin/develop", { "docs/autre.md": "autre\n" }, "docs: autre (#39)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "FAILURE" } },
    pulls: [pr(40, LIVRAISON, { title: "feat(demo): livraison intermédiaire" })],
  });
  const premier = d.lancer(script("passer.sh"), "40");
  assert.equal(premier.status, 3, premier.stdout + premier.stderr);
  assert.match(premier.stdout, /mise à jour poussée/);
  d.github({ checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } } });
  return d;
}

test("passer.sh : une livraison intermédiaire mise à jour avec develop reste une livraison (commit de merge, sans revue)", () => {
  const d = livraisonMiseAJour();
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.equal(
    d.git("rev-list", "--parents", "-1", "origin/develop").split(" ").length,
    3,
    "commit de merge : deux parents",
  );
  assert.match(d.git("log", "-1", "--format=%B", "origin/develop"), /^Sujet: sujet\/lot$/m);
});

test("passer.sh : un commit ajouté sur une livraison intermédiaire mise à jour la renvoie à la revue", () => {
  const d = livraisonMiseAJour();
  d.git("fetch", "-q", "origin");
  d.branche(LIVRAISON, `origin/${LIVRAISON}`, { "apps/api/ajout.ts": "export const a = 1;\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/);
});

test("passer.sh : la livraison d'une branche sujet/ nomme son sujet dans le corps du commit de merge", () => {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "docs(demo): lot (#41)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(42, "sujet/lot", { title: "docs(demo): sujet/lot — 1 sous-PR" })],
  });
  const r = d.lancer(script("passer.sh"), "42");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.equal(
    d.git("log", "-1", "--format=%B", "origin/develop"),
    "docs(demo): sujet/lot — 1 sous-PR (#42)\n\n- docs(demo): lot (#41)\n\nSujet: sujet/lot",
  );
});

// =============================================================================
// Gel d'un chantier : les PR d'un sujet gelé prennent l'état « gelée », avant « humain ».
// =============================================================================
const CARTE_GELEE = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
const carteGelee = (gel) =>
  `# SPEC_ALL_DEM-1 — carte\n\nSujet: sujet/lot\n\n## Fiche\n\nPhase: 4-vague-1\n${gel}\n## Fog\n\n- x\n`;

// Sujet `lot` avec sa carte (gel au choix), sa spec ; la sous-PR 90, la livraison 91 (tête sujet/lot,
// tête livraison/…), la PR à recibler 92 (ticket du sujet) et une PR sans rapport 93.
function depotGele(gel) {
  const d = depotJouet();
  d.ecrire(SPEC_LOT, "# SPEC_ALL_DEM-1\n\n- **Sujet :** sujet/lot\n");
  d.commit("docs: spec");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.publierChaine();
  d.branche("sujet/lot", "origin/develop", { [CARTE_GELEE]: carteGelee(gel) });
  d.git("push", "-q", "origin", "origin/sujet/lot:refs/heads/livraison/lot-20261113-1200");
  d.branche("feat/sous", "origin/sujet/lot", { "s.md": "s\n" });
  d.branche("fix/spec-all-dem-1-02-correctif", "origin/develop", { "c.md": "c\n" });
  d.branche("feat/libre", "origin/develop", { "l.md": "l\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [
      pr(90, "feat/sous", { base: "sujet/lot" }),
      pr(91, "sujet/lot"),
      pr(94, "livraison/lot-20261113-1200"),
      pr(92, "fix/spec-all-dem-1-02-correctif", { title: "fix(demo): SPEC_ALL_DEM-1.02 correctif" }),
      pr(93, "feat/libre"),
    ],
  });
  return d;
}
const etatsFile = (d) =>
  Object.fromEntries(
    d.lancer(script("file.sh")).stdout.trim().split("\n").map((l) => l.split("\t")).map(([n, e]) => [n, e]),
  );

test("file.sh : la sous-PR, la PR à recibler et la livraison d'un sujet gelé sont gelées, et ni --next ni --rouges ne les rendent", () => {
  const d = depotGele("Gel: 2026-11-13 — pause\n");
  const e = etatsFile(d);
  assert.deepEqual(e, { 90: "gelée", 91: "gelée", 92: "gelée", 93: "prête", 94: "gelée" });
  assert.equal(d.lancer(script("file.sh"), "--next").stdout, "93\n");
  assert.equal(d.lancer(script("file.sh"), "--rouges").stdout, "");
  assert.deepEqual(d.journal(), [], "file.sh ne fait que lire");
  // Une ligne écrite à la main, sans date, gèle aussi ; vide, elle ne gèle rien.
  assert.equal(etatsFile(depotGele("Gel: pause\n"))[90], "gelée");
  const libre = etatsFile(depotGele("Gel:\n"));
  assert.equal(libre[90], "sujet/lot : prête");
  assert.equal(libre[91], "prête");
  assert.equal(libre[92], "vers sujet/lot");
});

test("file.sh : le gel prime sur « humain » (renvoi_de non appelé), qui revient au dégel", () => {
  const d = depotGele("Gel: 2026-11-13 — pause\n");
  const etat = d.etat();
  etat.pulls.find((p) => p.number === 90).commentaires = [renvoi, renvoi, renvoi];
  d.github(etat);
  assert.equal(etatsFile(d)[90], "gelée");
  const degele = depotGele("Gel:\n");
  const e2 = degele.etat();
  e2.pulls.find((p) => p.number === 90).commentaires = [renvoi, renvoi, renvoi];
  degele.github(e2);
  assert.equal(etatsFile(degele)[90], "humain");
});

test("boucle.sh : une sous-PR d'un sujet gelé n'est ni fusionnée, ni renvoyée, ni reciblée", () => {
  const d = depotGele("Gel: 2026-11-13 — pause\n");
  const r = d.lancer(script("boucle.sh"));
  assert.match(r.stdout, /FILE VIDE|\[#93\]/, r.stdout + r.stderr);
  const ecrit = ecritures(d);
  for (const n of [90, 91, 92, 94])
    assert.ok(!ecrit.some((e) => e.includes(`/${n}`)), `aucune écriture sur #${n} : ${ecrit}`);
  assert.ok(!ecrit.some((e) => /^PATCH pulls/.test(e) && e.includes("/92")), "jamais reciblée");
  assert.match(r.stdout, /\tgelé$/m, "le tableau des sujets montre le verdict gelé");
});

// =============================================================================
// Les scripts passent sous les hooks git : jamais de saut (`--no-verify`). Le jouet reçoit des hooks de
// banc, écrits ici, qui journalisent leur nom et refusent sur demande (un fichier `refus.<hook>` dans la
// racine du jouet) : `pre-commit`, `pre-push`, et un `commit-msg` qui applique `ignores` du
// commitlint.config.mjs. Le contenu du `pre-commit` du socle (ordre de lint-staged et du `unset`) est
// prouvé contre le gabarit par scripts/pre-commit-socle.test.mjs du plugin, jamais posé : le hook d'un
// projet appelle ce que le jouet n'a pas (ses scripts, ses dépendances), il ne s'y joue pas.
// =============================================================================
// Posé dans un projet (depot-jouet.mjs à côté), commitlint.config.mjs est celui de la racine du projet ;
// dans le plugin, celui du socle. Absent, ces tests échouent sur une ligne qui le nomme, jamais sautés.
const POSE = existsSync(new URL("./depot-jouet.mjs", import.meta.url));
const COMMITLINT = fileURLToPath(
  new URL(POSE ? "../../commitlint.config.mjs" : "../../../monorepo/socle-monorepo/references/racine/commitlint.config.mjs", import.meta.url),
);
const REFUS = /pre-push jouet : refus/;

function hooks(d, commitlint = COMMITLINT) {
  if (!existsSync(commitlint)) assert.fail(`fichier manquant : ${commitlint} (posé par socle-monorepo) ; les tests sous les hooks en ont besoin`);
  const dir = join(d.racine, "hooks");
  const journal = join(d.racine, "hooks.log");
  const J = JSON.stringify(journal);
  mkdirSync(dir);
  const poser = (nom, corps) => {
    writeFileSync(join(dir, nom), `#!/bin/sh\n${corps}\n`);
    chmodSync(join(dir, nom), 0o755);
  };
  const refuse = (nom) =>
    `if [ -e ${JSON.stringify(join(d.racine, `refus.${nom}`))} ]; then echo "${nom} jouet : refus" >&2; exit 1; fi`;
  poser("pre-commit", `echo pre-commit >> ${J}\n${refuse("pre-commit")}`);
  poser("pre-push", `echo pre-push >> ${J}\n${refuse("pre-push")}`);
  writeFileSync(
    join(dir, "commit-msg.mjs"),
    `import { readFileSync } from "node:fs";
const { default: config } = await import(${JSON.stringify(commitlint)});
const msg = readFileSync(process.argv[2], "utf8");
if ((config.ignores ?? [(m) => /^Merge /.test(m)]).some((f) => f(msg))) process.exit(0);
if (!/^(feat|fix|docs|chore|refactor|test)(\\([a-z-]+\\))?: .+/.test(msg)) { console.error("commit-msg jouet : message refusé"); process.exit(1); }
`,
  );
  poser("commit-msg", `echo commit-msg >> ${J}\n${refuse("commit-msg")}\nexec node "$(dirname "$0")/commit-msg.mjs" "$1"`);
  d.git("config", "core.hooksPath", dir);
  const lire = () => (existsSync(journal) ? readFileSync(journal, "utf8").trim().split("\n") : []);
  const refuser = (nom) => writeFileSync(join(d.racine, `refus.${nom}`), "");
  return { lire, refuser, pushes: () => lire().filter((l) => l === "pre-push").length };
}
const distant = (d) => d.git("ls-remote", "origin");
const sansFusion = (d) => assert.throws(() => d.git("rev-parse", "-q", "--verify", "MERGE_HEAD"), "aucune fusion en cours");

test("passer.sh : un conflit d'index conclu sous les hooks (pre-commit, commit-msg, pre-push)", () => {
  const d = conflitIndex();
  const h = hooks(d);
  const r = d.lancer(script("passer.sh"), "30");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const lus = h.lire();
  assert.ok(lus.includes("pre-commit"), "pre-commit joué sur le commit de fusion");
  assert.ok(lus.includes("commit-msg"), "commit-msg joué sur le commit de fusion");
  assert.ok(lus.includes("pre-push"), "pre-push joué");
  assert.match(d.git("log", "-1", "--format=%s", "origin/develop"), /^docs\(adr\): ADR 2 \(#30\)$/);
});

test("passer.sh : un pre-push qui refuse donne la sortie 3, sa sortie sur stderr, le distant inchangé et un worktree propre", () => {
  const d = conflitIndex();
  const h = hooks(d);
  h.refuser("pre-push");
  const avant = distant(d);
  const r = d.lancer(script("passer.sh"), "30");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stderr, REFUS, "la sortie du hook est visible");
  assert.match(r.stderr, /jamais en sautant le hook/);
  assert.doesNotMatch(r.stdout + r.stderr, /a bougé/);
  assert.equal(distant(d), avant);
  assert.equal(d.git("status", "--porcelain"), "");
  assert.equal(h.pushes(), 1);
});

test("passer.sh : un commit-msg qui refuse la fusion sans conflit donne la sortie 3, sans fusion en cours", () => {
  const d = depotJouet();
  d.branche("feat/c", "origin/develop", { "c.md": "c\n" });
  d.branche("develop", "origin/develop", { "x.md": "x\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(31, "feat/c")],
  });
  const h = hooks(d);
  h.refuser("commit-msg");
  const avant = distant(d);
  const r = d.lancer(script("passer.sh"), "31");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stderr, /commit-msg jouet : refus/);
  sansFusion(d);
  assert.equal(d.git("status", "--porcelain"), "");
  assert.equal(distant(d), avant);
});

test("passer.sh : un pre-commit qui refuse le commit de fusion donne la sortie 3, sa sortie sur stderr, sans fusion en cours, distant inchangé", () => {
  const d = conflitIndex();
  const h = hooks(d);
  h.refuser("pre-commit");
  const avant = distant(d);
  const r = d.lancer(script("passer.sh"), "30");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stderr, /pre-commit jouet : refus/);
  sansFusion(d);
  assert.equal(d.git("status", "--porcelain"), "");
  assert.equal(distant(d), avant);
  assert.equal(h.pushes(), 0, "rien n'est poussé");
});

test("passer.sh : un commitlint.config.mjs sans ignores laisse passer le commit de fusion du capitaine", () => {
  const d = conflitIndex();
  const sansIgnores = join(d.racine, "commitlint.config.mjs");
  writeFileSync(sansIgnores, "export default { extends: ['@commitlint/config-conventional'] };\n");
  const h = hooks(d, sansIgnores);
  const r = d.lancer(script("passer.sh"), "30");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(h.lire().includes("commit-msg"), "commit-msg joué sur le commit de fusion");
  assert.match(d.git("log", "-1", "--format=%s", "origin/develop"), /^docs\(adr\): ADR 2 \(#30\)$/);
});

// Sous-PR #80 et sujet/lot qui ajoutent chacun une ADR : conflit sur l'index seul.
function sousPrConflitIndex() {
  const d = depotJouet();
  d.ecrire(`${ADR}/ADR_ALL_ARC-1-a.md`, "# 1\n");
  d.ecrire(`${ADR}/README.md`, index("ADR_ALL_ARC-1-a.md"));
  d.commit("docs: adr 1");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("docs/sous", "origin/develop", {
    [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md"),
  });
  d.branche("sujet/lot", "origin/develop", {
    [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-3-c.md"),
  });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 80, title: "docs(adr): ADR 2", head: "docs/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" }],
  });
  return d;
}

test("sujet.sh fusionner : une sous-PR en conflit d'index passe sous les hooks (sortie 8) ; un pre-push qui refuse donne 3, pas 5", () => {
  const d = sousPrConflitIndex();
  const h = hooks(d);
  const r = d.lancer(scriptDe("sujet", "sujet.sh"), "fusionner", "80");
  assert.equal(r.status, 8, r.stdout + r.stderr);
  const lus = h.lire();
  for (const attendu of ["pre-commit", "commit-msg", "pre-push"]) assert.ok(lus.includes(attendu), `${attendu} : ${lus}`);

  const refus = sousPrConflitIndex();
  hooks(refus).refuser("pre-push");
  const avant = distant(refus);
  const x = refus.lancer(scriptDe("sujet", "sujet.sh"), "fusionner", "80");
  assert.equal(x.status, 3, x.stdout + x.stderr);
  assert.match(x.stdout + x.stderr, REFUS);
  assert.equal(distant(refus), avant);
});

// Les cinq gestes de sujet.sh qui poussent : chacun un jouet prêt, sa commande, et le sort attendu.
const CARTE_SUJET = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
function sujetCarte() {
  const d = depotJouet();
  d.ecrire("docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md", "# SPEC_ALL_DEM-1\n\nSujet: sujet/demo\n");
  d.ecrire(CARTE_SUJET, "# carte\n\nSujet: sujet/demo\n\n## Fiche\n\nPhase: 4-vagues\n\n## Decisions-so-far\n\n- A-1 — x\n");
  d.commit("docs: spec et carte");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.branche("sujet/demo", "origin/develop", { "docs/x.md": "x\n" }, "feat(demo): x (#1)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [] });
  return d;
}
const sujetEnRetard = () => {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "a.md": "a\n" }, "feat(demo): a (#1)");
  d.branche("feat/s", "origin/sujet/lot", { "s.md": "s\n" });
  d.branche("sujet/lot", "origin/sujet/lot", { "b.md": "b\n" }, "feat(demo): b (#2)");
  d.git("switch", "-q", "--detach", "origin/develop");
  return d;
};
const GESTES = {
  ouvrir: () => ({ d: depotJouet(), args: ["ouvrir", "demo"] }),
  "livrer intermédiaire": () => ({ d: sujetCarte(), args: ["livrer", "demo", "feat(demo): livraison intermédiaire"] }),
  rafraichir: () => {
    const d = depotJouet();
    d.branche("sujet/lot", "origin/develop", { "a.md": "a\n" }, "feat(demo): a (#1)");
    d.branche("develop", "origin/develop", { "b.md": "b\n" });
    d.git("switch", "-q", "--detach", "origin/develop");
    return { d, args: ["rafraichir", "lot"] };
  },
  relancer: () => {
    const d = sujetEnRetard();
    d.github({ pulls: [{ number: 50, title: "feat(demo): s", head: "feat/s", base: "sujet/lot", labels: [] }] });
    return { d, args: ["relancer", "50"] };
  },
  geler: () => ({ d: sujetCarte(), args: ["geler", "demo", "le produit change d'avis"] }),
};

test("sujet.sh : ouvrir, livrer intermédiaire, rafraichir, relancer et geler réveillent le pre-push", () => {
  for (const [nom, fabrique] of Object.entries(GESTES)) {
    const { d, args } = fabrique();
    const h = hooks(d);
    const r = d.lancer(scriptDe("sujet", "sujet.sh"), ...args);
    assert.equal(r.status, 0, `${nom} : ${r.stdout}${r.stderr}`);
    assert.ok(h.pushes() >= 1, `${nom} : le pre-push n'a pas été joué`);
  }
});

test("sujet.sh : un pre-push qui refuse donne 3 (geler : au premier essai, hook joué une fois, pas 9), distant inchangé, sortie du hook visible", () => {
  for (const [nom, fabrique] of Object.entries(GESTES)) {
    const { d, args } = fabrique();
    const h = hooks(d);
    h.refuser("pre-push");
    const avant = distant(d);
    const r = d.lancer(scriptDe("sujet", "sujet.sh"), ...args);
    assert.equal(r.status, 3, `${nom} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout + r.stderr, REFUS, `${nom} : sortie du hook`);
    assert.equal(distant(d), avant, `${nom} : distant inchangé`);
    if (nom === "geler") assert.equal(h.pushes(), 1, "pas de second essai");
    if (nom === "livrer intermédiaire") assert.ok(!d.journal().some((e) => e.methode === "POST" && e.route === "pulls"), "aucune PR ouverte");
    assert.equal(d.git("status", "--porcelain"), "", `${nom} : worktree propre`);
  }
});
