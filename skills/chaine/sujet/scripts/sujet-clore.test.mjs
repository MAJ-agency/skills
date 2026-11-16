// `sujet.sh clore <nom>` sur le dépôt jouet : supprime la branche d'un sujet livré, sans option de force,
// et refuse tout ce qui n'est pas prouvé : sommet hors de develop, PR ouverte, carte qui ne dit pas le
// sujet livré, sommet qui bouge entre la lecture et la suppression, suppression refusée par un hook ou
// par le distant. GitHub est simulé par le faux `gh` du jouet ; aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { depotJouet, script } from "./depot-jouet.mjs";

const SCRIPT = script("sujet", "sujet.sh");
const CARTE = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
const carte = (phase) => `# SPEC_ALL_DEM-1 — Carte\n\nSujet: sujet/demo\n\n## Fiche\n\nPhase: ${phase}\n`;

// Sujet `demo` livré dans develop par un commit de merge, sa branche toujours sur origin. La carte est sur
// develop en `4-vague-1` avant le sujet ; elle passe en `phase` dans le sujet (livraison avec la carte livrée)
// ou, avec `apres`, par un commit de develop après la livraison (PR de documentation de la phase 6).
// `livre: false` laisse develop sans son commit.
function sujetLivre({ phase = "6-nettoyage", livre = true, avecCarte = true, apres = false } = {}) {
  const d = depotJouet();
  if (avecCarte) {
    d.ecrire(CARTE, carte("4-vague-1"));
    d.commit("docs: carte");
    d.git("push", "-q", "origin", "HEAD:develop");
  }
  const fichiers = { "docs/x.md": "x\n" };
  if (avecCarte && !apres) fichiers[CARTE] = carte(phase);
  d.branche("sujet/demo", "origin/develop", fichiers, "feat(demo): x (#1)");
  if (livre) {
    d.git("switch", "-q", "-C", "develop", "origin/develop");
    d.git("merge", "-q", "--no-ff", "-m", "Merge pull request #2 from org/sujet/demo\n\nSujet: sujet/demo", "origin/sujet/demo");
    if (avecCarte && apres) {
      d.ecrire(CARTE, carte(phase));
      d.commit("docs: carte livrée");
    }
    d.git("push", "-q", "origin", "develop");
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [] });
  return d;
}
const clore = (d, ...a) => d.lancer(SCRIPT, "clore", ...a);
const sommetDistant = (d) => d.git("ls-remote", "--heads", "origin", "sujet/demo").split(/\s/)[0];
const brancheLa = (d) => sommetDistant(d) !== "";
const sortie = (r) => `${r.status} ${r.stdout}${r.stderr}`;

test("clore supprime le sujet livré : sortie 0, la branche a disparu de origin, develop n'a pas bougé", () => {
  const d = sujetLivre();
  const develop = d.git("ls-remote", "origin", "refs/heads/develop");
  const r = clore(d, "demo");
  assert.equal(r.status, 0, sortie(r));
  assert.match(r.stdout, /sujet\/demo supprimée/);
  assert.equal(brancheLa(d), false, "sujet/demo supprimée");
  assert.equal(d.git("ls-remote", "origin", "refs/heads/develop"), develop, "develop intact");
  assert.equal(d.lancer(SCRIPT, "livre", "demo").status, 0, "le sujet livré se reconnaît à sa carte sur develop");
});

test("clore d'un sujet déjà absent sort en 0 sans rien écrire ; une PR fermée ne refuse pas", () => {
  const d = sujetLivre();
  d.github({ pulls: [{ number: 5, title: "x", head: "sujet/demo", base: "develop", state: "closed", labels: [] }] });
  assert.equal(clore(d, "demo").status, 0);
  const r = clore(d, "demo");
  assert.equal(r.status, 0, sortie(r));
  assert.match(r.stdout, /n'existe pas sur origin : rien à clore/);
});

test("clore refuse en 4 un nom illisible, une option et un nom vide, sans rien supprimer", () => {
  const d = sujetLivre();
  const avant = sommetDistant(d);
  for (const args of [[], ["Demo"], ["../demo"], ["demo", "--force"], ["--force", "demo"], ["demo", "--delete"], ["demo/x"]]) {
    const r = clore(d, ...args);
    assert.equal(r.status, 4, `${JSON.stringify(args)} : ${sortie(r)}`);
  }
  assert.match(clore(d, "demo", "--force").stdout, /jamais d'option, jamais de push forcé/);
  const prefixe = clore(d, "sujet/demo");
  assert.equal(prefixe.status, 4, sortie(prefixe));
  assert.match(prefixe.stdout, /sans le préfixe sujet\//);
  assert.equal(sommetDistant(d), avant, "rien supprimé");
});

test("clore refuse en 4 un sujet dont le sommet n'est pas dans develop, le nombre de commits dit", () => {
  const d = sujetLivre({ livre: false });
  const r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /porte 1 commit\(s\) absent\(s\) de develop/);
  assert.equal(brancheLa(d), true);
});

test("clore refuse en 4 une PR ouverte qui a le sujet pour base, puis une qui l'a pour tête ; une PR sans rapport ne refuse pas", () => {
  const d = sujetLivre();
  const pr = (number, head, base) => ({ number, title: "x", head, base, labels: [] });
  d.github({ pulls: [pr(7, "feat/a", "sujet/demo")] });
  let r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /#7/);
  d.github({ pulls: [pr(8, "sujet/demo", "develop")] });
  r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /#8/);
  assert.equal(brancheLa(d), true);
  d.github({ pulls: [pr(9, "feat/b", "sujet/autre"), pr(10, "sujet/autre", "develop")] });
  assert.equal(clore(d, "demo").status, 0, "des PR d'un autre sujet ne comptent pas");
});

test("clore refuse en 4 quand la carte sur develop ne dit pas le sujet livré, et quand il n'a pas de carte", () => {
  for (const [options, motif] of [
    [{ phase: "4-vague-1" }, /ne le dit pas livré/],
    [{ avecCarte: false }, /ne le dit pas livré/],
  ]) {
    const d = sujetLivre(options);
    const r = clore(d, "demo");
    assert.equal(r.status, 4, `${JSON.stringify(options)} : ${sortie(r)}`);
    assert.match(r.stdout, motif);
    assert.equal(brancheLa(d), true, "rien supprimé");
  }
  const fini = sujetLivre({ phase: "fini" });
  assert.equal(clore(fini, "demo").status, 0, "`fini` suffit comme `6-nettoyage`");
});

// Un `gh` qui, à son premier appel, avance `sujet/demo` sur origin (une autre session a poussé entre la
// lecture du sommet et la suppression), puis laisse répondre le faux `gh` du jouet.
function avancerAuPremierAppel(d) {
  d.git("switch", "-q", "-c", "autre", "origin/sujet/demo");
  d.ecrire("docs/y.md", "y\n");
  d.commit("feat(demo): y (#3)");
  d.git("push", "-q", "origin", "HEAD:refs/heads/autre");
  const nouveau = d.git("rev-parse", "HEAD");
  d.git("switch", "-q", "--detach", "origin/develop");
  const gh = join(d.racine, "bin", "gh");
  const vrai = readFileSync(gh, "utf8").split("\n").find((l) => l.startsWith("exec "));
  const marque = join(d.racine, "avance.fait");
  writeFileSync(
    gh,
    `#!/bin/sh\nif [ ! -e ${JSON.stringify(marque)} ]; then : > ${JSON.stringify(marque)}; git --git-dir=${JSON.stringify(d.origine)} update-ref refs/heads/sujet/demo ${nouveau}; fi\n${vrai}\n`,
  );
  chmodSync(gh, 0o755);
  return nouveau;
}

test("course : le sujet avance entre la lecture et la relecture du sommet, sortie 5, rien n'est supprimé", () => {
  const d = sujetLivre();
  const nouveau = avancerAuPremierAppel(d);
  const r = clore(d, "demo");
  assert.equal(r.status, 5, sortie(r));
  assert.match(r.stdout, /a bougé pendant les vérifications/);
  assert.equal(sommetDistant(d), nouveau, "le sommet poussé par l'autre session est intact");
});

// Hooks du jouet : un pre-push qui journalise ce qu'il reçoit (une ligne par ref poussée) puis agit.
function prePush(d, corps) {
  const dir = join(d.racine, "hooks-clore");
  mkdirSync(dir, { recursive: true });
  const journal = join(d.racine, "pre-push.log");
  writeFileSync(join(dir, "pre-push"), `#!/bin/sh\ncat >> ${JSON.stringify(journal)}\n${corps}\n`);
  chmodSync(join(dir, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", dir);
  return () => (existsSync(journal) ? readFileSync(journal, "utf8").trim() : "");
}

test("clore pousse une suppression pure, sans option : le pre-push reçoit « (delete) » et un sha nul pour sujet/demo", () => {
  const d = sujetLivre();
  const sommet = sommetDistant(d);
  const lu = prePush(d, "exit 0");
  assert.equal(clore(d, "demo").status, 0);
  assert.equal(lu(), `(delete) ${"0".repeat(40)} refs/heads/sujet/demo ${sommet}`);
});

test("course : le sujet avance pendant la suppression (le pre-push le fait bouger, puis refuse), sortie 5, rien n'est supprimé", () => {
  const d = sujetLivre();
  const nouveau = avancerAuPremierAppel(d);
  // Le premier appel de gh a déjà eu lieu avant la relecture : on le rejoue ici au moment du push.
  writeFileSync(join(d.racine, "avance.fait"), "");
  const marque = join(d.racine, "avance-push.fait");
  prePush(d, `if [ ! -e ${JSON.stringify(marque)} ]; then : > ${JSON.stringify(marque)}; git --git-dir=${JSON.stringify(d.origine)} update-ref refs/heads/sujet/demo ${nouveau}; fi\nexit 1`);
  const r = clore(d, "demo");
  assert.equal(r.status, 5, sortie(r));
  assert.match(r.stdout, /a bougé pendant la suppression/);
  assert.equal(sommetDistant(d), nouveau);
});

test("clore : un pre-push qui refuse donne la sortie 3, la branche reste", () => {
  const d = sujetLivre();
  const sommet = sommetDistant(d);
  prePush(d, 'echo "pre-push jouet : refus" >&2\nexit 1');
  const r = clore(d, "demo");
  assert.equal(r.status, 3, sortie(r));
  assert.match(r.stderr, /pre-push jouet : refus/);
  assert.match(r.stdout, /à jouer d'un poste local : git push origin :refs\/heads\/sujet\/demo/);
  assert.equal(sommetDistant(d), sommet);
});

test("clore : un distant qui refuse la suppression (protection de branche, proxy) donne la sortie 3 et « à jouer d'un poste local »", () => {
  const d = sujetLivre();
  const sommet = sommetDistant(d);
  const hook = join(d.origine, "hooks", "pre-receive");
  mkdirSync(join(d.origine, "hooks"), { recursive: true });
  writeFileSync(hook, `#!/bin/sh\nwhile read ancien nouveau ref; do\n  case $nouveau in 0*) echo "GH006: suppression refusée" >&2; exit 1 ;; esac\ndone\n`);
  chmodSync(hook, 0o755);
  const r = clore(d, "demo");
  assert.equal(r.status, 3, sortie(r));
  assert.match(r.stderr, /suppression refusée/);
  assert.match(r.stdout, /à jouer d'un poste local/);
  assert.equal(sommetDistant(d), sommet, "la branche reste");
});

test("clore : GitHub illisible donne la sortie 11, rien n'est supprimé", () => {
  const d = sujetLivre();
  const gh = join(d.racine, "bin", "gh");
  writeFileSync(gh, "#!/bin/sh\necho 'gh: HTTP 502' >&2\nexit 1\n");
  chmodSync(gh, 0o755);
  const r = clore(d, "demo");
  assert.equal(r.status, 11, sortie(r));
  assert.equal(brancheLa(d), true);
});

test("le corps de clore n'emploie aucune option de force, ni --delete, ni refspec « + » au push, et son seul push est la suppression par refspec", () => {
  const source = readFileSync(SCRIPT, "utf8");
  const corps = source.match(/^clore\(\) \{[\s\S]*?^\}/m)?.[0] ?? "";
  assert.ok(corps.length > 200, "le corps de clore() est introuvable");
  assert.doesNotMatch(corps, /--force|--delete|--mirror|--prune|force-with-lease|\bpush\b.* -f\b/);
  const poussees = corps.split("\n").filter((l) => /^\s*(pousser|git push|jouer_ou_dire)\b/.test(l));
  assert.equal(poussees.length, 1, `un seul push : ${poussees.join(" | ")}`);
  assert.match(poussees[0], /jouer_ou_dire "git push -q origin :refs\/heads\/\$branche"/);
  assert.doesNotMatch(corps, /git push[^\n"]*\+/, "aucun refspec « + » au push");
});

// Le pre-push du socle (skill `socle-monorepo`, posé en `.husky/pre-push`) laisse passer une suppression
// seule, sans rejouer `pnpm run check` : une session peut donc clore un sujet sans la porte de qualité.
const PRE_PUSH_SOCLE = [
  new URL("../../../monorepo/socle-monorepo/references/husky/pre-push", import.meta.url),
  new URL("../../.husky/pre-push", import.meta.url),
].find((u) => existsSync(u));

test("le pre-push du socle laisse passer une suppression de branche sans jouer `pnpm run check`", () => {
  assert.ok(PRE_PUSH_SOCLE, "pre-push du socle introuvable (monorepo/socle-monorepo/references/husky/pre-push, ou .husky/pre-push posé)");
  const d = sujetLivre();
  const dir = join(d.racine, "hooks-socle");
  mkdirSync(dir);
  copyFileSync(PRE_PUSH_SOCLE, join(dir, "pre-push"));
  chmodSync(join(dir, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", dir);
  const r = clore(d, "demo");
  assert.equal(r.status, 0, sortie(r));
  const journal = join(d.racine, "faux-gh", "pnpm.log");
  assert.equal(existsSync(journal) ? readFileSync(journal, "utf8") : "", "", "`pnpm run check` n'a pas été joué");
});

test("des références locales nommées origin/develop et origin/sujet/demo (tag, branche) ne masquent pas le distant : refus attendu", () => {
  // Sujet pas livré : un tag `origin/develop` posé sur le sommet du sujet ferait croire qu'il est contenu dans develop.
  const d = sujetLivre({ livre: false });
  const sommet = sommetDistant(d);
  d.git("tag", "origin/develop", sommet);
  d.git("branch", "origin/develop", sommet);
  d.git("tag", "origin/sujet/demo", d.git("rev-parse", "refs/remotes/origin/develop"));
  const r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /absent\(s\) de develop/);
  assert.equal(sommetDistant(d), sommet, "rien supprimé");
  // Sujet livré, carte pas livrée sur develop : un tag `origin/develop` sur un commit dont la carte est `fini` ne la fait pas lire.
  const e = sujetLivre({ phase: "4-vague-1" });
  const reel = e.git("rev-parse", "refs/remotes/origin/develop");
  e.git("switch", "-q", "--detach", reel);
  e.ecrire(CARTE, carte("fini"));
  e.commit("docs: carte fausse, jamais poussée");
  e.git("tag", "origin/develop", e.git("rev-parse", "HEAD"));
  e.git("switch", "-q", "--detach", reel);
  const s = clore(e, "demo");
  assert.equal(s.status, 4, sortie(s));
  assert.match(s.stdout, /ne le dit pas livré/);
  assert.equal(brancheLa(e), true);
});

test("GH_REPO, hérité de l'environnement, n'envoie pas la lecture des PR ouvertes vers un autre dépôt", () => {
  const d = sujetLivre();
  d.github({ pulls: [{ number: 7, title: "x", head: "feat/a", base: "sujet/demo", labels: [] }] });
  const gh = join(d.racine, "bin", "gh");
  const vrai = readFileSync(gh, "utf8").split("\n").find((l) => l.startsWith("exec "));
  // Avec GH_REPO=autre/depot, ce `gh` répond comme ce dépôt-là : aucune PR ouverte.
  writeFileSync(gh, `#!/bin/sh\nif [ "$GH_REPO" = "autre/depot" ]; then echo ""; exit 0; fi\n${vrai}\n`);
  chmodSync(gh, 0o755);
  const r = spawnSync("bash", [SCRIPT, "clore", "demo"], { cwd: d.travail, env: { ...d.env, GH_REPO: "autre/depot" }, encoding: "utf8" });
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /#7/);
  assert.equal(brancheLa(d), true);
});

test("un push en échec suivi d'une relecture de origin impossible : sortie 11 « suppression non confirmée », jamais « supprimée »", () => {
  const d = sujetLivre();
  // Le pre-push refuse et retire origin : la relecture après le push échoue.
  prePush(d, `mv ${JSON.stringify(d.origine)} ${JSON.stringify(d.origine + ".parti")}\nexit 1`);
  const r = clore(d, "demo");
  renameSync(d.origine + ".parti", d.origine);
  assert.equal(r.status, 11, sortie(r));
  assert.match(r.stdout, /suppression non confirmée/);
  assert.doesNotMatch(r.stdout, /supprimée \(/);
  assert.equal(brancheLa(d), true);
});

test("la carte passée livrée par une PR de documentation après la livraison : le sujet se clôt ; une carte livrée plus ancienne que le sommet (sujet rouvert sous le même nom) refuse", () => {
  const d = sujetLivre({ apres: true });
  const sommetLivre = sommetDistant(d);
  assert.equal(clore(d, "demo").status, 0, "livré par develop, carte livrée après : se clôt");
  assert.equal(brancheLa(d), false);
  // Develop avance, puis le même nom est rouvert depuis develop, sans commit : sa carte (livrée) est celle du chantier précédent.
  d.git("switch", "-q", "-C", "develop", "origin/develop");
  d.ecrire("docs/z.md", "z\n");
  d.commit("docs: autre chose");
  d.git("push", "-q", "origin", "develop");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.git("push", "-q", "origin", "refs/remotes/origin/develop:refs/heads/sujet/demo");
  assert.notEqual(sommetDistant(d), sommetLivre);
  const r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.match(r.stdout, /postérieur au passage de sa carte/);
  assert.match(r.stdout, /vérifier d'abord/);
  assert.doesNotMatch(r.stdout, /poste local/, "un sujet rouvert n'est pas à supprimer d'un poste local");
  assert.equal(brancheLa(d), true, "le sujet rouvert est intact");
});

// Les décisions de `clore` ne reposent jamais sur un état local : dépôt des PR (remote `upstream`, `gh-resolved`),
// objets de remplacement et greffes, URL de push divergente (A-53).
test("les PR ouvertes se lisent sur le dépôt d'origin, malgré un remote upstream et un dépôt par défaut de gh", () => {
  const d = sujetLivre();
  const autre = join(d.racine, "amont.git");
  d.git("init", "--bare", "-q", autre);
  d.git("remote", "add", "upstream", autre);
  d.git("config", "remote.origin.gh-resolved", "base");
  const gh = join(d.racine, "bin", "gh");
  const vrai = readFileSync(gh, "utf8").split("\n").find((l) => l.startsWith("exec "));
  const journal = join(d.racine, "gh-repo.log");
  writeFileSync(gh, `#!/bin/sh\necho "$GH_REPO" >> ${JSON.stringify(journal)}\n${vrai}\n`);
  chmodSync(gh, 0o755);
  d.github({ pulls: [{ number: 7, title: "x", head: "feat/a", base: "sujet/demo", labels: [] }] });
  const r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  const attendu = `${d.origine.split("/").at(-2)}/${d.origine.split("/").at(-1).replace(/\.git$/, "")}`;
  const lus = readFileSync(journal, "utf8").trim().split("\n");
  assert.ok(lus.length >= 1);
  assert.deepEqual([...new Set(lus)], [attendu], "chaque appel gh vise le dépôt d'origin, posé explicitement");
  assert.equal(brancheLa(d), true);
});

// Un sujet livré, puis un commit X poussé sur sa branche, que develop ne contient pas. Une greffe ou un objet
// de remplacement local fait de X un parent du commit de la carte livrée : sans protection, `clore` supprime.
function sujetAvanceAvecLocal() {
  const d = sujetLivre({ apres: true });
  d.git("switch", "-q", "-c", "x", "origin/sujet/demo");
  d.ecrire("docs/y.md", "y\n");
  d.commit("feat(demo): y (#3)");
  const x = d.git("rev-parse", "HEAD");
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/demo");
  d.git("switch", "-q", "--detach", "origin/develop");
  const sommet = d.git("rev-parse", "refs/remotes/origin/develop");
  const parent = d.git("rev-parse", `${sommet}^`);
  return { d, x, sommet, parent };
}

test("un objet de remplacement local (git replace) ne fait pas supprimer un sujet non livré : refus en 4", () => {
  const { d, x, sommet, parent } = sujetAvanceAvecLocal();
  const faux = d.git("commit-tree", `${sommet}^{tree}`, "-p", parent, "-p", x, "-m", "remplacement");
  d.git("replace", sommet, faux);
  const r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.equal(sommetDistant(d), x, "le sujet avancé est intact");
});

test("une greffe locale (.git/info/grafts) ne fait pas supprimer un sujet non livré : refus en 4", () => {
  const { d, x, sommet, parent } = sujetAvanceAvecLocal();
  mkdirSync(join(d.travail, ".git", "info"), { recursive: true });
  writeFileSync(join(d.travail, ".git", "info", "grafts"), `${sommet} ${parent} ${x}\n`);
  const r = clore(d, "demo");
  assert.equal(r.status, 4, sortie(r));
  assert.equal(sommetDistant(d), x, "le sujet avancé est intact");
});

test("une URL de push qui diverge de l'URL de lecture (pushurl, pushInsteadOf) refuse en 4 : on ne supprime pas ailleurs que là où l'on a vérifié", () => {
  for (const reglage of ["pushurl", "pushInsteadOf"]) {
    const d = sujetLivre();
    const autre = join(d.racine, "autre.git");
    d.git("init", "--bare", "-q", autre);
    if (reglage === "pushurl") d.git("config", "remote.origin.pushurl", autre);
    else d.git("config", `url.${autre}.pushInsteadOf`, d.origine);
    const avant = sommetDistant(d);
    const r = clore(d, "demo");
    assert.equal(r.status, 4, `${reglage} : ${sortie(r)}`);
    assert.match(r.stdout, /URL de push/);
    assert.equal(sommetDistant(d), avant, `${reglage} : rien supprimé`);
  }
});

test("les PR ouvertes se lisent juste avant la relecture finale du sommet, après la carte", () => {
  const corps = readFileSync(SCRIPT, "utf8").match(/^clore\(\) \{[\s\S]*?^\}/m)?.[0] ?? "";
  const place = (motif) => corps.search(motif);
  assert.ok(place(/sujet_livre "\$nom"/) >= 0 && place(/gh api/) >= 0);
  assert.ok(place(/sujet_livre "\$nom"/) < place(/gh api/), "sujet_livre avant la lecture des PR");
  assert.ok(place(/commit_carte_livree/) < place(/gh api/), "la carte avant la lecture des PR");
  assert.ok(place(/gh api/) < place(/a bougé pendant les vérifications/), "les PR avant la relecture du sommet");
});
