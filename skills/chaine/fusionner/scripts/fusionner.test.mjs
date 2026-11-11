// Scripts du capitaine de fusion sur le dépôt jouet : file.sh (ordre et états),
// passer.sh (conflits, revue exigée, checks exigés), renvoyer.sh. GitHub est simulé par le faux
// `gh` de depot-jouet.mjs, qui fusionne pour de vrai dans le dépôt nu ; aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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
