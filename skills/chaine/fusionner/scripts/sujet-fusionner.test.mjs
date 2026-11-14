// `sujet.sh fusionner` : une sous-PR en conflit avec son sujet. Sur des index générés seuls, la
// branche est mise à jour (sortie 8) au lieu d'être renvoyée ; hors index, sortie 3 et branche
// intacte ; sans conflit, squash comme avant. Dépôt jouet et faux `gh` : aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

test("fusionner : FORCE_COLOR=1 dans l'environnement ne fait refuser aucun titre", () => {
  const { d } = sousPrEnConflit("aucun");
  const r = spawnSync("bash", [SUJET, "fusionner", "80"], {
    cwd: d.travail,
    env: { ...d.env, FORCE_COLOR: "1" },
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

// PR de mise à jour #81 : le sujet et develop changent tous deux `conflit` (conflit de code) et ajoutent
// chacun une ADR (conflit sur l'index généré) ; develop touche aussi apps/a.ts, hors conflit. `base`,
// `sujetEnPlus`, `developEnPlus` et `resolution` : { chemin: contenu }, `null` retire le fichier. La
// branche maj/lot part de `depuis`, fusionne `fusion`, résout `conflit` et l'index (à la main et mal : la
// régénération le refait), committe (`message`, sinon celui de git), puis `avantPush(d)` et le push ;
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

test("fusionner : une PR de mise à jour d'une autre forme n'entre pas (sujet avancé, develop premier parent, revue, suppression cachée par un renommage, index sans commande, message forgé, chemin cité, conflit modifier/supprimer ou binaire, commit de plus)", () => {
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
    [{ avantPush: (d) => (d.ecrire("docs/g.md", "g\n"), d.commit("docs: en plus")), body: "## Revue de ticket\n\nRien.\n" }, 2, /conflit avec develop sur sujet\/lot, fusion annulée/],
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
