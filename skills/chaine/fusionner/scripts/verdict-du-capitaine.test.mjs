// Banc du lot 5a (relecture indépendante) : le capitaine juge l'éligibilité par les verdicts, deux fois (A-91, A-105).
// `passer.sh` (une PR vers develop) et `sujet.sh fusionner` (une sous-PR) sur le dépôt jouet, la clé `relecture` dans le
// contrat de develop : en régime 8, la section de revue n'est plus lue, un tour validé pour le contenu du sommet est
// exigé avant toute mise à jour et toute CI, puis relu juste avant l'appel de fusion ; une mise à jour du capitaine garde
// le verdict (« même contenu propre ») ; une lecture illisible fait sauter la PR sans renvoi. Le faux GitHub fait tomber
// un verdict ou une étiquette pendant la CI (`pendantCi`). Aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe, GRAMMAIRE } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);
const { ecrireDistribution } = await import(pathToFileURL(scriptDe("fusionner", "decision-relecteur.mjs")).href);
const { ecrireVerdict } = await import(pathToFileURL(scriptDe("fusionner", "verdict.mjs")).href);

const PASSER = scriptDe("fusionner", "passer.sh");
const SUJET = scriptDe("sujet", "sujet.sh");
// La repose a posé la clé à 09 h ; le faux ouvre une PR à 11 h par défaut (`created_at`) : régime 8.
const CONTRAT = { cheminsSensibles: ["scripts/agent/**"], relecture: { depuis: "2026-11-17T09:00:00Z" } };
const D = (tour, sommet, sessions) => ecrireDistribution({ tour, sommet, sessions });
const V = (sommet, tour, session, verdict, securite = null) =>
  `${ecrireVerdict({ sommet, tour, verdict, bloquants: verdict === "refusé" ? 1 : 0, session, securite })}\n\n- constats`;
const valide = (sha, securite = null) => [D(1, sha, ["session_rel1"]), V(sha, 1, "session_rel1", "validé", securite)];
const dernier = (r) => r.stdout.trim().split("\n").at(-1);
const fusions = (d) => d.journal().filter((e) => e.methode === "PUT" && /\/merge$/.test(e.route));

// Le jouet, le contrat de develop posé (`contrat` : null pour aucun).
function monter(contrat = CONTRAT) {
  const d = depotJouet();
  if (contrat !== null) {
    d.ecrire(".claude/chaine.json", `${JSON.stringify(contrat, null, 2)}\n`);
    d.commit("chore: contrat");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
  }
  return d;
}
// La PR 30 vers develop, sa branche `feat/a` partie de develop ; ses commentaires (`fil(sha)`) écrits sur son sommet.
function versDevelop(d, { fichiers = { "docs/a.md": "a\n" }, fil = valide, titre = "docs(a): a", labels = ["à-fusionner"], plus = {}, autres = {}, tete = "feat/a" } = {}) {
  const sha = d.branche(tete, "origin/develop", fichiers);
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 30, title: titre, head: tete, base: "develop", labels, commentaires: fil(sha), ...plus }],
    ...autres,
  });
  return sha;
}
const passer = (d) => d.lancer(PASSER, "30");

test("régime 8, passer.sh : sans verdict, renvoyée en sortie 4 avant toute mise à jour et toute CI", () => {
  const d = monter();
  const sha = versDevelop(d, { fil: () => [] });
  d.branche("develop", "origin/develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /aucun tour de relecture validé pour le contenu de ce sommet \(/);
  assert.doesNotMatch(r.stdout, /mise à jour poussée/, "aucune mise à jour");
  assert.equal(d.git("rev-parse", "origin/feat/a"), sha, "la branche n'a pas bougé");
  assert.deepEqual(fusions(d), []);
});

test("régime 8, passer.sh : la section de revue n'est plus lue ; un tour validé sur la tête fait entrer la PR, verdict relu juste avant la fusion", () => {
  const d = monter();
  versDevelop(d, { fichiers: { "scripts/x.sh": "echo x\n" }, titre: "feat(x): x" });
  const r = passer(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /verdict relu juste avant la fusion : régime 8 : tour 1 validé au sommet [0-9a-f]{40}/);
  assert.match(r.stdout, /FUSIONNÉE/);
});

test("régime 7, passer.sh : sans la clé, ou ouverte avant `depuis`, la section de revue est exigée et aucun verdict ne suffit", () => {
  for (const [contrat, plus] of [[{ cheminsSensibles: [] }, {}], [CONTRAT, { created_at: "2026-11-17T08:59:00Z" }], [CONTRAT, { created_at: "2026-11-17T09:00:00Z" }]]) {
    const d = monter(contrat);
    versDevelop(d, { fichiers: { "scripts/x.sh": "echo x\n" }, titre: "feat(x): x", plus });
    const r = passer(d);
    assert.equal(r.status, 4, `${JSON.stringify(plus)} : ${r.stdout}${r.stderr}`);
    assert.match(dernier(r), /sans section « Revue de ticket » ni « Revue adversariale »/, JSON.stringify(plus));
  }
  // Un contrat qui ne se lit pas et ne nomme pas la clé : régime 7, jugé comme sur main (A-186) : renvoi, la cause dite.
  const casse = depotJouet();
  casse.ecrire(".claude/chaine.json", '{ "cheminsSensibles": [\n');
  casse.commit("chore: contrat cassé");
  casse.git("push", "-q", "origin", "HEAD:develop");
  casse.git("fetch", "-q", "origin");
  versDevelop(casse, { fichiers: { "scripts/x.sh": "echo x\n" }, titre: "feat(x): x", plus: { body: "## Revue adversariale\n\nRien.\n" } });
  const r = passer(casse);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /le contrat de origin\/develop illisible/);
});

test("régime 8, passer.sh : develop a bougé, le capitaine met la PR à jour, le verdict tient (même contenu propre) et elle entre", () => {
  const d = monter();
  const sha = versDevelop(d);
  d.branche("develop", "origin/develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  const r = passer(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /mise à jour poussée/);
  assert.notEqual(d.git("rev-parse", "origin/feat/a"), sha, "le sommet fusionné est celui du capitaine");
  assert.match(r.stdout, /verdict relu juste avant la fusion : régime 8 : tour 1 validé au sommet /);
  assert.equal(fusions(d).length, 1);
});

test("régime 8, passer.sh : un `refusé` tombé pendant la CI est vu au second contrôle : renvoyée, jamais fusionnée", () => {
  const d = monter();
  const sha = versDevelop(d, { autres: {} });
  d.github({ pendantCi: [{ lectures: 1, pr: 30, commentaire: V(sha, 1, "session_rel1", "refusé") }] });
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /aucun tour de relecture validé .*\(contrôle juste avant la fusion\)$/);
  assert.deepEqual(fusions(d), []);
});

test("régime 8, passer.sh : `à-fusionner` retirée pendant la CI (le Relecteur a posé `à-reprendre`) : sautée en 7, sans renvoi", () => {
  const d = monter();
  versDevelop(d);
  d.github({ pendantCi: [{ lectures: 1, pr: 30, labels: ["à-reprendre"] }] });
  const r = passer(d);
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(dernier(r), /PR plus éligible juste avant la fusion \(sans le label à-fusionner\) : sautée/);
  assert.deepEqual(fusions(d), []);
  assert.ok(!d.journal().some((e) => e.champs?.["labels[]"] === "fusion-bloquée"), "aucun renvoi");
});

test("régime 8, passer.sh : une lecture illisible (marque presque à la forme, clé mal formée) fait sauter la PR en 7, sans renvoi", () => {
  const d = monter();
  versDevelop(d, { fil: (sha) => [...valide(sha), `${D(2, sha, ["session_rel2"])}.`] });
  const r = passer(d);
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(dernier(r), /^\[#30\] lecture illisible : .*préfixe « Relecture — » sans la forme de sa marque.* : sautée sans renvoi/);
  const m = monter({ relecture: { depuis: "2026-11-17T09:00:00+00:00" } });
  versDevelop(m);
  const r2 = passer(m);
  assert.equal(r2.status, 7, r2.stdout + r2.stderr);
  assert.match(dernier(r2), /lecture illisible : clé relecture de origin\/develop:\.claude\/chaine\.json mal formée/);
  assert.deepEqual([...fusions(d), ...fusions(m)], []);
});

// Le ticket de la PR, sur develop, qui accorde `scripts/agent/**` (la garde des fichiers sensibles, lot 5b).
const TICKET = "docs/features/demo/all/issues/SPEC_ALL_DEMO-1-demo.01.issue.md";
const avecTicket = (d) => {
  d.git("switch", "-q", "develop");
  d.ecrire(TICKET, "# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\nSensibles: `scripts/agent/**` — accord de la MOA, 2026-11-17\n\n## Le besoin\n\nx\n");
  d.commit("docs: ticket");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  return d;
};
const SENSIBLE = { fichiers: { "scripts/agent/x.mjs": "export {};\n" }, titre: "feat(agent): x", tete: "feat/spec-all-demo-1-01-x" };

test("régime 8, passer.sh : sur un chemin sensible, un `validé` sans `/security-review: lancée` ne suffit pas ; avec elle, la PR entre", () => {
  const d = avecTicket(monter());
  versDevelop(d, SENSIBLE);
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /chemin sensible : `\/security-review: lancée` exigée dans le verdict/);
  const ok = avecTicket(monter());
  versDevelop(ok, { ...SENSIBLE, fil: (sha) => valide(sha, "lancée") });
  const r2 = passer(ok);
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
});

test("régime 8, passer.sh : une PR empilée sur une parente fusionnée est renvoyée : le Relecteur ne la relirait pas", () => {
  const d = monter();
  const parente = d.branche("feat/parente", "origin/develop", { "docs/p.md": "p\n" });
  d.branche("feat/fille", "origin/feat/parente", { "docs/f.md": "f\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [
      { number: 29, title: "docs(p): p", head: "feat/parente", base: "develop", labels: [], state: "closed", merged_at: "2026-11-17T10:00:00Z" },
      { number: 30, title: "docs(f): f", head: "feat/fille", base: "feat/parente", labels: ["à-fusionner"], commentaires: [] },
    ],
  });
  assert.ok(parente);
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /PR empilée sur feat\/parente en régime 8/);
});

// La sous-PR 80 vers `sujet/lot`, partie du sujet ; ses commentaires écrits sur son sommet.
function versSujet(d, { fil = valide, retard = false } = {}) {
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  const sha = d.branche("docs/sous", "origin/sujet/lot", { "docs/sous.md": "sous\n" });
  if (retard) d.branche("sujet/lot", "origin/sujet/lot", { "docs/lot2.md": "lot 2\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 80, title: "docs(sous): sous", head: "docs/sous", base: "sujet/lot", labels: ["à-fusionner"], commentaires: fil(sha) }],
  });
  return sha;
}
const fusionner = (d) => d.lancer(SUJET, "fusionner", "80");

test("régime 8, sujet.sh fusionner : une sous-PR sans verdict est renvoyée en 4, sans mise à jour ni CI ; validée, en retard, elle est mise à jour et entre", () => {
  const d = monter();
  const sha = versSujet(d, { fil: () => [], retard: true });
  const r = fusionner(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /^#80 aucun tour de relecture validé pour le contenu de ce sommet/);
  assert.equal(d.git("rev-parse", "origin/docs/sous"), sha, "aucune mise à jour");
  const ok = monter();
  const avant = versSujet(ok, { retard: true });
  const r2 = fusionner(ok);
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.notEqual(ok.git("rev-parse", "origin/docs/sous"), avant, "mise à jour par le capitaine");
  assert.match(r2.stdout, /#80 : verdict relu juste avant la fusion \(régime 8 : tour 1 validé au sommet /);
  assert.match(r2.stdout, /#80 fusionnée dans sujet\/lot/);
});

test("régime 8, sujet.sh fusionner : un `refusé` tombé pendant la CI est vu juste avant la fusion : renvoyée en 4", () => {
  const d = monter();
  const sha = versSujet(d);
  d.github({ pendantCi: [{ lectures: 1, pr: 80, commentaire: V(sha, 1, "session_rel1", "refusé") }] });
  const r = fusionner(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /\(contrôle juste avant la fusion\)$/);
  assert.deepEqual(fusions(d), []);
});

test("régime 8, sujet.sh fusionner : `à-fusionner` retirée pendant la CI (le Relecteur a posé `à-reprendre`) : sautée en 7, sans renvoi ni fusion", () => {
  const d = monter();
  versSujet(d);
  d.github({ pendantCi: [{ lectures: 1, pr: 80, labels: ["à-reprendre"] }] });
  const r = fusionner(d);
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(dernier(r), /^#80 : PR plus éligible juste avant la fusion \(sans le label à-fusionner\) : sautée$/);
  assert.deepEqual(fusions(d), []);
});

// La PR 81 de mise à jour de `sujet/lot` : la fusion de develop dans le sujet, sans conflit, sans retouche.
function miseAJour(d, fil) {
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  d.branche("develop", "origin/develop", { "docs/dev.md": "dev\n" });
  d.git("switch", "-q", "-C", "maj/lot", "origin/sujet/lot");
  d.git("merge", "-q", "--no-edit", "origin/develop");
  d.git("push", "-q", "origin", "HEAD:refs/heads/maj/lot");
  d.git("fetch", "-q", "origin");
  const sha = d.git("rev-parse", "HEAD");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [{ number: 81, title: "chore(sujet): met lot à jour avec develop", head: "maj/lot", base: "sujet/lot", labels: ["à-fusionner"], commentaires: fil(sha) }],
  });
  return sha;
}

test("régime 8, sujet.sh fusionner : une PR de mise à jour n'est pas exemptée — sans verdict renvoyée, validée elle entre par avance rapide", () => {
  const d = monter();
  miseAJour(d, () => []);
  const r = d.lancer(SUJET, "fusionner", "81");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /^#81 aucun tour de relecture validé/);
  const ok = monter();
  const sha = miseAJour(ok, valide);
  const r2 = ok.lancer(SUJET, "fusionner", "81");
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.match(r2.stdout, /#81 : verdict relu juste avant la fusion/);
  assert.match(r2.stdout, /#81 fusionnée dans sujet\/lot par avance rapide/);
  assert.equal(ok.git("rev-parse", "origin/sujet/lot"), sha);
});

test("régime 8, boucle.sh : la boucle joue les calculs de develop ; une PR sans verdict est renvoyée (fusion-bloquée, à-fusionner retirée), une PR validée entre", () => {
  const d = monter();
  d.publierChaine();
  // Les calculs que le capitaine joue, posés sur develop à côté de ceux que `publierChaine` pose : la boucle joue la copie
  // de develop (`scripts/chaine`), comme dans un projet qui a reposé `fusionner`.
  for (const nom of ["decision-relecteur.mjs", "verdict.mjs", "double-relecture.mjs", "meme-contenu.sh"]) d.ecrire(`scripts/chaine/${nom}`, readFileSync(scriptDe("fusionner", nom), "utf8"));
  d.ecrire("scripts/chaine/chemins-sensibles.mjs", readFileSync(scriptDe("revue-adversariale", "chemins-sensibles.mjs"), "utf8"));
  d.commit("chore(chaine): calculs");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  const sha = d.branche("feat/a", "origin/develop", { "docs/a.md": "a\n" });
  d.branche("feat/b", "origin/develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "SUCCESS" } },
    pulls: [
      { number: 30, title: "docs(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], commentaires: valide(sha) },
      { number: 31, title: "docs(b): b", head: "feat/b", base: "develop", labels: ["à-fusionner"], commentaires: [] },
    ],
  });
  const r = d.lancer(scriptDe("fusionner", "boucle.sh"));
  assert.match(r.stdout, /FILE VIDE/, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#31\] RENVOI : aucun tour de relecture validé pour le contenu de ce sommet/);
  const [a, b] = d.etat().pulls;
  assert.ok(a.merged_at, "la PR validée est entrée");
  assert.deepEqual(b.labels, ["fusion-bloquée"]);
});

test("régime 8, passer.sh : deux verdicts exigés (le ticket porte `Relecture: double`) : un seul validé ne suffit pas, deux de deux sessions, si", () => {
  const monterDouble = () => {
    const d = monter();
    d.git("switch", "-q", "develop");
    d.ecrire(TICKET, "# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\nRelecture: double\n\n## Le besoin\n\nx\n");
    d.commit("docs: ticket double");
    d.git("push", "-q", "origin", "HEAD:develop");
    d.git("fetch", "-q", "origin");
    return d;
  };
  const un = monterDouble();
  versDevelop(un, { tete: "feat/spec-all-demo-1-01-x" });
  const r = passer(un);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /\(deux verdicts validés de deux sessions exigés\)/);
  const deux = monterDouble();
  versDevelop(deux, { tete: "feat/spec-all-demo-1-01-x", fil: (sha) => [D(1, sha, ["session_rel1", "session_rel2"]), V(sha, 1, "session_rel1", "validé"), V(sha, 1, "session_rel2", "validé")] });
  const r2 = passer(deux);
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
});

test("régime 8, passer.sh : GitHub illisible sur les commentaires de la PR : pause (5), jamais un verdict lu vide", () => {
  const d = monter();
  versDevelop(d, { autres: { pannes: [{ route: "^issues/30/comments", fois: 1 }] } });
  const r = passer(d);
  assert.equal(r.status, 5, r.stdout + r.stderr);
  assert.match(dernier(r), /origin ou GitHub illisible à la lecture des commentaires de la PR/);
  assert.deepEqual(fusions(d), []);
});

test("régime 8, sujet.sh fusionner : `fusion-bloquée` posée pendant la CI est vue juste avant la fusion : sautée en 7, sans fusion", () => {
  const d = monter();
  versSujet(d);
  d.github({ pendantCi: [{ lectures: 1, pr: 80, labels: ["à-fusionner", "fusion-bloquée"] }] });
  const r = fusionner(d);
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(dernier(r), /^#80 : PR plus éligible juste avant la fusion \(label fusion-bloquée\) : sautée$/);
  assert.deepEqual(fusions(d), []);
});

test("régime 8, passer.sh : develop et les sujets sont relus avant les calculs (A-126) : un clone à une branche voit le ticket `Relecture: double` d'un sujet", () => {
  // Le ticket sur develop, sans `Relecture: double` ; sa copie du sujet la porte (un ticket introuvable exigerait deux verdicts).
  const d = monter();
  d.git("switch", "-q", "develop");
  d.ecrire(TICKET, "# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\n\n## Le besoin\n\nx\n");
  d.commit("docs: ticket");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/x", "origin/develop", { [TICKET]: "# SPEC_ALL_DEMO-1.01 — x\n\nStatus: ready-for-agent\nRelecture: double\n\n## Le besoin\n\nx\n" });
  versDevelop(d, { tete: "feat/spec-all-demo-1-01-x" });
  // Un clone `--single-branch` : un fetch nu ne relit que develop ; le sujet n'est plus connu ici.
  d.git("config", "remote.origin.fetch", "+refs/heads/develop:refs/remotes/origin/develop");
  d.git("update-ref", "-d", "refs/remotes/origin/sujet/x");
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /\(deux verdicts validés de deux sessions exigés\)/);
  assert.deepEqual(fusions(d), []);
});

test("régime 8 : un calcul absent à côté de revue-exigee.mjs est une panne (3), jamais un refus (1) que le capitaine renverrait", () => {
  const d = monter();
  const plat = join(d.racine, "plat");
  mkdirSync(plat);
  writeFileSync(join(plat, "revue-exigee.mjs"), readFileSync(scriptDe("fusionner", "revue-exigee.mjs"), "utf8"));
  const fil = join(d.racine, "fil.json");
  writeFileSync(fil, "[]\n");
  const r = spawnSync(process.execPath, [join(plat, "revue-exigee.mjs"), "", "docs(a): a", "origin/develop", "--ouverte", "2026-11-17T11:00:00Z", "--tete", "a".repeat(40), "--branche", "feat/a", "--commentaires", fil], { cwd: d.travail, env: d.env, input: "docs/a.md\n", encoding: "utf8" });
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /^revue du capitaine en échec : /m);
});

// Contre-relecture de la PR 149 (tour 1) : le verdict porte sur le contenu du sommet ; un calcul absent est une panne ;
// un contrat de base illisible rend le chemin sensible, comme chez le Relecteur (les mêmes faits).
test("régime 8, passer.sh : un tour validé sur un sommet plus ancien, puis un vrai commit de l'auteur : renvoyée en 4, jamais fusionnée", () => {
  const d = monter();
  versDevelop(d);
  d.branche("feat/a", "feat/a", { "docs/a2.md": "a2\n" }, "docs(a): suite");
  d.git("switch", "-q", "--detach", "origin/develop");
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /aucun tour de relecture validé pour le contenu de ce sommet \(.*porte sur un autre contenu$/);
  assert.deepEqual(fusions(d), []);
});

test("régime 8 : double-relecture.mjs ou meme-contenu.sh absent à côté de revue-exigee.mjs, la grammaire posée : panne (3), jamais une lecture illisible (21)", () => {
  for (const absent of ["double-relecture.mjs", "meme-contenu.sh"]) {
    const d = monter();
    const chaine = join(d.racine, "projet", "scripts", "chaine");
    mkdirSync(chaine, { recursive: true });
    mkdirSync(join(d.racine, "projet", "scripts", "docs"));
    writeFileSync(join(d.racine, "projet", "scripts", "docs", "identifiants.mjs"), readFileSync(GRAMMAIRE, "utf8"));
    for (const c of ["revue-exigee.mjs", "decision-relecteur.mjs", "verdict.mjs", "double-relecture.mjs", "meme-contenu.sh"])
      if (c !== absent) writeFileSync(join(chaine, c), readFileSync(scriptDe("fusionner", c), "utf8"));
    const fil = join(d.racine, "fil.json");
    writeFileSync(fil, "[]\n");
    const r = spawnSync(process.execPath, [join(chaine, "revue-exigee.mjs"), "", "docs(a): a", "origin/develop", "--ouverte", "2026-11-17T11:00:00Z", "--tete", "a".repeat(40), "--branche", "feat/a", "--commentaires", fil], { cwd: d.travail, env: d.env, input: "docs/a.md\n", encoding: "utf8" });
    assert.equal(r.status, 3, `${absent} : ${r.stdout}${r.stderr}`);
    assert.match(r.stdout, new RegExp(`^revue du capitaine en échec : ${absent.replace(".", "\\.")} absent à côté de revue-exigee\\.mjs$`, "m"));
  }
});

// Suite du lot 5 (A-192, point 1 ; ticket 75) : un calcul sorti en 69 (git plus ancien que 2.41, `jq` absent, la grammaire
// introuvable) le dirait de chaque PR : une panne du capitaine (3), jamais une lecture illisible (21) qui ferait sauter
// chaque PR en silence.
test("régime 8 : un calcul sorti en 69 (un outil de la chaîne manque au poste) est une panne (3), la cause dite, jamais une lecture illisible (21)", () => {
  const lancer = (d, chaine, fil) =>
    spawnSync(process.execPath, [join(chaine, "revue-exigee.mjs"), "", "docs(a): a", "origin/develop", "--ouverte", "2026-11-17T11:00:00Z", "--tete", "a".repeat(40), "--branche", "feat/a", "--commentaires", fil], { cwd: d.travail, env: d.env, input: "docs/a.md\n", encoding: "utf8" });
  const poser = (d, { grammaire = true, talon = null } = {}) => {
    const chaine = join(d.racine, "projet", "scripts", "chaine");
    mkdirSync(chaine, { recursive: true });
    if (grammaire) {
      mkdirSync(join(d.racine, "projet", "scripts", "docs"));
      writeFileSync(join(d.racine, "projet", "scripts", "docs", "identifiants.mjs"), readFileSync(GRAMMAIRE, "utf8"));
    }
    for (const c of ["revue-exigee.mjs", "decision-relecteur.mjs", "verdict.mjs", "double-relecture.mjs", "meme-contenu.sh"]) writeFileSync(join(chaine, c), readFileSync(scriptDe("fusionner", c), "utf8"));
    if (talon) writeFileSync(join(chaine, talon[0]), talon[1]);
    return chaine;
  };
  // La grammaire des identifiants introuvable : le vrai `double-relecture.mjs` sort en 69.
  const d = monter();
  const fil = join(d.racine, "fil.json");
  writeFileSync(fil, "[]\n");
  const r = lancer(d, poser(d, { grammaire: false }), fil);
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stdout, /^revue du capitaine en échec : double-relecture\.mjs : un outil de la chaîne manque au poste \(sortie 69\) : scripts\/docs\/identifiants\.mjs introuvable depuis /m);
  // `meme-contenu.sh` sorti en 69 (git plus ancien que 2.41) pour le sommet d'un tour plus ancien.
  const m = monter();
  const tours = join(m.racine, "fil.json");
  writeFileSync(tours, `${JSON.stringify(valide("b".repeat(40)).map((body, i) => ({ id: i + 1, body, created_at: `2026-11-17T12:0${i}:00Z`, updated_at: `2026-11-17T12:0${i}:00Z`, author_association: "OWNER" })))}\n`);
  const h = lancer(m, poser(m, { talon: ["meme-contenu.sh", 'echo illisible\necho "git ≥ 2.41 requis, ici 2.40" >&2\nexit 69\n'] }), tours);
  assert.equal(h.status, 3, h.stdout + h.stderr);
  assert.match(h.stdout, /^revue du capitaine en échec : meme-contenu\.sh : un outil de la chaîne manque au poste \(sortie 69\) : git ≥ 2\.41 requis, ici 2\.40$/m);
  // Une sortie 21 du même calcul reste une lecture illisible : seule la sortie 69 est une panne.
  const i = monter();
  writeFileSync(join(i.racine, "fil.json"), "[]\n");
  const r21 = lancer(i, poser(i, { talon: ["double-relecture.mjs", 'console.log("illisible"); process.exit(21);\n'] }), join(i.racine, "fil.json"));
  assert.equal(r21.status, 21, r21.stdout + r21.stderr);
  assert.match(r21.stdout, /^lecture illisible : « double relecture exigée » illisible/m);
});

test("régime 8, passer.sh : `cheminsSensibles` illisible sur la base rend tout chemin sensible, comme chez le Relecteur : un `validé` sans `/security-review: lancée` ne suffit pas", () => {
  const d = monter({ cheminsSensibles: "scripts/agent/**", relecture: CONTRAT.relecture });
  versDevelop(d);
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /chemin sensible : `\/security-review: lancée` exigée dans le verdict/);
  assert.deepEqual(fusions(d), []);
});

test("régime 8, passer.sh : les commentaires se lisent sur toutes leurs pages (A-108) : un second tour `refusé`, en page 2, est vu ; renvoyée, jamais fusionnée", () => {
  const d = monter();
  versDevelop(d, { fil: (sha) => [...valide(sha), D(2, sha, ["session_rel2"]), V(sha, 2, "session_rel2", "refusé")], autres: { pageCommentaires: 2 } });
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /aucun tour de relecture validé pour le contenu de ce sommet/);
  assert.deepEqual(fusions(d), []);
});

test("régime 8, passer.sh : un push reçu entre la lecture de la PR et le fetch n'est pas renvoyé faute de verdict : sautée en 7, reprise au passage suivant", () => {
  const d = monter();
  // Le faux rend le sommet lu (X, validé) quand origin porte déjà le push suivant (O) : la fenêtre, figée.
  const x = versDevelop(d);
  d.branche("feat/a", "feat/a", { "docs/a2.md": "a2\n" }, "docs(a): suite");
  d.git("switch", "-q", "--detach", "origin/develop");
  const etat = d.etat();
  d.github({ pulls: [{ ...etat.pulls[0], sha: x }] });
  const r = passer(d);
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(dernier(r), /la PR a reçu un push pendant sa lecture \(origin\/feat\/a n'est plus le sommet lu\) : sautée sans renvoi/);
  assert.ok(!d.journal().some((e) => e.champs?.["labels[]"] === "fusion-bloquée"), "aucun renvoi");
});

test("régime 7, passer.sh : un push reçu entre la lecture de la PR et le fetch se juge comme sur main (le saut du régime 8 n'y joue pas)", () => {
  const d = monter({ cheminsSensibles: [] });
  const x = versDevelop(d, { fichiers: { "scripts/x.sh": "echo x\n" }, titre: "feat(x): x" });
  d.branche("feat/a", "feat/a", { "scripts/y.sh": "echo y\n" }, "feat(x): suite");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ pulls: [{ ...d.etat().pulls[0], sha: x }] });
  const r = passer(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /sans section « Revue de ticket » ni « Revue adversariale »/);
});
