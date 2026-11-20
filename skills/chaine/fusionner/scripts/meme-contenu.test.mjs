// `meme-contenu.sh` : « même contenu propre », de V (sommet du verdict) à T (sommet jugé), pas à pas sur la ligne
// des premiers parents, dans un dépôt propre. Dépôts jouets (depot-jouet.mjs, sans le modifier) : de vraies fusions git, et deux cas
// où ce sont passer.sh et sujet.sh qui écrivent les commits du capitaine. Aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, dossierTemporaire, script } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);

const CALCUL = script("fusionner", "meme-contenu.sh");
const ADR = "docs/adr";
const LISTE = "scripts/docs/index-generes.json";
const index = (...adr) => adr.map((f) => `- ${f}\n`).join("");
const ABSENT = "0".repeat(39) + "1";

// Le calcul, depuis le clone de travail : { code, verdict, raison }. La sortie standard ne porte qu'une ligne,
// le verdict ; la raison est sur la sortie d'erreur, une ligne aussi.
function juger(d, V, T, B = "develop", { env = d.env, cwd = d.travail } = {}) {
  const r = spawnSync("bash", [CALCUL, V, T, B], { cwd, env, encoding: "utf8" });
  const lignes = r.stdout.split("\n");
  assert.deepEqual([lignes.length, lignes[1]], [2, ""], `une seule ligne sur la sortie standard : ${JSON.stringify(r.stdout)}`);
  return { code: r.status, verdict: lignes[0], raison: r.stderr.trim(), sortie: r.stdout + r.stderr };
}
const estMeme = (r, raison) => {
  assert.deepEqual([r.code, r.verdict], [0, "même"], r.sortie);
  if (raison) assert.match(r.raison, raison);
};
const estDifferent = (r, raison) => {
  assert.deepEqual([r.code, r.verdict], [20, "différent"], r.sortie);
  assert.match(r.raison, raison);
};
const estIllisible = (r, raison) => {
  assert.deepEqual([r.code, r.verdict], [21, "illisible"], r.sortie);
  assert.match(r.raison, raison);
};

// Un commit poussé sur `nom` (créée depuis `depuis` si elle n'existe pas sur origin) ; rend son sha.
const pousser = (d, nom, fichiers, depuis = "origin/develop") =>
  d.branche(nom, d.git("branch", "-r", "--list", `origin/${nom}`) ? `origin/${nom}` : depuis, fichiers, `feat: ${nom}`);
// Les deux écritures du capitaine sur la branche d'une PR (passer.sh étapes 2 à 4, mettre_a_jour_sous_pr de
// sujet.sh) : fusion de la cible, en conflit le côté de la cible sur les index, régénération, puis le commit qui
// conclut la fusion, ou un commit d'index à part. `regenerer` écrit les index (par défaut la commande du jouet).
function miseAJour(d, tete, cible = "develop", regenerer = () => {}) {
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-C", `capitaine/${tete.replaceAll("/", "-")}`, `origin/${tete}`);
  const fusion = spawnSync("git", ["merge", "-q", "--no-edit", `origin/${cible}`], { cwd: d.travail, env: d.env, encoding: "utf8" });
  let enCours = false;
  if (fusion.status !== 0) {
    const conflits = d.git("diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
    assert.ok(conflits.length, fusion.stdout + fusion.stderr);
    d.git("checkout", "--theirs", "--", ...conflits);
    d.git("add", "--", ...conflits);
    enCours = true;
  }
  regenerer();
  d.git("add", "-A");
  if (enCours) d.git("commit", "-q", "--no-edit");
  else if (d.git("status", "--porcelain")) d.git("commit", "-q", "-m", `docs: régénère les index après mise à jour avec ${cible}`);
  d.git("push", "-q", "origin", `HEAD:refs/heads/${tete}`);
  d.git("fetch", "-q", "origin");
  return d.git("rev-parse", "HEAD");
}
const adrIndex = (d) => () => {
  const r = spawnSync("node", ["scripts/docs/adr-index.mjs"], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
};
const rien = () => {};
const parents = (d, c) => d.git("rev-list", "--parents", "-n", "1", c).split(" ").slice(1);
// La liste des index de la cible, remplacée sur develop.
const declarer = (d, liste) => pousser(d, "develop", { [LISTE]: JSON.stringify({ index: liste }) });
const ADR_CMD = { chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" };

// ── « même » ────────────────────────────────────────────────────────────────────────────────────────────────
test("V est T : même, sans rien lire d'autre (cible absente comprise)", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  estMeme(juger(d, V, V), /^V est T$/);
  estMeme(juger(d, V, V, "sujet/inconnu"), /^V est T$/);
});

test("retard sans conflit : la fusion de la cible par le capitaine garde le verdict", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  assert.equal(parents(d, T).length, 2);
  estMeme(juger(d, V, T), /1 fusion\(s\) de origin\/develop, 0 commit\(s\) d'index/);
});

test("retard sans conflit, index périmé : fusion, puis commit d'index à part", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { [`${ADR}/ADR_1.md`]: "# 1\n" }); // index pas régénéré par l'auteur
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", adrIndex(d));
  assert.equal(parents(d, T).length, 1, "le sommet est le commit d'index");
  assert.equal(parents(d, `${T}^`).length, 2, "son parent est la fusion");
  assert.equal(d.git("show", `${T}:${ADR}/README.md`) + "\n", index("ADR_1.md"));
  estMeme(juger(d, V, T), /1 fusion\(s\) de origin\/develop, 1 commit\(s\) d'index/);
});

// PR et cible ajoutent chacune une ADR et régénèrent l'index : conflit sur l'index seul.
function conflitIndex(d) {
  const V = pousser(d, "feat/a", { [`${ADR}/ADR_1.md`]: "# 1\n", [`${ADR}/README.md`]: index("ADR_1.md") });
  pousser(d, "develop", { [`${ADR}/ADR_2.md`]: "# 2\n", [`${ADR}/README.md`]: index("ADR_2.md") });
  return V;
}
test("conflit d'index : la fusion porte l'index régénéré, ni celui de la cible ni celui de la fusion calculée", () => {
  const d = depotJouet();
  const V = conflitIndex(d);
  const T = miseAJour(d, "feat/a", "develop", adrIndex(d));
  assert.equal(parents(d, T).length, 2);
  assert.equal(d.git("show", `${T}:${ADR}/README.md`) + "\n", index("ADR_1.md", "ADR_2.md"));
  estMeme(juger(d, V, T), /1 fusion/);
});

test("deux mises à jour de suite, puis la cible qui avance encore, index compris, sans nouvelle mise à jour", () => {
  const d = depotJouet();
  const V = conflitIndex(d);
  const T1 = miseAJour(d, "feat/a", "develop", adrIndex(d));
  pousser(d, "develop", { [`${ADR}/ADR_3.md`]: "# 3\n", [`${ADR}/README.md`]: index("ADR_2.md", "ADR_3.md"), "apps/c.ts": "c\n" });
  const T2 = miseAJour(d, "feat/a", "develop", adrIndex(d));
  assert.equal(d.git("rev-parse", `${T2}^1`), T1);
  estMeme(juger(d, V, T2), /2 fusion\(s\)/);
  estMeme(juger(d, T1, T2), /1 fusion\(s\)/);
  // La cible avance après la mise à jour, et récrit l'index : T2 n'a pas bougé.
  pousser(d, "develop", { [`${ADR}/ADR_4.md`]: "# 4\n", [`${ADR}/README.md`]: index("ADR_2.md", "ADR_3.md", "ADR_4.md") });
  estMeme(juger(d, V, T2), /2 fusion\(s\)/);
});

test("index sans commande : même en conflit, même au contenu de la cible fusionnée, il se juge comme tout fichier : différent", () => {
  const d = depotJouet();
  pousser(d, "develop", { "docs/registre.md": "base\n" });
  declarer(d, [ADR_CMD, "docs/registre.md"]);
  const V = pousser(d, "feat/a", { "docs/registre.md": "pr\n", "apps/a.ts": "a\n" });
  const cible = pousser(d, "develop", { "docs/registre.md": "cible\n" });
  // Ce que le capitaine écrit : en conflit, le côté de la cible, sans régénération.
  const T = miseAJour(d, "feat/a", "develop", rien);
  assert.equal(d.git("rev-parse", `${T}:docs/registre.md`), d.git("rev-parse", `${cible}:docs/registre.md`));
  estDifferent(juger(d, V, T), /docs\/registre\.md, index sans commande ou déclaré par motif, se juge comme tout fichier/);
});

test("index déclaré par motif : même en conflit, même au contenu de la cible fusionnée, il se juge comme tout fichier : différent", () => {
  const d = depotJouet();
  pousser(d, "develop", { "docs/gen/a.md": "base\n" });
  declarer(d, [ADR_CMD, { chemin: "docs/gen/*.md", commande: "true" }]);
  const V = pousser(d, "feat/a", { "docs/gen/a.md": "pr\n", "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/gen/a.md": "cible\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  assert.equal(d.git("show", `${T}:docs/gen/a.md`), "cible");
  estDifferent(juger(d, V, T), /docs\/gen\/a\.md, index sans commande ou déclaré par motif, se juge comme tout fichier/);
});

test("la cible annule un changement identique entre deux mises à jour : même (la définition par M disait différent)", () => {
  const d = depotJouet();
  pousser(d, "develop", { f: "a\n" });
  const V = pousser(d, "feat/a", { f: "b\n", p: "pr\n" });
  pousser(d, "develop", { f: "b\n" });
  const T1 = miseAJour(d, "feat/a", "develop", rien);
  pousser(d, "develop", { f: "a\n" });
  const T2 = miseAJour(d, "feat/a", "develop", rien);
  assert.equal(d.git("show", `${T2}:f`), "a", "la branche mise à jour deux fois a perdu le changement");
  const direct = d.git("merge-tree", "--write-tree", V, "origin/develop").split("\n")[0];
  assert.notEqual(direct, d.git("rev-parse", `${T2}^{tree}`), "la fusion directe de V avec la cible le garde");
  estMeme(juger(d, V, T1));
  estMeme(juger(d, V, T2), /2 fusion\(s\)/);
});

// Sous-PR partie du sujet, qui fusionne un develop plus récent que son sujet ; le sujet est rafraîchi ensuite.
function deuxBases(d) {
  pousser(d, "sujet/x", { s: "s\n" });
  const V = pousser(d, "travail", { p: "p\n" }, "origin/sujet/x");
  pousser(d, "develop", { dev: "d\n" });
  d.git("switch", "-q", "-C", "travail", "origin/travail");
  d.git("merge", "-q", "--no-edit", "origin/develop");
  d.git("push", "-q", "origin", "HEAD:refs/heads/travail");
  const T0 = d.git("rev-parse", "HEAD");
  const rafraichir = () => {
    d.git("switch", "-q", "-C", "sujet/x", "origin/sujet/x");
    d.git("merge", "-q", "--no-edit", "origin/develop");
    d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/x");
    d.git("fetch", "-q", "origin");
  };
  return { V, T0, rafraichir };
}
test("deux bases de fusion : la sous-PR a fusionné develop elle-même, différent avant comme après que le sujet l'a reçu (S2)", () => {
  const d = depotJouet();
  const { V, T0, rafraichir } = deuxBases(d);
  const lateral = /second parent .* pas sur la ligne des premiers parents de origin\/sujet\/x/;
  estDifferent(juger(d, V, T0, "sujet/x"), lateral);
  rafraichir();
  assert.equal(d.git("merge-base", "--all", T0, "origin/sujet/x").split("\n").length, 2, "deux bases de fusion");
  // Le commit de develop est entré dans le sujet par un second parent : il n'en a jamais été le sommet.
  estDifferent(juger(d, V, T0, "sujet/x"), lateral);
  const T1 = miseAJour(d, "travail", "sujet/x", rien);
  estDifferent(juger(d, V, T1, "sujet/x"), lateral);
  estMeme(juger(d, T0, T1, "sujet/x"), /1 fusion\(s\) de origin\/sujet\/x/); // un verdict rendu sur T0 tient
});

test("une sous-PR mise à jour avec son sujet, après que le sujet a reçu develop : même", () => {
  const d = depotJouet();
  pousser(d, "sujet/x", { s: "s\n" });
  const V = pousser(d, "travail", { p: "p\n" }, "origin/sujet/x");
  pousser(d, "develop", { dev: "d\n" });
  d.git("switch", "-q", "-C", "sujet/x", "origin/sujet/x");
  d.git("merge", "-q", "--no-edit", "origin/develop"); // le sujet reçoit develop : son premier parent reste le sujet
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/x");
  const T1 = miseAJour(d, "travail", "sujet/x", rien);
  estMeme(juger(d, V, T1, "sujet/x"), /1 fusion\(s\) de origin\/sujet\/x/);
  pousser(d, "sujet/x", { autre: "x\n" });
  const T2 = miseAJour(d, "travail", "sujet/x", rien);
  estMeme(juger(d, V, T2, "sujet/x"), /2 fusion\(s\) de origin\/sujet\/x/);
});

test("un commit vide après V : même", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  d.git("commit", "-q", "--allow-empty", "-m", "chore: relance la CI");
  estMeme(juger(d, V, d.git("rev-parse", "HEAD")), /0 fusion\(s\) de origin\/develop, 1 commit\(s\) d'index/);
});

// ── Les commits que le capitaine écrit vraiment ─────────────────────────────────────────────────────────────
test("passer.sh : PR en retard, la cible bouge pendant la CI, deux mises à jour poussées : le sommet fusionné garde le verdict", () => {
  const d = depotJouet();
  const V = d.branche("feat/b", "origin/develop", { "docs/b.md": "b\n" });
  d.branche("develop", "origin/develop", { "docs/avant.md": "avant\n" });
  const vers = d.branche("ailleurs", "origin/develop", { "apps/b0.ts": "export const b0 = 0;\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    strict: ["develop"],
    checks: { "*": { qualite: ["IN_PROGRESS", "SUCCESS"] } },
    pendantCi: [{ lectures: 2, branche: "develop", vers }],
    pulls: [{ number: 40, title: "docs(demo): b", head: "feat/b", base: "develop", labels: ["à-fusionner"] }],
  });
  const r = d.lancer(script("fusionner", "passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal((r.stdout.match(/mise à jour poussée/g) ?? []).length, 2, r.stdout);
  d.git("fetch", "-q", "origin");
  const T = d.git("rev-parse", "origin/feat/b");
  assert.equal(d.git("rev-parse", `${T}^1^1`), V);
  estMeme(juger(d, V, T), /2 fusion\(s\) de origin\/develop, 0 commit\(s\) d'index/);
});

test("sujet.sh fusionner : sous-PR en conflit sur un index, mise à jour et index régénéré par le capitaine (sortie 8) : même", () => {
  const d = depotJouet();
  d.ecrire(`${ADR}/ADR_ALL_ARC-1-a.md`, "# 1\n");
  d.ecrire(`${ADR}/README.md`, index("ADR_ALL_ARC-1-a.md"));
  d.commit("docs: adr 1");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  const V = d.branche("docs/sous", "origin/develop", {
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
    checks: { [V]: { qualite: "SUCCESS" } },
    pulls: [{ number: 80, title: "docs(adr): ADR 2", head: "docs/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" }],
  });
  const r = d.lancer(script("sujet", "sujet.sh"), "fusionner", "80");
  assert.equal(r.status, 8, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  const T = d.git("rev-parse", "origin/docs/sous");
  assert.equal(d.git("rev-parse", `${T}^1`), V);
  assert.equal(d.git("show", `${T}:${ADR}/README.md`) + "\n", index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md", "ADR_ALL_ARC-3-c.md"));
  estMeme(juger(d, V, T, "sujet/lot"), /1 fusion\(s\) de origin\/sujet\/lot/);
  estDifferent(juger(d, V, T, "develop"), /second parent .* pas sur la ligne des premiers parents de origin\/develop/);
});

// ── « différent » ───────────────────────────────────────────────────────────────────────────────────────────
test("un commit de l'auteur après V : différent, avant comme après une mise à jour du capitaine", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  estDifferent(juger(d, V, T), /n'est ni une fusion de la cible ni un commit d'index : apps\/a\.ts n'est pas un index généré/);
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T2 = miseAJour(d, "feat/a", "develop", rien);
  estDifferent(juger(d, V, T2), /apps\/a\.ts/);
  estMeme(juger(d, T, T2));
});

test("une fusion en conflit hors index, résolue à la main : différent", () => {
  const d = depotJouet();
  pousser(d, "develop", { "apps/a.ts": "base\n" });
  const V = pousser(d, "feat/a", { "apps/a.ts": "pr\n" });
  pousser(d, "develop", { "apps/a.ts": "cible\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  assert.notEqual(spawnSync("git", ["merge", "-q", "--no-edit", "origin/develop"], { cwd: d.travail, env: d.env }).status, 0);
  d.git("checkout", "--ours", "--", "apps/a.ts"); // le choix d'un côté, comme la résolution d'un conflit de pile
  d.git("add", "apps/a.ts");
  d.git("commit", "-q", "--no-edit");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /s'écarte de la fusion calculée de ses parents : apps\/a\.ts n'est pas un index généré/);
});

test("une fusion propre dont l'arbre est retouché (reformatage, fichier glissé) : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("merge", "-q", "--no-edit", "origin/develop");
  d.ecrire("apps/a.ts", "a ;\n");
  d.git("add", "-A");
  d.git("commit", "-q", "--amend", "--no-edit");
  const T = d.git("rev-parse", "HEAD");
  assert.equal(parents(d, T).length, 2);
  estDifferent(juger(d, V, T), /s'écarte de la fusion calculée de ses parents : apps\/a\.ts/);
});

test("une fusion dont le second parent n'est pas un ancêtre de la cible : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "autre", { "apps/autre.ts": "autre\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("merge", "-q", "--no-edit", "origin/autre");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /second parent .* pas sur la ligne des premiers parents de origin\/develop/);
});

test("V absent de la ligne des premiers parents de T : différent (autre branche, second parent, réécriture, sha inconnu)", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const ailleurs = pousser(d, "feat/b", { "apps/b.ts": "b\n" });
  estDifferent(juger(d, V, ailleurs), /n'est pas sur la ligne des premiers parents/);
  // La cible en premier parent : V est un ancêtre de T, mais par le second parent.
  pousser(d, "develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "-C", "inverse", "origin/develop");
  d.git("merge", "-q", "--no-edit", "--no-ff", "origin/feat/a");
  const inverse = d.git("rev-parse", "HEAD");
  assert.equal(parents(d, inverse)[1], V);
  estDifferent(juger(d, V, inverse), /n'est pas sur la ligne des premiers parents/);
  // Réécriture : le même contenu, un autre commit.
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("commit", "-q", "--amend", "-m", "feat: a, récrit");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /n'est pas sur la ligne des premiers parents/);
  estDifferent(juger(d, ABSENT, V), /V introuvable/);
});

test("un commit d'index qui touche aussi un autre fichier : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { [`${ADR}/ADR_1.md`]: "# 1\n" });
  const seul = pousser(d, "feat/a", { [`${ADR}/README.md`]: index("ADR_1.md") });
  estMeme(juger(d, V, seul), /1 commit\(s\) d'index/);
  const T = pousser(d, "feat/a", { [`${ADR}/README.md`]: index("ADR_1.md", "x"), "apps/a.ts": "a\n" });
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
});

test("index sans commande : d'un autre contenu, du côté de la PR, retiré, ou changé dans un commit à un parent : différent", () => {
  const d = depotJouet();
  pousser(d, "develop", { "docs/registre.md": "base\n" });
  declarer(d, [ADR_CMD, "docs/registre.md"]);
  const V = pousser(d, "feat/a", { "docs/registre.md": "pr\n" });
  pousser(d, "develop", { "docs/registre.md": "cible\n" });
  const fusion = (resoudre) => {
    d.git("switch", "-q", "-C", "essai", V);
    spawnSync("git", ["merge", "-q", "--no-edit", "origin/develop"], { cwd: d.travail, env: d.env });
    resoudre();
    d.git("commit", "-q", "--no-edit");
    return d.git("rev-parse", "HEAD");
  };
  const autre = fusion(() => { d.ecrire("docs/registre.md", "à la main\n"); d.git("add", "-A"); });
  estDifferent(juger(d, V, autre), /docs\/registre\.md, index sans commande ou déclaré par motif, se juge comme tout fichier/);
  const cotePr = fusion(() => { d.git("checkout", "--ours", "--", "docs/registre.md"); d.git("add", "-A"); });
  estDifferent(juger(d, V, cotePr), /docs\/registre\.md, index sans commande ou déclaré par motif, se juge comme tout fichier/);
  const retire = fusion(() => d.git("rm", "-q", "-f", "docs/registre.md"));
  estDifferent(juger(d, V, retire), /docs\/registre\.md, index sans commande ou déclaré par motif, se juge comme tout fichier/);
  const seul = pousser(d, "feat/a", { "docs/registre.md": "pr, encore\n" });
  estDifferent(juger(d, V, seul), /docs\/registre\.md, index sans commande ou déclaré par motif, se juge comme tout fichier/);
});

test("index déclaré par motif : un fichier ajouté ou récrit sous le motif, dans la fusion ou dans un commit d'index : différent", () => {
  const d = depotJouet();
  declarer(d, [ADR_CMD, { chemin: "apps/gen/*.ts", commande: "true" }]);
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("merge", "-q", "--no-edit", "origin/develop");
  d.ecrire("apps/gen/glisse.ts", "export const glisse = 1;\n");
  d.git("add", "-A");
  d.git("commit", "-q", "--amend", "--no-edit");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /apps\/gen\/glisse\.ts, index sans commande ou déclaré par motif, se juge comme tout fichier/);
  const seul = pousser(d, "feat/b", { "apps/gen/glisse.ts": "export const glisse = 1;\n" }, V);
  estDifferent(juger(d, V, seul), /apps\/gen\/glisse\.ts, index sans commande ou déclaré par motif, se juge comme tout fichier/);
});

test("un index régénéré remplacé par un lien symbolique : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  d.git("rm", "-q", `${ADR}/README.md`);
  mkdirSync(join(d.travail, ADR), { recursive: true });
  symlinkSync("../../apps/a.ts", join(d.travail, ADR, "README.md"));
  d.commit("docs: index");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /docs\/adr\/README\.md, index généré, n'est plus un fichier ordinaire/);
});

test("une fusion à trois parents : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "autre", { "apps/autre.ts": "autre\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("merge", "-q", "--no-edit", "origin/develop", "origin/autre");
  const T = d.git("rev-parse", "HEAD");
  assert.equal(parents(d, T).length, 3);
  estDifferent(juger(d, V, T), /fusion à plus de deux parents/);
});

test("la liste des index se lit sur la cible, jamais sur la PR ni dans l'arbre de travail", () => {
  const d = depotJouet();
  // La PR se déclare un index à elle dès V, et l'arbre de travail du capitaine est sur elle.
  const V = pousser(d, "feat/a", { [LISTE]: JSON.stringify({ index: [ADR_CMD, { chemin: "apps/a.ts", commande: "true" }] }), "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  assert.match(d.lire(LISTE), /apps\/a\.ts/);
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré de origin\/develop/);
  // Sans fichier de liste sur la cible : aucun index, une fusion pure passe, un commit d'index non.
  d.git("switch", "-q", "-C", "sans", "origin/develop");
  d.git("rm", "-q", LISTE);
  d.git("commit", "-q", "-m", "chore: sans liste");
  d.git("push", "-q", "origin", "HEAD:refs/heads/sans-liste");
  d.git("fetch", "-q", "origin");
  const W = pousser(d, "feat/c", { "apps/c.ts": "c\n" }, "origin/sans-liste");
  const index1 = pousser(d, "feat/c", { [`${ADR}/README.md`]: index("x") });
  estDifferent(juger(d, W, index1, "sans-liste"), /docs\/adr\/README\.md n'est pas un index généré de origin\/sans-liste/);
});

test("un nom de fichier à saut de ligne dont chaque ligne est le chemin d'un index : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  // Chaque ligne du nom est le chemin d'un index : lu ligne à ligne, il passerait pour un index.
  const piege = `${ADR}/README.md\n${ADR}/README.md`;
  mkdirSync(join(d.travail, piege, ".."), { recursive: true });
  writeFileSync(join(d.travail, piege), "piège\n");
  d.commit("docs: index");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /n'est pas un index généré/);
});

// ── « illisible » : jamais « même » ─────────────────────────────────────────────────────────────────────────
test("illisible : cible absente, T introuvable, usage, liste mal formée, hors dépôt", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  estIllisible(juger(d, V, T, "sujet/inconnu"), /origin\/sujet\/inconnu introuvable/);
  estIllisible(juger(d, V, ABSENT), /T introuvable/);
  estIllisible(juger(d, V.slice(0, 12), T), /^V n'est pas un sha de 40 caractères$/);
  estIllisible(juger(d, V, "origin/feat/a"), /^T n'est pas un sha de 40 caractères$/);
  estIllisible(juger(d, V, T, "a..b"), /nom de branche cible invalide/);
  const sans = spawnSync("bash", [CALCUL, V, T], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.deepEqual([sans.status, sans.stdout], [21, "illisible\n"]);
  // Hors de tout dépôt, même si le dossier temporaire du poste est lui-même dans un dépôt.
  const dehors = dossierTemporaire("hors-depot-");
  estIllisible(juger(d, V, T, "develop", { cwd: dehors, env: { ...d.env, GIT_CEILING_DIRECTORIES: dirname(dehors) } }), /pas dans un dépôt git/);
  for (const contenu of ["{", '{"index":"x"}', '{"index":[{"commande":"x"}]}', '{"index":[42]}', "[]"]) {
    pousser(d, "develop", { [LISTE]: contenu });
    estIllisible(juger(d, V, T), /index-generes\.json de origin\/develop (mal formé|illisible)/);
  }
});

test("illisible : un clone superficiel, dont l'historique est tronqué", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  const clone = join(dossierTemporaire("superficiel-"), "clone");
  const r = spawnSync("git", ["clone", "-q", "--depth", "1", "--no-single-branch", `file://${d.origine}`, clone], { env: d.env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  // A-126 : la raison nomme la cause et le remède, sur une ligne ; le calcul n'approfondit rien lui-même.
  estIllisible(juger(d, V, T, "develop", { cwd: clone }), /^dépôt superficiel : .* \(git fetch --unshallow origin\)$/);
  const dans = (...args) => spawnSync("git", args, { cwd: clone, env: d.env, encoding: "utf8" });
  assert.equal(dans("rev-parse", "--is-shallow-repository").stdout.trim(), "true", "le calcul n'a pas touché au dépôt");
  // Le même dépôt, approfondi par qui appelle : la vraie réponse.
  const fetch = dans("fetch", "-q", "--unshallow", "origin");
  assert.equal(fetch.status, 0, fetch.stderr);
  estMeme(juger(d, V, T, "develop", { cwd: clone }), /1 fusion\(s\) de origin\/develop/);
});

test("illisible : git merge-tree en échec n'est jamais « même »", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  const vrai = spawnSync("sh", ["-c", "command -v git"], { env: d.env, encoding: "utf8" }).stdout.trim();
  writeFileSync(
    join(d.racine, "bin", "git"),
    `#!/bin/sh\nfor a in "$@"; do [ "$a" = merge-tree ] && { echo "git: merge-tree --write-tree inconnu" >&2; exit 129; }; done\nexec ${JSON.stringify(vrai)} "$@"\n`,
  );
  chmodSync(join(d.racine, "bin", "git"), 0o755);
  estIllisible(juger(d, V, T), /git merge-tree --write-tree en échec \(129\)/);
});

// Un PATH qui ne porte que les outils nommés (liens vers ceux du poste).
function pathReduit(d, ...outils) {
  const bin = dossierTemporaire("path-");
  for (const o of outils) symlinkSync(spawnSync("sh", ["-c", `command -v ${o}`], { env: d.env, encoding: "utf8" }).stdout.trim(), join(bin, o));
  return { ...d.env, PATH: bin };
}
test("illisible : un outil absent (git, jq, mktemp, rm), sortie 69, jamais « même »", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  for (const [outils, manque] of [
    [["bash"], /^git est requis/],
    [["bash", "git"], /^jq est requis/],
    [["bash", "git", "jq"], /^mktemp est requis/],
    [["bash", "git", "jq", "mktemp"], /^rm est requis/],
  ]) {
    const r = juger(d, V, T, "develop", { env: pathReduit(d, ...outils) });
    assert.deepEqual([r.code, r.verdict], [69, "illisible"], r.sortie);
    assert.match(r.raison, manque);
  }
});

// ── Ce que la relecture adversariale a trouvé (A-114) : chaque attaque est un cas ───────────────────────────
test("un PATH réduit à bash, git, jq, mktemp et rm : le calcul n'emploie aucun autre outil, et rend les mêmes verdicts", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { [`${ADR}/ADR_1.md`]: "# 1\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", adrIndex(d));
  const auteur = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  const env = pathReduit(d, "bash", "git", "jq", "mktemp", "rm");
  estMeme(juger(d, V, T, "develop", { env }), /1 fusion\(s\) de origin\/develop, 1 commit\(s\) d'index/);
  estDifferent(juger(d, V, auteur, "develop", { env }), /apps\/a\.ts n'est pas un index généré/);
});

test("une fusion qui recule un index sans commande, ou l'écrase hors de tout conflit : différent", () => {
  const d = depotJouet();
  const D1 = pousser(d, "develop", { "docs/registre.md": "ligne1\nl2\nl3\nl4\nl5\nl6\nl7\nl8\n", [LISTE]: JSON.stringify({ index: [ADR_CMD, "docs/registre.md"] }) });
  pousser(d, "develop", { "docs/registre.md": "ligne1\nligne2\nl2\nl3\nl4\nl5\nl6\nl7\nl8\n" });
  const V = pousser(d, "feat/a", { "docs/registre.md": "ligne1\nligne2\nl2\nl3\nl4\nl5\nl6\nl7\nl8\nlignePR\n" });
  // Une fusion écrite à la main : `arbre`, sauf le registre, repris de `source` ; parents V et `second`.
  const ecrite = (arbre, source, second) => {
    d.git("read-tree", arbre);
    d.git("update-index", "--cacheinfo", `100644,${d.git("rev-parse", `${source}:docs/registre.md`)},docs/registre.md`);
    const T = d.git("commit-tree", d.git("write-tree"), "-p", V, "-p", second, "-m", "x");
    d.git("read-tree", "HEAD");
    return T;
  };
  // (a) Le second parent est un vieux sommet de la cible, déjà ancêtre de V : le registre recule jusqu'à lui.
  const recul = ecrite(V, D1, D1);
  assert.equal(d.git("show", `${recul}:docs/registre.md`).split("\n")[1], "l2", "le sommet a perdu la ligne 2 de la cible");
  estDifferent(juger(d, V, recul), /second parent .* déjà ancêtre de son premier parent/);
  // (b) Un vrai sommet de la cible, fusion sans conflit ; le registre de la fusion calculée (les deux ajouts)
  // est écrasé par celui de la cible.
  const D3 = pousser(d, "develop", { "docs/registre.md": "ligne0\nligne1\nligne2\nl2\nl3\nl4\nl5\nl6\nl7\nl8\n" });
  const ecrase = ecrite(d.git("merge-tree", "--write-tree", V, D3).split("\n")[0], D3, D3);
  assert.doesNotMatch(d.git("show", `${ecrase}:docs/registre.md`), /lignePR/);
  estDifferent(juger(d, V, ecrase), /docs\/registre\.md, index sans commande ou déclaré par motif, se juge comme tout fichier/);
});

test("un conflit fabriqué par un second parent latéral, entré dans la cible par une fusion : différent (S2)", () => {
  const d = depotJouet();
  const lettres = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\n";
  pousser(d, "develop", { "docs/registre.md": lettres, [LISTE]: JSON.stringify({ index: [ADR_CMD, "docs/registre.md"] }) });
  const SK = pousser(d, "sujet/s", { "docs/registre.md": `${lettres}ligneS\n` });
  pousser(d, "develop", { "docs/registre.md": `ligne2\n${lettres}` });
  const V = pousser(d, "feat/a", { "docs/registre.md": `ligne2\n${lettres}ligneP\n` });
  d.git("switch", "-q", "-C", "develop", "origin/develop");
  d.git("merge", "-q", "--no-ff", "--no-edit", "origin/sujet/s");
  d.git("push", "-q", "origin", "HEAD:refs/heads/develop");
  d.git("fetch", "-q", "origin");
  assert.equal(spawnSync("git", ["merge-base", "--is-ancestor", SK, "origin/develop"], { cwd: d.travail, env: d.env }).status, 0, "SK est un ancêtre de la cible");
  // La fusion calculée de V et de SK est en conflit sur le registre ; l'attaque y met le registre de SK.
  const calcule = spawnSync("git", ["merge-tree", "--write-tree", V, SK], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.equal(calcule.status, 1, "conflit fabriqué");
  d.git("read-tree", calcule.stdout.split("\n")[0]);
  d.git("update-index", "--cacheinfo", `100644,${d.git("rev-parse", `${SK}:docs/registre.md`)},docs/registre.md`);
  const T = d.git("commit-tree", d.git("write-tree"), "-p", V, "-p", SK, "-m", "x");
  d.git("read-tree", "HEAD");
  assert.doesNotMatch(d.git("show", `${T}:docs/registre.md`), /ligne2/, "le sommet a perdu la ligne 2 de la cible");
  estDifferent(juger(d, V, T), /second parent .* pas sur la ligne des premiers parents de origin\/develop/);
});

test("une PR bâtie sur un sujet livré entre-temps : le conflit résolu au contenu d'un vrai sommet de la cible, différent", () => {
  const d = depotJouet();
  const lettres = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\n";
  pousser(d, "develop", { "docs/registre.md": lettres, [LISTE]: JSON.stringify({ index: [ADR_CMD, "docs/registre.md"] }) });
  pousser(d, "sujet/s", { "docs/registre.md": `${lettres}ligneS\n` });
  const V = pousser(d, "feat/a", { "docs/registre.md": `ligneP\n${lettres}ligneS\n` }, "origin/sujet/s"); // PR vers develop, partie du sujet
  const DK = pousser(d, "develop", { "docs/registre.md": `ligneK\n${lettres}` });
  d.git("switch", "-q", "-C", "develop", "origin/develop");
  d.git("merge", "-q", "--no-ff", "--no-edit", "origin/sujet/s"); // le sujet est livré : la cible porte ligneS
  d.git("push", "-q", "origin", "HEAD:refs/heads/develop");
  d.git("fetch", "-q", "origin");
  assert.match(d.git("show", "origin/develop:docs/registre.md"), /ligneS/);
  // DK a été le sommet de la cible et n'est pas un ancêtre de V : S2 l'admet. La fusion calculée est en conflit
  // sur le registre ; l'attaque y met celui de DK, qui n'a jamais porté ligneS.
  const calcule = spawnSync("git", ["merge-tree", "--write-tree", V, DK], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.equal(calcule.status, 1, "conflit sur le registre");
  d.git("read-tree", calcule.stdout.split("\n")[0]);
  d.git("update-index", "--cacheinfo", `100644,${d.git("rev-parse", `${DK}:docs/registre.md`)},docs/registre.md`);
  const T = d.git("commit-tree", d.git("write-tree"), "-p", V, "-p", DK, "-m", "x");
  d.git("read-tree", "HEAD");
  assert.doesNotMatch(d.git("show", `${T}:docs/registre.md`), /ligneS/, "le sommet a perdu la ligne du sujet");
  estDifferent(juger(d, V, T), /docs\/registre\.md, index sans commande ou déclaré par motif, se juge comme tout fichier/);
});

test("un sous-module déplacé après V : différent, quoi que disent .gitmodules et diff.ignoreSubmodules", () => {
  const d = depotJouet();
  d.git("switch", "-q", "-C", "feat/a", "origin/develop");
  d.ecrire(".gitmodules", '[submodule "vendor/lib"]\n\tpath = vendor/lib\n\turl = ./lib\n\tignore = all\n');
  d.git("add", ".gitmodules");
  d.git("update-index", "--add", "--cacheinfo", `160000,${"1".repeat(40)},vendor/lib`);
  d.git("commit", "-q", "-m", "feat: sous-module");
  const V = d.git("rev-parse", "HEAD");
  d.git("update-index", "--cacheinfo", `160000,${"2".repeat(40)},vendor/lib`);
  d.git("commit", "-q", "-m", "chore: sous-module");
  const T = d.git("rev-parse", "HEAD");
  estDifferent(juger(d, V, T), /vendor\/lib n'est pas un index généré/);
  d.git("config", "diff.ignoreSubmodules", "all");
  estDifferent(juger(d, V, T), /vendor\/lib n'est pas un index généré/);
});

test("depuis un sous-dossier, sous diff.relative : le dossier courant ne change rien", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  const W = pousser(d, "feat/c", { [`${ADR}/ADR_1.md`]: "# 1\n" });
  const X = pousser(d, "feat/c", { [`${ADR}/README.md`]: index("ADR_1.md") });
  d.git("config", "diff.relative", "true");
  const cwd = join(d.travail, ADR);
  estDifferent(juger(d, V, T, "develop", { cwd }), /apps\/a\.ts n'est pas un index généré/);
  // La liste de la cible se lit depuis la racine de son arbre : le commit d'index est reconnu.
  estMeme(juger(d, W, X, "develop", { cwd }), /1 commit\(s\) d'index/);
});

test("un sommet remplacé (git replace) ou greffé (info/grafts) : les commits se lisent tels qu'ils sont", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  const vide = d.git("commit-tree", `${V}^{tree}`, "-p", V, "-m", "vide");
  d.git("replace", T, vide);
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
  d.git("replace", "-d", T);
  // Un commit de l'auteur, puis son retour : greffé sur V, le second cacherait le premier.
  const retour = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  assert.equal(d.git("rev-parse", `${retour}^{tree}`), d.git("rev-parse", `${V}^{tree}`));
  mkdirSync(join(d.travail, ".git/info"), { recursive: true });
  writeFileSync(join(d.travail, ".git/info/grafts"), `${retour} ${V}\n`);
  estDifferent(juger(d, V, retour), /apps\/a\.ts n'est pas un index généré/);
});

test("un chemin de la liste écrit comme git cite : le fichier cité n'est pas un index", () => {
  const d = depotJouet();
  declarer(d, [ADR_CMD, { chemin: '"apps/a\\tb.ts"', commande: "true" }]);
  const V = pousser(d, "feat/a", { "apps/a\tb.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a\tb.ts": "a2\n" });
  estDifferent(juger(d, V, T), /n'est pas un index généré/);
});

test("des arguments hostiles : jamais recopiés, la sortie standard ne porte que le verdict", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  for (const args of [["x\nmême", T, "develop"], [V, `${T}\nmême`, "develop"], [V, T, "develop\nmême"], [`${V}\n`, T, "develop"]]) {
    const r = spawnSync("bash", [CALCUL, ...args], { cwd: d.travail, env: d.env, encoding: "utf8" });
    assert.deepEqual([r.status, r.stdout], [21, "illisible\n"], JSON.stringify(args));
    assert.doesNotMatch(r.stderr, /même/);
    assert.equal(r.stderr.trim().split("\n").length, 1, r.stderr);
  }
  // HEAD n'est pas une branche, et une réf symbolique non plus.
  d.git("symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/develop");
  d.git("symbolic-ref", "refs/remotes/origin/alias", "refs/remotes/origin/develop");
  estIllisible(juger(d, V, T, "HEAD"), /^nom de branche cible invalide$/);
  estIllisible(juger(d, V, T, "alias"), /réf symbolique/);
});

test("un fichier renommé vers le chemin d'un index, sous diff.renames : la suppression ne se cache pas", () => {
  const d = depotJouet();
  declarer(d, [ADR_CMD, { chemin: "docs/agents/couts.md", commande: "true" }]);
  const V = pousser(d, "feat/a", { "apps/a.ts": "une ligne\nune autre\nune troisième\n" });
  mkdirSync(join(d.travail, "docs/agents"), { recursive: true });
  d.git("mv", "apps/a.ts", "docs/agents/couts.md");
  d.git("commit", "-q", "-m", "docs: index");
  d.git("config", "diff.renames", "copies");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /: apps\/a\.ts n'est pas un index généré/);
});

test("GIT_DIR et GIT_WORK_TREE hérités d'un autre dépôt : c'est le dépôt du dossier courant qui est jugé", () => {
  const d = depotJouet();
  // Un autre clone, dont origin/develop déclare apps/a.ts index à commande ; la PR le déclare aussi (A-125 : la
  // dispense demande la cible et T), mais pas la cible du dépôt du dossier courant.
  const piege = { [LISTE]: JSON.stringify({ index: [ADR_CMD, { chemin: "apps/a.ts", commande: "true" }] }) };
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n", ...piege });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  pousser(d, "piege", piege);
  const autre = join(dossierTemporaire("autre-"), "clone");
  assert.equal(spawnSync("git", ["clone", "-q", d.origine, autre], { env: d.env }).status, 0);
  const dans = (...args) => spawnSync("git", args, { cwd: autre, env: d.env, encoding: "utf8" });
  assert.equal(dans("update-ref", "refs/remotes/origin/develop", "refs/remotes/origin/piege").status, 0);
  estMeme(juger(d, V, T, "develop", { cwd: autre }), /1 commit\(s\) d'index/); // le piège fonctionne, lu chez lui
  const env = { ...d.env, GIT_DIR: join(autre, ".git"), GIT_WORK_TREE: autre };
  estDifferent(juger(d, V, T, "develop", { env }), /apps\/a\.ts n'est pas un index généré de origin\/develop/);
});

test("core.quotePath du dépôt : un index au chemin accentué reste reconnu", () => {
  const d = depotJouet();
  declarer(d, [ADR_CMD, { chemin: "docs/métier/index.md", commande: "true" }]);
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "docs/métier/index.md": "x\n" });
  for (const valeur of ["true", "false"]) {
    d.git("config", "core.quotePath", valeur);
    estMeme(juger(d, V, T), /1 commit\(s\) d'index/);
  }
});

test("les attributs et les pilotes de fusion : la fusion calculée est la fusion à trois voies nue, où qu'ils soient écrits", () => {
  const d = depotJouet();
  pousser(d, "develop", { "apps/a.ts": "base\nl2\nl3\n" });
  const V = pousser(d, "feat/a", { "apps/a.ts": "pr\nl2\nl3\n" });
  pousser(d, "develop", { "apps/a.ts": "cible\nl2\nl3\n" });
  // Une résolution à la main : les deux côtés l'un sous l'autre, ce qu'un pilote `union` aurait écrit.
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  assert.notEqual(spawnSync("git", ["merge", "-q", "--no-edit", "origin/develop"], { cwd: d.travail, env: d.env }).status, 0);
  d.ecrire("apps/a.ts", "pr\ncible\nl2\nl3\n");
  d.git("add", "-A");
  d.git("commit", "-q", "--no-edit");
  const T = d.git("rev-parse", "HEAD");
  const refus = /s'écarte de la fusion calculée de ses parents : apps\/a\.ts/;
  estDifferent(juger(d, V, T), refus);
  // Dans l'arbre de travail de qui calcule, non commité.
  d.ecrire(".gitattributes", "apps/a.ts merge=union\n");
  estDifferent(juger(d, V, T), refus);
  // Dans la configuration du dépôt : le pilote par défaut, puis le pilote `text` remplacé.
  d.git("config", "merge.default", "union");
  estDifferent(juger(d, V, T), refus);
  d.git("config", "--unset", "merge.default");
  d.git("config", "merge.text.driver", "true");
  estDifferent(juger(d, V, T), refus);
  d.git("config", "--unset", "merge.text.driver");
  // Dans les attributs locaux du dépôt.
  mkdirSync(join(d.travail, ".git/info"), { recursive: true });
  writeFileSync(join(d.travail, ".git/info/attributes"), "apps/a.ts merge=union\n");
  estDifferent(juger(d, V, T), refus);
  writeFileSync(join(d.travail, ".git/info/attributes"), "");
  // Dans la configuration de l'utilisateur.
  const maison = dossierTemporaire("maison-");
  writeFileSync(join(maison, ".gitconfig"), "[merge]\n\tdefault = union\n");
  estDifferent(juger(d, V, T, "develop", { env: { ...d.env, HOME: maison, XDG_CONFIG_HOME: join(maison, "xdg") } }), refus);
  // Dans les fichiers que git lit chez l'utilisateur sans passer par la configuration : ~/.config/git/attributes
  // (et ignore), sous HOME puis sous XDG_CONFIG_HOME ; puis ceux que sa configuration nomme.
  const chez = (dossier) => {
    mkdirSync(join(dossier, "git"), { recursive: true });
    writeFileSync(join(dossier, "git/attributes"), "* merge=union\n");
    writeFileSync(join(dossier, "git/ignore"), "*\n");
  };
  const foyer = dossierTemporaire("foyer-");
  chez(join(foyer, ".config"));
  estDifferent(juger(d, V, T, "develop", { env: { ...d.env, HOME: foyer, XDG_CONFIG_HOME: "" } }), refus);
  const xdg = dossierTemporaire("xdg-");
  chez(xdg);
  estDifferent(juger(d, V, T, "develop", { env: { ...d.env, HOME: dossierTemporaire("vide-"), XDG_CONFIG_HOME: xdg } }), refus);
  const nomme = dossierTemporaire("nomme-");
  writeFileSync(join(nomme, "attributs"), "* merge=union\n");
  writeFileSync(join(nomme, ".gitconfig"), `[core]\n\tattributesFile = ${join(nomme, "attributs")}\n\texcludesFile = ${join(nomme, "attributs")}\n`);
  estDifferent(juger(d, V, T, "develop", { env: { ...d.env, HOME: nomme, XDG_CONFIG_HOME: join(nomme, "xdg") } }), refus);
});

test("un pilote de fusion commité avec V (merge=union, merge=ours) : la fusion faite sous lui s'écarte de la fusion nue, différent (S4)", () => {
  const d = depotJouet();
  pousser(d, "develop", { "apps/auth.ts": "base\nl2\nl3\n" });
  const fusionSous = (attribut, branche) => {
    const V = pousser(d, branche, { ".gitattributes": `apps/auth.ts merge=${attribut}\n`, "apps/auth.ts": "pr\nl2\nl3\n" });
    return { V, T: () => miseAJour(d, branche, "develop", rien) };
  };
  const union = fusionSous("union", "feat/union");
  const ours = fusionSous("ours", "feat/ours");
  pousser(d, "develop", { "apps/auth.ts": "correctif\nl2\nl3\n" }); // la cible corrige le fichier
  // Sans aucune configuration : git mêle les deux côtés, sans conflit, et personne n'a relu ce contenu.
  const Tu = union.T();
  assert.equal(d.git("show", `${Tu}:apps/auth.ts`), "pr\ncorrectif\nl2\nl3");
  estDifferent(juger(d, union.V, Tu), /s'écarte de la fusion calculée de ses parents : apps\/auth\.ts/);
  // Avec `merge.ours.driver true` dans le clone : le côté de la PR est gardé, le correctif de la cible perdu.
  d.git("config", "merge.ours.driver", "true");
  const To = ours.T();
  assert.equal(d.git("show", `${To}:apps/auth.ts`), "pr\nl2\nl3");
  estDifferent(juger(d, ours.V, To), /s'écarte de la fusion calculée de ses parents : apps\/auth\.ts/);
});

test("illisible : une lecture de git vide ou incohérente n'est jamais « même »", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  const vrai = spawnSync("sh", ["-c", "command -v git"], { env: d.env, encoding: "utf8" }).stdout.trim();
  // Un faux git, muet et en sortie 0 pour la commande donnée (et son drapeau, s'il y en a un).
  const muet = (commande, drapeau = commande) =>
    writeFileSync(
      join(d.racine, "bin", "git"),
      `#!/bin/sh\nc=0; f=0\nfor a in "$@"; do [ "$a" = '${commande}' ] && c=1; [ "$a" = '${drapeau}' ] && f=1; done\n[ "$c$f" = 11 ] && exit 0\nexec ${JSON.stringify(vrai)} "$@"\n`,
      { mode: 0o755 },
    );
  muet("diff-tree");
  estIllisible(juger(d, V, T), /écart de [0-9a-f]{9} illisible/);
  muet("rev-list", "--first-parent");
  estIllisible(juger(d, V, T), /ligne des premiers parents de T illisible/);
  muet("rev-list", "--parents");
  estIllisible(juger(d, V, T), /parents de [0-9a-f]{9} illisibles/);
  muet("rev-parse", `${T}^{tree}`);
  estIllisible(juger(d, V, T), /arbre de [0-9a-f]{9} illisible/);
  muet("rev-list", "--count");
  estIllisible(juger(d, V, T), /compte des commits de V à T incohérent/);
});

// ── Les règles de structure (A-119) ─────────────────────────────────────────────────────────────────────────
// Un faux git en tête de PATH : `corps` (du sh) passe avant le vrai, joignable par "$VRAI".
function fauxGit(d, corps) {
  const chemin = join(d.racine, "bin", "git");
  const vrai = existsSync(chemin) ? null : spawnSync("sh", ["-c", "command -v git"], { env: d.env, encoding: "utf8" }).stdout.trim();
  d.vraiGit ??= vrai;
  writeFileSync(chemin, `#!/bin/sh\nVRAI=${JSON.stringify(d.vraiGit)}\n${corps}\nexec "$VRAI" "$@"\n`, { mode: 0o755 });
}

test("git plus ancien que 2.41 : sortie 69, la version dite, avant tout calcul", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  for (const [version, attendu] of [["2.40.1", /^git ≥ 2\.41 requis, ici 2\.40$/], ["1.9.5 (Apple Git-50)", /^git ≥ 2\.41 requis, ici 1\.9$/]]) {
    fauxGit(d, `[ "$1" = version ] && { echo "git version ${version}"; exit 0; }`);
    const r = juger(d, V, T);
    assert.deepEqual([r.code, r.verdict], [69, "illisible"], r.sortie);
    assert.match(r.raison, attendu);
  }
  fauxGit(d, `[ "$1" = version ] && { echo "git version 2.41.0"; exit 0; }`);
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
  fauxGit(d, `[ "$1" = version ] && { echo "git version 3.0.0"; exit 0; }`);
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
});

test("S1 : le dépôt propre se crée sous le dossier temporaire, y est retiré, et le dépôt réel n'est pas écrit", () => {
  const d = depotJouet();
  const V = conflitIndex(d);
  const T = miseAJour(d, "feat/a", "develop", adrIndex(d));
  const temporaire = dossierTemporaire("tmp-du-calcul-");
  const objets = () => d.git("count-objects", "-v");
  const avant = objets();
  estMeme(juger(d, V, T, "develop", { env: { ...d.env, TMPDIR: temporaire } }), /1 fusion/);
  assert.deepEqual(readdirSync(temporaire), [], "le dépôt propre est retiré");
  assert.equal(objets(), avant, "la fusion calculée ne s'écrit pas dans le dépôt réel");
  // Dossier temporaire absent, ou qui n'est pas un dossier : le dépôt propre ne se crée pas.
  for (const TMPDIR of [join(temporaire, "absent"), join(d.travail, "README.md")])
    estIllisible(juger(d, V, T, "develop", { env: { ...d.env, TMPDIR } }), /^dossier temporaire impossible à créer/);
});

test("S3 : aucun here-document dans le script, et un commit de 2 500 fichiers se juge en entier", () => {
  // bash écrit un here-document dans un fichier du dossier temporaire : plein, la lecture reviendrait vide.
  const lignes = readFileSync(CALCUL, "utf8").split("\n").filter((l) => !/^\s*#/.test(l));
  assert.deepEqual(lignes.filter((l) => l.includes("<<")), [], "ni here-document ni here-string");
  assert.deepEqual(lignes.filter((l) => /<\s*<\(/.test(l) || /\|\s*(while|read|mapfile)/.test(l)), [], "ni substitution de processus ni tube vers une lecture");
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const beaucoup = Object.fromEntries(Array.from({ length: 2500 }, (_, i) => [`apps/gros/f${i}.ts`, `export const f${i} = ${i};\n`]));
  const T = pousser(d, "feat/a", beaucoup);
  estDifferent(juger(d, V, T), /apps\/gros\/f0\.ts n'est pas un index généré/);
  // Un écart long dont seule la dernière ligne n'est pas un index : elle est lue.
  declarer(d, [ADR_CMD, ...Array.from({ length: 200 }, (_, i) => ({ chemin: `gen/f${i}.md`, commande: "true" }))]);
  const W = pousser(d, "feat/b", { "apps/b.ts": "b\n" });
  const X = pousser(d, "feat/b", { ...Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`gen/f${i}.md`, `${i}\n`])), "zzz/dernier.ts": "z\n" });
  estDifferent(juger(d, W, X), /zzz\/dernier\.ts n'est pas un index généré/);
});

test("S3 : une ligne des premiers parents tronquée, ou un compte qui ne dit pas la même chose : illisible", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "feat/a", { "apps/a.ts": "a2\n" }); // un commit de l'auteur
  d.git("commit", "-q", "--allow-empty", "-m", "chore: vide");
  const T = d.git("rev-parse", "HEAD");
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
  // Un git qui saute le commit de l'auteur dans la ligne des premiers parents de T : seul le commit vide serait jugé.
  fauxGit(d, `for a in "$@"; do [ "$a" = --reverse ] && { printf '%s\\n' ${V} ${T}; exit 0; }; done`);
  estIllisible(juger(d, V, T), /compte des commits de V à T incohérent/);
  // Et un git dont le compte, lui, est faux.
  fauxGit(d, `for a in "$@"; do [ "$a" = --count ] && { echo 1; exit 0; }; done`);
  estIllisible(juger(d, V, T), /compte des commits de V à T incohérent/);
});

// Ajouté après l'annexe B du ticket 59, sur décision de l'architecte : le chemin voisin d'un index.
test("le chemin voisin d'un index à commande n'est jamais pris pour lui : chaque caractère du chemin déclaré se lit à la lettre", () => {
  const d = depotJouet();
  // Des index à commande dont le nom porte un caractère que l'expression régulière lirait autrement.
  const speciaux = ["gen/a+b.md", "gen/c[12].md", "gen/d(e).md", "gen/fx?.md", "gen/g{2}.md", "gen/h|i.md", "gen/j^k$.md"];
  declarer(d, [ADR_CMD, ...speciaux.map((chemin) => ({ chemin, commande: "true" }))]);
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  // Chacun de ces noms est bien un index : un commit qui ne touche qu'eux garde le verdict.
  const T = pousser(d, "feat/a", { [`${ADR}/README.md`]: index("ADR_1.md"), ...Object.fromEntries(speciaux.map((chemin) => [chemin, "x\n"])) });
  estMeme(juger(d, V, T), /0 fusion\(s\) de origin\/develop, 1 commit\(s\) d'index/);
  // Leurs voisins, non : le point, le plus, les crochets, les parenthèses, le point d'interrogation, les
  // accolades, la barre, puis un chemin préfixé, suffixé, ou rangé ailleurs.
  const voisins = [
    `${ADR}/READMExmd`,
    "gen/aab.md",
    "gen/a+bxmd",
    "gen/c1.md",
    "gen/de.md",
    "gen/f.md",
    "gen/gg.md",
    "gen/h",
    "i.md",
    "gen/jk.md",
    `${ADR}/README.md.bak`,
    `x${ADR}/README.md`,
    `autre/${ADR}/README.md`,
    `${ADR}/sous/README.md`,
  ];
  voisins.forEach((voisin, i) => {
    const W = pousser(d, `feat/voisin-${i}`, { [voisin]: "x\n" }, V);
    assert.equal(d.git("diff", "--name-only", V, W), voisin, "le commit ne touche que le voisin");
    estDifferent(juger(d, V, W), new RegExp(`: ${voisin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} n'est pas un index généré de origin/develop$`));
  });
});

// ── A-125 : décidée par l'architecte après sa contre-relecture ──────────────────────────────────────────────
// La cible avance d'un commit écrit par `geste` (dans le clone de travail, sur develop).
function cibleAvance(d, geste) {
  d.git("switch", "-q", "-C", "develop", "origin/develop");
  geste();
  d.git("add", "-A");
  d.git("commit", "-q", "-m", "feat: la cible avance");
  d.git("push", "-q", "origin", "HEAD:refs/heads/develop");
  d.git("fetch", "-q", "origin");
}
// L'auteur fusionne lui-même la cible dans sa branche, tombe sur un conflit, et le conclut par `resoudre`.
function conclure(d, V, resoudre) {
  d.git("switch", "-q", "-C", "auteur", V);
  const fusion = spawnSync("git", ["merge", "-q", "--no-edit", "origin/develop"], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.notEqual(fusion.status, 0, "la fusion est en conflit");
  resoudre();
  d.git("commit", "-q", "--no-edit");
  const T = d.git("rev-parse", "HEAD");
  assert.deepEqual(parents(d, T), [V, d.git("rev-parse", "origin/develop")]);
  return T;
}

test("A-125 : une fusion dont la fusion calculée est en conflit hors index à commande n'est jamais « même »", () => {
  const conflit = (f) => new RegExp(`conclut un conflit sur ${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}, qui n'est pas un index à commande`);
  // La cible supprime le fichier que la PR modifie ; l'auteur garde l'état du conflit : le fichier revient.
  {
    const d = depotJouet();
    pousser(d, "develop", { "apps/f.ts": "l1\nl2\nl3\n" });
    const V = pousser(d, "feat/a", { "apps/f.ts": "l1\nPR\nl3\n" });
    cibleAvance(d, () => d.git("rm", "-q", "apps/f.ts"));
    const T = conclure(d, V, () => d.git("add", "apps/f.ts"));
    assert.equal(d.git("show", `${T}:apps/f.ts`), "l1\nPR\nl3", "le fichier supprimé par la cible est revenu");
    estDifferent(juger(d, V, T), conflit("apps/f.ts"));
  }
  // L'inverse : la PR supprime, la cible modifie.
  {
    const d = depotJouet();
    pousser(d, "develop", { "apps/f.ts": "l1\nl2\nl3\n" });
    d.git("switch", "-q", "-C", "feat/a", "origin/develop");
    d.git("rm", "-q", "apps/f.ts");
    d.git("commit", "-q", "-m", "feat: retire f");
    const V = d.git("rev-parse", "HEAD");
    cibleAvance(d, () => d.ecrire("apps/f.ts", "l1\nCIBLE\nl3\n"));
    const T = conclure(d, V, () => d.git("add", "apps/f.ts"));
    estDifferent(juger(d, V, T), conflit("apps/f.ts"));
  }
  // Un binaire modifié des deux côtés, conclu du côté de la PR.
  {
    const d = depotJouet();
    pousser(d, "develop", { "apps/img.bin": "\u0000base\u0000\n" });
    const V = pousser(d, "feat/a", { "apps/img.bin": "\u0000pr\u0000\n" });
    cibleAvance(d, () => d.ecrire("apps/img.bin", "\u0000cible\u0000\n"));
    const T = conclure(d, V, () => {
      d.git("checkout", "--ours", "--", "apps/img.bin");
      d.git("add", "apps/img.bin");
    });
    estDifferent(juger(d, V, T), conflit("apps/img.bin"));
  }
  // Les marqueurs de conflit commités tels quels : l'arbre de T est celui de la fusion calculée.
  {
    const d = depotJouet();
    pousser(d, "develop", { "apps/f.ts": "l1\nl2\nl3\n" });
    const V = pousser(d, "feat/a", { "apps/f.ts": "l1\nPR\nl3\n" });
    cibleAvance(d, () => d.ecrire("apps/f.ts", "l1\nCIBLE\nl3\n"));
    const D = d.git("rev-parse", "origin/develop");
    const calcul = spawnSync("git", ["merge-tree", "--write-tree", V, D], { cwd: d.travail, env: d.env, encoding: "utf8" });
    assert.equal(calcul.status, 1, "la fusion calculée est en conflit");
    const T = d.git("commit-tree", calcul.stdout.split("\n")[0], "-p", V, "-p", D, "-m", "Merge");
    assert.match(d.git("show", `${T}:apps/f.ts`), /^<<<<<<< /m, "T porte les marqueurs");
    estDifferent(juger(d, V, T), conflit("apps/f.ts"));
  }
  // Un sous-module déplacé des deux côtés, conclu du côté de la PR.
  {
    const d = depotJouet();
    const lien = (sha) => d.git("update-index", "--add", "--cacheinfo", `160000,${sha},vendor/lib`);
    const [s0, s1, s2] = ["a", "b", "c"].map((c) => c.repeat(40));
    d.git("switch", "-q", "-C", "develop", "origin/develop");
    lien(s0);
    d.git("commit", "-q", "-m", "feat: un sous-module");
    d.git("push", "-q", "origin", "HEAD:refs/heads/develop");
    d.git("fetch", "-q", "origin");
    d.git("switch", "-q", "-C", "feat/a", "origin/develop");
    lien(s1);
    d.git("commit", "-q", "-m", "feat: le sous-module avance");
    const V = d.git("rev-parse", "HEAD");
    d.git("switch", "-q", "-C", "develop", "origin/develop");
    lien(s2);
    d.git("commit", "-q", "-m", "feat: la cible avance le sous-module");
    d.git("push", "-q", "origin", "HEAD:refs/heads/develop");
    d.git("fetch", "-q", "origin");
    const T = conclure(d, V, () => lien(s1));
    estDifferent(juger(d, V, T), conflit("vendor/lib"));
  }
  // Un conflit sur un index à commande et sur du code à la fois, le code conclu comme la fusion calculée.
  {
    const d = depotJouet();
    pousser(d, "develop", { "apps/f.ts": "l1\nl2\nl3\n" });
    const V = pousser(d, "feat/a", { "apps/f.ts": "l1\nPR\nl3\n", [`${ADR}/ADR_1.md`]: "# 1\n", [`${ADR}/README.md`]: index("ADR_1.md") });
    cibleAvance(d, () => {
      d.git("rm", "-q", "apps/f.ts");
      d.ecrire(`${ADR}/ADR_2.md`, "# 2\n");
      d.ecrire(`${ADR}/README.md`, index("ADR_2.md"));
    });
    const T = conclure(d, V, () => {
      d.ecrire(`${ADR}/README.md`, index("ADR_1.md", "ADR_2.md"));
      d.git("add", "-A");
    });
    estDifferent(juger(d, V, T), conflit("apps/f.ts"));
  }
  // Le conflit sur le seul index à commande, lui, reste une mise à jour (cas 4) : rejoué ici par l'auteur.
  {
    const d = depotJouet();
    const V = conflitIndex(d);
    const T = conclure(d, V, () => {
      d.ecrire(`${ADR}/README.md`, index("ADR_1.md", "ADR_2.md"));
      d.git("add", "-A");
    });
    estMeme(juger(d, V, T), /1 fusion/);
  }
});

test("A-125 : un index n'est dispensé que s'il est déclaré à commande sur la cible et sur T", () => {
  const d = depotJouet();
  const DB = "apps/api/src/generated/db.ts";
  declarer(d, [ADR_CMD, { chemin: DB, commande: "true" }]);
  // Déclaré des deux côtés : un commit qui ne touche que lui garde le verdict.
  const V0 = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  estMeme(juger(d, V0, pousser(d, "feat/a", { [DB]: "1\n" })), /1 commit\(s\) d'index/);
  // V retire l'entrée de la liste (ou la garde sans commande, ou sous un motif, ou retire la liste) ; le commit
  // suivant récrit le fichier, que plus rien ne régénérera.
  const listes = [[ADR_CMD], [ADR_CMD, DB], [ADR_CMD, { chemin: DB }], [ADR_CMD, { chemin: "apps/api/src/generated/*", commande: "true" }], []];
  listes.forEach((liste, i) => {
    const V = pousser(d, `feat/retire-${i}`, { [LISTE]: JSON.stringify({ index: liste }) });
    const T = pousser(d, `feat/retire-${i}`, { [DB]: "2\n" });
    estDifferent(juger(d, V, T), /apps\/api\/src\/generated\/db\.ts, index à commande de origin\/develop, n'est plus déclaré à commande sur T$/);
  });
  {
    d.git("switch", "-q", "-C", "feat/sans-liste", "origin/develop");
    d.git("rm", "-q", LISTE);
    d.git("commit", "-q", "-m", "chore: retire la liste");
    const V = d.git("rev-parse", "HEAD");
    d.ecrire(DB, "2\n");
    d.git("add", "-A");
    d.git("commit", "-q", "-m", "feat: db");
    estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /n'est plus déclaré à commande sur T$/);
  }
  // Une liste de T mal formée : illisible, jamais « même ».
  const V = pousser(d, "feat/casse", { [LISTE]: "{" });
  const T = pousser(d, "feat/casse", { [DB]: "2\n" });
  estIllisible(juger(d, V, T), /^scripts\/docs\/index-generes\.json de T \([0-9a-f]{9}\) mal formé$/);
});

test("A-125 : un caractère de contrôle dans un chemin déclaré : liste mal formée, illisible", () => {
  for (const chemin of ["apps/a.ts\u0000", "\u0000apps/a.ts", "apps/\u0001a.ts", "apps/a.ts\u007f", "apps/a\tb.ts", "apps/a.ts\n"]) {
    for (const entree of [chemin, { chemin, commande: "true" }]) {
      const d = depotJouet();
      declarer(d, [ADR_CMD, entree]);
      const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
      const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
      estIllisible(juger(d, V, T), /^scripts\/docs\/index-generes\.json de origin\/develop mal formé$/);
    }
  }
});

test("A-125 : un objet illisible à la base de la fusion n'est pas un conflit : illisible", () => {
  const d = depotJouet();
  const base = d.git("rev-parse", "origin/develop");
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "apps/a.ts": "cible\n" });
  const T = miseAJour(d, "feat/a", "develop", rien); // conflit sur apps/a.ts, conclu du côté de la cible
  estDifferent(juger(d, V, T), /apps\/a\.ts/);
  // L'arbre de la base de fusion disparaît : git 2.43 l'écrit sur sa sortie d'erreur et sort en 1, comme pour un
  // conflit ; un git plus récent (2.56) sort en 128. Les deux se lisent « illisible ».
  const arbre = d.git("rev-parse", `${base}^{tree}`);
  const objet = join(d.git("rev-parse", "--path-format=absolute", "--git-path", "objects"), arbre.slice(0, 2), arbre.slice(2));
  assert.ok(existsSync(objet), "l'arbre de la base est un objet libre du clone");
  rmSync(objet);
  estIllisible(juger(d, V, T), /^git merge-tree --write-tree (a écrit une erreur|en échec \(128\)) sur [0-9a-f]{9}$/);
});

// ── Retouches du second tour de contre-relecture ────────────────────────────────────────────────────────────
test("un `alternates` périmé du dépôt réel n'est pas une erreur de la fusion calculée ; un objet illisible le reste", () => {
  const d = depotJouet();
  const base = d.git("rev-parse", "origin/develop");
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  estMeme(juger(d, V, T), /1 fusion/);
  // Le dépôt réel emprunte des objets à un dossier disparu : git l'écrit sur la sortie d'erreur de chaque commande.
  const objets = d.git("rev-parse", "--path-format=absolute", "--git-path", "objects");
  const arbre = d.git("rev-parse", `${base}^{tree}`);
  const objet = join(objets, arbre.slice(0, 2), arbre.slice(2));
  mkdirSync(join(objets, "info"), { recursive: true });
  appendFileSync(join(objets, "info", "alternates"), `${join(d.racine, "disparu", "objects")}\n`);
  const bruit = spawnSync("git", ["cat-file", "-e", `${T}^{commit}`], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.deepEqual([bruit.status, bruit.stderr !== ""], [0, true], "git réussit et l'écrit sur sa sortie d'erreur");
  estMeme(juger(d, V, T), /1 fusion/);
  // Avec ce bruit de fond, l'arbre de la base de fusion qui disparaît reste « illisible ».
  assert.ok(existsSync(objet), "l'arbre de la base est un objet libre du clone");
  rmSync(objet);
  estIllisible(juger(d, V, T), /^git merge-tree --write-tree (a écrit une erreur|en échec \(128\)) sur [0-9a-f]{9}$/);
});

test("la liste des index ne se dispense jamais elle-même, même déclarée index à commande", () => {
  const d = depotJouet();
  const DB = "apps/api/src/generated/db.ts";
  const liste = [ADR_CMD, { chemin: DB, commande: "true" }, { chemin: LISTE, commande: "true" }];
  declarer(d, liste);
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  // Les autres index à commande restent dispensés.
  estMeme(juger(d, V, pousser(d, "feat/a", { [DB]: "1\n" })), /1 commit\(s\) d'index/);
  // La liste récrite après V, quoi qu'elle devienne : avec une entrée de plus, de moins, ou la même autrement écrite.
  const recrites = [[...liste, { chemin: "apps/a.ts", commande: "true" }], liste.slice(0, 2), liste];
  recrites.forEach((recrite, i) => {
    const W = pousser(d, `feat/liste-${i}`, { "apps/a.ts": "a\n" });
    const X = pousser(d, `feat/liste-${i}`, { [LISTE]: JSON.stringify({ index: recrite }, null, 2) });
    estDifferent(juger(d, W, X), /scripts\/docs\/index-generes\.json, la liste des index, ne se dispense jamais elle-même$/);
  });
  // Et dans une fusion : la cible et la PR récrivent la liste, le conflit est conclu du côté de la cible.
  const W = pousser(d, "feat/conflit", { [LISTE]: JSON.stringify({ index: [...liste, "docs/pr.md"] }) });
  pousser(d, "develop", { [LISTE]: JSON.stringify({ index: [...liste, "docs/cible.md"] }) });
  const X = miseAJour(d, "feat/conflit", "develop", rien);
  assert.equal(parents(d, X).length, 2);
  estDifferent(juger(d, W, X), /scripts\/docs\/index-generes\.json/);
});

test("une déclaration ambiguë ne dispense pas : chemin déclaré deux fois, ou couvert aussi par un motif, sur la cible ou sur T", () => {
  const DB = "apps/api/src/generated/db.ts";
  const CMD = { chemin: DB, commande: "true" };
  const ambigues = [
    [ADR_CMD, CMD, DB], // un doublon sans commande à côté de l'entrée à commande
    [ADR_CMD, DB, CMD],
    [ADR_CMD, CMD, { chemin: DB }],
    [ADR_CMD, CMD, { chemin: DB, commande: "false" }], // deux entrées à commande
    [ADR_CMD, CMD, "apps/api/src/generated/*"], // couvert aussi par un motif sans commande
    [ADR_CMD, CMD, "apps/api/*/generated/db.ts"],
  ];
  const ambigu = /apps\/api\/src\/generated\/db\.ts est déclaré plus d'une fois, ou couvert aussi par un motif, sur origin\/develop ou sur T : il se juge comme tout fichier$/;
  for (const liste of ambigues) {
    // Sur la cible (et sur T, qui part d'elle).
    {
      const d = depotJouet();
      declarer(d, liste);
      const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
      estDifferent(juger(d, V, pousser(d, "feat/a", { [DB]: "1\n" })), ambigu);
    }
    // Sur la cible seulement : V récrit la liste, où l'index n'est plus déclaré qu'une fois.
    {
      const d = depotJouet();
      declarer(d, liste);
      const V = pousser(d, "feat/a", { [LISTE]: JSON.stringify({ index: [ADR_CMD, CMD] }) });
      estDifferent(juger(d, V, pousser(d, "feat/a", { [DB]: "1\n" })), ambigu);
    }
    // Sur T seulement : la cible déclare l'index une fois, V récrit la liste.
    {
      const d = depotJouet();
      declarer(d, [ADR_CMD, CMD]);
      const V = pousser(d, "feat/a", { [LISTE]: JSON.stringify({ index: liste }) });
      estDifferent(juger(d, V, pousser(d, "feat/a", { [DB]: "1\n" })), ambigu);
    }
  }
  // Un motif à commande qui couvre le chemin : la classe « motif » d'avant, toujours « différent ».
  {
    const d = depotJouet();
    declarer(d, [ADR_CMD, CMD, { chemin: "apps/api/src/generated/*", commande: "true" }]);
    const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
    estDifferent(juger(d, V, pousser(d, "feat/a", { [DB]: "1\n" })), /index sans commande ou déclaré par motif/);
  }
  // Témoin : déclaré une seule fois, à côté d'un motif qui ne le couvre pas et d'un doublon d'un autre chemin.
  {
    const d = depotJouet();
    declarer(d, [ADR_CMD, CMD, "apps/web/generated/*", "docs/x.md", "docs/x.md"]);
    const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
    estMeme(juger(d, V, pousser(d, "feat/a", { [DB]: "1\n" })), /1 commit\(s\) d'index/);
  }
});

// ── Ticket 62 : le clone partiel nommé, et `safe.directory` lu comme `A-135` et `A-143` le disent ───────────────
// Un dépôt jouet, une PR mise à jour avec develop : la vraie réponse est « même ».
function retard() {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  return { d, V, T };
}
const PARTIEL = /^dépôt partiel : des objets manquent et ce calcul ne télécharge rien, à cloner en entier avant de l'appeler \(git clone sans --filter\)$/;

test("un clone partiel (`--filter`) : illisible, la raison nomme la cause et le remède ; cloné en entier, la vraie réponse", () => {
  const { d, V, T } = retard();
  assert.equal(spawnSync("git", ["config", "uploadpack.allowFilter", "true"], { cwd: d.origine, env: d.env }).status, 0);
  const clones = dossierTemporaire("clones-");
  const cloner = (nom, ...options) => {
    const r = spawnSync("git", ["clone", "-q", "--no-checkout", ...options, `file://${d.origine}`, join(clones, nom)], { env: d.env, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    return join(clones, nom);
  };
  const dans = (cwd, ...args) => spawnSync("git", args, { cwd, env: d.env, encoding: "utf8" });
  const partiel = cloner("partiel", "--filter=blob:none");
  assert.equal(dans(partiel, "config", "remote.origin.promisor").stdout.trim(), "true", "le montage est bien partiel");
  estIllisible(juger(d, V, T, "develop", { cwd: partiel }), PARTIEL);
  estMeme(juger(d, T, T, "develop", { cwd: partiel }), /V est T/); // V égal à T ne lit rien : même, partiel ou non
  const entier = cloner("entier");
  estMeme(juger(d, V, T, "develop", { cwd: entier }), /1 fusion\(s\) de origin\/develop/);
  // Le partiel se reconnaît à la configuration du dépôt, pas à ses objets : un clone entier marqué l'est aussi.
  for (const [cle, valeur] of [["remote.origin.promisor", "true"], ["extensions.partialclone", "origin"]]) {
    const marque = cloner(`marque-${cle}`);
    if (cle.startsWith("extensions.")) assert.equal(dans(marque, "config", "core.repositoryformatversion", "1").status, 0);
    assert.equal(dans(marque, "config", cle, valeur).status, 0);
    estIllisible(juger(d, V, T, "develop", { cwd: marque }), PARTIEL);
  }
  // m1 : la marque lue aussi dans un `include` de la configuration du dépôt, et dans `config.worktree`, comme git la lit.
  const inclus = cloner("marque-incluse");
  writeFileSync(join(inclus, ".git", "promisor.gitconfig"), '[remote "origin"]\n\tpromisor = true\n');
  assert.equal(dans(inclus, "config", "include.path", "promisor.gitconfig").status, 0);
  estIllisible(juger(d, V, T, "develop", { cwd: inclus }), PARTIEL);
  const parArbre = cloner("marque-worktree");
  assert.equal(dans(parArbre, "config", "extensions.worktreeConfig", "true").status, 0);
  assert.equal(dans(parArbre, "config", "--worktree", "remote.origin.promisor", "true").status, 0);
  estIllisible(juger(d, V, T, "develop", { cwd: parArbre }), PARTIEL);
  const faux = cloner("promisor-faux");
  assert.equal(dans(faux, "config", "remote.origin.promisor", "false").status, 0);
  estMeme(juger(d, V, T, "develop", { cwd: faux }), /1 fusion\(s\) de origin\/develop/);
});

// A-159 : le calcul demande à git s'il admet le dépôt, dans le même dossier et le même environnement, et ne lit que
// si git admet. Chaque cellule joue git lui-même (l'oracle) puis le calcul : « lu » quand git admet, « refusé » quand
// git refuse, la cause de git dans la raison. Les cellules marquées « violation » sont celles où, au sommet 557cbc3
// (A-135, A-154), le calcul lisait un dépôt que git refuse (contre-relecture de la PR 140).
const REFUS = "pas dans un dépôt git que git admet : ";
function cellules(d, V, T) {
  const vrai = spawnSync("sh", ["-c", "command -v git"], { env: d.env, encoding: "utf8" }).stdout.trim();
  const reel = realpathSync(d.travail);
  const lie = join(realpathSync(dossierTemporaire("arbre-lie-")), "lie");
  assert.equal(spawnSync("git", ["worktree", "add", "-q", "--detach", lie, T], { cwd: d.travail, env: d.env }).status, 0);
  // Un `git` de banc, en tête du PATH, fait tenir le dépôt jouet et son arbre lié pour ceux d'un autre propriétaire
  // (la variable de test de git), et eux seuls.
  const bin = dossierTemporaire("git-autre-");
  writeFileSync(join(bin, "git"), `#!/bin/sh\ncase "$(pwd -P)/" in ${JSON.stringify(`${reel}/`)}*|${JSON.stringify(`${lie}/`)}*) GIT_TEST_ASSUME_DIFFERENT_OWNER=1; export GIT_TEST_ASSUME_DIFFERENT_OWNER ;; esac\nexec ${JSON.stringify(vrai)} "$@"\n`, { mode: 0o755 });
  const cfg = dossierTemporaire("configuration-");
  const maison = join(cfg, "maison");
  const xdg = join(cfg, "xdg");
  mkdirSync(join(xdg, "git"), { recursive: true });
  mkdirSync(maison, { recursive: true });
  const fichier = (nom) => join(cfg, nom);
  // Une cellule : la configuration de l'utilisateur, du poste et XDG (null : fichier absent), le dossier courant, des
  // variables de plus ; rend [ce que dit git, ce que dit le calcul].
  const jouer = ({ globale = null, systeme = "", xdgDit = null, cwd = d.travail, env = {} }) => {
    rmSync(join(maison, ".gitconfig"), { force: true });
    if (globale !== null) writeFileSync(join(maison, ".gitconfig"), globale);
    writeFileSync(fichier("systeme"), systeme);
    writeFileSync(join(xdg, "git/config"), xdgDit ?? "");
    if (xdgDit === null) rmSync(join(xdg, "git/config"));
    const tout = { ...d.env, PATH: `${bin}:${d.env.PATH}`, HOME: maison, XDG_CONFIG_HOME: xdg, GIT_CONFIG_GLOBAL: undefined, GIT_CONFIG_NOSYSTEM: undefined, GIT_CONFIG_SYSTEM: fichier("systeme"), ...env };
    for (const [k, v] of Object.entries(tout)) if (v === undefined) delete tout[k];
    const oracle = spawnSync("git", ["rev-parse", "--verify", "-q", "HEAD"], { cwd, env: { ...tout, LC_ALL: "C" }, encoding: "utf8" });
    const git = oracle.status === 0 ? "lu" : "refusé";
    // La cause que git donne lui-même : sa première ligne `fatal:`, s'il en écrit une.
    const cause = oracle.stderr.split("\n").find((l) => l.startsWith("fatal:")) ?? null;
    const r = juger(d, V, T, "develop", { cwd, env: tout });
    const calcul = r.code === 21 && r.raison.startsWith(REFUS) ? "refusé" : r.code === 21 && /introuvable|n'est pas un commit/.test(r.raison) ? "lu" : r.code === 0 || r.code === 20 ? "lu" : r.sortie;
    return { git, calcul, raison: r.raison, cause };
  };
  return { reel, lie, cfg, fichier, jouer };
}
const SD = (v) => `[safe]\n\tdirectory = ${v}\n`;
const SB = (v) => `[safe]\n\tbareRepository = ${v}\n`;
// Une faute par cellule qui s'écarte de git (ou dont git ne dit pas ce que la cellule montre), toutes rendues ensemble.
function comme(fautes, cellule, nom, attendu) {
  if (cellule.calcul !== cellule.git) fautes.push(`${nom} : le calcul dit ${cellule.calcul}, git ${cellule.git} (${cellule.raison})`);
  else if (attendu && cellule.git !== attendu) fautes.push(`${nom} : git dit ${cellule.git}, la cellule le montre ${attendu}`);
  else if (cellule.git === "refusé" && !/^pas dans un dépôt git que git admet : \S/.test(cellule.raison)) fautes.push(`${nom} : la cause de git n'est pas nommée (${cellule.raison})`);
  else if (cellule.git === "refusé" && cellule.cause && !cellule.raison.includes(cellule.cause.replace(/[\x00-\x1f\x7f]/g, " ").slice(0, 60))) fautes.push(`${nom} : la raison ne reprend pas la cause de git (${cellule.cause})`);
}

test("le dépôt d'un autre propriétaire : le calcul lit si, et seulement si, git l'admet (A-159)", () => {
  const { d, V, T } = retard();
  const { reel, lie, fichier, jouer } = cellules(d, V, T);
  const fautes = [];
  const c = (nom, opts, attendu) => comme(fautes, jouer(opts), nom, attendu);
  c("le témoin : aucune déclaration", {}, "refusé");
  c("déclaré par son chemin", { globale: SD(reel) }, "lu");
  c("déclaré par *", { globale: SD("*") }, "lu");
  c("le système déclare", { systeme: SD(reel) }, "lu");
  c("le système déclare, GIT_CONFIG_NOSYSTEM=1", { systeme: SD(reel), env: { GIT_CONFIG_NOSYSTEM: "1" } });
  c("depuis un sous-dossier", { globale: SD(reel), cwd: join(d.travail, "docs") }, "lu");
  c("une valeur vide efface la déclaration", { globale: SD(reel) + SD("") }, "refusé");
  c("XDG déclare, ~/.gitconfig remet à zéro", { xdgDit: SD(reel), globale: SD("") }, "refusé");
  c("XDG remet à zéro, ~/.gitconfig déclare", { xdgDit: SD(""), globale: SD(reel) }, "lu");
  writeFileSync(fichier("inclus"), SD(reel));
  c("déclaré par un fichier inclus", { globale: `[include]\n\tpath = ${fichier("inclus")}\n` }, "lu");
  c("une valeur à saut de ligne", { globale: `[safe]\n\tdirectory = "x\\n${reel}"\n` });
  c("GIT_CONFIG_COUNT déclare (git l'admet : le calcul aussi)", { env: { GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "safe.directory", GIT_CONFIG_VALUE_0: reel } }, "lu");
  c("GIT_CONFIG_PARAMETERS remet à zéro", { globale: SD(reel), env: { GIT_CONFIG_PARAMETERS: "'safe.directory='" } }, "refusé");
  // git écrit une ligne `error:` avant sa ligne `fatal:` : c'est la ligne `fatal:` qui est la cause.
  c("GIT_CONFIG_PARAMETERS mal formé", { globale: SD(reel), env: { GIT_CONFIG_PARAMETERS: "'x" } }, "refusé");
  c("entré par un lien symbolique, PWD gardé", (() => {
    const lien = join(dossierTemporaire("lien-"), "depot");
    symlinkSync(reel, lien);
    return { globale: SD(reel), cwd: lien, env: { PWD: lien } };
  })(), "lu");
  // Les violations de 557cbc3 : git meurt sur un ~utilisateur qu'il ne sait pas étendre, à n'importe quel rang.
  c("violation s38 : ~inconnu puis le chemin", { globale: SD("~nosuchuser42/x") + SD(reel) }, "refusé");
  c("violation s39 : le chemin puis ~inconnu", { globale: SD(reel) + SD("~nosuchuser42/x") }, "refusé");
  c("violation s40 : * au système, ~inconnu à l'utilisateur", { systeme: SD("*"), globale: SD("~nosuchuser42/x") }, "refusé");
  // … et un lieu de configuration relatif se lit depuis le dossier courant, comme git le lit.
  writeFileSync(join(d.travail, "raz.gitconfig"), SD(""));
  c("violation s51 : GIT_CONFIG_GLOBAL relatif qui remet à zéro, le système déclare", { systeme: SD(reel), env: { GIT_CONFIG_GLOBAL: "raz.gitconfig" } }, "refusé");
  rmSync(join(d.travail, "raz.gitconfig"));
  // m5 : la racine que le calcul trouverait diffère de celle de git ; un arbre lié d'un autre propriétaire.
  mkdirSync(join(d.travail, "docs/.git"), { recursive: true });
  c("s53 : un .git vide dans docs, docs déclaré, depuis docs", { globale: SD(join(reel, "docs")), cwd: join(d.travail, "docs") }, "refusé");
  c("s52 : un .git vide dans docs, le dépôt déclaré, depuis docs", { globale: SD(reel), cwd: join(d.travail, "docs") });
  rmSync(join(d.travail, "docs/.git"), { recursive: true });
  c("w01 : arbre lié d'un autre propriétaire, rien", { cwd: lie }, "refusé");
  c("w02 : arbre lié d'un autre propriétaire déclaré par son chemin", { globale: SD(lie), cwd: lie }, "lu");
  c("w03 : arbre lié, seul le dépôt principal déclaré", { globale: SD(reel), cwd: lie });
  c("w04 : arbre lié, *", { globale: SD("*"), cwd: lie }, "lu");  assert.deepEqual(fautes, []);
});

test("un dépôt nu trouvé sans --git-dir : le calcul lit si, et seulement si, git l'admet (A-159)", () => {
  const { d, V, T } = retard();
  const { fichier, jouer } = cellules(d, V, T);
  const nu = d.origine;
  const fautes = [];
  const c = (nom, opts, attendu) => comme(fautes, jouer({ cwd: nu, ...opts }), nom, attendu);
  c("le témoin : aucun réglage", {}, "lu");
  c("all", { globale: SB("all") }, "lu");
  c("explicit", { globale: SB("explicit") }, "refusé");
  c("le système explicit, l'utilisateur all", { systeme: SB("explicit"), globale: SB("all") }, "lu");
  c("le système all, l'utilisateur explicit", { systeme: SB("all"), globale: SB("explicit") }, "refusé");
  c("GIT_CONFIG_COUNT explicit", { env: { GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "safe.bareRepository", GIT_CONFIG_VALUE_0: "explicit" } }, "refusé");
  c("explicit, GIT_CONFIG_COUNT all", { globale: SB("explicit"), env: { GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "safe.bareRepository", GIT_CONFIG_VALUE_0: "all" } }, "lu");
  c("une valeur vide en dernier", { globale: SB("all") + SB("") }, "refusé");
  // Les violations de 557cbc3 : git valide chaque valeur, pas seulement la dernière.
  c("violation b08 : bogus puis all", { globale: SB("bogus") + SB("all") }, "refusé");
  c("violation b09 : le système vide, l'utilisateur all", { systeme: SB(""), globale: SB("all") }, "refusé");
  c("violation b10 : le système sans =, l'utilisateur all", { systeme: "[safe]\n\tbareRepository\n", globale: SB("all") }, "refusé");
  c("violation b11 : le système Explicit (casse), l'utilisateur all", { systeme: SB("Explicit"), globale: SB("all") }, "refusé");
  c("violation b12 : explicit, bogus, all", { globale: SB("explicit") + SB("bogus") + SB("all") }, "refusé");
  // b23 : le .git d'un arbre de travail à moi (un clone que le git de banc ne touche pas), comme dossier courant.
  const mien = join(dossierTemporaire("mien-"), "mien");
  assert.equal(spawnSync("git", ["clone", "-q", d.origine, mien], { env: d.env }).status, 0);
  c("violation b23 : le .git d'un arbre de travail, bogus puis all", { globale: SB("bogus") + SB("all"), cwd: join(mien, ".git") }, "refusé");
  c("le .git d'un arbre de travail, all (témoin de b23)", { globale: SB("all"), cwd: join(mien, ".git") });
  // … et les lieux de configuration relatifs, lus depuis le dossier courant.
  writeFileSync(join(nu, "expl.gitconfig"), SB("explicit"));
  c("violation b26 : GIT_CONFIG_GLOBAL relatif, explicit", { env: { GIT_CONFIG_GLOBAL: "expl.gitconfig" } }, "refusé");
  mkdirSync(join(nu, "h/git"), { recursive: true });
  writeFileSync(join(nu, "h/.gitconfig"), SB("explicit"));
  writeFileSync(join(nu, "h/git/config"), SB("explicit"));
  c("violation b35 : HOME relatif", { env: { HOME: "h" } }, "refusé");
  c("violation b36 : XDG_CONFIG_HOME relatif", { env: { XDG_CONFIG_HOME: "h" } }, "refusé");
  c("violation b37 : GIT_CONFIG_SYSTEM relatif", { env: { GIT_CONFIG_SYSTEM: "h/.gitconfig" } }, "refusé");
  rmSync(join(nu, "h"), { recursive: true });
  rmSync(join(nu, "expl.gitconfig"));
  // Un arbre de travail n'est pas un dépôt nu : explicit ne le refuse pas ; une valeur que git ne lit pas, si.
  // (L'arbre de travail du jouet passe ici pour celui d'un autre propriétaire : déclaré par `*`.)
  c("un arbre de travail sous explicit", { globale: SB("explicit") + SD("*"), cwd: d.travail }, "lu");
  c("un arbre de travail sous une valeur que git ne lit pas", { globale: SB("bogus") + SD("*"), cwd: d.travail });
  void fichier;
  assert.deepEqual(fautes, []);
});
