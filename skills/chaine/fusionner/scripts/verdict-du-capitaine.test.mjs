// Banc du lot 5a (relecture indépendante) : le capitaine juge l'éligibilité par les verdicts, deux fois (A-91, A-105).
// `passer.sh` (une PR vers develop) et `sujet.sh fusionner` (une sous-PR) sur le dépôt jouet, la clé `relecture` dans le
// contrat de develop : en régime 8, la section de revue n'est plus lue, un tour validé pour le contenu du sommet est
// exigé avant toute mise à jour et toute CI, puis relu juste avant l'appel de fusion ; une mise à jour du capitaine garde
// le verdict (« même contenu propre ») ; une lecture illisible fait sauter la PR sans renvoi. Le faux GitHub fait tomber
// un verdict ou une étiquette pendant la CI (`pendantCi`). Aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe, GRAMMAIRE } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);
const { ecrireDistribution, ecrireNote } = await import(pathToFileURL(scriptDe("fusionner", "decision-relecteur.mjs")).href);
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

test("régime 8, passer.sh : une note de même contenu à la forme (ticket 94) ne change pas le verdict du capitaine ; presque à la forme, la PR saute en 7, sans renvoi", () => {
  const autre = "f".repeat(40);
  const note = (sha) => ecrireNote({ tete: autre, tour: 1, verdict: "validé", sommet: sha, raison: "de V à T : 1 fusion(s) de origin/develop" });
  const d = monter();
  versDevelop(d, { fil: (sha) => [...valide(sha), note(sha)] });
  const r = passer(d);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /verdict relu juste avant la fusion : régime 8 : tour 1 validé au sommet /);
  const m = monter();
  versDevelop(m, { fil: (sha) => [...valide(sha), note(sha).replace(/ — de V à T.*$/, "")] });
  const r2 = passer(m);
  assert.equal(r2.status, 7, r2.stdout + r2.stderr);
  assert.match(dernier(r2), /^\[#30\] lecture illisible : .*préfixe « Même contenu — » sans la forme de sa marque.* : sautée sans renvoi/);
  assert.deepEqual(fusions(m), []);
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

// Contre-relecture de la PR 153 : la sortie 69 suivie de bout en bout, sans talon. Le vrai `meme-contenu.sh` sous un git
// qui se dit 2.40 (un `git` en tête du PATH du jouet, qui ne répond autrement qu'à `git version`) : `passer.sh` sort en 3 à
// ses deux contrôles, `sujet.sh fusionner` en 11, jamais sautées en 7 comme une lecture illisible (ticket 75, décision 2).
test("régime 8, de bout en bout : `meme-contenu.sh` sorti en 69 (git 2.40) arrête `passer.sh` en 3 à ses deux contrôles et `sujet.sh fusionner` en 11, la cause dite, jamais sautée en 7", () => {
  const vrai = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).stdout.trim();
  const git240 = (d) => {
    writeFileSync(join(d.racine, "bin", "git"), `#!/bin/sh\nif [ "$1" = version ]; then echo "git version 2.40.1"; exit 0; fi\nexec ${JSON.stringify(vrai)} "$@"\n`);
    chmodSync(join(d.racine, "bin", "git"), 0o755);
  };
  const cause = /revue du capitaine en échec : meme-contenu\.sh : un outil de la chaîne manque au poste \(sortie 69\) : git ≥ 2\.41 requis, ici 2\.40/;
  // Premier contrôle : un tour validé sur un sommet plus ancien, puis un commit de l'auteur.
  const p = monter();
  versDevelop(p);
  p.branche("feat/a", "feat/a", { "docs/a2.md": "a2\n" }, "docs(a): suite");
  p.git("switch", "-q", "--detach", "origin/develop");
  git240(p);
  const r1 = passer(p);
  assert.equal(r1.status, 3, r1.stdout + r1.stderr);
  assert.match(r1.stdout + r1.stderr, /revue du capitaine en échec \(sortie 3\) : /);
  assert.match(r1.stdout + r1.stderr, cause);
  // Second contrôle : develop a bougé, le capitaine met la PR à jour, puis relit le verdict sur son sommet.
  const s = monter();
  versDevelop(s);
  s.branche("develop", "origin/develop", { "docs/b.md": "b\n" });
  s.git("switch", "-q", "--detach", "origin/develop");
  git240(s);
  const r2 = passer(s);
  assert.equal(r2.status, 3, r2.stdout + r2.stderr);
  assert.match(r2.stdout + r2.stderr, /revue du capitaine en échec avant la fusion \(sortie 3\) : /);
  assert.match(r2.stdout + r2.stderr, cause);
  // `sujet.sh fusionner`, une sous-PR en retard : mise à jour, puis le second contrôle.
  const u = monter();
  versSujet(u, { retard: true });
  git240(u);
  const r3 = fusionner(u);
  assert.equal(r3.status, 11, r3.stdout + r3.stderr);
  assert.match(r3.stdout + r3.stderr, /#80 : revue du capitaine en échec \(sortie 3 : /);
  assert.match(r3.stdout + r3.stderr, cause);
  assert.deepEqual([...fusions(p), ...fusions(s), ...fusions(u)], []);
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

// ── Éligibilité avant la CI (ticket 105, A-243, A-256) ─────────────────────────────────────────────────────────────
// `passer.sh --eligibilite` et `sujet.sh fusionner --eligibilite` jouent ce qui précède le verrou, sans rien écrire ; la
// boucle les joue une fois par sommet sur une PR « CI en cours » (la sous-PR qui tient ou prend son sujet), et avant de
// relancer une CI rouge. Le faux GitHub journalise toute écriture : aucune ne doit venir de l'option.
const eligibiliteDe = (r, n) => [...r.stdout.matchAll(new RegExp(`^\\[#${n}\\] éligibilité avant la CI : sortie (\\d+)`, "gm"))].map((m) => Number(m[1]));

test("régime 8, passer.sh --eligibilite : sans tour validé pour le sommet, sortie 4 et le motif ; validé, 0 ; aucune écriture (ni commentaire, ni label, ni push, ni verrou)", () => {
  const d = monter();
  const sha = versDevelop(d, { fil: () => [] });
  const r = d.lancer(PASSER, "--eligibilite", "30");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /aucun tour de relecture validé pour le contenu de ce sommet \(/);
  assert.deepEqual(d.journal(), [], "aucune écriture sur GitHub");
  assert.equal(d.git("rev-parse", "origin/feat/a"), sha, "aucun push");
  const ok = monter();
  const avant = versDevelop(ok);
  const r2 = ok.lancer(PASSER, "--eligibilite", "30");
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.match(dernier(r2), /éligibilité avant la CI : régime 8, éligible au sommet /);
  assert.deepEqual(ok.journal(), [], "aucune écriture sur GitHub, verrou compris");
  assert.equal(ok.git("rev-parse", "origin/feat/a"), avant, "aucun push");
  assert.deepEqual(fusions(ok), []);
});

test("régime 7 (sans la clé, ou PR ouverte avant `depuis`) et régime illisible, passer.sh --eligibilite : sortie 0, les commentaires jamais lus", () => {
  const cas = [
    [{ cheminsSensibles: [] }, {}, "7"],
    [CONTRAT, { created_at: "2026-11-17T08:59:00Z" }, "7"],
    [{ relecture: { depuis: "jamais" } }, {}, "illisible"],
  ];
  for (const [contrat, plus, regime] of cas) {
    const d = monter(contrat);
    // Sans section de revue et sans verdict : un jugement les refuserait. La route des commentaires en panne : une lecture
    // sortirait en 5.
    versDevelop(d, { fichiers: { "scripts/x.sh": "echo x\n" }, titre: "feat(x): x", fil: () => [], plus, autres: { pannes: [{ route: "^issues/30/comments", fois: 2 }] } });
    const r = d.lancer(PASSER, "--eligibilite", "30");
    assert.equal(r.status, 0, `${JSON.stringify(contrat)} : ${r.stdout}${r.stderr}`);
    assert.equal(dernier(r).includes(`éligibilité avant la CI : régime ${regime}, rien à juger avant le passage`), true, dernier(r));
    assert.equal(d.etat().pannes?.length, 1, "la panne des commentaires n'a pas été consommée");
    assert.deepEqual(d.journal(), []);
  }
});

test("régime 8, passer.sh --eligibilite : une livraison de sujet, dispensée de la revue, est renvoyée en 4 pour une migration plus ancienne que develop", () => {
  const dossier = "apps/api/src/db/migrations";
  const d = monter({ ...CONTRAT, migrations: `${dossier}/` });
  d.git("switch", "-q", "-C", "sujet/lot", "origin/develop");
  d.ecrire(`${dossier}/202611281000-lot.ts`, "// lot\n");
  d.commit("feat(db): lot");
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/lot");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.ecrire(`${dossier}/202612011000-livree.ts`, "// livrée\n");
  d.commit("chore: develop");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "IN_PROGRESS" } },
    pulls: [{ number: 30, title: "feat(lot): lot", head: "sujet/lot", base: "develop", labels: ["à-fusionner"], commentaires: [] }],
  });
  const r = d.lancer(PASSER, "--eligibilite", "30");
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /202611281000-lot\.ts.*202612011010-lot\.ts/);
  assert.deepEqual(d.journal(), []);
});

test("régime 8, sujet.sh fusionner --eligibilite : sous-PR sans tour validé, sortie 4 ; sans CAPITAINE_ID, rien de refusé ; aucune écriture", () => {
  const d = monter();
  const sha = versSujet(d, { fil: () => [] });
  const sansId = (j) => spawnSync("bash", [SUJET, "fusionner", "--eligibilite", "80"], { cwd: j.travail, env: Object.fromEntries(Object.entries(j.env).filter(([c]) => c !== "CAPITAINE_ID")), encoding: "utf8" });
  const r = sansId(d);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match(dernier(r), /^#80 aucun tour de relecture validé pour le contenu de ce sommet/);
  assert.deepEqual(d.journal(), [], "aucune écriture sur GitHub");
  assert.equal(d.git("rev-parse", "origin/docs/sous"), sha);
  const ok = monter();
  versSujet(ok);
  const r2 = sansId(ok);
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.match(dernier(r2), /^#80 : éligibilité avant la CI : régime 8, éligible au sommet /);
  assert.deepEqual(ok.journal(), []);
  assert.deepEqual(fusions(ok), []);
});

// Le jouet de la boucle en régime 8 (comme le banc de la boucle plus haut) : la chaîne et ses calculs sur develop.
function monterBoucle(contrat = CONTRAT) {
  const d = monter(contrat);
  d.publierChaine();
  for (const nom of ["decision-relecteur.mjs", "verdict.mjs", "double-relecture.mjs", "meme-contenu.sh"]) d.ecrire(`scripts/chaine/${nom}`, readFileSync(scriptDe("fusionner", nom), "utf8"));
  d.ecrire("scripts/chaine/chemins-sensibles.mjs", readFileSync(scriptDe("revue-adversariale", "chemins-sensibles.mjs"), "utf8"));
  d.commit("chore(chaine): calculs");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  return d;
}
// Sous-PR de `sujet/lot`, CI en cours sur tout commit. `perimees` : numéros dont le verdict porte sur un commit plus
// ancien de leur branche (un push après le verdict) ; `sans` : numéros sans verdict.
function sousPrEnCours(d, numeros, { perimees = [], sans = [] } = {}) {
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  const pulls = [];
  const sommets = {};
  for (const n of numeros) {
    const premier = d.branche(`docs/pr-${n}`, "origin/sujet/lot", { [`docs/pr-${n}.md`]: `${n}\n` });
    sommets[n] = perimees.includes(n) ? d.branche(`docs/pr-${n}`, `origin/docs/pr-${n}`, { [`docs/pr-${n}.md`]: `${n} bis\n` }) : premier;
    const fil = sans.includes(n) ? [] : valide(premier);
    pulls.push({ number: n, title: `docs(lot): pr ${n}`, head: `docs/pr-${n}`, base: "sujet/lot", labels: ["à-fusionner"], commentaires: fil });
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks: { "*": { qualite: "IN_PROGRESS" } }, pulls });
  return sommets;
}
const tourDeBoucle = (d) => {
  const r = d.lancer(scriptDe("fusionner", "boucle.sh"));
  assert.match(r.stdout, /FILE VIDE/, r.stdout + r.stderr);
  return r;
};
const labelsDe = (d, n) => d.etat().pulls.find((p) => p.number === n).labels;

test("boucle.sh, régime 8 : la sous-PR « CI en cours » au verdict périmé qui tient son sujet est renvoyée au premier tour ; l'autre, qui attendait, prend le sujet et n'est contrôlée qu'ensuite", () => {
  const d = monterBoucle();
  sousPrEnCours(d, [80, 81], { perimees: [80] });
  const r = tourDeBoucle(d);
  assert.deepEqual(eligibiliteDe(r, 80), [4], r.stdout);
  assert.match(r.stdout, /^\[#80\] éligibilité avant la CI : sortie 4 : #80 aucun tour de relecture validé pour le contenu de ce sommet/m);
  assert.match(r.stdout, /^\[#80\] RENVOI : #80 aucun tour de relecture validé/m);
  assert.deepEqual(labelsDe(d, 80), ["fusion-bloquée"]);
  // #81 attendait : aucune ligne d'éligibilité avant le renvoi de #80 ; le sujet rendu, elle le prend et est contrôlée.
  const renvoi = r.stdout.indexOf("[#80] RENVOI");
  const avantRenvoi = r.stdout.slice(0, renvoi);
  assert.doesNotMatch(avantRenvoi, /^\[#81\] éligibilité avant la CI/m);
  assert.deepEqual(eligibiliteDe(r, 81), [0], r.stdout);
  assert.match(r.stdout, /^\[sujet\/lot\] tenu par #81 \(CI en cours\)$/m);
  assert.deepEqual(labelsDe(d, 81), ["à-fusionner"]);
});

test("boucle.sh, régime 8 : seule la sous-PR qui tient son sujet est contrôlée ; au second tour, même sommet, aucun contrôle ; après un push, un contrôle", () => {
  const d = monterBoucle();
  sousPrEnCours(d, [80, 81], { sans: [81] });
  let r = tourDeBoucle(d);
  assert.deepEqual(eligibiliteDe(r, 80), [0], r.stdout);
  assert.match(r.stdout, /^\[#81\] attend son tour : #80 passe d'abord dans sujet\/lot$/m);
  assert.deepEqual(eligibiliteDe(r, 81), [], "celle qui attend n'est pas lue");
  assert.deepEqual(labelsDe(d, 81), ["à-fusionner"], "ni renvoyée");
  r = tourDeBoucle(d);
  assert.deepEqual(eligibiliteDe(r, 80), [], `même sommet : aucun contrôle de plus\n${r.stdout}`);
  // Un push de l'auteur après le verdict : sommet neuf, contrôlé, renvoyé.
  d.branche("docs/pr-80", "origin/docs/pr-80", { "docs/pr-80.md": "80 ter\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  r = tourDeBoucle(d);
  assert.deepEqual(eligibiliteDe(r, 80), [4], r.stdout);
  assert.deepEqual(labelsDe(d, 80), ["fusion-bloquée"]);
});

test("boucle.sh, régime 8 : sommet illisible (`pulls/<n>` en panne) : aucun contrôle, rien de noté ; au tour suivant, le contrôle", () => {
  const d = monterBoucle();
  sousPrEnCours(d, [80], { perimees: [80] });
  d.github({ pannes: [{ route: "^pulls/80$", fois: 1 }] });
  let r = tourDeBoucle(d);
  assert.deepEqual(eligibiliteDe(r, 80), [], r.stdout);
  assert.deepEqual(labelsDe(d, 80), ["à-fusionner"]);
  r = tourDeBoucle(d);
  assert.deepEqual(eligibiliteDe(r, 80), [4], r.stdout);
  assert.deepEqual(labelsDe(d, 80), ["fusion-bloquée"]);
});

test("boucle.sh, régime 8 : une PR « CI rouge » sans tour validé est renvoyée pour son verdict, ses jobs jamais relancés", () => {
  const d = monterBoucle();
  d.branche("feat/a", "origin/develop", { "docs/a.md": "a\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "FAILURE" } },
    runs: { "#30": [{ id: 7, conclusion: "failure", run_attempt: 1 }] },
    pulls: [{ number: 30, title: "docs(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], commentaires: [] }],
  });
  const r = tourDeBoucle(d);
  assert.deepEqual(eligibiliteDe(r, 30), [4], r.stdout);
  assert.match(r.stdout, /^\[#30\] RENVOI : aucun tour de relecture validé pour le contenu de ce sommet/m);
  assert.doesNotMatch(r.stdout, /\[#30\] RELANCE/);
  assert.ok(!d.journal().some((e) => /rerun-failed-jobs$/.test(e.route)), "aucune relance des jobs");
  assert.deepEqual(labelsDe(d, 30), ["fusion-bloquée"]);
});

test("boucle.sh, régime 7 : une PR « CI en cours » sans section de revue n'est ni contrôlée ni renvoyée ; une CI rouge est relancée comme avant", () => {
  const d = monterBoucle(null);
  const a = d.branche("feat/a", "origin/develop", { "scripts/a.sh": "echo a\n" });
  d.branche("feat/b", "origin/develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { [a]: { qualite: "IN_PROGRESS" }, "*": { qualite: "FAILURE" } },
    runs: { "#31": [{ id: 7, conclusion: "failure", run_attempt: 1 }] },
    pulls: [
      { number: 30, title: "feat(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], commentaires: [] },
      { number: 31, title: "docs(b): b", head: "feat/b", base: "develop", labels: ["à-fusionner"], commentaires: [] },
    ],
  });
  const r = tourDeBoucle(d);
  assert.doesNotMatch(r.stdout, /éligibilité avant la CI/, r.stdout);
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.match(r.stdout, /^\[#31\] RELANCE des jobs rouges/m);
  assert.ok(d.journal().some((e) => e.route === "actions/runs/7/rerun-failed-jobs"), "jobs relancés");
  assert.deepEqual(labelsDe(d, 30), ["à-fusionner"]);
});

// Le faux `gh` : tout va au faux GitHub ; la lecture des runs laisse un témoin, et, le témoin présent, la lecture de
// `pulls/30` tombe en 502 une fois (le témoin est retiré : les lectures suivantes, celles de la file, passent). La lecture fautive est celle qui suit les runs, quel que soit le nombre de lectures avant elle.
function pannePrApresLesRuns(d) {
  Object.assign(d.env, { BANC_FAUX_GH: scriptDe("sujet", "faux-gh.mjs") });
  writeFileSync(
    join(d.racine, "bin/gh"),
    '#!/bin/sh\ncase "$*" in *"-X "*) ;; *actions/runs?*) touch "$FAUX_GH/runs-lus" ;; *pulls/30) if [ -e "$FAUX_GH/runs-lus" ]; then rm -f "$FAUX_GH/runs-lus"; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n',
  );
}

test("boucle.sh, régime 8 : une PR « CI rouge » illisible après la lecture des runs n'est ni relancée ni renvoyée, et le journal le dit", () => {
  const d = monterBoucle();
  d.branche("feat/a", "origin/develop", { "docs/a.md": "a\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "FAILURE" } },
    runs: { "#30": [{ id: 7, conclusion: "failure", run_attempt: 1 }] },
    pulls: [{ number: 30, title: "docs(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], commentaires: [] }],
  });
  pannePrApresLesRuns(d);
  const r = tourDeBoucle(d);
  assert.match(r.stdout, /^\[#30\] PR illisible avant la relance de ses jobs rouges \(cause ci-dessus\) : ni relance ni renvoi, reprise au tour suivant$/m);
  assert.doesNotMatch(r.stdout, /\[#30\] RELANCE|RENVOI/);
  assert.ok(!d.journal().some((e) => /rerun-failed-jobs$/.test(e.route)), "aucune relance des jobs");
  assert.deepEqual(labelsDe(d, 30), ["à-fusionner"]);
});

test("boucle.sh, régime 7 : une PR « CI rouge » illisible après la lecture des runs n'est pas relancée, et le journal le dit", () => {
  const d = monterBoucle(null);
  d.branche("feat/a", "origin/develop", { "docs/a.md": "a\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { "*": { qualite: "FAILURE" } },
    runs: { "#30": [{ id: 7, conclusion: "failure", run_attempt: 1 }] },
    pulls: [{ number: 30, title: "docs(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], commentaires: [] }],
  });
  pannePrApresLesRuns(d);
  const r = tourDeBoucle(d);
  assert.match(r.stdout, /^\[#30\] PR illisible avant la relance de ses jobs rouges/m);
  assert.doesNotMatch(r.stdout, /\[#30\] RELANCE|RENVOI/);
  assert.ok(!d.journal().some((e) => /rerun-failed-jobs$/.test(e.route)), "aucune relance des jobs");
  assert.deepEqual(labelsDe(d, 30), ["à-fusionner"]);
});
