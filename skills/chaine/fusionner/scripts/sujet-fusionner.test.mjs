// `sujet.sh fusionner` : une sous-PR en conflit avec son sujet. Sur des index générés seuls, la
// branche est mise à jour (sortie 8) au lieu d'être renvoyée ; hors index, sortie 3 et branche
// intacte ; sans conflit, squash comme avant. Dépôt jouet et faux `gh` : aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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
const ecritures = (d) => d.journal().map((e) => `${e.methode} ${e.route}`);

// Le sujet ajoute l'ADR 3, la sous-PR #80 l'ADR 2 (ou, avec `fichier`, un fichier de code en conflit).
function sousPrEnConflit(conflit) {
  const d = depotJouet();
  d.ecrire(`${ADR}/ADR_ALL_ARC-1-a.md`, "# 1\n");
  d.ecrire(`${ADR}/README.md`, index("ADR_ALL_ARC-1-a.md"));
  d.ecrire("docs/f.md", "0\n");
  d.commit("docs: adr 1");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  const sommet = d.branche(
    "docs/sous",
    "origin/develop",
    conflit === "code"
      ? { "docs/f.md": "sous\n" }
      : { [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n", [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md") },
  );
  d.branche(
    "sujet/lot",
    "origin/develop",
    conflit === "code"
      ? { "docs/f.md": "sujet\n" }
      : conflit === "index"
        ? {
            [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
            [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-3-c.md"),
          }
        : { "docs/autre.md": "autre\n" },
  );
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
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
  assert.match(r.stdout, /#80 mise à jour avec sujet\/lot \(index régénérés\), CI relancée/);
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

test("fusionner : sans conflit, squash comme avant", () => {
  const { d, sommet } = sousPrEnConflit("aucun");
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /#80 fusionnée dans sujet\/lot/);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/docs/sous"), sommet, "branche de la sous-PR intacte");
  assert.ok(ecritures(d).includes("PUT pulls/80/merge"));
});

test("boucle.sh : la sortie 8 ne renvoie pas la PR (MISE À JOUR, aucun label ni commentaire)", () => {
  const { d } = sousPrEnConflit("index");
  d.publierChaine();
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#80\] MISE À JOUR avec sujet\/lot \(index régénérés\), CI relancée/);
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.ok(
    !ecritures(d).some((e) => /issues\/80\/(labels|comments)/.test(e)),
    ecritures(d).join(),
  );
  assert.deepEqual(d.etat().pulls[0].labels, ["à-fusionner"]);
});

// Worktree du capitaine pas propre : rien que l'auteur de la sous-PR puisse corriger. Sortie 6 (comme
// passer.sh), jamais 4, que boucle.sh traiterait en renvoi (`fusion-bloquée`).
test("fusionner : worktree du capitaine pas propre, sortie 6 sans écriture, branche intacte", () => {
  const { d, sommet } = sousPrEnConflit("aucun");
  d.ecrire("brouillon.txt", "en cours\n");
  const r = d.lancer(SUJET, "fusionner", "80");
  assert.equal(r.status, 6, r.stdout + r.stderr);
  assert.match(r.stdout, /arbre de travail pas propre/);
  assert.deepEqual(d.journal(), []);
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
  assert.deepEqual(d.journal(), []);
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
