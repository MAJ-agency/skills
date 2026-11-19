// `sujet.sh fusionner` : une sous-PR en conflit avec son sujet. Sur des index générés seuls, la
// branche est mise à jour (sortie 8) au lieu d'être renvoyée ; hors index, sortie 3 et branche
// intacte ; sans conflit, squash comme avant. Dépôt jouet et faux `gh` : aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const SUJET = scriptDe("sujet", "sujet.sh");
const BOUCLE = scriptDe("fusionner", "boucle.sh");
const ADR = "docs/adr";
const index = (...adr) => adr.map((f) => `- ${f}\n`).join("");
// Écritures sur GitHub, hors commentaires du verrou du passage (posé, rafraîchi, terminé ou retiré par chaque passage,
// ticket 4 de capitaine-a-jour-et-teste) : les bancs du verrou les lisent dans le journal brut (`d.journal()`).
const passage = (e) => (/^issues\/\d+\/comments$|^issues\/comments\/\d+$/.test(e.route) && (e.methode === "DELETE" || (e.champs?.body ?? "").includes("<!-- capitaine:passage ")));
const horsPassage = (d) => d.journal().filter((e) => !passage(e));
const ecritures = (d) => horsPassage(d).map((e) => `${e.methode} ${e.route}`);

// Le sujet ajoute l'ADR 3, la sous-PR #80 l'ADR 2 (ou, avec `fichier`, un fichier de code en conflit). Sans
// conflit (« aucun »), la sous-PR part du sujet : elle est à jour (le cas en retard est le banc « retard de
// documentation seule »). Checks : verts sur l'ancien sommet seul (par son sha) ; sans conflit, sur tout commit.
function sousPrEnConflit(conflit) {
  const d = depotJouet();
  d.ecrire(`${ADR}/ADR_ALL_ARC-1-a.md`, "# 1\n");
  d.ecrire(`${ADR}/README.md`, index("ADR_ALL_ARC-1-a.md"));
  d.ecrire("docs/f.md", "0\n");
  d.commit("docs: adr 1");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  const sous = () =>
    d.branche(
      "docs/sous",
      conflit === "aucun" ? "origin/sujet/lot" : "origin/develop",
      conflit === "code"
        ? { "docs/f.md": "sous\n" }
        : conflit === "code2"
          ? { "docs/f.md": "sous\n", "docs/g.md": "sous\n" }
          : conflit === "mixte"
            ? { "docs/f.md": "sous\n", [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n", [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md") }
            : { [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n", [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md") },
    );
  const avant = conflit === "aucun" ? null : sous();
  d.branche(
    "sujet/lot",
    "origin/develop",
    conflit === "code"
      ? { "docs/f.md": "sujet\n" }
      : conflit === "code2"
        ? { "docs/f.md": "sujet\n", "docs/g.md": "sujet\n" }
        : conflit === "mixte"
          ? {
              "docs/f.md": "sujet\n",
              [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
              [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-3-c.md"),
            }
          : conflit === "index"
        ? {
            [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
            [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-3-c.md"),
          }
        : { "docs/autre.md": "autre\n" },
  );
  const sommet = avant ?? sous();
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: conflit === "aucun" ? { "*": { qualite: "SUCCESS" } } : { [sommet]: { qualite: "SUCCESS" } },
    pulls: [
      {
        number: 80,
        title: "docs(adr): ADR 2",
        head: "docs/sous",
        base: "sujet/lot",
        labels: ["à-fusionner"],
        body: "## Revue de ticket\n\nRien de bloquant.\n",
      },
    ],
  });
  return { d, sommet };
}

test("fusionner : conflit sur un index généré seul, la branche est mise à jour, index régénéré, sortie 8, aucun squash", () => {
  const { d, sommet } = sousPrEnConflit("index");
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 8, r.stdout + r.stderr);
  assert.match(r.stdout, /#80 en retard sur sujet\/lot : mise à jour poussée \([0-9a-f]+\), attente de la CI/);
  assert.match(r.stdout, /#80 : mise à jour avec sujet\/lot poussée, CI pas finie : repasse au tour suivant/);
  d.git("fetch", "-q", "origin");
  const tete = d.git("rev-parse", "origin/docs/sous");
  assert.notEqual(tete, sommet, "la branche de la sous-PR a avancé");
  assert.equal(
    d.git("rev-parse", `${tete}^1`),
    sommet,
    "avance rapide : l'ancien sommet est parent",
  );
  assert.equal(
    d.git("show", `${tete}:${ADR}/README.md`) + "\n",
    index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md", "ADR_ALL_ARC-3-c.md"),
  );
  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
  assert.equal(d.git("status", "--porcelain"), "");
});

test("fusionner : conflit hors index, sortie 3 et branche de la sous-PR intacte", () => {
  const { d, sommet } = sousPrEnConflit("code");
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/docs/sous"), sommet);
  assert.equal(d.git("status", "--porcelain"), "", "fusion annulée");
});

test("fusionner : sans conflit et à jour, squash comme avant, branche intacte", () => {
  const { d, sommet } = sousPrEnConflit("aucun");
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /#80 fusionnée dans sujet\/lot/);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/docs/sous"), sommet, "branche de la sous-PR intacte");
  assert.ok(ecritures(d).includes("PUT pulls/80/merge"));
});

test("fusionner : FORCE_COLOR=1 dans l'environnement ne fait refuser aucun titre", () => {
  const { d } = sousPrEnConflit("aucun");
  const r = spawnSync("bash", [SUJET, "fusionner", "80"], {
    cwd: d.travail,
    env: { ...d.env, FORCE_COLOR: "1", NO_COLOR: undefined },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(ecritures(d).includes("PUT pulls/80/merge"));
});

test("boucle.sh : la sortie 8 ne renvoie pas la PR (MISE À JOUR, aucun label ni commentaire)", () => {
  const { d } = sousPrEnConflit("index");
  d.publierChaine();
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#80\] MISE À JOUR avec sujet\/lot poussée, CI pas finie : repasse au tour suivant/);
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.ok(
    !ecritures(d).some((e) => /issues\/80\/(labels|comments)/.test(e)),
    ecritures(d).join(),
  );
  assert.deepEqual(d.etat().pulls[0].labels, ["à-fusionner"]);
});

// Une sous-PR en conflit avec son sujet n'a pas de CI (GitHub ne lance pas les workflows d'une PR qu'il ne sait pas
// fusionner) : `relancer` lit la règle d'ascendance avant toute fusion. Sur des index générés seuls, la branche est mise
// à jour comme par `fusionner` ; hors index, sortie 2 avec les fichiers, branche intacte (défaut 1, #1969 sur `fedora`).
const sansChecks = (conflit) => {
  const f = sousPrEnConflit(conflit);
  f.d.github({ checks: {} });
  return f;
};

test("relancer : conflit sur un index généré seul, la branche est mise à jour, index régénéré, poussée, sortie 0", () => {
  const { d, sommet } = sansChecks("index");
  const r = d.lancer(SUJET, "relancer", "80");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /#80 : sujet\/lot fusionné dans sa branche \([0-9a-f]+\), CI lancée/);
  d.git("fetch", "-q", "origin");
  const tete = d.git("rev-parse", "origin/docs/sous");
  assert.notEqual(tete, sommet, "la branche de la sous-PR a avancé");
  assert.equal(d.git("rev-parse", `${tete}^1`), sommet, "commit de fusion, l'ancien sommet premier parent");
  assert.equal(d.git("rev-parse", `${tete}^2`), d.git("rev-parse", "origin/sujet/lot"), "le sujet second parent");
  assert.equal(
    d.git("show", `${tete}:${ADR}/README.md`) + "\n",
    index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md", "ADR_ALL_ARC-3-c.md"),
  );
  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
  assert.equal(d.git("status", "--porcelain"), "");
});

test("relancer : conflit hors index, sortie 2, fichiers listés, branche intacte", () => {
  const { d, sommet } = sansChecks("code");
  const r = d.lancer(SUJET, "relancer", "80");
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stdout, /^conflit avec sujet\/lot hors index générés :\n {2}docs\/f\.md$/m);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/docs/sous"), sommet, "branche distante intacte");
  assert.deepEqual(horsPassage(d), [], "rien d'écrit");
  assert.equal(d.git("status", "--porcelain"), "");
});

// Un clone `--single-branch` (refspec de fetch limitée à develop) ne met à jour aucune `origin/<branche>` sur un
// `git fetch origin <branche>` nu : `relancer` passe des refspecs explicites.
test("relancer : sur un clone --single-branch, le sujet et la tête sont lus par refspec explicite", () => {
  const { d, sommet } = sansChecks("index");
  d.git("config", "remote.origin.fetch", "+refs/heads/develop:refs/remotes/origin/develop");
  d.git("update-ref", "-d", "refs/remotes/origin/sujet/lot");
  d.git("update-ref", "-d", "refs/remotes/origin/docs/sous");
  const r = d.lancer(SUJET, "relancer", "80");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const tete = d.git("ls-remote", "origin", "refs/heads/docs/sous").split("\t")[0];
  assert.equal(d.git("rev-parse", `${tete}^1`), sommet, "la branche de la sous-PR a avancé par une fusion");
});

test("relancer : une sous-PR qui a bougé depuis sa lecture n'est ni jugée ni poussée (sortie 5)", () => {
  const { d } = sansChecks("code");
  const etat = d.etat();
  etat.pulls[0].sha = d.git("rev-parse", "origin/develop");
  d.github(etat);
  const avant = d.git("ls-remote", "origin");
  const r = d.lancer(SUJET, "relancer", "80");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(r.stdout, /a bougé depuis sa lecture/);
  assert.equal(d.git("ls-remote", "origin"), avant);
});

// Contre-relecture (m1) : la boucle `file.sh | while read` partageait son entrée standard avec ce qu'elle lance ; le
// faux `pnpm` du jouet la lit (`cat > /dev/null`), comme tout outil qui lit l'entrée : après une mise à jour par
// `relancer`, les sous-PR suivantes n'étaient plus traitées dans le tour.
test("boucle.sh : deux sous-PR en conflit d'index, la première mise à jour par relancer sous un outil qui lit l'entrée, la seconde traitée dans le même tour", () => {
  const { d, sommet } = sansChecks("index");
  const autre = d.branche("docs/autre", "origin/develop", {
    [`${ADR}/ADR_ALL_ARC-4-d.md`]: "# 4\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-4-d.md"),
  });
  d.git("switch", "-q", "--detach", "origin/develop");
  const etat = d.etat();
  etat.pulls.push({ ...etat.pulls[0], number: 81, title: "docs(adr): ADR 4", head: "docs/autre" });
  d.github(etat);
  d.publierChaine();
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/docs/sous^1"), sommet, "#80 mise à jour");
  assert.equal(d.git("rev-parse", "origin/docs/autre^1"), autre, `#81 mise à jour dans le même tour : ${r.stdout}`);
});

// Contre-relecture (M1) : un conflit mixte ne nomme que les fichiers hors index générés ; l'index se régénère.
test("relancer : conflit mixte (code et index généré), seuls les fichiers hors index sont listés", () => {
  const { d, sommet } = sansChecks("mixte");
  const r = d.lancer(SUJET, "relancer", "80");
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stdout, /^conflit avec sujet\/lot hors index générés :\n {2}docs\/f\.md$/m);
  assert.doesNotMatch(r.stdout, /README\.md/);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/docs/sous"), sommet);
});

// Contre-relecture (M2) : GitHub rend encore l'ancien sommet, en conflit, alors que la session a déjà résolu et
// poussé. Sans le garde, `relancer` jugerait l'ancien sommet et la boucle renverrait à tort (sortie 2) : sortie 5.
test("relancer : GitHub rend l'ancien sommet en conflit alors que la session a résolu et poussé : sortie 5, aucun renvoi possible", () => {
  const { d, sommet } = sansChecks("code");
  d.git("switch", "-q", "--detach", "origin/docs/sous");
  spawnSync("git", ["merge", "-q", "--no-edit", "origin/sujet/lot"], { cwd: d.travail, env: d.env });
  d.ecrire("docs/f.md", "résolu\n");
  d.git("add", "docs/f.md");
  d.git("commit", "-q", "--no-edit");
  d.git("push", "-q", "origin", "HEAD:refs/heads/docs/sous");
  d.git("switch", "-q", "--detach", "origin/develop");
  const etat = d.etat();
  etat.pulls[0].sha = sommet;
  d.github(etat);
  const r = d.lancer(SUJET, "relancer", "80");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(r.stdout, /a bougé depuis sa lecture/);
  assert.doesNotMatch(r.stdout, /hors index générés/);
});

// Contre-relecture (B1, A-22) : le pre-push refuse la mise à jour d'index que pousse `relancer`, trace de husky dans sa
// sortie : la sous-PR est renvoyée avec la sortie du hook, jamais refaite en silence à chaque tour.
test("boucle.sh : relancer refusé par le pre-push (trace de husky) sur un conflit d'index, la sous-PR est renvoyée avec la sortie du hook", () => {
  const { d } = sansChecks("index");
  d.publierChaine();
  const dir = join(d.racine, "hooks-relancer");
  mkdirSync(dir);
  writeFileSync(join(dir, "pre-push"), '#!/bin/sh\necho "pre-push jouet : refus du lint" >&2\necho "husky - pre-push script failed (code 1)"\nexit 1\n');
  chmodSync(join(dir, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", dir);
  const avant = d.git("ls-remote", "origin", "refs/heads/docs/sous");
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const renvoi = horsPassage(d).find((e) => e.methode === "POST" && e.route === "issues/80/comments");
  assert.ok(renvoi, `renvoi posté : ${r.stdout}`);
  assert.match(renvoi.champs.body, /<!-- renvoi-capitaine -->/);
  assert.match(renvoi.champs.body, /le pre-push refuse le push de la mise à jour avec sujet\/lot\. Sortie du hook : .*pre-push jouet : refus du lint/);
  assert.equal(d.git("ls-remote", "origin", "refs/heads/docs/sous"), avant, "rien n'est poussé");
});

test("boucle.sh : une sous-PR prête (en conflit) sur un index seul est mise à jour par relancer, jamais renvoyée ; en conflit de code, renvoyée avec ses fichiers", () => {
  const { d } = sansChecks("index");
  d.publierChaine();
  const file = d.lancer(scriptDe("fusionner", "file.sh"));
  assert.match(file.stdout, /^80\tsujet\/lot : prête \(en conflit\)\t/m, file.stdout + file.stderr);
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#80\] #80 : sujet\/lot fusionné dans sa branche/);
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.ok(!ecritures(d).some((e) => /issues\/80\/(labels|comments)/.test(e)), ecritures(d).join());
  assert.deepEqual(d.etat().pulls[0].labels, ["à-fusionner"]);

  const c = sansChecks("code").d;
  c.publierChaine();
  const rc = c.lancer(BOUCLE);
  assert.equal(rc.status, 0, rc.stdout + rc.stderr);
  const renvoi = horsPassage(c).find((e) => e.methode === "POST" && e.route === "issues/80/comments");
  assert.ok(renvoi, `renvoi posté : ${rc.stdout}`);
  assert.match(renvoi.champs.body, /<!-- renvoi-capitaine -->/);
  assert.match(renvoi.champs.body, /conflit avec sujet\/lot hors index générés : `docs\/f\.md`\. Fusionner sujet\/lot dans la branche et le résoudre/);

  // Deux fichiers : la liste les prend tous les deux, et s'arrête à la ligne qui suit (le journal de la boucle).
  const g = sansChecks("code2").d;
  g.publierChaine();
  const rg = g.lancer(BOUCLE);
  assert.equal(rg.status, 0, rg.stdout + rg.stderr);
  const renvoi2 = horsPassage(g).find((e) => e.methode === "POST" && e.route === "issues/80/comments");
  assert.ok(renvoi2, `renvoi posté : ${rg.stdout}`);
  assert.match(renvoi2.champs.body, /hors index générés : `docs\/f\.md`, `docs\/g\.md`\. Fusionner/);
});

// Worktree du capitaine pas propre : rien que l'auteur de la sous-PR puisse corriger. Sortie 6 (comme
// passer.sh), jamais 4, que boucle.sh traiterait en renvoi (`fusion-bloquée`).
test("fusionner : worktree du capitaine pas propre, sortie 6 sans écriture, branche intacte", () => {
  const { d, sommet } = sousPrEnConflit("aucun");
  d.ecrire("brouillon.txt", "en cours\n");
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 6, r.stdout + r.stderr);
  assert.match(r.stdout, /arbre de travail pas propre/);
  assert.deepEqual(horsPassage(d), []);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/docs/sous"), sommet);
});

test("rafraichir et regrouper : worktree du capitaine pas propre, sortie 6 sans écriture (boucle.sh la distingue d'un conflit de sujet)", () => {
  const { d } = sousPrEnConflit("aucun");
  d.ecrire("brouillon.txt", "en cours\n");
  for (const args of [["rafraichir", "lot"], ["regrouper", "lot", "80"]]) {
    const r = d.lancer(SUJET, ...args);
    assert.equal(r.status, 6, args[0] + ": " + r.stdout + r.stderr);
    assert.match(r.stdout, /arbre de travail pas propre/);
  }
  assert.deepEqual(horsPassage(d), []);
});

test("boucle.sh : worktree du capitaine pas propre, la sous-PR n'est pas renvoyée (PAS PROPRE, aucun label ni commentaire)", () => {
  const { d } = sousPrEnConflit("aucun");
  d.publierChaine();
  d.ecrire("brouillon.txt", "en cours\n");
  const r = d.lancer(BOUCLE);
  assert.match(r.stdout, /\[#80\] PAS PROPRE : worktree du capitaine à nettoyer/);
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.ok(
    !ecritures(d).some((e) => /issues\/80\/(labels|comments)/.test(e)),
    ecritures(d).join(),
  );
  assert.deepEqual(d.etat().pulls[0].labels, ["à-fusionner"]);
});

test("sujet.sh fusionner : une sous-PR d'un sujet gelé sort en 7, jamais en 4, sans rien écrire", () => {
  const { d } = sousPrEnConflit("aucun");
  d.branche(
    "sujet/lot",
    "origin/sujet/lot",
    {
      "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md":
        "# carte\n\nSujet: sujet/lot\n\n## Fiche\n\nPhase: 4-vague-1\nGel: 2026-11-13 — pause\n",
    },
    "docs: carte",
  );
  d.git("switch", "-q", "--detach", "origin/develop");
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/lot est gelé/);
  assert.deepEqual(ecritures(d), []);
});

// PR de mise à jour #81 : le sujet et develop changent tous deux `conflit` (conflit de code) et ajoutent
// chacun une ADR (conflit sur l'index généré) ; develop touche aussi apps/a.ts, hors conflit. `base`,
// `sujetEnPlus`, `developEnPlus` et `resolution` : { chemin: contenu }, `null` retire le fichier. La
// branche maj/lot part de `depuis`, fusionne `fusion`, résout `conflit` et l'index (à la main et mal : la
// régénération le refait), committe (`message`, sinon celui de git), puis `avantPush(d)` (les retouches) et le push ;
// `avantFusion(d)` agit sur maj/lot avant la fusion ;
// `apres(d)` agit ensuite sur le distant.
const TICKET = "docs/features/demo/all/issues/SPEC_ALL_DEM-1-demo.01.issue.md";
const CARTE = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
const GARDE = "scripts/verify/gate-securite.mjs";
const appliquer = (d, fichiers) => {
  for (const [chemin, contenu] of Object.entries(fichiers))
    if (contenu === null) d.git("rm", "-q", "-f", "--", chemin);
    else d.ecrire(chemin, contenu);
};
function miseAJour({
  conflit = "docs/f.md",
  base = {},
  sujetEnPlus = {},
  developEnPlus = {},
  resolution = {},
  message = null,
  depuis = "origin/sujet/lot",
  fusion = "origin/develop",
  avantFusion = () => {},
  avantPush = () => {},
  apres = () => {},
  body = "Met lot à jour avec develop.\n",
} = {}) {
  const d = depotJouet();
  appliquer(d, { [conflit]: "0\n", [TICKET]: "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nDépendances: —\n", ...base });
  d.commit("docs: base");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-C", "sujet/lot", "origin/develop");
  appliquer(d, {
    [conflit]: "sujet\n",
    [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-3-c.md"),
    ...sujetEnPlus,
  });
  d.commit("feat: sujet avance");
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/lot");
  d.git("switch", "-q", "--detach", "origin/develop");
  appliquer(d, {
    [conflit]: "develop\n",
    "apps/a.ts": "export const a = 1;\n",
    [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-2-b.md"),
    ...developEnPlus,
  });
  d.commit("feat: develop avance");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-C", "maj/lot", depuis);
  avantFusion(d);
  const m = spawnSync("git", ["merge", "-q", "--no-edit", fusion], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.equal(m.status, 1, "conflit attendu : " + m.stdout + m.stderr);
  appliquer(d, { [conflit]: "résolu\n", [`${ADR}/README.md`]: index("ADR_ALL_ARC-3-c.md"), ...resolution });
  d.git("add", "-A");
  if (message === null) d.git("commit", "-q", "--no-edit");
  else d.git("commit", "-q", "-m", message);
  avantPush(d);
  d.git("push", "-q", "origin", "HEAD:refs/heads/maj/lot");
  const sommet = d.git("rev-parse", "HEAD");
  apres(d);
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 81, title: "chore(sujet): met lot à jour avec develop", head: "maj/lot", base: "sujet/lot", labels: ["à-fusionner"], body }],
  });
  return { d, sommet, sujet: d.git("rev-parse", "origin/sujet/lot"), develop: d.git("rev-parse", "origin/develop") };
}
const sujetDistant = (d) => {
  d.git("fetch", "-q", "origin");
  return d.git("rev-parse", "origin/sujet/lot");
};

test("fusionner : une PR de mise à jour entre dans le sujet par avance rapide, develop pour parent, index régénérés, aucun squash, PR fermée", () => {
  const { d, sommet, sujet, develop } = miseAJour();
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /#81 fusionnée dans sujet\/lot par avance rapide \(mise à jour avec develop, [0-9a-f]+\)/);
  const tete = sujetDistant(d);
  // L'index résolu à la main était faux : la régénération le refait, un commit de plus sur la résolution.
  assert.equal(d.git("rev-parse", `${tete}^1`), sommet, "le sommet de la PR est dans le sujet, tel quel");
  assert.equal(d.git("rev-parse", `${sommet}^1`), sujet, "premier parent : l'ancien sommet du sujet");
  assert.equal(d.git("rev-parse", `${sommet}^2`), develop, "second parent : develop");
  assert.equal(spawnSync("git", ["merge-base", "--is-ancestor", develop, tete], { cwd: d.travail, env: d.env }).status, 0);
  assert.equal(d.git("show", `${tete}:${ADR}/README.md`) + "\n", index("ADR_ALL_ARC-2-b.md", "ADR_ALL_ARC-3-c.md"));
  assert.equal(d.git("show", `${tete}:docs/f.md`), "résolu");
  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
  // La PR est fermée par le capitaine, avec le sommet qui l'a fait entrer : le tour suivant ne la squashe pas.
  const pr81 = d.etat().pulls[0];
  assert.equal(pr81.state, "closed");
  assert.match(pr81.commentaires.at(-1), new RegExp(`Entrée dans sujet/lot par avance rapide au sommet ${d.git("rev-parse", "--short", tete)}`));
  assert.equal(d.git("status", "--porcelain"), "");
});

test("fusionner : une PR de mise à jour qui écrit hors des fichiers en conflit (ligne Dépendances: d'un ticket) sort en 4, sujet inchangé", () => {
  const { d, sujet } = miseAJour({ resolution: { [TICKET]: "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nDépendances: `paquet-pirate`\n" } });
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /hors des fichiers en conflit.*SPEC_ALL_DEM-1-demo\.01\.issue\.md/);
  assert.equal(sujetDistant(d), sujet);
  assert.deepEqual(ecritures(d), []);
});

test("fusionner : une PR de mise à jour d'une autre forme n'entre pas (sujet avancé, develop premier parent, revue, suppression cachée par un renommage, index sans commande, message forgé, chemin cité, conflit modifier/supprimer ou binaire)", () => {
  const indexSansCommande = JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, "apps/genere.json"] });
  const cas = [
    [{ apres: (d) => d.branche("sujet/lot", "origin/sujet/lot", { "docs/autre.md": "autre\n" }, "docs: autre") }, 4, /premier parent.*sommet de sujet\/lot/],
    [{ depuis: "origin/develop", fusion: "origin/sujet/lot" }, 4, /premier parent.*sommet de sujet\/lot/],
    [{ conflit: "apps/x.ts" }, 4, /Revue/],
    // Conflit renommage/renommage : la résolution recrée le chemin d'origine avec le contenu d'un script de
    // garde et supprime ce script ; la détection des renommages ne montrerait que le chemin recréé.
    [
      {
        base: { "docs/ren.md": "à renommer\n", [GARDE]: "export const garde = true;\n" },
        sujetEnPlus: { "docs/ren.md": null, "docs/a.md": "à renommer\n" },
        developEnPlus: { "docs/ren.md": null, "docs/b.md": "à renommer\n" },
        resolution: { "docs/ren.md": "export const garde = true;\n", [GARDE]: null },
      },
      4,
      /hors des fichiers en conflit.*gate-securite\.mjs/,
    ],
    // Un index généré sans commande n'est jamais régénéré : réécrit hors conflit, il n'entre pas.
    [
      { base: { "scripts/docs/index-generes.json": indexSansCommande, "apps/genere.json": "{}\n" }, resolution: { "apps/genere.json": '{"pirate":true}\n' } },
      4,
      /hors des fichiers en conflit.*apps\/genere\.json/,
    ],
    // `sujet.sh livre` lit ces lignes dans les fusions de develop : une ligne forgée ferait passer un sujet pour livré.
    [{ message: "Merge remote-tracking branch 'origin/develop' into maj/lot\n\nSujet: sujet/fantome\n" }, 4, /message de la fusion/],
    [{ message: "Merge pull request #9 from o/sujet/fantome\n" }, 4, /message de la fusion/],
    // Un chemin de code que git cite entre guillemets (`"apps/q\"x.ts"`) : en conflit, il exige la revue.
    [{ conflit: 'apps/q"x.ts' }, 4, /Revue/],
    // Conflit modifier/supprimer, puis binaire : l'arbre recalculé porte déjà la version du sujet, la garder
    // ne fait aucun écart ; la revue porte aussi sur les fichiers en conflit.
    [{ base: { "apps/api/legacy.ts": "export const l = 0;\n" }, sujetEnPlus: { "apps/api/legacy.ts": "export const l = 1;\n" }, developEnPlus: { "apps/api/legacy.ts": null } }, 4, /Revue/],
    [{ base: { "apps/img.bin": "\0base\n" }, sujetEnPlus: { "apps/img.bin": "\0sujet\n" }, developEnPlus: { "apps/img.bin": "\0develop\n" } }, 4, /Revue/],
  ];
  for (const [options, sortie, motif] of cas) {
    const { d } = miseAJour(options);
    const avant = sujetDistant(d);
    const r = d.lancer(SUJET, "fusionner", "81");
    assert.equal(r.status, sortie, r.stdout + r.stderr);
    assert.match(r.stdout, motif);
    assert.equal(sujetDistant(d), avant, "sujet inchangé");
    assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
    assert.equal(d.git("status", "--porcelain"), "");
  }
});

test("fusionner : une PR de mise à jour d'un sujet gelé sort en 7, sans rien écrire", () => {
  const { d, sujet } = miseAJour({ sujetEnPlus: { [CARTE]: "# carte\n\nSujet: sujet/lot\n\n## Fiche\n\nPhase: 4-vague-1\nGel: 2026-11-14 — pause\n" } });
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/lot est gelé/);
  assert.equal(sujetDistant(d), sujet);
  assert.deepEqual(ecritures(d), []);
});

// Monotonie : la voie nouvelle pousse sans force. Un sujet qui bouge entre la lecture et le push (le
// pre-push du jouet y écrit un commit d'une autre session) n'est jamais réécrit : sortie 5, rien d'écrasé.
test("fusionner : une PR de mise à jour ne réécrit jamais le sujet, un sujet qui bouge pendant le push la laisse dehors (sortie 5)", () => {
  const { d, sommet } = miseAJour();
  const autre = d.branche("autre", "origin/sujet/lot", { "docs/autre.md": "autre\n" }, "docs: autre session");
  d.git("switch", "-q", "--detach", "origin/develop");
  const hooks = join(d.racine, "hooks");
  mkdirSync(hooks);
  writeFileSync(join(hooks, "pre-push"), `#!/bin/sh\ngit --git-dir=${JSON.stringify(d.origine)} update-ref refs/heads/sujet/lot ${autre}\n`);
  chmodSync(join(hooks, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", hooks);
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.equal(sujetDistant(d), autre, "le commit de l'autre session reste le sommet du sujet");
  assert.notEqual(spawnSync("git", ["merge-base", "--is-ancestor", sommet, "origin/sujet/lot"], { cwd: d.travail, env: d.env }).status, 0);
  assert.equal(d.etat().pulls[0].state ?? "open", "open", "PR laissée ouverte");
  assert.equal(d.git("status", "--porcelain"), "");
});

// Un échec côté capitaine (ici un git sans `merge-tree --write-tree`) n'est rien que la session puisse
// corriger : sortie 11, la boucle le dit et ne renvoie pas la PR.
test("fusionner : un échec du capitaine (git sans merge-tree --write-tree) sort en 11, et la boucle ne renvoie pas la PR", () => {
  const { d, sujet } = miseAJour();
  d.publierChaine();
  const vrai = spawnSync("sh", ["-c", "command -v git"], { env: d.env, encoding: "utf8" }).stdout.trim();
  writeFileSync(
    join(d.racine, "bin", "git"),
    `#!/bin/sh\nfor a in "$@"; do [ "$a" = merge-tree ] && { echo "git: merge-tree --write-tree inconnu" >&2; exit 129; }; done\nexec ${JSON.stringify(vrai)} "$@"\n`,
  );
  chmodSync(join(d.racine, "bin", "git"), 0o755);
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 11, r.stdout + r.stderr);
  assert.match(r.stdout, /merge-tree/);
  const b = d.lancer(BOUCLE);
  assert.match(b.stdout, /\[#81\] ÉCHEC DU CAPITAINE/);
  assert.doesNotMatch(b.stdout, /RENVOI/);
  assert.ok(!ecritures(d).some((e) => /issues\/81\/(labels|comments)/.test(e)), ecritures(d).join());
  assert.deepEqual(d.etat().pulls[0].labels, ["à-fusionner"]);
  assert.equal(sujetDistant(d), sujet);
});

test("boucle.sh : une PR de mise à jour prête est fusionnée (FUSIONNÉE), sans renvoi, et fermée", () => {
  const { d, sommet } = miseAJour();
  d.publierChaine();
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#81\] FUSIONNÉE dans sujet\/lot/);
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.equal(spawnSync("git", ["merge-base", "--is-ancestor", sommet, sujetDistant(d)], { cwd: d.travail, env: d.env }).status, 0);
  assert.equal(d.etat().pulls[0].state, "closed");
});

// Un déplacement hors de scripts/ ne cache pas la suppression : la revue est exigée sur les deux chemins.
test("fusionner : une sous-PR qui déplace un script hors de scripts/ exige la revue (renommage lu comme suppression et ajout)", () => {
  const d = depotJouet();
  d.ecrire(GARDE, "export const garde = true;\n");
  d.commit("chore: garde");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  d.git("switch", "-q", "-C", "docs/deplace", "origin/sujet/lot");
  d.git("mv", GARDE, "docs/garde.md");
  d.git("commit", "-q", "-m", "docs: déplace la garde");
  d.git("push", "-q", "origin", "HEAD:refs/heads/docs/deplace");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 82, title: "docs(lot): déplace la garde", head: "docs/deplace", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }],
  });
  const r = d.lancer(SUJET, "fusionner", "82");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/);
  assert.deepEqual(ecritures(d), []);
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

// La garde « hors conflit » ne s'ouvre jamais faute de liste : `index_regeneres_regex` introuvable, sortie 11.
// Un projet sans aucun index généré a une liste vide, qui ne dispense aucun chemin.
test("fusionner : une PR de mise à jour sans liste lisible des index régénérés sort en 11 ; un projet sans index généré passe, et rien n'y est dispensé", () => {
  const pirate = { [TICKET]: "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nDépendances: `paquet-pirate`\n" };
  const { d, sujet } = miseAJour({ resolution: pirate });
  const r = d.lancer(join(outilsSansRegeneres(d), "sujet.sh"), "fusionner", "81");
  assert.equal(r.status, 11, r.stdout + r.stderr);
  assert.match(r.stdout, /liste des index régénérés illisible/);
  assert.equal(sujetDistant(d), sujet);
  assert.deepEqual(ecritures(d), []);
  const aucun = { "scripts/docs/index-generes.json": JSON.stringify({ index: [] }) };
  const sans = miseAJour({ base: aucun });
  const r2 = sans.d.lancer(SUJET, "fusionner", "81");
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.equal(sujetDistant(sans.d), sans.sommet, "aucun index à régénérer : le sommet de la PR, tel quel");
  const sansPirate = miseAJour({ base: aucun, resolution: pirate });
  const r3 = sansPirate.d.lancer(SUJET, "fusionner", "81");
  assert.equal(r3.status, 4, r3.stdout + r3.stderr);
  assert.match(r3.stdout, /hors des fichiers en conflit.*SPEC_ALL_DEM-1-demo\.01\.issue\.md/);
});

// Une sous-PR qui change ce que la chaîne exécute (CI, hooks git et d'agent, install) ou du code d'une autre casse,
// sans section de revue : avant, squashée dans le sujet (sortie 0), puis exécutée par le capitaine au rafraîchissement.
test("fusionner : une sous-PR qui touche la configuration de la chaîne ou du code d'une autre casse sans section de revue sort en 4, sans squash", () => {
  for (const f of [".github/workflows/ci.yml", ".husky/pre-push", ".claude/settings.json", "package.json", ".npmrc", "Apps/api/x.ts", "docs/lint-staged.config.mjs", "tools/x.mjs", "docs/package.yaml", "docs/package.yml", "docs/x/package.json5"]) {
    const { d } = sousPrEnConflit("aucun");
    d.branche("chore/x", "origin/sujet/lot", { [f]: "x\n" }, "chore: x");
    d.git("switch", "-q", "--detach", "origin/develop");
    d.github({ pulls: [{ number: 80, title: "chore: x", head: "chore/x", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }] });
    const r = d.lancer(SUJET, "fusionner", "80");
    assert.equal(r.status, 4, `${f} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, f);
    assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), `${f} : aucun squash`);
  }
});

// Un index généré remplacé par un lien symbolique absolu vers un fichier hors du dépôt : la sous-PR (docs seule)
// entrait sans revue, et le `rafraichir` suivant du capitaine régénérait l'index à travers le lien.
test("fusionner : une sous-PR qui remplace un index généré par un lien symbolique sort en 4 ; rafraichir ne régénère jamais à travers un lien déjà dans le sujet", () => {
  const { d } = sousPrEnConflit("aucun");
  const dehors = join(d.racine, "dehors.txt");
  writeFileSync(dehors, "à moi\n");
  const lien = (branche, depuis) => {
    d.git("switch", "-q", "-C", branche, depuis);
    d.ecrire(`${ADR}/ADR_ALL_ARC-2-b.md`, "# 2\n");
    d.git("rm", "-q", `${ADR}/README.md`);
    symlinkSync(dehors, join(d.travail, `${ADR}/README.md`));
    d.git("add", "-A");
    d.git("commit", "-q", "-m", "docs(adr): ADR 2");
  };
  lien("docs/lien", "origin/sujet/lot");
  d.git("push", "-q", "origin", "HEAD:refs/heads/docs/lien");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [{ number: 80, title: "docs(adr): ADR 2", head: "docs/lien", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }] });
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /#80 lien symbolique sur un index généré ou son dossier : docs\/adr\/README\.md/);
  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
  // Le même lien déjà dans le sujet (entré avant cette version), develop qui avance : rafraichir abandonne.
  lien("sujet/lot", "origin/sujet/lot");
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/lot");
  d.branche("develop", "origin/develop", { "docs/autre.md": "autre\n" }, "docs: autre (#39)");
  d.git("switch", "-q", "--detach", "origin/develop");
  const sujetAvant = d.git("rev-parse", "origin/sujet/lot");
  const r2 = d.lancer(SUJET, "rafraichir", "lot");
  assert.equal(r2.status, 3, r2.stdout + r2.stderr);
  assert.match(r2.stderr, /lien symbolique sur un index généré ou son dossier : docs\/adr\/README\.md/);
  assert.equal(readFileSync(dehors, "utf8"), "à moi\n", "rien d'écrit hors du dépôt");
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/sujet/lot"), sujetAvant, "sujet inchangé");
  assert.equal(d.git("status", "--porcelain"), "");
});

// Le contrat d'une sous-PR se lit sur son sujet : un chemin sensible que le sujet déclare (et develop pas encore)
// exige la revue d'une sous-PR qui le touche.
test("fusionner : un chemin sensible du projet, lu dans le chaine.json du sujet, exige la revue d'une sous-PR", () => {
  const { d } = sousPrEnConflit("aucun");
  d.branche("sujet/lot", "origin/sujet/lot", { ".claude/chaine.json": JSON.stringify({ cheminsSensibles: ["infra/**"] }) }, "chore: contrat du lot");
  d.branche("infra/x", "origin/sujet/lot", { "infra/main.tf": "x\n" }, "chore: infra");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [{ number: 80, title: "chore: infra", head: "infra/x", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }] });
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale ».*\(infra\/main\.tf\)/);
  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
});

// Un sujet en retard sur develop : develop déclare `infra/**` après le départ du sujet. Le contrat du sujet ne le
// porte pas encore, celui de develop si : une sous-PR qui touche infra/ exige la revue.
test("fusionner : un chemin sensible déclaré par develop après le départ du sujet exige la revue d'une sous-PR", () => {
  const { d } = sousPrEnConflit("aucun");
  d.branche("develop", "origin/develop", { ".claude/chaine.json": JSON.stringify({ cheminsSensibles: ["infra/**"] }) }, "chore: contrat (#41)");
  d.branche("infra/x", "origin/sujet/lot", { "infra/main.tf": "x\n" }, "chore: infra");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [{ number: 80, title: "chore: infra", head: "infra/x", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }] });
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale ».*\(infra\/main\.tf\)/);
  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
});

// =============================================================================
// PR de mise à jour avec retouches (ticket 40) : la fusion d'abord, puis des commits ordinaires. Un fichier
// retouché est jugé comme une sous-PR (revue exigée sur l'union des fichiers que chaque retouche touche) ; le capitaine
// n'installe rien et ne joue aucun formateur (décision A-47 ter).
// =============================================================================

// Le faux `pnpm` du jouet : `exec commitlint` refuse une première ligne hors Conventional Commits ; le reste lit son
// entrée. Chaque appel est journalisé : un test peut dire que ni `install` ni `exec prettier` n'ont été joués.
function fauxPnpm(d) {
  const f = join(d.racine, "bin", "pnpm");
  writeFileSync(
    f,
    `#!/bin/sh
echo "pnpm $*" >> ${JSON.stringify(join(d.racine, "faux-gh", "pnpm.log"))}
case "$1 $2" in
  "exec commitlint") awk 'NR == 1 { l = $0 } END { exit !(l ~ /^[a-z]+(\\([^)]*\\))?!?: /) }' ;;
  *) cat > /dev/null ;;
esac
`,
  );
  chmodSync(f, 0o755);
}
const pnpmJoue = (d) => {
  const f = join(d.racine, "faux-gh", "pnpm.log");
  return existsSync(f) ? readFileSync(f, "utf8") : "";
};
// Le sujet porte un fichier de code que le « Prettier » de develop ne laisse pas tel quel.
const NON_FORMATE = { "apps/s.ts": 'export const s = "x";  \n' };
const FORMATE = "export const s = 'x';\n";
const retouche = (fichiers, message = "style: formate avec Prettier 3.9.10") => (d) => {
  appliquer(d, fichiers);
  d.commit(message);
};
function avecRetouche(options = {}) {
  const r = miseAJour({ sujetEnPlus: NON_FORMATE, ...options });
  fauxPnpm(r.d);
  return r;
}
const contient = (d, ancetre, tete) =>
  spawnSync("git", ["merge-base", "--is-ancestor", ancetre, tete], { cwd: d.travail, env: d.env }).status === 0;
const refusee = (d, r, avant, motif) => {
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(r.stdout, motif);
  assert.equal(sujetDistant(d), avant, "sujet inchangé");
  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ") || e.startsWith("PATCH ")), ecritures(d).join());
  assert.equal(d.git("status", "--porcelain"), "", "worktree du capitaine propre");
  assert.equal(d.git("rev-parse", "HEAD"), d.git("rev-parse", "origin/develop"), "worktree rendu à develop");
};

test("fusionner : une retouche de formatage sous apps/ se juge comme une sous-PR (sortie 4 sans section de revue, avance rapide avec elle), sans pnpm install ni formateur", () => {
  const formate = retouche({ "apps/s.ts": FORMATE });
  const { d, sujet } = avecRetouche({ avantPush: formate });
  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /sans section « Revue de ticket » ni « Revue adversariale ».*apps\/s\.ts/);
  assert.doesNotMatch(pnpmJoue(d), /pnpm (install|exec prettier)/);
  const revue = avecRetouche({ avantPush: formate, body: "Met lot à jour.\n\n## Revue de ticket\n\nRetouches relues.\n" });
  const r = revue.d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /#81 fusionnée dans sujet\/lot par avance rapide/);
  const tete = sujetDistant(revue.d);
  assert.ok(contient(revue.d, revue.sommet, tete), "le sommet de la PR est dans le sujet, tel quel");
  assert.equal(revue.d.git("rev-parse", `${revue.sommet}^^1`), revue.sujet, "premier parent de la fusion : l'ancien sommet du sujet");
  assert.equal(revue.d.git("log", "-1", "--format=%s", revue.sommet), "style: formate avec Prettier 3.9.10");
  assert.equal(revue.d.git("show", `${tete}:apps/s.ts`) + "\n", FORMATE);
  // Le seul `pnpm install` est celui de `avancer_sujet` (index régénérés), sur le sommet déjà jugé : jamais de formateur.
  assert.doesNotMatch(pnpmJoue(revue.d), /exec prettier|--ignore-scripts/);
  assert.ok(!ecritures(revue.d).some((e) => e.startsWith("PUT ")), "aucun squash");
  assert.equal(revue.d.etat().pulls[0].state, "closed");
  assert.equal(revue.d.git("status", "--porcelain"), "");
});

// Ce que la chaîne exécute ou lit (configuration de l'outil, npmrc, pnpmfile) exige la revue comme dans une sous-PR :
// rien ne les joue, aucun formateur, aucun pnpm install pour juger.
test("fusionner : une retouche d'un fichier de configuration d'outil (.prettierrc, .npmrc, .pnpmfile.cjs, prettier.config.mjs) exige la revue, sans rien exécuter", () => {
  for (const fichier of [".prettierrc", ".npmrc", ".pnpmfile.cjs", "prettier.config.mjs"]) {
    const { d, sujet } = avecRetouche({ avantPush: retouche({ [fichier]: "{}\n" }, "chore: outillage") });
    refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, new RegExp(`Revue.*${fichier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.doesNotMatch(pnpmJoue(d), /pnpm (install|exec prettier)/);
  }
});

test("fusionner : une retouche de code exige la revue, la section « Retouches » n'en dispense pas, une section de revue la fait entrer", () => {
  const code = retouche({ "apps/s.ts": "export const s = 'y';\n" }, "fix(lot): s vaut y");
  const retouches = "Met lot à jour avec develop.\n\n## Retouches\n\n- apps/s.ts : formatage Prettier 3.9.10\n";
  const { d, sujet } = avecRetouche({ avantPush: code, body: retouches });
  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /sans section « Revue de ticket » ni « Revue adversariale ».*apps\/s\.ts/);
  const revue = avecRetouche({ avantPush: code, body: `${retouches}\n## Revue adversariale\n\nRien de bloquant.\n` });
  const r = revue.d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(contient(revue.d, revue.sommet, sujetDistant(revue.d)));
});

test("fusionner : une PR de mise à jour d'une autre forme que « la fusion, puis des retouches » n'entre pas (deux fusions, retouche puis seconde fusion, retouche avant la fusion, message de retouche forgé ou hors Conventional Commits)", () => {
  // develop avance encore, et la session le fusionne une seconde fois.
  const secondeFusion = (d) => {
    d.git("switch", "-q", "--detach", "origin/develop");
    d.ecrire("docs/d2.md", "d2\n");
    d.commit("docs: develop encore");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    d.git("switch", "-q", "maj/lot");
    d.git("merge", "-q", "--no-edit", "origin/develop");
  };
  const cas = [
    [{ avantPush: secondeFusion }, 4, /une seule fusion de develop dans sujet\/lot, son premier commit/],
    [{ avantPush: (d) => (retouche({ "apps/s.ts": FORMATE })(d), secondeFusion(d)) }, 4, /une seule fusion/],
    // Un commit ordinaire avant la fusion : ce n'est pas une PR de mise à jour ; le chemin ordinaire juge tout le
    // develop apporté (apps/a.ts).
    [{ avantFusion: retouche({ "docs/avant.md": "avant\n" }, "docs: avant") }, 4, /sans section .*\(apps\/a\.ts\)/],
    [{ avantPush: retouche({ "apps/s.ts": FORMATE }, "style: formate\n\nSujet: sujet/fantome") }, 4, /retouche [0-9a-f]+ porte une ligne « Sujet: »/],
    [{ avantPush: retouche({ "apps/s.ts": FORMATE }, "formatage") }, 4, /retouche [0-9a-f]+ refusé par commitlint/],
  ];
  for (const [options, sortie, motif] of cas) {
    const { d } = avecRetouche(options);
    const avant = sujetDistant(d);
    const r = d.lancer(SUJET, "fusionner", "81");
    assert.equal(r.status, sortie, r.stdout + r.stderr);
    assert.match(r.stdout, motif);
    if (options.avantPush && /une seule fusion de develop/.test(r.stdout)) {
      const derniere = r.stdout.trim().split("\n").at(-1);
      assert.match(derniere, /git switch -c maj\/lot-2 origin\/sujet\/lot/, "la dernière ligne (celle que refus.sh renvoie) porte la recette");
      assert.match(derniere, /en une seule fusion/);
      // La recette, jouée telle qu'écrite dans le motif, dans un clone `--single-branch` (tout clone superficiel,
      // donc les sessions cloud) : le fetch doit créer origin/sujet/lot, et le switch partir de son sommet.
      const [, rapatrier, brancher] = derniere.match(/en une seule fusion : (git fetch [^;]+) ; (git switch [^;]+) ;/) ?? [];
      assert.ok(rapatrier && brancher, "le motif porte le fetch et le switch de la recette");
      const clone = join(d.racine, "clone-superficiel");
      const env = { ...d.env };
      assert.equal(spawnSync("git", ["clone", "-q", "--single-branch", "-b", "develop", d.origine, clone], { env }).status, 0);
      for (const geste of [rapatrier, brancher]) {
        const g = spawnSync("sh", ["-c", geste], { cwd: clone, env, encoding: "utf8" });
        assert.equal(g.status, 0, `${geste} : ${g.stderr}`);
      }
      const sommetClone = spawnSync("git", ["rev-parse", "HEAD"], { cwd: clone, env, encoding: "utf8" }).stdout.trim();
      assert.equal(sommetClone, spawnSync("git", ["rev-parse", "origin/sujet/lot"], { cwd: clone, env, encoding: "utf8" }).stdout.trim());
    }
    assert.equal(sujetDistant(d), avant, "sujet inchangé");
    assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
    assert.equal(d.git("status", "--porcelain"), "");
  }
});

// Comme une sous-PR : des en-têtes de ticket exigés par le gate (cas de fedora #1920) n'exigent pas de revue.
test("fusionner : une retouche de documentation après la fusion entre sans revue, sans pnpm install ni formateur", () => {
  const entete = "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nResponsable: session_a\nConducteur: session_b\nDépendances: —\n";
  const { d, sommet } = miseAJour({ avantPush: retouche({ [TICKET]: entete }, "docs(demo): en-têtes exigés par le gate") });
  fauxPnpm(d);
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(contient(d, sommet, sujetDistant(d)));
  assert.equal(d.git("show", `${sujetDistant(d)}:${TICKET}`) + "\n", entete);
  assert.doesNotMatch(pnpmJoue(d), /exec prettier/);
});

// Le pre-commit de la session formate parfois ce qu'il indexe dans la fusion (fedora #1918, #1919) : ce formatage ne
// se prouve plus, la fusion n'apporte que la résolution ; la session le met dans une retouche, après elle.
test("fusionner : une fusion qui écrit hors des fichiers en conflit est refusée (formatage compris), même avec une section de revue, sans rien exécuter", () => {
  for (const resolution of [
    { "apps/s.ts": FORMATE },
    { "apps/s.ts": "export const s = 'y';\n" },
    { [TICKET]: "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nDépendances: `paquet-pirate`\n" },
  ]) {
    const { d, sujet } = avecRetouche({ resolution, body: "## Revue adversariale\n\nRien.\n" });
    refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /hors des fichiers en conflit \(.*\) : la fusion n'apporte que la résolution/);
    assert.doesNotMatch(pnpmJoue(d), /pnpm (install|exec prettier)/);
  }
});

test("fusionner : des checks encore en cours sortent en 5 (reprise, aucun renvoi), des checks rouges en 3 avec leur nom", () => {
  for (const [etat, sortie, motif] of [
    ["IN_PROGRESS", 5, /checks encore en cours sur #81 : reprise au tour suivant/],
    ["FAILURE", 3, /checks rouges sur #81 : qualite/],
  ]) {
    const { d, sujet } = miseAJour();
    d.github({ checks: { "*": { qualite: etat } } });
    const r = d.lancer(SUJET, "fusionner", "81");
    assert.equal(r.status, sortie, r.stdout + r.stderr);
    assert.match(r.stdout, motif);
    assert.equal(sujetDistant(d), sujet);
  }
});

// Un hook git du capitaine qui refuse tout push, posé après la publication des scripts.
function prePushRefuse(d) {
  const hooks = join(d.racine, "hooks");
  mkdirSync(hooks, { recursive: true });
  // La trace de husky 9 (`.husky/_/h`), comme le hook d'un projet : sans elle, le refus se lit comme celui du distant.
  writeFileSync(join(hooks, "pre-push"), "#!/bin/sh\necho 'pnpm check rouge (formatage)' >&2\necho 'husky - pre-push script failed (code 1)'\nexit 1\n");
  chmodSync(join(hooks, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", hooks);
}

test("boucle.sh : une sous-PR que sujet.sh refuse en sortie 3 est renvoyée avec le motif de sujet.sh, jamais « conflit avec le sujet »", () => {
  const { d } = sousPrEnConflit("index");
  d.publierChaine();
  prePushRefuse(d);
  const r = d.lancer(BOUCLE);
  assert.match(r.stdout, /RENVOI/, r.stdout + r.stderr);
  const commentaire = d.etat().pulls[0].commentaires.at(-1);
  assert.match(commentaire, /mise à jour de #80 refusée par le hook pre-push/);
  assert.doesNotMatch(commentaire, /conflit avec le sujet/);
});

test("boucle.sh : un sujet dont la mise à jour est refusée par un hook se dit NON MIS À JOUR, jamais EN CONFLIT ; un vrai conflit reste SUJET EN CONFLIT", () => {
  for (const conflit of [false, true]) {
    const d = depotJouet();
    d.ecrire("docs/f.md", "0\n");
    d.commit("docs: base");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    d.branche("sujet/lot", "origin/develop", { [conflit ? "docs/f.md" : "docs/lot.md"]: "sujet\n" });
    d.git("switch", "-q", "--detach", "origin/develop");
    d.publierChaine();
    d.branche("autre", "origin/develop", { "docs/f.md": "develop\n" });
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    d.git("switch", "-q", "--detach", "origin/develop");
    if (!conflit) prePushRefuse(d);
    const r = d.lancer(BOUCLE);
    if (conflit) assert.match(r.stdout, /\[sujet\/lot\] SUJET EN CONFLIT avec develop/, r.stdout + r.stderr);
    else {
      assert.match(r.stdout, /\[sujet\/lot\] SUJET NON MIS À JOUR \(sortie 3, aucun conflit\)/, r.stdout + r.stderr);
      assert.doesNotMatch(r.stdout, /SUJET EN CONFLIT/);
    }
  }
});

// Relais de husky 9, simulé (la souche n'est pas dans le lockfile du plugin) : `core.hooksPath` vers un dossier dont
// chaque hook joue `.husky/<hook>` tel qu'il est dans l'arbre de travail du capitaine, comme `.husky/_/h`. `observe` :
// un chemin que chaque hook note dans `vu.log` s'il est alors dans l'arbre de travail.
function relaisHusky(d, observe = null) {
  const relais = join(d.racine, "relais-husky");
  mkdirSync(relais, { recursive: true });
  const note = observe ? `[ -e ${JSON.stringify(observe)} ] && echo "$(basename "$0")" >> ${JSON.stringify(join(d.racine, "vu.log"))}\n` : "";
  for (const hook of ["post-checkout", "post-merge", "pre-commit", "post-commit"]) {
    writeFileSync(join(relais, hook), `#!/bin/sh\n${note}h=".husky/$(basename "$0")"\n[ -f "$h" ] || exit 0\nexec sh -e "$h" "$@"\n`);
    chmodSync(join(relais, hook), 0o755);
  }
  d.git("config", "core.hooksPath", relais);
}
const lu = (d, nom) => (existsSync(join(d.racine, nom)) ? readFileSync(join(d.racine, nom), "utf8") : "");

// Relecture du 2026-11-16 (B1) : l'arbre de la PR n'est jamais extrait chez le capitaine, aucun hook ne se déclenche sur
// lui. Sur 7.9.1, la même PR sort en 4 sans rien exécuter : la voie nouvelle ne doit rien exécuter de plus.
test("fusionner : un hook (post-checkout, post-merge) que la fusion écrit hors conflit ne s'exécute jamais chez le capitaine, la PR sort en 4", () => {
  const { d, sujet } = avecRetouche({
    resolution: {
      ".husky/post-checkout": "echo post-checkout >> ../piege.log\n",
      ".husky/post-merge": "echo post-merge >> ../piege.log\n",
    },
  });
  relaisHusky(d);
  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /hors des fichiers en conflit \(\.husky\/post-checkout \.husky\/post-merge \)/);
  assert.doesNotMatch(pnpmJoue(d), /pnpm (install|exec prettier)/);
  assert.equal(lu(d, "piege.log"), "", "aucun hook de la PR exécuté");
});

test("fusionner : un fichier sous node_modules/ que la fusion écrit hors conflit n'est jamais écrit dans le dépôt du capitaine", () => {
  const piege = "node_modules/.bin/prettier";
  const { d, sujet } = avecRetouche({
    resolution: { [piege]: "#!/bin/sh\necho piege >> ../../../piege.log\n" },
  });
  relaisHusky(d, piege);
  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /hors des fichiers en conflit \(node_modules\/\.bin\/prettier \)/);
  assert.doesNotMatch(pnpmJoue(d), /pnpm (install|exec prettier)/);
  assert.equal(lu(d, "vu.log"), "", "le fichier n'a jamais été dans l'arbre de travail du capitaine");
  assert.ok(!existsSync(join(d.travail, piege)));
});

// Relecture du 2026-11-16 (B2) : une retouche intermédiaire entre telle quelle dans l'historique du sujet ; elle se
// prouve contre son parent, et la revue juge l'union des fichiers touchés commit par commit.
test("fusionner : la revue juge chaque retouche commit par commit ; un fichier ajouté par une retouche puis retiré par une autre exige la revue", () => {
  const cas = [
    (d) => {
      retouche({ "apps/pirate.ts": "export const p = 1;\n", ".github/workflows/x.yml": "on: push\n" }, "chore: ajoute")(d);
      retouche({ "apps/pirate.ts": null, ".github/workflows/x.yml": null, "apps/s.ts": FORMATE })(d);
    },
    (d) => {
      retouche({ "apps/pirate.ts": "export const p = 1;\n" }, "feat: pirate")(d);
      retouche({ "apps/pirate.ts": null }, "chore: retire")(d);
    },
  ];
  for (const avantPush of cas) {
    const { d, sujet } = avecRetouche({ avantPush });
    refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /Revue.*\((\.github\/workflows\/x\.yml|apps\/pirate\.ts)\)/);
  }
});

// Relecture du 2026-11-16 (mineure 1) : checks rouges ou lien sur un index, la PR est refusée sans que rien ne s'installe
// ni ne formate.
test("fusionner : une PR de mise à jour lit ses checks et ses liens sur les index avant de juger les retouches (rien installé, aucun formateur)", () => {
  const lien = (d) => {
    appliquer(d, { "apps/s.ts": FORMATE });
    d.git("rm", "-q", `${ADR}/README.md`);
    symlinkSync("../../README.md", join(d.travail, ADR, "README.md"));
    d.commit("style: formate");
  };
  const cas = [
    [retouche({ "apps/s.ts": FORMATE }), "FAILURE", 3, /checks rouges sur #81 : qualite/],
    [lien, "SUCCESS", 4, /lien symbolique sur un index généré/],
  ];
  for (const [avantPush, etat, sortie, motif] of cas) {
    const { d, sujet } = avecRetouche({ avantPush });
    d.github({ checks: { "*": { qualite: etat } } });
    const r = d.lancer(SUJET, "fusionner", "81");
    assert.equal(r.status, sortie, r.stdout + r.stderr);
    assert.match(r.stdout, motif);
    assert.equal(sujetDistant(d), sujet);
    assert.doesNotMatch(pnpmJoue(d), /pnpm (install|exec prettier)/);
  }
});

// Relecture du 2026-11-16 (mineure 4) : une panne du capitaine ou de sujet.sh n'est pas un hook rouge à retoucher.
test("boucle.sh : un sujet non mis à jour pour une panne du capitaine (sortie 11) ou une erreur de sujet.sh (69, 1) ne renvoie jamais à une PR de mise à jour", () => {
  for (const [code, motif] of [
    [11, /SUJET NON MIS À JOUR \(sortie 11, aucun conflit\) : outil du capitaine en échec.*rien à faire par une session/],
    [69, /SUJET NON MIS À JOUR \(sortie 69, aucun conflit\) : erreur de sujet\.sh .* rien à faire par une session/],
    [1, /SUJET NON MIS À JOUR \(sortie 1, aucun conflit\) : erreur de sujet\.sh .* rien à faire par une session/],
  ]) {
    const d = depotJouet();
    d.ecrire("docs/f.md", "0\n");
    d.commit("docs: base");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "sujet\n" });
    d.git("switch", "-q", "--detach", "origin/develop");
    d.publierChaine();
    // Le sujet.sh que la boucle copie d'origin/develop sort en <code> dès `rafraichir`.
    const s = d.lire("scripts/chaine/sujet.sh");
    assert.ok(s.includes("\nrafraichir() {\n"));
    d.ecrire("scripts/chaine/sujet.sh", s.replace("\nrafraichir() {\n", `\nrafraichir() {\n  echo "panne simulée" >&2\n  exit ${code}\n`));
    d.commit("chore: sujet.sh en panne");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    const r = d.lancer(BOUCLE);
    assert.match(r.stdout, motif, r.stdout + r.stderr);
    assert.doesNotMatch(r.stdout, /retouches|SUJET EN CONFLIT/);
  }
});

test("refus.sh : une sortie 3 sans motif lisible se dit « refusée en sortie 3 », jamais « sortie 4 »", () => {
  const d = depotJouet();
  d.branche("feat/x", "origin/develop", { "docs/x.md": "x\n" });
  d.github({ pulls: [{ number: 63, title: "docs(demo): x", head: "feat/x", base: "sujet/lot", labels: ["à-fusionner"] }] });
  const r = d.lancer(scriptDe("fusionner", "refus.sh"), "63", "absent.txt", "3");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /RENVOI : refusée en sortie 3, voir le journal du capitaine/);
});

// ── Règle d'ascendance : une sous-PR en retard sur son sujet n'entre qu'après mise à jour et retest ──────────────
// Le défaut vécu sur `fedora` (2026-11-18) : #1968 et #1979 squashées en retard sur leur sujet, chacune avec le même
// import ; la combinaison « sous-PR + dernier sujet » n'avait jamais été testée.
const misesAJour = (d, n) => d.journal().filter((e) => e.methode === "PUT" && e.route === `pulls/${n}/merge`);
const shaFusionne = (d, n) => JSON.parse(misesAJour(d, n)[0].entree).sha;

// #80 part du sujet ; le sujet reçoit ensuite `fichiersSujet`. L'ancien sommet est vert par son sha ; tout autre
// commit lit `etatNouveau` (une liste se consomme par sha : en cours, puis vert).
function sousPrEnRetard(fichiersSujet, etatNouveau = ["IN_PROGRESS", "SUCCESS"]) {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "feat(lot): lot (#1)");
  const ancien = d.branche("feat/sous", "origin/sujet/lot", { "docs/sous.md": "sous\n" });
  const sujet = d.branche("sujet/lot", "origin/sujet/lot", fichiersSujet, "feat(lot): a (#2)");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { [ancien]: { qualite: "SUCCESS" }, "*": { qualite: etatNouveau } },
    pulls: [
      {
        number: 80,
        title: "docs(lot): sous",
        head: "feat/sous",
        base: "sujet/lot",
        labels: ["à-fusionner"],
        body: "## Revue de ticket\n\nRien de bloquant.\n",
      },
    ],
  });
  return { d, ancien, sujet };
}

function verifierMiseAJourPuisSquash(d, ancien, sujet, r) {
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /#80 en retard sur sujet\/lot : mise à jour poussée \([0-9a-f]+\), attente de la CI/);
  assert.match(r.stdout, /#80 fusionnée dans sujet\/lot/);
  d.git("fetch", "-q", "origin");
  const nouveau = d.git("rev-parse", "origin/feat/sous");
  assert.equal(d.git("rev-parse", `${nouveau}^1`), ancien, "premier parent : l'ancien sommet");
  assert.equal(d.git("rev-parse", `${nouveau}^2`), sujet, "second parent : le sujet");
  assert.equal(shaFusionne(d, 80), nouveau, "le PUT porte le nouveau sommet, testé");
  assert.equal(d.git("rev-parse", "origin/sujet/lot^{tree}"), d.git("rev-parse", `${nouveau}^{tree}`), "arbre du squash = arbre testé");
  assert.ok(d.etat().lectures[nouveau] >= 2, "la CI du nouveau sommet a été attendue (en cours, puis verte)");
}

test("sous-PR en retard de code : mise à jour, CI attendue sur le nouveau sommet, puis squash", () => {
  const { d, ancien, sujet } = sousPrEnRetard({ "apps/a.ts": "export const a = 1;\n" });
  verifierMiseAJourPuisSquash(d, ancien, sujet, d.lancer(SUJET, "fusionner", "80"));

  // Le nouveau sommet est rouge : sortie 3, aucun squash.
  const rouge = sousPrEnRetard({ "apps/a.ts": "export const a = 1;\n" }, "FAILURE");
  const x = rouge.d.lancer(SUJET, "fusionner", "80");
  assert.equal(x.status, 3, x.stdout + x.stderr);
  assert.match(x.stdout, /checks rouges sur #80 : qualite ;/);
  assert.equal(misesAJour(rouge.d, 80).length, 0, "aucun PUT");
});

test("retard de documentation seule : mis à jour et retesté", () => {
  const { d, ancien, sujet } = sousPrEnRetard({ "docs/guide.md": "guide\n" });
  verifierMiseAJourPuisSquash(d, ancien, sujet, d.lancer(SUJET, "fusionner", "80"));
});

test("retard de documentation seule : mis à jour et retesté, vers develop (strict), develop qui reçoit un Markdown pendant la CI", () => {
  const d = depotJouet();
  const premier = d.branche("docs/guide", "origin/develop", { "docs/guide.md": "guide\n" });
  const markdown = d.branche("ailleurs", "origin/develop", { "docs/autre.md": "autre\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    strict: ["develop"],
    checks: { "*": { qualite: "SUCCESS" } },
    pendantCi: [{ lectures: 1, branche: "develop", vers: markdown }],
    pulls: [{ number: 40, title: "docs(demo): guide", head: "docs/guide", base: "develop", labels: ["à-fusionner"] }],
  });
  const r = d.lancer(scriptDe("fusionner", "passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /develop a bougé pendant la CI : nouvelle mise à jour \(1 sur 2\)/);
  assert.match(r.stdout, /FUSIONNÉE : [0-9a-f]+, arbre = arbre testé/);
  d.git("fetch", "-q", "origin");
  const second = d.git("rev-parse", "origin/docs/guide");
  assert.equal(d.git("rev-parse", `${second}^1`), premier);
  assert.equal(d.git("rev-parse", `${second}^2`), markdown, "seconde mise à jour : le Markdown de develop");
  assert.equal(shaFusionne(d, 40), second);
  assert.ok(d.etat().lectures[premier] >= 1 && d.etat().lectures[second] >= 2, "une CI par sommet");
});

// La sous-PR a reçu un push après sa lecture : ces commits n'ont été ni revus ni contrôlés. Le capitaine ne les met pas
// à jour ni ne les pousse : sortie 5, rien n'est poussé, la sous-PR est rejugée au tour suivant.
test("fusionner : une sous-PR en retard qui a bougé depuis sa lecture n'est ni mise à jour ni poussée (sortie 5)", () => {
  const { d, ancien } = sousPrEnRetard({ "apps/a.ts": "export const a = 1;\n" });
  const pousse = d.branche("feat/sous", "origin/feat/sous", { "apps/cache.ts": "export const x = 1;\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  // GitHub rend encore l'ancien sommet (lecture faite avant le push de la session).
  d.github({ pulls: d.etat().pulls.map((p) => ({ ...p, sha: ancien })) });
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(r.stdout, /la sous-PR #80 a bougé depuis sa lecture/);
  assert.equal(d.git("ls-remote", "origin", "refs/heads/feat/sous").split("\t")[0], pousse, "rien n'est poussé");
  assert.equal(misesAJour(d, 80).length, 0, "aucun PUT");
});

// GitHub illisible (ticket 9) : une lecture refusée pendant `fusionner` sort en 5 (REPRISE dans la boucle), jamais un
// état (« checks encore en cours » lus sur une panne, « aucun check exigé ») ni un renvoi.
test("sujet.sh fusionner : GitHub illisible pendant l'attente de la CI de la sous-PR : sortie 5 (REPRISE), aucun renvoi", () => {
  for (const panne of [
    { route: "/check-runs", fois: 40, sortie: "" },
    { route: "/check-runs", fois: 40, sortie: '{"message":"Server Error"}', code: 0, erreur: "" },
    { route: "^rules/branches/develop$", fois: 5 },
    { route: "^pulls/80$", fois: 1 },
  ]) {
    const { d, sommet } = sousPrEnConflit("aucun");
    d.github({ pannes: [panne] });
    const r = d.lancer(SUJET, "fusionner", "80");
    assert.equal(r.status, 5, `${panne.route} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, /GitHub illisible/, panne.route);
    assert.match(r.stderr, /GitHub illisible \(/, panne.route);
    assert.deepEqual(horsPassage(d), [], `${panne.route} : ni squash, ni label, ni commentaire`);
    d.git("fetch", "-q", "origin");
    assert.equal(d.git("rev-parse", "origin/docs/sous"), sommet);
  }
  // PR de mise à jour : sa lecture unique des checks, de même.
  const { d, sujet } = miseAJour();
  d.github({ checks: { "*": { qualite: "SUCCESS" } }, pannes: [{ route: "/check-runs", fois: 3 }] });
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(r.stdout, /GitHub illisible/);
  assert.equal(sujetDistant(d), sujet);
});

// Contre-relecture (M2, M3) : `relancer` sort en 5, explicitement, sur une PR illisible ; le refus de fusion que relaie
// `sujet.sh fusionner` est masqué.
test("sujet.sh relancer : PR illisible, sortie 5 sans rien pousser ; fusionner : refus de fusion relayé masqué", () => {
  const { d, sommet } = sousPrEnConflit("aucun");
  d.github({ pannes: [{ route: "^pulls/80$", fois: 1 }] });
  const r = d.lancer(SUJET, "relancer", "80");
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(r.stdout, /GitHub illisible/);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/docs/sous"), sommet);

  const e = sousPrEnConflit("aucun").d;
  const etat = e.etat();
  etat.pulls[0].refusFusion = "gh: refus, voir https://x:jeton-secret@exemple.test/regles (HTTP 405)";
  e.github(etat);
  const f = e.lancer(SUJET, "fusionner", "80");
  assert.equal(f.status, 3, f.stdout + f.stderr);
  assert.match(f.stderr, /https:\/\/\*\*\*@exemple\.test/);
  assert.doesNotMatch(f.stdout + f.stderr, /jeton-secret/);
});

// Ticket 16 : `sujet.sh a-juger`, que lit le check `pr-titre` du socle, écrit les fichiers que `fusionner` juge, par la
// même fonction (`fichiers_a_juger`), sans appel GitHub.
test("sujet.sh a-juger écrit les fichiers que fusionner juge : résolution et retouches d'une PR de mise à jour, diff depuis le départ du sujet sinon ; un refus de forme sort en 4", () => {
  // PR de mise à jour : la résolution (fichiers en conflit et leur écart) et la retouche, jamais le develop apporté.
  const { d, sommet } = avecRetouche({ avantPush: retouche({ "apps/s.ts": FORMATE }) });
  const avant = ecritures(d).length;
  const maj = d.lancer(SUJET, "a-juger", sommet, "sujet/lot", "81");
  assert.equal(maj.status, 0, maj.stdout + maj.stderr);
  // Deux listes, séparées par une ligne vide : la résolution (jugée avant les checks), puis l'union avec les retouches.
  const [avantChecks, apresChecks, ...reste] = maj.stdout.replace(/\n$/, "").split("\n\n");
  assert.deepEqual(reste, []);
  assert.deepEqual(avantChecks.split("\n").sort(), [`${ADR}/README.md`, "docs/f.md"]);
  assert.deepEqual(apresChecks.split("\n").sort(), ["apps/s.ts", `${ADR}/README.md`, "docs/f.md"]);
  assert.equal(ecritures(d).length, avant, "aucun appel GitHub");
  assert.doesNotMatch(d.journal().map((e) => e.route).join("\n"), /pulls/, "aucune lecture GitHub non plus");
  // Et fusionner juge bien la retouche : sans section, refus sur apps/s.ts.
  const juge = d.lancer(SUJET, "fusionner", "81");
  assert.equal(juge.status, 4, juge.stdout + juge.stderr);
  assert.match(juge.stdout, /\(apps\/s\.ts\)/);
  // Sous-PR ordinaire : le diff depuis son départ du sujet, pas ce que develop a reçu depuis.
  const o = depotJouet();
  o.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "docs: lot");
  const sous = o.branche("feat/b", "origin/sujet/lot", { "apps/b.ts": "export const b = 1;\n" }, "feat: b");
  o.branche("develop", "origin/develop", { "apps/z.ts": "export const z = 1;\n" }, "feat: z");
  const ordinaire = o.lancer(SUJET, "a-juger", sous, "sujet/lot", "82");
  assert.equal(ordinaire.status, 0, ordinaire.stdout + ordinaire.stderr);
  assert.equal(ordinaire.stdout, "apps/b.ts\n");
  // Refus de forme : deux fusions de develop. Sortie 4, le motif de verifier_mise_a_jour en dernière ligne.
  const deux = miseAJour({
    avantPush: (x) => {
      x.git("switch", "-q", "--detach", "origin/develop");
      x.ecrire("docs/d2.md", "d2\n");
      x.commit("docs: develop encore");
      x.git("push", "-q", "origin", "HEAD:develop");
      x.git("fetch", "-q", "origin");
      x.git("switch", "-q", "maj/lot");
      x.git("merge", "-q", "--no-edit", "origin/develop");
    },
  });
  const refus = deux.d.lancer(SUJET, "a-juger", deux.d.git("rev-parse", "origin/maj/lot"), "sujet/lot", "81");
  assert.equal(refus.status, 4, refus.stdout + refus.stderr);
  assert.match(refus.stdout.trim().split("\n").at(-1), /^#81, PR de mise à jour : une seule fusion de develop dans sujet\/lot/);
  // Refs absentes : 11, jamais une liste vide.
  const absent = o.lancer(SUJET, "a-juger", sous, "sujet/fantome", "82");
  assert.equal(absent.status, 11, absent.stdout + absent.stderr);
  assert.match(absent.stdout, /refs absentes/);
});

// ── Verrou du passage : plusieurs capitaines sur la même file (ticket 4 de capitaine-a-jour-et-teste) ──────────
const marqueDe = (id) => `Passage du capitaine \`${id}\` depuis 12:00 UTC.\n<!-- capitaine:passage ${id} -->`;
const brutes = (d) => d.journal().map((e) => `${e.methode} ${e.route}`);

test("fusionner et relancer : une sous-PR en passage chez un autre capitaine est sautée (sortie 7), rien n'est poussé ; la boucle ne la renvoie pas", () => {
  // fusionner : la sous-PR #80, en retard sur son sujet, serait mise à jour, poussée et squashée sans verrou.
  const { d, ancien } = sousPrEnRetard({ "apps/a.ts": "export const a = 1;\n" });
  const tenue = () => d.github({ pulls: d.etat().pulls.map((p) => ({ ...p, commentaires: [marqueDe("capitaine-jordan")] })) });
  tenue();
  let r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, /^#80 en passage chez le capitaine capitaine-jordan depuis 2026-11-17T12:00:00Z : sautée sans renvoi$/m);
  assert.deepEqual(brutes(d), ["POST issues/80/comments", "DELETE issues/comments/80002"]);
  assert.equal(d.git("ls-remote", "origin", "refs/heads/feat/sous").split("\t")[0], ancien, "rien n'est poussé");

  // relancer : la même sous-PR, en retard, serait mise à jour et poussée.
  r = d.lancer(SUJET, "relancer", "80");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, /#80 en passage chez le capitaine capitaine-jordan/);
  assert.equal(d.git("ls-remote", "origin", "refs/heads/feat/sous").split("\t")[0], ancien, "rien n'est poussé");

  // La boucle : sautée, ni renvoyée ni étiquetée.
  d.publierChaine();
  tenue();
  r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#80\] sous-PR non éligible \(fermée, en brouillon, ou en passage chez un autre capitaine\)/);
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.ok(!ecritures(d).some((e) => /issues\/80\/(labels|comments)|pulls\/80\/merge/.test(e)), ecritures(d).join());
  assert.deepEqual(d.etat().pulls[0].labels, ["à-fusionner"]);
  assert.equal(d.git("ls-remote", "origin", "refs/heads/feat/sous").split("\t")[0], ancien, "rien n'est poussé");
});

test("fusionner : le commentaire du passage est rafraîchi à chaque tour d'attente de la CI", () => {
  // La sous-PR part du sujet (à jour) ; le sujet reçoit un Markdown pendant la première attente : deux tours.
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "feat(lot): lot (#1)");
  d.branche("feat/sous", "origin/sujet/lot", { "docs/sous.md": "sous\n" });
  const markdown = d.branche("ailleurs", "origin/sujet/lot", { "docs/autre.md": "autre\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pendantCi: [{ lectures: 1, branche: "sujet/lot", vers: markdown }],
    pulls: [{ number: 80, title: "docs(lot): sous", head: "feat/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" }],
  });
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/lot a bougé pendant la CI : nouvelle mise à jour \(1 sur 2\)/);
  const j = d.journal();
  const put = j.findIndex((e) => e.route === "pulls/80/merge");
  const tours = j.slice(0, put).filter((e) => e.methode === "PATCH" && e.route === "issues/comments/80001").map((e) => /, tour (\d+) :/.exec(e.champs.body)?.[1]);
  assert.deepEqual(tours, ["1", "2"], "un rafraîchissement par tour, avant le squash");
  assert.match(j.at(-1).champs.body, /terminé à \d\d:\d\d UTC\.\n<!-- capitaine:passage capitaine-banc -->\n<!-- capitaine:fin -->/, "terminé à la sortie");
});

// ── Fusion sans effet (ticket 3 de capitaine-a-jour-et-teste, A-8) : develop dans un sujet (`rafraichir`) et un sujet
// dans une sous-PR (`mettre_a_jour_sous_pr`) portent la mention du contrat d'origin/develop, sous un `commit-msg` de
// banc qui refuse un commit touchant le schéma sans migration ni `[sans-migration:`. ─────────────────────────────────
const SCHEMA = "prisma/schema.prisma";
const MENTION = "[sans-migration: commentaire seul, apporté par une mise à jour du capitaine]";
const CONTRAT = { fusionsSansEffet: [{ fichier: SCHEMA, lignesSansEffet: "^[[:space:]]*(//.*)?$", mention: MENTION }] };
function commitMsgPrisma(d) {
  const dir = join(d.racine, "hooks-prisma");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "commit-msg"),
    `#!/bin/sh
f=$(git diff --cached --name-only)
if printf '%s\\n' "$f" | grep -qx '${SCHEMA}' && ! printf '%s\\n' "$f" | grep -q '^prisma/migrations/' && ! grep -qF '[sans-migration:' "$1"; then
  echo "commit-msg prisma jouet : migration ou [sans-migration: <raison>] exigée" >&2; exit 1
fi
`,
  );
  chmodSync(join(dir, "commit-msg"), 0o755);
  d.git("config", "core.hooksPath", dir);
}
function schemaSujetJouet() {
  const d = depotJouet();
  d.ecrire(SCHEMA, "model A {\n  id Int\n}\n");
  d.ecrire(".claude/chaine.json", JSON.stringify(CONTRAT));
  d.commit("chore: schéma et contrat");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  return d;
}

test("rafraichir et fusionner : la mention vaut aussi pour develop dans un sujet et pour un sujet dans une sous-PR", () => {
  // develop dans un sujet.
  const d = schemaSujetJouet();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  d.branche("develop", "origin/develop", { [SCHEMA]: "// note\nmodel A {\n  id Int\n}\n" }, "docs(db): note [sans-migration: commentaire]");
  d.git("switch", "-q", "--detach", "origin/develop");
  commitMsgPrisma(d);
  const r = d.lancer(SUJET, "rafraichir", "lot");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("log", "-1", "--format=%B", "origin/sujet/lot"), `Merge remote-tracking branch 'origin/develop' into sujet/lot\n\n${MENTION}`);

  // Un sujet dans une sous-PR en retard sur lui.
  const s = schemaSujetJouet();
  s.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "feat(lot): lot (#1)");
  const ancien = s.branche("feat/sous", "origin/sujet/lot", { "docs/sous.md": "sous\n" });
  s.branche("sujet/lot", "origin/sujet/lot", { [SCHEMA]: "// note\nmodel A {\n  id Int\n}\n" }, "docs(db): note [sans-migration: commentaire] (#2)");
  s.git("switch", "-q", "--detach", "origin/develop");
  s.github({
    exiges: ["qualite"],
    checks: { [ancien]: { qualite: "SUCCESS" }, "*": { qualite: "SUCCESS" } },
    pulls: [
      { number: 80, title: "docs(lot): sous", head: "feat/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" },
    ],
  });
  commitMsgPrisma(s);
  const f = s.lancer(SUJET, "fusionner", "80");
  assert.equal(f.status, 0, f.stdout + f.stderr);
  assert.match(f.stdout, /#80 en retard sur sujet\/lot : mise à jour poussée/);
  s.git("fetch", "-q", "origin");
  assert.equal(s.git("log", "-1", "--format=%B", "origin/feat/sous"), `Merge remote-tracking branch 'origin/sujet/lot' into capitaine/80\n\n${MENTION}`);
});

test("PR de mise à jour d'un sujet : la fusion de develop par une session, jouée par la recette (fusionner_avec), porte la mention et passe le commit-msg", () => {
  const d = schemaSujetJouet();
  d.publierChaine();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  d.branche("develop", "origin/develop", { [SCHEMA]: "// note\nmodel A {\n  id Int\n}\n" }, "docs(db): note [sans-migration: commentaire]");
  d.git("switch", "-q", "-c", "maj/lot", "origin/sujet/lot");
  commitMsgPrisma(d);
  // La commande de la recette (skill sujet, « Recevoir develop dans un sujet », et en-tête de sujet.sh).
  const r = spawnSync("bash", ["-c", ". scripts/chaine/github.sh && fusionner_avec origin/develop"], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(d.git("log", "-1", "--format=%B"), `Merge remote-tracking branch 'origin/develop' into maj/lot\n\n${MENTION}`);
});
