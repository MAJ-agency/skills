// Banc du lot 5c (relecture indépendante) : les renvois et les messages suivent le régime de la PR (A-97). En régime 8,
// `renvoyer.sh` dit de redemander la relecture (`à-relire`), jamais de remettre `à-fusionner` (A-91, A-93) ; `sujet.sh
// demarrer` dit comment demander la relecture (son refus qui ne conseille plus `sujet.sh rafraichir` : sujet.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);
const { lireMarques } = await import(pathToFileURL(scriptDe("fusionner", "decision-relecteur.mjs")).href);
const { demande } = await import(pathToFileURL(scriptDe("fusionner", "demande.mjs")).href);

// Le message nomme la commande qui fabrique la demande, et la ligne que cette commande rend se lit comme une demande du
// Relecteur (`FORME_DEMANDE`), jamais comme une marque presque à la forme qui ferait sauter la PR à chaque passage.
const DEMANDE = "le commentaire que rend `node scripts/chaine/demande.mjs --session <ton id de session> --conducteur <celui de ton conducteur, — sans conducteur>`, copié tel quel, seul dans son commentaire (le script lit le sommet dans git et refuse un sommet non poussé)";
const demandeLue = (texte) => {
  assert.match(texte, /`node scripts\/chaine\/demande\.mjs --session <[^>]+> --conducteur <[^>]+>`/, `la commande est dite : ${texte}`);
  for (const conducteur of ["session_conducteur", "—"]) {
    const corps = demande({ sommet: "a".repeat(40), session: "session_auteur", conducteur });
    const m = lireMarques([{ id: 1, body: corps, created_at: "2026-11-17T12:00:00Z", updated_at: "2026-11-17T12:00:00Z", author_association: "OWNER" }]);
    assert.equal(m.demandes.length, 1, corps);
  }
};

const RENVOYER = scriptDe("fusionner", "renvoyer.sh");
const SUJET = scriptDe("sujet", "sujet.sh");
const HUIT = { cheminsSensibles: [], relecture: { depuis: "2026-11-17T09:00:00Z" } };
const contrat = (d, c) => {
  d.ecrire(".claude/chaine.json", `${JSON.stringify(c)}\n`);
  d.commit("chore: contrat");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
};
const commentaire = (d) => d.etat().pulls[0].commentaires.at(-1);
// Un espion sur `gh` : chaque appel, ses arguments, dans un journal ; rend la lecture de ce journal.
const espionner = (d) => {
  const bin = join(d.racine, "bin");
  const faux = readFileSync(join(bin, "gh"), "utf8").split("\n")[1];
  const journal = join(d.racine, "gh.log");
  writeFileSync(join(bin, "gh"), `#!/bin/sh\necho "$*" >> ${JSON.stringify(journal)}\n${faux}\n`);
  return () => (existsSync(journal) ? readFileSync(journal, "utf8").split("\n").filter(Boolean) : []);
};

test("renvoyer.sh : en régime 8, redemander la relecture (`à-relire`) sans retirer `fusion-bloquée`, jamais `à-fusionner` ; en régime 7, comme avant", () => {
  for (const [c, plus, attendu, absent] of [
    [HUIT, {}, new RegExp(`Corriger, puis redemander la relecture : ${DEMANDE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} ; puis l'étiquette \`à-relire\`, sans retirer \`fusion-bloquée\` ; jamais \`à-fusionner\``), /remettre `à-fusionner`/],
    [HUIT, { created_at: "2026-11-17T08:00:00Z" }, /Corriger, puis retirer `fusion-bloquée` et remettre `à-fusionner`/, /à-relire/],
    [{ cheminsSensibles: [] }, {}, /Corriger, puis retirer `fusion-bloquée` et remettre `à-fusionner`/, /à-relire/],
  ]) {
    const d = depotJouet();
    contrat(d, c);
    d.branche("feat/a", "origin/develop", { "docs/a.md": "a\n" });
    d.github({ pulls: [{ number: 30, title: "docs(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], ...plus }] });
    const appels = espionner(d);
    const r = d.lancer(RENVOYER, "30", "aucun tour de relecture validé");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    // Sans la clé nulle part (A-186) : aucune lecture de la PR de plus que sur main (la seule est celle de `head.ref`, à la fin).
    const lectures = appels().filter((l) => /\/pulls\/30$/.test(l)).length;
    assert.equal(lectures, Object.hasOwn(c, "relecture") ? 1 : 0, `lectures de la PR pour son régime : ${JSON.stringify(plus)}`);
    assert.match(commentaire(d), attendu, JSON.stringify(plus));
    assert.doesNotMatch(commentaire(d), absent);
    assert.deepEqual(d.etat().pulls[0].labels, ["fusion-bloquée"]);
    if (Object.hasOwn(c, "relecture") && !plus.created_at) demandeLue(commentaire(d));
  }
});

test("renvoyer.sh : une réception de develop en deux fusions, en régime 8, fait ouvrir une nouvelle PR qui demande sa relecture", () => {
  const d = depotJouet();
  contrat(d, HUIT);
  d.branche("maj/lot", "origin/develop", { "docs/a.md": "a\n" });
  d.github({ pulls: [{ number: 81, title: "chore(sujet): met lot à jour avec develop", head: "maj/lot", base: "develop", labels: ["à-fusionner"] }] });
  const r = d.lancer(RENVOYER, "81", "#81, PR de mise à jour : une seule fusion de develop, jamais une seconde fusion");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(commentaire(d), /la nouvelle PR demande sa relecture, le commentaire que rend `node scripts\/chaine\/demande\.mjs --session <ton id de session> --conducteur <celui de ton conducteur, — sans conducteur>`, copié tel quel, seul dans son commentaire .* ; puis l'étiquette `à-relire`, jamais `à-fusionner`/);
  demandeLue(commentaire(d));
});

// Un sujet `demo`, sa spec (qui le déclare) et un ticket, sur develop et sur le sujet ; le contrat de develop.
function sujetDemo(c) {
  const d = depotJouet();
  d.ecrire("docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md", "# SPEC_ALL_DEM-1\n\nSujet: sujet/demo\n");
  d.ecrire("docs/features/demo/all/issues/SPEC_ALL_DEM-1-demo.01.issue.md", "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.ecrire(".claude/chaine.json", `${JSON.stringify(c)}\n`);
  d.commit("docs: specs");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/demo");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-1-01-travail", "origin/develop");
  return d;
}

test("sujet.sh demarrer : en régime 8, demander la relecture, jamais `à-fusionner` ; en régime 7, l'étiquette dès le push", () => {
  const huit = sujetDemo(HUIT);
  const r = huit.lancer(SUJET, "demarrer", "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /régime 8 : relecture indépendante ; le dernier push fait, PR hors brouillon, demander la relecture : le commentaire .* ; puis l'étiquette à-relire,\njamais à-fusionner : le Relecteur la pose sur un verdict validé, puis le capitaine la fusionne dans sujet\/demo/);
  assert.doesNotMatch(r.stdout, /label à-fusionner dès le push/);
  demandeLue(r.stdout);
  const sept = sujetDemo({ cheminsSensibles: [] });
  const r2 = sept.lancer(SUJET, "demarrer", "SPEC_ALL_DEM-1.01");
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.match(r2.stdout, /label à-fusionner dès le push/);
});

test("sujet.sh demarrer : le régime se lit sur la base de la PR — un sujet sans la clé reste en 7 quand develop l'a ; un ticket sans sujet, en régime 8, demande aussi la relecture", () => {
  const d = sujetDemo({ cheminsSensibles: [] });
  // develop prend la clé ; le sujet, parti avant, ne l'a pas encore (il la reçoit avec develop).
  d.git("switch", "-q", "--detach", "origin/develop");
  d.ecrire(".claude/chaine.json", `${JSON.stringify(HUIT)}\n`);
  d.commit("chore: la clé");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-C", "feat/spec-all-dem-1-01-travail", "origin/sujet/demo");
  const r = d.lancer(SUJET, "demarrer", "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /label à-fusionner dès le push/);
  assert.doesNotMatch(r.stdout, /régime 8/);
  // Un ticket dont ni lui ni sa spec ne déclarent de sujet : la PR vise develop, en régime 8.
  const s = depotJouet();
  s.ecrire("docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md", "# SPEC_ALL_DEM-1\n");
  s.ecrire("docs/features/demo/all/issues/SPEC_ALL_DEM-1-demo.01.issue.md", "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  s.ecrire(".claude/chaine.json", `${JSON.stringify(HUIT)}\n`);
  s.commit("docs: specs");
  s.git("push", "-q", "origin", "HEAD:develop");
  s.git("fetch", "-q", "origin");
  s.git("switch", "-q", "-c", "feat/spec-all-dem-1-01-travail", "origin/develop");
  const r2 = s.lancer(SUJET, "demarrer", "SPEC_ALL_DEM-1.01");
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.match(r2.stdout, /la PR vise develop\.[\s\S]*régime 8 : relecture indépendante ; .*\njamais à-fusionner : le Relecteur la pose sur un verdict validé, puis le capitaine la fusionne dans develop/);
  demandeLue(r2.stdout);
});

test("renvoyer.sh : une PR empilée se lit sur develop, où elle sera reciblée ; une sous-PR d'un sujet qui porte seul la clé est en régime 8", () => {
  const d = depotJouet();
  contrat(d, HUIT);
  d.branche("feat/parente", "origin/develop", { "docs/p.md": "p\n" });
  d.branche("feat/fille", "origin/feat/parente", { "docs/f.md": "f\n" });
  d.github({ pulls: [{ number: 30, title: "docs(f): f", head: "feat/fille", base: "feat/parente", labels: ["à-fusionner"] }] });
  const r = d.lancer(RENVOYER, "30", "PR empilée sur feat/parente en régime 8 : la recibler sur develop, puis demander sa relecture");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(commentaire(d).includes(`Corriger, puis redemander la relecture : ${DEMANDE}`), commentaire(d));
  assert.doesNotMatch(commentaire(d), /remettre `à-fusionner`/);
  // La clé sur le seul sujet (develop ne l'a pas) : une sous-PR de ce sujet est en régime 8.
  const s = depotJouet();
  contrat(s, { cheminsSensibles: [] });
  s.git("switch", "-q", "--detach", "origin/develop");
  s.ecrire(".claude/chaine.json", `${JSON.stringify(HUIT)}\n`);
  s.commit("chore: la clé sur le sujet");
  s.git("push", "-q", "origin", "HEAD:refs/heads/sujet/lot");
  s.git("fetch", "-q", "origin");
  s.branche("docs/sous", "origin/sujet/lot", { "docs/s.md": "s\n" });
  s.github({ pulls: [{ number: 80, title: "docs(s): s", head: "docs/sous", base: "sujet/lot", labels: ["à-fusionner"] }] });
  const r2 = s.lancer(RENVOYER, "80", "aucun tour de relecture validé");
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.ok(commentaire(s).includes(`Corriger, puis redemander la relecture : ${DEMANDE}`), commentaire(s));
});

// Ticket 106 (A-244, A-256 (3), A-227, A-236) : en régime 8, le renvoi nomme les deux sessions de la dernière demande
// `À relire` intacte ; le worktree propriétaire reste le chemin du régime 7.
const ASSOCIE = "OWNER";
const T = (h) => `2026-11-17T${h}:00:00Z`;
const lecture = (corps, h, plus = {}) => ({ body: corps, created_at: T(h), updated_at: T(h), association: ASSOCIE, ...plus });
const unRenvoi = (commentaires, { contratD = HUIT, pannes } = {}) => {
  const d = depotJouet();
  contrat(d, contratD);
  d.branche("feat/a", "origin/develop", { "docs/a.md": "a\n" });
  d.github({ pulls: [{ number: 30, title: "docs(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], commentaires }], ...(pannes ? { pannes } : {}) });
  const r = d.lancer(RENVOYER, "30", "aucun tour de relecture validé");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return { d, sortie: r.stdout };
};
const sha = "a".repeat(40);

test("renvoyer.sh : en régime 8, deux demandes intactes, la seconde fait foi : sa session et son conducteur, plus de ligne du worktree", () => {
  const { sortie, d } = unRenvoi([
    lecture(demande({ sommet: sha, session: "session_premiere", conducteur: "session_chefun" }), "10"),
    lecture(demande({ sommet: sha, session: "session_seconde", conducteur: "session_chefdeux" }), "11"),
  ]);
  assert.match(sortie, /\[#30\] session de la demande : session_seconde\n/);
  assert.match(sortie, /\[#30\] conducteur de la demande : session_chefdeux\n/);
  assert.doesNotMatch(sortie, /worktree propriétaire/);
  assert.deepEqual(d.etat().pulls[0].labels, ["fusion-bloquée"]);
});

test("renvoyer.sh : en régime 8, la seule demande modifiée ne nomme personne : — et —, et la ligne « aucune demande »", () => {
  const { sortie } = unRenvoi([lecture(demande({ sommet: sha, session: "session_a", conducteur: "session_c" }), "10", { updated_at: T("11") })]);
  assert.match(sortie, /\[#30\] session de la demande : —\n/);
  assert.match(sortie, /\[#30\] conducteur de la demande : —\n/);
  assert.match(sortie, /\[#30\] aucune demande À relire intacte sur la PR : prévenir le conducteur du chantier, sinon son lanceur\n/);
  assert.doesNotMatch(sortie, /worktree propriétaire/);
});

test("renvoyer.sh : en régime 8, une marque presque à la forme n'empêche pas de nommer la demande intacte (mode tolérant)", () => {
  const { sortie } = unRenvoi([
    lecture(demande({ sommet: sha, session: "session_a", conducteur: "session_c" }), "10"),
    lecture("À relire — pas à la forme de la demande", "11"),
  ]);
  assert.match(sortie, /\[#30\] session de la demande : session_a\n/);
  assert.match(sortie, /\[#30\] conducteur de la demande : session_c\n/);
  assert.doesNotMatch(sortie, /illisible/);
});

test("renvoyer.sh : en régime 8, `Conducteur: —` : la ligne du conducteur dit —", () => {
  const { sortie } = unRenvoi([lecture(demande({ sommet: sha, session: "session_a", conducteur: "—" }), "10")]);
  assert.match(sortie, /\[#30\] session de la demande : session_a\n/);
  assert.match(sortie, /\[#30\] conducteur de la demande : —\n/);
});

test("renvoyer.sh : GitHub en panne sur les commentaires, régime 8 : renvoi posé, ligne « demande illisible » ; régime 7 : la ligne du worktree, aucune lecture", () => {
  const pannes = [{ route: "^issues/30/comments", fois: 6 }];
  const huit = unRenvoi([], { pannes });
  assert.match(huit.sortie, /\[#30\] demande illisible \(.+\) : prévenir le conducteur du chantier, sinon son lanceur\n/);
  assert.doesNotMatch(huit.sortie, /worktree propriétaire/);
  assert.deepEqual(huit.d.etat().pulls[0].labels, ["fusion-bloquée"]);
  assert.match(huit.d.etat().pulls[0].commentaires.at(-1).body ?? huit.d.etat().pulls[0].commentaires.at(-1), /Renvoyée par le capitaine de fusion/);
  const sept = unRenvoi([], { contratD: { cheminsSensibles: [] }, pannes });
  assert.match(sept.sortie, /\[#30\] worktree propriétaire : /);
  assert.doesNotMatch(sept.sortie, /demande/);
});
