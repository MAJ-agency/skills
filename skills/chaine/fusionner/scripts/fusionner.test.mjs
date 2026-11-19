// Scripts du capitaine de fusion sur le dépôt jouet : file.sh (ordre et états),
// passer.sh (conflits, revue exigée, checks exigés), renvoyer.sh. GitHub est simulé par le faux
// `gh` de depot-jouet.mjs, qui fusionne pour de vrai dans le dépôt nu ; aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
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
// Écritures sur GitHub, hors commentaires du verrou du passage (posé, rafraîchi, terminé ou retiré par chaque passage,
// ticket 4 de capitaine-a-jour-et-teste) : les bancs du verrou les lisent dans le journal brut (`d.journal()`).
const passage = (e) => (/^issues\/\d+\/comments$|^issues\/comments\/\d+$/.test(e.route) && (e.methode === "DELETE" || (e.champs?.body ?? "").includes("<!-- capitaine:passage ")));
const horsPassage = (d) => d.journal().filter((e) => !passage(e));
const ecritures = (d) => horsPassage(d).map((e) => `${e.methode} ${e.route}`);

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
  assert.deepEqual(horsPassage(d), []);
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
  assert.deepEqual(horsPassage(d), [], "ni fusion ni label");
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
    env: { ...d.env, FORCE_COLOR: "1", NO_COLOR: undefined },
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

test("renvoyer.sh : le refus « plusieurs fusions » d'une PR de mise à jour dit de la refaire dans une nouvelle PR, pas de remettre le label", () => {
  const d = depotJouet();
  d.branche("maj/lot", "origin/develop", { "docs/r.md": "r\n" });
  d.github({ pulls: [pr(41, "maj/lot")] });
  const r = d.lancer(script("renvoyer.sh"), "41", "#41, PR de mise à jour : une seule fusion de develop dans sujet/lot, jamais une seconde fusion. Refaire la réception");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const commentaire = d.journal().find((e) => e.route === "issues/41/comments");
  assert.match(commentaire.champs.body, /ouvrir une nouvelle PR vers le sujet et fermer celle-ci/);
  assert.doesNotMatch(commentaire.champs.body, /remettre `à-fusionner`/);
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

// GitHub ne lance pas la CI d'une PR qu'il ne sait pas fusionner : sans CI et `mergeable_state` « dirty », elle est
// « prête (en conflit) » ; état pas encore calculé (`null`, `unknown`) ou PR propre : « prête (sans CI) ».
test("file.sh : une PR sans CI que GitHub dit en conflit se lit prête (en conflit), vers develop comme vers un sujet ; état inconnu : prête (sans CI)", () => {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "docs/s.md": "lot\n" });
  d.branche("feat/s", "origin/develop", { "docs/s.md": "sous\n" });
  for (const b of ["feat/a", "feat/b", "feat/c", "feat/d"]) d.branche(b, "origin/develop", { "docs/d.md": `${b}\n` });
  d.branche("develop", "origin/develop", { "docs/d.md": "develop\n" });
  d.branche("feat/propre", "origin/develop", { "docs/p.md": "p\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "#95": { qualite: "SUCCESS" } },
    pulls: [
      pr(90, "feat/a"),
      pr(91, "feat/propre"),
      pr(92, "feat/b", { mergeableState: null }),
      pr(93, "feat/c", { mergeableState: "unknown" }),
      pr(94, "feat/s", { base: "sujet/lot", title: "feat(demo): s" }),
      pr(95, "feat/d"),
    ],
  });
  const etats = Object.fromEntries(
    d.lancer(script("file.sh")).stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2)),
  );
  assert.deepEqual(etats, {
    90: "prête (en conflit)",
    91: "prête (sans CI)",
    92: "prête (sans CI)",
    93: "prête (sans CI)",
    94: "sujet/lot : prête (en conflit)",
    95: "prête",
  });
  assert.deepEqual(d.journal(), [], "file.sh ne fait que lire");
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
  // Un login mal formé (une espace) vaut un compte illisible : même message, une fois, même plafond.
  const f = depotJouet();
  f.branche("feat/e", "origin/develop", { "feat/e.md": "e\n" });
  f.github({ capitaine: "un compte", exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } }, pulls: [pr(60, "feat/e")] });
  const m = f.lancer(script("file.sh"));
  assert.equal(m.status, 0, m.stderr);
  assert.deepEqual(m.stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2).join(" ")), ["60 humain"]);
  assert.equal(m.stderr.match(/compte du capitaine illisible \(gh api user\)/g)?.length, 1, m.stderr);
});

test("renvois : LOGIN_CAPITAINE hérité de l'environnement n'est jamais lu, ni pour un autre compte ni pour « ? »", () => {
  for (const herite of ["intrus", "?"]) {
    const d = depotJouet();
    d.branche("feat/f", "origin/develop", { "feat/f.md": "f\n" });
    // Un renvoi du capitaine, deux recopiés par « intrus » : seul le premier compte.
    d.github({
      exiges: ["qualite"],
      checks: { "*": { qualite: "SUCCESS" } },
      pulls: [pr(61, "feat/f", { commentaires: [renvoi, { auteur: "intrus", body: renvoi }, { auteur: "intrus", body: renvoi }] })],
    });
    d.env.LOGIN_CAPITAINE = herite;
    const r = d.lancer(script("renvoyer.sh"), "61", "x");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^\[#61\] RENVOI : x$/m, `LOGIN_CAPITAINE=${herite} : ${r.stdout}${r.stderr}`);
    assert.doesNotMatch(r.stdout + r.stderr, /attend un humain|illisible/);
  }
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

// Les lectures `git diff --name-only` qui décident d'une dispense lisent sans détection des renommages :
// un fichier déplacé ou supprimé derrière un renommage compte à son ancien chemin.
const GARDE = "scripts/verify/gate-securite.mjs";
// Chaque cas : le geste de la PR sur sa branche, partie de develop (qui porte la garde).
const DISPENSES = {
  "un script déplacé hors de scripts/": (d) => d.git("mv", GARDE, "docs/garde.md"),
  "un fichier de code à nom accentué (chemin cité par git sans core.quotePath=false)": (d) => {
    d.ecrire("apps/api/éligibilité.ts", "export const e = 1;\n");
    d.git("add", "-A");
  },
};
test("passer.sh : la revue exigée lit les chemins sans renommage ni guillemets (script déplacé hors de scripts/, code à nom accentué)", () => {
  for (const [cas, geste] of Object.entries(DISPENSES)) {
    const d = depotJouet();
    d.ecrire(GARDE, "export const garde = true;\n");
    d.commit("chore: garde");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    d.git("switch", "-q", "-C", "docs/deplace", "origin/develop");
    geste(d);
    d.git("commit", "-q", "-m", "docs: déplace la garde");
    d.git("push", "-q", "origin", "HEAD:refs/heads/docs/deplace");
    d.git("fetch", "-q", "origin");
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({
      exiges: ["qualite"],
      checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
      pulls: [pr(31, "docs/deplace", { body: "Rien.\n" })],
    });
    const r = d.lancer(script("passer.sh"), "31");
    assert.equal(r.status, 4, `${cas} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, cas);
    assert.deepEqual(d.journal(), [], cas);
  }
});

test("passer.sh : une livraison intermédiaire qui supprime un fichier derrière un index généré renommé repasse par la revue", () => {
  const d = depotJouet();
  // Un index généré par motif (`docs/generes/*.json`) : un chemin neuf sous ce motif est un index.
  d.ecrire(
    "scripts/docs/index-generes.json",
    JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, "docs/generes/*.json"] }),
  );
  d.ecrire(GARDE, "export const garde = true;\n");
  d.commit("chore: garde");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "apps/api/lot.ts": "export const lot = 1;\n" });
  d.git("switch", "-q", "-C", LIVRAISON, "origin/sujet/lot");
  d.ecrire("docs/generes/garde.json", "export const garde = true;\n");
  d.git("rm", "-q", GARDE);
  d.commit("docs: index");
  d.git("push", "-q", "origin", `HEAD:refs/heads/${LIVRAISON}`);
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(40, LIVRAISON, { title: "feat(demo): livraison intermédiaire" })],
  });
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/);
  assert.deepEqual(d.journal(), []);
});

// Livraison intermédiaire d'un sujet qui change `docs/genere.json`, index généré sans `commande` (chaîne
// nue de la liste) que develop change aussi. Le premier passage la met à jour avec develop : le conflit,
// sur un index seul, prend la version de develop ; puis il s'arrête sur des checks rouges (sortie 3).
// `apres(d)` agit ensuite sur la livraison, avant le second passage, checks verts.
function livraisonIndexSansCommande(apres = () => {}) {
  const d = depotJouet();
  d.ecrire(
    "scripts/docs/index-generes.json",
    JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, "docs/genere.json"] }),
  );
  d.ecrire("docs/genere.json", "0\n");
  d.commit("docs: index sans commande");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "apps/api/lot.ts": "export const lot = 1;\n", "docs/genere.json": "sujet\n" });
  d.git("push", "-q", "origin", `origin/sujet/lot:refs/heads/${LIVRAISON}`);
  d.branche("develop", "origin/develop", { "docs/genere.json": "develop\n" }, "docs: genere (#39)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "FAILURE" } },
    pulls: [pr(40, LIVRAISON, { title: "feat(demo): livraison intermédiaire" })],
  });
  const premier = d.lancer(script("passer.sh"), "40");
  assert.equal(premier.status, 3, premier.stdout + premier.stderr);
  assert.match(premier.stdout, /mise à jour poussée/);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("show", `origin/${LIVRAISON}:docs/genere.json`), "develop", "version de develop prise au conflit");
  apres(d);
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } } });
  return d;
}

test("passer.sh : une livraison intermédiaire dont un index sans commande est celui de develop reste une livraison (sans revue)", () => {
  const d = livraisonIndexSansCommande();
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-list", "--parents", "-1", "origin/develop").split(" ").length, 3, "commit de merge : deux parents");
});

test("passer.sh : une livraison intermédiaire dont un index sans commande n'est pas celui de develop (autre contenu, ou retiré) repasse par la revue", () => {
  const gestes = {
    "autre contenu": (d) => d.branche(LIVRAISON, `origin/${LIVRAISON}`, { "docs/genere.json": '{"pirate":true}\n' }, "docs: genere"),
    retiré: (d) => {
      d.git("switch", "-q", "-C", LIVRAISON, `origin/${LIVRAISON}`);
      d.git("rm", "-q", "docs/genere.json");
      d.git("commit", "-q", "-m", "docs: genere retiré");
      d.git("push", "-q", "origin", `HEAD:refs/heads/${LIVRAISON}`);
    },
  };
  for (const [cas, geste] of Object.entries(gestes)) {
    const d = livraisonIndexSansCommande(geste);
    const avant = d.git("rev-parse", "origin/develop");
    const r = d.lancer(script("passer.sh"), "40");
    assert.equal(r.status, 4, `${cas} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, cas);
    d.git("fetch", "-q", "origin");
    assert.equal(d.git("rev-parse", "origin/develop"), avant, `${cas} : develop inchangé`);
  }
});

// Les outils de la chaîne copiés dans un dossier du jouet, `github.sh` sans `index_regeneres_regex` : une
// copie du capitaine plus ancienne que `sujet.sh` ou `passer.sh`. La liste des index régénérés ne se lit pas.
function outilsSansRegeneres(d) {
  const dossier = join(d.racine, "outils");
  mkdirSync(dossier);
  const outils = [["sujet", "sujet.sh"], ...["passer.sh", "github.sh", "revue-exigee.mjs", "migrations-ordre.mjs", "identifiant.mjs"].map((n) => ["fusionner", n])];
  for (const [skill, nom] of outils) {
    const texte = readFileSync(scriptDe(skill, nom), "utf8");
    writeFileSync(join(dossier, nom), nom === "github.sh" ? texte.replace(/\nindex_regeneres_regex\(\) \{\n[\s\S]*?\n\}\n/, "\n") : texte);
  }
  assert.doesNotMatch(readFileSync(join(dossier, "github.sh"), "utf8"), /index_regeneres_regex\(\)/);
  return dossier;
}

test("passer.sh : sans liste lisible des index régénérés, une livraison dont un index sans commande n'est pas celui de develop repasse par la revue", () => {
  const d = livraisonIndexSansCommande((d) => d.branche(LIVRAISON, `origin/${LIVRAISON}`, { "docs/genere.json": '{"pirate":true}\n' }, "docs: genere"));
  const r = d.lancer(join(outilsSansRegeneres(d), "passer.sh"), "40");
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
  // Un refus écrit aussi la trace de husky 9 (`.husky/_/h`), comme le hook d'un projet : sans elle, un refus du
  // pre-push se lit comme un refus du distant (pousser, github.sh).
  const refuse = (nom) =>
    `if [ -e ${JSON.stringify(join(d.racine, `refus.${nom}`))} ]; then echo "${nom} jouet : refus" >&2; echo "husky - ${nom} script failed (code 1)"; exit 1; fi`;
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
  const sommet = d.branche("docs/sous", "origin/develop", {
    [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md"),
  });
  d.branche("sujet/lot", "origin/develop", {
    [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-3-c.md"),
  });
  d.git("switch", "-q", "--detach", "origin/develop");
  // Checks verts sur l'ancien sommet seul : le nouveau, poussé par le capitaine, n'en a pas (sortie 8).
  d.github({
    exiges: ["qualite"],
    checks: { [sommet]: { qualite: "SUCCESS" } },
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

// Ce que la chaîne exécute ou lit pour juger, et du code d'une autre casse : une PR vers develop qui les change,
// sans section de revue, n'entre pas (avant : sortie 0, fusionnée sans revue).
const CONFIGURATION_CHAINE = [".github/workflows/ci.yml", ".husky/pre-push", ".claude/settings.json", "package.json", "pnpm-lock.yaml", "Apps/api/x.ts", "docs/prettier.config.mjs", "infra/deploy.sh", "docs/package.yaml", "docs/package.yml", "docs/x/package.json5"];
test("passer.sh : une PR qui touche la configuration de la chaîne (CI, hooks, agent, install) ou du code d'une autre casse sans section de revue n'est pas éligible", () => {
  for (const f of CONFIGURATION_CHAINE) {
    const d = depotJouet();
    d.branche("chore/x", "origin/develop", { [f]: "x\n" }, "chore: x");
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({
      exiges: ["qualite"],
      checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
      pulls: [pr(31, "chore/x", { title: "chore: x", body: "Rien.\n" })],
    });
    const r = d.lancer(script("passer.sh"), "31");
    assert.equal(r.status, 4, `${f} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, f);
    assert.deepEqual(d.journal(), [], f);
  }
});

// Le contrat d'origin/develop ajoute au plancher ses chemins sensibles et son fichier des critères ; ce que l'agent
// lit (CLAUDE.md, docs/agents/) l'exige aussi. Une PR qui retire son chemin de chaine.json n'y échappe pas.
test("passer.sh : un chemin sensible du projet, le fichier des critères, CLAUDE.md et docs/agents/ exigent la revue, même quand la PR retire le chemin de chaine.json", () => {
  const cas = {
    "chemin sensible du projet": (d) => d.ecrire("infra/main.tf", "x\n"),
    "retiré de chaine.json par la PR": (d) => {
      d.ecrire(".claude/chaine.json", JSON.stringify({ cheminsSensibles: [], criteresRevue: "docs/revue/criteres.md" }));
      d.ecrire("infra/main.tf", "x\n");
    },
    "fichier des critères": (d) => d.ecrire("docs/revue/criteres.md", "S1 rien\n"),
    "CLAUDE.md": (d) => d.ecrire("docs/CLAUDE.md", "x\n"),
    "docs/agents/": (d) => d.ecrire("docs/agents/pieges.md", "x\n"),
  };
  for (const [nom, geste] of Object.entries(cas)) {
    const d = depotJouet();
    d.ecrire(".claude/chaine.json", JSON.stringify({ cheminsSensibles: ["infra/**"], criteresRevue: "docs/revue/criteres.md" }));
    d.commit("chore: contrat");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    d.git("switch", "-q", "-C", "docs/x", "origin/develop");
    geste(d);
    d.commit("docs: x");
    d.git("push", "-q", "origin", "HEAD:refs/heads/docs/x");
    d.git("fetch", "-q", "origin");
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({
      exiges: ["qualite"],
      checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
      pulls: [pr(31, "docs/x", { title: "docs: x", body: "Rien.\n" })],
    });
    const r = d.lancer(script("passer.sh"), "31");
    assert.equal(r.status, 4, `${nom} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, nom);
    assert.deepEqual(d.journal(), [], nom);
  }
});

// Un index généré (docs/, entré sans revue) remplacé par un lien symbolique : la régénération écrivait à travers
// lui, hors du dépôt (lien absolu) ou dans un autre fichier (lien relatif, worktree sale), en sortie 0.
function prLienSurIndex(cible) {
  const d = depotJouet();
  writeFileSync(join(d.racine, "dehors.txt"), "à moi\n");
  d.git("switch", "-q", "-C", "docs/lien", "origin/develop");
  d.ecrire(`${ADR}/ADR_ALL_ARC-2-b.md`, "# 2\n");
  d.git("rm", "-q", `${ADR}/README.md`);
  symlinkSync(cible(d), join(d.travail, `${ADR}/README.md`));
  d.git("add", "-A");
  d.git("commit", "-q", "-m", "docs(adr): ADR 2");
  d.git("push", "-q", "origin", "HEAD:refs/heads/docs/lien");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(31, "docs/lien", { title: "docs(adr): ADR 2", body: "Rien.\n" })],
  });
  return d;
}
test("passer.sh : un index généré remplacé par un lien symbolique (absolu ou relatif) est refusé (sortie 4), rien n'est écrit à travers lui", () => {
  for (const [cas, cible] of [["absolu", (d) => join(d.racine, "dehors.txt")], ["relatif", () => "../../README.md"]]) {
    const d = prLienSurIndex(cible);
    const r = d.lancer(script("passer.sh"), "31");
    assert.equal(r.status, 4, `${cas} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /lien symbolique sur un index généré ou son dossier : docs\/adr\/README\.md/, cas);
    assert.equal(readFileSync(join(d.racine, "dehors.txt"), "utf8"), "à moi\n", `${cas} : rien d'écrit hors du dépôt`);
    assert.equal(d.lire("README.md"), "jouet\n", `${cas} : rien d'écrit dans un autre fichier`);
    assert.equal(d.git("status", "--porcelain"), "", cas);
    assert.deepEqual(d.journal(), [], cas);
  }
});

// Le même lien déjà dans develop (entré avant cette version) : une PR qui ne le touche pas n'est pas renvoyée pour
// lui, et la régénération s'arrête avant d'écrire (sortie 3, que la boucle porte au capitaine).
test("passer.sh : un lien symbolique déjà dans develop sur un index généré arrête la régénération (sortie 3) sans renvoyer la PR, rien n'est écrit à travers lui", () => {
  const d = depotJouet();
  const dehors = join(d.racine, "dehors.txt");
  writeFileSync(dehors, "à moi\n");
  d.git("rm", "-q", `${ADR}/README.md`);
  mkdirSync(join(d.travail, ADR), { recursive: true });
  symlinkSync(dehors, join(d.travail, `${ADR}/README.md`));
  d.commit("docs: lien");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("docs/adr-2", "origin/develop", { [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n" }, "docs(adr): ADR 2");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(31, "docs/adr-2", { title: "docs(adr): ADR 2", body: "Rien.\n" })],
  });
  const r = d.lancer(script("passer.sh"), "31");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stderr, /lien symbolique sur un index généré ou son dossier : docs\/adr\/README\.md/);
  assert.equal(readFileSync(dehors, "utf8"), "à moi\n", "rien d'écrit hors du dépôt");
  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucune fusion");
});

// Livraison intermédiaire d'un projet dont un index est déclaré par motif, avec une `commande` (`apps/gen/*.ts`) :
// la régénération réécrit `a.ts` et ne retire pas un fichier en trop. `geste(d)` agit sur la livraison.
const GEN = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('apps/gen', { recursive: true });\nwriteFileSync('apps/gen/a.ts', 'export const a = 1;\\n');\n";
function livraisonMotif(geste) {
  const d = depotJouet();
  d.ecrire("scripts/docs/gen.mjs", GEN);
  d.ecrire(
    "scripts/docs/index-generes.json",
    JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, { chemin: "apps/gen/*.ts", commande: "node scripts/docs/gen.mjs" }] }),
  );
  d.ecrire("apps/gen/a.ts", "export const a = 1;\n");
  d.ecrire("apps/gen/ancien.ts", "export const ancien = 1;\n");
  d.commit("chore: index par motif");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  d.git("switch", "-q", "-C", LIVRAISON, "origin/sujet/lot");
  geste(d);
  d.commit("docs: index");
  d.git("push", "-q", "origin", `HEAD:refs/heads/${LIVRAISON}`);
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(40, LIVRAISON, { title: "feat(demo): livraison intermédiaire" })],
  });
  return d;
}
test("passer.sh : une livraison intermédiaire qui ajoute ou réécrit un fichier sous un index déclaré par motif repasse par la revue", () => {
  const gestes = {
    "fichier en trop": (d) => d.ecrire("apps/gen/pirate.ts", "export const pirate = 1;\n"),
    "ancien fichier réécrit": (d) => d.ecrire("apps/gen/ancien.ts", "export const pirate = 1;\n"),
  };
  for (const [cas, geste] of Object.entries(gestes)) {
    const d = livraisonMotif(geste);
    const avant = d.git("rev-parse", "origin/develop");
    const r = d.lancer(script("passer.sh"), "40");
    assert.equal(r.status, 4, `${cas} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, cas);
    d.git("fetch", "-q", "origin");
    assert.equal(d.git("rev-parse", "origin/develop"), avant, `${cas} : develop inchangé`);
  }
});

// Garde de non-régression : le fichier sous le motif que la mise à jour a pris de develop (conflit sur un index seul,
// `commande` qui ne le réécrit pas) reste dispensé. Une variante qui renverrait tout fichier sous un motif à la
// revue la ferait sortir en 4.
test("passer.sh : une livraison intermédiaire dont un fichier sous un index par motif est celui de develop reste une livraison (sans revue)", () => {
  const d = depotJouet();
  d.ecrire(
    "scripts/docs/index-generes.json",
    JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, { chemin: "docs/generes/*.json", commande: "true" }] }),
  );
  d.ecrire("docs/generes/a.json", "0\n");
  d.commit("docs: index par motif");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "apps/api/lot.ts": "export const lot = 1;\n", "docs/generes/a.json": "sujet\n" });
  d.git("push", "-q", "origin", `origin/sujet/lot:refs/heads/${LIVRAISON}`);
  d.branche("develop", "origin/develop", { "docs/generes/a.json": "develop\n" }, "docs: a (#39)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "FAILURE" } },
    pulls: [pr(40, LIVRAISON, { title: "feat(demo): livraison intermédiaire" })],
  });
  const premier = d.lancer(script("passer.sh"), "40");
  assert.equal(premier.status, 3, premier.stdout + premier.stderr);
  assert.match(premier.stdout, /mise à jour poussée/);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("show", `origin/${LIVRAISON}:docs/generes/a.json`), "develop", "version de develop prise au conflit");
  d.github({ checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } } });
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-list", "--parents", "-1", "origin/develop").split(" ").length, 3, "commit de merge : deux parents");
});

// Revue des propriétaires (CODEOWNERS, « Require review from Code Owners » sur la base) : une PR qui
// l'attend n'est ni rouge ni bloquée. file.sh la montre « attend un propriétaire », le capitaine la saute
// sans la renvoyer et la reprend au tour suivant, une fois approuvée. Seuls comptent les propriétaires du
// CODEOWNERS de la base, demandés comme relecteurs. Une fusion refusée faute d'approbation laisse un
// commentaire marqué : la PR « attend un humain » jusqu'à une approbation plus récente.
const MOTIF_PROPRIETAIRE = /attend l'approbation d'un propriétaire \(CODEOWNERS\) : sautée sans renvoi, reprise au tour suivant/;
const MARQUE_ATTENTE = "<!-- attente-revue-capitaine -->";
const CODEOWNERS = "# propriétaires de la chaîne\n* @Proprietaire @exemple/Securite\n/docs/ @exemple/docs # commentaire @pas-un-proprietaire\n";

function attenteProprietaire(etat = {}, { codeowners = CODEOWNERS, chemin = ".github/CODEOWNERS" } = {}) {
  const d = depotJouet();
  if (codeowners !== null) {
    d.ecrire(chemin, codeowners);
    d.commit("chore: CODEOWNERS");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
  }
  const sommets = {};
  for (const b of ["feat/proprio", "feat/libre", "feat/seul"]) sommets[b] = d.branche(b, "origin/develop", { [`docs/${b}.md`]: `${b}\n` });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    revueProprietaires: ["develop"],
    pulls: [
      pr(70, "feat/proprio", { relecteurs: ["proprietaire"] }),
      pr(71, "feat/libre"),
    ],
    ...etat,
  });
  return { d, sommets };
}
const etats = (d) =>
  d.lancer(script("file.sh")).stdout.trim().split("\n").map((l) => l.split("\t").slice(0, 2).join(" "));

test("file.sh : une PR vers develop qui attend un propriétaire se lit « attend un propriétaire », et ni --next ni --rouges ne la rendent", () => {
  const { d } = attenteProprietaire();
  assert.deepEqual(etats(d), ["70 attend un propriétaire", "71 prête"]);
  assert.equal(d.lancer(script("file.sh"), "--next").stdout, "71\n");
  assert.equal(d.lancer(script("file.sh"), "--rouges").stdout, "");
  assert.deepEqual(d.journal(), [], "file.sh ne fait que lire");
});

test("file.sh : seul un propriétaire du CODEOWNERS de la base fait attendre — utilisateur, puis équipe (casse ignorée), jamais un relecteur demandé à la main", () => {
  const { d } = attenteProprietaire({ pulls: [pr(70, "feat/proprio", { relecteurs: ["quelqu-un", "pas-un-proprietaire"] })] });
  assert.deepEqual(etats(d), ["70 prête"], "relecteur demandé à la main, hors CODEOWNERS (ni en commentaire)");
  d.github({ pulls: [pr(70, "feat/proprio", { relecteurs: ["PROPRIETAIRE"] })] });
  assert.deepEqual(etats(d), ["70 attend un propriétaire"]);
  d.github({ pulls: [pr(70, "feat/proprio", { equipes: ["securite"] })] });
  assert.deepEqual(etats(d), ["70 attend un propriétaire"]);
  d.github({ pulls: [pr(70, "feat/proprio", { equipes: ["autre-equipe"] })] });
  assert.deepEqual(etats(d), ["70 prête"]);
  d.github({ protectionClassique: true, pulls: [pr(70, "feat/proprio", { relecteurs: ["proprietaire"] })] });
  assert.deepEqual(etats(d), ["70 attend un propriétaire"], "ancienne protection de branche");
});

test("file.sh : CODEOWNERS lu comme GitHub (racine, puis docs/) ; absent de la base, aucun propriétaire connu : prête", () => {
  for (const chemin of ["CODEOWNERS", "docs/CODEOWNERS"]) {
    const { d } = attenteProprietaire({}, { chemin });
    assert.deepEqual(etats(d), ["70 attend un propriétaire", "71 prête"], chemin);
  }
  const { d } = attenteProprietaire({}, { codeowners: null });
  assert.deepEqual(etats(d), ["70 prête", "71 prête"]);
});

test("file.sh : approuvée (relecteurs retirés par GitHub), la PR revient prête ; sans la règle sur la base, un propriétaire demandé ne retient rien", () => {
  const { d } = attenteProprietaire();
  d.github({ pulls: [pr(70, "feat/proprio", { relecteurs: [] }), pr(71, "feat/libre")] });
  assert.deepEqual(etats(d), ["70 prête", "71 prête"]);
  d.github({ revueProprietaires: [], pulls: [pr(70, "feat/proprio", { relecteurs: ["proprietaire"] })] });
  assert.deepEqual(etats(d), ["70 prête"]);
  d.github({ revueProprietaires: ["main"] });
  assert.deepEqual(etats(d), ["70 prête"], "la règle de main ne vaut pas pour une PR vers develop");
});

test("file.sh : une CI rouge reste « CI rouge » même quand la PR attend un propriétaire ; en cours, elle attend le propriétaire", () => {
  const { d } = attenteProprietaire({ checks: { "*": { qualite: "SUCCESS" }, "#70": { qualite: "FAILURE" } } });
  assert.deepEqual(etats(d), ["70 CI rouge : qualite", "71 prête"]);
  assert.equal(d.lancer(script("file.sh"), "--rouges").stdout, "70\tqualite\n");
  d.github({ checks: { "*": { qualite: "SUCCESS" }, "#70": { qualite: "IN_PROGRESS" } } });
  assert.deepEqual(etats(d), ["70 attend un propriétaire", "71 prête"]);
});

test("passer.sh : une PR qui attend un propriétaire sort en 7 avant toute mise à jour : rien poussé, commenté ni étiqueté", () => {
  const { d, sommets } = attenteProprietaire();
  const r = d.lancer(script("passer.sh"), "70");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, MOTIF_PROPRIETAIRE);
  assert.deepEqual(d.journal(), []);
  assert.equal(d.git("ls-remote", "origin", "refs/heads/feat/proprio").split(/\s/)[0], sommets["feat/proprio"]);
});

test("passer.sh : une fusion refusée faute d'approbation d'un propriétaire sort en 7, pas en 5, commente avec la marque et garde le label ; relancé, il sort en 7 sans rien écrire", () => {
  const { d } = attenteProprietaire({ pulls: [pr(72, "feat/seul", { approbationManquante: true })] });
  const r = d.lancer(script("passer.sh"), "72");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, MOTIF_PROPRIETAIRE);
  assert.doesNotMatch(r.stdout, /fusion refusée \(develop ou la PR a bougé\)/);
  assert.deepEqual(ecritures(d), ["PUT pulls/72/merge", "POST issues/72/comments"]);
  // Le commentaire d'attente, à côté de celui du verrou du passage (terminé).
  const commentaire = d.etat().pulls[0].commentaires.find((c) => typeof c === "string" && c.includes(MARQUE_ATTENTE));
  assert.ok(commentaire, JSON.stringify(d.etat().pulls[0].commentaires));
  assert.match(commentaire, /GitHub a refusé la fusion : l'approbation d'un propriétaire \(CODEOWNERS\) manque\. Le capitaine ne met plus cette PR à jour avant une nouvelle approbation\./);
  assert.match(commentaire, /\n\n---\n_Generated by \[Claude Code\]\(https:\/\/claude\.ai\/code\)_$/);
  assert.deepEqual(d.etat().pulls[0].labels, ["à-fusionner"]);
  assert.deepEqual(etats(d), ["72 attend un humain"]);
  const encore = d.lancer(script("passer.sh"), "72");
  assert.equal(encore.status, 7, encore.stdout + encore.stderr);
  assert.match(encore.stdout, /attend un humain/);
  assert.deepEqual(ecritures(d), ["PUT pulls/72/merge", "POST issues/72/comments"], "rien de plus");
});

const commentaireAttente = (created_at, auteur = "capitaine") => ({
  auteur,
  created_at,
  body: `${MARQUE_ATTENTE}\nGitHub a refusé la fusion.\n`,
});

test("file.sh : « attend un humain » jusqu'à une approbation plus récente que le dernier commentaire marqué ; une approbation plus ancienne ou un autre avis ne suffit pas ; la marque d'un autre compte ne compte pas", () => {
  const { d } = attenteProprietaire({
    pulls: [pr(72, "feat/seul", { commentaires: [commentaireAttente("2026-11-17T10:00:00Z")], revues: [{ state: "APPROVED", submitted_at: "2026-11-17T09:00:00Z" }, { state: "COMMENTED", submitted_at: "2026-11-17T11:00:00Z" }] })],
  });
  assert.deepEqual(etats(d), ["72 attend un humain"]);
  assert.equal(d.lancer(script("file.sh"), "--next").stdout, "");
  assert.equal(d.lancer(script("file.sh"), "--rouges").stdout, "");
  d.github({
    pulls: [pr(72, "feat/seul", { commentaires: [commentaireAttente("2026-11-17T10:00:00Z"), commentaireAttente("2026-11-17T12:00:00Z")], revues: [{ state: "APPROVED", submitted_at: "2026-11-17T11:00:00Z" }] })],
  });
  assert.deepEqual(etats(d), ["72 attend un humain"], "approbation antérieure au dernier commentaire marqué");
  d.github({
    pulls: [pr(72, "feat/seul", { commentaires: [commentaireAttente("2026-11-17T10:00:00Z")], revues: [{ state: "APPROVED", submitted_at: "2026-11-17T11:00:00Z" }] })],
  });
  assert.deepEqual(etats(d), ["72 prête"], "nouvelle approbation : évaluation normale");
  d.github({ pulls: [pr(72, "feat/seul", { commentaires: [commentaireAttente("2026-11-17T10:00:00Z", "intrus")] })] });
  assert.deepEqual(etats(d), ["72 prête"], "marque écrite par un autre compte : ignorée");
  d.github({ pulls: [pr(72, "feat/seul", { commentaires: [commentaireAttente("2026-11-17T10:00:00Z")] })], compteIllisible: true });
  const r = d.lancer(script("file.sh"));
  assert.match(r.stdout, /^72\thumain/m, "compte illisible : fermé, comme les renvois");
  const p = d.lancer(script("passer.sh"), "72");
  assert.equal(p.status, 7, p.stdout + p.stderr);
  assert.match(p.stdout, /attend un humain/);
  assert.match(p.stderr, /compte du capitaine illisible/);
  assert.equal(d.journal().length, 0);
});

test("boucle.sh : les PR qui attendent un propriétaire sont sautées sans renvoi ni relance, une PR prête passe ; au tour suivant, rien n'est poussé sur celle qui attend un humain", () => {
  const { d } = attenteProprietaire();
  d.publierChaine();
  d.github({
    pulls: [
      pr(70, "feat/proprio", { relecteurs: ["proprietaire"] }),
      pr(71, "feat/libre"),
      pr(72, "feat/seul", { approbationManquante: true }),
    ],
  });
  const r = d.lancer(script("boucle.sh"));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /FILE VIDE/);
  assert.match(r.stdout, /\[#71\] FUSIONNÉE/);
  assert.match(r.stdout, /\[#72\] sortie=7/);
  assert.doesNotMatch(r.stdout, /\[#70\] (DÉBUT|RENVOI)/);
  const ecrit = () => ecritures(d).filter((e) => /^(PUT|POST|DELETE|PATCH) (pulls|issues|actions)/.test(e));
  assert.deepEqual(ecrit(), ["PUT pulls/71/merge", "DELETE issues/71/labels/%C3%A0-fusionner", "PUT pulls/72/merge", "POST issues/72/comments"]);
  const etatFinal = d.etat();
  for (const n of [70, 72]) assert.deepEqual(etatFinal.pulls.find((x) => x.number === n).labels, ["à-fusionner"], `#${n} garde son label`);
  assert.equal(etatFinal.pulls.find((x) => x.number === 70).commentaires, undefined, "#70 n'est pas commentée");
  d.git("fetch", "-q", "origin");
  const tete = d.git("rev-parse", "origin/feat/seul");
  const encore = d.lancer(script("boucle.sh"));
  assert.equal(encore.status, 0, encore.stdout + encore.stderr);
  assert.doesNotMatch(encore.stdout, /\[#72\] DÉBUT/);
  assert.deepEqual(ecrit(), ["PUT pulls/71/merge", "DELETE issues/71/labels/%C3%A0-fusionner", "PUT pulls/72/merge", "POST issues/72/comments"], "rien de plus au tour suivant");
  assert.equal(d.git("ls-remote", "origin", "refs/heads/feat/seul").split(/\s/)[0], tete, "rien poussé sur #72");
});

test("file.sh : une CI rouge prime sur « attend un humain » : la PR marquée est relancée puis renvoyée comme une autre", () => {
  const { d } = attenteProprietaire({
    checks: { "*": { qualite: "SUCCESS" }, "#72": { qualite: "FAILURE" } },
    pulls: [pr(72, "feat/seul", { commentaires: [commentaireAttente("2026-11-17T10:00:00Z")] })],
  });
  assert.deepEqual(etats(d), ["72 CI rouge : qualite"]);
  assert.equal(d.lancer(script("file.sh"), "--rouges").stdout, "72\tqualite\n");
  d.github({ checks: { "*": { qualite: "SUCCESS" }, "#72": { qualite: "IN_PROGRESS" } } });
  assert.deepEqual(etats(d), ["72 attend un humain"], "CI en cours : l'attente reste");
});

test("passer.sh : commentaire d'attente impossible à poser après un refus de fusion pour revue : sortie 3 (arrêt), pas 7 ; la boucle s'arrête sans le repasser", () => {
  // Le commentaire d'attente seul est refusé : celui du verrou du passage se pose.
  const { d } = attenteProprietaire({ commentairesRefuses: "attente-revue-capitaine", pulls: [pr(72, "feat/seul", { approbationManquante: true })] });
  const r = d.lancer(script("passer.sh"), "72");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /commentaire d'attente non posé/);
  assert.deepEqual(ecritures(d), ["PUT pulls/72/merge", "POST issues/72/comments"]);
  assert.deepEqual(d.etat().pulls[0].labels, ["à-fusionner"]);
  const e = attenteProprietaire({ commentairesRefuses: "attente-revue-capitaine", pulls: [pr(72, "feat/seul", { approbationManquante: true })] }).d;
  e.publierChaine();
  const b = e.lancer(script("boucle.sh"));
  assert.equal(b.status, 3, b.stdout + b.stderr);
  assert.match(b.stdout, /ARRÊT sur #72 \(sortie 3\)/);
  assert.doesNotMatch(b.stdout, /second essai|PAUSE/);
  assert.equal(ecritures(e).filter((x) => x === "PUT pulls/72/merge").length, 1, "un essai : la boucle ne le repasse pas");
});

// ── Règle d'ascendance : la cible qui bouge pendant la CI, l'arbre du squash différent de l'arbre testé ──────────
// Le défaut vécu sur `fedora` (2026-11-18) : #1986 squashée sur un develop que son sommet testé ne contenait pas,
// malgré le réglage « strict » de GitHub.
const fusionsDe = (d, n) => d.journal().filter((e) => e.methode === "PUT" && e.route === `pulls/${n}/merge`);
const shaDe = (d, n) => JSON.parse(fusionsDe(d, n)[0].entree).sha;
const SUJET_SH = scriptDe("sujet", "sujet.sh");

// PR #40 vers develop, en retard d'un commit ; `deplacements` commits de code empilés sur la branche `ailleurs`,
// que develop rejoint l'un après l'autre pendant la CI (à la deuxième lecture des checks depuis le précédent).
function cibleQuiBouge(deplacements) {
  const d = depotJouet();
  const origine = d.branche("feat/b", "origin/develop", { "docs/b.md": "b\n" });
  d.branche("develop", "origin/develop", { "docs/avant.md": "avant\n" });
  const vers = [];
  for (let i = 0; i < deplacements; i++)
    vers.push(d.branche("ailleurs", i ? "origin/ailleurs" : "origin/develop", { [`apps/b${i}.ts`]: `export const b${i} = ${i};\n` }));
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    strict: ["develop"],
    // En cours, puis vert, compté par sha : une CI lue sur l'ancien sommet se voit dans `lectures`.
    checks: { "*": { qualite: ["IN_PROGRESS", "SUCCESS"] } },
    pendantCi: vers.map((v) => ({ lectures: 2, branche: "develop", vers: v })),
    pulls: [pr(40, "feat/b")],
  });
  return { d, origine, vers };
}

// Contre-relecture (M1) : develop rejoint pendant la CI un commit en conflit mixte (code et index généré) ; le contrôle
// d'ascendance d'avant le squash ne nomme que le fichier hors index.
test("passer.sh : conflit mixte avec develop après la CI, seuls les fichiers hors index générés sont listés", () => {
  const d = depotJouet();
  d.ecrire(`${ADR}/ADR_ALL_ARC-1-a.md`, "# 1\n");
  d.ecrire(`${ADR}/README.md`, index("ADR_ALL_ARC-1-a.md"));
  d.commit("docs: adr 1");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("docs/m", "origin/develop", {
    "docs/m.md": "pr\n",
    [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md"),
  });
  const vers = d.branche("ailleurs", "origin/develop", {
    "docs/m.md": "develop\n",
    [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-3-c.md"),
  });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: ["IN_PROGRESS", "SUCCESS"], qualite: ["IN_PROGRESS", "SUCCESS"] } },
    pendantCi: [{ lectures: 2, branche: "develop", vers }],
    pulls: [pr(41, "docs/m", { title: "docs(adr): ADR 2" })],
  });
  const r = d.lancer(script("passer.sh"), "41");
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stdout, /conflit avec develop hors index générés :\n {2}docs\/m\.md\n?/);
  assert.doesNotMatch(r.stdout, /^ {2}docs\/adr\/README\.md$/m);
  assert.equal(fusionsDe(d, 41).length, 0, "aucun PUT");
});

test("cible qui bouge pendant la CI : mise à jour reprise, deux fois au plus", () => {
  const { d, origine, vers } = cibleQuiBouge(1);
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal((r.stdout.match(/mise à jour poussée/g) ?? []).length, 2, r.stdout);
  assert.match(r.stdout, /develop a bougé pendant la CI : nouvelle mise à jour \(1 sur 2\)/);
  assert.match(r.stdout, /FUSIONNÉE : [0-9a-f]+, arbre = arbre testé/);
  d.git("fetch", "-q", "origin");
  const second = d.git("rev-parse", "origin/feat/b");
  const premier = d.git("rev-parse", `${second}^1`);
  assert.equal(d.git("rev-parse", `${premier}^1`), origine, "deux poussées sur la branche de la PR");
  const lectures = d.etat().lectures;
  assert.equal(lectures[origine], undefined, "jamais de CI lue sur l'ancien sommet, en retard");
  assert.ok(lectures[premier] >= 2 && lectures[second] >= 2, `CI attendue sur chaque sommet poussé : ${JSON.stringify(lectures)}`);
  assert.equal(shaDe(d, 40), second, "le PUT porte le second sommet");
  assert.equal(d.git("merge-base", "--is-ancestor", vers[0], second), "", "le second sommet contient le nouveau develop");

  // Trois déplacements de suite : sortie 5, aucun PUT.
  const trois = cibleQuiBouge(3);
  const x = trois.d.lancer(script("passer.sh"), "40");
  assert.equal(x.status, 5, x.stdout + x.stderr);
  assert.match(x.stdout, /develop a bougé trois fois pendant la CI, relancer/);
  assert.match(x.stdout, /nouvelle mise à jour \(2 sur 2\)/);
  assert.equal(fusionsDe(trois.d, 40).length, 0, "aucun PUT");
});

test("cible qui bouge pendant la CI : mise à jour reprise, deux fois au plus — une sous-PR dont le sujet bouge pendant attendre_ci n'est jamais squashée sur l'ancien sujet", () => {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "feat(lot): lot (#1)");
  const ancien = d.branche("feat/sous", "origin/sujet/lot", { "docs/sous.md": "sous\n" });
  const vers = d.branche("ailleurs", "origin/sujet/lot", { "apps/b.ts": "export const b = 1;\n" }, "feat(lot): b (#2)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pendantCi: [{ lectures: 2, branche: "sujet/lot", vers }],
    pulls: [{ number: 80, title: "docs(lot): sous", head: "feat/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien.\n" }],
  });
  const r = d.lancer(SUJET_SH, "fusionner", "80");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/lot a bougé pendant la CI : nouvelle mise à jour \(1 sur 2\)/);
  d.git("fetch", "-q", "origin");
  const nouveau = d.git("rev-parse", "origin/feat/sous");
  assert.equal(d.git("rev-parse", `${nouveau}^1`), ancien);
  assert.equal(d.git("rev-parse", `${nouveau}^2`), vers, "mise à jour avec le sujet qui a bougé");
  assert.equal(shaDe(d, 80), nouveau, "jamais squashée sur l'ancien sujet");
});

// PR #41 (et #42, prête) vers develop, sans « strict » ; une fusion concurrente (`apps/c.ts`) entre dans develop juste
// avant celle de #41 : GitHub l'accepte, et l'arbre du squash n'est plus l'arbre testé.
function arbreDifferent() {
  const d = depotJouet();
  d.publierChaine();
  d.branche("feat/c", "origin/develop", { "docs/c.md": "c\n" });
  d.branche("feat/d", "origin/develop", { "docs/d.md": "d\n" });
  const concurrent = d.branche("concurrent", "origin/develop", { "apps/c.ts": "export const c = 1;\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    avantFusion: { branche: "develop", vers: concurrent },
    pulls: [pr(41, "feat/c"), pr(42, "feat/d")],
  });
  return d;
}
function verifierCommentaireArbre(d, n) {
  const p = d.etat().pulls.find((x) => x.number === n);
  const commentaire = (p.commentaires ?? []).find((c) => c.includes("<!-- arbre-different-capitaine -->"));
  assert.ok(commentaire, JSON.stringify(p.commentaires));
  assert.match(commentaire, /arbre du squash ≠ arbre testé/);
  assert.match(commentaire, /squash : `[0-9a-f]{40}` \(arbre `[0-9a-f]{40}`\)/);
  assert.match(commentaire, /sommet testé : `[0-9a-f]{40}` \(arbre `[0-9a-f]{40}`\)/);
  assert.match(commentaire, /apps\/c\.ts/);
  assert.match(commentaire, /_Generated by \[Claude Code\]\(https:\/\/claude\.ai\/code\)_$/);
  assert.ok(!p.labels.includes("à-fusionner"), "à-fusionner retiré");
}

test("arbre du squash différent de l'arbre testé : sortie 12, commentaire, ARRÊT de la boucle", () => {
  const d = arbreDifferent();
  const r = d.lancer(script("passer.sh"), "41");
  assert.equal(r.status, 12, r.stdout + r.stderr);
  assert.match(r.stdout, /ARBRE DIFFÉRENT : #41/);
  verifierCommentaireArbre(d, 41);

  const b = arbreDifferent();
  const x = b.lancer(script("boucle.sh"));
  assert.equal(x.status, 12, x.stdout + x.stderr);
  assert.match(x.stdout, /ARRÊT sur #41 \(sortie 12\)/);
  assert.equal(fusionsDe(b, 42).length, 0, "#42, pourtant prête, n'est pas passée");
  verifierCommentaireArbre(b, 41);
});

test("arbre du squash différent de l'arbre testé : sortie 12, commentaire, ARRÊT de la boucle — sous-PR, le code remonte du sous-shell de traiter_sujets", () => {
  const d = depotJouet();
  d.publierChaine();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "feat(lot): lot (#1)");
  d.branche("feat/sous", "origin/sujet/lot", { "docs/sous.md": "sous\n" });
  const concurrent = d.branche("concurrent", "origin/sujet/lot", { "apps/c.ts": "export const c = 1;\n" }, "feat(lot): c (#2)");
  d.branche("feat/d", "origin/develop", { "docs/d.md": "d\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    avantFusion: { branche: "sujet/lot", vers: concurrent },
    pulls: [
      { number: 41, title: "docs(lot): sous", head: "feat/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien.\n" },
      pr(42, "feat/d"),
    ],
  });
  const s = d.lancer(SUJET_SH, "fusionner", "41");
  assert.equal(s.status, 12, s.stdout + s.stderr);
  verifierCommentaireArbre(d, 41);

  const b = depotJouet();
  b.publierChaine();
  b.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "feat(lot): lot (#1)");
  b.branche("feat/sous", "origin/sujet/lot", { "docs/sous.md": "sous\n" });
  const c2 = b.branche("concurrent", "origin/sujet/lot", { "apps/c.ts": "export const c = 1;\n" }, "feat(lot): c (#2)");
  b.branche("feat/d", "origin/develop", { "docs/d.md": "d\n" });
  b.git("switch", "-q", "--detach", "origin/develop");
  b.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    avantFusion: { branche: "sujet/lot", vers: c2 },
    pulls: [
      { number: 41, title: "docs(lot): sous", head: "feat/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien.\n" },
      pr(42, "feat/d"),
    ],
  });
  const x = b.lancer(script("boucle.sh"));
  assert.equal(x.status, 12, x.stdout + x.stderr);
  assert.match(x.stdout, /ARRÊT sur #41 \(sortie 12\)/);
  assert.equal(fusionsDe(b, 42).length, 0, "la boucle s'arrête avant #42");
});

test("cible qui bouge pendant la CI : mise à jour reprise, deux fois au plus — le sujet qui bouge trois fois fait sortir sujet.sh en 5, sans squash", () => {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "feat(lot): lot (#1)");
  d.branche("feat/sous", "origin/sujet/lot", { "docs/sous.md": "sous\n" });
  const vers = [];
  for (let i = 0; i < 3; i++)
    vers.push(d.branche("ailleurs", i ? "origin/ailleurs" : "origin/sujet/lot", { [`apps/b${i}.ts`]: `export const b${i} = ${i};\n` }, `feat(lot): b${i} (#${i + 2})`));
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pendantCi: vers.map((v) => ({ lectures: 2, branche: "sujet/lot", vers: v })),
    pulls: [{ number: 80, title: "docs(lot): sous", head: "feat/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien.\n" }],
  });
  const r = d.lancer(SUJET_SH, "fusionner", "80");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(r.stdout, /nouvelle mise à jour \(2 sur 2\)/);
  assert.match(r.stdout, /sujet\/lot a bougé trois fois pendant la CI de #80/);
  assert.equal(fusionsDe(d, 80).length, 0, "aucun PUT");
});

// Clone `--single-branch` (refspec qui ne couvre pas la cible) : un simple `git fetch origin <cible>` ne met pas à jour
// origin/<cible>, et le contrôle d'ascendance jugerait une cible périmée. Les scripts relisent la cible par un refspec
// explicite.
const refspecRestreint = (d, branche) => d.git("config", "remote.origin.fetch", `+refs/heads/${branche}:refs/remotes/origin/${branche}`);

test("cible qui bouge pendant la CI, clone --single-branch : passer.sh relit develop par un refspec explicite", () => {
  const { d, vers } = cibleQuiBouge(1);
  refspecRestreint(d, "feat/b");
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /develop a bougé pendant la CI : nouvelle mise à jour \(1 sur 2\)/);
  assert.equal(d.git("merge-base", "--is-ancestor", vers[0], shaDe(d, 40)), "", "le sommet fusionné contient le develop qui a bougé");
});

test("cible qui bouge pendant la CI, clone --single-branch : sujet.sh relit le sujet par un refspec explicite", () => {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "feat(lot): lot (#1)");
  d.branche("feat/sous", "origin/sujet/lot", { "docs/sous.md": "sous\n" });
  const vers = d.branche("ailleurs", "origin/sujet/lot", { "apps/b.ts": "export const b = 1;\n" }, "feat(lot): b (#2)");
  d.git("switch", "-q", "--detach", "origin/develop");
  refspecRestreint(d, "feat/sous");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pendantCi: [{ lectures: 2, branche: "sujet/lot", vers }],
    pulls: [{ number: 80, title: "docs(lot): sous", head: "feat/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien.\n" }],
  });
  const r = d.lancer(SUJET_SH, "fusionner", "80");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/lot a bougé pendant la CI : nouvelle mise à jour \(1 sur 2\)/);
  assert.equal(d.git("merge-base", "--is-ancestor", vers, shaDe(d, 80)), "", "jamais squashée sur l'ancien sujet");
});

// ── GitHub illisible et refus du pre-push (ticket 9) ─────────────────────────────────────────────────────────────
// Une panne de GitHub n'est jamais un état : le script qui lisait sort en 5 (pause de la boucle). Un push refusé se
// classe par la trace de husky : refus du hook, la PR est renvoyée avec la sortie du hook ; sans trace, refus du
// distant, la boucle s'arrête (passer.sh) ou sujet.sh sort en 11, sans renvoi.
function prSimple() {
  const d = depotJouet();
  d.branche("feat/simple", "origin/develop", { "docs/simple.md": "s\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } }, pulls: [pr(33, "feat/simple")] });
  return d;
}

test("passer.sh : une panne de GitHub pendant l'attente de la CI sort en 5, jamais « CI non déclenchée »", () => {
  // Un 502 au corps vide, puis un 200 au corps vide : ni l'un ni l'autre n'est « aucun check ».
  for (const panne of [{ sortie: "" }, { sortie: "", code: 0, erreur: "" }]) {
    const d = prSimple();
    d.github({ pannes: [{ route: "/check-runs", fois: 40, ...panne }] });
    const r = d.lancer(script("passer.sh"), "33");
    assert.equal(r.status, 5, `${JSON.stringify(panne)} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /GitHub illisible pendant l'attente de la CI : pause, puis reprise/);
    assert.match(r.stderr, /GitHub illisible \(.*check-runs/);
    assert.doesNotMatch(r.stdout, /CI non déclenchée/);
    assert.deepEqual(horsPassage(d), [], "ni fusion ni label");
  }
});

test("passer.sh : la PR illisible sort en 5 avant toute écriture", () => {
  const d = prSimple();
  d.github({ pannes: [{ route: "^pulls/33$", sortie: "<html>502</html>" }] });
  const r = d.lancer(script("passer.sh"), "33");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(r.stdout, /GitHub illisible/);
  assert.deepEqual(d.journal(), []);
});

test("file.sh : GitHub illisible, sortie 5 et rien sur la sortie standard", () => {
  for (const panne of [
    { route: "^pulls\\?" },
    { route: "^rules/branches/develop$", sortie: '{"message":"Server Error"}', code: 0, erreur: "" },
    { route: "/check-runs", sortie: "" },
  ]) {
    const d = prSimple();
    d.github({ pulls: [pr(33, "feat/simple"), pr(34, "feat/simple", { title: "docs(demo): autre" })], pannes: [{ fois: 9, ...panne }] });
    for (const args of [[], ["--next"], ["--rouges"]]) {
      const r = d.lancer(script("file.sh"), ...args);
      assert.equal(r.status, 5, `${panne.route} ${args} : ${r.stdout}${r.stderr}`);
      assert.equal(r.stdout, "", `${panne.route} ${args}`);
      assert.match(r.stderr, /GitHub illisible/);
    }
  }
  // Une PR lisible d'abord, puis une PR dont les checks sont en panne : sa ligne, déjà calculée, n'est pas écrite.
  const d = prSimple();
  const autre = d.branche("feat/autre", "origin/develop", { "docs/autre.md": "a\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [pr(33, "feat/simple"), pr(34, "feat/autre")], pannes: [{ route: `commits/${autre}/check-runs`, fois: 9, sortie: "" }] });
  const r = d.lancer(script("file.sh"));
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.equal(r.stdout, "", "la ligne de #33 n'est pas écrite avant la panne de #34");
});

// Le hook écrit une URL à identifiants : le commentaire, public, ne la porte jamais.
const HOOK_URL = "https://capitaine:jeton-secret@exemple.test/depot.git";
function prePushRefuse(d, trace = true) {
  const h = hooks(d);
  writeFileSync(
    join(d.racine, "hooks", "pre-push"),
    `#!/bin/sh\necho pre-push >> ${JSON.stringify(join(d.racine, "hooks.log"))}\necho "pnpm check : \\\`tsc\\\` rouge sur apps/x.ts" >&2\nprintf 'ligne windows\\r\\n' >&2\necho "fetch ${HOOK_URL} refusé" >&2\n${trace ? 'echo "husky - pre-push script failed (code 1)"\n' : ""}exit 1\n`,
  );
  chmodSync(join(d.racine, "hooks", "pre-push"), 0o755);
  return h;
}

test("un pre-push refusé avec la trace de husky : passer.sh sort en 3, la boucle renvoie la PR avec la sortie du hook et passe à la suivante", () => {
  const d = conflitIndex();
  d.publierChaine();
  d.branche("docs/autre", "origin/develop", { "docs/autre.md": "a\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [pr(30, "docs/adr-deux", { title: "docs(adr): ADR 2" }), pr(31, "docs/autre")] });
  prePushRefuse(d);
  const seul = d.lancer(script("passer.sh"), "30");
  assert.equal(seul.status, 3, seul.stdout + seul.stderr);
  assert.match(seul.stdout, /push refusé par le hook pre-push : sortie ci-dessus ; corriger, jamais en sautant le hook/);
  assert.doesNotMatch(seul.stdout + seul.stderr, /jeton-secret/);

  const b = d.lancer(script("boucle.sh"));
  assert.equal(b.status, 0, b.stdout + b.stderr);
  assert.doesNotMatch(b.stdout, /ARRÊT/);
  assert.match(b.stdout, /\[#30\] RENVOI : le pre-push refuse le push de la mise à jour avec develop/);
  assert.match(b.stdout, /\[#31\] DÉBUT/, "la suivante passe");
  const commentaire = d.etat().pulls.find((x) => x.number === 30).commentaires.at(-1);
  assert.match(commentaire, /le pre-push refuse le push de la mise à jour avec develop\. Sortie du hook : /);
  assert.match(commentaire, /pnpm check : tsc rouge sur apps\/x\.ts/, "la ligne du hook, accents graves retirés");
  assert.match(commentaire, /https:\/\/\*\*\*@exemple\.test/);
  assert.doesNotMatch(commentaire, /jeton-secret/);
  assert.doesNotMatch(commentaire, /\[git push/, "préfixe retiré");
  assert.match(commentaire, /ligne windows ;/);
  assert.doesNotMatch(commentaire, /\r/, "fin de ligne CRLF retirée");
  assert.deepEqual(d.etat().pulls.find((x) => x.number === 30).labels, ["fusion-bloquée"]);
});

test("un push refusé sans trace de husky : échec fermé, passer.sh en 3 « push refusé par le distant », la boucle s'arrête sans renvoyer ; sujet.sh en 11", () => {
  const refusDistant = (d) => {
    writeFileSync(join(d.origine, "hooks", "pre-receive"), `#!/bin/sh\necho "règle du dépôt : ${HOOK_URL}" >&2\nexit 1\n`);
    chmodSync(join(d.origine, "hooks", "pre-receive"), 0o755);
  };
  const d = conflitIndex();
  d.publierChaine();
  refusDistant(d);
  const r = d.lancer(script("passer.sh"), "30");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /push refusé par le distant \(règle de dépôt, droit, panne ou coupure ; aucune trace du hook pre-push\) : sortie ci-dessus/);
  assert.doesNotMatch(r.stdout + r.stderr, /jeton-secret/);
  const b = d.lancer(script("boucle.sh"));
  assert.equal(b.status, 3, b.stdout + b.stderr);
  assert.match(b.stdout, /ARRÊT sur #30 \(sortie 3\)/);
  assert.doesNotMatch(b.stdout, /RENVOI/);
  assert.deepEqual(horsPassage(d).filter((e) => e.methode !== "GET"), [], "aucun renvoi, aucun label");
  // Un pre-push sans husky (aucune trace) : refus du distant, de même.
  const sansTrace = conflitIndex();
  prePushRefuse(sansTrace, false);
  assert.match(sansTrace.lancer(script("passer.sh"), "30").stdout, /push refusé par le distant/);

  const gestes = { ...GESTES, fusionner: () => ({ d: sousPrConflitIndex(), args: ["fusionner", "80"] }) };
  for (const [nom, fabrique] of Object.entries(gestes)) {
    const { d: s, args } = fabrique();
    refusDistant(s);
    const avant = distant(s);
    const x = s.lancer(scriptDe("sujet", "sujet.sh"), ...args);
    assert.equal(x.status, 11, `${nom} : ${x.stdout}${x.stderr}`);
    assert.match(x.stdout, /push refusé par le distant, sans trace du hook/, nom);
    assert.doesNotMatch(x.stdout + x.stderr, /jeton-secret/, nom);
    assert.equal(distant(s), avant, `${nom} : distant inchangé`);
    assert.equal(s.git("status", "--porcelain"), "", `${nom} : worktree propre`);
    sansFusion(s);
  }
});

// Un refus de fusion durable (droit, règle du dépôt, méthode interdite) n'est pas « la branche a bougé » : sortie 3, la
// boucle s'arrête au lieu de refaire mise à jour et CI à chaque tour, en pause sans fin. 409 ou panne : sortie 5.
test("passer.sh : une fusion refusée durablement par GitHub sort en 3 et la boucle s'arrête ; branche bougée ou panne : 5", () => {
  const DURABLE = /fusion refusée par GitHub, ni pour la revue ni pour une branche qui a bougé/;
  const BOUGEE = /fusion refusée \(develop ou la PR a bougé, ou GitHub en panne\), relancer/;
  for (const [message, attendu, motif] of [
    ["gh: Merge commits are not allowed on this repository. (HTTP 405)", 3, DURABLE],
    ["gh: Resource not accessible by integration (HTTP 403)", 3, DURABLE],
    ["gh: Repository rule violations found (HTTP 422)", 3, DURABLE],
    ["gh: HTTP 403", 3, DURABLE],
    ["gh: HTTP 4030", 5, BOUGEE], // pas un code HTTP : lu comme une panne
    ["gh: Head branch was modified. Review and try the merge again. (HTTP 409)", 5, BOUGEE],
    ["gh: Base branch was modified. Review and try the merge again. (HTTP 405)", 5, BOUGEE],
    ["gh: Head branch is not up to date with the base branch (HTTP 405)", 5, BOUGEE],
    ["gh: Bad Gateway (HTTP 502)", 5, BOUGEE],
    ["gh: Bad Gateway (HTTP 502)\r", 5, BOUGEE],
    ["gh: Resource not accessible by integration (HTTP 403)\r", 3, DURABLE],
    ["gh: HTTP 502", 5, BOUGEE],
    ["error connecting to api.github.com", 5, BOUGEE],
  ]) {
    const d = prSimple();
    d.github({ pulls: [pr(33, "feat/simple", { refusFusion: message })] });
    const r = d.lancer(script("passer.sh"), "33");
    assert.equal(r.status, attendu, `${JSON.stringify(message)} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, motif, JSON.stringify(message));
    assert.equal(d.git("status", "--porcelain"), "");
  }
  const d = prSimple();
  d.publierChaine();
  d.github({ pulls: [pr(33, "feat/simple", { refusFusion: "gh: Merge commits are not allowed on this repository. (HTTP 405)" })] });
  const b = d.lancer(script("boucle.sh"));
  assert.equal(b.status, 3, b.stdout + b.stderr);
  assert.match(b.stdout, /ARRÊT sur #33 \(sortie 3\)/);
  assert.doesNotMatch(b.stdout, /PAUSE/);
  assert.equal(fusionsDe(d, 33).length, 1, "un seul essai");
});

// Décision A-51 : un refus durable n'arrête la boucle que si develop n'a pas bougé entre le test et la fusion. Un 405
// « Repository rule violations found » d'une branche devenue en retard (develop avancé juste avant la fusion) est une
// course : sortie 5, le tour suivant remet à jour et reteste.
test("passer.sh : un refus de fusion 405 après un develop qui a bougé sort en 5 (course) ; le même 405 sans develop bougé, en 3", () => {
  const REGLE = "gh: Repository rule violations found (HTTP 405)";
  const d = prSimple();
  const concurrent = d.branche("concurrent", "origin/develop", { "apps/c.ts": "c\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [pr(33, "feat/simple", { refusFusion: REGLE })], avantFusion: { branche: "develop", vers: concurrent } });
  const course = d.lancer(script("passer.sh"), "33");
  assert.equal(course.status, 5, course.stdout + course.stderr);
  assert.match(course.stdout, /develop a bougé entre le test et la fusion/);
  assert.equal(d.git("status", "--porcelain"), "");
  const f = prSimple();
  f.github({ pulls: [pr(33, "feat/simple", { refusFusion: REGLE })] });
  const durable = f.lancer(script("passer.sh"), "33");
  assert.equal(durable.status, 3, durable.stdout + durable.stderr);
  assert.match(durable.stdout, /fusion refusée par GitHub, ni pour la revue ni pour une branche qui a bougé/);
});

// Décision A-51 : une lecture refusée durablement (401, 403) reste une pause (A-21), mais la ligne PAUSE nomme la route
// et le code HTTP de la cause, pour qu'un humain le voie.
test("boucle.sh : la ligne PAUSE donne la route et le code HTTP de la cause (file.sh et passer.sh)", () => {
  const d = prSimple();
  d.publierChaine();
  // Lectures des checks : traiter_rouges, traiter_sujets et la lecture du tour échouent (PAUSE de la file) ; au tour
  // suivant, traiter_rouges échoue encore, puis la file se lit et la PR passe.
  d.github({ pannes: [{ route: "/check-runs", fois: 4, erreur: "gh: Bad credentials (HTTP 401)" }] });
  const r = d.lancer(script("boucle.sh"));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PAUSE \d\d:\d\d \(file\.sh, sortie 5\) : file illisible ; cause : GitHub illisible \(repos\/\{owner\}\/\{repo\}\/commits\/[0-9a-f]{40}\/check-runs\?per_page=100\) : gh en échec \(code 1\) : gh: Bad credentials \(HTTP 401\), reprise dans 120 s/);
  assert.match(r.stdout, /\[#33\] FUSIONNÉE/);
});

// Contre-relecture (B1) : la sortie d'un hook relayée peut porter les messages que la boucle classe (un pre-push qui joue
// les bancs reposés en écrit les titres). La boucle classe une sortie 3 sur la dernière ligne `[#<n>] ` de passer.sh,
// jamais sur un motif cherché dans toute la sortie.
const TITRES_PIEGES = [
  "ok 12 - passer.sh : une panne de GitHub pendant l'attente de la CI sort en 5, jamais « CI non déclenchée »",
  "ok 13 - passer.sh : checks exigés rouges : liste",
  "push refusé par le hook pre-push : sortie ci-dessus ; corriger, jamais en sautant le hook",
  "GitHub illisible (repos/x/y/pulls) : gh en échec (code 1) : gh: HTTP 502",
];
function hookTitres(d, { refuse, trace }) {
  hooks(d);
  const lignes = TITRES_PIEGES.map((t) => `echo ${JSON.stringify(t)} >&2`).join("\n");
  writeFileSync(
    join(d.racine, "hooks", "pre-push"),
    `#!/bin/sh\n${lignes}\n${refuse ? `${trace ? 'echo "husky - pre-push script failed (code 1)"\n' : ""}exit 1` : "exit 0"}\n`,
  );
  chmodSync(join(d.racine, "hooks", "pre-push"), 0o755);
}
test("boucle.sh : une sortie 3 se classe sur la dernière ligne de passer.sh, jamais sur la sortie du hook relayée", () => {
  // Échéance à une minute : une régression qui repasse la PR à chaque tour finit sur ÉCHÉANCE (sortie 0), rouge, au
  // lieu de tourner sans fin.
  const borner = (d) => { d.env.BOUCLE_ECHEANCE = String(Math.floor(Date.now() / 1000) + 60); };
  // Pre-push refusé avec la trace, qui écrit « CI non déclenchée » : renvoi, jamais « de côté ».
  const a = conflitIndex();
  a.publierChaine();
  borner(a);
  hookTitres(a, { refuse: true, trace: true });
  const ra = a.lancer(script("boucle.sh"));
  assert.equal(ra.status, 0, ra.stdout + ra.stderr);
  assert.match(ra.stdout, /\[#30\] RENVOI : le pre-push refuse le push/);
  assert.doesNotMatch(ra.stdout, /sans CI : de côté|checks rouges au passage/);
  const commentaire = a.etat().pulls[0].commentaires.at(-1);
  assert.match(commentaire, /GitHub illisible \(repos\/x\/y\/pulls\)/, "l'extrait garde les lignes du hook");

  // Pre-push refusé sans trace : refus du distant, ARRÊT.
  const b = conflitIndex();
  b.publierChaine();
  borner(b);
  hookTitres(b, { refuse: true, trace: false });
  const rb = b.lancer(script("boucle.sh"));
  assert.equal(rb.status, 3, rb.stdout + rb.stderr);
  assert.match(rb.stdout, /ARRÊT sur #30 \(sortie 3\)/);
  assert.doesNotMatch(rb.stdout, /RENVOI|sans CI : de côté|checks rouges au passage/);

  // Pre-push vert qui écrit tous ces titres, puis refus du distant : ARRÊT, sans renvoi.
  const c = conflitIndex();
  c.publierChaine();
  borner(c);
  hookTitres(c, { refuse: false });
  writeFileSync(join(c.origine, "hooks", "pre-receive"), "#!/bin/sh\necho 'règle du dépôt' >&2\nexit 1\n");
  chmodSync(join(c.origine, "hooks", "pre-receive"), 0o755);
  const rc = c.lancer(script("boucle.sh"));
  assert.equal(rc.status, 3, rc.stdout + rc.stderr);
  assert.match(rc.stdout, /ARRÊT sur #30 \(sortie 3\)/);
  assert.doesNotMatch(rc.stdout, /RENVOI|sans CI : de côté|checks rouges au passage/);
  assert.deepEqual(horsPassage(c).filter((e) => e.methode !== "GET"), [], "aucun renvoi, aucun label");
});

// A-51 précisée (M1) : develop illisible à la relecture qui suit un refus de fusion : sortie 5 (une coupure passagère
// n'arrête pas la boucle), jamais 3.
test("passer.sh : refus de fusion 405, develop avancé puis illisible à la relecture : sortie 5", () => {
  const d = prSimple();
  const concurrent = d.branche("concurrent", "origin/develop", { "apps/c.ts": "c\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    pulls: [pr(33, "feat/simple", { refusFusion: "gh: Repository rule violations found (HTTP 405)" })],
    avantFusion: { branche: "develop", vers: concurrent },
    origineCasseeAuRefus: true,
  });
  const r = d.lancer(script("passer.sh"), "33");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(r.stdout, /develop illisible à la relecture/);
});

// ── Verrou du passage : plusieurs capitaines sur la même file (ticket 4 de capitaine-a-jour-et-teste) ──────────
// La PR #40 (docs/verrou) est en retard sur develop : sans verrou, passer.sh la mettrait à jour, la pousserait et la
// fusionnerait. `marqueDe(id)` : le commentaire d'un autre capitaine, sans fin.
const marqueDe = (id) => `Passage du capitaine \`${id}\` depuis 12:00 UTC.\n<!-- capitaine:passage ${id} -->`;
function prVerrou(github = {}) {
  const d = depotJouet();
  d.branche("docs/verrou", "origin/develop", { "docs/verrou.md": "verrou\n" });
  d.branche("develop", "origin/develop", { "docs/autre.md": "autre\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } }, pulls: [pr(40, "docs/verrou")], ...github });
  const sommet = () => d.git("ls-remote", "origin", "refs/heads/docs/verrou").split("\t")[0];
  return { d, avant: sommet(), sommet };
}
const commentairesDePassage = (d) => d.journal().filter((e) => /^issues\/(\d+\/)?comments/.test(e.route));
const termine = (e) => e.methode === "PATCH" && /terminé à \d\d:\d\d UTC\.\n<!-- capitaine:passage capitaine-banc -->\n<!-- capitaine:fin -->/.test(e.champs.body);

test("passer.sh : une PR en passage chez un autre capitaine est sautée (sortie 7), son commentaire retiré, rien n'est poussé", () => {
  const { d, avant, sommet } = prVerrou();
  const e = d.etat();
  e.pulls[0].commentaires = [marqueDe("capitaine-jordan")];
  d.github(e);
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#40\] en passage chez le capitaine capitaine-jordan depuis 2026-11-17T12:00:00Z : sautée sans renvoi\n$/);
  assert.deepEqual(d.journal().map((e) => `${e.methode} ${e.route}`), ["POST issues/40/comments", "DELETE issues/comments/40002"]);
  assert.equal(sommet(), avant, "rien n'est poussé");
});

test("passer.sh : deux capitaines à la même seconde, le premier commentaire passe, le second saute", () => {
  const { d, avant, sommet } = prVerrou({ concurrent: marqueDe("capitaine-jordan") });
  const r = d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, /en passage chez le capitaine capitaine-jordan/);
  assert.deepEqual(d.journal().map((e) => `${e.methode} ${e.route}`), ["POST issues/40/comments", "DELETE issues/comments/40002"]);
  assert.equal(sommet(), avant);
});

test("passer.sh : le commentaire du passage se termine à toute sortie, fusion, refus et TERM compris", { timeout: 120_000 }, async () => {
  // Fusion : sortie 0, le commentaire posé, rafraîchi au tour, puis terminé.
  const fusion = prVerrou();
  let r = fusion.d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  let c = commentairesDePassage(fusion.d);
  assert.equal(c[0].methode, "POST");
  assert.ok(termine(c.at(-1)), JSON.stringify(c.at(-1)));
  const brutes = fusion.d.journal().map((e) => `${e.methode} ${e.route}`);
  assert.ok(brutes.indexOf("PUT pulls/40/merge") < brutes.lastIndexOf("PATCH issues/comments/40001"), "terminé après la fusion");

  // Refus après le verrou : checks exigés rouges, sortie 3. (Le titre trop long est refusé avant le verrou : aucun
  // commentaire n'est posé.)
  const refus = prVerrou({ checks: { "*": { qualite: "FAILURE" } } });
  r = refus.d.lancer(script("passer.sh"), "40");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.ok(termine(commentairesDePassage(refus.d).at(-1)));

  // TERM pendant l'attente de la CI : un faux `sleep` qui bloque (jusqu'au signal) et le dit dans un fichier ; le banc
  // envoie TERM au groupe du passage (comme `boucle.sh --arreter`) quand ce fichier existe, sans dépendre d'une durée.
  const tue = prVerrou({ checks: { "*": { qualite: "IN_PROGRESS" } } });
  const bin = join(tue.d.racine, "bin-attente");
  const enAttente = join(tue.d.racine, "en-attente");
  mkdirSync(bin);
  writeFileSync(join(bin, "sleep"), `#!/bin/sh\n: > ${JSON.stringify(enAttente)}\nexec /bin/sleep 600\n`);
  chmodSync(join(bin, "sleep"), 0o755);
  const { spawn } = await import("node:child_process");
  const enfant = spawn("bash", [script("passer.sh"), "40"], { cwd: tue.d.travail, env: { ...tue.d.env, PATH: `${bin}:${tue.d.env.PATH}` }, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  let sortie = "";
  enfant.stdout.on("data", (x) => (sortie += x));
  enfant.stderr.on("data", (x) => (sortie += x));
  const fin = new Promise((resolve) => enfant.on("close", (code, signal) => resolve({ code, signal })));
  while (!existsSync(enAttente)) await new Promise((p) => setTimeout(p, 50));
  process.kill(-enfant.pid, "SIGTERM");
  const { code } = await fin;
  assert.equal(code, 143, sortie);
  assert.ok(termine(commentairesDePassage(tue.d).at(-1)), `${sortie}\n${JSON.stringify(commentairesDePassage(tue.d))}`);
});

test("boucle.sh, veille.sh, passer.sh et sujet.sh fusionner refusent de démarrer sans CAPITAINE_ID, sortie 64, rien d'écrit sur GitHub ; boucle.sh --arreter marche sans lui ; relancer à la main ne pose aucun verrou", () => {
  const { d } = prVerrou();
  d.branche("sujet/lot", "origin/develop", { "lot.md": "lot\n" });
  d.branche("feat/sous", "origin/sujet/lot", { "sous.md": "sous\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  const e = d.etat();
  e.pulls.push(pr(41, "feat/sous", { base: "sujet/lot", title: "docs(lot): sous" }));
  d.github(e);
  const sans = (valeur) => {
    const env = { ...d.env };
    if (valeur === undefined) delete env.CAPITAINE_ID;
    else env.CAPITAINE_ID = valeur;
    return (fichier, ...args) => spawnSync("bash", [fichier, ...args], { cwd: d.travail, env, encoding: "utf8" });
  };
  for (const valeur of [undefined, "", "a-->b"]) {
    const jouer = sans(valeur);
    const nom = JSON.stringify(valeur);
    let r = jouer(script("boucle.sh"));
    assert.equal(r.status, 64, `boucle ${nom} : ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /ARRÊT : CAPITAINE_ID requis \(l'id de la session du capitaine, skill fusionner § « Mise en place »\)/);
    r = jouer(script("veille.sh"));
    assert.equal(r.status, 64, `veille ${nom} : ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /VEILLE ARRÊTÉE \d\d:\d\d : CAPITAINE_ID requis/);
    r = jouer(script("passer.sh"), "40");
    assert.equal(r.status, 64, `passer ${nom} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /\[#40\] CAPITAINE_ID absent ou mal formé/);
    r = jouer(scriptDe("sujet", "sujet.sh"), "fusionner", "41");
    assert.equal(r.status, 64, `sujet.sh fusionner ${nom} : ${r.stdout}${r.stderr}`);
    // relancer : mal formé, refusé ; absent ou vide, joué sans verrou (la sous-PR contient déjà son sujet : sortie 3).
    r = jouer(scriptDe("sujet", "sujet.sh"), "relancer", "41");
    if (valeur === "a-->b") assert.equal(r.status, 64, `relancer ${nom} : ${r.stdout}${r.stderr}`);
    else {
      assert.equal(r.status, 3, `relancer ${nom} : ${r.stdout}${r.stderr}`);
      assert.match(r.stdout, /^relancer sans CAPITAINE_ID : aucun verrou posé$/m);
    }
    assert.deepEqual(d.journal(), [], `${nom} : rien d'écrit sur GitHub`);
  }
  const r = sans(undefined)(script("boucle.sh"), "--arreter");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /aucune boucle en cours ; fichier d'arrêt posé/);
});

test("passer.sh : le passage de A finit entre l'éligibilité et la prise du verrou : la PR relue n'est plus éligible, sortie 7, rien n'est poussé", () => {
  for (const [apresCommentaire, raison] of [
    [{ state: "closed" }, "non ouverte"],
    [{ labels: [] }, "sans le label à-fusionner"],
  ]) {
    const { d, avant, sommet } = prVerrou({ apresCommentaire });
    const r = d.lancer(script("passer.sh"), "40");
    assert.equal(r.status, 7, r.stdout + r.stderr);
    assert.match(r.stdout, new RegExp(`\\[#40\\] PR plus éligible une fois le verrou pris \\(${raison}\\) : sautée\\n$`));
    const c = commentairesDePassage(d);
    assert.equal(c.length, 2, JSON.stringify(c));
    assert.ok(termine(c[1]), "le commentaire de B terminé");
    assert.equal(sommet(), avant, "rien n'est poussé");
    assert.ok(!ecritures(d).includes("PUT pulls/40/merge"));
  }
});

// ── Fusion sans effet (ticket 3 de capitaine-a-jour-et-teste, A-8) : un `commit-msg` de banc, comme celui de `fedora`,
// refuse un commit qui touche le schéma Prisma sans migration ni `[sans-migration:` dans son message. Les commits de
// fixture se font avant la pose des hooks. ─────────────────────────────────────────────────────────────────────────
const SCHEMA = "prisma/schema.prisma";
const MENTION = "[sans-migration: commentaire seul, apporté par une mise à jour du capitaine]";
const CONTRAT = { fusionsSansEffet: [{ fichier: SCHEMA, lignesSansEffet: "^[[:space:]]*(//.*)?$", mention: MENTION }] };
const BASE_SCHEMA = "model A {\n  id Int\n}\n";
const MIGRATION_PRISMA = /commit-msg prisma jouet : migration ou \[sans-migration: <raison>\] exigée/;
function hookPrisma(d) {
  const hook = join(d.racine, "hooks", "commit-msg");
  const corps = readFileSync(hook, "utf8").replace(
    "#!/bin/sh\n",
    `#!/bin/sh
f=$(git diff --cached --name-only)
if printf '%s\\n' "$f" | grep -qx '${SCHEMA}' && ! printf '%s\\n' "$f" | grep -q '^prisma/migrations/' && ! grep -qF '[sans-migration:' "$1"; then
  echo "commit-msg prisma jouet : migration ou [sans-migration: <raison>] exigée" >&2; exit 1
fi
`,
  );
  writeFileSync(hook, corps);
}
// develop porte le schéma (et le contrat, sauf `contrat: null`) ; #32 en part, puis develop reçoit `develop`.
function schemaJouet(develop, contrat = CONTRAT) {
  const d = depotJouet();
  d.ecrire(SCHEMA, BASE_SCHEMA);
  if (contrat !== null) d.ecrire(".claude/chaine.json", JSON.stringify(contrat));
  d.commit("chore: schéma et contrat");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("feat/s", "origin/develop", { "s.md": "s\n" });
  d.branche("develop", "origin/develop", develop, "docs(db): commentaire du schéma [sans-migration: commentaire]");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
    pulls: [pr(32, "feat/s")],
  });
  hooks(d);
  hookPrisma(d);
  return d;
}
const fusionDeLaPr = (d) => {
  d.git("fetch", "-q", "origin");
  return d.git("log", "-1", "--format=%B", "origin/feat/s");
};

test("passer.sh : develop n'apporte qu'un commentaire au schéma, la fusion porte la mention du contrat et passe le commit-msg", () => {
  const d = schemaJouet({ [SCHEMA]: `// note\n${BASE_SCHEMA}` });
  const r = d.lancer(script("passer.sh"), "32");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /FUSIONNÉE/);
  assert.equal(fusionDeLaPr(d), `Merge remote-tracking branch 'origin/develop' into capitaine/32\n\n${MENTION}`);
});

test("passer.sh : sans fusionsSansEffet, la même fusion est refusée par le hook comme avant", () => {
  const d = schemaJouet({ [SCHEMA]: `// note\n${BASE_SCHEMA}` }, null);
  const avant = distant(d);
  const r = d.lancer(script("passer.sh"), "32");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stderr, MIGRATION_PRISMA);
  sansFusion(d);
  assert.equal(d.git("status", "--porcelain"), "");
  assert.equal(distant(d), avant);
});

test("passer.sh : un changement réel du schéma, venu avec sa migration, entre sans mention, et le capitaine le dit", () => {
  const d = schemaJouet({
    [SCHEMA]: `${BASE_SCHEMA}model B {\n  id Int\n}\n`,
    "prisma/migrations/1_b/migration.sql": "CREATE TABLE b ();\n",
  });
  const r = d.lancer(script("passer.sh"), "32");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stderr, /fusion sans mention : prisma\/schema\.prisma porte un changement réel/);
  assert.doesNotMatch(fusionDeLaPr(d), /sans-migration/);
});
